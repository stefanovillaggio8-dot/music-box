# Recupero metadati DJ della 6.738

La scansione parallela `44045820331`, pubblicata nel commit `d47bfe72`
del 17 novembre, ha sostituito le schede avanzate con le sole analisi di
base. Nel suo primo genitore End of Beginning aveva il piano renderizzato;
nel commit e nel main `9ae77d7f` quel piano non esiste più. Il planner reale
ripiega quindi su `underlay`, volume 0,09, senza beatmatch misurato. Questa
è una regressione dei dati, indipendente dall'hotfix Karaoke PR #65.

Il salvataggio parallelo e quello incrementale ora usano la stessa regola:
un aggiornamento di base conserva le prove del remoto sullo stesso SHA,
incluso il contesto di decodifica dell'introduzione. Non può ripristinare
prove revocate da uno snapshot vecchio. Un MP3 sostituito non eredita prove;
una risposta diversa dallo SHA Git atteso viene rifiutata prima del DSP.

Sono recuperati i soli dati delle tre librerie personali effettive, con Gym
esclusa: stessi MP3, durata coerente, stesso buffer FLAC con hash SHA256
ricontrollato, ricevuta dell'ingresso e descriptor ancora valido. Sono
conservati anche i rifiuti misurati, perché perderli permetterebbe di
nascondere nuovamente l'introduzione in un underlay. Nessun rifiuto diventa
un beatmatch. Nuovi brani e dati di base correnti sono preservati.

| Libreria attuale | Completi prima / recuperati | Parziali prima / recuperati |
|---|---:|---:|
| Ste, 222 brani | 0 / 1 | 0 / 1 |
| Diego, 213 brani | 0 / 1 | 0 / 0 |
| Emanuele, 621 brani | 0 / 7 | 0 / 5 |

È il recupero della disponibilità verificata della 6.736, non una nuova
copertura. Le librerie attuali differiscono dal vecchio checkpoint: il
confronto ripetuto usa identici membri su entrambi i lati, include il
manifesto delle importazioni e non aggiunge canzoni agli account.

End of Beginning → La mia storia tra le dita recupera l'ingresso originale
a zero, sovrapposizione 10,777 s, rapporto 1,01672 a tonalità preservata,
12 attacchi condivisi su 13, RMS 16,50 ms; battute RMS 5,80 ms. Picco
0,98462, true peak 4x 0,997996, variazione RMS intorno a EOF −0,533 dB.
Sono misure del buffer precedente con identità ricontrollata, non nuove
misure su un iPhone fisico o una certificazione di equivalenza a Spotify.

Le nuove prove del merge a 12 shard, concorrenza, revoca e recupero passano.
La prima suite del main immutato aveva 721/740, inclusa l'assenza locale
di Playwright. Dopo il recupero e il provisioning: 739/743, quattro
fallimenti già presenti, zero nuovi. Due test negativi dipendevano da cue
pericolosi ormai assenti: i cue sono spostati in fixture di regressione,
mantenendo gli stessi limiti e senza rimetterli nell'indice del lettore.
Quella suite mirata passa 11/11. Le due regressioni storiche della playlist
esclusa restano separate e non diventano obiettivi di ottimizzazione.
I risultati finali CI/native sono registrati prima della pubblicazione.

App, UI Karaoke, CSS, HTML, worker, versione e dati personali sono identici
a main: vedi impronte in `provenance.json`. Nessuna versione generale viene
alzata per questo recupero dati; nessuna cache audio viene cancellata.
Nessuna nuova animazione di parole, richiesta ASR o modifica al layout.

Restano aperti: copertura reale insufficiente (soprattutto Ste/Kid Yugi),
analisi strutturale automatica e certificazione di ogni importazione futura,
ripristino dell'ascolto a 2 ore e cronologia casuale a 5 ore, verifica fisica
su iPhone. Il Karaoke resta a frasi come già pubblicato nella PR #65.
