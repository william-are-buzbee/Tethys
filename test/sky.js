// Headless sky check (v11.87, CLOUDS.md): the cloud field's JavaScript twin against its own calibration — the threshold table monotone, the cloud
// fraction equal to the cover it was asked for, no NaN over the world (the giant's cap included), the beam's shadow in range — the weather's
// clocks over a year (showers ~8% of hours and twice as likely before dawn as in the afternoon, the cirrus the still season's, the calms a
// quarter, boot fair with a shower a few hours in), and the lumps' scan (a pool never exceeded, every lump measured, the caps present), with
// the costs. It proves the numbers; it says nothing about how the sky looks — test/render/v87*.png are the looks.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const ORDER=fs.readFileSync(path.join(ROOT,'src','order.txt'),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&s[0]!=='#');
let js=ORDER.map(n=>fs.readFileSync(path.join(ROOT,'src',n+'.js'),'utf8')).join('\n');
js+='\nglobal.__sky={weatherAt,CLD_TH,cldThOf,cldTh0,cldN,cldDensity,cloudAt,CLD_S,CLD,CLD_CAPS,FZ0,DAY_H,SOLAR_H0,YEAR_D,seasonAt,SKY,CLOUD_H,LUMP_N,lumps,lumpFixed,lumpScan,updateClouds,camera,player,WX,ISLANDS,HALF,step:__step,SHWR,CELLS,updateCells,WIND_A,setClock:h=>{clockH=h;}};';
const tmp=path.join(require('os').tmpdir(),'tethys_sky_bundle.js');
fs.writeFileSync(tmp,'(function(){"use strict";\n'+js+'\n})();');
process.env.PICK='1';
require('./stub.js');
require(tmp);
const S=global.__sky;let failed=false;
function ok(c,msg){console.log((c?'  ok   ':'  FAIL ')+msg);if(!c)failed=true;}
const T=v=>+v.toFixed(3);
// ---------- the field ----------
console.log('the field');
let mono=true;for(let k=1;k<S.CLD_TH.length;k++)if(!(S.CLD_TH[k]<=S.CLD_TH[k-1]))mono=false;
ok(mono&&S.CLD_TH.length===21,'the threshold table falls with the cover: '+S.CLD_TH.map(x=>x.toFixed(2)).join(' '));
const rng=(s=>()=>{s=(s*16807)%2147483647;return s/2147483647;})(77);
S.CLD_S.street=0;S.CLD_S.cap=0;S.CLD_S.rise=S.CLD.rise;
for(const cv of [0.15,0.45,0.75]){S.CLD_S.th=S.cldThOf(cv);let c=0;const N=4000,th0=S.cldTh0();for(let i=0;i<N;i++){const x=(rng()-0.5)*40000,z=(rng()-0.5)*40000;if(S.cldN(x,z,x+123,z+456,S.FZ0)>th0)c++;}
  ok(Math.abs(c/N-cv)<0.06,'cover '+cv+' is '+(c/N).toFixed(3)+' of the field over its threshold');}
S.CLD_S.street=1;{let c=0;const N=4000,th0=S.cldTh0();for(let i=0;i<N;i++){const x=(rng()-0.5)*40000,z=(rng()-0.5)*40000;if(S.cldN(x,z,x+123,z+456,S.FZ0)>th0)c++;}ok(Math.abs(c/N-0.75)<0.08,'with the streets on cover 0.75 is '+(c/N).toFixed(3));}
{let nan=0,lo=1e9,hi=-1e9;S.CLD_S.cap=S.CLD.capA;for(let i=0;i<6000;i++){const x=(rng()-0.5)*2*S.HALF*1.4,z=(rng()-0.5)*2*S.HALF*1.4,n=S.cldN(x,z,x+9000,z-4000,rng());if(n!==n)nan++;lo=Math.min(lo,n);hi=Math.max(hi,n);}
  ok(nan===0&&lo>=0&&hi<=1.5,'no NaN over the world at any height with the cap on: '+T(lo)+' .. '+T(hi));}
{const C=S.CLD_CAPS[0];ok(!!C,'a cap over the giant ('+(C?C.x.toFixed(0)+', '+C.z.toFixed(0):'none')+')');
  if(C){S.CLD_S.th=S.cldThOf(0.15);S.CLD_S.cap=S.CLD.capA;S.CLD_S.street=0;let inC=0,out=0;for(let i=0;i<400;i++){const a=rng()*Math.PI*2,r=rng()*1200;inC+=S.cldDensity(C.x+Math.cos(a)*r,C.z+Math.sin(a)*r,C.x+Math.cos(a)*r+5000,C.z+Math.sin(a)*r+7000);out+=S.cldDensity(C.x+20000+Math.cos(a)*r,C.z+Math.sin(a)*r,C.x+20000+Math.cos(a)*r+5000,C.z+Math.sin(a)*r+7000);}
    ok(inC/400>out/400+0.3,'under a clear sky (cover 0.15) the giant wears its cap: density '+T(inC/400)+' over it against '+T(out/400)+' 20 km off');}}
{S.CLD_S.th=S.cldThOf(0.5);S.CLD_S.cap=0;let bad=0;for(let i=0;i<2000;i++){const c=S.cloudAt((rng()-0.5)*4000,-5,(rng()-0.5)*4000,{x:0.3,y:0.2+0.8*rng(),z:0.2});if(!(c>=0&&c<=1))bad++;}ok(bad===0,'the density over a point is 0..1');
  ok(S.cloudAt(0,-5,0,{x:1,y:0.01,z:0})===S.SKY.cover,'a ray flatter than the deck reads the cover');}
