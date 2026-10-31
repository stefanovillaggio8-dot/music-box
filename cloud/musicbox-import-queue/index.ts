// Music Box cloud queue: public submission is rate limited, workers use signed GitHub OIDC.
// Supabase service-role key NEVER leaves this server.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const PROJECT = "stefanovillaggio8-dot/music-box";
const ORIGINS = new Set([
  "https://stefanovillaggio8-dot.github.io",
  "http://localhost:8788",
  "http://127.0.0.1:8788",
  "http://192.168.1.40:8788"
]);
const URI = Deno.env.get("SUPABASE_URL") || "";
const SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const AUDIENCE = "musicbox-import-queue-v1";
function respond(data:unknown, code=200, origin="") {
  const allow = ORIGINS.has(origin) ? origin : "https://stefanovillaggio8-dot.github.io";
  return new Response(JSON.stringify(data), {
    status: code, headers: {
      "content-type": "application/json;charset=utf-8",
      "access-control-allow-origin": allow,
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
      "vary": "Origin",
      "cache-control": "no-store"
    }
  });
}
function base64urlToBytes(t:string): Uint8Array {
  const decoded = atob(t.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - t.length % 4) % 4));
  return Uint8Array.from(decoded, c => c.charCodeAt(0));
}
async function verifyWorker(req:Request):Promise<boolean> {
  try {
    const bearer = req.headers.get("authorization") || "";
    if (!bearer.startsWith("Bearer ")) return false;
    const token = bearer.slice(7);
    const segments = token.split(".");
    if (segments.length !== 3) return false;
    const header = JSON.parse(new TextDecoder().decode(base64urlToBytes(segments[0])));
    const claims = JSON.parse(new TextDecoder().decode(base64urlToBytes(segments[1])));
    const now = Math.floor(Date.now()/1000);
    if (header.alg !== "RS256" || !header.kid ||
      claims.iss !== "https://token.actions.githubusercontent.com" ||
      claims.aud !== AUDIENCE ||
      claims.repository !== PROJECT ||
      claims.ref !== "refs/heads/main" ||
      !["schedule","workflow_dispatch","push"].includes(claims.event_name) ||
      !String(claims.workflow_ref||"").includes("/.github/workflows/process-mobile-imports.yml@refs/heads/main") ||
      !Number.isFinite(claims.exp) || claims.exp < now ||
      !Number.isFinite(claims.nbf || claims.iat) || (claims.nbf || claims.iat) > now + 30)
      return false;
    const keysResponse = await fetch("https://token.actions.githubusercontent.com/.well-known/jwks", {signal:AbortSignal.timeout(6000)});
    if (!keysResponse.ok) return false;
    const keys = await keysResponse.json();
    const jwk = (keys.keys || []).find((k:Record<string,string>) => k.kid === header.kid && k.kty === "RSA");
    if (!jwk) return false;
    const cryptoKey = await crypto.subtle.importKey("jwk", jwk, {name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"}, false, ["verify"]);
    return await crypto.subtle.verify("RSASSA-PKCS1-v1_5", cryptoKey,
      base64urlToBytes(segments[2]), new TextEncoder().encode(segments[0]+"."+segments[1]));
  } catch (e) { console.error("worker verification error", String(e)); return false; }
}
async function database(query:string, init:RequestInit={}) {
  if (!URI || !SECRET) throw new Error("Il servizio dati non e' configurato");
  const response = await fetch(URI + "/rest/v1/musicbox_import_requests" + query, {
    ...init,
    headers: {
      "apikey":SECRET, "authorization":"Bearer "+SECRET,
      "content-type":"application/json",
      "prefer": "return=representation", ...(init.headers||{})
    }
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : [];
  if (!response.ok) {
    console.error("Music Box DB error", response.status, data);
    throw new Error(response.status===409 ? "Questo video e' gia' nella libreria o in coda" :
      response.status===400 && data?.message ? String(data.message).slice(0,180) :
      "Errore nel salvataggio ("+response.status+")");
  }
  return data;
}
function extractVideo(link:string) {
  try {
    const u = new URL(link);
    if(u.protocol !== "https:") return "";
    let id = "";
    if (["youtu.be","www.youtu.be"].includes(u.hostname)) id = u.pathname.split("/")[1]||"";
    else if(["youtube.com","www.youtube.com","m.youtube.com","music.youtube.com"].includes(u.hostname)) {
      if(u.pathname === "/watch") id=u.searchParams.get("v")||"";
      else if(/^\/(shorts|live)\/[^/]+\/?$/.test(u.pathname)) id=u.pathname.split("/")[2]||"";
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : "";
  } catch { return ""; }
}
const uuid = (s:string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
Deno.serve(async req => {
  const origin = req.headers.get("origin")||"";
  if(req.method==="OPTIONS") return respond({},200,origin);
  if(origin && !ORIGINS.has(origin)) return respond({ok:false,error:"Origine non autorizzata"},403,origin);
  try {
    const url = new URL(req.url);
    // Links already submitted belong to the named Music Box profile.
    // Only safe public playback metadata is returned (never IP hashes or tokens).
    if(req.method==="GET" && url.searchParams.get("action")==="links") {
      const profile=String(url.searchParams.get("profile")||"").trim();
      if(!profile || profile.length>40 || !/^[\\p{L}\\p{N}_. -]+$/u.test(profile))
        return respond({ok:false,error:"Profilo non valido"},400,origin);
      const rows=await database("?profile=eq."+encodeURIComponent(profile)+
        "&select=id,profile,video_id,requested_title,status,created_at,error_message"+
        "&order=created_at.desc&limit=60");
      return respond({ok:true,links:rows.map((x:Record<string,unknown>)=>({
        id:x.id,profile:x.profile,video_id:x.video_id,
        title:x.requested_title || "Video YouTube",status:x.status,
        created_at:x.created_at,error_message:x.error_message
      }))},200,origin);
    }
    if(req.method==="GET" && url.searchParams.get("action")==="status") {
      const id=url.searchParams.get("id")||"";
      if(!uuid(id)) return respond({ok:false,error:"Codice richiesta non valido"},400,origin);
      const rows=await database("?id=eq."+id+"&select=id,status,profile,created_at,finished_at,result_file,error_message&limit=1");
      if(!rows.length) return respond({ok:false,error:"Richiesta non trovata"},404,origin);
      return respond({ok:true,job:rows[0]},200,origin);
    }
    if(req.method!=="POST") return respond({ok:false,error:"Metodo non valido"},405,origin);
    const raw=await req.text();
    if(raw.length>2500) return respond({ok:false,error:"Richiesta troppo grande"},413,origin);
    const data=JSON.parse(raw||"{}");
    if(data.action==="create") {
      if(origin && !ORIGINS.has(origin)) return respond({ok:false,error:"Origine non autorizzata"},403,origin);
      if(data.rights!==true) return respond({ok:false,error:"Conferma i diritti per importare questo audio"},400,origin);
      const video_id=extractVideo(String(data.link||""));
      const profile=String(data.profile||"").trim().slice(0,41);
      const requested_title=String(data.title||"").trim().slice(0,161);
      if(!video_id || !profile || profile.length>40 || !/^[\p{L}\p{N}_. -]+$/u.test(profile) || requested_title.length>160)
        return respond({ok:false,error:"Link, nome o profilo non valido"},400,origin);
      const ip=(req.headers.get("cf-connecting-ip")||req.headers.get("x-forwarded-for")||"unidentified").split(",")[0].trim().slice(0,100);
      const seed=new TextEncoder().encode(SECRET+":"+ip);
      const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",seed))).map(x=>x.toString(16).padStart(2,"0")).join("");
      const rows=await database("",{method:"POST",body:JSON.stringify({profile,video_id,requested_title,client_hash:hash})});
      return respond({ok:true,id:rows[0].id,status:"queued"},201,origin);
    }
    if(data.action==="claim" || data.action==="finish") {
      if(!await verifyWorker(req)) return respond({ok:false,error:"Autenticazione worker negata"},401,origin);
      if(data.action==="claim") {
        const rows=await database("?status=eq.queued&select=id,profile,video_id,requested_title,attempts&order=created_at.asc&limit=1");
        if(!rows.length) return respond({ok:true,job:null},200,origin);
        const job=rows[0];
        const claimed=await database("?id=eq."+job.id+"&status=eq.queued",{
          method:"PATCH",body:JSON.stringify({status:"running",started_at:new Date().toISOString(),attempts:job.attempts+1})
        });
        return respond({ok:true,job:claimed.length?{...job,status:"running"}:null},200,origin);
      }
      const id=String(data.id||"");
      if(!uuid(id) || !["completed","failed"].includes(data.status))
        return respond({ok:false,error:"Risultato non valido"},400,origin);
      const result_file=String(data.file||"").slice(0,110);
      if(data.status==="completed" && !/^songs\/youtube-[A-Za-z0-9_-]{11}\.mp3$/.test(result_file))
        return respond({ok:false,error:"File non valido"},400,origin);
      const updated=await database("?id=eq."+id+"&status=eq.running", {
        method:"PATCH",body:JSON.stringify({
          status:data.status,finished_at:new Date().toISOString(),
          error_message:data.status==="failed"?String(data.error||"Non disponibile").slice(0,180):null,
          result_file:data.status==="completed"?result_file:null
        })
      });
      return respond({ok:updated.length===1},updated.length?200:409,origin);
    }
    return respond({ok:false,error:"Azione sconosciuta"},400,origin);
  } catch(e) {
    console.error("Music Box service error",String(e));
    return respond({ok:false,error:String((e as Error).message||"Errore inatteso").slice(0,180)},400,origin);
  }
});
