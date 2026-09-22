# LINEAGE.md — the line across generations: a full life, the brood it leaves, the mutation, and the magic that is admitted

**Status: §13.1–2 built, minimal (v11.69, 21 Sep 2026): the line on the slot with its track, the finback's clutch (v11.73: paid from the stomach; to then a cooldown for its cost), broods as
records that survive an unload, the handover at death to the nearest living child, the save ended with none, and the sparkle at the handover only.
The player became a spec first (v11.68). Not built: the crude shrine page, §8's sparse entries (a survival knob stands in), the editor at conception,
the other clades' modes. Design otherwise, 20 Sep 2026. The person's answers are in §12 and are folded through the body of this doc.** Written
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
| a **line** | the slot's `deaths[]` plus, new, the specs those animals wore, where each one went, and the brood records of §8 |
| a **life** | one animal: `player`, a `clade`, a spec, injuries (`arms`, `regrow`, `lost`) |
| a **death** | `slotDeath(cause)` — writes `{cause, day, playT}` to the slot, returns to the menu with the cause as its note |
| a **brood** | `layEggs` — a knot on the floor, hatching after `ECO.hatch × mass^¼` days, eaten down by scavengers, counted by the ledger |
| a **variant** | a spec the player made, loosed into the world, competing as an ordinary species (§8) |
| a **body** | a spec (`SPECS[id]`-shaped) → `compile` → the animal, and → `derive` → the numbers |

The line is a short list on the slot: `{spec, born, died, cause, playT, parent, track}`. That is the whole record, and the shrine (§9)
is a read of it.

## 3. The three starts: r and K, and what your death finds waiting

Reproduction is a clade fact, not a game setting (the person, 20 Sep: "that works"). The three modes fall out of the clades as already
written, and — now that a life only ends in a death (§4) — they set two things at once: **how many clutches a life gets to leave**, and **how
well those young do without you**, which together are the odds that your death finds anything alive to continue as.

### Ringmouths — spawn once and die (semelparous, extreme r)
*Amended 21 Sep 2026 (the person): this is the **soft** ringmouth's fate — the octopus. A shelled ringmouth has a skeleton, so the reason below does not
hold for it: the coilshell breeds like the finback (the nautilus, not the octopus). And a semelparous ringmouth ages — it dies of old age at a lifespan
derived from its mass the way every other rate is, so a soft-arm that never spawns still ends; nothing else ages yet. Built v11.74: line.js `BREED`, the mode
read off the body (a shell that floats on the calculator is the nautilus); the brood (no feeding, the wasting by the calculator, guarding as a choice), the
death at the hatch, the age. The person's numbers to tune are the table's.*

The cephalopod fate, honest for a soft fast-growing animal with no skeleton: grow hard, breed once, senesce, die.

- One clutch, many small eggs, at the end of the life. **The spawning and the death are the same event**, so the handover is forced and
  the timing is not yours: you breed and you go. *(v11.74: the event has a length — after the spawning the animal broods, feeding no more and
  weakening, and the death is at the hatch; the handover is to a hatchling at the clutch. Guarding the clutch is a choice with a payoff, not a leash.)*
- Unclaimed young: many, cheap, mostly eaten. A ringmouth variant establishes by numbers or not at all.
- The feeling: a run. You build toward one spawning, and dying before it ends the line outright.
- The person's "adults die deliberately once they lose control" is this, and it needs no cognition system: it is the clade's biology.

### Slowbloods — breed again and again (iteroparous, indifferent)
Iron blood, a skeleton, a long slow life. Several clutches, little invested in each, no interest in the young.

- **Several clutches over a life**, so several separate insurances against a bad day — the clade where breeding is a running decision
  rather than a finale.
- Unclaimed young: the shark answer. The adult does not know them and may eat them. Middling odds.
- The feeling: a career. Death is the loss of everything you grew, if nothing of yours is left alive.

