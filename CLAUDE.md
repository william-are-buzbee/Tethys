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
| `test/audio.js` | the audio graph against the stub's fake `AudioContext` (any NaN param throws), the space at five sites, tick cost | `node test/audio.js` |
| `test/snow.js` | the marine snow mix at thirteen sites, layering invariants, tick cost | `node test/snow.js` |
| `test/combat.js` | holds form and kill, ropes never NaN, the player held/bleeds/grabs/bites; a table of every hunter's hold | `node test/combat.js` |
| `test/pool.js` | the flora pools (v11.52): blocks contiguous, counts summing, no NaN, a cell's block identical alone, first or last, the others untouched by a removal, the card species per cell, growth without loss | `node test/pool.js` |
| `test/census.js` | the ecology on paper: capacities, rates, the model for N days; fails if a kind collapses under a fifth | `node test/census.js 120` (`--test` runs 40) |
| `test/live.js` | the ecology where the player is: four game days of clutches laid and hatched with cells loaded, then a table of every hunter's hunger against the distance to its nearest meal | `node test/live.js`, `TIER=low …` |
| `test/smoke.js` | boots, walks the bestiary and the lab, swims all three clades headlessly; fails on any runtime error | `node test/smoke.js`, `TIER=low …` |
| `test/preview.js` | renders creature builders to `test/preview/<id>.png` with real geometry (`test/geo.js`); not in `--test` | `node test/preview.js sickle trap`; `FLORA=1 … reed`; `SPEC=f.json …` |
| `test/caustic.js` | the baked caustic (`CAU_RINGS`, scene.js) as a picture: `1/|det J|` through the line step at a few depths to `test/preview/caustic_<d>m.png`, with the lines' coverage; not in `--test` | `node test/caustic.js`; `DEP=5 CT=2.5 …` |
| `test/spectro.js` | the sound bench's wavs (`test/render/`, written by `#bench`) as spectrograms and a table of numbers; not in `--test` | `node test/spectro.js`; `node test/spectro.js shot_` |
| `test/ident.js` | compiled specs against old hand builders; skipped without `OLD=path` | `OLD=… node test/ident.js` |

