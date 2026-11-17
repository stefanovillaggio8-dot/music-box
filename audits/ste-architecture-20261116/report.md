# Ste: copertura, evidenze native e checkpoint prima della pubblicazione progressiva

Confronto con `1398fc715854904a1d4407a980608ca8edecba1a`, verificato come HEAD effettivo prima del lavoro. I dati seguenti non sono un confronto con la precedente versione pubblica. Appartenenze, playlist e registrazioni non sono cambiate. Sono considerate esclusivamente le librerie personali Ste, Diego ed Emanuele.

## Risultato attivato nella PR

| Libreria | Coppie complete prima → dopo | Parziali prima → dopo | Completi in 20×40 cambi | Parziali in 20×40 cambi | Completi/parziali in 800 cambi continui |
|---|---:|---:|---:|---:|---:|
| Ste (227) | 1 → 1 | 2 → 2 | 18 → 20 | 20 → 20 | 4/7 → 4/7 |
| Diego (212) | 2 → 2 | 0 → 0 | 21 → 21 | 0 → 0 | 8/0 → 8/0 |
| Emanuele (621) | 7 → 7 | 5 → 5 | 79 → 79 | 23 → 23 | 9/4 → 9/4 |

Ste passa dal 4,75% al 5% di cambi ritmici nelle sessioni brevi. Il completo già certificato End of Beginning → la mia storia tra le dita viene utilizzato venti volte, non venti coppie diverse. Nella sessione continua la frequenza rimane 1,375%. Il miglioramento richiesto nel numero di coppie differenti NON è stato raggiunto. Il massimo intervallo senza raccordo ritmico nelle sessioni brevi passa da 37 a 35 cambi; quello continuo resta 206. Le sovrapposizioni avviate almeno 8 secondi prima dell’EOF passano da 65 a 67 (tutte le classi); le uscite che omettono il finale restano zero. Zero omissioni dell’introduzione e tentativi fuori libreria. Ordine, coda manuale e scenario offline sintetico sono invariati in tutti e tre gli account.

La correzione è un piano di successione su due passaggi: quando il brano in uscita ha già concluso la musica, due raccordi post-finale verificati con identico tempo, durata, gain e intro originale immediatamente udibile possono essere scelti considerando il successivo completo. Il selettore evita di consumarne prima il destinatario. Conserva il pool fresco, il vincolo SHA dell’analisi, i veti vocali e le code manuali. Non concede alcuna nuova certificazione. Un primo tentativo di preservare tutti i postludi durante il fallback non ha risolto il caso ed è stato scartato.

Emanuele non regredisce: 7/5 sono coppie distinte; 79/23 e 9/4 sono utilizzi in scenari differenti. Tutti i totali confrontabili restano identici. Numeri di candidati o criteri di checkpoint più antichi non sono convertiti in disponibilità attuale.

## Cause e sperimentazioni

Il produttore sperimentale su 51.292 coppie ordinate Ste indica come primo motivo 29.598 finali senza battute coerenti, 8.034 introduzioni senza battute coerenti e 13.141 rifiuti metrici/di tempo; i restanti motivi includono voce, armonia e controllo indipendente. Sono ragioni gerarchiche di quel produttore, non percentuali indipendenti né certificati musicali. `experiments.json` conserva anche i filtri applicati alle finestre.

Sono stati provati raggruppamenti a metà tempo, finestre alternative, ancoraggio agli attacchi PCM e ricerca più ampia delle code. Un contesto ritmico più lungo ha aggiunto 95 ipotesi di battuta senza produrre nuove coppie utilizzabili. Un secondo checkpoint Beat This è stato provato su sei brani Ste selezionati prima dell’inferenza: né quel modello né l’ensemble hanno aggiunto un nuovo completo certificabile. Non è un test di accuratezza indipendente. Nessun modello aggiuntivo viene installato sui telefoni. Rimuovere controfattualmente il solo vincolo LRC, mantenendo Spleeter, non ha aggiunto coppie.

L’attuale grafo ha soltanto tre sorgenti ritmiche distinte su 227, una per i completi: anche un ordinamento ideale non può trasformare la libreria in un DJ set frequente senza nuove sorgenti effettivamente certificate. Il limite ottimistico per sorgenti in un ciclo senza ripetizioni è circa 1,32% ritmico e 0,44% completo. Non è una previsione delle frequenze effettive, che dipendono anche dall’ordine e dai destinatari ancora disponibili.

