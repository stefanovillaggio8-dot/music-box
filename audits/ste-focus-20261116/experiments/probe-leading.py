import json, pathlib, subprocess, hashlib, concurrent.futures, importlib.util
import numpy as np
root=pathlib.Path.cwd(); work=root.parent/'ste-focus-20261116'
scope=json.loads((root.parent/'personal-20261116/scopes/Ste.json').read_text())
spec=importlib.util.spec_from_file_location('original',root/'tools/audit-full-beat-audio.py');audio=importlib.util.module_from_spec(spec);spec.loader.exec_module(audio)
def measure(t):
 p=audio.source(t['key'],t['sha'],root.parent/'original-mp3')
 data=p.read_bytes()
 if hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()!=t['sha']:raise ValueError(t['key'])
 results={}
 for rate in [44100,48000]:
  raw=subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(p),'-t','4','-ar',str(rate),'-ac','2','-f','f32le','pipe:1'],capture_output=True,check=True).stdout
  samples=np.frombuffer(raw,dtype='<f4').reshape(-1,2)
  nonzero=np.flatnonzero(np.any(abs(samples)>.0001,axis=1));lo=int(nonzero[0]) if len(nonzero) else len(samples)
  results[str(rate)]={'through':lo/rate,'frames':lo,'maximumPeak':float(np.max(abs(samples[:lo]))) if lo else 0}
 return {'key':t['key'],'sourceSha':t['sha'],'sourceSha256':hashlib.sha256(data).hexdigest(),'rates':results,'through':min(v['through'] for v in results.values())}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
 rows=list(pool.map(measure,scope['tracks']))
(work/'leading-silence.json').write_text(json.dumps(rows,indent=2))
print(json.dumps({'tracks':len(rows),'prefixes':sorted([(r['key'],r['through']) for r in rows if r['through']>=.1],key=lambda r:-r[1])}))
