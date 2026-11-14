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
        ending=core.candidate_windows(b,[],[],voice,mix,128)
        self.assertTrue(ending)
        self.assertTrue(all(w['windowMethod']=='concluding-observed-bars' and w['end']>=102.4 and w['role']=='exit' for w in ending))
        self.assertTrue(all(w['phraseVerified'] is False and w['semanticLabel'] is None for w in ending))
        boundary=[dict(barIndex=56,t=112.,novelty=.5)]
        windows=core.candidate_windows(b,boundary,[],voice,mix,128)
        self.assertTrue(any(w['role']=='exit' and w['end']<=114 for w in windows))
        voice[1100:1160]=.1
        self.assertFalse(any(w['role']=='exit' and w['end']<=114 for w in core.candidate_windows(b,boundary,[],voice,mix,128)))

    def test_gaps_or_meter_change_cannot_form_phrase_window(self):
        b=bars();b[30]['beatsPerBar']=3
        windows=core.candidate_windows(b,[dict(barIndex=32,t=64.,novelty=.5)],[],np.zeros(1300),np.ones(1300)*.1,128)
        self.assertFalse(any(w['role']=='exit' and w['start']<=60 for w in windows))

    def test_unplayed_next_vocal_cannot_veto_completed_previous_section(self):
        b=bars();voice=np.zeros(1300);mix=np.ones(1300)*.1
        voice[641:680]=.1 # Next original section starts AFTER the cut.
        boundaries=[dict(barIndex=32,t=64.,novelty=.5)]
        windows=core.candidate_windows(b,boundaries,[],voice,mix,128)
        self.assertTrue(any(w['role']=='exit' and w['end']==64 for w in windows))
        voice[638:640]=.1 # A syllable still active before the cut is protected.
        windows=core.candidate_windows(b,boundaries,[],voice,mix,128)
        self.assertFalse(any(w['role']=='exit' and w['end']==64 for w in windows))

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

    def test_sparse_candidate_bars_keep_neural_gates_and_need_observed_downbeats(self):
        beats=np.arange(.5,40,.5);bp=np.ones(2100)*.99;dp=np.ones(2100)*.01;onset=np.zeros(2100)
        for i,t in enumerate(beats):
            if i%4==0:dp[round(t/.02)]=.99
            if i%2==0:onset[round(t/.02)]=1
        self.assertEqual(core.measured_bars(beats,beats[::4],bp,dp,onset),[])
        candidates=core.measured_bars(beats,beats[::4],bp,dp,onset,sparse_candidates=True)
        self.assertGreater(len(candidates),10)
        self.assertTrue(all(len(b['beats'])>=2 and b['sparseCandidateOnly'] for b in candidates))
        self.assertEqual(core.measured_bars(beats,beats[::4],bp,np.ones(2100)*.25,onset,sparse_candidates=True),[])
        self.assertEqual(core.measured_bars(beats,beats[::4],bp,dp,np.zeros(2100),sparse_candidates=True),[])

    def test_a_concluding_bar_group_cannot_skip_a_later_vocal(self):
        voice=np.zeros(1300);voice[1190:1270]=.02
        windows=core.candidate_windows(bars(),[],[],voice,np.ones(1300)*.1,128)
        self.assertFalse(any(w['role']=='exit' for w in windows))

if __name__=='__main__':unittest.main()
