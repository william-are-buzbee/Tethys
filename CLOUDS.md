# CLOUDS.md — the sky's clouds and the weather's clocks

Status: **passes A, B and C built as v11.87 (24 Sep 2026), with the low-poly exploration (§5) behind the `near clouds` switch; pass D (§6,
showers with a place) built as v11.88 the same day; the deck as a ray-marched volume (§8) built as v11.89 the same day — the person, on the
stills of v11.87–88: two systems, one clearly 3D and one "a paper you fully color in", that "in combination look worse"; the analysis in §8
and the build, on their full confidence.** The lumps are off by default and the slices are the low tier's; storms proper (§6's last paragraph)
are the next sky pass. Written from the discussion of
23–24 Sep 2026: the person asked whether the sky's several cloud kinds were designed or accreted, what this planet's sky should be and how
it should change by the day, the week and the year, for as much variety as is believable and no more, and how the clouds meet the rest of
the sky. §7 has the person's answers.

## 1. What was there, and what was wrong with it

Three layers, all designed in one pass (v11.17, 10 Sep) and reused since: **cirrus** at 9.5 km on the upper wind with its own slow weather
noise (the stringy ones); the **cumulus deck** at 650–1550 m, five marched slices of one 2D noise lit in three flat steps (the big ones with
dark patches); **scud** under a shower. Not accretion. But two of the things the eye caught were artefacts:

- **The dark patches were contour lines.** Every slice sampled the same noise and thresholded it a little higher, and the "core" darkening was
  a third threshold on the same field: nested thresholds of one map draw a topographic map. v11.17's own second unseen item, never answered.
- **The cirrus was a field of dashes.** One threshold on the fine cross-noise, so half cover gave many short dashes rather than fewer long
  streaks; after sunset the unlit cirrus was drawn lighter than the twilight, a scatter of grey ticks over the stars.

And the weather had one mode. Over the first 185 days: cover 0.1–0.7 for 85% of hours, over 0.8 only under showers (6%), cirrus present 69%
of hours; nothing read the hour of the day, the week or the year but the wind and the shower odds. A shower lifted the whole sky's cover by
0.5 within 40 real seconds, everywhere at once: you never saw one coming.

## 2. What this planet's sky is

The inputs are decided (PLANET.md): 1 g, Earth's radius, ~21% oxygen, a 5300 K star at Earth's insolation, a 27 °C sea, 11.5° N with 15° of
tilt, a 30 h day, a 185-day year, a spin 0.8× Earth's. Earth's cloud physics, so no invented cloud kinds; what differs is the rhythm.

- **The trade-wind sky is the mode.** Subsiding air under an inversion at ~2 km; small cumulus with flat bases at the lifting condensation
  level (~650 m over a warm sea) and tops under the inversion; showers from the odd one grown to congestus. Built in v11.17; this pass makes it
  read (§3).
- **Cloud streets.** A trade wind over a warm sea rolls the boundary layer into counter-rotating tubes along the wind, and the cumulus form in
  rows along it, a few kilometres apart. Built: the field stretched along `WIND_A` while the trades blow, rows `CLD.rowL` 4200 m apart; a calm
  dissolves them (a street needs a wind).
- **The day is long, so its cycle is strong.** Over a tropical ocean cloud and showers peak in the last hours of the night and at dawn — the
  cloud tops cool by radiation all night and the layer destabilises; the sea's own surface hardly warms by day — and thin by mid afternoon.
  Fifteen hours of night deepens that. Built: `weatherAt().day`, +1 at local 5 h, −1 at 20 h, on the cover and the shower odds.
- **Weather comes in waves.** In the trades disturbances pass every three to five days — a day or two of thicker deck and squalls, then
  suppressed clear days. Built: `wave`, −1..1 on a noise with ~4-day features, on the cover, the showers, the wind and the congestus depth.
- **The season is the rain belt's distance.** With the sun south the convergence zone is far and the trades strong and steady: streets, brief
  showers, a clear upper sky. With the sun north the belt comes near 11.5° N: calms, deeper congestus, evening storms over the giant, and
  cirrus as the outflow of that convection. Built: the cirrus is the still season's (present 75% of its hours against 38% of the windy's, mean
  0.40 against 0.12), the congestus deeper (`deep`), the haze whiter with the humidity (`hazeK`). The year is 185 days, so a season is ~46
  days — thirty-one real hours of play; the line's generations see it (LINEAGE.md), one animal sees a few days of it.
