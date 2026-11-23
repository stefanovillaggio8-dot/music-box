Ripresa del checkpoint 06058c441f122f50b71a8f01afe01070235d9338, PR59,
23 novembre 2026. Rilette le istruzioni nei commenti 7093252094 e 7056350709:
ricerca solo Ste, priorita' Kid Yugi, Karaoke esclusivamente per frasi.
Main verificato su 379830d5728846445005e42a840b5deced8ab9c9; nessun merge
della PR59 e nessuna nuova versione pubblica. La versione resta 6.739.

Il risultato musicale richiesto NON e' stato raggiunto in questo checkpoint:
**Ste resta a una coppia completa e una parziale, con zero nuove coppie
certificate.** Le coppie conservate sono End of Beginning -> la mia storia
tra le dita e Sono Ok -> Gilgamesh. Sono disponibilita' del checkpoint
precedente, non nuove certificazioni o un nuovo audit completo.

| Misura | Prima | Dopo |
| --- | ---: | ---: |
| Coppie complete disponibili Ste | 1 | 1 |
| Coppie parziali disponibili Ste | 1 | 1 |
| Nuove coppie certificate | 0 | 0 |
| Nuove transizioni anticipate certificate | 0 | 0 |
| Nuove versioni pubblicate in questo checkpoint | 0 | 0 |

La selezione usa l'oracolo effettivo dell'app, stato, playlist e import
pubblicati: snapshot Ste di 222 registrazioni, con SHA e provenienza in
summary.json. La playlist esclusa non viene modificata. Sei coppie ordinate
distinte sottoposte al compilatore, nove registrazioni coinvolte, massimo
quattro casi per comando. Nessuna nuova campagna sugli altri account,
nessuna scansione globale. I tre casi congelati erano gia' noti: rileggerli
con evidenza metrica indipendente non e' una validazione indipendente nuova.

| Coppia Ste | Risultato delle prove mirate |
| --- | --- |
| la mia storia tra le dita -> Tristano e Isotta | Troppi pochi impulsi nelle battute affidabili alla geometria congelata; il contesto iniziale non forma una sequenza utilizzabile. |
| Stratos -> Star Shopping | Le due tracce hanno pulsazioni metriche, ma non corrispondono alla geometria precedente. La ripianificazione produce quattro finestre respinte dagli impulsi; usando il contesto originale piu' lungo, 92 finestre vengono respinte dall'armonia. |
| Paraguai -> Per il Sangue Versato | Le corrispondenze precedenti non reggono il riferimento metrico indipendente. Le nuove geometrie con contesto vengono respinte dalla voce, prima di poter certificare ritmo e armonia. |
| Stratos -> Eva | Nessuna sequenza iniziale continua sufficiente. La vista percussiva del modello non recupera battute. |
| Amelie -> Lilith | Manca una catena finale utilizzabile entro i limiti di durata e coda preservata, sia nei dati integrali sia nel contesto. |
| Stratos -> Lilith | Le geometrie candidate vengono respinte per sovrapposizione vocale. |

Questi rifiuti riguardano le finestre effettivamente valutate. Non dimostrano
che ogni possibile transizione fra queste canzoni sia musicalmente impossibile.
Le ipotesi metriche del modello non sono riferimenti umani certificati.

Il nuovo confronto separa tre problemi precedentemente confusi. Una
corrispondenza fra attacchi locali puo' allineare suddivisioni senza sostenere
la fase delle battute. Alcune introduzioni hanno invece vere lacune nelle
osservazioni acustiche o negli eventi del rilevatore. Infine, recuperare una
griglia non elimina automaticamente i veti di voce e armonia.

In Eva, a 2,84 s la fase metrica supera il modello ma il massimo onset PCM
nella tolleranza originale e' 0,009, contro il requisito 0,25. I due attacchi
seguenti sono osservati a 4,20 e 4,86 s: non vengono inventati downbeat per
colmare il vuoto. Intorno a 8,78 s manca anche un evento del rilevatore:
probabilita' beat circa 0,403 e onset locale 0,042. Questa e' evidenza di una
griglia incompleta, non una prova sufficiente per aggiungere un attacco udibile.
La traccia completa dei primi rifiuti e' in bar-gates.json.

Il possibile errore di aggancio delle probabilita' downbeat ai beat spostati
dal postprocessore non ha mostrato discrepanze sostanziali nei punti esaminati:
non e' stato adottato come correzione. Un diverso conteggio delle coordinate
metriche, capace di riconoscere un evento omesso senza inserire impulsi,
e' stato provato solo sui posteriori originali gia' salvati. Eva passa da
5 a 3 battute candidate; Tristano resta a 2, cambiandone una. Nessuna catena
iniziale continua di quattro battute recuperata. Prototipo respinto, archiviato
in phase-gap-probe.py e phase-gap-results.json, mai usato dal compilatore.

