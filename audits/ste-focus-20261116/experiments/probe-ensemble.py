import pathlib,json,importlib.util,hashlib
import numpy as np,torch
from beat_this.model.postprocessor import Postprocessor
root=pathlib.Path.cwd();work=root.parent/'ste-focus-20261116';spec=importlib.util.spec_from_file_location('core',root/'tools/dj-structure-core.py');core=importlib.util.module_from_spec(spec);spec.loader.exec_module(core)
new=json.loads((work/'seed1-edges/edge-0.json').read_text())['entries'];old={}
for f in (root.parent/'profile-coverage/cloud-edges').rglob('edge-*.json'):
 for k,e in json.loads(f.read_text())['entries'].items():
  if k in new:old[k]=e
entries={};torch.set_num_threads(2)
for key,e in new.items():
 result={}
 for role in ['intro','outro']:
  x=old[key][role];y=e[role];n=min(len(x['beatPosterior']),len(y['beatPosterior']))
  def average(field):
   a=np.clip(x[field][:n],1e-6,1-1e-6);b=np.clip(y[field][:n],1e-6,1-1e-6)
   return torch.tensor((np.log(a/(1-a))+np.log(b/(1-b)))/2,dtype=torch.float32)
  bp,dp=average('beatPosterior'),average('downbeatPosterior');beats,db=Postprocessor()(bp,dp)
  p=x['pcm'];start=x['frameStart'];offset=round((p['start']-start)/.02);onset=np.zeros(n);hi=min(n,offset+len(p['onset']));onset[offset:hi]=p['onset'][:hi-offset]
  bars=core.measured_bars(beats,db,bp.sigmoid().numpy(),dp.sigmoid().numpy(),onset,sparse_candidates=True)
  for bar in bars:
   for f in ['start','end']:bar[f]+=start
   for f in ['modelBeats','beats']:bar[f]=[v+start for v in bar[f]]
  result[role]={**x,'bars':bars,'beats':[float(t)+start for t in beats],'beatPosterior':bp.sigmoid().tolist(),'downbeatPosterior':dp.sigmoid().tolist()}
 entries[key]={**e,'analysisView':'independent-seed1',**result}
p=work/'ensemble-edges/edge-0.json';p.parent.mkdir(exist_ok=True);p.write_text(json.dumps({'version':1,'entries':entries,'errors':[]},separators=(',',':')))
print(len(entries))
