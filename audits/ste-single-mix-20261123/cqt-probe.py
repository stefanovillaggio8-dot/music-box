"""Reproduce the REJECTED, fixed original-PCM harmonic probe. No player API.

No HPSS, tempo/pitch manipulation, downloads, model inference or search.
The two cases and acceptance criteria were frozen before decoding. The Kid
Yugi case stopped at voice; only the reverse pop pair reached this probe.
Usage: analysis-env/python cqt-probe.py --cache ORIGINALS --output NEW.json
"""
import argparse,hashlib,json,pathlib,subprocess,tempfile,time
import numpy as np
import librosa

ROOT=pathlib.Path(__file__).resolve().parents[2]
PACKET=pathlib.Path(__file__).with_name('experiment.json')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache',required=True);parser.add_argument('--output',required=True)
    args=parser.parse_args();out=pathlib.Path(args.output)
    if out.exists():raise ValueError('Preserve existing evidence; supply a NEW output')
    packet=json.loads(PACKET.read_bytes())
    if len(packet['cases'])!=2:raise ValueError('Only the frozen two-case experiment is supported')
    with tempfile.TemporaryDirectory(prefix='musicbox-ste-single-') as tmp:
        cases=pathlib.Path(tmp)/'cases.json';proof=pathlib.Path(tmp)/'scope.json'
        cases.write_bytes(json.dumps(packet['cases']).encode())
        subprocess.run(['node','tools/ste-research-scope.cjs','--cases='+str(cases),'--output='+str(proof)],cwd=ROOT,check=True,capture_output=True)
        valid=json.loads(proof.read_bytes())
    allowed={c[k] for c in valid['cases'] for k in ('from','to')}
    index=json.loads((ROOT/'dj-deep-analysis.json').read_bytes())['entries']
    pre=packet['preflight']['reverse'];geometry=pre['geometry'];sr=44100;hop=256
    if abs(index[pre['from']]['duration']-geometry['end'])>1e-6:raise ValueError('Frozen duration changed; do not adapt this rejected experiment')
    if librosa.__version__!='0.11.0':raise ValueError('The frozen probe requires librosa 0.11.0')
    rows=[];started=time.monotonic()
    for role,key in [('source',pre['from']),('target',pre['to'])]:
        if key not in allowed:raise ValueError('Outside current Ste cases')
        e=index[key];file=pathlib.Path(args.cache)/(e['sha']+'.mp3');content=file.read_bytes()
        if hashlib.sha1(b'blob '+str(len(content)).encode()+b'\0'+content).hexdigest()!=e['sha']:raise ValueError('Original SHA changed')
        start=max(0,geometry['begin']-1.2) if role=='source' else 0.
        seconds=e['duration']-start if role=='source' else geometry['fade']*geometry['rate']+1.2
        # Decode BEFORE trimming, preserving MP3 reservoir/priming context.
        raw=subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(file),'-ss',str(start),'-t',str(seconds),'-ar',str(sr),'-ac','2','-f','f32le','pipe:1'],check=True,capture_output=True,timeout=60).stdout
        audio=np.frombuffer(raw,dtype='<f4').reshape(-1,2);channels=[]
        for channel in range(2):
            y=audio[:,channel].copy()
            C=np.abs(librosa.cqt(y,sr=sr,hop_length=hop,fmin=librosa.note_to_hz('C1'),n_bins=252,bins_per_octave=36,tuning=0.,pad_mode='constant'))
            chroma=librosa.feature.chroma_cqt(C=C,sr=sr,hop_length=hop,fmin=librosa.note_to_hz('C1'),bins_per_octave=36,n_chroma=12,norm=None)
            times=np.arange(chroma.shape[1])*hop/sr;features=[]
            for t in np.arange(.5,geometry['fade']-.49,.5):
                absolute=geometry['begin']+t if role=='source' else t*geometry['rate'];local=absolute-start
                mask=(times>=local-.5)&(times<local+.5);notes=np.mean(chroma[:,mask],axis=1);notes=notes/max(float(np.sum(notes)),1e-12)
                lo=max(0,round((local-.5)*sr));hi=min(len(y),round((local+.5)*sr));rms=float(np.sqrt(np.mean(y[lo:hi]**2)))
                # Conservative all-tonal assumption; NEVER a measured HPSS ratio.
                features.append({'t':absolute,'rms':rms,'tonalRatio':1.,'notes':notes.tolist()})
            channels.append({'channel':channel,'start':start,'end':start+len(y)/sr,'harmony':features})
        rows.append({'role':role,'key':key,'sha':e['sha'],'sourceSha256':hashlib.sha256(content).hexdigest(),'decodedFrames':len(audio),'decodedSeconds':len(audio)/sr,'channels':channels})
    result={'method':'fixed-original-stereo-cqt-magnitude-v1','sampleRate':sr,'librosaVersion':librosa.__version__,'newModelInferences':0,'seconds':time.monotonic()-started,'rows':rows}
    out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes((json.dumps(result,indent=2)+'\n').encode('utf8'))
    print(json.dumps({'filesDecoded':len(rows),'analyzedStereoSeconds':sum(r['decodedSeconds'] for r in rows),'wallSeconds':result['seconds']}))

if __name__=='__main__':main()
