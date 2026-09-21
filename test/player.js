// Headless check of the player as a spec (v11.68; v11.71: one calculator): the three presets' speed, accel and turn are derive's and no species
// ships with a lock, every DEFS kind moves on derive's numbers, the ceiling is neutral at 30 m, a spec that is no preset takes its numbers from derive, the save carries the spec (SAVE_V 2) and a version 1 record's
// clade id loads as its preset. Same bundle and stub as the smoke test. TIER=low runs the low tier.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const ORDER=fs.readFileSync(path.join(ROOT,'src','order.txt'),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&s[0]!=='#');
let js=ORDER.map(n=>fs.readFileSync(path.join(ROOT,'src',n+'.js'),'utf8')).join('\n');
js+='\nglobal.__pl={CLADES,SPECS,DEFS,derive,statsOf,playerClade,player,startNew,startFrom,saveNow,saveRefresh,get saveList(){return saveList;},get curSave(){return curSave;},get mode(){return mode;},SAVE_V,specToJSON};';
js+='\nglobal.__line={get t(){return t;},setT(v){t=v;clockH=t*CLOCK_RATE;},DAY_S,LINE,BROOD_SURVIVE,groundAt,lay:()=>playerLay(),eggs:()=>eggs,cur:()=>lineCur(),line:()=>curSave?curSave.line:null,die:(c)=>die(c),live:(b)=>broodLive(b),young:(b)=>creatures.filter(c=>c.alive&&c.brood===b),tick:(dt)=>lineTick(dt),children:()=>lineChildren(),clear:()=>worldClear(),cells:()=>cellsAround()};';
const tmp=path.join(require('os').tmpdir(),'tethys_player.js');
fs.writeFileSync(tmp,'(function(){"use strict";\n'+js+'\n})();');
require('./stub.js');require(tmp);
const X=global.__pl;let fails=0;
function check(ok,msg){if(!ok){fails++;console.error('  FAIL '+msg);}else console.log('  ok   '+msg);}
// ---- 1. the presets (v11.71): speed, accel and turn are derive's, as every animal's; the contact mass is the creatures' rule; the fixed few are the preset's ----
const FIXED={soft:{jet:true,jetImp:10,cam:6.5,size:1.6,sprint:undefined,venom:undefined,ability:'ink'},fin:{sprint:1.75,cam:7.5,size:1.8,jet:false,jetImp:undefined,venom:undefined,ability:'stun'},
  coil:{jet:true,jetImp:7,cam:6.5,size:1.5,sprint:undefined,venom:{kind:'paralyse',t:5,against:{slowbloods:1,ringmouths:1}},ability:'withdraw'}};
for(const id in FIXED){const C=X.CLADES.find(c=>c.id===id),o=FIXED[id];if(!C){check(false,id+': no preset');continue;}
  const d=X.derive(X.SPECS[id]),bad=Object.keys(o).filter(k=>JSON.stringify(!!o[k]===o[k]?!!C[k]:C[k])!==JSON.stringify(o[k]));
  check(C.speed===d.speed&&C.accel===d.accel&&C.turn===d.turn,id+': speed '+C.speed+' accel '+C.accel+' turn '+C.turn+' off derive ('+d.mode+', '+d.length+' m)');
  check(Math.abs(C.mass-Math.pow(C.size,3))<0.01,id+': the contact mass is size cubed, as for any creature ('+C.mass.toFixed(2)+')');
  check(!bad.length,id+': the numbers derive has no term for come from the preset'+(bad.length?' — '+bad.map(k=>k+' '+JSON.stringify(C[k])).join(', '):''));
  check(C.spec===X.SPECS[id],id+': built from SPECS.'+id);}
{const locked=Object.keys(X.SPECS).filter(k=>X.SPECS[k].stats);check(!locked.length,'no species ships with a lock'+(locked.length?': '+locked.join(', '):' ('+Object.keys(X.SPECS).length+' specs)'));
  const hand=Object.keys(X.DEFS).filter(k=>X.SPECS[k]&&(X.DEFS[k].top!==X.derive(X.SPECS[k]).speed||X.DEFS[k].turn!==X.derive(X.SPECS[k]).turn||X.DEFS[k].accel!==X.derive(X.SPECS[k]).accel));
  check(!hand.length,'every kind in DEFS moves on the top speed, turn and accel derive gives'+(hand.length?' but '+hand.join(', '):''));
  const over=Object.keys(X.DEFS).filter(k=>X.DEFS[k].top&&(X.DEFS[k].speed>X.DEFS[k].top+0.01||(X.DEFS[k].flee&&X.DEFS[k].flee!==X.DEFS[k].top)));
  check(!over.length,'no kind goes about faster than its top speed, and what bolts bolts at it'+(over.length?' but '+over.join(', '):''));
  const lk=JSON.parse(JSON.stringify(X.SPECS.fin));lk.stats={speed:99};
  check(X.statsOf(lk).speed===X.derive(lk).speed&&X.playerClade(lk).speed===X.derive(lk).speed&&X.statsOf(lk,true).speed===99,'a lock is read only when asked for (the dev lab): the player ignores it');
  const big=JSON.parse(JSON.stringify(X.SPECS.ridge)),v=[1,3,6,12,24,56].map(k=>{big.s=X.SPECS.ridge.s*k;const d=X.derive(big);return d.length.toFixed(0)+' m '+d.speed;});
  big.s=X.SPECS.ridge.s*2.8;const a=X.derive(big);big.s=X.SPECS.ridge.s*56;const b=X.derive(big);
  check(Math.abs(a.speed/(X.derive(X.SPECS.ridge).speed*Math.pow(2.8,0.4))-1)<0.02&&b.speed<a.speed*2.2,'the ceiling: neutral at 30 m, flat past it ('+v.join(', ')+')');}