// ---------- the weather's clocks ----------
console.log('the weather');
{const o={};let n=0,rain=0,calm=0,cov=0,cir=[0,0],cN=[0,0],rD=[0,0],rN=[0,0],spread=0,deepMax=0;
  for(let h=0;h<30*S.YEAR_D;h+=0.25){S.weatherAt(h,o);n++;cov+=o.cover;if(o.rain>0.5)rain++;if(o.wind<0.5)calm++;const s=o.season>0?0:1;cir[s]+=o.cirrus;cN[s]++;const lh=(h+S.SOLAR_H0)%S.DAY_H;if(lh>=2&&lh<8){rD[0]+=o.rain;rN[0]++;}if(lh>=17&&lh<23){rD[1]+=o.rain;rN[1]++;}spread+=o.spread;deepMax=Math.max(deepMax,o.deep);
    if(!(o.cover>=0.08&&o.cover<=0.92&&o.rain>=0&&o.rain<=1&&o.cirrus>=0&&o.cirrus<=1&&o.wind>=0&&o.wind<=1&&o.deep>=1&&o.spread>=0&&o.spread<=1&&o.hazeK>=1)){ok(false,'a weather number out of range at h '+h+': '+JSON.stringify(o));break;}}
  const rp=rain/n,cp=calm/n;ok(rp>0.04&&rp<0.13,'showers '+(rp*100).toFixed(1)+'% of the year\'s hours');ok(cp>0.15&&cp<0.4,'calms '+(cp*100).toFixed(1)+'%');ok(cov/n>0.3&&cov/n<0.55,'mean cover '+T(cov/n));
  ok(rD[0]/rN[0]>1.5*(rD[1]/rN[1]),'showers before dawn against the afternoon: '+T(rD[0]/rN[0])+' / '+T(rD[1]/rN[1]));
  ok(cir[1]/cN[1]>2*(cir[0]/cN[0]),'the cirrus is the still season\'s: '+T(cir[1]/cN[1])+' against the windy '+T(cir[0]/cN[0]));
  ok(spread/n>0.01&&spread/n<0.2,'the tops spread '+T(spread/n)+' of the time');ok(deepMax>1.3&&deepMax<2,'the congestus at most '+T(deepMax)+' deep');
  S.weatherAt(0,o);ok(o.rain<0.05&&o.cover>0.3&&o.cover<0.6,'boot is fair: cover '+T(o.cover)+', rain '+T(o.rain));
  let first=-1;for(let h=0;h<40;h+=0.25){S.weatherAt(h,o);if(o.rain>0.5){first=h;break;}}ok(first>1&&first<8,'the first shower '+first+' h in');}
// ---------- the lumps ----------
console.log('the lumps');
for(let i=0;i<30;i++)S.step(1);
S.camera.position.set(200,6,-300);S.player.pos.set(200,6,-300);
{const K=S.SKY;S.CLD_S.th=S.cldThOf(0.55);S.CLD_S.street=1;S.CLD_S.cap=S.CLD.capA;K.windOff[0]=1234;K.windOff[1]=-777;
  S.lumpScan();const alive=S.lumps.filter(L=>L.alive);ok(alive.length>0&&alive.length<=S.LUMP_N,alive.length+' lumps found at cover 0.55 within the scan');
  let bad=0;for(const L of alive){if(!(L.rx>=50&&L.rx<=1500&&L.rz>=50&&L.rz<=1500&&isFinite(L.fx)&&isFinite(L.fz)))bad++;}ok(bad===0,'every lump measured: rx '+alive.map(L=>L.rx|0).join(' ')+' / rz '+alive.map(L=>L.rz|0).join(' '));
  const keys=new Set(alive.map(L=>L.key));ok(keys.size===alive.length,'no two lumps on one cloud');
  S.lumpScan();const again=S.lumps.filter(L=>L.alive).map(L=>L.key).sort().join();ok(again===[...keys].sort().join(),'a second scan finds the same clouds');
  S.CLD_S.th=S.cldThOf(0.05);S.lumpScan();ok(S.lumps.filter(L=>L.alive).length<alive.length,'a clearer sky has fewer: '+S.lumps.filter(L=>L.alive).length);
  ok(S.lumpFixed.length===5*S.CLD_CAPS.length,S.lumpFixed.length+' fixed lumps for '+S.CLD_CAPS.length+' cap(s)');}
