# CLAUDE.md — tethys

Read this first. Then `HANDOFF.md` for where things stand, and the `DESIGN.md` section of any system before touching it.

## What this is

An underwater exploration game in one three.js file. Subnautica-like: no tech, no oxygen — swimming, an ecology, predators,
a surface to breach and land to flop onto. The player picks one of three clades from a convergent-evolution roster:
**soft-arm** (a ringmouth jetter), **finback** (a slowblood), **coilshell** (a ringmouth with a flat coiled shell). three.js r128
from cdnjs, global `THREE`, no modules, no framework, no dependencies. Aesthetic: old-school low-poly — boxes, lathes and spheres,
flat shading, countershaded vertex colours; the fog is the look. Text in the game: minimal, lowercase, letterspaced serif, only
when needed. 1 unit = 1 m; the player is a 3–3.5 m animal.

**The rule (8 Sep 2026): the island is fully believable from its logic — no biomes, no magic, even for gameplay.** If a thing
can't be derived from a young shield volcano, a big close moon, 28% oxygen, iron, a chemocline at −450 and the founder lines, it
goes. No place has a name; every species places itself by a tolerance envelope over the condition fields. Nothing glows, floats or
moves without a physical reason; eyeshine is a reflection; bioluminescence only as events. Earth is reference, never template.

## Build, test, run, look

```
node build.js            tethys.html (everything inlined), dev.html (loads src/*.js separately), src/INDEX.md
node build.js --test     the same, then every headless test below on both tiers; exit 1 on any failure
node serve.js            static server; open http://localhost:8080/dev.html (edit + refresh) or /tethys.html (the build)
```

- Node 22 is on PATH. Python is **not** installed on this PC; `build.py` is the same build for sandbox sessions and is kept in step
  with `build.js` (byte-identical outputs) — change both or neither.
- `tethys.html`, `dev.html` and `src/INDEX.md` are **build output**: gitignored, rewritten on every build, never edited by hand.
  After a fresh clone run `node build.js` before playing. `src/INDEX.md` is every top-level name and its line.
- The tests concatenate `src/` in `src/order.txt` order against a stubbed THREE (`test/stub.js`) and run in Node; the world is the
  real one (same `sample()`), so headless measurements of terrain, collision and behaviour are meaningful. They prove nothing about
  rendering or sound. New THREE APIs may need adding to the stub.

| test | checks | run |
|---|---|---|
| `test/lint.js` | undeclared (fails), declared twice at the top level (fails, v11.53: one scope, the later file wins silently) and unused (informational) names across the bundle; acorn vendored as `test/acorn.js` | `node test/lint.js` |
| `test/physics.js` | the collider hash against brute force, rocks, capsule push, chains, body contact, flow, cost per creature | `node test/physics.js` |
| `test/anim.js` | tail rate and arm-tip jerk two minutes in through accelerate/cruise/turn/sprint/coast; fails on spin, shiver or fling | `node test/anim.js` (`T0=600`) |
| `test/steer.js` | the steering (v11.77): scripted input through the frame loop for the three roster players, the hose and the sickle — straight up, straight down, a loop, a knockback, a and d, space and c, s, the touch stick, a breach (the surface both ways), first person; fails on a flip (the body off a held heading), a spike (a frame faster than the body's turn rate, the arc's allowance in the air), a strafe, a body upside down, a NaN; the walking (v11.78): the picker, the scuttle and the ram up a slope the test finds clear of rock, a turn, backing by the legs, a step, a ledge, the hop and the beach | `node test/steer.js`, `TIER=low …` |
| `test/audio.js` | the audio graph against the stub's fake `AudioContext` (any NaN param throws), the space at five sites, tick cost | `node test/audio.js` |
| `test/snow.js` | the marine snow mix at seventeen sites (v11.82: the front ring against the slope beside it, the deep maximum against the same column at 140), layering invariants, the chains, tick cost | `node test/snow.js` |
| `test/plankton.js` | the plankton field (v11.81): the crops by kind and the front's X at the doc's sites, the crops at three depths by the clock, the tint; no NaN across the world, the encoding in range, the doc's numbers (a gyre, island water, the fed flank, the lee's eddy, the lagoon green, the flank gold, no bloom at the vent), the vertical, the ring on a side radial and broken on the axis and moving in at neaps, the maps against the field, the GLSL from the tables, the storm's pulse bounded | `node test/plankton.js` |
| `test/combat.js` | holds form and kill, ropes never NaN, the player held, bled, pinned and killed, the grab, the bite, the sting, the paralysis, the blood trail, the miss rule, the poison, a tail torn off and the stump growing back; a table of every hunter of the player and its outcome; the matrix (v11.54): every hunter at contact behind each prey — the covering under the hold, the edge's verdict, the gape, the jaws' distance | `node test/combat.js` |
| `test/pool.js` | the flora pools (v11.52): blocks contiguous, counts summing, no NaN, a cell's block identical alone, first or last, the others untouched by a removal, the card species per cell, growth without loss | `node test/pool.js` |
| `test/registry.js` | the creator's registry (v11.70): every clade × core × part kind × style the lab offers, in the dev lab and the creator, through the real panel, the roster's panels, every species onto every other core; the registry read directly; fails on an offer that does not compile, a control with no name, value or range, two controls with one name, a style offered outside its declaration, a style declared for two clades (v11.70.1: a style is one clade's), a piece with no controls | `node test/registry.js`; `ALL=1 …`; `SRC=path …` |
| `test/player.js` | the player as a spec (v11.68): the three presets' numbers against `derive` (v11.71: no species ships with a lock, every `DEFS` kind on derive's top, turn and accel, the ceiling's shape), a non-preset spec on derive's, the spec through the save and a version 1 record as its preset; the line (v11.69): lay, the cooldown, a death with only a clutch (the run-on to the hatch), the hatchling grown, a death with young alive, a death with none (the slot ended), an unloaded brood's losses, the line through the save; the editor at conception (v11.72): declined, edited within the budget, refused over it, the child on its own derived numbers; the stomach (v11.73): fed by a gulp, a kill and a carcass on the ledger's numbers, starved to death with a child and with none, a clutch refused hungry and for want of reserves and one afforded, a child of twice the mass costing twice; the ringmouths' modes (v11.74): the mode off the body, the soft-arm spawning once and not twice, brooding (not fed, guarding and straying, wasting on the calculator's numbers and rebuilt gaunt), killed brooding, dead at the hatch and a hatchling at the clutch, dead of age unspawned with the save over; the coilshell laying again and again; the stem's cap on the lobes; any species as the player (v11.75): the abilities off the parts, the founder's list, a founder of each clade booting and swimming, its young on its row; the hingeshells' line (v11.76): the den, guard and stray, the moult on the clock — soft, skin, prey, the shed, hardened — killed soft with and without a child, growth through the moults | `node test/player.js`, `TIER=low …` |
| `test/census.js` | the ecology on paper: capacities, rates, the model for N days; fails if a kind collapses under a fifth | `node test/census.js 120` (`--test` runs 40) |
| `test/live.js` | the ecology where the player is: four game days of clutches laid and hatched with cells loaded, then a table of every hunter's hunger against the distance to its nearest meal | `node test/live.js`, `TIER=low …` |
| `test/smoke.js` | boots, walks the bestiary and the lab, swims all three clades and a spec that is no preset (v11.68) headlessly; fails on any runtime error | `node test/smoke.js`, `TIER=low …` |
| `test/preview.js` | renders creature builders to `test/preview/<id>.png` with real geometry (`test/geo.js`); not in `--test` | `node test/preview.js sickle trap`; `FLORA=1 … reed`; `SPEC=f.json …` |
| `test/map.js` | the world as a map (v11.59): depth bands, hillshade, contours, the old square, the clamp, the regions, the landmarks, the sill, planned islands (`PLAN`) to `test/preview/map.png`; areas printed; not in `--test` | `node test/map.js`; `SPAN=4400 …`; `SPAN=50000 CX=-6000 CZ=4000 PLAN="x,z,landR,footR" …` |
| `test/caustic.js` | the baked caustic (`CAU_RINGS`, scene.js) as a picture: `1/|det J|` through the line step at a few depths to `test/preview/caustic_<d>m.png`, with the lines' coverage; not in `--test` | `node test/caustic.js`; `DEP=5 CT=2.5 …` |
| `test/spectro.js` | the sound bench's wavs (`test/render/`, written by `#bench`) as spectrograms and a table of numbers; not in `--test` | `node test/spectro.js`; `node test/spectro.js shot_` |
| `test/ident.js` | compiled specs against old hand builders; skipped without `OLD=path` | `OLD=… node test/ident.js` |

