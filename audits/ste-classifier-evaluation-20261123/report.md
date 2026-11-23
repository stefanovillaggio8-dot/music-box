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

## Completed native decoder comparison and second, distinct prototype

Run 45158081505 and refined bounds run 45158635872 used only this frozen
pair, two originals, Linux/macOS, Chromium/WebKit, 44.1/48 kHz. The first
run completed successfully as an EXPERIMENT; macOS WebKit's measured
`decoderAccepted` is FALSE. Nominal FLAC-to-original target correlation
is .031624 and relative RMS 1.39364 at both rates, despite valid durations
and safe peaks. Do not publish that splice or fit a waveform offset to
turn its failure into a pass. Linux WebKit retains the source's declared
1105/48000 s priming; macOS media and decode clocks also differ. Container
clock mapping is required, not an invented synchronization correction.

The second prototype is technically different: retain a native incoming
HTML audio element from zero, at the ordinary listening volume, and adopt
THAT SAME element after native outgoing EOF. It never uses the rejected
FLAC/MP3 splice, low-pass preview, tempo change or an intro seek. It is
desktop-only: iOS's existing restrictions on native element adoption are
preserved. No iPhone claim is made.

Across all eight native measurements, the source from begin-.3 to native
EOF has RMS <=.000037175 and sample peak <=.000152588. Incoming original
peak in the bounded possible native overlap is <=.376107; the sum's
conservative absolute bound is far below .96. A new explicit category
requires BOTH platforms/browsers/rates, all eight near-silent proofs,
native source clock conversion, entry zero, tempo/gain one, original EOF,
independent rendered introduction exposure and <=3 dB EOF level change.
This is not a beat or a partial metrical mix and cannot use either label.

`native-element-shadow.json` is still an evaluation candidate, outside the
public runtime index. The app test injects it only into an isolated HTTP
fixture, preserving all account data. Windows Chromium actual-app proof:
native target play at 0, source approximately 158.76; matching normal
volumes; adoption after outgoing EOF, target already at approximately
2.30 seconds; same target element; no target seek. The old element resets
its ended flag when released; the test measures EOF immediately BEFORE
adoption rather than falsely reading that flag after `remove src/load`.

The first prototype routing bug (early return bypassed prebuffer setup)
was caught by the real-app test and corrected. This was a new experimental
route bug, not claimed as the cause of the user's earlier recording.

46/46 targeted regressions pass. A full local suite has 785/787 passing,
with the same two pre-existing rejected historical fixture tests visible
in baseline CI 45148548690 (a missing historical bass fixture and its
future-selection assertion). They have not been altered or suppressed;
no new music research is done on those fixtures. Windows WebKit remains
an unavailable Web Audio backend, not a passing native test.

Next mandatory checkpoint: actual-app native-element tests on Linux AND
macOS Chromium/WebKit, via opt-in `native_clean_player`. Until those and
isolated release checks pass, public Ste availability remains 1 full +
1 partial, no newly certified/runtime-installed clean pair, no release.

## Completed actual-player trial and isolated release candidate PR71

The above checkpoint is now complete: run 45168978967 passes all four
actual-app shadow trials (Chromium/WebKit, Linux/macOS). Release-index run
45170406906 independently passes all four on the isolated main-based
candidate WITHOUT shadow injection. Source EOF precedes adoption in every
case; source volumes and target volumes are one; incoming starts at zero
and the SAME element is retained. Zero incoming seek writes. Incoming
position before adoption is 2.27..2.36 seconds; source launch 158.769..
158.789 seconds with the declared container-clock mapping where applicable.
This is a natural clean transition, never a full or partial beatmatch.

The actual legacy mode snapshot is `frozen-legacy-mode-gates.json`: 38->4
has `protectedEnding=true`, `confidentTail=true` and
`incomingImmediateIntro=false`; both old clean proposers return null.
Their proxy requirements exclude this entire-EOF/native-intro solution.
The separate category fixes THIS demonstrated mode false negative. It
does not establish that the full-beat agreement, +/-5% tempo or .70 key
confidence criteria should be relaxed. 705->50 remains the positive full
control. Current cached-feature harmonic proxies also pass its preserved
entrance (confidence .705643); the stored published certificate .735269
uses its own recorded analysis view. Raw-proxy rejection alone was not an
actual failure of the full fallback chain.

