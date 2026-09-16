// ecology.js — the world's population as a ledger (v11.26). Before this the world was frozen: a cell spawned the same animals
// every time it loaded, a kill came back at its home ninety seconds later, nothing was ever hungry and nothing was ever born.
// Now every cell (57,600 since v11.65; 256 when this was written) holds a count per spawn entry (creatures_defs.js SPAWN): the loaded cells spawn from it and write
// their living back into it when they unload, a death debits it, and the cells nobody is in run a small model every few seconds —
// births by allometry, predation by a saturating functional response, starvation, a slow drift into free capacity — so the world
// keeps turning where the player is not. The loaded cells run the same ecology live (creatures_ai.js: hunger, the kill, the
// carcass, the scavengers, the recruits growing up). DESIGN, The ecology, has the numbers and the reasons.
//
// The clock: a game day is 40 real minutes (world.js CLOCK_RATE) and the ecology's rates are per game day — compressed the way the
// tide and the sky are, so a session sees a turnover a real reef takes seasons over. The *ratios* are Earth's: a rate scales with
// mass^-1/4 (Fenchel: a flicker breeds sixty times as fast as a ridge), a hunger clock with mass^1/4, and a meal is a fraction of
// the biggest prey the hunter takes. Nothing here has a biome or a label; capacity is the envelope's tolerance summed over the cell.
const ECO_MAX_STEP=0.5; // game days the model will run in one tick; the rest is carried on POP.last (v11.33)
const ECO_STEP=3; // real seconds between ticks of the model
const ECO_CELLS=NCELL*NCELL,DAY_S=DAY_H/CLOCK_RATE; // cells; real seconds in a game day (2400)
// the knobs (per game day unless said): r0 the birth rate at unit mass, m the natural death as a fraction of r, cyc the hunger
// clock at unit mass (days from fed to starving), q0 a hunter's intake a day as a fraction of its own mass at unit mass (Earth's
// ectotherms: a few percent, less for the big), H how many days
// of one hunter's food a cell must hold for it to meet half its need, take the most of a prey kind a cell's hunters can take in a day,
// mig the fraction of a cell that drifts to its neighbours' free capacity in a day, starve the condition below which a hunter kind
// starves, juv the recruit's scale, grow the days a recruit at unit mass takes to grow up, hatch the days a clutch at unit mass takes
// to hatch, carc the days a carcass lasts untouched,
// hungry the hunger at which a live hunter starts to hunt, init the ledger's start as a fraction of capacity
const ECO={r0:0.12,m:0.1,cyc:0.5,q0:0.05,H:4,take:0.35,mig:0.03,starve:0.35,juv:0.55,grow:1.0,hatch:0.25,carc:0.45,hungry:0.4,init:0.85,initH:0.7};
// per kind, derived once: mass (size cubed — the game's unit is the metre), stock (the individuals one drawn one stands for: a ribbon
// of ten flickers is a shoal — the way the snow's points stand for more; only the small forage carries it), food (mass × stock, what
// eating one is worth), r, m, cycle, need (mass a day), meal (need × cycle: what fills it from starving), prey (kinds), mortal
const ECO_K={};
function ecoOf(kind){
  let k=ECO_K[kind];if(k)return k;const d=DEFS[kind],mass=bioMass(d),q=Math.pow(mass,0.25);
  const prey=d.prey?d.prey.filter(p=>p!=='player'&&DEFS[p]):[],stock=d.stock||1;
  const cycle=d.cycle!==undefined?d.cycle:ECO.cyc*q,r=d.r!==undefined?d.r:ECO.r0/q,need=d.need!==undefined?d.need:ECO.q0/q*mass,meal=d.meal!==undefined?d.meal:need*cycle;
  k={mass:mass,stock:stock,food:mass*stock,r:r,m:ECO.m*r,cycle:cycle,meal:meal,need:need,prey:prey,hunter:prey.length>0,mortal:d.hp<1e8||!!d.edible,grow:ECO.grow*q};
  if(kind!=='lab')ECO_K[kind]=k;return k;
}
// the ledger: per entry e of SPAWN a Float32Array over the cells — n the count, k the capacity, ke the capacity a hunter's prey
// allows (ecoModel: k times its response there — predators are where prey is), cd a hunter's condition (the
// fraction of its need it has met lately, 0..1), ow the births a *loaded* cell is owed and has not laid yet (v11.31.2: the model banks
// a loaded cell's growth there and not in n, since the living are the truth in a loaded cell and n follows them — ecoTick lays it as a
// clutch); done: the cell's capacity is known; tally: what has happened, for the readout
const POP={n:[],k:[],ke:[],cd:[],ow:[],done:new Uint8Array(ECO_CELLS),byKind:{},cells:[],mark:[],kcells:{},kmark:{},last:0,acc:0,births:0,deaths:0,kills:0,starved:0,eaten:0,recruits:0,laid:0,hatched:0,gen:null,model:null};
function ecoInit(){
  SPAWN.forEach((e,i)=>{POP.n[i]=new Float32Array(ECO_CELLS);POP.k[i]=new Float32Array(ECO_CELLS);POP.ke[i]=new Float32Array(ECO_CELLS);POP.cd[i]=new Float32Array(ECO_CELLS).fill(0.7);POP.ow[i]=new Float32Array(ECO_CELLS);(POP.byKind[e.kind]||(POP.byKind[e.kind]=[])).push(i);ecoOf(e.kind);POP.cells[i]=[];POP.mark[i]=new Uint8Array(ECO_CELLS);if(!POP.kcells[e.kind]){POP.kcells[e.kind]=[];POP.kmark[e.kind]=new Uint8Array(ECO_CELLS);}});
  POP.gen=ecoGen();
}
// The index (v11.65, ARCHIPELAGO step 4): the cells an entry has any capacity or count in, and a kind's union of its entries'. The world is
// 57,600 cells and the basin's floor is most of it, where two or three kinds live; every loop of the model, the settle and the drift walks
// these lists rather than the world, so the cost is the habitat's, not the map's (the tables stay dense: 24 MB of Float32, cheap to index).
// A cell joins a list when its capacity is first known (ecoCap) or later turns up above zero (a loaded cell's grid against the paper's 36
// samples); it never leaves — a stale member costs one skip. The lists are in the order the cells were known, so the model's sums run in
// a different order than the world's and its floats differ in the last places from v11.64's; the census's numbers are the same to the digit
// printed. ecoIndexAll rebuilds them from the tables (a save loading, save.js popLoad).
function ecoMark(ei,c){if(POP.mark[ei][c])return;POP.mark[ei][c]=1;POP.cells[ei].push(c);const kind=SPAWN[ei].kind,km=POP.kmark[kind];if(!km[c]){km[c]=1;POP.kcells[kind].push(c);}}
function ecoIndexAll(){for(let ei=0;ei<SPAWN.length;ei++){POP.cells[ei].length=0;POP.mark[ei].fill(0);}for(const k in POP.kcells){POP.kcells[k].length=0;POP.kmark[k].fill(0);}
  for(let ei=0;ei<SPAWN.length;ei++){const K=POP.k[ei],N=POP.n[ei];for(let c=0;c<ECO_CELLS;c++)if(K[c]>0||N[c]>0)ecoMark(ei,c);}}
