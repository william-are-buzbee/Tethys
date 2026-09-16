// creatures_ai.js — registry, spawning (with far-LOD bake), behaviours, per-frame update
const creatures=[],schools=[],carcasses=[],eggs=[]; // carcasses (v11.26): the dead, lying where they fell until eaten or gone; eggs: the clutches
// The eggs (v11.26): a birth the ledger owes a loaded cell is laid as a clutch on the floor near an adult of its kind — a knot of
// translucent spheres the clade's colour, sized to the animal — and hatches after ECO.hatch days (by mass^¼: a flicker's in five
// minutes, a ridge's in a day and a half) into juveniles at the clutch. A clutch is a carcass to the scavengers (findCarcass): eaten
// down, it hatches fewer. The ledger counts the unhatched as living; a clutch eaten is a debit
const EGG_GEO={},EGG_COL={ringmouths:[0.60,0.70,0.62],slowbloods:[0.74,0.64,0.50],hingeshells:[0.84,0.82,0.72],drifters:[0.8,0.8,0.8]};
function eggGeo(clade){let g=EGG_GEO[clade];if(g)return g;const col=EGG_COL[clade]||EGG_COL.hingeshells,rng=mulberry(77),P=[];
  for(let i=0;i<7;i++){const a=rng()*TAU,r=i?0.9+rng()*0.6:0;P.push(part(G.sph(0.85+rng()*0.3,6,5),Math.cos(a)*r,0.3+(i?rng()*0.5:0.6),Math.sin(a)*r,col));}
  return EGG_GEO[clade]=merge(P);}
function layEggs(ch,e,ei,n,rng){
  const kind=e.kind,D=DEFS[kind],EK=ecoOf(kind);let at=null;const adults=[];for(const o of ch.creatures)if(o.alive&&o.ent===ei&&!o.def.juv)adults.push(o);
  if(adults.length){const a=adults[Math.floor(rng()*adults.length)];at=V3(a.pos.x+(rng()-0.5)*8,0,a.pos.z+(rng()-0.5)*8);}
  else{at=chunkPoint(ch,rng,e.env,!!e.land);if(!at)return 0;}
  const h=ch.h(at.x,at.z);if(!e.land&&h>-4)return 0;at.y=h;if(solidPush(at,0.6,null,ch))return 0;
  const sz=0.12*Math.pow(D.size,0.6),m=new THREE.Mesh(eggGeo(SPECS[kind]?SPECS[kind].clade:'hingeshells'),MATT);m.position.copy(at);m.scale.setScalar(sz);m.rotation.y=rng()*TAU;scene.add(m);
  const egg={mesh:m,pos:at,ent:ei,e:e,kind:kind,chunk:ch,n:n,n0:n,t:ECO.hatch*Math.pow(EK.mass,0.25)*DAY_S*(0.8+0.4*rng()),flesh:n*sz*sz*sz*40,flesh0:n*sz*sz*sz*40,gone:false,def:{size:sz*2},egg:true};
  eggs.push(egg);ch.eggs.push(egg);POP.laid+=n;return n;
}
function removeEgg(g){g.gone=true;scene.remove(g.mesh);let k=eggs.indexOf(g);if(k>=0)eggs.splice(k,1);k=g.chunk.eggs.indexOf(g);if(k>=0)g.chunk.eggs.splice(k,1);}
function updateEggs(dt){
  for(let i=eggs.length-1;i>=0;i--){const g=eggs[i];
    if(g.flesh<g.flesh0){const left=Math.ceil(g.n0*Math.max(0,g.flesh)/g.flesh0);if(left<g.n){const c=g.chunk.i*NCELL+g.chunk.j;POP.n[g.ent][c]=Math.max(0,POP.n[g.ent][c]-(g.n-left)/Q.creatures);POP.eaten+=g.n-left;g.n=left;}
      if(g.n<=0){removeEgg(g);continue;}}
    g.t-=dt;if(g.t<=0){const r=placeKind(g.chunk,g.e,g.n,mulberry((g.pos.x*131+g.pos.z*7)|0),{ent:g.ent,juv:true,at:g.pos});let q=r.next();while(!q.done)q=r.next();POP.hatched+=q.value||0;removeEgg(g);}}
}
let visibleCreatures=0;

// The static geometry of a kind is shared by every individual (v11.12): a build merges the same body for every creature of a kind
// (the rest pose, the kind's palette) and its far-LOD bake is a second full copy — 1100 resident creatures carried 1100 of each, a
// 455 MB heap at boot. The first spawn of a kind donates its meshes' geometries and its bake; the rest point at them and drop their
// own. The rigs (skinned every frame) stay per creature; the lab's placed species ('lab', a changing spec) is never cached. The
// build itself still runs per spawn: only the copies and the uploads are saved.
const KIND_GEO={},SHARED_GEO=new Set();
// A juvenile (v11.26): a recruit is born at ECO.juv of its kind's scale and grows up off screen (growUp). Its def is its kind's with the
// size-dependent numbers scaled, chained to the adult's so every other read falls through; its geometry is cached apart (KIND_GEO 'kind~')
const JUV_DEF={};
function juvDef(kind){let j=JUV_DEF[kind];if(j)return j;const d=DEFS[kind],s=ECO.juv,sp=SPECS[kind];j=JUV_DEF[kind]=scaledDef(d,s);j.juv=true;j.build=()=>compile(sp,s*(sp.s||1));return j;}
// ---------- the individual (v11.66, the hingeshell variety pass — the infrastructure is every clade's) ----------
// Two of a kind were identical to v11.65: one geometry per kind, one palette, the juvenile the only variation. Now every animal the ledger places
// draws three things at its spawn, from the cell's own rng so a cell comes back the same: a size within VARY.spread of its kind's (an instance
// scale on the group over the shared geometry — nothing is rebuilt; the hit capsules, the contact and the calculator's numbers follow through
// scaledDef and the group's scale); a coat class from the place's chemistry (creatures_spec.js coatClassAt: rust, lime, sulfide, manganese, the
// young rock's dark — PLANET's shell-colour rule), which is a geometry per kind and class in KIND_GEO since the palette is baked into the vertex
// colours (buildKind: ~0.5 ms and a few thousand vertices a class, only the classes a kind is met in); and, for a clade that moults
// (GRAMMAR.moult), whether it is in the soft state — pale, its valves clamped, laid against the nearest solid, still, and covered by skin instead
// of plate so anything with an edge can open it (PLANET: the only time a hingeshell is edible; a hunter takes a soft body of any kind down to
// MOULT.prey of its own mass, findPrey). A soft one hardens after MOULT.soft days × mass^¼ (a fresh adult in its place, out of sight, as a
// juvenile grows up); a hard one carries a clock to its next moult (MOULT.every days × mass^¼) and, out of sight, is replaced by its soft twin with
// its cast carapace left on the floor beside it (a mesh per shed, gone after MOULT.shedT days). Older sheds lie about as debris: a flora entry per
// moulting kind (shedFlora: the body flattened in the shed coat, MAT, placed by the kind's own envelopes through chunks.js placeFloraType `envs`,
// clearOf like any small flora, one pool draw per kind). The boids skip the soft state (a soft one in a swarm is eaten at once, and a ribbon's mean
// would drag on it). Anything outside the ledger (ent −1: the lab's placed spec, the fleets, the tests' bodies) is built plain.
const VARY={spread:0.15}; // ±: the adult size band as a fraction of the kind's size
const MOULT={frac:0.05,soft:0.5,every:20,hide:6,prey:0.5,shedT:4,shedPer:0.5,keep:0.85}; // frac: the share of a moulting clade's placed adults that start soft; soft: game days soft at unit mass (× mass^¼); every: game days between moults at unit mass (× mass^¼); hide: m a soft one looks about for a solid to lie against; prey: a hunter takes a soft body of any kind while its own mass is at least this share of the body's; shedT: game days a cast carapace dropped in play lasts; shedPer: sheds placed per cell per unit of the kind's capacity; keep: a shed's scale against the animal's (it grew at the moult)
function moults(kind){const sp=SPECS[kind],g=sp&&GRAMMAR[sp.clade];return !!(g&&g.moult);}
// the kind built in a coat class: its PAL preset swapped for the shifted twin for the build and put back (the zoo's own trick for the variants)
function buildKind(d,kind,cls){const sp=SPECS[kind],pk=sp&&typeof sp.coat==='string'?sp.coat:null;if(!cls||!pk||!PAL[pk])return d.build();const p0=PAL[pk];PAL[pk]=coatChem(p0,cls,sp.clade);try{return d.build();}finally{PAL[pk]=p0;}}
// a def with the size-dependent numbers scaled by k (a juvenile at ECO.juv, an adult's band at VARY): chained to the kind's so every other read falls through
function scaledDef(d,k){const j=Object.create(d),sq=Math.sqrt(k);j.size=d.size*k;if(d.speed)j.speed=d.speed*sq;if(d.flee)j.flee=d.flee*sq;if(d.reach)j.reach=d.reach*k;if(d.dmg)j.dmg=d.dmg*k*k;if(d.radius)j.radius=d.radius*k;if(d.lunge)j.lunge=d.lunge*sq;if(d.detect)j.detect=d.detect*k;if(d.clear!==undefined)j.clear=d.clear*k;if(d.food)j.food=Math.max(1,Math.round(d.food*k));return j;}
// a soft body's place: on the floor within MOULT.hide of p, clear of solids at its own radius but with one within 2 m (a rock, a stalk, a structure's foot); failing that, the floor where it is
function hideSpot(ch,p,rng,d){const r=d.size*0.5,cl=(d.clear!==undefined?d.clear:d.size*0.35)+0.05;
  for(let k=0;k<12;k++){const a=rng()*TAU,dd=1+rng()*MOULT.hide,x=p.x+Math.cos(a)*dd,z=p.z+Math.sin(a)*dd,h=groundAt(x,z);if(h>-3)continue;
    T1.set(x,h+cl,z);if(solidPush(T1,r,null,ch,true))continue;T2.set(x,h+cl,z);if(!solidPush(T2,r+2,null,ch,true))continue;p.set(x,h+cl,z);return true;}
  p.y=groundAt(p.x,p.z)+cl;return false;}
