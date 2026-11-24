# New isolated native-clock study, not an iPhone release

Resume 40684cf0 completes the interrupted 6.741 checkpoint. Current study
is only the retained Gilgamesh -> Sono Ok Ste pair, no new pair scan, model
inference, beat certificate or production enablement. Existing 6.741 remains
1 full / 1 partial / 2 clean desktop / 0 newly enabled clean iPhone.

The old fixed-100ms priming and post-play-promise polling experiments are
not repeated. V2 primes ONLY incoming under the first gesture and observes
actual readiness; original source first plays under the second gesture.
Its clock loop begins immediately, independently of the play() promise.
Launch lateness stays <=80ms, entry zero, known container clock, original
native EOF and same incoming element. Seek/hidden stop the secondary without
restarting the source. A delayed incoming promise cannot resurrect it.
Two gestures and a short primer fragment mean this is not product-ready UX.

Run 45234370888: 12/12 controlled browser trials, Linux/macOS x Chromium/
WebKit x natural/seek/hidden. Windows Chromium preliminary 3/3. Synthetic
late-promise, changed-clock and cancellation contracts 3/3. Desktop mobile
UA is NOT physical iPhone; no real AudioSession/PWA/MediaSession integration
or human audibility is certified. The app's iOS adoption refusal remains.
These pass results do not establish which single factor caused the old
failures, because the new protocol changes both priming and clock observation.

Next: separately test a genuinely silent native primer and source changes,
then physical Safari/PWA behavior, before any in-app iPhone enablement.

## Additional terminal-lifetime controls

The isolated secondary must stop even when visibility changes AFTER source
EOF/adoption; completing a bounded preview also invalidates late play
promises. A late primer promise cannot restart a cancelled second deck.
Five deterministic contracts pass; Linux Chromium/WebKit and Windows
Chromium pass the real hidden-after-adoption control. These extend the
prototype, never the public iPhone path. Downloadable JSON and a physical
checklist are provided without writing Music Box state.

Windows WebKit 27.2 FAILED before original playback: source metadata duration
161.16s is neither declared raw nor gapless clock, so bounded readiness stops
with original plays=0 (no source play events) and both elements paused. Do
not add a fitted offset or widen the 2ms container-clock tolerance. This does
not prove a permanent decoder incompatibility: metadata was observed BEFORE
the original's first play and might be provisional. A genuinely different
future protocol could study clock refinement after trusted original playback,
but must preserve source identity and cancellation. It is not a successful
hidden-after-adoption case, nor a regression in production Music Box.

Latest platform completion/cancellation is saved in terminal-status.json.
The browser harness also fails if all cases are skipped or no browser runs;
an empty report is never a successful acoustic control.
