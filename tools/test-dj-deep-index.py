#!/usr/bin/env python3
"""Synthetic WAV regression for real-waveform DJ analyzer."""
import importlib.util, math, pathlib, tempfile, wave
import numpy as np
p=pathlib.Path(__file__).with_name("dj-deep-index.py")
spec=importlib.util.spec_from_file_location("mbdj",p)
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
assert mod.VERSION==2
# Refined BPM uses the measured rhythmic grid across twelve beats,
# never the loudest amplitude/onset spike at a nearby timestamp.
measured_bpm=127.35
grid=np.arange(42)*60/measured_bpm
frames=np.rint(grid*mod.SR/mod.HOP).astype(int)
value,verified,times=mod.refine_tempo_from_beats(129.2,frames)
assert verified is True and abs(value-measured_bpm)<0.5,(value,verified)
assert len(times)==42
fallback,verified,empty=mod.refine_tempo_from_beats(120.0,np.array([],dtype=int))
assert verified is False and fallback==120.0 and len(empty)==0
print("PASS: multi-beat tempo precision and unverified-grid fallback.")
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
    assert "introOnset" in a and "outroOnset" in a
    assert isinstance(a["outroOnsetWindows"],list)
    assert isinstance(a["introOnsetWindows"],list)
    assert 0<=a["introRms"]<2 and 0<=a["introPeak"]<2
    assert len(a["introOnsetWindows"])<=4
    for w in a["introOnsetWindows"]:
        assert w["start"]<w["end"] and len(w["onset"])==96
        assert len(w["groove"])==32 and len(w["notes"])==12
    assert a["analyzer"]=="librosa-onsets-chroma-rms-v7-bars-sections"
    assert a["barGrid"] is None or a["barGrid"]["beatsPerBar"]==4
    assert isinstance(a["sectionBoundaries"],list)
    assert all(e["kind"] in ("energy_up","energy_down","harmonic_change")
               and e["score"]>=.40 for e in a["sectionBoundaries"])
    assert isinstance(a["structureEvents"],list)
    assert a["introBassRatio"] is not None and 0<=a["introBassRatio"]<=1
    assert len(a["outroOnsetWindows"])<=5
    for w in a["outroOnsetWindows"]:
        assert w["end"] <= a["last"] - 1.80
        assert w["start"] < w["end"] and len(w["onset"]) == 96
        assert len(w["groove"]) == 32 and len(w["notes"]) == 12
        assert w["levelRatio"] >= .23
        assert np.isfinite(w["energyTrend"])
        assert w["beatCount"]>=0
        assert w["bassRatio"] is None or 0<=w["bassRatio"]<=1
    for fingerprint in [a["introOnset"],a["outroOnset"]]:
        if fingerprint is not None:
            assert len(fingerprint)==96
            assert all(np.isfinite(v) for v in fingerprint)
    print("PASS: actual PCM analyzed, beat, chroma, verified silence, timelines.")
finally:file.unlink(missing_ok=True)

# A gradually decaying beat can be bridged before the digital silence.
# Do not call the decaying music "silence": retain its actual waveform.
envelope=(.26+.13*pulse)*np.sin(2*math.pi*220*time)
envelope[time>=52]*=np.exp(-(time[time>=52]-52)*.35)
envelope[time>=60]=0
file=write_audio(envelope)
try:
    r=mod.analyze(file)
    assert r["dropRelease"] is not None, r
    assert 52<=r["dropRelease"]["lastImpactAt"]<r["dropRelease"]["releaseAt"]<r["last"]
    assert r["outroFinalNotes"] is not None
    assert r["outroGroove"] is not None or r["beatConfidence"]<.2
    print("PASS: decaying last beat detected before real silence, final harmony preserved.")
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

# Section cues are measured energy changes, never inferred vocal labels.
samples=np.full(240,.06,dtype=float)
samples[80:150]=.29
samples[150:]=.07
events=mod.structure_events(samples,.16,0.,24.)
assert any(e["direction"]=="rising" for e in events),events
assert any(e["direction"]=="falling" for e in events),events
assert all(e["direction"] in ("rising","falling") for e in events)
assert 0<=mod.frequency_bass_ratio(audio,0,4)<=1
tone_low=np.sin(2*np.pi*110*np.arange(rate*4)/rate)*.3
tone_high=np.sin(2*np.pi*850*np.arange(rate*4)/rate)*.3
assert mod.frequency_bass_ratio(tone_low,0,4)>.80
assert mod.frequency_bass_ratio(tone_high,0,4)<.15
print("PASS: waveform-only structure markers, frequency evidence and five measured windows.")