### Hingeshells — brood, and moult (iteroparous, invested, K)
*Built v11.76 (line.js `BREED.hingeshells`, the moult section): few large eggs at a den — the sheltered water or against a solid — again and again,
guarded as the soft-arm's brood is, the parent feeding meanwhile; the moult on the player by the world's `MOULT` clocks (soft, pale, skin to every edge,
prey to the big, the cast left), the hatchling growing through its moults. The person's numbers to tune are the table's and `MOULT.every`.*

Vanadium blood, an exoskeleton, `MOULT` already in the game (soft after a moult, hardening over `MOULT.soft` days × mass^¼).

- Few large eggs, guarded at a den; a brooding parent is pinned to a place and vulnerable.
- **Few clutches, but the young actually survive.** This is the clade whose loosed variants seed the world best, and the only clade
  where staying with the young is honest — and where a death is most likely to find a grown child waiting.
- The feeling: a siege. You choose the den and defend it, and the moult is the recurring danger inside one life.

### Drifters — later (the person, 20 Sep: "maybe later")
Not playable in the first cut. If they come, the alternation of generations (polyp and medusa — *a different animal per generation*) is
the obvious and the strange loop, and it would need its own pass.

## 4. The loop: one full life at a time

**A life ends in a death, always** (the person, 20 Sep, deciding §11.1): you do not step out of a healthy body. You breed, you shape
what you breed, you go on living, and when the animal dies you continue as one of its children — if it left any. *"A full life is a good
place to start for each creature."* Swapping while alive may come later; it is not the first version, and nothing below depends on it.

1. **You breed as you play**, and **the editor opens at conception, not at the hatch**. Mating *is* the trip to the creature editor: the
   egg is fertilised, the genetic future of that animal is fixed at that instant, and that is the only honest moment to be choosing its
   DNA. Whether the thing is sentient or alive yet is a separate question and not this one's.
2. **You may decline.** Opening the editor and changing nothing is a legitimate move — you bred, the generation counter goes up, the
   child is a copy. The editor is the *opportunity* at conception, not a toll on it.
3. **The clutch runs its hatch clock** whether you are there or not, carrying whatever DNA you gave it. What becomes of it is decided the
   way every other species' fate is decided — by the off-screen model, over days, as time passes normally (ecology.js, `ECO_STEP`).
4. **Your children live their own lives in front of you.** They hatch, they grow, some follow you (§5), most die; the ones that last are
   ordinary animals of the world that happen to carry your work. You are not managing them and cannot become them while you live.
5. **You die**, and the game looks for your living children. Find one and you continue as it, **where and as it is** — which may be a
   juvenile at the clutch if you died young, or a grown animal halfway across the world if you died old. Find none and **the save is
   over** (the person: "There is no grace. No clutch, the save is over.")
6. **What you never see again is everything else.** The other children, the den, the body you just lost: outside the line from that
   moment. One child carries it on.

**Your own children, and only them** (the person, 20 Sep — grandchildren struck, misread on the first pass): the eligible set is what
the body you are wearing produced itself. **Not siblings, not parents, not grandchildren.** A child you never claimed will breed out
there and its young are ordinary animals of the world — they carry your work, they are not your line. The rule keeps the whole thing to
one step, which is also what keeps it cheap (§8).

Two things fall out of that, and both are the point:

- **Every life must breed for itself.** "You must produce your own genetic line with each selection." Inheriting a good body buys you
  nothing if you do not use it; a life that never mates is the end of the save whatever the rest of the line achieved.
- **Breeding is insurance, and the premium is real.** With no switch while alive, a clutch is the only thing standing between a bad
  fight and the end of the save — but mating costs the materials the child is built from (§6) and the time you spend getting to it. An
  animal that breeds early is safe and poor; one that breeds late is rich and one mistake from nothing.

The consequence is worth stating plainly, because it is the game: **your survival at death depends on whether the animals you designed
and set loose were good enough to live without you.** That is the simulation grading your creature work, in its own currency, with no
appeal. Nothing else in this project has that property.

