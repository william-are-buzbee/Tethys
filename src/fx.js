// fx.js — the body's effects (v11.53, POLISH.md pass B): one pooled point system for what the water does when a body does something —
// silt kicked off the floor, bubbles from the seeps, scraps at a bite — and the emitters that feed it. The blood (combat.js) stays its own
// cloud in the clade's colour; the breach's foam and its bubble puff stay in player.js splash (v11.46). Everything here is a term in the
// numbers the game already has: a body on the floor, a jet near the sand, a strike out of it, a bite, a seep. Nothing glows. The points are
// the snow's kind (atmosphere.js pm: squares, lit like the snow and by the player's light, alpha by distance), one draw for all of it.
const FX_N=Q.tier==='low'?320:720,fxP=new Float32Array(FX_N*3),fxV=new Float32Array(FX_N*3),fxC=new Float32Array(FX_N*3),fxS=new Float32Array(FX_N*2),fxL=new Float32Array(FX_N),fxA=new Float32Array(FX_N),fxK=new Uint8Array(FX_N),fxW=new Float32Array(FX_N);let fxNext=0,fxLive=0;
const FXK=[{life:[3,4.5],fall:0.15,size:[0.7,1.3],grow:0.25,alpha:0.7},{life:[6,9],fall:-0.9,size:[0.35,0.6],grow:0.06,alpha:0.6},{life:[2.5,3.5],fall:0.3,size:[0.5,0.9],grow:0,alpha:0.85}]; // life (s), fall (m/s; bubbles rise), size × the material's, growth (size/s), alpha
const fxG=new THREE.BufferGeometry();fxG.setAttribute('position',new THREE.BufferAttribute(fxP,3));fxG.setAttribute('color',new THREE.BufferAttribute(fxC,3));fxG.setAttribute('aSz',new THREE.BufferAttribute(fxS,2));
const fxM=new THREE.PointsMaterial({color:0xcfe6ee,size:0.24,transparent:true,opacity:0.8,depthWrite:false,vertexColors:true});
fxM.onBeforeCompile=function(sh){sh.uniforms.uPL=plU;sh.uniforms.uPLc=plCU;let n=0; // the snow's patch (atmosphere.js pm): a size and an alpha per point, the player's light
  sh.vertexShader=sh.vertexShader.replace('uniform float size;',()=>{n++;return 'attribute vec2 aSz;uniform vec4 uPL;varying float vA;varying float vL;uniform float size;';})
    .replace('gl_PointSize = size;',()=>{n++;return 'gl_PointSize=size*aSz.x;vA=aSz.y*smoothstep(0.4,1.5,-mvPosition.z);{vec3 dl=transformed-uPL.xyz;vL=uPL.w/(0.5+dot(dl,dl));}';})
    .replace('#include <logdepthbuf_vertex>',()=>{n++;return 'gl_PointSize=min(gl_PointSize,36.0);\n#include <logdepthbuf_vertex>';});
  sh.fragmentShader=sh.fragmentShader.replace('uniform vec3 diffuse;',()=>{n++;return 'varying float vA;varying float vL;uniform vec3 uPLc;uniform vec3 diffuse;';})
    .replace('#include <color_fragment>',()=>{n++;return 'diffuseColor.rgb=vColor*(diffuse+uPLc*vL);diffuseColor.a*=vA;';});
  if(n!==5)console.warn('fx: points chunks not as expected ('+n+' of 5); the debris draws uniform');};
fxM.customProgramCacheKey=function(){return 'fxpts';};
const fxPts=new THREE.Points(fxG,fxM);fxPts.frustumCulled=false;fxPts.visible=false;scene.add(fxPts);
for(let i=0;i<FX_N;i++){fxS[i*2+1]=0;fxP[i*3+1]=-1e4;}
// n points of a kind at p, thrown at up to sp m/s, in a colour (an [r,g,b]); a point is never emitted in the air or under the floor
function fxEmit(kind,x,y,z,n,sp,col){if(!FX.debris)return;if(y>waveH(x,z)-0.1)return;const K=FXK[kind];n=Math.min(FX_N,Math.round(n));
  for(let k=0;k<n;k++){const i=fxNext;fxNext=(fxNext+1)%FX_N;const i3=i*3;
    fxP[i3]=x+rnd(-0.25,0.25);fxP[i3+1]=y+rnd(-0.15,0.15);fxP[i3+2]=z+rnd(-0.25,0.25);
    fxV[i3]=rnd(-1,1)*sp;fxV[i3+1]=rnd(-0.3,1)*sp*0.6;fxV[i3+2]=rnd(-1,1)*sp;
    const j=rnd(0.8,1.15);fxC[i3]=col[0]*j;fxC[i3+1]=col[1]*j;fxC[i3+2]=col[2]*j;
    fxL[i]=rnd(K.life[0],K.life[1]);fxA[i]=fxL[i];fxS[i*2]=rnd(K.size[0],K.size[1]);fxS[i*2+1]=K.alpha;fxK[i]=kind;fxW[i]=rnd(0,TAU);}
  fxLive=FX_N;fxPts.visible=true;}
