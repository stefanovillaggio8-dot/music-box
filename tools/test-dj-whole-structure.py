import importlib.util,pathlib,unittest
import numpy as np
spec=importlib.util.spec_from_file_location('core',pathlib.Path(__file__).with_name('dj-structure-core.py'))
core=importlib.util.module_from_spec(spec);spec.loader.exec_module(core)

def bars():
    return [dict(start=i*2.,end=i*2.+2,beats=[i*2+j*.5 for j in range(4)],
        bpm=120,beatsPerBar=4,metricalPhaseConfidence=.99,beatProbabilityMin=.9,
        downbeatProbabilityMin=.9) for i in range(64)]

class EvidenceTests(unittest.TestCase):
    def test_no_voice_evidence_is_not_silence(self):
        self.assertIsNone(core.vocal_guard([],[],2,4))
        self.assertIsNone(core.vocal_guard([float('nan')]*100,[.1]*100,2,4))
        self.assertFalse(core.vocal_guard([.02]*100,[.1]*100,2,4)['clear'])

    def test_early_exit_requires_real_boundary_and_clear_vocal_tail(self):
        b=bars();voice=np.zeros(1300);mix=np.ones(1300)*.1
        self.assertEqual(core.candidate_windows(b,[],[],voice,mix,128),[])
        boundary=[dict(barIndex=32,t=64.,novelty=.5)]
        windows=core.candidate_windows(b,boundary,[],voice,mix,128)
        self.assertTrue(any(w['role']=='exit' and w['end']<=66 for w in windows))
        voice[600:680]=.1
        self.assertFalse(any(w['role']=='exit' for w in core.candidate_windows(b,boundary,[],voice,mix,128)))

    def test_gaps_or_meter_change_cannot_form_phrase_window(self):
        b=bars();b[30]['beatsPerBar']=3
        windows=core.candidate_windows(b,[dict(barIndex=32,t=64.,novelty=.5)],[],np.zeros(1300),np.ones(1300)*.1,128)
        self.assertFalse(any(w['role']=='exit' and w['start']<=60 for w in windows))

    def test_observed_attacks_required_and_metrical_phase_coherent(self):
        beats=np.arange(.5,40,.5);bp=np.ones(2100)*.99;dp=np.ones(2100)*.01;onset=np.zeros(2100)
        for i,t in enumerate(beats):
            if i%4==0:dp[round(t/.02)]=.99
            onset[round(t/.02)]=1
        measured=core.measured_bars(beats,beats[::4],bp,dp,onset)
        self.assertGreater(len(measured),10)
        self.assertTrue(all(b['beatsPerBar']==4 for b in measured))
        self.assertEqual(core.measured_bars(beats,beats[::4],bp,dp,np.zeros(2100)),[])

    def test_uniform_audio_does_not_invent_section_or_chorus(self):
        b=bars();t=np.arange(0,128,.1);x=np.ones((12,len(t)))
        self.assertEqual(core.summarize_structure(b,x,x,np.ones(len(t)),np.ones(len(t)),t),([],[]))

if __name__=='__main__':unittest.main()
