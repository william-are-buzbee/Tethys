// line.js — the line across generations (v11.69, LINEAGE.md §13.1–2): the lives on the slot and their tracks, the clutch by the body's mode (v11.74: the ringmouths' — BREED; v11.76: the hingeshells' den and the moult on the player), the editor at conception and its budget (v11.72, §13.4), the broods, the handover at death, the sparkle
// A slot's `line` is a list of lives, the last the one being played: {spec, preset, born, grown, died, cause, playT, parent, track, lay, broods}.
// born and died are the world clock `t` (seconds; DAY_S a game day), grown the clock at which the body is adult (a hatchling is ECO.juv of it
// until then, as the world's juveniles are), parent the index of the life that laid it (−1 the founder), track the position every LINE.trackS
// seconds of play run-length coded ([x,y,z] a sample, [x,y,z,k] k equal samples running), lay the clock of the last clutch. A brood is a
// record on the life that laid it — {cell, pos, n, born, hatch, spec, hatched, at} — and it is the truth about the clutch whether its cell is
// loaded or not: loaded, it is a clutch on the floor (creatures_ai.js eggs, ent −1) or young of the parent's spec (a kind of its own, lineKind)
// and n follows them; unloaded, n falls by BROOD_SURVIVE a game day — a stand-in for LINEAGE §8's sparse ledger entries, which would put the
// young through the same model as every other species. Only the current life's broods are eligible at its death (LINEAGE §4: your own
// children, not siblings or grandchildren); the earlier lives' broods still load and live as the world's animals. Nothing here is in the ledger.
// Decided for this pass (the person, 21 Sep 2026): the player breeds alone, no mate; at death you continue as the nearest living child; an
// unhatched clutch counts as a living child, and the world runs on to its hatch.
const LINE={trackS:5,near:3}; // trackS: s of play between the track's samples; near: m over the floor a clutch may be laid from. The eggs' number and price are the mode's (BREED, v11.74; LINE.egg and LINE.n to v11.73)
// ---------- the modes (v11.74, LINEAGE §3, §12.26–28: the person, 21 Sep 2026) ----------
// Reproduction is a body fact, not a setting, and it is read off the body: a ringmouth with a chambered shell (derive: it floats) is the nautilus — few
// large eggs, laid again and again, the shell being a skeleton — and a soft one is the octopus: one clutch of many small eggs, grown, and after it a brood
// it does not feed through (feeds), wasting as its stomach empties (wasteOf: the calculator's own speed off a live spec with less muscle, DERIVE_K.waste),
// guarding the clutch or not (broodGuarded: a choice with a payoff, not a leash — off it, the losses run), and dead at the hatch (die('spent'): a death like
// any other, the handover to a hatchling at the clutch). It ages, too, so a soft-arm that never spawns still ends (die('old')); nothing else ages yet. A
// slowblood breeds again and again and cares for nothing (§3). A hingeshell (v11.76, §3: iteroparous, invested, K) lays few large eggs at a den — the
// sheltered water (the shel field) or against a solid, as MOULT's hideSpot finds one (den) — again and again, guards each clutch as v11.74's brooder does
// (guard) and feeds meanwhile; its young survive best (survive). It moults (below).
// r against K in the eggs: a clutch costs egg × n × the child's adult derived mass in tonnes, off the stomach over the parent's meal (clutchHunger, v11.73).
// Per key — n: eggs a clutch. egg: an egg's material as a share of the child's adult derived mass. once: one clutch a life, then the brood. life: the lifespan
// in game days × mass^¼ (the ledger's q, as every rate is; 0 never ages). survive: the share of a brood alive after a game day unguarded — its cell unloaded
// (every mode), and loaded while the brooding parent is off it (a brooding mode). guard: m from the clutch within which the parent guards it — no scavenger
// takes it and it loses nothing. gaunt: the share of the core's radius gone at full wasting (the look; the speed is DERIVE_K.waste's). hatchK: the brooded
// clutch's hatch time as a multiple of the world's (ECO.hatch × mass^¼). den: where a clutch may be laid — shel the field's least value, solid m within
// which a solid will do instead. First numbers, to be moved by play (the person tunes; §6: "playtested a lot"):
const BREED={
  soft:{n:30,egg:0.001,once:true,life:4,survive:0.5,guard:12,gaunt:0.25,hatchK:1}, // the octopus: 30 eggs at 2.24 t are 67 kg, 0.66 of the soft-arm's 102 kg stomach; a life of 4 × 1.42 = 5.7 game days (3.8 real hours); the brood 0.36 days at hatchK 1 — the parent reaches the hatch at hunger 0.6–0.9, wasted 0.1–0.3 (its starvation clock from the laying is 1.3–1.6 days, so the brood is well inside it); at 3 it would arrive spent; unguarded, half the clutch a day
  shelled:{n:2,egg:0.008,once:false,life:0,survive:0.8}, // the nautilus (the coilshell): 2 eggs at 3.3 t are 53 kg, 0.63 of its 84 kg stomach, again and again; no brood, no age
  slowbloods:{n:4,egg:0.01,once:false,life:0,survive:0.8}, // the finback (v11.69–73): 4 eggs at 1.77 t are 71 kg, 0.49 of its 146 kg stomach; 4 eggs unloaded are 3.2 after a day and under one living child after about six
  hingeshells:{n:3,egg:0.02,once:false,life:0,survive:0.9,guard:12,den:{shel:0.5,solid:2.5}} // v11.76: 3 eggs at 0.02 — the hose's 58 kg, 0.68 of its 84 kg stomach; the sickle's 1.8 t of 3.1; again and again, at a den, guarded within 12 m (v11.74's knob) or losing a tenth a day; nine in ten of an unloaded brood live a day
};
function breedOf(spec){if(!spec)return null;if(spec.clade==='slowbloods')return BREED.slowbloods;if(spec.clade==='hingeshells')return BREED.hingeshells;if(spec.clade!=='ringmouths')return null;let ch=false;try{ch=derive(spec).buoyancy==='floats';}catch(e){}return ch?BREED.shelled:BREED.soft;} // the mode off the body
function lifeBreed(L){if(!L)return null;if(L._m===undefined)L._m=breedOf(L.spec);return L._m;} // cached on the life (the runtime links, never saved)
function broodBreed(b){if(b._m===undefined)b._m=breedOf(b.spec);return b._m||BREED.slowbloods;}
function lifeS(L){const m=lifeBreed(L);return m&&m.life?m.life*Math.pow(ecoOf(lineKind(L.spec)).mass,0.25)*DAY_S:0;} // s: the life's span, or 0 for a body that does not age
function lineBrooding(){const L=lineCur();if(!L||player.dead)return null;const m=lifeBreed(L);if(!m||!m.once||!L.broods.length)return null;const b=L.broods[L.broods.length-1];return b.hatched?null:b;} // the clutch the player is brooding, or null
function feeds(o){return o!==player||!lineBrooding();} // creatures_ai.js kill and eatAt ask: a brooding ringmouth has stopped feeding
function broodGuarded(b){const L=lineCur();if(!L||b.hatched||playerGone())return false;const m=lifeBreed(L);if(!m||!m.guard||L.broods.indexOf(b)<0)return false;const dx=player.pos.x-b.pos[0],dy=player.pos.y-b.pos[1],dz=player.pos.z-b.pos[2];return dx*dx+dy*dy+dz*dz<m.guard*m.guard;} // the brooding parent within guard of its clutch: the scavengers keep off (findCarcass, scavenge) and the clock's losses stop
// the wasting (a brooding body): the share of the way from hungry to death by starvation — the stomach's clock past ECO.hungry and then STARVE_T cycles
// (creatures_ai.js hungerTick) — 0 at hungry, 1 at the death. The live spec carries it (spec.waste) and the calculator gives the speed (combat.js rederive,
// as a wound does); the body is rebuilt gaunt at every tenth (BREED.gaunt on the core's radius, where the core has one — the mantle)
function wasteOf(P){if(!lineBrooding())return 0;const K=eaterK(P),cyc=K.cycle*DAY_S;return clamp((Math.max(0,P.hunger-ECO.hungry)*cyc+P.starveT)/((1-ECO.hungry)*cyc+STARVE_T*cyc),0,1);}
function wasteTick(L,P,m){const w=wasteOf(P);if(Math.abs(w-(P.waste||0))<0.02&&!(w===0&&P.waste))return;
  const gs=Math.floor(w*10+1e-9);if(m.gaunt&&gs!==(L._gs||0)){L._gs=gs;playerRebody(gauntClade(P.clade,m.gaunt*gs/10));} // the look, in steps (playerBody starts a body whole: waste is set after)
  P.waste=w;const live=liveSpec(P);if(live){live.waste=w;rederive(P);}}
