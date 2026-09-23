// Headless plankton check (v11.81, PLANKTON.md §13 pass 1): the field at the sites the doc names — the fed flank, the shelf break's ring,
// the lagoon, the lee (the old canopy patches), the basin, the gap and the vent — printed as a table: the column's crops by kind (world.js
// plank), the front's criterion X, then the crops at three depths through bloomC by the clock (the surface, the thermocline, the deep
// maximum), and the water's tint from them (bloomTint on the table's shelf colour). Then the invariants: no NaN anywhere on a grid across
// the world; every texel encodes within 0..1; the basin poorer than island water poorer than the fed flank, on the doc's numbers (a gyre
// 0.03–0.08, island water 0.2–0.5, an upwelling flank 1–3); the ring exists on a side radial (the front's weight passes 0.5 between the shelf
// and the flank) and is broken on the current's axis; the ring moves shoreward from springs to neaps; the red kind is deeper than the green;
// the maps (far.js wmFill/wmBloom) agree with the field at a texel's centre; the GLSL string carries the tables' numbers; and the
// storm's pulse is bounded. It proves the numbers go where the doc says; it says nothing about how the water looks.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const ORDER=fs.readFileSync(path.join(ROOT,'src','order.txt'),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&s[0]!=='#');
let js=ORDER.map(n=>fs.readFileSync(path.join(ROOT,'src',n+'.js'),'utf8')).join('\n');
js+='\nglobal.__pk={sample,spawn,filterIntake,filterSeek,filterPlayer,swarmR,swarmShare,swarmVol,FILTER,ecoOf,DEFS,derive,SPECS,bioMass,creatures,V3,eaterK,ECO,plank,SPAWN,POP,ecoCap,CELL,NCELL,swarmDepth,swarmPig,MOONL,sunDec,seasonAt,yearPhase,skyDir,sunHA,weatherAt,SOLAR_H0,plankTexel,plankEnc,bloomC,bloomTint,plankAt,bloomAt,wmBloom,wmFill,wmBlur,bloomTick,FOG_B,PLK,PIGK,BLOOM_GLSL,WM_N,wcolAt,leeW,tidalAt,tideAmp,TIDE_A1,CUR_A,FI,HALF,setClock:(h)=>{clockH=h;TIDE=tideAt(h);},tide:()=>TIDE};';
const tmp=path.join(require('os').tmpdir(),'tethys_plankton_bundle.js');
fs.writeFileSync(tmp,'(function(){"use strict";\n'+js+'\n})();');
require('./stub.js');
require(tmp);
const P=global.__pk;
let failed=false;
function ok(c,msg){console.log((c?'  ok   ':'  FAIL ')+msg);if(!c)failed=true;}
const f3=v=>v.toFixed(3).padStart(7),f2=v=>v.toFixed(2).padStart(6);
const up=5.44,dn=P.CUR_A,side=0.75; // the fed flank's centre, the lee, and a side of the rim's cylinder (the stream 1 m/s there; the shelf 55 m at r 600, the break 140 at 900)
const sites=[
  {name:'the fed flank, the shelf break',a:up,r:900},
  {name:'the fed flank, the slope',a:up,r:1300},
  {name:'a side flank, the shelf',a:side,r:600},
  {name:'a side flank, the break',a:side,r:850},
  {name:'a side flank, the slope',a:side,r:1300},
  {name:'the lagoon',a:1.0,r:100},
  {name:'the lee, the first eddy',a:2.3,r:1420},
  {name:'the lee, past the eddies',a:dn,r:2000},
  {name:'the vent field',a:2.6,r:1310},
  {name:'the gap in the sill',a:up,r:13000},
  {name:'the basin',x:4000,z:4000},
];
for(const s of sites){if(s.x===undefined){s.x=Math.round(Math.cos(s.a)*s.r);s.z=Math.round(Math.sin(s.a)*s.r);}}
P.setClock(0); // boot: a spring tide (world.js: the clock starts at mid-flood on a spring)
P.bloomTick();
console.log('the column (mg/m³ of pigment: green, gold, red) and the front\'s X, then the crops by the clock at 3 m, at the thermocline (64) and at 95, and the shelf water tinted at 3 m');
console.log('  site'.padEnd(34)+'x'.padStart(6)+'z'.padStart(7)+'h'.padStart(7)+'nut'.padStart(6)+'  green   gold    red      X   |  3 m: g/f/r  64 m: g/f/r  95 m: g/f/r  | tint at 3 m (of 0.10,0.46,0.58)');
const rows={};
for(const s of sites){const sm=P.sample(s.x,s.z),c=P.plank(s.x,s.z,sm),tx=P.plankTexel(s.x,s.z,sm,[0,0,0]);c.push(P.bloomC(tx,-sm.h,95,[0,0,0])[2]); // c: green, gold, X, then the red at 95 m by the clock
  const at=d=>P.bloomC(tx,-sm.h,d,[0,0,0]);const c3=at(3),c64=at(64),c95=at(95);const col=P.bloomTint(P.wcolAt(0).slice(),c3);
  rows[s.name]={c,tx,c3,c64,c95,col,h:sm.h};
  console.log('  '+s.name.padEnd(32)+String(s.x).padStart(6)+String(s.z).padStart(7)+sm.h.toFixed(0).padStart(7)+f2(sm.f[P.FI.nut])+f3(c[0])+f3(c[1])+f3(c[3])+f2(c[2])+'   | '+c3.map(v=>v.toFixed(2)).join('/')+'  '+c64.map(v=>v.toFixed(2)).join('/')+'  '+c95.map(v=>v.toFixed(2)).join('/')+'  | '+col.map(v=>v.toFixed(3)).join(','));
}
// invariants on a grid across the whole world
{let nan=0,n=0,enc=0;const tx=[0,0,0],C=[0,0,0];
  for(let z=-P.HALF;z<=P.HALF;z+=800)for(let x=-P.HALF;x<=P.HALF;x+=800){const sm=P.sample(x,z);P.plankTexel(x,z,sm,tx);n++;for(let k=0;k<3;k++){if(tx[k]!==tx[k])nan++;if(tx[k]<-1e-9||tx[k]>1+1e-9)enc++;}for(const d of [3,64,95,200]){P.bloomC(tx,-sm.h,d,C);for(let k=0;k<3;k++)if(C[k]!==C[k]||C[k]<0)nan++;}}
  ok(nan===0,'no NaN and no negative crop over '+n+' points at four depths');ok(enc===0,'every texel encodes within 0..1');}
