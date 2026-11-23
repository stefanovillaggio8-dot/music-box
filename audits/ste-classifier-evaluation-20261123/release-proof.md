# Candidate 6.740: one distinct native clean ending for personal Ste

Isolated from main b0b4f34a; does not merge PR59. Only one audio-index entry
gains a new plan: Gilgamesh -> Sono Ok. All prior entry properties and every
other recording are preserved. The category is `nativeCleanTail`, not full
beatmatch or partial rhythm. Existing full/partial availability stays 1/1.
This adds one automatically verified DESKTOP clean junction, not an iPhone
mix and not a claim of subjective DJ/Spotify quality.

Original source plays at its normal gain through native EOF. Incoming plays
from zero, rate one, normal listening volume; the SAME native element is
adopted at EOF. No low-pass intro, FLAC/MP3 switch, reloading or incoming seek.
Original source EOF is retained even with codec priming/padding. The native
single-decoder route avoids Apple's independently FAILED offline/native
splice; it does not pretend that phase test passed.

Original native tail RMS <=.000037175 in every 20ms frame across both native
backends/platforms/rates; peak <=.000152588. Incoming overlap peak <=.376107.
The conservative summed peak is <.377, without attenuation or limiting.
Reference evaluation has no sustained multiband masking, 1.5 seconds of
meaningful measured introduction and EOF RMS change +1.509 dB including
original dynamics. Source/target entry and envelopes remain intact.
The eight-second vocal-conflict negative and the energetic Grignani ending
are rejected. Full-beat/key/voice/tempo criteria are unchanged.

Actual-app shadow run 45168978967: four successful Chromium/WebKit runs on
Linux and macOS. Original source ended before adoption; incoming played
from zero at native volume, same element, no incoming seek. The release
workflow independently repeats this on the INSTALLED release index, without
shadow injection. Physical iPhone and human musical listening are not done.

iOS cannot select the new class and retains existing safe playback. Its
native-adoption restrictions are unchanged. Karaoke assets remain byte-for-
byte identical to main: full phrases only. Session restoration, personal
libraries, manual queue guards, downloads and favorites are preserved.
Service worker changes only the application-shell revision and matching
asset URLs. No download cache name, deletion rule or database migration
changes. Previous production commit b0b4f34a remains the rollback base.

Full-suite results must distinguish pre-existing revoked historical-fixture
failures from regressions. Baseline PR59 CI 45148548690 already fails the
missing historical bass-pair and its future-selection assertion; these
unrelated tests are not suppressed, restored as unsafe mixes, or retuned.
No new music research is performed for their profiles/playlist.

Remaining: broader held-out Ste validation, truly new full beatmatches,
musical listening, and a separately proven iPhone-compatible route. This
release does not change Karaoke alignment or certify future unanalysed songs.
