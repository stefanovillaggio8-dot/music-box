# Music Box su Discord Desktop

Il collegamento mostra titolo, artista e durata del brano su Discord normale
per Windows. Non richiede bot, password, token o Spotify Premium.

1. Apri l'app Discord Desktop sul PC.
2. Installa Node.js LTS da https://nodejs.org se non è già presente.
3. Apri https://discord.com/developers/applications, premi New Application,
   chiamala Music Box e copia il suo Application ID (NON il client secret).
4. Apri la cartella del progetto Music Box sul PC e fai doppio clic su
   tools/avvia-discord-presence.bat (o esegui dal progetto
   node tools/discord-presence-bridge.cjs).
5. Nel sito Music Box, apri Amici online > Discord, lascia attivo
   Mostra su Discord e incolla l'Application ID.
6. Avvia un brano. In Discord verifica Impostazioni utente >
   Privacy attività > Condividi la tua attività.

Il ponte ascolta solo su 127.0.0.1:8792 e non espone la rete Wi-Fi.
Quando cambi brano aggiorna titolo/artista/tempo; quando metti in pausa
rimuove il brano. Se il browser si interrompe, dopo circa 25 secondi di
silenzio il ponte elimina lo stato. Nessuna credenziale Discord viene salvata.

Se non funziona:
- Ponte non raggiungibile: avvia il .bat. Tieni aperta la finestra del ponte.
- Discord Desktop non trovato: avvia Discord Windows, non solo Discord Web.
- Stato assente: controlla Application ID e Condividi la tua attività.
- Se Chrome chiede l'accesso ai dispositivi sulla rete locale, consenti solo
  dalla pagina Music Box.
- iPhone con PC spento: non supportato dal collegamento locale.