Sono state eseguite solo due nuove inferenze Beat This, su 24 secondi di
introduzione ciascuna, modello gia' locale e verificato: Tristano e Isotta
e poi Eva, vista percussiva. Entrambe producono zero battute affidabili.
La separazione qui e' HPSS per la vista del modello, non un nuovo Spleeter
ne' una sostituzione del PCM originale nei controlli di qualita'. Il controllo
aggiuntivo delle crescite di energia nell'originale di Eva, bande 30-180,
180-1800 e 1800-5000 Hz a 44,1 kHz, conferma che l'attacco a 2,84 s e' debole
in tutte e tre. A 8,12 s la banda bassa suggerisce invece un possibile limite
del solo onset HPSS. band-transient-probe.json e' diagnostica esplorativa,
non una nuova soglia di certificazione, una prova d'ascolto o un rilevatore
adottato. Non sono stati ripetuti gli stimatori quadratici PCM gia' respinti.

Anche i BPM richiedono cautela: Stratos conserva nell'indice base 128,48,
mentre il modello locale delle battute finali suggerisce circa 93,7. Il
compilatore mirato usa gia' la durata locale delle battute, quindi correggere
soltanto quel valore di indice non risolverebbe i veti osservati. Non viene
pubblicata una nuova etichetta BPM senza la verifica necessaria.

L'implementazione salvata aggiunge --cases al compilatore: appartenenza Ste
corrente obbligatoria, selezione delle sole coppie richieste prima di caricare
le evidenze e percorso di uscita nuovo obbligatorio. L'analisi degli estremi
supporta --roles e --ste-cases: puo' misurare soltanto l'introduzione richiesta,
riusa il checkpoint verificato e, in modalita' protetta, non scarica sorgenti
o modelli mancanti. I ruoli gia' misurati vengono conservati soltanto con
identita' audio/modello/vista invariata. L'indice validato viene congelato;
una sorgente locale sparita o cambiata fallisce senza ricorrere alla rete.

diagnose-ste-metrical-pulses.cjs mantiene la geometria congelata, l'ingresso
da zero e una tolleranza massima di 80 ms fra fine della vecchia finestra e
durata di indice: e' solo una diagnosi dei campioni storici, non il permesso
di tagliare un finale o adattare il clock nel player. I nuovi piani del
compilatore usano esattamente la durata originale. measured_bars offre una traccia opzionale
dei rifiuti, senza cambiare candidati o soglie. Tutte queste modifiche sono
strumenti di ricerca, non nuove autorizzazioni di riproduzione o un rilascio
del motore sperimentale. Nessuna modifica a player, indice musicale, cache,
service worker, Karaoke, librerie, playlist o download in questo checkpoint.

Verifiche locali: 134/134 test Node mirati, 10/10 Python struttura, 4/4 Python
cache; controlli sintattici e git diff --check superati. Coprono anche coda
manuale, import futuri, isolamento, contenuto preservato, download e frasi.
La CI mirata su f399d6c5, run 45128516761, e' passata; il controllo Karaoke/DJ
45128422552 e' passato. La stessa CI sul codice finale 96a20fb1, run
45129118843, ha superato 9/9 test Node e 14/14 Python senza audio, nuovi
modelli o campagne musicali. I riferimenti sono salvati in verification.json.

Non vengono ripetute simulazioni quotidiane, rendering 44,1/48 kHz o prove
browser musicali su candidati gia' respinti prima del rendering. Nessuna
nuova misura di clipping, precisione dopo SoundTouch o frequenza di uso in
shuffle e' quindi rivendicata. I fallimenti preesistenti della CI del vecchio
checkpoint, incluse la matrice Common PCM e la suite DJ, restano visibili:
non sono stati aggirati ne' presentati come risolti. Nessuna prova su iPhone
fisico e nessuna equivalenza a Spotify.

Il prossimo lavoro utile e' verificare un'evidenza ritmica per bande e fase
metrica robusta su segmenti Ste con riferimenti indipendenti, preservando
gli attacchi osservati e la verifica del rendering. I campioni qui respinti
non vanno nuovamente riprovati con gli stessi ingressi e criteri. Una griglia
piu' permissiva, da sola, non autorizza alcuna nuova coppia.
