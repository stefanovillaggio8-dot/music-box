# Isolated candidate 6.741: second clean desktop junction for Ste

Based on main 5346215d, preserving 6.740, phrase-only karaoke, session
restoration and all account/download data. This branch does not merge PR59.
Rollback base: 5346215dde955ab213063372d47ddcb185ed1260.

Adds exactly one original-SHA-bound index record: Gilgamesh -> La mia storia
tra le dita. It is a natural, non-beatmatched 2.339-second junction. Source
unity gain through native EOF; incoming original MP3 at zero/native speed,
normal listening gain, same native element retained at adoption. No intro
seek, phase splice, time stretch, extra DSP or phone model is introduced.

Original render: both 44.1/48 kHz, overlap peak <=.608134, four-times
oversampled peak <=.646905, EOF .5s RMS change +.4465 dB including original
dynamics. 2.25s meaningful incoming introduction; no sustained masking by
the existing multiband screen. Native prefix: eight measurements spanning
Linux/macOS x Chromium/WebKit x 44.1/48 kHz. The source's previously measured
quiet-tail receipts are reused per recording, with conservative channel RMS
bounds, without re-rendering already rejected pairs or scanning the catalog.

Two false negatives addressed: native target clocks with container-declared
23.020833ms priming are recognized WITHOUT seeking, and validated late native
clean cues cannot be replaced by an attenuated generic preview. V1 rules,
full/partial criteria and all iPhone refusals remain intact. A new v2 cue
requires both original renders and all eight native receipts.

Actual-app SHADOW run 45186235079 passes four native combinations: incoming
starts at zero, old source reaches EOF, same incoming element remains at
unity gain/rate. Release CI must additionally test this INSTALLED index,
without shadow injection. No human listening or physical iPhone verification
has occurred. No iPhone improvement is claimed; separate mobile-UA probes
are NOT release assets and failed controlled experiments stay in PR59.

Published Ste baseline: 1 full / 1 partial / 1 clean desktop / 0 new clean
iPhone. Candidate: 1 / 1 / 2 / 0. Four distinct stored personal Ste pairs,
no Gym or other-account research. Full/partial availability is unchanged.

The two historical missing-plan/future-selection failures remain visible;
no tests are disabled or fixture expectations lowered. Report full-suite
results against that baseline, and do not describe a partially failing suite
as entirely passing. Browser, phrase, offline upgrade and preservation checks
must finish before any publication. Service-worker changes ONLY shell
revision/asset URLs; exact 6.740 worker supplied for the upgrade regression.
