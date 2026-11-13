#!/usr/bin/env python3
"""Whole-file metrical/structural/vocal evidence from SHA-verified MP3s.

Offline only. Model outputs are explicitly hypotheses, never labelled human
truth. Large PCM windows remain artifacts; the player receives compact cues.
"""
import argparse,hashlib,importlib.util,json,os,pathlib,subprocess,time,urllib.request,tarfile,io
os.environ.setdefault('TF_CPP_MIN_LOG_LEVEL','2')
os.environ.setdefault('TF_NUM_INTRAOP_THREADS','2')
os.environ.setdefault('TF_NUM_INTEROP_THREADS','1')
import numpy as np
import librosa,soxr,torch
from beat_this.inference import Audio2Frames
from beat_this.model.postprocessor import Postprocessor
from spleeter.separator import Separator
import tensorflow as tf
tf.get_logger().setLevel('ERROR')

ROOT=pathlib.Path(__file__).resolve().parents[1]
MODEL_HASHES={
 'torch/hub/checkpoints/beat_this-final0.ckpt':'8c328b45f59d8dd3dff219253ff6a8d6482be57d0133a29140e2febbf8eb8331',
 'pretrained_models/2stems/model.data-00000-of-00001':'7747f9fd2c782306dbec1504360fbb645a097a48446f23486c3ff9c89bc11788',
 'pretrained_models/2stems/model.index':'55661a09f79c86071fc7077b44b4cf1f01b6d82bbbb83ed94cb68a2f9944e378',
 'pretrained_models/2stems/model.meta':'6e1f6d86a22bb452a58cb20e3de87b416f8a79e626ca223e20f763ab2d21ec95'}
def module(name,file):
    spec=importlib.util.spec_from_file_location(name,pathlib.Path(__file__).with_name(file))
    result=importlib.util.module_from_spec(spec);spec.loader.exec_module(result);return result
core=module('structure_core','dj-structure-core.py')
pcm=module('transition_features','dj-transition-features.py')

def source(key,entry,cache):
    target=cache/(entry['sha']+'.mp3')
    if not target.exists():
        request=urllib.request.Request(pcm.source_url(key),headers={'User-Agent':'MusicBox-Whole-Structure/1'})
        for attempt in range(3):
            try:
                with urllib.request.urlopen(request,timeout=90) as response:content=response.read(32*1024*1024+1)
                break
            except (OSError,TimeoutError):
                if attempt==2:raise
                time.sleep(attempt+1)
    else:content=target.read_bytes()
    if len(content)>32*1024*1024:raise ValueError('Source too large')
    actual=hashlib.sha1(b'blob '+str(len(content)).encode()+b'\0'+content).hexdigest()
    if actual!=entry['sha']:raise ValueError('Original source SHA mismatch '+key)
    if not target.exists():target.write_bytes(content)
    raw=subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(target),'-ac','2','-ar','44100','-f','f32le','pipe:1'],capture_output=True,check=True,timeout=90).stdout
    stereo=np.frombuffer(raw,dtype='<f4').reshape(-1,2).copy()
    if abs(len(stereo)/44100-entry['duration'])>1.5:raise ValueError('Duration mismatch '+key)
    return stereo

