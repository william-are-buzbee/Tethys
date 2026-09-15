// Headless physics check (physics.js): the collider hash against brute force, pads a body can land on and not rise
// through, chains that keep their lengths, stay out of the ground and bodies and close on a grab, body-to-body contact,
// the flow field, and a cost per frame for the arms and the queries. Same bundle and stub as the smoke test.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const ORDER=fs.readFileSync(path.join(ROOT,'src','order.txt'),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&s[0]!=='#');
let js=ORDER.map(n=>fs.readFileSync(path.join(ROOT,'src',n+'.js'),'utf8')).join('\n');
js+='\nglobal.__phys={peak(){player.pos.set(0,dispY,0);cellsAround();},get lastPad(){return lastPad;},solidPush,addSolid,addCapsule,addPad,addEllipsoid,addRock,bodyPush,loadPad,updatePads,livePads,chunks,chunkGrid,cellOf,creatures,player,DEFS,spawn,stepRigs,worldShapes,resolveBodies,sphereOutOf,flowAt,FLOW,setFlow:(n)=>{flowN=n;},updateDisturbers,DIST_A,DIST_B,groundAt,waveH,choose,V3,CLADES,t:()=>t,setT:(v)=>{t=v;},keys,get mode(){return mode;},FLORA};';
const tmp=path.join(require('os').tmpdir(),'tethys_phys.js');
fs.writeFileSync(tmp,'(function(){"use strict";\n'+js+'\n})();');
process.env.PICK='0';
require('./stub.js');require(tmp);
const X=global.__phys;let fails=0;X.peak(); // v11.48: the title screen opens over the sea since v11.47.2; the peak's cells by hand, as the boot once loaded them
function check(ok,msg){if(!ok){fails++;console.error('  FAIL '+msg);}else console.log('  ok   '+msg);}
const dt=1/60;

// ---- 1. the hash: every point pushed out of every solid; far points untouched; capsules honoured ----
{
  const ch=X.chunkGrid[X.cellOf(0)*16+X.cellOf(0)];
  const rng=(()=>{let s=7;return()=>{s=(s*16807)%2147483647;return s/2147483647;};})();
  const added=[];
  for(let i=0;i<150;i++){const x=ch.x0+rng()*215,z=ch.z0+rng()*215,y=-20+rng()*30,r=0.5+rng()*6;X.addSolid(ch,x,y,z,r);added.push({t:0,x,y,z,r});}
  for(let i=0;i<60;i++){const x=ch.x0+rng()*215,z=ch.z0+rng()*215,y=-20+rng()*30,r=0.3+rng()*2,x2=x+(rng()-0.5)*20,y2=y+rng()*15,z2=z+(rng()-0.5)*20;X.addCapsule(ch,x,y,z,x2,y2,z2,r);added.push({t:1,x,y,z,x2,y2,z2,r});}
  const all=[];for(let di=-1;di<=1;di++)for(let dj=-1;dj<=1;dj++){const c2=X.chunkGrid[(ch.i+di)*16+ch.j+dj];if(c2)for(const s of c2.solids)if(s.t!==2)all.push(s);}
  const dist=(p,s)=>{if(s.t===0)return Math.hypot(p.x-s.x,p.y-s.y,p.z-s.z)-s.r;
    if(s.t===4){let mx=-1e9;for(let q=0;q<48;q+=4){const d=s.pl[q]*p.x+s.pl[q+1]*p.y+s.pl[q+2]*p.z-s.pl[q+3];if(d>mx)mx=d;}return mx;}
    if(s.t===3){const dx=p.x-s.x,dy=p.y-s.y,dz=p.z-s.z,mi=s.mi,m=s.m,qx=mi[0]*dx+mi[3]*dy+mi[6]*dz,qy=mi[1]*dx+mi[4]*dy+mi[7]*dz,qz=mi[2]*dx+mi[5]*dy+mi[8]*dz,ql=Math.hypot(qx,qy,qz)||1e-9,ux=qx/ql,uy=qy/ql,uz=qz/ql;return (ql-1)*Math.hypot(m[0]*ux+m[3]*uy+m[6]*uz,m[1]*ux+m[4]*uy+m[7]*uz,m[2]*ux+m[5]*uy+m[8]*uz);}const ex=s.x2-s.x,ey=s.y2-s.y,ez=s.z2-s.z,l2=ex*ex+ey*ey+ez*ez,tt=Math.max(0,Math.min(1,((p.x-s.x)*ex+(p.y-s.y)*ey+(p.z-s.z)*ez)/l2));return Math.hypot(p.x-s.x-ex*tt,p.y-s.y-ey*tt,p.z-s.z-ez*tt)-s.r;};
  let inside=0,moved=0,wrong=0,farMoved=0;
  for(let i=0;i<800;i++){const p={x:ch.x0+rng()*215,y:-22+rng()*34,z:ch.z0+rng()*215},q={x:p.x,y:p.y,z:p.z};
    const pad=0.9;let dmin=1e9;for(const s of all)dmin=Math.min(dmin,dist(p,s));
    const any=X.solidPush(p,pad,null,null);
    if(dmin<pad)inside++;
    if(any)moved++;
    if(dmin>pad+0.01&&(p.x!==q.x||p.y!==q.y||p.z!==q.z)){farMoved++;let bt=-1,bd=1e9;for(const s of all){const d=dist(p,s);if(d<bd){bd=d;bt=s.t;}}console.log('    farMoved at',q.x.toFixed(1),q.y.toFixed(1),q.z.toFixed(1),'nearest type',bt,'dist',bd.toFixed(2),'moved',Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z).toFixed(2));}
    let dafter=1e9;for(const s of all)dafter=Math.min(dafter,dist(p,s));
    if(dmin<pad&&dafter<pad-0.05)wrong++;}
  check(inside>20,'hash test has points inside solids ('+inside+' of 800)');
  check(farMoved===0,'points clear of every solid are not moved ('+farMoved+' moved)');
  check(wrong<inside*0.06,'points inside are pushed out ('+wrong+' of '+inside+' still in a solid after three passes)');
  const t0=process.hrtime.bigint();for(let i=0;i<20000;i++){const p={x:ch.x0+rng()*215,y:-22+rng()*34,z:ch.z0+rng()*215};X.solidPush(p,0.9,null,null);}
  console.log('  solidPush: '+(Number(process.hrtime.bigint()-t0)/20000/1000).toFixed(2)+' us per query in a cell with '+ch.solids.length+' solids');
}

