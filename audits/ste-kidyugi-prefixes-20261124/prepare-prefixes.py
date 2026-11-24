"""Four frozen incoming originals; reuse published source, never install cues."""
from pathlib import Path
import json, hashlib, subprocess, sys, importlib.util
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).resolve().parent
out=Path(sys.argv[1]).resolve()
assert not out.exists(), 'Preserve existing evidence'
p=json.loads((HERE/'protocol.json').read_bytes())
subprocess.run(['node','tools/ste-research-scope.cjs','--cases='+str(HERE/'cases.json'),'--output='+str(out/'selection.json')],cwd=ROOT,check=True,capture_output=True)
index=json.loads((ROOT/'dj-deep-analysis.json').read_bytes())['entries']
old=json.loads((ROOT/'audits/ste-filmografo-quiet-20261124/recordings-native.json').read_bytes())
source=old['recordings'][index[p['source']]['sha']]
assert source['key']==p['source'] and source['quietSuffix']['begin']==p['begin'] and source['duration']==p['end']
assert len(source['quietSuffix']['native'])==8
spec=importlib.util.spec_from_file_location('clock',ROOT/'tools/mp3-gapless-clock.py');clock=importlib.util.module_from_spec(spec);spec.loader.exec_module(clock)
records={source['sourceSha']:source}; summary=[];fade=p['end']-p['begin']
source_peak=max(r['sourceTailPeak'] for r in source['quietSuffix']['native'])
for key in p['targets']:
    e=index[key];sha=e['sha'];file=ROOT.parent/'original-mp3'/(sha+'.mp3');raw=file.read_bytes()
    assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()==sha
    r={'key':key,'sourceSha':sha,'duration':e['duration'],'sourceSha256':hashlib.sha256(raw).hexdigest(),'clock':clock.mp3_clock(file,sha)}
    rates={}
    for rate in p['rates']:
        pcm=subprocess.check_output(['ffmpeg','-nostdin','-v','error','-i',str(file),'-t',str(p['prefixSeconds']),'-ac','2','-ar',str(rate),'-f','f32le','pipe:1'])
        x=np.frombuffer(pcm,dtype='<f4').reshape(-1,2);assert len(x)>=round(p['prefixSeconds']*rate) and np.isfinite(x).all()
        windows=[{'at':i/rate,'seconds':.25,'rms':float(np.sqrt(np.mean(np.asarray(x[i:i+round(.25*rate)],np.float64)**2)))} for i in range(0,round(fade*rate)-round(.25*rate)+1,round(.25*rate))]
        row={'frames':len(x),'pcmSha256':hashlib.sha256(pcm).hexdigest(),'maximumPeak':float(np.max(np.abs(x[:round((fade+.1)*rate)]))),'windows':windows,'meaningfulSeconds':sum(w['seconds'] for w in windows if w['rms']>=p['meaningfulRms'])}
        rates[str(rate)]=row
    r['prefix']={'method':'original-stereo-prefix-factored-v1','sourceSha':sha,'through':p['prefixSeconds'],'rates':rates,'native':[],'notNativeCertified':True}
    records[sha]=r
    failures=[]
    if any(v['maximumPeak']+source_peak>p['maximumSummedPeak'] for v in rates.values()):failures.append('original-prefix-headroom')
    if any(v['meaningfulSeconds']<p['minimumMeaningfulSeconds'] for v in rates.values()):failures.append('insufficient-meaningful-original-intro')
    summary.append({'key':key,'rejections':failures,'needsNativeDecode':not failures,'rates':rates})
report={'version':1,'prefixOnly':True,'evaluationOnly':True,'notPlaybackCertified':True,'recordings':records,'cases':json.loads((HERE/'cases.json').read_bytes()),'sourceDecodes':0,'newPrefixDecodes':8,'newModels':0,'installed':False,'summary':summary}
(out/'recordings.json').write_bytes((json.dumps(report,indent=2)+'\n').encode())
print(json.dumps([{'key':r['key'],'rejections':r['rejections'],'needsNativeDecode':r['needsNativeDecode'],'peaks':[v['maximumPeak'] for v in r['rates'].values()],'meaningful':[v['meaningfulSeconds'] for v in r['rates'].values()]} for r in summary]))
