# DRIFTERS — the fourth clade, and what floats on the surface

Design and build, 9 Sep 2026 (v11.16). Downstream of `PLANET.md` (the radial ancestor, the no-magic rule) and `TAXA.md` (the polyps
are this clade's fixed stage). The person's brief: the surface had lily pads, then "floating algae", then a man o' war — attempts at a
plausible reason for interesting things to look at on open water, points of interest and orientation. Untangle it: what is real,
what the drifters' tree is, what they eat, and a version with long arms that streams in the current. The old float colonies
(`colony`, `colony2`) clipped, were white, spawned backwards into each other and read as "big pustules in the sky". They are gone.

## What is real (the person's questions)

1. **Does the man o' war sit on top like a lily pad?** No. It is a gas float — a chitin-walled sac the animal fills with gas it
   makes (mostly carbon monoxide, oddly) — with a crest that works as a sail, and almost all of the animal hangs *under* it: feeding
   bodies packed beneath the float and tentacles 10–30 m long (50 m at most) trailing in the water. It is not a true jellyfish but a
   colony of the same phylum (a siphonophore); it never pulses, it only drifts. It is blue-violet because pigment is sunscreen at the
   surface.
2. **Do they raft together?** Not physically. They arrive in fleets because the wind sorts them: the crest is set at an angle and a
   population is half left-handed, half right-handed, so one wind stacks thousands on one shore. No man o' war rides a weed raft. The
   weed raft (Sargassum) is real and has its own passengers — crabs, shrimp, a fish that looks like the weed — none of them jellies.
3. **The "lily pad" that is real:** the blue button and the by-the-wind sailor — flat discs of jelly a few centimetres across, a
   float in the middle, a fringe of short tentacles, and **green cells farmed in the disc's skin**. An animal that grew a pad to farm
   light. That is the honest ancestor of the lily-pad wish, and it is an animal.

So the surface has two real things: a weed that let go (the raft, TAXA: a floater) and a jelly that grew a float — the latter in two
forms, a disc that farms and a crest that fishes. Everything below follows from that.

## The clade

**Deep decision:** the ring stayed radial and the arms grew stinging cells. Every other clade broke the ring's symmetry (a head, a
spine, a hinge); the drifters kept it and made it a weapon. **No eyes, no brain, no intent** — a drifter cannot hunt, only sting what
touches it, which is why nothing here chases the player (PLANET: eyes show intent; an eyeless thing has none).

**Signature:** eightfold (the ancestral ring), a bell or a float, translucency, and **pigment by depth for a reason that is not the
weeds'**: blue-violet at the surface (sunscreen), colourless in the lit water (invisible to what would eat it), dark red below the light
(red is the first colour the water eats, so a red thing in the dark cannot be seen at all — Earth's deep jellies are red for this).
Geometry language: rings and skirts; lathes with eight sides.

**What they eat:** small swimmers and plankton stung on contact and hauled to a mouth; the surface forms also farm a green (TAXA: the
polyps' symbiont, the same cell) in their skin. They survive by being cheap: no muscle to speak of, no skeleton, water for a body; the
current does the travelling and the sting does the catching.

## The tree

| split | what it bought | what it cost | forms |
|---|---|---|---|
| **the polyp** — sat down and cloned | a skeleton, a reef, a colony | fixed | the polyps line (FLORA, TAXA): fans, pens, tables, horns, domes, towers |
| **the bell** — let go and pulsed | the water column; a pulse is the cheapest swimming there is | at the mercy of the current | **jelly** (the pulser, 1.4 m, colourless, the lit water), **deepbell** (4.5 m, dark red, below the light: the giant of the drift, slow, sparse) |
| **the float** — a bell that filled with gas and stopped pulsing | the surface: the light and the plankton are there | no way down, ever; the wind decides where it lives | two forms, below |
| — **the button** | a flat disc float that farms a green in its skin; a fringe of short arms | small, defenceless, eaten in fleets | **button** (flora: 1–3 m discs in fleets where the eddies keep drifters; a disc of jelly takes no weight) |
| — **the sailer** | a crested float that sails at an angle to the wind, fishing lines 15–35 m trailing in the current; left- and right-handed | a fleet strands on one shore | **sailer** (a creature: float 3–5 m, eight lines), **greatsailer** (the landmark: float 8–10 m, lines to 50 m, a few in the whole world) |

## Functional (what is built)

- **The sailer is a creature** (`buildSailer`, `updateSailer`; DEFS `sailer`, `greatsailer`; role `drift`, `surface`): it rides the wave
  (`waveH`), is carried by the current like everything else, and sails at ~5% of the wind at 40° off downwind, left or right by the
  animal (`hand`). The float is a body (`hit`): you push against it and it gives, you do not pass through. The crest is a mesh yawed to
  the wind. The eight lines are chains (`armRing`, `down`, 14 segments, soft): posed each frame to stream against the animal's way
  through the water (`linePose`), simulated near the player (they part, they lag, they touch), and **they sting**: within 0.9 m of any
  line point the player takes `dmg` on a 0.7 s clock. No eyes.
- **The button is flora** (`button`, `buttonB`, `MATR`): a low disc with a green-blue centre (the farmed green), a violet rim and a fringe of
  eight short hanging arms; fleets in the canopy (`canopyPer` 60), the odd one in pockets elsewhere; a far card so a fleet reads across the
  water. Takes no weight.
- **The jelly rebuilt** in the signature: an eight-sided bell, eight arms, colourless; **deepbell** the same builder at 4.5 m, dark red,
  below −200.
- **Gone:** `colony`, `colony2`, `colonyB`, their far cards, the canopy's three jellies a cell (the canopy is the sailers' now).

## What the surface is now

Open water, and on it three things with reasons: **rafts** (a weed that let go, olive, in pockets where the eddies gather them), **buttons**
(a jelly that grew a pad to farm light, in fleets, blue-green), **sailers** (a jelly that grew a sail to fish, blue-violet crests you can
see from across the water, lines you learn not to swim under). The great sailer is the landmark. Nothing sits on the water that the
physics would sink, and nothing on it is a plant that is not a weed.

Left open, for the bigger island: whether the buttons' fleets should drift as a fleet (instance matrices per frame — the accepted
"floating on their own" for now), the sailers' stranding on the windward strand (a dead float on the sand: a flora entry, cheap), and
what eats them (the button's fleets are what the glim and the scuttle would graze if a grazer of jelly is wanted).