function softPrey(c,o){return bodyMass(c.def)>=MOULT.prey*bodyMass(o.def);} // whether c, a hunter, takes o, a soft body (findPrey)
// the soft state's clock: hardened out of sight (a new adult in its place); true when c is gone
function updateSoft(c,dt,dp){c.softT-=dt;if(c.softT>0)return false;if(dp>90||!c.g.visible){harden(c);return true;}c.softT=20;return false;}
function harden(c){const a=spawn(c.chunk,c.kind,c.pos,Math.random,{ent:c.ent,soft:false});a.home.copy(c.home);removeCreature(c);return a;}
// the moult itself, out of sight: the soft twin where the animal was, its cast carapace on the floor beside it
function moult(c){const s=spawn(c.chunk,c.kind,c.pos,Math.random,{ent:c.ent,soft:true});s.home.copy(c.home);dropShed(c.chunk,c.kind,c.pos,c.g.quaternion,c.b.g.scale.x);removeCreature(c);return s;}
const sheds=[]; // the cast carapaces dropped in play (a mesh each, MOULT.shedT days); the old ones are flora (shedFlora)
function dropShed(ch,kind,pos,q,s){const geo=shedGeo(kind);if(!geo)return null;const m=new THREE.Mesh(geo,MAT);m.position.set(pos.x,groundAt(pos.x,pos.z),pos.z);T4.set(0,0,1).applyQuaternion(q);m.rotation.y=Math.atan2(T4.x,T4.z);m.scale.setScalar(s*MOULT.keep);scene.add(m);
  const sh={mesh:m,chunk:ch,t:MOULT.shedT*DAY_S*(0.7+0.6*Math.random())};sheds.push(sh);ch.sheds.push(sh);return sh;}
function removeShed(sh){scene.remove(sh.mesh);let k=sheds.indexOf(sh);if(k>=0)sheds.splice(k,1);k=sh.chunk.sheds.indexOf(sh);if(k>=0)sh.chunk.sheds.splice(k,1);}
function updateSheds(dt){for(let i=sheds.length-1;i>=0;i--){const s=sheds[i];s.t-=dt;if(s.t<=0)removeShed(s);}}
// the cast carapace of a kind: the body built in the shed coat with its valves clamped (st.soft) and flattened to one geometry, the rigs (whips,
// lines: soft parts, not cuticle) left out, lifted so its underside sits at y 0 like any flora; null for a kind that does not moult or is glass
const SHED_GEO={};
function shedGeo(kind){if(kind in SHED_GEO)return SHED_GEO[kind];const sp=SPECS[kind],d=DEFS[kind];if(!sp||!d||sp.mat==='glass'||!moults(kind))return SHED_GEO[kind]=null;
  const b=buildKind(d,kind,'shed');b.anim(0,0,{soft:1});const rigM=new Set();if(b.rigs)for(const r of b.rigs)rigM.add(r.mesh);
  b.g.updateMatrixWorld(true);const pos=[],nor=[],col=[],v=new THREE.Vector3(),nm=new THREE.Matrix3(),lift=d.clear!==undefined?d.clear:d.size*0.35;
  b.g.traverse(o=>{if(!o.isMesh||rigM.has(o)||!o.geometry.attributes.color||o.material.transparent||o.visible===false)return;nm.getNormalMatrix(o.matrixWorld);const pa=o.geometry.attributes.position,na=o.geometry.attributes.normal,ca=o.geometry.attributes.color;
    for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(o.matrixWorld);pos.push(v.x,v.y+lift,v.z);v.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();nor.push(v.x,v.y,v.z);col.push(ca.getX(i),ca.getY(i),ca.getZ(i));}});
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));patternOn(geo,b.pat);
  b.g.traverse(o=>{if(o.geometry)o.geometry.dispose();});return SHED_GEO[kind]=geo;}
// the old sheds as debris: one flora entry per moulting kind that the ledger places (not the strand's, which the surf would take), its density the
// kind's capacity × MOULT.shedPer (under one a cell: one try at that chance, `rare`), placed by every envelope the kind spawns by (`envs`)
function shedFlora(){const byKind={};SPAWN.forEach(e=>{if(e.land||!moults(e.kind)||DEFS[e.kind].role==='boid')return;const k=byKind[e.kind]||(byKind[e.kind]={n:0,envs:[]});k.n+=e.n;k.envs.push(e.env);});
  for(const kind in byKind){const geo=shedGeo(kind);if(!geo)continue;const d=DEFS[kind],K=byKind[kind],dens=K.n*MOULT.shedPer;
    const f={id:'shed_'+kind,shed:kind,geo:geo,mat:MAT,tints:[[1,1,1],[0.94,0.92,0.88],[0.9,0.9,0.86]],s:[MOULT.keep*0.9,MOULT.keep*1.05],sink:0.08,tilt:true,per:Math.max(1,Math.round(dens)),rare:Math.min(1,dens),envs:K.envs,top:d.size*0.6,maxSlope:1.0};
    FLORA.push(f);FLORA_BY_ID[f.id]=f;}}
