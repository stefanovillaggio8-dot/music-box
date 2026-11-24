import importlib.util,pathlib,unittest
import numpy as np
p=pathlib.Path(__file__).with_name('dj-component-support.py');s=importlib.util.spec_from_file_location('support',p);m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
class Evidence(unittest.TestCase):
    def test_original_transient_support_and_cancelled_model_attack(self):
        rate=11025;t=np.arange(rate*2)/rate
        tone=np.sin(2*np.pi*440*t)*.05
        kick=np.zeros_like(t);n=round(.16*rate);at=rate
        kick[at:at+n]=.4*np.sin(2*np.pi*100*np.arange(n)/rate)*np.exp(-np.arange(n)/(rate*.025))
        original=np.stack([tone+kick,tone+kick],axis=1);component=np.stack([kick,kick],axis=1)
        self.assertTrue(m.support(original,component,rate,[1])[0]['originalSupported'])
        # Perfect reconstruction can hide a completely invented stem attack.
        flat=np.stack([tone,tone],axis=1)
        self.assertLess(m.reconstruction(flat,[component,flat-component])['relativeRmsError'],1e-12)
        self.assertFalse(m.support(flat,component,rate,[1])[0]['originalSupported'])
    def test_silent_or_moved_original_is_not_support(self):
        rate=11025;x=np.zeros((rate*2,2));x[rate:rate+10]=.5
        self.assertFalse(m.support(np.zeros_like(x),x,rate,[1])[0]['originalSupported'])
        with self.assertRaises(ValueError):m.support(x,x[:-1],rate,[1])
if __name__=='__main__':unittest.main()
