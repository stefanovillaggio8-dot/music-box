# 6.738: ripresa reale e scadenze separate della sessione

Prima il lettore conservava la selezione per sei ore, una pausa poteva
scavalcare quel limite e un seek apparentemente riuscito veniva dimenticato
prima che Safari iniziasse la decodifica. La cronologia del casuale non aveva
la scadenza separata richiesta.

Ora una riapertura entro due ore prepara l'ultimo punto dell'account senza
autoplay. Il checkpoint resta attivo attraverso metadati, seek e Play; il
nuovo decoder diventa udibile soltanto dopo avanzamento coerente dal punto
richiesto. Il gesto Play resta sincrono. Un mancato ripristino ha un limite
nominale di 6,5 secondi, poi mette in pausa e consente una nuova prova, senza
una barra fittizia o riproduzione indefinitamente muta da zero.

Dopo due ore non rimane alcuna selezione attiva. Un marcatore di sessione
impedisce al successivo refresh di riesumare il vecchio `last` salvato.
Soltanto dopo cinque ore si azzera la cronologia temporanea del casuale del
profilo corrente. Download, preferiti, librerie, impostazioni e coda manuale
restano conservati. L'avanzamento reale in background mantiene attiva la
sessione; la sola presenza di un elemento con `paused=false` non basta.

Gli eventi media tardivi confermano l'avanzamento prima di tentare un altro
seek. Una pausa durante il caricamento sospende il controllo mantenendo il
checkpoint; un seek volontario o una nuova traccia lo annullano.

Prove: 13 test nuovi delle soglie e dei callback, più regressioni player,
Karaoke e coerenza delle revisioni. Il test browser usa Il Filmografo di
Kid Yugi, realmente appartenente a Ste, con originale SHA
`42cb3593ee9e81e557b34aa9cb3f331d40976a7a`. Sono coperti 1h59, 2h01,
4h59, 5h01, refresh, pausa/Play, un reset del decoder a zero e assenza di
callback RAF. Le ultime due sono prove di guasto dichiarate, non difetti
attribuiti automaticamente al telefono.

Il test reale WebKit aggiorna il worker PR65 6.738 al worker di questo hotfix
con lo stesso numero: conserva i download di tre account, audio legacy,
cache estranee, IndexedDB e localStorage e confronta l'intero nuovo player
servito offline con il file atteso. Nessuna cache musicale viene svuotata.

La versione generale resta 6.738; cambia soltanto la revisione cache del
player. I file DJ, il Karaoke a frasi della PR65, Immersive, CSS, indice
musicale e dati personali sono immutati: impronte in `provenance.json`.
Il nome storico del parametro URL `words=19` è solo una revisione cache e
non riattiva il rendering per parole o richieste di allineamento.

La matrice nativa della candidata e i risultati definitivi vengono registrati
prima della pubblicazione. WebKit usa anche viewport e user agent iPhone,
ma nessun iPhone fisico è certificato. La precisione vocale delle frasi e la
copertura musicale di Smart Mix restano obiettivi separati e non completati.

## Ultima verifica prima della pubblicazione

Il test di rientro in primo piano ha riprodotto un difetto concreto: la
selezione era scaduta ma il titolo Il Filmografo restava visibile. Ora lo
stesso aggiornamento azzera anche titolo e copertina, preservando la coda
manuale. Una richiesta di mute/unmute durante la ripresa resta autorevole
quando il decoder diventa udibile.

Prova locale finale: 13/13 test mirati, sei scenari Chromium e aggiornamento
WebKit del worker alla stessa versione superati. Suite completa: 754/756;
i due fallimenti preesistenti riguardano esclusivamente vecchi raccordi
Gym privi dei relativi metadati. Non vengono nascosti o aggirati e Gym non
viene modificata. Le matrici native Linux/macOS vengono rieseguite sul
commit finale prima del merge.

Una prova aggiuntiva ha riprodotto lo smascheramento prematuro del decoder
con un cambio volume durante il ripristino. Il controllo volume mantiene
ora la protezione fino alla conferma del seek, rispettando anche il mute
del buffer comune. La richiesta dell’utente viene applicata al rilascio.
