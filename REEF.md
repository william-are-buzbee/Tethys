# REEF — how big a "coral" thing can be, and the framework generator

10 Sep 2026. The person asked (with two screenshots of the tiered spiny towers at 80 m and 17 m): using real evolutionary and
ecological logic, what size is coral actually, where, why and when; whether large coral structures are plausible on an island this
size or somewhere nearby; and, if they can be larger than what is built, a list of larger structures and a generator for unique
ones — as tools to deploy on a bigger world, judged only on whether they are believable. Downstream of `PLANET.md` (the young
shield, the tides, the clear water, the chemocline) and `TAXA.md` (the polyp line's farmers and fishers, the reds' lime rind, the
sacs); beside `FLORA.md` (which said "giants: always, where plausible" and built the old dome). Built as v11.20: `src/reef.js`, the
coat in `chunks.js`, the placer knobs in `far.js`. **Answered, not yet seen.**

## v11.22 — the coat binned; the system instead (10 Sep 2026)

The rock coat was seen: colonies clipping half the rocks they stood on, flat against faces, at odd angles, encased by neighbouring blocks,
and — the deeper note — "dark rock and these things meant for light sand". The person's ask was a system: not tweaking placements one by one,
but a way that stays right as the world grows. Built as v11.22 (CHANGELOG): the coat is gone; a cell places its rock first and every plant
asks the collision hash before it stands (`clearOf`). The clipping in the screenshots was mostly not the coat at all — it was the ordinary
flora placed by ground height with the rock placed independently over it, which nothing had ever checked. Now nothing stands inside rock,
or inside an earlier rigid plant, in any cell, in any world size. What this document keeps is the analysis: how big coral is and why.

## v11.21 — struck and turned round (10 Sep 2026)

The person saw the pinnacles coated (v11.20.1): "MUCH better, even though I don't really like how it looks at all ... like a piece of art
displayed deliberately ... the rock will always stand out from the sandy ground, no matter how many times you try to make it work." And the
real finding under it: nothing in the world ever *touched* — coral, rock, ground and creatures were all separate things kept apart, so a
manufactured rock with coral on it was the only place they met, and it read as a display. Their call: let coral be the size it is, stop
avoiding rock, and put the coral **on the rock the geology already placed** — a big face within the coral's depth is more interesting than a
built pile. So: every manufactured reef structure below (pinnacle, capped pinnacle, microatoll, drowned ridge, cold-water mound, glass
reef) is **struck** — the kits stay in reef.js for reference, nothing places them — and the mechanism is turned round: **every rock in the
world carries anchors** (the fan's heaps and sheets, the talus under every face, the boulders from ~4.5 m across, the ledges on the
cliffs) and one table, `ROCK_EPI`, of every species that cements to hard ground; each anchor goes to whichever of them fits by its own
envelope at the anchor's depth and fields (farmers and rinds in the light, fans and lilies in flow, rust forms on young rock, cones in the
surf, glass and vases below), at the species' own size. The largest colonies got shapes instead of size: two more giant forms beside the
old dome (`olddome2` two fused lobes, `olddome3` the low wide Solomons form). What follows is the analysis as written and the v11.20
build as it was; the tools table's "built" column is history for the manufactured rows.

## The answer in one paragraph

Two different things get called big coral, and the answer splits on which. **A single colony** — one animal, one continuous living
skeleton — is common at 10 cm to 2 m and tops out around **6–8 m tall and 30 m wide, as a mound, in shallow calm clear water, after
300–500 years**; a few per reef. A tall rigid *individual* (gorgonian, black coral, glass-sponge stalk, tube worm) stops at 3–5 m,
and only below the wave base in steady flow. **Framework** — centuries of dead skeleton cemented by crusts, alive only on its skin —
is a landform and has no organism-sized ceiling at all: bommies 10–30 m, pinnacle reefs 100–200 m thick, cold-water mounds tens of
metres high and kilometres long in the dark, sponge reefs 20 m tall on mud. So the towers as built (11–14 m, 20 m at scale, one
colony each) were over the line; the *larger* things the person wants are real and abundant, but every one of them is **a pile of
dead reef with a living coat**, not a bigger animal. That is what v11.20 builds, and why the tower shrank to 4.5–6 m.

## The sizes — what Earth shows, and why

