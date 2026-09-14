# CHANGELOG — tethys

Oldest first. Under each version: what changed, what the person saw and said, and what was reasoned but never seen
(there is no GPU in the sandbox; everything visual is unverified until they look). When they report something off,
the "unseen" list of the newest build is the first place to look.

## v1
Single file, 860-unit circular world, 7 biomes, full ecology, three clades.

## v2
16×16 cells (16× area), chunk streaming, 12 biomes, the mountain profile with mixed cliffs/slopes, mid-water and
surface content, landmarks, the void as "the dark", better deep visibility.

## v3
Split into `src/` + build script + smoke test; creature LOD, budgeted streaming, cheaper flora, the light pool, the
quality tier, the debug readout.

**Unseen:** kelp frond orientation (rewritten to radiate around the stalk via Euler order YXZ); whether `bakeLOD`
output looks right and the near/far swap pops; Phong `flatShading` terrain look; pointer lock inside an iframe (there's
a drag-to-look fallback); bladder kelp's non-uniform instance scale (`s:[1,0.014,1]` parts may look odd at extreme
heights); load hitches from first-time shader compiles; mobile at all.

## v4 — feedback pass
Removed the floating weed, the glowing colonies and the darter schools (see DESIGN, Creatures). The rockfall got real
relief; crags, tors and megaspires as solid structures with collision; the great arch (first version) and the great
lantern; the compass.

**Answered:** crags are the right kind of big. Cliff faces/overhangs wanted (done as ledges in v5). Spires/terraces
relief wanted (done in v5).

**Unseen:** crag/tor silhouettes at scale (flat-shaded dodecahedra 40–120 wide — they may read as crystals; if so,
more lumps per cluster or a jittered `IcosahedronGeometry(1,1)`); how the rockfall ridges shade under flat Phong;
whether collision against sunk spheres feels smooth or catches on lump junctions (the headless solids probe showed no
breaches and sane heights, nothing more).

## v5
Cliffs dressed with ledges and cleared of flora; terrace and spire relief; the canopy surface biome with big and huge
rafts; readout key aliases. Then, on feedback: three canopy patches with halos, pocketed rafts elsewhere.

**Verified (v5 build):** readout in the thickest kelp, desktop, high tier: **120 fps, 8.3 ms, 130 draws, 416k tris,
cells 9/35, creatures 22/269.** No performance issues reported anywhere. Ledges read as strata; terrace step height is
right; the canopy and the pit look excellent; crags, tors, great lantern all approved.

**Unseen:** whether the ledges read as strata or as tiles glued to a wall was the worry (answered: strata); terrace
risers at 12 units may want 8 or 16; the huge rafts' tendrils under MATR2 sway (5 units at 80+ deep — could be too
much or too little); the canopy fog colour (`WATER[12]`, teal-green) and whether 0.72 light is dim enough under the
mats.

## v6 — the world above the water
No ceiling; a shared wave function for physics and rendering; a shader-displaced two-faced surface mesh with foam,
Fresnel and refracted glints; sky dome, sun disc, air fog and a through-water depth tint; land (atoll rim, skerries, the
island with a tidal flat) as biome 13 "the strand" with its own colours and flora; the medium model (submersion
fraction → thrust vs gravity), breaching, splashes, flopping for fish and a walking hook for legs; creatures obey the
same physics, strand and flop back, and give up the chase at the shore; the scuttler.

**Verified:** approved in full — art direction, floor spacing, the 3D rocks covering edges, going above the water, and
the canopy ("truly awesome").

**Unseen (never individually confirmed; approved as a whole):** (a) the surface shader compiles at all (it injects into
Phong via `onBeforeCompile`; if the sea is missing or magenta, that's `SURF_MAT`); (b) surface brightness on both faces
(top diffuse `0x123a4c`; underside emissive `(0.16,0.34,0.42)*(0.35+0.65*uDf)` plus the refracted glint — either could
be too bright or too dull); (c) coarse far grid aliasing/flicker in the swell from a high viewpoint (the island top)
despite the per-wave `aSpace` fade; (d) wave amplitude 1.17 vs creature size — the rafts (`ys` 0 / 0.3) bob rigidly;
the huge rafts don't conform; (e) the sky dome: horizon = haze, zenith `AIR.zenith`, sun disc nearly overhead; (f) air
fog 0.0030 — a hazy coast; lower it for a sharper horizon, but then the sea mesh's far edge (hidden by the haze) may
show; (g) the through-water tint strength (`0.05` per unit of depth) and `TINT_COL`; (h) land colours by height, and
whether the tidal flat's ±2.6 pools read as pools; (i) flop feel: 4.2/4.8 impulses, 0.7 s cadence; porpoising when
holding space at the surface; (j) camera side flips at the surface; (k) crags/tors on the island at full size (a tor
can be ~90 tall on a 42-high island — the person likes big vertical structures, but this one wasn't asked for;
`per[13]` on `tor`/`crag`); (l) whether the scuttler reads as a creature at 0.7 units.

## v7 — the arches rebuilt
Both arches as cobbled rock piles on the crag kit; the great arch scaled to a 408 span that breaks the surface.
Removed by request: the vents' glowing stalk bulbs and the cyan/pink glow clouds.

**Verified:** "way closer to what I had in mind"; the raft exclusion around the crown was noticed and liked. Their
asks: 50% thicker at the crown, 100% longer, keep the height, and an enormous rock base burying the trunks → v7.1.

### v7.1
An 800 span with a 30-radius crown and **outcrops** — terrain mounds under each foot with big boulders piled over
them, burying the arch's lower third.

**Verified:** "looks awesome", "truly huge now"; facing north-east the arch "lands very well and appears to have rocks
that believably sit below it"; facing south-west (closer to west) the other foot "looks much more odd, with some
scaling happening on the way down" and its mound "hits the elevation drop immediately below it but does not go down
into it, creating an artificial shelf". The real ask, in their words: the arch is the cool formation; the region below
should be "stony all the way across", "just as intricate, explorable and biome-like" as the arch, with crevices to hide
and cave through like the rockfall — "this whole arch region is supposed to be made of the same material, a large rock
that happens to have a cool formation on top. We need the actual rock." → v7.2.

**Unseen:** (a) the arch **rotated ~15°** from the 408-span build (the yaw search found different best ground at ±400)
and its feet moved outward; (b) the mounds' stepping (since replaced by ridges); (c) ledge density on the mounds
(~50–120 per cell) — if scales, lower the `0.42` chance in `placeCliffs` or gate by `nearLandmark`; (d) where the arch
column leaves the plateau — if there's a visible seam, add more outcrop boulders near `q>0.6` or sink the first span
lumps; (e) the crown is +44 centre / ~+95 top — taller than the +34/+70 approved, forced by the thicker (30) crown; drop
`crown` toward 38 if it looms; (f) the visible bridge ~530 wide at the waterline; (g) tide band −6..+3; (h) collision on
the crown from above (landing a finback on it — the lumps are solids); (i) the small arch's 17-tall smooth outcrop; (j)
no flora or light on the arch itself (tussock/scrub on the dry top is the obvious next touch; not asked).

### v7.2
**The massif**: biome 14, "the arch", an ellipse of raised ridged rock under the whole span with rockfall-density
crags, ring steps flattened inside it so it runs down into the deep, the mounds ridged instead of stepped.

**Unseen:** (a) does the region read as one rock with the arch on top, and does the seaward descent now flow (the
profile across each foot goes −80 → −255 over ~300 units with no step)? (b) the massif's edge — a 38% fade band; if the
join to the terraces/deep looks like a raised platter, widen the fade (`0.62` in `massifW`) or lower the lift; (c) the
floor under the crown rose from −222 to ~−140, the opening ~150 tall instead of ~230 — if it feels closed, drop the
lift; (d) the north-east foot that "landed well" changed too — it should look like the rockfall's crags at foot scale;
(e) the 930 ring step runs under the massif as a long slope, so the floor tilts toward the deep across the opening;
(f) biome label "the arch" appears on entry and while swimming above the massif under −70 (the canopy rule doesn't
apply here).

### v7.3
The massif lifted further, given the game's densest crag/tor table and a settled boulder heap along the span under the
crown; per-cell baking of world-space landmark layouts; per-vertex tide line on rock; `keep` discs on landmarks;
`addSolid` grows the cull sphere in 3D.

**Unseen:** (a) structure density: 35 crags/tors per dominant cell plus 45 bigrocks, no field clustering — the person
asked for "the most rocky area in the game" and "if you are directly below the arch, you should be inside of a
completely rocky environment... elevated far off the ground in comparison to the actual non-rock floor"; this is a
first pass (they said not all of it need be done now). Look for: overlapping crags reading as noise rather than rock;
whether the heap under the crown reads as a boulder pile or as floating stones (each boulder rests on ground or another
boulder by construction, but non-uniform lump scales can open a visible gap under one); whether the 30–60-unit opening
under the crown is enough or the heap should be lower; (b) **performance:** massif cells carry 400–650 solids, 3 extra
instanced draws, ~14k tris of landmark lumps — ask for fps/ms/draws under the arch; (c) colliding among the heap: sphere
junctions may catch.

## v8 — distance (current)
Three's fog replaced (radial, two populations, the water's colour by place from a world map, one density per medium,
the underwater dome); draw distance 1600; the far layer — coarse terrain for the whole world sunk under loaded cells,
every big structure placed once from the analytic terrain and drawn by region for near and far alike, landmarks
persistent, sparse impostors for kelp, bladders and rafts beyond the loaded cells (the impostors were asked for); the
surface mesh to the far plane; big creatures drawn and updated to ~750; the readout shows `far visible/built`.

**Seen so far:** only the first v8 build's screenshots — black backgrounds, a rust wall from the vent field 700 units
off, pale terrain under the canopy — which led to the camera-weighted map sample (`placeMix` 0.3; see DESIGN,
Visibility). Nothing since.

**Unseen, in order of "if this is wrong everything is wrong":**
(a) **the fog chunks compile.** Every material magenta / scene black → the GLSL in scene.js's fog block (the `#ifdef`s
are on their own lines; `cameraPosition`/`viewMatrix` are in three's prefixes; `mat3(viewMatrix)`; `texture2D`).
Fallback: comment the four `C.xxx=` assignments out. (b) **the uniform plumbing:** water one flat colour everywhere or
black → `uFogP/uFogW/uWaterMap` didn't reach the programs; check `THREE.ShaderLib.lambert.uniforms.uFogP` exists in the
console, and that `waterMap.clone()===waterMap`. (c) **the numbers:** share 0.66 / far 0.0019 roughly doubles
mid-range clarity (34% contrast at 200 units vs 16–20% before); knobs in DESIGN. (d) **the dome:** from under water, a
visible edge anywhere against the surface or the horizon? There shouldn't be. (e) **the far terrain's join** to the
loaded cells at ~540–650 units: a moving line at the edge of the loaded block (a lit sliver = the coarse edge above the
fine one, which the 30-unit clamp should prevent; a dark line = the trench, which should be hidden from inside); the
unload at `LOAD_R+1` swaps fine for coarse at ~645 units — a resolution pop on rough ground is possible. (f) **the far
terrain's colour** vs the near: the same function on a coarser grid; the rockfall's slope→rock lerp triggers less at 18
units. (g) **the structures:** drawn by the region, culled by the region's sphere — if a crag vanishes at the edge of
the screen, the sphere is too small (`+80`, `+120` in `genRegion`); their tints come from a new rng, so individual
crags changed shade. (h) **draw calls / tris:** expect +30–60 draws and +100–200k tris over v7. **Ask for the readout
in the kelp, under the arch, and on the island top looking across the atoll.** (i) **the boot:** the far layer streams
behind the menu; click within the first second and the outer ring appears in play over the next few seconds. (j) **the
creature LOD** to 760 — a static far LOD of a 16-unit animal at 700 units is a smudge; if smudges bother them, drop the
40 in `lodFar`. (k) **the surface at 192²** and the `0.12/0.88` mapping: chop under the camera should look as before
(2.1-unit quads); far swell aliasing is the `aSpace` fade. (l) **the light** on far things: sun/hemi only — distant
vents won't glow. (m) the great lantern's and heart's glow meshes are persistent now, always drawn when in frustum.
(n) **the impostors:** flat cards; from 540+ units through 12% contrast they should read as texture, not cards; the
swap at the loaded boundary; the 1.4-wide bladder card aliasing from 800 units.

## v8.1 — housekeeping (this build; the game is byte-identical to v8)
No change to `src/*.js` or `shell.html`. Build order moved to `src/order.txt` (build.py, smoke.js and lint.js read it);
`build.py --test` runs lint and the smoke test on both tiers; `src/INDEX.md` (every top-level name and its line) is
generated on every build; `test/lint.js` (acorn-based, optional) reports undeclared and unused names across the whole
bundle; the smoke test now also kills and respawns each clade. HANDOFF.md was split: the short entry point stays in
HANDOFF.md, the per-system reference is DESIGN.md, and history/verification is this file.

## v8.2 — the veil (this build)
The person's first look at v8 in play: two screenshots at the canopy over the great arch (−42 and −48 deep), against one
from v7 in the sedge flats, with a Subnautica 2 frame as the reference for what distance should do. Verdict: v7 "looked
better but lacked distance"; v8 is dark, every pad and stalk out to 400 units is a black cut-out, the far terrain shows
through pale, and the horizon "runs into black".

Diagnosis from the pixels (see the reply that shipped this build; the numbers are in DESIGN, Visibility): (1) the veil
was dark — the arch wore the terraces' water, half the shelf's brightness before depth darkening, plus the canopy's shade,
plus 30% of the void's near-black sampled beyond the rim for every horizon fragment; (2) one share for everything left
20–34% contrast from 200 to 400 units, so small dark things hung as silhouettes in the same band where the far terrain
was meant to ghost; (3) the hemisphere ground colour was near-black, so everything seen from below was black. The v7
shot was also in a brighter place (sedge floor, bright water) — part of the comparison is the biome, and the reply says so.

Changes: **`WATER`** brightened for the slope biomes, the arch and the canopy (shelf and deep untouched); **the veil's
place and daylight sampled at most `reach` units along the ray** (no void on the horizon; darker looking down, lighter
looking up); **a sun term** in the veil; **two shares** — big things (`TERRAIN_MAT`, new `MATBIG` for structures /
landmarks / big creatures' far LOD, `GLOW`, surface, dome) keep the ghost, small things (`MAT`, sway, `MATFAR`) keep half
of it; **hemisphere ground = water colour × 0.8**; the readout gets a **live fog tuner** (keys on the readout's second
line, Backspace resets) so the look can be dialled without a build. Smoke and lint pass on both tiers.

**Unseen, in order:** (a) **the GLSL compiles** — new uniform `uFogS`, new maths in `fog_fragment`; magenta/black →
scene.js fog block; fallback as before. (b) **the per-material `uFogP` swap** in `addTint` — if small and big things
fog identically, `sh.uniforms.uFogP={value:FOG_PS}` didn't take (check a kelp material's program uniforms in the
console). (c) **the numbers** — the whole point of the tuner; ask for the pasted fog line and the same two viewpoints
(−522,−42,−955 and −556,−48,−984, facing the same way). (d) whether the pale far terrain still reads as "LOD": `share`
is the knob (0.82 → 0.75 halves it beyond 400). (e) the impostor forests at the small share are faint (5% at 600) —
if the person wants distant forests back, `shareS` 0.84. (f) the sun glow cone (pow 6, ×1.6 at the sun) through the
surface underside; (g) `ground` 0.8 — undersides of rocks and bellies lifted from black; if it flattens the shading,
0.5. (h) the arch water (14) is now brighter than the terraces' (7) next door: a step across the massif's edge, blurred
over ~70 units on the map — if visible, bring 7 up. (i) the readout's second line is long; it wraps nothing (`pre`).

## v8.3 — the horizon (this build)
The person's look at v8.2 (three screenshots at the arch canopy, −10 to −14 deep): "it looks better"; they could see
"some differences in how the fog affects the ground vs the objects"; and they withdrew the distant-giants brief —
"get a good fog system going", preserve the older style, reasonable distant LOD, use your judgement.

Found in the pixels: the bright cyan band over the underwater horizon, the "pale mountains" of the arch crown and a pale
huge raft at 150 units were all **the surface mesh's topside look leaking through from below** — the mesh writes no
depth, so at grazing angles the far slope of every wave (a front face from under water) was drawn with the sky-Fresnel
top look at 96% alpha over the underside look, and that colour is the surface's own, not the fog's, so no fog setting
could make the horizon converge. The dark navy patches on the massif floor are steep ridged faces lit by ambient only
(flat shading; the old game did the same) — terrain, not fog.

Changes: the surface picks its look by the camera's medium (`uUnder`), and the underside has **Snell's window** — bright
sky and glint overhead, a **veil-coloured mirror** (fogColor·0.9, alpha 0.74) toward the horizon — so surface, far floor
and dome meet in one colour. **One fog curve for everything** by default: share 0.88 = shareS, far 0.0015 (66% at 100,
23% at 200, 9% at 300, 5% at 600, gone by ~1000); the split stays as a knob. Nothing else moved.

**Unseen, in order:** (a) **the surface shader compiles** — `snell` is a global float in the fragment prefix,
`fogColor` is read in the emissive block (declared by `fog_pars_fragment` under `USE_FOG`); if the sea is missing or
magenta it's `SURF_MAT`. (b) **the underwater sky** — bright overhead, fading to the veil from ~40° down to ~15°
elevation, veil at the horizon; if the sky feels too small, lower the window's `0.65` (atmosphere.js); if the mirror
band looks like a dark ceiling, raise the `0.9`. (c) **from above water** at grazing angles the crests' far slopes now
take the top look too (they used to show the underside's teal); the sea from the island top may read slightly
different. (d) **the horizon from under water**: surface, far terrain and dome should now be one colour; a visible
seam between the surface's mirror band and the dome means `fogColor` (the camera's lagged veil) and the per-fragment
veil disagree — `placeMix` toward 0 tightens them. (e) the single curve: 9% at 300 for everything — kelp forests
reappear faintly at 300–500 (v8.2 had them at 5–6%); `shareS` 0.92 fades them. (f) the pale huge raft in the v8.2
shot should now be dark like its neighbours; if a big raft is still pale, it's something else (`raft3` at `ys` 0.3
sits mostly above the surface and its underside is the surface's mirror, which is the veil — dark).

## v8.4 — the flanks
The person's look at v8.3: from above the water "fog looks great", from the floor looking up "looks great"; the readout
numbers arrived (120 fps / 8.3 ms pinned, 214–276 draws, 0.9–1.5M tris at the arch canopy); asked for a legible readout;
and: "the ground still has a kind of black spot where it just doesn't seem affected by the fog at all… the ground
almost resists the fog, but from above the water it's affected just fine."

From the pixels: the black spots are the down-tilted faces of the big dodecahedra (the heap under the crown, r 11–36:
faces 20–40 units wide, random-rotated, so from above at 40° their lower ring is in view) lit only by the ground
hemisphere — near black (0.35 albedo × 0.8 × veil) — and *then* fogged: at 200 units they came out 25% darker than the
veil, the lit faces 20% brighter, with edges the fog cannot soften. From above the water the through-water tint flattens
everything to one blue, which is why the floor looked fine from there. Two causes, both lighting: a weak upwelling
ambient, and rocks 150 under a surface-level player lit by the sun at the *player's* depth (full) while the veil in
front of them was read at theirs (dim).

Changes: **sun by the fragment's depth** — `sun.intensity` is the surface value and three's directional-light chunks
are patched to scale it by daylight at the lit point (Lambert in the vertex shader, Phong in the fragment; point lights
untouched; at the player's own depth nothing changed); **ground ambient 0.8 → 1.2** (top:side:bottom 1.8:1.5:1.2);
**additive glow clouds take extinction only** (no veil term — they were the cyan speckles on the floor); **the readout
has a dark backing**. Fog numbers unchanged (the person likes them).

**Unseen, in order:** (a) **the light-chunk patch matches r128's text** — if the console says `sun-by-depth: light
chunks not as expected`, the regex in scene.js missed and the sun is as before (paste the console line). (b) **the
dark flanks** at the arch from −4 and −10, same spots as the v8.3 shots — they should now be ~10% darker than the veil,
not 25%; if still stark, `ground` toward 1.5 in the tuner, and consider the sun's curve (`dl`, linear — a `dl²` on the
sun alone would flatten deep floors further but darken the deep for a player at depth too). (c) **the whole game's
shading** with ground 1.2 — flatter undersides and bellies everywhere; if things look pillowy, 1.0. (d) **deep floors
from above**: a floor 200 down now gets 0.52 sun from a surface-level camera — from the island top through the tint
this is invisible, from under the surface it is the point. (e) **the strand from the air** is unchanged (fragments above
0 get factor 1). (f) the glow clouds should vanish with distance now; the ones in view keep their sparkle. (g) the
readout backing is debug-only styling.

## v8.5 — the camera
The person's look at v8.4, at (−894,−7,−133) over the slope: "above water the fog works; underwater it doesn't apply to
the ground, only to objects, creatures and rocks." Two screenshots; the readout says high tier.

From the pixels, the other way round. The floor 300 units off *was* fogged — to (15,55,75), which is exactly the veil
the design computes there (the slope's `WATER[7]` at the sample point's daylight: (14,54,74) from the map, headless).
The creatures, rocks and the dome were fogged to (25,108,137): the map at the **world origin** at full daylight, i.e. the
home shelf's water. Cause: three (r128) uploads its `cameraPosition` uniform only for Phong, Standard and Shader
materials (`WebGLRenderer.setProgram`); on Lambert, Basic and Points it stays at the GLSL default (0,0,0). The v8 fog (the far-layer build)
read `cameraPosition` in the fragment, so only `TERRAIN_MAT` (Phong on high) got the world-space veil; everything else
was fogged as if the camera stood at the origin, wherever the player went. Same bug behind v8's first shots (black backgrounds:
the dome sampled the map from the origin, 1500 units out over the void; pale terrain: the one thing fogged to its real
veil), v8.2's "ground and objects fog
differently" (the shares were equalised for it; the shares were never the difference) and v8.4's "black spot" report.
On low (Lambert terrain) everything was consistently wrong, so the person's desktop testing was the only place it showed.

Change: the fog gets the camera by hand — `uFogC` (world position) and `uFogR` (world rotation, mat3) shared through
`ShaderLib` like the other fog uniforms, written by `updateFogCamera` in the frame loop after `camera.updateMatrixWorld`.
`fog_vertex`/`fog_fragment` and the Lambert sun-by-depth patch use them instead of `cameraPosition`/`viewMatrix`. No fog
numbers changed. The terrain renders as before; everything else now takes the terrain's veil.

**Also new:** `dlAt` in the tuner (`o`/`p`): 1 = daylight at the sample point (darker looking down), 0 = at the camera
— with `placeMix` 0 that is the pre-v8 uniform veil, the per-frame colour of the old screenshots.

**What this will look like (unseen):** on the home shelf, nearly nothing changes (the origin's water *is* the shelf's).
Over the slope, the void's rim, the massif and the deep, the water — creatures, rocks, structures, the dome, the horizon —
goes to the biome's `WATER` colour at its depth: at the screenshot spot the horizon should read ~(18,68,93) instead of
(25,108,137), ~40% darker, and the surface's mirror (CPU colour, always local) should now match the dome behind it — the
one-colour horizon v8.3 claimed and did not have. **If that is too dark, the knob is the `WATER` table (slope 5–7, void
rim 8–11, arch 14), not the fog:** every non-shelf entry was tuned since v8.2 while only the ground showed it. `bright`
(9-0) lifts the whole veil for a quick read. Also unseen: the Lambert sun-by-depth now dims by absolute depth rather
than depth below the camera (creatures deep under a shallow player get a little less sun); the console line if
`sun-by-depth` warns (still wanted from v8.4).

## v9 — contact
The person's look at v8.5: the fog and the lighting are done — "a visually impressive game that looks clean", above and
below. The brief: cohesive physics. Rocks and plants could be swum through; the marine snow ignored the water you pushed;
the arm animation looked wonky; wanted: (1) collisions with every object, (2) vines, tentacles, grass, snow moving when
touched, (3) creatures' tentacles as physics objects that wrap around prey with zero clipping, (4) hitboxes from actual
contact, (5) landing on a lily pad.

New file `physics.js` (DESIGN, Contact). Nothing about the world, the fog or the look changed.
- **Colliders:** every cell's solids now sit in a 16-unit xz hash (0.5 µs a query with 650 solids; the old flat list would
  not have carried what follows). Three kinds: spheres, capsules, pads. Every boulder and bigrock (up to 420 a cell), every
  tower, spire, chimney, sponge, tube, bulb, lantern trunk and scrub is solid (`col` on the `FLORA` entry). Kelp, grass,
  bladders, raft tendrils, fans and whips are *soft*: they bend, they don't block (decided without asking; a one-line
  `col` makes any of them rigid). The megaspire's lumps went from four to seven so its flanks are closed.
- **Pads:** every pad of every raft is a disc you land on from above, are kept under from below, and are walled off at
  the rim from the side; it rides the swell and dips under weight (a per-instance `aDip` attribute on a per-cell clone of
  the raft geometry, spring-damped). On a pad you are ashore: you lie there and flop, and a flop off the edge is a
  splash. Creatures land on them too. The camera ignores them.
- **Hitboxes:** every builder gives its body as capsules (`hit`). Bodies within 90 of the player push apart by their
  actual shapes (closest points of capsules, the lighter one moving more, mass = size³; a sitting lurker is immovable),
  the player included. The old `size*0.42+1` sphere and its `reach` rule are gone.
- **Chains:** every arm ring (soft-arm, coilshell, the great, ortho, arrow, the veil's skirt), the lurker's arms, the
  eel's whole body and the jelly's tentacles are simulated chains: position-based, a spring to the swim pose, drag
  against the pose's own motion, lengths kept, a joint limit, contact with the ground, the solids and every body near
  them (own, player, prey, neighbours), two contact passes. Hunters with arms **grab** what they reach: the tips are drawn
  to the prey and the contact wraps them round it; the lurker in its lunge; the player's arms close on whatever it bites.
  Held by something, you swim at 55%. The player is kept out of every arm segment near it (and the arms out of the
  player), so nothing passes through a tentacle. Skinned on the CPU into one mesh per rig — the soft-arm's eight arm draws
  became one, the veil's 22 became one, the eel's 11 became one.
- **The bend:** all sway materials take twelve disturbance capsules — the player with a trail behind it that springs
  back through an impulse response (bend, recoil past straight, settle), and the nearest six creatures — and push their
  vertices out of them, root-weighted. Fans and whips moved to sway materials to take part.
- **The snow:** the marine snow carries a velocity and follows the potential flow round the player and the nearest
  creatures (pushed aside ahead, drawn in behind, a dragged skin that leaves a wake).
- **Readout:** `phys` ms (all of the above per frame). `test/physics.js` (in `build.py --test`) checks the hash against
  brute force, pad landing/under/rim/dip, chain lengths at rest and at 9 u/s, ground and body contact, the grab, the
  player out of the arms, body separation, the flow field, the trail's rebound, and the whole loop landing the player on
  a pad and flopping it off; prints the cost.

**Headless numbers** (V8, warm): solidPush 0.5 µs; an ortho's arms 35 µs + skin 20 + shapes 21 + pose 9 ≈ 85 µs a frame;
an eel 120, a lurker 100, the veil 120, an arrow 18, a jelly 25; 20 rigged creatures in each other's reach 2.8 ms (a
worst case); 30 packed bodies' contact 0.28 ms; the snow 50 µs alone, 270 with five bodies in it. Expect `phys` around
0.5–1.5 ms with a dozen creatures at near LOD; if it is more than that where it matters, the knobs are `lodNear`
(45+4·size, `Q.lodNear`) for how far out arms run, the 90-unit contact ring, and `DIST_N`.

**Unseen, in order — none of this has been rendered:** (a) **the sway shader compiles** with the disturbance loop
(`uDistA[12]`, `uDistB[12]`, `mat3(instanceMatrix)`, a `continue` in a `for`) and the raft one with `attribute float
aDip` — if kelp, grass, bladders, rafts, fans or whips are missing or magenta it is `swayMaterial`; the fallback is to
empty the `push` block. (b) **the arms**: they should look like the old animation with weight — lag on a turn, drape on
the floor when the creature lies down, nothing through the mantle; if they jitter, `ks` down / `damp` up on that
`armRing`; if they stream backwards while swimming, the rest-relative drag isn't doing its job (`simChain`, `rvx`). (c)
**the wrap**: an ortho or a lurker on you should close its arms round the mantle and you should feel the 55%; if the arms
only point at you, `reach*1.3+…` in `updateHunter`/`updateLurker` or the 8/s pull in `simChain`. (d) **the eel** as a
chain: it should snake, and slide round rock instead of through it; if it kinks, `cosMax` 0.72 up. (e) **the jelly's
tentacles** parting round you. (f) **the bend**: swim through kelp, look back — the stalks should recoil and settle over
a second and a half; grass under a fish should part; if the bend is too big or too small it is the `1.15` head amplitude
and the `2.6` cap; if it looks like the whole plant slides, raise `hb`. (g) **the snow**: a wake behind you and a bow
wave ahead; if it looks like a vacuum cleaner, the `0.6` skin drag in `flowAt`/`updatePlankton`. (h) **rocks**: you stop
at boulders now; the reef's towers and tubes are solid; the camera bumps out of boulders (it lerps at 8/s, so a shove,
not a cut). (i) **the pads**: porpoise onto a raft and stop there; try the huge rafts in the canopy. The dip should be
visible on small pads and invisible on huge ones. (j) **fps**: the readout's `phys` figure is the number to send back.

## v9.1 — rocks
The person's look at v9: "works great"; the floor's solid things are "awesome"; but (a) some physics objects don't affect
you — "the little triangles on the ground in the shallows" (the fans, soft in v9); (b) vines don't move when you run
past them; (c) what bends does it "like in photoshop when people try to edit their figures"; (d) rocks "still let you
clip through them constantly".

- **(d) Ellipsoids.** Every dodecahedral rock is now an ellipsoid with its real stretch and tilt (`addEllipsoid`, the unit
  sphere through the lump's affine world transform; the push goes into unit-sphere space and out along the ray). v9's
  spheres took the shortest axis of a lump — a stretched crag lump was open along 46% of its long side, a bigrock along
  six units, and the crags always had this. Boulders, bigrocks, the lumps of every crag, tor and ledge, and both arches.
  Tested: 300 points inside a 3:1 tilted rock all leave it; a point two along its long axis is set 3.9 out.
- **(a) Fans** are rigid and solid (a flat ellipsoid), back on `MAT`.
- **(c) The bend reads the plant on its own stalk** at the vertex's height (`axis` on the sway material), so a kelp crown
  moves as one and the stalk bows; rafts, being clusters of tendrils, still read per vertex.
- **(b) Flow bends flora.** The potential flow the snow follows now bends plants too (`uDistU`, `KFLOW` 0.45): a plant
  2–3 units off your path is swept aside as you pass and eases back; before, only contact moved anything.

**Unseen:** (a) the sway shader compiles with the third array and the flow branch (`exp`, `normalize` of a `vec4`
product); (b) kelp should bow, not smear — if the crown still shears, the `axis` flag is on the wrong materials; (c) the
strength of the pass-by bend is `KFLOW` (scene.js) and the cap `2.6`; (d) rocks: nothing through a boulder or a crag
face now; the push is radial from the rock's centre, so a very long lump can slide you a little along its surface —
if that reads as "slippery", the normal-direction push is the next step; (e) fans stop you.

## v9.2 — the rock itself
The person's look at v9.1: the vines "don't move at all at the bottom", the top moves slightly and dodges the tail rather
than the head; rocks still let "half my fishy body" in — "the hitbox is closer but not perfectly accurate to the actual
shape of the rock"; the bendy look is accepted for now ("we might just need a better physics system eventually"). Asked
for: rocks with collision, and vines that move out of the way when touched — "not just the leaves".

- **Rocks are their own twelve faces.** `addRock`: a dodecahedron's face normals through the lump's inverse-transpose
  transform, offset by its inradius; a body inside all twelve planes leaves along the least-penetrated one. Exact for the
  convex solid that every rock here is (tested against the rock's own vertices and 1000 interior points; the corner test
  the ellipsoid failed passes). Boulders, bigrocks, every crag/tor/ledge lump, both arches. The ellipsoid stays for fans.
- **Bodies are capsules against rock** (`bodyPush`): centre, nose and tail are each pushed out and the body follows —
  the other half of "half my body in a rock" was the snout of a 3.4-unit finback tested as a 0.9 ball. Creatures too.
- **A stalk pushed at the bottom moves from there up.** The sway shader reads each stalk at the body's height along it
  and applies that push to everything above it, tapering to the root below — so the base moves when you are at the base,
  and the top goes with it. Rafts read per tendril. The `hb` root ramp is gone; `H` (the geometry's height) replaces it.
- **The body capsule runs nose to tail** along the facing, not behind the velocity, so plants dodge the head.

**Unseen:** (a) rocks: nothing in a boulder, a crag face or the heap now, at the corners too; a body sliding along a
big face may flicker between two faces at an edge — a jitter, not a gap; (b) kelp and bladders: swim into the base of a
stalk and the whole stalk should lean away from your knee height up; if the top over-swings, the `min(h/hd,1)` is where
a softer profile would go; (c) the shader compiles with the new block (`Cb`, `hmax`, `strand` base).

## v9.3 — flat rock (this build)
The person's look at v9.2 after a day of play: the rocks hold ("good job on the last one"). What they learned about rock:
the rockfall "looks incredible" — rock completely covering the ground, flat and wide, pockets forming from placement;
"certain large rocks with only a few faces look quite strange and low in polygon relative to their surroundings"; the
area under the great arch (the massif; they first wrote "spire", then confirmed the arch) is "terrible" — v7.3's brief
for "extremely rocky" had meant the rockfall's sheets of rock over the floor between the legs, not a heap: "a normal stone
environment, smooth and with as many flat rocks as possible", the trunks keeping their mass; the "snowmen" (tors) are far
too common — an occasional underwater oddity, not a landmark for the whole game: none above water, ~90% fewer below, a
few in a cool place.

- **Facets** (`rockGeo`, DESIGN Structures): every kit lump (crags, tors, slabs, ledges, bigrock, both arches) is drawn as
  sixty facets — each pentagon split from a centre pushed 1.4–3.5% of the inradius *inward*, a shade per facet (±7%).
  Inward so nothing sinks into rock: the collider is unchanged and exact; a body at the middle of a big face hovers by
  at most ~1 unit on a 30-radius lump. Small boulders keep the 36-tri dodecahedron.
- **Sheet rock:** `slab`/`slab2` structures (seven wide flat lumps, shingled). **Bigrock** is a low cluster of four flat
  lumps (4.5–11) instead of one dodecahedron (6–15); its lumps are its colliders.
- **The massif:** the heap under the crown (460 round boulders settled 46 high) is a **pavement** of ~170 flat slabs over
  the floor (`site.pave`), tops 5–20 over the ridged massif, ~100 of open water under the crown. The structure table
  went from 35 crags and tors a cell to 25 slabs + 2–3 crags; `torm` is gone; bigrock 45 → 18. Outcrop boulders on the
  trunks are flat toward the edge and thick at the piers, no longer stacked two high; mounds and piers unchanged. Terrain
  unchanged.
- **Tors:** 147 → 17 scattered (one try a cell in the rockfall and the spires; none on land or in the massif) + **the
  cairns**: seven in a ring on the pit's rim (`CAIRNS`, r 118–138, 35–45 tall). Spires and drop got a slab or two each
  where the tors were. The rockfall's own table is otherwise untouched.
- `bigsFor` draws its rng exactly as before and `slab` took `torm`'s slot in the entry order, so every crag and
  megaspire in the world is where it was. `merge()` multiplies a geometry's own colour attribute in (the facet shades).

**Headless numbers:** structures 589 → 566, their tris 103k → 195k for the whole world (the far layer draws whatever
regions are in the frustum — about +7% of the 1.5M seen at the arch canopy; the readout's tris figure is the one to
send back). Massif cells ~1000 solids at ~39 per hash bucket (v9.2: ~36). Rockfall cell 619 → 644 solids (bigrock's
four lumps).

**Unseen, in order:** (a) **the facets** — the lumps should read as chiselled rock with visible planes, not noise; if it
is noise, `ROCK_JIT` (0.07) down or `ROCK_DENT` (0.035) up in flora.js; if the facet triangles show as a star on each
face, `ROCK_DENT` down; (b) **under the arch** — sheets of rock over a ridged floor with open water above, the trunks
still massive; if it is too bare, `pave.n` (200, world.js) up and `slab` per[14] (16) up; if the slabs look like plates
lying on the ground rather than rock, the 0.34 y-stretch in the pavement and 0.42 in `slabGeo` up; (c) **bigrock**
— a wide low rock, not a saucer: `sy` 0.7 on its main lump; (d) **the cairns** — seven pillars around the pit; they
should clear the rim rubble; (e) fps/tris on the readout at the arch; (f) the spires and the drop with a couple of slabs
and almost no tors; (g) the small arch's feet went flat too (same code).


## v9.3 docs — PLANET.md (no build change)
The creature ecology audit began and went upstream: `PLANET.md` records the planet (late-G/K star, 1 g with 1 unit = 1 m,
one large close moon and 6–9 m tides, 28% O₂, a basalt seamount, a chemocline at −450 below which the water is anoxic
and drains the player, 26–28 °C mixed layer to ~3 °C on the floor), the green gradient (green to ~−20, olive to −60,
nothing photosynthetic below ~−150, the deep's flora re-read as animals), the three clades as constraints under a
"no clade has all of jaws, bone and warm blood" rule, cross-clade rules (eyes, blood tint, shell colour by water
chemistry, geometry language), the niche audit of the v9.3 roster, the conflicts with the game (`GRAV=14`, grass on the
terraces, the ortho and the abyssal in the dark) and an Open list. README, HANDOFF and DESIGN point at it. `tethys.html`
is unchanged (v9.3, still unseen).

## v9.4 — 1 g, and the roster (this build)
The person answered the audit's open list: the clade names (ringmouths, slowbloods, hingeshells), three playable clades
for now, the jelly as its own clade (drifters; overhaul later), species by niche, mechanics after the creatures look
right, and **the game's gravity follows the planet**: `GRAV` 14 → 9.8 (world.js). `PLANET.md` updated: the refugium
replaced by a founders story (a young volcano, three lineages radiating), and a **proposed roster** of 31 species — 15
new, by family and niche, with a build order (hingeshells first: sickle, trap, tread, hose, flicker). Build + tests pass
(the smoke test's `sun-by-depth` console line is the stub's missing shader chunks, as since v8.4).

**Unseen:** (a) breaching — a sprinting finback should clear the surface by ~8.5 instead of ~6, and hang longer;
porpoising at the surface is floatier; (b) the flop — ~0.98 s in the air per flop and ~3 u/s on the flat instead of
~2; if it reads as bouncing, the 4.8 up-impulse in `updatePlayer` down to ~4; (c) splash particles fall slower;
(d) beached creatures flop further too (same model, `rnd(0.7,1.3)` cadence). Everything of v9.3 is still unseen.

## v9.4 docs — FLORA.md (no build change)
The flora audit went upstream: `FLORA.md` proposes the sessile life — three energy sources (sunlight, suspended food,
chemistry; "chemosynthetic plants" corrected to mats and animals-with-symbionts), a six-test plausibility filter (light,
drag, attachment, grazing, nutrients, energy), five founder lines with shared signatures (weed; polyps as the drifters' fixed stage; crowns as sessile ringmouths;
cones as sessile hingeshells; sacs), Earth as reference never template, an eight-bauplan
grammar (`grow(spec,seed)`: axis, branch, blades, tuft, cup, disc, mound, float), a roster of ~40 species by band with
the reason each wins its spot, the cuts (rooted lily pads, underwater trunks, the boring fungus, kelp in the air, green
below −20, the tower in the surf, bulb, grass) and the generator plan: three variants per species baked at load into
one geometry and chosen per instance by an `aVar` attribute (one draw call), `pigment(h)` tints by depth, `flow(x,z)`
faces filter-feeders across the current, `band` gates by ground depth. Praised things re-read, not removed: the canopy
as a float colony (asked), the towers as two species, the lanterns as lure-feeders. README, HANDOFF and PLANET point at
it. `tethys.html` is unchanged (v9.4, unseen).

## v9.5 — the flora grammar
The person answered FLORA.md's open list (founder lines yes; the canopy's tendrils as plant roots had no job — they stay
as fishing lines on float colonies; the stipe lays flat at the surface; both towers; one draw; FLORA.md; giants always).
Built, unseen:

- **`grow.js`**: eight bauplans (`axis`, `branch`, `blades`, `tuft`, `cup`, `disc`, `mound`, `pads`/`line`), the lines'
  detailing (`polypTip`, `crown` with its eye ring, `coneShell`), `pigment(h)` (the green gradient as one function),
  `flowYaw(x,z)` (contour direction), and `species()`: three variants of a species baked into **one geometry** with a
  per-vertex `vid`; the cell gives each instance `aVar` and the vertex shader collapses the other two variants to the
  origin (scene.js `VAR_GLSL`; in the sway materials the collapse comes first so collapsed vertices skip the
  disturbance loop). New materials `MATV` (rigid variant flora), `MATS` (the stipe), `MATM` (mid weed); `MATK` gone.
- **placeFloraType**: `photo` (tint by `pigment` of the ground depth), `flow` (yaw across the current), `band` (a
  ground-height gate), variants (per-variant colliders and pads), and a surface cap (a floor entry whose `top` would
  stand into the air is shortened in y, or skipped). Every species geometry is cloned per cell (instance attributes).
- **The roster in the game** (FLORA.md has the reasons): weed — turf, wisp, strap (the flats' grass replaced: a weed
  with runners), chain, grape, **stipe** (the kelp rebuilt: floats at the nodes, spiral blades, a whorl laid flat under
  the surface; `reach` like the bladder), ladder, ribbon, bladder (browner), **raft** (flat pads, floats, a keel of
  short fronds); polyps — **colony**/**colony2** (the big rafts re-read: olive skin, a pale gas float crested above the
  water, fishing lines of four kinds 10–100 deep, cut from ~190), table, horn, rusthorn, dome (bulb replaced),
  rustdome, **bommie** (the tower shortened to 3.6–4.6 in the passes, pocketed), **tower** (11–14, dull, moved to the
  terraces and the drop's feet), fan and whip (flow-faced), pen; crowns — lily (a fan crown across the flow, eye ring),
  tulip, loop (an elbowed tube with a crown in it); cones — cone (crowds in the tide band, the surf, the arch's legs);
  sacs — tube (ribbed / elbowed / double-walled variants), cup, burr, star, barrel, sponge kept; mats — beard (rust
  stalk tufts), iron (banded rust domes). **olddome**: the first giant, a structure (14–26 wide, ~4 in the world,
  appended after slab2 so no rock moved). `grass` is gone (turf on the reef, strap on the flats, nothing on the
  terraces — the PLANET conflict closed); `kelp`, `bulb`, the old `tube`, `raft2`, `raft3` replaced.
- Far impostors: the stipe as a stretched card with a canopy pad; the colonies as olive octagons.
- The per-cell flora rng stream changed (creature spawn points shift, as in v9.3); structures did not move.

**Headless numbers** (real primitive counts, one variant drawn): a pure reef-top cell ~154k tris (was ~80k), the
stipe forest ~162k (the kelp was ~110k), flats ~91k, rockfall ~81k, terraces ~122k. Draw calls per cell rise by the
new species count (~10 on the reef top). The stub gained `Vector3.cross`.

**Unseen, in order:** (a) **the readout in the stipe forest and on the reef top** — ms first; the tris figure will
read ~3× for flora (collapsed triangles are counted); if the ms creeps, the stipe's `per` (900) and the cones/tubes
are the knobs, then two variants instead of three; (b) **the variants**: three distinct forms per species, one per
instance, nothing flickering or doubled — if every instance shows all three at once the `aVar` attribute isn't
binding (makeInstanced's clone), if the sway plants vanish the `VAR_BRANCH` else-block is wrong; (c) **the reef top**
vivid and rigid: tables, antlers, banded domes, the short spiny bommies in the passes, cone crowds at the water's
edge, tubes in clusters; (d) **the stipe**: floats up the stem, blades flat, a canopy under the surface and nothing
in the air; if the floats read as discs, `s:[1,0.03,1]` up; (e) **the colours**: green on the reef flat, olive on
the shelf, gold-brown at −60 — one plant shading along a slope; (f) **the colonies**: a pale crest above the water,
lines below, the pads still take weight; (g) **the lilies** on the terraces all facing one way and closing nothing
yet (withdrawal is a hook); the eye rings should read as dots; (h) **beards and iron** on the rockfall: rust tufts
and low banded domes, not orange noise; (i) the old dome, four in the world; (j) the far stipe cards from 600 units;
(k) the tussock and whip still drawn (they carry a zero `vid`).

## v9.6 — five pictures
The person played v9.5 and sent five screenshots (8 Sep): the reef's variants, colours and the stipe forest were not remarked on;
the readout at the spires and the terraces said **120 fps / 8.3 ms, 278–346 draws, 1.2–2.3M tris** (the tris figure counts
the collapsed variants), so the flora grammar's cost is fine on desktop. Diagnosed from the pictures and fixed, unseen:

- **The sideways weed** (kelp forest): the `ribbon`. `bladeAt` starts every blade level with the floor — right for a frond
  off a stipe, wrong for a blade a float lifts — so the ribbon's negative droop only raised its 9–16 m blade from 16° to 41°
  and it lay along the ground with its float at the far end. `bladeAt` takes a start angle (`a0`); the ribbon leaves its
  stub at ~60° and curves to vertical under the float (rises ~8 of a 9 m blade, reaches ~3.6 sideways).
- **The spires' arms**: stub cylinders centred on the trunk's surface, narrow end up and tilted, so the tip leaned into the
  wall. Now three cones with the base sunk in the trunk (`rT(y)`, the trunk's radius at that height) and the tip out and a
  little up. The megaspire is the same figure.
- **The "little trees of three lines"** on the forest floor: the **strap** (the flats' pasture: four tall narrow blades on a
  runner) standing alone in the kelp and bladder forests, dark at that depth, read as three lines from a point; the
  **grape** beside it (three beads on a half-metre stick per node) read as a row of tiny trees. Strap: flats only, rebuilt
  (six wide short blades leaning both ways, every foot on the runner); **turf** is the forests' ground layer (1:700, 4:700);
  grape: the bunch lies on the runner, no stick (228 tris a variant).
- **The terraces' "vases stapled to the floor"**: the kept `sponge` (a cylinder with a flat black lid and a stub, 230 a
  cell). FLORA.md already listed it as the sac line's *vase*, so it is one now: `vaseB` through `cup()` — a lathe with a
  waist, a flared lip and a dark inner wall so the mouth is a hole, not a lid; variants tall / paired with a fused bud / a
  squat urn; ivory-dun-grey (`SACT`); 70 a cell on the terraces (16 spires, 14 bladder forest, 12 plain, 16 massif),
  `field`-clustered into gardens. (`spongeGeo` was defined twice in flora.js; both gone.)
- **The big low-poly lump beside the boulder field**: rock facet **level 2** (DESIGN, Rock) — 240 tris a lump, creases along
  the block edges, per-face and per-facet shade, still inside the collider (checked headlessly: max overshoot −2.6e-9).
  Kits, the massif's crags and the arches; ledges stay at level 1; boulders plain. `Q.rockLvl` 2 on high, 1 on low.
  World structures 197k → 767k tris (about half in view at once); bigrock 240 → 960 an instance.
- The facets draw from a sub-rng seeded by one draw of the kit's (`rockLump`), so a future facet change won't move the
  lumps; this once, the kits (crag, tor, slab, bigrock, ledge) are laid out a little differently. Structure *positions* did
  not move (bigsFor's stream is untouched); the per-cell flora rng stream changed again (vase and turf rows), so creature
  spawn points shift, as in v9.3 and v9.5.

**Unseen, in order:** (a) **the readout in the rockfall and at the arch** — the far layer now carries ~4× the structure
tris; if the ms creeps, `Q.rockLvl` 1 is the knob, then level 2 for the arches only; (b) whether level 2 reads as
fractured rock (planes with spall) or as noise — if noise, `ROCK_JIT` down to 0.05 and the midpoint pull to 0.1–0.3;
(c) the ribbons standing, leaning ~25°, floats up; (d) the spurs on the spires; (e) the vase gardens on the terraces
— hollow mouths, three forms, gaps between gardens; (f) the forest floors: turf, no sticks; the grape as bunches;
(g) the flats' strap as a lawn (not seen in the five pictures; if it still reads as lines, cut it to 2:1200 and say so).

## v10 — no biomes
The person played v9.6 ("looks great", the terraces and the shallows especially) and then vetoed biomes: the world is a
volcanic island and should just *be*; life favours conditions. Decided (8 Sep): both arches and the massif go ("structurally
unbelievable"); the rockfall stays but the rock placement gets a cleanup; terraces as rings everywhere they're not buried; a
caldera lagoon; the HUD shows depth, no name; wind and current directions left to Claude. Built, unseen — everything moved:

- **`world.js` rewritten from the geology** (PLANET, Geology): the caldera (floor −22, rim of land at r 245 with passes at −14),
  the shield profile, eight 12 m terraces −60..−156 as rings (r 700–1000), the collapse (scarp 75 m at r 340–430 in the sector
  round 3.9 rad, a hummocky fan to r ~1100 that buries the terraces, blocks out of the water at the scarp), the dike swarm on
  the old flank (0.35 rad: radial ridges every 2π/22, 8–34 m, r 700–1200), two rift arms (2.6, 5.6) with the pit crater at r
  470 on arm 0, the fissure vents at r 1200–1420 on arm 0, the flank cone (the island) on arm 1 at r 500, the apron, the void.
  Wind toward 3.49 rad (the waves strike the old flank), current toward 2.3 (it strikes the north-east flank; the canopy sits
  in its wake at 2.3 ± 1). **Nine condition fields** per point (`FI`), `fixF` for steepness, `envW` tolerance envelopes,
  `waterColor` by depth/turbidity/plankton/heat. `sectorW` and the wave function kept; `STEPS`, `STEEP_*`, `massifW`, the
  outcrops, `archSite`, `BIOME_NAMES`, `BCOL`, `WATER` (bar `WATER_CANOPY`) gone.
- **Placement by envelope**: every flora entry `per`+`env`; `SPAWN` a list of `{kind,n,env}` (predators on their prey's
  ground: eels in the weed and the rubble, lurkers on rock, herds on sand and turf, orthos in current and at the vents, the
  abyssal below −400); `placeFloraType`, `bigsFor`, `impostorsFor`, `spawnChunkCreatures` (`cellW`, `chunkPoint`) evaluate it.
  Big rock where the geology puts it: crags/tors on the fan (young rubble), slabs on the dike crests (`rel`), old domes on fed
  rock; boulders 330 on the fan, 60 on bare rock (`boulder2`), 12 on sand (`boulder3`). ~220 structures, 262k tris (v9.6: 590,
  767k). The far layer's impostor stream and the cell rng streams changed: every creature and plant is somewhere new.
- **Cells** carry a field grid (`fg`) instead of the biome grid; `terrainColor` by conditions; glow clouds by depth.
- **The arches and the massif** removed everywhere (`archLayout`, `ARCH*`, `archTop`, `tideTint`, the massif kits, biome 14,
  the arch solids and draw, `SPAWN[14]`). Landmarks: pit and chimney fixed by the geology, the rest searched by predicate.
- **HUD**: the depth in whole metres, bottom right, faint, under the water only; the name popup is gone.
- Tests: `test/smoke.js` reports the substrate under the player instead of a biome; `test/physics.js` prints the culprit when
  a clear point moves (it caught rafts bleeding 100 m past their band: the `h` soft edge is now capped at 10 m).
  `makeSchool` is unreferenced (the school spawn branch went with the biome table; the boid ribbon is still owed).

**Headless survey** (`sample` on a 40×40 grid): the lagoon at −22 inside the rim; sand in the lee and the lagoon, rubble on
the fan, rock on the old flank and the rim, mud from −260 down; food 9 on the struck flank, 0–1 in the lagoon; the dike
crests, the fan and the fissure where they should be; the terrace profile at 1.0 rad −58, −71, −97, −123, −143, −152, −156.

**Unseen, in order:** (a) **the caldera from the start** — the lagoon floor, the rim as land, the passes, the reef polyps on
the rim's outer slope; the start is now in 22 m of water; (b) **the terraces as rings** — 12 m risers, treads ~28 m: if too
narrow, widen the band (700–1000 → 700–1100 in `tS`); (c) **the collapse**: a real scarp above the rockfall, the fan below
it, crags and boulders on the fan and nowhere else; (d) **the dikes**: radial ridges with pinnacles on the crests, sheet rock
along them — if they read as a picket fence, fewer (22 → 14) and more varied (the fbm in `dkr`); (e) **the vents** on a line;
(f) **the water**: no colour jumps anywhere; siltier in the surf and the lee, greener on the fed flank; (g) the weed forest
on the north-east flank only, the flats on the lee, the lime reef only round the rim; (h) the depth readout; (i) rocks that
still make no sense where they stand — say where.

## v10.1 — no magic
The person played v10: "the best version of the game by far"; the terraces read as stairs but the elevation is right and the
ledges were the wrong thing. Rule added (8 Sep): **fully believable from the logic, no magic anywhere, even for gameplay**.
Decided: the lily pads go entirely (nothing floating takes weight); a floating raft with man o' war lines pulled by the
current is wanted; all bioluminescence goes until it can be done accurately; the current as physics next. Built, unseen:

- **Rafts** are a tangle (Sargassum's shape: branching fronds with bladders at the tips, no top, no bottom, half out of the
  water); **colonies** are a gas float longer along the current, a mass of zooids under it, and fishing lines that **trail
  downstream** (`line()` takes a drift; the entries are `flow`, so local +z is the current). colony2 is 6–10× (was 9–16): long,
  not wide. No pads anywhere: `pads()` is gone from grow.js, no species returns pads, `addPad`/`updatePads` are dead code kept.
- **The current as physics** (`chunks.js currentAt`): the water's velocity from the loaded cell's grid — along the contour in
  the sense the fixed flora face across (`flowYaw`), `CUR_MAX` 1.2 m/s at full `flow`, weaker within 8 m of the floor. The
  player is carried by it (player.js, scaled by submersion), every creature within 200 units (creatures_ai.js, re-read every
  0.4–0.6 s), and the marine snow. Rafts and colonies do not drift yet (instances are static); their lines lean instead.
- **Bioluminescence out**: the stalk fields and lantern trees, the great lantern and the heart ring (landmarks and their
  lights), the glow clouds. The deep floor gets **glass** (a cup on a long stalk rooted by a tuft) and **frond** (a quilted
  blade on a holdfast) from FLORA's roster, and pens and whips now reach −450. `GLOW` is used only by creatures' eyes and the
  veil's spots — those are next to audit (PLANET, Hooks: bioluminescence as events). `fogExtinctOnly` is dead code.
- The cell rng streams changed again (two species added, two removed): creatures moved.

**Unseen, in order:** (a) **the current** — it should be felt on the north-east flank and in the rim passes, barely in the
lagoon; if it fights the controls, `CUR_MAX` down (0.8); if creatures visibly slide, they need to *swim* against it (a
heading correction in their AI, not built); (b) **the colonies' lines** trailing one way along a flank; if they trail the
wrong way for the current you feel, flip the sign in `currentAt` (`dx=gz/gl;dz=-gx/gl`) — the flora's convention wins;
(c) **the rafts** as tangles you push through, half out of the water, green; (d) **the deep**: dark, pens and whips and glass
stalks and fronds, nothing lit; (e) the tris and draws on the fed flank (the tangles are ~150 tris a variant).

## v10.2 — the current bends the weed; the dike walls; the rafts as mats
The person played v10.1: "went really, really well", the flora "gorgeous and fitting", the game "a joy to explore"; the
current works (the player and the snow go the same way, catching it is clearly faster, going against it is felt "in a good
way"); the kelp forest and the caldera "absolutely gorgeous" ("the coolest cambrian looking thing"); the rock and the line of
vents "really really good". Three things off: (1) the weed only *seems* to move with the current — it sways and rebounds, "the
plant physics doesn't actually push plants in the direction of the current"; (2) the spires "unbelievable": needles from deep
ground almost to the surface, whatever the story (necks on the crests); (3) the colonies float on their own (fine if that's
what they do — it is) but the rafts "look super weird, like a bark or branch". Built, unseen:

- **The lean** (`scene.js` `LEAN`, `chunks.js` `currentOf`/`makeInstanced`): every sway instance carries `aCur`, the current at
  its base; the sway shader leans it downstream by 3× its sway amplitude at full current on the sway's own height profile,
  the tip dropping so nothing stretches, and halves the oscillation in a full current (a stalk in a current streams and
  flutters; the back-and-forth is surge). At the fed flank's ~0.5 m/s a 40 m stipe's top leans ~4 m, turf ~0.45 m; in a pass
  (1.2 m/s) 7.7 and 1.05 m. The colonies' lines keep their baked trail and lean a little more. Nothing drifts yet.
- **The dike walls** (`flora.js` `wallGeo`, `wall`; `far.js` `radial`, `pre`): the spires (46 a cell, to 68 m) and megaspires
  (96–160 m) are gone; on the dike crests the dike rock stands as broken walls — four tall thin lumps in a row down the flank,
  8–16 m above the crest, 14–28 long, 3–4 thick, two blocks fallen at the foot; ~170 in the world, overlapping into runs
  (headless: tops ≥ 20 m under the surface, nearest-neighbour median 11 m). In the megaspire's `BIG` slot so slab2 and the
  old domes did not move. **The colossal spire is the neck** (`neckGeo`, `LM.neck`, `LMK.neck`): the plug of one parasitic
  cone, ~65 m across and 43 m above its crest with a talus to 130, at the old spire's site (982, 198), ground −142, top −103.
  PLANET, Geology, the dikes, rewritten: walls and one stump, not needles.
- **The rafts** (`raftB`, `ys` −0.2): a flat leafy mat in the surface plane — 6–10 runners from a centre with dense small
  blades in alternating pairs and berry floats at the outer nodes, wider than thick (1.6–5.7 m across), the top just out of
  the water; ~320 tris a variant (was ~150). The far impostor discs were still the old pads' size (a 12 m disc for a 2 m
  tangle): raft r 1.25, colony 1.7 (pale), colony2 2.4.
- The per-cell rng stream shifted at the spire's old slot: chimneys, limpets and every creature moved (the structures, the
  impostors and everything before the spire did not).

**Unseen, in order:** (a) **the lean** in the kelp forest and the passes — does the weed now stand downstream and flutter
rather than rock about the vertical? If it flattens too far, `LEAN` 3.0 → 2.0; if it still reads as undecided, 4.0. The
turf and strap (2.4 m, `MATG`) are the easiest to judge: they should all lie the same way. (b) **The walls**: serrated
runs down the ridge crests, the same way on every ridge, 8–16 m tall — if they read as a fence, `per` 120 → 70; if the
segments float above the crest on the sharp ridge profile, `sink` 0.15 → 0.3. (c) **The neck**: a stump on the swarm, wider
than tall, columns round a core; whether it is enough of a vertical landmark for the old flank. (d) **The rafts** as leafy
mats you push up through, green, the berries at the surface; the tris in the canopy. (e) The far impostor discs now the
size of the real things: does the swap at the load radius still show?

## v10.3 — the tide
v10.2 seen: "everything looks a lot better" — the lean, the walls, the neck and the mats all passed on one look. The person
asked for the tide's band on the rocks and said go. Built, unseen:

- **The clock and the tide** (`world.js` `DAY_H`, `LUNAR_H`, `TIDE_P`, `SPRING_D`, `TIDE_A0/A1`, `CLOCK_RATE`, `tideAt`,
  `tideRate`, `TIDE`, `clockH`; `main.js` sets them each frame): semidiurnal on a 31.2 h lunar day (two a day, later each day),
  4.5 m at springs and 3.0 at neaps over a 13-day cycle (6–9 m range, PLANET), a game day in forty real minutes so a tide takes
  21 and the water at mid-tide moves 2.3 cm a second. Boot is mid-flood on a spring. `waveH` = `TIDE` + waves, so the medium,
  the strand, the splashes, the camera and the HUD depth (`TIDE − y`) follow with no other change; the surface mesh sits at
  `TIDE`; rafts and colonies bob on `waveH + uTide`; the far raft and colony discs are lifted each frame. The readout shows
  the tide and the hour. Headless: the rim is land along 40% of its ring at mean level and 2% at a high spring (it drowns —
  PLANET says it floods; raise it 2 m in `sample()` if land should last), 34% of it a pass over 4.5 under at a low spring;
  the island 2 → 3 → 6 ha high spring → mean → low spring.
- **The band** (`scene.js` `BAND_GLSL`, `MATROCK`, `MATROCKB`, `TERRAIN_MAT` at 0.7): by world height in the fragment — the
  intertidal ±4.5 a dark olive film, the spray zone to ~+7 bleached, and the rock 0.2–1.6 above the water *now* darker, wet: the
  line walks with the tide. Boulders, bigrocks, ledges, every structure, the neck and the terrain; not creatures or the sessile
  animals.
- **The tidal stream** (`world.js` `tidalAt`, `TIDE_U` 0.5, `TIDE_R` 900; `chunks.js` `currentOf` = `steadyOf` + tidal × rate):
  the ocean's tide going past the island, potential flow round the slope — nothing on the axis (the fed flank, the wake: the
  kelp and the canopy keep their steady current), 1.0 m/s tangential on the flanks square to it at a spring mid-tide, splitting
  round the shield, so on the dikes it fights the steady current on the flood and joins it on the ebb (1.6 one way, 0.4 the
  other) and on the collapse side the reverse; a 0.25 through-flow pass to pass in the lagoon (0.13 in the passes). The player,
  the creatures and the snow feel it; every sway instance carries `aTide` and leans to `aCur + aTide·uTideR`.
- **The kelp lies down** (`swayMaterial` `cap`): every upright water sway material folds vertices above `uTide − 0.45` to the
  water (4% of the excess kept against z-fighting), so a stipe built to the mean surface lies on it at a low spring rather than
  standing 4 m in the air. The tussock got its own material (`MATGL`) so it is never folded; nothing on land gets a current.

**Unseen, in order:** (a) **the water moving** — stand at the start and watch the lagoon's edge, or better a boulder on the
rim: does the wet line walk (a metre a minute at mid-tide) and does the surface stay one thing through it (the mesh at
`TIDE`, the waves on top)? (b) **the band** — dark film through the spring range, pale above, wet just above the water; if the
film is too heavy on the sand of the flats, `TERRAIN_MAT`'s 0.7 → 0.4; if the dark band on rock is muddy rather than lived-in,
the colour is `vec3(0.58,0.64,0.52)`. (c) **The rim at a high spring**: twenty minutes in, nearly all of it under — a reef
awash rather than a ring of land. Decide whether that is the planet or a mistake (the fix is 2 m in `sample()`'s rim
height). (d) **The kelp at a low spring**: the canopy lying on the water, not stalks in the air; z-fighting there. (e) **The
current turning** on the dikes and the fan (the readout says rising/falling): the whips and wisps should swing over ~10
minutes; the player carried the other way on the ebb. (f) The lagoon's through-flow: 0.25 m/s felt at the start — too much
for a "calm" lagoon? (`TIDE_U` × 0.5 in `tidalAt`). (g) Rafts and colonies still don't drift; creatures still slide rather than
swim against the current; the cones don't open — all owed.

## v10.4 — rock that lies on the ground
v10.3 seen: "looks awesome, I love the current". Six screenshots of rock: plates floating far off the ground on their downhill
edge, plates stacked like dropped dinner plates with thick edges standing up, huge flat sheets on ridges, and the new walls
reading as "obsidian shards stuck into the sand" — "sometimes it can get geometrically strange". A pass over the rock:

- **Why they floated.** Every structure lay *level* with a random `tilt` (±0.15 rad) and sank a fixed fraction of its scale:
  a 90 m sheet on a 20% slope was 9 m clear at its downhill edge, and the slab kit's own lumps tilted ±0.175 on top of that,
  lifting 8 m more. On the dike crests (a sharp ridge 34 m high) and the terrace treads a plate that wide can only bridge air.
  Headless, the plates' rim bottoms were 3–40 m above the ground at the 90th percentile; one hung over the pit.
- **`lie`** (`chunks.js lieOn`, `far.js bigPlace`, `placeFloraType`): sheet rock, the walls and the bigrocks take the ground's
  tilt over their own footprint (`foot`) and sink by `settle` of the drop round them. Now the rims are under the ground at
  the median and the worst wall end is 1.9 m clear.
- **Slabs** (`slabGeo`, `slab`/`slab2`): thinner (0.3), flat-lying (kit tilts ±0.03/±0.06), the shingles lower, 10–28× (was
  14–34), sink 0.12; moved off the dike crests and the treads to the **collapse fan** among the crags as the slide's coherent
  blocks (Earth's toreva blocks; PLANET, the collapse). 1–13 m proud, median 3.
- **Walls** (`wallGeo`): two courses of squat blocks — five below half buried, three or four above offset half a block, a broken
  top — and a fallen block at each foot, 4–7.5×: 6–19 m above the crest (median 11), 18–35 long, 2.5–4.5 thick, lying on
  the crest's slope. The lozenges are gone.
- **Bigrocks** lie too; their satellites' tilts halved. `LM.pit.r` 190 keeps structures off the pit's wall.
- Not touched: crags, tors, the old domes (heaps of round lumps: no edge to lift), boulders, the ledges (their pitch is the
  point: strata). The far layer's per-type rng is unchanged, so every crag and tor stands where it did.

**Unseen, in order:** (a) **plates on the fan** — flat rock lying *in* the slope, shingled, 2–4 m proud, edges in the ground;
if they now vanish into the hummocks, `sink` 0.12 → 0.06 or `settle` 0.6 → 0.4; (b) **the walls** — a jointed wall of blocks
along each crest, broken top, following the ridge down; if too squat, `s` [4,7.5] → [5,9]; (c) nothing floats — say where if
it does, with the depth readout; (d) the dike crests without sheet rock: bare ridge, wall, boulders — enough?

## v10.5 — the rock, cleaned
v10.4 seen: the walls read as columns of scales. The person: axe the whole thing — no spires, no special spire-replacement
rocks, "just normal geography based on what's nearby" — and clean the rock logic up: "we don't need more, we need more
elegant or cleaner". Done:

- **Four forms, one rule** (DESIGN, Structures): block (boulder), heap (crag), sheet (slab), stack (the cairns only), plus the
  ledge on cliffs. Each kit returns `{geo, lumps, top, foot}` (`kit()`); `rock(id, kit, o)` makes an entry with one basalt
  palette and one material. **`settleOn`** (chunks.js) is the single placement rule for near and far: a kit lies on the ground's
  tilt over its own footprint and sinks by `sink` plus half the drop round it; a single block sits any way up.
- **Gone:** the dike walls (`wallGeo`, `wall`), the neck (`neckGeo`, `LM.neck`, `LMK.neck`), the per-cell `bigrock` (now `crag3`,
  a heap at 8–24 on bare rock anywhere, far-drawn like the others), random tors (`tor` is `per` 0: the cairns' kit), `tilt` on
  structures, and the flags `lie`, `foot` (from the kit now), `settle`, `radial`, `pre`. The dike crests are bare ridges: blocks,
  the odd heap, ledges on the flanks.
- The cairns: the pit's rim is 15–50 deep since v10 and a 13× cairn is 45 m tall, so four of the seven had been silently rejected
  by the surface clamp since then; placed structures now shrink to fit (down to 4×) — five stand.
- Every structure moved once (the `BIG` list changed; the per-type rng runs by index).

**Unseen, in order:** (a) the dikes as bare ridges — enough, or empty? if empty, `crag3` `per` 1.5 → 3; (b) the fan: heaps, sheets
and the boulder field lying in the slope; (c) `crag3` on the rim's land and the terrace risers — say if a heap stands somewhere
it shouldn't; (d) the cairns at their new sizes; (e) nothing floats.

## v10.6 — the roster's builders and the bestiary
The person asked for viewable models of the roster's unbuilt species, to sign off before any is placed. Done, and nothing placed:

- **Fifteen builders** (`creatures_builders.js`, PLANET's roster): sickle, trap, tread, hose, flicker, hook, picker, comb
  (hingeshells); stone, crusher, needle, basker (slowbloods); rasp, watcher, pall (ringmouths). Each follows its clade's geometry
  language and blood tint and its eye rule. Shared kit: `trunk` (plates with joints), `leg`, `flapRow`/`flapWave` (the paddlers'
  metachronal wave, three phases a side), `mouthRing`; in parts.js `eyeRing`, `stalkEye`, `G.quad`, `trunkPose` (the hose's
  proboscis is a chain with a claw), and `armRing`'s `web` option (the pall's net, a quad per segment to the mid-angle of each
  neighbour). `coilShell()` factored out of `buildCoil` for the rasp. `MATT` (scene.js): a translucent Lambert for the flicker.
- **Action states** every anim reads the same way (`st.tell`, `st.strike`; `st.jet` as before), so the bestiary and later the AI
  drive the same poses: the sickle's claws cock and sweep, the trap's arms unfold round the outside (a horizontal fold, so it reads
  from above and never clips the sand), the hose's proboscis extends, the flicker's tail flicks, the hook's legs drop and close,
  the stone's and crusher's jaws drop, the picker pecks.
- `DEFS` has the fifteen with `build`, `size` (the roster's half-length) and `floor`/`legs` only — no role, no `SPAWN`: nothing places
  them. `ROSTER` (creatures_defs.js) lists all 30 species by clade for the bestiary.
- **The bestiary** (`zoo.js`, DESIGN Creatures): `#zoo` in the URL or `z` on the menu; one species at a time at the peak in the
  game's light, orbiting camera, caption (name; clade, family; niche; half-length), left/right to step, space (or click) for the
  strike, s to cruise, drag and wheel; z or escape back. Floor species sit at the game's clearance.
- **A preview tool** (`test/preview.js`, `test/geo.js`): the builders rendered headlessly to `test/preview/<id>.png` (four views,
  idle and action) with real geometry and a software Lambert. Every builder above was checked on it; it is the first time a session
  could look at a model before the person did. The smoke test now walks the whole bestiary (every builder, rig and anim, the strike
  fired) before the clade runs.

**Unseen, in order:** (a) whether the bestiary frames each species (the camera distance is 2× a bounding radius plus 1.5; the pall
and the veil are the test — the pall's net is 17 m across at size 9); (b) the pall's web in the game's light: black quads that shear
a little between arms as the chains move — if the seams show, `web.spread` (0.8) should match the pose the anim holds; (c) the
flicker's translucency (`MATT`, opacity 0.7) — say if it vanishes or sorts badly; (d) the sickle's claws at rest (forward, curling
down) and on the strike; (e) the tread's plates — creases between them, legs thick enough under the skirt; (f) the watcher's raised
arms (four up at ~45°, four walking with their tips on the ground); (g) draw calls: the tread is 15 meshes at near LOD, the sickle
12, the comb 10 — all bake to one for the far LOD; (h) the caption's placement against the title.

## v10.7 — the roster placed
The person saw the bestiary: "the new creatures look great". Asked whether to place these or sketch more: place these first, all
fifteen at once. Done — every species in the roster now lives somewhere (creatures_defs.js `DEFS`, `SPAWN`; chunks.js the spawn
kinds; creatures_ai.js the behaviours):

- **New behaviour** (DESIGN Creatures): the **strike** for hunters that have one (`strike {tell, dur, speed, range}`: in range the
  tell — it slows, cocks, turns to the prey — then a burst with the strike pose, the bite landing once within reach: sickle, hose,
  crusher); **burst-and-coast** (`burst {on, off}`: speed and steering on a duty cycle — sickle, hose, comb; the flaps beat and rest
  with it); the **trap** role (sits, never moves, strikes what comes within `detect`: the trap buried in the sand, the stone lying on
  its floor, both as heavy as rock for contact); the **watch** role (the watcher walks up to a standoff of 6 m and stares, follows,
  backs off, never attacks); the **hook** as an ambusher hung 5–14 m up in the weed or off a rock face (`hang`), dropping on the
  player below; the **pall** as a wanderer that keeps below the chemocline (`deep`); the **tread** as a calm grazer nothing moves;
  the crusher's `preyClade:'coil'` (the player is its prey only as the coilshell); a `face` target every creature can turn to.
- **Boids**: the school role is a loose ribbon now (`boid`: alignment, cohesion, separation among its own school's members, a
  wander of its own, fleeing the player and the school's scanned threat). Flickers in ribbons of seven over the shallows and the
  shelf, and the **darters are back** as ribbons of nine (the v4 block was the reason they went; glim stays off pending the
  no-magic audit). Needles hunt them in threes.
- **Envelopes** (first guesses, tune from what is seen): rasps on shallow rock; traps in shallow sand; hoses and hooks in the weed
  forests, hooks off rock faces too; crushers on rock to −150; watchers on the shelf and terraces; sickles on the rockfall and
  terraces; stones and a very few treads on the plain's sand; combs over the plain; baskers at the vents; pickers from the rim down;
  palls in the dark. The ortho takes needles, the eel and the arrows take flickers, the abyssal takes combs.
- **Cost**: the loaded population went from ~450 to ~1100 (most of it flickers and darters). Done for it: grazers scan for threats
  three times a second instead of every frame (was the frame's biggest cost), schools scan for threats four times a second and
  their members read the answer, the wave is not read for creatures well under the surface, and anything beyond 150 m moves every
  other frame with two frames' time. Headless, the trap tells and strikes and bites, the sickle chases/tells/strikes at 16 m/s,
  the watcher stands off at 5–7 m facing the player, the hook drops and bites and climbs back, a ribbon holds ~4 m across and
  wanders, the pall stays at −770 over −810 ground.
- **Buried**: `clear` on a def sets the floor clearance (the trap sits at 0.45, the stone at 0.8: a quarter in the sand).
- Not done, by design (PLANET's order): no temperature model (the basker is quick wherever it strays), no moulting, no detection
  modes, no variants by place. The person's principle for later (8 Sep): a niche is shared by clades at unequal shares — 90/8/2, not
  100/0/0 — filled by variants and minor species once the base forms are in.

**Unseen, in order:** (a) the readout: draws and ms with the ribbons in the shallows (thin with `ribbon` n 2.0 → 1.2 and `darters`
1.0 → 0.6 if it creeps; the population is the risk, not the behaviours); (b) do the ribbons read as fish — loose, fraying,
re-forming — or as a clump; (c) the trap: is it found before it strikes (the eyestalks are the tell; a quarter buried), and does
24 damage feel like a mantis shrimp; (d) the sickle's strike from 13 m at 17 m/s — three bites in eight seconds headless is deadly;
(e) the hook hanging in the weed at 5–14 m (legs up, still) and whether the drop reads; (f) the watcher's stare; (g) the tread on
the plain at walking pace, and that it isn't in the way; (h) the pall at −500 in a black net; (i) the stone: found by touch only;
(j) needles in threes, and whether the food web reads (needles on flickers, hoses on flickers in the weed, crushers on rasps).

## v10.8 — the swimming animation and the arms, un-janked (this build)
The person played v10.7 and reported the physics as janky: "the player character's tail moves incredibly quickly and the tentacle
appendages move around constantly. The fish only looks realistic when slowing down, but any movement jerks it back into awkward
motion." Three faults, found headlessly (`test/anim.js`, new — the run that measures them), none of them the contact system:

- **The phase spin.** Every builder's anim wrote its beat as `sin(t*f(spd))` with `t` the wall clock since page load. That is a
  phase, not a rate: its rate is `f + t*f'*dspd/dt`, so any change of speed — a key, a turn, the velocity lerp settling — spun the
  beat at a rate proportional to how long the session had run: two minutes in, the finback's tail averaged 19 rad/s while
  accelerating (4 is its real peak) and 11 while "cruising" (the lerp still converging); the soft-arm's rest pose swung the same
  way and the chains chased it. Only a steady speed, or nearly stopped (the tail's amplitude ramps down with speed), looked right —
  which is what the person saw. All twenty-one speed-driven anims now take their phase from a `swimClock(f0,f1)` (parts.js):
  advanced by `f*dt` each call, first call `t*f` so the menu, bestiary and preview PNGs start where they did. `flapWave` takes a
  phase. The flicker's `sin(t*5+spd)` (speed as a phase offset) went the same way. Tail on acceleration 19 → 2.1 rad/s;
  soft-arm tip jerk on acceleration 6.5 → 0.18 per frame. **It got worse the longer you played**; a fresh reload hid it.
- **Arms shivering against their own hull.** The coil builder's arm roots (the coilshell, the great) and the watcher's sat inside
  their own body capsule, so own-body contact pushed them out and the spring pulled them back every frame: tip jitter at idle 1.4
  (coilshell), 6.0 (great), 1.75 (watcher) — the "constantly moving" tentacles of the coilshell. Rule now (physics.js `simChain`):
  the first free point of a chain never collides with its own body (it sits where the arm leaves the hull, which the capsule
  overshoots), and any other point may sit as deep in its own body as its rest point does, no deeper. All three at 0.01.
- **The hard joint limit.** An arm bent past `cosMax` (57°) at a joint was snapped half-way straight in one pass. An arm leads a
  decelerating body by `a/ks` (0.11 units at the coil's ks 70) — a 25–40° kink on a 0.25 segment, so on every deceleration the
  coil's arms reached the limit one after another and were flung (tip jerk 10, the arm the length of itself off its rest). The
  limit is a ramp now (`JOINT_SOFT` 0.2 in cos: eased from 41°, full at 57°). Coast jerk 10 → 0.2. The grab test still closes on
  the prey (172/180 frames touching; mean tip distance 1.38 → 1.43, a little less tightly wrapped); arm cost 87 → 98 µs a creature
  with twenty in each other's reach (the rest-depth check and the ramp).
- **Poses that switched.** The soft-arm's jet pose (spread 0.35 → 0.05) toggled with shift and flung the arms on release: it eases
  now (`easer(7)`, parts.js). The ortho's, arrow's and lurker's cruise/lunge poses switched at one speed; they blend over a band
  (`smooth`). The jet impulse itself (10 u/s in one frame for the soft-arm, 7 for the coil) is delivered as a thrust over the first
  0.18 s of each 0.5 s cycle (`JET_W`, player.js): the same push, the arms no longer whipped (sprint jerk 3.9 → 1.1).
- **Taste, not asked**: the soft-arm's idle sweep is quieter (each arm ±0.09 rad, period 3.5 s, spread 0.35) and swimming brings
  it up (±0.2, spread 0.23, faster) — the v10.7 idle was ±0.2 at 0.4 Hz with random phases per arm and read as writhing even
  before the spin. Revert: `ringPose(arms,0.35+0.08*Math.sin(t*1.3),0.2,...)` with `swimClock(2.6,0.5)`.
- Not changed: the chains' springs and drag (ks/damp, ζ≈0.6) — a turn's arm lag traced at three dampings showed no ringing to
  remove; the finback's tail is still one hinge at 0.45 rad, 1.5 Hz at cruise and 2.5 sprinting.

**Unseen:** all of it — the tail at cruise/sprint/coast, the soft-arm swimming and idle, the coilshell's arms at rest and after a
sprint, the great and the watcher in the world; whether the jet still reads as a squeeze with the push spread over ten frames;
whether the softer joint limit lets a grabbing ortho's arms look slack. If the tail still reads fast at sprint, `swimClock(1.5,0.9)`
in `buildFinback` — the 0.9 is rad/s per unit of speed.

## v11 — the world above the water (this build)
The person asked for the parked land overhaul: the planet in PLANET.md decides what is above the surface; keep the art style. Built,
unseen — nothing here has been rendered (no three.js in the sandbox; the tree was looked at in the preview rasterizer only):

- **Day and night on the tide's clock** (`world.js` `LAT`, `SOLAR_H0`, `MOON_T0`, `MOON_R`, `SUN_R`, `skyDir`, `sunHA`, `moonHA`,
  `moonIllum`; DESIGN, The sky). Tropical latitude, no seasons: 15 h of day, 15 of night. Boot is late morning; sunset 11.5 h
  (15 real minutes) in; the moon full at boot (my call: a spring is full or new, and the full one makes the better first night),
  rising with the sunset, transit at local midnight with the high water half an hour behind it; new at 13 days. Three times the
  Moon's apparent diameter, nine times its light: nights under it at ~0.3 of noon, a moonless night at 0.035.
- **Weather** (`weatherAt`): trade-wind cover on a slow noise, showers ~10% of the time from a fast one; boot fair, first shower
  at 3 game hours (4 real minutes), 1.4 h long. The wind `WIND_U` 7 m/s toward `WIND_A`, real time.
- **One sky shader** (`atmosphere.js` `SKY`, `updateSky`, `SKY_FS`): gradient from `SKYC` keyframes (a 5300 K star: warm noon, amber
  dusk), the glow toward the sun, a sun disc and glare, **the moon as a sphere lit by the actual sun direction** (the phase is
  geometry) with the planet's light on its dark side and maria, **stars** in a frame turning about the pole with a galaxy band,
  **cel-shaded cumulus** on a 640 m plane drifting downwind, and a primary + secondary **rainbow** when rain meets a low sun.
  The old vertex-coloured dome and the `sunSky` sprite are gone.
- **Light by time**: a new shared uniform `uFogT` (`FOG_T`: the sky's light and its colour) scales the underwater veil and the
  from-above tint (`tintU` is a `Vector4` now); the one directional light is the sun by day, the moon by night; the hemi, the
  sun, `uDf`, the surface's reflected sky (`uSkyR`), Snell's window (`uWin`) and the glint (`uGlint`) all follow; the fog's glow
  and the underwater shimmer point at the luminary (the Hooks item). The player's light gets `0.5·(1−skyL)²` at night on top of
  its depth term — the alternative was a screen that goes black at new moon; a judgement call, easy to remove (atmosphere.js,
  `plight.intensity`).
- **Rain**: line-segment streaks round the camera above water, bright drop-crowns in the surface shader (`uRain`), thicker air
  haze, the ambience opening and rising with it (`master.gain` is written per frame now when not muted).
- **The strand's colours** (`chunks.js` `terrainColor`): olivine sand (green-olive, wet darker), dark basalt above the spray
  zone with rust patches. Modest; the old numbers are in DESIGN, Land.
- **The tidal forest** (`flora.js` `tidetree`, `MATTR`, `air`, `MATTR.land`, `farTreeGeo`): the FLORA centrepiece for the land —
  7/10.5/14 m trunks on props in the tide band, flat green crowns, on the leeward rim and the island's flat, ~530 (× field
  noise) in the world, none on the surf side; trunk and props solid; a wind sway; an impostor. Built without asking, since it
  was the document's proposal and the person said "up to you"; strike it by deleting one FLORA line and one FAR_IMP line.
- The readout shows the local hour, the sun's and moon's altitude, the phase, the light, cloud and rain. The stub gained
  `Vector4`, `ShaderMaterial`, `LineSegments`, `LineBasicMaterial`, `Color.multiply`, `Vector3.fromArray`.

**Unseen, in order:** (a) **the sky shader compiles at all** — if the sky is missing or magenta above water, it is `SKY_FS`;
the surface shader also changed (`uSkyR`, `uWin`, `uGlint`, `uRain`, the `vWp` varying) and the fog chunk (`uFogT`): a magenta
world is one of those. (b) **The first look**: late morning, sun 41° in the east, cover 0.44 — do the clouds read as cumulus
in three flat tones or as noise? Are they too big (the `/760` scale), too low (`CLOUD_H`), too dark underneath? (c) **The sunset
at 15 minutes**: the amber horizon toward −x, the sea reflecting it, the moon rising opposite — big enough (0.75°)? too bright
by day? the terminator right? (d) **The night**: the veil under a full moon at 0.3, the stars' size and count (the 14/38 grids),
the galaxy band, whether the moonlit clouds read; **whether a moonless night (13 days in) is playable or a black screen** — and
whether the player's light at night is welcome. (e) **The shower at 4 minutes**: the streaks (420, 0.06 s long), the crowns
on the water, the haze, the sound — and the bow after it if the sun is low enough (it won't be at 4 minutes; the second shower is
at ~9 h, dusk). (f) The strand: olivine sand and dark rusty basalt, or mud. (g) **The tidal forest** on the rim from the start
(swim to the lagoon's edge): do trunks on props in the tide band read as a wood or as lollipops; the crown's sway (`MATTR`
0.3 at hn 9); z-fighting or floating at the props; the impostors across the lagoon; whether ~180 on the island's flat is a
forest or a plantation. (h) **Performance**: the readout above water at sunset and in a shower (two noises per sky pixel; 420
lines) — the person tests on desktop. (i) The fog tuner's `sun` knob now scales the glow toward whichever light is up.

## v11.1 — the sea back (this build)
v11 seen: "the trees look great", "the day night cycle works". But the sea was gone above water and only the veil showed below:
the surface's Phong program failed to compile — the rain specks read `uTime` in the fragment and v11 declared it in the vertex
shader only (`ERROR: 0:989: 'uTime' : undeclared identifier`), so `SURF_MAT` never drew on either face. One declaration added.
**Unseen:** the surface itself under v11's light — the sky it reflects (`uSkyR`), the foam and the emissive by the hour, Snell's
window at night, the moon's glint, the rain's crowns on the water; everything else in the v11 list still stands.

## v11.2 — the tide's cards, the whip (this build)
v11.1 seen (9 Sep): "the trees look great", "the day night cycle works awesome", and two things wrong:

- **"The water in a strange clipped way"** from above — a row of dark wedges on the sea at a few hundred metres, kelp standing
  out of the water beyond it. The screenshots are at low water (−3.6 m): the far layer's stipe and bladder impostor cards are
  stretched to *mean* sea level and the bladder card carries a six-sided pad on top, so at a low tide the pads stood 3.5 m in the
  air in a row at the loaded-cell boundary and the cards poked out beyond it — the real kelp is folded to the water by the sway
  shader (v10.3 `cap`), the cards never were. Now the reach impostors follow the water down (`im.reach`; `cullFar` sets their y
  to `min(TIDE,0)` — never up, since the real stipes only ever reach mean level). A v10.3 defect the missing surface had hidden.
- **The whip struck** (the person: "way too earth like"): the FLORA entry and `whipGeo` are gone; the pen keeps `MATW`. The lily
  (the crown on a stalk, which they mistook for the same thing at first) stays.
- **One rng per flora entry** (`chunks.js genChunk`: seeded by the cell and the entry's id), so striking or adding a species no
  longer moves every entry after it in the table. One-time cost: everything the cell places (small flora, boulders, the cliffs'
  ledges and, downstream of the cell rng, the spawn points) reshuffles once now; the rules are unchanged, the structures (far.js,
  their own rng) do not move.

**Unseen:** the sea from above at low water without the wedges; the far canopy line at a low spring (the cards' bases now sit
3.5 m into the floor — invisible at that range, expected); the forests without the whips; the reshuffled boulders.

## v11.3 — the sea as a mirror at grazing angles (this build)
The row of dark wedges on the far water was still there in a screenshot at boot (tide 0), so v11.2's tide fix was not it. The row
is periodic at ~18 m and hangs under a straight pale edge: it is the far layer's **hidden trench** — where the loaded cells end,
the coarse terrain dives 80 m under the fine mesh in one coarse step (DESIGN, The far layer), a sawtooth of walls. Under water the
fog hides it; from above, the through-water tint paints the walls deep blue and the surface let them through. The "hairs" beyond
are the far kelp cards, seen the same way. Why now: the surface's Fresnel sky term was **diffuse** — lit by the sun — so under
the old noon sun it was as bright as the sky and covered the floor, and under v11's 16° sun it went dark and the far sea read as
glass. Fixed in the surface shader: the reflected sky is **emissive** (`uSkyR·fr·0.85`, unlit — a reflection is not lit), the
diffuse fades out as the reflection takes over, and the alpha goes to **1.0** at grazing (0.96 before: 4% of the floor at any
distance). `uSkyR` is 0.85·horizon + 0.2·zenith now (the sky the water reflects at grazing is the horizon's). Nothing else
touched: the near facets, foam and glints are as they were.

**Unseen:** the far sea reading as the sky at every hour (it should merge into the haze regardless of the sun); whether the
trench still shows from the island top (5° down at 430 m → 9% of the floor through the surface — if a faint line shows there,
the trench itself is the next thing to hide: `farPushVertex`); the near surface's transparency at low sun.

## v11.4 — the far sea, un-aliased (this build)
Four more screenshots (9 Sep, boot and on the rim): the step on the water still there after v11.3, at a few dozen metres from a
camera at the surface and ~100 m from the beach — "the waves are out of sync… the patches are all good except some difference
occurs there". They were right; it is the surface mesh. Each wave is faded out where the grid can't resolve it (`aSpace`), but
the fade was set to *finish* at exactly two samples a wavelength (`0.28L`→`0.5L`), so every wave was drawn fully aliased — a
sawtooth of facets — over a band of distance before it went: the chop at 20–60 m, the 29 m wave at 160–300 m, the swell at
260–580 m. The noon sun lit that sawtooth evenly and it never showed; a 16° sun lights its facets light and dark: the rows of
wedges, and the smooth sea beyond them reading as a lower patch. Two of the sub-effects were real geometry, not light: a faded
wave dropped its mean too (the crest sharpening puts a wave's mean 0.2 of its amplitude under zero), so the far sea sat 0.23 m
higher than the near; and the kelp canopy was folded to the *tide*, not the wave, so its tops stood 0.7 m up through every trough
— the "hairs", with the far kelp cards (built to mean level) doing the same beyond the loaded cells.

- **The fade** (`scene.js` `WAVE_GLSL`): a wave is fully drawn at seven samples a wavelength and gone at three and a third
  (`0.14L`→`0.30L`), and it fades to its mean (`WSH_MEAN` −0.195·A) rather than to zero. On the new mesh the chop goes by
  16–26 m, the 15 m wave by 56, the 29 m by 136, the swell by 260; beyond that the sea is flat at the same level as the near sea.
  The physics keeps every wave everywhere (`sp` 0): a floating thing 100 m off may sit ±0.4 m off the drawn surface, ~0.2° from
  the water — accepted.
- **The mesh** (`atmosphere.js` `sg`): `map(u)=SR(0.06u+0.94u³)` — 1.05 m between vertices under the camera (2.1 before, which
  could not resolve the 6 m chop even at the camera), ~50 m at the edge (48); same vertex count, `SSTEP` follows.
- **The canopy folds to the water now** (`swayMaterial` `cap`): `uTide − 0.45 + waveH(base.xz)`, the wave sum evaluated only for
  vertices within 1.8 m of the tide level (every capped sway material: kelp, bladders, stipes, mid weed, grass, pens).
- **The far kelp and bladder cards** stop 1.4 m under mean level (`impostorsFor` `sy`), under the deepest trough.

**Unseen:** the sea from the surface at any low sun — no rows, no step, the chop visible only near, the swell to ~250 m; the canopy
riding the waves from above (blades that dip in the troughs); from a hilltop, whether the flat sea beyond 260 m reads as too calm;
a raft or a colony at 100–200 m bobbing against a flat drawn sea. If the near chop now looks too fine-grained, the fade's upper
number (`0.30`) is the knob; if the sea beyond looks dead, the mesh count `Q.surf` (192/96).

## v11.5 — the inside of a wave (this build)
Two screenshots with the readout (sea 53,−1,4: the player at the surface, camera 0.5 m over the local wave, sun 47–49°) and the
decisive description: "I can't look at it head on or it disappears… at eye level with the surface of the water. If you turn to
face down, it's gone." That is the camera in a **trough**: below the mean level and below the crests around it. Looking through a
nearby crest's steep, translucent near face you look *inside the wave*, and what was drawn there was the far surface seen from
underneath — a back face, painted with the top look's reflected sky. So the far sea read as a pale ceiling with a hard edge at the
crest line; look down and no ray crosses a crest, so it vanished. The mean-level and aliasing fixes of v11.4 were real, but the
edge was this.

- **A back face seen with the camera in air is the water body** (`SURF_MAT`, `!gl_FrontFacing` under `uUnder<0.5`): opaque, unlit,
  the through-water colour (`TINT_COL·uWin`), no glints. Through a crest you now see dark water, as you would.
- **The surface writes depth** (`depthWrite:true`): a crest's front slope hides the slopes behind it. Until now, from a low
  camera the far waves' back slopes were back faces drawn *over* the front ones in index order (v8.3's "both slopes drawn over
  each other"), which the topside look happened to survive and the fix above would not have. Transparent things beneath the
  surface (jellies, the flicker, ink) are sorted before it and blend as before; the rain streaks that fall below the water are
  now hidden by it, which is right.
- The physics test failed once and passed on three reruns: a random-probe check (`points inside are pushed out`), pre-existing
  and flaky, not touched.

**Unseen:** the surface at eye level from a trough — dark water through the crests, the sky above them, no edge; the far sea from
a low camera with the back slopes hidden (it should look the same, only cleaner); the surface from under water with depth on
(jellies and the flicker still visible through it); breaching, where the camera flips sides. If anything under the surface
has vanished from above (a splash, ink), that is the depth write.

### v11.6 — the water line: the flicker, the sort, the shimmer
Seen (9 Sep): two screenshots ten seconds apart from one spot at eye level, the whole lighting in the air set in one (sky dome, the
surface topside with its reflected-sky band, the far waves' undersides hazed pale overhead) and the sea set in the other; then a
17 s video at night, rising toward the surface: the floor steady, a broad glow over the surface switching on and off every 2–5
frames (measured on the frames: the upper band alternating between two levels, the lower two bands flat). Two causes, both fixed.

- **Cause:** `updateAtmosphere` decided `above` by `camera.y > waveH(camera.xz)` every frame, with no hysteresis and no link to
  `player.camAbove`. `camAbove` only clamped the camera's *target* 0.5 clear of the wave; the camera lerps behind it (τ 0.125 s)
  at a different x,z, and the chop (6 m, ~3 m/s) moves under it, so the camera sat a few centimetres on the wrong side for runs
  of frames — and every uniform keyed on `above` (fog, hemi, sun, `uUnder`, the sky and water domes, the tint, the shimmer)
  flipped with it. Measured headless hovering at the line: 21–56 wrong-side frames in 3000, clearance down to 0.00 (the wave
  through the near plane).
- **Cause 2, the video:** three sorts transparent objects by the NDC depth of each object's *origin*; the surface's origin is the
  camera's snapped x,z at `TIDE`, so near the line it is within a metre of the camera and hops a grid step at a time — in front of
  the camera plane one frame, behind it the next (at pitch 10°, yaw 0, its view depth is 0.06 − 0.98·dz for a snap offset dz of
  ±0.5) — and the surface swapped places with the shimmer sprite (90 m, additive) every few frames: drawn under the mirror the
  sprite is blended down to 26%, drawn over it it adds on top. The same swap hit the jellies and the snow. v11.5's depth write did
  not cause it but made the two states further apart.
- **Fix 2 (`atmosphere.js` updateAtmosphere):** `surface.renderOrder` is −1 under water (the farthest transparent thing on any
  ray, drawn first) and +1 above (everything transparent is beneath it, drawn last); rain and spray are 2, in front of the sea from
  above (until now, from above, the surface would have blended over them). The shimmer sprite from below is always over the
  surface now — the brighter of the two states in the video is the one that stays.
- **Fix 1 (`player.js` finishPlayer):** the camera itself is held `CAM_CLEAR` 0.35 clear of the wave at its own x,z, on its side,
  after the lerp and the hurt shake; flips of `camAbove` are at least `CAM_DWELL` 0.5 s apart. **`updateAtmosphere` takes the
  medium from `camAbove`** in play. Headless after: 0 wrong-side frames, clearance never under 0.35; legitimate crossings
  (porpoising) flip exactly once each.

- **Cause 3, the second video (daytime, rising to the surface):** with the flicker gone, a straight horizontal edge sweeping down
  the screen to the horizon in five frames, a pale wash below it, the surface's dark facets above. The shimmer sprite (90 m,
  additive) hung 1.5 m *under* the surface: rising, the camera came up underneath it (a glowing ceiling half a metre overhead
  across the whole sky — the "bright sunny shade"), then the near plane sliced it (the edge, descending as the camera rose), then
  it was culled at its plane. The sprite's plane was inside the wave band, and the shade was under the water rather than on it.
- **Fix 3 (`atmosphere.js`):** the sprite hangs `SHIM_H` 1.5 *above* the surface, clear of every crest, and draws before the surface
  (renderOrder −2), so the surface blends over it — glitter on the water, seen through the window and the mirror; an underwater
  camera can never reach its plane. The surface's alpha takes 62–74% of it, so its strength is `SHIM_A` 1.4 (0.9 before). The
  refracted glint's onset at the critical angle (a hard cut where `refract` leaves total internal reflection, visible only with a
  low sun in its azimuth) is masked to a fade (`smoothstep(0.60,0.72,cv)`, eta 1.25).

**Seen (9 Sep, third video, 12 s, four crossings):** "looks great… much more fluid and seamless". Measured on the frames: the only
frame-to-frame jumps left are the four crossings themselves (one frame each), nothing within a medium. Also visible in it, not yet
raised by the person: from just above the water at grazing, the near sea is big flat wedges — the per-facet Fresnel (`fr=(1−cv)³`
on the flat-shaded normal) swings hard at grazing with small facet tilts, and the foreshortened grid reads as geometry. A candidate
fix is the mean normal (up) for the Fresnel term with the facets kept for the diffuse and the glints; asked, not built.

**Unseen:** whether the glow on the surface is steady now (it should be the brighter state, always); the rain over the sea from
above, now drawn in front of it; whether the line is quiet while hovering at it; the single snap on a real crossing (it is one pop, not a fade —
a fade between the two sets is possible if the pop offends); whether the 0.35 clearance ever shows the wave cutting the view
(it is above the near plane, 0.2, so it should not); the camera riding the chop when pinned against a fast wave.

### v11.7 — the crossing crossfades; the sea from above unwedged
Asked for after v11.6 was seen ("fix these issues"): the one-frame pop on a crossing, and the flat wedges on the near sea from just
above at grazing (both visible in the third video).

- **The crossing (`atmosphere.js` `medK`, `MED_T` 0.3, `applyFog(k)`):** the camera's side still flips in one frame (the surface's
  look must), but the fog (density, tail, share, and the veil — the fog chunk in scene.js now mixes the water's veil against
  `fogColor` by `uFogP.w` instead of switching on it), the fog colour, the hemisphere pair, the sun, the player's glow, the
  tint from above, the domes (the sky fades in over the water's dome by `uMix`; the sky material is transparent for it), the snow,
  the shimmer and the audio all mix linearly over 0.3 s. Boot and a respawn are instant (`snapMed`). Traced headless: every value
  ramps over 18 frames, nothing else steps. The fog tuner (main.js) passes `medK`.
- **The sea from above (`SURF_MAT`):** the Fresnel and the window read the view angle against the mean surface (`vNup`), not the
  flat-shaded facet. The facets still light the diffuse, the specular and the glint.

**Seen (9 Sep, fourth video):** "the transition reads a little odd" — a "black foggy something" on going above (the water's veil
mixed into the air fog and the sky fading over the water's dome: teal on the shore and the sky for 0.3 s); and "the surface from
below has changed a lot… less striking" (the mean normal on the underside's window). "Better than before by far", but must be
seamless and fast.

### v11.7.1 — the crossing, second cut
- **Only the light fades.** The fog (density, tail, share, the veil model) and the domes switch with the camera's side, in the one
  frame the surface's look switches; the hemisphere, sun, glow, tint, snow, shimmer and audio fade over `MED_T` 0.25 (0.3 before).
  The fog chunk switches on `uFogP.w` again; the sky dome is opaque again.
- **The underside's window is per facet again** (`cv`); only the topside Fresnel reads the mean normal (`cm`).

**Unseen:** the crossing (the light fading over a quarter second under a medium that switched at once — if it still reads as a
pop, the remaining step is the surface's look at the flip frame, which is the membrane itself); the surface from below, which should
be v11.6's again exactly; the near sea from just above, smooth.

**Seen (9 Sep, fifth video, at night):** going under is fine; surfacing "the light flickers on and off". The video, frame by frame: the mean
luminance steps up ~40% on the flip frame, then decays over 15 frames (0.25 s) — the sky and the horizon band three times brighter at the flip,
the water unchanged.

### v11.7.2 — the crossing, third cut: the water's things leave with the water
The flash was the shimmer plane. Since v11.6 it hangs 1.5 m over the surface, 90 m wide, additive; it faded out by `medK` after a breach,
so for a quarter of a second it sat a metre over a camera that had just come up — an additive ceiling over the whole sky. (v11.6 moved
it from under the surface for the mirror-image reason.) The snow and the player's glow had the same shape of bug at a smaller scale, and
the tint from above ramped in while the seabed was already being seen through air.

- **The water's things fade in, and are gone at once** (`atmosphere.js` `wk`): the shimmer (`sunMesh.visible=!above`), the snow, the
  player's glow are hidden the frame the camera is in air and fade in by `medK` once it is under. Going under is as before (a fade-in
  seen through the surface); coming up loses nothing that should have been there.
- **The tint from above is the medium's** (`uTint.y` = 1 in air, 0 under): the water column seen from above switches with the camera's
  side like the fog and the domes.
- Still fading over `MED_T`: the hemisphere, the sun, the audio. Nothing medium-specific is in the fade any more.

**Also in the video, not asked about, not touched:** from just above the water looking down at night, the moon's specular lights whole
near facets — bright quads a few metres wide on the near sea (the flat wedges of v11.6 again, this time the specular, not the Fresnel,
which v11.7 fixed). The candidate fix is the same one: the mean normal for the specular at grazing (or a smoothed normal near the camera),
the facets kept for the diffuse. Asked.

**Unseen:** the breach at night with the shimmer gone — the sky should not change at the flip at all; the snow and the glow at a breach;
the tint switching (the seabed through the surface should be the same shade from the flip frame on); a dive, which should be unchanged.

## v11.8 — the clade audit, and coats in the bestiary (this build)
The person's ask (9 Sep 2026): a diagnostic pass over the roster — which creatures are Earth animals, which are vague, which are the
world's own, which fit the art — and then an upstream fix: the clades read as cephalopod / fish-reptile / arthropod in costume and
want signatures of their own (integument, eyes, mouth, limbs, blood) so that two same-sized predators from different clades tell apart.
Creatures only; no flora, no world.

- **`CLADES.md`** (new, proposed, nothing decided): the diagnostic table for all thirty, what the pass shows (Earth's greatest hits in
  three eras; two apexes are scale variants of smaller species; the only clade tells that exist are colour and the hingeshells' kit;
  the clade names promise features the builders lack — no ringmouth shows a mouth, no hingeshell has a hinge), and the proposal: one
  radial ancestor whose ring of arms each clade broke differently — ringmouths keep it open and differentiate it 2-4-2 with no head and
  a collar of eyes; slowbloods fuse it into a petal snout that opens as an iris, with an eye band and three-fold fins; hingeshells
  string it into rows under a bivalved carapace, with a comb for antennae. Per-species candidates for what would change, the lines it
  would change in PLANET, and a build plan (kit first, one clade per pass). Awaiting strikes.
- **Coats in the bestiary** (`zoo.js`, `creatures_builders.js` `PAL_VARIANTS`/`palVariant`/`palKey`): up/down (w/x) rebuild the shown
  species in a palette variant — hue ±35, the complement, the clade's blood tint, dark water, bleached, a hard countershade; the caption
  names it. Eyes, pupils, glow, mouths and claws are not recoloured. The PAL entry is swapped only while the builder runs. Nothing in the
  world reads the variants. `test/preview.js`: `PALV=k` builds in a variant, `COATS=1` writes `<id>_coats.png` strips (all thirty rendered
  and looked at: the blood coat is the quiet one that separates the clades; the bleached coat is the moult). The smoke test cycles a coat
  on every species and all eight on one.
- The preview sheets `test/preview/*.png` regenerated for the audit (no builder changed).

**Unseen:** the coats in the game's light (the strips are the software Lambert); whether the caption line fits under the name on a phone.

### v11.8.1 — the ringmouth pass, and no eye glows
The person answered (9 Sep): try the flat coil; the veil is a ringmouth but reads as an octopus, rethink its eyes; should any animal
have glowing eyes — if not, drop them; the tread stays (they like the Ohmu read; size is right); continue. Built, all in
`creatures_builders.js`/`parts.js`, stats and envelopes untouched:
- **The ring kit**: `armRing` plans (per-arm angle, length, width, spread offset), `eyeCluster`, `helix`, `ringMouth`, `skirtTrio`,
  `coilShell` flat, `coilBody`, `buildJetter`, `buildGreat`. CLADES.md, "The ringmouth pass", has the species table.
- **Every ringmouth rebuilt** to the signature: headless, a collar of rim eyes, the predators' cluster on a knuckle, the mouth
  showing, 2-4-2 arms, a three-lobed skirt on the jetters, teal-grey flesh. The coilshell, rasp and great carry the shell as a flat
  wheel. The great has its own builder (it was the coilshell ×3.2). The veil is a filter funnel with a collar and no forward eyes.
  The pall lost its ear fins. The lurker's arms lie forward in a fan.
- **No eye glows** (PLANET, Cross-clade rules): every yellow and red eye replaced — ringmouths a pale iris and black pupil,
  slowbloods silver-grey; the veil's `GLOW` spots removed. No creature uses an emissive material now except the unspawned glim.
- `test/preview.js` sheets regenerated; `test/anim.js` still passes on the new soft-arm and coilshell (tip jerk 1.14 / 0.85 max).

**Seen (9 Sep):** "genuinely awesome" — all of it but the shells: the flat wheel "sits flatside on top of the animal"; stood up 90° it would be a proper shell.

### v11.8.2 — the shells on their edge
`coilShell` gets `up`: the same carry (over the mantle, the outer whorl ending forward) with the spiral in the vertical plane along the body,
curling up and back from the front — read from the side, edge-on to the water. The coilshell, rasp and great use it; `flat` stays in the kit.
Hit capsules follow (a vertical capsule over the mantle). **Seen (9 Sep):** "much much better", the shell a little too far forward.

### v11.8.3 — the shells back
The coil's centre moved 0.45 back on the coilshell and the great, 0.18 on the rasp (`cz`): the outer whorl's front end now sits over the middle of
the mantle, not over the collar; the hit capsules follow. **Unseen.**

### v11.8.4 — the slowblood pass
The person: "if you have the context, go for it". All ten slowbloods rebuilt to the CLADES signature — the petal snout (the ring fused
into a point, opening as an iris on the bite), the silver eye band with forward lobes on predators, three fins at 120° and a three-lobed
tail, chevron plates, no white teeth; the abyssal its own builder (it was the ridge ×5); the darter's glim coat no longer emissive. Kit:
`petalSnout`, `eyeBand`, `finTrio`, `tailTrio`, `chevrons`, `profR`, `buildAbyssal`. The finback player wears the lobes (`pred:true` in
CLADES). CLADES.md, "The slowblood pass", has the species table. Stats, envelopes, hit capsules unchanged (the snouts sit inside the old
capsules). **Unseen.** Next: the hingeshell pass (valves, comb).

**Seen (9 Sep, two screenshots in the weed):** the mouth hard to read — the petal boxes overlapped and clipped into an angular jank at the
tip, the front moved on its own (the idle gape), and the silver band cut the head off the body while the eyes were lost.

### v11.8.5 — the snout readable
- **Petals are flattened four-sided pyramids** (full width at the hinge, a point at the tip): n of them meet without overlapping. A dark
  **lip line** where they hinge, and the petals' insides dark, so the mouth reads shut when shut and open when open.
- **No idle gape**: the snout opens only on the bite (the grazer holds a small fixed gap).
- **The band is dark iron and thin**; the silver moved into two **eye patches** on it — big and forward on predators, small and lateral on
  prey. No sphere, no pupil, no tracking; but eyes where the eye looks for them.
**Unseen.**

**Seen (9 Sep):** "not bad". Asked: are the white patches eyes (if so, dark; if not, bin them); the collar strip fights the countershading;
the mouth parts needn't be triangular — rectangular flaps pointed at each other (a square point), or top and bottom flaps meeting in a
rooftop against flat rigid sides, blocky, once tentacles; find the configurations that look good first. Then: slowblood eyes are a shark's —
they track, but dark on dark you can't tell unless you look close; predators need binocular vision from *elevated facial tissue* (a
hammerhead's extension, not stalks), a ring of eyes with two pushed forward and given more meat, not absurdly enlarged. And the band stays:
it is a function of the species; the silver was the problem.

### v11.8.6 — flap mouths, shark eyes
- **The mouth is rectangular flaps** (`petalSnout` takes a `kind`): **roof** — top and bottom flaps meeting at a ridge, flat rigid side
  plates they close against (the seal); **square** — four flaps pointed at each other into a square point. Both open on the bite, dark
  inside. Roof on the finback, ridge, abyssal, crusher, stone, eel; square on the darter, needle, grazer, basker — two configurations in
  the world to choose between.
- **Eyes** (`slowEyes`, replacing `eyeBand`): the band is a thin dark line the eye ring sits on; six small dark eyes round it on every
  slowblood; predators carry two of them forward on lobes of the head's own flesh, big, with a darker pupil seen only close. All slowblood
  eye colours dark. The silver patches and the vents are gone.
**Unseen.**

**Seen (9 Sep):** "much closer", the eyes "look great". The band: in the bin. The flaps: the species' mouth parts do all sorts of things —
sometimes many, sometimes few, sometimes two. The player's: two, a top and a bottom, no side pieces; the mouth parts move with the body;
smaller, blending into the body. Others may have one each side, or sides plus a single triangle below that moves only to bite. Try a few.

### v11.8.7 — no band; the mouth's configurations
- **No band**: the ring of six dark eyes sits on the head's own skin; predators keep the forward pair on flesh lobes.
- **Four configurations** of the flap mouth (`petalSnout` `kind`), smaller and countershaded like the body so they blend shut, a dark
  interior seen only open, the side plates gone: **pair** (top and bottom) on the finback player, ridge, needle, darter, stone; **sides**
  (one each side, meeting at the midline) on the grazer, basker, crusher; **trident** (sides and a flat triangle below) on the abyssal and
  the eel. The old **square** stays in the kit. The snout is a child of the body mesh where the body sways, so it moves with it.
**Unseen.** Ask which configurations feel right by species.

**Seen (9 Sep):** the countershading "looks great", but the flaps had dark dots inside, you could see through them where nothing sat
behind, and the whole idea made "a Lego fish". The person: the ringmouths animate arms fine — maybe small tentacles that come together.

### v11.8.8 — the mouth as tentacles
`petalSnout` is gone. **`mouthArms`**: the mouth is a ring of short stiff tentacles on the ringmouths' chain rig (`armRing`, ks 150, the
ring's `curve` carrying each tip to the axis), converging to a point at rest and blooming on the bite (`open(k)` is a `ringPose` every
frame; nothing moves on its own). A dark sphere inside shows only open. Countershaded like the body. Six on the finback, ridge, basker,
crusher, eel; eight on the abyssal, grazer (held a little open) and stone; four long on the needle and darter. Every slowblood now has a
rig (`rigs:[snout.rig]`); the eel two. Tests pass, the finback's tail unchanged. **Unseen.**

**Seen (9 Sep, screenshot):** "WAY better... that's the way to do it" — but you could see past the mouth into the body.

### v11.8.9 — the nose capped
The lathe bodies are open at the front and single-sided, so between the tentacles you looked into the hull. `mouthArms` now caps the nose
with a rounded body-coloured knob the tentacles grow from, the dark mouth disc at its centre. The stone's mouth and eye ring moved onto
the lump (they sat ahead of its squashed body). **Unseen.**

**Seen (9 Sep):** "Looks AWESOME. Perfected it!" — the slowbloods are done. "Go ahead and do hingeshells."

## v11.9 — the hingeshell pass (this build)
Eight of the nine rebuilt to the CLADES signature; **the tread untouched** (the person loves the Ohmu read). Kit in `creatures_builders.js`:
`valves` (the bivalved carapace hinged at the midline over the back — two plates, `set(k)` raises them; pale inside, the joint colour, so
opening shows; raised while moving, clamped on the tell), `comb` (a rake of rigid plates on the front of the shield, in place of antennae —
the clade has none now), `mouthRing` with a `front` option (the ring of plates on the face).

| species | built as |
|---|---|
| scuttle | valves seated on the low body, a comb, five rim eyes and two short stalks, the plate mouth under the front; the trilobite's tail spine gone |
| trap | its valves are the lid it buries under (rust), cracking on the tell as the eyestalks rise; a comb; the plate mouth on the face; the shrimp abdomen and tail fan gone |
| hook | small valves on the thin trunk (clamp on the tell), a comb and the plate mouth on the eight-eyed face |
| picker | relic valves it cannot close, a small comb; legs and proboscis as before |
| flicker | a swimming bean: it lives inside a pair of translucent valves hinged along the top, eyes and a short comb out of the front gap, legs out of the bottom, a short abdomen out of the back that curls under on the flick while the valves clap shut |
| hose | the proboscis is one of a mismatched pair — the long chain on one side, a short rigid stub with a claw on the other; valves over the trunk; the plate mouth on the face; one tail plate for the fan |
| sickle | valves raised over the trunk (clamped on the tell, the pale insides the flash), a comb on the shield; the tail's twin spines gone; claws, plate mouth, flaps, fan as before |
| comb | valves over the long pale trunk; the combs as before |

No stats, envelopes or hit capsules moved. Tests pass. **Unseen.** The first things to ask: do the valves read as a shell that opens (the
sickle from the side, moving, then its tell), the flicker as a bean at 0.4 m in a ribbon, the trap's lid cracking, the scuttle's flat pair on
the strand (it is the boxiest of them; if it reads as a table, curve the valves down at the edges).

**Seen (9 Sep):** "these look great" — but the sickle and the hose are still Anomalocaris and Opabinia, the one place the roster is
identically an Earth animal; the person likes the vibe (stalked eyes, strange mouth parts, the elegance) and wants it reinvented as a
family with varied eye placement, mouth placement, shapes, limb orientation and weapons, to choose from.

### v11.9.1 — the raptor family
`buildRaptor(s,pal,o)`: one builder whose parts are each a choice — eyes (stalks / a rim row with no stalks / on the valves' own edges /
a crown: one median stalk and a low pair / a row under a hood), mouth (the plate ring under the head / on the face / at the end of a short
rigid probe), weapon (claw pair / spear pair that swings down on the strike / whip pair on the chain rig / raptorial fold / none), flaps
(down the sides / down the top and bottom edges — a knife swimmer / the rear half only), valves (back / small / a hood over the head), tail
(fan / one spine / three plates), a ventral keel, legs at the rear, a comb. `RAPTORS` holds five looks:
- **keel** — the sickle in the world now: tall and narrow, flaps top and bottom, a keel, a rim of five eyes and no stalks, the mouth on the
  face, two spears folded under the body that swing down on the strike, three tail plates.
- **splay** — the hose in the world now: small, broad and flat, four eyes on the valves' edges, the mouth on a probe, a raptorial fold, a fan.
- **hood**, **lash**, **ram** — bestiary only (DEFS entries, no SPAWN): a broad flat one under a hood with short claws, rear flaps and legs;
  a sleek one with a crown stalk and two whips; a heavy wedge-headed charger with no frontal weapon, seven rim eyes, a big face mouth.
`buildSickle`/`buildHose` stay in the file, unreferenced, until the person has chosen. **Unseen.** Ask which looks go in the world and at
what sizes; a look can be scaled or its parts swapped in `RAPTORS` in one line.

**Seen (9 Sep):** the raptors — "THOSE ARE AWESOME! Exactly what I had in mind."

### CREATOR.md (design only, no build)
The person asked for a design document for a creature creator: modular internals first (every animal from one developmental framework,
creatures makeable by hand from parts), a dev tool for them now, the player's Spore-like creator later, split by clade, with movement and
physics derived from the build. `CREATOR.md`: a species is a spec, a builder is a compiler (`buildRaptor` is the proof); the spec schema and
the clade grammars; `compile` and the part registry; the calculator `derive` (mass, drag, thrust, speed, turn, mode, plausibility) that
makes free-form bodies honest; the `#lab` tool on the zoo; what changes for the player later; what one session should build; eleven
questions for the person.

### v11.10 — the creature lab
The person answered CREATOR.md's questions (recorded there, Decisions). Built:
- **`creatures_spec.js`**: `GRAMMAR`, four cores (`mantle`, `coilbody`, `lathe`, `trunk`), the `PARTS` registry (eyes, mouth, arms, shell,
  ridge, skirt, chevrons, spines, barbels, plates, fins, tail, comb, tailplate, legs, keel, valves, flaps, weapon — each with styles,
  parameters, a believable band and an extreme band, a cost, paired or not), `compile`, `validate` (warns in the believable band, clamps
  at the extreme; positions only warn), `derive` (mass, volume, drag, thrust, speed, accel, turn, hp, mode, buoyancy, reach, cost,
  plausibility), `statsOf` (locks), `coatFor` (pigment chemistry by clade, depth, diet), `SPECS` for 18 species with their hit capsules,
  `SPEC_BLANK`, JSON / `#lab=` hash / export.
- **Migration**: soft, arrow, coil, great, ortho, fin, ridge, abyssal, grazer, darter, needle, basker, crusher, sickle, hose, hood, lash,
  ram are specs; their hand builders and `RAPTORS` deleted, the kit kept. `test/ident.js` compared old and new (tris, bounds, checksum,
  idle and action): identical, zero warnings. Not migrated: rasp, veil, lurker, watcher, pall, eel, stone, scuttle, trap, hook, picker,
  flicker, comb.
- **`lab.js`** and the `#lab` panel in shell.html: `l` on the menu or on a spec species in the bestiary; species / size / scale / depth /
  floor; the core and its beat, a profile editor for lathes; each part with style, sliders, mirror, remove; add a part; coat by preset,
  drawn from chemistry (with a note), or by hand per colour; the readout with derived stats and a lock per stat; warnings; copy json,
  copy link, export (the DEFS/ROSTER/SPECS lines), paste; `p` places it in the world as `DEFS.lab`; space for the action, s to cruise,
  drag to turn, wheel to close in, l or escape to leave. Orbit camera as the bestiary's.
- The bestiary caption shows the calculator's numbers beside DEFS's on spec species. Captions (`#zoo`, `#hint`, `#biome`) a point larger
  with a dark halo (answer 11).
- `test/preview.js` takes `SPEC=file.json`; the smoke test opens the lab, loads every spec and blank, fires the action, places one.

**Calibration**, derived vs DEFS: fin 7.5/8.8, sickle 10.8/9.5, arrow 5.4/5.8, soft 8.8/7, darter ok. Two honest disagreements the
calculator is right to make: the **great** (7.4 vs 1.0 — a 10 m jetting coil is not a 1 m/s animal; DEFS's 1 was a design choice for a
slow monument) and the **grazer** (5.6 vs 2.3). DEFS keeps its numbers; the lab shows both. `DERIVE_K` in creatures_spec.js is the dial
if the scale should move.

**Unseen:** the lab panel itself in a browser (layout, the 330 px column, sliders, the dark panel over the sea; the smoke test only drives
it headlessly); whether live rebuild on a slider drag feels fine at the big species; the drawn coats — every one of them is a formula, not
a seen palette; `p`'s placement in play (ahead of the player, ground-clamped for floor creatures); the hash link surviving a reload;
clipboard writes (need a secure context). The calculator's numbers have only been read in a table, never felt in play.

### v11.11 — the lab, second round
The person built creatures ("works great") and asked for seven things:
1. **Only the clade's styles** — `STYLE_CLADES` in creatures_spec.js: collar and cluster eyes and the beak are ringmouth; ring eyes and
   the tentacle mouth slowblood; stalks, rim, crown, under and valve eyes and the plate mouth hingeshell. The lab offers only those;
   `validate` corrects a stray one and says so. The rim eyes and the ring eyes stay distinct kinds for later.
2. **The drag** — `#menu` covered the canvas with `pointer-events:auto`, so no drag reached it in the bestiary or the lab. Now only the
   picks take the pointer. **r** (or the spin box) starts and stops the spin; a drag stops it.
3. **Re-entry** — **l in play** opens the lab beside the player (the world waits; the camera orbits the creature ahead of you); l puts
   you back, click to look again. The menu and the bestiary as before.
4. **Weapons placed and sized** — x, y, z, pitch and yaw in degrees, len and w scales, the teeth on a claw; snap hangs it from the belly.
5. **Snapping** — the surface model: `bodySurf` (the core's section at (x,z): an ellipse for the round bodies, the box for a trunk) and
   `cover(F,core,p)` on the armour parts (valves, the hood, the keel, the slowblood plates), so `ctx.top(x,z)` and `ctx.bottom(x,z)` are
   the body *with what lies on it*. Every placed part has `snap` (on by default for the eyes and the mouth): its y is the surface's,
   the slider hidden. Eyes on a valve sit on the valve; a stalk on a hood stands on the hood; an under mouth hangs from the belly.
6. **Variation** — the hingeshell eyes reparameterised: stalks (pairs, x, z, length, size, tilt, splay), rim (count, spread, sweep back,
   size), crown, under (count, spread); the plate mouth: where (under / on the face / on a probe), z, radius, probe length, and **mouth
   parts** — mandibles (a pair of curved blades that close inward), palps (short jointed stubs), feelers (whiskers fanned out) — with
   count and length; comb placed; legs with pairs, spacing, length.
7. **The panel** — a nav that follows the scroll (click to jump); each part a fold (click its name); the part under the cursor or with
   a focused slider lights up on the creature (`compile(…,{split:true})` gives each part its own mesh in the lab; `MAT_HI`);
   readable names on the sliders with units, the believable band in the tooltip.
Identity: every migrated species unchanged except the hood (its under eyes were inside the head box; they now hang below it, seen)
and the lash's crown stalk by 0.0002 (tan of a rounded degree). `test/ident.js` reports both.

**Unseen:** all of it in a browser; the folds and the sticky nav; the lit part (the emissive colour is a guess at what reads under water);
the lab from play — the camera jump in and out, the hint; the mouth parts at every size (drawn at one hingeshell in the preview: snap,
front and probe sheets in test/preview/spec_*.png looked right).

### v11.12 — the performance pass (this build)
From `AUDIT.md` (9 Sep, the first session run on the person's own PC, with the game measured live) and the person's five answers: 450 m
for the flora cut; variety stays plant to plant (per-cell variants struck); Node on the PC; the reformat; the world.js fix. Built here:
Node 22 at `C:\Users\willb\tools\node`, `build.js` (a port of build.py, byte-identical outputs), a git repo in `tethys/`, acorn vendored
for the lint (`test/acorn.js`), `IDEAS.txt` in the tree, `tools/astcheck.js` (an AST comparison for reformats).
- **world.js:146 restored.** `sub=Math.max(sub, the dikes, the rim, the fan's blocks)` had been swallowed by the comment before it since
  before v11.11 and never ran. Bare rock on the dikes' crests, the rim band and the scarp blocks is back, and with it the sub-gated
  species there (rasp, cone, beard, crag3, boulder2, tube, cup, lily…) and the terrain colour. The rim and the dikes look different.
- **The sway shader's disturbance loop** runs only for plants within `DIST_R` 90 m of the camera (scene.js): it was the cost and ran for
  every vertex to the far plane. In the forest 6.3 → 4.6 ms mean, the GPU-wait spikes gone. No visual change by construction.
- **Small flora is drawn to `FLORA_FAR` 450 m** (scene.js): collapsed per instance in the sway and var shaders past it (the variants'
  trick, so nothing pops as a cell), and a cell whose nearest edge is past it hides its instanced meshes and turns its far impostors on
  (`ch.near`, chunks.js cullChunks; far.js farApplyCell). The stipe, bladder, raft, colony and tidal-tree materials are not collapsed:
  their cards take over at the cell hide. At 450 the veil leaves 6.6% contrast.
- **Streaming.** The generator yields inside the big steps (two rows of samples, every 200 flora tries, every member of a group spawn,
  every 50 tries of a region's structures and impostors); the budget is what the last frame left of `Q.target` (7.5 ms high, 14 low), at
  most `budgetMs`; cells unload one a frame. Frames over 10 ms while a cell loads: about 40% → about 2%.
- **A kind's body and far-LOD bake are shared** by every individual (`KIND_GEO`, creatures_ai.js spawn; the rigs stay per creature; the
  lab's placed species is never cached): the heap at boot 455 → 173 MB, resident geometries 630–1000 → 450–580. The build still runs
  per spawn (1–2 ms).
- **Shaders warmed** at the end of the first frame: every material in the form the game uses it (plain and instanced), through
  `renderer.compile`; 25 programs, none compiled mid-play any more (the flicker's, MATBIG, the sky on the first breach, the rain). ~40 ms
  more on the first frame, behind the fade.
- The far layer's 14 ms menu budget only while the fade is black (`t<2.4`); the readout shows `render` ms and the heap.
- **Reformat** of creatures_spec.js, lab.js and flora.js through prettier (print width 150, single quotes, no trailing commas), the
  programs AST-identical: 515 → 2448, 238 → 942, 339 → 1256 lines.
- Not built from the audit: shared flora vertex buffers with pooled per-cell meshes (the per-cell clone and its upload stay), the one
  placement rule, the mode table, the half-cell grid offset, the residency ring, per-file temporaries.

**Measured** (RTX 4060, 1600×900, high tier, the main thread with the pane hidden so no vsync; means): the peak 3.9 → 3.0 ms (p99
24 → 3.7); the weed forest at (330, 0) 5.9 → 3.2 ms (p90 15.5 → 3.4, p99 30 → 3.8), draws 374 → 306, tris 5.5M → 4.2M; sprinting west
from the forest for 30 s: median 4.0 ms, p90 5.9–7.7, over 10 ms 20 then 3 frames of 900, max 41–52 (a few big steps or GC pauses a
minute). Boot 507 ms synchronous, the first frame 353 ms with all 25 programs. Tests: the four suites green.

**Unseen (all of it):** the rim and the dikes with the bare-rock line back; the 450 m cut and the card hand-off at a cell line (a stand
of stipes becoming cards; a chimney or a boulder popping, since MAT and MATROCK have no shader cut); the menu with the far layer's
budget dropped at 2.4 s; the first breach without the sky's compile stall; the reformatted files in an editor.

## v11.13 — the light (POLISH.md pass A; 9 Sep 2026)

The person asked (IDEAS #3) for the low-budget systems that carry low-poly games; `POLISH.md` is the survey — the catalogue, what not
to build against this game's numbers, a ranked list in three passes, seven questions — and they answered: caustics on everything;
shadows on big creatures too; god rays "as long as it's not forced and is believably based on appropriate water physics"; blood at a
bite yes, by size and volume; the bioluminescent wake yes for now; A then B then C; the flush and the vignette off by default. This is
pass A, built here and unseen. The rule it follows: fill is nearly free and vertices are the frame (AUDIT), so the light is per
fragment in the shaders that exist, from what every fragment already carries under `USE_FOG`. No new pass, no render target.
DESIGN has a new section, The light, with every number.

- **Caustics** (scene.js `LIGHT_GLSL`, injected by `addTint` into every tinted material but `GLOW`: terrain, rock, structures, flora,
  the sway materials, creatures, the impostors): three nested sine bands in world xz drifting downwind, sharp under the surface and a
  mottle deeper, by depth (gone by −45), by the face normal's up (from screen derivatives), by the beam's share and by the canopy.
  Multiplicative, strength `SEA_FOG.cau` 1.3 (the readout's `t-y`). Skipped whole when the sun is down or under a shower.
- **The sun under water** (`SUN_W`, atmosphere.js updateSky): the luminary refracted at the surface and the beam's share of the light —
  nothing under cloud, little from a grazing sun, a full moon's share on a clear night.
- **The sun's shadow of a body** (`LIGHT_GLSL`, `updateCasters`, `Q.casters` 6/2): capsule casters projected along the refracted sun
  (the true sun in air) in every tinted fragment, a penumbra widening with height, gone by 35 m under water; slot 0 the player, then
  the nearest bodies weighted by size (`d − 8·size`), so a big thing overhead outranks the fish at the camera. Strength `SEA_FOG.shd`
  0.55 (`u-i`). A body part-shades its own belly.
- **Light shafts** (atmosphere.js `shafts`, `Q.shafts` 4/2): sixteen additive quads from 3 m under the surface along the refracted sun,
  on a fixed world grid so nothing jumps, faded at the patch's edge, over water deeper than 4 m under their top only (the bottom stops
  1.5 m over the ground), by the canopy, by the beam's share and the sky's light, hidden the frame the camera is in air (`wk`), gone
  for a camera below ~50 m, the fog's extinction only. One draw. `SH_A` 0.16.
- **Translucency** (`thinLight`): a share of the far face's light comes through the weed, whips, tussock, far cards (0.35), bladders
  (0.3), rafts (0.2), colonies (0.15). A regex on r128's Lambert chunk; warns and skips if it doesn't match.
- **Occlusion at build**: the terrain's cavity term (gullies and the foot of walls up to 30% darker, crests up to 12% lighter; `sample()`
  beyond the cell edge so boundaries agree), the shade under the canopy (`terrainColor`, so the far terrain matches), the foot of every
  boulder (`MATROCK`, from the sink line up over 0.8 of the scale, 35%).
- **Small motions**: the sessile animals breathe (`MATV`, 2.5% radial, above 0.25 m); the far cards sway (`MATFAR`), so the hand-off at
  450 m isn't a forest going still.
- **The chemocline** (the fog chunk, PLANET): a milky plate at −450, browner water below.
- Readout: `t-y` and `u-i` on the tuner; `SEA_FOG.cau/shd`. `LIGHT_FX` false strips the caustics and shadows from every shader.
- Tests: the four suites green on both tiers; the composed GLSL of every changed material dumped under the stub and read (balanced,
  every name declared in scope); a headless check that the caster arrays and the shafts' vertices are finite and all six slots fill.

**Cost, expected** (not measured — no GPU here): caustics ~0.1–0.2 ms of fill, the six casters ~0.1–0.3, the shafts one draw, the rest
nothing at run. Measure the forest at (330, 0) with the readout: `render` before and after; if it moved more than 0.5 ms, the tuner's
`t` to 0 and `u` to 0 tell which. `updateCasters` is one distance per resident creature (~10 µs).

**Unseen (all of it).** In order of what to ask for: (1) does everything tinted draw at all — a black or magenta world at boot is the
GLSL (set `LIGHT_FX` false and rebuild to confirm); (2) the caustics on the shelf floor at noon — is 1.3 too strong, is the web the right
size (3 m cells), does it read on the player's back; (3) the player's shadow on the floor when swimming 3–5 m up, and a big creature's
shadow passing over; the belly self-shade; (4) the shafts — too bright, too many, do they cut anything, do they show through the
canopy, is there a flash at the breach; (5) the kelp from below at a sunset (the translucency); (6) the gullies and the foot of the
walls; the boulders' feet; (7) the tubes and cups breathing; the far cards moving; (8) the plate at −450 from the pit's floor. Then the
readout's `render` ms in the forest.

### v11.13.1 — the mouse (9 Sep)
v11.13 seen: "fantastic". The mouse only looked at the top of the screen: the menu's three picks, invisible after `.gone`, kept
`pointer-events:auto` (a child's auto beats the parent's none) and took every mousedown below the title. Fixed in shell.html. And the
person's ask: looking by default — play starts with the pointer locked (as `choose()` always tried; the picks' overlay was what defeated
it), Tab releases the lock and shows the cursor, Tab or a click on the canvas takes it back, the click that takes it is not a bite, the
lock is dropped on leaving play (input.js `unlock`, `syncLock`). Drag-to-look stays where the lock is refused. The hint says "tab cursor".
Unseen: the lock on the first frame of play in their browser (Chrome may refuse a re-lock within a second of Escape — a second click).

## v11.14 — the sound (9 Sep)
IDEAS #6, the audio overhaul; `AUDIO.md` is the design and the person's answers (the defaults, all of them). Built, in audio.js (rewritten,
225 lines) with hooks in physics.js, chunks.js, player.js, main.js, scene.js and the stub; DESIGN has a new section, The sound.
- **The space, read from the world**: twelve rays from the listener every 0.25 s through the terrain, the surface and the collider hash → the
  reverb (two generated impulse responses, a cove and a cavern, by the closed fraction and the mean wall distance), three early-reflection
  taps delayed by the real round trip at 1480 m/s and panned to the wall's side, a low shelf when the floor is within a metre, a lid.
- **Occlusion** per placed voice: the line to the listener marched through ground and solids; a boulder shadows, a ridge muffles.
- **The water as itself**: the slosh over you follows the wave's rate at your x,z (the same `waveH` the surface draws); the breakers from the
  shore's direction by `expo`; the current's rush by `currentAt`; the vent at the chimney's mouth, occluded; the forest's rustle from the
  weed's centroid (a per-cell 4×4 height grid, `ch.ac`), loud in a stream; the hush by depth and a 32/34 Hz beat below the chemocline; the
  crackle by `nut`, louder at night; the heat's bubbling on the fissure.
- **The body**: the flow past it by speed (the finback's beat on a phase clock), the jet's burst per squeeze, the landing (a click on rock, a
  thud on sediment), the knock and scrape on rock, the brush through weed — `solidPush` reports what it pushed against (`contactK`; flora
  solids flagged `fl` from `addFloraSolids`); the player reads `hitFl`/`hitRk`/`landV`.
- **Passing bodies**: the water the six nearest creatures displace, by size and speed, panned, occluded. No voices, no calls.
- The four old thumps carry a noise transient and go through the space; the hit is placed where it came from. `Q.hrtf` 1/0, `Q.vol`.
- Above water: the medium opens to 16 kHz; wind by the weather, the rain's patter, the same slosh voice as lapping under you, the breakers
  brighter. Minimal.
- Tests: `test/audio.js` (in `--test`): the graph built against a fake `AudioContext` in the stub (every param throws on NaN), the space's
  numbers at the peak, the shelf forest, the pit, the vent and the void, the pit more closed than the peak (0.58 vs 0.46), the forest 0.75
  vs 0.35, the vent not heard from the peak, a placed hit, mute and back; `updateAudio` 0.1 ms a frame headless.
- atmosphere.js no longer touches the audio (the old `lp`/`master` lines); the readout has a third line, `audioLine()`.

**Unheard (all of it — there is no audio output in the sandbox).** In order of what to ask for: (1) does anything play at all after the pick,
and is the whole too loud or too quiet (`Q.vol`, or the master's 0.8); (2) the slosh: does it swell and fall with the chop you see just under
the surface, and fade by ~10 m; (3) swim along a rock face — is there a slap from that side (the taps); into a gully or the pit — does it
close in (the wet); (4) sprint — the flow noise, the finback's beat, the soft-arm's squeeze; bump a boulder — the knock; drag along it — the
scrape; swim through the stipe forest — the brush and the rustle; (5) bottom out on sand vs rock; (6) something big passing close — is the
hiss placed, and does it duck behind a rock; (7) the vent from 200 m and from behind the ridge; (8) the pressure beat below 400 m; (9) the
crackle on the reef top, day and night — strike it if it reads as animals; (10) the surface: the crossing (the medium's filter opens over
`MED_T`), wind, rain from both sides. Every number is in DESIGN, The sound, by name; the readout's third line shows what the space found.

### v11.14.1 — the first listen (9 Sep)
v11.14 heard: "very loud", "a strong sound like I am under a waterfall even when not moving", "very hissy and white noise adjacent" where
the old bed was "a low rumble, like you were put under a high pass filter"; the sloshing when moving less intrusive. Two causes: every bed
was white noise through a broad bandpass at 0.1–0.4, summed; and the compressor at −14 dB — the browser's DynamicsCompressor adds makeup gain
by its threshold, so it lifted the whole bed. Now: a pink buffer (Kellet) and the beds on pink and brown, no white bed under water (white is
the scrape, the brush, the rain and the transients only); every level roughly halved (DESIGN, The sound, has each); the medium's lowpass
2.4 kHz → 600 Hz by depth (was 5 → 1.1); the compressor −3 dB 8:1, a guard on peaks; the master 0.5 (`AU_K.vol`). And a tuner so the rounds
don't need a build a number: with the readout open, `g-h` the master, `j-k` every bed at once, `v-b` the water's lowpass; backspace resets
with the fog's; the readout's third line shows them — paste it back and they get baked in. Unheard: whether it is now a rumble with the slosh
over it, and what the knobs land on.

## v11.15 — the plant overhaul, first pass: three lines (9 Sep)
The person asked for the plant overhaul (IDEAS #5) grounded in evolutionary logic: what each form eats, what colonised what in
what order, real splits — adjacent clades, several of them — with Earth's eras as inspiration only. `TAXA.md` is the tree; its
answers: three photosynthetic lines, called **greens, floaters and reds**; rebuild the trees ("don't try to preserve something just
because I said it was awesome"); the swamp parked until the island is bigger; build order Claude's.

- **The deep split is pigment, and depth zonation is taxonomic** (grow.js `pigment(h, line)`): three lines from three planktonic
  pigment-kinds, each shading within its own band and stopping — greens green → olive by −40 (sunscreen-bright in bright water),
  floaters olive → gold-brown by −80, never green; reds pale pink where they lay lime in bright water, red-purple by −50, dark at −150.
  Every `photo` entry carries a `line`; the cell tints by it (chunks.js).
- **Bands narrowed to the lines'** (flora.js): the greens — turf −42..−1, strap −42..−3, grape −40..−6, chain as it was; the floaters —
  wisp −82..−16 at 420 a cell in two sizes (the forests' ground layer now; turf no longer goes below −42), stipe −54..−16, ladder −66..−16,
  ribbon −78..−16, bladder −80..−30, the raft olive (it is a floater that let go). The shelf is no longer green.
- **The reds, new** (the slope had no weed at all): `rind` (2–3 flat plates on rock, red-purple, −150..−24, 300 a cell on rock),
  `limerind` (the same crust laying lime, pink, on exposed rock −26..+2.6: the crest, the skerries — a real reef's crest is this, not
  polyps), `sandball` (a knobbly lime ball on the sand, −60..−8), `redblade` (one thin blade on a stub, −150..−48, sparse). ≤ 84 tris each.
- **The greens in air, rebuilt as jointed axes** (their signature carried onto land; the Silurian–Devonian look): the tidewood
  (`tidetree`, `tidewoodB`: a ribbed jointed trunk 6/9/12 m with a dark ring at every node, a whorl of six to eight tapering rods with
  a kink at every node above the springs' reach, a brush at the tip, props at the base as before; 510 tris a variant, was 8268 vertices;
  the sphere canopy gone), the **reed** (new: 3–5 jointed leafless uprights 1.4–3 m in a clump, whorls near the top; the sheltered tide
  band, `expo` ≤ 0.4, 900 a cell, `air`: the swamp of stems you swim through at high water and walk among at low), the scrub (jointed
  dwarf stems with dense dry whorls) and the tussock (a tuft of small jointed shoots) — both species now (three variants), both `MATGL`,
  both tinted by the greens' pigment at land light. `grassGeo`, `scrubGeo`, `TREET` gone.
- far.js: the tree card's trunk pale green, the raft card olive.
- test/preview.js has a flora mode: `FLORA=1 [DEPTH=h] node test/preview.js reed rind` renders a species' three variants (quarter over
  side) tinted by its pigment at that depth — every new form here was looked at in it.

**Unseen (all of it).** In order of what to ask for: (1) the shelf at −30: olive-gold, no green left, the wisp as the ground layer
under the stipes; (2) the lagoon and the reef top: green, and the pink limerind on the crest and the pass walls; (3) the slope from −50
down: red plates on the rock thinning out, the odd redblade; (4) the tidal forest — jointed trunks with whorls instead of the old crown:
does it read as a wood or as a stand of poles (the whorl count `6 + (j % 3)` and the rod width 0.09 are the knobs); (5) the reed-beds on the
rim's inner slope and the island's flat, at high and at low water; (6) the strand's scrub and tussock; (7) the readout in the forest at
(330, 0) — the wisp went from 220 to 420 a cell there and the tidewood from 8268 vertices to ~1500, unmeasured. Not done from TAXA: the
animal lines' missing leaves (plume, seep, stilt, nod), the epiphytes, the reef's spur-and-groove, the bog.

### v11.15.1 — the animal lines' leaves (9 Sep)
v11.15 seen: "the tidal forest looked good. The whole thing looks good"; the tree line at −30 right; the bottom of the shelf read as
orange rather than red (the floaters' gold-brown at −60..−80 is that; the reds' plates are flat and hand-thick, so `rind` goes 300 → 380
a cell and `redblade` 60 → 100, larger). Next: a larger world map, after this pass. Built here, TAXA's missing leaves:
- **plume** (`plumeB`): the crowns' bacterial-farm branch at the vents — bunches of four to eight ribbed white tubes 0.9–2.8 m with a red
  plume of rods round the mouth and the eye ring, `heat` ≥ 0.3, 110 a cell in clumps. **seep** (`seepB`): the same branch at the rim —
  two or three black tubes 3.5–6 m with dark crowns, ground −464..−444 (`band`; placeFloraType now lets a banded species through below
  −450), 70 a cell: the straddlers' line round the world at the chemocline.
- **stilt** (`stiltB`): the propped straightshell — a banded cone shell tilted mouth-up on two struts from its lip, a six-arm crown fanned
  across the flow with the eye ring; rubble and silt in a current (`sub` 0.3–0.85, `flow` ≥ 0.25), 40 a cell, cream / rust tints.
- **nod** (`nodB`): the stalked cone — a plated cone with five comb legs on a flexible stalk 0.35–0.65 m, `MATW` (bends), `flow` ≥ 0.55 on
  rock, 90 a cell.
- **mat** (sulfur: white and yellow tufts, `heat` ≥ 0.18, 260 a cell) and **greymat** (below −452, 220 a cell, `band`): the dark has its
  mats and nothing else, as PLANET says.

**Unseen:** the vent field with plumes crowding the cracks and mats round it (ask whether the red reads); the rim at −450 — a line of black
tubes with the crowns just above the plate; the stilt in the rockfall (does the propped shell read, and does the fan face across the current);
the nods on the pass walls. `FLORA=1 node test/preview.js plume seep stilt nod` is what was looked at.

## v11.16 — the drifters (9 Sep)
The person: the man o' war pads "need some love" — you clip through them, they are white, they spawn backwards into each other, "big
pustules in the sky"; and underneath it, the wish: an evolutionary reason for interesting things on open water, points of interest and
orientation. Asked what is real (does a man o' war sit like a lily pad? do they raft?), for the jelly tree fleshed out and functional
(what they eat, how they survive), and a version with a long arm streaming in the current that floats. `DRIFTERS.md` is the answer:
the real animals (a gas float with everything hanging under it, not a pad; fleets by wind-sorting, never a raft; the blue button — a
disc that farms green cells — is the real "lily pad", and it is an animal), the clade (the ring kept radial and stinging; no eyes, no
intent; pigment by depth: violet at the surface, clear in the light, red in the dark), the tree (polyp / bell / float; the float splits
into the button and the sailer).
- **The sailer, a creature** (`buildSailer`, DEFS `sailer` 1× and `greatsailer` 2.5×, role `sail`, `surface`, `updateSailer`): a
  blue-violet float 3.6 / 9 m long with a pink crest, feeding bodies beneath, eight 25 / 63 m lines and eight short. Rides the wave
  (`surface` rule in updateCreatures: `waveH` + `ys`), carried by the current, sails at 5% of the wind 40° off downwind, left- or
  right-handed by animal (`hand`); the whole animal yawed to its heading. The float is a body (`hit`): you push against it. The lines
  are soft chains posed by `linePose` (parts.js, new) to stream against the animal's way through the water, simulated near you, and
  sting: within `lines` (0.9 / 1.4 m) of any simulated point, `dmg` 6 / 10 on a 0.7 s clock. Fleets in the canopy mask (1–4 a cell, a
  great one in a third of the cells), the odd one on open water. `MATT` throughout (translucent); no eyes.
- **The button, flora** (`button`, `buttonB`, `MATR`): 1.6–2.6 m discs, green-blue centre, violet rim, sixteen short arms; `canopyPer`
  60, pockets elsewhere; a far card. Replaces `colony`/`colony2` (and `colonyB`, `MATR2`'s use, their cards).
- **The jelly rebuilt** (`buildJelly(s, deep)`): an eight-sided bell and core in `MATT` (was three unlit Basic materials — the last
  emissive-looking things on a creature), eight hanging arms, a `swimClock`; **deepbell** the same at 3.8×, dark red, below −220,
  0.35 a cell, slow. The canopy's three extra jellies a cell are gone (the canopy is the sailers').
- test/stub.js: `Quaternion.setFromAxisAngle`, `slerp`/`copy` real. test/preview.js: `NORIG=1` hides the rigs (the sailer's lines are
  25 m; the float is 3.6).

**Unseen.** (1) A sailer on the water: does the float sit at the surface, crest up, and ride the swell without bobbing through it
(`ys`); (2) the lines from below — do they stream, do they part round you, and does brushing one hurt; (3) push against the float;
(4) the fleet in the canopy — are they sorted two ways by the wind, and does the great one read as a landmark from across the water
(it is drawn to 300 m; the crest 3 m tall); (5) the buttons' fleets among the rafts; (6) the jelly translucent under the light, the
deepbell red in the dark; (7) the readout with a fleet near: sixteen chains a sailer.

### v11.16.1 — the raft in the bin; sailers at the coast (9 Sep)
v11.16 seen: "so much cooler." Two notes. The surface weed ("foliage or moss") "looks terrible" — struck: `raft`, `raftB`, its card
and its canopy density are gone; the surface is buttons and sailers now, and the pad mechanism (physics.js) has nothing to carry until
something floats that should (test/physics.js section 7 runs only when a species has pads). And where sailers spawn, by Earth: the man
o' war is an oceanic animal, but it is met on beaches, because an onshore wind drives a fleet against the coast and strands it. So: a
SPAWN entry on the exposed shallows (`expo` ≥ 0.55, −70..−10, 1.4 a cell) beside the canopy's fleets and the open-water stragglers,
and **stranded** (flora, `strandedB`: a deflating float on the sand with a limp fringe, 26 a cell on the windward strand, `expo` ≥ 0.5).
Unseen: the windward strand with dead floats; sailers off the surf side; whether the canopy without rafts still reads as a place.

## v11.17 — the sky above the water: what the climate gives (10 Sep)
The person asked for the surface's look rethought from the planet — fog only if the climate makes it; a sky that is this planet's (its
star, its moon, its stars); clouds that read as volumes at the height they belong. Decided from PLANET, with the reasoning as comments
at `HAZE` and `STAR` in world.js and in DESIGN, The sky:
- **No sea fog.** A 26–28 °C sea under steady trade air never saturates (fog wants cold water under warm air, cold air over warm water,
  or land cooling all night; a six-hectare rim cannot). Instead: the **marine haze** as a layer on the water every ray in air integrates
  in closed form (`MIST_GLSL`, the fog chunk's air branch and the dome: the horizon's white band, glowing toward the light — the
  "gmod horizon" was a two-colour gradient; this is the boundary layer seen edge on), thicker under a shower; and the surf's **spray**,
  a low mist over the breakers by the wave-exposure field at the camera. Not built, the person's to decide: vog from a fuming vent
  above water; a calm (the trades slackening) that would let a clear night mist the lagoon at dawn.
- **The star and the moon by derivation** (the person: realism first). `STAR` 5300 K → 0.85 R☉, 0.51 L☉, 0.71 AU: the sun's disc 1.2×
  ours (`SUN_R` 0.32°). The moon: 3× the tidal force at the Moon's density is 1.44× the Moon's diameter — `MOON_R` 0.37° radius, down
  from the 0.75° it was drawn at. `MOONL` unchanged (a look). Three placeholder **wanderers** on the sun's track (`PLANETS`).
- **The stars** on 3D cells over the sphere (round dots everywhere; the old az/el grid stretched them into dashes near the pole and
  zenith — seen in the harness, below), a narrower galaxy with a dark lane, out from a degree under the sun to eight (they were out at
  sunset with the sun still up).
- **The sky's shape**: Rayleigh-shaped gradient, a haze aureole round the sun, the disc drawn over the haze so a setting sun reads.
- **Cirrus** (`CIRRUS_H` 9500, on its own weather noise and the upper wind, streaked 7000×1600 m; sunlit pink for 3° after sunset).
- **The cumulus** as a marched deck (`Q.cloud` 5 / 2 slices, base 650, thick 900, the threshold rising with height, the thickness
  capped by the ray's slope): flat bases, lit domed tops and sides showing where the base thins, three flat steps, aerial perspective;
  **under a shower** the base drops, the deck grows to congestus and scud drifts under it — the "large and approaching lower".
- `Q.cloud` is the one tier number added. New uniforms `uMist/uMistC/uMistW` through ShaderLib; `SKY` gains `cirrus`, `upperOff`,
  `cirrC`, `plan`, `spray`; `updateHaze` runs in `updateAtmosphere`.
- **A harness** (not in the repo; the sandbox, `w/harness/render.js`): the real `SKY_FS` and fog chunk drawn over a sea plane in raw
  WebGL under headless Chrome + SwiftShader, so the sky could be *looked at* here for the first time. Every number above was tuned
  from its renders at boot, sunset, full moon, new moon and a shower. It has no terrain, no real surface, no three.js.

**Unseen, in order:** (1) the sky compiles in the game (the harness compiles the dome's GLSL under ANGLE, not three's material with the
new `uMist` uniforms: a magenta world or a missing sky is the first thing to say); (2) at boot from the surface: the horizon's white
band — too white? (`HAZE.dens`); the deck — cel-banded tops on the big overhead clouds read as clouds or as contour maps? (3) the
readout's `render` ms surfaced at noon and at sunset (`Q.cloud` 3 if it moved); (4) the sunset at 15 minutes: the cirrus pink, the
disc on the horizon, the moon rising — at 0.37° it is a disc, not a plate: ask whether the bright nights still feel earned; (5) the
night: round stars, the galaxy's lane, the wanderers in the evening twilight (west, 38° from the sunset point); (6) the shower at 4
minutes: the low grey deck and the scud; (7) spray on the windward shore (0.35 rad, over the surf); (8) the moonless night 13 days in.

### v11.17.1 — the person's three calls: eclipses, the fumarole, calms (10 Sep)
Answered the same day: declination 0 stays; a vent above water, if believable; calms, if believable. Both are — a young cone on a live
shield degasses (Kilauea, Piton de la Fournaise: fumaroles, SO2, vog), and the trades blow about three days in four (Hawaii) — so all
three are built. Nothing here is a look; each is a consequence of a decided fact, and each is one constant block in world.js.
- **Eclipses** (`UMBRA_R`, `discOverlap`; `SKY.eclS/eclL`, `uEclS/uEclL`). The moon's lit fraction is now the geometry (`0.5·(1−sun·moon)`;
  `moonIllum(h)` was a cosine on the hour an hour out of step with the conjunctions — unreferenced now). Every full moon passes through
  the planet's shadow: partial from 2.3 h before the transit, total for 1.4 h round it (the first night: h 18.3–19.7, local midnight),
  the moon dark red in the umbra (lit by every sunset on the planet at once), the moonlight gone (×0.03), the stars out in full. The
  solar eclipse is built too (the moon's dark disc over the sun, the corona, the light to 3% of noon at totality, stars) — but with
  the decided clock it is never seen: 26 days × 30 h is exactly 25 lunar days, so every conjunction falls at local midnight, forever.
  Break the commensurability (LUNAR_H 31.2 → anything else) and it will drift into daylight; that is PLANET's tide clock, so not touched.
- **The fumarole** (`FUME`, `VOG`; `updateFume`, `updateHaze`). A steam plume off the cone's summit (+40 at `ISLE`): 96 puffs as points
  born at the summit, rising with a decaying lift, carried by the wind at 0.85 of its speed, growing 4→22 m and fading over 70 s, soft
  discs lit by the sky and fogged toward the mist's colour; in a calm it stands straight up. Vog: the third mist layer (`uMistW.yz`) —
  a Gaussian plume downwind of the summit, half-width 70 m growing 0.16 per metre, extinction 4e-4 on the axis, scale height 140 (the
  plume is buoyant), felt to 2.4 km, pooling round the cone in a calm; it greys and warms the mist's colour. Sampled at the camera.
- **Calms** (`weatherAt().wind`, `SKY.windK`, `SEA_CHOP`, `uChop`). Wind 1 the trades, 0 a calm, on a slow noise (~25% of the time,
  hours at a stretch; a shower is a gust front). A calm brings the wind to 0.15 of `WIND_U` (the clouds hang, the audio's wind bed
  drops), kills the spray (whitecaps want a Beaufort 4: ×wind²) and the chop — the three short waves (L < 20) scale by `SEA_CHOP`
  0.25..1 in `waveH` and `uChop` in the wave GLSL (both shaders that sum the waves bind it), the swell keeps running, physics and
  surface agree. **The dawn mist** (`MIST_DAWN`): clear (cover < 0.45) × calm (wind < 0.5) × the lagoon field at the camera², from
  3 h before sunrise, full at sunrise, gone 1.2 h after; 0.02/m at the water over 6 m — a mist lying on the lagoon that burns off.
  First one under the boot weather: the sunrise at h 176 (day 6, wind 0, cover 0.08); the readout says `mist`.
- The readout adds `calm`, `eclipse`, `mist`, `vog`. Seen in the harness: the moon in totality (dark red, 5 px at 960 wide), a calm
  clear dawn from the lagoon (the horizon lifted pink). Unseen, in order: the plume from the water (the points' size clamp: puffs nearer
  than ~80 m may draw small; if it reads wrong the fix is instanced quads); the vog's grey downwind of the cone; the chop dying in a
  calm without a pop (`SEA_CHOP` eases with the weather noise, not a switch); the first night's eclipse at 15 + 4.5 real minutes in.

### v11.17.2 — the sky compiled (10 Sep)
Seen: the dome's fragment failed — `uMistW` undeclared (the third mist layer read it from `MIST_GLSL`; the dome declared only `uMist`
and `uMistC`). Declared and bound. The harness had masked it by declaring all three itself; it now declares none and relies on the
game's shader, as it should have.

## v11.18 — odds and ends (10 Sep)
The person's five asks, all built here and unseen.
- **Mouth parts sway with the body** (creatures_spec.js `compile`). The slowbloods' sway (`tail.body`) yawed the merged hull mesh alone;
  the mouth's cap and tentacle rig (`mouthArms`), the `finTrio` groups and the tail's hinge were children of the creature group and stood
  still under it. There is a body frame now (`ctx.bf`, `B.frame`): the hull, fins, tail and mouth cap ride it and the sway is the frame's;
  a rig flagged `ride` (the mouth tentacles) has its rest points yawed with the frame after the hooks pose it — the rigs stay in `g`,
  skinned in the creature's frame. The lab's split meshes track the frame (`r.D`). Checked headless: the mouth ring's mean tip yaws by
  exactly the frame's angle. The player's finback is the case they saw; every spec slowblood has it now.
- **First person** (player.js `toggleFP`, `f` in play). The camera a little ahead of the nose (`F.nose` × scale + `FP_AHEAD` 0.35),
  looking along the view, no lerp, the surface-side hysteresis and `CAM_CLEAR` kept; the whole body hidden (arms too — "hide the hands").
  The body still casts, disturbs and is bitten. No touch control for it.
- **Rain, three ways.** *The light:* `shade` is `1 − 0.30·cover − 0.20·rain` (was 0.45/0.35): a daytime shower leaves ~0.52 of noon's
  sky light; it left 0.24, under a clear full-moon night's 0.31. The direct beam still dies under a shower (no caustics, no shadows).
  *The look:* the "crowns" were 0.67 m grid squares flashed white a frame at a time; they are rings now — per 0.8 m cell a splash then a
  ring growing to 0.34 m and fading over 1.1 s, offset randomly in the cell, within ~30 m of the camera, and the surface goes matte
  (specular × 0.4) under rain. The streaks: a `ShaderMaterial` with a per-vertex alpha that fades with distance (`RAIN_R` 14, so nothing
  pops at the box edge), tapering from the drop to its tail, each drop its own fall speed and streak length, 620 (260 low), wind slant
  halved, lit by the sky. *The sound:* the in-air bed was pink noise above 2.4 kHz (a hiss); it is a patter (`auNoise(6,380)`: 380 drops a
  second rung through a wide 1.5 kHz band, `AU.rainAir`) over a soft hush below 1.4 kHz (`AU.rainHush`), at 0.09 + 0.06 of the bed. The
  under-water bed was white noise above 3 kHz met by the water's 2.4 kHz lowpass — a narrow band at ~2.5–3 kHz, the screech; it is pink
  through a wide 900 Hz band now at 0.16 × the depth fade (the slosh is 0.22), 0.08 in air. Every level is blind; the tuner's j-k scales
  them all with the beds.
- **The load-in** (creatures_ai.js `spawn`). Two causes. The far pose: the rigs held `armRing`'s build pose (0.3 rad spread — a lurker's
  arms raised 17°, a sailer's 25 m lines splayed) until the near LOD switched them on and the sim dropped them; and the sailers and jellies
  are transparent, so `bakeLOD` skips them and the far thing *is* the build pose. Now every spawn poses its rigs with the creature's own
  idle anim and `rigRest` before the bake (the kind's shared bake inherits it). And `lodNear` on the def: lurker 75, deepbell 90, pall 110,
  sailer 130, greatsailer 230 (its lines are 62 m); the rest keep `45 + 4·size`. The switch itself still snaps the chains to rest; it happens
  further off now.
- **The current** (creatures_ai.js). Creatures were advected at the water's full speed and their steering never knew: sitters drifted off
  their homes too (the lurker in `sit` had no clamp). Now `c.carried` is false for a sitter, a grounded body, a trap or a floor crawler;
  and `seek` and the boid steer subtract the current from the way they want to go over the ground, clipped to `CUR_FIGHT` 1.2 × the speed
  asked, so a swimmer crabs upstream, holds station facing into the flow with its tail beating (the anim reads its through-water speed),
  and is swept only when the current outruns it. Drifters (jellies, sailers) drift as before.
Unseen, in order: does the finback's mouth move with its head now; first person at the surface (the camera held clear of the wave on its
side — does it flicker); a shower by day (the light under water, the rings, the streaks against the sky, the patter) and from under the
surface (the rush, its level against the slosh); a sailer approached from 150 m (the lines straight, then streaming at 130 m); a lurker at
80 m; a grazer in the pass current (facing upstream, holding). Tests: all green; `test/anim.js` unchanged.

### v11.18.1 — the invisible bestiary (10 Sep)
Seen: everything invisible in play, the player bitten to death by things it could not see. Mine: v11.18's edit to the `lodNear` line in
`spawn` put a comment before `c.lodFar=…` and swallowed it, so `lodFar` was undefined, `dp<c.lodFar` false, and every creature was hidden
while it went on hunting. Restored. The smoke test now fails if no creature is drawn after the short run — it printed the count all
along and never checked it. Not first person: that toggle only hides the player's own body.

### v11.18.1 — the creatures were there, unseen (10 Sep)
Seen: almost every creature hidden, first person or not, shadows moving on the floor and bites from nothing. Mine: the v11.18 edit
that put `lodNear` on the def carried its comment over the rest of the line, so `c.lodFar=...` became part of the comment; with
`lodFar` undefined every creature failed `dp<c.lodFar` and was hidden while it still swam, hunted and bit. Restored. The smoke test
printed the visible count but never checked it; it now fails if nothing is drawn after the short run.

## v11.19 — where rock goes (10 Sep)
The person's two-part ask: first decide, from the geology, where rock *belongs* — "if rocks don't belong somewhere, they don't go there;
if I thought it looked cool, that's not a good enough reason" — and only then fix the look: the rock formations that were "a mountain of
crap" (the old spire's site) and the big videogamey blocks littering the terraces on the way down to the vents (their screenshot). Built
here and unseen.

**What the survey found** (headless, `bigsFor` over every cell): 238 structures. Twenty-three heaps and sheets stood on the *rift arms*,
four heaps of scale 34–46 on arm 0 between r 900 and 1150 at −110 to −175 — the terraces above the fissure, the screenshot exactly. Cause:
`young` is 0.7 on the arms (a fresh flow) and the heap envelope was `young ≥ 0.45`, written for the collapse fan and catching the arms by
accident. A rift arm is an intact flow, not a debris field: nothing on it but its own rubble. Also: the sheet kit is 5.6× its scale wide, so
a scale-28 slab was a 157 m plate lying across 60 m hummocks — the clipping; `crag3` (8–24 m heaps on any bare rock) sat on every riser of
every terrace, 112 of them; and `rel` is 0 over the whole fan (the scarp drops it below the smooth shield), so it cannot gate anything there.

**The decision** (DESIGN, Structures, "Where rock goes"): talus lies under a face; heaps and sheets are the slide's and lie only where its
debris is thick and the ground can carry them; a rockfall cone at a face's foot; the dike ridges, the risers and the rim are the rock, and
carry blocks, not piles. Built as:
- **The heap is a pile of alike blocks** (`heapGeo`): fifteen level-2 blocks of r 0.34–0.5, nine on the ground, four on their shoulders, two
  on top; ~3 wide, ~1.2 tall, 3600 tris. Was one lump with four satellites (1200 tris) — the videogame rock. `crag` 8–20 (blocks 6–17 m),
  `crag2` 6–14; sinks 0.25 so the base course shows its top third and the second course stands clear.
- **Heaps and sheets need `young ≥ 0.8`** (the fan where the debris is thick; the arms' 0.7 and the fan's thinning edges are out) and
  `heat ≤ 0.05` (off the fissure). Sized by depth as the fan is: `crag` and `slab` −180/−170 to −60 (the fan is −85 at the scarp), `crag2`
  −300 to −150, `slab2` −230 to −100. Sheets 6–14 and 5–12 (were 12–28, 10–24: 34–78 m plates now).
- **`fit`** (chunks.js `settleOn`, both the cell and far.js `bigPlace`): a kit reads the ground at eight points on its foot circle, lies on
  the least-squares plane through them (it lay on four axial points before) and is *not placed* if the ground falls more than `fit[0]` ×
  scale below that plane (an edge would float) or rises more than `fit[1]` above it (buried). Heaps [0.35, 0.5], sheets [0.3, 0.55],
  `crag3` [0.4, 0.5]. Measured before setting: the median placed sheet had a 0.28–0.40 gap, the 90th percentile 0.54–1.04 scales — plates
  hanging a third of their size over the hummocks. Near the scarp few sheets pass (5 in the world); mid-fan 16; that is the fan.
- **`face`** ([R, rise], `settleOn`): only where the ground within R rises `rise` above the point. **`talus`**, a new block entry (0.8–3.2 m,
  420 tries a cell, `face` [14, 6], off the fan and the arms which have their own rubble): a boulder beach at the back of every terrace
  tread, the scarp's foot, the dike flanks, the rim's feet — 100–190 a cell on the terraces, 0 on the shelf. `crag3` is a rockfall cone now:
  4–10 (was 8–24), `face` [16, 8], on `sub ≥ 0.6`; 42 in the world (was 112). `boulder2` keeps off faces (`maxSlope` 1.2, was 1.9: a block
  on a 60° face rolls off it); the ledges are untouched — the walls the person likes are theirs.
- After: 160 structures, 401k tris (were 238 and 262k; the heaps cost more each and there are more of them, all on the fan); nothing
  on the arms but blocks and the cairns; `crag` 20, `crag2` 37 on the fan.
- `FLORA=1 node test/preview.js crag` renders a rock kit now (one column, the line at its sink); the heap was looked at there.
Unseen, in order: the terraces above the fissure with the heaps gone (arm 0, r 900–1150) — does the boulder beach under each riser read;
the fan's piles — are 6–17 m blocks in a pile still "big", and does any sheet still hang over a hummock; the old spire's site on the dike
crest (only blocks and ledges now); whether 420 talus tries a cell shows in the readout's cell-build time. Tests: all green.

### v11.19.1 — the fan's hummocks rounded (10 Sep)
Seen (four screenshots at r 470–570 on the collapse fan, just under the scarp): the terrace walls and the small rock "great", the overhaul
"awesome and not out of place"; but a big pile there met "the sort of wavy ground" awkwardly, and between the walls on either side "strange
jagged terrain that has lots of clipping with rocks and some flora". The terrain, not the rock: the fan's hummocks were `rg²` of a tent
(`rg = 1−|2f−1|` of the clamped noise) — a crease along every crest, a kink at every foot, and the crests running along the noise's median
contour as a maze of ridges (the fishbowl's walls). Measured across the fan near the scarp: 41, 40 and 34 of 81 sample steps had a second
difference over 0.5 m/m² (the plain terraces: 21, all of them risers), the sharpest 6.2. Now (world.js `sample`): the mound is a smoothstep
of the same noise, `smooth(0.5, 0.68, fbm)` — a rounded mound on the noise's high ground, continuous slope at crest and foot, flat between;
creases 11, 17, 23 and the sharpest 2.4; the steepest ground on the fan 6.4 → 4.9. Same noise, so the mounds stand where the old ridges'
high points were. The surface-breaking blocks read the same noise (`smooth(0.68, 0.78)`): they were breaking the surface at 4 of 20,000
sample points before and at 0 now — PLANET's "a few blocks stand out of the water near the scarp" was never really built; the person's
call whether to make it so (the term would need ~70 m, a mesa, not a spire). More of the slide's rock fits the ground now: 183
structures, 466k tris (crag 23, crag2 45, slab 7, slab2 25). Unseen: the fan from the scarp's foot looking out — are the mounds mounds, and
do the piles meet them.

## v11.20 — the reef as a landform: the framework generator (10 Sep 2026), built, unseen
The person asked, with two screenshots of the tiered spiny towers (80 m and 17 m), what size coral really is and whether bigger
structures are believable here or nearby; if bigger, a list and a generator; judge them as tools for a larger world. `REEF.md` is the
answer: a single colony tops out near 6–8 m tall and 30 m wide as a mound (the Solomon Islands *Pavona*, 34 m, 5.5 m, 300–500 yr); a tall
rigid individual at 3–5 m; **everything larger is framework** — dead skeleton cemented by crusts, alive only on its skin — and that has
no ceiling (bommies 30 m, Silurian pinnacle reefs 200 m thick, cold-water mounds kilometres long in the dark, sponge reefs 20 m on mud).
The eight drowned terraces are ~40,000 years of subsidence: enough time, and they imply drowned reefs on every lip the world didn't have.
The fields were scanned for where framework fits (REEF, measured): the rim and lagoon, the terrace lips, the current flank, the deep mud;
never the fan. Built: `src/reef.js` (new file, after flora in order.txt; its entries append to FLORA so the rock's rng streams are
untouched) — four kits by growth rules in the rock's language and a lime palette: **pinnacle** (widens upward: undercut foot, wide
shoulder; a capped one whose top died flat at the lowest tide), **mound** (long and low along the current: the cold-water reef on the
NE flank, the glass reef on the apron's mud), **atoll** (a microatoll: flat dead plate, live rim), **ridge** (a drowned reef along a
terrace's lip). Every kit carries **anchors** (points and normals on its upper surfaces) and its entry an **epi table**; the cell coats
the structure from the ordinary species roster (`chunks.js coatStructure`, `placeEpibionts`, after `placeBigSolids`): a species drawn by
weight from the entries the anchor's face allows, gated by its own envelope at the anchor's depth with the substrate forced to rock,
stood along the normal (`upTo`, a hand-rolled quaternion so the stub agrees), never into the air, in per-species instanced meshes with
colliders — the framework is the far layer's, the coat the cell's, and no two pinnacles wear the same. far.js: `clear` (a top's
distance under mean level, 12 for rock, 5 for a reef: it grows to the lowest tide and stops), `fill` (scale up to reach it), `flow`
on a structure (yaw along the current, the rng draw kept). chunks.js `settleOn`: `drop:[R,fall]`, a lip gate, the mirror of `face`.
The **tower** cut to 4.5–6 m (was 11–14, 20 at scale; the person: "make the change") with four tiers and `s` [0.7, 1.2]: a single
fisher colony stood up out of the terrace's silt layer. test/preview.js: `FLORA=1` draws a reef kit's anchors as pins and, with
`SCALE`/`DEPTH`, the kit in its coat (`COAT=0` bare); `coatStructure`, `mulberry` and `sample` exported to it. Looked at headlessly:
the bare kits (mushroom pinnacles, the ring, the ridges) and a coated pinnacle at −10 (tables on the shoulder, horns and cups on the
flanks, limerind; 24 colonies of 40 anchors), a capped one at −5, an atoll. Count: 112 pinnacles (capped tops all at −5.0..−5.4),
23 atolls, 97 drowned ridges at −54..−165, 11 cold-water mounds, 34 glass reefs; 277 structures, 755k tris world-wide (the rock: 401k).
Tests pass both tiers. **Unseen, all of it** — REEF.md has the order to ask: a pinnacle from the surface and its foot (a reef knoll or a
pile of rocks?), the capped tops at a spring low, the ridges on their lips, colonies floating off or sunk into the facets, `render` ms
on the rim and at (900, −400), the small tower. Not built, listed as tools in REEF: spur-and-groove, the fore-reef wall, rubble ramparts,
rust stromatolite mounds, a mesophotic (red-symbiont) farmer — the last a new TAXA split, asked.

## v11.20.1 — the reef seen: white rocks (10 Sep 2026), built, unseen
Seen (10 Sep, two screenshots in the lagoon at 6 m): the pinnacles as "really strange looking rock structures" — pale blue-white faceted piles,
bare. Two causes. (1) The coat was never placed: a v11.20 edit swallowed `scl.set`/`M.compose` in `coatStructure` into a trailing comment, so
every colony went into the cell at the identity matrix (a headless count showed 270 colonies a cell; none where they belonged). Fixed; the
preview now shows the coat. (2) The lime palette was 0.86 beside basalt at 0.34: ice. Now a warm grey at ~0.5 (`LIME`, `DEADLIME` 0.4,
`COLDLIME` 0.5, `GLASSLIME` 0.46). Also: anchors now sit on the lump's true dodecahedron surface (`dodecHit`, `dodecInside` in reef.js; they
were at 0.84 of the circumradius, half of them buried); the pinnacle's ring lumps are fewer, bigger and nearer the axis so it reads as one
mass; more anchors a lump (5 flank / 6–7 top); the tower cut to 4.5–6 m (REEF.md); pinnacles halved (`per` 4/3/2).
Unseen: the coat on a pinnacle in the lagoon; the dun tint under the water; whether it now reads as a reef knoll and not a rock pile.

## v11.21 — the coat on the geology's rock; the manufactured reefs struck (10 Sep 2026), built, unseen
Seen (10 Sep, three screenshots): the coated pinnacles "MUCH better" and disliked — "like a piece of art displayed deliberately"; the person's
finding: coral and rock never touch anywhere in the world, so fix that instead of building rock to coat. Built: the five manufactured reef
structures struck (reef.js keeps the kits; no entries); `ROCK_EPI` — 21 species that cement to rock — and anchors on every rock: kits
(`kitAnchors`, ~7 per unit of lump radius: a heap ~40, a sheet ~30), blocks (`BLOCK_ANCHORS`, five on the unit dodecahedron, coated from
scale 2.2 — ~4.5 m across — `epiMin`), ledges (placeCliffs); the coat gathered per cell (`coatRocks` → `ch.coat`) and drawn with the
structures' in `placeEpibionts`, now after the cliffs. `coatStructure`: the pick is weighted by each species' envelope at the anchor before the
draw (an anchor goes to what fits; before, a fan drawn on a lagoon rock was a wasted anchor), tops by the *world* normal (a tilted block),
nothing facing down, nothing under the ground (`hAt`). Two more giant colonies: `olddome2` (two lobes, 12–22), `olddome3` (low and wide,
14–30), each `per` 1 like the old dome. REEF.md has the v11.21 note at its head.
Headless: a fan cell 1539 flora instances / 1842 solids, a rim cell 2031 / 660 — the coat is a few hundred a cell where there is rock.
Unseen, ask in this order: a heap on the fan from close (rust horns, beards, rinds *on* the blocks; do they sit on the facets or float); the
talus under a riser at −70 (fans on the faces, rinds); a big boulder in the lagoon (tables, horns, limerind); whether the coat reads as growth
or as confetti — the `p` values in `ROCK_EPI` are the knob, and `kitAnchors`'s 7; the two new giants beside the old one.

## v11.22 — nothing grows inside rock (10 Sep 2026), built, unseen
Seen (10 Sep, nine screenshots): "an immense amount of clipping between rocks and plants" — plants inside blocks with their tips out, cones
through walls, the coat's colonies flat on faces or at odd angles, things "encased by 3 rocks"; and the coat on dark rock "completely out of
place". The person asked for a system, not tweaking: "put the placed rocks with stuff stuck to it in the bin". Built: (1) **the rock coat is
struck** — reef.js keeps only the two giant shapes; `coatStructure`, `coatRocks`, `placeEpibionts`, `ROCK_EPI`, the anchors and the kits are
gone (in the v11.20–11.21 zips if ever wanted). (2) **The order**: a cell places its rock first — the structures' collision (own, and the
neighbours' that reach in, registered here too so an unloaded neighbour's crag is seen), the cliffs' ledges, the blocks — and only then what
grows. (3) **The clearance test** (`clearOf`, placeFloraType): every plant asks the collision hash before it stands — its base as a pad the
size of its footprint, and its middle if it is over 3 m — through `solidPush` with the cell under construction as `extra`: the same hash the
player is pushed by, so whatever a body cannot pass through, nothing grows through. Rigid plants placed earlier in FLORA are solids too, so
later ones keep out of them. A rejected plant is not moved, it is not placed. Headless: a fan cell 1539 → 762 flora instances (half its
plants stood in rock), the dikes 1512 → 1156, the lagoon 2066 → 2030; ~0.5 µs a query.
Unseen: the fan and the dikes from close — nothing through a block; whether the fan now reads bare (the rust mats between the blocks are all
that is left there, which is the geology's answer; if it wants more, the boulders' `per` is the knob, not the test); a cell line with a big
crag across it.

## v11.23 — the effects list, the shadow map, your own shadow in first person, the water's light under a shower (10 Sep 2026), built, unseen
The person's asks. (1) **The effects list** (`src/effects.js`, `#fx` in the shell): the cosmetic systems switchable live, in the game's own
text — the word `effects` at the bottom right of the menu, or `e` on the menu and in play (the pointer is released while it is open and
taken back when it closes; escape or a click on the canvas closes it too). Rows: caustics, shadows, sharp shadows, light shafts, marine
snow, rain (the streaks and the rings; the shower itself stays), clouds (the cumulus march, the sky shader's one cost), surface glow (the
shimmer under the surface), vignette. Nothing in it touches the world or its physics. Saved in localStorage (`tethys.fx`); `FX_DEF` is a fresh
browser's set — everything on, shadows off on the low tier. `FX.key` is read where each system draws; a new switch is a key, a row and a read.
(2) **The shadows, second pass** (scene.js, "Shadows (v11.23)"): the capsule shadows are gone; in their place one shadow map along the sun —
three's own depth pass (`sun.castShadow`, a 2048² map on high, 1024² on low, ×2 with "sharp shadows") over a 128 m box (80 on low) that
follows a point ahead of the camera, texel-snapped, its up vector north so it never spins as the sun crosses the zenith — read by hand in
every tinted fragment from the world position (never through three's `receiveShadow`: r128 keys the program on it per material and one
material serves everything, so nothing "receives" as far as three knows). Five taps: the centre for the caster's distance, four on a
rotated square whose radius widens 5% a metre from the caster, each faded by that distance (35 m under water, 300 in air) — the same
penumbra and scattering the capsules had — the box's edge faded over its outer 7%, a normal offset of two texels and a 0.3 m bias
against acne. Every creature's meshes cast when the creature is among the nearest `Q.casters` bodies by size (16 high / 6 low, scored
`distance − 8·size` as before, `updateShadow` switches `castShadow` per creature so the depth pass stays a few dozen draws); the flora, the
rock and the terrain never cast (their occlusion is baked at build, as in v11.13). So every animal in the frame has the same shadow —
its own silhouette, arms and fins included — and one that lands on the flora and on other bodies, which the capsules never did. The
**light's direction** changed with it: under water the Lambert key (and so the map) is now the *refracted* sun, in air the true one, blended
over the crossing (`medK`); at noon nothing moves, at a low sun the underwater world is lit from ≥42° up instead of from the horizon — what
the water does. Under cloud the key rises toward the zenith as the beam dies (`K.lumLw`); the shadows and the caustics fade with the beam's
share (`uSunW.w`) as before. (3) **Your own shadow in first person**: the body is no longer hidden — three's depth pass skips a hidden
object, so it had no shadow — it wears `MATGHOST` (writes no colour, no depth) and still casts. (4) **Rain under water**: a shower cut the
sky's light to 0.52 and killed the beam, and under water the sun *is* most of the light, so a shower was "extremely dark". Now the water has
its own sky light, `K.skyLw` (cloud takes 12%, rain 8% — an overcast sky is still a whole sky of diffuse light; the beam is what dies), and
its own key, `K.lumLw` — the beam, or 0.6 of the diffuse light from above when the beam is gone. The veil, the ambient, the depth's daylight
and the key under water scale by these; the air and the sea seen from above keep `skyL`. The readout shows `light air/water` under water.
Measured headless: nothing (the shadow pass is a GPU thing and a draw count). The readout's `draws` includes the depth pass, so the rise is
visible there; `render` ms is the number to watch.
**Unseen, ask in this order:** whether the world draws at all (the shadow GLSL is new in every tinted material: black or magenta at boot means it);
the player's shadow on the sand at noon from third person, then from first person looking down (`f`); a school's shadows — every fish, not six;
a shadow falling across weed and across another body; acne or a crawl as the camera moves (the snapping); the box's edge (a shadow fading
64 m out); the shadows under a low sun (the refracted direction: a shadow never longer than ~1.1× the height); the underwater light at
sunset (now from ≥42° up — say if it reads wrong); a shower from under the surface (should barely dim); the effects list on the menu and in
play (does the pointer come back on close); `render` ms with shadows on and off, and with sharp on. `Q.casters`, `SHM_R`, `SHM_BIAS`, the
0.05/m penumbra and the 35 m fade are the knobs; `renderer.shadowMap.enabled` false and `LIGHT_K[1]` 0 is off.

## v11.24 — the marine snow as what the column holds (10 Sep 2026), built, unseen
The person's ask: the snow was one even cloud with minor current and body physics; reason about how it really works — surely the stuff at
the bottom of the world is different from the top, in composition and concentration — then plan and build it. What is real (DESIGN, Contact,
"The snow"): marine snow is not one thing. The lit layer holds living plankton and fine debris, most under the surface and again at the
thermocline where the nutrients sit (a chlorophyll maximum); the aggregates — the snow proper — form under it and sink, fewer with depth as
bacteria eat them (the Martin curve), bigger and browner as the small ones go; particles pile up at every density step because settling
slows there, so there are thin layers on the thermocline and a particle maximum at the chemocline where iron and manganese come out of
solution (the Black Sea has this layer: rusty above, a milky bacterial plate in it); below the chemocline the water is ferrous and sulfidic
and iron sulfide falls out as black flakes, sparse and nearly still in stratified water; over any mud or sand the current lifts a bottom
nepheloid layer of the bed's own mineral; the surf's column carries sand and bubbles; a vent field's plume is sulfide grains carried up by
its convection and settling downwind; the swell's orbital motion swings everything in the top 15 m. Built in atmosphere.js: five kinds
(live, floc, silt, bubble, black) by weight functions of depth, height over the floor and the point's own cached fields (`snowW`), every
point one kind or parked so the count goes where the snow is (`Q.snow` 1800 / 1000), a refresh at one point in 64 a frame that re-rolls
the kind where the point has sunk to, settling slowed at the two density steps, turbulence by wind, bed and vent and none in the deep, the
two longest waves' orbits, the flow round bodies as before; a per-point colour, size and alpha through an `onBeforeCompile` patch of the
points chunks, the material colour as the light and the player's light added per point by distance (in the dark the snow shows in the
torch's reach only). Fall rates ~10× reality (the old rate was ~400×). `test/snow.js` (in `--test`) prints the mix at twelve sites and
checks the layering; headless 0.33 ms a frame in the sandbox against 0.17 before. Found on the way: the chimney landmark stands just
outside the `heat` sector (raw 2.60 against the warped field's 2.66–2.7), so its own water has never had heat — the fissure field beside
it does (not changed; theirs to move).
**Unseen, ask in this order:** whether the snow draws at all and at sizes (a warning `snow: points chunks not as expected` means the patch
missed and it draws uniform); the top 3 m under the shelf's surface in a wind (fine pale motes swinging with the swell, bubbles rising over
the windward shore); the thermocline's layer from the slope at −64 (a visible band?); the deep at −200 (few big brown flakes, most of the
count parked — too sparse?); the plate from 30 m above (rust, then milk); under it (black flakes only in the torch's reach — is that too
dark, or right); the bed over the apron mud (the nepheloid layer's silt in the current); the vent field's dark grains lifting; the lagoon's
fine silt; the night; `phys` ms on the readout with the snow on and off (the effects list). Knobs: `SN_K` (size, fall), `SN_W0` (how much
weight fills the count), `SN_GAIN` (weight to alpha), `SN_REF`, the weights in `snowW`, the colours in `snowSeed`.

## v11.25 — every creature in the creator (10 Sep 2026), built, unseen
The person's ask (IDEAS #4, suspended since v11.11): fully implement the creature creator for the other clades. Read as: every species of the
roster is a spec now, the lab can load and edit all of them, and the drifters are a clade in the grammar. The eighteen hand builders that
were left — rasp, veil, lurker, watcher, pall; eel, stone; scuttle, trap, hook, picker, flicker, tread, comb; jelly, deepbell, sailer,
greatsailer — are gone from creatures_builders.js (the kit stays); `SPECS` has 37 entries (plus `deepbell`, `greatsailer` and `glim` as
scale variants of the jelly, the sailer and the darter, so the bestiary's `l` opens them too). Built in creatures_spec.js:
- **Cores.** Seven new: `sac` (the deep line: a mantle ellipsoid or a lathe profile with a collar ellipsoid — the pall, the veil), `chain`
  (the eel: the body is one chain; the core skins the rig over the finished part list through a `finish` hook, so the eye ring and the
  mouth ride the head segment; it `provides` the clade's tail), `shield` (the scuttle: a domed body under the valves with a head plate),
  `bean` (the flicker), `arches` (the tread: the overlapping plates over belly boxes, the shield and the knob), `bell` and `float` (the
  drifters). `coilbody` gained `y`, `breathe` and its segment counts (the lurker and the watcher are a mantle on the floor with no shell;
  the shell is no longer required by the core). `trunk` gained `z0`, `y`, a head offset, a tail box and a snout box, and every hingeshell
  frame carries the fields the armour and limb parts read (`z0 z1 LT w0 w1 h0 h1 H zh hy ht zf`), so those parts sit on any hingeshell core.
  A core parameter's default may be a function of the core (`z0` from `L`).
- **Parts and styles.** eyes: `arc` (a row round the shield's rim — the scuttle, the tread), `rows` (the hook's two rows, the picker's pair),
  stalks that `rise` on the tell (the trap), stalk thickness and colour. mouth: `rasp`, `peck` (the picker's pecking proboscis), `slit` (one
  dark box: the forage). arms: `crawl` and `raise` (flat rings on the floor with the `PLANS` — fan, crawl, raise — the lurker, the rasp, the
  watcher), `net` (webbed, the pall and the veil), `hang` and `lines` (the drifters), with colour, countershade, soft, web, taper, phase
  in steps. spines on hingeshells too. plates: per-plate width over the radius (the stone). tail: `stub`. comb: `teeth` (the tread's
  feeding combs). tailplate: the fan placed by hand, `abdomen` (the flicker's tail-flick). legs: `placed`, `walk`, `hang`, `rock`,
  `march`, `swim`. valves: `placed` (by hand) and `clam` (the flicker's translucent halves), and how they open (`o0 o1 tc sc tk sk`).
  flaps placed by hand. weapon: `combs` (the filter feeder's appendages). A new kind, `head` (`turret`: the watcher's raised head of five
  eyes that looks about). `spec.mat: 'glass'` builds every mesh translucent (the flicker, the drifters). A parameter's believable band may
  be a function of the style (`bandOf`); the bands widened where the roster sits.
- **The grammar.** A fourth clade, `drifters` (cores bell/float, arms required, no eyes — the calculator says so if you add any); the
  ringmouths and hingeshells require *a* mouth of any of their styles; a core may `provide` a required part; `STYLE_CLADES` covers the arm
  styles. `CLADE_LIMIT` ringmouths 16 (the veil).
- **The calculator.** A core may supply thrust, mode and buoyancy (the chain undulates, the bell pulses, the float sails and floats); legs
  give walking thrust; a `sail` mode. **Found and fixed:** since v11.18 (the body frame) `derive` had silently read no thrust from any
  moving part — the tail's mesh went into `ctx.bf`, which the dry context lacked, the build threw and was swallowed — so every slowblood
  read "nothing propels it" and speed 0 in the lab. The dry context has a frame now; fin 7.5 again (the v11.10 calibration).
- `PAL` has `jelly`, `deepbell`, `sailer` (the builders' fixed colours as keys); `coatFor` draws the drifters' keys (a bell colourless in
  the light, dark red below it). The lab lists the drifters, names the new sliders, edits a lathe sac's profile. `test/ident.js` compares
  the eighteen against a v11.24 copy of the builders (`OLD=`): rasp, lurker, pall, eel, stone, jelly, deepbell identical to the bit; the
  rest the same shape with tessellation-level differences, looked at side by side in the preview (trap: the raptor `fold` weapon at 1.58
  stands in for its three-segment arm; the watcher, the flicker and the tread carry the mouth the grammar requires — a beak under the head,
  a slit, a plate ring under the shield). Smoke: 37 specs and four blanks build, act, cruise, place.
**Unseen:** all of it in the game — the migrated eighteen in the world and the bestiary (the previews match the old sheets; the rigs and
the far bake are the same paths), the lab panel on the new cores (the arches' twenty sliders; a chain body's parts cannot be lit under the
cursor), the drawn coats for a drifter, `p` placing a drifter (role drift, no eyes) or a walker. Ask first for the bestiary run through
(z, right ×36) — anything that looks wrong — then the lab on the tread, the eel and the jelly.

## v11.26 — the ecology: the world as a ledger (10 Sep 2026)
The person asked for the population to represent a real ecosystem — an accurate number of predators, every kind at a reasonable
number, deaths, the eating of flesh, hunger, births (pregnancy, eggs if that is what it takes), and the world changing off screen rather
than frozen or patrolling forever. What was found first (`test/census.js`, new): the pyramid was upside down — 70 ridges, 64 orthos, 91
eels, 180 lurkers, 247 arrows against 465 flickers and 172 darters in 12 km² of water, hunter biomass 600× the edible — and it did not
matter, because no hunt could end: every prey's `flee` matched or beat its hunter's `speed`, a school scattered at 14 m before a hunter
saw it at 12, the grazers had 1e9 hp so every ridge chase ended "bored", and a kill came back at its home ninety seconds later.
- **The ledger** (`src/ecology.js`, DESIGN The ecology). Every cell of the 256 holds a count per spawn entry; capacity is the envelope's
  mean tolerance over the cell times `n` (`ecoCap`, from the cell's grid when loaded, 36 samples on paper otherwise — the paper census runs
  four cells a frame after boot, ~120 ms in all). A loading cell spawns the ledger's count (`ecoTake`), rounded by its rng, and the ledger
  keeps what actually stood; an unloading cell writes its living back (`ecoWriteBack`); a death debits (`ecoDebit`). Nothing respawns.
- **The model** (`ecoModelGen`, a piece a frame every 3 s — 3.6 ms whole on the sandbox CPU): for the cells nobody is in, births by
  allometry (r = 0.12·mass^-¼ a game day: a flicker breeds sixty times as fast as a ridge), natural death at a tenth of r, predation by a
  type-III functional response over each hunter's reach (its cell; the 3×3 at half weight past a 60 m home; the 5×5 past 300 — the abyssal
  lives in the dark and hunts the combs on the plain above it), the take capped at 35% of a kind in a cell a day, a hunter's condition from
  what it got, starvation under 0.35, a drift of 3%/day toward the neighbours' free capacity (a hungry hunter kind five times as readily).
  **A hunter's capacity in a cell is its envelope times its prey response there** — predators are where prey is, not where a band says
  they may be; the paper hunters start at 0.8 of that (`ecoSettle`). A hunter's intake is 5%/day of its mass at unit mass, falling with
  size (`q0`); its hunger clock is 0.5·mass^¼ days; its meal is the intake over the clock. The small forage carries a `stock` — one drawn
  flicker stands for eight, a rasp for eight, a scuttle for four, a picker for three, a grazer for three — the way the snow's points
  stand for more; without it the visible forage feeds one eel. The rates are per game day, compressed the way the tide is; the ratios are
  Earth's. `test/census.js 120` runs it on paper: from the envelopes' start the world settles in three weeks and holds — about 600 flickers,
  240 darters, 125 rasps, 90 scuttles, 70 grazers, 70 pickers, 110 arrows, 50 needles, 27 hoses, 23 lurkers, 18 traps, 16 hooks, 11 eels, 5
  sickles, 5 stones, 4 crushers, 4 ridges, 3 orthos, 2 abyssals, 1–2 baskers (the vent's picker swarm feeds it), 14 combs.
- **The numbers** (`SPAWN`): `n` is capacity per cell in individuals (groups by `grp`), the strand's scuttles an entry of their own
  (`land`, by land area, `max` 8). Predators cut to what the water carries, forage and grazers up; the grazers to −160 (the terraces' sand)
  so the ridges and stones there eat; the crusher's band to −50 where the rasps are; pickers at the vents; prey lists widened where PLANET's
  placement put a hunter above nothing it could eat (ortho + grazer, picker; ridge + picker; stone + grazer, torpid: a 5-day clock; lurker
  and hook get prey lists at all — they lunged at the player only). Grazers (hp 70) and combs (260) are mortal; the veil is off the
  abyssal's list (it could never die). The loaded 25 cells at the peak hold ~1350 (1100 before); the world ~2600.
- **Hunger, live** (`hungerTick`): a hunter's clock runs fed→starving over its cycle; it hunts only past 0.4 (a fed ridge cruises past the
  player; the great still rams, the drifters still sting — neither feeds); the chase is a burst (1.6× for two seconds, tiring to cruise)
  that gives up after 9 s on anything but the player; a kill sets the clock back by the prey's food over the meal, and the killer stays
  and **feeds** at the body; at 1 it starves, and a cycle and a fifth past that it dies. Ambushers lunge at their prey (a lurker takes a
  darter; a hook a flicker) when hungry; a trap strikes at nearly anything (a reflex) but not on a full stomach.
- **Carcasses** (`kill`, `updateCarcass`): a body eaten whole (the player's bite; a small prey in a big mouth, under 35% of the meal;
  a flicker) goes; the rest stays in the scene, sinks, rolls onto its side, is pushed against like rock, and is eaten away by its killer,
  by the **scavengers** it draws (`def.scav`: the picker from 90 m, the watcher 50, the crusher 40, the scuttle 30, the rasp 12 — they walk
  to it and eat until it is gone) and by the water (0.45 game days untouched, gone at 1.5× that regardless).
- **Eggs and juveniles** (`layEggs`, `updateEggs`, `juvDef`, `growUp`): what the ledger owes a loaded cell over its living is laid as a
  clutch — up to a group's worth, a knot of seven translucent spheres the clade's colour (ringmouths grey-green, slowbloods amber,
  hingeshells cream) sized by the animal, on the floor within 8 m of an adult of its kind — that hatches after 0.25·mass^¼ days (a
  flicker's in five minutes, a grazer's in twenty, a ridge's in a day and a half) into **juveniles** at 0.55 scale (their own def chained
  to the adult's: size, speed, reach, hp, damage scaled; their own cached geometry) that grow up out of sight after 1·mass^¼ days (the
  adult spawned in their place, entry, school and state kept). A clutch is a carcass to a scavenger of another kind, from half its smell;
  eaten down it hatches fewer and the ledger is debited. A hatched ribbon joins the nearest school of its kind. The strand's scuttles and
  the floats walk in out of sight instead (nowhere the game can show the laying).
- The readout's fourth line: world totals of a few kinds, the tally (born, died, eaten, starved, kills, laid, hatched, eggs, carcasses),
  the nearest hunter's hunger and state. The smoke test prints the ecology and fails on NaN in the ledger; the census is in `--test`.
- Costs: the model 3.6 ms spread over ~20 frames every 3 s; the paper census 120 ms over the first 64 frames; scavengers scan the
  carcasses (a handful) every 0.6 s; the eggs a mesh each. The stub gained `Quaternion.clone/multiply`.
**Unseen:** all of it. Ask first whether the readout's fourth line counts up (kills, laid, hatched) in the shallows over ten minutes; then a
carcass — a needle's kill sinking and lying on the sand, a picker or scuttle walking to it, the killer feeding beside it; a clutch on the
floor near a herd and what hatches from it (do the juveniles read as small ones or as a wrong scale); a fed ridge passing the player;
whether hunts now end (an arrow catching a darter); the number of hunters met in a swim across the shelf (too few now?). If the big
predators are too rare for play, the honest knob is the grazers' `stock` (3) or their `n`; the dishonest one is `q0`. Parked: the player
eating eggs; the bite on a juvenile worth less; eggs guarded by their kind; the model's take from loaded cells (their hunters do it live,
so a cell the player sits in for hours is safer than one they left); the immortal kinds (veil, pall, tread, watcher, great, drifters) have
no birth or death at all; temperature, moulting, detection modes as before.

## v11.27 — the edge of the world (10 Sep 2026), built, unseen
The person, at (1283, −166, −381) with the readout open: looking out into what should be endless dark water there is "a dark corner or
line in here somewhere", "it usually has a horizon look, like it's a skybox or the end of the world"; the goal is that the sky bottom
never pops into reality — there always looks like something is over there, you just happen to have hit the world border. Their spot is
260 m inside the void's edge (the `reach` of the veil's bounded sample). Three things found on paper, three fixes:
- **The veil's colour was a map of the floor** (`WATER`, world.js: `WCOL` indexed by the *floor's* depth — near black over the void
  at −810 and the pit). Read at the bounded point, the void's dark entered every ray that reached it: at their spot the veil looking
  outward was 40% darker than looking along the slope (0.084 vs 0.134 green, on paper) — the dark band on the horizon in the void's
  direction *is* the void's shape, blurred over ~100 m. Now the veil at a point is the table at the point's **own** depth, never brighter
  than the table at `OPEN_D` (150: the sand's bounce belongs to the floor, not to open water), blended toward the floor's entry (with its
  turbidity, plankton and heat) by exp(−(height above the floor − `FLOOR_FREE` 30)/`FLOOR_H` 80). The floor comes from a second 96×96 map
  (`floorMap`, scene.js; `fmRaw`/`FM_DATA` filled and blurred beside the water map in far.js; `wmFloor` reads it on the CPU) and the
  table from `wcol()` in GLSL (`WCOL_GLSL`, generated from `WCOL`). `updateAtmosphere` blends the ambient the same way (the hemisphere
  light over the void was near black: everything swimming out over it went black). On paper: the three directions at their spot now
  agree within 5%; the shelf at −10 over −20 within 1% of before; the surface over the slope 11% brighter (open water at the surface is
  not darker than open water at −150 — the number to lower if that reads wrong is `OPEN_D`, toward 120 for brighter, 250 for darker).
- **The far mesh ended at ±HALF** with the black dome beyond: a straight silhouette 25 m past the player's clamp on every edge. The four
  edge rows of regions carry an **apron** (`apronGen`, far.js; `APRON` offsets 60…2000 beyond the edge, six columns doubling, a block on
  a corner, ~600–1000 more vertices, the same `sample()` — the void's floor at ~−810 runs out flat), in the region's own mesh so the seam
  is no seam. `reg.ext` widens the region's sphere and its distance test in `cullFar`. Checked on paper: every apron triangle faces up,
  no NaN, reach 3720 from the centre.
- **The veil never closed**: the slow population left 1.1% at the far plane, so the dome (black) and a terrain fragment beside it at the
  same distance differed by a percent or two of the terrain's lit colour — on a dark gradient, the far mesh's outline against the dome.
  `FOG_CUT_GLSL` (scene.js): transmittance × (1 − smoothstep(0.62·FAR, 0.9·FAR, d)) in the fog block, `fogExtinctOnly` and the shafts;
  2.7% contrast at the cut's start, 0 at its end; past it every fragment is the veil in that direction exactly, dome or not.
Unseen, all of it. Ask first, at their spot, whether the dark band toward the void is gone (and whether looking down into the void from
its edge reads as deep water); then the edge of the world from the clamp at x = 1695 looking out (the apron: a floor going on into the
fog, no line); then the surface over the slope from just under it (brighter than it was — right, or lower `OPEN_D`); then the shelf at
−10 (should be as it was); then `render` ms (two more texture reads and a six-mix gradient in every fogged fragment). The dome is still
black and could be any colour now. Not done: the *cells'* fine terrain has no apron (it ends where the region takes over — 25 m past the
clamp the far mesh is what you see, at 18 m resolution against 4.5 m; the join is the existing far/near join, at the world's edge).

## v11.28 — the lower flank, and no black water (10 Sep 2026), built, unseen
v11.27 was seen: "I think you actually did it" — the band toward the open water is gone. Then, at 215 m and 288 m looking out: the
floor "just drops off a cliff into a bunch of rock", "an artificial border to wrap the world up in rocky bubble wrap"; the dark still has
"some sway" — "a fog of cloudy blackness is not how that works in real life"; and the ask: the elevation past the island as accurate to
real oceans as a guide, so the game always has ocean ahead and a player who swims out of the box meets open ocean, not a wall.
- **The lower flank** (world.js `sample()`, `FLANK_*`; PLANET "The lower flank and the plate"; DESIGN World shape). The void — 520 m down
  in 90–250 m at r ≈ 1600, a 64–80° wall that `fixF` made rock — is gone. Past the apron's toe (`FLANK_R` 1560 ± 60 by sector) the slope
  ramps with no crease from the apron's 5.7° to 16.7° over 250 m (∫smoothstep in closed form), eases to 12.4° between 600 and 2600 m
  beyond the toe, ribbed ±15% by sector, and goes on down: −320 at the square's edge on an axis, ~−580 at a corner, ~−850 where the far
  apron ends 2 km out, the plate (~−3800) ~15 km out — the direction the world grows. The flank is mud (under 20°, `fixF` gives no rock).
  Checked on paper: heights by radius and angle, the slope along a radius continuous (0.2–0.4 with the hills' noise, no step).
- **No black water.** `WCOL` ends at 250 (the deep blue, (0.05,0.20,0.32)) and holds it below; the entries at 400 (0.03,0.08,0.16) and
  451 (0.006,0.01,0.03) — "dark on purpose over the deep and the void" — are gone. The deep's darkness is the daylight term alone
  (`dl`): at −400 the veil is (0.025,0.10,0.16) on paper, 2.5× brighter in green than it was, a dim blue rather than a black. Below the
  chemocline the brown tint and the plate stand as they were.
- **The ecology followed the geology.** The dark inside the square (ground < −450) is the pit and the corners' last 200 m now; the
  picker's deep entry lost the void and the stone and the basker starved of it (`test/census.js`: stone 8.6→1.3, basker 2.5→0.3). The
  picker's deep entry is `h [−800, −300]` — the lower flank's mud down into the dark. The census passes; the equilibrium moved: stone 26→17
  (was 11→6), ortho 17→9 (was 9→4), ridge 12→5 (was 9→4), pall's capacity 10→2, abyssal 3→2. More hunters in the world than v11.26's
  pyramid meant to have — the open question from v11.26 (are the big predators too rare?) may now read the other way; the knob is
  the grazers'/picker's `n` or `stock`.
- `test/snow.js`: the three chemocline sites moved from the void to the pit (floor −554 there); the "anoxic deep sparser than the plate"
  invariant reads the column's weight now, not the cloud's share (over the pit the site is 34 m off the bed and the nepheloid layer
  is in the box).
Unseen. Ask first for the edge again from 215 m (the floor going on down into the fog, mud, no wall), then the deep at −300 to −400 by
day (a dim blue now, not black — too bright? the number is `dl`'s floor 0.28 in the fog block and updateAtmosphere), then the pit from
its rim, then the readout's fourth line for stone/ortho/ridge counts. The far apron at 2 km sits at −850; the chemocline plate at −450
is now crossed on the flank 800 m past the square's axis edge — beyond the clamp — and at the corners inside it.

## v11.29 — dithering (10 Sep 2026), built, unseen
v11.28 seen: "that looked awesome". Then, watching the floor in the deep: "rings of brightness that come up in solid lines", the eye
fixating on them. That is banding: the veil in the deep is a smooth gradient of dark blues spanning a handful of 8-bit levels, and the
fog is radial, so the quantisation contours are rings round the view; a red-light screen filter compresses the blue channel (the deep's
whole signal) and multiplies it. Not an art-style choice, not a bug in the geometry. The cure is the one every game uses: ±half a level
of per-pixel noise before quantisation. r128 has it as `material.dithering`; scene.js now rewrites `dithering_pars_fragment` /
`dithering_fragment` without their `#ifdef` (`DITHER_PARS`, the hash written out so it needs nothing from common.glsl), so every
built-in material dithers — terrain, flora, creatures, the dome, the surface — and the sky shader calls the same function on its
output. Cost: one hash per fragment. Unseen. Ask whether the rings are gone in the deep at −300 by day (and with the red filter on),
and whether the noise shows anywhere bright (it should not: half a level).

## v11.30 — the world's shadows (10 Sep 2026), built, unseen
The person asked for shadows from everything that had none — vines, rocks, coral, the structures — with the best emphasis on performance, off by
default, on the effects list. Built (DESIGN The light, "The world's shadows"): a second shadow map for what does not move (`sunS`, scene.js
`updateShadowS`), rendered by hand only when the sun has turned ~0.3°, the camera has drifted 20 m, a cell in the box loaded, or a switch flipped
— between refreshes it costs the fragment its second set of taps and nothing else, and the per-frame depth pass is still the creatures alone. The
box is 80 m either side of the camera itself (turning moves nothing). Casters: every cell's instanced flora and rock, the structures through
per-cell proxies on layer 1 (chunks.js `placeBigSolids`; the far layer's region meshes are never drawn into it), the landmarks, and — its own
switch, "ground shadows" — the terrain. The flora is drawn at rest (`depthFor`: the species' own vertex code under `DEPTH_PASS`, the variant
collapse and the lean kept, the sway, the pushes, the wave and the breathing dropped). Two rows on the effects list, `world shadows` and `ground
shadows`, both off; `sharp shadows` doubles this map too. The depth programs compile at boot behind the fade (main.js `warmShaders`). The readout
shows `wshadow <ms>/<n>` (the pass's submit time and how many refreshes) while the map is on. Every generated depth program and the two-map light
block were compiled on Mesa in the sandbox (GLSL ES 3.00); the stub grew `layers`, `Camera`, `MeshDepthMaterial` and `shadowMap.render`.

**Unseen, all of it.** Ask first whether the world still draws with both switches off (the light block changed in every tinted fragment), then
turn on `world shadows` at noon on the shelf: does the weed forest cast onto the sand, and is the pass's spike felt (the readout's `wshadow`,
and `ms` on the frames it runs — a hitch every couple of seconds in the forest would mean the cell set is too big: `SHS_R`, or skip the ground
cover by species). Then a rock's shadow, a reef structure's, the tidal forest's on the strand, a raft's on the floor. Then `ground shadows`: a
cliff's shadow at a low sun, the pit's rim, the scarp — and whether the terrain acnes anywhere (the receiver offset is two texels; `SHM_BIAS`).
Then a plant a creature pushes: its shadow stays where the plant was (by design); does it read? The sway: the shadow is still while the
plant sways — acceptable? If not, the sway could go back in with the refresh made per-frame for the nearest cell only. Then the
refresh on turning the sun: does a shadow's edge step every ~2 s (two texels; if it reads as a crawl, `SHS_ANG` down and the cost up). Then a
breach: the map re-renders on the crossing (the light flips) — a hitch? Then `render` and `wshadow` ms in the forest at (330, 0) with the switch
on and off. Not built: the world drawn into the creatures' per-frame map (a fish under a ledge is still lit); the GLOW clouds and far cards cast
nothing; the low tier's numbers are guesses (`SHS_R` 50).

## v11.30.1 — the world's shadows, seen once (10 Sep 2026), built, unseen
v11.30 seen: `world shadows` on gave a black screen and `Cannot read properties of null (reading 'state')` every frame. The cause was on
paper: the pass called `renderer.shadowMap.render` outside `renderer.render`, and r128's `setProgram` reads the render state that only
`render` sets up; the throw came after the pass had bound the shadow map as the render target, so the frame drew into it. Now the pass is a
`renderer.render` of the scene through `camS` (an orthographic camera on layer 1 aimed at an empty box 500 km up) into a 4×4 target: it draws
nothing and casts everything on layer 1 into `sunS`'s map — `sunS` is in the scene on layer 1 with intensity 0, invisible to the main camera;
the hemisphere and the point-light pool are on layer 1 too so the light-state hash is the same in both renders and no material rebinds its
program. Every static caster has `shBounds` (its cell's sphere) and `frustumCulled` true, with `Frustum.intersectsObject` patched to read it —
which also gives the depth pass a proper cull by the light's box (v11.30 submitted every cell the box overlapped). DESIGN The light, "The
world's shadows" rewritten for this. The unseen list is v11.30's, from the top.

## v11.31 — combat as the physics: the hold (11 Sep 2026), built, unseen
The person: the ecology's mechanics were surface-level — the enemies bump into each other with loose hitboxes and take damage, despite
good physics with clear boundaries; the physical nature of an animal should be how it attacks; grab first (real predators take hold and
bite until it dies or bleeds open), the player grabbing with a button and biting as a separate action, blood, a realistic outcome with
losing allowed; reflect, then build what is realistic for this world; touch how combat happens, not the AI. DESIGN has a new section,
Combat. What is real: predators swallow whole or take hold and dismember; bite-and-release is a mass-ratio exception (white sharks on
seals). Built, `src/combat.js`: **a fight is a hold** — a rope between the holder's grip (derived from the spec's parts by `compile`:
jaws at the mouth ring, arms at the beak, claws at the weapon or the plate mouth) and a point on the held body's own hit capsule, solved
after the bodies have pushed apart, mass-weighted, shortening until the bodies touch; the held one's own steering is the struggle and a
grip has a strength by the holder's mass; bites on the hold's clock, a share now and a share that bleeds out; a jaw lets go of prey
near its own weight after a bite; the hold ends when the holder's AI drops its target (the ink, the stun, boredom, a lost chase) or
either dies. Forage still dies at the touch. The player: right mouse or r held is the grab (a fleeing grazer drags you, a ridge holds
you where it is), click bites — a gulp of small forage, a mouthful of a carcass (new: you eat what you kill), or a tear on what you
hold; a bite on what holds you loosens it; a hunter's hp is no longer reset when it flees, so it can be killed. Blood: one pooled point
cloud in the clade's colour (copper, iron, vanadium), drifting with the water and the bodies, on the effects list (`blood`). Three
one-line AI touches: the chase clock stops while holding; the lurker and the trap keep their target while they hold it (the lurker
drags its prey home). `test/combat.js` runs in `--test` (a table of what each hunter's hold means for a thrashing finback: eel 4 s / 24
hp, crusher 7 s / 93, lurker 2.6 s / 6; ridge, sickle, basker, stone, ortho, abyssal hold for good at 9–23 hp a second — the ability or
~9 s). Found on the way: the player's grab, called mid-`updatePlayer`, clobbered the move vector through the shared temps (the player
drove itself into whatever it looked at) — it runs last now; the smoke test's lab step left `r` held (its key helper never sends keyup).

**Unseen, all of it.** Ask first for a lurker's grab from its rock: are you held, do the arms wrap, does the rope read as a hold or as
a rubber band (`HOLD_DRAG`, `close`); can you thrash out of it (2.6 s on paper) and does the break feel earned. Then a grazer: r on it —
does the finback's mouth close on it, does it drag you, does the tear (click) read, does it bleed; then a ridge or an eel on you: the
clamp, the jerk of each bite, the hp rate (too fast? `GRIP.bite`), the ink or the stun letting you out. Then the blood: does the cloud
read as blood in the water at −20 by day and in the torch at night, is the trickle too much, the colours by clade. Then the number
that matters: does a ridge hold you forever (yes on paper) and is that right, or should a struggle at the jaw wear even a big grip
(`GRIP.k` down, or a `pull` floor). Then eating a carcass by biting it (heals 3–5 a bite). Then whether the trap re-striking what it
holds looks right, whether the great's ram still reads (it snaps as before), and the readout's `phys` ms with a hold on (the rope is a
few dozen flops). Not built: venom or paralysis, wounds slowing a creature, a hunter returning to bled prey (behaviour, next pass).

## v11.31.1 — the combat group of the code review: reach against contact (13 Sep 2026)
`analysis_review.md` items 2–6, one patch, each re-verified against the code first. All five stood; nothing in the group had been
fixed since the 12 Sep read.

**2. Most predators could not bite what was directly ahead.** `reach` in DEFS is centre-to-centre and the comment there has always
said it must exceed the two bodies' contact distance. Measured off the same `hit` capsules physics.js uses (`bodyExt` in
creatures_ai.js: `hitN`, how far the shape reaches forward of the origin; `hitB`, how far it reaches in any direction), **45 of the
58 predator/prey pairs were short** — worse than the review's nose-only table said, because a prey's own body counts too: basker
4.6 against 8.09 to the player, abyssal 10 against 14.06, crusher 4.2 against 7.61, ram 5.5 against 8.16, arrow 0.9 against 1.34 of a
darter. Since `resolveBodies` holds the capsules apart, those hunters could not land a nose-on bite at all: headless, a basker
running down a grazer had to blow past it and take it alongside its mid-body, the first bite at a centre gap of 4.4 rather than the
8.6 where its jaws are, and the kill took 10.2 s against 8.4 now. Off screen, where nothing pushes bodies apart, the same bite landed
at once — the two halves of the world disagreed. The DEFS numbers are left alone (they are the animal's own reach); the bite test now
asks `reachOf(c,tg) = max(reach, hitN + hitB + BITE_M)` with the new knob **`BITE_M` 0.3 m**, and every site that measured against
`reach` uses it: the chase bite, the strike's bite and its trigger range (`S.range`), the trap's strike, the lurker's lunge, the
coil's ram, the drifters' sting, feeding at a carcass (a hunter could not reach the carcass it had made either), and the player's
own grab and bite target (`playerTarget`, which had the same bug against a big body pressed on you). The arms' reach is
**`armReach`** (`max(reach·k, reachOf) + prey·0.5`), never narrower than it was. The extents are measured once per body and cached on
the creature, not the kind, because a juvenile is compiled smaller.

**3. Hunter regen cancelled bleeding.** 2 hp/s from the frame a wound landed, so nothing a hunter took ever bled out. Now
**`HUNT_REGEN`** 2 hp/s waits **`HUNT_REGEN_W`** 8 s past the last wound and stops while the body still bleeds (`c.lastHurt`, stamped
by `wound` and by every tick of the bleed — the player's own 8 s gate is the pattern). A 20 hp wound on an eel now costs it 55 → 37 hp
and is back at 55 about forty seconds later; before, it healed straight through.

**4. A hold with dt 0 went NaN for good.** `main.js` clamps dt to `[0,0.05]`, not above 0, and the struggle divides by it. One NaN in
`h.load` was a NaN rope that never cleared. `updateHolds` now returns on `dt <= 1e-4`, the guard `simChain` already had.

**5. `c.grab` leaked after the player died, inked or stunned.** Five places ended a pursuit and each cleared a different subset;
none but the lost-chase branch cleared `c.grab`, so a rigged hunter's arms went on reaching for the player out of wander. One routine
now: **`dropTarget(c, cool)`** clears target, `grab`, the hold, `bored`, the tell and strike clocks, the face and the chase clock, and
returns the animal to wander (an ambusher to `return`; a feeder and a sitter are left in their state). Used by the ink, the finback's
pulse, the player's death, the lost chase and `combatBite`'s kill.

**6. Stale hit capsules for prey past 90 m.** `startHold` read `shapesW`, which `updateCreatures` refreshes only within 90 m of the
player, so a hold taken further off anchored its rope where that body last was — tens of metres off the animal, a rope that never
shortened. `freshShapes` rebuilds both bodies' capsules when they are not this frame's (`c.shapeF`, stamped where `worldShapes` is
called).

`node build.js --test` green on both tiers. `test/combat.js` gained four sections: the **reach table** (every predator's `reach`
against `hitN + hitB` for each prey, and the count of short pairs), which fails if any pair's bite distance falls under their contact;
a basker running a grazer down (kills it in 8.4 s, first bite nose-on at 8.6 m); an eel's wound costing it its hp and healing later;
two frames of no time leaving a hold finite; and the ink dropping target, arms and hold at once. The hunters' hold table moved a
little — the lurker now holds 4–6 s for 28–50 hp instead of 2.6 s for 6, its lunge no longer falling short.

**Seen** (dev.html, 1280×720, the app's browser): the world boots and plays with no console errors, 120 fps / 8.3 ms, draws ~390,
tris 3.7M, phys 1.1–1.2 ms, render 3.9–4.1 ms, heap 227–264M — unchanged from before the pass. The ecology readout is the visible
difference: over two minutes of play `kills` went 13 → 28 with `carcasses` 9 → 12, and the nearest-hunter line cycled between
`hunger 1.00` and `hunger 0.03` — hunters catching and eating. The 12 Sep screenshots had hunters pinned at `hunger 1.00 wandering`
and that was item 13's complaint; item 2 was half of it.

**Unseen, ask in this order.** A hunt at close range: a basker or a ridge on a grazer — does the bite land where the jaws are, or
does it now read as biting from too far out (`BITE_M`, and `reachOf`'s use of the prey's `hitB`, its widest radius, rather than the
nearest surface — that is conservative by up to a body radius on a long prey seen side-on). Then the same on you: being run down and
bitten nose-on rather than shoved past. Then the small end: an arrow or a needle taking a darter — forage dies at the touch, and the
touch is now 1.6 m instead of 0.9, so does a darter pop out of existence too far from the arrow's mouth. Then the crusher's tell: its
strike now begins at `reachOf × 1.7` ≈ 11.8 m instead of 7.1 — does it cock too early. Then a lurker's lunge from its rock (it holds
twice as long now) and whether that reads as earned. Then the player's own grab (`r`) on something big pressed against you — it
should now take hold where it could not before. Then the ink or the pulse with a hunter's arms already on you: do the arms let go
cleanly. Then whether a hunter you fight off and drive away now dies of its wounds somewhere off screen (`HUNT_REGEN_W`), and whether
that is right or too harsh. Not touched in this group: items 7–11 and the readout findings 12–15.

## v11.31.2 — the ecology group of the code review: the clutch that was never laid, and hunters that never went looking (13 Sep 2026)

`analysis_review.md` items 12 and 13, both from the person's 12 Sep readout screenshots. Item 2 (reach against nose-on contact) was
asked for again with this group; it was already done in v11.31.1 and the reach table it asks for is section 7 of `test/combat.js` — it
still prints, all 58 predator/prey pairs bite at or past the distance their bodies force, and nothing here changed it.

**12. No clutch was ever laid.** `laid 0 hatched 0 eggs 0` in every one of the ten shots. It was not a broken branch: `ecoTick`'s
reconcile ran every time, and the arithmetic under it could never reach a whole animal. A loaded cell's growth went into `POP.n`, which
is *also* where the cell's living are counted — `ecoTake` writes the spawned integer into it, `ecoDebit` takes one out per kill,
`ecoWriteBack` sets it to the living on every unload. The surplus over the living was therefore erased every time the player swam a cell
away and back, and even undisturbed it grows at `r(1-n/K)-m` — measured headless, the fastest entry in the world (a cell of 26 flickers)
owes **0.55 of a recruit a game day**, so no row ever crossed 1.

The births a loaded cell is owed now have their own array, **`POP.ow[entry][cell]`** (ecology.js): the model banks a loaded cell's `b-d`
there instead of in `n`, the logistic reads `n+ow` so it still saturates at capacity, and the reconcile lays `floor(gap + ow*Q.creatures)`
as the clutch, moving what it spent from `ow` into `n`. `ow` is untouched by `ecoDebit` and `ecoWriteBack`, so it survives an unload. The
natural death `m` still comes off it — nothing dies of age in a loaded cell, and charging the births for the deaths the live world does
not run is what keeps a loaded cell's equilibrium the same as an unloaded one's.

That alone left the first clutch at game day 2.1 (85 real minutes), because every cell in the world started owing exactly zero. It now
starts at a **random phase** — `ecoCap` seeds `ow = rng()*min(1,K)/Q.creatures` the first time a cell's capacity is known — which is not a
rate change but the removal of an artefact: a population is not everywhere at the same point in its cycle. Over `Q.creatures` so the low
tier waits the same wall time for a clutch it shows. Headless, with 25 cells loaded: first clutch at game day 0.67 and 20 laid / 19
hatched by day 4 on high, 2.0 and 5 / 5 on low. In play that is a clutch somewhere near you every five to fifteen real minutes, more as
the owed builds. The readout's fourth line gained **`owed`**, the loaded cells' total: it climbs between clutches and drops when one is
laid.

**13. Hunters at hunger 1.00 wandering, not hunting.** Half-answered by v11.31.1 (the bite lands now). The other half, measured: the
nearest animal a hunter eats sits **35-50 m away** on the shelf, against a `detect` of 9-17 m. Nothing was wrong with `findPrey`; a hunter
simply had no way to go looking. It wandered a random point inside its home and met prey by accident, and a tenth of the hunter role sat
at hunger 1.00 with a school two cells over.

A hungry hunter now **casts**: the 0.4 s scan it already runs goes out to **`HUNT_SEEK`** 4 x detect (the same one `findPrey` call — a
wider radius costs nothing), and what it finds inside `detect` it chases as before, while what it finds further off becomes its wander
target. The cast swims at **`HUNT_CAST`** 0.8 of the animal's speed and not at its cruise (`cruiseF`, 0.45-0.5): the first build of this
used the cruise, and a stern chase at the cruise never closed on a school drifting at its own — one needle held 44 m for ninety seconds.
It casts only at prey within **`HUNT_HOME`** 1.5 x its `home` of its own home, so a hunter stays its patch's resident, the shelf's
predators do not all drain toward whatever school the player is in, and the chase that follows starts inside the leash that drops one
(1.9 x home — a cast that ended outside it was dropped in the frame it began). The eyes stay the ring's (PLANET: 360 degrees, motion);
past them this is the water itself, scent and the pressure a shoal makes.

A/B over 60 s of shelf play, same seed, same start: kills **18 -> 27**, the hunter role's mean hunger **0.471 -> 0.433**, the share of it
sitting at hunger 1.00 **13% -> 8%**, the share chasing doubled. What is left at 1.00 is mostly the ambushers (the hook and the lurker,
which by design sit and wait) and animals whose patch has no prey in it at all — the one ortho in the world has its nearest meal 202 m
away, which is a `SPAWN` envelope question, not a behaviour one. `starved` is still 0 because starving takes 1.2 cycles at hunger 1.00
(22 real minutes for a needle) and nothing in a headless run gets there.

**A crash found on the way.** `updateHolds` walks `holds` backwards, and a bite inside the loop can kill the held body, whose `kill` ->
`releaseAll` splices holds *below* the cursor; the walk then ran off the end of the shortened list. It took the low tier's smoke run down
once in about fifty. The index is re-clamped at the top of each turn.

**New test: `test/live.js`** — the ecology where the player is, the counterpart to `test/census.js`'s paper. It boots the whole game
against the stub, lets the cells round the peak load, drives the ecology clock four game days (`ecoTick` with the model drained each step,
`updateEggs` on the matching real seconds) and fails if nothing is laid or nothing hatches; then runs 60 s of real frames and prints a
table of every hunter kind — seen, mean hunger, the share at 1.00, the share hunting, the distance to the nearest animal it eats, and its
`detect` — failing if nothing is killed, nothing chases, or over a quarter of the hunter role is starving. It runs on both tiers in
`node build.js --test` (build.py in step). Knobs by name: `POP.ow`, `ECO` unchanged, `HUNT_SEEK` 4, `HUNT_CAST` 0.8, `HUNT_HOME` 1.5.

**Seen** (dev.html in the app's browser, 800x450, the clutches forced by hand — waiting out the real rate is 5-15 minutes a clutch):
`laid` and `eggs` climb on the readout and `owed` moves with them; three clutches side by side at their true scale — a flicker's 0.38 m
across, a needle's 0.54, a grazer's 1.10 — sitting on the sand as knots of pale translucent spheres. Live, with the hunters round the
player made hungry: 20 of 86 casting, chases and a carcass with a hunter feeding at it within a few seconds. No console errors.

**Unseen, ask in this order.** First the rate: play a real session and watch `laid` and `owed` on the readout — is a clutch every five to
fifteen minutes near you enough to notice, or should the world be laying more? (The rate is the model's, unchanged; only the phase moved.
Raising it means raising `ECO.r0`, which moves the whole census.) Then the clutch itself at 2-3 m: the small ones read as pale rocks on
the sand in the shot — do they need a colour or a shine that says egg. Then whether a clutch is ever laid somewhere absurd (it goes near
an adult of its kind, on the floor, clear of solids, and refuses ground above -4 m). Then hatching: do the juveniles appear where the
clutch was and read as small. Then the cast, in play: does a needle or an arrow now visibly leave off wandering and *go somewhere* when
hungry, or does it read as drifting; and does the shelf feel emptier of predators near you (the `HUNT_HOME` leash is meant to prevent
that). Then whether the extra hunting has thinned the flicker and darter schools over a long session — `flicker` and `darter` on the
readout's fourth line are the numbers. Then, on the 4060, whether any of this shows in the frame time (it should not: no new per-frame
work, one wider radius on a scan that already ran). Not touched: items 7-11, 14 (the shadow-caster performance pass) and 15.

## v11.31.3 — the placement group of the code review: what a cell reads over its own line (13 Sep 2026)

Items 7 and 9 of `analysis_review.md`. Both stood as *bugs*; item 9's cost claim did not, and the measurement is below. Nothing
here changes a rule — only what the existing rules read.

**Item 7a: a cell laid different ledges depending on where the player came from.** `placeCliffs` sized each ledge by the drop over
±3 grid steps (13 m) and read it with `groundAt`, which resolves to a *loaded* cell's grid if there is one and to `sample()` if there
is not. Thirteen metres out of a candidate near a cell line lands in the neighbour, so the same cell answered differently on a visit
from the north than on a visit from the west. The check: load a cell alone, then unload everything, load its four neighbours and load
it again, and compare the instance matrices — 14 of the 41 cells that have ledges disagreed. It never flipped an accept/reject in 64
cells (the count and the creature stream matched every time), so what moved was each ledge's scale and its nudge along the gradient,
but a flip is one rounding away and would move the cell's whole rng stream, spawns included.

**Item 7b: a plateau in a 14 m band on every cell line.** `ch.h` clamps to the cell's grid, so a probe past the edge reads the edge
vertex again. Every `settleOn` test that reaches outward — `face`, `drop`, `fit` — therefore saw flat ground in a band as wide as its
radius along every cell line. Per-cell flora has exactly one such entry, `talus` (`face` [14, 6]: place only where the ground within
14 m rises 6 above), and the error is one-sided: the face above the point never registered, so the boulders were refused. 2.2% of the
tries in the band, 294 lost against 3 gained.

**The fix for both: `hOut(ch,x,z)`** (chunks.js) — the cell's own grid inside it, `sample()` beyond its edge. The same rule
`buildTerrain`'s `hAt1` already uses for the cavity term, and the rule the far layer has always used (`bigH` is `sample`). It is
`placeFloraType`'s `hAt` now and `placeCliffs`'s drop; inside a cell it is `ch.h` exactly, so nothing away from a line moved.
Talus over 100 cells 8779 → 9013, and the band's share of them 23.1% → 24.9% against the 24.4% of a cell's area it covers — the band
now carries its area's worth. Ledges: same 829 over 100 cells, mean scale 11.65 → 11.59, mean |y − ground| 2.24 → 2.23 m. Load-order
disagreement 14 cells → 0.

**Item 9: `bigsGen`'s yield had never once fired — and it did not matter.** The counter was per entry against 50, and the fattest
`big` entry is `crag` at 20 tries a cell (65 over all of them), so a cell's whole structure pass was always a single step. The review
expected that step to be well over `Q.farMs`. It is not: measured over all 256 cells it is 0.27–0.54 ms, against farMs 3 (2 on low),
because `sample()` warm is 0.7 µs here, not the ~35 µs two comments in far.js were citing (that is the cold figure; DESIGN's "far
layer" section already had ~2 µs warm). So the guard was dead rather than late. `BIG_YIELD` 16 counted over the whole cell, the cairns
yielding too: five steps a cell, worst 0.15 ms. Both comments corrected.

**Seen** (dev.html in the app's browser, 800×450, finback, midday). Talus at the x = −215 cell line at (−216, −16, −204) and in
survey from (−229, −1, −175): boulders lie on the ground across the line, no stripe, no gap, nothing floating or doubled where a
lump sits in two hashes. Ledges on a face near (−297, −9, −125): wedges half buried in the wall, downhill lip up, as before.
`node build.js --test` green on both tiers; lint's unused list unchanged.

**Unseen, ask in this order.** The talus change is +2.7% of scattered 1–3 m boulders and no before/after screenshot would show it,
so the first question is whether the foot of a long face that crosses a cell line now reads *even* — walk one and look for a thinning
that is no longer there. Then the ledges: they all re-scaled slightly (mean 11.65 → 11.59) and the statistics say that is nothing, but
a cliff is the place to check that none is now floating or buried. Then, on the 4060: `bigsGen` yields five times a cell where it
yielded once, which is five budget checks instead of one — it should be invisible, but the far layer's build is the one place a
regression would show, as a hitch when a new region comes up behind the menu. Not touched: items 8, 10, 11, 14 (the shadow-caster
performance pass) and 15.

## v11.31.4 — the render, lab and tests group of the code review (13 Sep 2026)

Items 1, 8, 10 and 11 of `analysis_review.md`. All four stood. Item 8 was the shallow half of a deeper one: the species it names
could not be drawn at all, and nor could the other two land species — **no plant has ever stood on the island's land.**

**Item 1: the light shafts never took the sun's colour.** `atmosphere.js:296` ended with the comment "rays are a thing of the top
of the column" and the `shU.uCol` update was glued to the end of that comment, so it had never run: the shafts were the literal the
uniform was built with, `(0.55, 0.72, 0.8)`, at every hour. Now on its own line. Read off the running game: a high sun (clockH 7.5)
`lumC` (1, 0.94, 0.84) → shafts (0.55, 0.68, 0.67); a low one (clockH 10.8) `lumC` (1, 0.71, 0.47) → shafts (0.55, 0.51, 0.37);
under the moon `lumC` (0.72, 0.8, 0.96) → (0.40, 0.58, 0.77). The change is small by day and largest at dusk — where the shafts are
also at their faintest, since `uK` carries `SUN_W[3]·skyL` and both fall with the sun. Nothing else about them moved.

**Item 8, and the bug under it: land flora was never placed.** `stranded` (a dead sailer's float on the windward strand) was a
`species()` — three variants packed into one geometry, the shader picking one per instance — drawn with `MAT`, which has no variant
collapse, so all three would have drawn on top of each other. It has `MATVD` now: `varMaterial(true)`, the variant material without
the 2.5% breath (`PULSE_GLSL`), because a stranded float is a corpse. But nothing was drawn, because of the surface cap in
`placeFloraType` (chunks.js:130): `f.top && !f.air && f.top*sc > -1.4-h` — the rule that keeps a stalk from standing out of the
water. On land `h` is positive, so `-1.4-h` is negative, the test is true for any plant, `room` is negative and every try was
skipped. Three species carry `minH >= 0` — `tussock` (per 1500), `scrub` (110) and `stranded` (26) — and not one instance of any of
them had ever been placed anywhere in the world. The rule now exempts a plant rooted above the tide line (`!(f.minH>=0)`), which is
what `air:true` already does for the tidal forest. Counted over the cells loaded at the north strand: tussock 0 → 797, scrub 0 → 70,
stranded 0 → 9. Nothing else in `FLORA` sets `minH` at or above 0, so nothing else moved.

**Item 10: the smoke test's mouse never reached input.js.** `test/stub.js`'s `__run` and `test/smoke.js` both took
`handlers[...][0]`, the *first* listener registered on an event; zoo.js and lab.js register on the canvas and the window before
input.js does (src/order.txt), so fifteen hundred frames of clicking drove the bestiary's drag handler and nothing else. The bite
and the look had never run headlessly, and the file's first comment said they had. Both dispatch to every listener now, as a browser
does. The stub's `requestPointerLock` works instead of throwing (`global.__nolock` puts the refusal back), so the test plays the way
the game is played: play starts locked, a move is the look, a click is the bite. A new block in smoke.js asserts, for all three
clades: the pointer is locked when play starts, a locked mousemove turns the head, a click bites (`player.biteCD`), the right button
takes and releases the grab, Tab releases the pointer, and then with the lock refused a drag looks and a short click bites — and a
click takes the pointer back. `__run` also holds the right button down for a second every 313 frames.

**Item 11: the lab.** Three separate things.
- **NaN into the spec mid-edit**: `labOnInput` guarded only `stats.*`, so a number field holding `-` or `1e` wrote NaN into the
  build, and a NaN in a build reaches the uniforms. Every number now: `if (typeof v === 'number' && isNaN(v)) return;`.
- **The lab ate a forced tier.** `location.hash = specToHash(...)` replaced the whole hash, and scene.js read the tier as the whole
  hash (`h==='low'`), so `#low` and the lab were exclusive and a reload or a shared link came back on high. The hash is a list of
  flags now, any order, separated by `&` or `,` (scene.js `HASH_FLAGS`, `HASH_TIER`): `#low&lab=<spec>` works, and the lab writes
  the tier back (`labHash`). zoo.js and lab.js read the flags instead of searching the whole string — a spec's base64 can contain
  the letters `zoo`.
- **`LAB_NAME` had nine duplicate keys**, so the later label won and some sliders were captioned for another part: a mouth's `fn`
  (its feeler count) read "nod rate", a shell's `cy`/`cz` read "collar y/z", an arms `y0` "height", a tail's `ll` "paddle length",
  a mouth's `pulse` "pulse". `z0` and `col` were duplicated with the same text. One entry each in `LAB_NAME` now, with the
  part-specific meanings in `LAB_NAME_BY` (`arms.y0`, `shell.cy`, `shell.cz`, `mouth.fn`, `mouth.pulse`, `legs.ll`, `tailplate.w0`,
  `chain.w0`) — the table that exists for exactly this.

**Seen** (dev.html in the app's browser, 800×450, finback, the camera placed by hand). A stranded float on the north strand at
(14, 1.1, 242), close up: one body — a grey-lilac deflated hull, five dark-pink sail vanes along its back, tendrils spread on the
sand — not three superimposed, and it lies flat on the ground. Two more visible down the same beach, different tints. Tussock now
reads as tufts on the slope above the strand and scrub above that. The shafts render at midday from 16 m down with the surface and
its caustics above them; the colours above are read off the same session. `node build.js --test` green on both tiers; lint's unused
list unchanged.

**Unseen, ask in this order.** The land is the big one: three species that have never been on the island are on it now, and the
density is whatever the entries said when nobody could see them — walk the island above the tide line and say whether the tussock is
too thick or too thin, whether the scrub reads as scrub, and whether the strand carries the right number of dead floats (`per` 1500,
110 and 26 in flora.js). Then the cost of that on the 4060: a land cell now carries up to ~800 more instances, which is a draw call
and some fill, and the readout on a beach is the place to see it. Then the shafts at dusk, which is where the new colour is largest
and the shafts themselves are faintest — if they are too dim to read warm, `SH_A` is the knob. Not touched: items 12–15 (14, the
shadow-caster pass, is the next performance job) and the drift list.

## v11.32 — one number, one place: the daylight curve, the canopy fade, the two masses, the chemocline (13 Sep 2026)
The drift half of the code review (`analysis_review.md`, "Drift and cost"): four numbers that were written out between two and
twenty-three times each, three of which had already drifted, and one that reads as drift and is not. Nothing here is meant to
change the look; one of them does, slightly, and it is named below.

- **The daylight curve** — how much of the surface's light is left at a depth, which the fog's veil, the ambient, the sun's own
  scale (`SUNK_V`/`SUNK_F`) and the shadows all read — was six copies of `0.28..1 over 420 m`, and the two in JS measured depth
  from the tide while the four in GLSL measured it from sea level. `DL_REF`, `DL_MIN`, `daylightAt(y)` and `DL_GLSL(y)` in
  world.js and scene.js are the one definition now, generated from the same constants, and the shader follows the JS: depth is
  from the water's surface (the person, 12 Sep). Read off the running game, the JS and the old GLSL agree to four decimals at
  slack water, which is the size of the bug — the tide over 420 m is 1.1% of the light each way, and nothing below −302 where the
  curve clamps. **The shader needs the tide to do it**, and none of the four fog vectors had a spare component, so `uFogW.x` —
  which held `1/(2*HALF)`, a constant of the world's size — is `TIDE` now and the water map's scale is written into the three
  shader strings that sample it as `WM_SCALE` (0.000290698). main.js writes `FOG_W[0]` with the other clock uniforms.
- **The canopy fade** was a `smoothstep(-90,-60)` in the shader and a hard cut at `y>-70` in the JS, so under the mats the
  ambient light, the fog colour and the light shafts' heads disagreed with the veil actually drawn, and stepped at −70 instead of
  ramping. `CAN_LO`/`CAN_HI`/`canopyFade(y)`/`CAN_GLSL(y)`; the JS follows the shader (the person, 12 Sep). **This is the one
  visible change**: between −60 and −90 inside a canopy patch the water now fades in instead of switching, and at −70 the canopy's
  share is 0.74 of the map rather than all of it. The patches are three, 1400 m out, over deep water.
- **Two masses, and they are not one.** `size³` appeared six times, three floored at 0.6 and three not, which the review read as
  drift. It is not: the floored one is physical (contact, the body push, a hold's struggle — a flicker at 0.064 must not vanish
  against a ridge) and the unfloored one is biological (a birth rate as mass^−0.25, a meal, a carcass's flesh — flooring it would
  put a flicker's rate at half what `test/census.js` is drawn for). `bioMass(d)` and `bodyMass(d)` in creatures_defs.js, named so
  the next reader does not unify them; census unchanged to the digit.
- **The chemocline** was a bare −450 in fourteen places with −444/−446/−448/−452/−455/−458/−462/−464/−465/−470 around it. `CHEMO`
  in world.js, with `CHEMO_PLATE` (the milky plate's half-thickness) and `CHEMO_TINT` (the band the water browns over) derived,
  and the pall's spawn and wander bands written as `CHEMO-5`, `CHEMO-8`, `CHEMO-15`, `CHEMO-20`. Moving the chemocline is one edit.
- **The two slopes are left as two, deliberately** (chunks.js takes a central difference over its own grid, far.js a forward
  difference from two extra `sample()` calls): a central difference on the far layer would be four samples a point on its budget,
  and they agree to first order. Both sites say so now, and chunks.js's "so they match where they meet" is corrected to what is
  actually true — the conditions match, the slope they are measured with does not.

**Found and fixed while looking at it, and the reason to look.** `--test` was green on both tiers with the world broken: putting
the daylight curve into `SUNK_V` put `uFogW` into the **vertex** shader, where only `fog_pars_fragment` declared it, so every
Lambert program failed to compile — no flora, no creatures, a washed-out plain. The stub compiles no shaders, so no test could
catch it; the menu screenshot against a build of the previous commit did, in one frame. `fog_pars_vertex` declares `uFogW` now.
This is the trap CLAUDE.md names ("the fog is not three's") and it cost one build to find.

**Seen** (dev.html, 800×450): the menu at the peak, identical to a build of v11.31.4 beside it — grass, the three creatures, the
same water; the weed forest at (330, 0) at 15 m with the readout up, teal water, olive blades, pale floor, a finback; and, read out
of the running page, `FOG_W[0]` carrying the tide, `WM_SCALE` exact to 1/3440, and the daylight and canopy curves tabulated against
their old GLSL at six depths each.

**Unseen, ask in this order.** The canopy band at −60..−90 inside a patch (1400 m out, the current's wake) — swim down through it
and say whether the fade reads better than the step, which is the only thing here that should look different. Then the water's
colour across a full tide at 20–60 m, where the shader's daylight now moves by a percent either way and did not before. Then the
light shafts' heads under the mats, which take the same ramp now (`atmosphere.js` `shWM`). Left of the review: the dead code and the
stale docs (the other half of the drift list), and items 14 and 15 — the shadow-caster pass is the next performance job.

## v11.32.1 — the readout shows the work, not the wait (13 Sep 2026)
Every performance screenshot so far read `8.3 ms` and `120 fps`, and both are the vsync interval: `msEma` is `dt`, the wall clock
between frames, so on a machine with headroom it says the same thing however cheap the frame is. `frameMs` — the top of `loop()` to
the bottom — was computed for the streaming budget and never printed. The readout's first line now carries **`work <ema>/<max>ms`**
and, when it is above 0.05, **`gen <ema>ms`**: the frame's own cost, the worst single frame since the readout last drew a quarter
second ago, and the streaming's share of it. The max is the point — the shadow map re-renders only when the sun turns, the camera
drifts 20 m or a cell loads, and on those frames it lands all at once; an EMA hides that and a max does not.
All three are CPU: `renderer.render` is the submit, and the GPU runs behind it.
**Seen** (dev.html, this PC, not the person's 4060): `work 18.4/18.4ms  gen 7.0ms` in the weed forest at (330, 0) while cells were
still streaming, and `work 23.6/573.5ms` on the frame after a teleport, which is the cell burst showing up exactly as it should.
**Unseen:** the numbers on the 4060 — that is the first thing the shadow-caster pass wants (`analysis_review.md` item 14), and what
this change exists to make readable.

## v11.33 — the dead and the stale: the rest of the drift list (13 Sep 2026)
The second half of `analysis_review.md`'s drift section. Small fixes, five removals, and four inert paths kept on purpose with a
note at each so the next reader neither deletes them nor has to find out again why they are there.

**Real fixes.**
- **`chunkAt` off the grid, not through a string key.** It built `i+','+j` and hit a `Map` on every call, and it is *the* per-frame
  ground lookup: every live creature, every chain point outside its own cell, the player five times a frame, the audio rays, the
  snow. `chunkGrid` has existed for this since v11.12 and `solidPush` already used it. Range-checked, because `i=1, j=-1` would
  alias onto cell (0, 15) in a flat array. Verified in the running page: 4000 random points across ±2600 and the six just-outside-the-
  square cases, zero disagreements with the old path.
- **The ecology stopped throwing away time.** `ecoTick` clamped the elapsed game days to 0.5 and set `POP.last` to now, so a hidden
  tab or a long spell in the menu or the lab lost every day past the first half. The excess is carried on `POP.last` now
  (`ECO_MAX_STEP`), so the model runs it on the following ticks instead of dropping it.
- **The starvation tally** read `n` after the decrement and undercounted the readout's `starved` by a factor of `1 − s·dt`.
- **`landBite` guards its target.** `dropTarget` (v11.31.1) can null a target mid-strike and two of the four call sites did not
  re-check; the guard is in the function, once, rather than at each site.
- **Alt-tab no longer leaves you swimming.** `blur` cleared the mouse grab and not the held keys, so tabbing away on W came back
  still moving.
- **`serve.js` survives a malformed URL.** A stray `%` threw inside the request handler and took the server down; it is a 400 now.

**Removed** (all five were on lint's unused list, and that list is now empty): `fogExtinctOnly` (nothing has called it since the
bioluminescence went in v10.1; the rule it carried is still true and the light shafts re-implement it by hand), `moonIllum` (the lit
fraction comes from the two directions since v11), `trunkPose` (no spec ever used it), `cellW` (ecology.js `ecoCap` is the one the
ledger uses), `ecoCell`. Also **`MATR2`** — a whole sway program with no user, compiled at every boot by the warm-up.

**`ROSTER.new` cleared on the fifteen species that spawn** (rasp, watcher, pall, needle, basker, stone, crusher, trap, hook, tread,
picker, flicker, comb, deepbell, sailer). `new` means built and not yet placed, and the bestiary captions it "built, not yet
placed", so it had been lying about fifteen of the thirty-six for several versions. It stands on hood, lash, ram and greatsailer,
which is correct. The darter's niche no longer says "(unspawned)".

**Kept, with a note where it lives:** `GLOW` and the `f.glow` branches (for when bioluminescence returns as events — PLANET Hooks);
the whole `pads` path through grow.js, chunks.js and physics.js (an empty loop a frame, and a thing that takes a body's weight is
wanted again); `y:'mid'`; and `DEFS.glim`/`SPECS.glim`/`PAL.glim` — the darter's pale variant is a roster question for the person,
not drift. **Not done, deliberately:** the fog tuner's `o`/`p` collide with the lab's `place` and first person, but `g-h`, `j-k` and
`v-b` are the audio tuner's and the rest of the alphabet is the game's, so picking a new pair blind risked a worse collision.

**Stale lines fixed where they live:** lint.js said acorn was not vendored (it is, as `test/acorn.js`); `creatures_spec.js` cited
`test/spec.js` (it is `test/ident.js`); `chunks.js`'s `underCanopy` still called the canopy "mats", which it has not been since the
raft colonies went in v11.16 — it is buttons and sailers, discs in fleets rather than a ceiling. CLAUDE.md's known-stale list is
rewritten around what is actually left.

**Seen** (dev.html): the menu and the weed forest at (330, 0), unchanged; and the `chunkAt` equivalence run above, read out of the
running page. `node build.js --test` green on both tiers; lint reports no unused top-level names for the first time.
**Unseen:** whether anything reads differently at all — nothing here should. The ecology's carried time only shows over a long
session; the starvation tally only in the readout's `starved`. Left of the review: items 14 and 15 (the shadow-caster pass is next,
and the person's 4060 now reads `work 5.9/7.9ms` in the forest against an 8.3 ms budget, the 2 ms gap being the shadow re-render).

## v11.33.1 — a rainy night keeps three quarters, and the daylight tuner leaves `p` alone (13 Sep 2026)
Two things the person asked for after looking.

**Rain was halving the night.** The dark screenshots were not the night — the person: "night time brightness is perfectly fine…
it's actually the rain making it incredibly dark occasionally". Rain reached the night twice: `weatherAt` adds `0.5·rain` straight
into `cover` (world.js), and the night branch of `skyL` then took `0.7` of that off the moon (atmosphere.js `updateSky`). Fitting
the person's own three night readouts to that formula gives `moonL` 0.294 and `STARL` 0.024, so a full shower left **0.128 against
a clear night's 0.256 — half.** The day was fixed for the same complaint in v11.18 and keeps 52% of noon, and the ratios are in
fact almost identical; the point is that half of noon is grey and half of a night is unreadable. `coverN` is the cover rain did not
put there (`max(0.08, cover − 0.5·rain)`), with the rain's own share a gentle `0.15` on top, in both `skyL` and `skyLw`:

| sky | cover | rain | before | after |
|---|---|---|---|---|
| clear night | 0.30 | 0 | 0.256 | **0.256** |
| light shower | 0.57 | 0.25 | 0.201 | 0.215 |
| shower | 0.72 | 0.69 | 0.170 | 0.210 |
| full shower | 0.92 | 1.00 | 0.129 | **0.187** |

A rainy night keeps 0.73 of a clear one (the person: "it should come up to the day's three quarters"), and a clear night is
unchanged to the digit. The moon's *beam* is deliberately left alone (`moonP`, below it): no direct moonlight survives thick
cloud, and an overcast sky scatters rather than extinguishes — which is exactly what the term this touches is.

**The daylight tuner is `o`–`n`, not `o`–`p`.** `p` places the lab's creature, so with the readout open in the lab it did both at
once (`analysis_review.md`, left unfixed in v11.33 for want of a free pair). The person: "k and l or something like that… whatever
it is" — but `k` is the audio tuner's and `l` opens the lab, and in fact **every letter on the keyboard is taken except `n`**.
`KeyO` had no other use, so only the one key moved. The readout's hint line says `o-n`.

**Seen:** the numbers above, computed against the person's own readouts; `node build.js --test` green on both tiers.
**Unseen:** a real shower at night in the game — the change is arithmetic in one term and was verified against the readouts
rather than by waiting for weather. Ask whether a rainy night now reads as "dimmer" rather than "blind", and whether the light
shower (0.215) and the full one (0.187) are far enough apart to feel like different weather.

## v11.34 — the sound bench: what a sound is, as a picture (13 Sep 2026)

Nobody working on this game from here can hear it. Every number in audio.js was chosen blind (AUDIO.md says so at its head), and
the next thing the person wants is *more* sound — creature voices, combat, the punctuation. So before making any of it: an
instrument. This version adds nothing the player hears. It adds the ability to look at what they already hear.

**`src/bench.js` (new), `#bench` in the URL or `b` in play or on the menu.** Renders every sound the game makes to a wav and
posts it to serve.js, which writes it under `test/render/`. Three engines:

- **offline** — a one-shot through the real `thump()`, into an `OfflineAudioContext`, faster than real time. `actx`, `AU.dry`,
  `AU.send` and `AU.whiteBuf` are swapped out from under audio.js's own helpers and put back in a `finally`; one shared scope
  makes this three lines instead of a refactor.
- **solo** — one *live* chain (the ones `initAudio` built) recorded off `master` with every other gain at zero, the medium wide
  open and the reverb shut. Real time, six seconds, twenty-one chains, about two minutes.
- **live** — the master bus exactly as the person hears it, wherever the player is standing, space and all. The take names itself
  by depth and the condition fields, not by a place (PLANET: no place has a name).

**The rule the bench obeys: it never reimplements a sound.** A bench with its own copy of the recipes would measure the copy, and
the copy would go stale the first time a knob moved. `BN_SHOTS` is the one place a value is repeated — the arguments each
`thump()` call site passes — and each entry names its call site so a grep catches drift.

**`test/spectro.js` (new)** turns the wavs into `test/render/<name>.png`: the envelope over a log-frequency spectrogram from 20 Hz
to nyquist across a 78 dB range, the numbers under it, a table on stdout and `_sheet.png` with every panel stacked. The numbers
are peak, rms, crest, spectral centroid, 85% rolloff, the five band shares (sub/low/mid/hi/air), attack, decay to −40 dB,
steadiness, clipping and DC. **`test/png.js` (new)** is the PNG writer test/preview.js has had inline since v11.10, plus a 5×7
font, so the next tool that draws a picture does not write it a third time; preview.js keeps its own copy and is left alone.

**Two one-line changes elsewhere.** `updateAudio` bails on `AU.bench` — the 20 Hz tick would fight the bench for every gain.
serve.js takes `POST /_bench/<name>` and writes it to `test/render/` (the name is validated as a plain file name; 64 MB fuse).
test/lint.js learns `DataView`, `Blob`, `fetch` and `alert`.

**Seen: all forty sounds, rendered and looked at.** The bench and the pictures are what this version is, and both were run end to
end — 13 one-shots, 21 beds, 4 noise buffers, 2 impulse responses. What the first look found, none of it fixed here:

- **Eleven of the thirteen one-shots are the same sound.** Centroids 62–378 Hz, decay to −40 dB between 260 and 385 ms, crest
  17–20 dB. A knock on rock, a landing on sediment, a bite, a hold torn free and the finback's pulse are one low thud at five
  volumes. `shot_into_weed` (4.3 kHz, noise only) is the only one that is its own thing.
- **`thump`'s noise transient is nearly absent.** `shot_knock_rock` asks for a burst at 1.4 kHz and measures 28/72/0/0/0 — nothing
  at all above 500 Hz in the mean. It is there in the spectrogram, a sliver at t=0, but a Q-1.2 bandpass on white noise passes so
  little energy beside a 400 ms chirp that the "knock" has no knock in it.
- **The chirp ends on a visible edge.** `exponentialRampToValueAtTime(0.001)` then `stop()` 50 ms later leaves a step at −60 dB;
  it draws as a vertical streak at 0.4 s in every one-shot panel.
- **`bed_crackle` is the best thing in the game's sound** — a dense broadband tick field, crest 37 dB, the shape snapping shrimp
  actually make — and it is gated to near-inaudibility in play (`0.025 * nut`, rms −56 dB at the bench's fixed 0.5).
- `noise_white` clips in the render because `auNoise` makes it at ±1 and the bench renders buffers at unity; in the game it only
  ever passes through a gain. Expected, not a defect.

**Unseen, ask in this order:** (1) whether the forty wavs, played back, agree with what the pictures say — the whole point of the
bench is that the person's ear and these numbers should be describing the same object, and if they are not it is the bench that is
wrong; (2) whether `bed_crackle` should be let up in play; (3) the live capture (`4` in the panel) has been built but not taken —
it wants a real place and a real swim; (4) whether the one-shots get fixed before the creature voices are built or after, since
the voice synthesiser will want the same transient that `thump` is currently losing.

## v11.34.1 — the tail that wasn't there, and a shadow on the wrong side (13 Sep 2026)

Two things the person pointed at in four screenshots of the finback. Both are one-line fixes in shared code, and both were wrong
for every clade, not just the slowbloods.

**The tail stem was inside out.** `FIN_TPROF` is written nose-to-tip — `[0.02,0.03]` down to `[0.02,-1.35]` — where every other
lathe profile in the game climbs. `THREE.LatheGeometry` takes its winding and its normals from the point order, so a descending
profile builds the surface facing inward: under `MAT`'s front-side culling the finback's tail stem was simply not drawn, and the
flukes hung off the end of a body that stopped behind the dorsal fin. It has been like that since the tail became a spec part
(v11.10). `G.lathe` (parts.js) now reverses a profile whose last point is below its first before handing it to three — the
geometry is identical, only the normals come out — and the copy stays local, so `profR`, `nose` and `tail` still read the array
the caller wrote. Instrumenting the reversal and walking `test/smoke.js` over all three clades, the bestiary and the lab found
exactly one call site affected: the `tail` part with `style:'lathe'`. No flora profile and no core profile descends, so nothing
else moved. The tail is now countershaded the right way up too, which it could not have been before.

**A body printed its own dorsal silhouette on its belly.** The hand-read shadow (`SH_GLSL`, v11.23) multiplied the lit colour by
`1 − shd·(1−sh)·beam·dl` with no reference to which way the fragment faced. A shadow takes the beam away; a face the beam never
reached has nothing to lose, and the flat-shaded Lambert had already left it unlit. So the belly got darkened a second time, and
because the darkening came from a depth map it arrived with the shape of what was above it — the chevron plates, the fin roots,
the hull's edge — in hard-edged patches on an underside that should read as one even pale sheet. Added `nl =
clamp(dot(fn,uShL.xyz)·2.5, 0, 1)` to the final multiply. The ×2.5 means a face 24° into the light already takes the full shadow,
so nothing that was correctly shadowed has weakened: the ground under a creature, a cliff face, the dorsal fin's shadow on the
back are all unchanged. Only the grazing and away-facing fragments stop double-counting. This also removes the acne a
near-edge-on facet could show, which the normal offset was carrying alone.

**Seen.** `node test/preview.js fin` before and after: the tail stem goes from a dark inverted wedge to a tapered, countershaded
continuation of the body. The bestiary's finback, the clade pick and the game in the app's browser, at 1400×800: the tail is
attached; and with the camera pitched under the player, the finback's and the soft-arm's bellies go from grey hard-edged blotches
to an even pale underside in the same frame with the same sun. `node build.js --test` green on both tiers.

**Unseen, ask in this order:** (1) whether the tail's shape, now that it is actually drawn, is the shape the finback should have —
it has never been looked at, and `FIN_TPROF`'s taper was tuned blind; (2) whether the belly now reads too flat — `nl` is a linear
cut at the terminator and the person may want a softer one; (3) whether any *other* creature's self-shadow still looks wrong from
below (the ringmouths' arms and the coilshell's whorl were never checked); (4) the hand-written normal offset (`SHM_P.w`, 2 texels)
could probably come down now that `nl` carries the away-facing case, which would sharpen contact shadows — not touched here.



## v11.35 — the caustic derived: the sun focused by the wind's ripples (13 Sep 2026)

From the 13 Sep audit of the effects list, the person's own finding: caustics "make the game look ridiculously good but also somehow
detract from what makes everything else work". The diagnosis had three parts. v11.13's caustic was a *gain* — `× (1 + 1.3·k)`, never
below 1 — so the floor's mean light went up ~1.4× and the sand clipped to white; that clip was most of the "ridiculously good". Its
period was ~15 m, the terrain's own facet scale, so it competed with the facets rather than sitting on them as texture (and it is
the wrong size by 10× for what it claims to be). And it ran on its own clock, unrelated to the surface it was supposed to be. The
person agreed to energy conservation, a smaller and slower net, quantisation, and derivation, and said the old one need not survive.

**Derived, honestly.** The web on a floor is `1/|det J|`, `J = I − d·c·H`: the Jacobian of the map from a surface point to where its
refracted ray lands (`d` depth, `c` = 1 − 1/1.33, `H` the surface height's Hessian). Mean 1 by construction: light is moved, never
made. The first thing the derivation showed is that `WAVES` can't do it — the shortest swell (L 6, A 0.06) has a focal length of ~60 m
and never focuses in the top 30 — so the web must be the wind's ripples, 1–3 m, which the surface mesh cannot hold anyway (it fades
waves under seven samples a wavelength). `CAU_R` is that ripple layer, living only in the light: `Q.cau` trains round `WIND_A`
(3 high, 2 low), each at its own deep-water speed on `uTime`, amplitude × `uChop` — a calm goes glassy and the web dies, which is
true. The Hessian is analytic per train; the surface point read is the one the fragment's beam came through (up `uSunW` by `d`).
Damped by `exp(−d/CAU_D)` for the beam's spreading (contrast fades, mean stays 1). Clamped [`CAU_LO`, `CAU_HI`] and quantised in
steps of 1/`CAU_Q` — the facets' vocabulary, as the cloud deck's three-step light already was. Applied by the beam's share, the canopy,
whether the beam reaches the face (`nl`'s rule from v11.34.1) and a fade from the eye (`CAU_FAR`). `SEA_FOG.cau` is now a contrast,
1 physical (was a strength, 1.3); `LIGHT_K` reads it instead of carrying its own literal; the tuner's `t-y` still moves it. Seven
sines a fragment against the old six nested ones. The tinted materials take `uChop` (`LIGHT_PARS`, `addTint`). Knobs: `CAU_R`,
`CAU_D` 18, `CAU_Q` 4, `CAU_LO` 0.75, `CAU_HI` 2, `CAU_SWELL` 4, `CAU_FAR` 18–45, `Q.cau` 3/2 (scene.js); `SEA_FOG.cau` 1.0 (world.js).

**Seen, three rounds on the menu's sand in the app's browser at 800×450.** Round one (three trains, LO 0.5, steps of ½): the scale
was right at last, but three fixed sine trains interfere into a *lattice* — a regular grid of dark ovals — and on sand that white
the ×1.5 lines clip to nothing while the ×0.5 cells show, so the net read as its own negative. Round two: the ripples now ride the
swell — the surface point is carried by the horizontal orbital displacement of the longest `WAVES` (~2 rad of ripple phase from
the 46 m swell) — and the cells came down to one quiet step; the lattice loosened but a 46 m carry shifts a 10 m view almost
uniformly. Round three: the carry takes the four longest waves (the 15 and 8.5 m chop distort within a view), `CAU_Q` 4 with LO
0.75 (a quarter step down for the cells), and the far sand's speckle — a metre net aliased at 40 m, which the 15 m pattern never had —
fades by distance. The result: cells that vary in shape and wander, lines where the sand is not clipped, nothing far. No shader
errors on either tier; `node build.js --test` green on both. The person's real test — a darker floor, 5–15 m, in motion — was
not possible from here: the pane's capture breaks after pointer lock.

**Unseen, ask in this order:** (1) whether the net reads as a net on a darker floor (mud, rock, the deep sand) in play, and at what
depth it is best — the ripple amplitudes in `CAU_R` set the focal depth (~13 m for the 1.6 m train) and were chosen from physics,
not a look; (2) whether the quantised edges crawl objectionably as the trains move (the cloud deck's steps do the same and were
accepted); (3) the sand's albedo: it has no headroom above 1 with any caustic, and the old gain hid that by clipping everything —
the person may now find the sand itself too pale; (4) the low tier's two-train web on a phone; (5) whether the shafts' flicker and
the shimmer should now read the same ripple field, since the audit named four unrelated clocks for one surface and this fixes one.


## v11.35.1 — the net, not the lattice: capillary ripples, six trains, a clamp that isn't a clip (13 Sep 2026)

The person looked at v11.35 in play, over the home shelf's sand at a few metres, and sent a screenshot: a regular lattice of white
ovals across the whole floor, at the facets' own scale, clipping. "I think this might be a bug." Not in the code — the shader did
what it was told — but the parameters had reproduced the audit's own complaint. Three causes, all numbers.

**The ripples were ten times too long and steep.** `CAU_R` had 1.6–2.5 m trains at 2 cm: `jc·H` ≈ 0.3 per train at 5 m, so
`|det J|` sat under the clamp over broad regions — a plateau of level-2 ovals, not thin fold lines — and a metre of swell carry
barely warps a 2 m lattice. The webs a snorkeller sees come from capillary-gravity ripples of 0.3–1 m at millimetres: cells of
10–50 cm, folds thin, and for those the same carry is 10–20 rad of phase, which shreds any lattice for free. **Three trains are too
poor a spectrum.** Rebuilt with three short trains the lattice was gone, but whenever one train dominated its fold lines showed as
a band of straight stripes across the mid-distance sand — a plane wave's caustic is parallel lines. Six trains now, 0.35–2.2 m,
spread ±70° round the wind as wind ripples are (`Q.cau` 6 high, 3 low). **The clamp was a clip.** `CAU_HI` 2 on white sand has
nowhere to go; 1.5 now (two quarter-steps up, one down), and `SEA_FOG.cau` 0.8. And the fade from the eye is per train, in
wavelengths (`CAU_FAR` [30, 70]: a 0.35 m train is gone by 25 m, the 2.2 m one by 150) — one distance for all had the short train
speckling while the long one was still legible. Ten sines a fragment (four carry, six trains).

**Seen, three rounds on the menu's sand at 800×450, three frames each.** Short trains: lattice gone, a stripe band at moments.
Per-train fade: the band stayed (it was not aliasing — 0.35 m is ~27 px at 10 m there). Six trains: an irregular dapple of 20–40 cm
cells that wanders frame to frame, no lattice, no band, the cells one quiet step down and the lines pale. `node build.js --test`
green on both tiers; no shader errors either tier.

**Unseen, ask in this order:** (1) the same view the person sent — the shelf's sand at a few metres in play, moving; if it still
reads as too much, `SEA_FOG.cau` (the readout's `t-y`) is the knob and 0.5 is a reasonable floor before anything structural; (2)
a darker floor at 8–15 m, where the 0.7–1 m trains focus and the net should be at its most legible; (3) the low tier's three-train
web; (4) the rest of v11.35's list.


## v11.35.2 — the sun has a size, and the net has two tones (13 Sep 2026)

The person looked at v11.35.1 in play at 12 m over the shelf's sand: "still kinda looks weird". The screenshot was a uniform
halftone — every train contributing equally everywhere, and quarter-step quantisation on 30 cm cells reading as a dot screen, not
as facets. Two fixes, both with a reason.

**The sun's disc.** A half-degree sun, widened by forward scatter in the water, blurs the floor's pattern by `d·θ`; at 12 m that is
~14 cm, which erases a 35 cm train's contrast (×0.04) and leaves the metre trains (×0.7–0.9). Deep caustics are large and soft for
exactly this reason. Now per train: each Hessian term is scaled by `exp(−2(π·d·CAU_SUN/L)²)` (`CAU_SUN` 0.012 rad), replacing the
crude `exp(−d/CAU_D)` on the whole — the short trains own the shallows, the long ones the deep, and the mean stays 1 at every depth.

**Two tones.** `CAU_Q` 2: with `CAU_LO` 0.75 the only level that survives rounding is ×1.5, where the focus is 1.25 or more. Pale
lines on the floor and nothing else — Wind Waker's caustic, which is the low-poly reference for this — no dark cells, no dither. The
mean is now a little over 1 (the lines' share, ~1.1 at their densest) rather than exactly 1; `SEA_FOG.cau` 0.8 stands.

**Seen** on the menu's sand at 800×600, two frames: a two-tone net of pale lines, cells 30–60 cm, wandering; the sand between them
its own colour. `node build.js --test` green on both tiers.

**Unseen, ask in this order:** (1) the person's 12 m view: the metre trains alone should give a soft, sparse net there, cells ~1 m;
(2) whether the lines' coverage in the shallows is too dense — `CAU_LO` up (0.8: only focus ≥1.3 shows) thins them; (3) v11.35.1's list.


## v11.35.3 — softer, sparser, bigger: what the old one had right (13 Sep 2026)

The person put v11.35.2 at 14 m beside two shots of v11.13's caustic: "still kinda weird, a little too small maybe". Side by side
the lesson was plain. The old one looked right because it was soft, sparse and big; the clip was its only real crime. The new one
was right in scale for a snorkeller and on screen was a dense two-tone camo print: half the floor covered, hard edges, the same
density everywhere. Three knobs, each with its reason.

**Bigger at depth.** `CAU_SUN` 0.012 → 0.02: the blur at 14 m is 28 cm, which leaves only the 1.4–2.2 m trains — cells of about a
metre, not 40 cm — and by 25 m the net is quiet on its own, as the old one was in the kelp. **Thinner lines.** A line now needs a
focus of `CAU_T` 1.5 (was 1.25): coverage falls to roughly a fifth. **A soft step.** The hard two-tone was most of the "weird": the
cloud deck's hard steps work because its shapes are huge on screen; at 40 cm they are a print. `smoothstep(CAU_T − CAU_SOFT,
CAU_T + CAU_SOFT)` with `CAU_SOFT` 0.25 replaces the floor; 0 gets the hard edge back. `CAU_Q` and `CAU_LO` are gone.

**Seen** on the menu's sand at 800×450, two frames: sparse pale flecks between the blades, no print; white sand gives it little to
show against. `node build.js --test` green on both tiers. The 14 m view was tuned from the physics, not seen.

**Unseen, ask in this order:** (1) the person's 14 m view over the shelf — the metre trains alone, soft, about a fifth of the floor;
if it is too faint `CAU_T` 1.3 doubles the lines, if too sharp `CAU_SOFT` 0.4; (2) whether the shallows (2–5 m) still read as a
net at all now that the threshold is high — they should, the short trains are sharp there; (3) v11.35.2's list.


## v11.36 — the sea baked: thirty-two ripple trains in two tiles a ring, and the net comes out (13 Sep 2026)

The person put v11.35.3 at 16 m beside the old one: "certainly looks cuter … it looks good actually, it's just not accurate", and asked
whether the problem could be made easier. It could. Polka dots on a near-grid are the signature of two plane waves below their focal
depth — `|det J|` never reaches zero, so its minima are isolated curvature peaks — and a real net (connected fold lines round cells)
needs a broadband surface: the sea is a random field, not six sines. Thirty-two sines a fragment is silly; but the Hessian is linear
in the trains, and trains of one wavelength share one frequency (dispersion), so a ring of trains at that wavelength can be baked once.

**The bake (`scene.js` `CAU_RINGS` … `CAU_TEX`).** Four rings (2, 1.2, 0.75, 0.45 m; `Q.cau` 4 high, 2 low), `CAU_DIRS` 8 trains each on
the `CAU_TILE` 16 m lattice (k = 2π n / T, so the tile wraps; a ring is the lattice vectors within ±18% of its wavelength, one per
direction bin within ±`CAU_SPREAD` 1.2 rad of the wind), random phases and amplitudes (`mulberry(1717)`), amplitude by `cos` of the
angle off the wind. For each ring two 192² byte tiles: the sin and cos parts of (Hxx, Hxy, Hzz), since sin(k·x − ωt + φ) =
sin(k·x + φ)cos ωt − cos(k·x + φ)sin ωt. The fragment recovers the exact broadband field at any time from two taps and one sincos a
ring (`CAU_GLSL`), the sun-disc blur and the far fade now per ring — where they belong, by wavelength. ~2.4 M sines at boot, in the
scene's load. `CAU_R` and the per-fragment trains are gone; the swell carry, `det J`, the line step stay.

**Two numbers, found with a picture.** The first bake at millimetre amplitudes gave blobs at every depth: RMS `jc·H` ≈ 0.4 at 5 m,
so `det` never crossed zero and the bright set was the curvature peaks again. ×2.5 (RMS slope ~0.15, a breeze-ruffled sea) and the folds
appear — as fat worms over 36% of the floor, because a threshold of 1.5 on `1/|det|` is `|det| < 0.67`, a wide band round each fold.
A fold line is thin only where `|det|` is small: `CAU_T` 3, `CAU_SOFT` 0.8 — 18% at 5 m, 10% at 16. And an 8 m tile repeated visibly
inside a 16 m view; 16 m at 192 texels (8 cm; the 0.45 m ring at 5.4 texels a wavelength).

**`test/caustic.js` (new, not in `--test`).** The picture that found those numbers: runs the bake against the stub and draws
`1/|det J|` through the line step at a few depths into `test/preview/caustic_<d>m.png`, printing the lines' coverage. `DEP`, `CT`,
`CS`, `SPAN`, `W`. Tune there first; the menu's white sand shows nothing.

**Seen.** `test/caustic.js` at 5 m: thin wandering connected lines round 0.5–1 m cells — a net; at 16 m soft sparse dashes from the
long rings alone, which is what deep caustics do. The menu's sand in the app's browser: thin pale lines, no errors either tier.
`node build.js --test` green on both.

**Unseen, ask in this order:** (1) the person's 16 m and 5 m views over the shelf — the net's density is `CAU_T` (down for more),
its softness `CAU_SOFT`, its strength `t-y`; (2) whether the 16 m tile's repeat shows on a long flat (the swell carry warps it; a
32 m tile at 384² would cost ~10 M sines at boot); (3) the low tier's two long rings; (4) the boot cost on the person's PC — the bake
is synchronous in scene.js's load, behind the fade.


## v11.36.1 — the rings half again as long (13 Sep 2026)

The person looked at v11.36 at 10 and 12 m over the shelf: "much better … still kinda small dots, but they come on naturally". The
shape is right now, so the rest is scale: `CAU_RINGS` ×1.5 in wavelength — 3, 1.8, 1.1, 0.65 m — with the amplitudes ×2 so the
steepness holds (`A k²` scales as 1/L; RMS slope ~0.2, still a breezy sea) and the folds keep forming at 5 m. Nothing else moved.

**Seen** in `test/caustic.js`: at 10 m a net of connected lines round 1–1.5 m cells (was 0.5–1), the lines over 22–23% of the floor at
5, 10 and 16 m alike. `node build.js --test` green on both tiers. Not looked at in the browser this round: the menu's white sand shows
nothing the picture doesn't, and the person is the one swimming.

**Unseen, ask in this order:** (1) the same 10–12 m views — if the cells are still small, the rings can go ×1.5 again (the tile holds
it: a 1 m ring at 12 texels a wavelength) though 4.5 m ripples are a stretch to call wind ripples; if the net is now too dense,
`CAU_T` 3.5; (2) v11.36's list.


## v11.36.2 — the net in blocks, and a wider sun (14 Sep 2026)

Five shots from the person of v11.36.1 (kelp forest 9 m, rock 25 m, sand 6 m and 5 m, a field at 7 m): "the best by far … not great";
and, on reflection, that the shader "might be too nice or clean for the low poly game — maybe a more pixelated effect would land better".
What the shots said, in order: the net at 25 m was as crisp as at 6 m, the same cell size (the deep should be soft big blobs); the
forest floor had a full net under a dense canopy (the canopy term is the water map's 36 m texels — the honest fix is the world shadows,
a separate pass); the density was the same everywhere (a gusty modulation, a follow-on); and the lines were anti-aliased curves
sliding across flat facets — the last thing on the floor no vertex explained. This pass takes the first and the last.

**Blocks (`CAU_PX` 0.15 m).** The surface point is snapped to a world grid after the swell carry, so the net is drawn in world-fixed
blocks the pattern moves through, like a display; a block is lit or it isn't (`CAU_SOFT` 0, and the step is `step()` — `smoothstep`
with equal edges is undefined GLSL). `CAU_STEP` (frames a second the clock steps in; 0 continuous) is there for stop-motion water and
off by default, since it can read as lag. **A wider sun (`CAU_SUN` 0.03).** At 25 m the spread is 0.75 m: the 1.8 m ring is gone and
the 3 m one is soft blobs 1–2 m across; the cells grow with depth, which is what deep caustics do and answers "small dots" the
physical way. `CAU_T` 2.5 (was 3) to keep the shallows' lines two blocks wide.

**Seen** in `test/caustic.js` (which now snaps to `CAU_PX` and takes a hard step at `CAU_SOFT` 0): 25 cm blocks at 5 m were confetti —
the lines were one block wide; at 15 cm and `CAU_T` 2.5 a blocky connected net round 0.7–1.5 m cells (18% of the floor), and at
16 m sparse soft blobs 1–2 m across (10%). The menu in the app's browser boots with no shader error on either tier; `node build.js
--test` green on both.

**Unseen, ask in this order:** (1) the person's 5–7 m views: do the blocks read as the world's grain or as a screen door — `CAU_PX`
is the knob (0.2 coarser, 0.1 finer, 0 off); (2) the 25 m rock: soft blobs now, or still a net; (3) whether stop-motion is wanted
(`CAU_STEP` 8); (4) the follow-ons the shots named — the canopy (world shadows) and the gusts (a slow world-space modulation of the
rings' amplitude, which wants a small bake of its own); (5) v11.36.1's list.


## v11.37 — the sea at the world's scale, with gusts (14 Sep 2026)

Six shots of v11.36.2 from the person and a clear brief: "your main task is to make the caustics look good." What the old one had
right was metres-wide, soft, irregular, sweeping; v11.36.2 had "reworked it into various circles that move around" — at 11–15 m the
long rings were below focus and gave blobs, "all still kind of tiny blob looking, so nothing on top of that will sit right". Near the
surface the fine fast web was "really cool". The 15 cm blocks read a little weird only because the shadows are smoother — two grains.
And "nothing in the kelp forest, no caustics at all": that was v11.36.2's `CAU_SUN` 0.03, which blurred every floor past ~18 m dark
(the only intentional cut is the floating colonies' canopy mask, `canopyW`, 85% under a raft mat; kelp is not in it) — back to 0.02.

**Rings ×2.5, equal curvature.** `CAU_RINGS` 5, 3, 2, 1.2, 0.7 m (`Q.cau` 5 high, 3 low) on a 40 m tile at 320². The first try kept
the steepness, which is the physics of a wind sea — and puts the curvature in the shortest waves, so the folds were still a fine web.
Amplitude ∝ L² instead (equal curvature a ring, ~0.15 per train: a 5 m wave at 11 cm, honest chop), so the 5 m ring is an equal
partner and the cells come out at its scale; the 0.7 m ring is a trace of the fine web in the top few metres. **Gusts.** A second
tile (`CAU_GTEX`, 64², three octaves of the world's value noise at `CAU_GUST` [110 m, 0.75]) modulates the rings' amplitude by
1 − 0.75·(1 − n): patches of strong net and patches of calm, as a gusty wind ripples a sea, instead of one texture over the whole
floor. One tap. **Blocks 30 cm** (`CAU_PX`), lines two or three blocks wide at these scales — chunkier, nearer the shadow's grain.

**Seen, in `test/caustic.js` (which now takes the gusts, `OX`/`OZ` and a wide `SPAN`).** At 10 m over 16 m: blocky ribbons metres
long, half a metre to a metre wide, irregular — the world's grain. Over 120 m at 8 m: dense zones and calm zones, no tile grid (a
24 m tile showed as a lattice of the same ribbons at 100 m; 40 m does not). Lines over 7% of the floor at 5 m, 14% at 10, 19% at 16
(`CT` 2.5). The menu in the app's browser boots with no shader error, the whole load 655 ms on this PC with the ~8 M-sine bake in
it. `node build.js --test` green on both tiers.

**Not built, offered.** The two grains: snapping the shadow lookup to the same block grid as the caustic is a one-line change in
`SH_GLSL` and would give blocky shadows — the audit argued for a harder shadow edge anyway. The person's call.

**Unseen, ask in this order:** (1) the person's 5–15 m views — big enough now, and do the ribbons read as light; `CAU_RINGS`' first
entry is the scale, `CAU_T` the density; (2) the gust patches in play — `CAU_GUST[1]` 0.75 is the depth of the calm, 0.5 milder;
(3) whether the near-surface web survived in a form he still likes (the 0.7 m ring is weak now); (4) the blocky-shadow offer;
(5) the boot cost on the person's PC (`CAU_N` 320 → 256 halves the bake).


## v11.38 — two lights, one switch: pixel and smooth (14 Sep 2026)

Three shots of v11.37 from the person: "this does look cool. A little too busy — too many pieces and small things going on. Maybe even
bigger? The ribbons don't always read as light." And the decision: keep the pixel style as its own version and the high-resolution
one as its own, snap the shadows to the caustic's grain in the pixel one, and compare — "this may be one of those games where nice
effects work well with low poly textures. But for now we need to try both."

**The switch.** `pixel light` on the effects list (`e`; default on; `FX.pixel` → `pixU`, scene.js `uPix`). Pixel: the caustic in
`CAU_PX` 30 cm world-fixed blocks with a hard step, and the shadows read at the same grid — the receiver point snapped to it and moved
along its face's plane so it stays on the surface (a face steeper than ~72° is left alone), one hard tap instead of the four-tap
penumbra. One grain for both systems. Smooth: no snap, the caustic through a wide soft step (`CAU_SOFT` 1.2 either side of `CAU_T` 3),
the shadows as v11.23 built them — the OG's broad sweeping patches, now over a real structure. Both are the same bake; the switch is
a uniform read in the fragment. `test/caustic.js` draws either (`PIX=0`).

**Bigger and quieter.** `CAU_RINGS` 8, 5, 3, 1.8, 1 m (the 8 m wave at 28 cm, honest chop), the 1 m ring at half weight; `CAU_T` 3.
Fewer pieces: lines over 3% of the floor at 5 m, 13% at 10, 18% at 16.

**Seen.** `test/caustic.js` at 10 m over 16 m: pixel — sparse chunky patches 1–2 m across, a calm gust over the top half; smooth — the
same shapes as soft broad patches with gradients, unmistakably the OG's look. The menu in the app's browser: the row is on the list,
the switch flips live both ways and persists in `tethys.fx`; with pixel on the creature shadows have stepped edges and the sand
blocky patches, with it off both are soft; no shader errors. `node build.js --test` green on both tiers.

**Unseen, ask in this order:** (1) the comparison itself, in play, at 5–15 m — which the person prefers, and whether the pixel
shadows' steps sit well on a body's shadow (they are world-fixed, so a swimming animal's shadow crawls through them); (2) whether
8 m is big enough or too big — `CAU_RINGS[0]`; (3) whether the smooth version wants a lower `CAU_T` (denser, more like the OG's
coverage) — the two versions share it today; (4) acne on steep slopes in pixel mode (the snap is skipped past 72°, the band between
is untested); (5) v11.37's list.


## v11.38.1 — the beam diffuses, the edges agree, and a brightness slider (14 Sep 2026)

Five shots of v11.38 from the person: "WOW, looks so so so much better … the pixel look is interesting, not bad at all, but I
genuinely think the nicer looking effects are better for a game like this. The new caustics are legitimately awesome. My only
complaint is how they have these arbitrary thin and blurry zones." And: a slider to adjust the brightness.

**Two causes of the blurry zones, one of them physics.** The soft step was ±1.2 round the threshold, so weak focus — a calm gust,
a fold seen off its line — painted as a broad faint smear beside a crisp line. Softness belongs to depth, not to the local
strength: `CAU_SOFT` 0.5, and every patch has the same edge. And the first shot was at **73 m** with a clear net on it: the sun-disc
blur sets the cells' size with depth but the beam's diffusion by scatter is what kills the contrast, and real caustics are gone by
25–30 m in clear water. `CAU_D` 30 m: a contrast fade `exp(−d/CAU_D)` — 85% at 5 m, 60% at 15, 9% at 73 — on top of the disc blur.

**The slider.** `brightness` under `caustics` on the `e` list (`FX_SLIDERS`, effects.js: a slider is [label, key, min, max, step]
under a switch; the key is a number in `FX_DEF` and persists with the switches — the loader now takes any value of its default's
type). `FX.cauK` 0..2, default 1, multiplies `SEA_FOG.cau` where `LIGHT_K` is written (atmosphere.js); the readout's `t-y` still
moves the base. `pixel light` now defaults off — the person's preference "at least for now"; a saved choice is kept.

**Seen.** `test/caustic.js` smooth at 10 m: the same shapes with one edge everywhere, the smears gone. The menu in the app's browser:
the slider row under caustics, live, the value read back from `tethys.fx`, the switch rows still toggling round it; no errors.
`node build.js --test` green on both tiers.

**Unseen, ask in this order:** (1) the deep — does the net now fade away by 25–30 m as it should, and is the shelf at 5–15 m still
as the person liked it (`CAU_D` up if it lost too much); (2) the edges — one softness everywhere now; if the crisp lines are wanted
crisper, `CAU_SOFT` 0.3; (3) the slider's range (0–2) — whether 2 is ever wanted; (4) v11.38's list.


## v11.39 — a wind sea, light moved not made, gusts that blow, shafts on the same clock (14 Sep 2026)

The believability conversation the person deferred until the look settled, held 14 Sep and decided (PLANET, Decided 14 Sep 2026).
Four answers, four changes.

**No film: a wind sea and nothing else.** v11.38's rings had equal curvature — which is a sea with its short waves damped, a slick —
and I had offered the floating colonies' organics as a story for it. The person: "I had not intended for the planet's sea to carry a
film … I simply want to prioritise believability, even if it means smaller caustics. There is no stated stylisation." So `CAU_RINGS`
are a wind sea: constant steepness ak 0.06 across 8, 4, 2, 1, 0.5 m (7.6 cm down to 5 mm), which puts the curvature in the short
waves. Each ring folds at its own depth and the sun's disc and the beam's diffusion take the short ones first, so the net grows with
depth on its own: a fine fast web in the top few metres, metre cells at 5–10, 2 m at 10–15, soft patches by 20, nothing by 24. The
tile is 384² for the 0.5 m ring (5 texels a wavelength); ~12 M sines at boot, the whole load 725 ms on the dev PC.

**Light moved, not made** (`CAU_DARK` 0.35). The cells of the net — where the surface defocuses, `1/|det J|` < 1 — are darkened by
`CAU_DARK·(1 − I)`, so what the lines add the cells give back. `test/caustic.js` now prints the drawn factor's mean over the floor:
0.99–1.00 at 3, 6, 10, 16 and 24 m. v11.35 had this exactly and v11.36–v11.38 lost it to the line threshold.

**Gusts drift downwind** (`uWindOff`). The gust tile is sampled at `ps − windOff`, the wind's integral (`K.windOff`, the clouds'
drift) modulo the tile: cat's paws cross the floor at the wind's speed, 7 m/s in the trades, a calm's crawl in a calm.

**The shafts read the surface** (`cauFocus`, scene.js; `SH_FOC` 8, atmosphere.js). The focusing at a point, now, on the CPU from the
same tiles — the swell carry, the gust, the rings at their phases, the disc blur, det J. Each light shaft's alpha is scaled by the
focusing over its head (0.25 + 0.5·I, clamped 0.2–1.6): a shaft is a beam the surface focused, so it brightens and dims with the
same field the floor's net is drawn from. The two-sine flicker it had since v11.13 is gone. Of the audit's "four clocks for one
surface" the shimmer alone remains on its own.

**Seen.** `test/caustic.js` (`PIX=0 DEP=3,6,10,16,24 SPAN=24`): 3 m a fine web of thin lines with darker cells, gust-varied; 10 m a
net of 1–2 m cells, darker inside, bright lines; 24 m nothing. Lines over 6–10% of the floor, mean 1.00. The menu in the app's
browser boots with no error (an overcast moment, no net to see); `node build.js --test` green on both tiers, the shafts' CPU read
included in the smoke.

**Unseen, ask in this order:** (1) the wind sea in play — the fine web at 2–4 m the person once liked and once found "busy" is
back by decision; whether it reads as water; (2) the darkened cells on the pale sand — too grey, and `CAU_DARK` comes down (0.2), the
mean then a little over 1; (3) the shafts — do they now flicker with the net beneath them, and is 0.25 + 0.5·I the right range;
(4) the gusts' drift at 7 m/s — visible, and not a slide; (5) the boot cost (`CAU_N` 384; 320 loses the 0.5 m ring's shape).


## v11.39.1 — PIXEL.md: the de-res, designed (14 Sep 2026)

A document, no code. The person, on the pixel light: "the pixel version is awesome … it would only look proper if the rest of the game
was like that" — then, with a screenshot of it at 20 m: "de-res the rest of the game: not changing any meshes, just the texture
being pixelated to a rough or equivalent size, more Minecraft-like; the ground and objects too, so the pixel shadow/caustic look
matches it." `PIXEL.md`: one rule — in pixel mode a surface's colour is constant over a cell of a texel grid fixed to the thing it is
on (the world for the ground, the body for an animal, the instance for a plant) — built as a shader path behind the light's own
`uPix`: the fragment extrapolates its interpolated colour to the cell's centre with screen-space derivatives (exact within a facet,
~25 ops), posterises it, and adds a hashed tone per cell for grain, with the creature coats gaining a `pattern` for stripes, spots,
plates and scales in body space. No second world, no conversion script, no textures, no memory; the switch is instant both ways.
Three passes (the de-res; the texels' pattern with the lab's controls and `test/preview.js PIX=1`; the edges) and six Open questions
for the person — the bodies' texel size first. Not built.


## v11.40 — the de-res, pass A: the world in texels (14 Sep 2026)

PIXEL.md pass A, the person's six answers taken as given (bodies 0.15 m, the world 0.3, the fog continuous). Meshes untouched. One
switch: `pixel light` on the effects list is `pixel` now — the light's blocks and the world's texels together, off by default as it
was. "Look at it before you tell me it's done": looked at, below.

**The rule, built** (scene.js, "The de-res" at `PIX_T`). In pixel mode every tinted surface's colour is constant over a cell of a texel
grid fixed to the thing it is on. `addTint` adds a varying `vGrid`: the position before the model and instance matrices, read at
`begin_vertex` (before the sway, the collapse, the wave — the texels ride the blade) and scaled to metres by the object's and the
instance's scale; a material with `grid 'world'` takes the world position instead. The fragment (`PIX_GLSL`) extrapolates its own
colour to the cell's centre with screen-space derivatives — the tangent basis `dFdx/dFdy(vGrid)`, the centre's offset put on the face's
plane along its dominant axis (the xz grid on a floor, yz or xy on a wall — the three-way pick a Minecraft block makes), a 2×2 solve for
the screen offset, `col + a·dFdx(col) + b·dFdy(col)` — exact for a linear interpolant, then posterises to `PIX_TONES` 16 levels a
channel. It sits before the light block (whose caustic and shadows snap themselves, v11.38) and before the tint and the fog (continuous,
decided). Which grid: the terrain (`TERRAIN_MAT`, cells and the far mesh alike) and the landmarks on the world's; bodies on their own
(`PIX_TB` 0.15: every non-instanced lit material — `MAT`, `MATBIG`, `MATT`, the lab's); every instanced thing — plants, the cells'
boulders, the structures, the far cards — on its instance's at `PIX_T` 0.3. `CAU_PX` is `PIX_T` now: one knob. The landmarks
(far.js `keep`) moved off `MATBIG` onto a new `MATLM` — the same material with `grid 'world'` — because `MATBIG` is also a big
animal's far LOD and a shared material can't be both. The shimmer (`sunMesh`) is hidden in pixel mode (a canvas radial gradient has no
cells). Off, the whole thing is one uniform test per fragment; nothing new is allocated, no texture, no target.

Also: serve.js's sink takes a `.png` (a screenshot of the canvas posted from the app's browser — how the shots below got off the page:
`renderer.render` then `canvas.toBlob` then POST `/_bench/<name>`); test/smoke.js flips the switch on for one clade (the JS path:
`fxToggle`, `fxApply`, the shimmer's rule; the stub compiles no shader).

**Seen** (dev.html in the app's browser, the switch on, finback, 14–17 m, the sun behind cloud): every lit program compiled with the code
(read back from the page: `vGrid` in the fragment of all twenty-one tinted programs, the world grid on the terrain's and the landmarks'
only), no console error. The menu: the sand in 0.3 m blocks, the three bodies banded. The shelf forest at (330, 0): the floor in
world-fixed blocks with the finback's shadow on the same grain. The finback at 3 m: the countershade in bands, the band edges
stair-stepped at 0.15 m. A boulder at 2 m behind it: flat facets, one stepped tone boundary. The lab's soft-arm at 2 m: the ridge's
pale patch with a stepped edge. The talus slope from 16 m. A blade at 1.5 m: one flat green — a blade's vertex colour is flat, so
there is nothing to band (pass B's vein is what would show on it). `node build.js --test` green on both tiers.

**What it looks like, plainly:** posterised more than texelised. The gradients across a body or a facet are gentle, so sixteen levels
give two or three bands and the grid shows only where a band's edge falls; a flat-coloured face shows no grid at all. That is what
pass A is — pass B's per-cell grain is what makes every cell visible. If the person wants the grid to read before B, `PIX_TONES` 8.

**Unseen, ask in this order:** (1) motion — does anything swim as the camera moves (a still frame cannot show it; the grid is fixed
to the thing by construction, the extrapolation is the new part); (2) the tone count — 16 leaves a body in two or three bands; (3) the
rigs — arms and tails are skinned by `rigSkin` into their own geometry, so their grid is the rig's frame: do an arm's texels crawl
along it as it bends; (4) the near/far seam — both terrains are on the world grid, but the far mesh's facets are coarser, so the
extrapolation is from a different plane: does the cell's edge show; (5) walls — the caustic snaps on xz where |n.y| > 0.3 while the
colour picks the dominant axis, so on a face between 17° and 35° off vertical the two grids differ; (6) the rocks' tide band
(`BAND_GLSL`) runs after the snap and is still a smooth gradient across the texels (pass C, the edges; the boulder's foot runs
before it and is snapped); (7) cost — ~40 ops a fragment in every lit program, behind a uniform branch: `render` ms on the 4060
with the switch on and off, in the forest.

**Seen by the person (14 Sep 2026):** "Looks great. Literally zero complaints." The animals and their rigs look right; render cost is a later thing — pixel mode is an optional style, kept so the two looks can be compared. Nothing on the unseen list was raised.


## v11.41 — the de-res, pass B: the pattern in the texel (14 Sep 2026)

PIXEL.md pass B, on the person's "let's do it" after pass A ("literally zero complaints"). Constant colour per cell was the de-res; a pattern
per cell is the Minecraft. Pixel mode only; nothing changes with the switch off.

**The grain** (scene.js `PIX_CLS_GLSL`, after the posterise). A hash of the cell's index gives one of {−1, 0, +1} × `PIX_GRAIN` 0.06 of tone,
weighted by the material's class (`PIX_CLASS`): sand 1.0 and rock 0.6 on the terrain, told apart by the vertex colour's luminance (the
terrain colours by substrate, so no new data); placed rock, structures and the landmarks 0.6; plants, blades and the far cards 0.4; bodies
0.5. Applied as one multiplier so a 6% step survives the sixteen levels. Every `addTint` material names its class (`cls`, the sixth
argument; the sway materials are blades when thin and plants otherwise; `MAT` instanced is a plant, non-instanced a body).

**The marks.** Rock: a darker stratum every `PIX_STRATA` 4 cells of world height (1.2 m), by 0.08 — the boulders share strata across a
face. Blades and cards: a vein every `PIX_VEIN` 3 cells across the growth axis, by 0.08 (the across index is the cell axis that is not
the growth axis). Bodies: the coat's pattern in body space — stripes bands along z, spots hashed clusters of scale² cells at a 30%
threshold, plates a coarser grid with a darker seam, scales the same grid with every other row offset by half a period.

**The spec** (creatures_spec.js "the texel pattern"): `spec.pattern = {kind, scale, tone}`; `PATTERNS` none | stripes | spots | plates |
scales; by clade unless the spec says (`PATTERN_BY_CLADE`, the person's rule: ringmouths spots, slowbloods stripes, hingeshells plates,
drifters none), `PATTERN_DEF` scale 3 cells, tone 0.12; `fillSpec` fills it, so the export, the hash and the share carry it like any key.
It reaches the shader as a per-vertex attribute `aPat` on every mesh of the body, the rigs' too (`patternOn`, at the end of `compile`), and
on the far LOD's baked geometry (creatures_ai.js spawn) — no per-mesh uniform on a shared material (r128 re-uploads a Lambert's uniforms only
when the material changes between draws, so an `onBeforeRender` hook would not have worked). A geometry without it — an egg, a plant on
`MAT` — reads zero and draws no pattern. The lab's coat tab has the three controls (pattern, period in cells, tone) with a note when the
switch is off; the **custom** option and the painter are pass D, as decided.

**`test/preview.js PIX=1`** draws a body as pixel mode does — the tri's colour posterised, the grain and the pattern per 0.15 m cell of the
body frame, the same column and hash rules in JS — so a coat can be looked at without the game: `PIX=1 node test/preview.js fin soft`.

Fixed on the way: the pass A note on the shimmer line (atmosphere.js) was a trailing `//` that ate the rest of its line, so the shimmer's
opacity and position stopped updating in v11.40 (lint found `SHIM_A` unreferenced). One version; in pixel mode it was hidden anyway.

**Seen** (dev.html in the app's browser, the switch on): the sand grained in 0.3 m cells — the floor reads as texture now, not bands; the
dome boulder at 20 m in horizontal strata; the finback striped; the crusher (a slowblood) in 0.45 m bands, the sickle (a hingeshell) in
plates on its hull and in scales at tone 0.3 after the lab's select was changed through the real input path (the spec and its hash carried
it, no error); the three controls on the coat tab with the clade's default filled in; a dark mud floor at the rock weight. `PIX=1`
previews of fin (stripes), soft (spots) and crusher. `node build.js --test` green on both tiers; lint clean.

**Unseen, ask in this order:** (1) the tone: is 0.12 by default a mark or a smudge, and is the sand's grain (1.0) too busy at 14 m;
(2) spots at 30% of scale² clusters — a ringmouth up close; (3) the vein on a real blade at a metre (the floor shot had only tufts);
(4) the strata on a wall — the cell there is a column along x or z, so the stripe is by `vWy` and stays level, as it should; (5) the
far cards' vein against the near plant's at the `FLORA_FAR` hand-off; (6) the bestiary run-through, every species' clade default.


## v11.41.1 — the strata binned, the rock grain coarse, texels on their own switch (14 Sep 2026)

The person on v11.41: "those textures look AWESOME", the sand's grain good; two comments. **The rings round the rocks go**: they were
`PIX_STRATA`, the darker stratum every 1.2 m of world height, which on a boulder is a set of level rings — gone, knob and all. The rock's
grain is coarse instead: hashed on clumps of `PIX_ROCK_CLUMP` 3 cells (0.9 m), weight 0.7. **The switch is two**: `pixel light` (the
caustic and the shadows in blocks, `uPix`, as v11.38 had it) and `texels` (the de-res and the pattern, a new uniform `uTex`; the shimmer
hides with it), so the textures can be tried under the smooth light. Both off by default; a saved `pixel` choice is kept, `texels` starts
off. The lab's note and the smoke test follow the new key.

**Seen:** the effects list with both rows; texels on and pixel light off — the sand grained under the smooth caustic and the soft shadow;
a boulder with no rings and 0.9 m clumps. `node build.js --test` green on both tiers.

**Unseen:** the boulder's coarse grain up close — 0.7 at 0.9 m may want more weight now that the strata are gone.


## v11.41.2 — the light out of the texel (14 Sep 2026)

The person's two screenshots of v11.41.1 (texels with and without the pixel light — "fantastic" with it; without, "more time to decide"; the
texels "add a lot of visual character"): the ground's light showed as "odd ring effects … colours radiate out in the zone they're colouring
as you move across it … like light sources glow with rigid contours … reminds me of Morrowind". Diagnosis: the player's own point light
and the sun's falloff are smooth per-vertex ramps, and the posterise turned the ramp into sixteen level rings that move with the light —
exactly Morrowind's vertex-lit bands.

**Built** (scene.js `PIX_GLSL`, the note "The light in the texel"): by default the fragment splits the colour it has into albedo
(`diffuseColor.rgb`, the vertex colour times the material's — in scope at `fog_fragment` in r128's Lambert and Phong) and light (what is
left after dividing it out). The albedo alone is extrapolated to the cell, posterised and grained; the smooth light multiplies back. Colour
in cells, light continuous; the countershade still bands, since it is in the vertex colour. **`banded light`**, a row under `texels` on the
effects list (`FX.texelLight`, `uTexL`), is the v11.41 look, kept to compare; off by default.

**Seen:** the menu and the shelf with texels on, banded light off: the sand in cells with the player's light a smooth pool over them, no
rings; the same with banded light on: the rings back. `node build.js --test` green on both tiers.

**Unseen, ask:** whether the smooth light is the one — and whether without the bands a body's countershade still reads as pixel art or now as
a smooth-lit sprite (the tones are in the vertex colour and still band, but the sun's own Lambert gradient across the flank no longer does).


## v11.41.3 — the posterise dithered (14 Sep 2026)

The person on v11.41.2's smooth light, with two videos: "freezing the lighting just makes it look like rainbow sherbet … static … like the
dirt has changed colours"; the banded light is "distracting to the point I know people would beg me to let them turn it off"; "is it
possible to have the light at a higher resolution?" The rings were the posterise's hard steps on a smooth ramp; the smooth light took the
steps out of the light and left the ground's colour patches frozen under a light that no longer read as light.

**Built:** the posterise is dithered (scene.js `PIX_GLSL`, `bd`): a 2×2 Bayer offset per cell — 1/8, 5/8, 7/8, 3/8 on the cell's parity — in
place of the half-step rounding, in both modes. A tone boundary is now a checkered band of cells instead of a contour, the way pixel art
has always drawn a gradient; the light still moves and pools. `banded light` is on by default again; off is still the smooth light.

**Seen:** the talus slope with texels and the pixel light on, banded light on — the player's pool over the sand with its edges checkered,
no rigid ring; the finback's flank the same. `node build.js --test` green on both tiers.

**Unseen, ask:** whether the checkered edges read as light in motion; if the bands are still too visible, the next step is the player's
own point light computed exactly per fragment (its position, colour and range as uniforms, subtracted from the vertex light and added
back smooth) so only the sun and the ambient are posterised — a bigger change, held until this is seen.

**Seen by the person (14 Sep 2026, on v11.41.3):** "It looks interesting … certainly its own look — not one to scoff at, but the game is still built around a kind of minimalist vibe that gets filled in by space as opposed to noise." Undecided which is the right call; "it can look incredibly cool and old school". Down the line: possibly a really, really subtle version of the texels — an incredibly small amount, to touch up what look like smooth objects normally. Nothing to change now; both looks stay on the effects list, off by default.

## v11.42 — the fog in two segments, the swell with the wind, the camera on the line (14 Sep 2026)

From `WATER.md` (the 14 Sep audit of the surface from both sides; the person: "two segment fog please", and for the half-and-half
camera "the most believable outcome"). Three changes, one version:

- **The swell runs with the wind** (world.js `WAVES`): the directions are `WIND_A` ± a fan (the swell on it, the wind sea within ±0.6 rad).
  To v11.41 the 46 m swell travelled toward 0.35 — dead against the wind, the caustic's ripple trains, the spray and the flats — and the
  rest fanned to every quarter (WATER.md item 1). Five numbers; the physics and both shaders read the same table.
- **The two-segment fog** (scene.js, the fog block: `fogVeil`, `fogWater`, `fogAir`; `FOG_A`, `FOG_AC`, `FOG_PSURF`, `UPWELL`,
  `WAVE_GLSL_FOG`). Every ray is cut where it crosses the water and each part takes its own medium's fog, the part nearer the fragment
  first: the water's veil (the old body, now a function of its origin) over the part in water, the air's haze and mist over the part in
  air. The medium is no longer the camera's (`applyFog` writes both media's sets every time; `uFogP.w` is now "may split", 0 on the
  surface mesh, whose fragments are the boundary). The level: the wave at the camera (`uFogAC.w`, JS `waveH`), the wave sum per fragment
  within 3 m of the tide (a pad on a crest is *at* the surface), the mean elsewhere. From above, a downward ray's water is darkened toward
  `UPWELL` (the old `TINT_COL` over `WCOL[0]`), so the deep straight down is the blue it was and at grazing it is the veil. **The
  through-water depth tint is gone** (`addTint`; `uTint.y/z` unread) — the fog paints the column by path length and place instead. **The
  surface's topside body** (atmosphere.js `SURF_BODY` 0.22, `uBody`): the dark diffuse at 0.66 alpha is down to 0.22 at normal
  incidence; the Fresnel sky still takes it to 1.0 at grazing; the foam is opaque. The surface's look is chosen by the face
  (`gl_FrontFacing`), not the camera's medium; `uUnder` (the camera's true side, this frame) remains for v11.5's back-face-in-air case.
- **The camera on the line** (player.js): `CAM_CLEAR` and the target's 0.5 nudge are gone; `camAbove` flips `CAM_FLIP` 0.4 past the wave
  (with `CAM_DWELL`) and drives only the light's crossfade, the sound and the water's things. The sky stays drawn within `SKY_NEAR` 1.5
  under the wave (atmosphere.js): a camera just under sees air through the near plane's gap, and that is the sky. POLISH's "split water
  line" entry is superseded by this: it was a pass; with the fog per fragment it is a plane test.

**Seen:** `node build.js --test` green on both tiers; the shaders compile in the app's browser (no console errors); one frame from just
under the surface over the shelf with the sky above the line and the seabed below it. **Unseen, ask in this order:** (1) the sea from
15 m up over the forest (the person's fourth screenshot): the far seabed should be gone into the water's colour, the near sand clear;
(2) the shore from the water's edge: sand-coloured shallows, blue past them; (3) the camera resting on the line while swimming at the
surface — the waterline's facets, whether the chop sweeping the eye is tolerable (the eye could ride the wave if not); (4) the underside
within 1.5 m of the surface, where the sky now shows through the mirror's alpha (WATER.md B makes that the window); (5) `SURF_BODY` —
too glassy or still too teal from above; (6) rain from above (the air's haze thickens by `FOG_A`, as it did).

## v11.42.1 — the water's fog over the whole ray from above, the underside opaque (14 Sep 2026)

The person on v11.42, with a video and three stills: "the clear water looks completely different, huge environmental step up", then
"the fog goes away once you leave the water. So you gain vision. Looks insanely weird" — the forest crisp to the horizon from just
above the surface and from the line, a white flash at the water line, creatures seen far off against a pale backdrop from above.

**Why.** (1) v11.42 fogged the water's part of a ray by its own length: from 2 m up, a stalk 200 m off and 5 m deep took 128 m of
water (51% through) against a bright surface veil, where from below it takes 200 (23%). The true ray refracts at the surface and shows
a compressed sliver of what is close under the exit point — geometry this engine cannot draw — so the honest stand-in is that nothing
under water is seen further from above than from below. (2) The surface's underside was still 62–74% opaque, and what lay behind it —
the shore, the sky within `SKY_NEAR`, the dome — was now fogged as air, pale, and bled through, flickering as the facets flipped.
(3) A bug: the fog chunk's clock (`uFogTime`) was handed `timeU` itself, and r128's `cloneUniforms` copies a number by value into every
material, so it stood at zero — the level the ray was cut at was a frozen sea, and a kelp cap on the real wave sat above or below it.

**Built.** scene.js: from above, the water segment is fogged over the whole ray's length `d` (its origin still the crossing, so the veil is
the surface water's), times the chop's scatter at grazing — `SCAT` [0.06, 0.30] on the ray's elevation × the chop (17°–3° in the trades,
4°–1° in a calm: a wind sea's slopes scramble a transmitted image within a few slope-widths of the horizon, and what is left is the
water's colour under the reflected sky) — and the far cut. The clock and the chop go to the chunk as a typed array (`FOG_TC`, main.js
and `updateHaze` write it). atmosphere.js: the underside's alpha is 1.0 — a total-internal-reflection mirror outside the window, the
window's own colour inside it until WATER.md B draws the refracted sky; the shimmer sprite draws over it (renderOrder 0, no depth test)
at `SHIM_A` 0.9 again.

**Seen:** `node build.js --test` green on both tiers; the shaders compile in the app's browser. The app's browser pane would not tick
the game loop this session, so the sea itself is **unseen — ask, in this order:** (1) from the line and from 2 m up over the forest:
the far forest should fade as it does from below, the near stalks and the sand stay clear; (2) the water line while swimming at the
surface: no white flash; (3) the far sea at grazing from above: reflection only, no creatures through it; (4) from just under the surface:
the underside now opaque — whether the sun's shimmer still reads and the window is not too flat; (5) `SCAT` if the grazing cut-off is too
near or too far — it is two numbers.

## v11.42.2 — the fog cuts the ray at the drawn surface (14 Sep 2026)

The person on v11.42.1, three stills: "still seeing white nothingness out there … high enough in the distance you can still see
clearly through" — a white wall of kelp stalks on the horizon, from just under the surface and from just above it.

**Why.** The surface mesh fades each wave out where its grid cannot resolve it (`aSpace`, v11.4), so 200 m out it is drawn at the mean
level; the fog chunk cut the ray at the *full* wave sum, which swings ±1.2 m there. Everything in the band between — the far kelp
cards' tops, 1.4 m under mean level; a stalk's top on a trough — was classed as in air and took the air's haze: white, visible at any
distance, from either side of the water.

**Built** (scene.js `WAVE_GLSL_FOG`, `WAVE_FADE_D`, `FOG_SN`/`FOG_SR`): the fog chunk's wave sum is the drawn surface's, each wave faded
by the fragment's distance from the mesh's centre (max of |dx|, |dz| from the camera — the grid's per-axis mapping) between the two
distances where the mesh's fade starts and ends, found once from the grid's own numbers (46 m: 90→259; 29 m: 49→136; 15 m: 20→56;
8.5 m: 6→26; 6 m: 0→15 on high — DESIGN's figures). `FOG_SN`/`FOG_SR` mirror atmosphere.js `SN`/`SR`: change both or neither.

**Seen:** `node build.js --test` green on both tiers. The pane would not tick again; **ask** for the same three views — the far forest
from just under the surface and from just above it should fade into the water's colour, no white stalks on the horizon.

## v11.42.3 — the sky above the water only, the dome below it, the mirror the reflected veil (14 Sep 2026)

The person on v11.42.2: "I see the same thing pretty much. In the same spot." — and then opened the app's browser pane, so this one was
seen. Hiding the kelp showed the white was never the stalks: a **solid white band on the horizon** between the surface line and the far
floor, the stalks dark against it.

**Why.** The sky is a whole sphere at 0.94·FAR and the far terrain clips at the draw distance, so just under the surface line — where a
ray runs nearly level for more than the draw distance before it meets the floor — the sky's lower half showed. Under water it had been
hidden by the black dome until v11.42 kept the sky drawn within `SKY_NEAR` of the surface (which is why it vanished "once I get low
enough"); from above it always showed through the surface at grazing, and v11.42's thinner topside body made it plain. Two more found
on the way: (1) the far cut closed a split ray to the *camera's* medium, so from above the dome and the far floor past 0.9·FAR came out
the air's horizon white under the water; (2) far out the kelp folds to the true wave while the fog's level was the drawn (faded) surface,
so a folded top on a crest counted as air.

**Built.** atmosphere.js: the sky discards any direction whose point at its radius lies under the water (`uCamH`), the dome discards its
fragments above the water level and is drawn in both media — the two tile at the water plane at the far plane, and the dome is the water's
far wall from either side, fogged into the veil. scene.js: on a split ray the far cut belongs to the water segment only; the fog's level
is the higher of the drawn surface and the true wave (`fogWaveH` twice, within the 3 m band). And WATER.md C, brought forward because a
camera at the line saw the near facets overhead as a dark slab against sunlit water: **the underside mirror is the veil in the reflected
direction** — the ray reflected off the facet, the water along it to the floor (`uFloorMap`) or the veil's reach, through the fog chunk's
`fogVeil` — in place of `fogColor·0.9`, one flat colour with no daylight by direction and no sun.

**Seen** (the app's browser, the shelf forest at x 180): from 0.25 m above the water at noon — the sea at grazing the sky's pale
reflection, the near forest through it, the far forest dissolving, no white; from 2 m under — the far forest fading into the veil, the
underside a continuous luminous ceiling; from 10 m under looking up — the window with the sun. `node build.js --test` green on both
tiers. **Unseen, ask:** the line itself while swimming at the surface (the waterline's facets; the eye riding the chop); dusk and night
from both sides (the reflected veil takes the daylight, the window `uWin`); the shore.

## v11.42.4 — the far kelp cards dimmed (14 Sep 2026)

The person on v11.42.3: "You 95% fixed it. Holy smokes it makes a massive difference in the believability of the world" — and a thin
pale line left along the far water level, which they read as the light shafts' tops. It was not the shafts (they hang within ~30 m of
the camera, from 3 m under, so from 10 m down they sit 14° above the horizon, and switching them off changed nothing): hiding the far
impostor cards (`MATFAR`) removed it. Past the swap at `FLORA_FAR` the cards' residual through the fog read *paler* than the veil where
the real kelp's read darker — the stipe's pigment darkens with depth and its pads are silhouettes from below, the card's tint did not —
so the far forest was a faint pale band with a bright row of card pads along the water level.

**Built** (far.js `FAR_IMP`): a `dim` per card kind on the instance tint — the stipe 0.55, the bladder 0.7; the raft and the tidal tree
unchanged (`impostorsGen`). **Seen:** the far horizon from 10 m under, the cards' band gone into the veil; tests green.
**Ask:** the swap at 450 m from the real kelp to the cards in daylight — whether it now reads darker than the kelp instead of paler.

## v11.43 — the real Snell's window (14 Sep 2026)

WATER.md B, on the person's "go ahead and do it". The underside's window was a constant colour (`(0.22,0.46,0.56)` diffuse plus a fixed
emissive × `uWin`) with the sun stood in for by a 90 m additive sprite over the surface and a `pow(…,40)` glint.

**Built** (atmosphere.js `SURF_MAT`, `SKYLITE_GLSL`): inside the window the eye is refracted through each facet into the air
(`refract(-V,-normal,1.33)`, view space, to world by `uFogR`) and the sky is read in that direction by `skyLite` — a reduced copy of the
sky shader (the gradient, the sun's aureole and horizon glow, its disc and glare, the moon's disc and halo, the deck's shade as a flat
factor of `uCover`, no cloud noise, no stars) sharing the sky's own uniforms (`skyU`, pushed every frame now, since the sphere is hidden
under water). Past the critical angle `refract` returns zero and the horizon's colour stands in, which the soft 15–50° band the person
chose in v11.7 (`snell`) blends into the mirror of v11.42.3. So the sun wobbles facet by facet, a sunset lies warm along the rim, the
moon comes through at night, and the flip between window and mirror per facet — the thing that reads as moving water — is kept. The
diffuse inside the window is 0.3 of what it was (the sky carries it). **Gone:** the shimmer sprite (`sunMesh`, `sunTex`, `SHIM_H/A`)
and its effects-list row `surface glow`; the refracted glint in `lights_fragment_end` (the disc and glare in `skyLite` are the glint);
`uDf`. `SKY_FS` is the reference for `skyLite`: when its gradient or glare changes, change both.

**Seen:** from 10 m under at noon facing the sun — the disc through the facets overhead, the sky's blue through the window, banded
by the facets; from 2 m under — a pale sky through every facet, the far surface the mirror's teal; at sunset from 4 m — warm bands
along the rim. `node build.js --test` green on both tiers. **Ask:** the window at night under the full moon; whether the sun through
the facets reads brighter or duller than the sprite did (`skyLite`'s `uSunC*1.4` disc and the 0.92 on the window); the rim's
horizon colour in the soft band (`snell`'s 0.25–0.65) — it is the sky's horizon now, not teal.

## v11.44 — shoaling, breaking and shelter; the foam emissive; a comment that ate six bindings (14 Sep 2026)

WATER.md D, on the person's "go ahead and do it".

**The sea by the floor** (world.js `waveFac`, `WAVE_BRK` 0.39, `WAVE_SHOAL_MAX` 1.6; scene.js `waveAmpGLSL`/`waveSumGLSL`/`WAVE_DEP_GLSL`;
far.js `wfRaw`, `wmWave`). Every wave sum — the JS physics (`waveH`), the surface mesh, the kelp's fold and the rafts' bob (the sway
shader), the fog's level (`fogWaveH`) and the caustic's swell carry (`cauFocus`) — reads the water depth and the place's wave energy
at its point from the floor map (red: the floor; green, new: `mix(0.35,1,expo)·(1−0.75·shel)` — 1 on the struck flank, 0.35 in the lee, a
quarter of that inside the lagoon), and each wave's amplitude is its deep-water amplitude × Green's law as the floor comes up
(`(L/2d)^¼` past half a wavelength of depth, at most ×1.6) × the energy (the wind sea whole, the swell by half — it wraps) and no more
than 0.39 × the depth, the breaking limit H/d 0.78. The excess over it is white water: the surface vertex hands it to the fragment as
`vBrk`, foam on the topside and a pale patch on the underside. The wavelength does not shorten (a phase integral, not a local factor).
At the strand the amplitude goes to nothing and the water stands at the tide. The map is initialised deep and fully exposed
(`FM_DATA.fill(255)`) so headless tests without the far layer keep the deep-water sea. Vertex texture fetch: 16 units on the 4060.

**Foam** (atmosphere.js `SURF_MAT`): the breaking excess and the crests' whitecaps — by height as before but halved and by the chop
(`uChop` in the fragment now), a wind sea's, since shoaling raises the swell over the whole shelf — drawn *emissive* in the sky's
light (`uWin`); lit foam went dark far off, where the flat normal comes from screen derivatives across triangles under a pixel quad.

**A bug of v11.43's**: the comment after the window's sky bindings sat mid-line and commented out the six bindings after it — `uSkyR`,
`uWin`, `uGlint`, `uRain`, `uBody` and the surface's own fog set `FOG_PSURF`. The surface fell back to the split fog, its own crests were
classed under water wherever the true wave stood above the drawn one, and from above every far crest wore a dark patch; found by
reading the compiled uniforms (`renderer.properties.get(SURF_MAT).uniforms.uFogP.value !== FOG_PSURF`) after foam, depth, back faces,
the dome and the rafts had each been ruled out by toggling them live. Fixed by moving the comment.

**Seen:** the shelf from 0.2 m above — clean again, the sea at grazing the sky's reflection, the near sea clear; 2.5 m under — the
window and the far forest as before; the exposed shore at (124, 220) from the water's edge — the amplitudes there 0.57/0.32/0.14
(shoaled from 0.50/0.32/0.18 with the wind sea scaled by 0.81), the strip along the strand pale, though at the pane's resolution the surf
band could not be told from the wet sand. `node build.js --test` green on both tiers. **Unseen, ask in this order:** (1) the surf line
on the struck flank at a low spring (the strand at tide −4.5 exposes the flats: the map's depth is blurred over ~70 m, so the band is
broad and soft — `WAVE_BRK` and the map's blur are the knobs); (2) the lagoon in the trades against the open shelf — the chop should be
a quarter of the open sea's, the swell three quarters; (3) the weed forest's frame time at (330, 0) — the sway shader's fold now
fetches the floor map and takes five `pow`s per vertex; the last pass had it at 3.2 ms on the 4060; (4) whether the whitecaps
(halved, by the chop) are missed in the trades.

## v11.45 — the line from above: the reflection by direction, the air's far colour the sky's, the long swell (14 Sep 2026)

The person's ask: the water line seen from above, good with something in the distance, odd for depth over open water. The audit is
WATER.md Part 3 (measured down the screen's centre column at 1280×720: the sea's edge was the one constant every air fragment converges
to, the horizon keyframe, which the dome never shows — a pale rim under a darker sky, fixed at 992–1440 m so it widened with height until
from 40 m there was no line at all; and between 100 m and the rim nothing varied but the fog, since the reflected sky was one colour for
every direction and a facet's tilt changed nothing of the topside). Their answers: the line's side my call ("whatever is more believable
given the planet"), facets visible, the air my call, a long swell for "maximum compatibility and most believable".

**The topside reflection by direction** (atmosphere.js `SURF_MAT`, `REFL_FACET`, `REFL_GRAZE`; WATER.md item J). The reflected sky is
`skyLite` of the eye reflected off the *facet* (world normal by `uFogR`, clamped to the horizon), not `uSkyR`: the zenith at the feet, the
horizon far off, and every facet a different elevation of the sky. **Composited as a reflection**: alpha is the fraction of the column the
surface covers, `uBody + R − uBody·R` (the foam whole), and the colour is divided by it, so the blend gives exactly `R·sky + (1−R)·(body
over the column)`. To v11.44 the reflection was scaled by the body's alpha too — a third of itself at 25°, the facets' swing lost in the
column: the first cut of this version (the direction alone) gave ±2 levels between facets at 140 m, measured, and a sea still smooth.
R is the facet's own Fresnel where the view is steep (`cm` above `REFL_GRAZE[1]` 0.35, 20° down) and the mean surface's at grazing (below
0.12, 7°), where the per-facet weight was the v11.7 tennis-court wedges. **Seen:** from 15 m looking across the swell the rows converge to
the horizon; looking along it (north, where the facets tilt sideways and reflect the same elevation) the rows run diagonally; from 3 m
looking down, faceted bands in the mid-distance and a smooth near sea (the reflection is 2% there — physics, and the same as before).
At the line the sea now reflects the sky a few degrees up, darker than the horizon's haze: the sea's edge is 166,182,194 under a sky of
181,196,208 (was 183,201,216 under 180,196,208).

**The air's far colour is the sky's, by direction** (scene.js `skyLite2`/`skyLite`/`skyFar`, `FOG_SKA..F`, `fogAir`). The reduced sky
moved from the surface's shader into the fog chunk, reading six shared vec4s (`uSkA..uSkF`: zenith+dayK, horizon+cover, glow+moonL, the
sun's colour, the sun's and the moon's directions; typed arrays, written by `pushSky`), and `fogAir` converges to `skyFar(rd)` — the sky in
the ray's direction with the haze band integrated to infinity, exactly what the dome draws there — instead of `uFogAC`'s constant. The rule
the veil has had under water since v11.27, for air. `skyFar` takes the sky *without* the deck's mean shade (`skyLite2(d,0.0)`): the dome's
gradient between its clouds is unshaded, and with the shade the cone stood as a silhouette 15% darker than the sky beside it from 1500 m
(seen, fixed). **Seen:** the far sea, the far kelp and the shore end in the sky behind them at 1, 15 and 40 m; toward the sun the sea's edge
takes the glow and the line softens into it; away from it the sea ends darker than the sky. Cost: `skyLite` per fragment in air (~40 ALU:
two `pow`s to 300 and 10, an `exp`, the gradient), unmeasured.

**The long swell** (world.js `WAVES[5]`): 150 m, 0.30 m, period 9.8 s, from a far storm upwind in the trade belt (`WIND_A`+0.08), so it
strikes the flank the exposure field already gives surf, cones and spray to — a swell from another belt would put the surf on a shore the
geology calls a lee (WATER.md L, answered by compatibility). Last in the table: the caustic's carry (`CAU_SWELL` 4), the spray and the
audio index the first entries and keep the 46 m as "the swell"; every sum reads the whole table (physics, the surface, the fog chunk's
level, the sway fold, the rafts). The grid draws it whole to ~460 m and fades it by 1.4 km; `WAVE_AMP` is 1.47 now (the whitecap
threshold `vH/uAmp` shifts with it). One more sine per vertex in the sway shader.

**The air, a step clearer** (world.js `AIR`): `dens` 0.0030 → 0.0024, `far` 0.0022 → 0.0018. With the fog converging to the sky the
sea's edge can no longer show, so the density is only the visibility; a trade-wind day over a warm sea is clear, and the world is 3.4 km
across. Tried at 0.0022/0.0016 first (frames kept): from 40 m the horizon is still a soft band either way — the far cut at 992–1440 m
is the limit, not the density — so a modest step, the look kept.

**The near slab** (`SURF_MAT`, the back face from air): the crest seen through from a trough is the column's colour now — `fogVeil`
along the eye refracted into the water to the floor or the veil's reach, darkened downward as the fog chunk paints the seabed — not black
plus a constant. Rarely reached: from 0.5 m the dark region across the bottom of the view is the camera *under* the wave (the underside,
the deep's dark veil), which is right.

Also: CLAUDE.md "Look at it" says how the loop was driven with the pane hidden (stub `requestAnimationFrame`, hold the player, call
`loop(last+16.7)`, post the canvas to serve.js); the frames of this version are `test/render/hz_*.png` (before) and `v45b_*.png` (after).
`node build.js --test` green on both tiers. **Unseen, ask in this order:** (1) the sea from the shelf at 5–15 m looking across the
swell, in play — whether the rows read as water or as stripes, and whether `REFL_FACET` (1) wants less; (2) the line from 40 m — still a
soft band at this density; a clearer day (`AIR.dens` 0.0015) sharpens it but changes the look; (3) the sun's side — the glitter is still
five grey bars (WATER.md F not built); (4) dusk and night from above (the reflected sky is the reduced one: no clouds, the deck's mean
shade); (5) the weed forest's frame time (one more sine in the sway fold) and the render ms in air (`skyLite` in every fragment).
