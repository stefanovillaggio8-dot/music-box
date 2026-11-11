#!/usr/bin/env python3
"""Produce a real Demucs vocal-only OUTRO clip for ONE authorized Music Box MP3.

This is an OFFLINE, explicit workflow. No source separation runs on iPhone or
in the playback thread. An exact git blob SHA binds the stem to its source.
The browser MUST ignore a missing or mismatched stem without affecting songs.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "dj-vocal-stems.json"
SOURCES = {
    "audio": ("stefanovillaggio8-dot/music-box-brani", "main"),
    "mobile": ("stefanovillaggio8-dot/music-box", "mobile-audio"),
    "app": ("stefanovillaggio8-dot/music-box", "main"),
}
TRACK = re.compile(r"^(audio|mobile|app)/(songs/[A-Za-z0-9/_-]+\.mp3)$", re.I)
MODEL = "htdemucs"

def execute(*argv):
    subprocess.run([str(x) for x in argv], check=True, stdout=subprocess.PIPE)

def probe_seconds(path):
    data = subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(path)
    ], text=True)
    value = float(data.strip())
    if not 26.0 <= value <= 900.0:
        raise ValueError("Source duration out of safe 26..900 second range")
    return value

def source_mp3(key):
    match = TRACK.fullmatch(key)
    if not match or ".." in key or "//" in key or "\\" in key:
        raise ValueError("Expected audio|mobile|app/songs/<safe-name>.mp3")
    owner_repo, branch = SOURCES[match.group(1).lower()]
    rel = match.group(2)
    url = (f"https://raw.githubusercontent.com/{owner_repo}/{branch}/" +
           urllib.parse.quote(rel, safe="/"))
    req = urllib.request.Request(url, headers={
        "User-Agent": "MusicBox-Demucs-Vocal-Stem/1.0"
    })
    with urllib.request.urlopen(req, timeout=100) as response:
        content = response.read(24_000_001)
    if not 8_192 <= len(content) <= 24_000_000:
        raise ValueError("MP3 exceeds the authorized source catalog limits")
    if not content.startswith((b"ID3", b"\xff\xfb", b"\xff\xf3", b"\xff\xf2")):
        raise ValueError("Source is not recognized as MP3")
    digest = hashlib.sha1(
        b"blob " + str(len(content)).encode() + b"\0" + content
    ).hexdigest()
    return digest, content

def request_from_file(path):
    """A repository change is explicit opt-in for ONE already indexed source.
    Never blindly turn a queue of random public URLs into uploaded vocals.
    """
    if Path(path).name != "dj-vocal-stem-requests.json":
        raise ValueError("Expected dedicated approved stem request file")
    obj = json.loads(Path(path).read_text(encoding="utf8"))
    requests = obj.get("requests") if isinstance(obj, dict) else None
    if not isinstance(obj, dict) or obj.get("version") != 1 or \
       not isinstance(requests, list) or len(requests) != 1:
        raise ValueError("Expected exactly one versioned stem request")
    item = requests[0]
    if not isinstance(item, dict):
        raise ValueError("Invalid stem request")
    key = item.get("trackKey")
    sha = item.get("sourceSha")
    if not isinstance(key, str) or not isinstance(sha, str) or not re.fullmatch(r"[0-9a-f]{40}", sha):
        raise ValueError("Stem request must include an exact source blob SHA")
    if not TRACK.fullmatch(key) or ".." in key or "//" in key:
        raise ValueError("Invalid stem source key")
    bounds = json.loads((ROOT / "dj-lyric-boundaries.json").read_text(encoding="utf8"))
    linked = bounds.get("entries", {}).get(sha, {})
    # A trusted synchronized LRC is only evidence that the passage might
    # contain vocals. The Demucs separator must produce the real sidecar.
    duration = linked.get("duration")
    last = linked.get("lastLrcAt")
    if linked.get("sourceKey") != key or not isinstance(duration, (int, float)) or \
       not isinstance(last, (int, float)) or not 0 <= duration-last <= 16:
        raise ValueError("No matching SHA-bound synced vocal passage near outro")
    return key, sha


def build(key, expected_sha=None):
    sha, content = source_mp3(key)
    if expected_sha is not None and sha != expected_sha:
        raise ValueError("Source MP3 changed since synchronized analysis")
    manifest = json.loads(MANIFEST.read_text(encoding="utf8"))
    if manifest.get("version") != 1 or not isinstance(manifest.get("entries"), dict):
        raise ValueError("Unexpected vocal stem manifest schema")
    out = ROOT / "dj-stems" / "vocals" / (sha + ".m4a")
    if out.is_file() and sha in manifest["entries"]:
        print("Existing SHA-matched stem:", out.relative_to(ROOT))
        return
    with tempfile.TemporaryDirectory(prefix="musicbox-vocal-") as directory:
        tmp = Path(directory)
        mp3 = tmp / "original.mp3"
        mp3.write_bytes(content)
        duration = probe_seconds(mp3)
        # Demucs runs only over a final bounded window, not over every song.
        # A 2s padding lead-in gives its network context for first vocal word.
        source_start = max(0.0, duration - 26.0)
        window_duration = duration - source_start
        excerpt = tmp / "outro.wav"
        execute("ffmpeg", "-v", "error", "-nostdin", "-y", "-i", mp3,
                "-ss", f"{source_start:.3f}", "-t", f"{window_duration:.3f}",
                "-ac", "2", "-ar", "44100", "-c:a", "pcm_s16le", excerpt)
        output = tmp / "separated"
        execute(sys.executable, "-m", "demucs", "-n", MODEL,
                "--two-stems", "vocals", "--device", "cpu",
                "--out", output, excerpt)
        vocals = output / MODEL / "outro" / "vocals.wav"
        if not vocals.is_file():
            raise RuntimeError("Demucs did not create a real isolated vocals.wav")
        first_skip = min(2.0, max(0.0, window_duration - 5.0))
        clip_start = source_start + first_skip
        clip_length = duration - clip_start - 0.16
        if clip_length < 4.0:
            raise ValueError("Separated vocal window is too short")
        out.parent.mkdir(parents=True, exist_ok=True)
        staging = tmp / "isolated-vocals.m4a"
        execute("ffmpeg", "-v", "error", "-nostdin", "-y", "-i", vocals,
                "-ss", f"{first_skip:.3f}", "-t", f"{clip_length:.3f}",
                "-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-ac", "2",
                "-movflags", "+faststart", staging)
        if staging.stat().st_size < 18_000:
            raise RuntimeError("Invalid or empty vocal stem")
        # GitHub Actions will publish both the manifest and small AAC clip.
        stem_bytes = staging.read_bytes()
        out.write_bytes(stem_bytes)
    manifest["entries"][sha] = {
        "sourceSha": sha,
        "path": str(out.relative_to(ROOT)).replace(os.sep, "/"),
        "start": round(clip_start, 3),
        "end": round(duration - 0.16, 3),
        "sourceDuration": round(duration, 3),
        "separator": "demucs-htdemucs",
        "role": "isolated-outgoing-vocals",
        "stemSha256": hashlib.sha256(stem_bytes).hexdigest(),
        "trackKey": key,
        "createdAt": dt.datetime.now(dt.timezone.utc).isoformat()
    }
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
                        encoding="utf8")
    print(json.dumps({"sha": sha, "stem": str(out.relative_to(ROOT)),
                      "start": round(clip_start, 3),
                      "end": round(duration - .16, 3)}))

def main():
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--track-key",
                       help="audio|mobile|app/songs/...mp3 (authorized Music Box only)")
    group.add_argument("--request-file", help="single preapproved SHA-bound request")
    arguments = parser.parse_args()
    if arguments.request_file:
        key, expected_sha = request_from_file(arguments.request_file)
        build(key, expected_sha=expected_sha)
    else:
        build(arguments.track_key)

if __name__ == "__main__":
    main()
