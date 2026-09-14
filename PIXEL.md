# PIXEL.md — the de-res: the world in texels

**Status: designed 14 Sep 2026, the six open questions answered the same day (Decided, at the end), not built.** The ask (the person, 14 Sep, with a screenshot of the pixel light at 20 m): "de-res the
rest of the game … not changing any meshes, just the texture being pixelated to a rough or equivalent size … more Minecraft-like,
pixelated in texture, simple shapes … the ground and objects too, so that the pixel shadow/caustic look matches it." One switch
(`e`), flipping between the world as it is and the world in texels. When a pass builds a section, note it at its head.

Upstream: `DESIGN.md` The light (the pixel light, v11.38: `uPix`, `CAU_PX`), the effects list (effects.js), the materials (scene.js
`addTint`). Downstream of nothing else; it changes no mesh, no world, no physics. PLANET has no say in how a surface is drawn.

## What it is

In the pixel light (v11.38) the caustic and the shadows are drawn in **world-fixed 30 cm blocks with hard edges**: a grid nailed
to the world, a block lit or not. It looked right on its own and wrong on everything else, because everything else is still shaded
smoothly across its facets — a countershaded gradient over a torso, a fog-blended slope. The de-res makes every surface obey the
same rule the light does:

> **In pixel mode a surface's colour is constant over a cell of the texel grid, and the grid is fixed to the thing it is on.**

The world's cells (terrain, rock, structures) are on the world's grid, so they don't swim as the camera moves. A creature's cells
are on its own body, so its skin moves with it. A plant's cells are on its instance. The light's cells stay where they are (the
world), at the same size. What was "my torso is one colour" becomes a torso of texels, each its own colour — and a pattern in them
where the animal has one.

Nothing else changes. The meshes are the meshes: the silhouettes stay crisp, the facets stay flat, the fog stays the fog. It is a
texture swap in the sense the person meant — there are no textures today, the swap is from *interpolated* colour to *cell* colour.
There is no second world, no script that converts anything, no extra memory: it is a shader path behind the same uniform the light
already reads (`uPix`), so the switch is instant both ways, as the light's is.

The reference the person named is Minecraft: texels visible on simple shapes. The grain: "roughly around" the light's 30 cm, "not a
specific measurement". So one size for the world, `PIX_T` 0.3 m, and 0.15 for bodies (`PIX_TB`, decided).

## How — the fragment moves itself to the texel's centre

Every tinted material goes through `addTint` (scene.js) and carries, under `USE_FOG`, the world position `vFogPos` and the light
block. Colour arrives at the fragment already shaded: three's Lambert computes the light per vertex and the vertex colours
(the countershading, the palette) are interpolated across the facet. The texel rule wants that colour *as it is at the cell's
centre*, constant over the cell. The fragment can't re-run the vertex shader — but within a facet every interpolated quantity is
linear, so it can be extrapolated from the fragment to the cell's centre with screen-space derivatives:

- the cell's centre `c` in the grid's space (world for the terrain, object for a body, instance for a plant — a varying `vGrid`,
  the position before `modelMatrix` / `instanceMatrix`, added by `addTint`);
- the offset `d = c − p` in that space; the tangent-plane basis from `dFdx(vGrid)`, `dFdy(vGrid)`; the screen offset `(a, b)`
  that moves by `d` (a 2×2 solve with dot products);
- `col_cell = col + a·dFdx(col) + b·dFdy(col)` — exact for a linear interpolant, ~25 ops.

