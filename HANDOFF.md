# HANDOFF — tethys

Read this first. You (Claude) have no memory of the previous conversations; the files in this folder are the state.
This file is short on purpose. The upstream design is `PLANET.md` (the planet and the rules its life obeys; when the game
conflicts with it the game changes) and, for the sessile life, `FLORA.md` (downstream of PLANET, upstream of flora.js) `REEF.md` (10 Sep, built v11.20) is the reef as a landform — why the big things are framework and the generator that grows them; and, since 9 Sep, `TAXA.md` (answered, built v11.15): the descent of the sessile life — three
photosynthetic lines by pigment (greens, floaters, reds), the animal lines' splits, the colonisation order, the reef's zones, the swamp (parked); `DRIFTERS.md` (9 Sep, built v11.16) is the fourth clade: bells, buttons and sailers; `CLADES.md`
(v11.8–11.9.1, built) is the creature clade audit and the three clade signatures as built; `CREATOR.md` (9 Sep) is the
creature lab — one spec-compiled body-plan system for every animal, a dev tool first, the player's Spore-like creator later — with
the person's eleven open questions at its end (built: v11.10–11.11; every species a spec since v11.25); `POLISH.md` (9 Sep) is the survey of low-budget effects with the
person's answers — pass A (the light) is built as v11.13 and its shadows redone as a shadow map in v11.23, passes B (the body) and C (the night) are next; `AUDIO.md` (9 Sep) is the audio overhaul's design, built as v11.14 (DESIGN, The sound). The reference is `DESIGN.md` (one section per system, with the knobs and the reasons);
the history, what the person has verified and what has never been seen is `CHANGELOG.md`; the file map is `README.md`;
every top-level name with its line is `src/INDEX.md` (generated). Read a DESIGN section before touching its system.

## What this is

A Subnautica-like underwater exploration game in three.js (r128 from cdnjs, global `THREE`, no modules, no build
tools). No tech, no oxygen — swimming, an ecology, predators, and since v6 a surface to breach and land to flop onto.
The player picks one of three clades from a convergent-evolution roster: **soft-arm** (a ringmouth jetter), **finback**
(a slowblood), **coilshell** (a ringmouth with a flat coiled shell); every clade fills several niches in the world. Since v11.8 the clades
are being rebuilt away from their Earth reads — `CLADES.md`. Aesthetic:
old-school low-poly — Minecraft squids meets Subnautica creatures meets Ordovician Earth. Boxes, low-poly lathes and
spheres, flat shading, countershaded vertex colours.

## The person

