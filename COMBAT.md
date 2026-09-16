# COMBAT.md — injury as states, not numbers

**Status: designed and built in full 15 Sep 2026 (passes 1, 2, 4, 3: v11.54–v11.57)** (pass 1: the edge and the covering read off the spec, the hold knows what it is on, no capsule past the nose; pass 2: no hit points — the gape, the pin and the placed act, wounds that bleed and slow, paralysis and the sting, autotomy, death ends the slot's animal; pass 4: hunters read blood, the strike's miss rule, injuries in the save, the poison by feeding; pass 3: the wound as a spec edit — a tail torn off, the body re-derived, the stump and the regrowth; the numbers in DESIGN Combat). §7 has what the matrix found; §8 the passes as built. What is left is tuning by play. Replaces the hit-point half of v11.31 (DESIGN Combat): the hold, the rope, the struggle by
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
(`BLEED_T`: ringmouths clot fast, slowbloods slow, hingeshells barely bleed) and stops on its own — bleeding never kills by itself; and
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
4. **The rasp as a player path** (latch on a basker and feed): a fourth playable, or the rasp's own thing? Not now, but it decides
   whether the sucker grip gets a player branch.
5. **How much the hunters miss:** `MISS` at the escape-reflex rule, or looser for the first hours of a slot?

Answered 15 Sep 2026: the chemistry per clade (§3b) — ringmouth venom by the beak, slowblood venom on the spines, hingeshell poison from the seep diet, the drifters' cells; and the roster it lands on.
