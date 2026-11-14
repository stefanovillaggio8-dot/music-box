"""Reanalyse initial/terminal beat frames, reusing whole-file vocal evidence.

Sparse bar candidates retain exactly the original neural phase/beat gates.
They do NOT earn beatmatch certification; the unchanged full original-PCM
and actual-render pulse checks decide that later. Original audio stays intact.
"""
import argparse,hashlib,importlib.util,json,os,pathlib,time,urllib.request
import numpy as np,torch,soxr
from beat_this.inference import Audio2Frames
from beat_this.model.postprocessor import Postprocessor
ROOT=pathlib.Path(__file__).resolve().parents[1]
def module(name,file):
 s=importlib.util.spec_from_file_location(name,ROOT/'tools'/file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
pcm=module('pcm','dj-transition-features.py');core=module('core','dj-structure-core.py');audio=module('audio','audit-full-beat-audio.py')
MODEL_SHA='8c328b45f59d8dd3dff219253ff6a8d6482be57d0133a29140e2febbf8eb8331'
def main():
 p=argparse.ArgumentParser(description=__doc__)
 for k in ('cache','models','output'):p.add_argument('--'+k,required=True)
 p.add_argument('--shard',default='0/1');p.add_argument('--limit',type=int,default=0);args=p.parse_args()
 model_root=pathlib.Path(args.models).resolve();checkpoint=model_root/'torch/hub/checkpoints/beat_this-final0.ckpt'
 if not checkpoint.exists():
  checkpoint.parent.mkdir(parents=True,exist_ok=True)
  with urllib.request.urlopen('https://cloud.cp.jku.at/public.php/dav/files/7ik4RrBKTS273gp/final0.ckpt',timeout=120) as response:content=response.read(100*1024*1024+1)
  if len(content)>100*1024*1024 or hashlib.sha256(content).hexdigest()!=MODEL_SHA:raise ValueError('Untrusted model download')
  checkpoint.write_bytes(content)
 if hashlib.sha256(checkpoint.read_bytes()).hexdigest()!=MODEL_SHA:raise ValueError('Model changed')
 os.environ['TORCH_HOME']=str(model_root/'torch');torch.set_num_threads(2);model=Audio2Frames(str(checkpoint),device='cpu')
 index=json.loads((ROOT/'dj-deep-analysis.json').read_text(encoding='utf-8'));shard,parts=map(int,args.shard.split('/'));audio.SR=pcm.SR
 keys=[k for i,k in enumerate(sorted(k for k,e in index['entries'].items() if e['status']=='ok')) if i%parts==shard]
 if args.limit:keys=keys[:args.limit]
 output=pathlib.Path(args.output);output.parent.mkdir(parents=True,exist_ok=True);entries={};errors=[]
 if output.exists():entries=json.loads(output.read_text()).get('entries',{})
 for key in keys:
  e=index['entries'][key]
  if entries.get(key,{}).get('sha')==e['sha'] and entries[key].get('modelSha256')==MODEL_SHA:continue
  try:
   at=time.monotonic();source=audio.source(key,e['sha'],pathlib.Path(args.cache));duration=e['duration'];result={}
   for role,start,seconds in [('intro',0,24),('outro',max(0,duration-48),48.1)]:
    samples=audio.decode(source,start,seconds).mean(axis=1)
    signal=soxr.resample(samples,pcm.SR,22050);beat,down=model(signal,22050);beats,db=Postprocessor()(beat,down)
    section_start=0 if role=='intro' else max(0,duration-32)-start
    section_end=min(len(samples)/pcm.SR,20) if role=='intro' else len(samples)/pcm.SR
    section=pcm.section(samples[round(section_start*pcm.SR):round(section_end*pcm.SR)],start+section_start,e['bpm'])
    # Metrical inference needs the complete 48s onset context; absolute PCM
    # features remain the compact 20s/32s sections used by the compiler.
    if section_start:
     context=pcm.section(samples,start,e['bpm']);onset=context['onset']
    else:onset=section['onset']
    bars=core.measured_bars(beats,db,beat.sigmoid().numpy(),down.sigmoid().numpy(),onset,sparse_candidates=True)
    for b in bars:
     for field in ('start','end'):b[field]+=start
     for field in ('beats','modelBeats'):b[field]=[t+start for t in b[field]]
    result[role]={'pcm':section,'bars':bars,'beats':[float(t)+start for t in beats],
     'frameStart':start,'frameStep':.02,'beatPosterior':[round(float(v),6) for v in beat.sigmoid()],
     'downbeatPosterior':[round(float(v),6) for v in down.sigmoid()]}
   entries[key]={'sha':e['sha'],'duration':duration,'modelSha256':MODEL_SHA,'posteriorIsCalibratedAccuracy':False,**result}
   print(json.dumps({'key':key,'seconds':round(time.monotonic()-at,2),'introBars':len(result['intro']['bars']),'outroBars':len(result['outro']['bars'])}),flush=True)
  except Exception as ex:errors.append({'key':key,'error':str(ex)[:200]});print('ERROR',key,str(ex)[:180],flush=True)
  output.write_text(json.dumps({'version':1,'entries':entries,'errors':errors},separators=(',',':'))+'\n',encoding='utf-8')
 if errors:raise SystemExit(1)
if __name__=='__main__':main()
