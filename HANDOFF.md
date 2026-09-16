# HANDOFF — tethys

**v11.65.1 (15 Sep 2026): SEAFLOOR.md.** The chain's diversity and its underwater ground, recorded from a discussion and agreed by the person:
what can differ per island (brooders, ecotypes by exposure, the progression rule, colour by rock age, the sill relict) and the formations to build
(lava tubes, the terrace notch, tidal channels with ebb deltas, a canyon per island, the giant's slide blocks first; then pillows, dikes, talus,
blue holes, the guyot, more pits, diffuse vents, iron crusts, sand waves). Nothing built. Open and the person's: the range term for endemics (§5).

**Next (15 Sep 2026): the person's answers, then the chain's next record.** The archipelago's four build steps are done; what waits is the
person's: the giant's character (the caldera, the boulder field on its rim, rivers, the reef, the greens above 60 m, the cliff's colour —
CHANGELOG v11.62 and v11.65), the air (the clear day, v11.64), the ocean beyond the sill (its chemistry is the basin's and wrong there, v11.65),
and whether the young shield gets its record next (its centre is 5 km past the new edge; the horizon tier would show it from here). Step 5,
the road across the crossing, is designed nowhere yet (DIRECTION). A performance pass is due: the heap is ~350 MB (the ledger's tables, the
1440² water maps), the paper census takes 30 s after boot, `--test` runs 6 minutes.

**v11.65 (15 Sep 2026): the world at 240 cells.** `NCELL` 240 (51.6 km): the giant is whole and reachable — its summit, its caldera, its
western half — and the sill's crest has 23 km of ocean flank beyond it, floored at the plate (world.js `SILL.plate`, the ridge's window opened
outward). The ledger walks per-entry lists of the cells a kind can live in (ecology.js `POP.cells`, `ecoMark`, `ecoIndexAll`; the tables stay
dense; a save rebuilds the lists), so the model's cost is the habitat's, not the 57,600 cells'. The mist's integral no longer overflows for a
ray dropping 90 m or more (scene.js `mistL`: from the summit the sea past the far plane was black). The horizon tier reaches 250 km and its sea
disc carries the water column, tuned to the surface mesh's far end. Ours bit-identical over the old square and the old world. Seen from the
caldera, the rim and 300 m over the shelf.

**v11.64 (15 Sep 2026): the horizon tier.** The giant shows from our surface: with the camera in air a second pass draws the sky dome, a sea
disc to 80 km and one coarse mesh of every island's land from `sample()` (horizon.js: `Q.hz` grid, the planet's curvature as d²/2R, the world's
own air fog without the far cut) and the main pass draws over it with the depth cleared. The air is a trade-wind day now (world.js `AIR`:
visibility ~30 km, the boundary-layer mist doing the physics; to v11.63 a 1 km "hazy coast", the numbers kept by name) and the far cut is
lifted for air, so the world's far terrain keeps 58% of its contrast at the far plane where it used to dissolve — a look change the person has
not judged. Seen from open water at 3 and 15 m, from 40 m over the peak and from the world's edge.

**v11.63 (15 Sep 2026): the world map in the game.** `n` in play or the menu opens the world from `sample()` (worldmap.js: the maps' bands and
contours, the islands' rings, the clamp, the loaded cells, the landmarks, you and your facing; wheel zooms and re-samples the window, drag pans,
a click teleports and closes). A dev tool beside `tp()`, which now clamps its point to the world and says so. Seen over the play; the menu path
not looked at.

**v11.62 (15 Sep 2026): the giant's record and the land term.** `ISLANDS[1]` is the giant at (−15400, 9200): 14 km of land to 900 m with a summit
caldera, rain gullies on the windward flank to graded floors, the last flows down the rift zones, a wave-cut cliff where the surf strikes, a 1 km
shelf with the 12 m terraces, a 12° flank to the floor at ~13.8 km — its foot reaches ours (the saddle −927 at 4.5 km from our centre). The kit
gained `land` (world.js `islandH`) and lost its last hard-coded radii (`riftR`, the shelf edge from the terraces, `fade`, no lagoon without a rim).
Ours is proved bit-identical over the old square; every change in the world lies inside the giant's reach. Its centre is 2.5 km past the world's
edge until step 4: what stands in the world is its eastern flank from ~640 m down, the shore, the shelf and the saddle. Looked at from the
shore, a valley and the edge (frames in the changelog); the summit and the caldera only on the map (`test/map.js`, `map.html`).

**v11.61 (15 Sep 2026): the islands as records.** `ISLANDS` in world.js, `islandH()` the geology in an island's own frame, `sample()` the
smooth max of every island in reach over the basement; ours is `ISLANDS[0]` and is proved bit-identical to v11.60.2 over the old square and
the whole world (only `rel` beyond 8.5 km changed, meant: the floor's hills read as relief now). Nothing placed.

**v11.59–11.60 (15 Sep 2026): the maps.** `node test/map.js` draws the world (bands, hillshade, contours, the old square, the sill, planned
islands via `PLAN`) to `test/preview/map.png`; `map.html` is the same map interactive — islands added, dragged, resized, the sizes and
distances derived, exported as the `PLAN` string or JSON. The person is using it to place the archipelago; the next build waits on their
plan (a huge distant island is the ask: island records in `sample()`, subaerial geology, the horizon tier, the world grown to hold it).

**v11.58 (15 Sep 2026): the basin — the same island on a 26 km world.** The person's first step toward the archipelago: nothing but the
island as it is, on a world you can swim out of until you hit the sill. `NCELL` 120 (25.8 km a side; the island's square is the middle 16,
untouched to the bit — verified over every sample of the old square); past r 2400 the flank meets an abyssal plain at −1100 through a
smooth knee (`smax`); the sill's nearest segment crosses the north-east corner (`SILL`: crest 13 km out, summits to −150, the sill proper
at −430, the main gap on the current's axis with the inflow's jet); the seamount effect fades past the island. The far layer streams
(`FAR_R`/`FAR_DROP`), the census and the model are cut into pieces for 14,400 cells, the save's ledger is run-length coded (0.3 MB). The
person chose the sill over the plate on the condition that it is real (PLANET, The basin: the Cariaco, the Black Sea, the Iceland-Faroe
Ridge; the tides are the one stretch, answered by few deep gaps and a basin far larger than the map). Seen: the summit garden at −141, the
gap, the toe, the floor. **Ask first:** the frame at the old island (the far scan is 900 a frame), then a real swim down the flank to the
gap. Next, per the person: audit the island's believability, then discuss what expanding to more islands looks like (sample() as a sum of
island records over the basement; the horizon tier so the next island shows from the surface; the float32 ceiling near 50 km).

**v11.57 (15 Sep 2026): COMBAT pass 3 — the wound as a spec edit.** The last of the four passes: a wound edits a live copy of the body's spec and the calculator runs again (`speedK`, `turnK`); a hold on a part's own capsule takes the part instead of the life when the edge is through — the four slowbloods' tail capsules are marked `own: 'tail'`, a torn-off tail hides its meshes, bleeds, and leaves the body at a fifth of its speed (`LOSE.floor`), the hunter let go with its mouthful; a hunter that loses a part flees; a dropped arm keeps a stump (`RIG_STUMP`) and grows back segment by segment over five days; the commit coasts so the bite lands where it was aimed; the save carries the lost parts. Seen in the pane: the stub among seven arms and the same arm half back, the finback without its tail with blood at the stump. **Ask first** whether a tailless finback at a fifth of its speed is the slow death wanted or should end the animal (`LOSE.floor`); then the stump in first person; then whether the flee-by-bites rule (`FLEE`) should go now that a lost part does it. COMBAT.md is built in full; what is left there is tuning by play and the far LOD showing a lost part.

**v11.56 (15 Sep 2026): COMBAT pass 4 — the trail, the miss, the save, the poison.** Hunters read blood: a hungry hunter takes a bleeding body it eats within `SMELL_R` 90 m as its chase, past its eyes. The strike's miss rule: a hunter in reach commits (the mouth opens, the tell) and the bite lands 0.25 s later only if the prey has dodged under `MISS.k` 0.8 of its width across the strike's line — a miss costs it 1.5 cooldowns; strikers, the trap and the lurker's lunge commit the same way. Injuries ride the save (a dropped arm, its regrowth, the bleed). Hingeshells that feed below the chemocline or in the vents' heat carry the sulfur line's toxin (`POISON`): what eats one is sick 45 s at half speed and unfed; the abyssal is immune (its combs). Seen in the pane: the mouth opening at the commit; the dodge trials (turning at the tell: caught 4/5 at k 1.0, missed 4/5 at 0.8 — 0.8 baked in; turning before the tell: missed 5/5); the toxin loading on a scuttle at the rim. **Ask first** whether the tell reads and the dodge is learnable in play (`MISS.t`, `MISS.k`); then whether a wounded finback draws a second hunter on the shelf (`SMELL_R`). Pass 3 built as v11.57.

**v11.55 (15 Sep 2026): COMBAT pass 2 — the states.** The person's three answers (COMBAT.md §9: autotomy automatic; the finback born with plain petals, the cutting edge by the creator later; death ends the slot's animal), then the build: no hit points anywhere (the health bar gone, `derive.hp` gone, `DEFS.hp` a forage/immortal flag); a slowblood swallows what fits its gape by geometry; a hold kept past its pin time (`PIN`, by the mass ratio) is a pin and the placed act follows from the edge's verdict — opened, skewered, crushed, the nerve cord, or the hunter lets go; wounds bleed for the clade's clotting time and slow the body, never kill; the lurker's and the coilshell's paralysis (pinned at once), the basker's and the grazer's new spines that sting a holder off them (under 4× their mass); a ringmouth drops the held arm (regrows in 5 days); the player's death writes the cause to the slot and returns to the menu, continue starts a new animal in the same world. Seen in the pane: the lurker's kill to the menu with the note, the soft-arm's dropped arm by the numbers, the spines in the previews. **Ask first** the window: the big slowbloods swallow the finback 0.75 s into the hold (`PIN.t`, its floor) — the fear or too fast; then the dropped arm's look, the paralysis in first person, the spines in play (CHANGELOG v11.55). Pass 4 built as v11.56.

**v11.54 (15 Sep 2026): COMBAT pass 1 — the edge and the covering; no capsule past the nose.** The person's discussion of the day became COMBAT.md (injury as states, not numbers: gape, hold, edge against covering; wounds as spec edits; the kill and the escape per clade; the chemistry per clade in §3b — ringmouth venom by the beak, slowblood venom on the spines, hingeshell poison from the seep diet). Pass 1 built: every body has an edge (a new `edge` on the slowbloods' petals: cut, point, crush) and a covering per hit capsule, `EDGE` in combat.js says what gets through what, a hold records what it is on and the readout's hold line shows it; nothing dies differently yet. Reading the matrix found the contact fault: every lathe's hit capsule ended 0.5–0.7 of a body past the frame's nose (2 m at the ridge's scale), so bodies touched and a hold's rope stopped before the jaws arrived — `compile` now clamps every capsule at the nose (the ridge's jaws at contact: 2.6 m off the finback → 0.4). Seen: the hold line on a ridge holding the finback. **Ask first** whether bodies now sink into each other or the flora (every contact shrank by up to 2 m at the nose); then the jaws at the flank in third person. The three decisions gating pass 2 were answered the same day (COMBAT.md §9) and pass 2 built as v11.55. §7 has the matrix's findings (the hingeshell hunters of slowbloods have no kill in the kit; the gape rule would swallow the player).

**v11.53 (15 Sep 2026): POLISH pass B, the body.** The person's ask. fx.js (new): one pooled point system — silt in the floor's colour where a body moves on it or jets near it, bubbles from the seeps, scraps in the prey's colour at a bite; the breach's residue gets a ring; every body squashes with its acceleration and strike, banks into a turn and lists when stunned (`bodyPose`; a rigged body's chains' rest turned with the roll); a wound flinches the chains, spins the body, leaves silt and scraps, and can flush pale (`flush`, off); the player's bite snaps the body and nudges the camera, a hurt kicks the fov 2°. `debris` on the effects list. Lint now fails on a name declared twice (fx.js's first `updateFX` was silently replaced by effects.js's). Seen in the pane: the silt on the flats, the scraps on an eel, the seeps' bubbles at the rim, the numbers on the roll. CHANGELOG v11.53 has the eight asks; **first**: the silt's amount, the banking's sign on the finback in a hard turn (`POSE_K.bank`, negate if it leans out), a bite's snap and nudge together. Not built: 22 (corpses that lie, a mechanic), pass C (the night).

