# Ste: isolamento delle librerie, nuove strategie PCM e misura continua

Baseline: `c0cac34523c904693a2e4adeb783fa9a8c8e878f`. Codice verificato: `0b3806c5463153fe98fd64f29717395374536a60`; il lettore è quello di `018a7af10ba48501dbca487f20fc5f94c264509b`. PR #59 in bozza. Nessun merge, modifica a main o pubblicazione.

**L'obiettivo di aggiungere nuove coppie Ste non è raggiunto.** Sono state corrette vulnerabilità nei confini della selezione personale e provate strategie diverse su originali Ste, senza installare quelle che non aggiungono opportunità verificate. Non si presenta l'aumento dei candidati o un diverso tipo di simulazione come aumento della copertura.

## Separazione effettiva delle librerie

Le analisi riguardano i 227 titoli della libreria personale Ste. La playlist esclusa dall'utente non entra nella selezione, negli esperimenti o nei confronti e non è modificata. Le copie esplicite già presenti restano utilizzabili: il profilo originale del caricamento non determina da solo l'appartenenza personale. Diego ed Emanuele vengono controllati per regressioni, senza nuove ottimizzazioni dedicate.

Due errori riproducibili nel codice sono corretti:

* Se `visibleTracks(true)` falliva, `_listaPerIlSeguito()` restituiva tutti i brani caricati. Ora restituisce una lista vuota. Anche un indice ormai fuori dalla lista non può ripiegare su `tracks[indice]`.
* Dopo un'analisi asincrona, `mixSelectShuffle` ricontrollava il pool corrente soltanto per un candidato esterno ai dieci già visualizzati. Ora ricontrolla anche quelli nell'anteprima: un cambio di account o filtro non autorizza una vecchia scelta.

I test eseguono le vere funzioni dell'app con tre profili, copie esplicite, brani esclusivamente altrui, sorgenti di stanza, filtro scaricati, preferiti, ricerca e non ascoltati. Un candidato rimosso durante l'analisi viene rifiutato senza cambiare l'ordine della coda. Code manuali e stanze condivise conservano i propri percorsi: la selezione automatica personale non li riordina. Sono prove di comportamento e riproduzioni dei due errori, non evidenza di una fuga già osservata sul telefono.

Nessun dato personale o download viene modificato. La revisione della sola shell passa a `words=16`; l'asserzione di coerenza degli URL online/offline è aggiornata con essa. [Impronte e file preservati](source-proof.json).

## Coppie disponibili e ascolto: confronto corretto

| Libreria personale | Completi prima → dopo | Parziali selezionati prima → dopo |
|---|---:|---:|
| Ste | **1 → 1** | **1 → 1** |
| Diego | 2 → 2 | 0 → 0 |
| Emanuele | 7 → 7 | 5 → 5 |

L'inventario è ricontrollato sulle appartenenze attuali e sui piani ancora validi. Il motore musicale e l'indice sono identici alla baseline; l'audit generale precedente viene riutilizzato per individuare le coppie da verificare nell'inventario, non dichiarato rieseguito. La ricerca mirata dei produttori confronta invece nuovamente le 51.292 coppie ordinate Ste. [Disponibilità](personal-availability.json).

| Ste, stesso seed e stesso scenario prima/dopo | Completi | Parziali | Crossfade | Normali | Postlude | Underlay |
|---|---:|---:|---:|---:|---:|---:|
| 20 sessioni da 40 cambi, prima | 18 | 0 | 32 | 336 | 108 | 306 |
| 20 sessioni da 40 cambi, dopo | 18 | 0 | 32 | 336 | 108 | 306 |
| Una sessione continua da 800 cambi, prima | 4 | 3 | 26 | 548 | 105 | 114 |
| Una sessione continua da 800 cambi, dopo | 4 | 3 | 26 | 548 | 105 | 114 |

**18/800 e 4/800 misurano scenari differenti.** Il vecchio scenario ricomincia ogni sessione con un pool fresco e non ricostruisce la storia del dispositivo tra sessioni. Il nuovo `--continuous-shuffle=true` mantiene la storia per tutti gli 800 cambi e rinnova il ciclo solo dopo aver esaurito i brani, come l'app. Ripete tre cicli e non reintroduce arbitrariamente i partner ogni 40 cambi. Nessuno dei due scenari è una misura delle abitudini effettive del telefono.