shedFlora();
function spawn(ch,kind,pos,rng,opt){
  const juv=!!(opt&&opt.juv),D=juv?juvDef(kind):DEFS[kind],EK=ecoOf(kind),ent=opt&&opt.ent!==undefined?opt.ent:-1,vary=ent>=0&&kind!=='lab';
  // the individual (v11.66, above): the size band, the coat class of the place, the soft state; plain outside the ledger
  const k=vary?1+VARY.spread*(2*rng()-1):1,d=k!==1?scaledDef(D,k):D;
  const soft=vary&&!juv&&moults(kind)&&D.role!=='boid'&&(opt&&opt.soft!==undefined?!!opt.soft:rng()<MOULT.frac);
  const f=vary&&ch?ch.f(pos.x,pos.z):null,cls=soft?'soft':f&&SPECS[kind]?coatClassAt(ch.h(pos.x,pos.z),pos.y,f,SPECS[kind].clade):'';
  const b=buildKind(D,kind,cls);if(k!==1){b.g.scale.multiplyScalar(k);b.gape*=k;}
  const c={kind:kind,def:d,g:b.g,anim:b.anim,pos:pos.clone(),vel:V3(0,0,0),home:pos.clone(),hp:d.hp,state:'wander',t0:rng()*100,lastSpd:0,lastYaw:0,roll:0,rollV:0,sq:0,stunSide:rng()<0.5?-1:1,target:null,biteT:0,wanderT:0,wander:pos.clone(),alive:true,gone:false,stun:0,bored:0,cool:rng()*3,scanT:rng()*0.5,alarm:0,fleeT:0,lungeT:0,ramT:0,school:null,off:null,offT:0,chunk:ch,lod:-1,parts:null,lodMeshes:null,sub:1,wet:true,grounded:false,flopT:0,
    b:b,mass:bodyMass(d),bound:0,reach:0,shapesW:null,chainW:null,grab:null,holding:0,hold:null,held:0,bleed:0,paraT:0,stungT:0,hurtN:0,armsLost:0,regrow:null,sickT:0,poison:0,poisT:rng()*2,lungeC:0,missN:0,speedK:1,turnK:1,live:null,lost:null,cWith:null,d6:0,par:creatures.length&1, // hold: the hold it has on something, held: how many have hold of it, bleed: hp still to lose to its wounds (combat.js)
    st:{tell:0,strike:0,jet:false},tellT:0,strikeT:0,recoverT:0,burstT:rng()*2,face:null,bit:false,accT:0,threat:null,
    ent:ent,hunger:EK.hunter?rng():0,starveT:0,hunt:0,feedT:0,feedAt:null,dead:false,flesh:0,deadT:0,scav:null,scavT:rng()*0.5,juv:juv?EK.grow*DAY_S*(0.8+0.4*rng()):0, // ent: the ledger entry; hunger 0 fed..1 starving (ecology.js); juv: seconds until it grows up // st: what the anim reads (creatures_builders.js); the tell and the strike as clocks
    k:k,cls:cls,soft:soft,softT:soft?MOULT.soft*Math.pow(EK.mass,0.25)*DAY_S*(0.7+0.6*rng()):0,moultT:vary&&!soft&&!juv&&moults(kind)&&D.role!=='boid'?MOULT.every*Math.pow(EK.mass,0.25)*DAY_S*(0.5+rng()):0}; // the individual (v11.66): its size factor, its coat class, the soft state and its clocks
  if(soft){c.b.cover=b.cover.map(()=>'skin');c.st.soft=1;c.state='sit';hideSpot(ch,c.pos,rng,d);c.home.copy(c.pos);}
  b.g.position.copy(c.pos);scene.add(b.g);
  // far LOD: the whole creature flattened into one mesh per material, hidden until needed
  c.parts=b.g.children.slice();
  // the far pose (v11.18): the rigs posed by the creature's own idle anim and skinned at rest before the bake, so a far lurker's arms
  // lie as they will when simulated and a far sailer's lines hang straight — they held the build pose (armRing's 0.3 rad spread:
  // arms raised, lines splayed) until the near LOD switched them on, which read as floating and then falling
  if(b.anim)b.anim(0,0,c.st);if(b.rigs)for(const r of b.rigs)rigRest(r);
  const gk=kind+(juv?'~':'')+(cls?'@'+cls:''),K=kind==='lab'?null:(KIND_GEO[gk]||(KIND_GEO[gk]={geos:[],lod:null})); // a geometry per kind, age and coat class (v11.66)
  if(K){const rigMeshes=new Set();if(b.rigs)for(const r of b.rigs)rigMeshes.add(r.mesh);let n=0;
    b.g.traverse(o=>{if(!o.isMesh||rigMeshes.has(o))return;const g=K.geos[n++];if(g){if(o.geometry!==g){o.geometry.dispose();o.geometry=g;}}else{K.geos[n-1]=o.geometry;SHARED_GEO.add(o.geometry);}});}
  if(K&&K.lod)c.lodMeshes=K.lod.map(e=>{const m=new THREE.Mesh(e.geo,e.mat);m.visible=false;return m;});
  else{c.lodMeshes=bakeLOD(b.g);if(K)K.lod=c.lodMeshes.map(m=>{SHARED_GEO.add(m.geometry);return {geo:m.geometry,mat:m.material};});}
  for(const m of c.lodMeshes){if(d.size>=6&&m.material===MAT)m.material=MATBIG;patternOn(m.geometry,b.pat);b.g.add(m);} // a big animal's far LOD keeps the far ghost (scene.js, addTint)
  c.shM=[];b.g.traverse(o=>{if(o.isMesh)c.shM.push(o);});c.cast=false; // the meshes that cast into the shadow map when this body is among the nearest (scene.js updateShadow)
  c.lodNear=(d.lodNear||45+d.size*4)*Q.lodNear;c.lodFar=Math.min(FAR*0.7,120+d.size*40); // lodNear on the def (v11.18): the long-appendaged are simulated from further off; a veil is drawn to 760, an abyssal to 720
  creatures.push(c);ch.creatures.push(c);return c;
}
function setLOD(c,level){
  if(c.lod===level)return;c.lod=level;
  const near=level===0;
  for(const p of c.parts)p.visible=near;
  for(const m of c.lodMeshes)m.visible=!near&&c.lodMeshes.length>0;
  if(!near&&c.lodMeshes.length===0)for(const p of c.parts)p.visible=true; // no bakeable parts: keep the real thing, just stop animating
}
// A school is a loose ribbon (the boid role): its members flock among themselves and follow the school's wandering target;
// the school's pos is the members' mean. sp: the spread they start in, in units of the member's size.
function* makeSchool(ch,kind,p,n,rng,opt){ // a generator (v11.12): one member a step of the cell's build
  const s={pos:p.clone(),home:p.clone(),target:p.clone(),t:0,chunk:ch,members:[],threat:null,scanT:0};schools.push(s);ch.schools.push(s);
  const sz=DEFS[kind].size*3;
  for(let i=0;i<n;i++){const c=spawn(ch,kind,p.clone().add(V3((rng()-0.5)*sz,(rng()-0.5)*sz*0.4,(rng()-0.5)*sz)),rng,opt);c.school=s;s.members.push(c);c.vel.set((rng()-0.5)*2,0,(rng()-0.5)*2);yield;}
}
function disposeCreature(c){c.alive=false;c.gone=true;releaseAll(c);scene.remove(c.g);c.g.traverse(o=>{if(o.geometry&&!SHARED_GEO.has(o.geometry))o.geometry.dispose();});} // a kind's shared body and bake stay (spawn)
// a creature leaving the world mid-life (eaten away, grown up): disposed and struck from every list it is on
function removeCreature(c){disposeCreature(c);let k=creatures.indexOf(c);if(k>=0)creatures.splice(k,1);if(c.chunk){k=c.chunk.creatures.indexOf(c);if(k>=0)c.chunk.creatures.splice(k,1);}
  if(c.school){k=c.school.members.indexOf(c);if(k>=0)c.school.members.splice(k,1);}k=carcasses.indexOf(c);if(k>=0)carcasses.splice(k,1);}
// a juvenile grows up: the adult is spawned in its place with its ledger entry, school and state, and the small one goes
function growUp(c){const ch=c.chunk,a=spawn(ch,c.kind,c.pos,Math.random,{ent:c.ent});a.vel.copy(c.vel);a.home.copy(c.home);a.g.quaternion.copy(c.g.quaternion);a.hunger=c.hunger;
  if(c.school){a.school=c.school;c.school.members.push(a);}if(c.state==='sit'){a.state='sit';}removeCreature(c);return a;}

