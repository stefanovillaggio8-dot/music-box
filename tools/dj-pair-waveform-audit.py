#!/usr/bin/env python3
"""Independent real-MP3 audio audit of Music Box DJ candidate pairs.

Run on GitHub Actions to download the original published MP3s, decode with
ffmpeg and compare the actual outgoing/incoming windows. The precomputed
DJ index is used ONLY to locate tracks and choose the audible window; it
does not supply any similarity scores for this audit.
"""
from __future__ import annotations
import json
import math
import pathlib
import shutil
import subprocess
import tempfile
import time
import urllib.request
from urllib.parse import quote
import numpy as np
import librosa

ROOT = pathlib.Path(__file__).resolve().parents[1]
INDEX = json.loads((ROOT / "dj-deep-analysis.json").read_text(encoding="utf8"))
ENTRIES = INDEX["entries"]
SR = 11025
HOP = 128
CASES = [
 ("audio/songs/track-391.mp3","audio/songs/track-1164.mp3","claimed_strict_1"),
 ("audio/songs/track-391.mp3","audio/songs/track-598.mp3","claimed_strict_2"),
 ("audio/songs/track-568.mp3","audio/songs/track-464.mp3","rejected_drum"),
 ("audio/songs/track-808.mp3","audio/songs/track-209.mp3","rejected_drum_2"),
 ("audio/songs/track-153.mp3","audio/songs/track-8.mp3","user_recording_mismatch"),
 ("audio/songs/track-378.mp3","audio/songs/track-91.mp3","candidate_pulse_grid_1"),
 ("audio/songs/track-78.mp3","audio/songs/track-966.mp3","candidate_pulse_grid_2"),
 ("audio/songs/track-160.mp3","audio/songs/track-111.mp3","ranked_not_beat"),
 ("audio/songs/track-161.mp3","audio/songs/bassi/track-51.mp3","ranked_not_beat_2"),
 ("audio/songs/track-346.mp3","app/songs/youtube-kopi-luwak.mp3","rejected_snap"),
]
def url_for(key):
 if key.startswith("audio/"):
  base="https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/"
  return base+quote(key.removeprefix("audio/"),safe="/")
 if key.startswith("app/"):
  base="https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box/main/"
  return base+quote(key.removeprefix("app/"),safe="/")
 if key.startswith("mobile/"):
  base="https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box/mobile-audio/"
  return base+quote(key.removeprefix("mobile/"),safe="/")
 raise ValueError("Unknown source key: "+key)

CACHE={}
def download(key,dir):
 if key in CACHE:return CACHE[key]
 target=dir / ("source-%02d.mp3"%len(CACHE))
 request=urllib.request.Request(url_for(key),headers={"User-Agent":"MusicBox-DJ-RealWaveformAudit/1.0"})
 last=None
 for attempt in range(3):
  try:
   with urllib.request.urlopen(request,timeout=60) as response,open(target,"wb") as dest:
    shutil.copyfileobj(response,dest)
   if target.stat().st_size<10000:raise ValueError("Audio download too short")
   CACHE[key]=target
   return target
  except Exception as error:
   last=error
   time.sleep(1+attempt)
 raise RuntimeError("Cannot download "+key+": "+str(last))

def decode(path,at,length):
 at=max(0,float(at))
 args=["ffmpeg","-nostdin","-hide_banner","-loglevel","error",
  "-ss",str(at),"-i",str(path),"-t",str(length),"-ac","1",
  "-ar",str(SR),"-f","f32le","pipe:1"]
 process=subprocess.run(args,capture_output=True,timeout=50)
 if process.returncode:raise RuntimeError("ffmpeg decode: "+process.stderr.decode(errors="ignore")[:300])
 signal=np.frombuffer(process.stdout,dtype="<f4").copy()
 if signal.size<SR*2:raise ValueError("Not enough decoded source audio")
 return signal

def envelope(x):
 # Use actual onset strength / spectral differences; never saved groove vectors.
 y=np.asarray(x,dtype=np.float32)
 strength=librosa.onset.onset_strength(y=y,sr=SR,hop_length=HOP)
 strength=np.asarray(strength,dtype=float)
 return strength