function gauntClade(C,k){const sp=JSON.parse(specToJSON(C.spec)),core=CORES[sp.core.kind];if(k>0&&core&&core.params.R){const R0=sp.core.R!==undefined?sp.core.R:core.params.R.d;sp.core.R=+(R0*(1-k)).toFixed(4);}return Object.assign({},C,{build:()=>compile(sp)});} // the clade as it is, its body compiled thinner; spec stays the adult's (the save, the calculator's full body)
function lineCur(){const L=curSave&&curSave.line;return L&&L.length?L[L.length-1]:null;}
function lifeNew(spec,preset,parent,born,grown){return {spec:JSON.parse(specToJSON(spec)),preset:preset,born:r3(born),grown:r3(grown),died:null,cause:'',playT:0,parent:parent,track:[],lay:-1e9,broods:[],moults:0,hardAt:0};} // moults, hardAt (v11.76): the moults done and the clock the body hardens at (0: hard) — a moulting clade's
function lifeClade(L,k){const sp=specOk(L.spec),pre=sp?presetFor(sp):CLADE_PRESETS.find(p=>p.id===L.preset);if(!sp)return CLADES.find(c=>c.id===L.preset)||CLADES[1];const C=playerClade(sp,pre,k);if(lineSoft(L))C.build=softBuild(sp,k);return C;} // soft (v11.76): the body built pale through the moult
function lineStart(C){curSave.line=[lifeNew(C.spec,C.id,-1,t-growS(C.spec),t)];const L=lineCur();if(moulting(L))L.moults=MOULT_P.juv;} // a new game: the founder, adult from the start — hatched a growth ago, so its age (v11.74) is an adult's; a moulting founder has its juvenile moults behind it (v11.76)
function lineLoadRec(rec,C){ // the line from a record, or (a record from before v11.69) the animal on it as the founder
  const ok=Array.isArray(rec.line)&&rec.line.length&&rec.line.every(L=>L&&L.spec&&Array.isArray(L.broods)&&Array.isArray(L.track));
  curSave.line=ok?JSON.parse(JSON.stringify(rec.line)):[lifeNew(C.spec,C.id,-1,t,t)];
  for(const L of curSave.line){for(const b of L.broods){b._ch=null;b._egg=null;}if(L.hardAt===undefined)L.hardAt=0;if(L.moults===undefined)L.moults=moulting(L)?moultN(L,Math.min(t,L.grown)):0;} // a record from before v11.76: its moults by the clock, hard
  const L=lineCur();if(L&&lifeBreed(L)&&!(L.born<L.grown))L.born=L.grown-growS(L.spec); // a founder from before v11.74: adult at its start, so hatched a growth before it
}
// the kind the young of a spec are (a def per spec, as the lab's placed creature has one). v11.75: the founder's row (creatures_defs.js founderDef — the
// species the line began from; the three presets have rows of their own) re-derived on the child's body: what is not physics — the role and its
// behaviour, the prey, venom, immunity, whether it is forage — comes down the line unchanged, the physics (speed, accel, turn, reach, the bite) is the
// child's own build. The seam LINEAGE §8.2's derived DEFS replaces. A forage founder's young are a schoolless forage (graze: they wander and flee —
// updateBoid wants a school), and the presets' rows are 'player', which the young run as hunters
function lineKind(spec){const k='line:'+hashStr(specToJSON(spec)).toString(36);if(DEFS[k])return k;const C=playerClade(spec),st=statsOf(spec),fd=founderDef(spec)||DEFS.fin,d={};
  for(const key in fd)if(key!=='build'&&key!=='spec'&&key!=='stock'&&key!=='top'&&key!=='speed'&&key!=='turn'&&key!=='accel')d[key]=fd[key];
  Object.assign(d,{build:()=>compile(spec),spec:spec,line:true,lineId:C.id,size:spec.size,prey:(fd.prey||[]).filter(p=>p!=='player'&&DEFS[p]),reach:st.reach,dmg:C.bite,legs:C.legs,jetter:C.jet});
  if(d.role==='player')d.role='hunter';else if(d.role==='boid')d.role='graze';if(d.flee)d.flee=true;
  DEFS[k]=defPhysics(d,spec); // v11.71: speed, accel and turn off its own build, as every kind's (creatures_defs.js defPhysics) — a child edited at conception moves as its body says
  return k;}
