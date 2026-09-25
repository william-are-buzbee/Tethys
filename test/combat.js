// Headless combat check (combat.js, v11.31): a hunter that reaches prey takes hold of it and the hold kills it; the rope keeps the
// two together and never NaNs; a hunter that loses interest lets go; the player's grab holds a small thing and is thrown off by a big one;
// the bite eats forage whole and tears at what is held; blood is emitted and dies; and a table of what each placed hunter's hold means for
// a player that thrashes at full speed (does it form, how long it lasts, what it costs); and (v11.31.1) the reach table: every
// predator's reach against the contact its own nose and its prey's body force, which is the distance it has to bite across, plus
// the four other combat fixes of that pass. Same bundle and stub as the smoke test.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const ORDER=fs.readFileSync(path.join(ROOT,'src','order.txt'),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&s[0]!=='#');
let js=ORDER.map(n=>fs.readFileSync(path.join(ROOT,'src',n+'.js'),'utf8')).join('\n');
js+='\nglobal.__cb={NCELL,fxStats,peak(){player.pos.set(0,dispY,0);cellsAround();},groundAt,chunkGrid,cellOf,creatures,carcasses,player,DEFS,SPAWN,spawn,choose,V3,keys,holds,GRIP,startHold,releaseHold,playerGrab,playerBite,updateHolds,cutAt,openWound,biteOn,bruise,blow,BLOOD,bloodK,VITAL,SEVER,EDGE_RHO,rhoOf,pointDepth,kgOf,kgOfBody,smellR,get blLive(){return blLive;},updateBlood,updateWounds,updateCreatures,updatePlayer,finishPlayer,bodies,updateSchools,get mode(){return mode;},get t(){return t;},setT:(v)=>{t=v;},massOf,cladeOf,gripOf,localToWorld,removeCreature,ECO,setWander,bodyExt,reachOf,BITE_M,ability,CLADES,EDGE,WHOLE,BLEED_T,STING,PIN,slowOf,envenom,SMELL_R,STRIKE,mouthOn,landsOn,aimAt,worldToLocal,swallows,get frameNo(){return frameNo;},seekTurn,POISON,kill,sicken,findBleeding,AUTOTOMY,DAY_S,LOSE,updateStates,edgeOf,coverAt,thruOf,bodyPointNear,freshShapes,get bpIdx(){return bpIdx;},worldShapes,VARY,MOULT,KIND_GEO,coatClassAt,coatChem,PAL,sheds,moult,harden,findPrey,FI,RAM,chunkAt,mulberry,injuriesLoad,faceQ};';
const tmp=path.join(require('os').tmpdir(),'tethys_combat.js');
fs.writeFileSync(tmp,'(function(){"use strict";\n'+js+'\n})();');
process.env.PICK='0';
require('./stub.js');require(tmp);
const X=global.__cb;let fails=0;X.peak(); // v11.48: the title screen opens over the sea since v11.47.2; the peak's cells by hand, as the boot once loaded them
function check(ok,msg){if(!ok){fails++;console.error('  FAIL '+msg);}else console.log('  ok   '+msg);}
const dt=1/60;
const ch=X.chunkGrid[X.cellOf(0)*X.NCELL+X.cellOf(0)];
const P=X.player;
// one frame of the game's combat path: the player, the creatures (contact, holds, arms), the wounds and the blood
function frame(){X.setT(X.t+dt);if(X.mode==='play')X.updatePlayer(dt);X.updateSchools(dt);X.updateCreatures(dt);if(X.mode==='play')X.finishPlayer(dt,X.bodies);X.updateWounds(dt);X.updateStates(dt);X.updateBlood(dt);}
const choose=(c)=>{X.choose(c);P.yaw=P.byaw=Math.PI;P.pitch=P.bpitch=0;X.faceQ(P);}; // faceQ (v11.92): the stub composes the matrix from the quaternion now, so the facing must be set, not only the yaw // v11.77: the body faces +z, as every placement below assumes (a yaw of 0 faces −z now: the body is composed from its facing, player.js faceQ)
function clearAll(){for(const c of X.creatures.slice())X.removeCreature(c);for(const h of X.holds.slice())X.releaseHold(h);}
function put(kind,pos,state,target){const c=X.spawn(ch,kind,pos,Math.random,{ent:-1});c.hunger=1;c.cool=0;c.scanT=0;if(state){c.state=state;c.target=target||null;c.chaseT=0;}c.home.copy(pos);return c;}
function anchorGap(h){const A=X.localToWorld(h.a,h.la,X.V3()),B=X.localToWorld(h.b,h.lb,X.V3());return Math.hypot(A.x-B.x,A.y-B.y,A.z-B.z);}

