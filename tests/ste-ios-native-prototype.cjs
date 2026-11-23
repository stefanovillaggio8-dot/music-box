'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{chromium,webkit}=require('playwright'),{server}=require('../tools/ste-clean-probe-server.cjs');
(async()=>{
 const [file,output]=process.argv.slice(2);if(!output||fs.existsSync(output))throw Error('New evidence output required');
 const data=JSON.parse(fs.readFileSync(file)),env=server(data),report={physicalIPhone:false,notApplicationIntegration:true,notPlaybackCertified:true,platform:process.platform,results:[]};
 await new Promise(r=>env.server.listen(0,'127.0.0.1',r));
 try{for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  if(process.env.MUSICBOX_COMPOSITE_BROWSERS&&!process.env.MUSICBOX_COMPOSITE_BROWSERS.split(',').includes(name))continue;
  const browser=await engine.launch({headless:true});
  try{for(const variant of ['audible','muted']){
   const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
   const page=await context.newPage();await page.goto('http://127.0.0.1:'+env.server.address().port);
   await page.selectOption('#variant',variant);await page.click('#prime');
   await page.waitForFunction(()=>window.probe&&['primed','stopped'].includes(probe.snapshot().phase),null,{timeout:10000});
   const prime=await page.evaluate(()=>probe.snapshot());assert.equal(prime.phase,'primed',JSON.stringify(prime));
   await page.click('#run');await page.waitForFunction(()=>['adopted','complete','stopped'].includes(probe.snapshot().phase),null,{timeout:12000});
   const result=await page.evaluate(()=>probe.snapshot());assert.ok(['adopted','complete'].includes(result.phase),JSON.stringify(result));
   assert.equal(result.beforeAdoption.sourceEnded,true);assert.equal(result.sameIncomingElement,true);assert.equal(result.incomingStart,0);
   report.results.push({browser:name,version:browser.version(),variant,result});
   await page.evaluate(()=>probe.dispose());await context.close();
  }}finally{await browser.close()}
 }}finally{env.server.close();fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n')}
 console.log(JSON.stringify({controlledDesktopTrials:report.results.length,physicalIPhone:false,notPlaybackCertified:true}));
})().catch(e=>{console.error(e);process.exitCode=1});
