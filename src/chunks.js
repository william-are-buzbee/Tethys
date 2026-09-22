// chunks.js — the world is built cell by cell around the player and thrown away behind them.
// A cell: a 48x48 grid of heights and condition fields (world.js), one terrain mesh, one instanced mesh per flora type, landmarks, creatures.
const CH_RES=48,STEP=CELL/CH_RES,GR=CH_RES+1,LOAD_R=2;
const chunks=new Map(),chunkGrid=new Array(NCELL*NCELL).fill(null); // same chunks, indexed by cell for cheap 3x3 lookups
function ckey(i,j){return i+','+j;}
function cellOf(v){return Math.floor((v+HALF)/CELL);}
// the cell at a point, off the grid rather than through a built string key and a Map (v11.33): this is the per-frame ground
// lookup — every creature, every chain point outside its own cell, the player five times, the audio rays, the snow — and it
// allocated a string on each call. The range check is not optional: i=1,j=-1 would alias onto cell (0,15) in a flat array.
function chunkAt(x,z){const i=cellOf(x),j=cellOf(z);return i<0||j<0||i>=NCELL||j>=NCELL?undefined:chunkGrid[i*NCELL+j]||undefined;}
function groundAt(x,z){const ch=chunkAt(x,z);return ch?ch.h(x,z):sample(x,z).h;}
// hOut(ch,x,z): the ground for *placing* a thing from a cell being built — the cell's own grid inside it, sample() beyond its
// edge. ch.h clamps at the grid edge, so a probe that reaches past a cell line reads the edge vertex again and every settleOn
// face/fit/drop test in a band as wide as its radius sees a plateau (v11.31.3: talus lost 2.2% of its tries in a 14 m band on
// every cell line, one-sided — the face above the point never registered). Deterministic where groundAt is not: it never asks
// whether a neighbour happens to be loaded. The same rule buildTerrain's hAt1 uses for the cavity term.
function hOut(ch,x,z){return x<ch.x0||x>ch.x0+CELL||z<ch.z0||z>ch.z0+CELL?sample(x,z).h:ch.h(x,z);}
// underCanopy (v11.13–v11.80: the water's look, the light, the shafts and the sound under the canopy mask) went with the canopy's paint (v11.81, PLANKTON.md §12).

