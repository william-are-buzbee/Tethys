// far.js — what lies beyond the loaded cells, built once and kept: the whole mountain as a coarse terrain, every big
// structure (the rock forms of flora.js, the old domes, the cairns) and every landmark. Near cells draw their own fine terrain and flora on top and only
// register collision for the structures and landmarks (chunks.js), so nothing pops when a cell loads: the crag you saw
// from 1200 units is the crag you swim through. The far terrain is pushed down under loaded cells so the fine mesh wins
// wherever both exist. Also fills the water colour map the fog reads (scene.js).
// Built region by region (4x4 cells, 860 units) under a per-frame time budget, nearest to the player first: the ring
// beyond the loaded cells is up within a second or two of boot (behind the menu), the rest follows.

// ---------- the water map ----------
// waterColor() of the floor's conditions (world.js), canopy weight in alpha, one texel per ~36 units, box-blurred so borders
// blend over ~70 units. A coarse pass at boot (every 4th texel); each region refines its own block as it is built.
const WM_T=2*HALF/WM_N,wmRaw=new Float32Array(WM_N*WM_N*4),fmRaw=new Float32Array(WM_N*WM_N); // fmRaw (v11.27): the floor's depth, 0..1 of FM_SCALE, filled and blurred beside the colour
function wmFill(i0,i1,j0,j1,step){
  for(let j=j0;j<j1;j+=step)for(let i=i0;i<i1;i+=step){
    const x=-HALF+(i+0.5*step)*WM_T,z=-HALF+(j+0.5*step)*WM_T,s=sample(x,z),c=waterColor(s),a=canopyW(x,z),fd=clamp(-s.h/FM_SCALE,0,1);
    for(let jj=j;jj<Math.min(j1,j+step);jj++)for(let ii=i;ii<Math.min(i1,i+step);ii++){const n=(jj*WM_N+ii)*4;wmRaw[n]=c[0];wmRaw[n+1]=c[1];wmRaw[n+2]=c[2];wmRaw[n+3]=a;fmRaw[jj*WM_N+ii]=fd;}
  }
}
// the floor's depth at a point as the shader reads it (bilinear on the blurred map), in units (v11.27)
function wmFloor(x,z){
  const u=(x+HALF)/WM_T-0.5,v=(z+HALF)/WM_T-0.5,i0=clamp(Math.floor(u),0,WM_N-1),j0=clamp(Math.floor(v),0,WM_N-1),i1=Math.min(i0+1,WM_N-1),j1=Math.min(j0+1,WM_N-1);
  const fu=clamp(u-i0,0,1),fv=clamp(v-j0,0,1),D=FM_DATA;
  const a=D[(j0*WM_N+i0)*4]*(1-fu)+D[(j0*WM_N+i1)*4]*fu,b=D[(j1*WM_N+i0)*4]*(1-fu)+D[(j1*WM_N+i1)*4]*fu;return (a*(1-fv)+b*fv)/255*FM_SCALE;
}
// the map at a point, bilinear like the GPU reads it: rgb the floor's water, a the canopy weight (0..1 floats)
function wmSample(x,z,out){
  const u=(x+HALF)/WM_T-0.5,v=(z+HALF)/WM_T-0.5,i0=clamp(Math.floor(u),0,WM_N-1),j0=clamp(Math.floor(v),0,WM_N-1),i1=Math.min(i0+1,WM_N-1),j1=Math.min(j0+1,WM_N-1);
  const fu=clamp(u-i0,0,1),fv=clamp(v-j0,0,1),D=WM_DATA;
  for(let c=0;c<4;c++){const a=D[(j0*WM_N+i0)*4+c]*(1-fu)+D[(j0*WM_N+i1)*4+c]*fu,b=D[(j1*WM_N+i0)*4+c]*(1-fu)+D[(j1*WM_N+i1)*4+c]*fu;out[c]=(a*(1-fv)+b*fv)/255;}
  return out;
}
function wmBlur(i0,i1,j0,j1){
  for(let j=Math.max(0,j0);j<Math.min(WM_N,j1);j++)for(let i=Math.max(0,i0);i<Math.min(WM_N,i1);i++){
    let r=0,g=0,b=0,a=0,f=0,n=0;
    for(let dj=-1;dj<=1;dj++){const jj=j+dj;if(jj<0||jj>=WM_N)continue;for(let di=-1;di<=1;di++){const ii=i+di;if(ii<0||ii>=WM_N)continue;const k=(jj*WM_N+ii)*4;r+=wmRaw[k];g+=wmRaw[k+1];b+=wmRaw[k+2];a+=wmRaw[k+3];f+=fmRaw[jj*WM_N+ii];n++;}}
    const k=(j*WM_N+i)*4;WM_DATA[k]=Math.round(255*clamp(r/n,0,1));WM_DATA[k+1]=Math.round(255*clamp(g/n,0,1));WM_DATA[k+2]=Math.round(255*clamp(b/n,0,1));WM_DATA[k+3]=Math.round(255*clamp(a/n,0,1));
    FM_DATA[k]=Math.round(255*clamp(f/n,0,1));
  }
  waterMap.needsUpdate=true;floorMap.needsUpdate=true;
}
wmFill(0,WM_N,0,WM_N,4);wmBlur(0,WM_N,0,WM_N);

