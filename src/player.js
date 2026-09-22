// player.js — the player as a spec (any species of the roster since v11.75), movement in water / air / on land, camera, bite, abilities, damage and death
// legs (derive's, off the spec) make it a walker on the ground, wet or dry (v11.78, WALK below: landSpeed, the calculator's Froude speed; the hop and the jump) instead of a swimmer that flops.
// The player is a spec (v11.68): the numbers come off the build (statsOf: derive with the spec's locks over it). v11.71: no preset carries a lock — speed,
// accel and turn are derive's for the player as for every animal (the person, 21 Sep 2026), the contact mass is every creature's rule (bodyMass: size
// cubed, floored), the bite's size the lab's rule. v11.75 (the person, 21 Sep 2026: the founder is any existing species of the chosen clade — the roster is
// the presets): the presets' hand numbers are gone. The camera's arm is the body's length (CAM_BODY), the jet's squeeze and the sprint are derive's own
// terms (DERIVE_K.jetImp, .burst), what is not physics — venom, immunity — is the founder species' DEFS row (creatures_defs.js founderDef, the seam
// LINEAGE §8.2's derived DEFS replaces), and an ability is a part's (ABILITIES below: the table stands in for the ganglion model the person described —
// a neuron cluster driving a motor cortex, a body with a long list of things it can do — CREATOR.md). CLADE_PRESETS names the three roster players and
// the kind of body a spec is (presetFor: a coiled ringmouth, another ringmouth, anything else — combat.js PLAYER_GRIP and the crusher's preyClade read
// the id). size: the spec's half-length (disturbance, flow, contact); mass: for contact with creatures (size³ for them).
const CLADE_PRESETS=[
  {id:'soft',name:'soft-arm',spec:'soft'},
  {id:'fin',name:'finback',spec:'fin'},
  {id:'coil',name:'coilshell',spec:'coil'}
];
const CAM_BODY={at:1.04,per:1.79}; // v11.75: the third-person arm, m, from the body's length (derive's, nose to tail with the parts): at + per × L — the soft-arm's hand 6.5 at 3.06 m and the finback's 7.5 at 3.62 (the coilshell's 6.5 at 2.94 lands at 6.3); a sickle at 11.4 m is framed from 21
// An ability is a part's (v11.75): each of the game's abilities tied to the part that makes it physically possible, in this order — the first that fits
// is Q, and a body with none of them has none. ink: the mantle (the ink sac is a mantle-cavity organ); stun: a tail that swings (the finback's blow);
// withdraw: a coiled soft body with a shell wide enough to pull into (the shell's aperture at least the body's radius); ram: the ram's blow (combat.js
// RAM, the world's rule for the striker); shut: the valves clamped (the hingeshells' hinge, PLANET: clamped shut when threatened — the covering reads
// shell under them, combat.js coverAt, and the body is still; not invulnerable, the edge decides). The three roster players keep exactly the one they had
const ABILITIES=[
  {id:'ink',part:'the mantle',fits:sp=>sp.core.kind==='mantle'},
  {id:'stun',part:'the tail',fits:sp=>sp.parts.some(p=>p.kind==='tail'&&p.style!=='stub')},
  {id:'withdraw',part:'the shell',fits:sp=>sp.core.kind==='coilbody'&&sp.parts.some(p=>p.kind==='shell'&&(p.style==='coil'?p.R1:p.r0)>=(sp.core.R||0))},
  {id:'ram',part:'the ram',fits:sp=>sp.parts.some(p=>p.kind==='weapon'&&p.style==='ram')},
  {id:'shut',part:'the valves',fits:sp=>sp.parts.some(p=>p.kind==='valves')}
];
const LEGS_BACK=['placed','walk','hang','march']; // v11.78: the leg styles that can step backward — jointed pairs; a paddle row (rock, swim) and the raptors' rear pairs cannot
function legsBackOf(spec){let sp;try{sp=fillSpec(spec);}catch(e){return false;}return sp.parts.some(p=>p.kind==='legs'&&LEGS_BACK.indexOf(p.style)>=0);}
function abilitiesOf(spec){let sp;try{sp=fillSpec(spec);}catch(e){return [];}return ABILITIES.filter(a=>a.fits(sp)).map(a=>a.id);} // every ability the body has, in the table's order (fillSpec: the registry's defaults where the spec is silent)
function presetFor(spec){const id=spec.clade==='ringmouths'?(spec.core&&spec.core.kind==='coilbody'?'coil':'soft'):'fin';return CLADE_PRESETS.find(p=>p.id===id);} // the kind of body a spec is: a coiled ringmouth the coilshell's, another ringmouth the soft-arm's, anything else the finback's
function playerClade(spec,pre,j){ // the player's clade object from a spec (and its preset, if it is one): what player.js, combat.js and the rest read as player.clade. j: a hatchling's scale (v11.69: ECO.juv until grown; v11.76 a hingeshell's steps at its moults), the numbers scaled as the world's juveniles' are (creatures_ai.js scaledDef)
  pre=pre||presetFor(spec);j=j||1;const st=statsOf(spec),base=SPECS[pre.spec],fd=founderDef(spec),ab=abilitiesOf(spec),sq=Math.sqrt(j);
  return {id:pre.id,name:spec===base?pre.name:(spec.id&&spec.id!==pre.spec?spec.id:pre.name),spec:spec,preset:pre,build:j===1?()=>compile(spec):()=>compile(spec,j*(spec.s||1)),juv:j<1?j:0,
    speed:st.speed*sq,accel:st.accel,turn:st.turn,mass:+(Math.max(BODY_MIN,spec.size*spec.size*spec.size)*j*j*j).toFixed(3),bite:Math.round(st.mass*3+2)*j*j,size:spec.size*j,jet:!!st.jet,legs:!!st.legs,landSpeed:st.legs?st.walk*sq:undefined, // bite for a spec without the lock: the lab's DEFS rule (specExport, dmg = mass × 3)
    sprint:st.burst>1?st.burst:undefined,jetImp:st.jet?st.jetImp*sq:undefined,buoy:st.buoyancy,mode:st.mode,canSwim:st.mode!=='walk',legsBack:legsBackOf(spec),clear:fd&&fd.clear!==undefined?fd.clear*j:spec.size*j*0.35,cam:+(CAM_BODY.at+CAM_BODY.per*st.length*j).toFixed(1),venom:fd?fd.venom:undefined,immune:!!(fd&&fd.immune),founder:founderOf(spec),abilities:ab,ability:ab[0]||null}; // v11.75: every number off the build or the founder's row; a hatchling's arm and kick with its scale
}
const CLADES=CLADE_PRESETS.map(p=>playerClade(SPECS[p.spec],p));
let floor0=-1e9;for(let a=0;a<TAU;a+=0.3)for(let r=0;r<=16;r+=4)floor0=Math.max(floor0,sample(Math.cos(a)*r,Math.sin(a)*r).h);
const dispY=floor0+4.5,spawnPos=V3(0,floor0+3,0);
const player={clade:null,pos:V3(0,dispY,0),vel:V3(0,0,0),yaw:0,pitch:0,byaw:0,bpitch:0,angV:0,g:null,b:null,anim:null,inkT:0,withdrawn:false,cd:0,jetT:0,hurtT:0,lastHurt:-100,dead:true,pulse:0,spd:0,biteCD:0,sub:1,wet:true,grounded:false,flopT:0,camAbove:false,camFlipT:0,fp:false,
  mass:6,bound:0,reach:0,shapesW:null,chainW:null,grab:null,grabT:0,heldT:0,heldK:1,holding:0,hold:null,held:0,grabKey:false,grabCD:0,bleed:0,woundL:null,paraT:0,stungT:0,sickT:0,hunger:0,starveT:0,waste:0,soft:false,shut:false,armsLost:0,regrow:null,cause:'',speedK:1,turnK:1,live:null,lost:null,cWith:null,onPad:null,def:{size:1.6},hitRk:0,hitFl:0,landV:0,wasGrounded:false}; // hitRk/hitFl: this frame's push was against rock / a plant; landV: the speed of the last landing on the floor (audio.js consumes both) // def.size: creatures read it when the player is their target