// ---- 1b. a stretched rock: an ellipsoid three long and one wide, tilted; points along the long axis are pushed out ----
{
  const ch=X.chunkGrid[X.cellOf(0)*16+X.cellOf(0)];
  const c=Math.cos(0.6),sn=Math.sin(0.6);const cx=ch.x0+150,cz=ch.z0+30,cy=-5;
  // columns: x axis 3 long rotated 0.6 about y, y axis 1, z axis 1
  const W=[3*c,0,-3*sn,0, 0,1,0,0, sn,0,c,0, cx,cy,cz,1];
  X.addEllipsoid(ch,W);
  let bad=0,n=0;
  for(let i=0;i<300;i++){const a=Math.random()*6.28,u=Math.random(),v=Math.random()*2-1;const lx=2.6*u*Math.cos(a),ly=0.8*v,lz=0.8*u*Math.sin(a);
    const p={x:cx+lx*c+lz*sn,y:cy+ly,z:cz-lx*sn+lz*c};X.solidPush(p,0.9,null,null);
    const dx=p.x-cx,dy=p.y-cy,dz=p.z-cz,qx=(dx*c-dz*sn)/3,qy=dy,qz=dx*sn+dz*c;if(Math.hypot(qx,qy,qz)<1-1e-3)bad++;n++;}
  check(bad===0,'points inside a 3:1 tilted rock all end up outside it ('+bad+' of '+n+' still inside)');
  const p={x:cx+2.0*c,y:cy,z:cz-2.0*sn};X.solidPush(p,0.9,null,null);const along=Math.hypot(p.x-cx,p.z-cz);
  check(along>3.8&&along<4.2,'a point two along the long axis is put 3 + 0.9 out along it ('+along.toFixed(2)+'), where a sphere of the short axis would have left it inside');
}

