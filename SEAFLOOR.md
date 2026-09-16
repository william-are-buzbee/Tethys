# SEAFLOOR.md — the chain's diversity and its underwater ground (15 Sep 2026)

Status: **designed, not built.** A discussion of 15 Sep 2026 recorded as it stood: what an archipelago this size can honestly differ in from
island to island (§1–3), the underwater formations a hotspot chain with a 6–9 m tide, iron and a chemocline at −450 would produce (§4), and what the physics puts on the surface (§5).
The person agreed to all of §4 ("all of that", 15 Sep 2026); the one code-shaped question (§6, the range term) is theirs and open. Above
water is another doc for another day. Read PLANET.md first, then ARCHIPELAGO.md (the chain's numbers: ours 1–2 Myr old and sinking, the giant
18 km south-west and younger, the young shield 36 km and active, the sill the drowned oldest end). The rule stands: nothing here has a name
or a biome; every item is a mechanism the geology already has, and every species still places itself by envelope over the fields.

## 1. How much diversity, honestly

- **Archipelago-level marine endemism is high** on an isolated hotspot chain (Hawaii: about a quarter of its reef fish nowhere else). Ours has
  no continent at all, so the whole roster being endemic is the premise, not a feature.
- **Island-to-island marine differences are low** for anything that broadcasts larvae or swims. 18 km over a −1000 saddle is days for a
  drifting larva; a million years does not split a cruiser or a jetter across it. One species of every big animal across the chain.
- **Island-to-island differences are real for brooders and direct developers** — snails, brooding crustaceans, sessile life with short-lived
  larvae. On Earth these split by island and sometimes by bay inside a million years (marine iguanas differ per Galápagos island). That is
  the crab.
- **Land is the extreme case** (one founder to thirty species across islands: the silverswords), and it is not this doc.
- **What a swimmer actually notices is habitat, not the species list.** The giant has rivers, a shelf, reef, a cloud top and a dry lee; the
  young shield has black flows, no shelf and fresh sulfidic rock; ours has the drowning terraces, the lagoon, the pit and the chimney; the
  sill has deep relict ground. "This shore is all black rock and encrusters" reads long before a different crab does.

## 2. Flora

Real kelp systems have one canopy dominant per region, chosen by temperature, exposure and depth, with understory species under it: "one
victor" is true locally and false across conditions, which is the envelope rule already. Visually identical coexisting species are common in
algae and cryptic by definition — useless to a viewer. What is both real and visible:

- **Ecotypes by exposure.** The same lineage grows short, thick and narrow-bladed on a surf coast and long, broad and thin in shelter
  (Macrocystis, Ecklonia, Saccharina all do it). Derived from `expo`, it appears on every island for free and differently on each because
  their coasts differ. The `species()` variants (grow.js) are the place.
- **The progression rule.** Each island is colonised from the older one, upwind or upcurrent. The young shield gets a subset: encrusters,
  turfs, the drifters' spawn, no forest yet. Bare and dark for a reason.
- **Habitat-only species.** A turbidity-tolerant brown-red weed at the giant's river mouths (`turb`); a low-light deep form on the sill (depth).
- **Colour by rock age.** Shell colour and pigment read iron chemistry by depth (PLANET). Reading `young` too — fresh basalt, sulfide — tints the
  young shield's life without an island id.

## 3. Fauna

- **Behavioural ecotypes, not species.** Orcas hunt differently per region on the same genetics. The same hunter working the giant's reef edge
  and our lagoon is one spec, two behaviours driven by the fields.
- **Per-island small brooders.** The hingeshell crabs, strand walkers, small ringmouth grazers: each a spec edit of the same kit (shell heavier
  where `expo` is high, darker where `young` is high). Non-arbitrary by construction: same founder, same body plan, the island's conditions
  choosing the edit.
- **Habitat-owned species.** Something that climbs the giant's rivers (amphidromous, like Hawaii's gobies); something on the seamount's vents;
  the lagoon's own thing here.