Nella sessione continua, le due coppie ritmiche distinte utilizzate sono Djo → Grignani (quattro completi) e Sono Ok → Gilgamesh (tre parziali), già presenti alla baseline. Non sono due nuove coppie. Frequenze: 0,50% completi e 0,375% parziali. La massima sequenza senza completo è 229 cambi; senza completo **o parziale**, 210. Nel vecchio scenario entrambe restano 40. L'uso delle poche coppie non risolve il problema della varietà.

Durata media: completi 10,777 s, parziali 7,250 s nella sessione continua. Gli inizi anticipati dell'overlap sono 25, contro 39 nello scenario breve; comprendono altre classi e non certificano beatmatching. Uscite che eliminano contenuto restante e secondi omessi in ingresso: zero. Ogni tentativo verifica entrambi gli ID contro il pool personale; **zero tentativi esterni**. Il rapporto conserva gli ID ammessi, l'hash della loro lista e tutti i conteggi delle coppie distinte, non soltanto una traccia abbreviata.

Ordine normale: zero completi su 226 cambi; coda manuale: zero su 40; shuffle offline sintetico: zero su 800. Tutti invariati prima/dopo. Quest'ultimo usa un manifesto MP3 sintetico al 50%, senza buffer comuni preparati: non misura i download reali di Ste. [Confronti, modalità e prove di appartenenza](listening-comparison.json).

## Strategie musicali provate e non installate

Il primo ostacolo rimane soprattutto la disponibilità di battute terminali e iniziali coerenti. Alla baseline, su 51.292 coppie Ste: 29.598 senza battute finali, 8.034 senza battute iniziali, 12.180 nel gruppo metrica/tempo/estensione, 1.163 voce, 305 armonia e dieci senza fit indipendente dei colpi. Sono primi ostacoli del produttore, non annotazioni umane di incompatibilità.

Gli esperimenti conservano i controlli del prodotto; nessun prototipo viene abilitato soltanto per aumentare i contatori:

1. **Silenzi iniziali verificati.** Misurati i primi quattro secondi dei 227 MP3 originali in stereo a 44,1 e 48 kHz, con hash verificati. Un prefisso con picco ≤0,0001 può essere escluso dal solo esperimento senza saltare contenuto udibile secondo la politica esistente; il resto dell'introduzione resta integro. Nessuna nuova coppia. Il limite dei quattro secondi è un limite della misura, non il tempo esatto del primo suono per i file ancora sotto soglia. [Misure](leading-silence.json).
2. **Tempo ripartito sui due brani.** Ricerca preliminare di rapporti più ampi, rappresentabili con ogni singolo brano entro ±5%, invece di richiedere tutto il cambio al solo entrante. Nessuna nuova coppia arriva ai controlli originali richiesti; non viene implementato un doppio motore di stretch senza un candidato utile. Le sue proposte restano geometria sperimentale, non rendering certificati.
3. **Tempo locale da downbeat osservati**, al posto dell'ultimo estremo di battuta del modello non ancora osservato: nessuna nuova coppia.
4. **Secondo modello e consenso.** Beat This `final1`, SHA-256 `365b553f43750717c907f32fbc42910f3b264d616654583df6e44472c93ead80`, solo offline. Selezione congelata di 48 brani Ste: bordi con molti attacchi osservati ma senza battute accettate, più tutti i dodici quasi-match ritmici precedenti. Il modello aggiuntivo riduce le esclusioni per battute finali da 29.598 a 28.694 e porta le finestre che raggiungono il controllo dei colpi da 291 a 644, ma non aggiunge coppie utilizzabili. Anche la media dei logit dei due modelli non ne aggiunge. I due modelli non sono riferimenti musicali indipendenti annotati da persone. [Documentazione primaria e modelli disponibili](https://github.com/CPJKU/beat_this#available-models), [campione congelato](model-sample.json).
5. **Suddivisioni ritmiche osservate nel PCM**, oltre ai beat principali: nessuna nuova coppia; la rappresentazione proposta perdeva anche un candidato precedente, quindi non sostituisce quella installata.
6. **Composizione di prove metriche parziali con coda preservata**, ingresso metrico ritardato mantenendo tutto il prefisso e loro combinazione: nessuna nuova coppia.
7. **Finale percussivo simmetrico all'intro percussiva**, con gli stessi limiti di potenza tonale, note dominanti e RMS già richiesti all'intro: nessuna nuova coppia.

Tutti i risultati, compresi quelli negativi, sono in [experiments-summary.json](experiments-summary.json). I prototipi sono conservati in [experiments](experiments), separati dal prodotto. Leggere [la procedura](reproduction.md) prima di eseguirli.

## Rendering degli scarti e falsi negativi non dimostrati

Sono stati generati quattro campioni di ascolto **scartati**, con gli MP3 originali, il renderer e SoundTouch effettivi. Sono file locali di revisione, non asset del lettore. Il controllo viene ripetuto a 48 kHz e sul segnale riscampionato a 44,1. L'eventuale attenuazione uniforme della sola anteprima è registrata; non cambia i tempi o il responso ritmico.

| Coppia Ste scartata | Colpi associati / massimo dei due conteggi | RMS dei colpi a 48 kHz | RMS downbeat | Esito a entrambe le frequenze |
|---|---:|---:|---:|---|
| Passione maledetta → Non ti dimentico | 8/20, 40,0% | 12,48 ms | 82,20 ms | rifiutata |
| Passione maledetta → we fell in love in october | 19/28, 67,86% | 21,31 ms | 5,80 ms | rifiutata |
| Kid Yugi x Lil Peep MASHUP → CIGNO NERO RMX | 6/12, 50,0% | 42,39 ms | 5,80 ms | rifiutata |
| Il Tuo Sorriso → Doom | 5/13, 38,46% | 25,83 ms | 20,93 ms | rifiutata |

Una buona RMS sui pochi colpi associati non dimostra un buon beatmatch sull'intera sovrapposizione. Nel primo caso il nuovo ritmo compare tardi e il riferimento di battuta non regge il rendering; nel secondo i downbeat vicini non compensano gli attacchi mancanti. Nel terzo anche l'RMS supera il limite. La [diagnostica metrica](partial-diagnosis.json) distingue ancore assenti, pochi colpi per battuta e pochi colpi condivisi. Non è stato dimostrato un nuovo falso negativo che possa essere promosso senza ridurre i requisiti. Per distinguerli da limiti del rilevatore servono riferimenti ritmici affidabili, non l'ipotesi che due BPM vicini debbano essere mixabili.

Il completo Ste precedente mantiene le prove già documentate: 16,50 ms RMS dei colpi, 5,80 ms dei downbeat, true peak 0,997996, contenuto preservato. Non viene presentato come una nuova transizione. [Rendering scartati e impronte dei campioni](rejected-render-proof.json).

## Karaoke, regressioni e limiti

Il karaoke resta a **192/590** nel benchmark offline, holdout precedente **9/96**, nuovo campione congelato **0/78**. Nessuna nuova precisione viene dichiarata: il codice di allineamento e gli asset sono identici alla baseline, e la nuova suite verifica che la selezione non comprometta testo e cambio brano. Non vengono spostati intervalli precedentemente accettati o caricati modelli sui telefoni.

Suite completa CI **715/715**, DJ **652/652** sul codice `0b3806c5`. Chromium, WebKit foreground, integrità e matrice Linux del lettore reale **7/7** passano sul lettore aggiornato. La nuova matrice macOS ha cinque job superati e due prove del lettore ancora in coda senza runner assegnato: non è contata come 7/7 e non è sostituita da esiti storici. Gli esiti e i collegamenti sono nel [registro](verification.json). Il primo controllo locale completo aveva un'asserzione sulla revisione della shell ancora a `words=15`: corretta coerentemente a 16, senza modificare il requisito; 75 test mirati e la suite CI completa successiva passano.

Download, preferiti, playlist, stato utenti e file originali restano preservati. Non è misurato spazio risparmiato e i dati Safari di Diego non sono attribuiti automaticamente a Music Box. Nessuna verifica su iPhone fisico o ascolto umano dichiarati; rallentamento generale ancora non confermato. Il conflitto con main rimane aperto senza merge.

Il progresso accettato di questo checkpoint riguarda **isolamento e misurazione**, non nuova copertura musicale. La priorità richiesta resta irrisolta; non si dichiara equivalenza a Spotify Mixa o concluso lo sviluppo Smart Mix.