def align(outgoing,incoming):
 n=min(len(outgoing),len(incoming))
 tail=outgoing[-n:].astype(float)
 head=incoming[:n].astype(float)
 def normalize(x):
  v=x-np.mean(x)
  sd=float(np.std(v))
  return v/max(sd,1e-6)
 tail=normalize(tail);head=normalize(head)
 overlap=min(n,round(3.1*SR/HOP))
 if overlap<80:raise ValueError("Insufficient shared onset windows")
 tail=tail[-overlap:];head=head[:overlap]
 def corr(shift):
  # A positive phase lag shifts the start of the next beat pattern.
  if shift<0:a,b=tail[-shift:],head[:len(head)+shift]
  elif shift>0:a,b=tail[:len(tail)-shift],head[shift:]
  else:a,b=tail,head
  if len(a)<overlap*.74:return None
  if np.std(a)<1e-5 or np.std(b)<1e-5:return None
  return float(np.corrcoef(a,b)[0,1])
 zero=corr(0)
 all_lags=[(lag,corr(lag)) for lag in range(-round(.5*SR/HOP),round(.5*SR/HOP)+1)]
 candidates=[(lag,v) for lag,v in all_lags if v is not None and math.isfinite(v)]
 best=max(candidates,key=lambda pair:pair[1],default=(0,float("nan")))
 return {"rhythm_at_zero":round(zero,3) if zero is not None else None,
  "best_rhythm":round(best[1],3) if math.isfinite(best[1]) else None,
  "best_lag_ms":round(best[0]*HOP/SR*1000)}

def chord_similarity(a,b):
 # Independent actual PCM chroma; not stored chroma or metadata score.
 def feature(x):
  c=librosa.feature.chroma_stft(y=x.astype(np.float32),sr=SR,
   hop_length=512,n_fft=2048)
  weights=np.maximum(0,c-.08)
  return np.mean(weights,axis=1)
 x,y=feature(a),feature(b)
 similarity=float(np.dot(x,y)/(np.linalg.norm(x)*np.linalg.norm(y)+1e-10))
 top=lambda z:np.argsort(z)[-3:].tolist()
 return {"chroma_cosine":round(similarity,3),
         "top_note_overlap":len(set(top(x))&set(top(y)))}

def main():
 results=[]
 with tempfile.TemporaryDirectory(prefix="musicbox-dj-audio-") as tmp:
  folder=pathlib.Path(tmp)
  for outkey,inkey,label in CASES:
   a=ENTRIES.get(outkey);b=ENTRIES.get(inkey)
   if not a or not b or a.get("status")!="ok" or b.get("status")!="ok":
    raise RuntimeError("Missing real audio index entry for "+label)
   aa=download(outkey,folder);bb=download(inkey,folder)
   # Exclude encoded silence; compare the actual LAST 8s of audible music.
   audio_end=max(12,float(a.get("last") or a["duration"]))
   start=max(0,audio_end-8.0)
   first=max(0,float(b.get("safeIntroAt") or 0))
   out_audio=decode(aa,start,8.0)
   in_audio=decode(bb,first,8.0)
   # A 4-second tail and 4-second intro represent the audible mix junction.
   x=out_audio[-4*SR:]
   y=in_audio[:4*SR]
   onset_out=envelope(x);onset_in=envelope(y)
   beats=align(onset_out,onset_in)
   chords=chord_similarity(x,y)
   result={"case":label,"outgoing":outkey,"incoming":inkey,
     "bpm_from_index":[a.get("bpm"),b.get("bpm")],
     "source_seconds":[round(audio_end,2),round(first,2)],
     "actual_rms":[round(float(np.sqrt(np.mean(x*x))),4),
                   round(float(np.sqrt(np.mean(y*y))),4)],
     **beats,**chords}
   results.append(result)
   print("[DJ ACTUAL PCM]",json.dumps(result,ensure_ascii=False),flush=True)
 print("[DJ PCM SUMMARY]",json.dumps({"pairs":len(results),
  "sources":len(CACHE),
  "best_rhythm_ge_05":sum((x["best_rhythm"] or 0)>=.5 for x in results),
  "zero_rhythm_ge_05":sum((x["rhythm_at_zero"] or 0)>=.5 for x in results),
  "chroma_ge_085":sum(x["chroma_cosine"]>=.85 for x in results),
  "details":results},ensure_ascii=False),flush=True)
 assert len(results)==len(CASES)
 for x in results:
  assert x["chroma_cosine"]>=0 and x["chroma_cosine"]<=1.001
  assert x["best_lag_ms"]>=-510 and x["best_lag_ms"]<=510
if __name__=="__main__":main()