- Wants concise replies with dry wit, no praise, no constant agreement. Disagree when reasonable. Don't pretend to be
  alive; be plain about what you can and can't do. From the sandbox you cannot see the game or profile the GPU. From the person's
  PC (Claude Code in the desktop app, since 9 Sep) you can: serve the folder on localhost (file:// is blocked), open it in the app's
  browser, drive the frame loop by hand — the pane's loop only ticks while it is visible, and a hidden pane reports a 0×0 viewport,
  which NaNs the menu layout — and screenshot it. That is how `AUDIT.md` and v11.12 were measured.
- Likes being asked questions and is open to your ideas. Has answered every question asked so far — ask, don't guess,
  when a design choice is genuinely theirs.
- Tests on **desktop**; phone is secondary and may sacrifice things as long as desktop is "fantastically smooth".
- Text in the game: tasteful, minimal, lowercase, letterspaced serif, only when needed (see DESIGN, HUD).
- Cadence agreed: content prompts freely; a performance pass whenever the debug readout says frame time is creeping.
  The last pass is v11.12 (`AUDIT.md`, measured on their RTX 4060 at 1600×900): the weed forest on the shelf, the heaviest place, is
  3.2 ms a frame on the main thread and GPU-bound no more (was 5.9 with 15 ms spikes); the peak 3.0; 306–368 draws, 4.2M tris (the
  figure counts collapsed flora variants). The readout has `render` ms since v11.12: when it runs away from the rest of the frame the
  GPU is the limit. The next flora pass is what will move these numbers; measure the forest at (330, 0) before and after.

## How to deliver

1. Edit `src/*.js` (a new file goes into `src/order.txt` too). Content edits usually touch only `creatures_defs.js`
   and `flora.js`; a new creature adds a builder in `creatures_builders.js`; a new plant is a `species()` in flora.js (grow.js bauplans).
2. `node build.js --test` (or `python3 build.py --test` in the sandbox; the same outputs) → `tethys.html` (everything inlined),
   `dev.html` (loads `src/` separately), `src/INDEX.md`, then `test/lint.js` (undeclared / unused names across the bundle; acorn is
   vendored as `test/acorn.js`), `test/physics.js` (the contact system against brute force and invariants; prints the cost),
   `test/anim.js` (the swimming animation two minutes in: no phase spin, no arm shiver or fling), `test/audio.js` (the audio graph against
   the stub's fake `AudioContext`, the space's numbers at five sites, the tick's cost) and `test/smoke.js` on both tiers
   (drives all three clades headlessly against the stub in `test/stub.js`; fails on any runtime error; proves nothing about rendering,
   frame rate or NaN in a position). New THREE APIs may need adding to the stub.
3. On the person's PC the folder `C:\Claude Code\Tethys` is the git repo (branch `main`, since 11 Sep 2026; the earlier Desktop
   repo is gone): commit each version there as `WB <willbuzbee@gmail.com>` (`user.name` is set in the repo's local config; never any
   other name). Node 22 is on PATH. `tethys.html`, `dev.html` and `src/INDEX.md` are build output and gitignored: run `node build.js`
   after a fresh clone. The person plays `tethys.html`; the copy beside the folder in `C:\Claude Code\` is the delivery, kept as it was.
   In the sandbox: copy `tethys.html` to `/mnt/user-data/outputs/`, zip the folder as `tethys-src.zip` there, `present_files` both.
   For a creature: `node test/preview.js <id>` and *look at the PNG* (the `view` tool) before delivering — a builder is blind
   otherwise. `test/geo.js` gives the stub real geometry for it. On the PC, look at the game itself (The person, above).
4. Update `CHANGELOG.md` (what changed, what is unseen) and any DESIGN section whose numbers moved. Keep this file short.

## Things that bite

- One shared scope: the bundle is one IIFE, `dev.html` loads classic scripts in order. Any file may use any name
  from any file; order matters only for top-level statements that run at load. `grep -n name src/*.js` finds uses.
- `sample(x,z)` in world.js is the single source of truth: the ground and the nine condition fields (`FI`); there are no biome
  ids anywhere (v10). Species place by `env` envelopes (`envW`). Landmarks: the pit and the chimney are fixed by the geology,
  the rest *searched* on the terrain at load (`findSpot`, seed 4242, fixed sequence — add new ones at the end).
- **An anim's beat is a `swimClock`, never `t*f(spd)`** (DESIGN Creatures, The beat): `t` is the session clock and `t*f` spins on
  every change of speed. New builders copy an existing one's `ck=swimClock(f0,f1)`.
- **All creatures face +z.** A predator's `reach` must exceed the contact distance of its and its prey's body capsules
  (`hit` in the builder) or it can never land a bite (DESIGN, Contact).
- Contact is `physics.js`: colliders in a per-cell hash (`addSolid/addCapsule/addPad/addEllipsoid/addRock`, `solidPush`, `bodyPush`), body capsules
  (`worldShapes/resolveBodies`), chains (`makeChain/simChain`, rigs `makeRig/rigSkin/stepRigs`, posed by `ringPose/tailPose`
  in parts.js). Chain buffers hold ≤39 points and ≤160 segments per rig. The sway shader reads `DIST_A/DIST_B` as `vec4[12]`
  uniform arrays — r128's `flatten()` passes a typed array through only if its first element is a number, so never write
  NaN into them. `Math.hypot` is slow in V8: physics.js uses `len3`. Every species geometry (and the rafts) gets a per-cell clone for its instance attributes (`aVar`, `aDip`).
- The frame order matters: `updatePlayer` (move, rock, floor, pads) → `updateCreatures` (creatures move; then bodies
  push apart with the player among them; the player out of arms; arms simulated) → `finishPlayer` (pose, own arms,
  camera). Moving a piece breaks contact silently.
- **Every tinted material's fragment carries the light block** (v11.13, scene.js `LIGHT_GLSL` in `addTint`): caustics and the bodies'
  shadows, reading `vFogPos`, `uSunW`, `uCastA/B` (typed arrays, never NaN). `LIGHT_FX` false strips it if the GLSL ever fails (a black
  or magenta world at boot). `thinLight` regexes r128's Lambert chunk and warns rather than fails. `updateCasters` runs after `assignLights`.
- The fog is not three's: scene.js rewrites the fog shader chunks and shares uniforms through `THREE.ShaderLib` —
  pinned to r128's `cloneUniforms`. The camera goes in by hand (`uFogC`/`uFogR`): three's `cameraPosition` is (0,0,0)
  on Lambert/Basic/Points materials in r128, so never read it in a shared chunk. Fog is per material: `MAT`/sway/`MATFAR` are "small" (fade sooner), `MATBIG`/
  `TERRAIN_MAT`/`GLOW` are "big" (keep the far ghost) — a structure built with `MAT` will vanish at 300 units. `WAVE_GLSL` is generated from `WAVES`; never write the wave sum twice.
- The world is ±HALF; past it the edge regions' apron (`apronGen`) carries the far terrain to 2000 beyond, so a mesh that ends at the edge
  shows against nothing. The veil reads `floorMap` beside `waterMap` (both 96×96, filled together in `wmFill/wmBlur`): a new map channel goes there.
- The far layer draws every structure (near and far) from `bigsFor`; cells only register collision. Anything `big`
  that a cell draws itself will pop and double up. Structures place by envelope like everything else and sit on the ground
  by one rule, `settleOn` (chunks.js), shared with the per-cell flora — change the ground rule there, nowhere else.
- Since v11.12 the flora has a draw distance, `FLORA_FAR` 450 (scene.js): the small materials collapse instances past it in the vertex
  shader, a cell past it hides its instanced meshes (`ch.near`, cullChunks) and its far impostors come on. A new small species wants
  a cut material; a new big one wants a card in `FAR_IMP` and no cut. The disturbance loop runs only within `DIST_R` 90 of the camera.
- A spawned creature's static geometry is shared by its kind (`KIND_GEO`, creatures_ai.js): never mutate a spawned creature's body
  geometry (colours, positions) — build a variant instead; the rigs are the creature's own. `disposeCreature` skips shared geometry.
- The cell and region generators yield inside their big steps: `buildTerrain`, `placeFloraType`, `makeSchool`, `bigsGen`,
  `impostorsGen` are generators, called with `yield*` (or drained by `bigsFor`). A step that runs long shows as a frame over
  `Q.target`; the streaming budget is what the last frame left of it (main.js).
- Quality tier `Q` is numbers only, never code paths.
- **The ledger is the truth about who lives where** (v11.26, ecology.js): a kill goes through `kill()` (debits, carcass), a creature that
  leaves mid-life through `removeCreature`, and a new kind of spawn through `placeKind` with an `ent` — a creature spawned outside the
  ledger (`ent` −1: the fleets, the lab) is not counted and never reborn. `SPAWN.n` is capacity, not a spawn count; the model's equilibrium
  (`node test/census.js 120`) is the number in the world. Rates are per game day (40 real minutes).
- Determinism: seeded rngs everywhere the world must persist; `Math.random` only for animation and particles.
- No `OrbitControls`, no `BufferGeometryUtils` — parts.js has its own merge.
- The stub's `setTimeout` runs immediately; the smoke test's world is the real one (same `sample()`), so headless
  measurements of terrain, collision and creature behaviour are meaningful.

## Where things stand

**v11.31 (11 Sep): combat as the physics — the hold, built, unseen.** CHANGELOG v11.31; DESIGN, Combat (new section). The person asked for the
combat overhauled from the physics (grab, hold, bite until it dies or bleeds; the player grabbing on a button; blood; losing allowed) and for
the AI left alone. Built: `src/combat.js` — a fight is a hold, a rope between a body's grip (jaws, arms, claws, derived by `compile`) and the
held body's own hit capsule; the struggle is the held one's own steering against a grip with a strength by mass; bites on the hold's clock
with a share that bleeds; the player's grab (right mouse or r, held) and bite (a gulp, a mouthful of a carcass, a tear); blood as a pooled
cloud in the clade's colour. `test/combat.js` is in `--test` and prints the table of every hunter's hold on the player. **Ask first for a
lurker's grab from its rock (are you held, do the arms wrap, can you thrash free), then r on a grazer (dragged, the tear, the blood), then a
ridge or eel on you (the clamp, the bites' rate, the ink or the stun letting you out), then the blood at −20 by day.** The knobs are `GRIP`
(combat.js) and PLANET's dmg numbers in `creatures_defs.js`. The next pass, theirs: the behaviour around the hold (a hunter returning to bled
prey, venom or paralysis, the wounded slowing).

**v11.30 (10 Sep): the world's shadows — built, unseen.** CHANGELOG v11.30; DESIGN The light, "The world's shadows". The person asked for shadows
from the flora, rock, coral and structures, performance first, off by default, on the effects list (e). Built: a second shadow map for what does not
move (scene.js `updateShadowS`), re-rendered only when the sun turns ~0.3°, the camera drifts 20 m, a cell loads or a switch flips; two rows,
`world shadows` and `ground shadows` (the terrain), both off. The flora casts at rest (no sway in the map). v11.30 was seen: a black screen and a
warning — the pass ran three's depth pass outside `renderer.render`; v11.30.1 runs it as a render through a layer-1 camera that draws nothing
(CHANGELOG). **Ask first whether the world draws with both off, then whether `world shadows` on draws at all, then the weed forest's shadows at
noon and the readout's `wshadow` spike, then a cliff at a low sun with `ground shadows`.**

**v11.29 (10 Sep): dithering — built, unseen.** CHANGELOG v11.29. v11.28 was seen ("awesome"); the person then saw rings of brightness in
the deep — banding on the veil's dark gradient (worse under their red-light filter). Every material dithers now (scene.js `DITHER_PARS`, the
chunks made unconditional; the sky by hand). Ask whether the rings are gone at −300 by day.

**v11.28 (10 Sep): the lower flank, no black water — built, unseen.** CHANGELOG v11.28; PLANET "The lower flank and the plate"; DESIGN World
shape, Visibility (the `WATER` table). v11.27 was seen and worked. Then: the world's edge was a 520 m cliff into "the void" (rocky bubble
wrap); the deep's water was black by table. Now the floor past the apron's toe goes on down a seamount's flank (16.7° easing to 12.4°,
`FLANK_*` in world.js) to −850 at the far apron's end and the plate ~15 km out; `WCOL` ends at the deep blue and the daylight term alone
darkens the deep. The dark inside the square is the pit and the corners; the picker's deep entry went to −300 so the stone and basker
keep their food; the equilibrium has more hunters (CHANGELOG). **Ask first for the edge from 215 m again, then the deep at −300..−400 by
day (dim blue — too bright?), then the pit from its rim.** The person's stated direction: the world grows outward down this flank into
open ocean over the plate as one biome, no walls (PLANET). Not built: that growth; the clamp at HALF−25 stands.

**v11.27 (10 Sep): the edge of the world — built, unseen.** CHANGELOG v11.27; DESIGN Visibility (point 3, the dome paragraph), The far
layer ("The apron"). The person, 260 m inside the void's edge: a dark band with "a horizon look" toward the open water, "like it's a skybox
or the end of the world"; the goal, never to see the sky bottom. Found on paper: the veil's colour was the `WATER` table at the *floor's*
depth, so the void (and the pit) painted themselves near-black onto every ray that reached them — 40% darker looking outward than along
the slope at their spot; the far mesh stopped at ±HALF with the dome beyond; the veil never quite closed, so the dome and the terrain beside
it differed at the far plane. Built: the veil by the ray point's own depth with the floor's colour fading out above it (`floorMap`, `wcol()`,
`FLOOR_H`/`FLOOR_FREE`/`OPEN_D` in world.js — not on the tuner); an apron on the edge regions (`apronGen`, far.js) to 2000 past the edge;
the veil cut to nothing by 0.9·FAR (`FOG_CUT_GLSL`). Seen (10 Sep): the band is gone ("I think you actually did it"). Still to ask: the surface over the slope (11% brighter on paper — `OPEN_D` if wrong), `render` ms.

**v11.26 (10 Sep): the ecology — the world as a ledger, built, unseen.** CHANGELOG v11.26; DESIGN, The ecology. The person asked for the
population to be a real ecosystem: honest predator numbers, deaths, flesh eaten, hunger, births with eggs, and the world changing off
screen. Found first: the pyramid was upside down (70 ridges against 172 darters) and no hunt could ever end (prey `flee` ≥ hunter `speed`,
grazers at 1e9 hp, kills respawning). Built: `src/ecology.js` — a per-cell ledger with capacity from the envelopes, an off-screen model
(births by allometry, predation by a saturating response over each hunter's reach, starvation, drift; a hunter's capacity is what its
prey allows), loaded cells spawning from it and writing back; live hunger (hunters hunt only when hungry, burst and give up, feed at a
kill, starve), carcasses (sink, lie, are scavenged), eggs laid near adults hatching into juveniles that grow up out of sight; `SPAWN`
retuned to a pyramid (ridges ~4, orthos ~3, eels ~11, lurkers ~23 in the world at equilibrium; forage in the hundreds; `stock` on the
small forage — one drawn stands for eight). `test/census.js` runs the model on paper and is in `--test`. **Ask first whether the
readout's fourth line counts up in the shallows (kills, laid, hatched), then for a carcass with a scavenger at it, a clutch near a herd,
and whether the big predators are now too rare for play** (the knob: the grazers' `stock` or `n`). Parked: the player eating eggs,
guarded clutches, the immortal kinds' births.

**v11.25 (10 Sep): every creature in the creator (IDEAS #4) — built, unseen.** CHANGELOG v11.25; DESIGN Creatures, the spec. The eighteen hand
builders left (rasp, veil, lurker, watcher, pall, eel, stone, scuttle, trap, hook, picker, flicker, tread, comb, the four drifters) are specs;
seven new cores (`sac`, `chain`, `shield`, `bean`, `arches`, `bell`, `float`), the drifters a clade in `GRAMMAR`, ~thirty new part styles,
`spec.mat 'glass'`. `test/ident.js` against a v11.24 copy of the builders: seven identical to the bit, the rest the same shape (previews
compared side by side). Found on the way: the calculator had read no thrust from any moving part since v11.18 (fixed). **Ask first for the
bestiary run through (z, right ×36)** — anything that looks wrong among the eighteen — then the lab on the tread, the eel and the jelly (the
new cores' sliders). Left of CREATOR: the player's creator itself; a chain body's parts cannot be lit under the cursor in the lab.

**v11.24 (10 Sep): the marine snow as what the column holds — built, unseen.** CHANGELOG v11.24; DESIGN Contact, "The snow". The person asked
for the snow reasoned from the physics (the bottom of the world is not the top): five kinds — live, floc, silt, bubble, black — each with a source
and a sink, layered by the thermocline (−64) and the chemocline (−450), the bed's nepheloid layer, the surf, the vents, the swell's orbits; the count
spent where the snow is (parked points elsewhere); per-point colour, size and alpha through an `onBeforeCompile` patch of r128's points chunks (a
console warning if it misses), the player's light on it in the dark. `test/snow.js` runs in `--test`. **Ask first whether the snow draws at all**,
then the top 3 m under the shelf in a wind, the thermocline's band, the deep at −200 (too sparse?), the plate, the black flakes under it, `phys` ms.
Found: the chimney landmark sits just outside the `heat` sector (raw 2.60; the field at 2.66–2.7) — theirs to move.

**v11.23 (10 Sep): the effects list, the shadow map, your own shadow in first person, the water's light under a shower — built, unseen.**
CHANGELOG v11.23; DESIGN The light ("The shadows"), The sky ("The water's own sky"), HUD ("The effects list"). `src/effects.js` (`e`, or the word
on the menu; localStorage `tethys.fx`); the capsule shadows are gone, one shadow map along the sun read by hand in every tinted fragment
(scene.js "Shadows (v11.23)", `updateShadow`) — never through `receiveShadow`; the Lambert key under water is the *refracted* sun now
(Claude's call — it is the map's direction too); first person wears `MATGHOST`; `K.skyLw`/`K.lumLw`. **Ask first whether the world draws at all**
(new GLSL in every tinted material), then the player's shadow at noon from third and first person, a school's shadows, acne or crawl, the
sunset light under water, a shower from under the surface, `render` ms with shadows on / off / sharp. If the shadow pass costs too much on
the 4060, flip `FX_DEF.shadows`. If the GLSL fails, `LIGHT_FX` false strips it.

**v11.22 (10 Sep): the rock coat binned (seen: clipping everywhere, colonies at odd angles, out of place on dark rock) and the fix made a system: rock first, then every plant asks the collision hash before it stands (`clearOf`, chunks.js). CHANGELOG v11.22. Ask first for the fan and the dikes from close.** **v11.21 (10 Sep): the manufactured reef structures struck (the person: "like a piece of art displayed deliberately"; "you never see coral and rocks actually touching") and the coat turned onto the geology's rock — every heap, sheet, block ≥ 4.5 m, talus and ledge carries anchors and `ROCK_EPI` (reef.js), two more giant colony shapes. CHANGELOG v11.21, REEF.md's head note. Ask first for a heap on the fan from close, then talus under a riser, then a lagoon boulder.** **v11.20.1 (10 Sep): the pinnacles were seen bare and white — the coat's matrix was never composed (an edit ate the line), the lime was 0.86 beside basalt at 0.34; both fixed, CHANGELOG v11.20.1. Ask for a lagoon pinnacle again.** **v11.20 (10 Sep): the reef as a landform, built, unseen** — `REEF.md` and CHANGELOG v11.20. The person asked how big coral really gets and
whether bigger structures are believable; the answer: a single colony stops near 6–8 m (the tower cut to 4.5–6, their call), everything larger
is *framework* — dead reef alive on its skin — and that is unbounded. Built: `src/reef.js`, four kits by growth rules (pinnacle, capped
pinnacle, microatoll, drowned ridge, cold-water and glass mounds) with **anchors**, coated by the cell from the ordinary species (`chunks.js
coatStructure`); far.js `clear`/`fill`/`flow`, settleOn `drop`. 277 reef structures, 755k tris. Ask first for a pinnacle in the lagoon from the
surface and from its foot (a reef knoll or a pile of rocks?), then the capped tops at a spring low, then `render` ms on the rim. REEF's Open list
is theirs: the mesophotic farmer (a new TAXA split), spur-and-groove, ramparts, rust mounds, the densities.

**v11.19.1 (10 Sep): the fan's hummocks rounded, unseen.** v11.19 was seen: walls and small rock "great", the overhaul "awesome"; the fan's
ground under the scarp was "jagged" with clipping — the hummocks were a tent's crease (world.js), now a smoothstep mound; creases across the
fan 41 → 11 of 81. CHANGELOG v11.19.1. Ask for the fan from the scarp's foot. The surface-breaking blocks near the scarp never really broke it
(4 of 20,000 points; 0 now) — theirs to decide.

**v11.19 (10 Sep): where rock goes, built, seen** — CHANGELOG v11.19 and DESIGN Structures, "Where rock goes". The person asked for the
rock decided from the geology first (where it belongs, not where it looked cool) and then the videogamey heaps and the "mountain of crap"
cleaned up. Found headless: heaps and toreva sheets on the rift arms and above the fissure (their screenshot) because `young` 0.7 on the
arms passed the fan's `young ≥ 0.45`; 157 m sheets across 60 m hummocks. Built: the heap is a pile of fifteen alike blocks; heaps and sheets
need `young ≥ 0.8` and no heat and are sized by depth; `fit` rejects a kit the ground can't carry; `face` gates talus — a new block entry
under every riser, the scarp, the dikes and the rim — and the rockfall cone (`crag3`, small now). Ask first for the terraces above the
fissure (arm 0, r 900–1150: the heaps gone, a boulder beach under each riser), then the fan's piles (still too big?), then the dike crest
where the spire stood. The `rel` field is 0 over the whole fan (the scarp) — worth fixing in `sample()` if anything wants relief there.

**v11.18.1 (10 Sep): the invisible-creatures bug in v11.18 (a comment ate `lodFar`) fixed; the smoke test guards it now.** **v11.18: odds and ends (10 Sep), built, unseen** — CHANGELOG v11.18. The mouth (and fins, tail hinge) ride a body frame that sways; `f`
is first person (whole body hidden); rain: the light under a shower ~0.52 of noon (was 0.24, darker than night), rings on the water instead
of flashing squares, distance-faded streaks, the patter and the rush instead of two hisses; rigs posed idle before the far bake and
`lodNear` per def for the long-appendaged; creatures fight the current (`seek`/boids subtract it) and sitters are not carried. Ask first for
the finback's mouth, then a shower seen from just under the surface, then a sailer from 150 m.

**v11.17.1: the person's calls built (10 Sep): declination 0 kept and its eclipses modelled (the moon dark red at every full-moon midnight; the
solar one exists but never falls by day with PLANET's clock), the flank cone's fumarole (a steam plume, vog downwind), calms (a quarter of
the time: the chop dies to the swell, the spray stops, and a clear calm dawn mists the lagoon). CHANGELOG v11.17.1. Ask first for the
first night's eclipse (~19.5 real minutes in), the plume from the water, a calm.**

**v11.17: the sky above the water, from the climate (10 Sep), built, unseen** — CHANGELOG v11.17 and DESIGN, The sky. No sea fog
(the reasoning at `HAZE`, world.js); the marine haze and the surf's spray as a layer on the water every fragment in air integrates;
the star and the moon by derivation (`STAR`, `MOON_R` 0.37° — the person: realism first); stars on 3D cells; cirrus; the cumulus
marched in `Q.cloud` slices with congestus and scud under a shower. Ask first whether the sky compiles, then the horizon band and the
deck at boot, then `render` ms. Decided since (v11.17.1): the vent, the calms, declination 0. Open: where the wanderers really are. A note for the next
session: the sandbox had a second writer editing `src/` mid-session (a parallel run of the same ask); this build was made from a
clean copy of the zip and never merged with it.

**v11.16.1: the raft struck ("looks terrible"), sailers also on the windward shallows and stranded on the strand (CHANGELOG). v11.16 seen: "so much cooler."**

**v11.16: the drifters, built, seen** — `DRIFTERS.md`. The person's surface complaint (the man o' war pads: clipping, white, spawning
into each other, "pustules in the sky") and the wish behind it (a plausible reason for interesting things on open water). Answered with
what is real and the clade's tree; built: the **sailer** as a creature (a crested float that rides the wave, sails 40° off the wind
left- or right-handed, a body you push against, eight 25 m lines as chains that stream and sting), the **greatsailer** as the landmark,
the **button** as flora (a disc that farms light, in fleets), the jelly rebuilt translucent and the **deepbell** red in the dark; the
float colonies gone. CHANGELOG v11.16 has the unseen list — ask first whether a sailer sits on the water and whether the lines stream.
Parked: fleets drifting as a fleet, stranded floats on the windward strand, what eats the buttons.

**v11.15.1: the animal lines' leaves (plume, seep, stilt, nod, the mats), built, unseen** — CHANGELOG. v11.15 was seen: "the whole thing looks
good", the tree line right; the person's next wish after this pass is **a larger world map** (PLANET: more of the same geology, not more kinds).

**v11.15: the plant overhaul, first pass (IDEAS #5), built, seen and liked.** The person asked for the sessile life rethought from evolutionary
logic — what each form eats, what colonised what in what order, real splits — and answered TAXA the same day: three photosynthetic lines,
**greens, floaters, reds** (TAXA.md, Decided); rebuild the trees; the swamp parked until the island grows. Built: `pigment(h, line)` — the
colour is the line's, the band a consequence (the shelf loses its green; the wisp is the forests' ground layer); the reds from nothing
(rind, limerind on the crest, sandball, redblade: the slope had no weed); the greens in air as jointed axes with whorls (the tidewood
rebuilt, the new reed-beds on the sheltered tide band, scrub and tussock as species). CHANGELOG v11.15 has the unseen list — ask first
for the shelf at −30 (olive, no green) and the tidal forest (does a stand of jointed trunks read as a wood). `FLORA=1 node test/preview.js
<id>` renders a flora species' variants; every new form was looked at there. The leaves followed in v11.15.1; left from TAXA: the epiphytes, spur-and-groove, the bog (parked with the bigger island).

**v11.14.1: the first listen.** v11.14 was "very loud", "hissy and white noise adjacent"; the old bed's low rumble is the reference. Every bed is pink or brown now, levels halved, the compressor transparent (it was adding makeup gain), and the readout tunes it live (`g-h` master, `j-k` beds, `v-b` the water's lowpass); ask what the knobs land on and bake them in (`AU_K`, `AU_DEF`). Rounds of playtesting agreed.

**v11.14: the sound (IDEAS #6), built, unheard.** The person asked for an audio overhaul — not music, not animal calls: a Thief-like 3D system
and the water heard as itself. `AUDIO.md` is the design; they took every default. Built in audio.js: a space read from the geometry round the
listener four times a second (twelve rays → the reverb, three early-reflection taps at the real round trip, the floor's shelf, the lid),
occlusion by ground and rock per placed voice, an eight-voice HRTF pool, and the beds from the world's numbers — the slosh following the wave's
rate at your x,z, the breakers by `expo`, the current, the vent at the chimney, the forest from a per-cell height grid, the deep's hush and
pressure, the crackle by `nut`; the body's flow, jet, landing, knock, scrape and brush (physics.js `contactK`); the water the nearest bodies
move. DESIGN has a new section, The sound; CHANGELOG v11.14 has the unheard list — ask first whether anything plays and whether it is too loud,
then the slosh under the chop, then a rock face's slap. The sandbox has no audio output: every number was chosen blind and is in DESIGN by name.
`test/audio.js` prints the space's numbers at five sites. The `M` key mutes; the readout's third line shows the space. Music gets `AU.music`.


**The rule, since 8 Sep 2026: the island is fully believable from its logic — no biomes, no magic, even for gameplay.** If
a thing can't be derived from a young shield volcano, a big moon, 28% oxygen, iron, a chemocline and five founder lines, it
goes. "Reality is often more exciting than what I could come up with" (the person). PLANET.md holds the decided planet and
the decided geology; FLORA.md the sessile life; every species places itself by a tolerance envelope over the condition fields
(DESIGN, World shape). Nothing reads a label; the HUD shows depth.

**v11.13: the light (POLISH.md pass A), built, unseen.** The person asked for the low-budget systems that carry low-poly games
(IDEAS #3); `POLISH.md` is the survey and its Decisions section their answers (9 Sep). Built here: caustics in every tinted fragment,
the sun's shadows of the player and the nearest bodies by size (no shadow map), light shafts on a world grid, translucent blades, the
terrain's cavity and canopy shade, the boulders' feet, the sessile animals breathing, the far cards swaying, the chemocline's plate.
DESIGN has a new section, The light; CHANGELOG v11.13 has the unseen list — ask first whether the world draws at all (the GLSL), then
the caustics at noon on the shelf, the player's shadow, the shafts. The tuner has `t-y` (caustics) and `u-i` (shadows). Then pass B,
the body (`fx.js`: silt, bubbles, scraps and blood by size; the flinch, the spin, the snap; rings on the surface; squash-stretch,
banking, the stun shown; the flush and the vignette *off* by default) and pass C, the night (the bioluminescent wake on the snow, the
pen flashing when brushed). Measure the forest at (330, 0) after A.

**v11.12: the performance pass, from `AUDIT.md` (9 Sep, the first session on the person's PC, the game measured live).** The person
answered the audit's five questions (450 m; variety stays plant to plant; Node; the reformat; the world.js fix) and it was built here:
the folder is a git repo with `build.js`, the flora has a draw distance with the impostors taking over, the sway loop is guarded, the
streaming yields and budgets itself, a kind's geometry is shared, the shaders warm at boot, `world.js:146` runs again (bare rock on the
dikes, the rim and the fan's blocks — the rim and the dikes look different now), and creatures_spec.js, lab.js and flora.js are
reformatted a statement to a line. **Unseen, all of it** (CHANGELOG v11.12): the first things to ask are the rim and the dikes, then
the cut at 450 m and the card hand-off at a cell line, then the first breach (the sky no longer compiles there). Left from the audit:
the shared flora vertex buffers with pooled per-cell meshes, the one placement rule, the mode table, the half-cell grid offset.
Do the plant overhaul (IDEAS.txt #5) with the forest at (330, 0) measured before and after; it is the heaviest place.

**The raptor family was seen (9 Sep): "THOSE ARE AWESOME! Exactly what I had in mind."** The person then asked for a design doc for a
creature creator — modular internals first, a dev tool for them now, the player's creator later, movement and physics derived from the
build: `CREATOR.md`. The person answered its eleven questions (recorded there, Decisions) and v11.10 built it: `creatures_spec.js`,
`lab.js`, 18 species migrated to specs and proved identical. The person built with it ("works great") and asked for a second round — v11.11: styles by clade, snapping to the body and its
armour, placed weapons and eyes, hingeshell mouth parts, the lab from play, the panel's nav and folds (CHANGELOG v11.11). Ask first what looks wrong in the lab panel; everything about it is in CHANGELOG v11.10's unseen list. New
creatures should be specs (make in the lab, export, paste into `SPECS`), not hand builders.

**v11.9.1: the raptor family.** The hingeshells were seen ("look great") but the sickle and the hose still read as Anomalocaris
and Opabinia. `buildRaptor` + `RAPTORS`: five looks (keel = the sickle now, splay = the hose now, hood/lash/ram bestiary-only, unplaced).
Unseen. Ask which looks go in the world; swap parts in `RAPTORS` in one line. The old `buildSickle`/`buildHose` are unreferenced and can go.

**v11.9: the hingeshell pass.** The slowbloods were seen and approved ("Perfected it!"); the person asked for the hingeshells.
Eight rebuilt to CLADES — the bivalved carapace (`valves`) on every one but the tread (untouched: they love the Ohmu), a comb for antennae,
the plate mouth on the face, the flicker as a swimming bean, the hose's proboscis one of a mismatched pair, the Cambrian tails gone. Unseen.
Ask about the sickle's valves moving and on its tell, the flicker at ribbon scale, the scuttle's flat pair. **All three clades are now built to
CLADES.** After this: the person's roster strikes; then the parked mechanics (PLANET Hooks: temperature, burst, moulting with the valves'
soft state, the drain, detection modes) and the 90/8/2 variants; the jelly's own overhaul; the tracking pupils on slowbloods if wanted.

**v11.8.4: the slowblood pass.** All ten slowbloods rebuilt to CLADES: petal snout (the fused ring, an iris that opens on
the bite), silver eye band with lobes on predators, three fins at 120°, Y tail, chevron plates, no white teeth; the abyssal its own builder.
Seen (9 Sep): the mouth hard to read (petals clipping, an idle gape, the silver band a cut, eyes lost); v11.8.5–8: petals, then flaps,
both struck ("a Lego fish"); the mouth is a ring of short stiff tentacles on the chain rig now (`mouthArms`), no idle motion, no band, a ring
of dark eyes, predators with a big forward pair on flesh lobes ("look great"). v11.8.8 seen: "WAY better"; v11.8.9 capped the open nose you could see into. Unseen since. Next: the
hingeshell pass — valves hinged at the midline on every one, the comb for antennae, the mouth ring at the front, the flicker as a swimming
bean, the hose's proboscis as a mismatched pair, the sickle's tail spines gone — CLADES, "What it does to the roster".

**v11.8.1: the ringmouth pass.** The person answered the audit (9 Sep): flat coil yes, the veil a ringmouth with
rethought eyes, no glowing eyes anywhere (a believability rule: eyeshine is a reflection), the tread stays, "continue onward". All ten
ringmouths rebuilt to the CLADES signature (headless, collar of eyes, predators' cluster, the mouth showing, 2-4-2 arms, shells carried on
their edge, three-lobed skirts) and every yellow/red eye in the roster replaced. Seen (9 Sep): "genuinely awesome"; the only note was the
flat wheel, fixed in v11.8.2 (upright: "much much better") and v11.8.3 (the shell moved back along the body; unseen). Next: the slowblood pass (petal snout, eye band,
three-fold fins, chevron plates; the abyssal its own builder), then the hingeshells (valves, comb) — CLADES, "How it would be built".

**v11.8: the clade audit.** The person asked (9 Sep) for a diagnostic of the roster (Earth clone / vague / unique / art)
and an upstream fix for the clades reading as Earth phyla in costume. `CLADES.md` is the answer: the table for all thirty, the findings
(Earth's greatest hits; two apexes are scale variants; the clade names promise features the builders lack), and a proposal — one radial
ancestor, three fates for its ring: ringmouths differentiate it 2-4-2 and go headless with a collar of tracking eyes; slowbloods fuse it into
a petal snout (the person's own idea) with an eye band and three-fold fins; hingeshells string it into rows under a bivalved carapace with a
comb for antennae. Nothing built from it. Built: coats in the bestiary (up/down: palette variants) so the roster can be looked at in other
colours first. Next: the person strikes; then the kit (`armRing` plan, `petalSnout`, `eyeBand`, `valves`, `comb`) and one clade per pass,
the players first, the bestiary after each. Ask which shell coil (flat or vertical) and whether the veil is a ringmouth before the ringmouth pass.

**v11.7.2: the crossing, third cut.** v11.7.1 was seen at night (fifth video): the dive fine, the breach "flickers on and
off". Measured from the video: +40% mean luminance on the flip frame decaying over 0.25 s, all of it in the sky — the shimmer plane (1.5 m
over the surface, 90 m wide, additive) fading out over a camera that was already above it. Now the water's things (shimmer, snow, the
player's glow) are hidden the frame the camera is in air and fade in when it goes under (`wk`); the tint from above switches with the medium;
only the hemisphere, the sun and the audio still fade. Unseen. Also seen in that video and not touched: the moon's specular lighting whole
near facets from just above (bright quads on the near sea) — the wedge problem again, in the specular this time; asked.

**v11.7.1: the crossing, second cut.** v11.7 was seen: the crossfade mixed the water's veil into the air (teal on the shore
for 0.3 s) and smoothed the underside's window ("less striking"). Now the medium — fog, domes, the surface's look — switches in one
frame and only the light fades (`MED_T` 0.25, `medK`); the underside's window is per facet again and only the topside Fresnel reads the
mean normal (`cm`/`cv`, SURF_MAT). Unseen. If the crossing still pops, what's left is the membrane itself.

**v11.6: the flicker at the water line.** Seen: the lighting alternating between the air set and the sea set at eye
level. level (screenshots), and, in a video, the glow on the surface switching every few frames while rising to it. Two causes: the medium
was re-decided from the raw camera height every frame while `camAbove` only clamped the camera's target (fixed: the camera itself is
held `CAM_CLEAR` clear of the wave and the medium is `camAbove`); and three sorted the surface among the transparents by its origin,
which sits at the camera's snapped x,z and hops across the camera plane near the line, so it swapped places with the shimmer sprite
every few frames (fixed: `surface.renderOrder` by medium, rain and spray after it). Both seen fixed (9 Sep, "completely
eliminated"). Then a second video: a straight edge sweeping down to the horizon while rising — the shimmer sprite hung 1.5 under the
surface, and the camera came up underneath it, then through the near plane's slice of it. Fixed: it hangs 1.5 *above* the surface and
draws before it (`SHIM_H`, `SHIM_A`). Seen fixed (third video: "fluid and seamless"; only the crossings jump, one frame each). Open:
whether the one pop on a real crossing wants a fade (the person wants no transition artefacts at all; a crossfade of the two light sets over ~0.3 s is the next step if so — the
domes and `uUnder` cannot blend, the fog, hemi, sun and tint can); and the flat wedges on the near sea from just above at grazing
(CHANGELOG v11.6, seen) — proposed: the mean normal for the topside Fresnel, facets kept for shading.

**v11.5: the inside of a wave.** The edge on the water survived v11.4; with the readout it was the camera in a trough
looking through a crest at the far surface's *underside*, drawn as reflected sky. Back faces in air are the water body now
and the surface writes depth. Fourth attempt; the previous three fixed real things (cards at low tide, a diffuse reflection,
aliased far waves) that were not this. If it is still there the person has offered a fresh context: give it `camAbove`
(player.js) and `SURF_MAT` (atmosphere.js), and the fact that it shows only at eye level.

**v11.4: the far sea un-aliased.** The step on the water survived v11.3: it was the surface mesh drawing each
wave fully aliased over a band of distance before fading it (to zero, dropping its mean) — a sawtooth the noon sun hid and a low
sun shows. Waves fade earlier and to their mean, the near mesh is twice as fine, the canopy folds to the wave (not the tide), the
far kelp cards stop under the troughs. The v11.3 reflection change stands. If it is *still* there, ask for a screenshot with the
readout and one from directly above the water looking down.

**v11.3: the sea as a mirror.** The dark wedges on the far water were the far layer's hidden trench seen through a
surface that went glassy at a low sun (its reflected sky was lit like a diffuse surface); the reflection is emissive and the
surface opaque at grazing now. v11.2's tide fix for the far kelp cards was real but not this.

**v11.2: the tide's cards, the whip.** v11.1 seen (9 Sep): trees "look great", day/night "works awesome". The
"clipped water" from above was the far kelp/bladder impostors standing out of a low tide (fixed: they follow the water down);
the whip is struck ("way too earth like"), the lily kept after a second look; flora entries get their own rng each (a one-time
reshuffle of small flora and boulders). The person wants, later, a pass on the land flora — matching the sea's but distinct.

**v11.1: the sea back.** v11 was seen (9 Sep): "the trees look great", "the day night cycle works" — but the surface
mesh was gone (its shader didn't compile: `uTime` undeclared in the fragment; fixed, one line). The surface under the new light is
now the unseen thing: the reflected sky, foam, the window at night, the moon's glint, rain on the water.

**v11 was unseen: the world above the water.** The person asked for the parked land overhaul (9 Sep 2026): PLANET decides
what is above the surface. Built: day and night on the tide's clock (a 30 h day, sunset 15 real minutes in, a full moon three
times the Moon's size rising with it, bright nights, new moon at 13 days), trade-wind weather with showers, one sky shader
(gradient, sun, a moon lit by the real sun direction, stars, cel-shaded cumulus drifting downwind, a rainbow), light by time above
and below water, rain, olivine sand and rusty basalt on the strand, and the tidal forest from FLORA (trunks on props in the tide
band, the leeward rim and the island's flat — built without asking; one line to strike). DESIGN has a new section, The sky.
CHANGELOG v11 has the unseen list; the first thing to ask is whether the sky compiles, then the clouds, then the sunset.
Decided by Claude, easy to change: the moon full at boot; boot at local 11:00; latitude 0.2 and no seasons; the player's light
at night; the tidal forest's exposure tolerance (0.75). Not built: creatures by time of day (PLANET: an ectotherm ecology under
a big moon), flyers, shore foam, cones opening on the flood.

**v10.8 was unseen: the jank fixed.** The person played v10.7: the tail "moves incredibly quickly", the tentacles
"move around constantly", only slowing down looked right. Cause: every anim's beat was `sin(t*f(spd))` — a phase, not a rate — so
minutes in, any change of speed spun it; plus the coil's/great's/watcher's arm roots shivering inside their own hull, and the hard
joint limit flinging the coil's short arms on every deceleration. All three fixed (`swimClock`, the own-body rule, the ramped joint
limit), the jet as a short thrust, switched poses eased. Measured headless (`test/anim.js`), seen by nobody. CHANGELOG v10.8.

**v10.7 was unseen: the roster placed.** v10.6's fifteen builders were seen in the bestiary (`#zoo` / z on the
menu): "look great". All fifteen are placed at once (the person's call): stats, roles, envelopes — first guesses — plus the
behaviours they needed (the strike with its tell, burst-and-coast, the sit-and-strike trap, the watcher's standoff, the hook hung
in the weed, the pall in the dark, the tread that nothing moves) and boid ribbons for flickers and the returning darters
(DESIGN Creatures). The loaded population tripled; the readout in the shallows is the first thing to ask for. CHANGELOG v10.7 has
the unseen list. The person's next wish (8 Sep): fill niches across clades at unequal shares (90/8/2) with variants and minor
species — PLANET, Cross-clade rules — after the base roster has been seen in the world. Not built, by PLANET's order: temperature,
moulting, detection modes, variants by place (shell colour by water chemistry, juveniles).

**v10.5 was unseen: the rock, cleaned.** v10.3 (the tide) was seen: "looks awesome, I love the current". v10.4's
rock pass was seen and the person struck the whole spire lineage — walls, neck, all of it — and asked for the rock logic to be
cleaner, not bigger. v10.5: four rock forms (block, heap, sheet, stack) plus the ledge, one placement rule (`chunks.js settleOn`
for near and far), one palette, no place-specific rock; the dikes are bare ridges. DESIGN, Structures, is the whole of it in a
table. CHANGELOG v10.5 has the unseen list. Still unanswered from v10.3: whether the rim drowning at high springs (40% land →
2%) is the planet or a mistake.

**Agreed order of work from here** (the person's, 8 Sep): the current (done, v10.1–10.2); the tide (done in v10.3 bar the
cones/crowns opening on the flood, and the parked land overhaul it was waiting on); then **day and night** on the same
clock (done, v11); then the
**creature roster** (PLANET's 31 species by niche) once the world is behaving. Believability
items still open: creatures should swim *against* the current rather than slide (an AI heading term); rafts and colonies
should drift with it (instance matrices per frame; the colonies "floating on their own" was accepted, 8 Sep); the terraces read as stairs (real ones are irregular: riser heights
varying, treads pinching out, lowstand gullies cutting across — cheap, on the list); the ribcage on the plain is to be
re-read as a whale fall with a mat and a bone community (not vetoed); the veil's glow spots and the darters' glow variant
are the last lit things — audit them against the no-magic rule; bioluminescence may return only as *events* (a wake that
glows, a pen that flashes when brushed) — PLANET, Hooks. The world will grow later: more of the same geology, not more kinds.
The creature envelopes (creatures_defs.js `SPAWN`) are first guesses and the flora envelopes (flora.js `env`) second guesses:
tune from what the person sees, never by adding a place.

Older state follows.

v9.3 is built and unseen: flat rock. The person played v9.2 for a day: the rocks hold, the rockfall "looks incredible"
(rock covering the ground, flat and wide), big single lumps look "low in polygon", the area under the great arch was
"terrible" (they wrote "spire" and confirmed they meant the arch/massif), the tors ("snowmen") far too common. v9.3:
every kit lump drawn as sixty inward-dented facets with per-facet shade (collider unchanged); `slab` sheet-rock
structures; bigrock a four-lump flat cluster; the massif's heap replaced by a pavement of flat slabs and its table cut
from 35 crags/tors a cell to 25 slabs + 2–3 crags; tors 147 → 17 + seven cairns on the pit's rim. CHANGELOG v9.3 has
the unseen list, starting with whether the facets read as rock. v9.2's unseen items (rocks holding at corners, stalks
leaning from the base) are verified in spirit ("good job"); v9's arm/wrap/eel items and v8.5's fog-by-place were never
reported on individually. **The current topic is the creature ecology audit** (Sep 2026): the person went upstream first and `PLANET.md` holds
the decided planet (late-G/K star, 1 g with 1 unit = 1 m and `GRAV` 9.8 since v9.4; a chemocline at −450 that will
drain the player; the green gradient), the three named clades — ringmouths, slowbloods, hingeshells, plus the jelly as
its own drifters clade — as constraints, and a **proposed roster of 31 species by family and niche** with a build
order, awaiting their strikes. Agreed order of work: design the creatures → build their builders ("sprites") and let
the person look → only then the mechanics (temperature, burst movement, moulting, the drain, detection modes). Still
unanswered: whether the veil is a ringmouth. **Then the flora** (Sep 2026): the person wanted a SpeedTree-like generator for
sessile life, plausible by depth and energy source. `FLORA.md` holds the design (Earth as reference, never template; the
filter; five founder lines with signatures — weed, polyps as the drifters' fixed stage, crowns as sessile ringmouths, cones
as sessile hingeshells, sacs; eight bauplans; the roster by band; giants) and the person's answers (8 Sep). **v9.5 built
it and is unseen**: `grow.js` (the grammar, `species()` packing three variants into one geometry chosen per instance by
`aVar` in the shader, `pigment(h)`, `flowYaw`), ~30 species on the reef top, the shelf, the flats and the rockfall, the
rafts as weed and the big rafts as float colonies with fishing lines, the old dome as the first giant. CHANGELOG v9.5 has
the unseen list; the first things to ask: does the reef top read as vivid and rigid, the shelf as an olive swaying forest,
and what the readout says in the stipe forest (the tris figure will show ~3× for flora; the ms is the number). Next passes:
the slope, the deep, the vents and the rim (lily and tower are already there; crust, redblade, stilt, frond, glass, plume,
hair, seep, the cistern and the great lily are not). After that: a rethink of the biomes and the world map. The surface-interest menu (DESIGN, Hooks) is parked behind all this and
the above-water world is due an overhaul later. Older open questions: clade-specific reach, persistence vs a clean cold
start, canopy fauna, the name "the canopy", darter shoals as boids.
