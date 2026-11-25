/* Silent Music Box scenes. Cache the environment and animate its lighting
   while the immersive stage is visible. */
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
// The scene catalog selects an environment, palette and camera for each recording.
Object.assign(environments,{
 astronaut:7,mars:7,skyline:1,road:1,stadium:1,
 lighthouse:3,bridge:3,sail:3,snow:6,tightrope:6,desert:6,
 home:2,letter:2,coffee:2,record:2,radio:2,monitor:8,bills:8,trophy:8,
 halves:5,bubbles:5,mushrooms:5,petalMaze:4,circus:8,club:8,
 tear:2,rewind:7,razor:8,wax:4,breath:2,
 eye:8,ribbon:8,signal:8,ink:8,notes:8,lens:8
});
const assetRoot=document.currentScript?.src||document.baseURI;
const textures={file:"immersive-textures.webp?v=1",image:null,ready:false};
const kidYugiTextures={file:"immersive-kid-yugi.webp?v=3",image:null,ready:false};
const libraryTextures={file:"immersive-ste.webp?v=2",image:null,ready:false};
// Atlas tile, framing, camera direction and the practical light in the scene.
const kidYugiScenes={
 "b-track-29":[0,.43,.60,.050,.018,"#b87858"],
 "b-track-37":[1,.53,.58,.021,-.039,"#bdc1bd"],
 "b-track-38":[2,.36,.40,-.044,.021,"#ca9b5e"],
 "b-track-39":[3,.55,.51,-.023,.028,"#cd8b5a"],
 "b-track-41":[4,.44,.47,.064,-.016,"#a94238"],
 "b-track-87":[37,.53,.54,-.039,-.021,"#cb9970"],
 "b-track-138":[6,.42,.48,.047,.024,"#a34741"],
 "b-track-205":[7,.35,.46,.066,.016,"#b4b3ae"],
 "b-track-206":[8,.53,.40,-.027,-.023,"#e38644"],
 "b-track-208":[9,.49,.53,-.051,.018,"#a19b91"],
 "b-track-213":[10,.48,.54,.046,-.034,"#f1a356"],
 "b-track-1187":[11,.41,.52,-.061,.033,"#b09a7b"],
 "b-track-6":[12,.36,.52,.044,-.029,"#bb4877"],
 "b-track-30":[12,.59,.56,-.061,.026,"#91503f"],
 "b-track-33":[30,.51,.51,.043,-.021,"#a75a60"],
 "b-track-34":[14,.58,.55,-.035,.024,"#ee9e50"],
 "b-track-40":[31,.53,.57,.029,-.024,"#e0dcce"],
 "b-track-49":[34,.48,.57,.023,.011,"#c6c1bd"],
 "b-track-207":[32,.52,.52,-.047,.017,"#b8a38a"],
 "b-track-215":[33,.52,.55,-.037,.018,"#ad5143"],
 "b-youtube-S8oUoa0pwpo":[36,.53,.56,.043,.024,"#b08f68"],
 "b-track-20":[21,.59,.52,-.030,-.026,"#b98050"]
};
const libraryScenes={
 "b-track-14":[0,.52,.48,.041,-.018,"#e2ac55"],
 "b-track-23":[1,.53,.54,-.057,.025,"#7b99ee"],
 "b-track-25":[2,.44,.46,.033,.017,"#eab6a6"],
 "b-track-105":[3,.53,.51,.061,-.021,"#f08561"],
 "b-track-108":[4,.49,.56,-.051,.035,"#9a69de"],
 "b-track-116":[5,.52,.49,.023,-.047,"#b65560"],
 "b-track-133":[6,.41,.62,-.045,.026,"#d78843"],
 "b-track-136":[7,.45,.64,.051,.023,"#d28a5b"],
 "b-track-189":[8,.53,.51,.025,-.029,"#dcb381"],
 "b-track-191":[9,.49,.51,-.044,.027,"#a1b3b9"],
 "b-track-210":[10,.56,.52,.065,.019,"#ca6a85"],
 "b-track-230":[11,.48,.50,-.054,-.026,"#e59453"],
 "b-track-75":[12,.51,.44,.032,-.023,"#dc9e56"],
 "b-track-89":[13,.52,.42,-.045,.036,"#d6d5d2"],
 "b-track-120":[14,.54,.50,.058,.018,"#eeb848"],
 "b-track-121":[15,.49,.59,-.046,-.022,"#76b6d2"],
 "b-track-122":[16,.46,.52,.029,.032,"#c5924d"],
 "b-track-192":[17,.61,.53,-.048,-.036,"#709dda"],
 "b-track-200":[18,.32,.58,.060,.030,"#75ab8f"],
 "b-track-240":[19,.55,.56,-.035,.021,"#efd1aa"],
 "b-track-478":[20,.42,.53,.043,-.019,"#babac4"],
 "b-track-483":[21,.51,.50,-.057,.028,"#7ed1e4"],
 "b-track-509":[22,.43,.58,.045,-.027,"#be608e"],
 "b-track-705":[23,.43,.45,-.051,.031,"#8d6ab4"],
 "b-track-134":[24,.43,.55,.069,-.027,"#c3c5c1"],
 "b-track-488":[24,.57,.59,-.050,.033,"#ccceca"],
 "b-track-92":[25,.46,.49,.045,.027,"#5fbbb4"],
 "b-track-103":[26,.53,.51,-.043,.035,"#dae4dd"],
 "b-track-127":[27,.47,.53,.037,.020,"#8d83d8"],
 "b-track-349":[28,.54,.50,-.066,.016,"#a8c888"],
 "b-track-513":[29,.57,.55,.050,-.033,"#e98a44"],
 "b-track-7":[30,.49,.41,-.039,.021,"#7386ba"],
 "b-track-69":[31,.44,.51,.049,-.028,"#dfb66f"],
 "b-track-73":[32,.60,.56,-.063,.024,"#c2888d"]
};
// Cue positions are fractions of the loop, followed by the shot to show.
// The close view reframes the original Music Box art. Alternate scenes
// use their own atlas tile, based on a second shot in the matching reference.
const photoEdits={
 "b-track-49":[5.96,[[0,0]]],
 "b-youtube-S8oUoa0pwpo":[7.96,[[0,0],[.12,1],[.22,0],[.39,1],[.54,0],[.71,1],[.88,0]]],
 "b-track-33":[5.6,[[0,0],[.11,1],[.22,0],[.36,1],[.58,0],[.78,1],[.92,0]]],
 "b-track-40":[8,[[0,2],[.31,0],[.46,2],[.58,1],[.69,0]],15],
 "b-track-207":[5.96,[[0,1],[.16,0],[.39,1],[.61,0],[.78,1],[.89,0]]],
 "b-track-215":[7.72,[[0,2],[.10,0]],35],
 "b-track-29":[5.33,[[0,2],[.22,1],[.43,2],[.65,1],[.78,2]],26],
 "b-track-37":[6.1,[[0,1],[.19,0],[.55,1],[.71,0],[.90,1]]],
 "b-track-38":[7.5,[[0,0],[.13,1],[.53,2],[.69,1],[.80,0]],22],
 "b-track-39":[7.5,[[0,0],[.25,2],[.59,0],[.75,2]],28],
 "b-track-41":[3.2,[[0,2],[.19,0],[.73,2]],27],
 "b-track-87":[7.5,[[0,0],[.14,2],[.33,1],[.55,2],[.72,0],[.89,2]],38],
 "b-track-138":[5.1,[[0,0],[.51,1],[.79,0]]],
 "b-track-205":[7.5,[[0,0],[.15,1],[.31,2],[.59,0],[.76,2],[.91,1]],24],
 "b-track-206":[7.5,[[0,0],[.13,2],[.39,0],[.63,2],[.80,0]],29],
 "b-track-208":[6.2,[[0,1],[.33,0],[.72,1]]],
 "b-track-213":[7.5,[[0,0],[.18,1],[.37,2],[.66,0],[.82,1]],23],
 "b-track-1187":[7.5,[[0,2],[.18,0],[.35,1],[.58,2],[.74,1],[.90,0]],25],
 "b-track-14":[7.88,[[0,0],[.46,1]]],
 "b-track-23":[6,[[0,0],[.46,1],[.83,0]]],
 "b-track-25":[5,[[0,0]]],
 "b-track-75":[7.62,[[0,0]]],
 "b-track-89":[7.38,[[0,0],[.56,1],[.66,0],[.83,1]]],
 "b-track-92":[7.88,[[0,0],[.6,1],[.71,0]]],
 "b-track-103":[7.62,[[0,0]]],
 "b-track-105":[8,[[0,0],[.3,1],[.75,0],[.83,1],[.92,0]]],
 "b-track-108":[8,[[0,0],[.33,1],[.69,0]]],
 "b-track-116":[8,[[0,0],[.88,1]]],
 "b-track-120":[8,[[0,0],[.2,1],[.34,0],[.56,1],[.77,0]]],
 "b-track-121":[6,[[0,0],[.21,1],[.38,0],[.46,1],[.77,0]]],
 "b-track-122":[8,[[0,0],[.38,1],[.61,0]]],
 "b-track-127":[8,[[0,0],[.17,1],[.55,0],[.73,1],[.91,0]]],
 "b-track-133":[5.88,[[0,0],[.38,1],[.47,0],[.57,1],[.81,0]]],
 "b-track-134":[7.62,[[0,0],[.2,1],[.46,0],[.59,1],[.89,0]]],
 "b-track-136":[7.25,[[0,0],[.26,1],[.67,0],[.91,1]]],
 "b-track-189":[5,[[0,0]]],
 "b-track-191":[5,[[0,0]]],
 "b-track-192":[6,[[0,0],[.52,1]]],
 "b-track-200":[4.62,[[0,0],[.43,1]]],
 "b-track-210":[3.25,[[0,0],[.46,1]]],
 "b-track-230":[7.75,[[0,0],[.1,1],[.45,0],[.58,1],[.65,0]]],
 "b-track-240":[7.62,[[0,0],[.18,1],[.7,0]]],
 "b-track-349":[8,[[0,0]]],
 "b-track-478":[8,[[0,0]]],
 "b-track-483":[6,[[0,0],[.12,1],[.23,0],[.54,1],[.85,0]]],
 "b-track-488":[7.62,[[0,0],[.2,1],[.46,0],[.59,1],[.89,0]]],
 "b-track-509":[7,[[0,0]]],
 "b-track-513":[7.75,[[0,0],[.11,1]]],
 "b-track-705":[7,[[0,0],[.2,1],[.27,0],[.45,1],[.7,0]]]
};
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
function drawFilmStrip(c,t){
 c.rotate(-.15);
 c.strokeRect(-.8,-.84,1.6,1.68);
 for(const sign of [-1,1])for(let i=0;i<8;i++)c.strokeRect(sign*.72-.042,-.79+(i*.2+t/tau*.4+.2)%1.6,.084,.1);
 ellipse(c,0,0,.56,.56);ellipse(c,0,0,.46,.46);
 const mark=c.fillStyle;
 for(let i=0;i<5;i++){const a=i*tau/5+2*t;circle(c,.3*Math.cos(a),.3*Math.sin(a),.105)}
 c.fillStyle=mark;circle(c,0,0,.055);
 line(c,[[-.58,-.68],[.58,-.68]]);line(c,[[-.58,.68],[.58,.68]]);
}
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
// Recurring imagery in the lyrics can inform the backdrop for the whole song.
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
function describeLyrics(scene,rows){
 if(!scene||scene.id==="b-track-27")return;
 const scores=Object.create(null);
 for(const row of rows){
  const line=String(row.text??"").normalize("NFD").replace(/\p{M}/gu,"");
  for(const [motif,pattern] of lyricImages){
   if(pattern.test(line))scores[motif]=(scores[motif]||0)+1;
  }
 }
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
 if(changed&&active?.scene===scene)draw(active);
}
function loadTextures(atlas){
 if(atlas.image)return;
 const image=new Image();
 atlas.image=image;
 image.onload=()=>{
  atlas.ready=true;
  if(active&&(atlas===textures||active.photoAtlas===atlas))draw(active);
 };
 image.src=new URL(atlas.file,assetRoot);
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
 if(shot.suspendedAt!=null){
  shot.needsRedraw=true;
  return true;
 }
 const {stage,scene}=shot;
 const [world,ink]=stage.querySelectorAll("canvas");
 const bounds=stage.getBoundingClientRect(),aspect=bounds.width/bounds.height;
 if(!world||!ink||!Number.isFinite(aspect)||aspect<=0)return false;
 const photo=shot.photoAtlas.ready?shot.photoView:null;
 const w=Math.max(1,Math.round(Math.min(640,(photo ? 560 : 440)*aspect)));
 const h=Math.max(1,Math.round(w/aspect));
 world.width=ink.width=w;
 world.height=ink.height=h;
 const c=world.getContext("2d"),f=ink.getContext("2d");
 if(!c||!f)return false;
 const [dark,mid,color,light]=palettes[scene.lyricPalette??scene.palette],r=random(scene.seed);
 const subject=scene.lyricSubject??scene.subject;
 const wide=aspect>1.15,kind=environments[subject]??8;
 if(photo&&preparePhotograph(shot,world,c,f,w,h,wide,dark,photo)){
  stage.setAttribute("data-photographed-scene","");
  paint(shot,0);
  return true;
 }
 stage.removeAttribute("data-photographed-scene");
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
 Object.assign(shot,{world,f,w,h,x,y,size,kind,color,light,particles,wash,crop,photo:null,photoFrame:null,tilt:(r()-.5)*.22});
 paint(shot,0);
 return true;
}