// ---------- steering ----------
function seek(c,target,speed,dt,accel){speed*=slowOf(c);T1.copy(target).sub(c.pos);const L=T1.length();if(L<0.001)return;T1.multiplyScalar(speed/L);curComp(c,T1,speed);c.vel.lerp(T1,1-Math.exp(-accel*dt));}
// the way through the water that gives the wanted way over the ground in this current, no faster than CUR_FIGHT times the speed asked
const CUR_FIGHT=1.2;
function curComp(c,v,speed){if(!c.carried||!c.cur)return;v.sub(c.cur);const l=v.length(),m=speed*CUR_FIGHT;if(l>m)v.multiplyScalar(m/l);}
function seekAway(c,from,speed,dt){speed*=slowOf(c);T1.copy(c.pos).sub(from);T1.y*=0.3;const L=T1.length()||1;T1.multiplyScalar(speed/L);c.vel.lerp(T1,1-Math.exp(-2*dt));}
function setWander(c){
  const d=c.def,R=d.home||30;let p,fh;
  for(let k=0;k<6;k++){ // swimmers steer for wet ground only; a legged creature goes where it likes
    p=c.home.clone().add(V3(rnd(-R,R),0,rnd(-R,R)));p.x=clamp(p.x,-HALF+30,HALF-30);p.z=clamp(p.z,-HALF+30,HALF-30);
    fh=groundAt(p.x,p.z);if(d.legs||fh<-3-d.size*0.6)break;
  }
  if(d.floor)p.y=fh+rnd(0.5,2.5)+d.size*0.4;
  else if(d.deep)p.y=clamp(c.home.y+rnd(-60,60),fh+8,CHEMO-8); // the pall: below the chemocline, off the mud
  else if(fh<CHEMO)p.y=clamp(c.home.y+rnd(-80,80),-420,-30);
  else p.y=clamp(fh+rnd(4,d.cruise||30),fh+3,-4-d.size*0.4);
  c.wander.copy(p);c.wanderT=rnd(6,14);
}
function wander(c,dt){c.wanderT-=dt;if(c.wanderT<=0||c.pos.distanceTo(c.wander)<3)setWander(c);const k=burstK(c,dt);seek(c,c.wander,c.def.speed*(c.def.cruiseF||0.45)*k,dt,0.8*k);}
function findPrey(c,R){
  const d=c.def;let best=null,bd=1e9;if(R===undefined)R=d.detect;
  if(d.prey.indexOf('player')>=0&&!player.dead&&player.inkT<=0&&(!d.preyClade||(player.clade&&player.clade.id===d.preyClade))){const dp=c.pos.distanceTo(player.pos);if(dp<R){best=player;bd=dp*0.7;}}
  for(const o of creatures){if(!o.alive||o===c)continue;if(d.prey.indexOf(o.kind)<0&&!(o.soft&&softPrey(c,o)))continue;const dd=c.pos.distanceTo(o.pos);if(dd<R&&dd<bd){bd=dd;best=o;}} // a soft body of any kind is prey to a hunter big enough (v11.66, MOULT)
  return best;
}
// The kill (v11.26): the ledger is debited and nothing comes back. Eaten whole (the player's bite, a small prey in a big mouth) the
// body goes; otherwise it is a carcass — it stays in the scene, sinks, lies on its side, and is eaten away (updateCarcass) by what
// killed it, by the scavengers it draws and by the water, ECO.carc days untouched. `by` is what killed it: it feeds
function kill(c,by,whole){if(!c.alive)return;c.alive=false;c.target=null;c.grab=null;c.threat=null;c.scav=null;c.bleed=0;c.paraT=0;releaseAll(c);ecoDebit(c);POP.kills++;
  const mass=bioMass(c.def);
  if(by&&by!==player){const K=ecoOf(by.kind),food=ecoOf(c.kind).food;if(c.poison>POISON.min&&!by.def.immune)sicken(by);else{by.hunger=Math.max(0,by.hunger-food/K.meal);by.starveT=0;}if(mass<=K.meal*0.35)whole=true;} // a body fed at the seeps is no meal: the eater is sick (combat.js POISON, v11.56)
  if(whole||c.def.role==='boid'&&c.def.size<0.5){removeCreature(c);return;}
  c.dead=true;c.flesh=mass;c.deadT=0;c.vel.multiplyScalar(0.3);carcasses.push(c);
  _q.setFromAxisAngle(V3(0,0,1),c.t0>50?HPI:-HPI);c.lieQ=c.g.quaternion.clone().multiply(_q); // rolled onto its side
  if(c.b.rigs)for(const r of c.b.rigs)rigRest(r);
  if(by&&by!==player){by.state='feed';by.feedAt=c;by.feedT=12+mass*0.4*(1+Math.random());by.target=null;by.grab=null;}
}
// a carcass: sinks at a body's terminal fall, settles, decays; a scavenger or its killer at it eats it faster (c.flesh)
function updateCarcass(c,dt,dp){
  c.deadT+=dt;if(!c.grounded){c.vel.y=Math.max(c.vel.y-1.2*dt,-1.6);c.vel.x*=Math.exp(-0.8*dt);c.vel.z*=Math.exp(-0.8*dt);}else c.vel.set(0,0,0);
  c.pos.addScaledVector(c.vel,dt);const fh=groundAt(c.pos.x,c.pos.z)+c.def.size*0.3;c.grounded=false;if(c.pos.y<fh){c.pos.y=fh;c.vel.y=0;c.grounded=true;}
  if(c.lieQ)c.g.quaternion.slerp(c.lieQ,1-Math.exp(-1.5*dt));c.g.position.copy(c.pos);
  const mass=bioMass(c.def);c.flesh-=mass*dt/(ECO.carc*DAY_S);
  const vis=dp<c.lodFar;c.g.visible=vis;if(vis){visibleCreatures++;setLOD(c,dp<c.lodNear?0:1);if(dp<90)nearList.push(c);} // a body to push against
  if(c.flesh<=0||c.deadT>ECO.carc*DAY_S*1.5){POP.eaten+=1;removeCreature(c);}
}
// eating at a carcass: a mouthful a second scaled to the eater; the eater's hunger falls with it
function eatAt(o,c,dt){if(c.poison>POISON.min&&!o.def.immune){if(!(o.sickT>0))sicken(o);return;} // a poisoned carcass sickens its scavenger (v11.56)
  const om=bioMass(o.def),K=ecoOf(o.kind),bite=(K.hunter?Math.min(om/75,K.meal/20):om/40)*dt;c.flesh-=bite;if(o.hunger>0){o.hunger=Math.max(0,o.hunger-bite/ecoOf(o.kind).meal);o.starveT=0;}}
// the nearest carcass within R of o, still worth eating
function findCarcass(o,R){let best=null,bd=R;for(const c of carcasses){if(c.gone||c.flesh<=0)continue;const d=o.pos.distanceTo(c.pos);if(d<bd){bd=d;best=c;}}
  for(const g of eggs){if(g.gone||g.flesh<=0||g.kind===o.kind)continue;const d=o.pos.distanceTo(g.pos);if(d<bd*0.5){bd=d;best=g;}}return best;} // a clutch too (not its own kind's), from half the distance

