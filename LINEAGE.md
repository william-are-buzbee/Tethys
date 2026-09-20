# LINEAGE.md — the line across generations: the brood, the switch, the mutation, and the magic that is admitted

**Status: design, 20 Sep 2026, nothing built. The person's answers are in (§10) and are folded through the body of this doc.** Written
at the head of the creator pass (the person, 20 Sep: the creator becomes the default start of the game, and the game becomes "a genetic
lineage game where you can trace your ancestry, lives and activity levels"). Upstream: `PLANET.md` (the clades and their limits),
`CLADES.md` (the three signatures), `COMBAT.md` (death, and `slotDeath` as built), `CREATOR.md` (the spec, the compiler, the lab as it
stands), `DIRECTION.md` (the loop; its "not a lineage" line is struck as of today). Downstream: the creator's registry pass, the
segmented body, and `save.js` / `menu.js` / `creatures_ai.js` / `ecology.js` when it is built. Nothing here is built; nothing here has a
name in the world.

## 1. The frame: a believable world with one admitted wrench in it

The 12 Sep decision against a lineage (`DIRECTION.md`, The game) is **struck, 20 Sep 2026**. Its reason — the world would have to change
with the generations — is answered by the person's framing, which is the more interesting position and the one this whole doc rests on:

> "the player is this almost magical realism wrench thrown in, given the ability to update and modify and evolve in rapid time, screwing
> with not only their own biology but the structure of the ecosystem."

So Tethys is not a game about evolution. **Tethys is a believable simulation with exactly one thing in it that does not obey the rules,
and that thing is you.** You mutate in a generation what a lineage would take a hundred thousand years to do. The duration is not meant
to be accurate and no in-world explanation is owed. What is owed is **honesty about which moments are the magic** — see §7, the sparkle.

Everything else in the world keeps its rules. The ecology stays the steady state `test/census.js` measures; the geology does not move;
no species gets an exemption. The wrench is a single object in the simulation, and the simulation's job is to **absorb it**: to take
whatever animals the player looses into it and let them succeed or fail on the same terms as everything else.

## 2. What a lineage is, in the parts that already exist

| the word | what it is in the code |
|---|---|
| a **world** | a slot: `curSave` plus the ledger's five tables and the clock (save.js, `SAVE_V`) |
| a **line** | the slot's `deaths[]` plus, new, the specs those animals wore, where each one went, and the tree of descent nodes (§8) |
| a **life** | one animal: `player`, a `clade`, a spec, injuries (`arms`, `regrow`, `lost`) |
| a **death** | `slotDeath(cause)` — writes `{cause, day, playT}` to the slot, returns to the menu with the cause as its note |
| a **brood** | `layEggs` — a knot on the floor, hatching after `ECO.hatch × mass^¼` days, eaten down by scavengers, counted by the ledger |
| a **variant** | a spec the player made, loosed into the world, competing as an ordinary species (§8) |
| a **body** | a spec (`SPECS[id]`-shaped) → `compile` → the animal, and → `derive` → the numbers |

The line is a short list on the slot: `{spec, born, died, cause, playT, parent, track}`. That is the whole record, and the shrine (§9)
is a read of it.

## 3. The three starts: r and K, and how many chances you get

Reproduction is a clade fact, not a game setting (the person, 20 Sep: "that works"). The three modes fall out of the clades as already
written, and — now that §4's brood model is in — they turn out to set two things at once: **how many chances you get to switch**, and
**how well the broods you never claim do without you.**

### Ringmouths — spawn once and die (semelparous, extreme r)
The cephalopod fate, honest for a soft fast-growing animal with no skeleton: grow hard, breed once, senesce, die.

- One clutch, many small eggs, at the end of the life. **One switch moment, and it is forced**: the parent is dying anyway.
- Unclaimed young: many, cheap, mostly eaten. A ringmouth variant establishes by numbers or not at all.
- The feeling: a run. You build toward one spawning, and dying before it ends the line outright.
- The person's "adults die deliberately once they lose control" is this, and it needs no cognition system: it is the clade's biology.

### Slowbloods — breed again and again (iteroparous, indifferent)
Iron blood, a skeleton, a long slow life. Several clutches, little invested in each, no interest in the young.

- **Several switch moments over a life** — the clade where the choice in §4 is really a choice.
- Unclaimed young: the shark answer. The adult does not know them and may eat them. Middling odds.
- The feeling: a career. Death is the loss of everything you grew, if nothing of yours is left alive.

### Hingeshells — brood, and moult (iteroparous, invested, K)
Vanadium blood, an exoskeleton, `MOULT` already in the game (soft after a moult, hardening over `MOULT.soft` days × mass^¼).

- Few large eggs, guarded at a den; a brooding parent is pinned to a place and vulnerable.
- **Few switch moments, but the unclaimed young actually survive.** This is the clade whose loosed variants seed the world best, and the
  only clade where staying with the young is honest.
- The feeling: a siege. You choose the den and defend it, and the moult is the recurring danger inside one life.

### Drifters — later (the person, 20 Sep: "maybe later")
Not playable in the first cut. If they come, the alternation of generations (polyp and medusa — *a different animal per generation*) is
the obvious and the strange loop, and it would need its own pass.

## 4. The loop: the brood, the moment, the switch

This is the person's model of 20 Sep, and it replaces the death-triggered handover that the first draft of this doc had. The difference
matters: **switching is a live choice you make while healthy, and death is the fallback that usually fails.**

1. **You breed as you play.** A clutch is a real clutch — `layEggs` with your spec on it, on the floor, scavengeable, counted.
2. **You keep playing.** The clutch runs its hatch clock whether you are there or not.
3. **At the hatch there is a moment.** If you are present, you may take one of the hatchlings and become it. **The moment passes**: take
   it or carry on as you are. There is no menu later, no queue of unclaimed bodies waiting on you.
4. **A switch is immediate and in place.** No skip, no pause, no summary screen: you are the hatchling, at the clutch, in the world as it
   stands, with whatever is around you still around you. The parent's body is simply no longer yours (§3: for a ringmouth it is dying
   anyway; for the others it is an animal now). What becomes of your loosed brood is decided the way every other species' fate is
   decided — by the off-screen model, over days, as time passes normally (ecology.js, `ECO_STEP`).