// the doc's numbers
{const basin=rows['the basin'].c,shelf=rows['a side flank, the shelf'].c,flank=rows['the fed flank, the shelf break'].c,lee=rows['the lee, the first eddy'].c,leeS=rows['the lee, past the eddies'].c,lag=rows['the lagoon'].c;
  const tot=c=>c[0]+c[1];
  ok(tot(basin)>0.03&&tot(basin)<0.09,'the basin is a gyre (lit layer '+tot(basin).toFixed(3)+' mg/m³, 0.03–0.08)');
  ok(tot(shelf)>0.2&&tot(shelf)<0.9,'the shelf is island water ('+tot(shelf).toFixed(2)+', 0.2–0.5 before the ring)');
  ok(tot(flank)>1&&tot(flank)<6,'the fed flank\'s break is an upwelling flank ('+tot(flank).toFixed(2)+', 1–3 before the ring)');
  ok(tot(lee)>tot(leeS)*1.5,'the eddy retains: the lee\'s crop in the patch '+tot(lee).toFixed(3)+' vs past it '+tot(leeS).toFixed(3));
  ok(tot(lee)<tot(shelf),'and the patch is still poorer than the shelf ('+tot(lee).toFixed(3)+' vs '+tot(shelf).toFixed(2)+'): a little greener than the basin, not a green patch');
  ok(lag[0]>lag[1]*3,'the lagoon is green (green '+lag[0].toFixed(3)+' vs gold '+lag[1].toFixed(3)+')');
  ok(rows['the fed flank, the slope'].c[3]>0.2&&rows['the lagoon'].c[3]<0.01,'the red is the deep column\'s: '+rows['the fed flank, the slope'].c[3].toFixed(2)+' at 95 m over the fed slope, '+rows['the lagoon'].c[3].toFixed(3)+' over the lagoon\'s floor');
  ok(flank[1]>flank[0],'the fed flank is gold (gold '+flank[1].toFixed(2)+' vs green '+flank[0].toFixed(2)+')');
  const v=rows['the vent field'],g=rows['the gap in the sill'].c;ok(v.c[0]+v.c[1]<0.3,'the vent field grows no bloom of its own (the heat\'s food is chemosynthetic: '+(v.c[0]+v.c[1]).toFixed(3)+')');
  ok(g[1]>g[0],'the gap\'s jet is stirred: gold ('+g[1].toFixed(2)+') over green ('+g[0].toFixed(2)+')');}