function growS(spec){return ecoOf(lineKind(spec)).grow*DAY_S;} // seconds from the hatch to adult: the world's rule (ECO.grow × mass^¼ days)
function hatchS(spec){return ECO.hatch*Math.pow(ecoOf(lineKind(spec)).mass,0.25)*DAY_S;} // seconds from the laying to the hatch (layEggs' rule, without its jitter)
// ---------- the moult (v11.76, LINEAGE §3 hingeshells; the person, 21 Sep 2026: the player moults, and the moult is not a trip to the editor) ----------
// The world's own MOULT rules (creatures_ai.js) on the player, by the clock: an adult moults every MOULT.every × mass^¼ game days and is soft for
// MOULT.soft × mass^¼ after each — pale (the body rebuilt in the soft coat, as the world's soft twin is: softBuild), its valves clamped (the anim's st.soft),
// skin to every edge (combat.js coverAt) and prey to whatever is big enough, listed or not (creatures_ai.js findPrey, softPrey) — with its cast carapace
// left on the floor where it was (dropShed: the world's shed, MOULT.shedT days). It moves as it likes: the world's soft body lies hidden by its choice
// (updateSoft), not by a rule, so the player is not held. A hatchling grows through its moults (the person: if the juvenile system allows it — it does,
// playerClade takes any scale): MOULT_P.juv moults from the hatch to grown, a step of scale at each, the last at grown; soft after each for a share of the
// interval (juvSoft — the adult's soft days would outlast a juvenile's interval). Everything is a function of the clock (moultN, moultAt: the life's born and
// grown), so an unload, a run-on or a save change nothing; the life keeps only the count done and the clock it hardens at. The hose: 27 game days between
// moults, soft 0.68 (27 real minutes); the sickle 67 days and 1.67 (an adult that never moults in a session — the person tunes MOULT.every)
const MOULT_P={juv:3,juvSoft:0.25}; // juv: moults from the hatch to grown, a step of scale each (ECO.juv → 1); juvSoft: a juvenile's soft time as a share of its moult interval
function moulting(L){const g=L&&L.spec&&GRAMMAR[L.spec.clade];return !!(g&&g.moult);}
function moultTimes(L){const q=Math.pow(ecoOf(lineKind(L.spec)).mass,0.25);return {step:Math.max(1,(L.grown-L.born)/MOULT_P.juv),every:MOULT.every*q*DAY_S,softA:MOULT.soft*q*DAY_S};} // the juvenile's interval, the adult's, the adult's soft span (s)
function moultN(L,t0){const M=moultTimes(L);return t0<L.grown?Math.max(0,Math.floor((t0-L.born)/M.step+1e-6)):MOULT_P.juv+Math.floor((t0-L.grown)/M.every+1e-6);} // moults done by clock t0
function moultAt(L,n){const M=moultTimes(L);return n<=MOULT_P.juv?L.born+n*M.step:L.grown+(n-MOULT_P.juv)*M.every;} // the clock of the n-th moult (the juv-th is grown)
function moultSoft(L,n){const M=moultTimes(L);return n<=MOULT_P.juv?Math.min(M.softA,M.step*MOULT_P.juvSoft):M.softA;} // s soft after the n-th
function lineScale(L){if(!L)return 1;if(!moulting(L))return t<L.grown?ECO.juv:1;const n=Math.min(MOULT_P.juv,L.moults||0);return n>=MOULT_P.juv?1:+(ECO.juv+(1-ECO.juv)*n/MOULT_P.juv).toFixed(4);} // the body's scale: a hatchling's until grown, or a moulting clade's steps
function lineSoft(L){return !!(L&&moulting(L)&&L.hardAt>t);}
function softBuild(sp,k){const pal=(typeof sp.coat==='string'?PAL[sp.coat]:sp.coat)||PAL.softP;return ()=>compile(sp,(k||1)*(sp.s||1),coatChem(pal,'soft',sp.clade));} // the body pale, the coat's every key (creatures_ai.js buildKind 'soft')
function moultTick(L,P){ // in play: the moult when its clock comes (the last, if the clock jumped), the hardening after
  const n=moultN(L,t);
  if(n>(L.moults||0)){L.moults=n;L.hardAt=r3(moultAt(L,n)+moultSoft(L,n));const ch=chunkAt(P.pos.x,P.pos.z);if(ch&&P.g&&P.b)dropShed(ch,lineKind(L.spec),P.pos,P.g.quaternion,P.b.g.scale.x); // the cast where the body is, at the size it was
    playerRebody(lifeClade(L,lineScale(L)));P.soft=lineSoft(L);const msg=P.clade.juv?'the moult: a size bigger, and soft':'the moult: soft';hintEl.textContent=msg;hintEl.style.opacity=1;setTimeout(()=>{if(hintEl.textContent===msg)hintEl.style.opacity=0;},4000);return;}
  if(P.soft!==lineSoft(L)){playerRebody(lifeClade(L,lineScale(L)));P.soft=lineSoft(L);if(!P.soft){hintEl.textContent='hardened';hintEl.style.opacity=1;setTimeout(()=>{if(hintEl.textContent==='hardened')hintEl.style.opacity=0;},3000);}}
}
// ---------- the track ----------
let lineAcc=0,lineCnt=0;
function lineTick(dt){ // in play (save.js updateSave): the life's clock and track, the loaded broods counted, the hatchling grown
  const L=lineCur(),P=player;if(!L||P.dead)return;L.playT+=dt;lineAcc+=dt;
  if(lineAcc>=LINE.trackS){lineAcc-=LINE.trackS;const s=[Math.round(P.pos.x),Math.round(P.pos.y),Math.round(P.pos.z)],T=L.track,q=T[T.length-1];
    if(q&&q[0]===s[0]&&q[1]===s[1]&&q[2]===s[2])q[3]=(q[3]||1)+1;else T.push(s);}
  lineCnt-=dt;if(lineCnt<=0){lineCnt=1;for(const M of curSave.line)for(const b of M.broods)if(b._ch&&b.hatched)b.n=broodLive(b);}
  if(moulting(L))moultTick(L,P);else if(P.clade.juv&&t>=L.grown)playerRebody(lifeClade(L,1)); // v11.76: a moulting body grows at its moults; else grown: the adult body in one step, as a juvenile of the world's grows up (there out of sight; here in view — a stand-in)
  if(P.dead)return;
  // v11.74: the ringmouths' modes — the age, the brood, the wasting; v11.76: the guard on every clutch of a guarding mode
  const m=lifeBreed(L);if(!m)return;
  if(m.life&&t-L.born>=lifeS(L)){die('old');return;} // old age: a death like any other (the handover, or the save over)
  if(m.guard)for(const b of L.broods){if(b.hatched||!b._egg||broodGuarded(b))continue;b.n*=Math.pow(m.survive,dt/DAY_S);const g=b._egg,n=Math.round(b.n);if(n<g.n){g.n=n;if(n<=0)removeEgg(g);}} // strayed from a loaded clutch (the brooding soft-arm's one, a hingeshell's several dens): the mode's losses run, as they do unloaded (guarded, nothing is lost and no scavenger comes)
  if(!m.once)return;const b=L.broods.length?L.broods[L.broods.length-1]:null;if(!b)return;
  if(!b._ch)broodCatchUp(b);if(!b.hatched&&t>=b.hatch&&!b._egg)b.hatched=true; // hatched by the clock: unloaded (broodCatchUp), or loaded and eaten to nothing — the brood is over all the same
  if(b.hatched){die('spent');return;} // the clutch has hatched (loaded: creatures_ai.js updateEggs → broodHatch put the young in the world a frame ago): the parent's brood is over, and so is it — the nearest child is a hatchling at the clutch
  wasteTick(L,P,m);
}
function broodLive(b){let n=0;for(const c of creatures)if(c.alive&&c.brood===b)n++;return n;}
// ---------- laying (x) ----------
function playerLay(){
  const P=player,C=P.clade,L=lineCur();if(mode!=='play'||P.dead||!C||!L)return false;
  const h=groundAt(P.pos.x,P.pos.z),ch=chunkAt(P.pos.x,P.pos.z),m=lifeBreed(L);let why='';
  if(!m)why='not this body'; // every clade but the drifters has a mode (BREED, v11.74–76)
  else if(C.juv)why='not yet grown';
  else if(m.once&&L.broods.length)why='brooding'; // v11.74: the semelparous spawn once — after it the clutch is all it has, and it dies at the hatch
  else if(P.hunger>ECO.hungry)why='hungry'; // v11.73: the ledger's own line (ECO.hungry, where a hunter goes hunting) — a hungry animal does not lay
  else if(P.hunger+clutchHunger(C.spec)>=1)why='not fed enough'; // v11.73: a copy of yourself must be affordable before the window opens, so declining always can lay (what a heavier child costs is conceiveClose's)
  else if(P.sub<0.9||h>-4||P.pos.y-h>LINE.near+1.1||!ch)why='on the floor, under water';
  const at=V3(P.pos.x,h,P.pos.z);if(!why&&solidPush(at,0.6,null,ch))why='not here';
  if(!why&&m.den&&!denAt(at,ch,m.den))why='at a den: sheltered water, or against rock'; // v11.76: the hingeshells lay at a den
  if(why){hintEl.textContent=why;hintEl.style.opacity=1;setTimeout(()=>{if(hintEl.textContent===why)hintEl.style.opacity=0;},1500);return false;}
  return conceiveOpen(L,at,ch);
}
function denAt(at,ch,den){const f=ch.f(at.x,at.z);if(f[FI.shel]>=den.shel)return true;T2.set(at.x,at.y+0.6,at.z);return !!solidPush(T2,0.6+den.solid,null,ch,true);} // a den (v11.76): the sheltered water (the shel field — a lagoon, a lee) or a solid within den.solid m — a rock, a stalk, a structure's foot, as MOULT's hideSpot finds one
// ---------- conception (v11.72, LINEAGE §4.1–2, §6, §13.4) ----------
// Laying opens the lab as the creator over the world, as `l` in play does, on the parent's spec: mating is the trip to the editor. The clade is locked
// (lab.js: nothing else can be loaded, and labLoad refuses another clade). Closing the window is the laying: unchanged, the clutch is a copy and the
// generation counts all the same (you may decline, §4.2); changed and within the budget, the clutch carries the new spec and the sparkle marks it
// (§7: "when you successfully close the mutation window"); over the budget the lab will not commit and says what costs what — take something back,
// or decline. There is no way out that lays nothing: opening the window was the mating. While the window is open the parent is out of the world
// (player.js playerAway, v11.72.1): hidden, and nothing can see, chase, hold or hurt it — the world runs on, and the editor is not a place to be eaten.
// The budget is the diff between the child and the parent, priced off the v11.70 registry (paramOf: a parameter's believable band is what a move is
// measured against). First numbers, to be moved by play (§6: "playtested a lot"). There is no hard cap on the distance from the parent — the budget
// is the cap (§11.5: a default, not the person's answer yet). The fuel half of §6 is the stomach's (v11.73): clutchHunger, below the budget.
const BUDGET={
  base:3, // points the founder's child may spend
  gen:1.5, // more for every generation of the line behind the parent (§6: the budget grows with the generation) — the tenth life's child has 16.5
  param:1, // a number moved across the whole of its believable band (pro rata: a tenth of the band is 0.1)
  extreme:2, // × for the stretch of a move that lies outside the believable band (the registry's extreme band: allowed, dear)
  eps:0.005, // a move under this share of the band is free (a slider's rounding)
  toggle:0.25, // a switch flipped, one of a list chosen, the beat retimed, the pattern changed
  list:0.5, // a profile redrawn (a list the panel edits)
  add:1, // × the part's registry cost (PARTS[kind].cost, twice for a mirrored one): a part the parent had not
  remove:0.5, // × the same: a part dropped — loss is cheaper than gain, and not free (the body was built round it)
  style:0.75, // × the same: a part kept and its style swapped, then the numbers the two styles share priced as moves
  core:6, // the core's kind changed: another body plan — dear enough that the founder's child cannot (3) and the third generation's can (6)
  size:4, // per doubling or halving of the build scale or the claimed half-length, whichever moved more (§6: size is one of the things generations buy)
  coat:0.3, // every colour of the coat moved across the whole of its range (pigment is cheap; §6's pigment gate is the eating, not built)
  edge:1.5 // the mouth's edge changed (COMBAT.md §10.10, v11.93): the rows the line already has on its back fused along the petal — the sawmouths' step (cut), the needle's (point), the platebacks' (crush); dearer than a switch, half the founder's budget, because a lineage turns on it
};
const EDGE_STEP={cut:'the sawmouths\' step',point:'the needle\'s step',crush:'the platebacks\' step',hold:'the pad again'}; // what the bill calls it
function conceiveBudget(gen){return BUDGET.base+BUDGET.gen*(gen-1);} // gen: the parent's place in the line (the founder 1)
// the fuel (v11.73, LINEAGE §6): a clutch is paid from what the body has eaten — the child's adult derived mass × the eggs × LINE.egg, in tonnes, taken
// off the parent's stomach as a share of its meal (ecology.js ecoOf on the line kind: the player's hunger runs on it, player.js). Refused when it would
// leave the stomach starving (hunger 1): a big child wants a full parent. The materials — the mineral, the pigment — are §6's other half, proposed there, not built.
function clutchCost(child){const m=lifeBreed(lineCur())||breedOf(child)||BREED.slowbloods;return m.egg*m.n*derive(child).mass;} // tonnes of food, by the parent's mode (v11.74)
function clutchHunger(child){const P=player;if(!P.clade)return 0;const K=eaterK(P);return K.hunter?clutchCost(child)/K.meal:0;} // as hunger (of the parent's stomach); a body with no stomach on the model (v11.75: a founder that hunts nothing) pays nothing — the model has no account for it
function priceMove(a,b,q){ // one parameter from a to b, against its registry line
  if(a===undefined||b===undefined||a===b)return 0;if(!q||q.k==='b'||q.k==='s')return JSON.stringify(a)===JSON.stringify(b)?0:BUDGET.toggle;
  if(q.k==='l'||typeof a!=='number'||typeof b!=='number')return JSON.stringify(a)===JSON.stringify(b)?0:BUDGET.list;
  const lo=Math.min(a,b),hi=Math.max(a,b),b0=q.b0!==undefined?q.b0:lo,b1=q.b1!==undefined?q.b1:hi,w=Math.max(1e-6,b1-b0),inside=Math.max(0,Math.min(hi,b1)-Math.max(lo,b0)),f=(inside+(hi-lo-inside)*BUDGET.extreme)/w;
  return f<BUDGET.eps?0:f*BUDGET.param;}
