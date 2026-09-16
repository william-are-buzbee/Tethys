// test/map.js — the world as a map (v11.59): sample() over the whole square (or a window of it) drawn to test/preview/map.png —
// depth bands with a hillshade, contours at the sea, the shelf's edge, the light's end, the chemocline, the basin floor; the island's old
// square (v11.57's world), the clamp, the region grid, the landmarks, the current and the wind, a scale bar; and any planned islands as
// footprints. For getting a grip of the sizes before the archipelago (the person, 15 Sep 2026). Not in --test.
// Env: W (pixels a side, 1200), SPAN (metres a side, the world), CX/CZ (the window's centre, 0), PLAN ("x,z,landR,footR;…" planned
// islands: the land's radius and the foot's, drawn as two rings), OUT (file name, map.png).
const fs=require('fs'),path=require('path'),root=path.join(__dirname,'..'),{png,text,textW}=require('./png.js');
const util=fs.readFileSync(path.join(root,'src/util.js'),'utf8');let world=fs.readFileSync(path.join(root,'src/world.js'),'utf8');
const cut=world.indexOf('// ---------- the light');if(cut>0)world=world.slice(0,cut); // the geology, the fields and the landmarks; nothing that needs the scene
const THREE={Vector3:class{constructor(x,y,z){this.x=x;this.y=y;this.z=z;}},Matrix4:class{},Quaternion:class{}};
const Wd=new Function('THREE',util+'\n'+world+'\nreturn {sample,HALF,CELL,NCELL,LM,CUR_A,WIND_A,CHEMO,FI,ISLE,BASIN:typeof BASIN==="object"?BASIN:null,SILL:typeof SILL==="object"?SILL:null};')(THREE);
const W=+(process.env.W||1200),SPAN=+(process.env.SPAN||2*Wd.HALF),CX=+(process.env.CX||0),CZ=+(process.env.CZ||0),OUT=process.env.OUT||'map.png';
const M=SPAN/W; // metres a pixel
const x0=CX-SPAN/2,z0=CZ-SPAN/2,px=(x)=>(x-x0)/M,pz=(z)=>(z-z0)/M;
// heights on a (W+2)² grid with a one-pixel ring for the shade
const N=W+2,H=new Float32Array(N*N),f=new Float32Array(9);let above=0,dark=0,floor=0,minH=1e9,maxH=-1e9;
for(let j=0;j<N;j++)for(let i=0;i<N;i++){const h=Wd.sample(x0+(i-0.5)*M,z0+(j-0.5)*M,f).h;H[j*N+i]=h;if(i>0&&j>0&&i<N-1&&j<N-1){if(h>0)above++;if(h<Wd.CHEMO)dark++;if(h<-1000)floor++;if(h<minH)minH=h;if(h>maxH)maxH=h;}}
// the bands: land, the shallows to -60, the lit slope to -150, the twilight to -450, the dark to -800, the deep, the floor
const BANDS=[[0,[0.55,0.52,0.40]],[-6,[0.62,0.78,0.72]],[-60,[0.30,0.62,0.66]],[-150,[0.18,0.42,0.56]],[-450,[0.12,0.26,0.44]],[-800,[0.10,0.17,0.30]],[-1100,[0.08,0.11,0.20]],[-3000,[0.04,0.05,0.10]]];
function bandCol(h){if(h>=0)return h>4?[0.42,0.40,0.32]:BANDS[0][1];for(let k=1;k<BANDS.length;k++){if(h>=BANDS[k][0]){const a=BANDS[k-1][1],b=BANDS[k][1],t=(BANDS[k-1][0]-h)/(BANDS[k-1][0]-BANDS[k][0]);return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}}return BANDS[BANDS.length-1][1];}
const img=Buffer.alloc(W*W*3);
const CONT=[0,-60,-150,Wd.CHEMO,-800,-1000]; // -1000, not the floor's -1100: the hills cross that everywhere
for(let y=0;y<W;y++)for(let x=0;x<W;x++){const k=(y+1)*N+(x+1),h=H[k];
  const dzdx=(H[k+1]-H[k-1])/(2*M),dzdz=(H[k+N]-H[k-N])/(2*M); // the shade: light from the north-west, low
  const L=[-0.55,0.35,-0.55],len=Math.sqrt(dzdx*dzdx+1+dzdz*dzdz),nd=(-dzdx*L[0]+L[1]-dzdz*L[2])/len/0.75;const sh=0.55+0.55*Math.max(0,Math.min(1.4,nd));
  let c=bandCol(h).map(v=>v*sh);
  // contours: a band crossed between this pixel and its right or lower neighbour
  const hr=H[k+1],hd=H[k+N];for(const cv of CONT){if((h-cv)*(hr-cv)<0||(h-cv)*(hd-cv)<0){const w=cv===Wd.CHEMO?0.35:cv===0?0.6:0.5;c=c.map(v=>v*(1-w)+(cv===Wd.CHEMO?0.6:0.95)*w);if(cv===Wd.CHEMO)c[0]+=0.15;}}
  const o=(y*W+x)*3;img[o]=Math.min(255,c[0]*255);img[o+1]=Math.min(255,c[1]*255);img[o+2]=Math.min(255,c[2]*255);}
