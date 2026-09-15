// combat.js — how combat happens (v11.31). Before this a bite was a number subtracted when two centres came within `reach`: the
// bodies had real shapes and contact (physics.js) and the fight ignored them. Now a fight is a hold. Nothing here eats or kills by
// itself: a predator that reaches its prey takes hold of it — jaws (slowbloods), the arms closing on what the beak is at (ringmouths),
// claws or the plate mouth as a clamp (hingeshells) — and the hold is a rope between the holder's grip and a point on the held
// body's own hit capsule, solved after the bodies have pushed apart, the lighter one dragged more. The held one goes on being what it
// is (its steering is untouched: a grazer keeps trying to flee, the player keeps swimming) and that is the struggle: the velocity
// the rope has to take off it is a force on the grip, and a grip has a strength by the holder's mass. A hold breaks when the struggle
// outlasts the grip, or when the holder loses interest (its target changes — the ink, the stun, boredom at a withdrawn shell — the
// AI is untouched, it decides whom to want; this decides what having it means), or when the held dies. In the hold the holder bites
// on a clock: a share of its dmg lands, a share bleeds out over the seconds after (a wound), and a jaw that has torn at something
// near its own weight lets go (a shark's bite and spit: too big to hold while it thrashes). Forage (hp ≤ 1) is taken as before,
// at the first touch — a hold is for prey that can fight. The player's grab (right mouse or r, held) is the same hold with the
// clade's grip, and its bite while holding is a tear. Blood is the clade's (PLANET: copper, iron, vanadium), a pooled point cloud
// that drifts with the water and the bodies. Where the numbers are: GRIP (the knobs by kind), HOLD_BIG, WHOLE.
// v11.55 (COMBAT.md, pass 2 — the states): there are no hit points. A fight asks three questions of the two builds — can I swallow it (the gape by
// geometry, GAPE_K), can I keep hold of it (the struggle as before, and a hold kept past its pin time with the struggle under PIN.pull is a pin),
// does my edge get through its covering where I hold it (EDGE) — and the answer is a state, not a number: swallowed, opened, skewered, crushed,
// bitten at the nerve cord, dismembered (a kill), or nothing this edge can do here (the hunter lets go). A bite that is not the placed act is a
// wound: it bleeds for the clade's clotting time (BLEED_T), slows the body while it bleeds (WOUND_SLOW), and never kills by itself; a hunter bitten
// FLEE.n times by the player leaves. The chemistry (§3b): a holder's first bite carries its venom — the lurker's and the coilshell's paralysis pins
// at once — and a jaw or arms on a spined slowblood (the basker, the grazer) is stung off it (STING). A ringmouth about to be pinned drops the
// held arm (AUTOTOMY; the person, 15 Sep 2026: automatic) and it regrows by the clock. The player's death ends the slot's animal (save.js slotDeath).
const holds=[]; // {a: holder, b: held, K: GRIP[kind], la: the grip in a's frame, lb: the hold point in b's frame, len: the rope, biteT, load, pull, t}
// by the way a body takes hold (creatures_spec.js compile → b.grip). k: the grip's strength, a force per mass^(2/3) (muscle scales with
// cross-section); cd: seconds between bites in the hold; first: the share of dmg on the clamp; bite: the share per bite in the hold;
// bleed: the share of every bite that bleeds out after it; close: m/s the rope shortens at until the bodies touch; slow: what the
// held player's swimming speed is multiplied by (arms round you slow you most); shake: the jerk (m/s) a bite gives the held
const GRIP={
  jaw:{k:16,cd:1.5,first:0.7,bite:0.7,bleed:0.4,close:2.0,slow:0.75,shake:2.5},
  arms:{k:16,cd:0.9,first:0,bite:0.45,bleed:0.25,close:1.5,slow:0.55,shake:0.8},
  claws:{k:24,cd:0.7,first:0.8,bite:0.3,bleed:0.3,close:1.2,slow:0.7,shake:1.2}
};
// The edge against the covering (v11.54, COMBAT.md §2 — pass 1 of injury as states): what a hold can do where it is. A body's edge and the
// covering of each of its hit capsules are read off its spec by compile (b.edge, b.cover, b.gape); a hold records the capsule it took (h.ci),
// the covering there and the verdict (h.thru). Nothing acts on the verdict yet — the bites still deal dmg — it is measured (test/combat.js,
// the matrix) and shown (the readout's hold line), so the person can see what each fight would be before the states replace the numbers.
// yes: through; nape: only at a pinned animal's nape; joint: only at a joint of the armour; thrash: with the body's thrash; time: given time; no
const EDGE={
  beak:{skin:'yes',hide:'nape',plate:'joint',shell:'joint'}, // cuts pieces from what the arms hold; the kill is one placed bite at the nerve cord
  rasp:{skin:'yes',hide:'no',plate:'no',shell:'time'}, // latches (the lamprey); drills a shell (the octopus)
  hold:{skin:'no',hide:'no',plate:'no',shell:'no'}, // plain petals: a clamp that ends in a swallow or a release
  cut:{skin:'yes',hide:'thrash',plate:'no',shell:'no'}, // cutting petals: a piece torn out, the hide with a thrash
  point:{skin:'yes',hide:'yes',plate:'no',shell:'no'}, // a needle jaw or spears: skewers
  crush:{skin:'yes',hide:'yes',plate:'yes',shell:'yes'}, // the crusher's plate jaw
  shred:{skin:'yes',hide:'no',plate:'joint',shell:'no'}, // the hingeshells' mouthparts: dismember at the joints
  claws:{skin:'yes',hide:'no',plate:'joint',shell:'no'}, // the hard grip: holds what is slower
  ram:{skin:'no',hide:'no',plate:'no',shell:'no'} // a blow: the stun, nothing through
};
function edgeOf(o){return (o.b&&o.b.edge)||null;}
function coverAt(o,i){const C=o.b&&o.b.cover;return C&&C.length?(C[i]||C[0]):'skin';}
function thruOf(edge,cover){const E=EDGE[edge];return E?(E[cover]||'no'):'no';}
let bpIdx=-1; // the capsule bodyPointNear last chose (an index into shapesW, which is the hit list's order)
const HOLD_BIG=0.6; // a jaw lets go after a bite on prey heavier than this share of its own mass (bite and spit)
const WHOLE=0.12,WHOLE_P=0.25; // forage up to this share of the eater's mass is swallowed whole at the touch (the creatures; the player's gulp is WHOLE_P — arrows and needles, not a picker, which is killed and eaten at)
// the states' knobs (v11.55)
const PIN={t:2.5,pull:0.5,mass:0.6,bored:8}; // pinned: a hold kept t seconds × (m_held/m_holder)^mass (0.3..3) with the struggle under pull of the grip; bored: a hunter's cooldown when its edge can do nothing where it holds
const GAPE_K=1.15; // a mouth swallows a body whose widest capsule is under gape × this (prey deform; a fish takes prey to about its mouth's width)
const BLEED_T={ringmouths:6,slowbloods:14,hingeshells:3,drifters:4}; // seconds an open wound bleeds before it clots, by clade (a ringmouth clots fast, a slowblood slowly, a hingeshell barely bleeds)
const WOUND_SLOW=0.8; // a body's speed while it bleeds
const FLEE={n:3,decay:8}; // a hunter or ambusher bitten n times by the player (a count that decays by one every decay seconds) leaves — the lost part's stand-in until pass 3
const STING={t:0.45,slow:0.5,dur:6,cool:6,mass:4}; // a jaw or arms on a spined slowblood: a holder under mass × the spined body's mass lets go after t seconds, swims at slow for dur, waits cool before it hunts again (a ridge on a grazer swallows the spines)
const AUTOTOMY={keep:2,regrow:5,cool:6,meal:0.1};
// pass 4 (v11.56, COMBAT.md §4–5): the trail, the miss, the poison
const SMELL_R=90; // m: a hungry hunter takes a bleeding body it eats as its target this far off, past its detect — the wound you survived is what brings the next hunter
const MISS={t:0.25,k:0.8,range:1.15,cool:1.5}; // the strike's miss rule: a hunter commits its bite t seconds out (the mouth opens: the tell), and it lands only if the prey has moved under k of its own width since and is still within range × reach; a miss costs cool × its bite cooldown. A striker's strike phase is its commit. k 0.8 (seen 15 Sep 2026, five trials each): a finback at sprint that turns across at the tell is missed 4 of 5 (at 1.0 it was caught 4 of 5); one that turns before the tell is missed every time at either
const POISON={heat:0.45,deep:CHEMO+10,load:0.4,clear:3,min:0.35,t:45,slow:0.5}; // hingeshells feeding where the sulfur line lives (heat over this, or below the chemocline) carry its toxin: full after load game days there, clear again after clear days away; a body over min sickens whatever eats it or its carcass for t seconds at slow (unless immune: the abyssal on its combs) // a ringmouth drops a held arm (never its last keep), it regrows in regrow game days; the holder keeps the arm (a cooldown, a little of its hunger)
const HOLD_DRAG=3; // per second: how fast the two bodies' velocities are pulled together by the grip
const PLAYER_GRIP={soft:1.2,fin:1.0,coil:0.6}; // the clades' grips: the jetter's arms are for this; the coilshell's are short
const BLOOD_COL={ringmouths:[0.16,0.24,0.34],slowbloods:[0.32,0.03,0.03],hingeshells:[0.52,0.5,0.32],drifters:[0.6,0.6,0.6]}; // copper, iron, vanadium (PLANET)
function massOf(o){return o===player?player.mass:(o.mass||bodyMass(o.def));} // the physical mass (creatures_ai.js): a hold is a struggle between two bodies
function cladeOf(o){if(o===player)return player.clade&&player.clade.id==='fin'?'slowbloods':'ringmouths';const sp=SPECS[o.kind];return sp?sp.clade:'hingeshells';}
function dmgOf(o){return o===player?(player.clade?player.clade.bite:8):(o.def.dmg||0);}
// a local point of o's frame in the world, with o's current position (the group's matrix may be a shift behind pos: resolveBodies moves pos)
function localToWorld(o,l,out){const e=o.g.matrix.elements;out.x=e[0]*l[0]+e[4]*l[1]+e[8]*l[2]+o.pos.x;out.y=e[1]*l[0]+e[5]*l[1]+e[9]*l[2]+o.pos.y;out.z=e[2]*l[0]+e[6]*l[1]+e[10]*l[2]+o.pos.z;return out;}
function worldToLocal(o,w,out){const e=o.g.matrix.elements,s2=e[0]*e[0]+e[1]*e[1]+e[2]*e[2]||1,wx=w.x-o.pos.x,wy=w.y-o.pos.y,wz=w.z-o.pos.z;out[0]=(e[0]*wx+e[1]*wy+e[2]*wz)/s2;out[1]=(e[4]*wx+e[5]*wy+e[6]*wz)/s2;out[2]=(e[8]*wx+e[9]*wy+e[10]*wz)/s2;return out;}
// the point on o's body (the axis of the nearest hit capsule) closest to w; o.pos if it has no shapes this frame
function bodyPointNear(o,w,out){const W=o.shapesW;let bx=o.pos.x,by=o.pos.y,bz=o.pos.z,bd=1e9,bi=-1;
  if(W)for(let k=0;k<W.length;k++){const c=W[k],ex=c.bx-c.ax,ey=c.by-c.ay,ez=c.bz-c.az,l2=ex*ex+ey*ey+ez*ez;let qx=c.ax,qy=c.ay,qz=c.az;
    if(l2>1e-6){const tt=clamp(((w.x-c.ax)*ex+(w.y-c.ay)*ey+(w.z-c.az)*ez)/l2,0,1);qx+=ex*tt;qy+=ey*tt;qz+=ez*tt;}
    const d=len3(w.x-qx,w.y-qy,w.z-qz)-c.r;if(d<bd){bd=d;bx=qx;by=qy;bz=qz;bi=k;}}
  bpIdx=bi;out.x=bx;out.y=by;out.z=bz;return out;}