// The height the cell terrain has at a point: bilinear on the fine grid, from the same samples the cell takes, so a
// landmark placed with this sits on the near mesh exactly (sample() alone is off by the interpolation error).
function gridH(x,z){
  const fx=(x+HALF)/STEP,fz=(z+HALF)/STEP,ix=Math.floor(fx),iz=Math.floor(fz),tx=fx-ix,tz=fz-iz;
  const H=(gx,gz)=>sample(gx*STEP-HALF,gz*STEP-HALF).h;
  const a=H(ix,iz),b=H(ix+1,iz),c=H(ix,iz+1),d=H(ix+1,iz+1);return a+(b-a)*tx+(c-a)*tz+(a-b-c+d)*tx*tz;
}

// ---------- big structures ----------
// Where every structure stands, per cell, from the analytic terrain and a per-(cell, type) rng: computed on
// first request (by a region here, or by a cell loading before its region exists) and cached, so the far and near views
// agree by construction. The rules are placeFloraType's for `big` entries: per-biome density (the biome checked only once
// the cheap tests have passed, since a sample costs ~35 µs), field clustering, clear of landmarks, scaled to stay 12 under
// the surface unless on the strand, sunk into slopes. rs is the collision radius scale (chunks.js addLumps).
const BIG=FLORA.filter(f=>f.big),bigCache=new Array(NCELL*NCELL).fill(null),bigD=new THREE.Object3D();
// One structure of f at (x,z) on ground h: the instance matrix and collision scale, or null if it cannot fit. Under water a
// structure stays 12 under the surface (scaled down to); on the strand it stands as it likes. Set on the ground by the one
// rule (chunks.js settleOn), the ground read from sample().
const bigH=(x,z)=>sample(x,z).h,bigRng=()=>0.5;
function bigPlace(f,x,z,h,sc,yaw,sx,sz,minSc){
  if(h<0.5){const room=(-(f.clear||12)-h)/(f.top-(f.sink||0));sc=f.fill?Math.min(room,f.s?f.s[1]:room):Math.min(sc,room);} // `clear` under mean level (12: the rock; a reef 5: it grows to the lowest tide and stops); `fill`: as tall as that lets it (reef.js)
  if(sc<minSc)return null;
  if(!settleOn(bigD,f,x,z,h,sc,yaw,bigH,bigRng))return null;bigD.scale.set(sc*sx,sc,sc*sz);bigD.updateMatrix(); // a kit that can't lie on the ground here (fit, face) is not placed
  return {f:f,m:bigD.matrix.clone(),rs:sc*Math.min(sx,sz,1)};
}
// A generator (v11.12): a cell's structures are a few hundred sample() calls, which was one step of a region's build against a
// 3 ms budget; a yield every BIG_YIELD tries. bigsFor drains it for the callers that need the list at once (chunks.js
// placeBigSolids); the rng is untouched by a yield, so both paths agree.
// v11.31.3: the count was per entry and no entry has more than 20 tries (crag), so the yield had never once fired — a cell's whole
// structure pass was always a single step. Measured before the fix that step was 0.27-0.54 ms over all 256 cells, comfortably
// inside farMs, so nothing was stalling; the guard was simply dead, and would have stayed dead had a per gone up. The counter now
// runs over the whole cell and the cairns yield too. (The ~35 µs a sample this file used to cite is the cold figure; warm it
// measures 0.7 µs, 13 Sep — DESIGN "The far layer" already had it at ~2 µs warm.)
const BIG_YIELD=16; // tries between yields: a try is ~3 samples, or ~11 with settleOn's eight probes, so a step stays near 0.1 ms
function* bigsGen(i,j){
  let L=bigCache[i*NCELL+j];if(L)return L;L=[];
  const x0=i*CELL-HALF,z0=j*CELL-HALF;let tn=0; // tn: tries this cell over every entry — the yield's clock
  for(let fi=0;fi<BIG.length;fi++){const f=BIG[fi];
    const rng=mulberry((((i*73856093)^(j*19349663)^(fi*83492791)^0x2545f491)>>>0));
    const maxN=f.per||0,tries=Math.round(maxN*Q.flora);
    for(let n=0;n<tries;n++){
      if(++tn%BIG_YIELD===0)yield;
      const x=x0+rng()*CELL,z=z0+rng()*CELL,u=rng();
      let q=1;if(f.field)q*=clamp(0.1+4*Math.pow(fbm(x*f.field+31,z*f.field+17,2),2.5),0,1.6);
      if(u>=q)continue; // the envelope can only lower the chance from here
      const s=sample(x,z),h=s.h,sl=Math.hypot((sample(x+STEP,z).h-h)/STEP,(sample(x,z+STEP).h-h)/STEP);
      if(f.env&&u>=q*envW(f.env,h,sl,fixF(s.f,sl)))continue;
      if(h<-450)continue;
      if(nearLandmark(x,z,110))continue;
      let sc=f.s[0]+rng()*(f.s[1]-f.s[0]);
      if(h<0.5&&!f.fill)sc=Math.min(sc,(-(f.clear||12)-h)/(f.top-(f.sink||0)));if(sc<f.s[0]*0.5)continue; // the same test as bigPlace's, here so a rejection draws nothing more
      let yaw=rng()*TAU;const sx=f.sx?f.sx[0]+rng()*(f.sx[1]-f.sx[0]):1,sz=f.sx?f.sx[0]+rng()*(f.sx[1]-f.sx[0]):1;
      if(f.flow)yaw=flowYaw(x,z)+(yaw-Math.PI)*0.12; // a reef mound lies along the current, a drowned reef along the contour (reef.js); the draw is kept so the stream is unchanged
      const e=bigPlace(f,x,z,h,sc,yaw,sx,sz,f.s[0]*0.5);if(!e)continue;
      const tc=f.tints[Math.floor(rng()*f.tints.length)];
      e.col=[tc[0]*(0.85+rng()*0.25),tc[1]*(0.85+rng()*0.25),tc[2]*(0.85+rng()*0.25)];L.push(e);
    }
  }
  for(const c of CAIRNS){ // placed structures (flora.js): the ones standing in this cell
    if(cellOf(c.x)!==i||cellOf(c.z)!==j)continue;
    if(++tn%BIG_YIELD===0)yield;
    const e=bigPlace(c.f,c.x,c.z,sample(c.x,c.z).h,c.sc,c.yaw,c.sx,c.sz,4);if(!e)continue; // a placed one shrinks to fit under the surface rather than going (the pit's rim is 15–50 deep: a 13× cairn is 45 m tall); under 4× it goes
    const tc=c.f.tints[0];e.col=[tc[0],tc[1],tc[2]];L.push(e);
  }
  bigCache[i*NCELL+j]=L;return L;
}
function bigsFor(i,j){const g=bigsGen(i,j);let r;do r=g.next();while(!r.done);return r.value;}

