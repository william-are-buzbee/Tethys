# tethys

An underwater exploration game in one three.js file.

- `tethys.html` — the built game. Open it in a desktop browser. (Add `#low` or `#high` to the URL to force a quality tier.)
- `dev.html` — same game, loads `src/*.js` as separate files so you can edit and refresh without building.
- `build.js` — concatenates `src/` (in the order of `src/order.txt`) into `tethys.html`, writes `dev.html` and `src/INDEX.md`. `node build.js --test` also runs the checks below. `build.py` is the same build in Python for the sandbox sessions; the outputs are byte-identical. On this PC Node 22 is at `C:\Users\willb\tools\node` (on the user PATH) and the folder is a git repo since v11.12.
- `test/smoke.js` — headless logic check with a stubbed THREE (`test/stub.js`); drives all three clades. `node test/smoke.js`, `TIER=low node test/smoke.js`.
- `test/physics.js` — headless check of physics.js: the collider hash, pads, chains, body contact, flow; prints the cost per creature. `node test/physics.js`.
- `test/audio.js` — headless check of the sound (v11.14): the audio graph built against the stub's fake `AudioContext` (every param throws on NaN), the space's numbers (closed fraction, wall distance, floor, lid, wet, wave rate, forest) at the peak, the shelf forest, the pit, the vent and the void, a placed hit, mute; `updateAudio`'s cost a frame. `node test/audio.js`.
- `test/anim.js` — headless check of the swimming animation two minutes into a session: the finback's tail speed and the soft-arm's and coilshell's arm-tip jerk through accelerate/cruise/turn/sprint/coast; fails on a phase spin, a shiver or a fling. `node test/anim.js` (`T0=600` for ten minutes in).
- `test/census.js` — the world's population on paper (v11.26): every kind's capacity from the envelopes, its derived rates, and the ledger's model run for N days with nothing loaded, the totals every tenth of the way; fails if any kind collapses under a fifth of its start. `node test/census.js 120`; `json` for the day-0 totals.
- `test/combat.js` — headless check of combat.js (v11.31): a hunter takes hold of prey and kills it in the hold, the rope never parts or NaNs, a holder that drops its target lets go, the player is held and bitten and bleeds, the player's grab holds a small thing and is torn free of a big one, the bite gulps forage and tears at what is held, blood comes and goes; then a table of what every placed hunter's hold means for a thrashing finback (does it form, how long, hp lost). `node test/combat.js`.
- `test/lint.js` — undeclared and unused names across the whole bundle (acorn is vendored as `test/acorn.js`, so it always runs). `node test/lint.js`.
- `test/preview.js` — renders every creature builder (or the ones named) to `test/preview/<id>.png` headlessly with real geometry (`test/geo.js`): four views, idle and action. The way to look at a model before the person does. `node test/preview.js sickle trap`; `SPEC=file.json node test/preview.js` for a lab spec; `FLORA=1 node test/preview.js reed rind` for a flora species' three variants, tinted by its pigment (`DEPTH=-30`).
- `test/ident.js` — compares compiled specs against old hand builders (`OLD=path node test/ident.js`: the v11.9 builders for the first eighteen, a v11.24 copy of creatures_builders.js for the rest); skipped without `OLD`.

Add `#zoo` to the URL, or press z on the menu, for the bestiary: every species of the roster one at a time in the water at the peak (left/right to step, space for the strike, s to cruise, drag to turn, wheel to zoom, z back).