5. **What you do not claim goes to nature.** r-selection is unkind and should be: most broods come to nothing, some establish, a few do
   well. **Occupying a child is not a guarantee of survival — it is a large thumb on the scale**, and that asymmetry is the whole reason
   the switch feels like something.
6. **Death looks for your living descendants.** Find one and you become it, where it is. Find none — **the save is over** (the person:
   "There is no grace. No clutch, the save is over.")

**Only your own descent counts** (the person, 20 Sep): you may swap only into something the body you are wearing produced. **Siblings and
parents are not eligible** — the clutch you hatched out of is not a reserve of spare bodies, and you cannot go back up the tree.
**Grandchildren are**: descent is transitive, so a child you never claimed, living out there and breeding on its own, gives you
grandchildren you may take. The eligible set is the subtree under the body you occupy, and nothing else.

Two things fall out of that, and both are the point:

- **Every life must breed for itself.** "You must produce your own genetic line with each selection." Inheriting a good body buys you
  nothing if you do not use it; a life that never lays is the end of the save whatever the rest of the line achieved.
- **A switch rebases the tree and throws the rest away.** Take a hatchling and its clutch-mates — and the den you left them at, and
  everything else the parent ever produced — are outside your line forever. The choice at the hatch is therefore not "which body is
  better" but "am I done with everything this body made", which is a much better question to be asked while a clutch is opening.

The consequence is worth stating plainly, because it is the game: **your survival at death depends on whether the animals you designed
and abandoned were good enough to live without you.** That is the simulation grading your creature work, in its own currency, with no
appeal. Nothing else in this project has that property.

**New open questions this raises (§11): whether the hatch moment needs a warning (you must be near the clutch, so you must have chosen
to go back for it — which is good, and is a door), and what happens to the body you leave at a switch while you are standing next to it.**

## 5. Presets and founders

