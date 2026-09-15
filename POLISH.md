# POLISH — low-budget effects for tethys (IDEAS #3), 9 Sep 2026

A survey of the cheap systems that carry low-poly games — what each one is, why it works at this fidelity, what it would
hook into here, and what it costs against the numbers in `AUDIT.md`. The ranked list is at the end, with the person's decisions;
pass A is built as v11.13 (DESIGN, The light), B and C are not. Downstream of `PLANET.md` (no magic, no lamps, bioluminescence only as events) and of
`DESIGN.md` Visibility (the fog is the look; everything here has to sit inside it).

## The budget, and the currency

`AUDIT.md` measured the frame on the person's RTX 4060 at 1600×900: the forest at (330, 0) is 3.2 ms after v11.12, the peak
3.0, and a 120 Hz frame allows 8.3. The plant overhaul will want some of that gap. Effects in this file should add **under
1 ms on desktop, all of them together**, and nothing that a `Q` number can't cut on low.

What is cheap and what is dear here is unusual, and it decides the whole list:

- **Fill is nearly free.** Doubling the pixel ratio (four times the pixels) added 0.4 ms. A fragment term of thirty
  operations on every opaque pixel is about 0.05–0.15 ms. The GPU is vertex-bound.
- **Vertices are the frame.** Hiding the flora took 4 ms off a 6 ms frame. Anything that adds geometry per plant or per
  creature is the wrong direction.
- **A draw call is ~5 µs of CPU** (r128). A pooled system that is one draw is fine; a mesh per particle is not (the ink
  cloud is nine meshes and nine draws today, with a new material per cloud).
- **A second pass over the scene is 3–4 ms** (the whole scene again). Shadow maps and post-processing chains are passes.
  Rendering to a target also loses the default framebuffer's MSAA unless it goes through a multisampled target and a
  resolve. That is the line: **no new passes**. Everything below is a term in an existing shader, or one pooled draw.
- **Every fragment already has the inputs.** Under `USE_FOG` every material carries `vFogPos` (the world position),
  `uFogC` (the camera), `uFogS.xyz` (the luminary's direction), `uFogT` (the sky's light and tint), `uWaterMap` (the
  water's colour and the canopy weight in alpha), `vWy` (the world height, from `addTint`) and `uTint.x` (the tide). The
  flat face normal comes free from screen derivatives, `normalize(cross(dFdx(vFogPos), dFdy(vFogPos)))` — flat shading
  is what the terrain already does with them (WebGL1 wants `extensions.derivatives` on the material; WebGL2 has it). So caustics, projected shadows, a rim, a height fog and translucency are
  all reachable from the one injection point in `addTint` (the `#include <fog_fragment>` replacement in scene.js), and
  reach every tinted material at once: terrain, rock, flora, sway, creatures, impostors. `GLOW` (Basic, emissive) is
  excluded by its key.

## What is already built (so nothing here repeats it)

The radial two-population fog with the water map, daylight along the ray and the sun's glow; the through-water tint from
above; the sun lit by the fragment's depth; the tide's band on rock; the sway shader with contact, flow and the current;
the marine snow that flows round bodies (`FLOW`, six slots: the player plus the nearest five); splashes (points, gravity);
ink (spheres); rain (lines); the shimmer plane; the sky shader (sun, moon, stars, cel clouds, a bow); the surface with
its foam, Snell's window, glints and rain crowns; countershading by face normal at merge; the hurt overlay, camera shake
and knockback; the pool of four point lights and the player's light; the flora draw distance and the impostors. This is
already most of an effects stack. What is missing is the light *doing things* (caustics, shadows, shafts), the water
*answering* bodies (silt, bubbles, rings, blood), the bodies *answering* hits (flinch, spin, flush), and the night.

## The catalogue

Each item: what it is · why it reads at this fidelity · the hook here · the cost · the rule it has to pass.

### Lighting

**1. Caustics.** The single strongest underwater cue there is, and the one this game has none of. Three sine bands in
world xz, summed and sharpened (`k = pow(1 − |a+b+c|/3, 4)`), drifting with `uTime`; scaled by the face normal's up
component (from derivatives), by depth (`exp(−depth/14)`: strong to −10, a ghost by −30, gone by −45), by the pattern's
size growing with depth (the web blurs and widens as it goes down), by the sun's altitude and the direct beam (`sunL`,
cover, rain — a new `uSunW` uniform written once a frame beside `FOG_S`), and by `1 − canopy` from the water map's alpha
(no caustics under the canopy). Added to the fragment before the tint, on every tinted material: the floor, rock,
plants, creatures' backs, the player. Sines, not noise: the classic web is a sum of refracted wavefronts and three
directions at 120° give it; noise gives blobs. Cost 0.1–0.2 ms, fill only. Believability: total — this is what sunlight
through a wave surface does. Low tier: one band.

