# Isolated physical iPhone procedure — not an application release

No iPhone capability is enabled in Music Box 6.742. These files test one
already existing Ste clean junction, Gilgamesh -> Sono Ok, and never modify
account state, cache, downloads, playlists or the production player.

1. Pause Music Box. Use moderate device volume. Keep the PC and iPhone on
   the same trusted local network. From the research repository run:
   `node tools/ste-clean-probe-server.cjs audits/ste-factored-clean-20261123/recordings.json 0.0.0.0`.
   Only the whitelisted probe code and SHA-checked frozen original files
   are served; the server has no write API or generic filesystem route.
   Do not change firewall rules or expose the port to the internet. If LAN
   access is unavailable, stop; the test has not been performed.
2. Open `http://<PC-LAN-IP>:8765/observed` in physical Safari. This is a
   separate HTTP diagnostic, not the installed PWA or a secure-context test.
   Enter iPhone model/iOS version if known.
3. Tap the FIRST button once. A short fragment of Sono Ok is expected:
   this primer is intentionally audible and is NOT production-ready UX.
   Original Gilgamesh must not play or restart during this preparation.
4. Once ready, tap the SECOND button. The original source starts just
   before the frozen cue. Check the incoming intro is audible from its
   beginning, the outgoing ending is preserved and nothing restarts.
   The SAME secondary element continues through EOF and automatically
   pauses after the bounded diagnostic preview. Save the JSON report.
5. Repeat from a fresh probe: during overlap drag/seek is only an automated
   control here (not app UI); separately hide Safari during overlap, then
   immediately after source EOF. The secondary must stop and stay stopped;
   hiding before EOF must not restart the source. Save each outcome with
   a note of perceived audio, interruption and any system playback prompt.
6. Stop the local server with Ctrl+C. No downloaded Music Box music or user
   state should need deleting, clearing, resetting or importing.

The JSON records operator-declared device information but deliberately keeps
physicalIPhone:false and notPlaybackCertified:true: collecting a report does
not automatically establish device authenticity or musical certification.
Human observation and review must accompany it. Desktop tests with mobile UA
or simulated visibility cannot replace these observations.

Passing this separate page is only a prerequisite. Installed PWA HTTPS,
AudioSession/MediaSession, actual queue/seek/cancel, offline originals and
background resumption still need an isolated application-stage validation
before changing the production iPhone guard. Do not call this procedure a
7/7 iPhone certification or a new full/partial transition.
