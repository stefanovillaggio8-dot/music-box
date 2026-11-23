'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
function fixture(lines,provider){
 const app=fs.readFileSync('app.js','utf8'),start=app.indexOf('  const _testiTradotti = new Map();'),end=app.indexOf('  // Reader controls apply',start);
 assert.ok(start>0&&end>start);const calls=[],toasts=[],button={disabled:false,textContent:'Traduci',pressed:'false',getAttribute(){return this.pressed},setAttribute(k,v){this.pressed=v}};
 const makeLine=text=>({original:text,children:[],classList:{contains:()=>false},get textContent(){return this.original+this.children.map(c=>c.textContent).join('')},appendChild(c){c.parent=this;this.children.push(c)}});
 const body={rows:lines.map(makeLine),querySelectorAll(selector){return selector==='p'?this.rows:this.rows.flatMap(r=>r.children)}};
 const panel={hidden:false},nodes={lyricsTraduci:button,lyricsBody:body,lyricsPanel:panel,lyricsLingua:{value:'en'}};
 const document={createElement:()=>({textContent:'',remove(){this.parent.children=this.parent.children.filter(c=>c!==this)}})};
 const env={nodes,document,toasts,fetch:(url,opts)=>{const q=new URL(url).searchParams.get('q');calls.push({q,opts});return provider?provider(q,opts):Promise.resolve({ok:true,json:async()=>({responseData:{translatedText:'IT '+q}})})}};
 const api=new Function('env','AbortController',`const $=id=>env.nodes[id],document=env.document,fetch=env.fetch,toast=(...a)=>env.toasts.push(a);let currentId='b-track-38';const current=()=>({id:currentId}),currentLyrics=()=>({text:'fixture'});`+app.slice(start,end)+`return {translate:_traduciTestiSuRichiesta,reset:_azzeraVistaTraduzione,changeTrack:id=>{currentId=id;_azzeraVistaTraduzione()}};`)(env,AbortController);
 return {...api,calls,toasts,button,panel,body,setLines:texts=>body.rows=texts.map(makeLine),translations:()=>body.rows.map(r=>r.children[0]?.textContent)};
}
test('editing lyrics with the same number of phrases must not reuse another source text translation',async()=>{
 const t=fixture(['Hello']);await t.translate();await t.translate();t.setLines(['Goodbye']);await t.translate();
 assert.equal(t.calls.length,2);assert.deepEqual(t.translations(),['IT Goodbye']);
});
test('a 60-of-61 phrase result is reusable without repeating sixty external requests',async()=>{
 const t=fixture(Array.from({length:61},(_,i)=>'Phrase '+i));await t.translate();assert.equal(t.calls.length,60);
 await t.translate();await t.translate();assert.equal(t.calls.length,60);assert.equal(t.translations().filter(Boolean).length,60);
});
test('repeated complete phrases keep their positions but need one identical line request',async()=>{
 const t=fixture(['Chorus','Verse','Chorus']);await t.translate();assert.deepEqual(t.calls.map(r=>r.q),['Chorus','Verse']);
 assert.deepEqual(t.translations(),['IT Chorus','IT Verse','IT Chorus']);
});
test('a late rejected request cannot overwrite the new song button or show an obsolete error',async()=>{
 let reject;const t=fixture(['Old line'],()=>new Promise((a,b)=>reject=b));const job=t.translate();t.changeTrack('b-track-4');reject(Error('late old failure'));await job;
 assert.equal(t.button.textContent,'Traduci');assert.equal(t.toasts.length,0);assert.equal(t.button.disabled,false);
});
test('reset aborts network work; even a provider ignoring abort cannot update the new view',async()=>{
 let resolve;const t=fixture(['Old line'],()=>new Promise(r=>resolve=r));const job=t.translate();const signal=t.calls[0].opts.signal;t.changeTrack('b-track-4');
 assert.equal(signal?.aborted,true);resolve({ok:true,json:async()=>({responseData:{translatedText:'stale'}})});await job;
 assert.deepEqual(t.translations(),[undefined]);assert.equal(t.button.textContent,'Traduci');assert.equal(t.button.disabled,false);
});
test('entity text is readable while remaining literal text, with no injected markup',async()=>{
 const t=fixture(['Original'],async()=>({ok:true,json:async()=>({responseData:{translatedText:'Caff&#232; &amp; &lt;img src=x&gt;'}})}));await t.translate();
 assert.deepEqual(t.translations(),['Caffè & <img src=x>']);
});
