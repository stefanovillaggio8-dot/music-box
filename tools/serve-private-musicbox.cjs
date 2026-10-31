#!/usr/bin/env node
"use strict";
// Music Box private localhost server. No external dependencies and never binds LAN.
// Serves the existing songs as-is, including HTTP byte ranges needed for seeking.
const http=require("node:http");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(process.argv[2]||path.join(__dirname,".."));
const port=Number(process.argv[3]||8791);
if(!Number.isSafeInteger(port)||port<1024||port>65535)throw Error("Porta non valida");
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".css":"text/css; charset=utf-8",".json":"application/json; charset=utf-8",
 ".mp3":"audio/mpeg",".m4a":"audio/mp4",".jpg":"image/jpeg",".jpeg":"image/jpeg",
 ".png":"image/png",".webp":"image/webp",".svg":"image/svg+xml",
 ".ico":"image/x-icon",".txt":"text/plain; charset=utf-8"};
function serve(req,res){
  if(req.method!=="GET"&&req.method!=="HEAD"){
    res.writeHead(405,{"Allow":"GET, HEAD"});res.end();return;
  }
  let name;
  try{name=decodeURIComponent(new URL(req.url,"http://localhost").pathname)}
  catch(e){res.writeHead(400);res.end();return}
  if(name==="/")name="/index.html";
  if(name.includes("\0")||name.includes("\\")||name.split("/").some(x=>x===".."||x.startsWith("."))){
    res.writeHead(403);res.end();return;
  }
  const file=path.resolve(root,"."+name);
  if(!file.startsWith(root+path.sep)) {res.writeHead(403);res.end();return}
  fs.stat(file,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404);res.end();return}
    const size=stat.size,headers={
      "Content-Type":types[path.extname(file).toLowerCase()]||"application/octet-stream",
      "Accept-Ranges":"bytes","X-Content-Type-Options":"nosniff",
      "Cache-Control":"private, no-cache"
    };
    let start=0,end=size-1,status=200;
    const range=req.headers.range;
    if(range){
      const m=/^bytes=(\d*)-(\d*)$/.exec(range);
      if(!m){res.writeHead(416,{"Content-Range":"bytes */"+size});res.end();return}
      if(m[1])start=Number(m[1]);
      if(m[2])end=Number(m[2]);
      if(!m[1]&&m[2]){start=Math.max(0,size-Number(m[2]));end=size-1}
      if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=size){
        res.writeHead(416,{"Content-Range":"bytes */"+size});res.end();return
      }
      end=Math.min(end,size-1);
      status=206;
      headers["Content-Range"]="bytes "+start+"-"+end+"/"+size;
    }
    headers["Content-Length"]=Math.max(0,end-start+1);
    res.writeHead(status,headers);
    if(req.method==="HEAD"){res.end();return}
    const stream=fs.createReadStream(file,{start,end});
    stream.on("error",()=>res.destroy());
    stream.pipe(res);
  });
}
http.createServer(serve).listen(port,"127.0.0.1",()=>{
 console.log("Music Box privato: http://127.0.0.1:"+port+"/");
 console.log("Cartella: "+root);
});