// Out of the world (v11.72.1, the person, 21 Sep 2026: "the game should teleport the player out of existence temporarily or make them invis/invuln while
// they edit"): while the editor at conception is open (line.js conceiveOpen) the body is hidden and nothing in the world can see, smell, chase, hold,
// sting or flee it — every read of the player as a thing to react to in creatures_ai.js and combat.js asks playerGone(), which death answers too.
function playerGone(){return player.dead||!!player.away;}
// The stomach (v11.73, LINEAGE §6's fuel half; DIRECTION decision 3). One rule for every animal (the person, 21 Sep 2026): player.hunger is the
// clock every hunter runs — 0 fed, 1 starving, over its kind's cycle (ecology.js ecoOf on the line kind: the finback's 0.78 game days), fed by a
// gulp or a kill by the prey's food over the kind's meal (creatures_ai.js kill), by a mouthful at a carcass at the world's rate (eatAt: a
// hunter's min(mass/75, meal/20) a second — a click is EAT.bite seconds of it), and dead STARVE_T cycles after it reaches 1 (hungerTick).
// A clutch is paid from it (line.js clutchHunger). Shown on the readout only: the text rule has no bar, and how the body itself might show it is
// the person's to decide (CHANGELOG v11.73, Unseen).
const EAT={bite:1}; // s of the world's feeding rate one bite (click) at a carcass is worth — the player's jaw is deliberate: 20 bites fill a stomach from starving
let hlSpec=null,hlCost=0;
function hungerLine(){const P=player,C=P.clade;if(!C||mode!=='play')return '';const K=eaterK(P);if(hlSpec!==C.spec){hlSpec=C.spec;hlCost=clutchHunger(C.spec);}
  const left=P.hunger>=1?'starving '+(P.starveT/(K.cycle*DAY_S*STARVE_T)).toFixed(2):'starving in '+((1-P.hunger)*K.cycle).toFixed(2)+' d';
  const L=lineCur(),m=lifeBreed(L),b=lineBrooding();let ex=''; // v11.74: the age, and the brood
  if(L)ex+='  age '+((t-L.born)/DAY_S).toFixed(2)+' d'+(m&&m.life?' of '+(lifeS(L)/DAY_S).toFixed(2):'');
  if(b)ex+='  brooding '+Math.round(b.n)+' eggs, the hatch in '+(Math.max(0,b.hatch-t)/DAY_S).toFixed(2)+' d, '+(broodGuarded(b)?'guarded':'strayed')+', wasted '+(P.waste||0).toFixed(2)+' speed ×'+(P.speedK||1).toFixed(2);
  else if(L&&m&&m.guard){const cl=L.broods.filter(q=>!q.hatched&&q._egg);if(cl.length)ex+='  clutches '+cl.length+': '+cl.filter(q=>broodGuarded(q)).length+' guarded';} // v11.76: the hingeshell's dens
  if(L&&moulting(L))ex+=lineSoft(L)?'  soft, hard in '+((L.hardAt-t)/DAY_S).toFixed(2)+' d':'  the moult in '+((moultAt(L,(L.moults||0)+1)-t)/DAY_S).toFixed(2)+' d'; // v11.76
  ex+='  q: '+(C.abilities&&C.abilities.length?C.abilities.join(', '):'nothing'); // v11.75: the abilities the body has (the first is Q)
  if(!K.hunter)return 'no stomach on the model (the founder hunts nothing)  a clutch of '+(m?m.n:0)+' as you: '+hlCost.toFixed(2)+ex; // v11.75
  return 'hunger '+P.hunger.toFixed(2)+(P.hunger>ECO.hungry?' hungry':'')+'  '+left+'  stomach '+(K.meal*1000).toFixed(0)+' kg  cycle '+K.cycle.toFixed(2)+' d  a clutch of '+(m?m.n:0)+' as you: '+hlCost.toFixed(2)+' of it'+ex;}