**2. The sun's shadow of a body.** Projected shadows in the fragment, no shadow map: a `uCast[6]` array of spheres
(centre, radius) fed from `FLOW` (the player and the nearest bodies, already sorted every frame in `updateDisturbers`),
the light direction the *refracted* sun (`sin θw = sin θa / 1.33`, on the CPU, into `uSunW`). For each caster, the
fragment's distance from the line the caster casts along the light; darken by a smoothstep over the radius, the penumbra
growing with distance (`r·(1 + 0.03·s)`), the shadow fading over ~35 m (scattering eats it), strength the direct beam's
share at the fragment's depth (the same 0.28..1 curve the sun patch uses). Applied to the floor, rock and flora; also
to creatures (a body under another body). Three things come with it: the player's height off the floor becomes
legible (Subnautica never manages this); a big creature's shadow sweeps the floor before the creature is in view, which
is the "presence" the person likes; and the day's sun moves it. The six slots should be picked by `d − size·6`, not by
distance alone, so the abyssal 40 m overhead outranks five darters. Cost 0.1–0.3 ms, fill only, ~15 ops per caster. Low
tier: two casters. Note: the loop count is baked into the shader string from `Q` like the sway material's numbers — a
GLSL ES loop bound must be constant, and `Q` is numbers only.

