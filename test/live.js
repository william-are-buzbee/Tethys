// test/live.js — the ecology where the player is (v11.31.2, analysis_review 12 and 13). The paper model has its own test
// (test/census.js); this one boots the whole game against the stub, lets the cells round the player load, and asks the two questions
// the person's readout raised: does a loaded cell ever lay a clutch, and do its hunters ever hunt?
//   1. the clutch: the ecology clock is driven forward a game day at a time (ecoTick with the model drained each step, updateEggs on
//      the matching real seconds) and the run fails if nothing is laid or nothing hatches. Before v11.31.2 this printed laid 0 for
//      ever: the loaded cell's growth went into POP.n, which ecoDebit and ecoWriteBack pinned back to the living.
//   2. the hunt: real frames, and a table of every hunter kind — its mean hunger, how much of the time it sits at hunger 1.00, how
//      much of it it spends chasing, and how far the nearest animal it eats actually is against its own `detect`. That last number is
//      the whole of finding 13: the nearest prey is 35-50 m off against a detect of 9-17.
// `node test/live.js` (TIER=low for the low tier). It says nothing about rendering or sound.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const ORDER=fs.readFileSync(path.join(ROOT,'src','order.txt'),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&s[0]!=='#');
let js=ORDER.map(n=>fs.readFileSync(path.join(ROOT,'src',n+'.js'),'utf8')).join('\n');
// the ecology clock, driven without waiting out 40 real minutes a game day: a slice of game hours, the model drained, the eggs aged
js+='\nglobal.__peak=()=>{player.pos.set(0,dispY,0);cellsAround();};';
js+='\nglobal.__day=(hours,step)=>{for(let h=0;h<hours;h+=step){clockH+=step;POP.acc=ECO_STEP;ecoTick(ECO_STEP);let g=0;while(POP.model&&g++<5000)ecoTick(0);updateEggs(step/CLOCK_RATE);}};';
js+='\nglobal.__eggs=()=>{let ow=0,nan=0;for(let ei=0;ei<SPAWN.length;ei++){const W=POP.ow[ei];for(let c=0;c<ECO_CELLS;c++){if(W[c]!==W[c])nan++;ow+=W[c];}}'
  +'return {day:+(clockH/DAY_H).toFixed(2),laid:POP.laid,hatched:POP.hatched,eggs:eggs.length,recruits:POP.recruits,owed:+ow.toFixed(1),nan,cells:chunks.size,creatures:creatures.length};};';
// one sample of every hunter-role animal: hunger, state, and the distance to the nearest thing on its prey list
js+='\nglobal.__H={n:0,k:{}};global.__samp=()=>{for(const c of creatures){if(!c.alive||c.dead)continue;const d=c.def;if(d.role!==\'hunter\'&&d.role!==\'ambush\'&&d.role!==\'trap\')continue;'
  +'let bd=1e9;for(const o of creatures){if(!o.alive||o.dead||o===c)continue;if(d.prey.indexOf(o.kind)<0)continue;const dd=c.pos.distanceTo(o.pos);if(dd<bd)bd=dd;}'
  +'const r=__H.k[c.kind]||(__H.k[c.kind]={n:0,hun:0,hi:0,ch:0,near:0,nn:0,det:d.detect||d.radius||0,role:d.role});__H.n++;'
  +'r.n++;r.hun+=c.hunger;if(c.hunger>0.9)r.hi++;if(c.state===\'chase\'||c.state===\'strike\'||c.state===\'lunge\'||c.state===\'feed\')r.ch++;if(bd<1e8){r.near+=bd;r.nn++;}}};';
js+='\nglobal.__hunt=()=>({kills:POP.kills,starved:+POP.starved.toFixed(1),carcasses:carcasses.length,rows:Object.keys(__H.k).map(k=>{const r=__H.k[k];'
  +'return {kind:k,role:r.role,n:r.n,hunger:r.hun/r.n,hi:100*r.hi/r.n,ch:100*r.ch/r.n,near:r.nn?r.near/r.nn:-1,det:r.det};}).sort((a,b)=>b.hi-a.hi)});';
const tmp=path.join(require('os').tmpdir(),'tethys_live.js');
fs.writeFileSync(tmp,'(function(){"use strict";\n'+js+'\n})();');
process.env.PICK='1';
require('./stub.js');
require(tmp);
let bad=[];
__peak();__step(600); // the player at the peak and its cells loaded (v11.48: the title screen opens over the sea since v11.47.2, and this test never starts a game — it measures the menu's world), then the cells round it load and spawn
console.log('boot          '+JSON.stringify(__eggs()));
// ---- 1. the clutch ----
let first=0;
for(let k=0;k<6;k++){__day(20,0.05);const e=__eggs();if(!first&&e.laid)first=e.day;console.log('  +20 hours   '+JSON.stringify(e));}
const E=__eggs();
if(E.nan)bad.push('NaN in POP.ow');
if(!E.laid)bad.push('no clutch was laid in four game days with '+E.cells+' cells loaded (analysis_review 12)');
else if(!E.hatched)bad.push(E.laid+' clutches laid and none hatched');
else console.log('  first clutch at game day '+first.toFixed(2)+', '+E.laid+' laid and '+E.hatched+' hatched by day '+E.day);
// ---- 2. the hunt ----
__step(600);const k0=__hunt().kills;
for(let k=0;k<30;k++){__step(120);__samp();} // 60 s of play, sampled every 2 s
const H=__hunt();
console.log('\n  the hunters over 60 s of play (kills '+(H.kills-k0)+', starved '+H.starved+', carcasses '+H.carcasses+'):');
console.log('  kind          role      seen   hunger   at 1.00   hunting   nearest prey   detect');
for(const r of H.rows)console.log('  '+r.kind.padEnd(13)+r.role.padEnd(9)+String(r.n).padStart(5)+r.hunger.toFixed(2).padStart(9)
  +(r.hi.toFixed(0)+'%').padStart(10)+(r.ch.toFixed(0)+'%').padStart(10)+(r.near<0?'-':r.near.toFixed(0)+' m').padStart(15)+r.det.toFixed(0).padStart(9));
const hunters=H.rows.filter(r=>r.role==='hunter'),hi=hunters.reduce((a,b)=>a+b.hi*b.n,0)/Math.max(1,hunters.reduce((a,b)=>a+b.n,0));
console.log('  '+hi.toFixed(0)+'% of the hunter role sat at hunger 1.00 (the cast, HUNT_SEEK/HUNT_CAST, took this from 13% to 9% on the shelf)');
if(H.kills===k0)bad.push('nothing was killed in 60 s of play');
if(!hunters.some(r=>r.ch>0))bad.push('no hunter chased anything in 60 s of play');
if(hi>25)bad.push(hi.toFixed(0)+'% of hunters are starving and not eating (was 13% at v11.31.1)');
if(bad.length){console.error('live: FAILED — '+bad.join('; '));process.exit(1);}
console.log('live: ok');
