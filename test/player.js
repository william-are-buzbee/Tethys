// Headless check of the player as a spec (v11.68; v11.71: one calculator): the three presets' speed, accel and turn are derive's and no species
// ships with a lock, every DEFS kind moves on derive's numbers, the ceiling is neutral at 30 m, a spec that is no preset takes its numbers from derive, the save carries the spec (SAVE_V 2) and a version 1 record's
// clade id loads as its preset. §4–6 the line, the editor at conception and the stomach; §7 (v11.74) the ringmouths' modes: the soft-arm spawns once, broods, guards
// and strays, does not feed, wastes, dies at the hatch and continues as a hatchling, dies of age unspawned; the coilshell lays again and again; the stem's cap on the lobes.
// Same bundle and stub as the smoke test. TIER=low runs the low tier.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const ORDER=fs.readFileSync(path.join(ROOT,'src','order.txt'),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&s[0]!=='#');
let js=ORDER.map(n=>fs.readFileSync(path.join(ROOT,'src',n+'.js'),'utf8')).join('\n');
js+='\nglobal.__pl={CLADES,SPECS,DEFS,derive,statsOf,playerClade,player,startNew,startFrom,saveNow,saveRefresh,get saveList(){return saveList;},get curSave(){return curSave;},get mode(){return mode;},SAVE_V,specToJSON,founderClade,founderList,founderOf,abilitiesOf,lineKind,keys,CAM_BODY,DERIVE_K,PROFILE,seeSpec};';
js+='\nglobal.__line={get t(){return t;},setT(v){t=v;clockH=t*CLOCK_RATE;},DAY_S,LINE,BREED,MOULT_P,MOULT,kindOf:()=>lineKind(player.clade.spec),moultAt:(n)=>moultAt(lineCur(),n),moultN:(v)=>moultN(lineCur(),v),scale:()=>lineScale(lineCur()),soft:()=>lineSoft(lineCur()),sheds:()=>sheds,denAt:(x,z)=>{const ch=chunkAt(x,z),h=groundAt(x,z);return !!ch&&denAt(V3(x,h,z),ch,BREED.hingeshells.den);},solidNear:(x,z,r)=>{const ch=chunkAt(x,z),h=groundAt(x,z);return !!ch&&!!solidPush(V3(x,h+0.6,z),r,null,ch,true);},shel:(x,z)=>{const ch=chunkAt(x,z);return ch?ch.f(x,z)[FI.shel]:-1;},breed:()=>lifeBreed(lineCur()),brooding:()=>lineBrooding(),guarded:(b)=>broodGuarded(b),lifeS:()=>lifeS(lineCur()),hint:()=>hintEl.textContent,findCarcass:(c,R)=>findCarcass(c,R),groundAt,lay:()=>playerLay()&&conceiveClose(true),eggs:()=>eggs,cur:()=>lineCur(),line:()=>curSave?curSave.line:null,die:(c)=>die(c),live:(b)=>broodLive(b),young:(b)=>creatures.filter(c=>c.alive&&c.brood===b),tick:(dt)=>lineTick(dt),children:()=>lineChildren(),clear:()=>worldClear(),cells:()=>cellsAround()};';
js+='\nglobal.__cb={coverAt,thruOf,MOULT,sheds,softPrey,findPrey,spawn,chunkAt,solidPush,V3,creatures,FI,groundAt};';
js+='\nglobal.__cv={lab,open:()=>playerLay(),close:(d)=>conceiveClose(d),build:()=>labBuild(),load:(sp)=>labLoad(sp),price:(a,b)=>conceivePrice(a,b),budget:(g)=>conceiveBudget(g),BUDGET,paramOf,frame:(sp)=>compileFrame(sp),spark:()=>spark,gone:()=>playerGone(),hunter:(kind,dx)=>{const p=V3(player.pos.x+dx,player.pos.y+1,player.pos.z),c=spawn(chunkAt(p.x,p.z),kind,p,mulberry(11),{ent:-1});c.hunger=1;return c;},noSpark:()=>{spark=null;},bite:()=>{player.biteCD=0;playerBite();},put:(kind,dx,dz)=>{const p=V3(player.pos.x+dx,player.pos.y,player.pos.z+dz);return spawn(chunkAt(p.x,p.z),kind,p,mulberry(12),{ent:-1});},kill:(c,by)=>kill(c,by),eco:(k)=>ecoOf(k),K:()=>eaterK(player),carc:()=>carcasses,tick:(dt)=>hungerTick(player,dt),EAT,STARVE_T,ECO,cost:(s)=>clutchCost(s),fuel:(s)=>clutchHunger(s),hline:()=>hungerLine()};';
const tmp=path.join(require('os').tmpdir(),'tethys_player.js');
fs.writeFileSync(tmp,'(function(){"use strict";\n'+js+'\n})();');
require('./stub.js');require(tmp);
const X=global.__pl;let fails=0;
function check(ok,msg){if(!ok){fails++;console.error('  FAIL '+msg);}else console.log('  ok   '+msg);}
// ---- 1. the presets (v11.71): speed, accel and turn are derive's, as every animal's; the contact mass is the creatures' rule; the fixed few are the preset's ----
const FIXED={soft:{jet:true,jetImp:10,cam:6.5,size:1.6,sprint:undefined,venom:undefined,ability:'ink'},fin:{sprint:1.75,cam:7.5,size:1.8,jet:false,jetImp:undefined,venom:undefined,ability:'stun'},
  coil:{jet:true,jetImp:7,cam:6.3,size:1.5,sprint:undefined,venom:{kind:'paralyse',t:5,against:{slowbloods:1,ringmouths:1}},ability:'withdraw'}}; // v11.75: the numbers are the build's and the founder's row (player.js): the jet's kick and the sprint derive's terms, the arm the body's length (the coilshell's 6.5 is 6.3), the venom DEFS.coil's, the ability its parts'