function gripOf(o){return o.b&&o.b.grip;}
// The capsules a hold anchors to must be this frame's (v11.31.1, analysis_review 6): updateCreatures refreshes shapesW only within 90 m
// of the player, so a hold taken further off read the shapes from wherever that body last was near and anchored the rope at a point
// tens of metres off the animal — a rope that never shortened. The stamp is updateCreatures' frame counter.
function freshShapes(o){if(o===player||o.shapeF===frameNo)return;o.g.position.copy(o.pos);o.g.updateMatrix();worldShapes(o);o.shapeF=frameNo;}
// ---------- holds ----------
function startHold(a,b){
  const g=gripOf(a);if(!g||a.hold)return null;const K=GRIP[g.kind];
  freshShapes(a);freshShapes(b);
  const wa=localToWorld(a,g.at,T1),wb=bodyPointNear(b,wa,T2),lb=worldToLocal(b,wb,[0,0,0]);
  const edge=edgeOf(a),cover=coverAt(b,bpIdx); // what the hold is on and what the edge can do there (v11.54; measured, not yet acted on)
  const h={a:a,b:b,K:K,kind:g.kind,la:g.at,lb:lb,len:Math.max(0,len3(wa.x-wb.x,wa.y-wb.y,wa.z-wb.z)),biteT:K.cd,load:0,pull:0,t:0,ci:bpIdx,edge:edge,cover:cover,thru:thruOf(edge,cover),pinned:false,pinT:pinTime(a,b),stingT:stings(b)&&(g.kind==='jaw'||g.kind==='arms')&&massOf(a)<STING.mass*massOf(b)?STING.t:0,thrash:false,bit:false}; // the states (v11.55): pinned at pinT unless the held tears free; a spined slowblood stings the mouth or arms on it
  holds.push(h);a.hold=h;b.held=(b.held||0)+1;
  const dmg=dmgOf(a)*K.first*(a===player?0.5:1);
  if(dmg>0)wound(b,dmg,a,wb,'clamp');else{thump(0.3,90,40,b===player?null:wb,0.8,0.06);bloodBurst(wb,3,cladeOf(b));}
  return h;
}
function releaseHold(h){const k=holds.indexOf(h);if(k<0)return;holds.splice(k,1);if(h.a.hold===h)h.a.hold=null;h.b.held=Math.max(0,(h.b.held||0)-1);if(h.a!==player&&h.kind==='arms')h.a.grab=null;}
function releaseAll(o){for(let i=holds.length-1;i>=0;i--){const h=holds[i];if(h.a===o||h.b===o)releaseHold(h);}}
// the AI's bite (creatures_ai.js landBite): a hunter within reach of its prey. Forage dies at the touch as before; something that can
// fight is taken hold of, and the hold does the biting from here; a body with nothing to hold with (none placed) snaps as before
function combatBite(a,b){
  if(b===player){if(player.dead)return;if(player.withdrawn){a.bored++;return;}}
  else{if(!b.alive)return;if(b.def.hp>=1e8){a.bored++;return;}
    const sw=swallows(a,b);if(b.def.hp<=1||sw){kill(b,a,sw);dropTarget(a,6);return;}} // forage dies at the touch; a slowblood gulps what fits its gape (v11.55)
  if(!gripOf(a)){wound(b,dmgOf(a),a,null,'snap');return;}
  if(a.hold){if(a.hold.b===b)return;releaseHold(a.hold);}
  startHold(a,b);
}
const HP1=V3(),HP2=V3(),HV=V3();
function shiftBody(o,dx,dy,dz){if(o.shapesW&&o.shapesW.length)shiftShapes(o,dx,dy,dz);else{o.pos.x+=dx;o.pos.y+=dy;o.pos.z+=dz;}}
// once a frame, after the bodies have pushed apart (creatures_ai.js updateCreatures): every hold's rope, struggle and bite clock
function updateHolds(dt){
  if(!(dt>1e-4))return; // a frame of no time (two rAF in the same millisecond): the struggle divides by dt, and one NaN in h.load
  const P=player;P.heldK=1; // is a NaN rope for good. simChain guards the same way (v11.31.1, analysis_review 4)
  for(let i=holds.length-1;i>=0;i--){
    if(i>=holds.length){i=holds.length-1;if(i<0)break;} // a bite below can kill the held body, and kill's releaseAll splices holds under i: without this the walk runs off the end of the shortened list (v11.31.2; it took the low tier's smoke run down once in fifty)
    const h=holds[i],a=h.a,b=h.b,K=h.K;h.t+=dt;
    // does the hold stand? the holder must still want the held (the AI's target), both must be alive, the player's key held
    let drop=false;
    if(a===P){if(P.dead||mode!=='play'||!P.grabKey||P.withdrawn)drop=true;}else if(!a.alive||a.target!==b)drop=true;
    if(b===P){if(P.dead||mode!=='play')drop=true;}else if(!b.alive)drop=true;
    if(drop){releaseHold(h);continue;}
    const ma=massOf(a),mb=massOf(b),wa=ma===mb?0.5:mb/(ma+mb),wb=1-wa;
    const nearP=a===P||b===P||a.pos.distanceTo(P.pos)<95;
    // a holder does not run with what it holds: its steering still asks for the prey (the AI's seek, into a body it already has), so its
    // speed is capped at a cruise while the hold stands — it stays and bites, and what it holds is dragged only as far as that
    if(a!==P){const vm=(a.def.speed||(a.def.lunge||6)*0.3)*0.35,vl=a.vel.length();if(vl>vm)a.vel.multiplyScalar(vm/vl);}
    if(nearP){
      const A=localToWorld(a,h.la,HP1),B=localToWorld(b,h.lb,HP2);
      let dx=B.x-A.x,dy=B.y-A.y,dz=B.z-A.z;const d=len3(dx,dy,dz);
      if(d>h.len+3){releaseHold(h);continue;} // something moved one of them (a respawn, a cell line): the hold is gone
      // the rope closes until the bodies touch; once they do, it is as long as the contact leaves it (the jaws are on the body wherever it is)
      if(a.cWith===b||b.cWith===a)h.len=Math.max(h.len,Math.min(d,h.len+0.08));else h.len=Math.max(0,h.len-K.close*dt);
      let dv=0;
      if(d>h.len&&d>1e-4){const nx=dx/d,ny=dy/d,nz=dz/d,ex=d-h.len;
        shiftBody(a,nx*ex*wa,ny*ex*wa,nz*ex*wa);shiftBody(b,-nx*ex*wb,-ny*ex*wb,-nz*ex*wb);
        const vn=(b.vel.x-a.vel.x)*nx+(b.vel.y-a.vel.y)*ny+(b.vel.z-a.vel.z)*nz;
        if(vn>0){a.vel.x+=nx*vn*wa;a.vel.y+=ny*vn*wa;a.vel.z+=nz*vn*wa;b.vel.x-=nx*vn*wb;b.vel.y-=ny*vn*wb;b.vel.z-=nz*vn*wb;dv+=vn*wb;}}
      // the grip: the two move together
      const kd=1-Math.exp(-HOLD_DRAG*dt),rx=(b.vel.x-a.vel.x)*kd,ry=(b.vel.y-a.vel.y)*kd,rz=(b.vel.z-a.vel.z)*kd;
      a.vel.x+=rx*wa;a.vel.y+=ry*wa;a.vel.z+=rz*wa;b.vel.x-=rx*wb;b.vel.y-=ry*wb;b.vel.z-=rz*wb;dv+=len3(rx,ry,rz)*wb;
      // the struggle: what the rope took off the held body this frame is a force on the grip; a grip has a strength by the holder's mass,
      // and a struggle past half of it wears the hold down — at the grip's strength in two seconds, at twice it in under one
      const F=mb*dv/dt,str=K.k*Math.pow(ma,2/3)*(a===P?PLAYER_GRIP[P.clade.id]||1:1);
      h.load=lerp(h.load,F,1-Math.exp(-5*dt));
      h.pull=Math.max(0,h.pull+dt*(h.load/str-0.5));
      if(h.pull>1){if(a===P)P.grabCD=1.2;else a.biteT=(a.def.biteCD||1.2)*2;releaseHold(h);thump(0.25,140,60,b===P?null:B,1.2,0.05);continue;}
      if(h.kind==='arms')a.grab=b; // the arms close on what is held (physics.js stepRigs), whatever the behaviour says this frame
      if(b===P)P.heldK=Math.min(P.heldK,K.slow);
      (h.at||(h.at=V3())).copy(B);h.near=true;
    }else h.near=false;
    // the states, near or far (v11.55, COMBAT.md §2–3): the sting lets the holder go; a ringmouth about to be pinned drops the held arm; a hold
    // kept past its pin time with the struggle under PIN.pull is a pin (a paralysed body is pinned at once), and the placed act follows from the
    // edge's verdict where the hold is. Past 95 m there is no rope and no struggle, so a far fight resolves on the pin clock alone
    {const at=h.near?h.at:b.pos;
      if(h.stingT>0){h.stingT-=dt;if(h.stingT<=0){stung(a,b,at);releaseHold(h);continue;}}
      const para=(b===P?P.paraT:b.paraT)>0;
      if(!h.pinned&&(para||h.t>h.pinT*0.7)&&a!==P&&h.kind!=='arms'&&canDropArm(b)){autotomy(h);continue;}
      if(!h.pinned&&(para||(h.t>h.pinT&&h.pull<PIN.pull))){h.pinned=true;if(a!==P){placedAct(h);if(holds.indexOf(h)<0)continue;}}}
    // the bites, on the hold's clock (the player bites by hand: playerBite)
    if(a!==P){h.biteT-=dt;if(h.biteT<=0){h.biteT=K.cd;const at=h.near?h.at:b.pos;wound(b,dmgOf(a)*K.bite,a,at,'bite');
      if(!h.bit){h.bit=true;envenom(a,b);} // the first bite in the hold carries the holder's venom, if it has one (COMBAT.md §3b)
      if(h.thrash&&holds.indexOf(h)>=0){killBy(h,'thrash');continue;} // pinned, the edge through with a thrash: this bite tears the piece out
      if(h.kind==='jaw'&&mb>HOLD_BIG*ma&&holds.indexOf(h)>=0){a.biteT=(a.def.biteCD||1.2)*2;releaseHold(h);}}}
  }
}
// ---------- the states (v11.55) ----------
function widestR(o){const H=o.b&&o.b.hit,s=o.b&&o.b.g?o.b.g.scale.x:1;let r=0;if(H)for(const h of H)if(h.r*s>r)r=h.r*s;return r;}
// a slowblood swallows what fits its mouth (the gape by geometry: the prey's widest capsule against gape × GAPE_K); a ringmouth or a hingeshell takes
// forage in pieces at the touch, by mass as before (WHOLE). The player is swallowed like anything else — the finback's death (COMBAT.md §3)
function swallows(a,b){if(cladeOf(a)==='slowbloods')return widestR(b)<=(a.b.gape||0)*GAPE_K;return b!==player&&!!b.def.edible&&massOf(b)<=WHOLE*massOf(a);}
function gulps(tg){const P=player;if(!tg.def||!tg.def.edible)return false;return P.clade.id==='fin'?widestR(tg)<=(P.b.gape||0)*GAPE_K:massOf(tg)<=WHOLE_P*P.mass;} // the player's gulp: the finback by its gape, the beaks by mass (pieces)
function pinTime(a,b){return PIN.t*clamp(Math.pow(massOf(b)/massOf(a),PIN.mass),0.3,3);}
function venomOf(o){return o===player?(player.clade&&player.clade.venom)||null:(o.def&&o.def.venom)||null;}
function stings(o){const v=venomOf(o);return !!(v&&v.kind==='sting');}
function stung(a,b,at){if(a===player){player.stungT=STING.dur;player.grabCD=STING.cool;hurtPlayer(0,null);}else{a.stungT=STING.dur;dropTarget(a,STING.cool);}thump(0.35,160,70,a===player?null:at,1.2,0.05);bloodBurst(at,2,cladeOf(a));}
function stingPlayer(){player.stungT=STING.dur;hurtPlayer(0,null);} // the drifters' cells (creatures_ai.js): a sting, no wound
function envenom(a,b){const v=venomOf(a);if(!v||v.kind!=='paralyse'||!v.against[cladeOf(b)])return;if(b===player){if(player.withdrawn)return;player.paraT=v.t;}else b.paraT=v.t;}
function armsOf(o){const R=o.b&&o.b.rigs;if(!R)return null;let best=null;for(const r of R)if(r.chains.length>=4&&(!best||r.chains.length>best.chains.length))best=r;return best;} // the arm ring: the rig with the most chains
function canDropArm(o){if(cladeOf(o)!=='ringmouths')return false;const rig=armsOf(o);if(!rig)return false;return (o.armsLost||0)<rig.chains.length-AUTOTOMY.keep;}
// autotomy (COMBAT.md §3; the person, 15 Sep 2026: automatic): the held arm is dropped, the hold goes with it, the holder keeps the arm
function autotomy(h){const a=h.a,b=h.b,rig=armsOf(b);let ch=null;for(const c of rig.chains)if(!c.gone){ch=c;break;}if(!ch)return;
  ch.gone=true;b.armsLost=(b.armsLost||0)+1;(b.regrow||(b.regrow=[])).push(t+AUTOTOMY.regrow*DAY_S);
  const at=h.at||b.pos;bloodBurst(at,10,cladeOf(b));hitFx(b,a,at,12);thump(0.4,120,50,b===player?null:at,1,0.06);
  releaseHold(h);if(a!==player){dropTarget(a,AUTOTOMY.cool);a.hunger=Math.max(0,a.hunger-AUTOTOMY.meal);}else player.grabCD=1.5;
  if(b===player)hurtPlayer(0,null);}
