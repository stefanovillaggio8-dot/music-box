const fs=require('fs'),path=require('path'),req=require('module').createRequire(path.resolve('tools/probe.cjs'));
process.argv.push('--scope=../personal-20261116/scopes/Ste.json','--structure=../whole-structure-ci','--edges=../profile-coverage/cloud-edges');
const s=fs.readFileSync('tools/build-preserved-tail-plans.cjs','utf8');
const {prepared}=new Function('require','__dirname',s.slice(0,s.indexOf('const report={'))+'return {prepared}')(req,path.resolve('tools'));
const rank=(role,n)=>prepared.filter(t=>!t[role==='outro'?'source':'target'].length).map(t=>({key:t.key,count:t[role].beats.filter(v=>role==='outro'?v>=t.raw.duration-16:v<=8).length})).sort((a,b)=>b.count-a.count||a.key.localeCompare(b.key)).slice(0,n);
const out=rank('outro',16),intro=rank('intro',16);
const pulse=JSON.parse(fs.readFileSync('../personal-20261116/Ste-baseline-windows.json')).diagnostics.pulseRejections;
const keys=[...new Set([...out,...intro,...pulse.flatMap(p=>[{key:p.from},{key:p.to}])].map(t=>t.key))].sort();
fs.writeFileSync('../ste-focus-20261116/model-sample.json',JSON.stringify({selection:'Before final1 inference: strongest observed attacks among missing-bar edges, plus all 12 existing near-pulse pairs; personal Ste only',out,intro,keys},null,2));console.log(keys.length);
