#!/usr/bin/env python3
"""SHA-bound PCM features for the complete audible transition, never synthetic beats.
Adds data to existing entries; keeps every previous measurement unchanged.
"""
import argparse, concurrent.futures, hashlib, json, os, pathlib, shutil, subprocess, tempfile, time, urllib.request
import librosa
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1]
SR=11025
HOP=128
VERSION=2

def source_url(key):
    origin,path=key.split('/',1)
    base={'audio':'music-box-brani/main','mobile':'music-box/mobile-audio','app':'music-box/main'}[origin]
    return 'https://raw.githubusercontent.com/stefanovillaggio8-dot/'+base+'/'+path

def section(samples,start,bpm):
    harmonic,percussive=librosa.effects.hpss(samples,margin=(2.,2.))
    onset=librosa.onset.onset_strength(y=percussive,sr=SR,hop_length=HOP)
    _,frames=librosa.beat.beat_track(onset_envelope=onset,sr=SR,hop_length=HOP,bpm=bpm,trim=True)
    times=librosa.frames_to_time(np.arange(len(onset)),sr=SR,hop_length=HOP)
    # Refine each tracked pulse to an observed attack, rather than emitting
    # interpolated metronome positions. Weak observations cannot count.
    floor=float(np.quantile(onset,.2));scale=float(np.quantile(onset,.95)-floor)
    beats=[]
    for frame in np.asarray(frames,dtype=int):
        lo=max(0,frame-4);hi=min(len(onset),frame+5)
        peak=lo+int(np.argmax(onset[lo:hi]))
        if scale>.01 and onset[peak]>=floor+scale*.25:
            t=round(start+float(times[peak]),4)
            if not beats or t-beats[-1]>.20:beats.append(t)
    grid=np.arange(0,len(samples)/SR,.02)
    contour=np.maximum(0,(np.interp(grid,times,onset)-floor)/max(.01,scale))
    matrix=librosa.feature.chroma_stft(y=harmonic,sr=SR,hop_length=HOP,n_fft=2048)
    notes=[]
    for at in np.arange(.5,len(samples)/SR-.5,.5):
        mask=(times>=at-.5)&(times<at+.5)
        chroma=matrix[:,mask].mean(axis=1)
        chroma=chroma/max(1e-9,float(chroma.sum()))
        lo=max(0,round((at-.5)*SR));hi=min(len(samples),round((at+.5)*SR))
        total=float(np.mean(samples[lo:hi]**2))
        tonal=float(np.mean(harmonic[lo:hi]**2))
        notes.append({'t':round(start+float(at),3),'tonalRatio':round(min(1.,tonal/max(1e-9,total)),4),'rms':round(float(np.sqrt(total)),5),'notes':[round(float(v),5) for v in chroma]})
    return {'start':round(start,4),'end':round(start+len(samples)/SR,4),'step':.02,
            'onset':[round(float(min(4,v)),3) for v in contour], 'beats':beats,'harmony':notes}

def analyze(key,entry,cache):
    dest=cache/(entry['sha']+'.mp3')
    if not dest.exists():
        request=urllib.request.Request(source_url(key),headers={'User-Agent':'MusicBox-PCM-Transition/1.0'})
        for attempt in range(3):
            try:
                with urllib.request.urlopen(request,timeout=60) as response:content=response.read(32*1024*1024+1)
                break
            except (TimeoutError, OSError):
                if attempt==2:raise
                time.sleep(1+attempt)
        if len(content)>32*1024*1024:raise ValueError('Audio too large: '+key)
        digest=hashlib.sha1(b'blob '+str(len(content)).encode()+b'\0'+content).hexdigest()
        if digest!=entry['sha']:raise ValueError('Source SHA changed: '+key)
        with tempfile.NamedTemporaryFile(dir=cache,delete=False) as temp:
            temp.write(content);temporary=pathlib.Path(temp.name)
        os.replace(temporary,dest)
    content=dest.read_bytes()
    digest=hashlib.sha1(b'blob '+str(len(content)).encode()+b'\0'+content).hexdigest()
    if digest!=entry['sha']:raise ValueError('Cached source SHA mismatch: '+key)
    raw=subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(dest),'-ac','1','-ar',str(SR),'-f','f32le','pipe:1'],capture_output=True,check=True,timeout=60).stdout
    samples=np.frombuffer(raw,dtype='<f4').copy()
    duration=len(samples)/SR
    if abs(duration-entry['duration'])>1.5:raise ValueError('Duration mismatch: '+key)
    tail=max(0.,entry['last']-20)
    result={'version':VERSION,'sha':entry['sha'],'method':'original-pcm-hpss-onset-chroma-20ms-v2',
            'intro':section(samples[:min(len(samples),20*SR)],0,entry['bpm']),
            'outro':section(samples[round(tail*SR):],tail,entry['bpm'])}
    return key,result

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--index',default=str(ROOT/'dj-deep-analysis.json'))
    parser.add_argument('--pairs',help='Candidate JSON with from/to keys; otherwise all tracks')
    parser.add_argument('--limit',type=int,default=0)
    parser.add_argument('--workers',type=int,default=2)
    parser.add_argument('--shard',default='0/1')
    parser.add_argument('--output',help='Write only new SHA-bound features, leaving input index unchanged')
    parser.add_argument('--cache',default=str(ROOT.parent/'scratch'/'dj-original-mp3'))
    args=parser.parse_args()
    if not shutil.which("ffmpeg"):parser.error("ffmpeg is required before downloading any audio")
    path=pathlib.Path(args.index);data=json.loads(path.read_text());entries=data['entries']
    keys=sorted(set(x[k] for x in json.loads(pathlib.Path(args.pairs).read_text()) for k in ('from','to'))) if args.pairs else sorted(entries)
    shard,parts=map(int,args.shard.split('/'))
    if not 0<=shard<parts<=32:parser.error('Invalid shard')
    keys=[key for pos,key in enumerate(keys) if pos%parts==shard]
    todo=[key for key in keys if entries[key].get('status')=='ok' and not
          (entries[key].get('pcmTransition',{}).get('version')==VERSION and entries[key]['pcmTransition'].get('sha')==entries[key]['sha'])]
    if args.limit:todo=todo[:args.limit]
    cache=pathlib.Path(args.cache);cache.mkdir(parents=True,exist_ok=True)
    # Initialize librosa/numba once before threads enter its lazy import path.
    section(np.zeros(SR*3,dtype=np.float32),0,120)
    errors=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1,min(4,args.workers))) as pool:
        futures={pool.submit(analyze,key,entries[key],cache):key for key in todo}
        for future in concurrent.futures.as_completed(futures):
            key=futures[future]
            try:
                _,result=future.result();entries[key]['pcmTransition']=result
                print('PCM',key,'beats',len(result['outro']['beats']),len(result['intro']['beats']),flush=True)
            except Exception as error:errors.append({'key':key,'error':str(error)});print('ERROR',key,str(error),flush=True)
    if args.output:
        output=pathlib.Path(args.output);output.parent.mkdir(parents=True,exist_ok=True)
        output.write_text(json.dumps({'version':VERSION,'entries':{key:{'sha':entries[key]['sha'],'pcmTransition':entries[key]['pcmTransition']} for key in keys if entries[key].get('pcmTransition')}},separators=(',',':'))+'\n')
    else:
        temporary=path.with_suffix('.tmp');temporary.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n');os.replace(temporary,path)
    print(json.dumps({'requested':len(todo),'errors':errors}),flush=True)
    if errors:raise SystemExit(1)
if __name__=='__main__':main()
