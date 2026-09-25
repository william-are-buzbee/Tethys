# COMBAT.md — injury as states, not numbers

**Status: designed and built in full 15 Sep 2026 (passes 1, 2, 4, 3: v11.54–v11.57); §10 passes A–B built v11.91–92 (24 Sep 2026)** (pass 1: the edge and the covering read off the spec, the hold knows what it is on, no capsule past the nose; pass 2: no hit points — the gape, the pin and the placed act, wounds that bleed and slow, paralysis and the sting, autotomy, death ends the slot's animal; pass 4: hunters read blood, the strike's miss rule, injuries in the save, the poison by feeding; pass 3: the wound as a spec edit — a tail torn off, the body re-derived, the stump and the regrowth; the numbers in DESIGN Combat). §7 has what the matrix found; §8 the passes as built. **§10 (24 Sep 2026): the physics pass — A and B built v11.91–92, C–D designed** — the person's report after hours as the finback, the cause of each point in the code, and passes A–D (the wound and the blood; contact and the hold; the edge's work; predator behaviour); it strikes §4's "bleeding never kills", `MISS`, `PIN.t`, the reach sphere and the verdict table. Replaces the hit-point half of v11.31 (DESIGN Combat): the hold, the rope, the struggle by
mass, the blood and the debris stay; `hp`, `dmg`, the bite clock's damage share and the bleed-as-hp-loss go. The person's ask, in
their words: "instead of taking damage from a skewer, you are actually physically skewered, and die"; "instead of taking damage from a
bite, you mostly just die from the bite"; dismemberment; "a realistic and believable combat system that is as scary and freaky as real
combat, while still leaving the art style low poly and the game physics based." Decisions recorded at the end. Read PLANET (the
stalemate rule: no clade has jaws, bone and metabolism together) and CLADES (every mouth is radial) first; this doc follows from them.

## 1. What is real

- **Water is size-structured.** Nearly every aquatic predator is gape-limited: it eats what fits in its mouth, whole, and prey run a
  third to a tenth of the predator's length. Bite force scales with mass to about the two-thirds, so a small animal cannot tear or
  crack a big animal's covering by force. It needs a point, an edge, or time.
- **Taking a piece out of something bigger is derived and rare.** It needs a cutting edge and a body strong enough to thrash and saw:
  a big predator's tool (sharks, orcas). The small exceptions are the parasites: lampreys and hagfish (jawless ring mouths, a sucker
  disc and a rasping tongue, feeding on larger fish that swim off alive), cookiecutter sharks, scale- and fin-eating cichlids and
  piranhas. Nothing evolves to injure what it does not eat; harm without a meal is defence only (spines, venom, ink).
- **Hold is the norm.** Cephalopods hold with arms and kill with a small beak placed at the nerve cord, or drill the shell with the
  radula and take the crab apart at the joints. Morays, crocodiles and sea snakes bite and hold. Strike-and-release is the rarity
  (white sharks on seals, cone snails). Most things that kill prey near their own size do it by hold then one placed act.
- **Most attacks fail.** Success on alert prey is well under half; a fish's escape reflex fires in milliseconds. A landed attack is
  settled in seconds, and where it landed decides it: the nape or the gut kills; the flank is survived, and fish carry appalling
  healed wounds. The survivor is slower and bleeds, and the second predator finds it.
- **Teeth track diet, fast.** Tooth form is not chosen in a life but nearly: cichlid jaws remodel in a few generations, many fish
  swap tooth shape as they grow and change diet. A player picking a mouth is picking a diet; the mouth is its consequence (DIRECTION:
  the body is the tech).
- **Venom is a secretion the body already makes, given a wound to flow into.** It evolved independently more than a hundred times on
  Earth and always that way: saliva into a bite (cephalopods, shrews, many lizards), skin mucus onto a spine (nearly all venomous fish,
  and nearly all of it defensive), a modified radula tooth (cone snails), a cell (cnidarians, once). Venoms are tuned to the prey
  they were evolved on and weaker on other lineages. Poison is different: passive, usually taken from the diet (tetrodotoxin is
  bacterial), and it makes the animal bad to eat rather than good at killing. Marine arthropods evolved almost none of either: water
  washes chemistry away, and they crush. §3b applies this per clade.

## 2. The rule set

**A fight asks three questions, in order.** Each is a comparison of two bodies' builds, read off their specs; there is no number
between the answer and the outcome.

| question | of the attacker | of the defender | the outcome |
|---|---|---|---|
| **gape** — can I swallow it whole? | mouth radius (the mouth part's `R` at the world scale; a slowblood's petals open to it; `WHOLE`/`WHOLE_P` are its stand-ins today) | the hit capsule's radius | yes: it is eaten at the touch, the fight never starts (`combatBite`'s forage branch, generalised) |
| **hold** — can I keep hold of it? | the grip: `jaw`, `arms`, `claws` (compile, unchanged), strength by mass^(2/3) (`GRIP.k`) | its mass, its steering (the struggle as built: `h.load` against `str`) | yes: the held is **pinned** and the third question is asked; no: it tears free at the cost of a wound where the grip was |
| **edge** — does my edge get through its covering? | the mouth or weapon style, below | the covering of the part the grip is on, below | yes: the placed act (the kill by clade, §3); no: the hold ends in a release, or in a swallow if a later gape says so |

**Edges** are the mouth and weapon styles that already exist in `PARTS` (creatures_spec.js). New ones are new styles, not new numbers.