// drawing helpers
function dot(x,y,col){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=W||y>=W)return;const o=(y*W+x)*3;img[o]=col[0];img[o+1]=col[1];img[o+2]=col[2];}
function line(xa,ya,xb,yb,col,dash){const n=Math.ceil(Math.hypot(xb-xa,yb-ya));for(let k=0;k<=n;k++){if(dash&&Math.floor(k/dash)%2)continue;dot(xa+(xb-xa)*k/n,ya+(yb-ya)*k/n,col);}}
function rect(xa,za,xb,zb,col,dash){line(px(xa),pz(za),px(xb),pz(za),col,dash);line(px(xb),pz(za),px(xb),pz(zb),col,dash);line(px(xb),pz(zb),px(xa),pz(zb),col,dash);line(px(xa),pz(zb),px(xa),pz(za),col,dash);}
function ring(x,z,r,col,dash){const n=Math.max(64,Math.ceil(2*Math.PI*r/M/3));for(let k=0;k<n;k++){if(dash&&Math.floor(k/dash)%2)continue;const a=k/n*2*Math.PI;dot(px(x+Math.cos(a)*r),pz(z+Math.sin(a)*r),col);}}
function label(x,y,s,col,sc){sc=sc||1;text(img,W,W,x+1,y+1,s,[0,0,0],sc);text(img,W,W,x,y,s,col,sc);}
const WHITE=[240,240,230],GREY=[150,150,150],YEL=[250,220,90],RED=[240,110,90];
// the region grid, faint (4 cells), and the cell count on it
const CELL=Wd.CELL,FR=4;for(let k=0;k<=Wd.NCELL;k+=FR){const v=-Wd.HALF+k*CELL;line(px(v),pz(-Wd.HALF),px(v),pz(Wd.HALF),[70,80,90],2);line(px(-Wd.HALF),pz(v),px(Wd.HALF),pz(v),[70,80,90],2);}
rect(-Wd.HALF+25,-Wd.HALF+25,Wd.HALF-25,Wd.HALF-25,GREY,6); // the clamp
rect(-1720,-1720,1720,1720,YEL,4);label(px(-1720)+4,pz(-1720)-10,'the island\'s square (v11.57\'s world, 3.4 km)',YEL); // the old world
// landmarks
for(const k in Wd.LM){if(k==='all')continue;const p=Wd.LM[k];ring(p.x,p.z,Math.max(60,3*M),WHITE);label(px(p.x)+6,pz(p.z)-4,k+' '+Math.round(p.h),WHITE);}
ring(Wd.ISLE.x,Wd.ISLE.z,120,WHITE);label(px(Wd.ISLE.x)+6,pz(Wd.ISLE.z)+6,'the isle',WHITE);
// the sill's crest line and gap, if the basin is built
if(Wd.SILL){const S=Wd.SILL,c=Math.cos(S.a),s=Math.sin(S.a);for(let t=-20000;t<=20000;t+=M){const x=c*S.d-s*t,z=s*S.d+c*t;if(Math.abs(x)<=SPAN/2+CX&&Math.abs(z)<=SPAN/2+CZ)dot(px(x),pz(z),RED);}
  const gx=c*S.d,gz=s*S.d;ring(gx,gz,700,RED,3);label(px(gx)-textW('the gap',1)/2,pz(gz)+12,'the gap',RED);label(px(c*(S.d+900)-s*4000),pz(s*(S.d+900)+c*4000),'the sill\'s crest '+S.crest,RED);}
// the current and the wind: arrows from the corner
function arrow(x,y,a,len,col,name){const dx=Math.cos(a)*len,dy=Math.sin(a)*len;line(x,y,x+dx,y+dy,col);for(const s of [-1,1]){line(x+dx,y+dy,x+dx-Math.cos(a+s*0.5)*10,y+dy-Math.sin(a+s*0.5)*10,col);}label(x+dx+6,y+dy-4,name,col);}
arrow(W-160,W-150,Wd.CUR_A,60,WHITE,'current');arrow(W-60,W-150,Wd.WIND_A,60,[200,220,255],'wind');
// planned islands
if(process.env.PLAN)for(const p of process.env.PLAN.split(';')){const [x,z,rl,rf]=p.split(',').map(Number);ring(x,z,rl,YEL);ring(x,z,rf,YEL,5);label(px(x)-textW('planned',1)/2,pz(z)-4,'planned',YEL);}
// the scale bar, the key, the numbers
const sb=SPAN>=20000?5000:SPAN>=5000?1000:500,sbp=sb/M;line(20,W-30,20+sbp,W-30,WHITE);line(20,W-36,20,W-24,WHITE);line(20+sbp,W-36,20+sbp,W-24,WHITE);label(24,W-50,(sb/1000)+' km',WHITE);
let ky=20;for(const [lo,name] of [[0,'land'],[-6,'the shallows'],[-60,'the lit slope'],[-150,'the twilight'],[-450,'the dark (chemocline)'],[-800,'the deep'],[-1100,'the floor']]){const c=bandCol(lo-0.5).map(v=>Math.min(255,v*255));for(let y=0;y<10;y++)for(let x=0;x<18;x++)dot(20+x,ky+y,c);label(44,ky+2,name+(lo<0?' '+lo:''),WHITE);ky+=14;}
label(20,ky+6,'N up  '+(SPAN/1000).toFixed(1)+' km a side  '+Wd.NCELL+' cells of '+CELL+' m',WHITE);
const out=path.join(__dirname,'preview');if(!fs.existsSync(out))fs.mkdirSync(out);fs.writeFileSync(path.join(out,OUT),png(img,W,W));
const A=M*M/1e6;console.log('wrote test/preview/'+OUT+': '+W+' px, '+(SPAN/1000).toFixed(1)+' km a side, '+M.toFixed(1)+' m a pixel');
console.log('land '+(above*A).toFixed(2)+' km²  below the chemocline '+(dark*A).toFixed(0)+' km²  the floor (< -1000) '+(floor*A).toFixed(0)+' km²  of '+(W*W*A).toFixed(0)+' km²;  height '+minH.toFixed(0)+' … +'+maxH.toFixed(0));