function regrowTick(o){const R=o.regrow;if(!R||!R.length||t<R[0])return;R.shift();const rig=armsOf(o);if(rig)for(const c of rig.chains)if(c.gone){c.gone=false;break;}o.armsLost=Math.max(0,(o.armsLost||0)-1);}
// the placed act once a hunter has pinned its prey: by the gape, else by the edge's verdict where it holds. The player's own hold acts on its bite
function placedAct(h){const a=h.a,b=h.b;if(b!==player&&!b.alive)return;let act=null;
  if(cladeOf(a)==='slowbloods'&&swallows(a,b))act='swallowed';
  else{const v=h.thru,e=h.edge;if(v==='yes'||v==='nape')act=actOf(e);else if(v==='thrash')act='thrash';}
  if(!act){dropTarget(a,PIN.bored);return;} // nothing this edge can do where it holds: the hunter lets go and looks elsewhere
  if(act==='thrash'){h.thrash=true;return;} // the next bite on the clock tears the piece out
  killBy(h,act);}
function actOf(e){return e==='point'?'skewered':e==='crush'?'crushed':e==='cut'?'opened':e==='beak'?'bitten at the nerve cord':'dismembered';}
function killBy(h,act){const a=h.a,b=h.b,at=h.at||b.pos,cl=cladeOf(b);bloodBurst(at,16,cl);hitFx(b,a,at,24);thump(0.6,90,40,b===player?null:at,1,0.1);
  if(b===player){die((act==='swallowed'?'swallowed by':act==='thrash'?'torn open by':act+' by')+' a '+(a===player?'player':a.kind));return;}
  kill(b,a,act==='swallowed');}