// the capacity of a cell for every entry: the envelope's mean tolerance over a 6×6 grid (chunks.js cellW does the same from the
// cell's own grid; a cell nobody has loaded is sampled here, 36 samples at ~35 µs). The first time a cell is known its count starts
// at a fraction of capacity; a cell that is known on paper and then loaded keeps its count, rescaled to the grid's capacity
function ecoCap(c,ch){
  const i=Math.floor(c/NCELL),j=c%NCELL,x0=i*CELL-HALF,z0=j*CELL-HALF,first=!POP.done[c],rg=mulberry((c*7919+31337)>>>0);
  const hs=new Float32Array(36),sl=new Float32Array(36),fs=[];
  for(let b=0;b<6;b++)for(let a=0;a<6;a++){const n=b*6+a,x=x0+(a+0.5)/6*CELL,z=z0+(b+0.5)/6*CELL;
    if(ch){hs[n]=ch.h(x,z);sl[n]=ch.slope(x,z);fs.push(ch.f(x,z));}else{const s=sample(x,z);hs[n]=s.h;sl[n]=0;fs.push(s.f.slice());}}
  SPAWN.forEach((e,ei)=>{let w=0;for(let n=0;n<36;n++)w+=envW(e.env,hs[n],sl[n],fs[n]);let K=e.n*w/36;if(e.max!==undefined)K=Math.min(K,e.max);
    const k0=POP.k[ei][c];POP.k[ei][c]=K;POP.ke[ei][c]=K;
    if(first){POP.n[ei][c]=K*(ecoOf(e.kind).hunter?ECO.initH:ECO.init);POP.ow[ei][c]=rg()*Math.min(1,K)/Q.creatures;} // the owed birth starts at a random phase (v11.31.2): a population is not everywhere at the same point in its cycle, and every cell starting at zero was the whole reason the first clutch took two game days to appear. Over Q.creatures because a clutch is one animal the cell *shows*, so the low tier waits the same time for it
    else if(k0>1e-4)POP.n[ei][c]*=K/k0;else POP.n[ei][c]=Math.min(POP.n[ei][c],K);
    if(K>0||POP.n[ei][c]>0)ecoMark(ei,c);}); // the index (v11.65)
  POP.done[c]=1;
}
// the paper census of the unloaded world, 32 cells a step, run in the frame's gaps after boot (main.js); a cell that loads
// first is done from its grid (chunks.js) and skipped here
function* ecoGen(){for(let c=0;c<ECO_CELLS;c++){if(!POP.done[c])ecoCap(c,null);if((c&31)===31)yield;}ecoSettle(c=>chunkGrid[c]!==null);} // 32 cells a step since v11.58 (~1.3 ms; a cell is ~42 µs): the basin's 14,400 cells in eight seconds, not a minute
// the census done, the hunters of the unloaded cells start at what their prey allows (ke, from one step of the model), not at the
// envelope's full number — a ridge over a terrace with no grazers in reach was starving from the first day otherwise
function ecoSettle(isLoaded){ecoModel(1e-4,isLoaded);for(let ei=0;ei<SPAWN.length;ei++){if(!ecoOf(SPAWN[ei].kind).hunter)continue;const N=POP.n[ei],KE=POP.ke[ei],CL=POP.cells[ei];for(const c of CL)if(!isLoaded(c))N[c]=Math.min(N[c],KE[c]*0.8);}}
// what a loading cell spawns for an entry: the ledger's count, rounded by the cell's rng — and the ledger takes the rounding, so
// the living are the truth from here until the cell unloads
function ecoTake(ei,c,rng){const want=POP.n[ei][c]*Q.creatures,n=Math.floor(want)+(rng()<(want%1)?1:0);POP.n[ei][c]=n/Q.creatures;return n;}
// a cell unloading writes its living back (juveniles count); what died stays dead
function ecoWriteBack(ch){const c=ch.i*NCELL+ch.j;const cnt=new Float32Array(SPAWN.length);for(const o of ch.creatures)if(o.alive&&o.ent>=0)cnt[o.ent]+=1;
  for(let ei=0;ei<SPAWN.length;ei++)POP.n[ei][c]=cnt[ei]/Q.creatures;}