// ---------- landmarks ----------
// The hand-built one-offs, built once at boot and kept (three culls each by its bounding sphere). LMK holds what the cells
// need to register their collision and lights (chunks.js placeLandmarks): heights on the fine grid.
const LMK={meshes:[]};
(function(){
  const rock=[0.34,0.36,0.38],bone=[0.85,0.82,0.72],dark=[0.6,0.56,0.5];
  const keep=m=>{m.frustumCulled=true;scene.add(m);LMK.meshes.push(m);return shadowCaster(m,MATBIG);}; // a caster into the world's shadow map (v11.30)
  const yawAt=p=>mulberry(((p.x*1000)|0)^((p.z*7919)|0))()*TAU;
  {const p=LM.bones,P=[],n=13;
    for(let i=0;i<n;i++){const px=i*7-42,py=1.2*Math.sin(i*0.5),pz=4*Math.sin(i*0.35);P.push(part(G.sph(2.2-i*0.08,7,5),px,py,pz,bone,{s:[1.3,1,1]}));if(i>1&&i<n-2)P.push(part(new THREE.TorusGeometry(15-Math.abs(i-6)*1.2,0.9,5,14,Math.PI*0.95),px,py+1,pz,bone,{r:[0,HPI,0.08]}));}
    P.push(part(G.box(16,6,7),-56,1.5,0,bone));P.push(part(G.box(12,2.2,5),-58,-1.8,0,dark));P.push(part(G.sph(1.8,6,5),-52,3.5,3.8,[0.1,0.1,0.1]));P.push(part(G.sph(1.8,6,5),-52,3.5,-3.8,[0.1,0.1,0.1]));
    const geo=merge(P);geo.computeBoundingSphere();const m=new THREE.Mesh(geo,MATBIG);m.position.set(p.x,gridH(p.x,p.z)-1,p.z);m.rotation.y=yawAt(p);keep(m);}
  {const p=LM.chimney,y=gridH(p.x,p.z)-2,m=new THREE.Mesh(FLORA_BY_ID.chimney.geo,MATBIG);m.geometry.computeBoundingSphere();m.position.set(p.x,y,p.z);m.scale.set(4.6,4.6,4.6);keep(m);LMK.chimney={y:y};}
})();