function slowOf(o){return (o.bleed>0?WOUND_SLOW:1)*(o.stungT>0?STING.slow:1)*(o.sickT>0?POISON.slow:1);}
function bleeding(o){return o===player?player.bleed>0&&!player.dead&&player.inkT<=0:o.bleed>0;}
// the nearest bleeding body on c's prey list within R (creatures_ai.js updateHunter: past its detect, the water carries the blood)
function findBleeding(c,R){const d=c.def;let best=null,bd=R;if(d.prey.indexOf('player')>=0&&bleeding(player)&&(!d.preyClade||(player.clade&&player.clade.id===d.preyClade))){const dp=c.pos.distanceTo(player.pos);if(dp<bd){bd=dp;best=player;}}
  for(const o of creatures){if(!o.alive||o===c||!(o.bleed>0))continue;if(d.prey.indexOf(o.kind)<0)continue;const dd=c.pos.distanceTo(o.pos);if(dd<bd){bd=dd;best=o;}}return best;}
function missWin(tg,dur){return MISS.k*2*widestR(tg)*Math.max(1,dur/MISS.t);} // how far across the strike's line the prey may move during a commit of dur seconds before the jaws close on water
// the prey's movement since the commit, across the line the strike was aimed along (n: the unit vector from the striker to the prey at the commit); running straight away is caught by the reach check, the dodge is what is measured
function dodged(tpos,p0,n){const dx=tpos.x-p0.x,dy=tpos.y-p0.y,dz=tpos.z-p0.z,al=dx*n.x+dy*n.y+dz*n.z;return len3(dx-al*n.x,dy-al*n.y,dz-al*n.z);}
function commitAt(c,tpos,P,Nv){(P||(P=V3())).copy(tpos);(Nv||(Nv=V3())).copy(tpos).sub(c.pos);const l=Nv.length()||1;Nv.multiplyScalar(1/l);return [P,Nv];}
function missed(c,tg){c.biteT=(c.def.biteCD||1.2)*MISS.cool;c.missN=(c.missN||0)+1;thump(0.3,130,50,tg===player?null:c.pos,1.2,0.04);if(tg===player)player.fovKickT=0.15;} // the snap on water
function sicken(o){if(o===player){player.sickT=POISON.t;hurtPlayer(0,null);}else{o.sickT=POISON.t;dropTarget(o,POISON.t);}}
// a hingeshell's toxin follows where it has fed (every 2 s, staggered): loading at the seeps and below the chemocline, clearing elsewhere
function poisonTick(c,dt){c.poisT-=dt;if(c.poisT>0)return;c.poisT=2;const sp=SPECS[c.kind];if(!sp||sp.clade!=='hingeshells')return;const ch=chunkAt(c.pos.x,c.pos.z),f=ch?ch.f(c.pos.x,c.pos.z):null;
  const at=c.pos.y<POISON.deep||(f&&f[FI.heat]>POISON.heat);c.poison=clamp((c.poison||0)+(at?2/(POISON.load*DAY_S):-2/(POISON.clear*DAY_S)),0,1);} // a body's speed factor by its states (creatures_ai.js seek, player.js)