function preparePhotograph(shot,world,c,f,w,h,wide,dark,photo){
 const {image}=shot.photoAtlas;
 const tile=image.naturalWidth/3;
 const light=photo[5];
 const index=photo[0],sx=index%3*tile+3,sy=Math.floor(index/3)*tile+3,span=tile-6;
 const side=Math.max(1,Math.round(Math.min(w*(wide ? .73 : 1.06),h*(wide ? 1.04 : .84))));
 const left=wide ? -.018*side : (w-side)*.5;
 const top=wide ? -.018*side : Math.max(-.026*side,h*.32-side*.5);
 const ambient=document.createElement("canvas");
 ambient.width=ambient.height=12;
 const ambientContext=ambient.getContext("2d");
 if(!ambientContext)return false;

 // The same photograph gives the background its colors outside the full frame.
 ambientContext.drawImage(image,sx,sy,span,span,0,0,12,12);
 c.drawImage(ambient,0,0,w,h);
 c.globalAlpha=wide ? .57 : .72;c.fillStyle=dark;c.fillRect(0,0,w,h);c.globalAlpha=1;

 const alternate=shot.edit?.[2];
 const frames=alternate==null?[index]:[index,alternate];
 const images=frames.map(tileIndex=>photoPlane(image,tile,tileIndex,side,w,wide));
 if(!images[0])return false;
 const detail=shot.edit?null:prepareSceneDetail(images[0],photo);
 const centerX=left+side*.5,centerY=top+side*.5;
 const localLight=f.createRadialGradient(centerX,centerY,0,centerX,centerY,side*.59);
 localLight.addColorStop(0,light);localLight.addColorStop(1,"transparent");
 Object.assign(shot,{world,f,w,h,photo,photoFrame:{images,side,left,top,detail,localLight}});
 return true;
}