// silt in the floor's own colour at a point (terrainColor, chunks.js, through sample()): sand, mud, rust, whatever the ground is there
const FX_TC={c:[0,0,0],setXYZ(i,r,g,b){this.c[0]=r;this.c[1]=g;this.c[2]=b;}},FX_S={};
function fxSilt(x,y,z,n,sp){const s=sample(x,z,FX_S);terrainColor(x,z,s.h,fixF(s.f,0),0,FX_TC,0);const c=FX_TC.c;fxEmit(0,x,Math.max(y,s.h+0.15),z,n,sp===undefined?0.6:sp,[c[0]*1.15+0.05,c[1]*1.15+0.05,c[2]*1.1+0.05]);}
function fxBubbles(x,y,z,n){fxEmit(1,x,y,z,n,0.08,[0.86,0.93,0.95]);}
const FX_BODY=[0.5,0.5,0.5];
function bodyColor(o,out){ // a random vertex colour off the body's first coloured mesh: the prey's own flesh, whatever the coat
  let m=null;o.g.traverse(q=>{if(!m&&q.isMesh&&q.geometry&&q.geometry.attributes.color)m=q;});if(!m)return out;const a=m.geometry.attributes.color.array,k=Math.floor(Math.random()*(a.length/3))*3;out[0]=a[k];out[1]=a[k+1];out[2]=a[k+2];return out;}
