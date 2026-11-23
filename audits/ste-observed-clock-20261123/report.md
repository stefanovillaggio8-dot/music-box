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