**v11.52.1 (15 Sep 2026): the pools partitioned by sight.** The person's readouts on v11.52: `work` halved, the vsync interval rose (16 ms in the air over the forest) — every loaded cell's flora was drawn, behind the camera too, and their GPU had no room for it; the pane's `gl.finish()` had under-read the GPU (a hidden tab never presents). Now the blocks of the cells in view come first in each pool and `im.count` is their total (chunks.js `poolCull`, `poolMove`; the shadow pass draws all). **Seen by the person: 120 fps at all four spots, the forest at `work 4.1/4.5 ms` and 231 draws (v11.51: 7.3/9.7 and 447), the shadow re-render 2.3 ms.** CHANGELOG v11.52.1. Nothing to ask; the next performance lever, if one is wanted, is the far layer's 71 draws or the creature shadow pass's 16 casters.

**v11.52 (15 Sep 2026): the performance pass — the flora pooled per species; the Snell window struck; the placement deterministic.** From the person's four readouts (the forest at 3 m under: work 7.3/9.7 ms, 117 fps, 447 draws) and my own measurement in the app's browser (the loop driven by hand, a `gl.finish()` timed per frame, A/B interleaved): the frame is the CPU submitting draws — 434 of them, 268 the cell flora at one mesh per species per cell — not the GPU, not fill, not triangles. Built: every species without a card or a pad draws once across all loaded cells (chunks.js `POOLS`; a block per cell, out on unload; `test/pool.js`): 434 → 231 draws, 5.4 → 4.6 ms here, the world shadow re-render 2.5–4.3 → 2.0–2.5. That test found the placement was not deterministic (clearOf read the 3×3 contact query; v11.22's neighbour-structure registration skipped loaded neighbours) — fixed, DESIGN Determinism. Also: the Snell window struck (the person: it looks bad); the creatures' shadow map freed when `shadows` is off; no rain with `clouds` off; `own light` on the effects list; the penumbra halved (`SHM_PEN`). CHANGELOG v11.52. **Ask first** for the readout at their four spots (`draws`, `work`, `pools`); then a slow crossing of a cell line; then `world shadows` on in the forest.

**15 Sep 2026: the person's answers to the open list, and the call on the ask lists.** Asked, from the docs' every "ask first" since v11.34, as one list. Answered: **the player's own light goes on the effects list** (POLISH.md, Raised 13 Sep: yes). **The 13 Sep audit's four leftovers are all to be built**: free the shadow map when `shadows` is off, no rain from a clear sky with `clouds` off, the shimmer sprite replaced, the soft shadow edge hardened. The lone ortho's 202 m meal: no matter, the creatures will be overhauled. `glim`: **a species, kept** (CLAUDE.md's note updated). The de-res (PIXEL.md): the texels need a few more passes at *higher* intensity before toning down — today the grain only makes sand look good and everything else looks weird; not now. **The rest of the per-version asks (v11.34–v11.51: the fov, the menu's shot, the chop, the glitter, the surf, the caustic in play, the tail, the wavs, the night shower) are let be** — "such small issues"; future passes will go over most of them, and they are not to be re-asked as a list. **Next: a performance pass** (the person's choice over the look list), then the two builds above. The "ask first" lines below stand as the record of what was never looked at, not as questions pending.

**v11.51 (15 Sep 2026): the sky through the surface, refracted.** The person on v11.50: "almost zero occlusion or any kind of warping or refraction … it can't be a completely straight view through". The underside now reads the frame through each facet: an empty mesh in the opaque pass (`refrMark`, renderOrder 0.5) copies the drawing buffer after the sky, the land and the creatures and before the player's body (renderOrder 1 under water), and the surface, opaque from below, mixes that copy in by the window's share sampled at its pixel moved by the *differential* refraction — the facet's bending minus the mean surface's, so no cone and no snowglobe, each facet wobbling the image by its own tilt, the ripple rings inside it (`ripSlopeR`; the capillaries folded the image into stripes and are left out). The window's band is 0.35–0.8 of the cosine (full to 37°, gone by 70°; was 0.05–0.8). `refraction` on the effects list with a `wobble` slider (1 = the physical differential; 0 = v11.50). Seen in the app's browser from 14 m straight up and at 40° (`test/render/v511_*.png`): sawtoothed cloud edges moving with the swell, the mirror taking over past the band, the body's edges clean. **Ask first** whether the wobble in motion reads as water at 1600×900 and what number on the slider they settle on; then the readout's frame time under water (a full-screen blit per frame); then a creature between the eye and the surface, which can fringe by up to 45 px.

**v11.50.2 (15 Sep 2026): the whitecaps struck.** The person's still from 40 m looking up: pale flecks over the whole surface. They were the v11.46 whitecaps (`vFoam`, foam by the wind sea's steepness) drawn on the underside; through the water the wind-aligned streaks were pale lozenges. v11.50.1 took them off the underside; the person then asked for them gone from above as well, so v11.50.2 strikes them: the surface's foam is the surf alone (`vBrk`), `FOAM_S` and the varying are gone, WATER.md E is marked struck. Seen from 38 m under (`test/render/v501_after.png`) and from 5–12 m over the open sea (`v502_above*.png`). **Ask first** whether the open sea reads right with no whitecaps at all in a full wind, then the surf zone from both sides.

**v11.50.1 (15 Sep 2026): the sparkles on the underside.** The person's still from 40 m looking up: pale flecks over the whole surface. They were the v11.46 whitecaps (`vFoam`) drawn on the underside; through the water the wind-aligned streaks were pale lozenges. The underside's foam is the surf alone now (`vBrk`); the topside is unchanged. Seen from 38 m with the loop driven by hand (`test/render/v501_after.png`). **Ask first** whether they are gone in play, then the surf zone from below.

**v11.50 (14 Sep 2026): the sky through the surface, plainly.** The person on v11.49's window: "like a snowglobe … I just want to look up and see what's going on above me, through a shader". The dome is drawn under water and the underside is translucent by the facet's angle to the eye (`WIN_T` 0.7 straight up, nothing at grazing, × the water's transmittance), over the mirror's colour — the sky, clouds, sun, moon, stars and anything in the air, through the surface as they are. The physical Snell's window (v11.43–v11.49) is the `snell window` row on the effects list, off. Seen from 14 m and 3 m under and in the forest (`test/render/v50b_*.png`). **Ask first** whether it reads right in play and where `WIN_T` should sit; then the line while surfacing (things in the air show through now); then night.

**v11.48 (14 Sep 2026): the camera's field on the readout.** The person's Subnautica-VR question (a reaper that felt like a shark your size on a flat screen): the field of view, the first-person field and the third-person arm are `CAM_K` (scene.js), tuned live from the readout (`CAM_TUNE`, main.js: ←→ fov, pgdn-pgup fovFP, ↓↑ arm, Backspace resets). Defaults unchanged (62°, 62°, +0 m). Seen: 62 → 50 with the arm at +2 holds the body's framing and compresses the field; `f` and Backspace do what they say. Also found and fixed: the physics, combat and live tests measure the title screen's world, which v11.47.2 moved to open sea — they broke there (v11.47.2's "green" was not), and now load the peak by hand. **Ask first** for the veil or the abyssal at 62, 55 and 50 with the body in frame; then whether 50 turns are uncomfortable; then the number to bake in. The reasoning and the other scale cues (fog along the body, eye size, texels, slow angular motion) are in the v11.48 CHANGELOG entry and DESIGN's The player.

**v11.47 (14 Sep 2026): the menu and the save files.** The person's ask. The game boots to the caldera under the same camera, but with no clades turning: the title and a column — `new game` (the finback at the peak, a new slot; the creator is to be the start later, the person's word), `continue` (the slots: load, export to a .json file, delete with a `sure?`; `import a file`), `options` (the effects list; the menu's `effects` word is gone), and `creator` once the lab has been opened once or `#creator` is in the URL (the lab as the player's: only the species, clades, cores and part styles seen within 30 m in play, `PROFILE.seen`; a saved-creatures list in the lab's save section with a file out and in). A save is the player, the clock and the ledger's tables (~110 KB), in IndexedDB (`save.js`; localStorage or memory as fallbacks; `navigator.storage.persist` asked for), written every 30 s of play, on esc to the menu (esc twice from locked play) and on the page hiding. Seen in the app's browser: every page and the whole loop (CHANGELOG v11.47). The person on v11.47: "looks awesome … good job"; asked for the column in the centre, rising slowly or waiting for the mouse, and doubted continue restores the place. **v11.47.1:** the column centred in a soft dark halo, rising over 1.6 s a second after the fade clears (`MENU_RISE`), the whole menu fading away after 12 s without the mouse moving and back on the first move (`MENU_IDLE`, `#menu.idle`); continue verified across a page reload (the player back on the shelf at 300,60 with its heading) — the doubt was a save that never happened: the first esc from locked play only freed the pointer, so a close right after lost everything since the 30 s autosave. Now the pointer's release saves (`pointerlockchange`), and the page's exit writes a synchronous shadow to localStorage (`saveShadow`, read into the store at the next boot). **v11.47.2:** the person on v11.47.1: the words grey, and the title screen's camera — the start must be a shot with the horizon in the middle and the ocean under it, and after any play at all the title screen opens from the exact spot you died, left or saved in. Built: the words near white and the halo lighter; `MENU_SHOTS` (menu.js) — the sea shot from 6 m over the water at (700, −700) with the island's one cone on the horizon is the start, the caldera shot kept in the table unused — and `camNote` (save.js) writing the camera to localStorage at every autosave, esc, pointer release, page exit and death, read at boot; esc to the menu holds the camera where it is. Seen: the sea shot, the title screen in the weed forest after esc and again after a reload. **Ask first** for the sea shot on the 4060 (the cone's placement, the 6 m height against the chop), then whether a title screen from a death spot reads right, then esc-twice from locked play (a pause page instead?), then the world coming back believably after a long game, then the creator's gate from a real game, and whether what-has-been-seen should be per save rather than per person (it is per person now).

**v11.46 (14 Sep 2026): the rest of WATER.md Part 3.** The person on v11.45: "great job … a little less row-like … build the rest". Built: the 46 m swell as two trains at ±0.15 rad (lozenges, not rulings); foam by the wind sea's steepness with a downwave trail and streaks (`FOAM_S`, `chopSlope`; the foam by height gone); the glitter — the caustic's trains as a gradient tile plus three capillary trains tilt the normal the sun's specular sees (`ripSlope`, `RIP_CAP`, `GLIT_K`; specular 0xd8d8d8 at 500); the slope of what the mesh faded out tilts the reflection past the grid's reach (`restSlope`, `SLOPE_AA`); a breach leaves a foam patch and a bubble puff (`residues`, `RES_*`); rain from below mats the window and speckles it. And a v11.44 slip found and fixed: the wave energy read a shore field, so the open sea had 35% of its chop for two versions — full now, with the island's wind shadow instead (`waveEnergy`, `LEE`). Seen at 1280×720 (`test/render/v46*.png`). **Ask first** whether the open sea's full chop is too rough in play; then the glitter from 1 m into a low sun (soft patches close in, not sparkle — the one part that did not land); then the weed forest's frame time (seven sines in the sway fold). Not built from WATER.md: nothing — E, F, G, I, J, K and Part 3 are all in; the capillary glitter close in is the open tuning.

