# Music Box su Discord (Windows)

**Il nome Discord `spotifynonavraiimieisoldi` resta invariato.**
Il sito mostra titolo, artista, tempo e copertina del brano in Rich Presence.
In assenza della copertina, usa l'icona già presente in Music Box.

## Prima volta: installazione in background (una sola volta)

1. Tieni installati **Discord Desktop** e Node.js sul PC (Node.js risulta
   già installato se il vecchio ponte ha funzionato).
2. Usa l'applicazione Discord esistente associata a Music Box: **non cambiare
   il nome**. In Music Box > Amici online > Discord lascia il suo Application ID.
3. Scarica nuovamente **tools/avvia-discord-presence.bat** dal repository
   GitHub e aprilo una volta sola. Scaricherà l'installer ufficiale e
   registrerà in **Esecuzione automatica** di Windows un avvio nascosto
   per l'utente corrente. Nessuna password e nessun amministratore.
4. Se hai ancora la **vecchia finestra nera**, chiudila dopo che il nuovo
   installer ha terminato. In futuro non ti servirà.
5. Da ora in poi il ponte parte automaticamente dopo l'accesso a Windows,
   senza finestre visibili. Discord Desktop deve essere aperto affinché
   Discord possa mostrare la presenza. La pagina Music Box deve riprodurre
   una canzone.

L'installer aggiorna la copia locale del ponte ogni volta che lo riapri
ed evita duplicati terminando **solo** i vecchi processi Node del ponte Music Box.
Il ponte riceve le informazioni esclusivamente da Music Box via localhost
(127.0.0.1:8792), non ascolta sulla rete Wi-Fi e non legge token Discord.

## Copertine

Il ponte prova a usare la copertina pubblica HTTPS del brano. Se il
brano ha una copertina solo locale o non disponibile, viene usato il
logo già presente in Music Box. L'immagine può impiegare qualche secondo
a comparire per via della cache immagini di Discord. Non è necessario
rinominare l'app Discord.

## Come disattivarlo

Disattiva **Mostra su Discord** in Music Box per nascondere la musica.
Per impedire l'avvio automatico elimina il file **MusicBox Discord
Presence.vbs** dalla cartella Esecuzione automatica di Windows
(Win+R, digita **shell:startup**). Se è già avviato, chiudi il processo
node.exe che esegue **discord-presence-bridge.cjs** dal Task Manager.
Puoi anche eseguire lo script di installazione PowerShell con
l'opzione **-Remove** per fermarlo e rimuovere l'avvio automatico.

Il ponte resta necessario sul PC: Windows non permette al sito web di
avviare un programma locale da solo senza la tua installazione iniziale.
Su iPhone con PC spento questo metodo non è supportato.
