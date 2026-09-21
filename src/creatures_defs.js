// creatures_defs.js — species stats and where they spawn. This is the file to edit for ecology changes.
// v11.55 (COMBAT.md): there are no hit points. hp keeps two meanings only — ≤1 is forage (dies at the touch), ≥1e8 is immortal (takes no wound);
// any other value is nothing. dmg is a bite's size for the blood and the debris. venom {kind: 'paralyse' (t seconds, against: clades) | 'sting'}
// is the clade's chemistry (§3b): the lurker's beak paralyses, the basker's and the grazer's spines sting whatever clamps them. immune: the
// abyssal eats combs that fed at the chemocline without sickening (v11.56; the garter snake's answer to the newt — its comb is its whole diet).
// roles: boid (a loose ribbon: flickers, darters) hunter (chases prey) graze ambush (sits, lunges; hang: from up in the structure)
// trap (sits, strikes) watch (the curious one) coil drift wander. legs: can move out of the water (walks); everything else is a
// swimmer and flops when beached. size: rough half-length, used for collision, LOD and floor clearance (clear overrides the
// clearance: a buried trap sits low). reach is centre-to-centre: how far an animal can bite. Since v11.31.1 the bite test floors it
// at the two bodies' own contact distance (creatures_ai.js reachOf, BITE_M), so a reach shorter than the biter's nose plus the
// prey's body no longer means it can never bite what is in front of it — 45 of the 58 predator/prey pairs here are such a pair.
// v11.71 (the person, 21 Sep 2026: "a universal logic of how fast an animal moves based on its size and mass and such"): no row carries a speed, an
// accel or a turn — defPhysics below reads them off the build (creatures_spec.js derive) for every kind, as the player's are. What stays by hand is
// behaviour: pace (the share of its top speed an animal goes about at when nothing hunts it and it hunts nothing — a hunter's chase is its top speed,
// so a hunter has none; the filter feeders and the floor's grazers amble at a fifth), flee:true (it bolts, at its top speed), cruise, cruiseF, burst,
// detect. Still absolute, and the next candidates: lunge and strike.speed (a burst over the top speed).
// strike {tell, dur, speed, range}: the tell then the strike (creatures_ai.js); burst {on, off}: burst-and-coast; preyClade: the
// player is prey only as that clade; calm: ignores threats; deep: keeps below the chemocline; stand: the watcher's standoff.
// Two masses, and they are not the same number (v11.32). The cube of size was written six times between here,
// creatures_ai.js, combat.js and ecology.js, three of them floored at 0.6 and three not, which reads as drift and is not. bodyMass is the physical one —
// contact, the body push and a hold's struggle — floored so a flicker at 0.064 does not vanish against a ridge. bioMass is
// the biological one the allometry uses (a birth rate as mass^-0.25, a meal, a carcass's flesh), and flooring it would put
// a flicker's rate at half what test/census.js is drawn for. Same cube, different floors, named so nobody unifies them.
const BODY_MIN=0.6;
function bioMass(d){return d.size*d.size*d.size;}
function bodyMass(d){return Math.max(BODY_MIN,bioMass(d));}
const DEFS={
  darter:{build:()=>compile(SPECS.darter),stock:8,size:0.6,pace:0.65,flee:true,hp:1,edible:true,food:14,role:'boid'},
  glim:{build:()=>compile(SPECS.glim),size:0.55,pace:0.6,flee:true,hp:1,edible:true,food:12,role:'boid'},
  arrow:{build:()=>compile(SPECS.arrow),size:1.0,hp:1,edible:true,food:24,role:'hunter',prey:['darter','flicker','scuttle','sifter'],detect:14,reach:0.9,dmg:0,biteCD:1,home:26,cruise:8,cruiseF:0.5,cool:2},
  grazer:{build:()=>compile(SPECS.grazer),stock:3,size:2.6,venom:{kind:'sting'},pace:0.55,flee:true,hp:70,role:'graze',home:32,floor:true}, // mortal since v11.26: the ridge's and the sickle's meal (it was 1e9 and every hunt ended bored)
  veil:{build:()=>compile(SPECS.veil),size:16,pace:0.19,hp:1e9,role:'wander',home:200,cruise:70,cruiseF:1},
  great:{build:()=>compile(SPECS.great),size:6,pace:0.14,ram:5,dmg:12,radius:9,reach:5.2,hp:1e9,role:'coil',home:45,cruise:10,cruiseF:1},
  ridge:{build:()=>compile(SPECS.ridge),size:9,hp:140,role:'hunter',prey:['player','grazer','picker','plough'],detect:46,reach:6.6,dmg:32,biteCD:1.5,home:240,cruise:60,cruiseF:0.4,cool:5},
  ortho:{build:()=>compile(SPECS.ortho),size:8,hp:90,role:'hunter',prey:['player','needle','darter','grazer','picker'],detect:40,reach:5.6,dmg:24,biteCD:1.2,home:220,cruise:70,cruiseF:0.4,cool:5},
  abyssal:{build:()=>compile(SPECS.abyssal),size:15,immune:true,hp:400,role:'hunter',prey:['player','comb'],cycle:10,detect:85,reach:10,dmg:55,biteCD:1.8,home:420,cruise:200,cruiseF:0.45,cool:6},
  eel:{build:()=>compile(SPECS.eel),size:4,hp:55,role:'hunter',prey:['player','darter','flicker','sifter'],detect:17,reach:4.0,dmg:16,biteCD:1.1,home:40,cruise:14,cruiseF:0.35,cool:4},
  lurker:{build:()=>compile(SPECS.lurker),size:2.4,venom:{kind:'paralyse',t:7,against:{slowbloods:1,ringmouths:1}},hp:45,role:'ambush',prey:['player','darter','flicker','rasp','scuttle','needle','grazer','wedge','sifter'],radius:9,lunge:14,reach:3.2,dmg:20,lodNear:75},
  // drifters (DRIFTERS.md): no eyes, no hunting; they sting what touches them. surface: rides the wave (ys under the crest's origin)
  jelly:{build:()=>compile(SPECS.jelly),size:1.4,hp:1e9,role:'drift',reach:1.4,dmg:4,noOrient:true},
  deepbell:{build:()=>compile(SPECS.deepbell),size:4.5,hp:1e9,role:'drift',reach:4.2,dmg:8,noOrient:true,lodNear:90},
  sailer:{build:()=>compile(SPECS.sailer),size:1.8,hp:1e9,role:'sail',dmg:6,noOrient:true,surface:true,ys:-0.15,lines:0.9,lodNear:130},
  greatsailer:{build:()=>compile(SPECS.greatsailer),size:4.5,hp:1e9,role:'sail',dmg:10,noOrient:true,surface:true,ys:-0.3,lines:1.4,lodNear:230},
  // legs: walks on the strand and the sea floor alike; the only thing that is at home out of the water
  scuttle:{build:()=>compile(SPECS.scuttle),stock:4,size:0.7,pace:0.63,flee:true,hp:1,edible:true,food:10,role:'graze',home:18,floor:true,legs:true,cruiseF:0.5,scav:30},
  // The roster (PLANET.md), placed v10.7: size is the roster's half-length in metres; the stats are first guesses, tuned from what the
  // person sees. No temperature model yet (the basker is quick everywhere; PLANET Hooks), no moulting, no detection modes.
  rasp:{build:()=>compile(SPECS.rasp),stock:8,size:0.5,pace:0.22,flee:true,hp:1,edible:true,food:8,role:'graze',home:10,floor:true,cruiseF:0.6,scav:12},
  watcher:{build:()=>compile(SPECS.watcher),size:1.8,pace:0.43,hp:1e9,role:'watch',home:30,floor:true,detect:26,stand:6,cruiseF:0.4,scav:50},
  pall:{build:()=>compile(SPECS.pall),size:9,pace:0.15,hp:1e9,role:'wander',home:160,cruise:60,cruiseF:0.8,deep:true,lodNear:110},
  needle:{build:()=>compile(SPECS.needle),size:0.9,pace:0.87,flee:true,hp:1,edible:true,food:16,role:'hunter',prey:['flicker','darter','sifter'],detect:12,reach:1.2,dmg:0,biteCD:1,home:24,cruise:6,cruiseF:0.5,cool:2},
  basker:{build:()=>compile(SPECS.basker),size:5,venom:{kind:'sting'},hp:120,role:'hunter',prey:['player','picker','grazer','needle','cinder'],detect:32,reach:4.6,dmg:22,biteCD:1.4,home:70,cruise:25,cruiseF:0.4,cool:5},
  stone:{build:()=>compile(SPECS.stone),size:3,hp:200,role:'trap',prey:['player','picker','rasp','grazer','plough'],cycle:5,detect:2.8,reach:3.0,dmg:22,strike:{tell:0.15,dur:0.35},cool:2.5,floor:true,clear:0.8},
  crusher:{build:()=>compile(SPECS.crusher),size:4,hp:110,role:'hunter',prey:['rasp','scuttle','player','wedge'],preyClade:'coil',scav:40,detect:24,reach:4.2,dmg:28,biteCD:1.5,strike:{tell:0.3,dur:0.35,speed:9,range:1.7},home:50,cruise:14,cruiseF:0.4,cool:4},
  trap:{build:()=>compile(SPECS.trap),size:2,hp:60,role:'trap',prey:['player','flicker','needle','darter','scuttle','sifter'],detect:4.5,reach:3.3,dmg:24,strike:{tell:0.35,dur:0.3},cool:3,floor:true,clear:0.45},
  hook:{build:()=>compile(SPECS.hook),size:2.5,hp:50,role:'ambush',prey:['player','flicker','darter','needle'],hang:true,radius:11,lunge:11,reach:2.8,dmg:18},
  tread:{build:()=>compile(SPECS.tread),size:7,pace:0.17,hp:1e9,role:'graze',calm:true,home:90,floor:true,legs:true,cruiseF:1},
  picker:{build:()=>compile(SPECS.picker),stock:3,size:1.5,pace:0.62,flee:true,hp:1,edible:true,food:10,role:'graze',home:40,floor:true,legs:true,cruiseF:0.6,scav:90},
  flicker:{build:()=>compile(SPECS.flicker),stock:8,size:0.4,pace:0.51,flee:true,hp:1,edible:true,food:6,role:'boid'},
  hose:{build:()=>compile(SPECS.hose),size:1.5,hp:30,role:'hunter',prey:['flicker','darter'],detect:14,reach:2.2,dmg:0,biteCD:1.2,strike:{tell:0.25,dur:0.25,speed:9,range:1.8},burst:{on:0.45,off:0.9},home:30,cruise:10,cruiseF:0.5,cool:2},
  sickle:{build:()=>compile(SPECS.sickle),size:5,hp:150,role:'hunter',prey:['player','needle','grazer'],detect:42,reach:6.4,dmg:30,biteCD:1.8,strike:{tell:0.5,dur:0.4,speed:17,range:2.0},burst:{on:0.7,off:1.5},home:200,cruise:50,cruiseF:0.4,cool:5},
  // the raptor family's other looks (v11.9.1), placed v11.66 (the person's default: all five looks live, one each, where the build says). COMBAT.md §7's
  // finding — the hood's, lash's and ram's claws get through neither the grazer's nor the finback's hide — is answered by prey they can open: the forage
  // (dies at the touch), the ringmouths' skin, and any hingeshell at its moult (creatures_ai.js MOULT: a soft body is prey to whatever is big enough).
  // v11.10: every species whose build is compile(SPECS.x) is a spec (creatures_spec.js); the lab (#lab) edits them. A hand builder is a species without one.
  hood:{build:()=>compile(SPECS.hood),size:5,hp:150,role:'ambush',prey:['player','flicker','darter','needle','scuttle','rasp','sifter'],radius:13,lunge:12,reach:6.4,dmg:30,strikeOnLunge:true,home:40,clear:0.55}, // buried on the sand flats and the lagoon floor like the trap, it lunges like the lurker (the legs and the rear flaps: a short burst up from under)
  lash:{build:()=>compile(SPECS.lash),size:3,hp:90,role:'hunter',prey:['player','needle','darter','flicker','arrow','rasp','sifter'],detect:30,reach:5.0,dmg:20,biteCD:1.5,strike:{tell:0.4,dur:0.35,speed:17,range:2.0},burst:{on:0.6,off:1.2},home:60,cruise:20,cruiseF:0.4,cool:4}, // on the ledges, whips out
  ram:{build:()=>compile(SPECS.ram),size:4,hp:200,role:'hunter',prey:['sifter','flicker','darter','arrow'],detect:38,reach:5.5,dmg:34,biteCD:2.0,strike:{tell:0.6,dur:0.5,speed:14,range:2.4},burst:{on:0.8,off:2.0},home:180,cruise:45,cruiseF:0.4,cool:6}, // slow and big in the open water over the flank: its blow stuns a shoal (combat.js RAM), never the player's hunter
  comb:{build:()=>compile(SPECS.comb),size:7,pace:0.14,hp:260,role:'wander',burst:{on:1.4,off:3},home:180,cruise:60,cruiseF:1},
  // v11.66, the variety pass: five forms by mechanism (creatures_spec.js SPECS; PLANET roster)
  sifter:{build:()=>compile(SPECS.sifter),stock:6,size:0.6,pace:0.53,flee:true,hp:1,edible:true,food:8,role:'boid',mid:true}, // mid (v11.66): a swarmer of the water column, its ribbons wander at their own depth, not over the floor
  cinder:{build:()=>compile(SPECS.cinder),stock:3,size:1.2,pace:0.58,flee:true,hp:1,edible:true,food:10,role:'graze',home:30,floor:true,legs:true,cruiseF:0.6,scav:60,clear:0.55},
  wedge:{build:()=>compile(SPECS.wedge),stock:4,size:0.9,pace:0.58,flee:true,hp:1,edible:true,food:10,role:'graze',home:14,floor:true,legs:true,cruiseF:0.5,scav:20},
  plough:{build:()=>compile(SPECS.plough),stock:2,size:1.6,pace:0.6,flee:true,hp:60,role:'graze',home:40,floor:true,legs:true,cruiseF:0.6,clear:0.62},
  relict:{build:()=>compile(SPECS.relict),size:4,hp:120,role:'hunter',prey:['picker'],detect:22,reach:5.7,dmg:14,biteCD:1.5,strike:{tell:0.5,dur:0.4,speed:7,range:1.8},burst:{on:0.9,off:2.5},home:120,cruise:30,cruiseF:0.4,cool:5} // slow: a life below the light on a diet of pickers
};
// The physics off the build (v11.71): top is derive's speed, speed is what the AI has always read (top × pace), flee the top speed where a kind bolts,
// turn and accel derive's. A kind made later (the lab's, the line's young) goes through the same function. accel reaches the AI through seek
// (creatures_ai.js ACC_REF): a heavy body closes on the speed it wants more slowly than a light one.
function defPhysics(d,spec){const st=derive(spec);d.top=st.speed;d.speed=+(st.speed*(d.pace||1)).toFixed(2);if(d.flee)d.flee=st.speed;d.turn=st.turn;d.accel=st.accel;return d;}
for(const k in DEFS)if(SPECS[k])defPhysics(DEFS[k],SPECS[k]);
// The world's capacity (v11.26): n is the individuals per cell of a kind at full tolerance, scaled by the cell's mean tolerance for the
// envelope (ecology.js ecoCap; chunks.js cellW) — it is the carrying capacity K of the ledger, not a spawn count. The ledger runs at
// 60–90% of it where nothing eats a kind and lower where something does. grp: placed in groups of that many (packs of arrows,
// herds of grazers, threes of needles, ribbons of flickers and darters as boid schools); land: on the strand, by land area. The
// numbers are a trophic pyramid drawn for 12 km² of water: apex predators in single figures, mid predators in tens, forage in the
// thousands (test/census.js prints the totals and runs the ledger's model on paper; DESIGN, The ecology). Before v11.26 the
// world held 70 ridges and 64 orthos against 172 darters — a pyramid upside down, and every hunt ended bored.
// v11.66 (the hingeshell variety pass): the hingeshells' envelopes read the fields, not the depth alone — expo (the surf), rel (a ledge, a lip),
// shel (the lagoon), flow and nut (the fed, moving water a filter feeder or a swarm follows), young (the collapse's fresh rock), heat (the seeps),
// turb (a burrower wants the sand that stays), and grp where the animal swarms. The numbers were drawn against a per-region capacity table (the
// CHANGELOG's): the giant's shelf is ~30× ours, so every K here is mostly its; the young shield has no record in the world yet.
const SPAWN=[
  {kind:'flicker',grp:10,n:24,env:{h:[-62,-4]}}, // the floor of the food web, in loose ribbons
  {kind:'flicker',grp:10,n:16,env:{h:[-62,-4],nut:[0.45,1]}}, // and more where the water is fed (v11.66)
  {kind:'sifter',grp:8,n:16,env:{h:[-300,-30],nut:[0.5,1],flow:[0.3,1]}}, // v11.66: the water column over the upwelling — the fed, moving water a swarm of filter feeders lives in; the ram's meal
  {kind:'darter',grp:9,n:20,env:{h:[-45,-5]}}, // darter ribbons over the shallows
  {kind:'needle',grp:3,n:3.6,env:{h:[-45,-4]}}, // needles hunt the ribbons in threes
  {kind:'rasp',n:14,env:{h:[-40,-3],sub:[0.55,1]}}, // rasps graze the rock of the shallows and the reef's rim
  {kind:'trap',n:3.5,env:{h:[-40,-5],sub:[0,0.45],expo:[0,0.6]}}, // buried in the sand where the ribbons pass — sand the surf does not strip (v11.66)
  {kind:'plough',n:2,env:{h:[-80,-8],sub:[0,0.4]}}, // v11.66: the flats' deposit feeder, on the sand the grazers pasture, the lagoon's floor and the terraces' sand
  {kind:'hood',n:0.3,env:{h:[-60,-6],sub:[0,0.45]}}, // v11.66: buried on the sand flats, an ambusher from below
  {kind:'hood',n:0.4,env:{h:[-40,-4],shel:[0.5,1]}}, // and the lagoon's floor (v11.66)
  {kind:'hose',n:1.7,env:{h:[-62,-14],sub:[0.5,1],nut:[0.4,1],flow:[0.15,0.85]}}, // in the weed forests (the stipe's own band, v11.66), after the flickers
  {kind:'lash',n:0.3,env:{h:[-80,-8],sub:[0.5,1],rel:[0.6,1]}}, // v11.66: the ledges and the lips — rock that stands above its surroundings (rel is 0.5 on flat ground)
  {kind:'wedge',n:6,env:{h:[-12,2],expo:[0.5,1],sub:[0.55,1]}}, // v11.66: the surf zone's walker, on the rock the waves strike (the cones' and the lime rind's ground)
  {kind:'crusher',n:0.5,env:{h:[-50,-8],sub:[0.5,1]}}, // on rock, where the rasps are (to −50: a crusher at −150 had nothing to eat)
  {kind:'watcher',n:0.5,env:{h:[-150,-14],sub:[0.4,1]}}, // the weed, the bladders, the terraces
  {kind:'hook',n:0.55,env:{h:[-62,-14],sub:[0.5,1],nut:[0.4,1]}}, // hangs in the weed forests
  {kind:'hook',n:0.4,env:{h:[-250,-40],sub:[0.6,1]}}, // and off rock faces
  {kind:'sickle',n:0.25,env:{h:[-300,-60],young:[0.35,1],sub:[0.4,1]}}, // the rockfall: the collapse's fresh blocks (v11.66: by young, not depth)
  {kind:'sickle',n:0.2,env:{h:[-160,-60],sub:[0.6,1],young:[0,0.3]}}, // and the terraces' rock
  {kind:'ram',n:0.12,env:{h:[-300,-40],nut:[0.5,1]}}, // v11.66: the open water over the upwelling flank, where the sifters swarm
  {kind:'stone',n:0.6,env:{h:[-320,-60],sub:[0,0.6]}}, // the plain, the terraces' sand
  {kind:'tread',n:0.06,env:{h:[-320,-60],sub:[0,0.4]}}, // a few in the whole world, on the mud (v11.66: sub to 0.4)
  {kind:'comb',n:0.2,env:{h:[-320,-150],nut:[0.3,1]}}, // the plain, the lantern fields, where the water is fed (v11.66); the abyssal's meal
  {kind:'relict',n:0.12,env:{h:[-450,-280],sub:[0.55,1],young:[0,0.3]}}, // v11.66 (SEAFLOOR §3): bare rock below the light and off the fresh flows — the sill's drowned summits, swept clean by the current; nowhere else has it
  {kind:'basker',n:4,env:{heat:[0.3,1]}}, // the vents (one cell of them)
  {kind:'picker',n:3,env:{h:[-800,-300]}}, // the lower flank's mud down into the dark (v11.28: to -400 while the void stood; the dark inside the square is the pit and the corners now, and the stone's and basker's food went with it)
  {kind:'picker',n:12,env:{heat:[0.3,1]}}, // and at the vents, in a swarm, picking at the mats (Earth's vent shrimp swarms): the basker's food (20 before the cinder took its share, v11.66)
  {kind:'cinder',n:8,env:{heat:[0.25,1]}}, // v11.66: the seep walker on the vent field's mats; the basker's other meal, and poison to eat (combat.js POISON) — the basker eats the field's down to a couple
  {kind:'cinder',n:1.5,env:{h:[-470,-440]}}, // and thinly along the seep line at the chemocline round every island (the sulfide's other home; the greymat's upper edge), where nothing hunts it — the kind's reservoir (v11.66)
  {kind:'pall',n:0.4,env:{h:[-800,CHEMO-20]}}, // the dark
  {kind:'arrow',grp:5,n:3.75,env:{h:[-62,-5]}}, // arrow squid hunt the shallows and the shelf in packs
  {kind:'great',n:0.1,env:{h:[-150,-8]}},
  {kind:'jelly',n:2,env:{h:[-800,-15]}},
  {kind:'jelly',n:2,env:{h:[-800,-15],nut:[0.5,1]}}, // twice as many in fed water
  {kind:'deepbell',n:0.35,env:{h:[-800,-220]}}, // the giant of the drift, below the light
  {kind:'sailer',n:0.15,env:{h:[-800,-60]}}, // the odd one on open water; the fleets are the canopy's (spawnChunkCreatures)
  {kind:'sailer',n:1.4,env:{h:[-70,-10],expo:[0.55,1]}}, // and driven in against the shore the wind strikes (Earth: an oceanic animal met on the beach after an onshore wind)
  {kind:'scuttle',n:6,env:{h:[-30,-3],sub:[0.4,1],expo:[0,0.7]}}, // out of the surf, which is the wedge's (v11.66)
  {kind:'scuttle',n:45,max:8,land:true,env:{h:[0.6,90]}}, // the strand's own population, by land area (was a rule of its own before v11.26)
  {kind:'eel',n:0.6,env:{h:[-62,-14],sub:[0.5,1],nut:[0.4,1]}}, // in the weed forests' cover
  {kind:'eel',n:0.5,env:{h:[-150,-5],sub:[0.5,0.85]}}, // and among the rubble
  {kind:'lurker',n:0.9,env:{h:[-300,-8],sub:[0.5,1]}}, // an ambusher needs rock to lie among
  {kind:'grazer',grp:5,n:10,env:{h:[-160,-6],sub:[0,0.5]}}, // the grazers on the sand pasture and the terraces' sand (PLANET: flats, bladders, terraces)
  {kind:'grazer',grp:5,n:6,env:{h:[-24,-6],sub:[0.5,1]}}, // and on the turf
  {kind:'ridge',n:0.2,env:{h:[-300,-40]}},
  {kind:'ortho',n:0.3,env:{h:[-800,-100],flow:[0.3,1]}},
  {kind:'ortho',n:0.12,env:{heat:[0.3,1]}}, // the vents: warm water below the thermocline
  {kind:'veil',n:0.2,env:{h:[-800,-150]}},
  {kind:'abyssal',n:0.1,env:{h:[-560,-380],nut:[0.25,1]}} // the rim of the dark where the water is fed (PLANET: the rim, forays below). v11.66: it was h −800..−400 over the whole basin's flanks, where the sill's and the far floor's cells reach no combs, and the 120-day census had it collapsing 70 → 12 since v11.65 (the 40-day run --test makes does not see it); the ledger's reach is 5×5 cells, so its home band is the two cells over the combs' deep edge
];
// The roster (PLANET.md) in the order the bestiary shows it (zoo.js). Display only: clade, family, niche, size is DEFS's (or the
// clade's, for the three players), floor: sits on the ground (shown at the game's floor clearance), new: built and not yet placed.
const ROSTER=[
  {id:'soft',name:'soft-arm',clade:'ringmouths',family:'jetters',niche:'the player',player:true},
  {id:'coil',name:'coilshell',clade:'ringmouths',family:'coilshells',niche:'the player',player:true},
  {id:'rasp',clade:'ringmouths',family:'coilshells',niche:'floor grazer, shelled',floor:true},
  {id:'great',clade:'ringmouths',family:'coilshells',niche:'shelf apex'},
  {id:'ortho',clade:'ringmouths',family:'straightshells',niche:'player-size predator, spear'},
  {id:'arrow',clade:'ringmouths',family:'jetters',niche:'small-prey hunter, in packs'},
  {id:'lurker',clade:'ringmouths',family:'crawlers',niche:'floor ambush, grab',floor:true},
  {id:'watcher',clade:'ringmouths',family:'crawlers',niche:'a curious omnivore',floor:true},
  {id:'pall',clade:'ringmouths',family:'the deep line',niche:'the dark\'s resident'},
  {id:'veil',clade:'ringmouths',family:'the deep line',niche:'big filter feeder (unconfirmed)'},
  {id:'fin',name:'finback',clade:'slowbloods',family:'finbacks',niche:'the player',player:true},
  {id:'darter',clade:'slowbloods',family:'finbacks',niche:'small forage'},
  {id:'needle',clade:'slowbloods',family:'finbacks',niche:'small-prey hunter, in threes'},
  {id:'grazer',clade:'slowbloods',family:'finbacks',niche:'floor grazer, herds',floor:true},
  {id:'basker',clade:'slowbloods',family:'finbacks',niche:'mid predator, vent-bound'},
  {id:'ridge',clade:'slowbloods',family:'ridgebacks',niche:'player-size predator, mixotherm'},
  {id:'abyssal',clade:'slowbloods',family:'ridgebacks',niche:'apex, gigantotherm'},
  {id:'eel',clade:'slowbloods',family:'longbacks',niche:'structure hunter'},
  {id:'stone',clade:'slowbloods',family:'platebacks',niche:'floor ambush, torpid, bite',floor:true},
  {id:'crusher',clade:'slowbloods',family:'platebacks',niche:'shell-eater'},
  {id:'scuttle',clade:'hingeshells',family:'walkers',niche:'floor grazer, walks on land',floor:true},
  {id:'trap',clade:'hingeshells',family:'walkers',niche:'floor ambush, strike',floor:true},
  {id:'hook',clade:'hingeshells',family:'walkers',niche:'structure hunter, climbs'},
  {id:'tread',clade:'hingeshells',family:'walkers',niche:'sediment feeder, the giant',floor:true},
  {id:'picker',clade:'hingeshells',family:'walkers',niche:'scavenger at the rim of the dark',floor:true},
  {id:'flicker',clade:'hingeshells',family:'paddlers',niche:'small forage'},
  {id:'hose',clade:'hingeshells',family:'paddlers',niche:'small-prey hunter of the towers — the splay look'},
  {id:'sickle',clade:'hingeshells',family:'paddlers',niche:'player-size predator, burst and coast — the keel look'},
  {id:'hood',clade:'hingeshells',family:'paddlers',niche:'ambusher from under the sand — the hood look',floor:true},
  {id:'lash',clade:'hingeshells',family:'paddlers',niche:'hunter of the ledges, whips out — the lash look'},
  {id:'ram',clade:'hingeshells',family:'paddlers',niche:'a blow on the swarms over the flank — the ram look'},
  {id:'comb',clade:'hingeshells',family:'paddlers',niche:'big filter feeder, the minor one'},
  {id:'sifter',clade:'hingeshells',family:'paddlers',niche:'small filter feeder of the fed water, in swarms'},
  {id:'relict',clade:'hingeshells',family:'paddlers',niche:'the sill relict: a hunter of pickers below the light'},
  {id:'cinder',clade:'hingeshells',family:'walkers',niche:'the seep walker, poison by its diet',floor:true},
  {id:'wedge',clade:'hingeshells',family:'walkers',niche:'the surf zone\'s walker',floor:true},
  {id:'plough',clade:'hingeshells',family:'walkers',niche:'deposit feeder of the flats',floor:true},
  {id:'jelly',clade:'drifters',family:'bells',niche:'the pulser, the lit water'},
  {id:'deepbell',clade:'drifters',family:'bells',niche:'the giant of the drift, below the light'},
  {id:'sailer',clade:'drifters',family:'floats',niche:'sails the surface, fishes with lines'},
  {id:'greatsailer',clade:'drifters',family:'floats',niche:'the landmark',new:true}
];
