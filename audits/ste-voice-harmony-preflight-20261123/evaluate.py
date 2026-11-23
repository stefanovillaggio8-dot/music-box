"""Frozen offline false-negative screen. NEVER installs/certifies a plan.

Compares the SAME two-bar model hypothesis at declared tempo and native
speed. Renderer transport flags are internal prerequisites, NOT evidence
of musical certification. No fitted lag, gain/beat threshold search or
repeat on failure. Voice/harmony hypotheses remain unverified.
"""
import hashlib, importlib.util, json, pathlib, subprocess, sys
import numpy as np
from scipy.signal import resample_poly

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT = pathlib.Path(sys.argv[1]).resolve()
LOOKAHEAD = len(sys.argv) == 3 and sys.argv[2] == 'lookahead'
if len(sys.argv) > 2 and not LOOKAHEAD:
    raise ValueError('Only the fixed lookahead comparison is supported')
if OUT.exists():
    raise ValueError('New evidence directory required')
OUT.mkdir()
preflight = json.loads((HERE / 'results.json').read_text(encoding='utf-8'))
row = preflight['rows'][0]
assert row['hypothesizedBars'] == 2
subprocess.run(['node', '-e', "const s=require('./tools/ste-research-scope.cjs');s.validateSteCases([" + json.dumps(preflight['pair']) + "],s.currentSteScope(),require('./dj-deep-analysis.json'))"], cwd=ROOT, check=True, capture_output=True)
paths = [ROOT / '../original-mp3' / (sha + '.mp3') for sha in preflight['originalSha']]
for path, sha in zip(paths, preflight['originalSha']):
    data = path.read_bytes()
    assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == sha
whole = []
for shard, key in [('15', preflight['pair']['from']), ('2', preflight['pair']['to'])]:
    whole.append(json.loads((ROOT / ('../whole-structure-ci/whole-structure-' + shard + '/structure-' + shard + '.json')).read_text(encoding='utf-8'))['entries'][key])
spec = importlib.util.spec_from_file_location('rhythm', ROOT / 'tools/dj-rendered-rhythm.py')
rhythm = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rhythm)
protocol = {'pair': preflight['pair'], 'originalSha': preflight['originalSha'], 'begin': row['begin'], 'fade': row['fade'], 'entry': 0, 'rates': [44100, 48000], 'modes': {'declared-tempo': row['tempo'], 'native': 1}, 'published': False, 'certificationAllowed': False, 'gatesUnchanged': True, 'noHumanListening': True, 'fixedEnvelopes': 'existing first-attack-033-v1; intact source EOF; no fitted lag', 'limitations': 'Post-model exploratory screen, not blinded validation; model beats/downbeats/voice not labelled ground truth; no native decoder handoff or physical iPhone proof.'}
pre_roll = .9 if LOOKAHEAD else .3
protocol['preRoll'] = pre_roll
protocol['renderGainMode'] = 'lookahead' if LOOKAHEAD else 'constant'
if LOOKAHEAD:
    protocol['rates'] = [48000]
    protocol['reasonForSeparateComparison'] = 'Constant-gain native boundary rejected overshooting ORIGINAL outgoing master before overlap. Test existing bounded shared lookahead with 900ms preroll and independent 4x true-peak bounds, unchanged safety ceiling; no new musical hypothesis or gate bypass.'
