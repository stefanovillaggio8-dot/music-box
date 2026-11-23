# Ste / Kid Yugi: bounded independent render screen

Scope: one current personal Ste direction, Stratos (1187) -> Eva (34).
222 actual Ste recordings validated; no Gym or other-account research.
Two cached model geometries first screened, no new inference or global scan.
No certification gate or production code changed by this experiment.

The two-bar geometry has an estimated instrumental incoming prefix through
the overlap. The four-bar geometry extends beyond that prefix and its
separated-vocal handoff is not supported. These are model hypotheses, not
human-verified structure or voice boundaries. Both fail the existing tonal
confidence screen: source confidence .663 / .602, minimum .70. Four-bar key
compatibility is high but confidence insufficient; two-bar key labels also
disagree. Chroma-clash screens themselves do NOT show excess dissonance.
Nearby/global context confidence is inconsistent, so context is not used
to override the window. Low confidence is uncertainty, not proof of a clash.

Following the false-negative instruction, the two-bar window was separately
rendered for evaluation even though harmony had vetoed certification.
Fixed begin 163.267547s, original EOF 168.853s, entry zero, 5.585453s overlap.
Compare declared tempo 1.039215686 with native 1.0, without fitting lags or
changing geometry. Production first-attack envelope, source uncut through
decoded EOF, pitch-preserving SoundTouch. The renderer's full-mode flags
select the strict analysis/envelope; they are NOT a certificate or an index
entry. Every receipt is marked certified:false / installed:false.

Constant shared-gain renders at 44.1/48kHz fail the existing final peak guard
BEFORE an output is produced (1.0545--1.0588). This is not just overlap sum:
the outgoing original alone peaks 1.12887/1.13168, and its preceding 300ms
already peaks 1.06020/1.06360. Do not call this an app-introduced clipping bug
or loosen the ceiling. Four failed renders remain archived.

Technically different comparison: the ALREADY EXISTING bounded stereo-shared
lookahead mode, fixed supported 900ms preroll, original-sample 4x true-peak
bounds, no changed ceiling, at 48kHz only. Both diagnostic renders succeed:

| Measurement | Declared tempo | Native speed |
|---|---:|---:|
| Overlap 4x peak | .959050 | .959050 |
| Whole preview 4x peak | .998011 | .998011 |
| Max shared reduction | 2.474 dB | 1.972 dB |
| Mean overlap reduction | .220 dB | .184 dB |
| Observed shared attacks | 4/7 | 2/7 |
| Error among matched attacks | 19.47ms | 37.84ms |
| Matches in second half | 1 | 0 |
| Downbeats verified | no | no |

The first and native reveal gains are exactly one. Both introduction masking
screens pass, longest obscured run 250ms, not a subjective audibility proof.
SoundTouch's internal timing check passes; this is DISTINCT from inter-song
beat alignment, which fails. Low error on four selected matches cannot stand
in for sufficient attack coverage, sustained alignment or verified bars.

Thus the local harmony veto may be an uncertain classifier, but bypassing it
does not reveal a certifiable full beatmatch here. Independent rendered
attacks still lack agreement and bar support. This does not prove that all
possible musical junctions of these recordings are incompatible. A clean,
non-beatmatched option is also not certified: tonal/voice/structure and
native decoder return need independent evidence and human listening.

Outputs are local only, not shipped with Music Box:
work/ste-stratos-eva-lookahead-20261123/48000-{declared-tempo,native}/
ASCOLTO-SPERIMENTALE-NON-CERTIFICATO.wav (same-path FLAC also available).
These are reconstructed offline PCM, NOT device output captures. No human
listening, physical iPhone test, native decoder handoff or pitch-quality
perceptual assessment has been performed.

Result: zero new full / partial / clean certifications. Preserve all existing
Ste 1 / 1 / 2 desktop directions and the iPhone guard. Do not rerun this same
geometry/envelope merely with different detector thresholds; further work
needs a genuinely independent rhythm/tonality reference or a different
structurally justified window. Both failed and successful *diagnostic*
renders are saved with their distinct meaning, not promoted automatically.