**v11.45 (14 Sep 2026): the line from above (WATER.md Part 3).** The topside reflects the sky in the direction the eye reflects off each facet (`skyLite`, `REFL_FACET`), composited as a reflection (alpha the covered fraction, the colour divided by it), with the facet's own Fresnel where the view is steep and the mean's at grazing (`REFL_GRAZE`); every fragment in air converges to the sky in its own direction with the haze to infinity (`skyFar`, six shared vec4s `uSkA..F`) instead of the horizon keyframe's constant; a 150 m long swell from upwind in the trade belt (`WAVES[5]`); the air a step clearer (`AIR.dens` 0.0024, `far` 0.0018); the back face seen from a trough the column's veil. Seen at 1280×720 with the loop driven by hand: the swell's rows converge to the horizon from 15 m, the sea ends darker than the sky away from the sun and in its glow toward it, the far kelp and the shore end in the sky. **Ask first** for the sea from the shelf at 5–15 m in play (rows or stripes; `REFL_FACET`), then the line from 40 m (still a soft band; the far cut is the limit), then the render ms in air. Not built: F (sub-facet glitter — the sun's side is still bars), P3's slope-in-the-light past the mesh's fade, E, I, K.

**v11.44 (14 Sep 2026): shoaling, breaking and shelter (WATER.md D); the foam emissive; a v11.43 comment that ate six bindings.** Every wave sum reads the water depth and a wave-energy channel (the floor map's green: exposure and the lagoon's shelter) at its point: Green's law up to ×1.6, the breaking cap 0.39·depth, the wind sea by the place's energy, the swell by half of it (world.js `waveFac`, scene.js `waveAmpGLSL`). Breaking is foam from both sides. The v11.43 comment sat mid-line and killed the surface's uniform bindings after it (its fog set fell back to the split one — dark patches on every far crest from above); fixed. Seen: the shelf from above and below clean; the shore's amplitudes shoaled. **Ask first** for the surf line at a low spring and the weed forest's frame time (the sway fold fetches the map now). WATER.md's remaining items: E (foam by steepness), F (sub-facet glitter), G (a long swell), I (breach residue), J (the topside reflection by direction), K (rain from below).

**v11.43 (14 Sep 2026): the real Snell's window (WATER.md B).** The underside refracts the eye through each facet into a reduced sky (`skyLite`: gradient, aureole, sun disc and glare, moon, the deck's shade) with the sky's own uniforms; the horizon colour past the critical angle; the person's soft band kept as the blend into the mirror. The shimmer sprite and its `surface glow` row are gone; the old glint too. Seen at noon (the disc through the facets), 2 m under, and at sunset. Ask for the moon at night. Next: D (shoaling, breaking, the lee).

**v11.42.4 (14 Sep 2026): the far kelp cards dimmed.** The person on v11.42.3: "95% fixed … massive difference in the believability of the world"; the last thin pale line along the far water level was the impostor cards' residual through the fog reading paler than the veil (not the shafts — hidden, no change; cards hidden, gone). `FAR_IMP` has a `dim` per card kind now (stipe 0.55, bladder 0.7). Seen from 10 m under; ask for the swap at 450 m in daylight.

**v11.42.3 (14 Sep 2026): the white band found and fixed — seen.** With the app's browser pane open: the "white nothingness" was the sky sphere's lower half showing under the horizon where the far terrain clips at the draw distance, visible under water within `SKY_NEAR` and from above through the surface. The sky now draws only above the water plane and the dome only below it (both media); on a split ray the far cut closes to the water; the fog's level is the higher of the drawn surface and the true wave; and the underside mirror is the veil in the reflected direction (WATER.md C, built). Seen from 0.25 m above, 2 m under and 10 m under at noon: clean. Ask for the line while swimming, dusk and night from both sides, the shore. Next from WATER.md: B (the real Snell's window), D (shoaling, breaking, the lee).

**v11.42.2 (14 Sep 2026): the fog cuts the ray at the drawn surface.** The person on v11.42.1: "still seeing white nothingness out there" — a white wall of far kelp on the horizon from either side. The mesh fades its waves out with distance and the fog cut the ray at the full sum, so the band between was classed as air. The fog chunk now sums the waves with the mesh's own fade (`WAVE_FADE_D` from the grid's numbers). Tests green, unseen by me; ask for the far forest from just under and just above the surface.

**v11.42.1 (14 Sep 2026): the water's fog over the whole ray from above, the underside opaque.** The person on v11.42: "the clear water looks completely different, huge environmental step up" — and "the fog goes away once you leave the water" (the forest crisp to the horizon from just above it, a white flash at the line). Fixed: from above the water's part of a ray is fogged over the whole ray's length (nothing under water is seen further from above than from below; the halves at the line match) with the chop's scatter at grazing (`SCAT`); the surface's underside is opaque (the pale shore and sky no longer bleed through); the fog chunk's clock was stuck at zero (`FOG_TC`). Unseen by me — the pane would not tick; CHANGELOG v11.42.1 has the list, the forest from 2 m up first.

**v11.42 (14 Sep 2026): the fog in two segments, the swell with the wind, the camera on the line.** From `WATER.md` (the audit of the surface from both sides, committed the same day): every ray is cut at the water and each part fogged in its own medium (scene.js `fogWater`/`fogAir`), so from above the far seabed dissolves into the water's colour and the shallows clear; the through-water depth tint is gone; the surface's topside body is `SURF_BODY` 0.22; the swell runs with `WIND_A` (it ran dead against it); the camera may rest on the line (`CAM_CLEAR` gone, `camAbove` only for the light and sound). Tests green; shaders compile; one frame seen from just under the surface. **Ask first** for the sea from 15 m up over the forest and the shore from the water's edge; CHANGELOG v11.42 has the list. Next from WATER.md, in order: B (the real Snell's window: refract the eye into a reduced sky function; retires the shimmer sprite), C (the mirror as the reflected veil), D (shoaling, breaking, the lee).

**14 Sep 2026, the person's verdict on the de-res (v11.40–v11.41.3):** interesting, "its own look — not one to scoff at", but the game is built around a minimalist vibe "filled in by space as opposed to noise"; undecided, and done for now. Both looks stay on the `e` list, off by default (`texels`, `pixel light`, `banded light`). A possible later ask, theirs to raise: a really subtle version of the texels — a very small amount, only to touch up what reads as smooth. Passes C and D of PIXEL.md are not built and not asked for. Do not add texel effects unprompted.

**v11.41.3 (14 Sep 2026): the posterise dithered.** The person on v11.41.2's smooth light: "rainbow sherbet", the ground's colour patches frozen, the light no longer reading as light; the banded rings "distracting". The posterise now takes a 2×2 Bayer offset per cell instead of rounding (scene.js `PIX_GLSL`, `bd`), so a tone boundary is a checkered band of cells rather than a contour; `banded light` is on by default again, off the smooth light (CHANGELOG v11.41.3). **Ask whether the checkered edges read as light in motion; if not, the next step is the player's point light computed exactly per fragment and only the sun posterised.**

**v11.41.2 (14 Sep 2026): the light out of the texel.** The person on v11.41.1: with the pixel light the texels are "fantastic"; without it, undecided, but the game is "more cartoony" without texels; the one issue was rings of light travelling with the player — the posterise banding the smooth per-vertex light (Morrowind's look). By default the fragment now texelises the albedo alone (`diffuseColor`) and multiplies the smooth light back; `banded light` on the `e` list (`FX.texelLight`, `uTexL`) is the v11.41 look, off by default (CHANGELOG v11.41.2). **Ask which of the two they want to keep, and whether a body still reads as pixel art with its sun gradient smooth.**

**v11.41.1 (14 Sep 2026): pass B seen ("those textures look AWESOME"); the rock strata binned (rings round the boulders), the rock grain coarse (`PIX_ROCK_CLUMP` 3 cells), and the switch split — `pixel light` and `texels` are two rows on the `e` list, both off by default, so the textures can be tried under the smooth light (CHANGELOG v11.41.1). Ask whether the coarse rock grain wants more weight.**

**v11.41 (14 Sep 2026): the de-res, pass B — the pattern in the texel, built and seen.** PIXEL.md pass B as decided: in pixel mode every cell gets a hashed tone step (`PIX_GRAIN` 0.06 × the class's weight, `PIX_CLASS`, scene.js) and its class's mark — rock strata by world height (`PIX_STRATA`), a vein across a blade or a card (`PIX_VEIN`), sand grain heavy and rock grain light on the terrain by the vertex colour's luminance — and a body its coat's pattern (`spec.pattern {kind, scale, tone}`, `PATTERNS`: stripes, spots, plates, scales; by clade unless the spec says, `PATTERN_BY_CLADE`; creatures_spec.js "the texel pattern"), carried as a per-vertex attribute `aPat` on the body and its far LOD. The lab's coat tab has the three controls; `PIX=1 node test/preview.js <id>` draws the same rules without the game. Seen in the app's browser (CHANGELOG v11.41): the sand as texture, strata on the boulders, stripes, spots, plates and scales on the bodies, the controls writing into the spec and its hash. Also fixed: the v11.40 shimmer line (a trailing comment ate its opacity and position). **Ask first about the tone (0.12) and the sand's grain (too busy at 14 m?), then a ringmouth's spots up close, then the vein on a real blade.** Not built: C (the sea surface, the pixel font, the `pixel screen` row, the far terrain's grid — the terrain already shares one grid since A), D (the painter, and the lab's custom option with it).

**v11.40 (14 Sep 2026): the de-res, pass A — built, seen by the person ("literally zero complaints"; the animals and rigs good; render cost deferred, pixel is an optional style to compare).** PIXEL.md pass A as decided: one switch, `pixel` on the `e` list (was `pixel light`), off by default; meshes untouched; in pixel mode every tinted surface's colour is constant over a texel grid fixed to the thing it is on — the world at `PIX_T` 0.3 (= `CAU_PX`, the terrain and the landmarks on a new `MATLM`), a body at `PIX_TB` 0.15, a plant or a placed rock on its instance — by extrapolating the fragment's colour to the cell's centre with screen-space derivatives and posterising to `PIX_TONES` 16 (scene.js "The de-res", `addTint`'s `vGrid`/`PIX_GLSL`); the shimmer hidden; the fog continuous. Seen in the app's browser (CHANGELOG v11.40): floors in world blocks with the shadows on the same grain, bodies and boulders in two or three bands with stepped edges — **posterised more than texelised**, since the gradients are gentle and a flat face shows no grid at all; pass B's per-cell grain is what makes every cell visible. **Nothing to ask about A; the next pass is B when the person wants it.** B followed as v11.41 (above). serve.js's sink takes a `.png` now — a screenshot posted from the page — which is how the shots were taken.

**v11.37 (14 Sep 2026): the caustic is derived, the sea it needs is baked, and it is at the world's scale.** The 13 Sep effects audit (the person's ask: every switch on `e`, bugs and fit with the low-poly style) found v11.13's caustic was a gain that clipped the sand white, at the facets' own scale, on its own clock. It is now `1/|det(I − d·c·H)|` of a ripple layer that lives only in the light (the swell can't focus in the top 30 m): forty trains in five wavelength rings, 5 m down to 0.7, at equal curvature, baked at boot into two tiles a ring on a 40 m lattice (`CAU_RINGS` … `CAU_TEX`, scene.js), read back exactly at any time from two taps and a sincos, modulated by a gust tile (patches of net and calm), riding the swell's orbital carry, blurred by the sun's disc per ring, drawn where the focus reaches `CAU_T` 3 — in 30 cm world-fixed blocks with the shadows snapped to the same grid (`pixel light` on the `e` list), or smooth (the default since v11.38.1: the person compared and prefers it "at least for now"; the OG's look over the real structure); v11.38.1 also fades the contrast with depth (`CAU_D` 30 m, the beam's diffusion — there was a net at 73 m) and puts a `brightness` slider under caustics on the `e` list (`FX.cauK`). Nine rounds with the person over two days (v11.35–v11.37: a lattice, a stripe band, a print, dots, tiny blobs — per-fragment sines were never going to be a sea, and a wind sea's own steepness spectrum gives a snorkeller's fine web, not a world's). `test/caustic.js` draws the field at any depth and span; tune there, the menu's white sand shows nothing. Ask first about the person's 5–15 m views (CHANGELOG v11.37, Unseen). v11.39: the believability conversation, held and decided (PLANET, Decided 14 Sep 2026): a wind sea at constant steepness, no film, no stated stylisation — a fine web in the shallows, metre cells at 5–10 m, nothing by 25; the cells darkened so the drawn mean is 1; the gusts drifting downwind; the light shafts reading the same field (`cauFocus`). Ask first whether the wind sea reads as water in play at 2–15 m, and whether the darkened cells grey the sand. v11.39.1: `PIXEL.md` — the person's ask to de-res the whole world to the pixel light's grain (texels fixed to the ground, the bodies and the plants; meshes untouched; one switch), designed; its six questions were answered the same day (PIXEL.md Decided: bodies 0.15 m, the sea texelised, a pixel-screen row, a pixel font, patterns by rule with a painter for custom coats, the fog continuous) — four passes; A built as v11.40 (the paragraph above). The audit's other findings are not built and stand as a list in the conversation of 13 Sep: the shadow map is never freed when `shadows` is off; `clouds` off leaves rain from a clear sky; the shimmer is a canvas radial gradient (the most foreign thing in the effects list); the soft shadow edge is the more foreign half of an otherwise in-style shadow.