A new game goes into the creator, and **there are many preset bodies and a randomiser** (the person, 20 Sep) — designing from nothing is
an option, not a toll. Later, the founder may be "a preset, mutated": you start from a known animal and may move only so far from it,
with the freedom growing over generations. **A hatchling never changes clade** (the person: "No, not a new clade"); whether a *new founder*
in the same slot may be another clade is still open (§11).

## 6. The mutation budget is physics, not points

The person, 20 Sep: *"The budget is purely physics, the demands of the body + the materials needed. You create a small animal with that
genetic script and it will consume the resources it needs to produce that body plan."* So it is not an abstract allowance:

- **A body plan is a bill of materials.** Mass first (the calculator has it: `derive` already computes mass from the build, and
  `GRAMMAR`'s per-clade `density`). Then the specific stuff: the mineral for a shell or plates, the pigment for a coat, the nerve and
  eye tissue for the senses.
- **The bill is paid by eating** — which is `DIRECTION`'s "the keys are eaten, where the chemistry says", and which the game already does
  once, in `coatFor`: carotenoid colour exists only if the diet reaches the lit shallows; a vent or chemocline diet is melanin-grey. That
  is the precedent and the model. `CREATOR.md`'s parked "mass budget and the mineral/pigment gates at growth stages" is this item.
- **So a mutation is affordable or it is not**, by what the line has eaten and where it has been. A line that fed deep buys what a
  shallow grazer cannot. No points, no tiers, no unlock tree.
- **The numbers are playtest numbers** (the person: "playtested a lot"). This doc sets no constants; the pass that builds it should put
  them in one table with a comment per key, the usual way, and expect to move them.
- **A lost part is not inherited.** `lost[]` (v11.57) tracks what was torn off; the child is built from the parent's *spec*, not its
  corpse. Lamarck is not on the menu, and it is written here so it is never accidentally built.

## 7. The sparkle: the magic, admitted but not explained

The person's answer to "how does any of this work" is **"it's magic"** — with the sharp qualifier that the game should *"accept and
subtly acknowledge it without being weirdos."* The mechanism for that is a single visual object, and it is the most precise piece of
direction in this doc, so it is recorded close to their words:

> "there is a sparkle. A visual effect, like a star or light flickering from a candle. It's clean and visible but also leaves a trail as
> it moves — it's not always part of the world, but can also be part of the screen."

**Where it appears** (the person's list, which is also the complete list — see the rule below):

- on the founder, and on the screen while you are creating a character;
- when you occupy a child and become it;
- when you successfully close the mutation window;
- trailing the cursor, at certain moments, in the creator;
- as the icon the game saves with.

**The rule that makes it work: the sparkle appears only at the magic, and never anywhere else.** Not on an ordinary creature, not as
ambience, not as a prettiness on a good frame. It is the game's tell for "this part is gamey; the rest is the simulation", and the
person's intent is that the player never has it explained and comes to feel it anyway. One appearance in the wrong place costs the whole
signal. That is the sort of rule that has to be in the doc, because it is invisible in the code.

**What it costs, technically.** Nearly nothing, and it is already half-built. The screen-space one is an overlay on the HUD layer
(atmosphere.js) with a short trail — a handful of quads with a fading tail. The world-space one is a pooled point emitter of the kind
fx.js already runs for silt, bubbles and scraps (v11.53, POLISH pass B); it wants an additive material and a lifetime, and nothing else.
The save icon means **the silhouette must read at 16 px**, which argues for a four-point star rather than anything soft, and it should be
drawn once as a shape both uses so the icon and the effect are literally the same mark. It belongs in POLISH's pass C or beside it.

## 8. The ledger: absorbing what the player looses

The person, 20 Sep: *"the game needs to just find a way to absorb whatever 'added animals' the player throws into the game"* — and the
picture at the end of it: *"you may find dozens of your own species variation across Tethys, floating about as though they belong, just
on your save file."* That is `§8.1`'s third and dearest answer from the first draft: **the player's variants become real entries in the
ledger, with envelopes, and compete like everything else.** Founder-oddity and ghost-record are struck.

This is the one place where the doc's ambition meets the engine's arithmetic, so the facts, plainly:

- **A `SPAWN` entry is not free.** `POP` holds five `Float32Array`s of `ECO_CELLS` (240 × 240 = 57,600) per entry — about 1.15 MB, plus
  a `mark` byte array. Forty variants in a long line is roughly 48 MB of tables for animals that occupy a handful of cells each.
- **So player variants want a sparse representation**: a cell→count map per variant, walked through `POP.cells[ei]` exactly as the dense
  entries are walked today. The ledger's loops already go over those lists rather than over `ECO_CELLS` (v11.65), so the loops need not
  know the difference. This is the main piece of engineering the vision demands, and it is tractable.
- **Entries are built once at `ecoInit`.** Adding one mid-game means growing `POP`'s tables and `SPAWN` at runtime; the save format
  (`popRows`, run-length coded) already handles arbitrary entries, but `ents` becomes a list of specs rather than a list of kind names.
- **Each variant needs an envelope and a `DEFS`** — see §8.2, which is now unavoidable rather than deferrable.
- **Descent has to be carried by populations, not individuals** — this is what §4's grandchild rule costs. The ledger counts; it does
  not know who begat whom, and an unclaimed child is genetically its parent's spec, so it is not even a distinguishable variant. The
  workable shape is a **tree of descent nodes**: a brood you lay is a node (`{cell, n, born, gen, parent, spec}`), the model grows or
  kills its count as it does everything else, and a node that survives long enough spawns child nodes of its own — which are your
  grandchildren, without any individual ever having been tracked. Eligibility is then "any node in the subtree under the node I am
  wearing, with `n ≥ 1`", which is a walk of a list with tens of entries, not a search of the world. The same nodes are exactly what
  the shrine's marketshare (§9) reads.
- **The off-screen model is what makes it honest**: whether a loosed brood establishes is decided over days, in cells you are not in, by
  the same code that decides it for every other species — no bookkeeping shortcut, no special case for the player's animals.

### 8.2 Where a custom animal's `DEFS` comes from (the load-bearing gap)
`derive` gives mass, speed, turn — the physics. It does not give **role, prey, reach, diet, capacity envelope, or what hunters make of
you**, which is what the AI dispatches on and what the ecology prices. A freeform animal needs these inferred from the build: diet from
the mouth style and the gape, reach from the grips `compile` already reads, role from the propulsion and the eyes, the envelope from the
tolerances the body implies. Without it a variant cannot be a ledger entry, the AI cannot treat it consistently, and the creator cannot
be the default start — lineage or no lineage. **It is the single most load-bearing missing piece in the creator plan.**

## 9. The shrine: the run, after the run

The person, 20 Sep: not an in-game screen. **After you die or finish a run** (or from a menu — achievements or the like), an interactive
map, out of the world, that makes a shrine out of the playthrough:

- **the forms** you created and occupied, each in its own colour;
- **where each one physically went** — the track, in coordinates, drawn over the world;
- **close calls, diet, kilometres swum, iterations** — the life's numbers;
- **zoomed out**, the whole line as colour over the world;
- **an offspring or ecology tab**: what share of the population in a given area is yours — "marketshare" per variant per region;
- and out of all that, the story.

What it needs the game to record, and the cost of each: a **track log** per life (sample the position every few seconds and run-length
code it — kilobytes), a **diet tally** (already nearly there: kills go through `kill()`), **close calls** (a hold escaped, a bleed
survived — combat.js knows), and the **ledger's counts for the line's entries by region** (free once §8 is built). None of it is
expensive; all of it must be recorded from the first version or the early runs have no shrine.

The map itself is mostly built: `worldmap.js` (v11.63) already draws the whole world from `sample()` with the bands, hillshade, contours
and the islands' rings, and `test/map.js` renders the same thing headlessly. The shrine is that renderer with tracks and shares over it.

## 10. The far end: sharing a place, not just a creature

The person's sketch, recorded because it changes what the early data should look like: sharing not a creature but **a creature and its
distribution** — where that player brooded it, where it survived, how far they swam, how many iterations — so another player meets that
animal *in the place it earned*, or, for fun, everywhere.

The reason this is not idle: **the world is a function.** `sample(x, z)` is deterministic and the island records are shared, so a
coordinate means the same thing in every save, on every machine. A distribution is therefore portable in a way it would not be in a
world built from a random seed per save. What it would need, none of it soon: a server and an upload format; a spec that still compiles
in a later version (the specs are versioned data, which helps, but part styles move); and the acceptance that any change to `islandH` or
`sample` — which `CLAUDE.md` already guards — invalidates every placement ever shared. Far future, but the early record should keep
coordinates and days in a form that could be exported.

## 11. Open (20 Sep 2026)

1. **What happens to the body you leave** at a switch, in the second after you leave it? It is standing right there — an ordinary animal
   of its kind from that frame on (the shark answer), or does it do something first?
2. **Does the hatch moment need a warning**, or is being there the point (you must have gone back for the clutch — which is a door, and
   probably the right answer)?
3. **May a new founder** in the same slot be another clade? (A hatchling may not — decided.)
4. **How far may a "preset, mutated" founder move** from its preset, and how fast does that loosen over generations (§5)?
5. **Do your own variants recognise each other or you?** Kin behaviour was to be derived from investment; with the brood model it mostly
   matters for the hingeshells. Worth an answer before §8 is built, because it touches `DEFS`.
6. **Drifters** (§3): later, or never?
7. **The budget's constants** — playtest, so: what is the first guess, and does the pass that builds it ship a readout tuner for them?

## 12. Decisions (answered 20 Sep 2026, the person)

1. **Lineage is in**, and `DIRECTION.md`'s "not a lineage across generations" is struck with today's date. Rapid evolution is the
   player's alone, is not meant to be an accurate duration, and needs no in-world justification beyond §7.
2. **The three clade modes** as §3 has them.
3. **No grace**: no living descendant, the save is over.
4. **Drifters**: maybe later.
5. **The brood model** of §4 — lay, keep playing, choose at the hatch, the moment passes, the unclaimed go to nature. **No time skip**
   (20 Sep): a switch is immediate and in place, and the world decides your brood's fate in its own time.
6. **The budget is physics**: the body plan's mass and materials, paid for by eating; the numbers are playtest numbers.
7. **The magic is admitted, not explained**, and marked by the sparkle (§7).
8. **No clade change** for a hatchling.
9. **The shrine** is out-of-world, after the run (§9).
10. **Many presets and a randomiser** at the founder.
11. **Only your own descent** is eligible for a swap — not siblings, not parents; grandchildren yes, and any depth below them. Each life
    must breed for itself, and a switch rebases the tree (§4).

## 13. Build order

Each step is playable and tells the person something; the expensive answers (§8) are forced as late as the loop allows.

1. **The line on the slot, and the track log.** `{spec, born, died, cause, playT, parent, track}`, recorded from the first version,
   because the shrine cannot be retrofitted onto runs that were not logged. A crude shrine page on top of `worldmap.js` to prove it.
2. **Player reproduction, one clade** (the slowblood — the current default start): a real clutch with your spec on it, surviving an
   unload as a record on the line. **The hatch moment and the switch**, with the parent's spec unchanged. The smallest complete loop,
   and it needs no creator work at all.
3. **The descent tree and death's search** — the nodes of §8, the model growing and killing them, and the question "is anything in my
   subtree alive, and where". This is the point at which the sparse-entry work has to be real, and the first version where an unclaimed
   brood can outlive you.
4. **The creator at the hatch**: the parent's spec loaded, the diff priced as materials (§6). Needs the creator's registry pass to have
   landed first, or the bill prices nonsense.
5. **The sparkle** (§7) — small, and it should arrive with the first switch so the tell exists from the beginning.
6. **The other two modes**: the ringmouth's one spawning and scheduled death; the hingeshell's brood and den.
7. **§8.2's derived `DEFS`**, and with it variants as real ledger entries, marketshare, and the shrine's ecology tab.
