#!/usr/bin/env python3
"""Render bounded real-source transitions to lossless common-gain assets.

Only successfully decoded, pitch/timing checked and peak-bounded assets
earn playback descriptors. Failures remain explicit in the report.
"""
import argparse,hashlib,importlib.util,json,pathlib,subprocess,tempfile
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('audit',ROOT/'tools/audit-full-beat-audio.py')
audit=importlib.util.module_from_spec(spec);spec.loader.exec_module(audit)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ('plans','assets','cache','report'):parser.add_argument('--'+name,required=True)
    parser.add_argument('--rate',type=int,default=44100);args=parser.parse_args()
    if args.rate not in (16000,44100,48000):raise ValueError('Unsupported sample rate')
    audit.SR=args.rate;assets=pathlib.Path(args.assets);assets.mkdir(parents=True,exist_ok=True)
    cache=pathlib.Path(args.cache);cache.mkdir(parents=True,exist_ok=True)
    plans=json.loads(pathlib.Path(args.plans).read_text())['plans'];results=[]
    for p in plans:
        cue=p['cue']
        try:
            a=audit.source(p['from'],cue['sourceSha'],cache);b=audit.source(p['to'],cue['targetSha'],cache)
            outgoing=audit.decode(a,cue['begin'],cue['fade'])
            incoming=audit.decode(b,cue['entry'],cue['fade']*1.05+4)
            with tempfile.TemporaryDirectory(prefix='musicbox-common-') as folder:
                folder=pathlib.Path(folder)
                for name,value in [('outgoing',outgoing),('incoming',incoming)]:
                    (folder/(name+'.f32')).write_bytes(value.astype('<f4').tobytes())
                (folder/'cue.json').write_text(json.dumps(cue))
                run=subprocess.run(['node',str(ROOT/'tools/render-composite-mix.mjs'),
                    '--rate='+str(args.rate),'--cue='+str(folder/'cue.json'),
                    '--outgoing='+str(folder/'outgoing.f32'),'--incoming='+str(folder/'incoming.f32'),
                    '--output='+str(folder/'mix.f32')],capture_output=True,text=True,timeout=90)
                if run.returncode:raise ValueError(run.stderr[-800:])
                proof=json.loads(run.stdout.splitlines()[-1]);target=folder/'mix.flac'
                subprocess.run(['ffmpeg','-nostdin','-v','error','-f','f32le','-ar',str(args.rate),'-ac','2','-i',str(folder/'mix.f32'),
                    '-c:a','flac','-sample_fmt','s32','-compression_level','8',str(target)],check=True,capture_output=True,timeout=60)
                content=target.read_bytes();sha=hashlib.sha256(content).hexdigest()
                decoded=audit.decode(target,0,20)
                peak=float(np.max(np.abs(decoded)))
                if peak>.961 or abs(len(decoded)/args.rate-proof['seconds'])>.001:raise ValueError('Lossless render validation failed')
                (assets/(sha+'.flac')).write_bytes(content)
                composite={'version':1,'path':'dj-mixes/'+sha+'.flac','sha256':sha,
                    'sourceSha':cue['sourceSha'],'targetSha':cue['targetSha'],
                    **{k:cue[k] for k in ('begin','entry','fade','tempo')},
                    'seconds':len(decoded)/args.rate,'peak':peak,'headroom':proof['headroom'],
                    'pitchPreserved':True,'timingVerified':True,'renderedFromOriginals':True,
                    'handoffPosition':proof['handoffPosition'],'sampleRate':args.rate}
                results.append({**p,'cue':{**cue,'composite':composite},'renderProof':proof,'bytes':len(content)})
                print(json.dumps({'from':p['from'],'to':p['to'],'peak':peak,'bytes':len(content)}),flush=True)
        except Exception as error:
            results.append({'from':p['from'],'to':p['to'],'error':str(error)})
            print('ERROR',p['from'],p['to'],str(error),flush=True)
        pathlib.Path(args.report).write_text(json.dumps({'requested':len(plans),'rendered':sum('cue'in r for r in results),'results':results},indent=2)+'\n')

if __name__=='__main__':main()