// ---- 2. a spec that is no preset: its numbers are derive's ----
const sick=JSON.parse(JSON.stringify(X.SPECS.sickle));sick.id='mine';
const Cs=X.playerClade(sick),st=X.statsOf(sick);
check(Cs.speed===st.speed&&Cs.turn===st.turn&&Cs.accel===st.accel&&Math.abs(Cs.mass-Math.pow(sick.size,3))<0.01,'a hingeshell spec: speed '+Cs.speed+' turn '+Cs.turn+' accel '+Cs.accel+' off derive, mass '+Cs.mass);
check(Cs.ability===null&&!Cs.venom,'a hingeshell has no preset ability and no venom (none of the presets is its clade)');
// ---- 3. the save: the spec on the record, back as it went; a version 1 record's clade id as its preset ----
X.startNew(Cs);X.saveRefresh();
const rec=X.saveList.find(r=>r.id===X.curSave.id);
check(rec&&rec.v===X.SAVE_V&&X.SAVE_V>=2&&rec.spec&&rec.spec.id==='mine','the record carries the spec (v '+(rec&&rec.v)+')');
X.startFrom(rec);
check(X.player.clade.spec.id==='mine'&&X.player.clade.speed===Cs.speed&&X.specToJSON(X.player.clade.spec)===X.specToJSON(sick),'continue builds the saved spec, speed '+X.player.clade.speed);
const r1=JSON.parse(JSON.stringify(rec));delete r1.spec;r1.v=1;r1.clade='coil';X.startFrom(r1);
check(X.player.clade===X.CLADES.find(c=>c.id==='coil'),'a version 1 record (clade id only) loads as its preset');
const r2=JSON.parse(JSON.stringify(rec));r2.spec={clade:'ringmouths',core:{kind:'nothing'},parts:[]};r2.clade='soft';X.startFrom(r2);
check(X.player.clade===X.CLADES.find(c=>c.id==='soft'),'a spec that no longer compiles falls back to the preset its clade id names');
const f=X.CLADES.find(c=>c.id==='fin');X.startNew(f);X.saveRefresh();const rf=X.saveList.find(r=>r.id===X.curSave.id);X.startFrom(rf);
const Cf=X.player.clade;check(['speed','accel','turn','mass','bite','cam','sprint','size'].every(k=>Cf[k]===f[k])&&Cf.name==='finback','the finback round trip plays on the same numbers ('+Cf.name+')');
// ---- 4. the line (v11.69, LINEAGE.md §13.1–2): lay, hatch, die, continue as the child; an unhatched clutch runs the world on to its hatch; no child ends the save ----
{const L=global.__line,P=X.player,fin=X.CLADES.find(c=>c.id==='fin'),floor=()=>{const h=L.groundAt(P.pos.x,P.pos.z);P.pos.y=h+1.5;P.vel.set(0,0,0);P.sub=1;};
  X.startNew(fin);floor();const t0=L.t;
  check(L.lay()===true&&L.eggs().some(g=>g.brood),'the finback lays a clutch on the floor ('+L.cur().broods[0].n+' eggs, hatch in '+((L.cur().broods[0].hatch-t0)/L.DAY_S).toFixed(2)+' game days)');
  check(L.lay()===false,'a second clutch at once is refused (the cooldown, LINE.cool '+L.LINE.cool+' game days)');
  const b0=L.cur().broods[0];L.die('the test: only a clutch');
  const l1=L.line();
  check(X.mode==='play'&&!P.dead&&l1.length===2&&l1[1].parent===0&&l1[0].died!==null,'dead with only an unhatched clutch: you continue as its child (gen '+l1.length+', the parent\'s death "'+l1[0].cause+'")');
  check(L.t>=b0.hatch&&Math.hypot(P.pos.x-b0.pos[0],P.pos.z-b0.pos[2])<3,'the world ran on '+((L.t-t0)/L.DAY_S).toFixed(2)+' game days to the hatch, and you are at the clutch');
  check(P.clade.juv>0&&P.clade.size<fin.size,'a hatchling: '+P.clade.size.toFixed(2)+' m against the adult\'s '+fin.size+', speed '+P.clade.speed.toFixed(1));
  check(L.live(b0)===Math.round(b0.n)&&L.live(b0)>=1,'its siblings hatched round it: '+L.live(b0)+' young of the line in the world');
  check(L.lay()===false,'a hatchling cannot lay');
  L.setT(L.cur().grown+1);__step(3);check(!P.clade.juv&&P.clade.size===fin.size,'grown at its time: the adult body ('+P.clade.size+' m)');
  floor();check(L.lay()===true,'the child lays its own clutch');
  const b1=L.cur().broods[0];b1._egg.t=0.01;__step(3);
  check(b1.hatched&&L.live(b1)>=1,'the clutch hatches: '+L.live(b1)+' young, juveniles '+L.young(b1).filter(c=>c.def.juv).length);
  const ys=L.young(b1);let near=null,nd=1e9;for(const c of ys){const d=c.pos.distanceTo(P.pos);if(d<nd){nd=d;near=c;}}const np=near.pos.clone(),n1=ys.length;
  L.die('the test: young alive');
  check(L.line().length===3&&Math.hypot(P.pos.x-np.x,P.pos.z-np.z)<0.5&&L.live(b1)===n1-1,'dead with young alive: you continue as the nearest, where it was ('+nd.toFixed(1)+' m off), its siblings '+n1+' → '+L.live(b1));
  check(L.line()[2].parent===1&&L.line()[1].broods.length===1&&L.line()[2].broods.length===0,'the line: founder, child, grandchild — each life its own broods');
  L.tick(5);L.tick(5);L.tick(5);const tr=L.cur().track,q=tr[tr.length-1];
  check(q&&q[3]>=2,'the track: still for three samples, one run ('+JSON.stringify(q)+')');
  const id=X.curSave.id;L.die('the test: no young');
  X.saveRefresh();const rec=X.saveList.find(r=>r.id===id);
  check(X.mode==='menu'&&!X.curSave&&rec&&rec.over===true&&rec.line.length===3,'dead with no child: the save is over, the slot written ended with its line of '+(rec&&rec.line.length));
  check(X.startFrom(rec)===false&&X.mode==='menu','an ended slot cannot be continued');
  // an unloaded brood falls by BROOD_SURVIVE a game day; the line through the save
  X.startNew(fin);floor();L.lay();const b2=L.cur().broods[0];L.clear();L.setT(b2.at+L.DAY_S);const cs=L.children();
  check(cs.length===1&&b2.hatched&&Math.abs(b2.n-L.LINE.n*L.BROOD_SURVIVE)<0.01,'a brood unloaded for a game day: hatched by the clock, '+L.LINE.n+' → '+b2.n.toFixed(2));
  L.cells();X.saveNow();X.saveRefresh();const r2=X.saveList.find(r=>r.id===X.curSave.id);
  check(r2&&r2.v===3&&r2.line[0].broods.length===1&&!('_ch' in r2.line[0].broods[0]),'the line in the save (v '+(r2&&r2.v)+'), the broods without their runtime links');
  X.startFrom(r2);check(L.line()[0].broods[0].hatched&&L.live(L.line()[0].broods[0])===Math.round(r2.line[0].broods[0].n),'continued: the brood back as '+L.live(L.line()[0].broods[0])+' young at its clutch');
}
console.log(fails?'player: '+fails+' FAILED':'player: all ok');
process.exit(fails?1:0);
