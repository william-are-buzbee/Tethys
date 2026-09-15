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
js+='\nglobal.__cb={fxStats,peak(){player.pos.set(0,dispY,0);cellsAround();},groundAt,chunkGrid,cellOf,creatures,carcasses,player,DEFS,SPAWN,spawn,choose,V3,keys,holds,GRIP,startHold,releaseHold,playerGrab,playerBite,updateHolds,wound,get blLive(){return blLive;},updateBlood,updateWounds,updateCreatures,updatePlayer,finishPlayer,bodies,updateSchools,get mode(){return mode;},get t(){return t;},setT:(v)=>{t=v;},massOf,cladeOf,gripOf,localToWorld,removeCreature,ECO,setWander,bodyExt,reachOf,BITE_M,ability,CLADES,EDGE,WHOLE,BLEED_T,WOUND_SLOW,STING,PIN,slowOf,envenom,edgeOf,coverAt,thruOf,bodyPointNear,freshShapes,get bpIdx(){return bpIdx;},worldShapes};';
const tmp=path.join(require('os').tmpdir(),'tethys_combat.js');
fs.writeFileSync(tmp,'(function(){"use strict";\n'+js+'\n})();');
process.env.PICK='0';
require('./stub.js');require(tmp);
const X=global.__cb;let fails=0;X.peak(); // v11.48: the title screen opens over the sea since v11.47.2; the peak's cells by hand, as the boot once loaded them
function check(ok,msg){if(!ok){fails++;console.error('  FAIL '+msg);}else console.log('  ok   '+msg);}
const dt=1/60;
const ch=X.chunkGrid[X.cellOf(0)*16+X.cellOf(0)];
const P=X.player;
// one frame of the game's combat path: the player, the creatures (contact, holds, arms), the wounds and the blood
function frame(){X.setT(X.t+dt);if(X.mode==='play')X.updatePlayer(dt);X.updateSchools(dt);X.updateCreatures(dt);if(X.mode==='play')X.finishPlayer(dt,X.bodies);X.updateWounds(dt);X.updateBlood(dt);}
function clearAll(){for(const c of X.creatures.slice())X.removeCreature(c);for(const h of X.holds.slice())X.releaseHold(h);}
function put(kind,pos,state,target){const c=X.spawn(ch,kind,pos,Math.random,{ent:-1});c.hunger=1;c.cool=0;c.scanT=0;if(state){c.state=state;c.target=target||null;c.chaseT=0;}c.home.copy(pos);return c;}
function anchorGap(h){const A=X.localToWorld(h.a,h.la,X.V3()),B=X.localToWorld(h.b,h.lb,X.V3());return Math.hypot(A.x-B.x,A.y-B.y,A.z-B.z);}

