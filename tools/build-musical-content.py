#!/usr/bin/env python3
"""Bind whole-recording content evidence to original SHA, never semantic labels.

This does not certify choruses/solos/drops. Future vocals and novelty veto
cuts; missing evidence is unknown. A separate runtime policy protects the
amount and nature of the original recording that would be skipped.
"""
import argparse,json,pathlib,math
ROOT=pathlib.Path(__file__).resolve().parents[1]

def summarize(source,entry,extra_cuts=()):
    step=source['vocalStep'];voice=source['vocalRms'];mix=source['mixRms']
    audible=min(entry['duration'],max(float(entry.get('last',entry['duration'])),0))
    first=max(0,float(entry.get('first',0)))
    count=min(len(voice),len(mix));valid=step==.1 and count*step>=audible-.15 and all(math.isfinite(v) for v in voice+mix)
    regions=[];start=None;last=None
    for i in range(count):
        active=mix[i]>=.003 and (voice[i]>=.004 or voice[i]/max(mix[i],.003)>=.08)
        if active:
            if start is None:start=i
            last=i
        elif start is not None and i-last>3:
            if (last+1-start)*step>=.2:regions.append([round(start*step,3),round((last+1)*step,3)])
            start=None
    if start is not None and (last+1-start)*step>=.2:regions.append([round(start*step,3),round((last+1)*step,3)])
    cuts=sorted(set(round(w['end'],4) for w in source['windows'] if w['role']=='exit')|set(round(t,4) for t in extra_cuts))
    evidence=[]
    for end in cuts:
        # Absolute PCM RMS, not a normalized novelty or model probability.
        pre=mix[max(0,int((end-8)/step)):int(end/step)]
        after=mix[int(end/step):int(audible/step)]
        prior=math.sqrt(sum(v*v for v in pre)/max(1,len(pre)))
        following=math.sqrt(sum(v*v for v in after)/max(1,len(after)))
        blocks=[math.sqrt(sum(v*v for v in after[i:i+10])/len(after[i:i+10])) for i in range(0,len(after),10)]
        evidence.append({'end':end,'previousRms':round(prior,7),'remainingRms':round(following,7),
          'remainingEnergyRatio':round(following/max(prior,.003),5),
          'maximumRemainingBlockRatio':round(max(blocks,default=0)/max(prior,.003),5)})
    return {'version':1,'sourceSha':entry['sha'],'sourceDuration':entry['duration'],
      'audibleStart':first,'audibleEnd':audible,'wholeCoverageVerified':valid,
      'modelEvidenceNotHumanTruth':True,'semanticSectionsVerified':False,
      'vocalRegions':regions,'boundaryTimes':[round(b['t'],4) for b in source['boundaries']],
      'phraseHypotheses':[{'start':p['start'],'end':p['end'],'bars':p['bars']} for p in source['phraseHypotheses']],
      'cutEvidence':evidence}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--index',default=str(ROOT/'dj-deep-analysis.json'));p.add_argument('--features',required=True);p.add_argument('--output',required=True)
    args=p.parse_args();index=json.loads(pathlib.Path(args.index).read_text(encoding='utf-8'));sources={}
    for file in pathlib.Path(args.features).rglob('structure-*.json'):
        d=json.loads(file.read_text())
        if d.get('errors'):raise ValueError('Incomplete structural source')
        for key,e in d['entries'].items():
            if key in sources:raise ValueError('Duplicate source')
            sources[key]=e
    count=0
    for key,e in index['entries'].items():
        if e.get('status')!='ok':continue
        s=sources.get(key)
        if not s or s['sha']!=e['sha'] or abs(s['duration']-e['duration'])>1.5:raise ValueError('Unbound source '+key)
        ends=[cue['end'] for record in e.get('structuralBeatPlans',{}).values() for cue in record.get('cues',[record['cue']])]
        e['musicalContent']=summarize(s,e,ends);count+=1
    output=pathlib.Path(args.output)
    output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(index,separators=(',',':'))+'\n',encoding='utf-8',newline='\n')
    print(json.dumps({'sources':count,'wholeCoverage':all(e.get('musicalContent',{}).get('wholeCoverageVerified') for e in index['entries'].values() if e.get('status')=='ok')}))

if __name__=='__main__':main()
