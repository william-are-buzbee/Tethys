// combat.js — how combat happens (v11.31). Before this a bite was a number subtracted when two centres came within `reach`: the
// bodies had real shapes and contact (physics.js) and the fight ignored them. Now a fight is a hold. Nothing here eats or kills by
// itself: a predator that reaches its prey takes hold of it — jaws (slowbloods), the arms closing on what the beak is at (ringmouths),
// claws or the plate mouth as a clamp (hingeshells) — and the hold is a rope between the holder's grip and a point on the held
// body's own hit capsule, solved after the bodies have pushed apart, the lighter one dragged more. The held one goes on being what it
// is (its steering is untouched: a grazer keeps trying to flee, the player keeps swimming) and that is the struggle: the velocity
// the rope has to take off it is a force on the grip, and a grip has a strength by the holder's mass. A hold breaks when the struggle
// outlasts the grip, or when the holder loses interest (its target changes — the ink, the stun, boredom at a withdrawn shell — the
// AI is untouched, it decides whom to want; this decides what having it means), or when the held dies. Forage (hp ≤ 1) is taken as before,
// at the first touch — a hold is for prey that can fight. The player's grab (right mouse or r, held) is the same hold with the
// clade's grip, and its bite while holding is a bite on what it holds. Blood is the clade's (PLANET: copper, iron, vanadium), a pooled point cloud
// that drifts with the water and the bodies. Where the numbers are: GRIP (the knobs by kind), WHOLE.
// v11.55 (COMBAT.md, pass 2 — the states): there are no hit points. A fight asks three questions of the two builds — can I swallow it (the gape by
// geometry, GAPE_K), can I keep hold of it (the struggle as before, and a hold kept past its pin time with the struggle under PIN.pull is a pin),
// does my edge get through its covering where I hold it (EDGE) — and the answer is a state, not a number. The chemistry (§3b): a holder's first
// bite carries its venom — the lurker's and the coilshell's paralysis pins at once — and a jaw or arms on a spined slowblood (the basker, the
// grazer) is stung off it (STING). A ringmouth about to be pinned drops the held arm (AUTOTOMY; the person, 15 Sep 2026: automatic) and it regrows
// by the clock. The player's death ends the slot's animal (save.js slotDeath).
// v11.91 (COMBAT.md §10, pass A — the wound and the blood; the person, 24 Sep 2026, after hours as the finback: blood with no damage done, blood not
// by the injury, no bleeding out, the hunter leaving after a tail). One mass, in kilograms, derive's (kgOfBody). A bite in the hold is the edge on the
// capsule the hold is on (biteOn → cutAt): nothing through the covering is a bruise — felt, no blood; through, the geometry decides — a limb's capsule
// is severed when the bite's radius ρ (EDGE_RHO × the gape) reaches SEVER of its radius, the trunk is opened to the vitals when ρ reaches VITAL.core of the
// capsule's radius along its front (or VITAL.nape at the nape, where the cord runs shallow), else it is a wound of area (ρ/r)² that bleeds. Blood is a
// volume (BLOOD: a share of the mass by clade); a wound drains a share of it a second by its area, the part's vessels and the clade's pressure, and
// clots on the clade's clock stretched by its size; the loss weakens (bloodK), collapses and at BLOOD.dead kills — "bled out". A piece is food by its
// share of the body (feedPiece), and a hunter keeps its target after one. dmg, GRIP.first/bite/bleed, HOLD_BIG, WOUND_SLOW, FLEE, LOSE.meal and
// LOSE.floor are gone. Contact and the hold as a joint are pass B; the edge's force against the covering's toughness (the verdict table's successor) pass C.
const holds=[]; // {a: holder, b: held, K: GRIP[kind], la: the grip in a's frame, lb: the hold point in b's frame, len: the rope, biteT, load, pull, t}
// by the way a body takes hold (creatures_spec.js compile → b.grip). k: the grip's strength, newtons per kg^(2/3) of the holder (muscle scales with
// cross-section; v11.91: the mass is kilograms now, and the struggle F = m_held·Δv/dt is newtons — a 3 t white shark clamps at ~18 kN, which is ~85
// per kg^(2/3); the claws' lever is the strongest per section, the arms the weakest. v11.92: the joint takes the held body's whole thrust off it every frame —
// a fresh finback from rest is 3 g, 55 kN — so k is five times v11.91's: an eel holds a fresh finback for seconds, not for good; the stamina that makes the
// struggle fade is pass C); cd: seconds between bites in the hold; slow: what the held
// player's swimming speed is multiplied by (arms round you slow you most); shake: the jerk (m/s) a bite gives the held
const GRIP={
  jaw:{k:450,cd:1.5,slow:0.75,shake:2.5},
  arms:{k:350,cd:0.9,slow:0.55,shake:0.8},
  claws:{k:650,cd:0.7,slow:0.7,shake:1.2}
};
// The edge against the covering (v11.54, COMBAT.md §2 — pass 1 of injury as states): what a hold can do where it is. A body's edge and the
// covering of each of its hit capsules are read off its spec by compile (b.edge, b.cover, b.gape); a hold records the capsule it took (h.ci),
// the covering there and the verdict (h.thru). v11.91: the verdict says whether the edge opens the covering at all; what the bite then does is
// the geometry (cutAt). Pass C replaces this table with the edge's force against the covering's toughness (COMBAT.md §10.5).
// yes: through; nape: only at a pinned animal's nape; joint: only at a joint of the armour; thrash: with the body's thrash; time: given time; no
const EDGE={
  beak:{skin:'yes',hide:'nape',plate:'joint',shell:'joint'}, // cuts pieces from what the arms hold; the kill is one placed bite at the nerve cord
  rasp:{skin:'yes',hide:'no',plate:'no',shell:'time'}, // latches (the lamprey); drills a shell (the octopus)
  hold:{skin:'no',hide:'no',plate:'no',shell:'no'}, // plain petals: a clamp that ends in a swallow or a release
  cut:{skin:'yes',hide:'thrash',plate:'no',shell:'no'}, // cutting petals: a piece torn out, the hide with a thrash
  point:{skin:'yes',hide:'yes',plate:'no',shell:'no'}, // a needle jaw or spears: skewers
  crush:{skin:'yes',hide:'yes',plate:'yes',shell:'yes'}, // the crusher's plate jaw
  shred:{skin:'yes',hide:'no',plate:'joint',shell:'no'}, // the hingeshells' mouthparts: dismember at the joints
  claws:{skin:'yes',hide:'no',plate:'joint',shell:'no'}, // the hard grip: holds what is slower
  ram:{skin:'no',hide:'no',plate:'no',shell:'no'} // a blow: the stun, nothing through
};
function edgeOf(o){return (o.b&&o.b.edge)||null;}
function coverAt(o,i){if(o===player){if(player.soft)return 'skin';if(player.shut)return 'shell';}const C=o.b&&o.b.cover;return C&&C.length?(C[i]||C[0]):'skin';} // the player's state first (v11.75–76): through the moult it is skin to every edge, as the world's soft body is (creatures_ai.js spawn); shut, its valves are shell over everything
function thruOf(edge,cover){const E=EDGE[edge];return E?(E[cover]||'no'):'no';}
let bpIdx=-1; // the capsule bodyPointNear last chose (an index into shapesW, which is the hit list's order)
const WHOLE=0.12,WHOLE_P=0.25; // forage up to this share of the eater's mass is swallowed whole at the touch (the creatures; the player's gulp is WHOLE_P — arrows and needles, not a picker, which is killed and eaten at)
// the states' knobs (v11.55)
const PIN={t:2.5,pull:0.5,mass:0.6,bored:8}; // pinned: a hold kept t seconds × (m_held/m_holder)^mass (0.3..3) with the struggle under pull of the grip; bored: a hunter's cooldown when its edge can do nothing where it holds
const GAPE_K=1.15; // a mouth swallows a body whose widest capsule is under gape × this (prey deform; a fish takes prey to about its mouth's width)
const BLEED_T={ringmouths:6,slowbloods:14,hingeshells:3,drifters:4}; // seconds a wound's rate falls by e (the clotting time), by clade (a ringmouth clots fast, a slowblood slowly, a hingeshell barely bleeds); a big wound stretches it (BLOOD.clot)
const STING={t:0.45,slow:0.5,dur:6,cool:6,mass:4}; // a jaw or arms on a spined slowblood: a holder under mass × the spined body's mass lets go after t seconds, swims at slow for dur, waits cool before it hunts again (a ridge on a grazer swallows the spines)
const AUTOTOMY={keep:2,regrow:5,cool:6}; // a ringmouth drops a held arm (never its last keep), it regrows in regrow game days; the holder keeps the arm (a cooldown; the arm feeds it by its share)
const LOSE={cool:4,flee:12,parts:{tail:1,fins:1}}; // pass 3 (v11.57, COMBAT.md §2): a part torn off instead of the life — which parts a hold can take (the ones with their own capsule: the tail), the hunter's moment with its mouthful, how long a crippled hunter flees
// pass 4 (v11.56, COMBAT.md §4–5): the trail, the miss, the poison
const SMELL_R=90; // m: a hungry hunter takes a bleeding body it eats as its target this far off, past its detect — the wound you survived is what brings the next hunter. v11.91: for a wound at BLOOD.qRef; by the square root of the rate, at most twice
// the strike (v11.92, COMBAT.md §10.3, pass B — contact, not reach). dur: the committed lunge, s — the heading locked on the point aimed, a burst at the sprint; steer: the turn rate's
// share in it (it overshoots a late dodge and comes round on its turning radius); coast: s it coasts past on a miss before the chase resumes; cool: bite cooldowns a miss costs;
// slack: the mouth's sphere as a multiple of the gape (prey deform, the jaws close a little past the mouth); suck: a plain jaw's (hold petals: suction) reach in gapes for what it
// can swallow — the only reach an engulfer has; cone: cos of the half-angle ahead the mouth bites within; lead: s of the prey's velocity the chase aims ahead, at most;
// range: s of the sprint the commit is judged over (strikeRange). MISS (v11.56–91), the dodge across the strike's line as a rule, is gone: the miss is geometry
const STRIKE={dur:0.6,steer:0.5,coast:0.5,cool:1.5,slack:1.3,suck:2,cone:0.5,lead:0.8,range:0.3,face:0.55,runup:5}; // face: cos of the angle within which the prey must be ahead for a hunter to commit (or a striker to cock); runup: m past the mouth's distance a jaw hunter backs off to when its prey is beside it, to come at it again
const PLAYER_BITE=1.0; // m past the mouth's sphere the player's own bite and grab find their target (the click's convenience; the AI has none)
const POISON={heat:0.45,deep:CHEMO+10,load:0.4,clear:3,min:0.35,t:45,slow:0.5}; // hingeshells feeding where the sulfur line lives (heat over this, or below the chemocline) carry its toxin: full after load game days there, clear again after clear days away; a body over min sickens whatever eats it or its carcass for t seconds at slow (unless immune: the abyssal on its combs)
const RAM={stun:2.5,cool:3,daze:2}; // the ram's blow (v11.66; COMBAT.md §2: `weapon:ram` is a blow, nothing through): a strike that lands on what the mouth cannot take whole is a knock, not a hold — the body stunned stun s (steering gone, sinking: creatures_ai.js), the player dazed daze s (the sting's slowness, no wound), the ram off it for cool s
const PLAYER_GRIP={soft:1.2,fin:1.0,coil:0.6}; // the clades' grips: the jetter's arms are for this; the coilshell's are short
const BLOOD_COL={ringmouths:[0.16,0.24,0.34],slowbloods:[0.32,0.03,0.03],hingeshells:[0.52,0.5,0.32],drifters:[0.6,0.6,0.6]}; // copper, iron, vanadium (PLANET)
// ---------- the wound and the blood (v11.91, COMBAT.md §10.5–6, pass A) ----------
// The bite's radius ρ by the edge, as a share of the mouth's gape: the piece an edge takes out. cut: a crescent the size of the mouth (a shark's bite);
// crush: the covering broken whole under the gape; beak: the beak's R; claws: a pinch the mouth's size (the pull at a joint is pass C); shred: slow
// pieces; rasp: the disc; point: a puncture — its width nil, its depth the needle's or the spear's length (pointDepth); hold and ram take nothing
const EDGE_RHO={cut:0.8,crush:1,beak:1,claws:1,shred:0.7,rasp:1,point:0.35,hold:0,ram:0};
// the vitals as depth into the struck capsule, a share of its radius: the nerve cord and the heart on the axis (core) along the trunk's front — the
// capsule's length from `front` of the way from its tail end to its nose end — and shallow at the nape (from nape0 to nape1 of the capsule's length,
// behind the head, dorsal: the biter's mouth over napeY × r above the axis), which is why a beak kills there (COMBAT.md §3); the face past nape1 is
// the skull, core-deep. A bite (or a point's depth) past the vitals where it bit is the kill. Arms that have pinned a body have turned it: their
// placed bite is at the nape wherever the hold was taken (the ringmouths' kill, §3)
const VITAL={core:0.75,nape:0.3,front:0.4,nape0:0.55,nape1:0.8,napeY:0.25};
const SEVER=0.7; // a bite whose radius reaches this share of a limb's capsule radius (a part with its own capsule: the tail, a fin) takes the limb off at the root
const TORN=0.25; // the share of a body's mass taken from it in pieces at which it is dead — torn apart: the vitals are reached somewhere (a bite short of the axis is a piece, not a kill, and pieces add)
// blood as a volume. vol: the blood as a share of the body's mass by clade (slowbloods: iron, closed, low pressure — the metabolism they lack; ringmouths:
// copper, closed, high pressure; hingeshells: vanadium, an open haemocoel, barely driven); press: the clade's pressure on a wound's rate; vessel: the
// vessels by the part struck (the root of a torn-off tail or fin pours; a fin's web and an arm barely; punct: a puncture); k: the rate a wound of unit
// area (ρ = the trunk's radius) drains, a share of the volume a second; clot: the area at which the clade's clotting time is doubled (a torn-off tail
// runs on, a graze stops in seconds); weak/collapse/dead: the loss (0..1 of the volume) at which the body weakens (thrust, turn and grip falling to half),
// collapses (a fifth of its speed, no burst, no ability) and dies — the hemorrhage classes, the same shape in fish and cephalopods; refill: game days
// fed to make the blood back; max: wounds kept per body (the smallest merged away); near: m a body's last wounder is credited with its bleeding out from;
// qRef: the rate SMELL_R is set at (an eel's flank bite on the finback); trail: points a second per unit rate; burst: points at the wound per unit rate
const BLOOD={vol:{ringmouths:0.06,slowbloods:0.04,hingeshells:0.20,drifters:0.02},press:{ringmouths:1.3,slowbloods:1,hingeshells:0.3,drifters:0.5},vessel:{trunk:1,head:1.2,root:1.5,tail:1,fins:0.5,arms:0.6,punct:0.3},k:0.05,clot:0.25,weak:0.15,collapse:0.30,dead:0.40,refill:{ringmouths:1,slowbloods:4,hingeshells:2,drifters:1},max:6,near:40,qRef:0.0086,trail:170,burst:700};
// One mass (COMBAT.md §10.2): derive's, in kilograms — the build's volume at the world scale × the clade's density (tonnes) × 1000, per kind once; a
// body's by its build's scale against the species' (a juvenile, the size band). bodyMass (size³) is the ledger's unit and no longer a physical one.
// A kind with no spec (the swarm, a ghost) falls back on it, scaled; nothing without a spec ever fights
const KG={};
function kgOfKind(kind,def){let m=KG[kind];if(m!==undefined)return m;const sp=(def&&def.spec)||specOfKind(kind);let tn=0;if(sp){try{tn=derive(sp).mass;}catch(e){tn=0;}}m=tn>0?tn*1000:Math.max(1,bodyMass(def||DEFS[kind]||{size:1})*300);if(kind!=='lab')KG[kind]=m;return m;} // the lab's placed creature is one kind for every spec: never cached (as ecoOf)
function kgOfBody(kind,def,b){const sp=(def&&def.spec)||specOfKind(kind),s0=sp?(sp.s||1):1,s=b&&b.g?b.g.scale.x/s0:1;return kgOfKind(kind,def)*s*s*s;}
function kgOf(o){return o===player?player.mass:(o.mass0||o.mass);} // a body's own mass (a sitting ambusher's contact mass is 1e6: creatures_ai.js)
function massOf(o){return o===player?player.mass:o.mass;} // the contact mass (creatures_ai.js): a hold is a struggle between two bodies
function cladeOf(o){if(o===player)return player.clade?player.clade.spec.clade:'ringmouths';const sp=specOfKind(o.kind);return sp?sp.clade:'hingeshells';}
function gapeOf(o){return (o.b&&o.b.gape)||0;}
function rhoOf(o){const e=edgeOf(o);return (EDGE_RHO[e]||0)*gapeOf(o);}
// a point's depth: the needle jaw's petals or the spears' length at the world scale (a spec part's reach as the kit built it)
function pointDepth(o){if(o.pointD!==undefined)return o.pointD;const b=o.b,sp=b&&specOf(o);let d=0;if(sp){const s=b.g.scale.x;let f=null;try{f=fillSpec(sp);}catch(e){f=null;}if(f)f.parts.forEach((p,i)=>{if(p.kind==='weapon'&&p.style==='spears'){const r=b.built&&b.built[i];if(r&&r.reach)d=Math.max(d,r.reach*s);}else if(p.kind==='mouth'&&p.style==='tentacles'&&p.edge==='point')d=Math.max(d,(p.len||0)*s);});}o.pointD=d;return d;}
function foodOf(o){return o===player?ecoOf(lineKind(player.clade.spec)).food:ecoOf(o.kind).food;} // what a whole body is worth to an eater (the ledger's food; the player by its line kind)
// a piece of b is a's: its share of b's food over a's meal (as a kill feeds, creatures_ai.js kill). A body fed at the seeps sickens the eater instead (POISON)
function feedPiece(a,b,share){if(!a||!(share>0))return;if(b!==player&&b.poison>POISON.min&&!(a!==player&&a.def.immune)){if(!(a.sickT>0))sicken(a);return;}if(!feeds(a))return;const K=eaterK(a);a.hunger=Math.max(0,a.hunger-Math.min(1,share)*foodOf(b)/K.meal);a.starveT=0;}
function pieceShare(o,rho){return Math.min(0.3,4.19*rho*rho*rho*1050/Math.max(1,kgOf(o)));} // a bite's volume as a share of the body (flesh at 1.05 t/m³)
function trunkR(o){return widestR(o)||0.5;}
function bloodK(o){const L=o.blood||0;return L<BLOOD.weak?1:L<BLOOD.collapse?lerp(1,0.5,(L-BLOOD.weak)/(BLOOD.collapse-BLOOD.weak)):L<BLOOD.dead?lerp(0.5,0.2,(L-BLOOD.collapse)/(BLOOD.dead-BLOOD.collapse)):0.2;} // the loss on the body: whole under weak, half by collapse, a fifth at the edge of death
function collapsed(o){return (o.blood||0)>=BLOOD.collapse;} // no burst, no ability, no struggle to speak of
// the mouth on a covering it cannot open: felt (the flinch, the flash), nothing opened, no blood
function bruise(o,by,at){if(o===player){if(!player.dead)hurtPlayer(0,null);}else hitFx(o,by,at,2);thump(0.25,100,45,o===player?null:at,0.8,0.05);}
// a blow (the ram's, the great's): a shove and a daze, no wound
function blow(o,by){let dv=RAM.stun*3;if(by&&by.pos){T4.copy(o.pos).sub(by.pos);const l=T4.length()||1;T4.multiplyScalar(1/l);const ma=massOf(by),mb=massOf(o),vn=Math.max(0,by.vel.dot(T4));dv=clamp(2*ma/(ma+mb)*vn,2,12);if(o!==player||!player.withdrawn)o.vel.addScaledVector(T4,dv);} // the impulse (v11.92): an elastic knock by the striker's speed and the masses
  if(o===player){if(playerGone()||player.withdrawn)return;hurtPlayer(0,null);player.stungT=Math.max(player.stungT||0,RAM.daze*clamp(dv/6,0.5,1.5));}else{if(!o.alive)return;o.stun=Math.max(o.stun||0,clamp(dv/3,0.8,RAM.stun*1.6));hitFx(o,by,o.pos,6);}}
