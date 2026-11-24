"""Human-listening context for the new frozen pair; not a browser capture."""
import pathlib,json,subprocess,hashlib,sys
import numpy as np
root=pathlib.Path.cwd();here=pathlib.Path(__file__).resolve().parent
folder=pathlib.Path(sys.argv[1]);assert not folder.exists(),'Preserve prior samples'
fixture=json.loads((here/'new-pair-shadow.json').read_bytes())
subprocess.run(['node','tools/ste-research-scope.cjs','--cases='+str(here/'cases.json'),'--output='+str(folder/'selection.json')],check=True,capture_output=True)
index=json.loads((root/'dj-deep-analysis.json').read_bytes())['entries'];cue=fixture['record']['cue'];pre=7;sr=48000
files=[]
for key in [fixture['from'],fixture['to']]:
 p=root.parent/'original-mp3'/(index[key]['sha']+'.mp3');raw=p.read_bytes()
 assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==index[key]['sha'];files.append(p)
def decode(p,start,seconds):
 return np.frombuffer(subprocess.check_output(['ffmpeg','-nostdin','-v','error','-i',str(p),'-ss',str(start),'-t',str(seconds),'-ac','2','-ar',str(sr),'-f','f32le','pipe:1']),dtype='<f4').reshape(-1,2)
source=decode(files[0],cue['begin']-pre,pre+cue['fade']+.02);target=decode(files[1],0,cue['fade']+2)
offset=pre*sr;mix=np.zeros((offset+len(target),2),dtype=np.float32);mix[:len(source)]+=source;mix[offset:]+=target
rawfile=folder/'context.f32';rawfile.write_bytes(mix.astype('<f4').tobytes())
# Context includes the original loud master BEFORE the certified quiet suffix.
# A common listening-export gain avoids clipping that context in the encoder;
# it does not change the unity-gain transition measurements or application.
subprocess.run(['ffmpeg','-nostdin','-v','error','-f','f32le','-ac','2','-ar',str(sr),'-i',str(rawfile),'-af','volume=-3dB','-c:a','libmp3lame','-q:a','2',str(folder/'gilgamesh-grignani-listening-minus3db.mp3')],check=True)
(folder/'preview.json').write_bytes((json.dumps({'originalSourceFrom':cue['begin']-pre,'incomingStartsAt':pre,'incomingEntry':0,'sampleRate':sr,'componentUnityGains':True,'exportCommonGainDb':-3,'applicationGainChanged':False,'notBrowserCapture':True,'humanListeningPerformed':False,'originalContextSamplePeak':float(np.max(np.abs(mix)))},indent=2)+'\n').encode())
