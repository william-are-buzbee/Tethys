# GLOBE.md — the planet, then the region (25 Sep 2026)

Status: **designed, not built.** The person's decisions are in §7; the build is deferred to a chat with room for it (§8). Read PLANET.md first (The
planet, Geology) and ARCHIPELAGO.md: this doc revises ARCHIPELAGO's "one chain" into a cluster and says why; nothing in PLANET changes.

## 1. Why zoom out

The game's rule is that everything on the island derives from its geology. The geology of an island *group* derives from its plate: how fast it
moves over the plume, how the plume pulses, how far the continents are, whether the sea has risen and fallen. Those are questions a planet answers
and a region cannot, and they are exactly the questions the chain has been guessing at — how many islands, how far apart, how big, which are drowned.
The person (25 Sep 2026): create the whole planet from its described characteristics, place ourselves on it, and when a region looks archipelago
enough, say "this is Tethys" and point at where the game could be. Island sizes are not to be guessed; the geology hands them over.

## 2. The planet's five facts (decided 25 Sep 2026)

1. **Continents exist, far away.** A world with plates and continents; ours is a small ocean plate a few thousand kilometres from any coast. Rivers
   and continental nutrient exist somewhere and matter nothing here. The feeling wanted is "something vast out there beyond the blue", never a
   coast on the horizon. PLANET's "no continent, so no river nutrients" stands as a statement about our neighbourhood.
2. **Latitude 10–20° (built: `LAT` 0.2 rad, 11.5°).** The trades, the easterly waves and the season are already this latitude's (CLOUDS.md, world.js
   `TILT` 15°, `sunDec`). Warm mixed layer, weak seasons, and cyclones possible — the storms pass of CLOUDS can be a cyclone's outer bands.