// an opening of radius rho on capsule ci of o: a wound that bleeds. Its rate is a share of the body's blood a second by its area (against the trunk's
// radius), the part's vessels and the clade's pressure; it clots on the clade's clock, stretched by its size; the burst and the trail follow the rate
function openWound(o,by,ci,rho,at,vessel){const cl=cladeOf(o),rT=trunkR(o),a=Math.min(4,(rho/rT)*(rho/rT))*(vessel||1)*(BLOOD.press[cl]||1),q=BLOOD.k*a,tau=(BLEED_T[cl]||6)*(1+a/BLOOD.clot);
  const w={ci:ci,at:worldToLocal(o,at,[0,0,0]),q:q,tau:tau,by:by||null,tT:0};
  const W=o.wounds||(o.wounds=[]);W.push(w);if(W.length>BLOOD.max){W.sort((x,y)=>y.q-x.q);W.length=BLOOD.max;}
  o.bleed=(o.bleed||0)+q;o.lastHurt=t;
  bloodBurst(at,clamp(Math.round(q*BLOOD.burst),2,24),cl);hitFx(o,by,at,clamp(q*1500,4,24));
  if(o===player){if(!player.dead)hurtPlayer(0,null);}else thump(clamp(0.15+q*20,0.15,0.5),110,45,at,0.9,0.05);
  return w;}
