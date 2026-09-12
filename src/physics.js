// physics.js — contact. Colliders in a per-cell hash (spheres, capsules, bobbing pads), body shapes (capsules) for every
// creature and the player, verlet chains for arms, tails and tentacles (simulated, collided and skinned into one mesh per
// creature every frame at near LOD), body-to-body contact between creatures and the player, and the disturbance lists
// the sway shader (flora bending out of the way) and the marine snow (displaced water) read.
// Everything here works in world units on plain {x,y,z} objects; nothing allocates per frame. (len3 instead of
// Math.hypot: hypot is several times slower in V8 and this file is the frame's hot loop.)
const len3=(x,y,z)=>Math.sqrt(x*x+y*y+z*z);

// ---------- colliders ----------
// A cell owns its solids and a 2D hash over xz (HB-unit buckets; a solid is entered into every bucket its footprint
// touches, so a query reads only the buckets under the point). Types: 0 sphere {x,y,z,r}; 1 capsule {x,y,z,x2,y2,z2,r};
// 2 pad {x,y,z,r,h,ox,oz,inst}: a horizontal disc of half-thickness h that rides the wave at (ox,oz) and dips under load;
// 3 ellipsoid {x,y,z,m,mi,br}: the unit sphere through an affine map (m: its 3x3, column-major; mi: the inverse) — fans;
// 4 rock {x,y,z,pl,br}: a dodecahedron through an affine map, as its twelve world-space planes (pl: nx,ny,nz,d per face).
// Every dodecahedral rock (boulders, the lumps of heaps, sheets, stacks and ledges) is one, exact to its
// stretch and tilt. v9's spheres took the shortest axis of a lump and left the long one open; v9.1's ellipsoids left the
// corners and edges out (a dodecahedron's vertices stand 26% past its inradius — six units on a 24 m heap).
const HB=16,HN=Math.ceil(CELL/HB)+1;
function makeHash(){return new Array(HN*HN).fill(null);}
function hashAdd(ch,s,x0,x1,z0,z1){
  const i0=clamp(Math.floor((x0-ch.x0)/HB),0,HN-1),i1=clamp(Math.floor((x1-ch.x0)/HB),0,HN-1),j0=clamp(Math.floor((z0-ch.z0)/HB),0,HN-1),j1=clamp(Math.floor((z1-ch.z0)/HB),0,HN-1);
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const k=j*HN+i;(ch.hash[k]||(ch.hash[k]=[])).push(s);}
}
function solidBound(ch,x,y,z,r){ch.solidR=Math.max(ch.solidR,r);const c=ch.sphere.center,d=len3(x-c.x,y-c.y,z-c.z)+r;if(d>ch.sphere.radius)ch.sphere.radius=d;}
function addSolid(ch,x,y,z,r){const s={t:0,x:x,y:y,z:z,r:r};ch.solids.push(s);hashAdd(ch,s,x-r,x+r,z-r,z+r);solidBound(ch,x,y,z,r);}
function addCapsule(ch,x,y,z,x2,y2,z2,r){const s={t:1,x:x,y:y,z:z,x2:x2,y2:y2,z2:z2,r:r};ch.solids.push(s);hashAdd(ch,s,Math.min(x,x2)-r,Math.max(x,x2)+r,Math.min(z,z2)-r,Math.max(z,z2)+r);solidBound(ch,(x+x2)/2,(y+y2)/2,(z+z2)/2,r+len3(x-x2,y-y2,z-z2)/2);}
function addPad(ch,x,y,z,r,h,ox,oz,inst){const s={t:2,x:x,y:y,z:z,r:r,h:h,ox:ox,oz:oz,inst:inst};ch.solids.push(s);hashAdd(ch,s,x-r,x+r,z-r,z+r);solidBound(ch,x,y,z,r+2);}
// W: the 16 elements of the world matrix that carries the unit sphere onto the rock (a Matrix4's elements).
function addEllipsoid(ch,W){
  const m=new Float32Array([W[0],W[1],W[2],W[4],W[5],W[6],W[8],W[9],W[10]]),mi=new Float32Array(9);
  const a=m[0],b=m[3],c=m[6],d=m[1],e=m[4],f=m[7],g=m[2],h=m[5],i=m[8]; // rows: (a b c / d e f / g h i)
  const A=e*i-f*h,B=-(d*i-f*g),C=d*h-e*g,det=a*A+b*B+c*C;if(Math.abs(det)<1e-9)return;
  const id=1/det;mi[0]=A*id;mi[3]=-(b*i-c*h)*id;mi[6]=(b*f-c*e)*id;mi[1]=B*id;mi[4]=(a*i-c*g)*id;mi[7]=-(a*f-c*d)*id;mi[2]=C*id;mi[5]=-(a*h-b*g)*id;mi[8]=(a*e-b*d)*id;
  const br=Math.max(len3(m[0],m[1],m[2]),len3(m[3],m[4],m[5]),len3(m[6],m[7],m[8]));
  const s={t:3,x:W[12],y:W[13],z:W[14],m:m,mi:mi,br:br};ch.solids.push(s);hashAdd(ch,s,s.x-br,s.x+br,s.z-br,s.z+br);solidBound(ch,s.x,s.y,s.z,br);
}
// A dodecahedron of circumradius 1 (three's DodecahedronGeometry(1,0)) has these twelve face normals; its inradius is
// DINR. W maps it into the world (the 16 elements of a Matrix4: the lump's own transform, then the instance's); each face
// plane n.x <= DINR becomes ((W^-T n) . (p - c)) <= DINR, normalised.
const DN=(function(){const t=(1+Math.sqrt(5))/2,out=[];for(const a of [1,-1])for(const b of [1,-1]){out.push([a,0,b*t]);out.push([0,a*t,b]);out.push([a*t,b,0]);}return out.map(v=>{const l=Math.hypot(v[0],v[1],v[2]);return [v[0]/l,v[1]/l,v[2]/l];});})();
const DINR=0.7946544723; // the inradius of a dodecahedron of circumradius 1 (flora.js rockGeo builds the drawn rock on the same figure)
function addRock(ch,W){
  const a=W[0],d=W[1],g=W[2],b=W[4],e=W[5],h=W[6],c=W[8],f=W[9],i=W[10]; // rows (a b c / d e f / g h i) of the 3x3
  const A=e*i-f*h,B=-(d*i-f*g),C=d*h-e*g,det=a*A+b*B+c*C;if(Math.abs(det)<1e-9)return;
  const id=1/det;
  // the inverse, by rows: r0=(A, -(b*i-c*h), (b*f-c*e)) ...; W^-T n = (col0 of Winv . n, col1 . n, col2 . n) = (rows of Winv^T)
  const i00=A*id,i01=-(b*i-c*h)*id,i02=(b*f-c*e)*id,i10=B*id,i11=(a*i-c*g)*id,i12=-(a*f-c*d)*id,i20=C*id,i21=-(a*h-b*g)*id,i22=(a*e-b*d)*id;
  const cx=W[12],cy=W[13],cz=W[14],pl=new Float32Array(48);
  for(let k=0;k<12;k++){const n=DN[k];let nx=i00*n[0]+i10*n[1]+i20*n[2],ny=i01*n[0]+i11*n[1]+i21*n[2],nz=i02*n[0]+i12*n[1]+i22*n[2];const nl=len3(nx,ny,nz);nx/=nl;ny/=nl;nz/=nl;
    pl[k*4]=nx;pl[k*4+1]=ny;pl[k*4+2]=nz;pl[k*4+3]=DINR/nl+nx*cx+ny*cy+nz*cz;}
  const br=Math.max(len3(W[0],W[1],W[2]),len3(W[4],W[5],W[6]),len3(W[8],W[9],W[10]));
  const s={t:4,x:cx,y:cy,z:cz,pl:pl,br:br};ch.solids.push(s);hashAdd(ch,s,cx-br,cx+br,cz-br,cz+br);solidBound(ch,cx,cy,cz,br);
}
// Lumps: {x,y,z,r,s,rot} (a rock lump: a dodecahedron of circumradius r, stretched s and tilted rot, through m) or
// {x,y,z,r} (a plain sphere of radius r*rs through m's translation).
const LM4=new THREE.Matrix4(),LQ=new THREE.Quaternion(),LE=new THREE.Euler(),LV=new THREE.Vector3(),LS=new THREE.Vector3();
function lumpMatrix(l,m){LE.set(l.rot[0],l.rot[1],l.rot[2]);LQ.setFromEuler(LE);LV.set(l.x,l.y,l.z);LS.set(l.s[0]*l.r,l.s[1]*l.r,l.s[2]*l.r);LM4.compose(LV,LQ,LS);if(m)LM4.premultiply(m);return LM4.elements;}
function addLumps(ch,lumps,m,rs){for(const l of lumps){if(l.s)addRock(ch,lumpMatrix(l,m));else{T4.set(l.x,l.y,l.z).applyMatrix4(m);addSolid(ch,T4.x,T4.y,T4.z,l.r*rs);}}}
// A flora instance's colliders from its entry's `col` (local unit space) through the instance matrix. Capsule radii scale
// with the xz scale, spheres with the mean scale. Pads (rafts) become discs that follow the instance's bob.
function addFloraSolids(ch,f,m,x,y,z,inst,soft){ // soft: a swaying plant — its solids are flagged fl, so a push against them is a brush, not a knock (audio.js)
  const n0=ch.solids.length,e=m.elements,sx=len3(e[0],e[1],e[2]),sy=len3(e[4],e[5],e[6]),sz=len3(e[8],e[9],e[10]),sm=(sx+sy+sz)/3,sh=(sx+sz)/2;
  if(f.col)for(const c of f.col){
    if(c.s){T4.set(c.s[0],c.s[1],c.s[2]).applyMatrix4(m);addSolid(ch,T4.x,T4.y,T4.z,c.s[3]*sm);}
    else if(c.e){LV.set(c.e[0],c.e[1],c.e[2]);LS.set(c.e[3],c.e[4],c.e[5]);LQ.identity();LM4.compose(LV,LQ,LS).premultiply(m);addEllipsoid(ch,LM4.elements);}
    else if(c.d){LV.set(0,0,0);LS.set(c.d,c.d,c.d);LQ.identity();LM4.compose(LV,LQ,LS).premultiply(m);addRock(ch,LM4.elements);}
    else{T4.set(c.a[0],c.a[1],c.a[2]).applyMatrix4(m);const ax=T4.x,ay=T4.y,az=T4.z;T4.set(c.b[0],c.b[1],c.b[2]).applyMatrix4(m);addCapsule(ch,ax,ay,az,T4.x,T4.y,T4.z,c.r*sh);}
  }
  if(f.pads)for(const p of f.pads){T4.set(p.x,0,p.z).applyMatrix4(m);addPad(ch,T4.x,T4.y,T4.z,p.r*sh,Math.max(0.12,p.h*sy),x,z,inst);}
  if(soft)for(let k=n0;k<ch.solids.length;k++)ch.solids[k].fl=1;
}
// Push p out of every solid near it (pad = the body's radius). Returns true if it moved; vel, if given, loses its inward
// component. extra: a chunk not yet in the grid (used while it is being generated). Pads: a body whose centre is above the
// disc's centre is set down on it (within a short reach, so a body bobbing just over a pad, or a pad rising under one,
// sticks) and `lastPad` says so; a body below is kept under it. A pad seen from the side is nothing.
let lastPad=null,contactK=0; // contactK: what the pushes since it was last cleared moved a point out of — 1 a soft plant, 2 rock or a hard thing (the player clears it, audio.js reads it)
// noPad: ignore pads (the camera).
function solidPush(p,pad,vel,extra,noPad){
  const ci=cellOf(p.x),cj=cellOf(p.z);let any=false;lastPad=null;
  for(let pass=0;pass<3;pass++){
    let moved=false;
    for(let n=-1;n<=8;n++){
      let ch;if(n<0)ch=extra;else{const i=ci+(n%3)-1,j=cj+((n/3)|0)-1;if(i<0||j<0||i>=NCELL||j>=NCELL)continue;ch=chunkGrid[i*NCELL+j];}
      if(!ch||!ch.solids.length)continue;
      const mg=ch.solidR+pad;if(p.x<ch.x0-mg||p.x>ch.x0+CELL+mg||p.z<ch.z0-mg||p.z>ch.z0+CELL+mg)continue;
      const i0=clamp(Math.floor((p.x-pad-ch.x0)/HB),0,HN-1),i1=clamp(Math.floor((p.x+pad-ch.x0)/HB),0,HN-1),j0=clamp(Math.floor((p.z-pad-ch.z0)/HB),0,HN-1),j1=clamp(Math.floor((p.z+pad-ch.z0)/HB),0,HN-1);
      for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const B=ch.hash[j*HN+i];if(!B)continue;
        for(let k=0;k<B.length;k++){const s=B[k];
          if(s.t===2){
            if(noPad)continue;const dx=p.x-s.x,dz=p.z-s.z,rr=s.r+pad*0.4;if(dx*dx+dz*dz>=rr*rr)continue;
            const cy=s.y+waveH(s.ox,s.oz)-s.inst.dip,top=cy+s.h,bot=cy-s.h;
            if(p.y>=cy){const fy=p.y-pad;
              if(fy<top+0.45&&fy>top-(2*s.h+pad*0.5)&&!(vel&&vel.y>0.6)){p.y=top+pad;moved=true;lastPad=s;if(vel&&vel.y<0)vel.y=0;} // set down on it
              else if(fy<top){const d=Math.sqrt(dx*dx+dz*dz)||1e-3,f=(rr-d)/d;p.x+=dx*f;p.z+=dz*f;moved=true; // too deep to climb on: the rim is a wall
                if(vel){const vn=(vel.x*dx+vel.z*dz)/d;if(vn<0){vel.x-=dx/d*vn;vel.z-=dz/d*vn;}}}}
            else{const hy=p.y+pad;if(hy>bot){p.y=bot-pad;moved=true;if(vel&&vel.y>0)vel.y=0;}} // under it: kept under
            continue;
          }
          if(s.t===4){ // rock: a sphere of radius pad against twelve planes; inside them all, out along the least-penetrated face
            const dx=p.x-s.x,dy=p.y-s.y,dz=p.z-s.z,bb=s.br+pad;if(dx*dx+dy*dy+dz*dz>=bb*bb)continue;
            const pl=s.pl;let best=-1e9,bk=0;
            for(let q=0;q<48;q+=4){const dd=pl[q]*p.x+pl[q+1]*p.y+pl[q+2]*p.z-pl[q+3];if(dd>=pad){best=1e9;break;}if(dd>best){best=dd;bk=q;}}
            if(best>=pad)continue;
            const nx=pl[bk],ny=pl[bk+1],nz=pl[bk+2],f=pad-best;p.x+=nx*f;p.y+=ny*f;p.z+=nz*f;moved=true;contactK|=s.fl?1:2;
            if(vel){const vn=vel.x*nx+vel.y*ny+vel.z*nz;if(vn<0){vel.x-=nx*vn;vel.y-=ny*vn;vel.z-=nz*vn;}}
            continue;
          }
          if(s.t===3){ // ellipsoid: into the unit-sphere frame, out along the ray from the centre to pad clear of the surface
            const dx=p.x-s.x,dy=p.y-s.y,dz=p.z-s.z,bb=s.br+pad;if(dx*dx+dy*dy+dz*dz>=bb*bb)continue;
            const mi=s.mi,m=s.m,qx=mi[0]*dx+mi[3]*dy+mi[6]*dz,qy=mi[1]*dx+mi[4]*dy+mi[7]*dz,qz=mi[2]*dx+mi[5]*dy+mi[8]*dz,ql=len3(qx,qy,qz);
            let ux,uy,uz;if(ql<1e-6){ux=0;uy=1;uz=0;}else{ux=qx/ql;uy=qy/ql;uz=qz/ql;}
            const wx=m[0]*ux+m[3]*uy+m[6]*uz,wy=m[1]*ux+m[4]*uy+m[7]*uz,wz=m[2]*ux+m[5]*uy+m[8]*uz,wl=len3(wx,wy,wz); // local scale along the ray
            if((ql-1)*wl>=pad)continue;
            const k=1+pad/wl;p.x=s.x+wx*k;p.y=s.y+wy*k;p.z=s.z+wz*k;moved=true;contactK|=s.fl?1:2;
            if(vel){let nx=mi[0]*ux+mi[1]*uy+mi[2]*uz,ny=mi[3]*ux+mi[4]*uy+mi[5]*uz,nz=mi[6]*ux+mi[7]*uy+mi[8]*uz;const nl=len3(nx,ny,nz)||1;nx/=nl;ny/=nl;nz/=nl; // the surface normal
              const vn=vel.x*nx+vel.y*ny+vel.z*nz;if(vn<0){vel.x-=nx*vn;vel.y-=ny*vn;vel.z-=nz*vn;}}
            continue;
          }
          let sx=s.x,sy=s.y,sz=s.z;
          if(s.t===1){const ex=s.x2-s.x,ey=s.y2-s.y,ez=s.z2-s.z,l2=ex*ex+ey*ey+ez*ez;if(l2>1e-6){const tt=clamp(((p.x-s.x)*ex+(p.y-s.y)*ey+(p.z-s.z)*ez)/l2,0,1);sx+=ex*tt;sy+=ey*tt;sz+=ez*tt;}}
          const R=s.r+pad,dx=p.x-sx,dy=p.y-sy,dz=p.z-sz,d2=dx*dx+dy*dy+dz*dz;if(d2>=R*R||d2<1e-6)continue;
          const d=Math.sqrt(d2),f=(R-d)/d;p.x+=dx*f;p.y+=dy*f;p.z+=dz*f;moved=true;contactK|=s.fl?1:2;
          if(vel){const vn=(vel.x*dx+vel.y*dy+vel.z*dz)/d;if(vn<0){vel.x-=dx/d*vn;vel.y-=dy/d*vn;vel.z-=dz/d*vn;}}
        }
      }
    }
    if(!moved)break;any=true;
  }
  return any;
}
// A body is a capsule, not a ball: the centre is pushed out with its radius rc, then the nose and the tail (len along the
// facing, radius rn) are pushed out and carry the body with them, so a finback can't park its snout in a rock. Returns the
// pad the centre landed on, if any.
function bodyPush(p,vel,q,len,rc,rn){
  solidPush(p,rc,vel,null);const pad=lastPad;
  T3.set(0,0,1).applyQuaternion(q);
  T1.copy(p).addScaledVector(T3,len);let ox=T1.x,oy=T1.y,oz=T1.z;if(solidPush(T1,rn,vel,null,true)){p.x+=T1.x-ox;p.y+=T1.y-oy;p.z+=T1.z-oz;}
  T1.copy(p).addScaledVector(T3,-len);ox=T1.x;oy=T1.y;oz=T1.z;if(solidPush(T1,rn,vel,null,true)){p.x+=T1.x-ox;p.y+=T1.y-oy;p.z+=T1.z-oz;}
  lastPad=pad;return pad;
}
// Pads dip under a body and spring back (a little under-damped, so a landing bounces once). The dip is per raft instance,
// written into the instance's aDip attribute (scene.js, the bob materials). Only loaded or still-moving pads are ticked.
const livePads=[];
function loadPad(s,amount){const I=s.inst;I.load=Math.max(I.load,amount);if(!I.live){I.live=true;livePads.push(I);}}
function updatePads(dt){
  for(let i=livePads.length-1;i>=0;i--){const I=livePads[i];
    I.dv+=((I.load-I.dip)*60-I.dv*7)*dt;I.dip+=I.dv*dt;I.load=0;
    const a=I.im.geometry.attributes.aDip;if(a){a.array[I.idx]=I.dip;a.needsUpdate=true;}
    if(Math.abs(I.dip)<0.004&&Math.abs(I.dv)<0.01){I.dip=0;I.dv=0;if(a){a.array[I.idx]=0;a.needsUpdate=true;}I.live=false;livePads.splice(i,1);}
  }
}