- **The giant makes cloud.** Its summit is 900 m, above the 650 m base, in a 7 m/s wind under an inversion: the trades forced up its windward
  flank wear a cap on it all day, swelling through the afternoon as the land heats (Hawaii's windward sides). ARCHIPELAGO.md said "cloud on the
  top"; nothing drew it. Built: a term in the field over the summit, downwind, `CLD_S.cap` 0.22 at night to 0.42 by late afternoon, needing
  the trades; and fixed lumps in front of the summit (§5).
- **The tops spread.** A full deck without rain at the night's end and in the morning spreads its tops flat under the inversion — stratocumulus
  from cumulus, the morning look in the trades. Built: `spread`, the threshold rising less with height.
- **Nothing else belongs.** No sea fog (reasoned at `HAZE`: warm trade air over a warmer sea never saturates), no stratus, no aurora at 11.5°,
  no lenticulars worth drawing at 18 km, no lunar weather (even at 8× tidal force the atmospheric tide is a millibar). Cumulonimbus with
  anvils, lightning and thunder are a still-season event and a pass of their own after D.

## 3. The deck as built (pass A; clouds.js, atmosphere.js `CLOUD_GLSL`)

One field, `cldN(w, f, fz)`, written twice — GLSL for the dome, the sea's topside and the land in air; JavaScript for the beam at the player
and the lumps — from a hash exact in float32 (Ashima's permute: integer products under 2^24), so the GPU and the CPU agree to the pixel. The
field: value noise in three dimensions, the first octave plain (a cloud's outline is a blob), three finer octaves billowed (1−|2n−1|: the
cauliflower inside it), gains 0.5/0.225/0.10/0.045, in the wind's frame (`WA`/`WP`), stretched along the wind by `CLD.street` 0.5 × the
trades, rows `CLD.rowA` 0.07 across it, the tops leaning downwind `CLD.lean` 0.16 per unit height, the vertical scale `CLD.zk` 0.55 (a top is
related to its base, not a copy), plus the caps. The threshold is the field's own quantile of the cover, calibrated at load (`CLD_TH`: 21
quantiles of 6000 samples), so cover 0.4 is four tenths of the sky (`test/sky.js`: 0.149 / 0.469 / 0.749 for 0.15 / 0.45 / 0.75). The
march is as before (`Q.cloud` slices, the threshold rising `CLD.rise` 0.30·fz²), but each slice is its own shape; the thickness darkening is
smooth (`thick`, in place of the contour `core`); the lighting samples the field 180 m toward the luminary (gain 12, doubled as the sun
lowers); a high sun lights the tops, a low one the bases and the sides toward it; the lit colour is the deck's own sunlight `uDeckC`
(the sunlight keyframe at the sun's altitude plus the deck's 0.8° of depression, dimmed 45% at the horizon) while the deck is sunlit
(`uDeckL`, to 0.8° under the horizon) — the undersides amber at sunset, when to v11.86 they went blue-grey as the beam weakened; a silver
lining where thin cloud stands within ~20° of the sun (`fw`, forward scatter); the deck fades out within `CLD.near` 1400–2600 m by `uLump`
where the lumps stand. The cirrus: thresholded on a coarse field (sheets ~20 km along the upper wind, `0.70−0.30·cirrus` over 0.16) for
where it is, a fine one (`0.50–0.76`) for its fibres; unlit it is darker than the twilight (`nt`), under an overcast the grey sky's own colour.

## 4. The sky touches the world (pass C)

- **The beam at the player** (`cloudAt`, atmosphere.js `updateSky`): the deck's base along the luminary from the player, eased over ~0.7 s,
  is `K.cloudHere`; `sunL` and the moon's beam read it (×(1−`CLD_SHADE` 0.85·cloudHere)) in place of cover^1.5 — full sun in a gap, shade as a
  cloud drifts over at the wind's speed; the caustics, the shafts and the shadows follow since they hang off `sunL`. The sky's diffuse light
  still reads the cover. To v11.86 the beam was never full under any cloud in the sky and never shaded.
- **The shadows on the sea and the land** (`cloudSh`, in the fog chunk for every fogged material; `Q.cldSh` 1 desktop / 0 low): the base's
  density along the luminary at the fragment, relative to the shade over the player — the surface multiplies its direct light (the glitter
  and the little diffuse) by the ratio, so the sea under a cloud goes dark and the sea in a gap stays bright while the player stands in shade;
  the land (scene.js `LIGHT_GLSL`, in air) darkens by the beam's share where it stands under more cloud than the player and is left alone
  under less. One 3D noise per fragment in air.
- **The cap** as above.

## 5. The low-poly exploration: the lumps (clouds.js second half; `near clouds` on the effects list)

The person's ask of 24 Sep: the deck is the one thing in the frame that is not low-poly; explore the near clouds as flat-shaded lumps with
real parallax. Built: a pool of `LUMP_N` 24 meshes, each a heap of 14–21 dodecahedra of the kit (detail 1), flattened, packed, their
undersides pressed to one flat base (the condensation level is a plane), countershaded by `merge` (white tops, a grey base), the normals each
puff's own ellipsoid so the deck's three steps band across a puff rather than flashing per facet (the silhouette keeps its facets). Placed at
the field's maxima: every `LUMP_T` 0.5 s the field is scanned on `LUMP_CELL` 300 m cells in its own frame within `LUMP_R` 2400 of the camera
(0.6 ms); a cell above its eight neighbours and `LUMP_MIN` over the threshold is a cloud, keyed by its cell so a lump keeps its cloud as the
world drifts under the field, measured by a walk along and across the wind (`lumpMeasure`, ≥220 m), grown in and out by scale over a few
seconds. Drawn in the horizon pass (the far plane is 1600 m; a cloud a kilometre off at 650 m would clip), lit by the deck's own colours
(`uLmpL`/`uLmpS`, the low sun lighting the bases by `uLmpK.x`), fogged by the air. The giant's cap is five fixed lumps over its summit,
downwind, scaled by the cap's strength, hidden when the camera is within the scan's reach (the scan finds the cap itself then); they stand in
front of the summit, which the dome's deck, drawn behind the land, cannot. Under water the deck draws in full (`uLump` 0). The switch off
restores the deck to the near sky. What it costs: ~2900 triangles a lump, up to 29 lumps.

Seen (24 Sep, the loop driven by hand, `test/render/v87c_*.png`, `v87d_*.png`): at boot (cover 0.53, the trades) streets of cumulus to the
horizon, a low-poly cumulus with banded shading overhead and a long street-ribbon with a grey base; at cover 0.62 a broken deck with lit
tops; at cover 0.08 a few small clouds and blue; the sunset from the sea with the undersides pink and the sea's glow; the cirrus streaking
along the upper wind, sparser than before; from 40 m up the sea darker under a cloud's shadow. Not seen: the cap on the giant from our island
(at 18 km it is under the haze's 7% contrast, as the giant is), the lumps at the crossing of the surface, the deck from under the water, the
lumps in motion on the person's screen, the cost on the 4060.

The judgement, for the person: the lumps read as low-poly clouds when they are the size of a cumulus and shaded in bands; as faceted grey
slabs when a single cloud fills the sky from below (the first cut: 6–9 puffs, flat facets). Whether the near sky should be lumps at all, and
whether the whole deck should some day be lumps (a far field of small ones, instanced), is theirs to say after a look.

## 6. Pass D, built (v11.88): showers with a place

A shower is a cell with a place (clouds.js `SHWR`, `CELLS`, `updateCells`). The weather's rain (`weatherAt().rain`, ~8% of hours, before dawn and
on a disturbed day) is only the trigger now: an episode (its start hour, walked back a quarter hour at a time) births one cell `SHWR.ahead` 6 km
upwind of the player, on a track across the wind hashed from the episode (±`SHWR.band` 4.5 km: most pass beside you, about a quarter over you),
radius 2.2–3.2 km. It is steered along the wind at `SHWR.u` 2.2 × the trades — the flow at 1–3 km that carries a congestus outruns the surface
wind and the deck's drift, so a shower visibly overtakes the cumulus round it — and lives `SHWR.life` 800 real seconds (the deck drifts in
real time; a shower crossing at the game clock's 45× would be a film run fast), growing over 120 s and dying over 220 s; two at once at most (an
episode every ~7 game hours, a cell alive 13 real minutes). Its congestus is a Gaussian bump in the cloud field at its anchor (`cellK`, `CLD.bump`
0.5: the deck thickens there, `T` up to 3× under it, the lumps grow to 3× their height — a tower — and the sea goes dark under it through
`cloudSh`). Its rain at the camera is the cell's profile at the camera's distance (`SHWR.shaft` 0.5 of the radius: the rain shaft is narrower
than the cloud), and the dome draws the shaft as a curtain from the base to the sea (`SKY_FS` `curtain`: the ray's path through a vertical
cylinder, denser toward the axis, fogged to its own distance, the far haze cut behind it; `SHWR.vis` 2500 m hides half). Everything that read
the weather's rain reads the cell's here: the rain and its rings, the patter, the haze, the gust (`windK`), the base's drop, the scud, the sky's
darkening. The bow needs a cell in reach (`cellNear`, within three radii) and stands only on the curtain along the ray or in the rain here. The
cover lifts a quarter near a cell (the weather's own +0.5·rain lift is gone). The lumps stand down as the cover closes (`CLD_S.lump` × smooth
0.82→0.5 of the cover): a broad plateau of cloud gets one lump at its maximum, so under an overcast the near sky was a bare hole — the deck
draws it. A save loaded mid-episode gets no cell (the shower passed).

