#!/usr/bin/env python3
"""Reproduce deployed common mixes and measure their actual isolated entrances.

Explicit personal scopes are mandatory; never infer account ownership from the
global audio catalog. No library, playlist, MP3 or browser storage is written.
"""
import argparse, hashlib, importlib.util, json, pathlib, subprocess, tempfile
import numpy as np
from scipy.signal import resample_poly

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--index',default='dj-deep-analysis.json')
    ap.add_argument('--scopes',required=True)
    ap.add_argument('--cache',required=True)
    ap.add_argument('--output',required=True)
    ap.add_argument('--reuse-unmatched',action='store_true',help='Retain explicitly unresolved old renders while auditing newly discovered assets')
    args=ap.parse_args()
    root=pathlib.Path(__file__).resolve().parent.parent
    implementation_hash=hashlib.sha256(b''.join((root/p).read_bytes() for p in
        ('tools/introduction-exposure.mjs','tools/render-composite-mix.mjs','audio-composite-core.mjs','audio-stretch-core.mjs'))).hexdigest()
    index=json.loads(pathlib.Path(args.index).read_text(encoding='utf-8'))
    scopes=[json.loads(p.read_text(encoding='utf-8')) for p in pathlib.Path(args.scopes).glob('*.json')]
    if not scopes or any(s.get('name') not in ('Ste','Diego','Emanuele') for s in scopes):
        raise ValueError('Explicit personal scopes required')
    spec=importlib.util.spec_from_file_location('pcm_audit',root/'tools/audit-full-beat-audio.py')
    audit=importlib.util.module_from_spec(spec);spec.loader.exec_module(audit)
    rate=48000;audit.SR=rate
    output=pathlib.Path(args.output);output.parent.mkdir(parents=True,exist_ok=True)
    rows=[];seen=set()
    previous={r['assetSha256']:r for r in json.loads(output.read_text(encoding='utf-8')).get('results',[])
        if (r.get('identical') and r.get('implementationSha256')==implementation_hash)
        or (args.reuse_unmatched and not r.get('identical'))} if output.exists() else {}
    for scope in scopes:
        by_sha={t['sha']:t['key'] for t in scope['tracks']}
        for track in scope['tracks']:
            source=index['entries'][track['key']]
            records={**source.get('pcmBeatPlans',{}),**source.get('structuralBeatPlans',{})}
            for sha,record in records.items():
                if sha not in by_sha:continue
                for cue in [record['cue'],*record.get('cues',[])]:
                    composite=cue.get('composite',{});asset_sha=composite.get('sha256')
                    if not asset_sha or asset_sha in seen:continue
                    seen.add(asset_sha)
                    if asset_sha in previous:
                        rows.append(previous[asset_sha]);continue
                    try:
                        a=audit.source(track['key'],source['sha'],pathlib.Path(args.cache))
                        b=audit.source(by_sha[sha],sha,pathlib.Path(args.cache))
                        pre=composite.get('preRoll',.3);release=composite.get('releaseSeconds',.9)
                        outgoing=audit.decode(a,cue['begin']-pre,cue['fade']+2+pre)
                        incoming=audit.decode(b,0,cue['fade']*1.05+4)
                        with tempfile.TemporaryDirectory(prefix='exposure-') as folder:
                            folder=pathlib.Path(folder)
                            for name,value in [('outgoing',outgoing),('incoming',incoming)]:
                                (folder/(name+'.f32')).write_bytes(value.astype('<f4').tobytes())
                            render={**cue,'renderPreRoll':pre,'renderReleaseSeconds':release,
                                'renderPeakCeiling':.96,
                                'renderGainMode':'lookahead' if composite.get('gainProof') else 'constant',
                                'warmupOriginal':composite.get('warmupOriginalSeconds',0)>0}
                            (folder/'cue.json').write_text(json.dumps(render),encoding='utf-8')
                            cmd=['node',str(root/'tools/render-composite-mix.mjs'),'--rate='+str(rate),
                                '--cue='+str(folder/'cue.json'),'--outgoing='+str(folder/'outgoing.f32'),
                                '--incoming='+str(folder/'incoming.f32'),'--output='+str(folder/'mix.f32')]
                            subprocess.run(cmd+['--raw-output='+str(folder/'raw.f32')],capture_output=True,check=True)
                            raw=np.frombuffer((folder/'raw.f32').read_bytes(),dtype='<f4').reshape(-1,2)
                            bounds=np.max(np.abs(resample_poly(raw,4,1,axis=0)).reshape(len(raw),4,2),axis=(1,2))*1.001
                            (folder/'bounds.f32').write_bytes(bounds.astype('<f4').tobytes())
                            flac=folder/'mix.flac'
                            extra=['--true-peak-bounds='+str(folder/'bounds.f32')] if composite.get('gainProof',{}).get('truePeakLookahead') else []
                            # Older manifests omitted the render ceiling. Recover
                            # ONLY the two documented production settings; an
                            # exact encoded SHA is mandatory before any finding
                            # can be attached to a deployed asset.
                            ceilings=[.96,.95]
                            for ceiling in ceilings:
                                render['renderPeakCeiling']=ceiling
                                (folder/'cue.json').write_text(json.dumps(render),encoding='utf-8')
                                result=subprocess.run(cmd+extra,capture_output=True,text=True,check=True)
                                proof=json.loads(result.stdout.splitlines()[-1])
                                subprocess.run(['ffmpeg','-nostdin','-y','-v','error','-f','f32le','-ar',str(rate),'-ac','2',
                                    '-i',str(folder/'mix.f32'),'-c:a','flac','-sample_fmt','s32','-compression_level','8',str(flac)],check=True)
                                actual=hashlib.sha256(flac.read_bytes()).hexdigest()
                                if actual==asset_sha:break
                                decoded=audit.decode(flac,0,20)
                                oversampled=resample_poly(decoded,4,1,axis=0)
                                lo=round(pre*rate*4);hi=round((pre+proof['nativeHandoffAt'])*rate*4)
                                peak=float(np.max(np.abs(oversampled[lo:hi])))
                                # Reproduce the builder's original bounded
                                # oversampled-peak adjustment, not a fitted
                                # time shift, signal change or loose match.
                                adjusted=ceiling*.96/peak*.9999 if peak>.9601 else None
                                if adjusted and len(ceilings)<6:ceilings.append(adjusted)
                            exposure={**proof['introductionExposure'],'sourceSha':source['sha'],
                                'targetSha':sha,'assetSha256':asset_sha}
                            rows.append({'profile':scope['name'],'from':track['key'],'to':by_sha[sha],
                                'assetSha256':asset_sha,'reproducedSha256':actual,'identical':actual==asset_sha,
                                'implementationSha256':implementation_hash,'exposure':exposure})
                    except Exception as error:
                        rows.append({'profile':scope['name'],'from':track['key'],'to':by_sha[sha],
                            'assetSha256':asset_sha,'error':str(error)})
                    output.write_text(json.dumps({'results':rows},indent=2)+'\n',encoding='utf-8')
                    print(json.dumps({k:v for k,v in rows[-1].items() if k!='exposure'}),flush=True)
    # Also persist reused receipts at the end: the final scope may contain
    # only cached exact matches and would otherwise be absent on resume.
    output.write_text(json.dumps({'results':rows},indent=2)+'\n',encoding='utf-8')

if __name__=='__main__':main()