function photoPlane(image,tile,index,side,w,wide){
 const canvas=document.createElement("canvas");
 canvas.width=canvas.height=side;
 const imageContext=canvas.getContext("2d");
 if(!imageContext)return null;
 const sx=index%3*tile+3,sy=Math.floor(index/3)*tile+3,span=tile-6;
 imageContext.drawImage(image,sx,sy,span,span,0,0,side,side);
 imageContext.globalCompositeOperation="destination-in";
 // Blend inward from the screen, leaving the desktop top and left edges
 // full like Il Filmografo. The opposite edges fade into the lyrics area.
 if(wide||side<w){
  const across=imageContext.createLinearGradient(0,0,side,0);
  across.addColorStop(0,wide ? "#000" : "transparent");
  across.addColorStop(wide ? .64 : .14,"#000");
  if(!wide)across.addColorStop(.86,"#000");
  across.addColorStop(1,"transparent");
  imageContext.fillStyle=across;
  imageContext.fillRect(0,0,side,side);
 }
 const down=imageContext.createLinearGradient(0,0,0,side);
 down.addColorStop(0,wide ? "#000" : "transparent");
 down.addColorStop(wide ? .74 : .16,"#000");
 if(!wide)down.addColorStop(.72,"#000");
 down.addColorStop(1,"transparent");
 imageContext.fillStyle=down;
 imageContext.fillRect(0,0,side,side);

 return canvas;
}

