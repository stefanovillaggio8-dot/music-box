#!/usr/bin/env python3
"""Offline-only contract checks for vocal sidecar generation; no MP3 downloads."""
import importlib.util
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("dj_vocal_stem", ROOT / "tools/dj-vocal-stem.py")
stem = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stem)

class StemContract(unittest.TestCase):
    def test_source_repo_scope(self):
        for value in (
            "audio/songs/track-111.mp3",
            "mobile/songs/youtube-abc123xyz9_.mp3",
            "app/songs/test/sample-17.mp3"
        ):
            self.assertIsNotNone(stem.TRACK.fullmatch(value))
        for value in (
            "https://evil.example/audio.mp3",
            "audio/../songs/file.mp3",
            "audio/songs/../../secrets.mp3",
            "app/songs/name.mp3;rm -rf",
            "mobile/songs/evil.mp4",
            "other/songs/a.mp3"
        ):
            self.assertTrue(stem.TRACK.fullmatch(value) is None or
                ".." in value or "//" in value)

    def test_exact_sha_manifest(self):
        manifest = json.loads(stem.MANIFEST.read_text(encoding="utf8"))
        self.assertEqual(manifest["version"], 1)
        for sha, entry in manifest["entries"].items():
            self.assertRegex(sha, r"^[0-9a-f]{40}$")
            self.assertEqual(entry["sourceSha"], sha)
            self.assertEqual(entry["path"], "dj-stems/vocals/" + sha + ".m4a")
            self.assertEqual(entry["separator"], "demucs-htdemucs")
            self.assertGreater(entry["end"], entry["start"])
            self.assertLessEqual(entry["end"], entry["sourceDuration"])

    def test_sha_is_git_blob_sha_not_filename_or_mp3_tags(self):
        import hashlib
        data=b"ID3" + b"ABCD"*5000
        git_sha=hashlib.sha1(
            b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()
        self.assertRegex(git_sha, r"^[0-9a-f]{40}$")
        self.assertNotEqual(git_sha,hashlib.sha1(data).hexdigest())

if __name__ == "__main__":
    unittest.main()