// the kill by the edge where it bit: through the vitals
function killAt(o,by,at,edge,act){const cl=cladeOf(o);bloodBurst(at,16,cl);hitFx(o,by,at,24);thump(0.6,90,40,o===player?null:at,1,0.1);
  if(o===player){die((act||actOf(edge))+' by a '+(by===player?'player':by?by.kind:'bite'));return;}
  kill(o,by,false);}
const WL=[0,0,0],WL2=[0,0,0];
// the edge on the body at capsule ci, at the world point `at` (COMBAT.md §10.5): a limb severed or wounded; the trunk or the head opened to the vitals
// (the kill) or wounded — a wound of area (ρ/r)², and the piece is the biter's. from: where the biter's mouth is (the hold point is on the capsule's
// axis, so which side the bite came from is read off the mouth: dorsal is the nape's side). Returns what it did
function cutAt(o,by,ci,at,edge,rho,pd,from,atNape){
  const W=o.shapesW,r=W&&W[ci]?W[ci].r:trunkR(o),pi=partUnder(o,ci),H=o.b&&o.b.hit&&o.b.hit[ci];
  if(losable(o,pi)){ // a limb: off at the root, or a wound on it
    if(rho>=SEVER*r){const share=losePart(o,pi,by,at);feedPiece(by,o,share);if(o===player||o.alive)openWound(o,by,ci,Math.min(rho,r),at,BLOOD.vessel.root);return 'severed';}
    const sp=specOf(o),kind=sp&&sp.parts[pi]?sp.parts[pi].kind:'tail';openWound(o,by,ci,rho,at,BLOOD.vessel[kind]||1);feedPiece(by,o,pieceShare(o,rho)*0.5);return 'wound';}
  const lb=worldToLocal(o,at,WL),lf=from?worldToLocal(o,from,WL2):lb;let frac=0.5,dorsal=false;
  if(H){const z0=Math.min(H.a[2],H.b[2]),z1=Math.max(H.a[2],H.b[2]);frac=z1>z0+1e-6?clamp((lb[2]-z0)/(z1-z0),0,1):0.5;dorsal=lf[1]>VITAL.napeY*H.r;}
  const nape=atNape||(frac>=VITAL.nape0&&frac<=VITAL.nape1&&dorsal),front=frac>=VITAL.front,depth=edge==='point'?pd:rho,need=(nape?VITAL.nape:VITAL.core)*r;
  if((nape||front)&&depth>=need){killAt(o,by,at,edge);return 'killed';}
  if(edge==='point'){openWound(o,by,ci,rho,at,BLOOD.vessel.punct);return 'wound';}
  openWound(o,by,ci,rho,at,frac>VITAL.nape1?BLOOD.vessel.head:BLOOD.vessel.trunk);const sh=pieceShare(o,rho);feedPiece(by,o,sh);o.eaten=(o.eaten||0)+sh;
  if(o.eaten>=TORN){killAt(o,by,at,edge,'torn apart');return 'killed';}return 'wound';}
// a bite in a hold: the holder's edge on the held at the capsule the hold is on. placed: the pin's condition is met (a nape bite, the thrash — the
// verdicts that need the body pinned). Nothing through: a bruise, and false
function biteOn(h,placed){const a=h.a,b=h.b;if(b!==player&&!b.alive)return null;if(b===player&&playerGone())return null;
  const at=h.near&&h.at?h.at:localToWorld(b,h.lb,HP1);
  if(b===player&&player.withdrawn){if(a!==player)a.bored++;return false;}
  if(b!==player&&b.def.hp>=1e8){if(a!==player)a.bored++;bruise(b,a,at);return false;}
  const v=h.thru,from=localToWorld(a,h.la,HP2);let thru=v==='yes'||(placed&&v==='thrash'),atNape=false;
  if(v==='nape'&&placed){if(h.kind==='arms')thru=atNape=true;else{const lb=worldToLocal(b,at,WL),lf=worldToLocal(b,from,WL2),H=b.b&&b.b.hit&&b.b.hit[h.ci];if(H){const z0=Math.min(H.a[2],H.b[2]),z1=Math.max(H.a[2],H.b[2]),fr=z1>z0+1e-6?(lb[2]-z0)/(z1-z0):0.5;thru=fr>=VITAL.nape0&&fr<=VITAL.nape1&&lf[1]>VITAL.napeY*H.r;}}} // the beak gets in only at the nape: arms that have pinned the body have turned it there; a jaw only if the hold is behind the head with the mouth over the back
  if(!thru){bruise(b,a,at);return false;}
  return cutAt(b,a,h.ci,at,h.edge,rhoOf(a),pointDepth(a),from,atNape);}
