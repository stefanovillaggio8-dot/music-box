# 6.739: pausa fra frasi nel Karaoke normale

Nel lettore normale una frase con termine esplicito a 3 s rimaneva
illuminata fino alla frase seguente a 12 s. Immersive aveva gia' il
controllo della pausa. La prova sul codice e sul DOM dell'app 6.738
riproduce il difetto: a 6 s la vecchia frase e' ancora attiva.

Il lettore normale applica ora lo stesso criterio di Immersive: termine
presente e valido, oltre quattro secondi fino al prossimo inizio e 1,5 s
di tolleranza dopo il termine. In quel tratto non illumina alcuna frase,
non anticipa la successiva e riattiva correttamente la precedente dopo un
seek indietro. Termini ignoti, parole stimate e osservazioni acustiche
parziali non inventano la pausa. Frasi vicine e note vocali sostenute
conservano il comportamento precedente.

La PR65 e' preservata: testo intero della frase, nessuno span per parola,
nessun worker o modello di allineamento avviato aprendo il Karaoke.
Immersive e' immutato. Il test browser misura il comportamento visivo con
metadati e clock controllati; non misura una nuova precisione acustica.
Nel caso 2-3 s -> 12 s elimina 7,5 s di vecchia frase attiva dopo la
tolleranza gia' usata da Immersive. Non viene rivendicato un incremento
ASR o un nuovo benchmark di riconoscimento.

Versione 6.739: cambia il player, la dichiarazione di versione nelle
diagnostiche e le revisioni cache. Il motore Smart Mix differisce dal
main soltanto nel numero di versione dichiarato. Nessun piano, buffer,
appartenenza personale, playlist o metadato musicale viene modificato.
Il worker precedente esatto 6.738/PR67 e' una fixture dell'aggiornamento.
Cache audio e dati personali non vengono cancellati.

Test mirati: 61/61 iniziali superati. Sono aggiunte prove della vera app
Chromium/WebKit per entrambe le viste, seek indietro, termine ignoto e
assenza di richieste di allineamento. Prima il test browser fallisce sulla
frase attiva nella pausa; dopo passa in Chromium. I risultati CI finali
e il commit pubblicato sono registrati nella PR della candidata.
I due test storici Gym con metadati mancanti restano esplicitamente
segnalati, senza modificare o includere Gym nei nuovi benchmark.

Smart Mix mantiene la disponibilita' verificata, non aumenta i contatori.
La copertura Ste, la certificazione delle future importazioni, i riferimenti
vocali indipendenti e le verifiche su un iPhone fisico restano da completare.
