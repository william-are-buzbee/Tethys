// parts.js — geometry kit: primitives, merge-with-vertex-colors, arm rings, LOD baking
const G={
  box:(w,h,d)=>new THREE.BoxGeometry(w,h,d),
  sph:(r,w,h)=>new THREE.SphereGeometry(r,w||6,h||5),
  cyl:(rt,rb,h,s,open)=>new THREE.CylinderGeometry(rt,rb,h,s||8,1,!!open),
  cone:(r,h,s)=>new THREE.ConeGeometry(r,h,s||6),
  plane:(w,h)=>new THREE.PlaneGeometry(w,h),
  // A lathe's winding follows the profile's order: a profile written from the top down turns the surface inside out, and the
  // mesh vanishes under backface culling (v11.34.1: the finback's tail stem, FIN_TPROF, written nose-to-tip). Reverse a descending
  // profile here — the geometry is identical, only the normals (and so the countershading) come out right. Callers read the array
  // they passed (profR, nose, tail), so the copy stays local.
  lathe:(pts,s)=>{if(pts.length>1&&pts[pts.length-1][1]<pts[0][1])pts=pts.slice().reverse();return new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),s||8);},
  // a quad a-b-c-d (each [x,y,z]) seen from both sides: four triangles, no index (the webs and the tail fans)
  quad:(a,b,c,d)=>{const g=new THREE.BufferGeometry(),P=[];const tri=(p,q,r)=>P.push(p[0],p[1],p[2],q[0],q[1],q[2],r[0],r[1],r[2]);tri(a,b,c);tri(a,c,d);tri(c,b,a);tri(d,c,a);g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));return g;}
};
// A part is a geometry plus a transform and a color (optionally a belly color for countershading).
function part(g,x,y,z,c,o){
  o=o||{};const r=o.r||[0,0,0],s=o.s||[1,1,1];
  const q=o.dir?new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),o.dir.clone().normalize()):new THREE.Quaternion().setFromEuler(new THREE.Euler(r[0],r[1],r[2],o.order||'XYZ'));
  const m=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),q,new THREE.Vector3(s[0],s[1],s[2]));
  return {g:g,m:m,c:c,c2:o.c2||null};
}
// Bake parts into one flat-shaded, vertex-colored geometry. Countershading blends by face normal. A geometry that carries
// its own `color` attribute (flora.js rockGeo: a shade per facet) has it multiplied into the part's colour.
function merge(parts){
  const pos=[],nor=[],col=[];
  for(const p of parts){
    const g=p.g.index?p.g.toNonIndexed():p.g;
    g.applyMatrix4(p.m);g.computeVertexNormals();
    const pa=g.attributes.position.array,na=g.attributes.normal.array,ga=g.attributes.color?g.attributes.color.array:null;
    const top=p.c,bot=p.c2||p.c;
    for(let i=0;i<pa.length;i+=3){
      pos.push(pa[i],pa[i+1],pa[i+2]);nor.push(na[i],na[i+1],na[i+2]);
      let r,gg,b;
      if(bot===top){r=top[0];gg=top[1];b=top[2];}
      else{const k=smooth(-0.45,0.45,na[i+1]);r=lerp(bot[0],top[0],k);gg=lerp(bot[1],top[1],k);b=lerp(bot[2],top[2],k);}
      if(ga){r*=ga[i];gg*=ga[i+1];b*=ga[i+2];}
      col.push(r,gg,b);
    }
    if(g!==p.g)g.dispose();p.g.dispose();
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  return geo;
}
function eyes(P,x,y,z,r,c,pc){
  P.push(part(G.sph(r,6,5),x,y,z,c));P.push(part(G.sph(r,6,5),-x,y,z,c));
  if(pc){P.push(part(G.sph(r*0.45,5,4),x+r*0.55,y,z+r*0.5,pc));P.push(part(G.sph(r*0.45,5,4),-x-r*0.55,y,z+r*0.5,pc));}
}
// A ring of n small eyes round the z axis at z, R from it (PLANET: a ringmouth prey form's mantle ring). phase in turns.
function eyeRing(P,n,z,R,r,c,phase,sy,y0){for(let i=0;i<n;i++){const a=(i+(phase||0))/n*TAU;P.push(part(G.sph(r,5,4),Math.cos(a)*R,(y0||0)+Math.sin(a)*R*(sy||1),z,c));}}
// A stalked eye (PLANET: hingeshells): a stalk from (x,y,z) along dir (a Vector3, any length) for len, the eye at its end.
// The forward eye cluster of a ringmouth predator (CLADES): n (3 or 5) pupiled eyes on a knuckle at (0,y,z) of radius R, the
// pair at the sides, one above, two more between for five. Pupils forward: they show where it looks.
function eyeCluster(P,n,y,z,R,r,c,pc,mantle){
  P.push(part(G.sph(R,6,5),0,y,z,mantle,{s:[1.4,0.75,1]}));
  const at=(x,yy,zz,rr)=>{P.push(part(G.sph(rr,6,5),x,yy,zz,c));P.push(part(G.sph(rr*0.45,5,4),x,yy,zz+rr*0.6,pc));};
  at(R*0.85,y+R*0.25,z+R*0.55,r);at(-R*0.85,y+R*0.25,z+R*0.55,r);at(0,y+R*0.7,z+R*0.5,r*0.75);
  if(n>3){at(R*0.5,y+R*0.65,z+R*0.55,r*0.6);at(-R*0.5,y+R*0.65,z+R*0.55,r*0.6);}
}
// A helical band over a merged geometry: vertices between zA and zB coloured c1 or c2 by a stripe that winds `turns` times along
// the length (the ortho's shell: bands as a screw, not rings). Returns the geometry, for a part with a white colour.
function helix(geo,c1,c2,zA,zB,turns){
  const pa=geo.attributes.position.array,ca=geo.attributes.color.array;
  for(let i=0;i<pa.length;i+=3){const x=pa[i],y=pa[i+1],z=pa[i+2];if(z<zA||z>zB)continue;const u=(Math.atan2(y,x)/TAU+(z-zA)/(zB-zA)*turns)%1,b=((u+1)%1)<0.5;const c=b?c1:c2;ca[i]=c[0];ca[i+1]=c[1];ca[i+2]=c[2];}
  return geo;
}
function stalkEye(P,x,y,z,dir,len,rs,re,cs,ce){const d=dir.clone().normalize();P.push(part(G.cyl(rs*0.75,rs,len,5),x+d.x*len/2,y+d.y*len/2,z+d.z*len/2,cs,{dir:d}));P.push(part(G.sph(re,6,5),x+d.x*len,y+d.y*len,z+d.z*len,ce));}
// n arms on a ring, each a chain of segs tapering boxes. The chains are simulated by physics.js (simChain) and skinned into
// ONE mesh for the whole ring (a rig): the arms bend, lag, collide and wrap for real. Each frame the creature's anim sets
// the swim pose with ringPose (the chains' rest), then stepRigs moves them. o: flat (ring around y, arms radial along the
// floor: the lurker), down (ring around y, hanging: the jelly), y0 (ring height for flat/down), z0 (where the arms start
// along their axis), phase, taper (0.76), h (box height over width), c2, mat, ks/damp/cosMax (spring, drag, joint limit),
// r (collision radius over width, 0.6), web ({c, spread}: the arms webbed together, the pall), plan (CLADES, the ring
// differentiated: an entry per arm {phi: its angle, len/w: multipliers on len and w, sp: a spread offset in the pose} — the
// 2-4-2 ring of the ringmouths; an arm without an entry is as before). phi: for a ring (kind 0) 0 is the top, positive toward
// -x; for a flat ring (kind 1) 0 is forward (+z), positive toward +x.
function armRing(parent,n,z,ringR,len,w,col,segs,curve,o){
  o=o||{};const taper=o.taper!==undefined?o.taper:0.76,chains=[],segd=[];
  for(let i=0;i<n;i++){
    const pl=(o.plan&&o.plan[i])||{},dz=len*(pl.len||1)/segs;
    const phi=pl.phi!==undefined?pl.phi:i/n*TAU+(o.phase!==undefined?o.phase:Math.PI/n);
    const up=o.flat?[0,1,0]:o.down?[Math.cos(phi),0,Math.sin(phi)]:[-Math.sin(phi),Math.cos(phi),0];
    const c=makeChain(segs,1,up[0],up[1],up[2],o);c.phi=phi;c.ph=Math.random()*TAU;c.z=z;c.ringR=ringR;c.curve=curve||0;c.z0=o.z0||0;c.y0=o.y0||0;c.kind=o.flat?1:o.down?2:0;c.dz=dz;c.i=i;c.sp0=pl.sp||0;
    let ww=w*(pl.w||1);for(let k=0;k<segs;k++){const sp=[part(G.box(ww,ww*(o.h||1),dz*1.06),0,0,dz/2,col,{c2:o.c2})];
      // web: a quad between this arm and the mid-angle to each neighbour, at the arms' radial distance in the pose o.web.spread
      // (the arm's frame: y radial, x tangential); the halves of neighbouring arms meet in that pose and shear a little off it
      if(o.web){const wc=Math.cos(o.web.spread),ws=Math.sin(o.web.spread),hc=Math.sin(Math.PI/n),d0=(ringR+(curve||0)*dz*k)*wc+(c.z0+k*dz)*ws,d1=(ringR+(curve||0)*dz*(k+1))*wc+(c.z0+(k+1)*dz)*ws;sp.push(part(G.quad([-d0*hc,0,0],[d0*hc,0,0],[d1*hc,0,dz],[-d1*hc,0,dz]),0,0,0,o.web.c));}
      segd.push({parts:sp,chain:c,k:k});c.rl[k]=dz;c.rr[k]=ww*(o.r||0.6);ww*=taper;}
    chains.push(c);
  }
  const rig=makeRig(segd,o.mat||MAT,chains);rig.solid=!o.soft;
  ringPose(rig,0.3,0,0,0);rigRest(rig);parent.add(rig.mesh);
  return rig;
}
// A swim clock for a builder's anim: the beat's phase, advanced each call by the frequency f0 + f1*spd over the time since
// the last call, so a change of speed changes the beat's rate and never its phase. Every anim used to write t*f(spd),
// which is a rate only while the speed holds: d/dt of t*f is f + t*f'*dspd/dt, so a minute into a session any change of
// speed — a key, a turn, the lerp settling — spun the beat by hundreds of rad/s (the tail a blur, the arms flung about the
// rest pose they chase). First call: t*f, so the menu, the bestiary and the preview PNGs start where they did. dt is capped at
// 0.1 s: a creature back from far LOD steps its phase a little, not by minutes. Two anims that shared t*f (a tail and its
// fins) share one clock and take ph and ph*0.8.
function swimClock(f0,f1){let ph=0,lt=-1;return (t,spd)=>{const f=f0+f1*(spd||0);ph=lt<0?t*f:ph+f*clamp(t-lt,0,0.1);lt=t;return ph;};}
// A first-order ease in wall time for a pose that would otherwise switch (the jet pose): value(t, target) relaxes to the
// target at `rate` per second, so an arm ring closes over a few frames rather than snapping and flinging the chains.
function easer(rate){let v=0,lt=-1;return (t,target)=>{if(lt<0)v=target;else v+=(target-v)*(1-Math.exp(-rate*clamp(t-lt,0,0.1)));lt=t;return v;};}
// The swim pose of a ring: every arm swung by -(spread + amp*sin(tf + phase + i*0.9)) about its pivot (out of the body
// for spread > 0), flat rings also swept sideways by sw*sin. Writes the chains' rest points in the creature's frame.
function ringPose(rig,spread,amp,tf,sw){
  for(const c of rig.chains){
    const th=-(spread+(c.sp0||0)+amp*Math.sin(tf+c.ph+c.i*0.9)),ct=Math.cos(th),st=Math.sin(th),cp=Math.cos(c.phi),sp=Math.sin(c.phi),R=c.restL;
    if(c.kind===0){for(let k=0;k<=c.n;k++){const y0=c.ringR+c.curve*c.dz*k,z0=c.z0+k*c.dz,y1=y0*ct-z0*st,z1=y0*st+z0*ct;R[k*3]=-y1*sp;R[k*3+1]=y1*cp;R[k*3+2]=z1+c.z+(rig.zoff||0);}}
    else if(c.kind===1){const ps=(sw||0)*Math.sin(tf*0.5+c.ph),cs=Math.cos(ps),ss=Math.sin(ps);
      for(let k=0;k<=c.n;k++){const zz=c.z0+k*c.dz,x=zz*ss,y=-zz*cs*st,z=zz*cs*ct;R[k*3]=x*cp+z*sp;R[k*3+1]=y+c.y0;R[k*3+2]=-x*sp+z*cp;}}
    else{for(let k=0;k<=c.n;k++){const L=k*c.dz;R[k*3]=cp*c.ringR+st*L*cp;R[k*3+1]=c.y0-ct*L;R[k*3+2]=sp*c.ringR+st*L*sp;}}
  }
}
// A tail behind a head (the eel): n segments of length L running -z from the origin, the body wave as a yaw per segment
// that accumulates down the chain, so the rest pose is the old nested-group animation and the chain adds lag, contact
// and the bend limit.
function tailPose(c,L,a,tf,kph){
  const R=c.restL;let x=0,z=0,S=0;R[0]=0;R[1]=0;R[2]=0;
  for(let k=0;k<c.n;k++){S+=a*Math.sin(tf-k*kph);x-=L*Math.sin(S);z-=L*Math.cos(S);R[(k+1)*3]=x;R[(k+1)*3+1]=0;R[(k+1)*3+2]=z;}
}
// Lines hung from a ring (the sailers' fishing lines, `down` chains): rest points that start straight down from the ring and stream
// along (lx,lz) — the way the water moves past the animal — more the deeper they go, so a line in a current is a curve, not a rod.
// lean: how far a line leans per unit of that flow (m of lean per m/s, at the tip); wobble: a slow sway by chain and time.
function linePose(rig,lx,lz,lean,tf){
  const fl=Math.hypot(lx,lz),ux=fl>1e-6?lx/fl:0,uz=fl>1e-6?lz/fl:0,a=Math.min(1.35,fl*lean);
  for(const c of rig.chains){const R=c.restL,cp=Math.cos(c.phi),sp=Math.sin(c.phi);let x=cp*c.ringR,y=c.y0,z=sp*c.ringR;R[0]=x;R[1]=y;R[2]=z;
    for(let k=0;k<c.n;k++){const q=Math.pow((k+1)/c.n,0.7),th=a*q+0.06*Math.sin(tf*0.4+c.ph+k*0.5),st=Math.sin(th),ct=Math.cos(th),L=c.dz;
      x+=ux*st*L;z+=uz*st*L;y-=ct*L;R[(k+1)*3]=x;R[(k+1)*3+1]=y;R[(k+1)*3+2]=z;}}
}
// A trunk in front of a head (the hose's proboscis): n segments of length L running +z from the origin, curling down by
// `curl` per segment (negative: up) with a slow wobble, and a sideways wander `yaw` per segment. Rest points for the chain.
// (v11.33: trunkPose, a proboscis pose for a chain, is gone — no spec ever used it; the hose's appendage is a rig posed by ringPose.)
// Flatten an animated creature group into one static mesh per material, in the group's local frame.
// Used as the far LOD: one draw call instead of thirty. Transparent parts (jelly bells) are skipped.
function bakeLOD(g){
  g.updateMatrixWorld(true);
  const inv=new THREE.Matrix4().copy(g.matrixWorld).invert();
  const groups=new Map(),v=new THREE.Vector3(),m=new THREE.Matrix4(),nm=new THREE.Matrix3();
  g.traverse(o=>{
    if(!o.isMesh||!o.geometry.attributes.color||o.material.transparent)return;
    m.multiplyMatrices(inv,o.matrixWorld);nm.getNormalMatrix(m);
    let acc=groups.get(o.material);if(!acc){acc={pos:[],nor:[],col:[]};groups.set(o.material,acc);}
    const pa=o.geometry.attributes.position,na=o.geometry.attributes.normal,ca=o.geometry.attributes.color;
    for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).applyMatrix4(m);acc.pos.push(v.x,v.y,v.z);v.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();acc.nor.push(v.x,v.y,v.z);acc.col.push(ca.getX(i),ca.getY(i),ca.getZ(i));}
  });
  const out=[];
  groups.forEach((acc,mat)=>{const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(acc.pos,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(acc.nor,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(acc.col,3));const mesh=new THREE.Mesh(geo,mat);mesh.visible=false;out.push(mesh);});
  return out;
}
