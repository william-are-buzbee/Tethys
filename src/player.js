// player.js — the three playable clades, movement in water / air / on land, camera, bite, abilities, damage and death
// legs:true on a clade (none yet) would make it walk on the strand (landSpeed, jump) instead of flopping.
// size: the body's half-length in world units (disturbance radius, flow radius); mass: for contact with creatures (size³ for them).
const CLADES=[
  {id:'soft',build:()=>compile(SPECS.soft),speed:7.0,jet:true,jetImp:10,accel:3.2,hp:80,bite:9,cam:6.5,turn:7,size:1.6,mass:5},
  {id:'fin',build:()=>compile(SPECS.fin),speed:8.8,sprint:1.75,accel:2.6,hp:120,bite:26,cam:7.5,turn:4.5,size:1.8,mass:7},
  {id:'coil',build:()=>compile(SPECS.coil),speed:4.6,jet:true,jetImp:7,accel:1.5,hp:100,bite:6,cam:6.5,turn:3,size:1.5,mass:8}
];
let floor0=-1e9;for(let a=0;a<TAU;a+=0.3)for(let r=0;r<=16;r+=4)floor0=Math.max(floor0,sample(Math.cos(a)*r,Math.sin(a)*r).h);
const dispY=floor0+4.5,spawnPos=V3(0,floor0+3,0);
const player={clade:null,pos:V3(0,dispY,0),vel:V3(0,0,0),yaw:0,pitch:0,hp:100,maxhp:100,g:null,b:null,anim:null,inkT:0,withdrawn:false,cd:0,jetT:0,hurtT:0,lastHurt:-100,dead:true,pulse:0,spd:0,biteCD:0,sub:1,wet:true,grounded:false,flopT:0,camAbove:false,camFlipT:0,fp:false,
  mass:6,bound:0,reach:0,shapesW:null,chainW:null,grab:null,grabT:0,heldT:0,heldK:1,holding:0,hold:null,held:0,grabKey:false,grabCD:0,bleed:0,woundL:null,cWith:null,onPad:null,def:{size:1.6},hitRk:0,hitFl:0,landV:0,wasGrounded:false}; // hitRk/hitFl: this frame's push was against rock / a plant; landV: the speed of the last landing on the floor (audio.js consumes both) // def.size: creatures read it when the player is their target
const keys={};let locked=false,drag=null,touchL=null,touchAbility=false;
const JET_W=0.18; // s of thrust per 0.5 s jet cycle
const CAM_CLEAR=0.35,CAM_DWELL=0.5;
// First person (v11.18, the person's ask): f toggles it in play. The camera sits a little ahead of the nose (the spec's frame gives it,
// or the clade's size) looking along the view; the body wears the ghost material (scene.js MATGHOST: it draws nothing, but it is still
// there for the shadow map — v11.23, so your own shadow is under you in first person; before, the body was hidden and three's depth
// pass skips a hidden object) and its wake and arms still act on the world.
const FP_AHEAD=0.35;
function toggleFP(){const P=player;P.fp=!P.fp;if(P.g)ghostBody(P.g,P.fp);hintEl.textContent=P.fp?'first person':'third person';hintEl.style.opacity=1;setTimeout(()=>{hintEl.style.opacity=0;},1500);} // the camera's clearance from the water on its side (> the near plane), and the least time between its side changing

