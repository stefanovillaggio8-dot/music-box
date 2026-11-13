# Karaoke: evidenza parziale senza inventare parole

Stesso corpus precedente: 590 occorrenze in 9 finestre di 5 brani inglesi, con gli stessi audio, modello, dtype e chunk ASR. Le SHA degli audio sono controllate prima di riutilizzare la cache. I timestamp manuali servono soltanto alla valutazione.

I 65 timestamp già accettati da frasi complete restano invariati. Si recuperano **70 parole ulteriori**, appartenenti a sequenze contigue esatte e distintive, uniche nel testo e nel tratto riconosciuto, con occorrenze ASR riservate contro il riutilizzo. Parole mancanti, ambigue e durate irrisolte oltre 800 ms non ricevono un tempo stimato.

| Misura | Prima | Dopo |
|---|---:|---:|
| Parole accettate acusticamente | 65/590 (11,02%) | **135/590 (22,88%)** |
| Mediana assoluta inizio/fine | 58,08 / 73,14 ms | **57,71 / 67,90 ms** |
| p95 assoluto inizio/fine | 201,30 / 278,70 ms | **202,77 / 228,39 ms** |
| Parole soltanto stimate | 61 | 52 |
| Parole senza allineamento acustico | 464 | 403 |

Le 70 nuove parole hanno mediana 55,83/61,62 ms e p95 203,47/215,18 ms. Rap denso: 40/215; canto rapido: 18/69; finestre di frasi ripetute: 77/273. Restano due finestre rap di Wordsmith completamente non risolte e copertura scarsa sul canto lento. Non si dichiara qualità uniforme sul catalogo.

Nel lettore le sequenze parziali sono memorizzate in `acousticSpans`, separate dalle righe complete `words`. Le parole non osservate rimangono testo normale, senza animazione inventata. L'intera frase non diventa verificata. Le fonti complete affidabili vengono preservate; il salvataggio incrementale non sostituisce i timestamp parziali già accettati. Sono supportati il lettore normale, Immersive Mode, offset e traduzioni. I tempi acustici positivi partecipano anche alla protezione vocale delle transizioni.

La selezione è stata sviluppata e misurata su questo corpus, non su un insieme italiano indipendente. [JamendoLyrics](https://huggingface.co/datasets/jamendolyrics/jamendolyrics) contiene inglese, tedesco, spagnolo e francese; nessun riferimento italiano è stato inventato. Il modello resta il piccolo Whisper multilingue timestamped già fissato: nessun peso più grande viene scaricato sui telefoni. Il postprocessing non esegue nuova inferenza. I tempi dei chunk in cache non misurano la velocità di inferenza o le prestazioni di un iPhone fisico.

Dati completi: `karaoke-partial-benchmark.json`. Regressioni mirate: 62/62, comprese occorrenze ripetute, parole non allineate, sorgenti complete e rendering parziale.
