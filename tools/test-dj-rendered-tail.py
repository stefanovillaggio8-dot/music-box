import importlib.util,pathlib,unittest
import numpy as np
spec=importlib.util.spec_from_file_location('rhythm',pathlib.Path(__file__).with_name('dj-rendered-rhythm.py'))
rhythm=importlib.util.module_from_spec(spec);spec.loader.exec_module(rhythm)

class TailEvidenceTests(unittest.TestCase):
    def fixture(self):
        sr=16000;t=np.arange(sr*10)/sr;y=.06*np.sin(2*np.pi*440*t)
        for at in np.arange(.5,6,.5):
            u=t-at;y+=.4*np.exp(-np.maximum(u,0)*70)*np.sin(2*np.pi*90*u)*(u>=0)
        y*=.05+.95*.5*(1+np.cos(np.pi*np.clip((t-6.0)/.2,0,1)))
        cue={'fade':9.4,'structuralEvidence':{'rhythmicWindow':{'seconds':6.2}}}
        return np.column_stack([y,y]),sr,cue
    def test_quiet_decay_can_remain_without_being_cut(self):
        y,sr,cue=self.fixture();p=rhythm.tail_evidence(y,sr,cue,0)
        self.assertTrue(p['accepted']);self.assertFalse(p['sourceGainApplied']);self.assertTrue(p['searchedEntireTail'])
    def test_later_percussion_restart_is_not_a_decay(self):
        y,sr,cue=self.fixture();rng=np.random.default_rng(29)
        y[round(8.1*sr):round(8.14*sr)]+=rng.normal(0,.2,(round(.04*sr),2))
        self.assertFalse(rhythm.tail_evidence(y,sr,cue,0)['accepted'])
    def test_sustained_loud_tail_cannot_hide_behind_absent_beat_predictions(self):
        y,sr,cue=self.fixture();t=np.arange(len(y))/sr;y[t>=6.2]=(.2*np.sin(2*np.pi*440*t[t>=6.2]))[:,None]
        self.assertFalse(rhythm.tail_evidence(y,sr,cue,0)['accepted'])

if __name__=='__main__':unittest.main()
