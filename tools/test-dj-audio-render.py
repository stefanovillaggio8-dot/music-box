#!/usr/bin/env python3
import importlib.util,pathlib,subprocess,tempfile,unittest,wave
import numpy as np
spec=importlib.util.spec_from_file_location('render',pathlib.Path(__file__).with_name('audit-full-beat-audio.py'))
render=importlib.util.module_from_spec(spec);spec.loader.exec_module(render)

class AccurateWindow(unittest.TestCase):
    def test_mp3_window_matches_the_full_recording_without_reservoir_padding(self):
        rate=render.SR;rng=np.random.default_rng(122)
        t=np.arange(rate*8)/rate
        signal=(.14*np.sin(2*np.pi*443*t)+.07*rng.normal(size=len(t))).astype(np.float32)
        stereo=np.stack([signal,signal*.7],axis=1)
        with tempfile.TemporaryDirectory() as directory:
            wav=pathlib.Path(directory)/'source.wav';mp3=wav.with_suffix('.mp3')
            with wave.open(str(wav),'wb') as output:
                output.setnchannels(2);output.setsampwidth(2);output.setframerate(rate)
                output.writeframes((stereo*32767).astype('<i2').tobytes())
            subprocess.run(['ffmpeg','-nostdin','-v','error','-i',str(wav),'-c:a','libmp3lame','-b:a','128k',str(mp3)],check=True,capture_output=True)
            full=render.decode(mp3,0,8)
            start=3.193;window=render.decode(mp3,start,1.8)
            expected=full[round(start*rate):round(start*rate)+len(window)]
            self.assertEqual(window.shape,expected.shape)
            self.assertLess(float(np.sqrt(np.mean((window-expected)**2))),.0001)
            self.assertGreater(float(np.sqrt(np.mean(window[:round(rate*.02)]**2))),.02)

if __name__=='__main__':unittest.main()