// ---------- body shapes ----------
// A builder gives its creature `hit`: capsules {a:[x,y,z],b:[x,y,z],r} in its own unscaled frame (facing +z). Each frame
// the owners near the player get them in world space (shapesW), plus the live segments of their chains.
function worldShapes(o){
  const g=o.b.g,e=g.matrix.elements,s=len3(e[0],e[1],e[2]),hit=o.b.hit||[];
  const W=o.shapesW||(o.shapesW=[]),C=o.chainW||(o.chainW=[]);let n=0,m=0;
  const put=(A,i,ax,ay,az,bx,by,bz,r)=>{let w=A[i];if(!w)w=A[i]={ax:0,ay:0,az:0,bx:0,by:0,bz:0,r:0,cx:0,cy:0,cz:0,br:0,own:o};w.ax=ax;w.ay=ay;w.az=az;w.bx=bx;w.by=by;w.bz=bz;w.r=r;w.cx=(ax+bx)/2;w.cy=(ay+by)/2;w.cz=(az+bz)/2;w.br=r+len3(ax-bx,ay-by,az-bz)/2;};
  for(const h of hit){const a=h.a,b=h.b;
    put(W,n++,e[0]*a[0]+e[4]*a[1]+e[8]*a[2]+e[12],e[1]*a[0]+e[5]*a[1]+e[9]*a[2]+e[13],e[2]*a[0]+e[6]*a[1]+e[10]*a[2]+e[14],
        e[0]*b[0]+e[4]*b[1]+e[8]*b[2]+e[12],e[1]*b[0]+e[5]*b[1]+e[9]*b[2]+e[13],e[2]*b[0]+e[6]*b[1]+e[10]*b[2]+e[14],h.r*s);}
  if(o.b.rigs)for(const rig of o.b.rigs)if(rig.solid)for(const c of rig.chains){const P=c.pts;for(let k=0;k<c.n;k++)put(C,m++,P[k*3],P[k*3+1],P[k*3+2],P[k*3+3],P[k*3+4],P[k*3+5],c.r[k]);}
  W.length=n;C.length=m;
  let br=0,cr=0;for(const w of W){const d=len3(w.cx-o.pos.x,w.cy-o.pos.y,w.cz-o.pos.z)+w.br;if(d>br)br=d;}
  for(const w of C){const d=len3(w.cx-o.pos.x,w.cy-o.pos.y,w.cz-o.pos.z)+w.br;if(d>cr)cr=d;}
  o.bound=br;o.reach=Math.max(br,cr);
}
// A sphere (the player's body) kept out of the capsules of a list (a creature's arms): the arms are simulated against the
// player's body too, so the two meet in the middle and neither passes through the other.
function sphereOutOf(p,R,vel,C){
  for(const w of C){const cd=len3(w.cx-p.x,w.cy-p.y,w.cz-p.z);if(cd>w.br+R)continue;
    const ex=w.bx-w.ax,ey=w.by-w.ay,ez=w.bz-w.az,l2=ex*ex+ey*ey+ez*ez;let qx=w.ax,qy=w.ay,qz=w.az;
    if(l2>1e-6){const tt=clamp(((p.x-w.ax)*ex+(p.y-w.ay)*ey+(p.z-w.az)*ez)/l2,0,1);qx+=ex*tt;qy+=ey*tt;qz+=ez*tt;}
    const dx=p.x-qx,dy=p.y-qy,dz=p.z-qz,d=len3(dx,dy,dz),RR=w.r+R;if(d>=RR||d<1e-5)continue;
    const f=(RR-d)/d;p.x+=dx*f;p.y+=dy*f;p.z+=dz*f;
    if(vel){const vn=(vel.x*dx+vel.y*dy+vel.z*dz)/d;if(vn<0){vel.x-=dx/d*vn;vel.y-=dy/d*vn;vel.z-=dz/d*vn;}}}
}
// closest points of two segments (Ericson); writes the pair into CP
const CP={ax:0,ay:0,az:0,bx:0,by:0,bz:0};
function segSeg(A,B){
  const d1x=A.bx-A.ax,d1y=A.by-A.ay,d1z=A.bz-A.az,d2x=B.bx-B.ax,d2y=B.by-B.ay,d2z=B.bz-B.az,rx=A.ax-B.ax,ry=A.ay-B.ay,rz=A.az-B.az;
  const a=d1x*d1x+d1y*d1y+d1z*d1z,e=d2x*d2x+d2y*d2y+d2z*d2z,f=d2x*rx+d2y*ry+d2z*rz;let s=0,t=0;
  if(a<=1e-8&&e<=1e-8){}
  else if(a<=1e-8){t=clamp(f/e,0,1);}
  else{const c=d1x*rx+d1y*ry+d1z*rz;
    if(e<=1e-8){s=clamp(-c/a,0,1);}
    else{const b=d1x*d2x+d1y*d2y+d1z*d2z,den=a*e-b*b;s=den!==0?clamp((b*f-c*e)/den,0,1):0;t=(b*s+f)/e;
      if(t<0){t=0;s=clamp(-c/a,0,1);}else if(t>1){t=1;s=clamp((b-c)/a,0,1);}}}
  CP.ax=A.ax+d1x*s;CP.ay=A.ay+d1y*s;CP.az=A.az+d1z*s;CP.bx=B.ax+d2x*t;CP.by=B.ay+d2y*t;CP.bz=B.az+d2z*t;
}
// Bodies that touch push apart by their actual shapes, the lighter one moving more (mass ~ size³; a sitting lurker is
// wedged in its rock). Velocities lose the closing component. Moves pos and vel directly and drags the shapes along.
function shiftShapes(o,dx,dy,dz){o.pos.x+=dx;o.pos.y+=dy;o.pos.z+=dz;for(const w of o.shapesW){w.ax+=dx;w.ay+=dy;w.az+=dz;w.bx+=dx;w.by+=dy;w.bz+=dz;w.cx+=dx;w.cy+=dy;w.cz+=dz;}}
function resolveBodies(list){
  for(const o of list)o.cWith=null; // who this body touched this frame (combat.js reads it: a hold's rope stops shortening at the contact)
  for(let i=0;i<list.length;i++){const A=list[i];
    for(let j=i+1;j<list.length;j++){const B=list[j];
      const dd=A.pos.distanceTo(B.pos);if(dd>A.bound+B.bound)continue;
      const wa=B.mass/(A.mass+B.mass),wb=A.mass/(A.mass+B.mass);
      for(const sa of A.shapesW)for(const sb of B.shapesW){
        const cd=len3(sa.cx-sb.cx,sa.cy-sb.cy,sa.cz-sb.cz);if(cd>sa.br+sb.br)continue;
        segSeg(sa,sb);let nx=CP.ax-CP.bx,ny=CP.ay-CP.by,nz=CP.az-CP.bz;const d=len3(nx,ny,nz),R=sa.r+sb.r;if(d>=R)continue;
        A.cWith=B;B.cWith=A;
        if(d<1e-4){nx=A.pos.x-B.pos.x;ny=A.pos.y-B.pos.y;nz=A.pos.z-B.pos.z;const l=len3(nx,ny,nz)||1;nx/=l;ny/=l;nz/=l;}else{nx/=d;ny/=d;nz/=d;}
        const pen=R-d;shiftShapes(A,nx*pen*wa,ny*pen*wa,nz*pen*wa);shiftShapes(B,-nx*pen*wb,-ny*pen*wb,-nz*pen*wb);
        const vn=(A.vel.x-B.vel.x)*nx+(A.vel.y-B.vel.y)*ny+(A.vel.z-B.vel.z)*nz;
        if(vn<0){A.vel.x-=nx*vn*wa;A.vel.y-=ny*vn*wa;A.vel.z-=nz*vn*wa;B.vel.x+=nx*vn*wb;B.vel.y+=ny*vn*wb;B.vel.z+=nz*vn*wb;}
      }
    }
  }
}

