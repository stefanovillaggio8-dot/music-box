#!/usr/bin/env python3
"""Independent real-MP3 audio audit of Music Box DJ candidate pairs.

Run on GitHub Actions to download the original published MP3s, decode with
ffmpeg and compare the actual outgoing/incoming windows. The precomputed
DJ index is used ONLY to locate tracks and choose the audible window; it
does not supply any similarity scores for this audit.
"""
from __future__ import annotations
import argparse
import hashlib
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
 ("audio/songs/track-584.mp3","audio/songs/track-336.mp3","full_pcm_native_tail_1"),
 # An independently placed four-pulse low-band preview is not certified
 # full-band beatmatching: inspect the REAL planned 9-11s overlap too.
 ("audio/songs/track-11.mp3","audio/songs/track-1184.mp3","new_independent_lowband_1"),
 ("audio/songs/track-588.mp3","audio/songs/track-684.mp3","new_independent_lowband_2"),
 ("audio/songs/track-588.mp3","audio/songs/track-627.mp3","new_independent_onsets_1"),
 ("audio/songs/track-588.mp3","audio/songs/track-573.mp3","new_independent_onsets_2"),
 # Both short snaps verified by the CURRENT exhaustive index-based run.
 ("audio/songs/track-892.mp3","audio/songs/track-1096.mp3","current_verified_snap_1"),
 ("audio/songs/track-770.mp3","audio/songs/track-874.mp3","current_verified_snap_2"),
 # Legacy claims are retained as negative controls, not asserted as valid.
 ("audio/songs/track-391.mp3","audio/songs/track-1164.mp3","legacy_strict_claim_1"),
 ("audio/songs/track-391.mp3","audio/songs/track-598.mp3","legacy_strict_claim_2"),
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

def planned_pair(outkey,inkey):
 """Read the exact engine-selected cue; audio is measured independently."""
 command=["node",str(ROOT/"tools/dj-equivalence-audit.cjs"),
          "--pair-from="+outkey,"--pair-to="+inkey]
 run=subprocess.run(command,capture_output=True,text=True,timeout=45)
 if run.returncode:raise RuntimeError("DJ plan inspector failed: "+run.stderr[-1000:])
 marker="[DJ PAIR PLAN] "
 output=next((line.split(marker,1)[1] for line in run.stdout.splitlines()
             if marker in line),None)
 if not output:raise RuntimeError("Missing simulated pair plan for "+outkey+" -> "+inkey)
 return json.loads(output)

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
   content=target.read_bytes()
   expected=ENTRIES[key].get("sha")
   actual=hashlib.sha1(b"blob "+str(len(content)).encode()+b"\0"+content).hexdigest()
   if expected and actual!=expected:raise ValueError("Original MP3 SHA changed: "+key)
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
 if signal.size<SR*.75:raise ValueError("Not enough decoded source audio")
 return signal

def envelope(x):
 # Use actual onset strength / spectral differences; never saved groove vectors.
 y=np.asarray(x,dtype=np.float32)
 strength=librosa.onset.onset_strength(y=y,sr=SR,hop_length=HOP)
 strength=np.asarray(strength,dtype=float)
 return strength