Seen (`test/render/v88c_*.png`, `v88d_*.png`, a cell placed by hand on the clearest day): from the sea a cell 4 km upwind is a towering lump
over a thickened deck with a grey shaft under its base to the horizon; at 1.8 km the tower fills the sky; over the camera rain, rings on the
sea, a dark ceiling, the beam gone (`sunL` 0.05); passed 2.5 km downwind the sun back, the tower behind; with a low sun and the cell opposite
it the bow arcs over the cell. Not seen: a cell born by the trigger in play and crossing at its own pace (13 real minutes), the curtain at
night, the sound of a shower passing beside you (the patter is the rain here only).

After D — the next sky pass: cumulonimbus in the still season — an anvil spreading downwind at the tropopause (the cirrus), lightning as a light
event, thunder by the distance, a squall line; and a distant shower's hush.

## 7. The person's answers

- **23 Sep 2026:** the four asks — is the layering deliberate; what belongs on this planet by the day, week and year; as much variety as is
  believable and no more; the clouds against the rest of the sky; rain and storms only if they fit.
- **24 Sep 2026:** "Let's explore that direction [the near clouds as low-poly lumps] and let's put D off for the next pass. Go right ahead."
- **24 Sep 2026, on v11.87:** "Wow. Looks awesome. Go ahead on D if you're ready."
- **24 Sep 2026, on the stills of v11.87–88:** the two cloud systems "are not cohesive and in combination look worse"; asked what is believable (one morphing layer that gets visually split, §1–2), whether one could replace the other (§8: the volume replaces the slices; the lumps stand down), and whether a foundational change had been avoided for the low-poly vibe ("quantize the shit out of it until it looks compressed enough" — built as the banded light); "go ahead and implement this", with full confidence.

