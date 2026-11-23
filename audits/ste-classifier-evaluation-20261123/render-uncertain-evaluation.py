"""One frozen uncertain-harmony window; render ONLY, never certification."""
import pathlib,json,hashlib,subprocess,sys
import numpy as np
from scipy.signal import resample_poly
ROOT=pathlib.Path.cwd();HERE=pathlib.Path(__file__).resolve().parent
out=pathlib.Path(sys.argv[1]);assert not out.exists(),'Preserve prior evidence'
subprocess.run(['node','tools/ste-research-scope.cjs','--cases='+str(HERE/'cases.json'),'--output='+str(out/'scope.json')],check=True,capture_output=True)
protocol=json.loads((HERE/'protocol.json').read_bytes());window=protocol['uncertainLongEvaluation'];g=window['geometry']
index=json.loads((ROOT/'dj-deep-analysis.json').read_bytes())['entries'];valid=json.loads((out/'scope.json').read_bytes())['cases']
assert any(c['from']==window['from'] and c['to']==window['to'] for c in valid)
cue={'begin':g['begin'],'end':g['end'],'fade':g['fade'],'entry':0,'tempo':g['rate'],
     'measuredFullBeat':False,'metricalRhythmic':False,'structuralBeat':False,'preservedFileTail':True,
     'nativeTailFullBeat':True,'preserveTail':True,'vocalFadeSeconds':0,'preservedEntrance':'vocal-handoff-foreground-v1',
     'structuralEvidence':{'vocalHandoff':window['handoff'],'vocalOverlapPolicy':'separated-vocal-handoff-v1'}}
(out/'cue.json').write_text(json.dumps(cue,indent=2)+'\n',encoding='utf8')
rate=48000
for role,key,start,seconds in [('outgoing',window['from'],g['begin']-.3,g['fade']+.34),('incoming',window['to'],0,(g['fade']+3)*max(1,g['rate']))]:
    sha=index[key]['sha'];file=ROOT.parent/'original-mp3'/(sha+'.mp3');raw=file.read_bytes()
    assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==sha
    subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(file),'-ss',str(start),'-t',str(seconds),'-ac','2','-ar',str(rate),'-f','f32le',str(out/(role+'.f32'))],check=True)
args=['node','tools/render-composite-mix.mjs','--rate='+str(rate),'--cue='+str(out/'cue.json'),
      '--outgoing='+str(out/'outgoing.f32'),'--incoming='+str(out/'incoming.f32'),
      '--outgoing-component='+str(out/'actual-outgoing.f32'),'--incoming-component='+str(out/'actual-incoming.f32'),'--output='+str(out/'mix.f32')]
result=json.loads(subprocess.check_output(args));audio=np.frombuffer((out/'mix.f32').read_bytes(),dtype='<f4').reshape(-1,2)
result['evaluationOnly']=True;result['notPlaybackCertified']=True;result['from']=window['from'];result['to']=window['to']
result['oversampledPeak']=float(np.max(np.abs(resample_poly(audio,4,1,axis=0))))
result['failedPreRenderGate']='uncertain-harmony';result['notHumanListening']=True
(out/'result.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
subprocess.run(['ffmpeg','-nostdin','-v','error','-f','f32le','-ar',str(rate),'-ac','2','-i',str(out/'mix.f32'),'-c:a','libmp3lame','-q:a','2',str(out/'evaluation.mp3')],check=True)
print(json.dumps({k:result.get(k) for k in ['peak','overlapPeak','oversampledPeak','headroom','pitchPreserved','timing','introductionExposure','evaluationOnly']}))
