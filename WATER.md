# WATER.md — the sea surface from both sides: audit and proposals (14 Sep 2026)

Status: Part 1–2 the 14 Sep audit (A, B, C, D and H built as v11.42–v11.44); Part 3 (14 Sep, later) the line from above — built as v11.45 and v11.46; nothing in this file is left unbuilt. The person asked for scrutiny of how the game looks through the water from below and at it from
above, then a brainstorm of believable additions. Read with DESIGN *The surface*, *Visibility*, *The medium*, and POLISH's
"What not to build". Files: atmosphere.js (the surface block, `updateAtmosphere`), scene.js (the fog chunk, `WAVE_GLSL`, `addTint`),
world.js (`WAVES`, `waveH`, `WCOL`, `SEA_FOG`, `AIR`), player.js (`camAbove`, `CAM_CLEAR`, `splash`), far.js (the water and floor maps).

The person's four screenshots (14 Sep): two from just under the surface over the shelf's forest, two from above it (one at the
surface, one from ~15 m up). What they show is used as evidence below.

## Part 1 — what is wrong, confused or thin

Ordered by how much it matters, not by how hard it is.

**1. The swell runs against the wind (a bug).** `WIND_A` 3.49 is the direction the wind *travels toward*; PLANET (Wind and
current) says the waves strike the flank at 0.35, i.e. they travel toward 3.49. `WAVES[0]` — the 46 m, 0.5 m swell, the biggest
component — has direction 0.35: the phase is `dot(p,dir)·k − ω·t`, which travels toward `+dir`, so the swell runs dead upwind
(180° off) and strikes the lee shore, the flats. The others fan: 29 m at −128°, 15 m at −51°, 8.5 m at +46°, 6 m at +115°. Meanwhile
the caustic's ripple trains (`CAU_RINGS`, spread ±1.2 rad round `WIND_A`) go *with* the wind, as does the fume's plume, the spray field
(`expoW`) and the sand of the flats. So from below the light net on the floor marches one way and the bands of the surface overhead
march the other; from above the whitecaps' sea and the swell disagree. A wind sea's short waves should sit within ~±35° of the wind
and the swell within ~±15° of it (or of one far storm). Fix: the five directions in `WAVES`, nothing else. Zero cost, zero risk;
the physics and both shaders read the same table.

