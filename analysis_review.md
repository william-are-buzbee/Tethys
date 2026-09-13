# Code review — 12 Sep 2026 (nothing changed)

The ranked findings of the read-only review. Each was checked against the code; the top ones re-verified by hand. Kept here so the
next session can turn them into patch versions; strike a line when it is fixed.

## Real bugs, worth a patch each
1. **Light shafts never take the sun's colour** — `atmosphere.js:296`: the `shU.uCol` update sits inside a trailing `//` comment.
2. **Most predators cannot bite what is directly ahead** — `creatures_defs.js:11`: `reach` is below the nose-on capsule contact distance
   for basker (5.88 vs 4.6), crusher (5.40/4.2), stone (3.20/3.0), sickle (6.68/6.4), abyssal (11.85/10), ridge (6.51/6.6 + prey radius),
   arrow (0.92/0.9), needle (1.24/1.2), ram (5.95/5.5). Near the player every hunt is a shove-then-bite; off screen (no `resolveBodies`)
   hunts land at once. DESIGN's "by a margin" is false. Either `reach` ≥ nose + prey radius per pair, or the bite test uses capsule gap.
3. **Hunter regen cancels bleeding** — `creatures_ai.js:345`: 2 hp/s with no delay outruns any wound's bleed; hunters never bleed out.
   The player's 8 s hurt gate (`player.js:71`) is the pattern.
4. **A hold with dt 0 goes NaN for good** — `combat.js:97` divides by `dt`; `main.js:57` clamps to `[0,0.05]`, not above 0. `simChain`
   guards `dt<1e-4`; the hold loop should.
5. **`c.grab` leaks after the player dies or inks** — `player.js:31,36` reset the hunter's state directly; only `creatures_ai.js:166`
   clears the grab, so rigged hunters' arms keep reaching for the player from wander. Extract one drop-target routine (die, ink,
   `combatBite:60` each re-implement a subset).
6. **Stale hit capsules for prey past 90 m** — `combat.js:37` trusts `shapesW`, refreshed only for near creatures; an off-screen grab
   can make a rope tens of metres long that never shortens.
7. **Placement is not deterministic at cell edges** — `chunks.js:207` (`placeCliffs`) reads `groundAt` before the cell is registered, so
   the drop depends on which neighbours are loaded and the rng draws after it shift ledge and sailer placement; `chunks.js:16` clamps
   heights at the grid edge so `settleOn`'s face test sees a plateau in a 14 m band on every cell line (`hAt1` at `:74` is the fix pattern).
8. **`stranded` draws all three variants superimposed** — `flora.js:1098` is a `species()` on `MAT`, which has no variant collapse; wants `MATV`.
9. **`bigsGen`'s yield never fires** — `far.js:78` counts per entry and no entry has 50 tries; a cell's whole structure pass is one step,
   well over `Q.farMs` since `fit`/`face` added eight-point reads.
10. **The smoke test's mouse never reaches input.js** — `test/smoke.js:99` takes the first registered handler (zoo.js's); bites and
    look are untested headlessly and the test's comment is false.
11. **Lab**: number inputs write NaN into the spec mid-edit (`lab.js:692`, only `stats.*` guarded); the lab overwrites `location.hash`
    and loses a forced `#low` (`lab.js:669,782`); `LAB_NAME` has nine duplicate keys so some sliders show the wrong label (`LAB_NAME_BY` exists for this).

## From the person's readout screenshots (12 Sep, ten shots on the 4060, all at the 120 fps cap)
12. **No clutch is ever laid.** `laid 0 hatched 0 eggs 0` in every shot over several game hours while `born` climbs 43→63 and kills
    80→124. The `ecoTick` path that turns owed births in a loaded cell into `layEggs` never fires (ecology.js:128–137: `extra = floor(n·
    Q.creatures − living − eggs)`). Write a headless test: run the tick for a game day with cells loaded, assert `POP.laid > 0`.
