import hashlib,importlib.util,json,pathlib,tempfile,unittest
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('clock',pathlib.Path(__file__).with_name('mp3-gapless-clock.py'))
clock=importlib.util.module_from_spec(spec);spec.loader.exec_module(clock)

class ExactClockTests(unittest.TestCase):
    def measure(self,data):
        with tempfile.TemporaryDirectory() as folder:
            file=pathlib.Path(folder)/'source.mp3';file.write_bytes(b'original')
            sha=hashlib.sha1(b'blob 8\0original').hexdigest()
            with patch.object(clock.subprocess,'check_output',return_value=json.dumps(data).encode()):
                return clock.mp3_clock(file,sha)
    def test_rounded_packet_seconds_cannot_accumulate_into_false_decoder_drift(self):
        data={'streams':[{'codec_name':'mp3','sample_rate':'44100','time_base':'1/14112000'}],
              'packets':[{'duration':368640,'duration_time':'.026122'}]*6000}
        proof=self.measure(data)
        self.assertEqual(proof['rawFrames'],6000*1152)
        self.assertEqual(proof['decodedFrames'],6000*1152)
        self.assertGreater(abs(proof['rawFrames']/44100-6000*.026122),.002)
    def test_declared_skip_and_padding_are_subtracted_from_exact_ticks(self):
        packets=[{'duration':338688,'duration_time':'.024'} for _ in range(2000)]
        packets[0]['side_data_list']=[{'side_data_type':'Skip Samples','skip_samples':1105,'discard_padding':999}]
        p=self.measure({'streams':[{'codec_name':'mp3','sample_rate':'48000','time_base':'1/14112000'}],'packets':packets})
        self.assertEqual(p['decodedFrames'],2000*1152-1105-999)
    def test_missing_or_fractional_container_ticks_never_use_rounded_seconds(self):
        for stream,packet in [({'time_base':'1/14112000'},{'duration_time':'.026122'}),
                              ({'time_base':'1/14112000'},{'duration':1,'duration_time':'.026122'})]:
            with self.assertRaises((KeyError,ValueError)):
                self.measure({'streams':[{'codec_name':'mp3','sample_rate':'44100',**stream}],'packets':[packet]})

if __name__=='__main__':unittest.main()
