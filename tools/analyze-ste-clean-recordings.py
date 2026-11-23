"""Bounded per-recording evidence, no pair scan or runtime installation."""
import hashlib, importlib.util, json, pathlib, subprocess, sys
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent


def analyze(protocol_file, output):
    protocol_file, output = pathlib.Path(protocol_file).resolve(), pathlib.Path(output).resolve()
    if output.exists():
        raise ValueError('Preserve previous evidence: choose a new output folder')
    p = json.loads(protocol_file.read_bytes())
    subprocess.run(['node', 'tools/ste-research-scope.cjs',
                    '--cases='+str(protocol_file.parent/'cases.json'), '--output='+str(output/'selection.json')],
                   cwd=ROOT, capture_output=True, check=True)
    index = json.loads((ROOT/'dj-deep-analysis.json').read_bytes())['entries']
    old_folder = ROOT/'audits/ste-classifier-evaluation-20261123'
    old = json.loads((old_folder/'native-element-shadow.json').read_bytes())
    source, cue = p['source'], old['record']['cue']
    if (source['key'] != old['from'] or source['begin'] != cue['begin'] or source['end'] != cue['end']):
        raise ValueError('Published source evidence does not cover frozen geometry')
    spec = importlib.util.spec_from_file_location('clock', ROOT/'tools/mp3-gapless-clock.py')
    clock = importlib.util.module_from_spec(spec); spec.loader.exec_module(clock)
    recordings = {}
    for key in dict.fromkeys([source['key']]+p['targets']):
        entry=index[key]; sha=entry['sha']; file=ROOT.parent/'original-mp3'/(sha+'.mp3')
        raw=file.read_bytes()
        if hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()!=sha:
            raise ValueError('Original changed: '+key)
        recordings[sha]={'key':key,'sourceSha':sha,'sourceSha256':hashlib.sha256(raw).hexdigest(),
                         'duration':entry['duration'],'clock':clock.mp3_clock(file,sha)}
    r=recordings[cue['sourceSha']]
    r['quietSuffix']={'method':'native-original-quiet-suffix-factored-v1',
                     'from':source['begin']-source['preRoll'],'begin':source['begin'],'through':source['end'],
                     'sourceSha':r['sourceSha'],'sourceClock':cue['nativeCleanEvidence']['sourceClock'],
                     'reusedPublishedEvidence':True,'native':[
                         {k:m[k] for k in ['platform','browser','rate','sourceTailPeak','sourceTailRmsMax','sourceDecodedOffset','sourceMediaOffset',
                                          'sourceDecodedDuration','sourceMediaDuration']} |
                         {'channelRmsUpperBound':m['sourceTailRmsMax']*np.sqrt(2),
                          'rmsBoundMethod':'sqrt2-times-measured-stereo-rms'}
                         for m in cue['nativeCleanEvidence']['nativeMeasurements']]}
    fade=source['end']-source['begin']
    # The published positive is imported, never decoded/rendered again.
    positive=recordings[cue['targetSha']]
    positive['prefix']={'method':'native-original-prefix-factored-v1','sourceSha':positive['sourceSha'],
                        'through':fade+.1,'reusedPublishedEvidence':True,
                        'meaningfulSeconds':cue['nativeCleanEvidence']['introductionExposure']['meaningfulSeconds'],
                        'originalWindows':[{'at':w['at'],'seconds':.25,'rms':w['originalRms']} for w in cue['nativeCleanEvidence']['introductionExposure']['rows']],
                        'native':[{k:m[k] for k in ['platform','browser','rate','targetNativeOverlapPeak',
                                                   'targetDecodedOffset','targetMediaOffset','targetDecodedDuration','targetMediaDuration']}
                                  for m in cue['nativeCleanEvidence']['nativeMeasurements']]}
    new_decodes=0
    for key in p['targets']:
        entry=index[key]; sha=entry['sha']
        if sha==positive['sourceSha']: continue
        r=recordings[sha]; file=ROOT.parent/'original-mp3'/(sha+'.mp3'); rates={}
        for rate in p['rates']:
            raw=subprocess.check_output(['ffmpeg','-nostdin','-v','error','-i',str(file),'-t',str(p['nativePrefixSeconds']),
                                         '-ac','2','-ar',str(rate),'-f','f32le','pipe:1'])
            x=np.frombuffer(raw,dtype='<f4').reshape(-1,2)
            new_decodes+=1
            if len(x)<round(p['nativePrefixSeconds']*rate) or not np.isfinite(x).all():raise ValueError('Incomplete original prefix')
            (output/(sha+'-'+str(rate)+'-prefix.f32')).write_bytes(raw)
            rms=lambda a:float(np.sqrt(np.mean(np.asarray(a,dtype=np.float64)**2)))
            windows=[{'at':i/rate,'seconds':.25,'rms':rms(x[i:i+round(.25*rate)]),
                      'peak':float(np.max(np.abs(x[i:i+round(.25*rate)])))}
                     for i in range(0,round(fade*rate)-round(.25*rate)+1,round(.25*rate))]
            at=round(fade*rate); before=rms(x[at-round(.5*rate):at]);after=rms(x[at:at+round(.5*rate)])
            rates[str(rate)]={'frames':len(x),'pcmSha256':hashlib.sha256(raw).hexdigest(),
                              'coveredThrough':len(x)/rate,'maximumPeak':float(np.max(np.abs(x[:round((fade+.1)*rate)]))),
                              'windows':windows,'meaningfulSeconds':sum(w['seconds'] for w in windows if w['rms']>=p['meaningfulFrameRms']),
                              'originalEofWindowChangeDb':float(20*np.log10(max(after,1e-12)/max(before,1e-12)))}
        r['prefix']={'method':'original-stereo-prefix-factored-v1','sourceSha':sha,'through':p['nativePrefixSeconds'],
                     'rates':rates,'native':[],'notNativeCertified':True}
    report={'version':1,'evaluationOnly':True,'notPlaybackCertified':True,'recordings':recordings,
            'sourceDecodes':0,'newPrefixDecodes':new_decodes,'positiveControlReused':True,'protocolSha256':hashlib.sha256(protocol_file.read_bytes()).hexdigest(),
            'cases':json.loads((protocol_file.parent/'cases.json').read_bytes())}
    (output/'recordings.json').write_bytes((json.dumps(report,indent=2)+'\n').encode())
    print(json.dumps([{'key':r['key'],'prefix':r.get('prefix',{}).get('rates'),'sourceProofReused':bool(r.get('quietSuffix'))}
                      for r in recordings.values()]))


if __name__=='__main__': analyze(*sys.argv[1:])
