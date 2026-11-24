# Ricerca esclusivamente Ste dal checkpoint 87390a98

## Confini e avanzamenti preservati

HEAD PR59 verificato 87390a98, main 56ff510d (6.739); nessuna modifica
locale al player rimasta incompleta. Nuova ricerca soltanto Ste personale,
222 registrazioni analizzabili, Gym esclusa senza alterarne i contenuti.
Nessuna nuova campagna, simulazione o certificazione degli altri account.
Le analisi precedenti di tutti gli account restano intatte. Il Karaoke a
frasi della PR65 e la 6.739 non sono modificati.

Gia' conclusi e non ripetuti: ricerca delle 10.056 coppie della coorte,
varianti BPM, confini vocali ipotetici, eliminazione del filtro preliminare,
asimmetria vocale e prove di cadenza/native. L'esperimento 451->315 non
rientra interamente nell'attuale libreria Ste e non viene proseguito.

## Prova nuova, limitata e fallita

Tre finestre gia' note, sei registrazioni personali, nessuna ricerca
esaustiva. Due casi di sviluppo: Grignani -> Tristano e Isotta e Stratos
-> Star Shopping. Paraguai -> Per il Sangue Versato separato prima della
prova come controllo non usato per definire il metodo; non e' una nuova
raccolta indipendente di riferimenti vocali.

Gli MP3 originali sono verificati con Git blob SHA e SHA256. Solo i segmenti
necessari vengono decodificati, senza download o modelli nuovi. Ogni
attacco resta presente e ordinato: nessuna aggiunta, eliminazione o correzione
verso il brano partner. Affinamento indipendente entro 40 ms, griglie e
finestre complete conservate, geometria/tempo dei tre casi congelati.

| Coppia Ste | Accordo prima | Con energia stereo a 3 ms | Con interpolazione dei picchi HPSS |
| --- | ---: | ---: | ---: |
| Grignani -> Tristano e Isotta | 13/15, 86,67% | 13/15, 86,67% | 13/15, 86,67% |
| Stratos -> Star Shopping | 15/17, 88,24% | 11/17, 64,71% | 13/17, 76,47% |
| Paraguai -> Per il Sangue Versato | 19/23, 82,61% | 17/23, 73,91% | 19/23, 82,61% |

Tutti i casi restano sotto il 90% gia' richiesto. Il terzo aveva gia' RMS
19,09 ms: migliorare la sola precisione temporale non risolve il numero di
impulsi concordanti. Non e' dimostrata un'incompatibilita' armonica: questi
casi non superano il controllo ritmico preliminare. Le due tecniche sono
respinte e archiviate in experiments/, non collegate al motore o all'indice
pubblico. Nessun rendering di nuova transizione presentato come valido.

Il confronto con i dati Beat This gia' disponibili spiega anche perche'
non basta scegliere il caso piu' vicino al limite: nella vecchia ipotesi
Wonderwall -> Gilgamesh, i beat del modello uscente si fermano a 260,68 s,
mentre la sovrapposizione candidata iniziava a 270,20 s. Gli attacchi tardivi
non certificano battute. Tale caso non riceve una nuova analisi PCM. Anche
quando le ipotesi di battuta indicano un tempo simile, restano da dimostrare
attacchi condivisi e struttura; i modelli non sono verita' musicali.

## Controllo del lavoro e del costo

Le tre campagne globali di estrazione PCM, ricerca delle finestre e audit
esaustivo diventano manuali: non ripartono a ogni salvataggio della PR.
I vecchi comandi globali non sono autorizzati dalla ricerca corrente.
I test di regressione essenziali e l'analisi base gia' attiva in produzione
restano abilitati, senza toccare dati, cache o librerie.

Il nuovo tools/ste-research-scope.cjs esegue le regole effettive dell'app,
include gli import pubblicati, esclude Gym e lega lo snapshot a app, indice,
stato, playlist e manifesto importazioni. Non accetta un altro profilo,
file fuori appartenenza, SHA cambiati, duplicati o piu' di quattro casi.
Nessun audio viene decodificato dal controllo. Le fonti devono restare
immutate durante l'esportazione; nessun dato utente viene scritto.

## Disponibilita' e verifiche

Ste resta a **1 completa e 1 parziale**, nessuna nuova coppia certificata:
End of Beginning -> la mia storia tra le dita; Sono Ok -> Gilgamesh.
Due regressioni mirate sul pianificatore confermano le classi distinte,
l'ingresso da zero e la lettura fino al finale originale. Non sono nuove
certificazioni audio. Nessuna simulazione di shuffle viene ripetuta per
un motore non modificato e per prototipi che non hanno superato i controlli.

25/25 test di scope, import, isolamento e casuale superati; 3/3 controlli
Python del prototipo superati (validano i limiti, non la qualita' musicale).
Player, Karaoke, indice, playlist, preferiti e download sono invariati.
Nessuna prova su iPhone fisico e nessuna equivalenza a Spotify.

Prossimo lavoro utile: distinguere errori delle griglie locali da vere
pulsazioni incompatibili, usando osservazioni metriche e acustiche separate
sui soli casi Ste. Non ripetere questi due stimatori o il campione globale
con gli stessi ingressi, e non promuovere un parziale a completo. Prima di
altro rendering servono ritmo, battute, voce e armonia sufficientemente
supportati. Le prove di clock nativo della cadenza Ste restano distinte e
non vengono aggirate con offset adattati.

## Pubblicazione dei soli controlli di ricerca

PR69 unita nel commit 379830d5728846445005e42a840b5deced8ab9c9. Candidata
d9a415828b357c2f10c8acbc920c3d5aa80a473b: 25/25 regressioni pertinenti
nell'ambiente isolato e CI 45101049035 superata con sei contratti rapidi.
Il workflow Ste-only risulta attivo su main. Tag di ripristino:
music-box-v6.739-before-ste-research-policy-20261123.

Tutti gli undici file del player, audio, Karaoke, indice e dati personali
sono identici al main precedente, verificati prima del merge. La versione
app resta 6.739: non e' un nuovo miglioramento musicale. I prototipi
respinti restano soltanto archivio nella PR59, mantenuta in bozza.