// ---- 1c. a rock: a dodecahedron stretched 2.5 x 1.2 x 0.8 and tilted; every point inside, corners included, is put out ----
{
  const ch=X.chunkGrid[X.cellOf(0)*16+X.cellOf(0)];
  const t=(1+Math.sqrt(5))/2,r=1/t,V=[-1,-1,-1,-1,-1,1,-1,1,-1,-1,1,1,1,-1,-1,1,-1,1,1,1,-1,1,1,1,0,-r,-t,0,-r,t,0,r,-t,0,r,t,-r,-t,0,-r,t,0,r,-t,0,r,t,0,-t,0,-r,t,0,-r,-t,0,r,t,0,r];
  const verts=[];for(let i=0;i<V.length;i+=3){const l=Math.hypot(V[i],V[i+1],V[i+2]);verts.push([V[i]/l,V[i+1]/l,V[i+2]/l]);}
  const cy=Math.cos(0.7),sy=Math.sin(0.7),cx=Math.cos(0.3),sx=Math.sin(0.3),R=[[cy,0,sy],[sx*sy,cx,-sx*cy],[-cx*sy,sx,cx*cy]],S=[2.5,1.2,0.8];
  const W=new Array(16).fill(0);for(let j=0;j<3;j++)for(let i=0;i<3;i++)W[j*4+i]=R[i][j]*S[j];W[15]=1;W[12]=ch.x0+180;W[13]=-8;W[14]=ch.z0+180;
  X.addRock(ch,W);const s=ch.solids[ch.solids.length-1];
  let over=0;for(let k=0;k<12;k++){let mx=-9;for(const v of verts){const wx=W[0]*v[0]+W[4]*v[1]+W[8]*v[2]+W[12],wy=W[1]*v[0]+W[5]*v[1]+W[9]*v[2]+W[13],wz=W[2]*v[0]+W[6]*v[1]+W[10]*v[2]+W[14];const d=s.pl[k*4]*wx+s.pl[k*4+1]*wy+s.pl[k*4+2]*wz-s.pl[k*4+3];if(d>mx)mx=d;}if(Math.abs(mx)>1e-4)over++;}
  check(over===0,'the twelve world planes each pass through the rock\'s own vertices ('+over+' off)');
  let bad=0;for(let i=0;i<1000;i++){let a=0,b=0,c=0,w=0;for(let j=0;j<4;j++){const q=verts[Math.floor(Math.random()*20)],u=Math.random();a+=q[0]*u;b+=q[1]*u;c+=q[2]*u;w+=u;}a/=w;b/=w;c/=w;
    const p={x:W[0]*a+W[4]*b+W[8]*c+W[12],y:W[1]*a+W[5]*b+W[9]*c+W[13],z:W[2]*a+W[6]*b+W[10]*c+W[14]};X.solidPush(p,0.9,null,null);
    let mx=-9;for(let k=0;k<12;k++){const d=s.pl[k*4]*p.x+s.pl[k*4+1]*p.y+s.pl[k*4+2]*p.z-s.pl[k*4+3];if(d>mx)mx=d;}if(mx<0.9-1e-3)bad++;}
  check(bad===0,'1000 points inside the rock (corners included) all end 0.9 clear of it ('+bad+' not)');
  const v=verts[7],p={x:W[0]*v[0]*0.97+W[4]*v[1]*0.97+W[8]*v[2]*0.97+W[12],y:W[1]*v[0]*0.97+W[5]*v[1]*0.97+W[9]*v[2]*0.97+W[13],z:W[2]*v[0]*0.97+W[6]*v[1]*0.97+W[10]*v[2]*0.97+W[14]};const q={x:p.x,y:p.y,z:p.z};X.solidPush(p,0.9,null,null);
  check(Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z)>0.85,'a point just inside a corner is pushed out too (moved '+Math.hypot(p.x-q.x,p.y-q.y,p.z-q.z).toFixed(2)+'), where the ellipsoid missed the corners');
}

// ---- 1d. the body is a capsule: a snout that would enter a rock ahead carries the body back ----
{
  const ch=X.chunkGrid[X.cellOf(0)*16+X.cellOf(0)];let rx=0,rz=0;
  for(let tries=0;tries<400&&!rx;tries++){const x=ch.x0+20+Math.random()*175,z=ch.z0+20+Math.random()*175,p={x:x,y:-8,z:z};let clear=true;for(let dz=-6;dz<=6;dz+=1){p.z=z+dz;p.x=x;p.y=-8;if(X.solidPush(p,3,null,null)){clear=false;break;}}if(clear){rx=x;rz=z;}}
  X.addSolid(ch,rx,-8,rz,2);
  const p={x:rx,y:-8,z:rz-2-0.9-0.6},v={x:0,y:0,z:3},q={}; // centre 0.6 clear of a 0.9 ball, but the nose 1.26 ahead with r 0.5 is inside (the stub's quaternion faces +z)
  const z0=p.z;X.bodyPush(p,v,q,1.26,0.9,0.5);
  check(p.z<z0-0.2&&p.z>z0-0.35&&v.z<0.01,'a snout in a rock pushes the body back ('+(z0-p.z).toFixed(2)+', expected 0.26) and stops it (v '+v.z.toFixed(2)+')');
}