// ---------- behaviours ----------
// Burst and coast (PLANET, hingeshells: paddles in a metachronal wave; nothing they do is a steady swim): a hunter or wanderer
// with d.burst {on, off} runs its speed and accel on a duty cycle — full for `on` seconds, then a coast for `off` where it only
// holds a third of the speed with little steering. The anim sees the speed pulse, so the flaps beat and rest with it.
function burstK(c,dt){const b=c.def.burst;if(!b)return 1;c.burstT-=dt;if(c.burstT<=-b.off)c.burstT=b.on;return c.burstT>0?1:0.3;}
// Reach against contact (v11.31.1, analysis_review 2). `reach` in DEFS is centre-to-centre, and the comment there has always said it
// must exceed the contact distance of the two bodies — but it did not: measured off the hit capsules, 44 of the 52 predator/prey
// pairs had a reach shorter than the distance the two shapes force (basker 4.6 against 8.1 of body to the player, abyssal 10
// against 14, arrow 0.9 against 1.3 of a darter). resolveBodies keeps the capsules apart, so near the player every hunt was a
// shove that never became a bite; off screen, where nothing pushes bodies apart, the same bite landed at once. The numbers in DEFS
// stay what they are — an animal's own reach, what it can bite past its nose — and the test asks for the larger of that and what
// the two bodies actually measure. Measured once per body from the same capsules physics.js uses; a juvenile is built smaller, so
// it is cached on the creature, not the kind.
const BITE_M=0.3; // m past the two bodies' contact: the margin the jaws close over
function bodyExt(o){
  if(o.hitN!==undefined)return o;
  const hit=(o.b&&o.b.hit)||[],s=(o.b&&o.b.g?o.b.g.scale.x:1)||1;let n=0,b=0;
  for(const h of hit)for(const p of [h.a,h.b]){const f=(p[2]+h.r)*s;if(f>n)n=f;const d=(len3(p[0],p[1],p[2])+h.r)*s;if(d>b)b=d;}
  const sz=(o.def?o.def.size:1)*0.6;o.hitN=n||sz;o.hitB=b||sz;return o;
}
// the centre-to-centre distance at which c's bite lands on tg: its own reach, never less than where the two bodies touch
function reachOf(c,tg){return Math.max(c.def.reach||0,bodyExt(c).hitN+bodyExt(tg).hitB+BITE_M);}
// the arms reaching for prey: as wide as it was (reach × k plus the prey's half-length), floored by the same contact
function armReach(c,tg,k){return Math.max((c.def.reach||0)*k,reachOf(c,tg))+(tg.def?tg.def.size:1)*0.5;}
// One place to let go of what a creature wants (v11.31.1, analysis_review 5): the ink, the stun, the player's death, a lost chase and
// a kill each cleared a different subset and left c.grab pointing at the old target, so a rigged hunter's arms went on reaching for
// the player out of wander. Everything that ends a pursuit goes through here.
function dropTarget(c,cool){
  c.target=null;c.grab=null;c.bored=0;c.tellT=0;c.strikeT=0;c.face=null;c.chaseT=0;c.lungeC=0;
  if(c.hold)releaseHold(c.hold);
  if(cool!==undefined)c.cool=cool;
  if(c.state!=='feed'&&c.state!=='sit'){c.state=c.def.role==='ambush'?'return':'wander';if(c.state==='wander')setWander(c);}
}
// The bite that lands (v11.31: combat.js): forage dies at the touch; anything that can fight is taken hold of, and the hold bites
function landBite(c,tg){if(tg)combatBite(c,tg);} // the guard is here and not at the four call sites: dropTarget can null a target mid-strike (v11.33)
// Hunger (v11.26): a hunter's clock runs from fed (0) to starving (1) over its kind's cycle (ecology.js) and it hunts only past
// ECO.hungry — a fed ridge cruises past the player; a kill sets it back by the prey's mass over its meal; at 1 it starves, and
// past a cycle and a fifth of that it dies (a carcass). The feed state: it stays at a carcass it made and eats
const ECO_CHASE=9; // seconds a hunter keeps after prey that is not the player
// Casting for prey (v11.31.2, analysis_review 13): the nearest animal a hunter eats sits 40-48 m off on the shelf against a detect of
// 9-17, so a wandering hunter only ever met prey by accident — a tenth of them sat at hunger 1.00 with a school two cells away and
// starved 0 all session. The eyes are the ring's (PLANET: 360 degrees, motion); past them a hunter has the water itself — scent and the
// pressure a shoal makes — so past ECO.hungry the scan already running goes out to HUNT_SEEK times detect and, when what it finds is too
// far to chase, steers the wander at it instead of at a random point. The same one findPrey call: the wider radius costs nothing. The cast
// runs at HUNT_CAST of the animal's speed and not at its cruise: a stern chase at the cruise (0.45-0.5 of speed) never closed on a school
// drifting at its own — the first build of this cast held 44 m for a minute and a half — and a hunt is worth the energy. It casts only at
// prey within HUNT_HOME of its own home, so a hunter stays the resident of its patch, the shelf's predators do not all drain toward
// whatever school the player is swimming in, and the chase that follows is inside the leash that drops one (1.9 of home, below): a cast
// that ended outside it was dropped in the same frame it began.
const HUNT_SEEK=4,HUNT_HOME=1.5,HUNT_CAST=0.8;
function hungerTick(c,dt){const K=ecoOf(c.kind);c.hunger=Math.min(1,c.hunger+dt/(K.cycle*DAY_S));if(c.hunger>=1){c.starveT+=dt;if(c.starveT>K.cycle*DAY_S*1.2){POP.starved+=1;kill(c,null);return true;}}return false;}
function updateHunter(c,dt){
  const d=c.def;
  if(hungerTick(c,dt))return; // the stun is every role's now, before the roles (updateCreatures, v11.66)
  if(c.state==='feed'){const f=c.feedAt;c.feedT-=dt;if(!f||f.gone||f.flesh<=0||c.feedT<=0||c.hunger<=0){c.state='wander';c.feedAt=null;c.cool=d.cool||4;setWander(c);return;}
    const dist=c.pos.distanceTo(f.pos),at=reachOf(c,f);if(dist>at*0.9)seek(c,f.pos,d.speed*0.35,dt,1.5);else{c.vel.multiplyScalar(1-3*dt);eatAt(c,f,dt);}c.face=dist<at*1.5?f.pos:null;return;}
  if(c.state==='flee'){c.grab=null;c.fleeT-=dt;if(c.fleeT<=0)c.state='wander';seekAway(c,player.pos,d.speed,dt);return;}
  c.scanT-=dt;c.cool-=dt;
  if(c.state==='chase'){
    const tg=c.target;const tpos=tg===player?player.pos:tg.pos;const dist=c.pos.distanceTo(tpos);
    const ashore=tg&&tg.grounded&&tg.sub<0.5&&!d.legs; // prey on the strand is out of reach: the sea ends here
    // the chase (v11.26): a burst — the hunter runs at chaseK times its speed for the first seconds and tires to a cruise — and it gives up a
    // pursuit that has run ECO_CHASE seconds without a bite (a real pursuit is short; prey with a flee speed at its hunter's cruise outran
    // every hunter for good before this, and no hunt in the game ever ended in a meal). The clock stops while it has hold of the prey (v11.31)
    if(!c.hold)c.chaseT=(c.chaseT||0)+dt;const chaseK=tg===player?1:1+0.6*smooth(6,2,c.chaseT);
    const lost=!tg||(tg!==player&&!tg.alive)||ashore||dist>(bleeding(tg)?Math.max(d.detect*1.6,SMELL_R*1.2):d.detect*1.6)||(tg===player&&(player.dead||(player.inkT>0&&dist>3.5)))||c.bored>2||c.pos.distanceTo(c.home)>(d.home||30)*1.9||(tg!==player&&c.chaseT>ECO_CHASE);
    if(lost){dropTarget(c,d.cool||4);}
    else if(d.strike){
      // the strike (PLANET, hingeshells; the platebacks' bite): in range, the tell first — it slows, cocks and turns to the prey —
      // then a burst at the prey with the strike pose on, the bite landing once if it gets within reach; then the cooldown
      const S=d.strike;c.biteT-=dt;
      if(c.strikeT>0){c.strikeT-=dt;c.st.strike=1;seek(c,tpos,S.speed,dt,8);if(!c.bit&&dist<reachOf(c,tg)){c.bit=true;if(dodged(tpos,c.strikeP,c.strikeN)<missWin(tg,S.dur))landBite(c,tg);else missed(c,tg);}if(c.strikeT<=0){c.biteT=d.biteCD||1.5;c.grab=null;}} // the strike is the commit: prey that has moved its own width since it began is missed (v11.56)
      else if(c.tellT>0){c.tellT-=dt;c.st.tell=Math.min(1,c.st.tell+dt/S.tell*1.5);c.vel.multiplyScalar(1-3*dt);c.face=tpos;if(c.tellT<=0){c.strikeT=S.dur;c.bit=false;c.face=null;[c.strikeP,c.strikeN]=commitAt(c,tpos,c.strikeP,c.strikeN);}}
      else{const k=burstK(c,dt)*chaseK;seek(c,tpos,d.speed*k,dt,2.2*k);c.grab=null;
        if(dist<reachOf(c,tg)*(S.range||1.6)&&c.biteT<=0){c.tellT=S.tell;c.st.tell=0;}}
      if(c.strikeT>0)c.grab=(c.b.rigs&&dist<armReach(c,tg,1.3))?tg:null;
    }
    else{
      const k=burstK(c,dt)*chaseK;seek(c,tpos,d.speed*k,dt,2.2*k);c.biteT-=dt;
      c.grab=(c.b.rigs&&dist<armReach(c,tg,1.3))?tg:null; // the arms reach for prey in range and close on it (physics.js)
      // the commit (v11.56, COMBAT.md §5): in reach, the mouth opens (the tell) and the bite lands MISS.t later — on the prey if it has moved under its own
      // width since and is still in reach, on water if it dodged; a miss costs the hunter MISS.cool cooldowns. The escape reflex as a rule
      if(c.lungeC>0){c.lungeC-=dt;c.st.strike=1;c.vel.multiplyScalar(1-3*dt);if(c.lungeC<=0){c.lungeC=0;c.biteT=d.biteCD||1.2;if(dist<reachOf(c,tg)*MISS.range&&dodged(tpos,c.lungeP,c.lungeN)<missWin(tg,MISS.t))landBite(c,tg);else missed(c,tg);}}
      else if(dist<reachOf(c,tg)&&c.biteT<=0){c.lungeC=MISS.t;[c.lungeP,c.lungeN]=commitAt(c,tpos,c.lungeP,c.lungeN);c.st.strike=1;}
    }
  }else{
    if(c.scanT<=0){c.scanT=0.4;c.hunt=0;if(c.cool<=0&&c.hunger>ECO.hungry){const tb=findBleeding(c,SMELL_R);if(tb){c.state='chase';c.target=tb;c.bored=0;c.chaseT=0;}else{const tg=findPrey(c,d.detect*HUNT_SEEK); // the blood first (combat.js, v11.56): a bleeding body it eats within SMELL_R is the chase, past its eyes
      if(tg){const tp=tg===player?player.pos:tg.pos,dd=c.pos.distanceTo(tp);
        if(dd<d.detect){c.state='chase';c.target=tg;c.bored=0;c.chaseT=0;} // seen: the chase
        else if(tp.distanceTo(c.home)<(d.home||30)*HUNT_HOME){c.wander.copy(tp);c.wanderT=rnd(4,8);c.hunt=1;}}}}} // sensed: swim that way and look again
    if(c.hunt){const k=burstK(c,dt);seek(c,c.wander,d.speed*HUNT_CAST*k,dt,1.2*k);}else wander(c,dt);
  }
}
// Sit and strike (the trap, the stone): buried or lying on its floor, it never moves. Prey within `radius` starts the tell — the
// eyestalks rise, it swivels to face the prey — then the strike: the arms unfold or the jaw drops, and anything within reach
// takes the bite. Then it settles for `cool` seconds. A sitting one is as heavy as a rock for contact (updateCreatures).
function updateTrap(c,dt){
  const d=c.def,S=d.strike;c.vel.set(0,0,0);c.cool-=dt;
  if(c.strikeT>0){c.strikeT-=dt;c.st.strike=1;const tg=c.target;if(tg&&!c.bit){const tpos=tg===player?player.pos:tg.pos;if(c.pos.distanceTo(tpos)<reachOf(c,tg)&&(tg===player||tg.alive)){c.bit=true;if(!c.strikeP||dodged(tpos,c.strikeP,c.strikeN)<missWin(tg,S.dur))landBite(c,tg);else missed(c,tg);}}if(c.strikeT<=0){c.cool=d.cool||2;c.face=null;if(!c.hold)c.target=null;c.state='sit';}return;} // v11.31: the target stays while it is held
  if(c.tellT>0){c.tellT-=dt;c.st.tell=Math.min(1,c.st.tell+dt/S.tell*1.5);const tg=c.target;if(tg)c.face=tg===player?player.pos:tg.pos;if(c.tellT<=0){c.strikeT=S.dur;c.bit=false;if(tg)[c.strikeP,c.strikeN]=commitAt(c,c.face,c.strikeP,c.strikeN);}return;}
  c.scanT-=dt;if(hungerTick(c,dt))return;if(c.scanT<=0){c.scanT=0.25;if(c.cool<=0&&c.hunger>ECO.hungry*0.4){const tg=findPrey(c);if(tg){c.target=tg;c.tellT=S.tell;c.st.tell=0;c.state='strike';}}} // a trap strikes at most things (a reflex), but not on a full stomach
}
// The watcher (PLANET: a curious omnivore that never attacks and never flees far): wanders the floor; within `detect` of the
// player it walks up to a standoff of `stand` and holds there facing the player, following if they move, backing off if they
// come closer than half the standoff, and drifting back to its wander when they leave.
function updateWatcher(c,dt){
  const d=c.def,dp=player.dead?1e9:c.pos.distanceTo(player.pos),stand=d.stand||6;
  if(c.state!=='curious'){if(dp<d.detect&&mode==='play'){c.state='curious';}else{c.face=null;if(!scavenge(c,dt))wander(c,dt);return;}}
  if(dp>d.detect*1.4||player.dead){c.state='wander';c.face=null;setWander(c);return;}
  T1.copy(c.pos).sub(player.pos);T1.y=0;const L=T1.length()||1;T1.multiplyScalar((dp<stand*0.55?stand*1.5:stand)/L).add(player.pos);
  T1.y=groundAt(T1.x,T1.z)+d.size*0.35+0.4;
  const far=c.pos.distanceTo(T1);if(far>1.5)seek(c,T1,Math.min(d.speed,far*0.8),dt,1.6);else c.vel.multiplyScalar(1-3*dt);
  c.face=far<4?player.pos:null;
}
// A boid (the flicker, the darter): steers toward the school's target, aligns with and gathers to the members near it, keeps
// apart from the close ones, and flees the player and anything that eats its kind. Only its own school's members count, so a
// ribbon of seven costs forty-two distances. v4's fixed offsets from a school centre read as a block; this is the ribbon.
function updateBoid(c,dt){
  const s=c.school,d=c.def,R=d.size*14,R2=R*R,Rs=d.size*4.5;let ax=0,ay=0,az=0,cx=0,cy=0,cz=0,sx=0,sy=0,sz=0,n=0;
  for(const o of s.members){if(o===c||!o.alive)continue;const dx=o.pos.x-c.pos.x,dy=o.pos.y-c.pos.y,dz=o.pos.z-c.pos.z,d2=dx*dx+dy*dy+dz*dz;if(d2>R2)continue;n++;ax+=o.vel.x;ay+=o.vel.y;az+=o.vel.z;cx+=dx;cy+=dy;cz+=dz;
    if(d2<Rs*Rs){const dd=Math.sqrt(d2)||0.01,f=(Rs-dd)/(dd*Rs);sx-=dx*f;sy-=dy*f;sz-=dz*f;}}
  T3.copy(s.target).sub(c.pos);const L=T3.length()||0.01;T3.multiplyScalar(Math.min(1,L/6)/L);
  if(n){const iv=0.5/(n*d.speed),ic=0.3/(n*R);T3.x+=ax*iv+cx*ic+sx*1.0;T3.y+=ay*iv+cy*ic+sy*1.0;T3.z+=az*iv+cz*ic+sz*1.0;}
  T3.x+=0.35*Math.sin(t*1.1+c.t0);T3.y+=0.15*Math.sin(t*0.9+c.t0*1.7);T3.z+=0.35*Math.cos(t*1.3+c.t0*0.6); // its own wander, so the ribbon frays and re-forms
  let fl=0;if(!player.dead){const dd=c.pos.distanceTo(player.pos);if(dd<6){T2.copy(c.pos).sub(player.pos).normalize().multiplyScalar(2);T3.add(T2);fl=1;}}
  if(s.threat){const dd=c.pos.distanceTo(s.threat);if(dd<8){T2.copy(c.pos).sub(s.threat).normalize().multiplyScalar(2);T3.add(T2);fl=1;}} // the school scans for hunters; a member only reads the answer
  T3.y*=0.5;const M=T3.length()||0.01,sp=fl?d.flee:d.speed*Math.min(1,0.35+M);T3.multiplyScalar(sp/M);curComp(c,T3,sp);
  c.vel.lerp(T3,1-Math.exp(-3.5*dt));
}
// The schools: a wandering target near home (fleeing threats), and the school's position as its members' mean.
function updateSchools(dt){
  for(const s of schools){
    let n=0;T1.set(0,0,0);for(const c of s.members)if(c.alive){n++;T1.add(c.pos);}if(n)s.pos.copy(T1.multiplyScalar(1/n));
    s.t-=dt;
    if(s.t<=0||s.pos.distanceTo(s.target)<3){s.t=rnd(5,12);const p=s.home.clone().add(V3(rnd(-30,30),0,rnd(-30,30)));const fh=groundAt(p.x,p.z),mid=s.members.length&&s.members[0].def.mid;p.y=fh<CHEMO?clamp(s.home.y+rnd(-30,30),-400,-20):mid?clamp(s.home.y+rnd(-12,12),fh+8,-8):clamp(fh+rnd(1.5,8),fh+1.5,-3);s.target.copy(p);} // mid (v11.66): a swarm of the water column keeps its own depth
    // threats: the player, and any hunter of the members' kind, scanned four times a second (every member reading every creature
    // was a thousand by a thousand a frame)
    s.scanT=(s.scanT||0)-dt;if(s.scanT<=0){s.scanT=0.25;let th=null,td=14;const kind=s.members.length?s.members[0].kind:'';
      if(!player.dead){const d=s.pos.distanceTo(player.pos);if(d<td){th=player.pos;td=d;}}
      for(const c of creatures){if(!c.alive||!c.def.prey||c.def.prey.indexOf(kind)<0)continue;const d=s.pos.distanceTo(c.pos);if(d<td){th=c.pos;td=d;}}
      s.threat=th;}
    const th=s.threat;
    if(th){T2.copy(s.pos).sub(th);T2.y*=0.2;T2.normalize().multiplyScalar(12);s.target.copy(s.pos).add(T2);const fh=groundAt(s.target.x,s.target.z);s.target.y=clamp(s.target.y,fh+1.5,-3);s.t=Math.min(s.t,2);}
  }
}
function updateGrazer(c,dt){
  const d=c.def;
  if(d.calm){wander(c,dt);return;} // the tread: nothing hunts it, so nothing moves it
  // threats, scanned three times a second (a hundred grazers reading a thousand creatures a frame was the frame's biggest cost)
  c.scanT-=dt;if(c.scanT<=0){c.scanT=0.3;let threat=null;
    if(!player.dead&&c.pos.distanceTo(player.pos)<8)threat=player.pos;
    if(!threat)for(const o of creatures){if(!o.alive||!o.def.prey)continue;const big=o.def.size>=6;if((big||o.def.prey.indexOf(c.kind)>=0)&&c.pos.distanceTo(o.pos)<(big?18:7)){threat=o.pos;break;}}
    c.threat=threat;}
  const threat=c.threat;
  if(threat){seekAway(c,threat,d.flee,dt);c.alarm=2.5;c.scav=null;}
  else if(c.alarm>0){c.alarm-=dt;c.vel.multiplyScalar(1-0.8*dt);}
  else if(!scavenge(c,dt))wander(c,dt);
}
// A scavenger (def.scav: the distance it smells a carcass from — the picker 90, the watcher 50, the crusher 40, the scuttle 30, the
// rasp 12) walks to the nearest carcass in range and eats at it until it is gone; true while it is at that
function scavenge(c,dt){const d=c.def;if(!d.scav)return false;
  c.scavT-=dt;if(c.scavT<=0){c.scavT=0.6;if(!c.scav||c.scav.gone||c.scav.flesh<=0)c.scav=findCarcass(c,d.scav);}
  const f=c.scav;if(!f)return false;const dist=c.pos.distanceTo(f.pos),at=d.size*0.9+f.def.size*0.7;
  if(dist>at)seek(c,f.pos,d.speed*0.7,dt,1.4);else{c.vel.multiplyScalar(1-3*dt);eatAt(c,f,dt);c.face=f.pos;}return true;}
