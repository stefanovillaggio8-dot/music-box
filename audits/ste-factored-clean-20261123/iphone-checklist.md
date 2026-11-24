# Checklist diagnostica iPhone — non attiva Smart Mix nell'app

Prototipo separato: non modifica Music Box 6.740, account, code o download.
Non eseguire mentre stai ascoltando altro. Può riprodurre un frammento
iniziale di 100 ms e arresta intenzionalmente la prova dopo il passaggio.

Preparazione sul PC, dalla cartella del repository, solo sulla rete locale
fidata (il server espone esclusivamente tre MP3 Ste già verificati):

```
node tools/ste-clean-probe-server.cjs audits/ste-factored-clean-20261123/recordings.json 0.0.0.0
```

1. Collega iPhone e PC allo stesso Wi-Fi. In Safari apri
   `http://INDIRIZZO-LOCALE-DEL-PC:8765`. Non modificare né rimuovere la PWA.
2. Scegli “Con audio” e premi **Autorizza i due lettori**. Se il resoconto
   segnala interruzione del primo lettore, fermati: il percorso non è valido.
3. Premi **Esegui la prova**. Verifica che Gilgamesh continui regolarmente,
   Sono Ok entri dal suo inizio e il finale uscente arrivi alla fine senza
   pause, riavvii, duplicazioni o aumento di volume. L'arresto dopo un secondo
   dal passaggio è intenzionale; il report lo distingue da un errore.
4. Salva il resoconto. Ripeti con “Secondario muto”: verifica soprattutto se
   Safari rifiuta o interrompe l'audio quando il secondo elemento viene attivato.
5. In una terza prova torna alla Home durante l'attesa: il secondario deve
   essere annullato, senza attività di analisi. Registra se il primo continua
   o se iOS lo sospende. Questo non certifica il background della PWA.
6. Chiudi la pagina diagnostica. Riapri la PWA 6.740 e controlla normalmente
   play/pausa, seek, ripresa e una canzone già scaricata in modalità aereo.

Registrare versione iOS, Safari/PWA, eventuale cuffia/Bluetooth e i punti
udibili problematici. Un report JavaScript positivo non sostituisce l'ascolto.
Un esito positivo qui non autorizza automaticamente l'integrazione nell'app:
rimangono da verificare gestione della coda, MediaSession e foreground/background.