// ---------- far impostors: the forest, the bladder meadow and the rafts from a distance ----------
// The stipe forest (1100/cell), bladders, rafts and colonies are placed by the cell's rng and exist only in loaded cells, so from 600 units the
// forest read as a green floor. A sparse stand-in for each: every 5th stipe as a crossed pair of olive cards stretched to
// the surface with a canopy pad on top (a wall of stalks from afar), every 3rd bladder as a thin crossed card the height of the water
// column with a pad on top, rafts and colonies as flat octagons. Placed by the same density rules as
// placeFloraType (biome, field, pocket, canopy) from a pure per-cell rng, drawn by the region, and zeroed inside loaded
// cells the way the far terrain is sunk. They do not match the near flora one for one; only the density does.
function impGeo(tris){ // tris: [[x,y,z]x3, [r,g,b]] with the normal from the winding
  const pos=[],nor=[],col=[];
  for(const [a,b,c,k] of tris){const ux=b[0]-a[0],uy=b[1]-a[1],uz=b[2]-a[2],vx=c[0]-a[0],vy=c[1]-a[1],vz=c[2]-a[2];
    let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;
    for(const v of [a,b,c]){pos.push(v[0],v[1],v[2]);nor.push(nx,ny,nz);col.push(k[0],k[1],k[2]);}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pos),3));
  g.setAttribute('normal',new THREE.BufferAttribute(new Float32Array(nor),3));g.setAttribute('color',new THREE.BufferAttribute(new Float32Array(col),3));g.computeBoundingSphere();return g;
}
function crossCards(w,y0,y1,col,tris){ // two vertical quads at right angles, width w between y0 and y1
  for(const [ax,az] of [[1,0],[0,1]]){const x=ax*w/2,z=az*w/2;tris.push([[-x,y0,-z],[x,y0,z],[x,y1,z],col],[[-x,y0,-z],[x,y1,z],[-x,y1,-z],col]);}
}
function farStipeGeo(){const T=[];crossCards(2.8,0,1,[0.42,0.44,0.17],T);const r=2.4,c=[0.5,0.5,0.2];for(let k=0;k<6;k++){const a0=k/6*TAU,a1=(k+1)/6*TAU;T.push([[0,1,0],[Math.cos(a0)*r,1,Math.sin(a0)*r],[Math.cos(a1)*r,1,Math.sin(a1)*r],c]);}return impGeo(T);} // the stipe: a unit card stretched to the surface like the bladder's, a canopy pad on top
function farBladderGeo(){const T=[];crossCards(1.4,0,1,[0.5,0.56,0.26],T);const r=2.2,c=[0.68,0.72,0.36];for(let k=0;k<6;k++){const a0=k/6*TAU,a1=(k+1)/6*TAU;T.push([[0,1,0],[Math.cos(a0)*r,1,Math.sin(a0)*r],[Math.cos(a1)*r,1,Math.sin(a1)*r],c]);}return impGeo(T);}
function farRaftGeo(col){const T=[];for(let k=0;k<8;k++){const a0=k/8*TAU+0.2,a1=(k+1)/8*TAU+0.2,r0=0.9+0.1*(k%2),r1=0.9+0.1*((k+1)%2);T.push([[0,0,0],[Math.cos(a0)*r0,0,Math.sin(a0)*r0],[Math.cos(a1)*r1,0,Math.sin(a1)*r1],col||W]);}return impGeo(T);}
function farTreeGeo(){const T=[];crossCards(1.2,0,9,[0.44,0.46,0.28],T);const r=3.0,c=[0.38,0.5,0.20];for(let k=0;k<6;k++){const a0=k/6*TAU,a1=(k+1)/6*TAU;T.push([[0,9.4,0],[Math.cos(a0)*r,8.8,Math.sin(a0)*r],[Math.cos(a1)*r,8.8,Math.sin(a1)*r],c]);}return impGeo(T);} // the tidal forest: a trunk and a crown, the middle size
// stride: one impostor per that many of the real thing. w: card width factor on the kelp's scale. r: pad extent (local units of the real geometry) for rafts.
const FAR_IMP=[
  {f:FLORA_BY_ID.stipe,geo:farStipeGeo(),stride:5},
  {f:FLORA_BY_ID.bladder,geo:farBladderGeo(),stride:3},
  {f:FLORA_BY_ID.button,geo:farRaftGeo([0.56,0.82,0.78]),stride:2,r:1.1}, // the buttons' fleets, green-blue
  {f:FLORA_BY_ID.tidetree,geo:farTreeGeo(),stride:2}
];
const impCache=new Array(NCELL*NCELL).fill(null);
// a generator (v11.12), like bigsGen: a cell's impostors are hundreds of sample() calls and were one step of a region's build
function* impostorsGen(i,j){
  let L=impCache[i*NCELL+j];if(L)return L;L=[];
  const x0=i*CELL-HALF,z0=j*CELL-HALF,d=new THREE.Object3D();
  const cw=Math.max(canopyW(x0+CELL/2,z0+CELL/2),canopyW(x0,z0),canopyW(x0+CELL,z0),canopyW(x0,z0+CELL),canopyW(x0+CELL,z0+CELL));
  for(let si=0;si<FAR_IMP.length;si++){const sp=FAR_IMP[si];
    const f=sp.f,rng=mulberry((((i*73856093)^(j*19349663)^((si+40)*83492791)^0x2545f491)>>>0));
    let maxN=f.per||0;
    const canopy=f.canopyPer&&cw>0.03;if(canopy)maxN=Math.max(maxN,f.canopyPer);
    const tries=Math.round(maxN*Q.flora/sp.stride),floor=f.y!=='surface';
    for(let n=0;n<tries;n++){
      if(n%50===49)yield;
      const x=x0+rng()*CELL,z=z0+rng()*CELL,u=rng();
      // the envelope can only lower the chance: reject on the cheap terms first, sample() only for the rest
      const field=f.field?clamp(0.1+4*Math.pow(fbm(x*f.field+31,z*f.field+17,2),2.5),0,1.6):1;
      const pocket=f.pocket?0.1+smooth(0.6,0.72,fbm(x*f.pocket+53,z*f.pocket+29,2)):1;
      const cterm=canopy?canopyW(x,z)*f.canopyPer/maxN:0;
      if(u>=Math.max(pocket,cterm)*field)continue;
      const s=sample(x,z),h=s.h,sl=Math.hypot((sample(x+STEP,z).h-h)/STEP,(sample(x,z+STEP).h-h)/STEP);
      if(u>=Math.max((f.per||0)/maxN*(f.env?envW(f.env,h,sl,fixF(s.f,sl)):1)*pocket,cterm)*field)continue;
      if(floor&&h<-450)continue;
      if(!floor&&h>-4)continue;
      if(floor&&sl>0.9)continue;
      let y=h,sc=f.s?f.s[0]+rng()*(f.s[1]-f.s[0]):1,sy=sc,sxz=sc;
      if(f.reach){if(h>-14)continue;sy=-h-1.4;sxz=1;} // to just under the deepest trough (v11.4): the real stipes are folded to the wave, a card is not, and one that reached mean level stood 0.6 m out of every trough
      else if(!floor){y=f.ys!==undefined?f.ys:-0.45;sy=1;sxz=sc*sp.r;}
      else sxz=sc*(sp.w||1);
      d.position.set(x,y,z);d.rotation.set(0,rng()*TAU,0);d.scale.set(sxz,sy,sxz);d.updateMatrix();
      const tc=f.tints[Math.floor(rng()*f.tints.length)];
      L.push({si:si,m:d.matrix.clone(),col:[tc[0]*(0.85+rng()*0.25),tc[1]*(0.85+rng()*0.25),tc[2]*(0.85+rng()*0.25)]});
    }
  }
  impCache[i*NCELL+j]=L;return L;
}
const ZERO16=new Float32Array(16);
// show or hide one cell's impostors in a region: hidden (all-zero matrix, draws nothing) while the cell is loaded
function farApplyCell(reg,i,j){
  const ch=chunkGrid[i*NCELL+j],on=!ch||!ch.near,k=(j-reg.cj0)*FR+(i-reg.ci0); // on: not loaded, or loaded but past FLORA_FAR (v11.12: the cell's flora is hidden then and the cards stand in)
  for(const imp of reg.imps){const rg=imp.ranges[k];if(!rg)continue;const arr=imp.im.instanceMatrix.array;
    for(let n=rg[0];n<rg[0]+rg[1];n++)arr.set(on?imp.mats.subarray(n*16,n*16+16):ZERO16,n*16);
    imp.im.instanceMatrix.needsUpdate=true;}
}

