'use strict';
// Native clean junctions do not synchronise two media clocks. Observe the
// actual unmodified incoming stream instead of inferring a skip from late EOF.
function uninterruptedIntro(rows,volume){
 if(!Array.isArray(rows)||rows.length<3||!Number.isFinite(volume)||volume<=0||volume>1)return false;
 if(rows[0].event!=='play-request'||rows[0].at<0||rows[0].at>.02||rows.at(-1).event!=='adoption'||rows.at(-1).at<.75)return false;
 if(!rows.some(r=>r.event==='playing'))return false;
 return rows.every((r,i)=>Number.isFinite(r.at)&&Number.isFinite(r.observedAt)&&r.at>=0&&r.volume===volume&&r.muted===false&&r.rate===1&&r.seeking===false&&
  (r.event==='play-request'||r.paused===false)&&!(r.event==='waiting'&&r.at>.02)&&
  (!i||r.observedAt>=rows[i-1].observedAt&&r.at>=rows[i-1].at-.02));
}
module.exports={uninterruptedIntro};
