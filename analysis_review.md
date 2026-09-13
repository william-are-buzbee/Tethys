# Code review — 12 Sep 2026

The ranked findings of the read-only review. Each was checked against the code; the top ones re-verified by hand. Kept here so the
next session can turn them into patch versions; strike a line when it is fixed.

**Fixed: items 2–6, the combat group, v11.31.1 (13 Sep).** All five stood when re-verified. Item 2 was worse than the table below
said — 45 of 58 predator/prey pairs, not 9 — because a prey's own body counts too. See the CHANGELOG entry.

**Fixed: items 12 and 13, the ecology group, v11.31.2 (13 Sep).** Both stood. Neither was a broken branch: 12 was arithmetic that could
never reach a whole animal (and a surplus erased on every unload), 13 was a detect of 9–17 m against a nearest meal 35–50 m off. The new
`test/live.js` holds both. See the CHANGELOG entry.

**Fixed: items 1, 8, 10 and 11, the render, lab and tests group, v11.31.4 (13 Sep).** All four stood. Item 8 was the shallow half of a
deeper bug: `stranded` could not be drawn at all, and nor could `tussock` or `scrub` — the surface cap in `placeFloraType` fires on land,
where the room to the surface is negative, so no plant had ever been placed above the tide line. See the CHANGELOG entry.

**Fixed: the four duplicated formulas, v11.32 (13 Sep).** The daylight curve, the canopy fade and the chemocline are one
definition each now; the two slopes are left as two with the reason written at both sites. The six `size^3` copies were **not** one
formula: three are physical (floored) and three biological (unfloored), and unifying them would have halved a flicker's birth rate
— they are `bodyMass` and `bioMass` in creatures_defs.js. `--test` was green on both tiers while the world was broken (the curve in
`SUNK_V` put `uFogW` in the vertex shader, where it was undeclared, so every Lambert program failed): a screenshot against a build
of the previous commit is what found it. See the CHANGELOG entry.

**Fixed: items 7 and 9, the placement group, v11.31.3 (13 Sep).** 7 stood in both halves. 9 stood as a dead guard but not as a stall: a
cell's whole structure pass measures 0.27-0.54 ms over all 256 cells, inside farMs — `sample()` warm is 0.7 µs, not the ~35 µs far.js was
citing (that is its cold figure). See the CHANGELOG entry.

**Fixed: the rest of the drift list, v11.33 (13 Sep).** chunkAt off the grid, the ecology carrying its elapsed time, the
starvation tally, landBite's guard, blur clearing keys, serve.js's 400; five dead names and MATR2 removed (lint now reports none
unused); ROSTER.new cleared on the fifteen species that spawn; the acorn, test/spec.js and "canopy mats" lines corrected. GLOW, the
pads path, y:'mid' and glim are kept on purpose and say so where they live. The fog tuner's o/p collision is NOT fixed: every free
key pair is already the audio tuner's or the game's. **What is left of this file: items 14 and 15.** See the CHANGELOG entry.

## Real bugs, worth a patch each
1. ~~**Light shafts never take the sun's colour**~~ — **fixed v11.31.4** (`shU.uCol` on its own line; the shafts read `K.lumC`, warm at a
   low sun, silver under the moon).
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
8. ~~**`stranded` draws all three variants superimposed**~~ — **fixed v11.31.4** (`MATVD`, a variant material without the breath: a
   stranded float is a corpse). It was never drawn at all: the surface cap skipped every land plant, so tussock, scrub and stranded had
   zero instances in the world. Both fixed; tussock 0 → 797, scrub 0 → 70, stranded 0 → 9 over the cells at the north strand.
9. ~~**`bigsGen`'s yield never fires**~~ — **fixed v11.31.3** (`BIG_YIELD` 16 counted over the whole cell, the cairns yielding too). The
   dead guard was real; the cost was not — that one step measures 0.27-0.54 ms over all 256 cells against farMs 3/2. Five steps now,
   worst 0.15 ms.
10. ~~**The smoke test's mouse never reaches input.js**~~ — **fixed v11.31.4** (every listener, as a browser does; the stub's pointer lock
    works, `__nolock` puts the refusal back; smoke.js asserts the look, the bite and the grab, locked and dragged, for all three clades).