// a loaded cell went past FLORA_FAR or came back (chunks.js cullChunks): its impostors on or off, if its region is built
function farCellDrawn(i,j){const reg=regions[Math.floor(i/FR)*FNR+Math.floor(j/FR)];if(reg)farApplyCell(reg,i,j);}
// ---------- the regions ----------
// A region is 4x4 cells: one terrain mesh on an 18-unit grid (36 on low; every 4th (8th) vertex of the fine grid, the same samples, so the
// two meet exactly at cell borders), and one instanced mesh per structure geometry holding every structure in the region.
// Vertices whose every touching cell is loaded are pushed 80 under (the fine mesh covers them); the vertices on the edge of
// the loaded block stay, so the far mesh runs up to the fine mesh's edge and dives under it.
const FR=4,FNR=NCELL/FR,FQ=Q.farQ,FS=CH_RES/FQ,FSTEP=STEP*FS,FG=FR*FQ+1; // FQ quads per cell, FS fine steps per far step
const regions=new Array(FNR*FNR).fill(null);let farGen=null,farBuilt=0,visibleRegions=0;
function* genRegion(ri,rj){
  const ci0=ri*FR,cj0=rj*FR,x0=ci0*CELL-HALF,z0=cj0*CELL-HALF;
  // the water map block first: the fog reads it every frame
  const tn=WM_N/FNR,ti=ri*tn,tj=rj*tn;
  for(let j=0;j<tn;j+=6){wmFill(ti,ti+tn,tj+j,Math.min(tj+tn,tj+j+6),1);yield;}
  wmBlur(ti-1,ti+tn+1,tj-1,tj+tn+1);yield;
  // heights on the region's grid plus a one-vertex ring outside it (for slopes at the edge)
  const N=FG+2,hg=new Float32Array(N*N),fg=new Float32Array(N*N*NF);let minH=1e9,maxH=-1e9;
  for(let jj=0;jj<N;jj++){
    for(let ii=0;ii<N;ii++){const gx=ci0*CH_RES+(ii-1)*FS,gz=cj0*CH_RES+(jj-1)*FS,k=jj*N+ii,s=sample(gx*STEP-HALF,gz*STEP-HALF,fg.subarray(k*NF,(k+1)*NF));hg[k]=s.h;
      if(ii>0&&ii<N-1&&jj>0&&jj<N-1){if(s.h<minH)minH=s.h;if(s.h>maxH)maxH=s.h;}}
    yield;
  }
  const pos=new Float32Array(FG*FG*3),col=new Float32Array(FG*FG*3),idx=[];
  for(let jj=0;jj<FG;jj++){
    for(let ii=0;ii<FG;ii++){const n=jj*FG+ii,k=(jj+1)*N+(ii+1),gx=ci0*CH_RES+ii*FS,gz=cj0*CH_RES+jj*FS,x=gx*STEP-HALF,z=gz*STEP-HALF,h=hg[k];
      pos[n*3]=x;pos[n*3+1]=h;pos[n*3+2]=z;
      const sl=Math.hypot((hg[k+1]-hg[k-1])/(2*FSTEP),(hg[k+N]-hg[k-N])/(2*FSTEP));terrainColor(x,z,h,fixF(fg.subarray(k*NF,(k+1)*NF),sl),sl,col,n);}
    if(jj%8===7)yield;
  }
  for(let jj=0;jj<FG-1;jj++)for(let ii=0;ii<FG-1;ii++){const a=jj*FG+ii,b=a+1,c=a+FG,d=c+1;idx.push(a,c,b,b,c,d);}
  let P=pos,Cl=col,ext=0;
  if(ri===0||rj===0||ri===FNR-1||rj===FNR-1){P=Array.from(pos);Cl=Array.from(col);ext=apronGen(ri,rj,x0,z0,P,Cl,idx);P=new Float32Array(P);Cl=new Float32Array(Cl);yield;} // the world's edge: the terrain carried on past the far plane (v11.27)
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('color',new THREE.BufferAttribute(Cl,3));geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,TERRAIN_MAT);mesh.frustumCulled=false;
  const reg={ri:ri,rj:rj,ci0:ci0,cj0:cj0,cx:x0+FR*CELL/2,cz:z0+FR*CELL/2,hg:hg,N:N,geo:geo,group:new THREE.Group(),sphere:null,imps:[],ext:ext};
  reg.group.add(mesh);
  const top=Math.max(maxH,0)+120; // structures stand up to ~100 over the ground
  reg.sphere=new THREE.Sphere(new THREE.Vector3(reg.cx,(minH+top)/2,reg.cz),Math.hypot(FR*CELL*0.71+80+ext,(top-minH)/2+(ext?600:0))); // an edge region's sphere takes its apron in (the void floor is ~550 under the apron)
  yield;
  // the structures, gathered by geometry
  const byGeo=new Map();
  for(let dj=0;dj<FR;dj++)for(let di=0;di<FR;di++){for(const s of (yield* bigsGen(ci0+di,cj0+dj))){let L=byGeo.get(s.f.geo);if(!L){L=[];byGeo.set(s.f.geo,L);}L.push(s);}yield;}
  const c=new THREE.Color();
  byGeo.forEach((L,g)=>{const im=new THREE.InstancedMesh(g,MATROCKB,L.length);im.frustumCulled=false;
    for(let i=0;i<L.length;i++){im.setMatrixAt(i,L[i].m);c.setRGB(L[i].col[0],L[i].col[1],L[i].col[2]);im.setColorAt(i,c);}
    im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;reg.group.add(im);});
  yield;
  // the impostors, one instanced mesh per kind, instances grouped by cell so a cell's run can be zeroed when it loads
  const cellL=[];for(let dj=0;dj<FR;dj++)for(let di=0;di<FR;di++){cellL.push(yield* impostorsGen(ci0+di,cj0+dj));yield;}
  FAR_IMP.forEach((sp,si)=>{
    const ranges=new Array(FR*FR).fill(null);let total=0;
    for(let k=0;k<FR*FR;k++){let cnt=0;for(const e of cellL[k])if(e.si===si)cnt++;if(cnt){ranges[k]=[total,cnt];total+=cnt;}}
    if(!total)return;
    const im=new THREE.InstancedMesh(sp.geo,MATFAR,total);im.frustumCulled=false;const mats=new Float32Array(total*16);let n=0;
    for(let k=0;k<FR*FR;k++)for(const e of cellL[k]){if(e.si!==si)continue;im.setMatrixAt(n,e.m);mats.set(e.m.elements,n*16);c.setRGB(e.col[0],e.col[1],e.col[2]);im.setColorAt(n,c);n++;}
    im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;reg.group.add(im);
    if(sp.f.y==='surface')im.tide=true;else if(sp.f.reach)im.reach=true; // the raft and colony discs ride the tide (cullFar lifts them each frame); the kelp and bladder cards stand on the floor and reach mean level — at a low tide they follow the water down (v11.2), as the real stipes are folded to it
    reg.imps.push({im:im,mats:mats,ranges:ranges});
  });
  scene.add(reg.group);regions[ri*FNR+rj]=reg;farBuilt++;
  farPushRegion(reg);
}
// ---------- the apron (v11.27) ----------
// A region on the world's edge carries its terrain on past the far plane: APRON.length more columns (rows, and a block on a corner)
// of vertices beyond the edge at these offsets, sampled from the same sample() (the void's floor at ~-810 runs out flat), in the same
// mesh as the region, so the edge of the world has no edge. Before this the far mesh stopped at ±HALF and the black dome stood beyond
// it — a straight silhouette 25 m past the player's clamp, and the dome a shade darker than any terrain beside it (scene.js FOG_CUT).
// The last offset must exceed FAR from the clamp (HALF-25): at 2000 it does on both tiers. ~600 vertices on an edge region, ~1000 on a corner.
const APRON=[60,150,330,700,1300,2000];
function apronGen(ri,rj,x0,z0,pos,col,idx){ // appends to pos/col (plain arrays) and idx; returns the apron's reach beyond the edge
  const sides=[ri===0,ri===FNR-1,rj===0,rj===FNR-1]; // -x,+x,-z,+z
  const fT=new Float32Array(NF),cT=new Float32Array(3);let n=pos.length/3;
  const addV=(x,z)=>{const s=sample(x,z,fT);terrainColor(x,z,s.h,fixF(fT,0),0,cT,0);pos.push(x,s.h,z);col.push(cT[0],cT[1],cT[2]);return n++;};
  const L=FR*CELL,K=APRON.length,quad=(a,b,c,d)=>idx.push(a,c,b,b,c,d); // a→b along +x, a→c along +z: the interior's winding
  const strip={}; // strip['x+'][k][jj]: the vertex at level k beyond the +x edge on row jj (and so on)
  for(const sx of [-1,1]){if(!sides[sx<0?0:1])continue;const xe=sx<0?x0:x0+L,S=strip[sx<0?'x-':'x+']=[];
    for(let k=0;k<K;k++){S.push([]);for(let jj=0;jj<FG;jj++)S[k].push(addV(xe+sx*APRON[k],z0+jj*FSTEP));}
    const V=(k,jj)=>k<0?jj*FG+(sx<0?0:FG-1):S[k][jj];
    for(let k=0;k<K;k++)for(let jj=0;jj<FG-1;jj++){if(sx>0)quad(V(k-1,jj),V(k,jj),V(k-1,jj+1),V(k,jj+1));else quad(V(k,jj),V(k-1,jj),V(k,jj+1),V(k-1,jj+1));}}
  for(const sz of [-1,1]){if(!sides[sz<0?2:3])continue;const ze=sz<0?z0:z0+L,S=strip[sz<0?'z-':'z+']=[];
    for(let k=0;k<K;k++){S.push([]);for(let ii=0;ii<FG;ii++)S[k].push(addV(x0+ii*FSTEP,ze+sz*APRON[k]));}
    const V=(k,ii)=>k<0?(sz<0?0:FG-1)*FG+ii:S[k][ii];
    for(let k=0;k<K;k++)for(let ii=0;ii<FG-1;ii++){if(sz>0)quad(V(k-1,ii),V(k-1,ii+1),V(k,ii),V(k,ii+1));else quad(V(k,ii),V(k,ii+1),V(k-1,ii),V(k-1,ii+1));}}
  for(const sx of [-1,1])for(const sz of [-1,1]){const SX=strip[sx<0?'x-':'x+'],SZ=strip[sz<0?'z-':'z+'];if(!SX||!SZ)continue; // a corner: the block between two strips
    const xe=sx<0?x0:x0+L,ze=sz<0?z0:z0+L,ie=sx<0?0:FG-1,je=sz<0?0:FG-1,C=[];
    for(let a=0;a<K;a++){C.push([]);for(let b=0;b<K;b++)C[a].push(addV(xe+sx*APRON[a],ze+sz*APRON[b]));}
    const V=(a,b)=>a<0?(b<0?je*FG+ie:SZ[b][ie]):(b<0?SX[a][je]:C[a][b]);
    for(let a=0;a<K;a++)for(let b=0;b<K;b++){const A=V(a-1,b-1),B=V(a,b-1),Cc=V(a-1,b),D=V(a,b); // A→B steps along sx, A→Cc along sz
      if(sx>0&&sz>0)quad(A,B,Cc,D);else if(sx<0&&sz>0)quad(B,A,D,Cc);else if(sx>0)quad(Cc,D,A,B);else quad(D,Cc,B,A);}}
  return APRON[K-1];
}
// Vertex (ii,jj) of a region goes 80 under if every cell it touches is loaded. On the edge of the loaded block (some
// touching cells loaded) it is held at or below the fine mesh's heights around it, so where the coarse edge would stand
// above the fine one the far mesh dips under the fine edge (hidden from inside) instead of showing a sliver over it.
function farPushVertex(reg,ii,jj){
  const gx=reg.ci0*CH_RES+ii*FS,gz=reg.cj0*CH_RES+jj*FS,x=gx*STEP-HALF,z=gz*STEP-HALF;
  const i0=cellOf(x-0.01),i1=cellOf(x+0.01),j0=cellOf(z-0.01),j1=cellOf(z+0.01);
  let all=true,h=reg.hg[(jj+1)*reg.N+(ii+1)],lo=h;
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){if(i<0||j<0||i>=NCELL||j>=NCELL)continue;const ch=chunkGrid[i*NCELL+j];if(!ch){all=false;continue;}
    const li=gx-i*CH_RES,lj=gz-j*CH_RES; // this vertex on the cell's fine grid; the min over the coarse quad's reach around it
    for(let b=Math.max(0,lj-FS);b<=Math.min(CH_RES,lj+FS);b++)for(let a=Math.max(0,li-FS);a<=Math.min(CH_RES,li+FS);a++){const v=ch.hg[b*GR+a];if(v<lo)lo=v;}}
  reg.geo.attributes.position.array[(jj*FG+ii)*3+1]=all?h-80:Math.max(lo,h-30); // 30 covers the coarse grid's worst overshoot; more would dig a trench at the pit's rim
}
function farPushRegion(reg){for(let jj=0;jj<FG;jj++)for(let ii=0;ii<FG;ii++)farPushVertex(reg,ii,jj);reg.geo.attributes.position.needsUpdate=true;
  for(let dj=0;dj<FR;dj++)for(let di=0;di<FR;di++)farApplyCell(reg,reg.ci0+di,reg.cj0+dj);}