X.choose(1);P.pos.set(0,-12,0);P.vel.set(0,0,0);P.dead=false;
const groundY=-12;
// ---- 1. a ridge on a grazer: the hold forms, the rope holds, the grazer dies in the hold, the ridge feeds ----
{
  clearAll();P.pos.set(300,-30,300);const gy=X.groundAt(0,20);
  const g=put('grazer',X.V3(0,gy+1,20),'wander'),r=put('ridge',X.V3(0,gy+4,12),'chase',g);
  let formed=-1,died=-1,maxGap=0,nan=0,frames=0;
  for(let i=0;i<60*20;i++){frame();frames++;
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
  for(let i=0;i<60*8&&!r.hold;i++)frame();
  check(!!r.hold,'the hold formed again');
  r.target=null;r.state='wander';X.setWander(r);frame();
  check(!r.hold&&!g.held,'the ridge that drops its target drops its hold');
}
// ---- 3. the player held (v11.55, the states): an eel takes hold, bites on its clock, the player bleeds and is slowed; pinned, the eel's cutting edge kills ----
{
  clearAll();P.pos.set(0,-30,30);P.vel.set(0,0,0);P.bleed=0;P.cause='';P.dead=false;
  const e=put('eel',X.V3(0,-30,26),'chase',P);
  let formed=-1,pinned=-1,died=-1,bleedSeen=false,slowSeen=false,heldK=1;
  for(let i=0;i<60*10;i++){frame();if(e.hold&&e.hold.b===P){if(formed<0)formed=i;heldK=Math.min(heldK,P.heldK);if(e.hold.pinned&&pinned<0)pinned=i;}if(P.bleed>0){bleedSeen=true;if(X.slowOf(P)<1)slowSeen=true;}if(P.cause&&died<0){died=i;break;}}
  check(formed>=0,'the eel takes hold of the player');
  check(bleedSeen,'the player bleeds from the bites in the hold (no hit points: a wound is a clock, '+X.BLEED_T.slowbloods+' s for a slowblood)');
  check(slowSeen,'and swims slower while it bleeds (×'+X.WOUND_SLOW+')');
  check(heldK<1,'and slower again while held (×'+heldK.toFixed(2)+')');
  check(pinned>=0,'the eel pins the player ('+(pinned>=0?((pinned-formed)*dt).toFixed(2)+' s after the hold; its mass '+X.massOf(e).toFixed(0)+' against '+P.mass:'never')+')');
  check(died>=0,'and, pinned, its cutting edge through the finback\'s hide with the thrash kills: "'+P.cause+'" at '+(died>=0?(died*dt).toFixed(1):'-')+' s');
  clearAll();P.dead=false;P.cause='';
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
  check(P.hold&&P.hold.b===g2&&g2.bleed>0,'a bite on what is held is a tear: the grazer bleeds ('+g2.bleed.toFixed(1)+' s of it), and the finback\'s plain petals can do no more to a hide (verdict '+P.hold.thru+')');
  let stungAt=-1;for(let i=0;i<60*3;i++){frame();if(!P.hold){stungAt=i;break;}}
  console.log('  the grazer\'s spines: the finback (mass '+P.mass+') is stung off it '+(stungAt>=0?(stungAt*dt).toFixed(2)+' s on and cannot grab again for '+P.grabCD.toFixed(1)+' s':'never')+' (STING.mass '+X.STING.mass+')');
  check(stungAt>=0&&P.stungT>0,'a jaw on a spined slowblood is stung off it (COMBAT.md §3b)');
  P.grabCD=0;P.stungT=0;
  X.keys.KeyR=false;frame();
  check(!P.hold,'letting go of r lets go');
}
// ---- 5. blood: emitted at a wound, drifting, gone in seconds ----
{
  clearAll();P.pos.set(0,-30,30);
  const g=put('grazer',X.V3(0,-30,36),'wander');X.wound(g,20,null,g.pos,'snap');
  check(X.blLive>0,'blood is in the water after a wound');
  for(let i=0;i<60*(X.BLEED_T.slowbloods+6);i++)frame(); // waits out the clotting: a slowblood trickles for BLEED_T
  check(X.blLive===0,'and gone six seconds after the wound has clotted ('+X.blLive+' points left)');
}
// ---- 6. the table: every placed hunter of the player, its hold on a player that thrashes at full speed ----
{
  const kinds=[];for(const e of X.SPAWN){const d=X.DEFS[e.kind];if(d.prey&&d.prey.indexOf('player')>=0&&kinds.indexOf(e.kind)<0)kinds.push(e.kind);}
  console.log('  hunter        grip    mass    hold?   held for   pinned at   outcome   (the player: finback, thrashing at full speed from 0.6 s, no ability; judged over 25 s)');
  for(const k of kinds){clearAll();P.pos.set(0,-30,30);P.vel.set(0,0,0);P.bleed=0;P.dead=false;
    const d=X.DEFS[k];const c=put(k,X.V3(0,-30,30+(d.size+2)*0.5),d.role==='hunter'?'chase':d.role==='trap'?'sit':'sit',P);c.hunger=1;c.cool=0;if(d.role==='trap'||d.role==='ambush'){c.state='sit';c.pos.copy(P.pos);c.pos.z+=d.size*0.5+1;c.home.copy(c.pos);}
    P.yaw=Math.PI; // +z is ahead in the stub's frame; the player is still for the first 0.6 s (an ambusher needs a passer-by), then thrashes
    let formed=-1,ended=-1,pinned=-1,verdict='-';P.cause='';P.dead=false;
    for(let i=0;i<60*25;i++){if(i===36){X.keys.KeyW=true;X.keys.ShiftLeft=true;}frame();if(c.hold&&c.hold.b===P){if(formed<0){formed=i;verdict=c.hold.edge+' on '+c.hold.cover+': '+c.hold.thru;}if(c.hold.pinned&&pinned<0)pinned=i;}if(formed>=0&&!c.hold&&ended<0){ended=i;}if(P.cause){ended=i;break;}}
    const g=X.gripOf(c);
    console.log('  '+k.padEnd(13)+(g?g.kind:'none').padEnd(8)+String(X.massOf(c)).padEnd(8)+(formed>=0?'yes':'no ').padEnd(8)+(formed<0?'-':ended<0?'25 s+':((ended-formed)*dt).toFixed(1)+' s').padEnd(11)+(pinned<0?'-':((pinned-formed)*dt).toFixed(2)+' s').padEnd(12)+(P.cause?'dead: '+P.cause:formed<0?'-':ended<0?'held ('+verdict+')':'let go ('+verdict+')'));
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
    if(g.hurtN>n0){bites++;if(bites===1)firstD=c.pos.distanceTo(g.pos);}n0=g.hurtN;
    if(!g.alive){died=i;break;}}
  console.log('  the basker bit the grazer '+bites+' times; the first at '+firstD.toFixed(1)+' m, their bodies touching at '+contact.toFixed(1)+' (before this pass it was 4.4 — it had to blow past and take the grazer alongside its mid-body)');
  check(died>0,'a basker runs a grazer down and kills it ('+(died>0?(died*dt).toFixed(1)+' s':'alive after 30 s')+')');
  check(firstD>contact-1.5,'and its first bite lands nose-on, where its jaws are');
}
// ---- 9. a wound is a clock (v11.55): it bleeds for the clade's clotting time and closes; nothing dies of it ----
{
  clearAll();P.pos.set(0,-30,30);const gy=X.groundAt(0,130);
  const e=put('eel',X.V3(0,gy+4,130),'wander');e.hunger=0;
  X.wound(e,20,null,e.pos,'snap');const T=X.BLEED_T.slowbloods;
  for(let i=0;i<60*(T-2);i++){frame();e.hunger=0;}
  check(e.alive&&e.bleed>0&&e.bleed<3,'an eel still bleeds two seconds before its clotting time ('+e.bleed.toFixed(1)+' s left of '+T+')');
  for(let i=0;i<60*4;i++){frame();e.hunger=0;}
  check(e.alive&&e.bleed===0,'and has closed after it, alive');
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
  X.choose(si);clearAll();P.pos.set(0,-30,30);P.vel.set(0,0,0);P.dead=false;P.cd=0;
  const c=put('sickle',X.V3(0,-30,36),'chase',P);
  let reached=false;for(let i=0;i<60*8;i++){frame();if(c.grab===P)reached=true;}
  console.log('  the sickle reached for the player with its arms: '+(reached?'yes':'no (no rig in range)'));
  c.grab=P;c.target=P;P.cd=0;X.ability();
  check(c.grab===null&&c.target===null&&!c.hold,'the ink drops the target, the arms and the hold at once (it left c.grab on the player before)');
  X.choose(1);
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
      else{X.choose(pr.player);prey=P;P.pos.set(0,-30,60);P.vel.set(0,0,0);P.dead=false;P.yaw=0;P.pitch=0;pname='you as '+X.CLADES[pr.player].id;}
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
  X.choose(1);clearAll();
}
let nanH=0;for(const h of X.holds)for(const v of [h.len,h.load,h.pull])if(!isFinite(v))nanH++;
check(nanH===0,'no NaN in any hold');
{const f=X.fxStats();console.log('  debris: '+JSON.stringify(f));check(f.nan===0,'no NaN in the debris');check(f.scraps+f.silt>0,'the bites left scraps or silt');}
console.log(fails?'combat: '+fails+' FAILED':'combat: all ok');
process.exit(fails?1:0);
