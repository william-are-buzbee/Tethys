# ARCHIPELAGO.md — the chain (15 Sep 2026)

Status: **steps 1–4 built** (v11.61 the islands as records; v11.62 the giant's record and the land term; v11.64 the horizon tier and a trade-wind air; v11.65 the world at 240 cells with the ledger's index); step 5 designed nowhere yet. The person's decisions are at the end.
Read PLANET.md first (the basin, the shield's rules) and DESIGN.md World shape; the maps are `map.html` and `node test/map.js`.

## What it is

One hotspot chain. The plate slides over a fixed plume, so age rises in one direction and only the volcano over the plume builds.
Our island is the eroded, drowning member (a rim awash, terraces recording its sinking, one to two million years old); the sill ridge
north-east is the drowned oldest end; the chain runs **south-west along the rift axis** (2.6 rad) from us, younger with distance.
Sizes are a hump, not a slope: the newest is a seamount, the active one is still building, the biggest is the one that has just finished
its shield, and after that they only lose (erosion, subsidence at millimetres a year, reef, atoll, guyot). Feet overlap into one ridge
with saddles; "open water between islands" is the saddles.

## The chain as proposed

Distances from our peak; x east, z south; the map's json is the same numbers. The person may move any of it on map.html.

| km | id | x, z | across (land) | summit | slope | what it is |
|---|---|---|---|---|---|---|
| 18 | the giant | −15400, 9200 | 14 km (land r 7000) | 900 m | 12° | mature, one step behind the hotspot: a shield to a summit, gullies, rivers, a shelf, reefs, cloud on the top, a dry lee |
| 36 | the young shield | −30800, 18400 | 7 km (land r 3500) | 500 m | 14° | active: a plume, black flows to the sea, cinder cones on the rift, almost no shelf |
| 50 | the seamount | −42800, 25600 | none | −200 | 14° | the next one, under water: vents, fresh pillow lava on its summit; horizon-only until the world grows again |

A foot on the basin floor is the land's edge plus 1100 m of flank at the slope (5.2 km at 12°). The giant's foot (r ≈ 12 km) reaches
ours (r ≈ 5.7 km): a saddle at about −1000 between them, 4–5 km of it. Clusters of islets go where the geology makes them: cones on the
young shield's rift, stacks and a drowned rim on the giant's old side, slide blocks under its scarp (see CHANGELOG v11.60's discussion).

Seen from our surface: the giant's summit stands ~2.6° above the horizon at 18 km after the curvature's drop of 25 m; visible to ~110
km in clear air, the haze allows 15–30, so it comes and goes with the weather. From the giant's shore our rim is under the horizon; only
the flank cone's hill shows.

## The build, in order

1. **The islands as records** — built v11.61. `ISLANDS` in world.js; `islandH(R,x,z,o)` is the geology in the island's frame (place,
   turn, radial scale `sc`, noise offset `ns`, the profile as steps, terraces, rim, collapse, dikes, rifts, vent, pit, cone, flank, reach);
   `sample()` takes the smooth max of every island in reach over the basement and the highest island's conditions. Ours is `ISLANDS[0]`
   and must stay bit-identical: check any change to `islandH`/`sample` against the last commit's world.js over the old square
   (185,761 samples, ground and all nine fields; the scratch script of 15 Sep did `git show HEAD:src/world.js` into a stub and compared).
2. **The giant's record and the land term** — built v11.62: `land` in the record (world.js `islandH`: the shield's surface, the windward cliff,
   the rain gullies to graded floors, the rift-zone flows, the caldera); the giant is `ISLANDS[1]` at the table's position, in metres with `sc` 1 —
   the record carries its own radii, so the scaling below was not needed and the noise keeps our grain; a 1 km shelf puts its foot at ~13.8 km,
   not 12, and the saddle at −927, 4.5 km from our centre; ours proved bit-identical; the centre is 2.5 km past the edge until step 4. As
   designed: the kit had no land above a few metres. Add to the record a `land` block and to `islandH` a
   subaerial term inside the rim's radius: the shield rising at 5–8° to the summit (PLANET: pillow lava and hyaloclastite pile at 10–20°
   under water, subaerial flows at 4–8°), a caldera at the top if wanted, gullies cut by the rain on the windward side (the wind is `WIND_A`;
   the lee is dry), a shore that is basalt and olivine sand by the existing rules (chunks.js `terrainColor`, DESIGN Land), flows as low
   ridges down the flank (the rifts' kit, scaled). Radii scale by `sc` (the giant is ~3× ours at the rim), heights by the record's own
   numbers, the terraces stay 12 m (eustatic). The conditions: `expo` and `nut` read the global wind and current as now; the lagoon and
   the passes follow the record. The giant's own noise offset `ns` so its pattern is not ours scaled. Land already exists in the game
   (the rim, the isle's hill, a player that flops onto it — player.js): the giant's slopes are the same medium, larger.
3. **The horizon tier** — built v11.64 (horizon.js: a second pass under the main one rather than a raised far plane; the world's own air fog,
   made a trade-wind day since the 1 km haze could show nothing — the boundary-layer mist is the physics, and "AIR.dens 15–30 km" below was
   wrong about what AIR was; the sea disc meets the surface mesh's far end a shade lighter). As designed (so the giant shows from the surface): One coarse mesh of the whole chain at ~200 m grid from `sample()`, built
   once, drawn only when the camera is above the water, past the far plane (`Q.far` 1600/1000 — raise the far plane above water, or a
   second pass; the horizon mesh stands alone out there so depth precision is not a problem); the planet's curvature as a vertex-shader
   drop of d²/2R (R Earth's, 6371 km — PLANET says 1 g and nothing else); the air's haze (`AIR.dens`, 15–30 km) fades it; the sea
   surface must reach the horizon (the audit of 14 Sep, WATER.md Part 3, has the edge it meets). Under water nothing changes: the fog
   reaches 260 m, the next island is a thing you cross open water toward.
4. **The world grown to hold it** — built v11.65: `NCELL` 240 (51.6 km) holds the giant whole; the young shield's centre at 30.8 km is 5 km past
   the edge (the arithmetic below was off), so it is a record for the horizon tier to show, not a place to reach; the ledger's tables stay dense
   and its loops walk per-entry lists (ecology.js `POP.cells`); the sill's outer flank goes to the plate (`SILL.plate`). As designed: `NCELL` 240
   (51.6 km; must divide by 4) holds the giant and the young shield, not the seamount.
   The ledger's arrays (`ECO_CELLS`) and the save scale linearly (57,600 cells: ~40 MB of Float32 tables — make them sparse, most cells
   have no capacity for most kinds); the census and the model are already in pieces; the far layer already streams; the water map is
   `NCELL·6` texels (1440² — fine, or window it); float32 on the GPU is 4 mm at 50 km, the ceiling before camera-relative rendering.
5. **Life on the way.** The saddles and the giant's shelf: envelopes place what fits by the fields; the crossing (18 km, 43 real
   minutes at 7 m/s) wants the drifters, the cruisers and the current (DIRECTION: the road). Not designed here.

Tools: `map.html` (the plan; "built" rings are `ISLANDS`, yellow rings the plan; json in and out), `node test/map.js` (`PLAN=` for the
same rings to a png), `tp(x,z,y)` in the game's console to go and look, `test/preview.js` for creatures.

## The person's answers (15 Sep 2026)

- The silled basin over the plate, as long as it is real — it is (PLANET, The basin). Built v11.58.
- One chain, south-west; "gigantic" is 12–15 km across; a cluster of islets is fine where the geology makes one.
- The next island must be visible from the surface (the horizon tier is in scope).
- Reachable, not seen-only: the world grows to hold it.
- Performance is theirs to troubleshoot in another chat; build first.
- Open: the exact layout (map.html json, if it differs from the table); the giant's character in detail (caldera or not, how much
  reef, a river or two); whether the crossing gets its road in the same pass.
- Asked 15 Sep 2026 with v11.62 in hand, open: the caldera (built, r 700, 110 m — keep, fill it as a post-shield volcano does, or strike);
  rivers in the master valleys (nothing carries water on land); the reef's amount (by envelope: what the lime polyps' rule gives a 1 km shelf);
  the greens above `h` 60 (tussock and scrub stop there by their envelopes, so the giant's slopes are bare rock above it; the rain says the
  windward flank should be green to the cloud base at 650); whether the windward cliff's face wants a rock colour of its own (the strand's
  colours run to 18 m by height, so it reads as a bluff); the road; the layout against the map's json.
