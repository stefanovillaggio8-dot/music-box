# Prove karaoke offline

Questi strumenti non sono caricati dal lettore. Richiedono Node 22+, ffmpeg e ambienti Python separati; tutti i modelli pesanti restano sulla macchina di analisi. Non pubblicano, non modificano MP3 e non toccano gli archivi dei dispositivi.

Il manifest contiene soltanto registrazioni originali, lingua e testo con tempi di **frase** già disponibili:

```json
{"records":[{"id":"b-track-7@GIT_BLOB_SHA","file":"/percorso/originale.mp3","audioSha256":"SHA256_MP3","language":"en","rows":[{"t":1.2,"text":"the actual first phrase"},{"t":6.4,"text":"the actual next phrase"}],"windows":[0,24,48]}]}
```

Usare tutte le righe LRC originali, ordinate per ancoraggio; mai timestamp umani di parola, tempi interpolati o testi ASR al posto della LRC. Ogni finestra è di 28 secondi; massimo 30 finestre per richiesta. L'allineatore CTC di questo checkpoint supporta soltanto inglese. Non inferire l'accuratezza sull'italiano da questi risultati.

Preparazione: l'ambiente di separazione contiene Spleeter 2.4.2, TensorFlow CPU 2.15.1, NumPy 1.26 e soxr; quello di allineamento contiene torch/torchaudio CPU compatibili e NumPy. I tre file Spleeter sotto `MODELS/pretrained_models/2stems` e il checkpoint wav2vec2 sotto `MODELS/torch/hub/checkpoints` devono già esistere. Gli SHA attesi sono espliciti nel produttore; il manifest `checkpoint` Spleeter deve risolvere realmente i pesi preaddestrati. Un file mancante o diverso viene rifiutato.

```text
PYTHON_SPLEETER tools/build-karaoke-acoustic.py --manifest=manifest.json --models=MODELS --work=ctc-work --phase=separate
PYTHON_TORCH tools/build-karaoke-acoustic.py --manifest=manifest.json --models=MODELS --work=ctc-work --phase=align
node tools/build-karaoke-acoustic-index.cjs --manifest=manifest.json --observations=ctc-work/observations.json --output=STAGING
node tools/precompute-karaoke-rows.mjs --manifest=manifest.json --work=asr-work --cache=ASR_CACHE --runtime=TRANSFORMERS_NODE_MODULE --proof-index=STAGING/karaoke-acoustic-index.json --output=asr-work/timed-rows.json
node tools/build-karaoke-acoustic-index.cjs --manifest=manifest.json --observations=ctc-work/observations.json --timed=asr-work/timed-rows.json --output=STAGING
```

`TRANSFORMERS_NODE_MODULE` è il percorso assoluto al modulo Node di Transformers.js 3.8.1. Il precomputo vincola Whisper Tiny alla revisione indicata nel sorgente, con encoder fp32 e decoder q4, e usa due thread CPU. Esegue lo stesso allineamento e l'effettivo salvataggio/ricaricamento dell'app. La cache ASR lega registrazione, finestra, revisione, dtype e metodo; la cache CTC lega PCM vocale e pesi. Il modello non riceve tempi di parola di riferimento.

Le righe con sola stima visiva sono escluse dall'esportazione. Le prove CTC richiedono anche una parola ASR liberamente riconosciuta nello stesso intervallo; l'ultimo carattere senza separatore osservato non certifica la fine della parola. Le righe parziali mantengono almeno quattro parole verificate. Registrazioni senza osservazioni eleggibili non entrano nell'indice.

Prima di copiare gli artefatti da STAGING nella PR verificare hash, benchmark indipendenti, conservazione dei tempi precedenti e test browser. L'esportazione conserva soltanto indici e tempi, non i modelli o gli stem. Gli asset precedenti non vengono cancellati automaticamente: questo comando non è uno strumento di pulizia degli archivi offline.

Test del nucleo:

```text
node --test tests/karaoke-acoustic-proof.test.cjs
PYTHON_TORCH tools/test-karaoke-ctc-boundaries.py
```

Le prove Chromium/WebKit si eseguono nel workflow CI `composite-browser.yml`. Non certificano un iPhone fisico. Il manifest deve avere almeno tre frasi utilizzabili per attraversare il salvataggio applicativo.


L'opzione offline `--ctc-corroborator=base` aggiunge un solo passaggio di Whisper Base a 28 secondi per finestra. Le sue osservazioni corroborano soltanto confini CTC già misurati, dopo i passaggi Tiny e CTC precedenti; non forniscono direttamente tempi al karaoke. Revisione e dtype sono vincolati nel produttore e nella prova esportata. Il telefono riceve solo JSON, senza caricare Base. Il precomputo ricarica inoltre le righe già esportate, anche fuori dalle nuove finestre, e rifiuta l'esportazione se un intervallo precedentemente accettato viene perso o spostato.

Il benchmark accetta `--ctc-corroboration-report=REPORT_BASE` per confrontare questo stesso ordine di proposte e salvataggio, mantenendo i contesti Tiny originali. Gli hash degli MP3 e delle osservazioni devono corrispondere; non si possono miscelare revisioni arbitrarie. Un miglioramento sul campione di sviluppo non dimostra un miglioramento su nuovi brani: congelare la scelta del campione indipendente prima dell'inferenza e riportare anche gli esiti senza guadagni.