function ecoDebit(o){if(o.ent<0||!o.chunk)return;const c=o.chunk.i*NCELL+o.chunk.j;POP.n[o.ent][c]=Math.max(0,POP.n[o.ent][c]-1/Q.creatures);}
// ---------- the model ----------
// One step of dt game days over every known cell. First the biomass of every kind in every cell (food: mass × stock). Then the
// hunters of the unloaded cells eat by a type-III response — a hunter meets its need times A²/(A²+H²), A the prey biomass within its
// reach and H the biomass that meets half its need (ECO.H days of it), so a scarce prey has a refuge and the pyramid does not
// collapse. Its reach is its cell if it stays within 60 m of home, the 3×3 round it (the neighbours at half weight) if it ranges
// further, the 5×5 (the ring at a quarter) past 300 — the abyssal lives in the dark and hunts the combs on the plain above it. The
// take is spread over the prey kinds and cells by their weighted biomass, capped at ECO.take of any kind in any cell in a day, and
// the hunter kind's condition follows the fraction of its ask it got. Every mortal kind then breeds toward its capacity and dies at
// m; a hunter breeds by its condition and starves under ECO.starve. Loaded cells breed only: the living hunt, feed, starve and die
// there themselves, and the cell's growth is banked in POP.ow — the births it is owed — and laid as eggs (ecoTick; creatures_ai.js
// layEggs); nothing takes from a loaded cell on paper. Before v11.31.2 the growth went into n, where ecoDebit (a kill) and
// ecoWriteBack (an unload) put it straight back to the living: the surplus never reached a whole animal and no clutch was ever laid in
// a session (analysis_review 12). It is slow by design — a cell owes half a flicker a day — so ow has to survive an unload, and does.
// Then a drift: ECO.mig of every kind moves a day toward the four neighbours' free capacity. Immortal kinds sit at capacity.
const ECO_B={},ECO_TAKE={},ECO_D=[],ECO_RCH=[];
function ecoReach(kind){let r=ECO_RCH[kind];if(r)return r;const h=DEFS[kind].home||30;r=[];const R=h>=300?2:h>=60?1:0;
  for(let di=-R;di<=R;di++)for(let dj=-R;dj<=R;dj++){const m=Math.max(Math.abs(di),Math.abs(dj));r.push([di,dj,m===0?1:m===1?0.5:0.25]);}return ECO_RCH[kind]=r;}
