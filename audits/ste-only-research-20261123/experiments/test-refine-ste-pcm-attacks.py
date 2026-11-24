import importlib.util,pathlib,unittest
import numpy as np
spec=importlib.util.spec_from_file_location('refine',pathlib.Path(__file__).with_name('refine-ste-pcm-attacks.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Refinement(unittest.TestCase):
 def test_observed_stereo_attacks_improve_timestamp_without_adding_beats(self):
  sr=m.SR;rng=np.random.default_rng(7);x=np.zeros((sr*4,2));truth=np.array([.5,1,1.5,2,2.5,3])
  pulse=rng.normal(size=round(sr*.02))*np.exp(-np.arange(round(sr*.02))/(sr*.004))
  for t in truth:
   at=round(t*sr);x[at:at+len(pulse),0]=pulse;x[at:at+len(pulse),1]=-pulse
  self.assertTrue(np.allclose(x.mean(axis=1),0),'The original mono path loses this control entirely')
  times,score=m.energy_novelty(x);old=truth+.02;new=m.refine(old.tolist(),times,score,0)
  self.assertEqual(len(new),len(old));self.assertLess(max(abs(np.array(new)-truth)),.02)
  self.assertTrue(np.all(np.diff(new)>0));self.assertLessEqual(max(abs(np.array(new)-old)),.040001)
 def test_no_attack_and_invalid_pcm_cannot_manufacture_beats(self):
  times,score=m.energy_novelty(np.zeros((m.SR*2,2)));old=[.2,.8,1.5]
  self.assertEqual(m.refine(old,times,score,0),old)
  with self.assertRaises(ValueError):m.energy_novelty(np.full((m.SR*2,2),np.nan))
 def test_scope_sha_and_case_budget_are_checked_before_audio_access(self):
  scope={'name':'Ste','tracks':[{'key':'a','sha':'s'},{'key':'b','sha':'t'}]}
  index={'a':{'sha':'s'},'b':{'sha':'t'}};features={k:{'sha':v['sha'],'pcmTransition':{'sha':v['sha'],'intro':{},'outro':{}}} for k,v in index.items()}
  self.assertEqual(len(m.validate_cases([{'from':'a','to':'b'}],scope,index,features)),2)
  for cases in [[{'from':'outside-current-Ste','to':'b'}],[{'from':'a','to':'b'}]*5]:
   with self.assertRaises(ValueError):m.validate_cases(cases,scope,index,features)
  features['b']['sha']='changed'
  with self.assertRaises(ValueError):m.validate_cases([{'from':'a','to':'b'}],scope,index,features)
if __name__=='__main__':unittest.main()