// ---- 2. pads: land on one from above, stay under it from below, the dip ----
{
  const ch=X.chunkGrid[X.cellOf(0)*16+X.cellOf(0)];
  let px=0,pz=0;for(let tries=0;tries<400;tries++){const x=ch.x0+20+Math.random()*175,z=ch.z0+20+Math.random()*175,p={x:x,y:0.2,z:z};let clear=true;for(let y=-3;y<8;y+=0.5){p.y=y;if(X.solidPush(p,2.5,null,null)){clear=false;break;}}if(clear){px=x;pz=z;break;}}
  check(px!==0,'found a spot with nothing in the water column at ('+px.toFixed(0)+','+pz.toFixed(0)+')');
  const inst={im:{geometry:{attributes:{aDip:{array:new Float32Array(1),needsUpdate:false}}}},idx:0,dip:0,dv:0,load:0,live:false};
  X.addPad(ch,px,-0.45,pz,3,0.3,px,pz,inst);
  const wl=X.waveH(px,pz);
  const p={x:px,y:6,z:pz},v={x:0,y:0,z:0};let landed=false,ys=[];
  for(let i=0;i<240;i++){v.y-=14*dt;p.y+=v.y*dt;X.solidPush(p,0.9,v,null);if(X.lastPad){landed=true;X.loadPad(X.lastPad,0.3);}X.updatePads(dt);ys.push(p.y);}
  const top=-0.45+0.3+X.waveH(px,pz)-inst.dip;
  check(landed,'a body falling onto a pad lands on it');
  check(Math.abs(p.y-(top+0.9))<0.02,'and rests at the pad top plus its radius ('+p.y.toFixed(2)+' vs '+(top+0.9).toFixed(2)+')');
  check(inst.dip>0.2&&inst.dip<0.4,'the pad dips under it ('+inst.dip.toFixed(2)+')');
  const q={x:px,y:-3,z:pz},w={x:0,y:3,z:0};let above=false;
  for(let i=0;i<120;i++){q.y+=w.y*dt;X.solidPush(q,0.9,w,null);if(q.y>-0.45+wl)above=true;}
  check(!above&&q.y<-0.45-0.3+wl-0.9+0.01,'a body rising under a pad is kept under it (y '+q.y.toFixed(2)+')');
  for(let i=0;i<400;i++)X.updatePads(dt);
  check(X.livePads.length===0&&inst.dip===0,'an unloaded pad settles and leaves the live list');
}

