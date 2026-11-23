#!/usr/bin/env python3
"""Bounded Ste-only original-stereo attack refinement. Discovery, never certification."""
import argparse, hashlib, json, pathlib, subprocess, tempfile
import numpy as np
from scipy.ndimage import uniform_filter1d
from scipy.signal import butter, sosfiltfilt
ROOT=pathlib.Path(__file__).resolve().parents[3]
SR=22050

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def freshness():return {p:sha(ROOT/p) for p in ['app.js','stato.json','playlist.json','online-imports.json','dj-deep-analysis.json']}
def current_scope():
    with tempfile.TemporaryDirectory(prefix='musicbox-ste-scope-') as d:
        subprocess.run(['node','tools/simulate-library-listening.cjs','--only-profile=Ste','--personal-only=true','--exclude-playlists=Ste:gym','--inventory-only=true','--scope-dir='+d,'--output='+str(pathlib.Path(d)/'report.json')],cwd=ROOT,check=True,capture_output=True,timeout=30)
        scope=json.loads((pathlib.Path(d)/'Ste.json').read_text(encoding='utf8'))
    if scope['name']!='Ste':raise ValueError('Only actual Ste personal membership is allowed')
    return scope

def validate_cases(cases,scope,index,features):
    if scope.get('name')!='Ste':raise ValueError('Ste-only research')
    if not isinstance(cases,list) or not 1<=len(cases)<=4:raise ValueError('Use one to four representative Ste cases, not an exhaustive campaign')
    members={t['key']:t for t in scope['tracks']};selected={}
    for case in cases:
        for field,role in [('from','outro'),('to','intro')]:
            key=case.get(field);row=members.get(key)
            if not row:raise ValueError('Outside current Ste personal library: '+str(key))
            entry=index.get(key);feature=features.get(key)
            if not entry or not feature or entry['sha']!=row['sha'] or feature['sha']!=row['sha'] or feature['pcmTransition']['sha']!=row['sha']:raise ValueError('Source/feature SHA mismatch: '+key)
            selected[(key,role)]=feature['pcmTransition'][role]
    return selected

def energy_novelty(samples,sr=SR):
    x=np.asarray(samples,dtype=float)
    if x.ndim!=2 or x.shape[1]!=2 or len(x)<sr or not np.isfinite(x).all():raise ValueError('Finite original stereo PCM required')
    hop=max(1,round(sr*.003));times=np.arange(0,len(x),hop)/sr
    score=np.zeros(len(times))
    for lo,hi in [(35,180),(180,2000),(2000,min(8000,sr*.45))]:
        band=sosfiltfilt(butter(3,[lo,hi],fs=sr,btype='bandpass',output='sos'),x,axis=0)
        # Power per channel preserves antiphase percussion. No L+R downmix.
        power=uniform_filter1d(np.mean(band*band,axis=1),size=max(3,round(sr*.008)),mode='nearest')
        lag=max(1,round(sr*.003));rise=np.maximum(0,power[lag:]-power[:-lag])
        rise=np.pad(rise,(lag,0))[::hop]
        floor=float(np.quantile(rise,.2));scale=float(np.quantile(rise,.95)-floor)
        if scale>1e-10:score=np.maximum(score,(rise-floor)/scale)
    return times,np.maximum(0,score)

def refine(anchors,times,score,start,radius=.04):
    result=[]
    for value in anchors:
        positions=np.flatnonzero(np.abs(start+times-value)<=radius)
        if not len(positions):result.append(value);continue
        best=positions[int(np.argmax(score[positions]))]
        result.append(round(start+float(times[best]),6) if score[best]>=.25 else value)
    if len(result)!=len(anchors) or any(b<=a for a,b in zip(result,result[1:])) or any(abs(a-b)>radius+1e-6 for a,b in zip(anchors,result)):raise ValueError('Refinement cannot remove, add, reorder or move distant anchors')
    return result

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--cases',required=True,type=pathlib.Path);p.add_argument('--features',required=True,type=pathlib.Path)
    p.add_argument('--cache',required=True,type=pathlib.Path);p.add_argument('--output',required=True,type=pathlib.Path)
    args=p.parse_args()
    if args.output.exists():raise ValueError('Preserve previous experiment; use a new output path')
    initial=freshness();scope=current_scope();cases=json.loads(args.cases.read_text(encoding='utf8'))
    index=json.loads((ROOT/'dj-deep-analysis.json').read_text(encoding='utf8'))['entries'];features=json.loads(args.features.read_text(encoding='utf8'))['entries']
    selected=validate_cases(cases,scope,index,features)
    report={'method':'independent-original-stereo-energy-rise-3ms-v1','discoveryOnly':True,'certified':False,'profile':'Ste','membershipEvidence':scope['membershipEvidence'],'inputHashes':initial,'casesSha256':sha(args.cases),'featuresSha256':sha(args.features),'newModels':False,'networkAudioDownloads':0,'radiusSeconds':.04,'entries':{}}
    for (key,role),part in selected.items():
        entry=index[key];file=args.cache/(entry['sha']+'.mp3');data=file.read_bytes()
        if hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()!=entry['sha']:raise ValueError('Original MP3 SHA mismatch: '+key)
        start=max(0,part['start']-.15);end=min(entry['duration'],part['end']+.15)
        cmd=['ffmpeg','-nostdin','-v','error','-i',str(file),'-ss',str(start),'-t',str(end-start),'-ac','2','-ar',str(SR),'-f','f32le','pipe:1']
        raw=subprocess.run(cmd,capture_output=True,check=True,timeout=60).stdout
        samples=np.frombuffer(raw,dtype='<f4').reshape(-1,2);times,score=energy_novelty(samples)
        grids=[{'beats':part['beats'],'method':'original-base'},*part.get('grids',[])]
        refined=[]
        for grid in grids:
            new=refine(grid['beats'],times,score,start)
            refined.append({'bpm':grid.get('bpm'),'sourceMethod':grid.get('method'),'originalBeats':grid['beats'],'beats':new,'maximumShiftSeconds':max([abs(a-b) for a,b in zip(new,grid['beats'])],default=0)})
        report['entries'].setdefault(key,{'sha':entry['sha'],'sourceAudioSha256':hashlib.sha256(data).hexdigest()})[role]={'start':part['start'],'end':part['end'],'grids':refined,'sourceStereoRms':float(np.sqrt(np.mean(samples*samples))),'monoRms':float(np.sqrt(np.mean(samples.mean(axis=1)**2)))}
        print('REFINED STE',key,role,len(refined),flush=True)
    if initial!=freshness():raise ValueError('Current scope changed during analysis; retain evidence separately and refresh scope')
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_bytes((json.dumps(report,separators=(',',':'))+'\n').encode())
if __name__=='__main__':main()
