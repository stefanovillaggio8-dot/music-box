"""Frozen Ste-only native-speed render. Does not write playback certificates."""
import importlib.util
import json
import pathlib
import subprocess
import sys
import hashlib
import numpy as np
from scipy.signal import resample_poly

ROOT = pathlib.Path(__file__).resolve().parent.parent


def render(protocol_file, output):
    protocol_file, output = pathlib.Path(protocol_file), pathlib.Path(output)
    if output.exists():
        raise ValueError('Use a new evaluation directory; preserve earlier evidence')
    protocol = json.loads(protocol_file.read_bytes())
    cases = protocol_file.parent / 'cases.json'
    # The authoritative app inventory is checked BEFORE any audio is decoded.
    result = subprocess.run(['node', 'tools/ste-research-scope.cjs',
                             '--cases=' + str(cases.resolve()),
                             '--output=' + str(output.resolve() / 'scope.json')],
                            cwd=ROOT, capture_output=True, check=True)
    scope = json.loads((output / 'scope.json').read_bytes())
    selected = [p for p in protocol['native'] if p['label'] == 'clean-38-4']
    if len(selected) != 1:
        raise ValueError('One predeclared evaluation window required')
    p = selected[0]
    if not any(c['from'] == p['from'] and c['to'] == p['to'] and
               c['sourceSha'] == p['sourceSha'] and c['targetSha'] == p['targetSha']
               for c in scope['cases']):
        raise ValueError('Window outside selected current Ste cases')
    if p['entry'] != 0 or p['tempo'] != 1 or not .5 <= p['fade'] <= 3:
        raise ValueError('Native-speed bounded clean evaluation only')
    spec = importlib.util.spec_from_file_location('clock', ROOT / 'tools/mp3-gapless-clock.py')
    clock = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(clock)
    originals = {role: ROOT.parent / 'original-mp3' / (p[role + 'Sha'] + '.mp3')
                 for role in ('source', 'target')}
    clocks = {role: clock.mp3_clock(file, p[role + 'Sha']) for role, file in originals.items()}
    rate, pre, post = 48000, .3, 1.8

    def decode(file, start, seconds):
        raw = subprocess.check_output(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(file),
                                       '-ss', str(start), '-t', str(seconds), '-ac', '2',
                                       '-ar', str(rate), '-f', 'f32le', 'pipe:1'])
        return np.frombuffer(raw, dtype='<f4').reshape(-1, 2)

    source = decode(originals['source'], p['begin'] - pre, p['fade'] + pre + .02)
    target = decode(originals['target'], 0, p['fade'] + post + .01)
    offset, frames = round(pre * rate), len(source) + round(post * rate)
    outgoing, incoming = np.zeros((frames, 2), np.float32), np.zeros((frames, 2), np.float32)
    outgoing[:len(source)] = source
    n = min(len(target), frames - offset)
    incoming[offset:offset + n] = target[:n]
    mixed = outgoing + incoming
    for name, values in [('mix', mixed), ('outgoing', outgoing), ('incoming', incoming),
                         ('outgoing-original', source), ('incoming-original', target)]:
        (output / (name + '.f32')).write_bytes(values.astype('<f4').tobytes())
    file = output / 'evaluation.flac'
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-f', 'f32le', '-ar', str(rate),
                    '-ac', '2', '-i', str(output / 'mix.f32'), '-c:a', 'flac',
                    '-sample_fmt', 's32', str(file)], check=True)
    sha = hashlib.sha256(file.read_bytes()).hexdigest()
    file.rename(output / (sha + '.flac'))
    tail = source[offset:]
    rms = max(float(np.sqrt(np.mean(np.asarray(tail[i:i+960], np.float64)**2)))
              for i in range(0, len(tail), 960))
    handoff = (len(source) - offset) / rate
    row = dict(evaluationOnly=True, path=sha + '.flac', sha256=sha,
               **{k: p[k] for k in ('from', 'to', 'sourceSha', 'targetSha', 'begin', 'end', 'fade', 'entry', 'tempo')},
               sampleRate=rate, preRoll=pre, releaseSeconds=.9, seconds=frames/rate,
               nativeHandoffAt=handoff, nativeRevealAt=handoff+1.05, handoffPosition=p['fade'],
               peak=float(np.max(np.abs(mixed))), overlapPeak=float(np.max(np.abs(mixed[offset:len(source)]))),
               oversampledPeak=float(np.max(np.abs(resample_poly(mixed, 4, 1, axis=0)))),
               sourceTailRmsMax=rms, sourceTailPeak=float(np.max(np.abs(tail))),
               sourceReadThrough=p['begin']-pre+len(source)/rate, nativeClocks=clocks)
    (output / 'candidate.json').write_text(json.dumps(row, indent=2) + '\n', encoding='utf8')
    print(json.dumps(row))


if __name__ == '__main__':
    render(*sys.argv[1:])