function hurtPlayer(dmg,from){
  const P=player;if(P.dead||mode!=='play')return;if(P.withdrawn)return;
  P.hp-=dmg;P.hurtT=0.7;P.lastHurt=t;hurtEl.style.opacity=1;setTimeout(()=>{hurtEl.style.opacity=0;},240);thump(0.6,80,30,from,0.5,0.1);
  if(from){T4.copy(P.pos).sub(from).normalize();P.vel.addScaledVector(T4,7);}
  if(P.hp<=0)die();
}
function die(){
  const P=player;if(P.dead)return;P.dead=true;P.hp=0;P.bleed=0;releaseAll(P);fadeEl.style.opacity=1;
  setTimeout(()=>{P.pos.copy(spawnPos);P.vel.set(0,0,0);P.hp=P.maxhp;P.inkT=0;P.bleed=0;P.hold=null;P.held=0;P.camAbove=false;P.camFlipT=0;snapMed=true;P.wet=true;P.sub=1;for(const c of creatures){if(c.target===player)dropTarget(c);}camera.position.copy(P.pos).add(V3(0,2,8));setTimeout(()=>{fadeEl.style.opacity=0;P.dead=false;},500);},2800);
}
function bite(){playerBite();} // v11.31: combat.js — a gulp, a mouthful of a carcass, or a wound (a tear on what you hold)
function ability(){
  const P=player,C=P.clade;if(mode!=='play'||P.dead||!C||P.cd>0)return;
  if(C.id==='soft'){spawnInk(P.pos);P.inkT=6;P.cd=12;for(const c of creatures){if(c.target===player)dropTarget(c,6);}} // v11.31.1: dropTarget lets go of the arms too, not only the target
  else if(C.id==='fin'){let hit=false;for(const c of creatures){if(!c.alive)continue;const r=c.def.role;if(!(r==='hunter'||r==='ambush'||r==='coil'))continue;if(c.pos.distanceTo(P.pos)<6+c.def.size*0.3){c.stun=2.5;T1.copy(c.pos).sub(P.pos).normalize();c.vel.addScaledVector(T1,9);dropTarget(c,5);hit=true;}}P.cd=hit?9:1.5;P.pulse=1;thump(0.7,60,25,null,0.25,0.12);}
}
// ink clouds (soft-arm ability)
const inks=[],INKG=new THREE.SphereGeometry(1,7,5);
function spawnInk(pos){const m=new THREE.MeshLambertMaterial({color:0x06080a,transparent:true,opacity:0.9});const gr=new THREE.Group();for(let i=0;i<9;i++){const s=new THREE.Mesh(INKG,m);s.position.set(rnd(-1,1),rnd(-1,1),rnd(-1,1));s.userData.r=rnd(0.6,1.3);gr.add(s);}gr.position.copy(pos);scene.add(gr);inks.push({g:gr,m:m,t:0});}
function updateInks(dt){for(let i=inks.length-1;i>=0;i--){const k=inks[i];k.t+=dt;const f=k.t/7;for(const s of k.g.children){s.scale.setScalar(s.userData.r*(0.5+2.5*Math.min(1,k.t/2.5)));s.position.y+=0.05*dt;}k.m.opacity=0.9*(1-smooth(0.5,1,f));if(f>=1){scene.remove(k.g);k.m.dispose();inks.splice(i,1);}}}
// splashes: a burst of white points thrown up where something crosses the surface at speed
const splashes=[];
function splash(pos,v){
  const n=28,arr=new Float32Array(n*3),vel=new Float32Array(n*3),y0=waveH(pos.x,pos.z);
  for(let i=0;i<n;i++){arr[i*3]=pos.x+rnd(-0.6,0.6);arr[i*3+1]=y0;arr[i*3+2]=pos.z+rnd(-0.6,0.6);vel[i*3]=rnd(-1,1)*v*0.35;vel[i*3+1]=rnd(0.4,1)*v*0.55;vel[i*3+2]=rnd(-1,1)*v*0.35;}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(arr,3));
  const pts=new THREE.Points(g,new THREE.PointsMaterial({color:0xe8f4f8,size:0.22,transparent:true,opacity:0.9,depthWrite:false}));pts.frustumCulled=false;pts.renderOrder=2;scene.add(pts); // over the surface: the spray is thrown above it
  splashes.push({g:g,pts:pts,vel:vel,t:0,n:n});
}
function updateSplashes(dt){
  for(let i=splashes.length-1;i>=0;i--){const s=splashes[i];s.t+=dt;const a=s.g.attributes.position.array;
    for(let k=0;k<s.n;k++){s.vel[k*3+1]-=GRAV*dt;a[k*3]+=s.vel[k*3]*dt;a[k*3+1]+=s.vel[k*3+1]*dt;a[k*3+2]+=s.vel[k*3+2]*dt;}
    s.g.attributes.position.needsUpdate=true;s.pts.material.opacity=0.9*(1-s.t/1.1);
    if(s.t>1.1){scene.remove(s.pts);s.g.dispose();s.pts.material.dispose();splashes.splice(i,1);}}
}
function updatePlayer(dt){
  const P=player,C=P.clade;
  P.cd=Math.max(0,P.cd-dt);P.biteCD=Math.max(0,P.biteCD-dt);P.inkT=Math.max(0,P.inkT-dt);P.hurtT=Math.max(0,P.hurtT-dt);
  const cp=Math.cos(P.pitch),sp=Math.sin(P.pitch),cy=Math.cos(P.yaw),sy=Math.sin(P.yaw);
  const fwd=T3.set(-sy*cp,sp,-cy*cp),right=T4.set(cy,0,-sy);
  let mx=0,mz=0,my=0,sprint=false;
  if(!P.dead){
    mx=(keys.KeyD?1:0)-(keys.KeyA?1:0);mz=(keys.KeyW?1:0)-(keys.KeyS?1:0);my=(keys.Space?1:0)-(keys.KeyC?1:0);
    if(touchL){mx+=touchL.mx;mz+=touchL.mz;if(touchL.sprint)sprint=true;}
    if(keys.ShiftLeft||keys.ShiftRight)sprint=true;
    P.withdrawn=C.id==='coil'&&(!!keys.KeyQ||touchAbility);
    if(P.withdrawn)sprint=false;
    P.sprint=sprint;
    if(P.hp<P.maxhp&&t-P.lastHurt>8)P.hp=Math.min(P.maxhp,P.hp+1.2*dt);
  }else{P.withdrawn=false;P.sprint=false;}
  const move=T1.set(0,0,0).addScaledVector(fwd,mz).addScaledVector(right,mx);move.y+=my*0.8;if(move.lengthSq()>1)move.normalize();
  const moving=move.lengthSq()>0.001;
  let spd=C.speed;if(C.sprint&&sprint)spd*=C.sprint;
  P.heldT=Math.max(0,P.heldT-dt);if(P.heldT>0)spd*=0.8; // brushed by something's arms
  spd*=P.heldK||1; // held (combat.js updateHolds sets it): in jaws or claws you thrash, in arms you barely swim
  P.grabT=Math.max(0,P.grabT-dt);if(P.grabT<=0||(P.grab&&!P.grab.alive))P.grab=null;
  if(P.withdrawn)move.set(0,0,0);
  // The medium. sub is how much of the body is under the local water level: 1 swimming, 0 in the air or on the strand.
  // Thrust and water drag scale with it; gravity with what is left. Nothing stops you leaving the water except gravity.
  const wl=waveH(P.pos.x,P.pos.z),R=0.9,sub=clamp((wl-(P.pos.y-R))/(2*R),0,1);P.sub=sub;
  T2.copy(move).multiplyScalar(spd);
  if(sub>=0.999)P.vel.lerp(T2,1-Math.exp(-C.accel*dt));
  else{
    P.vel.lerp(T2,1-Math.exp(-C.accel*sub*dt));P.vel.y-=GRAV*(1-sub)*dt;P.vel.multiplyScalar(1-0.12*(1-sub)*dt);
    if(P.grounded&&sub<0.5&&!P.dead){
      if(C.legs){ // walking: the hook for a legged clade
        const ls=C.landSpeed||4,L=Math.hypot(move.x,move.z)||1,k=1-Math.exp(-8*dt);
        P.vel.x=lerp(P.vel.x,move.x/L*Math.min(L,1)*ls,k);P.vel.z=lerp(P.vel.z,move.z/L*Math.min(L,1)*ls,k);
        if(my>0&&P.vel.y<=0.1)P.vel.y=C.jump||5;
      }else{ // a fish out of water: it lies where it lands, and flops when you push
        P.vel.x*=Math.exp(-6*dt);P.vel.z*=Math.exp(-6*dt);P.flopT-=dt;
        if(moving&&P.flopT<=0&&!P.withdrawn){P.flopT=0.7;const L=Math.hypot(move.x,move.z);if(L>0.01){P.vel.x+=move.x/L*4.2;P.vel.z+=move.z/L*4.2;}P.vel.y=4.8;P.pulse=1;thump(0.25,150,60,null,0.8,0.06);}
      }
    }
  }
  // the jet: every 0.5 s a squeeze, its impulse (jetImp) delivered as a thrust over the first JET_W of the cycle — the same
  // push, but a velocity that ramps over ten frames rather than jumps, so the body and the arms behind it aren't whipped
  if(C.jet&&sprint&&!P.withdrawn&&!P.dead&&sub>0.3){P.jetT-=dt;if(P.jetT<=0){P.jetT=0.5;P.pulse=1;}
    const w=P.jetT-(0.5-JET_W);if(w>-dt){const f=Math.min(dt,w+dt)/JET_W;P.vel.addScaledVector(moving?move:fwd,C.jetImp*sub*f);}}
  else P.jetT=Math.min(P.jetT,0.1);
  if(P.withdrawn){P.vel.y-=0.6*dt;P.vel.multiplyScalar(1-1.5*dt);}
  const vmax=C.speed*(C.sprint||1)*1.7;
  if(sub>=0.5){if(P.vel.length()>vmax)P.vel.setLength(vmax);}
  else{const hv=Math.hypot(P.vel.x,P.vel.z);if(hv>vmax){P.vel.x*=vmax/hv;P.vel.z*=vmax/hv;}if(P.vel.y<-30)P.vel.y=-30;}
  P.pos.addScaledVector(P.vel,dt);
  if(sub>0){currentAt(P.pos.x,P.pos.z,P.pos.y,CURV);P.pos.addScaledVector(CURV,dt*sub);} // carried by the current (chunks.js)
  contactK=0;const pad=bodyPush(P.pos,P.vel,P.g.quaternion,C.size*0.7,0.9,0.5);P.hitFl=contactK&1;P.hitRk=contactK&2; // rock and pads first (centre, nose and tail), then the floor has the last word
  // floor: gentle slopes clamp you up, steep walls push you back
  let fh=groundAt(P.pos.x,P.pos.z)+1.1;P.grounded=false;const vy0=P.vel.y;
  if(P.pos.y<fh){
    const gx=(groundAt(P.pos.x+1,P.pos.z)-groundAt(P.pos.x-1,P.pos.z))*0.5,gz=(groundAt(P.pos.x,P.pos.z+1)-groundAt(P.pos.x,P.pos.z-1))*0.5,gl=Math.hypot(gx,gz);
    if(gl>1.2){const pen=fh-P.pos.y,k=pen/(gl*gl);P.pos.x-=gx*k;P.pos.z-=gz*k;const vn=(P.vel.x*gx+P.vel.z*gz)/gl;if(vn>0){P.vel.x-=gx/gl*vn;P.vel.z-=gz/gl*vn;}fh=groundAt(P.pos.x,P.pos.z)+1.1;if(P.pos.y<fh){P.pos.y=fh;P.grounded=true;}}
    else{P.pos.y=fh;if(P.vel.y<0)P.vel.y*=-0.2;P.grounded=true;}
  }
  if(P.grounded&&!P.wasGrounded&&vy0<0)P.landV=-vy0;P.wasGrounded=P.grounded; // the landing's speed, for its thud (audio.js)
  // on a lily pad: it takes your weight (dips more the smaller it is) and you are ashore on it
  P.onPad=pad;if(pad){P.grounded=true;loadPad(pad,clamp(0.6/pad.r,0.03,0.45));}
  // crossing the surface at speed throws spray
  const wet=sub>0.5;if(wet!==P.wet){P.wet=wet;const v=Math.abs(P.vel.y)+P.spd*0.3;if(v>2.5&&!P.dead){splash(P.pos,v);thump(clamp(v/14,0.15,0.6),260,40,null,2.5,0.3);}} // the spray's hiss over the slap
  P.pos.x=clamp(P.pos.x,-HALF+25,HALF-25);P.pos.z=clamp(P.pos.z,-HALF+25,HALF-25);
  if((moving||(sub<0.5&&P.spd>1.5))&&!P.withdrawn&&!P.dead){ // in the air the body follows its arc
    const useVel=P.vel.length()>0.8&&(P.vel.dot(fwd)>-0.1||sub<0.5);
    T2.copy(useVel?P.vel:fwd).normalize();T2.add(P.pos);
    _m.lookAt(T2,P.pos,UP);_q.setFromRotationMatrix(_m);P.g.quaternion.slerp(_q,1-Math.exp(-C.turn*dt));
  }
  P.g.position.copy(P.pos);P.g.updateMatrix();worldShapes(P);
  playerGrab(!P.dead&&!P.withdrawn&&!!(keys.KeyR||mouseGrab||touchGrab),dt); // the grab (combat.js): held while the key is; last, with the shapes fresh (it uses the temps)
}
// After the creatures have moved and bodies have pushed apart (creatures_ai.js): the body where it ended up, the pose, the
// arms simulated against the creatures around it, then the camera.
function finishPlayer(dt,near){
  const P=player,C=P.clade;
  const cp=Math.cos(P.pitch),sp=Math.sin(P.pitch),cy=Math.cos(P.yaw),sy=Math.sin(P.yaw);
  const fwd=T3.set(-sy*cp,sp,-cy*cp);
  P.g.position.copy(P.pos);P.spd=P.vel.length();
  P.anim(t,P.spd,{jet:P.sprint&&C.jet,withdrawn:P.withdrawn,pulse:P.pulse,strike:P.hold?1:0}); // strike: the mouth stays open on what is held (the finback's ring blooms)
  stepRigs(P,near,dt);
  P.pulse=Math.max(0,P.pulse-dt*2);
  if(P.fp){const nose=(P.b&&P.b.F?P.b.F.nose*P.g.scale.x:C.size)+FP_AHEAD;T2.copy(P.pos).addScaledVector(fwd,nose);}
  else{T2.copy(P.pos).addScaledVector(fwd,-C.cam).addScaledVector(UP,1.4);
  const ch=groundAt(T2.x,T2.z)+1.0;if(T2.y<ch)T2.y=ch;}
  // the camera keeps clear of the surface, staying on its side of the water until its natural spot is well past it, and
  // never within CAM_DWELL of the last flip (a wave passing the natural spot is not a reason to change medium)
  const cw=waveH(T2.x,T2.z);P.camFlipT=Math.max(0,(P.camFlipT||0)-dt);
  if(P.camAbove){if(T2.y<cw-0.9&&P.camFlipT<=0){P.camAbove=false;P.camFlipT=CAM_DWELL;}else if(T2.y<cw+0.5)T2.y=cw+0.5;}
  else{if(T2.y>cw+0.9&&P.camFlipT<=0){P.camAbove=true;P.camFlipT=CAM_DWELL;}else if(T2.y>cw-0.5)T2.y=cw-0.5;}
  if(P.fp)camera.position.copy(T2);else{solidPush(T2,0.6,null,null,true);camera.position.lerp(T2,1-Math.exp(-8*dt));}
  // The camera itself, not only its target, stays on its side: the lerp lags the target and the chop moves under it, so the
  // camera could sit a few centimetres on the wrong side of the wave for a frame — and the medium (updateAtmosphere) is the
  // camera's, so the whole lighting flipped with it (v11.6). CAM_CLEAR is above the near plane (0.2), so the wave never cuts the view.
  if(P.hurtT>0){camera.position.x+=rnd(-1,1)*P.hurtT*0.3;camera.position.y+=rnd(-1,1)*P.hurtT*0.3;}
  const cc=waveH(camera.position.x,camera.position.z);
  if(P.camAbove){if(camera.position.y<cc+CAM_CLEAR)camera.position.y=cc+CAM_CLEAR;}
  else if(camera.position.y>cc-CAM_CLEAR)camera.position.y=cc-CAM_CLEAR;
  if(P.fp)T2.copy(camera.position).add(fwd);else T2.copy(P.pos).addScaledVector(fwd,3);camera.lookAt(T2);
  plight.position.copy(P.pos).add(V3(0,1,0));
}