// the vertical: the red is deepest, the green shallowest, and nothing at 200
{const R=rows['the fed flank, the slope'],tx=R.tx,at=d=>P.bloomC(tx,-R.h,d,[0,0,0]);const s3=at(3),s95=at(95),s200=at(200);
  ok(s3[0]>s95[0]*5&&s95[2]>s3[2]*5,'the green lives in the mixed layer and the red in the deep maximum (green 3 m '+s3[0].toFixed(2)+' / 95 m '+s95[0].toFixed(3)+'; red '+s3[2].toFixed(3)+' / '+s95[2].toFixed(2)+')');
  ok(s200[0]+s200[1]+s200[2]<0.01,'nothing photosynthetic at 200 m ('+(s200[0]+s200[1]+s200[2]).toFixed(4)+')');}
// the ring: along a side radial the front's weight peaks between the shelf and the flank; on the axis it never does; at neaps it moves in
function frontOn(a){const out=[];for(let r=300;r<=2400;r+=25){const x=Math.cos(a)*r,z=Math.sin(a)*r,sm=P.sample(x,z),c=P.plank(x,z,sm),fx=(c[2]-P.FOG_B[0])*P.FOG_B[1];out.push({r,h:sm.h,fr:Math.exp(-fx*fx)});}return out;}
{const S=frontOn(side),best=S.reduce((m,e)=>e.fr>m.fr?e:m,S[0]);ok(best.fr>0.9&&best.h<-40&&best.h>-200,'the ring on a side radial: the front\'s crest at r '+best.r+', the floor '+best.h.toFixed(0)+' (40–200 m, the break)');
  const A=frontOn(up),ba=A.reduce((m,e)=>e.fr>m.fr?e:m,A[0]);ok(ba.fr<0.3,'and broken on the current\'s axis (the stagnation point: the front\'s best '+ba.fr.toFixed(2)+' at r '+ba.r+')');
  P.setClock(30*13/2);P.bloomTick();const N=frontOn(side),bn=N.reduce((m,e)=>e.fr>m.fr?e:m,N[0]);P.setClock(0);P.bloomTick();
  ok(bn.h>best.h+10,'the ring moves onto the shelf at neaps (the crest\'s floor '+bn.h.toFixed(0)+' at r '+bn.r+' against '+best.h.toFixed(0)+' at springs)');
  ok(best.fr>0&&rows['a side flank, the break'].c3[0]+rows['a side flank, the break'].c3[1]>rows['a side flank, the shelf'].c3[0]+rows['a side flank, the shelf'].c3[1],'the ring feeds the lit layer at the break (3 m: '+(rows['a side flank, the break'].c3[0]+rows['a side flank, the break'].c3[1]).toFixed(2)+' vs the shelf\'s '+(rows['a side flank, the shelf'].c3[0]+rows['a side flank, the shelf'].c3[1]).toFixed(2)+')');}
