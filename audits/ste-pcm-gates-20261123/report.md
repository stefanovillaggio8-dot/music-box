# Ste: verifica dei limiti PCM dopo il recupero

L'ultima operazione interrotta (verifica pubblicazione PR67 e allineamento
PR59) e' stata completata, conservando i successivi aggiornamenti main fino
a 2425dd10. Sono invariati appartenenze e tutti i cinque campi musicali
avanzati. Il Karaoke PR65 resta a frasi.

Sul medesimo campione SHA-bound gia' disponibile: 222 registrazioni Ste,
24 della coorte Kid Yugi, 10.056 coppie ordinate, due alias della stessa
registrazione esclusi. Nessuna nuova estrazione, nessun modello sul telefono.

Due esperimenti offline distinti, nessuna modifica al motore pubblico:

1. Il filtro preliminare di intro ritmica viene sostituito, nella sola
   ricerca, dai controlli PCM completi gia' esistenti: zero proposte.
2. Si esplora l'asimmetria vocale: quando il modello dell'intero brano
   non segnala voce in tutta la finestra uscente, si consente di cercare
   anche un ingresso vocale. E' un'ipotesi, non certificazione di assenza
   di voce; identita' SHA, confine LRC positivo, protezione contenuto,
   attacchi e armonia mantengono i controlli. Risultato ancora zero.

La strumentazione della seconda ipotesi conta 112.709 varianti e 43.555
finestre effettivamente sottoposte alla coincidenza degli impulsi, su 1.147
coppie SHA distinte. 21.026 finestre falliscono il minimo di otto impulsi;
22.529 falliscono la corrispondenza richiesta. Nessuna arriva al controllo
armonico. Non e' dimostrata un'incompatibilita' armonica dei brani scartati.
Le varianti di tempo rifiutate non vanno interpretate come coppie intere
incompatibili: una coppia puo' avere sia varianti accettabili sia scartate.
I contatori sono annidati/sovrapposti, non percentuali indipendenti.

La ricerca salva 25 casi vicini al limite soltanto per studio: il migliore
ha 8/9 attacchi (88,89%) e 36,23 ms RMS, inferiore al 90% richiesto; resta
scartato. Nessuna soglia e' abbassata e nessun dato del prototipo entra
nell'indice del player. Le patch in questa cartella riproducono gli
esperimenti contro il commit/hashes dichiarati; non sono patch pubblicabili.
Le frasi e i downbeat dei modelli restano ipotesi da controllare sul rendering.

Coppie realmente disponibili invariate: Ste 1 completa/1 parziale, Diego
1/0, Emanuele 7/5. Le simulazioni con stessi membri e algoritmo erano gia'
state completate e non vengono rieseguite per un esperimento che produce
zero proposte e non cambia il player. La copertura rimane insufficiente.

Un miglioramento separato del display delle pause Karaoke e' stato
implementato e verificato nella PR68: vedi audits/releases/6.739/report.md.
Non altera l'illuminazione dell'intera frase della PR65 e non rivendica
un incremento della precisione del riconoscimento acustico.