// ---------- chains ----------
// A chain: n segments from a root that is welded to the owner (pts[0]), rest points restL in the owner's unscaled local
// frame (filled by the creature's anim each frame: the swimming pose), radii r[k] per segment (world), lengths L[k]
// (world). Position-based: each point is pulled toward its rest by a spring, damped by the water, kept at its length
// from the previous point (root-anchored), kept from folding past a joint limit, and pushed out of the ground, the
// solids, and the body shapes it is given (its owner's, the player's, its prey's). When the owner is grabbing, the tips
// are drawn to the prey and the shape contact wraps them around it. sign is the direction the geometry's segments run in
// (+z for arms, -z for a tail behind the head). up is the roll reference in the owner's frame.
function makeChain(n,sign,upx,upy,upz,o){
  o=o||{};return {n:n,sign:sign,pts:new Float32Array((n+1)*3),vel:new Float32Array((n+1)*3),restL:new Float32Array((n+1)*3),L:new Float32Array(n),r:new Float32Array(n),rl:new Float32Array(n),rr:new Float32Array(n),up:[upx,upy,upz],ks:o.ks||50,damp:o.damp||9,cosMax:o.cosMax||0.55,fresh:true,touch:0,lastT:-1};
}
const SIM={shapes:[],grab:null,self:null,ch:null},JOINT_SOFT=0.2; // the joint limit's ramp width in cos: 0.55 -> 0.75 is 57 -> 41 degrees
const CPT={x:0,y:0,z:0};
function chainGround(x,z){const ch=SIM.ch;return ch&&x>=ch.x0&&x<ch.x0+CELL&&z>=ch.z0&&z<ch.z0+CELL?ch.h(x,z):groundAt(x,z);}
function simChain(c,e,s,dt){
  const P=c.pts,V=c.vel,R=c.restL,n=c.n;if(dt<1e-4)return;
  // rest in world; the rest's own velocity (the body moving, the swim pose) is what the drag is measured against, so a
  // steady swim carries the arms with it and only turns, lunges and contact make them lag
  const RW=c.rw||(c.rw=new Float32Array((n+1)*3)),RP=simChain.RP||(simChain.RP=new Float32Array(3*40));
  for(let i=0,m=(n+1)*3;i<m;i++)RP[i]=RW[i];
  for(let k=0;k<=n;k++){const x=R[k*3],y=R[k*3+1],z=R[k*3+2];RW[k*3]=e[0]*x+e[4]*y+e[8]*z+e[12];RW[k*3+1]=e[1]*x+e[5]*y+e[9]*z+e[13];RW[k*3+2]=e[2]*x+e[6]*y+e[10]*z+e[14];}
  for(let k=0;k<n;k++){c.L[k]=c.rl[k]*s;c.r[k]=c.rr[k]*s;}
  const jump=len3(RW[0]-P[0],RW[1]-P[1],RW[2]-P[2]),stale=t-c.lastT>0.25;c.lastT=t; // stale: not simulated lately (far LOD), so its memory is no use
  if(c.fresh||stale||jump>8){for(let k=0;k<=n;k++){P[k*3]=RW[k*3];P[k*3+1]=RW[k*3+1];P[k*3+2]=RW[k*3+2];}V.fill(0);c.fresh=false;c.touch=0;return;}
  P[0]=RW[0];P[1]=RW[1];P[2]=RW[2];
  const G=SIM.grab,kd=Math.exp(-c.damp*dt),ks=c.ks*dt*(G?0.3:1);
  const Q=simChain.Q||(simChain.Q=new Float32Array(3*40));
  for(let k=1;k<=n;k++){const i=k*3;const rvx=(RW[i]-RP[i])/dt,rvy=(RW[i+1]-RP[i+1])/dt,rvz=(RW[i+2]-RP[i+2])/dt;
    let vx=rvx+(V[i]-rvx)*kd,vy=rvy+(V[i+1]-rvy)*kd,vz=rvz+(V[i+2]-rvz)*kd;
    vx+=(RW[i]-P[i])*ks;vy+=(RW[i+1]-P[i+1])*ks;vz+=(RW[i+2]-P[i+2])*ks;
    let x=P[i]+vx*dt,y=P[i+1]+vy*dt,z=P[i+2]+vz*dt;
    if(G){const g=8*dt*k/n;x+=(G.x-x)*g;y+=(G.y-y)*g;z+=(G.z-z)*g;}
    Q[i]=x;Q[i+1]=y;Q[i+2]=z;}
  Q[0]=P[0];Q[1]=P[1];Q[2]=P[2];
  const constrain=()=>{for(let k=1;k<=n;k++){const i=k*3,j=i-3;let dx=Q[i]-Q[j],dy=Q[i+1]-Q[j+1],dz=Q[i+2]-Q[j+2];const d=len3(dx,dy,dz)||1e-6,f=c.L[k-1]/d;Q[i]=Q[j]+dx*f;Q[i+1]=Q[j+1]+dy*f;Q[i+2]=Q[j+2]+dz*f;
    if(k>=2){const h=j-3;const ax=Q[j]-Q[h],ay=Q[j+1]-Q[h+1],az=Q[j+2]-Q[h+2],al=len3(ax,ay,az)||1e-6;dx=Q[i]-Q[j];dy=Q[i+1]-Q[j+1];dz=Q[i+2]-Q[j+2];
      // the joint limit as a ramp: from JOINT_SOFT above cosMax the point is eased toward the straight continuation, fully (half-way
      // a pass) at cosMax. A hard threshold snapped an arm bent past it half-way straight in one pass — the coil's short segments got
      // there on every deceleration (an arm leads a slowing body by a/ks, 0.11 units on a 0.25 segment) and flung, one arm after another
      const cs=(ax*dx+ay*dy+az*dz)/(al*c.L[k-1]);if(cs<c.cosMax+JOINT_SOFT){const L=c.L[k-1]/al,wj=0.5*Math.min(1,(c.cosMax+JOINT_SOFT-cs)/JOINT_SOFT);Q[i]=lerp(Q[i],Q[j]+ax*L,wj);Q[i+1]=lerp(Q[i+1],Q[j+1]+ay*L,wj);Q[i+2]=lerp(Q[i+2],Q[j+2]+az*L,wj);}}}};
  constrain();constrain();
  // contact: ground, solids, bodies; the lengths again; then the bodies once more so the last word is the contact's
  let touch=0;const S=SIM.shapes;
  const contact=(solids)=>{for(let k=1;k<=n;k++){const i=k*3,r=c.r[k-1];let x=Q[i],y=Q[i+1],z=Q[i+2];
    const gh=chainGround(x,z)+r;if(y<gh)y=gh;
    if(solids){CPT.x=x;CPT.y=y;CPT.z=z;solidPush(CPT,r,null,null);x=CPT.x;y=CPT.y;z=CPT.z;}
    for(let m=0;m<S.length;m++){const w=S[m];const cd=len3(w.cx-x,w.cy-y,w.cz-z);if(cd>w.br+r)continue;
      const ex=w.bx-w.ax,ey=w.by-w.ay,ez=w.bz-w.az,l2=ex*ex+ey*ey+ez*ez;let qx=w.ax,qy=w.ay,qz=w.az;
      if(l2>1e-6){const tt=clamp(((x-w.ax)*ex+(y-w.ay)*ey+(z-w.az)*ez)/l2,0,1);qx+=ex*tt;qy+=ey*tt;qz+=ez*tt;}
      const dx=x-qx,dy=y-qy,dz=z-qz,d=len3(dx,dy,dz);let RR=w.r*(w.own===SIM.self?0.85:1)+r;
      if(w.own===SIM.self){ // its own body: the first free point is exempt (it sits where the arm leaves the hull, which the capsule
        // overshoots — the coil's ten arms were pushed out and pulled back every frame and shivered, and the push, outward only against
        // a swinging rest, ratcheted the arm into a bend); any other point may sit as deep as its rest point does, no deeper
        if(k===1)continue;
        if(d<RR){let ux=w.ax,uy=w.ay,uz=w.az;if(l2>1e-6){const tt=clamp(((RW[i]-w.ax)*ex+(RW[i+1]-w.ay)*ey+(RW[i+2]-w.az)*ez)/l2,0,1);ux+=ex*tt;uy+=ey*tt;uz+=ez*tt;}
          const dr=len3(RW[i]-ux,RW[i+1]-uy,RW[i+2]-uz);if(dr<RR)RR=dr;}}
      if(d<RR&&d>1e-5){const f=(RR-d)/d;x+=dx*f;y+=dy*f;z+=dz*f;if(G&&w.own===G.own)touch++;}}
    Q[i]=x;Q[i+1]=y;Q[i+2]=z;}};
  contact(true);
  constrain();contact(false);
  for(let k=1;k<=n;k++){const i=k*3;let vx=(Q[i]-P[i])/dt,vy=(Q[i+1]-P[i+1])/dt,vz=(Q[i+2]-P[i+2])/dt;const vl=len3(vx,vy,vz);if(vl>40){vx*=40/vl;vy*=40/vl;vz*=40/vl;}
    V[i]=vx;V[i+1]=vy;V[i+2]=vz;P[i]=Q[i];P[i+1]=Q[i+1];P[i+2]=Q[i+2];}
  c.touch=touch;
}
// A rig: the chains of one mesh plus the skin — per vertex, the segment it belongs to and its offset from that segment's
// origin in the segment's rest frame. Skinning is in the owner's local frame (points converted once per segment).
function rigSkin(rig,e){
  const s2=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],tx=e[12],ty=e[13],tz=e[14];
  const pos=rig.geo.attributes.position.array,nor=rig.geo.attributes.normal.array,LO=rig.lo,LN=rig.ln,SG=rig.sg;
  const F=rigSkin.F||(rigSkin.F=new Float32Array(12*160));let seg=0;
  for(const c of rig.chains){const P=c.pts,n=c.n,ux=c.up[0],uy=c.up[1],uz=c.up[2];
    const LP=rigSkin.LP||(rigSkin.LP=new Float32Array(3*40));
    for(let k=0;k<=n;k++){const wx=P[k*3]-tx,wy=P[k*3+1]-ty,wz=P[k*3+2]-tz;LP[k*3]=(e[0]*wx+e[1]*wy+e[2]*wz)/s2;LP[k*3+1]=(e[4]*wx+e[5]*wy+e[6]*wz)/s2;LP[k*3+2]=(e[8]*wx+e[9]*wy+e[10]*wz)/s2;}
    for(let k=0;k<n;k++){const i=k*3;let zx=(LP[i+3]-LP[i])*c.sign,zy=(LP[i+4]-LP[i+1])*c.sign,zz=(LP[i+5]-LP[i+2])*c.sign;const zl=len3(zx,zy,zz)||1e-6;zx/=zl;zy/=zl;zz/=zl;
      const d=ux*zx+uy*zy+uz*zz;let yx=ux-zx*d,yy=uy-zy*d,yz=uz-zz*d;let yl=len3(yx,yy,yz);if(yl<1e-4){yx=zy;yy=-zx;yz=0;yl=len3(yx,yy,yz)||1;}yx/=yl;yy/=yl;yz/=yl;
      const xx=yy*zz-yz*zy,xy=yz*zx-yx*zz,xz=yx*zy-yy*zx;
      const f=(seg+k)*12;F[f]=xx;F[f+1]=xy;F[f+2]=xz;F[f+3]=yx;F[f+4]=yy;F[f+5]=yz;F[f+6]=zx;F[f+7]=zy;F[f+8]=zz;F[f+9]=LP[i];F[f+10]=LP[i+1];F[f+11]=LP[i+2];}
    seg+=n;}
  for(let v=0,nv=SG.length;v<nv;v++){const f=SG[v]*12,i=v*3,lx=LO[i],ly=LO[i+1],lz=LO[i+2],nx=LN[i],ny=LN[i+1],nz=LN[i+2];
    pos[i]=F[f]*lx+F[f+3]*ly+F[f+6]*lz+F[f+9];pos[i+1]=F[f+1]*lx+F[f+4]*ly+F[f+7]*lz+F[f+10];pos[i+2]=F[f+2]*lx+F[f+5]*ly+F[f+8]*lz+F[f+11];
    nor[i]=F[f]*nx+F[f+3]*ny+F[f+6]*nz;nor[i+1]=F[f+1]*nx+F[f+4]*ny+F[f+7]*nz;nor[i+2]=F[f+2]*nx+F[f+5]*ny+F[f+8]*nz;}
  rig.geo.attributes.position.needsUpdate=true;rig.geo.attributes.normal.needsUpdate=true;
}
// Build a rig's mesh from segment parts: segs is a list of {parts:[part...], chain, k} (parts in the segment's rest frame,
// the segment's origin at its chain point). One geometry for the whole rig.
function makeRig(segs,mat,chains){
  const pos=[],nor=[],col=[],sg=[];let base=0;
  for(const c of chains)c.base=base,base+=c.n;
  for(const sd of segs){const g=merge(sd.parts),pa=g.attributes.position.array,na=g.attributes.normal.array,ca=g.attributes.color.array,id=sd.chain.base+sd.k;
    for(let i=0;i<pa.length;i+=3){pos.push(pa[i],pa[i+1],pa[i+2]);nor.push(na[i],na[i+1],na[i+2]);col.push(ca[i],ca[i+1],ca[i+2]);sg.push(id);}
    g.dispose();}
  const geo=new THREE.BufferGeometry();
  const pa=new THREE.Float32BufferAttribute(pos,3),na=new THREE.Float32BufferAttribute(nor,3);pa.setUsage(THREE.DynamicDrawUsage);na.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position',pa);geo.setAttribute('normal',na);geo.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  const rig={geo:geo,mesh:new THREE.Mesh(geo,mat),chains:chains,lo:Float32Array.from(pos),ln:Float32Array.from(nor),sg:Int16Array.from(sg),solid:true};
  rig.mesh.frustumCulled=false;
  return rig;
}
// Rest pose in the rig's own frame, the identity matrix: used once at build so the geometry and the far-LOD bake hold the pose.
const IDM=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function rigRest(rig){for(const c of rig.chains){for(let k=0;k<=c.n;k++){c.pts[k*3]=c.restL[k*3];c.pts[k*3+1]=c.restL[k*3+1];c.pts[k*3+2]=c.restL[k*3+2];}}rigSkin(rig,IDM);}
// Step every rig of an owner (a creature, the player or a menu creature): its group's matrix is the frame; ctx gives the
// shapes to collide with and the grab target.
function stepRigs(o,near,dt){
  const b=o.b,g=b.g;if(!b.rigs)return;g.updateMatrix();const e=g.matrix.elements,s=len3(e[0],e[1],e[2]);
  SIM.self=o;SIM.ch=chunkAt(g.position.x,g.position.z);const S=SIM.shapes;S.length=0;
  if(o.shapesW)for(const w of o.shapesW)S.push(w);
  if(near)for(const q of near){if(q===o||!q.shapesW)continue;if(q.pos.distanceTo(o.pos)>o.reach+q.bound+1)continue;for(const w of q.shapesW)S.push(w);}
  const G=o.grab;if(G&&G.pos){SIM.grab=stepRigs.G;stepRigs.G.x=G.pos.x;stepRigs.G.y=G.pos.y;stepRigs.G.z=G.pos.z;stepRigs.G.own=G;if(G.shapesW&&(!near||near.indexOf(G)<0))for(const w of G.shapesW)S.push(w);}else SIM.grab=null;
  let touch=0;
  for(const rig of b.rigs){for(const c of rig.chains){simChain(c,e,s,dt);touch+=c.touch;}rigSkin(rig,e);}
  o.holding=touch;
}
stepRigs.G={x:0,y:0,z:0,own:null};