Where things stand, newest first. `CLAUDE.md` is the entry point — what this is, how to build, test, look and deliver, the
architecture, the conventions, what bites, the person — and is read before this. You (Claude) have no memory of the previous
conversations; the files in this folder are the state. This file is short on purpose. The upstream design is `PLANET.md` (the planet and the rules its life obeys; when the game
conflicts with it the game changes) and, for the sessile life, `FLORA.md` (downstream of PLANET, upstream of flora.js) `REEF.md` (10 Sep, built v11.20) is the reef as a landform — why the big things are framework and the generator that grows them; and, since 9 Sep, `TAXA.md` (answered, built v11.15): the descent of the sessile life — three
photosynthetic lines by pigment (greens, floaters, reds), the animal lines' splits, the colonisation order, the reef's zones, the swamp (parked); `DRIFTERS.md` (9 Sep, built v11.16) is the fourth clade: bells, buttons and sailers; `CLADES.md`
(v11.8–11.9.1, built) is the creature clade audit and the three clade signatures as built; `CREATOR.md` (9 Sep) is the
creature lab — one spec-compiled body-plan system for every animal, a dev tool first, the player's Spore-like creator later — with
the person's eleven open questions at its end (built: v11.10–11.11; every species a spec since v11.25); `POLISH.md` (9 Sep) is the survey of low-budget effects with the
person's answers — pass A (the light) is built as v11.13 and its shadows redone as a shadow map in v11.23, passes B (the body) and C (the night) are next; `AUDIO.md` (9 Sep) is the audio overhaul's design, built as v11.14 (DESIGN, The sound). The reference is `DESIGN.md` (one section per system, with the knobs and the reasons);
the history, what the person has verified and what has never been seen is `CHANGELOG.md`; the file map is `README.md`;
every top-level name with its line is `src/INDEX.md` (generated). Read a DESIGN section before touching its system.

## Where things stand

**v11.34.1 (13 Sep): the finback's tail, and a body's shadow on its own belly.** CHANGELOG v11.34.1. Two one-line fixes in shared
code, both from the person's screenshots. `G.lathe` now reverses a profile written top-down before three sees it: `FIN_TPROF` descends,
so the tail stem was built inside out and front-side culling dropped it — the finback has been swimming with no tail since v11.10.
Only the `tail` part uses a descending profile; nothing else moved. And the hand-read shadow is now multiplied by how far the
fragment faces the light (`nl`), so a surface the beam never reached is no longer darkened a second time with the shape of
whatever stood above it — the chevrons were printing on the belly. **Ask the person to look at:** the tail's shape, now that it is drawn
at all (`FIN_TPROF` was tuned blind), and whether the belly reads too flat.

**v11.34 (13 Sep): the sound bench.** CHANGELOG v11.34. Nothing the player hears changed. `#bench` (or `b`) renders every
sound the game makes to a wav — one-shots through the real `thump()` offline, the twenty-one live chains soloed off `master`, and
the master bus itself in situ — and posts them to serve.js, which writes them under `test/render/`. `node test/spectro.js` turns
those into spectrograms and a table of numbers (peak, rms, crest, centroid, rolloff, band shares, attack, decay, steadiness,
clipping). The point is that from here nobody can hear the game; the bench cannot say whether a sound is good, but it says
plainly whether it is what it was meant to be. **The first run found that eleven of the thirteen one-shots are the same low thud
(centroid 62–378 Hz, decay 260–385 ms) and that `thump`'s noise transient barely survives its bandpass — the "knock on rock"
has no knock in it.** Nothing was fixed; the findings are the CHANGELOG's Unseen list. **Ask the person to play the forty wavs
and say whether their ear and the pictures agree** — if they do not, the bench is what is wrong.

**v11.33.1 (13 Sep): a rainy night keeps three quarters; the daylight tuner is o-n.** CHANGELOG v11.33.1. The dark night
shots were the **rain**, not the night — rain reached the night twice (it inflates `cover`, and the night branch took 0.7 of that off
the moon), so a full shower left half of a clear night. `coverN` in atmosphere.js `updateSky` is the cover rain did not put there,
with a gentle 0.15 for the rain itself: a full shower now keeps 0.73 of clear (0.187 against 0.256) and a **clear night is unchanged**.
The moon's beam is untouched on purpose — no direct moonlight survives thick cloud. The fog tuner's `dlAt` moved off `p` (the lab's
place) to `o`-`n`; every other letter is taken. **Unseen: a real shower at night** — the change was verified against the person's own
readouts, not by waiting for weather.

**13 Sep, items 14 and 15 of the code review: measured, no change made.** The performance item assumed the world shadow map
was the lump; it is not, and the field it was read from (`shsN`) is the count of re-renders since boot, not casters. Measured at the
forest on the 4060: frame work 5.4-5.9 ms average and 7.9 ms worst against an 8.3 ms budget, **no dropped frames**; the shadow
re-render is 2.9 ms, 105 draws, 2.23M triangles, firing 0.33/s still and ~0.8-1.1/s swimming, so it takes one frame a second from
65% to 95% of budget and never over. The creep since v11.12 is the main render's draw calls, and those are **cell flora at roughly
one InstancedMesh per species per cell** — they scale as species x visible cells, so the archipelago multiplies them. The lever,
when work's max reaches 8.3, is batching a species across cells: a designed pass, not a knob. Numbers are in DESIGN, Performance.
The four look questions (item 15) are **answered** (13 Sep). **Night brightness is fine as it is**; the dark screenshot was the
**rain**, and that is a real finding — a full shower leaves 50% of a clear night, where the day was already fixed for the same
complaint in v11.18 and keeps 52% of noon. Diagnosed with the numbers and the knobs in POLISH.md, **not changed, awaiting the
person's call**. The bright blades are **the player's own light** (`plight`, a 40 m point light
riding above the player, brighter with depth and at night), not an emissive and not the pigment; the person notes it carries the mood
and the starting landscape's brightness and is unsure whether it is a good mechanic, so **whether it belongs in the effects list is
parked in POLISH.md** — raised, not asked for. The **square marine snow is kept on purpose**: the person likes the blocky read, and
squares are also the cheaper option, since rounding a point costs a texture fetch or a `discard` (noted in DESIGN and at `pm` in
atmosphere.js so nobody 'fixes' it). The pink tables among the stipes are the deliberate nut 0.45-0.55 overlap where two lines meet.
**analysis_review.md is now closed — the live list is DIRECTION.md.**

**v11.33 (13 Sep): the dead and the stale — the rest of the drift list, built.** CHANGELOG v11.33. Real fixes: `chunkAt`
reads `chunkGrid` instead of building a string key and hitting a Map on the per-frame ground path (verified equivalent over 4000
points in the running page); the ecology carries elapsed time past half a game day instead of dropping it; the starvation tally
reads `n` before the decrement; `landBite` guards a target `dropTarget` can null mid-strike; `blur` clears held keys; serve.js
survives a malformed URL. Removed: `fogExtinctOnly`, `moonIllum`, `trunkPose`, `cellW`, `ecoCell` and the unused `MATR2` program —
lint now reports no unused names at all. `ROSTER.new` cleared on the fifteen species that spawn, so the bestiary stops captioning
them "not yet placed". Kept on purpose with a note at each: `GLOW`, the `pads` path, `y:'mid'` and `glim` (a roster question).
Not done: the fog tuner's o/p collide with the lab's place — every free pair is already the audio tuner's or the game's.
**Nothing here should look different.**

**v11.32.1 (13 Sep): the readout shows the work.** The first line carries `work <ema>/<max>ms` and `gen <ema>ms` now — the
frame's own cost, the worst frame in the last quarter second, and the streaming's share. Until now it printed only the vsync
interval, so a capped display read 8.3 ms and 120 fps whatever the frame cost and the headroom was invisible. The max is what the
shadow-caster pass needs: that pass re-renders in bursts and an EMA hides them. CHANGELOG v11.32.1.

