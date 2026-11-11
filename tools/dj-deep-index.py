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
VERSION = 2
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
def frequency_bass_ratio(samples, start, end):
    """Measured low-band content; never interpreted as proof of no vocals."""
    begin=max(0,int(start*SR));stop=min(len(samples),int(end*SR))
    if stop-begin<int(.7*SR):return None
    # 3x downsampling preserves the 55-260Hz kick/bass band and keeps
    # full-library analysis bounded even for imported long recordings.
    x=np.asarray(samples[begin:stop:3],dtype=np.float64).copy()
    if x.size<2048 or np.sqrt(np.mean(x*x))<.001:return None
    x*=np.hanning(x.size)
    power=np.abs(np.fft.rfft(x))**2
    hz=np.fft.rfftfreq(x.size,d=3/SR)
    measured=(hz>=55)&(hz<=1500)
    bass=(hz>=55)&(hz<=260)
    total=float(np.sum(power[measured]))
    if total<1e-8:return None
    return round(float(np.clip(np.sum(power[bass])/total,0,1)),4)

def structure_events(rms, level, first, last):
    """Loudness/energy section boundaries (NOT chorus or singing labels)."""
    events=[]
    for at in np.arange(max(first+4,last-34),last-3,2):
        before=rms[max(0,int((at-2.6)/.1)):max(0,int((at-.6)/.1))]
        after=rms[min(len(rms),int((at+.6)/.1)):min(len(rms),int((at+2.6)/.1))]
        if before.size<12 or after.size<12:continue
        a=float(np.mean(before));b=float(np.mean(after))
        if max(a,b)<max(.004,level*.20):continue
        delta=float(np.log2((b+.0005)/(a+.0005)))
        if abs(delta)<.70:continue
        events.append({"at":round(float(at),2),
           "direction":"rising" if delta>0 else "falling",
           "change":round(delta,3)})
    events.sort(key=lambda e:abs(e["change"]),reverse=True)
    return sorted(events[:12],key=lambda e:e["at"])

def harmonic_section_events(samples, first, last):
    """Real chroma novelty near track end, not fabricated verse/chorus labels."""
    start=max(0.,float(first),float(last)-35.)
    stop=min(len(samples)/SR,float(last))
    if stop-start<9:return []
    audio=np.asarray(samples[int(start*SR):int(stop*SR)],dtype=np.float32)
    if np.sqrt(np.mean(audio*audio))<.002:return []
    matrix=librosa.feature.chroma_stft(y=audio,sr=SR,
                                      n_fft=2048,hop_length=HOP)
    frameTimes=librosa.frames_to_time(np.arange(matrix.shape[1]),
                                     sr=SR,hop_length=HOP)
    events=[]
    for at in np.arange(4.,stop-start-3.,1.):
        before=matrix[:,(frameTimes>=at-2.4)&(frameTimes<at-.5)]
        after=matrix[:,(frameTimes>at+.5)&(frameTimes<=at+2.4)]
        if before.shape[1]<6 or after.shape[1]<6:continue
        a=np.mean(before,axis=1);b=np.mean(after,axis=1)
        norm=float(np.linalg.norm(a)*np.linalg.norm(b))
        if norm<.001:continue
        cosine=float(np.dot(a,b)/norm)
        novelty=1.-np.clip(cosine,0,1)
        if novelty<.24:continue
        events.append({"at":round(float(start+at),2),
          "direction":"harmonic","change":round(float(novelty),3)})
    # Nonmax suppression: a sustained key change is ONE section marker.
    events.sort(key=lambda x:x["change"],reverse=True)
    selected=[]
    for event in events:
        if all(abs(event["at"]-x["at"])>=2.6 for x in selected):
            selected.append(event)
        if len(selected)>=8:break
    return sorted(selected,key=lambda x:x["at"])

def measured_beat_grid(beat_times, first, last, bpm):
    """Conservative beat timestamps, no fabricated 4/4 downbeat labels."""
    if not 55<=bpm<=210:return {"reliable":False,"anchors":[],"error":None}
    beats=np.asarray(beat_times,dtype=float)
    beats=beats[(beats>=first)&(beats<=last)]
    if beats.size<8:return {"reliable":False,"anchors":[],"error":None}
    diffs=np.diff(beats)
    target=60./bpm
    errors=np.abs(diffs-target)
    robust=float(np.median(errors))
    reliable=bool(np.median(errors)<=target*.10 and
      np.mean(errors<=target*.18)>=.75)
    return {"reliable":reliable,
      # Sparse real pulse timestamps let the mixer test repeated beats.
      # They do NOT identify strong bar-downbeats or song sections alone.
      "anchors":[round(float(t),3) for t in beats[::2][-32:]],
      "error":round(robust,4)}