def vocal_envelope(separator,stereo):
    sr=44100;step=4410;frames=int(np.ceil(len(stereo)/step))
    voice=np.zeros(frames,dtype=float);mix=np.zeros(frames,dtype=float)
    # Bounded 28s inference, with context at each 24s seam. Each output frame
    # is taken from the original time axis, not concatenated decoder offsets.
    for begin in range(0,len(stereo),24*sr):
        end=min(len(stereo),begin+24*sr);lo=max(0,begin-2*sr);hi=min(len(stereo),end+2*sr)
        separated=separator.separate(stereo[lo:hi])['vocals']
        for frame in range(begin//step,int(np.ceil(end/step))):
            a=frame*step;b=min(len(stereo),a+step)
            voice[frame]=float(np.sqrt(np.mean(separated[a-lo:b-lo]**2)))
            mix[frame]=float(np.sqrt(np.mean(stereo[a:b]**2)))
    return voice,mix

def analyze(key,entry,stereo,beat_model,separator):
    mono=stereo.mean(axis=1);signal=soxr.resample(mono,44100,22050)
    beat,down=beat_model(signal,22050);beats,downs=Postprocessor()(beat,down)
    beat_p=beat.sigmoid().numpy();down_p=down.sigmoid().numpy()
    voice,mix=vocal_envelope(separator,stereo)
    small=soxr.resample(mono,44100,pcm.SR).astype(np.float32)
    harmonic,percussive=librosa.effects.hpss(small,margin=(2.,2.))
    onset=librosa.onset.onset_strength(y=percussive,sr=pcm.SR,hop_length=pcm.HOP)
    times=librosa.frames_to_time(np.arange(len(onset)),sr=pcm.SR,hop_length=pcm.HOP)
    floor=float(np.quantile(onset,.2));scale=max(.01,float(np.quantile(onset,.95)-floor))
    grid=np.arange(0,len(small)/pcm.SR,.02)
    contour=np.minimum(4,np.maximum(0,(np.interp(grid,times,onset)-floor)/scale))
    bars=core.measured_bars(beats,downs,beat_p,down_p,contour)
    chroma=librosa.feature.chroma_stft(y=harmonic,sr=pcm.SR,hop_length=pcm.HOP,n_fft=2048)
    mfcc=librosa.feature.mfcc(y=small,sr=pcm.SR,hop_length=pcm.HOP,n_mfcc=12,n_fft=2048)
    rms=librosa.feature.rms(y=small,hop_length=pcm.HOP,frame_length=2048)[0]
    spectral=np.abs(librosa.stft(small,n_fft=2048,hop_length=pcm.HOP))**2
    frequencies=librosa.fft_frequencies(sr=pcm.SR,n_fft=2048)
    bass=spectral[frequencies<=180].sum(axis=0)/np.maximum(1e-9,spectral.sum(axis=0))
    boundaries,phrases=core.summarize_structure(bars,chroma,mfcc,rms,bass,times,voice)
    windows=core.candidate_windows(bars,boundaries,phrases,voice,mix,len(stereo)/44100)
    for number,window in enumerate(windows):
        start=max(0,window['start']-.18);end=min(len(small)/pcm.SR,window['end']+.85)
        # PCM extraction stays identical to the independently tested existing
        # extractor. Replace its tempo-guided pulses with observed model pulses.
        part=pcm.section(small[round(start*pcm.SR):round(end*pcm.SR)],start,window['bpm'])
        part['beats']=window['beats'];part.pop('grids',None)
        window['pcm']=part;window['id']=str(number)
        a=max(0,int(np.floor(window['start']/.1)));b=int(np.ceil((window['end']+.7)/.1))
        window['vocalRms']=[round(float(x),6) for x in voice[a:b]]
        window['mixRms']=[round(float(x),6) for x in mix[a:b]];window['vocalStart']=a*.1
    return {'version':1,'sha':entry['sha'],'duration':len(stereo)/44100,
        'method':'beat-this-final0+spleeter-2stems+bar-novelty-v1',
        'modelPosteriorIsCalibratedAccuracy':False,'semanticLabelsVerified':False,
        'modelSha256':MODEL_HASHES,
        'beats':[round(float(x),4) for x in beats],'downbeats':[round(float(x),4) for x in downs],
        'reliableBars':bars,'boundaries':boundaries,'phraseHypotheses':phrases,
        'vocalStep':.1,'vocalRms':[round(float(x),6) for x in voice],
        'mixRms':[round(float(x),6) for x in mix],'windows':windows}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--index',default=str(ROOT/'dj-deep-analysis.json'))
    parser.add_argument('--cache',default=str(ROOT.parent/'original-mp3'))
    parser.add_argument('--models',default=str(ROOT.parent/'models'))
    parser.add_argument('--output',required=True);parser.add_argument('--shard',default='0/1')
    parser.add_argument('--only',action='append');parser.add_argument('--limit',type=int,default=0)
    args=parser.parse_args();index=json.loads(pathlib.Path(args.index).read_text())
    output=pathlib.Path(args.output).resolve()
    cache=pathlib.Path(args.cache).resolve();cache.mkdir(parents=True,exist_ok=True)
    models=pathlib.Path(args.models).resolve();models.mkdir(parents=True,exist_ok=True)
    os.environ['TORCH_HOME']=str(models/'torch');os.chdir(models)
    target=models/'pretrained_models/2stems'
    if not (target/'.probe').exists():
        # urllib follows the official release redirect; old Spleeter HTTPX
        # defaults do not. Extract only expected regular checkpoint files.
        with urllib.request.urlopen('https://github.com/deezer/spleeter/releases/download/v1.4.0/2stems.tar.gz',timeout=120) as response:
            content=response.read(100*1024*1024+1)
        if len(content)>100*1024*1024:raise ValueError('Unexpected model size')
        target.mkdir(parents=True,exist_ok=True)
        with tarfile.open(fileobj=io.BytesIO(content),mode='r:gz') as archive:
            for member in archive.getmembers():
                name=pathlib.PurePosixPath(member.name).name
                if member.isfile() and name in ('model.index','model.meta','model.data-00000-of-00001'):
                    (target/name).write_bytes(archive.extractfile(member).read())
        if not (target/'model.index').exists():raise ValueError('Missing checkpoint')
        (target/'.probe').write_text('OK')
    torch.set_num_threads(2)
    beat_model=Audio2Frames('final0',device='cpu');separator=Separator('spleeter:2stems',multiprocess=False)
    for file,expected in MODEL_HASHES.items():
        if hashlib.sha256((models/file).read_bytes()).hexdigest()!=expected:raise ValueError('Model SHA256 mismatch: '+file)
    shard,parts=map(int,args.shard.split('/'));assert 0<=shard<parts<=32
    keys=sorted(k for k,v in index['entries'].items() if v.get('status')=='ok')
    if args.only:keys=[k for k in keys if k in args.only]
    keys=[k for i,k in enumerate(keys) if i%parts==shard]
    if args.limit:keys=keys[:args.limit]
    output.parent.mkdir(parents=True,exist_ok=True)
    entries={};errors=[]
    if output.exists():
        previous=json.loads(output.read_text());entries=previous.get('entries',{})
        entries={k:v for k,v in entries.items() if k in keys and v.get('sha')==index['entries'][k]['sha'] and v.get('modelSha256')==MODEL_HASHES}
    for key in keys:
        if key in entries:continue
        at=time.monotonic()
        try:
            entry=index['entries'][key];stereo=source(key,entry,cache)
            result=analyze(key,entry,stereo,beat_model,separator);entries[key]=result
            print(json.dumps({'key':key,'bars':len(result['reliableBars']),'sections':len(result['boundaries']),
                'phrases':len(result['phraseHypotheses']),'entries':sum(w['role']=='entry' for w in result['windows']),
                'exits':sum(w['role']=='exit' for w in result['windows']),'seconds':round(time.monotonic()-at,2)}),flush=True)
        except Exception as error:
            message=type(error).__name__+': '+str(error).split('?')[0][:300]
            errors.append({'key':key,'error':message});print('ERROR',key,message,flush=True)
        output.write_text(json.dumps({'version':1,'entries':entries,'errors':errors},separators=(',',':'))+'\n')
    if errors:raise SystemExit(1)
if __name__=='__main__':main()
