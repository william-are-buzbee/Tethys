// test/census.js — the world's population on paper (v11.26): every cell's capacity from the envelopes (creatures_defs.js SPAWN,
// ecology.js ecoCap), summed over the 16×16 cells, then the ledger's model (ecoModel) run with no cell loaded for a number of game
// days, the totals per kind printed on the way. Loads util, world, creatures_defs and ecology against the stub (no cells, no player).
// `node test/census.js [days]` (default 60; the readout is every tenth of the run); `json` prints the day-0 totals only.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
require('./stub.js');
const src=['util','world','creatures_defs','ecology'].map(n=>fs.readFileSync(path.join(ROOT,'src',n+'.js'),'utf8')).join('\n');
const pre='const compile=()=>null,SPECS={},Q={creatures:1},chunkGrid=[],chunks=new Map(),creatures=[],carcasses=[],player={pos:{}},mode="paper";function cellOf(v){return Math.floor((v+HALF)/CELL);}function placeKind(){}\n';
const W=new Function('return (function(){"use strict";'+pre+src+'\nreturn {SPAWN,DEFS,POP,ECO,ECO_CELLS,ecoCap,ecoModel,ecoOf,ecoSettle};})()')();
const {SPAWN,DEFS,POP,ECO,ECO_CELLS,ecoCap,ecoModel,ecoOf,ecoSettle}=W;
for(let c=0;c<ECO_CELLS;c++)ecoCap(c,null);ecoSettle(()=>false);
const tot=()=>{const m={};SPAWN.forEach((e,ei)=>{let s=0;for(let c=0;c<ECO_CELLS;c++)s+=POP.n[ei][c];m[e.kind]=(m[e.kind]||0)+s;});return m;};
const cap=()=>{const m={};SPAWN.forEach((e,ei)=>{let s=0;for(let c=0;c<ECO_CELLS;c++)s+=POP.k[ei][c];m[e.kind]=(m[e.kind]||0)+s;});return m;};
if(process.argv[2]==='json'){console.log(JSON.stringify(tot()));process.exit(0);}
const days=+process.argv[2]||60,step=0.02,K0=cap(),T0=tot(),kinds=Object.keys(T0).sort((a,b)=>K0[b]-K0[a]);
console.log('kind          K     day0    mass  r/day  cycle   meal    need  prey');
let preyB=0,predB=0;
for(const k of kinds){const E=ecoOf(k),b=T0[k]*E.mass;if(E.hunter)predB+=b;else if(DEFS[k].edible||E.mortal)preyB+=b;
  console.log(k.padEnd(12),K0[k].toFixed(0).padStart(5),T0[k].toFixed(0).padStart(7),E.mass.toFixed(2).padStart(8),E.r.toFixed(3).padStart(6),E.cycle.toFixed(2).padStart(6),E.meal.toFixed(2).padStart(7),E.need.toFixed(3).padStart(7),' ',E.prey.join(','));}
console.log('total capacity',Object.values(K0).reduce((a,b)=>a+b,0).toFixed(0),' day-0 count',Object.values(T0).reduce((a,b)=>a+b,0).toFixed(0),' mortal non-hunter biomass',preyB.toFixed(0),' hunter biomass',predB.toFixed(0));
console.log('\nthe model, '+days+' days with nothing loaded (per kind, mortal kinds only):');
const mort=kinds.filter(k=>ecoOf(k).mortal);
console.log('day  '.padEnd(6)+mort.map(k=>k.slice(0,7).padStart(8)).join(''));
const row=(d)=>{const T=tot();console.log(String(d).padStart(4)+'  '+mort.map(k=>T[k].toFixed(T[k]<20?1:0).padStart(8)).join(''));};
row(0);let next=days/10;
for(let d=0;d<days-1e-9;d+=step){ecoModel(step,()=>false);if(d+step>=next-1e-9){row(Math.round(d+step));next+=days/10;}}
console.log('tally: born',POP.births.toFixed(0),'died',POP.deaths.toFixed(0),'eaten',POP.eaten.toFixed(0),'starved',POP.starved.toFixed(0));
// the check: nothing NaN, and no kind fed by the model collapses under a fifth of its start — a boom-bust pyramid is a bug in the
// numbers (the take cap, H, the stocks), and the game would show it as a shelf with no hunters and then no forage
const T=tot();let bad=[];for(const k of mort){if(!(T[k]>=0))bad.push(k+' NaN');else if(T0[k]>2&&T[k]<T0[k]*0.2)bad.push(k+' '+T0[k].toFixed(1)+'→'+T[k].toFixed(1));}
if(bad.length){console.error('census: FAILED —',bad.join('; '));process.exit(1);}console.log('census: ok');
