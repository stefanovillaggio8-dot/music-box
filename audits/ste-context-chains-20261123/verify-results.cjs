'use strict';
// Read-only verification of this bounded experiment, not an acoustic test.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=name=>JSON.parse(fs.readFileSync(path.join(__dirname,name),'utf8'));
const before=read('checkpoint-baseline-full.json'),baseline=read('baseline-full.json'),joined=read('context-full-final.json'),partial=read('context-metrical-classified.json');
for(const key of ['plans','profileFunnel','pairConditions','windowExclusions','windows'])assert.deepEqual(baseline[key],before[key]);
for(const r of [before,baseline,joined,partial]){assert.equal(r.requestedCases,3);assert.equal(r.caseRestricted,true);assert.deepEqual(r.plans,[]);}
const count=Object.fromEntries(joined.diagnostics.contextChainCounts.map(x=>[x.key,x.outro]));
assert.equal(count['audio/songs/track-40.mp3'],2);assert.equal(count['audio/songs/track-49.mp3'],1);
const cases=Object.fromEntries(joined.diagnostics.caseDiagnostics.map(x=>[x.from+'|'+x.to,x]));
assert.equal(cases['audio/songs/track-40.mp3|audio/songs/track-50.mp3'].firstMissing,'harmony');
assert.equal(cases['audio/songs/track-49.mp3|audio/songs/track-50.mp3'].firstMissing,'voice');
assert.equal(cases['audio/songs/track-50.mp3|audio/songs/track-39.mp3'].firstMissing,'noCoherentInitialBars');
assert.equal(partial.profileFunnel.Ste.unsupportedMetricalTail,2);
assert.equal(partial.pairConditions.Ste.bpm,undefined);
assert.equal(partial.windowExclusions.Ste.unsupportedMetricalTail,30);
assert.equal(read('previous-case-classification.json').rows.length,6);
console.log('Archived outcomes verified: unchanged baseline; three new chain hypotheses; zero deployable plans; tail veto correctly separated from BPM.');
