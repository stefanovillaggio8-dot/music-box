#!/usr/bin/env python3
import importlib.util, pathlib, tempfile, unittest
import numpy as np
spec=importlib.util.spec_from_file_location('transition',pathlib.Path(__file__).with_name('dj-transition-features.py'))
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)

class Features(unittest.TestCase):
    def test_local_grids_contain_observed_attacks_and_no_fake_bar_labels(self):
        contour=np.zeros(1000)
        for at in range(25,975,25):contour[at]=1
        grids=module.observed_grids(contour,30,60)
        self.assertTrue(any(abs(g['bpm']-120)<3 for g in grids))
        for grid in grids:
            self.assertNotIn('downbeats',grid)
            for t in grid['beats']:self.assertGreaterEqual(contour[round((t-30)/.02)],.25)
        self.assertEqual(module.observed_grids(np.zeros(1000),0,120),[])

    def test_tonal_sustain_is_not_a_percussive_intro(self):
        t=np.arange(module.SR*6)/module.SR
        signal=(.16*np.sin(2*np.pi*220*t)+.12*np.sin(2*np.pi*330*t)).astype(np.float32)
        feature=module.section(signal,0,120)
        self.assertGreater(np.median([r['tonalRatio'] for r in feature['harmony']]),.65)
        self.assertTrue(all(len(r['notes'])==12 for r in feature['harmony']))

    def test_actual_drum_attacks_survive_without_inventing_tonal_proof(self):
        rng=np.random.default_rng(213)
        signal=np.zeros(module.SR*8,dtype=np.float32)
        for at in np.arange(.5,7.7,.5):
            begin=round(at*module.SR);length=round(.1*module.SR)
            signal[begin:begin+length]=rng.normal(size=length)*np.exp(-np.arange(length)/(module.SR*.018))*.35
        feature=module.section(signal,50,120)
        self.assertGreaterEqual(len(feature['beats']),8)
        for beat in feature['beats']:
            phase=(beat-50)% .5
            self.assertLess(min(phase,.5-phase),.085)
        self.assertLess(np.median([r['tonalRatio'] for r in feature['harmony']]),.12)

    def test_changed_cached_audio_cannot_receive_the_old_source_sha(self):
        with tempfile.TemporaryDirectory() as name:
            cache=pathlib.Path(name);sha='a'*40
            (cache/(sha+'.mp3')).write_bytes(b'changed audio')
            with self.assertRaisesRegex(ValueError,'Cached source SHA mismatch'):
                module.analyze('audio/songs/test.mp3',{'sha':sha,'duration':10,'bpm':120,'last':9},cache)

if __name__=='__main__':unittest.main()