3. **A slow plate.** One to two centimetres a year over the plume (Hawaii's moves nine). Slow is the knob that turns a *chain* into a *cluster*:
   the volcanoes pile up round the plume instead of stringing out behind it. Direction matters only for which end is old, and that stays north-east
   (the sill is the drowned old end, world.js `SILL`).
4. **A pulsing plume.** The plume's flux varies over a few hundred thousand years, so members differ in size — two great, one enormous, some fine,
   some that never broke the surface. On Earth: the Canaries (Tenerife 3,700 m, La Gomera 1,500, the seamounts nothing).
5. **Ice ages, Earth's.** The far continents carry the caps; our latitude stays warm. The sea rises and falls ~120 m every ~100,000 years. This is
   what PLANET's "eustatic" 12 m terraces already assumed; now it is said.

## 3. What a slow plate makes: the cluster

The model is a **hotspot cluster with a seamount province** — Cape Verde (ten islands in a horseshoe 250 km across, 4,000 km² of land), the
Canaries (seven islands, 7,500 km², spacing 30–60 km, several visible from each, over a hundred seamounts and guyots round them), the Galápagos
(thirteen islands, as many drowned). Not Hawaii (a line), not the Philippines (an arc collision: it needs a trench next door, which would make us
andesite with no hotspot at all — the person wants that *size*, not that mechanism).

- **Land in the region:** 5,000–20,000 km² in all, over a province ~300 km across. The person's "twice Hawaii" (17,000 km² of land) is the top of
  what one plume makes; "a Philippines but not an Australia" is the same order.
- **Members:** on the order of six with summits above the sea and a dozen or more below it — the person's picture, and a seamount province's
  normal ratio. The visible six sit within ~40 km of one another (spacing 15–30 km: the Societies' spacing the built chain already has; Tahiti to
  Moorea is 17 km), so that from any one several show in various directions — the thing the person wants most ("almost nothing beats seeing
  multiple points of interest off in the distance").
- **Their differences are their ages**, and come free: the active shield with black flows, a plume and no shelf; the mature one with rain gullies,
  a windward cliff, a shelf and reef; the old one that is a rim and a lagoon (ours); the atoll; the guyot at −100 with a drowned reef on its flat
  top. Two islands of one age look alike, which is accurate.
- **The floor between them** is the province's ridge: feet overlapping into saddles at −900 to −1100, the basin floor beyond, the plate at −3800
  (ARCHIPELAGO, SEAFLOOR §4). "Islands that blend together and meld until they extend the floor" is this ridge; the drowned members are its
  high points.
- **Seen from the water:** a 900 m summit stands above the horizon to ~110 km in clear air; the haze allows 15–30 km on an ordinary day
  (horizon.js, `AIR`). So "visible" means within ~30 km most days and the great ones on clear days from 60–100. The weather deciding which
  peaks show is part of the vibe, not a cost.

**What this revises.** ARCHIPELAGO.md's chain (the giant 18 km SW, the young shield 36, the seamount 50, ages rising NE) becomes one lobe of the
cluster; its members and the built records stay where they are. The world's 52 km square (`NCELL` 240) is one window into a ~300 km province;
the rest is the horizon tier and later growth.

## 4. What ice adds

Ice costs nothing at the planet level and pays on every island:

- **A second shoreline at −100 to −120** on every member: a wave-cut break, drowned beaches and notches, where the last lowstand's sea stood.
- **The gullies continue under water** to that depth — the giant's rain valleys were cut when the shelf was dry.
- **Karst on the old ones**: an atoll that stood 120 m out of the water for tens of thousands of years was rained on and dissolved — sinkholes,
  caves, blue holes — then flooded. The drowned rims read as real shorelines, not only subsidence.
- **The terraces** at 12 m are interstadial stillstands; the shelf's base (~−60, PLANET) and the −120 break are two different events.

## 5. The tool: a planet map, then a region window

Not a rendered sphere. Two pictures, both from rules, in the manner of `map.html` (loads world.js as it is):

1. **The planet** at continent resolution, equirectangular, drawn from a few rules rather than noise: plate polygons with motion vectors; ridges,
   trenches and hotspots; sea-floor depth from age (the standard curve, ~2500 m + 350 √age m); island chains along hotspot tracks by plate speed,
   clusters where the speed is low; arcs along trenches; the continents as outlines only; latitude bands for the trades, the westerlies and the
   gyres. Its job is to place us — a small ocean plate, low latitude, a plume under it, a continent ~3000 km away — and to make the region's
   numbers consequences instead of picks.
2. **The region**, a window of ~300 km cut from it: the province's members as records (`ISLANDS`, world.js), each with an age, a size from the
   plume's pulse and a state from its age (shield, mature, rim, atoll, guyot); the ridge between them; the −120 shoreline on each; the wind and
   the current from the planet's bands. The game's square is drawn on it. When the window looks like an archipelago the person says so, and the
   members' records go into `ISLANDS` in the order the horizon tier and the ledger can carry them (ARCHIPELAGO steps 1–4 are the pattern).

The value-noise machinery is not the tool here: a province is drawn by its logic (where the plume was when), and noise only grains it.

## 6. What it changes downstream, and what it does not

- **Nothing on our island**: `ISLANDS[0]` stays bit-identical (the identity test of ARCHIPELAGO step 1).
- **The chain's docs**: ARCHIPELAGO gets a head note pointing here; its table is one lobe.
- **The flora**: PLANET fixes the mixed layer at 26–28 °C; Earth kelp dies above ~20. "Kilometres of kelp reef" on the shelves is this planet's
  tropical weed forest (FLORA's, TAXA's), or it sits in an upwelling the plate map has to justify. To be decided on purpose, not by the word.
- **The road** (ARCHIPELAGO step 5, DIRECTION): the crossings between members are the saddles; the drifters and the cruisers live there.
- **Land life** (the person, 25 Sep 2026): the islands will carry flora and, later, play on land — an extension of the game, not part of this doc.

## 7. The person's answers (25 Sep 2026)

- Continents far away, yes; "a Philippines situation, not an Australia"; Iceland or twice Hawaii is the ballpark; the sight of land in the
  distance, and many of them in various directions, is the goal — "there is no reason to arbitrarily leave the world submerged".
- Latitude 10–20: yes.
- The chain's members: about six with visible peaks (two great, one awesome, two fine, one barely) and a dozen drowned, old or submerged;
  islands that blend into the floor with some rising higher. Asked whether that is plausible: it is a seamount province (§3).
- Plate direction: no preference; speed: whatever gives a believable, fun, messy series of islands — the slow plate's cluster, accepted.
- Ice: never considered; the terraces and the drowned rim are liked; what ice does to them is §4. Taken as Earth-like glacial cycles.
- **Accepted (25 Sep 2026): the cluster on a slow plate as the model, revising ARCHIPELAGO's single chain.**

## 8. Open, and the build

Open for the person, not to be decided here: the region's exact layout (drawn on the region tool, as the chain was on map.html); the province's
name-free character per member (which is the active one, which the enormous one); the weed forests' warmth (§6); how far the world's square
grows (a second window, or the horizon tier alone for the far members).

The build, deferred to a chat with context to spare, in order: (1) `globe.html` — the planet map from rules, with us on it; (2) the region window
with member records and the −120 shoreline; (3) the person's layout; (4) records into `ISLANDS` with the identity test, the horizon tier showing
them; (5) the members' ages as their geology (the shield, the gullies, the atoll's karst) in `islandH`; (6) SEAFLOOR's formations by member.