- **The sill relict.** A deep, pale, larger version of a shallow form, stranded as its island sank — a million years at a millimetre a year is
  the right order for the guyot's depth.

## 4. The underwater ground (agreed 15 Sep 2026)

Every item has a mechanism and a job for the life. Struck things (arches, the massif — PLANET, 8 Sep 2026) stay struck.

### On the shield flanks (every island)

- **Lava tubes and skylights.** Subaerial flows drain and leave tubes a few metres across; a sinking island drowns them, with collapse holes
  along the roofs. Dens for ambushers and moulting hingeshells, and the one dark place in shallow water. Ours has drowned 1–2 Myr of flows,
  so it has the most.
- **Pillow slopes.** Flows that met the sea quench as stacked pillows at 10–20°: crevices for everything small. The young shield is nothing else.
- **Dike walls.** Rift-zone dikes are harder than the flows round them; erosion leaves them as fins and low walls running downslope, sometimes
  for kilometres. They channel the flow along them and give a cliff face in flat ground. The rifts' kit already carries the direction.
- **Talus aprons under scarps.** The collapse scarp sheds boulders as it retreats; a boulder field sits at its foot, grading finer outward —
  the richest hard ground on any coast.

### Sinking and tide (ours and the sill)

- **Drowned terraces with notches.** Each still-stand cuts a wave notch and a bench; a sinking island stacks them. The bench is flat sand and
  weed; the notch is an overhang the length of the terrace. The steps are built (world.js terraces); the notch and its overhang are not.
- **Tidal scour channels and ebb deltas.** With 6–9 m of tide the water leaving the lagoon cuts channels through the passes and the flats and
  dumps ebb deltas outside them. The channel is the current's road, bare and fast; the delta is where the filter feeders sit.
- **Blue holes.** Terrace limestone or old reef dissolved during a low stand leaves vertical shafts: still, stratified, often anoxic at the
  bottom — the chemocline in miniature at −40.
- **The guyot.** The sill's top is a flat wave-planed summit now hundreds of metres down: a plateau with a lip and relict shallow-water ground
  below the light. Where the sill relicts (§3) live.

### Volcanic and hydrothermal

- **Pit craters along the rift**, not only the one. A collapse pit is a cylinder with a flat floor and vertical walls: a sheltered bowl with its
  own water.
- **Diffuse warm-vent fields** away from the chimney: low-temperature seeps through fresh rock, marked by rust mats and shimmer, no chimneys.
  Cheap, and they dot the young shield.
- **Iron and manganese crusts** on old rock below the chemocline, and ochre iron domes where reduced water meets oxygen at the chemocline's edge.
  The colour reads the chemistry.
- **A submarine landslide lobe.** Big shields fail; the giant's old side gets a debris avalanche running out onto the basin floor as a field of
  blocks, some hundreds of metres across, in the anoxic dark — the largest structures in the world and the only relief on the plain.
- **Pillow mounds and fresh glass on the seamount's summit**, with vents, when the world reaches it.

### Sediment and current

- **The sediment apron and turbidite channels.** Rivers on the giant and slides on every island send sediment down canyons cut into the flank.
  A canyon is a gully in the shelf edge that funnels the current and the falling food; on Earth canyons concentrate life out of proportion.
- **Sand waves in the saddle.** Where the tidal stream crosses the saddle between us and the giant it builds dune fields, ridges tens of metres
  apart. The crossing gets a floor that says which way the water runs.
- **Upwelling faces.** Where the current strikes a flank (the north-east, the gap in the sill) cold nutrient water rises. Not a shape — the
  field exists (`nut`) — but it decides where the filter feeders and the schools are densest.

### Ranked, by ecology per unit of work

1. Lava tubes. 2. The terrace notch. 3. Tidal channels with ebb deltas. 4. One canyon per island. 5. The slide blocks on the plain.
Each is a habitat none of the others provide and each falls out of a field or an island record that exists. Blue holes and the extra pits are
the cheapest surprises for a swimmer. (Agreed in full by the person, 15 Sep 2026.)