// a generator (the tick steps it a piece a frame: 3.6 ms whole on a sandbox CPU for 256 cells; ~130 ms for the basin's 14,400, v11.58, in pieces under a millisecond); ecoModel drains it (the census)
function* ecoModelGen(dt,isLoaded){
  const E=SPAWN.length;
  for(const k in ECO_B){ECO_B[k].fill(0);ECO_TAKE[k].fill(0);}
  for(let ei=0;ei<E;ei++){const kind=SPAWN[ei].kind;let B=ECO_B[kind];if(!B){B=ECO_B[kind]=new Float32Array(ECO_CELLS);ECO_TAKE[kind]=new Float32Array(ECO_CELLS);}
    const N=POP.n[ei],food=ecoOf(kind).food,CL=POP.cells[ei];for(const c of CL)if(N[c]>0)B[c]+=N[c]*food;} // over the index (v11.65)
  // the hunt: the ask of every hunter entry in every unloaded cell, laid on its prey by weighted biomass
  for(let ei=0;ei<E;ei++){const K=ecoOf(SPAWN[ei].kind);if(!K.hunter)continue;const N=POP.n[ei],cd=POP.cd[ei],ke=POP.ke[ei],reach=ecoReach(SPAWN[ei].kind),CL=POP.cells[ei];
    for(let ci=0;ci<CL.length;ci++){const c=CL[ci];if(!POP.done[c]||isLoaded(c))continue;const n=N[c];if(n<=0&&POP.k[ei][c]<=0)continue;if((ci&2047)===2047)yield;const i=Math.floor(c/NCELL),j=c%NCELL; // v11.58: a cell with no capacity for the kind and none of it is skipped (the basin is most of the world); a piece every 2048 cells
      let A=0;for(const [di,dj,w] of reach){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=NCELL||jj>=NCELL)continue;const q=ii*NCELL+jj;for(const p of K.prey)A+=(ECO_B[p]?ECO_B[p][q]:0)*w;}
      const H=K.need*ECO.H,resp=A*A/(A*A+H*H+1e-9),I=n*K.need*resp*dt;if(n<=0){ke[c]=POP.k[ei][c]*(0.1+0.9*resp);continue;}cd[c]+=(resp-cd[c])*(1-Math.exp(-dt/1.5));ke[c]=POP.k[ei][c]*(0.1+0.9*resp); // the condition (trimmed below by what the prey could give) and the capacity the prey allows
      if(I>0&&A>0)for(const [di,dj,w] of reach){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=NCELL||jj>=NCELL)continue;const q=ii*NCELL+jj;for(const p of K.prey){const b=ECO_B[p]?ECO_B[p][q]*w:0;if(b>0)ECO_TAKE[p][q]+=I*b/A;}}}
    yield;}
  // the cap, and what it costs the hunters: a kind's take in a cell over ECO.take of its biomass a day is cut, and every hunter entry
  // in reach loses condition in proportion (approximately: by the cut on its own cell's prey)
  for(const p in ECO_TAKE){const T=ECO_TAKE[p],B=ECO_B[p],CL=POP.kcells[p]||[];for(const c of CL){const cap=B[c]*ECO.take*dt;if(T[c]>cap){const k=cap/T[c];T[c]=cap;
    for(let ei=0;ei<E;ei++){const K=ecoOf(SPAWN[ei].kind);if(!K.hunter||K.prey.indexOf(p)<0||POP.n[ei][c]<=0)continue;POP.cd[ei][c]*=1-(1-k)*(1-Math.exp(-dt/1.5));}}}yield;}
  for(let ei=0;ei<E;ei++){const e=SPAWN[ei],K=ecoOf(e.kind),CL=POP.cells[ei]; // per entry over its index (v11.65; per cell over every entry before)
    for(let ci=0;ci<CL.length;ci++){const c=CL[ci];if(!POP.done[c])continue;const loaded=isLoaded(c);
      const cap=K.hunter?POP.ke[ei][c]:POP.k[ei][c],ow=loaded?POP.ow[ei][c]:0;let n=POP.n[ei][c]+ow; // a loaded cell breeds from its living plus what it is already owed
      if(!K.mortal){POP.n[ei][c]=cap;continue;}
      if(!loaded&&n>0){const T=ECO_TAKE[e.kind][c];if(T>0){const t=T*n/ECO_B[e.kind][c];n=Math.max(0,n-t);POP.eaten+=t;}} // this entry's share of its kind's take, in individuals
      let grow;if(K.hunter){const cd=POP.cd[ei][c];grow=K.r*cd*(cap>0?1-n/cap:0);if(!loaded&&cd<ECO.starve){const lost=n*(0.35/K.cycle)*((ECO.starve-cd)/ECO.starve)*dt;n-=lost;POP.starved+=lost;}}
      else grow=K.r*(cap>0?1-n/cap:0);
      const b=Math.max(0,grow)*n*dt,d=K.m*n*dt;if(b>0)POP.births+=b;POP.deaths+=d;
      if(loaded){POP.ow[ei][c]=clamp(ow+b-d,0,Math.max(cap,1/Q.creatures));continue;} // owed, not banked: n there is the living (v11.31.2), and the natural death the live world never runs pays for the births it never runs either. The ceiling is the cell's capacity or one clutch, whichever is larger, so a rare kind can still owe its one
      n=n+b-d;
      if(!K.hunter&&cap>0&&n>cap*1.25)n=cap*1.25;POP.n[ei][c]=Math.max(0,n); // a hunter over its prey's allowance starves down, not clamped
      if((ci&63)===63)yield;}
  }
  // the drift, symmetric through a delta array: a kind leaves for a neighbour in proportion to that neighbour's free capacity
  for(let ei=0;ei<E;ei++){const K=ecoOf(SPAWN[ei].kind);if(!K.mortal)continue;const N=POP.n[ei],Cp=K.hunter?POP.ke[ei]:POP.k[ei];let D=ECO_D[ei];if(!D)D=ECO_D[ei]=new Float32Array(ECO_CELLS);D.fill(0);
    const CL=POP.cells[ei];for(const c of CL){if(!POP.done[c]||isLoaded(c))continue;const n=N[c];if(n<0.02)continue;const i=Math.floor(c/NCELL),j=c%NCELL;let f=0;
      for(let k=0;k<4;k++){const q=k===0?(i>0?c-NCELL:-1):k===1?(i<NCELL-1?c+NCELL:-1):k===2?(j>0?c-1:-1):(j<NCELL-1?c+1:-1);if(q<0||!POP.done[q])continue;
        const free=Cp[q]>0.05?Math.max(0,(Cp[q]-N[q])/Cp[q]):0;if(free>0){const m=ECO.mig*(K.hunter?1+4*(1-POP.cd[ei][c]):1)*dt*n*free*0.25;D[q]+=m;f+=m;}}D[c]-=f;} // a hungry hunter kind moves five times as readily
    for(const c of CL)N[c]=Math.max(0,N[c]+D[c]);yield;} // D is nonzero only on the index: a neighbour off it has no free capacity to draw
}
function ecoModel(dt,isLoaded){const g=ecoModelGen(dt,isLoaded);while(!g.next().done){}}
// ---------- the tick (main.js, once a frame) ----------
// runs the model every ECO_STEP real seconds over the game hours that passed, then squares the loaded cells with the ledger: where the
// ledger holds more of an entry than the cell has alive or in eggs, or the cell is owed births (POP.ow), the difference is a clutch (up to a group's worth)
// near an adult of its kind; the strand's scuttles and the floats, which lay nowhere the game can show, walk in out of sight
// (chunks.js placeKind with off:true), two a tick
const ECO_CNT=new Float32Array(64);
function ecoTick(dt0){
  if(POP.gen){const r=POP.gen.next();if(r.done)POP.gen=null;}
  if(POP.model){if(!POP.model.next().done)return;POP.model=null;} // a piece of the model a frame, the reconcile when it is done
  else{POP.acc+=dt0;if(POP.acc<ECO_STEP)return;const dtDays=(clockH-POP.last)/DAY_H;POP.acc=0;if(dtDays<=0)return;const use=Math.min(dtDays,ECO_MAX_STEP);POP.last=clockH-(dtDays-use)*DAY_H;POP.model=ecoModelGen(use,c=>chunkGrid[c]!==null);return;}
  for(const ch of chunks.values()){const c=ch.i*NCELL+ch.j;if(!POP.done[c])continue;ECO_CNT.fill(0);for(const o of ch.creatures)if(o.alive&&o.ent>=0)ECO_CNT[o.ent]+=1;for(const g of ch.eggs)ECO_CNT[g.ent]+=g.n;
    for(let ei=0;ei<SPAWN.length;ei++){const e=SPAWN[ei],K=ecoOf(e.kind);if(!K.mortal)continue;
      const gap=POP.n[ei][c]*Q.creatures-ECO_CNT[ei],ow=POP.ow[ei][c]*Q.creatures,extra=Math.floor(gap+ow+1e-4); // the ledger's own shortfall (a reload rounded down, a creature wandered out) plus the births the cell has been owed since it loaded, both in animals the cell actually shows (Q.creatures)
      if(extra>=1){const rng=mulberry((c*7919+ei*104729+(POP.laid|0)+(POP.recruits|0))>>>0);let got=0;
        if(e.land||DEFS[e.kind].surface){const g=placeKind(ch,e,Math.min(2,extra),rng,{ent:ei,juv:true,off:true});let r=g.next();while(!r.done)r=g.next();got=r.value||0;POP.recruits+=got;} // the strand's scuttles walk in
        else got=layEggs(ch,e,ei,Math.min(e.grp?Math.max(3,e.grp):3,extra),rng)||0;
        const fromOw=Math.max(0,got-Math.max(0,gap))/Q.creatures;if(fromOw>0){POP.ow[ei][c]=Math.max(0,POP.ow[ei][c]-fromOw);POP.n[ei][c]+=fromOw;}}}} // what the clutch took out of the owed goes into the ledger: the eggs are counted as living from here (ECO_CNT above)
}
function ecoReset(){POP.n.length=POP.k.length=POP.ke.length=POP.cd.length=POP.ow.length=POP.cells.length=POP.mark.length=0;POP.byKind={};POP.kcells={};POP.kmark={};POP.done.fill(0);POP.last=0;POP.acc=0;POP.model=null;POP.births=POP.deaths=POP.kills=POP.starved=POP.eaten=POP.recruits=POP.laid=POP.hatched=0;ecoInit();} // the ledger as at boot, the paper census to run again: a new game, or a save loading over it (save.js, v11.47) — with every cell unloaded first
ecoInit(); // the ledger exists before the first cell loads (main.js manageChunks); its paper census runs in ecoTick
// the readout's fourth line: the ledger's world totals for a few kinds and its tally; the nearest hunter's hunger
function ecoLine(){
  const tot=k=>{let s=0;for(const ei of (POP.byKind[k]||[])){const N=POP.n[ei];for(let c=0;c<ECO_CELLS;c++)s+=N[c];}return s;};
  let near=null,nd=1e9;for(const c of creatures){if(!c.alive||!ecoOf(c.kind).hunter)continue;const d=c.pos.distanceTo(player.pos);if(d<nd){nd=d;near=c;}}
  let done=0;for(let c=0;c<ECO_CELLS;c++)done+=POP.done[c];
  let owed=0;for(const ch of chunks.values()){const c=ch.i*NCELL+ch.j;for(let ei=0;ei<SPAWN.length;ei++)owed+=POP.ow[ei][c];} // what the loaded cells have coming (v11.31.2): it climbs between clutches and drops when one is laid
  return 'eco '+done+'/'+ECO_CELLS+'  flicker '+tot('flicker').toFixed(0)+'  darter '+tot('darter').toFixed(0)+'  grazer '+tot('grazer').toFixed(0)+'  rasp '+tot('rasp').toFixed(0)+'  eel '+tot('eel').toFixed(1)+'  ridge '+tot('ridge').toFixed(1)+'  ortho '+tot('ortho').toFixed(1)+'  sickle '+tot('sickle').toFixed(1)+'  abyssal '+tot('abyssal').toFixed(1)
    +'  born '+POP.births.toFixed(0)+'  died '+POP.deaths.toFixed(0)+'  eaten '+POP.eaten.toFixed(0)+'  starved '+POP.starved.toFixed(0)+'  kills '+POP.kills+'  laid '+POP.laid+'  hatched '+POP.hatched+'  owed '+owed.toFixed(1)+'  eggs '+eggs.length+'  carcasses '+carcasses.length
    +(near?'  '+near.kind+(near.def.juv?' (juv)':'')+' '+nd.toFixed(0)+'m hunger '+near.hunger.toFixed(2)+' '+near.state:'');
}
