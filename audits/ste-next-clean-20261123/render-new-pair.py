"""Render only the newly admitted held-out Ste window, not old negatives."""
import pathlib,json,subprocess,hashlib,sys
import numpy as np
from scipy.signal import resample_poly
ROOT=pathlib.Path.cwd();HERE=pathlib.Path(__file__).resolve().parent
out=pathlib.Path(sys.argv[1]);assert not out.exists(),'Preserve prior evidence'
subprocess.run(['node','tools/ste-research-scope.cjs','--cases='+str(HERE/'cases.json'),'--output='+str(out/'selection.json')],capture_output=True,check=True)
p=json.loads((HERE/'protocol.json').read_bytes());index=json.loads((ROOT/'dj-deep-analysis.json').read_bytes())['entries'];source=p['source'];targets=[k for k in p['targets'] if k!='audio/songs/track-4.mp3'];assert len(targets)==1;target=targets[0]
assert any(c['from']==source['key'] and c['to']==target for c in json.loads((out/'selection.json').read_bytes())['cases'])
files={key:ROOT.parent/'original-mp3'/(index[key]['sha']+'.mp3') for key in [source['key'],target]}
for key,file in files.items():
 raw=file.read_bytes();assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==index[key]['sha']
reports=[]
for rate in [44100,48000]:
 folder=out/str(rate);folder.mkdir();pre=.3;fade=source['end']-source['begin'];post=1.8
 def decode(file,start,seconds):
  raw=subprocess.check_output(['ffmpeg','-nostdin','-v','error','-i',str(file),'-ss',str(start),'-t',str(seconds),'-ac','2','-ar',str(rate),'-f','f32le','pipe:1']);return np.frombuffer(raw,dtype='<f4').reshape(-1,2)
 a=decode(files[source['key']],source['begin']-pre,fade+pre+.02);b=decode(files[target],0,fade+post+.02)
 offset=round(pre*rate);frames=len(a)+round(post*rate);x=np.zeros((frames,2),np.float32);y=np.zeros_like(x);x[:len(a)]=a;n=min(len(b),frames-offset);y[offset:offset+n]=b[:n];mix=x+y
 for name,array in [('outgoing',x),('incoming',y),('original-incoming',b),('mix',mix)]: (folder/(name+'.f32')).write_bytes(array.astype('<f4').tobytes())
 rms=lambda a:float(np.sqrt(np.mean(np.asarray(a,np.float64)**2)))
 eof=len(a);before=rms(mix[eof-round(.5*rate):eof]);after=rms(mix[eof:eof+round(.5*rate)])
 row={'evaluationOnly':True,'notPlaybackCertified':True,'sampleRate':rate,'sourceSha':index[source['key']]['sha'],'targetSha':index[target]['sha'],
      'begin':source['begin'],'end':source['end'],'fade':fade,'entry':0,'tempo':1,'sourceGain':1,'incomingGain':1,
      'sourceUnityThroughEof':bool(np.array_equal(x[:len(a)],a)),'incomingUnityFromZero':bool(np.array_equal(y[offset:offset+n],b[:n])),
      'sourceReadThrough':source['begin']-pre+len(a)/rate,'samplePeak':float(np.max(np.abs(mix))),
      'overlapPeak':float(np.max(np.abs(mix[offset:eof]))),'oversampledPeak':float(np.max(np.abs(resample_poly(mix,4,1,axis=0)))),
      'eofLevelChangeDb':float(20*np.log10(after/before)),'notHumanListening':True}
 original_at=eof-offset
 row['originalLevelReference']={'method':'original-native-eof-relative-level-v1','sourceSha':index[source['key']]['sha'],'targetSha':index[target]['sha'],
  'halfWindowSeconds':.5,'originalBeforeRms':rms(b[original_at-round(.5*rate):original_at]),'originalAfterRms':rms(b[original_at:original_at+round(.5*rate)]),
  'mixedBeforeRms':before,'mixedAfterRms':after}
 subprocess.run(['ffmpeg','-nostdin','-v','error','-f','f32le','-ac','2','-ar',str(rate),'-i',str(folder/'mix.f32'),'-c:a','libmp3lame','-q:a','2',str(folder/'evaluation.mp3')],check=True)
 # Existing independent multiband screen, on actual unity-gain components.
 js="""(async()=>{const fs=require('fs'),{pathToFileURL}=require('url');const {introductionExposure}=await import(pathToFileURL(process.cwd()+'/tools/introduction-exposure.mjs'));const folder=process.argv[2],sr=Number(process.argv[3]),fade=Number(process.argv[4]);function read(name){const b=fs.readFileSync(folder+'/'+name+'.f32'),x=new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));return [0,1].map(c=>Float32Array.from({length:x.length/2},(_,i)=>x[i*2+c]));}console.log(JSON.stringify(introductionExposure(read('outgoing'),read('incoming'),read('original-incoming'),sr,{entry:0,tempo:1,fade},.3)));})().catch(e=>{console.error(e);process.exitCode=1});"""
 (folder/'measure.cjs').write_bytes(js.encode());row['introductionExposure']=json.loads(subprocess.check_output(['node',str(folder/'measure.cjs'),str(folder),str(rate),str(fade)]))
 reports.append(row)
 print(json.dumps({k:row[k] for k in ['sampleRate','samplePeak','overlapPeak','oversampledPeak','eofLevelChangeDb']}|{'exposureAccepted':row['introductionExposure']['accepted']}))
(out/'render-report.json').write_bytes((json.dumps({'evaluationOnly':True,'results':reports},indent=2)+'\n').encode())
