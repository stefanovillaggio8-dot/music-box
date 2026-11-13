# Smart Mix: multi-window PCM search and rendered output verification

Baseline: PR #59, `e164d1ecb2a39b4762c993ff1b847d5b404aab2e`.
Work remains on `audit-karaoke-beatmatch-20261113`; no merge or public release.

## What was actually measured

The baseline's 1,176 SHA-bound PCM records were recovered from successful
run `43411265108`, including all twelve shards. Its compiler report contains
**one** full-window pair, 584 → 336, lasting 6.849184 seconds. The separate
ordered-pair player simulation contains three certified proposals: that
multi-beat pair and **two short indexed snaps**. These counts are different
categories; neither the old 138,650-pair sample nor a snap is full coverage.

Instrumenting the baseline full-window planner across all **1,381,800**
ordered distinct-track pairs produced:

| Baseline gate | Pair/window count |
| --- | ---: |
| Rejected at duration / immediate rhythmic intro / required metadata | 715,575 |
| Rejected at global tempo-ratio gate | 522,369 |
| Missing first vocal/lyric boundary | 103,244 |
| Invalid complete PCM sections | 34 |
| Whole-track harmonic veto before local inspection | 13,482 |
| Pairs reaching window search | 27,096 |
| Simultaneous PCM windows actually tried | 60,542 |
| Windows passing independent rhythm fit | 302 |
| Windows also passing local harmony | 4 |
| Distinct ordered pairs represented by those windows | 1 |

The fixed incoming entry, 4.5–8-second native-tail horizon, and one BPM-guided
pulse track excluded alternative *observed* grids and sections before the
audio fit. A whole-song key could veto a compatible local section. Replacing
BPM with a single median did not work: it lost existing positive cases.

## Architecture and changes

1. Original MP3 → FFmpeg PCM → HPSS onset contour at 20 ms and harmonic
   frames at 500 ms. Existing source SHAs and measurements remain intact.
2. The v3 extractor retains the original beat track and adds bounded local
   tempo hypotheses, including half/double-time. Every additional pulse is
   snapped to an observed attack; low-strength or fabricated pulses fail.
   Cached v2 contours can be retracked explicitly without claiming a new
   MP3 decode. CI also extracts v3 directly from all original MP3s.
3. The offline pair compiler searches several actual incoming attacks,
   bounded to eight seconds after the original intro entry, and outgoing
   windows up to sixteen seconds before native EOF. It still requires a
   known incoming vocal/lyric boundary and independently checks the whole
   simultaneous window. It does not shorten the outgoing recording.
4. Unchanged rhythm gates: at least eight one-to-one observed pulses,
   ≥90% correspondence, RMS ≤40 ms, and onset evidence in both halves.
   The different-drum-pattern path retains its stronger twelve-pulse,
   ≥95%, ≤25 ms requirements. Playback tempo stays within 0.95–1.05.
5. Harmony is judged on the overlapping PCM sections. The unrelated global
   key veto is removed; local chord/key, dissonance, or measured percussive
   intro checks remain mandatory. HPSS analysis is not a playable vocal stem.
6. Only small SHA-bound cues enter the PWA index. New compact plans require
   actual render evidence before playback certification. Raw contours and
   alternative grids stay outside the phone's downloaded index.
7. Every final candidate is decoded again from its SHA-verified MP3 and
   transformed by the actual SoundTouch implementation at **16 and 48 kHz**.
   Timing is checked in both halves; a failed render cannot receive proof.
8. Rendering exposed hot master/summed peaks. Each desktop plan now carries
   a common output headroom factor based on the two measured peak bounds,
   with a 0.96 reference ceiling. Both recordings receive that factor;
   vocals remain intact. The tested complete path bypasses optional boosts,
   filters and compressors, which would invalidate the measured signal.
9. Safari can ignore native media volume. Pairs requiring common attenuation
   therefore retain its native safe fallback. Only **three** of the seventeen
   plans require no such attenuation; this is eligibility, not device proof.
10. The mobile clip remains single-entry and bounded: normally fourteen
    seconds, extended only as required by compiled plans, up to twenty-four.
    Worker cancellation/retry logic from `101cd5b0` is preserved. Prepared
    pitch-preserving audio can cover sixteen seconds without releasing its
    tempo before native EOF. Desktop decoder clocks and cancellation remain.

Queue, shuffle history, playlists and shared-room ordering are unchanged.
Their existing selection constraints still decide which pair can be used.
This change expands verified pair availability; it does not promise every
user-selected successor will have a mix.

## Comparable PCM outcome

| Indicator | Before | After |
| --- | ---: | ---: |
| SHA-bound tracks represented | 1,176 | 1,176 |
| Ordered distinct-track pairs considered | 1,381,800 | 1,381,800 |
| Distinct-recording pairs passed to the new compiler | not separately logged | 1,381,636 |
| Same-recording aliases explicitly excluded | not separately logged | 164 |
| Full-window PCM plans | 1 | 17 |
| Mean planned overlap | 6.849184 s | 9.302485 s |
| Full-window rendered pairs, this session | baseline pair included | 17 at both rates |
| Reference render samples over full scale after headroom | not previously certified | 0 at both rates |
| Human listening comparison | unavailable | unavailable |
| Labelled downbeat / bar / phrase accuracy | unavailable | unavailable |
| Real-audio word timing error | unavailable | unavailable |

