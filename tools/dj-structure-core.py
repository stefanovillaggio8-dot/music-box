"""Whole-recording structure evidence. No semantic verse/chorus guesswork.

Downbeats are model hypotheses cross-checked against observed attacks.
Four/eight/sixteen-bar spans are phrase hypotheses only when structural
novelty supports their endpoints; counting bars alone is not phrase truth.
"""
import numpy as np

VERSION=1
VOCAL_ABSOLUTE=.004
VOCAL_RELATIVE=.08

def at(values,t,step):
    pos=t/step;i=int(np.floor(pos))
    if i<0 or i+1>=len(values):return 0.
    return float(values[i]*(1-pos+i)+values[i+1]*(pos-i))

def vocal_guard(vocals,mix,start,end,step=.1):
    if not (np.isfinite(start) and np.isfinite(end) and end>start):return None
    lo=max(0,int(np.floor(start/step)));hi=int(np.ceil(end/step))
    if hi>len(vocals) or hi>len(mix) or hi-lo<5:return None
    voice=np.asarray(vocals[lo:hi]);original=np.asarray(mix[lo:hi])
    if not np.isfinite(voice).all() or not np.isfinite(original).all():return None
    ratio=voice/np.maximum(original,.003)
    return {'start':round(start,4),'end':round(end,4),'frames':len(voice),
        'maxVocalRms':float(np.max(voice)),'maxRelativeVocal':float(np.max(ratio)),
        'clear':bool(np.max(voice)<VOCAL_ABSOLUTE and np.max(ratio)<VOCAL_RELATIVE),
        'method':'spleeter-2stems-energy-v1','notHumanVerified':True}

def measured_bars(beats,downbeats,beat_p,down_p,onset,step=.02):
    beats=np.asarray(beats);bars=[]
    if not len(beats):return bars
    # Refine only to real PCM attacks, retaining model locations separately.
    observed=[]
    for t in beats:
        lo=max(0,round((t-.06)/step));hi=min(len(onset),round((t+.06)/step)+1)
        if hi<=lo:continue
        peak=lo+int(np.argmax(onset[lo:hi]));actual=peak*step
        if onset[peak]>=.25 and (not observed or actual-observed[-1]['t']>.20):
            observed.append({'t':actual,'modelT':float(t),'p':at(beat_p,t,.02)})
    for index,start in enumerate(beats):
        # Independently thresholding downbeat peaks produces extra "bars"
        # on isolated snare accents. Infer a coherent local metrical phase
        # from the complete neural evidence, comparing 3/4/5-beat hypotheses.
        lo=max(0,index-12);hi=min(len(beats),index+17)
        if hi-lo<16:continue
        values=np.clip(np.array([at(down_p,t,.02) for t in beats[lo:hi]]),.001,.999)
        hypotheses=[]
        for meter in (3,4,5):
            for phase in range(meter):
                selected=(np.arange(lo,hi)-index-phase)%meter==0
                score=float(np.sum(np.where(selected,np.log(values),np.log1p(-values))))
                hypotheses.append((score,meter,phase))
        hypotheses.sort(reverse=True);winner=hypotheses[0]
        confidence=1/sum(np.exp(max(-80,x[0]-winner[0])) for x in hypotheses)
        if winner[2]!=0 or confidence<.8:continue
        meter=winner[1]
        if index+meter>=len(beats):continue
        end=beats[index+meter];raw=beats[index:index+meter]
        gaps=np.diff(np.r_[raw,end]);period=float(np.median(gaps))
        if not .285<=period<=1.09 or np.max(abs(gaps-period))>period*.08:continue
        hits=[r for r in observed if start-.06<=r['modelT']<end-.06]
        # Metrical beats and audible drum attacks are different evidence.
        # Syncopation need not sound every quarter note. Only observed hits
        # are exported for the later independent >=90% pulse matcher.
        if len(hits)<meter-1:continue
        probabilities=np.array([max(.001,at(beat_p,t,.02)) for t in raw])
        bp=float(np.exp(np.mean(np.log(probabilities))))
        dp=min(at(down_p,start,.02),at(down_p,end,.02))
        if bp<.70 or dp<.5:continue
        bars.append({'start':float(start),'end':float(end),'beats':[r['t'] for r in hits],
            'modelBeats':raw.tolist(),'beatProbabilityMin':float(np.min(probabilities)),
            'beatProbabilityGeometricMean':bp,'downbeatProbabilityMin':dp,
            'beatsPerBar':meter,'metricalPhaseConfidence':confidence,
            'bpm':60/period,'gridRms':float(np.sqrt(np.mean((gaps-period)**2)))})
    return bars