function playerAway(on){const P=player;P.away=!!on;if(P.g)P.g.visible=!on;if(on){P.hold=null;P.vel.set(0,0,0);for(const c of creatures)if(c.target===P)dropTarget(c);}}
const keys={};let locked=false,drag=null,touchL=null,touchAbility=false;
const JET_W=0.18; // s of thrust per 0.5 s jet cycle
const CAM_DWELL=0.5,CAM_FLIP=0.4; // v11.42: CAM_CLEAR (0.35, the camera held clear of the wave) is gone — the camera may rest on the line, half in and half out (WATER.md L; the fog is per fragment, scene.js); camAbove flips CAM_FLIP past the wave, for the light, the sound and the water's things only
// First person (v11.18, the person's ask): f toggles it in play. The camera sits a little ahead of the nose (the spec's frame gives it,
// or the clade's size) looking along the view; the body wears the ghost material (scene.js MATGHOST: it draws nothing, but it is still
// there for the shadow map — v11.23, so your own shadow is under you in first person; before, the body was hidden and three's depth
// pass skips a hidden object) and its wake and arms still act on the world.
const FP_AHEAD=0.35;
// The animal steers itself (v11.77; the person, 21 Sep 2026: every animal must be playable without feeling strange — steering by heading, no strafing
// for a swimmer, backing up only where the body can). The mouse sets the heading you want (yaw, pitch); the body's own facing (byaw, bpitch) turns
// toward it at derive's turn rate by the world's rule (creatures_ai.js: the rate at the top speed, an ambling body at its pace's share, floored at
// TURN_MIN), eased within STEER.ease of the heading and capped at the rate past it — so a big body comes round like a barge and a small one darts, with
// no per-species code. The orientation is composed from the facing (faceQ: yaw about world up, pitch about the body's own x), so the body's up tends to
// world up of itself and nothing degenerates at vertical: no lookAt against UP anywhere in the player. To v11.76 the body turned to face its velocity
// with a lookAt — parallel to up it spun, a strafe turned it sideways, a knock turned it to the knock, and touching the water snapped it back.
// w thrusts along the body's own axis by its mode; s brakes, or backs at STEER.rev where the body can; a and d turn the heading (the keyboard's
// mouse, and the touch stick's x), space and c pitch it (space is the jump on the strand for a legged body); derive's buoyancy is a drift the pitch
// trims (BUOY_V). In the air the body follows its arc and comes back to the heading at its rate, without a snap.
const PITCH_MAX=1.54; // rad (88°): the heading's pitch limit — nearly straight up or down; a loop is not a heading
const STEER={key:1,ease:0.3,lead:1.0,air:2,rev:{jet:0.6,legs:0.5},brake:2.5,min:TURN_MIN}; // ease: within this angle (rad) of the heading the turn eases in exponentially (a radian left a slow body settling for seconds, test/steer.js); key: a/d and space/c turn the heading at this share of the body's turn rate; lead: the camera stays within this angle (rad) of behind the body's facing, so it is never in front of the face; air: the body follows its arc at this × its turn rate; rev: backing as a share of the top speed where the body can — a jetter turns its funnel, a legged body steps back on the floor (v11.78), a fish cannot; brake: s on a body that cannot back is the coast's decay × this (the fins flared); min: the turn's floor at rest, the world's (TURN_MIN)
const BUOY_V={sinks:-0.25,neutral:0,floats:0.15};
// Walking on the floor (v11.78, CHANGELOG v11.75's scope on v11.77's model): a legged body on the ground, wet or dry, is a walker — held at the ground
// plus its kind's clearance (C.clear: the founder's DEFS clear, else 0.35 × size, the world's rule for its own walkers), w and s along its facing at
// derive's walk speed (the legs' Froude speed), back at STEER.rev.legs where the legs are jointed pairs (LEGS_BACK), the turn about up only at the full
// rate (legs pivot at any pace), the pitch and the lean the ground's slope under it (groundGrad), its feet kept down a step (WALK.step × size: a deeper
// drop is a ledge, and it falls), space a hop off the floor (WALK.hop; the strand's jump in the air). Off the floor it swims by what its build says: a
// flapper with legs (the hood, the ram) swims as any flapper; a body whose only propulsion is its legs (derive's mode 'walk': canSwim false) has no
// thrust in the water and sinks at WALK.sink until its feet find the ground again.
const WALK={acc:8,step:0.6,hop:2.5,sink:1.2,lean:0.8}; // acc: the walk's velocity rate (1/s); step: the height (× size) a walker steps down without leaving the ground; hop: m/s off the floor under water; sink: m/s a legs-only body sinks off the floor; lean: the share of the side slope the body rolls into
const GG={x:0,z:0};
function groundGrad(x,z,out){out.x=(groundAt(x+1,z)-groundAt(x-1,z))*0.5;out.z=(groundAt(x,z+1)-groundAt(x,z-1))*0.5;return out;} // the ground's slope (dh/dx, dh/dz) over 2 m // m/s: derive's buoyancy as a drift the body trims with its pitch — a dense body settles, a chambered one rises, unless it swims against it
const _E=new THREE.Euler();
function wrapA(a){return ((a+Math.PI)%TAU+TAU)%TAU-Math.PI;} // an angle to (−π, π]
function turnRateOf(P){const C=P.clade;return C.turn*(P.turnK||1)*clamp(P.vel.length()/Math.max(0.1,C.speed),STEER.min,1);} // rad/s: the world's rule for the body's turn (creatures_ai.js, v11.71)
function faceToward(P,ty,tp,rate,dt){ // the facing toward a yaw and a pitch at a rate: eased within STEER.ease (the angular distance, the yaw's share by the pitch's cosine), capped at the rate past it; angV is this frame's angular speed (audio.js, test/steer.js)
  const dy=wrapA(ty-P.byaw),dp=tp-P.bpitch,cs=Math.max(0.2,Math.cos(P.bpitch)),d=Math.hypot(dy*cs,dp);if(d<1e-7||!(dt>0)){P.angV=0;return;}
  const step=Math.min(d,d*(1-Math.exp(-rate*dt/STEER.ease)),rate*dt),k=step/d;P.byaw=wrapA(P.byaw+dy*k);P.bpitch+=dp*k;P.angV=step/dt;}