**v11.32 (13 Sep): one number, one place — the drift half of the code review, built, the menu and the forest seen.** CHANGELOG
v11.32; DESIGN, The medium and The ecology. Four numbers that were written out many times each. The **daylight curve** was six
copies and the JS measured depth from the tide while the GLSL measured it from sea level: one `daylightAt`/`DL_GLSL` pair now,
the shader following the JS, which needed the tide in the fog chunk — so `uFogW.x` carries TIDE and the water map's scale, a
constant of the world's size, is baked into the three shader strings as `WM_SCALE`. The **canopy fade** was a smoothstep in the
shader and a cut at -70 in the JS; the JS follows the shader now, and **this is the one visible change**: the water under a mat
fades in over -60..-90 instead of switching. **Two masses** are kept as two on purpose — `bodyMass` floored at 0.6 for contact,
`bioMass` unfloored for the allometry, because unifying them would halve a flicker's birth rate and the census is drawn on it.
The **chemocline** is `CHEMO` in world.js with its plate and tint bands derived from it, so moving it is one edit. The two slope
definitions are left as two (the far layer cannot afford a central difference) and both sites now say why.
**`node build.js --test` was green on both tiers with the world broken**: the curve in `SUNK_V` put `uFogW` into the *vertex*
shader, which only `fog_pars_vertex`'s sibling declared, so every Lambert program failed to compile and no flora or creature drew.
The stub compiles no shaders, so no test could catch it; a menu screenshot against a build of the previous commit found it in one
frame. **Ask first:** the canopy band at -60..-90 inside a patch (1400 m out, in the current's wake) — does the fade read better
than the step; then the water's colour across a full tide at 20-60 m, where the shader's daylight now moves by a percent either
way; then the light shafts' heads under the mats.

**v11.31.4 (13 Sep): the code review's render, lab and tests group — items 1, 8, 10 and 11, built, the strand seen.** CHANGELOG
v11.31.4; DESIGN, Land, Flora and materials, The light, Performance. All four stood, and item 8 was the shallow half of a bigger one.
**No plant had ever stood on the island's land.** The surface cap in `placeFloraType` — the rule that stops a stalk growing out of the
water — tests `f.top*sc > -1.4-h`, and on land `-1.4-h` is negative, so the test is true for any plant, the room is negative and every
try was skipped: `tussock` (per 1500), `scrub` (110) and `stranded` (26) had zero instances anywhere in the world. A plant rooted above
the tide line (`minH >= 0`) is exempt now, as the tidal forest's `air:true` already was; over the cells at the north strand tussock
0 → 797, scrub 0 → 70, stranded 0 → 9. `stranded` itself was on `MAT`, which has no variant collapse, so its three variants would have
drawn superimposed: it is `MATVD` now, the variant material without the 2.5% breath (a stranded float is a corpse). **The light shafts
had never taken the sun's colour** — the `shU.uCol` line was glued to the end of a trailing `//` comment, so they were the cold literal
(0.55, 0.72, 0.8) at every hour; read off the running game they are now (0.55, 0.68, 0.67) under a high sun, (0.55, 0.51, 0.37) at dusk,
(0.40, 0.58, 0.77) under the moon. **The smoke test's mouse had never reached input.js**: it took the first listener on each event and
zoo.js registers before input.js, so the bite and the look were untested while the comment claimed otherwise. Every listener now, the
stub's pointer lock works (`__nolock` puts the refusal back), and smoke.js asserts the look, the bite and the grab for all three clades,
locked and dragged. **The lab**: the NaN guard covers every number field (not only `stats.*`); the URL hash is a flag list
(scene.js `HASH_FLAGS`/`HASH_TIER`) so `#low&lab=<spec>` works and the lab writes the tier back instead of eating it; the nine duplicate
`LAB_NAME` keys are one entry each with the part-specific meanings in `LAB_NAME_BY`.
**Seen** (dev.html, 800×450, finback): a stranded float close up at (14, 1.1, 242) — one hull, five pink vanes, tendrils on the sand,
flat on the ground — two more down the beach, tussock and scrub on the slope above, and the shafts rendering at midday from 16 m down.
**Unseen, ask first:** the land's density — three species nobody could ever see are on the island now at whatever `per` they were given
(tussock 1500, scrub 110, stranded 26); then what a land cell's ~800 extra instances cost on the 4060; then the shafts at dusk, where the
new colour is largest and they are faintest (`SH_A` is the knob). Left of the review: items 12–15 (14, the shadow-caster pass, is next)
and the drift list.

**v11.31.3 (13 Sep): the code review's placement group — items 7 and 9, built, seen at a cell line.** CHANGELOG v11.31.3;
DESIGN, Structures/solids/cliffs, The far layer and Determinism. Item 7 stood in both halves. **A cell laid different ledges depending
on where the player came from**: `placeCliffs` sized each by the drop over ±3 grid steps and read it with `groundAt`, which answers from
a neighbour's grid when that neighbour is loaded and from `sample()` when it is not — 14 of the 41 cells that have ledges disagreed when
loaded alone versus with their four neighbours up. **And every `settleOn` probe stopped at the cell line**: `ch.h` clamps to the grid, so
`face`/`fit`/`drop` saw a plateau in a band as wide as their radius along every line. The one per-cell entry with such a test is `talus`
(`face` [14, 6]) and the error was one-sided — the face above the point never registered — so it lost 2.2% of its tries there. Both read
`hOut(ch,x,z)` now: the cell's own grid inside it, `sample()` beyond its edge, the rule `buildTerrain`'s `hAt1` and the far layer already
used. Talus 8779 → 9013 over 100 cells and the band's share of them 23.1% → 24.9% against the 24.4% of area it covers; ledges the same
829, mean scale 11.65 → 11.59; load-order disagreement 14 cells → 0.
Item 9 was a dead guard, not a stall: `bigsGen` counted tries per entry against 50 and the fattest `big` entry has 20, so a cell's whole
structure pass was always one step — but that step measures 0.27–0.54 ms over all 256 cells, well inside `Q.farMs`, because `sample()`
warm is 0.7 µs and not the ~35 µs two far.js comments cited (their cold figure; DESIGN had it right). `BIG_YIELD` 16 over the whole cell,
the cairns yielding too: five steps, worst 0.15 ms. Comments corrected.
**Seen** (dev.html, finback, midday): talus across the x = −215 cell line at (−216, −16, −204) and in survey from (−229, −1, −175) — no
stripe, no gap, nothing floating; ledges half buried in a face near (−297, −9, −125).
**Unseen:** whether the foot of a long face crossing a cell line now reads even (the change is +2.7% of 1–3 m boulders — no screenshot
would show it, only walking one); whether any ledge is floating or buried after the re-scale; and whether five budget checks a cell
instead of one shows as a hitch when a far region comes up. Left of the review: items 8, 10, 11, 14 (the shadow-caster pass) and 15.

**v11.31.2 (13 Sep): the code review's ecology group — items 12 and 13, built, the clutch seen.** CHANGELOG v11.31.2; DESIGN, The
ecology. Both stood, and neither was a broken branch. **No clutch had ever been laid** because a loaded cell's growth went into
`POP.n`, which is also where its living are counted — `ecoTake`, `ecoDebit` and `ecoWriteBack` pin it to them, so the surplus was
erased on every unload, and undisturbed the fastest entry in the world owes 0.55 of a recruit a game day. The births a loaded cell is
owed are now their own array, `POP.ow[entry][cell]`: the model banks `b−d` there, the logistic reads `n+ow`, the reconcile lays
`floor(gap + ow·Q.creatures)` and moves what it spent into `n`, and nothing else touches it. `ecoCap` seeds it at a random phase
(`rng()·min(1,K)/Q.creatures`) the first time a cell is known — every cell starting at zero was why the first clutch took two game
days. The readout's fourth line gained `owed`, the loaded cells' total. **Hunters at hunger 1.00 wandering** was not `findPrey`: the
nearest animal a hunter eats sits 35–50 m off against a `detect` of 9–17, and a hunter had no way to go looking. A hungry one now
casts — the same 0.4 s scan out to `HUNT_SEEK` 4 × detect, chasing what is inside `detect` and steering its wander at what is further
off, swimming at `HUNT_CAST` 0.8 of its speed rather than its cruise, and only at prey within `HUNT_HOME` 1.5 × its home. Also fixed
on the way: `updateHolds` walked off the end of `holds` when a bite inside the loop killed the held body (`releaseAll` splices below
the cursor) — it took the low tier's smoke run down once in fifty.
**New test `test/live.js`** (both tiers in `--test`): the ecology where the player is, against `test/census.js`'s paper. Four game
days of driven ecology with cells loaded (fails if nothing is laid or hatches), then 60 s of frames and a table of every hunter kind —
mean hunger, the share at 1.00, the share hunting, the distance to its nearest meal against its `detect`.
**Seen** (dev.html, the clutches forced by hand — the real rate is 5–15 real minutes a clutch): `laid`, `eggs` and `owed` move on the
readout; three clutches at true scale on the sand (flicker 0.38 m, needle 0.54, grazer 1.10) as knots of pale translucent spheres; and
live, with the hunters round the player made hungry, 20 of 86 casting with chases and a carcass being fed at within seconds. Headless
A/B over 60 s: kills 18 → 27, mean hunger 0.471 → 0.433, the share at hunger 1.00 13% → 8%.
**Unseen:** the rate above all — play a session and watch `laid` and `owed`; is a clutch every 5–15 minutes near you enough to notice,
or should the world lay more (that means `ECO.r0`, which moves the whole census). Then a clutch at 2–3 m: the small ones read as pale
rocks — do they want a colour that says egg. Then whether a hatch reads. Then the cast in play: does a hungry needle visibly *go
somewhere*, and does the shelf feel emptier of predators near you. Then whether the extra hunting thins the flicker and darter numbers
over a long session. Open, not a bug: the one ortho in the world has its nearest meal 202 m away — a `SPAWN` envelope question.

**v11.31.1 (13 Sep): the code review's combat group — items 2–6, built, the ecology readout seen.** CHANGELOG v11.31.1; DESIGN,
Contact and Combat. All five stood. The one that matters is **reach against contact**: `reach` in DEFS is centre-to-centre and 45 of
the 58 predator/prey pairs were shorter than the distance the two bodies' `hit` capsules force, so near the player — where
`resolveBodies` holds bodies apart — most hunters could not bite what was in front of them and had to blow past and take the prey
alongside, while off screen the same bite landed at once. The DEFS numbers are unchanged; the bite test is now
`reachOf = max(reach, hitN + hitB + BITE_M)` (`BITE_M` 0.3) everywhere a bite, a strike's trigger, a lunge, a sting, a feed or the
player's own grab measured against `reach`, with `armReach` for the arms. Also: a hunter's regen waits 8 s past its last wound and
stops while it bleeds (`HUNT_REGEN`, `HUNT_REGEN_W`), so wounds can now kill; `updateHolds` returns on a zero-length frame (the NaN
rope); one `dropTarget(c,cool)` ends every pursuit, which fixes hunters' arms still reaching for a player who has died or inked; and
`startHold` refreshes stale capsules (`freshShapes`) so a hold taken past 90 m does not anchor its rope where the body used to be.
`test/combat.js` prints the reach table and fails if any pair's bite distance falls under their contact.
**Seen:** the world plays with no errors at 120 fps / 8.3 ms, phys and render unchanged; `kills` 13 → 28 over two minutes with the
nearest hunter cycling `hunger 1.00` → `0.03`, where the 12 Sep shots had them pinned at 1.00 and wandering (review item 13).
**Unseen:** every hunt at close range — ask for a basker or a ridge on a grazer first (does the bite land where the jaws are, or does
it now read as biting from too far out), then one on you, then an arrow on a darter (forage now dies at 1.6 m, not 0.9), then the
crusher's tell (it cocks at ~11.8 m now, not 7.1), then a lurker's lunge (it holds twice as long), then your own grab on something big
pressed against you. The rest of CHANGELOG v11.31's unseen list still stands, from the top.

**12 Sep: the direction, decided on paper, nothing built.** `analysis_believability.md` read the world as built and judged it; the
discussion after it is `DIRECTION.md` and a dated section at the end of `PLANET.md`. Decided: oxygen to ~21%; the chemocline as a silled
basin's (a sill ridge and gaps replace the v11.28 plate horizon; the pall moves above the line); one island now, a hotspot-chain
archipelago later (young / mature / atoll / guyot, saddles between); size is not the limit, density is; the hingeshells' long segmented
plan gets more variety within firm limits (no pursuit, terminal-moult giants in cool water, a wide base of small ones); and the game's loop
is "the body is the tech" — a player born as the smallest body the creator allows, growing, keys eaten where the chemistry puts them
(mass, minerals, pigments, symbionts, senses), physical doors (current, depth, sulfide, size, air, territory), a den, the builders at the
bottom. Not a human, not generations. Also decided: a closer moon (~half Earth's lunar distance, a ~10-day month) for the 6–9 m tides; a
physiology model (temperature, pressure); player hunger; eggs, mating and reproduction within one life; reputation as a facet of
intelligence. Deferred by the person: how young the island is (until the archipelago), and the ledger's mass for long bodies. The code review of the same day is `analysis_review.md`: eleven real bugs ranked, then drift and cosmetics. The combat
group (2–6) is fixed as v11.31.1 and struck there; **still open: 1** (the light shafts never take the sun's colour — a one-line
comment in atmosphere.js), **7** (cell-edge determinism in `placeCliffs`/`settleOn`), **8** (`stranded` on `MAT` draws all three
variants at once), **9** (`bigsGen`'s yield never fires), **10** (the smoke test's mouse never reaches input.js), **11** (the lab's
NaN inputs, the clobbered hash, `LAB_NAME`'s duplicate keys), the readout findings **12** (no clutch is ever laid), **14** (the
shadow map at 3.4–4.0 ms is the performance pass's first target) and **15** (the person's night-readability list), and the drift and
cosmetics below them.

**v11.31 (11 Sep): combat as the physics — the hold, built, unseen.** CHANGELOG v11.31; DESIGN, Combat (new section). The person asked for the
combat overhauled from the physics (grab, hold, bite until it dies or bleeds; the player grabbing on a button; blood; losing allowed) and for
the AI left alone. Built: `src/combat.js` — a fight is a hold, a rope between a body's grip (jaws, arms, claws, derived by `compile`) and the
held body's own hit capsule; the struggle is the held one's own steering against a grip with a strength by mass; bites on the hold's clock
with a share that bleeds; the player's grab (right mouse or r, held) and bite (a gulp, a mouthful of a carcass, a tear); blood as a pooled
cloud in the clade's colour. `test/combat.js` is in `--test` and prints the table of every hunter's hold on the player. **Ask first for a
lurker's grab from its rock (are you held, do the arms wrap, can you thrash free), then r on a grazer (dragged, the tear, the blood), then a
ridge or eel on you (the clamp, the bites' rate, the ink or the stun letting you out), then the blood at −20 by day.** The knobs are `GRIP`
(combat.js) and PLANET's dmg numbers in `creatures_defs.js`. The next pass, theirs: the behaviour around the hold (a hunter returning to bled
prey, venom or paralysis, the wounded slowing).

**v11.30 (10 Sep): the world's shadows — built, unseen.** CHANGELOG v11.30; DESIGN The light, "The world's shadows". The person asked for shadows
from the flora, rock, coral and structures, performance first, off by default, on the effects list (e). Built: a second shadow map for what does not
move (scene.js `updateShadowS`), re-rendered only when the sun turns ~0.3°, the camera drifts 20 m, a cell loads or a switch flips; two rows,
`world shadows` and `ground shadows` (the terrain), both off. The flora casts at rest (no sway in the map). v11.30 was seen: a black screen and a
warning — the pass ran three's depth pass outside `renderer.render`; v11.30.1 runs it as a render through a layer-1 camera that draws nothing
(CHANGELOG). **Ask first whether the world draws with both off, then whether `world shadows` on draws at all, then the weed forest's shadows at
noon and the readout's `wshadow` spike, then a cliff at a low sun with `ground shadows`.**

**v11.29 (10 Sep): dithering — built, unseen.** CHANGELOG v11.29. v11.28 was seen ("awesome"); the person then saw rings of brightness in
the deep — banding on the veil's dark gradient (worse under their red-light filter). Every material dithers now (scene.js `DITHER_PARS`, the
chunks made unconditional; the sky by hand). Ask whether the rings are gone at −300 by day.

**v11.28 (10 Sep): the lower flank, no black water — built, unseen.** CHANGELOG v11.28; PLANET "The lower flank and the plate"; DESIGN World
shape, Visibility (the `WATER` table). v11.27 was seen and worked. Then: the world's edge was a 520 m cliff into "the void" (rocky bubble
wrap); the deep's water was black by table. Now the floor past the apron's toe goes on down a seamount's flank (16.7° easing to 12.4°,
`FLANK_*` in world.js) to −850 at the far apron's end and the plate ~15 km out; `WCOL` ends at the deep blue and the daylight term alone
darkens the deep. The dark inside the square is the pit and the corners; the picker's deep entry went to −300 so the stone and basker
keep their food; the equilibrium has more hunters (CHANGELOG). **Ask first for the edge from 215 m again, then the deep at −300..−400 by
day (dim blue — too bright?), then the pit from its rim.** The person's stated direction: the world grows outward down this flank into
open ocean over the plate as one biome, no walls (PLANET). Built as the basin instead in v11.58 (the plate became the sill); the clamp at HALF−25 stands, 12.9 km out.