// the maps agree with the field at a texel's centre after a fill and blur at step 1 there (the blur: the 3×3 mean, so the field's own slope over 36 m is the error)
{const s=sites[1],T=2*P.HALF/P.WM_N,i=Math.floor((s.x+P.HALF)/T),j=Math.floor((s.z+P.HALF)/T);P.wmFill(i-2,i+3,j-2,j+3,1);P.wmBlur(i-1,i+2,j-1,j+2);
  const cx=-P.HALF+(i+0.5)*T,cz=-P.HALF+(j+0.5)*T,m=P.wmBloom(cx,cz,[0,0,0,0]),t=P.plankTexel(cx,cz,P.sample(cx,cz),[0,0,0]);let e=0;for(let k=0;k<3;k++)e=Math.max(e,Math.abs(m[k]-t[k]));
  ok(e<0.03,'the maps hold the field at a texel\'s centre (max error '+(e*255).toFixed(1)+' of 255 after the blur)');
  const A=P.bloomAt(cx,-3,cz,[0,0,0]),B=P.plankAt(cx,-3,cz,[0,0,0]);ok(Math.abs(A[0]-B[0])<0.05*B[0]+0.01&&Math.abs(A[1]-B[1])<0.05*B[1]+0.01,'bloomAt (the map) and plankAt (the field) agree there within 5% ('+A.map(v=>v.toFixed(3)).join('/')+' vs '+B.map(v=>v.toFixed(3)).join('/')+')');}
// the GLSL carries the same numbers
{const g=P.BLOOM_GLSL;ok(g.indexOf(P.PLK.k1.toFixed(2))>0&&g.indexOf(P.PLK.k2.toFixed(2))>0&&g.indexOf(P.PLK.front.toFixed(2))>0&&g.indexOf(P.PIGK[0].m1.map(n=>n.toFixed(3)).join(','))>0&&g.indexOf('uFogB')>0,'the GLSL is generated from PLK and PIGK (k1, k2, front, the green\'s tint, uFogB)');}
// the year (v11.83, pass 3): the season through bloomC — the windy peak (s +1) against the still (s −1) over the fed slope; the wind's calms by
// season; the sun's declination, the noon altitude and the day's length at the two peaks; the moon and the equinox untouched
{const R=rows['the fed flank, the slope'],tx=R.tx;const at=(s,d)=>{P.FOG_B[3]=s;const c=P.bloomC(tx,-R.h,d,[0,0,0]);P.FOG_B[3]=0;return c;};
  const w3=at(1,3),c3=at(-1,3),w70=at(1,70),c70=at(-1,70),wr=[],cr=[];for(let d=40;d<=200;d+=5){wr.push([d,at(1,d)[2]]);cr.push([d,at(-1,d)[2]]);}
  const pk=L=>L.reduce((m,e)=>e[1]>m[1]?e:m,L[0]);const pw=pk(wr),pc=pk(cr);
  ok(w3[1]>c3[1]*1.5&&w3[0]>c3[0],'the windy half feeds the lit layer (3 m: gold '+w3[1].toFixed(2)+' vs '+c3[1].toFixed(2)+' still, green '+w3[0].toFixed(2)+' vs '+c3[0].toFixed(2)+')');
  ok(w70[0]+w70[1]>(c70[0]+c70[1])*2,'and mixes it deeper (70 m: the lit crop '+(w70[0]+w70[1]).toFixed(2)+' windy vs '+(c70[0]+c70[1]).toFixed(2)+' still)');
  ok(pc[1]>pw[1]&&pc[0]<pw[0],'the still half has the sharper, shallower deep maximum (red peak '+pc[1].toFixed(2)+' at '+pc[0]+' m vs '+pw[1].toFixed(2)+' at '+pw[0]+' windy)');
  let calmW=0,calmS=0,n=0;const H=30*185;for(let h=0;h<H;h+=1.5){const wx=P.weatherAt(h);n++;if(wx.wind<0.5){if(wx.season>0.5)calmW++;else if(wx.season<-0.5)calmS++;}}
  ok(calmS>calmW*1.6,'the still half has the calms ('+calmS+' hours sampled calm at s<−0.5 vs '+calmW+' at s>0.5 over a year)');

  const HY=30*185,dq=P.sunDec((0.25-0.6)*HY),d0=P.sunDec(-0.6*HY),d3=P.sunDec((0.75-0.6)*HY);ok(Math.abs(d0)<1e-6&&Math.abs(dq-0.262)<1e-6&&Math.abs(d3+0.262)<1e-6,"the sun's declination: "+[d0,dq,d3].map(v=>(v*180/Math.PI).toFixed(1)+'°').join(' / ')+' at the equinox, a quarter and three quarters of the year on (0, +15, −15)');
  const D=[0,0.25,0.75].map(ph=>{const h=(ph-0.6)*30*185;let up=0;for(let hh=0;hh<30;hh+=0.05){const v={x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}};P.skyDir(P.sunHA(h+hh-P.SOLAR_H0),v,P.sunDec(h));if(v.y>0)up+=0.05;}return up;});
  ok(Math.abs(D[0]-15)<0.3&&Math.abs(D[1]-D[2])>0.5&&Math.abs(D[1]-D[2])<2.5,"the day's length: "+D.map(v=>v.toFixed(1)+' h').join(' / ')+' at the equinox and the two peaks (15 at the equinox, under 2.5 h of swing at 11.5° N with a 15° tilt)');
  const m={x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}};P.skyDir(0,m);ok(Math.abs(m.y-Math.cos(0.2))<1e-9,'the moon at declination 0 transits as it did');}
