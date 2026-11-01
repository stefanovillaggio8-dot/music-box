// Music Box: private two-person listening rooms. Only high-entropy invite tokens
// authorize access; the service key never leaves this Edge Function.
const DB = Deno.env.get("SUPABASE_URL")!;
const SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}").default;
const endpoint = DB + "/rest/v1/musicbox_listening_rooms";
const common = {"content-type":"application/json","cache-control":"no-store"};
function json(data: unknown,status=200){
  return new Response(JSON.stringify(data),{status,headers:{...common,"Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST, OPTIONS"}});
}
function token(){const b=crypto.getRandomValues(new Uint8Array(32));return [...b].map(x=>x.toString(16).padStart(2,"0")).join("");}
async function hash(id:string,t:string){const bytes=new TextEncoder().encode(id+":"+t);const buf=await crypto.subtle.digest("SHA-256",bytes);return [...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,"0")).join("");}
function validProfile(p:unknown){return String(p||"").trim().slice(0,40);}
function cleanTracks(raw:unknown){
  if(!Array.isArray(raw))return [];
  const out:any[]=[],seen=new Set<string>();
  for(const t of raw.slice(0,1200)){
    const f=String(t?.file||"");
    const cloud=/^cloud\/youtube-[A-Za-z0-9_-]{11}\.mp3$/.test(f);
    const pubblico=/^songs\/(?:track-\d+|youtube-[A-Za-z0-9_-]{11})\.mp3$/.test(f);
    if(!pubblico&&!cloud)continue;
    const audioUrl=String(t?.url||"");
    const cloudValido=/^https:\/\/adnteitlhopehllutlua\.supabase\.co\/functions\/v1\/musicbox-import-queue\?action=audio&id=[0-9a-f-]{36}$/i.test(audioUrl);
    if(cloud&&!cloudValido)continue;
    const owner=validProfile(t?.profile);
    if(!owner)continue;
    const key=owner+":"+f;
    if(seen.has(key))continue;seen.add(key);
    out.push({key,file:f,profile:owner,title:String(t?.title||"Brano").slice(0,150),
      artist:String(t?.artist||"").slice(0,100),...(cloud?{url:audioUrl}:{})});
  }
  return out;
}
function randomOrder(items:any[]){
  const list=[...items];
  for(let i=list.length-1;i>0;i--){const b=new Uint32Array(1);crypto.getRandomValues(b);const j=b[0]%(i+1);[list[i],list[j]]=[list[j],list[i]];}
  return list;
}
function merge(a:any[],b:any[]){
  const seen=new Set<string>();return [...a,...b].filter(t=>{if(seen.has(t.key))return false;seen.add(t.key);return true;});
}
async function rest(method:string,path:string,body?:unknown,prefer="return=representation"){
  const h:Record<string,string>={...common,apikey:SECRET,Authorization:"Bearer "+SECRET,Prefer:prefer};
  const r=await fetch(endpoint+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)});
  const content=await r.text();let data:any=null;try{data=content?JSON.parse(content):null}catch{}
  if(!r.ok)throw new Error("Database unavailable: "+r.status);
  return data;
}
function present(room:any) {
  return {id:room.id,hostProfile:room.host_profile,guestProfile:room.guest_profile,
    joined:!!room.guest_profile,playlist:room.playlist,currentIndex:room.current_index,
    playing:room.playing,offset:room.offset_seconds,startedAt:room.started_at,
    updatedAt:room.updated_at,revision:room.revision,serverNow:new Date().toISOString(),
    expiresAt:room.expires_at};
}
Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return json({ok:true});
  if(req.method!=="POST")return json({ok:false,error:"Only POST supported"},405);
  try{
    const input=await req.text();
    if(input.length>210000)return json({ok:false,error:"Request too large"},413);
    const data=JSON.parse(input||"{}"),action=String(data.action||"");
    if(action==="create"){
      const p=validProfile(data.profile),tracks=cleanTracks(data.tracks);
      if(!p||!tracks.length)return json({ok:false,error:"Choose a profile with published songs"},400);
      const id=crypto.randomUUID(),host=token(),guest=token(),playlist=randomOrder(tracks);
      await rest("POST","",{id,host_hash:await hash(id,host),guest_hash:await hash(id,guest),
        host_profile:p,host_tracks:tracks,playlist});
      return json({ok:true,id,hostToken:host,guestToken:guest});
    }
    const id=String(data.id||""),auth=String(data.token||"");
    if(!/^[0-9a-f-]{36}$/i.test(id)||!/^[0-9a-f]{64}$/.test(auth))return json({ok:false,error:"Invalid invitation"},403);
    const rows=await rest("GET","?id=eq."+encodeURIComponent(id)+"&select=*&limit=1");
    const room=rows?.[0];
    if(!room||Date.parse(room.expires_at)<Date.now())return json({ok:false,error:"Room not found or expired"},404);
    const digest=await hash(id,auth);
    const role=digest===room.host_hash?"host":digest===room.guest_hash?"guest":"";
    if(!role)return json({ok:false,error:"Invitation not authorized"},403);
    if(action==="state")return json({ok:true,role,room:present(room)});
    if(action==="join"){
      if(role!=="guest")return json({ok:false,error:"Host already joined"},403);
      const profile=validProfile(data.profile),tracks=cleanTracks(data.tracks);
      if(!profile||!tracks.length)return json({ok:false,error:"Select songs from your library"},400);
      /* Once someone has joined the slot is bound to their chosen profile. */
      if(room.guest_profile&&room.guest_profile!==profile)
        return json({ok:false,error:"Room already has a different guest profile"},409);
      // Riaprire lo stesso invito non deve rimescolare la coda o fermare l\u0027audio.
      if(room.guest_profile===profile)return json({ok:true,role,room:present(room)});
      const list=randomOrder(merge(room.host_tracks,tracks));
      const updates={guest_profile:profile,guest_tracks:tracks,playlist:list,
        current_index:0,playing:false,offset_seconds:0,started_at:null,
        revision:Number(room.revision)+1,updated_at:new Date().toISOString()};
      const edited=await rest("PATCH","?id=eq."+id+"&revision=eq."+room.revision,updates);
      if(!edited?.length)return json({ok:false,error:"Room changed, try again"},409);
      return json({ok:true,role,room:present(edited[0])});
    }
    if(action==="control"){
      if(!room.guest_profile)return json({ok:false,error:"Wait for your friend to join"},409);
      const cmd=String(data.command||""),items=room.playlist||[];
      let index=Math.max(0,Math.min(items.length-1,Number(room.current_index)||0));
      let playing=!!room.playing,offset=Math.max(0,Number(room.offset_seconds)||0);
      const elapsed=playing&&room.started_at?Math.max(0,(Date.now()-Date.parse(room.started_at))/1000):0;
      offset+=elapsed;
      /* Due telefoni possono arrivare alla fine del brano quasi nello
         stesso istante: applica Next una sola volta per revisione. */
      if((cmd==="next"||cmd==="previous"||cmd==="select")&&
         Number(data.expectedRevision)!==Number(room.revision))
        return json({ok:false,error:"Song already changed; resync"},409);
      if(cmd==="select") {
        const requested=Number(data.index);
        if(!Number.isInteger(requested)||requested<0||requested>=items.length)
          return json({ok:false,error:"Invalid track index"},400);
        index=requested;offset=0;playing=true;
      }
      else if(cmd==="next") {index=(index+1)%items.length;offset=0;playing=true;}
      else if(cmd==="previous") {index=(index-1+items.length)%items.length;offset=0;playing=true;}
      else if(cmd==="play") playing=true;
      else if(cmd==="pause") playing=false;
      else if(cmd==="seek") offset=Math.max(0,Math.min(36000,Number(data.seconds)||0));
      else if(cmd==="reshuffle") {const shuffled=randomOrder(items);await rest("PATCH","?id=eq."+id+"&revision=eq."+room.revision,
        {playlist:shuffled,current_index:0,playing:false,offset_seconds:0,started_at:null,
         revision:Number(room.revision)+1,updated_at:new Date().toISOString()}).then(rows=>{if(!rows?.length)throw Error("Room changed");});
        return json({ok:true});
      }else return json({ok:false,error:"Unknown command"},400);
      const edited=await rest("PATCH","?id=eq."+id+"&revision=eq."+room.revision,
        {current_index:index,playing,offset_seconds:offset,started_at:playing?new Date().toISOString():null,
         revision:Number(room.revision)+1,updated_at:new Date().toISOString()});
      if(!edited?.length)return json({ok:false,error:"Room changed, try again"},409);
      return json({ok:true,room:present(edited[0])});
    }
    return json({ok:false,error:"Unknown action"},400);
  }catch(err){return json({ok:false,error:String(err instanceof Error?err.message:err).slice(0,180)},500);}
});