**v11.27 (10 Sep): the edge of the world — built, unseen.** CHANGELOG v11.27; DESIGN Visibility (point 3, the dome paragraph), The far
layer ("The apron"). The person, 260 m inside the void's edge: a dark band with "a horizon look" toward the open water, "like it's a skybox
or the end of the world"; the goal, never to see the sky bottom. Found on paper: the veil's colour was the `WATER` table at the *floor's*
depth, so the void (and the pit) painted themselves near-black onto every ray that reached them — 40% darker looking outward than along
the slope at their spot; the far mesh stopped at ±HALF with the dome beyond; the veil never quite closed, so the dome and the terrain beside
it differed at the far plane. Built: the veil by the ray point's own depth with the floor's colour fading out above it (`floorMap`, `wcol()`,
`FLOOR_H`/`FLOOR_FREE`/`OPEN_D` in world.js — not on the tuner); an apron on the edge regions (`apronGen`, far.js) to 2000 past the edge;
the veil cut to nothing by 0.9·FAR (`FOG_CUT_GLSL`). Seen (10 Sep): the band is gone ("I think you actually did it"). Still to ask: the surface over the slope (11% brighter on paper — `OPEN_D` if wrong), `render` ms.

**v11.26 (10 Sep): the ecology — the world as a ledger, built, unseen.** CHANGELOG v11.26; DESIGN, The ecology. The person asked for the
population to be a real ecosystem: honest predator numbers, deaths, flesh eaten, hunger, births with eggs, and the world changing off
screen. Found first: the pyramid was upside down (70 ridges against 172 darters) and no hunt could ever end (prey `flee` ≥ hunter `speed`,
grazers at 1e9 hp, kills respawning). Built: `src/ecology.js` — a per-cell ledger with capacity from the envelopes, an off-screen model
(births by allometry, predation by a saturating response over each hunter's reach, starvation, drift; a hunter's capacity is what its
prey allows), loaded cells spawning from it and writing back; live hunger (hunters hunt only when hungry, burst and give up, feed at a
kill, starve), carcasses (sink, lie, are scavenged), eggs laid near adults hatching into juveniles that grow up out of sight; `SPAWN`
retuned to a pyramid (ridges ~4, orthos ~3, eels ~11, lurkers ~23 in the world at equilibrium; forage in the hundreds; `stock` on the
small forage — one drawn stands for eight). `test/census.js` runs the model on paper and is in `--test`. **Ask first whether the
readout's fourth line counts up in the shallows (kills, laid, hatched), then for a carcass with a scavenger at it, a clutch near a herd,
and whether the big predators are now too rare for play** (the knob: the grazers' `stock` or `n`). Parked: the player eating eggs,
guarded clutches, the immortal kinds' births.

**v11.25 (10 Sep): every creature in the creator (IDEAS #4) — built, unseen.** CHANGELOG v11.25; DESIGN Creatures, the spec. The eighteen hand
builders left (rasp, veil, lurker, watcher, pall, eel, stone, scuttle, trap, hook, picker, flicker, tread, comb, the four drifters) are specs;
seven new cores (`sac`, `chain`, `shield`, `bean`, `arches`, `bell`, `float`), the drifters a clade in `GRAMMAR`, ~thirty new part styles,
`spec.mat 'glass'`. `test/ident.js` against a v11.24 copy of the builders: seven identical to the bit, the rest the same shape (previews
compared side by side). Found on the way: the calculator had read no thrust from any moving part since v11.18 (fixed). **Ask first for the
bestiary run through (z, right ×36)** — anything that looks wrong among the eighteen — then the lab on the tread, the eel and the jelly (the
new cores' sliders). Left of CREATOR: the player's creator itself; a chain body's parts cannot be lit under the cursor in the lab.

**v11.24 (10 Sep): the marine snow as what the column holds — built, unseen.** CHANGELOG v11.24; DESIGN Contact, "The snow". The person asked
for the snow reasoned from the physics (the bottom of the world is not the top): five kinds — live, floc, silt, bubble, black — each with a source
and a sink, layered by the thermocline (−64) and the chemocline (−450), the bed's nepheloid layer, the surf, the vents, the swell's orbits; the count
spent where the snow is (parked points elsewhere); per-point colour, size and alpha through an `onBeforeCompile` patch of r128's points chunks (a
console warning if it misses), the player's light on it in the dark. `test/snow.js` runs in `--test`. **Ask first whether the snow draws at all**,
then the top 3 m under the shelf in a wind, the thermocline's band, the deep at −200 (too sparse?), the plate, the black flakes under it, `phys` ms.
Found: the chimney landmark sits just outside the `heat` sector (raw 2.60; the field at 2.66–2.7) — theirs to move.

**v11.23 (10 Sep): the effects list, the shadow map, your own shadow in first person, the water's light under a shower — built, unseen.**
CHANGELOG v11.23; DESIGN The light ("The shadows"), The sky ("The water's own sky"), HUD ("The effects list"). `src/effects.js` (`e`, or the word
on the menu; localStorage `tethys.fx`); the capsule shadows are gone, one shadow map along the sun read by hand in every tinted fragment
(scene.js "Shadows (v11.23)", `updateShadow`) — never through `receiveShadow`; the Lambert key under water is the *refracted* sun now
(Claude's call — it is the map's direction too); first person wears `MATGHOST`; `K.skyLw`/`K.lumLw`. **Ask first whether the world draws at all**
(new GLSL in every tinted material), then the player's shadow at noon from third and first person, a school's shadows, acne or crawl, the
sunset light under water, a shower from under the surface, `render` ms with shadows on / off / sharp. If the shadow pass costs too much on
the 4060, flip `FX_DEF.shadows`. If the GLSL fails, `LIGHT_FX` false strips it.

**v11.22 (10 Sep): the rock coat binned (seen: clipping everywhere, colonies at odd angles, out of place on dark rock) and the fix made a system: rock first, then every plant asks the collision hash before it stands (`clearOf`, chunks.js). CHANGELOG v11.22. Ask first for the fan and the dikes from close.** **v11.21 (10 Sep): the manufactured reef structures struck (the person: "like a piece of art displayed deliberately"; "you never see coral and rocks actually touching") and the coat turned onto the geology's rock — every heap, sheet, block ≥ 4.5 m, talus and ledge carries anchors and `ROCK_EPI` (reef.js), two more giant colony shapes. CHANGELOG v11.21, REEF.md's head note. Ask first for a heap on the fan from close, then talus under a riser, then a lagoon boulder.** **v11.20.1 (10 Sep): the pinnacles were seen bare and white — the coat's matrix was never composed (an edit ate the line), the lime was 0.86 beside basalt at 0.34; both fixed, CHANGELOG v11.20.1. Ask for a lagoon pinnacle again.** **v11.20 (10 Sep): the reef as a landform, built, unseen** — `REEF.md` and CHANGELOG v11.20. The person asked how big coral really gets and
whether bigger structures are believable; the answer: a single colony stops near 6–8 m (the tower cut to 4.5–6, their call), everything larger
is *framework* — dead reef alive on its skin — and that is unbounded. Built: `src/reef.js`, four kits by growth rules (pinnacle, capped
pinnacle, microatoll, drowned ridge, cold-water and glass mounds) with **anchors**, coated by the cell from the ordinary species (`chunks.js
coatStructure`); far.js `clear`/`fill`/`flow`, settleOn `drop`. 277 reef structures, 755k tris. Ask first for a pinnacle in the lagoon from the
surface and from its foot (a reef knoll or a pile of rocks?), then the capped tops at a spring low, then `render` ms on the rim. REEF's Open list
is theirs: the mesophotic farmer (a new TAXA split), spur-and-groove, ramparts, rust mounds, the densities.

**v11.19.1 (10 Sep): the fan's hummocks rounded, unseen.** v11.19 was seen: walls and small rock "great", the overhaul "awesome"; the fan's
ground under the scarp was "jagged" with clipping — the hummocks were a tent's crease (world.js), now a smoothstep mound; creases across the
fan 41 → 11 of 81. CHANGELOG v11.19.1. Ask for the fan from the scarp's foot. The surface-breaking blocks near the scarp never really broke it
(4 of 20,000 points; 0 now) — theirs to decide.

**v11.19 (10 Sep): where rock goes, built, seen** — CHANGELOG v11.19 and DESIGN Structures, "Where rock goes". The person asked for the
rock decided from the geology first (where it belongs, not where it looked cool) and then the videogamey heaps and the "mountain of crap"
cleaned up. Found headless: heaps and toreva sheets on the rift arms and above the fissure (their screenshot) because `young` 0.7 on the
arms passed the fan's `young ≥ 0.45`; 157 m sheets across 60 m hummocks. Built: the heap is a pile of fifteen alike blocks; heaps and sheets
need `young ≥ 0.8` and no heat and are sized by depth; `fit` rejects a kit the ground can't carry; `face` gates talus — a new block entry
under every riser, the scarp, the dikes and the rim — and the rockfall cone (`crag3`, small now). Ask first for the terraces above the
fissure (arm 0, r 900–1150: the heaps gone, a boulder beach under each riser), then the fan's piles (still too big?), then the dike crest
where the spire stood. The `rel` field is 0 over the whole fan (the scarp) — worth fixing in `sample()` if anything wants relief there.

**v11.18.1 (10 Sep): the invisible-creatures bug in v11.18 (a comment ate `lodFar`) fixed; the smoke test guards it now.** **v11.18: odds and ends (10 Sep), built, unseen** — CHANGELOG v11.18. The mouth (and fins, tail hinge) ride a body frame that sways; `f`
is first person (whole body hidden); rain: the light under a shower ~0.52 of noon (was 0.24, darker than night), rings on the water instead
of flashing squares, distance-faded streaks, the patter and the rush instead of two hisses; rigs posed idle before the far bake and
`lodNear` per def for the long-appendaged; creatures fight the current (`seek`/boids subtract it) and sitters are not carried. Ask first for
the finback's mouth, then a shower seen from just under the surface, then a sailer from 150 m.

**v11.17.1: the person's calls built (10 Sep): declination 0 kept and its eclipses modelled (the moon dark red at every full-moon midnight; the
solar one exists but never falls by day with PLANET's clock), the flank cone's fumarole (a steam plume, vog downwind), calms (a quarter of
the time: the chop dies to the swell, the spray stops, and a clear calm dawn mists the lagoon). CHANGELOG v11.17.1. Ask first for the
first night's eclipse (~19.5 real minutes in), the plume from the water, a calm.**

**v11.17: the sky above the water, from the climate (10 Sep), built, unseen** — CHANGELOG v11.17 and DESIGN, The sky. No sea fog
(the reasoning at `HAZE`, world.js); the marine haze and the surf's spray as a layer on the water every fragment in air integrates;
the star and the moon by derivation (`STAR`, `MOON_R` 0.37° — the person: realism first); stars on 3D cells; cirrus; the cumulus
marched in `Q.cloud` slices with congestus and scud under a shower. Ask first whether the sky compiles, then the horizon band and the
deck at boot, then `render` ms. Decided since (v11.17.1): the vent, the calms, declination 0. Open: where the wanderers really are. A note for the next
session: the sandbox had a second writer editing `src/` mid-session (a parallel run of the same ask); this build was made from a
clean copy of the zip and never merged with it.

**v11.16.1: the raft struck ("looks terrible"), sailers also on the windward shallows and stranded on the strand (CHANGELOG). v11.16 seen: "so much cooler."**

**v11.16: the drifters, built, seen** — `DRIFTERS.md`. The person's surface complaint (the man o' war pads: clipping, white, spawning
into each other, "pustules in the sky") and the wish behind it (a plausible reason for interesting things on open water). Answered with
what is real and the clade's tree; built: the **sailer** as a creature (a crested float that rides the wave, sails 40° off the wind
left- or right-handed, a body you push against, eight 25 m lines as chains that stream and sting), the **greatsailer** as the landmark,
the **button** as flora (a disc that farms light, in fleets), the jelly rebuilt translucent and the **deepbell** red in the dark; the
float colonies gone. CHANGELOG v11.16 has the unseen list — ask first whether a sailer sits on the water and whether the lines stream.
Parked: fleets drifting as a fleet, stranded floats on the windward strand, what eats the buttons.

