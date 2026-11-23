"""Reanalyse initial/terminal beat frames, reusing whole-file vocal evidence.

Sparse bar candidates retain exactly the original neural phase/beat gates.
They do NOT earn beatmatch certification; the unchanged full original-PCM
and actual-render pulse checks decide that later. Original audio stays intact.
"""
import argparse,hashlib,importlib.util,json,os,pathlib,time,urllib.request,subprocess,tempfile
import numpy as np,torch,soxr,librosa
from beat_this.inference import Audio2Frames
from beat_this.model.postprocessor import Postprocessor
ROOT=pathlib.Path(__file__).resolve().parents[1]
def module(name,file):
 s=importlib.util.spec_from_file_location(name,ROOT/'tools'/file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
pcm=module('pcm','dj-transition-features.py');core=module('core','dj-structure-core.py');audio=module('audio','audit-full-beat-audio.py')
MODEL_SHA='8c328b45f59d8dd3dff219253ff6a8d6482be57d0133a29140e2febbf8eb8331'
def same_evidence(previous,sha,view):
 return (previous.get('sha')==sha and previous.get('modelSha256')==MODEL_SHA
         and previous.get('analysisView','original')==view)

def merge_roles(previous,identity,result):
 # A request for one section must not discard an already measured other
 # section. Changed audio/model/view must never inherit old role evidence.
 merged={**(previous if same_evidence(previous,identity['sha'],identity['analysisView']) else {}),**identity,**result}
 merged['analysisRoles']=sorted(role for role in ('intro','outro') if role in merged)
 return merged

def cached_source(cache,sha):
 source=pathlib.Path(cache)/(sha+'.mp3');content=source.read_bytes()
 if hashlib.sha1(b'blob '+str(len(content)).encode()+b'\0'+content).hexdigest()!=sha:raise ValueError('Cached original changed')
 return source

def main():
 p=argparse.ArgumentParser(description=__doc__)
 for k in ('cache','models','output'):p.add_argument('--'+k,required=True)
 p.add_argument('--shard',default='0/1');p.add_argument('--limit',type=int,default=0)
 p.add_argument('--view',choices=('original','percussive'),default='original')
 p.add_argument('--keys',help='JSON list of SHA-bound index keys; never changes library membership')
 p.add_argument('--roles',default='intro,outro',help='Analyze only these named sections; default retains both legacy roles')
 p.add_argument('--ste-cases',help='Validate a bounded current Ste case list before any original/model access')
 args=p.parse_args()
 roles=set(args.roles.split(','))
 if not roles or not roles<={'intro','outro'}:raise ValueError('Unknown original-audio role')
 guarded_index=None
 if args.ste_cases:
  if not args.keys:raise ValueError('A bounded --keys selection is required for Ste research')
  with tempfile.TemporaryDirectory(prefix='musicbox-ste-edge-') as tmp:
   proof=pathlib.Path(tmp)/'scope.json'
   subprocess.run(['node','tools/ste-research-scope.cjs','--cases='+str(pathlib.Path(args.ste_cases).resolve()),'--output='+str(proof)],cwd=ROOT,check=True,capture_output=True,timeout=30)
   valid=json.loads(proof.read_text())
  allowed={c[k] for c in valid['cases'] for k in ('from','to')}
  selected=json.loads(pathlib.Path(args.keys).read_text(encoding='utf8'))
  if not isinstance(selected,list) or not selected or len(set(selected))!=len(selected) or any(k not in allowed for k in selected):raise ValueError('Only sources in the validated Ste cases are allowed')
  index_bytes=(ROOT/'dj-deep-analysis.json').read_bytes()
  if hashlib.sha256(index_bytes).hexdigest()!=valid['scope']['runtimeEvidence']['indexSha256']:raise ValueError('Source index changed after validating current Ste membership')
  guarded_index=json.loads(index_bytes);index_for_scope=guarded_index['entries']
  for key in selected:
   if not (pathlib.Path(args.cache)/(index_for_scope[key]['sha']+'.mp3')).exists():raise ValueError('Guarded research is offline-only: missing original '+key)

 model_root=pathlib.Path(args.models).resolve();checkpoint=model_root/'torch/hub/checkpoints/beat_this-final0.ckpt'
 if not checkpoint.exists() or hashlib.sha256(checkpoint.read_bytes()).hexdigest()!=MODEL_SHA:
  if args.ste_cases:raise ValueError('Guarded research may not download a missing/unverified model')
  checkpoint.parent.mkdir(parents=True,exist_ok=True)
  urls=['https://cloud.cp.jku.at/public.php/dav/files/7ik4RrBKTS273gp/final0.ckpt',
   'https://huggingface.co/OpenStems/OpenStems-Models/resolve/f10f75fa1edf642e63291c6671806b9ca9622986/ultra-20261105/assets/'+MODEL_SHA+'/beat_this-final0.ckpt']
  content=None
  for url in urls:
   try:
    with urllib.request.urlopen(url,timeout=120) as response:candidate=response.read(100*1024*1024+1)
    if len(candidate)>100*1024*1024 or hashlib.sha256(candidate).hexdigest()!=MODEL_SHA:raise ValueError('Untrusted model download')
    content=candidate;break
   except OSError as error:print('Model endpoint unavailable:',type(error).__name__,flush=True)
  if content is None:raise ValueError('No SHA-verified model available')
  temporary=checkpoint.with_suffix('.ckpt.tmp');temporary.write_bytes(content);temporary.replace(checkpoint)
 if hashlib.sha256(checkpoint.read_bytes()).hexdigest()!=MODEL_SHA:raise ValueError('Model changed')
 os.environ['TORCH_HOME']=str(model_root/'torch');torch.set_num_threads(2);model=Audio2Frames(str(checkpoint),device='cpu')
 index=guarded_index if guarded_index is not None else json.loads((ROOT/'dj-deep-analysis.json').read_text(encoding='utf-8'));shard,parts=map(int,args.shard.split('/'));audio.SR=pcm.SR
 pathlib.Path(args.cache).mkdir(parents=True,exist_ok=True)
 keys=[k for i,k in enumerate(sorted(k for k,e in index['entries'].items() if e['status']=='ok')) if i%parts==shard]
 if args.keys:
  selected=json.loads(pathlib.Path(args.keys).read_text(encoding='utf-8-sig'))
  if not isinstance(selected,list) or any(k not in index['entries'] for k in selected):raise ValueError('Unknown source key')
  keys=[k for k in keys if k in selected]
 if args.limit:keys=keys[:args.limit]
 output=pathlib.Path(args.output);output.parent.mkdir(parents=True,exist_ok=True);entries={};errors=[]
 if output.exists():entries=json.loads(output.read_text()).get('entries',{})
 for key in keys:
  e=index['entries'][key]
  if same_evidence(entries.get(key,{}),e['sha'],args.view) and all(role in entries[key] for role in roles):continue
  try:
   at=time.monotonic()
   if args.ste_cases:
    # A cache file disappearing after the initial guard must fail closed,
    # never fall through to the legacy downloader.
    source=cached_source(args.cache,e['sha'])
   else:source=audio.source(key,e['sha'],pathlib.Path(args.cache))
   duration=e['duration'];result={}
   for role,start,seconds in [('intro',0,24),('outro',max(0,duration-48),48.1)]:
    if role not in roles:continue
    samples=audio.decode(source,start,seconds).mean(axis=1)
    # Alternate evidence only. PCM contours, harmony and all downstream
    # audio checks still use the unmodified original, never this view.
    model_samples=samples
    if args.view=='percussive':
     _,model_samples=librosa.effects.hpss(samples,margin=(2.,2.))
     model_samples=model_samples*(.95/max(.01,float(np.max(np.abs(model_samples)))))
    signal=soxr.resample(model_samples,pcm.SR,22050);beat,down=model(signal,22050);beats,db=Postprocessor()(beat,down)
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
   identity={'sha':e['sha'],'duration':duration,'modelSha256':MODEL_SHA,'analysisView':args.view,
    'pcmFromUnmodifiedOriginal':True,'posteriorIsCalibratedAccuracy':False}
   entries[key]=merge_roles(entries.get(key,{}),identity,result)
   print(json.dumps({'key':key,'seconds':round(time.monotonic()-at,2),'introBars':len(result.get('intro',{}).get('bars',[])),'outroBars':len(result.get('outro',{}).get('bars',[]))}),flush=True)
  except Exception as ex:errors.append({'key':key,'error':str(ex)[:200]});print('ERROR',key,str(ex)[:180],flush=True)
  output.write_text(json.dumps({'version':1,'entries':entries,'errors':errors},separators=(',',':'))+'\n',encoding='utf-8')
 if errors:raise SystemExit(1)
if __name__=='__main__':main()