// what follows a bite in a hold: a severed limb is a mouthful — the hold let go, a moment with it (LOSE.cool), the target kept while the biter is hungry (it
// comes back for the rest, COMBAT.md §10.5) and dropped fed; a placed verdict (the nape, the thrash) that did nothing where it holds lets the hunter go
function afterBite(h,r){const a=h.a;if(holds.indexOf(h)<0)return;if(r==='severed'){releaseHold(h);if(a===player)player.grabCD=0.8;else{a.biteT=LOSE.cool;if(a.hunger<ECO.hungry)dropTarget(a,LOSE.cool);}return;}if(a!==player&&h.placed&&r===false)dropTarget(a,PIN.bored);}
// ---------- contact, not reach (v11.92, COMBAT.md §10.3, pass B) ----------
// the mouth is a sphere at the mouth part (the grip's point), its radius the gape × STRIKE.slack, biting within STRIKE.cone of the body's axis: a jaw's bite lands when it
// touches one of the prey's hit capsules — the capsule it touches is where the bite is. A plain jaw (hold petals) sucks: a body it can swallow is drawn from STRIKE.suck
// gapes. pad: m past the sphere (the player's convenience, PLAYER_BITE). A body with no capsules this frame falls back on the reach
function mouthOn(a,b,pad){const g=gripOf(a);if(!g)return false;if(a!==player){a.g.position.copy(a.pos);a.g.updateMatrix();} // the hunter's own frame this frame too: past the near list nothing else composes it, and a far hunt must still land
  if(b!==player){b.g.position.copy(b.pos);b.g.updateMatrix();worldShapes(b);b.shapeF=frameNo;} // this frame's capsules, whatever the stamp says (a body moved since its refresh)
  const W=b.shapesW;if(!W||!W.length)return a.pos.distanceTo(b.pos)<reachOf(a,b);
  const m=localToWorld(a,g.at,HP2),gp=gapeOf(a),R=gp*STRIKE.slack+(pad||0)+(edgeOf(a)==='hold'&&swallows(a,b)?gp*STRIKE.suck:0),e=a.g.matrix.elements,fl=len3(e[8],e[9],e[10])||1;
  for(const c of W){const ex=c.bx-c.ax,ey=c.by-c.ay,ez=c.bz-c.az,l2=ex*ex+ey*ey+ez*ez;let qx=c.ax,qy=c.ay,qz=c.az;if(l2>1e-6){const tt=clamp(((m.x-c.ax)*ex+(m.y-c.ay)*ey+(m.z-c.az)*ez)/l2,0,1);qx+=ex*tt;qy+=ey*tt;qz+=ez*tt;}
    if(len3(m.x-qx,m.y-qy,m.z-qz)-c.r>R)continue;const vx=qx-a.pos.x,vy=qy-a.pos.y,vz=qz-a.pos.z,vl=len3(vx,vy,vz)||1;if((vx*e[8]+vy*e[9]+vz*e[10])/(fl*vl)>=STRIKE.cone)return true;}
  return false;}
function noseD(o){const g=gripOf(o);if(!g)return 0;const s=o.b&&o.b.g?o.b.g.scale.x:1;return len3(g.at[0],g.at[1],g.at[2])*s;} // how far ahead of the centre the mouth is (m)
// the point a jaw hunter steers for: the mouth's distance short of the prey along its own facing — from there its mouth is on the prey; beside the prey it swings round for it (T3 scratch)
function approachPt(c,aim,out,tpos){const g=gripOf(c);if(!g||g.kind!=='jaw')return out.copy(aim);const nd=noseD(c),dist=c.pos.distanceTo(tpos),runD=nd+STRIKE.runup;
  if(!mouthAhead(c,tpos,STRIKE.face)&&dist<runD*0.9){const dx=c.pos.x-tpos.x,dy=c.pos.y-tpos.y,dz=c.pos.z-tpos.z,l=len3(dx,dy,dz)||1;return out.set(tpos.x+dx/l*runD,tpos.y+dy/l*runD,tpos.z+dz/l*runD);} // the prey beside or behind the mouth: out to the run-up point on its own side of the prey, then round at it
  T3.set(0,0,1).applyQuaternion(c.g.quaternion);return out.copy(aim).addScaledVector(T3,-nd*0.9);}
// is the prey ahead of the mouth (a jaw), within cos `k` of the body's axis
function mouthAhead(c,tpos,k){const g=gripOf(c);if(!g||g.kind!=='jaw')return ahead(c,tpos,k);const m=localToWorld(c,g.at,HP2);T3.set(0,0,1).applyQuaternion(c.g.quaternion);const vx=tpos.x-m.x,vy=tpos.y-m.y,vz=tpos.z-m.z,l=len3(vx,vy,vz)||1;return (vx*T3.x+vy*T3.y+vz*T3.z)/l>=k;}
// does c's bite land on tg this frame: a jaw by its mouth, arms and claws at their reach (a part's reach: creatures_ai.js reachOf, armReach)
function landsOn(c,tg){const g=gripOf(c);return g&&g.kind==='jaw'?mouthOn(c,tg,0):c.pos.distanceTo(tg===player?player.pos:tg.pos)<reachOf(c,tg);}
// where the prey will be: its velocity led by the time to close, at most STRIKE.lead s (the chase's aim, and the point the lunge locks on)
function aimAt(c,tg,out,sprint){const tp=tg===player?player.pos:tg.pos,tv=tg===player?player.vel:tg.vel,dist=c.pos.distanceTo(tp)||1,my=(c.def.top||c.def.speed||5)*(sprint?(c.def.sprint||1.3):1),along=((tp.x-c.pos.x)*tv.x+(tp.y-c.pos.y)*tv.y+(tp.z-c.pos.z)*tv.z)/dist,tt=Math.min(STRIKE.lead,dist/Math.max(1,my-along));return out.copy(tp).addScaledVector(tv,tt);} // led by the time to close at the closing speed (the prey's speed away taken off; the lunge at the sprint)
// the distance at which a chaser commits: what its sprint covers in STRIKE.range s past the two bodies' contact
function strikeRange(c,tg){return reachOf(c,tg)+(c.def.top||c.def.speed||5)*(c.def.sprint||1.3)*STRIKE.range;}
// the impact (v11.92): at the clamp the two bodies' velocities become one, the momentum shared by mass — inelastic, the jaws are on it; a ridge carries a finback off at nearly its own speed
function impact(a,b){const ma=massOf(a),mb=massOf(b),k=1/(ma+mb),vx=(a.vel.x*ma+b.vel.x*mb)*k,vy=(a.vel.y*ma+b.vel.y*mb)*k,vz=(a.vel.z*ma+b.vel.z*mb)*k;a.vel.set(vx,vy,vz);b.vel.set(vx,vy,vz);}
// a local point of o's frame in the world, with o's current position (the group's matrix may be a shift behind pos: resolveBodies moves pos)
function localToWorld(o,l,out){const e=o.g.matrix.elements;out.x=e[0]*l[0]+e[4]*l[1]+e[8]*l[2]+o.pos.x;out.y=e[1]*l[0]+e[5]*l[1]+e[9]*l[2]+o.pos.y;out.z=e[2]*l[0]+e[6]*l[1]+e[10]*l[2]+o.pos.z;return out;}
function worldToLocal(o,w,out){const e=o.g.matrix.elements,s2=e[0]*e[0]+e[1]*e[1]+e[2]*e[2]||1,wx=w.x-o.pos.x,wy=w.y-o.pos.y,wz=w.z-o.pos.z;out[0]=(e[0]*wx+e[1]*wy+e[2]*wz)/s2;out[1]=(e[4]*wx+e[5]*wy+e[6]*wz)/s2;out[2]=(e[8]*wx+e[9]*wy+e[10]*wz)/s2;return out;}
// the point on o's body (the axis of the nearest hit capsule) closest to w; o.pos if it has no shapes this frame
function bodyPointNear(o,w,out){const W=o.shapesW;let bx=o.pos.x,by=o.pos.y,bz=o.pos.z,bd=1e9,bi=-1;
  if(W)for(let k=0;k<W.length;k++){const c=W[k],ex=c.bx-c.ax,ey=c.by-c.ay,ez=c.bz-c.az,l2=ex*ex+ey*ey+ez*ez;let qx=c.ax,qy=c.ay,qz=c.az;
    if(l2>1e-6){const tt=clamp(((w.x-c.ax)*ex+(w.y-c.ay)*ey+(w.z-c.az)*ez)/l2,0,1);qx+=ex*tt;qy+=ey*tt;qz+=ez*tt;}
    const d=len3(w.x-qx,w.y-qy,w.z-qz)-c.r;if(d<bd){bd=d;bx=qx;by=qy;bz=qz;bi=k;}}
  bpIdx=bi;out.x=bx;out.y=by;out.z=bz;return out;}