## 5. The surface (15 Sep 2026, to come back to)

The surface has the button and the sailer (DRIFTERS.md); the raft was struck for its look, not its logic. Nothing here is painted on: each
is a thing the physics puts on the water. The person: "there are so many good ones there we should come back to eventually."

Volcanic (the young shield is active, so these are certain):

- **Pumice rafts.** An eruption at or near the surface floats pumice for months; rafts run kilometres long, drift with the wind, break into
  streaks, strand on windward shores as a line at the high-tide mark and sink as they waterlog (Tonga 2019 crossed the south-west Pacific).
  They carry settlers (encrusters, small brooders): how sessile life crosses between islands. The biggest honest thing missing.
- **Discoloured water.** Over a vent or a fresh flow the water goes milky yellow-brown with iron and sulfur, a plume the current draws out.
- **Gas at the surface.** Shallow seeps bubble; a lava entry steams. Both at the young shield's shore.

Weather and current:

- **Wind rows.** Wind over water sets up counter-rotating cells (Langmuir) that gather foam, weed scraps and drifters into lines parallel to
  the wind, tens of metres apart — why the fleets are lines, not clouds. A surface term aligned to `WIND_A`.
- **Slicks.** Blooms and internal waves flatten the ripple in glassy bands among the chop. Nearly free in the surface shader.
- **Fronts.** The lagoon's ebb meeting the sea, the giant's river water meeting salt: a sharp line of colour and foam with debris along it;
  below, a haze layer at the halocline.
- **Blooms.** After an upwelling the water goes green or rust with plankton for days: patchy surface colour by `nut` and a clock. At night
  the wake lights up — bioluminescence as an event, which PLANET allows.
- **Wrack.** Storms tear blades and bladders off; they float tattered for days, then sink. The raft's honest replacement: a thing after
  weather, not a fixed species.

The life:

- **The neuston set completed.** On Earth the button and the sailer travel with two predators: a snail on a raft of mucus bubbles that eats
  sailers (Janthina) and a slug under the film that eats man o' war and stores their stings (Glaucus). Same clade set, same prey: a
  bubble-raft ringmouth grazer that hunts sailers is non-arbitrary by construction.
- **Floating carcasses.** A dead big animal bloats with gas, floats for days with scavengers under it and hunters round it, then sinks. The
  most dramatic surface event available; the model already has carcasses.
- **Basking.** Slowbloods are ectotherms: a flat one lying at the surface in the sun to warm (sunfish, turtles, marine iguanas). A behaviour.
- **Floating egg masses** of ringmouths and drifters after a spawning; clutches exist.
- **Drift logs.** Once tidewood and scrub exist, storms put trunks in the water: a log with encrusters and a crab is the other way land life
  crosses.
- **Dead sailers on the strand** (DRIFTERS.md, open).

Ranked: pumice rafts, wind rows and slicks, the carcass, the bubble-raft hunter, the bloom. **The person's:** the largest thing on any
ocean's surface is what feeds from the air (birds over a bait ball mark the fish from kilometres off); PLANET leaves the glider hook and
"a launcher?" open. Whether anything flies is a clade decision, not a surface one.

## 6. Open: the range term

Tolerance envelopes cannot express an endemic. A brooder's range is history, not conditions: where it evolved and how far it has crawled since.
That wants a range term on a species — a circle round the island it belongs to, or a dispersal radius from a founding cell — the first thing
in the roster the geology alone cannot give. Still derived, not magic: dispersal mode decides who gets one (brooders and direct developers
only; nothing with larvae or a tail). It is the one item here that changes the code's shape (`SPAWN` envelopes, `ecoCap`), and it is the
person's call. Everything else in this doc is envelopes, `species()` variants and spec edits the game already has.

Where each item lands when built: the formations in world.js (`islandH` terms, the records) and far.js/flora.js (structures with collision
lumps, `settleOn`); the ecotypes in grow.js and creatures_spec.js; the progression rule and the range term in creatures_defs.js `SPAWN` and
ecology.js.
