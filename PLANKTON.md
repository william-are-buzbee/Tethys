# PLANKTON.md — the water's own life: the field, the day, the year, the colour and the swarm

**Status: pass 1 built as v11.81 (22 Sep 2026) — the field (`plank`), the three kinds through the veil, the front ring by the tide, the storm's pulse, the canopy strip of §12; the bloom map went into the water and floor maps' free channels (the shaders were at 16 texture units); v11.81.1 turned the green down after the person's look. Pass 2 built as v11.82 (22 Sep): the snow's `live` off the field, its colour by kind, the chain kind. Pass 3 built as v11.83 (22 Sep): the tilt, `YEAR_D` 185, the seasonal wind, the mixed layer and the crops by season — less §5's migration, which goes with the swarms (pass 4: the snow's live kind is the crop, and the crop does not migrate). The ledger does not read the season (the census stands); the swarms will. Pass 4 built as v11.84 (22 Sep): the swarms as ledger records with the day's rise (§5, §10), drawn from the snow's budget. Pass 5 built as v11.85 (23 Sep): filter feeding — the sieve off the build (`derive.filter`), the swarms mortal and the filter feeders' paper prey, the stomach fed through a swarm, not by a bite (§11). Pass 6 designed, not built; the year's length answered 22 Sep (§15: ~185 days).** Written from a discussion of 22 Sep about marine snow — the person: marine snow is
"one of the more important effects in the game visually for keeping orientation, space and size disparity intact", and refining it
asks the microbial question. This doc answers it once for the whole game: what lives in the water, what decides it, what it does to
the light, and how much of it the simulation actually carries. Upstream: `PLANET.md` (the chemocline, the upwelling, the trades, the
moon), `TAXA.md` (the three planktonic pigment kinds the sessile lines descend from), `DIRECTION.md` (the loop). Downstream when
built: `world.js` (the field, the season, the water's colour), `atmosphere.js` (the snow, the swarms), `ecology.js` (the crop as a
ledger entry, filter feeders' food), `creatures_defs.js` (what eats it), `player.js` (filter feeding, the stomach).

The rule of 8 Sep applies as everywhere: no biomes, no magic, nothing named. Every term below is derived from the light, the
nutrients, the mixing and the founder lines. Three drivers the person asked about are deliberately **cut**: conductivity, pH and
radiation. Salinity is uniform in an ocean with no rivers; pH only moves inside a vent's plume, where the snow already has its own
chemistry; ionising radiation is not a plankton driver at any depth a swimmer reaches. Naming them in the code would be decoration.

---

## 1. What is wrong now

- **The green water near the man-o'-war is a ghost.** It is `canopyW` (`world.js:384`) — three patches in the seamount's wake, placed
  for the surface rafts, which were struck on 9 Sep 2026 ("looks terrible"). The mask stayed and still tints the water
  `WATER_CANOPY` (`scene.js:182`, `atmosphere.js:535`), darkens the floor 22% (`chunks.js:74`), thickens the snow's floc, sets flora
  density through `canopyPer`, and places the sailer fleets (`chunks.js:352`). A patch of green with nothing above it is exactly what
  the rule forbids. §12 strips it.
- **The snow is a field with no life in it.** Its five populations (`atmosphere.js:382`) are honest about detritus, mineral and
  sulfide, and the `live` kind is a guess at the lit layer's own life — a smooth function of depth and `nut`, with no patchiness, no
  day, no year, and no relation to what eats it.
- **Filter feeding is not implemented**, so half the roster (veil, comb, sifter, ram, and every `filter combs` build the creator can
  make) eats nothing real. (Built v11.85, §11.)

## 2. What actually decides plankton, in order

1. **Light and nutrients, and whichever runs out first.** Light falls off exponentially from the surface; nutrients are consumed at
   the top and regenerate below, so they increase with depth. Growth needs both, so the crop is a **layer**: a maximum where the two
   curves cross. This one fact produces most of what follows, including the deep chlorophyll maximum, the depth limit of the algae
   and the reason the open ocean is blue.
2. **Mixing is the switch.** Wind, tide, upwelling or a storm that lifts nutrient-rich water into the light starts a bloom;
   stratification ends it. Everything seasonal or event-driven in this doc is a mixing story.
3. **Grazing is the brake**, and it lags by days. That lag is why plankton is boom-and-bust and patchy rather than an even soup, and
   it is the reason a filter feeder hunts patches instead of grazing the mean.
4. **Redox at the edges.** Below −450 there is no photosynthesis at all and the microbes are chemosynthetic: the bacterial plate and
   the sulfide floc, which the snow already draws. The vents are the same story in miniature.
5. **Temperature, weakly.** A 26–28 °C mixed layer means a strongly stratified tropical sea, which is *poor* by default. The
   island's productivity is the seamount effect and the gap's inflow, as PLANET already says.

**How deep the simulation goes: one scalar and one shape.** Plankton is a *field*, never organisms. The crop `C` at a point is a
standing stock in mg/m³ of pigment, and it is the product of a horizontal term (where, from the world's fields and the ledger) and a
vertical shape (how deep, from light and the nutricline). Nothing below the scale of a swarm is an entity. Above the scale of a
swarm, animals already exist.

## 3. The field

```
C(x,y,z,t) = crop(x,z,t) · shape(y, mld, kd) · patch(x,y,z,t)
```

- **`crop`** — the standing stock over the column, mg/m³ of pigment averaged over the lit layer. Real numbers for scale, and the ones
  the knobs should land on: a clear tropical gyre **0.03–0.08**; ordinary island water **0.2–0.5**; a fed upwelling flank **1–3**;
  a bloom **5–20**. In the game it is built from `nut` (already the seamount effect, the gap's inflow and the vents), the retention
  term (§12), the season (§6) and the recent mixing history (storms, spring tides).
- **`shape`** — the vertical. Light `L(y) = dl · exp(-kd · d)` with `kd` **0.04 /m** in the basin's clear water, **0.10–0.15** over
  the fed shelf and **0.3** in a bloom: plankton shades itself, so a bloom is shallow and sharp. Nutrients `N(y)` rise through the
  nutricline, which sits with the thermocline at **−64**. The crop is the product of two saturating terms, `L/(L+kL) · N/(N+kN)`,
  which puts a subsurface maximum near the top of the nutricline when the surface is stratified and flattens it into the mixed layer
  when the wind is up. The 1% light level — the floor of anything photosynthetic — comes out at **−150 to −170** in clear water,
  **−40 to −60** over the fed shelf and **−20** in a bloom. That is the same floor `TAXA.md` already gives the deep rind, so the
  flora and the water would at last share one light law instead of two tables.
- **`patch`** — §4. Never white noise: every patch in this doc is a mechanism.

Cost: a handful of flops on the terms the world already computes. The snow reads it at a point's refresh (one in 64 a frame); the
water's colour reads it from a coarse map (§7).

## 4. Patchiness, and where the pockets are

The person's instinct — "maybe making marine snow have more concentrated pockets" — is right, and the pockets have addresses:

- **Windrows.** Langmuir circulation under a steady wind makes surface convergence lines **parallel to the wind**, spaced roughly
  2–6× the mixed-layer depth. With the trades at 7 m/s and a 45 m mixed layer that is bands every **90–270 m** in the top few
  metres, and they are where the floating stuff — plankton, bubbles, the sailer fleets — collects. Free from `WIND_A` and a sine.
  They disappear in a calm (`weatherAt().wind`).
- **The tidal mixing front.** Where the tide is strong over shallow ground the column is mixed top to bottom; where it is deep or
  slack the column is stratified; between them is a sharp front, and fronts are the richest water in a shelf sea. The criterion is
  h/u³ (Simpson–Hunter): with `TIDE_U` 0.5 m/s in the far field and 1.0 on the flanks, the front lands around the **40–80 m**
  contour — very nearly the shelf break. It is a **ring round the island**, and it breathes in and out over the 13-day spring–neap
  cycle. This is the single best feature in the doc: an emergent, unnamed, moving landmark of food, derived from two numbers the
  world already has.
- **The lee eddy.** The seamount's wake retains what drifts into it, and retention means productivity — the island mass effect, real
  and well documented. This is what §12 keeps of the canopy mask.
- **Thin layers.** Plankton concentrates in layers centimetres to a few metres thick at density steps, which is where the snow
  already piles floc. The `live` kind gets the same treatment at the thermocline.
- **The upwelling flank** on the current's axis (5.44 rad), strongest in the windy season.

## 5. The day: the layer that rises

Diel vertical migration is the largest daily movement of animals on the planet, ours included: the grazers spend the day at
**300–500 m**, deep enough to be invisible to anything that hunts by sight, and rise into the top **50 m** at dusk to feed, sinking
again at dawn. They travel at a few cm/s, so the transit is about **one game hour** at each end of the night.

- **The moon suppresses it.** Bright moonlight holds the layer 20–50 m deeper. Tethys' moon is nine times the Moon's area and gives
  `MOONL` 0.28 of noon's light at full — so here the effect is strong, and a full-moon night would be a noticeably emptier one.
- **What it does for the game.** The water column changes through the night on its own: the deep is busy at midnight and dead at
  noon, the shallows the reverse. Everything that eats plankton follows it up, and everything that eats *those* follows too, so dusk
  is when the open water is worth being in and dawn is when it empties. It costs nothing but a depth offset on the swarms and the
  `live` kind's weight, and it is the strongest single argument in this doc for POLISH pass C (the night) being worth doing next.

## 6. The year

The person (22 Sep): seasons yes, "even if they're subtle". They are worth having, and cheaply:

- **The tilt.** A large close moon stabilises a planet's obliquity — that is the one thing Earth's moon is famous for, and Tethys'
  is bigger. So a stable, modest tilt is the physically motivated choice: **15°**, against the existing latitude `LAT` 0.2 rad
  (11.5° N). At that combination the sun passes overhead twice a year, which is a tropical year with two mild peaks, not a temperate
  one with a summer.
- **The length.** `YEAR_D` **185 game days** ≈ 123 real hours (the person, 22 Sep; §15), derived from the star by Kepler — PLANET,
  "Decided 22 Sep 2026", has the arithmetic. The first proposal here, 24 days, needed an M dwarf and was struck. 185 is not
  commensurate with the spring–neap cycle (13 days now, ~4 after the half-distance moon), so the two drift against each other. The
  life is compressed against the sky and the sky is not: a season is some thirty soft-arm lives long, so no animal knows the year and
  **the line is what sees it** — which is what `LINEAGE.md` wants generations to be for. One session sees a few days of it; the season
  reaches the player through the line (open, §14).
- **What the season actually is.** Not temperature — the mixed layer stays 26–28 °C. It is the **wind**: the trades blow harder and
  steadier for half the year and slacken for the other half (`weatherAt().wind`, already 1 in the trades and 0 in a calm about a
  quarter of the time, gets a seasonal bias). From that everything else follows:

  | | the windy half | the still half |
  |---|---|---|
  | mixed layer | −70 to −90 | −35 to −45 |
  | upwelling on the flank | strong | weak |
  | crop | high and shallow, olive-gold (§7) | low at the surface, a sharp deep maximum |
  | the water | greener, hazier, shorter sight | bluer, clearer, long sight |
  | storms | more | fewer |
  | the front ring | wide, strong | narrow, sometimes gone |

- **The risk, named.** Seasonal `nut` feeds capacity through every envelope in the ledger, and `test/census.js` fails if any kind
  collapses under a fifth. So the season must mostly move food **around** rather than switch it off: a swing of about **±20%**
  basin-wide and up to **±60%** locally on the flank and in the lee, with the two out of phase. Census runs at four points in the
  year before this ships, not one. **Built otherwise (v11.83):** the season moves the crop and the weather, not `nut` — `sample()` stays a
  function of place and the ledger's capacity does not breathe; it will through the swarms (pass 4), which are ledger records that eat the crop.
  The mixed layer by season is 64 m × (1 + 0.3·s): 83 windy, 45 still.
- **What it buys, honestly.** Three things. The sea looks different across a line's lives instead of only across a 40-minute day;
  populations breathe, so the ecology is not a still pond; and a lineage acquires history — "the year my line lived through" is the
  cheapest generational memory the game can have.

## 7. The colour of the water, and where the green went

**What colours water at all.** Pure water absorbs red first, so clear water is blue and gets bluer with depth. Pigment absorbs blue
and red and leaves green, so fed water is green and a heavy bloom is olive or brown. Dissolved plant matter stains water tea-brown
and kills the blue — that is the lagoon. Mineral sediment scatters everything and turns it milky grey-green. `waterColor`
(`world.js:412`) already does rough versions of all three from `nut`, `turb` and `heat`; what it lacks is a crop to drive them and a
reason for the tint to be one colour rather than another.

**Tethys' own answer.** `TAXA.md` says the ocean's plankton arrived in **three pigment kinds**, each keeping a different slice of
the spectrum, and each founded one of the sessile lines. So the water's colour is a question of *which kind is winning here*, and
the answer is ecological, not a painted patch:

| kind | where it wins | why | what it does to the water |
|---|---|---|---|
| **green** (the greens' ancestor) | bright, shallow, fed — the shelf, the lagoon, the reef flat | high light, high nutrients, fast turnover | the classic green; olive when dense |
| **gold** (the floaters' ancestor) | cold, stirred, freshly fed — the upwelling flank, the windy season, days after a storm | the opportunist: blooms fast on a nutrient pulse, sinks when it is spent (the diatom's trade) | olive-gold, brown when heavy; the bloom colour |
| **red** (the reds' ancestor) | dim — the deep maximum at −60 to −150, under the canopy of anything | keeps the blue-green that is all that is left down there | little green: a **dimmer, plum-tinted** layer, not a pink sea |

Three consequences worth having: the **thermocline gets a faint rose-grey haze** in the still season, which gives the −64 step a
look as well as a physics; a **bloom's colour tells you what caused it** — gold means the flank has just been fed, green means the
shallows are warm and rich; and the only tuning left is the strength of each, not an arbitrary choice of hue. Build it on the
plausible numbers and adjust from there, which is what the person asked for.

**Depth limits, since they are the same law.** Free-floating plankton lives above the 1% light level (§3). Attached algae live to
roughly the same place: the deep rind's −150 in clear water and −170 under the basin's sparse water is right, and Earth's record for
an encrusting red is 268 m in exceptionally clear water. Under a bloom, both ceilings come up by a factor of three. So the still
season is when the deep rind grows and the windy season is when the shallow greens do.

**Implementation.** A coarse **bloom map** beside the existing water map (`far.js wmFill`, 96×96 over the whole world): 32×32 is
enough for crop and dominant kind, refilled on a rolling schedule of a few texels a frame as the clock moves. The base water colour
stays the place's, static; the shader mixes toward the bloom's colour by the crop, and the vertical tint rides the depth table
`wcol(d)` that the veil already reads. No new per-frame full-world work.

## 8. The light in the water — is it honest?

The person's condition: plausible, or thrown away. It is plausible, and for a better reason than spectacle.

- **The mechanism is real and specific.** Bioluminescent blooms are made by single-celled drifters that flash when the water around
  them is sheared — a wake, a swimming animal, a breaking wave. The accepted explanation is the **burglar alarm**: the flash does
  not help the drifter directly, it makes the grazer eating it conspicuous to whatever eats the grazer. It is a defence that works
  by *informing a third party*, which is why it only fires on mechanical disturbance and why it costs nothing when nothing is moving.
- **This planet makes it cheaper.** The reaction is oxygen-hungry; at 28% oxygen it is a bargain. PLANET's iron is neutral here.
- **It obeys the existing rule.** PLANET removed constant lanterns in v10.1 because they "feed nothing and attract everything".
  This does the opposite of a lantern: it is dark until something moves, and what it attracts is attracted to *the thing that moved*.
- **So it has a cost, and that is why it earns its place.** Swim fast through a bloom at night and your own wake draws you in light.
  Every hunter within sight gets your position. A slow animal is nearly dark; a sprinting one is a lit line. Filter-feeding in a
  bloom at night means glowing while you eat. That is a mechanic, not a light show — and the spectacle the person is happy to have
  comes free with it.
- **How often.** A bloom at its peak, being grazed hard, on a few nights of the year — an event, in the archipelago's own sense.

## 9. Marine snow, refined

What stays: everything in `atmosphere.js:382`. The five populations, the Martin curve, the density steps, the chemocline's plate and
the sulfide flakes are the good part of the system and this doc does not touch them. The square points stay square (the person,
13 Sep). What changes:

- **`live` is driven by the field.** Its weight becomes the crop at that point, so the pockets, the windrows, the front ring, the
  deep maximum and the dusk rise appear in the snow for free. That answers the person's "concentrated pockets" with the mechanism
  underneath it rather than a noise function.
- **Colour by pigment kind.** `live` already lerps its colour by `nut`; it becomes a mix over the three kinds' colours at that point.
  Cheap, per-point, and it makes the snow read differently on the flank than in the lagoon — the person's "a tiny bit more colour
  variation depending on location".
- **A chain kind.** An untextured point is always square, and anything else costs a texture fetch or a discard per fragment. The way
  to get the person's "two pixels wide or tall" is **two or three points seeded adjacent and falling together**: diatom-like chains,
  faecal strings, the discarded mucus houses of filter-feeding drifters (real, abundant, and the biggest single contributor to real
  marine snow). One new kind in `SN_K`, no new draw call, no new material.
- **The budget does not grow.** `Q.snow` is 1800 points high, 1000 low. The parking mechanism already spends points where the water
  is dense; with the field driving it, it spends them where the *life* is dense, which is the same trick doing more work.

## 10. The swarm tier

The person's second question — are three systems for one thing too many? — answers itself once the scales are named. There are three,
they are a continuum, and they should look like one:

| | what | how drawn | how it moves |
|---|---|---|---|
| the medium | detritus and the finest life, sub-mm to cm | the existing points | sinks, drifts, circles under a crest |
| **a swarm** | grazers, mm to cm, in clouds 1–30 m across | **the same material**, a block of points from the same budget | coherently: drifts, jitters, **scatters from a body**, rises at dusk |
| animals | sifter and up | geometry | as now |

A swarm is drawn with the snow's own material and colour law, so nothing new appears on screen — what distinguishes it is
**motion and density**, which is how you tell plankton from detritus in real water too. Slightly larger points, warmer colour, and
they part around the player using the flow field `FLOW` that the snow already reads. The flat cards of not-quite-fish stay dead.

**A swarm is a ledger record**, like everything else that lives: a centre, a radius, a density, a pigment kind, a cell. It grazes the
crop down locally and the crop regrows; it is prey for `sifter`, `ram`, `comb`, `veil` and anything the creator builds with combs;
and it dives at dawn, which takes it out of reach of everything shallow. That last point is what makes the ram, the sifter and the
comb worth being where they are.

## 11. Filter feeding

**Built as v11.85 (23 Sep 2026), with one change to the letter of the first point: the stomach fills from the swarms, not from the crop.** The
crop is a map; a swarm is a record with a biomass, and only a record can be eaten down. `derive` reads the sieve's area off the build (`filter`,
m²: the frontal `combs`, a `comb` part or a webbed net marked `sieve` — the switch is the creator's, since the hingeshells' mouth combs rake the
floor and the pall's net catches in the dark): the veil's funnel ~100 m², the comb's combs 13, the ram's rake 1.2, the sifter's 0.08. A kind with any
is a hunter of the swarms on the ledger (ecology.js `ecoOf`; the swarm `edible`, mortal) and never chases one (no capsule). Live, the intake a second
is the sieve × the water through it (the body's speed, or the combs' sweep of 1 m/s at rest) × the swarm's density (its flesh over the cloud's
volume) × `FILTER.eff` 0.35: a starving veil hanging in a full swarm is fed in ~45 s (75 in the smaller, wider one seen) and takes half the swarm; the swarm thins as it is eaten (the snow
draws the share left) and disperses at 8%. A hungry filter feeder steers for the nearest swarm within 120 m and circles in it (creatures_ai.js
`filterSeek`; a sifter school as one); the player runs the same intake and clock. The census (`node test/census.js 120`) holds: nothing under a fifth.

The loop follows from one real fact: **the mean is never enough.** A big filter feeder cannot live on average water — a blue whale
needs patches roughly a hundred times the background to break even. So:

- The stomach (`player.hunger`, v11.73) fills from the crop at a rate set by the build's filter area, which `derive` can read off the
  comb parts the creator already offers.
- Open water returns almost nothing. A swarm returns a meal. The front ring, the lee, the windrows and the night's shallow layer are
  where swarms are, so the filter feeder's game is **reading the water** — and every one of those features is visible in the snow
  before you can see the swarm itself, which is the whole point of refining the snow.
- It gives the roster's filter feeders (veil, comb, sifter, ram) a real reason for their placement, and it makes a comb-built player
  a genuinely different animal to play: slow, safe from nothing, always going somewhere.

## 12. The canopy ghost

Fold into this work, as the person asked. `canopyW` is not deleted — it is renamed for what it physically is, a **retention field**
in the seamount's wake, and stripped of the paint:

- **Keeps**: the sailer fleets (`chunks.js:352`) — drifting colonies really do pile up in a lee's convergence — and a boost to the
  crop, which is the island mass effect and the honest reason the water there differs at all.
- **Loses**: `WATER_CANOPY` as a fixed green (`scene.js:182`, `atmosphere.js:535`) — the colour comes from the crop and its pigment
  kind like everywhere else; the 22% floor shade (`chunks.js:74`), which shaded the floor under a canopy that is not there; the
  floc boost, superseded; `canopyPer` on any species, or the species moves its own envelope to the retention field.
- The three patches' positions stand. They are in the wake, which is where a Taylor-column eddy belongs.
- `underCanopy` and `canopyFade` go with it. The water there will still be a little greener than the basin — because it is
  productive, not because it is under something.

## 13. Build order

1. **The field and the colour.** `plank()` in world.js, the bloom map, the pigment kinds through `waterColor` and the veil, the
   canopy strip (§12). Look at it: the flank, the lagoon, the thermocline, the basin, the man-o'-war's patch before and after.
2. **The snow.** `live` off the field, colour by kind, the chain kind. `test/snow.js` gains sites at the front ring and the deep
   maximum.
3. **The day and the year.** DVM on the swarms and `live`; the tilt, `YEAR_D`, the seasonal wind bias, the mixed layer. Census at
   four points in the year.
4. **The swarms.** As ledger records, drawn from the snow's budget, grazing the crop, prey for the filter feeders.
5. **Filter feeding.** The stomach off the crop and the swarms; `derive` reads the filter area.
6. **The bloom night.** The crop's peak, the flash on shear, the player's wake as information.

1–2 are one version and are worth doing alone. 3 is a version of its own because of the census. 4–5 are the ecology pass. 6 last,
and only if 1–5 look right.

## 14. Open — the person's

- ~~**The year's length.**~~ Answered 22 Sep: ~185 days (§15).
- **How the year reaches the player.** At 185 days a session sees a few days of it. The honest levers: the world run on at the
  handovers (the clutch's run-on to the hatch, a death to the child), and `CLOCK_RATE`, which compresses every clock together. Not a
  separate clock for the year — that is the fudge the length was chosen to avoid.
- **Whether the season may move creatures**, not just food — a migration term in the ledger. Bigger change, better world.
- **Whether the player may ever be told the season**, or only see it.

## 15. The person's answers (22 Sep 2026)

- **Seasons:** yes, even subtle. "If seasons would meaningfully improve the game, then yeah… but I think seasons are a good idea
  even if they're subtle." §6 is written to be subtle and to be about the wind, not the temperature.
- **The default tint:** not chosen by hand. "Implement the system as you said… go with what is ecologically plausible based on
  realism and then see if it looks good and try to work with it from there." §7 has no chosen hue in it; the colours fall out of
  which pigment kind wins where, and tuning after a look is expected.
- **Bioluminescence:** allowed on condition. "If the bioluminescence is ecologically plausible and not something we are shoving in
  for spectacle, then I'm down to make it a spectacle. But if it isn't, I would have no problem throwing it away." §8 makes the case;
  it stands or falls on the burglar-alarm mechanism and on the cost to the player, and it is last in the build order so it can still
  be thrown away.
- **The canopy strip:** folded in (§12), as pass 1.
- **The year's length:** ~185 days of 30 h, the day unchanged — derived from the star (PLANET, "Decided 22 Sep 2026"), over the 24
  days first proposed, which only an M dwarf gives. Taken knowing that the season then spans some thirty soft-arm generations and
  belongs to the line, not the animal; a shorter year would have to come from a cooler star, not a number.
