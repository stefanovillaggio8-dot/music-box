#!/usr/bin/env python3
"""Independent raw-MP3 beat audit. Read-only; never publishes or modifies music.

Unlike DJ's indexed RMS/chroma, re-decodes actual published MP3 and checks
onset-strength patterns and chord windows at the exact possible overlap.
"""
import argparse
import hashlib
import json
import math
import pathlib
import tempfile
import urllib.parse
import urllib.request
import numpy as np
import librosa

SR=11025
HOP=256
ROOT=pathlib.Path(__file__).resolve().parents[1]
INDEX=json.loads((ROOT/"dj-deep-analysis.json").read_text(encoding="utf-8"))["entries"]
CACHE={}

def raw_url(key):
    if key.startswith("audio/songs/"):
        repo,branch,path="music-box-brani","main",key.removeprefix("audio/")
    elif key.startswith("mobile/songs/"):
        repo,branch,path="music-box","mobile-audio",key.removeprefix("mobile/")
    elif key.startswith("app/songs/"):
        repo,branch,path="music-box","main",key.removeprefix("app/")
    else:raise ValueError("Unexpected indexed MP3 source: "+key)
    return ("https://raw.githubusercontent.com/stefanovillaggio8-dot/"+
            repo+"/"+branch+"/"+urllib.parse.quote(path))

def load(key):
    if key in CACHE:return CACHE[key]
    meta=INDEX[key]
    if meta.get("status")!="ok":raise ValueError("Analysis unavailable "+key)
    request=urllib.request.Request(raw_url(key),headers={
        "User-Agent":"MusicBox-Independent-Waveform-Audit/1.0"})
    with urllib.request.urlopen(request,timeout=90) as response:
        data=response.read(24000001)
    if not 8192<=len(data)<=24000000:raise ValueError("Invalid MP3 length "+key)
    sha=hashlib.sha1(b"blob "+str(len(data)).encode()+b"\0"+data).hexdigest()
    if sha!=meta.get("sha"):
        raise ValueError("STALE MP3 index SHA: "+key+" (expected "+
                         str(meta.get("sha"))+" actual "+sha+")")
    with tempfile.NamedTemporaryFile(suffix=".mp3") as tmp:
        tmp.write(data);tmp.flush()
        y,sr=librosa.load(tmp.name,sr=SR,mono=True)
    if sr!=SR or not np.isfinite(y).all() or len(y)<SR*26:
        raise ValueError("Decoded audio invalid: "+key)
    if abs(len(y)/SR-meta["duration"])>1.5:
        raise ValueError("MP3 analysis duration differs from audio: "+key)
    CACHE[key]=np.asarray(y,dtype=np.float32)
    return CACHE[key]

def clip(y,start,end):
    a=max(0,round(start*SR));b=min(len(y),round(end*SR))
    if b-a<SR*.35:return None
    return np.asarray(y[a:b],dtype=np.float32)

def chroma_at(y,t,width=1.0):
    seg=clip(y,t-width/2,t+width/2)
    if seg is None:return None
    chrom=librosa.feature.chroma_stft(y=seg,sr=SR,
        n_fft=2048,hop_length=HOP)
    c=np.mean(chrom,axis=1)
    return c/(np.sum(c)+1e-12)

def focused_cos(a,b):
    if a is None or b is None:return None
    a=np.maximum(0,a-1/12*.82);b=np.maximum(0,b-1/12*.82)
    return float(np.dot(a,b)/(np.linalg.norm(a)*np.linalg.norm(b)+1e-12))

def onset_curve(y,start,end):
    seg=clip(y,start,end)
    if seg is None:return None
    flux=librosa.onset.onset_strength(y=seg,sr=SR,hop_length=HOP)
    if len(flux)<10:return None
    x=np.arange(len(flux))*HOP/SR
    times=(np.arange(32)+.5)*(end-start)/32
    points=np.interp(times,x,flux,left=0,right=0)
    std=float(np.std(points))
    if std<.04:return None
    z=np.clip((points-np.mean(points))/(std+1e-8),-3,3)
    return z

def percussion_match(a,b,bpm,edge,entry):
    period=60/bpm
    span=8*period
    o=onset_curve(a,edge-span,edge)
    n=onset_curve(b,entry,entry+span)
    if o is None or n is None:return None
    # Measure actual AUDIO onset spectral flux, not indexed RMS.
    scores=[]
    for shift in range(8):
        v=np.roll(n,shift)
        scores.append(float(np.dot(o,v)/(np.linalg.norm(o)*np.linalg.norm(v)+1e-8)))
    return max(scores)

def audible_rms(y,start,end):
    seg=clip(y,start,end)
    return float(np.sqrt(np.mean(seg**2))) if seg is not None else None

def audit(p):
    old,new=p["from"],p["to"]
    a,b=load(old),load(new)
    A,B=INDEX[old],INDEX[new]
    edge=float(A["last"])
    entry=float(B.get("safeIntroAt") or 0)
    periods=[2.8,3.8,4.7]
    best=None
    for fade in periods:
        checks=[]
        for f in (.22,.50,.78):
            oldAt=edge-fade*(1-f)
            newAt=entry+fade*f
            z=focused_cos(chroma_at(a,oldAt),chroma_at(b,newAt))
            if z is not None:checks.append(z)
        if len(checks)!=3:continue
        score=float(np.mean(checks))
        weakest=min(checks)
        item={"overlapSec":fade,"chordAvg":round(score,3),
              "weakestWindow":round(weakest,3)}
        if best is None or (score*.75+weakest*.25)>
                (best["chordAvg"]*.75+best["weakestWindow"]*.25):
            best=item
    rhythm=percussion_match(a,b,float(A["bpm"]),edge,entry)
    firstEnd=audible_rms(a,edge-3.8,edge-2.8)
    after=audible_rms(a,edge-.35,edge-.05)
    report={
        "reason":p["reason"],"from":old,"to":new,
        "bpmA":A["bpm"],"bpmB":B["bpm"],
        "audioDurationA":round(len(a)/SR,2),
        "audioDurationB":round(len(b)/SR,2),
        "chordWindows":best,
        "realOnsetCorrelation":round(rhythm,3) if rhythm is not None else None,
        "lateMusicRms":round(after,5) if after is not None else None,
        "earlierMusicRms":round(firstEnd,5) if firstEnd is not None else None,
        "indexMatchValid":True,
        "note":"Spectral similarity cannot by itself certify voice-free or subjective DJ quality"
    }
    return report

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--pairs",required=True,type=pathlib.Path)
    args=ap.parse_args()
    pairs=json.loads(args.pairs.read_text(encoding="utf-8"))
    # Cap the read-only network workload and avoid excessive downloads.
    pairs=pairs[:7]
    reports=[]
    for p in pairs:
        result=audit(p)
        print("[DJ RAW MP3 WAVEFORM]",json.dumps(result,ensure_ascii=False),flush=True)
        reports.append(result)
    print("[DJ RAW AUDIO SUMMARY]",json.dumps({
        "pairsAnalyzed":len(reports),"uniqueMP3":len(CACHE),
        "certifiedPairs":sum(p["reason"]=="certified_beat" for p in reports),
        "chordsAbove80":sum((p["chordWindows"] or {}).get("chordAvg",0)>=.80 for p in reports),
        "onsetsAbove60":sum((p["realOnsetCorrelation"] or 0)>=.60 for p in reports)
    },ensure_ascii=False),flush=True)
    if len(reports)<5:
        raise SystemExit("Insufficient independently decoded real audio pairs")
if __name__=="__main__":main()