### One colony
| form | biggest known | why that and no more |
|---|---|---|
| massive mound (Porites, Pavona) | *Pavona clavus*, Solomon Is., 2024: 34 × 32 m, 5.5 m tall, ~300–500 yr; "Big Momma" (Am. Samoa) ~7 m tall, 41 m round; a Devonian stromatoporoid head several metres | CaCO₃ is strong in compression and useless in tension; a mound never sees tension. Every part of it stays alive and defended. Upward growth ~1 cm/yr, so height is bought in centuries and only where nothing knocks it down for centuries |
| branching / tabular (Acropora) | tables 3–5 m across; thickets covering hectares (many colonies) | fast (10–20 cm/yr) and brittle by design: storms break it and every fragment is a new colony. Height limited by bending at the base |
| tall rigid individuals in flow (gorgonians, black corals, bamboo corals, *Hyalonema*'s spicule stalk, *Riftia*) | 2–5 m; *Leiopathes* 4,000 years old at 2–3 m; *Monorhaphis* 3 m, 11,000 yr | they stand to get above the floor's silty boundary layer into cleaner, faster water — real and worth height — but a dead base is undefended, bored by sponges and bivalves, and the colony topples; *Lophelia* lives as 1–2 m colonies on a pile of its own dead ancestors for exactly this reason |
| microatoll | 1–8 m across, ≤ 2 m tall, flat dead top | a mound that reached the lowest tide and died on top; keeps growing outward at the rim. The reef flat's furniture |

The tower's case, honestly: mechanics is not the limit. A 12 m column 2.6 m across at 1 m/s sees a bending stress of ~50 kPa at
its foot against a skeleton strength in megapascals; it would stand. What stops it is *time and defence*: nothing keeps a dead base
whole for the 300–1,200 years the height takes, and a fisher below −150 has no light competition to pay for it. A living column is
plausible up to about the mound's height, as a massive colony stood up out of the terrace's silt layer — hence 4.5–6 m, and the
old dome (14–26 wide, 5–8 tall) stays as the single-colony giant it always was.

### Tethys's modifiers
- **28% O₂**: nothing. Calcification is light, temperature and carbonate chemistry; oxygen buys big animals, not tall colonies.
- **3× tidal currents, 6–9 m tides**: lower and stronger things in the wave zone; *bigger filter feeders* below it (flow is food); a
  reef flat that is a landscape twice a day — microatolls, rubble ramparts, a crest of limerind and cones and nothing else.
- **No rivers**: clear water, a deep photic floor (−150). Framework can grow a little deeper than Earth's; the farmers' green
  symbiont still stops near −40 (TAXA). A farmer with a *red* symbiont to −100 would be Earth-true (mesophotic *Leptoseris* does it
  with a different zooxanthella clade) and a genuine new split — **asked, not built** (below, Tools).
- **Subsidence**: the eight drowned terraces at 12 m spacing, at an oceanic island's ~2.5 mm/yr, are ~40,000 years in the photic
  zone. Keep-up reefs accrete 1–10 m per thousand years. That is enough for tens of metres of framework on the rim, *and* it means
  the reef built a rim along every old shoreline before the island sank out from under it: **drowned reefs on the terrace lips**,
  dead, colonised by the fishers (Earth's proof: Hawaii's −150 m reefs off Hilo, killed as they went under the light). The world
  did not have these; it does now.

### Where framework can be, on this island, measured
`sample()` scanned on a 12 m grid (the sandbox, 10 Sep): reef-fit rock in the photic zone (−2..−30, clear, hard) **33 ha**, 14 of it
sheltered (the lagoon and the rim's inner slope: patch reefs), 11 exposed (the crest and the fore reef), 1.9 with the passes' flow
(bommies); terrace rock in flow at −60..−150 **57 ha** (drowned reefs); rock in flow at −150..−450 **26 ha**, nearly all on the flank
the current strikes (5.4 rad; cold-water mounds); deep mud at −150..−450 **380 ha** (glass reefs); the fan at −60..−150 with
`young ≥ 0.8` **17 ha** — *no* framework there, ever: too young for anything but rust (TAXA stage 7). Area is not the constraint
anywhere; time is, and the terraces say there has been enough. On a bigger island the same fields say the same things over more
ground: more rim, more lips, more flank. Nothing new is needed.

### Earth's eras, read for the same lesson
Cambrian archaeocyath reefs: metre-scale mounds. Ordovician bryozoan–sponge–microbial mounds: tens of metres. Silurian: the Michigan
Basin's pinnacle reefs, 100–200 m thick, a kilometre across at the base, on a subsiding shelf — the best reference for what a sinking
island grows. Devonian: the largest reefs ever (Canning Basin, 350 km; Alberta), built by stromatoporoids (sponges) that individually
reached 1–5 m. Precambrian stromatolite reefs kilometres long from mats that build millimetres a year. In every case the *reef* is the
giant and the *organism* is not; the eras differ in who was piling, never in how tall one of them stood.

## The tools — believable or not

| tool | what it is | where (by the fields) | Earth's proof | verdict | status |
|---|---|---|---|---|---|
| **pinnacle / patch reef / bommie** | a pile of framework widening upward: undercut foot (borers), wide shoulder, a coat of farmers | rim, passes, lagoon floor (a patch reef sits on sand round a hard nucleus), −8..−32, clear, no heat, not young | GBR bommies 10–30 m; Michigan pinnacles | **yes** | built: `pinnacle`, `pinnacle2` |
| **capped pinnacle** | one that reached the lowest tide and died flat on top | as above, in ≤ 24 m of water: it fills up to half a metre under a spring low | microatolls on stalks; reef-flat knolls | **yes** | built: `pinnacle3` (`fill`, `clear` 5) |
| **microatoll** | a wide flat dead plate with a live rim | the flat, −5.5..−11, sheltered from the surf | Porites microatolls 1–8 m | **yes** | built: `atoll` |
| **drowned reef** | a dead lime ridge along a terrace's lip, fishers and rinds on it | terrace lips −54..−165, hard, not young; only where the ground drops within 20 m (`drop`) | Hawaii's drowned reefs | **yes** — and it is the story of the terraces made visible | built: `drowned`, `drowned2` |
| **cold-water reef mound** | the fishers' skeleton piled along the current, alive at the crest | the current flank −150..−430, flow ≥ 0.42, rock | *Lophelia* mounds 200–1000 m, tens of m high, km long | **yes** | built: `coldreef` |
| **glass reef** | glass sacs' spicules piled on mud, the next generation on top | deep mud −200..−440, weak flow | BC hexactinellid reefs, 20 m, 9,000 yr | **yes** | built: `glassreef` |
| **spur-and-groove** | ridges of framework and sand channels normal to the surf | the windward fore reef | every exposed reef front | **yes**; a terrain feature (world.js), TAXA parked it | not built |
| **fore-reef wall** | a vertical face of old framework from the crest to the first terrace | the rim's outer slope | the drop-off of any fringing reef | **yes**; terrain | not built |
| **rubble rampart** | coral shingle thrown up on the crest by storms | the crest, exposed | storm ridges on every atoll rim | **yes**; a lime-palette boulder entry, trivial | not built |
| **rust stromatolite mound** | the iron mats' framework: metres of ochre laid down over centuries | the fan, oxic, fresh basalt | Loihi's iron mats; Proterozoic stromatolite reefs | **yes**, low and slow — the fan's one structure | not built (a bigger `iron`) |
| **mesophotic farmer** | polyps farming a red cell, to −100 | the upper terraces in the clearest water | *Leptoseris* at 150 m | plausible; a **new split** in TAXA — the person's call | asked |
| a single rigid colony over ~8 m | | | none | **no** (above) | the tower cut to 4.5–6 |
| green or vivid below −20; framework on the fan or the dikes; a lattice or arch of living coral | | | none | **no** | — |

## What was built (v11.20) — the framework generator

`src/reef.js`, loaded after flora.js (its entries append to `FLORA` so the far layer's per-type rng streams for the rock are
unchanged). A reef structure is built like the rock — dodecahedral lumps with facets, twelve-plane colliders, set on the ground by
`settleOn`, drawn by the far layer for the whole world — in a lime palette, by **growth rules, not fall rules**:

- **pinnacle** (`pinnacleGeo`): courses of lumps up a profile narrow at the foot, widest at the shoulder (a bommie is mushroom-shaped,
  the heap's opposite); the core lumps massive and taller than wide so the courses fuse. With `cap`: a wide flat dead plate on top and
  a live rim of small lumps under its edge. Height 1, ~0.42 across the shoulder, 15–25 lumps, level-2 facets (the player swims round it).
- **mound** (`moundGeo`): long and low along local z, alive at the crest — the cold-water and glass reefs. 3 × 1.2 × 0.55; level-1 facets.
- **atoll** (`atollGeo`): a flat plate with a raised rim. 2 wide, 0.3 tall.
- **ridge** (`ridgeGeo`): five lumps along local z with lower lumps hung on the outer face — the old fore reef. 3 long, ~0.5 high.

Every kit carries **anchors** — points and normals on its upper surfaces (`lumpAnchors`: on the ellipsoid each lump is drawn as, at
0.84 of the circumradius so they sit on the dented facets; undersides and points inside another lump skipped; `top` where the normal
is near vertical). The entry carries an **epi table** — which species, on tops or flanks, at what chance and size factor — and the
cell coats it (`chunks.js coatStructure` / `placeEpibionts`, after `placeBigSolids`): each anchor in the cell is offered the table, a
species is drawn by weight from the entries its face allows, gated by the species' own envelope at the anchor's depth with the
substrate forced to rock (the anchor is on framework whatever the ground under it is; `free` skips the gate where the structure
vouches for the site — a fan on a cold-water mound stands in the flow the mound built into), placed along the normal at a random spin
(`upTo`: a hand-rolled quaternion, so the stub and the real three agree), never into the air, and put in ordinary per-species instanced
meshes with their colliders. The framework is the far layer's and never pops; the coat is the cell's (near detail, cut at `FLORA_FAR`
with everything else). Two pinnacles never wear the same coat: that is the "unique structures" mechanism, modular by construction —
any kit × any table × the anchor's depth. `FLORA=1 SCALE=12 DEPTH=-10 node test/preview.js pinnacle` renders a kit in its coat.

New placer knobs (far.js `bigPlace`/`bigsGen`): **`clear`** — how far under mean level a structure's top stays (12 for the rock; a reef
5: it grows to the lowest tide and stops, half a metre under a spring low); **`fill`** — scale up to reach `clear` (a microatoll is as
tall as the tide lets it); **`flow`** on a structure — yawed along the current by `flowYaw`, the rng draw kept so nothing else moves.
`settleOn` has **`drop: [R, fall]`** — only where the ground within R falls `fall` below the point (a lip), the mirror of `face`.

Headless count (10 Sep): 112 pinnacles on the rim, the passes and the lagoon (tops −5 to −20; the capped ones all at −5.0..−5.4),
23 microatolls, 97 drowned ridges at −54..−165 on r 700–1100, 11 cold-water mounds on the NE flank, 34 glass reefs on the apron:
277 structures, 755k tris for the whole world (the rock's 160 are 401k). A 12 m pinnacle wears ~25 colonies of ~40 anchors.

## Unseen — ask in this order
1. Does a pinnacle read as a reef knoll and not a pile of rocks (the lime tints under the water's light; the mushroom profile; the
   coat: tables on the shoulder, horns on the flanks)? Look at one in the lagoon from the surface and from its foot.
2. Do the capped pinnacles' flat tops sit just under the water at a spring low (the `fill` rule)? Do any break the surface?
3. The drowned ridges on the terrace lips: on the lip, not hanging over it (the `drop`/`fit` pair); do the fans face the current?
4. The coat's fit: colonies floating off the facets or sunk into them (`coatStructure`'s sink: 0.12 + 0.05 × scale).
5. `render` ms on the rim and at (900, −400) on the current flank (the mounds are the biggest single things there now).
6. The tower at 4.5–6 on the terraces: does it still read, or should the terraces' verticals be the drowned reefs alone?

## Open — the person's
- The mesophotic farmer (a red-symbiont polyp to −100): a new split in TAXA, or leave the light's floor for farmers at −40.
- Spur-and-groove and the fore-reef wall: terrain features for the bigger island (world.js), or never.
- The rubble rampart and the rust stromatolite mound: two cheap entries; yes or no.
- Densities: `per` on every reef entry is a first guess (7/5/4 pinnacles, 24 atolls, 4/3 ridges, 4 mounds, 1 glass reef a cell).