Env vars: `TIER` (`low`), `PICK` (menu pick for smoke), `T0`, `OLD`, for preview `POSE TILE T SPD PALV COATS NORIG SPEC FLORA DEPTH PIX` (`PIX=1`: the body in texels with its coat's pattern, v11.41), for caustic `DEP CT CS SPAN W`.

## Delivering a change

1. Edit `src/*.js`. A new file goes into `src/order.txt` too. Content edits usually touch only `creatures_defs.js` (stats, spawn
   table, envelopes) and `flora.js` (species, densities, envelopes). A new creature is a **spec** in `creatures_spec.js` — make it in
   the lab (`#lab`), export, paste the `PAL`/`DEFS`/`ROSTER`/`SPECS` lines, hand-write its `SPAWN` envelope; if the kit lacks a part,
   add one to `PARTS` — its styles in `reg` with their clades (and `cores`, `params`), every parameter with its `label`, bands and default on its line (`test/registry.js` fails otherwise). There are no hand builders since v11.25. A new plant is a `species()` in flora.js from grow.js's bauplans.
2. `node build.js --test` green on both tiers.
3. **Look at it.** Start `node serve.js` (or the `tethys` launch config), open `dev.html` in the app's browser, play to the changed
   thing, screenshot it. The pane's loop only ticks while it is visible, and a hidden pane reports a 0×0 viewport, which NaNs the menu
   layout — keep it visible, or drive the loop by hand from the console: stub `requestAnimationFrame`, hold `player.pos`, call `loop(last+16.7)` per frame, and post `renderer.domElement.toDataURL()` to `/_bench/<name>.png` (serve.js writes `test/render/<name>.png`); the horizon audit of 14 Sep (WATER.md Part 3) was looked at that way. For a creature also `node test/preview.js <id>` and look at the PNG. "Unseen" in the CHANGELOG is
   reserved for what genuinely could not be looked at (sound has no output here; the GPU cost is the person's 4060 at 1600×900).
4. `CHANGELOG.md` (oldest first): a `## vX.Y — title (date)` entry — what changed and why, the knobs by name, what was seen, and an
   **"Unseen, ask in this order"** list for the rest. Patch versions (`vX.Y.Z`) for fixes after the person looks. Update the
   `DESIGN.md` section whose numbers moved; a design doc gets a status note at its head when a pass builds or strikes it.
5. `HANDOFF.md` describes current state only: a short paragraph for the new version at the top, and remove entries that are no
   longer true rather than appending. Keep that file short; the history is `CHANGELOG.md`.
6. Commit each version on `main`, one commit per version, the message the CHANGELOG header. Identity is `WB <willbuzbee@gmail.com>`
   (`user.name` in the repo's local config; never any other name). `origin` is a **private** GitHub mirror
   (`william-are-buzbee/Tethys`, added 19 Sep 2026 so the person can work from elsewhere and so the history is not on one disk):
   the person pushes, from their own shell. No pushing, rebasing or hard resets from here (`.claude/settings.json`).

The sandbox delivery (when there is no PC): copy `tethys.html` to `/mnt/user-data/outputs/`, zip the folder as `tethys-src.zip`.

## Layout

```
shell.html         the HTML/CSS shell; <!--SCRIPTS--> is where the build puts the scripts
src/order.txt      build order (one shared scope, so only load-time statements care)
src/*.js           the game, below
build.js build.py  the build (Node / Python, in step)
serve.js           static server for looking at the game, and the sink the sound bench posts its wavs to; not part of the game
test/              headless tests, the THREE stub, real geometry for previews, the png writer and font, vendored acorn
*.md IDEAS.txt     the design docs and the person's backlog, below
.claude/           settings (deny/ask rules) and the launch config
```

| src file | owns |
|---|---|
| util.js | math helpers, `mulberry` seeded rng, value noise |
| world.js | the island as an analytic function: `sample(x,z)` → height and the nine condition fields `FI`; `envW` envelopes; tide and clock; sun, moon, weather; waves `waveH`; water colour; the retention field `leeW` and the plankton (v11.81: `plank`, `bloomC`, `bloomTint`, `PLK`, `PIGK`, `BLOOM_GLSL`, `plankAt`); the year (v11.83: `YEAR_D`, `TILT`, `yearPhase`, `sunDec`, `seasonAt`); landmarks `LM` |
| physics.js | contact: the per-cell collider hash, body capsules, verlet chains (arms, tails, tentacles) and rigs, body-to-body push, the disturbance lists |
| scene.js | quality tier `Q`, renderer, camera, lights, the fog (three's replaced), shadow maps, every shared material |
| parts.js | geometry kit `part`/`merge`, arm rings as rigs and their poses, `swimClock`, LOD baking |
| grow.js | flora grammar: eight bauplans, `pigment(h,line)`, `flowYaw`, `species()` (three variants in one geometry) |
| creatures_builders.js | palettes `PAL` and the kit the specs compile from (ring mouths, coil shells, fins, tails, valves, legs…) |
| creatures_spec.js | the spec compiler: cores, `PARTS` (the registry, v11.70: a style's clades, cores and params in `reg`; a parameter's label, unit, bands and default on one line; `stylesFor`, `paramOf`), `compile`, `validate`, `derive` (the calculator), `coatFor`, `SPECS` for every species, JSON/hash/export |
| flora.js | the species, kept geometries, rock kits and big structures with collision lumps, `FLORA` with densities and envelopes |
| reef.js | what remains of the reef pass: two giant colony shapes appended to `FLORA` |
| creatures_defs.js | `DEFS` (roles, behaviour; `defPhysics`: speed, accel and turn off the build, v11.71), `SPAWN` (capacity per cell and envelope), `ROSTER` |
| audio.js | procedural WebAudio: the 3D space read from the world, the beds, the body's sounds, one-shots |
| creatures_ai.js | registry, spawning, LOD, behaviours by role (v11.84: `swarm` — `updateSwarm`, `swarmDepth`, the day's rise), hunger, carcasses, eggs, per-frame update |
| chunks.js | cell streaming: height grid, terrain mesh, flora placement (`settleOn`, `clearOf`), solids, spawns from the ledger, culling |
| ecology.js | the population as a ledger `POP`: capacity from envelopes, the off-screen model, births owed to loaded cells |
| far.js | beyond the cells: coarse far terrain in regions streamed round the player (v11.58), the apron past the edge, every big structure, impostor cards, the water/floor maps for the whole world (the plankton's crops and the front's X in their free channels, `wmBloom`, `bloomAt`, `bloomTick`, v11.81) |
| player.js | the player as a spec (`playerClade`, v11.68; v11.75: any species of the roster — no hand numbers: the arm `CAM_BODY`, the jet's kick and the sprint derive's, venom the founder's `DEFS` row) and `CLADES` (the three roster players), abilities from parts (`ABILITIES`: ink, stun, withdraw, ram, shut), movement in water / air / on land, camera, damage, ink, splashes; the stomach (v11.73: `player.hunger` on the ledger's model through creatures_ai.js `hungerTick`/`kill`/`eatAt` by `eaterK`, `EAT`, the readout's `hungerLine`) |
| atmosphere.js | the sea surface, the sky, rain, haze, light shafts, marine snow (v11.84: the swarm block — the last `SN_SW` points ride the nearest swarms, `swAssign`/`swBlock`), fog and light by medium, HUD, compass |
| combat.js | holds (a rope between a grip and a hit capsule), the struggle, the states (v11.55: the gape, the pin, the placed act by `EDGE`, wounds that bleed and slow, venom, autotomy; v11.56: the blood trail, the strike's miss rule, the poison by feeding; v11.57: the wound as a spec edit — a part torn off, the body re-derived, the stump and the regrowth), blood, the player's grab and bite |
| fx.js | the body's effects (v11.53, POLISH pass B): the debris points (silt, bubbles, scraps) and their emitters, `bodyPose` (squash and stretch, banking, the stun), `hitFx` (the flinch, the flush, the debris at a wound) |
| effects.js | the effects list (`e`): cosmetic systems switched live, saved in `localStorage['tethys.fx']` |
| worldmap.js | the world map (`n`, v11.63): a dev tool beside `tp()` — the world from `sample()` with the maps' bands and contours, the islands' rings, the loaded cells, the player; wheel zooms and re-samples, drag pans, a click teleports |
| horizon.js | the horizon tier (v11.64): above the water a second pass before the main one — the sky dome, a sea disc to 250 km (with the water column the surface shows through, v11.65), one mesh of every island's land from `sample()` at `Q.hz` metres, the planet's curvature in the vertex shader, the world's air fog without the cut; `renderFrame()` is the frame's render |
| save.js | the save files (v11.47): slots in IndexedDB (localStorage, memory as fallbacks) with a .json export/import; the profile (what has been seen, the creator's key and its saved creatures); `startNew`/`startFrom`/`worldClear`; `slotDeath` (v11.55: the animal's death written to the slot; v11.69: you continue as the nearest living child, or the save is over) |
| line.js | the line across generations (v11.69, LINEAGE.md §13.1–2): the lives on the slot and their tracks, the clutch by the body's mode (v11.74: `BREED`, `breedOf` — the soft ringmouth once, then the brood: `feeds`, `wasteOf`, `broodGuarded`, `die('spent')` at the hatch, `die('old')` at `life`; the shelled and the slowbloods again and again; v11.76: the hingeshells at a den, `denAt`, guarded, and the moult on the player — `MOULT_P`, `moultN`, `moultAt`, `lineScale`, `lineSoft`, `softBuild`, `moultTick`; `x`, `playerLay`), the young as a kind per spec on the founder's row (`lineKind`, v11.75), the editor at conception and its budget (v11.72, §13.4: `conceiveOpen`, `conceivePrice`, `BUDGET`, `conceiveClose`; the parent out of the world meanwhile, v11.72.1: player.js `playerAway`, `playerGone()`; the clutch paid from the stomach, v11.73: `LINE.egg`, `clutchCost`, `clutchHunger`), the broods as records that survive an unload (`BREED.survive`), the young as a kind per spec (`lineKind`), the handover at death (`lineNext`, `lineContinue`), the sparkle (`starPath`, `updateSpark`) |
| menu.js zoo.js lab.js | the menu (new game — the founder's list since v11.75: the roster's players and what the profile has seen, `founderList`, `founderClade`; continue, options, the creator; esc from play); the bestiary (`#zoo`, `z`); the creature lab (`#lab`, `l`; `p` places the spec in the world; as the creator it offers only what has been seen) |
| bench.js | the sound bench (`#bench`, `b`): every sound rendered to a wav and posted to serve.js for `test/spectro.js` to draw |
| input.js main.js | pointer lock, keys, touch; boot, the frame loop, the debug readout |

Docs, most upstream first. When a doc's Open list says a choice is the person's, it is: ask, don't guess.

| doc | read it when |
|---|---|
| `PLANET.md` | anything about the planet, the geology, the clades' rules, the roster. When the game conflicts with it the game changes |
| `TAXA.md` | the descent of the sessile life: greens, floaters, reds; colonisation order (built v11.15) |
| `FLORA.md` | the sessile life's grammar and roster by depth band (TAXA wins where they differ) |
| `REEF.md` | the reef as a landform (v11.20; the coat struck v11.22 — the head note says what stands) |
| `CLADES.md` | the three clade signatures as built (v11.8–11.9.1) and the raptor family |
| `DRIFTERS.md` | the fourth clade: bells, buttons, sailers (v11.16) |
| `CREATOR.md` | the spec-compiled body plans and the lab (v11.10–11.25); the person's decisions at its end; "The size ceiling" (20 Sep 2026) is what a monstrous animal costs — the two knobs built, the rest ranked |
| `ARCHIPELAGO.md` | the chain (15 Sep 2026): the islands as records (built v11.61), the giant's record and its land term (built v11.62), the horizon tier (built v11.64), the world grown to 240 cells (built v11.65), the person's answers — read before building any second island |
| `SEAFLOOR.md` | the chain's diversity and its underwater ground (15 Sep 2026, designed, not built): what can differ per island and why, the formations agreed by the person, ranked; §5 the surface (pumice, wind rows, carcasses, the neuston set); §6 the range term, open |
| `PLANKTON.md` | the water's own life (22 Sep 2026; passes 1–4 built v11.81–84, the rest designed): the plankton field, its patches (windrows, the tidal front ring, the lee), the day's vertical migration, the year, the three pigment kinds as the water's colour, the bioluminescent bloom, the snow refined, the swarm tier, filter feeding, and the canopy ghost to strip; §15 the person's answers |
| `PIXEL.md` | the de-res (14 Sep 2026, designed, not built): every surface in world/body-fixed texels at the pixel light's grain, one switch on `e`; the person's answers at its end (14 Sep) — ready to build |
| `POLISH.md` | the low-budget effects survey: pass A built (v11.13, v11.23), pass B (v11.53); pass C, the night, is next |
| `COMBAT.md` | injury as states, not numbers (15 Sep 2026): gape, hold, edge against covering; wounds as spec edits; the per-clade kill, escape and chemistry; pass 1 built v11.54 (the edge and the covering), pass 2 v11.55 (the states, no hit points), pass 4 v11.56 (the trail, the miss, the poison), pass 3 v11.57 (the wound as a spec edit) — built in full; §7 the matrix's findings; §9 the person's answers |
| `AUDIO.md` | the sound's design (v11.14); every number was chosen blind |
| `DESIGN.md` | **the reference**: one section per system with the owning file, the numbers, the knobs and the reasons |
| `analysis_believability.md` | the 12 Sep analysis: how the world, flora, clades and spawning work, and where the believability is strong and thin |
| `DIRECTION.md` | where the project is going (12 Sep): the archipelago, oxygen, the silled basin, the hingeshells, and the game's loop ("the body is the tech"); its Open list is the person's. Its "not a lineage" line is struck (20 Sep) |
| `LINEAGE.md` | the line across generations (20 Sep 2026, designed, not built): the brood and the switch at the hatch, the three clade modes, the mutation budget as materials, the sparkle that marks the magic, the player's variants as ledger entries, the shrine after the run; §11 open, §12 the person's answers |
| `CHANGELOG.md` | judging risk: what each version changed, what the person saw and said, what was never seen |
| `HANDOFF.md` | current state only, newest first, with what to ask the person to look at; entries no longer true are removed, not kept |
| `IDEAS.txt` | the person's own backlog |

`AUDIT.md` (the 9 Sep performance audit) and `Tethys Ideas/Ideas.txt` are cited by several docs and exist nowhere on this PC.

## Architecture

- **The world is a function.** `sample(x,z,out)` in world.js is the single source of truth: the ground and the nine condition
  fields (`FI`: sub, flow, expo, nut, turb, young, heat, shel, rel), analytic geology plus fbm. No biome ids anywhere. Since v11.61 the
  islands are records (`ISLANDS`, `islandH` in the island's frame) summed by smooth max over the basement (`BASIN`, `SILL`); `ISLANDS[0]` is
  ours and must stay bit-identical — check any change to `islandH` or `sample` against the last commit's world.js over the old square. Species and
  structures carry `env` envelopes; `envW(env,h,slope,f)` is 0..1. Landmarks: the pit and the chimney are fixed by the geology, the
  rest searched on the terrain at load (`findSpot`, seed 4242, fixed sequence — add new ones at the end).
- **Cells.** 240×240 cells of 215 m (`CELL`, `NCELL`, the world ±`HALF` 25.8 km; v11.65 — the island's own square is the middle 16, the giant whole in the south-west, the rest the basin floor at −1100, the sill across the north-east and the ocean's flank down to the plate beyond it; 120 from v11.58). A loaded cell is a 49×49 grid, a terrain mesh, its flora as a
  block in each species' pool (v11.52, chunks.js `POOLS`: one `InstancedMesh` per species across every loaded cell; the card species, the
  rafts and the glow clouds keep a mesh per cell), its colliders, its creatures. `genChunk` is a generator run under a frame budget (`Q.budgetMs`,
  the streaming budget is what the last frame left of `Q.target`), nearest first within `LOAD_R`. Inside a cell: terrain → the
  structures' collision → cliffs → rock → the other flora (each asks `clearOf` against the hash) → landmarks → creatures.
- **Near and far.** far.js builds every big structure, coarse terrain in 4×4-cell regions, the apron to 2000 past the edge, impostor
  cards and the water/floor maps once and keeps them. Cells draw fine terrain and small flora on top; far vertices under loaded
  cells are pushed down; impostors switch off while a cell is loaded within `FLORA_FAR` (450). Past the far plane, above the water, the horizon tier (horizon.js, v11.64) draws every island's land from one coarse mesh and the sea to 250 km in a pass under the main one; under water the far plane is still the end. `bigsFor(i,j)` is cached so near
  collision and far drawing agree. Structures and per-cell flora sit on the ground by one rule, `settleOn` (chunks.js).
- **Flora.** `FLORA` entries with per-cell tries, envelopes, placement flags; a per-entry rng so order moves nothing; photosynthetic
  entries tinted by `pigment(h,line)`; `species()` packs three variants into one geometry chosen per instance in the shader.
- **Creatures.** `SPECS[id]` → `compile` (a core builds the frame, parts merge into the body or become rigs; `derive` computes
  mass, drag, thrust, speed, turn, hp from the build) → `DEFS[kind]` (role, prey, reach, dmg, strike, and the behaviour by hand — `pace`, `cruiseF`; since v11.71 speed, accel and turn are never typed: `defPhysics` reads them off the build, as the player's are) and `SPAWN` (capacity
  per cell and envelope) → the ledger → `placeKind` / `spawn` (geometry shared per kind in `KIND_GEO`; rigs are the creature's own)
  → `updateCreatures` dispatching on role (boid, trap, watch, hunter, graze, wander, coil, ambush, drift, sail, swarm), then contact. A `swarm` (v11.84) is a kind with no spec, no body and no capsule (`swarmBuild`, `ghost`), drawn by the snow's swarm block; its `SPAWN` row's `crop` flag makes its capacity the plankton's (ecology.js `ecoCap` × `cropK`).
- **The ledger is the truth about who lives where** (ecology.js): `POP.n[entry][cell]`; capacity from mean `envW`; unloaded cells
  run the model (births by allometry, saturating predation, starvation, drift) every `ECO_STEP`; a loaded cell spawns from it and
  writes back. A kill goes through `kill()`, a creature leaving mid-life through `removeCreature`, a new kind of spawn through
  `placeKind` with an `ent`; a creature spawned outside the ledger (`ent` −1: the lab, the fleets) is never counted or reborn.
  `SPAWN.n` is capacity, not a count; the equilibrium (`node test/census.js 120`) is the number in the world. Rates per game day. The tables are
  dense over 57,600 cells but every loop walks `POP.cells[ei]` (the cells an entry can live in; `ecoMark` adds, `ecoIndexAll` rebuilds after a
  load, v11.65) — a new loop over the ledger goes over the lists, never `ECO_CELLS`.
- **Combat** (combat.js): a fight is a hold — a rope between a grip (jaws, arms, claws, read off the spec by `compile`) and the
  held body's hit capsule; struggle by mass; bites on the hold's clock; wounds bleed; blood a pooled cloud in the clade's colour.
  Drifters and the coil's withdraw bypass holds by design. Since v11.54 a body also has an edge and a covering per capsule (compile,
  COMBAT.md §2) and a hold knows what it is on (`h.edge`, `h.cover`, `h.thru`, `EDGE`). **There are no hit points (v11.55):** a hold kept past
  its pin time (`PIN`) is a pin and the placed act follows from the verdict (swallowed by the gape, opened, skewered, crushed, the nerve cord)
  or the hunter lets go; a bite that is not the act is a wound that bleeds for the clade's `BLEED_T` and slows the body; venom (`DEFS.venom`:
  the lurker's paralysis, the spined slowbloods' sting) and autotomy (a ringmouth drops the held arm) ride the same hold. `DEFS.hp` is only the
  forage (≤1) / immortal (≥1e8) flag. The player's death ends the slot's animal (save.js `slotDeath`); since v11.69 you continue as the nearest living child of that life, an unhatched clutch running the world on to its hatch, and with none the save is over (line.js). A hunter commits its bite 0.25 s out
  with its mouth open and misses prey that dodges across the line (`MISS`); hungry hunters take a bleeding body within `SMELL_R` as their
  chase; hingeshells fed below the chemocline or in the vents' heat are poison to eat (`POISON`, `DEFS.immune`). A wound edits a live copy of
  the body's spec and the calculator reruns (`speedK`, `turnK`); a hold on a part's own capsule (`hitOwn`, the slowbloods' tails) takes the
  part instead of the life (`losePart`); a dropped arm keeps a stump and grows back (`RIG_STUMP`, `c.grow`).
- **The frame** (main.js `loop`): clock and tide → streaming (`manageChunks`, `manageFar`) → menu/zoo/lab → `updatePlayer`
  (move, rock, floor) → `updateCreatures` (creatures move; bodies push apart with the player among them; the player out of arms;
  arms simulated) → `finishPlayer` (pose, own arms, camera) → eggs, ecology tick → pads, disturbers, snow → wounds, ink, splashes,
  blood → atmosphere, surface → cull, lights, shadows, audio → HUD, effects → render. **Moving a piece breaks contact silently.**
  Creatures past 150 m step every other frame; `lodNear`/`lodFar` swap parts for baked meshes.
- **Quality tier** `Q` (scene.js) is numbers only, never code paths; `#low`/`#high` force it; low is automatic on small touch screens.
- **Sound** (audio.js): one `AudioContext`; a space read from the geometry round the listener four times a second; beds from the
  world's numbers; an eight-voice pool for placed emitters; the readout tunes it live. `M` mutes.

## Conventions

- **Formatting: dense.** One statement per line, no spaces after `,` or `:`, `if(x)y;`, long lines are normal, semicolons always.
  Four files (`creatures_spec.js`, `lab.js`, `flora.js`, `reef.js`) were reformatted multi-line in v11.12; new code, even there,
  is dense. Never reformat existing code.
- **Names.** `UPPER_SNAKE` constants, knob tables and uniform arrays; `camelCase` functions; short locals (`c` creature, `d` def,
  `F` frame, `st` state, `sub` submerged fraction). Builders end in `B`, geometries in `Geo`, generators in `Gen` (`function*`,
  drained with `yield*`), GLSL strings in `_GLSL`, uniform objects in `U`. Scratch vectors `T1..T4`, `_m`, `_q` — nothing allocates
  per frame in a hot loop; `len3` not `Math.hypot`.
- **Comments.** First line `// file.js — what it owns`; sections `// ---------- name ----------`. Prose explains *why*, cites the doc
  (`PLANET`, `DESIGN Contact`, `REEF.md`), the version (`v11.27`) and what the person saw, with the date. The user is "the person".
- **Knobs** are top-level `const NAME=value; // meaning, units` or a table with a comment per key (`GRIP`, `ECO`, `AU_K`,
  `DERIVE_K`, `Q`). The readout's tuners mutate some live; bake a tuned value in by name.
- **Randomness.** `mulberry(seed)` wherever the world must persist (cells by index, species by `hashStr(id)`, landmarks 4242,
  cairns 4343, noise 1337). `Math.random` only for animation and particles.
- **Units and frames.** 1 unit = 1 m, `GRAV` 9.8, y up, sea level 0, east +x, north −z, angles in radians from +x toward +z.
  **All creatures face +z.** A predator's `reach` must exceed the contact distance of its and its prey's hit capsules or it can
  never land a bite. A day is 30 game hours in 40 real minutes; rates are per game day.
- **An animation's beat is a `swimClock`, never `t*f(spd)`** — `t` is the session clock and `t*f` spins on every change of speed.
- **Determinism, one scope, no libraries.** The bundle is one IIFE; any file may use any name from any file; `grep -n name src/*.js`
  finds uses — and a top-level name must be unique across the files: a second declaration replaces the first without a word (lint fails on it since v11.53). No `OrbitControls`, no `BufferGeometryUtils`; parts.js has its own merge.
- **Docs carry status.** "built, unseen" means reasoned without a look; a doc's head note says what a later pass struck. Struck
  features are removed from the game; a kit may stay for reference, marked so.
- **Stale statements: fix when touched.** A comment, doc line or dead branch you meet while editing gets corrected in the same
  change; nothing else is cleaned speculatively. Known stale spots: README's Node path and "a lily pad takes your weight" (pads went
  with the raft, v11.16.1) and its doc table (missing TAXA, DRIFTERS, AUDIO); TAXA.md's header says nothing is built (CREATOR.md's was fixed v11.70);
  CHANGELOG has two v11.18.1 entries; DESIGN has two Landmarks sections and opens The medium with `GRAV=14`; "biome" wording in
  far.js and scene.js; the hand-builder branches in `creatures_defs.js` and zoo.js; reef `fill`/`drop`/`clear` handling with no
  entry setting them. **Left alive on purpose** (v11.33, and each says so where it lives): `GLOW` and the `f.glow` branches, for
  when bioluminescence returns as events (PLANET Hooks); the `pads` path through grow.js, chunks.js and physics.js, which costs an
  empty loop a frame; `y:'mid'`; and `DEFS.glim`, `SPECS.glim` and `PAL.glim` — the darter's pale variant is a species, kept (the person, 15 Sep 2026), not
  drift. Fixed in v11.32-11.33: the chemocline literal (`CHEMO`), the daylight and canopy curves, the two masses, `ROSTER.new` on
  the fifteen species that spawn, lint.js's acorn line and `creatures_spec.js`'s `test/spec.js`.

## Things that bite

- Contact is physics.js: colliders in a per-cell hash (`addSolid/addCapsule/addPad/addEllipsoid/addRock`, `solidPush`, `bodyPush`),
  body capsules (`worldShapes/resolveBodies`), chains (`makeChain/simChain`, rigs `makeRig/rigSkin/stepRigs`, posed by
  `ringPose/tailPose` in parts.js). Every species geometry gets a per-cell clone for its instance attributes (`aVar`, `aDip`).
- The sway shader reads `DIST_A/DIST_B` as `vec4[12]` uniform arrays — r128's `flatten()` passes a typed array through only if
  its first element is a number, so never write NaN into them. Chain buffers hold ≤39 points and ≤160 segments per rig.
- Every tinted material's fragment carries the light block (scene.js `LIGHT_GLSL` in `addTint`): caustics and the bodies' shadows,
  reading `vFogPos`, `uSunW`, `uCastA/B` (typed arrays, never NaN). `LIGHT_FX` false strips it if the GLSL fails (a black or
  magenta world at boot). `thinLight` regexes r128's Lambert chunk and warns rather than fails. `updateShadow` and `updateShadowS` run after `assignLights`.
- The fog is not three's: scene.js rewrites the fog chunks and shares uniforms through `THREE.ShaderLib`, pinned to r128's
  `cloneUniforms`. The camera goes in by hand (`uFogC`/`uFogR`); three's `cameraPosition` is (0,0,0) on Lambert/Basic/Points in
  r128 — never read it in a shared chunk. Fog is per material: `MAT`/sway/`MATFAR` are "small" (fade sooner), `MATBIG`/
  `TERRAIN_MAT`/`GLOW` "big" (keep the far ghost) — a structure built with `MAT` vanishes at 300 units. `WAVE_GLSL` is generated
  from `WAVES`; never write the wave sum twice.
- Past ±HALF the edge regions' apron (`apronGen`) carries the far terrain to 2000 beyond, so a mesh that ends at the edge shows
  against nothing. The veil reads `floorMap` beside `waterMap` (1440×1440, filled together in `wmFill`/`wmBlur`): a new map channel goes there — and
  only there: the tinted fragment shaders are at WebGL's 16 texture units (v11.81: a third map failed every material's compile and the world was the veil
  alone). The maps' free channels are used up since v11.81 (floor b, a: the crops; water a: the front's X).
- The far layer draws every structure from `bigsFor`; cells only register collision. Anything `big` a cell draws itself pops and
  doubles up. Change the ground rule in `settleOn`, nowhere else.
- Since v11.12 the flora has a draw distance `FLORA_FAR`: a new small species wants a cut material; a new big one wants a card in
  `FAR_IMP` and no cut. The disturbance loop runs only within `DIST_R` of the camera.
- A cell's small flora lives in its species' pool (chunks.js `POOLS`), not in `ch.meshes`/`ch.flora`: a block per cell, the tail moved down on
  unload, the written range uploaded (`updateRange`). Placement reads the cell's own hash only (`solidPush(…, own)`), which `placeBigSolids`
  completes with every neighbour's reaching structure — `test/pool.js` fails if a cell's blocks differ by arrival order.
- No hit capsule ends past the frame's nose: `compile` clamps every capsule's nose end at `F.nose − r` (v11.54). A hand-written `hit` list
  that reaches past the mouth is cut back silently; a spec's own list puts the shell's capsule first (the covering reads it so).
- A lost part is hidden by its meshes (`r.nodes`, compile) and struck from the live spec; the kind's shared far bake still has it, so it shows
  again past `lodNear`. A spec's own `hit` list marks a part's capsule with `own` (the tails) or the covering reads the core's.
- Never mutate a spawned creature's body geometry (it is shared per kind in `KIND_GEO`) — build a variant. `disposeCreature`
  skips shared geometry.
- The cell and region generators (`buildTerrain`, `placeFloraType`, `makeSchool`, `bigsGen`, `impostorsGen`) yield inside their
  big steps; a step that runs long shows as a frame over `Q.target`.
- Shadows are read by hand in every tinted fragment (scene.js `updateShadow`, `updateShadowS`), never through `receiveShadow`.
  The static map re-renders only when the sun turns, the camera drifts 20 m, a cell loads or a switch flips.
- The stub's `setTimeout` runs immediately; `location.hash` comes from `TIER`.
- In the sandbox a second writer once edited `src/` mid-session; build from a clean copy and say so.
- Three clears the colour buffer to `scene.background` whatever `renderer.autoClear` says (r128's WebGLBackground forces it): a pass drawn before the main one is wiped unless the main scene's background is nulled for that frame (horizon.js `renderFrame`). And near-plane clipping is by view depth, not distance: a near plane at the far plane cuts a dome and anything off-axis to a 32° cone.
- The mist's closed-form integral (scene.js `mistL`) must keep both exponentials bounded: a ray dropping 90 m or more to the water made `exp(-k)` overflow on the spray's 4 m layer and the fragment black (v11.65) — the world has 900 m of land now.
- The air's fog (`AIR`) is a trade-wind day since v11.64 and the far cut applies only under water; the horizon pass draws what lies past the far plane, so a change to the far plane, the dome or the surface's far edge has a second consumer.

## Dev tools in the game

- `map.html` (v11.60): the world as an interactive map with planned islands you drag, resize and export (the `PLAN` string for `test/map.js`, or JSON); loads src/util.js and src/world.js as they are, so it is never stale; `/map.html` on serve.js or from the file. Not part of the game.
- The world map (v11.63): `n` in play or the menu draws the whole world from `sample()` over the game (worldmap.js: the bands, hillshade and contours of `test/map.js`, the island records' land and reach rings, the clamp, the old square, the loaded cells, the landmarks, the player and its facing; the cursor's x, z and ground under the picture); wheel zooms about the cursor and re-samples the window once it rests, drag pans, a click goes there by `tp()` and closes; esc or `n` closes. `tp()` clamps its point to the world and says so. `skip(days)` (v11.76) moves the world clock on by game days in play, for a moult or a hatch without the wait (a fraction of a day moves the hour too: `skip(27.75)` is 22.5 h later in the day). The year (v11.83): boot is phase 0.6 of `YEAR_D` 185; `skip(28)` is the windy peak, `skip(120)` the still; the readout's clock line shows the phase and the season.
- URL: `#low` `#high` (tier), `#zoo` (bestiary), `#lab` or `#lab=<base64 spec>` (the lab), `#bench` (the sound bench; it arms the first click, since an audio context needs a gesture), `#creator` (grants the menu's creator word without opening the lab first).
- The menu (v11.47): `new game` starts the finback in a new slot; `continue` lists the slots (the store is IndexedDB — clear it from the browser's site data to start clean; the tests use memory); esc in play with the pointer free (esc twice when locked) saves and returns to the menu. Death (v11.55) writes the cause to the slot; since v11.69 you continue as your nearest living child (a clutch you laid with `x` counts), and a death with none ends the slot: the menu says so and `continue` refuses it.
- The effects list (`e`): `pixel light` (v11.38) is the caustic and the shadows in 30 cm blocks with hard edges, or smooth (the default); `texels` (v11.40–41, PIXEL.md) is every surface in texels with a pattern per cell — separate rows since v11.41.1 so either can be tried alone; `test/caustic.js` draws either light (`PIX=0`). A slider under a switch is a row in `FX_SLIDERS` and a number in `FX_DEF` (v11.38.1: caustics' `brightness`).
- Keys: `n` the world map; `z` bestiary (left/right step, space strike, s cruise, drag turn, wheel zoom); `l` lab, `p` place the spec; `e` the effects
  list; `b` the sound bench (1 one-shots, 2 noise and irs, 3 the beds, 4 a live capture; `node serve.js` must be running); `f` first person; `x` lay a clutch (any body but a drifter's, grown, on the floor, v11.69/v11.74/v11.76 — a soft ringmouth once, then it broods; a hingeshell at a den; since v11.72 it opens the editor at conception — the creator on your own spec, a budget, `l` lays); `r` or right mouse grab, click bite; `Q` the body's ability (v11.75: its parts' — ink, stun, withdraw, ram, shut held); `M` mute.
- Readout: backquote (also `'` or F3): fps, frame ms, draws, tris, cells, far regions, creatures, physics ms, render ms (when it
  runs away from the rest, the GPU is the limit), heap, medium, tide, hour, sun, moon, light, cloud, rain; the fog, audio and
  ecology lines. With it open the keys tune (`FOG_TUNE`: 1-2 … o-p t-y u-i; `AU_TUNE`: g-h j-k v-b); Backspace resets.
- Measure the weed forest on the shelf at (330, 0): the heaviest place; the last pass (v11.12) had it at 3.2 ms on the 4060.

## The person

- Concise replies, dry wit, no praise, no constant agreement. Disagree when reasonable. Be plain about what you can and cannot
  do: from here you can build, test, serve, look and screenshot; you cannot hear the sound or measure their GPU.
- Likes questions and is open to ideas. When a design choice is theirs (a doc's Open list, anything about the planet or the
  roster, what to strike), ask, don't guess. Record their answer in the doc with the date.
- Tests on desktop; phone is secondary and may sacrifice things as long as desktop is "fantastically smooth".
- Cadence: content prompts freely; a performance pass whenever the readout says frame time is creeping.