Press ` (backquote) in game for the debug readout: fps, frame ms, draw calls, triangles, cells, far regions, creatures, physics ms, render ms (the submit plus any wait on the GPU: when it runs away from the rest, the GPU is the limit), the heap, medium (sea / air / strand), the tide, the local hour, the sun and the moon, the light, cloud and rain.

The sea has a surface and a tide (6–9 m, twice a 30 h day that passes in forty minutes), a sun that sets fifteen minutes in and a big moon that rises with it, weather that comes through on the wind: swim up hard and you leave it. There is land — the rim of the lagoon, sea stacks in the rockfall, an island beyond the bladder forest — and a fish on land flops. Rocks and rigid plants are solid, soft plants bend out of your way, the marine snow moves with the water you push, creatures have real bodies and simulated arms that close on what they catch, and a lily pad takes your weight.

## Docs
| file | read it when |
|---|---|
| `HANDOFF.md` | starting a session: what this is, the person, how to deliver, what bites, where things stand |
| `PLANET.md` | the planet and the rules its life obeys — the most upstream doc; the ecology, clades and flora defer to it |
| `FLORA.md` | the sessile life: the filter, the eight-bauplan grammar, the roster by depth band, the generator plan — proposed, awaiting the person |
| `REEF.md` | the reef as a landform (10 Sep 2026): how big a colony really gets, why the big things are framework, the tools and their believability, the generator (v11.20) |
| `CLADES.md` | the creature clade audit and the three clade signatures as built (v11.8–11.9.1) |
| `CREATOR.md` | the creature lab: a spec-compiled body-plan system for every animal, the dev tool (v11.10–11.11; every species since v11.25), the player's creator later |
| `DESIGN.md` | touching a system: one section each, with the numbers, the knobs and the reasons |
| `CHANGELOG.md` | judging risk: what each version changed, what the person verified, what was never seen |
| `src/INDEX.md` | finding a name: every top-level name and its line, generated by the build |
| `../AUDIT.md` | the 9 Sep 2026 audit: where the frame goes (measured on the person's 4060), the ranked fixes (v11.12 built the first eight), the refactors worth doing, the friction |
| `POLISH.md` | the 9 Sep 2026 survey of low-budget effects (IDEAS #3): the catalogue, what not to build, the ranked list in three passes, the person's decisions — pass A (the light) built as v11.13 |
| `IDEAS.txt` | the person's own backlog (a copy of `Tethys Ideas/Ideas.txt`, which the zip never carried) |

## src/
| file | what it owns |
|---|---|
| util.js | math helpers, seeded rng, value noise |
| world.js | the island's geology as a terrain function `sample(x,z)` with the condition fields, tolerance envelopes `envW`, the wave function `waveH`, the water colour, landmark placement |
| physics.js | contact: the collider hash (spheres, capsules, lily pads), body hitboxes, the chains that are arms, tails and tentacles, body-to-body contact, the disturbance lists the flora and the marine snow react to |
| scene.js | quality tier `Q`, renderer, camera, light pool, the fog (three's replaced), shared materials |
| parts.js | geometry kit: `part`/`merge`, arm rings as rigs and their poses, LOD baking |
| grow.js | the flora grammar: eight bauplans, the founder lines' detailing, `pigment(h)`, `flowYaw`, and `species()` (three variants packed into one geometry) |
| creatures_builders.js | palettes and the kit (ring mouths, coil shells, fins, tails, valves, legs…) the specs compile from; no hand builders since v11.25 |
| creatures_spec.js | the spec compiler: eleven cores, the part registry, `compile`, `validate`, `derive` (the calculator), `coatFor`, `SPECS` for every species, JSON/hash/export |
| flora.js | the species (built with grow.js), the kept geometries, the rock kits and big structures (crags, slabs, the arches, the old dome) with collision lumps, and the table of densities and tolerance envelopes |
| reef.js | the framework generator (REEF.md): four reef kits with anchors, the lime palettes, the eight reef entries appended to FLORA |
| creatures_defs.js | species stats and the spawn table (kind, count, tolerance envelope) |
| audio.js | the sound: the 3D space read from the world, the water's beds, the body's sounds, the one-shots (AUDIO.md, DESIGN The sound) |
| creatures_ai.js | registry, spawning (juveniles), behaviours (hunger, the feed, the scavengers), the carcasses and the eggs, per-frame update with LOD |
| chunks.js | cell streaming: height grid, terrain mesh, flora, solids (collision), spawns from the ledger (`placeKind`), culling |
| ecology.js | the world's population as a ledger (v11.26): capacity per cell from the envelopes, the off-screen model (births, predation, starvation, drift), the births owed to loaded cells |
| far.js | beyond the cells, regions streamed round the player: coarse far terrain, every big structure, every landmark, far impostors for the kelp, bladders and rafts, the water colour map the fog reads |
| player.js | clades, movement in water / air / on land, splashes, camera, abilities, damage (the bite and the grab are combat.js) |
| atmosphere.js | the sea surface and its shader, the sky (one shader: sun, moon, stars, clouds, a bow), rain, marine snow, fog/light by medium, hour and depth, HUD, compass |
| combat.js | how combat happens (v11.31): the holds (a rope between a grip and a body), the struggle, bites in a hold, wounds that bleed, the blood, the player's grab and bite |
| effects.js | the effects list (v11.23): the cosmetic systems switchable live, saved in localStorage |
| zoo.js | the bestiary: one species of the roster at a time at the peak, with its caption and its strike |
| lab.js | the creature lab (`#lab`, `l`): edit a spec live, derived stats with locks, coats by chemistry, copy/paste/link/export, `p` places it |
| save.js | the save files and the profile (v11.47): slots in IndexedDB with a file export/import, what has been seen, the creator's saved creatures |
| menu.js, input.js, main.js | the menu (new game, continue, options, the creator), controls, frame loop |

The order above is the build order. Content edits usually touch only `creatures_defs.js` and `flora.js`; a new creature is a spec in `creatures_spec.js` (make it in the lab, export, paste) or, if the kit lacks a part, a new part in `PARTS`; a new plant is a `species()` call in flora.js built from grow.js's bauplans.