// ---- 3. chains: lengths, ground, bodies, grab ----
{
  const P=X.player,ch=X.chunkGrid[X.cellOf(0)*16+X.cellOf(0)];
  const o=X.spawn(ch,'ortho',X.V3(30,-4,30),Math.random),n=X.spawn(ch,'grazer',X.V3(30,-4,42),Math.random);
  const lens=(c)=>{const out=[];for(let k=0;k<c.n;k++)out.push(Math.hypot(c.pts[k*3+3]-c.pts[k*3],c.pts[k*3+4]-c.pts[k*3+1],c.pts[k*3+5]-c.pts[k*3+2])/c.L[k]);return out;};
  const rig=o.b.rigs[0];
  const step=()=>{o.g.position.copy(o.pos);o.g.updateMatrix();X.worldShapes(o);n.g.position.copy(n.pos);n.g.updateMatrix();X.worldShapes(n);X.stepRigs(o,[n],dt);};
  for(let i=0;i<120;i++){o.anim(i*dt,0.5);step();}
  let bad=0,nan=0;for(const c of rig.chains){for(const l of lens(c))if(Math.abs(l-1)>0.02)bad++;for(const v of c.pts)if(!isFinite(v))nan++;}
  check(nan===0,'no NaN in the chains after 120 frames');
  check(bad===0,'every segment within 2% of its length at rest ('+bad+' off)');
  // swim forward fast, turn: still fine
  for(let i=0;i<120;i++){o.pos.z+=9*dt;o.anim(i*dt,3);step();}
  bad=0;for(const c of rig.chains)for(const l of lens(c))if(Math.abs(l-1)>0.03)bad++;
  check(bad===0,'lengths hold while swimming at 9 u/s ('+bad+' off)');
  // ground: drop it onto the floor, no point under the ground
  const gh=X.groundAt(o.pos.x,o.pos.z);o.pos.y=gh+o.def.size*0.35;
  for(let i=0;i<120;i++){o.anim(i*dt,0.2);step();}
  let under=0;for(const c of rig.chains)for(let k=1;k<=c.n;k++){const y=c.pts[k*3+1],g=X.groundAt(c.pts[k*3],c.pts[k*3+2]);if(y<g+c.r[k-1]-0.05)under++;}
  check(under===0,'no arm point below the floor when the body lies on it ('+under+')');
  // grab: the grazer in front; the arms reach it and close on it without entering its body
  o.pos.set(30,-4,30);n.pos.set(30,-4,30+o.def.size*0.42+n.def.size*0.5+1.5);o.grab=n;
  let touched=0,deep=0;
  for(let i=0;i<180;i++){o.anim(i*dt,0.5);step();if(o.holding)touched++;}
  for(const c of rig.chains)for(let k=1;k<=c.n;k++){const x=c.pts[k*3],y=c.pts[k*3+1],z=c.pts[k*3+2];for(const w of n.shapesW){const ex=w.bx-w.ax,ey=w.by-w.ay,ez=w.bz-w.az,l2=ex*ex+ey*ey+ez*ez,tt=Math.max(0,Math.min(1,((x-w.ax)*ex+(y-w.ay)*ey+(z-w.az)*ez)/l2));const d=Math.hypot(x-w.ax-ex*tt,y-w.ay-ey*tt,z-w.az-ez*tt);if(d<w.r+c.r[k-1]-0.08)deep++;}}
  check(touched>60,'grabbing: the arms touch the prey most frames ('+touched+' of 180)');
  check(deep===0,'and no arm point sits inside the prey\'s body ('+deep+')');
  let tipd=0;for(const c of rig.chains){const k=c.n;tipd+=Math.hypot(c.pts[k*3]-n.pos.x,c.pts[k*3+1]-n.pos.y,c.pts[k*3+2]-n.pos.z);}
  console.log('  grab: mean tip distance to the prey centre '+(tipd/rig.chains.length).toFixed(2)+' (its body radius '+(n.def.size*0.62/1.5*1.5).toFixed(2)+', reach '+o.def.reach+')');
  o.grab=null;
  // the player pushed out of the arms
  X.choose(0);P.pos.set(30,-4,30+5);P.vel.set(0,0,0);o.pos.set(30,-4,30);
  for(let i=0;i<30;i++){o.anim(i*dt,0.5);step();}
  P.pos.set(o.chainW[3].cx,o.chainW[3].cy,o.chainW[3].cz);X.sphereOutOf(P.pos,0.75,P.vel,o.chainW);
  let inArm=false;for(const w of o.chainW){const ex=w.bx-w.ax,ey=w.by-w.ay,ez=w.bz-w.az,l2=ex*ex+ey*ey+ez*ez,tt=Math.max(0,Math.min(1,((P.pos.x-w.ax)*ex+(P.pos.y-w.ay)*ey+(P.pos.z-w.az)*ez)/(l2||1)));if(Math.hypot(P.pos.x-w.ax-ex*tt,P.pos.y-w.ay-ey*tt,P.pos.z-w.az-ez*tt)<w.r+0.75-0.05)inArm=true;}
  check(!inArm,'the player placed on an arm is pushed out of every arm segment');
  // cost
  const many=[];for(let i=0;i<20;i++)many.push(X.spawn(ch,i%3===0?'ortho':i%3===1?'eel':'lurker',X.V3(-40+i*3,-6,-40),Math.random));
  const t0=process.hrtime.bigint();
  for(let f=0;f<100;f++)for(const c of many){c.anim(f*dt,1);c.g.updateMatrix();X.worldShapes(c);X.stepRigs(c,many,dt);}
  const us=Number(process.hrtime.bigint()-t0)/100/1000;
  console.log('  arms: '+(us/20).toFixed(0)+' us per creature per frame with 20 in each other\'s reach ('+us.toFixed(0)+' us for the 20)');
  check(us<4000,'20 rigged creatures under 4 ms a frame headless');
}