**2. From above, submerged things are fogged as air.** The fog is the *camera's* medium (`FOG_P[3]`, `applyFog`): with the camera in
air a kelp stalk 300 m off at 4 m depth takes the air haze (53% toward the sky's horizon colour) and a depth tint of 18%
(`1−exp(−0.05·4)`), and is otherwise drawn crisp. Through water the same ray would be 91% gone into the water's colour. The tint
knows only the vertical depth under the tide (`uTint.x − vWy`), never how far the ray ran *in* the water, and it mixes toward one
constant (`TINT_COL`), not the water map's colour of the place. Screenshot 3 is this: the forest is readable to the horizon through
the sea, a diorama under glass. Screenshot 4 from 15 m up: the seabed 60 m off as sharp as the seabed under the camera. This is the
single largest believability gap from above: real water gives you 20–40 m into it and then its own colour, and the loss of the far
seabed is what says "deep".

**3. The water column is painted twice from above, and neither painting knows the depth of the floor.** The topside surface draws a
dark diffuse body colour (`0x123a4c`, lit by the sun, opacity 0.66) *and* every fragment beneath is tinted toward `TINT_COL` by its
depth. A 0.5 m sand flat and a 30 m shelf both wear the surface's 66% teal, so the shallows cannot read sand-coloured and the lagoon
cannot read glassy; the tint underneath, which does know depth, is mostly hidden behind the surface's own colour. In screenshot 3 the
water is one blue over the beach at right and over the forest. Physically the surface contributes a reflection (Fresnel) and foam;
the colour of the water is the column's, which is the tint's job (and item 2's).

**4. Foam is by height, not steepness.** `fm = smoothstep(0.62,0.98, vH/uAmp)`: a facet goes 85% white wherever the 46 m and 29 m
swells add past 0.73 m. Those swells have steepness `ak` 0.07 — they never break. So a gentle sea grows slabs of white several metres
across, in whole flat triangles, in the swell's rhythm; the wind sea (the three short components, which *are* the ones that whitecap)
has no say, though `SEA_CHOP` already kills the spray in a calm on exactly that argument. The pale slab with hard triangular edges at
the bottom right of screenshots 3 and 4 is either this or item 5 — to confirm in play by dropping `fm` to 0; both are per-facet.

**5. The specular is per facet.** Blinn-Phong shininess 90 on a flat-shaded facet 1–10 m across saturates the whole triangle when the
half-vector aligns, so the sun on the water is a scatter of white triangles, not glitter. The rest of the low-poly look survives flat
facets; the glitter path does not, because glitter is sub-facet by nature (ripple slopes of a few degrees over centimetres).

**6. Snell's window is a constant colour.** *v11.43 built the refracted sky; v11.49 the clouds through it and the sun once, not per facet; v11.50 the window a switch, off — the underside translucent over the dome by default, the person's call.* Inside the window the underside is `(0.22,0.46,0.56)·snell` diffuse plus a fixed emissive
`× uWin`; the sky sphere is hidden under water (`sky.visible = above`). The physical window — the whole sky compressed into a 97° cone,
the horizon's bright band at the rim, the sun's disc smeared by each facet, clouds and a sunset if there is one — is not there; the sun's
presence is stood in for by a 90 m additive sprite 1.5 m over the surface (`sunMesh`, `SHIM_A`) and a `pow(…,40)` glint. At dusk the
window is the day's teal times a warm tint. The window is also widened from the physical 48.6° to a soft 49–75° band
(`smoothstep(0.25,0.65,cv)`), which is a look the person chose (v11.7) and should stay a knob.

**7. The total-internal-reflection mirror reflects the camera's veil.** Outside the window the emissive is `fogColor·0.9` — the
lagged CPU sample at the camera. A mirror shows the water in the *reflected* direction: looking up at 60° from vertical you see the water
60° down — darker than the horizon veil over deep water, the floor's colour over a shallow floor, and dark in the sun's azimuth (the
reflected ray points away from the sun). The fog chunk already computes the veil for an arbitrary ray (`fc`: `wcol` at the sample
depth, the floor map, daylight, the sun term); the mirror is that function on the reflected ray.

**8. Night is counted twice in the window.** Emissive `(0.16,0.34,0.42)·uWin·(0.35+0.65·uDf)`: `uWin = tint·skyL` and
`uDf = dfD·skyLw`, so the sky's light enters as a product. Moonless (`skyL` 0.035): 0.035·(0.35+0.65·0.035) ≈ 0.013, a third of
what one count gives. And the surface fragment is also fogged by its distance under water, so depth dims it a third time. Probably a
look; if the window is too dark at night, this is why.

**9. Deep-water waves everywhere.** `ω = √(gk)` with no depth term; the same 1.17 m sea passes over a 0.3 m sand flat, inside the
lagoon (the `shel` field) and over the 450 m deep as over the open shelf. No shoaling (waves rising and shortening as the floor comes
up), no refraction toward the shore, no breaking, no lee, no surf line — though PLANET's exposed flank has "surf, cones, stirred sand"
and the spray haze (`HAZE.spray · expo²`) already assumes surf there. On the strand, puddles appear and vanish with the wave sum instead of
a swash running up the sand. This is the biggest gap in the water's own behaviour, and it is where the sea would tell the geology.

**10. The sea is short.** The longest wave is 46 m: period 5.4 s. A trade-wind ocean swell is 8–12 s (100–220 m). Past ~260 m the sea
is drawn flat (the grid's fade), so the far sea never moves; from below, the surface has chop and no heave. The grid could carry a
150 m wave to ~700 m (7 samples at 21 m spacing). Screenshots 1–2: the far surface is a flat quilt.

**11. The breach leaves nothing.** `splash` throws 28 white points for 1.1 s; no foam patch on the surface, no bubble cloud under it,
seen from either side. A 3 m animal through the surface leaves both for several seconds.

**12. Smaller things.**
- DESIGN *Waves* says the crest sharpening puts the mean "at about −0.3"; it is `WSH_MEAN` −0.195 (checked: −0.1951).
- `uSkyR` = 0.85·horizon + 0.2·zenith: weights sum 1.05, the reflected sky 5% brighter than the sky. And it is one colour for every
  view direction: from a height looking steeply down the reflection should be the darker zenith, at grazing the pale horizon — that is why
  water is deep blue from a cliff and pale from a beach.
- The refracted glint uses eta 1.25 (`refract(-V,-normal,1.25)`) where `cauFocus` and `SUN_W` use 1.33. A knob, documented, but the
  glint's window rim and the caustic's refracted sun disagree by a few degrees.
- Rain is topside only (`uRain` rings); from below a shower should matte the window and speckle it, and it is loud.
- Low tier: `SSTEP` 1.3 m under the camera resolves the 6 m chop for only the nearest ~5 m; the chop is effectively absent on low. Not a
  bug; a note for what the phone sees.
- The far surface under the water dome: dome at 0.95·FAR, surface to 1.05·FAR, both past `FOG_CUT1` — pure veil, fine. Depth is written by the
  surface; where a near-flat beach meets the surface at a grazing angle the intersection may z-fight as the wave passes. Unverified; look at the
  strand at mid-tide.
- `wasAbove = null` snaps the first frame; `applyFog` runs every frame above (rain) and once per crossing below. Correct.
- The camera model (`camAbove`, `CAM_DWELL`, `CAM_CLEAR`) is sound: hysteresis, the camera held clear of the wave at its own x,z, above the near
  plane's half-height (0.14 at 0.2). No fault found.
- The window branch's `normal = −normal` and the refract's `−normal` are consistent (flat normals face the viewer in r128); the diffuse inside the
  window is then sun-lit from above, as intended.

## Part 2 — proposals, by believability per millisecond

Every one of these keeps the rule: nothing that is not the physics of water, air and light. Cost notes assume AUDIT's finding that fill is
nearly free and vertices are the frame.

**A. Two-segment fog: the water's share of the ray, from above.** *Built v11.42–v11.42.3; the water's part is fogged over the whole ray from above (v11.42.1), and the chop's scatter at grazing (`SCAT`) was added.* In `addTint`'s block, when `uTint.y > 0.5` and `vWy < uTint.x`: the ray
from the camera `uFogC` to `vFogPos` crosses `y = TIDE` at `s = (uFogC.y − TIDE)/(uFogC.y − vFogPos.y)`; the water path is `d·(1−s)`. Apply
the sea's extinction over that path and mix toward the veil for the water part (the fog chunk's `fc`: `wcol` at the fragment's depth, the water
map's colour of the place, daylight at that depth), then the air fog over the air part as now. Refraction shortens the water path by up to ~25%
at grazing; fold it in as a scale or ignore it. **Then** cut the surface's topside body colour to nothing and let its alpha be Fresnel + foam.
Result: the shallows clear over sand, the shelf blue, the lagoon glassy, the far seabed dissolved into the water's colour, and the lagoon and the
open shelf differing from above as they do from below. Fixes 2 and 3 together. Cost: ~12 ALU per tinted fragment, above water only. The
biggest change to the sea's look from above; needs the person's eye at the shore, over the forest, from the cone.

**B. The real Snell's window: refract the eye and read the sky.** *Built v11.43.* In `SURF_MAT`'s underside branch: `T = refract(−V, N_down, 1/1.33)` in view
space, to world by the fog's `uFogR` (already a uniform), then a *reduced* sky function of `T`: the zenith–horizon gradient (`uZen`, `uHor` by
`T.y`), the sun's glow (`uGlow` toward `uSun`), the luminary's disc, the cover darkening it (`uCover`) — no cloud noise. Past the critical angle
`refract` returns zero: that is the mirror (item C). This gives the rim's bright compressed horizon, the sun's disc wobbling per facet (retire the
shimmer sprite — `SHIM_A`, `sunMesh` — which is a stand-in for exactly this), a sunset or a moon through the window, and the per-facet flip the
person likes comes free, since each facet bends the sky differently. Keep the widened band as a knob on the window's edge softness. Cost:
~30 ALU on the surface's fragments only.

**C. The mirror as the reflected veil.** *Built v11.42.3.* Outside the window: `R = reflect(ray, N)`, a sample point along `R` at `min(reach, distance to the floor
from floorMap)`, the veil `fc` there. Darker over the deep, floor-coloured over a shelf, no glow away from the sun. Fixes 7. Cost: one more `fc`
evaluation on the surface's underside fragments.

**D. Shoaling, breaking and the lee.** *Built v11.44 (no wavelength shortening; the map's blur sets the surf band's width).* The floor's depth is on the GPU (`floorMap.r`, 4 m steps, blurred over ~70 m) and on the CPU (`wmFloor`).
Per component, with `d` the local depth: amplitude by Green's law `(d0/d)^¼` (capped), wavenumber from `ω² = gk·tanh(kd)` (shorter, steeper
inshore — a two-term approximation is enough), and breaking where `H > 0.78·d`: foam and a lowered crest. Shelter: the lagoon's `shel` and the
wind exposure `expo` are fields of `sample()`; write one of them into a free channel of `floorMap` (g or b) at `wmFill` and scale the wind sea by
it (the lagoon 0.3×, the lee 0.6×, the struck flank 1×); the swell wraps and keeps most of its height. The JS `waveH` must read the same factors
(one `wmFloor` sample, cheap) so `sub`, the strand and the splashes agree with the picture. For the last metres at the beach the map is too coarse:
the inner ring of the surface grid (~40×40 vertices within 30 m) can carry an `aFloor` attribute from the loaded cell's 49×49 height grid,
refreshed every few frames. Gives: a surf line on the exposed flank with a moving white strip, a calm lagoon, swash on the strand, waves that slow
and bunch as the floor rises — the sea telling the shield's shape. The caustic's swell carry (`cauFocus`) reads `WAVES` and would follow. Medium
cost; touches physics, two shaders and the maps. The biggest believability step available in the water itself.

**E. Foam by steepness, with streaks.** Foam from the *short* components' local curvature (the second derivative of the chop's sum is analytic in
the vertex shader) × `SEA_CHOP`², broken up by a world-space hash, with a short streak downwind and a slow decay so a whitecap outlives its crest;
seen from below as a pale grey patch in the window. Thin lines at crests, not slabs. Fixes 4. Small cost.