function conceivePrice(parent,child){ // {total, items:[{what, cost}]} dearest first; both specs validated (filled and clamped)
  const A=validate(parent).spec,B=validate(child).spec,items=[],add=(what,cost)=>{if(cost>0)items.push({what:what,cost:+cost.toFixed(2)});};let F=null;try{F=compileFrame(B);}catch(e){}
  if(A.core.kind!==B.core.kind)add('the core: '+A.core.kind+' → '+B.core.kind,BUDGET.core);
  else{for(const k in CORES[B.core.kind].params){const q=paramOf(B.core.kind,k,B.core,F);add('core '+(q?q.label:k),priceMove(A.core[k],B.core[k],q));}
    if(JSON.stringify(A.core.beat||0)!==JSON.stringify(B.core.beat||0))add('the beat',BUDGET.toggle);}
  const lg=(x,y)=>Math.abs(Math.log2(Math.max(1e-6,y)/Math.max(1e-6,x)));add('size',BUDGET.size*Math.max(lg(A.s||1,B.s||1),lg(A.size,B.size)));
  const kinds={};for(const p of A.parts)(kinds[p.kind]=kinds[p.kind]||[[],[]])[0].push(p);for(const p of B.parts)(kinds[p.kind]=kinds[p.kind]||[[],[]])[1].push(p);
  for(const kind in kinds){const def=PARTS[kind];if(!def)continue;const a=kinds[kind][0],b=kinds[kind][1],cost=p=>def.cost*(p.mirror?2:1);
    for(let i=0;i<Math.max(a.length,b.length);i++){const p=a[i],c=b[i];
      if(!p){add('a new '+kind+(c.style?' ('+c.style+')':''),BUDGET.add*cost(c));continue;}if(!c){add('the '+kind+(p.style?' ('+p.style+')':'')+' dropped',BUDGET.remove*cost(p));continue;}
      if(p.style!==c.style)add(kind+': '+p.style+' → '+c.style,BUDGET.style*cost(c));if(!!p.mirror!==!!c.mirror)add(kind+(c.mirror?' mirrored':' unmirrored'),(c.mirror?BUDGET.add:BUDGET.remove)*def.cost);
      const ka=paramsFor(kind,p.style);for(const k of paramsFor(kind,c.style)){if(ka.indexOf(k)<0)continue;if(kind==='mouth'&&k==='edge'){if((p.edge||'hold')!==(c.edge||'hold'))add('the mouth\'s edge: '+(p.edge||'hold')+' → '+(c.edge||'hold')+' ('+(EDGE_STEP[c.edge||'hold']||'a new edge')+')',BUDGET.edge);continue;} // the edge is a line's step, not a switch (v11.93, COMBAT.md §10.10)
        const q=paramOf(kind,k,c,F);add(kind+' '+(q?q.label:k),priceMove(p[k],c[k],q));}}}
  const pa=typeof A.coat==='string'?PAL[A.coat]:A.coat,pb=typeof B.coat==='string'?PAL[B.coat]:B.coat;let dc=0,nc=0;
  if(pa&&pb&&pa!==pb)for(const k in pb){const x=pa[k],y=pb[k];if(!Array.isArray(y))continue;nc++;dc+=Array.isArray(x)?(Math.abs(x[0]-y[0])+Math.abs(x[1]-y[1])+Math.abs(x[2]-y[2]))/3:1;}
  if(nc&&BUDGET.coat*dc/nc>=BUDGET.eps)add('the coat',BUDGET.coat*dc/nc);if(JSON.stringify(A.pattern||0)!==JSON.stringify(B.pattern||0))add('the pattern',BUDGET.toggle);
  items.sort((x,y)=>y.cost-x.cost);let total=0;for(const it of items)total+=it.cost;return {total:+total.toFixed(2),items:items};}
