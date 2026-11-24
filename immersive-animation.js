/* Silent Music Box scenes. Cache the environment and redraw the moving
   foreground at a bounded frame rate while the immersive stage is visible. */
(function(){
"use strict";
const palettes={
 jade:["#061613","#11362e","#53bc92","#d9f7bf"],
 clay:["#1d100e","#563026","#d98869","#ffdfb5"],
 acid:["#101912","#2a4219","#a5d84c","#e8ffa6"],
 plum:["#190e1c","#4b2349","#ce75ab","#f5c9e5"],
 scarlet:["#1e0b11","#5a1927","#f05d68","#ffd1bd"],
 gold:["#20140d","#53361d","#efb86b","#fff0b5"],
 rose:["#1c111a","#56293f","#e48d9d","#ffe1d4"],
 garnet:["#1c0a13","#4b142c","#b44762","#ffc7c7"],
 ember:["#1e1010","#5b2c1b","#ff8b49","#ffdfa7"],
 steel:["#0a151d","#243e55","#79b7d0","#d4eff6"],
 ice:["#0d1725","#274357","#85b9eb","#e8f5ff"],
 violet:["#130f24","#312a58","#9a82e5","#e3d6ff"],
 slate:["#10141e","#30364c","#91a7c0","#e7ecfa"],
 lagoon:["#071e28","#164a58","#65c9cb","#d0fff0"],
 teal:["#09191d","#20504c","#63bfb1","#d5fbeb"],
 peach:["#211412","#5d362e","#f1b390","#ffecd0"],
 fuchsia:["#1b101f","#54254e","#ef73b7","#ffe0f1"]
};
const tau=Math.PI*2;
const motionStep=1000/24;
const environments={
 film:0,city:1,headlights:1,rail:1,stairs:1,window:2,mirror:2,clock:2,fold:2,
 water:3,shell:3,storm:3,rain:3,piano:2,candle:2,chess:4,apple:5,gate:4,crown:4,maze:4,mask:4,shield:4,blade:4,stone:4,
 rose:5,branch:5,heart:5,leaf:5,peak:6,sun:6,wings:6,ember:6,
 moon:7,orbit:7,stars:7
};
// The environment is shared; subjects, palette, camera and cues are track-specific.
Object.assign(environments,{
 astronaut:7,mars:7,skyline:1,road:1,stadium:1,
 lighthouse:3,bridge:3,sail:3,snow:6,tightrope:6,desert:6,
 home:2,letter:2,coffee:2,record:2,radio:2,monitor:8,bills:8,trophy:8,
 halves:5,bubbles:5,mushrooms:5,petalMaze:4,circus:8,club:8,
 tear:2,rewind:7,razor:8,wax:4,breath:2
});
const textures={image:null,ready:false};
const textureUrl=new URL("immersive-textures.webp?v=1",document.currentScript?.src||document.baseURI);
let active=null,frame=0,lastFrame=0;
function hash(id){
 let value=2166136261;
 for(const letter of id)value=Math.imul(value^letter.charCodeAt(0),16777619);
 return value>>>0;
}
function random(seed){
 let value=seed;
 return ()=>{
  value=Math.imul(value,1664525)+1013904223|0;
  return (value>>>0)/4294967296;
 };
}
function circle(c,x,y,r){
 c.beginPath();c.arc(x,y,r,0,tau);c.fill();
}
function ellipse(c,x,y,rx,ry,angle=0){
 c.beginPath();c.ellipse(x,y,rx,ry,angle,0,tau);c.stroke();
}
function line(c,points,fill=false){
 c.beginPath();
 points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
 if(fill){c.closePath();c.fill()}else c.stroke();
}
function curve(c,from,controls,to){
 c.beginPath();c.moveTo(...from);c.bezierCurveTo(...controls,...to);c.stroke();
}
function rays(c,count,inner,outer,tilt=0){
 for(let i=0;i<count;i++){
  const a=tilt+i*tau/count;
  line(c,[[inner*Math.cos(a),inner*Math.sin(a)],[outer*Math.cos(a),outer*Math.sin(a)]]);
 }
}
function curveGrid(c,n,strength){
 for(let i=0;i<n;i++){
  const y=(i-(n-1)/2)*.21;
  curve(c,[-1.05,y],[-.45,y-strength,.35,y+strength],[1.05,y]);
 }
}
const subjects={
 petalMaze(c,_random,t){
  c.save();c.globalAlpha*=.65;subjects.maze(c);c.restore();
  c.save();c.translate(.28*Math.sin(t),.22-.49*Math.sin(t/2)**2);
  c.rotate(t);ellipse(c,0,0,.20,.33,-.16);
  curve(c,[0,-.30],[-.06,-.09,.12,.07],[0,.32]);c.restore();
 },
 circus(c,_random,t){
  line(c,[[-.87,-.17],[0,-.75],[.87,-.17],[-.87,-.17]]);
  line(c,[[-.71,-.17],[-.71,.67],[.71,.67],[.71,-.17]]);
  line(c,[[0,-.75],[0,-.95],[.24,-.89],[0,-.83]]);
  for(let i=-5;i<=5;i++)line(c,[[i*.128,-.17],[i*.125+.04*Math.sin(t+i),.67]]);
  curve(c,[-.26,.67],[-.18,.23,.18,.23],[.26,.67]);
 },
 club(c,_random,t){
  ellipse(c,0,-.45,.18,.11);
  for(let i=-3;i<=3;i++){
   const x=i*.28,y=.69+.15*Math.sin(t+i*.66);
   c.globalAlpha=.16+.12*Math.cos(t+i*.57)**2;
   line(c,[[i*.055,-.39],[x-.16,y],[x+.16,y],[i*.055,-.39]],true);
   ellipse(c,x,y,.16,.04);
  }
 },
 monitor(c,_random,t){
  c.strokeRect(-.87,-.59,1.74,1.14);
  c.strokeRect(-.73,-.47,1.46,.88);
  line(c,[[-.42,.76],[.42,.76]]);
  line(c,[[0,.55],[0,.76]]);
  const y=.11+.31*Math.sin(t);
  c.globalAlpha*=.55;
  c.fillRect(-.70,y,1.4,.065);
  for(let i=0;i<12;i++)c.fillRect(-.6+i*.11,.27,.055,-.24-.14*Math.sin(2*t+i*.7));
 },
 astronaut(c,_random,t){
  ellipse(c,0,-.16,.62,.72);
  ellipse(c,.07,-.16,.47,.48,-.18);
  curve(c,[-.28,-.29],[-.11,-.58,.24,-.52],[.4,-.35]);
  curve(c,[-.61,.49],[-.5,.92,.57,.92],[.65,.46]);
  line(c,[[-.41,.36],[-.64,.67],[-.77,.81]]);
  circle(c,.14+.21*Math.sin(t),-.16+.15*Math.cos(t),.09);
 },
 trophy(c,_random,t){
  ellipse(c,0,-.35,.51,.51);
  ellipse(c,0,-.35,.36+.12*Math.cos(t),.5);
  line(c,[[-.39,-.16],[-.19,.15],[.18,.15],[.4,-.16]]);
  line(c,[[-.14,.15],[-.19,.51],[-.47,.63],[.47,.63],[.18,.51],[.13,.15]]);
  c.strokeRect(-.56,.64,1.12,.18);
  c.save();c.translate(0,-.35);rays(c,10,.57,.71,t);c.restore();
 },
 coffee(c,_random,t){
  ellipse(c,-.16,.05,.47,.13);
  curve(c,[-.63,.04],[-.61,.95,.36,.96],[.31,.04]);
  curve(c,[.31,.16],[.85,.05,.89,.49],[.26,.49]);
  ellipse(c,-.12,.70,.67,.105);
  for(let i=0;i<3;i++){
   const x=-.36+i*.24;
   curve(c,[x,-.14],[x+.29*Math.sin(t+i),-.33,x-.28*Math.cos(t+i),-.55],[x+.07,-.81]);
  }
 },
 radio(c,_random,t){
  c.strokeRect(-.93,-.46,1.86,.91);
  line(c,[[-.74,-.46],[.44,-.80]]);
  ellipse(c,-.55,0,.22,.22);
  ellipse(c,.56,.15,.13,.13);
  c.strokeRect(-.14,-.22,.82,.19);
  line(c,[[.25+.30*Math.sin(t),-.21],[.25+.30*Math.sin(t),-.04]]);
  for(let i=0;i<5;i++)line(c,[[-.63,-.12+i*.06],[-.46,-.12+i*.06]]);
 },
 mars(c,_random,t){
  c.save();c.globalAlpha*=.45;
  circle(c,0,0,.62);
  c.restore();
  c.globalAlpha*=.63;
  ellipse(c,0,0,.74,.74);
  for(let i=0;i<8;i++){
   const a=i*2.4+t;
   ellipse(c,Math.cos(a)*.42,Math.sin(a)*.4,.07+i*.008,.05+i*.004,a);
  }
  curve(c,[-.9,.21],[-.2,.59,.51,-.1],[.89,-.39]);
 },
 letter(c,_random,t){
  const open=.12+.51*(.5+.5*Math.sin(t));
  c.strokeRect(-.7,-.01,1.4,.82);
  line(c,[[-.7,0],[0,.48],[.7,0]]);
  c.strokeRect(-.55,-open,1.05,open+.02);
  for(let i=0;i<3;i++){
   const y=-open+.11+i*.121;
   if(y<-.02)line(c,[[-.4,y],[.24+i*.05,y]]);
  }
 },
 lighthouse(c,_random,t){
  line(c,[[-.52,.71],[.53,.71]]);
  line(c,[[-.18,.69],[-.11,-.45],[.11,-.45],[.18,.69]]);
  c.strokeRect(-.15,-.65,.30,.19);
  line(c,[[-.21,-.65],[0,-.82],[.21,-.65]]);
  c.globalAlpha*=.45;
  for(let i=0;i<4;i++){
   const y=.74+i*.07;
   curve(c,[-.95,y],[-.45,y+.14*Math.sin(t+i),.45,y-.14*Math.sin(t+i)],[.95,y]);
  }
 },
 snow(c,r,t){
  for(let i=0;i<19;i++){
   const x=2*r()-1,y=2*((r()+t/tau)%1)-1,sz=.018+r()*.046;
   c.save();c.translate(x+.11*Math.sin(t+i),y);
   rays(c,6,0,sz,t/3);c.restore();
  }
  ellipse(c,0,-.10,.40,.40);
  line(c,[[.21,.12],[0,-.10],[.03,-.34]]);
 },
 bridge(c,_random,t){
  line(c,[[-1,.34],[1,.34]]);
  for(const x of [-.62,.62])line(c,[[x,.68],[x,-.68]]);
  curve(c,[-1,-.2],[-.38,-.93,.38,-.93],[1,-.2]);
  for(let i=-6;i<=6;i++){
   const x=i*.14;
   line(c,[[x,-.75+.60*x*x],[x,.34]]);
  }
  for(let i=0;i<4;i++){
   const y=.49+i*.13;
   curve(c,[-.96,y],[-.4,y+.10*Math.cos(t+i),.35,y-.10*Math.sin(t+i)],[.96,y]);
  }
 },
 sail(c,_random,t){
  c.translate(.09*Math.sin(t),.08*Math.cos(t));c.rotate(.12*Math.sin(t));
  line(c,[[-.69,.44],[-.46,.65],[.50,.65],[.72,.44],[-.69,.44]]);
  line(c,[[0,.40],[0,-.75],[-.55,.30],[0,.30]]);
  line(c,[[.08,-.53],[.56,.31],[.08,.31],[.08,-.53]]);
 },
 desert(c,_random,t){
  for(let i=0;i<6;i++){
   const y=-.34+i*.24;
   curve(c,[-1,y],[-.52,y-.81+.10*Math.sin(t+i),.27,y+.49],[1,y-.08]);
  }
  ellipse(c,.58,-.49,.19,.19);
 },
 skyline(c,r,t){
  const opacity=c.globalAlpha;
  for(let i=0;i<11;i++){
   const x=-.99+i*.18,top=i===4?-.82:i===7?-.61:-.17-r()*.37;
   c.strokeRect(x,top,.16,.45-top);
   if(i===4)for(const a of [.025,.13])line(c,[[x+a,top],[x+a,top-.20]]);
   for(let j=0;j<3;j++)if(top+.11*j<.36){
    c.globalAlpha=opacity*(.45+.45*Math.cos(t+i+j)**2);
    c.fillRect(x+.03,top+.10+.11*j,.095,.024);
   }
   c.globalAlpha=opacity;
  }
  for(let i=0;i<6;i++)line(c,[[-.84+i*.17,.53+i*.06],[.89-i*.14,.53+i*.06]]);
 },
 road(c,_random,t){
  line(c,[[-.93,.87],[-.12,-.49]]);
  line(c,[[.93,.87],[.12,-.49]]);
  for(let i=0;i<8;i++){
   const d=((i/8+t/tau)%1)**1.5,y=-.45+1.26*d;
   line(c,[[0,y],[0,y+.035+d*.11]]);
  }
  ellipse(c,0,-.48,.22,.16);
 },
 tightrope(c,_random,t){
  const sag=.13+.055*Math.sin(t);
  curve(c,[-1,-.02],[-.5,sag,.5,sag],[1,-.02]);
  c.save();c.translate(.42*Math.sin(t),sag*.55);c.rotate(-.17*Math.cos(t));
  ellipse(c,0,-.31,.065,.065);
  line(c,[[0,-.25],[0,-.09],[-.09,0]]);
  line(c,[[0,-.09],[.11,-.02]]);
  line(c,[[-.30,-.18],[.30,-.22]]);c.restore();
 },
 rewind(c,_random,t){
  ellipse(c,0,0,.64,.64);
  for(let i=0;i<5;i++)ellipse(c,0,0,.15+.48*Math.abs(Math.cos(t+i*.64)),.63);
  ellipse(c,0,0,.63,.21);
  c.save();c.rotate(-t);
  line(c,[[.59,-.65],[.76,-.37],[.88,-.65]]);c.restore();
 },
 halves(c,_random,t){
  const split=.19+.18*Math.sin(t);
  for(const side of [-1,1]){
   c.save();c.translate(side*split,0);c.scale(side,1);
   curve(c,[.04,.65],[.77,.27,1.02,-.84],[.04,-.32]);
   line(c,[[.04,-.32],[.21,-.02],[.02,.18],[.18,.36],[.04,.65]]);
   c.restore();
  }
 },
 wax(c,r,t){
  line(c,[[-.63,-.69],[-.34,-.82],[.35,-.82],[.69,-.59],[.42,.40],[0,.65],[-.43,.42],[-.63,-.69]]);
  ellipse(c,-.30,-.25,.22,.12,.13);ellipse(c,.30,-.25,.22,.12,-.13);
  for(let i=0;i<7;i++){
   const y=((i*.24+t/tau)%1)*.72+.31;
   circle(c,-.52+1.04*r(),y,.019+.018*r());
  }
 },
 mushrooms(c,_random,t){
  for(let i=0;i<4;i++){
   const x=-.64+i*.42,y=.22-.31*Math.cos(i+1);
   curve(c,[x,y],[x-.24,y-.45,x+.18,y-.49],[x+.24,y-.02]);
   line(c,[[x-.19,y],[x+.24,y-.02]]);
   curve(c,[x+.07,y],[x+.08+.06*Math.sin(t+i),y+.24,x-.12,y+.32],[x+.05,y+.51]);
  }
 },
 bills(c,r,t){
  for(let i=0;i<10;i++){
   const x=2*r()-1,y=2*((r()+t/tau)%1)-1;
   c.save();c.translate(x+.13*Math.sin(t+i),y);c.rotate(t+i*.69);
   c.strokeRect(-.18,-.081,.36,.162);ellipse(c,0,0,.049,.052);c.restore();
  }
 },
 phone(c,_random,t){
  c.strokeRect(-.49,-.86,.98,1.72);
  line(c,[[-.18,.72],[.18,.72]]);
  for(let i=0;i<18;i++)c.fillRect(-.38+.042*i,-.14,.025,.12+.18*Math.sin(i*.43+3*t));
 },
 stadium(c,_random,t){
  c.strokeRect(-.88,-.63,1.76,1.26);
  line(c,[[0,-.63],[0,.63]]);
  ellipse(c,0,0,.20,.20);
  c.strokeRect(-.88,-.29,.31,.58);c.strokeRect(.57,-.29,.31,.58);
  circle(c,.49*Math.sin(t),.22*Math.sin(2*t),.057);
 },
 bubbles(c,r,t){
  for(let i=0;i<13;i++){
   const x=1.8*r()-.90,y=1-2*((r()+t/tau)%1),s=.04+r()*.14;
   ellipse(c,x+.09*Math.sin(t+i),y,s,s*.94);
  }
 },
 tear(c,_random,t){
  subjects.eye(c);
  const y=.30+.68*t/tau;
  const opacity=1-t/tau;
  c.globalAlpha*=opacity;
  curve(c,[.26,y-.14],[.10,y+.14,.41,y+.12],[.26,y-.14]);
 },
 record(c,_random,t){
  for(let i=1;i<=8;i++)ellipse(c,0,0,.11+i*.08,.11+i*.08);
  c.save();c.rotate(t);
  line(c,[[.09,-.29],[.32,-.68]]);c.restore();
  line(c,[[.83,-.78],[.68,-.37],[.37,-.21]]);
 },
 breath(c,_random,t){
  for(const side of [-1,1]){
   c.save();c.scale(side,1);
   for(let i=0;i<4;i++){
    const y=(i-1.5)*.24;
    curve(c,[.11,y],[.40,y-.23*Math.sin(t+i),.65,y+.21*Math.cos(t+i)],[.92,y]);
   }
   c.restore();
  }
 },
 home(c,_random,t){
  line(c,[[-.83,-.28],[0,-.88],[.81,-.28]]);
  c.strokeRect(-.61,-.29,1.22,1.05);
  c.strokeRect(-.19,.27,.37,.49);
  c.globalAlpha*=.55+.45*Math.sin(t)**2;
  for(const x of [-.45,.19])c.fillRect(x,-.13,.25,.23);
 },
 razor(c,_random,t){
  c.rotate(-.59+.12*Math.sin(t));
  line(c,[[-.90,-.24],[-.59,-.40],[.72,-.40],[.91,-.23],[.68,.23],[-.73,.23],[-.90,-.24]]);
  line(c,[[-.70,.08],[.75,.08]]);
  for(const x of [-.59,.59])ellipse(c,x,-.08,.08,.08);
 },
 shell(c,_random,t){
  for(let i=-5;i<=5;i++){
   const x=i*.16;
   curve(c,[0,.66],[x*.55,.1,x*(1.23+.12*Math.sin(t)),-.95],[x,-.55+Math.abs(x)*.27]);
  }
  ellipse(c,0,.61,.22,.08);
 },
 headlights(c,_random,t){
  const width=.33+.12*Math.sin(t);
  for(const side of [-1,1]){
   const x=side*width;
   circle(c,x,-.07,.095);
   line(c,[[x,-.07],[x*2,.86]]);
   line(c,[[x,-.02],[x*.62,.86]]);
  }
  line(c,[[-width*1.1,-.17],[-.21,-.41],[.21,-.41],[width*1.1,-.17]]);
 },
 piano(c,_random,t){
  c.strokeRect(-.94,-.42,1.88,.87);
  for(let i=0;i<10;i++){
   const x=-.94+i*.188;
   line(c,[[x,-.42],[x,.45]]);
   if(i%3!==0)c.fillRect(x-.04,-.42,.081,.48);
  }
  const key=Math.floor(t/tau*10);
  c.globalAlpha*=.8;
  c.fillRect(-.93+key*.188,.14,.16,.29);
 },
 candle(c,_random,t){
  c.strokeRect(-.19,.03,.38,.8);
  line(c,[[-.36,.84],[.36,.84]]);
  const lean=.11*Math.sin(2*t);
  c.beginPath();c.moveTo(0,-.02);c.bezierCurveTo(-.42,-.19,lean-.17,-.53,lean,-.78);
  c.bezierCurveTo(lean+.33,-.44,.45,-.21,0,-.02);c.fill();
  ellipse(c,0,-.31,.34,.48);
 },
 apple(c){
  c.beginPath();c.moveTo(0,-.45);c.bezierCurveTo(-1.06,-1,-.84,.59,-.26,.69);
  c.quadraticCurveTo(0,.55,.27,.69);c.bezierCurveTo(.59,.62,.73,.31,.72,.04);
  c.bezierCurveTo(.26,.11,.37,-.42,.69,-.46);c.quadraticCurveTo(.41,-.74,0,-.45);c.stroke();
  curve(c,[0,-.43],[-.15,-.64,.01,-.84],[.18,-.94]);
 },
 chess(c,_random,t){
  for(let y=0;y<6;y++)for(let x=0;x<6;x++)if((x+y)%2===0)
   c.fillRect(x*.26-.78,y*.16-.11,.26,.16);
  c.translate(.16*Math.sin(t),0);
  line(c,[[-.3,.25],[-.19,-.09],[-.02,-.31],[-.31,-.21],[-.41,-.4],[-.05,-.78],[.25,-.7],[.41,.25],[-.3,.25]]);
  circle(c,.05,-.53,.045);
 },
 film(c,_random,t){
  c.rotate(-.15);
  c.strokeRect(-.8,-.84,1.6,1.68);
  for(const sign of [-1,1])for(let i=0;i<8;i++)c.strokeRect(sign*.72-.042,-.79+(i*.2+t/tau*.4+.2)%1.6,.084,.1);
  ellipse(c,0,0,.56,.56);ellipse(c,0,0,.46,.46);
  const mark=c.fillStyle;
  for(let i=0;i<5;i++){const a=i*tau/5+2*t;circle(c,.3*Math.cos(a),.3*Math.sin(a),.105)}
  c.fillStyle=mark;circle(c,0,0,.055);
  line(c,[[-.58,-.68],[.58,-.68]]);line(c,[[-.58,.68],[.58,.68]]);
 },
 gate(c,_random,t){
  for(let i=0;i<5;i++){
   const s=.96-i*.135+.045*Math.sin(t+i*.6);
   c.beginPath();c.moveTo(-s,.9*s);c.lineTo(-s,-.22*s);
   c.bezierCurveTo(-s,-1.17*s,s,-1.17*s,s,-.22*s);c.lineTo(s,.9*s);c.stroke();
  }
  line(c,[[-.35,.91],[0,-.36],[.35,.91]]);
 },
 branch(c,r,t){
  curve(c,[0,1],[-.35,.3,.27,-.42],[0,-.96]);
  for(let i=0;i<8;i++){
   const y=.66-i*.21,x=(i%2?-1:1)*(.47+r()*.37)*(1-i*.045)+.095*Math.sin(t+i*.4);
   curve(c,[0,y],[x*.35,y+.1,x*.71,y-.1],[x,y-.22]);
   ellipse(c,x*.84,y-.2,.18,.048,x>0?-.42:.42);
  }
 },
 moon(c){
  c.beginPath();c.arc(-.16,0,.75,-1.25,1.25,true);
  c.bezierCurveTo(-.27,.54,-.27,-.54,.077,-.712);c.closePath();c.fill();
  ellipse(c,-.16,0,.87,.87);c.save();c.translate(.69,-.44);rays(c,4,0,.19);c.restore();
 },
 mask(c){
  line(c,[[-.76,-.56],[-.41,-.77],[.43,-.77],[.78,-.54],[.58,.28],[0,.75],[-.58,.29],[-.76,-.56]]);
  line(c,[[-.67,-.23],[0,.1],[.65,-.23]]);
  ellipse(c,-.35,-.23,.21,.082,.24);ellipse(c,.35,-.23,.21,.082,-.24);
  line(c,[[0,-.7],[0,.2],[-.19,.34],[.19,.34],[0,.2]]);
 },
 blade(c){
  c.rotate(.47);
  line(c,[[0,-.95],[.27,-.45],[.18,.43],[0,.64],[-.18,.43],[-.27,-.45],[0,-.95]]);
  line(c,[[0,-.86],[0,.97]]);line(c,[[-.47,.42],[.47,.42]]);
  for(let i=0;i<4;i++)ellipse(c,0,.55+i*.1,.12,.035);
 },
 crown(c){
  line(c,[[-.94,-.49],[-.48,-.12],[-.29,-.69],[0,-.21],[.3,-.69],[.48,-.12],[.94,-.49],[.65,.56],[-.65,.56],[-.94,-.49]]);
  line(c,[[-.66,.36],[.67,.36]]);
  for(let i=-2;i<=2;i++)circle(c,i*.24,.18,.033);
 },
 rose(c,_random,t){
  for(let i=0;i<12;i++){
   const a=i*2.399963+.19*Math.sin(t+i*.3),s=.16+i*.044+Math.sin(t+i*.24)*.045;
   ellipse(c,Math.cos(a)*s*.52,Math.sin(a)*s*.52,s,s*.57,a);
  }
  curve(c,[.24,.53],[.17,.82,-.53,.57],[-.52,1]);
  ellipse(c,-.3,.67,.25,.071,-.45);
 },
 wings(c,_random,t){
  for(const sign of [-1,1])for(let i=0;i<8;i++){
   const n=i*.09;
   curve(c,[0,.57],[sign*(.38+n),.35-n,sign*(1.11-n*.21),-.11-n],[sign*(.95-n*.93),-.86+n*.76+.27*Math.sin(t+n)]);
  }
  ellipse(c,0,-.66,.19,.08);
 },
 eye(c){
  curve(c,[-.96,0],[-.41,-.78,.41,-.78],[.96,0]);
  curve(c,[-.96,0],[-.41,.78,.41,.78],[.96,0]);
  ellipse(c,0,0,.39,.39);ellipse(c,0,0,.27,.27);circle(c,0,0,.15);rays(c,14,.27,.37);
 },
 ribbon(c){
  for(let i=0;i<11;i++){
   const d=(i-5)*.071;
   curve(c,[-.98,.57+d],[-.63,-1.55+d,.71,1.42+d],[.98,-.58+d]);
  }
 },
 signal(c,r){
  for(let row=0;row<4;row++){
   const y=(row-1.5)*.28,p=[];
   for(let i=0;i<16;i++)p.push([-1+i/7.5,y+(r()-.5)*(.12+row*.06)]);
   line(c,p);
  }
  ellipse(c,0,0,.65,.65);
 },
 window(c){
  c.strokeRect(-.68,-.88,1.36,1.76);c.strokeRect(-.56,-.77,1.12,1.54);
  line(c,[[0,-.76],[0,.76]]);line(c,[[-.56,0],[.56,0]]);
  curve(c,[-.52,.33],[-.12,.09,.21,.57],[.52,.25]);
  c.save();c.translate(.29,-.4);rays(c,4,0,.14);c.restore();
 },
 ink(c,r){
  for(let i=0;i<18;i++){
   const a=i*tau/18,b=.2+r()*.73;
   const xy=[Math.cos(a)*b,Math.sin(a)*b];
   ellipse(c,xy[0]*.45,xy[1]*.45,b,b*.28,a);
  }
 },
 shield(c){
  line(c,[[-.68,-.74],[0,-.93],[.68,-.74],[.53,.29],[0,.89],[-.53,.29],[-.68,-.74]]);
  line(c,[[0,-.76],[.45,-.63],[.37,.25],[0,.64],[-.37,.25],[-.45,-.63],[0,-.76]]);
  line(c,[[-.27,0],[0,.33],[.27,0],[0,-.33],[-.27,0]]);
 },
 stone(c){
  line(c,[[-.73,.33],[-.58,-.41],[.01,-.81],[.65,-.49],[.8,.24],[.37,.7],[-.44,.68],[-.73,.33]]);
  line(c,[[-.73,.33],[-.08,.11],[.01,-.81],[.33,-.09],[.65,-.49]]);
  line(c,[[-.44,.68],[-.08,.11],[.33,-.09],[.8,.24]]);
  ellipse(c,-.02,-.02,1,.73,-.22);
 },
 orbit(c,_random,t){
  circle(c,0,0,.245);
  for(let i=0;i<6;i++)ellipse(c,0,0,.69+i*.045,.29+i*.021,i*.57);
  circle(c,.81*Math.cos(t),.39*Math.sin(t),.076);
  circle(c,.58*Math.cos(2*t+1.7),.61*Math.sin(2*t+1.7),.044);
 },
 notes(c){
  for(let i=0;i<5;i++)line(c,[[-.89,(i-2)*.18],[.89,(i-2)*.18]]);
  for(let i=0;i<4;i++){
   const x=-.62+i*.39,y=.33-i*.18+(i%2)*.17;
   ellipse(c,x,y,.116,.072,-.3);line(c,[[x+.109,y],[x+.109,y-.54],[x+.25,y-.43]]);
  }
 },
 heart(c,_random,t){
  for(let i=0;i<5;i++){
   const b=1-i*.12+.07*Math.sin(2*t-i*.6);
   c.beginPath();c.moveTo(0,.7*b);c.bezierCurveTo(-1.61*b,-.29*b,-.46*b,-.99*b,0,-.43*b);
   c.bezierCurveTo(.46*b,-.99*b,1.61*b,-.29*b,0,.7*b);c.stroke();
  }
 },
 stars(c,r){
  for(let i=0;i<9;i++){
   const a=i*tau/9,d=.37+r()*.55,x=d*Math.cos(a),y=d*Math.sin(a);
   c.save();c.translate(x,y);rays(c,4,0,i%3?.105:.19);c.restore();
   if(i%3)line(c,[[x,y],[Math.cos(a+.7)*d,Math.sin(a+.7)*d]]);
  }
  ellipse(c,0,0,.48,.48);
 },
 city(c,r,t){
  for(let i=0;i<9;i++){
   const y=.64-r()*1.37,x=-.92+i*.21;
   c.strokeRect(x,y,.16,.81-y);
   for(let sy=y+.13;sy<.72;sy+=.13){
    c.globalAlpha=.24+.38*(.5+.5*Math.sin(2*t+i*.6+sy*4));
    line(c,[[x+.046,sy],[x+.11,sy]]);
   }
   c.globalAlpha=.56;
  }
  line(c,[[-1,.81],[1,.81]]);
 },
 rail(c,_random,t){
  line(c,[[-.72,.84],[-.1,-.62]]);line(c,[[.72,.84],[.1,-.62]]);
  for(let i=0;i<10;i++){
   const e=((i/10+t/tau)%1)**1.6,y=-.61+1.42*e,x=.12+.56*e;
   line(c,[[-x,y],[x,y]]);
  }
  ellipse(c,0,-.65,.22,.22);
 },
 fold(c){
  line(c,[[-.89,-.6],[.9,-.6],[.9,.66],[-.89,.66],[-.89,-.6],[0,.05],[.9,-.6]]);
  line(c,[[-.9,.66],[-.2,-.09]]);line(c,[[.9,.66],[.21,-.09]]);
  ellipse(c,0,.06,.13,.13);
 },
 mirror(c,r){
  for(let i=0;i<5;i++)ellipse(c,0,0,.62+i*.055,.79+i*.052,-.28);
  const x=-.1+r()*.2;
  for(let i=0;i<7;i++){
   const a=i*tau/7;
   line(c,[[x,.07],[Math.sin(a)*.39,Math.cos(a)*.43],[Math.sin(a+.12)*.61,Math.cos(a+.12)*.78]]);
  }
 },
 sun(c){
  ellipse(c,0,-.14,.49,.49);c.save();c.translate(0,-.14);rays(c,22,.53,.83);c.restore();
  for(let i=0;i<4;i++)line(c,[[-.78+i*.09,.47+i*.09],[.78-i*.09,.47+i*.09]]);
 },
 water(c,_random,t){
  for(let i=0;i<8;i++){
   const y=(i-3.5)*.21+.045*Math.sin(t+i);
   curve(c,[-1.05,y],[-.45,y-.49+.22*Math.cos(t+i*.5),.35,y+.38+.2*Math.sin(t+i*.8)],[1.05,y]);
  }
 },
 peak(c){
  line(c,[[-1,.64],[-.5,-.16],[-.23,.18],[.24,-.85],[1,.63]]);
  line(c,[[-.05,-.27],[.23,-.46],[.47,-.27]]);
  for(let i=0;i<4;i++)line(c,[[-1+i*.11,.68+i*.065],[1-i*.11,.68+i*.065]]);
 },
 stairs(c){
  const points=[[-.96,.8]];
  for(let i=0;i<8;i++){const x=-.96+i*.227,y=.8-i*.207;points.push([x+.227,y],[x+.227,y-.207])}
  line(c,points);line(c,[[.856,-.856],[.98,-.856]]);
  for(let i=0;i<6;i++)line(c,[[-.55+i*.24,.9],[.97,.9-i*.24]]);
 },
 storm(c,r,t){
  curveGrid(c,7,.79+.22*Math.cos(t));
  for(let i=0;i<6;i++){const x=-1+r()*2,y=-.78+r()*1.4;line(c,[[x,y],[x+.13,y-.27]])}
 },
 rain(c,r){
  for(let i=0;i<52;i++){
   const x=-1+r()*2,y=-.92+r()*1.87,l=.05+r()*.14;
   line(c,[[x,y],[x-l*.45,y+l]]);
  }
  ellipse(c,0,.65,.72,.16);ellipse(c,0,.65,.46,.095);
 },
 lens(c,_random,t){for(let i=0;i<12;i++)ellipse(c,0,0,.22+i*.055,.21+i*.06,i*.14+.14*Math.sin(t));rays(c,8,.64,.86,t/4)},
 maze(c){
  for(let i=0;i<8;i++){const n=.92-i*.104;line(c,[[-n,.17],[-n,-n],[n,-n],[n,n],[-n+.067,n],[-n+.067,.33]])}
 },
 clock(c,_random,t){
  ellipse(c,0,0,.86,.86);ellipse(c,0,0,.72,.72);rays(c,12,.73,.83);
  line(c,[[.51*Math.sin(t),-.51*Math.cos(t)],[0,0],[-.14,-.44]]);circle(c,0,0,.055);
 },
 ember(c,r){
  for(let i=0;i<11;i++){const x=(i-5)*.12;curve(c,[x,.81],[x-.38,-.07,x+.31,-.32],[x*.48,-.5-r()*.45])}
 },
 leaf(c){
  curve(c,[-.71,.62],[-.8,-.34,.18,-.93],[.74,-.73]);curve(c,[-.71,.62],[.21,.66,.8,-.06],[.74,-.73]);
  line(c,[[-.83,.84],[.58,-.61]]);
  for(let i=0;i<5;i++){const x=-.57+i*.2,y=.63-i*.2;line(c,[[x-.18,y-.32],[x,y],[x+.32,y+.13]])}
 }
};
const cameras={
 push:["0%","-1.6%",1.13,-1.5],
 drift:["3.7%","1.2%",1.055,1.3],
 orbit:["-2.6%","-2.3%",1.1,-4],
 sway:["-2.7%","1.9%",1.065,4],
 pulse:["0%","0%",1.14,0]
};
function find(track,profile){
 if(profile!=="Ste"||!track?.id)return null;
 const scenes=window.MusicBoxImmersiveScenes;
 if(!scenes||!Object.hasOwn(scenes,track.id))return null;
 const [file,title,artist,subject,palette,camera,alternateTitle]=scenes[track.id];
 if(track.file!==file||track.artist!==artist)return null;
 if(track.title!==title&&(!alternateTitle||track.title!==alternateTitle))return null;
 return {id:track.id,subject,palette,camera,seed:hash(track.id)};
}
// Concrete imagery in Italian and English. Timed cues use only the active
// lyric line supplied by the player; untimed lyrics establish the backdrop.
const lyricImages=[
 ["lighthouse",/\b(faro spento|fari spenti|lighthouses?)\b/i],
 ["monitor",/\b(monitor|computer screen)\b/i],
 ["radio",/\b(flippin.? through stations|radiofonic[oa]|stazioni radio)\b/i],
 ["bridge",/\b(su di un ponte|dal ponte|sul ponte|cross the bridge)\b/i],
 ["snow",/\b(come neve|neve che cade|falling snow)\b/i],
 ["wax",/\b(maschera di cera|wax mask)\b/i],
 ["letter",/\b(preferito scriverlo|ho preferito scrivere|scrivo una lettera)\b/i],
 ["bills",/\b(banconote colorate|money rain)\b/i],
 ["astronaut",/\b(astronaut[ai]|astronauts?)\b/i],
 ["mars",/\b(su marte|sopra marte|land on mars)\b/i],
 ["stadium",/\b(derby di coppa|derby della capitale)\b/i],
 ["skyline",/\b(chicago|windy city)\b/i],
 ["mushrooms",/\b(funghi in salsa rosa)\b/i],
 ["record",/\b(disco in vinile|il mio disco|vinyl record)\b/i],
 ["coffee",/\b(caffe del mattino)\b/i],
 ["shell",/\b(conchigli[ae]|seashells?)\b/i],
 ["headlights",/\b(fari|automobil[ei]|suv|headlights?)\b/i],
 ["piano",/\b(pianoforte|piano keys|tasti del piano)\b/i],
 ["candle",/\b(candela|candele|candlelights?|candles?)\b/i],
 ["apple",/\b(morso la mela|mele proibite|forbidden apple)\b/i],
 ["chess",/\b(scacchi|scacchiera|bobby fischer|chess)\b/i],
 ["maze",/\b(dedalo|labirint[oi]|maze|labyrinth)\b/i],
 ["moon",/\b(luna|moon|lunar)\b/i],
 ["orbit",/\b(universo|pianeti?|cosmo|galass[ie][ae]?|spazio siderale|galax(?:y|ies)|planets?|astronauta)\b/i],
 ["stars",/\b(stell[ae]|stelle cadenti|stars?|costellazion[ei]|constellations?)\b/i],
 ["sun",/\b(sole|alba|tramont[oi]|sorgere del sole|sun(?:rise|set)?|daybreak)\b/i],
 ["rain",/\b(piogg[ie][ae]?|piove|piovere|piovesse|temporale|tempesta|rain|storm|bufera)\b/i],
 ["sail",/\b(su navi|vela spiegata|navigare nel buio)\b/i],
 ["water",/\b(mare|mari|onde|oceano|porto|naufrag[io]+|ocean|waves?|harbou?r|sail(?:or|ing)?)\b/i],
 ["rail",/\b(treno|treni|binari|rotaie|railway|trains?)\b/i],
 ["city",/\b(citta|quartier[ei]|grattaciel[oi]|strad[ae]|vicoli|neon|semafor[oi]|city|streets?|skyscrapers?)\b/i],
 ["window",/\b(finestr[ae]|finestrin[oi]|vetri|windows?)\b/i],
 ["mirror",/\b(specchi[oi]|rifless[oi]|mirrors?|reflection)\b/i],
 ["rose",/\b(rose|rosa rossa|petal[oi]|fior[ei]|flowers?|petals?)\b/i],
 ["branch",/\b(filo d.erba|foglie|ram[oi]|alber[oi]|bosco|foresta|woods|forest|leaves)\b/i],
 ["peak",/\b(montagn[ae]|vetta|mountains?|valleys?|vall[ei]|tibet)\b/i],
 ["ember",/\b(fiamme|fuoco|incendio|camino|brucia|bruciano|fire|flames?)\b/i],
 ["wings",/\b(ali|angelo|angeli|volo|volare|angel[s]?|wings?|fly away)\b/i],
 ["lens",/\b(fotografi[ae]|foto|cinepresa|obiettivo fotografico|scatto|flash|photos?|cameras?)\b/i],
 ["clock",/\b(orologi[oi]|clessidr[ae]|lancett[ae]|or[ae] passano|clocks?|hourglass)\b/i],
 ["fold",/\b(letter[ae]|cartolin[ae]|bust[ae] di carta|envelopes?|letters?)\b/i],
 ["crown",/\b(coron[ae]|trono|castell[oi]|regno|impero|kingdom|crowns?|throne)\b/i],
 ["notes",/\b(melodi[ae]|spartit[oi]|musica|strument[oi]|canzon[ei]|chorus|music|melody|songs?)\b/i],
 ["heart",/\b(cuor[ei]|amore|baci[oi]|abbracci[oi]|hearts?|love|kiss|besos?|abrazarte)\b/i]
];
const authoredLyrics={
 "b-track-29":"water", // porto di Taranto e immagini del ritornello
 "b-track-30":"maze",
 "b-track-34":"candle", // ultima cena, candela e mela
 "b-track-37":"city",
 "b-track-38":"chess",
 "b-track-40":"piano",
 "b-track-41":"stars",
 "b-track-134":"city",
 "b-track-138":"wings",
 "b-track-161":"sun",
 "b-track-205":"rail",
 "b-track-208":"branch",
 "b-track-488":"city",
 "b-track-518":"water",
 "b-track-1187":"headlights", // Stratos: automobile in corsa
 "b-youtube-S8oUoa0pwpo":"shell", // Sentire La Musica: mare e conchiglia
 "b-track-6":["petalMaze","garnet"], // il dedalo e il petalo nella voce di Sintetico, verificata sul mix
 "b-track-11":["home","gold"], // rientro e famiglia
 "b-track-20":["circus","garnet"], // il circo evocato nella strofa del Ferro, verificata sul mix
 "b-track-23":["astronaut","ice"], // la Terra vista da fuori
 "b-track-35":["halves","rose"], // due metà
 "b-track-68":["mars","violet"], // Marte e porpora
 "b-track-78":["desert","clay"], // deserto, sabbia e vento
 "b-track-88":["bills","violet"], // banconote colorate
 "b-track-89":["halves","clay"], // uno nell’altro
 "b-track-95":["trophy","gold"], // pallone e trofeo
 "b-track-114":["water","ice"], // alta marea
 "b-track-118":["radio","teal"], // telefonate e stazioni
 "b-track-124":["mars","ember"], // atterraggio su Marte
 "b-track-125":["branch","teal"], // giungla e strada smarrita
 "b-track-126":["phone","violet"], // voce di Siri
 "b-track-140":["water","lagoon"], // il mare evocato nel ritornello
 "b-track-170":["letter","peach"], // scrivere ciò che non si riesce a dire
 "b-track-191":["eye","scarlet"], // occhi rossi e abisso
 "b-track-198":["mirror","ice"], // sguardo nello specchio e vetro
 "b-track-200":["lighthouse","slate"], // faro spento
 "b-track-212":["signal","violet"], // ciocche viola e colori
 "b-track-213":["monitor","acid"], // monitor
 "b-track-215":["razor","steel"], // rasoio di Occam
 "b-track-232":["tightrope","gold"], // equilibrio e filo sottile
 "b-track-233":["bridge","lagoon"], // ponte sull’acqua scura
 "b-track-234":["rewind","ice"], // mondo che torna indietro
 "b-track-236":["snow","ice"], // neve che scende
 "b-track-243":["headlights","clay"], // incontro fugace in auto
 "b-track-245":["wax","acid"], // maschera di cera
 "b-track-390":["club","fuchsia"], // luci soffuse del locale e fine serata nella registrazione di Thyna
 "b-track-457":["mushrooms","rose"], // funghi nella salsa rosa
 "b-track-514":["halves","peach"], // due persone che vogliono rimanere insieme
 "b-track-515":["bubbles","gold"], // bollicine nell’aria
 "b-track-520":["gate","steel"], // portoni chiusi
 "b-track-574":["headlights","rose"], // occhi come fari
 "b-track-627":["road","garnet"], // cabriolet sulla tangenziale
 "b-track-658":["rewind","plum"], // mondo che cade e prospettiva cosmica
 "b-track-664":["sail","slate"], // navigare nel buio
 "b-track-670":["sail","lagoon"], // navi e mari
 "b-track-705":["skyline","jade"], // ritorno a Chicago
 "b-track-724":["coffee","peach"], // caffè al risveglio
 "b-track-855":["stadium","garnet"], // incontro come derby
 "b-track-954":["road","gold"], // strada ancora da fare
 "b-track-963":["tear","violet"], // occhi lucidi
 "b-track-977":["record","acid"], // disco e rime
 "b-track-1197":["breath","rose"], // respiro che manca e luce nel ritrovarsi
};
function describeLyrics(scene,rows,timed){
 if(!scene||scene.id==="b-track-27")return;
 const scores=Object.create(null);
 const cues=rows.map(row=>{
  const line=String(row.text??"").normalize("NFD").replace(/\p{M}/gu,"");
  const images=lyricImages.filter(([,pattern])=>pattern.test(line));
  for(const [motif] of images)scores[motif]=(scores[motif]||0)+1;
  return timed&&row.estimated!==true?images[0]?.[0]??null:null;
 });
 const strongest=lyricImages.reduce((best,[motif])=>{
  const weight=motif==="heart"||motif==="notes" ? .3 : 1;
  const score=(scores[motif]||0)*weight;
  return score>best.score?{motif,score}:best;
 },{motif:null,score:0}).motif;
 const authored=authoredLyrics[scene.id];
 const [reviewedSubject,reviewedPalette]=Array.isArray(authored)?authored:[authored];
 const subject=reviewedSubject??strongest??scene.subject;
 const palette=reviewedPalette??scene.palette;
 const changed=scene.lyricSubject!==subject||scene.lyricPalette!==palette;
 scene.lyricSubject=subject;
 scene.lyricPalette=palette;
 scene.lyricCues=cues;
 scene.lyricCue=null;
 if(changed&&active?.scene===scene)draw(active);
}
function setVerse(scene,index){
 if(scene?.lyricCues)scene.lyricCue=scene.lyricCues[index]??null;
}
function loadTextures(){
 if(textures.image)return;
 const image=new Image();
 textures.image=image;
 image.onload=()=>{
  textures.ready=true;
  if(active)draw(active);
 };
 image.src=textureUrl;
}

function drawEnvironment(c,kind,w,h,grade){
 if(!textures.ready)return;
 const {image}=textures;
 const tile=image.naturalWidth/3,aspect=w/h;
 // Center crop a tile. The inset avoids filtering pixels from its neighbours.
 const usable=tile-8,sw=usable*Math.min(aspect,1),sh=usable/Math.max(aspect,1);
 const sx=kind%3*tile+(tile-sw)*(kind===0 ? .25 : .5);
 const sy=Math.floor(kind/3)*tile+(tile-sh)*(kind===0 ? .38 : .5);
 c.globalAlpha=.94;
 c.drawImage(image,sx,sy,sw,sh,0,0,w,h);
 c.globalAlpha=.18;c.fillStyle=grade;c.fillRect(0,0,w,h);
 c.globalAlpha=1;
 return {sx,sy,sw,sh,tile};
}

function draw(shot){
 const {stage,scene}=shot;
 const [world,ink]=stage.querySelectorAll("canvas");
 const bounds=stage.getBoundingClientRect(),aspect=bounds.width/bounds.height;
 if(!world||!ink||!Number.isFinite(aspect)||aspect<=0)return false;
 const w=Math.max(1,Math.round(Math.min(640,440*aspect)));
 const h=Math.max(1,Math.round(w/aspect));
 world.width=ink.width=w;
 world.height=ink.height=h;
 const c=world.getContext("2d"),f=ink.getContext("2d");
 if(!c||!f)return false;
 const [dark,mid,color,light]=palettes[scene.lyricPalette??scene.palette],r=random(scene.seed);
 const subject=scene.lyricSubject??scene.subject;
 const wide=aspect>1.15,kind=environments[subject]??8;
 const x=w*((wide ? .30 : .50)+(r()-.5)*(wide ? .07 : .11));
 const y=h*((wide ? .45 : .36)+(r()-.5)*.07);
 const size=Math.min(w*.33,h*(wide ? .39 : .20));
 const glow=c.createRadialGradient(x,y,size*.1,x,y,Math.max(w*.7,h*.59));
 glow.addColorStop(0,mid);glow.addColorStop(1,dark);
 c.fillStyle=glow;c.fillRect(0,0,w,h);
 const crop=drawEnvironment(c,kind,w,h,dark);
 const veil=c.createLinearGradient(0,0,wide?w:0,wide?0:h);
 veil.addColorStop(0,"#0001");veil.addColorStop(.48,"#0002");veil.addColorStop(1,"#030309ed");
 c.fillStyle=veil;c.fillRect(0,0,w,h);
 c.fillStyle=light;
 for(let i=0;i<250;i++){
  c.globalAlpha=.03+r()*.095;
  c.fillRect(r()*w,r()*h,1,1);
 }
 c.globalAlpha=1;
 const particles=Array.from({length:22},()=>[r(),r(),r(),r()]);
 const wash=f.createLinearGradient(0,0,w*.28,0);
 wash.addColorStop(0,"transparent");wash.addColorStop(.55,color);wash.addColorStop(1,"transparent");
 Object.assign(shot,{f,w,h,x,y,size,kind,color,light,particles,wash,crop,subject,tilt:(r()-.5)*.22});
 paint(shot,0);
 return true;
}

function atmosphere(shot,t){
 const {f,w,h,x,y,kind,particles,wash,crop,color,light}=shot;
 // Slow light washes and faster foreground details have different depth and speed.
 const sweep=.5+.5*Math.sin(t),dx=Math.cos(t);
 f.save();
 f.translate(w*(.11+.43*sweep),0);
 f.fillStyle=wash;
 f.globalAlpha=.12+.04*sweep;
 f.fillRect(0,0,w*.28,h);
 f.restore();
 if(kind===0){
  const lampX=crop ? (.428*crop.tile-crop.sx)*w/crop.sw : x;
  const lampY=crop ? (.500*crop.tile-crop.sy)*h/crop.sh : y;
  f.fillStyle=light;
  f.globalAlpha=.065+.047*(.5+.5*Math.sin(3*t));
  line(f,[[lampX,lampY],[w,h*(.04+.22*sweep)],[w,h*(.49+.14*sweep)],[lampX,lampY+6]],true);
  f.fillStyle="#70162b";f.globalAlpha=.28;
  const edge=w*(.12+.12*sweep);
  line(f,[[0,0],[edge,0],[edge*.45,h*.55],[edge*.62,h],[0,h]],true);
 }
 f.fillStyle=light;f.strokeStyle=light;
 const wet=kind===2||kind===3;
 for(const [a,b,d,opacity] of particles){
  const alpha=.5+.5*Math.sin(t+opacity*tau);
  f.globalAlpha=(.07+d*.15)*alpha;
  if(wet){
   const px=w*(a+.023*dx),py=h*((b+t/tau)%1);
   f.lineWidth=1+d;
   line(f,[[px,py],[px-2-d*4,py+5+d*14]]);
  }else if(kind===5&&d>.58){
   // Petals tumble across the garden at different depths.
   const px=w*(a+.13*Math.sin(t+a*tau)),py=h*((b+t/tau)%1);
   f.fillStyle=color;
   f.globalAlpha=.46*alpha;
   f.beginPath();f.ellipse(px,py,3+d*6,1+d*3,t+a*tau,0,tau);f.fill();
   f.fillStyle=light;
  }else if(kind===1&&d>.63){
   // Reflections cross the wet street below the horizon.
   const px=w*((a+t/tau)%1),py=h*(.58+b*.38);
   f.globalAlpha=.49*alpha;f.lineWidth=.9+d*1.7;
   line(f,[[px,py],[px+8+d*26,py]]);
  }else{
   const px=w*(a+.07*Math.cos(t+a*tau)),py=h*(b+.09*Math.sin(t+b*tau));
   circle(f,px,py,.55+d*2.1);
  }
 }
}

const projectorReels=[
 [.372,.282,.090,.132],
 [.177,.535,.105,.154]
];
function turnReels(shot,t){
 const {f,w,h,crop}=shot;
 const {tile,sx,sy,sw,sh}=crop;
 for(const [cx,cy,rx,ry] of projectorReels){
  const x=(cx*tile-sx)*w/sw,y=(cy*tile-sy)*h/sh;
  f.save();
  f.translate(x,y);
  f.scale(rx*tile*w/sw,ry*tile*h/sh);
  f.beginPath();f.arc(0,0,.96,0,tau);f.clip();
  f.rotate(t*2);
  f.globalAlpha=.84;
  f.drawImage(textures.image,(cx-rx)*tile,(cy-ry)*tile,rx*tile*2,ry*tile*2,-1,-1,2,2);
  f.restore();
 }
}
function paint(shot,t){
 const {f,w,h,x,y,size,kind,crop,scene,color,light,tilt,subject}=shot;
 f.clearRect(0,0,w,h);
 if(kind===0&&crop){
  turnReels(shot,t);
  atmosphere(shot,t);
  f.globalAlpha=1;
  return;
 }
 atmosphere(shot,t);
 const lateral=scene.camera==="drift"||scene.camera==="orbit"? .25 : .10;
 const depth=(textures.ready ? .71 : 1)+(scene.camera==="push" ? .18 : .12)*Math.sin(t);
 f.save();
 f.translate(x+size*lateral*Math.sin(t),y+size*.12*Math.cos(t));
 f.scale(size*depth,size*depth);
 f.rotate(tilt+.11*Math.sin(t));
 f.strokeStyle=light;f.fillStyle=color;
 f.globalAlpha=(textures.ready ? .30 : .66)+.10*Math.cos(t);
 f.lineWidth=.014;f.lineJoin="round";f.lineCap="round";
 subjects[scene.lyricCue??subject](f,random(scene.seed),t);
 f.restore();
 f.globalAlpha=1;
}
function tick(now){
 if(!active)return;
 const elapsed=now-lastFrame;
 if(elapsed>=motionStep){
  lastFrame=now-elapsed%motionStep;
  paint(active,((now-active.started)%active.period)/active.period*tau);
 }
 frame=requestAnimationFrame(tick);
}
function start(stage,scene){
 if(!stage||!scene||!subjects[scene.subject]||!palettes[scene.palette]||!cameras[scene.camera])return false;
 const [x,y,scale,angle]=cameras[scene.camera];
 const period=6400+scene.seed%1600;
 stage.style.setProperty("--im-shot-x",x);
 stage.style.setProperty("--im-shot-y",y);
 stage.style.setProperty("--im-shot-scale",scale);
 stage.style.setProperty("--im-shot-angle",angle+"deg");
 stage.style.setProperty("--im-shot-time",period+"ms");
 stage.dataset.environment=scene.subject;
 stage.hidden=false;
 const shot={stage,scene,period,started:performance.now()};
 if(!draw(shot)){stage.hidden=true;return false}
 active=shot;
 lastFrame=0;
 cancelAnimationFrame(frame);
 frame=requestAnimationFrame(tick);
 loadTextures();
 return true;
}
function stop(stage){
 if(!stage||stage.hidden)return;
 stage.hidden=true;
 if(active?.stage===stage){
  active=null;
  cancelAnimationFrame(frame);
  frame=0;
 }
 for(const canvas of stage.querySelectorAll("canvas"))canvas.width=canvas.height=0;
}
window.addEventListener("resize",()=>{if(active)draw(active)},{passive:true});
window.MusicBoxImmersiveAnimation={find,start,stop,describeLyrics,setVerse};
})();