// once a frame: the states' clocks on the player and every creature (the creatures' paralysis is read in creatures_ai.js updateCreatures)
function updateStates(dt){const P=player;P.paraT=Math.max(0,(P.paraT||0)-dt);P.stungT=Math.max(0,(P.stungT||0)-dt);P.sickT=Math.max(0,(P.sickT||0)-dt);if(P.regrow)regrowTick(P);
  for(const c of creatures){if(!c.alive)continue;if(c.paraT>0)c.paraT-=dt;if(c.stungT>0)c.stungT-=dt;if(c.sickT>0){c.sickT-=dt;c.cool=Math.max(c.cool,0.5);}if(c.hurtN>0)c.hurtN=Math.max(0,c.hurtN-dt/FLEE.decay);if(c.regrow)regrowTick(c);poisonTick(c,dt);}} // sick: no hunting (the cool held)
// ---------- wounds ----------
// a bite that is not the placed act (v11.55): no number lands. The body bleeds for its clade's clotting time (BLEED_T, seconds — a second bite
// restarts the clock, it does not add), swims slower while it bleeds (slowOf), leaves a trickle in the water, and never dies of it. kind 'snap'
// (a free bite: knocked back), 'clamp' (taken hold of), 'bite' (in the hold: a jerk), 'tear' (the player's bite on what it holds). dmg is the
// bite's size for the blood and the debris only. An immortal body takes no wound
function wound(o,dmg,by,at,kind){
  const held=kind!=='snap',cl=cladeOf(o),T=BLEED_T[cl]||6;
  if(!at)at=o.pos;
  if(o===player){const P=player;if(P.dead)return;if(P.withdrawn){if(by&&by!==player)by.bored++;return;}
    hurtPlayer(0,held?null:(by&&by!==player?by.pos:null));if(P.dead)return;P.bleed=Math.max(P.bleed||0,T);P.woundL=worldToLocal(P,at,P.woundL||[0,0,0]);
    if(held&&by&&by!==player){const s=GRIP[by.hold&&by.hold.K?by.hold.kind:'jaw'].shake;P.vel.x+=rnd(-s,s);P.vel.y+=rnd(-s,s)*0.5;P.vel.z+=rnd(-s,s);}}
  else{if(!o.alive)return;if(o.def.hp>=1e8){if(by&&by!==player)by.bored++;bloodBurst(at,2,cl);return;}
    o.bleed=Math.max(o.bleed||0,T);o.lastHurt=t;o.woundL=worldToLocal(o,at,o.woundL||[0,0,0]);o.hurtN=(o.hurtN||0)+1;
    if(by===player&&(o.def.role==='hunter'||o.def.role==='ambush')&&o.hurtN>=FLEE.n&&o.state!=='flee'){dropTarget(o);o.state='flee';o.fleeT=9;}} // bitten enough, a hunter leaves you
  bloodBurst(at,4+dmg*0.4,cl);hitFx(o,by,at,dmg); // the flinch, the flush, the debris (fx.js, v11.53)
  if(o!==player)thump(clamp(0.15+dmg*0.01,0.15,0.5),110,45,at,0.9,0.05);
}
// bleeding, once a frame: the clock runs down and the wound trickles, faster while it is fresh
function updateWounds(dt){
  const P=player;
  const drain=(o)=>{if(!(o.bleed>0))return false;o.bleed=Math.max(0,o.bleed-dt);if(o===P)P.lastHurt=t;else o.lastHurt=t;
    o.bleedT=(o.bleedT||0)-dt;if(o.bleedT<=0&&o.g.visible!==false){o.bleedT=Math.max(0.1,0.3+0.9*(1-Math.min(1,o.bleed/6)));const w=localToWorld(o,o.woundL||[0,0,0],HP1);bloodBurst(w,1,cladeOf(o),0.15);}
    return true;};
  if(!P.dead&&mode==='play')drain(P);else P.bleed=0;
  for(const c of creatures){if(c.alive&&c.bleed>0)drain(c);}
}
// ---------- blood ----------
// one point cloud for all the blood in the water (like the snow, atmosphere.js: a size and an alpha per point through the same points
// patch, lit like the snow and by the player's light); each point drifts with the current and the flow round the bodies, spreads, and fades
const BL_N=Q.tier==='low'?240:480,blP=new Float32Array(BL_N*3),blV=new Float32Array(BL_N*3),blC=new Float32Array(BL_N*3),blS=new Float32Array(BL_N*2),blL=new Float32Array(BL_N),blA=new Float32Array(BL_N);let blNext=0,blLive=0;
const blG=new THREE.BufferGeometry();blG.setAttribute('position',new THREE.BufferAttribute(blP,3));blG.setAttribute('color',new THREE.BufferAttribute(blC,3));blG.setAttribute('aSz',new THREE.BufferAttribute(blS,2));
const blM=new THREE.PointsMaterial({color:0xcfe6ee,size:0.3,transparent:true,opacity:0.8,depthWrite:false,vertexColors:true});
blM.onBeforeCompile=function(sh){sh.uniforms.uPL=plU;sh.uniforms.uPLc=plCU;let n=0;
  sh.vertexShader=sh.vertexShader.replace('uniform float size;',()=>{n++;return 'attribute vec2 aSz;uniform vec4 uPL;varying float vA;varying float vL;uniform float size;';})
    .replace('gl_PointSize = size;',()=>{n++;return 'gl_PointSize=size*aSz.x;vA=aSz.y*smoothstep(0.4,1.5,-mvPosition.z);{vec3 dl=transformed-uPL.xyz;vL=uPL.w/(0.5+dot(dl,dl));}';})
    .replace('#include <logdepthbuf_vertex>',()=>{n++;return 'gl_PointSize=min(gl_PointSize,40.0);\n#include <logdepthbuf_vertex>';});
  sh.fragmentShader=sh.fragmentShader.replace('uniform vec3 diffuse;',()=>{n++;return 'varying float vA;varying float vL;uniform vec3 uPLc;uniform vec3 diffuse;';})
    .replace('#include <color_fragment>',()=>{n++;return 'diffuseColor.rgb=vColor*(diffuse+uPLc*vL);diffuseColor.a*=vA;';});
  if(n!==5)console.warn('blood: points chunks not as expected ('+n+' of 5); the blood draws uniform');};