// a cell loaded or unloaded: refresh the vertices of its block in every region that holds them (its edges are shared)
function farCellChanged(i,j){
  for(let rj=0;rj<FNR;rj++)for(let ri=0;ri<FNR;ri++){const reg=regions[ri*FNR+rj];if(!reg)continue;
    const R=FR*CH_RES,lo=Math.max(i*CH_RES,ri*R),hi=Math.min((i+1)*CH_RES,(ri+1)*R),lz=Math.max(j*CH_RES,rj*R),hz=Math.min((j+1)*CH_RES,(rj+1)*R);
    if(lo>hi||lz>hz)continue;
    for(let gz=lz;gz<=hz;gz+=FS)for(let gx=lo;gx<=hi;gx+=FS)farPushVertex(reg,(gx-ri*R)/FS,(gz-rj*R)/FS);
    reg.geo.attributes.position.needsUpdate=true;
    if(i>=reg.ci0&&i<reg.ci0+FR&&j>=reg.cj0&&j<reg.cj0+FR)farApplyCell(reg,i,j);}
}
function manageFar(budgetMs){
  if(farBuilt>=FNR*FNR)return;
  const t0=performance.now();
  if(!farGen){let best=null,bd=1e9;
    for(let rj=0;rj<FNR;rj++)for(let ri=0;ri<FNR;ri++){if(regions[ri*FNR+rj])continue;const d=Math.hypot((ri+0.5)*FR*CELL-HALF-player.pos.x,(rj+0.5)*FR*CELL-HALF-player.pos.z);if(d<bd){bd=d;best=[ri,rj];}}
    if(!best)return;farGen=genRegion(best[0],best[1]);}
  while(performance.now()-t0<budgetMs){if(farGen.next().done){farGen=null;break;}}
}
// after cullChunks, which sets the frustum
function cullFar(){
  visibleRegions=0;
  for(const reg of regions){if(!reg)continue;const d=Math.hypot(reg.cx-camera.position.x,reg.cz-camera.position.z);const v=d<FAR+FR*CELL*0.71+reg.ext&&frustum.intersectsSphere(reg.sphere);reg.group.visible=v;if(v){visibleRegions++;for(const I of reg.imps){if(I.im.tide)I.im.position.y=TIDE;else if(I.im.reach)I.im.position.y=Math.min(TIDE,0);}}}
}
