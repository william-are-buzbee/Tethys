# CREATOR — the creature lab: one body-plan system for every animal, a tool first, the player's creator later

**Status: design, 9 Sep 2026, nothing built.** Written at the end of the clade passes (CLADES.md, v11.8–11.9.1) so the next session can
build the first cut in one go. Downstream of `PLANET.md` (the planet and the stalemate rule) and `CLADES.md` (the three signatures and
the kit); upstream of a new `src/lab.js` and, eventually, a rewrite of the builders. Questions for the person are at the end and are
not to be decided by Claude.

## What the person asked for (9 Sep 2026)

1. **Eventually a Spore-like creature creator** for the player's own animal — entered at character creation and again as you play. That
   needs a modular body and parts that attach. Their intuition: build that modular system for *our own* internals first, so every
   animal in the game is made the same way and a creature can be made by hand from parts.
2. **Split by clade.** No crossbreeding; a ringmouth builds from ringmouth parts. The intricate things (a mouth, a shell) can stay as
   larger fixed pieces for now and become customisable later. For the player the scale is "design and go crazy"; for us it is "a
   believable range within evolutionary plausibility".
3. **It will integrate with movement, combat and physics.** If bodies are free-form, movement can't be a fixed animation per species:
   it must be intuited from the build or from a chosen plan, and mass must change how a body moves. So the system needs a calculator
   that says how well a build moves and in what ways, from the day it exists.
4. **For now: a tool for the person to make unique creatures with.** The player-facing creator is later.

Their intuition in (1) is right, and half of it exists already: `buildRaptor` (v11.9.1) is a spec-in, creature-out builder — a plain
object of choices (`RAPTORS.keel`) becomes a whole animal with its animation, hit capsules and rigs. This document generalises that one
function into the framework, and puts a lab on top of it.

## The principle: a species is a spec, a builder is a compiler

Today `creatures_builders.js` has ~30 hand builders, each a hundred lines placing primitives. Since v11.8 they all draw on one kit
(below), and `buildRaptor` shows the end state: **a body plan is data**, and one function turns data into `{g, anim, hit, rigs}`, the
same object every hand builder returns. Nothing downstream — `spawn()`, the AI, LOD baking, the zoo, `test/preview.js`, the player —
knows or cares whether a creature came from a hand builder or from a spec. That is what lets this be done incrementally: the compiler
is *another builder*, the hand builders keep working, and species migrate one at a time when it is worth it.

```
spec (JSON)  ──►  compile(spec, s, pal)  ──►  {g, anim, hit, rigs}   ──►  DEFS / CLADES / zoo / lab / preview
                        │
                        └──►  derive(spec)  ──►  {mass, drag, thrust, speed, accel, turn, mode, plausible[]}
```

Two outputs from one input: the look and the numbers. The numbers are what (3) asks for and what will make the player's creature
honest: a heavy shell is slow because the calculator says so, not because a designer typed a speed.

## The kit as it stands (what the compiler is made of)

All in `parts.js` and `creatures_builders.js`; `part(g,x,y,z,c,o)` + `merge(parts)` is the vertex-coloured flat-shaded language
under everything. Every part below already handles countershading (`c2`) and the clade's colour keys.

| kind | function | clade | notes |
|---|---|---|---|
| core | `G.lathe(prof)` (a profile `[[r,z]...]`), `profR(prof)` | slowbloods | the fish body; `chevrons` rides it |
| core | mantle cyl + collar sphere (in `buildJetter`), `coilBody` | ringmouths | headless mantle into the ring |
| core | `trunk(P,pal,n,z0,z1,w(u),h(u),y(u))` | hingeshells | plates with pale joints |
| shell | `coilShell` (vertical / flat / up), the ortho's cone + `helix` | ringmouths | |
| carapace | `valves(g,pal,z0,z1,w,y,th)` → `set(k)` | hingeshells | the hinge; hood variant in `buildRaptor` |
| arms | `armRing(parent,n,z,ringR,len,w,col,segs,curve,o)` with `plan` (per-arm phi/len/w/sp), `ringPose` | all | the chain rig: simulated, collides, grabs |
| mouth | `ringMouth` (dark ring + beak), `mouthArms` (short stiff tentacles → `open(k)`), `mouthRing` (plates, under or `front`) | ringmouths / slowbloods / hingeshells | |
| eyes | `eyeRing`, `eyeCluster`, `eyes` (+pupil) / `slowEyes(pred)` / `stalkEye`, rim rows | ringmouths / slowbloods / hingeshells | the clade eye rules of CLADES |
| propulsion | `skirtTrio`, jet pulse / `finTrio`, `tailTrio`, tail lathe / `flapRow`+`flapWave`, `leg`, tail flick | | |
| weapons | grasp arms (plan) / the bite (`mouthArms.open`) / claws, spears, whips, fold (`buildRaptor`) | | |
| ornament | gladius ridge, spines (cones), `chevrons`, `comb` | | |
| chains | `makeChain`, `makeRig`, `rigRest`, `tailPose` (the eel), `trunkPose` (a proboscis) | | physics.js |
| time | `swimClock(f0,f1)`, `easer(rate)` | | the beat rule: never `t*f(spd)` |