function makeChunk(i,j){
  const x0=i*CELL-HALF,z0=j*CELL-HALF,hg=new Float32Array(GR*GR),fg=new Float32Array(GR*GR*NF);
  return {i:i,j:j,k:ckey(i,j),x0:x0,z0:z0,cx:x0+CELL/2,cz:z0+CELL/2,hg:hg,fg:fg,landN:0,deepN:0,minH:0,maxH:-1e9,group:new THREE.Group(),creatures:[],schools:[],eggs:[],meshes:[],plumes:[],lightSrc:[],solids:[],seeps:[],hash:makeHash(),solidR:0,sphere:null,terrain:null,shBig:[], // terrain, shBig (v11.30): the ground's mesh and the structures' shadow proxies, casters into the world's map (scene.js updateShadowS)
    pooled:[],flora:[],near:true,ac:new Float32Array(16),sheds:[], // sheds (v11.66): the cast carapaces dropped in this cell in play (creatures_ai.js dropShed) // pooled (v11.52): the species pools this cell has written a block into (poolAdd); taken out on unload // ac: the swaying flora's height summed in a 4×4 grid of the cell — the forest's sound (audio.js) // flora: the instanced meshes hidden once the cell is past FLORA_FAR (v11.12, cullChunks); near: whether they are drawn now
    h:function(x,z){let fx=clamp((x-x0)/STEP,0,CH_RES-0.001),fz=clamp((z-z0)/STEP,0,CH_RES-0.001);const ix=Math.floor(fx),iz=Math.floor(fz),tx=fx-ix,tz=fz-iz;const a=hg[iz*GR+ix],b=hg[iz*GR+ix+1],c=hg[(iz+1)*GR+ix],d=hg[(iz+1)*GR+ix+1];return a+(b-a)*tx+(c-a)*tz+(a-b-c+d)*tx*tz;},
    f:function(x,z){const ix=clamp(Math.round((x-x0)/STEP),0,CH_RES),iz=clamp(Math.round((z-z0)/STEP),0,CH_RES);return fg.subarray((iz*GR+ix)*NF,(iz*GR+ix+1)*NF);}, // the conditions at the nearest vertex
    w:function(env,x,z){return envW(env,this.h(x,z),this.slope(x,z),this.f(x,z));}, // a species' tolerance here
    // the slope at the nearest vertex, a central difference over the cell's own grid. far.js takes a forward difference from two
    // extra sample() calls instead (v11.32: not unified, deliberately — a central difference there would be four samples a point on
    // the far layer's budget, and the two agree to first order; they differ only on ground that curves inside one STEP, where the
    // far layer's envelope reads a slope a little high on a convex vertex and low on a concave one)
    slope:function(x,z){const ix=clamp(Math.round((x-x0)/STEP),1,CH_RES-1),iz=clamp(Math.round((z-z0)/STEP),1,CH_RES-1);return Math.hypot((hg[iz*GR+ix+1]-hg[iz*GR+ix-1])/(2*STEP),(hg[(iz+1)*GR+ix]-hg[(iz-1)*GR+ix])/(2*STEP));}
  };
}
function sampleRow(ch,jj){
  for(let ii=0;ii<GR;ii++){const x=(ch.i*CH_RES+ii)*STEP-HALF,z=(ch.j*CH_RES+jj)*STEP-HALF;const n=jj*GR+ii,s=sample(x,z,ch.fg.subarray(n*NF,(n+1)*NF));ch.hg[n]=s.h;if(s.h>0.5)ch.landN++;if(s.h<CHEMO)ch.deepN++;if(s.h<ch.minH)ch.minH=s.h;if(s.h>ch.maxH)ch.maxH=s.h;}
}
function finishGrid(ch){
  for(let jj=0;jj<GR;jj++)for(let ii=0;ii<GR;ii++){const n=jj*GR+ii;fixF(ch.fg.subarray(n*NF,(n+1)*NF),ch.slope((ch.i*CH_RES+ii)*STEP-HALF,(ch.j*CH_RES+jj)*STEP-HALF));} // steep faces are rock
  const top=Math.max(ch.maxH,0);
  ch.sphere=new THREE.Sphere(new THREE.Vector3(ch.cx,(ch.minH+top)/2,ch.cz),Math.hypot(CELL*0.71,(top-ch.minH)/2+12));
}
// Solids (colliders) live in physics.js: addSolid/addCapsule/addPad/addLumps register into the cell's hash, solidPush queries it.
// r is the clearance; a landmark with `keep` discs asks for more around each of them
function nearLandmark(x,z,r){for(const p of LM.all)for(const q of (p.keep||[p]))if(Math.hypot(x-q.x,z-q.z)<Math.max(r,q.r||0))return true;return false;}
// The floor's colour at a vertex, from the conditions: mud, sand, rubble and rock by the substrate (olivine-green sand — the
// rock is basalt), fresh basalt darker with rust where a mat has it, lime-pink patches on rock in clear bright water (the
// polyps' crusts), sulfur and white around a vent, the shore by height and bare rock on steep ground. Shared by the cell
// terrain and the far terrain (far.js), which pass it the same conditions, so the colour matches where they meet (the slope they
// hand it is measured differently — see ch.slope — so a face's rock tint can differ by a shade across the seam). Writes rgb into tc at n.
const ROCK_COL=[0.30,0.31,0.33];
const SUB_COL=[[0.20,0.23,0.26],[0.70,0.66,0.48],[0.36,0.39,0.41],[0.30,0.31,0.33]]; // mud, sand, rubble, rock
function terrainColor(x,z,h,f,sl,tc,n){
    const rock=ROCK_COL,m=fbm(x*0.07+5,z*0.07+9,3),k=0.78+0.45*m,sub=f[FI.sub],light=smooth(-150,-10,h);
    const sv=clamp(sub*3,0,2.999),si=Math.floor(sv),st=sv-si,c0=SUB_COL[si],c1=SUB_COL[si+1];
    let r=lerp(c0[0],c1[0],st)*k,g=lerp(c0[1],c1[1],st)*k,bl=lerp(c0[2],c1[2],st)*k;
    if(sub<0.5&&h<-90){r*=0.9;g*=0.95;} // the deep's mud, bluer
    if(h<-600){const q=smooth(-600,-900,h);r*=1-0.3*q;g*=1-0.3*q;bl*=1-0.25*q;} // the basin floor (v11.58, PLANET The basin): manganese-black pelagic mud under the anoxic water; starts under the pit's floor (-550) so nothing inside the old square changes
    if(sub>0.6&&light>0.7&&f[FI.nut]<0.5&&m>0.6){const q=(m-0.6)*4*light;r=lerp(r,0.85,q);g=lerp(g,0.42,q);bl=lerp(bl,0.5,q);} // lime on clear bright rock
    const yg=f[FI.young];if(yg>0.3){const q=smooth(0.3,0.8,yg);r=lerp(r,0.26*k,q*0.5);g=lerp(g,0.24*k,q*0.5);bl=lerp(bl,0.22*k,q*0.5);if(m>0.62){const rq=(m-0.62)*3*q;r=lerp(r,0.55,rq);g=lerp(g,0.28,rq);bl=lerp(bl,0.1,rq);}} // young basalt, rust where the mat is
    const ht=f[FI.heat];if(ht>0.2){const v=fbm(x*0.03+50,z*0.03+50,3);if(v>0.55){const q=Math.min(1,(v-0.55)*5)*smooth(0.2,0.7,ht);r=lerp(r,0.62,q);g=lerp(g,0.5,q);bl=lerp(bl,0.16,q);}} // sulfur round the fissure
    // the shore (v11, PLANET Geology): the sand is olivine — basalt sheds green sand (Papakolea's is the proof) — from a little below
    // the waterline, dark and wet at it; above the tide the dry strand, then bare basalt: dark grey, and where it has weathered in a
    // 28% atmosphere the iron in it has rusted (a lit red-brown that comes and goes with the noise). The rock's olive film and spray
    // bleach come from the band (scene.js), not from here
    if(h>-4){const sand=[0.58,0.62,0.40],wet=[0.40,0.44,0.30],dry=[0.50,0.50,0.34],land=[0.27,0.26,0.25],rust=[0.44,0.28,0.18];
      const ks=smooth(-4,-1.5,h);r=lerp(r,sand[0]*k,ks);g=lerp(g,sand[1]*k,ks);bl=lerp(bl,sand[2]*k,ks);
      const kw=smooth(-1.6,-0.6,h)*smooth(1.2,0.3,h);r=lerp(r,wet[0]*k,kw);g=lerp(g,wet[1]*k,kw);bl=lerp(bl,wet[2]*k,kw);
      const kd=smooth(1.5,4,h);r=lerp(r,dry[0]*k,kd);g=lerp(g,dry[1]*k,kd);bl=lerp(bl,dry[2]*k,kd);
      const kl=smooth(6,18,h)*(0.4+0.6*m),kr=smooth(0.55,0.8,fbm(x*0.05+21,z*0.05+8,2))*0.7;r=lerp(r,lerp(land[0],rust[0],kr)*k,kl);g=lerp(g,lerp(land[1],rust[1],kr)*k,kl);bl=lerp(bl,lerp(land[2],rust[2],kr)*k,kl);}
    const q=smooth(0.9,1.9,sl);
    r=lerp(r,rock[0]*k,q);g=lerp(g,rock[1]*k,q);bl=lerp(bl,rock[2]*k,q);
    tc[n*3]=r;tc[n*3+1]=g;tc[n*3+2]=bl;
}
// a generator (v11.12): the colouring is 2401 vertices with three or four fbm each, ~10 ms in one step against a 6 ms budget; eight rows a step
function* buildTerrain(ch){
  const tg=new THREE.PlaneGeometry(CELL,CELL,CH_RES,CH_RES);tg.rotateX(-HPI);
  const tp=tg.attributes.position,tc=new Float32Array(tp.count*3);
  for(let jj=0;jj<GR;jj++){for(let ii=0;ii<GR;ii++){
    const n=jj*GR+ii,x=(ch.i*CH_RES+ii)*STEP-HALF,z=(ch.j*CH_RES+jj)*STEP-HALF;
    tp.setXYZ(n,x,ch.hg[n],z);terrainColor(x,z,ch.hg[n],ch.fg.subarray(n*NF,(n+1)*NF),ch.slope(x,z),tc,n);
  }if(jj%8===7)yield;}
  // ambient occlusion by the shape of the ground (v11.13): a vertex lower than the mean of its four neighbours at one and two grid steps
  // (4.5 and 9 m) is in a gully or at the foot of a wall and darkens by up to 30%; one higher (a ridge, a crest) lightens by half as much.
  // The cell's own grid; the one-step term reads sample() for the neighbour beyond the edge so both sides of a boundary compute the
  // same number (196 samples a cell, ~7 ms, spread through the yields); the two-step term clamps to the grid (its weight is small).
  // The far terrain has no cavity term: at the loaded boundary the fog leaves 4% of it.
  const hg=ch.hg,hAt1=(ii,jj)=>ii<0||ii>=GR||jj<0||jj>=GR?sample((ch.i*CH_RES+ii)*STEP-HALF,(ch.j*CH_RES+jj)*STEP-HALF).h:hg[jj*GR+ii],
    hAt2=(ii,jj)=>hg[clamp(jj,0,GR-1)*GR+clamp(ii,0,GR-1)];
  for(let jj=0;jj<GR;jj++){for(let ii=0;ii<GR;ii++){const n=jj*GR+ii,h=hg[n];
    const c1=h-(hAt1(ii-1,jj)+hAt1(ii+1,jj)+hAt1(ii,jj-1)+hAt1(ii,jj+1))*0.25,c2=h-(hAt2(ii-2,jj)+hAt2(ii+2,jj)+hAt2(ii,jj-2)+hAt2(ii,jj+2))*0.25,cav=c1*0.7+c2*0.15;
    const ao=cav<0?1-Math.min(0.3,-cav*0.14):1+Math.min(0.12,cav*0.06);tc[n*3]*=ao;tc[n*3+1]*=ao;tc[n*3+2]*=ao;}if(jj%8===7)yield;}
  tg.setAttribute('color',new THREE.BufferAttribute(tc,3));if(!Q.phong)tg.computeVertexNormals();tg.computeBoundingSphere();
  const m=shadowCaster(new THREE.Mesh(tg,TERRAIN_MAT),TERRAIN_MAT);ch.group.add(m);ch.meshes.push(m);ch.terrain=m; // a caster into the world's map when FX.ground (v11.30)
}
function makeInstanced(ch,rng,geo,mat,tints,list,dip,vars,f){
  if(f&&!dip&&mat!==GLOW&&!f.card){poolAdd(poolFor(f,geo,mat,vars,!!mat.sway),ch,rng,tints,list,mat);return null;} // v11.52: one mesh per species across the loaded cells (the pools, below); a card species (far.js FAR_IMP), a padded one (aDip, physics.js) and the glow clouds keep a mesh per cell
  const cur=!!mat.sway; // a sway material reads aCur: the current at every instance's base (scene.js LEAN)
  if(dip||vars||cur)geo=geo.clone(); // per-cell instance attributes need the cell's own copy (disposed with the cell)
  if(dip)geo.setAttribute('aDip',new THREE.InstancedBufferAttribute(new Float32Array(list.length),1)); // rafts: a per-instance dip the pads sink by under a body (physics.js updatePads)
  if(vars)geo.setAttribute('aVar',new THREE.InstancedBufferAttribute(Float32Array.from(list.map(p=>p.v)),1)); // which of the species' three variants this instance shows (grow.js)
  if(cur){const a=new Float32Array(list.length*2),b=new Float32Array(list.length*2);
    for(let i=0;i<list.length;i++){const p=list[i];if(p.y>0.5||mat.land)continue;steadyOf(ch,p.x,p.z,p.y+8,CURV);a[i*2]=CURV.x;a[i*2+1]=CURV.z;tidalAt(p.x,p.z,CURV);b[i*2]=CURV.x;b[i*2+1]=CURV.z;} // nothing on land (the tussock) leans to the water
    geo.setAttribute('aCur',new THREE.InstancedBufferAttribute(a,2));geo.setAttribute('aTide',new THREE.InstancedBufferAttribute(b,2));} // the steady current and the tidal stream at full flood (world.js): the shader sums them with the tide's rate
  const im=new THREE.InstancedMesh(geo,mat,list.length);im.frustumCulled=false;const col=new THREE.Color();
  for(let i=0;i<list.length;i++){im.setMatrixAt(i,list[i].m);let tc=list[i].tint||tints[Math.floor(rng()*tints.length)];const q=list[i].chem;if(q)tc=[lerp(tc[0],q[0],q[3]),lerp(tc[1],q[1],q[3]),lerp(tc[2],q[2],q[3])];col.setRGB(tc[0]*(0.85+rng()*0.25),tc[1]*(0.85+rng()*0.25),tc[2]*(0.85+rng()*0.25));im.setColorAt(i,col);} // chem (v11.67): the place's stain over the pick (grow.js tintBy), before the jitter
  im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;ch.group.add(im);ch.meshes.push(im);if(mat!==GLOW){ch.flora.push(im);shadowCaster(im,mat,ch.sphere);}return im; // the glow clouds stay lit at any range (and cast nothing); everything else hides past FLORA_FAR (cullChunks) and casts into the world's map (v11.30)
}
// ---------- the flora pools (v11.52): one instanced mesh per species across every loaded cell ----------
// Measured 15 Sep 2026 in the app's browser at the forest's edge (147,-3,-443), the loop driven by hand with a gl.finish after each render: of 430
// draws 268 were cell flora at one InstancedMesh per species per cell, the frame was the CPU submitting them (8 µs a draw here, 13 in the
// person's browser: their render 5.8 ms of a 7.3 ms frame) and the GPU idled half a millisecond after the last one; hiding 2.4M triangles of
// reef animals saved 0.3 ms, a quarter of the pixels 0.4, the caustics, the shadows' taps, the shafts and the refraction nothing. So the draw
// count is the frame, and it scales as species × visible cells (DESIGN Performance, 13 Sep). Now a species without a card or a pad draws
// once for all loaded cells: a cell writes its instances into the species' pool as one block (the same rng, the same matrices, tints and
// per-instance attributes as the per-cell mesh had) and takes them out on unload by moving the tail down; only the written range is
// uploaded (updateRange). The pool draws everything loaded — the per-instance collapse past FLORA_FAR (scene.js FAR_CUT) does what the
// per-cell hide did for the small things, and the rock never hid — so a cell behind the camera costs its vertices, which the GPU has to spare.
// The card species (FAR_IMP: the stipe, bladder, buttons, tidetree; `f.card`) keep a mesh per cell because their cards take over per cell,
// the rafts keep aDip per cell (physics.js updatePads), the glow clouds their GLOW mesh. A pool grows by doubling into a fresh geometry
// clone (the old one disposed, so no GL buffer is left behind); it casts into the world's shadow map whole (scene.js updateShadowS) with a
// bounds sphere that covers the island and never camS's box 500 km up.
const POOLS=new Map(),poolGroup=new THREE.Group();scene.add(poolGroup); // entry → pool
const POOL_SPHERE=new THREE.Sphere(new THREE.Vector3(0,0,0),HALF*2+2000);
function poolFor(f,geo,mat,vars,cur){let P=POOLS.get(f);if(P)return P;P={f:f,src:geo,mat:mat,vars:!!vars,cur:cur,cap:0,n:0,nVis:0,blocks:[],geo:null,im:null};poolAlloc(P,Math.max(64,Math.round((f.per||60)*Q.flora*12)));POOLS.set(f,P);return P;}
function poolAlloc(P,cap){ // the pool's mesh at capacity cap, what is written carried over; the old geometry disposed
  const old=P.im,g=P.src.clone();
  if(P.vars)g.setAttribute('aVar',new THREE.InstancedBufferAttribute(new Float32Array(cap),1));
  if(P.cur){g.setAttribute('aCur',new THREE.InstancedBufferAttribute(new Float32Array(cap*2),2));g.setAttribute('aTide',new THREE.InstancedBufferAttribute(new Float32Array(cap*2),2));}
  const im=new THREE.InstancedMesh(g,P.mat,cap);im.frustumCulled=false;im.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(cap*3),3);
  if(old){const n=P.n;im.instanceMatrix.array.set(old.instanceMatrix.array.subarray(0,n*16));im.instanceColor.array.set(old.instanceColor.array.subarray(0,n*3));
    if(P.vars)g.attributes.aVar.array.set(old.geometry.attributes.aVar.array.subarray(0,n));if(P.cur){g.attributes.aCur.array.set(old.geometry.attributes.aCur.array.subarray(0,n*2));g.attributes.aTide.array.set(old.geometry.attributes.aTide.array.subarray(0,n*2));}
    poolGroup.remove(old);old.geometry.dispose();old.dispose();}
  im.count=P.nVis;P.geo=g;P.im=im;P.cap=cap;shadowCaster(im,P.mat,POOL_SPHERE);poolGroup.add(im);
}
function poolTouch(P,s,c){ // the range [s,s+c) uploaded at the next draw, joined to a range still pending
  const up=(a,sz)=>{const r=a.updateRange;if(r.count>0){const lo=Math.min(r.offset,s*sz),hi=Math.max(r.offset+r.count,(s+c)*sz);r.offset=lo;r.count=hi-lo;}else{r.offset=s*sz;r.count=c*sz;}a.needsUpdate=true;};
  up(P.im.instanceMatrix,16);up(P.im.instanceColor,3);if(P.vars)up(P.geo.attributes.aVar,1);if(P.cur){up(P.geo.attributes.aCur,2);up(P.geo.attributes.aTide,2);}
}
function poolAdd(P,ch,rng,tints,list,mat){ // the cell's instances as one block at the pool's end (the rng in makeInstanced's order: the tint's pick, then three jitters)
  if(P.n+list.length>P.cap)poolAlloc(P,Math.max(P.cap*2,P.n+list.length));
  const s=P.n,M=P.im.instanceMatrix.array,C=P.im.instanceColor.array,V=P.vars?P.geo.attributes.aVar.array:null,A=P.cur?P.geo.attributes.aCur.array:null,B=P.cur?P.geo.attributes.aTide.array:null;
  for(let i=0;i<list.length;i++){const p=list[i],k=s+i;M.set(p.m.elements,k*16);let tc=p.tint||tints[Math.floor(rng()*tints.length)];const q=p.chem;if(q)tc=[lerp(tc[0],q[0],q[3]),lerp(tc[1],q[1],q[3]),lerp(tc[2],q[2],q[3])];C[k*3]=tc[0]*(0.85+rng()*0.25);C[k*3+1]=tc[1]*(0.85+rng()*0.25);C[k*3+2]=tc[2]*(0.85+rng()*0.25);if(V)V[k]=p.v; // chem (v11.67): the place's stain over the pick (grow.js tintBy), before the jitter
    if(A){if(p.y>0.5||mat.land){A[k*2]=A[k*2+1]=B[k*2]=B[k*2+1]=0;continue;}steadyOf(ch,p.x,p.z,p.y+8,CURV);A[k*2]=CURV.x;A[k*2+1]=CURV.z;tidalAt(p.x,p.z,CURV);B[k*2]=CURV.x;B[k*2+1]=CURV.z;}} // nothing on land (the tussock) leans to the water
  P.n+=list.length;P.blocks.push({ch:ch,start:s,count:list.length,vis:false});ch.pooled.push(P);poolTouch(P,s,list.length); // hidden until poolCull sees its cell (this frame: cullChunks runs after the streaming)
}
function poolRemove(P,ch){ // the cell's block out: the tail moved down over it, the blocks after it re-based
  const bi=P.blocks.findIndex(b=>b.ch===ch);if(bi<0)return;const b=P.blocks[bi],e=b.start+b.count,n=P.n;
  if(e<n){const mv=(a,sz)=>a.copyWithin(b.start*sz,e*sz,n*sz);mv(P.im.instanceMatrix.array,16);mv(P.im.instanceColor.array,3);if(P.vars)mv(P.geo.attributes.aVar.array,1);if(P.cur){mv(P.geo.attributes.aCur.array,2);mv(P.geo.attributes.aTide.array,2);}
    for(let i=bi+1;i<P.blocks.length;i++)P.blocks[i].start-=b.count;}
  P.blocks.splice(bi,1);P.n-=b.count;if(b.vis){P.nVis-=b.count;P.im.count=P.nVis;}if(e<n)poolTouch(P,b.start,P.n-b.start);
}
// v11.52.1: the pools partitioned by sight. The person's readouts on v11.52: the CPU halved and the vsync interval rose (9.3 ms in the forest
// against 8.7, 16 in the air over it) — a pool drew every loaded cell's instances, behind the camera and all (tris 4.7M → 9.6M), and their GPU
// had no room for them at their resolution (the pane's gl.finish had said it did: a hidden tab never presents, so it under-reads the GPU;
// the person's vsync is the truth). So the blocks of the cells in view come first in the arrays and im.count is their total: a block moves
// to the boundary when its cell comes into or out of view (poolCull, from cullChunks) — a memmove of the span between the two and one ranged
// upload, a few times a second at most — and the world's shadow pass draws every block (scene.js updateShadowS sets count to n and back).
function poolArrays(P){const A=[[P.im.instanceMatrix.array,16],[P.im.instanceColor.array,3]];if(P.vars)A.push([P.geo.attributes.aVar.array,1]);if(P.cur){A.push([P.geo.attributes.aCur.array,2]);A.push([P.geo.attributes.aTide.array,2]);}return A;}
function poolMove(P,i,j){ // block i to index j; the blocks between shift by its count; the span re-based and uploaded
  if(i===j)return;const B=P.blocks,b=B[i],lo=Math.min(B[i].start,B[j].start),hi=Math.max(B[i].start+B[i].count,B[j].start+B[j].count);
  for(const [a,sz] of poolArrays(P)){const tmp=a.slice(b.start*sz,(b.start+b.count)*sz);if(i<j){a.copyWithin(b.start*sz,(b.start+b.count)*sz,hi*sz);a.set(tmp,(hi-b.count)*sz);}else{a.copyWithin((lo+b.count)*sz,lo*sz,b.start*sz);a.set(tmp,lo*sz);}}
  B.splice(i,1);B.splice(j,0,b);let s=lo;for(let k=Math.min(i,j);k<=Math.max(i,j);k++){B[k].start=s;s+=B[k].count;}
  poolTouch(P,lo,hi-lo);
}
function poolCull(){ // after cullChunks has set every cell's visible and near: the seen blocks first, count their total
  for(const P of POOLS.values()){const B=P.blocks;let k=0,n=0;
    for(let i=0;i<B.length;i++){const b=B[i],ch=b.ch;if(ch.group.visible&&ch.near){if(i!==k)poolMove(P,i,k);B[k].vis=true;n+=B[k].count;k++;}else b.vis=false;}
    P.nVis=n;P.im.count=n;}
}
function poolStats(){let draws=0,inst=0;for(const P of POOLS.values()){if(P.n>0)draws++;inst+=P.n;}return {pools:POOLS.size,draws:draws,inst:inst};} // the readout (main.js)
function cellLee(ch){return Math.max(leeW(ch.cx,ch.cz),leeW(ch.x0,ch.z0),leeW(ch.x0+CELL,ch.z0),leeW(ch.x0,ch.z0+CELL),leeW(ch.x0+CELL,ch.z0+CELL));} // the retention field over the cell (v11.81; cellCanopy to v11.80)
// a generator (v11.12): turf is 1200 tries a cell and the strap 2400, an envW and an fbm each; a yield every 200 keeps a step under the budget (the rng is untouched by a yield)
function* placeFloraType(ch,rng,f){
  if(f.big)return; // structures are placed and drawn once for the whole world (far.js); placeBigSolids adds their collision
  const rock=f.mat===MATROCK; // the rock is placed first (genChunk) and never asks; everything after it does
  let maxN=f.per||0; // the density at full tolerance (per cell); the envelope scales it per try
  if(f.rim){const pd=Math.hypot(ch.cx-PIT[0],ch.cz-PIT[1]);if(pd<300)maxN=Math.max(maxN,60);}
  const cw=f.leePer?cellLee(ch):0;if(cw>0.03)maxN=Math.max(maxN,f.leePer);
  if(!maxN)return;
  const tries=Math.round(maxN*Q.flora),list=[],d=new THREE.Object3D(),maxSlope=f.maxSlope!==undefined?f.maxSlope:(f.big?9:0.9);
  const hAt=(x,z)=>hOut(ch,x,z); // settleOn's probes reach past the cell line (v11.31.3); ch.h alone clamps there
  for(let n=0;n<tries;n++){
    if(n%200===199)yield;
    const x=ch.x0+rng()*CELL,z=ch.z0+rng()*CELL;
    let p=(f.per||0)/maxN*(f.envs?envsW(ch,f.envs,x,z):f.env?ch.w(f.env,x,z):1);if(f.rare)p*=f.rare; // envs, rare (v11.66): the best of several envelopes (a shed lies where its kind lives), and a chance under one for a thing rarer than one try a cell
    if(f.rim){const pd=Math.hypot(x-PIT[0],z-PIT[1]);if(pd>98&&pd<150)p=Math.max(p,f.rim);}
    if(f.pocket)p*=0.1+smooth(0.6,0.72,fbm(x*f.pocket+53,z*f.pocket+29,2));
    if(cw>0.03)p=Math.max(p,leeW(x,z)*f.leePer/maxN);
    if(f.field)p*=clamp(0.1+4*Math.pow(fbm(x*f.field+31,z*f.field+17,2),2.5),0,1.6);
    if(rng()>=p)continue;
    const h=ch.h(x,z);
    if(f.y!=='surface'&&h<CHEMO&&!f.band)continue; // nothing sessile below the chemocline but what a band lets through (the seep, the grey mats)
    if(f.y==='surface'&&h>-4)continue; // rafts don't ground
    if(f.minH!==undefined&&h<f.minH)continue; // land plants keep off the wet sand
    if(f.band&&(h<f.band[0]||h>f.band[1]))continue; // a depth band on the ground (the cones' tide band, the straddlers at the rim)
    if(f.y!=='surface'&&f.y!=='mid'&&ch.slope(x,z)>maxSlope)continue; // nothing grows on a cliff face
    let y=h,sc=f.s?f.s[0]+rng()*(f.s[1]-f.s[0]):1,sy=sc;
    if(f.reach){if(h>-14)continue;sy=-h-0.6;sc=1;}
    else if(f.y==='surface'){y=f.ys!==undefined?f.ys:-0.45;}
    else if(f.y==='mid'){if(h>-30)continue;y=h<CHEMO?-40-rng()*300:clamp(h+12+rng()*70,h+10,-14);}
    // v11.31.4: the rule fired on land too, where the room to the surface is negative, so every land species was skipped at every try — tussock, scrub and stranded had never once been placed anywhere on the island. A plant whose minH is above 0 is not growing up through the water.
    else if(f.top&&!f.air&&!(f.minH>=0)&&f.top*sc>-1.4-h){const room=(-1.4-h)/f.top;if(room<sc*0.5)continue;sy=room;} // nothing stands into the air (bar the tidal forest, `air`, and a plant rooted above the tide line, minH>=0): shorten in y or skip
    const yaw=f.flow?flowYaw(x,z)+(rng()-0.5)*0.5:rng()*TAU; // flow-faced things turn across the current
    if(f.y==='surface'||f.y==='mid'||f.reach){d.position.set(x,y,z);d.rotation.set(f.tilt?(rng()-0.5)*0.3:0,yaw,f.tilt?(rng()-0.5)*0.3:0,'XYZ');}
    else{if(!settleOn(d,f,x,z,h,sc,yaw,hAt,rng))continue;y=d.position.y;} // on the floor: the one ground rule (a place it can't lie draws nothing)
    if(!rock&&f.y!=='surface'&&f.y!=='mid'&&!clearOf(ch,x,y,z,f,sc,sy))continue; // v11.22: nothing stands inside rock (or inside an earlier rigid plant) — the collision hash is asked first
    const sx=f.sx?f.sx[0]+rng()*(f.sx[1]-f.sx[0]):1,sz=f.sx?f.sx[0]+rng()*(f.sx[1]-f.sx[0]):1;
    d.scale.set(sc*sx,sy,sc*sz);d.updateMatrix();
    const fx=ch.f(x,z); // the conditions at the instance (v11.67): an `eco` species' variant is its exposure ecotype (grow.js ecoK — the same one draw the random pick made, so no cell's stream moves), and the place's chemistry stains the tint (tintBy; not the rock, not a surface float, not an entry with chem:false)
    list.push({m:d.matrix.clone(),x:x,y:y,z:z,sc:sy,v:f.vars?(f.eco?ecoK(fx[FI.expo],rng()):Math.floor(rng()*f.vars.length)):0,tint:f.photo?pigment(f.y==='surface'?0:h,f.line):null,chem:rock||f.y==='surface'||f.chem===false?null:tintBy(h,fx,!!f.photo)});
  }
  if(!list.length)return;
  const im=makeInstanced(ch,rng,f.geo,f.mat,f.tints,list,!!f.pads,!!f.vars,f),soft=!!(f.mat&&f.mat.sway&&!f.mat.land);
  if(soft&&f.y!=='surface'){const ac=ch.ac,H=f.top||3;for(const p of list){if(p.y>0.5)continue;ac[clamp(Math.floor((p.z-ch.z0)*4/CELL),0,3)*4+clamp(Math.floor((p.x-ch.x0)*4/CELL),0,3)]+=H*p.sc;}} // the forest's sound: its height, by bucket (audio.js)
  if(f.col||f.pads||f.vars)for(let i=0;i<list.length;i++){const p=list[i],fv=f.vars?f.vars[p.v]:f;if(fv.col||fv.pads)addFloraSolids(ch,fv,p.m,p.x,p.y,p.z,fv.pads?{im:im,idx:i,dip:0,dv:0,load:0,live:false}:null,soft);}
  else if(f.lumps)for(const p of list)addLumps(ch,f.lumps,p.m,1); // a kit as per-cell flora: every lump its own twelve-plane rock
  if(f.glow)makeInstanced(ch,rng,f.glow.geo,GLOW,f.glow.tints,list);
  if(f.id==='seep')for(const p of list){if(ch.seeps.length>=8)break;ch.seeps.push(V3(p.x,p.y+(f.top||2)*p.sc*0.9,p.z));} // the seeps' tops: bubbles (fx.js, v11.53)
  if(f.vent){list.sort((a,b)=>b.sc-a.sc);const tops=list.slice(0,4).map(p=>V3(p.x,p.y+11*p.sc,p.z));if(tops.length){addPlume(ch,tops,300);addLight(ch,tops[0].x,tops[0].y+2,tops[0].z,0xff6a22,1.6,70);}}
}
function envsW(ch,E,x,z){let w=0;for(const e of E){const v=ch.w(e,x,z);if(v>w)w=v;}return w;} // the best tolerance among several envelopes (v11.66)
function placeBigSolids(ch){
  const byGeo=new Map();
  for(const s of bigsFor(ch.i,ch.j)){addLumps(ch,s.f.lumps,s.m,s.rs);let L=byGeo.get(s.f.geo);if(!L){L=[];byGeo.set(s.f.geo,L);}L.push(s);}
  // the structures' shadow proxies (v11.30): the cell's own structures again as instanced meshes on layer 1 only — never drawn by the
  // camera (the far layer draws them), only into the world's shadow map when the cell is in its box (scene.js updateShadowS). The
  // region's mesh holds a whole region's structures and would submit them all; this submits the cell's
  const c=new THREE.Color();byGeo.forEach((L,g)=>{const im=new THREE.InstancedMesh(g,MATROCKB,L.length);im.layers.set(1);shadowCaster(im,MATROCKB,ch.sphere);
    for(let i=0;i<L.length;i++){im.setMatrixAt(i,L[i].m);c.setRGB(L[i].col[0],L[i].col[1],L[i].col[2]);im.setColorAt(i,c);} // the colour is never seen; it keeps the depth program the warm-up compiled (instancingColor is in its key)
    im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;ch.group.add(im);ch.meshes.push(im);ch.shBig.push(im);});
  // v11.22: the neighbours' structures that reach into this cell, registered here too, so the clearance test sees them (a structure may
  // reach a cell past its owner). A lump ends up in two hashes near a cell line; a push from two copies of one rock is the push from one.
  // v11.52: registered whether or not the neighbour is loaded — it was skipped for a loaded one and left to the 3×3 contact query, so what a
  // cell's placement saw depended on arrival order (test/pool.js: a tube placed in a structure's foot on a revisit); clearOf reads the
  // cell's own hash alone now (solidPush own), and this makes that hash complete
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const i=ch.i+di,j=ch.j+dj;if(i<0||j<0||i>=NCELL||j>=NCELL)continue;
    for(const s of bigsFor(i,j)){const e=s.m.elements,sc=len3(e[4],e[5],e[6]),R=(s.f.foot||1)*sc*1.3;
      if(e[12]+R<ch.x0||e[12]-R>ch.x0+CELL||e[14]+R<ch.z0||e[14]-R>ch.z0+CELL)continue;addLumps(ch,s.f.lumps,s.m,s.rs);}}
}
// clearOf(ch, x,y,z, f, sc, sy): may a plant stand here? Its base (a pad the size of its footprint) and, for a tall one, its middle are
// asked of the collision hash — this cell's solids so far (the rock went first, then the rigid plants before it in FLORA) and the loaded
// neighbours'. The same hash the player is pushed by: whatever a body cannot pass through, nothing grows through. ~0.5 µs a query
const CLR_V=new THREE.Vector3();
function clearOf(ch,x,y,z,f,sc,sy){
  const H=(f.top||1)*sy,pad=clamp(0.25+0.12*H,0.3,1.4);
  CLR_V.set(x,y+pad,z);if(solidPush(CLR_V,pad,null,ch,true,true))return false; // the cell's own hash only (v11.52): a plant 2 cm from the cell line was placed or not by whether the neighbour was loaded
  if(H>3){CLR_V.set(x,y+H*0.5,z);if(solidPush(CLR_V,pad*0.8,null,ch,true,true))return false;}
  return true;
}
// ---------- the ground rule ----------
// settleOn(d,f,x,z,h,sc,yaw,hAt,rng): the one rule for setting a thing on the ground, near (this file, from the cell's grid) and far
// (far.js bigPlace, from sample()). A kit — anything with `lumps`: a heap, a sheet, a stack, the old dome — lies on the ground's
// tilt measured over its own footprint (`foot` × scale each way; a sheet follows the hummock it lies on, not the grid cell under
// its centre) and sinks by `sink` of its size plus half of how far the ground falls away round it, so it is *in* the slope it sits
// on. A single lump (a boulder: `tilt`) or a plant sits any way up, sunk by `sink` and a little more on a slope. Before v10.4
// everything lay level with a random tilt: a 90 m sheet on a 20% slope floated 9 m clear at its downhill edge (the person's
// screenshots, 8 Sep). Sets d's position and rotation; the caller sets the scale and reads the y back. Returns false where the
// thing cannot lie (v11.19) and the caller draws nothing: `face` — only under a face (the ground within R rises `rise` above the
// point: talus, a rockfall cone); `fit` — a kit only where the ground over its footprint (eight points on the foot circle) departs
// under the plane it lies on by at most fit[0] × scale (its edge would float) and above it by at most fit[1] × scale (it would be
// buried): a sheet cannot lie across a hummock, a pile cannot hang over a drop. The plane is the least-squares fit through the eight,
// which is also the tilt it lies at (before v11.19: four points on the axes). Before
// this a 157 m sheet lay on 60 m hummocks and clipped through them (the person, 10 Sep).
function settleOn(d,f,x,z,h,sc,yaw,hAt,rng){
  let y=h-(f.sink||0)*sc;
  if(f.face){const R=f.face[0];let up=-1e9;for(let k=0;k<8;k++){const q=hAt(x+FACE_C[k]*R,z+FACE_S[k]*R);if(q>up)up=q;}if(up-h<f.face[1])return false;}
  if(f.drop){const R=f.drop[0];let low=1e9;for(let k=0;k<8;k++){const q=hAt(x+FACE_C[k]*R,z+FACE_S[k]*R);if(q<low)low=q;}if(h-low<f.drop[1])return false;} // only on a lip: the ground within R falls `fall` below the point (a drowned reef on a terrace's edge, reef.js)
  if(f.lumps){const R=Math.max(2,sc*(f.foot||1));let m=0,gx=0,gz=0;
    for(let k=0;k<8;k++){const q=hAt(x+FACE_C[k]*R,z+FACE_S[k]*R);FACE_H[k]=q;m+=q;gx+=q*FACE_C[k];gz+=q*FACE_S[k];}
    m/=8;gx/=4*R;gz/=4*R; // the least-squares plane through the eight (Σcos² = 4)
    if(f.fit){const gap=f.fit[0]*sc,bury=f.fit[1]*sc;let lo=0,hi=Math.max(0,h-m);
      for(let k=0;k<8;k++){const dv=FACE_H[k]-(m+gx*FACE_C[k]*R+gz*FACE_S[k]*R);if(dv<lo)lo=dv;else if(dv>hi)hi=dv;}
      if(-lo>gap||hi>bury)return false;}
    lieOn(d,gx,gz,yaw);y-=Math.max(0,h-m)*0.5;}
  else{if(f.sink){const gx=(hAt(x+2,z)-hAt(x-2,z))/4,gz=(hAt(x,z+2)-hAt(x,z-2))/4;y-=Math.min(1.2,Math.hypot(gx,gz))*sc*0.25;}
    d.rotation.set(f.tilt?(rng()-0.5)*0.3:0,yaw,f.tilt?(rng()-0.5)*0.3:0,'XYZ');}
  d.position.set(x,y,z);return true;}
