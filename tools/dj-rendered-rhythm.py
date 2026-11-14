"""Independent attack positions on the ACTUAL rendered component signals.

The source hypotheses only bound a local search; no missing attack is
created. SoundTouch timing, different drum patterns and both window halves
are checked after applying the audible entrance/exit envelopes.
"""
import numpy as np
import librosa,soxr

def observed(stereo,sr,expected,pre_roll):
    y=soxr.resample(stereo.mean(axis=1),sr,11025).astype(np.float32)
    _,percussive=librosa.effects.hpss(y,margin=(2.,2.))
    onset=librosa.onset.onset_strength(y=percussive,sr=11025,hop_length=64)
    times=librosa.frames_to_time(np.arange(len(onset)),sr=11025,hop_length=64)-pre_roll
    floor=float(np.quantile(onset,.2));scale=max(.01,float(np.quantile(onset,.95)-floor));result=[]
    for t in expected:
        indices=np.where((times>=t-.06)&(times<=t+.06))[0]
        if not len(indices):continue
        i=indices[np.argmax(onset[indices])]
        if (onset[i]-floor)/scale<.25:continue
        actual=float(times[i])
        if not result or actual-result[-1]>.20:result.append(actual)
    return result

def verify(outgoing,incoming,sr,cue,pre_roll):
    check=cue['structuralEvidence']['pulseCheck'];fade=cue['fade']
    a=observed(outgoing,sr,check['source'],pre_roll)
    b=observed(incoming,sr,[t/cue['tempo'] for t in check['target']],pre_roll)
    a=[t for t in a if -.075<=t<=fade-.12];b=[t for t in b if -.075<=t<=fade-.12]
    cursor=0;matches=[]
    for t in b:
        if cursor>=len(a):break
        while cursor+1<len(a) and abs(a[cursor+1]-t)<abs(a[cursor]-t):cursor+=1
        if abs(a[cursor]-t)<=.075:matches.append((a[cursor],t,a[cursor]-t));cursor+=1
    errors=[x[2] for x in matches];ratio=len(errors)/max(1,len(a),len(b))
    rms=float(np.sqrt(np.mean(np.square(errors)))) if errors else None
    first=sum(t<fade/2 for _,t,_ in matches);second=len(matches)-first
    mode='full-pcm' if cue['measuredFullBeat'] else 'metrical-rhythmic'
    accepted=len(errors)>=8 and rms is not None and rms<=.04 and ratio>=.90 and min(first,second)>=3
    counts=[]
    if cue['measuredFullBeat'] and cue.get('measuredPulseMode'):
        accepted=accepted and len(errors)>=12 and ratio>=.95 and rms<=.025 and min(first,second)>=5
    elif not cue['measuredFullBeat']:
        bars=check['sourceBars']
        counts=[sum(start-.05<=t<(bars[i+1] if i+1<len(bars) else fade)-.05 for _,t,_ in matches) for i,start in enumerate(bars)]
        actual_downbeats=all(any(abs(t-start)<=.05 for t in a) for start in bars) and all(any(abs(t-start)<=.05 for t in b) for start in check['targetBars'])
        accepted=len(errors)>=8 and rms is not None and rms<=.020 and min(counts,default=0)>=2 and actual_downbeats
    downbeat_verified=None;downbeat_error=None;downbeat_max=None;downbeat_matches=None
    if cue.get('preservedFileTail'):
        source_bars=observed(outgoing,sr,check['sourceBars'],pre_roll)
        target_bars=observed(incoming,sr,check['targetBars'],pre_roll)
        downbeat_matches=min(len(source_bars),len(target_bars))
        if len(source_bars)==len(target_bars)==cue['structuralEvidence']['bars']:
            differences=np.array(source_bars)-np.array(target_bars)
            downbeat_error=float(np.sqrt(np.mean(differences**2)));downbeat_max=float(np.max(np.abs(differences)))
            downbeat_verified=downbeat_error<=.025 and downbeat_max<=.05
        else:downbeat_verified=False
        accepted=accepted and downbeat_verified
    return {'method':'rendered-hpss-attacks-v1','mode':mode,'accepted':bool(accepted),
        'sourceAttacks':len(a),'incomingAttacks':len(b),'matches':len(errors),'agreement':ratio,
        'rmsSeconds':rms,'firstHalfMatches':first,'secondHalfMatches':second,
        'sharedPerBar':counts,'sourceObserved':a,'incomingObserved':b,
        'notHumanListening':True,**({'downbeatsVerified':bool(downbeat_verified),'downbeatRmsSeconds':downbeat_error,
        'maximumDownbeatError':downbeat_max,'downbeatMatches':downbeat_matches} if cue.get('preservedFileTail') else {})}
