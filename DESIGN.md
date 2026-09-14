# DESIGN — how tethys works, system by system

Reference, not a tutorial: read the section for the system you are about to touch (`grep -n '^## ' DESIGN.md` lists them).
Each section names the owning file and the knobs. The code's own comments explain the mechanism at the line; this file
holds the reasons, the numbers and what the person asked for. History and what has or hasn't been seen: `CHANGELOG.md`.

1. [World shape](#world-shape) — rings, sectors, biome ids, relief, cliffs
2. [Landmarks](#landmarks)
4. [Land](#land) — rim, skerries, island, the strand, the scuttler
5. [The surface](#the-surface) — waves, the mesh and its shader, the camera at the surface
5a. [The sky](#the-sky) — the clock, the sun and the moon, the weather, the dome shader, light by time, rain
6. [The medium](#the-medium) — submersion, gravity, flopping, splashes, land as refuge
7. [Visibility](#visibility) — the fog override, the water map, the dome, the through-water tint
8. [The far layer](#the-far-layer) — far terrain, structures, landmarks, impostors
9. [Flora and materials](#flora-and-materials) — the `FLORA` table, geometry kit, sway
10. [Structures, solids and cliffs](#structures-solids-and-cliffs)
11. [Contact](#contact) — colliders, hitboxes, pads, chains (arms, tails, tentacles), the bend, the snow
12. [The canopy](#the-canopy)
13. [Creatures](#creatures) — roles, predators, LOD, spawning, what was removed
14. [The player](#the-player)
15. [Performance and the quality tier](#performance-and-the-quality-tier)
16. [HUD, readout, compass, text](#hud-readout-compass-text)
17. [Determinism](#determinism)
18. [Hooks for things not built yet](#hooks-for-things-not-built-yet)

## World shape

`world.js`: `sample(x,z) → {h,f}` is the analytic terrain and the **condition fields** at a point, and the single source of
truth. Everything (cell grids, the far terrain, landmark search, structure and flora placement, spawns, the water map) reads
it. `CELL=215, NCELL=16, HALF=1720`. The geology it encodes is PLANET.md's Geology section (the caldera and its rim, the
shield profile, the terraces as rings, the collapse scarp and fan, the dike ridges, the rift arms with the pit crater and the
fissure, the flank cone); its parameters are the constants at the top of world.js (`WIND_A`, `CUR_A`, `RIFT_A`, `COLL`,
`DIKE`, `RIM_R`, `VENT`, `ISLE`, `PIT`, `FLANK_*`). **The lower flank** (v11.28): beyond the apron's toe (`FLANK_R` 1560, wavy) the floor
does not fall into a void but goes on down the seamount's flank — the slope ramps with no crease from the apron's 5.7° to 16.7° over 250 m
(`FLANK_S0`, `FLANK_W`), eases to 12.4° between 600 and 2600 m beyond the toe (`FLANK_S1`, `FLANK_A/B`), ribbed ±15% by sector — −320 at the
square's edge on an axis, ~−580 at a corner, ~−850 where the far layer's apron ends, the plate ~15 km out (PLANET, The shield). The dark
(ground < −450) inside the square is the pit and the corners' last 200 m. **There are no biomes** (since v10): no ids, no names, no sector tables. The fan's hummocks are
rounded mounds — `smooth(0.5, 0.68, fbm)` (v11.19.1; a tent's crease before, which everything settled on it clipped through).

**The fields** (`FI`, nine floats 0..1 in `s.f`): `sub` substrate (0 mud, ⅓ sand, ⅔ rubble, 1 rock), `flow` current (the
flank the current strikes, the shelf break, the rim passes; nothing in the lagoon), `expo` wave exposure (the shore facing the
wind, to −30), `nut` food (upwelling on the struck flank, the shelf break, the vents), `turb` turbidity (stirred sediment,
plankton in fed lit water, a vent's plume), `young` fresh basalt (the fan, the rift flows, the fissure), `heat` (the
fissure), `shel` (the lagoon), `rel` relief (0.5 flat, 1 a crest: the dikes). Steepness goes into `sub` afterwards
(`fixF(f,slope)`: a steep face is bare rock) — the cell from its grid, far.js from two extra samples. Light, temperature,
pressure and oxygen are functions of depth and need no field.

**Envelopes.** `envW(env,h,slope,f)` is a species' tolerance: the product over the envelope's keys (`h`, `slope`, any field)
of a plateau `[lo,hi]` with a soft edge (`[lo,hi,edge]`; default 15% of the range, at most 10 m for `h`). Density = `per` ×
tolerance. Flora entries (`flora.js`) and spawns (`creatures_defs.js` `SPAWN`, a list of `{kind,n,env}`) both use it;
`placeFloraType`, far.js `bigsFor`/`impostorsFor` and `spawnChunkCreatures` (`cellW`: the cell's mean tolerance over a 6×6
grid; `chunkPoint`: weighted rejection) evaluate it. Predators get the envelope of their prey's ground and cover.

**The current** (`chunks.js` `currentAt(x,z,y,out)`, v10.1): the water's velocity from the loaded cell's grid — along the
contour, in the sense `flowYaw` gives the fixed flora (their local +z: fans face across it, the colonies' lines trail along
it), `CUR_MAX` 1.2 m/s at full `flow`, ×0.45 within the bottom 8 m, zero with no cell loaded. Read every frame by the player
(scaled by submersion), by creatures within 200 units (cached 0.4–0.6 s in `c.cur`) and once per frame for the marine snow.
`steadyOf(ch,…)` is the steady part from a given cell: the cell being built gives every sway instance `aCur` (its base's
steady current, world xz) and `aTide` (the tidal stream at full flood), and the sway shader leans it downstream of their sum
— see [The bend](#contact); `currentOf` adds the tidal stream times its rate now (v10.3, [The surface](#the-surface)).
Static instances (rafts, colonies) do not drift yet.

**Cells** (`chunks.js`): height grid `hg` (49×49) and field grid `fg` (49×49×9) per cell; `ch.h`, `ch.slope`, `ch.f`
(nearest vertex), `ch.w(env,x,z)`. `groundAt` reads the grid if loaded, else `sample()`. `chunkGrid` mirrors the `chunks`
map for cheap 3×3 lookups. `genChunk` is a generator run under a per-frame budget in `manageChunks()`. Chunk seams: positions
are computed from integer grid indices so they match exactly. `terrainColor` (by substrate, young rock, lime in clear bright
water, sulfur at the fissure, the shore by height, bare rock on steep ground) is shared with the far terrain; `waterColor`
(world.js: by the floor's depth, toward silt with turbidity, green with plankton, brown in the plume) fills the water map.

## Landmarks

`world.js`: the pit crater and the chimney sit where the geology puts them (rift arm 0: `PIT`, the fissure's middle); the
rest are searched (`findSpot(rng, ok, r0, r1)`: the flattest patch in the band whose sample passes `ok`, seed 4242, fixed
sequence — new ones on the end): the bones, the lantern heart and the great lantern on mud with no heat; the neck
(`LM.neck`, v10.2; the colossal spire's search, so it stands where that stood) on a dike crest: `flora.js neckGeo`, one
kit at 26× — a fat core, a ring of columns, two cap blocks, a talus — ~65 m across, 43 m above its crest, 130 with the
talus; its lumps are the cell's solids through `LMK.neck.matrix`. Meshes are built once at boot (`far.js` `LMK`); a cell registers only the solids, lights and plumes of
the landmarks inside it (`placeLandmarks`). Everything else keeps 110 units clear of `LM.all` (`nearLandmark`). The arches
and the massif are gone (v10).

## Landmarks

`world.js` `findSpot` searches the terrain for a flat patch of a given biome in a radius band; `LM` and `PIT` are set
once at load with seed 4242, in a fixed sequence (pit, arch1, arch2, bones, chimney, spire, heart, lantern — **new ones
go on the end** so earlier positions don't move). `findSpot` takes an optional `minDepth`, used so the great arch lands
on deep ground. Because positions are searched, they survive terrain tweaks.

The set: two arches (the great one in the terraces, breaking the surface; a small one in the spires), a ribcage on the
plain, a 50-unit chimney with a plume, a lantern-heart ring, a colossal spire, the great lantern (`LM.lantern`, one
lantern tree at 11× with its own light), and the pit (in the flats; a ring of boulders; `sample()` drops the floor 520
inside it, so it is biome 11).

Meshes are built once at boot and kept (`far.js` `LMK`, using `gridH` for their ground height so they sit on the fine
mesh to 1e-6); a cell registers only the solids, lights and plumes of the landmarks inside it (`chunks.js`
`placeLandmarks`). Landmarks with `keep` discs (the small arch: its feet, r≈51) push structures and ledges away
(`nearLandmark`); everything else keeps 110 units clear of `LM.all`. The colossal spire became the neck in v10.2 (the
section above); the surface-breaking boulder mountain (see [Hooks](#hooks-for-things-not-built-yet)) would want a site of its own.

## The arches

Both arches are rock piles built the way the crags are, standing on **outcrops** that are part of the terrain. Four
layers, innermost first.

**Site (`world.js` `archSite`).** After every landmark is placed (so nothing moves), the profile is fixed on the *bare*
ground: half-span `R`, the yaw where both feet find the most similar ground, mean foot height `fy`, and a semi-ellipse
(rise `Ha = min(0.72R, 0.8Ht)`) on short piers (`Hp`), stored as `p.site`. Great arch numbers: bare ground −222 at the
centre, `R = clamp(−h·1.8, 240, 420)` = 400 → **800 span**; crown centre line **+44** (`crown` option), lump radius 30
at the crown (`tc`) and 52 at the base (`tb`), so the rock spans the surface at about ±264 (a ~530-wide bridge),
underside ~+12 at the centre, top ~+95 with satellites. The small arch: R 46, rise 1.15, tc 4.6, tb 8, `keepFeet`.

**Outcrops (`world.js` `archOutcrops`, `outcropH`).** One entry per foot in `OUTCROPS`; `sample()` adds a noise-warped
dome of radius `R` (200 for the great arch, 55 for the small) with ridged crags on its flanks (`step:0`; v7.1 quantised
them into 12-unit terrace steps, v7.2 made them ridged after the person saw "scaling" on the steep flank). The mound
height is measured from whatever `sample()` returns *at that moment* — for the great arch, the massif, which is enabled
between the two calls. The mound's top is at `fy + 0.35·Ht` (+ ridge), so the arch's lower third — its piers and the
steep start of the ellipse — is buried and the visible arch emerges from rock. Being terrain, the mounds go into the
height grid, collision and creature ground queries for free.

**The massif (`world.js` `MASSIF`, `massifW`).** The great arch is a formation on one rock, not a bridge between two
mounds — the person: "this whole arch region is supposed to be made of the same material, a large rock that happens to
have a cool formation on top. We need the actual rock." `MASSIF` is a span-aligned ellipse around `LM.arch1` (semi-axes
`R+200`=600 along the span, 300 across, edge warped ±22% by noise); `massifW(x,z)` is its mask (1 inside 0.62 of the
edge, 0 at it). Inside, in `sample()`: every ring step's steepness is lerped to 0.25 (a long slope — this removed the
shelf the person saw at the seaward foot: the 1170 step used to drop 55 in a wall right at the mound's edge; now the
mound and the massif run on down it into the deep), the terraces'/rockfall's/spires' own relief is faded out by
`(1−mw)`, and the massif adds `mw·(58 + 42·rg² + 18·hills + 5·fine)` — the rockfall's recipe, larger (noise scale 0.013
vs 0.016) and lifted, so the rock floor stands ~130 above the sand beyond it. Where `mw>0.5` the biome is **14, "the
arch"**: grey floor `BCOL[14]`, the terraces' water colour, `SPAWN[14]` = lurkers, ridge-backs, the great, jellies, a
pack, and since v9.3 a **paved** structure table: `slab`/`slab2` (sheet rock, 16/14 per cell, no `field` clustering so
the rock is continuous), `cragm`/`cragm2` (the crag kit without clustering, 2/1 per cell, 22–48 / 18–40) plus bigrock 18,
boulder 420, whip 60, vase 16 (sponge 40 until v9.6), fan 30. v7.3–v9.2 had 35 crags and tors a cell here and a heap of round boulders under
the crown — "the most rocky area in the game" — which the person, having seen it, called terrible: what they had meant
was the rockfall's look, the floor covered in sheets of flat rock, "a normal stone environment, smooth". ~3.2% of the
map; 7 cells are dominated by it. The floor under the crown is ~−115 (bare −222), so the opening is ~150 tall instead of ~230. Enabled after
`archSite` fixes the profile on the bare ground, so the arch itself did not move from v7.1 (feet −190/−197 bare, yaw
30°). Knobs: the fade band `0.62` in `massifW`; the lift `58`.

**The pavement (`flora.js`, `site.pave`).** Along the span, between the two summits, ~170 flat slabs (r 12–30, y-stretch
0.34–0.48, wide in xz, lying nearly level) are laid over the floor inside an ellipse ±330 along, ±170 across, each sunk
40% of its thickness and lifted a random quarter-radius so they shingle where they overlap; their tops sit 5–20 above
the ridged massif floor (mean 12), so under the crown (floor ~−115, underside +8) there is **~100 units of open water
over a floor of stone sheets**. This replaced the v7.3–v9.2 heap (460 round boulders r 11–36 settled to a line 46 high;
"terrible"). Knobs: `n`, `r0..r1`, the 0.34 y-stretch, the 0.22 lift.

**Lumps (`flora.js` `archLayout`, `ARCH1`/`ARCH2`).** Dodecahedral lumps along the profile with one to three
satellites each (on the span they sit on top and to the sides, not underneath); piers as stacks; over each outcrop
`0.26·R` boulders (radius `tb·(0.2..0.75)`, bigger toward the pier; since v9.3 flat — y-stretch `0.5+0.35q`, thickest
at the pier so the trunks keep their mass, lying level, sunk 45% of their thickness, and no longer stacked two high);
talus around a foot with no outcrop. Everything whose top ends up below the terrain is dropped. The layout is
world space; `placeLandmarks` bakes into each cell only the lumps whose centres fall in it and registers those as the
cell's solids — the great arch touches 12 cells, ~215 lumps plus ~170 pavement slabs, ~23k tris (60 per faceted lump,
see [Structures](#structures-solids-and-cliffs)). Colour per vertex by height
(`tideTint` in chunks.js): grey below −6, dark wet band through the wave zone, warm dry rock above +5. The great arch
has no `keep` discs at its feet any more — crags and ledges on the outcrops are the point. `archTop(x,z)` keeps surface
rafts off the crown (the person noticed and liked this). No flora or light on the arch itself yet (tussock/scrub on the
dry top is the obvious next touch; not asked).

## Land

`sample()` no longer clamps to −4. Three things break the surface, all analytic with masks so nothing else moved
(verified: every landmark and the pit are at exactly their pre-land positions). Total land is ~0.4% of the map.
Shoreline slopes: median 0.12, p90 0.44 — flat enough to flop across.

1. **The atoll rim** — the reef plateau is lerped up to `2.5±3.5` between rw 125–262, gated by an angular mask
   (`angNoise(aw,2.4,77)`), giving three low sandy islet arcs around the lagoon with passes between; the lagoon and the
   peak are untouched (spawn is still −10 water).
2. **Skerries** — in two clusters of the rockfall (`angNoise(aw,2.5,88)`) the ridge spines get +36 on
   `smooth(0.45,0.85,rg)`, so the sharpest crags stand up to +14 out of the sea (about 1% of the sector).
3. **The island** — `ISLE` at angle 5.15, r 500 in the bladder forest: a reef wall rising to a **tidal flat**
   (`−0.6±2.6`, bars and pools, 40–60 units wide) and a hill to about +42.

Ground above 0.5 is **the strand** (the old biome 13; no id since v10). Colours are done in `terrainColor` (chunks.js) by height:
sand from −4, a dark wet band across the wave zone (−1.6 to 1.2), the dry strand above 1.5, bare rock above 6; the slope→rock
lerp still applies on top. **v11 (PLANET, Geology):** the sand is olivine — green-olive `[0.58,0.62,0.40]`, wet `[0.40,0.44,0.30]`
(basalt sheds green sand; Papakōlea) — and the rock above the spray zone is dark basalt `[0.27,0.26,0.25]` weathered to rust
`[0.44,0.28,0.18]` in patches (iron in a 28% atmosphere; a 20 m noise, 70% at most). The tide's film and bleach on rock are the
band (scene.js), not this. Unseen; the old warm-grey land is `[0.44,0.42,0.36]` with no rust term.

**The tidal forest** (`flora.js` `tidetree`, `tidewoodB`; TAXA, the greens in air; v11, rebuilt v11.15). The 6–9 m tide band is the one place a rigid
trunk reaching for light is the winning form — in air, where drag is the wind's and buoyancy is no help — so the land's
centrepiece is a green that stood up, and it kept the greens' signature, the jointed axis: a ribbed 6 / 9 / 12 m trunk (×0.8–1.3, `jointed`:
`axis` with `rib`, a dark ring at every node) on four to six splayed props (the base is under water twice a day; on sand a holdfast has
nothing to hold), a whorl of six to eight tapering rods with a kink at every node above 3.2 m (the springs reach 4.5), a brush at the
tip (`whorl`); 510 tris a variant. The **reed** (`reedB`) is its dwarf on the sheltered tide band (`expo` ≤ 0.4, `h` −5.5..1.6, 900 a cell,
`air`, `MATGL`): jointed leafless uprights in clumps, under water at high tide. The scrub (`scrubB`, jointed dry whorls) and the tussock
(`tussockB`, small jointed shoots) are the greens on rain above the tide, species with three variants since v11.15, `MATGL`, all tinted
by `pigment(h,'green')` at land light. `env {h:[−3.5,2.8], expo:[0,0.75]}`, `per` 700, `field` 0.02, `maxSlope` 0.5: the leeward
rim and the island's tidal flat (~530 before the field noise; none on the surf side). The trunk and props are capsules
(`col`), the crown is soft. Its material `MATTR` is a slow wind sway from the crown, never capped to the water (`air:true` in
`placeFloraType` lets it stand into the air) and never leaning to the current (`MATTR.land`: `makeInstanced` gives it no `aCur`).
A far impostor (`farTreeGeo`, stride 2) so the wood reads across the lagoon. Looked at in the preview rasterizer only. Land flora (`flora.js`): `tussock` (`minH:1.2`, per 1500), `scrub` (`minH:2`, per 110), `stranded` (`minH:0.4`, per 26 — a dead
sailer's float on the windward strand, `MATVD`), boulders, bigrock, and `crag` structures (on land they are not scaled down to stay under the surface; tors
no longer grow on land — the person wanted none above the water). Surface rafts skip ground
above −4; cliff ledges are allowed above the waterline.

**The scuttler** (`buildScuttler`, `scuttle` in `DEFS`): a trilobite-ish walker, `legs:true, floor:true`, edible (food
10), role graze; flees the player, ridge-backs and arrow squid. Spawned by land area in every cell (`landN`, up to 8)
plus `SPAWN[13]` and a couple per shallows cell. Arrow packs' `prey` includes it. It is the only thing with legs and
the proof that the walking path works (headless, one walked 15 units in 20 s without leaving the ground). It exists so
there is a reason to flop ashore.

Decided without asking (the person said "use your judgement" for the above-water layer; all easy to change): where the
land is; that it is its own biome called "the strand"; ~1.2-unit waves; that a fish on land flops rather than dies;
that land is a refuge from predators; the scuttler.

## The surface

**The tide (`world.js` `tideAt`, `tideRate`, `tideAmp`, `TIDE`, `clockH`; v10.3).** Mean sea level is 0; the water stands `TIDE`
above it now. One large close moon (PLANET, Moon): semidiurnal, period `TIDE_P` = half the lunar day (31.2 h → 15.6 h: two a
day on the 30 h clock, ~1.2 h later each day), amplitude swinging `TIDE_A0` 3.0 (neaps) to `TIDE_A1` 4.5 (springs) over half a
lunar month (`SPRING_D` 13 days) — the 6–9 m range decided. The clock: `clockH = t·CLOCK_RATE` game hours since boot, a day
in forty real minutes (`CLOCK_RATE` = 30/2400), so a tide takes 21 minutes and the water at mid-tide on a spring moves
2.3 cm a second — a rock's wet line walks a metre in under a minute. Boot is mid-flood on a spring (tide 0, rising, 9 m
range in the first cycle). `main.js` sets `clockH`, `TIDE`, `tideU`, `tideRU` and `tintU.x` once a frame before anything reads
the water. Everything that reads the water level reads `waveH` (which is `TIDE` + the waves), so the medium model, the
strand, splashes, the camera's side, the surface crossing and the HUD depth (`TIDE − y`) follow it with no other change;
the surface mesh sits at `TIDE` (`updateSurface`) and the shader adds the waves; rafts and colonies bob on `waveH + uTide`;
the far raft/colony discs are lifted by `cullFar`. Consequences on the map (headless): the rim is land along 40% of its ring
at mean level and 2% at a high spring — it drowns, as PLANET says it does — and 34% of it is a pass more than 4.5 under at
a low spring; the island's dry land goes 2 → 3 → 6 ha from high to low springs. Kelp that reaches the surface is folded
to the water in the sway shader (`cap`, [The bend](#contact)). Not done: the cones and crowns opening on the flood; the
rim stays where it is (raise it 2 m in `sample()` if land should survive high water); day and night on the same clock.

**The tidal stream (`world.js` `tidalAt`, `TIDE_A`, `TIDE_U`, `TIDE_R`).** The ocean's tide moves water past the island as a
rectilinear stream along `TIDE_A` (= `CUR_A`; toward it on the flood, back on the ebb), deflected by the shield as potential
flow round a cylinder of radius `TIDE_R` 900 (the slope: over the shelf and terraces the water is too shallow to go over).
Inside the cylinder the surface flow: tangential, 2·`TIDE_U` (1.0 m/s) on the flanks square to the axis, nothing at the
two points on it — the fed flank and the wake, so the kelp forest and the canopy keep their steady current — and it
splits at the upstream point and rejoins downstream, unlike the steady current (`steadyOf`), which goes one way round
(clockwise: `dx=-gz/gl, dz=gx/gl`). On the collapse side the flood adds to it, on the dikes the ebb does: there the
current runs 1.6 one way at mid-ebb and 0.4 the other at mid-flood on a spring, and turns twice a day. Inside the rim a
through-flow pass to pass at half speed (0.25) blended over the rim's width: the lagoon flushes as a through-flow, not by its
own volume (a 250 m lagoon filling 9 m through its passes would run at centimetres a second — the passes on the axis get
0.13 in and out). `currentOf` = `steadyOf` + `tidalAt`·`tideRate`, both with the bottom boundary layer; the sway shader gets
`aCur` (steady) and `aTide` (full flood) per instance and sums them with `uTideR`.

**The band (`scene.js` `BAND_GLSL`, `addTint(m,key,small,band)`; `MATROCK`, `MATROCKB`, `TERRAIN_MAT` 0.7).** The tide's mark
on rock, by world height in the fragment (the through-water tint's `vWy`): the intertidal, the spring range ±4.5 with soft
edges, is a dark olive film (the mat of what lives between the tides — the cones and crusts sit in it); above it to ~+7 the
spray zone, bleached pale; and 0.2–1.6 above the water *now* (`uTint.x` = `TIDE`) the rock is darker, wet — the line that
walks. Boulders, bigrocks and ledges draw with `MATROCK` (small-thing fog), every structure and the neck with `MATROCKB`,
the terrain at 0.7 (the flats and the passes get the wet mark and less film). Creatures (`MAT`, `MATBIG`) and the sessile
animals (`MATV`) have no band.

**Waves (`world.js` `WAVES`, `waveH`).** Mean sea level is 0; `waveH(x,z)` is the water level at a point *now* (the tide plus the waves). Five
directional components, wavelengths 46/29/15/8.5/6, amplitudes summing to 1.17 (`WAVE_AMP`), deep-water dispersion
`ω=√(gk)` so the swell outruns the chop, crests sharpened by `wsh()` (which also puts the mean level at about −0.3).
The physics, the surface mesh and the rafts' bob all read the same formula: `scene.js` `WAVE_GLSL` is generated from
`WAVES`, so the GLSL cannot drift from the JS (checked numerically to 1e-3).

**The mesh (`atmosphere.js` `sg`, `SURF_MAT`, `surface`).** One `BufferGeometry`, a 192×192 grid (96 on low) mapped by
`x = 1.05·FAR·(0.06u+0.94u³)` (v11.4; 0.12/0.88 before) so it reaches past the far plane with quads ~1.05 units under the
camera and ~50 at the edge; per-vertex `aSpace` holds the local spacing, and each wave fades out in the shader where the grid
can't resolve it — **fully drawn at seven samples a wavelength, gone at three and a third** (`WAVE_GLSL`, `0.14L`→`0.30L`;
until v11.4 it was 3.6→2.0, so every wave was drawn as an aliased sawtooth over a band of distance before it went: invisible
under a noon sun, rows of light-and-dark wedges under a low one), and it **fades to its mean**, `WSH_MEAN` (−0.195) of its
amplitude — the crest sharpening's offset — so the flat far sea sits at the near sea's level. On high: the chop is gone by ~25 m,
the 15 m wave by ~56, the 29 m by ~136, the swell by ~260; the physics keeps all of them everywhere. Follows the camera snapped to the finest
spacing so the tessellation doesn't swim. **Its place in the transparent pass is set by the medium** (`surface.renderOrder` −1 under
water, +1 above; v11.6): three sorts transparent objects by the NDC depth of each object's *origin*, and the surface's origin is the
camera's snapped x,z at `TIDE` — near the line it is within a metre of the camera and hops a grid step at a time, in front of the
camera plane one frame and behind it the next, so the surface swapped places every few frames with the shimmer sprite (blended down
to 26% under the mirror, added on top over it), the jellies and the snow. From below it is the farthest transparent thing on any ray
(drawn first), from above everything transparent is beneath it (drawn last); rain and spray are 2, over it. Material: one flat-shaded `MeshPhongMaterial` (injected via
`onBeforeCompile`), `DoubleSide`, transparent, **depthWrite on since v11.5** (off before: at grazing angles both slopes of
every wave were drawn over each other in index order; now a crest's front slope hides what is behind it). Flat shading gets
the facet normal from screen derivatives, which always faces the viewer. **The topside Fresnel (`cm`) is taken against the mean surface, not the facet**
(`vNup`, up in view space; v11.7): at grazing a facet's small tilt swung `(1−cv)³` from 0.7 to 0.9, and from just above the water the
foreshortened grid read as tennis-court wedges of near-white and blue; the facet still lights the diffuse, the specular and the
refracted glint. **The underside's window (`cv`) stays per facet**: each facet flipping between the bright window and the mirror is
what makes the surface from below read as moving water (v11.7's first cut smoothed it too; the person missed it at once). **The look is chosen by the camera's medium
(`uUnder`)** (v8.3: until then the far slopes — front faces, seen from under water — wore the topside look, sky Fresnel at
96% alpha, which painted the underwater horizon a pale sky-cyan the fog never reached), **with one face test on top
(v11.5): a back face with the camera in air is the water body** — opaque, unlit, `TINT_COL·uWin`, no glints. That is what
a camera in a trough sees through a crest's translucent near face; drawn as the far surface's reflected sky it was a pale
ceiling with a hard edge along the crest line, visible only at eye level (v11–v11.4's "clipping"). Top look (camera above): dark diffuse `0x123a4c` (water is a poor diffuse reflector), fading out as the Fresnel term
`fr=(1−cosθ)³` takes over; the reflected sky `uSkyR` (0.85·horizon + 0.2·zenith, the sky's own colour by the hour) added as
**emissive** — a reflection is not lit by the sun; until v11.3 it was diffuse, and at a low sun the far sea went dark and
glassy and showed the far layer's trench through it — with alpha to 1.0 at grazing (0.96 before); foam (`vH/uAmp > 0.62`) at
crests, Blinn-Phong glints toward the luminary. Underside look (camera
below): the normal is flipped so sunlight reads as coming *through*; **Snell's window** `snell = smoothstep(0.25, 0.65,
|cos|)` between the view ray and the facet normal — inside it (overhead, out to ~15–50° elevation, softened past the
physical 48°) the fixed colour `(0.22,0.46,0.56)`, emissive `(0.16,0.34,0.42)·(0.35+0.65·uDf)` and the refracted glint
`T = refract(-V, -N, 1.33)`, `pow(dot(T,L),40)`, alpha 0.62; outside it the surface is a total-internal-reflection
mirror of the water below: no diffuse, emissive `fogColor·0.9` (the veil at the camera), alpha 0.74. So the underwater
horizon is one colour whether the eye lands on the surface, the far floor or the dome. Knobs: the window band
`0.25/0.65` (raise both to shrink the bright cone; the old look is `snell = 1`), the mirror's `0.9`.

**The camera at the surface (`player.js`).** `player.camAbove` is which side of the water the camera is on. The camera
target is nudged to stay ≥0.5 clear of the wave on its side, and flips only when its natural spot is >0.9 past the
surface on the other side and not within `CAM_DWELL` (0.5 s) of the last flip; swimming right at the surface puts the camera above, looking down at
you through the water. **The camera itself is then held `CAM_CLEAR` (0.35, above the near plane) clear of the wave at its own x,z**
(v11.6): the lerp lags the target and the chop moves under it, so until then the camera sat a few centimetres on the wrong side
for runs of frames. **`updateAtmosphere` takes the medium from `camAbove`** in play (v11.6; until then it compared the camera's
height with `waveH` afresh every frame, with no hysteresis — every frame the chop passed the camera the whole set below
flipped, which was the v11.5 "flicker at the water line"; the raw test remains for the menu and the bestiary). **The crossing (v11.7, `MED_T` 0.25 s, `medK`)**: the *medium* changes in one frame — the camera's side, the surface's look, the fog
(air: `AIR.fog`, 0.0030 — about 85% haze at the far plane so the sea's edge merges into the sky; the veil model with it) and the
domes and the tint from above (`uTint.y`) are the medium and switch with it — and the *light* crossfades over `MED_T`: the hemisphere
(the water's veil pair toward the approved noon pair), the sun (the flickering surface value toward 1.35) and the audio. **The water's own
things — the shimmer, the snow, the player's glow — fade in by `medK` when the camera goes under and are hidden the frame it comes up**
(v11.7.2, `wk`): faded both ways, the shimmer plane (1.5 m over the surface, 90 m wide, additive) sat a metre over a freshly surfaced
camera for a quarter of a second — the sky three times too bright at the flip, dimming: the flash on every breach at night (fifth video). v11.7's first cut also mixed the two fogs and faded the sky over the water's dome: the water's veil
read into the air (its map sampled along rays that point over the void) wrapped the shore in teal on every breach — seen, struck. Boot and a respawn set the medium instantly (`snapMed`). Within a medium fog still drifts as before.

**Sky.** Since v11 the dome is one shader and the sun moves: [The sky](#the-sky). Air fog 0.0030 is a hazy coast; lowering it
for a sharper horizon may expose the sea mesh's far edge; it thickens under rain.

## The sky

**The clock (`world.js`, next to the tide; v11).** Day and night run on `clockH`: `LAT` 0.2 (tropical: a 26–28 °C mixed
layer; no axial tilt is decided, so no seasons — 15 h of day, 15 of night), `SOLAR_H0` 11 (boot is late morning; sunset 11.5 h
= 15 real minutes in), `skyDir(ha)` a body's direction for an hour angle at declination 0 (rises +x east, transits south of the
zenith by LAT, sets −x: the sun comes up over the dikes and goes down over the collapse), `sunHA(h)`, `moonHA(h)` (the moon's
day is `LUNAR_H`), `moonIllum(h)` (1 at boot, 0 at 13 days: the synodic month is 2·`SPRING_D` = 26 days, exactly the tide's).
**The moon is full at boot** — a spring is a full or a new moon, and a full one makes the better first night — with its
upper transit at local midnight (`MOON_T0` 19), so the high water follows the transit by half an hour (a lunitidal interval);
it rises with the sunset. ~3× Earth's tidal force at the Moon's density is 1.44× the Moon's diameter whatever the split
between mass and distance (tidal ∝ M/a³, size ∝ R/a; the 26-day orbit puts it at about the Moon's distance): `MOON_R` 0.37° radius
(v11.17; to v11.16 it was drawn at 0.75°, three times the Moon's, as a look), twice the Moon's light, drawn as the look it was:
`MOONL` 0.28 of noon's light when full and high, ∝ illum^1.8 so a half moon gives a tenth. The star (`STAR`, world.js): a 5300 K
dwarf, R 0.85 R☉, L 0.51 L☉, the orbit at 0.71 AU for Earth's insolation, so the disc is 1.2× the Sun's (`SUN_R` 0.32°); placeholders
with the derivation shown until the planet is placed. Both bodies run at declination 0 (the person, v11.17.1), so every full moon is eclipsed at
midnight — modelled: `UMBRA_R` 0.7°, `discOverlap` the lens fraction, `SKY.eclL` darkens the moon's light ×0.03 and reddens the disc,
`SKY.eclS` (the moon over the sun, the corona, the light to 3%) exists but never falls by day: 26 days × 30 h is exactly 25 lunar days,
so every conjunction is at local midnight. The moon's lit fraction is the geometry, `0.5·(1−sun·moon)`. Checked headless: sunset at h 11.5 with the moon at +3°, moon transit 78.5° at high water.

**The weather (`weatherAt(h)`).** Trade-wind weather over a warm sea, one function of the hour (v11.17 adds `cirrus` 0–1 on its own
slower noise: the outflow of far convection, moving on the upper wind `UPPER_A`/`UPPER_U`, the anti-trades): cover 0.15–0.9 on a slow noise
(features over a few game hours) and showers (`rain` 0..1) from a faster one thresholded at 0.71–0.78 — ~10% of the time, 20–120
game minutes each (30–160 real seconds), the cover lifted 0.5 under one. Seeds chosen so boot is fair (cover 0.44) with the first
shower 3 game hours (4 real minutes) in. The wind: `WIND_A` (the waves' direction) at `WIND_U` 7 m/s, ×1.8 under a shower, in
**real time** — the clouds drift at 7 m/s across the sky like the waves run at real speed, while the weather itself changes on
the game clock.

**The state (`atmosphere.js` `SKY`, `updateSky`).** Once a frame from the clock: the sun, moon and luminary directions, `dayK`
(daylight at the surface as a fraction of noon: `0.28·smooth(−0.12,0.05,s)+0.72·smooth(0,0.4,s)` on `s`=sin altitude — dusk at
~0.22, gone six degrees under), `moonL`, `sunL` (the direct beam: ×(1−0.85·cover^1.5)(1−0.7·rain)), `skyL` (what reaches the
ground: `dayK·(1−0.45·cover−0.35·rain) + (1−dayK)·(moonL·(1−0.7·cover)+STARL)`, STARL 0.035 the moonless floor), the sky's colours
from `SKYC` keyframes on `s` (zenith, horizon = the air fog's colour, the glow round the sun's azimuth, the sunlight; the star is
5300 K so noon is a warm white and the sky a touch less saturated; MOONC blue-grey by moonlight, GREYC by overcast), `tint` (the
light's colour relative to noon, for everything that scales a noon look), `night` (how much the stars show), `bow`, the wind
and its accumulated drift. **The luminary is the one directional light**: the sun by day, the moon by night, whichever gives
more (`sun.position`, `sun.color` set here; `SUN_POS` is only the boot value). It writes `FOG_T` (the sky's light and tint:
scene.js, shared through ShaderLib like the fog's) and `FOG_S` (the veil's glow now points at the luminary; the underwater
shimmer sprite hangs over the surface in the same direction, ≤60 m off — the two agree, as DESIGN Hooks asked). **The shimmer
(`sunMesh`, `SHIM_H` 1.5, `SHIM_A` 1.4; v11.6)** is a 90 m additive plane `SHIM_H` *above* the surface, clear of every crest, drawn
before the surface (renderOrder −2) so the surface blends over it — the glitter is on the water, seen through the window and the
mirror, and no underwater camera can reach its plane. Until v11.6 it hung 1.5 *under* the surface: from depth a glitter patch, but
a camera rising to the surface came up underneath it — a glowing ceiling half a metre overhead across the whole sky, then the near
plane slicing it as a straight edge sweeping down to the horizon, then culled — the band of transition at the water line. The
refracted glint's onset at the critical angle is masked (`smoothstep(0.60,0.72,cv)`, eta 1.25) so it fades in rather than cutting on.

**Light by time.** Above water: hemi = the approved noon pair (`AIR.hemiSky/hemiGround`) × `skyL` × `tint`; sun 1.35 × `lumL`;
fog colour = the horizon colour every frame, density ×(1+1.2·rain), far ×(1+rain). Under water: the fog chunk multiplies the
veil by `uFogT.x` and by `uFogT.yzw` only above −40 (red is gone by −15: a sunset never reaches the shelf); `df` = the depth
daylight × `skyLw`, so the hemi, the surface underside, the snow and the audio lowpass follow; the sun's surface value × `lumLw`
(the sun-by-depth patch still darkens it by the lit point's depth); the from-above tint (`uTint.z`) × the sky's light. **The water's
own sky (v11.23, `K.skyLw`, `K.lumLw`):** the sea is lit by the whole sky's downwelling light, and cloud takes little of that — 12% of it,
a shower 8% more (`skyL` loses 30% and 20%: the air's look) — while the *beam* dies as before (`sunL`: the caustics, the shafts, the
shadows). The key light under water is the beam, or 0.6 × the diffuse light from above when the beam is gone (`lumLw`), its direction
raised toward the zenith as the beam dies (scene.js `updateShadow`, which sets the sun's direction: the refracted sun under water). Before
this a shower under water was darker than a moonlit night, since the sun *is* most of the underwater light and the sky had lost half.
`uFogT.x` is `skyL` in air and `skyLw` under water (updateAtmosphere). The
surface's top face reflects the sky's own colour (`uSkyR` = 0.8·horizon + 0.35·zenith; noon ≈ the old constant), Snell's
window and the emissive scale by `uWin` (tint × skyL), the refracted glint takes the luminary's colour (`uGlint`). The player's
light: the depth term as before plus `0.5·(1−skyL)²` at night — a judgement call, see CHANGELOG v11.

**The dome (`sky`, `SKY_FS`; rewritten v11.17).** One `ShaderMaterial` on the camera-following dome, shown above water, and the
whole sky is in it, in this order. The **gradient** (`smoothstep(−0.04,0.55,up)` horizon→zenith), shaped as a Rayleigh sky is —
brightest toward the sun, darkest 90° from it (`0.92+0.10·cos²`) — with a broad haze **aureole** round the sun (`pow(cs,6)·0.17`,
stronger low) and the glow round a low sun's azimuth (`pow(azimuth·sun,3)·(1−up)⁴`). The **stars** (only when `uNight`>0: from the sun
a degree under the horizon to eight — civil twilight's end; washed by the moon, hidden by cloud): two hashed grids of *3D cells over
the unit sphere* in the sky's frame (`rotAx(d, pole, sunHA)`, the pole `LAT` above the north horizon), 16 and 44 cells to the unit —
each cell one star at a hashed point, drawn by its angular distance, so a star is the same round dot at the pole as at the horizon (the
v11 azimuth/elevation grid squeezed the cells toward the pole and the zenith and drew them as radial dashes: the "stretched" night); a
core and a faint halo on the brightest, a tint by hash (blue, warm, white), a twinkle; a **galaxy** band (`exp(−34·bx²)`, 9° wide)
with brightness along it and a dark lane. The **wanderers** (`PLANETS`, world.js): three steady, untwinkling points on the sun's
track at fixed elongations, out in the twilight before the stars (placeholders until the system is designed). The **moon** (inside
`MOON_R`: the disc's normal `n=e1·q.x+e2·q.y−moon·√(1−|q|²)` lit by `dot(n,sun)` with a soft terminator — the phase is geometry —
plus the planet's blue-grey light on the night side and mare-like patches; by day only the lit part shows, at 0.7) with a haze halo
(`0.22·moonL·exp(−2600(1−cm))`). The **cirrus** (`CIRRUS_H` 9500: the view ray on that plane, in the *upper* wind's frame
(`UPPER_A`, drifting at `UPPER_U` 18 m/s real time), a noise stretched 7000×1600 m so it streaks along the wind, plus a finer noise
across it; thresholded `0.80−0.22·cirrus` over 0.18, alpha ≤ 0.45; its colour `cirrC` from the CPU — white by day, the reddened
sunlight until the sun is 3.1° under the horizon (the depression for 9.5 km: the pink after sunset), then the night sky's grey,
moonlit a little). The **cumulus** deck: `Q.cloud` slices (5 / 2) from the base `CLOUD_H` (650) up through a thickness `T = min(CLOUD_T
900, 800·up)` — capped by the ray's slope so one cloud's slices spread at most 800 m across the deck, under a cloud's width; unbounded,
a low ray's slices were 700 m apart and drew one cloud as a stack of ribbons — each slice the ray projected onto its plane
(`p = cam.xz + d.xz·h/up + drift`, /1250 m; foreshortening to the horizon like a real deck, sliding with the camera), `fbm` 4 octaves
thresholded at `th + 0.30·fz²` over 0.08 with `th = 0.78−0.5·cover` — the threshold rising with height, so a cloud is widest at its
flat base and domed on top where the noise peaks; the slices composite base first, and where the base is thin (an edge, or a cloud
seen low from the side) the lit upper slices show through: the sides and tops of the trade cumulus, from below, without a volume.
Each slice is lit by sampling the field 0.11 noise units toward the luminary (`(n−n2)·7+0.30+0.45·fz`: the lit edge faces the light,
tops lit, bases shaded) **quantised to three flat steps** (a flat-shaded world wants flat clouds), lit colour toward the luminary's by
`clamp(3·lumL,0,0.9)` so sunset edges go amber and overcast goes grey, shade a blue-grey of the sky's, cores darker (`0.45−0.30·fz`
of the way), the whole deck fogged toward the horizon colour by `1−exp(−dist/9000)` (aerial perspective), fading out below 3°.
Under a shower (`rainA`) the base drops to 0.65·`CLOUD_H`, the deck grows to 3× `CLOUD_T` (a congestus) and ragged **scud** (one
extra slice at 0.45·`CLOUD_H`, a finer noise at /380 m drifting faster, thresholded 0.66–0.80 × rain, the shade colour × 0.8) composites
in front. Then the **haze band** (`mistFar`, scene.js `MIST_GLSL`: the marine haze and the spray integrated to infinity along the ray,
`ρ·H·exp(−camH/H)/max(up,0.012)` — the boundary layer seen edge on, the horizon's white band, glowing toward the light by
`uMistC.w·pow(d·lum,6)`; below the horizon the dome is all haze and the sea covers it), the **sun**'s disc over the haze (`SUN_R`,
dimmed and reddened by it: a low sun through haze is still a disc — under the clouds) and the glare (`pow(cs,300)·0.7+pow(cs,10)·0.13`,
reduced by 85% of the cloud in front and 60% of the haze), and the **bow** (42° from the antisolar point, violet in to red out, a 51°
reversed second at 35%; `bow = rain·sunL·smooth(0.66,0.35,alt)`: only a low sun with rain). Knobs: `CLOUD_H`, `CLOUD_T`, the `/1250`
scale, the `0.78−0.5` threshold and the `0.30·fz²` rise, the `800·up` cap, `Q.cloud`, the three steps, `CIRRUS_H`, the cirrus'
7000×1600 and `0.80−0.22`, `SKYC`, `MOONL`, `STARL`, the star grids' 16/44 and thresholds 0.66/0.74.

**The mist above the water (`HAZE`, `VOG`, `MIST_DAWN`, `FUME`, world.js; `updateHaze`, atmosphere.js; `MIST_GLSL`, scene.js; v11.17).** What the climate
gives, not a look (the reasoning is a comment at `HAZE`): no sea fog on a warm sea under trade air — fog needs cold water under warm
air, or cold air over warm water, or land cooling all night, and this planet has none of the three (a fuming vent above water or a
calm would change that; neither is decided). What there is: the marine haze — sea salt in the boundary layer, a layer on the water
`HAZE.dens` 1.7e-4 /m at the level over a scale height `HAZE.h` 70 m (rho·H ≈ 0.012: 69% at the horizon's edge, 12% at 6°, 4% at 17°
on the dome), thicker and taller under a shower (×(1+2.5·rain), ×(1+1.5·rain)); and the surf's **spray**, `HAZE.spray` 0.0025 /m over
`HAZE.sprayH` 4 m × the wave-exposure field at the camera squared (`sample(x,z).f[FI.expo]`, eased over ~1.5 s — the same field that
places the cones and stirs the sand: a shore is a drift, not an event), × the wind under rain. Every material in air integrates both
layers along its ray in closed form (`mistRay`: cut at the water level, so the floor seen through the surface counts only its air), the
dome to infinity (`mistFar`), mixed toward `MIST_C` — the horizon colour lifted 0.3 toward the light's (`tint·skyL`: white by day,
amber at dusk, blue-grey by moonlight, dark on a moonless night) — glowing toward the luminary by `HAZE.glow` 0.8 × the beam's share
of the sky's light (a Mie forward peak: the bright horizon under a low sun, the moon's halo). The old air fog (`AIR.dens`, `AIR.far`:
the two-population radial haze) stands under it: the mist is the *shape* of the horizon, the radial fog the visibility. A third layer (`uMistW.yz`, v11.17.1) carries whichever of two local things is here: the **vog** — the cone's fumarole
(`FUME`: a steam plume of 96 points off the summit, rising, leaning downwind, fading over 70 s; `updateFume`) has its SO2 gone to
sulfate downwind, a Gaussian plume (`VOG`: axis 4e-4, half-width 70 m + 0.16/m, scale height 140, to 2.4 km, pooling in a calm) that also
greys and warms the mist's colour — or the **dawn mist** (`MIST_DAWN`: a clear calm night's evaporation mist on the lagoon, `lag`² at
the camera × cover < 0.45 × wind < 0.5 × the hours round sunrise, 0.02/m over 6 m). **Calms** (`weatherAt().wind`, ~25% of the time)
cut the wind to 0.15 of the trades, the spray to nothing and the chop (`SEA_CHOP`, `uChop`: the waves under L 20) to a quarter; the
swell runs on. Under water none of this applies (`uFogP.w`). Uniforms: `uMist` (dens, 1/h, spray, 1/sprayH), `uMistC` (rgb, glow),
`uMistW` (the water level, the third layer's dens and 1/h), shared through ShaderLib like the fog's.

**Rain (`updateRain`).** `RAIN_N` 420 (180 low) line segments in a 36×24×36 box round the camera, each 60 ms of its own travel
(each drop its own 6.5–10 m/s down + 0.5 of the wind, v11.18), drawn above the water only within a ±`RAIN_R` 14 box, the alpha fading
with distance in the vertex shader (no pop at the edge) and tapering down the streak, 0.6·rain, lit by the sky; on the sea the drops'
rings (`uRain`, v11.18: per 0.8 m cell a splash and a ring growing to 0.34 m over 1.1 s, within ~30 m; the surface matte, specular ×0.4).
The light under a shower: `shade = 1 − 0.30·cover − 0.20·rain` (v11.18; ~0.52 of noon at the worst — it was 0.24, under a moonlit
night) while the direct beam still goes. The ambience opens (the medium's lowpass to 16 kHz, v11.14); the rain in air is a patter over a
hush (`AU.rainAir`, `AU.rainHush`) and from under the water a broad rush at the surface point (`AU.rain`, pink through 900 Hz) — v11.18;
both were highpassed hisses that screeched through the water's lowpass. Under water the light dims a little, the sound changes.

**Cost.** The dome is one draw; the fragment cost is up to twelve 4-octave value noises per sky pixel on desktop (`Q.cloud` 5 slices
× two, the cirrus two; only above water, only above the horizon; slices under the threshold skip their second noise and the march
breaks when the deck is opaque), the moon, the planets and the bow a few pixels, the stars ~10 hashes per pixel at night. The mist
adds two exponentials to every fragment in air. Rain is 420 lines. Unmeasured — the readout's `render` ms surfaced at noon with the
deck overhead, then at sunset, is the number to ask for; `Q.cloud` is the knob (3 halves the march).

## The medium

There is no ceiling. `sub` = the fraction of a body under the local water level
(`clamp((wl−(y−R))/(2R),0,1)`, R = 0.9 for the player, `size*0.4` for creatures). Swim thrust and water drag scale with
`sub`; gravity `GRAV=14` scales with `1−sub`; the air adds almost no drag. So a fish is neutrally buoyant when submerged
(exactly as before there was a surface), pops out and falls back when it swims up through the surface (a sprinting
finback clears it by ~8.5 units; `GRAV` is 9.8 since the planet became 1 g, 14 before), and porpoises if you hold space at the surface. The speed cap applies to the whole
velocity in water but only to the horizontal part in the air (terminal fall 30). `grounded` is set by the floor clamp.

**Ashore.** Out of the water and grounded, a clade without `legs` lies still and **flops** when you push (impulse 4.2
along the input, 4.8 up, every 0.7 s; ~0.98 s in the air at 9.8, ~3 u/s on the flat — it was ~2 at `GRAV` 14). A clade with `legs:true` (none yet — the hook is in
`updatePlayer`) walks at `landSpeed` and jumps with space. Creatures use the same model in `updateCreatures`: their
steering is blended back toward last frame's velocity by `1−sub` (no flying), and a beached swimmer flops downhill
(against the ground gradient) every ~1 s until it is wet again. Predators drop a target that is `grounded && sub<0.5`
(`ashore` in `updateHunter`): **land is a refuge**. `setWander` for swimmers retries up to six times for a target whose
ground is under `−3−size*0.6`, so they don't steer for the beach (two minutes headless near the rim produced no
spontaneous strandings).

**Splashes** (`player.js` `splash`): crossing the surface faster than ~2.5 u/s throws a burst of white points; creatures
within 160 splash too.

## The sound

`AUDIO.md` is the design (9 Sep 2026, the person's defaults); audio.js is the whole of it (v11.14; v11.14.1 darkened every bed after the first listen: "very loud", "hissy and white-noise adjacent" — the sources are pink and brown now, the levels halved, the compressor transparent, and the readout tunes it live: `g-h` the master, `j-k` every bed, `v-b` the water's lowpass, backspace resets). Not music (the person's, later: the
`AU.music` bus joins after the medium filter, uncoloured), not animal voices (a hook: one voice from the same pool). Everything is
procedural — noise buffers (white, brown, Kellet's pink — water's own colour, what most beds run on — and two sparse crackles) and impulse responses made in `initAudio` (on the pick: a gesture is needed), no files. The DSP is the
browser's audio thread; the main thread pushes parameters every `AU_DT` 0.05 s with `setTargetAtTime` (the audio thread smooths them:
no zipper noise, no per-frame writes) and probes the space every `AU_PT` 0.25 s. Every parameter goes through `auP`, which drops a
non-finite value. `updateAudio(dt)` runs last in the frame (main.js), with the camera where it is. Nothing reads a label: place is the
condition fields at the listener, the geometry round it, the depth.

**The graph.** Sources → `dry` → `med` (a lowpass: 2.4 kHz at the surface to 600 Hz at 260 m, × `AU_K.cut`, 16 kHz in air, dipped 55% while hurt) →
`shelf` (a low shelf at 180 Hz: +3 dB with the floor within a metre, +5 while hurt, +2 below the chemocline) → a compressor (−3 dB, 8:1: a guard on
peaks only — the browser's compressor adds makeup gain by its threshold, and −14 dB lifted the whole bed) → `master` (`AU_K.vol` 0.5 · `Q.vol`; `m` mutes). Also from `dry`: the three **early-reflection taps** (dulled at 2.5 kHz, a delay each, a stereo pan
each) and the **reverb send** into two convolvers — the cove (0.7 s, 3 kHz closing to 500) and the cavern (2.4 s, 1.2 kHz to 200, 12 ms
pre-delay), each a unit-energy exponentially decaying stereo noise (`auIR`) — mixed by the space's size. Placed sounds go through a pool
of `AU_VN` 8 **voices** (gain → lowpass → `PannerNode`, HRTF on high `Q.hrtf`, equal-power on low; the panner's own distance model is
off: the curve is ours). An emitter (`auChain`: a looping noise → its filter → an out gain) holds a voice while it is among the eight
loudest at the ear (`e.g` > 0.006) and gives it back when not; a self sound (at the ear, unpanned) is a chain straight into `dry`.

**The listener** is the player's body, oriented as the camera (at the camera, your own body would be seven metres in front of you); in the
menu, the bestiary and the lab it is the camera.

**Distance and absorption**, per voice: gain `a/(1+d/18)` (a `flat` emitter's `a` is already its strength at the ear: the slosh, the
forest), cutoff `c0/(1+(d/60)²)`, silent past `reach` where one is set (the vent, 320 m). **Occlusion** (`auOcc`, each held voice about five
times a second): the line source → listener marched in ≤40 steps; a step under the ground or inside a solid (`auSolid`: the collider
hash, pads excepted; not within 6 m of the source — the vent sits in its own chimney) counts, `occ = 1−0.85ⁿ`; the voice loses up to 80%
of its gain and 7× its cutoff and sends 50% more to the reverb. One-shots (`thump`) go the same way with their own short nodes: delayed by
`d/SND_C` (1480 m/s: a bite 150 m off is 0.1 s late), absorbed, panned (equal-power).

**The space** (`auProbe`, 4 Hz): twelve rays from the listener (`AU_DIRS`: up, down, four level, four level-up 45°, two level-down 30°)
marched `AU_STEP` 3 m to `AU_REACH` 45 m through `groundAt`, the surface (from below, analytic: a mirror) and `auSolid`. From them: `enc`,
the closed fraction (the surface at half weight) → the wet, `enc²` (0.35× in air), split cove/cavern by the mean hit distance (`smooth(6,25)`);
the **taps**: the three nearest walls (not the floor), delay `2d/1480` (3–190 ms), gain `0.55/(1+d/6)` (0.35 for the surface), panned to the
wall's side of the camera — a rock face whispers back from its side, a gully closes in from both; the **floor** (the down ray) → the shelf;
the **lid** (the up ray on the surface, or the canopy mats) → the slosh louder and brighter.

**The sources** (AUDIO.md's table, the numbers as built; every bed × `AU_K.bed`). Self: the *column* (pink through a bandpass at 550 Hz, 0.05 in the shallows, gone by 150 m, a
0.015 floor); the *deep* (brown, 0.06 rising to 0.17 by 220 m); the *pressure* (two sines at 32 and 34.3 Hz, 0.05, below 380 m); the
*current* (pink, `currentAt` at the listener, 0.14 at 1.3 m/s, its cutoff rising with it); the *crackle* (two sparse impulse loops, 3.6 kHz,
left and right, 0.025 · `nut`, shallow, nearly double at night — the one biological bed); the *heat* (a bubbling hiss, 0.05 · `heat`); in
air the *wind* (by `SKY.wind`) and the *rain*. The body: the *flow* past it (pink, 0.16 · s², s the speed over the clade's top speed plus the
yaw rate, cutoff 180 + 1100·s; the finback's beat as a 30% swell on a phase clock of its own, never `t·f`); the *jet* (a burst per squeeze,
`P.jetT` wrapping); the *landing* (`P.landV` from the floor clamp: a click on rock, a thud on sediment, by `FI.sub`); the *knock* and the
*scrape* on rock, the *brush* through weed (physics.js `contactK`: `solidPush` reports whether it pushed against a solid flagged `fl` —
a swaying plant's, from `addFloraSolids` — or a hard one; the player reads it into `hitFl`/`hitRk`). Placed: the *slosh* (the surface point
over the listener, pink at 650 Hz + brown under 160, 0.22 and 0.28 × the wave's rate — `waveH` at the listener differenced tick to tick, so the sound follows
the chop you see — × `1/(1+depth/6)`, ×2.2 under the lid, in air the same source as lapping; the rain's patter through it); the
*breakers* (22 m uphill of the listener at the surface, brown + pink, 0.32 · `expo` · the ground within 28 m of the surface, swelling on the first wave's
half period); the *vent* (at the chimney's mouth: a rumble at 90 Hz and a pink boil at 1.1 kHz wandering 0.4–1, reach 320 m, occluded like
anything); the *forest* (the swaying flora's height summed per cell in a 4×4 grid, `ch.ac`, from `placeFloraType`; within 120 m
weighted `1/(1+d/30)` in 3D; density `√(sum/6000)`; placed at the weighted centre 6 m up; pink at 1.3 kHz, 0.1 · density · (0.2 + 0.8·(current/0.6 +
wave·0.6)): loud in a stream, near silent in slack water); the *passing bodies* (the six nearest creatures from `updateDisturbers.N6`,
each keeping its emitter while it stays near: pink, 0.45 · (size/8)^1.5 · speed/5, cutoff 200 + 1200/(1+size/4)). The old `thump` calls
(bites, hits, flops, splashes) now carry a noise transient over the sine and go through the space; the hit is placed at what hit you.

**Cost.** Main thread: `updateAudio` measured 0.1 ms a frame headless against the stub (test/audio.js; the browser's params are cheaper
than the stub's): the tick's 20 Hz pushes, two occlusion marches a tick, the forest's 144 buckets, and the probe's 180 `groundAt` and hash
reads four times a second. The audio thread: eight HRTF panners and two short convolvers — a few percent of one core, on its own thread,
not measurable from the sandbox. The readout's third line: the three knobs, `voices` held, `enc`, `size`, `floor`, `lid`, `wet`, `occ` (the mean over
held voices), `wave` (the rate, m/s), `cur`, `forest`.

## Visibility

**The fog is not three's** (`scene.js`, the fog block). It replaces the four fog shader chunks for every material,
before anything compiles:

1. **Fog depth is radial distance**, not view-space z. Three's default made the same object 0.6% visible dead ahead and
   16% visible in the corner of the screen at 350 units — the "it vanishes when I look at it" bug. The radial fix alone
   makes the edges of the screen *foggier* than before.
2. **Transmittance is two populations**, `share·exp(−(dens·d)²) + (1−share)·exp(−far·d)` (`SEA_FOG`, `AIR` in
   world.js): the near haze as it always was (share 1 is the pre-v8 fog exactly) plus a slow extinction that leaves a
   ghost of things far off, so the far layer reads as hazy terrain instead of ending at 300 units. Sea (dens 0.0068,
   share 0.88, far 0.0015): 66% contrast at 100 units, 23% at 200, 9% at 300, 6.6% at 400, 4.9% at 600, 3.6% at 800,
   2.7% at 1000, 1.3% at 1500 — the near field is the old game's, the tail is a 12% ghost that is gone by ~1000. v8 was
   share 0.66 / far 0.0019: 70/34/20/16/11/7/5/2 — the 20–34% band from 200 to 400 units is where every pad and stalk
   hung as a black cut-out in the person's first screenshots. **There are two shares** — `share` for *big* things and
   `shareS` for *small* ones, chosen per material: `addTint(m, key, small)` gives a material `FOG_PS` instead of
   `FOG_P`. Big: `TERRAIN_MAT` (near and far terrain), `MATBIG` (structures, landmarks, the far LOD of creatures of size
   ≥ 6 — `spawn` swaps it in), `GLOW`, the surface, the dome. Small: `MAT` (creatures, small flora, boulders, bigrocks),
   the sway materials (kelp, grass, bladders, rafts) and `MATFAR` (impostors — small so the swap with the real kelp at
   the loaded boundary doesn't pop). **They are equal by default** (v8.3): v8.2 shipped 0.82/0.90 as a stand-in for
   angular contrast sensitivity (a huge thing is seen at 5% contrast, a stalk isn't) and the person could see the
   ground and the objects fogging differently; the knob stays for anyone who wants forests to dissolve sooner than the
   floor. **There is one density per medium**; `WATER` is a colour that belongs to the place, not a veil you walk into.
3. **Under water the veil's colour comes from `waterMap`**, a 96×96 world-space RGBA map (`WATER` by floor biome, the
   dark for the void, canopy weight in alpha; ~36 units per texel, box-blurred so borders blend over ~70 units; filled by
   `far.js` `wmFill/wmBlur`, a coarse pass at boot and a refinement per region), sampled at the camera and at a point
   **at most `reach` (260) units along the ray** (or at the fragment if it is nearer): `1−placeMix` (0.6) of the camera's
   sample, `placeMix` (0.4) of the bounded one. **The floor's say in it fades with height** (v11.27): the map's colour is the
   `WATER` table at the *floor's* depth, which painted the void and the pit near-black into every ray that reached them
   (a dark band on the horizon in the void's direction from 260 units off — "the edge of the world"). Each sample is the table
   at the sample point's own depth (`wcol()`, GLSL from `WCOL`; never brighter than the table at `OPEN_D` 150 — the sand's bounce
   is the floor's) blended toward the map's colour by exp(−(height above the floor − `FLOOR_FREE` 30)/`FLOOR_H` 80); the
   floor's depth comes from `floorMap` (scene.js; far.js fills it beside the water map; `wmFloor` for the CPU, which
   `updateAtmosphere` uses for the ambient). Within 30 of the floor nothing changed; over deep water the colour is the water's
   at that depth, whatever lies below. The light scattered into the eye comes from the water within a few
   extinction lengths of it, so this is both the physics and the fix for the horizon: in v8 the fragment's own sample was
   used, and beyond the rim the map is the void's colour, so 30% of near-black was painted into every horizon — the
   "runs into black" the person saw. Then: the canopy's colour (`WATER[12]`, baked into the GLSL) mixed in by the alpha
   for water above −70 and shaded by `1−0.28·cw`; **daylight read at the bounded point** (`dlAt` 1: `0.3+0.7·dl`, `dl`
   linear to `DL_REF` 420 deep with a `DL_MIN` 0.28 floor — one definition since v11.32, `daylightAt(y)` in world.js for the JS
and `DL_GLSL(y)` in scene.js for the four shader sites, both measuring depth from the tide), so the veil is darker looking down
into the deep and lighter looking up;
   **brighter toward the sun**, `1 + sun·dl·max(dot(ray, sunDir), 0)⁶` (`uFogS`, sun 0.8: ×1.6 looking straight at the
   sun, nothing at the horizon); and `bright` (1.0) scales the whole veil. Above water `fogColor` (`AIR.fog`) is used.

`scene.fog.color` (background + hemisphere light) reads the same map on the CPU (`wmSample`) with a 1.5/s lag, so all
three agree; it lerps at 0.25/s, so the ambient light shifts slowly across a border — if that reads as a veil, decouple
hemi from it. **The hemisphere light is the water's:** sky = fog × 1.8, **ground = fog × `ground` (0.8)** — v8's ground
was a fixed near-black (0x101c1c), so everything seen from below (the canopy's pads above all) was black; upwelling light
in water is water-coloured. Pads straight overhead are still silhouettes against the bright surface, which is right.
Under water a black **dome** at 0.95·FAR (`waterDome`, atmosphere.js) is the sky: fogged like everything else (2.5%
black at its distance), it is the veil in every direction — dark toward the deep, sunlit toward the surface — with no
visible edge against the surface (both are the same shader at the same distance). **The veil closes fully between 0.62·FAR and
0.9·FAR** (`FOG_CUT_GLSL`, v11.27, in the fog block, `fogExtinctOnly` and the shafts): the slow population alone left 1.1% at the far
plane, and a percent of a lit terrain colour against the black dome was the far mesh's outline on the horizon; past the cut every
fragment is the veil in that direction exactly. Draw distance **1600** (1000 on low),
camera near 0.2. Depth darkens colour/light with an ambient floor of `df=0.28`.

**The `WATER` table (world.js) is the colour of the lit water column, before depth.** The shelf entries (0–4) are the
approved v5–v7 look. In v8 the slope entries (5–7) and the arch (14 = the terraces') were half the shelf's brightness on
top of the depth darkening, so the massif's shallow water (crown at the surface, floor under it −115) wore the deep's
murk; in v8.2 they are a tint of near-shelf brightness (the arch is the sedge flats' fog at 90%, over grey rock) and depth
does the darkening. The canopy (12) is set so that at full canopy weight, after its 0.28 shade, it matches the v5 canopy
fog. The deep entries (8–11) were dark on purpose; **since v11.28 the table ends at 250 and holds the deep blue below it** — water is not black,
the deep is dark because little light reaches it, and that is the daylight term (`dl`, 0.3+0.7·dl), not the colour. The person: no deliberately
black fog.

**Tuning without a build:** with the readout open (backquote), `1-2` share, `3-4` shareS, `5-6` dens, `7-8` far, `9-0`
bright, `- =` sun, `[ ]` ground, `, .` reach, `; /` placeMix, `o p` dlAt, `t y` the caustics' strength and `u i` the shadows' (v11.13); keys repeat when held; Backspace restores the built-in
numbers; the readout's second line is the current set, made to be pasted back (`FOG_TUNE`, main.js; `applyFog`,
atmosphere.js, writes the uniforms). Shares at 1, sun 0, ground 0.15 is close to the pre-v8 fog. `shareS` only matters when it differs from `share`.

The uniforms (`uFogP`: far, share, placeMix, under-water flag — per material, `FOG_P`/`FOG_PS`; `uFogW`: **the tide**,
bright, dlAt, reach (v11.32: `uFogW.x` held the water map's scale, which is `1/(2*HALF)` and so a constant — it is written into
the shader strings as `WM_SCALE` and the slot carries `TIDE`, which the daylight curve needs and no vector had room for; main.js
writes `FOG_W[0]` with the other clock uniforms, and `fog_pars_vertex` declares `uFogW` too because `SUNK_V` reads it); `uFogS`: sun direction, sun glow; `uFogC`/`uFogR`: the camera's world position and rotation,
written per frame by `updateFogCamera`; `uWaterMap`) reach every material through
`THREE.ShaderLib[*].uniforms` — typed arrays are shared by reference through `cloneUniforms`, and the map returns itself
from `clone()`; `addTint` then replaces `uFogP` on the small materials. **This is pinned to r128 behaviour**; if a
future three is ever dropped in, check `cloneUniforms` first. **Never read three's `cameraPosition` or `viewMatrix` in a
chunk that Lambert, Basic or Points materials include:** r128 uploads `cameraPosition` only for Phong, Standard and
Shader materials, so on the others it is (0,0,0). v8–v8.4 did exactly that, and the world-space veil was right on the
Phong terrain alone while everything else was fogged from the world origin (CHANGELOG, v8.5). `modelMatrix` and
`modelViewMatrix` are safe everywhere. Fallback if the GLSL ever breaks (every material magenta /
scene black): comment the four `C.xxx=` assignments out and the game is back to three's planar fog with the far layer
still working.

**Through-water tint** (`scene.js` `addTint`): injects a `vWy` world-height varying and, before the fog, mixes the
fragment toward `TINT_COL` by `1−exp(−0.05·depth)` × `uTint.y`. `uTint.y` is 1 only when the camera is above water, so
from above the reef reads pale and the shelf reads deep blue through the transparent surface; under water the ordinary
fog does the job and the tint is off. Applied to `MAT`, `MATBIG`, `MATFAR`, `GLOW`, `TERRAIN_MAT` and all sway materials;
not to points, jellies or ink.

**Light by place** (`atmosphere.js` `updateAtmosphere`): after the medium, biome and depth set the hemisphere/sun and
the player glow; the canopy applies a 0.72 light factor. **The sun is lit by the fragment's own depth** (v8.4,
`scene.js`, the sun-by-depth patch next to the fog block): `sun.intensity` is the surface value (1.2 × flicker × canopy)
and three's directional-light call in `lights_lambert_vertex` (Lambert, per vertex, world height from `mvPosition`)
and `lights_fragment_begin` (Phong, per fragment, `vFogPos.y`) is patched to scale `directLight.color` by the same
0.28..1 daylight curve the fog and the ambient use. At the player's own depth nothing changed; a floor 150 under a
player at the surface now gets 64% sun instead of 100%, so its lit faces no longer stand out of the dim veil in front of
them. Point lights (vents, the player's glow) are local and untouched; the hemisphere is still set by the player's depth.
The patch is a regex on the chunk text (`getDirectional…( directionalLight[s][ i ], geometry, directLight );`); if it
doesn't match it warns in the console and the sun is as it was. Hemisphere: sky = veil × 1.8, ground = veil × `ground`
(1.2, the tuner's `[ ]`) — top:side:bottom 1.8:1.5:1.2, a diffuse underwater field with the sun as a 2–3:1 key on top.
At 0.8 the down-tilted faces of the big rocks (the old heap's dodecahedra, r 11–36, faces 20–40 units) came out near black,
and at 23% residual contrast a black polygon 200 units off is still a black polygon: the person read them as ground the
fog didn't touch. Fog does not soften edges; only light can.

**Additive things and fog** (`scene.js` `fogExtinctOnly`): the glow clouds (`placeGlowClouds`, additive points) take
extinction only — mixing an additive colour toward the veil and then adding it leaves a bright smudge at any range (the
cyan speckles on the floor in the v8.3 screenshots). Same transmittance curve, no veil term. Anything else drawn additive
should get the same.

**The goal, in the person's words (Subnautica 2 as the reference):** a huge structure is not seen from very far, but it
is seen from a large distance because it is huge and the daylight carries it — a low-contrast mass in a luminous veil,
clearly occluded, not clearly drawn; probably not at night. Lighting that fits the fidelity of the low-poly world, with
distance and fog working together. What is built toward it: the split shares (big things carry, small things dissolve),
the bounded veil (no foreign colour on the horizon), daylight and sun in the veil. Built v11: day and night (The sky). Not built: a veil that
is a real integral of daylight along the ray (the bounded sample is a one-point stand-in); the `WATER` table for the
deep biomes still mixes tint with darkness.

## The light

Built v11.13 from `POLISH.md` (pass A; the person's answers are recorded there). The rule that shaped it: fill is nearly free here and
vertices are the frame (AUDIT: four times the pixels cost 0.4 ms; hiding the flora took 4 of a 6 ms frame), so the light is done per
fragment in the shaders that already exist, from what every fragment already carries under `USE_FOG` — `vFogPos`, `uFogC`, `uFogS`,
`uFogT`, `uWaterMap`, `vWy`, `uTint.x` — and the flat face normal from screen derivatives. No new pass, no render target, no shadow
map. Everything below is unseen. Knobs live where the numbers are; the two strengths are on the readout's tuner (`t-y` caustics,
`u-i` shadows, `SEA_FOG.cau/shd`, world.js).

**Caustics (`scene.js` `LIGHT_GLSL`, in `addTint` for every tinted material but `GLOW`).** Three sine bands in world xz at 0.42 (cells
of ~3 m), each nested with a second sine so the lines wander, drifting downwind (`WIND_A`) and animated on `uTime`; `k = pow(1 −
|a+b+c|/3, e)` with `e` 4.5 at the surface and 2 at depth, so the web is sharp under the surface and a soft mottle further down. Scaled
by depth `exp(−d/14)` (strong to −10, a ghost by −30, gone by −45; `d` from `uTint.x − vFogPos.y`, so the tide is in it), by an onset
`clamp(0.7d − 0.2)` (nothing at the surface itself — a raft's pad at −0.45 barely; full at 1.7 m), by `max(fn.y, 0)` of the face normal
(a floor takes it fully, a blade side-on hardly, a belly seen from below never), by the beam's share `uSunW.w` and by `1 − 0.85·canopy`
(the water map's alpha). Multiplicative on the lit colour (`× (1 + cau·k·…)`, `cau` 1.3), so the albedo stays and the sun's colour is
already in it. On low, `Q.cau` 1 keeps one band (a ripple, not a web). Cost: fill only, ~30 ops a fragment when the sun is up; the block
is skipped whole at night and under a shower (`uSunW.w` < 0.002).

**The sun under water (`atmosphere.js` `updateSky` → `SUN_W`).** The luminary refracted at the surface, `sin θw = sin θa / 1.33`, so a
setting sun's beam under water is never flatter than 48° from the vertical; `w` = the beam's share of the light,
`clamp(lumL / skyL) · smooth(0.03, 0.3, alt) · clamp(3·lumL)` — nothing under cloud or rain, little from a grazing sun (most of it
reflects), a full moon's share under a clear sky (moonlight caustics are real and the nights are bright), a crescent's not.

**The shadows (v11.23; `scene.js` "Shadows", `updateShadow`, `castOn`, `ghostBody`; `Q.casters` 16 / 6).** One shadow map along the light,
rendered by three's own depth pass (`sun.castShadow`; `renderer.shadowMap.type` Basic — a plain depth, the filtering is ours) and read by hand
in every tinted fragment from the world position (`uShMap`, `uShMat` = `sun.shadow.matrix`, `uShP`, `uShL`); never through three's
`receiveShadow`, which in r128 keys a material's program per object while one material serves the whole scene. The map: 2048² on high,
1024² on low, ×2 with the effects list's "sharp shadows" (`shadowSize`; the map is disposed and remade on a change); an orthographic box
`SHM_R` 64 (40 low) either side of a point 0.45·R ahead of the camera, `SHM_D` 120 deep both ways along the light, its centre snapped to the
map's texels in the box's frame so the shadows don't crawl as the camera moves, its up vector north (the sun's and the moon's tracks lie
east–west over the zenith with declination 0, so three's `lookAt` never degenerates and the box never spins). The light: under water the
refracted sun `uSunW` (sin θw = sin θa / 1.33), in air the true one, blended by the crossing (`medK`), raised toward the zenith under cloud by
`1 − lumL/lumLw` — and this is the Lambert key's direction too, since the light and its shadow are one `DirectionalLight` (`sun.position`
and `sun.target` are set here; `FOG_S`, the veil's glow, keeps the true luminary). Per fragment: the receiver stepped two texels off its
face along the light's side of it (a normal offset; the face normal is the caustics' `fn`), the map coordinate, the edge faded over the
outer 7% of the box, one centre tap for the metres between the caster and the fragment (`dm`, from the depth difference × the box's depth
range), four taps on a rotated square whose radius is 1.5 texels + 5%·dm (the penumbra widening with distance), each a shadow if the
caster is nearer the light, faded by `exp(−dm/35)` under water (scattering) and `/300` in air; a 0.3 m bias (`SHM_BIAS`). Strength
`shd` 0.55 × the beam's share × the sun patch's 0.28..1 depth curve, on the whole lit colour. Casters: every creature's meshes
(`c.shM`, gathered at spawn) when the creature is among the nearest `Q.casters` bodies by `distance − 8·size` within the box's reach
(`updateShadow` flips `castShadow` per creature so the depth pass is a few dozen draws); the player always; the menu's, the bestiary's and
the lab's creature (`castOn`). Nothing else casts into this map (the world has its own, below). In first person the body wears `MATGHOST` (no colour, no depth written) instead of
being hidden — three's depth pass skips a hidden object — so your own shadow is under you. Off: the effects list (`FX.shadows` →
`renderer.shadowMap.enabled` false and `LIGHT_K[1]` 0; no recompiles either way, since `castShadow` never changes).

**The world's shadows (v11.30; `scene.js` "the world's shadows", `updateShadowS`, `depthFor`, `shadowCaster`, `cellInBox`; the effects list's
"world shadows" and "ground shadows", both off by default).** The person asked for shadows from everything else — vines, rocks, coral, the
structures — built for performance first. What does not move should not be redrawn every frame, so it has a second map: `sunS`, a
`DirectionalLight` never added to the scene (it lights nothing; only its `.shadow` is used), the same box geometry as the creatures' map but
`SHS_R` 80 (50 low) either side of the camera itself — not ahead of it, so turning round moves nothing — and the same `SHM_D`. It is rendered
through three's own depth pass, which only runs inside `renderer.render` (r128's `setProgram` reads the render state that `render` sets up;
v11.30 called `shadowMap.render` bare and threw, leaving the map bound as the target — a black screen): a render of the scene through `camS`,
an orthographic camera on layer 1 looking at an empty 2 m box 500 km up, into a 4×4 target, with `shadowMap.enabled` forced on for the call
and put back. That render draws nothing — every static caster carries `shBounds`, its cell's sphere, and `frustumCulled` true, and r128's
`Frustum.intersectsObject` is patched to read `shBounds` (its own test uses the geometry's sphere by `matrixWorld`, meaningless for an
instanced mesh) so camS's empty box culls them all, while the depth pass tests the same sphere against the light's box, a better cull than
a cell's overlap test — and casts everything on layer 1 into the map of `sunS`, which sits in the scene on layer 1 with intensity 0: the
main camera never projects it, so it is neither a light nor a shadow to anything the person looks at, and the pass's render projects the
hemisphere, the player's light and the pool (all on layer 1 too) so three's light-state hash — and every material's program binding — is
the same in both renders. It runs only when: the light has turned `SHS_ANG` 0.005 rad (~0.3°: the sun does that in ~2 s by day, and the tip of a 30 m shadow moves 15 cm,
two texels), the camera has drifted `SHS_MOVE` 20 m from the last centre, a cell inside the box (`cellInBox`, a separating-axis test of the
cell's box on the shadow box's own three axes) has loaded or unloaded (`shadowDirty(ch)`), a switch flipped, or the map is missing; never more
often than `SHS_GAP` 0.25 s. Between refreshes the cost is the fragment's second set of taps and nothing else. A refresh is a spike: an instanced
mesh cannot be drawn by halves, so every cell the box overlaps submits all of its flora into the depth pass — ~4 cells at noon, ~8 at a low sun
when the box is long on the ground; the readout shows the pass's submit time and the count (`wshadow`). Casters: the cells' instanced flora and
rock (`ch.flora`), the structures (`ch.shBig`: the cell's own structures as instanced meshes on layer 1 only, chunks.js `placeBigSolids` — the far
layer's region mesh holds a whole region's structures and is never drawn into the map), the landmarks (`LMK.meshes`), and with "ground shadows"
the cell's terrain mesh (`ch.terrain`: a cliff's shadow on the sand; the terrain's cavity term stays, so a gully in shadow is darker than either
alone). Everything static sits on layer 1 as well as 0; the pass flips `castShadow` on for the casters inside the box, makes their cells
visible for the call (cullChunks hides what is behind the camera, and a kelp behind you casts ahead of you), renders through `camS` (a camera
used for its layer test only, layer 1, so the creatures on layer 0 stay out), and flips everything off again before three's own per-frame pass
runs inside `renderer.render` — which therefore still sees only the creatures. Each caster has a `customDepthMaterial` from `depthFor`: a
`MeshDepthMaterial` (RGBA packing, what `shDepth` unpacks) carrying the species material's own `onBeforeCompile` under a `DEPTH_PASS` define,
so the flora is drawn *at rest*: the variant collapse and the lean to the current kept (the shadow of the plant that is there), the sway, the
bodies' pushes, the wave under a raft and the sessile animals' breathing dropped — a shadow that swayed only at each refresh would jump, and
still is better than jumping. `thinLight` leaves a depth material alone. Front faces are culled as three does for every non-VSM map (the
material's `side` → `shadowSide`): for the terrain that means only the leeward facets steeper than the sun are written, which is exactly the
set that shadows a heightfield, and the lit facets can't acne. The fragment reads both maps (`uShMapS`, `uShMatS`, `uShPS`, `uShLS`; `SH_GLSL`
generates the same block for each) and keeps the darker; the shared `LIGHT_K[1]` is the strength of both. The depth programs (one per species
material, instanced) are compiled at boot behind the fade: `warmShaders` gives its warm-up meshes the depth materials and runs one forced
pass, so the switch does not stall the first time. Off: the map is disposed (16 MB at 2048², 67 MB sharp) and the fragment's branch is skipped
on a uniform. Not casting: the glow clouds, the far cards, the plumes, the creatures' shadows of the world (the creatures' map has no world in
it — a fish under a ledge is still lit by the sun; that would want the world drawn into the per-frame map, the cost this design avoids).

**Light shafts (`atmosphere.js` `shafts`, `updateShafts`, `Q.shafts` 4 / 2).** The person: "as long as it's not forced and is believably
based on appropriate water physics". `SH_K²` tall additive quads (2–4 × up to 30 m) hanging from `SH_TOP` 3 under the surface along the
refracted sun, on a fixed world grid of `SH_S` 7 m cells round a centre 12 m ahead of the camera toward the sun's azimuth: a shaft is a
function of its cell (position, width, phase hashed from the cell), so the set shifts as the camera moves and no shaft ever jumps; the
edge of the patch is faded by distance from the centre. Vertices are written on the CPU each frame (the snow's way, 64 vertices), each
quad turned to face the camera about the vertical. Alpha per shaft: none over water shallower than 4 m under its top, full at 16 (the
bottom stops 1.5 m over `groundAt`, so a shaft never cuts a rock); × `1 − 0.85·canopy`; × a fade within 5 m of the camera (the near
plane never slices one); in the shader a soft width, a profile rising over the top 14% and decaying down the length, a flicker on two
slow sines (the sun through waves), and the fog's extinction only (an additive thing takes no veil). Strength `SH_A` 0.16 × the beam's
share × the sky's light × `wk` (hidden the frame the camera is in air, faded in under it, like the shimmer) × gone for a camera below
~50 m. Colour: the lamp's, `(0.55, 0.72, 0.8) × K.lumC` — white-warm under the sun, amber at dusk, silver-blue under the moon
(v11.31.4; the line that does it had been glued to the end of a comment since the pass, so until then they were the cold literal at
every hour). One draw, `renderOrder` −3. The one cinematic thing in the pass; `SH_A` 0 is off.

**Translucency (`thinLight`).** r128's Lambert lights both faces of a double-sided material in the vertex shader (`vLightFront`,
`vLightBack`) and the fragment picks one by `gl_FrontFacing`; `thinLight(sh, k)` replaces the pick with a `mix` so a share `k` of the
far face's light comes through: the weed, whips, the tussock and the far cards 0.35, bladders 0.3, rafts 0.2, colonies 0.15; the stipe,
the trunks, the sessile animals and rock none. The canopy from below, lit through at a sunset. A regex on the chunk; if it doesn't match
it warns once and the blades stay opaque.

**Occlusion at build.** Terrain (`chunks.js` `buildTerrain`): a vertex lower than the mean of its four neighbours at one grid step
(4.5 m; `sample()` beyond the cell's edge so both sides of a boundary agree, 196 samples a cell inside the yields) and two (clamped to
the grid) is in a gully or at the foot of a wall and darkens by up to 30% (`cav·0.14`); higher — a crest — lightens by up to 12%. The
far terrain has no cavity term (4% contrast at the boundary). The shade under the canopy (`terrainColor`, so the far terrain matches):
the floor darker by `0.22·canopyW` above −70. The foot of a boulder (`MATROCK`, `ROCK_FOOT`): the cell's rock sinks 0.35–0.45 of its
scale (`settleOn`); from that line up over 0.8 of the scale the rock darkens by 35% in the vertex shader — instanced only, the
structures keep their light.

**Small motions.** The sessile animals breathe (`MATV`, `PULSE_GLSL`): a 2.5% radial pulse of everything above 0.25 m local at 0.4–0.6 Hz,
phase from the instance's x,z — tubes, cups, lilies, tulips, chains, burrs, loops; crusts don't reach 0.25 m. The far cards sway
(`MATFAR`, `farMaterial`): 1.2 m at 25 m up on the sway materials' phase, so the hand-off at `FLORA_FAR` is not a forest going still;
the raft discs (y 0) don't move.

**The chemocline (the fog chunk, PLANET's ask).** A thin milky plate at −450: the ray's length inside [−452, −448] in closed form from
the camera's and the fragment's heights, an extinction of 0.25 a metre toward a pale grey (`0.62·skyL·0.5`, mixed 60% over the veil);
below it the veil's colour is warmed and darkened (×(1.12, 0.92, 0.72) by the bounded point's depth): browner, as PLANET says. Seen from
inside the plate the whole horizon is milk. The drain itself is not built.

**Fallbacks.** `LIGHT_FX` false (scene.js) strips caustics and shadows from every material; `SH_A` 0 kills the shafts; `SEA_FOG.cau/shd`
0 at the tuner; the effects list (`effects.js`) switches each system off at run time; `thinLight` and the sun patch warn rather than fail. If every tinted material comes up black or magenta at boot, the
GLSL is the first suspect: `warmShaders` compiles all of it in the first frame.

## The far layer

`far.js`. Three things exist for the whole world at once, built once, and never unload. Draw cost on high: expect
+30–60 draws and +100–200k tris over a near-only world (far terrain ~35k visible, structures ~40k, the surface 74k).
Build cost: `sample()` is ~2 µs warm (35 cold); the whole layer ~200–400 ms of CPU, streamed under 14 ms/frame behind
the menu and `Q.farMs` (3/2) in play, nearest region first — the ring beyond the loaded cells is up within a second of
boot; if the person clicks within the first second the outer ring appears in play over the next few seconds. Far things
get only the sun/hemi (the light pool is assigned by distance), so distant vents don't glow.

- **The apron** (v11.27). The world is a square of ±HALF and the far mesh ended there, with the black dome beyond — a straight
  silhouette 25 m past the player's clamp. A region on the world's edge carries its terrain on: six more columns of vertices beyond
  the edge at `APRON` offsets (60…2000, doubling), a block on a corner, from the same `sample()` (the lower flank, v11.28, going on down to ~−850), in the region's own mesh (`apronGen`), so there is no seam; `reg.ext` widens the sphere and the distance test in `cullFar`.
  The last offset must exceed FAR from the clamp on both tiers.
- **Far terrain.** 16 **regions** of 4×4 cells (`FR`, `regions`, built by `genRegion` under a budget in `manageFar`),
  each one mesh on an 18-unit grid (36 on low) — every 4th vertex of the fine grid from the *same* `sample()` calls, so
  far and near heights are bit-identical where they share a vertex (verified); coloured by the same `terrainColor`.
  Under loaded cells it is pushed 80 down (`farPushVertex/farCellChanged`; a vertex goes under only when *every* cell
  touching it is loaded); on the edge of the loaded block it is held at or below the fine mesh's heights within one
  coarse step (capped at 30) so the coarse edge never stands over the fine one — the far mesh dives under the fine edge
  (a hidden trench) instead of showing a sliver. ~74k tris for the whole world; a region is culled (`cullFar`) by a
  sphere that allows 120 of structure above its highest ground (`+80`, `+120` in `genRegion` — if a crag vanishes at
  the edge of the screen, the sphere is too small). The unload at `LOAD_R+1` swaps fine for coarse at ~645 units.
- **Structures.** Every `big` flora entry (crag, crag2, tor, slab, wall, slab2, olddome) is placed by
  `bigsFor(i,j)` from `sample()` and a per-(cell,type) rng (pure, cached, computed on first request by a region or by a
  cell loading before its region exists; a cell's pass yields every `BIG_YIELD` (16) tries counted over all entries — before v11.31.3
  the count was per entry against 50 and no entry has more than 20 tries, so it had never fired and a cell was always one step, measured
  at 0.27–0.54 ms over all 256 cells, inside `Q.farMs` either way; the rng is seeded by the entry's index among the `big` entries, which is why
  `slab` took `torm`'s old slot and `slab2` went after the megaspire — crags and megaspires stayed put), and drawn as
  **one InstancedMesh per geometry per region** (≤6 per region, 566 structures / 195k tris on high since v9.3's facets
  and slabs; 103k before) — near and far alike; the cell only registers their `lumps` as solids from the same cached
  list (`placeBigSolids`). `CAIRNS` (flora.js) are placed structures in world space appended to their cell's list through
  the same `bigPlace`. Nothing pops when a cell loads; `placeFloraType` returns immediately for `big`.
- **Landmarks** (`LMK`): the ribcage, the neck, the chimney (the arches, the great lantern and
  the heart are built at boot with `gridH` for their ground height and kept; the cell registers solids/lights/plumes.
  The great lantern's and heart's glow meshes are persistent, drawn whenever in frustum.
- **Impostors** (`FAR_IMP`, `impostorsFor`). The flora that exists only in loaded cells (the stipe forest at 900/cell,
  bladders, rafts, colonies) gets a sparse stand-in beyond them — every 5th stipe as a crossed pair of olive cards
  stretched to 1.4 under mean level (under the deepest trough, v11.4) with a canopy pad on top (like the bladder's; the stipe is a `reach` entry since v9.5), every 3rd bladder as a thin crossed
  card the height of the water column with a six-sided pad on top (10 tris), every raft as a flat octagon the size of
  its pads (every 3rd small raft at 1.3× radius; the colonies one for one, in the skin's olive — the canopy's coverage comes
  out the same, ~2× the cell area). Placed by `placeFloraType`'s density rules (biome, field, pocket, canopy, slope, depth) from
  a pure per-cell rng — they match the near flora in density, not one for one — and drawn per region with `MATFAR`
  (Lambert, double-sided, no sway, small-thing fog — the same as the real kelp's, so nothing pops at the swap). A loaded cell's run of instances is written as all-zero matrices (`farApplyCell`;
  draws nothing) and restored on unload. ~3.2k impostors / 20k tris for the whole world; +41 instanced meshes if every
  region were visible. From 540+ units through 12% contrast they should read as texture, not cards; if a crossed pair
  reads as an X, narrow `w` or raise the stride. At the loaded boundary a cell's impostors vanish as its real flora
  appears (both at ~540–645 units) — a swap, not a blend; if it flickers on the unload/reload hysteresis, that's
  `LOAD_R+1` in chunks.js. Raft octagons sit at the raft's `ys` and do not bob (sub-pixel at that distance); `cullFar` lifts them by the tide, and
  drops the stipe and bladder cards (`im.reach`) by `min(TIDE,0)` so their tops and pads never stand in the air at low water (v11.2). The bladder
  card is 1.4 wide — from 800 units a thinner line aliases; widen before removing. Not in the far layer: ledges and
  bigrocks (never needed far), the small floor flora.

## Flora and materials

What may grow where (green only to ~−20, nothing photosynthetic below ~−150, the deep's "plants" are animals) is set
by `PLANET.md`; the descent of the sessile life — three photosynthetic lines by pigment (greens, floaters, reds), the animal
lines' splits, the order they reached the mountain — is `TAXA.md` (v11.15); the six tests, the eight bauplans, the roster by band
and the placement rules are `FLORA.md`. All three outrank this section.

**The grammar (`grow.js`, since v9.5).** Eight bauplan builders push parts into a list: `axis` (a segmented stem;
returns its nodes), `branch` (recursive, `planar` 0 a bush to 1 a fan in the x-y plane, `tip` on the last level),
`blades`/`bladeAt` (strips of quads along an axis, Euler YXZ: droop then spin), `tuft` (planes or rods from a point),
`cup` (a lathe: mouth, waist, base, lip, `closed`, `inner`), `disc` (a plate with polyp studs), `mound` (a squashed
sphere in growth bands, optional spines), `pads` (the rafts' discs, returning their pads) and `line` (a hanging
segmented line of four kinds). The lines' detailing: `polypTip`, `crown` (n two-segment box arms, radial or fanned in
the x-y plane, plus an eye ring of three-sided cones round the rim), `coneShell` (stacked six-sided rings in alternate
shades, comb legs out of the top). `pigment(h, line)` is the green gradient as a function *per line* (v11.15, TAXA: `PIG.green` green to −15, olive by −40
and no further; `PIG.float` olive to −15, gold-brown by −80, never green; `PIG.red` pink to −18, red-purple by −50, dark by −150;
+22% brightness above ~−20, +10% for the reds); `flowYaw(x,z)` is the contour direction from
`sample()`'s gradient (a slow noise angle on flat ground).

**Species (`flora.js`).** `species(id, fields, build)` calls `build(rg,k)` three times (k 0..2, rng seeded by the id) and
**packs the three variants into one geometry** with a per-vertex `vid`; the entry carries `vars[k]` (each variant's own
`col`/`pads`) and `top` (the tallest variant's highest point). The cell gives every instance an `aVar`
(`makeInstanced`, an `InstancedBufferAttribute` like the rafts' `aDip` — every species geometry is cloned per cell and
disposed with it) and the vertex shader collapses the other two variants to the instance origin (`VAR_GLSL`,
`VAR_COLLAPSE`/`VAR_BRANCH` in scene.js: in the sway materials the collapse comes *first*, so a collapsed vertex skips
the disturbance loop — two thirds of the vertices are collapsed and the loop is the cost). One draw call per species;
**the readout's tris figure counts the collapsed triangles too**, so flora shows ~3× its drawn count — the ms is the
number to read. Kept one-variant geometries drawn with a variant-aware material get a zero `vid` (`vid0`: bladder,
whip, tussock). Materials: `MATV` (Lambert, double-sided, the collapse) for rigid variant species; `MATS` (the stipe,
unit height stretched to the surface like the bladder), `MATM` (mid-height weed: ladder, ribbon) join `MATG MATB MATR
MATR2 MATW`; `MATK` is gone with the kelp.

**The table.** Per species: `per` (instances per cell at full tolerance) and `env` (World shape, envelopes; v10 — the per-biome counts are gone), scale range, tilt, sink, `field`, `rim`,
`y: 'floor'|'surface'|'mid'`, `ys`, `reach`, `glow`, `vent`, `maxSlope`, `minH`, `canopyPer`, `pocket`, `big`, and
since v9.5 `photo` (a weed: tinted by `pigment(ground depth, line)` per instance, `line` one of `green|float|red` since v11.15;
the `tints` list then only colours the far impostors), `flow` (yaw from `flowYaw`, ±0.25 rad), `band:[lo,hi]` (ground height the species stands in) and the
surface cap: a floor entry with `top` that would stand into the air is shortened in y to fit under −1.4 or skipped
below half its scale — a plant rooted above the tide line (`minH >= 0`) is exempt, as `air:true` is (v11.31.4: the cap fired on
land too, where the room to the surface is negative, so `tussock`, `scrub` and `stranded` had never been placed anywhere). `placeFloraType` (chunks.js) applies it per cell. Densities are in FLORA.md's roster and the
comment above the table; a pure cell is ~150k tris on the reef top and the shelf forest, ~80–120k elsewhere (headless
count, one variant drawn).

`parts.js` is the geometry kit both flora and creatures use: `G` primitive constructors, `part()` (geometry +
transform + colour + optional belly colour), `merge()` (bakes parts to one flat-shaded vertex-coloured geometry;
countershading by face-normal y), `eyes`, `armRing`/`animArms` (n arms on a ring around +z), `bakeLOD()`.

Materials (`scene.js`; since v11.13 every tinted one but `GLOW` carries the caustics and the bodies' shadows in its fragment — [The light](#the-light)): `MAT` (Lambert, vertex colours) for creatures and rigid one-variant flora (fans, rocks),
`MATBIG` (the same, with the big-thing fog — see Visibility) for structures, landmarks and big creatures' far LOD,
`GLOW` (Basic, vertex colours) for emissive parts, `TERRAIN_MAT` (flat Phong on high, Lambert on low), `MATFAR`
(Lambert, double-sided) for impostors, `MATV` (above), and `swayMaterial(amp,freq,hn,dir,bob,H,strand)` instances
`MATG MATB MATS MATM MATR MATR2 MATW` (short weed, bladders, the stipe, mid weed, rafts, colonies, whips and pens —
displacement in world units scaled per instance so tall and short plants bend alike; the raft ones bob on the wave and
dip under a body; all of them bend away from bodies, see [Contact](#contact)). All of them get `addTint`. Points,
jellies and ink use their own materials.

## Structures, solids and cliffs

**Rock (`flora.js` `rockGeo`, `DODEC`, since v9.3; facet level 2 since v9.6).** Every rock is a dodecahedron because `addRock` makes its exact
twelve-plane collider. The kits draw it in facets: each pentagon split into five triangles from a centre pushed *inward* by
0.4–1 × `ROCK_DENT` (0.035) of the inradius (level 1, 60 tris), and at **level 2** each of those split in four at its edge
midpoints, every midpoint pulled toward the figure's centre by 0.1–0.6 × `ROCK_DENT` (the figure is convex about its
centre, so the drawn rock still lies inside its collision planes — the headless check confirms every vertex is inside; an
edge midpoint drawn in makes a crease along the block's edge), with a shade per face and a shade per facet on it
(`ROCK_JIT` ±7%, a colour attribute `merge()` multiplies in): the coarse planes of a fractured block with fine spall,
240 tris. The person had seen the big single lumps as "only a few faces" (v9.2) and then, with level 1, a big flat slab as
"fewer polygons" beside the boulder-covered ground, preferring the higher-polygon look (v9.5): level 2 is the answer that
keeps the colliders. `Q.rockLvl` (high 2, low 1) is the knob. The kits (crag, tor, slab, bigrock), the massif's crags and
the arches use it; the **ledges** stay at level 1 (up to ~120 a cell on the massif); the small boulders (330–420 a cell)
keep the plain 36-tri figure. The world's ~590 rock structures total ~770k tris (were 197k), about half in view; bigrock is
960 per instance. The facets take their own rng from one draw of the kit's (`rockLump`), so the facet level never moves a
kit's lumps again — the v9.6 kits are laid out a little differently from v9.3–v9.5's, once. The dent is inward so a lump
stays inside its collider (a 30-radius lump's face centres sit at most one unit in — a body hovers by that much at the
middle of a big face, never sinks). What the person found looks good, after a day of playing: rock "completely covering the
ground", "flat and wide as opposed to circular or vertical" (the rockfall); what looks odd: a big single lump.

**Where rock goes (v11.19).** Decided from PLANET's geology before any look, and the envelopes below are this list, nothing else.
Loose rock on a shield volcano has three sources and each puts it somewhere: (1) *a face sheds* — the scarp, the terraces' risers (a
drowned shore platform keeps the boulder beach that lay at its cliff foot), the dikes' flanks, the rim: blocks lie at the foot of the face,
never on it, and where a face fell in whole there is a rockfall cone; the face itself is strata (the ledges) and the ridge or the riser is
the feature. (2) *The slide* — the hummocky fan is shattered blocks, so its hummocks wear piles of alike blocks, and the coherent plates of
the old flank (the toreva blocks) lie in it where it is thick, biggest nearest the scarp; nothing of the slide's lies on the rift arms
(intact flows, `young` 0.7: only their own rubble) or the fissure. (3) *A flow's own carapace* — small rubble on the fan's fresh basalt and
the arms. Nothing else: no heap on a tread, no plate on a riser, no rock for a look. And a rigid thing lies only where the ground can carry
it: `fit` rejects a placement whose footprint the ground leaves (an edge floating) or swallows.

**The rock (v10.5; v11.19).** Four forms, one placement rule, no place-specific rock. Every rock in the world is one of these at some
size (`flora.js`, "the four rock forms"; each kit returns `{geo, lumps, top, foot}` via `kit()`, and `rock(id, kit, o)` makes the entry
with the one basalt palette `ROCKT` and `MATROCK`):

| form | kit | entries | where (by the fields, never a place) |
|---|---|---|---|
| **block** | one dodecahedron (`boulderGeo`, collider `{d:1}`) | `boulder` 330 a cell on the fan and the arms (`young`, `rim` round the pit), `boulder2` 60 on bare rock (`sub` ≥ 0.72, `maxSlope` 1.2), `boulder3` 12 on sand, **`talus`** 420 tries under a face (`face` [14, 6], off the fan and the arms) | the fan's field, a flow's rubble, and talus at the foot of every face: the risers' boulder beaches, the scarp, the dikes, the rim |
| **heap** | fifteen alike blocks piled two courses (`heapGeo`, 3600 tris) | `crag` 8–20 (h −180..−60), `crag2` 6–14 (h −300..−150), on the fan (`young` ≥ 0.8, `heat` ≤ 0.05), `fit` [0.35, 0.5]; `crag3` 4–10 under a face (`face` [16, 8], `sub` ≥ 0.6) | the fan's hummocks; a rockfall cone at a face's foot |
| **sheet** | seven flat lumps, shingled (`sheetGeo`, 5.6 wide) | `slab` 6–14 (h −170..−60), `slab2` 5–12 (h −230..−100), on the fan, `fit` [0.3, 0.55] | the slide's coherent blocks (toreva blocks) lying in the fan where it can carry them |
| **stack** | five stacked (`stackGeo`) | `tor`, `per` 0: the seven cairns on the pit's rim (`CAIRNS`), scaled to fit under the surface, gone under 4× | an oddity, once |
| **ledge** | three flat lumps in a row (`ledgeGeo`) | `ledge`, `per` 0: `placeCliffs` lays them along the contour on steep faces | strata on a cliff |

The blocks are per-cell flora; heaps, sheets and stacks are structures (`big:true`: placed once for the whole world by
`bigsFor`, drawn by the far layer with `MATROCKB`, collision registered by the cell). **The placement rule** (`chunks.js`
`settleOn`, shared by `placeFloraType` and `far.js bigPlace`; the ground read from `sample()` far, and near through `hOut` — the
cell's own grid inside it and `sample()` past its edge, because `ch.h` clamps at the grid edge and a probe that reaches over a cell line
would read the edge vertex again. v11.31.3: before that, every `face`/`fit`/`drop` test saw a plateau in a band as wide as its radius on
every cell line, and talus — the only per-cell entry with one, `face` [14, 6] — lost 2.2% of its tries there, one-sided, because the face
above the point never registered. 8779 → 9013 boulders over 100 cells, and the 14 m band's share of them 23.1% → 24.9% against the 24.4%
of a cell's area it covers): a kit —
anything with `lumps`, the old dome included — reads the ground at eight points on its foot circle (`foot` × scale), lies on the
least-squares plane through them (`lieOn`, Euler YXZ, yaw first) and sinks by `sink` of its size plus half of how far the ground falls
away round it, so it is *in* the slope it sits on; with `fit` [gap, bury] it is not placed at all where the ground falls more than gap ×
scale under that plane or rises more than bury × scale above it (v11.19: a 157 m sheet lay across 60 m hummocks before); with `face`
[R, rise] anything is placed only where the ground within R rises `rise` above the point (talus lies under a face). A single block
(`tilt`) sits any way up, sunk by `sink` and a quarter of the slope. `settleOn` returns false for a rejection and the caller draws
nothing. Structures keep 110 clear of every landmark (`LM.all`; `LM.pit.r` 190) and are scaled to keep `top` 12 under the surface
unless on the strand. The world's rock structures: 160, 401k tris (v11.19; 238 and 262k before, 23 of them on the rift arms by the
`young ≥ 0.45` accident).

What went, and why (8 Sep 2026): the spires and megaspires (needles to the surface — "unbelievable"), then their replacements
the dike walls and the neck ("obsidian shards", then columns of scales — "no more spires, no more weird special spire
replacement rocks, just normal geography based on what's nearby"), the per-cell `bigrock` (a heap at a second scale: now
`crag3`), random tors (the cairns are the tor's only stand), `tilt` on structures, and the placement flags `lie`, `foot`,
`settle`, `radial`, `pre`. The dike crests are bare ridges now: blocks, the odd heap, ledges on the flanks, and the ridge
itself. The far layer's per-type rng runs over the `BIG` list by index, so every structure moved once with this cleanup.

**Nothing grows inside rock (v11.22, `chunks.js genChunk`, `clearOf`).** A cell places its rock first — `placeBigSolids` (its own
structures and the neighbours' that reach into it, by their foot circle; an unloaded neighbour's crag is seen, a loaded one's lump sits in two
hashes near the line, harmlessly), `placeCliffs`, then the `MATROCK` entries — and only then the rest of FLORA, each instance asking the
collision hash before it stands: `clearOf` puts its base as a pad (0.25 + 0.12 × height, 0.3–1.4) and, over 3 m, its middle through
`solidPush(…, ch, noPad)`. Rejected is not moved; it is not placed. Rigid plants earlier in FLORA are solids, so later ones keep out of
them too. There is no coat on rock (v11.20–11.21 tried a built reef and then colonies anchored on the geology's rock; both struck —
CHANGELOG v11.21–11.22, REEF.md). The two extra giant shapes (`olddome2`, `olddome3`, reef.js) remain.

**The reef (v11.20, `reef.js`, `REEF.md`).** The big "coral" things are framework — a landform built by life, alive only on its skin (a single colony
stops near 6–8 m; the tower is 4.5–6 now) — so they are built like the rock: dodecahedral lumps with facets and twelve-plane colliders, in a lime
palette, structures placed by `bigsGen`, set by `settleOn`, drawn by the far layer. Four kits by growth rules (`pinnacleGeo`, mushroom-shaped, with
or without a dead flat cap; `moundGeo`, long and low along the current; `atollGeo`, a plate with a live rim; `ridgeGeo`, a drowned reef along a lip)
and eight entries: `pinnacle`/`pinnacle2`/`pinnacle3` (−8..−32, clear, hard or sand, not young, no heat; the capped one `fill`s to `clear` 5), `atoll`
(−5.5..−11, `fill`), `drowned`/`drowned2` (−54..−165, `drop` [20, 6], `flow`), `coldreef` (−150..−430, flow ≥ 0.42, `flow`), `glassreef` (−200..−440,
mud, `flow`). Every kit has **anchors** (`lumpAnchors`: points and normals at 0.84 of a lump's circumradius on its upper surface, `top` where near
vertical) and every entry an **epi** table `[{id, w, on, p, k, free}]`; the cell coats it (`chunks.js coatStructure` in `placeEpibionts`, after
`placeBigSolids`): a species by weight from the entries the anchor's face allows, its own envelope at the anchor's depth with `sub` forced to 1
(`free` skips it), chance `p`, size `k` × the species' `s`, stood along the normal by `upTo` (a hand-rolled up→normal×yaw quaternion) sunk
0.12 + 0.05 × scale into the facets, never into the air; ordinary per-species instanced meshes and colliders, so the coat is near detail and the
framework never pops. Placer knobs: `clear` (the top's distance under mean level; default 12), `fill` (scale to reach it, capped by `s[1]`), `flow`
(yaw by `flowYaw`, the rng draw kept). `settleOn`: `drop` [R, fall], only where the ground within R falls `fall` below the point. Counts and the
unseen list: CHANGELOG v11.20. `FLORA=1 SCALE=12 DEPTH=-10 node test/preview.js pinnacle` shows a kit coated.

**Solids** (`physics.js` `addSolid/addCapsule/addPad/addLumps/solidPush`; the mechanism is in [Contact](#contact)): colliders
owned by the cell, in a 16-unit xz hash per cell, queried over the 3×3 cells around a point — a structure may reach at most
one cell past its owner (~215 units) or the query won't see it. A structure's `lumps` (local spheres) are transformed by
the instance matrix into the cell; landmarks register solids too (arches, colossal spire, chimney, great lantern); since v9
every rock and rigid plant does as well (`col` on the `FLORA` entry). `solidPush(p,pad,vel,extra,noPad)` runs up to
three passes and is called for the player (before the floor clamp, so the floor wins), the camera target (`noPad`),
creatures within 200 units and every point of every simulated arm; ~0.5 µs per query in a cell with 650 solids.
Lurkers won't be placed inside rock. Registering a solid also grows the cell's culling sphere (in 3D) so a wide structure
isn't culled while still on screen. Massif cells carry ~1000 solids from ledges, slabs, crags, arch and pavement plus a
few hundred boulders (~39 per 16-unit hash bucket, the same as v9.2's crags gave). Sphere junctions may catch.

**Cliffs — ledges** (`chunks.js` `placeCliffs`, `flora.js` `ledgeGeo`): flora is slope-gated in `placeFloraType`
(`maxSlope`, default 0.9; boulders 1.9; structures unlimited) so nothing grows on a face. `placeCliffs` scans the height
grid every other vertex, and where the gradient exceeds 1.15 lays instanced `ledge` rock along the contour (yaw from the
gradient, Euler order YXZ so pitch lifts the downhill lip), sized by the local drop over ±3 grid steps (13 m, read by `hOut`
since v11.31.3 — it was `groundAt`, which answers from a neighbour's grid or from `sample()` by whether that neighbour happens
to be loaded, so 14 of the 41 cells that have ledges laid different ones on different visits; the fix moved the set not at all
and the mean scale from 11.65 to 11.59 over 100 cells), half buried
(median −2, lips to +6, median alignment to the contour 0.24), with solids. That is the whole cliff dressing. Ledge
density on the arch mounds is high (~50–120 per cell) because every riser is steep — if it looks like scales, lower the
`0.42` chance in `placeCliffs` or gate it by `nearLandmark`.

## Contact

`physics.js`, since v9 — what the person asked for as "proper collisions with all objects, everything moves when
interacted with, tentacles that wrap around prey physically, hitboxes based on actual contact, and landing on a lily pad".
Five pieces.

**Colliders.** Five kinds in the cell hash: spheres (cups, burrs, tulips, scrub), capsules
(towers, chimneys, the lantern trunk — `col` on the `FLORA` entry, local units, through the instance matrix:
capsule radii scale with the xz scale, spheres with the mean), ellipsoids (fans: the unit sphere through an affine map),
**rocks** — every dodecahedron in the game: boulders, bigrocks, and every lump of every crag, tor, ledge and both arches,
as *the dodecahedron's own twelve faces* through the lump's full affine world transform (`rockLump` keeps each lump's
circumradius, stretch and tilt; `addLumps` composes it with the instance matrix; `addRock` turns the twelve unit normals
`DN` into world planes through the inverse transpose, offset by the inradius 0.7947; a body of radius `pad` inside all
twelve planes leaves along the least-penetrated one, its velocity clipped against that normal — exact for a convex solid,
and every rock here is one) — and **pads** (every pad of every raft: a horizontal disc of half-thickness `h` that rides
`waveH` at the raft's origin and dips by its raft's `aDip`). History, because the person hit each stage: v9 gave rocks
spheres of their *shortest* axis (as the crags always had) — a stretched lump was open along 46% of its long side;
v9.1's ellipsoids closed that but a dodecahedron's vertices stand 26% past its inradius, so "half my fishy body" fitted
into a corner; v9.2's planes are the rock. Tested against the solid's own vertices (every world plane passes through five
of them) and 1000 interior points. **A body is a capsule** (`bodyPush`): the centre with its radius, then the nose and the
tail (`len` along the facing, radius `rn`) pushed out and carrying the body — the player at `0.7·size`/0.9/0.5, a
creature at `0.75·size`/`0.35·size`/`0.28·size` — so a finback can't park its snout in a rock either. Decided without
asking: **flora is either rigid or soft.** Rigid blocks; soft (kelp, grass, tussock, bladders, raft tendrils, whips)
never blocks — it bends out of your way (the bend, below). Fans ("the little triangles in the shallows") were soft in v9
and read as nothing; they are rigid and solid now. Kelp stalks are soft on purpose: bumping into 1400 stipes a cell on the
floor would be a wall; if a rigid kelp base is wanted, a `col` capsule on the `kelp` entry does it.

**Pads.** A body whose centre is above a pad's centre and whose underside is no more than `2h+0.5r` below the top is set
down on it (`lastPad`), also from up to 0.45 above (so it sticks to a pad rising on the swell); a body deeper than that at
the rim is pushed out sideways (the rim is a wall — you get onto a pad from above, by porpoising or flopping, not by
swimming into it); a body whose centre is under the pad is kept under it. On a pad the player is `grounded` and dry, so
the strand rules apply: it lies there and flops when pushed, and a flop off the edge is a splash. Creatures too (a fish
that jumps onto a raft flops until it is off). Each raft instance dips under load — spring 60, damping 7, target
`0.6/r` for the player (a 1.5-unit pad sinks 0.4, a 30-unit raft3 pad 0.03) — through a per-cell clone of the raft
geometry with an instanced `aDip` attribute the bob shader subtracts. The camera ignores pads.

**Hitboxes.** Every builder returns `hit`: capsules in the creature's own frame (the mantle, the shell, the tail, the
bell). Each frame the creatures within 90 of the player and the player get them in world space (`worldShapes`), plus
`chainW`, the live segments of their arms. `resolveBodies` pushes touching bodies apart along the closest points of
their capsules (Ericson's segment–segment), the lighter one moving more (mass = size³, the player's clade `mass`, a
sitting lurker 10⁶ — it is wedged in its rock), and kills the closing velocity. The player is then kept out of every arm
and tail segment near it (`sphereOutOf`, one-way: the arms are simulated against the player's body from their side, so
the two meet in the middle). The old `collide()` — a sphere of `size*0.42+1` — is gone, and with it the rule that
`reach` must exceed it: a bite lands when `reach` is more than the two bodies' contact distance. **v11.31.1:** it almost never was.
Measured off the same `hit` capsules (`bodyExt`: `hitN`, how far the shape reaches forward of the origin; `hitB`, how far it reaches
in any direction), 45 of the 58 predator/prey pairs in DEFS had a `reach` under `hitN(biter) + hitB(prey)` — basker 4.6 against 8.1
to the player, abyssal 10 against 14, crusher 4.2 against 7.6, arrow 0.9 against 1.3 of a darter. With `resolveBodies` holding the
capsules apart, those hunters could not bite what was directly ahead: a basker on a grazer had to blow past and take it alongside its
mid-body (the first bite landed at a centre gap of 4.4, not the 8.6 its jaws are at), and off screen, where no bodies push apart, the
same bite landed at once. The DEFS numbers stay what they are — an animal's own reach — and the bite test now asks for
`reachOf(c,tg) = max(reach, hitN + hitB + BITE_M)`, `BITE_M` 0.3 m, at every site that measured against `reach`: the chase bite, the
strike's bite and its trigger range, the trap's strike, the lurker's lunge, the coil's ram, the drifters' sting, feeding at a carcass,
and the player's own grab and bite target (`playerTarget`). The arms' reach is `armReach` (`max(reach·k, reachOf) + prey·0.5`), never
narrower than it was.

**Chains** (`makeChain/simChain`, the rigs `makeRig/rigSkin/stepRigs`; `parts.js` `armRing/ringPose/tailPose`). Every
arm ring (soft-arm, coilshell, the great, ortho, arrow, the veil's skirt), the lurker's eight floor-arms, the eel's whole
body and the jelly's tentacles are chains of `n` segments from a root welded to the creature. Each frame the creature's
`anim` writes the *rest* points (the old swim pose: `ringPose` is `animArms` as points, `tailPose` the eel's nested
yaws) and `stepRigs` runs position-based dynamics: a spring to the rest (`ks`, 50 for arms, 130 for the eel, 14 for the
jelly), drag measured against the rest's own motion (so a steady swim carries the arms with it and only turns, lunges and
contact make them lag — the arms of a squid swimming arms-first do not stream backwards), the segment lengths kept from
the root outward (two passes), a joint limit (`cosMax`, 0.55) so nothing folds on itself — **a ramp since v10.8** (`JOINT_SOFT`
0.2 in cos: the point is eased toward the straight continuation from 41°, half-way a pass at 57°; the hard threshold snapped an
arm past it and flung the coil's short arms on every deceleration, since an arm leads a slowing body by `a/ks`) — then contact:
the ground, the solids (`solidPush` per point) and the body shapes it was given (its own at 85%, the player's, its prey's, its
neighbours'), then the lengths once more and the bodies once more so the last word is the contact's. **Own body, since v10.8:**
the first free point never collides with its own body (it sits where the arm leaves the hull, which the capsule overshoots), and
any other point may sit as deep as its rest point does and no deeper — the coil's, the great's and the watcher's roots sat inside
their capsules and shivered (pushed out, pulled back, every frame). **Grab:** a hunter with a rig in
chase and within `armReach` (`reach*1.3 + prey*0.5`, floored by the two bodies' contact since v11.31.1; the lurker in its lunge at 1.6,
the player on a bite, and since v11.31 any arms with a hold —
[Combat](#combat)) has `grab` set; the tips are
drawn toward the prey's centre (8/s, scaled along the arm) with the rest spring at 30%, and the contact with the prey's
capsules is what makes them wrap — a hand closing on a ball. `holding` counts the touching points; a player brushed by
something's arms swims at 80% (`heldT`); held, at the grip's `slow`. One mesh per rig, skinned on the CPU (each vertex keeps its segment and offset; the
segment's frame is its direction, the arm's rest radial as roll reference, parallel-projected) in the creature's frame,
so the arm mesh stays a child of the group and the far-LOD bake, LOD switching and disposal see nothing new. Draw calls
went *down*: eight arm meshes became one. Chains not simulated for 0.25 s (far LOD) or whose root jumped more than 8
units (respawn) snap to the rest pose. Cost headless: ~35 µs a frame for an ortho's eight four-segment arms, ~20 for the
skin, ~20 for its shapes; the readout's `phys` figure is the whole of it plus contact, pads, disturbance and snow.
Buffers are sized for chains of ≤39 points and rigs of ≤160 segments (the veil is 66).

**The bend** (`scene.js` `swayMaterial`, `physics.js` `updateDisturbers`). Every sway material takes twelve disturbers
(`uDistA`: xyz and contact radius; `uDistB`: tail xyz and amplitude; `uDistU`: velocity and flow radius): the player as
a capsule *along its body*, nose to tail (`0.8·size` each way along the facing; v9.1's capsule trailed the velocity, so
plants dodged the tail and not the head), contact radius `1.5+0.4·size`, flow radius `0.9+0.35·size`; a **trail** of up
to six samples dropped every 1.3 units of travel and kept 1.7 s (contact only); and the six creatures nearest the camera
within 70, nose to tail likewise. **A stalk is pushed where the body is, and everything above the push goes with it:**
for each disturber the stalk is read at the body centre's height along it (`pd`, clamped to the plant's height `H·sy`),
the push found there, and applied to the vertex scaled by `min(h/hd, 1)` — full from the contact height up, tapering to
nothing at the root. A fish at the base of a kelp stalk shoves the whole stalk aside from its knee up; a fish that only
brushes past sways it. v9.1 read each vertex at its own height and ramped by height alone (`hb`): the base never moved
and the top only shifted when the body was up there — the person: "the vines don't move at all at the bottom". `strand`
(rafts: a cluster of separate tendrils under one pad) reads each tendril on the vertical through its own vertex instead
of the instance's axis. Two terms. *Contact:* `pd` is pushed out of the capsule by the depth it is inside, times the
amplitude; the trail's amplitude is an impulse response `e^{−2.2τ}cos(4.5τ)` (1 where the player is, zero at 0.35 s,
−0.2 at 0.7 s, gone by 1.7), so a stalk you pass bends round you, recoils past straight behind you and settles. *Flow:*
the water the body pushes — potential flow round a sphere of radius `a` moving at `U`, the same formula the snow follows
(below) — times `KFLOW` 0.45 units per unit of speed, dead by four radii: a plant bends before you reach it, is swept
aside as you pass at 2–3 units, and eases back as the flow fades. The sum is capped at 2.6 and rotated into the
instance's frame. What this still is not: the person's "we might just need a better physics system eventually to get
that right" is fair — it is a bend without inertia or a real spring (only the trail remembers), applied in the vertex
shader; a CPU chain per plant (the arms' system) is the next step if it is ever wanted, at ~1400 stalks a cell it would
have to be for the nearest few dozen only. **The current** (v10.2): every sway instance carries `aCur`, the water's
velocity at its base (`chunks.js makeInstanced` reads `currentOf` for any material with `m.sway`; a fresh geometry clone per
cell, like `aVar`), and the shader adds a static lean downstream: `LEAN` (3.0) × the material's sway amplitude × `k` (the
sway's ~h² profile) × current/`CUR_MAX`, capped at 0.85 of the vertex's height, with the tip dropped by `d²/2h` so the
stalk doesn't stretch; the oscillation amplitude halves at full current (a stalk in a current streams and flutters; the
back-and-forth is surge). Since v10.3 the current it leans to is `aCur + aTide·uTideR` (the tidal stream, [The
surface](#the-surface)), and every upright water material (`cap`: MATG, MATB, MATS, MATM, MATW; the tussock's MATGL is
exempt) folds any vertex above `uTide − 0.45` down to it, keeping 4% of the excess so the folded canopy doesn't z-fight:
a stipe built to the mean surface lies on the water at a low spring instead of standing 4 m into the air. At the fed flank's 0.5 m/s: a 40 m stipe's top leans ~4 m, turf ~0.45 m, a 10 m ladder ~1.5 m; in a
pass at 1.2 m/s, 7.7 / 1.05 / 3.3 m. v10.1 swayed about the vertical: "the plants seem to ignore the current" (the person). The uniform arrays go through `flatten()` in r128, which returns a typed array
as is only if its first element compares as a number — a NaN there would crash the upload, so nothing writes NaN into
them.

**The snow** (`atmosphere.js` `updatePlankton`, `snowW`, `snowSeed`, `SN_K`; `physics.js` `flowAt/FLOW`). Since v11.24 the snow is what
the column holds where the camera is, not one even cloud. Five kinds, each with a source, a sink and a size, and every point one of
them or *parked* (at the camera, clipped) where the water is sparse — so `Q.snow` points (1800 / 1000) are spent where the snow is:

| kind | what | where (the weight, `snowW`) | size | settles |
|---|---|---|---|---|
| live | the lit layer's own life and its finest debris, greenish-pale | `(0.35+0.65·nut)·(0.7·e^{−d/40} + 0.75·gauss((y+62)/9))` — the top and a chlorophyll maximum on the thermocline | 0.5 | 0.5 cm/s |
| floc | the aggregates: dead cells, mucus, pellets, grey-white to brown with depth, rust in the 25 m over the chemocline, milky in the plate | `(0.4+0.6·nut)(1+1.2·canopy)·[form·Martin + 0.9·gauss((y+64)/6) + 1.6·gauss((y+450)/7)]·0.9`, form = smooth(4,45,d), Martin = (max(d,90)/90)^−0.86; gone below −465 | 1.0 | 2 cm/s (×0.6–1.4 by size) |
| silt | the bed lifted, the colour of the bed (olivine sand, grey-brown mud, dark at a vent) | `(1−sub)·[expo·(0.35+0.65·chop)·(0.3+0.7·e^{−hf/12}) + (0.15+0.85·flow)·(1.2·e^{−hf/6}+0.4·e^{−hf/30}) + 0.4·shel·e^{−hf/10}]·(1+0.5·heat)` — the surf's column, the nepheloid layer over any mud, the lagoon's fines | 0.6 | 5 cm/s |
| bubble | breakers and whitecaps, rain on the surface; white | `max(expo·(0.3+0.7·chop), 0.25·smooth(0.45,1,chop))·e^{−d/2.2} + 0.35·rain·e^{−d/1.2}` | 0.55 | rises 28 cm/s |
| black | iron sulfide flakes under the chemocline (the water is ferrous and sulfidic); the plume's sulfide grains at a vent, 30% white | `0.45·smooth(−448,−464,y) + 1.3·heat·e^{−hf/70}` | 1.35 | 0.6 cm/s |

**The particles are square, on purpose** (the person, 13 Sep 2026): an untextured `PointsMaterial` writes the whole quad, and
rounding them would cost *more* — a texture fetch per fragment for a sprite, or a distance test and a `discard`. They read as blocky
at 0.07–0.19 m (`pm.size` 0.14 × `SN_K[i].sz`) and that suits the flat-shaded art. Not a performance question either way.

`d` is depth under the tide, `hf` height over the floor, the fields the point's own (cached: `pf`, `ph`). A point re-rolls when it wraps
the 60 m box and at its refresh (one in 64 a frame, `SN_REF`): the fields, the floor and the canopy re-read where it is, the kind
re-drawn from the weights there — kept (velocity, look, no pop) if it draws the same kind — or parked with probability `1 − W/SN_W0`
(0.9), so the live share of the count tracks the water's density: ~100% in the thermocline's layer (W 2.5), 77% in the plate, 20–30% in
the mid-deep, 50% under the chemocline (fewer, bigger, black). Alpha is `min(1, w·SN_GAIN)` (3.0), set at the refresh (it moves as slowly
as the point sinks), zeroed between refreshes if the point leaves the water or enters the floor. A camera jump of more than 30 m reseeds
the whole cloud at once. The column, per frame: settling slowed 75% at the thermocline (−64, ±5) and 80% at the chemocline (±6) — the
density steps hold particles up, which is why thin layers exist — and lifted at 0.12·heat·e^{−hf/45} by a vent field's convection;
turbulence `0.22·smooth(75,25,d)·(0.35+0.65·wind) + 0.15·flow·e^{−hf/5} + 0.2·heat·e^{−hf/40}` as an eddy per point (two trig, none
in still water); the two longest waves' orbital velocity (`A·ω·e^{−kd}`, u along the wave in phase with the crest, w a quarter behind:
the snow circles under a passing swell, and its Stokes drift downwind falls out of the integration) in the top 15 m; the current at
the camera; and the flow round bodies as before: each point carries a velocity that relaxes (8/s) to the flow of the nearest bodies
and decays (2.5/s) after they have gone — potential flow round a moving sphere, `a³/(2r³)·(3(U·r̂)r̂ − U)`, pushed aside ahead, drawn
in behind, dead by four radii, plus a skin layer dragged along at `0.6·U·e^{−(r−a)/0.35a}`, the wake. Bodies: the player
(`a = 0.9+0.35·size`) and up to five moving creatures within 40 of the camera (`a = 0.45·size+0.3`). Points inside a body are pushed out.
Fall rates are ~10× reality (real aggregates: 50–200 m a day, motionless to a swimmer; the old 8 cm/s was 7 km a day and read as a
snowfall); the point is that the deep's flakes visibly fall slower than the shallows' silt.
Drawn as one `Points` with a per-point colour (the particle's own), size and alpha (`aSz`), patched into r128's points chunks by
`onBeforeCompile` (five replacements; a miss warns and the snow draws uniform); the material colour is the light on it (blue-green
and dim with depth and the night, `updateAtmosphere`) and the player's light is added per point by distance (`uPL`, `I·1.6/(0.5+d²)`),
so in the dark the snow shows only in the torch's reach. Points fade within 2 m of the camera and cap at 24 px. Headless cost 0.33 ms
a frame moving through the shelf forest in the sandbox against 0.17 for the old cloud (1800 points against 1400; the refresh and the
swell's trig are the rest); `test/snow.js` prints the kinds' mix at twelve sites down the column and checks the layering.
Known: the chimney landmark sits at raw angle 2.60 and the `heat` field (the warped angle) at 2.66–2.7, so the chimney's own water has
no heat and no vent snow — the fissure field 60 m east of it does. Open, the person's: the fall-rate compromise; the black flakes
(invisible outside the torch by design — reality — or a faint ambient?); whether the snow should be lit by the moon's window at night.

## Combat

`combat.js`, v11.31 — the person's ask: the physical mechanics must be the combat mechanics; look at how real animals hunt; grabbing as
the core; the player grabs and bites as separate actions; blood; a realistic outcome, losing included. Before this a bite was a number
subtracted when two centres came within `reach` — the bodies had shapes and contact and the fight ignored them.

**What is real.** Aquatic predators do one of two things: swallow whole (gape-limited: most fish, a suction feeder) or take hold and
dismember (a cephalopod pulls prey to the beak; morays, crocodiles and orcas hold and shake; a mantis shrimp strikes then holds;
Anomalocaris's appendages fed a plate mouth). Bite-and-release is the exception (white sharks on seals: one bite, let it bleed, come
back — avoiding a struggle with something that can hurt you), and it is a mass-ratio strategy. So:

**A fight is a hold.** Every compiled body has a **grip** (`compile` derives it from the parts: `b.grip = {kind, at}`): slowbloods `jaw`
at the mouth ring; ringmouths `arms` at the beak (the arms close on it — the chain grab that already existed, `c.grab`); hingeshells
`claws` at the weapon (claws, spears, fold, whips; half its reach forward) or the plate mouth as a clamp if none. A rasp, a slit, a peck,
or no mouth: no grip (the drifters sting as before; the picker pecks carrion). A hunter that reaches its prey (`landBite` → `combatBite`)
no longer deals damage: **forage (hp ≤ 1) dies at the touch as before; anything that can fight is taken hold of.** The hold is a rope
between the grip's world point and a point on the held body's own hit capsule (the nearest axis point at the grab, kept in the held's
frame — **v11.31.1:** `freshShapes` rebuilds both bodies' capsules first if they are not this frame's, since `worldShapes` runs only
within 90 m of the player and a hold taken further off anchored the rope where that body last was, tens of metres from it), solved
every frame after `resolveBodies`, mass-weighted (a sitting lurker at 10⁶ pins you; a grazer drags the player): the
separating velocity along the rope is removed, the two velocities are pulled together at `HOLD_DRAG` 3/s, and the rope shortens at
`close` m/s until the bodies touch — then it is as long as the contact leaves it (`cWith`, set in `resolveBodies`), so the rope and the
push-apart never fight. A holder's speed is capped at 0.35 of its cruise while the hold stands (its AI still asks for the prey it has;
without the cap it ploughed off at full speed with the prey pushed ahead of it).

**The struggle.** The held one's steering is untouched — the grazer keeps fleeing, the player keeps swimming — and the velocity the rope
strips off it each frame is a force on the grip (`F = m_held·Δv/dt`, filtered at 5/s; **v11.31.1:** `updateHolds` returns on a frame of
no time — two rAF in the same millisecond divided by zero, and one NaN in `load` was a NaN rope for good; the guard `simChain` already had). A grip's strength is `GRIP.k · m_holder^(2/3)`
(muscle scales with cross-section; the player's clade multiplies it: `PLAYER_GRIP` soft 1.2, fin 1.0, coil 0.6). `pull` grows at
`load/str − 0.5` per second and the hold breaks past 1: a struggle at half the grip's strength never breaks it, at the strength in two
seconds, at twice it in under one. A bite on what holds you adds 0.35. A hold also ends when the holder's AI drops its target (the ink,
the stun, boredom at a withdrawn shell, a lost chase — **the AI still decides whom it wants; this decides what having it means**), when
either dies, or when something moves one of them (a respawn, a cell line: rope stretched by 3 m). Three one-line AI touches: the chase
clock (`ECO_CHASE`) stops while holding; the lurker and the trap keep their target while they have hold of it (the lurker drags its prey
home to the den and eats it there, which is what an octopus does).

**Bites in the hold**, on the hold's clock (`GRIP.cd`): a share of the holder's `dmg` (`first` on the clamp, `bite` per bite after). Every
wound lands as a share now and a share that **bleeds** out (`bleed`: `o.bleed` hp still to lose, draining at `0.4 + 0.12·bleed` a second
and clotting at 0.25/s — a ridge's 32 is ~22 now and ~9 over the next seven seconds). A **jaw** lets go after a bite on prey heavier than
`HOLD_BIG` 0.6 of itself (bite and spit) and waits two bite cooldowns before it grabs again. A bite in a hold jerks the held
(`shake`); a free bite (`snap`: a coil's ram, the player's bite on what it doesn't hold) knocks back as before. The player is never
swallowed whole (the tentacle-ring mouths grip, they don't engulf). Hunters no longer have their hp reset to 60% when they flee at 35%,
so a hunter that keeps coming back can be killed; a mortal creature bled or bitten to 0 dies through `kill()` (a carcass, the ledger debited).

| kind | k | cd | first | bite | bleed | close | slow | shake |
|---|---|---|---|---|---|---|---|---|
| jaw | 16 | 1.5 | 0.7 | 0.7 | 0.4 | 2.0 | 0.75 | 2.5 |
| arms | 16 | 0.9 | 0 | 0.45 | 0.25 | 1.5 | 0.55 | 0.8 |
| claws | 24 | 0.7 | 0.8 | 0.3 | 0.3 | 1.2 | 0.7 | 1.2 |

**The player.** Right mouse or **r**, held, is the grab: the clade's grip takes hold of the nearest live thing within the bite's reach
ahead and keeps it while the key is down (`playerGrab`; `P.hold`); let go and it goes. Forage small enough to eat (`WHOLE_P` 0.25 of
your mass: arrows, needles, rasps, scuttles; not a picker) is not grabbed — the bite gulps it as before. The finback's clamp bites
(half its `first`); the soft-arm's and coilshell's arms wrap (`P.grab`). Click is the bite (`playerBite`): a gulp, **a mouthful of a
carcass** (new: `flesh −= size·0.5`, heals 6 per unit — you eat what you kill, and what others killed), or a wound — ×1.5 as a tear on what
you hold. Held, you swim at `slow` (`P.heldK`) and the rope does the rest: you drag a darter, a grazer drags you, a ridge holds you
where it is. The mouth stays open on what is held (`st.strike` to the player's anim). Touch: a finger held still on the right side.

**Blood** (`bloodBurst`, `updateBlood`): one pooled point cloud (`BL_N` 480 / 240) through the snow's points patch (a size and an alpha
per point, lit by the snow's light and the player's torch), the clade's colour — copper grey-blue, iron red-brown, vanadium straw
(PLANET, blood) — drifting with the current and the flow round the bodies (`flowAt`), spreading, sinking a little, gone in 2.5–4.5 s;
a puff at every wound, a trickle from a bleeding body at its last wound; none above the water. On the effects list as `blood`.

**Wounds and healing.** A hunter healed 2 hp/s with no delay, which outran every wound's bleed: nothing a hunter took ever bled out and
a hunter you fought off was whole again in a minute. Since v11.31.1 the regen waits `HUNT_REGEN_W` (8 s) past the last wound and stops
while the body is still bleeding (`c.lastHurt`, stamped by `wound` and by every tick of the bleed, the player's own gate as the
pattern); `HUNT_REGEN` 2 hp/s once it runs. A 20 hp wound on an eel now costs it most of 20 (55 → 37 hp) and it is back at 55 about
forty seconds later.

**Letting go.** `dropTarget(c, cool)` (creatures_ai.js) is the one routine that ends a pursuit: target, `grab`, the hold, `bored`, the
tell and strike clocks, the face, the chase clock, and back to wander (an ambusher to `return`, a feeder and a sitter left alone). The
ink, the finback's pulse, the player's death, a lost chase and a kill each cleared a different subset before v11.31.1, and the one they
all missed was `c.grab` — a rigged hunter's arms went on reaching for the player from wander.

**On paper** (`test/combat.js`): a ridge takes a grazer in 0.4 s and kills it in the hold in 6 s; a basker runs a grazer down and kills
it in 8.4 s, its first bite nose-on at 8.6 m; a finback holds a fleeing grazer 2.3 s before it tears free and is dragged 11 m. Against a
finback thrashing at full speed with no ability (the run varies): eel ~4 s / 24 hp, crusher ~7 s / 90–110, hook ~3 s / 20–26,
lurker ~4–6 s / 28–50 (it holds longer and costs more than it did, the hold re-forming where the lunge used to fall short); trap,
stone, basker, sickle, ridge, ortho, abyssal hold for good at 9–23 hp a second — held by a big one you have the ability or ~9 s. That is
the person's "allowed to lose"; `GRIP.bite` and `k` are the knobs. The test also prints the reach table (every predator's `reach`
against `hitN + hitB` for each prey) and fails if any pair's bite distance falls under their contact. Not built: venom or
paralysis (PLANET lists them for the ringmouths), the wound slowing a creature, a hunter returning to bled prey (behaviour — next pass),
what a held creature's own arms do to its holder.

## The canopy

Biome 12 is a *surface* biome. `canopyW(x,z)` (world.js) is a soft mask: three patches (`CANOPY` table: angle, radius,
size — over the outer plain/void, the lantern fields, the vent field), each a dense core inside 0.55×size and a halo
thinning to zero at size, edges noise-warped; ~5% core, ~5% halo of the map. Outside the patches rafts use `pocket`
noise: full base density only in pockets (~17% of area), 10% of it elsewhere, so they read as occasional clusters with
the odd big one rather than a uniform sprinkle. The floor keeps its biome; `effectiveBiome(x,z,y)` returns 12 above −70
inside the mask, which drives fog, the label and a 0.72 light factor. Flora entries with `canopyPer` use the mask as a
density where it is 1: `raft` (v10.2: a flat leafy tangle in the surface plane — runners with dense small blades and
berry floats, wider than thick, `ys` −0.2 so the top just breaks the water; v10.1's branching-stem tangle "looked like
bark or a branch") and, since v11.16, the **buttons** (`button`, `buttonB`, `MATR`, `canopyPer` 60; DRIFTERS.md) — a drifter that grew a
pad to farm light: a green-blue disc with a violet rim and a fringe of short arms, in fleets, a far card. The float colonies of v9.5–v11.15
(`colony`, `colony2`, `MATR2`: white floats with fishing lines to 100 deep) are gone — they clipped, spawned into each other and read as
"pustules in the sky"; the fishing float is a creature now, the **sailer** (creatures_builders.js `buildSailer`, creatures_ai.js
`updateSailer`; DEFS `sailer`, `greatsailer`, role `sail`, `surface`): on the wave, carried by the current, sailing at 5% of the wind 40°
off downwind left- or right-handed, a body you push against, eight 25 m lines as soft chains posed by `linePose` (parts.js) to stream
against its way through the water, and stinging within `lines` metres of any simulated line point. Fleets spawn in the canopy mask
(chunks.js spawnChunkCreatures: 1–4 a cell plus a great one in a third of the cells); the odd one on open water (SPAWN). Pads are thin in y and placed at `ys` so the player's ceiling (−1.6) and camera
(−1.0) stay under them; the huge rafts don't conform to the wave. Since v9 every pad is a solid you can land on and
cannot rise through ([Contact](#contact)). Three jellies per canopy cell under the
surface. A canopy cell is ~110k tris — similar to a thick kelp cell. The person called it "truly awesome". Open: does
it want its own fauna beyond jellies; is "the canopy" the right name.

## Creatures

The ecology's rules — the three clades, the chemocline, temperature, eyes, blood and shell colour, the niche audit —
are `PLANET.md`, which outranks this section and the defs.

`creatures_defs.js` (**the content file**): `DEFS` species stats, `SPAWN` expected spawns per cell by dominant biome.
`creatures_builders.js`: `PAL` palettes, `buildX(scale, pal, opts)` per species returning `{g: Group, anim(t, spd,
state), hit, rigs}` (`hit`: body capsules; `rigs`: simulated arms/tails, [Contact](#contact)). **All creatures face +z.**

**Creatures, the spec (v11.10).** Most species are no longer hand builders but *specs* compiled by `creatures_spec.js`: a spec is
`{id, clade, core:{kind, ...}, parts:[{kind, style, ...}], coat, size, hit, stats}`; `compile(spec, s, pal)` returns exactly what a
hand builder returns, built from the same kit. Cores: `mantle` (jetters), `coilbody` (shelled ringmouths), `lathe` (slowbloods, with a
profile), `trunk` (hingeshells, the old `buildRaptor`). `PARTS` is the registry — each part's clades, styles, parameters with a
believable band and an extreme band, cost, whether it is paired — and `GRAMMAR` the clade's allowed cores and required parts.
`derive(spec)` is the calculator: mass from volume × the clade's density, drag from the frontal area, thrust from the propulsors
(fins undulate, a mantle jets, legs crawl, a coil is slow), speed `K·(thrust/drag)^0.35·(halflength)^0.4` scaled by the mode, turn
from length, hp from mass; `statsOf` merges the per-stat locks. `SPECS` holds the migrated species; `DEFS` and the player `CLADES`
call `compile(SPECS.x)`. `test/ident.js` proved the migration identical to the old builders (kept at `/home/claude/old_builders.js`
in that session; not in the repo). `coatFor(clade, depth, diet)` draws a palette from pigment chemistry (CREATOR.md, Colour).
Placed parts snap to the body: `bodySurf` is the core's section, the armour parts declare a `cover`, and `ctx.top(x,z)` /
`ctx.bottom(x,z)` give a part the surface with what lies on it; `STYLE_CLADES` keeps each clade's styles its own (v11.11).
`lab.js` is the tool on it (`#lab`, `l` from the menu, the bestiary or play; CREATOR.md). **Since v11.25 every species is a spec** (37
entries plus three scale variants; creatures_builders.js keeps the kit only): eleven cores — `mantle`, `coilbody`, `sac` (ringmouths),
`lathe`, `chain` (slowbloods; the chain's `finish` skins the rig over the body's parts and `provides` the tail), `trunk`, `shield`,
`bean`, `arches` (hingeshells; every hingeshell frame carries `z0 z1 LT w0 w1 h0 h1 H zh hy ht zf` for the armour and limb parts), `bell`,
`float` (drifters, the fourth clade in `GRAMMAR`: arms required, no eyes) — and the parts' styles for what the hand builders did (arms
`crawl/raise/net/hang/lines` with `PLANS`, legs `placed/walk/hang/rock/march/swim`, valves `placed/clam`, eyes `arc/rows`, mouth
`rasp/peck/slit`, tailplate `abdomen`, weapon `combs`, the `head` turret). `spec.mat 'glass'` is the translucent build. A core may supply
`thrust`, `mode` and `chambered` to the calculator, whose dry context has a body frame (the moving parts' thrust was lost since v11.18). `creatures_ai.js`: registries `creatures/schools/respawns`, `spawn()` (bakes the
far LOD), `setLOD`, steering, one `updateX` per role, `updateCreatures()`.

- **Roles:** hunter (chases prey; `strike {tell, dur, speed, range}` for one that cocks and lunges — the tell slows it, turns it to
  the prey and drives `st.tell`, then a burst at `speed` with `st.strike` on and one bite within `reach`; `burst {on, off}`
  for burst-and-coast: speed and accel on a duty cycle, full for `on` s then a third for `off` s, in the chase and the wander
  alike), graze (`calm`: ignores threats — the tread), ambush (the lurker; `hang`: the hook, a home 5–14 m up in the structure,
  the strike pose on the drop), trap (sits and never moves: prey within `detect` starts the tell — it turns to face it — then the
  strike, a bite within `reach`, then `cool`; as heavy as rock for contact), watch (the watcher: within `detect` of the player it
  walks to a standoff of `stand`, faces them, follows, backs off inside half the standoff, wanders when they leave), coil, drift,
  wander (`deep`: keeps its wander below −458 — the pall), boid (below). `preyClade`: the player is prey only as that clade (the
  crusher and the coilshell). `clear`: the floor clearance in place of `size*0.35` (the trap at 0.45, the stone at 0.8: buried).
  Every creature carries `st` (tell, strike, jet) for its anim and may set `face`, a point it turns to instead of its velocity.
- **Boids** (`updateBoid`, since v10.7): a school is a loose ribbon. Each member steers toward the school's wandering target,
  aligns with and gathers to the members within 14 sizes, keeps 4.5 sizes from the close ones, adds a wander of its own (so the
  ribbon frays and re-forms) and flees the player within 6 and the school's threat within 8; the school (`updateSchools`) is its
  members' mean, wanders near home, and scans for the player and any hunter of its members' kind four times a second. Only its
  own school's members count: a ribbon of seven costs forty-two distances. Flickers in sevens, darters in nines. The v4 offsets
  from a school centre read as a block; this is what replaced them.
- **Cost rules** (v10.7, the population tripled): grazers scan for threats at 0.3 s (every frame was the biggest cost in the
  profile), schools at 0.25 s, hunters at 0.4 s, traps at 0.25 s; the wave is only read for creatures within reach of the
  surface; beyond 150 m a creature moves every other frame with two frames' `dt` (`par`, `accT`). Beyond 360 and its `lodFar`
  it isn't updated at all, as before.
- **Predators:** hunter role with `detect/reach/dmg/home` leash. `reach` must exceed the contact distance of the two
  bodies' capsules (`hit` in the builder; [Contact](#contact)) or the push-apart keeps them from ever landing a bite —
  every predator's does by a margin now. Big predators bitten to 35% flee. Predators with arms grab what they reach.
- **Removed by request:** the mid-water `weed` flora (the "floating spiky objects"); the `colony` creature (pink/cyan
  glowing chains); darter/glim **schools are no longer spawned** — the code (`school` role, `makeSchool`,
  `updateSchools`, `buildDarter`) is intact. They went because the rigid formation read as a block; if they return it
  should be as a loose boid ribbon with separation/alignment, not a fixed offset from a school centre. Also gone: the
  vent field's glowing `stalk` bulbs and the cyan/pink glow-cloud particles (`per` on `stalk`, `GC` in
  `placeGlowClouds`; restore with `8:30` / `8:2`) — the vents are orange-lit and silty now.
- **LOD:** `bakeLOD` flattens the group into one mesh per material; near = animated parts, far = static, culled beyond
  `lodFar = min(0.7·FAR, 120+40·size)` (a veil to 760, an abyssal to 720). Creatures beyond 360 units *and* beyond
  their `lodFar` aren't updated at all, so the big ones keep swimming while visible. A static far LOD of a 16-unit
  animal at 700 units is a smudge; if smudges bother them, drop the 40.
- **Spawning:** from the ledger (v11.26, [The ecology](#the-ecology)): `spawnChunkCreatures` takes each entry's count from it and
  `placeKind` places it by kind in the entry's groups (`grp`); swimmers get proper water (floor under −5), not the surf; the strand's
  scuttles are an entry with `land`. Kills leave carcasses and nothing respawns; the ledger's births are laid as eggs.
- **The roster's builders (v10.6), placed v10.7:** the fifteen species PLANET proposed — `DEFS` carries their stats (first
  guesses) and `SPAWN` their envelopes; chunks.js `spawnChunkCreatures` has the kinds: `ribbon` (7 flickers), `darters` (9),
  `trio` (3 needles), `trap`/`stone` (lying on the floor at `clear`, any way round, sitting), `hook` (hung 5–14 m up where the
  envelope holds, clear of solids), `pall` (15–135 m over ground deeper than −470, never above −455), and any `floor` def on the
  ground. They are authored in metres at scale 1 (the roster's half-length is `size`; a floor species is built so its feet or
  underside sit `size*0.35` under its origin, the game's floor clearance). Shared kit in creatures_builders.js: `trunk` (plates
  with joint boxes between, the hingeshells' machine look), `leg` (two segments, a knob at the knee, an optional hook), `flapRow`
  and `flapWave` (a paddler's flaps down one side as one mesh per phase, three phases a side, beaten in a metachronal wave),
  `mouthRing`, `coilShell`; in parts.js `eyeRing` (a prey ringmouth's mantle ring), `stalkEye` (hingeshells), `G.quad`,
  `trunkPose` (a chain running forward from a head: the hose's proboscis) and `armRing`'s `web` option (each segment carries a
  quad out to the mid-angle of its neighbours at the radius of the pose `web.spread`; the halves meet in that pose and shear a
  little off it — the pall's net). Draw calls at near LOD: tread 15 (fourteen legs, each its own pivot), sickle 12, comb 10, trap 8,
  hose 8; the far LOD bakes each to one.
- **The body frame** (v11.18): `compile` puts the hull in a group `B.frame` with the fins, the tail's hinge and the mouth's cap; the
  slowbloods' sway (the tail part's `body`) is the frame's rotation.y, so all of it moves together. Rigs are skinned in the creature's
  frame and stay in `g`; a rig with `ride` (the mouth tentacles) has its rest points yawed by the frame after the hooks. A new part that
  adds meshes which should sway with the hull adds them to `ctx.bf`, not `ctx.g`.
- **The far pose and `lodNear`** (v11.18): `spawn` runs the idle anim and `rigRest` on every rig before the far bake, so a far creature's
  arms and lines are as they will be; `DEFS.x.lodNear` overrides `45 + 4·size` for the long-appendaged (sailer 130, greatsailer 230,
  pall 110, deepbell 90, lurker 75).
- **The current** (v11.18): `c.carried` — a sitter, a grounded body, a trap or a floor crawler is not advected; a swimmer is, and `seek`
  and the boid steer subtract the current from the wanted ground velocity (`curComp`, clipped to `CUR_FIGHT` 1.2 × the speed asked), so it
  faces upstream and holds station, swept only by a current faster than it.
- **The beat** (v10.8): an anim's swimming phase comes from a `swimClock(f0, f1)` (parts.js) — advanced by `(f0+f1*spd)*dt` each
  call — never from `t*f(spd)`, which is a phase whose rate is `f + t*f'*dspd/dt`: minutes into a session any change of speed
  spun the beat at hundreds of rad/s (the v10.7 "janky physics"). A pose that switches on a state (the jet) goes through an
  `easer(rate)`; one that switches on a speed blends over a band with `smooth`. `test/anim.js` measures the tail's angular
  speed and the arms' tip jerk through accelerate/cruise/turn/sprint/coast two minutes in and fails on a spin, a shiver or a fling.
- **Action states:** every anim takes `(t, spd, st)`; besides `st.jet`/`st.pulse`/`st.withdrawn` the new builders read `st.tell`
  (0..1, the hydraulic tell — limbs cock, eyestalks rise, the body swells) and `st.strike` (0..1). The bestiary drives them on a
  clock (tell over 0.6 s, the strike in 0.15 s, both let go over 0.7 s); the AI will drive the same two numbers when the mechanics
  pass comes (PLANET, Hooks: burst-and-coast, the tell before a strike).
- **The bestiary** (`zoo.js`): `#zoo` in the URL or `z` on the menu; every species in `ROSTER` (creatures_defs.js: clade, family,
  niche, `floor`, `new`) shown one at a time at the peak — the menu's site, so the game's own light, fog and water — floor species
  at the floor clearance, swimmers mid-water, the camera orbiting at twice a bounding radius, clamped under the surface and off
  the floor. Arms and tails simulated as in the menu. Caption: name; clade, family; niche; half-length; "built, not yet placed".
  Keys: left/right (a/d) step, up/down (w/x) cycle the coat (v11.8: the species rebuilt in a palette variant — `PAL_VARIANTS`,
  `palVariant`; the caption names it; eyes and pupils untouched; nothing in the world reads it), space or a click fires the action,
  s toggles a cruising speed, drag turns, wheel zooms, z or escape returns; touch: drag turns, a tap on an edge steps. The menu
  creatures are hidden meanwhile and restored on return.
- **Previewing a builder without the game** (`test/preview.js`): `node test/preview.js sickle trap` renders contact sheets to
  `test/preview/<id>.png` — four views (three-quarter, side, front, top), idle and action — with real geometry (`test/geo.js`
  patches the stub's random primitives with the shapes three makes) and a software Lambert; the ground line in the side and
  front views is where the game clamps a floor species. Not the game's light or fog, but the shape, proportion, palette and pose
  are real; view the PNGs before asking the person to.

## The ecology

The world's population is a ledger (`src/ecology.js`, v11.26), not a spawn table: `creatures_defs.js SPAWN` gives every entry a
**capacity** per cell — `n` individuals at full tolerance, times the envelope's mean tolerance over the cell (`ecoCap`) — and the ledger
`POP.n[entry][cell]` holds the count that lives there now. A cell that loads spawns its count (`ecoTake`, rounded by its rng; the ledger
keeps what stood) through `chunks.js placeKind`, the one placement routine per kind; a cell that unloads writes its living back; a death
debits. Nothing respawns. The unloaded cells run the model; the loaded cells run the same ecology live.

- **The model** (`ecoModelGen`, a piece a frame every `ECO_STEP` 3 s). Per game day: births `r·n·(1−n/K)` with `r = r0·mass^-¼`
  (`ECO.r0` 0.12), natural death `m = 0.1·r`; a hunter kind's need `q0·mass^¾` (`ECO.q0` 0.05: five percent of its mass a day at unit
  mass, less for the big), met times `A²/(A²+H²)` — A its prey's biomass (mass × `stock`) within its reach (`ecoReach`: the cell under
  a 60 m home, the 3×3 at half weight to 300, the 5×5 with the ring at a quarter beyond), H `ECO.H` 4 days of one hunter's food — the
  take spread over prey kinds and cells by weighted biomass and capped at `ECO.take` 0.35 of a kind in a cell a day; the kind's condition
  `cd` follows the fraction of its ask it got; it breeds by `cd` and starves under `ECO.starve` 0.35 at `0.35/cycle` a day scaled by the
  shortfall; **its capacity is the envelope's times `0.1 + 0.9·response`** (`POP.ke`) — predators are where prey is. Then a drift of
  `ECO.mig` 0.03 a day toward the four neighbours' free capacity, hunters ×(1+4(1−cd)). Immortal kinds (no `prey`, hp ≥ 1e8, not
  edible) sit at capacity. Loaded cells breed only, and since v11.31.2 into `POP.ow` — **the births a loaded cell is owed** — and not into
  `n`, which there is the living and is pinned to them by `ecoDebit` and `ecoWriteBack`; the logistic reads `n + ow`, the natural death
  `m` still comes off (nothing dies of age in a loaded cell, and nothing is born there either until the clutch), and `ow` survives an
  unload, which is what `n` never did. It starts at a random phase, `rng()·min(1,K)/Q.creatures` in `ecoCap` (a population is not
  everywhere at the same point in its cycle; every cell starting at zero was why the first clutch took two game days).
  `ecoSettle` starts the paper hunters at 0.8 of `ke`.
- **Derived per kind** (`ecoOf`): mass = size³ (the unit is the metre), `stock` (def; the small forage: flicker 8, darter 8, rasp 8,
  scuttle 4, picker 3, grazer 3 — one drawn stands for that many, as the snow's points do), food = mass × stock, r, m, cycle
  `ECO.cyc·mass^¼` days (fed to starving), need, meal = need × cycle, prey (kinds), mortal, grow. A def may override `r`, `cycle`,
  `need`, `meal` (the stone: `cycle` 5, torpid; the abyssal 10).
- **Hunger, live** (`creatures_ai.js hungerTick`): `c.hunger` 0..1 over the cycle; hunts past `ECO.hungry` 0.4; the chase bursts
  (1.6× for 2 s, tired by 6) and gives up at `ECO_CHASE` 9 s on anything but the player; a kill takes `food/meal` off; `feed` state at
  a carcass; starving at 1, dead at 1.2 cycles past. Ambushers `findPrey(c, radius)` when hungry; traps past 0.16.
- **The cast** (v11.31.2, `updateHunter`): the nearest animal a hunter eats sits 35–50 m off on the shelf against a `detect` of 9–17, so
  a hungry hunter's 0.4 s scan runs out to `HUNT_SEEK` 4 × detect; inside `detect` it chases, further out it steers its wander at the prey
  and swims at `HUNT_CAST` 0.8 of its speed instead of its cruise (0.45–0.5, which never closed on a school drifting at its own). Only at
  prey within `HUNT_HOME` 1.5 × `home` of its home, so a hunter stays its patch's resident and the chase that follows is inside the leash
  that drops one (1.9 × home). It costs nothing: the same one `findPrey` call, a wider radius. Over 60 s of shelf play it took kills from
  18 to 27, the hunter role's mean hunger from 0.47 to 0.43 and the share of it sitting at hunger 1.00 from 13% to 8%.
- **Carcasses**: `kill(c, by, whole)` — whole (the player's bite, prey under 0.35 of the killer's meal, a flicker) removes; else the body
  stays (`carcasses`), sinks at 1.6 m/s, rolls to `lieQ`, mass 1e6 for contact, `flesh` = mass decaying over `ECO.carc` 0.45 days,
  eaten at `eatAt` (a hunter min(mass/75, meal/20) a second; a scavenger mass/40); gone at flesh 0 or 1.5× carc. `def.scav` is a
  scavenger's smell radius (`scavenge` in the grazer's and the watcher's update: walk to the nearest, eat).
- **Eggs and juveniles**: `ecoTick` lays what the ledger owes a loaded cell (over the living and the unhatched) as a clutch
  (`layEggs`: up to a group, near an adult of its kind, on the floor, clear of solids; a mesh of seven spheres by clade, `MATT`, scale
  `0.12·size^0.6`) that hatches after `ECO.hatch` 0.25·mass^¼ days at the clutch (`placeKind` with `at`) as juveniles (`spawn` with
  `juv`: `juvDef` — a def chained to the adult's with size, speed, flee, reach, hp, dmg, radius, lunge, detect, clear, food scaled at
  `ECO.juv` 0.55; geometry cached as `kind~`) that `growUp` after `ECO.grow` 1·mass^¼ days when out of sight (dp > 90 or hidden). A
  clutch is a carcass to another kind's scavenger from half its smell; eaten down, `n` falls and the ledger is debited. Land and
  surface kinds walk in out of sight instead (`kindPoint` with `off`: > 110 m, or behind the camera past 30).
- **On paper**: `test/census.js [days]` — capacity, derived rates and the model with nothing loaded; fails on a collapse under a fifth.
  The equilibrium it prints is the world's population; tune `n`, `stock` and the envelopes from it, never by adding a place.
- **Where the player is**: `test/live.js` — the whole game booted headless, the ecology clock driven four game days with the cells round
  the peak loaded (clutches laid and hatched), then 60 s of real frames and a table of every hunter kind: mean hunger, the share of it at
  hunger 1.00, the share hunting, and how far the nearest animal it eats actually is against its `detect`. Fails if nothing is laid,
  nothing hatches, nothing is killed, nothing chases, or over a quarter of the hunter role is starving.
- **Costs**: the model 3.6 ms over ~20 frames every 3 s (sandbox CPU); the paper census 120 ms over the first 64 frames; the readout's
  fourth line (`ecoLine`) sums the ledger for a few kinds every frame the readout is open, and `owed` over the loaded cells only.
- **The rate to expect**: a cell of 26 flickers owes about half a recruit a game day, so one entry in one cell lays roughly every two
  game days; over the ~25 cells loaded round the player that is a clutch every 5–15 real minutes, more as the owed builds. The readout's
  `owed` is the number to watch: it climbs between clutches and drops when one is laid.

## The player

`player.js`. Third person by default; `f` toggles first person (v11.18: the camera `F.nose`×scale + `FP_AHEAD` ahead of the nose, the body hidden, the surface-side rule kept). `CLADES` — soft-arm (ink: predators lose you), finback (tail-strike stun), coilshell
(withdraw: hold; invulnerable, sinks slowly, predators get bored). The jet (soft-arm, coilshell: shift): a squeeze every 0.5 s,
its impulse `jetImp` delivered as a thrust over the first `JET_W` 0.18 s of the cycle (v10.8; one frame before, which whipped the
arms). Faces its velocity when moving (and its arc when
airborne). Terrain: gentle slopes clamp you up, steep walls push you back horizontally (`solidPush`, then the floor clamp, then
the pads; bodies and arms in `creatures_ai.js` after the creatures have moved, then `finishPlayer`: pose, arms, camera). Death = fade to black, respawn at the peak. The bite and the grab are [Combat](#combat) (v11.31): the bite gulps small forage (heals), eats
at a carcass, or wounds; the grab (right mouse, r) holds. The player's food is arrow squid, needles and scuttlers, and what it kills. Open question, never answered: should clades differ in *what they can reach* (crevices for soft-arm,
surface air for finback)? Any persistence, or is a clean cold start the point?

## Performance and the quality tier

**Where the frame goes, measured on the 4060 at the weed forest (330, 0), 13 Sep 2026.** The readout's `work` pair is the
frame's own cost and the worst frame in the last quarter second (main.js, v11.32.1); `ms` and `fps` are the vsync interval and say
nothing about headroom on a capped display.

| | |
|---|---|
| frame work | 5.4–5.9 ms average, 7.9 ms worst, against an 8.3 ms budget at 120 Hz — no frame dropped |
| main render (submit) | 4.06–4.19 ms, 429 draws, 4.9M triangles — about 9.6 µs a draw, ordinary three.js overhead |
| physics | 1.2–1.5 ms with 57–105 near creatures |
| the world's shadow map | 2.9 ms a re-render, 105 draws, 2.23M triangles over the 4 cells its box overlaps |
| its refresh rate | 0.33/s standing still; ~0.8–1.1/s at 8.8–15.4 m/s. `shsN` in the readout is the count of re-renders since boot, not casters |

The re-render is what takes a frame from 65% to 95% of budget, roughly once a second, and never over it. **The draw count is the
thing that grows**: cell flora is the bulk of it at roughly one `InstancedMesh` per flora species per cell (118 of 196 draws with
nine cells up), so it scales as species × visible cells and the archipelago multiplies it directly. Creatures are 33 draws and 15k
triangles and are not a cost. The lever, when `work`'s max reaches 8.3, is batching a species across cells or dropping species by
distance — a designed pass, not a knob. `render` is CPU submission; the GPU runs behind it and is not measured here.

- Creature far-LOD; budgeted generator streaming (`Q.budgetMs` for cells, `Q.farMs` for regions — and since v11.12 the cells get
  what the last frame left of `Q.target`, 7.5 ms on high, at most `budgetMs`; the generators yield inside their big steps; cells unload
  one a frame); quads for kelp fronds and grass; a fixed light pool (`scene.js` `lightPool`, `assignLights`) so the light count never
  changes; every shader program compiled at the end of the first frame (main.js `warmShaders`: one tiny mesh per material, plain and
  instanced, through `renderer.compile`), so nothing compiles mid-play; manual per-cell frustum culling (`cullChunks`); creatures far
  away not updated; merged flat-shaded geometry everywhere; a kind's static geometry and far-LOD bake shared by every individual
  (`KIND_GEO`); arms simulated only at near LOD, contact only within 90 of the player.
- **The flora's draw distance (v11.12, `AUDIT.md`).** The frame is the GPU's and the GPU's is the flora's: at the forest, hiding the
  flora took 4 ms off a 6 ms frame and doubling the pixel ratio added 0.4, so vertices and draws, not fill. Two knobs in scene.js:
  `DIST_R` 90 — the sway shader's disturbance loop (twelve iterations a vertex) runs only for plants within it of the camera, since
  every disturber is within 70 (6.3 → 4.6 ms in the forest); `FLORA_FAR` 450 — the small materials collapse instances past it in the
  vertex shader, and a cell whose nearest edge is past it hides its instanced meshes and turns its far impostors on (`ch.near`, chunks.js
  cullChunks; far.js farApplyCell), so the stipe, bladder, raft, colony and tidal-tree silhouettes stay as cards and the rest goes into
  the fog it was lost in anyway (6.6% contrast at 450; 4.6 → 3.0 ms, draws 418 → 263 in the experiment). A new small species wants a
  cut material; a new big one a card in `FAR_IMP` and no cut. Ideas floated, not built: shared flora vertex buffers with pooled per-cell
  instanced meshes (every cell still deep-copies every species' geometry and uploads it on its first draw); per-cell variants (struck:
  variety stays plant to plant); simpler crowns and lathes for the tidetree (8268 vertices an instance) and the sacs (1000–2400).
- **Quality tier `Q` (scene.js): numbers only, never code paths.** Auto: touch + screen < 900px → low. Force with
  `#low`/`#high` in the URL — the hash is a flag list since v11.31.4 (scene.js `HASH_FLAGS`/`HASH_TIER`, `&` or `,` between them),
  so `#low&lab=<spec>` and `#low&zoo` work and the lab writes the tier back into the hash it rewrites. Low: draw distance 1000, 45% flora, 60% creatures, 2 pool lights, Lambert terrain, no AA,
  96² surface, 36-unit far grid, 2 shadow casters, 4 light shafts, a one-band caustic (v11.13: `casters`, `shafts`, `cau`).
- The person tests on desktop and wants it "fantastically smooth"; mobile is secondary and may sacrifice things. The
  cadence agreed: content freely, a performance pass whenever the readout says frame time is creeping. Readings v5
  (thickest kelp, desktop, high): 120 fps, 8.3 ms, 130 draws, 416k tris. **Readings v8.3 (the arch canopy, desktop,
  high): 120 fps, 8.3 ms everywhere, draws 214–276, tris 915k–1499k, cells 13–19/34, far 4–12/16.** 8.3 ms is the
  120 Hz vsync, so the readout shows no headroom either way; tris are 2–3.6× v5 with the far layer, the massif and the
  canopy. **Readings v11.12 (measured on the person's RTX 4060 at 1600×900, high, the main thread with the pane hidden so no
  vsync; frame means):** the peak 3.0 ms (was 3.9, p99 24 → 3.7), the collapse fan 2.0, the weed forest at (330, 0) 3.2 (was 5.9
  with a p90 of 15.5: the GPU's ~6 ms frame surfacing as waits), draws 285–368, tris 2.2–4.2M; sprinting from the forest 4.0 median,
  p90 6–8, two frames in a hundred over 10 ms. Boot 507 ms synchronous, the first frame 353 ms with all 25 programs. Heap 173 MB at
  boot, 270–340 in play, no leak over a six-stop soak. The readout's `render` ms is the way to see the GPU: when it runs away from
  the rest of the frame, the GPU is the limit. Still unseen: the deep floor near the vents, and the island top looking across the atoll
  (the surface mesh is 74k tris on its own; hiding it was 0.6 ms).

## HUD, readout, compass, text

- **Text must be tasteful and minimal**, naturalistic, no goofy UI. Lowercase, letterspaced serif, appears only when
  needed: biome name on entry, hairline health bar only when hurt, the controls hint once. No middle-dot separators, no
  ALL CAPS labels. Styles live in `shell.html`.
- **Readout:** backquote, apostrophe or F3 (the person pressed apostrophe and got nothing, hence the aliases). Prints
  fps, ms, draws, tris, cells visible/loaded, far regions visible/built, creatures visible/total, light sources, tier,
  the frame's physics ms (`phys`: contact, arms, pads, the bend's list, the snow), medium (`sea` / `air` / `strand`),
  position; `draws` counts the shadow map's depth pass too (v11.23); `light` is the sky's, `air/water` under the water (`skyLw`). Second line: the sea fog's numbers, live-tunable while the readout is open
  (keys in Visibility, `FOG_TUNE` in main.js). Light text on a translucent dark backing (v8.4) so it reads in screenshots.
- **Compass:** `#compass` in the shell is a static strip of cardinal letters (three copies, 2.4 px/deg) behind a masked
  260 px window; JS only translates the strip (`updateCompass`). North is −z; heading = −yaw. Fades in while moving or
  turning, out after 3.5 s still. The dot under the letters is the bearing of the peak (respawn), shown beyond 150 units
  from it; clamped to the window edge and dimmed when behind you. Remove it by deleting the `dist>150` block.
- **The effects list (v11.23, `effects.js`, `#fx`):** the cosmetic systems switchable live — caustics, shadows, world shadows, ground shadows (v11.30), sharp shadows, light shafts,
  marine snow, rain, clouds, surface glow, vignette — in the lab panel's look, on the right. The word `effects` at the bottom right of the menu,
  or `e` on the menu and in play (the pointer is released while it is open, taken back on close; escape or a click on the canvas closes it).
  Saved in localStorage (`tethys.fx`). Each system reads `FX.key` where it draws; a switch is a key in `FX_DEF`, a row in `FX_LIST`, a read.
- Controls (the hint, `menu.js`): w a s d swim, space rise, c dive, shift burst, q ability, click bite, m mute; mouse
  look by pointer lock from the first frame of play (the pick's click asks for it), Tab releases it and shows the cursor, Tab or a click
  takes it back; a click while locked is the bite; drag-to-look if the lock is blocked (e.g. inside an iframe). v11.13.1: the invisible
  menu's picks were taking every click below the title (`pointer-events:auto` on a child beats the parent's `none`); `#menu.gone .pick` is none now. Touch: left side drag to swim,
  right side drag to look, tap to bite, two fingers ability.

## Determinism

Noise perm seed 1337; landmarks seed 4242; per-cell rng seeded from (i,j) for the cliffs and the spawns; per-(cell,entry) rng
for every flora entry (v11.2, seeded by the cell and the entry's id: striking a species moves nothing else); per-(cell,type) rng
for structures and impostors; the world is the same on revisit. `Math.random` is used only for things that don't need to persist
(animation phases, particles).

A seeded rng is only half of it: whatever the placement *reads* must not depend on what happens to be loaded. Everything a cell
places reads the ground through the cell’s own grid (`hOut`, `sample()` past the edge) or through `sample()`, never `groundAt` — which
answers from a neighbour’s grid when that neighbour is loaded and from `sample()` when it is not. `placeCliffs` read `groundAt` until
v11.31.3 and so laid different ledges depending on the order the player arrived from; the check is in the CHANGELOG for that version
(load a cell alone and again with its four neighbours up, and compare).

## Hooks for things not built yet

- **The daylight shroud** (the "Subnautica 2" look): v8.2 built the first half — the sun term, the daylight at a bounded
  point along the ray, the split shares. Left: a veil that integrates daylight along the ray properly (closed form for an
  exponential daylight: `∫ L(y₀+s·dir.y)·c·e^{−cs} ds`); a `WATER` table for the deep biomes that is a tint of similar
  brightness with all the darkening from depth (would brighten the deep; needs eyes); the fog's sun direction and the
  underwater sun sprite disagreed — aligned in v11 (the sprite hangs in the luminary's direction); day/night — built v11 (The sky).
- **The boulder mountain**: a structure at the scale of "that side of the map" — a mountain of boulders smashed
  together, the way the crags are built, probably breaking the surface. Site: was the colossal spire, which is the neck since v10.2; it would want a site of its own. Breaching is solved
  (no ceiling, `waveH` is the surface, land is biome 13, `big` structures on ground > 0.5 are not scaled down), so it
  can simply rise through 0; an `OUTCROPS` entry is the precedent for terrain that breaks the surface.
- **Surface interest**, the topic the person named next (menu offered, not answered): flyers — launching gliders and/or
  a soaring boid flock; the boulder mountain; shore foam; clouds and a close moon; air sound (the ambience just opens
  its lowpass to 1600 Hz above water). Also: a legged clade (`legs:true` in `CLADES` — `landSpeed`, jump), more
  landmarks, a first-person toggle, sound beyond ambience + thumps, darter shoals as boids, fauna for the canopy.
- **Contact, not built:** arms against other arms (chains ignore chains); creature bodies against soft flora (they pass
  through kelp as the player does); the finback's tail, the grazer's fins and the scuttler's legs are still rigid
  animated parts (a tail is one `tailPose` chain away); creatures landing on pads flop by the sea-floor gradient, not the
  pad's; a held player could be dragged (the grab only slows).
- The person likes: big vertical structures, phosphorescent deep biomes, archways, a bone, a pit — all present now;
  more of that vein is welcome.