**3. Light shafts.** Twelve to sixteen tall quads (3 × 30 m) hanging from ~3 m under the surface along the refracted
sun, in a 40 m patch that follows the camera snapped to a grid (the surface mesh's trick, so they don't swim), each
turned to face the camera about the vertical in the vertex shader; alpha from a scrolling band of noise along x plus
fades at the top, the bottom, and where the quad's base nears the ground (known at placement from `sample()` — keep them
over water deeper than 15 m so they never cut through a rock); scaled by `sunL`, the sun's altitude, `1 − canopy`, and
the depth. Additive, `fogExtinctOnly` (DESIGN, additive things), `depthWrite` off, drawn before the surface, hidden
in air and faded by `wk` like the shimmer (the fifth video's flash is the precedent for getting this wrong). One merged
draw, ~30 triangles, fill of a few hundred thousand pixels. Believable (crepuscular rays through a wave surface). This
is the one cinematic cliché in the list; the person should say whether they want it.

**4. Translucency for blades.** r128's Lambert computes `vLightBack` for double-sided materials and the fragment picks
front or back by `gl_FrontFacing`. Replace that pick in the sway materials (`MATG MATM MATS MATB MATW`; not rock) with
`mix(front, back, 0.35)`: a third of the light on the far side comes through a blade. The canopy from below, lit
through, at a sunset. One string replacement, zero cost. Believable for thin blades, wrong for a stipe — apply by
material.

**5. Ambient occlusion at build.** Two vertex-colour terms in `buildTerrain`, free (the height grid is there): a cavity
term, `h − mean(h at ±6 m)`, darkening gullies and the foot of every wall by up to 35%; and shade under the forest,
darkening the floor by the canopy species' own envelope weight at the vertex (deterministic, the same `envW` that places
them). For structures and the rock kits: darken each lump's vertices by the depth of their sink line (a per-instance
colour, nothing in the shader). For creatures: `merge` already countershades by normal; a concavity bake (occlusion by
the part's own neighbours) is a boot-time cost the person would notice (523 ms already) — skip.

**6. A rim.** With the derivative normal and `uFogC`, a Fresnel term on `MAT` for creatures: faces at grazing angle
brighten by 15–25% toward the light from above. On flat shading it is faces, not edges, that light up, which is the
Abzû look. Cheap, fill only; a taste test the person has to make. Third tier.

### Shadows — what not to build

A shadow map is a second pass over the scene (4.2M triangles at the forest) into a texture, then a lookup per fragment:
3–4 ms and every kelp blade drawn twice. A cascade over terrain and structures only would miss the one thing worth
shadowing here, the forest. Item 2 gives the two shadows that matter (the player's on the floor, the big thing's over
you) for a fraction of a millisecond; item 5 gives the static occlusion. That is the shadow system.

### Shaders

**7. A pulse for the sessile animals.** `MATV` is rigid. One line in its vertex shader — `uTime`, a per-instance phase
from the instance matrix, a 2–3% scale breath on the upper half of the plant (`transformed.y / top`) at 0.3–0.8 Hz —
and the tubes, cups, lilies, tulips, chains, burrs and loops live. `MATV` needs `uTime` added (`timeU`); the sway
materials have it. Zero cost. FLORA's cones and crowns opening on the flood (parked) are the same mechanism with the
tide's rate as the driver.

**8. Sway on the far cards.** `MATFAR` is static, so the hand-off at `FLORA_FAR` is a forest going still. A one-line
vertex sway by `uTime` and world x,z, scaled by the card's height. Zero cost.

**9. The chemocline.** `PLANET.md` asks for it: a thin milky layer at −450 and browner, stiller water under it. A slab
term in the fog chunk — the length of the ray inside [−452, −448] in closed form from `uFogC.y` and `vFogPos.y`, an
extra extinction and a milky colour by that length; below the slab the veil's colour warmed and darkened. A few ops, fill
only. This is also the gameplay tell for the drain, when the drain is built.

**10. Turbidity in the veil.** Modulate the fog density by a slow drifting value noise sampled at the bounded point
`sp` (the one the fog already computes): the veil breathes, the way particulates do. Subtle, one noise per fragment
(the sky shader's `fbm` has the GLSL). Third tier: it may be invisible against the snow.

**11. Wet gloss.** A Blinn glint on `MAT` from the derivative normal and the luminary, gated by a per-vertex gloss (the
colour attribute's spare precision, or a fourth component): the coilshells' shells, the hingeshells' valves, wet rock at
the strand. Fill only. Third tier; the person should see item 6 first — the two fight.

### Volumetrics — what not to build

Ray-marched fog is the one thing that would look better than the two-population veil, at 2–4 ms of fill per frame with
steps through a noise field. Not worth it against the numbers; the veil, the canopy alpha, the daylight along the ray and
items 3, 9 and 10 cover the same reads for nothing.

### Particles

All of these should be **one pooled point system** (`fx.js`, ~600 points, one `Points`, one material with vertex colours
and `sizeAttenuation`): position, velocity, life, colour, kind, in typed arrays like the snow; `emit(kind, x, y, z, n,
speed, spread)`; per-frame integration the snow's way (the current from `currentAt` at the camera, ~0.05 ms). Kinds:

**12. Silt.** Sand-coloured, sinks at 0.15 m/s, drifts with the current, dies in 4 s. Emitted where a body touches the
floor: the player's floor clamp and flop, creatures' `grounded`, the trap's strike from the sand, the crawlers walking
(a tread kicking a plume is worth more than any shader), a jet within 2 m of the bottom (the mantle blasts the sand). The
cheapest physics there is: contact you can see. Colour from the terrain's palette at the point (sand, mud, rust).

**13. Bubbles.** Rise at 0.6–1.2 m/s with a wobble, grow slightly, die at `waveH` (and put a ring on the surface, item
16). Air only comes from air, so the sources are a breach (entrained air under the splash), waves on the shore, the
tidal forest's roots at the tide line, and gas seeps (FLORA's `seep`: a chemocline planet has cold seeps; a column of
bubbles is the honest way to mark one). No bubbles from breathing — nothing here breathes air.

**14. Scraps.** Eight flakes in the prey's colour at a bite, tumbling, sinking. With a **blood puff** — three of the ink's
spheres at a quarter size, the clade's blood colour from PLANET (copper: grey-green to teal; iron: rust; hingeshells:
pale, nearly clear), opacity 0.5, growing 3× over two seconds, drifting with the current, gone in five. `spawnInk` is
the code; three spheres and one material shared by every puff, so a cloud is three draws and no new material. PLANET's "blood radius when hurt"
(detection modes, a different pass) would read this cloud when it comes.

**15. The bioluminescent wake — the night.** PLANET names it: dinoflagellates firing in a wake, the disturbance list
already tracking every body. The snow already computes a velocity per point from `FLOW` (`pv`, `updatePlankton`). A
second `Points` sharing the snow's position buffer, additive, `fogExtinctOnly`, with a colour attribute that is zero
except where a point was excited this frame (|v| over a threshold; the jet, a strike and a bite excite a radius) and
decays over 0.6 s; scaled by the night (`1 − skyL`), so by day it is nothing. One extra draw of 1400 points, ~0.02 ms.
A fish at night draws a green-blue trail; the player's jet flashes; a strike lights up the water round it. Lit only when
disturbed and never a lamp — it is the one glow the rules allow and it is the best thing in this file for the price. The
same excitation can flash a pen or whip when brushed (the sway shader knows the body is there: `push` is the signal) —
a vertex-colour brightening by `length(push)` in the whip's material, decaying by nothing (it is instantaneous by
construction). The person should confirm this passes "events only".

