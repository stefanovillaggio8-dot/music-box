#!/usr/bin/env python3
"""Independent read-only PCM and hash audit of actual published Demucs stems.

This checks that the GitHub source and the generated AAC really correspond,
and that the vocal audio is nonempty, correctly timed and not clipped.
No automatic source separation is run here. Music quality still needs
human listening; correlation with the source does NOT prove isolation.
"""
from __future__ import annotations
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import tempfile
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location("dj_vocal_stem", ROOT/"tools/dj-vocal-stem.py")
STEM=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(STEM)

def decode(path,at,seconds):
    cmd=["ffmpeg","-nostdin","-v","error","-ss",str(max(0.,at)),
         "-i",str(path),"-t",str(seconds),"-ac","1","-ar","16000",
         "-f","f32le","pipe:1"]
    result=subprocess.run(cmd,capture_output=True,timeout=90)
    if result.returncode:
        raise RuntimeError("Cannot decode PCM: "+result.stderr.decode(errors="replace")[:250])
    samples=np.frombuffer(result.stdout,dtype="<f4").astype(np.float64)
    if samples.size<32000 or not np.isfinite(samples).all():
        raise ValueError("Invalid or too short decoded PCM")
    return samples

def rms(samples):
    return float(np.sqrt(np.mean(samples*samples)))

def audit_entry(sha,item):
    if not re.fullmatch(r"[0-9a-f]{40}",sha) or item.get("sourceSha")!=sha:
        raise ValueError("Stem has no verifiable source SHA")
    key=item.get("trackKey")
    rel=item.get("path")
    if not isinstance(key,str) or not STEM.TRACK.fullmatch(key):
        raise ValueError("Unexpected source key")
    if rel != "dj-stems/vocals/"+sha+".m4a":
        raise ValueError("Unexpected stem path")
    path=ROOT/rel
    if not path.is_file() or path.stat().st_size<18000:
        raise ValueError("No actual AAC vocal stem is published")
    sha256=item.get("stemSha256")
    if not isinstance(sha256,str) or not re.fullmatch(r"[a-f0-9]{64}",sha256):
        raise ValueError("Missing exact AAC SHA-256")
    if hashlib.sha256(path.read_bytes()).hexdigest()!=sha256:
        raise ValueError("Published AAC differs from its manifest SHA-256")
    original_sha,data=STEM.source_mp3(key)
    if original_sha!=sha:
        raise ValueError("Actual MP3 blob changed since vocal separation")
    start=float(item["start"]);end=float(item["end"])
    original_duration=float(item["sourceDuration"])
    if not 0<=start<end<=original_duration or end-start>26:
        raise ValueError("Unreasonable stem time interval")
    with tempfile.TemporaryDirectory(prefix="musicbox-stem-audit-") as tmp:
        source=Path(tmp)/"source.mp3"
        source.write_bytes(data)
        decoded_source=decode(source,start,end-start)
        decoded_vocals=decode(path,0,end-start)
    actual=min(len(decoded_source),len(decoded_vocals))/16000
    if abs(actual-(end-start))>.65:
        raise ValueError("Decoded vocal clip is not source-time aligned")
    a=decoded_source[:int(actual*16000)]
    b=decoded_vocals[:int(actual*16000)]
    source_rms,vocal_rms=rms(a),rms(b)
    peak=float(np.max(np.abs(b)))
    if source_rms<.001 or vocal_rms<.001 or peak<.006 or peak>1.15:
        raise ValueError("Stem is silent, excessively amplified or clipped")
    correlation=float(np.corrcoef(a,b)[0,1]) if np.std(a)>.001 and np.std(b)>.001 else None
    return {"sourceKey":key,"duration":round(actual,3),
      "aacBytes":path.stat().st_size,
      "sourceRms":round(source_rms,5),"stemRms":round(vocal_rms,5),
      "stemPeak":round(peak,4),
      "sourceStemCorrelation":round(correlation,3) if correlation is not None else None,
      "sha256Matches":True,"sourceShaMatches":True}

def main():
    manifest=json.loads((ROOT/"dj-vocal-stems.json").read_text(encoding="utf8"))
    entries=manifest.get("entries",{})
    if manifest.get("version")!=1 or not isinstance(entries,dict) or not entries:
        raise ValueError("No real published stem to audit")
    if len(entries)>20:raise ValueError("Too many stem downloads for one audit job")
    results=[audit_entry(sha,item) for sha,item in sorted(entries.items())]
    print("[DJ STEM REAL PCM AUDIT]",json.dumps({
       "validated":len(results),"allHashesVerified":True,
       "items":results},ensure_ascii=False),flush=True)

if __name__=="__main__":main()
