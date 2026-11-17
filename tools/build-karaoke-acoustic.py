#!/usr/bin/env python3
"""Offline-only vocal/CTC analysis. Use separate Python environments per phase.

Manifest: records[{id,file,language:'en',rows:[{t,text}],windows:[seconds]}].
Only phrase anchors and written text are consumed; never reference word times.
Both model checkpoints must already exist and match the pinned hashes.
"""
import argparse
import hashlib
import json
import os
import pathlib
import subprocess

for key in ['OMP_NUM_THREADS', 'OPENBLAS_NUM_THREADS', 'TF_NUM_INTRAOP_THREADS']:
    os.environ[key] = '2'
os.environ['TF_NUM_INTEROP_THREADS'] = '1'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
CTC_SHA = '488fd4f16de84438ffc945334278c1b9fb9b7159a806c1080b16111a958c945d'
STEMS = {'model.data-00000-of-00001': '7747f9fd2c782306dbec1504360fbb645a097a48446f23486c3ff9c89bc11788',
         'model.index': '55661a09f79c86071fc7077b44b4cf1f01b6d82bbbb83ed94cb68a2f9944e378',
         'model.meta': '6e1f6d86a22bb452a58cb20e3de87b416f8a79e626ca223e20f763ab2d21ec95'}
def sha(content):
    return hashlib.sha256(content).hexdigest()
def read(file):
    return json.loads(file.read_text(encoding='utf-8-sig'))
def write(file, value):
    file.write_bytes((json.dumps(value, ensure_ascii=False, indent=2)+'\n').encode('utf8'))
def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=pathlib.Path, required=True)
    parser.add_argument('--models', type=pathlib.Path, required=True)
    parser.add_argument('--work', type=pathlib.Path, required=True)
    parser.add_argument('--phase', choices=('separate', 'align'), required=True)
    args = parser.parse_args()
    manifest = read(args.manifest)
    models, work = args.models.resolve(), args.work.resolve()
    work.mkdir(parents=True, exist_ok=True)
    import numpy as np
    separator = model = labels = None
    if args.phase == 'separate':
        import tensorflow as tf
        import soxr
        from spleeter.separator import Separator
        checkpoint = models/'pretrained_models/2stems'
        for name, digest in STEMS.items():
            if sha((checkpoint/name).read_bytes()) != digest:
                raise ValueError('Spleeter checkpoint hash mismatch: '+name)
        if not tf.train.latest_checkpoint(str(checkpoint)):
            raise ValueError('Missing trained Spleeter checkpoint manifest')
        tf.get_logger().setLevel('ERROR')
        # All input files become absolute before Spleeter's model cwd.
        for record in manifest['records']:
            record['file'] = str(pathlib.Path(record['file']).resolve())
        os.chdir(models)
        separator = Separator('spleeter:2stems', multiprocess=False)
    else:
        import torch
        import torchaudio
        import importlib.util
        spec = importlib.util.spec_from_file_location('boundaries', pathlib.Path(__file__).with_name('karaoke-ctc-boundaries.py'))
        core = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(core)
        observed_words = core.observed_words
        checkpoint = models/'torch/hub/checkpoints/wav2vec2_fairseq_base_ls960_asr_ls960.pth'
        if sha(checkpoint.read_bytes()) != CTC_SHA:
            raise ValueError('CTC checkpoint hash mismatch')
        torch.set_num_threads(2)
        torch.set_num_interop_threads(1)
        bundle = torchaudio.pipelines.WAV2VEC2_ASR_BASE_960H
        model = bundle.get_model(dl_kwargs={'model_dir': str(checkpoint.parent),
            'file_name': checkpoint.name, 'progress': False}).eval()
        labels = bundle.get_labels()
    results = []
    for record in manifest['records']:
        if record['language'] != 'en' or len(record['windows']) > 30:
            raise ValueError('Unsupported language or unbounded analysis request')
        source = pathlib.Path(record['file']).resolve()
        audio_sha = sha(source.read_bytes())
        if record.get('audioSha256', audio_sha) != audio_sha:
            raise ValueError('Recording changed')
        words, rows = [], record['rows']
        for start in record['windows']:
            if not isinstance(start, (int, float)) or not 0 <= start < 3600:
                raise ValueError('Invalid source window')
            identity = {'audioSha256': audio_sha, 'start': start, 'seconds': 28,
                'separation': STEMS, 'method': 'spleeter-offset-context2-soxr16k-v1'}
            key = sha(json.dumps(identity, sort_keys=True).encode())
            vocal, metadata = work/(key+'.f32'), work/(key+'.json')
            if args.phase == 'separate':
                if not vocal.exists() or not metadata.exists() or read(metadata).get('vocalSha256') != sha(vocal.read_bytes()):
                    lo = max(0, start-2)
                    raw = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(source),
                        '-ss', str(lo), '-t', '32', '-ar', '44100', '-ac', '2', '-f', 'f32le', 'pipe:1'],
                        capture_output=True, check=True).stdout
                    stereo = np.frombuffer(raw, dtype='<f4').reshape(-1, 2).copy()
                    separated = separator.separate(stereo)['vocals']
                    offset = round((start-lo)*44100)
                    wave = soxr.resample(separated[offset:offset+28*44100].mean(axis=1), 44100, 16000).astype('<f4')
                    vocal.write_bytes(wave.tobytes())
                    write(metadata, {**identity, 'vocalSha256': sha(vocal.read_bytes())})
                continue
            meta = read(metadata)
            if any(meta.get(k) != v for k, v in identity.items()) or sha(vocal.read_bytes()) != meta['vocalSha256']:
                raise ValueError('Vocal PCM provenance mismatch')
            cache = work/(key+'-'+CTC_SHA[:12]+'.npz')
            if cache.exists():
                stored = np.load(cache)
                if str(stored['vocalSha256']) != meta['vocalSha256']:
                    raise ValueError('Emission cache provenance mismatch')
                emission = stored['emission']
            else:
                wave = torch.from_numpy(np.frombuffer(vocal.read_bytes(), dtype='<f4').copy())[None]
                with torch.inference_mode():
                    logits, _ = model(wave)
                    emission = logits[0].log_softmax(-1).numpy()
                np.savez(cache, emission=emission, vocalSha256=meta['vocalSha256'])
            target = [{'text': token, 'lineIndex': i, 'wordIndex': j}
                for i, row in enumerate(rows[:-1]) if row['t'] >= start+.15 and rows[i+1]['t'] < start+27.96
                for j, token in enumerate(row['text'].split())]
            words.extend(observed_words(emission, target, labels, start))
        results.append({'id': record['id'], 'sourceAudioSha256': audio_sha, 'words': words})
        print(json.dumps({'id': record['id'], 'phase': args.phase, 'windows': len(record['windows']), 'observations': len(words)}), flush=True)
    if args.phase == 'align':
        write(work/'observations.json', {'method': 'ctc-observed-word-separator-v1',
            'modelSha256': CTC_SHA, 'separationWeights': STEMS, 'records': results})
if __name__ == '__main__':
    main()