### The surface

**16. Rings and foam patches.** The surface shader draws rain crowns from `uRain`; the same idea with eight slots:
`uWake[8]` (x, z, age, strength), set by `splash()` for the player and for creatures — an expanding ring
(`smoothstep` at `2.5·age`, width 0.8) fading over three seconds and a foam patch at the centre for the first second.
Eight uniforms, a dozen ops in the top look. A porpoising fish leaves a wake; a breach leaves a mark you can look back
at. Bubbles (item 13) end in one.

**17. Shore foam.** Where the water is shallow the surface should be white and moving. The surface shader has no ground
height; sampling it per vertex is 37k `sample()` calls a frame (no). Two honest ways: instanced foam quads placed by
the cell along the contour in the band `TIDE − 1 .. TIDE + 0.5` (the strand's own placement rule), animated by `uTime`;
or the far layer's coarse height grid (36 m) as a texture the surface reads — too coarse for a shoreline. The first, in
the surface-interest pass, not here.

**18. Sea mist.** Above water, a dozen wide soft cards at the water line far off, drifting downwind, alpha by a noise
band, fading with the air fog: the "really nice fog in the surface" in the odds and ends. One draw. Part of the same
pass as 17.

### Animation

Everything here is procedural already (the `swimClock`, the chains). What is missing is *secondary* motion, which is
what sells low-poly animation more than any detail on the model:

**19. Squash and stretch.** Scale the body along +z by `1 + s` and across by `1 − s/2`, `s` from an `easer` on
`st.jet` and `st.strike` and from the acceleration (`(spd − lastSpd)/dt`, clamped): a jetter lengthens on the squeeze,
a striker stretches into the lunge, a fish that brakes bulges. Scale a *child* of the builder's group, never `g`
itself — `worldShapes` reads the scale from `g.matrix` for the contact capsules. A line per core in `creatures_spec.js`.
Zero cost.

**20. Banking.** Roll about +z by `−k · yawRate · spd` for anything with fins (and the player): a turning fish leans
into the turn. If this exists under another name, skip it; `player.js` has no roll term today. Zero cost.

**21. The stun shown.** `c.stun` damps velocity and nothing else. A stunned creature lists (a slow roll to ±60°) and
drifts down 0.3 m/s, then rights itself over half a second. A few lines in the pose. Zero cost.

**22. Limp rigs on death.** The chains are already a ragdoll. A creature that dies stops driving its rig, the chain
points take gravity, the body rolls belly-up over two seconds and sinks at 0.5 m/s to `groundAt`, where it lies (the
`lieOn` rule) for forty seconds or until eaten — a `corpse` state with `edible` set, so hunters and grazers come to it.
That last part is an ecology feature dressed as an effect; it is the cheapest way to get a whale fall on the plain
(the ribcage, HANDOFF) *happening* rather than placed. Cheap in code; ask before building the scavenging.

### Combat — low-budget physics

The bite today is an instant hp change, a knockback and a thump. Every entry below is a line or two, and together they
are the difference between "a number changed" and "I hit it":

**23. The flinch.** An impulse into the prey's rig: displace the chain points along the bite direction by `k · (1 −
t/L)` (Verlet: move the point, the constraint pass does the rest) and give the body a spin (`angVel` about a random
axis, damped over a second). The tails and arms whip; the body tumbles.

**24. The flush.** Swap the bitten creature's material to a `MAT_HIT` (a Lambert with a pale grey emissive of 0.12) for
0.15 s and back. Materials are shared and pre-warmed (`warmShaders`), so the swap is free; the geometry is shared by
kind (`KIND_GEO`) and untouched. Not a red flash and not a glow — a flinch of pallor. Under the no-magic rule keep it
faint; the person may strike it.

**25. The bite's own snap.** The player's `P.pulse` exists; add a 0.1 s forward lurch of the body child (item 19's
scale, driven by the bite) and a directional camera nudge *toward* the bite (the shake today is random). On being hurt,
the knockback exists; add the spin and a short FOV kick (2°, 0.2 s — camera.fov, `updateProjectionMatrix`).

**26. Debris.** Silt if either body is within 2 m of the floor (item 12), scraps and the blood puff (item 14), the
wake's flash at night (item 15). All from the same `emit` calls at the bite.

**27. Not hit-stop.** Freezing the frame on a hit is a fighting-game convention; in water with a naturalistic camera it
reads as a stutter. The flinch, the puff and the sound (the audio pass) carry the hit.

### Free, in the DOM

**28. A vignette.** `#vignette`, a radial gradient in `shell.html`, opacity from depth (nothing at the surface, 0.35 at
−200) and from `hurtT`. No render cost at all. Tasteful only if faint; the person decides.

