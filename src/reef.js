// reef.js — what is left of the reef pass (REEF.md). v11.20 built manufactured reef structures with live colonies on them; v11.21 struck
// them and put the colonies on the geology's rock instead; v11.22 struck that too (the person, 10 Sep 2026: the coat clipped, stood at odd
// angles, and "dark rock and these things meant for light sand"; "put the placed rocks with stuff stuck to it in the bin"). What v11.22
// keeps from the pass is upstream of any coat: nothing is placed inside rock any more — the rock goes first and every plant asks the
// collision hash before it stands (chunks.js, placeFloraType `clear`). The generator and the coat are in the v11.20–11.21 zips if a
// barnacle-on-rock ever wants them back. This file now holds only the two extra giant-colony shapes.
// ---------- the largest single colonies, varied (v11.21) ----------
// The person: the largest coral more varied rather than scaled up. The old dome (flora.js) is the one giant colony — a banded mound,
// the Pavona/Porites shape. Two more shapes the same size, each a real growth form of a massive colony: two lobes that grew into each
// other (a colony that split and fused, or two that met), and the low wide one — the Solomons' 34 m × 5.5 m — that spread instead of
// rising once it neared the wave base. Structures like the old dome; the same tints and envelope, a third of the world's giants each.
function lobedGeo(seed) {
  const rg = mulberry(seed),
    P = [];
  mound(P, {r: 0.62, sq: 0.6, bands: 4, col: [0.9, 0.9, 0.9], sw: 9, sh: 6}, rg, -0.34, 0, 0.1);
  mound(P, {r: 0.5, sq: 0.62, bands: 4, col: [0.86, 0.88, 0.86], sw: 8, sh: 5}, rg, 0.42, 0, -0.14);
  return kit(P, [
    {x: -0.34, y: 0, z: 0.1, r: 0.82, s: [1, 0.66, 1], rot: [0, 0, 0]},
    {x: 0.42, y: 0, z: -0.14, r: 0.66, s: [1, 0.68, 1], rot: [0, 0, 0]}
  ]);
}
function lowdomeGeo(seed) {
  const rg = mulberry(seed),
    P = [];
  mound(P, {r: 0.92, sq: 0.3, bands: 6, col: [0.9, 0.9, 0.9], sw: 10, sh: 6}, rg, 0, 0, 0);
  return kit(P, [{x: 0, y: 0, z: 0, r: 1.16, s: [1, 0.36, 1], rot: [0, 0, 0]}]);
}
const LOBED = lobedGeo(97),
  LOWDOME = lowdomeGeo(103),
  GIANT_T = [
    [0.55, 0.5, 0.42],
    [0.6, 0.55, 0.4],
    [0.5, 0.55, 0.45]
  ];
for (const e of [
  {id: 'olddome2', k: LOBED, s: [12, 22], sx: [0.9, 1.15]},
  {id: 'olddome3', k: LOWDOME, s: [14, 30], sx: [0.85, 1.3]}
]) {
  const f = {id: e.id, geo: e.k.geo, lumps: e.k.lumps, top: e.k.top, foot: e.k.foot, mat: MAT, tints: GIANT_T, s: e.s, sink: 0.1, sx: e.sx, per: 1, env: {h: [-150, -20], sub: [0.5, 1], nut: [0.4, 1]}, field: 0.009, big: true};
  FLORA.push(f);
  FLORA_BY_ID[f.id] = f;
}
