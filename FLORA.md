# FLORA — the sessile life of tethys, and the generator that grows it

**9 Sep 2026: `TAXA.md` is the tree** — the descent of every line here, the splits and what each bought, and the order the lines
reached the mountain. Answered and built as v11.15: the one weed line below is now **three** — greens (jointed axes, 0..−40; the land
line), floaters (a rope with floats, −15..−80; the raft is one that let go) and reds (a rind, −40..−150 and the reef's crest) —
and `pigment(h)` is `pigment(h, line)`. Where this file says "weed" and one line, TAXA wins.

**v10 (8 Sep 2026): there are no biomes.** The roster's "where" columns below name the pre-v10 biome ids; they are history.
Each species now carries a tolerance envelope in flora.js (`env`: ground height, slope, substrate, current, exposure, food,
fresh basalt, heat, shelter, relief — PLANET Geology, DESIGN World shape), and the envelope *is* the reason column made
executable: a weed forest is rock in the light on the flank the current feeds; lime polyps are rock in clear bright poor
water; rust mats are fresh basalt; lilies are hard ground in a current; crags are the collapse's rubble. Read the "why it
wins" column and the `env` together; when they disagree the env is wrong.

**v10.2**: the raft is a flat leafy mat (runners, dense small blades, berries at the nodes — Sargassum's mass, not its
skeleton; v10.1's branching stems read as bark); every sway species leans downstream with the current (`aCur`).
**v10.1**: the pads are gone — the raft is a tangle (Sargassum's shape), the colony a float with zooids beneath and lines trailing
downstream (nothing floating takes weight); the lure-feeders (stalk, ltree) were a rationalisation and are gone with the rest of the
bioluminescence — the deep floor has pens, whips, **glass** and **frond** (built) and nothing lit.

Downstream of `PLANET.md` (the planet, the light gradient, the clades, the founders) and upstream of `flora.js`.
**The person answered the open list on 8 Sep 2026** (see [Decided](#decided)); v9.5 builds the grammar and the reef top,
the shelf, the flats, the rockfall's rust and the rafts; the slope proper, the deep, the vents and the rim are next.

The brief: a SpeedTree-like generator — a vast quantity of unique-looking sessile structures, every one evolutionarily
plausible, distinct by place — applied as a toolkit across the biomes. The current flora is a hodge-podge (lily pads
with roots, Earth kelp standing ten metres into the air, spiny towers in the surf, spheres). Plausibility is the same
filter PLANET uses: every form needs the cheapest *true* reason it hasn't been outcompeted.

**Earth is reference, not template** (the person, Sep 2026). It is the one living planet there is, so it is quoted
constantly here — as the proof that a strategy works, never as the identity of a thing. Nothing on tethys is an Earth
organism under a new name, and nothing is a blend; where a tethys form and an Earth form coincide it is because the
physics coincided, and the reason is written next to it. The method is: look at what Earth's early seas spat out, ask
what problem each form solved, then ask what *this* planet — its star, its tides, its iron, its chemocline, its
handful of founders — spits out for the same problem. Often something else.

## What "flora" is here

Three energy sources, and the form follows the source:

1. **Sunlight** — photosynthesisers. Only above ~−150; colour by depth (the green gradient). Multicellular, mostly soft.
2. **Suspended food** — filter and suspension feeders. Sessile *animals*. Any depth; they need **flow**, so they crowd
   edges, ridges, passes and the arch, and face across the current. Rigid, because standing still in a current is the job.
3. **Chemical energy** — chemosynthesis. This is **bacterial**; nothing multicellular does it. What is visible is
   either a **mat** (a colour and a fuzz) or an **animal that farms the bacteria** (a tube with a plume). "Chemosynthetic
   plant" is a category error, and the correction changes the look: tubes, plumes, mats and crusts, never fronds. The
   energy pays enough to build big things only where the chemistry is concentrated: the vents and the chemocline.

The early seas of Earth are the reference because that is when its sessile life was *most* of the picture: floors of
filter-feeding animals with weeds among them (both reference images). And in an ocean without rivers, symbiont-bearing
animals win the clear poor water while weeds win where upwelling feeds them — true of a basalt seamount with no continent.

## The filter — six tests a sessile form must pass

- **Light.** Above −150 or it isn't photosynthetic. Deeper means thinner blades, more area per gram, darker pigment.
  Green only to ~−15/−20; olive and gold on the shelf; red and purple crusts on the upper slope; then nothing
  (PLANET, the green gradient). *Vividness* is a shallow thing too: bright colour in bright water is sunscreen
  (Earth's proof: the fluorescent proteins of shallow coral). So: vivid on the reef top, muted on the shelf, dark below.
- **Drag.** Tides of 6–9 m and tidal currents three times Earth's. A tall rigid thing in the wave zone snaps; flexible
  things bend (stipes, blades, holdfasts) and rigid things stay low or move to the calm (below the wave base, ~−20
  here). **A trunk that spikes upward for light is the wrong answer underwater**: buoyancy is free and drag is not, so
  the winning form is a float on a flexible stem. A trunk wins in *air* — which makes the 9 m tide band the one place a
  tree belongs (a tidal forest; parked with the land overhaul).
- **Attachment.** Rock takes holdfasts (not roots — a weed feeds through its whole surface). Sand takes runners or
  weight. A floating thing is either unrooted or in water shallow and calm enough for a stem — and there is no calm
  shallow water at 6–9 m of tide. **Rooted lily pads are out.**
- **Grazing.** Rasps, scuttles, grazer herds. The shallows answer with **mineral** (calcified segments and crusts, iron
  domes: not lunch), **spines**, or **speed** (turf and strap regrow faster than they are eaten). Soft slow things
  live where the grazers don't.
- **Nutrients.** Upwelling on the flanks, none from land. The reef top is clear and poor → symbiont forms dominate.
  The shelf edge, the drop and the arch are fed → weed forests and filter-feeder gardens.
- **Energy source** decides the body: sunlight → blade/float/turf; suspended food → cup/fan/crown; chemistry → mat,
  or tube-with-plume.

## Founders — what came, and what it became

PLANET's rule for the swimmers holds for the fixed life: a few lineages reached a young volcano and radiated into
every niche. This is what makes tethys's sessile life *not* Earth's. On Earth the cup, the fan and the stalk were
invented separately by a dozen phyla (which is why the grammar below is only eight shapes); here they were invented by
five lines, so every line's forms share a **signature** the player reads across niches — the way the creature clades
read by eye, tint and geometry. Four of the five are the fixed branches of clades PLANET already has; the clade
assignments are the person's ([Open](#open)).

| line | what it is | signature | its forms |
|---|---|---|---|
| **weed** | the photosynthetic founder (one line; two at most — is the raft a weed that let go?) | pigment by depth (`pigment(h)`), floats, blades, holdfasts on rock, runners on sand, mineral where grazed; bends | chain, turf, wisp, stipe, ladder, ribbon, bladder, grape, strap, crust, redblade, raft; scrub and tussock on land; the tidal forest later |
| **polyps** | the **drifters'** fixed stage: a jelly is a polyp that let go, a reef is a jelly that settled and cloned (Earth's proof: corals and jellies are one phylum; a siphonophore is a floating colony) | **colonial** — a cup on every twig; built skeletons (cream lime on the peak, rust on the basalt); fans across the flow; light only where it pays; the jelly's tints, translucent and pale, pigmented where lit | table, horn, dome, bommie, fan, whip, pen, tower, stalk, ltree, hair (the float colony went to the drifters, v11.16: `DRIFTERS.md`) |
| **crowns** | sessile **ringmouths**: a ring of arms round a mouth, on a stalk or in a tube | the arm ring, in the clade's chains-and-spheres language; **an eye ring on the crown rim** (Earth's proof that a fixed animal keeps eyes on its feeding crown: fan worms); copper tints, grey-green to teal; they **withdraw** — fold the crown into the stalk when a body nears (a hook) | lily, tulip, plume, seep, **stilt**, the occupant of a loop |
| **cones** | sessile **hingeshells**: a plated cone cemented to rock, combing the water with feathered legs (Earth's proof: barnacles are arthropods that sat down) | plates with the seams showing, boxes and cones; pale joints, the vanadium tint; the moult still happens inside the plates | **cone** (in the surf, the tide band, the arch), **nod** (stalked, in the current) |
| **sacs** | the simplest founder: a bag with an in-hole and an out-hole, a pump. Its own minor line, not a clade | lathes; one body, no colony, no arms; ivory, dun, grey; the deep's version gave up the holes and absorbs | tube, vase, barrel, glass, burr, **star**, frond |
| mats | bacteria, not a lineage | a colour and a fuzz; rust in oxic water on basalt, white and yellow where there is sulfide, grey below the chemocline | beard, iron, mat, the plate |

In code the line is a parameter of `grow()`: the bauplan says the shape, the line says the detailing — polyp cups on
every tip, chain-arms and an eye ring on a crown, plate seams on a cone, a smooth lathe on a sac. That is the
mechanism by which forty species look like one planet's work instead of a catalogue.

## What tethys spits out

What Earth's early seas produced, re-derived under this planet's conditions. The conditions are PLANET's; the
consequences are the roster's.

- **Eye-ringed crowns that fold.** Ringmouths carry an eye ring; a ringmouth that sat down keeps it, on the crown.
  A field of lilies on the terraces watches the player pass and closes, stalk by stalk, as it comes near.
- **Two reefs.** The planet's mineral is iron. Polyps on the clear peak build in lime (cream, vivid); polyps and mats
  on the basalt flanks build in rust (`iron` domes, rust-skeleton horn and dome variants in the rockfall and on the
  massif). The reef's colour tells you what the rock under it is.
- **The propped shell.** A straightshell (the ortho's line) that sat down: a cone shell cannot filter lying in the
  silt, so it props on two struts and puts its arms out — `stilt`. Earth spat out something with the same struts
  once (hyoliths) and dropped it; here the shelled ringmouths are a going concern and their fixed cousin has a reason.
- **The tide clock.** Tides three times Earth's: the crowns and cones of the reef edge and the arch open on the flood
  and shut on the ebb, twice a thirty-hour day — a whole edge that breathes (a hook; needs the tide).
- **Cones in the jet.** The arch's tidal current is the richest feeding water on the planet; its legs are plated with
  cones and hung with nodding stalked ones. Hingeshells own the surf twice: the scuttle walks over its own sessile
  cousins on the strand.
- **The colony.** The largest polyp form is the floating one: the seamount's eddies keep drifters home, and a float
  colony that farms weed in its skin and fishes with lines needs no floor at all — over the void it is the only thing
  alive at the surface. (Asked.)
- **The rim line.** The chemocline is a depth, so the straddling tubes (`seep`) draw a line round the whole world at
  −450: plumes in the oxygen, roots in the sulfide. Nothing like it exists where the boundary is a sediment.
- **Fixed things that leave.** 28% oxygen buys movement: a crown can afford to let go and swim when a crusher comes
  (Earth's proof: feather stars). Later, a creature crossover; for now, the reason lilies are only ever *nearly* eaten.
- **The frond.** In the deep, suspended food is thin and dissolved food is everywhere; a sac that gave up its holes
  and flattened into a quilt has the most surface for the least body — `frond`, the deep's cheapest animal.
- **What Earth did that tethys doesn't:** no seagrass (no land flora to return — the flats' pasture is a weed with
  runners); no lime on the flanks; no green below −20; no rooted floating leaf; no lace colonies (a lattice is tris).

## The descent — distinct by depth

Each band has a texture of its own, and it follows from the band's conditions, not from a look:

| band | depth | what lives | what makes it so |
|---|---|---|---|
| **surface** | 0 | unrooted rafts; the colonies | light and plankton are here; no shore to strand on; the eddies keep drifters |
| **the tide band** | +3..−9 | crusts, cones, pools; later a tidal forest | 6–9 m of tide: everything here is dry twice a day |
| **reef top** (shallows) | −10..−20 | polyps in lime, vivid; calcified weed; sacs; turf | clear poor water and surf: symbionts, mineral, low and rigid, sunscreen colours |
| **shelf** (kelp, bladders, flats) | −20..−60 | the swaying weed forest, three body plans; runner-grass; sacs and crowns below | fed by the flanks, under the wave base: floats and blades, olive to gold |
| **upper slope** (drop, spires, terraces) | −60..−150 | crusts and the last red blades; the rigid garden begins — fans, lilies, towers, barrels | red dim light; current on the edge; calm enough to stand |
| **deep floor** (lanterns, plain) | −150..−450 | animals only: polyps that glow to fish, fronds, glass sacs on stalks, whips | no light, cold; food drifts or falls |
| **the rim** | ±20 of −450 | the straddlers; the milky plate | the chemocline is a depth |
| **the dark** | < −450 | mats. Nothing else sessile, on purpose | no oxygen |
| **the vents** | any, hot | crowns in tubes, hair on the chimneys, sulfur mats | sulfide and heat |

Vivid and rigid / olive and swaying / red and thinning / pale and rigid and slow / black and flat: the biomes stop
being palettes and start being places.

## The grammar — eight bauplans

Convergence is the argument: light, flow and attachment are the same problem for every fixed thing, so the shapes are
few. **The grammar is the physics; a species is a bauplan with numbers, in its line's detailing.** `grow(spec, seed)`
in flora.js returns a geometry (plus colliders, glow parts and a sway class) from:

| bauplan | knobs | Earth forms that prove it | ours |
|---|---|---|---|
| `axis` | segments, length, taper, wander, lean, terminal organ (float, bulb, crown, cup), struts | sea whip, sea pen, bull kelp stipe, Hyalonema stalk | whip, pen, bladder, stalk, lily, glass, stipe, stilt, nod |
| `branch` | levels, children, angle, ratio, planarity 0–1 (bush → fan), spread, tip organ | staghorn, gorgonian, Vauxia, dendritic sponges | horn, fan, ltree, hair |
| `blades` | count, spacing, width, length, taper, droop, spin (spiral / two-ranked / whorl), ruffle, quilt | kelp fronds, Charnia, red algae | stipe, ladder, ribbon, strap, redblade, frond |
| `tuft` | count, length, spread, curl (tall and loose is the *wisp*), legs (feathered, for cones) | turf, Marpolia clumps, Gallionella stalks, Beggiatoa, barnacle cirri | turf, wisp, beard, mat, the cones' combs |
| `cup` | lathe profile: height, mouth, waist, wall, lip; ribs; bend (a tube on a curved axis: the elbowed tubes in the diorama); double wall; stack (nested cups climbing); cluster count | tube/vase/barrel sponges, Riftia tubes, archaeocyaths, Cloudina | tube, vase, barrel, loop, tulip, plume, seep, glass crown, cone |
| `disc` | radius, thickness, tiers, stalk, spines | table coral, rhodolith, Sargassum pads, Choia | table, sandball, star, raft pads |
| `mound` | radius, squash, facets, banding, spines | massive coral, iron stromatolite, crusts, chancelloriids | dome, iron, crust, burr |
| `float` | pad discs, bladders, hangers (kind, count, length) | Sargassum, siphonophore floats | raft, colony |

Everything stays in the kit's language — `part`/`merge`, boxes, low-poly lathes and spheres, flat shading, vertex
colours — at the existing tri budgets (turf ≤ 12 tris, blade plants ≤ 60, branchers ≤ 200, cups ≤ 120, big rigid
structures ≤ 800). The rock kits (crags, slabs, tors, ledges, bigrock, the arches) are geology and are not touched.

### Variation without draw calls
A runtime SpeedTree — a fresh mesh per plant — is wrong for this engine: instancing is why a kelp cell is 110k tris at
120 fps. Instead each species bakes **three variants** at load (`grow` with seed, seed+1, seed+2), packed into **one
geometry** with a per-vertex `var` attribute; each instance gets `aVar` at placement (like the rafts' `aDip`) and the
vertex shader collapses the other two variants to the origin (degenerate triangles: no fill, one draw call, vertex
work ×3, which desktop GPUs do not notice — but the readout's *tris* figure will inflate for flora; the ms is the
number to watch). Colliders are per variant (`f.vars[v].col`). On top of that the existing per-instance yaw, tilt,
scale, `sx/sz` and tint ±25%, and the placement rules below: thousands of combinations per species, which is what
"unique-looking" means in a low-poly game. Fallback if the shader route bites: variants as separate instanced meshes
with species per biome capped at eight — measured, not assumed.

### Placement rules that make the world legible
- **`pigment(h)`** — a weed (`photo:true`) takes its tint from the ground depth at placement, not from a per-species
  list: green ≤ −15, olive to −40, gold-brown to −60, red-purple to −150, vivid only above −20. One function; every
  weed on a slope shades along it; the green-gradient conflicts in PLANET (grass on the terraces, green kelp)
  disappear by construction. Animal entries keep their line's tints (PLANET's shell-colour rule: cream on the reef,
  rust near basalt, black at the vents and below the chemocline).
- **`flow(x,z)`** — tidal current runs along contours and through the arch; a `flow:true` entry (fans, lilies, plumes,
  pens, cones' combs) turns its plane across the current at placement (yaw from the terrain gradient; a world-scale
  noise angle on flat ground so a field agrees with itself). A slope where every fan faces the same way reads as
  *current* without a word.
- **`band:[lo,hi]`** — a depth gate on the ground, so a species can be a straddler at the rim or a thing of the top
  step only.
- **Three strata** — what both reference images have and the density table only has by accident: a **ground** layer
  (turf, strap, mats, wisps: thousands a cell), a **middle** (0.5–2 m cups, burrs, loops, lilies, chains: hundreds) and
  **emergents** (tubes, towers, stipes, fans: tens). Every biome gets all three, or it reads as a lawn with props.
- **`eco`: the variant is the exposure ecotype** (v11.67, SEAFLOOR §2). An `eco` species draws its variant from the wave exposure at the
  instance (grow.js `ecoK`: `expo` under `ECO_LO` 0.22 sheltered, over `ECO_HI` 0.5 exposed, the thresholds jittered ±`ECO_MIX`/2 so a coast
  is no hard line) and its builder reads k as the kelps do — exposed short, thick, narrow-bladed, splayed and heavy at the holdfast;
  sheltered long, broad, thin, all blade. `expo` carries the wave base (it fades out by −30), so below it every forest is sheltered and the
  coasts differ in their top 25 m, which is where the giant's coasts and ours differ in their fields. turf, wisp, chain, stipe, ladder,
  ribbon, bladder and paddle read it; a form with no reason to (a mat, a sac, a rind) keeps the random pick. One geometry still: no cost.
- **The stain of the place** (v11.67, grow.js `tintBy`, `TINT_CHEM`): PLANET's shell-colour rule read by the sessile life — a colour laid
  over the instance's tint by the fields at its base. Fresh basalt (`young`) rusts and darkens the animal forms (cover 0.55 at the field's
  full) and dulls the weeds with its iron (0.45); the vents' heat whitens and yellows toward the sulfur mats (0.7; the plume's iron-red
  crown, the chimney and the limpet opt out, `chem:false`); the surf's shallow rock in clear poor water, where the lime rind lays its lime,
  creams the shells (0.4; never a blade). Where the fields are ordinary the stain is null and the look is the one before.
- **The progression rule** (v11.67, SEAFLOOR §2): the forest and the canopy — stipe, ladder, ribbon, bladder, and the tidewood — carry
  `young ≤ 0.45`. A flow decades old has crusts, turfs and rust, not a forest: kelp settles new lava within years, but a tall canopy takes
  longer than the rift arms, the fan's fresh blocks (`young` 0.5–1) and the giant's rift flows (0.7) have had. The turfs, the rinds and the
  rust forms keep their range, so a fresh flow reads bare, dark and encrusted between two forests, on either island.
- **Epibionts** (later): small things on big things — beards on tubes, crusts on towers, cones on a stipe's holdfast, a
  loop twined round a stalk — placed from the emergent instance's matrix. Both images are full of it; it is the
  cheapest "lived-in" there is.

## The roster (proposed)

`size` is metres, the tallest variant. "exists" means the current geometry is kept and re-read; "rebuild" means it
goes through `grow`; bold is new. The line is in the founders table; every entry has its reason in the last column —
the trait that wins its spot. Earth appears there only as the proof.

### Surface
| species | bauplan | where | size | what it is | why it wins |
|---|---|---|---|---|---|
| raft (exists) | float | outer world, pockets; canopy | 2–5 | bladderweed: unrooted olive-green pads, bladders, hanging fronds **shortened to ≤ 12** | an unrooted weed is real (Sargassum); fronds hang in the light, so they hang ten metres, not two hundred; the seamount's eddies retain drifters |
| **colony** (raft2, raft3 re-read) | float | the canopy | 20–150 wide | **a polyp colony** under a gas float — a mat of polyps farming weed in their skin, and the tendrils are **fishing lines** hung 60–190 deep | a float colony that fishes is real (the man o' war hangs 30 m of line; the largest siphonophores reach 50 m). Gives the tendrils a reason, the canopy a hazard (the lines sting — later) and answers "canopy fauna". **Ask** |

### Reef top — the shallows (biome 0), −10..−20, vivid
| species | bauplan | where | size | what it is | why it wins |
|---|---|---|---|---|---|
| **table** | disc | 0 | 1–4 wide | a stalk and one to three tiered flat plates, polyp-studded | a plate shades every rival under it and sheds sand |
| **horn** | branch | 0, reef edge; rust variant in 3, 14 | 1–2.5 | fast brittle antlers; broken pieces around it (a rubble variant) | grows fastest, breaks in storms, and every fragment is a new colony |
| **dome** (bulb re-read) | mound | 0; rust variant 3, 14 | 1–5 | massive faceted mound with growth banding — living rock | storm-proof and centuries old; the "big polygonal rocks", but alive and banded |
| **bommie** (tower rebuilt) | axis + tuft | 0, in the passes | 3–6 | the spiny tower, **shortened**, vivid, in current pockets | a polyp pinnacle fed by the pass; 14 m of rigid spine in 10 m of surf breaks (its tall cousin moves to the terraces) |
| **chain** | axis + disc | 0, 3 (skerries), 2 (inner edge) | 0.3–0.8 | rigid chains of green calcified discs | grazer-proof mineral; its dead segments are the white sand |
| tube (exists) | cup | 0, 14 | 1–2.5 | tube sacs in clusters; **ribs**, an **elbow**, a **double wall** and a **stack** as variants | keep; the emergent layer of the diorama, four ways |
| **loop** | cup on a bent axis | 0, 1, 3 | 0.5–2 | a knobbly tube that rises off the floor and curves; a crown lives in it; green with epiphytes in the light | a bent mouth faces across the flow whichever way it grew, and clears the silt |
| **burr** | mound with spines | 0, 1, 7 | 0.3–1 | a sac in a coat of star spines, a filter bag | spines are what grazers taught it; the honest spiny thing at a metre |
| **star** | disc with spines | 0, 2, 7 | 0.3–0.8 | a flat sac on the floor, spines radiating from the rim | a sac that lay down: no stalk to snap, and the spines keep the rasps off |
| **cup** (bulb replaced) | cup | 0, 7, 1 | 0.5–2 | vase sacs, single and paired | the sphere clusters were nothing; a vase is a filter |
| **cone** | cup (plated) + tuft (legs) | 0 surf, 13 tide band, 14 the legs, 3 skerries | 0.05–0.4 | a plated cone cemented to rock, feathered legs combing from the top; in crowds | a hingeshell that sat down where the water moves most: armour against the surf and the rasp, the plates its moult never leaves |
| fan (exists) | branch | 0 edge, 5, 14, 7 | 1–8 | polyp fan, **flow-faced** | keep; it belongs where the current is, not sprinkled |
| **turf** (grass on 0 replaced) | tuft | 0, 3 cracks | 0.1–0.3 | a dense short lawn | the grazers' pasture: outgrows its grazing |

### The shelf forest — kelp towers (1), bladder forest (4), −20..−60, olive to gold
| species | bauplan | where | size | what it is | why it wins |
|---|---|---|---|---|---|
| **stipe** (kelp rebuilt) | axis + blades | 1 | to the surface | holdfast; a stipe with a float at every node; spiral blades; **stops at the surface and lays its top blades flat** — a canopy to swim under, never a stalk in the air | floats lift it, the surface stops it (Macrocystis is the proof); three body plans in one forest instead of one Earth kelp repeated |
| **ladder** | axis + blades | 1 | 6–14 | flat, two-ranked blades in one plane; a wall from the side, nothing edge-on | a plane sheds drag by bending in one direction; the eel's and hook's cover |
| **ribbon** | axis + blades | 1, 4 | 10–20 | one wide undulating blade on a stub, a float at its tip; leaves the stub at ~60° and curves up to vertical under the float (v9.5's lay along the floor: `bladeAt` starts level) | the cheapest blade there is |
| bladder (exists) | axis | 4 | to the surface | the float column; **browner** | keep |
| **grape** | axis + tuft | 1, 4, 2 | 0.2–0.5 | a runner with a bunch of small spheres lying at every node (v9.5 stood them on sticks: a row of tiny trees; v9.6 lays them down) | a weed can be one giant cell and still do this (Caulerpa); the understory, and cheap |
| **tulip** | axis + cup (closed) | 1, 4, 7 | 0.5–1.5 | a crown in a bulb with a slit mouth, on a stalk, in clumps | the shallow cousin of `glass`; a stalk lifts the mouth out of the silt |
| **wisp** | tuft (tall) | 1, 2, 3, 0 | 0.5–1 | loose feathery olive clumps | the middle stratum's cheapest member |
| turf | tuft | 1, 4 (v9.6) | 0.1–0.3 | the reef's lawn, olive here by `pigment` | the forests' ground layer: short enough never to read as sticks |

### The flats (2), sand, −20..−60
| species | bauplan | where | size | what it is | why it wins |
|---|---|---|---|---|---|
| **strap** (grass on 2 replaced) | blades | 2 only (v9.6: it stood alone in the forests and read as three dark lines from a point; turf is the forests' ground layer now) | 0.5–1.5 | six wide short blades leaning both ways from a runner along the sand, olive, a lawn at 2400 a cell | **a weed with stolons, not a returned land plant** (there is no land flora to return from); grows as fast as the herds eat it, which is why there are herds |
| **paddle** (built v11.67) | blades (boxes) | surf over sand: `turb` ≥ 0.3 in the light, `sub` sand to mixed, −26..−3 — a scrap of our windward shallows, the giant's whole windward shelf (760 ha to our 5) | 0.4–0.7 | a runner with three or four broad, short, thick blades leaning downstream; 600 a cell; reads the waves (`eco`) | the runner line's answer to stirred water: a rind-thick cuticle that sheds sand and takes the scour where the strap's thin blades are shaded and torn and the floaters' ropes snap; costs light per gram, so it holds only where the water is dirty (SEAFLOOR §2's turbidity form: there are no rivers, so the surf over sand is where `turb` is high in the light) |
| grape, star | | 2 | | as above | |
| **sandball** | disc/mound | 2 | 0.1–0.3 | pink calcified balls the tide rolls, alive on every side | rolling mineral weed is real (rhodoliths) and odd. Low priority |
| pen (whip re-read) | axis + blades | 2, 10 | 1–4 | a polyp pen: a stalk in the sand with a feathered blade; the whip is its stiff cousin | keep the whip, add the feather |

### The rockfall (3), fresh basalt −100..−4, current
| species | bauplan | where | size | what it is | why it wins |
|---|---|---|---|---|---|
| **beard** | tuft | 3, 14, 6 feet | ≤ 0.5 | tufts of twisted rust-orange stalks on fresh rock: iron-oxidising mats | **this is what "boring into rock" amounts to**: Fe²⁺ from the basalt meets O₂ and the mat eats the difference (Earth does it on a basalt seamount too: Loihi). It pays too little to build anything above a fuzz; it is PLANET's rust rule made flesh |
| **iron** | mound | 3, 14 | 0.5–2 wide | low rust-banded domes: a stromatolite the mat has laid down over centuries | the one "structure" chemistry builds in oxic water, and it is a rock made by life |
| **stilt** | cup (shell) + axis (struts) + crown | 3, 0, 14, 6 | 0.3–1 | a cone shell propped on two struts, arms out over the lip, an eye ring on the crown | the fixed straightshell: a cone can't filter in the silt, so it props (see above) |
| horn, dome (rust variants), turf, chain, cup, fan, whip, cone | | 3 | | as above, by depth (the skerries are green; −60 is red) | |

### The upper slope — the drop (5), the spires (6), the terraces (7), −60..−150
| species | bauplan | where | size | what it is | why it wins |
|---|---|---|---|---|---|
| **crust** | mound (flat) | 5, 6, 7 top steps, ledges | 0.3–1 wide | red-purple paint: flat discs a hand thick stuck to rock | the deepest photosynthesis is red and encrusting; grazer-proof mineral |
| **redblade** | blades | 7 top step, 5 top, 3 deep | 0.3–1 | single dark-red translucent blades, sparse | the last blades, catching what blue is left (Earth's deepest weed: 268 m) |
| **darkrind** (built v11.67) | mound (flat) | the sill's drowned summits: −172..−142 on bare rock (`sub` ≥ 0.6) in the basin's sparse water (`nut` ≤ 0.2), off fresh rock — 85 ha on the ridge, none on any island flank | 0.8–1.5 wide | one or two wide plates a finger thick, dark, a paler growing edge; 220 a cell, in patches | the reds' crust at the light's floor: the floor of the light is the water's, and the sill's summits reach exactly −150 under the clearest water in the world, so a rind that pays there pays twenty metres deeper than under the islands' fed water (TAXA, the deep rind; SEAFLOOR §3's relict among the weeds). Nothing draws it but the sill |
| **lily** | axis + branch crown | 7, 5 ledges, 6, 14 slabs, 10 sparse | 0.5–2 | a crown on a jointed stalk, arms opened across the flow, an eye ring on the crown, in fields | a crown in a current is a net that costs nothing to hold; and it watches |
| **tower** (moved) | axis + tuft | 7, 5 feet | 8–15 | the tall spiny polyp tower, **dull** (ivory, grey, dun), rigid, in the calm | stands where nothing pushes it; colour without light is waste |
| **vase** (sponge rebuilt v9.6), **barrel** | cup | 7, 6, 4, 10, 14 | 1.5–4.5 | the tall vase: a lathe with a waist, a flared lip and a dark hollow (tall / paired with a fused bud / a squat urn), in field-clustered gardens at 70 a cell — the kept sponge was a cylinder with a black lid at 230 a cell, "vases stapled to the floor"; and the giant barrel a century old | the barrel is the terraces' furniture; the vase its middle stratum |
| **shelf** | disc (half) | cliff faces (placeCliffs) | 0.5–1.5 | bracket sacs out of a wall | the drop's faces are bare. Low priority |
| fan, whip, burr, star | | 5, 6, 7, 14 | | flow-faced | |
| ~~grass on 7~~ | | | | **cut**: green at −60..−250 | the terraces' top steps get crusts and redblade; the grazer herds there graze crusts (a roster note, not a flora one) |

### The deep floor — lantern fields (9), the plain (10), −150..−450
| species | bauplan | where | size | what it is | why it wins |
|---|---|---|---|---|---|
| stalk, ltree (exist) | axis, branch | 9, 10 | 4–9 | **lure-feeders**: polyps whose symbionts' blue-green light draws the plankton they eat | zooplankton swim to light; glowing for nothing is what PLANET forbids, glowing for dinner is not |
| **frond** | blades (quilted) | 10, 9, 7 deep | 1–3 | a quilted frond on a holdfast: no mouth, no light; it absorbs what dissolves | see above: the deep's cheapest animal |
| **glass** | axis + cup | 10 | 1–3 | a cup sac on a long glass stalk rooted in mud by a tuft | at 3 °C things grow for millennia and stand on stalks to clear the silt |
| lily | | 10 | | sparse, on hard ground | |
| **nodule** | (boulder tint) | 10 | | the plain's boulders manganese-black | PLANET's shell rule, applied to the rock. A tint, not a species |
| **mat** | tuft (flat) | 10, 9, 8, 11 | patches | white, yellow, grey fuzz on the floor; terrain tint plus a sparse short tuft | sulfur mats where there is seepage |

### The vents (8), hot
| species | bauplan | where | size | what it is | why it wins |
|---|---|---|---|---|---|
| **plume** (stalk re-read / rebuilt) | cup cluster + crown | 8 | 1–3 | bunches of white tubes with red crowns crowding every warm crack | the crown is red because blood that carries sulfide and oxygen both is iron blood — rust where iron meets oxygen, again; the tubes grow a metre a year (Riftia does) |
| **hair** | branch (studs) | 8, on chimneys | — | tube colonies furring the chimney flanks | something lives on the wall itself at 80 °C on Earth; here too |
| mat | | 8 | | white and sulfur-yellow around the field | |
| chimney, limpet (exist) | | 8 | | geology and a grazer; keep | |

### The rim (ground within ±20 of −450) and the dark (11)
| species | bauplan | where | size | what it is | why it wins |
|---|---|---|---|---|---|
| **seep** | cup + axis + crown | the rim band | 2–5 | tubes rooted *below* the chemocline where the sulfide is, crowns *above* it where the oxygen is | a straddler; here the boundary is a depth, so the straddlers make a visible line round the whole rim. The one sessile multicellular thing that touches the dark |
| plate | (visual) | −450 | — | the milky bacterial layer — PLANET's hook, not flora | |
| mat | | 11 | patches | grey and black. **Nothing else** | the dark stays empty on purpose; shed carapaces later (the moulting hook) |

### The strand (13) and the tide band — parked
The land overhaul owns this. Note for then: the 6–9 m tide band is the one place a rigid trunk reaching for light is
the *winning* form (in air), so a tidal forest — derived from the bladderweed line, roots in the water at high tide,
the strand's scrub as its dwarf — is the plausible centrepiece, with cones and crusts and pools for a floor.

## Giants

Asked for: plausibly gigantic things, always. Gigantism among fixed life comes from four things, and each names a place:
**time** (no disturbance, cold, long life: the deep floor and the calm terraces), **oxygen** (28%: bigger bodies
everywhere), **flow** (the arch and the edge feed the biggest filter feeders), **clonality** (a colony is as big as its
substrate: reefs, mats, the float colonies). Giants are structures (`big:true`, drawn by the far layer, a few in the
world) or the largest variant of a species. Proposed, with the first built:

| giant | line | where | size | what it is | status |
|---|---|---|---|---|---|
| **the old dome** | polyps | shelf edge, rockfall, terraces | 14–26 wide | a banded mound grown over centuries; the reef's memory | **built v9.5** (`olddome`, ~4 in the world) |
| the cistern | sacs | terraces, the drop's feet | 6–10 | a barrel sac hollow enough to swim into | next |
| the great lily | crowns | terraces, the massif's slabs | 8–12 | a crown on a stalk the height of a house, in the current | next |
| the stack | sacs | the plain | 10–15 | glass sacs on stalks in a stand, millennia old | with the deep |
| the great colony | polyps | the canopy's core | 100–150 | exists as `colony2`; the largest living thing at the surface | built (re-read) |
| the tidal forest | weed | the tide band | 10–20 | trunks in air, roots in the water at high tide | with the land overhaul |

## What goes, and why
- **Rooted lily pads** — never proposed: 6–9 m tides, a floor at −800 under the rafts. The floating thing is unrooted.
- **A rigid trunk to the light underwater** — buoyancy is free, drag is not. Floats on stems. Trunks go to the tide band.
- **A boring fungus with a storage top** — the energy is too thin: it's a rust fuzz and, at most, a banded dome.
  Where chemistry is rich enough to build tall things they are animals with symbionts (tubes and crowns).
- **Kelp ten metres into the air** — stops at the surface, lays its blades flat.
- **Green below −20; vivid below −20; anything photosynthetic below −150** — `pigment(h)`.
- **The tower in the surf** — shortened to a bommie there; the tall one moves to the calm and goes dull.
- **bulb** (sphere clusters) → cup. **grass** → turf (reef) and strap (flats); off the terraces.
- **Raft hangers to −190 as fronds** — either short fronds (raft) or fishing lines on a colony. Ask.
- **Earth's eras as a frame** — gone. The bands are what the conditions make them.

Everything the person has praised survives by re-reading: the canopy (a colony), the towers (two species), the
lanterns (lure-feeders), the rockfall's rust (living), the pit and the dark (empty of sessile life, and now for a reason).

## Hooks (derived here, not built)
- **Withdrawal**: crowns fold into their stalks within a radius of a body (a per-instance attribute the vertex shader
  reads, like `aDip`); tulips shut; cones pull their combs in. The first sessile behaviour, and cheap.
- **The tide clock**: crowns and cones open on the flood, shut on the ebb — needs the tide (day/night is a PLANET hook).
- **Epibionts** and **rubble**: horn fragments and shed carapaces around their sources.
- **Crowns that leave**: a lily that swims off when a crusher comes — a creature, later.

## Build order (proposed)
1. **The grammar and the pipeline**: `grow()` with the eight bauplans and the line detailing; a `SPECIES` table that
   generates the `FLORA` entries (three variants packed per species, `aVar`); `pigment(h)`; `flow(x,z)`; `band`. Rock
   entries keep their order so nothing geological moves; per-cell flora rng streams change (creature spawn points
   shift, as in v9.3).
2. **The shelf and reef top** — the biomes the player starts in: stipe, ladder, ribbon, strap, grape, turf, wisp, table,
   horn, dome, bommie, chain, cup, loop, burr, star, cone, tulip; bladder browner; rafts shortened. Then the person looks.
3. **The slope and the rockfall**: crust, redblade, lily, stilt, the tall tower moved, barrel, fans flow-faced, beard
   and iron, the rust variants.
4. **The deep, the vents, the rim**: frond, glass, plume, hair, seep, nod at the arch, mats, nodule tint; colony if agreed.
5. The far impostors (kelp cards, bladder cards, raft octagons) re-pointed at the new entries.

## Decided (8 Sep 2026)

1. **The founder lines and their clades** — yes: polyps are the drifters' fixed stage, crowns are sessile ringmouths,
   cones are sessile hingeshells, sacs a minor founder, one weed line.
2. **The canopy** — the tendrils under the rafts were the question: as plant roots they had no job (a floating weed feeds
   through its surface and takes its light from above; a root into the dark collects nothing and feeds what passes) and
   were to go. They stay as **fishing lines on the colonies**: the huge rafts are an animal of the polyp line, the small
   rafts are weed with a short keel. Lines cut from ~190 to 10–100.
3. **The stipe** — stops at the surface and lays its blades flat.
4. **The tower** — both: the bommie in the passes, the tall dull one on the terraces.
5. **Variants** — one draw (the shader route), unless the readout says otherwise.
6. This lives in `FLORA.md`. Giants: always, where plausible ([Giants](#giants)).

## Open
- The whip is struck (9 Sep 2026, "way too earth like"); the lily stays. The tidal forest (v11) is in and liked; the land flora
  is due its own pass later, matching the sea's but distinct.
- Strikes on the roster as it appears in the game (v9.5 shows the reef top, the shelf, the flats, the rockfall's rust
  and the rafts; the slope, the deep, the vents and the rim keep their old flora until the next pass).
- Whether the lines under the colonies should sting (the canopy as a hazard).
- The high-current form SEAFLOOR §2's brief allowed (a fisher on the passes' floor, `flow` high, `shel` low) was not built (v11.67): the
  fan, the nod, the bommie, the tube and the stilt already own that rock (`flow` ≥ 0.3–0.6 on `sub` ≥ 0.5), and a sixth fisher on the same
  ground would be a draw call for a look the others give. The turbidity form and the sill's red were built (paddle, darkrind).
