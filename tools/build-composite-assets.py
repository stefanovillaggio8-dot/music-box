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
clock_spec=importlib.util.spec_from_file_location('mp3_clock',ROOT/'tools/mp3-gapless-clock.py')
clock_module=importlib.util.module_from_spec(clock_spec);clock_spec.loader.exec_module(clock_module)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ('plans','assets','cache','report'):parser.add_argument('--'+name,required=True)
    parser.add_argument('--rate',type=int,default=44100)
    parser.add_argument('--peak-ceiling',type=float,default=.96)
    parser.add_argument('--pre-roll',type=float,choices=(.3,.6,.9),default=.3)
    parser.add_argument('--release-seconds',type=float,choices=(.9,1.2,1.5),default=.9)
    parser.add_argument('--gain-mode',choices=('constant','lookahead'),default='constant')
    parser.add_argument('--true-peak-lookahead',action='store_true')
    parser.add_argument('--transient-fallback',action='store_true',help='Offline-only bounded retry with a shorter WSOLA search; every original timing/render gate stays mandatory')
    parser.add_argument('--envelope-search',action='store_true',help='Retry only unsafe native splice boundaries with bounded existing envelopes; every retry retains all PCM gates')
    parser.add_argument('--context-mode',choices=('auto','warm','cold'),default='auto');args=parser.parse_args()
    if args.rate not in (16000,44100,48000):raise ValueError('Unsupported sample rate')
    if not .85<=args.peak_ceiling<=.96:raise ValueError('Unsafe peak ceiling')
    audit.SR=args.rate;assets=pathlib.Path(args.assets);assets.mkdir(parents=True,exist_ok=True)
    cache=pathlib.Path(args.cache);cache.mkdir(parents=True,exist_ok=True)
    plans=json.loads(pathlib.Path(args.plans).read_text())['plans'];results=[]
    report_path=pathlib.Path(args.report);report_path.parent.mkdir(parents=True,exist_ok=True)
    if not plans:
        report_path.write_text(json.dumps({'requested':0,'rendered':0,'results':[]})+'\n')
        return
    if args.transient_fallback:
        with tempfile.TemporaryDirectory(prefix='stretch-profile-',dir=report_path.parent) as temporary:
            temporary=pathlib.Path(temporary)
            common=[sys.executable,str(pathlib.Path(__file__).resolve()),'--assets='+str(assets.resolve()),
                '--cache='+str(cache.resolve()),'--rate='+str(args.rate),'--peak-ceiling='+str(args.peak_ceiling),
                '--pre-roll='+str(args.pre_roll),'--release-seconds='+str(args.release_seconds),
                '--gain-mode='+args.gain_mode,'--context-mode='+args.context_mode]
            common+=(['--true-peak-lookahead'] if args.true_peak_lookahead else [])+(['--envelope-search'] if args.envelope_search else [])
            initial=temporary/'initial.json'
            subprocess.run(common+['--plans='+str(pathlib.Path(args.plans).resolve()),'--report='+str(initial)],check=False)
            rows=json.loads(initial.read_text(encoding='utf8'))['results'];retry=[];indices=[]
            for i,(p,row) in enumerate(zip(plans,rows)):
                if not p['cue'].get('stretchProfile') and p['cue'].get('structuralEvidence',{}).get('incomingWholeOverlap',{}).get('clear') is True and row.get('error') in ('Stretch timing failed','Post-render rhythm certificate failed'):
                    retry.append({**p,'cue':{**p['cue'],'stretchProfile':'transient-60-12-8-v1'}});indices.append(i)
                row['stretchProfileAttempts']=[{'profile':p['cue'].get('stretchProfile','auto'),'error':row.get('error')}]
            if retry:
                inputs=temporary/'retry.json';inputs.write_text(json.dumps({'plans':retry}),encoding='utf8');retried=temporary/'retried.json'
                subprocess.run(common+['--plans='+str(inputs),'--report='+str(retried)],check=False)
                alternate=json.loads(retried.read_text(encoding='utf8'))['results']
                if len(alternate)!=len(indices):raise ValueError('Incomplete stretch retry report')
                for i,row in zip(indices,alternate):
                    row['stretchProfileAttempts']=rows[i]['stretchProfileAttempts']+[{'profile':'transient-60-12-8-v1','error':row.get('error')}];rows[i]=row
            rendered=sum('cue' in r for r in rows)
            report_path.write_text(json.dumps({'requested':len(plans),'rendered':rendered,
                'stretchPolicy':'two-bounded-offline-profiles-original-gates-v1','results':rows},indent=2)+'\n',encoding='utf8')
            if not rendered:raise SystemExit('No candidate passed actual PCM rendering')
        return
    if args.envelope_search:
        # Arbitrary initial offsets can fall on a hot original transient.
        # Try a bounded set of already supported native splice envelopes,
        # never weakening the peak/gain bounds or retrying bad rhythm forever.
        presets=list(dict.fromkeys([(args.pre_roll,args.release_seconds),(.9,1.2),(.3,1.5),(.9,1.5)]))
        chosen=[None]*len(plans);history=[[] for _ in plans];pending=list(range(len(plans)))
        with tempfile.TemporaryDirectory(prefix='envelope-audit-',dir=report_path.parent) as temporary:
            temporary=pathlib.Path(temporary)
            for attempt,(pre,release) in enumerate(presets):
                if not pending:break
                inputs=temporary/f'input-{attempt}.json';outputs=temporary/f'output-{attempt}.json'
                inputs.write_text(json.dumps({'plans':[plans[i] for i in pending]}),encoding='utf8')
                command=[sys.executable,str(pathlib.Path(__file__).resolve()),'--plans='+str(inputs),
                    '--assets='+str(assets.resolve()),'--cache='+str(cache.resolve()),'--report='+str(outputs),
                    '--rate='+str(args.rate),'--peak-ceiling='+str(args.peak_ceiling),'--pre-roll='+str(pre),
                    '--release-seconds='+str(release),'--gain-mode='+args.gain_mode,'--context-mode='+args.context_mode]
                if args.true_peak_lookahead:command.append('--true-peak-lookahead')
                subprocess.run(command,check=False)
                if not outputs.exists():raise ValueError('Missing independent envelope report')
                rows=json.loads(outputs.read_text(encoding='utf8'))['results']
                if len(rows)!=len(pending):raise ValueError('Incomplete independent envelope report')
                retry=[]
                for i,row in zip(pending,rows):
                    history[i].append({'preRoll':pre,'releaseSeconds':release,'error':row.get('error')})
                    chosen[i]=row
                    if 'native boundaries' in row.get('error',''):retry.append(i)
                pending=retry
        for i,row in enumerate(chosen):row['envelopeAttempts']=history[i]
        rendered=sum('cue' in r for r in chosen)
        report_path.write_text(json.dumps({'requested':len(plans),'rendered':rendered,
            'envelopePolicy':'bounded-native-boundary-retries-v1','results':chosen},indent=2)+'\n',encoding='utf8')
        if not rendered:raise SystemExit('No candidate passed actual PCM rendering')
        return
    if args.context_mode=='auto':
        # Context can improve a transient or move WSOLA's selected grain.
        # Keep the previous cold path available. EVERY chosen rendition
        # must independently pass the same actual-audio gates.
        with tempfile.TemporaryDirectory(prefix='context-audit-',dir=report_path.parent) as temporary:
            temporary=pathlib.Path(temporary);warm_report=temporary/'warm.json';cold_report=temporary/'cold.json'
            common=[sys.executable,str(pathlib.Path(__file__).resolve()),'--assets='+str(assets.resolve()),
                '--cache='+str(cache.resolve()),'--rate='+str(args.rate),'--peak-ceiling='+str(args.peak_ceiling),
                '--pre-roll='+str(args.pre_roll),'--release-seconds='+str(args.release_seconds),'--gain-mode='+args.gain_mode]+(['--true-peak-lookahead'] if args.true_peak_lookahead else [])
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
        original_peak=None;incoming_peak=None;post_rhythm=None;resampled_proof=None
        try:
            a=audit.source(p['from'],cue['sourceSha'],cache);b=audit.source(p['to'],cue['targetSha'],cache)
            exact=cue.get('structuralEvidence',{}).get('exactSilentSuffix')
            if exact and hashlib.sha256(a.read_bytes()).hexdigest()!=exact.get('sourceSha256'):
                raise ValueError('Exact silence original byte identity mismatch')
            outgoing=audit.decode(a,cue['begin']-args.pre_roll,(cue['fade'] if cue.get('structuralBeat') and not cue.get('preservedFileTail') else cue['fade']+2)+args.pre_roll)
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
                    (folder/'cue.json').write_text(json.dumps({**cue,'renderPeakCeiling':ceiling,'renderPreRoll':args.pre_roll,
                        'renderReleaseSeconds':args.release_seconds,'renderGainMode':args.gain_mode,'warmupOriginal':args.context_mode=='warm'}))
                    render_command=['node',str(ROOT/'tools/render-composite-mix.mjs'),
                        '--rate='+str(args.rate),'--cue='+str(folder/'cue.json'),
                        '--outgoing='+str(folder/'outgoing.f32'),'--incoming='+str(folder/'incoming.f32'),
                        '--output='+str(folder/'mix.f32'),'--outgoing-component='+str(folder/'old.f32'),
                        '--incoming-component='+str(folder/'new.f32')]
                    raw_path=folder/'raw.f32';bounds_path=folder/'true-peak.f32'
                    run=subprocess.run(render_command+(['--raw-output='+str(raw_path)] if args.true_peak_lookahead else []),capture_output=True,text=True,timeout=90)
                    if args.true_peak_lookahead and raw_path.exists():
                        from scipy.signal import resample_poly
                        unbounded=np.frombuffer(raw_path.read_bytes(),dtype='<f4').reshape(-1,2)
                        true_bounds=np.max(np.abs(resample_poly(unbounded,4,1,axis=0)).reshape(len(unbounded),4,2),axis=(1,2))*1.001
                        bounds_path.write_bytes(true_bounds.astype('<f4').tobytes())
                        run=subprocess.run(render_command+['--true-peak-bounds='+str(bounds_path)],capture_output=True,text=True,timeout=90)
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
                if cue.get('structuralBeat') or cue.get('structuralEvidence',{}).get('pulseCheck'):
                    old=np.frombuffer((folder/'old.f32').read_bytes(),dtype='<f4').reshape(-1,2)
                    new=np.frombuffer((folder/'new.f32').read_bytes(),dtype='<f4').reshape(-1,2)
                    post_rhythm=rhythm.verify(old,new,args.rate,cue,proof['preRoll'])
                    if cue.get('rhythmicTailWindow'):
                        post_rhythm['tailEvidence']=rhythm.tail_evidence(outgoing,args.rate,cue,proof['preRoll'])
                        post_rhythm['accepted']=post_rhythm['accepted'] and post_rhythm['tailEvidence']['accepted']
                    if cue.get('structuralEvidence',{}).get('exactSilentSuffix'):
                        post_rhythm['exactSilentSuffix']=rhythm.exact_silence_evidence(outgoing,args.rate,cue,proof['preRoll'])
                        post_rhythm['accepted']=post_rhythm['accepted'] and post_rhythm['exactSilentSuffix']['accepted']
                    if not post_rhythm['accepted']:raise ValueError('Post-render rhythm certificate failed')
                resampled_proof=None
                if (cue.get('rhythmicTailWindow') or cue.get('metricalPickupWindow') or cue.get('structuralEvidence',{}).get('exactSilentSuffix')) and args.rate==48000:
                    # Safari decodes/resamples this deployed 48 kHz FLAC. It
                    # does NOT rerun SoundTouch at 44.1 kHz. Certify that actual
                    # path, including the encoded mixed signal and both audible
                    # components, with exactly the same rhythmic/peak gates.
                    old44=resample_poly(old,147,160,axis=0)
                    new44=resample_poly(new,147,160,axis=0)
                    raw44=resample_poly(outgoing,147,160,axis=0)
                    proof44=rhythm.verify(old44,new44,44100,cue,proof['preRoll'])
                    if cue.get('rhythmicTailWindow'):
                        proof44['tailEvidence']=rhythm.tail_evidence(raw44,44100,cue,proof['preRoll'])
                        proof44['accepted']=proof44['accepted'] and proof44['tailEvidence']['accepted']
                    elif cue.get('structuralEvidence',{}).get('exactSilentSuffix'):
                        proof44['exactSilentSuffix']=rhythm.exact_silence_evidence(raw44,44100,cue,proof['preRoll'])
                        proof44['accepted']=proof44['accepted'] and proof44['exactSilentSuffix']['accepted']
                    try:
                        audit.SR=44100;decoded44=audit.decode(target,0,20)
                    finally:audit.SR=args.rate
                    oversampled44=resample_poly(decoded44,4,1,axis=0)
                    lo44=round(proof['preRoll']*44100*4)
                    hi44=round((proof['preRoll']+proof['nativeHandoffAt'])*44100*4)
                    peak44=float(np.max(np.abs(decoded44)));true44=float(np.max(np.abs(oversampled44)))
                    overlap44=float(np.max(np.abs(oversampled44[lo44:hi44])))
                    resampled_proof={'method':'encoded-common-resampling-v1','sampleRate':44100,
                        'samplePeak':peak44,'oversampledPeak':true44,'oversampledOverlapPeak':overlap44,
                        'rhythm':proof44,'notASecondSoundTouchRender':True}
                    if not proof44['accepted'] or peak44>.9992 or true44>1 or overlap44>.961:
                        raise ValueError('Actual encoded common resampling certificate failed')
                content=target.read_bytes();sha=hashlib.sha256(content).hexdigest()
                peak=float(np.max(np.abs(decoded)))
                if peak>.9991 or true_peak>1 or abs(len(decoded)/args.rate-proof['seconds'])>.001:raise ValueError(f'Lossless/oversampled render validation failed (sample={peak:.8f}, true={true_peak:.8f})')
                (assets/(sha+'.flac')).write_bytes(content)
                composite={'version':1,'path':'dj-mixes/'+sha+'.flac','sha256':sha,
                    'sourceSha':cue['sourceSha'],'targetSha':cue['targetSha'],
                    **{k:cue[k] for k in ('begin','entry','fade','tempo')},
                    'seconds':len(decoded)/args.rate,'peak':peak,'headroom':proof['headroom'],
                    'pitchPreserved':True,'timingVerified':True,'renderedFromOriginals':True,
                    'handoffPosition':proof['handoffPosition'],'sampleRate':args.rate}
                composite.update({k:proof[k] for k in ('nativeHandoffAt','nativeRevealAt','preRoll','releaseSeconds','overlapPeak','envelopeVersion','warmupOriginalSeconds')})
                if cue.get('metricalPickupWindow'):
                    if args.release_seconds!=1.5:raise ValueError('Metrical pickup requires the verified slow native reveal')
                    composite['renderedEntrance']=cue['preservedEntrance']
                if cue.get('nativeOriginalReturn'):
                    splice=proof.get('nativeSplice')
                    if not splice or splice.get('targetSha')!=cue['targetSha']:raise ValueError('Missing original native return proof')
                    count=round(.1*args.rate);reveal=round((proof['preRoll']+proof['nativeRevealAt'])*args.rate)
                    original=round((splice['nativeResumeSeconds']-(cue['entry']-warmup))*args.rate)
                    actual=decoded[reveal-count:reveal];reference=incoming[original-count:original]
                    if actual.shape!=reference.shape or len(actual)!=count:raise ValueError('Incomplete original native return comparison')
                    difference=float(np.max(np.abs(actual-reference)))
                    if difference>2e-6:raise ValueError('Encoded original native return differs from original PCM')
                    composite['nativeSplice']={**splice,'encodedMaximumDifference':difference,'unmodifiedOriginalComparison':True,
                        'sourceClock':clock_module.mp3_clock(a,cue['sourceSha']),'targetClock':clock_module.mp3_clock(b,cue['targetSha'])}
                if 'gainProof' in proof:composite['gainProof']=proof['gainProof']
                if cue.get('preservedFileTail'):
                    composite.update({k:proof[k] for k in ('sourceReadThrough','outgoingEnvelope')})
                composite['oversampledPeak']=true_peak
                composite['oversampledOverlapPeak']=overlap_true_peak
                composite['processing']=proof['timing'].get('method','soundtouch-wsola')
                if cue.get('stretchProfile'):composite['stretchProfile']=cue['stretchProfile']
                at=round((proof['preRoll']+proof['nativeHandoffAt'])*args.rate);half=round(.5*args.rate)
                before=float(np.sqrt(np.mean(decoded[max(0,at-half):at]**2)))
                after=float(np.sqrt(np.mean(decoded[at:at+half]**2)))
                composite['levelContinuity']={'method':'rendered-half-second-eof-rms-v1','beforeRms':before,'afterRms':after,
                    'changeDb':float(20*np.log10(after/before)) if min(before,after)>1e-9 else None,
                    'includesOriginalSongDynamics':True,'notHumanListening':True}
                if post_rhythm:
                    composite['rhythmVerified']=True;composite['postRenderRhythm']=post_rhythm
                if resampled_proof:composite['resampledCommonProof']={**resampled_proof,'assetSha256':sha}
                results.append({**p,'cue':{**cue,'composite':composite},'renderProof':proof,'renderContext':args.context_mode,'bytes':len(content)})
                print(json.dumps({'from':p['from'],'to':p['to'],'peak':peak,'bytes':len(content)}),flush=True)
        except Exception as error:
            message=str(error).split('Error: ')[-1].splitlines()[0]
            results.append({'from':p['from'],'to':p['to'],'candidateCue':cue,'primary':p.get('primary'),
                'error':message,'originalPeak':original_peak,'incomingPeak':incoming_peak,'postRenderRhythm':post_rhythm,
                'resampledCommonAttempt':resampled_proof})
            print('ERROR',p['from'],p['to'],message,flush=True)
        pathlib.Path(args.report).write_text(json.dumps({'requested':len(plans),'rendered':sum('cue'in r for r in results),'results':results},indent=2)+'\n')

if __name__=='__main__':main()
