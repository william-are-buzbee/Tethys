# WATER.md — the sea surface from both sides: audit and proposals (14 Sep 2026)

Status: an audit, nothing built. The person asked for scrutiny of how the game looks through the water from below and at it from
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

**6. Snell's window is a constant colour.** Inside the window the underside is `(0.22,0.46,0.56)·snell` diffuse plus a fixed emissive
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

**B. The real Snell's window: refract the eye and read the sky.** In `SURF_MAT`'s underside branch: `T = refract(−V, N_down, 1/1.33)` in view
space, to world by the fog's `uFogR` (already a uniform), then a *reduced* sky function of `T`: the zenith–horizon gradient (`uZen`, `uHor` by
`T.y`), the sun's glow (`uGlow` toward `uSun`), the luminary's disc, the cover darkening it (`uCover`) — no cloud noise. Past the critical angle
`refract` returns zero: that is the mirror (item C). This gives the rim's bright compressed horizon, the sun's disc wobbling per facet (retire the
shimmer sprite — `SHIM_A`, `sunMesh` — which is a stand-in for exactly this), a sunset or a moon through the window, and the per-facet flip the
person likes comes free, since each facet bends the sky differently. Keep the widened band as a knob on the window's edge softness. Cost:
~30 ALU on the surface's fragments only.

**C. The mirror as the reflected veil.** *Built v11.42.3.* Outside the window: `R = reflect(ray, N)`, a sample point along `R` at `min(reach, distance to the floor
from floorMap)`, the veil `fc` there. Darker over the deep, floor-coloured over a shelf, no glow away from the sun. Fixes 7. Cost: one more `fc`
evaluation on the surface's underside fragments.

**D. Shoaling, breaking and the lee.** The floor's depth is on the GPU (`floorMap.r`, 4 m steps, blurred over ~70 m) and on the CPU (`wmFloor`).
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