| edge | style | gets through | how |
|---|---|---|---|
| beak | `mouth:beak` (ringmouths) | skin; hide only at a held animal's nape; a shell or plate only at a joint | cuts small pieces from what the arms hold; the kill is one placed bite at the nerve cord |
| rasp | `mouth:rasp` (ringmouths) | skin (latches: the lamprey); shell, given time (drills: the octopus) | feeds on a larger animal that stays alive; no grip today (`compile` gives a rasp none) — it gets a **sucker** grip, weak (`k` low), that the held rarely notices |
| petals, cutting | `mouth:tentacles` with `edge:'cut'` (v11.54; PLANET: "teeth are the variable" as the petals' inner edges) | skin; hide with a thrash | the clamp then the thrash tears a piece out; the kill is a body wall opened |
| petals, holding | `mouth:tentacles` with `edge:'hold'` (the default), `comb:teeth` | nothing (holds, does not cut) | a clamp that ends in a swallow or a release; the comb strains |
| needle | `weapon:spears`, a needle jaw (`mouth:tentacles` with `edge:'point'`) | skin, hide; not plate or shell | a point: the held is **skewered**, the rope of length zero through the capsule; tearing off it costs an open wound; through the core is death |
| plate jaw | `mouth:tentacles` with `edge:'crush'` (the crusher: PLANET gives it plate jaws) | shell, plate, everything under them | crushes: the kill is the covering broken and the body inside taken |
| mouthparts | `mouth:plates` (every hingeshell) | skin; a joint of a plate | shreds what the claws hold; dismembers at the joints |
| claws | `weapon:claws`, `fold`, `whips` | skin; a joint of a plate | the hard grip: holds what is slower, dismembers at the joints |
| ram | `weapon:ram` | nothing — a blow | the stun, as built (v11.53), and a push; the great's |
| rake, peck | `comb:rake`, `mouth:peck` | nothing living | grazing and carrion; no offence, no grip |

**Coverings** are the parts the grip lands on, read off the held body's spec at the hold point (`h.lb` is already in the held's frame;
the part whose extent contains it is the covering).

| covering | which bodies | beaten by |
|---|---|---|
| skin | ringmouths everywhere; a slowblood's fins; a hingeshell's joints and underside | any edge but rake and peck |
| hide | a slowblood's trunk (a lathe with `armour` 0) | cutting petals with a thrash, a needle, a beak only at the nape once pinned |
| plate | `plates:rows` (armour 0.25), `tailplate`, a `shield` core | plate jaw; claws and beak only at a joint |
| shell | `shell:coil`, `shell:cone`, `valves` (armour 0.1–0.4; a chambered shell implodes below −450 regardless) | plate jaw; a rasp with time; nothing else — and a withdrawn coilshell offers nothing but shell |

**Wounds are edits to the spec.** A lost part is removed from the creature's live spec and `derive` runs again: the body is slower,
turns worse, sinks or floats differently because it is missing the thing that did that. This is what makes locational damage free —
the parts list already is the location list — and it is DIRECTION's rule run backwards. The kinds:

| state | what it is in the build | what it does |
|---|---|---|
| **pinned** | a hold whose struggle the held lost (`h.pull` never reached 1 in `PIN_T` seconds with the grip at the head or the core) | the placed act follows; the AI's target keeps it |
| **skewered** | a hold with `len` 0 and the grip inside the capsule | carried; tearing free costs an open wound at the point; the core: death |
| **open wound** | a part marked `torn` at a local point (`woundL`, as built) | bleeds a trail (§4) for `BLEED_T[clade]` seconds, then closes; the part's `thrust`/`turn` contribution halved while open |
| **lost part** | the part removed from the live spec; a rig truncated (`makeChain` at the cut), a merged part hidden by its extent (a per-creature geometry: `KIND_GEO` is shared, so a variant is built, as the rule says) | re-derived; a scrap and a burst of the clade's blood (fx.js scraps, combat.js blood, both built); regrows by the clock or never (§3) |
| **opened** | a cutting edge through the trunk's covering | death; the carcass as built |
| **swallowed** | gape won | death; for the player a second of dark then the menu |
| **stunned** | as built (the ram, the finback's blow) | as built |

No `hp`, no `dmg`, no `maxhp`, no regeneration by seconds. `derive.hp` goes; `DEFS.hp` survives only as the immortal flag (`1e9`) until
the last immortals (the veil, the great, the drifters, the watcher) are given coverings that nothing on the roster gets through, which
is the believable form of the same thing. The hunters' "flee at 35% hp" becomes "flee having lost a part".

## 3. Each clade's fight, and its escape

**Slowbloods (jaws and bone, no metabolism): engulf, clamp and thrash, crush.** A jaw is a grip, so hold and bite are the same act
and the fight has one stage. Most of a slowblood's meals are gape: sit or drift, then the prey is inside. Prey too big to swallow is
clamped, and then the body does the work — the thrash (a shark's head-shake, a moray's knot) — which needs cutting petals to become a
piece torn out; without the edge the clamp ends in a release (`HOLD_BIG` as built). The crusher's plate jaw is the third way and the
only thing on the roster that opens a shell. A slowblood never grapples with the body: nothing to hold with but the mouth, so prey it
cannot close its mouth on cannot be fought at all. A lost fin never regrows; the animal is crippled for good and is the next hunter's.
*The finback player:* grab and bite are one control (the clamp); the thrash is the bite while holding (`playerBite`'s `tear`, kept);
a cutting edge is a mouth choice for later (the creator). Its escape is the sprint and the blow (the ability, as built).

**Ringmouths (metabolism and brain, a beak, no bone): hold, then a placed bite.** The arms fight, the beak does none of it. Gape never
limits a ringmouth: it eats things its own size, in pieces, if it can hold them. The kill is not damage: once the prey's head is pinned
the beak goes in at the nerve cord, once. So the mass struggle is the whole fight — a ringmouth that cannot pin the head never gets its
bite, and prey heavier than it swims off with the arms attached. The rasp branch is the lamprey: latch, feed on a bigger animal that
stays alive, let go (the rasp is the only ringmouth with a visible mouth, and this is its mouth). Their cost is being soft: anything
with an edge takes an arm. An arm is survivable and regrows — cephalopods drop arms and regrow them in weeks; here `REGROW_D` game days —
which is why **autotomy** is the ringmouths' escape: a held arm is dropped and the hold goes with it. *The soft-arm player:* grab is
the arms (built), the bite is the beak's placed bite once the hold has pinned (a new condition on `playerBite`, no longer a wound);
dropping the held arm is the escape (Open 1: whether it replaces the ink or joins it). *The coilshell player:* the withdraw beats every
edge but the crusher's plate jaw and, given time, a rasp; its arms are short and its grip weak (`PLAYER_GRIP.coil` 0.6, kept).

**Hingeshells (armour, no jaws, no bone): hold hard, dismember, or strike.** They swallow nothing; the mouthparts shred, so every meal is
dismembered. The claws are the grip, rigid and slow, so they hold what is slower than they are: shells, sessile things, carrion, the
wounded. The two real strikes live here — the mantis shrimp's latch-spring blow and the sea scorpion's raptorial snap from the floor —
one shot then a hold (the `strike` tell/dur as built is the shape of it). Under 28% oxygen they are big. Their edge is the armour: a
slowblood's clamp does nothing to a plate, a beak gets in only at a joint, so only the crusher and another hingeshell eat one. A lost
limb regrows at the next moult (`MOULT_D` game days; no moulting is built — PLANET Hooks). The roster's slow tanks: nearly unkillable
by most, unable to catch most. No hingeshell player yet.

**Drifters:** sting what touches them, as built; no grip, no gape; the one clade with venom from the start.

### 3b. Chemistry — one per clade, none alike (the person, 15 Sep 2026: "it goes in the docs")

The question for each clade is not which venom but what it already secretes and what wound it already makes. Answered that way the
three come out different in kind.

| clade | it already has | what selection does with it | the result |
|---|---|---|---|
| ringmouths | a beak that opens a wound in held prey; strong digestive secretions, because they eat in pieces | a soft animal loses arms while prey struggles, so anything in the saliva that quiets the prey is selected. The rasp branch has the same gland and the opposite problem: it wants the wound to keep flowing | **venom, offensive, by the beak after the hold**: paralysis in the hunters, an anticoagulant in the rasp. Costs metabolism, so the deep low-metabolism line (pall, veil) never has it. Only once the edge is through |
| slowbloods | fin spines (`spines:row` in the kit), a mucus skin, no way to outrun a holder | Earth's fish evolved venom some eighteen times, nearly all defensive, on spines, from the skin: a slow animal is selected to be a bad thing to hold | **venom, defensive only, on the spines**: a holder that clamps a spined slowblood lets go and is slowed. Nothing per use, which suits a clade with no metabolism to spend. Never offensive; the hunters kill by gape and thrash |
| hingeshells | armour, a shredding mouth, a diet of sessile things and carrion, and the seep line where the sulfur symbionts live | marine arthropods do not evolve venom; armoured slow grazers evolve being poisonous to eat, with the toxin from the diet | **poison, passive, sequestered from what it ate**: a hingeshell that has fed on the sulfur line sickens whatever eats it or its carcass. It follows the animal's feeding, not its species: poison by place, the no-biomes rule for free |
| drifters | stinging cells | a cell-level invention, once | venom by touch, as built |

**Against what it was evolved on.** A ringmouth paralytic works on the nerves it hunts, slowblood and ringmouth, and does little to a
hingeshell (sealed under plate anyway). A slowblood's spine venom is against what holds slowbloods: arms and mouths. Poison hits
whatever eats it, being unaimed. So the chemistries are a matrix (`VENOM`: species → kind, against which clades, for how long), not
three damage types.

**Each is one state over the same machinery.** *Paralysed:* the held body's steering is off for the venom's seconds, so the hold is a
pin regardless of mass — which is why a coilshell with short arms and a weak grip can kill at all: hold weakly, bite once, wait.
*Stung:* the hold breaks, the holder is on a cooldown and slowed. *Poisoned:* the meal is lost and the eater is slow for a while.
*Bleeding that will not stop:* the rasp's anticoagulant holds the open wound open past the clade's clotting; it is the trail (§4).
A creature carries `fed` (where it last ate, from the ledger's envelope) for the poison; nothing else is new state.

**On the roster:** the lurker and the coilshell venomous; the soft-arm by growth stage (DIRECTION); the basker and the grazer spined;
the comb and the scuttle poisonous when they have fed at the seeps (which makes the abyssal's taste for combs a question: adapted, or
sick); the arrow, ortho and great clean — size and speed already do their killing.

**Regrowth, by the clock (game days, `REGROW`):** a ringmouth arm `REGROW_D`; a hingeshell limb at the moult; a slowblood fin never;
nothing regrows a mantle, a head or a trunk. Regrowth is the part put back into the live spec at a fraction of its scale, growing.

## 4. Blood, the trail, the second predator

Blood is built (combat.js: the pooled cloud in the clade's colour). Two changes: an open wound bleeds by the clade's clotting
(`BLEED_T`: ringmouths clot fast, slowbloods slow, hingeshells barely bleed) and stops on its own — bleeding never kills by itself (*struck 24 Sep 2026, §10.6: blood is a volume, and bleeding out kills*); and
**hunters read the blood**: a hungry hunter (creatures_ai.js hunger, built) within `SMELL_R` of a bleeding body takes it as a target
past its `detect`, so a wounded animal, or a wounded player, is found. That is the consequence that makes the graze frightening without
a number: the flank bite you survived is what brings the ridge.

## 5. The player

- **The tell before the bite must be legible, and the escape real.** Predators must mostly miss: the strike's tell (built) is the
  warning; the first half second is the player's — the jet, the withdraw, the ink or the dropped arm, the sprint — and a miss costs the
  hunter its cooldown (built). `MISS` in the hunter's strike: the strike lands only if the prey has not moved more than its own length
  across the strike's line since the tell, which is the escape reflex as a rule.
- **No health bar.** The body shows the damage: a missing arm on the rig, the blood trail, the slower turn. The hurt flash and the
  camera nudge (built) stay. The HUD shows nothing new.
- **Death** is the swallow, the opened trunk, the skewer through the core, or losing what the clade cannot lose. The finback's death
  is mostly the ridge's mouth from inside. `die()` as built (the fade, the respawn) until Open 2 is decided.
- **Injuries persist across saves** (save.js: the live spec's edits and their regrowth clocks in the save record; the record already
  carries `hp`, which goes). A missing arm regrows across sessions by the game clock; a lost fin is in the save forever.

## 6. What goes, what stays

| goes | stays |
|---|---|
| `hp`, `maxhp`, `dmg`, `DERIVE_K.hp`, `derive.hp`; `GRIP.first/bite/bleed`; `wound()`'s hp arithmetic; `hurtPlayer`'s hp; `HUNT_REGEN`; the 8-second heal; flee at 35% | the hold as a rope; the struggle by mass; `HOLD_DRAG`, `close`, `slow`, `shake`; `HOLD_BIG`; `WHOLE` as the gape's first form; the blood cloud; `hitFx`, the scraps, the flinch and the flush; the grab and the bite as two controls; the withdraw, the ink, the blow; the strike tell; the carcass and the ledger's `kill()` |

Where the numbers will be: `EDGE` (edge → coverings beaten, and whether a thrash is needed), `COVER` (part kind/style → covering),
`PIN_T`, `BLEED_T`, `REGROW`, `SMELL_R`, `MISS`, `VENOM` (§3b). A table each, a comment per key, as the conventions say.

## 7. What the matrix says (v11.54, `test/combat.js` §12)

Every hunter placed at contact behind each of its prey, the player as all three clades: the covering under the hold, the edge's verdict, the
gape by geometry. Findings, for the person:

- **The ram** has no route through anything: a blow, by design (the stun). *v11.66: the blow is built (combat.js `RAM`) — a strike on what its
  mouth cannot take whole stuns the body and takes no hold; it hunts the swarms and never the player.*
- **The hood, the lash and the ram** hunt the grazer and the finback and their claws get through neither's hide: the hingeshell hunters of
  slowbloods have no kill in the kit. Either a lathe gets joints (the fins' roots as skin) or the person says they hold and never kill.
  *Answered v11.66 by prey they can open: the forage, the ringmouths' skin, and any hingeshell at its moult (the soft state is skin to every
  edge — creatures_ai.js `MOULT`); the slowbloods are off their lists. The lathe's joints stay for the slowblood pass to decide.*
- **The abyssal's comb** (PLANET) is shell to a cutting edge: no route. Adapted (a crush), or the comb is not its meal. v11.56 made it immune
  to the comb's poison; the edge question stands.
- **The stone's petals are `hold`**: a trap eats by gape alone, which is what an anglerfish does; its gape (0.80) is wider than the player.
- **The gape by geometry against the player's body** (soft 0.57, fin 0.53, coil 0.80): ridge 0.68, basker 0.74, stone 0.80, crusher 0.80,
  abyssal 1.35. Under the gape rule the soft-arm and the finback are swallowed by all five, the coilshell by the abyssal alone. That is §3's
  finback death; today's "the player is never swallowed" falls in pass 2.
- **The finback's tail capsule reads hide**: the kept hit lists have no owner part; a fin is skin. Pass 3 gave the tail its part (v11.57).

## 8. The passes

1. **The edge and the covering** — built v11.54 (above).
2. **The states** — built v11.55: hp out of the loop; pinned by `PIN` (2.5 s by the mass ratio), the placed act by the edge's verdict (swallowed,
   opened, skewered, crushed, the nerve cord, dismembered; the lost part itself is pass 3); the hunters' flee rule as a count of the player's
   bites until pass 3; paralysis and the sting (§3b; the poison is pass 4); autotomy automatic; the slot's animal ends at death. Two rules
   the build added: the sting puts off only a holder under `STING.mass` 4 × the spined body's mass (a ridge swallows a grazer's spines), and
   past 95 m a fight resolves on the pin clock alone.
3. **The wound as a spec edit** — built v11.57: the live spec per creature, derive rerun (`speedK`, `turnK`), a hold on a part's own capsule
   takes the part (the tail; `own: 'tail'` on the slowbloods' hit lists), the stump and the arm growing back segment by segment, the lost
   parts in the save. Not built: a variant geometry for merged parts (no losable part is merged — the tail is its own mesh) and the far
   bake without the part (shared per kind).
4. **The consequence** — built v11.56: hunters read blood (`SMELL_R` 90 m); the strike's miss rule as a commit with the mouth open 0.25 s
   before the bite and a dodge across the strike's line (`MISS.k` 0.8 of the prey's width, set by five trials each way); injuries in the
   save; the hingeshells' poison by where they fed (below the chemocline, in the vents' heat), the abyssal immune to its combs (§7's answer:
   adapted).

## 9. Open — the person's

1. **Autotomy as the soft-arm's escape:** does dropping the held arm replace the ink (`Q`) or join it (the ink stays the ability, the
   drop is automatic when a hold pins an arm)? The realistic form is the second: the animal does not choose.
   **Answered 15 Sep 2026: automatic.** A pinned arm drops when the struggle is lost, the hold goes with it, the ink stays the ability.