def align(outgoing,incoming):
 n=min(len(outgoing),len(incoming))
 # These PCM windows are both decoded from the SAME scheduled wall-clock
 # start. Comparing the last 3 seconds of one to the first 3 of the other
 # would misalign the onsets even for a perfect beat-matched overlap.
 tail=outgoing[:n].astype(float)
 head=incoming[:n].astype(float)
 def normalize(x):
  v=x-np.mean(x)
  sd=float(np.std(v))
  return v/max(sd,1e-6)
 tail=normalize(tail);head=normalize(head)
 overlap=min(n,round(3.1*SR/HOP))
 # A protected snap may keep only ~0.9s of genuinely audible source;
 # score it with its limited evidence instead of moving to unrelated audio.
 if overlap<64:raise ValueError("Insufficient shared onset windows")
 tail=tail[:overlap];head=head[:overlap]
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
 parser=argparse.ArgumentParser(description="Independent MP3 PCM DJ spotcheck")
 parser.add_argument("--only",action="append",default=[],
                     help="Run just this named case (repeatable)")
 parser.add_argument("--output",default="",
                     help="Write all independently measured PCM results as JSON")
 options=parser.parse_args()
 selected=[case for case in CASES if not options.only or case[2] in options.only]
 if not selected or len(selected)<len(set(options.only)):
  parser.error("Unknown or missing case label")
 results=[]
 with tempfile.TemporaryDirectory(prefix="musicbox-dj-audio-") as tmp:
  folder=pathlib.Path(tmp)
  for outkey,inkey,label in selected:
   a=ENTRIES.get(outkey);b=ENTRIES.get(inkey)
   if not a or not b or a.get("status")!="ok" or b.get("status")!="ok":
    raise RuntimeError("Missing real audio index entry for "+label)
   aa=download(outkey,folder);bb=download(inkey,folder)
   # A last-four-seconds comparison can be INVALID for an early DJ join.
   # Use the exact scheduled waveform window where at least 0.75s of source
   # music remains audible. Ultra-short snaps are reported separately, not falsely
   # rated by a multi-second correlation from outside their actual overlap.
   info=planned_pair(outkey,inkey)
   cue=info.get("plan") or {}
   audio_end=max(12,float(a.get("last") or a["duration"]))
   planned_begin=cue.get("begin")
   planned_end=cue.get("end")
   planned_entry=cue.get("entry")
   scheduled_start=info.get("scheduledStart")
   beat_wait=info.get("beatStartWait")
   usable=(min(float(planned_end),audio_end)-float(scheduled_start)
           if isinstance(scheduled_start,(int,float)) and
           isinstance(planned_end,(int,float)) else 0)
   exact_window=bool(usable>=.75 and
       isinstance(planned_entry,(int,float)) and planned_entry>=0)
   rate=float(cue.get("tempo") or 1)
   if not .94<=rate<=1.06:raise ValueError("Invalid playback rate in plan")
   if exact_window:
    start=float(scheduled_start)
    first=float(planned_entry)
    span=min(8. if cue.get("measuredFullBeat") else 4.,usable)
    out_audio=decode(aa,start,span)
    # HTMLMediaElement preserves pitch when changing playbackRate. Use an
    # independent phase-vocoder approximation to compare the timeline the
    # listener actually hears. This is NOT a real browser playback proof.
    in_audio=decode(bb,first,span*rate+.20)
    y=(librosa.effects.time_stretch(in_audio,rate=rate)
       if abs(rate-1)>.0005 else in_audio)
    x=out_audio[:int(span*SR)];y=y[:int(span*SR)]
   else:
    start=max(0,audio_end-8.0)
    first=max(0,float(b.get("safeIntroAt") or 0))
    out_audio=decode(aa,start,8.0)
    in_audio=decode(bb,first,8.0)
    x=out_audio[-4*SR:];y=in_audio[:4*SR]
   onset_out=envelope(x);onset_in=envelope(y)
   beats=align(onset_out,onset_in)
   chords=chord_similarity(x,y)
   result={"case":label,"outgoing":outkey,"incoming":inkey,
     "bpm_from_index":[a.get("bpm"),b.get("bpm")],
     "simulated_plan_kind":cue.get("kind"),
     "simulated_plan_begin":planned_begin,
     "simulated_plan_end":planned_end,
     "simulated_certified":bool(info.get("certified")),
     "scheduled_beat_wait_ms":round(float(beat_wait)*1000) if isinstance(beat_wait,(int,float)) else None,
     "scheduled_audible_start":round(start,3) if exact_window else None,
     "pcm_window":"scheduled_overlap_with_tempo_approximation" if exact_window else "diagnostic_tail_not_plan",
     "approximate_playback_rate":rate,
     "source_seconds":[round(start,2),round(first,2)],
     "actual_rms":[round(float(np.sqrt(np.mean(x*x))),4),
                   round(float(np.sqrt(np.mean(y*y))),4)],
     **beats,**chords}
   if cue.get("measuredFullBeat") and exact_window:
    stereo=subprocess.run(["ffmpeg","-nostdin","-v","error","-i",str(bb),"-t","20",
      "-ar","16000","-ac","2","-f","f32le","pipe:1"],capture_output=True,check=True,timeout=50).stdout
    raw_path=folder/"stretch-original.pcm";raw_path.write_bytes(stereo)
    cue_path=folder/"stretch-cue.json";cue_path.write_text(json.dumps(cue))
    checked=subprocess.run(["node",str(ROOT/"tools/dj-verify-stretch.cjs"),
      "--input="+str(raw_path),"--cue="+str(cue_path)],capture_output=True,text=True,check=True,timeout=30)
    result["pitch_preserving_intro_processing"]=json.loads(checked.stdout)
    half=min(len(x),len(y))//2
    result["full_overlap"]={"seconds":round(span,3),
     "first_half":align(envelope(x[:half]),envelope(y[:half])),
     "second_half":align(envelope(x[half:]),envelope(y[half:]))}
   results.append(result)
   print("[DJ ACTUAL PCM]",json.dumps(result,ensure_ascii=False),flush=True)
 summary={"pairs":len(results),
  "sources":len(CACHE),
  "best_rhythm_ge_05":sum((x["best_rhythm"] or 0)>=.5 for x in results),
  "zero_rhythm_ge_05":sum((x["rhythm_at_zero"] or 0)>=.5 for x in results),
  "chroma_ge_085":sum(x["chroma_cosine"]>=.85 for x in results),
  "index_certified_audio_examples":sum(x["simulated_certified"] for x in results),
  "index_certified_with_strong_zero_rhythm":sum(x["simulated_certified"] and
      (x["rhythm_at_zero"] or 0)>=.5 for x in results),
  "evidence_scope":"Independent MP3 onset/chroma spotchecks, not physical-device listening or Spotify equivalence",
  "details":results}
 if options.output:
  output=pathlib.Path(options.output)
  output.parent.mkdir(parents=True,exist_ok=True)
  output.write_text(json.dumps(summary,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
 print("[DJ PCM SUMMARY]",json.dumps(summary,ensure_ascii=False),flush=True)
 assert len(results)==len(selected)
 for x in results:
  assert x["chroma_cosine"]>=0 and x["chroma_cosine"]<=1.001
  assert x["best_lag_ms"]>=-510 and x["best_lag_ms"]<=510
if __name__=="__main__":main()
