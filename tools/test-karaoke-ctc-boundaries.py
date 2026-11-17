import importlib.util
import pathlib
import unittest
import numpy as np

spec = importlib.util.spec_from_file_location('boundaries', pathlib.Path(__file__).with_name('karaoke-ctc-boundaries.py'))
core = importlib.util.module_from_spec(spec)
spec.loader.exec_module(core)

class BoundaryTests(unittest.TestCase):
    labels = tuple('-|ABCDEFGHIJKLMNOPQRSTUVWXYZ\'')
    def emission(self, sequence):
        vocab = {c: i for i, c in enumerate(self.labels)}
        probabilities = np.full((len(sequence), len(self.labels)), .00001)
        for frame, token in enumerate(sequence):
            probabilities[frame, vocab[token]] = .999
        probabilities /= probabilities.sum(axis=1, keepdims=True)
        return np.log(probabilities)
    def test_separator_is_observed_after_character_spike_not_interpolated(self):
        emission = self.emission('-A---------|-B-----')
        words = core.observed_words(emission, [{'text': 'a'}, {'text': 'b'}], self.labels, 10)
        self.assertTrue(words[0]['boundaryGreedyExact'])
        self.assertGreater(words[0]['separatorAt'], words[0]['end']+.15)
        self.assertAlmostEqual(words[0]['separatorAt'], 10+11*.02)
        self.assertGreater(words[0]['separatorConfidence'], .8)
        self.assertIsNone(words[1]['separatorAt'], 'no synthetic end for final word')
    def test_forcing_short_substring_cannot_replace_freely_decoded_word(self):
        sequence = '-'+'-'.join('WE|THING|TIME')+'---'
        words = core.observed_words(self.emission(sequence),
            [{'text': 'we'}, {'text': 'in'}, {'text': 'time'}], self.labels, 0)
        self.assertFalse(words[1]['boundaryGreedyExact'])
    def test_impossible_or_empty_transcript_has_no_observations(self):
        emission = self.emission('---')
        self.assertEqual(core.observed_words(emission, [], self.labels, 0), [])
        self.assertEqual(core.observed_words(emission, [{'text': 'something'}], self.labels, 0), [])
        self.assertEqual(core.observed_words(emission, [{'text': '123'}], self.labels, 0), [])
if __name__ == '__main__':
    unittest.main()