def summarize_structure(bars,chroma,mfcc,rms,bass,frame_times,vocals=None):
    features=[]
    for bar in bars:
        mask=(frame_times>=bar['start'])&(frame_times<bar['end'])
        if not np.any(mask):return [],[]
        c=np.mean(chroma[:,mask],axis=1);m=np.mean(mfcc[:,mask],axis=1)
        v=np.mean(vocals[max(0,round(bar['start']*10)):round(bar['end']*10)]) if vocals is not None else 0
        features.append(np.r_[c,m[1:],np.log(max(1e-5,float(np.mean(rms[mask])))),float(np.mean(bass[mask])),v])
    if len(features)<9:return [],[]
    x=np.asarray(features)
    # Raw MFCC c0/energy otherwise dominates cosine similarity and hides
    # real arrangement changes. Whiten timbre dimensions independently.
    x[:,:12]=.7*x[:,:12]/(np.linalg.norm(x[:,:12],axis=1,keepdims=True)+1e-9)
    x[:,12:23]=np.clip((x[:,12:23]-np.median(x[:,12:23],axis=0))/(np.std(x[:,12:23],axis=0)+1),-3,3)
    x[:,12:23]=.7*x[:,12:23]/(np.linalg.norm(x[:,12:23],axis=1,keepdims=True)+1e-9)
    x[:,-3:]=(x[:,-3:]-np.mean(x[:,-3:],axis=0))/(np.std(x[:,-3:],axis=0)+.05)
    x[:,-3:]*=.3;x=x/(np.linalg.norm(x,axis=1,keepdims=True)+1e-9)
    similarity=x@x.T
    novelty=np.zeros(len(bars))
    # Foote-style local checkerboard. Discontinuous/uncertain bars cannot
    # acquire a boundary merely by being adjacent in this filtered list.
    for i in range(2,len(bars)-2):
        chain=bars[i-2:i+2]
        if any(abs(a['end']-b['start'])>.08 or a['beatsPerBar']!=b['beatsPerBar'] for a,b in zip(chain,chain[1:])):continue
        aa=similarity[i-2:i,i-2:i].mean();bb=similarity[i:i+2,i:i+2].mean()
        cross=similarity[i-2:i,i:i+2].mean();novelty[i]=max(0,(aa+bb)/2-cross)
    positive=novelty[novelty>.025]
    threshold=max(.08,float(np.quantile(positive,.65))) if len(positive) else 1.
    boundaries=[]
    for i,value in enumerate(novelty):
        if value<threshold or value<max(novelty[max(0,i-1):i+2]):continue
        if boundaries and i-boundaries[-1]['barIndex']<4:
            if value<=boundaries[-1]['novelty']:continue
            boundaries.pop()
        boundaries.append({'t':bars[i]['start'],'barIndex':i,'novelty':float(value),
            'method':'bar-synchronous-harmonic-timbre-energy-novelty','semanticLabel':None})
    phrases=[]
    for a in boundaries:
        for b in boundaries:
            count=b['barIndex']-a['barIndex']
            if count not in (4,8,16):continue
            chain=bars[a['barIndex']:b['barIndex']]
            if any(abs(x['end']-y['start'])>.08 or x['beatsPerBar']!=y['beatsPerBar'] for x,y in zip(chain,chain[1:])):continue
            phrases.append({'start':a['t'],'end':b['t'],'bars':count,
                'boundaryScore':min(a['novelty'],b['novelty']),
                'method':'two-observed-structural-boundaries','humanVerified':False})
    return boundaries,phrases

def candidate_windows(bars,boundaries,phrases,vocals,mix,duration):
    boundary={b['barIndex']:b for b in boundaries};windows=[]
    # Phrase ends/section changes can be far inside the file. No dependency
    # on duration-16, and no arbitrary every-four-bars cut is emitted.
    spans=[]
    for anchor,bound in boundary.items():
        for count in (4,8):
            spans.append((anchor,anchor+count,'entry',bound))
            for after in (0,1):spans.append((anchor+after-count,anchor+after,'exit',bound))
    for begin,stop,role,bound in spans:
            count=stop-begin
            if begin<0:continue
            if stop>len(bars):continue
            chain=bars[begin:stop]
            if not chain or not 4.5<=chain[-1]['end']-chain[0]['start']<=16:continue
            if any(abs(a['end']-b['start'])>.08 or a['beatsPerBar']!=b['beatsPerBar'] for a,b in zip(chain,chain[1:])):continue
            start,end=chain[0]['start'],chain[-1]['end']
            if start<0 or end>duration-.15:continue
            phrase=next((p for p in phrases if abs(p['end']-end)<.08 and p['start']<=start+.08),None)
            # Entry and exit carry separate voice tests. A vocal phrase may
            # remain audible early in the outgoing window, but its last two
            # seconds must be quiet before any fade/cut is permitted.
            full=vocal_guard(vocals,mix,start,end+.7)
            tail=vocal_guard(vocals,mix,end-2,end+.35)
            common={'start':round(start,4),'end':round(end,4),'bars':count,
                'beats':[round(t,4) for b in chain for t in b['beats']],
                'downbeats':[round(b['start'],4) for b in chain]+[round(end,4)],
                'bpm':float(np.median([b['bpm'] for b in chain])),
                'beatsPerBar':chain[0]['beatsPerBar'],
                'metricalPhaseConfidence':min(b['metricalPhaseConfidence'] for b in chain),
                'beatProbabilityMin':min(b['beatProbabilityMin'] for b in chain),
                'downbeatProbabilityMin':min(b['downbeatProbabilityMin'] for b in chain),
                'boundaryNovelty':bound['novelty'],'phrase':phrase,
                'semanticLabel':None,'sectionAnchor':bound['t'],'endGuard':tail,'fullGuard':full}
            if role=='entry' and full:windows.append({**common,'role':'entry'})
            if role=='exit' and start>=26 and duration-end>=8 and tail and tail['clear']:
                windows.append({**common,'role':'exit'})
    # Keep distinct, strongest alternatives distributed across the recording.
    selected=[]
    for role in ('entry','exit'):
        ranked=sorted((w for w in windows if w['role']==role),key=lambda w:(bool(w['phrase']),w['boundaryNovelty']),reverse=True)
        for w in ranked:
            if sum(v['role']==role for v in selected)>=6:break
            if any(v['role']==role and abs(v['end']-w['end'])<2 for v in selected):continue
            selected.append(w)
    return selected