function conceiveOpen(L,at,ch){ // x, with the floor under you: the lab as the creator, on your own spec
  const gen=curSave.line.length;lab.conceive={parent:JSON.parse(specToJSON(L.spec)),gen:gen,budget:conceiveBudget(gen),at:at.clone(),price:{total:0,items:[]}};
  labEnter(lab.conceive.parent,true);if(mode!=='lab'){lab.conceive=null;return false;}lab.player=true;playerAway(true); // v11.72.1: out of the world while the window is open; labLeave brings the body back
  hintEl.textContent='the child: change it, or not — l lays the clutch';hintEl.style.opacity=1;return true;}
function conceiveHTML(){const cv=lab.conceive,pr=cv.price=conceivePrice(cv.parent,lab.v||cv.parent),over=pr.total>cv.budget+1e-9,fuel=clutchHunger(lab.v||cv.parent),lean=player.hunger+fuel>=1;
  let h='<div id="lab-cv" class="cv'+(over||lean?' over':'')+'"><div class="hd">conception<span class="v">generation '+(cv.gen+1)+'</span></div><div class="row"><span>the bill</span><span class="v">'+pr.total.toFixed(2)+' of '+cv.budget.toFixed(1)+'</span></div>';
  for(const it of pr.items.slice(0,6))h+='<div class="row it"><span>'+it.what+'</span><b>'+it.cost.toFixed(2)+'</b></div>';if(pr.items.length>6)h+='<div class="note">and '+(pr.items.length-6)+' more</div>';
  h+='<div class="row"><span>the eggs</span><span class="v">'+fuel.toFixed(2)+' of '+(1-player.hunger).toFixed(2)+' eaten</span></div>'; // v11.73: the fuel — LINE.n eggs of the child's mass, against what the stomach holds
  h+='<div class="note">'+(over?'over the budget by '+(pr.total-cv.budget).toFixed(2)+': take something back, or decline':lean?'not fed enough for this child: a smaller one, or eat first':pr.total>0?'within the budget':'unchanged: the clutch will be a copy')+'</div>';
  return h+'<div class="row"><button data-act="cv-lay"'+(over||lean?' disabled':'')+'>lay the clutch</button><button data-act="cv-decline">decline: a copy</button></div></div>';}
