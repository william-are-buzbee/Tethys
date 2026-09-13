# Code review — 12 Sep 2026

The ranked findings of the read-only review. Each was checked against the code; the top ones re-verified by hand. Kept here so the
next session can turn them into patch versions; strike a line when it is fixed.

**Fixed: items 2–6, the combat group, v11.31.1 (13 Sep).** All five stood when re-verified. Item 2 was worse than the table below
said — 45 of 58 predator/prey pairs, not 9 — because a prey's own body counts too. See the CHANGELOG entry.

**Fixed: items 12 and 13, the ecology group, v11.31.2 (13 Sep).** Both stood. Neither was a broken branch: 12 was arithmetic that could
never reach a whole animal (and a surplus erased on every unload), 13 was a detect of 9–17 m against a nearest meal 35–50 m off. The new
`test/live.js` holds both. See the CHANGELOG entry.

**Fixed: items 7 and 9, the placement group, v11.31.3 (13 Sep).** 7 stood in both halves. 9 stood as a dead guard but not as a stall: a
cell's whole structure pass measures 0.27-0.54 ms over all 256 cells, inside farMs — `sample()` warm is 0.7 µs, not the ~35 µs far.js was
citing (that is its cold figure). See the CHANGELOG entry.

## Real bugs, worth a patch each
1. **Light shafts never take the sun's colour** — `atmosphere.js:296`: the `shU.uCol` update sits inside a trailing `//` comment.
2. ~~**Most predators cannot bite what is directly ahead**~~ — **fixed v11.31.1** (`reachOf`/`BITE_M`/`armReach`, creatures_ai.js; the
   reach table is a section of `test/combat.js`). 45 of 58 pairs were short once the prey's own radius was counted, not the 9 listed here.
3. ~~**Hunter regen cancels bleeding**~~ — **fixed v11.31.1** (`HUNT_REGEN` 2 hp/s behind `HUNT_REGEN_W` 8 s and no regen while bleeding).
4. ~~**A hold with dt 0 goes NaN for good**~~ — **fixed v11.31.1** (`updateHolds` returns on dt ≤ 1e-4).
5. ~~**`c.grab` leaks after the player dies or inks**~~ — **fixed v11.31.1** (one `dropTarget(c,cool)`, used by the ink, the pulse, death,
   the lost chase and `combatBite`'s kill).
6. ~~**Stale hit capsules for prey past 90 m**~~ — **fixed v11.31.1** (`freshShapes` in `startHold`, `c.shapeF` stamped where `worldShapes` runs).
7. ~~**Placement is not deterministic at cell edges**~~ — **fixed v11.31.3** (`hOut` in chunks.js: the cell's grid inside it, `sample()`
   past its edge; `placeCliffs`'s drop and `placeFloraType`'s `hAt` both read it). Both halves stood. 14 of the 41 cells that have ledges
   laid different ones by load order — though the set and the creature stream held every time, so what moved was each ledge's scale and
   its nudge, not the draws after it. The clamp cost talus 2.2% of its tries in the band, one-sided: 8779 → 9013 over 100 cells.
8. **`stranded` draws all three variants superimposed** — `flora.js:1098` is a `species()` on `MAT`, which has no variant collapse; wants `MATV`.
9. ~~**`bigsGen`'s yield never fires**~~ — **fixed v11.31.3** (`BIG_YIELD` 16 counted over the whole cell, the cairns yielding too). The
   dead guard was real; the cost was not — that one step measures 0.27-0.54 ms over all 256 cells against farMs 3/2. Five steps now,
   worst 0.15 ms.
10. **The smoke test's mouse never reaches input.js** — `test/smoke.js:99` takes the first registered handler (zoo.js's); bites and
    look are untested headlessly and the test's comment is false.
11. **Lab**: number inputs write NaN into the spec mid-edit (`lab.js:692`, only `stats.*` guarded); the lab overwrites `location.hash`
    and loses a forced `#low` (`lab.js:669,782`); `LAB_NAME` has nine duplicate keys so some sliders show the wrong label (`LAB_NAME_BY` exists for this).

## From the person's readout screenshots (12 Sep, ten shots on the 4060, all at the 120 fps cap)
12. ~~**No clutch is ever laid.**~~ — **fixed v11.31.2**. The reconcile fired every tick; the surplus it looks for could not exist. A
    loaded cell's growth went into `POP.n`, which is also its living (`ecoTake`/`ecoDebit`/`ecoWriteBack` pin it there), so it was erased
    on every unload — and undisturbed it grows 0.55 of a recruit a game day at best. Now `POP.ow[entry][cell]`, seeded at a random phase
    in `ecoCap`, and `test/live.js` asserts a clutch is laid and hatched.
13. ~~**Hunters at hunger 1.00 wandering, not hunting.**~~ — **fixed v11.31.2**. `findPrey` was right; the nearest animal a hunter eats
    sits 35–50 m off against a `detect` of 9–17, and a hunter had no way to go looking. It now casts at `HUNT_SEEK` 4 × detect and swims
    at `HUNT_CAST` 0.8 of its speed toward what it senses, leashed to `HUNT_HOME` 1.5 × home. Kills 18 → 27 over 60 s, the share at
    hunger 1.00 13% → 8%. What is left is the ambushers (by design) and the ortho, whose nearest meal is 202 m away — a `SPAWN` envelope
    question, open. `starved 0` is the clock: 1.2 cycles at hunger 1.00 is 22 real minutes for a needle.
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
