import json,pathlib,importlib.util,sys
import numpy as np
root=pathlib.Path.cwd();out=root.parent/'structural-20261115';index=json.loads((root/'dj-deep-analysis.json').read_text(encoding='utf8'))
scopes=[json.loads((root.parent/'architecture-20261114'/f).read_text(encoding='utf8')) for f in ['scope-Ste.json','gym-scope.json']];keys={r['key'] for s in scopes for r in s['tracks']}
source=(root/'tools/dj-structure-core.py').read_text(encoding='utf8');long={};exec(source.replace('lo=max(0,index-12);hi=min(len(beats),index+17)','lo=max(0,index-32);hi=min(len(beats),index+33)'),long)
entries={};stats=[]
for file in (root.parent/'profile-coverage/cloud-edges').rglob('edge-*.json'):
 for key,e in json.loads(file.read_text(encoding='utf8'))['entries'].items():
  if key not in keys:continue
  x=json.loads(json.dumps(e))
  for role in ['intro','outro']:
   p=x[role];start=p['frameStart'];pc=p['pcm'];onset=np.zeros(len(p['beatPosterior']));offset=round((pc['start']-start)/.02);hi=min(len(onset),offset+len(pc['onset']));onset[offset:hi]=pc['onset'][:hi-offset]
   bars=long['measured_bars'](np.array(p['beats'])-start,[],p['beatPosterior'],p['downbeatPosterior'],onset,sparse_candidates=True)
   for b in bars:
    for f in ['start','end']:b[f]+=start
    for f in ['beats','modelBeats']:b[f]=[v+start for v in b[f]]
   stats.append({'key':key,'role':role,'before':len(p['bars']),'after':len(bars)})
   p['bars']=bars
  entries[key]=x
p=out/'long-context';p.mkdir(exist_ok=True);(p/'edge-0.json').write_text(json.dumps({'entries':entries,'errors':[]},separators=(',',':')),encoding='utf8')
(out/'long-context-stats.json').write_text(json.dumps(stats,indent=2),encoding='utf8')
print(len(entries),'recordings',sum(x['after']-x['before'] for x in stats),'net bars')
