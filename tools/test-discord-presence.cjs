"use strict";
const assert=require("node:assert/strict"),net=require("node:net"),os=require("node:os"),path=require("node:path"),fs=require("node:fs");
const win=process.platform==="win32",ipc=win?"\\\\.\\pipe\\mb-discord-test-"+process.pid:path.join(os.tmpdir(),"mb-discord-test-"+process.pid+".sock");
process.env.MUSICBOX_TEST_IPC=ipc;
const bridge=require("./discord-presence-bridge.cjs"),sent=[];
const fake=net.createServer(socket=>{
 let buffer=Buffer.alloc(0);
 socket.on("data",buf=>{
  buffer=Buffer.concat([buffer,buf]);
  while(buffer.length>=8){
   const size=buffer.readUInt32LE(4);
   if(buffer.length<8+size)break;
   const op=buffer.readUInt32LE(0),data=JSON.parse(buffer.subarray(8,8+size).toString());
   buffer=buffer.subarray(8+size);
   if(op===0){assert.equal(data.client_id,"123456789012345678");socket.write(bridge.packet(1,{cmd:"DISPATCH",evt:"READY",data:{}}));}
   if(op===1)sent.push(data);
  }
 });
});
async function waitFor(check){
 for(let i=0;i<100;i++){if(check())return;await new Promise(r=>setTimeout(r,30));}
 throw Error("Discord IPC test timed out");
}
async function post(obj,origin="https://stefanovillaggio8-dot.github.io"){
 const res=await fetch("http://127.0.0.1:8792/activity",{method:"POST",
 headers:{"Origin":origin,"Content-Type":"application/json"},body:JSON.stringify(obj)});
 return res.status;
}
(async()=>{
 try{
  if(!win)try{fs.unlinkSync(ipc)}catch(e){}
  await new Promise(ok=>fake.listen(ipc,ok));
  await new Promise(ok=>bridge.server.listen(8792,"127.0.0.1",ok));
  assert.equal(bridge.validId("123456789012345678"),true);
  assert.equal(bridge.validId("no"),false);
  assert.equal(bridge.playback({playing:false}),null);
  assert.equal(await post({applicationId:"123456789012345678",playing:true,title:"Test",artist:"Artista",position:42,duration:200}),200);
  await waitFor(()=>sent.some(x=>x.args?.activity?.details==="Test"));
  const activity=sent.find(x=>x.args?.activity?.details==="Test").args.activity;
  assert.equal(activity.type,2);
  assert.equal(activity.state,"Artista");
  assert.ok(activity.timestamps.end>activity.timestamps.start);
  assert.equal(await post({applicationId:"123456789012345678",playing:false}),200);
  await waitFor(()=>sent.some(x=>x.args?.activity===null));
  assert.equal(await post({applicationId:"123456789012345678",playing:true,title:"No",position:0},"https://evil.example"),403);
  assert.equal(await post({applicationId:"no",playing:false}),400);
  console.log("PASS: handshake, musica, durata, pausa, origin e ID.");
 } finally {
  await new Promise(ok=>bridge.server.close(ok));
  fake.close();
  if(!win)try{fs.unlinkSync(ipc)}catch(e){}
 }
})().catch(e=>{console.error(e);process.exit(1);});