**F. Sub-facet glitter.** Perturb the normal in the fragment for the *specular term only* by the baked ripple field the caustic already uses
(`CAU_TEX`, world-space, wind-aligned — "the ripple layer that lives only in the light", PLANET 14 Sep); diffuse, window and Fresnel stay per facet.
Gives a glitter path toward a low sun and a broken, sparkling highlight at noon instead of white triangles. Fixes 5. The surface mesh still holds
no ripples; it is lit by them, which is the PLANET rule as written. Small cost.

**G. A long swell.** One more component, ~150 m and 0.3–0.35 m (period 9.8 s), in the wind's direction or a far storm's within ±0.3 rad of it.
Drawn to ~700 m, so the far sea heaves and the surface from below has the slow rise and fall that reads as ocean. Fixes 10. Cost: one more term in
every wave sum — the physics per creature (cheap), the surface, and the sway shader's `cap` and the rafts' bob (`WAVE_GLSL` per vertex; check the
weed forest's 3.2 ms on the 4060 before and after).

**H. Wave directions.** *Built v11.42.* Item 1's fix: swell within ±0.2 rad of `WIND_A`, the wind sea within ±0.6, and the phases re-rolled. Do this first; it is
five numbers.

**I. Breach residue.** A foam disc on the surface where a body crossed (a small sprite in the surface's render order, growing and fading over
~6 s, drawn on the topside look and as a grey patch on the underside) and a bubble puff below it (the snow already has a rising kind; spawn a burst
of it at the crossing). Fixes 11. Small cost; the same hook serves creatures within 160 m.

**J. The topside reflection by direction.** Replace the constant `uSkyR` with the reduced sky function of `reflect(V, N)` from B: zenith-blue
looking down from a height, horizon-pale at grazing, the sun's glow spot smeared into a path by the facets (and by F's ripple normals). The
island itself is not reflected — screen-space reflections are out by POLISH, and at this fog the loss is small. Fixes the second bullet of 12.

