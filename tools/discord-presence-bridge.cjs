"use strict";
// Music Box -> standard Discord Desktop via local RPC. No packages or bot tokens.
// HTTP binds only to 127.0.0.1 and accepts only known Music Box web origins.
const http=require("node:http"),net=require("node:net"),os=require("node:os"),path=require("node:path"),crypto=require("node:crypto");
const PORT=8792,ORIGINS=new Set(["https://stefanovillaggio8-dot.github.io","http://localhost:8791","http://127.0.0.1:8791","http://localhost:8788","http://127.0.0.1:8788"]);
const paths=process.env.MUSICBOX_TEST_IPC?[process.env.MUSICBOX_TEST_IPC]:Array.from({length:10},(_,i)=>process.platform==="win32"?"\\\\?\\pipe\\discord-ipc-"+i:path.join(process.env.XDG_RUNTIME_DIR||process.env.TMPDIR||process.env.TMP||os.tmpdir(),"discord-ipc-"+i));
let socket=null,ready=false,busy=false,appId="",buffer=Buffer.alloc(0),serial=0,lastError="Discord non connesso",item=null,lastSeen=0,lastSent=0,sent="";
const validId=id=>typeof id==="string"&&/^[0-9]{17,21}$/.test(id);
const clean=(x,n=120)=>String(x||"").replace(/[\x00-\x1f\x7f]/g," ").trim().slice(0,n);
function safeCoverURL(value){
 if(typeof value!=="string"||!value.trim())return "";
 try{
  const url=new URL(value);
  if(url.protocol!=="https:"||url.username||url.password||url.port||url.href.length>300)return "";
  const host=url.hostname.toLowerCase();
  if(host==="localhost"||host.endsWith(".localhost")||host.endsWith(".local")||
     host==="0.0.0.0"||host==="::1"||/^(\d{1,3}\.){3}\d{1,3}$/.test(host)||
     host.startsWith("10.")||host.startsWith("192.168.")||host.startsWith("172."))return "";
  return url.href;
 }catch(_){return "";}
}
function packet(op,value){const data=Buffer.from(JSON.stringify(value));const header=Buffer.alloc(8);header.writeUInt32LE(op,0);header.writeUInt32LE(data.length,4);return Buffer.concat([header,data]);}
function reset(){const old=socket;socket=null;ready=false;busy=false;buffer=Buffer.alloc(0);sent="";serial++;if(old)old.destroy();}
function send(force=false){
 if(!socket||!ready)return;
 const now=Date.now(),s=JSON.stringify(item?{title:item.title,artist:item.artist,cover:item.cover,duration:item.duration,seek:Math.round((now/1000-item.position)/5)}:null);
 if(!force&&s===sent&&now-lastSent<12000)return;
 const args={pid:process.pid,activity:null};
 if(item){
   const start=Math.floor(now/1000-item.position);
   args.activity={type:2,details:item.title,state:item.artist||"Music Box",timestamps:{start}};
   if(item.duration>0)args.activity.timestamps.end=start+item.duration;
   // Album artwork when available; otherwise show Music Box's own icon, never a "?".
   // Preserve the existing Discord application name (spotifynonavraiimieisoldi).
   const logo="https://stefanovillaggio8-dot.github.io/music-box/discord-fallback.webp";
   args.activity.assets={
     large_image:item.cover||logo,
     large_text:item.cover?item.title:"Music Box"
   };
   if(item.cover){
     args.activity.assets.small_image=logo;
     args.activity.assets.small_text="Music Box";
   }
 }
 try{socket.write(packet(1,{cmd:"SET_ACTIVITY",args,nonce:crypto.randomUUID()}));sent=s;lastSent=now;}
 catch(e){lastError=clean(e.message);reset();}
}
function frames(chunk){
 buffer=Buffer.concat([buffer,chunk]);
 if(buffer.length>1048576){reset();return;}
 while(buffer.length>=8){
  const op=buffer.readUInt32LE(0),len=buffer.readUInt32LE(4);
  if(len>1048576){reset();return;}
  if(buffer.length<8+len)return;
  let msg;try{msg=JSON.parse(buffer.subarray(8,8+len).toString());}catch(e){reset();return;}
  buffer=buffer.subarray(8+len);
  if(op===3){socket?.write(packet(4,msg));continue;}
  if(op===2){lastError="Discord ha chiuso la connessione";reset();return;}
  if(op===1&&msg.evt==="READY"){ready=true;busy=false;lastError="";send(true);}
  if(op===1&&msg.evt==="ERROR")lastError=clean(msg.data?.message||"Rich Presence rifiutata");
 }
}
function tryPipe(n,tag){
 if(tag!==serial)return;
 if(n>=paths.length){busy=false;lastError="Discord Desktop non trovato: aprilo sul PC";return;}
 let opened=false;const candidate=net.createConnection(paths[n]);
 const timeout=setTimeout(()=>candidate.destroy(),1500);
 candidate.once("connect",()=>{
  if(tag!==serial){candidate.destroy();return;}
  opened=true;clearTimeout(timeout);socket=candidate;buffer=Buffer.alloc(0);
  candidate.on("data",frames);candidate.write(packet(0,{v:1,client_id:appId}));
 });
 candidate.on("error",e=>{if(opened&&tag===serial)lastError=clean(e.message);});
 candidate.on("close",()=>{
  clearTimeout(timeout);if(tag!==serial)return;
  if(!opened){tryPipe(n+1,tag);return;}
  if(socket===candidate){socket=null;ready=false;busy=false;sent="";lastError||="Discord disconnesso";}
 });
}
function connect(id){
 if(appId!==id){reset();appId=id;}
 if(!validId(appId)||socket||busy)return;
 busy=true;lastError="Collegamento a Discord...";tryPipe(0,serial);
}
function playback(data){
 if(!data||data.playing!==true)return null;
 const title=clean(data.title),artist=clean(data.artist),position=Number(data.position),duration=Number(data.duration);
 if(!title||!Number.isFinite(position)||position<0||position>86400)return null;
 const cover=safeCoverURL(data.cover);
 return {title,artist,position:Math.floor(position),duration:Number.isFinite(duration)&&duration>0&&duration<86400?Math.ceil(duration):0,cover};
}
function response(req,res,status,data){
 const origin=req.headers.origin,headers={"Content-Type":"application/json","Cache-Control":"no-store","Vary":"Origin","X-Content-Type-Options":"nosniff"};
 if(ORIGINS.has(origin)){headers["Access-Control-Allow-Origin"]=origin;headers["Access-Control-Allow-Private-Network"]="true";}
 res.writeHead(status,headers);res.end(JSON.stringify(data));
}
const server=http.createServer((req,res)=>{
 if(!["127.0.0.1:"+PORT,"localhost:"+PORT].includes(req.headers.host||""))return response(req,res,403,{ok:false,error:"Host non autorizzato"});
 const origin=req.headers.origin;
 if(origin&&!ORIGINS.has(origin))return response(req,res,403,{ok:false,error:"Origine non autorizzata"});
 if(req.method==="OPTIONS"){
  res.writeHead(204,{"Access-Control-Allow-Origin":origin||"null","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Private-Network":"true","Vary":"Origin"});res.end();return;
 }
 if(req.method==="GET"&&req.url==="/health")return response(req,res,200,{ok:true,connected:ready,connecting:busy,error:lastError});
 if(req.method!=="POST"||req.url!=="/activity")return response(req,res,404,{ok:false});
 if(!origin)return response(req,res,403,{ok:false,error:"Origine obbligatoria"});
 let raw="",tooBig=false;
 req.on("data",b=>{raw+=b.toString();if(Buffer.byteLength(raw)>4096){tooBig=true;req.destroy();}});
 req.on("end",()=>{
  if(tooBig)return;
  let data;try{data=JSON.parse(raw);}catch(e){return response(req,res,400,{ok:false,error:"JSON non valido"});}
  if(!validId(data.applicationId))return response(req,res,400,{ok:false,error:"Inserisci il Discord Application ID (17-21 cifre)"});
  item=playback(data);lastSeen=Date.now();connect(data.applicationId);send();
  response(req,res,200,{ok:true,connected:ready,connecting:busy,error:lastError});
 });
});
if(require.main===module){
 server.listen(PORT,"127.0.0.1",()=>{console.log("Music Box -> Discord: ponte pronto su 127.0.0.1:"+PORT);console.log("Apri Discord Desktop e ascolta da Music Box.");});
 setInterval(()=>{if(item&&Date.now()-lastSeen>25000){item=null;send(true);}if(validId(appId)&&!ready&&!busy)connect(appId);},5000).unref();
 function stop(){item=null;send(true);server.close();setTimeout(()=>process.exit(0),200).unref();}
 process.on("SIGINT",stop);process.on("SIGTERM",stop);
}
module.exports={server,packet,playback,validId,safeCoverURL,ORIGINS};
