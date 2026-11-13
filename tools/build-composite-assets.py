#!/usr/bin/env python3
"""Render bounded real-source transitions to lossless common-gain assets.

Only successfully decoded, pitch/timing checked and peak-bounded assets
earn playback descriptors. Failures remain explicit in the report.
"""
import argparse,hashlib,importlib.util,json,pathlib,subprocess,tempfile,sys
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('audit',ROOT/'tools/audit-full-beat-audio.py')
audit=importlib.util.module_from_spec(spec);spec.loader.exec_module(audit)
spec=importlib.util.spec_from_file_location('rendered_rhythm',ROOT/'tools/dj-rendered-rhythm.py')
rhythm=importlib.util.module_from_spec(spec);spec.loader.exec_module(rhythm)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ('plans','assets','cache','report'):parser.add_argument('--'+name,required=True)
    parser.add_argument('--rate',type=int,default=44100)
    parser.add_argument('--peak-ceiling',type=float,default=.96)
    parser.add_argument('--context-mode',choices=('auto','warm','cold'),default='auto');args=parser.parse_args()
    if args.rate not in (16000,44100,48000):raise ValueError('Unsupported sample rate')
    if not .85<=args.peak_ceiling<=.96:raise ValueError('Unsafe peak ceiling')
    audit.SR=args.rate;assets=pathlib.Path(args.assets);assets.mkdir(parents=True,exist_ok=True)
    cache=pathlib.Path(args.cache);cache.mkdir(parents=True,exist_ok=True)
    plans=json.loads(pathlib.Path(args.plans).read_text())['plans'];results=[]
    report_path=pathlib.Path(args.report);report_path.parent.mkdir(parents=True,exist_ok=True)
    if args.context_mode=='auto':
        # Context can improve a transient or move WSOLA's selected grain.
        # Keep the previous cold path available. EVERY chosen rendition
        # must independently pass the same actual-audio gates.
        with tempfile.TemporaryDirectory(prefix='context-audit-',dir=report_path.parent) as temporary:
            temporary=pathlib.Path(temporary);warm_report=temporary/'warm.json';cold_report=temporary/'cold.json'
            common=[sys.executable,str(pathlib.Path(__file__).resolve()),'--assets='+str(assets.resolve()),
                '--cache='+str(cache.resolve()),'--rate='+str(args.rate),'--peak-ceiling='+str(args.peak_ceiling)]
            subprocess.run(common+['--plans='+str(pathlib.Path(args.plans).resolve()),'--report='+str(warm_report),'--context-mode=warm'],check=True)
            warm=json.loads(warm_report.read_text())['results']
            failed=[p for p,r in zip(plans,warm) if r.get('error') and p['cue']['tempo']!=1]
            cold=[]
            if failed:
                retry=temporary/'retry.json';retry.write_text(json.dumps({'plans':failed}))
                subprocess.run(common+['--plans='+str(retry),'--report='+str(cold_report),'--context-mode=cold'],check=True)
                cold=json.loads(cold_report.read_text())['results']
            retried=iter(cold)
            for original in warm:
                identity=(original.get('cue')or original.get('candidateCue'))['tempo']==1
                attempts=[{'context':'identity' if identity else 'warm','error':original.get('error')}];chosen=original
                if original.get('error') and not identity:
                    alternate=next(retried);attempts.append({'context':'cold','error':alternate.get('error')});chosen=alternate
                chosen['renderAttempts']=attempts;results.append(chosen)
            rendered=sum('cue'in r for r in results)
            report_path.write_text(json.dumps({'requested':len(plans),'rendered':rendered,'contextMode':'independently-verified-warm-or-cold','results':results},indent=2)+'\n')
            print(json.dumps({'requested':len(plans),'rendered':rendered,'warmAccepted':sum(not r.get('error') for r in warm),'coldRecovered':sum(not r.get('error') for r in cold)}),flush=True)
            if plans and not rendered:raise SystemExit('No candidate passed actual PCM rendering')
        return
    for p in plans:
        cue=p['cue']
        original_peak=None;incoming_peak=None;post_rhythm=None
        try:
            a=audit.source(p['from'],cue['sourceSha'],cache);b=audit.source(p['to'],cue['targetSha'],cache)
            outgoing=audit.decode(a,cue['begin']-.3,(cue['fade'] if cue.get('structuralBeat') else cue['fade']+2)+.3)
            warmup=min(.8,cue['entry'])
            incoming=audit.decode(b,cue['entry']-warmup,cue['fade']*1.05+4+warmup)
            if len(incoming)/args.rate<warmup+cue['fade']*cue['tempo']+2.1:raise ValueError('Incomplete original incoming tail for native handoff')
            original_peak=float(np.max(np.abs(outgoing)));incoming_peak=float(np.max(np.abs(incoming)))
            with tempfile.TemporaryDirectory(prefix='musicbox-common-') as folder:
                folder=pathlib.Path(folder)
                for name,value in [('outgoing',outgoing),('incoming',incoming)]:
                    (folder/(name+'.f32')).write_bytes(value.astype('<f4').tobytes())
                ceiling=args.peak_ceiling;target=folder/'mix.flac'
                for attempt in range(3):
                    (folder/'cue.json').write_text(json.dumps({**cue,'renderPeakCeiling':ceiling,'warmupOriginal':args.context_mode=='warm'}))
                    run=subprocess.run(['node',str(ROOT/'tools/render-composite-mix.mjs'),
                        '--rate='+str(args.rate),'--cue='+str(folder/'cue.json'),
                        '--outgoing='+str(folder/'outgoing.f32'),'--incoming='+str(folder/'incoming.f32'),
                        '--output='+str(folder/'mix.f32'),'--outgoing-component='+str(folder/'old.f32'),
                        '--incoming-component='+str(folder/'new.f32')],capture_output=True,text=True,timeout=90)
                    if run.returncode:
                        if attempt==0 and 'Smooth common gain exceeds safe peak' in run.stderr:
                            ceiling=.94;continue
                        raise ValueError(run.stderr[-800:])
                    proof=json.loads(run.stdout.splitlines()[-1])
                    subprocess.run(['ffmpeg','-nostdin','-y','-v','error','-f','f32le','-ar',str(args.rate),'-ac','2','-i',str(folder/'mix.f32'),
                        '-c:a','flac','-sample_fmt','s32','-compression_level','8',str(target)],check=True,capture_output=True,timeout=60)
                    decoded=audit.decode(target,0,20)
                    from scipy.signal import resample_poly
                    oversampled=resample_poly(decoded,4,1,axis=0)
                    true_peak=float(np.max(np.abs(oversampled)))
                    lo=round(proof['preRoll']*args.rate*4);hi=round((proof['preRoll']+proof['nativeHandoffAt'])*args.rate*4)
                    overlap_true_peak=float(np.max(np.abs(oversampled[lo:hi])))
                    if overlap_true_peak>.9601 and attempt<2:
                        ceiling*=.96/overlap_true_peak*.9999;continue
                    if overlap_true_peak>.961:raise ValueError('Oversampled overlap peak exceeds ceiling')
                    break
                if cue.get('structuralBeat'):
                    old=np.frombuffer((folder/'old.f32').read_bytes(),dtype='<f4').reshape(-1,2)
                    new=np.frombuffer((folder/'new.f32').read_bytes(),dtype='<f4').reshape(-1,2)
                    post_rhythm=rhythm.verify(old,new,args.rate,cue,proof['preRoll'])
                    if not post_rhythm['accepted']:raise ValueError('Post-render rhythm certificate failed')
                content=target.read_bytes();sha=hashlib.sha256(content).hexdigest()
                peak=float(np.max(np.abs(decoded)))
                if peak>.9991 or true_peak>1 or abs(len(decoded)/args.rate-proof['seconds'])>.001:raise ValueError('Lossless/oversampled render validation failed')
                (assets/(sha+'.flac')).write_bytes(content)
                composite={'version':1,'path':'dj-mixes/'+sha+'.flac','sha256':sha,
                    'sourceSha':cue['sourceSha'],'targetSha':cue['targetSha'],
                    **{k:cue[k] for k in ('begin','entry','fade','tempo')},
                    'seconds':len(decoded)/args.rate,'peak':peak,'headroom':proof['headroom'],
                    'pitchPreserved':True,'timingVerified':True,'renderedFromOriginals':True,
                    'handoffPosition':proof['handoffPosition'],'sampleRate':args.rate}
                composite.update({k:proof[k] for k in ('nativeHandoffAt','nativeRevealAt','preRoll','overlapPeak','envelopeVersion','warmupOriginalSeconds')})
                composite['oversampledPeak']=true_peak
                composite['oversampledOverlapPeak']=overlap_true_peak
                composite['processing']=proof['timing'].get('method','soundtouch-wsola')
                if post_rhythm:
                    composite['rhythmVerified']=True;composite['postRenderRhythm']=post_rhythm
                results.append({**p,'cue':{**cue,'composite':composite},'renderProof':proof,'renderContext':args.context_mode,'bytes':len(content)})
                print(json.dumps({'from':p['from'],'to':p['to'],'peak':peak,'bytes':len(content)}),flush=True)
        except Exception as error:
            message=str(error).split('Error: ')[-1].splitlines()[0]
            results.append({'from':p['from'],'to':p['to'],'candidateCue':cue,'primary':p.get('primary'),
                'error':message,'originalPeak':original_peak,'incomingPeak':incoming_peak,'postRenderRhythm':post_rhythm})
            print('ERROR',p['from'],p['to'],message,flush=True)
        pathlib.Path(args.report).write_text(json.dumps({'requested':len(plans),'rendered':sum('cue'in r for r in results),'results':results},indent=2)+'\n')

if __name__=='__main__':main()