## Candidato renderizzato e non attivato

Kid Yugi x Lil Peep MASHUP → Meraviglioso, entrambi nella libreria personale Ste: quattro battute ancorate, ingresso da zero, uscente fino all’EOF, 1,45 secondi di decadimento preservati. È esplicitamente parziale: dieci attacchi condivisi su ventidue, RMS dopo rendering 15,68 ms; true peak 48 kHz 0,997996 e ricampionamento 44,1 kHz verificato. I due canali originali sono controllati separatamente. Nessuna soglia ritmica o di clipping è stata ridotta.

La prima rivelazione nativa perdeva 3,74 dB: rifiutata. La curva smooth più breve perdeva 3,007 dB: ancora rifiutata. La variante di cadenza misurava −0,742 dB, mantenendo lo stesso limite di 3 dB. Le altre due finestre fallivano il controllo ritmico dopo rendering. Un’altra proposta su 166 → 250 falliva anch’essa dopo il rendering (circa 26–28 ms contro 20 ms).

Il candidato di cadenza ha superato i decoder Linux, ma il confronto nominale del PCM uscente su WebKit macOS ha correlazione 0,1654 e RMS relativo 1,295, malgrado durata e frame dichiarati corrispondenti. Una ricerca esclusivamente diagnostica trova circa −528 campioni a 44,1 kHz. Quel lag NON è usato per certificare o correggere il segnale. Un indice MP3 aggiunto conservando tutti i frame e il PCM ffmpeg non modifica il difetto Apple (differenza originale/rappresentazione zero). La causa interna precisa del decoder resta aperta.

Per questo il candidato è stato rimosso dall’indice attivato, che è semanticamente identico al checkpoint precedente. È conservato in `unreleased-cadence-candidate.json`; la disponibilità e le simulazioni finali non lo contano. Per nuove cadenze e recuperi del pre-roll vengono richieste prove nominali di forma d’onda anche su entrambi i backend WebKit. Durata corretta e semplici etichette di piattaforma non bastano.

## Verifiche e limiti

Sul codice di sviluppo `294f289e`: 734/734 test completi, 669/669 DJ, zero saltati; matrici Chromium/WebKit Linux e macOS entrambe 7/7, più Chromium e integrità. Audit globale di regressione esistente: 1.381.800 coppie, zero errori e completi precedenti conservati. Non viene usato per ottimizzare playlist escluse. Python già verificati: struttura 8, code 4, CTC 3, clock MP3 3.

Il clock MP3 a 44,1 kHz usa adesso durata intera dei pacchetti e time base razionale, evitando una deriva fittizia da arrotondamenti per pacchetto. Questa correzione non risolve automaticamente la differenza di forma d’onda Apple.

Karaoke: evidenza precedente preservata 192/590, holdout 9/96, campione nuovo 0/78. Nessun miglioramento acustico ulteriore dimostrato in questo intervento; nessun timestamp inventato. Le prove di regressione non sono una nuova misura di accuratezza. Nessun dato affidabile italiano nuovo è stato introdotto.

Nessun MP3 originale, download, preferito, playlist o dato personale è stato cancellato. Nessuna riduzione dei GB sul telefono di Diego è dichiarata. Il rallentamento generale dell’iPhone resta non confermato. Test WebKit automatizzati e campioni renderizzati non certificano un iPhone fisico né il giudizio musicale umano.

## Pubblicazione progressiva autorizzata il 17 novembre

Il nuovo metodo autorizza il rilascio delle parti stabili. È preparata separatamente la PR #60, versione 6.735: checkpoint verificato 1398 più selezione equivalente dei postludi, senza gli esperimenti successivi. Conserva i dati correnti di main e viene sottoposta nuovamente alle verifiche sulla composizione esatta. Pubblicazione completata e verificata online al commit `f07e9f29`. Il [rapporto della release](../releases/6.735/report.md) registra le prove e il ripristino. Dopo la pubblicazione è ripresa nella PR #59 l’acquisizione limitata del PCM nativo uscente su Linux e Apple, senza modifiche al player pubblico né lag adattati.