PR71 is isolated from main b0b4f34a and contains no broad PR59 merge. Public
availability is STILL 1 full + 1 partial until a release is actually made.
The isolated desktop candidate adds ONE clean 38->4 junction. iPhone does
not select the category; its native-adoption restriction is unchanged.
No 800-change daily-session simulation or global catalog sweep is claimed.
The real shuffle selector's bounded regression places a verified clean
cue in the postlude tier, not the full/partial tiers; manual queues remain
unchanged. This is selection-policy proof, not a new acoustic certificate
for synthetic test tracks.

Review found another fail-safe requirement: a prepared native target with
readyState=4 can still expose provisional .002-second metadata. The new
route now waits for its SHA-bound target duration within 2ms before arming.
Fault injection demonstrates no intro play/outgoing pause on provisional
metadata and reuse after genuine metadata arrives. This does not claim
to resolve the older unrelated Linux full-mix smoke failure.

Final PR59 full suite after these changes: 786/788, with the SAME two
historical fixture failures, not suppressed. Isolated release full suite:
767/769 before the final metadata guard; 47/47 relevant final class/queue/
structure regressions after that guard. Windows actual release playback
also passes with the guard. No physical iPhone measurement or human
musical listening has been made.

The first isolated release run exposed an absent `sw-6739.js` TEST fixture,
not loss of downloads. An exact copy of the published worker enabled the
real WebKit 6.739->6.740 upgrade test: saved-profile sentinels, legacy
audio, foreign cache, localStorage and IndexedDB survive; new player opens
offline; DJ index revalidates. Production cache deletion/migration logic,
Karaoke phrase assets, personal data and original recordings are unchanged.
The candidate remains in PR71 draft while release checks are incomplete.

## Additional frozen uncertain-harmony rendering

The predeclared LONG 50->705 window (begin 297.769333, 7.921667s, entry
zero, rate .9836066, original EOF retained) was rendered offline for the
FIRST time in this protocol, despite its uncertain-key veto. No window
search or retries; original Ste membership/SHA validated before decoding.
`render-uncertain-evaluation.py` reproduces it in a NEW output directory.
`uncertain-long-render.json` contains actual measurements, not a plan.

Rendered sample peak .985760, 4x oversampled .989337, overlap .96. Shared
headroom .781405 (about -2.14 dB), pitch preservation/timing checks pass
the renderer's own processor test. Its -10ms self-comparison lag is NOT
a pairwise musical beat-alignment measurement. Exposure screen accepts
with 1.5 seconds total intermittently masked / longest .5 seconds of five
meaningful seconds. Passing that screen does not prove musical quality.
Harmony, independent pulse/bars and native rendering remain unverified;
NO new full/partial certification or runtime installation is granted.
Low key confidence is still uncertainty, not demonstrated dissonance.

Across the FOUR selected pairs, one full positive stays valid, one rejected
pair gains the independently tested clean alternative in the isolated
candidate, one remains tonally uncertain (its SHORT alternative fails
energy/level guards), and one fixed native alternative is too short.
Zero pairs are proven intrinsically unmixable in EVERY possible window.
The long negative 38->4 control and the short 50->705 window remain rejected.
These counts must not be extrapolated into rejection totals for 222 songs.

## Resource policy correction

Found a fifth legacy workflow, dj-audio-spotcheck.yml, still launching a
130k-pair selection and sampled raw decoding on every push. Requested
cancellation of active out-of-scope runs and superseded PR71 runs. It is
now manual in the working branches and proposed separately as PR72, with
the fifth workflow covered by the no-automatic-global-research contract.
Essential player regressions and fixed Ste native regression remain.
This infrastructure correction is not an increase in musical coverage.

Next exact resume point: finish PR71 release validation (including the
duration guard), resolve/explicitly account for the pre-existing failing
release contracts without blindly restoring unverified historical plans, and only then
publish a verified isolated change. Musical research remains limited to
the frozen Ste cases; 50->705 still needs an independent harmonic/native
certificate, not another repetition of failed global estimators.