## 8. The volume (v11.89): one cloud system, marched

**The seam, named.** After v11.88 the sky had two cloud systems drawn two ways: the near lumps, lit as forms, and the far deck, a stack of five
slices of a flat map shaded by its density thresholds. The first read as objects, the second as paper, and the join between them fell at the
wrong distance — a real cumulus changes its look with its angle (a flat grey base overhead, its sides and bumpy top from 5° to 30° up, a
painted band at the horizon), and five slices cannot show a side. The person (24 Sep): is there a foundational change we have been avoiding
for the low-poly vibe — real clouds, quantised until they look compressed enough? Yes: the project already derives everything physically and
shows it stylised (the caustic, the fog, the pigments); the clouds were the one place the rule broke, since they started from a fake, flat
density. The fix is the density.

**Built.** The same field (§3), read as a true 3D density and ray-marched by the dome (atmosphere.js `cloudVol`, `VOL_*`):
- **The noise tiles** (clouds.js `CLD_NOISE_GLSL`, the JavaScript twin): the cell's hash folded into a period per octave (`CLD_ATLAS.per` 16
  base cells, doubling with each octave, a lacunarity of exactly 2), so the field repeats every 20 km and an atlas holds one tile; the
  shadows and the beam at the player use the same tiled noise procedurally (their materials are at WebGL's 16 texture units).
- **The atlas** (`cldBake`, once when the renderer is up): the GPU runs the noise over 32 slices of 256² (8 by 4 in a 2048×1024 half-float
  target, bytes where half float cannot be rendered), the slices from z 0 to 0.6 noise units (the deck's height × `CLD.zk`); read back it
  matches the JavaScript noise to three decimals. `cldFT` reads it with the tile inset a texel from the slice's edge and the height mixed
  between two slices.
- **The density** (`cldDensT`): the field's coordinate at a world point — the wind's frame, the streets' stretch, the lean, the height in the
  *local* deck (`uVolT.x` × (1 + 2·cellK): a shower cell's is deeper), the caps and the cells as in `cldN`, the threshold rising with the
  height — so towers, the giant's cap and a shower's congestus are the volume's own shapes.
- **The march**: the ray's entry and exit of the slab (base to the deepest top; a camera inside it starts at itself — fogged in on the
  giant's summit), up to `Q.vol` 80 steps growing with the distance (`VOL_DT`: the greater of 30 m and 1.8% of the distance) from an
  ordered 4×4 dither of the start (the sky's own dither hides it; a hashed jitter was speckle, a small one bands), to `VOL_FAR` 16 km. The
  transmittance by `VOL_SIG` 1/120 per metre of full density (a 300 m path is 92% opaque). At every step with cloud two samples toward the
  luminary (`VOL_L1` 120, `VOL_L2` 300 m) give the light that reaches it (`VOL_SIGL`).
- **The light, banded after the cloud**: the sun's share is the mean over the ray's cloud, quantised to three steps — terminator lines on a
  form, not contours of a map; the ambient by the mean height in the deck (the base darker, `amb` 0.85–1.15 of a shade that is the sky's
  blue-grey pulled a third toward grey); a low sun lights the bases and the sunward sides on its own, since the light samples from a base
  leave the cloud sideways into clear air; the silver lining stays (forward scatter for thin cloud); the whole fogged toward the horizon by
  the mean distance of what was seen. The old `cloudDeck` stays as the fallback: `Q.vol` 0 (the low tier), no atlas, or the `cloud
  volume` switch off — live, so the two can be compared.
- **The lumps stand down** (`near clouds` off by default; the stored record's version bumped so an old 'on' does not survive): they were
  the second system. The code stays behind the switch.
- The noise's scale went to 1/1000 m (from 1/1250): at half cover one cloud filled the sky overhead; trade cumulus are smaller and more.

**Seen** (`test/render/v89d_*.png`, `v89e_*.png`, the loop driven by hand): boot (cover 0.53, the trades) — cumulus in three tones, white
tops, grey sides, blue-grey bases, forms to the horizon; overhead a cel-shaded volume; the broken deck at 0.62 with lit patches; the sunset
toward the sun as backlit silhouettes with silver rims, away from it as pink-lit faces; the clearest day as small fair-weather cumulus; a
shower cell as a dark plateau with the rain shaft under it; the giant's cap as a bank over its outline from 300 m up; a moonless night as dark
shapes over the stars. The first cut was a solid grey ceiling — a comment swallowed the line that writes the field's uniforms, so the
threshold was 0 — then speckle from a hashed jitter, then stripes from a small one. Cost in the app's pane: within the noise of the frame at
1536×1152 (10.7 against 10.2 ms with the slices); the 4060 at 1600×900 is the number to ask for.

**Open, for the person**: the three bands (`floor(q·3+0.5)/3`) against a smoother light; the clouds' size (`CLD.sc`); whether the low tier
should march at fewer steps or keep the slices; the horizon band (the march ends at 16 km, the old deck faded at 3° — the lowest degrees are
empty of cloud); the cirrus is still the 2D field of v11.87 (a thin layer at 9.5 km needs no volume).