13. **Hunters at hunger 1.00 wandering, not hunting.** Four of ten nearest-hunter samples: hose ×2 (7 and 16 m from the player, 850
    flickers in the world), arrow (the reach finding, item 2: it cannot bite head-on), hook 0.99 sitting. Check `findPrey`'s `detect`
    against where the prey actually is, and the starvation clock (`starved 0` throughout).
14. **Performance, for the pass:** render at the forest edge (300, 0) is 4.5–4.6 ms against the v11.12 mark of 3.2 (+40% since the light
    pass, the shadow map and combat); the shadow map re-render is 3.4–4.0 ms against ~1000 casters, the biggest single lump; render tracks
    tris at ~0.5 ms/M; heap flat at 257M; phys 0.7–1.6 ms with 24–118 near creatures. CPU is not the limit yet; the shadow casters are the
    first target.
15. **To look at** (the person's): night readability at 8 m under a full moon (near-black but the blades); the floaters' blades reading as
    lit at night (the pigment boost + moon, not emissive); the marine snow as large squares at 38–48 m; pink/purple polyp tables among the
    stipes at 8 m.

## Drift and cost, fold in when touched
- **Duplicated formulas already disagreeing.** Mass in six places, two unfloored (`combat.js:30`, `creatures_ai.js:115`, `ecology.js:29`).
  The daylight curve six times; the JS uses tide-relative depth, the GLSL raw y (`scene.js:104`, `atmosphere.js:469`) — **the person
  (12 Sep): tide-relative depth is the right one; unify the GLSL to it.** Canopy fade a smoothstep in the shader, a hard cut at −70 in JS
  (`atmosphere.js:472`, `chunks.js:10`) — **the person: the shader's smoothstep is right; the JS follows it.** (Both answered without
  having implemented either, so look at the result: the ambient at −60..−90 under the canopy, and the water colour across a tide.) Slope
  a forward difference in far.js and a central one in chunks.js, feeding the same envelopes. The chemocline −450 at 23 sites with
  variants −448/−452/−455/−465.
- `chunkAt` builds a string key per call (`chunks.js:7`) on the per-frame ground path; `chunkGrid` exists for this.
- Ecology drops elapsed time over half a day (`ecology.js:131`) instead of slicing it; starvation tally reads `n` after the decrement (`:108`).
- `d.jetter` is never set in DEFS, so the jet pose exists only in the lab and bestiary (`creatures_ai.js:342`).
- `updatePlankton` runs in air; `updatePads` and the whole `pads` path run with no entry setting pads.
- `blur` clears the mouse but not held keys (`input.js:16`); `p`/`o` double as fog tuners with the readout open (`main.js:19`).
- `serve.js:12` dies on a malformed URL; `landBite(c,tg)` with a null target in the lurker's lunge (`creatures_ai.js:267`).

## Cosmetic
- Dead: `MATR2` and `GLOW` compiled at boot with no user; `fogExtinctOnly`, `moonIllum`, `trunkPose`, `cellW`, `ecoCell`; `DEFS.glim`;
  zoo's "hand builder" branch; reef `fill`/`drop`/`clear` and `y:'mid'` branches with no entries; `c.off`/`c.offT`.
- `ROSTER.new` on 15 spawning species (the bestiary captions them "not yet placed"); darter's niche says "(unspawned)".
- Docs: DESIGN names five knobs that no longer exist (ARCH1/2, MASSIF, OUTCROPS, MATK), two Landmarks sections, `GRAV=14`; HANDOFF was 365
  lines of history against its own rule; README's known stale spots plus reef.js/far.js lines; CHANGELOG's two v11.18.1; `test/lint.js`
  says acorn is not vendored; `build.py`'s docstring claims INDEX lists users.
- `Math.hypot` in per-frame player and atmosphere code against physics.js's own rule; `removeCreature` splices during iteration.
