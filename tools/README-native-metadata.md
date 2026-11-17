# Recupero dei metadati MP3 nativi

Il percorso corregge una durata nativa inutilizzabile osservata in WebKit/Linux. Dopo 600 ms di metadati ancora provvisori, controlla il file originale tramite SHA-256 e costruisce in memoria una rappresentazione con indice MP3. Non riscrive gli originali, IndexedDB o Cache Storage. La rappresentazione deve produrre **gli stessi campioni**, alle due frequenze, sia in Chromium sia in WebKit.

L'operatore prepara una lista JSON di chiavi di registrazione realmente problematiche, senza selezionare coppie musicali:

```text
PYTHON tools/build-mp3-metadata-repairs.py --index=dj-deep-analysis.json --keys=keys.json --cache=ORIGINALS --work=STAGING --output=candidates.json
```

Il produttore offline conserva i payload dei frame originali e verifica l'identità PCM con ffmpeg a 44,1 e 48 kHz. I candidati restano disabilitati (`browserVerified:false`). Il workflow `composite-browser.yml` esegue `tests/native-metadata-pcm.cjs` nei due decoder reali e pubblica `native-metadata-pcm.json` per ciascuno. Il test confronta i campioni dell'originale e della rappresentazione; la differenza ammessa è zero. Le prove browser si eseguono in CI.

Solo dopo quelle prove, il compilatore abilita i candidati corrispondenti:

```text
node tools/apply-native-metadata-proofs.cjs --candidates=candidates.json --proofs=NATIVE_RECEIPTS --output=STAGING/native-mp3-metadata.json
```

Richiede entrambi i browser e le due frequenze, senza duplicati, con identità dei file e numero di frame corrispondenti. Un singolo browser, un frame in più, un hash diverso o una differenza PCM anche minima impediscono l'abilitazione. Nessuna riparazione viene abilitata da un semplice aumento della durata riportata.

Il lettore usa soltanto il piccolo indice verificato. Il recupero è inattivo su iPhone, Android, macOS e Chromium. Su Linux controlla sia la piattaforma nativa sia lo user agent, perché un backend Linux può esporre uno user agent compatibile con Safari macOS. Un iPhone emulato resta escluso.

Seek e cambio sorgente annullano i lavori pendenti; il passaggio in background li sospende. Pausa e intento di riproduzione sono preservati. Il normale handler `loadedmetadata` conserva l'eventuale seek iniziale. L'URL temporaneo della rappresentazione viene mantenuto soltanto per il brano corrente e rilasciato al successivo cambio di sorgente. I brani con metadati già utilizzabili non richiedono download aggiuntivi o listener persistenti.

I test del lettore originale rimangono distinti dalle opzioni diagnostiche che alterano la fixture. I confronti finali devono lasciare `metadata_prefix_probe` e `native_unique_url_probe` disattivati: l'eventuale recupero deve avvenire attraverso il codice reale dell'app. Un servizio audio virtuale nel runner Linux fornisce un dispositivo funzionante; non certifica un iPhone o un'uscita fisica.