**And the loop now has a shape the first draft did not**: each body is a whole life with a beginning, a middle and an end, and the
creator is something you visit *during* a life rather than between them. The generations are episodes, not respawns.

**New open questions this raises (§11): which child you get when several are alive, and what happens if the only thing you leave is a
clutch that has not hatched yet.**

## 5. The animals you do not become — your children, your old bodies, the founders

**Editing is not occupying** (the person, 20 Sep). The editor at conception belongs to the *parent*, so you may shape a child and then
let it go: *"You have a kid, and you mutate them to look a little different and behave a little different — but then decide to let them
be, rather than control them."* Three consequences, and they are what turn this from a respawn mechanic into a game:

- **You can make a set.** Several matings, several children, each edited differently from the same build, none of them occupied. The
  constraint is the budget of §6 and the rule that a child may not vary too far from its parent — so what you get is a *radiation*, not
  a zoo: one body plan pushed a few ways at once, loose in the world, being tested by it.
- **Some of them follow you.** *"If they have the disposition to follow, they can and will — which can look like a follower system."*
  The disposition is a thing you built into them, not a mode you switch on: a child made sociable follows, a child made solitary does
  not, and you find out which you made by watching. That is the honest version of a party, and it is earned at conception.
- **They breed, and their young are ordinary.** Your children's children are not mutated and are not yours (§4). The wildness stops one
  generation down unless you are the one mating.

**Your old body is just an animal.** No kin flag, no special case, no retired-ancestor bookkeeping. The person's framing, which is the
better one: *"Your own self would play the game the way you would if you found your own character naturally generated, or generated
naturally but originating from someone else's game — just out and about, using the game's AI to detect what it did in its life and
based on what the player did. It might ignore you or attack you or something else entirely."* So the body you leave behind runs the
ordinary AI over its own history, and what it does about you is whatever that history says. If you were a hunter, you left a hunter
behind. This is free — it is already what a creature is — and it is a better answer than any kin system would have been.

It also means **a creature that arrives from someone else's game needs nothing special** (§10): it is a spec and a place, driven by the
same AI, indistinguishable in kind from a creature of your own line.

**Presets and founders.** A new game goes into the creator, and there are **many preset bodies and a randomiser** — designing from
nothing is an option, not a toll. Later, the founder may be "a preset, mutated": you start from a known animal and may move only so far
from it, the freedom growing over generations. **A hatchling never changes clade**; whether a *new founder* in the same slot may be
another clade is still open (§11). *Built v11.75 (§12.29): the founder is any existing species of the chosen clade — the roster is the presets,
offered as the creator is gated (what the profile has seen), drifters excluded; the randomiser is later. What is not physics comes down the line from the
founder's `DEFS` row (§8.2's seam: creatures_defs.js `founderDef`).*

## 6. The mutation budget is physics, not points

*Status (21 Sep 2026): the fuel half is built — v11.73, the player's hunger as the ledger's own model on the line kind, and a clutch paid from the
stomach at `LINE.egg` of the child's mass per egg (one rule for every animal, §12.25). The materials half is proposed at the end of this section, not
built. The budget's points (v11.72, `BUDGET`) still price the diff; §6's claim that they should be materials stands as the direction.*

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
- **The budget grows with the generation** (the person, 20 Sep): *"a 20 generation animal will have more budget for more parts and
  complexity and size and cognitive ability. On top of the obvious mass constraint — you have to fuel that stuff."* So there are two
  terms and they pull against each other: **generations buy licence, and the body still has to be paid for.** A deep line may attempt a
  large, complex, clever animal; it will starve if it cannot feed what it built. That is the progression — the generation count is the
  tech tree, and the ecology is the bill — and it is also what makes a twenty-generation line *look* like a twenty-generation line.
- **This is where the giant comes from, eventually.** Size is one of the things generations buy, so the creator has to be able to
  express an animal far past the roster (CREATOR.md, "The size ceiling", 20 Sep) long before the world can host one.