function faceQ(P){P.g.quaternion.setFromEuler(_E.set(-P.bpitch,P.byaw+Math.PI,0,'YXZ'));} // the body's orientation from its facing: forward (−sin byaw·cos bpitch, sin bpitch, −cos byaw·cos bpitch), as the heading's fwd is from yaw and pitch
function bodyFwd(P,out){const cp=Math.cos(P.bpitch);return out.set(-Math.sin(P.byaw)*cp,Math.sin(P.bpitch),-Math.cos(P.byaw)*cp);}
function applyCam(){const f=(mode==='play'&&player.fp?CAM_K.fovFP:CAM_K.fov)+(player.fovKickT>0?2*player.fovKickT/0.2:0);if(camera.fov===f)return;camera.fov=f;camera.updateProjectionMatrix();if(mode==='menu')layoutMenu();} // v11.48: the field by mode (CAM_K, scene.js); cheap when nothing changed, so every frame may ask
function toggleFP(){const P=player;P.fp=!P.fp;if(P.g)ghostBody(P.g,P.fp);applyCam();hintEl.textContent=P.fp?'first person':'third person';hintEl.style.opacity=1;setTimeout(()=>{hintEl.style.opacity=0;},1500);} // the camera's clearance from the water on its side (> the near plane), and the least time between its side changing