choose(1);P.pos.set(0,-12,0);P.vel.set(0,0,0);P.dead=false;
const groundY=-12;
// ---- 1. a ridge on a grazer: the hold forms, the rope holds, the grazer dies in the hold, the ridge feeds ----
{
  clearAll();P.pos.set(300,-30,300);const gy=X.groundAt(0,20);
  const g=put('grazer',X.V3(0,gy+1,20),'wander'),r=put('ridge',X.V3(0,gy+4,12),'chase',g);
  let formed=-1,died=-1,maxGap=0,nan=0,frames=0;
  for(let i=0;i<60*45;i++){frame();frames++;
    if(r.hold&&formed<0)formed=i;
    if(r.hold&&r.hold.near){const gap=anchorGap(r.hold)-r.hold.len;if(gap>maxGap)maxGap=gap;}
    for(const v of [r.pos.x,r.pos.y,r.pos.z,g.pos.x,g.pos.y,g.pos.z,r.vel.x,g.vel.x])if(!isFinite(v))nan++;
    if(!g.alive&&died<0){died=i;break;}}
  check(formed>=0,'the ridge takes hold of the grazer ('+(formed>=0?(formed*dt).toFixed(1)+' s':'never')+')');
  check(died>0,'the grazer dies in the hold ('+(died>0?((died-formed)*dt).toFixed(1)+' s after it was taken':'alive')+')');
  check(nan===0,'no NaN in either body');
  check(maxGap<0.6,'the rope holds: the anchors never part by more than 0.6 past its length (max '+maxGap.toFixed(2)+')');
  check(g.dead&&X.carcasses.indexOf(g)>=0,'the grazer is a carcass');
  check(r.state==='feed'&&!r.hold,'the ridge is feeding at it and holds nothing');
}
// ---- 2. a hunter that loses interest lets go ----
{
  clearAll();const gy=X.groundAt(0,20);
  const g=put('grazer',X.V3(0,gy+1,20),'wander'),r=put('ridge',X.V3(0,gy+4,12),'chase',g);
  for(let i=0;i<60*40&&!r.hold;i++)frame();
  check(!!r.hold,'the hold formed again');
  r.target=null;r.state='wander';X.setWander(r);frame();
  check(!r.hold&&!g.held,'the ridge that drops its target drops its hold');
}
// ---- 3. the player held (v11.55, the states; v11.91 pass A): an eel takes hold, bites on its clock; each bite through the hide is a wound of the bite's size, the player bleeds by it, weakens, and bleeds out ----
{
  clearAll();P.pos.set(0,-30,30);P.vel.set(0,0,0);P.bleed=0;P.blood=0;P.wounds=null;P.cause='';P.dead=false;
  const e=put('eel',X.V3(0,-30,34),'chase',P); // ahead of the finback (at rest it faces +z): from behind it would take the tail (v11.57)
  let formed=-1,pinned=-1,died=-1,bleedSeen=false,slowSeen=false,heldK=1,weakAt=-1,L1=0,q1=0,nW=0;
  for(let i=0;i<60*60;i++){frame();if(e.hold&&e.hold.b===P){if(formed<0)formed=i;heldK=Math.min(heldK,P.heldK);if(e.hold.pinned&&pinned<0)pinned=i;}if(P.bleed>0){bleedSeen=true;if(X.slowOf(P)<1)slowSeen=true;}if(P.wounds&&P.wounds.length&&!nW){nW=P.wounds.length;q1=P.bleed;}if(P.blood>X.BLOOD.weak&&weakAt<0){weakAt=i;L1=P.blood;}if(P.cause&&died<0){died=i;break;}}
  check(formed>=0,'the eel takes hold of the player');
  check(nW>0&&q1>0.004&&q1<0.02,'its clamp through the hide is a wound of the bite\'s size: '+nW+' wound draining '+(q1*100).toFixed(2)+'% of the blood a second (an eel\'s ρ '+X.rhoOf(e).toFixed(2)+' m on a trunk of r 0.53: a flank wound, short of the vitals)');
  check(bleedSeen&&slowSeen&&weakAt>=0,'the player bleeds by it and is weak past '+(X.BLOOD.weak*100)+'% lost ('+(weakAt>=0?(weakAt*dt).toFixed(1)+' s':'never')+')');
  check(heldK<1,'and slower again while held (×'+heldK.toFixed(2)+')');
  check(pinned>=0,'the eel pins the player ('+(pinned>=0?((pinned-formed)*dt).toFixed(2)+' s after the hold; its mass '+X.massOf(e).toFixed(0)+' kg against '+P.mass:'never')+')');
  check(died>=0&&/bled out|opened|torn/.test(P.cause),'and the finback dies of it: "'+P.cause+'" at '+(died>=0?(died*dt).toFixed(1):'-')+' s');
  clearAll();P.dead=false;P.cause='';P.blood=0;P.wounds=null;P.bleed=0;
}
// ---- 4. the player's grab: a darter is held and eaten; a grazer is held and drags the player; a bite tears at it ----
{
  clearAll();P.pos.set(0,-30,30);P.vel.set(0,0,0);P.bleed=0;
  const d=put('darter',X.V3(0,-30,32),'wander');d.school={members:[d],target:X.V3(0,-30,60),pos:d.pos.clone(),home:d.pos.clone(),t:5,threat:null,scanT:0};
  X.keys.KeyR=true;let formed=-1;
  for(let i=0;i<60*3;i++){frame();if(P.hold&&formed<0)formed=i;}
  check(formed<0,'a darter is not grabbed: small enough to eat, the bite takes it');
  X.keys.KeyR=false;d.pos.set(P.pos.x,P.pos.y,P.pos.z+2);X.playerBite();frame();
  check(!d.alive,'the bite eats the darter whole');
  clearAll();P.pos.set(0,-30,30);P.vel.set(0,0,0);
  const g=put('grazer',X.V3(0,-30,32.5),'wander');g.threat=P.pos;
  X.keys.KeyR=true;formed=-1;let dragged=0,broke=-1;const p0=P.pos.clone();
  for(let i=0;i<60*20;i++){frame();g.threat=P.pos;g.alarm=2.5;if(P.hold&&formed<0)formed=i;if(formed>=0&&!P.hold&&broke<0){broke=i;break;}}
  dragged=P.pos.distanceTo(p0);
  check(formed>=0,'the player takes hold of a fleeing grazer');
  console.log('  the grazer (mass '+X.massOf(g).toFixed(1)+' against the player\'s '+P.mass+') '+(broke>0?'tore free after '+((broke-formed)*dt).toFixed(1)+' s':'is still held after 20 s')+'; the player was dragged '+dragged.toFixed(1)+' m');
  X.keys.KeyR=true;clearAll();P.pos.set(0,-30,30);P.vel.set(0,0,0);P.grabCD=0;
  const g2=put('grazer',X.V3(0,-30,32.5),'wander');
  for(let i=0;i<60*3&&!P.hold;i++)frame();
  X.playerBite();frame();
  check(P.hold&&P.hold.b===g2&&!(g2.bleed>0),'a bite on what is held is the edge on it: the finback\'s plain petals can do nothing to a hide — a bruise, no blood (verdict '+P.hold.thru+'; v11.91)');
  let stungAt=-1;for(let i=0;i<60*3;i++){frame();if(!P.hold){stungAt=i;break;}}
  console.log('  the grazer\'s spines: the finback (mass '+P.mass+') is stung off it '+(stungAt>=0?(stungAt*dt).toFixed(2)+' s on and cannot grab again for '+P.grabCD.toFixed(1)+' s':'never')+' (STING.mass '+X.STING.mass+')');
  check(stungAt>=0&&P.stungT>0,'a jaw on a spined slowblood is stung off it (COMBAT.md §3b)');
  P.grabCD=0;P.stungT=0;
  X.keys.KeyR=false;frame();
  check(!P.hold,'letting go of r lets go');
}
// ---- 5. blood: emitted at a wound, drifting, gone in seconds; none at a bruise (v11.91) ----
{
  clearAll();P.pos.set(0,-30,30);
  const g=put('grazer',X.V3(0,-30,36),'wander');X.freshShapes(g);for(let i=0;i<60*6;i++)frame(); // the last section's blood out of the water first
  X.bruise(g,null,g.pos);for(let i=0;i<3;i++)frame();
  check(X.blLive===0&&!(g.bleed>0),'a bruise (the mouth on a covering it cannot open) draws no blood');
  X.cutAt(g,null,0,g.pos,'cut',0.4,0);
  check(X.blLive>0&&g.bleed>0,'blood is in the water after a wound (rate '+(g.bleed*100).toFixed(2)+'%/s, τ '+g.wounds[0].tau.toFixed(0)+' s)');
  const q0=g.bleed,tau5=g.wounds[0].tau;for(let i=0;i<60*tau5;i++){frame();g.hunger=0;}
  check(g.bleed<q0*0.4&&g.bleed>q0*0.3,'a clotting time later the rate has fallen by e ('+(g.bleed/q0).toFixed(2)+' of it)');
  for(let i=0;i<60*(tau5*5+6);i++){frame();g.hunger=0;}
  check(X.blLive===0,'and the trail is gone once it has clotted ('+X.blLive+' points left)');
}
// ---- 6. the table: every placed hunter of the player, its hold on a player that thrashes at full speed ----
{
  const kinds=[];for(const e of X.SPAWN){const d=X.DEFS[e.kind];if(d.prey&&d.prey.indexOf('player')>=0&&kinds.indexOf(e.kind)<0)kinds.push(e.kind);}
  console.log('  hunter        grip    mass    hold?   held for   pinned at   outcome   (the player: finback, thrashing at full speed from 0.6 s, no ability; judged over 60 s)');
  for(const k of kinds){clearAll();P.pos.set(0,-30,30);P.vel.set(0,0,0);P.bleed=0;P.blood=0;P.wounds=null;P.dead=false;
    const d=X.DEFS[k];const c=put(k,X.V3(0,-30,30+(d.size+2)*0.5),d.role==='hunter'?'chase':d.role==='trap'?'sit':'sit',P);c.hunger=1;c.cool=0;c.g.quaternion.setFromAxisAngle(X.V3(0,1,0),Math.PI); // facing the finback (v11.92: a mouth bites what is ahead of it)if(d.role==='trap'||d.role==='ambush'){c.state='sit';c.pos.copy(P.pos);c.pos.z+=d.size*0.5+1;c.home.copy(c.pos);}
    P.yaw=Math.PI; // +z is ahead in the stub's frame; the player is still for the first 0.6 s (an ambusher needs a passer-by), then thrashes
    let formed=-1,ended=-1,pinned=-1,verdict='-',maxL=0;P.cause='';P.dead=false;
    for(let i=0;i<60*60;i++){if(i===36){X.keys.KeyW=true;X.keys.ShiftLeft=true;}frame();if(c.hold&&c.hold.b===P){if(formed<0){formed=i;verdict=c.hold.edge+' on '+c.hold.cover+': '+c.hold.thru;}if(c.hold.pinned&&pinned<0)pinned=i;}if(formed>=0&&!c.hold&&ended<0){ended=i;}maxL=Math.max(maxL,P.blood||0);if(P.cause){ended=i;break;}}
    const g=X.gripOf(c);
    console.log('  '+k.padEnd(13)+(g?g.kind:'none').padEnd(8)+String(X.massOf(c)).padEnd(8)+(formed>=0?'yes':'no ').padEnd(8)+(formed<0?'-':ended<0?'60 s+':((ended-formed)*dt).toFixed(1)+' s').padEnd(11)+(pinned<0?'-':((pinned-formed)*dt).toFixed(2)+' s').padEnd(12)+(P.cause?'dead: '+P.cause:formed<0?'-':ended<0?'held ('+verdict+')':'let go ('+verdict+')')+'  blood '+(maxL*100).toFixed(0)+'%');
    P.dead=false;P.cause='';
    X.keys.KeyW=false;X.keys.ShiftLeft=false;}
}
// ---- 7. reach against contact: every predator, every prey on its list (v11.31.1, analysis_review 2) ----
{
  clearAll();
  const E={};const extOf=(k)=>E[k]||(E[k]=X.bodyExt({b:X.DEFS[k].build(),def:X.DEFS[k]}));
  const pl=X.bodyExt({b:P.b,def:P.def});
  const bodyOf=(k)=>k==='player'?pl:extOf(k);
  console.log('  biter         reach   prey           nose   prey   contact   bites at   short by');
  let short=0,pairs=0,bad=0;
  for(const k in X.DEFS){const d=X.DEFS[k];if(!d.prey||!d.reach)continue;const a=extOf(k);
    for(const pk of d.prey){if(pk!=='player'&&!X.DEFS[pk])continue;const b=bodyOf(pk),contact=a.hitN+b.hitB,at=X.reachOf(a,b);
      pairs++;if(d.reach<contact)short++;if(at<contact)bad++;
      console.log('  '+k.padEnd(13)+d.reach.toFixed(2).padStart(5)+'   '+pk.padEnd(12)+a.hitN.toFixed(2).padStart(5)+b.hitB.toFixed(2).padStart(7)+contact.toFixed(2).padStart(10)+at.toFixed(2).padStart(11)+(d.reach<contact?(contact-d.reach).toFixed(2):'-').padStart(11));}}
  console.log('  '+short+' of '+pairs+' pairs have a DEFS reach shorter than the two bodies\' contact; the bite test floors every one of them');
  check(bad===0,'every predator bites its prey at or past the distance their bodies force (BITE_M '+X.BITE_M+' m past it)');
}
// ---- 8. the nose-on bite: a basker running down a grazer (the case item 2 broke: reach 4.6 against 8.6 of body) ----
{
  clearAll();const gy=X.groundAt(0,20);P.pos.set(40,gy+6,10);P.vel.set(0,0,0);P.dead=false; // near: only within 90 m of the player do the bodies push apart, which is where the bug lived
  const g=put('grazer',X.V3(0,gy+2,20),'wander'),c=put('basker',X.V3(0,gy+4,4),'chase',g);
  let n0=0,bites=0,firstD=0,died=-1;const ext=X.bodyExt({b:c.b,def:c.def}),eg=X.bodyExt({b:g.b,def:g.def}),contact=ext.hitN+eg.hitB;
  for(let i=0;i<60*30;i++){frame();
    const nw=c.hold&&c.hold.b===g?1:0;if(nw>n0){bites++;if(bites===1)firstD=c.pos.distanceTo(g.pos);}n0=nw;
    if(!g.alive){died=i;break;}}
  console.log('  the basker bit the grazer '+bites+' times; the first at '+firstD.toFixed(1)+' m, their bodies touching at '+contact.toFixed(1)+' (before this pass it was 4.4 — it had to blow past and take the grazer alongside its mid-body)');
  check(died>0,'a basker runs a grazer down and kills it ('+(died>0?(died*dt).toFixed(1)+' s':'alive after 30 s')+')');
  check(firstD>contact-2.5,'and its first bite lands nose-on, where its jaws are (the mouth on the body, v11.92: '+firstD.toFixed(1)+' m centre to centre against '+contact.toFixed(1)+' at contact)');
}
// ---- 9. a wound is a volume lost (v11.91): a small one clots and the body lives; the blood comes back fed; a paralysed body goes nowhere ----
{
  clearAll();P.pos.set(0,-30,30);const gy=X.groundAt(0,130);
  const e=put('eel',X.V3(0,gy+4,130),'wander');e.hunger=0;X.freshShapes(e);
  X.cutAt(e,null,0,e.pos,'beak',0.06,0);const L0=e.blood,q0=e.bleed,tau=e.wounds[0].tau;
  for(let i=0;i<60*tau*5;i++){frame();e.hunger=0;}
  check(e.alive&&e.blood>0&&e.blood<X.BLOOD.weak&&!(e.bleed>0),'a beak\'s graze on an eel: '+(e.blood*100).toFixed(1)+'% of its blood lost by the time it has clotted (rate '+(q0*100).toFixed(3)+'%/s, τ '+tau.toFixed(0)+' s) — alive and whole under '+(X.BLOOD.weak*100)+'%');
  const L1=e.blood;X.setT(X.t+X.DAY_S*X.BLOOD.refill.slowbloods*0.5);for(let i=0;i<60*2;i++){frame();e.hunger=0;}
  check(e.blood<L1,'and the blood comes back fed ('+(L1*100).toFixed(2)+'% → '+(e.blood*100).toFixed(2)+'% two seconds on; '+X.BLOOD.refill.slowbloods+' game days to whole)');
  const l=put('lurker',X.V3(0,gy+2,140),'sit');X.envenom(l,e);
  check(e.paraT>0,'the lurker\'s venom paralyses a slowblood ('+e.paraT+' s)');
  const v0=e.vel.length();for(let i=0;i<60;i++)frame();
  check(e.vel.length()<0.3,'a paralysed eel goes nowhere (speed '+e.vel.length().toFixed(2)+')');
}
// ---- 10. a frame of no time leaves no NaN in a hold (analysis_review 4) ----
{
  clearAll();P.pos.set(0,-30,30);P.vel.set(0,0,0);P.dead=false;
  const e=put('eel',X.V3(0,-30,26),'chase',P);
  for(let i=0;i<60*6&&!e.hold;i++)frame();
  check(!!e.hold,'the eel has hold for the dt test');
  if(e.hold){const h=e.hold;X.updateHolds(0);X.updateHolds(0);
    check(isFinite(h.len)&&isFinite(h.load)&&isFinite(h.pull),'two frames of no time leave the hold finite (len '+h.len.toFixed(2)+' load '+h.load.toFixed(1)+' pull '+h.pull.toFixed(2)+')');}
}
// ---- 11. the ink lets go of the arms as well as the target (analysis_review 5) ----
{
  let si=0;for(let i=0;i<X.CLADES.length;i++)if(X.CLADES[i].id==='soft')si=i;
  choose(si);clearAll();P.pos.set(0,-30,30);P.vel.set(0,0,0);P.dead=false;P.cd=0;
  const c=put('sickle',X.V3(0,-30,36),'chase',P);
  let reached=false;for(let i=0;i<60*8;i++){frame();if(c.grab===P)reached=true;}
  console.log('  the sickle reached for the player with its arms: '+(reached?'yes':'no (no rig in range)'));
  c.grab=P;c.target=P;P.cd=0;X.ability();
  check(c.grab===null&&c.target===null&&!c.hold,'the ink drops the target, the arms and the hold at once (it left c.grab on the player before)');
  choose(1);
}
// ---- 12. the edge against the covering (v11.54, COMBAT.md §2, pass 1): every capsule covered, every hunter edged, and the matrix ----
{
  clearAll();P.pos.set(0,-30,30);P.vel.set(0,0,0);P.dead=false;
  const COV={skin:1,hide:1,plate:1,shell:1},kinds=Object.keys(X.DEFS);let bad=0;const noEdge=[];
  for(const k of kinds){const c=put(k,X.V3(0,-30,60),'wander'),b=c.b;
    if(!b.cover||b.cover.length!==b.hit.length)bad++;else for(const cv of b.cover)if(!COV[cv])bad++;
    if(!b.edge&&c.def.prey&&c.def.prey.length)noEdge.push(k);
    X.removeCreature(c);}
  check(bad===0,'every hit capsule of every kind has a covering ('+bad+' without)');
  check(noEdge.length===0,'every hunter with prey has an edge'+(noEdge.length?' — none on '+noEdge.join(', '):''));
  // the matrix: each hunter nose-on at contact behind each of its prey (the player as all three clades), both facing +z; the hold
  // point taken as startHold takes it (the nearest capsule to the grip), the covering read there, the edge's verdict; the route is a swallow
  // if today's gape rule (forage, or WHOLE of the hunter's mass) takes the prey whole. Fails if a grip is nowhere near the body it would hold
  const pairs=[];for(const k of kinds){const d=X.DEFS[k];if(!d.prey)continue;for(const p of d.prey)pairs.push([k,p]);}
  const rows=[],routes={};let far=0;
  for(const [hk,pk] of pairs){
    const preys=pk==='player'?X.CLADES.map((C,i)=>({player:i})):[{kind:pk}];
    for(const pr of preys){
      clearAll();let prey,pname;
      if(pr.kind!==undefined){prey=put(pr.kind,X.V3(0,-30,60),'wander');prey.vel.set(0,0,0);pname=pr.kind;}
      else{choose(pr.player);prey=P;P.pos.set(0,-30,60);P.vel.set(0,0,0);P.dead=false;P.yaw=P.byaw=Math.PI;P.pitch=P.bpitch=0;X.faceQ(P);pname='you as '+X.CLADES[pr.player].id;}
      const h=put(hk,X.V3(0,-30,0),'wander');h.vel.set(0,0,0); // no frame is run: a boid put by hand has no school, and the shapes are refreshed by hand below
      const reach=X.bodyExt(h).hitN+X.bodyExt(prey).hitB+X.BITE_M;h.pos.set(0,-30,60-reach);h.home.copy(h.pos);h.wander.copy(h.pos); // at contact, where a hold's rope ends up (the AI may take hold from its DEFS reach; the rope closes from there)
      X.freshShapes(h);if(prey===P){P.g.position.copy(P.pos);P.g.updateMatrix();X.worldShapes(P);}else X.freshShapes(prey);
      if(!h.b.grip){rows.push(hk.padEnd(8)+' -       → '+pname.padEnd(14)+' (no grip)');continue;}
      const wa=X.localToWorld(h,h.b.grip.at,X.V3()),wb=X.bodyPointNear(prey,wa,X.V3()),ci=X.bpIdx,cover=X.coverAt(prey,ci),edge=X.edgeOf(h),thru=X.thruOf(edge,cover);
      const cap=prey.shapesW&&prey.shapesW[ci],gap=Math.hypot(wa.x-wb.x,wa.y-wb.y,wa.z-wb.z)-(cap?cap.r:0);if(gap>1.0)far++;
      const ps=prey.b.g.scale.x||1;let pr_=0;for(const c of prey.b.hit)if(c.r*ps>pr_)pr_=c.r*ps;
      const d=prey===P?null:prey.def,swallow=d&&(d.hp<=1||(d.edible&&X.massOf(prey)<=X.WHOLE*X.massOf(h)));
      const route=swallow?'swallow':thru;(routes[hk]||(routes[hk]=[])).push(route);
      rows.push(hk.padEnd(8)+' '+(edge||'-').padEnd(6)+' → '+pname.padEnd(14)+' '+cover.padEnd(5)+' '+route.padEnd(7)+'  gape '+h.b.gape.toFixed(2)+' / r '+pr_.toFixed(2)+'  jaws '+gap.toFixed(1)+' m off the body');
    }}
  console.log('  the matrix (hunter edge → prey covering: the verdict; the gape against the prey\'s widest capsule; the grip\'s distance from the hold point):');
  for(const r of rows)console.log('    '+r);
  const stuck=Object.keys(routes).filter(k=>routes[k].every(r=>r==='no'));
  console.log('  hunters with no route through any of their prey (a finding for the person, not a failure): '+(stuck.length?stuck.join(', '):'none'));
  check(far===0,'every grip is within 1 m of the body it would hold at contact ('+far+' further off)');
  choose(1);clearAll();
}
// ---- 13. pass 4 (v11.56, COMBAT.md §4–5): hunters read blood, the strike's miss rule, the poison by feeding ----
{
  clearAll();P.pos.set(0,-30,30);P.vel.set(0,0,0);P.dead=false;P.cause='';P.bleed=0;P.inkT=0;
  // blood: an eel (detect 17) 60 m from a whole finback casts about but cannot see it; bleeding, the finback is its chase within a scan
  const e=put('eel',X.V3(0,-30,90),'wander');e.hunger=1;e.cool=0;e.home.copy(e.pos);
  for(let i=0;i<60*1.5;i++){frame();e.pos.set(0,-30,90);e.vel.set(0,0,0);}
  check(e.state!=='chase','an eel 60 m from a whole finback (detect '+X.DEFS.eel.detect+') does not chase it');
  X.freshShapes(P);X.cutAt(P,null,0,P.pos,'cut',0.22,0);let chased=-1;
  for(let i=0;i<60*2;i++){frame();e.pos.set(0,-30,90);if(e.state==='chase'&&e.target===P){chased=i;break;}}
  check(chased>=0,'and reads its blood from 60 m ('+(chased>=0?(chased*dt).toFixed(1):'-')+' s; SMELL_R '+X.SMELL_R+' at a flank wound, this one read from '+X.smellR(P).toFixed(0)+')');
  P.bleed=0;P.wounds=null;P.blood=0;
  // the miss: a chasing ridge commits its bite MISS.t before it lands; a grazer moved its own width in that window is missed, one that holds still is taken
  clearAll();P.pos.set(0,-30,30);const gy=X.groundAt(0,60);
  let g=put('grazer',X.V3(0,gy+2,60),'wander'),r=put('ridge',X.V3(0,gy+4,40),'chase',g);let committed=-1,landed=-1,missedAt=-1;
  for(let i=0;i<60*10;i++){frame();g.vel.set(0,0,0);g.threat=null;if(r.commitT>0&&committed<0){committed=i;g.pos.x+=2.5;}if(r.hold&&landed<0)landed=i;if(committed>=0&&r.missN>0&&missedAt<0)missedAt=i;if(landed>=0||missedAt>=0)break;}
  check(committed>=0,'a chasing ridge commits its lunge (the mouth opens, the heading locked: STRIKE.dur '+X.STRIKE.dur+' s)');
  check(missedAt>=0&&landed<0,'and a grazer that moved 2.5 m across it is missed — the mouth touches nothing (biteT '+r.biteT.toFixed(2)+': '+X.STRIKE.cool+' cooldowns, then it coasts past)');
  clearAll();g=put('grazer',X.V3(0,gy+2,60),'wander');r=put('ridge',X.V3(0,gy+4,40),'chase',g);let held=-1;
  for(let i=0;i<60*10;i++){frame();g.vel.set(0,0,0);g.threat=null;if(r.hold){held=i;break;}}
  check(held>=0&&r.missN===0,'a grazer that holds still is taken ('+(held>=0?(held*dt).toFixed(1):'-')+' s, no miss)');
  // the poison: a body fed at the seeps is no meal — the eater is sick and unfed; the abyssal is immune; the player that gulps one is sick and slowed
  clearAll();const s1=put('darter',X.V3(0,gy+1,60),'wander');s1.poison=1;const l=put('lurker',X.V3(0,gy+1,62),'sit');l.hunger=1;X.kill(s1,l);
  check(l.sickT>0&&l.hunger===1,'a lurker that eats a body fed at the seeps is sick for '+X.POISON.t+' s and gets no meal');
  const s2=put('darter',X.V3(0,gy+1,70),'wander');s2.poison=1;const a=put('abyssal',X.V3(0,gy+4,72),'wander');a.hunger=1;X.kill(s2,a);
  check(!(a.sickT>0)&&a.hunger<1,'the abyssal is immune (its combs) and is fed');
  clearAll();P.pos.set(0,-30,30);P.sickT=0;const s3=put('darter',X.V3(0,-30,32),'wander');s3.poison=1;X.playerBite();
  check(!s3.alive&&P.sickT>0&&X.slowOf(P)<1,'the finback that gulps one is sick and slowed (×'+X.slowOf(P)+')');P.sickT=0;
  clearAll();
}
// ---- 14. pass 3 (v11.57, COMBAT.md §2): the wound as a spec edit — a tail torn off, the body slower for good; a stump that grows back ----
{
  clearAll();choose(1);const gy0=X.groundAt(0,30);P.pos.set(0,gy0+12,30);P.vel.set(0,0,0);P.dead=false;P.cause='';P.yaw=P.byaw=Math.PI; // at rest the body faces +z: its tail is toward −z; in open water, so the ridge comes level (on the floor its clearance keeps it 2 m up and it bites the joint from above)
  P.blood=0;P.wounds=null;P.bleed=0;const r=put('ridge',X.V3(0,gy0+12,14),'chase',P);let lost=-1,ci=-1;
  for(let i=0;i<60*12;i++){frame();if(r.hold&&r.hold.b===P&&ci<0)ci=r.hold.ci;if(P.lost&&P.lost.length&&lost<0){lost=i;break;}if(P.cause)break;}
  check(lost>=0,'a ridge from behind takes the finback by the tail (capsule '+ci+', skin) and tears it off, not the life ('+(lost>=0?(lost*dt).toFixed(1):'-')+' s; cause "'+P.cause+'")');
  check(P.speedK<0.75&&P.turnK!==1,'and the finback is slower for good: the live spec without its tail re-derived (speedK '+P.speedK.toFixed(2)+', turnK '+P.turnK.toFixed(2)+')');
  const hid=P.lost&&P.lost.every(pi=>{const b=P.b.built[pi];return b&&b.nodes&&b.nodes.length&&b.nodes.every(m=>m.visible===false);});
  check(!!hid,'the tail\'s meshes are hidden');
  let taken=-1;for(let i=0;i<60*12;i++){frame();if(P.cause){taken=i;break;}}
  console.log('  crippled, the finback '+(taken>=0?'is taken '+(taken*dt).toFixed(1)+' s later: '+P.cause:'is still alive 12 s later'));
  // the stump: the soft-arm drops an arm to a hook; one segment stays; halfway through five days half of it is back; then all of it
  clearAll();let si=0;for(let i=0;i<X.CLADES.length;i++)if(X.CLADES[i].id==='soft')si=i;choose(si);P.pos.set(0,-30,30);P.vel.set(0,0,0);P.dead=false;P.cause='';P.blood=0;P.wounds=null;P.bleed=0;
  const hk=put('hook',X.V3(0,-30,34),'lunge',P);hk.lungeT=3;hk.hunger=1;let dropped=-1;
  for(let i=0;i<60*8;i++){frame();if(P.armsLost>0){dropped=i;break;}if(P.cause)break;}
  const rig=P.b.rigs.find(r=>r.chains.length>=4),ch=rig&&rig.chains.find(c=>c.gone);
  check(dropped>=0&&!!ch,'the soft-arm drops an arm to the hook ('+(dropped>=0?(dropped*dt).toFixed(2):'-')+' s)');
  const k0=P.speedK;  check(ch&&ch.grow===0&&P.live&&P.live.parts.some(p=>p.kind==='arms'&&p.n===7),'the stump: the chain gone with grow 0, the live spec at seven arms (speedK '+k0.toFixed(2)+')');
  X.setT(X.t+X.AUTOTOMY.regrow*X.DAY_S*0.5);frame();
  check(ch.gone&&ch.grow>0.45&&ch.grow<0.55,'halfway through '+X.AUTOTOMY.regrow+' days the arm is half back (grow '+ch.grow.toFixed(2)+')');
  X.setT(X.t+X.AUTOTOMY.regrow*X.DAY_S*0.51);frame();
  check(!ch.gone&&P.armsLost===0&&P.live.parts.some(p=>p.kind==='arms'&&p.n===8)&&P.speedK===1,'and whole after them: eight arms, the speed back (speedK '+P.speedK.toFixed(2)+')');
  choose(1);clearAll();
}
// ---- 15. the individual (v11.66, the hingeshell variety pass): the size band, the coat by chemistry, the moult and the shed, the ram's blow ----
{
  clearAll();choose(1);P.pos.set(0,-30,30);P.vel.set(0,0,0);P.dead=false;const gy=X.groundAt(0,60);
  // the size band: ledger sickles (ent 0) from seeded streams draw sizes within VARY.spread, the capsules and the reach following; a body outside the ledger is plain
  const ks=[],ratio=[];for(let i=0;i<40;i++){const c=X.spawn(ch,'sickle',X.V3(0,gy+6,60),X.mulberry(1000+i),{ent:0});ks.push(c.k);ratio.push(X.bodyExt(c).hitN/c.k);if(c.def.reach!==X.DEFS.sickle.reach*c.k)ratio.push(NaN);X.removeCreature(c);}
  const kmin=Math.min(...ks),kmax=Math.max(...ks),r0=ratio[0],rSame=ratio.every(r=>Math.abs(r-r0)<1e-6);
  check(kmin>=1-X.VARY.spread&&kmax<=1+X.VARY.spread&&kmax-kmin>0.12,'forty ledger sickles span the size band ('+kmin.toFixed(2)+'..'+kmax.toFixed(2)+' of '+X.DEFS.sickle.size+' m; VARY.spread '+X.VARY.spread+')');
  check(rSame,'and the hit capsules and the reach scale with the body (nose '+r0.toFixed(2)+' m per unit)');
  const plain=X.spawn(ch,'sickle',X.V3(0,gy+6,60),X.mulberry(7),{ent:-1});check(plain.k===1&&!plain.cls&&!plain.soft,'a body outside the ledger is built plain');X.removeCreature(plain);
  // the coat by chemistry: the class off the place, the preset shifted for it, the eyes never; a clade without keys gets no class
  const f=(sub,expo,heat,young)=>{const a=new Float32Array(9);a[X.FI.sub]=sub;a[X.FI.expo]=expo;a[X.FI.heat]=heat;a[X.FI.young]=young;return a;};
  const cl=[X.coatClassAt(-10,-8,f(0.9,0.6,0,0),'hingeshells'),X.coatClassAt(-40,-30,f(0.9,0,0,0),'hingeshells'),X.coatClassAt(-300,-280,f(0.15,0,0,0),'hingeshells'),X.coatClassAt(-250,-240,f(0.15,0,0.8,0),'hingeshells'),X.coatClassAt(-200,-180,f(0.7,0,0,0.9),'hingeshells'),X.coatClassAt(-40,-30,f(0.9,0,0,0),'slowbloods')];
  check(cl.join(',')==='lime,rust,mn,sulfide,d,','the classes read off the place: the reef\'s rock lime, rock in the light rust, the deep mud manganese, the vents sulfide, fresh rock dark, and none for a clade without keys ('+cl.join(',')+')');
  const p0=X.PAL.sickle,pr=X.coatChem(p0,'rust','hingeshells'),ps=X.coatChem(p0,'soft','hingeshells');
  check(pr!==p0&&pr.top!==p0.top&&pr.flap!==p0.flap&&pr.eye===p0.eye&&pr.joint===p0.joint,'the rust class shifts the plates of the sickle\'s preset and leaves its eyes and its pale joints (the blood\'s colour, not the water\'s)');
  const lum=c=>0.3*c[0]+0.59*c[1]+0.11*c[2];check(lum(ps.top)>lum(p0.top)*1.8,'the soft class is pale (top '+lum(p0.top).toFixed(2)+' → '+lum(ps.top).toFixed(2)+')');
  check(X.coatChem(X.PAL.grazer,'rust','slowbloods')===X.PAL.grazer,'a slowblood\'s preset is untouched by a class (its pass decides)');
  // the moult: a soft sickle is pale, clamped, on the floor, covered by skin; a ridge, whose cutting edge cannot get through the hard one's plate, opens the soft one
  const hard=X.spawn(ch,'sickle',X.V3(0,gy+6,60),X.mulberry(3),{ent:0,soft:false}),soft=X.spawn(ch,'sickle',X.V3(6,gy+6,60),X.mulberry(3),{ent:0,soft:true});
  check(!hard.soft&&hard.b.cover.every(c=>c==='plate')&&hard.moultT>0,'a hard sickle: plate all over, a clock to its next moult ('+(hard.moultT/X.DAY_S).toFixed(1)+' days)');
  check(soft.soft&&soft.b.cover.every(c=>c==='skin')&&soft.st.soft===1&&soft.state==='sit'&&soft.cls==='soft'&&!!X.KIND_GEO['sickle@soft'],'a soft sickle: skin all over, its valves clamped (st.soft), sitting, built pale in its own cached geometry');
  check(Math.abs(soft.pos.y-(X.groundAt(soft.pos.x,soft.pos.z)+X.DEFS.sickle.size*0.35*soft.k+0.05))<0.6,'and laid on the floor ('+(soft.pos.y-X.groundAt(soft.pos.x,soft.pos.z)).toFixed(2)+' m over it)');
  const hd=put('ridge',X.V3(soft.pos.x,soft.pos.y,soft.pos.z-8),'sit');hd.hunger=1;const seen=X.findPrey(hd,20);check(seen===soft,'a hungry ridge, which hunts no sickle, takes the soft one as prey (MOULT.prey '+X.MOULT.prey+'; the hood did this to v11.83, at size 5 — it is player-sized now and too small for a sickle)');X.removeCreature(hd);
  hard.pos.set(0,gy+6,60);hard.home.copy(hard.pos);hard.vel.set(0,0,0);hard.state='sit';hard.soft=true;hard.softT=1e9; // held still for the trial: the hard one sits like the soft one (its covering is what differs)
  const r1=put('ridge',X.V3(0,gy+6,50),'chase',hard);let held1=-1,verdict1='';for(let i=0;i<60*12;i++){frame();if(r1.hold&&r1.hold.b===hard&&held1<0){held1=i;verdict1=r1.hold.thru;}if(!hard.alive||(held1>=0&&!r1.hold))break;}
  check(held1>=0&&verdict1==='no'&&hard.alive,'a ridge holds the hard sickle on its plate and its cutting edge can do nothing there (verdict '+verdict1+'): it lives');
  X.removeCreature(r1);hard.soft=false;
  const r2=put('ridge',X.V3(6,gy+6,50),'chase',soft);let held2=-1,verdict2='',died2=-1;for(let i=0;i<60*90;i++){frame();if(r2.hold&&r2.hold.b===soft&&held2<0){held2=i;verdict2=r2.hold.thru;}if(!soft.alive){died2=i;break;}}
  check(died2>0&&(held2<0||verdict2==='yes'),'the same ridge takes the soft sickle on its skin (verdict '+(held2>=0?verdict2:'yes — the clamp itself the kill, a nape bite from above')+') and kills it — opened, or torn apart in pieces (v11.91: '+(died2>0?((died2-held2)*dt).toFixed(1)+' s after the hold, '+(soft.eaten?Math.round(soft.eaten*100)+'% taken, ':'')+(soft.blood*100).toFixed(0)+'% of its blood lost':'alive')+')');
  clearAll();
  // the moult itself: the twin soft, the cast carapace on the floor beside it; hardened, an adult with a clock
  const m0=X.spawn(ch,'sickle',X.V3(0,gy+6,60),X.mulberry(5),{ent:0,soft:false}),n0=X.sheds.length,tw=X.moult(m0);
  check(tw.soft&&tw!==m0&&!m0.alive&&X.sheds.length===n0+1&&X.sheds[n0].mesh.geometry.attributes.position.count>1000,'the moult: the soft twin in its place, the shed dropped beside it ('+X.sheds[n0].mesh.geometry.attributes.position.count+' vertices, MOULT.shedT '+X.MOULT.shedT+' days)');
  const ad=X.harden(tw);check(!ad.soft&&ad.b.cover.every(c=>c==='plate')&&ad.moultT>0&&!tw.alive,'hardened: a plated adult with a clock to its next moult');
  X.removeCreature(ad);for(const s of X.sheds.slice())s.t=-1;
  // the ram's blow: its strike on what its mouth cannot take whole is a knock — the body stunned, no hold, the ram off it
  clearAll();const g=put('grazer',X.V3(0,gy+2,60),'wander'),rm=put('ram',X.V3(0,gy+2,40),'chase',g);let stunned=-1,heldR=false;for(let i=0;i<60*12;i++){frame();g.vel.set(0,0,0);g.threat=null;if(rm.hold)heldR=true;if(g.stun>0){stunned=i;break;}}
  check(stunned>=0&&!heldR&&rm.target!==g,'the ram\'s blow stuns the grazer ('+(stunned>=0?(stunned*dt).toFixed(1):'-')+' s; RAM.stun '+X.RAM.stun+') and takes no hold');
  clearAll();choose(1);
}
// ---- 16. pass A (v11.91, COMBAT.md §10.8): one mass, the wound by the bite against the part, the tail severed and the body bled out, the piece as food, the hunter that stays ----
{
  clearAll();choose(1);
  check(Math.abs(P.mass-1770)<60,'one mass, in kilograms, derive\'s: the finback '+P.mass+' kg');
  const e0=put('eel',X.V3(0,-30,60),'wander'),r0=put('ridge',X.V3(0,-30,90),'wander'),f0=put('flicker',X.V3(0,-30,70),'wander');
  check(Math.abs(X.kgOf(e0)-2650)<100&&Math.abs(X.kgOf(r0)-45450)<2000&&X.kgOf(f0)>5&&X.kgOf(f0)<40,'the eel '+X.kgOf(e0).toFixed(0)+' kg, the ridge '+X.kgOf(r0).toFixed(0)+', a flicker '+X.kgOf(f0).toFixed(0)+' (size³ gave 64, 729 and 0.6)');
  const rhoR=X.rhoOf(r0),rhoE=X.rhoOf(e0);
  check(rhoR>0.5&&rhoR<0.6&&rhoE>0.2&&rhoE<0.25,'the bite\'s radius off the mouth: the ridge\'s cut '+rhoR.toFixed(2)+' m, the eel\'s '+rhoE.toFixed(2)+' (EDGE_RHO.cut '+X.EDGE_RHO.cut+' of the gape)');
  clearAll();
  // the finback's plain petals on a grazer's hide: bruises, no blood, nothing opened (the person, 24 Sep 2026: "blood gushes out even when you inflict no damage")
  P.pos.set(0,-30,30);P.vel.set(0,0,0);P.grabCD=0;for(let i=0;i<60*6;i++)frame(); // the earlier blood out of the water
  const g=put('grazer',X.V3(0,-30,32.5),'wander');X.keys.KeyR=true;for(let i=0;i<60*3&&!P.hold;i++)frame();
  X.playerBite();frame();X.playerBite();frame();
  check(!!P.hold&&!(g.bleed>0)&&!(g.blood>0)&&X.blLive===0,'the finback\'s plain petals clamp a grazer and bite: bruises — no wound, no blood (verdict '+(P.hold?P.hold.thru:'-')+')');
  X.keys.KeyR=false;frame();clearAll();
  // the tail: a ridge from behind severs it (ρ 0.54 ≥ SEVER × 0.25), the root pours, the ridge has a mouthful and keeps its target; the finback bleeds out
  const gy0=X.groundAt(0,30);P.pos.set(0,gy0+12,30);P.vel.set(0,0,0);P.dead=false;P.cause='';P.blood=0;P.wounds=null;P.bleed=0;P.yaw=P.byaw=Math.PI;
  const r=put('ridge',X.V3(0,gy0+12,14),'chase',P);r.hunger=1;let lost=-1,q=0,h0=1,tgKept=false,died=-1,peakQ=0;
  for(let i=0;i<60*90;i++){frame();if(P.lost&&P.lost.length&&lost<0){lost=i;q=P.bleed;h0=r.hunger;}if(lost>=0&&i===lost+30)tgKept=r.target===P;peakQ=Math.max(peakQ,P.bleed||0);if(P.cause){died=i;break;}}
  check(lost>=0,'a ridge from behind severs the finback\'s tail ('+(lost>=0?(lost*dt).toFixed(1):'-')+' s)');
  check(q>0.012&&q<0.03,'the root pours: '+(q*100).toFixed(2)+'% of the blood a second (a graze was '+(0.0025*100).toFixed(2)+')');
  check(h0<1&&h0>0.7,'the tail is the ridge\'s food by its share of the body: hunger 1 → '+h0.toFixed(2)+' (a snack to a 45 t animal)');
  check(tgKept,'and, still hungry, the ridge keeps its target (it left after one mouthful before)');
  check(died>=0&&/bled out|opened|swallowed|torn/.test(P.cause),'crippled and pouring, the finback is dead '+(died>=0?((died-lost)*dt).toFixed(1)+' s after the tail: "'+P.cause+'"':'— alive 90 s on'));
  P.dead=false;P.cause='';P.blood=0;P.wounds=null;P.bleed=0;clearAll();
  // the tail alone, the ridge gone: the finback bleeds out of the root wound within BLOOD's numbers (τ 33 s at a 0.33; 40% in about 45 s). A whole body first: the clade swapped and back
  choose(0);choose(1);P.pos.set(0,-30,30);P.vel.set(0,0,0);P.dead=false;P.cause='';P.blood=0;P.wounds=null;P.bleed=0;P.eaten=0;
  P.g.position.copy(P.pos);P.g.updateMatrix();X.worldShapes(P);const rr=P.b.hit.map(h=>h.r);let tailCi=-1;for(let i=0;i<rr.length;i++)if(P.b.hitOwn[i]>=0)tailCi=i;
  const at=X.localToWorld(P,P.b.hit[tailCi].a,X.V3());const res=X.cutAt(P,null,tailCi,at,'cut',0.54,0);
  let out=-1;for(let i=0;i<60*120;i++){frame();if(P.cause){out=i;break;}}
  check(res==='severed'&&out>=0&&out*dt>25&&out*dt<75&&P.cause==='bled out','the tail off and nothing else: the finback bleeds out in '+(out>=0?(out*dt).toFixed(0):'-')+' s ("'+P.cause+'"; BLOOD.dead '+X.BLOOD.dead+')');
  P.dead=false;P.cause='';P.blood=0;P.wounds=null;P.bleed=0;P.eaten=0;P.lost=null;P.live=null;P.speedK=1;P.turnK=1;choose(1);clearAll();
  // the smell by the rate: a pouring wound is read from further than a thread
  P.pos.set(0,-30,30);P.g.position.copy(P.pos);P.g.updateMatrix();X.worldShapes(P);X.cutAt(P,null,0,P.pos,'beak',0.1,0);const sThread=X.smellR(P);P.wounds=null;P.bleed=0;P.blood=0;P.eaten=0;
  X.cutAt(P,null,0,P.pos,'cut',0.42,0);const sPour=X.smellR(P);P.wounds=null;P.bleed=0;P.blood=0;P.eaten=0;
  check(sThread<60&&sPour>150,'the smell by the rate: a thread from '+sThread.toFixed(0)+' m, a pouring wound from '+sPour.toFixed(0)+' (SMELL_R '+X.SMELL_R+' at the eel\'s flank bite, at most twice)');
  // the save: the loss and the wounds ride the record and come back
  X.cutAt(P,null,0,P.pos,'cut',0.3,0);P.blood=0.21;P.eaten=0;const rec={arms:0,regrow:[],bleed:P.bleed,blood:P.blood,wounds:P.wounds.map(w=>({ci:w.ci,at:w.at.slice(),q:w.q,tau:w.tau})),lost:[]};
  P.wounds=null;P.bleed=0;P.blood=0;X.injuriesLoad(rec);
  check(P.blood===0.21&&P.wounds&&P.wounds.length===1&&P.bleed>0,'the blood lost and the open wound ride the save ('+(P.blood*100).toFixed(0)+'% lost, '+P.wounds.length+' wound at '+(P.bleed*100).toFixed(2)+'%/s)');
  P.wounds=null;P.bleed=0;P.blood=0;clearAll();
}
// ---- 17. pass B (v11.92, COMBAT.md §10.3–4): the mouth on the body, the joint, no orbit, the petals never through the face ----
{
  clearAll();choose(1);
  // the mouth's sphere: a ridge beside the finback, level, cannot bite it until its mouth is on a capsule; at the nose it can
  const gy=X.groundAt(0,60);P.pos.set(0,gy+10,60);P.vel.set(0,0,0);P.yaw=P.byaw=Math.PI;P.g.position.copy(P.pos);P.g.updateMatrix();X.worldShapes(P);
  const r=put('ridge',X.V3(6,gy+10,60),'sit');r.g.position.copy(r.pos);r.g.updateMatrix();X.worldShapes(r);r.shapeF=X.frameNo;
  const beside=X.landsOn(r,P),dOld=r.pos.distanceTo(P.pos)<X.reachOf(r,P);
  r.pos.set(0,gy+10,60-r.b.F.nose*r.b.g.scale.x-0.9);r.g.position.copy(r.pos);r.g.updateMatrix();X.worldShapes(r);
  const ahead=X.landsOn(r,P);
  check(!beside&&dOld&&ahead,'a ridge 6 m beside the finback is within the old reach ('+X.reachOf(r,P).toFixed(1)+' m) but its mouth is on nothing; nose to the finback, it bites (mouthOn: gape '+r.b.gape.toFixed(2)+' × STRIKE.slack '+X.STRIKE.slack+')');
  X.removeCreature(r);
  // no orbit: an ortho (the person's case) and a ridge take hold of the thrashing finback; the holder's bearing about the held sweeps little over the hold's first 4 s
  for(const kind of ['ortho','ridge']){clearAll();P.pos.set(0,-30,30);P.vel.set(0,0,0);P.dead=false;P.cause='';P.blood=0;P.wounds=null;P.bleed=0;P.eaten=0;P.yaw=P.byaw=Math.PI;
    const c=put(kind,X.V3(0,-30,30+(X.DEFS[kind].size+2)*0.5+1.5),'chase',P);c.hunger=1;c.g.quaternion.setFromAxisAngle(X.V3(0,1,0),Math.PI);let formed=-1,swept=0,last=null,frames=0,maxD=0; // close and facing the finback, as the table places its hunters
    for(let i=0;i<60*14;i++){if(i===36){X.keys.KeyW=true;X.keys.ShiftLeft=true;}frame();if(!(c.hold&&c.hold.b===P))last=null;if(c.hold&&c.hold.b===P){if(formed<0)formed=i;const th=Math.atan2(c.pos.x-P.pos.x,c.pos.z-P.pos.z);if(last!==null){let d=th-last;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;swept+=Math.abs(d);}last=th;frames++;const A=X.localToWorld(c,c.hold.la,X.V3()),B=X.localToWorld(P,c.hold.lb,X.V3());maxD=Math.max(maxD,A.distanceTo(B));if(frames>=240)break;}if(P.cause)break;}
    X.keys.KeyW=false;X.keys.ShiftLeft=false;
    check(formed>=0&&(frames>=120||P.cause)&&swept<1.2,'the '+kind+' takes the thrashing finback and does not orbit it: '+(formed>=0?(swept*180/Math.PI).toFixed(0)+'° swept about it in '+(frames/60).toFixed(1)+' s of the hold':'no hold')+(P.cause?' (then: '+P.cause+')':''));
    check(maxD<0.35,'and the joint holds: the grip and the struck point never part by more than 0.35 m (max '+maxD.toFixed(2)+')');
    P.dead=false;P.cause='';P.blood=0;P.wounds=null;P.bleed=0;P.eaten=0;}
  // the petals to the surface: a ridge holding the finback off its axis — no mouth tentacle's tip behind its root, none pulled through its own head
  clearAll();P.pos.set(0,-30,30);P.vel.set(0,0,0);P.dead=false;P.cause='';P.yaw=P.byaw=Math.PI;
  const rg=put('ridge',X.V3(1.5,-30,30+(X.DEFS.ridge.size+2)*0.5+1.5),'chase',P);rg.hunger=1;rg.g.quaternion.setFromAxisAngle(X.V3(0,1,0),Math.PI);let held=-1,bad=0,tips=0;
  for(let i=0;i<60*10;i++){frame();if(rg.hold&&rg.hold.b===P){if(held<0)held=i;for(const rig of rg.b.rigs){if(!rig.chains[0].mouth)continue;for(const ch of rig.chains){if(ch.gone)continue;const n=ch.n,tip={x:ch.pts[n*3],y:ch.pts[n*3+1],z:ch.pts[n*3+2]},root={x:ch.pts[0],y:ch.pts[1],z:ch.pts[2]};const lt=X.worldToLocal(rg,tip,[0,0,0]),lr=X.worldToLocal(rg,root,[0,0,0]);tips++;if(lt[2]<lr[2]-0.15)bad++;}}if(i>held+120)break;}if(P.cause)break;}
  check(held>=0&&tips>0&&bad<=tips*0.02,'the ridge holds the finback off its axis and its mouth tentacles do not fold behind their roots ('+bad+' of '+tips+' tip samples 15 cm behind on a 3 m petal, the flinch allowed 2%; the tips go for the point the hold has on the skin, inside the mouth\'s cone)');
  // a plain jaw sucks: the finback's mouth takes an arrow from STRIKE.suck gapes off; a cutting jaw has no such reach
  clearAll();P.pos.set(0,-30,30);P.vel.set(0,0,0);P.dead=false;P.cause='';P.yaw=P.byaw=Math.PI;P.g.position.copy(P.pos);P.g.updateMatrix();X.worldShapes(P);
  const ar=put('arrow',X.V3(0,-30,30+P.b.F.nose*P.b.g.scale.x+P.b.gape*1.6+0.2),'wander');ar.g.position.copy(ar.pos);ar.g.updateMatrix();X.worldShapes(ar);ar.shapeF=X.frameNo;
  check(X.mouthOn(P,ar,0)&&X.swallows(P,ar),'a plain jaw sucks: the finback\'s mouth takes an arrow '+(P.b.gape*1.6+0.2).toFixed(2)+' m off its nose (gape '+P.b.gape.toFixed(2)+' × STRIKE.suck '+X.STRIKE.suck+', a body it can swallow)');
  P.dead=false;P.cause='';clearAll();
}
let nanH=0;for(const h of X.holds)for(const v of [h.len,h.load,h.pull])if(!isFinite(v))nanH++;
check(nanH===0,'no NaN in any hold');
{const f=X.fxStats();console.log('  debris: '+JSON.stringify(f));check(f.nan===0,'no NaN in the debris');check(f.scraps+f.silt>0,'the bites left scraps or silt');}
console.log(fails?'combat: '+fails+' FAILED':'combat: all ok');
process.exit(fails?1:0);
