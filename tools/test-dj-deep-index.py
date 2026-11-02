#!/usr/bin/env python3
"""Synthetic WAV regression for real-waveform DJ analyzer."""
import importlib.util, math, pathlib, tempfile, wave
import numpy as np
p=pathlib.Path(__file__).with_name("dj-deep-index.py")
spec=importlib.util.spec_from_file_location("mbdj",p)
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
assert mod.VERSION==1
rate=mod.SR
duration=64.
def write_audio(values):
    target=tempfile.NamedTemporaryFile(suffix=".wav",delete=False)
    target.close()
    with wave.open(target.name,"wb") as wav:
        wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(rate)
        wav.writeframes((np.clip(values,-1,1)*32767).astype("<i2").tobytes())
    return pathlib.Path(target.name)
time=np.arange(int(rate*duration))/rate
# Beat pulses with real PCM, then audible decay and digital silence.
pulse=(np.mod(time,.5)<.10).astype(float)
audio=(.26+.15*pulse)*np.sin(2*math.pi*220*time)
audio[time>=54]*=.13
audio[time>=60]=0
file=write_audio(audio)
try:
    a=mod.analyze(file)
    assert a["duration"]>=63.9
    assert a["bpm"]>=55 and a["bpm"]<=210
    assert a["introDrive"]>.25
    assert a["confidentTail"] is True
    assert a["outroChroma"] and len(a["outroChroma"])==12
    assert "outroTimeline" in a and "introTimeline" in a
    print("PASS: actual PCM analyzed, beat, chroma, verified silence, timelines.")
finally:file.unlink(missing_ok=True)
# A full-volume ending must be preserved: a matching key is not proof
# that its last impact can be discarded.
file=write_audio((.26+.15*pulse)*np.sin(2*math.pi*220*time))
try:
    b=mod.analyze(file)
    assert b["protectedEnding"] is True
    assert b["confidentTail"] is False
    assert b["dropRelease"] is None
    print("PASS: loud final beat protected; no invented empty tail.")
finally:file.unlink(missing_ok=True)