blM.customProgramCacheKey=function(){return 'blood';};
const blood=new THREE.Points(blG,blM);blood.frustumCulled=false;blood.visible=false;scene.add(blood);
for(let i=0;i<BL_N;i++){blS[i*2+1]=0;blP[i*3+1]=-1e4;}
// n points of the clade's blood at p, thrown at up to `sp` m/s (a bite's puff) or barely (the trickle)
function bloodBurst(p,n,clade,sp){if(!FX.blood||!p)return;if(p.y>waveH(p.x,p.z))return;const col=BLOOD_COL[clade]||BLOOD_COL.slowbloods;sp=sp===undefined?0.9:sp;
  n=Math.min(BL_N,Math.round(n));for(let k=0;k<n;k++){const i=blNext;blNext=(blNext+1)%BL_N;const i3=i*3;
    blP[i3]=p.x+rnd(-0.15,0.15);blP[i3+1]=p.y+rnd(-0.15,0.15);blP[i3+2]=p.z+rnd(-0.15,0.15);
    blV[i3]=rnd(-1,1)*sp;blV[i3+1]=rnd(-1,1)*sp*0.7;blV[i3+2]=rnd(-1,1)*sp;
    const k2=rnd(0.75,1.1);blC[i3]=col[0]*k2;blC[i3+1]=col[1]*k2;blC[i3+2]=col[2]*k2;
    blL[i]=rnd(2.5,4.5);blA[i]=blL[i];blS[i*2]=rnd(0.6,1.2);blS[i*2+1]=1;}
  blLive=BL_N;blood.visible=true;}