function conceiveClose(decline){ // the window closed: the clutch laid as the child, as a copy (declined, or unchanged), or refused over the budget (the lab stays)
  const cv=lab.conceive;if(!cv||mode!=='lab')return false;const pr=decline?{total:0,items:[]}:conceivePrice(cv.parent,lab.v||cv.parent);
  if(pr.total>cv.budget+1e-9){const m='over the budget ('+pr.total.toFixed(2)+' of '+cv.budget.toFixed(1)+')'+(pr.items[0]?': '+pr.items[0].what+' costs '+pr.items[0].cost.toFixed(2):'')+'; take something back, or decline';hintEl.textContent=m;hintEl.style.opacity=1;labRender();labMsg(m);return false;}
  const child=pr.total>0?JSON.parse(specToJSON(lab.v)):cv.parent;if(pr.total>0&&(!child.id||child.id===cv.parent.id))child.id=(cv.parent.id||'line').replace(/-\d+$/,'')+'-'+(cv.gen+1);
  const fuel=clutchHunger(child);if(player.hunger+fuel>=1){const m='not fed enough for this child ('+fuel.toFixed(2)+' of the stomach, '+(1-player.hunger).toFixed(2)+' in it): a smaller one, or decline';hintEl.textContent=m;hintEl.style.opacity=1;labRender();labMsg(m);return false;} // v11.73: the fuel half of the bill (LINEAGE §6) — the stomach must hold the eggs; a copy always can (playerLay checked)
  lab.conceive=null;labLeave();return layClutch(child,pr,cv);}