// ---------- the showers (v11.88) ----------
console.log('the showers');
{const K=S.SKY,W=S.WX,px=200,pz=-300;S.player.pos.set(px,pz*0+6,pz);K.windOff[0]=0;K.windOff[1]=0;K.wind[0]=Math.cos(S.WIND_A)*7;K.wind[1]=Math.sin(S.WIND_A)*7;
  // an episode: the first shower's hour (test above: 3.25 h in); the trigger births one cell upwind of the player, and one only
  S.setClock(3.5);S.weatherAt(3.5,W);ok(W.rain>0.5,'the trigger is on at h 3.5 ('+T(W.rain)+')');
  S.updateCells(0.02);S.updateCells(0.02);ok(S.CELLS.length===1,'one cell for the episode after two frames');
  const c=S.CELLS[0],al0=(c.x-px)*Math.cos(S.WIND_A)+(c.z-pz)*Math.sin(S.WIND_A),cr0=-(c.x-px)*Math.sin(S.WIND_A)+(c.z-pz)*Math.cos(S.WIND_A);
  ok(al0<-S.SHWR.ahead*0.9&&Math.abs(cr0)<=S.SHWR.band,'born '+(-al0|0)+' m upwind, '+(cr0|0)+' m across the wind');
  ok(c.R>=S.SHWR.R[0]&&c.R<=S.SHWR.R[1],'its radius '+(c.R|0));
  // it moves along the wind at SHWR.u × the trades; it grows; the field lifts at its anchor; it dies at its life's end
  for(let i=0;i<100;i++)S.updateCells(1);const al1=(c.x-px)*Math.cos(S.WIND_A)+(c.z-pz)*Math.sin(S.WIND_A);
  ok(Math.abs((al1-al0)-100*(S.SHWR.u-1)*7)<5,'100 s on it has moved '+((al1-al0)|0)+' m downwind through the field (its steering less the drift; the field itself is still here, so the world sees the trades × '+S.SHWR.u+')');
  ok(c.s>0.5,'grown to '+T(c.s));
  S.CLD_S.th=S.cldThOf(0.15);S.CLD_S.street=0;S.CLD_S.cap=0;ok(S.cldDensity(c.x,c.z,c.ax,c.az)>0.9,'the field is cloud over its centre under a clear sky (density '+T(S.cldDensity(c.x,c.z,c.ax,c.az))+')');
  ok(S.cldDensity(c.x+4*c.R,c.z,c.ax+4*c.R,c.az)<0.5,'and not four radii off');
  c.ax=px+K.windOff[0];c.az=pz+K.windOff[1];S.updateCells(0.02);ok(K.rain>0.9*c.s,'over the player it rains ('+T(K.rain)+' of its strength '+T(c.s)+')');
  c.ax=px+K.windOff[0]+c.R*3.5;S.updateCells(0.02);ok(K.rain<0.01&&K.cellNear<0.2,'three and a half radii off, no rain and the cover barely lifted');
  c.t=S.SHWR.life+1;S.updateCells(0.02);ok(S.CELLS.length===0,'gone at its life\'s end');
  S.setClock(3.5);for(let i=0;i<3;i++)S.updateCells(0.02);ok(S.CELLS.length===0,'the same episode births no second cell');}
// ---------- costs ----------
{let t0=process.hrtime.bigint();for(let i=0;i<10000;i++)S.cloudAt(i*0.3,-5,i*0.1,{x:0.3,y:0.8,z:0.2});const us=Number(process.hrtime.bigint()-t0)/1e4/1000;
  t0=process.hrtime.bigint();for(let i=0;i<10;i++)S.lumpScan();const ms=Number(process.hrtime.bigint()-t0)/1e7;
  console.log('  cost: cloudAt '+us.toFixed(2)+' µs, a scan '+ms.toFixed(2)+' ms (every '+0.5+' s in the air)');ok(us<20&&ms<8,'the costs are small');}
console.log(failed?'sky: FAILED':'sky: ok');
process.exit(failed?1:0);