function updateBlood(dt){
  if(!blLive){blood.visible=false;return;}
  blM.color.copy(pm.color); // the light on the snow is the light on the blood (atmosphere.js updateAtmosphere)
  let live=0;const kf=1-Math.exp(-4*dt),ks=Math.exp(-1.6*dt);
  for(let i=0;i<BL_N;i++){if(blS[i*2+1]<=0)continue;const i3=i*3;blA[i]-=dt;if(blA[i]<=0){blS[i*2+1]=0;blP[i3+1]=-1e4;continue;}
    live++;const x=blP[i3],y=blP[i3+1],z=blP[i3+2];flowAt(x,y,z,HV);
    blV[i3]=(blV[i3]+(HV.x+CURV.x-blV[i3])*kf)*ks;blV[i3+1]=(blV[i3+1]+(HV.y+CURV.y-0.04-blV[i3+1])*kf)*ks;blV[i3+2]=(blV[i3+2]+(HV.z+CURV.z-blV[i3+2])*kf)*ks;
    blP[i3]=x+blV[i3]*dt;blP[i3+1]=y+blV[i3+1]*dt;blP[i3+2]=z+blV[i3+2]*dt;
    const f=blA[i]/blL[i];blS[i*2]+=dt*0.9;blS[i*2+1]=Math.min(1,f*2.5)*0.85;}
  blLive=live;blG.attributes.position.needsUpdate=true;blG.attributes.aSz.needsUpdate=true;blG.attributes.color.needsUpdate=true;
}
// ---------- the player ----------
// the grab (right mouse or r, held): the arms or the jaws take hold of the nearest thing within reach ahead and keep it while the key is
// down, the rope doing the rest — a small thing is yours, a big one drags you. Let go and it goes. The clamp of the finback's jaws bites
function playerGrab(want,dt){
  const P=player;P.grabKey=want;P.grabCD=Math.max(0,(P.grabCD||0)-dt);
  if(!want||P.hold||P.grabCD>0||P.dead||P.withdrawn||!gripOf(P))return;
  const tg=playerTarget(false);if(!tg)return;
  if(gulps(tg)){P.grabCD=0.3;return;} // small enough to eat: the bite does that
  startHold(P,tg);if(P.b.rigs)P.grab=tg;
}
// the nearest live body (or carcass, if `dead`) within reach and ahead: the bite's rule
function playerTarget(dead){const P=player;T3.set(0,0,1).applyQuaternion(P.g.quaternion);let best=null,bd=1e9;
  const look=(c)=>{T1.copy(c.pos).sub(P.pos);const dd=T1.length(),reach=Math.max(2.2+c.def.size*0.45,reachOf(P,c));if(dd>reach)return;if(dd>1.2&&T1.dot(T3)/dd<0.2)return;if(dd<bd){bd=dd;best=c;}};
  for(const c of creatures){if(c.alive)look(c);}
  if(dead&&!best)for(const c of carcasses){if(!c.gone&&c.flesh>0)look(c);}
  return best;}