function layClutch(child,pr,cv){ // the clutch on the floor where the window opened, carrying the child's spec
  const L=lineCur(),P=player,ch=chunkAt(cv.at.x,cv.at.z),m=lifeBreed(L)||BREED.slowbloods;if(!L||!ch)return false;
  const b={cell:ch.i*NCELL+ch.j,pos:[r3(cv.at.x),r3(cv.at.y),r3(cv.at.z)],n:m.n,born:r3(t),hatch:r3(t+hatchS(child)*(m.hatchK||1)),spec:child,gen:cv.gen+1,price:pr.total,hatched:false,at:r3(t),_ch:ch,_egg:null};
  L.broods.push(b);L.lay=r3(t);b.fuel=r3(clutchCost(child));P.hunger=Math.min(1,P.hunger+clutchHunger(child));broodEgg(ch,b);P.pulse=1;thump(0.3,90,40,null,0.6,0.05); // v11.73: the eggs' material off the stomach (the record keeps it in tonnes)
  if(m.once){const msg='the clutch: '+m.n+' eggs, the hatch in '+((b.hatch-t)/DAY_S).toFixed(2)+' days — you will not feed again; stay by it, or not';hintEl.textContent=msg;hintEl.style.opacity=1;setTimeout(()=>{if(hintEl.textContent===msg)hintEl.style.opacity=0;},6000);} // v11.74: the brood begins
  if(pr.total>0)sparkStart(cv.at);saveNow();return true;} // the sparkle: only a changed child is the magic (§7); a copy is what any animal lays
// ---------- the broods in the world ----------
function broodEgg(ch,b){ // the clutch on the floor: the world's own egg (creatures_ai.js layEggs), outside the ledger (ent −1), its brood on it
  const kind=lineKind(b.spec),sz=0.12*Math.pow(b.spec.size,0.6),m=new THREE.Mesh(eggGeo(b.spec.clade),MATT),at=V3(b.pos[0],b.pos[1],b.pos[2]),n=Math.round(b.n);
  m.position.copy(at);m.scale.setScalar(sz);m.rotation.y=(b.born*7)%TAU;scene.add(m);
  const g={mesh:m,pos:at,ent:-1,e:null,kind:kind,chunk:ch,n:n,n0:n,t:Math.max(0.01,b.hatch-t),flesh:n*sz*sz*sz*40,flesh0:n*sz*sz*sz*40,gone:false,def:{size:sz*2},egg:true,brood:b};
  b.n=n;b._egg=g;eggs.push(g);ch.eggs.push(g);return g;
}
function broodHatch(g){const b=g.brood;b.hatched=true;b.n=g.n;b.at=r3(t);b._egg=null;broodSpawn(g.chunk,b,g.n);POP.hatched+=g.n;} // creatures_ai.js updateEggs
function broodSpawn(ch,b,n){ // the young at the clutch, as old as the brood is (juveniles until grown, then adults)
  const kind=lineKind(b.spec),age=t-b.hatch,gs=growS(b.spec),rng=mulberry((b.born*1000+n*7919)>>>0);
  for(let i=0;i<n;i++){const p=V3(b.pos[0]+(rng()-0.5)*6,0,b.pos[2]+(rng()-0.5)*6);p.y=groundAt(p.x,p.z)+1+b.spec.size*0.5;
    const c=spawn(ch,kind,p,rng,{ent:-1,juv:age<gs});if(age<gs)c.juv=Math.max(1,gs-age);if(age<60)c.hunger=0;c.brood=b;c.home.set(b.pos[0],p.y,b.pos[2]);} // a hatchling is fed (v11.74: spawn draws a hunter's hunger at random, and the handover takes the child's stomach as it is — you became one at 0.72)
}
function broodCatchUp(b){if(b._ch)return;const d=(t-b.at)/DAY_S;if(d<=0)return;if(!b.hatched&&t>=b.hatch)b.hatched=true;b.n*=Math.pow(broodBreed(b).survive,d);b.at=r3(t);} // an unloaded brood, lazily: its hatch by the clock, its losses by its mode's knob (BREED.survive, v11.74)
function lineLoad(ch){ // a cell loaded (chunks.js genChunk): every brood of the line that lies in it is put back — the clutch, or its living young
  if(!curSave||!curSave.line)return;const ci=ch.i*NCELL+ch.j;
  for(const L of curSave.line)for(const b of L.broods){if(b.cell!==ci||b._ch)continue;broodCatchUp(b);const n=Math.round(b.n);if(n<1){b.n=0;continue;}b._ch=ch;
    if(!b.hatched)broodEgg(ch,b);else{b.n=n;broodSpawn(ch,b,n);}}
}
function lineUnload(ch){ // a cell unloading (chunks.js unloadChunk), before its creatures and eggs go: each brood's count from what is alive in it
  if(!curSave||!curSave.line)return;
  for(const L of curSave.line)for(const b of L.broods){if(b._ch!==ch)continue;b.n=b.hatched?broodLive(b):b._egg?b._egg.n:0;b._ch=null;b._egg=null;b.at=r3(t);}
}
// ---------- death and the handover ----------
// the current life's living children, each where it is: a young in a loaded cell, a clutch on its floor, an unloaded brood at its clutch
function lineChildren(){const L=lineCur(),out=[];if(!L)return out;
  for(const b of L.broods){if(b._ch){if(b.hatched){for(const c of creatures)if(c.alive&&c.brood===b)out.push({b:b,c:c,p:c.pos});}else if(b._egg&&b._egg.n>=1)out.push({b:b,c:null,p:V3(b.pos[0],b.pos[1],b.pos[2])});}
    else{broodCatchUp(b);if(Math.round(b.n)>=1)out.push({b:b,c:null,p:V3(b.pos[0],b.pos[1],b.pos[2])});}}
  return out;}