**v11.15.1: the animal lines' leaves (plume, seep, stilt, nod, the mats), built, unseen** — CHANGELOG. v11.15 was seen: "the whole thing looks
good", the tree line right; the person's next wish after this pass is **a larger world map** (PLANET: more of the same geology, not more kinds).

**v11.15: the plant overhaul, first pass (IDEAS #5), built, seen and liked.** The person asked for the sessile life rethought from evolutionary
logic — what each form eats, what colonised what in what order, real splits — and answered TAXA the same day: three photosynthetic lines,
**greens, floaters, reds** (TAXA.md, Decided); rebuild the trees; the swamp parked until the island grows. Built: `pigment(h, line)` — the
colour is the line's, the band a consequence (the shelf loses its green; the wisp is the forests' ground layer); the reds from nothing
(rind, limerind on the crest, sandball, redblade: the slope had no weed); the greens in air as jointed axes with whorls (the tidewood
rebuilt, the new reed-beds on the sheltered tide band, scrub and tussock as species). CHANGELOG v11.15 has the unseen list — ask first
for the shelf at −30 (olive, no green) and the tidal forest (does a stand of jointed trunks read as a wood). `FLORA=1 node test/preview.js
<id>` renders a flora species' variants; every new form was looked at there. The leaves followed in v11.15.1; left from TAXA: the epiphytes, spur-and-groove, the bog (parked with the bigger island).

**v11.14.1: the first listen.** v11.14 was "very loud", "hissy and white noise adjacent"; the old bed's low rumble is the reference. Every bed is pink or brown now, levels halved, the compressor transparent (it was adding makeup gain), and the readout tunes it live (`g-h` master, `j-k` beds, `v-b` the water's lowpass); ask what the knobs land on and bake them in (`AU_K`, `AU_DEF`). Rounds of playtesting agreed.