- **The numbers are playtest numbers** (the person: "playtested a lot"). This doc sets no constants; the pass that builds it should put
  them in one table with a comment per key, the usual way, and expect to move them.
- **A lost part is not inherited.** `lost[]` (v11.57) tracks what was torn off; the child is built from the parent's *spec*, not its
  corpse. Lamarck is not on the menu, and it is written here so it is never accidentally built.

### 6b. The materials (proposed 21 Sep 2026 with v11.73, not built — the person decides)

The fuel is built: the stomach pays for the eggs by mass. The other half is *what* was eaten, *where* — `coatFor` and `COAT_CHEM` are the
precedent: a coat's carotenoid exists only if the diet reached the lit shallows, and a hingeshell's plates take the mineral of the water they grew
in (rust, lime, sulfide, manganese; creatures_spec.js `coatClassAt`). The proposal is three stores on the life, in kilograms, credited at every
gulp, kill and carcass bite by what the prey was and where it lived, and debited at conception by what the child's parts are made of:

| store | the source (what the player eats) | credited | what it buys in the child | the finback would have to eat |
|---|---|---|---|---|
| **lime** (calcite) | a hingeshell that grew on the reef or the lit rock (`coatClassAt` lime or rust: scuttle, wedge, sifter, picker) | its plate mass: the exoskeleton's share of `bioMass`, ~0.1 | a coiled shell (`shell` part), plates, valves — the part's volume × `GRAMMAR.shell` 1.6 | a coilshell child's shell is ~0.5 t of lime: ~15 scuttles of the reef (34 kg each), or two pickers |
| **iron** (sulfide) | a hingeshell fed below the chemocline or in the vents' heat (`coatClassAt` sulfide: cinder, the basker's field) | the same plate mass | black iron plates (PLANET: "black iron plates mean feeding in the basker's field"); the `armour` term at a higher density | the same tonnage from cinders — which are poison unless the line is `immune` (v11.56): the door is the poison, as DIRECTION says |
| **pigment** (carotenoid) | a browser of the lit water (`COAT_DIET` browser: grazer, rasp, picker, darter), faded through a hunter (arrow, needle: a quarter) | ~1 g per tonne of browser, the coat's `sat` in the creator's `coat` item | a coat moved toward warmth or saturation (`BUDGET.coat` 0.3 → grams), the chromatophores of a later pass | one grazer for a coat's full range; a vent-line child stays melanin-grey with nothing to eat |

Rules that fall out: the stores are the *life's*, not the line's (each life must eat for its own clutch, as §4 says of breeding); a store
is spent only by the parts that need it, so a line that never builds a shell never needs lime; the lookup is the place the prey lived
(its cached coat class at spawn) — nothing new is sampled; and the numbers are playtest numbers in one table (`MAT`, a comment per key).
Open: whether the ledger's own model should carry the stores for the world's animals (a shelled species starving for lime would be a new
term in `ecoModel`), or whether they are the player's alone — the one admitted wrench (§1). The cost of not building it: a shell is
priced only in points and mass today, and the chemistry the person asked for ("you eat the parts directly") is still the coat's.

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

### 7b. The home of the sparkle (the person, 20 Sep — the far end, and the reason the rest can stay strict)

The sparkle eventually becomes a place to follow. *"The player can follow the 'sparkle' in-game. To 'home' or 'back' or some vague, far
away, mystical place. It would follow on a current, leading you in the direction. Sometimes it would travel like a wisp ball, faster than
any creature could follow, leaving a long trail of particulate behind."* And at the end of it: **an island of creatures that sparkle the
way you do — animals capable of the same rapid, wild mutation.**

This is endgame content and nothing about it is urgent, but it is recorded now because of what it does for everything upstream:

- **It is a box for the fantastical.** The person's reason, in their words: it *"allows me to channel my urges for larger than life
  creatures into a box without compromising the validity of the ecosystem around it."* The home island is where the impossible animals
  are allowed to live, and the price of admission is that they sparkle — the same tell that marks the player, meaning the same thing.
  Everything outside it stays under the 8 Sep rule, unbudged.
