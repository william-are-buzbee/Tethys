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
const HOLD_BIG=0.6; // a jaw lets go after a bite on prey heavier than this share of its own mass (bite and spit)
const WHOLE=0.12,WHOLE_P=0.25; // forage up to this share of the eater's mass is swallowed whole at the touch (the creatures; the player's gulp is WHOLE_P — arrows and needles, not a picker, which is killed and eaten at)
const HOLD_DRAG=3; // per second: how fast the two bodies' velocities are pulled together by the grip
const PLAYER_GRIP={soft:1.2,fin:1.0,coil:0.6}; // the clades' grips: the jetter's arms are for this; the coilshell's are short
const BLOOD_COL={ringmouths:[0.16,0.24,0.34],slowbloods:[0.32,0.03,0.03],hingeshells:[0.52,0.5,0.32],drifters:[0.6,0.6,0.6]}; // copper, iron, vanadium (PLANET)
function massOf(o){return o===player?player.mass:(o.mass||Math.max(0.6,o.def.size*o.def.size*o.def.size));}
function cladeOf(o){if(o===player)return player.clade&&player.clade.id==='fin'?'slowbloods':'ringmouths';const sp=SPECS[o.kind];return sp?sp.clade:'hingeshells';}
function dmgOf(o){return o===player?(player.clade?player.clade.bite:8):(o.def.dmg||0);}
// a local point of o's frame in the world, with o's current position (the group's matrix may be a shift behind pos: resolveBodies moves pos)
function localToWorld(o,l,out){const e=o.g.matrix.elements;out.x=e[0]*l[0]+e[4]*l[1]+e[8]*l[2]+o.pos.x;out.y=e[1]*l[0]+e[5]*l[1]+e[9]*l[2]+o.pos.y;out.z=e[2]*l[0]+e[6]*l[1]+e[10]*l[2]+o.pos.z;return out;}
function worldToLocal(o,w,out){const e=o.g.matrix.elements,s2=e[0]*e[0]+e[1]*e[1]+e[2]*e[2]||1,wx=w.x-o.pos.x,wy=w.y-o.pos.y,wz=w.z-o.pos.z;out[0]=(e[0]*wx+e[1]*wy+e[2]*wz)/s2;out[1]=(e[4]*wx+e[5]*wy+e[6]*wz)/s2;out[2]=(e[8]*wx+e[9]*wy+e[10]*wz)/s2;return out;}
// the point on o's body (the axis of the nearest hit capsule) closest to w; o.pos if it has no shapes this frame
function bodyPointNear(o,w,out){const W=o.shapesW;let bx=o.pos.x,by=o.pos.y,bz=o.pos.z,bd=1e9;
  if(W)for(const c of W){const ex=c.bx-c.ax,ey=c.by-c.ay,ez=c.bz-c.az,l2=ex*ex+ey*ey+ez*ez;let qx=c.ax,qy=c.ay,qz=c.az;
    if(l2>1e-6){const tt=clamp(((w.x-c.ax)*ex+(w.y-c.ay)*ey+(w.z-c.az)*ez)/l2,0,1);qx+=ex*tt;qy+=ey*tt;qz+=ez*tt;}
    const d=len3(w.x-qx,w.y-qy,w.z-qz)-c.r;if(d<bd){bd=d;bx=qx;by=qy;bz=qz;}}
  out.x=bx;out.y=by;out.z=bz;return out;}
