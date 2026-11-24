'use strict';
// Read-only, one frozen Ste geometry. Run from repository root with a NEW output.
// Instrument the owning gates; never change their decisions or write the index.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),output=process.argv[2];
if(!output||fs.existsSync(output))throw Error('New output path required');
const read=f=>JSON.parse(fs.readFileSync(f)),hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const r=read(path.join(__dirname,'results.json')),protocol=read(path.join(__dirname,'protocol.json'));
const index=read(path.join(root,'dj-deep-analysis.json'));
const {currentSteScope,validateSteCases}=require('../../tools/ste-research-scope.cjs');
validateSteCases([r.pair],currentSteScope(),index);
assert.equal(index.entries[r.pair.from].sha,r.sourceSha);assert.equal(index.entries[r.pair.to].sha,r.targetSha);
assert.equal(r.begin,protocol.sourceBegin);assert.equal(r.entry,0);assert.equal(r.tempo,1);
const features={};
for(const [file,expected]of Object.entries(r.inputs)){
 const f=path.resolve(root,file);assert.equal(hash(f),expected);
 const data=read(f);for(const key of Object.values(r.pair))if(data.entries?.[key]?.pcmTransition){
  assert.equal(data.entries[key].sha,index.entries[key].sha);features[key]=data.entries[key].pcmTransition;
 }
}
const a=features[r.pair.from].outro,b=features[r.pair.to].intro;
const nearest=(p,t)=>p.harmony.reduce((best,row)=>!best||Math.abs(row.t-t)<Math.abs(best.t-t)?row:best,null);
const normalize=notes=>{const x=notes.map(n=>Math.max(0,n-1/12*.82)),s=x.reduce((a,b)=>a+b,0);return x.map(n=>n/s);};
const rough=x=>x.reduce((s,n,p)=>s+n*(x[(p+1)%12]+x[(p+11)%12]+.5*x[(p+6)%12]),0);
const frames=[];
for(let t=.5;t<=r.fade-.5;t+=.5){
 const x=nearest(a,r.begin+t),y=nearest(b,t),xx=normalize(x.notes),yy=normalize(y.notes);
 const clash=xx.reduce((s,n,p)=>s+n*(yy[(p+1)%12]+yy[(p+11)%12]+.5*yy[(p+6)%12]),0);
 const excess=clash-Math.max(rough(xx),rough(yy));
 frames.push({t,sourceTime:x.t,targetTime:y.t,sourceRms:x.rms,targetRms:y.rms,sourceTonalRatio:x.tonalRatio,targetTonalRatio:y.tonalRatio,
  levelDifferenceDb:20*Math.log10(x.rms/y.rms),clash,excess,
  originalSourceWeight:4*x.rms*y.rms/(x.rms+y.rms)**2,
  // A diagnostic bound, NOT a replacement quality/certification criterion.
  powerWeightedExcess:excess*4*x.rms*y.rms/(x.rms+y.rms)**2});
}
const sourceFile=path.join(root,'mix-intelligente.js'),original=fs.readFileSync(sourceFile,'utf8');
const tool=fs.readFileSync(path.join(root,'tools/dj-equivalence-audit.cjs'),'utf8');
const reports=[];
let source=original;
for(const [name,next]of [['pcmCompatibleKeyHarmony','pcmFullHarmony'],['pcmFullHarmony','pcmPreservedTailHarmony'],['pcmPreservedTailHarmony','indexedFullBeatBridge']]){
 const lo=source.indexOf('function '+name+'('),hi=source.indexOf('function '+next+'(',lo);
 assert(lo>=0&&hi>lo);
 let fn=source.slice(lo,hi),site=0;
 fn=fn.replace(/return null;/g,(_,at)=>'{harmonyReports.push('+JSON.stringify({gate:name,site:++site,owningStatement:source.slice(lo+Math.max(0,at-180),lo+at).split('\n').slice(-2).join('\n')})+');return null;}');
 if(name==='pcmCompatibleKeyHarmony'){
  fn=fn.replace('if(a.length<6||','harmonyReports.push({gate:"key-frame-statistics",frames:a.length,rawClashMax:Math.max(...clashes),excessClashMax:Math.max(...excessClashes),scores});\n if(a.length<6||');
  fn=fn.replace('if(!ka||!kb||','harmonyReports.push({gate:"key-estimates",source:ka,target:kb});\n if(!ka||!kb||');
  fn=fn.replace('if(relation.score<.92)','harmonyReports.push({gate:"key-relation",relation});\n if(relation.score<.92)');
 }
 if(name==='pcmFullHarmony')fn=fn.replace('return average>=.78','harmonyReports.push({gate:"four-probes",average,weakest,shared,scores});\n return average>=.78');
 if(name==='pcmPreservedTailHarmony'){
  fn=fn.replace('if(source.length<6||','harmonyReports.push({gate:"preserved-frame-statistics",frames,sharedTonalFrames:source.length,boundedQuiet,rawClashMax:Math.max(...clashes),excessClashMax:Math.max(...excess)});\n if(source.length<6||');
  fn=fn.replace('if(!a||!b||','harmonyReports.push({gate:"preserved-key-estimates",source:a,target:b,relation:a&&b?camelotMatch({camelot:a},{camelot:b}):null});\n if(!a||!b||');
 }
 source=source.slice(0,lo)+fn+source.slice(hi);
}
function load(code){
 const wrappedFs={...fs,readFileSync:(f,...args)=>path.resolve(String(f))===sourceFile?code:fs.readFileSync(f,...args)};
 return new Function('require','__dirname','harmonyReports',tool.slice(0,tool.indexOf('// Independent PCM spotchecks'))+'return engine;')(n=>n==='node:fs'?wrappedFs:require(n),path.join(root,'tools'),reports);
}
// The audit creates the gate function through new Function, so pass the collector
// as an explicit parameter of that function; do not use process/global state.
const instrumentedTool=tool.replace('new Function("isIOS","style","djLyricBoundaries",','new Function("isIOS","style","djLyricBoundaries","harmonyReports",').replace(')(false,"auto",lyricBoundaries.entries||{});',')(false,"auto",lyricBoundaries.entries||{},harmonyReports);');
function instrumented(){
 const wrappedFs={...fs,readFileSync:(f,...args)=>path.resolve(String(f))===sourceFile?source:fs.readFileSync(f,...args)};
 return new Function('require','__dirname','harmonyReports',instrumentedTool.slice(0,instrumentedTool.indexOf('// Independent PCM spotchecks'))+'return engine;')(n=>n==='node:fs'?wrappedFs:require(n),path.join(root,'tools'),reports);
}
const plain=load(original),debug=instrumented(),results={};
for(const name of ['pcmFullHarmony','pcmPreservedTailHarmony']){
 const args=name==='pcmFullHarmony'?[a,b,r.begin,0,1,r.fade]:[a,b,r.begin,1,r.fade];
 const before=reports.length,actual=debug[name](...args);assert.deepEqual(actual,plain[name](...args));
 results[name]={accepted:!!actual,evidence:actual,diagnostics:reports.slice(before)};
}
const value={method:'unchanged-owning-harmony-gate-trace-v1',profile:'Ste',pair:r.pair,sourceSha:r.sourceSha,targetSha:r.targetSha,
 geometry:{begin:r.begin,end:r.end,entry:0,tempo:1,fade:r.fade},engineSha256:hash(sourceFile),results,originalUnityFrameDiagnostics:frames,
 originalDecodes:0,newModels:0,renders:0,installed:false,certified:false,thresholdsChanged:false};
fs.writeFileSync(output,JSON.stringify(value,null,2)+'\n');console.log(JSON.stringify(value,null,2));
