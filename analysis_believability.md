# The believability of the world — an analysis (12 Sep 2026)

A reading of the planet, the island, the sessile life, the clades and the spawning as they stand in the docs and the code, followed by a judgement of how well they hold together as evolution and physics. Nothing here is a recommendation and nothing was changed. Sources: `PLANET.md`, `CLADES.md`, `TAXA.md`, `FLORA.md`, `DRIFTERS.md`, `CREATOR.md`, `DESIGN.md`, and `world.js`, `grow.js`, `flora.js`, `reef.js`, `chunks.js`, `far.js`, `creatures_defs.js`, `creatures_spec.js`, `ecology.js`, `creatures_ai.js`, with `node test/census.js 120` run once. Line numbers are the current files'.

## Part one: how it works

### The premises

The planet is stated, not derived, and the docs are honest about that: plausibility is a filter on ideas, not a generator of them. The premises that everything downstream leans on:

| premise | value | what it buys |
|---|---|---|
| star | late G / early K, 5300 K, L 0.51 at 0.71 AU | Earth-equivalent insolation; warm surface light; green plants fine |
| gravity | 1.0 g, `GRAV` 9.8 | Earth-like waves, breaching, flops |
| moon | one, large and close, about three times Earth's tidal force, declination 0 | 6–9 m tides on a 15.6 h period, a 30 h day, bright nights, a lunar eclipse at every full moon |
| atmosphere | about 28% oxygen | high-metabolism ringmouths, giant hingeshells |
| ocean | oxic to −450 then a chemocline; anoxic, ferrous and sulfidic below | "the dark" as a physical place; dissolved iron; a hard floor on shelled life |
| temperature | 26–28 °C to about −60, thermocline down the slope, 3 °C on the deep floor, hot at the vents | the slowbloods' warm home and their cold exile |
| light | red gone by −15, most green by −80, blue to −200; photosynthesis to about −150 | the pigment gradient and the flora's bands |
| the island | a young oceanic shield volcano, almost drowned, basalt, no continent | no river nutrients; upwelling on one flank; olivine sand; iron everywhere |
| founders | a few lineages reached it and radiated | endemics, giants and dwarfs, a lopsided tree, a modest species count |

The rule that governs all of it since 8 Sep is stated in CLAUDE.md: nothing exists that cannot be derived from a young shield volcano, a big close moon, 28% oxygen, iron, a chemocline at −450 and the founder lines. No biomes, no names, no magic.

### The island as a function

`sample(x,z)` in world.js is the whole geology. It is analytic: radial features read a warped angle and radius (±16% wavy contours), and the profile is built from smoothsteps:

- **The shield.** Rim foot at −14, shelf to −60 at r 700, eight 12 m terraces from −60 to −156 between r 700 and 1000 (drowned shore platforms of a subsiding island), slope to −250 at r 1200, apron to −290 at 1600, then the lower flank falling at 16.7° easing to 12.4° with no floor inside the square (−320 on an axis at the edge, about −580 at a corner).
- **The caldera.** A flat sandy floor at −22 inside a rim of land at +2.5 ± 3.5 (r about 245), broken by passes 3 m below the rim where the tidal stream runs.
- **One flank collapse** (centre 3.9 rad): a 75 m headwall, a hummocky fan out to r 1100, 30 m mounds near the scarp, a few blocks breaking the surface. This is where fresh basalt is.
- **One dike swarm** (centre 0.35 rad, the wave-struck flank): 22 radial ridges 19–34 m high between r 790 and 1080, exhumed by lowstand wave-cutting.
- **Two rift arms** (2.6 and 5.6 rad): low ridges of younger flows. Arm 0 carries a 520 m pit crater at r 470 and the hydrothermal fissure between r 1200 and 1420; arm 1 carries the flank cone at r 500, the only land besides the rim: a hill of about 40 m.
- **Wind and current** are single directions. Waves strike 0.35 rad; the current strikes 5.44 rad and leaves a wake at 2.3 rad where the eddies retain what floats.

