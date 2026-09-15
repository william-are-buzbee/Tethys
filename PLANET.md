# PLANET — the world tethys is set on, and the rules its life obeys

The most upstream document. **When something in the game conflicts with what is here, the game changes, not this**
(the person's rule, Sep 2026). `DESIGN.md` describes the systems; this describes the planet and the ecology the
systems must serve; `creatures_defs.js` and `flora.js` are downstream of both. Plausibility here is a filter, not a
generator: nobody derives a biosphere from a star and a gravity value, but every trait needs a reason that survives
"why hasn't something better outcompeted it", and an aesthetic choice (green plants, Cambrian insectoids) gets the
cheapest *true* reason, never an invented one. The reference game humanises its aliens for drama — creatures that
roar, glow for nothing, single the player out; none of that is wanted. Eyes that show intent are human-readable *and*
real, so they stay.

Provenance: the person chose 1 g (and the game's gravity follows it), the chemocline (with a slow drain on the player),
the green gradient, the clade names, three playable clades for now, the jelly as its own clade, species by niche rather
than a symmetric tree, and the order of work: **design the creatures first, then build their looks, then the gameplay
mechanics** (temperature, burst movement, moulting, the drain, detection modes) — none of the mechanics until the
creatures look right in the game. The rest of the planet was proposed in the audit and not objected to. What has not
been answered is in [Open](#open), and is not to be decided by Claude.

**Units: 1 unit = 1 metre**, so depths, sizes and speeds compare directly with Earth. The player is a 3–3.5 m animal.

## The planet

- **Star.** Late-G / early-K, ~5300 K, slightly orange-white, long-lived (time for three clades to happen). Green
  plants are fine under it; surface light is warm. Underwater the water decides colour, not the star.
- **Gravity.** 1.0 g; `GRAV` in world.js is 9.8 (it was 14 to v9.3). Waves, pressure with depth and breaching behave
  as on Earth. Exoskeleton size limits on land are Earth's; in water buoyancy carries the mass (see hingeshells).
- **Moon.** One, large and close, ~3× Earth's tidal force. Tides of 6–9 m, semidiurnal on a 31.2 h lunar day (built v10.3:
  `tideAt`, springs 4.5, neaps 3.0, 13 days spring to spring). Consequences: a wide strand that walks twice a day; a tidal
  stream of ~1 m/s on the flanks at spring mid-tide (`tidalAt`); tidal mixing feeds the shelf; bright nights. The day is
  ~30 h because a big moon has slowed the spin. Day/night is not built; an ectotherm ecology under a big moon will keep
  asking for it.
- **Atmosphere.** ~28% O₂. Buys high-metabolism ringmouths and giant hingeshells (Earth's giant arthropods were a
  high-O₂ event). Surface water is oxygen-rich.
- **The mountain.** An oceanic volcano that rose from the deep floor and built the island: basalt, so iron and
  magnesium everywhere (olivine — green sand on the strand); still hot at the vents and the chimney. No continent, so
  no river nutrients: productivity comes from the seamount effect, upwelling round the flanks. Island rules apply — a
  few founding lineages reached it and radiated into every niche (the Galápagos rule), so there are endemics, giants
  and dwarfs, and the family tree is lopsided and the species count modest. The above-water part of the world is due
  an overhaul later; this paragraph is what it must agree with.
- **The ocean.** Oxic to about **−450, then a chemocline**: below it the water is anoxic, ferrous and sulfidic (the
  Proterozoic ferruginous ocean; the Black Sea today). This is the real reason **the dark** is different. The
  chemocline is a *depth*, not a floor biome: the pit's floor is −550 and the flank crosses −450 at the square's corners (the
  void at −800 is gone since v11.28: the flank goes on down to the plate instead), "the dark" is ground < −450, and the water over
  it at −200 is still oxic. Only low-metabolism animals live below it; hunters visit. It is where ferrous iron is
  dissolved (only possible without oxygen), so iron chemistry reads by depth (see shell colour).
- **Temperature.** 26–28 °C mixed layer down to the base of the shelf (~−60), thermocline down the slope, ~3 °C on the
  deep floor, hot at the vents. The shelf is the slowbloods' warm home; the vent field their one warm place below;
  the rest of the deep is for the big and the torpid.
- **Light.** Red is gone by ~−15, most green by ~−80, blue to ~−200 in clear water. Photosynthesis to ~−150 at the
  outside. Below −200 vision is useless and hunting is by vibration, chemistry and electroreception (not built:
  [Hooks](#hooks)).

## Geology — the island, decided (8 Sep 2026)

The person's rule for the world (Sep 2026): **no biomes**. The world is a volcanic island and has the behaviour its physics
and sedimentation give it; the animals and the sessile life favour conditions and turn up where those hold. No place has a
name; nothing downstream of the terrain reads a label (the HUD shows depth, nothing else). Everything below is a
consequence of "a young oceanic shield volcano, almost drowned", and world.js `sample()` is this section as a function.

- **The shield.** Gentle flanks: the shelf is the upper flank at 4–6°, −20 to −60 out to r 700; the slope ring to −250 at
  r 1200; the apron of the volcano's own debris to −290 at 1600. Basalt everywhere: olivine-green sand.
- **The lower flank and the plate** (10 Sep 2026, the person: the floor must taper off as a real ocean's would; to v11.27 it fell
  520 m in a hundred into "the void", the world's rocky wrapping). What is real: a seamount whose summit reaches the surface stands
  3–4 km off the plate; its flanks are 10–20° (pillow lava and hyaloclastite pile at the angle they quench at, steeper on a small,
  young edifice), easing to 5–10° low down, with the archipelagic apron — landslide debris and volcaniclastic turbidites — feathering
  out at 1–3° onto the plain for tens of km. The plate itself: a young plate lies ~3 km down and sinks with age (d ≈ 2500 + 350·√Ma m:
  3.6 km at 10 Ma, 5 km at 50 Ma); its floor is abyssal plain — flat pelagic sediment over abyssal hills of a hundred metres, cold
  (~3 °C), lightless, oxic on Earth but here **below the chemocline** (−450), so anoxic, ferrous, manganese-black. A big island also
  flexes the plate into a moat and an arch, 50–150 km out — nothing at this scale. So the game's floor past the apron's toe (r ≈ 1560,
  wavy) goes on down at 16.7° easing to 12.4° (world.js `FLANK_*`): −320 at the square's edge on an axis, ~−580 at a corner, −850
  2 km out, the plate at ~−3800 some 15 km out. **The dark inside the square is the pit and the corners now.** When the world grows
  it grows outward down this flank: the plate is one biome — open water over dark mud, cold, sparse, the same for kilometres — and the
  island a hotspot of light, relief and upwelling on it; there is then no wall to hit, only more of the same going down.
- **The caldera.** The summit is a caldera: a flat sandy floor at −22 inside a rim of land (the last land: +2..+6, r ≈245)
  broken by passes at −14 that flush it. Calm, clear, poor water; the current runs in the passes. The reef's lime polyps
  live on the rim's outer slope and in the passes, in the clear bright water they win.
- **Drowned shorelines.** The island is subsiding (an oceanic island does); each stillstand cut a shore platform, so the
  slope between −60 and −156 is eight 12 m terraces, **rings round the whole island**, buried where the collapse debris
  lies over them and cut through by the dikes.
- **The flank collapse.** One flank (centre 3.9 rad, ~0.8 rad wide at the scarp, widening downslope) failed, as oceanic
  volcanoes do: a headwall scarp of 75 m just outside the rim, then a hummocky debris fan out to r ~1100 — biggest
  blocks nearest the scarp, thickening the slope by 20 m where it piled, thinning to nothing at the apron; a few blocks
  stand out of the water near the scarp. The fan is fresh basalt (rust mats, iron domes) and rubble (crags, tors, the
  boulder field) with the slide's coherent blocks lying in it — flat sheets of the old flank that came down whole (Earth's
  toreva blocks; the slabs, v10.4). This is the rockfall, with a reason and a shape.
- **The dikes.** The oldest flank (centre 0.35 rad) faces the waves and was wave-cut deepest in the lowstands; its radial
  dike swarm stands exhumed as sharp ridges every 2π/22 between the terraces, 8–34 m high: bare rock, talus, the odd heap of
  blocks, strata on the steep flanks — the ridges themselves are the feature. Not young: no rust. (v10–10.1 had spires and
  megaspires on the crests, called "necks", up to 160 m tall and nearly at the surface; v10.2–10.4 tried walls of dike rock
  and one neck in their place; all struck by the person, 8 Sep 2026: "no more spires, no more weird special spire
  replacement rocks — just normal geography based on what's nearby".)
- **The rift arms.** Two, at 2.6 and 5.6 rad: low ridges of younger flows from the summit out. Arm 0 carries a **pit
  crater** at r 470 (the pit) and, at its deep end (r 1200–1420), the **hydrothermal fissure**: a line of chimneys,
  sulfur mats, the warm water the straightshells visit. Arm 1 carries a **flank cone** at r 500: the island.
- **Wind and current.** One prevailing wind: the waves strike the old flank (0.35 rad) — surf, cones, stirred sand; the lee
  (3.5 rad, the collapse's side) is where sand settles: the flats. One prevailing current: it strikes the north-east flank
  (5.44 rad) — upwelling, food, the weed forests and the filter-feeder gardens; its wake (2.3 rad) is where the eddies
  retain what drifts: the float colonies and the rafts (the canopy).
- **Sediment.** Basalt sheds little. Sand settles in the lee shallows and the lagoon; nothing stays on the fan's blocks or the
  dike crests; the deep is mud. Substrate is a field, 0 mud to 1 rock.
- **The conditions** (`sample(x,z).f`, DESIGN World shape): substrate, current, wave exposure, food, turbidity, the age of the
  rock, heat, shelter (the lagoon) and relief, plus the ground height (light, pressure, temperature, oxygen follow it).
  Every species has a tolerance envelope over them and a density at full tolerance. The honesty test: strip the names
  from flora.js and creatures_defs.js and read only the envelopes — you should be able to say what lives there.
- **What went.** Both arches and the massif (structurally unbelievable; the person's call, 8 Sep 2026), the tide band, the
  biome ids, sector relief, water colour and fog by place (they follow depth, turbidity, plankton and heat now), the
  name popup. The world is 3.4 km across and will grow; when it does the geology gets more of the same, not more kinds.

## Life by depth — the green gradient

A plant is the colour of the light it *rejects*. Under white light a plant that uses red and blue is green; water
eats red first, so a green-reflecting plant at −40 discards the light it has left and loses to something brown or
red that eats green. Green is therefore a shallow thing, and the gradient is the rule:

| depth | photosynthesis | what "flora" is | game |
|---|---|---|---|
| land, surface, to ~−20 | green | plants (a seagrass analogue on the flats; land plants; the rafts) | strand, shallows, sedge flats, canopy |
| −20 to −60 (shelf) | olive to gold-brown | kelp-like algae | kelp towers (push browner), bladder forest (gold) |
| −60 to ~−150 (upper slope) | red-purple crusts, thinning | encrusting algae; then nothing | the drop, upper terraces |
| below −150 | none | **animals and mats**: whips are sea-pen-like sessile animals; lanterns are animals with light-making symbionts (blue-green, 470–500 nm, because that carries furthest); vent stalks are tube-worm analogues; fans on the reef are coral | spires, terraces, vent field, lantern fields, plain |
| below −450 (chemocline) | none | chemosynthetic mats, scavengers; residents have low metabolism | the dark, the pit |

Everything the person has praised survives by re-reading, not removal: the phosphorescent deep, the canopy, the pit,
the lanterns. What does not survive: green grass on the terraces (biome 7, −60 to −250). The sessile life itself — the forms, the
roster by band and the generator — is `FLORA.md`, downstream of this section.

## The three clades

**The stalemate rule.** Earth's Cambrian disparity was pruned when one lineage assembled jaws, an endoskeleton and a
fast metabolism in the same body. Here **no clade has all three**: slowbloods got jaws and bone, not the metabolism;
ringmouths got the metabolism and the brain, a beak and no bone; hingeshells got the armour. With the founders story
(three lineages reached a young volcano and radiated) there are two independent reasons the strange survives. Each
clade has one deep decision that everything downstream follows from. The names are chosen: **ringmouths, slowbloods,
hingeshells**; the **jelly is a fourth clade of its own**, the drifters — designed and built 9 Sep 2026, `DRIFTERS.md`: the ring kept
radial, stinging, eyeless; bells in the water, floats on the surface (the button that farms, the sailer that fishes).

### Ringmouths — tentacled, many-eyed, cephalopod-adjacent
(the mouth sits at the centre of a ring of arms)

- **Deep decision:** one mineral, worn outside as a shell or grown over as an internal stiffener. An internal
  "backbone" is an internalised shell and can be *any shape the shell would have been* — rod, plate, or a coil under
  the skin (Spirula does this on Earth). Cartilage and texture elsewhere.
- **Depth limit:** a gas-chambered shell cannot be pumped empty against the pressure much below ~−450 and implodes
  before −800; the same depth is the chemocline. Shelled forms own the reef, shelf and slope; the dark belongs to soft
  forms. The dark's resident ringmouths are the clade's one *low*-metabolism branch — the vampire-squid precedent: it
  lives in Earth's oxygen-minimum zone on blood that binds oxygen at almost nothing.
- **Metabolism:** high by default (jet propulsion is expensive; brains are expensive): fast, clever, short-lived,
  boom-and-bust numbers, packs. This is why they can *afford* intelligence and manipulation, and why most of them
  stay in the warm oxic water.
- **Eyes:** every form carries a ring of small eyes round the mantle rim (360°, motion detection); predators add a forward
  cluster of three to five (binocular) on a knuckle at the top of the ring. Many simple eyes are cheap without a big visual
  brain; two good ones are not. (v11.8: the ring on all, per CLADES.)
- **The ring** (v11.8, CLADES): eight arms differentiated 2-4-2 — two grasp arms, four stiff oars, two keel arms under the
  siphon — on everything but the deep line, which keeps the ancestral equal ring (the pall's net, the veil's funnel). No head:
  the mantle runs into the ring; the mouth shows as a dark ring with a beak. The coiled shells are carried **on their edge over the mantle**, the outer
  whorl ending forward and curling up and back (the person, 9 Sep 2026: the flat wheel "sat flatside on top"; stood upright it is a
  proper shell), the cone's bands run as a helix.
- **Attack:** spear vs jet. Arms-first hunters close the ring into a cone (the ortho already tightens its arms above
  1.2 speed) and *bloom* on contact; jetters go mantle-first with the arms trailing. The weapon is the grab, then a
  beak, venom or paralysis.
- **Blood:** copper (haemocyanin): flesh tints grey-green to teal, never pink.
- Existing species: soft-arm (player), coilshell (player), arrow, ortho, great, lurker, and the veil (**a ringmouth of the
  deep line, decided 9 Sep 2026**: a filter feeder with the collar of eyes and no forward eyes, its arms webbed into a funnel).

### Slowbloods — reptilian, two-eyed, biting
(the name is the strategy; finback is the player's species within it)

- **Deep decision:** ectothermy on a continuous internal skeleton. Activity is a function of water temperature, so
  the shelf is home, the vent field is the deep exception where the big active ones bask between hunts, and the cold
  deep belongs to gigantotherms (big enough to hold heat: the abyssal) and the torpid.
- **Mixothermy** (warm swimming muscles, as in tuna) is how a fast hunter works a cold slope: the ridge.
- **Torpor:** a slowblood can sit for minutes to weeks and starve for longer — an ambusher that bites rather than
  grabs, and the plain's "stones".
- **The eye ring** (v11.8.7, CLADES): a ring of small dark eyes round the base of the snout, on every one, no band;
  predators carry two of them forward on lobes of the head's flesh, big, pupilled — a shark's eyes: they track, but dark on dark you
  see it only close (the person, 9 Sep 2026). The weapon is the bite: the ring of arms kept as a ring of **short stiff mouth
  tentacles** closing to a point (v11.8.8) that bloom on the bite, and the petals' inner edges are the variable: needle (fish-eater), plate (a crusher that eats shells — the
  coilshell player's specific enemy), rake (grazer), none (suction). Fins in threes at 120°, a three-lobed tail: the ring's relic.
- **Armour** when present is chitinous with the clade's own plate pattern — rows of plates along an unsegmented body,
  barbels, a mandible-ish jaw: the "bug presence" on a reptile. Skin scratchy or smooth otherwise.
- **Blood:** iron: rust and red-brown flesh.
- Existing species: finback (player), darter, glim, grazer, ridge, abyssal, eel.

### Hingeshells — exoskeletal, Cambrian, machine-like

- **Deep decision:** an exoskeleton that must be shed. Moulting is the clade's cost and its story: shed carapaces on
  the floor, dens in the massif and the pit, and a *soft* state after each moult — pale, hiding, and the only time a
  hingeshell is edible. Juveniles are soft; adults rarely unarmoured; some carry a mineral shell over the chitin too.
- **Why they can be huge here:** exoskeleton scaling is a land problem; in water buoyancy carries the mass. The real
  aquatic limits are oxygen delivery and moulting, so hingeshells have a closed circulatory system (vertebrates and
  cephalopods evolved one independently; a third time is not a stretch), the atmosphere supplies the oxygen, and
  moulting is what remains: the big ones moult rarely and are soft for weeks. An Ohmu-class walker at 6–8 half-length
  (12–16 m), slow, rare, sediment-feeding or ambushing, is plausible. A 15 m hingeshell apex is not.
- **They cannot undulate.** Locomotion is paddles in a metachronal wave, legs, or a tail-flick escape: burst and
  coast, poor turning, explosive grabs. None of them wins a chase; the terror is the strike. A hydraulic tell (limbs
  cock, the body swells) precedes a strike; the movement between strikes stays unreadable.
- **Many eyes**, stalked (never tracking) and in rows along a shield's rim; **no antennae** — the sensing organ is a comb of rigid
  plates on the front of the shield (v11.9, CLADES); the long stringy appendages — a proboscis with a claw at its end (one of a
  mismatched pair), frontal claws, filter combs.
- **The hinge** (v11.9, CLADES): a bivalved carapace along the back, two plates hinged at the midline — raised when swimming or
  walking, clamped shut when threatened and through the moult (the soft state hides inside). The clade's own thing and its name.
- **Blood:** pale — vanadium (yellow-green; tunicates use it) or nearly clear at the joints. The machine look.
- Existing species: scuttle, trap, hook, tread, picker, flicker, hose, sickle, comb (all v10.6; rebuilt with the valves v11.9).

## Cross-clade rules

- **Eyes show intent regardless of clade:** predators forward and clustered, prey lateral or ringed (ringmouths: the cluster over
  the collar; slowbloods: the band's lobes; hingeshells: stalks). The ridge wears the lobes (v11.8.4).
- **No eye glows** (the person, 9 Sep 2026: a believability rule). Eyeshine is a reflection of a light source and there is
  none down there; a pale iris with a black pupil is pigment and reads intent as well. Eye colour by clade: ringmouths a pale
  grey-green iris and a black pupil; slowbloods silver-grey; hingeshells black beads. No emissive material on any creature.
- **Blood pigment is the tint family:** copper (ringmouths), iron (slowbloods), pale (hingeshells). Three clades
  distinguishable by colour alone.
- **Shell colour is water chemistry**, read by place: cream calcite on the reef; rust where dissolved iron meets
  oxygen near the basalt (rockfall, shallows); black iron sulfide below the chemocline and at the vents (the one real
  iron-shelled animal, the scaly-foot snail, is black); manganese black on the plain (abyssal plains grow manganese
  nodules). Real shell colour is mostly pigment, but the rule is legible, which is what matters.
- **Geometry language:** ringmouths are spheres and chains, slowbloods are lathes, hingeshells are boxes and cones
  with the joints showing. Nearly true already; make it a rule.
- **Niches are shared, not divided.** Every niche has a winner and lesser representatives ("the largest or safest
  wins the filter-feeder spot"), so a family tree is drawn by niche, not by symmetry. The person's rule for filling it (8 Sep
  2026): a niche's share across the clades should be unequal but not exclusive — 90/8/2, not 100/0/0 (a second clade's
  filter feeder at a few percent of the first's numbers). To be done by variants and minor species once the base roster is
  in the world; the roster below is the base.
- **Predators hunt the player because the player is prey-sized**, not because it is the player; land is a refuge
  because swimmers strand; nothing roars.

## The niche audit (as of the v9.3 roster)

| niche | ringmouths | slowbloods | hingeshells |
|---|---|---|---|
| floor grazer | — (a shelled rasper on the reef) | grazer | scuttle |
| small forage | — | darter, glim (unspawned) | — (a burst-swimming "flicker") |
| small-prey hunter | arrow (pack) | — (a shallows needle-jaw) | — |
| floor ambush | lurker (grab) | — (a torpid "stone", bite) | — (a buried trap, strike) |
| structure hunter | — | eel | — (a climber on the towers and the massif) |
| player-size predator | ortho (spear) | ridge (mixotherm) | — (a "sickle": burst and claws) |
| big filter feeder | veil (unconfirmed) | — | — (a comb-feeder on the plain, the minor one) |
| apex | great (shelf, coil) | abyssal (the rim; forays into the dark) | none — probably the right answer |
| the dark (resident) | — (soft, black, eye-ringed, low metabolism) | (torpid forms) | — (a scavenger at the rim, sparse) |
| land / surface | — | (the glider hook) | scuttle; a launcher? |

The jelly is an outsider (a cnidarian analogue); "all clades represented" does not forbid a fourth minor lineage.

## Conflicts with the game as built

| what | status |
|---|---|
| `GRAV=14` (world.js) was 1.43 g in metres; the wave dispersion already used 9.8 | **done, v9.4:** `GRAV=9.8`. A sprinting finback breaches ~8.5 m instead of ~6; a flop travels ~3 u/s instead of ~2. Unseen |
| green `grass` on the terraces (`per[7]:250`), kelp/bladder tints | to change: grass off biome 7; kelp and bladder browner |
| the ortho spawns in the dark (`SPAWN[11]`) | to change: shell, pressure and oxygen all say no; a soft black ringmouth takes the dark, the ortho moves up |
| the abyssal as a *resident* of the dark | to change: a resident of the rim at the chemocline, hunting the oxic side and diving in |
| "no oxygen" (the player) | **decided:** the player stays a water-breather, but below −450 it takes a slow drain; big slowbloods and the dark's residents shrug it off. Not built |
| `detect:85` in the dark by sight | deferred (detection modes, a later pass) |
| day/night | not a conflict yet; a hook |

## Hooks (derived here, not built)

- **No magic** (the person, 8 Sep 2026): nothing lit, floating, standing or moving without a physical reason, even for
  gameplay. Bioluminescence was removed whole in v10.1 (constant lanterns feed nothing and attract everything); it may
  return only as *events*: dinoflagellates firing in a wake (the disturbance list already tracks every body), pens and whips
  flashing when brushed (the sway shader already knows a body is near), creatures' brief flashes. Never a lamp.
- **The tide** — built (v10.3, DESIGN The surface): 6–9 m twice a 30 h day on a clock that runs a day in forty minutes; the rim
  floods, the passes run in and out, the strand walks, the rocks wear the band; the current turns with it (the tidal stream,
  `tidalAt`, splitting round the shield). Still open: the cones and crowns opening on the flood; day and night on the same clock.

- **The chemocline drain**: slow damage below y = −450, independent of floor biome. Show it: a thin milky layer at the
  chemocline (real chemoclines carry a visible bacterial plate), the water below it browner and stiller.
- **A temperature model** `temp(x,z,y)`: warm above ~−60, cold below, a hot bubble at the vents; slowbloods scale
  speed, turn and detect by it, gigantotherms and mixotherms with a floor. One function, one multiplier in the hunters.
- **Burst-and-coast movement** for hingeshells: gate `accel` on a duty cycle, low `turn`, high `speed`, a tell before
  a strike.
- **Moulting**: a `soft` state (pale palette, `edible`), shed carapaces as floor flora, dens.
- **Detection modes**: sight in light, vibration scaled by the target's speed, a blood radius when hurt. Different pass.
- **Day/night**, tidal current through the arch, a fourth (legged) playable clade — the hingeshell is the candidate
  (the person: three for now).

## The roster (proposed v9.4; built v10.6, placed v10.7 — all fifteen, stats and envelopes as first guesses)

*Since v11.26 the numbers are not guesses: `SPAWN.n` is a capacity, the world's count is the ledger's equilibrium (`test/census.js`), and a
predator's number is what its prey feeds — DESIGN, The ecology. Where a species here was placed above nothing it could eat, its prey list or
band was moved to the food (CHANGELOG v11.26).*

Species by niche, each with the family it belongs to, so the split is known. `size` is the half-length in metres as
`creatures_defs.js` uses it. Existing species keep their builders and get the clade's eyes and tints when their turn
comes; new ones need a builder. Order of building proposed at the end.

### Ringmouths
Ancestor: a thumb-sized shelled crawler on the reef, eight arms round the mouth, a ring of eyespots on the mantle rim.
First split **shell out / shell in**. Shelled → **coilshells** (coiled, buoyant, slow, armoured) and **straightshells**
(a long cone, fast in a line). Soft → **jetters** (pelagic, fast, spear or jet), **crawlers** (benthic, arms as legs,
the clever ones) and **the deep line** (below the light, low metabolism, webbed arms).

| species | family | niche | where | size | what it is |
|---|---|---|---|---|---|
| coilshell (player) | coilshells | — | reef, shelf | 1.5 | exists |
| **rasp** | coilshells | floor grazer | reef, shallows, kelp | 0.5 | a fist-sized coiled shell dragged by six short arms that rasp algae off rock; eye ring on the mantle; cream on the reef, rust in the rockfall; edible. Loses the grazing niche to the herds and keeps the rock |
| great | coilshells | shelf apex, coil | shallows, flats, bladders, terraces, the arch | 6 | exists |
| ortho | straightshells | player-size predator, spear | spires, vent field, lantern fields — **out of the dark** | 8 | exists; gets a forward eye cluster |
| soft-arm (player) | jetters | — | — | 1.6 | exists |
| arrow | jetters | small-prey hunter, pack | the shelf | 1.0 | exists; forward eyes |
| lurker | crawlers | floor ambush, grab | kelp, rockfall, spires, the arch | 2.4 | exists |
| **watcher** | crawlers | none — a curious omnivore | kelp towers, bladders, terraces | 1.8 | walks on four arms with four held up; a raised head with a forward cluster of five eyes that tracks whatever is near; teal flesh, a gladius ridge under the skin of the back; never attacks, never flees far. Low priority |
| **pall** | the deep line | the dark's resident | below −450: the void, the pit | 9 | black; the arms webbed into a net held open; twelve pale eyes in a ring round the mantle; drifts more than swims; the vampire-squid precedent |
| veil | the deep line | big filter feeder | the drop, lanterns, plain, the rim | 16 | exists; skirt = arms, glow ring = eye ring. **Placement unconfirmed** |

### Slowbloods
Ancestor: a hand-length fusiform swimmer with two eyes, a backbone and a simple jaw in the warm shallows. First split
**swimmers / sitters**. Swimmers → **finbacks** (plain fusiform), **ridgebacks** (spined, warm-muscled or gigantic),
**longbacks** (eel-shaped). Sitters → **platebacks** (armoured, torpid, benthic).

| species | family | niche | where | size | what it is |
|---|---|---|---|---|---|
| finback (player) | finbacks | — | — | 1.8 | exists |
| darter, glim | finbacks | small forage | shallows, kelp | 0.6 | exist, unspawned (boids later) |
| **needle** | finbacks | small-prey hunter | shallows, flats, kelp, bladders | 0.9 | a pencil with a needle jaw, in threes; hunts flickers and darters; edible. The arrow's counterpart: slower, but cheap to run in warm water |
| grazer | finbacks | floor grazer, herd | flats, bladders, terraces | 2.6 | exists; gets a rake jaw |
| **basker** | finbacks | mid predator, vent-bound | the vent field | 5 | smooth-skinned, iron-black with rust; quick in the warm water round the vents, sluggish if it strays; hunts what comes to the warmth (pickers, the player) |
| ridge | ridgebacks | player-size predator, mixotherm | the drop, terraces, plain, the arch | 9 | exists; forward eyes |
| abyssal | ridgebacks | apex, gigantotherm | **the rim** of the dark, forays below | 15 | exists; home moves to the rim |
| eel | longbacks | structure hunter | kelp towers | 4 | exists |
| **stone** | platebacks | floor ambush, torpid, bite | plain, terraces, lanterns | 3 | a plated lump the colour of its floor (manganese-black on the plain), two eyes on top; sits for minutes, bites what touches it |
| **crusher** | platebacks | shell-eater | rockfall, reef, kelp | 4 | short, thick, plated; plate jaws; hunts rasps and coilshells — the coilshell player's particular enemy (withdrawing won't save you; mechanic later) |

### Hingeshells
Ancestor: a segmented benthic thing with a head shield, a row of lateral flaps, a pair of frontal appendages and five
stalked eyes. First split **walkers / paddlers**: the flaps became legs (the floor and the land) or stayed flaps (the
water column).

| species | family | niche | where | size | what it is |
|---|---|---|---|---|---|
| scuttle | walkers | floor grazer, walks on land | shallows, strand | 0.7 | exists; gets more eyes |
| **trap** | walkers | floor ambush, strike | flats, shallows | 2 | buried to the eyestalks in sand; a pair of folded raptorial arms that unfold in a fifth of a second (the mantis-shrimp strike); the tell is the eyestalks rising; rust-red shell |
| **hook** | walkers | structure hunter | kelp towers, the massif, spires | 2.5 | hooked legs; climbs stalks and rock faces, hangs, drops on what passes below; pale joints; eight eyes in two rows |
| **tread** | walkers | sediment feeder, the giant | terraces, plain, the massif | 7 | the Ohmu-class walker: a long low arched carapace of overlapping plates, fourteen legs, feeding combs under the front, a row of eyes along the shield's edge; walking pace; nothing hunts it; a few in the whole world |
| **picker** | walkers | scavenger at the rim of the dark | the pit, the rim, below −450 | 1.5 | long thin legs, hypoxia-tolerant; picks at what sinks. Sparse |
| **flicker** | paddlers | small forage | shallows, flats, kelp, bladders | 0.4 | shrimp-like, translucent, tail-flick escape; the floor of the food web with the darters; edible |
| **hose** | paddlers | small-prey hunter | kelp towers, bladders, the drop | 1.5 | opabinia: five stalked eyes; a flexible proboscis with a claw at its end that picks flickers off the stalks; flaps down the sides, a tail fan |
| **sickle** | paddlers | player-size predator, burst | spires, rockfall, terraces, the arch | 5 | anomalocaris: a pair of jointed frontal claws, a ring mouth of plates, rows of lateral flaps, a tail fan; burst and coast, cannot corner; dark carapace, yellow joints. The insectoid the person asked for |
| **comb** | paddlers | big filter feeder, the minor one | plain, lantern fields | 7 | tamisiocaris: the frontal appendages are combs; a slow flap wave down a long pale body; the abyssal's prey |

### Drifters
| jelly, deepbell, sailer, greatsailer | drifters | drift; the surface | the water column; the surface | 1.4–4.5 | `DRIFTERS.md` (v11.16) |

**Proposed build order** (hingeshells first, since that is the gap and the wish): sickle, trap, tread, hose, flicker;
then stone, crusher, pall, rasp, needle; then basker, hook, comb, watcher, picker. Each new builder follows its clade's
geometry language (boxes and cones with joints for hingeshells; lathes for slowbloods; spheres and chains for
ringmouths), its blood tint and its eye rule; existing builders get eyes and tints in the same pass.

## Decided 12 Sep 2026 — the believability discussion (`analysis_believability.md`, `DIRECTION.md`)

Decided, not built; the sections above stand as written until the passes that build these change them. The full reasoning is in
`DIRECTION.md`.

- **Oxygen: ~21%, Earth's**, not 28%. The Carboniferous number bought giant land insects (a tracheal effect) and nothing for water-
  breathers; the big hingeshells stand on buoyancy, closed circulation and the moult, which work at 21%. Removes fire on land and the
  tension with an anoxic deep.
- **The chemocline is this basin's, not the planet's.** A permanent planet-wide anoxic deep under an animal atmosphere is not
  believable (Earth's were transients that ended themselves); a **silled basin** is (Black Sea, Cariaco, Saanich Inlet with tides). A ridge
  encloses the chain with its crest near −400 to −450, the basin floor −800 to −1500, exchange through a few narrow deep gaps; renewal
  events move the boundary. The sill replaces the plate paragraph of v11.28 as the horizon; the deep's water is sill-depth water, ~8–10 °C.
  The Ocean bullet's "Proterozoic ferruginous ocean" reading goes; the dark, the seep line, the black shells and the iron chemistry stay.
- **The pall lives in the suboxic band just above −450**, not below it; the picker on the redoxcline; nothing multicellular below.
- **The mountain is one of a hotspot chain** (one island now, the archipelago later): young / mature / atoll / guyot by age, saddles
  between merged edifices, oxic corridors above the chemocline and barriers below. The founder rule applies at species rank across the
  chain, not at phylum rank on one island.
- **Size is not the limit; density is.** Sizes stand (a 15 m slowblood apex, a 16 m filter feeder); numbers follow mass^−0.75 and the
  world's area. Giants are seen by haunts, aggregation events and age, not by count.
- **The hingeshells' long segmented plan is legit** (radiodonts, eurypterids, remipedes) with firm limits: no pursuit, poor turning, swimmers
  capped near the sickle's size, giants by terminal moult only and in cool water. The clade's numbers are a size pyramid with a wide base.
- **The moon is closer: about half Earth's lunar distance**, ~8× the tidal force, so a couple of metres of open-ocean tide amplified to
  the 6–9 m on the banks and lagoons; a ~10-day month, springs and neaps every five days, an eclipse every ten days. The Moon bullet's
  "~3× Earth's tidal force" and the 26-day `moonIllum` period change with the pass; the day stays ~30 h.
- **A physiology model** (temperature, pressure) will be built — the Hooks' `temp(x,z,y)` and pressure with depth, read by creatures and
  player. **Player hunger**, **eggs, mating and reproduction within one life**, and **the player starting as the smallest body the creator
  allows** are decided (DIRECTION). Reputation is a facet of intelligence, per species. Deferred: how young "young" is (until the
  archipelago); the ledger's mass for long bodies.

## Decided 14 Sep 2026 — the caustic, and the sea it needs (the effects audit; DESIGN The light)

Built as v11.35–v11.39. The caustic on the floor is derived, not painted: the sun focused by the surface's curvature, `1/|det J|` of a
ripple layer that lives only in the light (the swell cannot focus in the top 30 m; the surface mesh cannot hold ripples). The person's
answers, 14 Sep 2026:

- **The sea carries no film.** "A normal ocean." The ripple spectrum is a wind sea's — constant steepness across 8 m down to 0.5 —
  which puts the curvature in the short waves and gives a snorkeller's fine web in the shallows, metre cells at 5–10 m, soft patches
  by 20, nothing by 25. Chosen over bigger cells: "prioritise believability, even if it means smaller caustics." **There is no stated
  stylisation.** (A film or clouding microbial colonies somewhere in the world is not ruled out — "that sounds awesome" — but it is
  not on this sea, and the caustic does not claim it.)
- **Light is moved, not made.** The net's cells are darkened by what its lines add; the drawn factor's mean over the floor is 1.
- **Gusts drift with the wind.** Patches of net and calm cross the floor at the wind's speed.
- **The light shafts read the same surface.** A shaft's brightness is the focusing over its head, from the same field as the floor's net.

Still its own clock, unasked: the shimmer on the surface (atmosphere.js) — a canvas radial gradient, the audit's most foreign thing.

## Decided 15 Sep 2026 — chemistry, one per clade (COMBAT.md §3b)

Venom is a secretion the body already makes given a wound to flow into, and it is tuned to the prey it was evolved on. So each clade's
chemistry is derived from what it has, and the three are unalike: **ringmouths** carry an offensive venom in the saliva, by the beak
once the hold is won (paralysis in the hunters, an anticoagulant in the rasp; the deep low-metabolism line never has it, it costs);
**slowbloods** carry a defensive venom on the fin spines from the skin, never offensive; **hingeshells** carry no venom at all — marine
arthropods do not — and are poisonous to eat when they have fed at the seep line, so poison follows the animal's feeding, not its
species; the **drifters'** stinging cells are the one cell-level invention. The roster it lands on is in COMBAT.md.

## Open

Asked and not yet answered; do not decide these for the person.

1. The roster above: strikes and changes now that it is in the world (the looks were approved, 8 Sep 2026: "look great").
2. ~~The veil as a ringmouth of the deep line~~ — answered 9 Sep 2026: yes, and rebuilt (CLADES).
3. The slowblood and hingeshell signatures proposed in `CLADES.md` (the petal snout, the eye band, three-fold fins; the bivalved
   carapace, the comb): the person said "continue onward" after the ringmouth pass was proposed; each clade's pass is to be seen
   before the next.