The 18-pair exploratory result is superseded by **17**: the production
compiler additionally validates each alternative pulse against its original
contour. All counts refer to ordered catalog entries; aliases are reported
explicitly and never interpreted as additional independent recordings.

## Karaoke fixes

Exact ASR word observations can now align rapid phrases shorter than the old
450 ms phrase floor. Adjacent repeated hooks cannot reuse the same ASR words.
Malformed line times are rejected, and display estimates remain eligible for
real analysis. Existing trusted/provider/manual timings and per-track offsets
remain authoritative; translations and the two karaoke views are preserved.
Targeted tests reproduce these cases and the stale-track cancellation path.
These tests do not establish an acoustic word-error metric for the catalog.

An additional reproduced defect affected sub-60ms measured words: the visual
minimum stretched a 30ms word's fill to 60ms. Rendering now follows its actual
end (including seeks backwards). The regression fails on the old renderer
and passes with the correction; it does not change or invent word timestamps.

## Additional verification

- Both independent all-pair scans evaluate **1,381,800 / 1,381,800** pairs.
  Full-window plans: **1 → 17**; separate short indexed snaps: **2 → 2**.
  Underlays: 2,362 → 2,358; soft plans: 59,838 → 59,837; postludes: unchanged
  at 85,581. Cut proposals remain 183,988. No-plan outcomes: 1,049,999 →
  1,049,988. The 29 rejected beat proposals remain rejected. These are
  simulated planner categories, not a listening census or a certification of
  every attenuated transition. Word timing error remains unavailable.
- Fresh CI run `43449151573` re-decodes every original MP3, completes all
  twelve shards and reproduces the same 17 unique recording pairs, timings,
  playback rates, gain bounds and mean duration. Floating-point differences
  in five diagnostic scores are below 0.000016; no decision changes.
- All **nine PR workflows** pass on `7a138cb291d1ece04fd63b12f030a339a8666a5e`.
  WebKit runs **586/586** general tests, including installed offline shell
  reopening and downloaded-MP3 retention. Both Immersive browsers pass.
- CI found a residual native-tempo bug: feedback at 0.999x/1.000x bypassed
  the 850ms release and stayed non-native. The corrected early-return path
  explicitly restores 1x for the adopted player only. The unchanged live
  Chromium test now passes; a unit test reproduces the actual defect.
- A further all-catalog experiment fitted 8/12/16/24-pulse prefixes. It
  yielded the same 17 pairs, no additions, at higher computation cost. It
  is not enabled or counted as improvement.
- The short-word renderer's subsequent focused run passes **73/73** plus
  **9/9** targeted karaoke checks. Final workflow status is attached to the
  latest PR commit; earlier green runs are not represented as tests of a
  later code revision.

### Accurate MP3 window rendering

A final sample inspection detected 22ms of artificial silence at the start
of a reference WAV. The audit's input-side FFmpeg seek had discarded MP3
bit-reservoir history. Rendering now decodes from the beginning and trims
the output accurately. A generated stereo MP3 reproduces the defect:
window-versus-full-decode RMS error was 0.0164 before and falls below 0.0001
after the correction. This is a decoder regression test, not a source-text
assertion. All 34 exact windows were rendered again; all timing checks pass,
with zero full-scale sample overruns. Five conservative gain factors update;
the 17 pairs and three Safari-eligible pairs remain unchanged.

## Limits that remain material

- **17 / 1,381,800 ≈ 0.00123%** remains very low coverage. This is an
  improvement in full-window evidence, not Spotify Mixa equivalence.
- The full path still preserves native EOF. Arbitrary early verse/chorus
  exits need reliable vocal/structure evidence before cutting arrangements.
- Alternative pulse grids are not downbeat detection or proof of aligned
  4/8/16-bar phrases. Semantic section labels are not introduced.
- Most catalog entries have no independent vocal-model boundaries. Guarded
  synced-LRC boundaries are conservative metadata, not proof of absent
  backing vocals or a clean vocal stem. Vocal overlap still needs listening.
- Reference WAVs are renders of exact source windows and SoundTouch output,
  not microphone captures or measurements of every browser audio graph.
  44.1 kHz, physical iPhone/PWA background behavior and subjective artifacts
  remain separate device/listening work. No physical iPhone was tested here.
- Apple-style karaoke styling, stale-response guards, offline MP3 caches,
  playback controls and manual lyrics offsets are retained. No accuracy
  claim is made for every word or every shared-room/network race.

## Reproduction

```sh
python tools/retrack-dj-pcm.py --features=baseline-pcm --output=pcm-v3
node tools/build-full-beat-plans.cjs --features=pcm-v3 --output=compiled.json --report=plans.json
python tools/audit-full-beat-audio.py --plans=plans.json --output=audio-16k --cache=original-mp3
python tools/audit-full-beat-audio.py --plans=plans.json --output=audio-48k --cache=original-mp3 --rate=48000
node tools/apply-full-beat-audio-proof.cjs --index=compiled.json --plans=plans.json --reports=audio-16k/report.json,audio-48k/report.json --output=verified-index.json --report=verified-plans.json
node tools/dj-equivalence-audit.cjs --output=all-pairs.json
```

The final command reads the checked-in index. The PCM workflow performs a
fresh original-MP3 extraction before compiling/rendering, rather than relying
on the cached-contour retrack route. Its outputs are artifacts, never a deploy.
