'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto');
const {currentSteScope,validateSteCases}=require('./ste-research-scope.cjs');
const root=path.resolve(__dirname,'..');
function prepare(data){
 const cases=JSON.parse(fs.readFileSync(path.join(root,'audits/ste-factored-clean-20261123/cases.json')));
 const index=JSON.parse(fs.readFileSync(path.join(root,'dj-deep-analysis.json')));
 validateSteCases(cases,currentSteScope(),index);
 const allowed=new Set(cases.flatMap(c=>[c.from,c.to]));
 const records=Object.values(data.recordings),source=records.find(r=>r.quietSuffix),control=records.find(r=>r.prefix?.reusedPublishedEvidence);
 if(records.some(r=>!allowed.has(r.key)))throw Error('Recording outside frozen current Ste selection');
 const needed=records.filter(r=>r===source||r===control||r.prefix?.notNativeCertified&&Object.values(r.prefix.rates).every(v=>v.maximumPeak<.959));
 const originals=new Map();
 for(const r of needed){
  if(index.entries[r.key]?.sha!==r.sourceSha)throw Error('Changed current Ste evidence');
  const file=path.join(root,'../original-mp3',r.sourceSha+'.mp3');if(!fs.existsSync(file))continue;
  const bytes=fs.readFileSync(file);
  if(crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex')!==r.sourceSha)throw Error('Changed original');
  originals.set(r.sourceSha,bytes);
 }
 const fixture={sourceSha:source.sourceSha,targetSha:control.sourceSha,begin:source.quietSuffix.begin,end:source.duration,
  sourceClock:source.clock,targetClock:control.clock,physicalIPhone:false,notApplicationIntegration:true};
 return {needed,originals,fixture};
}
function server(data){
 const prepared=prepare(data);
 const s=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),sha=/^\/original\/([a-f0-9]{40})\.mp3$/.exec(url.pathname)?.[1];
  if(sha&&prepared.originals.has(sha)){
   const bytes=prepared.originals.get(sha);res.setHeader('Content-Type','audio/mpeg');res.setHeader('Accept-Ranges','bytes');
   const range=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range||'');
   if(range){const lo=Number(range[1]),hi=Math.min(bytes.length-1,range[2]?Number(range[2]):bytes.length-1);if(lo>hi){res.writeHead(416);res.end();return;}
    res.writeHead(206,{'Content-Range':`bytes ${lo}-${hi}/${bytes.length}`,'Content-Length':hi-lo+1});res.end(bytes.subarray(lo,hi+1));
   }else{res.setHeader('Content-Length',bytes.length);res.end(bytes);}return;
  }
  if(url.pathname==='/fixture.json'){res.setHeader('Content-Type','application/json');res.end(JSON.stringify(prepared.fixture));return;}
  const files={'/audio-composite-mix.js':'audio-composite-mix.js','/dual-deck.js':'tools/ios-native-dual-deck-prototype.js','/':'audits/ste-factored-clean-20261123/iphone-probe.html'};
  if(!files[url.pathname]){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',url.pathname==='/'?'text/html':'text/javascript');res.end(fs.readFileSync(path.join(root,files[url.pathname])));
 });
 return {server:s,...prepared};
}
module.exports={prepare,server};
if(require.main===module){
 const data=JSON.parse(fs.readFileSync(process.argv[2])),{server:s}=server(data),host=process.argv[3]||'127.0.0.1';
 if(!['127.0.0.1','0.0.0.0'].includes(host))throw Error('Explicit local host only');
 s.listen(8765,host,()=>console.log('Isolated diagnostic only, not Music Box integration: http://'+host+':8765'));
}