function hurtPlayer(dmg,from){
  const P=player;if(P.dead||mode!=='play')return;if(P.withdrawn)return;
  P.hurtT=0.7;P.lastHurt=t;P.fovKickT=0.2;P.rollV=(P.rollV||0)+rnd(-1,1)*2.5;hurtEl.style.opacity=1;setTimeout(()=>{hurtEl.style.opacity=0;},240);thump(0.6,80,30,from,0.5,0.1);
  if(from){T4.copy(P.pos).sub(from).normalize();P.vel.addScaledVector(T4,7);}
}
function die(cause){ // v11.55: a placed act (combat.js killBy) — swallowed, opened, skewered, crushed, the nerve cord; the slot's animal is dead (the person, 15 Sep 2026): its world kept, the menu, a new animal on continue
  const P=player;if(P.dead)return;camNote();P.dead=true;P.cause=cause||'';P.bleed=0;P.paraT=0;P.stungT=0;releaseAll(P);fadeEl.style.opacity=1;const slot=curSave; // camNote (save.js, v11.47.2): the title screen opens from the spot you died in
  setTimeout(()=>{if(slot&&curSave!==slot)return;if(curSave&&mode==='play'){slotDeath(P.cause);return;} // v11.74: a death is the slot's it happened in — a new game started inside the fade (seen driving the look by hand) must not be ended by it // a slot: the death is written and the menu comes back (save.js); without one (the tests, the lab) the respawn as before
    P.pos.copy(spawnPos);P.vel.set(0,0,0);P.inkT=0;P.bleed=0;P.hold=null;P.held=0;P.camAbove=false;P.camFlipT=0;snapMed=true;P.wet=true;P.sub=1;for(const c of creatures){if(c.target===player)dropTarget(c);}camera.position.copy(P.pos).add(V3(0,2,8));setTimeout(()=>{fadeEl.style.opacity=0;P.dead=false;},500);},2800);
}
function bite(){playerBite();} // v11.31: combat.js — a gulp, a mouthful of a carcass, or a wound (a tear on what you hold)
function ability(){
  const P=player,C=P.clade;if(mode!=='play'||P.dead||!C||P.cd>0||P.paraT>0)return; // paralysed, nothing answers (v11.55)
  if(C.ability==='ink'){spawnInk(P.pos);P.inkT=6;P.cd=12;for(const c of creatures){if(c.target===player)dropTarget(c,6);}} // v11.31.1: dropTarget lets go of the arms too, not only the target
  else if(C.ability==='stun'){let hit=false;for(const c of creatures){if(!c.alive)continue;const r=c.def.role;if(!(r==='hunter'||r==='ambush'||r==='coil'))continue;if(c.pos.distanceTo(P.pos)<6+c.def.size*0.3){c.stun=2.5;T1.copy(c.pos).sub(P.pos).normalize();c.vel.addScaledVector(T1,9);dropTarget(c,5);hit=true;}}P.cd=hit?9:1.5;P.pulse=1;thump(0.7,60,25,null,0.25,0.12);}
  else if(C.ability==='ram'){const tg=playerTarget(false);P.pulse=1;P.snapT=0.1; // v11.75: the ram's blow, the world's rule on the striker (combat.js combatBite, RAM): a knock on what is ahead in reach — stunned, thrown, nothing through
    if(tg&&tg.alive){T1.set(0,0,1).applyQuaternion(P.g.quaternion);tg.stun=Math.max(tg.stun||0,RAM.stun);tg.vel.addScaledVector(T1,9);if(tg.target===P)dropTarget(tg,RAM.cool);wound(tg,C.bite,P,null,'snap');P.cd=RAM.cool;thump(0.7,70,30,null,0.3,0.1);}else{P.cd=1.5;thump(0.3,130,50,null,1.2,0.04);}}
  // shut and withdraw are held, not fired (updatePlayer reads the key)
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
  splashes.push({g:g,pts:pts,vel:vel,t:0,n:n,life:1.1,grav:1});
  // The residue (v11.46, WATER.md I): a foam patch on the water where the body crossed — an irregular ten-gon, growing over RES_T and fading, riding the
  // wave: white in the sky's light from above (RES_UP over the surface, drawn after it; hidden from below by the opaque underside's depth) and a grey patch
  // from below (RES_DN under it, drawn before the surface from above so the body tints it, after it from below so it shows through the window) — and a puff of
  // bubbles rising under it at 0.2–0.35 m/s for four seconds, capped at the water. Both fogged by the medium they sit in. RES_N patches at once; a creature's
  // crossing within 160 m makes one too (creatures_ai). No radial gradient: a flat polygon, the low-poly foam.
  const r0=0.35+0.18*Math.sqrt(v),K=SKY,lit=K.skyL; // 0.86 m at v 8, grown to 1.7: a patch 3–4 m across for a 3 m animal (the first cut at twice this read as a raft, seen)
  const mk=(dy,cr,cg,cb,ro)=>{const m=10,pa=new Float32Array((m+2)*3),idx=[],rr=[];for(let i=0;i<m;i++)rr.push(rnd(0.7,1.15));for(let i=0;i<=m;i++){const a=i/m*TAU,q=rr[i%m];pa[(i+1)*3]=Math.cos(a)*q;pa[(i+1)*3+1]=0;pa[(i+1)*3+2]=Math.sin(a)*q;if(i<m)idx.push(0,i+2,i+1);}
    const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(pa,3));gg.setIndex(idx);const mm=new THREE.Mesh(gg,new THREE.MeshBasicMaterial({color:new THREE.Color(cr*K.tint[0]*lit,cg*K.tint[1]*lit,cb*K.tint[2]*lit),transparent:true,opacity:0.8,depthWrite:false,side:THREE.DoubleSide}));
    mm.renderOrder=ro;mm.frustumCulled=false;mm.position.set(pos.x,y0+dy,pos.z);mm.scale.set(r0,1,r0);scene.add(mm);return mm;};
  const ring=(()=>{const m=12,pa=new Float32Array(m*2*3),idx=[];for(let i=0;i<m;i++){const a=i/m*TAU,q=rnd(0.9,1.08);pa[i*6]=Math.cos(a)*q;pa[i*6+2]=Math.sin(a)*q;pa[i*6+3]=Math.cos(a)*q*0.8;pa[i*6+5]=Math.sin(a)*q*0.8;const j=(i+1)%m;idx.push(i*2,j*2,i*2+1,j*2,j*2+1,i*2+1);} // the ring (v11.53, POLISH 16): an annulus that runs out from the patch and fades
    const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.BufferAttribute(pa,3));gg.setIndex(idx);const mm=new THREE.Mesh(gg,new THREE.MeshBasicMaterial({color:new THREE.Color(0.92*K.tint[0]*lit,0.95*K.tint[1]*lit,0.95*K.tint[2]*lit),transparent:true,opacity:0.5,depthWrite:false,side:THREE.DoubleSide}));mm.renderOrder=1.5;mm.frustumCulled=false;mm.position.set(pos.x,y0+RES_UP+0.02,pos.z);mm.scale.set(r0,1,r0);scene.add(mm);return mm;})();
  residues.push({up:mk(RES_UP,0.90,0.93,0.93,1.5),dn:mk(-RES_DN,0.70,0.74,0.74,-0.5),ring:ring,x:pos.x,z:pos.z,r0:r0,t:0});
  if(residues.length>RES_N)dropRes(residues.shift());
  const nb=20,ba=new Float32Array(nb*3),bv=new Float32Array(nb*3);for(let i=0;i<nb;i++){ba[i*3]=pos.x+rnd(-0.5,0.5);ba[i*3+1]=y0-rnd(0.3,1.8);ba[i*3+2]=pos.z+rnd(-0.5,0.5);bv[i*3]=rnd(-0.15,0.15);bv[i*3+1]=rnd(0.2,0.35);bv[i*3+2]=rnd(-0.15,0.15);}
  const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.BufferAttribute(ba,3));const bp=new THREE.Points(bg,new THREE.PointsMaterial({color:0xdde8ec,size:0.07,transparent:true,opacity:0.5,depthWrite:false}));bp.frustumCulled=false;bp.renderOrder=0;scene.add(bp);
  splashes.push({g:bg,pts:bp,vel:bv,t:0,n:nb,life:4.0,grav:0,cap:y0-0.05});
}
const residues=[],RES_N=16,RES_T=6.0,RES_UP=0.06,RES_DN=0.10; // the patches alive at once; a patch's life (s); the foam's height over the wave and the grey patch's depth under it (clear of the surface's depth either side)
function dropRes(r){for(const m of [r.up,r.dn,r.ring]){if(!m)continue;scene.remove(m);m.geometry.dispose();m.material.dispose();}}
function updateSplashes(dt){
  for(let i=splashes.length-1;i>=0;i--){const s=splashes[i];s.t+=dt;const a=s.g.attributes.position.array,life=s.life||1.1;
    for(let k=0;k<s.n;k++){if(s.grav)s.vel[k*3+1]-=GRAV*dt;a[k*3]+=s.vel[k*3]*dt;a[k*3+1]+=s.vel[k*3+1]*dt;a[k*3+2]+=s.vel[k*3+2]*dt;if(s.cap!==undefined&&a[k*3+1]>s.cap)a[k*3+1]=s.cap;} // the bubbles (grav 0) rise and stop at the water
    s.g.attributes.position.needsUpdate=true;s.pts.material.opacity=(s.grav?0.9:0.7)*(1-s.t/life);
    if(s.t>life){scene.remove(s.pts);s.g.dispose();s.pts.material.dispose();splashes.splice(i,1);}}
  for(let i=residues.length-1;i>=0;i--){const r=residues[i];r.t+=dt;const k=r.t/RES_T;if(k>=1){dropRes(r);residues.splice(i,1);continue;}
    const y=waveH(r.x,r.z),sc=r.r0*(1+1.0*(1-Math.exp(-r.t/1.5))),op=0.6*(1-k)*(1-k);r.up.position.y=y+RES_UP;r.dn.position.y=y-RES_DN;r.up.scale.set(sc,1,sc);r.dn.scale.set(sc*1.2,1,sc*1.2);r.up.material.opacity=op;r.dn.material.opacity=op*0.7;if(r.ring){const rk=Math.min(1,r.t/3),rs=r.r0*(1+3.2*rk);r.ring.position.y=y+RES_UP+0.02;r.ring.scale.set(rs,1,rs);r.ring.material.opacity=0.5*(1-rk)*(1-rk);}} // the ring runs out to four times the patch over three seconds // the patch doubles over ~4 s and fades by the square, riding the wave
}
function updatePlayer(dt){
  const P=player,C=P.clade;
  P.cd=Math.max(0,P.cd-dt);P.biteCD=Math.max(0,P.biteCD-dt);P.inkT=Math.max(0,P.inkT-dt);P.hurtT=Math.max(0,P.hurtT-dt);
  if(!P.dead&&!P.away&&C&&eaterK(P).hunter&&hungerTick(P,dt))return; // the stomach (v11.73): the ledger's clock on the player's line kind, and starvation is a death like any other. v11.75: a body whose founder hunts nothing (a grazer, a filter feeder) feeds off the model as the world's grazers do — no clock, as they have none
  let mz=0,ky=0,kp=0,sprint=false;
  if(!P.dead){
    mz=(keys.KeyW?1:0)-(keys.KeyS?1:0);ky=(keys.KeyA?1:0)-(keys.KeyD?1:0);kp=(keys.Space?1:0)-(keys.KeyC?1:0); // v11.77: w/s along the body, a/d and space/c steer the heading
    if(touchL){ky-=touchL.mx;mz+=touchL.mz;if(touchL.sprint)sprint=true;}
    if(keys.ShiftLeft||keys.ShiftRight)sprint=true;
    P.withdrawn=C.ability==='withdraw'&&(!!keys.KeyQ||touchAbility)&&!(P.paraT>0);
    P.shut=C.ability==='shut'&&(!!keys.KeyQ||touchAbility)&&!(P.paraT>0); // v11.75: the valves clamped while Q is held — still, sinking, shell to every edge (combat.js coverAt); not the withdraw's invulnerability
    if(P.withdrawn||P.shut)sprint=false;
    P.sprint=sprint;
  }else{P.withdrawn=false;P.shut=false;P.sprint=false;}
  // The medium. sub is how much of the body is under the local water level: 1 swimming, 0 in the air or on the strand.
  // Thrust and water drag scale with it; gravity with what is left. Nothing stops you leaving the water except gravity.
  const wl=waveH(P.pos.x,P.pos.z),R=0.9,sub=clamp((wl-(P.pos.y-R))/(2*R),0,1);P.sub=sub;
  const still=P.withdrawn||P.shut||P.paraT>0; // withdrawn, shut, or paralysed (COMBAT.md §3b): the body does nothing you ask of it
  const airborne=sub<0.5&&!P.grounded,strand=sub<0.5&&P.grounded,walker=C.legs&&P.grounded&&!P.dead; // v11.78: a legged body on the ground, wet or dry, walks
  P.hopT=Math.max(0,(P.hopT||0)-dt);
  // the heading (v11.77): the mouse's, and the keys turn it at the body's rate — a/d the yaw, space/c the pitch (space hops a walker off the floor)
  let rate=turnRateOf(P);if(walker)rate=C.turn*(P.turnK||1); // legs pivot at any pace
  if(!still&&!P.dead){const kr=rate*STEER.key*dt;if(ky)P.yaw+=ky*kr;if(kp&&!walker)P.pitch=clamp(P.pitch+kp*kr,-PITCH_MAX,PITCH_MAX);}
  // the facing: toward the heading in the water; a walker's yaw to the heading, its pitch and lean the ground's slope under it (v11.78); in the air (and a fish flopping on the strand) along the arc; held while still or lying
  let ty=P.yaw,tp=P.pitch;P.rollBias=0;
  if(walker){const hx=-Math.sin(P.byaw),hz=-Math.cos(P.byaw),g=groundGrad(P.pos.x,P.pos.z,GG);tp=Math.atan(g.x*hx+g.z*hz);P.rollBias=Math.atan(g.x*-Math.cos(P.byaw)+g.z*Math.sin(P.byaw))*WALK.lean;} // the slope along the facing, and across it (the body's right is (−cos byaw, 0, sin byaw))
  else if(airborne||strand){const v=P.vel.length();if(v>1.2){ty=Math.atan2(-P.vel.x,-P.vel.z);tp=Math.asin(clamp(P.vel.y/v,-1,1));rate*=STEER.air;}else{ty=P.byaw;tp=P.bpitch;}}
  if(still||P.dead){ty=P.byaw;tp=P.bpitch;}
  faceToward(P,ty,tp,rate,dt);faceQ(P);
  const bf=bodyFwd(P,T3); // the body's own axis: what w thrusts along
  const rev=walker?(C.legsBack?STEER.rev.legs:0):C.jet?STEER.rev.jet:0,swims=walker||C.canSwim||sub<0.5; // s: back where the body can (a jetter's funnel, jointed legs on the ground), else the brake; a legs-only body off the floor under water has no thrust
  const th=still||!swims?0:mz>0?1:mz<0?-rev:0,brake=!still&&mz<0&&!rev&&!walker,moving=th!==0;
  let spd=walker?(C.landSpeed||4):C.speed;if(!walker&&C.sprint&&sprint)spd*=C.sprint; // a walker's Froude speed is its ceiling (v11.75)
  P.heldT=Math.max(0,P.heldT-dt);if(P.heldT>0)spd*=0.8; // brushed by something's arms
  spd*=P.heldK||1; // held (combat.js updateHolds sets it): in jaws or claws you thrash, in arms you barely swim
  spd*=slowOf(P); // bleeding, or stung (combat.js, v11.55)
  P.grabT=Math.max(0,P.grabT-dt);if(P.grabT<=0||(P.grab&&!P.grab.alive))P.grab=null;
  if(still)sprint=false;
  T2.copy(bf).multiplyScalar(spd*th);if(!walker)T2.y+=((BUOY_V[C.buoy]||0)-(C.canSwim?0:WALK.sink))*sub; // the thrust along the body, and derive's buoyancy as a drift (a sinking body swims a little nose-up to hold its depth); a legs-only body off the floor sinks
  const ak=C.accel*(brake?STEER.brake:1);
  if(walker){const k=1-Math.exp(-WALK.acc*dt);P.vel.x=lerp(P.vel.x,T2.x,k);P.vel.z=lerp(P.vel.z,T2.z,k);if(sub>=0.5)P.vel.y=lerp(P.vel.y,T2.y,k);else P.vel.y-=GRAV*(1-sub)*dt; // along the slope; on the strand gravity holds it down
    if(kp>0&&!still&&P.vel.y<=0.1){P.vel.y=sub>=0.5?WALK.hop:(C.jump||5);P.hopT=0.3;}} // the hop off the floor, the jump on the strand
  else if(sub>=0.999)P.vel.lerp(T2,1-Math.exp(-ak*dt));
  else{
    P.vel.lerp(T2,1-Math.exp(-ak*sub*dt));P.vel.y-=GRAV*(1-sub)*dt;P.vel.multiplyScalar(1-0.12*(1-sub)*dt);
    if(strand&&!P.dead){ // a fish out of water: it lies where it lands, and flops the way it lies when you push
      const hx=-Math.sin(P.byaw),hz=-Math.cos(P.byaw);P.vel.x*=Math.exp(-6*dt);P.vel.z*=Math.exp(-6*dt);P.flopT-=dt;
      if(mz&&!still&&P.flopT<=0){P.flopT=0.7;const s=mz>0?1:-1;P.vel.x+=hx*s*4.2;P.vel.z+=hz*s*4.2;P.vel.y=4.8;P.pulse=1;thump(0.25,150,60,null,0.8,0.06);}
    }
  }
  // the jet: every 0.5 s a squeeze, its impulse (jetImp) delivered as a thrust over the first JET_W of the cycle — the same
  // push, but a velocity that ramps over ten frames rather than jumps, so the body and the arms behind it aren't whipped. Along the body's axis (v11.77), back at the funnel's share with s
  if(C.jet&&sprint&&!still&&!P.dead&&sub>0.3){P.jetT-=dt;if(P.jetT<=0){P.jetT=0.5;P.pulse=1;}
    const w=P.jetT-(0.5-JET_W);if(w>-dt){const f=Math.min(dt,w+dt)/JET_W;P.vel.addScaledVector(bf,C.jetImp*sub*f*(mz<0?-rev:1));}}
  else P.jetT=Math.min(P.jetT,0.1);
  if(P.withdrawn||P.shut){P.vel.y-=0.6*dt;P.vel.multiplyScalar(1-1.5*dt);}
  const vmax=C.speed*(C.sprint||1)*1.7;
  if(sub>=0.5){if(P.vel.length()>vmax)P.vel.setLength(vmax);}
  else{const hv=Math.hypot(P.vel.x,P.vel.z);if(hv>vmax){P.vel.x*=vmax/hv;P.vel.z*=vmax/hv;}if(P.vel.y<-30)P.vel.y=-30;}
  P.pos.addScaledVector(P.vel,dt);
  if(sub>0&&!walker){currentAt(P.pos.x,P.pos.z,P.pos.y,CURV);P.pos.addScaledVector(CURV,dt*sub);} // carried by the current (chunks.js); not a walker with its feet on the ground (v11.78, as the world's floor creatures hold on)
  contactK=0;const pad=bodyPush(P.pos,P.vel,P.g.quaternion,C.size*0.7,0.9,0.5);P.hitFl=contactK&1;P.hitRk=contactK&2; // rock and pads first (centre, nose and tail), then the floor has the last word
  // floor: gentle slopes clamp you up, steep walls push you back
  const clr=C.legs?C.clear:1.1;let fh=groundAt(P.pos.x,P.pos.z)+clr;P.grounded=false;const vy0=P.vel.y; // v11.78: a legged body stands at its kind's clearance
  if(P.pos.y<fh){
    const gx=(groundAt(P.pos.x+1,P.pos.z)-groundAt(P.pos.x-1,P.pos.z))*0.5,gz=(groundAt(P.pos.x,P.pos.z+1)-groundAt(P.pos.x,P.pos.z-1))*0.5,gl=Math.hypot(gx,gz);
    if(gl>1.2){const pen=fh-P.pos.y,k=pen/(gl*gl);P.pos.x-=gx*k;P.pos.z-=gz*k;const vn=(P.vel.x*gx+P.vel.z*gz)/gl;if(vn>0){P.vel.x-=gx/gl*vn;P.vel.z-=gz/gl*vn;}fh=groundAt(P.pos.x,P.pos.z)+clr;if(P.pos.y<fh){P.pos.y=fh;P.grounded=true;}}
    else{P.pos.y=fh;if(P.vel.y<0)P.vel.y*=-0.2;P.grounded=true;}
  }
  else if(C.legs&&P.wasGrounded&&!(P.hopT>0)&&!P.dead&&P.pos.y-fh<WALK.step*Math.max(0.8,C.size)){P.pos.y=fh;if(P.vel.y<0)P.vel.y=0;P.grounded=true;} // v11.78: a walker keeps its feet down a step; a deeper drop is a ledge and it falls
  if(P.grounded&&!P.wasGrounded&&vy0<0)P.landV=-vy0;P.wasGrounded=P.grounded; // the landing's speed, for its thud (audio.js)
  // on a lily pad: it takes your weight (dips more the smaller it is) and you are ashore on it
  P.onPad=pad;if(pad){P.grounded=true;loadPad(pad,clamp(0.6/pad.r,0.03,0.45));}
  // crossing the surface at speed throws spray
  const wet=sub>0.5;if(wet!==P.wet){P.wet=wet;const v=Math.abs(P.vel.y)+P.spd*0.3;if(v>2.5&&!P.dead){splash(P.pos,v);thump(clamp(v/14,0.15,0.6),260,40,null,2.5,0.3);}} // the spray's hiss over the slap
  P.pos.x=clamp(P.pos.x,-HALF+25,HALF-25);P.pos.z=clamp(P.pos.z,-HALF+25,HALF-25);
  P.g.position.copy(P.pos);P.g.updateMatrix();worldShapes(P); // the orientation was set above (faceQ), before the thrust read the body's axis
  playerGrab(!P.dead&&!P.withdrawn&&!!(keys.KeyR||mouseGrab||touchGrab),dt); // the grab (combat.js): held while the key is; last, with the shapes fresh (it uses the temps)
}
// After the creatures have moved and bodies have pushed apart (creatures_ai.js): the body where it ended up, the pose, the
// arms simulated against the creatures around it, then the camera.
function finishPlayer(dt,near){
  const P=player,C=P.clade;
  // the camera's own angles (v11.77): in third person behind the body's facing, led toward the heading by at most STEER.lead — so it turns with the
  // body and is never in front of the face; in first person the heading itself (the eyes are yours, the body follows). Its up is composed from the
  // same angles, so the look never degenerates however steep the pitch
  const cyaw=P.fp?P.yaw:P.byaw+clamp(wrapA(P.yaw-P.byaw),-STEER.lead,STEER.lead),cpit=P.fp?P.pitch:P.bpitch+clamp(P.pitch-P.bpitch,-STEER.lead,STEER.lead);
  const cp=Math.cos(cpit),sp=Math.sin(cpit),cy=Math.cos(cyaw),sy=Math.sin(cyaw);
  const fwd=T3.set(-sy*cp,sp,-cy*cp),cup=T4.set(sp*sy,cp,sp*cy); // the camera's direction and its up
  P.g.position.copy(P.pos);P.spd=P.vel.length();
  {const ro=P.sub>0.95?1:0;if(P.ro!==ro){P.ro=ro;P.g.traverse(o=>{if(o.isMesh)o.renderOrder=ro;});}} // the body's place in the opaque pass (v11.51, atmosphere.js refrMark): under water it draws after the refraction's copy of the frame, so the surface never samples it and smears its edge into the sky; in the air, or crossing, it is in the copy and seen through the surface refracted like the land
  P.anim(t,P.spd,{jet:P.sprint&&C.jet,withdrawn:P.withdrawn,pulse:P.pulse,strike:P.hold?1:0,soft:(P.soft||P.shut)?1:0}); // strike: the mouth stays open on what is held (the finback's ring blooms); soft (v11.75–76): the valves clamped — shut by Q, or through the moult
  bodyPose(P,dt,P.byaw); // v11.53 (fx.js): squash and stretch, banking, the bite's snap — after the anim, before the rigs step. v11.77: the bank from the body's own turn, not the heading's
  stepRigs(P,near,dt);
  P.pulse=Math.max(0,P.pulse-dt*2);P.snapT=Math.max(0,(P.snapT||0)-dt);P.nudgeT=Math.max(0,(P.nudgeT||0)-dt);P.fovKickT=Math.max(0,(P.fovKickT||0)-dt); // v11.53 (fx.js): the bite's snap, the camera's nudge toward it, the hurt's fov kick; squash and stretch and banking
  if(P.fp){const nose=(P.b&&P.b.F?P.b.F.nose*P.g.scale.x:C.size)+FP_AHEAD;T2.copy(P.pos).addScaledVector(bodyFwd(P,T1),nose);} // at the nose, along the body
  else{T2.copy(P.pos).addScaledVector(fwd,-(C.cam+CAM_K.arm)).addScaledVector(UP,1.4); // v11.48: CAM_K.arm from the readout's tuner
  const ch=groundAt(T2.x,T2.z)+1.0;if(T2.y<ch)T2.y=ch;}
  // camAbove is which side the camera's natural spot is on, with hysteresis: it flips CAM_FLIP past the wave and never within CAM_DWELL of
  // the last flip (a wave passing the spot is not a reason to change the light). Since v11.42 it drives only the light's crossfade, the sound
  // and the water's own things (updateAtmosphere): the fog and the surface's look are decided per fragment, so the camera itself is no longer
  // nudged or held clear of the water — it goes where the player takes it, and at the line the view is half air, half water.
  const cw=waveH(T2.x,T2.z);P.camFlipT=Math.max(0,(P.camFlipT||0)-dt);
  if(P.camAbove){if(T2.y<cw-CAM_FLIP&&P.camFlipT<=0){P.camAbove=false;P.camFlipT=CAM_DWELL;}}
  else{if(T2.y>cw+CAM_FLIP&&P.camFlipT<=0){P.camAbove=true;P.camFlipT=CAM_DWELL;}}
  applyCam();if(P.fp)camera.position.copy(T2);else{solidPush(T2,0.6,null,null,true);camera.position.lerp(T2,1-Math.exp(-8*dt));if(P.nudgeT>0&&P.nudgeD)camera.position.addScaledVector(P.nudgeD,P.nudgeT*2.0);}
  if(P.hurtT>0){camera.position.x+=rnd(-1,1)*P.hurtT*0.3;camera.position.y+=rnd(-1,1)*P.hurtT*0.3;}
  if(P.fp)T2.copy(camera.position).add(fwd);else T2.copy(P.pos).addScaledVector(fwd,3);_m.lookAt(camera.position,T2,cup);camera.quaternion.setFromRotationMatrix(_m); // the look with the camera's own up (v11.77): never a lookAt against UP
  plight.position.copy(P.pos).add(V3(0,1,0));
}