function gripOf(o){return o.b&&o.b.grip;}
// ---------- holds ----------
function startHold(a,b){
  const g=gripOf(a);if(!g||a.hold)return null;const K=GRIP[g.kind];
  const wa=localToWorld(a,g.at,T1),wb=bodyPointNear(b,wa,T2),lb=worldToLocal(b,wb,[0,0,0]);
  const h={a:a,b:b,K:K,kind:g.kind,la:g.at,lb:lb,len:Math.max(0,len3(wa.x-wb.x,wa.y-wb.y,wa.z-wb.z)),biteT:K.cd,load:0,pull:0,t:0};
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
    if(b.def.hp<=1||b.def.edible&&massOf(b)<=WHOLE*massOf(a)){kill(b,a);if(a.state!=='feed'){a.state='wander';setWander(a);}a.target=null;a.grab=null;a.cool=6;return;}}
  if(!gripOf(a)){wound(b,dmgOf(a),a,null,'snap');return;}
  if(a.hold){if(a.hold.b===b)return;releaseHold(a.hold);}
  startHold(a,b);
}
const HP1=V3(),HP2=V3(),HV=V3();
function shiftBody(o,dx,dy,dz){if(o.shapesW&&o.shapesW.length)shiftShapes(o,dx,dy,dz);else{o.pos.x+=dx;o.pos.y+=dy;o.pos.z+=dz;}}
// once a frame, after the bodies have pushed apart (creatures_ai.js updateCreatures): every hold's rope, struggle and bite clock
function updateHolds(dt){
  const P=player;P.heldK=1;
  for(let i=holds.length-1;i>=0;i--){const h=holds[i],a=h.a,b=h.b,K=h.K;h.t+=dt;
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
    // the bites, on the hold's clock (the player bites by hand: playerBite)
    if(a!==P){h.biteT-=dt;if(h.biteT<=0){h.biteT=K.cd;const at=h.near?h.at:b.pos;wound(b,dmgOf(a)*K.bite,a,at,'bite');
      if(h.kind==='jaw'&&mb>HOLD_BIG*ma&&holds.indexOf(h)>=0){a.biteT=(a.def.biteCD||1.2)*2;releaseHold(h);}}}
  }
}
// ---------- wounds ----------
// dmg lands as a share now and a share that bleeds out (o.bleed: hp still to lose), kind 'snap' (a free bite: knocked back, as before),
// 'clamp' (taken hold of), 'bite' (in the hold: a jerk), 'tear' (the player's bite on what it holds). An immortal body takes no wound
function wound(o,dmg,by,at,kind){
  const held=kind!=='snap',bl=dmg*(kind==='clamp'?0.25:0.4),imm=dmg-bl;
  if(!at)at=o.pos;
  if(o===player){const P=player;if(P.dead)return;if(P.withdrawn){if(by&&by!==player)by.bored++;return;}
    hurtPlayer(imm,held?null:(by&&by!==player?by.pos:null));if(P.dead)return;P.bleed=(P.bleed||0)+bl;P.woundL=worldToLocal(P,at,P.woundL||[0,0,0]);
    if(held&&by&&by!==player){const s=GRIP[by.hold&&by.hold.K?by.hold.kind:'jaw'].shake;P.vel.x+=rnd(-s,s);P.vel.y+=rnd(-s,s)*0.5;P.vel.z+=rnd(-s,s);}}
  else{if(!o.alive)return;if(o.def.hp>=1e8){if(by&&by!==player)by.bored++;bloodBurst(at,2,cladeOf(o));return;}
    o.hp-=imm;o.bleed=(o.bleed||0)+bl;o.woundL=worldToLocal(o,at,o.woundL||[0,0,0]);
    if(o.hp<=0){bloodBurst(at,10+dmg*0.6,cladeOf(o));kill(o,by);return;}}
  bloodBurst(at,4+dmg*0.4,cladeOf(o));
  if(o!==player)thump(clamp(0.15+dmg*0.01,0.15,0.5),110,45,at,0.9,0.05);
}
// bleeding, once a frame: a wound loses hp for the seconds after and closes; the wounded leave a trickle in the water
function updateWounds(dt){
  const P=player;
  const drain=(o)=>{const b=o.bleed;if(!(b>0))return false;const loss=Math.min(b,(0.4+0.12*b)*dt);o.bleed=Math.max(0,b-loss-0.25*dt);
    if(o===P){P.hp-=loss;P.lastHurt=t;if(P.hp<=0&&!P.dead)die();}else{o.hp-=loss;if(o.hp<=0&&o.alive){kill(o,null);return false;}}
    o.bleedT=(o.bleedT||0)-dt;if(o.bleedT<=0&&o.g.visible!==false){o.bleedT=Math.max(0.08,1.2/(1+b));const w=localToWorld(o,o.woundL||[0,0,0],HP1);bloodBurst(w,1,cladeOf(o),0.15);}
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
  if(tg.def.edible&&massOf(tg)<=WHOLE_P*P.mass){P.grabCD=0.3;return;} // small enough to eat: the bite does that
  startHold(P,tg);if(P.b.rigs)P.grab=tg;
}
// the nearest live body (or carcass, if `dead`) within reach and ahead: the bite's rule
function playerTarget(dead){const P=player;T3.set(0,0,1).applyQuaternion(P.g.quaternion);let best=null,bd=1e9;
  const look=(c)=>{T1.copy(c.pos).sub(P.pos);const dd=T1.length(),reach=2.2+c.def.size*0.45;if(dd>reach)return;if(dd>1.2&&T1.dot(T3)/dd<0.2)return;if(dd<bd){bd=dd;best=c;}};
  for(const c of creatures){if(c.alive)look(c);}
  if(dead&&!best)for(const c of carcasses){if(!c.gone&&c.flesh>0)look(c);}
  return best;}
// the bite (click): forage is eaten whole (heals); a carcass is eaten at (heals); anything else is wounded — a tear if it is held, with
// the arms closing on it for a moment as before; a bite on what holds you loosens its grip
function playerBite(){
  const P=player;if(mode!=='play'||P.dead||P.withdrawn||P.biteCD>0)return;P.biteCD=0.5;thump(0.35,120,50,null,1.6,0.03);P.pulse=Math.max(P.pulse,0.6);
  const best=P.hold?P.hold.b:playerTarget(true);if(!best)return;const d=best.def;T3.set(0,0,1).applyQuaternion(P.g.quaternion);
  if(best.dead){const m=Math.min(best.flesh,P.clade.size*0.5);best.flesh-=m;P.hp=Math.min(P.maxhp,P.hp+m*6);bloodBurst(best.pos,5,cladeOf(best),0.5);return;} // a carcass: a mouthful
  if(d.edible&&massOf(best)<=WHOLE_P*P.mass){bloodBurst(best.pos,4,cladeOf(best));kill(best,player,true);P.hp=Math.min(P.maxhp,P.hp+d.food);return;} // eaten whole (v11.26: no respawn; the ledger is debited)
  if(P.b.rigs&&!P.hold){P.grab=best;P.grabT=0.6;} // the arms close on what you bite
  const held=P.hold&&P.hold.b===best,at=held&&P.hold.near?P.hold.at:T1.copy(best.pos).sub(P.pos).multiplyScalar(0.5).add(P.pos);
  wound(best,P.clade.bite*(held?1.5:1),player,at,held?'tear':'snap');
  if(!best.alive)return;
  if(!held)best.vel.addScaledVector(T3,4);
  if(best.hold&&best.hold.b===P)best.hold.pull+=0.35; // it has you: a bite is a reason to let go
  if((d.role==='hunter'||d.role==='ambush')&&best.hp<d.hp*0.35&&best.state!=='flee'){best.state='flee';best.fleeT=9;best.target=null;}
}
