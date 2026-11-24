/* Original, silent Music Box animations. Draw two still planes once and let
   the compositor move them. The music player remains the only audio clock. */
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
let active=null;
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
 film(c){
  c.rotate(-.15);
  c.strokeRect(-.8,-.84,1.6,1.68);
  for(const sign of [-1,1])for(let i=0;i<8;i++)c.strokeRect(sign*.72-.042,-.75+i*.2,.084,.1);
  ellipse(c,0,0,.56,.56);ellipse(c,0,0,.46,.46);
  const mark=c.fillStyle;
  for(let i=0;i<5;i++){const a=i*tau/5;circle(c,.3*Math.cos(a),.3*Math.sin(a),.105)}
  c.fillStyle=mark;circle(c,0,0,.055);
  line(c,[[-.58,-.68],[.58,-.68]]);line(c,[[-.58,.68],[.58,.68]]);
 },
 gate(c){
  for(let i=0;i<5;i++){
   const s=1-i*.135;
   c.beginPath();c.moveTo(-s,.9*s);c.lineTo(-s,-.22*s);
   c.bezierCurveTo(-s,-1.17*s,s,-1.17*s,s,-.22*s);c.lineTo(s,.9*s);c.stroke();
  }
  line(c,[[-.35,.91],[0,-.36],[.35,.91]]);
 },
 branch(c,r){
  curve(c,[0,1],[-.35,.3,.27,-.42],[0,-.96]);
  for(let i=0;i<8;i++){
   const y=.66-i*.21,x=(i%2?-1:1)*(.47+r()*.37)*(1-i*.045);
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
 rose(c){
  for(let i=0;i<12;i++){
   const a=i*2.399963,s=.16+i*.044;
   ellipse(c,Math.cos(a)*s*.52,Math.sin(a)*s*.52,s,s*.57,a);
  }
  curve(c,[.24,.53],[.17,.82,-.53,.57],[-.52,1]);
  ellipse(c,-.3,.67,.25,.071,-.45);
 },
 wings(c){
  for(const sign of [-1,1])for(let i=0;i<8;i++){
   const n=i*.09;
   curve(c,[0,.57],[sign*(.38+n),.35-n,sign*(1.11-n*.21),-.11-n],[sign*(.95-n*.93),-.86+n*.76]);
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
 orbit(c){
  circle(c,0,0,.245);
  for(let i=0;i<6;i++)ellipse(c,0,0,.69+i*.045,.29+i*.021,i*.57);
  circle(c,.76,-.27,.076);circle(c,-.62,.46,.044);
 },
 notes(c){
  for(let i=0;i<5;i++)line(c,[[-.89,(i-2)*.18],[.89,(i-2)*.18]]);
  for(let i=0;i<4;i++){
   const x=-.62+i*.39,y=.33-i*.18+(i%2)*.17;
   ellipse(c,x,y,.116,.072,-.3);line(c,[[x+.109,y],[x+.109,y-.54],[x+.25,y-.43]]);
  }
 },
 heart(c){
  for(let i=0;i<5;i++){
   const b=1-i*.12;
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
 city(c,r){
  for(let i=0;i<9;i++){
   const y=.64-r()*1.37,x=-.92+i*.21;
   c.strokeRect(x,y,.16,.81-y);
   for(let sy=y+.13;sy<.72;sy+=.13)line(c,[[x+.046,sy],[x+.11,sy]]);
  }
  line(c,[[-1,.81],[1,.81]]);
 },
 rail(c){
  line(c,[[-.72,.84],[-.1,-.62]]);line(c,[[.72,.84],[.1,-.62]]);
  for(let i=0;i<10;i++){
   const e=(i/9)**1.6,y=-.61+1.42*e,x=.12+.56*e;
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
 water(c){curveGrid(c,8,.71)},
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
 storm(c,r){
  curveGrid(c,7,.88);
  for(let i=0;i<6;i++){const x=-1+r()*2,y=-.78+r()*1.4;line(c,[[x,y],[x+.13,y-.27]])}
 },
 rain(c,r){
  for(let i=0;i<52;i++){
   const x=-1+r()*2,y=-.92+r()*1.87,l=.05+r()*.14;
   line(c,[[x,y],[x-l*.45,y+l]]);
  }
  ellipse(c,0,.65,.72,.16);ellipse(c,0,.65,.46,.095);
 },
 lens(c){for(let i=0;i<12;i++)ellipse(c,0,0,.22+i*.055,.21+i*.06,i*.14);rays(c,8,.64,.86)},
 maze(c){
  for(let i=0;i<8;i++){const n=.92-i*.104;line(c,[[-n,.17],[-n,-n],[n,-n],[n,n],[-n+.067,n],[-n+.067,.33]])}
 },
 clock(c){
  ellipse(c,0,0,.86,.86);ellipse(c,0,0,.72,.72);rays(c,12,.73,.83);
  line(c,[[.37,-.33],[0,0],[-.14,-.44]]);circle(c,0,0,.055);
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
 const [file,title,artist,subject,palette,camera]=scenes[track.id];
 if(track.file!==file||track.title!==title||track.artist!==artist)return null;
 return {subject,palette,camera,seed:hash(track.id)};
}
function draw({stage,scene}){
 const [world,ink]=stage.querySelectorAll("canvas");
 const bounds=stage.getBoundingClientRect(),aspect=bounds.width/bounds.height;
 if(!world||!ink||!Number.isFinite(aspect)||aspect<=0)return false;
 const w=Math.max(1,Math.round(Math.min(640,440*aspect)));
 const h=Math.max(1,Math.round(w/aspect));
 world.width=ink.width=w;
 world.height=ink.height=h;
 const c=world.getContext("2d"),f=ink.getContext("2d");
 if(!c||!f)return false;
 const [dark,mid,color,light]=palettes[scene.palette],r=random(scene.seed);
 const wide=aspect>1.15;
 const x=w*((wide ? .325 : .50)+(r()-.5)*(wide ? .06 : .12));
 const y=h*((wide ? .45 : .40)+(r()-.5)*.07);
 const size=Math.min(w*.34,h*(wide ? .39 : .21));
 const glow=c.createRadialGradient(x,y,size*.08,x,y,Math.max(w*.7,h*.59));
 glow.addColorStop(0,mid);glow.addColorStop(.32,mid);glow.addColorStop(1,dark);
 c.fillStyle=glow;c.fillRect(0,0,w,h);
 c.globalAlpha=.10;c.lineWidth=1;c.strokeStyle=color;
 c.save();c.translate(x,y);c.scale(size,size);c.lineWidth=.008;
 c.rotate((r()-.5)*.29);
 if(scene.subject==="film"){
  c.fillStyle=light;c.globalAlpha=.12;
  line(c,[[.16,-.29],[2.8,-1.6],[2.8,.86],[.16,.26]],true);
  for(let i=0;i<6;i++)line(c,[[.45,.55],[2.8,.32+i*.21]]);
  c.strokeRect(-1.28,-1.29,2.56,2.58);
 }else if(["city","window","stairs","rail","gate","peak"].includes(scene.subject)){
  for(let i=-10;i<=10;i++)line(c,[[i*.11,.21],[i*.68,2.5]]);
  for(let i=0;i<14;i++){
   const y=.29+i*i*.017;
   line(c,[[-2.7,y],[2.7,y]]);
  }
 }else if(["water","rain","storm","ribbon","ink","ember"].includes(scene.subject)){
  c.scale(2.5,1.6);curveGrid(c,14,1.35);
 }else{
  for(let i=0;i<14;i++){
   const ring=.8+i*.15;
   ellipse(c,0,0,ring,ring*.70,i*.03);
  }
  rays(c,28,.92,2.5,r()*.2);
 }
 c.restore();
 c.fillStyle=light;
 for(let i=0;i<400;i++){
  c.globalAlpha=.035+r()*.15;
  const px=r()*w,py=r()*h;
  c.fillRect(px,py,i%32?1:2,i%32?1:2);
 }
 c.globalAlpha=1;
 const vignette=c.createRadialGradient(x,y,size*.18,x,y,Math.max(w*.76,h*.8));
 vignette.addColorStop(0,"#0000");vignette.addColorStop(1,"#030309dd");
 c.fillStyle=vignette;c.fillRect(0,0,w,h);
 f.translate(x,y);f.scale(size,size);
 f.rotate((r()-.5)*.16);
 const metallic=f.createLinearGradient(-.95,-.9,.95,.9);
 metallic.addColorStop(0,color);metallic.addColorStop(.45,light);metallic.addColorStop(1,color);
 f.strokeStyle=metallic;f.fillStyle=metallic;f.globalAlpha=.72;f.lineWidth=.0115;
 f.lineJoin="round";f.lineCap="round";
 subjects[scene.subject](f,r);
 f.strokeStyle=color;f.globalAlpha=.28;f.lineWidth=.006;
 ellipse(f,0,0,1.12,1.12);
 f.globalAlpha=.53;rays(f,32,1.12,1.175);
 return true;
}
function start(stage,scene){
 if(!stage||!scene||!subjects[scene.subject]||!palettes[scene.palette]||!cameras[scene.camera])return false;
 const [x,y,scale,angle]=cameras[scene.camera];
 stage.style.setProperty("--im-shot-x",x);
 stage.style.setProperty("--im-shot-y",y);
 stage.style.setProperty("--im-shot-scale",scale);
 stage.style.setProperty("--im-shot-angle",angle+"deg");
 stage.style.setProperty("--im-shot-time",((6400+scene.seed%1600)/1000)+"s");
 stage.hidden=false;
 const shot={stage,scene};
 if(!draw(shot)){stage.hidden=true;return false}
 active=shot;
 return true;
}
function stop(stage){
 if(!stage||stage.hidden)return;
 stage.hidden=true;
 active=null;
 for(const canvas of stage.querySelectorAll("canvas"))canvas.width=canvas.height=0;
}
window.addEventListener("resize",()=>{if(active)draw(active)},{passive:true});
window.MusicBoxImmersiveAnimation={find,start,stop};
})();