function updateCoil(c,dt){
  const d=c.def;c.cool-=dt;const dist=c.pos.distanceTo(player.pos);
  if(c.state==='ram'){c.ramT-=dt;seek(c,player.pos,d.ram,dt,3);c.biteT-=dt;if(dist<reachOf(c,player)&&c.biteT<=0){c.biteT=2;wound(player,d.dmg,c,null,'snap');}if(c.ramT<=0||player.dead){c.state='wander';c.cool=8;setWander(c);}}
  else{if(dist<d.radius&&c.cool<=0&&!player.dead){c.state='ram';c.ramT=3.5;}wander(c,dt);}
}
// the ambushers (the lurker, the hook) lunge at their prey (v11.26: a prey list, not only the player), when hungry
function updateLurker(c,dt){
  const d=c.def;if(hungerTick(c,dt))return;
  if(c.state==='sit'){c.vel.set(0,0,0);c.cool-=dt;c.scanT-=dt;if(c.scanT<=0){c.scanT=0.25;if(c.cool<=0&&c.hunger>ECO.hungry){const tg=findPrey(c,d.radius);if(tg){c.state='lunge';c.target=tg;c.lungeT=1.3;}}}}
  else if(c.state==='lunge'){const tg=c.target,tp=tg===player?player.pos:tg?tg.pos:c.home,dist=c.pos.distanceTo(tp);c.lungeT-=dt;seek(c,tp,d.lunge,dt,6);c.biteT-=dt;c.grab=c.b.rigs&&tg&&dist<armReach(c,tg,1.6)?tg:null;if(d.hang||d.strikeOnLunge)c.st.strike=1; // strikeOnLunge (v11.66): the hood's claws open on the way up
    if(c.lungeC>0){c.lungeC-=dt;c.vel.multiplyScalar(1-2*dt);if(c.lungeC<=0){c.lungeC=0;c.biteT=1;if(tg&&dist<reachOf(c,tg)*MISS.range&&dodged(tp,c.lungeP,c.lungeN)<missWin(tg,MISS.t))landBite(c,tg);else if(tg)missed(c,tg);if(c.state!=='feed')c.state='return';}} // the lunge's commit (v11.56)
    else if(tg&&dist<reachOf(c,tg)&&c.biteT<=0){c.lungeC=MISS.t;[c.lungeP,c.lungeN]=commitAt(c,tp,c.lungeP,c.lungeN);}if((c.lungeT<=0&&!(c.lungeC>0))||!tg||(tg!==player&&!tg.alive)||(tg===player&&player.dead)){c.state='return';c.lungeC=0;}}
  else if(c.state==='feed'){const f=c.feedAt;c.feedT-=dt;if(!f||f.gone||f.flesh<=0||c.feedT<=0){c.state='return';c.feedAt=null;return;}const dist=c.pos.distanceTo(f.pos);if(dist>reachOf(c,f)*0.8)seek(c,f.pos,3,dt,2);else{c.vel.multiplyScalar(1-3*dt);eatAt(c,f,dt);}}
  else{c.grab=null;if(!c.hold)c.target=null;seek(c,c.home,4,dt,2);if(c.pos.distanceTo(c.home)<0.8){c.state='sit';c.cool=3;c.pos.copy(c.home);}} // v11.31: what it has hold of comes home with it
  if(c.state==='flee')c.state='return';
}
function updateJelly(c,dt){
  const k=c.def.size>3?0.5:1;c.vel.set(0.3*k*Math.sin(t*0.3*k+c.t0),0.15*k*Math.sin(t*0.5*k+c.t0),0.3*k*Math.cos(t*0.27*k+c.t0));
  c.biteT-=dt;if(c.def.dmg>0&&!player.dead&&c.biteT<=0&&c.pos.distanceTo(player.pos)<Math.max((c.def.reach||0)+1,reachOf(c,player))){c.biteT=0.6;stingPlayer();}
}
// The sailer (DRIFTERS.md): rides the wave (the surface rule below), carried by the current like everything, and sails at ~5% of the
// wind at 40° off downwind — left- or right-handed by the animal, so one wind sorts a fleet two ways. The whole animal is yawed to its
// heading (the float's axis is +z); the lines are posed to stream against its way through the water (the current carries both, so only
// the sail's push counts), in the animal's frame. The lines sting: within def.lines of any simulated line point the player takes dmg.
function updateSailer(c,dt){
  const d=c.def,W=SKY.wind,wl=Math.hypot(W[0],W[1]);if(!c.hand)c.hand=c.t0>50?1:-1;
  const a=Math.atan2(W[1],W[0])+c.hand*0.7,sp=wl*0.05*(0.8+0.2*Math.sin(t*0.11+c.t0));
  c.vel.set(Math.cos(a)*sp,0,Math.sin(a)*sp);
  const th=HPI-a;_q.setFromAxisAngle(UP,th);c.g.quaternion.slerp(_q,1-Math.exp(-0.5*dt));
  const cs=Math.cos(th),sn=Math.sin(th),wx=-c.vel.x,wz=-c.vel.z;c.st.lx=wx*cs-wz*sn;c.st.lz=wx*sn+wz*cs;
  c.biteT-=dt;if(c.biteT<=0&&!player.dead&&c.lod===0&&c.b.rigs){const R=d.lines*d.lines;
    for(const rig of c.b.rigs)for(const ch of rig.chains){const P=ch.pts;for(let k=1;k<=ch.n;k++){const dx=P[k*3]-player.pos.x,dy=P[k*3+1]-player.pos.y,dz=P[k*3+2]-player.pos.z;
      if(dx*dx+dy*dy+dz*dz<R){c.biteT=0.7;stingPlayer();return;}}}}
}