Missing from the kit and needed by the compiler: a **slot** notion (where on the core a part attaches, in body coordinates), a
**part registry** with parameter ranges and clade whitelists, and a **stats derivation**. That is the whole of the new work.

## The spec

One schema, three grammars. A spec is a plain JSON object; `RAPTORS.keel` is already one in miniature. The shape:

```js
{
  id:'keel', clade:'hingeshells', size:5,             // size: half-length in metres, as DEFS uses it
  core:{kind:'trunk', L:9.5, n:8, w:[1.5,0.6], h:[2.0,0.8]}, // or {kind:'lathe', prof:[[r,z],...]} or {kind:'mantle', L, R}
  head:{w:1.8,h:1.8,l:1.9},                             // optional; hingeshells and the ortho have one, slowbloods and ringmouths do not
  parts:[                                               // each: a kind from the registry, a slot, and its parameters
    {kind:'eyes', style:'rim', n:5, at:{u:0.02}},       // u: 0 at the nose, 1 at the tail; a: angle round the body (0 top); r: radial offset
    {kind:'mouth', style:'plates', where:'front', R:0.45},
    {kind:'weapon', style:'spears', n:2, len:4.2},
    {kind:'flaps', orient:'vertical', pairs:9, at:{u:[0.05,0.95]}},
    {kind:'carapace', style:'small'},
    {kind:'tail', style:'plates'},
    {kind:'keel', h:1.4}, {kind:'comb', n:5}
  ],
  coat:{top:[..],belly:[..],joint:[..],eye:[..]},       // the palette, constrained to the clade's blood family (CLADES: copper / iron / vanadium)
  behaviour:{role:'hunter', prey:[...], burst:{on:0.7,off:1.5}} // optional; the lab fills DEFS defaults from the derived stats
}
```

