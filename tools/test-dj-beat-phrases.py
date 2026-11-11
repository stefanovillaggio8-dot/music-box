#!/usr/bin/env python3
"""Pure synthetic checks for real-audio four-beat bar-grid and section cues."""
import sys,pathlib
import numpy as np
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parent))
from dj_beat_phrases import bar_evidence,section_boundaries
duration=64
beat_times=np.arange(.5,60,.5)
onset_t=np.arange(0,duration,.05)
onset=np.full(len(onset_t),.04)
for i,t in enumerate(beat_times):
    near=np.argmin(abs(onset_t-t))
    onset[near]=5. if i%4==0 else 1.
rms=np.full(int(duration/.1),.16)
grid=bar_evidence(beat_times,onset,onset_t,rms,120,60)
assert grid and grid["beatsPerBar"]==4,grid
assert len(grid["introDownbeats"])>=3,len(grid["introDownbeats"])
assert len(grid["outroDownbeats"])>=3,len(grid["outroDownbeats"])
assert grid["confidence"]>.3,grid
# A featureless quarter pulse is *not* a trustworthy 4/4 downbeat.
flat=np.full(len(onset_t),.05)
for t in beat_times:flat[np.argmin(abs(onset_t-t))]=1.
assert bar_evidence(beat_times,flat,onset_t,rms,120,60) is None
# Time drift is also incompatible with a certified fixed bar grid.
drift=beat_times+np.arange(len(beat_times))**2*.003
assert bar_evidence(drift,onset,onset_t,rms,120,60) is None
energy=np.full_like(rms,.07)
energy[300:500]=.25
samples=np.zeros(int(duration*11025),dtype=np.float32)
# Vary only the waveform's harmonic class at the 30-second boundary.
t=np.arange(len(samples))/11025.
samples[t<30]=.2*np.sin(2*np.pi*220*t[t<30])
samples[t>=30]=.2*np.sin(2*np.pi*330*t[t>=30])
def faux_chroma(part):
    if not len(part):return None
    # A lightweight stand-in returns chroma peaks based on the sample
    # window's known average note environment.
    a=np.zeros(12)
    hz=220 if np.std(part[::100])>.12 else 330
    a[0 if hz==220 else 5]=1.
    return a.tolist()
sections=section_boundaries(samples,11025,energy,onset,onset_t,
                            0.,60.,.18,faux_chroma,grid)
assert len(sections)>0,sections
assert all(e["kind"] in ("energy_up","energy_down","harmonic_change")
           and 0<e["at"]<60 for e in sections)
assert any(e["kind"]=="energy_up" for e in sections),sections
print("PASS: measured four-beat accents and musical section boundaries")
