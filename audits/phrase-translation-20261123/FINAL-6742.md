# Published 6.742 / exact continuation checkpoint

Interrupted 6.741 save was completed at 40684cf0, including recovered merge
25402c99. PR73/6.741 was already live; it has not been republished as new
musical work. User explicitly confirmed phrase-only Karaoke in this chat.

Only isolated PR74 was published for 6.742, merge
b55e3e0ab7b2d6feb74af52503a3ea3b3ff0a313. Pages 45242203944 succeeded.
published-6742-proof.json binds six public assets byte-for-byte and ten
protected files to the actual merge parent (including current personal
state, not an old snapshot). Download handling has no new deletion or
migration logic. Rollback: revert ONLY this release merge, never reset main
or restore stale personal statistics. PR59 remains draft, unmerged.

Fixed six translation failures reproduced on 6.741: same-count lyric edits
reused wrong text; capped 60-of-61 results repeated 60 calls; identical
choruses repeated calls; late failures modified the next song's controls;
requests continued after view/track changes; entities appeared literally.
Exact phrase identity, deduplication and cancellation fix those cases.
Source/translated phrases remain text; no markup injection or word modes.

Measured before/after: 0/6 -> 6/6 regression cases; 60 -> 0 repeated capped
requests, 3 -> 2 for a three-line repeated-chorus fixture. These are mocked
provider tests with zero actual service calls, NOT semantic translation or
acoustic-accuracy benchmarks. No new timestamps or language model installed.

Candidate full suite 782/784, same two historical rhythmic-tail/missing-plan
failures as 776/778 before the six new cases. They remain visible/red, not
suppressed or presumed intentional. Native installed original Ste controls
8/8 (Linux/macOS x Chromium/WebKit x two retained clean directions).
Four include a pending translation and continuous outgoing-phrase sampling
through original EOF: no premature next lyrics, same entering native audio
element, entry zero, unity gain/rate, obsolete request absent at adoption.
Phrase/translation DOM, Immersive, exact WebKit worker 6.741 -> 6.742 upgrade,
volume and existing audio regressions pass. Archived CI artifacts are in ci/.
44/44 targeted checks pass after bringing public main BACK into research.
Only HTML merge conflict was resolved: research audio revisions 6/18 retained,
public app/mix revision 6742 adopted; research worker URLs agree. Production
keeps its own separately tested audio revisions 5/14. No content overwrites.

Ste-only stored-plan lookup, no pair scan or shuffle simulation:
222 personal recordings; 1 full / 1 partial / 2 clean desktop / zero newly
enabled clean iPhone. No increase since 6.741. Main index unchanged.

Musical work: see ../ste-voice-harmony-preflight-20261123/report.md. One
Kid Yugi direction, two cached window hypotheses; only the short window
independently rendered at declared/native tempo. Four constant-gain renders
reject a pre-existing original-master overshoot. Existing shared lookahead
gives two safe diagnostic renders, but rhythmic agreement remains 4/7 or
2/7 with no confirmed bars. Harmony uncertain; no new certificate invented.

iPhone: isolated incoming-only primer/observed-clock study 12/12 previous
Linux/macOS controlled trials, no production activation. Additional cleanup
fixes close the second deck on hidden AFTER adoption and late play promises.
Five unit contracts and Linux actual browser edge controls pass; Windows
Chromium passes, Windows WebKit refuses its unsupported source clock before
starting original audio (161.16s duration, readiness timeout), not silently
accepted. Latest macOS edge status is recorded separately. No physical iPhone,
human listening or actual Safari/PWA background session certification.

Next exact point: inspect that isolated edge run and preserve its failures;
physical Safari/PWA proof before iPhone enablement. For new Ste beatmatches,
obtain independent rhythm/tonality evidence or a structurally different safe
window; do not repeat the frozen Stratos/Eva geometry with looser detectors.
Keep Kid Yugi priority, other accounts/Gym out of new musical research.