// the bite (click): forage is eaten whole (heals); a carcass is eaten at (heals); anything else is wounded — a tear if it is held, with
// the arms closing on it for a moment as before; a bite on what holds you loosens its grip
function playerBite(){
  const P=player;if(mode!=='play'||P.dead||P.withdrawn||P.biteCD>0)return;P.biteCD=0.5;thump(0.35,120,50,null,1.6,0.03);P.pulse=Math.max(P.pulse,0.6);P.snapT=0.1;
  const best=P.hold?P.hold.b:playerTarget(true);if(!best)return;const d=best.def;P.nudgeT=0.15;(P.nudgeD||(P.nudgeD=V3())).copy(best.pos).sub(P.pos).normalize(); // the camera nudged toward the bite (v11.53)T3.set(0,0,1).applyQuaternion(P.g.quaternion);
  if(best.dead){const m=Math.min(best.flesh,P.clade.size*0.5);best.flesh-=m;bloodBurst(best.pos,5,cladeOf(best),0.5);if(best.poison>POISON.min)sicken(P);return;} // a carcass: a mouthful (it feeds nothing yet — growth is what eating will buy, DIRECTION)
  if(gulps(best)){bloodBurst(best.pos,4,cladeOf(best));if(best.poison>POISON.min)sicken(P);kill(best,player,true);return;} // eaten whole (v11.26: no respawn; the ledger is debited; v11.55: by the finback's gape, the beaks by mass)
  if(P.b.rigs&&!P.hold){P.grab=best;P.grabT=0.6;} // the arms close on what you bite
  const held=P.hold&&P.hold.b===best,at=held&&P.hold.near?P.hold.at:T1.copy(best.pos).sub(P.pos).multiplyScalar(0.5).add(P.pos);
  if(held){const h=P.hold;if(h.pinned&&(h.thru==='yes'||h.thru==='nape'||h.thru==='thrash')){killBy(h,h.thru==='thrash'?'thrash':actOf(h.edge));return;} // the player's placed act: pinned, and the edge through where it holds (v11.55)
    if(!h.bit){h.bit=true;envenom(P,best);}} // the coilshell's venom on its first bite in a hold (COMBAT.md §3b)
  wound(best,P.clade.bite*(held?1.5:1),player,at,held?'tear':'snap');
  if(!best.alive)return;
  if(!held)best.vel.addScaledVector(T3,4);
  if(best.hold&&best.hold.b===P)best.hold.pull+=0.35; // it has you: a bite is a reason to let go
}