function gripOf(o){return o.b&&o.b.grip;}
// The capsules a hold anchors to must be this frame's (v11.31.1, analysis_review 6): updateCreatures refreshes shapesW only within 90 m
// of the player, so a hold taken further off read the shapes from wherever that body last was near and anchored the rope at a point
// tens of metres off the animal — a rope that never shortened. The stamp is updateCreatures' frame counter.
function freshShapes(o){if(o===player||o.shapeF===frameNo)return;o.g.position.copy(o.pos);o.g.updateMatrix();worldShapes(o);o.shapeF=frameNo;}
// ---------- holds ----------
function startHold(a,b){
  const g=gripOf(a);if(!g||a.hold)return null;const K=GRIP[g.kind];
  freshShapes(a);freshShapes(b);
  const wa=localToWorld(a,g.at,T1),wq=bodyPointNear(b,wa,T2),ci=bpIdx,rW=b.shapesW&&b.shapesW[ci]?b.shapesW[ci].r:0; // the axis point of the nearest capsule, and the surface point toward the mouth (v11.92: the joint is on the skin)
  {let dx=wa.x-wq.x,dy=wa.y-wq.y,dz=wa.z-wq.z;const dl=len3(dx,dy,dz);if(dl>1e-4&&rW>0){wq.x+=dx/dl*rW;wq.y+=dy/dl*rW;wq.z+=dz/dl*rW;}}
  const wb=wq,lb=worldToLocal(b,wb,[0,0,0]);
  const edge=edgeOf(a),cover=coverAt(b,ci); // what the hold is on and what the edge can do there (v11.54)
  const h={a:a,b:b,K:K,kind:g.kind,la:g.at,lb:lb,len:0,biteT:K.cd,load:0,pull:0,t:0,ci:ci,edge:edge,cover:cover,thru:thruOf(edge,cover),pinned:false,pinT:pinTime(a,b),stingT:stings(b)&&(g.kind==='jaw'||g.kind==='arms')&&massOf(a)<STING.mass*massOf(b)?STING.t:0,placed:false,bit:false,near:false,at:V3().copy(wb)}; // the states (v11.55): pinned at pinT unless the held tears free; a spined slowblood stings the mouth or arms on it
  holds.push(h);a.hold=h;b.held=(b.held||0)+1;impact(a,b);
  if(g.kind==='arms')thump(0.3,90,40,b===player?null:wb,0.8,0.06);else afterBite(h,biteOn(h,false)); // the clamp is a jaw's or claws' first bite (v11.91: through the covering or a bruise); the arms only take hold
  return holds.indexOf(h)>=0?h:null;
}
function releaseHold(h){const k=holds.indexOf(h);if(k<0)return;holds.splice(k,1);if(h.a.hold===h)h.a.hold=null;h.b.held=Math.max(0,(h.b.held||0)-1);if(h.a!==player&&h.kind==='arms')h.a.grab=null;}
function releaseAll(o){for(let i=holds.length-1;i>=0;i--){const h=holds[i];if(h.a===o||h.b===o)releaseHold(h);}}
// the AI's bite (creatures_ai.js landBite): a hunter within reach of its prey. Forage dies at the touch as before; something that can
// fight is taken hold of, and the hold does the biting from here; a body with nothing to hold with (none placed) bumps it
function combatBite(a,b){
  if(b===player){if(playerGone())return;if(player.withdrawn){a.bored++;return;}}
  else{if(!b.alive)return;if(b.def.hp>=1e8){a.bored++;return;}
    const sw=swallows(a,b);if(b.def.hp<=1||sw){kill(b,a,sw);dropTarget(a,6);return;}} // forage dies at the touch; a slowblood gulps what fits its gape (v11.55)
  if(!gripOf(a)){bruise(b,a,b.pos);return;}
  if(edgeOf(a)==='ram'){blow(b,a);dropTarget(a,RAM.cool);return;} // the blow (v11.66, RAM)
  if(a.hold){if(a.hold.b===b)return;releaseHold(a.hold);}
  startHold(a,b);
}
const HP1=V3(),HP2=V3(),HV=V3();
function shiftBody(o,dx,dy,dz){if(o.shapesW&&o.shapesW.length)shiftShapes(o,dx,dy,dz);else{o.pos.x+=dx;o.pos.y+=dy;o.pos.z+=dz;}}
// once a frame, after the bodies have pushed apart (creatures_ai.js updateCreatures): every hold's rope, struggle and bite clock
function updateHolds(dt){
  if(!(dt>1e-4))return; // a frame of no time (two rAF in the same millisecond): the struggle divides by dt, and one NaN in h.load
  const P=player;P.heldK=1; // is a NaN rope for good. simChain guards the same way (v11.31.1, analysis_review 4)
  for(let i=holds.length-1;i>=0;i--){
    if(i>=holds.length){i=holds.length-1;if(i<0)break;} // a bite below can kill the held body, and kill's releaseAll splices holds under i: without this the walk runs off the end of the shortened list (v11.31.2; it took the low tier's smoke run down once in fifty)
    const h=holds[i],a=h.a,b=h.b,K=h.K;h.t+=dt;
    // does the hold stand? the holder must still want the held (the AI's target), both must be alive, the player's key held
    let drop=false;
    if(a===P){if(P.dead||mode!=='play'||!P.grabKey||P.withdrawn)drop=true;}else if(!a.alive||a.target!==b)drop=true;
    if(b===P){if(P.dead||mode!=='play')drop=true;}else if(!b.alive)drop=true;
    if(drop){releaseHold(h);continue;}
    if(b===P){const cv=coverAt(P,h.ci);if(cv!==h.cover){h.cover=cv;h.thru=thruOf(h.edge,cv);}} // v11.75: the player's covering follows its state while held — shut under the jaws, or hardened in them
    const ma=massOf(a),mb=massOf(b),wa=ma===mb?0.5:mb/(ma+mb),wb=1-wa;
    const nearP=a===P||b===P||a.pos.distanceTo(P.pos)<95;
    // a holder does not run with what it holds: its steering still asks for the prey (the AI's seek, into a body it already has), so its
    // speed is capped at a cruise while the hold stands — it stays and bites, and what it holds is dragged only as far as that
    if(a!==P){const vm=(a.def.speed||(a.def.lunge||6)*0.3)*0.35,vl=a.vel.length();if(vl>vm)a.vel.multiplyScalar(vm/vl);}
    if(nearP){
      const A=localToWorld(a,h.la,HP1),B=localToWorld(b,h.lb,HP2);
      let dx=B.x-A.x,dy=B.y-A.y,dz=B.z-A.z;const d=len3(dx,dy,dz);
      if(d>3){releaseHold(h);continue;} // something moved one of them (a respawn, a cell line): the hold is gone
      // the joint (v11.92, COMBAT.md §10.4): the grip and the struck point are one point — the gap closed by mass share every frame, the two velocities made
      // one with the momentum shared exactly; the heavier drags. What the joint takes off the held body each frame is its struggle (below): its own thrust
      shiftBody(a,dx*wa,dy*wa,dz*wa);shiftBody(b,-dx*wb,-dy*wb,-dz*wb);
      const rx=b.vel.x-a.vel.x,ry=b.vel.y-a.vel.y,rz=b.vel.z-a.vel.z;
      a.vel.x+=rx*wa;a.vel.y+=ry*wa;a.vel.z+=rz*wa;b.vel.x-=rx*wb;b.vel.y-=ry*wb;b.vel.z-=rz*wb;const dv=len3(rx,ry,rz)*wb;
      // the struggle: what the rope took off the held body this frame is a force on the grip (newtons: kg × m/s²); a grip has a strength by the
      // holder's mass (GRIP.k × kg^(2/3)), weakened as its blood goes, and a struggle past half of it wears the hold down — at the grip's strength
      // in two seconds, at twice it in under one
      const F=mb*dv/dt,str=K.k*Math.pow(ma,2/3)*bloodK(a)*(a===P?PLAYER_GRIP[P.clade.id]||1:1);
      h.load=lerp(h.load,F,1-Math.exp(-5*dt));
      h.pull=Math.max(0,h.pull+dt*(h.load/str-0.5));
      if(h.pull>1){if(a===P)P.grabCD=1.2;else a.biteT=(a.def.biteCD||1.2)*2;releaseHold(h);thump(0.25,140,60,b===P?null:B,1.2,0.05);continue;}
      if(h.kind==='arms')a.grab=b; // the arms close on what is held (physics.js stepRigs), whatever the behaviour says this frame
      if(b===P)P.heldK=Math.min(P.heldK,K.slow);
      h.at.copy(B);h.near=true;
    }else h.near=false;
    // the states, near or far (v11.55, COMBAT.md §2–3): the sting lets the holder go; a ringmouth about to be pinned drops the held arm; a hold
    // kept past its pin time with the struggle under PIN.pull is a pin (a paralysed body is pinned at once), and the placed act follows from the
    // edge's verdict where the hold is. Past 95 m there is no rope and no struggle, so a far fight resolves on the pin clock alone
    {const at=h.near?h.at:b.pos;
      if(h.stingT>0){h.stingT-=dt;if(h.stingT<=0){stung(a,b,at);releaseHold(h);continue;}}
      const para=(b===P?P.paraT:b.paraT)>0;
      if(!h.pinned&&(para||h.t>h.pinT*0.7)&&a!==P&&h.kind!=='arms'&&canDropArm(b)){autotomy(h);continue;}
      if(!h.pinned&&(para||(h.t>h.pinT&&h.pull<PIN.pull))){h.pinned=true;if(a!==P){placedAct(h);if(holds.indexOf(h)<0)continue;}}}
    // the bites, on the hold's clock (the player bites by hand: playerBite). v11.91: each is the edge on the body where the hold is (biteOn); a placed
    // verdict (the nape, the thrash) that does nothing where it holds lets the hunter go; a severed limb is a mouthful — a moment, the target kept
    if(a!==P){h.biteT-=dt;if(h.biteT<=0){h.biteT=K.cd;const r=biteOn(h,h.placed);if(holds.indexOf(h)<0)continue;
      if(!h.bit){h.bit=true;envenom(a,b);} // the first bite in the hold carries the holder's venom, if it has one (COMBAT.md §3b)
      afterBite(h,r);}}
  }
}
// ---------- the states (v11.55) ----------
function widestR(o){const H=o.b&&o.b.hit,s=o.b&&o.b.g?o.b.g.scale.x:1;let r=0;if(H)for(const h of H)if(h.r*s>r)r=h.r*s;return r;}
// a slowblood swallows what fits its mouth (the gape by geometry: the prey's widest capsule against gape × GAPE_K); a ringmouth or a hingeshell takes
// forage in pieces at the touch, by mass as before (WHOLE). The player is swallowed like anything else — the finback's death (COMBAT.md §3)
function swallows(a,b){if(cladeOf(a)==='slowbloods')return widestR(b)<=(a.b.gape||0)*GAPE_K;return b!==player&&!!b.def.edible&&kgOf(b)<=WHOLE*kgOf(a);}
function gulps(tg){const P=player;if(!tg.def||!tg.def.edible)return false;return P.clade.spec.clade==='slowbloods'?widestR(tg)<=(P.b.gape||0)*GAPE_K:kgOf(tg)<=WHOLE_P*P.mass;} // the player's gulp: the finback by its gape, the beaks by mass (pieces)
function pinTime(a,b){return PIN.t*clamp(Math.pow(kgOf(b)/kgOf(a),PIN.mass),0.3,3);}
function venomOf(o){return o===player?(player.clade&&player.clade.venom)||null:(o.def&&o.def.venom)||null;}
function stings(o){const v=venomOf(o);return !!(v&&v.kind==='sting');}
function stung(a,b,at){if(a===player){player.stungT=STING.dur;player.grabCD=STING.cool;hurtPlayer(0,null);}else{a.stungT=STING.dur;dropTarget(a,STING.cool);}thump(0.35,160,70,a===player?null:at,1.2,0.05);bloodBurst(at,2,cladeOf(a));}
function stingPlayer(){player.stungT=STING.dur;hurtPlayer(0,null);} // the drifters' cells (creatures_ai.js): a sting, no wound
function envenom(a,b){const v=venomOf(a);if(!v||v.kind!=='paralyse'||!v.against[cladeOf(b)])return;if(b===player){if(player.withdrawn)return;player.paraT=v.t;}else b.paraT=v.t;}
function armsOf(o){const R=o.b&&o.b.rigs;if(!R)return null;let best=null;for(const r of R)if(r.chains.length>=4&&(!best||r.chains.length>best.chains.length))best=r;return best;} // the arm ring: the rig with the most chains
function canDropArm(o){if(cladeOf(o)!=='ringmouths')return false;const rig=armsOf(o);if(!rig)return false;return (o.armsLost||0)<rig.chains.length-AUTOTOMY.keep;}
// autotomy (COMBAT.md §3; the person, 15 Sep 2026: automatic): the held arm is dropped, the hold goes with it, the holder keeps the arm — food by its
// share of the body (v11.91) — and the arm's base bleeds as a graze: the drop is at a place built to close
function autotomy(h){const a=h.a,b=h.b,rig=armsOf(b);let ch=null;for(const c of rig.chains)if(!c.gone){ch=c;break;}if(!ch)return;
  ch.gone=true;ch.grow=0;b.armsLost=(b.armsLost||0)+1;(b.regrow||(b.regrow=[])).push(t+AUTOTOMY.regrow*DAY_S);const m0=liveMass(b);armsLive(b);const share=Math.max(0,(m0-liveMass(b))/(b.fullMass||m0||1));
  const at=h.at||b.pos;openWound(b,a,h.ci,trunkR(b)*0.15,at,BLOOD.vessel.arms);thump(0.4,120,50,b===player?null:at,1,0.06);
  releaseHold(h);if(a!==player){dropTarget(a,AUTOTOMY.cool);feedPiece(a,b,share);}else{player.grabCD=1.5;feedPiece(player,b,share);}}
