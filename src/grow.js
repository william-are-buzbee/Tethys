// grow.js — the flora grammar (FLORA.md): eight bauplans (axis, branch, blades, tuft, cup, disc, mound, float), the founder
// lines' detailing (polyp tips, crowns with an eye ring, plated cones), and the species packer: three variants of a species
// baked at load into ONE geometry with a per-vertex `vid`; the cell gives every instance an `aVar` and the vertex shader
// collapses the other two variants to the origin (degenerate triangles: one draw call, no fill). The species themselves
// are in flora.js. Sizes are metres; every builder takes the variant's rng so a species is the same on every visit.
const W=[1,1,1];
function hashStr(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
// pigment(h, line): a weed is the colour of the light it rejects (PLANET, the green gradient), and since TAXA (v11.15) the colour is the
// line's, not the depth's: three photosynthetic lines from three planktonic pigment-kinds, each shading within its own band and
// stopping — greens (green, sunscreen-bright in bright water, olive by −40 and no further), floaters (olive to gold-brown, never
// green), reds (pale pink where they lay lime in bright water, red-purple below, dark at the light's floor). Photosynthetic
// entries (`photo`) take their tint from the ground depth at placement through their `line`; where two lines meet the world reads it.
const PIG={
  green:[[0,[0.36,0.60,0.20]],[15,[0.36,0.60,0.20]],[40,[0.48,0.50,0.18]],[150,[0.46,0.48,0.18]]],
  float:[[0,[0.50,0.50,0.20]],[15,[0.50,0.50,0.20]],[45,[0.56,0.46,0.17]],[80,[0.56,0.38,0.14]],[150,[0.50,0.34,0.14]]],
  red:[[0,[0.80,0.58,0.62]],[18,[0.80,0.58,0.62]],[50,[0.50,0.18,0.30]],[120,[0.40,0.13,0.24]],[150,[0.34,0.11,0.20]]]};
function pigment(h,line){const d=clamp(-h,0,150),T=PIG[line]||PIG.green;let c=T[T.length-1][1];
  for(let i=1;i<T.length;i++)if(d<=T[i][0]){const a=T[i-1],b=T[i],t=(d-a[0])/(b[0]-a[0]||1);c=[lerp(a[1][0],b[1][0],t),lerp(a[1][1],b[1][1],t),lerp(a[1][2],b[1][2],t)];break;}
  const v=1+(line==='red'?0.1:0.22)*smooth(25,8,d);return [c[0]*v,c[1]*v,c[2]*v];}
// flowYaw(x,z): tidal current runs along the contours; a `flow` entry turns its plane (local x-y, normal z) across it, so a slope of
// fans all facing the same way reads as current. Flat ground gets a slow noise field the whole flat agrees with.
function flowYaw(x,z){const gx=(sample(x+2,z).h-sample(x-2,z).h)/4,gz=(sample(x,z+2).h-sample(x,z-2).h)/4;
  if(Math.hypot(gx,gz)<0.06)return fbm(x*0.003+7,z*0.003+3,2)*TAU*2;return Math.atan2(-gz,gx);}
// ---------- bauplans: each pushes parts into P ----------
// axis: a segmented stem from the origin up. segs, len, r0 (base radius), r1 (top), wander, lean, bend (a constant drift: an elbow),
// rib (alternate flares), sides, open, col, x/y/z (where it starts). Returns its nodes {x,y,z,t,r,d} (t 0..1 along it; the last is the tip).
function axis(P,o,rg){const N=[],L=o.len/o.segs,wd=o.wander||0;let x=o.x||0,y=o.y||0,z=o.z||0,dx=(rg()-0.5)*(o.lean||0),dz=(rg()-0.5)*(o.lean||0);
  for(let k=0;k<o.segs;k++){const t=k/o.segs,r=lerp(o.r0,o.r1,t),r2=lerp(o.r0,o.r1,(k+1)/o.segs);dx+=(rg()-0.5)*wd+(o.bend||0);dz+=(rg()-0.5)*wd;
    const v=V3(dx,1,dz).normalize().multiplyScalar(L);N.push({x:x,y:y,z:z,t:t,r:r,d:v.clone().normalize()});
    P.push(part(G.cyl(r2*(o.rib?(k%2?1.14:0.9):1),r*(o.rib?(k%2?0.9:1.14):1),L*1.04,o.sides||5,!!o.open),x+v.x/2,y+v.y/2,z+v.z/2,o.col||W,{dir:v}));x+=v.x;y+=v.y;z+=v.z;}
  N.push({x:x,y:y,z:z,t:1,r:o.r1,d:V3(dx,1,dz).normalize()});return N;}
function nodeAt(N,t){return N[Math.min(N.length-1,Math.max(0,Math.round(t*(N.length-1))))];}
// one blade: a strip of `segs` quads from (x,y,z), drooping along its length. Euler YXZ: droop first, then spin (the kelp frond's order).
// a0: the angle above horizontal it leaves at (default -droop/2, so a frond off a stipe starts level); a blade a float lifts starts near vertical
function bladeAt(P,x,y,z,len,w,yaw,droop,segs,col,a0){const L=len/segs,cy=Math.cos(yaw),sy=Math.sin(yaw);let bx=0,by=0,a=a0===undefined?-droop*0.5:a0;
  for(let k=0;k<segs;k++){const pg=G.plane(L,w*(1-0.45*k/segs));pg.rotateX(-HPI);pg.translate(L/2,0,0);
    P.push(part(pg,x+cy*bx,y+by,z-sy*bx,col,{r:[0,yaw,a],order:'YXZ'}));bx+=Math.cos(a)*L;by+=Math.sin(a)*L;a-=droop/segs;}
  return V3(x+cy*bx,y+by,z-sy*bx);} // where it ends (a float goes there)
// blades along an axis: from,to (t range), count, len, w, droop, segs, spin 'spiral'|'two'|'whorl' (+whorl n), twist, taper (shorter up top), col
function blades(P,N,o,rg){for(let i=0;i<o.count;i++){const t=lerp(o.from,o.to,o.count>1?i/(o.count-1):0),n=nodeAt(N,t),g=o.taper?lerp(1,o.taper,t):1;
    const yaw=o.spin==='two'?(i%2)*Math.PI+(o.twist||0)+(rg()-0.5)*0.3:o.spin==='whorl'?(i%o.whorl)/o.whorl*TAU+Math.floor(i/o.whorl)*0.7:i*2.4+rg()*0.5;
    bladeAt(P,n.x,n.y,n.z,o.len*g*(0.85+rg()*0.3),o.w*g,yaw,o.droop||0,o.segs||1,o.col||W);}}
// branch: recursive. levels, kids (per level), angle, ratio, planar (0 a bush .. 1 a fan in the x-y plane), taper, sides, col,
// tip(P,at,r,rg) on the last level, colLevels (capsules pushed to `out` for levels up to it)
function branch(P,o,rg,base,dir,len,r,level,out){const v=dir.clone().multiplyScalar(len),tip=base.clone().add(v);
  P.push(part(G.cyl(r*(o.taper||0.7),r,len*1.04,o.sides||5,true),base.x+v.x/2,base.y+v.y/2,base.z+v.z/2,o.col||W,{dir:v}));
  if(out&&level<=(o.colLevels===undefined?1:o.colLevels))out.push({a:[base.x,base.y,base.z],b:[tip.x,tip.y,tip.z],r:r*1.4});
  if(level>=o.levels){if(o.tip)o.tip(P,tip,r,rg);return;}
  const k=o.kids[Math.min(level,o.kids.length-1)],e1=V3(0,0,1).cross(dir).normalize(),e2=dir.clone().cross(e1).normalize();
  for(let i=0;i<k;i++){const ph=lerp(rg()*TAU,(i%2?0:Math.PI)+(rg()-0.5)*0.5,o.planar||0),an=o.angle*(0.7+rg()*0.6);
    const nd=dir.clone().multiplyScalar(Math.cos(an)).add(e1.clone().multiplyScalar(Math.cos(ph)*Math.sin(an))).add(e2.clone().multiplyScalar(Math.sin(ph)*Math.sin(an))).normalize();
    branch(P,o,rg,tip,nd,len*o.ratio*(0.8+rg()*0.4),r*(o.taper||0.7),level+1,out);}}
// tuft: n blades (vertical planes, the grass way) or rods (thin boxes) from a point. n, len, w, spread (lean), curl (rods kink), jit, col
function tuft(P,o,rg,x0,y0,z0){for(let i=0;i<o.n;i++){const a=rg()*TAU,lean=rg()*o.spread,len=o.len*(0.7+rg()*0.6),x=x0+(rg()-0.5)*(o.jit||0),z=z0+(rg()-0.5)*(o.jit||0);
    if(o.rod){const v=V3(Math.sin(lean)*Math.cos(a),Math.cos(lean),Math.sin(lean)*Math.sin(a)).multiplyScalar(len);P.push(part(G.box(o.w,len,o.w),x+v.x/2,y0+v.y/2,z+v.z/2,o.col||W,{dir:v}));
      if(o.curl){const v2=V3(v.x*0.5+Math.cos(a+1.6)*len*0.5,v.y*0.35,v.z*0.5+Math.sin(a+1.6)*len*0.5).normalize().multiplyScalar(len*0.6);P.push(part(G.box(o.w*0.8,len*0.6,o.w*0.8),x+v.x+v2.x/2,y0+v.y+v2.y/2,z+v.z+v2.z/2,o.col||W,{dir:v2}));}}
    else P.push(part(G.plane(o.w,len),x,y0+Math.cos(lean)*len/2,z,o.col||W,{r:[Math.sin(a)*lean,a,Math.cos(a)*lean]}));}}
// cup: a lathe. h, rm (mouth), rw (waist), rb (base), lip, sides, closed (a bulb with a slit), inner (a second wall inside), col, col2
function cup(P,o,rg,x,y,z){const pts=[[o.rb*0.6,0],[o.rb,o.h*0.08],[o.rw,o.h*0.45],[o.rm*0.92,o.h*0.85],[o.rm*(1+(o.lip||0)),o.h]];
  if(o.closed)pts.push([o.rm*0.55,o.h*1.1],[0.02,o.h*1.16]);else pts.push([o.rm*0.8,o.h*0.97],[o.rm*0.55,o.h*0.9]);
  P.push(part(G.lathe(pts,o.sides||7),x,y,z,o.col||W));
  if(o.inner)P.push(part(G.lathe([[o.rm*0.4,o.h*0.45],[o.rm*0.72,o.h*0.92],[o.rm*0.62,o.h*0.99]],o.sides||7),x,y,z,o.col2||o.col||W));}
// disc: a plate. r, th, sides, studs (polyp studs on top), col, col2
function disc(P,o,rg,x,y,z){P.push(part(G.cyl(o.r,o.r*0.9,o.th,o.sides||8),x,y,z,o.col||W));
  if(o.studs)for(let i=0;i<o.studs;i++){const a=i/o.studs*TAU+rg()*0.5,d=o.r*(0.25+rg()*0.65);P.push(part(G.cone(o.th*0.9,o.th*1.8,4),x+Math.cos(a)*d,y+o.th*1.3,z+Math.sin(a)*d,o.col2||o.col||W));}}
// mound: a squashed sphere in growth bands (each band a slightly smaller, lifted sphere in its own shade). r, sq (height over r), bands, spines, col, col2
function mound(P,o,rg,x,y,z){const nb=o.bands||1;
  for(let k=0;k<nb;k++){const f=1-k/nb*0.5,sh=k%2?0.9:1.06;P.push(part(G.sph(o.r*f,o.sw||7,o.sh||5),x+(rg()-0.5)*o.r*0.15,y+o.r*o.sq*k/nb*0.75,z+(rg()-0.5)*o.r*0.15,[o.col[0]*sh,o.col[1]*sh,o.col[2]*sh],{s:[1,o.sq,1]}));}
  if(o.spines)for(let i=0;i<o.spines;i++){const a=rg()*TAU,el=rg()*1.3,v=V3(Math.cos(a)*Math.cos(el),Math.sin(el),Math.sin(a)*Math.cos(el)),L=o.r*(0.7+rg()*0.7);
    P.push(part(G.cone(o.r*0.1,L,4),x+v.x*(o.r*0.9+L/2),y+v.y*(o.r*o.sq*0.9+L/2),z+v.z*(o.r*0.9+L/2),o.col2||o.col,{dir:v}));}}
// a hanging line from (x,0,z): segments so the sway bends it. kind 0 a rod, 1 knotted, 2 bulb-tipped, 3 forked (the colonies' fishing
// lines). drift: how far the line trails along local +z per unit of depth — a line in a current streams downstream (the instance is
// yawed by flowYaw so local +z is the current's direction: chunks.js currentAt uses the same convention)
function line(P,x,z,L,kind,rg,segs,w,col,knob,drift){let sx=x,sy=0,sz=z,dx=(rg()-0.5)*0.35,dz=(drift||0)*(0.8+rg()*0.4)+(rg()-0.5)*0.2;const len=L/segs;
  for(let k=0;k<segs;k++){dx+=(rg()-0.5)*0.25;dz+=(rg()-0.5)*0.25;const v=V3(dx,-1,dz).normalize().multiplyScalar(len),ww=w*(1-0.5*k/segs);
    P.push(part(G.box(ww,len*1.03,ww),sx+v.x/2,sy+v.y/2,sz+v.z/2,col,{dir:v}));sx+=v.x;sy+=v.y;sz+=v.z;
    if(kind===1&&k<segs-1)P.push(part(G.sph(ww*1.9,5,4),sx,sy,sz,knob));
    if(kind===3&&k===Math.floor(segs*0.55))for(const sg of [1,-1]){const bv=V3(dx+sg*0.7,-1,dz-sg*0.4).normalize().multiplyScalar(len*1.4);P.push(part(G.box(ww*0.8,len*1.4,ww*0.8),sx+bv.x/2,sy+bv.y/2,sz+bv.z/2,col,{dir:bv}));}}
  if(kind===2)P.push(part(G.sph(w*3.2,6,5),sx,sy-w*2,sz,knob,{s:[1,1.3,1]}));}
// ---------- the lines' detailing ----------
const PTIP=[1.18,1.18,1.12],EYE=[0.06,0.06,0.09];
// polyps: a cup on every twig
function polypTip(P,at,r){P.push(part(G.cyl(r*1.6,r*0.6,r*1.6,5,true),at.x,at.y+r*0.5,at.z,PTIP));}
// crowns (sessile ringmouths): n arms as two-segment chains of tapering boxes opening up and out, an eye ring round the rim.
// plane: the arms fan in the x-y plane (a crown across the flow); else radial. n, len, w, spread (radians, half-angle for a fan), rim, col
function crown(P,at,o,rg){for(let i=0;i<o.n;i++){const ph=o.plane?lerp(-1,1,o.n>1?i/(o.n-1):0.5)*o.spread:i/o.n*TAU+rg()*0.3,el=0.4+rg()*0.5;
    const dirAt=k=>(o.plane?V3(Math.sin(ph*(1+0.5*k)),Math.cos(ph*(1+0.5*k)),0):V3(Math.cos(ph)*Math.cos(el-0.5*k),Math.sin(el-0.5*k)+0.2,Math.sin(ph)*Math.cos(el-0.5*k))).normalize();
    let p=at.clone(),w=o.w;const L=o.len/2;
    for(let k=0;k<2;k++){const v=dirAt(k).multiplyScalar(L);P.push(part(G.box(w,L*1.05,w),p.x+v.x/2,p.y+v.y/2,p.z+v.z/2,o.col,{dir:v}));p.add(v);w*=0.62;}}
  const ne=o.n+2;for(let i=0;i<ne;i++){const a=i/ne*TAU,v=V3(Math.cos(a),0.7,Math.sin(a));P.push(part(G.cone(o.w*0.5,o.w*0.55,3),at.x+Math.cos(a)*o.rim,at.y+o.w*0.15,at.z+Math.sin(a)*o.rim,EYE,{dir:v}));}}
// cones (sessile hingeshells): a plated cone — stacked six-sided rings in alternate shades so the seams show — open at the top, comb legs out of it. r, h, plates, legs, col, col2, col3
function coneShell(P,o,rg,x,y,z){let yy=y,r=o.r;const hp=o.h/o.plates;
  for(let k=0;k<o.plates;k++){P.push(part(G.cyl(r*0.76,r*1.04,hp*1.06,6,true),x,yy+hp/2,z,k%2?o.col2:o.col));yy+=hp;r*=0.76;}
  tuft(P,{n:o.legs,len:o.h*0.9,w:o.r*0.55,spread:0.9,col:o.col3},rg,x,yy,z);}
// ---------- the packer ----------
function packVariants(geos){const pos=[],nor=[],col=[],vid=[];
  geos.forEach((g,k)=>{const p=g.attributes.position.array,n=g.attributes.normal.array,c=g.attributes.color.array;for(let i=0;i<p.length;i++){pos.push(p[i]);nor.push(n[i]);col.push(c[i]);}for(let i=0;i<p.length/3;i++)vid.push(k);g.dispose();});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setAttribute('vid',new THREE.Float32BufferAttribute(vid,1));return g;}
// species(id, fields, build): three variants of one species (build(rg,k) → {P, col, pads}), packed. `top` is the tallest variant's
// highest point (the surface cap in placeFloraType); `vars[k]` carries the variant's own colliders and pads; `pads:true` on the entry
// says the cell must give the instances a dip attribute.
function species(id,f,build){const vars=[],geos=[];let top=0,hasPads=false;
  for(let k=0;k<3;k++){const rg=mulberry(hashStr(id)+k*7919),v=build(rg,k),g=merge(v.P),pa=g.attributes.position.array;let t=0;for(let i=1;i<pa.length;i+=3)if(pa[i]>t)t=pa[i];
    vars.push({col:v.col||null,pads:v.pads||null});geos.push(g);if(t>top)top=t;if(v.pads)hasPads=true;}
  const e=Object.assign({id:id,geo:packVariants(geos),vars:vars,top:top},f);if(hasPads)e.pads=true;return e;}