// ---------- disturbance ----------
// What the flora bends away from and what the marine snow flows around: the player as a short capsule along its path with
// a trail of samples behind it (each sample springs back with an impulse response, so a stalk you pass bends, recoils past
// straight and settles), and the nearest moving creatures as capsules along their velocity. DIST_A: xyz, radius. DIST_B:
// tail xyz, amplitude (negative on the rebound). DIST_U: the body's velocity and its flow radius (0: no flow — the trail).
// FLOW: the same bodies as spheres with a velocity, for the snow.
const DIST_N=12,DIST_A=new Float32Array(DIST_N*4),DIST_B=new Float32Array(DIST_N*4),DIST_U=new Float32Array(DIST_N*4),distU={value:DIST_A},distBU={value:DIST_B},distUU={value:DIST_U};
const trail=[];let trailLast=null;
const FLOW=[];for(let i=0;i<6;i++)FLOW.push({x:0,y:0,z:0,a:0,a4:0,ux:0,uy:0,uz:0});let flowN=0; // a4: the reach, 4 radii
function impulse(tau){return Math.exp(-2.2*tau)*Math.cos(4.5*tau);}
function updateDisturbers(dt){
  const P=player,C=P.clade;let n=0;
  const put=(x,y,z,R,tx,ty,tz,amp,ux,uy,uz,a)=>{if(n>=DIST_N)return;const i=n*4;DIST_A[i]=x;DIST_A[i+1]=y;DIST_A[i+2]=z;DIST_A[i+3]=R;DIST_B[i]=tx;DIST_B[i+1]=ty;DIST_B[i+2]=tz;DIST_B[i+3]=amp;DIST_U[i]=ux||0;DIST_U[i+1]=uy||0;DIST_U[i+2]=uz||0;DIST_U[i+3]=a||0;n++;};
  flowN=0;
  if(mode==='play'&&!P.dead&&C){
    const R=1.5+C.size*0.4,vx=P.vel.x,vy=P.vel.y,vz=P.vel.z,fa=0.9+C.size*0.35,hl=C.size*0.8;
    T3.set(0,0,1).applyQuaternion(P.g.quaternion); // the body itself, nose to tail (v9.1's capsule trailed the velocity, so plants dodged the tail)
    put(P.pos.x+T3.x*hl,P.pos.y+T3.y*hl,P.pos.z+T3.z*hl,R,P.pos.x-T3.x*hl,P.pos.y-T3.y*hl,P.pos.z-T3.z*hl,1.15,vx,vy,vz,fa);
    if(!trailLast||len3(P.pos.x-trailLast.x,P.pos.y-trailLast.y,P.pos.z-trailLast.z)>1.3){trailLast={x:P.pos.x,y:P.pos.y,z:P.pos.z,t0:t};trail.push(trailLast);if(trail.length>6)trail.shift();}
    for(let i=trail.length-1;i>=0;i--){const s=trail[i],tau=t-s.t0;if(tau>1.7){trail.splice(i,1);continue;}if(s===trailLast&&tau<0.05)continue;put(s.x,s.y,s.z,R,s.x,s.y,s.z,impulse(tau));}
    const f=FLOW[flowN++];f.x=P.pos.x;f.y=P.pos.y;f.z=P.pos.z;f.a=fa;f.a4=f.a*4;f.ux=vx;f.uy=vy;f.uz=vz;
  }
  // the nearest creatures to the camera (a small insertion sort into NEAR6)
  const N6=updateDisturbers.N6||(updateDisturbers.N6=[]);N6.length=0;
  for(const c of creatures){if(!c.alive||!c.g.visible)continue;const d=c.pos.distanceTo(camera.position);if(d>70)continue;
    let i=N6.length;if(i>=6){if(d>=N6[5].d6)continue;i=5;}c.d6=d;N6[i]=c;while(i>0&&N6[i-1].d6>d){N6[i]=N6[i-1];N6[i-1]=c;i--;}}
  for(const c of N6){const R=c.def.size*0.55+0.9,sp=c.vel.length(),fa=c.def.size*0.45+0.3,hl=c.def.size*0.8;
    T3.set(0,0,1).applyQuaternion(c.g.quaternion);
    put(c.pos.x+T3.x*hl,c.pos.y+T3.y*hl,c.pos.z+T3.z*hl,R,c.pos.x-T3.x*hl,c.pos.y-T3.y*hl,c.pos.z-T3.z*hl,1.1,c.vel.x,c.vel.y,c.vel.z,sp>0.3?fa:0);
    if(flowN<FLOW.length&&sp>0.3&&c.d6<40){const f=FLOW[flowN++];f.x=c.pos.x;f.y=c.pos.y;f.z=c.pos.z;f.a=fa;f.a4=f.a*4;f.ux=c.vel.x;f.uy=c.vel.y;f.uz=c.vel.z;}}
  for(let i=n;i<DIST_N;i++)DIST_A[i*4+3]=0;
}
// The water a body displaces (the reference form; updatePlankton in atmosphere.js inlines it), as potential flow around a sphere of radius a moving at U: pushed aside ahead, drawn in
// behind, dying off as 1/r³; plus a thin layer that is dragged along with the body, which is what leaves a wake in the snow.
function flowAt(x,y,z,out){
  let vx=0,vy=0,vz=0;
  for(let i=0;i<flowN;i++){const f=FLOW[i],rx=x-f.x,ry=y-f.y,rz=z-f.z,r2=rx*rx+ry*ry+rz*rz,a=f.a;if(r2>a*a*16)continue;
    let r=Math.sqrt(r2);if(r<a*0.9){const k=(a*0.9-r)*8;r=Math.max(r,1e-3);vx+=rx/r*k;vy+=ry/r*k;vz+=rz/r*k;r=a*0.9;}
    const inv=a*a*a/(2*r*r*r),ur=(f.ux*rx+f.uy*ry+f.uz*rz)/(r*r),dr=Math.exp(-(r-a)/(0.35*a))*0.6;
    vx+=inv*(3*ur*rx-f.ux)+f.ux*dr;vy+=inv*(3*ur*ry-f.uy)+f.uy*dr;vz+=inv*(3*ur*rz-f.uz)+f.uz*dr;}
  out.x=vx;out.y=vy;out.z=vz;
}