// the swarms (v11.84, pass 4): the capacity by the crop (the ring's cell against the basin's), the day's depth by the sky and the moon
{const ei=P.SPAWN.findIndex(e=>e.kind==='swarm');ok(ei>=0&&P.SPAWN[ei].crop===true,'the swarm is a spawn entry whose capacity reads the crop');
  const cell=(x,z)=>Math.floor((x+P.HALF)/P.CELL)*P.NCELL+Math.floor((z+P.HALF)/P.CELL);const cr=cell(622,579),cb=cell(4000,4000),cf=cell(599,-672);P.ecoCap(cr);P.ecoCap(cb);P.ecoCap(cf);
  ok(P.POP.k[ei][cr]>P.POP.k[ei][cb]*3&&P.POP.k[ei][cf]>P.POP.k[ei][cb]*3,'the swarms are where the water is fed: capacity '+P.POP.k[ei][cr].toFixed(2)+' a cell at the ring, '+P.POP.k[ei][cf].toFixed(2)+' on the fed flank, '+P.POP.k[ei][cb].toFixed(2)+' in the basin');
  const dn=P.swarmDepth(-400,0,0,0.5),dd=P.swarmDepth(-400,1,0,0.5),dm=P.swarmDepth(-400,0,P.MOONL,0.5),sh=P.swarmDepth(-40,1,0,0.5),tw=P.swarmDepth(-400,0.5,0,0.5);
  ok(dn>-50&&dn<-25,'the night layer under the surface ('+dn.toFixed(0)+' m)');ok(dd<-300,'the day layer deep ('+dd.toFixed(0)+' m)');ok(dm<dn-30,'a full moon holds the night layer deeper ('+dm.toFixed(0)+' vs '+dn.toFixed(0)+')');
  ok(sh>-40&&sh<-30,'over a 40 m shelf the day layer is the floor ('+sh.toFixed(0)+' m)');ok(tw<dn&&tw>dd,'and dusk is between ('+tw.toFixed(0)+' m at half day)');
  ok(P.swarmPig(599,-3,-672)===1&&P.swarmPig(54,-3,84)===0,'the swarm takes the kind winning where it forms: gold on the fed flank, green in the lagoon');}
