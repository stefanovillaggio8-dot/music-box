from pathlib import Path
import json,hashlib,subprocess,numpy as np
from scipy.signal import resample_poly,butter,sosfiltfilt
repo=Path.cwd();w=repo.parent/'structural-20261115';out=repo.parent.parent/'outputs/music-box-ritmo-code-20261115';out.mkdir(parents=True,exist_ok=True)
d=json.loads((repo/'dj-deep-analysis.json').read_text(encoding='utf8'));inventory=json.loads((w/'listening-routed-final.json').read_text(encoding='utf8'))['inventories'];proof=[]
def decode(file,at=None,seconds=None):
 cmd=['ffmpeg','-nostdin','-v','error','-i',str(file)]
 if at is not None:cmd+=['-ss',str(at)]
 if seconds is not None:cmd+=['-t',str(seconds)]
 return np.frombuffer(subprocess.run(cmd+['-ac','2','-ar','48000','-f','f32le','pipe:1'],capture_output=True,check=True).stdout,dtype='<f4').reshape(-1,2).copy()
for inv in inventory:
 for item in inv.get('partial',[]):
  sha=item['commonAssetSha'];matches=[]
  for key,e in d['entries'].items():
   for p in e.get('structuralBeatPlans',{}).values():
    for cue in p.get('cues',[p.get('cue')]):
     if cue and cue.get('composite',{}).get('sha256')==sha:matches.append((key,p,cue))
  assert matches;key,p,cue=matches[0];c=cue['composite'];assert c['sha256']==hashlib.sha256((repo/c['path']).read_bytes()).hexdigest()
  common=decode(repo/c['path']);prefixEnd=cue['begin']-c['preRoll'];prefixStart=max(0,prefixEnd-8)
  prefix=decode(repo.parent/'original-mp3'/(cue['sourceSha']+'.mp3'),prefixStart,prefixEnd-prefixStart)
  continuationAt=c['handoffPosition']+len(common)/48000-c['preRoll']-c['nativeHandoffAt']
  continuation=decode(repo.parent/'original-mp3'/(cue['targetSha']+'.mp3'),continuationAt,4)
  samples=np.concatenate([prefix,common,continuation]);peak=float(np.max(np.abs(resample_poly(samples,4,1,axis=0))));gain=min(1,.85/max(.001,peak))
  display='Gym' if 'gym' in inv['profile'].lower() else inv['profile'];tag=display+'-'+item['from'].replace('b-track-','')+'-'+item['to'].replace('b-track-','');encoded=out/(tag+'-contesto.mp3')
  subprocess.run(['ffmpeg','-nostdin','-y','-v','error','-f','f32le','-ar','48000','-ac','2','-i','pipe:0','-c:a','libmp3lame','-b:a','192k',str(encoded)],input=(samples*gain).astype('<f4').tobytes(),capture_output=True,check=True)
  actual=decode(encoded);previewPeak=float(np.max(np.abs(resample_poly(actual,4,1,axis=0))));assert previewPeak<=1
  exact=out/(tag+'-lettore.flac');exact.write_bytes((repo/c['path']).read_bytes());t=c['preRoll']+c['nativeHandoffAt']
  def energy(lo,hi,bass=False):
   signal=common[max(0,round(lo*48000)):min(len(common),round(hi*48000))]
   if bass:signal=sosfiltfilt(butter(2,[30,160],btype='bandpass',fs=48000,output='sos'),signal,axis=0)
   return float(np.sqrt(np.mean(signal**2)))
  a=energy(t-.5,t);b=energy(t+c['releaseSeconds'],t+c['releaseSeconds']+.5)
  proof.append({'profile':display,'from':item['from'],'to':item['to'],'fromTitle':item['fromTitle'],'toTitle':item['toTitle'],
   'classification':'partial rhythmic window with unmodified outgoing tail; not a complete beatmatch','exactCommonSha256':sha,'previewFile':encoded.name,'exactFile':exact.name,
   'previewUniformGain':gain,'previewTruePeak4x':previewPeak,'overlapSeconds':cue['fade'],'rhythmicSeconds':cue['structuralEvidence']['rhythmicWindow']['seconds'],
   'originalPrefixStart':prefixStart,'sourceEOF':cue['end'],'sourceReadThrough':c['sourceReadThrough'],'incomingEntry':cue['entry'],'continuationAt':continuationAt,
   'rmsHalfSecondBeforeEOF':a,'rmsHalfSecondAfterRelease':b,'levelChangeDb':float(20*np.log10(max(1e-9,b)/max(1e-9,a))),
   'bassRmsBeforeEOF':energy(t-.5,t,True),'bassRmsAfterRelease':energy(t+c['releaseSeconds'],t+c['releaseSeconds']+.5,True),
   'postRenderRhythm':c['postRenderRhythm'],'notHumanListening':True})
(out/'audio-provenance.json').write_bytes((json.dumps(proof,ensure_ascii=False,indent=2)+'\n').encode('utf8'));print(json.dumps([{k:p[k] for k in ['profile','from','to','overlapSeconds','rhythmicSeconds','levelChangeDb','previewTruePeak4x']} for p in proof]))
