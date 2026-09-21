// Headless check of the player as a spec (v11.68): the three presets play on today's numbers (CLADES to v11.67, hand-typed, now locks on
// their SPECS), a spec that is no preset takes its numbers from derive, the save carries the spec (SAVE_V 2) and a version 1 record's
// clade id loads as its preset. Same bundle and stub as the smoke test. TIER=low runs the low tier.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const ORDER=fs.readFileSync(path.join(ROOT,'src','order.txt'),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&s[0]!=='#');
let js=ORDER.map(n=>fs.readFileSync(path.join(ROOT,'src',n+'.js'),'utf8')).join('\n');
js+='\nglobal.__pl={CLADES,SPECS,statsOf,playerClade,player,startNew,startFrom,saveNow,saveRefresh,get saveList(){return saveList;},get curSave(){return curSave;},get mode(){return mode;},SAVE_V,specToJSON};';
const tmp=path.join(require('os').tmpdir(),'tethys_player.js');
fs.writeFileSync(tmp,'(function(){"use strict";\n'+js+'\n})();');
require('./stub.js');require(tmp);
const X=global.__pl;let fails=0;
function check(ok,msg){if(!ok){fails++;console.error('  FAIL '+msg);}else console.log('  ok   '+msg);}
// ---- 1. the presets: every number CLADES hand-typed to v11.67, literally ----
const OLD={
  soft:{speed:7.0,jet:true,jetImp:10,accel:3.2,bite:9,cam:6.5,turn:7,size:1.6,mass:5,sprint:undefined,venom:undefined},
  fin:{speed:8.8,sprint:1.75,accel:2.6,bite:26,cam:7.5,turn:4.5,size:1.8,mass:7,jet:false,jetImp:undefined,venom:undefined},
  coil:{speed:4.6,jet:true,jetImp:7,accel:1.5,bite:6,cam:6.5,turn:3,size:1.5,mass:8,sprint:undefined,venom:{kind:'paralyse',t:5,against:{slowbloods:1,ringmouths:1}}}};
for(const id in OLD){const C=X.CLADES.find(c=>c.id===id),o=OLD[id];if(!C){check(false,id+': no preset');continue;}
  const bad=Object.keys(o).filter(k=>JSON.stringify(!!o[k]===o[k]?!!C[k]:C[k])!==JSON.stringify(o[k]));
  check(!bad.length,id+': '+(bad.length?bad.map(k=>k+' '+JSON.stringify(C[k])+' (was '+JSON.stringify(o[k])+')').join(', '):'speed '+C.speed+' accel '+C.accel+' turn '+C.turn+' mass '+C.mass+' bite '+C.bite+' cam '+C.cam+' as CLADES had them'));
  check(C.spec===X.SPECS[id],id+': built from SPECS.'+id);}
// ---- 2. a spec that is no preset: its numbers are derive's ----
const sick=JSON.parse(JSON.stringify(X.SPECS.sickle));sick.id='mine';
const Cs=X.playerClade(sick),st=X.statsOf(sick);
check(Cs.speed===st.speed&&Cs.turn===st.turn&&Cs.mass===st.mass&&Cs.accel===st.accel,'a hingeshell spec: speed '+Cs.speed+' turn '+Cs.turn+' mass '+Cs.mass+' accel '+Cs.accel+' off derive');
check(Cs.ability===null&&!Cs.venom,'a hingeshell has no preset ability and no venom (none of the presets is its clade)');
// ---- 3. the save: the spec on the record, back as it went; a version 1 record's clade id as its preset ----
X.startNew(Cs);X.saveRefresh();
const rec=X.saveList.find(r=>r.id===X.curSave.id);
check(rec&&rec.v===X.SAVE_V&&X.SAVE_V===2&&rec.spec&&rec.spec.id==='mine','the record carries the spec (v '+(rec&&rec.v)+')');
X.startFrom(rec);
check(X.player.clade.spec.id==='mine'&&X.player.clade.speed===Cs.speed&&X.specToJSON(X.player.clade.spec)===X.specToJSON(sick),'continue builds the saved spec, speed '+X.player.clade.speed);
const r1=JSON.parse(JSON.stringify(rec));delete r1.spec;r1.v=1;r1.clade='coil';X.startFrom(r1);
check(X.player.clade===X.CLADES.find(c=>c.id==='coil'),'a version 1 record (clade id only) loads as its preset');
const r2=JSON.parse(JSON.stringify(rec));r2.spec={clade:'ringmouths',core:{kind:'nothing'},parts:[]};r2.clade='soft';X.startFrom(r2);
check(X.player.clade===X.CLADES.find(c=>c.id==='soft'),'a spec that no longer compiles falls back to the preset its clade id names');
const f=X.CLADES.find(c=>c.id==='fin');X.startNew(f);X.saveRefresh();const rf=X.saveList.find(r=>r.id===X.curSave.id);X.startFrom(rf);
const Cf=X.player.clade;check(['speed','accel','turn','mass','bite','cam','sprint','size'].every(k=>Cf[k]===f[k])&&Cf.name==='finback','the finback round trip plays on the same numbers ('+Cf.name+')');
console.log(fails?'player: '+fails+' FAILED':'player: all ok');
process.exit(fails?1:0);
