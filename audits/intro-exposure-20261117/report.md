# Original-audio introduction correction and future-track metadata

Baseline: public Music Box 6.735, actual main files at 97bbc3e8. Candidate release
6.736 is isolated from PR59's unfinished research. No screen video was supplied;
the user tentatively recalled Modà 166 → 181. No physical iPhone was tested.

## Actual cause and audio result

The deployed Modà FLAC was reproduced BYTE IDENTICAL from the SHA-checked
original MP3s: 6b4c71156b309b4322f251c87186b549c741f7b1bd54658ce70fc42d3d6de9cc.
Entry was zero; no initial seek explains the problem. A 9.988-second overlap
plays the incoming crescendo at gain .33 beneath the still-loud outgoing song.
After actual shared gain, incoming/outgoing RMS is -32.13 dB at4s and -16.87dB
at6s. Rhythm and native splice certificates alone did not check this loss.

The new offline screen compares actual audible components in separate frequency
bands, not just total loudness. Independent synthetic tests demonstrate why a
quiet treble instrument can remain exposed over loud bass. The initial
broadband-only prototype over-rejected music and WAS NEVER PUBLISHED. Its
historical simulation is retained explicitly as a prototype, not final results.

Protocol2: 250ms windows, first five original seconds, original RMS >= .001;
bands40–250,250–2500,2500–12000Hz (upper limit adapts for the16k diagnostic).
Only bands with >=10% of incoming original power and RMS>=.0005 are meaningful.
A continuous750ms below -18dB relative to outgoing in EVERY meaningful band
fails the screen. These frozen engineering checks do not establish perceptual
quality; listening is still necessary. Beat/harmony/voice/peak limits unchanged.

38/61 personal-scope asset variants were exactly reproduced; seven variants
fail protocol2. The23 unmatched historical renders remain unresolved, not
judged from similar audio. Only exact-asset, source/target-SHA-bound findings
are attached to the index. Positive alternative windows are selected normally;
an entirely failed pair cannot substitute another unverified quiet preview.

For Modà the actual app now rejects overlap and starts the second ORIGINAL
at zero after the first EOF, full requested volume, no tempo alteration.
Actual Chromium MP3 playback verifies this, including the real manual queue.
Native EOF is captured before the app's normal ended handler; no simulated
clock, volume-only console assertion or rewind is used as proof.

The local after-audio is an offline reconstruction, not an iPhone recording.
All old frames and the entire new opening are preserved. The first five new
seconds have zero PCM difference from the original. The outgoing master itself
decodes above unity (sample1.1184,4x peak1.1191); natural playback adds no overlap
but does not fix that existing master. Before/after listening previews use the
same .7 monitoring gain (peak<.784). No global clipping-free claim is made.

## Real personal library comparison, no Gym

Actual account scopes unchanged: Ste227, Diego212, Emanuele621. Public 6.735
engine/app/index versus isolated6.736, same seeds and membership. Original
recordings; synthetic fixed50% download manifest is not a phone-storage audit.
Complete/partial uses are kept separate. Full classification follows the
existing engine protocol, not a human DJ/structural-equivalence certification.

| Account | Distinct full pairs | Distinct partial pairs | Uses full/partial,20×40 changes | Uses full/partial,continuous800 |
|---|---:|---:|---:|---:|
| Ste | 1 → 1 | 2 → 1 | 20/20 → 20/0 | 4/7 → 4/3 |
| Diego | 2 → 1 | 0 → 0 | 21/0 → 5/0 | 8/0 → 4/0 |
| Emanuele | 7 → 7 | 5 → 5 | 79/23 → 79/23 | 9/4 → 9/4 |

This correction improves preservation/exposure, NOT full-pair availability.
Ste retains705→50 full and4→38 partial;166→181 is now a natural handoff. Diego
uses an already rendered, positively exposed353→135 alternative; the old
451→315 slow entrance is withheld. Emanuele's seven full/five partial remain.
No library, playlist, favorite or personal record was edited. No new benchmark
or optimization targets Gym. Existing unrelated regression tests remain.
Zero simulated selections escape the personal pool; manual queues are honored.
All skipped original content remains zero. A short-session reset is explicitly
different from continuous listening: Ste still has long gaps without full mix.

## Automatic future-track increment

New and changed-source notifications reopen selection and track ALL pending
public IDs (not only the32-item shuffle priority sample). Rotating blob URLs
do not reanalyze a recording; a local ID becoming a real MP3 does notify change.
Local-only blobs do not cause endless server-index downloads. Polling is at
most every15min, visible, not mixing/seeking/downloading, with10s buffer and
>45s before EOF while playing. Already measured songs avoid redundant refresh.

Forced refresh reads generated public main-branch analysis directly, so the
existing hourly basic analyzer's data updates require no Pages/app release.
The service worker honors deliberate refresh instead of returning stale JSON.
Compatible protocol2 metadata cannot be downgraded by a stale CDN response;
older offline data retains basic analysis but defers static plans, without
deleting saved music. The reconciler preserves same-SHA advanced extensions;
replacement recordings do not inherit certificates. Original Git blob SHA is
checked before server DSP to reject discovery/fetch races.

Still unfinished: automatic durable BeatThis/Spleeter whole-structure evidence
and certified common-audio edge generation for every future song, local-only
blob analysis persistence/scheduling, and physical-phone import tests. Existing
hourly basic analysis plus refreshed generic search is not the entire requested
future-song certification pipeline. No heavier model is installed on phones.

## Verification and next work

748/748 root Node tests,739/739 isolated-release tests, zero failed/skipped.
Real DSP Python tests plus new import discovery/replacement-race fixtures pass.
Actual WebKit worker6.735→6.736 preserves per-account and legacy saved audio,
unrelated cache, IndexedDB/localStorage and serves the new player offline;
it also proves deliberate DJ metadata refresh returns fresh data.
New render-certification tests ensure a proposal failing any requested rate is
reported/rejected, not exported as a complete plan; independent previous
verified windows are retained. Missing/mismatched window/hash/unsafe-peak
evidence still fails. Actual cue parameters are now bound into render reports.
The old CI844→50 proposal failed16k stretch and must never be promoted.

Exact-current Linux/macOS Chromium/WebKit release jobs are reported separately
when complete. The matrix now includes real personal Diego playback in addition
to Ste/Emanuele, with unchanged timing/seek/volume checks. Windows WebKit's
original MP3 test reported unsupported media(code4), not an iPhone diagnosis.
Karaoke remains192/590, independent9/96, additional holdout0/78; no acoustic
accuracy improvement claimed. Phone slowdown remains unconfirmed; no cleanup
or data deletion is included. Spotify equivalence remains unproved.

Separate UNPUBLISHED experiment: a generic first-attack envelope reaches incoming
gain .33 over8ms rather than fading away the beginning. The451→315 example
renders with zero masked time, peak.9691,4x peak.9713, maximum gain reduction
.8847dB and EOF change+2.856dB. SoundTouch timing is verified at-10ms lag, but
this is not a new downbeat/phrase or physical-browser certificate. The candidate
and core change are NOT in the stable release/index; native certification is
required before activation. This is the next concrete musical improvement.
