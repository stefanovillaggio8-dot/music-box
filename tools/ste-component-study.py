"""Three frozen Ste component views. CPU/offline research, never installs plans."""
from pathlib import Path
import argparse,hashlib,importlib.util,json,os,subprocess,time,urllib.request

ROOT=Path(__file__).resolve().parents[1]
BEAT_SHA='8c328b45f59d8dd3dff219253ff6a8d6482be57d0133a29140e2febbf8eb8331'
def module(name,file):
    s=importlib.util.spec_from_file_location(name,ROOT/'tools'/file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def dump(file,value):file.write_bytes((json.dumps(value,separators=(',',':'))+'\n').encode())
def sha(file):return hashlib.sha256(file.read_bytes()).hexdigest()
def retrieve(url,limit):
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'MusicBox-Ste-Component-Study/1'}),timeout=60) as r:data=r.read(limit+1)
    if len(data)>limit:raise ValueError('Bounded download exceeded')
    return data
def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--protocol',required=True);p.add_argument('--output',required=True);a=p.parse_args()
    protocol_file=Path(a.protocol).resolve();protocol=json.loads(protocol_file.read_bytes());out=Path(a.output).resolve()
    if out.exists():raise ValueError('Preserve previous evidence: NEW output directory required')
    # Membership and exact original identities are checked before models/audio.
    subprocess.run(['node','tools/ste-research-scope.cjs','--cases='+str(protocol_file.parent/'cases.json'),'--output='+str(out/'scope.json')],cwd=ROOT,check=True,capture_output=True)
    scope=json.loads((out/'scope.json').read_bytes());allowed={c[k] for c in scope['cases'] for k in ('from','to')}
    if protocol['profile']!='Ste' or len(protocol['roles'])!=3 or protocol['allowInstallation'] is not False:raise ValueError('Frozen Ste-only budget required')
    index_bytes=(ROOT/'dj-deep-analysis.json').read_bytes();index=json.loads(index_bytes)['entries'];baseline=json.loads((protocol_file.parent/'baseline-selected.json').read_bytes())['entries']
    assert hashlib.sha256(index_bytes).hexdigest()==scope['scope']['runtimeEvidence']['indexSha256']
    assert len({(r['key'],r['role']) for r in protocol['roles']})==3
    cache=out/'originals';cache.mkdir()
    files={}
    for role in protocol['roles']:
        key=role['key'];assert key in allowed and role['role'] in ['intro','outro'] and key.startswith('audio/songs/')
        assert index[key]['sha']==baseline[key]['sha']
        source_sha=index[key]['sha'];file=cache/(source_sha+'.mp3')
        # Prefer the already cached original on developer machines; CI fetches
        # ONLY these selected recordings, never scans the audio repository.
        existing=ROOT.parent/'original-mp3'/file.name
        data=existing.read_bytes() if existing.exists() else retrieve('https://raw.githubusercontent.com/stefanovillaggio8-dot/music-box-brani/main/'+key[6:],32*1024*1024)
        assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==source_sha
        file.write_bytes(data);files[key]=file
    import numpy as np,torch,soxr
    from demucs.pretrained import get_model
    from demucs.apply import apply_model
    from beat_this.inference import Audio2Frames
    from beat_this.model.postprocessor import Postprocessor
    torch.set_num_threads(protocol['threads']);torch.manual_seed(20261124)
    pcm=module('transition','dj-transition-features.py');core=module('structure','dj-structure-core.py');support=module('support','dj-component-support.py')
    checkpoint=Path(os.environ['TORCH_HOME'])/'hub/checkpoints/beat_this-final0.ckpt';checkpoint.parent.mkdir(parents=True,exist_ok=True)
    if not checkpoint.exists():
        candidates=['https://cloud.cp.jku.at/public.php/dav/files/7ik4RrBKTS273gp/final0.ckpt','https://huggingface.co/OpenStems/OpenStems-Models/resolve/f10f75fa1edf642e63291c6671806b9ca9622986/ultra-20261105/assets/'+BEAT_SHA+'/beat_this-final0.ckpt']
        for url in candidates:
            try:
                content=retrieve(url,100*1024*1024);assert hashlib.sha256(content).hexdigest()==BEAT_SHA;checkpoint.write_bytes(content);break
            except Exception as e:print('Verified beat model endpoint unavailable:',type(e).__name__,flush=True)
    assert checkpoint.exists() and sha(checkpoint)==BEAT_SHA
    beat_model=Audio2Frames(str(checkpoint),device='cpu');separator=get_model(protocol['model']).cpu().eval()
    assert separator.samplerate==44100 and separator.audio_channels==2
    model_files={str(f.relative_to(Path(os.environ['TORCH_HOME']))):sha(f) for f in Path(os.environ['TORCH_HOME']).rglob('*.th')}
    assert model_files,'Exact Demucs checkpoint receipt required'
    report={'method':protocol['method'],'protocolSha256':sha(protocol_file),'beatModelSha256':BEAT_SHA,'demucsCheckpointSha256':model_files,'profile':'Ste','entries':{},'certified':False,'installed':False,'physicalIPhone':False,'newModelCalls':0}
    for role in protocol['roles']:
        started=time.monotonic();key=role['key'];kind=role['role'];entry=index[key];start=0 if kind=='intro' else max(0,entry['duration']-protocol['contextSeconds'])
        raw=subprocess.check_output(['ffmpeg','-nostdin','-v','error','-i',str(files[key]),'-ss',str(start),'-t',str(protocol['contextSeconds']),'-ac','2','-ar','44100','-f','f32le','pipe:1'])
        original=np.frombuffer(raw,dtype='<f4').reshape(-1,2).copy();assert np.isfinite(original).all()
        if kind=='outro':assert abs(start+len(original)/44100-entry['duration'])<.002,'No fitted decoder clock'
        wav=torch.from_numpy(original.T.copy());ref=wav.mean(0);mean=ref.mean();std=ref.std();assert std>.00001
        # Official offline separation normalisation; NEVER applied to playback.
        with torch.inference_mode():stems=apply_model(separator,((wav-mean)/std)[None],device='cpu',shifts=protocol['shifts'],split=True,overlap=protocol['overlap'],progress=False,num_workers=0)[0]
        stems=(stems*std+mean).cpu().numpy().transpose(0,2,1);assert stems.shape==(4,len(original),2) and np.isfinite(stems).all()
        report['newModelCalls']+=1
        labels=list(separator.sources);drums=stems[labels.index('drums')];vocals=stems[labels.index('vocals')];accompaniment=np.sum([stems[i] for i,v in enumerate(labels) if v!='vocals'],axis=0)
        small=soxr.resample(original,44100,pcm.SR,axis=0);drum_small=soxr.resample(drums,44100,pcm.SR,axis=0)
        drum_features=pcm.section(drum_small.mean(1),0,entry['bpm'])
        harmonic_features=pcm.section(soxr.resample(accompaniment.mean(1),44100,pcm.SR),start,entry['bpm'])['harmony']
        signal=soxr.resample(drums.mean(1),44100,22050);beat,down=beat_model(signal,22050);beats,downbeats=Postprocessor()(beat,down)
        attack_support=support.support(small,drum_small,pcm.SR,beats)
        bars=core.measured_bars(beats,downbeats,beat.sigmoid().numpy(),down.sigmoid().numpy(),drum_features['onset'],sparse_candidates=True)
        for bar in bars:
            for field in ['start','end']:bar[field]+=start
            for field in ['beats','modelBeats']:bar[field]=[v+start for v in bar[field]]
        for row in attack_support:row['modelAt']+=start;row['componentObservedAt']+=start
        envelope=[]
        for frame in range(int(np.ceil(start*10)),int(np.floor((start+len(original)/44100)*10))):
            lo=round((frame/10-start)*44100);hi=min(len(original),lo+4410)
            v=float(np.sqrt(np.mean(vocals[lo:hi].astype(np.float64)**2)));mix=float(np.sqrt(np.mean(original[lo:hi].astype(np.float64)**2)))
            envelope.append({'t':frame/10,'vocalRms':v,'mixRms':mix,'relativeVocal':v/max(mix,.003),'notHumanVocalTruth':True})
        audio_file=out/(entry['sha']+'-'+kind+'.npz');np.savez_compressed(audio_file,original=original,stems=stems)
        result={'sha':entry['sha'],'role':kind,'start':start,'end':start+len(original)/44100,'rate':44100,'labels':labels,'audioFile':audio_file.name,'audioSha256':sha(audio_file),
                'componentPcm':{**drum_features,'start':start,'end':start+drum_features['end'],'beats':[v+start for v in drum_features['beats']]},
                'componentBars':bars,'modelBeats':[float(t)+start for t in beats],'modelDownbeats':[float(t)+start for t in downbeats],
                'originalAttackSupport':attack_support,'accompanimentHarmony':harmonic_features,'vocalEnvelope':envelope,'reconstruction':support.reconstruction(original,stems),
                'modelProbabilitiesAreNotCalibratedAccuracy':True,'componentPcmIsNotOriginalMix':True,'seconds':time.monotonic()-started}
        report['entries'][key]=result;dump(out/'component-study.json',report)
        print(json.dumps({'key':key,'role':kind,'componentBars':len(bars),'modelBeats':len(beats),'originalSupported':sum(r['originalSupported'] for r in attack_support),'reconstruction':result['reconstruction'],'seconds':round(result['seconds'],2)}),flush=True)
    assert report['newModelCalls']==3
if __name__=='__main__':main()