function fxScraps(o,at,n){if(!o||!o.g)return;const c=bodyColor(o,FX_BODY);fxEmit(2,at.x,at.y,at.z,n,1.4,[c[0]*0.9,c[1]*0.9,c[2]*0.9]);}
// the emitters that run on their own clock: a body moving on the floor (the player's flop and walk, the crawlers, anything grounded and
// going), a jet fired within reach of the sand, a trap striking out of it, the seeps' bubbles (chunks.js keeps a cell's seep tops)
const FX_R=70,FX_SEEP_R=110; // the radius round the camera the emitters watch; the seeps'
function updateFXEmit(dt){
  if(!FX.debris)return;const P=player,cam=camera.position;
  if(mode==='play'&&!P.dead&&P.g){const sub=P.sub||0;
    if(P.grounded&&sub>0.5){const spd=P.spd||0;P.fxAcc=(P.fxAcc||0)+spd*3.5*dt;if(spd>0.6&&P.fxAcc>=1){const n=Math.floor(P.fxAcc);P.fxAcc-=n;fxSilt(P.pos.x,P.pos.y-0.9,P.pos.z,n,0.3+spd*0.08);}}
    if(P.flopT>0.65&&!P.fxFlop){P.fxFlop=true;if(sub>0.5)fxSilt(P.pos.x,P.pos.y-0.9,P.pos.z,14,0.9);}else if(P.flopT<=0)P.fxFlop=false;
    if(P.jetT>0.45&&!P.fxJet){P.fxJet=true;const gh=P.pos.y-groundAt(P.pos.x,P.pos.z);if(gh<2.6+P.clade.size*0.3){T4.set(0,0,-1).applyQuaternion(P.g.quaternion);fxSilt(P.pos.x+T4.x*1.5,P.pos.y-gh*0.6,P.pos.z+T4.z*1.5,10,1.1);}}else if(P.jetT<0.4)P.fxJet=false;}
  for(const c of creatures){if(!c.alive||!c.g.visible)continue;const dx=c.pos.x-cam.x,dz=c.pos.z-cam.z;if(dx*dx+dz*dz>FX_R*FX_R)continue;const d=c.def;
    if(c.grounded&&c.carried===false){const spd=c.vel.length();c.fxAcc=(c.fxAcc||0)+spd*2.5*dt*Math.min(2,0.6+d.size*0.25);if(spd>0.4&&c.fxAcc>=1){const n=Math.floor(c.fxAcc);c.fxAcc-=n;fxSilt(c.pos.x,c.pos.y-d.size*0.3,c.pos.z,n,0.25+spd*0.08);}}
    if(d.role==='trap'){if(c.st.strike&&!c.fxStruck){c.fxStruck=true;fxSilt(c.pos.x,c.pos.y-d.size*0.2,c.pos.z,8+d.size*2,0.8);}else if(!c.st.strike)c.fxStruck=false;}}
  for(const ch of chunks.values()){if(!ch.seeps||!ch.seeps.length)continue;const dx=ch.cx-cam.x,dz=ch.cz-cam.z;if(dx*dx+dz*dz>(FX_SEEP_R+CELL)*(FX_SEEP_R+CELL))continue; // the cell within reach, then each seep on its own
    for(const s of ch.seeps){const ex=s.x-cam.x,ez=s.z-cam.z;if(ex*ex+ez*ez>FX_SEEP_R*FX_SEEP_R)continue;s.t=(s.t||0)-dt;if(s.t<=0){s.t=rnd(0.35,0.8);fxBubbles(s.x,s.y,s.z,1);}}}
}
function updateDebris(dt){
  updateFXEmit(dt);
  if(!fxLive){fxPts.visible=false;return;}
  fxM.color.copy(pm.color); // the light on the snow is the light on the debris
  let live=0;const kf=1-Math.exp(-3*dt),ks=Math.exp(-1.2*dt);
  for(let i=0;i<FX_N;i++){if(fxS[i*2+1]<=0)continue;const i3=i*3;fxA[i]-=dt;if(fxA[i]<=0){fxS[i*2+1]=0;fxP[i3+1]=-1e4;continue;}
    live++;const k=fxK[i],K=FXK[k],x=fxP[i3],y=fxP[i3+1],z=fxP[i3+2];flowAt(x,y,z,HV);
    const wob=k===1?Math.sin(fxA[i]*5+fxW[i])*0.12:0;
    fxV[i3]=(fxV[i3]+(HV.x+CURV.x+wob-fxV[i3])*kf)*ks;fxV[i3+1]=(fxV[i3+1]+(HV.y+CURV.y-K.fall-fxV[i3+1])*kf)*ks;fxV[i3+2]=(fxV[i3+2]+(HV.z+CURV.z-wob*0.7-fxV[i3+2])*kf)*ks;
    let ny=y+fxV[i3+1]*dt;
    if(k===1&&ny>=waveH(x,z)-0.06){fxS[i*2+1]=0;fxP[i3+1]=-1e4;continue;} // a bubble ends at the water
    if(k===0){const g=groundAt(x,z)+0.05;if(ny<g){ny=g;fxV[i3+1]=0;}} // silt settles on the floor
    fxP[i3]=x+fxV[i3]*dt;fxP[i3+1]=ny;fxP[i3+2]=z+fxV[i3+2]*dt;
    const f=fxA[i]/fxL[i];fxS[i*2]+=dt*K.grow;fxS[i*2+1]=K.alpha*Math.min(1,f*3)*(k===2?0.7+0.3*Math.sin(fxA[i]*18+fxW[i]):1);} // a scrap tumbles: its size flickers
  fxLive=live;fxG.attributes.position.needsUpdate=true;fxG.attributes.aSz.needsUpdate=true;fxG.attributes.color.needsUpdate=true;
}
function fxStats(){let n=0,nan=0,k=[0,0,0];for(let i=0;i<FX_N;i++){if(fxS[i*2+1]<=0)continue;n++;k[fxK[i]]++;const i3=i*3;if(!isFinite(fxP[i3]+fxP[i3+1]+fxP[i3+2]+fxV[i3]+fxV[i3+1]+fxV[i3+2]))nan++;}return {live:n,nan:nan,silt:k[0],bubbles:k[1],scraps:k[2]};} // the tests
// ---------- the flush (POLISH 24): a flinch of pallor on a bitten body for FLUSH_T, off by default (the person, 9 Sep: faint, easy to strike) ----------
const FLUSH_T=0.15,flushes=[];
function flushBody(o){if(!FX.flush||!o||!o.g)return;for(const f of flushes)if(f.o===o){f.t=FLUSH_T;return;}const ms=[];o.g.traverse(m=>{if(m.isMesh&&m.material!==MAT_HIT&&(m.material===MAT||m.material===MATBIG)){ms.push([m,m.material]);m.material=MAT_HIT;}});if(ms.length)flushes.push({o:o,ms:ms,t:FLUSH_T});}
function updateFlush(dt){for(let i=flushes.length-1;i>=0;i--){const f=flushes[i];f.t-=dt;if(f.t<=0){for(const [m,m0] of f.ms)if(m.material===MAT_HIT)m.material=m0;flushes.splice(i,1);}}}
// ---------- the secondary motion (POLISH 19–21): squash and stretch, banking, the stun shown ----------
// After the body's own anim: the frame (the hull and everything on it) scaled along +z by 1+s and across by 1−s/2, s from the acceleration
// (a jetter lengthens on the squeeze, a striker into the lunge, a braking fish bulges) and the strike or the player's bite; rolled about +z
// into a turn by the yaw rate and the speed (a fish leans in) and, stunned, listed to one side while it sinks (creatures_ai.js: the stun's
// drift). A rigged body (arms, tails) rolls less (bankRig) and its chains' rest positions turn with it, below. worldShapes reads g's scale,
// never the frame's, so contact is untouched. Runs after the anim and before stepRigs, so the rest it turns is this frame's.
const POSE_K={sq:0.02,sqMax:0.14,strike:0.12,snap:0.15,bank:0.09,bankMax:0.6,bankRig:0.35,stunRoll:1.0,jerk:2.0}; // s per m/s² of acceleration and its cap; the strike's and the bite's stretch; roll per (rad/s × m/s) and its cap; the stun's list; the flinch's spin
function bodyPose(o,dt,yaw){
  const b=o.b;if(!b||!b.frame||!(dt>1e-4))return;const spd=o.spd!==undefined?o.spd:o.vel.length(),acc=(spd-(o.lastSpd||0))/dt;o.lastSpd=spd;
  let dy=o.lastYaw===undefined?0:yaw-o.lastYaw;o.lastYaw=yaw;if(dy>Math.PI)dy-=TAU;else if(dy<-Math.PI)dy+=TAU;const rate=clamp(dy/dt,-6,6);
  const strike=(o.st&&o.st.strike)||(o===player&&o.hold)?1:0;
  const sqT=clamp(acc*POSE_K.sq,-0.1,POSE_K.sqMax)+strike*POSE_K.strike+(o.snapT>0?POSE_K.snap:0);
  o.sq=(o.sq||0)+(sqT-(o.sq||0))*(1-Math.exp(-9*dt));
  const rigged=!!(b.rigs&&b.rigs.length),cap=rigged?POSE_K.bankRig:POSE_K.bankMax;let rollT=clamp(-POSE_K.bank*rate*spd,-cap,cap)+(o.rollBias||0); // rollBias (v11.78): a walker's lean into the side slope (player.js)
  if(o.stun>0)rollT=POSE_K.stunRoll*(o.stunSide||1)*(rigged?0.5:1);
  o.rollV=(o.rollV||0)*Math.exp(-3*dt);o.roll=(o.roll||0)+(rollT-(o.roll||0))*(1-Math.exp(-4*dt))+o.rollV*dt;
  const s=o.sq;b.frame.scale.set(1-s*0.5,1-s*0.5,1+s);b.frame.rotation.z=o.roll;
  // a rigged body: its chains' rest positions (rewritten by the anim each frame, then turned by the frame's yaw for the rigs that ride it — creatures_spec.js
  // compile) turned by the roll too, so the arms and the tail lean with the hull and their skins (world chains, physics.js rigSkin) meet the rolled body
  if(rigged&&o.roll!==0){const cs=Math.cos(o.roll),sn=Math.sin(o.roll);for(const rig of b.rigs){if(!rig.ride)continue;for(const c of rig.chains){const R=c.restL;for(let k=0;k<=c.n;k++){const x=R[k*3],y=R[k*3+1];R[k*3]=x*cs-y*sn;R[k*3+1]=x*sn+y*cs;}}}}
}
// ---------- at a wound (combat.js wound): the flinch (23), the flush (24), the debris (26) ----------
function hitFx(o,by,at,dmg){
  if(!o||!at||!o.g)return;const from=by&&by.pos?by.pos:null;T4.copy(at);if(from)T4.sub(from);else T4.set(rnd(-1,1),rnd(-0.3,0.3),rnd(-1,1));if(T4.lengthSq()<1e-4)T4.set(0,0,1);T4.normalize();
  const k=clamp(0.25+dmg*0.02,0.25,0.8); // the flinch: the chain points shoved along the bite, the tips most — the constraint pass does the rest (physics.js simChain)
  if(o.b&&o.b.rigs)for(const rig of o.b.rigs)for(const c of rig.chains){const Pp=c.pts,n=c.n;for(let i=1;i<=n;i++){const w=k*i/n;Pp[i*3]+=T4.x*w;Pp[i*3+1]+=T4.y*w;Pp[i*3+2]+=T4.z*w;}}
  o.rollV=(o.rollV||0)+rnd(-1,1)*POSE_K.jerk*clamp(dmg*0.06,0.3,1); // the spin, damped over a second (bodyPose)
  flushBody(o);
  if(at.y-groundAt(at.x,at.z)<2.2)fxSilt(at.x,at.y,at.z,8,0.6);fxScraps(o,at,6+Math.min(10,dmg*0.3));
}