2. **Death per slot:** the respawn as built, or the slot ends (a new animal in the same world, the ledger kept)? DIRECTION's growth
   stages make the second heavier and truer.
   **Answered 15 Sep 2026: the slot ends.** The animal is dead; the world and its ledger are kept, a new animal starts in the slot.
3. **Cutting petals for the finback:** born with them (the finback is the roster's fast hunter) or a creator choice later? The roster's
   slowblood hunters (ridge, eel, abyssal) get them either way.
   **Answered 15 Sep 2026: later, by the creator.** The default slowblood swallows; blades on the petals are derived, in the lineages that
   take prey past their gape (ridge, abyssal, basker; the eel's knot is its thrash). A 3.5 m swimmer has a diet that fits whole; it earns
   the edge when it is big enough to take pieces from a grazer. Until then its answer to the ridge is the sprint and the blow.
   *24 Sep 2026: widened — the edge is the clade's, a real thing in the lines that have it, not a default (§10.9, 2).*
4. **The rasp as a player path** (latch on a basker and feed): a fourth playable, or the rasp's own thing? Not now, but it decides
   whether the sucker grip gets a player branch.
5. **How much the hunters miss:** `MISS` at the escape-reflex rule, or looser for the first hours of a slot?
   *Falls 24 Sep 2026 (§10.3): the miss is the geometry of a committed lunge and the turning radius.*

Answered 15 Sep 2026: the chemistry per clade (§3b) — ringmouth venom by the beak, slowblood venom on the spines, hingeshell poison from the seep diet, the drifters' cells; and the roster it lands on.

## 10. The physics pass (24 Sep 2026; passes A–C built v11.91–93, D designed)

The person, after hours as the finback being bitten on purpose (24 Sep 2026), separating what is the AI from what is the fight's
physics. What each point is in the code:

| # | the person | the cause |
|---|---|---|
| 1 | the slowbloods' "pointy beak": the mouth tentacles point at you, turn and clip through the animal's own face, catch you from odd angles; you cannot swerve close to one; worst on the big ones | the petals are a chain rig (creatures_builders.js `mouthArms`) closed to a point at rest — PLANET's look (v11.8.8), which stays. With `c.grab` set inside `armReach` × 1.3, physics.js `stepRigs` draws every tip to the prey's *centre*, so stiff roots on a ring swing sideways through the head when the prey is off the axis. And a bite is not a touch: it lands when the centres are within `reachOf` (the DEFS reach, floored by the two bodies' contact + `BITE_M`) — a sphere round the hunter, 6.8 m on the ridge, with no test that the mouth is what arrived |
| 2 | every part swappable and every fight physical and ecological; no game logic | the verdicts are tables and thresholds: `EDGE` (edge × covering → yes, no, nape, joint, thrash, time), the gape for slowbloods only, `WHOLE` for the beaks, `HOLD_BIG`, `PIN.t` by the mass ratio, `FLEE` by a count of bites, `MISS` by a width |
| 3 | blood gushes when no damage is done | `startHold` wounds on every clamp and the hold on every bite (`GRIP.first`, `GRIP.bite` × `dmg` — the numbers §6 struck and the code kept for the blood's size), and `wound()` always bursts and starts the clock, whatever `h.thru` said |
| 4 | a mouth too small to swallow can do nothing; in nature animals bite, tear, pull, or break one part to be sure | only `cut` (with a thrash), `point`, `crush`, the beak at the nape and claws at a joint get through anything, and the size of what they take is never asked; the default petals (`hold`) kill by the gape alone |
| 5 | the ortho runs at you, then orbits you on impact, mouth pointed, until the momentum settles and the point rests on your face; "not what murder looks like" | before contact `seek` steers at where the prey is now at chase speed — pure pursuit with a limited turn circles its target, the textbook result. After, the hold is a rope from the grip to the *nearest* point of the held with nothing on either body's orientation, `resolveBodies` pushing the two apart while the holder's steering still seeks. No momentum changes hands at the strike |
| 6 | blood is not relative to the injury; half a tail bleeds moderately | bleeding is a clock (`BLEED_T`, 14 s on a slowblood), the same for a graze and a lost tail; the burst is 4 + dmg × 0.4 points, 14 for a lost part |
| 7 | you should bleed out; the tail went and you lived, because the tail fed the hunter and it left | §4, "bleeding never kills by itself"; `actOn` on a lost part releases the hold, `dropTarget(a, LOSE.cool)`, and takes `LOSE.meal` 0.15 off the hunter's hunger — a fixed piece whatever the part was |
| 8 | dying should be a murder: know you are done and watch it come | behaviour: pass D (§10.8) |

Found on the way: two masses, neither in kilograms. Contact and the struggle use `bodyMass`, size³ (the finback 5.8, the ridge 729);
derive's `mass` is the build's volume × density at the spec's own scale and not comparable across kinds (the eel 2.65, the lurker 28.2).
Every force below wants one mass.

### 10.1 What nature does (added to §1)

- **Capture and kill are separate acts.** Approach, strike, subdue, kill, eat. Most attempts fail at the strike; most injuries to the
  predator happen while it subdues. Weapons divide by the stage: arms, claws and jaws capture; an edge kills; the gape or the edge eats.
- **Ram and suction.** A moving head pushes a bow wave that shoves small prey away, so an aquatic engulfer sucks (reaching about one
  mouth-width, in milliseconds) or grabs first. The bite follows the capture; a mouth that arrives without contact takes nothing.
- **The gape limits the engulfers only.** §1 stands for them. An edge frees an animal of it: sharks saw with the teeth and shake,
  morays knot for leverage, cookiecutters twist a plug out of something a hundred times their size, crocodiles roll, squid hold and
  cut pieces with the beak, crabs take prey apart at the joints.
- **The body is the weapon; the mouth is where it lands.** A shake uses the whole length as a lever, a roll is torque along the body,
  a lunge is mass × speed. The mouth applies it.
- **A wound is geometry.** A bite takes out about the volume of its mouth, and what it hits decides it: through a limb's root, the limb
  is gone; to the nerve cord or the heart, dead; the flank, a wound that bleeds by its size.
- **Blood is a volume.** It is lost at a rate set by the wound's size and the pressure; clotting closes small wounds in seconds and does
  nothing for a torn-off limb (autotomy is the exception: the arm drops at a place built to close). Loss past about 15% weakens, past
  30% collapses, past 40% kills — the hemorrhage classes, the same shape in fish and cephalopods.
- **Prey escape by turning.** Turning radius grows with length; a big predator is faster in a line and wider in a turn, and the prey's
  answer is the fast start at the last moment. The miss is geometry.
- **Subdued means exhausted or hurt.** A held animal fights in bursts its metabolism pays for, and the struggle fades. Here that is the
  stalemate rule showing: slowbloods, with no metabolism, fight hard for seconds; ringmouths for longer; hingeshells barely struggle
  and barely need to.
- **Predators avoid injury and follow the wounded.** They let go of dangerous prey, bite and wait on a big one, track a bleeding one,
  and do not quit a crippled meal for one mouthful.

### 10.2 One mass

Kilograms: derive's volume at the world scale × the clade's density × 1000. Contact, the struggle, the impulse, the blood's volume and
the bite's force read it, and `bodyMass` (size³) goes as the physical mass. A lathe and a chain of one size stop weighing the same (the
eel is lighter than the grazer, which is true). `bioMass` stays the ledger's (the allometry, the flesh, the food): a piece feeds its share
of the body's mass × the body's food, so the census does not move.

### 10.3 The strike: contact, not reach

- **The mouth is a sphere** at the mouth part (the frame's nose), its radius the gape, in a forward cone the petals' joint limit sets
  (`cosMax` 0.85, about 32°). A bite lands when that sphere touches one of the prey's hit capsules, and the capsule it touches is where
  the bite is (`h.ci`: the covering, the part, §10.5). A jaw's DEFS `reach`, `reachOf`, `BITE_M` and CLAUDE.md's rule that reach exceed
  contact go. Reach stays where a part reaches: arms (the rig's length), claws, spears, whips (derive's `reach`).
- **Suction.** Petals with no edge (`hold`; PLANET: "none (suction)") draw a body under the gape within one gape-width ahead into the
  mouth over the strike's last 0.15 s. The only reach an engulfer has.
- **The approach is an intercept; the strike a commitment.** The chase aims where the prey will be (its velocity × the time to close,
  capped), not where it is. In strike range (what its burst covers in half a second) the hunter commits: the heading locks on the
  intercept point, it bursts (derive's `burst`), and its steering in the lunge is its turn rate × 0.3. Contact in the lunge is the bite.
  None is a miss: it coasts past on its momentum and comes round on its own turning radius (speed ÷ turn: the ridge 7.7 m at 9.5 m/s, the
  finback 2 m at 6). `MISS` goes. The tell stays — the mouth opening, the cock — because it is what you read.
- **The impact is momentum.** At contact the two bodies' velocities along the strike share by mass (inelastic: the jaws close on it),
  so a ridge carries a finback off at nearly its own speed. A strike that takes no hold (the ram's blow, claws off plate) is the same push,
  elastic, and stuns by the impulse over the struck mass (`RAM.stun` from a Δv, not a flat 2.5 s).
- **Arms and claws are the same rule with their own geometry**: the tips touching the prey is the grab (a ringmouth takes hold at arm's
  length and reels in, as built); a claw closing on a capsule is its grip.
- **The petals follow the contact.** `c.grab` draws the tips to the struck point on the prey's surface, not its centre, and only while
  that point is inside the cone; outside it they keep their pose and the head has to turn. They bloom on the strike (as built) and close
  on the bite; no tip passes behind its root. The point at rest is PLANET's look and stays; it reaches nothing.

### 10.4 The hold: a joint, not a rope

- **Welded at the struck point.** The point on the prey's capsule is fixed to the mouth from the first frame: no rope closing, no
  re-anchoring to the nearest point, and no body push between the holder's head and the held while it stands.
- **The pair moves as one.** The joint shares momentum exactly (`HOLD_DRAG` and `close` go); the heavier drags. The holder steers its
  own body at its turn rate × m_holder ÷ (m_holder + m_held); the held hangs from the joint and trails the way the pair moves, swinging by
  its own thrust. The struggle is a body thrashing in the jaws, not a body sliding round a sphere.
- **The holder does what its build does**, not the chase (it has the prey):
  - a cutting edge **shakes** — the head yawed ±25° at its tail-beat rate; the prey's inertia is the anvil and the edge saws (§10.5);
  - a chain body **rolls** — the eel spins on its long axis or knots its tail round to brace; the same shear;
  - a plain jaw **clamps and waits** — until the held is subdued, then swallows it if the gape takes it, else lets go;
  - arms **reel in** — the held is drawn to the beak, which goes for the nape once it is subdued (§3, as built);
  - claws **pull** — the hingeshell backs off holding a limb, the limb tears at its root when the pull passes the root's strength
    (§10.5), and the mouthparts shred.
- **Subdued** replaces `PIN.t`: the held is subdued when its struggle has stayed under the grip's strength for a second. The struggle is
  its thrust × its blood loss (§10.6) × its stamina, a clock that drains while it struggles and fills at rest (`STAMINA`: slowbloods
  full for ~6 s, then falling to a third; ringmouths ~12 s; hingeshells weak but for ~40 s; the player by its clade). A paralysed body is
  subdued at once (the venom, as built). The stamina is the struggle's only; the sprint is untouched.
- **A swallow takes time**: 1 + 4 × (the held's length ÷ the swallower's) seconds (the ridge on the finback, 2.6 s), the held in the mouth
  with the grip doubled. A spined body stings the swallower (as built); one that tears free mid-swallow keeps the wound where it was held.
  The swallowed death is seen coming.

### 10.5 The wound: the size of the bite against the size of the part

Every edge has a **bite radius** ρ, the size of what it takes out, read off its part, and a **force**:

| edge | ρ, the piece | force | what it is |
|---|---|---|---|
| cut (petals) | 0.8 × the gape | the jaw's | a crescent the size of the mouth: a shark's bite |
| point (needle jaw, spears) | depth: the needle's or spear's length; width nil | the jaw's, or the strike's impulse | a puncture; a skewer holds |
| crush (plate jaw) | the gape | 2 × the jaw's | a covering broken whole; the soft body under it pulped |
| beak | the beak's R | the beak's, with the arms' pull | small pieces; the nape |
| claws, fold, whips | half the claw's span | the claw's: the strongest per mass | a pinch at a point; a pull at a joint |
| shred (the hingeshells' plates) | the mouthparts' size | small | slow pieces from what the claws hold |
| rasp | the disc's R, growing while latched | — | the lamprey's wound |
| hold (plain petals) | 0 | the jaw's | grips, takes nothing, swallows |
| ram | 0 | the impulse | a blow |

- **The force** is F = K × M^(2/3) (muscle by its cross-section, §1), K by the edge and the clade's lever: bone jaws, a beak on a muscular
  buccal mass, a claw's lever (on Earth a 4 kg coconut crab closes at ~3.3 kN, a 3 t white shark at ~18 kN).
- **Through** when F × σ ≥ τ × r: σ the edge's sharpness (point ≫ beak ≈ cut > claws > shred), τ the covering's toughness, r the struck
  capsule's radius (a covering's thickness scales with its body). A crush is tested against τ × r² instead: a shell breaks whole or not
  at all. Not through is a bruise — no wound, no blood — and the hold still holds (a grip is closure and friction, not a cut). A cutting
  edge not through a hide gets there by the shake: each cycle multiplies σ by 1.5, to 3×. K, σ and τ are set so the verdicts §7 agreed
  come out (the ridge through the finback's hide with a shake, the crusher through the coil, nothing through the plough's shell but the
  crusher), in a table with the Earth numbers in its comments.
- **What it did** is geometry at the struck capsule of radius r:
  - a **limb** (a part with its own capsule, `hitOwn`: the tail, a fin, an arm): ρ ≥ 0.7 r at its root **severs** it (a cut or a crush;
    claws pulling past the root's strength the same); less is a wound on the part;
  - the **trunk or the head**: the vitals are the axis — the nerve cord and the heart, 0.75 r deep along the core's front 60%, and 0.3 r at
    the nape (just behind the head, dorsal, where the cord runs shallow: why a beak kills there, §3). ρ past that depth where it bit
    **kills** (opened, the nerve cord, crushed); less is a **wound** of area ~ρ²;
  - a **point**: its depth against the same vitals along its line. Through the core kills; through the flank is a puncture that bleeds
    little and holds.
- **A piece is food**: a severed part or a bite's volume feeds its share of the body's mass × the body's food (a finback's tail is about a
  fifth of it: to a ridge a snack, to an eel half a meal). `LOSE.meal` and `AUTOTOMY.meal` go. A hunter eats the piece where it fell and,
  still hungry, the rest is the crippled animal (pass D).

Worked on today's bodies (world scale, the matrix's radii):

| hunter (edge, ρ) | on the finback (trunk r 0.53, tail r 0.25) |
|---|---|
| ridge (cut, 0.54) | any trunk bite passes the vitals — dead (or swallowed: its gape, 0.68, takes 0.53 whole); a tail bite severs it. From behind, the tail; broadside or head-on, the end |
| basker (cut, 0.59) | the same |
| eel (cut, 0.22) | a flank bite is a wound (0.42 r, short of the vitals); the nape kills (past 0.3 r); the tail is severed |
| ortho (beak, 0.20) | a flank wound; the nape kills — "bitten at the nerve cord", as built |
| the soft-arm (beak, 0.18) on a grazer (r 0.93) | a wound of 0.19 r and never the nape (0.28 m deep): it can bleed a grazer, not kill one; an arrow it kills at the nape |
| the finback (hold, 0) | through nothing: it eats what its gape takes (0.26 with the stretch: the arrow, the needle, the scuttle) |

The crippling bite is the eel's, and anything's from behind; the ridge's is death unless it lands on the tail.

### 10.6 Blood: a volume, a rate, a clot

- **Volume**, a share of the body's mass by clade (`BLOOD`): slowbloods 4% (iron, closed, low pressure: the metabolism they lack),
  ringmouths 6% (copper, closed, high pressure), hingeshells 20% (vanadium, open, barely driven), drifters none to speak of.
- **A wound's rate**, as a share of the volume a second: q₀ = k × a, with a = (ρ ÷ r_trunk)² × the part's vessels (trunk 1, head 1.2, a
  tail's or fin's root 1.5, an arm 0.6, a fin's web 0.2) × the clade's pressure (ringmouths 1.3, slowbloods 1, hingeshells 0.3). Wounds add.
- **The clot**: each wound's rate decays with τ = `BLEED_T` × (1 + a ÷ 0.25) — the clade's clotting time, kept (ringmouths 6 s, slowbloods
  14, hingeshells 3), stretched by the wound's size. A graze stops in seconds; a torn-off tail runs on. Autotomy closes: a dropped arm
  bleeds as a graze.
- **The loss** L (0..1 of the volume) does the rest, in one factor in `slowOf` beside the live spec's: under 0.15 the trail and nothing
  else; 0.15–0.30 weak, thrust, turn and grip falling to half; 0.30–0.40 collapse, no burst, no struggle, a body denser than water
  sinking; **0.40 dead, "bled out"** — a carcass like any kill, and the slot's animal (§9 Open 2). Blood comes back fed over game days
  (ringmouths 1, hingeshells 2, slowbloods 4). The save carries L and each open wound.
- **Worked** (k 0.05/s), the finback: the eel's flank bite, a 0.17 → 0.0086/s, τ 24 s, 20% lost: weak, and alive if it gets away. Two such
  bites are 40%: dead. The tail severed, a 0.33 → 0.017/s, τ 33 s: 40% at about 45 s. That is the crippled death — the trail pouring for
  most of a minute, with the hunter free to come back for the rest. The soft-arm's beak on the flank is 12%: a trail. The eel's bite on the
  soft-arm, a ringmouth, clots at 10%.
- **The look follows the rate**: the burst at the wound ∝ q₀ (none when nothing went through), the trail's emission ∝ the current rate — a
  torn tail pours, a graze threads, a bruise shows nothing. `SMELL_R` by the rate: SMELL_R × √(q ÷ q_ref), at most twice, so a pouring
  wound is found from 180 m and a thread from 40 (downcurrent is the true direction of a scent: pass D).

### 10.7 What goes, what stays, the knobs

**Goes**: `EDGE` as a verdict table (the edges stay as styles; the verdict is F × σ against τ × r); `GRIP.first/bite/bleed`, every `dmg`
in `DEFS` and the player's `bite` (§6 struck them; the code kept them for the blood's size); a jaw's `reach`, `reachOf`, `BITE_M` and
CLAUDE.md's reach rule; `HOLD_BIG` (a jaw lets go when its edge does nothing and its gape does not take the body: the verdict, not a mass
share); `PIN.t`, `PIN.mass` (subdued by stamina); `MISS` (the geometry); `FLEE` (a hunter hurt past L 0.15 or missing a part leaves:
pass D); `LOSE.meal`, `AUTOTOMY.meal`, `LOSE.floor` (the live spec and the loss decide what a body can do); `WOUND_SLOW`; the rope's
closing (`close`, `HOLD_DRAG`); `bodyMass` as size³; §4's "bleeding never kills".

**Stays**: the hold as the fight; the struggle as force against a grip by mass^(2/3); the coverings; the edges as styles; the gape; the
live spec and the lost part (pass 3); autotomy, the stump and the regrowth; venom, the sting, the poison; the moult's soft state; the
blood's colours; the debris, the flinch, the flush; the save carrying the wounds.

**Knobs**, a table each with a comment per key: `EDGE_K` (K, σ, ρ's rule per edge), `COVER_T` (τ per covering), `VITAL` (0.75 r, the nape's
0.3 r, the span), `SEVER` (0.7), `BLOOD` (volume and pressure by clade, the vessels by part, k, the clot's stretch, the loss's bands, the
refill), `STAMINA` (by clade), `STRIKE` (the lock, the lunge's steering 0.3, the suction window), `SWALLOW` (1 + 4 ×). Built in A (combat.js): `EDGE_RHO`, `VITAL`, `SEVER`, `TORN`, `BLOOD`, `GRIP.k` in newtons per kg^(2/3).

### 10.8 The passes

- **A — the wound and the blood** (points 3, 6, 7) — **built v11.91** (the build added: the nape as a zone behind the head, nape0–nape1 of the trunk capsule with the biter's mouth over the back, the face core-deep; arms that have pinned a body have turned it, so their placed bite is at the nape wherever they took hold; a body with TORN 0.25 of its mass taken in pieces is dead, torn apart; the verdict table stays as the through/not gate until C): one mass; blood as a volume with a rate and a clot; the wound by ρ against r at the
  capsule the hold is on (today's holds); no penetration, no blood; bleeding out; the piece as food, and a hunter no longer quits a
  crippled body for one mouthful. Self-contained; three of the eight.
- **B — contact and the hold** (points 1, 5) — **built v11.92** (the build added: the chase steers by a rate-limited heading, `seekTurn`, braking into tight turns and yawing to turn round; a run-up point when the prey is beside the mouth; the head snapped to the strike's point, so the mouth dips to a prey under a hunter riding the floor's clearance; `reachOf` stays for arms and claws — a part's reach): the mouth's sphere and cone, suction, the intercept, the committed lunge and the
  overshoot, the impact's momentum, the joint at the struck point, the orientation, the petals to the surface; `MISS` out.
  The biggest change to the look; scripted checks as in `test/steer.js` for the orbit (the holder's angular speed about the held under a
  bound) and the petals (no tip behind its root, none inside its own head).
- **C — the edge's work** (points 2, 4) — **built v11.93** (the build added: the verdict as F × σ ≥ τ × r with a crush against r² — `EDGE_K`, `COVER_T`,
  calibrated to §7's verdicts and §10.5's table, the `EDGE` words gone; the shake as a yaw composed on the facing, the roll for the chain cores with the
  held carried round the axis, the saw ×1.5 a cycle to 3×; the claws' pull against `PULL.root` × r² with the claw's own force or the struggle's, and a
  claw's bite a pinch (`EDGE_RHO.claws` 0.35); the stamina by clade riding `slowOf` for a held body, subdued as a second under half the grip; the swallow
  as `h.la` drawn back into the swallower's frame, the grip doubled; the arms' cone (`ARM_CONE`, note b of §10.9); the edge at conception as `BUDGET.edge`,
  the bill naming the sawmouths' step): the shake, the roll, the claws' pull, the crush; subdued by stamina; the swallow as a sequence;
  the edge as a line's trait (§10.9). Not built: the bestiary's word for a sawmouth by descent (§10.10); the middle range's readable hold (note c) beyond
  what the stamina does to it; the tentacles' wrap (note d, a later pass).
- **D — predator behaviour** (point 8; the person's own pass, with another after it): commit to a crippled animal and follow its trail
  downcurrent; bite and wait on dangerous or bigger prey; break off when hurt (the life–dinner rule); the return — you bleeding, knowing,
  and it coming round.

Each pass rewrites the matrix and the hunter table in `test/combat.js` to its verdicts, and re-runs `test/census.js` and `test/live.js`
(the kills on screen change; the ledger's rates do not).

### 10.9 The person's answers (24 Sep 2026)

1. **Bleeding kills.** §4's line is struck.
2. **The edge is the clade's, not the finback's.** The finback is the start of the player's experience, not its average. The edge must
   be a real thing, not a default: a variant of the larger slowbloods, or a sub-clade. Proposed: cutting petals are the slowbloods'
   answer wherever prey outgrew the gape — a family trait of the ridgebacks and the longbacks (the ridge, the abyssal, the eel), by
   species among the finbacks and platebacks (the basker's cut, the needle's point, the crusher's plates: convergent) — and a player's
   line reaches it as an edit at conception at the budget's price (LINEAGE §13.4). The founder's slowblood (the finback, the grazer, the
   darter) is the engulfer. *Open: that family split, or the edge as a sub-clade of its own.*
*Pass A seen (the person, 24 Sep 2026): "this pass looked good"; go ahead on B.*
   *Pass B seen (the person, 24 Sep 2026, eaten by an ortho as the finback): "AWESOME. terrifying." The impact and the hold "GREAT for being a smaller
   prey item". Four notes for the passes to come: (a) the orthos still orbit a little; (b) the arm hunters, close enough to reach but angled away, contort
   — the limbs clip lengthwise through their own bodies to reach you — where the animal would more likely not push its reach (the arms want the
   mouth chains' rule of v11.92, a cone about the body: a reach outside it is not tried; the ringmouths' turn to bring the ring to bear is the rest);
   (c) the middle range — a smaller player grabbing a larger animal — is awkward and unclear: moving prey is clear, being moved is clear, moving
   something you cannot tell you are moving detaches constantly and the trajectory is unreadable (pass C's struggle and stamina, and a readable
   hold for the player: a held thing's drag on you should be felt and shown); (d) tentacles "grabbing" should wrap a physical object as tentacles
   do (a later pass: the chain grab as a wrap round the capsule, not tips drawn to a point).*
3. **As realistic as it comes.** The geometry decides; a crippled death is the common one and the instant death is real where the mouth
   is big enough (§10.5's table).
4. **Physics first** (A–C), **behaviour after** (D), and possibly another behaviour pass after that.
5. §9 Open 5 falls: the miss is the geometry (§10.3).

### 10.10 The edge's lineage (the person, 24 Sep 2026: "evolutionarily concrete, with an actual lineage … a genetic path you can trace")

**The raw material is on every slowblood already.** The integument is scratchy: chevron rows of small chitinous plates down the back
(CLADES, "the crusher's rows, on everything"; PLANET, armour chitinous in the clade's own plate pattern). The petals are the ring's relic
and skinned like the body, and their inner faces carry the same rows — the ancestral mouth is a pad of platelets: a grip by friction,
what `hold` is, PLANET's "none (suction)". One developmental program, the dermal row, expressed on the petal; what diet does to it is the
whole variety of the clade's mouths, as Earth's teeth are dermal denticles that moved into the mouth and were reshaped there, more than once:

| the row on the petal | the edge | who | the step |
|---|---|---|---|
| kept small and many, a comb | rake | the grazer | the pad as a scraper: no fusion |
| fused at the tip into one spine per petal | point | the needle (finbacks) | a small-prey hunter's puncture; the hingeshells' spears are chitin too, from another clade — convergent |
| fused along the inner edge into a serrated crest | cut | the sawmouths | the saw: pieces from prey past the gape |
| the whole face one thick plate | crush | the crusher (platebacks) | the platebacks' full-armour program on the petal too: a vice from four sides |

**The saw arose once.** The ridgebacks and the longbacks are sister lines, the **sawmouths**: one ancestor on the slope whose prey had
outgrown its gape, the petal rows fused into a crest, and the whole line eats in pieces from then on. The ridge and the abyssal
(ridgebacks) and the eel (longbacks) inherit it. The basker moves from the finbacks to the ridgebacks (PLANET's table, 24 Sep 2026): a
vent-bound ridgeback — warm-muscled is what "quick in the warm water" is — that lost its back rows in the warm water, smooth-skinned,
and kept the crest where selection kept it, as teeth outlast scales. So every `cut` on the roster is one lineage, and the finbacks are
plain-mouthed but for the two derivations that are their own (the needle's spine, the grazer's comb). The platebacks kept the pad (the
stone: gape alone) or grew the plate (the crusher).

**The player's line.** A finback founder is a finback: the pad. The edit at conception (LINEAGE §13.4) offers the mouth's `edge` at the
budget's price, and taking `cut` is what the sawmouths did — the rows the line already has on its back, fused along the petal: a third,
parallel origin of the saw, small because the tissue is there (deep homology; Earth grew teeth from denticles the same way more than
once). The line that takes it is its own family from then on: a sawmouth by descent from a finback, which the bestiary can say. `point`
is the needle's step, the same price. Nothing on the roster changes by default, and no sub-clade is declared — a lineage is.
