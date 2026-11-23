# Isolated 6.742 candidate: phrase translation correctness

Not a merge of PR59. Preserve 6.741 Smart Mix, its 1 full / 1 partial / 2
clean desktop / 0 newly enabled iPhone clean directions. No musical index
or audio processing changes; engine diagnostics version string only.

Fixes demonstrated against 6.741 by six failing regression cases: stale
same-count corrected lyrics; 60-of-61 cache always refetched; repeated
identical complete phrases requested repeatedly; obsolete failures change
new-song controls; missing network cancellation; literal HTML entities.
All six pass after the change. Translation remains explicitly user-requested,
limited to 60 phrases / 4700 characters / 450 per phrase; no automatic third-
party calls, new provider, word highlighting or on-device alignment model.

Exact requested phrase snapshots identify the cache and reuse partial capped
successes. Repeated identical lines reuse one result while preserving order.
An AbortController and guards after every await protect track/view identity.
Close/reopen and missing next-track lyrics cancel obsolete network work.
Decoded entities remain textContent, never executable markup.

Windows Chromium/WebKit actual DOM with MOCKED provider pass, no real service
calls: repeat capped requests 60 -> 0; repeated three lines 3 -> 2; edited
text correct; two pending requests aborted; no word-model requests. Existing
phrase-display/Immersive checks both browsers pass. Actual original native
Gilgamesh -> Sono Ok handoff with controlled phrases and pending translation
passes Windows Chromium; Linux/macOS installed regression must follow.
No human translation-quality, acoustic-accuracy or physical-iPhone claim.

Candidate CI must check normal player, phrase/translation browser flows,
original native handoff and exact 6.741 worker upgrade retaining saved music,
personal state and unrelated storage. Existing two historical missing-plan
failures remain visible, not suppressed. Rollback is a revert of the isolated
release merge, preserving all newer user-data commits. Previous production
6.741 remains available in history. No speculative performance or library
changes; the scope is translation correctness/cancellation only.

Full local candidate suite: 782/784; the same two historical failures.
Exact WebKit 6.741 -> 6.742 upgrade and offline-retention checks pass.