const FACE_C=[],FACE_S=[],FACE_H=new Float64Array(8);for(let k=0;k<8;k++){FACE_C.push(Math.cos(k*TAU/8));FACE_S.push(Math.sin(k*TAU/8));} // the eight bearings settleOn reads the ground on
// lieOn(d,gx,gz,yaw): local up = the ground normal, yaw kept. Euler YXZ: yaw first, then the pitch and roll that raise local x and
// z by the slope along each (gx,gz = dh/dx, dh/dz).
function lieOn(d,gx,gz,yaw){const c=Math.cos(yaw),sn=Math.sin(yaw),sx=gx*c-gz*sn,sz=gx*sn+gz*c;d.rotation.set(-Math.atan(sz),yaw,Math.atan(sx),'YXZ');}
// Cliff faces: where the height grid is steep, lay rock ledges along the contour, half buried in the face, pitched up a
// little at the outer lip so the wall reads as stacked strata with overhangs instead of a stretched sheet of triangles.
function placeCliffs(ch,rng){
  const f=FLORA_BY_ID.ledge,list=[],d=new THREE.Object3D();
  for(let jj=1;jj<GR-1;jj+=2)for(let ii=1;ii<GR-1;ii+=2){
    const n=jj*GR+ii,h=ch.hg[n];if(h<CHEMO)continue;
    const gx=(ch.hg[n+1]-ch.hg[n-1])/(2*STEP),gz=(ch.hg[n+GR]-ch.hg[n-GR])/(2*STEP),g=Math.hypot(gx,gz);
    if(g<1.15)continue;
    const x=ch.x0+ii*STEP,z=ch.z0+jj*STEP,ux=gx/g,uz=gz/g;
    const drop=Math.abs(hOut(ch,x+ux*3*STEP,z+uz*3*STEP)-hOut(ch,x-ux*3*STEP,z-uz*3*STEP)); // local cliff height. v11.31.3: hOut, not groundAt — a probe 13 m out crosses the cell line, and groundAt answered from the neighbour's grid or from sample() by whether that neighbour happened to be loaded, so the same cell laid different ledges on different visits (14 of the 41 cells that have any)
    if(rng()>0.42*Q.flora*Math.min(1,drop/24))continue;
    if(nearLandmark(x,z,70))continue;
    const sc=clamp(drop*(0.4+rng()*0.3),f.s[0],f.s[1]);
    d.position.set(x+ux*0.12*sc,h+(rng()-0.5)*2,z+uz*0.12*sc);
    d.rotation.set(0.06+rng()*0.24,Math.atan2(ux,uz),(rng()-0.5)*0.2,'YXZ'); // pitch lifts the downhill lip, yaw lays local x along the contour
    d.scale.set(sc*(0.8+rng()*0.5),sc,sc*(0.8+rng()*0.4));d.updateMatrix();
    addLumps(ch,f.lumps,d.matrix,sc*0.9);
    list.push({m:d.matrix.clone()});
  }
  if(list.length)makeInstanced(ch,rng,f.geo,f.mat,f.tints,list,false,false,f);
}
function addLight(ch,x,y,z,color,intensity,distance){const s={x:x,y:y,z:z,color:color,intensity:intensity,distance:distance,d:0};ch.lightSrc.push(s);lightSources.push(s);}
function addPlume(ch,tops,n,size){
  const vp=new Float32Array(n*3);
  for(let i=0;i<n;i++){const tp=tops[i%tops.length];vp[i*3]=tp.x+rnd(-1,1);vp[i*3+1]=tp.y+rnd(0,25);vp[i*3+2]=tp.z+rnd(-1,1);}
  const vg=new THREE.BufferGeometry();vg.setAttribute('position',new THREE.BufferAttribute(vp,3));
  const pts=new THREE.Points(vg,new THREE.PointsMaterial({color:0x8a8a90,size:size||0.7,transparent:true,opacity:0.35,depthWrite:false}));pts.frustumCulled=false;
  pts.tick=function(dt){for(let i=0;i<n;i++){const tp=tops[i%tops.length];vp[i*3+1]+=2.2*dt;vp[i*3]+=0.3*dt*Math.sin(t+i);if(vp[i*3+1]>tp.y+26+(size||0)*8){vp[i*3+1]=tp.y;vp[i*3]=tp.x+rnd(-1,1);vp[i*3+2]=tp.z+rnd(-1,1);}}vg.attributes.position.needsUpdate=true;};
  ch.group.add(pts);ch.meshes.push(pts);ch.plumes.push(pts);
}
function inChunk(ch,p){return p.x>=ch.x0&&p.x<ch.x0+CELL&&p.z>=ch.z0&&p.z<ch.z0+CELL;}
// Hand-built one-offs. Their meshes are built once and kept (far.js, LMK); a cell registers the collision, lights and plumes
// of the ones inside it. Positions come from world.js (LM), found once by searching the terrain.
function placeLandmarks(ch){
  if(inChunk(ch,LM.chimney)){const p=LM.chimney,y=LMK.chimney.y;
    for(let k=0;k<4;k++)addSolid(ch,p.x,y+(2+k*3)*4.6,p.z,(1.6-k*0.35)*4.6);
    addLight(ch,p.x,y+53,p.z,0xff7a2a,3,140);addPlume(ch,[V3(p.x,y+51,p.z)],260,1.6);}
}
// ---------- the current ----------
// currentAt(x,z,y,out): the water's velocity at a point, from the loaded cell's grid (no sample() calls: the player, every near
// creature and the snow read it each frame): the steady ocean current plus the tidal stream. The steady part runs along the
// contour, in the sense flowYaw gives the fixed flora (their local +z; the colonies' lines trail that way); on flat ground the
// same slow noise angle; speed CUR_MAX at full `flow`. The tidal stream (world.js tidalAt) is the ocean's tide going past the
// island, times its rate now (v10.3: it turns twice a day; on the axis — the fed flank, the wake — it is nothing). Both weaker
// in the bottom boundary layer, and nothing with no cell loaded. The current is the first thing the world does to a body.
const CUR_MAX=1.2;
function currentAt(x,z,y,out){const ch=chunkAt(x,z);if(!ch){out.set(0,0,0);return out;}return currentOf(ch,x,z,y,out);}
// steadyOf(ch,...): the steady current from a given cell (the cell being built gives every sway instance its aCur before it is registered)
function steadyOf(ch,x,z,y,out){
  const fl=ch.f(x,z)[FI.flow],h=ch.h(x,z),gx=(ch.h(x+4,z)-ch.h(x-4,z))/8,gz=(ch.h(x,z+4)-ch.h(x,z-4))/8,gl=Math.hypot(gx,gz);
  let dx,dz;if(gl<0.06){const a=fbm(x*0.003+7,z*0.003+3,2)*TAU*2;dx=Math.sin(a);dz=Math.cos(a);}else{dx=-gz/gl;dz=gx/gl;}
  const sp=CUR_MAX*fl*(0.45+0.55*smooth(0,8,y-h));out.set(dx*sp,0,dz*sp);return out;}