// ---- 4. body contact ----
{
  const ch=X.chunkGrid[X.cellOf(0)*16+X.cellOf(0)];
  const a=X.spawn(ch,'grazer',X.V3(60,-5,60),Math.random),b=X.spawn(ch,'grazer',X.V3(60.3,-5,60),Math.random);
  a.vel.set(1,0,0);b.vel.set(-1,0,0);
  for(const c of [a,b]){c.g.position.copy(c.pos);c.g.updateMatrix();X.worldShapes(c);}
  X.resolveBodies([a,b]);
  const d=a.pos.distanceTo(b.pos),R=a.shapesW[0].r+b.shapesW[0].r;
  check(d>=R-0.01,'two overlapping grazers are pushed apart to their body radii ('+d.toFixed(2)+' vs '+R.toFixed(2)+')');
  check(a.vel.x<=0.01&&b.vel.x>=-0.01,'and stop closing');
}

// ---- 5. flow ----
{
  const f=X.FLOW[0];f.x=0;f.y=0;f.z=0;f.a=1;f.a4=4;f.ux=5;f.uy=0;f.uz=0;X.setFlow(1);
  const o={x:0,y:0,z:0};X.flowAt(1.6,0,0,o);const ahead=o.x;X.flowAt(1.2,1.2,0,o);const side=o.y;X.flowAt(-1.6,0,0,o);const behind=o.x;X.flowAt(30,0,0,o);const far=Math.hypot(o.x,o.y,o.z);
  check(ahead>0.5,'water ahead of a body moving +x is pushed +x ('+ahead.toFixed(2)+')');
  check(side>0.3,'water off its shoulder is pushed outward ('+side.toFixed(2)+')');
  check(behind>0,'water behind it is drawn along ('+behind.toFixed(2)+')');
  check(far===0,'nothing 30 radii away');
  X.setFlow(0);
}

// ---- 6. disturbers ----
{
  const P=X.player;P.dead=false;P.pos.set(5,-5,5);P.vel.set(3,0,0);
  for(let i=0;i<90;i++){P.pos.x+=3*dt;X.setT(X.t()+dt);X.updateDisturbers(dt);}
  let live=0;for(let i=0;i<12;i++)if(X.DIST_A[i*4+3]>0)live++;
  check(live>=3,'the player and a trail of samples are in the disturbance list ('+live+')');
  let neg=0;for(let i=0;i<12;i++)if(X.DIST_A[i*4+3]>0&&X.DIST_B[i*4+3]<0)neg++;
  check(neg>=1,'older trail samples are on their rebound ('+neg+' negative)');
}
// ---- 7. the whole loop: the player dropped onto a lily pad lands, is ashore on it, and flops off it into the water ----
// (v11.16.1: no species has pads any more — the raft was the last, struck; the mechanism stays for whatever floats next and this
// section runs only when the world has a pad to drop onto)
if(X.FLORA.some(f=>f.pads)){
  const P=X.player;let pad=null;
  for(const ch of X.chunks.values()){for(const s of ch.solids)if(s.t===2&&s.r>1.2&&s.r<4){pad=s;break;}if(pad)break;}
  if(!pad){const ch=X.chunkGrid[X.cellOf(0)*16+X.cellOf(0)];X.addPad(ch,40,-0.45,-40,2.5,0.3,40,-40,{im:{geometry:{attributes:{}}},idx:0,dip:0,dv:0,load:0,live:false});pad=ch.solids[ch.solids.length-1];}
  P.dead=false;P.pos.set(pad.x,4,pad.z);P.vel.set(0,0,0);for(const k in X.keys)X.keys[k]=false;
  let onPad=0,ashore=0;
  for(let i=0;i<180;i++){global.__step(1);if(P.onPad)onPad++;if(P.onPad&&P.grounded&&P.sub<0.5)ashore++;}
  check(onPad>60,'in play, the player dropped over a pad lands and stays on it ('+onPad+' of 180 frames)');
  check(ashore>60,'and counts as ashore there (the readout would say strand; it flops when pushed) ('+ashore+')');
  X.keys.KeyW=true;let off=false;for(let i=0;i<400;i++){global.__step(1);if(!P.onPad&&P.sub>0.5){off=true;break;}}X.keys.KeyW=false;
  check(off,'flopping forward takes it off the pad into the water');
}
console.log(fails?'\nphysics: '+fails+' FAILED':'\nphysics: all ok');
process.exit(fails?1:0);