function prepareSceneDetail(world,photo){
 const {width:w,height:h}=world;
 const image=document.createElement("canvas");
 image.width=Math.max(1,Math.round(w*.74));
 image.height=Math.max(1,Math.round(h*.74));
 const left=Math.round((w-image.width)*photo[1]);
 const top=Math.round((h-image.height)*photo[2]);
 const c=image.getContext("2d");
 if(!c)return null;
 c.drawImage(world,-left,-top);
 c.globalCompositeOperation="destination-in";
 c.setTransform(image.width/2,0,0,image.height/2,image.width/2,image.height/2);
 const feather=c.createRadialGradient(0,0,.35,0,0,1);
 feather.addColorStop(0,"#000");
 feather.addColorStop(1,"transparent");
 c.fillStyle=feather;
 c.fillRect(-1,-1,2,2);
 return {image,left,top};
}
function paintScenery(shot,t){
 const {world,f,w,h,kind,scene}=shot;
 const arc=Math.sin(t),depth=(1-Math.cos(t))*.5;
 const push=scene.camera==="push"||scene.camera==="pulse";
 const scale=1.09+(push ? .13 : .068)*depth;
 const width=w*scale,height=h*scale;
 const driftX=push ? .016 : .027,driftY=.016;
 const left=(w-width)*.5+w*arc*driftX;
 const top=(h-height)*.47+h*Math.sin(t+.65)*driftY;
 f.drawImage(world,left,top,width,height);
 if(kind===1||kind===3){
  // Moving reflections are drawn from the scenery itself.
  const band=h*.10;
  for(let row=0;row<3;row++){
   const y=h*.68+row*band;
   const shimmer=Math.sin(t*2+row*.86+scene.seed%7)*w*(.004+row*.003);
   f.drawImage(world,0,y,w,band,left+shimmer,top+y*scale,width,band*scale);
  }
 }
}
function paintPhotograph(shot,t){
 const {world,f,w,h,photo,photoFrame}=shot;
 const {images,side,left,top,detail,localLight}=photoFrame;
 const position=t/tau;
 const cues=shot.edit?.[1];
 const cue=cues?.findLast(([start])=>position>=start);
 const mode=cue?.[1]??0;
 const canvas=images[mode===2?1:0]??images[0];
 const camera=position-(cue?.[0]??0);
 const scale=(mode===1?1.073:1.003)+.026*(1-Math.cos(camera*tau))*.5;
 const length=side*scale;
 const dx=Math.sin(t)*photo[3]*side,dy=Math.sin(t+.65)*photo[4]*side;
 const margin=(side-length)*.5;
 const x=left+margin+dx*.51+(mode===1?(.5-photo[1])*side*.14:0);
 const y=top+margin+dy*.46+(mode===1?(.5-photo[2])*side*.14:0);
 f.drawImage(world,0,0);
 f.drawImage(canvas,x,y,length,length);
 if(shot.scene.id==="b-track-49"){
  f.save();
  // Displace only the lower part of the picture to suggest wind in the cloth.
  const strip=canvas.height*.045;
  for(let index=0;index<6;index++){
   const top=canvas.height*.58+index*strip;
   const offset=Math.sin(t*2+index*.57)*length*.009;
   f.globalAlpha=.3*Math.sin((index+1)*Math.PI/7);
   f.drawImage(canvas,0,top,canvas.width,strip,x+offset,y+top*scale,length,strip*scale);
  }
  f.restore();
 }
 if(detail&&mode===0&&!cues){
  const {image,left,top}=detail;
  f.drawImage(image,x+left*scale+dx*.18,y+top*scale+dy*.18,image.width*scale,image.height*scale);
 }
 f.save();
 f.translate(dx,dy);
 f.globalCompositeOperation="soft-light";
 f.fillStyle=localLight;
 f.globalAlpha=.22+.38*(.5+.5*Math.sin(t*2+.75));
 f.fillRect(-w*.25,-h*.15,w*1.5,h*1.3);
 f.restore();
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
 const {f,w,h,kind,crop,scene}=shot;
 f.clearRect(0,0,w,h);
 if(scene.id==="b-track-27"){
  if(kind===0&&crop)turnReels(shot,t);
  atmosphere(shot,t);
  if(!crop)paintFilmStrip(shot,t);
 }else if(shot.photo){
  paintPhotograph(shot,t);
 }else{
  paintScenery(shot,t);
  if(kind===1||kind===3||kind===5)atmosphere(shot,t);
 }
 f.globalAlpha=1;
}
function paintFilmStrip(shot,t){
 const {f,x,y,size,scene,color,light,tilt}=shot;
 const lateral=scene.camera==="drift"||scene.camera==="orbit"? .25 : .10;
 const depth=(textures.ready ? .71 : 1)+(scene.camera==="push" ? .18 : .12)*Math.sin(t);
 f.save();
 f.translate(x+size*lateral*Math.sin(t),y+size*.12*Math.cos(t));
 f.scale(size*depth,size*depth);
 f.rotate(tilt+.11*Math.sin(t));
 f.strokeStyle=light;f.fillStyle=color;
 f.globalAlpha=(textures.ready ? .30 : .66)+.10*Math.cos(t);
 f.lineWidth=.014;f.lineJoin="round";f.lineCap="round";
 drawFilmStrip(f,t);
 f.restore();
}
function tick(now){
 if(!active||active.suspendedAt!=null)return;
 const elapsed=now-lastFrame;
 if(elapsed>=motionStep){
  lastFrame=now-elapsed%motionStep;
  paint(active,((now-active.started)%active.period)/active.period*tau);
 }
 frame=requestAnimationFrame(tick);
}
function start(stage,scene){
 if(!stage||!scene||!Object.hasOwn(environments,scene.subject)||!palettes[scene.palette]||!cameras[scene.camera])return false;
 const [x,y,scale,angle]=cameras[scene.camera];
 const edit=photoEdits[scene.id];
 const period=edit?edit[0]*1000:6400+scene.seed%1600;
 stage.style.setProperty("--im-shot-x",x);
 stage.style.setProperty("--im-shot-y",y);
 stage.style.setProperty("--im-shot-scale",scale);
 stage.style.setProperty("--im-shot-angle",angle+"deg");
 stage.style.setProperty("--im-shot-time",period+"ms");
 stage.dataset.environment=scene.subject;
 stage.toggleAttribute("data-moving-scene",scene.id!=="b-track-27");
 stage.hidden=false;
 const kidYugiView=kidYugiScenes[scene.id];
 const photoView=kidYugiView??libraryScenes[scene.id]??null;
 const photoAtlas=photoView?(kidYugiView?kidYugiTextures:libraryTextures):textures;
 const shot={stage,scene,period,edit,photoView,photoAtlas,started:performance.now()};
 if(!draw(shot)){stage.hidden=true;return false}
 active=shot;
 lastFrame=0;
 cancelAnimationFrame(frame);
 frame=requestAnimationFrame(tick);
 loadTextures(textures);
 if(photoView)loadTextures(photoAtlas);
 return true;
}
function stop(stage){
 if(!stage||stage.hidden)return;
 stage.hidden=true;
 stage.removeAttribute("data-suspended");
 stage.removeAttribute("data-moving-scene");
 stage.removeAttribute("data-photographed-scene");
 if(active?.stage===stage){
  active=null;
  cancelAnimationFrame(frame);
  frame=0;
 }
 for(const canvas of stage.querySelectorAll("canvas"))canvas.width=canvas.height=0;
}
function setSuspended(stage,suspended){
 const shot=active;
 if(!shot||shot.stage!==stage||(shot.suspendedAt!=null)===suspended)return;
 stage.toggleAttribute("data-suspended",suspended);
 const now=performance.now();
 if(suspended){
  shot.suspendedAt=now;
  cancelAnimationFrame(frame);
  frame=0;
  return;
 }
 shot.started+=now-shot.suspendedAt;
 shot.suspendedAt=null;
 if(shot.needsRedraw){
  shot.needsRedraw=false;
  draw(shot);
 }
 lastFrame=0;
 frame=requestAnimationFrame(tick);
}
window.addEventListener("resize",()=>{if(active)draw(active)},{passive:true});
window.MusicBoxImmersiveAnimation={find,start,stop,setSuspended,describeLyrics};
})();