**v11.14: the sound (IDEAS #6), built, unheard.** The person asked for an audio overhaul — not music, not animal calls: a Thief-like 3D system
and the water heard as itself. `AUDIO.md` is the design; they took every default. Built in audio.js: a space read from the geometry round the
listener four times a second (twelve rays → the reverb, three early-reflection taps at the real round trip, the floor's shelf, the lid),
occlusion by ground and rock per placed voice, an eight-voice HRTF pool, and the beds from the world's numbers — the slosh following the wave's
rate at your x,z, the breakers by `expo`, the current, the vent at the chimney, the forest from a per-cell height grid, the deep's hush and
pressure, the crackle by `nut`; the body's flow, jet, landing, knock, scrape and brush (physics.js `contactK`); the water the nearest bodies
move. DESIGN has a new section, The sound; CHANGELOG v11.14 has the unheard list — ask first whether anything plays and whether it is too loud,
then the slosh under the chop, then a rock face's slap. The sandbox has no audio output: every number was chosen blind and is in DESIGN by name.
`test/audio.js` prints the space's numbers at five sites. The `M` key mutes; the readout's third line shows the space. Music gets `AU.music`.


**The rule, since 8 Sep 2026: the island is fully believable from its logic — no biomes, no magic, even for gameplay.** If
a thing can't be derived from a young shield volcano, a big moon, 28% oxygen, iron, a chemocline and five founder lines, it
goes. "Reality is often more exciting than what I could come up with" (the person). PLANET.md holds the decided planet and
the decided geology; FLORA.md the sessile life; every species places itself by a tolerance envelope over the condition fields
(DESIGN, World shape). Nothing reads a label; the HUD shows depth.

**v11.13: the light (POLISH.md pass A), built, unseen.** The person asked for the low-budget systems that carry low-poly games
(IDEAS #3); `POLISH.md` is the survey and its Decisions section their answers (9 Sep). Built here: caustics in every tinted fragment,
the sun's shadows of the player and the nearest bodies by size (no shadow map), light shafts on a world grid, translucent blades, the
terrain's cavity and canopy shade, the boulders' feet, the sessile animals breathing, the far cards swaying, the chemocline's plate.
DESIGN has a new section, The light; CHANGELOG v11.13 has the unseen list — ask first whether the world draws at all (the GLSL), then
the caustics at noon on the shelf, the player's shadow, the shafts. The tuner has `t-y` (caustics) and `u-i` (shadows). Then pass B,
the body (`fx.js`: silt, bubbles, scraps and blood by size; the flinch, the spin, the snap; rings on the surface; squash-stretch,
banking, the stun shown; the flush and the vignette *off* by default) and pass C, the night (the bioluminescent wake on the snow, the
pen flashing when brushed). Measure the forest at (330, 0) after A.

**v11.12: the performance pass, from `AUDIT.md` (9 Sep, the first session on the person's PC, the game measured live).** The person
answered the audit's five questions (450 m; variety stays plant to plant; Node; the reformat; the world.js fix) and it was built here:
the folder is a git repo with `build.js`, the flora has a draw distance with the impostors taking over, the sway loop is guarded, the
streaming yields and budgets itself, a kind's geometry is shared, the shaders warm at boot, `world.js:146` runs again (bare rock on the
dikes, the rim and the fan's blocks — the rim and the dikes look different now), and creatures_spec.js, lab.js and flora.js are
reformatted a statement to a line. **Unseen, all of it** (CHANGELOG v11.12): the first things to ask are the rim and the dikes, then
the cut at 450 m and the card hand-off at a cell line, then the first breach (the sky no longer compiles there). Left from the audit:
the shared flora vertex buffers with pooled per-cell meshes, the one placement rule, the mode table, the half-cell grid offset.
Do the plant overhaul (IDEAS.txt #5) with the forest at (330, 0) measured before and after; it is the heaviest place.

**The raptor family was seen (9 Sep): "THOSE ARE AWESOME! Exactly what I had in mind."** The person then asked for a design doc for a
creature creator — modular internals first, a dev tool for them now, the player's creator later, movement and physics derived from the
build: `CREATOR.md`. The person answered its eleven questions (recorded there, Decisions) and v11.10 built it: `creatures_spec.js`,
`lab.js`, 18 species migrated to specs and proved identical. The person built with it ("works great") and asked for a second round — v11.11: styles by clade, snapping to the body and its
armour, placed weapons and eyes, hingeshell mouth parts, the lab from play, the panel's nav and folds (CHANGELOG v11.11). Ask first what looks wrong in the lab panel; everything about it is in CHANGELOG v11.10's unseen list. New
creatures should be specs (make in the lab, export, paste into `SPECS`), not hand builders.

**v11.9.1: the raptor family.** The hingeshells were seen ("look great") but the sickle and the hose still read as Anomalocaris
and Opabinia. `buildRaptor` + `RAPTORS`: five looks (keel = the sickle now, splay = the hose now, hood/lash/ram bestiary-only, unplaced).
Unseen. Ask which looks go in the world; swap parts in `RAPTORS` in one line. The old `buildSickle`/`buildHose` are unreferenced and can go.

**v11.9: the hingeshell pass.** The slowbloods were seen and approved ("Perfected it!"); the person asked for the hingeshells.
Eight rebuilt to CLADES — the bivalved carapace (`valves`) on every one but the tread (untouched: they love the Ohmu), a comb for antennae,
the plate mouth on the face, the flicker as a swimming bean, the hose's proboscis one of a mismatched pair, the Cambrian tails gone. Unseen.
Ask about the sickle's valves moving and on its tell, the flicker at ribbon scale, the scuttle's flat pair. **All three clades are now built to
CLADES.** After this: the person's roster strikes; then the parked mechanics (PLANET Hooks: temperature, burst, moulting with the valves'
soft state, the drain, detection modes) and the 90/8/2 variants; the jelly's own overhaul; the tracking pupils on slowbloods if wanted.

**v11.8.4: the slowblood pass.** All ten slowbloods rebuilt to CLADES: petal snout (the fused ring, an iris that opens on
the bite), silver eye band with lobes on predators, three fins at 120°, Y tail, chevron plates, no white teeth; the abyssal its own builder.
Seen (9 Sep): the mouth hard to read (petals clipping, an idle gape, the silver band a cut, eyes lost); v11.8.5–8: petals, then flaps,
both struck ("a Lego fish"); the mouth is a ring of short stiff tentacles on the chain rig now (`mouthArms`), no idle motion, no band, a ring
of dark eyes, predators with a big forward pair on flesh lobes ("look great"). v11.8.8 seen: "WAY better"; v11.8.9 capped the open nose you could see into. Unseen since. Next: the
hingeshell pass — valves hinged at the midline on every one, the comb for antennae, the mouth ring at the front, the flicker as a swimming
bean, the hose's proboscis as a mismatched pair, the sickle's tail spines gone — CLADES, "What it does to the roster".

**v11.8.1: the ringmouth pass.** The person answered the audit (9 Sep): flat coil yes, the veil a ringmouth with
rethought eyes, no glowing eyes anywhere (a believability rule: eyeshine is a reflection), the tread stays, "continue onward". All ten
ringmouths rebuilt to the CLADES signature (headless, collar of eyes, predators' cluster, the mouth showing, 2-4-2 arms, shells carried on
their edge, three-lobed skirts) and every yellow/red eye in the roster replaced. Seen (9 Sep): "genuinely awesome"; the only note was the
flat wheel, fixed in v11.8.2 (upright: "much much better") and v11.8.3 (the shell moved back along the body; unseen). Next: the slowblood pass (petal snout, eye band,
three-fold fins, chevron plates; the abyssal its own builder), then the hingeshells (valves, comb) — CLADES, "How it would be built".

**v11.8: the clade audit.** The person asked (9 Sep) for a diagnostic of the roster (Earth clone / vague / unique / art)
and an upstream fix for the clades reading as Earth phyla in costume. `CLADES.md` is the answer: the table for all thirty, the findings
(Earth's greatest hits; two apexes are scale variants; the clade names promise features the builders lack), and a proposal — one radial
ancestor, three fates for its ring: ringmouths differentiate it 2-4-2 and go headless with a collar of tracking eyes; slowbloods fuse it into
a petal snout (the person's own idea) with an eye band and three-fold fins; hingeshells string it into rows under a bivalved carapace with a
comb for antennae. Nothing built from it. Built: coats in the bestiary (up/down: palette variants) so the roster can be looked at in other
colours first. Next: the person strikes; then the kit (`armRing` plan, `petalSnout`, `eyeBand`, `valves`, `comb`) and one clade per pass,
the players first, the bestiary after each. Ask which shell coil (flat or vertical) and whether the veil is a ringmouth before the ringmouth pass.

**v11.7.2: the crossing, third cut.** v11.7.1 was seen at night (fifth video): the dive fine, the breach "flickers on and
off". Measured from the video: +40% mean luminance on the flip frame decaying over 0.25 s, all of it in the sky — the shimmer plane (1.5 m
over the surface, 90 m wide, additive) fading out over a camera that was already above it. Now the water's things (shimmer, snow, the
player's glow) are hidden the frame the camera is in air and fade in when it goes under (`wk`); the tint from above switches with the medium;
only the hemisphere, the sun and the audio still fade. Unseen. Also seen in that video and not touched: the moon's specular lighting whole
near facets from just above (bright quads on the near sea) — the wedge problem again, in the specular this time; asked.

**v11.7.1: the crossing, second cut.** v11.7 was seen: the crossfade mixed the water's veil into the air (teal on the shore
for 0.3 s) and smoothed the underside's window ("less striking"). Now the medium — fog, domes, the surface's look — switches in one
frame and only the light fades (`MED_T` 0.25, `medK`); the underside's window is per facet again and only the topside Fresnel reads the
mean normal (`cm`/`cv`, SURF_MAT). Unseen. If the crossing still pops, what's left is the membrane itself.

**v11.6: the flicker at the water line.** Seen: the lighting alternating between the air set and the sea set at eye
level. level (screenshots), and, in a video, the glow on the surface switching every few frames while rising to it. Two causes: the medium
was re-decided from the raw camera height every frame while `camAbove` only clamped the camera's target (fixed: the camera itself is
held `CAM_CLEAR` clear of the wave and the medium is `camAbove`); and three sorted the surface among the transparents by its origin,
which sits at the camera's snapped x,z and hops across the camera plane near the line, so it swapped places with the shimmer sprite
every few frames (fixed: `surface.renderOrder` by medium, rain and spray after it). Both seen fixed (9 Sep, "completely
eliminated"). Then a second video: a straight edge sweeping down to the horizon while rising — the shimmer sprite hung 1.5 under the
surface, and the camera came up underneath it, then through the near plane's slice of it. Fixed: it hangs 1.5 *above* the surface and
draws before it (`SHIM_H`, `SHIM_A`). Seen fixed (third video: "fluid and seamless"; only the crossings jump, one frame each). Open:
whether the one pop on a real crossing wants a fade (the person wants no transition artefacts at all; a crossfade of the two light sets over ~0.3 s is the next step if so — the
domes and `uUnder` cannot blend, the fog, hemi, sun and tint can); and the flat wedges on the near sea from just above at grazing
(CHANGELOG v11.6, seen) — proposed: the mean normal for the topside Fresnel, facets kept for shading.

**v11.5: the inside of a wave.** The edge on the water survived v11.4; with the readout it was the camera in a trough
looking through a crest at the far surface's *underside*, drawn as reflected sky. Back faces in air are the water body now
and the surface writes depth. Fourth attempt; the previous three fixed real things (cards at low tide, a diffuse reflection,
aliased far waves) that were not this. If it is still there the person has offered a fresh context: give it `camAbove`
(player.js) and `SURF_MAT` (atmosphere.js), and the fact that it shows only at eye level.

**v11.4: the far sea un-aliased.** The step on the water survived v11.3: it was the surface mesh drawing each
wave fully aliased over a band of distance before fading it (to zero, dropping its mean) — a sawtooth the noon sun hid and a low
sun shows. Waves fade earlier and to their mean, the near mesh is twice as fine, the canopy folds to the wave (not the tide), the
far kelp cards stop under the troughs. The v11.3 reflection change stands. If it is *still* there, ask for a screenshot with the
readout and one from directly above the water looking down.

**v11.3: the sea as a mirror.** The dark wedges on the far water were the far layer's hidden trench seen through a
surface that went glassy at a low sun (its reflected sky was lit like a diffuse surface); the reflection is emissive and the
surface opaque at grazing now. v11.2's tide fix for the far kelp cards was real but not this.

**v11.2: the tide's cards, the whip.** v11.1 seen (9 Sep): trees "look great", day/night "works awesome". The
"clipped water" from above was the far kelp/bladder impostors standing out of a low tide (fixed: they follow the water down);
the whip is struck ("way too earth like"), the lily kept after a second look; flora entries get their own rng each (a one-time
reshuffle of small flora and boulders). The person wants, later, a pass on the land flora — matching the sea's but distinct.

**v11.1: the sea back.** v11 was seen (9 Sep): "the trees look great", "the day night cycle works" — but the surface
mesh was gone (its shader didn't compile: `uTime` undeclared in the fragment; fixed, one line). The surface under the new light is
now the unseen thing: the reflected sky, foam, the window at night, the moon's glint, rain on the water.

**v11 was unseen: the world above the water.** The person asked for the parked land overhaul (9 Sep 2026): PLANET decides
what is above the surface. Built: day and night on the tide's clock (a 30 h day, sunset 15 real minutes in, a full moon three
times the Moon's size rising with it, bright nights, new moon at 13 days), trade-wind weather with showers, one sky shader
(gradient, sun, a moon lit by the real sun direction, stars, cel-shaded cumulus drifting downwind, a rainbow), light by time above
and below water, rain, olivine sand and rusty basalt on the strand, and the tidal forest from FLORA (trunks on props in the tide
band, the leeward rim and the island's flat — built without asking; one line to strike). DESIGN has a new section, The sky.
CHANGELOG v11 has the unseen list; the first thing to ask is whether the sky compiles, then the clouds, then the sunset.
Decided by Claude, easy to change: the moon full at boot; boot at local 11:00; latitude 0.2 and no seasons; the player's light
at night; the tidal forest's exposure tolerance (0.75). Not built: creatures by time of day (PLANET: an ectotherm ecology under
a big moon), flyers, shore foam, cones opening on the flood.

**v10.8 was unseen: the jank fixed.** The person played v10.7: the tail "moves incredibly quickly", the tentacles
"move around constantly", only slowing down looked right. Cause: every anim's beat was `sin(t*f(spd))` — a phase, not a rate — so
minutes in, any change of speed spun it; plus the coil's/great's/watcher's arm roots shivering inside their own hull, and the hard
joint limit flinging the coil's short arms on every deceleration. All three fixed (`swimClock`, the own-body rule, the ramped joint
limit), the jet as a short thrust, switched poses eased. Measured headless (`test/anim.js`), seen by nobody. CHANGELOG v10.8.

**v10.7 was unseen: the roster placed.** v10.6's fifteen builders were seen in the bestiary (`#zoo` / z on the
menu): "look great". All fifteen are placed at once (the person's call): stats, roles, envelopes — first guesses — plus the
behaviours they needed (the strike with its tell, burst-and-coast, the sit-and-strike trap, the watcher's standoff, the hook hung
in the weed, the pall in the dark, the tread that nothing moves) and boid ribbons for flickers and the returning darters
(DESIGN Creatures). The loaded population tripled; the readout in the shallows is the first thing to ask for. CHANGELOG v10.7 has
the unseen list. The person's next wish (8 Sep): fill niches across clades at unequal shares (90/8/2) with variants and minor
species — PLANET, Cross-clade rules — after the base roster has been seen in the world. Not built, by PLANET's order: temperature,
moulting, detection modes, variants by place (shell colour by water chemistry, juveniles).

**v10.5 was unseen: the rock, cleaned.** v10.3 (the tide) was seen: "looks awesome, I love the current". v10.4's
rock pass was seen and the person struck the whole spire lineage — walls, neck, all of it — and asked for the rock logic to be
cleaner, not bigger. v10.5: four rock forms (block, heap, sheet, stack) plus the ledge, one placement rule (`chunks.js settleOn`
for near and far), one palette, no place-specific rock; the dikes are bare ridges. DESIGN, Structures, is the whole of it in a
table. CHANGELOG v10.5 has the unseen list. Still unanswered from v10.3: whether the rim drowning at high springs (40% land →
2%) is the planet or a mistake.

**Agreed order of work from here** (the person's, 8 Sep): the current (done, v10.1–10.2); the tide (done in v10.3 bar the
cones/crowns opening on the flood, and the parked land overhaul it was waiting on); then **day and night** on the same
clock (done, v11); then the
**creature roster** (PLANET's 31 species by niche) once the world is behaving. Believability
items still open: creatures should swim *against* the current rather than slide (an AI heading term); rafts and colonies
should drift with it (instance matrices per frame; the colonies "floating on their own" was accepted, 8 Sep); the terraces read as stairs (real ones are irregular: riser heights
varying, treads pinching out, lowstand gullies cutting across — cheap, on the list); the ribcage on the plain is to be
re-read as a whale fall with a mat and a bone community (not vetoed); the veil's glow spots and the darters' glow variant
are the last lit things — audit them against the no-magic rule; bioluminescence may return only as *events* (a wake that
glows, a pen that flashes when brushed) — PLANET, Hooks. The world will grow later: more of the same geology, not more kinds.
The creature envelopes (creatures_defs.js `SPAWN`) are first guesses and the flora envelopes (flora.js `env`) second guesses:
tune from what the person sees, never by adding a place.

Older state follows.

v9.3 is built and unseen: flat rock. The person played v9.2 for a day: the rocks hold, the rockfall "looks incredible"
(rock covering the ground, flat and wide), big single lumps look "low in polygon", the area under the great arch was
"terrible" (they wrote "spire" and confirmed they meant the arch/massif), the tors ("snowmen") far too common. v9.3:
every kit lump drawn as sixty inward-dented facets with per-facet shade (collider unchanged); `slab` sheet-rock
structures; bigrock a four-lump flat cluster; the massif's heap replaced by a pavement of flat slabs and its table cut
from 35 crags/tors a cell to 25 slabs + 2–3 crags; tors 147 → 17 + seven cairns on the pit's rim. CHANGELOG v9.3 has
the unseen list, starting with whether the facets read as rock. v9.2's unseen items (rocks holding at corners, stalks
leaning from the base) are verified in spirit ("good job"); v9's arm/wrap/eel items and v8.5's fog-by-place were never
reported on individually. **The current topic is the creature ecology audit** (Sep 2026): the person went upstream first and `PLANET.md` holds
the decided planet (late-G/K star, 1 g with 1 unit = 1 m and `GRAV` 9.8 since v9.4; a chemocline at −450 that will
drain the player; the green gradient), the three named clades — ringmouths, slowbloods, hingeshells, plus the jelly as
its own drifters clade — as constraints, and a **proposed roster of 31 species by family and niche** with a build
order, awaiting their strikes. Agreed order of work: design the creatures → build their builders ("sprites") and let
the person look → only then the mechanics (temperature, burst movement, moulting, the drain, detection modes). Still
unanswered: whether the veil is a ringmouth. **Then the flora** (Sep 2026): the person wanted a SpeedTree-like generator for
sessile life, plausible by depth and energy source. `FLORA.md` holds the design (Earth as reference, never template; the
filter; five founder lines with signatures — weed, polyps as the drifters' fixed stage, crowns as sessile ringmouths, cones
as sessile hingeshells, sacs; eight bauplans; the roster by band; giants) and the person's answers (8 Sep). **v9.5 built
it and is unseen**: `grow.js` (the grammar, `species()` packing three variants into one geometry chosen per instance by
`aVar` in the shader, `pigment(h)`, `flowYaw`), ~30 species on the reef top, the shelf, the flats and the rockfall, the
rafts as weed and the big rafts as float colonies with fishing lines, the old dome as the first giant. CHANGELOG v9.5 has
the unseen list; the first things to ask: does the reef top read as vivid and rigid, the shelf as an olive swaying forest,
and what the readout says in the stipe forest (the tris figure will show ~3× for flora; the ms is the number). Next passes:
the slope, the deep, the vents and the rim (lily and tower are already there; crust, redblade, stilt, frond, glass, plume,
hair, seep, the cistern and the great lily are not). After that: a rethink of the biomes and the world map. The surface-interest menu (DESIGN, Hooks) is parked behind all this and
the above-water world is due an overhaul later. Older open questions: clade-specific reach, persistence vs a clean cold
start, canopy fauna, the name "the canopy", darter shoals as boids.