11. ~~**Lab**~~ — **fixed v11.31.4**: the NaN guard is every number field, not only `stats.*`; the hash is a flag list (`HASH_FLAGS`,
    `HASH_TIER` in scene.js) so `#low&lab=<spec>` works and `labHash` writes the tier back; the nine duplicate `LAB_NAME` keys are one
    entry each with the part-specific meanings in `LAB_NAME_BY`.

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
14. ~~**Performance, for the pass.**~~ — **measured 13 Sep, and there is nothing to cut yet.** The review guessed the shadow
    map was the lump and read `wshadow 2.90ms/85` as 85 casters; `shsN` is the number of re-renders since boot, not a count of
    anything. Measured in the running game at the forest (330, 0):

    | | |
    |---|---|
    | shadow re-render | 105 draws, 2.23M triangles, 4 cells in the box, 2.9 ms |
    | its refresh rate | 0.33/s standing still; ~0.8–1.1/s at 8.8–15.4 m/s (drift 20 m, plus the sun's 0.005 rad every ~3 s) |
    | amortised | ~1–3 ms per second of wall clock; about one frame a second carries it |
    | main render | 429 draws, 4.9M triangles, 4.06–4.19 ms on the 4060 |
    | the person's frame | work 5.4–5.9 ms average, 7.9 ms worst, against an 8.3 ms budget. **No frame is dropped.** |

    So the shadow pass is a once-a-second spike that takes a frame from 65% to 95% of budget and never over it. Cutting it would
    buy a spike nobody sees. Where the creep since v11.12 (render 3.2 → 4.2) actually lives: **the main render's draw calls, and
    they are cell flora** — 118 of the 196 draws with only 9 cells up, roughly one `InstancedMesh` per flora species per cell, so
    the count grows as species × visible cells. Creatures are 33 draws and 15k triangles; they are not the problem and neither is
    physics (1.2–1.5 ms).

    **What that means for the archipelago:** draw calls scale with the number of loaded cells, so more islands multiply them
    directly. The lever, when it is needed, is batching one species across cells (or dropping species by distance), which is a
    designed pass and not a knob. The trigger to start it is the readout's `work` max reaching 8.3 on the 4060 — it is at 7.9.

    Smaller things found and deliberately not done: the crusts (`rind`, `limerind`) are 9% of the shadow pass's triangles and lie
    flat on rock where they cast nothing, and `SHS_ANG` could go from 0.005 to ~0.012 (the shadow tip of a 30 m caster moves
    36 cm, about 4 texels) to cut the sun-driven refreshes by half. Both are real; neither is worth the risk at 95%-of-budget
    spikes that drop no frames.

15. **To look at — four diagnoses, and each call is the person's.**
    - **Night readability at 8 m under a full moon.** Pure taste, and the decision is upstream: DIRECTION's closer moon (about half
      Earth's distance) argues for brighter nights than the current `light 0.25` against a day's 0.88. Nothing to fix until that
      lands; when it does, the knob is the moon's contribution in `updateSky`.
    - **The floaters' blades reading as lit at night.** Not emissive — no creature or plant material has an emissive term, and the
      blades take the same daylight scale as everything else. Two real causes: `pigment`'s shallow-water brightening (`×1.22`
      above 8 m, grow.js) and the geometry — the blades are near-vertical planes and the floor is horizontal, so a low sun or moon
      lights them and not it. In the dusk shot (sun 8°) that is simply correct. The knob if it reads wrong anyway is the boost's
      `k` 0.22 in grow.js `pigment`.
    - **The marine snow as squares.** `PointsMaterial` with no map draws a hard quad, and the particles are 0.07–0.19 m
      (`pm.size` 0.14 × `SN_K[i].sz` 0.5–1.35, atmosphere.js). Close ones subtend enough angle to read as squares. A round sprite
      (a discard in the fragment, or a tiny generated texture) is the cheap fix; it belongs with POLISH pass B rather than here.
    - **Pink and purple polyp tables among the stipes at 8 m.** Working as designed, and the overlap is narrow and deliberate:
      `table` wants `nut ≤ 0.55` and `stipe` wants `nut ≥ 0.45`, with depths overlapping over −24..−16, so the two only meet in
      that band — TAXA's "where two lines meet is where the world is most legible". The question is only whether `VIVID` is too
      saturated at night, which is the person's eye and the tints table in flora.js.

## Drift and cost, fold in when touched
- ~~**Duplicated formulas already disagreeing.**~~ — **fixed v11.32** (`daylightAt`/`DL_GLSL`, `canopyFade`/`CAN_GLSL`, `CHEMO`,
  `bodyMass`/`bioMass`; the slopes documented, not unified). Kept below for the record.
- **(as found)** Mass in six places, two unfloored (`combat.js:30`, `creatures_ai.js:115`, `ecology.js:29`).
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
