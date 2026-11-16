"""Local review of REJECTED Ste candidates, never playback descriptors."""
import pathlib,json,importlib.util,subprocess,hashlib,copy
import numpy as np
from scipy.signal import resample_poly
root=pathlib.Path.cwd();work=root.parent/'ste-focus-20261116';out=work/'rejected-audio';out.mkdir(exist_ok=True)
def module(name,file):
 s=importlib.util.spec_from_file_location(name,root/'tools'/file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
audio=module('audio','audit-full-beat-audio.py');rhythm=module('rhythm','dj-rendered-rhythm.py');audio.SR=48000
index=json.loads((root/'dj-deep-analysis.json').read_text(encoding='utf8'))['entries']
diagnostics=json.loads((root.parent/'personal-20261116/Ste-baseline-windows.json').read_text())['diagnostics']['pulseRejections']
template=json.loads((root.parent/'personal-20261116/Ste-new-pilot-transient-plans.json').read_text())['plans'][0]['cue']
def score(p):
 a=np.array(p['source']['observed'])-p['begin'];b=np.array(p['target']['observed'])/p['rate'];used=set();errors=[]
 for t in b:
  if not len(a):continue
  i=int(np.argmin(abs(a-t)))
  if i not in used and abs(a[i]-t)<=.075:used.add(i);errors.append(float(a[i]-t))
 return len(errors)/max(1,len(a),len(b)),-float(np.sqrt(np.mean(np.square(errors)))) if errors else -1
rows=[]
for source,target in [(166,181),(166,250),(6,10),(102,94)]:
 akey=f'audio/songs/track-{source}.mp3';bkey=f'audio/songs/track-{target}.mp3';candidates=[p for p in diagnostics if p['from']==akey and p['to']==bkey];p=max(candidates,key=score)
 cue=copy.deepcopy(template)
 for k in ['stretchProfile','composite']:cue.pop(k,None)
 cue.update(begin=p['begin'],end=index[akey]['duration'],fade=p['fade'],entry=0,tempo=p['rate'],sourceSha=index[akey]['sha'],targetSha=index[bkey]['sha'],preservedEntrance='first-attack-033-v1',renderPreRoll=.3,renderReleaseSeconds=.9,renderGainMode='lookahead',renderPeakCeiling=.94)
 cue['structuralEvidence']={'bars':p['source']['bars'],'pulseCheck':{'source':[t-p['begin'] for t in p['source']['observed']],'target':p['target']['observed'],
 'sourceBars':[t-p['begin'] for t in p['source']['downbeats'][:-1]],'targetBars':[t/p['rate'] for t in p['target']['downbeats'][:-1]]}}
 folder=out/f'REJECTED-{source}-{target}';folder.mkdir(exist_ok=True);(folder/'cue.json').write_text(json.dumps(cue))
 oldsource=audio.source(akey,cue['sourceSha'],root.parent/'original-mp3');newsource=audio.source(bkey,cue['targetSha'],root.parent/'original-mp3')
 old=audio.decode(oldsource,p['begin']-.3,p['fade']+2.3);new=audio.decode(newsource,0,p['fade']*1.05+4)
 for name,value in [('old',old),('new',new)]:(folder/(name+'.f32')).write_bytes(value.astype('<f4').tobytes())
 run=subprocess.run(['node','tools/render-composite-mix.mjs','--rate=48000','--cue='+str(folder/'cue.json'),'--outgoing='+str(folder/'old.f32'),'--incoming='+str(folder/'new.f32'),'--output='+str(folder/'mix.f32'),'--outgoing-component='+str(folder/'a.f32'),'--incoming-component='+str(folder/'b.f32')],capture_output=True,text=True,timeout=90)
 if run.returncode:
  rows.append({'from':akey,'to':bkey,'certified':False,'renderError':run.stderr[-500:]});continue
 meta=json.loads(run.stdout.splitlines()[-1]);a=np.frombuffer((folder/'a.f32').read_bytes(),'<f4').reshape(-1,2);b=np.frombuffer((folder/'b.f32').read_bytes(),'<f4').reshape(-1,2)
 checks={str(rate):rhythm.verify(resample_poly(a,147,160,axis=0) if rate==44100 else a,resample_poly(b,147,160,axis=0) if rate==44100 else b,rate,cue,.3) for rate in [48000,44100]}
 mixed=np.frombuffer((folder/'mix.f32').read_bytes(),'<f4').reshape(-1,2);peak=float(np.max(abs(resample_poly(mixed,4,1,axis=0))));gain=min(1,.97/max(.001,peak));(folder/'preview.f32').write_bytes((mixed*gain).astype('<f4').tobytes())
 dest=out/f'REJECTED-{source}-{target}.flac'
 subprocess.run(['ffmpeg','-nostdin','-y','-v','error','-f','f32le','-ar','48000','-ac','2','-i',str(folder/'preview.f32'),'-c:a','flac',str(dest)],check=True,capture_output=True)
 rows.append({'from':akey,'to':bkey,'certified':False,'deployed':False,'originalPcmCandidateScore':score(p),'reason':'Independent whole-window pulse certificate remains mandatory; review artifact cannot authorize playback','render':meta,'postRenderRhythm':checks,'previewGainDb':float(20*np.log10(gain)),'previewSha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'localReviewFile':dest.name})
 print(json.dumps({'from':akey,'to':bkey,'accepted48000':checks['48000']['accepted'],'accepted44100':checks['44100']['accepted'],'file':str(dest)}),flush=True)
(work/'rejected-render-proof.json').write_text(json.dumps({'notPlaybackCertificates':True,'sourceScope':'Personal Ste only, no excluded playlist members','results':rows},indent=2))