// regrowth as growth (v11.57): each dropped arm has its clock; the first gone chain is the first back, growing segment by segment (c.grow, physics.js rigSkin)
function regrowTick(o){const R=o.regrow;if(!R||!R.length)return;const rig=armsOf(o);if(!rig){R.length=0;return;}let k=0,gone=0;
  for(const c of rig.chains){if(!c.gone)continue;const tr=R[k++];if(tr===undefined){gone++;continue;}c.grow=clamp(1-(tr-t)/(AUTOTOMY.regrow*DAY_S),0,1);if(c.grow<1e-6)c.grow=0;if(t>=tr){c.gone=false;c.grow=1;}else gone++;} // the snap: at the drop 1 − 5 days/5 days is not always 0 in floating point (v11.91, the test at a large t)
  while(R.length&&t>=R[0])R.shift();if(gone!==o.armsLost){o.armsLost=gone;armsLive(o);}}
// ---------- the wound as a spec edit (v11.57, COMBAT.md §2: pass 3) ----------
// A creature's body is its spec; a wound edits a live copy of it and the calculator runs again, so a body without its tail is slower and turns
// worse because it is missing the thing that did that (speedK, turnK: the live build's derive against the whole one). What a hold can take is
// what has its own capsule (LOSE.parts: the tail); an arm goes by autotomy (the live spec's arm count). A lost part's meshes are hidden (the far
// bake still shows it — a kind's bake is shared); a slowblood's tail never regrows, a ringmouth's arm does (regrowTick)
function specOf(o){return o===player?player.clade&&player.clade.spec:specOfKind(o.kind);} // the player's is its own (v11.68)
function liveSpec(o){if(o.live)return o.live;const sp=specOf(o);o.live=sp?JSON.parse(JSON.stringify(fillSpec(sp))):null;return o.live;}
function liveMass(o){if(o.liveMass===undefined){let m=0;try{m=derive(specOf(o)).mass;}catch(e){m=0;}o.liveMass=o.fullMass=m;}return o.liveMass;} // the live build's derived mass (tonnes; the whole body's until a part goes)
function rederive(o){const sp=specOf(o),live=o.live;if(!sp||!live){o.speedK=1;o.turnK=1;return;}
  try{const full=derive(sp),now=derive(Object.assign({},live,{parts:live.parts.filter(p=>!p.lost)}));o.fullMass=full.mass;o.liveMass=now.mass;o.speedK=clamp(now.speed/(full.speed||1),0.05,1);o.turnK=clamp(now.turn/(full.turn||1),0.3,1.5);}catch(e){o.speedK=1;o.turnK=1;}} // v11.91: no floor but the build's own (a finback without its tail has its fins and nothing else)
function armsLive(o){const live=liveSpec(o);if(!live)return;const rig=armsOf(o);const ai=live.parts.findIndex(p=>p.kind==='arms'&&!p.lost);if(ai<0||!rig)return;const full=fillSpec(specOf(o)).parts[ai].n||rig.chains.length;live.parts[ai].n=Math.max(AUTOTOMY.keep,full-(o.armsLost||0));rederive(o);} // the arm count in the live spec follows the arms dropped and regrown
function partUnder(o,ci){const H=o.b&&o.b.hitOwn;return H&&ci>=0&&ci<H.length?H[ci]:-1;}
function losable(o,pi){if(pi<0)return false;const sp=specOf(o);const p=sp&&sp.parts[pi];return !!(p&&LOSE.parts[p.kind]&&!(o.lost&&o.lost.indexOf(pi)>=0));}
// the part torn off: hidden, struck from the live spec, the body re-derived; a hunter that loses one leaves. quiet: the save putting it back. Returns
// the part's share of the body's mass (v11.91: the piece is the biter's food; the root's bleeding is cutAt's)
function losePart(o,pi,by,at,quiet){const live=liveSpec(o);if(!live)return 0;const p=live.parts[pi];if(!p||p.lost)return 0;p.lost=true;(o.lost||(o.lost=[])).push(pi);
  const r=o.b.built[pi];if(r){if(r.nodes)for(const m of r.nodes)m.visible=false;if(r.rig){r.rig.mesh.visible=false;for(const c of r.rig.chains)c.gone=true;}}
  const m0=liveMass(o);rederive(o);const share=Math.max(0,(m0-o.liveMass)/(o.fullMass||m0||1));if(quiet)return share;at=at||o.pos;hitFx(o,by,at,20);thump(0.5,100,45,o===player?null:at,1,0.08);
  if(o===player)hurtPlayer(0,null);else{o.lastHurt=t;if(o.def.role==='hunter'||o.def.role==='ambush'){dropTarget(o);o.state='flee';o.fleeT=LOSE.flee;}}
  return share;}
