import fs from 'node:fs';
import {compositePCM} from '../audio-composite-core.mjs';
const arg=k=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3);
const rate=Number(arg('rate')),cue=JSON.parse(fs.readFileSync(arg('cue')));
function clip(file,start){
 const bytes=fs.readFileSync(file);if(bytes.length%8||bytes.length>rate*40*8)throw Error('Invalid PCM source');
 const all=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
 return {rate,start,channels:[0,1].map(c=>Float32Array.from({length:all.length/2},(_,i)=>all[i*2+c]))};
}
const result=compositePCM(clip(arg('outgoing'),cue.begin-.3),clip(arg('incoming'),cue.entry-Math.min(.8,cue.entry)),cue);
const interleaved=new Float32Array(result.channels[0].length*2);
for(let i=0;i<result.channels[0].length;i++)for(let c=0;c<2;c++)interleaved[i*2+c]=result.channels[c][i];
fs.writeFileSync(arg('output'),Buffer.from(interleaved.buffer));
for(const name of ['outgoing','incoming'])if(arg(name+'-component')){
 const interleaved=new Float32Array(result.components[name][0].length*2);
 for(let i=0;i<result.components[name][0].length;i++)for(let c=0;c<2;c++)interleaved[i*2+c]=result.components[name][c][i];
 fs.writeFileSync(arg(name+'-component'),Buffer.from(interleaved.buffer));
}
console.log(JSON.stringify({...result,channels:undefined,components:undefined}));