## What not to build, and why, in this game's numbers

- **Shadow maps** — a pass; see Shadows.
- **Post-processing** (SSAO, bloom, depth of field, chromatic aberration, a refraction wobble, colour grading in a
  pass) — a render target (MSAA lost or a resolve added), a full-screen quad, 0.5–1 ms before the effect does anything;
  bloom is out by the rules (nothing glows); the wobble fights flat shading; grading is the fog's job and the fog does
  it per place. Nothing here earns the pass. If one ever does, it is the underwater wobble, and it should be tried as a
  vertex-shader term on the far things first.
- **Ray-marched volumetrics** — 2–4 ms of fill.
- **GPU particles** — at 600 points the CPU integrator is 0.05 ms; the GPU version costs a render target.
- **Decals via render targets** (footprints, bite marks) — the same target. Silt and rings do the job.
- **Screen-space reflections** — the surface's emissive sky is the reflection and it is one colour by the hour.
- **A split water line at the camera** (half air, half water in one frame) — a near-plane slab or a pass; the one-frame
  flip with `camAbove` and `CAM_CLEAR` is the cheap answer and it is verified.
- **A material per creature** for hit feedback — breaks nothing today (each creature is its own draw) but breaks the
  instanced future; the material swap (24) and vertex colours are the way.

## The list, ranked by effect per millisecond

| # | item | what it costs | pass |
|---|---|---|---|
| 1 | caustics | 0.1–0.2 ms fill | A: the light |
| 2 | the sun's shadow of a body | 0.1–0.3 ms fill | A |
| 15 | the bioluminescent wake, the flashing pen | one draw, ~0.02 ms | C: the night |
| 12–14 | silt, bubbles, scraps, blood: the pooled system | one draw, ~0.05 ms | B: the body |
| 23–26 | the flinch, flush, snap, debris at a bite | ~0 | B |
| 19–21 | squash-stretch, banking, the stun shown | ~0 | B |
| 16 | rings and foam on the surface | eight uniforms | B |
| 3 | light shafts | one draw, fill | A |
| 4 | blade translucency | 0 | A |
| 5 | AO at build (terrain cavity, canopy shade, rock sink) | 0 at run | A |
| 7–8 | the sessile pulse, the cards' sway | 0 | A |
| 9 | the chemocline | a few ops | A |
| 22 | limp rigs, corpses | cheap; the scavenging is a mechanic | later |
| 28 | the vignette | 0 | any |
| 6, 10, 11 | rim, turbidity, gloss | fill; taste | trials |
| 17, 18 | shore foam, sea mist | one draw each | the surface pass |

Three passes. **A, the light** (1, 2, 3, 4, 5, 7, 8, 9): one session, all of it shader and build-time, measured in the
forest at (330, 0) before and after, expected under 0.5 ms. **B, the body** (12–14, 16, 19–21, 23–26): one session, one
new file `fx.js` and lines in `player.js`, `creatures_ai.js`, `creatures_spec.js`, `atmosphere.js`; the smoke test
covers the emits. **C, the night** (15): an hour on top of B, needs a night to be seen. Each pass is one version, unseen
until the person looks; the order inside a pass is the table's.

## Decisions (the person, 9 Sep 2026)

1. Caustics on everything by default. 2. Shadows on big creatures too. 3. Light shafts yes — "as long as it's not forced and is
believably based on appropriate water physics". 4. Blood at a bite yes, based on the size and volume of the creature. 5. The wake at
night yes, for now. 6. A, then B, then C. 7. The flush (24) and the vignette (28) off by default.