Applied to `gl_FragColor.rgb` at the head of the tint chunk, before the light block (which snaps itself already) and before the
fog (which stays continuous — the veil is water, not a surface; Minecraft's fog is smooth too). Then the cell's colour is
**posterised** to `PIX_TONES` levels per channel (16) so a gradient across a body reads as bands of tone, as pixel art does, instead
of a smooth ramp sampled coarsely.

The grid is `floor(vGrid / PIX_T)`; a face steeper than ~72° to its own grid axis is handled by choosing the axis pair from the
face normal (a triplanar pick — the same three-way choice a Minecraft block makes: top, side, side), so a wall is tiled on its
wall, not smeared from above.

## The pattern in the texel — pass B

Constant colour per cell is the de-res. A *pattern* per cell is the Minecraft: sand that is three tones of grain, rock with a
speckle and a stratum, a blade with a vein, a body with its coat's stripes or plates. It costs one hash of the cell index and a
small table:

- **A tone step per cell**: hash(cell) → one of {−1, 0, +1} × `PIX_GRAIN` (~6% of luminance), weighted per material class (sand
  heavy, a plant's blade light, a body by its coat). This alone turns a flat cell field into a texture.
- **Material classes** are the materials that exist (scene.js): `TERRAIN_MAT` (sand/mud/rock by the vertex colour's hue — the
  terrain already colours by substrate), `MATROCK/MATROCKB` (rock: strata by world height, `vWy`, a stripe every ~1.2 m), the sway
  materials (blades: a vein along the growth axis — the sway shader knows `hw`), `MAT/MATBIG` (bodies), `MATFAR` (the cards: the
  same as the plants they stand for), `GLOW` (untouched).
- **Bodies**: the spec's coat (`creatures_spec.js` `coatFor`, the `coat` key per species) gains a `pattern`: `none | stripes |
  spots | plates | scales`, a `scale` (cells per period) and a `tone`. Stripes are along the body's z (every creature faces +z),
  spots a hashed cell picked by threshold, plates a coarser grid (2–3 cells) with a darker seam, scales a brick offset. Drawn in
  body space, so they stay on the animal. The lab (`#lab`, the coat tab) gets the three controls; `test/preview.js PIX=1` draws
  them — the software Lambert render implements the same snap and pattern in JS, so a skin can be looked at without the game.
- **Countershading survives**: it is in the vertex colour, the extrapolation keeps it, the posterisation bands it. A pale belly
  is a pale band of texels.

## What each system does in pixel mode

| system | pixel mode |
|---|---|
| terrain, rock, structures, landmarks | world grid, `PIX_T`; rock strata by height; sand grain |
| creatures (all materials, LOD bakes, the lab's, the menu's, the bestiary's) | body grid (`PIX_TB`); the coat's pattern; the ghost body still casts |
| flora (instanced, sway, variants) | instance grid; the blade's vein; the collapse trick untouched (a collapsed vertex draws nothing) |
| far cards (`MATFAR`) | as the plant they stand for, so the hand-off at `FLORA_FAR` stays quiet |
| the caustic, the shadows | as v11.38 already: world blocks `CAU_PX`, hard edges — `PIX_T` and `CAU_PX` become one knob |
| the fog, the veil, the mist, the dome | continuous — water is not a surface |
| the sea surface | texelised: its colour on the world's xz grid at `PIX_T`, the wave shape untouched (decided 14 Sep; pass C) |
| the sky, sun, moon, stars, clouds | untouched (the cloud deck's three-step light already is the posterisation) |
| marine snow, rain, blood, ink, splashes | points and lines: already pixels; untouched |
| the shimmer (`sunMesh`) | hidden in pixel mode — a canvas radial gradient has no cells; the surface's glint carries the sun |
| the HUD, the menu, the lists | DOM; a pixel font in pixel mode (decided 14 Sep; pass C) |
| the framebuffer | native by default; `pixel screen`, its own effects row, renders at a quarter with hard pixels (decided 14 Sep; pass C) |

## Knobs

`PIX_T` 0.3 (the world's texel, m; = `CAU_PX`), `PIX_TB` 0.15 (bodies), `PIX_TONES` 16 (levels per channel after the snap),
`PIX_GRAIN` 0.06 (the tone step), per-class grain weights in a table `PIX_CLASS`, the coats' `pattern/scale/tone`. One switch on the
effects list: `pixel light` becomes `pixel` — the light and the world together; the two never make sense apart once this exists.

## Cost

Fill only: ~40 ops a fragment more (the extrapolation, the hash, the posterise), in shaders that already exist. Fill is nearly free
here (AUDIT; the light block was the same argument). No new geometry, no textures, no render target, no memory. The vertex stage
gains one varying (`vGrid`). Off, the branch is a uniform test. A phone loses nothing.

## Passes

- **A — the de-res.** `vGrid` and the snap-to-centre in `addTint`, the triplanar axis pick, the posterise; `PIX_T` = `CAU_PX`; the
  switch renamed; the shimmer hidden. Everything becomes cells of flat colour at the light's grain. Look: the shelf, a body up close,
  a slope, a blade — does anything swim, does anything band wrongly. `test/smoke.js` with the switch on; `test/lint.js`.
- **B — the texels' pattern.** The grain hash and the class table; rock strata, sand grain, the vein; the coats' `pattern` in the
  spec, the lab's controls, `test/preview.js PIX=1`. Look at every species in the bestiary.
- **C — the edges.** the sea surface's colour, the pixel font, the `pixel screen` row (all decided 14 Sep), the
  far terrain's coarse mesh (`far.js`) getting the same grid so the near/far seam doesn't show two grains.

## Decided 14 Sep 2026 — the person's answers

1. **The bodies' texel: 0.15 m** (`PIX_TB`). The world's stays 0.3 (= `CAU_PX`).
2. **The sea surface: texelised** — its colour on the world's xz grid at `PIX_T`; the wave shape stays. Pass C.
3. **A low-res framebuffer layer: yes, as its own row on the effects list** (`pixel screen`: render at a quarter, scale with hard
   pixels). Off by default; it pixelates the silhouettes, which `pixel` alone keeps crisp. Pass C.
4. **A pixel font: yes** — the HUD, the menu and the lists in pixel mode. Pass C.
5. **Patterns: by rule by default, and the player can paint their own.** `coatFor` gives every species a pattern by clade
   (ringmouths spots, slowbloods stripes, hingeshells plates, drifters none); the lab's coat tab gets the three controls and a
   **custom** option that opens a texel painter — the body's texel grid unwrapped part by part, painted cell by cell, saved in the
   spec (`coat.pixels`, run-length, in the export/hash/share path like everything else in the spec). Pass B for the rule and the
   controls; the painter is pass D.
6. **The fog: continuous.**

## Passes, as decided

- **A — the de-res** (above). **B — the pattern by rule**, the lab's controls, `test/preview.js PIX=1`. **C — the edges**: the sea
  surface, the pixel font, the `pixel screen` row, the far terrain's grid. **D — the painter**: custom coats cell by cell in the lab,
  in the spec, shared like a spec.
