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

## Pubblicazione e risultati finali

PR68 unita nel commit 56ff510d3d3a3054cb2eaa82e5e117225993aad9. Pages
45097036088 completato; sette file pubblici identici byte per byte al
main distribuito, incluso l'indice musicale. Versione effettiva 6.739.

Candidata 12dc3d882223696d6a66f3c3aed6419c369d06b6: workflow frasi/offline
45096588161 superato, 76/76 test mirati e 9/9 regressioni Karaoke/DJ;
Chromium e WebKit reali superati per le due viste e aggiornamento
worker 6.738/PR67 -> 6.739. Matrice audio nativa Linux 45096588156: 10/10.
Suite completa candidata 757/759, stessi due fallimenti storici Gym.
Ramo ricerca dopo il merge: 61/61 test mirati superati. Nessuna nuova
certificazione acustica delle frasi e nessuna prova su iPhone fisico.

Indice, librerie e buffer sono invariati, salvo aggiornamenti concorrenti
separati dei dati utente conservati. Rollback disponibile tramite tag
music-box-v6.738-before-phrase-gap-20261123. Non svuotare dati o cache del
telefono per aggiornare: aprire la versione e accettare l'aggiornamento.

Suite finale del ramo ricerca dopo il merge: 770/772, stessi due casi storici falliti. Nessuna nuova regressione.