**K. Rain from below.** `uRain` in the underside branch: the window's specular matted, a fine speckle of impact rings seen through it. Small.

**L. Questions raised, not answered here.**
- POLISH struck the half-in-half-out camera as "a near-plane slab or a pass". With A built, the medium is decided per fragment by the ray's
  crossing, not per camera, and the split becomes a plane test: the camera could sit on the line. The person struck it on cost; the cost
  changes with A. Their call, later.
- The sea is a wind sea plus swell "from far away" (`SEA_CHOP` keeps the swell in a calm). Whose storm? A swell direction that is not the trades'
  is legitimate and would give two crossing wave systems, which real coasts have. PLANET's call.

## What to ask the person to look at, in order

1. **H** (the directions) — no risk; confirm from below that the surface's bands and the floor's light net now travel together.
2. **A** with the surface's body colour removed — the shore from the water's edge, the forest from 15 m up (screenshots 3 and 4 again),
   the lagoon from the rim at noon and at dusk. This is the sea from above, rebuilt; everything else from above sits on it.
3. **B + C** — from 2 m under at noon (the sun's disc through the window), at sunset, under the moon; whether the shimmer sprite is missed.
4. **D** — the exposed flank at high spring, the lagoon in a wind, the strand at mid-tide.
5. **E, F, G, I, J, K** as polish, one at a time.

## Part 3 — the line from above (14 Sep 2026, second audit; P1, P2, P4, P6 and G built as v11.45; P3, P5 and E, I, K as v11.46 — everything in this file is built)

The person's ask, after v11.44: the water line seen from above — good when something stands in the distance (the kelp's tops, a shore:
"like Wind Waker"), odd for depth perception over open water. Measured in the app's browser at 1280×720 with the loop stepped by hand
(CLAUDE.md, Look at it), the player held at (1500, h, 0) over deep water at 11 h (cover 0.44, the sun at 41° in the east), looking north
(80° off the sun), east (into it) and west; the frames are `test/render/hz_*.png`. Read with DESIGN *The surface*, *The sky*, *Visibility*.

