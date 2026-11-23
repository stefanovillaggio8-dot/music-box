'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium,webkit}=require('playwright'),{server}=require('../tools/ste-clean-probe-server.cjs');
(async()=>{
 const [file,output]=process.argv.slice(2);if(!output||fs.existsSync(output))throw Error('New evidence output required');
 const data=JSON.parse(fs.readFileSync(file)),env=server(data),report={method:'observed-native-clock-before-play-promise-v2',physicalIPhone:false,notApplicationIntegration:true,notPlaybackCertified:true,platform:process.platform,results:[]};
 await new Promise(resolve=>env.server.listen(0,'127.0.0.1',resolve));
 const modes=(process.env.MUSICBOX_OBSERVED_MODES||'natural,seek,hidden').split(',');
 if(modes.some(m=>!['natural','seek','hidden','hidden-after-adopt'].includes(m)))throw Error('Unknown bounded mode');
 try{for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.MUSICBOX_COMPOSITE_BROWSERS&&!process.env.MUSICBOX_COMPOSITE_BROWSERS.split(',').includes(name))continue;
  const browser=await engine.launch({headless:true});let positive=false;
  try{for(const mode of modes){
   if(!['natural','hidden-after-adopt'].includes(mode)&&!positive){report.results.push({browser:name,mode,skipped:'natural-path-not-available'});continue}
   const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
   const page=await context.newPage(),receipt={browser:name,version:browser.version(),mode};
   try{
    await page.goto('http://127.0.0.1:'+env.server.address().port+'/observed');await page.click('#prime');
    await page.waitForFunction(()=>window.probe&&['primed','stopped'].includes(probe.snapshot().phase),null,{timeout:10000});
    receipt.prime=await page.evaluate(()=>probe.snapshot());assert.equal(receipt.prime.phase,'primed');assert.equal(receipt.prime.sourceNeverPlayedDuringPrime,true);
    await page.click('#run');
    await page.waitForFunction(()=>['overlap','adopted','complete','stopped'].includes(probe.snapshot().phase),null,{timeout:12000});
    if(mode==='seek')await page.evaluate(()=>probe.old.currentTime+=.2);
    if(mode==='hidden')await page.evaluate(()=>{window.__testHidden=true;document.dispatchEvent(new Event('visibilitychange'))});
    await page.waitForFunction(()=>['adopted','complete','stopped'].includes(probe.snapshot().phase),null,{timeout:10000});
    if(mode==='hidden-after-adopt'){
     const adopted=await page.evaluate(()=>probe.snapshot());assert.equal(adopted.phase,'adopted');assert.equal(adopted.beforeAdoption.sourceEnded,true);
     receipt.beforeHidden=adopted;await page.evaluate(()=>{window.__testHidden=true;document.dispatchEvent(new Event('visibilitychange'))});
    }
    receipt.result=await page.evaluate(()=>probe.snapshot());
    if(mode==='natural'){
     assert.ok(['adopted','complete'].includes(receipt.result.phase));assert.equal(receipt.result.beforeAdoption.sourceEnded,true);
     assert.equal(receipt.result.sameIncomingElement,true);assert.equal(receipt.result.incomingStart,0);positive=true;
    }else{
     assert.equal(receipt.result.phase,'stopped');assert.equal(receipt.result.reason,mode==='seek'?'source-seek':'hidden');
     assert.equal(receipt.result.incomingPaused,true);assert.equal(receipt.result.sourcePaused,mode==='hidden-after-adopt');
    }
    receipt.accepted=true;
   }catch(e){receipt.accepted=false;receipt.error=e.message;receipt.result=await page.evaluate(()=>window.probe?.snapshot()).catch(()=>null)}
   finally{report.results.push(receipt);await page.evaluate(()=>window.probe?.dispose()).catch(()=>{});await context.close()}
  }}finally{await browser.close()}
 }}finally{env.server.close();fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n')}
 console.log(JSON.stringify({trials:report.results.length,passed:report.results.filter(r=>r.accepted).length,failed:report.results.filter(r=>r.accepted===false).length,physicalIPhone:false}));
 if(!report.results.length||report.results.some(r=>r.accepted!==true))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