The clock: 30 h days, a 13-day spring–neap cycle, a tide that is potential flow round a 900 m cylinder, a day in 40 real minutes. Weather is noise over the hour: rain, cover, cirrus, wind.

### The nine condition fields

Every point carries `FI`: substrate, flow, exposure, nutrients, turbidity, youth of the rock, heat, shelter, relief. They are the island's physics made queryable, and the honest test the docs set themselves is that you could strip every name and still say what lives where. How each is made:

| field | derived from | physical? |
|---|---|---|
| sub | mud with depth (0.1 at −90 to 0.85 at −260); sand in the wave lee on the shelf; lagoon sand; fan rubble; bare rock on dike crests, the rim, fresh blocks and any steep face | yes, plus ±0.25 noise for patchiness |
| flow | a cosine of the current's direction, the shelf break, the passes, the lagoon's shelter | yes, no noise |
| expo | a cosine of the wind's direction, a 30 m wave base, the lagoon | yes, no noise |
| nut | the upwelling flank, the shelf break, the vent, the lagoon | yes, no noise |
| turb | stirred fine sediment, plankton in lit fed water, the vent plume | derived from the others |
| young | the fan, the rift arms, the fissure | sector masks |
| heat | the fissure sector | geometry |
| shel | the lagoon mask | geometry |
| rel | the height's departure from the smooth profile | derived |

Light, temperature, pressure and oxygen are not fields; they are treated as functions of depth alone. A species carries an envelope over these fields plus height and slope, and `envW` returns a tolerance 0..1 with soft edges. That number is the density of a plant per cell, the carrying capacity of an animal per cell, and the acceptance of a spawn point. There is no other placement logic.

### The sessile life

FLORA.md set the grammar: three energy sources (light, suspended food, chemistry), six physical tests a form must pass (light, drag, attachment, grazing, nutrients, energy source), and eight bauplans that are "the physics" (axis, branch, blades, tuft, cup, disc, mound, line). TAXA.md then supplied descent: every form sits on a tree with named splits, each split an innovation with a stated cost.

**Three photosynthetic lines from three planktons**, zoned by pigment:

