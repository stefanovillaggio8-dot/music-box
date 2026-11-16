# Riproduzione e limiti degli esperimenti

Eseguire dalla radice della repository. Non avviare browser locali su questa macchina: i workflow CI eseguono le prove Chromium/WebKit.

```text
node --test tests/personal-mix-isolation.test.cjs tests/personal-audit-scope.test.cjs
node tools/simulate-library-listening.cjs --personal-only=true --exclude-playlists=Ste:gym --only-profile=Ste --only-mode=shuffle --sessions=20 --steps=40 --output=SHORT.json
node tools/simulate-library-listening.cjs --personal-only=true --exclude-playlists=Ste:gym --only-profile=Ste --only-mode=shuffle --sessions=1 --steps=800 --continuous-shuffle=true --output=CONTINUOUS.json
```

Per il confronto usare la stessa versione del simulatore su entrambi i checkpoint e i sorgenti `app.js` / `mix-intelligente.js` estratti dalla baseline con `--app=... --engine=...`. Libreria, indici e seed devono essere gli stessi. Il simulatore rifiuta selezioni esterne al pool, esporta gli ID autorizzati e registra separatamente ogni coppia distinta e la classe realmente utilizzata dal planner.

I programmi in `experiments/` sono **ricerca offline, non produttori di certificati installabili**. Riprodurre il layout di lavoro `../ste-focus-20261116` e i dati preesistenti `../personal-20261116`, `../whole-structure-ci`, `../profile-coverage/cloud-edges`, `../original-mp3`, `../models`. I JSON compatti di questo audit non contengono i grandi posteriori/PCM dei workflow precedenti; senza quegli artefatti non è riproducibile la ricerca dei candidati. Le impronte dei risultati e il campione fissato prima dell'inferenza permettono di verificare cosa è stato usato.

`probe-leading.py` decodifica con ffmpeg gli originali verificati tramite Git blob SHA, con due processi al massimo. `select-model-sample.cjs` congela le 48 chiavi prima di `probe-second-model.py`; quest'ultimo usa al massimo due thread Torch e il modello `final1` esplicitamente verificato tramite SHA-256. Nessun modello viene distribuito nell'app. `probe-ensemble.py` riutilizza i posteriori salvati, senza nuove inferenze. I prototipi `probe-*.cjs` modificano soltanto copie in memoria del produttore e scrivono risultati nello staging; non toccano l'indice o le appartenenze del prodotto.

`render-rejected.py` produce campioni locali `../ste-focus-20261116/rejected-audio/REJECTED-*.flac` e un rapporto. Tutti e quattro sono respinti da `dj-rendered-rhythm.py` a entrambe le frequenze. Possono essere ascoltati per annotare riferimenti indipendenti; il loro ascolto non autorizza da solo una promozione, né la loro semplice esistenza certifica una transizione. I file audio non sono pubblicati né aggiunti a `dj-mixes`.

Nessun test cancella download, cache del dispositivo o dati personali. Le cartelle temporanee dei test vengono create appositamente e verificate prima della rimozione.
