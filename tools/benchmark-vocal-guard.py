#!/usr/bin/env python3
"""Evaluate separated-vocal quiet decisions against manual word intervals.

External English references measure false-clear decisions; absence of
annotated words is not a human label for all non-lexical singing.
"""
import argparse,importlib.util,json,pathlib,subprocess
import numpy as np
spec=importlib.util.spec_from_file_location('features',pathlib.Path(__file__).with_name('dj-structure-features.py'))
features=importlib.util.module_from_spec(spec);spec.loader.exec_module(features)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ('references','audio','models','output'):parser.add_argument('--'+name,required=True)
    parser.add_argument('--quiet-lead',type=float,default=1.2)
    args=parser.parse_args();models=pathlib.Path(args.models).resolve()
    import os
    os.chdir(models)
    for file,expected in features.MODEL_HASHES.items():
        import hashlib
        if hashlib.sha256((models/file).read_bytes()).hexdigest()!=expected:raise ValueError('Unpinned model')
    if features.tf.train.latest_checkpoint(str(models/'pretrained_models/2stems')) is None:raise ValueError('No pretrained checkpoint')
    separator=features.Separator('spleeter:2stems',multiprocess=False)
    records=json.loads(pathlib.Path(args.references).read_text());results=[]
    for row in records:
        raw=subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(pathlib.Path(args.audio)/(row['name']+'.mp3')),
            '-ar','44100','-ac','2','-f','f32le','pipe:1'],capture_output=True,check=True).stdout
        stereo=np.frombuffer(raw,dtype='<f4').reshape(-1,2).copy()
        cache=pathlib.Path(args.output).parent/(row['name']+'.pinned-spleeter-envelope.npz')
        if cache.exists():
            cached=np.load(cache);voice,mix=cached['voice'],cached['mix']
        else:
            voice,mix=features.vocal_envelope(separator,stereo);np.savez_compressed(cache,voice=voice,mix=mix)
        words=row['words'];decisions=[];false_clear=0;false_fade=0;annotated=0;clear=0
        for end in np.arange(2.1,len(stereo)/44100-.4,.1):
            start=end-args.quiet_lead;stop=end
            overlaps=any(w['start']<stop and w['end']>start for w in words)
            guard=features.core.vocal_guard(voice,mix,start,stop)
            if not guard:continue
            annotated+=overlaps;clear+=guard['clear'];false_clear+=guard['clear'] and overlaps
            false_fade+=guard['clear'] and any(w['start']<end and w['end']>end-.4 for w in words)
            if guard['clear']:decisions.append({'start':float(start),'end':float(stop),'overlapsManualWord':overlaps})
        result={'record':row['name'],'seconds':len(stereo)/44100,'windowsWithManualVocal':annotated,
            'quietLeadSeconds':args.quiet_lead,'fadeSeconds':.4,
            'quietDecisions':clear,'falseClear':false_clear,'falseClearDuringActualFade':false_fade,'falseClearRate':false_clear/annotated if annotated else None,
            'quietWindows':decisions}
        results.append(result);pathlib.Path(args.output).write_text(json.dumps({'results':results},indent=2)+'\n')
        print(json.dumps({k:v for k,v in result.items() if k!='quietWindows'}),flush=True)

if __name__=='__main__':main()