Env vars: `TIER` (`low`), `PICK` (menu pick for smoke), `T0`, `OLD`, for preview `POSE TILE T SPD PALV COATS NORIG SPEC FLORA DEPTH PIX` (`PIX=1`: the body in texels with its coat's pattern, v11.41), for caustic `DEP CT CS SPAN W`.

## Delivering a change

1. Edit `src/*.js`. A new file goes into `src/order.txt` too. Content edits usually touch only `creatures_defs.js` (stats, spawn
   table, envelopes) and `flora.js` (species, densities, envelopes). A new creature is a **spec** in `creatures_spec.js` — make it in
   the lab (`#lab`), export, paste the `PAL`/`DEFS`/`ROSTER`/`SPECS` lines, hand-write its `SPAWN` envelope; if the kit lacks a part,
   add one to `PARTS`. There are no hand builders since v11.25. A new plant is a `species()` in flora.js from grow.js's bauplans.
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
   (`user.name` in the repo's local config; never any other name). No pushing, rebasing or hard resets from here (`.claude/settings.json`).

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
| world.js | the island as an analytic function: `sample(x,z)` → height and the nine condition fields `FI`; `envW` envelopes; tide and clock; sun, moon, weather; waves `waveH`; water colour; landmarks `LM` |
| physics.js | contact: the per-cell collider hash, body capsules, verlet chains (arms, tails, tentacles) and rigs, body-to-body push, the disturbance lists |
| scene.js | quality tier `Q`, renderer, camera, lights, the fog (three's replaced), shadow maps, every shared material |
| parts.js | geometry kit `part`/`merge`, arm rings as rigs and their poses, `swimClock`, LOD baking |
| grow.js | flora grammar: eight bauplans, `pigment(h,line)`, `flowYaw`, `species()` (three variants in one geometry) |
| creatures_builders.js | palettes `PAL` and the kit the specs compile from (ring mouths, coil shells, fins, tails, valves, legs…) |
| creatures_spec.js | the spec compiler: cores, `PARTS`, `compile`, `validate`, `derive` (the calculator), `coatFor`, `SPECS` for every species, JSON/hash/export |
| flora.js | the species, kept geometries, rock kits and big structures with collision lumps, `FLORA` with densities and envelopes |
| reef.js | what remains of the reef pass: two giant colony shapes appended to `FLORA` |
| creatures_defs.js | `DEFS` (stats, roles), `SPAWN` (capacity per cell and envelope), `ROSTER` |
| audio.js | procedural WebAudio: the 3D space read from the world, the beds, the body's sounds, one-shots |
| creatures_ai.js | registry, spawning, LOD, behaviours by role, hunger, carcasses, eggs, per-frame update |
| chunks.js | cell streaming: height grid, terrain mesh, flora placement (`settleOn`, `clearOf`), solids, spawns from the ledger, culling |
| ecology.js | the population as a ledger `POP`: capacity from envelopes, the off-screen model, births owed to loaded cells |
| far.js | the whole world at once, built once: coarse far terrain, the apron past the edge, every big structure, impostor cards, the water/floor maps |
| player.js | `CLADES`, movement in water / air / on land, camera, abilities, damage, ink, splashes |
| atmosphere.js | the sea surface, the sky, rain, haze, light shafts, marine snow, fog and light by medium, HUD, compass |
| combat.js | holds (a rope between a grip and a hit capsule), the struggle, bites, wounds that bleed, blood, the player's grab and bite |
| fx.js | the body's effects (v11.53, POLISH pass B): the debris points (silt, bubbles, scraps) and their emitters, `bodyPose` (squash and stretch, banking, the stun), `hitFx` (the flinch, the flush, the debris at a wound) |
| effects.js | the effects list (`e`): cosmetic systems switched live, saved in `localStorage['tethys.fx']` |
| save.js | the save files (v11.47): slots in IndexedDB (localStorage, memory as fallbacks) with a .json export/import; the profile (what has been seen, the creator's key and its saved creatures); `startNew`/`startFrom`/`worldClear` |
| menu.js zoo.js lab.js | the menu (new game, continue, options, the creator; esc from play); the bestiary (`#zoo`, `z`); the creature lab (`#lab`, `l`; `p` places the spec in the world; as the creator it offers only what has been seen) |
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
| `CREATOR.md` | the spec-compiled body plans and the lab (v11.10–11.25); the person's decisions at its end |
| `PIXEL.md` | the de-res (14 Sep 2026, designed, not built): every surface in world/body-fixed texels at the pixel light's grain, one switch on `e`; the person's answers at its end (14 Sep) — ready to build |
| `POLISH.md` | the low-budget effects survey: pass A built (v11.13, v11.23), pass B (v11.53); pass C, the night, is next |
| `COMBAT.md` | injury as states, not numbers (15 Sep 2026, designed, not built): gape, hold, edge against covering; wounds as spec edits; the per-clade kill and escape; its Open list is the person's |
| `AUDIO.md` | the sound's design (v11.14); every number was chosen blind |
| `DESIGN.md` | **the reference**: one section per system with the owning file, the numbers, the knobs and the reasons |
| `analysis_believability.md` | the 12 Sep analysis: how the world, flora, clades and spawning work, and where the believability is strong and thin |
| `DIRECTION.md` | where the project is going (12 Sep): the archipelago, oxygen, the silled basin, the hingeshells, and the game's loop ("the body is the tech"); its Open list is the person's |
| `CHANGELOG.md` | judging risk: what each version changed, what the person saw and said, what was never seen |
| `HANDOFF.md` | current state only, newest first, with what to ask the person to look at; entries no longer true are removed, not kept |
| `IDEAS.txt` | the person's own backlog |

`AUDIT.md` (the 9 Sep performance audit) and `Tethys Ideas/Ideas.txt` are cited by several docs and exist nowhere on this PC.

## Architecture

- **The world is a function.** `sample(x,z,out)` in world.js is the single source of truth: the ground and the nine condition
  fields (`FI`: sub, flow, expo, nut, turb, young, heat, shel, rel), analytic geology plus fbm. No biome ids anywhere. Species and
  structures carry `env` envelopes; `envW(env,h,slope,f)` is 0..1. Landmarks: the pit and the chimney are fixed by the geology, the
  rest searched on the terrain at load (`findSpot`, seed 4242, fixed sequence — add new ones at the end).
- **Cells.** 16×16 cells of 215 m (`CELL`, `NCELL`, the world ±`HALF`). A loaded cell is a 49×49 grid, a terrain mesh, its flora as a
  block in each species' pool (v11.52, chunks.js `POOLS`: one `InstancedMesh` per species across every loaded cell; the card species, the
  rafts and the glow clouds keep a mesh per cell), its colliders, its creatures. `genChunk` is a generator run under a frame budget (`Q.budgetMs`,
  the streaming budget is what the last frame left of `Q.target`), nearest first within `LOAD_R`. Inside a cell: terrain → the
  structures' collision → cliffs → rock → the other flora (each asks `clearOf` against the hash) → landmarks → creatures.
- **Near and far.** far.js builds every big structure, coarse terrain in 4×4-cell regions, the apron to 2000 past the edge, impostor
  cards and the water/floor maps once and keeps them. Cells draw fine terrain and small flora on top; far vertices under loaded
  cells are pushed down; impostors switch off while a cell is loaded within `FLORA_FAR` (450). `bigsFor(i,j)` is cached so near
  collision and far drawing agree. Structures and per-cell flora sit on the ground by one rule, `settleOn` (chunks.js).
- **Flora.** `FLORA` entries with per-cell tries, envelopes, placement flags; a per-entry rng so order moves nothing; photosynthetic
  entries tinted by `pigment(h,line)`; `species()` packs three variants into one geometry chosen per instance in the shader.
- **Creatures.** `SPECS[id]` → `compile` (a core builds the frame, parts merge into the body or become rigs; `derive` computes
  mass, drag, thrust, speed, turn, hp from the build) → `DEFS[kind]` (stats, role, prey, reach, dmg, strike) and `SPAWN` (capacity
  per cell and envelope) → the ledger → `placeKind` / `spawn` (geometry shared per kind in `KIND_GEO`; rigs are the creature's own)
  → `updateCreatures` dispatching on role (boid, trap, watch, hunter, graze, wander, coil, ambush, drift, sail), then contact.
- **The ledger is the truth about who lives where** (ecology.js): `POP.n[entry][cell]`; capacity from mean `envW`; unloaded cells
  run the model (births by allometry, saturating predation, starvation, drift) every `ECO_STEP`; a loaded cell spawns from it and
  writes back. A kill goes through `kill()`, a creature leaving mid-life through `removeCreature`, a new kind of spawn through
  `placeKind` with an `ent`; a creature spawned outside the ledger (`ent` −1: the lab, the fleets) is never counted or reborn.
  `SPAWN.n` is capacity, not a count; the equilibrium (`node test/census.js 120`) is the number in the world. Rates per game day.
- **Combat** (combat.js): a fight is a hold — a rope between a grip (jaws, arms, claws, read off the spec by `compile`) and the
  held body's hit capsule; struggle by mass; bites on the hold's clock; wounds bleed; blood a pooled cloud in the clade's colour.
  Drifters and the coil's withdraw bypass holds by design.
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
  with the raft, v11.16.1) and its doc table (missing TAXA, DRIFTERS, AUDIO); CREATOR.md and TAXA.md headers say nothing is built;
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
  against nothing. The veil reads `floorMap` beside `waterMap` (96×96, filled together in `wmFill`/`wmBlur`): a new map channel goes there.
- The far layer draws every structure from `bigsFor`; cells only register collision. Anything `big` a cell draws itself pops and
  doubles up. Change the ground rule in `settleOn`, nowhere else.
- Since v11.12 the flora has a draw distance `FLORA_FAR`: a new small species wants a cut material; a new big one wants a card in
  `FAR_IMP` and no cut. The disturbance loop runs only within `DIST_R` of the camera.
- A cell's small flora lives in its species' pool (chunks.js `POOLS`), not in `ch.meshes`/`ch.flora`: a block per cell, the tail moved down on
  unload, the written range uploaded (`updateRange`). Placement reads the cell's own hash only (`solidPush(…, own)`), which `placeBigSolids`
  completes with every neighbour's reaching structure — `test/pool.js` fails if a cell's blocks differ by arrival order.
- Never mutate a spawned creature's body geometry (it is shared per kind in `KIND_GEO`) — build a variant. `disposeCreature`
  skips shared geometry.
- The cell and region generators (`buildTerrain`, `placeFloraType`, `makeSchool`, `bigsGen`, `impostorsGen`) yield inside their
  big steps; a step that runs long shows as a frame over `Q.target`.
- Shadows are read by hand in every tinted fragment (scene.js `updateShadow`, `updateShadowS`), never through `receiveShadow`.
  The static map re-renders only when the sun turns, the camera drifts 20 m, a cell loads or a switch flips.
- The stub's `setTimeout` runs immediately; `location.hash` comes from `TIER`.
- In the sandbox a second writer once edited `src/` mid-session; build from a clean copy and say so.

## Dev tools in the game

- URL: `#low` `#high` (tier), `#zoo` (bestiary), `#lab` or `#lab=<base64 spec>` (the lab), `#bench` (the sound bench; it arms the first click, since an audio context needs a gesture), `#creator` (grants the menu's creator word without opening the lab first).
- The menu (v11.47): `new game` starts the finback in a new slot; `continue` lists the slots (the store is IndexedDB — clear it from the browser's site data to start clean; the tests use memory); esc in play with the pointer free (esc twice when locked) saves and returns to the menu.
- The effects list (`e`): `pixel light` (v11.38) is the caustic and the shadows in 30 cm blocks with hard edges, or smooth (the default); `texels` (v11.40–41, PIXEL.md) is every surface in texels with a pattern per cell — separate rows since v11.41.1 so either can be tried alone; `test/caustic.js` draws either light (`PIX=0`). A slider under a switch is a row in `FX_SLIDERS` and a number in `FX_DEF` (v11.38.1: caustics' `brightness`).
- Keys: `z` bestiary (left/right step, space strike, s cruise, drag turn, wheel zoom); `l` lab, `p` place the spec; `e` the effects
  list; `b` the sound bench (1 one-shots, 2 noise and irs, 3 the beds, 4 a live capture; `node serve.js` must be running); `f` first person; `r` or right mouse grab, click bite; `Q` the clade ability; `M` mute.
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
