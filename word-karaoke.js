/* Music Box · Timed words (Lyricsfile 1.0 + Enhanced LRC).
   Only trusted source timestamps become word karaoke. No guessed offsets,
   no uploads of audio, and no external YAML parser (works offline). */
(function(root){
"use strict";
const MAX_TEXT=600000,MAX_ROWS=800,MAX_WORDS=16000,MAX_TIME=21600;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function number(v){
 const n=Number(v);
 return Number.isFinite(n)&&n>=0&&n<=MAX_TIME?n:null;
}
function yamlScalar(value){
 const s=String(value||"").trim();
 if(!s)return "";
 if(s[0]==="'"&&s[s.length-1]==="'")return s.slice(1,-1).replace(/''/g,"'");
 if(s[0]==='"'&&s[s.length-1]==='"'){
  try{return JSON.parse(s)}catch(_){return s.slice(1,-1)}
 }
 return s.replace(/\s+#.*$/,"");
}
function timeParts(m){
 const minutes=Number(m[1]),seconds=Number(m[2]);
 const fraction=m[3]?Number("0."+m[3]):0;
 return seconds<60?number(minutes*60+seconds+fraction):null;
}
function validWords(raw,lineText,lineStart,lineEnd){
 if(!Array.isArray(raw)||raw.length<2||raw.length>80)return [];
 const words=[];let prior=-1;
 for(const w of raw){
  const t=number(w.t),text=String(w.text??"");
  const end=w.end==null?null:number(w.end);
  if(t==null||end!=null&&end<t||t+0.3<lineStart||
    lineEnd!=null&&t>lineEnd+0.3||t<prior||!text||text.length>140)return [];
  words.push({t:+t.toFixed(3),text,...(end!=null?{end:+end.toFixed(3)}:{})});
  prior=t;
 }
 // Never associate different words with this line even if timings look plausible.
 const normalized=s=>String(s||"").normalize("NFKC").replace(/\s+/g," ").trim();
 if(normalized(words.map(x=>x.text).join(""))!==normalized(lineText))return [];
 return words;
}
function normalizeRows(rows){
 if(!Array.isArray(rows))return [];
 const out=[];let totalWords=0;
 for(const row of rows.slice(0,MAX_ROWS)){
  if(!row||typeof row!=="object")continue;
  const t=number(row.t),end=row.end==null?null:number(row.end);
  const text=String(row.text??"");
  if(t==null||end!=null&&end<t||text.length>380||!text.trim())continue;
  const words=validWords(row.words,text,t,end);
  totalWords+=words.length;
  if(totalWords>MAX_WORDS)break;
  out.push({t:+t.toFixed(3),text,
   ...(end!=null?{end:+end.toFixed(3)}:{}),
   ...(words.length?{words}:{})});
 }
 return out.sort((a,b)=>a.t-b.t);
}
function parseLyricsfile(input){
 const doc=String(input||"");
 if(doc.length<18||doc.length>MAX_TEXT||
  !/^version:\s*(['"]?)1\.0\1\s*(?:#.*)?$/m.test(doc))return [];
 const raw=doc.replace(/\r\n?/g,"\n").split("\n");
 let inLines=false,container=-1,rowIndent=Infinity,wordIndent=Infinity;
 let row=null,word=null,rows=[];
 for(const source of raw){
  const indent=source.match(/^ */)?.[0]?.length||0;
  const part=source.trim();
  if(!part||part[0]==="#")continue;
  if(!inLines){
   if(indent===0&&/^lines:\s*(?:#.*)?$/.test(part)){inLines=true;container=indent}
   continue;
  }
  if(indent<=container)break;
  const item=/^-\s+([a-z_]+):\s*(.*)$/.exec(part);
  const property=/^([a-z_]+):\s*(.*)$/.exec(part);
  if(item){
   const key=item[1],value=item[2];
   if(indent<=rowIndent){
    rowIndent=indent;wordIndent=Infinity;word=null;row={words:[]};rows.push(row);
    if(rows.length>MAX_ROWS)break;
    if(key==="text")row.text=yamlScalar(value);
   }else{
    if(!row)continue;
    wordIndent=indent;word={};row.words.push(word);
    if(row.words.length>80)row.words.pop();
    if(key==="text")word.text=yamlScalar(value);
   }
   continue;
  }
  if(!property||!row)continue;
  const key=property[1],value=property[2];
  if(key==="words")continue;
  const target=word&&indent>wordIndent?word:row;
  if(key==="text")target.text=yamlScalar(value);
  if(key==="start_ms"||key==="end_ms"){
   const ms=Number(value);
   if(Number.isSafeInteger(ms)&&ms>=0&&ms<=MAX_TIME*1000)
    target[key==="start_ms"?"t":"end"]=ms/1000;
  }
 }
 return normalizeRows(rows);
}
function parseEnhancedLrc(value){
 const input=String(value||"");
 if(!input||input.length>MAX_TEXT)return [];
 const result=[];
 const lineRE=/^\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]\s*(.*)$/gm;
 let m;
 while((m=lineRE.exec(input))&&result.length<MAX_ROWS){
  const t=timeParts(m);if(t==null)continue;
  let body=m[4],words=[],prefix="",last=-1,lastTime=0;
  const re=/<(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?>/g;
  let match;
  while((match=re.exec(body))){
   if(last>=0){
    words.push({t:lastTime,text:body.slice(last,match.index)});
   }else{prefix=body.slice(0,match.index)}
   const secs=timeParts(match);
   if(secs==null){words=[];break}
   lastTime=secs;last=re.lastIndex;
  }
  if(last>=0)words.push({t:lastTime,text:body.slice(last)});
  const text=(last>=0?prefix+words.map(w=>w.text).join(""):body).trim();
  // Trim leading whitespace of the first token consistently with line text.
  if(words.length&&prefix.trim()===""&&words[0].text)
    words[0].text=words[0].text.trimStart();
  // Enhanced LRC sometimes timestamps the line a little after the
  // first audible syllable. Preserve the measured word time instead of
  // discarding the entire word stream and inventing estimated karaoke.
  const firstWord=words[0]?.t;
  const adjustedStart=Number.isFinite(firstWord)&&
    firstWord<t-.15&&firstWord>=t-.95?firstWord:t;
  const clean=validWords(words,text,adjustedStart,null);
  if(text)result.push({t:adjustedStart,text,...(clean.length?{words:clean}:{})});
 }
 return result;
}
function fromRecord(entry){
 if(!entry||typeof entry!=="object")return [];
 const full=entry.lyricsfile?parseLyricsfile(entry.lyricsfile):[];
 const fromEnhanced=entry.syncedLyrics?parseEnhancedLrc(entry.syncedLyrics):[];
 const words=full.filter(row=>row.words?.length>=2).length;
 const enhanced=fromEnhanced.filter(row=>row.words?.length>=2).length;
 return words>0&&words>=enhanced?full:enhanced>0?fromEnhanced:[];
}
function toLrc(rows){
 return normalizeRows(rows).map(r=>{
  const m=String(Math.floor(r.t/60)).padStart(2,"0");
  const s=(r.t%60).toFixed(2).padStart(5,"0");
  return "["+m+":"+s+"] "+r.text;
 }).join("\n");
}
/* Word progress guessed from LRC LINE timing: visual only, never persisted
   or represented as an audio-verified word alignment. */
function estimateRows(rows){
 if(!Array.isArray(rows))return [];
 return rows.map((row,index)=>{
  if(!row||Array.isArray(row.words)&&row.words.length>=2)return row;
  const start=number(row.t),text=String(row.text||"").trim();
  const tokens=text.match(/\S+\s*/gu)||[];
  if(start==null||tokens.length<2||tokens.length>24||text.length>220||
     /^\[[^\]\n]+\]$/u.test(text))return row;
  const following=number(rows[index+1]?.t);
  const gap=following!=null&&following>start?following-start:null;
  if(gap!==null&&gap<.85)return row;
  const weights=tokens.map(token=>{
   const letters=token.replace(/[^\p{L}\p{N}]/gu,"").length;
   return clamp(letters/4+.35,.7,2.5);
  });
  const total=weights.reduce((a,b)=>a+b,0);
  const natural=clamp(total*.43+.35,1.1,6.5);
  const duration=gap===null?natural:Math.min(gap-.12,Math.max(.9,Math.min(gap*.9,natural)));
  if(duration<.78)return row;
  let cursor=start;
  const words=tokens.map((token,i)=>{
   const t=cursor;
   cursor+=duration*weights[i]/total;
   return {text:token,t:+t.toFixed(3),end:+cursor.toFixed(3)};
  });
  if(words.map(w=>w.text).join("").trim()!==text)return row;
  return {...row,words,estimated:true};
 });
}
function spanWords(document,row,container){
 const words=validWords(row.words,row.text,row.t,row.end??null);
 if(words.length<2){container.textContent=row.text;return []}
 const elements=[];
 for(const w of words){
  const el=document.createElement("span");
  el.className="karaoke-word";
  el.textContent=w.text;
  el.style.setProperty("--karaoke-fill","0%");
  container.appendChild(el);
  elements.push(el);
 }
 return elements;
}
function paintWords(row,elements,time){
 if(!row||!Array.isArray(row.words)||elements?.length!==row.words.length)return;
 for(let i=0;i<elements.length;i++){
  const w=row.words[i],next=row.words[i+1];
  // In word-timed LRC a long pause before the next word does NOT mean
  // the previous syllable was sung for that entire gap. Complete the
  // highlight promptly, then hold it until the next measured onset.
  // Explicit measured end timestamps still take precedence.
  const length=String(w.text||"").replace(/[^\\p{L}\\p{N}]/gu,"").length;
  const natural=clamp(.24+Math.min(length,9)*.062,.28,.82);
  const fallback=next?
    Math.min(next.t,w.t+natural):
    row.end!=null&&row.end>w.t?Math.min(row.end,w.t+natural):w.t+natural;
  const end=w.end!=null&&w.end>=w.t?
    Math.min(w.end,next?.t??Infinity):fallback;
  const pct=Math.round(100*clamp((time-w.t)/Math.max(.06,end-w.t),0,1));
  const el=elements[i];
  if(el._karaokePct!==pct){el._karaokePct=pct;el.style.setProperty("--karaoke-fill",pct+"%")}
 }
}
root.MusicBoxWordKaraoke={
 parseLyricsfile,parseEnhancedLrc,fromRecord,normalizeRows,toLrc,estimateRows,spanWords,paintWords
};
})(typeof window!=="undefined"?window:globalThis);
