'use strict';
// Join independently measured recordings, then run the unchanged cue validator.
// Produces SHADOWS only; never touches the application's installed index.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {build}=require('../../tools/build-factored-clean-candidate.cjs');
const {proposal}=require('../../tools/factored-native-clean.cjs');
const [linux,mac,output]=process.argv.slice(2);
if(!output||fs.existsSync(output))throw Error('New output folder required');
const data=structuredClone(require('./recordings.json')),cases=require('./cases.json');
const platforms=new Set();
for(const file of [linux,mac]){
 const d=JSON.parse(fs.readFileSync(file));assert.equal(d.notPlaybackCertified,true);assert.equal(d.physicalIPhone,false);
 assert(['linux','darwin'].includes(d.platform)&&!platforms.has(d.platform));platforms.add(d.platform);
 assert.equal(d.results.length,8);
 for(const r of d.results){
  const record=data.recordings[r.sourceSha];assert(record?.prefix?.notNativeCertified);assert(['chromium','webkit'].includes(r.browser));assert.equal(r.measurements.length,2);
  for(const m of r.measurements)record.prefix.native.push({...m,browser:r.browser,platform:d.platform});
 }
}
assert.equal(platforms.size,2);fs.mkdirSync(output);
const source=Object.values(data.recordings).find(r=>r.quietSuffix),report=[];
for(const pair of cases){
 const target=Object.values(data.recordings).find(r=>r.key===pair.to);
 const proposed=proposal(source,target,source.quietSuffix.begin);
 if(!proposed.accepted){report.push({pair,accepted:false,reason:proposed.reason});continue;}
 const id=pair.to.match(/track-(\d+)\.mp3$/)[1],render=JSON.parse(fs.readFileSync(path.join(__dirname,'render-'+id+'.json')));
 const fixture=build(data,pair,render);
 fs.writeFileSync(path.join(output,'track-'+id+'-shadow.json'),JSON.stringify(fixture,null,2)+'\n');
 report.push({pair,accepted:true,kind:'clean-only',nativeObservations:target.prefix.native.length,notPlaybackCertified:true});
}
fs.writeFileSync(path.join(output,'recordings-native.json'),JSON.stringify(data,null,2)+'\n');
fs.writeFileSync(path.join(output,'assembly.json'),JSON.stringify({results:report,installed:false,certified:false},null,2)+'\n');
console.log(JSON.stringify(report));
