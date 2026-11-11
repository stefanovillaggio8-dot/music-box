"""Measured beat-grid, cautious four-beat accents, and harmonic section boundaries.
All evidence comes from the ORIGINAL decoded PCM; a four-on-the-floor pulse
does not prove which beat is the downbeat. No voice/stem claims are made.
"""
import numpy as np

def _onset_at(onset, onset_times, t):
    if not len(onset):return 0.
    return float(np.interp(t,onset_times,onset))

def bar_evidence(beat_times, onset, onset_times, rms, bpm, end):
    beats=np.asarray(beat_times,dtype=float)
    beats=beats[np.isfinite(beats)&(beats>=0)&(beats<end)]
    if len(beats)<24 or not np.isfinite(bpm) or not 55<=bpm<=210:
        return None
    interval=float(np.median(np.diff(beats)))
    if abs(interval*float(bpm)/60-1)>.12:return None
    # Four adjacent beats must be stable; do not force drifting songs into
    # a fixed grid, or invent accents from compressed loudness.
    diffs=np.diff(beats)
    good=np.abs(diffs-interval)<max(.08,interval*.20)
    if np.mean(good)<.84:return None
    amps=[]
    for t in beats:
        # Actual transient energy (not RMS or BPM alone).
        around=[_onset_at(onset,onset_times,t+dt) for dt in (-.07,0,.07)]
        at=min(len(rms)-1,max(0,int(t/.1)))
        loud=float(np.mean(rms[max(0,at-1):min(len(rms),at+2)]))
        amps.append(max(around)*(1+.15*loud))
    amps=np.asarray(amps,dtype=float)
    if np.max(amps)-np.min(amps)<.08:return None
    groups=[amps[np.arange(len(amps))%4==i] for i in range(4)]
    if min(len(g) for g in groups)<4:return None
    means=np.asarray([np.median(g) for g in groups])
    order=np.argsort(means)[::-1]
    contrast=float((means[order[0]]-means[order[1]])/
                    max(.10,float(np.mean(means))))
    if contrast<.18:return None
    # Check the accent repeats in both independently measured halves.
    half=len(amps)//2
    bests=[]
    for begin,stop in [(0,half),(half,len(amps))]:
        local=np.asarray([np.median([amps[i] for i in range(begin,stop)
                         if i%4==j]) for j in range(4)])
        bests.append(int(np.argmax(local)))
    if bests[0]!=bests[1] or bests[0]!=int(order[0]):
        return None
    # Compare against 3-beat alternative before claiming four-beat bars.
    three=np.asarray([np.median(amps[np.arange(len(amps))%3==i])
                      for i in range(3)])
    contrast3=float((np.max(three)-np.median(three))/
                     max(.10,float(np.mean(three))))
    if contrast3>contrast*.97:return None
    offset=int(order[0])
    return {"beatsPerBar":4,"confidence":round(float(np.clip(
        contrast/(contrast+.35),0,1)),3),
        "interval":round(interval,4),
        "outroDownbeats":[round(float(t),3) for i,t in enumerate(beats)
                         if i%4==offset and t>=max(0,end-25)][-9:],
        "introDownbeats":[round(float(t),3) for i,t in enumerate(beats)
                         if i%4==offset and t<25][:9]}

def section_boundaries(y,sr,rms,onset,onset_t,first,last,level,
                       chroma_function, bar_grid=None):
    """Find harmonic/energy changes; NOT validated verse/chorus/drop labels."""
    if last-first<16:return []
    events=[]
    for at in np.arange(max(first+5,last-64),last-4,1.5):
        l=max(0,int((at-3.0)/.1));m=max(0,int((at-1.0)/.1))
        n=min(len(rms),int((at+1.0)/.1))
        p=min(len(rms),int((at+3.0)/.1))
        before=rms[l:m];after=rms[n:p]
        if before.size<12 or after.size<12:continue
        early=float(np.mean(before));late=float(np.mean(after))
        if max(early,late)<max(.003,level*.17):continue
        energy=float(np.log2((late+.0004)/(early+.0004)))
        # Chroma is an additional INDEPENDENT cue; avoid a full-song
        # STFT on each loop by inspecting only two short 1.5s excerpts.
        chroma_a=chroma_function(y[max(0,int((at-2.75)*sr)):
                                      max(0,int((at-1.25)*sr))])
        chroma_b=chroma_function(y[min(len(y),int((at+1.25)*sr)):
                                      min(len(y),int((at+2.75)*sr))])
        change=0.
        if chroma_a and chroma_b:
            aa=np.asarray(chroma_a,dtype=float)
            bb=np.asarray(chroma_b,dtype=float)
            denom=float(np.linalg.norm(aa)*np.linalg.norm(bb))
            if denom>1e-12:change=float(np.clip(1-np.dot(aa,bb)/denom,0,1))
        trans_before=np.mean([_onset_at(onset,onset_t,t)
          for t in np.arange(at-2.4,at-.5,.3)])
        trans_after=np.mean([_onset_at(onset,onset_t,t)
          for t in np.arange(at+.5,at+2.4,.3)])
        attack=float(np.log2((trans_after+.05)/(trans_before+.05)))
        score=abs(energy)*.42+change*.90+abs(attack)*.17
        if score<.40 or (abs(energy)<.48 and change<.29):continue
        events.append({"at":round(float(at),2),
          "kind":"energy_up" if energy>.48 else
                 "energy_down" if energy<-.48 else "harmonic_change",
          "energyDelta":round(float(np.clip(energy,-4,4)),3),
          "harmonicChange":round(change,3),"score":round(score,3)})
    # Non-maximum suppression: one musical change is one boundary.
    result=[]
    for event in sorted(events,key=lambda e:e["score"],reverse=True):
        if any(abs(event["at"]-other["at"])<3.0 for other in result):
            continue
        result.append(event)
        if len(result)>=14:break
    return sorted(result,key=lambda e:e["at"])