def refine_tempo_from_beats(estimated, frames):
    """Refine librosa's quantized BPM using several independently tracked beats.

    A detected beat grid is the evidence; a spectral peak anywhere in the
    last few seconds is NOT automatically a downbeat.
    """
    try:
        rough=float(np.asarray(estimated).reshape(-1)[0])
    except (TypeError, ValueError, IndexError):
        rough=float("nan")
    timestamps=librosa.frames_to_time(np.asarray(frames,dtype=int),
                                     sr=SR,hop_length=HOP)
    if timestamps.size<10:
        return (round(rough,3) if np.isfinite(rough) and 55<=rough<=210 else 120.0,
                False,timestamps)
    rates=[]
    # Twelve consecutive beats suppress the ~46ms individual frame
    # quantization: estimate the slope, not the median of single intervals.
    for pos in range(0,len(timestamps)-11,5):
        segment=timestamps[pos:pos+12]
        diffs=np.diff(segment)
        median=float(np.median(diffs))
        if not .28<=median<=1.1 or np.max(np.abs(diffs-median))>median*.24:
            continue
        slope=float(np.polyfit(np.arange(len(segment)),segment,1)[0])
        if not slope>0:continue
        residual=float(np.max(np.abs(segment-(segment[0]+
                            slope*np.arange(len(segment))))))
        bpm=60./slope
        if 55<=bpm<=210 and residual<max(.10,slope*.23):
            rates.append(bpm)
    if len(rates)>=2:
        center=float(np.median(rates))
        dispersion=float(np.median(np.abs(np.asarray(rates)-center)))
        # Avoid certifying a drifting tempo or a half/double beat alias.
        if dispersion<=center*.022 and (
           not np.isfinite(rough) or
           any(abs(center/(rough*scale)-1)<=.055 for scale in (.5,1.,2.))):
            return round(center,3),True,timestamps
    return (round(rough,3) if np.isfinite(rough) and 55<=rough<=210 else 120.,
            False,timestamps)

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
        tail=rms[last_strong+1:hi]
        start=(last_strong+1)*.1+.35
        # A natural reverb/beat decay is NOT instant silence. Detect a
        # sustained falling envelope; reject drops that rebound later.
        if 2.15<=last-start<=12 and tail.size>=20:
            third=max(4,tail.size//3)
            first_avg=float(np.mean(tail[:third]))
            last_avg=float(np.mean(tail[-third:]))
            final_avg=float(np.mean(tail[-min(10,tail.size):]))
            peak=float(np.max(tail))
            mean=float(np.mean(tail))
            descending=first_avg>.001 and last_avg<=first_avg*.59
            settled=final_avg<=level*.16 and last_avg<=level*.24
            no_return=peak<=level*.70 and mean<=level*.40
            if descending and settled and no_return:
                release={"lastImpactAt":round(last_strong*.1,3),
                         "releaseAt":round(start,3),
                         "seconds":round(last-start,3),
                         "quietLevel":round(mean/level,4),
                         "score":round(float(1-mean/level),4)}
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
    bpm,tempo_refined,beat_times=refine_tempo_from_beats(tempo,beats)
    strength=float(np.clip((np.std(onset)/(np.mean(onset)+1e-7))*.24,0,1))
    measured_grid=measured_beat_grid(beat_times,first,last,bpm)
    # A failed beat tracker must never pretend that a default 120 BPM is
    # measured. Keep onset signatures for neutral/safe release decisions.
    if len(beat_times)<4:strength=0.
    onset_t=librosa.frames_to_time(np.arange(len(onset)),sr=SR,hop_length=HOP)
    def tracked_beat(start,end,latest=False):
        measured=beat_times[(beat_times>=start)&(beat_times<=end)]
        if measured.size==0:return None
        return round(float(measured[-1] if latest else measured[0]),3)
    firstbeat=tracked_beat(safe_intro,min(duration,safe_intro+5))
    # A last-audible musical edge is computed below. Never align to an
    # arbitrary loud transient or a beat inside encoded digital silence.
    # Chord and groove signatures must precede the SILENT OUTRO: the
    # listener expects matching music, not two matching empty sections.
    musical_edge=min(last,release["lastImpactAt"]+.20) if release else last
    beat_anchor=tracked_beat(max(first,musical_edge-5.0),musical_edge,True)
    outro_start=max(first,musical_edge-10)
    to=min(duration,first+12)
    end_note=musical_edge
    c=chroma(y)
    def onset_signature(start):
        # Short actual transients at the join. RMS similarity and BPM alone
        # are not reliable evidence of matching drums.
        span=4.0
        times=start+(np.arange(96)+.5)*span/96
        if start<0 or times[-1]>=duration-.05:return None
        frames=np.interp(times,onset_t,onset)
        mean=float(np.mean(frames));std=float(np.std(frames))
        if not np.isfinite(std) or std<max(.045,mean*.12):return None
        return [round(float(v),3) for v in
          np.clip((frames-mean)/std,-3,3)]
    intro_onset=onset_signature(float(safe_intro))
    outro_onset=onset_signature(float(musical_edge)-4.0)
    # Earlier REAL 4-second percussion/harmony windows allow the DJ to
    # start a matching intro on a musical bar instead of waiting for the
    # final beat. Do not guess from BPM or an empty MP3 tail. Every window
    # is measured from original PCM and carries its own boundary notes.
    outro_windows=[]
    # More phrase candidates for build/drop, not only two final windows.
    # All remain measured from the actual original MP3 and the browser
    # validates the chosen live phase before a filtered beat preview.
    for offset in (6.0,8.0,10.0,12.0,14.0):
        window_start=float(musical_edge)-offset
        window_end=window_start+4.
        if window_start<max(0.,first,25.) or window_end>musical_edge-1.95:
            continue
        signature=onset_signature(window_start)
        local_groove=groove(rms,bpm,window_end,True)
        if signature is None or local_groove is None:continue
        sl=rms[max(0,int(window_start/.1)):min(len(rms),int(window_end/.1))]
        if sl.size<30:continue
        relative=float(np.mean(sl)/max(level,.0001))
        if relative<.23:continue
        a=int(window_start*SR);b=int(window_end*SR)
        notes=chroma(y[a:b])
        if notes is None:continue
        first_half=float(np.mean(sl[:len(sl)//2]))
        second_half=float(np.mean(sl[len(sl)//2:]))
        trend=float(np.log2((second_half+.0005)/(first_half+.0005)))
        beats_near=beat_times[(beat_times>=window_start)&
                              (beat_times<=window_end)]
        outro_windows.append({
            "start":round(window_start,3),
            "end":round(window_end,3),
            "onset":signature,
            "groove":local_groove,
            "notes":notes,
            "levelRatio":round(relative,4),
            "energyTrend":round(float(np.clip(trend,-3.,3.)),3),
            "beatCount":int(beats_near.size),
            "measuredBeatTimes":[round(float(t),3) for t in beats_near[-16:]],
            "bassRatio":frequency_bass_ratio(y,window_start,window_end)
        })
    out={"duration":round(duration,3),"first":round(first,3),"last":round(last,3),
      "trailing":round(trailing,3),"leading":round(leading,3),
      "bpm":round(bpm,3),"tempoRefined":tempo_refined,
      "beatConfidence":round(strength,3),
      "beatAnchor":beat_anchor,"introBeat":firstbeat,"level":round(level,5),
      "beatGrid":measured_grid,
      "introBeatTimes":[round(float(v),3) for v in
          beat_times[(beat_times>=safe_intro)&
                     (beat_times<=min(duration,safe_intro+9))][:20]],
      "chroma":c,"introChroma":chroma(y[:int(to*SR)]),
      "outroChroma":chroma(y[int(outro_start*SR):int(end_note*SR)]),
      "introAttackNotes":chroma(y[int(first*SR):int(min(duration,first+2.3)*SR)]),
      "outroFinalNotes":chroma(y[int(max(0,musical_edge-2.5)*SR):int(musical_edge*SR)]),
      "introPhraseNotes":chroma(y[int(first*SR):int(min(duration,first+6)*SR)]),
      "outroPhraseNotes":chroma(y[int(max(0,musical_edge-7)*SR):int(max(0,musical_edge-2)*SR)]),
      "introTimeline":timeline(y,first,min(duration,first+9)),
      "outroTimeline":timeline(y,max(0,musical_edge-9),musical_edge,True),
      "introGroove":groove(rms,bpm,safe_intro),
      "outroGroove":groove(rms,bpm,musical_edge,True),
      "introOnset":intro_onset,"outroOnset":outro_onset,
      "outroOnsetWindows":outro_windows,
      # Structural descriptors are waveform evidence, NOT lyrical/vocal
      # classifications. Those come from synced karaoke or local YAMNet.
      "structureEvents":sorted(
          structure_events(rms,level,first,musical_edge)+
          harmonic_section_events(y,first,musical_edge),
          key=lambda event:event["at"]),
      "introBassRatio":frequency_bass_ratio(
          y,safe_intro,min(duration,safe_intro+4)),
      "introDrive":round(drive,4),"dropRelease":release,
      "protectedEnding":protected,"safeIntroAt":round(safe_intro,3),
      "safeOutroAt":release["releaseAt"] if release else None,
      "confidentTail":confident,"durationMismatch":False,
      "precomputed":True,"analyzer":"librosa-onsets-chroma-rms-v8-harmonic-sections"}
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
        if (previous.get("sha")==item["sha"] and previous.get("status")=="ok"
                and previous.get("analyzer")=="librosa-onsets-chroma-rms-v8-harmonic-sections"
                and isinstance(previous.get("outroOnsetWindows"),list)):continue
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
