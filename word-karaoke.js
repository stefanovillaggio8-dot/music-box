/* Music Box · Timed words (Lyricsfile 1.0 + Enhanced LRC).
   Only trusted source timestamps become word karaoke. No guessed offsets,
   no uploads of audio, and no external YAML parser (works offline). */
(function(root){
"use strict";
const MAX_TEXT=600000,MAX_ROWS=800,MAX_WORDS=16000,MAX_TIME=21600;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function number(v){
 if(typeof v!=="number"&&typeof v!=="string"||typeof v==="string"&&!v.trim())return null;
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
  if(!w||typeof w!=="object")return [];
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
  // Only an audio-verified long, distinctive phrase can retain an LRC
  // source anchor up to 2.7 seconds before the first measured syllable.
  // Enhanced LRC and short repeated hooks still use the old 1.7s gate.
  const tokens=text.match(/\S+/gu)||[];
  const unique=new Set(tokens.map(x=>x.normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"").toLowerCase()
    .replace(/[^a-z0-9]/g,"")).filter(Boolean));
  const longPhrase=tokens.length>=7&&unique.size>=5;
  const maxMeasuredOffset=longPhrase&&number(row.sourceT)!=null?2.70:1.70;
  const firstWord=number(row.words?.[0]?.t);
  const adjustedStart=firstWord!=null&&firstWord>=t-.45&&
    firstWord<=t+maxMeasuredOffset?firstWord:t;
  const words=validWords(row.words,text,adjustedStart,end);
  totalWords+=words.length;
  if(totalWords>MAX_WORDS)break;
  const displayT=words.length?adjustedStart:t;
  // Keep the original LRC anchor separately from the audio-measured
  // first word. Otherwise shifted, correctly aligned rows cannot be
  // matched back to the provider line when saving or reloading.
  const sourceT=number(row.sourceT);
  const anchored=sourceT!=null&&displayT>=sourceT-.45&&
    displayT<=sourceT+(longPhrase?2.70:1.70);
  out.push({t:+displayT.toFixed(3),text,
   ...(anchored?{sourceT:+sourceT.toFixed(3)}:{}),
   ...(end!=null?{end:+end.toFixed(3)}:{}),
   ...(words.length?{words}:{}),
   ...(row.estimated===true?{estimated:true}:{})});
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
  let end=null;
  if(last>=0){
   const tail=body.slice(last);
   // A closing Enhanced LRC tag marks the end of the last word, rather
   // than an empty additional word that invalidates the entire phrase.
   if(!tail.trim()&&words.length&&lastTime>=words[words.length-1].t){
    end=lastTime;words[words.length-1].end=end;
   }else words.push({t:lastTime,text:tail});
  }
  const text=(last>=0?prefix+words.map(w=>w.text).join(""):body).trim();
  // Trim leading whitespace of the first token consistently with line text.
  if(words.length&&prefix.trim()===""&&words[0].text)
    words[0].text=words[0].text.trimStart();
  // Enhanced LRC sometimes timestamps the line a little after the
  // first audible syllable. Preserve the measured word time instead of
  // discarding the entire word stream and inventing estimated karaoke.
  const firstWord=words[0]?.t;
  // Trust the exact first-word cue over an early LRC line marker, in both
  // directions. A matching word can start up to 1.7s AFTER the line cue.
  // Never shift a lyric on the basis of malformed/incomplete word tags.
  const plausible=Number.isFinite(firstWord)&&
    firstWord>=t-.95&&firstWord<=t+1.70;
  const adjustedStart=plausible?firstWord:t;
  const clean=plausible?validWords(words,text,adjustedStart,null):[];
  if(text)result.push({t:clean.length?adjustedStart:t,text,
    ...(clean.length?{words:clean,...(end!=null?{end}:{})}:{})});
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
  // A line timestamp alone cannot locate every word in rapid rap.
  // Do not animate invented syllables at 3-6 words/second, or guess the
  // end of the final phrase where no following LRC cue exists. Such rows
  // remain honestly line-synchronised until audio-verified ASR arrives.
  if(gap===null||gap<1.15||gap>12||tokens.length/gap>2.20)return row;
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
  const fallback=next?next.t:row.end!=null&&row.end>w.t?row.end:w.t+0.55;
  // An ASR word's reported end can overlap the next timestamp.
  // Visually constrain its fill to the next verified word or phrase end.
  const rawEnd=w.end!=null&&w.end>=w.t?w.end:fallback;
  const end=Math.max(w.t,Math.min(rawEnd,
   next?next.t:row.end!=null&&row.end>=w.t?row.end:rawEnd));
  const pct=Math.round(100*clamp((time-w.t)/Math.max(.06,end-w.t),0,1));
  const el=elements[i];
  if(el._karaokePct!==pct){el._karaokePct=pct;el.style.setProperty("--karaoke-fill",pct+"%")}
 }
}
/* Report timing coverage by ACTUAL source. One validated line must not
   label an entire 70-line recording as word-synced. An estimated word is
   never counted as verified regardless of how it looks on screen. */
function timingCoverage(rows){
 const result={total:0,audio:0,provider:0,estimated:0,lineOnly:0};
 if(!Array.isArray(rows))return result;
 for(const row of rows){
  if(!row||!String(row.text||"").trim()||number(row.t)==null)continue;
  result.total++;
  const timed=validWords(row.words,row.text,number(row.t),row.end==null?null:number(row.end)).length>=2;
  if(!timed){result.lineOnly++;continue;}
  if(row.estimated===true){result.estimated++;continue;}
  if(number(row.sourceT)!=null)
   result.audio++;
  else result.provider++;
 }
 result.wordTimed=result.audio+result.provider;
 result.percent=result.total?Math.round(result.wordTimed*100/result.total):0;
 return result;
}
root.MusicBoxWordKaraoke={
 parseLyricsfile,parseEnhancedLrc,fromRecord,normalizeRows,toLrc,estimateRows,spanWords,paintWords,timingCoverage
};
})(typeof window!=="undefined"?window:globalThis);