- **It grows with the creator.** As the creator's technical limits expand, so do the creatures there; the home is the natural first
  consumer of anything the creator learns to build, and the natural place to put a thing the roster has no room for. That is a real
  development benefit: it means an ambitious creator feature never has to argue with PLANET to justify itself.
- **The guide is a mechanic, not a cutscene.** A wisp on a current, outrunning anything that could follow, with a trail you can read
  after it has gone — that is a *door* in DIRECTION's sense (a current you must be built to ride), and it is the only navigation aid the
  game would have. It wants the same mark and the same emitter as everything else in §7.
- **The one rule it must not break**: the sparkle still means the magic. An animal that sparkles is an animal outside the simulation's
  rules, and the player learns that by meeting the home's inhabitants — which is exactly the lesson the tell was for.

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
- **Descent is carried by broods, not individuals, and only one step** — which is what the children-only rule of §4 buys. The ledger
  counts; it does not know who begat whom, so per-individual parentage is not affordable. It does not have to be: a brood you lay is a
  **record** (`{cell, n, born, spec}`) whose count the model grows and kills like anything else, and eligibility is "one of *my* brood
  records still has `n ≥ 1`" — a walk of a handful of entries. Had grandchildren counted, this would have had to become a tree of nodes
  spawning child nodes; they do not, so it stays a flat list per life. The same records are what the shrine's marketshare (§9) reads.
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

1. *(Answered 21 Sep 2026 — §12.18: the nearest.)* **Which child do you get** when several are alive at your death — your choice from a list, the nearest, the oldest, or the one the
   world has treated best? (A choice is the obvious answer and makes the shrine's map mean more; the nearest is the one that needs no
   interface at all.)
2. *(Answered 21 Sep 2026 — §12.19: it counts; the world runs on to the hatch.)* **What if the only thing you leave is a clutch that has not hatched?** It counts as a living child by §4, but you cannot be a body
   that does not exist yet. Either the world runs on to the hatch — which is not the switch-time skip that was struck, but it is a
   skip — or an unhatched clutch does not count and the save ends. This is the one hole the death-only loop leaves.
