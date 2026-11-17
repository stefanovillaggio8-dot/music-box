# Rendered introduction exposure and future-recording metadata

Baseline: PR #59 f536ee72; public Music Box 6.735. This is a new investigation,
not a repeat of the previous decoder API study. No video was supplied. The user
tentatively recalled Modà, Passione maledetta → Non ti dimentico (166 → 181).

## Reproduced cause and change

The deployed Modà FLAC was reproduced byte for byte from SHA-checked original
MP3s: SHA256 6b4c71156b309b4322f251c87186b549c741f7b1bd54658ce70fc42d3d6de9cc.
Its entry is zero, not a seek that skips the opening. It consumes 9.988 seconds
under the still-loud outgoing recording at incoming gain .33. Actual isolated
components, AFTER common gain, put the incoming recording 32.13 dB below the
outgoing one at 4 seconds, and 16.87 dB below it at 6 seconds. Its rhythmic and
native-splice receipts did not test this masking. A rhythm certificate alone
was insufficient to establish a usable musical entrance.

The offline renderer now measures actual component RMS in 250 ms windows over
the first five original incoming seconds. A continuous 750 ms interval with
original incoming RMS >= .001 and incoming/outgoing RMS below -18 dB fails a
conservative masking screen. Attenuation relative to the original is reported
separately. These are frozen engineering screening limits, not a certified
psychoacoustic model or proof that a passing mix sounds good. Listening remains
necessary. No beat, harmony, voice, clipping or content thresholds were relaxed.

35 of 60 in-scope historical asset variants were reproduced exactly. Only
exact-SHA matches receive exposure metadata; the other 25 are explicitly
unresolved, not judged from a similar render. Some were old inactive variants.
15 exact variants fail this screen. The runtime refuses their static cue and
reopens the normal safe fallback; it cannot promote them just because entry=0.
The builder also refuses to certify newly rendered, persistently masked intros.
No source MP3 or stored user download was modified or removed.

For the Modà pair both actual resolver functions now return no overlay: the
old recording finishes and the new recording begins at original zero at native
volume. The comparison audio is an offline reconstruction of that behavior,
NOT a recording from the missing video or a physical iPhone. It preserves every
outgoing sample and the new first five seconds have zero difference from the
original PCM. The outgoing original itself decodes above unity (sample peak
1.1184, 4x peak 1.1191); natural playback adds no overlap, but this does not certify
that hot original master as clipping-free at full native gain. Local listening
previews use the SAME .7 monitoring gain before/after (peak below .784).

## Personal libraries: actual planner, fixed seeds, no Gym

The baseline and changed runs use the same actual app membership and selector,
227 Ste, 212 Diego, 621 Emanuele. Gym is excluded from these inventories and
simulations; membership, playlists, favorites and user state are untouched.
Historical unrelated Gym regression tests remain unchanged.

| Personal library | Complete distinct pairs before → after | Partial distinct pairs before → after | Complete uses / 800 shuffle changes | Partial uses / 800 |
|---|---:|---:|---:|---:|
| Ste | 1 → 1 | 2 → 0 | 20 → 20 | 20 → 0 |
| Diego | 2 → 2 | 0 → 0 | 21 → 21 | 0 → 0 |
| Emanuele | 7 → 6 | 5 → 2 | 79 → 77 | 23 → 15 |

This is a quality correction and a reduction in previously over-counted
availability, NOT a coverage improvement. The one retired historical full pair
has independently failed rendered entrance evidence; all other historical full
pairs remain full. Source-preservation certificates and rhythmic errors are
unchanged: no audio was reprocessed for the accepted cues. Detailed ordered,
manual queue, shuffle and synthetic downloaded-only runs are in the JSON files.
No attempt escaped the personal account pool. The offline simulation uses a
fixed synthetic 50% download manifest; it does not inventory a user's iPhone.

## Future recordings: completed increment and remaining architecture

New library notifications now schedule a throttled revalidation of the loaded
server index, rather than leaving a running app permanently on the old metadata.
Requests defer while hidden/offline, downloading, seeking, mixing, poorly buffered
or within 45 seconds of EOF. Pending analysis is polled at most every 15 minutes;
no heavy model is installed on phones. Changed recent-track measurements reopen
selection. The existing hourly basic MP3 analyzer discovers new Git-hosted
recordings automatically, independently of pair tables. It now verifies original
Git blob SHA before analyzing, preventing a branch-update race from attaching
the old identity to replacement bytes.

The incremental reconciler preserves same-SHA advanced musical extensions when
a new basic analysis arrives. Replacement MP3s never inherit those certificates.
Tests cover automatic unseen-source discovery/persistence, replacement races,
index arrival and bidirectional generic PCM candidate discovery without a pair
table. Synthetic candidates do not count as real certified audio transitions.

NOT YET COMPLETE: the expensive Beat This/Spleeter structural snapshot and
rendered common-PCM edge production are still not a durable automatic incremental
pipeline for every future song. Local-only imports still rely on local analysis;
blob-URL persistence, unattended per-song analysis scheduling and full structural
certification need further work. The metadata fix alone does not meet that entire
requirement and cannot guarantee full beatmatches for new music.

## Validation / limits

741/741 full Node tests passed, then the additional unseen-source bidirectional
candidate test passed (3/3 in that file). Real DSP Python regressions and new
discovery/identity fixtures passed. Initial test failures exposed expectations
that masked historical pairs should remain usable; these now explicitly assert
their rejection, with the old rhythm/native-clock guards tested separately.
Two isolated index-loader fixtures gained the same recent-track state now used
by the application. No safety assertion was weakened to accept a render.

Browser and release verification are recorded separately when completed.
No physical iPhone or video-specific verification has occurred. Karaoke acoustic
coverage is unchanged (192/590, independent 9/96, additional holdout 0/78); no new
timing accuracy is claimed. No storage cleanup or user-data migration is part of
this increment. Spotify equivalence remains unproved.