const CURV=V3(0,0,0),CURT=V3(0,0,0);
function currentOf(ch,x,z,y,out){steadyOf(ch,x,z,y,out);const r=tideRate(clockH);if(r!==0){tidalAt(x,z,CURT);const bl=r*(0.45+0.55*smooth(0,8,y-ch.h(x,z)));out.x+=CURT.x*bl;out.z+=CURT.z*bl;}return out;}
// ---------- creatures per cell ----------
// a point in the cell where the envelope holds (weighted rejection); swimmers get proper water (floor under -5), not the surf
function chunkPoint(ch,rng,env,land){for(let k=0;k<40;k++){const x=ch.x0+rng()*CELL,z=ch.z0+rng()*CELL,h=ch.h(x,z);if(land?h<=0.5:h>=-5)continue;if(env&&rng()>=ch.w(env,x,z))continue;return V3(x,h,z);}return null;}
// the cell's mean tolerance for an envelope, over a 6x6 grid of points
// (v11.33: cellW is gone — ecology.js ecoCap does the same 6x6 mean over a cell and is the one the ledger uses.)
function openY(ch,p,rng,lo,hi){if(p.y<CHEMO)return -60-rng()*260;return clamp(p.y+lo+rng()*(hi-lo),p.y+4,-8);}
// v11.26: a cell spawns what the ledger holds for it (ecology.js ecoTake), placed by kind through placeKind — the same routine the
// ledger's recruits use (ecoTick), with off:true (out of the player's sight) and juv:true (born small). The sailers' fleets are the
// lee's and outside the ledger: drifters die of nothing.
function* spawnChunkCreatures(ch,rng){
  const c=ch.i*NCELL+ch.j;ecoCap(c,ch);
  // the sailers' fleets: where the eddies keep drifters (the retention field, world.js leeW), on the water, over deep ground; one great sailer in three cells
  const cw=cellLee(ch);if(cw>0.3){const n=Math.round((1+3*cw)*Q.creatures);let g=rng()<0.35;
    for(let k=0;k<n+(g?1:0);k++){let p=null;for(let tr=0;tr<12&&!p;tr++){const x=ch.x0+rng()*CELL,z=ch.z0+rng()*CELL;if(leeW(x,z)>0.3&&ch.h(x,z)<-40)p=V3(x,0,z);}if(!p)break;
      const kind=g&&k===n?'greatsailer':'sailer',c=spawn(ch,kind,p,rng);c.g.rotation.y=rng()*TAU;yield;}}
  for(let ei=0;ei<SPAWN.length;ei++){const e=SPAWN[ei];if(POP.k[ei][c]<0.02)continue;const n=ecoTake(ei,c,rng);if(n>0){const placed=yield* placeKind(ch,e,n,rng,{ent:ei});POP.n[ei][c]=placed/Q.creatures;}} // the ledger holds what stood (a hook with no structure to hang in is not owed)
}
// a point for a kind in the cell, off the player's screen if asked (further than 110 m, or behind the camera and past 30): the
// recruits are never seen appearing
function kindPoint(ch,rng,e,off){for(let tr=0;tr<(off?8:1);tr++){const p=chunkPoint(ch,rng,e.env,!!e.land);if(!p)return null;if(!off||mode!=='play')return p;
  const dx=p.x-player.pos.x,dz=p.z-player.pos.z,d2=dx*dx+dz*dz;if(d2>110*110)return p;if(d2>30*30){T1.set(dx,0,dz);T2.set(0,0,-1).applyQuaternion(camera.quaternion);T2.y=0;if(T1.dot(T2)<0)return p;}}return null;}
