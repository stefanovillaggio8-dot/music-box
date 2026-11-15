'use strict';
// Evaluation references only. Time containment cannot identify a lyric line:
// a sustained annotated word can legitimately overlap the next sung line.
const normalize=s=>String(s).toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
function referenceWordLines(record){
 if(!Array.isArray(record?.words)||!Array.isArray(record?.lines))throw Error('Missing annotated references');
 const groups=[];let pending=[];
 for(const w of record.words){
  if(!Number.isFinite(w.start)||!Number.isFinite(w.end)||w.end<w.start||typeof w.line_end!=='boolean')throw Error('Invalid manual word annotation');
  pending.push(w);
  if(w.line_end){groups.push(pending);pending=[];}
 }
 if(pending.length||groups.length!==record.lines.length)throw Error('Incomplete annotated line ownership');
 for(const [i,words] of groups.entries()){
  const line=record.lines[i],tokens=line.text.match(/\S+/gu)||[];
  if(tokens.length!==words.length||tokens.some((t,j)=>normalize(t)!==normalize(words[j].text))||
   Math.abs(line.start-words[0].start)>.002||Math.abs(line.end-words.at(-1).end)>.002)
   throw Error('Annotated line/word identity mismatch');
 }
 return groups;
}
function referenceForLine(record,groups,line){
 const i=record.lines.findIndex(r=>r.start===line.start&&r.end===line.end&&r.text===line.text);
 if(i<0)throw Error('Unknown annotated reference line');
 return groups[i];
}
module.exports={referenceWordLines,referenceForLine};