// ---------- per frame ----------
const nearList=[],simList=[],bodies=[]; // this frame's creatures within 90 of the player; those at near LOD (arms simulated); near plus the player
let frameNo=0;
function updateCreatures(dt0){
  visibleCreatures=0;nearList.length=0;simList.length=0;const near=nearList;frameNo++;
  for(const c of creatures){
    const d=c.def,dp=c.pos.distanceTo(player.pos);
    if(!c.alive){if(c.dead&&!c.gone&&dp<400)updateCarcass(c,dt0,dp);continue;}
    if(c.juv>0){c.juv-=dt0;if(c.juv<=0){if(dp>90||!c.g.visible){growUp(c);continue;}c.juv=0.001;}} // grows up out of sight
    if(c.soft){if(updateSoft(c,dt0,dp))continue;}else if(c.moultT>0){c.moultT-=dt0;if(c.moultT<=0){if((dp>90||!c.g.visible)&&!c.hold&&!c.held&&c.state!=='feed'){moult(c);continue;}c.moultT=30;}} // the moult (v11.66): hardens, or sheds, out of sight
    if(dp>360&&dp>c.lodFar){c.g.visible=false;continue;} // the big ones keep swimming as far as they are drawn
    // beyond 150 (past the near LOD of anything under 25 m) a creature moves every other frame with the two frames' time: the
    // roster tripled the population (v10.7) and most of it is small things far off in the fog
    let dt=dt0;if(dp>150){c.accT+=dt0;if((frameNo+c.par)&1)continue;dt=c.accT;c.accT=0;}
    // the medium, as for the player: sub is the submerged fraction. Steering only works in the water.
    const R=d.size*0.4,sub=c.pos.y+R<TIDE-TIDE_A1-WAVE_AMP*2?1:clamp((waveH(c.pos.x,c.pos.z)-(c.pos.y-R))/(2*R),0,1),vx0=c.vel.x,vy0=c.vel.y,vz0=c.vel.z;c.sub=sub; // the wave is only read near the surface: a thousand creatures a frame
    if(c.paraT>0){c.vel.multiplyScalar(1-3*dt);c.pos.y-=0.2*dt;c.grab=null;} // paralysed (combat.js envenom, COMBAT.md §3b): no steering, sinking a little
    else if(c.stun>0){c.stun-=dt;c.vel.multiplyScalar(1-2*dt);c.pos.y-=0.3*dt;c.grab=null;} // stunned (the finback's blow, the ram's — combat.js RAM, v11.66): every role, not the hunters' alone
    else if(c.soft){c.vel.multiplyScalar(1-4*dt);} // soft (v11.66, MOULT): it lies where it hid and does nothing
    else switch(d.role){
      case 'boid':updateBoid(c,dt);break;
      case 'trap':updateTrap(c,dt);break;
      case 'watch':updateWatcher(c,dt);break;
      case 'hunter':updateHunter(c,dt);break;
      case 'graze':updateGrazer(c,dt);break;
      case 'wander':wander(c,dt);break;
      case 'coil':updateCoil(c,dt);break;
      case 'ambush':updateLurker(c,dt);break;
      case 'drift':updateJelly(c,dt);break;
      case 'sail':updateSailer(c,dt);break;
    }
    if(sub<1&&!d.legs){const k=1-sub;c.vel.x=lerp(c.vel.x,vx0,k);c.vel.y=lerp(c.vel.y,vy0,k);c.vel.z=lerp(c.vel.z,vz0,k);}
    if(sub<1){c.vel.y-=GRAV*(1-sub)*dt;c.vel.multiplyScalar(1-0.12*(1-sub)*dt);}
    c.pos.addScaledVector(c.vel,dt);
    // the current (v11.18): a body in the water is carried by it (re-read twice a second) unless it holds on — sitting, on the ground,
    // or a floor crawler; a swimmer's steering (seek, the boids) subtracts the current from the way it wants to go, so it crabs upstream,
    // holds station facing into the flow with its tail beating, and is swept only when the current outruns it
    c.carried=sub>0&&!c.grounded&&c.state!=='sit'&&d.role!=='trap'&&!d.floor;
    if(dp<200&&c.carried){if(!c.cur){c.cur=V3(0,0,0);c.curT=0;}c.curT-=dt;if(c.curT<=0){c.curT=0.4+Math.random()*0.2;currentAt(c.pos.x,c.pos.z,c.pos.y,c.cur);}c.pos.addScaledVector(c.cur,dt*sub);}
    let pad=null;if(dp<200)pad=bodyPush(c.pos,c.vel,c.g.quaternion,d.size*0.75,d.size*0.35,d.size*0.28);
    const fh=groundAt(c.pos.x,c.pos.z)+(d.clear!==undefined?d.clear:d.size*0.35);c.grounded=false;if(c.pos.y<fh){c.pos.y=fh;if(c.vel.y<0)c.vel.y*=-0.15;c.grounded=true;} // clear: how high the origin sits over the floor (a buried trap sits low)
    if(d.surface){c.pos.y=waveH(c.pos.x,c.pos.z)+(d.ys||0);c.vel.y=0;c.grounded=false;} // a float: on the wave, always (the sailers)
    if(pad){c.grounded=true;loadPad(pad,clamp(d.size*0.3/pad.r,0.02,0.5));} // a fish that lands on a lily pad lies on it (and flops off)
    // beached: a swimmer lies still, then flops downhill for the sea
    if(c.grounded&&sub<0.5&&!d.legs){c.vel.x*=Math.exp(-5*dt);c.vel.z*=Math.exp(-5*dt);c.flopT-=dt;
      if(c.flopT<=0){c.flopT=rnd(0.7,1.3);const gx=groundAt(c.pos.x+1,c.pos.z)-groundAt(c.pos.x-1,c.pos.z),gz=groundAt(c.pos.x,c.pos.z+1)-groundAt(c.pos.x,c.pos.z-1),gl=Math.hypot(gx,gz)||1;
        c.vel.x+=-gx/gl*3.4+rnd(-0.5,0.5);c.vel.z+=-gz/gl*3.4+rnd(-0.5,0.5);c.vel.y=3.6+d.size*0.25;}}
    const wet=sub>0.5;if(wet!==c.wet){if(dp<160&&Math.abs(c.vel.y)>2.5)splash(c.pos,Math.abs(c.vel.y)*(0.5+d.size*0.12));c.wet=wet;}
    c.pos.x=clamp(c.pos.x,-HALF+12,HALF-12);c.pos.z=clamp(c.pos.z,-HALF+12,HALF-12);
    if(!d.noOrient){if(c.face){_m.lookAt(c.face,c.pos,UP);_q.setFromRotationMatrix(_m);c.g.quaternion.slerp(_q,1-Math.exp(-(d.turn||2)*(c.turnK||1)*2*dt));} // turning to a thing (the tell, the watcher's stare)
      else if(c.vel.lengthSq()>0.02){T2.copy(c.pos).add(c.vel);_m.lookAt(T2,c.pos,UP);_q.setFromRotationMatrix(_m);c.g.quaternion.slerp(_q,1-Math.exp(-(d.turn||2)*(c.turnK||1)*dt));}}
    c.g.position.copy(c.pos);
    // the action state the anim reads: the tell and the strike are set by the behaviours above and let go here
    const st=c.st;if(c.tellT<=0&&c.strikeT<=0){st.tell*=Math.exp(-4*dt);st.strike*=Math.exp(-7*dt);if(d.role==='ambush'&&c.state!=='lunge')st.strike*=Math.exp(-7*dt);}st.jet=c.state==='chase'&&d.jetter===true;
    const vis=dp<c.lodFar;c.g.visible=vis;
    if(vis){visibleCreatures++;if(dp<SEEN_R&&mode==='play')seeSpec(c.kind);if(dp<c.lodNear){setLOD(c,0);c.anim(t+c.t0,Math.min(4,c.vel.length()/(d.size*0.5)),st);T4.set(0,0,1).applyQuaternion(c.g.quaternion);bodyPose(c,dt,Math.atan2(T4.x,T4.z));}else setLOD(c,1);} // bodyPose (fx.js, v11.53): squash and stretch, banking, the stun's list // seen within SEEN_R (save.js, v11.47): the creator's parts
    if(vis&&dp<c.lodNear&&c.lod===0)simList.push(c);
    if(vis&&dp<90)near.push(c);
  }
  // contact: bodies near the player push apart by their actual shapes (the player among them), the player is kept out
  // of every arm and tail near it, then the arms and tails of everything at near LOD are simulated against the bodies.
  for(const c of near){c.g.updateMatrix();worldShapes(c);c.shapeF=frameNo;if((c.def.role==='ambush'&&c.state==='sit')||c.def.role==='trap'||c.dead)c.mass=1e6;else c.mass=bodyMass(c.def);}
  const P=player,live=mode==='play'&&!P.dead;let heldBy=0;bodies.length=0;for(const c of near)bodies.push(c);if(live)bodies.push(P);
  resolveBodies(bodies);
  updateHolds(dt0); // the holds' ropes (combat.js, v11.31): after the bodies have pushed apart, before the arms are simulated
  if(live)for(const c of near){if(c.chainW&&c.chainW.length&&c.pos.distanceTo(P.pos)<c.reach+2)sphereOutOf(P.pos,0.75,P.vel,c.chainW);}
  for(const c of near){c.g.position.copy(c.pos);}
  for(const c of simList){if(near.indexOf(c)<0){c.g.updateMatrix();worldShapes(c);c.shapeF=frameNo;}stepRigs(c,bodies,dt0);if(c.grab===P&&c.holding)heldBy++;}
  if(heldBy)P.heldT=0.2;
}
