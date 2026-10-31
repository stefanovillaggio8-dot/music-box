// Music Box: immediate, server-side fallback for jobs that otherwise wait for GitHub cron.
// Only jobs with an explicit rights declaration enter this queue.
// Private Supabase Storage, never the visitor's iPhone.
type DB = (query: string, init?: RequestInit) => Promise<Record<string, unknown>[]>;
type Job = {id:string; video_id:string; attempts:number; retry_after:string|null};
const BUCKET="musicbox-cloud-audio";
const MAX_BYTES=24*1024*1024;
const videoId=(v:string)=>/^[A-Za-z0-9_-]{11}$/.test(v);
const uuid=(v:string)=>/^[a-f0-9-]{36}$/i.test(v);
function assertAudioAddress(raw:unknown):string {
  const url=new URL(String(raw||""));
  if(url.protocol!=="https:"||url.hostname!=="api.samplecut.app"||
    url.port||url.username||url.password||!/^\/d\/[A-Za-z0-9-]+$/.test(url.pathname))
    throw Error("Indirizzo audio esterno non attendibile");
  return url.href;
}
async function update(db:DB,id:string,patch:Record<string,unknown>) {
  return db("?id=eq."+id+"&status=eq.running",{method:"PATCH",body:JSON.stringify(patch)});
}
function errorText(e:unknown):string {
  return String(e instanceof Error?e.message:e||"Errore cloud").replace(/[\r\n]+/g," ").slice(0,140);
}
export async function convertQueuedNow(id:string,db:DB,uri:string,secret:string):Promise<void> {
  if(!uuid(id))return;
  let claimed:Job|null=null;
  try {
    const pending=await db("?id=eq."+id+
      "&status=eq.queued&select=id,video_id,attempts,retry_after&limit=1");
    const job=pending[0] as unknown as Job|undefined;
    if(!job||!videoId(String(job.video_id||"")))return;
    if(job.retry_after && new Date(job.retry_after).getTime()>Date.now())return;
    if(Number(job.attempts)>=3)return;
    const started=await db("?id=eq."+job.id+"&status=eq.queued",{
      method:"PATCH",body:JSON.stringify({
        status:"running",attempts:Number(job.attempts)+1,
        started_at:new Date().toISOString(),finished_at:null,
        retry_after:null,error_message:null
      })
    });
    if(started.length!==1)return; // another worker won the queue claim
    claimed={...job,attempts:Number(job.attempts)+1};
    const source="https://www.youtube.com/watch?v="+job.video_id;
    const response=await fetch("https://api.samplecut.app/v1/downloads",{
      method:"POST",redirect:"error",
      headers:{"content-type":"application/json","x-client-name":"musicbox"},
      body:JSON.stringify({url:source,format:"mp3",response:"url"}),
      signal:AbortSignal.timeout(96000)
    });
    const data=await response.json().catch(()=>({}));
    if(response.status!==201||!response.ok){
      const code=String(data?.error?.code||"http_"+response.status);
      throw Error("Samplecut "+code+": "+String(data?.error?.message||"sorgente non raggiungibile").slice(0,100));
    }
    if(data.format!=="mp3"||data.full!==true||!Number.isFinite(Number(data.track_duration_sec))||
       Number(data.track_duration_sec)<=0||Number(data.track_duration_sec)>720)
      throw Error("Samplecut: audio non completo, troppo lungo o formato invalido");
    const address=assertAudioAddress(data.download_url);
    const audio=await fetch(address,{redirect:"error",signal:AbortSignal.timeout(29000)});
    if(!audio.ok)throw Error("Download Samplecut HTTP "+audio.status);
    const length=Number(audio.headers.get("content-length")||0);
    if(length>MAX_BYTES)throw Error("MP3 maggiore di 24MB");
    if(!/audio\/mpeg|audio\/mp3|application\/octet-stream/i.test(audio.headers.get("content-type")||""))
      throw Error("Samplecut non ha restituito un file audio");
    const bytes=new Uint8Array(await audio.arrayBuffer());
    if(bytes.length<512||bytes.length>MAX_BYTES)
      throw Error("File MP3 vuoto o maggiore di 24MB");
    if(!((bytes[0]===73&&bytes[1]===68&&bytes[2]===51)||
      (bytes[0]===255&&(bytes[1]&0xe0)===0xe0)))
      throw Error("File MP3 senza intestazione valida");
    const name="youtube-"+job.video_id+".mp3";
    const uploaded=await fetch(uri+"/storage/v1/object/"+BUCKET+"/"+name,{
      method:"POST",
      headers:{"authorization":"Bearer "+secret,"apikey":secret,
        "content-type":"audio/mpeg","x-upsert":"true","cache-control":"max-age=86400"},
      body:bytes,signal:AbortSignal.timeout(17000)
    });
    if(!uploaded.ok)throw Error("Archivio cloud HTTP "+uploaded.status);
    await update(db,job.id,{
      status:"completed",finished_at:new Date().toISOString(),
      result_file:"cloud/"+name,error_message:null,retry_after:null
    });
    console.log("Music Box: audio cloud privato pronto per il lavoro",job.id);
  }catch(e){
    if(!claimed)return;
    const reason=errorText(e);
    const retryable=/rate_limited|source_unreachable|api_disabled|429|502|503|timeout|timed out|abort|network/i.test(reason);
    const retry=retryable && claimed.attempts<3;
    try{
      await update(db,id,{
        status:retry?"queued":"failed",
        retry_after:retry?new Date(Date.now()+claimed.attempts*15*60000).toISOString():null,
        finished_at:retry?null:new Date().toISOString(),
        result_file:null,
        error_message:retry?"Servizio audio temporaneamente occupato: ritento automaticamente al prossimo controllo.":reason
      });
    }catch(err){console.error("Music Box: aggiornamento stato cloud non riuscito",errorText(err));}
    console.warn("Music Box: conversione diretta non completata",id,reason);
  }
}
export async function recoverAndProcess(profile:string,db:DB,uri:string,secret:string){
  try{
    // Repair abandoned workers only after their maximum 12-minute job time.
    const threshold=new Date(Date.now()-15*60000).toISOString();
    const old=await db("?profile=eq."+encodeURIComponent(profile)+
      "&status=eq.running&started_at=lt."+encodeURIComponent(threshold)+
      "&select=id,attempts&limit=5");
    for(const item of old){
      const retries=Number(item.attempts||0);
      await db("?id=eq."+String(item.id)+"&status=eq.running&started_at=lt."+encodeURIComponent(threshold),{
        method:"PATCH",body:JSON.stringify({
          status:retries<3?"queued":"failed",
          retry_after:null,finished_at:retries<3?null:new Date().toISOString(),
          error_message:retries<3?"Il server precedente si è interrotto: ripartenza automatica.":
            "Server interrotto troppe volte: importazione non riuscita."
        })
      });
    }
    const next=await db("?profile=eq."+encodeURIComponent(profile)+
      "&status=eq.queued&select=id,retry_after,attempts&order=created_at.asc&limit=15");
    const due=next.find(x=>Number(x.attempts||0)<3&&
      (!x.retry_after||new Date(String(x.retry_after)).getTime()<=Date.now()));
    if(due)await convertQueuedNow(String(due.id),db,uri,secret);
  }catch(e){console.warn("Music Box: recupero coda non riuscito",errorText(e));}
}
export async function signedAudioUrl(
  id:string,db:DB,uri:string,secret:string):Promise<string|null>{
  if(!uuid(id))return null;
  const rows=await db("?id=eq."+id+
    "&status=eq.completed&select=video_id,result_file&limit=1");
  if(!rows.length)return null;
  const video=String(rows[0].video_id||"");
  if(!videoId(video)||rows[0].result_file!=="cloud/youtube-"+video+".mp3")return null;
  const response=await fetch(uri+"/storage/v1/object/sign/"+BUCKET+"/youtube-"+video+".mp3",{
    method:"POST",
    headers:{"authorization":"Bearer "+secret,"apikey":secret,"content-type":"application/json"},
    body:JSON.stringify({expiresIn:3600}),signal:AbortSignal.timeout(5000)
  });
  if(!response.ok)return null;
  const data=await response.json();
  const rel=String(data.signedURL||data.signedUrl||"");
  if(!rel.startsWith("/object/sign/"+BUCKET+"/"))return null;
  return uri+"/storage/v1"+rel;
}