// the nearest living child of the dead (the person, 21 Sep 2026); an unhatched clutch counts, and the world runs on to its hatch: every cell out
// (the living into the ledger, the broods to their records), the clock to the hatch, the model catching up over the next ticks (ecology.js)
function lineNext(from){
  for(let k=0;k<20;k++){const cs=lineChildren();if(!cs.length)return null;let best=null,bd=1e18;for(const x of cs){const d=x.p.distanceTo(from);if(d<bd){bd=d;best=x;}}
    if(best.c||best.b.hatched)return best;
    worldClear();t=Math.max(t,best.b.hatch)+0.01;clockH=t*CLOCK_RATE;TIDE=tideAt(clockH);}
  return null;}
function lineContinue(x,cause){ // you are the child now, where and as it is (LINEAGE §4.5): its age, its place, the parent's spec
  const L=lineCur(),b=x.b,spec=b.spec,gs=growS(spec),born=Math.min(b.hatch,t),grown=born+gs;let pos,yaw=player.yaw; // born: the hatch, or now if the clutch hatched early (a dev's hand on the egg's clock; seen v11.74 as an age of −0.35 d)
  if(x.c){const c=x.c;pos=c.pos.clone();T1.set(0,0,1).applyQuaternion(c.g.quaternion);yaw=Math.atan2(-T1.x,-T1.z);removeCreature(c);b.n=broodLive(b);}
  else{b.n=Math.max(0,b.n-1);pos=V3(b.pos[0],0,b.pos[2]);pos.y=groundAt(pos.x,pos.z)+2;}
  L.died=r3(t);L.cause=cause||'';
  curSave.line.push(lifeNew(spec,L.preset,curSave.line.length-1,born,grown));
  const C=lifeClade(lineCur(),lineScale(lineCur()));
  playerBody(C,pos,yaw,0);if(x.c){player.hunger=x.c.hunger;player.starveT=x.c.starveT;}cellsAround();snapMed=true; // the child's stomach as it was (v11.73); a hatchling's is full
  setTimeout(()=>{fadeEl.style.opacity=0;},300);sparkStart();saveNow();
}
// ---------- the sparkle (LINEAGE §7): the one mark of the magic, and here only at the handover ----------
// A four-point star on the screen with a short trail: it comes down from high in the view onto the child the camera now looks at, flickers
// like a candle's flame there and goes. starPath is the mark itself — one shape, so the save icon §7 asks for can be the same drawing. Nothing
// else in the game may show it (the rule of §7).
const SPARK={t:2.2,trail:16,r:14}; // s it lasts; points in its trail; px its radius at 1080 lines
let spark=null;const sparkEl=document.getElementById('spark');
function starPath(x,y,r,cx){cx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2,q=i&1?r*0.22:r;cx.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}cx.closePath();}
function sparkStart(at){spark={t:0,tr:[],at:at?at.clone():null};} // at: a place in the world it comes down on (the clutch, v11.72); none: the player (the handover)
function updateSpark(dt){
  if(!spark||!sparkEl)return;const cx=sparkEl.getContext&&sparkEl.getContext('2d');if(!cx){spark=null;return;}
  const W=innerWidth,H=innerHeight;if(sparkEl.width!==W||sparkEl.height!==H){sparkEl.width=W;sparkEl.height=H;}
  spark.t+=dt;const k=spark.t/SPARK.t;cx.clearRect(0,0,W,H);if(k>=1){spark=null;return;}
  T1.copy(spark.at||player.pos).project(camera);const tx=(T1.x*0.5+0.5)*W,ty=(-T1.y*0.5+0.5)*H,s=H/1080; // the child on the screen
  const m=Math.min(1,k/0.55),e=1-(1-m)*(1-m),x=tx+(W*0.18)*(1-e)*Math.cos(e*2.2),y=ty-(H*0.42)*(1-e); // down in a curl onto it, easing in
  spark.tr.push(x,y);if(spark.tr.length>SPARK.trail*2)spark.tr.splice(0,2);
  const fl=0.85+0.15*Math.sin(spark.t*37)*Math.sin(spark.t*23),a=k<0.55?1:1-(k-0.55)/0.45,r=SPARK.r*s*fl*(k<0.55?1:1+1.5*(k-0.55));
  cx.globalCompositeOperation='lighter';
  for(let i=0;i<spark.tr.length-2;i+=2){const f=i/spark.tr.length;cx.fillStyle='rgba(255,236,200,'+(0.35*f*a).toFixed(3)+')';cx.beginPath();cx.arc(spark.tr[i],spark.tr[i+1],2.2*s*(0.4+f),0,TAU);cx.fill();}
  cx.fillStyle='rgba(255,244,222,'+(0.9*a).toFixed(3)+')';starPath(x,y,r,cx);cx.fill();
  cx.fillStyle='rgba(255,255,255,'+a.toFixed(3)+')';starPath(x,y,r*0.45,cx);cx.fill();cx.globalCompositeOperation='source-over';
}
