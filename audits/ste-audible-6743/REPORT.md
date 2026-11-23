# Music Box 6.743 — audible introductions and native EOF ownership

Release candidate, separate from draft PR59. Includes PR75–79 published changes unchanged. PR80 remains separate, with no inferred phrase offsets installed. Phrase-only Karaoke retained.

## Ste results

Current personal Ste: 222 recordings, Gym excluded. Read-only lookup of stored plans, not a global pair scan or a shuffle simulation.

| Available directed plans | 6.742 | Candidate 6.743 |
| --- | ---: | ---: |
| Full beatmatch | 1 | 1 |
| Partial rhythmic | 1 | 1 |
| Clean desktop | 2 | 4 |
| Newly enabled clean iPhone | 0 | 0 |

New clean desktop pairs: Gilgamesh → Eva (2.339 s original overlap) and Kid Yugi x Lil Peep MASHUP → Eva (1.100 s). Both start the incoming ORIGINAL at zero, unity gain and native speed; outgoing original runs through EOF. These are clean junctions, NOT full/partial beatmatches. Band masking, original PCM rendering at 44.1/48 kHz and native decoder checks pass; human listening remains necessary. The second source → Sono Ok was rejected: only 0.25 s meaningful introduction, below unchanged 0.75 s requirement.

## Actual bugs and repairs

* An unverified Safari fallback played an incoming intro low-passed at 260 Hz and at most 9% level, then consumed roughly 5.45 s at native handoff. The actual Ste Gilgamesh → La mia storia tra le dita plan is archived. It can no longer count this filtered teaser as an already heard original intro. The existing measured quiet-tail handoff starts at zero instead.
* Fresh native elements can remain paused in desktop WebKit's iPhone path. The narrow quiet-boundary continuation drains the source pause acknowledgement and reuses its already authorized primary element. Manual Pause, changed queue and changed track retain priority. No second-player mobile overlap is enabled.
* A tick at natural EOF could treat the source's automatic paused state as a cancellation and destroy the incoming already playing. It now claims an owned live transition before ordinary paused cleanup; duplicate EOF cannot advance the queue twice. Manual pauses and changed queues remain cancellations.
* A clean-intro validator treated an original 5.356 dB bass rise as an application volume jump. V3 verifies original versus mixed RMS at identical EOF windows and bounds additional change by the independently measured quiet-source peak. No global level, clipping, voice, content or rhythm threshold is loosened; legacy V2 remains unchanged.

## Verification

Full candidate unit regression: 792/794, same two historical failures exposed, no skips. Targeted new contracts pass. Run 45289802549: native source6→Eva twice on each Linux/macOS Chromium/WebKit (8 cases), plus four actual-app native phone-path cases. Source and incoming use original Git-identified MP3s; EOF adoption retains the same incoming element and its progressed clock. Desktop WebKit with an iPhone user agent is NOT a physical iPhone test.

Final installed-index release workflow, offline worker 6.742→6.743 and public deployment evidence must be completed before reporting publication. Keep PR59 draft. Experimental cadence code and prototype dual-player mobile modes are excluded.

No MP3 downloads, playlist, library, favorites, account or personal preference data are modified. Worker changes are versioned shell URLs only. Preserve the preceding main commit as rollback; revert only this isolated release merge if required.

## Remaining

Only one full Ste beatmatch remains available. New full/partial work needs independently supported rhythm/phrase/harmony windows; clean junction growth is not its substitute. The user's physical Gilgamesh→Sono Ok prototype failure was traced to a readiness timeout before any incoming request. A corrected private prototype awaits a new device report and is not enabled publicly. Physical Safari/PWA background/lock-screen and auditory confirmation remain outstanding.