// the placed act once a hunter has pinned its prey (v11.91): swallowed by the gape; else the verdicts that wait on the pin (the nape, the thrash) are
// the next bite's; an edge already through has nothing to place; nothing this edge can do where it holds, the hunter lets go and looks elsewhere.
// The player's own hold acts on its bite
function placedAct(h){const a=h.a,b=h.b;if(b!==player&&!b.alive)return;
  if(cladeOf(a)==='slowbloods'&&swallows(a,b)&&!losable(b,partUnder(b,h.ci))){killBy(h,'swallowed');return;} // a gape swallows from the body, not from a tail (v11.57)
  const v=h.thru;if(v==='yes')return;
  if(v==='nape'||v==='thrash'){h.placed=true;return;}
  dropTarget(a,PIN.bored);}
function actOf(e){return e==='point'?'skewered':e==='crush'?'crushed':e==='cut'?'opened':e==='beak'?'bitten at the nerve cord':'dismembered';}
function killBy(h,act){const a=h.a,b=h.b,at=h.at||b.pos,cl=cladeOf(b);bloodBurst(at,16,cl);hitFx(b,a,at,24);thump(0.6,90,40,b===player?null:at,1,0.1);
  if(b===player){die((act==='swallowed'?'swallowed by':act+' by')+' a '+(a===player?'player':a.kind));return;}
  kill(b,a,act==='swallowed');}
function slowOf(o){return bloodK(o)*(o.stungT>0?STING.slow:1)*(o.sickT>0?POISON.slow:1)*(o.speedK||1);} // the blood lost (v11.91), the sting, the poison, the live spec's derive against the whole body's (v11.57)
function bleeding(o){return o===player?player.bleed>1e-5&&!playerGone()&&player.inkT<=0:o.bleed>1e-5;}
function smellR(o){return SMELL_R*Math.min(2,Math.sqrt((o.bleed||0)/BLOOD.qRef));} // how far a wound is read from: by the square root of its rate — a pouring wound from 180 m, a thread from 40
// the nearest bleeding body on c's prey list within R (creatures_ai.js updateHunter: past its detect, the water carries the blood)
function findBleeding(c,R){const d=c.def;let best=null,bd=R*2;if(d.prey.indexOf('player')>=0&&bleeding(player)&&(!d.preyClade||(player.clade&&player.clade.id===d.preyClade))){const dp=c.pos.distanceTo(player.pos);if(dp<bd&&dp<smellR(player)){bd=dp;best=player;}}
  for(const o of creatures){if(!o.alive||o===c||!(o.bleed>1e-5))continue;if(!preyOn(d,o))continue;const dd=c.pos.distanceTo(o.pos);if(dd<bd&&dd<smellR(o)){bd=dd;best=o;}}return best;}
function missed(c,tg){c.biteT=(c.def.biteCD||1.2)*STRIKE.cool;c.missN=(c.missN||0)+1;thump(0.3,130,50,tg===player?null:c.pos,1.2,0.04);if(tg===player)player.fovKickT=0.15;} // the snap on water
function sicken(o){if(o===player){player.sickT=POISON.t;hurtPlayer(0,null);}else{o.sickT=POISON.t;dropTarget(o,POISON.t);}}
// a hingeshell's toxin follows where it has fed (every 2 s, staggered): loading at the seeps and below the chemocline, clearing elsewhere
function poisonTick(c,dt){c.poisT-=dt;if(c.poisT>0)return;c.poisT=2;const sp=SPECS[c.kind];if(!sp||sp.clade!=='hingeshells')return;const ch=chunkAt(c.pos.x,c.pos.z),f=ch?ch.f(c.pos.x,c.pos.z):null;
  const at=c.pos.y<POISON.deep||(f&&f[FI.heat]>POISON.heat);c.poison=clamp((c.poison||0)+(at?2/(POISON.load*DAY_S):-2/(POISON.clear*DAY_S)),0,1);} // a body's speed factor by its states (creatures_ai.js seek, player.js)
// once a frame: the states' clocks on the player and every creature (the creatures' paralysis is read in creatures_ai.js updateCreatures)
function updateStates(dt){const P=player;P.paraT=Math.max(0,(P.paraT||0)-dt);P.stungT=Math.max(0,(P.stungT||0)-dt);P.sickT=Math.max(0,(P.sickT||0)-dt);if(P.regrow)regrowTick(P);
  for(const c of creatures){if(!c.alive)continue;if(c.paraT>0)c.paraT-=dt;if(c.stungT>0)c.stungT-=dt;if(c.sickT>0){c.sickT-=dt;c.cool=Math.max(c.cool,0.5);}if(c.regrow)regrowTick(c);poisonTick(c,dt);}} // sick: no hunting (the cool held)
// ---------- wounds ----------
// bleeding, once a frame (v11.91): every wound drains its rate into the body's loss and clots (the rate falling by e over its tau), and trickles at its
// point by its rate; the loss weakens the body (bloodK, read by slowOf and the grip), collapses it, and at BLOOD.dead the body bleeds out — dead, a
// carcass like any kill, its last wounder credited if it is near. The blood comes back fed, over the clade's days. A hunter hurt past weak leaves
function updateWounds(dt){
  const P=player;
  const drain=(o)=>{const W=o.wounds;if(!W||!W.length){o.bleed=0;return;}let q=0;const cl=cladeOf(o),vis=o.g&&o.g.visible!==false;
    for(let i=W.length-1;i>=0;i--){const w=W[i];o.blood=Math.min(1,(o.blood||0)+w.q*dt);w.q*=Math.exp(-dt/w.tau);if(w.q<1e-4){W.splice(i,1);continue;}q+=w.q;
      if(vis){w.tT-=dt;if(w.tT<=0){w.tT=clamp(1/(BLOOD.trail*w.q),0.1,2);localToWorld(o,w.at,HP1);bloodBurst(HP1,1,cl,0.15);}}}
    o.bleed=q;if(q>0)o.lastHurt=t;};
  if(!P.dead&&mode==='play')drain(P);else P.bleed=0;
  for(const c of creatures){if(c.alive&&c.wounds)drain(c);}
  if(!P.dead&&mode==='play')bloodTick(P,dt);for(const c of creatures){if(c.alive&&c.blood>0)bloodTick(c,dt);}
}
function bloodTick(o,dt){const L=o.blood||0;if(!(L>0))return;
  if(L>=BLOOD.dead){bledOut(o);return;}
  if(!(o.bleed>1e-5)&&o.hunger<1)o.blood=Math.max(0,L-dt/((BLOOD.refill[cladeOf(o)]||2)*DAY_S));
  if(o!==player&&L>BLOOD.weak&&(o.def.role==='hunter'||o.def.role==='ambush')&&o.state!=='flee'&&o.target){dropTarget(o);o.state='flee';o.fleeT=LOSE.flee;}} // the life–dinner rule: a hunter losing blood leaves what it was after
function lastWounder(o){const W=o.wounds;let best=null,bq=0;if(W)for(const w of W)if(w.by&&w.q>=bq){bq=w.q;best=w.by;}return best;}
function bledOut(o){const by=lastWounder(o);
  if(o===player){die('bled out'+(by?' after a '+(by===player?'player':by.kind)+"'s bite":''));return;}
  const near=by&&by!==player&&by.alive&&by.pos.distanceTo(o.pos)<BLOOD.near?by:by===player&&player.pos.distanceTo(o.pos)<BLOOD.near?player:null;kill(o,near,false);}
