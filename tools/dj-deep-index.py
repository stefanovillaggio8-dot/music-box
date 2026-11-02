#!/usr/bin/env python3
"""Music Box deep DJ index: analysis of real MP3 waveform, not filenames.
Runs in bounded batches on GitHub Actions. Never edits audio or uploads PCM.
Output is lightweight versioned musical metadata used by the browser DJ.
"""
import argparse, datetime as dt, json, os, pathlib, tempfile, urllib.parse, urllib.request
import numpy as np
import librosa

ROOT = pathlib.Path(__file__).resolve().parents[1]
DEST = ROOT / "dj-deep-analysis.json"
SOURCES = [("stefanovillaggio8-dot/music-box-brani", "main"),
           ("stefanovillaggio8-dot/music-box", "mobile-audio"),
           ("stefanovillaggio8-dot/music-box", "main")]
VERSION = 1
SR = 11025
HOP = 512
def fetch(url, timeout=45):
    req=urllib.request.Request(url,headers={"User-Agent":"MusicBox-DJ-Analyzer/1.0",
        **({"Authorization":"Bearer "+os.environ["GITHUB_TOKEN"]} if "api.github.com" in url and os.environ.get("GITHUB_TOKEN") else {})})
    with urllib.request.urlopen(req,timeout=timeout) as r:
        return r.read()
def catalog():
    result={}
    for name,branch in SOURCES:
        api=f"https://api.github.com/repos/{name}/git/trees/{branch}?recursive=1"
        try:
            tree=json.loads(fetch(api))
            if tree.get("truncated"): raise RuntimeError("Git tree truncated")
            for row in tree.get("tree",[]):
                path=row.get("path","")
                if row.get("type")!="blob" or not path.startswith("songs/") or not path.lower().endswith(".mp3"):
                    continue
                if row.get("size",0)<8192 or row.get("size",0)>24000000:continue
                # A normalized key, prefer main repository for its own imports.
                key= ("audio/" if "music-box-brani" in name else "mobile/" if branch=="mobile-audio" else "app/")+path
                result[key]={"sha":row["sha"],"size":row["size"],"repo":name,"branch":branch,"path":path}
        except Exception as error:
            print(f"WARN catalog {name}:{branch}: {error}",flush=True)
    if not result:raise RuntimeError("No audio repository could be enumerated")
    return result
def envelope(samples):
    step=int(SR*.10)
    x=np.pad(samples,(0,(-len(samples))%step))
    return np.sqrt(np.mean(x.reshape(-1,step)**2,axis=1)).astype(float)
def chroma(samples):
    if len(samples)<SR:return None
    matrix=librosa.feature.chroma_stft(y=np.asarray(samples,dtype=np.float32),
             sr=SR,n_fft=2048,hop_length=HOP)
    v=np.mean(matrix,axis=1)
    if not np.isfinite(v).all() or np.sum(v)<=1e-8:return None
    return [round(float(i),5) for i in (v/np.sum(v))]
def timeline(samples,first,last,from_end=False):
    out=[]
    for offset in [.65,1.65,2.65,3.65,4.65,5.65]:
        at=last-offset if from_end else first+offset
        if at-.60<first or at+.60>last:continue
        a=int((at-.6)*SR);b=int((at+.6)*SR)
        c=chroma(samples[a:b])
        if c is not None:out.append({"offset":offset,"notes":c})
    return out
def groove(rms,bpm,at,end_aligned=False):
    if not 55<=bpm<=210:return None
    span=8*60/bpm
    first=at-span if end_aligned else at
    if first<0 or first+span>len(rms)*.1+.15:return None
    points=[rms[min(len(rms)-1,int((first+(i+.5)*span/32)/.1))] for i in range(32)]
    mean=float(np.mean(points));std=float(np.std(points))
    if mean<.003 or std<mean*.13:return None
    return [round(float(np.clip((x-mean)/std,-3,3)),4) for x in points]
