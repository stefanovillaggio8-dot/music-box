Ripresa esatta di 642c7535d6649f00662b404b7c8492da2d096fea, PR59 in bozza.
Letti tutti i commenti correnti, in particolare
https://github.com/stefanovillaggio8-dot/music-box/pull/59#issuecomment-7095624452.
Ricerca musicale limitata allo snapshot personale Ste, 222 registrazioni;
stato, playlist, app e import sono ancora identici al main verificato.
Nessun dato utente viene modificato.

Ste resta a **1 coppia completa e 1 parziale**, zero nuove coppie certificate.
Le disponibilita' conservate sono End of Beginning -> la mia storia tra le
dita e Sono Ok -> Gilgamesh. Il nuovo prototipo recupera catene metriche,
ma NON dimostra un miglioramento musicale utilizzabile o percepibile.

| Misura Ste | Prima | Dopo |
| --- | ---: | ---: |
| Coppie complete disponibili | 1 | 1 |
| Coppie parziali disponibili | 1 | 1 |
| Nuove coppie certificate | 0 | 0 |
| Nuove transizioni anticipate certificate | 0 | 0 |
| Nuovi piani che superano tutti i gate | 0 | 0 |

La classificazione dei sei casi precedenti e' in
previous-case-classification.json, con riferimenti alle prove gia' archiviate.
Non sono state ripetute le rispettive analisi PCM o inferenze. Per Eva,
un onset HPSS sotto soglia NON prova che nell'originale manchi qualunque
attacco: a 2,84 s l'evidenza resta debole/non verificata; a 8,12 s esiste
una crescita di energia bassa, che da sola non certifica un impulso; a
8,78 s manca un evento affidabile della griglia. Non sono stati inseriti
beat per colmare questi punti. Gli altri casi hanno veti di voce, armonia
o indisponibilita' di catene iniziali/finali, distinti dall'incompatibilita'
BPM. Nessuna di queste diagnosi certifica un'impossibilita' musicale assoluta.

E' stata formulata una nuova ipotesi falsificabile, salvata in protocol.json
prima della prova: il compilatore mantiene separate le battute affidabili
dell'intero brano e quelle di un diverso contesto iniziale/finale. Le lacune
complementari possono quindi spezzare una catena pur senza mancare tutte
le osservazioni acustiche. Un grafo di sole battute originali puo' unire
segmenti compatibili senza creare eventi, interpolare tempi o cambiare soglie.
Sono due contesti dello STESSO modello, non due certificazioni indipendenti.

Il prototipo --context-bar-chains=true richiede i casi Ste correnti, massimo
quattro per comando. Accetta esclusivamente contesti originali, fase >=0,8,
evidenza beat geometrica >=0,7 e downbeat >=0,5. Unioni entro 80 ms, stesso
metro, differenza fra periodi adiacenti <=8%; tutti i timestamp rimangono
quelli delle osservazioni originali. Esclude le catene gia' interamente
presenti in un singolo contesto e le rilevazioni duplicate. Il confronto
PCM conserva TUTTI gli eventi originali del segmento, anche quelli esterni
alle battute selezionate: non puo' migliorare la percentuale eliminando
attacchi scomodi. I gate successivi rimangono invariati.

Sono state compilate tre coppie: due nuove direzioni di ricerca, con Kid
Yugi uscente, e un controllo negativo gia' noto. Nessuno sweep di libreria.

| Coppia | Compilatore precedente | Nuovo assemblaggio |
| --- | --- | --- |
| Il Mostro -> la mia storia tra le dita | Nessuna catena finale eleggibile | Recupera due battute consecutive fra 177,62 e 183,42 s, ma i piani vengono respinti dalla protezione vocale. |
| Donna -> la mia storia tra le dita | Finestre gia' respinte dall'armonia | Recupera anche la catena di quattro battute 171,90-183,76 s; restano i veti di armonia/voce e durata. Nessun piano valido. |
| la mia storia tra le dita -> Tristano e Isotta | Nessuna catena iniziale coerente | Rimane respinta. Le fasi incompatibili fra i contesti non vengono cucite. |

La variante recupera tre catene nuove in totale: due per Donna e una per
Il Mostro. Sono IPOTESI di finestre, non tre coppie e non tre mix. Nel modo
completo, Donna resta bloccata all'armonia e Il Mostro alla voce. Nel modo
metrico parziale, le code non soddisfano l'ammissibilita' gia' prevista.
I risultati definitivi sono context-full-final.json e
context-metrical-classified.json. Gli altri file context-* conservano i
passaggi di strumentazione e non sono certificati aggiuntivi.

