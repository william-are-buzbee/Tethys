// creatures_defs.js — species stats and where they spawn. This is the file to edit for ecology changes.
// v11.55 (COMBAT.md): there are no hit points. hp keeps two meanings only — ≤1 is forage (dies at the touch), ≥1e8 is immortal (takes no wound);
// any other value is nothing. dmg is a bite's size for the blood and the debris. venom {kind: 'paralyse' (t seconds, against: clades) | 'sting'}
// is the clade's chemistry (§3b): the lurker's beak paralyses, the basker's and the grazer's spines sting whatever clamps them.
// roles: boid (a loose ribbon: flickers, darters) hunter (chases prey) graze ambush (sits, lunges; hang: from up in the structure)
// trap (sits, strikes) watch (the curious one) coil drift wander. legs: can move out of the water (walks); everything else is a
// swimmer and flops when beached. size: rough half-length, used for collision, LOD and floor clearance (clear overrides the
// clearance: a buried trap sits low). reach is centre-to-centre: how far an animal can bite. Since v11.31.1 the bite test floors it
// at the two bodies' own contact distance (creatures_ai.js reachOf, BITE_M), so a reach shorter than the biter's nose plus the
// prey's body no longer means it can never bite what is in front of it — 45 of the 58 predator/prey pairs here are such a pair.
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
  darter:{build:()=>compile(SPECS.darter),stock:8,size:0.6,speed:3.6,flee:5.5,hp:1,edible:true,food:14,role:'boid',turn:7},
  glim:{build:()=>compile(SPECS.glim),size:0.55,speed:3.0,flee:5,hp:1,edible:true,food:12,role:'boid',turn:7},
  arrow:{build:()=>compile(SPECS.arrow),size:1.0,speed:5.8,hp:1,edible:true,food:24,role:'hunter',prey:['darter','flicker','scuttle'],detect:14,reach:0.9,dmg:0,biteCD:1,home:26,cruise:8,turn:5,cruiseF:0.5,cool:2},
  grazer:{build:()=>compile(SPECS.grazer),stock:3,size:2.6,venom:{kind:'sting'},speed:2.3,flee:4.2,hp:70,role:'graze',home:32,floor:true,turn:1.5}, // mortal since v11.26: the ridge's and the sickle's meal (it was 1e9 and every hunt ended bored)
  veil:{build:()=>compile(SPECS.veil),size:16,speed:1.4,hp:1e9,role:'wander',home:200,cruise:70,turn:0.35,cruiseF:1},
  great:{build:()=>compile(SPECS.great),size:6,speed:1.0,ram:5,dmg:12,radius:9,reach:5.2,hp:1e9,role:'coil',home:45,cruise:10,turn:0.8,cruiseF:1},
  ridge:{build:()=>compile(SPECS.ridge),size:9,speed:7.8,hp:140,role:'hunter',prey:['player','grazer','picker'],detect:46,reach:6.6,dmg:32,biteCD:1.5,home:240,cruise:60,turn:1.4,cruiseF:0.4,cool:5},
  ortho:{build:()=>compile(SPECS.ortho),size:8,speed:9.5,hp:90,role:'hunter',prey:['player','needle','darter','grazer','picker'],detect:40,reach:5.6,dmg:24,biteCD:1.2,home:220,cruise:70,turn:1.6,cruiseF:0.4,cool:5},
  abyssal:{build:()=>compile(SPECS.abyssal),size:15,speed:9.2,hp:400,role:'hunter',prey:['player','comb'],cycle:10,detect:85,reach:10,dmg:55,biteCD:1.8,home:420,cruise:200,turn:1.0,cruiseF:0.45,cool:6},
  eel:{build:()=>compile(SPECS.eel),size:4,speed:6.4,hp:55,role:'hunter',prey:['player','darter','flicker'],detect:17,reach:4.0,dmg:16,biteCD:1.1,home:40,cruise:14,turn:2.5,cruiseF:0.35,cool:4},
  lurker:{build:()=>compile(SPECS.lurker),size:2.4,venom:{kind:'paralyse',t:7,against:{slowbloods:1,ringmouths:1}},hp:45,role:'ambush',prey:['player','darter','flicker','rasp','scuttle','needle','grazer'],radius:9,lunge:14,reach:3.2,dmg:20,turn:4,lodNear:75},
  // drifters (DRIFTERS.md): no eyes, no hunting; they sting what touches them. surface: rides the wave (ys under the crest's origin)
  jelly:{build:()=>compile(SPECS.jelly),size:1.4,hp:1e9,role:'drift',reach:1.4,dmg:4,noOrient:true},
  deepbell:{build:()=>compile(SPECS.deepbell),size:4.5,hp:1e9,role:'drift',reach:4.2,dmg:8,noOrient:true,lodNear:90},
  sailer:{build:()=>compile(SPECS.sailer),size:1.8,hp:1e9,role:'sail',dmg:6,noOrient:true,surface:true,ys:-0.15,lines:0.9,lodNear:130},
  greatsailer:{build:()=>compile(SPECS.greatsailer),size:4.5,hp:1e9,role:'sail',dmg:10,noOrient:true,surface:true,ys:-0.3,lines:1.4,lodNear:230},
  // legs: walks on the strand and the sea floor alike; the only thing that is at home out of the water
  scuttle:{build:()=>compile(SPECS.scuttle),stock:4,size:0.7,speed:2.4,flee:3.8,hp:1,edible:true,food:10,role:'graze',home:18,floor:true,legs:true,turn:5,cruiseF:0.5,scav:30},
  // The roster (PLANET.md), placed v10.7: size is the roster's half-length in metres; the stats are first guesses, tuned from what the
  // person sees. No temperature model yet (the basker is quick everywhere; PLANET Hooks), no moulting, no detection modes.
  rasp:{build:()=>compile(SPECS.rasp),stock:8,size:0.5,speed:0.7,flee:1.2,hp:1,edible:true,food:8,role:'graze',home:10,floor:true,turn:2,cruiseF:0.6,scav:12},
  watcher:{build:()=>compile(SPECS.watcher),size:1.8,speed:2.6,hp:1e9,role:'watch',home:30,floor:true,detect:26,stand:6,turn:2.5,cruiseF:0.4,scav:50},
  pall:{build:()=>compile(SPECS.pall),size:9,speed:1.2,hp:1e9,role:'wander',home:160,cruise:60,turn:0.3,cruiseF:0.8,deep:true,lodNear:110},
  needle:{build:()=>compile(SPECS.needle),size:0.9,speed:5.2,flee:6,hp:1,edible:true,food:16,role:'hunter',prey:['flicker','darter'],detect:12,reach:1.2,dmg:0,biteCD:1,home:24,cruise:6,turn:5,cruiseF:0.5,cool:2},
  basker:{build:()=>compile(SPECS.basker),size:5,venom:{kind:'sting'},speed:7.2,hp:120,role:'hunter',prey:['player','picker','grazer','needle'],detect:32,reach:4.6,dmg:22,biteCD:1.4,home:70,cruise:25,turn:1.6,cruiseF:0.4,cool:5},
  stone:{build:()=>compile(SPECS.stone),size:3,hp:200,role:'trap',prey:['player','picker','rasp','grazer'],cycle:5,detect:2.8,reach:3.0,dmg:22,strike:{tell:0.15,dur:0.35},cool:2.5,turn:1.5,floor:true,clear:0.8},
  crusher:{build:()=>compile(SPECS.crusher),size:4,speed:5.6,hp:110,role:'hunter',prey:['rasp','scuttle','player'],preyClade:'coil',scav:40,detect:24,reach:4.2,dmg:28,biteCD:1.5,strike:{tell:0.3,dur:0.35,speed:9,range:1.7},home:50,cruise:14,turn:2,cruiseF:0.4,cool:4},
  trap:{build:()=>compile(SPECS.trap),size:2,hp:60,role:'trap',prey:['player','flicker','needle','darter','scuttle'],detect:4.5,reach:3.3,dmg:24,strike:{tell:0.35,dur:0.3},cool:3,turn:6,floor:true,clear:0.45},
  hook:{build:()=>compile(SPECS.hook),size:2.5,hp:50,role:'ambush',prey:['player','flicker','darter','needle'],hang:true,radius:11,lunge:11,reach:2.8,dmg:18,turn:3},
  tread:{build:()=>compile(SPECS.tread),size:7,speed:0.9,hp:1e9,role:'graze',calm:true,home:90,floor:true,legs:true,turn:0.5,cruiseF:1},
  picker:{build:()=>compile(SPECS.picker),stock:3,size:1.5,speed:1.6,flee:2.6,hp:1,edible:true,food:10,role:'graze',home:40,floor:true,legs:true,turn:2.5,cruiseF:0.6,scav:90},
  flicker:{build:()=>compile(SPECS.flicker),stock:8,size:0.4,speed:2.8,flee:5.5,hp:1,edible:true,food:6,role:'boid',turn:8},
  hose:{build:()=>compile(SPECS.hose),size:1.5,speed:5.5,hp:30,role:'hunter',prey:['flicker','darter'],detect:14,reach:2.2,dmg:0,biteCD:1.2,strike:{tell:0.25,dur:0.25,speed:9,range:1.8},burst:{on:0.45,off:0.9},home:30,cruise:10,turn:2.2,cruiseF:0.5,cool:2},
  sickle:{build:()=>compile(SPECS.sickle),size:5,speed:9.5,hp:150,role:'hunter',prey:['player','needle','grazer'],detect:42,reach:6.4,dmg:30,biteCD:1.8,strike:{tell:0.5,dur:0.4,speed:17,range:2.0},burst:{on:0.7,off:1.5},home:200,cruise:50,turn:1.0,cruiseF:0.4,cool:5},
  // the raptor family's other looks (v11.9.1): built for the bestiary, not placed (no SPAWN entry); stats are the sickle's.
  // v11.10: every species whose build is compile(SPECS.x) is a spec (creatures_spec.js); the lab (#lab) edits them. A hand builder is a species without one.
  hood:{build:()=>compile(SPECS.hood),size:5,speed:8.5,hp:150,role:'hunter',prey:['player','needle','grazer'],detect:42,reach:6.4,dmg:30,biteCD:1.8,strike:{tell:0.5,dur:0.4,speed:16,range:2.0},burst:{on:0.7,off:1.5},home:200,cruise:50,turn:1.0,cruiseF:0.4,cool:5},
  lash:{build:()=>compile(SPECS.lash),size:3,speed:9.5,hp:90,role:'hunter',prey:['player','needle','darter'],detect:36,reach:5.0,dmg:20,biteCD:1.5,strike:{tell:0.4,dur:0.35,speed:17,range:2.0},burst:{on:0.6,off:1.2},home:160,cruise:40,turn:1.4,cruiseF:0.4,cool:4},
  ram:{build:()=>compile(SPECS.ram),size:4,speed:8.0,hp:200,role:'hunter',prey:['player','grazer'],detect:38,reach:5.5,dmg:34,biteCD:2.0,strike:{tell:0.6,dur:0.5,speed:15,range:2.4},burst:{on:0.8,off:1.8},home:180,cruise:45,turn:0.8,cruiseF:0.4,cool:6},
  comb:{build:()=>compile(SPECS.comb),size:7,speed:1.8,hp:260,role:'wander',burst:{on:1.4,off:3},home:180,cruise:60,turn:0.4,cruiseF:1}
};
// The world's capacity (v11.26): n is the individuals per cell of a kind at full tolerance, scaled by the cell's mean tolerance for the
// envelope (ecology.js ecoCap; chunks.js cellW) — it is the carrying capacity K of the ledger, not a spawn count. The ledger runs at
// 60–90% of it where nothing eats a kind and lower where something does. grp: placed in groups of that many (packs of arrows,
// herds of grazers, threes of needles, ribbons of flickers and darters as boid schools); land: on the strand, by land area. The
// numbers are a trophic pyramid drawn for 12 km² of water: apex predators in single figures, mid predators in tens, forage in the
// thousands (test/census.js prints the totals and runs the ledger's model on paper; DESIGN, The ecology). Before v11.26 the
// world held 70 ridges and 64 orthos against 172 darters — a pyramid upside down, and every hunt ended bored.
const SPAWN=[
  {kind:'flicker',grp:10,n:32,env:{h:[-62,-4]}}, // the floor of the food web, in loose ribbons
  {kind:'darter',grp:9,n:20,env:{h:[-45,-5]}}, // darter ribbons over the shallows
  {kind:'needle',grp:3,n:3.6,env:{h:[-45,-4]}}, // needles hunt the ribbons in threes
  {kind:'rasp',n:14,env:{h:[-40,-3],sub:[0.55,1]}}, // rasps graze the rock of the shallows and the reef's rim
  {kind:'trap',n:3.5,env:{h:[-40,-5],sub:[0,0.45]}}, // buried in the sand where the ribbons pass
  {kind:'hose',n:1.7,env:{h:[-62,-14],sub:[0.5,1],nut:[0.4,1]}}, // in the weed forests, after the flickers
  {kind:'crusher',n:0.5,env:{h:[-50,-8],sub:[0.5,1]}}, // on rock, where the rasps are (to −50: a crusher at −150 had nothing to eat)
  {kind:'watcher',n:0.5,env:{h:[-150,-14],sub:[0.4,1]}}, // the weed, the bladders, the terraces
  {kind:'hook',n:0.55,env:{h:[-62,-14],sub:[0.5,1],nut:[0.4,1]}}, // hangs in the weed forests
  {kind:'hook',n:0.4,env:{h:[-250,-40],sub:[0.6,1]}}, // and off rock faces
  {kind:'sickle',n:0.22,env:{h:[-250,-40],sub:[0.4,1]}}, // the rockfall, the terraces
  {kind:'stone',n:0.6,env:{h:[-320,-60],sub:[0,0.6]}}, // the plain, the terraces' sand
  {kind:'tread',n:0.06,env:{h:[-320,-60],sub:[0,0.5]}}, // a few in the whole world
  {kind:'comb',n:0.2,env:{h:[-320,-150]}}, // the plain, the lantern fields; the abyssal's meal
  {kind:'basker',n:4,env:{heat:[0.3,1]}}, // the vents (one cell of them)
  {kind:'picker',n:3,env:{h:[-800,-300]}}, // the lower flank's mud down into the dark (v11.28: to -400 while the void stood; the dark inside the square is the pit and the corners now, and the stone's and basker's food went with it)
  {kind:'picker',n:20,env:{heat:[0.3,1]}}, // and at the vents, in a swarm, picking at the mats (Earth's vent shrimp swarms): the basker's food
  {kind:'pall',n:0.4,env:{h:[-800,CHEMO-20]}}, // the dark
  {kind:'arrow',grp:5,n:3.75,env:{h:[-62,-5]}}, // arrow squid hunt the shallows and the shelf in packs
  {kind:'great',n:0.1,env:{h:[-150,-8]}},
  {kind:'jelly',n:2,env:{h:[-800,-15]}},
  {kind:'jelly',n:2,env:{h:[-800,-15],nut:[0.5,1]}}, // twice as many in fed water
  {kind:'deepbell',n:0.35,env:{h:[-800,-220]}}, // the giant of the drift, below the light
  {kind:'sailer',n:0.15,env:{h:[-800,-60]}}, // the odd one on open water; the fleets are the canopy's (spawnChunkCreatures)
  {kind:'sailer',n:1.4,env:{h:[-70,-10],expo:[0.55,1]}}, // and driven in against the shore the wind strikes (Earth: an oceanic animal met on the beach after an onshore wind)
  {kind:'scuttle',n:6,env:{h:[-30,-3],sub:[0.4,1]}},
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
  {kind:'abyssal',n:0.1,env:{h:[-800,-400]}} // the dark
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
  {id:'hood',clade:'hingeshells',family:'paddlers',niche:'raptor family, the hood look',new:true},
  {id:'lash',clade:'hingeshells',family:'paddlers',niche:'raptor family, the lash look',new:true},
  {id:'ram',clade:'hingeshells',family:'paddlers',niche:'raptor family, the ram look',new:true},
  {id:'comb',clade:'hingeshells',family:'paddlers',niche:'big filter feeder, the minor one'},
  {id:'jelly',clade:'drifters',family:'bells',niche:'the pulser, the lit water'},
  {id:'deepbell',clade:'drifters',family:'bells',niche:'the giant of the drift, below the light'},
  {id:'sailer',clade:'drifters',family:'floats',niche:'sails the surface, fishes with lines'},
  {id:'greatsailer',clade:'drifters',family:'floats',niche:'the landmark',new:true}
];
