"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const root=path.join(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const css=fs.readFileSync(path.join(root,"style.css"),"utf8");
function mount(){
 const start=app.indexOf("function updateVolumeUI() {");
 const end=app.indexOf('/* Ste: "nella playlist gym',start);
 assert.ok(start>0&&end>start);
 const nodes={};
 for(const id of ["volSlider","volMinus","volPlus","volExact","btnVolIcon","btnBassiVolume"])
  nodes[id]={value:"",listeners:{},attrs:{},
   addEventListener(k,fn){this.listeners[k]=fn;},
   setAttribute(k,v){this.attrs[k]=v;},
   classList:{toggle(){}}
  };
 const stored=[],applied=[];
 const doc={activeElement:null};
 const script='let volumePct=50,volumeBeforeMute=50;'+app.slice(start,end)+
  ';return {nodes,stored,applied,getValue:()=>volumePct};';
 return new Function("$","LS","document","_applicaAudio","apriBassiVolume","nodes","stored","applied",script)(
  id=>nodes[id],{set:(key,val)=>stored.push([key,val])},doc,
  ()=>applied.push(true),()=>{},nodes,stored,applied);
}
test("bottom volume slider covers 1%-100% with one-percent steps",()=>{
 assert.match(html,/<input[^>]*id="volSlider"[^>]*min="1"[^>]*max="100"[^>]*step="1"/);
 assert.match(html,/<input[^>]*id="volExact"[^>]*min="1"[^>]*max="100"[^>]*step="1"/);
});
test("numeric volume and plus/minus controls exist in the bottom player",()=>{
 for(const id of ["volMinus","volPlus","volExact"])assert.ok(html.includes('id="'+id+'"'));
 assert.ok(css.includes(".vol-row .vol-precise"));
});
test("both buttons change volume by exactly one percent",()=>{
 const x=mount();
 x.nodes.volPlus.listeners.click();assert.equal(x.getValue(),51);
 x.nodes.volMinus.listeners.click();assert.equal(x.getValue(),50);
 for(let i=0;i<140;i++)x.nodes.volPlus.listeners.click();
 assert.equal(x.getValue(),100);
 for(let i=0;i<140;i++)x.nodes.volMinus.listeners.click();
 assert.equal(x.getValue(),1);
});
test("typing 37% and 1% applies exact integer values, clamping over 100%",()=>{
 const x=mount(),n=x.nodes.volExact;
 n.value="37";n.listeners.change({target:n});assert.equal(x.getValue(),37);
 n.value="1";n.listeners.change({target:n});assert.equal(x.getValue(),1);
 n.value="200";n.listeners.change({target:n});assert.equal(x.getValue(),100);
 n.value="";n.listeners.change({target:n});assert.equal(x.getValue(),100);
});
test("mute remains separate from 1-100 slider and restores previous percentage",()=>{
 const x=mount(),icon=x.nodes.btnVolIcon;
 x.nodes.volExact.value="37";
 x.nodes.volExact.listeners.change({target:x.nodes.volExact});
 icon.listeners.click();assert.equal(x.getValue(),0);
 assert.equal(x.nodes.volSlider.value,"1");
 assert.equal(x.nodes.volSlider.attrs["aria-valuetext"],"Muto");
 icon.listeners.click();assert.equal(x.getValue(),37);
 assert.ok(x.stored.some(([k,v])=>k==="mb.vol"&&v===37));
});

test("normalized Mentre Tutto Score uses a new URL only for its own MP3",()=>{
 assert.match(app,/t\.file === "songs\/track-245\.mp3"\) return _doveStaIlBrano\(t\.file\)/);
 assert.match(app,/nome === "songs\/track-245\.mp3" \? "\?audio-normalizzato=20261102-lufs14" : ""/);
 const p=app.indexOf("function _doveStaIlBrano(file)");
 const q=app.indexOf("let profiles",p);
 assert.ok(p>=0&&q>p);
 const resolver=app.slice(p,q);
 assert.ok(resolver.includes('if (inLocale) return nome === "songs/track-929.mp3"'),
  "Local server URLs must remain unchanged");
 assert.ok(resolver.includes('return BRANI_ONLINE + nome.replace'),
  "Cache-busting must happen only on the cloud audio URL");
});
