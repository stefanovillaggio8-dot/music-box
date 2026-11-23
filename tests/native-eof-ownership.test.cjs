'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const code=fs.readFileSync('mix-intelligente.js','utf8');
const block=code.slice(code.indexOf(' // Do not run music analysis while iOS is seeking/buffering.'),code.indexOf(' // Retry a missing audio analysis;'));
const natural=code.slice(code.indexOf('function naturalEndHandoff('),code.indexOf('function relaxAdoptedTempo('));
const helperStart=code.indexOf('function claimLiveTransitionEOF('),helper=helperStart<0?'':code.slice(helperStart,code.indexOf('// Native-only natural tail:',helperStart));
function fixture({ended=true,nextId=2}={}){
 const make=new Function('block','natural','helper','ended','nextId',`
  const isIOS=false,enabled=true,id=1,document={hidden:false},window={MusicBoxCompositeMix:{owns:()=>false},MusicBoxRoom:{isActive:()=>false}};
  const audio={paused:true,ended,seeking:false,currentTime:100,duration:100},next={id:nextId};
  const app={audio:()=>audio,currentId:()=>id,mixNext:()=>next};
  let active={nativeCleanTail:true,nativeTailFullBeat:true,original:audio,upcoming:{paused:false,readyState:4},started:true,fromId:1,track:{id:2},handingOff:false};
  let mobileActive=null,prepared=null,mobileFading=false,mixing=true,liveOutro=null,previousId=1,cancels=0,handoffs=0;
  function cancel(){cancels++;active=null;mixing=false}function handoff(){handoffs++;active.handingOff=true}
  const bridge=()=>app,stopMobileMix=()=>{},closeLiveOutro=()=>{},sampleLiveOutro=()=>{},stopSnapPrecision=()=>{};
  eval(natural+';'+helper+';');
  const pulse=new Function('run','return run')(()=>eval('(function(){'+block+'})()'));
  return {pulse,state:()=>({cancels,handoffs,handingOff:active?.handingOff})};
 `);
 return make(block,natural,helper,ended,nextId);
}
test('actual paused-EOF tick claims the live incoming before ordinary paused-player cancellation',()=>{
 const f=fixture();f.pulse();assert.deepEqual(f.state(),{cancels:0,handoffs:1,handingOff:true});
 f.pulse();assert.deepEqual(f.state(),{cancels:0,handoffs:1,handingOff:true},'pending adoption owns repeated EOF callbacks');
});
test('an explicit pause or reordered manual queue never acquires EOF handoff ownership',()=>{
 for(const options of [{ended:false},{nextId:3}]){const f=fixture(options);f.pulse();assert.equal(f.state().handoffs,0);assert.equal(f.state().cancels,1);}
});