// place `count` of an entry's kind in the cell in its groups (e.grp), each the way its kind lives: a school for the boids, a pack or
// herd or three spread round a point, a trap or stone lying on its floor, a hook hung in the structure, a lurker among rock, the
// pall in the dark, a floor kind on the floor, the big swimmers in open water. Yields after every member (a build is 1–5 ms);
// returns how many it placed
function* placeKind(ch,e,count,rng,opt){
  const kind=e.kind,D=DEFS[kind],ent=opt.ent!==undefined?opt.ent:-1,o={ent:ent,juv:!!opt.juv};let placed=0;
  while(count>0){const g=e.grp?Math.min(e.grp,count):1;count-=g;
    const p=opt.at?opt.at.clone():kindPoint(ch,rng,e,opt.off);if(!p)break;if(opt.at)p.y=ch.h(p.x,p.z); // at: a hatch, at the clutch
    if(e.land){p.y+=0.5;spawn(ch,kind,p,rng,o);placed++;yield;continue;}
    if(D.role==='boid'){p.y=D.mid?openY(ch,p,rng,10,50):clamp(p.y+1.5+rng()*5,p.y+1,-4); // mid (v11.66): a swarm of the water column
      let s=null;if(opt.juv)for(const q of ch.schools){if(q.members.length&&q.members[0].kind===kind&&(!s||q.pos.distanceTo(p)<s.pos.distanceTo(p)))s=q;} // a recruit joins the nearest ribbon of its kind
      if(s&&s.pos.distanceTo(p)<60){for(let i=0;i<g;i++){const q=s.pos.clone().add(V3((rng()-0.5)*4,(rng()-0.5)*2,(rng()-0.5)*4));q.y=clamp(q.y,ch.h(q.x,q.z)+1,-4);const m=spawn(ch,kind,q,rng,o);m.school=s;s.members.push(m);placed++;yield;}}
      else{yield* makeSchool(ch,kind,p,g,rng,o);placed+=g;}}
    else if(e.grp){const sp=kind==='grazer'?16:kind==='arrow'?8:5;for(let i=0;i<g;i++){const q=p.clone().add(V3((rng()-0.5)*sp,0,(rng()-0.5)*sp)),h=ch.h(q.x,q.z);q.y=D.floor?h+1.5+rng()*1.5:clamp(h+1+rng()*4,h+1,-5);spawn(ch,kind,q,rng,o);placed++;yield;}}
    else if(D.role==='trap'){p.y+=(D.clear!==undefined?D.clear:D.size*0.35)+0.05;if(solidPush(p,1.5,null,ch))continue;const c=spawn(ch,kind,p,rng,o);c.state='sit';c.g.rotation.y=rng()*TAU;placed++;} // the trap, the stone: lying on its floor, any way round (by role since v11.66)
    else if(D.role==='ambush'&&D.hang){let ok=false;for(let tr=0;tr<6&&!ok;tr++){const q=chunkPoint(ch,rng,e.env);if(!q)break;p.copy(q);p.y=clamp(p.y+5+rng()*9,p.y+4,-6);ok=!solidPush(p,2.5,null,ch);}if(!ok)continue;const c=spawn(ch,kind,p,rng,o);c.state='sit';c.g.rotation.y=rng()*TAU;placed++;} // the hook: hung up in the structure
    else if(D.role==='ambush'){let ok=false;for(let tr=0;tr<6&&!ok;tr++){const q=chunkPoint(ch,rng,e.env);if(!q)break;p.copy(q);p.y+=(D.clear!==undefined?D.clear:D.size*0.35)+0.1;ok=!solidPush(p,2,null,ch);}if(!ok)continue;const c=spawn(ch,kind,p,rng,o);c.state='sit';c.g.rotation.y=rng()*TAU;placed++;} // the lurker among rock, the hood under the sand (v11.66: by role, at its own clearance)
    else if(kind==='pall'){p.y=clamp(p.y+15+rng()*120,p.y+10,CHEMO-15);if(p.y>CHEMO-5)continue;spawn(ch,'pall',p,rng,o);placed++;} // in the dark, off the mud
    else if(D.floor){p.y+=D.size*0.35+0.3;spawn(ch,kind,p,rng,o);placed++;} // rasp, watcher, tread, picker, scuttle: on the floor
    else if(kind==='veil'){p.y=openY(ch,p,rng,30,110);spawn(ch,'veil',p,rng,o);placed++;}
    else if(kind==='ridge'||kind==='ortho'||kind==='abyssal'){p.y=openY(ch,p,rng,15,80);spawn(ch,kind,p,rng,o);placed++;}
    else if(kind==='great'){p.y=openY(ch,p,rng,4,12);spawn(ch,'great',p,rng,o);placed++;}
    else if(kind==='eel'){p.y=openY(ch,p,rng,2,12);spawn(ch,'eel',p,rng,o);placed++;}
    else{p.y=openY(ch,p,rng,6,60);spawn(ch,kind,p,rng,o);placed++;}
    yield;
  }
  return placed;
}
// ---------- streaming ----------
// Generation is a generator so it can be spread over frames under a time budget.
function* genChunk(i,j){
  const rng=mulberry(((i*73856093)^(j*19349663)^0x5bd1e995)>>>0);
  const ch=makeChunk(i,j);
  for(let jj=0;jj<GR;jj++){sampleRow(ch,jj);if(jj%2===1)yield;} // two rows a step (v11.12): 98 samples at ~35 µs is 3.4 ms; six rows was 10 against a 6 ms budget
  finishGrid(ch);yield* buildTerrain(ch);yield;
  // v11.22, the order: rock first (the structures' collision, the cliffs' ledges, the cell's blocks), then everything that grows, each
  // asking the hash before it stands (clearOf). One rng stream per entry (v11.2), so the order moves nothing
  placeBigSolids(ch);yield;
  placeCliffs(ch,rng);yield;
  for(const f of FLORA){if(f.mat!==MATROCK)continue;yield* placeFloraType(ch,mulberry((((i*73856093)^(j*19349663)^hashStr(f.id))>>>0)),f);yield;}
  for(const f of FLORA){if(f.mat===MATROCK)continue;yield* placeFloraType(ch,mulberry((((i*73856093)^(j*19349663)^hashStr(f.id))>>>0)),f);yield;}
  placeLandmarks(ch);yield;
  yield* spawnChunkCreatures(ch,rng);lineLoad(ch); // the player's broods that lie in it (line.js, v11.69)
  scene.add(ch.group);chunks.set(ch.k,ch);chunkGrid[i*NCELL+j]=ch;farCellChanged(i,j);shadowDirty(ch);
}
function loadChunkNow(i,j){if(chunks.has(ckey(i,j)))return;const g=genChunk(i,j);while(!g.next().done){}}
function unloadChunk(ch){
  scene.remove(ch.group);for(const P of ch.pooled)poolRemove(P,ch);ch.pooled.length=0; // the cell's blocks out of the species pools (v11.52)
  for(const m of ch.meshes){if(m.geometry&&!FLORA.some(f=>f.geo===m.geometry||(f.glow&&f.glow.geo===m.geometry)))m.geometry.dispose();if(m.isInstancedMesh)m.dispose();if(m.isPoints&&m.material)m.material.dispose();}
  for(const s of ch.lightSrc){const k=lightSources.indexOf(s);if(k>=0)lightSources.splice(k,1);}
  lineUnload(ch);ecoWriteBack(ch); // the player's broods counted (line.js, v11.69); the living go back into the ledger (v11.26); the dead stay dead
  for(let i=ch.eggs.length-1;i>=0;i--)removeEgg(ch.eggs[i]); // the clutches go with the cell; the ledger keeps their count
  for(let i=ch.sheds.length-1;i>=0;i--)removeShed(ch.sheds[i]); // and the sheds dropped in it (v11.66)
  for(const c of ch.creatures)disposeCreature(c);
  for(let i=creatures.length-1;i>=0;i--)if(creatures[i].gone)creatures.splice(i,1);
  for(let i=carcasses.length-1;i>=0;i--)if(carcasses[i].gone)carcasses.splice(i,1);
  for(let i=schools.length-1;i>=0;i--)if(schools[i].chunk===ch)schools.splice(i,1);
  chunks.delete(ch.k);chunkGrid[ch.i*NCELL+ch.j]=null;farCellChanged(ch.i,ch.j);shadowDirty(ch);
}
let activeGen=null,activeKey=null;
function manageChunks(budgetMs){
  const t0=performance.now();
  const ci=cellOf(player.pos.x),cj=cellOf(player.pos.z);
  for(const ch of chunks.values())if(Math.max(Math.abs(ch.i-ci),Math.abs(ch.j-cj))>LOAD_R+1){unloadChunk(ch);break;} // one a frame (v11.12): crossing a cell line used to drop a whole column at once — forty creatures and two dozen geometries each
  if(!activeGen){
    let best=null,bd=1e9;
    for(let dj=-LOAD_R;dj<=LOAD_R;dj++)for(let di=-LOAD_R;di<=LOAD_R;di++){const i=ci+di,j=cj+dj;if(i<0||j<0||i>=NCELL||j>=NCELL)continue;if(chunks.has(ckey(i,j)))continue;const d=di*di+dj*dj;if(d<bd){bd=d;best=[i,j];}}
    if(!best)return;
    activeGen=genChunk(best[0],best[1]);activeKey=ckey(best[0],best[1]);
  }
  while(performance.now()-t0<budgetMs){const r=activeGen.next();if(r.done){activeGen=null;activeKey=null;break;}}
}
const frustum=new THREE.Frustum(),_pm=new THREE.Matrix4();
let visibleChunks=0;
function cullChunks(dt){
  _pm.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(_pm);visibleChunks=0;
  const cx=camera.position.x,cz=camera.position.z;
  for(const ch of chunks.values()){const d=Math.hypot(ch.cx-cx,ch.cz-cz);const v=d<FAR+CELL&&frustum.intersectsSphere(ch.sphere);ch.group.visible=v;if(v){visibleChunks++;for(const p of ch.plumes)p.tick(dt);}
    // the flora's draw distance (v11.12, scene.js FLORA_FAR): a cell whose nearest edge is past it draws no instanced flora (the shader has
    // already collapsed the small things one by one on the way out) and its far impostors come on in their place (far.js farApplyCell)
    const ex=Math.max(ch.x0-cx,cx-ch.x0-CELL,0),ez=Math.max(ch.z0-cz,cz-ch.z0-CELL,0),near=ex*ex+ez*ez<FLORA_FAR*FLORA_FAR;
    if(near!==ch.near){ch.near=near;for(const m of ch.flora)m.visible=near;farCellDrawn(ch.i,ch.j);}}
  poolCull(); // the species pools follow the cells' visibility (v11.52.1)
}
