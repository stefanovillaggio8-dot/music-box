#!/usr/bin/env python3
"""Decode exact SHA-bound sources and render the actual SoundTouch overlap.

Timing and peaks are numerical evidence. This is not a human listening test,
nor a reference-labelled downbeat, vocal, or word-alignment certificate.
"""
import argparse, hashlib, json, pathlib, subprocess, urllib.request, wave
import librosa
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1]
SR=16000

def decode(path,start,seconds):
    # Decode from the recording's beginning before trimming. Input-side
    # MP3 seeking can lose bit-reservoir history and insert silent/incorrect
    # samples at the very beat whose phase this audit is meant to verify.
    run=subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(path),'-ss',str(start),
        '-t',str(seconds),'-ar',str(SR),'-ac','2','-f','f32le','pipe:1'],capture_output=True,check=True,timeout=60)
    return np.frombuffer(run.stdout,dtype='<f4').reshape(-1,2).copy()

def source(key,sha,cache):
    target=cache/(sha+'.mp3')
    if not target.exists():
        origin,path=key.split('/',1)
        base={'audio':'music-box-brani/main','app':'music-box/main','mobile':'music-box/mobile-audio'}[origin]
        url='https://raw.githubusercontent.com/stefanovillaggio8-dot/'+base+'/'+path
        with urllib.request.urlopen(url,timeout=60) as response:content=response.read(32*1024*1024+1)
        if len(content)>32*1024*1024:raise ValueError('Audio too large')
    else:content=target.read_bytes()
    actual=hashlib.sha1(b'blob '+str(len(content)).encode()+b'\0'+content).hexdigest()
    if actual!=sha:raise ValueError('Source SHA mismatch '+key)
    if not target.exists():target.write_bytes(content)
    return target

def rhythm(a,b):
    x=librosa.onset.onset_strength(y=a.mean(axis=1),sr=SR,hop_length=160)
    y=librosa.onset.onset_strength(y=b.mean(axis=1),sr=SR,hop_length=160)
    n=min(len(x),len(y));x=x[:n];y=y[:n]
    def corr(lo,hi):
        a=x[lo:hi];b=y[lo:hi]
        return float(np.corrcoef(a,b)[0,1]) if min(np.std(a),np.std(b))>1e-6 else None
    return {'whole':corr(0,n),'first':corr(0,n//2),'second':corr(n//2,n)}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plans',required=True);parser.add_argument('--output',required=True)
    parser.add_argument('--cache',required=True);parser.add_argument('--rate',type=int,default=16000)
    args=parser.parse_args()
    global SR
    if args.rate not in (16000,44100,48000):parser.error('Unsupported verification sample rate')
    SR=args.rate
    output=pathlib.Path(args.output);output.mkdir(parents=True,exist_ok=True)
    cache=pathlib.Path(args.cache);cache.mkdir(parents=True,exist_ok=True)
    plans=json.loads(pathlib.Path(args.plans).read_text())['plans'];results=[]
    for number,p in enumerate(plans):
        cue=p['cue'];name=f'{number+1:02d}';folder=output/name;folder.mkdir(exist_ok=True)
        try:
            a=source(p['from'],cue['sourceSha'],cache);b=source(p['to'],cue['targetSha'],cache)
            # Prefix is retained exactly as in the browser. Never stretch by
            # resampling (which would raise/lower the recorded voice's pitch).
            incoming=decode(b,0,min(39,cue['entry']+cue['fade']*1.05+4))
            original=decode(a,cue['begin'],cue['fade'])
            raw=folder/'input.f32';raw.write_bytes(incoming.astype('<f4').tobytes())
            cuefile=folder/'cue.json';cuefile.write_text(json.dumps(cue))
            transformed=folder/'stretched.f32'
            run=subprocess.run(['node',str(ROOT/'tools/dj-verify-stretch.cjs'),
                '--rate='+str(SR),'--input='+str(raw),'--cue='+str(cuefile),'--output='+str(transformed)],
                capture_output=True,text=True,timeout=90)
            timing=json.loads(run.stdout.splitlines()[-1]) if run.stdout.strip() else None
            if not transformed.exists():raise ValueError(run.stderr[-1000:])
            processed=np.frombuffer(transformed.read_bytes(),dtype='<f4').reshape(-1,2)
            at=round(cue['entry']*SR);processed=processed[at:at+len(original)]
            count=min(len(original),len(processed));original=original[:count];processed=processed[:count]
            t=np.arange(count)/SR
            # Same native-tail preview ceiling as the player. Report the
            # unbounded sum so a hot master cannot hide behind a metric.
            gain=.33*np.minimum(1,t/max(.9,cue['fade']*.72))
            gain=.33*np.sin(np.minimum(1,t/cue['fade']*1.5)*np.pi/2)
            mixed=original+processed*gain[:,None]
            peak=float(np.max(np.abs(mixed)))
            source_peak=float(np.max(np.abs(original)));processed_peak=float(np.max(np.abs(processed)))
            headroom=min(1.,.96/max(.001,source_peak+.33*processed_peak))
            with wave.open(str(folder/'overlap.wav'),'wb') as wav:
                wav.setnchannels(2);wav.setsampwidth(2);wav.setframerate(SR)
                wav.writeframes((np.clip(mixed*headroom,-1,1)*32767).astype('<i2').tobytes())
            result={'from':p['from'],'to':p['to'],'seconds':count/SR,'sourceShaVerified':True,
                'sourceSha':cue['sourceSha'],'targetSha':cue['targetSha'],'sampleRate':SR,
                'timing':timing,'stretchAccepted':run.returncode==0,'onsets':rhythm(original,processed),
                'samplePeak':peak,'samplesOverFullScale':int(np.count_nonzero(np.abs(mixed)>1)),
                'sourcePeak':source_peak,'processedPeak':processed_peak,
                'recommendedHeadroom':headroom,'safeSamplePeak':float(np.max(np.abs(mixed*headroom))),
                'safeSamplesOverFullScale':int(np.count_nonzero(np.abs(mixed*headroom)>1)),
                'humanListening':'NOT_PERFORMED','downbeatAndPhrase':'NOT_VERIFIED'}
            raw.unlink();transformed.unlink()
        except Exception as error:result={'from':p['from'],'to':p['to'],'error':str(error)}
        results.append(result);print(json.dumps(result),flush=True)
        (output/'report.json').write_text(json.dumps({'pairsRequested':len(plans),'pairsRendered':sum('seconds' in r for r in results),'results':results},indent=2)+'\n')
if __name__=='__main__':main()
