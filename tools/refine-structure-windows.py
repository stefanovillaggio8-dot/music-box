#!/usr/bin/env python3
"""Reuse pinned whole-file model evidence; re-extract only new PCM windows.

No neural re-inference, fabricated pulses or new semantic labels. Each new
window is decoded from the original SHA-verified recording before compiling.
"""
import argparse,copy,importlib.util,json,pathlib,time
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1]
def module(name,file):
    spec=importlib.util.spec_from_file_location(name,ROOT/'tools'/file);result=importlib.util.module_from_spec(spec);spec.loader.exec_module(result);return result
core=module('structure','dj-structure-core.py');pcm=module('pcm','dj-transition-features.py');audit=module('audit','audit-full-beat-audio.py')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ('features','output','cache'):parser.add_argument('--'+name,required=True)
    parser.add_argument('--shard',default='0/1');args=parser.parse_args()
    index=json.loads((ROOT/'dj-deep-analysis.json').read_text());all_entries={}
    for file in pathlib.Path(args.features).rglob('structure-*.json'):
        shard=json.loads(file.read_text())
        if shard.get('errors'):raise ValueError('Incomplete source artifact '+str(file))
        for key,e in shard['entries'].items():
            if key in all_entries or e['sha']!=index['entries'][key]['sha'] or not e.get('modelSha256'):raise ValueError('Unbound structure source')
            all_entries[key]=e
    shard,parts=map(int,args.shard.split('/'))
    if not 0<=shard<parts<=32:raise ValueError('Invalid shard')
    keys=[key for i,key in enumerate(sorted(k for k,e in index['entries'].items() if e['status']=='ok')) if i%parts==shard]
    if not all(key in all_entries for key in keys):raise ValueError('Incomplete source evidence for selected shard')
    output=pathlib.Path(args.output);output.parent.mkdir(parents=True,exist_ok=True)
    cache=pathlib.Path(args.cache);cache.mkdir(parents=True,exist_ok=True);entries={};errors=[]
    audit.SR=pcm.SR
    for key in keys:
        try:
            at=time.monotonic();e=copy.deepcopy(all_entries[key]);old=e['windows']
            windows=core.candidate_windows(e['reliableBars'],e['boundaries'],e['phraseHypotheses'],e['vocalRms'],e['mixRms'],e['duration'])
            small=None;new_count=0
            for number,w in enumerate(windows):
                prior=next((v for v in old if v['start']==w['start'] and v['end']==w['end']),None)
                if prior:w['pcm']=prior['pcm']
                else:
                    if small is None:
                        source=audit.source(key,e['sha'],cache);small=audit.decode(source,0,e['duration']+1).mean(axis=1)
                    start=max(0,w['start']-.18);end=min(len(small)/pcm.SR,w['end']+.85)
                    part=pcm.section(small[round(start*pcm.SR):round(end*pcm.SR)],start,w['bpm'])
                    part['beats']=w['beats'];part.pop('grids',None);w['pcm']=part;new_count+=1
                w['id']=str(number);a=max(0,int(np.floor(w['start']/.1)));b=int(np.ceil((w['end']+.7)/.1))
                w['vocalRms']=e['vocalRms'][a:b];w['mixRms']=e['mixRms'][a:b];w['vocalStart']=a*.1
            e['windows']=windows;e['windowSearchVersion']=2;entries[key]=e
            print(json.dumps({'key':key,'windows':len(windows),'newPcmWindows':new_count,
                'exits':sum(w['role']=='exit' for w in windows),'seconds':round(time.monotonic()-at,2)}),flush=True)
        except Exception as error:
            errors.append({'key':key,'error':str(error).split('?')[0][:300]});print('ERROR',key,type(error).__name__,flush=True)
        output.write_text(json.dumps({'version':1,'windowSearchVersion':2,'entries':entries,'errors':errors},separators=(',',':'))+'\n')
    if errors:raise SystemExit(1)
if __name__=='__main__':main()
