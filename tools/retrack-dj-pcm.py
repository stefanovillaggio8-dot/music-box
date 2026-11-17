#!/usr/bin/env python3
"""Retrack cached SHA-bound original PCM contours without claiming a new decode."""
import argparse, importlib.util, json, pathlib
spec=importlib.util.spec_from_file_location('pcm',pathlib.Path(__file__).with_name('dj-transition-features.py'))
pcm=importlib.util.module_from_spec(spec);spec.loader.exec_module(pcm)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--features',required=True)
    parser.add_argument('--index',default=str(pcm.ROOT/'dj-deep-analysis.json'))
    parser.add_argument('--output',required=True)
    args=parser.parse_args();index=json.loads(pathlib.Path(args.index).read_text())['entries']
    output=pathlib.Path(args.output);output.mkdir(parents=True,exist_ok=True)
    seen=set()
    for path in sorted(pathlib.Path(args.features).rglob('pcm-*.json')):
        data=json.loads(path.read_text())
        for key,value in data['entries'].items():
            if key in seen:raise ValueError('Duplicate source '+key)
            seen.add(key);feature=value['pcmTransition'];original=index[key]
            if value['sha']!=original['sha'] or feature['sha']!=original['sha']:
                raise ValueError('SHA mismatch '+key)
            if feature['version']!=2 or feature['method']!='original-pcm-hpss-onset-chroma-20ms-v2':
                raise ValueError('Expected original HPSS PCM v2 '+key)
            for name in ('intro','outro'):
                part=feature[name]
                part['grids']=pcm.observed_grids(part['onset'],part['start'],original['bpm'])
            feature.update(version=3,method='original-pcm-hpss-onset-chroma-20ms-v3-multigrid',
                           contourProvenance='retracked-cached-sha-bound-original-pcm-v2')
        data['version']=3
        (output/path.name).write_text(json.dumps(data,separators=(',',':'))+'\n')
        print(path.name,len(data['entries']),flush=True)
    expected=sum(v.get('status')=='ok' for v in index.values())
    if len(seen)!=expected:raise ValueError(f'Incomplete catalog {len(seen)}/{expected}')
if __name__=='__main__':main()
