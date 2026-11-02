# Music Box for iPhone (free sideload build)

This folder contains a small native iOS shell for the existing Music Box website. It opens the current website full-screen in a WKWebView, enables the iOS background-audio capability, and forwards lock-screen media controls to the website player.

## Build (automated, no Mac required locally)

1. Open the repository's **Actions** tab.
2. Select **Build free iPhone app (unsigned IPA)** and open the latest successful run.
3. Download the `MusicBox-unsigned-IPA` artifact. The ZIP inside the artifact is named `MusicBox-unsigned.ipa` after extraction.
4. On Windows, download Sideloadly from its official site: https://sideloadly.io/
5. Connect the iPhone by USB, choose the IPA in Sideloadly, and sign/install it with your own Apple Account. Do not send your Apple Account password to anyone in chat.

## E scaricabile gratis?

Sì: il repository include una procedura GitHub Actions che genera automaticamente un
**MusicBox-unsigned.ipa** per iPhone. Non è un'app dell'App Store e non servono i 99 dollari
annui dell'Apple Developer Program per provarla personalmente.

- Apri [Actions → Build free iPhone app (unsigned IPA)](https://github.com/stefanovillaggio8-dot/music-box/actions/workflows/build-ios-ipa.yml).
- Apri un'esecuzione completata con successo e scarica `MusicBox-unsigned-IPA` nella sezione *Artifacts*.
- Decomprimi lo ZIP, poi usa [Sideloadly](https://sideloadly.io/) su Windows o macOS per firmare
  e installare il file IPA sul tuo iPhone con il **tuo** Apple Account.
- Con un account gratuito la firma va rinnovata entro 7 giorni. L'aggiornamento
  automatico di Sideloadly dipende dalla disponibilità del PC e della connessione.
- L'app web già installata sulla Home e la nuova app nativa utilizzano archivi locali
  separati: esegui un backup/esporta i dati non sincronizzati prima del passaggio.

**Limite tecnico importante:** questa versione dell'IPA integra il sito in WKWebView,
con modalità audio in background e controlli media nativi. **Non** integra ancora un
motore DJ in AVAudioEngine: non garantisce mix sovrapposti a schermo bloccato. Il mix
armonico migliorato in v6.519 riguarda anzitutto il player PC/web.

## Free-account limitation

The IPA is unsigned because this repository does not hold any Apple signing keys. Sideloadly signs it on your computer. With a free Apple Account, Apple provisioning normally expires after 7 days; the app must be refreshed/re-signed periodically. Sideloadly describes its auto-refresh feature in its FAQ, but the PC must be available and the phone reachable for refresh. An Apple Developer Program membership is only needed for the paid distribution options and is **not** needed to try this personal sideload route.

Official Apple information:
- https://developer.apple.com/programs/
- https://developer.apple.com/help/account/basics/about-your-developer-account/

## Important notes

- This is a native container around the live website, not an App Store release.
- Music and the current web UI still come from the live GitHub Pages site, so an internet connection is needed.
- The native app's WKWebView uses its own web storage, separate from Safari. Local-only favorites, playlists, imported files, and other browser-stored data may need to be exported/imported separately.
- This build enables the iOS background audio mode and adds native lock-screen controls, but the actual screen-locked behavior must still be tested on a physical iPhone. iOS changes and WebKit limitations may require further adjustment.
