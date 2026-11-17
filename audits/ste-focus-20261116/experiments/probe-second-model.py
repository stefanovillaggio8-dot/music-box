import pathlib,json,importlib.util,hashlib,time
import numpy as np,torch,soxr
from beat_this.inference import Audio2Frames
from beat_this.model.postprocessor import Postprocessor
root=pathlib.Path.cwd();work=root.parent/'ste-focus-20261116'
def module(name,file):
 s=importlib.util.spec_from_file_location(name,root/'tools'/file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
core=module('core','dj-structure-core.py');audio=module('audio','audit-full-beat-audio.py')
index=json.loads((root/'dj-deep-analysis.json').read_text(encoding='utf8'))['entries'];keys=json.loads((work/'model-sample.json').read_text())['keys'];edges={}
for f in (root.parent/'profile-coverage/cloud-edges').rglob('edge-*.json'):edges.update(json.loads(f.read_text())['entries'])
modelpath=root.parent/'models/torch/hub/checkpoints/beat_this-final1.ckpt';sha=hashlib.sha256(modelpath.read_bytes()).hexdigest();assert sha=='365b553f43750717c907f32fbc42910f3b264d616654583df6e44472c93ead80'
torch.set_num_threads(2);model=Audio2Frames(str(modelpath),device='cpu');audio.SR=22050
output=work/'seed1-edges/edge-0.json';output.parent.mkdir(exist_ok=True);entries=json.loads(output.read_text()).get('entries',{}) if output.exists() else {}
for key in keys:
 if key in entries:continue
 at=time.monotonic();e=index[key];source=audio.source(key,e['sha'],root.parent/'original-mp3');result={}
 for role,start,seconds in [('intro',0,24),('outro',max(0,e['duration']-48),48.1)]:
  samples=audio.decode(source,start,seconds).mean(axis=1);beat,down=model(samples,22050);beats,db=Postprocessor()(beat,down)
  p=edges[key][role]['pcm'];offset=round((p['start']-start)/.02);onset=np.zeros(len(beat));hi=min(len(onset),offset+len(p['onset']));onset[offset:hi]=p['onset'][:hi-offset]
  bars=core.measured_bars(beats,db,beat.sigmoid().numpy(),down.sigmoid().numpy(),onset,sparse_candidates=True)
  for b in bars:
   for f in ('start','end'):b[f]+=start
   for f in ('beats','modelBeats'):b[f]=[t+start for t in b[f]]
  result[role]={'pcm':p,'bars':bars,'beats':[float(t)+start for t in beats],'frameStart':start,'frameStep':.02,'beatPosterior':beat.sigmoid().tolist(),'downbeatPosterior':down.sigmoid().tolist()}
 entries[key]={'sha':e['sha'],'duration':e['duration'],'modelSha256':sha,'analysisView':'independent-seed1','pcmFromUnmodifiedOriginal':True,'posteriorIsCalibratedAccuracy':False,**result}
 output.write_text(json.dumps({'version':1,'entries':entries,'errors':[]},separators=(',',':')))
 print(json.dumps({'key':key,'introBars':len(result['intro']['bars']),'outroBars':len(result['outro']['bars']),'seconds':round(time.monotonic()-at,2)}),flush=True)