// filter feeding (v11.85, pass 5, §11): the sieve off the build, the swarm on the filter feeders' paper prey and on no hunter's chase, the intake through a swarm
{const F=k=>P.derive(P.SPECS[k]).filter,ch={creatures:[],schools:[],eggs:[],i:0,j:0}; // a cell for spawn to keep its creatures in (nothing here is on the ledger: ent -1)
  ok(F('veil')>F('comb')&&F('comb')>F('ram')&&F('ram')>F('sifter')&&F('sifter')>0,'the sieve off the build: the veil '+F('veil')+' m², the comb '+F('comb')+', the ram '+F('ram')+', the sifter '+F('sifter'));
  ok(F('tread')===0&&F('pall')===0&&F('lash')===0&&F('fin')===0,'no sieve on the tread\'s floor combs, the pall\'s net, the lash, the finback');
  ok(P.DEFS.veil.filter===F('veil')&&P.ecoOf('veil').prey.join()==='swarm'&&P.ecoOf('veil').hunter&&!P.DEFS.veil.prey,'the veil hunts the swarm on paper (ecoOf) and chases nothing (no DEFS prey)');
  ok(P.ecoOf('ram').prey.indexOf('swarm')>=0&&P.DEFS.ram.prey.indexOf('swarm')<0&&P.ecoOf('tread').prey.length===0,'the ram\'s paper prey has the swarm, its chase list has not; the tread hunts nothing');
  ok(P.ecoOf('swarm').mortal&&P.ecoOf('swarm').food===216,'the swarm is mortal on the ledger, 216 t of food');
  const sw=P.spawn(ch,'swarm',P.V3(0,-40,0),Math.random),v=P.spawn(ch,'veil',P.V3(0,-40,3),Math.random);sw.flesh=P.bioMass(sw.def);v.hunger=1;v.sw=sw;v.vel.set(0,0,0);
  const K=P.ecoOf('veil'),f0=sw.flesh;let s=0;while(v.hunger>0&&s<600){P.filterIntake(v,0.05);s+=0.05;}
  ok(v.hunger===0&&s>10&&s<120,'a starving veil hanging still in a full swarm is fed in '+s.toFixed(0)+' s (its meal '+K.meal.toFixed(0)+' t)');
  ok(Math.abs((f0-sw.flesh)-K.meal)<1e-3&&P.swarmShare(sw)>0.4&&P.swarmShare(sw)<0.7,'the swarm lost exactly the meal: '+Math.round(P.swarmShare(sw)*100)+'% of it left');
  const f1=sw.flesh,h1=P.filterIntake(v,1);ok(h1===false&&sw.flesh===f1,'a fed veil takes nothing more');
  v.pos.set(0,-40,P.swarmR(sw)+2);v.hunger=1;ok(P.filterIntake(v,1)===false&&v.hunger===1,'outside the cloud the sieve returns nothing');
  v.pos.set(0,-40,0);let n=0;while(sw.alive&&n<200){v.hunger=1;P.filterIntake(v,1);n++;}
  ok(!sw.alive&&P.creatures.indexOf(sw)<0&&n>60&&n<190,'eaten down to '+Math.round(P.FILTER.spent*100)+'% the swarm disperses ('+n+' s more under a starving veil: the intake falls with the density, so the tail is long)');
  const c=P.spawn(ch,'comb',P.V3(50,-40,0),Math.random),sw2=P.spawn(ch,'swarm',P.V3(0,-40,0),Math.random);sw2.flesh=P.bioMass(sw2.def);c.hunger=0.9;c.state='wander';c.swT=0;c.vel.set(0,0,0);
  let d0=c.pos.distanceTo(sw2.pos),tt=0;while(tt<120&&c.hunger>P.FILTER.full){P.filterSeek(c,0.1);c.pos.addScaledVector(c.vel,0.1);tt+=0.1;}
  ok(c.state==='filter'||c.hunger<=P.FILTER.full,'a hungry comb 50 m from a swarm seeks it (state '+c.state+', '+d0.toFixed(0)+' m to '+c.pos.distanceTo(sw2.pos).toFixed(0)+' m)');
  ok(c.hunger<=P.FILTER.full&&tt<120,'and is fed in it in '+tt.toFixed(0)+' s');
  P.filterSeek(c,0.5);P.filterSeek(c,0.5);ok(c.state==='wander'&&c.sw===null,'fed, it lets the swarm go and wanders');
  const s3=P.spawn(ch,'sifter',P.V3(0,-40,0),Math.random);ok(P.eaterK(s3).hunter&&s3.def.filter>0,'a sifter has the stomach on the model');
  for(const o of [v,c,s3,sw2])if(o.alive){o.alive=false;}}
// the storm's pulse over a month: bounded, and non-zero after rain
{let mx=0,mn=1e9;for(let h=0;h<30*24;h+=1){P.setClock(h);P.bloomTick();mx=Math.max(mx,P.FOG_B[2]);mn=Math.min(mn,P.FOG_B[2]);}P.setClock(0);P.bloomTick();
  ok(mx>0.1&&mx<8,'the storm\'s pulse over 24 days peaks at ×'+(1+mx).toFixed(2)+' on the gold (bounded; ×'+(1+mn).toFixed(2)+' at its least)');}
console.log(failed?'plankton FAILED':'plankton ok');
process.exit(failed?1:0);