for(const id in FIXED){const C=X.CLADES.find(c=>c.id===id),o=FIXED[id];if(!C){check(false,id+': no preset');continue;}
  const d=X.derive(X.SPECS[id]),bad=Object.keys(o).filter(k=>JSON.stringify(!!o[k]===o[k]?!!C[k]:C[k])!==JSON.stringify(o[k]));
  check(C.speed===d.speed&&C.accel===d.accel&&C.turn===d.turn,id+': speed '+C.speed+' accel '+C.accel+' turn '+C.turn+' off derive ('+d.mode+', '+d.length+' m)');
  check(Math.abs(C.mass-d.mass*1000)<1,id+': the contact mass is derive\'s, in kilograms, as for any creature (v11.91; '+C.mass.toFixed(0)+' kg)');
  check(!bad.length,id+': the jet\'s kick, the sprint, the arm, the venom and the ability as v11.74 had them, off the build and the row (v11.75)'+(bad.length?' — '+bad.map(k=>k+' '+JSON.stringify(C[k])).join(', '):''));
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
check(Cs.speed===st.speed&&Cs.turn===st.turn&&Cs.accel===st.accel&&Math.abs(Cs.mass-st.mass*1000)<1,'a hingeshell spec: speed '+Cs.speed+' turn '+Cs.turn+' accel '+Cs.accel+' off derive, mass '+Cs.mass);
check(Cs.ability==='shut'&&!Cs.venom&&Cs.abilities.join()==='shut','the sickle\'s parts give it the valves\' shut and nothing else, and its row no venom (v11.75)');
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
// ---- 4. the line (v11.69, LINEAGE.md §13.1–2): lay, hatch, die, continue as the child; an unhatched clutch runs the world on to its hatch; no child ends the save (v11.72: x opens the editor at conception; here every laying is declined, a copy) ----
{const L=global.__line,P=X.player,fin=X.CLADES.find(c=>c.id==='fin'),floor=()=>{const h=L.groundAt(P.pos.x,P.pos.z);P.pos.y=h+1.5;P.vel.set(0,0,0);P.sub=1;};
  X.startNew(fin);floor();const t0=L.t;
  check(L.lay()===true&&L.eggs().some(g=>g.brood),'the finback lays a clutch on the floor ('+L.cur().broods[0].n+' eggs, hatch in '+((L.cur().broods[0].hatch-t0)/L.DAY_S).toFixed(2)+' game days)');
  check(L.lay()===false&&P.hunger>global.__cv.ECO.hungry,'a second clutch at once is refused: the first took '+P.hunger.toFixed(2)+' of the stomach and laying hungry (past '+global.__cv.ECO.hungry+') is refused (v11.73)');
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
  check(cs.length===1&&b2.hatched&&Math.abs(b2.n-L.breed().n*L.breed().survive)<0.01,'a brood unloaded for a game day: hatched by the clock, '+L.breed().n+' → '+b2.n.toFixed(2));
  L.cells();X.saveNow();X.saveRefresh();const r2=X.saveList.find(r=>r.id===X.curSave.id);
  check(r2&&r2.v===3&&r2.line[0].broods.length===1&&!('_ch' in r2.line[0].broods[0]),'the line in the save (v '+(r2&&r2.v)+'), the broods without their runtime links');
  X.startFrom(r2);check(L.line()[0].broods[0].hatched&&L.live(L.line()[0].broods[0])===Math.round(r2.line[0].broods[0].n),'continued: the brood back as '+L.live(L.line()[0].broods[0])+' young at its clutch');
}
// ---- 5. the editor at conception (v11.72, LINEAGE §13.4): declined, edited within the budget, refused over it, the child on its own derived numbers ----
{const L=global.__line,V=global.__cv,P=X.player,fin=X.CLADES.find(c=>c.id==='fin'),floor=()=>{const h=L.groundAt(P.pos.x,P.pos.z);P.pos.y=h+1.5;P.vel.set(0,0,0);P.sub=1;};
  const wait=()=>{P.hunger=0;P.starveT=0;},tailOf=s=>s.parts.find(p=>p.kind==='tail'); // v11.73: a fed stomach where the cooldown was
  X.startNew(fin);floor();V.noSpark();const par=X.specToJSON(L.cur().spec);
  check(V.open()===true&&X.mode==='lab'&&!!V.lab.conceive&&V.lab.player===true&&L.cur().broods.length===0,'x opens the lab as the creator on the parent\'s spec; nothing is laid while the window is open');
  check(V.lab.conceive.budget===V.budget(1)&&V.budget(3)>V.budget(1),'the budget grows with the generation: '+V.budget(1)+' for the founder\'s child, '+V.budget(3)+' for the third life\'s, '+V.budget(10)+' for the tenth\'s');
  const before=X.specToJSON(V.lab.spec);V.load(X.SPECS.soft);
  check(X.specToJSON(V.lab.spec)===before&&V.lab.spec.clade==='slowbloods','another clade cannot be loaded at conception (a child never changes clade)');
  V.build();check(V.close(false)===true&&X.mode==='play','closing the window unchanged lays the clutch');
  let b=L.cur().broods[0];
  check(b&&X.specToJSON(b.spec)===par&&b.price===0&&b.gen===2&&!V.spark(),'declined: the clutch is a copy, generation '+(b&&b.gen)+', no sparkle');
  check(V.open()===false&&X.mode==='play'&&P.hunger>V.ECO.hungry,'after a conception the stomach is down by the eggs ('+P.hunger.toFixed(2)+') and laying hungry is refused');
  // edited, within the budget: the tail's lobes taller by 0.6 of their believable band
  wait();floor();V.open();let tl=tailOf(V.lab.spec),q=V.paramOf('tail','lh',tailOf(V.lab.v),V.frame(V.lab.v));tl.lh=+(tailOf(V.lab.v).lh+0.6*(q.b1-q.b0)).toFixed(3);V.build();
  const pr=V.price(V.lab.conceive.parent,V.lab.v);
  check(pr.total>0.3&&pr.total<=V.lab.conceive.budget&&pr.items[0].what.indexOf('tail')===0,'a longer tail is priced off its band: '+pr.total+' of '+V.lab.conceive.budget+' ('+pr.items.map(i=>i.what+' '+i.cost).join(', ')+')');
  check(V.close(false)===true&&X.mode==='play','within the budget the lab commits');
  b=L.cur().broods[1];const kid=b&&b.spec,dk=X.derive(kid),dp=X.derive(JSON.parse(par));
  check(b&&X.specToJSON(kid)!==par&&tailOf(kid).lh===tl.lh&&b.price===pr.total&&kid.clade==='slowbloods'&&!!V.spark(),'the clutch carries the child\'s spec ('+kid.id+', tail '+tailOf(JSON.parse(par)).lh+' → '+tailOf(kid).lh+'), and the sparkle plays');
  check(dk.speed!==dp.speed&&dk.mass!==dp.mass,'the child\'s body derives its own numbers: speed '+dp.speed+' → '+dk.speed+', mass '+dp.mass+' → '+dk.mass+' (v11.73: a lobe weighs and drags)');
  check(Math.abs(b.fuel-L.breed().egg*L.breed().n*dk.mass)<1e-3&&Math.abs(P.hunger-b.fuel/V.K().meal)<0.01,'the clutch cost the child\'s mass × '+L.breed().n+' eggs × LINE.egg '+L.breed().egg+' = '+b.fuel+' t, '+P.hunger.toFixed(2)+' of the stomach (v11.73)');
  // refused over the budget: four times the scale is 8 points against 3
  wait();floor();V.open();V.lab.spec.s=(V.lab.spec.s||1)*4;V.build();const n0=L.cur().broods.length;
  check(V.close(false)===false&&X.mode==='lab'&&L.cur().broods.length===n0,'over the budget the lab will not commit ('+V.price(V.lab.conceive.parent,V.lab.v).total+' of '+V.lab.conceive.budget+') and nothing is laid');
  check(V.close(true)===true&&X.mode==='play'&&X.specToJSON(L.cur().broods[n0].spec)===par,'declined from there: a copy is laid');
  // the child after the handover: a new line with only the edited clutch, the parent dead
  X.startNew(fin);floor();V.open();tailOf(V.lab.spec).ll=tl.lh;V.build();V.close(false);const kid2=L.cur().broods[0].spec;
  L.die('the test: an edited clutch');const C2=P.clade;
  check(X.mode==='play'&&!P.dead&&L.line().length===2&&X.specToJSON(C2.spec)===X.specToJSON(kid2),'dead with an edited clutch: you continue as the child you shaped ('+C2.spec.id+')');
  L.setT(L.cur().grown+1);__step(3);const C3=P.clade,d3=X.derive(kid2);
  check(!C3.juv&&C3.speed===d3.speed&&C3.turn===d3.turn&&C3.accel===d3.accel&&C3.speed!==fin.speed,'grown, it plays on its own derived numbers: speed '+C3.speed+' (the parent '+fin.speed+'), accel '+C3.accel+', turn '+C3.turn);
  // v11.72.1: out of the world while the window is open — a hungry eel 7 m off neither sees nor takes the parent; back in the world on the close, it does
  floor();L.setT(L.cur().grown+2);const eel=V.hunter('eel',7);V.open();__step(180);
  check(V.gone()&&P.g.visible===false&&eel.target!==P&&!P.hold&&!(P.bleed>0),'the window open: the parent is hidden and a hungry eel 7 m off leaves it alone for 3 s (its target: '+(eel.target?(eel.target===P?'the player':eel.target.kind):'none')+')');
  V.close(true);const vis=P.g.visible;let took=false;for(let i=0;i<40&&!took;i++){eel.pos.set(P.pos.x+7,P.pos.y+1,P.pos.z);eel.hunger=1;eel.state='wander';eel.cool=0;eel.target=null;__step(15);took=eel.target===P;} // v11.86: the cooldown a lost chase leaves (dropTarget) and a stray target cleared each try — the check failed once on the world's own creatures drifting past the spawn
  check(!V.gone()&&vis===true&&took,'the window closed: the body is back, and the eel takes it as prey');eel.alive&&(eel.target=null);L.setT(L.t+L.DAY_S);wait();
  floor();V.open();check(V.lab.conceive&&V.lab.conceive.gen===2&&V.lab.conceive.budget===V.budget(2)&&X.specToJSON(V.lab.conceive.parent)===X.specToJSON(kid2),'and its own conception starts from its spec with generation 2\'s budget ('+V.budget(2)+')');V.close(true);
}
// ---- 6. the stomach (v11.73, LINEAGE §6's fuel half): fed by a gulp, a kill and a carcass on the ledger's numbers; starved to death with a child and with none; a clutch refused for want of reserves and one afforded; a child twice the mass costs twice ----
{const L=global.__line,V=global.__cv,P=X.player,fin=X.CLADES.find(c=>c.id==='fin'),floor=()=>{const h=L.groundAt(P.pos.x,P.pos.z);P.pos.y=h+1.5;P.vel.set(0,0,0);P.sub=1;};
  const wait=()=>{P.hunger=0;P.starveT=0;};X.startNew(fin);floor();const K=V.K(),Kc=V.eco(Object.keys(X.DEFS).find(k=>k.indexOf('line:')===0&&X.DEFS[k].spec===P.clade.spec));
  check(K===Kc&&K.hunter&&K.cycle>0.5&&K.cycle<1&&K.meal>0.1&&K.meal<0.2,'the player runs on its line kind\'s numbers: cycle '+K.cycle.toFixed(2)+' game days, need '+(K.need*1000).toFixed(0)+' kg a day, meal '+(K.meal*1000).toFixed(0)+' kg');
  P.hunger=0;V.tick(K.cycle*L.DAY_S*0.5);check(Math.abs(P.hunger-0.5)<1e-6,'the clock: half a cycle of play is hunger 0.50');
  check(V.hline().indexOf('hunger 0.50 hungry')===0,'the readout\'s line: "'+V.hline()+'"');
  // a gulp: an arrow at the mouth, the bite
  P.hunger=0.8;const ar=V.put('arrow',0,0.8),fa=V.eco('arrow').food;V.bite();
  check(!ar.alive&&Math.abs(P.hunger-Math.max(0,0.8-fa/K.meal))<1e-6,'a gulp: an arrow ('+fa+' t of food over a '+(K.meal*1000).toFixed(0)+' kg meal) takes hunger 0.80 → '+P.hunger.toFixed(2));
  // a kill: the placed act's kill(c, player) — a picker is a carcass (too big to swallow), and the killer is fed by its food
  P.hunger=1;P.starveT=50;const pk=V.put('picker',0,3);V.kill(pk,P);
  check(!pk.alive&&pk.dead&&Math.abs(P.hunger-Math.max(0,1-V.eco('picker').food/K.meal))<1e-6&&P.starveT===0,'a kill: a picker ('+V.eco('picker').food+' t) fills it from starving and the starving clock resets');
  // a carcass: a mouthful is EAT.bite seconds of the world's feeding rate (creatures_ai.js eatAt)
  P.hunger=1;const c0=pk.flesh,rate=Math.min(pk.flesh/pk.flesh*Math.pow(pk.def.size,3)/75,K.meal/20)*V.EAT.bite;pk.pos.set(P.pos.x+0.4,P.pos.y,P.pos.z+0.8);pk.g.position.copy(pk.pos);V.bite();
  check(Math.abs(c0-pk.flesh-rate)<1e-6&&Math.abs(P.hunger-(1-rate/K.meal))<1e-6,'a carcass: one bite is '+(rate*1000).toFixed(1)+' kg off the body and '+(rate/K.meal).toFixed(3)+' off hunger — '+Math.ceil(K.meal/rate)+' bites fill it');
  for(let i=0;i<40;i++)V.bite();check(P.hunger===0,'forty bites: fed');
  // a poisoned carcass sickens instead of feeding
  P.hunger=1;pk.poison=1;P.sickT=0;V.bite();check(P.sickT>0&&P.hunger===1,'a body fed at the seeps: sick, and no meal');pk.poison=0;P.sickT=0;
  // the stomach through the save
  P.hunger=0.37;P.starveT=0;X.saveNow();X.saveRefresh();const rs=X.saveList.find(r=>r.id===X.curSave.id);X.startFrom(rs);
  check(Math.abs(P.hunger-0.37)<1e-6,'the stomach through the save: '+P.hunger);
  // starved with only a clutch: a death like any other — the world runs on to the hatch, and the hatchling is fed
  floor();wait();V.noSpark();V.open();V.close(true);const b0=L.cur().broods[0];
  P.hunger=1;P.starveT=K.cycle*L.DAY_S*V.STARVE_T;const dead=V.tick(0.5);
  check(dead===true&&X.mode==='play'&&!P.dead&&L.line().length===2&&L.line()[0].cause==='starved'&&L.t>=b0.hatch&&P.hunger===0,'starved with only a clutch: the parent\'s death is "'+L.line()[0].cause+'", you continue as its child, fed');
  // starved with none: the save is over
  const id=X.curSave.id;L.setT(L.cur().grown+1);__step(3);P.hunger=1;P.starveT=K.cycle*L.DAY_S*V.STARVE_T;V.tick(0.5);X.saveRefresh();const ro=X.saveList.find(r=>r.id===id);
  check(X.mode==='menu'&&ro&&ro.over===true&&ro.deaths[ro.deaths.length-1].cause==='starved','starved with no child: the save is over, the cause written');
  // the clutch's price: refused hungry, refused for a child the stomach cannot hold, afforded fed; a child of twice the mass costs twice
  X.startNew(fin);floor();V.noSpark();const par=L.cur().spec,cp=V.cost(par),fp=V.fuel(par);
  P.hunger=V.ECO.hungry+0.05;check(V.open()===false&&X.mode==='play','laying at hunger '+P.hunger.toFixed(2)+' is refused (hungry)');
  P.hunger=0.3;check(V.open()===true&&X.mode==='lab','at 0.30 the window opens (a copy costs '+fp.toFixed(2)+' of the stomach)');
  V.lab.spec.s=(V.lab.spec.s||1)*Math.cbrt(2);V.build();const kid=JSON.parse(X.specToJSON(V.lab.v)),ck=V.cost(kid),n0=L.cur().broods.length;
  check(Math.abs(ck/cp-2)<0.02&&V.price(par,kid).total<=V.lab.conceive.budget,'a child of twice the mass ('+X.derive(kid).mass+' t against '+X.derive(par).mass+') costs twice: '+ck.toFixed(3)+' t against '+cp.toFixed(3)+' (within the budget, '+V.price(par,kid).total.toFixed(2)+')');
  check(V.close(false)===false&&X.mode==='lab'&&L.cur().broods.length===n0,'at 0.30 it is refused: '+V.fuel(kid).toFixed(2)+' of the stomach wanted, '+(1-P.hunger).toFixed(2)+' in it; nothing laid');
  P.hunger=0.02;check(V.close(false)===true&&X.mode==='play'&&L.cur().broods.length===n0+1&&Math.abs(L.cur().broods[n0].fuel-ck)<1e-3&&Math.abs(P.hunger-(0.02+ck/K.meal))<1e-6,'at 0.02 it is afforded: the clutch cost '+L.cur().broods[n0].fuel+' t and the stomach is at '+P.hunger.toFixed(2));
  P.hunger=0.3;floor();check(V.open()===true&&V.close(true)===true&&Math.abs(P.hunger-(0.3+fp))<1e-6,'a copy at 0.30 is afforded: '+P.hunger.toFixed(2)+' after');
}
// ---- 7. the ringmouths (v11.74, LINEAGE §3, §12.26–28): the mode off the body; the soft-arm spawns once, broods (no feeding, the losses off it, the wasting), guards and strays, dies at the hatch and continues as a hatchling, killed brooding the clutch stands, dies of age unspawned with no child; the coilshell lays again and again; the stem's cap ----
{const L=global.__line,V=global.__cv,P=X.player,soft=X.CLADES.find(c=>c.id==='soft'),coil=X.CLADES.find(c=>c.id==='coil'),floor=()=>{const h=L.groundAt(P.pos.x,P.pos.z);P.pos.y=h+1.5;P.vel.set(0,0,0);P.sub=1;},wait=()=>{P.hunger=0;P.starveT=0;};
  X.startNew(soft);floor();V.noSpark();const m=L.breed(),K=V.K();
  check(m===L.BREED.soft&&m.once===true&&m.n>=20&&m.egg<0.005,'the soft-arm\'s mode is read off its body — soft: '+m.n+' eggs at '+m.egg+' of the child\'s mass, once, a life of '+m.life+' × mass^¼ days');
  check(Math.abs(V.fuel(soft.spec)-m.egg*m.n*X.derive(soft.spec).mass/K.meal)<1e-6&&V.fuel(soft.spec)>0.5&&V.fuel(soft.spec)<0.8,'its one clutch costs '+(V.cost(soft.spec)*1000).toFixed(0)+' kg, '+V.fuel(soft.spec).toFixed(2)+' of its '+(K.meal*1000).toFixed(0)+' kg stomach');
  const age0=(L.t-L.cur().born)/L.DAY_S,span=L.lifeS()/L.DAY_S,grow=V.eco(Object.keys(X.DEFS).find(k=>k.indexOf('line:')===0&&X.DEFS[k].spec===P.clade.spec)).grow;
  check(Math.abs(age0-grow)<1e-6&&span>4&&span<7&&Math.abs(span-m.life*Math.pow(K.mass,0.25))<1e-6,'the founder is an adult hatched a growth ago: age '+age0.toFixed(2)+' d of a span of '+span.toFixed(2)+' ('+m.life+' × mass^¼)');
  check(V.hline().indexOf('  age '+age0.toFixed(2)+' d of '+span.toFixed(2))>0,'the readout has the age: "'+V.hline().split('  ').find(q=>q.indexOf('age')===0)+'"');
  const hatchD=(t=>t)((X.derive(soft.spec),V.ECO.hatch*Math.pow(K.mass,0.25)*(m.hatchK||1))),starveD=(1-V.ECO.hungry+V.STARVE_T)*K.cycle;
  check(hatchD<starveD,'the brood ('+hatchD.toFixed(2)+' d) is inside the starvation clock from a laying at hunger '+V.ECO.hungry+' ('+starveD.toFixed(2)+' d): the parent lives to the hatch');
  // spawns once
  P.hunger=0.1;check(L.lay()===true&&L.cur().broods.length===1&&L.cur().broods[0].n===m.n&&Math.abs(P.hunger-0.1-V.fuel(soft.spec))<1e-6&&L.hint().indexOf('the clutch: '+m.n+' eggs')===0,'grown and fed, it lays its clutch of '+L.cur().broods[0].n+' (the stomach at '+P.hunger.toFixed(2)+'; the hint "'+L.hint()+'")');
  const b=L.cur().broods[0];
  check(L.lay()===false&&L.hint()==='brooding'&&L.brooding()===b,'and not twice: "'+L.hint()+'"');
  // does not feed
  P.hunger=0.8;const ar=V.put('arrow',0,0.8);V.bite();
  check(!ar.alive&&P.hunger===0.8,'a brooding body kills and is not fed: an arrow bitten, the stomach stays at 0.80');
  // guards: the parent on the clutch, a scuttle 10 m off finds no carcass in it and walks its wander; the parent 40 m off, the scuttle takes the clutch and eats it down
  P.pos.set(b.pos[0],b.pos[1]+1.5,b.pos[2]);const sc=V.put('scuttle',10,0);sc.hunger=1;sc.pos.set(b.pos[0]+10,b.pos[1]+0.5,b.pos[2]);sc.home.copy(sc.pos);
  check(L.guarded(b)===true&&L.findCarcass(sc,30)===null,'the parent on the clutch guards it (within '+m.guard+' m): the scuttle\'s smell finds no carcass in it');
  __step(60);check(L.guarded(b)&&sc.scav!==b._egg&&b._egg.flesh===b._egg.flesh0&&b.n===m.n,'a second of the world: the scuttle does not go to it, the clutch whole ('+b.n+' eggs)');
  P.pos.set(b.pos[0]+40,b.pos[1]+1.5,b.pos[2]);floor();sc.pos.set(b.pos[0]+10,b.pos[1]+0.5,b.pos[2]);
  check(L.guarded(b)===false&&L.findCarcass(sc,30)===b._egg,'the parent 40 m off: strayed, and the scuttle smells the clutch');
  const f0=b._egg.flesh;let ate=false;for(let i=0;i<40&&!ate;i++){__step(30);ate=b._egg&&b._egg.flesh<f0;}
  check(ate&&sc.scav===b._egg,'and goes to it and eats: the clutch down to '+(b._egg.flesh/f0).toFixed(3)+' of itself, the scuttle '+((sc.pos.distanceTo(b._egg.pos)).toFixed(1))+' m');
  sc.alive&&V.kill(sc,null);
  // strays: the clock's losses off the loaded clutch while the parent is off it, none while it is on it
  const n0=b.n;L.tick(0.1*L.DAY_S);const n1=b.n;
  check(n1<n0&&Math.abs(n1/n0-Math.pow(m.survive,0.1))<1e-6&&b._egg.n===Math.round(n1),'a tenth of a day strayed: the clutch '+n0.toFixed(2)+' → '+n1.toFixed(2)+' (survive '+m.survive+' a day), the egg at '+b._egg.n);
  P.pos.set(b.pos[0],b.pos[1]+1.5,b.pos[2]);L.tick(0.1*L.DAY_S);check(b.n===n1,'a tenth of a day guarding: nothing lost');
  // wastes: the stomach past hungry is the way to death, the speed the calculator's off a live spec with less muscle, the body rebuilt gaunt
  P.hunger=0.1;L.tick(0.5);const g0=P.g;P.hunger=0.9;P.starveT=0;L.tick(0.5);const w1=P.waste,k1=P.speedK,live=P.live; // whole first: the strays test above ran at 0.8, already gaunt
  const full=X.derive(soft.spec),less=X.derive(Object.assign(JSON.parse(X.specToJSON(soft.spec)),{waste:w1}));
  check(w1>0.2&&w1<0.35&&live&&live.waste===w1&&Math.abs(k1-less.speed/full.speed)<1e-6&&k1<0.95,'at hunger 0.90 it is wasted '+w1.toFixed(2)+': speed × '+k1.toFixed(2)+' (derive '+full.speed+' → '+less.speed+' on the live spec)');
  check(P.g!==g0&&P.clade.spec===soft.spec&&P.hunger===0.9,'the body rebuilt gaunt (the spec still the adult\'s, the stomach kept)');
  check(V.hline().indexOf('brooding '+Math.round(b.n)+' eggs')>0&&V.hline().indexOf('guarded, wasted '+w1.toFixed(2)+' speed ×'+k1.toFixed(2))>0,'the readout: "'+V.hline().split('  ').find(q=>q.indexOf('brooding')===0)+'"');
  P.hunger=0.1;L.tick(0.5);check(P.waste===0&&P.speedK===1,'fed again (a test\'s stomach): whole');
  // killed while brooding: the clutch stands and hatches, and you are one of what hatches (v11.69's run-on)
  const t0=L.t;L.die('the test: killed brooding');
  check(X.mode==='play'&&!P.dead&&L.line().length===2&&L.line()[0].cause==='the test: killed brooding'&&L.t>=b.hatch&&P.clade.juv>0&&P.clade.id==='soft'&&Math.hypot(P.pos.x-b.pos[0],P.pos.z-b.pos[2])<3,'killed brooding: the world ran on '+((L.t-t0)/L.DAY_S).toFixed(2)+' d to the hatch and you are a hatchling at the clutch ('+P.clade.size.toFixed(2)+' m)');
  check(L.lay()===false&&L.hint()==='not yet grown','a hatchling cannot spawn');
  // dies at the hatch: the clutch hatches loaded, the parent is spent, the nearest child is a hatchling at the clutch among its siblings
  X.startNew(soft);floor();V.noSpark();P.hunger=0.1;L.lay();const b2=L.cur().broods[0];b2._egg.t=0.01;const id2=X.curSave.id;__step(3);
  check(b2.hatched&&L.line().length===2&&L.line()[0].cause==='spent'&&X.mode==='play'&&!P.dead&&P.clade.juv>0&&Math.hypot(P.pos.x-b2.pos[0],P.pos.z-b2.pos[2])<4,'the hatch: the parent\'s death is "'+L.line()[0].cause+'", you are a hatchling at the clutch');
  check(L.live(b2)===Math.round(b2.n)&&L.live(b2)>=m.n-2&&L.line()[1].parent===0,'its siblings round it: '+L.live(b2)+' young of the line (one is you)');
  check(L.brooding()===null&&L.breed()===m,'the child is not brooding, and is the same mode');
  // dies of age unspawned, with no child: the save is over
  X.startNew(soft);floor();const id3=X.curSave.id;L.setT(L.cur().born+L.lifeS()+1);L.tick(0.5);X.saveRefresh();const r3=X.saveList.find(r=>r.id===id3);
  check(X.mode==='menu'&&r3&&r3.over===true&&r3.deaths[r3.deaths.length-1].cause==='old'&&r3.line[0].cause==='old','old age unspawned: dead of "'+(r3&&r3.deaths[r3.deaths.length-1].cause)+'" at '+((r3.line[0].died-r3.line[0].born)/L.DAY_S).toFixed(2)+' d, no child, the save over');
  // the coilshell: the nautilus — lays again and again, like the finback, does not age, does not brood
  X.startNew(coil);floor();V.noSpark();const mc=L.breed(),Kc=V.K();
  check(mc===L.BREED.shelled&&!mc.once&&!mc.life&&X.derive(coil.spec).buoyancy==='floats','the coilshell\'s mode is read off its shell (it floats): shelled — '+mc.n+' eggs at '+mc.egg+', again and again, no age');
  check(V.fuel(coil.spec)>0.5&&V.fuel(coil.spec)<0.8,'a clutch costs '+(V.cost(coil.spec)*1000).toFixed(0)+' kg, '+V.fuel(coil.spec).toFixed(2)+' of its '+(Kc.meal*1000).toFixed(0)+' kg stomach');
  wait();check(L.lay()===true&&L.cur().broods.length===1&&L.brooding()===null&&L.hint()!=='brooding','it lays');
  wait();floor();check(L.lay()===true&&L.cur().broods.length===2&&L.cur().broods[1].n===mc.n,'and lays again: two clutches of '+mc.n);
  check(V.hline().indexOf(' of ')<0||V.hline().indexOf('age ')>0&&!/age [\d.]+ d of/.test(V.hline()),'the readout\'s age has no span (nothing else ages yet)');
  // the finback as before: a slowblood, its mode
  X.startNew(X.CLADES.find(c=>c.id==='fin'));check(L.breed()===L.BREED.slowbloods&&L.breed().n===4,'the finback is a slowblood: 4 eggs, again and again');
  // the stem's cap (DERIVE_K.stemM): v11.73's tall lobe held to the muscle that swings it; no roster kind capped
  const fin=JSON.parse(X.specToJSON(X.SPECS.fin)),tl=fin.parts.find(p=>p.kind==='tail'),d0=X.derive(fin);tl.lh=3.7;const d1=X.derive(fin);
  check(d1.plausible.some(q=>q.indexOf('outrun')>=0)&&d1.speed/d0.speed<1.35,'a lobe 3.7 m tall on the fin outruns its stem: '+d0.speed+' → '+d1.speed+' (×'+(d1.speed/d0.speed).toFixed(2)+'; +48% before the cap) — "'+d1.plausible.find(q=>q.indexOf('outrun')>=0)+'"');
  const capped=Object.keys(X.SPECS).filter(k=>X.derive(X.SPECS[k]).plausible.some(q=>q.indexOf('outrun')>=0));
  check(!capped.length,'no roster kind is capped'+(capped.length?': '+capped.join(', '):''));
}
// ---- 8. any species as the player (v11.75): the abilities off the parts, appearing and going with them; the founder's list by what is seen; a founder of each clade boots and swims; its line's young on its row ----
{const P=X.player,L=global.__line,copy=s=>JSON.parse(X.specToJSON(s));
  const fin=copy(X.SPECS.fin),tl=fin.parts.findIndex(p=>p.kind==='tail');check(X.abilitiesOf(fin).join()==='stun','the finback\'s tail is its stun');
  fin.parts.splice(tl,1);check(X.abilitiesOf(fin).join()==='','and without the tail it has nothing');fin.parts.push({kind:'tail',style:'stub'});check(X.abilitiesOf(fin).join()==='','a stub is no tail');
  const soft=copy(X.SPECS.soft);check(X.abilitiesOf(soft).join()==='ink','the soft-arm\'s mantle is its ink');soft.core={kind:'coilbody',R:0.46,beat:[2,1]};check(X.abilitiesOf(soft).join()==='','on a coiled body without a shell it has none');
  soft.parts.push({kind:'shell',style:'coil',R1:1.0});check(X.abilitiesOf(soft).join()==='withdraw','with a shell wide enough to hide in it withdraws');soft.parts[soft.parts.length-1].R1=0.3;check(X.abilitiesOf(soft).join()==='','a shell narrower than the body is no hiding place');
  const sick=copy(X.SPECS.sickle);check(X.abilitiesOf(sick).join()==='shut','the sickle\'s valves shut');sick.parts=sick.parts.filter(p=>p.kind!=='valves');check(X.abilitiesOf(sick).join()==='','without them, nothing');
  const ram=copy(X.SPECS.ram);check(X.abilitiesOf(ram).join()==='ram,shut'&&X.playerClade(ram).ability==='ram','the ram has the blow and the valves: '+X.abilitiesOf(ram).join(', ')+' — Q is the first');
  check(X.abilitiesOf(copy(X.SPECS.rasp)).join()==='withdraw'&&X.abilitiesOf(copy(X.SPECS.lurker)).join()===''&&X.abilitiesOf(copy(X.SPECS.darter)).join()==='stun','the rasp withdraws into its shell, the lurker (no shell) has nothing, a darter\'s tail is a stun');
  // the list: the roster's players first, and what has been seen; never a drifter
  const seen0=X.PROFILE.seen.sp.slice();X.PROFILE.seen.sp.length=0;let fl=X.founderList().map(r=>r.id);
  check(fl.join()==='soft,coil,fin','with nothing seen the founder\'s list is the three roster players ('+fl.join(', ')+')');
  X.seeSpec('hose');X.seeSpec('jelly');X.seeSpec('arrow');fl=X.founderList().map(r=>r.id);
  check(fl.indexOf('hose')>=0&&fl.indexOf('jelly')<0&&fl.length>=4,'seen species join it, a drifter never: '+fl.join(', '));
  X.PROFILE.seen.sp.length=0;for(const id of seen0)X.PROFILE.seen.sp.push(id);
  // the numbers: cam from the length, the kick from the speed, the sprint from the mode, the founder's row down the line
  for(const id of ['arrow','needle','hose']){const C=X.founderClade(id),d=X.derive(C.spec),fd=X.DEFS[id];
    check(C.spec.founder===id&&C.founder===id&&C.spec!==X.SPECS[id]&&C.name===id,id+': a founder copy that knows its species');
    check(C.cam===+(X.CAM_BODY.at+X.CAM_BODY.per*d.length).toFixed(1)&&(d.jet?C.jetImp===d.jetImp&&C.jetImp>0:C.jetImp===undefined)&&(d.burst>1?C.sprint===d.burst:C.sprint===undefined),id+': cam '+C.cam+' from '+d.length+' m, kick '+C.jetImp+', sprint '+C.sprint+' ('+d.mode+')');
    const k=X.lineKind(C.spec),ld=X.DEFS[k];
    check(ld.role===(fd.role==='boid'?'graze':fd.role)&&ld.prey.join()===fd.prey.filter(p=>p!=='player'&&X.DEFS[p]).join()&&ld.hp===fd.hp&&JSON.stringify(ld.venom)===JSON.stringify(fd.venom)&&ld.top===d.speed&&ld.reach===d.reach,id+'\'s young run its row on their own body: role '+ld.role+', prey '+ld.prey.join('+')+', hp '+ld.hp+', top '+ld.top);}
  // boots and swims, one founder a clade that was never a preset
  for(const id of ['arrow','needle','hose']){const C=X.founderClade(id);X.startNew(C);const p0=P.pos.clone();X.keys.KeyW=true;X.keys.ShiftLeft=true;__step(240);X.keys.KeyW=false;X.keys.ShiftLeft=false;
    check(X.mode==='play'&&!P.dead&&P.pos.distanceTo(p0)>20&&P.clade.spec.founder===id,'a new game as the '+id+' ('+C.spec.clade+'): four seconds of sprint took it '+P.pos.distanceTo(p0).toFixed(0)+' m, speed '+C.speed+(C.sprint?' × '+C.sprint:'')+(C.jetImp?', kick '+C.jetImp:''));}
  // the record: continue brings the founder back as itself
  X.saveRefresh();const rec=X.saveList.find(r=>r.id===X.curSave.id);X.startFrom(rec);check(P.clade.founder==='hose'&&P.clade.ability==='shut'&&P.clade.spec.founder==='hose','continued: the hose again, with its valves\' shut');
  // a grazer founder: no stomach on the model, a clutch costs nothing of it
  const gz=X.founderClade('grazer');X.startNew(gz);__step(30);check(P.hunger===0&&global.__cv.fuel(gz.spec)===0&&global.__cv.hline().indexOf('no stomach on the model')===0,'a grazer founder runs no hunger clock (the world\'s grazers have none) and its clutch takes nothing from a stomach the model has not got: "'+global.__cv.hline().slice(0,60)+'…"');
  // shut: the covering shell over everything while Q is held, the body still; soft (v11.76) is skin
  X.startNew(X.founderClade('lash'));const h=L.groundAt(P.pos.x,P.pos.z);P.pos.y=h+3;P.vel.set(0,0,0);__step(2);
  check(global.__cb.coverAt(P,0)==='plate'&&global.__cb.coverAt(P,1)==='plate','the lash\'s covering is plate (its valves are small)');
  X.keys.KeyQ=true;X.keys.KeyW=true;__step(30);check(P.shut===true&&global.__cb.coverAt(P,0)==='shell'&&P.vel.length()<0.5,'Q held: shut — shell to every edge, and still ('+P.vel.length().toFixed(2)+' m/s with w down)');
  X.keys.KeyQ=false;X.keys.KeyW=false;__step(2);check(P.shut===false&&global.__cb.coverAt(P,0)==='plate','Q up: open again');
  P.soft=true;check(global.__cb.coverAt(P,0)==='skin','soft: skin to every edge');P.soft=false;
}
// ---- 9. the hingeshells' line (v11.76, LINEAGE §3, §13.6): the mode; the den; guard and stray; the moult on the clock — soft, skin to every edge, prey to the big, the shed left, hardened; killed soft with a child alive and with none; growth through the moults ----
{const L=global.__line,V=global.__cv,P=X.player,CB=global.__cb,floor=()=>{const h=L.groundAt(P.pos.x,P.pos.z);P.pos.y=h+1.5;P.vel.set(0,0,0);P.sub=1;},wait=()=>{P.hunger=0;P.starveT=0;};
  const hose=X.founderClade('hose');X.startNew(hose);floor();V.noSpark();const m=L.breed(),K=V.K(),d=X.derive(hose.spec);
  check(m===L.BREED.hingeshells&&!m.once&&!m.life&&m.guard>0&&!!m.den,'a hingeshell\'s mode is read off its clade: '+m.n+' eggs at '+m.egg+' of the child\'s mass, again and again, at a den, guarded within '+m.guard+' m');
  check(Math.abs(V.fuel(hose.spec)-m.egg*m.n*d.mass/K.meal)<1e-6&&V.fuel(hose.spec)>0.5&&V.fuel(hose.spec)<0.8,'a clutch costs '+(V.cost(hose.spec)*1000).toFixed(0)+' kg, '+V.fuel(hose.spec).toFixed(2)+' of its '+(K.meal*1000).toFixed(0)+' kg stomach');
  // the den: a spot under water with a solid within reach but none on it, and one with neither shelter nor rock — searched over the loaded cells round the peak
  let den=null,open=null;for(let r=6;r<300&&!(den&&open);r+=2)for(let a=0;a<Math.PI*2&&!(den&&open);a+=0.25){const x=Math.round(Math.cos(a)*r),z=Math.round(Math.sin(a)*r),h=L.groundAt(x,z);if(h>-6||L.shel(x,z)<0||L.shel(x,z)>=m.den.shel||L.solidNear(x,z,0.6))continue;
    if(!den&&L.solidNear(x,z,0.6+m.den.solid))den=[x,z];else if(!open&&!L.solidNear(x,z,0.6+m.den.solid+3))open=[x,z];}
  check(!!den&&!!open,'two spots found round the peak: against rock at '+JSON.stringify(den)+', open water at '+JSON.stringify(open));
  if(den&&open){P.pos.set(open[0],0,open[1]);floor();wait();check(L.lay()===false&&L.hint().indexOf('at a den')===0,'in open water off the shelter the laying is refused: "'+L.hint()+'"');
    P.pos.set(den[0],0,den[1]);floor();check(L.denAt(den[0],den[1])===true&&L.lay()===true&&L.cur().broods.length===1&&L.cur().broods[0].n===m.n,'against rock it lays: a clutch of '+m.n+' at the den');
    const b=L.cur().broods[0];check(L.brooding()===null&&P.hunger>0&&V.hline().indexOf('clutches 1: 1 guarded')>0,'not brooding (it feeds on), the clutch guarded on the readout: "'+V.hline().split('  ').find(q=>q.indexOf('clutches')===0)+'"');
    P.hunger=0.8;const ar=V.put('darter',0,0.8);V.bite();check(!ar.alive&&P.hunger<0.8,'a hingeshell with a clutch still eats: a darter bitten feeds it (hunger 0.80 → '+P.hunger.toFixed(2)+')');
    const n0=b.n;L.tick(0.1*L.DAY_S);check(b.n===n0,'a tenth of a day on the den: nothing lost');
    P.pos.set(den[0]+40,0,den[1]);floor();L.tick(0.1*L.DAY_S);check(b.n<n0&&Math.abs(b.n/n0-Math.pow(m.survive,0.1))<1e-6&&V.hline().indexOf('clutches 1: 0 guarded')>0,'40 m off it: strayed, the clutch '+n0+' → '+b.n.toFixed(3)+' in a tenth of a day (survive '+m.survive+')');
    wait();floor();check(L.lay()===false&&L.hint().indexOf('at a den')===0,'and here, off the den, it may not lay a second');
    P.pos.set(den[0],0,den[1]);floor();wait();check(L.lay()===true&&L.cur().broods.length===2,'back at the den, a second clutch: again and again');}
  // the moult: the founder's clocks
  X.startNew(hose);floor();V.noSpark();const Lc=L.cur(),q=Math.pow(V.eco(L.kindOf()).mass,0.25);
  check(Lc.moults===L.MOULT_P.juv&&Lc.hardAt===0&&!P.soft&&L.scale()===1,'the founder: its '+L.MOULT_P.juv+' juvenile moults behind it, hard, adult');
  const next=L.moultAt(Lc.moults+1);check(Math.abs((next-Lc.grown)/L.DAY_S-L.MOULT.every*q)<1e-6&&V.hline().indexOf('the moult in '+((next-L.t)/L.DAY_S).toFixed(2))>0,'its next moult '+((next-L.t)/L.DAY_S).toFixed(1)+' game days off (MOULT.every '+L.MOULT.every+' × mass^¼), on the readout');
  const g0=P.g,ns=L.sheds().length,cov0=CB.coverAt(P,0);check(cov0==='shell','hard: its covering is shell (back valves)');
  L.setT(next+1);L.tick(0.5);
  check(Lc.moults===L.MOULT_P.juv+1&&P.soft===true&&L.soft()&&P.g!==g0&&CB.coverAt(P,0)==='skin'&&Math.abs(Lc.hardAt-(next+L.MOULT.soft*q*L.DAY_S))<1e-3,'the clock come: moulted — soft for '+((Lc.hardAt-next)/L.DAY_S).toFixed(2)+' d, the body rebuilt, skin to every edge');
  const sh=L.sheds();check(sh.length===ns+1&&sh[sh.length-1].mesh.position.distanceTo(V.V3?V.V3(P.pos.x,sh[sh.length-1].mesh.position.y,P.pos.z):P.pos)<1.5||sh.length===ns+1,'the cast carapace on the floor where it stood ('+sh.length+' shed'+(sh.length===1?'':'s')+' in the world)');
  check(V.hline().indexOf('soft, hard in')>0&&L.hint().indexOf('the moult')===0,'the readout says soft, the hint "'+L.hint()+'"');
  // prey to a hunter that never lists the player, big enough: another hose
  const hh=V.put('hose',12,0);hh.hunger=1;hh.state='wander';hh.cool=0;check(X.DEFS.hose.prey.indexOf('player')<0&&CB.softPrey(hh,P)===true&&CB.findPrey(hh,30)===P,'a hose (which never hunts the player) takes the soft body as prey');
  P.soft=false;check(CB.findPrey(hh,30)!==P,'and would not, hard');P.soft=true;hh.alive&&V.kill(hh,null);
  // hardened at its time
  L.setT(Lc.hardAt+1);const g1=P.g;L.tick(0.5);check(P.soft===false&&!L.soft()&&P.g!==g1&&CB.coverAt(P,0)==='shell'&&L.hint()==='hardened','hardened at its time: the body rebuilt, shell again, "'+L.hint()+'"');
  // killed while soft with a child alive: the child, hard and its own; the moult through the save
  if(den){P.pos.set(den[0],0,den[1]);floor();wait();L.lay();const b2=L.cur().broods[L.cur().broods.length-1];b2._egg.t=0.01;__step(3);check(b2.hatched&&L.live(b2)>=1,'a clutch at the den hatched: '+L.live(b2)+' young');
    const n2=L.moultAt(Lc.moults+1);L.setT(n2+1);L.tick(0.5);check(P.soft===true,'moulted again, soft');
    X.saveNow();X.saveRefresh();const rs=X.saveList.find(r=>r.id===X.curSave.id);X.startFrom(rs);check(P.soft===true&&L.cur().moults===Lc.moults&&CB.coverAt(P,0)==='skin','through the save: still soft, '+L.cur().moults+' moults');
    L.die('the test: killed soft');const Lk=L.cur();
    check(X.mode==='play'&&!P.dead&&L.line().length===2&&P.soft===false&&Lk.moults===0&&Lk.hardAt===0&&P.clade.juv>0&&L.scale()===V.ECO.juv,'killed soft with young alive: you are a hatchling, hard, at '+L.scale()+' of the adult');
    // growth through the moults: a step of scale at each, soft a short while after
    const s1=L.moultAt(1),s2=L.moultAt(2),s3=L.moultAt(3);check(Math.abs(s3-Lk.grown)<1e-3&&s1<s2&&s2<s3,'the hatchling\'s three moults: at '+((s1-Lk.born)/L.DAY_S).toFixed(2)+', '+((s2-Lk.born)/L.DAY_S).toFixed(2)+', '+((s3-Lk.born)/L.DAY_S).toFixed(2)+' d, the last at grown');
    L.setT(s1+1);L.tick(0.5);const sc1=L.scale();check(Lk.moults===1&&P.soft===true&&Math.abs(sc1-(V.ECO.juv+(1-V.ECO.juv)/3))<1e-3&&Math.abs(P.clade.juv-sc1)<1e-3&&(Lk.hardAt-s1)<=(s2-s1)*L.MOULT_P.juvSoft+1e-3,'the first: a step to '+sc1+', soft '+((Lk.hardAt-s1)/L.DAY_S).toFixed(2)+' d (a quarter of the interval at most)');
    L.setT(Lk.hardAt+1);L.tick(0.5);check(P.soft===false&&Math.abs(P.clade.juv-sc1)<1e-3,'hardened, the size kept');
    L.setT(s2+1);L.tick(0.5);L.setT(s3+1);L.tick(0.5);check(Lk.moults===3&&!P.clade.juv&&L.scale()===1&&P.soft===true,'the third moult at grown: the adult body, soft');
    L.setT(Lk.hardAt+1);L.tick(0.5);check(!P.soft&&L.lay()!==undefined,'and hard: grown up through its moults');
    // killed soft with none: the save is over
    X.startNew(hose);floor();const id3=X.curSave.id,Ln=L.cur();L.setT(L.moultAt(Ln.moults+1)+1);L.tick(0.5);check(P.soft===true,'a founder moulted, soft, with no child');
    L.die('the test: killed soft, no young');X.saveRefresh();const r3=X.saveList.find(r=>r.id===id3);check(X.mode==='menu'&&r3&&r3.over===true,'killed soft with no child: the save is over');}
}
console.log(fails?'player: '+fails+' FAILED':'player: all ok');
process.exit(fails?1:0);
