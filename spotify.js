/* ---------- Importa una playlist di Spotify ----------

   Ste: "posso mettere il link della mia playlist di spotify e in automatico
   importa le canzoni?".

   Come funziona, e cosa NON fa:
   - Spotify non si puo' scaricare (ha una protezione, vale per tutti), quindi
     l'audio non viene da Spotify: viene da YouTube, come sempre.
   - Da Spotify prendiamo solo l'ELENCO delle canzoni, e serve l'accesso con
     l'account di Ste perche' le sue playlist sono private. Le playlist
     pubbliche si vedrebbero anche senza, ma il login serve per le sue.
   - L'accesso e' col metodo "authorization code con PKCE": non c'e' nessuna
     password e nessun segreto, e il permesso vale solo per questa app sul
     telefono di Ste.

   Il Client ID e' pubblico (non e' una password): puo' stare nel codice.
   Comunque lo teniamo in un posto solo cosi' e' facile cambiarlo. */
const SPOTIFY_CLIENT_ID = "97b894cf504b412fa96e5a7ced1880c4";
const SPOTIFY_REDIRECT = "https://stefanovillaggio8-dot.github.io/music-box/";
const SPOTIFY_SCOPI = "playlist-read-private playlist-read-collaborative";

let _spotifyAccess = null;
let _spotifyChiave = null;   /* la "code_verifier" dell'accesso in corso */

function _spotifySalvaToken(t) {
  try {
    LS.set("mb.spotify", {
      access: t.access_token,
      scadenza: Date.now() + (Number(t.expires_in || 3600) - 60) * 1000
    });
    return true;
  } catch (e) { return false; }
}
function _spotifyToken() {
  try {
    const v = LS.get("mb.spotify", null);
    if (!v || !v.access) return "";
    if (Number(v.scadenza || 0) < Date.now()) return "";
    return String(v.access);
  } catch (e) { return ""; }
}

/* Il codice di verifica per PKCE: una stringa casuale, e il suo "impronta"
   SHA-256 che Spotify pretende di vedere al posto della password. */
async function _spotifyPkce() {
  const byte = new Uint8Array(48);
  crypto.getRandomValues(byte);
  const base = (b) => btoa(String.fromCharCode.apply(null, b))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const verifier = base(byte);
  const somma = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier: verifier, sfida: base(new Uint8Array(somma)) };
}

/* Step 1: butto Ste su Spotify per l'accesso. */
async function _spotifyAccedi() {
  if (!SPOTIFY_CLIENT_ID) { toast("Manca il Client ID di Spotify"); return; }
  let pk;
  try { pk = await _spotifyPkce(); } catch (e) {
    toast("Il telefono non mi fa fare le operazioni sicure: usa Safari aggiornato");
    return;
  }
  _spotifyChiave = pk.verifier;
  const stato = base(String(Date.now()));
  try { LS.set("mb.spotifyStato", stato); } catch (e) { /* noop */ }
  const q = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: SPOTIFY_REDIRECT,
    scope: SPOTIFY_SCOPI,
    code_challenge: pk.sfida,
    code_challenge_method: "S256",
    state: stato
  });
  window.location.href = "https://accounts.spotify.com/authorize?" + q.toString();
}

/* Step 2: Spotify rimanda qui con ?code=... e io scambio il codice per il
   permesso vero. */
async function _spotifyCompletaAccesso(code, stato) {
  if (!code || !stato) return false;
  let salvato = "";
  try { salvato = String(LS.get("mb.spotifyStato", "")); } catch (e) {}
  if (!salvato || salvato !== stato) { toast("Accesso non valido, riprova"); return false; }
  const verifier = _spotifyChiave || "";
  if (!verifier) { toast("Accesso scaduto, riprova"); return false; }
  let r;
  try {
    r = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: SPOTIFY_REDIRECT,
        client_id: SPOTIFY_CLIENT_ID,
        code_verifier: verifier
      }).toString()
    });
  } catch (e) { toast("Non riesco a parlare con Spotify"); return false; }
  if (!r.ok) { toast("Spotify non ha accettato l'accesso"); return false; }
  const j = await r.json();
  _spotifySalvaToken(j);
  _spotifyChiave = null;
  try { LS.remove("mb.spotifyStato"); } catch (e) {}
  return true;
}

async function _spotifyApi(percorso) {
  const token = _spotifyToken();
  if (!token) return null;
  try {
    const r = await fetch("https://api.spotify.com/v1" + percorso, {
      headers: { Authorization: "Bearer " + token }
    });
    if (r.status === 401) return null;
    if (!r.ok) return null;
    return await r.json();
  } catch (e) { return null; }
}

/* Le playlist, anche le private: per queste serve l'accesso. */
async function _spotifyPlaylist() {
  const tutte = [];
  let url = "/me/playlists?limit=50";
  for (let pagina = 0; pagina < 4 && url; pagina++) {
    const j = await _spotifyApi(url);
    if (!j) break;
    for (const p of (j.items || [])) {
      tutte.push({
        id: p.id,
        nome: p.name,
        privata: p.public === false,
        canzoni: Number((p.tracks && p.tracks.total) || 0)
      });
    }
    url = j.next ? j.next.replace("https://api.spotify.com/v1", "") : "";
  }
  return tutte;
}

/* I titoli veri della playlist: qui Spotify dà i nomi, che è quello che
   mi serve (l'audio poi lo cerco su YouTube). */
async function _spotifyBrani(playlistId) {
  const brani = [];
  let url = "/playlists/" + playlistId + "/tracks?limit=100";
  for (let pagina = 0; pagina < 12 && url; pagina++) {
    const j = await _spotifyApi(url);
    if (!j) break;
    for (const it of (j.items || [])) {
      const t = it.track;
      if (!t || !t.name || t.is_local) continue;
      const chi = (t.artists || []).map((a) => a.name).filter(Boolean).join(", ");
      if (!chi) continue;
      brani.push(t.name.replace(/\s+/g, " ").trim() + "|" + chi.replace(/\s+/g, " ").trim());
    }
    url = j.next ? j.next.replace("https://api.spotify.com/v1", "") : "";
  }
  return brani;
}