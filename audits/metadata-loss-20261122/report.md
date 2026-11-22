# Ripresa del lavoro: dati musicali, account Ste e sessione 6.738

## Stato ricostruito e protezione degli avanzamenti

Il lavoro interrotto comprendeva il completamento delle simulazioni con gli
import pubblicati e il recupero delle transizioni effettivamente distribuite.
La PR59 rimane il ramo di ricerca; pubblicazioni separate preservano PR62,
PR63 e soprattutto PR65, Karaoke illuminato a frasi senza riallineamento
automatico all'apertura. Nessuna libreria viene allargata artificialmente.

## Causa verificata e pubblicazione PR66

Il commit d47bfe722ecf3e9d317ebd8312ed9e48c6a3a009 della scansione parallela
ha sostituito gli oggetti dell'indice con i soli metadati di base. Sono
scomparsi piani e ricevute audio già verificati. Il problema era nel merge
delle 12 parti, non una nuova incompatibilità musicale dei brani.

PR66, merge f8ca958d7a6f022dd53092128cf3fdf232b11458, pubblica la regola comune
per i due produttori: stessa registrazione SHA, estensioni correnti preservate;
registrazione sostituita, vecchie prove scartate. Le parti verificano lo SHA
del file prima del DSP. Recupero limitato alle appartenenze personali reali,
con source/target SHA, durata e impronta FLAC. Anche le ricevute negative
sono recuperate per non riattivare ingressi già bocciati.

La scansione completa successiva 45070106454 ha terminato 12/12 parti e
merge. Il confronto 398e6b2d -> 3e920d94 conferma conservati tutti e cinque
i campi avanzati, pur aggiornando 155 righe di analisi base. Le appartenenze
restano inalterate. Versione generale 6.738, nessuna pulizia dati offline.

| Profilo personale | Membri | Completi persi -> recuperati | Parziali persi -> recuperati |
| --- | ---: | ---: | ---: |
| Ste | 222 | 0 -> 1 | 0 -> 1 |
| Diego | 213 | 0 -> 1 | 0 -> 0 |
| Emanuele | 621 | 0 -> 7 | 0 -> 5 |

Questo e' ripristino di copertura certificata esistente, non scoperta di
nuove coppie. I precedenti inventari 6.735 avevano ulteriori coppie poi
bocciate dal controllo di udibilita': non vengono recuperate come valide.
Gym esclusa; dati e contenuto non modificati.

Djo 705 -> Grignani 50: il main privo dei dati sceglieva un underlay a .09;
con i piani recuperati viene usato il buffer misurato. Originale finale
preservato, ingresso a zero, sovrapposizione 10.7766 s, tempo 1.01672.
Rendering: 12/13 attacchi, RMS 16.504 ms; downbeat 5.805 ms; picco .984617,
true peak 4x .997996, scarto RMS al termine -.53323 dB. Questi numeri sono
misure automatiche, non certificazione di bellezza o ascolto su iPhone.

## Studio Kid Yugi sulla libreria Ste

24 registrazioni realmente appartenenti a Ste; tutte le 222 registrazioni
dello scope hanno PCM originale gia' disponibile e vincolato allo SHA.
10.056 coppie ordinate coinvolgono la coorte; 2 alias dello stesso file
esclusi, 10.054 valutate. Nessuna nuova coppia completa proposta dal
compilatore corrente con protezione integrale delle registrazioni.

Prime esclusioni gerarchiche (non percentuali indipendenti):

- 6.073: intro senza batteria immediata secondo la griglia corrente.
- 1.215: confine vocale iniziale non sufficientemente noto.
- 1.783: nessuna variante locale di tempo compatibile.
- 334: voce prima della finestra minima completa.
- 649: restante compatibilita' di finestra, ritmo o armonia da approfondire.
- 2: stessa registrazione.

Provati separatamente e insieme: requisito degli impulsi limitato alla
sovrapposizione effettiva (senza rimuovere battiti attesi) e 82 confini vocali
candidati da regioni del modello del brano intero. Risultato ancora zero:
nessuna di queste modifiche sperimentali viene applicata al motore pubblico.
Le regioni dei modelli non certificano assenza di voce o frasi musicali.
Il compilatore accetta ora un indice esplicito per esperimenti personali
riproducibili senza confondere lo scope con il catalogo globale.

## Ripristino sessione: candidata PR67

Due ore per la selezione, cinque ore per la sola cronologia casuale
personale; coda manuale, download e altri account conservati. Ripresa reale
del decoder verificata, senza autoplay e senza rivelare l'inizio da zero.
Il rientro dopo scadenza riproduceva un titolo fantasma: corretto insieme
alla copertina. Anche volume/mute durante l'attesa rispetta la conferma del
seek. Il limite nominale di ripristino e' 6,5 s, poi pausa e nuovo tentativo.

13 test mirati e sei scenari reali con Il Filmografo, inclusi reset decoder
su Play e assenza RAF come guasti dichiarati. Aggiornamento effettivo worker
6.738 -> 6.738 verificato in WebKit: nuovo player offline, cache audio dei
tre account e dati persistenti conservati. Il rapporto della pubblicazione
separata registra il commit finale e le matrici Linux/macOS definitive.

## Limiti e regressioni dichiarate

Due test storici Gym dipendono da vecchi dati non piu' presenti e restano
rossi: non nascosti, non aggirati, nessun cambiamento alla playlist. Il
rallentamento fisico dell'iPhone non e' riprodotto o attribuito all'app.
Non e' disponibile una prova su iPhone reale ne' un nuovo riferimento
indipendente della precisione delle frasi. La PR65 non viene rifatta.
Il primo attacco sperimentale e le cadenze Ste non sufficientemente
certificate restano nel ramo di ricerca, non nella versione pubblica.
Nessuna equivalenza a Spotify e nessun miglioramento inventato.
