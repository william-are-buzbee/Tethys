# DIRECTION — where the project is going, and why (12 Sep 2026)

The record of the believability discussion and the game-structure discussion of 12 Sep 2026, after `analysis_believability.md`
(the analysis that started it). Downstream of `PLANET.md` for the planet's facts (the planet-level decisions below are also entered
there, dated); upstream of every pass that builds any of this. **Status: decided, nothing built.** The person's answers are quoted or
paraphrased; where a point was raised and not answered it is in [Open](#open) and is theirs to decide.

## What was decided

### The world
- **One island now, an archipelago later.** The current island is finished and its ecology made right first; then more islands. The
  islands are a **hotspot chain**, so elevation is age and each age is a different landform: *young* (tall, steep, fresh basalt and rust,
  no terraces, no reef), *mature* (the current island: terraces, a fringing reef, the caldera lagoon), *old* (an atoll: the summit
  drowned, a reef ring kilometres long with low islets, a wide lagoon, reef flats that dry at low tide), *oldest* (a guyot: a drowned flat
  top at −100 to −200, a bank). Islands close enough to merge share an edifice with **saddles** between them at −200 to −400 that
  channel the current (the richest filter-feeding ground) and, where above the chemocline, are the oxic corridors between islands;
  channels below it are barriers a floor animal cannot cross. This puts the Galápagos rule at the rank where it is true: floor species
  endemic per island, swimmers shared. The long tide bands and reef zones the person wants are the atoll's flats and the bank, not
  stretched cones. Land stays small: the young island's height, the atoll's islets. The ledger will need re-running per island (home
  ranges cross saddles; wind and current wakes differ per island); the vacuum will not survive contact and that is expected.
- **Oxygen to Earth's, ~21%.** The 28% was borrowed from the Carboniferous for giant bugs, which is a land (tracheal) effect; water-
  breathers gain only a third more dissolved oxygen from it and Earth's marine giants exist at 21%. The honest argument for big
  hingeshells (buoyancy, closed circulation, moulting as the real limit) works at 21%. Dropping it removes two problems: fire on land and
  the tension with an anoxic deep.
- **The chemocline stays, as this basin's, not the planet's.** *(Built v11.58, 15 Sep: the floor at −1100, the sill's nearest segment across the north-east corner with its gap on the current's axis; PLANET The basin has the Earth cases and the one stretch, the tides.)* A planet-wide anoxic deep under an animal atmosphere cannot be permanent
  (Earth's anoxic events were transients that ended themselves by burying carbon). A **silled basin** is permanent and real (the Black
  Sea, Cariaco, the Baltic deeps; Saanich Inlet has 2–3 m tides and anoxia below 100 m with autumn renewal events): a ridge enclosing
  the chain with its crest near −400 to −450, a basin floor between −800 and −1500, exchange through a few narrow deep gaps. The sill
  replaces the "plate 15 km out" horizon of v11.28 with a ridge rising toward the light; the gaps carry the strongest steady current in
  the world (the filter-feeder cathedrals, the cruisers' road, a future gate to the ordinary ocean); renewal events make the boundary
  move (a dense inflow, the chemocline dropping for a while, the seep line exposed, every scavenger arriving). The deep's water is sill-
  depth water, ~8–10 °C, not 3. Earth-level oxygen is compatible. No Earth twin for a volcanic chain inside such a basin; nothing in the
  physics forbids it. The person: "not strongly attached to the chemocline… unless it's believable, then I AM attached" — this way it is.
- **The pall moves up, not out.** The suboxic layer above a sulfidic chemocline is where the vampire-squid kind of animal lives (Cariaco:
  tens of metres thick). The pall belongs in the band just above −450, the picker on the redoxcline; nothing multicellular below.

### The animals
- **Size is not the believability problem; density is.** A 15 m ectotherm predator and a 16 m gelatinous filter feeder are Earth-real
  (megalodon, the ichthyosaurs, Leedsichthys); what Earth will not give is many of them (density falls as mass^−0.75: a three-tonne
  predator at roughly one per hundred km²). Encounters depend on the area the player sweeps (≈2 km²/h at 7 m/s with a 46 m detection
  radius), not on the world's size, so a bigger world lets the density be honest while the encounter rate barely moves. Giants are kept
  seen by **haunts** (the envelope ties the big one to a feature), **aggregation events** (a carcass fall, the tide flushing a pass),
  **size as age** (a size distribution, the giant the old one; the juvenile system is the start), **sessile giants** (time, not
  metabolism), and one strained case per clade watched (a fast jet-propelled 8 m ortho strains; a big ringmouth wants to lurk or drift;
  the tread strains on moulting and wants a terminal moult; the slowbloods carry a 15 m apex without excuses). "Large animals are not
  really an issue, we just have to deal with it when we're updating or implementing creatures" (the person).
- **The hingeshells, the long segmented plan (the person's Nausicaä fantasy): legit, more than most of the roster.** Earth's proof:
  the radiodonts (Anomalocaris 1 m, Aegirocassis 2 m, a filter feeder), the eurypterids (2.5 m), the remipedes (many identical segments,
  paddles in a metachronal wave). Three advantages the docs had not said: serial organs scale with length (each segment brings its own
  paddle and gill), length is cheap and mass is expensive (a 10 m comb at 0.6 m across weighs what a 5 m fish does; `derive` reads
  volume off the build and would charge it honestly, where the ledger's size³ charges it as a fish), and adult armour is nearly free of
  predators. **The limits, firm:** no pursuit (metachronal paddling cannot sustain a chase; the strike, the ambush, the drop); poor
  turning; moulting caps swimmers near 5 (the sickle) and giants must stop moulting (terminal moult, then age and mineral — the tread,
  the only kind at 14 m, never a swimmer); giants belong in cool water (the deep terraces, the upwelling), never the 27 °C shallows;
  nothing flies or breaches. **"Everywhere" means a size pyramid with a wide base:** swarms at the bottom (the flicker in the
  thousands), a few kinds in the middle, one or two giants. Niches the plan fills well: forage swarms, the mid-water filter feeder (the
  one honest 10–12 m swimmer, and the long-range animal — a slow cruiser following the plankton saddle to saddle), a deep long-bodied
  scavenger of carcass falls (3–4 m, torpid, starves for years: Bathynomus), ambush by strike, benthic walkers and grazers, structure
  climbers, infauna (a buried one that emerges on the flood in the lagoon), small-prey hunters in cover at 1.5 m. The person: more
  variety with these, larger where the niche allows, "length over size or power", slow turning, and the traps avoided (giants that moult,
  the wrong giant in the wrong place).

### The game (what makes it fun)
The person's framing, accepted: a believable ecology is a documentary until you are hungry or dying; the loop that works is Metroid's —
keys, doors, fear of the door, opening it anyway — and Subnautica supplies the reason to go down the scary hole with tech. **Not a
human** (decided). ~~**Not a lineage across generations** (decided: the world would have to change with the generations, and that is not
the game).~~ **Struck 20 Sep 2026: the game is a lineage — see `LINEAGE.md`.** The old reason is answered there: the line is the
animal's, not the world's, and the world does not have to move for a hatchling to inherit its parent's spec. So, in a creature-only
game, **the body is the tech**: one animal, from juvenile to giant, the creator opening at growth
stages the way the fabricator opens on blueprints.

- **The doors** are physical and already exist: current (the passes on a spring, the sill gaps), depth (pressure on a chambered shell,
  cold on a slowblood, darkness without the sense for it), the chemocline (sulfide across the channel), size both ways (the lava tube
  and the crevice fit a small body; the ridge's reef is survivable only in a big one — growing closes doors as well as opening them),
  air (the strand, the reed bed at low tide, the young island's crater lake), territory (the basker's vents, the abyssal's rim: guarded
  rooms with a guard that is only sometimes there, because hunters hunt only when hungry — the stick implied and rarely present).
- **The keys are eaten, where the chemistry says** — the coat system's logic promoted to the whole body (the person: "you eat the parts
  directly. Makes perfect sense"): **mass** (points are grams; growth stages open the editor, each with a budget); **minerals** (lime on
  the reef, iron at the vents — black iron plates mean feeding in the basker's field); **pigments** (carotenoids from the
  photosynthesisers: chromatophores, camouflage); **symbionts** (acquired by ingestion, as corals and tubeworms do: a green from the
  reef's polyps for energy in the light, a sulfur bacterium from the plume tubes for the seep line and the channel crossing); **stolen
  weapons** (nudibranchs keep the jellies' stinging cells: eat a drifter, sting for a while); **senses** (the dark is scary because your
  sense fails there and the key is a sense: barbels or a chemoreceptor make it readable and the render changes; a lateral line makes a
  still hunter invisible and a moving one loud); **reserves** (fat before a crossing).
- **The loop:** born small in the nursery (the reed bed, the lagoon), the pass and its current the first door; the shelf forest and its
  first sticks; the reef for lime and the green; the drop and the terraces; the vents for iron and the sulfur bacterium behind the
  basker; the rim, the seep line, the abyssal; the channel crossing on reserves and the symbiont; the next island a new community with
  a different environment behind a different door (the atoll's brackish marsh, the crater lake behind the land key). Backtracking is
  real because growth closes doors. **The player starts as the smallest body the creator allows** (decided) — the nursery means nothing otherwise.
- **The base is a den.** Real: a ringmouth's crevice with a midden wall, then a garden (damselfish farm patches; octopuses keep
  gardens), then a pen of live prey; a hingeshell burrows; a slowblood holds a territory round a crevice. Heal, store, hide the clutch,
  return at night and on the spring flood. It escalates with mass and the clade's intelligence and never needs a wrench.
- **What is at the bottom:** the constructing species. The deep-line ringmouths as the clever clade's clever end — arranged things at
  the rim that should not be arranged, a veil that lets them near. Never explained. The abyssal the guard, the seep line the corridor,
  the symbiont the key, the reward a sight. The person: "cool".
- **Events by physics, not scripts** (the person: "just correct, things that will eventually be in the project"): a veil's carcass
  feeding the island for days; the comb's migration; a moult season with shed carapaces; the spring flood in the reed bed and the passes
  running; low tide stranding prey for the walkers; storms stripping floaters and beaching sailer fleets; the chemocline's renewal pulse;
  the eclipse at every full moon as the one dark night. Day and night alone changes the game every twenty minutes.
- **Senses per clade** (raised as the answer to "we see through human eyes"): render what the animal has that we do not, as overlays —
  three views of one world, and the current matters to stealth (scent runs downstream). The person: "might be onto something", separate
  from the core loop; it rejoins it as the sense keys above.

## What this changes in the other docs (when the passes come)
- `PLANET.md`: the planet section (28% → ~21%), the ocean (a silled basin, the sill and the gaps, renewal), the mountain (a chain; the
  plate paragraph of v11.28 becomes the sill), the deep's temperature, the pall's band, the size/density rule. Entered as a dated
  Decided section there now; the body text changes with each pass.
- `CLADES.md` / the roster: the hingeshell size pyramid and the new niches (the filter-feeding migrant, the deep scavenger, the infaunal
  one); the tread's terminal moult; the ortho's speed.
- `CREATOR.md`: the editor at growth stages with a mass budget and mineral/pigment/symbiont gates; the player as a juvenile.
- `DESIGN.md`: the ledger's mass from `derive` rather than size³; the sill in the far layer; the den; the sense renders.
- `TAXA.md` / `FLORA.md`: the atoll's crest and flats, the bank, the sill gaps' gardens; the crater lake unparked when the young island exists.

## Order (proposed, not decided)
Finish the one island's ecology and looks (the current cadence) → the player as a juvenile with growth stages and the editor at them
(the loop's skeleton on one island: mass, minerals, pigments) → hunger, the den → the symbionts and the sense keys (the dark, the
channel) → the archipelago (the chain, the saddles, the sill and its gaps) → the events → the builders.

## Decided later the same day (12 Sep 2026), from the Open list
1. **The tides: a closer moon.** 6–9 m at a mid-ocean island needs more than "three times Earth's force" (open-ocean tides are small;
   big ranges are a shelf-and-basin effect). Decided: the moon sits at about **half Earth's lunar distance** — roughly 8× the tidal force
   (force goes as the inverse cube of distance), a couple of metres of open-ocean tide, amplified to the stated 6–9 m on the archipelago's
   banks and lagoons. The visible price is accepted: a **~10-day month** (period scales with distance^1.5), springs and neaps every five
   days, phases changing nightly, an eclipse every ten days. The code's `SPRING_D` 13, `moonIllum`'s 26-day period and the moon's angular
   size (`MOON_R`) change with the pass; `LUNAR_H`/`TIDE_P` follow from the new orbit.
2. **A physiology model: temperature, pressure, "all that".** Yes. `temp(x,z,y)` (PLANET Hooks) and pressure with depth, read by the
   creatures (the slowbloods scale speed, turn and detect by temperature; gigantotherms and mixotherms with a floor) and by the player
   (the loop's cold and depth doors).
3. **Player hunger.** Yes, to build; the first piece of the loop. **Built v11.73 (21 Sep 2026)** as the ledger's own model on the player's line
   kind — one rule for every animal — with the clutch paid from it (LINEAGE §6).
4. **Eggs, mating and reproduction are real mechanics**: a mate of your kind, a clutch at the den, the hatchlings. The egg system
   (v11.26) is the start. ~~within one life (not generations)~~ — **20 Sep 2026: across generations too; the clutch is how the line
   continues and how you change bodies (`LINEAGE.md` §4).**
5. **Reputation is a facet of intelligence in general.** Some species remember (the clever clade first); it is not a mechanic on its own
   but part of how intelligent animals behave.
6. **The starting size is the smallest body the creator allows** for the clade — the juvenile, born in the nursery.

## Open — deferred by the person
1. **How young "young" is** (a million years, Hawaiian, which the terraces and the exhumed dikes need; or a hundred thousand): decided
   when the single island is finished and the archipelago begins. Not before.
2. **The ledger's mass for long bodies**: size³ (the fish assumption) or `derive`'s volume off the build? Undecided; matters once the
   hingeshell giants are long and thin.