E' stato verificato un errore concreto nella diagnostica: il veto della coda
metrica precedeva il controllo BPM ma non veniva contato. Il primo gate
mancante diventava erroneamente BPM. Ora il rapporto indica tailEligibility
e unsupportedMetricalTail; il test di integrazione riproduce il caso con
fixture dichiaratamente sintetiche. Non cambia una decisione musicale.
Il confronto col codice esatto del checkpoint, sulle tre coppie congelate,
conferma gli stessi piani, conteggi e rifiuti quando l'opzione e' disattivata.

Una quarta direzione, Amelie -> Eva, e' stata valutata soltanto come
preflight su dati gia' salvati: due geometrie ipotetiche, 2/4 battute, senza
inventare osservazioni o generare cue. Entrambe sono respinte dall'armonia
esistente. Il confronto riguarda SOLO quelle geometrie. Non e' stato avviato
un nuovo rilevatore di attacchi, perche' correggere il ritmo non avrebbe
reso valide quelle finestre. La coppia e' validata Ste in preflight-case.json.

Costo della nuova ricerca: **zero nuove decodifiche audio, zero inferenze,
zero modelli scaricati**, soli dati originali gia' disponibili e legati per
SHA. Nessun nuovo HPSS/percussivo, stimatore quadratico o conteggio alternativo
gia' respinto. Nessun rendering di candidati non validi, nessuna nuova
certificazione a 44,1/48 kHz e nessuna nuova simulazione shuffle. Queste
misure non vengono rivendicate come completate.

Durante la CI si e' riattivato un vecchio workflow esplorativo su 17 coppie
fisse, anche esterne a questo campione: run 45142000572. Questo costo CI
e' separato dallo zero di decodifiche della ricerca mirata; i suoi risultati
NON vengono usati per nuove certificazioni o statistiche Ste. Il workflow
dj-real-audio-audit.yml misurava quelle coppie automaticamente sulla PR e
controllava essenzialmente la validita' numerica del rapporto. Viene reso
manuale, come gli altri workflow di ricerca, conservando i test di regressione
del player/browser. La correzione e' isolata nella PR70; dettagli di
pubblicazione, rollback e CI sono in verification.json. Non include il
prototipo delle catene e non cambia la versione 6.739.

Verifiche: 140/140 test Node mirati locali, sintassi e diff superati. CI del
codice e3b2746a: 15/15 Node, 14/14 Python nel contratto Ste, run 45142000669.
Chromium desktop, matrice Common PCM Chromium/WebKit, interfaccia Immersive,
Karaoke per frasi e aggiornamento offline passano i workflow pertinenti.
La suite DJ e il workflow iPhone restano rossi: i due errori di fixture/dati
gia' presenti nel checkpoint sono identici nei messaggi, verificati contro
45129327070 e 45129326996. Non vengono nascosti, aggirati o chiamati verdi.
Le nuove catene non entrano in nessuno di questi test browser come nuove
transizioni autorizzate. Nessun ascolto umano o test su iPhone fisico.

Player, service worker, download, preferiti, librerie, playlist, sessione
2h/5h e Karaoke per sole frasi sono invariati. PR59 resta sperimentale e
in bozza. L'opzione nuova e' spenta per impostazione predefinita. Il limite
attuale e' la mancanza di una finestra con TUTTE le evidenze necessarie,
non la semplice assenza di un altro contatore o di battute concatenate.
Non estendere questo stesso esperimento alle coppie respinte senza una nuova
evidenza concreta. Nessuna equivalenza a Spotify e nessun miglioramento
musicale pubblico viene dichiarato.
La sola correzione del workflow e' stata pubblicata nella PR70, unita nel
commit 71df773727aee236a9dcd06bcfb702a3bd0c8132, dopo 6/6 test locali e
CI 45142586286 superata. Diff di main verificato: soltanto due workflow e
un test; tutti i file applicativi e i dati sono invariati. Tag di rollback:
music-box-v6.739-before-manual-spotcheck-20261123. Il codice finale della
PR59, 372e5a4f, supera anche il contratto CI 45142495558. Nessun nuovo
miglioramento musicale e' stato pubblicato.

