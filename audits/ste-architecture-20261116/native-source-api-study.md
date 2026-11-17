# Indagine successiva alla pubblicazione 6.735: dominio temporale del decoder

Solo ricerca nella PR #59, senza cambiamenti al player pubblico. Le raccolte sono di **AudioContext.decodeAudioData**, non dell’uscita di HTMLMediaElement. Nessun test fisico iPhone è stato eseguito. Nessun lag viene applicato al mix e nessuna nuova transizione è certificata da questo documento.

Acquisizioni `43991943866` (track-6) e `43993307229` (controllo track-4): tre processi per ciascun originale, Chromium/Linux, WebKit/Linux e WebKit/macOS Intel; entrambi **3/3**. I job di playback ordinario sono deliberatamente saltati nella modalità forense: questi risultati non sono matrici 7/7 del lettore.

Entrambi i brani appartengono alla libreria personale Ste, verificata al momento della raccolta. Gli originali sono verificati con Git blob SHA e SHA-256; ciascuna finestra interlacciata stereo float32 riporta impronta, frame iniziale e finale naturale. Non c’è separazione, stretch, gain o ricerca di lag nel segnale acquisito. Gli artifact binari sono conservati localmente nel workspace; nel repository sono salvati solo metadati e misure.

Per ogni frequenza (44,1 e 48 kHz) il confronto usa tre finestre prefissate di mezzo secondo, a 0,5, 5 e 10 secondi dall’inizio della finestra esportata. Sono controllate identità e dimensioni degli artifact; il riferimento è la decodifica ffmpeg dello stesso MP3. Non è un benchmark musicale indipendente: i brani erano già usati nello sviluppo, mentre l’ipotesi di decoder formulata sul primo viene verificata separatamente sul secondo.

A 44,1 kHz i confronti nominali Apple hanno correlazioni circa 0,195/0,225/−0,078 sul primo brano e −0,242/−0,498/−0,165 sul secondo. Un’ipotesi **fissa**, formulata prima del secondo controllo, di 529 campioni alla frequenza originale coincide quasi esattamente su entrambi. A 48 kHz il residuo del ricampionamento non è zero. Su Linux le correlazioni nominali sono invece prossime a uno; lo stesso spostamento ipotetico le peggiora. Non si ricava un offset ottimizzato per ciascuna coppia.

La conclusione supportata è limitata al dominio temporale di `decodeAudioData` su questi due originali senza indice MP3. La durata uguale non prova la fase della forma d’onda. **Non è ancora dimostrato che HTMLMediaElement adotti lo stesso spostamento**: usare queste acquisizioni per correggere il clock del player sarebbe prematuro. Il nuovo candidato resta escluso, i mix pubblicati restano quelli già verificati nelle prove reali. Il passo successivo richiede una misura separata del segnale realmente emesso dal lettore e del passaggio al buffer, mantenendo distinti clock, ricampionamento e ritardi del grafo audio.

È stata anche esaminata l’introduzione di Sono Ok, che viene difficilmente scelta nelle sessioni brevi. L’analisi forte individua l’attacco a 1,4 secondi, mentre il PCM mostra un crescendo non nullo prima dell’attacco. Quella porzione non viene trasformata in silenzio da tagliare per superare la selezione. `preserved-crescendo-control.json` conserva i picchi stereo ogni 100 ms. Un eventuale ingresso anticipato sul crescendo deve essere progettato come sovrapposizione conservando l’introduzione e poi verificato su voce, armonia, livello e rendering; non è autorizzato da una semplice variazione della soglia.

Riproduzione dei confronti:

```text
PYTHON tools/compare-native-source-window.py --captures=ARTIFACT_DIRECTORY --original=SHA_BOUND_ORIGINAL.mp3 --output=comparison.json
```

Raccolta successiva, manuale e soltanto sul branch di sviluppo:

```text
gh workflow run composite-browser.yml --ref audit-karaoke-beatmatch-20261113 -f forensic_source_capture=true -f forensic_source_key=audio/songs/track-4.mp3
```

Il programma rifiuta registrazioni fuori dalla libreria Ste, originali con hash diverso, output già esistenti, finestre illimitate e campioni non finiti. Non modifica originali, download, cache, playlist o preferiti, e non installa modelli sul telefono.
