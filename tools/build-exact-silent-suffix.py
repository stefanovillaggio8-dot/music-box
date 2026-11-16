#!/usr/bin/env python3
"""Prove terminal numeric zeros on original stereo PCM; never trim a file."""
import argparse,hashlib,importlib.util,json,pathlib,subprocess
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('sources',ROOT/'tools/audit-full-beat-audio.py')
sources=importlib.util.module_from_spec(spec);spec.loader.exec_module(sources)

def scan(file,rate):
    command=['ffmpeg','-nostdin','-v','error','-threads','2','-i',str(file),'-ac','2','-ar',str(rate),'-f','f32le','pipe:1']
    process=subprocess.Popen(command,stdout=subprocess.PIPE);digest=hashlib.sha256();frames=0;through=0
    while True:
        block=process.stdout.read(1024*1024)
        if not block:break
        if len(block)%8:raise ValueError('Incomplete stereo frame')
        digest.update(block);values=np.frombuffer(block,dtype='<f4').reshape(-1,2)
        if not np.isfinite(values).all():raise ValueError('Nonfinite original PCM')
        positions=np.flatnonzero(np.any(values!=0,axis=1))
        if len(positions):through=frames+int(positions[-1])+1
        frames+=len(values)
    if process.wait():raise ValueError('Original decode failed')
    return {'frames':frames,'decodedDuration':frames/rate,'nonzeroThroughFrame':through,
        'zeroFrom':through/rate,'maximumSuffixPeak':0,'pcmSha256':digest.hexdigest()}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--index',default=str(ROOT/'dj-deep-analysis.json'));parser.add_argument('--keys',required=True)
    parser.add_argument('--cache',required=True);parser.add_argument('--output',required=True);args=parser.parse_args()
    index=json.loads(pathlib.Path(args.index).read_text(encoding='utf8'))['entries']
    keys=json.loads(pathlib.Path(args.keys).read_text(encoding='utf-8-sig'));cache=pathlib.Path(args.cache);cache.mkdir(exist_ok=True,parents=True)
    report={'version':1,'method':'original-stereo-exact-zero-suffix-v1','threshold':0,'entries':{},'rejected':[]}
    for key in keys:
        entry=index[key];file=sources.source(key,entry['sha'],cache)
        rates={str(rate):scan(file,rate) for rate in [44100,48000]}
        # This is an exact sample boundary, not an energy threshold or a
        # model boundary. The renderer still retains every original sample.
        zero_from=max(r['zeroFrom'] for r in rates.values())
        duration=min(r['decodedDuration'] for r in rates.values())
        if duration-zero_from<.25 or duration-zero_from>3 or abs(duration-entry['duration'])>.1:
            report['rejected'].append({'key':key,'reason':'no-bounded-exact-zero-suffix','rates':rates});continue
        report['entries'][key]={'method':report['method'],'sourceSha':entry['sha'],
            'sourceSha256':hashlib.sha256(file.read_bytes()).hexdigest(),'zeroFrom':float(zero_from),
            'through':entry['duration'],'threshold':0,'rates':rates}
        print(key,'verified exact-zero suffix',round(duration-zero_from,6),flush=True)
    pathlib.Path(args.output).write_text(json.dumps(report,indent=2)+'\n',encoding='utf8')
if __name__=='__main__':main()