**What the line is made of.** Down the screen's centre column at h = 15, looking north:

| where | rows (of 720) | colour | what draws it |
|---|---|---|---|
| sky 4° up | 316 | 165,183,199 | the dome: `mix(hor,zen,k)·(0.92+0.10cs²)`, the haze band 15% |
| sky at the line | 364 | 180,196,208 | the same, the haze band 62% toward `MIST_C` |
| the sea's edge | 378 | **183,201,216** | the surface at the far cut: `uFogAC` = `K.hor` exactly |
| sea 1° under the line | 388 | 159,190,210 | the surface, the air fog 93% |
| sea 3° under | 412 | 128,166,190 | the surface, Fresnel + the constant `uSkyR` + fog |
| sea at the bottom | 712 | 28,62,83 | the seen-through column, `UPWELL` |

Three things follow. **(1) The sea's edge is the brightest row of the lower half.** Every fragment in air converges to the one constant
`uFogAC` (the horizon keyframe) by `FOG_CUT1`; the dome never shows that colour — its horizon is the keyframe darkened by the Rayleigh factor
and the zenith mix, then lifted part-way by the haze band, and only toward the sun lifted past it by the glow. So away from the sun the sea's
far edge is a pale rim under a darker sky, and toward the sun the same edge is dark under a glowing sky: the line inverts with the azimuth.
Under water this was fixed in v11.27 — past the cut every fragment is the veil *in that direction* — and in air it was not: the air's far colour
is a constant, the dome is a function. In nature the sea at the horizon is always a little darker than the sky touching it (it reflects the sky
a few degrees up, at R < 1, over dark upwelling water). **(2) The pale rim is the far-cut band, 992–1440 m, and it is fixed in world distance,
so its angular width grows with height:** a thread from 1 m, a 1° rim from 15 m, a 2–3° band from 40 m — at 40 m (`hz_40n.png`) there is no
line at all, the sea dissolves into a white haze with the sky. A real horizon from 40 m is 23 km off and still a line. The rim's width is what
the eye reads as a height and a distance, and both are wrong. **(3) Between ~100 m and the rim nothing varies but the fog.** The reflection
`uSkyR` is one colour for every direction (Part 1, item 12); the Fresnel weight is judged against the mean normal (v11.7), and the dark
diffuse is scaled away by it, so a facet's tilt changes nothing of the topside away from the sun — the flat-shaded sea has no facets from
above; and every wave the grid cannot carry is faded to its mean by 260 m. The two cues a sea gives for distance — the rows of crests
converging, and the reflection going from the zenith's dark near the feet to the horizon's pale far off — are both absent; only aerial
perspective is there, and `AIR.dens` 0.003 saturates it by ~500 m, so two thirds of the sea's screen span is one flat colour ending in a rim.
Toward the sun (`hz_15_yawM.png`) the per-facet specular is five grey bars (item 5). With the kelp's tops or a shore in view
(`hz_forest_w.png`, the person's second still) the line reads, because the crossing things give the eye the scale the sea does not.

**Also seen.** From a camera at 0.5 m in a trough (`hz_1n_down.png`) the near crest's back face fills the bottom of the view as a flat dark
opaque slab with a hard straight edge (the v11.5 water-body branch, `!gl_FrontFacing&&uUnder<0.5`). It is the water column seen through the
crest and should be the column's colour — the veil along the refracted ray, as the two-segment fog paints the seabed — not black plus a constant.

**Proposals, in the order to build.** All physical; none adds vertices.

- **P2 — the reflection by direction (item J).** Replace `uSkyR` with `skyLite(reflect(rd, N_facet))`: the reduced sky is already in
  `SURF_MAT`'s fragment for the window, and the underside already builds the world-space facet normal. Near the feet the sea reflects the
  zenith (dark blue), far off the horizon (pale): the reflection gradient. Per facet the reflected ray swings by twice the slope — the swell's
  4° puts a front and a back slope 8° apart in the sky, which near the horizon (where the gradient is steep) is a visible tone step and near the
  camera is not: facets that strengthen with distance, rows converging to the horizon out to the wave fade, at zero vertex cost, and the
  low-poly sea from above at last. Keep the Fresnel *weight* on the mean normal (`vNup`, the v11.7 rule: the wedges were the weight swinging,
  not the direction); a knob blending the facet normal toward the mean at grazing if the steps are too hard. And the line: at grazing the sea
  reflects the sky 2–8° up, which is darker than the horizon's haze band — a dark sea line under the pale sky, as it is everywhere on Earth,
  deeper in a wind sea and vanishing in a flat calm. Cost: one `skyLite` on the topside's fragments (the underside pays it now).
- **P1 — the air's far colour is the sky's, by direction.** The rule the veil has had since v11.27, for air: `fogAir` mixes toward
  `skyLite(rd)` plus `mistFar` in that direction instead of `uFogAC`. The far sea, the far kelp cards, the far shore and the apron all end in
  the sky behind them — the rim goes at every height, the seam's inversion goes, the far sea toward the sun takes the glow. Needs the sky's
  nine uniforms shared through `ShaderLib` like the mist's and `skyLite` moved to the fog chunk (the surface then takes it from there).
  Cost: ~25 ALU per fragment in air, no noise. Fixes (1) and (2); P2 gives the line its dark side, P1 makes the rim invisible — build P2
  first to see the sea, P1 second to see it end.
- **P3 — rows to the horizon.** The far sea is flat past 260 m. Either G (a long swell, drawn to ~700 m) or the swell's *slope* kept in the
  light past the mesh's fade: the wave sum's derivative is analytic, so a facet can tilt its reflection by the swell it no longer carries in
  height (PLANET's "the ripple layer lives only in the light", for distance), faded by the phase's screen-space rate (`fwidth`) so it never
  aliases — the 46 m swell is half a pixel a wavelength by 1 km from 15 m. Second.
- **P5 — sub-facet glitter (F)** for the sun's side; and **P4 — the near slab**: the back face from air as the column's veil. Small, later.
- **P6 — the air.** `AIR.dens` 0.003 (63% at 333 m) is "a hazy coast" chosen so the world's edge merged into the sky. With P1 the sea ends in
  the sky whatever the density, so the day could be clearer (0.0012–0.0015: visibility ~1 km, the far kelp readable at 800 m) without
  exposing an edge; the island's far terrain at the far plane would then show its cut against the sky and needs the same P1 convergence,
  which it gets. The person's call — the haze is part of the look.

**To ask the person.** (a) A darker sea than the sky at the line — the natural look, P2 — or keep the pale edge? (b) Facets from above:
P2 makes the swell's rows visible away from the sun, tone-stepped, strongest far off; is that the sea they want, or should the topside stay
smooth? (c) The air: keep the hazy coast or a clearer day once P1 lets the sea end in the sky? (d) A long swell, G, and whose storm (Part 2, L).