The two historical failures demonstrate a missing expected fixture/plan, not
by themselves an intentional safety revocation. Its disappearance has NOT
been diagnosed in this Ste-only musical campaign. Do not treat absence as
proof that its old certification was unsafe, or restore it just to pass CI.

## PUBLICATION COMPLETED: current status supersedes the earlier holds

PR72 merged as a5e8874c32f45013feb175d68767d0dad2cbd375 after 6/6 scope
contracts and CI passed. The legacy raw sampling workflow is now manual
on main. App/player/index/version blobs remained unchanged at 6.739 for
this policy-only publication. Rollback tag:
music-box-v6.739-before-legacy-audit-policy-20261123.

Final native-clean run 45173490869 passes BOTH platforms and BOTH browsers
after the provisional-target-duration guard. The ordinary Ste common-PCM
Chromium and WebKit regressions in run 45173491280 pass as well. The actual
iPhone-WebKit foreground control in run 45173490856 passes (24 rapid
starts, 24 clean stops, 6 paused stops, safe seek); the workflow's later
full-suite step stays red for the two SAME pre-existing historical tests.
It is NOT a physical iPhone test.

An independent baseline replay interposed only immutable main a5e8874c
engine/index bytes into that historical test file: 6/8 pass and the exact
same 2 fail. No expected value or musical threshold was weakened. This
establishes no NEW regression from the isolated Ste route; it does not
diagnose the old missing plan. Isolated candidate: 767/769 full, 47/47
relevant latest controls. PR59 research: 786/788 full. Those results must
remain explicit, rather than claiming all checks are green.

The phrase/offline run 45171878062 passed. All twelve owning blobs for
player/index/worker/phrase assets, test and workflow are IDENTICAL between
its verified head 691cd98f and release head 35285e3d. The latest redundant
install was still pending; reuse is justified by byte identity, not an
assumed pass. `published-release-readiness.json` records that evidence.

With the specific route, preserved controls and data verified, PR71 was
made ready and merged through NORMAL GitHub merging, matching exact head
35285e3d75653a003a9b11fe5ab0261376f925c3, without admin/force bypass.
Merge: 2559a5c0532f89abc95c77a80178f56cd9f05135. No whole-PR59 merge.
The two unrelated baseline failures remain open and visible. This is a
progressive verified desktop correction, not completion of the project.

Pages deploy 45174860213 completed successfully for that exact merge.
Public versione.json returns 6.740; public mix-intelligente.js and the
entire public audio index match the tested Git blobs EXACTLY. The actual
published engine was evaluated on ONLY already-stored same-account plans
in the current 222-recording personal Ste scope (no pair sweep, new PCM
or other-account simulation):

| Distinct Ste ordered pairs | Before | Public 6.740 |
| --- | ---: | ---: |
| Full beatmatch | 1 | 1 |
| Partial metrical | 1 | 1 |
| Explicit native clean, desktop only | 0 | 1 |

Full: 705->50. Partial: 4->38. New clean: 38->4, native overlap 2.339s,
entry zero, tempo one. `published-availability-6740.json` records the
actual public-engine result. iPhone does not gain the new clean class;
its 1 full/1 partial remain. No daily-session percentage improvement is
invented from a single new clean pair.

Rollback tag music-box-v6.739-before-ste-native-clean-20261123 points to
the prior production main a5e8874c. Original downloads, profile content,
Karaoke phrases and session fixes are preserved. Human listening to the
new desktop junction and physical iPhone update/resume/download checks
remain necessary; no claim of Spotify equivalence is made.

CURRENT RESUME POINT: preserve public 6.740 and its new native clean route;
continue Ste-only false-negative research on the frozen long 50->705
evaluation (independent harmonic/pulse/native evidence still missing),
and explain the two old missing-plan contracts before changing their
expectations. Do not repeat the failed global/CQT/timing experiments or
reclassify the new clean junction as a complete beatmatch. A future iPhone
route must respect the existing restriction on adopting native elements;
the desktop fix is not permission to remove that restriction.