(OUT / 'protocol.json').write_text(json.dumps(protocol, indent=2) + '\n', encoding='utf-8')
receipts = []
for rate in protocol['rates']:
    def decode(path, start, seconds):
        data = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', str(path), '-ss', str(start), '-t', str(seconds), '-ar', str(rate), '-ac', '2', '-f', 'f32le', 'pipe:1'], check=True, capture_output=True, timeout=60).stdout
        return np.frombuffer(data, dtype='<f4').reshape(-1, 2)
    old = decode(paths[0], row['begin'] - pre_roll, row['fade'] + 2 + pre_roll)
    incoming = decode(paths[1], 0, row['fade'] * 1.05 + 4)
    for mode, tempo in protocol['modes'].items():
        folder = OUT / (str(rate) + '-' + mode)
        folder.mkdir()
        for name, data in [('outgoing', old), ('incoming', incoming)]:
            (folder / (name + '.f32')).write_bytes(data.tobytes())
        source_bars = [t - row['begin'] for t in whole[0]['downbeats'] if row['begin'] <= t < 168.56 - .1]
        target_bars = [t / tempo for t in whole[1]['downbeats'] if .15 <= t < 5.5 - .1]
        cue = {'evaluationOnly': True, 'begin': row['begin'], 'end': row['end'], 'fade': row['fade'], 'entry': 0, 'tempo': tempo, 'preservedFileTail': True, 'nativeTailFullBeat': True, 'preserveTail': True, 'vocalFadeSeconds': 0, 'preservedEntrance': 'first-attack-033-v1', 'measuredFullBeat': True, 'sourceSha': preflight['originalSha'][0], 'targetSha': preflight['originalSha'][1], 'structuralEvidence': {'bars': 2, 'pulseCheck': {'source': [t - row['begin'] for t in whole[0]['beats'] if row['begin'] - .05 <= t <= row['end'] - .12], 'target': [t for t in whole[1]['beats'] if 0 <= t <= row['fade'] * tempo - .12], 'sourceBars': source_bars, 'targetBars': target_bars}}}
        cue.update(renderPreRoll=pre_roll, renderGainMode=protocol['renderGainMode'])
        (folder / 'cue.json').write_text(json.dumps(cue), encoding='utf-8')
        command = ['node', str(ROOT / 'tools/render-composite-mix.mjs'), '--rate=' + str(rate), '--cue=' + str(folder / 'cue.json')]
        command += ['--' + key + '=' + str(folder / filename) for key, filename in [('outgoing', 'outgoing.f32'), ('incoming', 'incoming.f32'), ('output', 'mix.f32'), ('outgoing-component', 'old.f32'), ('incoming-component', 'new.f32')]]
        run = subprocess.run(command + (['--raw-output=' + str(folder / 'raw.f32')] if LOOKAHEAD else []), cwd=ROOT, capture_output=True, text=True, timeout=90)
        if LOOKAHEAD and (folder / 'raw.f32').exists():
            raw = np.frombuffer((folder / 'raw.f32').read_bytes(), dtype='<f4').reshape(-1, 2)
            bounds = np.max(np.abs(resample_poly(raw, 4, 1, axis=0)).reshape(len(raw), 4, 2), axis=(1, 2)) * 1.001
            (folder / 'true-peak.f32').write_bytes(bounds.astype('<f4').tobytes())
            run = subprocess.run(command + ['--true-peak-bounds=' + str(folder / 'true-peak.f32')], cwd=ROOT, capture_output=True, text=True, timeout=90)
        receipt = {'sampleRate': rate, 'mode': mode, 'tempo': tempo, 'certified': False, 'installed': False, 'rendererPassed': run.returncode == 0}
        if run.returncode:
            receipt['rejection'] = run.stderr[-1600:]
        else:
            proof = json.loads(run.stdout)
            receipt['render'] = proof
            components = [np.frombuffer((folder / name).read_bytes(), dtype='<f4').reshape(-1, 2) for name in ['old.f32', 'new.f32']]
            receipt['renderedRhythm'] = rhythm.verify(*components, rate, cue, proof['preRoll'])
            mix = np.frombuffer((folder / 'mix.f32').read_bytes(), dtype='<f4').reshape(-1, 2)
            peak4 = resample_poly(mix, 4, 1, axis=0)
            receipt['truePeak4x'] = float(np.max(np.abs(peak4)))
            lo, hi = round(pre_roll * rate * 4), round((pre_roll + row['fade']) * rate * 4)
            receipt['overlapTruePeak4x'] = float(np.max(np.abs(peak4[lo:hi])))
            subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-f', 'f32le', '-ar', str(rate), '-ac', '2', '-i', str(folder / 'mix.f32'), '-c:a', 'flac', str(folder / 'EVALUATION-NOT-CERTIFIED.flac')], check=True, capture_output=True, timeout=60)
        receipts.append(receipt)
        (OUT / 'results.json').write_text(json.dumps({'protocol': protocol, 'newCertifiedPairs': 0, 'receipts': receipts}, indent=2) + '\n', encoding='utf-8')
        print(json.dumps({k: receipt.get(k) for k in ['sampleRate', 'mode', 'rendererPassed', 'rejection', 'truePeak4x']}), flush=True)