def analyze(mp3):
    y,sr=librosa.load(str(mp3),sr=SR,mono=True)
    if len(y)<SR*26 or len(y)>SR*900:raise ValueError("duration out of range")
    duration=len(y)/SR
    rms=envelope(y)
    typical=float(np.percentile(rms,90))
    gate=float(np.clip(typical*.075,.0015,.020))
    active=rms>gate
    valid=np.convolve(active.astype(int),np.ones(3,dtype=int),mode="same")
    idx=np.flatnonzero(valid>=2)
    if typical<.002 or idx.size==0:raise ValueError("too quiet")
    first=max(0.,float(idx[0]*.1-.1))
    last=min(duration,float((idx[-1]+1)*.1))
    level=float(np.percentile(rms[active],65))
    leading=max(0.,first); trailing=max(0.,duration-last)
    # Strong last hit and residual tail: no full-energy end may be cut.
    lo=max(0,int((last-17)/.1)); hi=min(len(rms),int(last/.1))
    last_strong=next((i for i in range(hi-1,lo-1,-1) if rms[i]>=max(.004,level*.61)),None)
    release=None
    if last_strong is not None:
        quiet=rms[last_strong+1:hi]
        start=(last_strong+1)*.1+.30
        if 2.15<=last-start<=12 and quiet.size>=20 and np.max(quiet)<=level*.48 and np.mean(quiet)<=level*.29:
            release={"lastImpactAt":round(last_strong*.1,3),"releaseAt":round(start,3),
                     "seconds":round(last-start,3),"quietLevel":round(float(np.mean(quiet)/level),4),
                     "score":round(float(1-np.mean(quiet)/level),4)}
    closing=rms[max(0,int((last-2.2)/.1)):min(len(rms),int(last/.1))]
    protected=bool(closing.size>=14 and np.mean(closing>=level*.62)>=.36)
    # Exclude one short boundary frame from the strict digital-silence
    # certificate; the last audible frame may overlap the 100ms RMS bin.
    # Still verify all remaining frames, including any later comeback.
    after=rms[min(len(rms),int((last+.20)/.1)):]
    confident=bool(trailing>=1.65 and after.size>=12 and np.max(after)<=max(.0009,typical*.025))
    pre=rms[:int(first/.1)]
    safe_intro=max(0,first-.12) if first>=.85 and pre.size>=5 and np.max(pre)<=max(.0007,typical*.018) else 0.
    attack=rms[int(safe_intro/.1):min(len(rms),int((safe_intro+4.6)/.1))]
    drive=float(np.clip((np.mean(attack)/level)*.60+np.mean(attack>=level*.28)*.40,0,1)) if attack.size>=8 else 0.
    # Onset envelope is evaluated on real audio, not player metadata.
    onset=librosa.onset.onset_strength(y=y,sr=SR,hop_length=HOP)
    tempo,beats=librosa.beat.beat_track(onset_envelope=onset,sr=SR,hop_length=HOP,trim=False)
    bpm=float(np.asarray(tempo).reshape(-1)[0])
    if not 55<=bpm<=210:bpm=120.
    strength=float(np.clip((np.std(onset)/(np.mean(onset)+1e-7))*.24,0,1))
    onset_t=librosa.frames_to_time(np.arange(len(onset)),sr=SR,hop_length=HOP)
    start_hit=onset_t[(onset_t>=first)&(onset_t<=first+12)]
    end_hit=onset_t[(onset_t>=max(first,last-16))&(onset_t<last)]
    def peak_at(times):
        if times.size==0:return None
        ids=np.searchsorted(onset_t,times)
        ids=np.clip(ids,0,len(onset)-1)
        return round(float(times[np.argmax(onset[ids])]),3)
    firstbeat=peak_at(start_hit)
    beat_anchor=peak_at(end_hit)
    # Chord and groove signatures must precede the SILENT OUTRO: the
    # listener expects matching music, not two matching empty sections.
    musical_edge=release["releaseAt"] if release else last
    outro_start=max(first,musical_edge-10)
    to=min(duration,first+12)
    end_note=musical_edge
    c=chroma(y)
    out={"duration":round(duration,3),"first":round(first,3),"last":round(last,3),
      "trailing":round(trailing,3),"leading":round(leading,3),
      "bpm":round(bpm,2),"beatConfidence":round(strength,3),
      "beatAnchor":beat_anchor,"introBeat":firstbeat,"level":round(level,5),
      "chroma":c,"introChroma":chroma(y[:int(to*SR)]),
      "outroChroma":chroma(y[int(outro_start*SR):int(end_note*SR)]),
      "introAttackNotes":chroma(y[int(first*SR):int(min(duration,first+2.3)*SR)]),
      "outroFinalNotes":chroma(y[int(max(0,last-2.5)*SR):int(last*SR)]),
      "introPhraseNotes":chroma(y[int(first*SR):int(min(duration,first+6)*SR)]),
      "outroPhraseNotes":chroma(y[int(max(0,last-7)*SR):int(max(0,last-2)*SR)]),
      "introTimeline":timeline(y,first,min(duration,first+9)),
      "outroTimeline":timeline(y,max(0,last-9),last,True),
      "introGroove":groove(rms,bpm,safe_intro),
      "outroGroove":groove(rms,bpm,musical_edge,True),
      "introDrive":round(drive,4),"dropRelease":release,
      "protectedEnding":protected,"safeIntroAt":round(safe_intro,3),
      "safeOutroAt":release["releaseAt"] if release else None,
      "confidentTail":confident,"durationMismatch":False,
      "precomputed":True,"analyzer":"librosa-onsets-chroma-rms-v1"}
    return out
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--batch",type=int,default=30)
    args=ap.parse_args()
    if DEST.exists():
        try: index=json.loads(DEST.read_text(encoding="utf8"))
        except Exception:index={}
    else:index={}
    if index.get("version")!=VERSION:index={"version":VERSION,"entries":{}}
    entries=index.setdefault("entries",{})
    sources=catalog()
    now=dt.datetime.now(dt.timezone.utc)
    todo=[]
    for key,item in sorted(sources.items()):
        previous=entries.get(key,{})
        if previous.get("sha")==item["sha"] and previous.get("status")=="ok":continue
        if previous.get("sha")==item["sha"] and previous.get("status")=="failed":
            try:
                when=dt.datetime.fromisoformat(previous["checkedAt"])
                if (now-when).days<7:continue
            except (ValueError,KeyError):pass
        todo.append((key,item))
    if not todo and index.get("sourceCount")==len(sources):
        print(json.dumps({"sources":len(sources),"analyzed":len(sources),
                          "processedNow":0,"failuresNow":0,"remaining":0}),flush=True)
        return
    done=errors=0
    for key,item in todo[:max(1,min(75,args.batch))]:
        url=f'https://raw.githubusercontent.com/{item["repo"]}/{item["branch"]}/'+urllib.parse.quote(item["path"])
        temp=None
        try:
            data=fetch(url,timeout=90)
            if len(data)<8192 or len(data)>24000000:raise ValueError("Unexpected MP3 size")
            with tempfile.NamedTemporaryFile(suffix=".mp3",delete=False) as f:
                temp=f.name;f.write(data)
            measured=analyze(temp)
            entries[key]={"sha":item["sha"],"status":"ok","checkedAt":now.isoformat(),**measured}
            done+=1
        except Exception as error:
            entries[key]={"sha":item["sha"],"status":"failed","checkedAt":now.isoformat(),
                         "reason":str(error)[:150]}
            errors+=1
        finally:
            if temp and os.path.exists(temp):os.unlink(temp)
    # Only public audio analysis results; do not publish URLs with tokens.
    indexed=sum(v.get("status")=="ok" and v.get("sha")==sources[k]["sha"]
                for k,v in entries.items() if k in sources)
    index.update({"version":VERSION,"sourceCount":len(sources),"analyzed":indexed,
        "remaining":len(todo)-min(len(todo),max(1,min(75,args.batch))),
        "updatedAt":now.isoformat()})
    DEST.write_text(json.dumps(index,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf8")
    print(json.dumps({"sources":len(sources),"analyzed":indexed,"processedNow":done,
                     "failuresNow":errors,"remaining":index["remaining"]}),flush=True)
if __name__=="__main__":main()