3. **May a new founder** in the same slot be another clade? (A hatchling may not — decided.)
4. **How far may a "preset, mutated" founder move** from its preset, and how fast does that loosen over generations (§5)?
5. **How far may a child vary from its parent** (§5's "not allowed to vary too far") — a hard cap on the diff, or just what the budget
   affords? *(v11.72 builds the default — no hard cap, the budget is the cap. Answered for now, 21 Sep 2026 — §12.22: "works fine for now".)*
6. **How is disposition expressed in the creator** (§5's followers)? It is the first thing in the editor that is behaviour rather than
   body, and `DEFS` has no term for it — the same gap as §8.2.
7. **Drifters** (§3): later, or never?
8. **The budget's constants** — playtest, so: what is the first guess, and does the pass that builds it ship a readout tuner for them?

## 12. Decisions (answered 20 Sep 2026, the person)

1. **Lineage is in**, and `DIRECTION.md`'s "not a lineage across generations" is struck with today's date. Rapid evolution is the
   player's alone, is not meant to be an accurate duration, and needs no in-world justification beyond §7.
2. **The three clade modes** as §3 has them.
3. **No grace**: no living descendant, the save is over.
4. **Drifters**: maybe later.
5. **The brood model** of §4 — you breed as you play, the young live their own lives, and the world decides their fate in its own time.
   **No time skip** at a handover, and (20 Sep, second pass) **no handover while alive**: see 16.
6. **The budget is physics**: the body plan's mass and materials, paid for by eating; the numbers are playtest numbers.
7. **The magic is admitted, not explained**, and marked by the sparkle (§7).
8. **No clade change** for a hatchling.
9. **The shrine** is out-of-world, after the run (§9).
10. **Many presets and a randomiser** at the founder.
11. **Only your own children** are eligible for a swap — not siblings, not parents, **not grandchildren** (struck 20 Sep: misread on the
    first pass). Each life must breed for itself.
12. **The editor opens at conception**, not at the hatch: mating is the trip to the creature editor, and declining to change anything is
    a legitimate move (§4).
13. **Editing is not occupying** (§5): you may shape a child and let it go, make several variants from one build, and the ones built
    sociable will follow you. Your old body is an ordinary animal running the ordinary AI over its own history — it may ignore you or
    attack you, and there is no kin system.
14. **The budget grows with the generation** (§6), against the mass and materials the body still has to be fuelled with.
15. **The home of the sparkle** (§7b): an island of creatures that mutate as the player does, reached by following the wisp on a
    current. Endgame, and the box the larger-than-life animals go in so the rest of the world stays strict.
16. **You only take a child when the current body dies** (§4, answering the first pass's open question; the person, 20 Sep: *"a full
    life is a good place to start for each creature"*). There is no hatch moment and no stepping out of a healthy animal. **Swapping
    while alive is left open for later** — it would be an addition to this loop, not a change to it, so nothing built against §4 has to
    be undone if it arrives.
17. **The player breeds alone** (21 Sep 2026) — no mate, for this pass: laying is the parent's act, as the ledger's own clutches are.
18. **At death you continue as the nearest living child** (21 Sep 2026, §11.1) — no list, no interface; distance from where you died.
19. **An unhatched clutch counts as a living child** (21 Sep 2026, §11.2): at death the world runs on to its hatch, and you are one of what hatches
    — if the run-on leaves one alive. Built (v11.69) as every cell out, the clock to the hatch, and the ledger's model catching up the gap.
20. **A child's speed is derived from its body, like any animal's** (21 Sep 2026): "The child's speed should be derived from the animal's body
    map like any other. Not its parent's, but there should just be a universal logic of how fast an animal moves based on its size and mass
    and such." Built v11.71: `derive` is the one calculator for every `DEFS` kind and the player; nothing in the world runs on a lock.
21. **The sparkle at the closed mutation window is in** (21 Sep 2026, on v11.72): "It's in, no worries."
22. **The budget is the only cap on how far a child may move from its parent, for now** (21 Sep 2026, §11.5): "Works fine for now."
23. **The budget's first numbers stand for now** (21 Sep 2026, §11.8): 3 points at generation 2 "seems OK for now, not a huge issue".
24. **You are out of the world while you edit** (21 Sep 2026): "the game should teleport the player out of existence temporarily or make them
    invis/invuln while they edit." Built v11.72.1: hidden, and nothing can see, chase, hold or hurt the parent while the window is open.
25. **The player's hunger is the model every creature runs — one rule, not a special case** (21 Sep 2026: "a universal logic"). Built v11.73:
    `ecoOf` on the player's line kind through the same `hungerTick`, `kill` and `eatAt`; starvation a death like any other; a clutch paid
    from the stomach.
26. **The soft-arm is semelparous** (21 Sep 2026): it may spawn once, grown. After spawning it broods — it stops feeding and weakens — and it dies
    when the clutch hatches, so its handover is at the hatch, to a hatchling at the clutch. Built v11.74 (`BREED.soft`, `once`; the weakening is the
    calculator's own speed off a live spec that is wasting, not a special case; the clutch's losses fall while the parent guards it and rise when it
    strays — a choice with a payoff, not a leash).
27. **A semelparous ringmouth ages** (21 Sep 2026): it dies of old age at a lifespan derived from its mass the way every other rate is (a named
    knob, the person to tune — `BREED.life`, days × mass^¼), so a soft-arm that never spawns still ends. Nothing else ages yet. Built v11.74.
28. **The coilshell breeds like the finback** (21 Sep 2026): the nautilus, not the octopus — §3's reason (soft, no skeleton) is not true of a shelled
    animal. §3 amended; built v11.74 (`BREED.shelled`, read off the body: a shell that floats on the calculator).
29. **The founder is any existing species of the chosen clade** (21 Sep 2026) — the roster is the presets; the randomiser is later. Built v11.75: the
    founder picker on new game (what the profile has seen, as the creator is gated; drifters excluded), the presets' hand numbers retired, the founder's
    `DEFS` row carried down the line until §8.2's derived DEFS replaces it (creatures_defs.js `founderDef`).
30. **Abilities will come from a universal ganglion model** (21 Sep 2026) — a neuron cluster driving a motor cortex that contracts muscles, or
    communicates — and a body will have a long list of things it can do. Not this pass: v11.75 ties each existing ability to the part that makes it
    physically possible (player.js `ABILITIES`) as the stand-in; CREATOR.md keeps the design note.
31. **The player moults, and the moult is not a trip to the editor** (21 Sep 2026): the editor opens at conception only, as for everyone. Built v11.76:
    the world's own `MOULT` rules on the player by the clock, the hatchling growing through its moults.

## 13. Build order

Each step is playable and tells the person something; the expensive answers (§8) are forced as late as the loop allows.

1. **The line on the slot, and the track log.** `{spec, born, died, cause, playT, parent, track}`, recorded from the first version,
   because the shrine cannot be retrofitted onto runs that were not logged. A crude shrine page on top of `worldmap.js` to prove it.
   *(Built v11.69 without the page: line.js, a sample every 5 s of play, run-length coded.)*
2. **Player reproduction, one clade** (the slowblood — the current default start): a real clutch with your spec on it, surviving an
   unload as a record on the line, hatching into ordinary young. **Death continues as one of them**, with the parent's spec unchanged.
   The smallest complete loop, and it needs no creator work at all — the death-only rule makes it smaller than the first draft's.
   *(Built v11.69: `x` lays on the floor, a cooldown for the cost; the brood records of step 3 came with it, with `BROOD_SURVIVE` for the model.)*
3. **The brood records and death's search** — the records of §8, the model growing and killing them, and the question "is a child of
   mine alive, and where". This is the point at which the sparse-entry work has to be real, and the first version where an unclaimed
   brood can outlive you.
4. **The editor at conception**: the parent's spec loaded, the diff priced as materials (§6), declining allowed, the child let go into
   the world. Needs the creator's registry pass to have landed first, or the bill prices nonsense.
   *(The registry pass landed v11.70: a parameter is `paramOf(owner, key, part, frame)` — label, unit, type, bands, default, value — creatures_spec.js.)*
   *(Built v11.72, the finback: `x` opens the lab as the creator on the parent's spec, the clade locked; closing unchanged lays a copy, closing
   changed within the budget lays the child and plays the sparkle, over the budget the lab will not commit. line.js `BUDGET` prices the diff off
   the registry and grows with the generation; the fuel half of §6 was a cooldown by the child's derived mass until the player had hunger.)*
   *(Built v11.73: the player's hunger on the ledger's own model, and the clutch paid from the stomach at `LINE.egg` of the child's mass per egg;
   the cooldown is gone. The materials are §6b, proposed.)*
5. **The sparkle** (§7) — small, and it should arrive with the first handover so the tell exists from the beginning. *(Built v11.69 for the
   handover; v11.72 for the closed mutation window, on the clutch: a screen-space four-point star, `starPath`, with a short trail.)*
6. **The other two modes**: the ringmouth's one spawning and scheduled death; the hingeshell's brood and den. *(The ringmouth half built v11.74: the
   soft-arm's one clutch, the brood — no feeding, the wasting, the guarding — the death at the hatch, and the age; the coilshell as the finback's mode. The
   hingeshell's den built v11.76: the den — the shel field or a solid — the guard on every clutch, the moult on the player and the growth through it.)*
7. **§8.2's derived `DEFS`**, and with it variants as real ledger entries, marketshare, and the shrine's ecology tab.