**Built: pass A as v11.13** — items 1, 2, 3, 4, 5, 7, 8, 9 (DESIGN, The light; CHANGELOG v11.13 for the unseen list). Next: pass B
(12–14, 16, 19–21, 23, 25, 26; 24 off), then C (15).

## Questions (answered above; kept for the record)

1. **Caustics on everything, or the floor and rock only?** On creatures' backs and on the player they are the strongest
   read of being just under the surface; some people find them busy on moving bodies. Everything, by default.
2. **Shadows: the player's only, or the nearest bodies too?** The big thing's shadow over you is the reason to build it;
   it also means the slots go to size, not distance.
3. **Light shafts — yes or no?** The one cliché in the list. They are honest physics, but they are also every screensaver.
4. **Blood at a bite — yes or no?** PLANET fixed the colours; the question is whether a cloud is wanted at all.
5. **The wake at night** — does the snow flashing where a body moves pass "events only"? PLANET's own words say yes;
   confirming, since it is the one glow that would be on screen every night.
6. **Which pass first — A, B or C?** A changes the look of every screenshot; B changes the feel of every fight; C is the
   cheapest and needs the dark. The default is A, then B, then C, with the forest measured after A.
7. **The vignette and the flush (24, 28)** — faint by default, easy to strike; say if either is unwanted on principle.

## Found 13 Sep 2026 — built as v11.33.1

**Rain halves the night, and only the day was ever fixed for it.** The person: night brightness is fine, but rain makes it
"incredibly dark occasionally". It does. Rain enters twice. It inflates cloud cover directly (`world.js weatherAt`: `cover =
0.15 + 1.4*(w-0.32) + 0.5*rain`, clamped at 0.92), and cover then cuts the moon hard in the night branch of `skyL`
(`atmosphere.js updateSky`: `moonL*(1 - 0.7*cover) + STARL`). Fitting the person's own three night readouts to that formula gives
`moonL` 0.294 and `STARL` 0.024, so:

| sky | light |
|---|---|
| clear night (cover 0.30) | 0.256 |
| shower (cover 0.72) | 0.17 |
| full shower (cover 0.92, the clamp) | 0.128 |

**A full shower leaves 50% of a clear night.** By day the same shower leaves 52% of noon — and that is not an accident: v11.18
already fixed exactly this complaint for daylight, replacing a harsh curve with the gentle linear `shade = 1 - 0.30*cover -
0.20*rain` after a shower came out darker than night. The night branch never got the same treatment and still runs the 0.7
coefficient on an already-small `moonL`. **Answered and built (v11.33.1):** the person asked for three quarters. `coverN` in `updateSky` is the cover rain did not put
there, with a gentle 0.15 for the rain itself — a full shower keeps 0.73 of a clear night (0.187 against 0.256) and a clear night is
unchanged to the digit. The moon's beam is untouched: no direct moonlight survives thick cloud. (The "~0.75" above was my arithmetic
slip — the day keeps 52%, not 75%, so the two ratios were already alike; what mattered is that half of noon is grey and half of a
night is unreadable.)

## Raised 13 Sep 2026, not built

**The player's own light (`plight`) in the effects list.** It is a 40 m point light in pale blue-cyan riding a metre above the
player (scene.js), its intensity a depth term plus a night term (atmosphere.js `updateAtmosphere`: `1.3·(1−dfD)² + 0.5·(1−skyL)²`,
times the medium). It is why weed near the player reads lit at night while the floor behind it is black — that was mistaken for a
glow in the 13 Sep look pass and is nothing of the kind. The person: it gives "a kind of atmospheric mood lighting horror vibe" and
it carries the brightness of the starting landscape, and they are unsure whether it is a good mechanic. **The ask, for later:** put
it in the effects list (`FX_LIST`/`FX_DEF` in effects.js, twelve entries today, none of them this) so it can be switched off in
place and the world seen without it — the deep and the night are where it matters. One entry, one default, one gate on the
intensity. Night brightness itself is **not** in question — the person settled that on 13 Sep ("perfectly fine"); this is about
seeing what the light is doing, not about making the dark lighter.

**Answered 15 Sep 2026:** yes — put `plight` on the effects list. And the 13 Sep audit's other four findings are all to be built: the shadow map freed when `shadows` is off, no rain from a clear sky when `clouds` is off, the shimmer sprite replaced with something in the style, the soft shadow edge hardened. Built as v11.52 the same day: `own light` on the list, the map freed, rain under clouds, the penumbra halved (`SHM_PEN`); the shimmer sprite had gone in v11.43.