- **greens** (jointed axes, 0 to about −40; the land line): turf, strap, grape, chain, and in air the tidewood, reed, tussock and scrub.
- **floaters** (a rope with floats, −15 to −80): wisp, ribbon, ladder, bladder, stipe.
- **reds** (a rind, −40 to −150 and the reef's crest): rind, limerind, sandball, redblade.

`pigment(h,line)` gives each line its own colour ramp with depth, clamped, plus a brightness boost shallower than 25 m. The line's band is a consequence of its pigment, and the envelopes enforce it: no photosynthetic entry has a lower bound below −150.

**Four sessile animal lines**, each the fixed stage of a swimming clade or a founder of its own: sacs (a bag with two holes: tube, cup, vase, barrel, glass, frond, burr, star), polyps (the drifters' fixed stage: fans, pens, tables, horns, domes, bommies, towers, the rust variants on basalt), crowns (ringmouths that sat down: lily, tulip, loop's occupant, plume and seep at the vents and the chemocline, stilt), cones (hingeshells that sat down: cone, nod). Mats are bacteria: rust on young basalt, sulfur at the vents, grey below the chemocline.

**The colonisation story** in TAXA orders them: vent animals oldest, then filter feeders as the summit crossed the chemocline, then reds at −150, floaters at −60, greens and the reef at −20, land via the intertidal, then subsidence making every land species a relict, then the flank collapse replaying the pioneer sequence on fresh rock. The depth a line owns is the order it came in.

Placement (chunks.js) applies the physics again: nothing sessile below −450 except the seep tubes and grey mats; nothing on a face steeper than the entry's `maxSlope`; floor plants shortened to sit 1.4 m under the surface; structures scaled to clear 12 m; flow-facing entries yawed across the contour; talus only under a face; slide rock only where the rock is young.

### The clades

PLANET's founding idea is **the stalemate rule**: Earth's Cambrian disparity was pruned when one lineage combined jaws, an endoskeleton and a fast metabolism. Here no clade has all three. Ringmouths have the metabolism, the brain and a beak but no bone; slowbloods have bone and the bite but are ectotherms; hingeshells have armour and must moult. Each clade has one deep decision that everything follows from.

CLADES.md then supplied what PLANET lacked, a shared ancestry: **a radial crawler with a ring of arms round a terminal mouth and a ring of eyespots on the rim, no head.** Bilateral symmetry evolved three times, from a ring, and each clade broke the ring differently:

| clade | what it did with the ring | the tells |
|---|---|---|
| ringmouths | kept it open and differentiated it 2-4-2 (grasp, oars, keel) | no head, a collar of small eyes on the mantle rim, a forward cluster on predators, a visible mouth ring and beak, a three-lobed skirt, copper-teal flesh, an internal or external mineral |
| slowbloods | fused it into a point: a ring of short stiff mouth tentacles that close to an arrowhead and bloom on the bite | fins in threes at 120°, a three-lobed tail, a ring of small dark eyes with two carried forward on predators, chevron plates, iron-rust flesh, no white teeth |
| hingeshells | strung it into rows: flaps or legs down each side | a bivalved carapace hinged along the back, a ring mouth of plates at the front, stalked eyes that never track plus a rim row, a comb instead of antennae, vanadium-pale joints |
| drifters | kept it radial and made the arms sting | eightfold, translucent, eyeless, pigment by depth for the drifter's own reasons |

Two characters are ancestral and shared: every mouth is radial (nothing on the planet has a hinged jaw) and the rim eyes survive on everything. Eye colour, blood tint and geometry language (spheres and chains; lathes; boxes and cones with joints) are the per-clade signatures. Eyes show intent regardless of clade. No eye glows, no emissive material anywhere.

The coat system (`coatFor`) makes colour chemistry: melanins free to all, ommochromes only in ringmouths, carotenoids only from a diet that reaches the photosynthesisers, blue structural and pointless below −20, red free camouflage below −15, countershading only where there is light, shell colour the water's mineral.

The roster is drawn by niche, not by symmetric tree: every niche has a winner and lesser representatives. 37 species across four clades, plus scale variants.

### Spawning and the ledger

Each spawning species has a `SPAWN` entry: a capacity per cell at full tolerance and an envelope, almost always over height and one or two of substrate, flow, exposure, nutrients or heat. Capacity is that number times the cell's mean tolerance from a 36-point sample. The ledger (`POP`) holds a count per entry per cell for the whole world, all the time.

Off screen the ledger runs a model every three real seconds: births by allometry (birth rate falls as mass to the quarter power), natural death as a tenth of the birth rate, a type III saturating predation response over each hunter's reach in cells, a take cap per prey kind per cell, starvation when a hunter's condition falls below a threshold, and drift to neighbouring cells with free capacity. Loaded cells spawn from the ledger and write back: recruits owed are laid as egg clutches near an adult, clutches are edible, juveniles hatch at 0.55 scale and grow up out of sight.

On screen, behaviour is by role. Hunters scan every 0.4 s, hunt only when hungry past 0.4 and off cooldown, take the nearest prey in detection range with the player weighted nearer, give up on boredom, distance or nine seconds, and eat at the carcass. Grazers flee anything whose prey list names them within 7 m, or anything of size six within 18 m. Ambushers sit and lunge, traps strike on a tell, the watcher stands off at six metres and looks, drifters sting what touches them, sailers move at 5% of the wind at 40° off downwind by their handedness. Carcasses sink, decay over half a day, and are eaten by the killer and by scavengers.

The census on paper (120 days): 3617 capacity, 3042 at day zero; apex predators in single figures, mid predators in tens, forage in the hundreds and thousands. The test passes.

### What the design reaches for

Reading the docs in order, the ambition is consistent: **a world that is believable from its logic rather than from its looks.** Every trait must survive "why hasn't something better outcompeted it". Earth is quoted constantly as the proof a strategy works and refused as the identity of anything. The world is a function so that nothing needs a label. The animals are one tree so that four clades read as one planet's work. Colour is chemistry so that a coat says where the animal eats. Numbers are a ledger so that a predator's count is what its prey feeds. The person's rule of 8 Sep, no magic even for gameplay, is the same ambition applied to the eye: nothing glows, floats, stands or moves without a physical reason.

The order of work was also chosen: design the creatures first, build their looks, then the mechanics (temperature, burst movement, moulting, the drain, detection modes). Most of the believability is therefore written down and enacted in placement and shape; much of it is not yet enacted in behaviour.

## Part two: how believable is it

### Where the physics is strong

- **The star and the orbit check out.** L 0.51 at 0.71 AU gives insolation within 1% of Earth's. A 5300 K star is a comfortable K-dwarf and long-lived. The 26–28 °C mixed layer follows.
- **The moon's consequences are followed through.** A big close moon with zero declination gives a lunar eclipse at every full moon; the code has the umbra. A tidally slowed 30 h day is the right direction. Bright nights follow. This is rare in fiction: the moon is not decoration.
- **The island is a real landform.** Shield profile, summit caldera with a lagoon and passes, subsidence terraces as drowned shore platforms, one flank collapse with a headwall and a hummocky debris fan, coherent slide blocks, an exhumed dike swarm on the oldest wave-cut flank, rift arms with a pit crater and a fissure, a cinder cone as the island: this is Hawaiian and Canarian volcanology assembled correctly. The decision on 10 Sep to run the lower flank on down at pillow-lava angles instead of a void, with the plate 15 km out and the moat and arch dismissed as out of scale, is the kind of reasoning that makes the rest credible.
- **The condition fields are honest.** Substrate follows depth, exposure and slope; flow follows the current's aspect and constrictions; nutrients follow upwelling and the shelf break; turbidity is derived rather than painted. Only substrate carries direct noise, and only for patchiness. A reader with the formulas and no names could indeed say what lives where.
- **The light gradient is right in outcome.** Red gone by −15, greens shallowest, floaters (the brown analogue) middle, reds deepest and encrusting, nothing photosynthetic below −150: this is the zonation of Earth's shore, and the bands are enforced by envelopes, not by biome. Vividness as sunscreen in bright water is a good true reason for the reef's colour.
- **Drag before height.** The argument that a trunk underwater is the wrong answer and a float on a flexible stem the right one, with trunks winning only in air, is exactly correct and it drives the tidewood, the stipe that lays its blades flat, the bommie shortened in the surf and the tall tower moved to the calm. The tide band as the one road to land is a genuinely thought-through consequence of the tides.
- **Chemosynthesis as bacteria only.** "Chemosynthetic plant is a category error" and the correction to mats, tubes with plumes and iron stromatolites is right, and it removed the game's lure-feeders and glowing stalks for a reason.
- **The chemocline as a depth, not a place.** The straddling seep tubes drawing a line round the whole island, the milky bacterial plate, the grey mats and nothing else below: this follows from the premise and gives "the dark" its character without a biome id.

### Where the physics is thin

- **A cold, anoxic deep ocean under a 28% atmosphere.** These three do not sit together easily. Anoxic deep water on Earth occurs in silled basins (the Black Sea) or in hothouse intervals when the deep ocean was warm and sluggish and no cold polar water sank to ventilate it. The docs give the deep floor 3 °C, which is the signature of cold polar deep-water formation, and that circulation carries oxygen down. A 28% atmosphere is itself a product of sustained organic-carbon burial and would be expected to ventilate the ocean. The chemocline is the single most load-bearing premise in the game and it has the least mechanism behind it. Nothing in the code depends on the mechanism, so this is a matter of the fiction's foundation rather than of the build; it is the one place a physical-oceanographer reader would stop.
- **Tidal range at a mid-ocean island.** Open-ocean tides are small on Earth (under a metre at most oceanic islands) because large ranges are amplified by shelves and coastal geometry. Three times Earth's tidal force gives three times the equilibrium tide, which at an isolated seamount is a metre or two, not six to nine. A larger multiple, or a different moon, would carry the stated range. The range is what the intertidal story, the reed-bed, the strand and the passes are built on, so it matters to the fiction more than most numbers.
- **"Young" and the erosional history.** Eight subsidence terraces, a wave-cut flank deep enough to exhume dikes, and a collapse fan all need time on the order of a million years, while a summit caldera still sits at sea level. This is within Hawaiian timescales, so it is consistent if "young" means a million years rather than a hundred thousand. The docs never say which.
- **Radial ancestor, terrestrial oxygen.** With 28% oxygen and scrub on land, fire on the flank cone would be frequent and the vegetation would be adapted to it; nothing addresses it. Minor, because land is explicitly parked.

### Where the biology is strong

- **The radial ancestor is the best idea in the design.** Bilateral symmetry evolved three times from a ring, every mouth radial, rim eyes on everything, and each clade's silhouette derived from what it did with the ring rather than decorated onto an Earth body plan. It gives a single reason for the arm counts, the fin counts (three at 120°), the eye arrangements and the mouth shapes at once. It is the difference between a costume and an anatomy, and it survives the same-niche test the docs pose: an ortho, a ridge and a sickle at 50 m tell apart by arrangement.
- **The stalemate rule** is a good piece of evolutionary storytelling. It names the actual reason vertebrates pruned the Cambrian and withholds the combination, which explains why three body plans persist at the top. Whether or not it is how history would go, it is the kind of reason the docs demand: cheap and true.
- **The founder-and-niche framing.** Species by niche rather than by symmetric tree, with a winner and lesser representatives per niche and a 90/8/2 share rule, is how real communities look. The niche audit table is a real ecologist's tool.
- **Colour by chemistry.** Blood pigment as the clade's tint, carotenoids only from a diet that touches the light, red as free camouflage below −15, blue structural and useless in the dark, countershading only where there is light to shade against, shell colour as the water's mineral: every one of those is a true rule on Earth and each does visible work in the game. The vent diet with no carotenoids, pale or iron-red, is a lovely consequence.
- **The drifters.** Eyeless, brainless, unable to hunt, stinging what touches them, pigment by depth for their own reasons, a fixed stage that is the reef: this is the most Earth-like clade and also the most honest, because the cnidarian solution is the cheap one and the docs say so. The sailer's handedness and one-shore stranding is a real and rarely used fact.
- **The sessile trees.** Each split named for what it bought and what it cost, every leaf naming its food, convergence marked rather than hidden (three lines each inventing a blade and a turf), the colonisation order tied to the summit's depth history. Sessile animals arriving before weeds is correct for seamounts. The reef zoning itself by physics into crest, fore reef, passes, lagoon and back reef, once the reds are in, is right.
- **The ledger.** Birth by mass to the quarter power, a type III response, a take cap, starvation by condition, drift to free capacity: this is textbook and the census confirms a pyramid in counts with apex predators in single figures. Hunters hunting only when hungry, and the player hunted because it is prey-sized, are the two behaviours that make the ecology feel like one.

### Where the biology is thin

- **Phylum-level founders on a 3 km island.** PLANET says a few founding lineages reached the volcano and radiated into every niche, by the Galápagos rule. Island radiation on Earth produces species and genera, not four body plans of phylum rank. The clades must be ocean-wide and old; the island can only filter them and, at most, breed a few endemic species. The docs waver between the two readings. The world works either way, but "the founders radiated here" and "three clades happened under a long-lived star" are two different stories.
- **The slowblood premise is not enacted.** The clade is defined by ectothermy: activity as a function of temperature, the shelf as home, the vents as the one warm place below, gigantotherms and mixotherms as the exceptions. There is no temperature function and no multiplier. A basker is as quick at −300 as at the vents; a stone is torpid by role, not by cold. The docs list this as a hook, so it is known, but as built the slowbloods are fish-shaped animals with a different mouth.
- **The ringmouth premise is half enacted.** High metabolism, boom-and-bust numbers and packs are the clade's definition, but the ledger's birth rate is by mass alone and identical across clades; only the arrows spawn in packs. Intelligence appears once, in the watcher's curiosity.
- **Animals in anoxic sulfidic water.** The pall lives below −458 by design, the picker walks the floor to −800, and hunters visit. The vampire squid precedent is an oxygen-minimum zone, which is hypoxic, not anoxic and sulfidic; no multicellular animal lives in sulfidic water for long. The seep tubes that straddle the boundary are the right answer; a resident swimmer below it is the one place the no-magic rule is bent, and the drain on the player that would make the point is not built.
- **Vanadium as a blood pigment.** Tunicates concentrate vanadium but it is not their oxygen carrier and its function is unknown; a vanadium-carrying blood is a well-known misreading. The hingeshells' pale joints and yellow-green tint are a good look and could be true for another reason. Copper (haemocyanin, teal when oxygenated) and iron (haemoglobin, rust) are right.
- **The chambered shell's limit at exactly the chemocline.** A coincidence engineered for legibility; Nautilus implodes near 800 m. The docs admit the engineering. It is harmless, but it is an example of a rule chosen for the map rather than derived from the animal.
- **The biomass pyramid is inverted at boot.** The census counts are a pyramid, but at day zero hunter biomass is about twice mortal prey biomass, and over 120 days the big hunters fall to what the prey supports (ortho 17 to 6, ridge 12 to 4, basker 2.5 to 0.7). The model is doing its job; the world the player meets is the pre-crash state, since a game day is 40 minutes and nobody plays 80 hours. The pyramid the docs describe is the one the model converges to, not the one that is drawn.
- **Immortals.** The veil, pall, great, watcher, tread and every drifter have hp 1e9 and take no part in the ledger's deaths. As "nothing hunts it" they are believable; as animals that cannot die they are a shortcut. The great rams only the player, which contradicts the rule that predators hunt the player because it is prey-sized.
- **Land.** One 40 m hill with tussock and scrub, a tide band of reed and tidewood, and the scuttle as the only animal that walks out. The marine route to land through the intertidal is a fair alien choice (Earth went through fresh water), and "every land species is a relict" is a good excuse for the emptiness. The docs park land, so this is a known gap, not a flaw.

### Are they sufficiently alien?

The animals now have a non-Earth logic that Earth's do not share: a radial mouth on everything, bilateral symmetry three times over, fins in threes, eyes as a ring with additions, a hinged bivalved carapace on a five-metre predator. That is real alienness, derived rather than decorated, and it is more than most fiction manages. What remains Earth-like is the silhouettes at distance, which convergence honestly predicts: a fast pelagic hunter is fusiform, a jetter is a mantle with arms, an armoured walker is a segmented box on legs. CLADES.md's diagnostic table is unusually candid about this, and its own answer, that the arrangement is the tell and not the count, is the right one. Whether the tells read at 50 m in the game's light is the person's to see and is marked unseen in the changelog.

The sessile life is the less alien half. Every form has a physical reason and TAXA marks the convergences, but the roster reads as Earth's marine benthos with the names removed: coralline crusts, rhodoliths, Caulerpa runners, Halimeda chains, Sargassum floats, Macrocystis, sponges of every shape, corals, crinoid-like crowns, barnacles, Riftia tubes, iron stromatolites. The docs' defence is that light, flow and attachment are the same problem for every fixed thing and the shapes are few; that is true, and it is why the flora is believable. It is also why the flora is familiar. The two things the sessile world has that Earth's does not are the crowns' eye rings and the seep line at the chemocline; both come straight from the planet's premises, which is the pattern that works.

### The overall shape of it

The believability is strongest exactly where the design invested its reasoning: the landform, the condition fields, the light gradient, the drag argument, the clade anatomy, the colour chemistry and the ledger. It is thinnest in two kinds of place. The first is the foundation: the chemocline's mechanism and the tidal range are stated numbers that a physical reader can argue with, and the founder story is told at the wrong taxonomic rank. The second is the gap between what the docs define and what the code enacts: temperature, boom-and-bust, the drain, moulting, detection modes are the clades' definitions and none of them runs yet, so the clades are believable as anatomy and placement but not yet as physiology. The docs know both, list them as hooks, and follow a stated order of work. As a piece of world-building the thing is unusually coherent because it has one rule and applies it everywhere; as a biosphere it is a well-argued anatomy waiting for its physiology.