// ---------- blood ----------
// one point cloud for all the blood in the water (like the snow, atmosphere.js: a size and an alpha per point through the same points
// patch, lit like the snow and by the player's light); each point drifts with the current and the flow round the bodies, spreads, and fades
const BL_N=Q.tier==='low'?240:480,blP=new Float32Array(BL_N*3),blV=new Float32Array(BL_N*3),blC=new Float32Array(BL_N*3),blS=new Float32Array(BL_N*2),blL=new Float32Array(BL_N),blA=new Float32Array(BL_N);let blNext=0,blLive=0;
const blG=new THREE.BufferGeometry();blG.setAttribute('position',new THREE.BufferAttribute(blP,3));blG.setAttribute('color',new THREE.BufferAttribute(blC,3));blG.setAttribute('aSz',new THREE.BufferAttribute(blS,2));
const blM=new THREE.PointsMaterial({color:0xcfe6ee,size:0.3,transparent:true,opacity:0.8,depthWrite:false,vertexColors:true});
blM.onBeforeCompile=function(sh){sh.uniforms.uPL=plU;sh.uniforms.uPLc=plCU;let n=0;
  sh.vertexShader=sh.vertexShader.replace('uniform float size;',()=>{n++;return 'attribute vec2 aSz;uniform vec4 uPL;varying float vA;varying float vL;uniform float size;';})
    .replace('gl_PointSize = size;',()=>{n++;return 'gl_PointSize=size*aSz.x;vA=aSz.y*smoothstep(0.4,1.5,-mvPosition.z);{vec3 dl=transformed-uPL.xyz;vL=uPL.w/(0.5+dot(dl,dl));}';})
    .replace('#include <logdepthbuf_vertex>',()=>{n++;return 'gl_PointSize=min(gl_PointSize,40.0);\n#include <logdepthbuf_vertex>';});
  sh.fragmentShader=sh.fragmentShader.replace('uniform vec3 diffuse;',()=>{n++;return 'varying float vA;varying float vL;uniform vec3 uPLc;uniform vec3 diffuse;';})
    .replace('#include <color_fragment>',()=>{n++;return 'diffuseColor.rgb=vColor*(diffuse+uPLc*vL);diffuseColor.a*=vA;';});
  if(n!==5)console.warn('blood: points chunks not as expected ('+n+' of 5); the blood draws uniform');};
blM.customProgramCacheKey=function(){return 'blood';};
const blood=new THREE.Points(blG,blM);blood.frustumCulled=false;blood.visible=false;scene.add(blood);
for(let i=0;i<BL_N;i++){blS[i*2+1]=0;blP[i*3+1]=-1e4;}
// n points of the clade's blood at p, thrown at up to `sp` m/s (a bite's puff) or barely (the trickle)
function bloodBurst(p,n,clade,sp){if(!FX.blood||!p)return;if(p.y>waveH(p.x,p.z))return;const col=BLOOD_COL[clade]||BLOOD_COL.slowbloods;sp=sp===undefined?0.9:sp;
  n=Math.min(BL_N,Math.round(n));for(let k=0;k<n;k++){const i=blNext;blNext=(blNext+1)%BL_N;const i3=i*3;
    blP[i3]=p.x+rnd(-0.15,0.15);blP[i3+1]=p.y+rnd(-0.15,0.15);blP[i3+2]=p.z+rnd(-0.15,0.15);
    blV[i3]=rnd(-1,1)*sp;blV[i3+1]=rnd(-1,1)*sp*0.7;blV[i3+2]=rnd(-1,1)*sp;
    const k2=rnd(0.75,1.1);blC[i3]=col[0]*k2;blC[i3+1]=col[1]*k2;blC[i3+2]=col[2]*k2;
    blL[i]=rnd(2.5,4.5);blA[i]=blL[i];blS[i*2]=rnd(0.6,1.2);blS[i*2+1]=1;}
  blLive=BL_N;blood.visible=true;}
function updateBlood(dt){
  if(!blLive){blood.visible=false;return;}
  blM.color.copy(pm.color); // the light on the snow is the light on the blood (atmosphere.js updateAtmosphere)
  let live=0;const kf=1-Math.exp(-4*dt),ks=Math.exp(-1.6*dt);
  for(let i=0;i<BL_N;i++){if(blS[i*2+1]<=0)continue;const i3=i*3;blA[i]-=dt;if(blA[i]<=0){blS[i*2+1]=0;blP[i3+1]=-1e4;continue;}
    live++;const x=blP[i3],y=blP[i3+1],z=blP[i3+2];flowAt(x,y,z,HV);
    blV[i3]=(blV[i3]+(HV.x+CURV.x-blV[i3])*kf)*ks;blV[i3+1]=(blV[i3+1]+(HV.y+CURV.y-0.04-blV[i3+1])*kf)*ks;blV[i3+2]=(blV[i3+2]+(HV.z+CURV.z-blV[i3+2])*kf)*ks;
    blP[i3]=x+blV[i3]*dt;blP[i3+1]=y+blV[i3+1]*dt;blP[i3+2]=z+blV[i3+2]*dt;
    const f=blA[i]/blL[i];blS[i*2]+=dt*0.9;blS[i*2+1]=Math.min(1,f*2.5)*0.85;}
  blLive=live;blG.attributes.position.needsUpdate=true;blG.attributes.aSz.needsUpdate=true;blG.attributes.color.needsUpdate=true;
}
// ---------- the player ----------
// the grab (right mouse or r, held): the arms or the jaws take hold of the nearest thing within reach ahead and keep it while the key is
// down, the rope doing the rest — a small thing is yours, a big one drags you. Let go and it goes. The clamp of the finback's jaws bites
function playerGrab(want,dt){
  const P=player;P.grabKey=want;P.grabCD=Math.max(0,(P.grabCD||0)-dt);
  if(!want||P.hold||P.grabCD>0||P.dead||P.withdrawn||!gripOf(P))return;
  const tg=playerTarget(false);if(!tg)return;
  if(gulps(tg)){P.grabCD=0.3;return;} // small enough to eat: the bite does that
  startHold(P,tg);if(P.b.rigs)P.grab=tg;
}
// the nearest live body (or carcass, if `dead`) within reach and ahead: the bite's rule
function playerTarget(dead){const P=player;T3.set(0,0,1).applyQuaternion(P.g.quaternion);let best=null,bd=1e9;
  const jaw=gripOf(P)&&gripOf(P).kind==='jaw';
  const look=(c)=>{T1.copy(c.pos).sub(P.pos);const dd=T1.length();if(jaw){if(dd>4+c.def.size*1.5+P.def.size||!mouthOn(P,c,PLAYER_BITE))return;}else{const reach=Math.max(2.2+c.def.size*0.45,reachOf(P,c));if(dd>reach)return;if(dd>1.2&&T1.dot(T3)/dd<0.2)return;}if(dd<bd){bd=dd;best=c;}}; // v11.92: a jaw's target is what its mouth is on (mouthOn, PLAYER_BITE past it); the arms' is within their reach ahead
  for(const c of creatures){if(c.alive)look(c);}
  if(dead&&!best)for(const c of carcasses){if(!c.gone&&c.flesh>0)look(c);}
  return best;}
// the bite (click): forage is eaten whole; a carcass is eaten at; anything else takes the edge — on what is held, at the capsule the hold is on (the
// placed act once pinned: the nape, the thrash); free, at the nearest capsule to the mouth. Through the covering it cuts (cutAt); not, a bruise. The
// arms close on it for a moment as before; a bite on what holds you loosens its grip
function playerBite(){
  const P=player;if(mode!=='play'||P.dead||P.withdrawn||P.biteCD>0)return;P.biteCD=0.5;thump(0.35,120,50,null,1.6,0.03);P.pulse=Math.max(P.pulse,0.6);P.snapT=0.1;
  const best=P.hold?P.hold.b:playerTarget(true);if(!best)return;P.nudgeT=0.15;(P.nudgeD||(P.nudgeD=V3())).copy(best.pos).sub(P.pos).normalize(); // the camera nudged toward the bite (v11.53)
  T3.set(0,0,1).applyQuaternion(P.g.quaternion);
  if(best.dead){eatAt(P,best,EAT.bite);bloodBurst(best.pos,5,cladeOf(best),0.5);return;} // a carcass: a mouthful at the world's rate (v11.73: creatures_ai.js eatAt feeds the stomach, or sickens you on a poisoned body)
  if(gulps(best)){bloodBurst(best.pos,4,cladeOf(best));kill(best,player,true);return;} // eaten whole (v11.26: no respawn; the ledger is debited; v11.55: by the finback's gape, the beaks by mass; v11.73: kill feeds the stomach, or sickens you)
  if(P.b.rigs&&!P.hold){P.grab=best;P.grabT=0.6;} // the arms close on what you bite
  const held=P.hold&&P.hold.b===best;
  if(held){const h=P.hold;if(!h.bit){h.bit=true;envenom(P,best);} // the coilshell's venom on its first bite in a hold (COMBAT.md §3b)
    afterBite(h,biteOn(h,h.pinned));}
  else{const g=gripOf(P),m=g?localToWorld(P,g.at,T1):T1.copy(P.pos);freshShapes(best);bodyPointNear(best,m,T2);const ci=bpIdx,edge=edgeOf(P);
    if(best.def.hp>=1e8||thruOf(edge,coverAt(best,ci))!=='yes')bruise(best,P,T2);else cutAt(best,P,ci,T2,edge,rhoOf(P),pointDepth(P),m);
    if(best.alive)best.vel.addScaledVector(T3,4);}
  if(best.alive&&best.hold&&best.hold.b===P)best.hold.pull+=0.35; // it has you: a bite is a reason to let go
}