Rules the compiler enforces, from CLADES (the person's decisions):

- **Clade grammar.** A core kind belongs to a clade (`mantle`/`coilbody` → ringmouths, `lathe` → slowbloods, `trunk` → hingeshells);
  every part kind has a clade whitelist; a spec that mixes is rejected with a reason. Ringmouths: no head, the collar of eyes always,
  eight arms in a plan (the deep line's equal ring is the exception); slowbloods: six-eye ring, predators' forward pair on lobes,
  the tentacle mouth, fins in threes; hingeshells: stalks that never track, valves on all but the giant, a comb, no antennae,
  no undulation (the core cannot be a chain).
- **Symmetry** is the default (a part with `n` is mirrored across x); a part may be `mirror:false` (the hose's mismatched pair).
- **Ranges**, not free values: each parameter has a clade-scaled range (a tentacle mouth's tentacles 4–8, a flap row 5–13 pairs, a
  spear at most 0.5 of the body). The lab shows a range as a slider; a spec outside it is clamped and flagged.
- **Every spec compiles to the four things**: `g` (meshes), `anim(t,spd,st)` (composed from the parts' hooks, one `swimClock` for the
  beat), `hit` (capsules from the core; the compiler knows the core's extent), `rigs` (from every arm-based part).

## The compiler — `compile(spec, s, pal)`

`src/creatures_spec.js` (new; order.txt after `creatures_builders`). Roughly two hundred lines, most of it `buildRaptor` refactored:

1. **The core** builds its meshes and exposes a *frame*: `rAt(u)` (the body's radius along it), `zAt(u)`, `top(u)`, `bottom(u)`, the
   nose and tail z, and whether it sways (a lathe body yaws with the tail; a trunk does not). This is what slots are resolved
   against: a part's `at:{u,a,r}` becomes an (x,y,z) on the surface.
2. **Parts** are functions `partKind(ctx, params) → {parts?, meshes?, rig?, anim?(t,spd,st), hit?}` where `ctx` carries the frame,
   the palette, the group and the clade. Static parts push into the core's merge list (one draw call); moving parts add their own
   meshes and an anim hook. The registry is a table `PARTS = {eyes:{clades:[...], build, ranges}, ...}`.
3. **Composition.** The compiler runs the parts, merges the static ones into the body mesh, collects anim hooks, rigs and hit
   capsules, and returns the builder object. The beat: one `swimClock` per creature passed to every hook; the states `tell`,
   `strike`, `jet`, `pulse`, `withdrawn` passed through unchanged.
4. **The old builders become specs when convenient.** `buildRaptor` first (it *is* the compiler for one core kind). Then the slowblood
   fish (one lathe core + the kit; ten species differ only in parameters) and the jetters. The coils, the pall, the veil, the tread
   and the eel keep their hand builders as long as they like — a hand builder is a valid "core kind" too.

## The calculator — `derive(spec)`

What (3) asks for, and the thing that makes a free-form body honest. First version, all closed-form, no simulation:

| quantity | from | note |
|---|---|---|
| **volume, mass** | the core's profile integrated (a lathe: πΣr²dz; a trunk: Σw·h·dz; a mantle: the cylinder), plus shells and carapaces at a higher density, plus arms | density by clade: shelled and armoured heavier; gas chambers subtract (the coil floats) |
| **frontal area, drag** | the core's max cross-section plus raised valves, spread arms, a hood; a streamlining factor from the profile's slope at the nose | a flat-carried wheel was slow for this reason; a knife swimmer is fast |
| **thrust** | by propulsor: tail (fin area × beat amplitude × beat rate), fins (area), flap rows (pairs × area × wave rate), jet (mantle volume × pulse rate), legs (walking only), tail flick (a burst impulse) | one number each, summed; the clade caps the rate (slowbloods by temperature later, hingeshells burst-and-coast) |
| **speed** | thrust / drag, scaled to the roster's numbers (a 1.8 m finback at 8.8) | `cruiseF`, `accel` from thrust / mass |
| **turn** | inversely with length and mass; fins and oars add | the tread turns at 0.5, a darter at 7 |
| **mode** | the propulsors decide, never a menu: a tail + lathe = undulate; a mantle + siphon = jet; flap rows = metachronal; legs = walk; a tail flick = burst | this answers "movement is free-form and undecided": the build says how it moves |
| **buoyancy** | gas chambers vs mass | a coil sinks slowly when withdrawn (exists); a lab creature with no chambers and a heavy shell sinks |
| **plausible[]** | the clade rules plus PLANET's limits (a 15 m hingeshell, a hingeshell that undulates, a shelled ringmouth below −450, eyes below the light) | warnings in the tool; for the player later, a soft meter |

Output is the DEFS/CLADES fields (`speed, accel, turn, mass, hp, size, cruiseF`) so a lab creature can be dropped into `DEFS` or
`CLADES` and moves correctly the moment it exists. The bestiary and the lab show the numbers beside the animal.

## The lab — `#lab`

The dev tool, built on the zoo (same camera, light, water, action keys, coats). `src/lab.js`, a panel in `shell.html`.

- **Enter** with `#lab` or `l` on the menu (the zoo is `z`). Start from any roster species that has a spec, or a clade's blank.
- **Panels** (the game's text style breaks here by necessity — an editor has controls; keep it dark, lowercase, sparse): the core
  (kind, length, width/height profile as a few draggable points), the parts list (add / remove / duplicate, a part per row with its
  sliders), the coat (hue/value within the clade family, the coats as presets), and the readout (the derived stats, the plausibility
  warnings, tris and draw calls).
- **Live rebuild** on every change (a build is milliseconds; the rigs re-rest). The action key fires the tell/strike as in the zoo so a
  weapon can be seen working; `s` cruises so the propulsors beat.
- **Save / load**: the spec as JSON — copy to the clipboard, paste back, and the URL hash (`#lab=<base64 spec>`) so a creature is a
  link. (localStorage as a convenience, not the store of record.)
- **Export as a species**: a button that emits the three lines a species needs (`PAL` entry, `DEFS` entry with the derived stats and
  default behaviour, `ROSTER` entry) to paste into `creatures_defs.js`, plus the spec into a `SPECS` table. A placed species is still a
  `SPAWN` envelope the person writes by hand.
- **Drop into the world**: from the lab, `p` places one of the current build in front of the player at the peak for a look in motion
  (a temporary creature, not saved). This is the cheapest way to test the calculator's numbers.
- **Headless**: `node test/preview.js --spec path.json` renders the sheet; `test/smoke.js` builds every `SPECS` entry.

## The player's creator (later — what changes, so nothing built now blocks it)

- The same spec, the same compiler, the same calculator. The player's creature is a `CLADES` entry built from a spec.
- **Clade lock** at creation; parts unlock by play or are all open (the person's call). Ranges shown as the clade's "believable"
  band with the extremes greyed, not forbidden — "design and go crazy" within it.
- **Re-entering the editor**: the natural moment is the hingeshell moult (PLANET: the soft state) and, for the other clades, growth
  stages — `size` grows with food, and at a stage you may change parts. Nothing here needs building now, only that `size` stays a
  spec field and the compiler is deterministic.
- **Mirror by default, asymmetry as a choice** (the hose precedent).
- The derived stats bind: the player's speed, turn, mass, hp come from the calculator, and the *mode* (jet, undulate, flap, walk)
  from the propulsors — `player.js` already switches behaviour on `jet` and `legs`; the calculator sets those flags.
- Plausibility is a meter, not a wall, for the player; a wall for the world's own species.

## What one session should build ("smoke it in one shot")

1. `creatures_spec.js`: the registry, the three cores (trunk from `buildRaptor`; lathe from `buildFinback`; mantle from `buildJetter`),
   the parts already in the kit wrapped as registry entries, `compile`. `RAPTORS` become `SPECS.keel` etc. and `buildRaptor` becomes
   `compile`. The finback and the soft-arm as specs (the two players; the coilshell keeps its hand builder for now).
2. `derive` v1 with the table above; the bestiary caption shows the derived numbers next to DEFS's so the scale can be tuned.
3. `lab.js` + the panel: core, parts, coat, readout, JSON copy/paste/hash, export, `p` to drop into the world.
4. Tests: a spec round trip (compile → JSON → compile, same tris), every `SPECS` entry compiles in the smoke test, lint, the anim test
   on the spec-built players (the beat rule).
5. DESIGN gets a "Creatures, the spec" section; HANDOFF points here; this file records what was decided.

Not in the first cut: converting every hand builder; the player-facing UI; unlocks; growth; the temperature and moult mechanics
(PLANET Hooks) — though the calculator should leave a `temp` multiplier slot for the slowbloods.

## Questions (asked 9 Sep 2026; not to be decided by Claude)

1. **Where does a saved creature live?** A link (the URL hash), the clipboard (JSON), localStorage, or all three with one as the record?
2. **Do the derived stats bind in the dev tool**, or are they advisory with a hand override? (Binding makes the tool honest; an override
   makes tuning faster. Both is possible: derived by default, a lock icon per stat.)
3. **What may the player choose within a clade** — any core in the clade (a ringmouth player could be a jetter, a coil or a crawler), or
   is the family fixed and only the parts free?
4. **Asymmetry**: mirrored by default with an unmirror per part, or always mirrored for the player and free for you?
5. **When does the player re-enter the editor**: at moults / growth stages only, at will, or once at creation for now?
6. **Are the intricate pieces** (the coiled shell, the tentacle mouth, the raptor weapons) whole parts with a size slider, or do you want
   their internals (turns of the coil, tentacle count, spine count) open from the start?
7. **Should the lab place creatures in the world** as temporary animals (the `p` above), or only show them at the peak like the zoo?
8. **The coat**: free colour within the clade's blood family, the eight coats as presets, or both?
9. **Plausibility beyond the clade rules**: should the tool *refuse* an implausible build (PLANET's limits: a 15 m hingeshell, a shelled
   ringmouth in the dark) or only warn — for you, and separately for the player later?
10. **Migration**: convert the existing builders to specs progressively as touched (my recommendation), all at once, or only build new
    creatures with the tool and leave the hand builders as they are?
11. **The lab's text**: the game's rule is minimal lowercase serif and text only when needed; an editor needs labels and sliders. Same
    style, or is the lab allowed to be a plain tool?

## Decisions (answered 9 Sep 2026) and what was built (v11.10)

1. Saved creatures live in the URL hash (`#lab=<base64 json>`) and on the clipboard as JSON. **No localStorage.**
2. Derived by default, a lock per stat (`spec.stats`); a locked value overrides the calculator and is what export emits.
3. Any core in the clade: a ringmouth may be a jetter (`mantle`) or a shelled coil (`coilbody`). Every existing species must be
   expressible and look identical — verified for 18 species by `test/ident.js` (tris, bounds, checksum, idle and action pose).
4. Required parts are symmetrical. A placed part may be **mirrored** for twice the points. No cap; the cost is a count.
5. The editor is entered once, at creation, for now.
6. Internals open: turns of the coil, tentacle count, spine count, flap pairs, comb teeth, leg pairs.
7. `p` drops the creature into the world as a temporary species (`DEFS.lab`), near the peak or ahead of the player.
8. Colour is free for the player; the **defaults come from chemistry** (`coatFor`, below). The roster palettes stay as presets.
9. Push far but not crazy: every parameter has a believable band (warns beyond it) and an extreme band (clamps at it). Positions
   warn, never clamp.
10. Migrate as touched. Migrated: soft, arrow, coil, great, ortho, fin, ridge, abyssal, grazer, darter, needle, basker, crusher, and the
    five raptor looks (sickle, hose, hood, lash, ram). Hand builders still: rasp, veil, lurker, watcher, pall, eel, stone, the non-raptor
    hingeshells. `buildRaptor` became the `trunk` core plus parts.
11. Same style, with a dark halo behind every caption and a panel the text can be read against; the small text a point larger.

What exists: `src/creatures_spec.js` (grammar, cores, part registry, `compile`, `validate`, `derive`, `statsOf`, `coatFor`, `SPECS`,
`SPEC_BLANK`, the JSON/hash/export functions) and `src/lab.js` (the tool). `zoo.js` shows the derived numbers beside DEFS's on any
spec species; `l` opens it in the lab. `test/preview.js` takes `SPEC=file.json`.

## Colour — what the chemistry says the defaults are (`coatFor(clade, depth, diet)`)

Pigment on Earth is a short list, and the reasons for it transfer: this is what a coat *can* be made of, not a style.

- **Melanins** — made by everything from tyrosine; brown to black; the default dark. Free on any diet.
- **Ommochromes** — the ringmouths' chromatophore pigment (as in cephalopods): yellow, orange, red, brown; made from tryptophan, so
  again free of diet. They are why a ringmouth's coat can shift and a slowblood's can't.
- **Carotenoids** — the oranges and reds animals cannot make; they come *only* from photosynthesisers up the food chain. A coat has
  them if its diet reaches the lit shallows; a vent or chemocline diet (sulfur, iron) has none, so those animals are melanin-grey,
  blood-tinted, or white.
- **Blue** is almost never a pigment; it is structure (iridophores, thin films), and it is pointless below −20 m where the water has
  taken the blue out of the light. Green is the same story.
- **Red is free camouflage** below about −15 m: red light is gone, so a red animal is black. Deep coats are red or black.
- **Countershading** only where there is light to shade against: darker above, paler below, from the surface to the light limit.
- **The floor** is pale: cream, sand, rust on the iron strands, so a bottom animal matches its ground.
- **Blood tint** shows through thin parts and at the mouth and eyes: copper (ringmouths) teal-green, iron (slowbloods) rust, vanadium
  (hingeshells) straw-yellow to apple-green.
- **Shell colour** is the water's chemistry (PLANET: the mineral, the iron), not the animal's choice.

`coatFor` draws a palette from those rules with the clade's blood, a depth band (surface / lit / twilight / dark / floor) and a diet
(grazer / hunter / vent / chemocline / filter), and returns `.note` saying why. The player may then paint over it.

## Second round (9 Sep 2026, after building with it) — done in v11.11
1. Only the clade's styles are offered (`STYLE_CLADES`, `stylesFor`); validate corrects the rest. Ring eyes (slowblood) and rim eyes
   (hingeshell) stay separate kinds even while they look alike.
2. The drag works (the menu overlay was eating it); r spins and stops.
3. l in play opens the lab beside the player.
4. Weapons have position, orientation, size and a tooth count.
5. Snapping: the surface model (`bodySurf`, the parts' `cover`, `ctx.top/bottom`); a placed part's `snap` puts it on the body and on
   whatever armour covers that spot.
6. Eye stalks, eye rows, weapon placement and the plate mouth all parameterised; mouth parts (mandibles, palps, feelers) on a mouth that
   faces forward, down or sits on a probe.
7. The panel: a nav, folds per part, the part under the cursor lit on the creature, readable slider names.

## Third round (10 Sep 2026, v11.25): every creature in the creator (IDEAS #4)
The eighteen hand builders left after v11.10 are specs; the drifters are the fourth clade of the grammar (bell and float cores, arms
only, no eyes). Seven cores and some thirty part styles were added for what those builders did (CHANGELOG v11.25 lists them). The one
migration rule kept: a spec is the builder parameter for parameter, proved by `test/ident.js` where it could be and by the preview sheets
side by side where a part was generalised (the trap's arm is the raptors' `fold`; three species carry the mouth their clade requires).
Not done, still: the player's creator, unlocks, growth, the moult; converting the flora.
