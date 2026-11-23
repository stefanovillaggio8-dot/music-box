# Ste: bounded classifier evaluation following comment 7097477665

Baseline PR59 065968ba; public main b0b4f34a / version 6.739. Current
personal Ste scope: 222 recordings. Existing full 705->50 and partial
4->38 remain distinct and unchanged. No catalog sweep, other-account
research, Gym changes, new models, player/storage changes or release.

Four selected pairs were frozen before decoding (cases.json). Protocol
and full positive-control geometry are in protocol.json. Original blobs
are checked against current Ste membership before decoding or fetching.

## What the sample does and does not establish

* Full positive 705->50 remains accepted by the actual player. A raw
  constant-gain harmonic proxy rejects it, but the existing correctly
  enveloped preserved-tail test passes: key confidence .735269, added
  roughness .012324, raw .297447. A rejection by ONE proxy is not evidence
  that the complete classifier rejects this pair.
* 38->4 lacks the required full-duration shared rhythmic evidence. That
  restricts a full beatmatch, not necessarily an intact natural ending.
* 50->705 key confidence below .70 is uncertainty, not certified dissonance.
  Its alternative short native tail still has original RMS .014888 and
  EOF level change +4.693 dB; reject this proposed clean window.
* 210->38 needs 9.69% tempo change for the considered metrical geometry;
  the 5% beatmatch limit stays. Its fixed native alternative is only
  .172 s long, outside the predeclared .5..3 s range. No retries.

These categories overlap and describe the FOUR-PAIR SAMPLE ONLY. They
are not a new count of reasons across all 222 songs. The existing 1+1
counts reflect independently verified, rendered, native-compatible
stored plans; they do not measure how many pairs are intrinsically
unmixable. Model beat gaps and low key confidence are not that proof.

## Independent native-speed evaluation, not a certificate

Gilgamesh (38) -> Sono Ok (4): begin 158.75, original EOF 161.089,
overlap 2.339 s, incoming entry zero, native tempo, outgoing/incoming
unity, all original outgoing samples retained. Original tail maximum
20ms RMS .00003636, sample peak .000138. Existing multiband exposure
screen detects no sustained masking. Fixed eight-second negative control
contains source RMS .806 and vocal conflict and remains rejected EVEN
THOUGH the exposure screen alone passes. That screen cannot certify voice
or structure.

The first protocol's relative interaction criterion fails 8/10 noise-floor
frames. It is scale-invariant and cannot distinguish two inaudible signals
from loud interference. This is a FAILED V1 criterion, not silently passed.
A separate proposed near-silent class would require EVERY outgoing 20ms
RMS <=.0001 and peak <=.001, intact EOF, native incoming from zero,
independent exposure, decoder and clock proof, no clipping, and level
continuity. This is an explicit alternative sufficient condition, not a
change to beatmatch/key/voice thresholds. It is not yet a runtime class.

Listening previews include four seconds before/six after the transition;
their 1.27..1.39 dB attenuation came from peaks OUTSIDE the runtime segment.
The actual runtime-length evaluation FLAC uses unity gain, peak .962622,
overlap peak .376115 and 4x oversampled peak .981018. EOF level change is
+1.509 dB, including the original recording dynamics. Do not use preview
normalization to claim a player gain problem or silently weaken limits.

candidate.json / its SHA-named FLAC are EVALUATION ONLY, deliberately
outside dj-mixes and the runtime index. Baseline player still returns null
for 38->4. No new full, partial or clean runtime pair is claimed.

Windows Chromium nominal 100ms original-return comparisons pass at both
rates: correlation >.999999998, relative RMS <.000047, all measured codec
clock offsets zero. Windows WebKit has no Web Audio and is explicitly an
unavailable backend, not a successful test. Native decode evaluation on
Linux/macOS must follow; actual player integration and physical iPhone
verification are separate. Receipt decoderAccepted NEVER authorizes release.

## Reproduction

From repository root (Python needs numpy/scipy, ffmpeg/ffprobe):

```
node tools/fetch-ste-clean-evaluation.cjs audits/ste-classifier-evaluation-20261123/candidate.json
python tools/render-ste-clean-evaluation.py audits/ste-classifier-evaluation-20261123/protocol.json NEW_EVALUATION_FOLDER
node tools/ste-native-clean-evaluation.cjs NEW_EVALUATION_FOLDER/candidate.json NEW_RECEIPT.json
```

The existing Ste contract workflow has an opt-in `native_clean_evaluation`
dispatch for these two originals only, Linux/macOS Chromium+WebKit,
both rates. It does not run music experiments on PR/push. It never installs
plans or modifies downloads, account data or public player files.
