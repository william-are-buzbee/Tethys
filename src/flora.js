// flora.js — the species (TAXA.md: three photosynthetic lines and four animal lines; FLORA.md: the eight bauplans from grow.js), the
// kept geometries, the rock kits, and the table: density and tolerance envelope per species
// There are no biomes (world.js): every entry has `per` (instances per cell at full tolerance) and `env`, a tolerance envelope over the
// conditions — h (ground height), slope, sub (0 mud .. 0.33 sand .. 0.66 rubble .. 1 rock), flow, expo (wave exposure), nut (food),
// young (fresh basalt), heat (vent), shel (the lagoon), rel (relief: 0.5 flat, 1 a crest) — each [lo,hi] with a soft edge (envW).
// A species is species(id, fields, build): build(rg,k) makes variant k (0..2) as parts, with its own colliders and pads; the three are
// packed into one geometry (grow.js). Weeds are `photo` with a `line` (green | float | red, TAXA): their vertex colours are near-white
// and the cell tints each instance by pigment(ground depth, line), so a line's colour is its signature and its band a consequence.
// Animals carry their line's colours in the geometry and a tint list.
// ---------- the greens: jointed axes, bright water, 0 to ~−40 (turf; the runners strap and grape; the mineral chain; the land forms below) ----------
// ---------- the floaters: a rope with floats, the fed flanks, ~−15 to ~−80 (wisp; the blades ribbon and ladder; the floats bladder and stipe) ----------
const WSTEM = [0.72, 0.62, 0.45],
  WFLOAT = [1.06, 1.02, 0.8],
  WHOLD = [0.55, 0.48, 0.38];
// the exposure ecotypes (v11.67, grow.js ecoK): an `eco` species' k is the wave exposure at the instance — 0 sheltered, 2 exposed — and its builder
// reads it as the kelps do: exposed short, thick, narrow, splayed and heavy at the holdfast; sheltered long, broad, thin, all blade. ex=k/2 below.
function turfB(rg,k){const P=[],ex=k/2;tuft(P,{n:4+k,len:lerp(0.42,0.24,ex),w:lerp(0.09,0.12,ex),spread:lerp(0.4,0.75,ex),jit:0.22},rg,0,0,0);return {P:P};} // a lawn: longer and looser in shelter, a dense short mat in the surf
function wispB(rg,k){const P=[],ex=k/2;tuft(P,{n:6+k,len:lerp(1.15,0.6,ex),w:lerp(0.05,0.08,ex),spread:lerp(0.6,1.0,ex),jit:0.25},rg,0,0,0);return {P:P};} // the floaters' founder: tall and loose in shelter, low and splayed where the waves reach
// strap: two-ranked blades from a runner along the sand — six wide short blades leaning out both ways, so a runner reads as a tuft
// of pasture and not (as the v9.5 four tall narrow blades did, seen from a body length away) as three dark lines from a point
function strapB(rg) {
  const P = [part(G.box(0.05, 0.03, 1.2), 0, 0.015, 0, WSTEM)];
  for (let i = 0; i < 6; i++) {
    const L = 0.9 + rg() * 0.5,
      lean = (i % 2 ? 1 : -1) * (0.45 + rg() * 0.35);
    P.push(
      part(G.plane(0.24, L), (-Math.sin(lean) * L) / 2, (Math.cos(lean) * L) / 2, -0.5 + i * 0.2, W, {
        r: [0.2 * (rg() - 0.5), 0.4 * (rg() - 0.5), lean],
        order: 'YXZ'
      })
    );
  }
  return {P: P};
}
// paddle (v11.67, SEAFLOOR §2's turbidity form): the runner line's answer to stirred water — surf over sand, where the strap's thin blades are
// scoured and shaded and the floaters' ropes snap. A runner with a few broad, short, thick blades (a box, not a plane: a rind-thick cuticle
// that sheds sand and takes the scour) leaning downstream, low. Costs light per gram, so it holds only where `turb` is high in the light: a
// scrap of our windward shallows, five square kilometres of the giant's — the one sessile thing that tells the two islands apart at a glance.
function paddleB(rg,k){const P=[part(G.box(0.05,0.03,1.0),0,0.015,0,WSTEM)],ex=k/2,n=3+(k%2);
  for(let i=0;i<n;i++){const L=lerp(0.62,0.42,ex)*(0.85+rg()*0.3),w=lerp(0.34,0.28,ex),lean=(i%2?1:-1)*(0.55+rg()*0.35);
    P.push(part(G.box(w,L,0.035),-Math.sin(lean)*L/2,Math.cos(lean)*L/2+0.02,-0.4+i*(0.8/(n-1)),W,{r:[0.3*(rg()-0.5),0.4*(rg()-0.5),lean],order:'YXZ'}));}
  return {P:P};}
// chain: rigid runs of calcified discs, edge to edge (mineral where the rasps are). eco (v11.67): short stout runs of thick discs in the surf, longer runs of thinner ones in shelter
function chainB(rg,k){const P=[],ex=k/2,nd=4-k;
  for(let b=0;b<2;b++){const N=axis(P,{segs:2,len:lerp(0.5,0.3,ex),r0:lerp(0.03,0.04,ex),r1:lerp(0.02,0.03,ex),lean:0.9,wander:0.3,sides:4,open:true,col:WSTEM},rg),t=N[N.length-1];
    let p=V3(t.x,t.y,t.z),d=t.d.clone();const dr=lerp(0.1,0.13,ex),th=lerp(0.03,0.045,ex);
    for(let q=0;q<nd;q++){d.x+=(rg()-0.5)*0.6;d.z+=(rg()-0.5)*0.6;d.normalize();p.add(d.clone().multiplyScalar(dr));const n=d.clone().cross(UP);if(n.lengthSq()<0.01)n.set(1,0,0);
      P.push(part(G.cyl(dr*1.05,dr*0.95,th,4),p.x,p.y,p.z,W,{dir:n}));p.add(d.clone().multiplyScalar(dr*0.9));}}
  return {P:P};}
// grape: a runner with a bunch of spheres piled at every node (a weed can be one giant cell and still do this). The bunch lies on the
// runner; v9.5 stood three beads on a half-metre stick at each node, which read as a row of tiny trees
function grapeB(rg) {
  const P = [];
  let x = 0,
    z = 0,
    a = rg() * TAU;
  for (let s = 0; s < 3; s++) {
    const L = 0.45,
      nx = x + Math.cos(a) * L,
      nz = z + Math.sin(a) * L;
    P.push(part(G.box(0.03, 0.03, L), (x + nx) / 2, 0.03, (z + nz) / 2, WSTEM, {r: [0, HPI - a, 0]}));
    for (let j = 0; j < 4; j++) {
      const b = rg() * TAU,
        d = j ? 0.07 + rg() * 0.06 : 0,
        r = 0.075 + rg() * 0.035;
      P.push(part(G.sph(r, 4, 2), nx + Math.cos(b) * d, r * 0.8 + (j ? 0 : 0.06), nz + Math.sin(b) * d, W));
    }
    x = nx;
    z = nz;
    a += (rg() - 0.5) * 1.4;
  }
  return {P: P};
}
// stipe: the tower kelp rebuilt — unit height, stretched to the surface by `reach` like the bladder, so everything is built flat and
// thin (a float 0.03 thick here is 1 m at forty deep); a float at every other node, spiral blades, and at the top a whorl laid flat
// under the surface: the canopy you swim under, never a stalk in the air
// eco (v11.67): the height is the water's (`reach`), so the ecotype is in the rest — exposed: a thicker stipe on a wider holdfast, fewer nodes,
// shorter narrower blades, a smaller canopy whorl; sheltered: thin, eight nodes of long broad blades, a six-blade canopy
function stipeB(rg,k){const ex=k/2,P=[part(G.cyl(lerp(0.05,0.08,ex),lerp(0.13,0.19,ex),1,5,true),0,0.5,0,WSTEM),part(G.cone(lerp(0.35,0.55,ex),0.006,5),0,0.003,0,WHOLD)],nn=8-k,bl=lerp(1.9,1.1,ex),bw=lerp(0.5,0.3,ex);
  for(let i=0;i<nn;i++){const y=0.22+i*(0.72/nn),sp=i*2.4+rg()*0.6;
    if(i%2===k%2)P.push(part(G.sph(0.24,4,2),0,y+0.004,0,WFLOAT,{s:[1,0.03,1]}));
    for(let j=0;j<2;j++){const L=bl+rg()*0.6,pg=G.plane(L,bw);pg.rotateX(-HPI);pg.translate(L/2,0,0);P.push(part(pg,0,y,0,W,{r:[0,sp+j*Math.PI+(rg()-0.5)*0.5,0],order:'YXZ'}));}}
  P.push(part(G.sph(0.3,5,3),0,0.975,0,WFLOAT,{s:[1,0.04,1]}));
  const nc=6-k,cl=lerp(2.6,1.8,ex),cw=lerp(0.55,0.4,ex);
  for(let j=0;j<nc;j++){const L=cl+rg()*0.6,pg=G.plane(L,cw);pg.rotateX(-HPI);pg.translate(L/2,0,0);P.push(part(pg,0,0.985+j*0.002,0,W,{r:[0,j/nc*TAU+rg()*0.4,0],order:'YXZ'}));}
  return {P:P};}
// ladder: two-ranked blades in one plane — a wall from the side, nothing edge-on. eco (v11.67): 13 m of long broad blades on a thin axis in
// shelter, 8 m of short narrow ones on a thick axis and a wide holdfast in the surf
function ladderB(rg,k){const ex=k/2,P=[part(G.cyl(lerp(0.25,0.38,ex),lerp(0.32,0.46,ex),0.12,5),0,0.06,0,WHOLD)],
    N=axis(P,{segs:5,len:lerp(13,8,ex),r0:lerp(0.08,0.12,ex),r1:lerp(0.035,0.06,ex),wander:0.15,lean:0.25,col:WSTEM,open:true},rg);
  blades(P,N,{from:0.12,to:0.98,count:16,len:lerp(1.5,1.0,ex),w:lerp(0.44,0.28,ex),droop:0.5,spin:'two',twist:rg()*TAU,taper:0.7},rg);
  return {P:P};}
// ribbon: one wide blade on a stub, lifted by the float at its tip — it leaves the stub at ~60° and curves up to vertical under the
// float (bladeAt's default start is level, which is right for a frond off a stipe and was wrong here: the blade lay along the floor)
// eco (v11.67): a 12 m blade a metre and a third wide on a thin stub in shelter; 6 m, narrower, on a thick stub and a wide holdfast in the surf
function ribbonB(rg,k){const ex=k/2,P=[part(G.cyl(lerp(0.25,0.4,ex),lerp(0.32,0.5,ex),0.12,5),0,0.06,0,WHOLD)],
    N=axis(P,{segs:2,len:lerp(3,2,ex),r0:lerp(0.09,0.14,ex),r1:lerp(0.055,0.08,ex),lean:0.3,col:WSTEM,open:true},rg),t=N[N.length-1];
  const e=bladeAt(P,t.x,t.y,t.z,lerp(12.5,6,ex),lerp(1.35,0.85,ex),rg()*TAU,-0.4,5,W,1.0+rg()*0.15);
  P.push(part(G.sph(0.4,5,3),e.x,e.y+0.2,e.z,WFLOAT));
  return {P:P};}
// ---------- the drifters' floats (DRIFTERS.md): the button — a jelly that grew a pad to farm light ----------
// A low disc float, a green-blue centre (the farmed green in its skin), a violet rim (sunscreen at the surface), a fringe of eight
// short arms hanging beneath and eight shorter; in fleets where the eddies keep drifters. A disc of jelly takes no weight.
// (The float colonies it replaces — `colony`, `colony2` — clipped, were white, spawned into each other; the fishing float is the
// sailer now, a creature: creatures_builders.js buildSailer.)
const BDISC = [0.72, 1.0, 0.86],
  BRIM = [0.74, 0.6, 1.0],
  BARM = [0.7, 0.72, 1.0];
// stranded: a sailer's float on the sand, deflating — the windward strand after a fleet has come in (Earth: the beach after an onshore wind)
function strandedB(rg, k) {
  const P = [part(G.sph(1, 7, 5), 0, 0.22, 0, [0.9, 0.9, 1.0], {s: [0.5 + k * 0.05, 0.28, 1.3 + k * 0.15]})];
  for (let i = 0; i < 5; i++) {
    const h = 0.18 * Math.sin(((i + 0.5) / 5) * Math.PI) + 0.04;
    P.push(part(G.box(0.03, h, 0.3), 0, 0.45 + h / 2, -0.9 + i * 0.45, [1, 0.7, 0.9], {r: [0.5 + rg() * 0.3, 0, 0]}));
  }
  for (let i = 0; i < 6; i++) {
    const a = rg() * TAU,
      L = 1.2 + rg() * 1.4;
    P.push(part(G.box(0.03, 0.02, L), Math.cos(a) * (0.4 + L / 2), 0.02, Math.sin(a) * (0.4 + L / 2), [0.6, 0.6, 0.85], {r: [0, HPI - a, 0]}));
  }
  return {P: P};
}
function buttonB(rg, k) {
  const P = [],
    r = 0.8 + k * 0.25;
  P.push(part(G.cyl(r, r * 0.86, 0.22, 8), 0, 0, 0, BDISC));
  P.push(part(G.cyl(r * 0.55, r * 0.5, 0.14, 8), 0, 0.16, 0, BDISC)); // the float's dome
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU + 0.2;
    P.push(part(G.sph(r * 0.2, 5, 3), Math.cos(a) * r * 0.95, 0.02, Math.sin(a) * r * 0.95, BRIM, {s: [1, 0.55, 1]}));
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU + rg() * 0.3,
      d = r * (i % 2 ? 0.8 : 0.5),
      L = (i % 2 ? 1.4 : 0.9) * (0.8 + rg() * 0.5) + k * 0.3;
    line(P, Math.cos(a) * d, Math.sin(a) * d, L, 0, rg, 3, 0.03 + rg() * 0.015, BARM, BRIM, 0.4);
  }
  return {P: P};
}
// table: a stalk and one or two tiered plates — a plate shades every rival under it and sheds sand
function tableB(rg, k) {
  const P = [],
    col = [],
    N = axis(P, {segs: 2, len: 0.9 + k * 0.3, r0: 0.18, r1: 0.13, lean: 0.3, wander: 0.2, sides: 5}, rg),
    t = N[N.length - 1],
    r = 1.2 + k * 0.4;
  disc(P, {r: r, th: 0.12, sides: 8, studs: 7, col2: PTIP}, rg, t.x, t.y, t.z);
  col.push({a: [0, 0, 0], b: [t.x, t.y, t.z], r: 0.2}, {e: [t.x, t.y, t.z, r, 0.14, r]});
  if (k === 2) {
    const N2 = axis(P, {x: t.x, y: t.y, z: t.z, segs: 1, len: 0.7, r0: 0.12, r1: 0.09, lean: 2.0, sides: 5}, rg),
      t2 = N2[N2.length - 1];
    disc(P, {r: 0.75, th: 0.1, sides: 7, studs: 4, col2: PTIP}, rg, t2.x, t2.y, t2.z);
    col.push({e: [t2.x, t2.y, t2.z, 0.75, 0.12, 0.75]});
  }
  return {P: P, col: col};
}
// horn: fast brittle antlers; the same builder with rust tints is the rockfall's iron-skeleton form
function hornB(rg, k) {
  const P = [],
    col = [];
  branch(
    P,
    {levels: 2, kids: [3, 3], angle: 0.55, ratio: 0.72, planar: 0.25, taper: 0.72, sides: 4, tip: polypTip, colLevels: 1},
    rg,
    V3(0, 0, 0),
    V3(0, 1, 0),
    0.7 + k * 0.15,
    0.14,
    0,
    col
  );
  return {P: P, col: col};
}
// dome: a massive banded mound, living rock (the "big polygonal rocks", alive)
function domeB(rg, k) {
  const P = [],
    r = 0.9 + k * 0.35;
  mound(P, {r: r, sq: 0.62, bands: 3, col: W}, rg, 0, 0, 0);
  return {P: P, col: [{e: [0, r * 0.05, 0, r, r * 0.62, r]}]};
}
// bommie and tower: tiers with polyp spines. H the height, tiers the count — the bommie 3.6–4.6 in the passes, the tower 4.5–6 in the calm (v11.20)
function bommieB(rg, k, H, tiers) {
  const P = [],
    col = [],
    rr = H * 0.22;
  let y = 0;
  for (let i = 0; i < tiers; i++) {
    const f = 1 - (i / tiers) * 0.65,
      h = H / tiers,
      r0 = rr * f,
      r1 = rr * (1 - ((i + 1) / tiers) * 0.65);
    P.push(part(G.cyl(r1 * 1.05, r0, h * 1.02, 6), 0, y + h / 2, 0, W));
    for (let j = 0; j < 4; j++) {
      const a = (j / 4) * TAU + i * 0.9 + rg() * 0.4,
        v = V3(Math.cos(a), 0.25, Math.sin(a)).normalize(),
        L = r0 * 0.9;
      P.push(part(G.cone(r0 * 0.12, L, 4), v.x * (r0 * 0.9 + L / 2), y + h * 0.7, v.z * (r0 * 0.9 + L / 2), PTIP, {dir: v}));
    }
    if (i % 2 === 0) col.push({a: [0, y, 0], b: [0, Math.min(H, y + 2 * h), 0], r: r0 * 1.05});
    y += h;
  }
  return {P: P, col: col};
}
// pen: a polyp pen in the sand — a stalk with a feathered blade (the whip, its stiff cousin, was struck 9 Sep 2026: "way too earth like")
function penB(rg, k) {
  const P = [],
    N = axis(P, {segs: 3, len: 1.4 + k * 0.5, r0: 0.05, r1: 0.03, wander: 0.08, lean: 0.2, sides: 4, open: true, col: [0.85, 0.8, 0.8]}, rg);
  blades(P, N, {from: 0.3, to: 0.98, count: 12 + k * 2, len: 0.35, w: 0.09, droop: 0.3, spin: 'two', twist: rg() * TAU, taper: 0.6}, rg);
  return {P: P};
}
// ---------- crowns (sessile ringmouths: a ring of arms round a mouth on a stalk or in a tube, an eye ring on the rim, copper flesh) ----------
const CFLESH = [0.5, 0.66, 0.6],
  CSTALK = [0.36, 0.44, 0.42];
// lily: a crown on a jointed stalk, opened as a fan across the flow (flow-faced: the plane is x-y)
function lilyB(rg, k) {
  const P = [],
    N = axis(P, {segs: 4, len: 0.9 + k * 0.4, r0: 0.06, r1: 0.045, wander: 0.12, lean: 0.3, sides: 5, open: true, col: CSTALK, rib: true}, rg),
    t = N[N.length - 1];
  crown(P, V3(t.x, t.y, t.z), {n: 6, len: 0.7 + k * 0.2, w: 0.06, spread: 1.1, plane: true, rim: 0.09, col: CFLESH}, rg);
  return {P: P, col: [{a: [0, 0, 0], b: [t.x, t.y, t.z], r: 0.09}]};
}
// tulip: a crown in a bulb with a slit mouth on a stalk, the eye ring round the neck
function tulipB(rg, k) {
  const P = [],
    N = axis(P, {segs: 3, len: 0.6 + k * 0.3, r0: 0.05, r1: 0.04, wander: 0.15, lean: 0.4, sides: 5, open: true, col: CSTALK}, rg),
    t = N[N.length - 1],
    h = 0.4 + k * 0.1;
  cup(P, {h: h, rm: 0.16, rw: 0.2, rb: 0.08, sides: 6, closed: true, col: CFLESH}, rg, t.x, t.y, t.z);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU;
    P.push(
      part(G.cone(0.025, 0.03, 3), t.x + Math.cos(a) * 0.16, t.y + h * 0.9, t.z + Math.sin(a) * 0.16, EYE, {dir: V3(Math.cos(a), 0.6, Math.sin(a))})
    );
  }
  return {P: P, col: [{s: [t.x, t.y + h * 0.55, t.z, 0.24]}]};
}
// loop: a knobbly tube that rises and curves over (a bent mouth faces across the flow whichever way it grew); a crown lives in it
function loopB(rg, k) {
  const P = [],
    N = axis(P, {segs: 6, len: 1.2 + k * 0.4, r0: 0.1, r1: 0.09, bend: 0.32, wander: 0.1, lean: 0.1, sides: 6, open: true, rib: true}, rg),
    t = N[N.length - 1];
  P.push(part(G.cyl(0.12, 0.1, 0.06, 6, true), t.x, t.y, t.z, W, {dir: t.d}));
  crown(P, V3(t.x, t.y, t.z).add(t.d.clone().multiplyScalar(0.05)), {n: 5, len: 0.3, w: 0.035, spread: 0, rim: 0.07, col: CFLESH}, rg);
  return {
    P: P,
    col: [
      {a: [N[0].x, N[0].y, N[0].z], b: [N[3].x, N[3].y, N[3].z], r: 0.13},
      {a: [N[3].x, N[3].y, N[3].z], b: [t.x, t.y, t.z], r: 0.12}
    ]
  };
}
// plume: the crowns' bacterial-farm branch (TAXA, stage 0 — the oldest sessile animals on the mountain): bunches of white tubes with red
// crowns crowding every warm crack. The crown is red because blood that carries sulfide and oxygen both is iron blood; the tubes grow a
// metre a year. No arms to speak of — the crown is a plume of short rods round the mouth, the eye ring kept
const PTUBE = [0.94, 0.92, 0.88],
  PRED = [0.78, 0.16, 0.14];
function plumeCrown(P, at, dir, r, n, len, col, rg) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rg() * 0.4,
      el = 0.55 + rg() * 0.5,
      v = V3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)).multiplyScalar(len * (0.7 + rg() * 0.5));
    P.push(part(G.cyl(r * 0.25, r * 0.5, v.length() * 1.04, 3, true), at.x + v.x / 2, at.y + v.y / 2, at.z + v.z / 2, col, {dir: v}));
  }
  const ne = 6;
  for (let i = 0; i < ne; i++) {
    const a = (i / ne) * TAU;
    P.push(part(G.cone(r * 0.28, r * 0.3, 3), at.x + Math.cos(a) * r * 0.9, at.y - r * 0.1, at.z + Math.sin(a) * r * 0.9, EYE, {dir: V3(Math.cos(a), 0.6, Math.sin(a))}));
  }
}
function plumeB(rg, k) {
  const P = [],
    col = [],
    n = 4 + k * 2;
  for (let i = 0; i < n; i++) {
    const a = rg() * TAU,
      d = i ? 0.1 + rg() * 0.35 : 0,
      x = Math.cos(a) * d,
      z = Math.sin(a) * d,
      H = 0.9 + rg() * 0.9 + k * 0.5,
      r = 0.05 + rg() * 0.03;
    const N = axis(P, {segs: 3, len: H, r0: r, r1: r * 0.85, wander: 0.08, lean: 0.35, sides: 5, open: true, col: PTUBE, x: x, z: z, rib: true}, rg),
      t = N[N.length - 1];
    plumeCrown(P, V3(t.x, t.y, t.z), t.d, r * 2.2, 9, r * 4.5, PRED, rg);
    if (i < 2) col.push({a: [x, 0, z], b: [t.x, t.y, t.z], r: r * 1.6});
  }
  return {P: P, col: col};
}
// seep: the same branch at the rim — tubes rooted below the chemocline where the sulfide is, crowns above it where the oxygen is; black
// iron-sulfide tubes (PLANET, shell colour below −450), the crown dark. Tall, sparse: a straddler draws a line round the whole world
function seepB(rg, k) {
  const P = [],
    col = [],
    n = 2 + (k % 2);
  for (let i = 0; i < n; i++) {
    const a = rg() * TAU,
      d = i ? 0.3 + rg() * 0.5 : 0,
      x = Math.cos(a) * d,
      z = Math.sin(a) * d,
      H = 3.5 + rg() * 1.5 + k * 1.2,
      r = 0.09 + rg() * 0.04;
    const N = axis(P, {segs: 5, len: H, r0: r, r1: r * 0.8, wander: 0.1, lean: 0.25, sides: 5, open: true, col: [0.2, 0.19, 0.2], x: x, z: z, rib: true}, rg),
      t = N[N.length - 1];
    plumeCrown(P, V3(t.x, t.y, t.z), t.d, r * 2.4, 11, r * 5, [0.5, 0.12, 0.12], rg);
    col.push({a: [x, 0, z], b: [t.x, t.y, t.z], r: r * 1.6});
  }
  return {P: P, col: col};
}
// stilt: the propped shell — a fixed straightshell. A cone shell cannot filter lying in the silt, so it props on two struts from its lip
// and puts its arms out over it, the eye ring on the crown (Earth spat out the same struts once, hyoliths, and dropped them)
const SHELLC = [0.9, 0.86, 0.78],
  SHELLB = [0.78, 0.72, 0.62];
function stiltB(rg, k) {
  const P = [],
    L = 0.5 + k * 0.2,
    r = 0.09 + k * 0.03,
    tilt = 0.55 + rg() * 0.25;
  // the shell: a closed lathe of banded rings, apex on the ground behind, mouth raised on the struts
  const d = V3(0, Math.sin(tilt), Math.cos(tilt)),
    apex = V3(0, r * 0.3, -L * 0.15),
    mouth = apex.clone().add(d.clone().multiplyScalar(L));
  const segs = 5;
  for (let i = 0; i < segs; i++) {
    const t0 = i / segs,
      t1 = (i + 1) / segs,
      p0 = apex.clone().add(d.clone().multiplyScalar(L * t0)),
      p1 = apex.clone().add(d.clone().multiplyScalar(L * t1)),
      v = p1.clone().sub(p0);
    P.push(part(G.cyl(r * (0.15 + 0.85 * t1), r * (0.15 + 0.85 * t0), v.length() * 1.04, 6), p0.x + v.x / 2, p0.y + v.y / 2, p0.z + v.z / 2, i % 2 ? SHELLB : SHELLC, {dir: v}));
  }
  // two struts from the lip to the ground, forward and out
  for (const sg of [1, -1]) {
    const foot = V3(sg * (r * 2.2 + L * 0.25), -0.02, mouth.z + L * 0.35),
      top = mouth.clone().add(V3(sg * r * 0.7, -r * 0.3, 0)),
      v = foot.clone().sub(top);
    P.push(part(G.cyl(r * 0.12, r * 0.2, v.length() * 1.02, 4, true), top.x + v.x / 2, top.y + v.y / 2, top.z + v.z / 2, SHELLB, {dir: v}));
  }
  // the crown out over the lip, opened across the flow (the mouth faces local +z; plane arms fan in x-y)
  crown(P, mouth.clone().add(d.clone().multiplyScalar(r * 0.3)), {n: 6, len: r * 3.2, w: r * 0.45, spread: 1.0, plane: true, rim: r * 0.75, col: CFLESH}, rg);
  return {P: P, col: [{s: [(apex.x + mouth.x) / 2, (apex.y + mouth.y) / 2, (apex.z + mouth.z) / 2, L * 0.5]}]};
}
// ---------- cones (sessile hingeshells: plated cones cemented to rock where the water moves most, comb legs out of the top) ----------
const CPLATE = [0.62, 0.6, 0.55],
  CJOINT = [0.82, 0.82, 0.74],
  CLEG = [0.7, 0.72, 0.5];
function coneB(rg, k) {
  const P = [],
    n = 4 + k;
  for (let i = 0; i < n; i++) {
    const a = rg() * TAU,
      d = rg() * 0.45,
      r = 0.09 + rg() * 0.1;
    coneShell(P, {r: r, h: r * 2.2, plates: 2, legs: 2, col: CPLATE, col2: CJOINT, col3: CLEG}, rg, Math.cos(a) * d, 0, Math.sin(a) * d);
  }
  return {P: P};
}
// nod: the stalked cone — a hingeshell that sat down in the current and grew a flexible stalk to hold its comb up in it (the plates the
// same; the moult still happens inside them)
function nodB(rg, k) {
  const P = [],
    N = axis(P, {segs: 4, len: 0.35 + k * 0.15, r0: 0.03, r1: 0.025, wander: 0.15, lean: 0.6, sides: 4, open: true, col: [0.5, 0.48, 0.42]}, rg),
    t = N[N.length - 1],
    r = 0.06 + k * 0.015;
  coneShell(P, {r: r, h: r * 2.4, plates: 3, legs: 5, col: CPLATE, col2: CJOINT, col3: CLEG}, rg, t.x, t.y, t.z);
  return {P: P};
}
// ---------- mats: bacteria, not a lineage — a colour and a fuzz. Sulfur where there is seepage or heat; grey below the chemocline ----------
function matB(col) {
  return function (rg) {
    const P = [];
    tuft(P, {n: 9, len: 0.08, w: 0.025, spread: 1.3, rod: true, jit: 0.5, col: col}, rg, 0, 0, 0);
    return {P: P};
  };
}
// ---------- sacs (the simplest founder: a bag with an in-hole and an out-hole; lathes; ivory, dun, grey) ----------
// tube: clusters of tubes; variant 0 ribbed, 1 with an elbow, 2 double-walled
function tubeB(rg, k) {
  const P = [],
    col = [],
    n = 2 + k;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rg() * 0.8,
      d = i ? 0.3 + rg() * 0.25 : 0,
      h = 1.1 + rg() * 1.3,
      r = 0.15 + rg() * 0.06,
      x = Math.cos(a) * d,
      z = Math.sin(a) * d;
    if (k === 1 && i === 0) {
      const N = axis(P, {x: x, z: z, segs: 5, len: h, r0: r * 1.15, r1: r, bend: 0.22, wander: 0.05, sides: 6, open: true}, rg),
        t = N[N.length - 1];
      P.push(part(G.cyl(r * 1.2, r, 0.08, 6, true), t.x, t.y, t.z, W, {dir: t.d}));
    } else {
      const N = axis(P, {x: x, z: z, segs: 2, len: h, r0: r * 1.2, r1: r, wander: 0.06, lean: 0.2, sides: 6, open: true, rib: k === 0}, rg),
        t = N[N.length - 1];
      P.push(part(G.cyl(r * 1.25, r * 1.05, 0.08, 6, true), t.x, t.y, t.z, [0.85, 0.85, 0.85], {dir: t.d}));
      if (k === 2) P.push(part(G.cyl(r * 0.6, r * 0.5, h * 0.5, 6, true), t.x, t.y - h * 0.2, t.z, [0.7, 0.7, 0.7]));
    }
    col.push({a: [x, 0, z], b: [x, h, z], r: r * 1.2});
  }
  return {P: P, col: col};
}
function cupB(rg, k) {
  const P = [],
    col = [],
    n = 1 + (k % 2);
  for (let i = 0; i < n; i++) {
    const x = i * 0.5,
      h = 0.7 + k * 0.25 + rg() * 0.3,
      rm = 0.26 + rg() * 0.1;
    cup(P, {h: h, rm: rm, rw: rm * 0.7, rb: rm * 0.45, lip: 0.08, sides: 7}, rg, x, 0, 0);
    col.push({s: [x, h * 0.55, 0, rm * 1.05]});
  }
  return {P: P, col: col};
}
// burr: a sac in a coat of star spines. star: a sac that lay down, spines from the rim
function burrB(rg, k) {
  const P = [],
    r = 0.28 + k * 0.08;
  mound(P, {r: r, sq: 1.15, bands: 1, spines: 12 + k * 2, col: W, col2: [0.85, 0.8, 0.75], sw: 6, sh: 4}, rg, 0, r * 0.9, 0);
  return {P: P, col: [{s: [0, r * 0.9, 0, r * 1.1]}]};
}
function starB(rg, k) {
  const P = [part(G.sph(0.3 + k * 0.08, 6, 3), 0, 0.02, 0, W, {s: [1, 0.25, 1]})],
    r = 0.3 + k * 0.08,
    n = 9 + k * 2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rg() * 0.3,
      v = V3(Math.cos(a), 0.15 + rg() * 0.2, Math.sin(a)).normalize(),
      L = r * (0.8 + rg() * 0.5);
    P.push(part(G.cone(r * 0.08, L, 4), v.x * (r * 0.9 + L / 2), 0.04 + (v.y * L) / 2, v.z * (r * 0.9 + L / 2), [0.85, 0.8, 0.75], {dir: v}));
  }
  return {P: P};
}
// vase: the sac line's tall vase — the kept `sponge` (a cylinder with a black lid and a stub, 230 a cell on the terraces: "vases stapled
// to the floor") re-read through the grammar: a lathe with a waist, a flared lip and a hollow (an inner wall in a dark shade) so the mouth
// reads as a hole. Variant 0 tall, 1 paired (a half-height bud fused to its side), 2 a squat wide urn. Field-clustered: gardens, not a sprinkle
function vaseB(rg, k) {
  const P = [],
    col = [];
  const one = (x, z, h, rm, sq) => {
    cup(P, {h: h, rm: rm, rw: rm * (sq ? 1.3 : 0.78), rb: rm * 0.5, lip: 0.14, sides: 7, inner: true, col2: [0.24, 0.22, 0.22]}, rg, x, 0, z);
    col.push({a: [x, 0, z], b: [x, h, z], r: rm * 1.12});
  };
  if (k === 0) one(0, 0, 2.4 + rg() * 0.8, 0.42 + rg() * 0.1, false);
  else if (k === 1) {
    const h = 2.0 + rg() * 0.6,
      rm = 0.4 + rg() * 0.08,
      a = rg() * TAU,
      d = rm * 1.35;
    one(0, 0, h, rm, false);
    one(Math.cos(a) * d, Math.sin(a) * d, h * (0.5 + rg() * 0.2), rm * 0.7, false);
  } else one(0, 0, 1.3 + rg() * 0.4, 0.6 + rg() * 0.12, true);
  return {P: P, col: col};
}
// glass: a cup sac on a long stalk rooted in the mud by a tuft — at 3 °C things grow for millennia and stand up to clear the silt
function glassB(rg, k) {
  const P = [];
  tuft(P, {n: 5, len: 0.25, w: 0.03, spread: 1.2, rod: true, jit: 0.15, col: [0.75, 0.75, 0.72]}, rg, 0, 0, 0);
  const N = axis(P, {segs: 4, len: 1.6 + k * 0.6, r0: 0.035, r1: 0.03, wander: 0.06, lean: 0.25, sides: 4, open: true, col: [0.82, 0.84, 0.86]}, rg),
    t = N[N.length - 1],
    h = 0.42 + k * 0.08;
  cup(P, {h: h, rm: 0.2, rw: 0.17, rb: 0.05, lip: 0.1, sides: 6, col: [0.9, 0.92, 0.94]}, rg, t.x, t.y, t.z);
  return {P: P, col: [{a: [0, 0, 0], b: [t.x, t.y, t.z], r: 0.06}, {s: [t.x, t.y + h * 0.5, t.z, 0.22]}]};
}
// frond: a quilted blade on a holdfast, no mouth and no light — a sac that gave up its holes and absorbs what dissolves: the deep's cheapest animal
function frondB(rg, k) {
  const P = [part(G.cyl(0.12, 0.16, 0.08, 5), 0, 0.04, 0, [0.5, 0.48, 0.46])],
    n = 1 + k;
  for (let i = 0; i < n; i++)
    bladeAt(
      P,
      (rg() - 0.5) * 0.2,
      0.06,
      (rg() - 0.5) * 0.2,
      1.1 + rg() * 0.7 + k * 0.3,
      0.42 + rg() * 0.2,
      rg() * TAU,
      -0.25,
      4,
      [0.72, 0.66, 0.62],
      1.1 + rg() * 0.3
    );
  return {P: P};
}
// barrel: a giant sac a century old, hollow from above
function barrelB(rg, k) {
  const P = [],
    h = 1.3 + k * 0.4,
    rm = 0.5 + k * 0.12;
  cup(P, {h: h, rm: rm, rw: rm * 1.15, rb: rm * 0.7, lip: 0.05, sides: 8, inner: true, col2: [0.7, 0.68, 0.66]}, rg, 0, 0, 0);
  return {P: P, col: [{a: [0, 0, 0], b: [0, h, 0], r: rm * 1.1}]};
}
// ---------- mats (bacteria: rust where iron meets oxygen on fresh basalt) ----------
// beard: tufts of twisted rust stalks — what "boring into rock" amounts to. iron: a low banded dome the mat laid down over centuries
function beardB(rg, k) {
  const P = [];
  tuft(P, {n: 2 + k, len: 0.35, w: 0.025, spread: 0.9, rod: true, curl: true, jit: 0.25}, rg, 0, 0, 0);
  tuft(P, {n: 3, len: 0.3, w: 0.02, spread: 1.0, rod: true, jit: 0.25}, rg, 0, 0, 0);
  return {P: P};
}
function ironB(rg, k) {
  const P = [],
    r = 0.8 + k * 0.4;
  mound(P, {r: r, sq: 0.45, bands: 4, col: W, sw: 7, sh: 4}, rg, 0, 0, 0);
  return {P: P, col: [{e: [0, 0, 0, r, r * 0.45, r]}]};
}
// ---------- kept geometries (one variant each) ----------
// (vid0, the zero `vid` for a kept geometry on a variant-aware material, went with the bladder's builder, v11.67: nothing kept is drawn that way now)
function fanGeo() {
  return merge([part(G.cyl(0.08, 1.3, 2.4, 7), 0, 1.2, 0, W, {s: [1, 1, 0.16]}), part(G.cyl(0.1, 0.16, 0.6, 5), 0, 0.2, 0, [0.5, 0.4, 0.35])]);
}
function boulderGeo() {
  return merge([part(new THREE.DodecahedronGeometry(1, 0), 0, 0, 0, W)]);
}
function chimneyGeo() {
  return merge([
    part(G.cyl(0.9, 1.7, 4, 7), 0, 2, 0, [0.22, 0.16, 0.12]),
    part(G.cyl(0.5, 0.9, 4, 7), 0, 6, 0, [0.26, 0.18, 0.12]),
    part(G.cyl(0.28, 0.5, 3, 6), 0, 9.5, 0, [0.3, 0.2, 0.1]),
    part(G.cyl(0.32, 0.32, 0.4, 6), 0, 11, 0, [0.08, 0.04, 0.03])
  ]);
}
function limpetGeo() {
  return merge([part(G.cone(0.25, 0.32, 5), 0, 0.16, 0, W)]);
}
// the bladder: a unit-height stalk; instance y-scale stretches it from the floor to the surface, so parts that must stay thin are built nearly
// flat. A species since v11.67 (it was the last kept one-variant weed, `bladderGeo` with vid0) so it can carry the exposure ecotype: exposed a
// thick stalk with three floats and short blades, sheltered a thin one with five floats and long ones. Its own vertex colours, under the pigment
function bladderB(rg,k){const ex=k/2,P=[part(G.cyl(lerp(0.10,0.17,ex),lerp(0.2,0.32,ex),1,6),0,0.5,0,[0.4,0.42,0.2])],nf=5-k,bl=lerp(3.0,1.7,ex),bw=lerp(0.55,0.42,ex);
  for(let i=0;i<nf;i++){const y=0.6+i*(0.4/nf)+rg()*0.02,a=i*1.3+rg()*0.4;
    P.push(part(G.sph(0.5,6,5),0,y,0,[0.68,0.72,0.36],{s:[1,0.014,1]}));
    P.push(part(G.box(bl,0.002,bw),bl*0.42,y-0.04,0,[0.45,0.55,0.25],{r:[0,a,0]}));
    P.push(part(G.box(bl,0.002,bw),-bl*0.42,y-0.06,0,[0.42,0.52,0.24],{r:[0,a+1.6,0]}));}
  return {P:P};}
// ---------- rock ----------
// Every rock here is a dodecahedron (three's DodecahedronGeometry(1,0) figure, circumradius 1) because physics.js addRock
// makes its exact twelve-plane collider. rockGeo draws that same figure with each pentagon split into five facets from a
// centre pushed a little *inward* (a spalled, chiselled read — the person saw the big single lumps as "only a few faces",
// low-poly against the boulder-covered ground) and a shade per facet, so a lump shows sixty facets and still stays inside
// its own collision planes: only the face centres move, and only in. 60 tris against the plain dodecahedron's 36; the small
// boulders (330-420 a cell) keep the plain one. DODEC: the figure's vertices and its faces as five vertex indices each,
// ordered round physics.js DN[k] so the triangles wind outward.
const DODEC = (function () {
  const t = (1 + Math.sqrt(5)) / 2,
    r = 1 / t,
    V = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) V.push([a, b, c]);
  for (const a of [-1, 1])
    for (const b of [-1, 1]) {
      V.push([0, a * r, b * t]);
      V.push([a * r, b * t, 0]);
      V.push([b * t, 0, a * r]);
    }
  const vs = V.map(v => {
    const l = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / l, v[1] / l, v[2] / l];
  });
  const faces = DN.map(n => {
    const on = [];
    for (let i = 0; i < 20; i++) {
      const v = vs[i];
      if (v[0] * n[0] + v[1] * n[1] + v[2] * n[2] > 0.7) on.push(i);
    }
    const ax = Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0];
    let u = [n[1] * ax[2] - n[2] * ax[1], n[2] * ax[0] - n[0] * ax[2], n[0] * ax[1] - n[1] * ax[0]];
    const ul = Math.hypot(u[0], u[1], u[2]);
    u = [u[0] / ul, u[1] / ul, u[2] / ul];
    const w = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
    const ang = i => {
      const v = vs[i];
      return Math.atan2(v[0] * w[0] + v[1] * w[1] + v[2] * w[2], v[0] * u[0] + v[1] * u[1] + v[2] * u[2]);
    };
    on.sort((i, j) => ang(i) - ang(j));
    return on;
  });
  return {v: vs, f: faces};
})();
// r circumradius; rg the kit's rng; dent the deepest face centre as a fraction of the inradius (each face 0.4-1 of it); jit the shade
// spread; lvl the facet level. lvl 1: each pentagon as five facets from its dented centre (60 tris). lvl 2 (since v9.6): each of those
// split in four at its edge midpoints, every midpoint pulled a little toward the figure's centre — the figure is convex about it, so
// the lump still stays inside its twelve collision planes (an edge midpoint drawn in makes a crease along the block's edge) — with a
// shade per facet on top of a shade per face: the coarse planes of a fractured block with fine spall on them (240 tris). The person
// saw a big single lump as "fewer polygons" beside the boulder-covered ground and wanted the higher-polygon look; the kits and the
// arches use lvl 2, the ledges (up to ~120 a cell on the massif) lvl 1, and the small boulders keep the plain 36-tri figure.
// Midpoints are cached by edge (shared by two faces) and by spoke (shared by two facets of a face), so the facets meet without cracks.
// The colour attribute is 1±jit grey, multiplied into the part's colour by merge().
function rockGeo(r, rg, dent, jit, lvl) {
  const pos = [],
    col = [],
    mid = {};
  lvl = lvl || 1;
  const midOf = (key, a, b) => {
    let m = mid[key];
    if (!m) {
      const s = 1 - dent * (0.1 + 0.5 * rg());
      m = [((a[0] + b[0]) / 2) * s, ((a[1] + b[1]) / 2) * s, ((a[2] + b[2]) / 2) * s];
      mid[key] = m;
    }
    return m;
  };
  const tri = (a, b, c, sh) => {
    pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    for (let m = 0; m < 3; m++) col.push(sh, sh, sh);
  };
  for (let k = 0; k < 12; k++) {
    const f = DODEC.f[k],
      n = DN[k],
      d = DINR * r * (1 - dent * (0.4 + 0.6 * rg())),
      c = [n[0] * d, n[1] * d, n[2] * d],
      fs = 1 + (rg() - 0.5) * jit;
    for (let i = 0; i < 5; i++) {
      const ia = f[i],
        ib = f[(i + 1) % 5],
        a = DODEC.v[ia].map(x => x * r),
        b = DODEC.v[ib].map(x => x * r),
        sh = () => fs * (1 + (rg() - 0.5) * 2 * jit);
      if (lvl < 2) {
        tri(a, b, c, sh());
        continue;
      }
      const mab = midOf(ia < ib ? ia + '-' + ib : ib + '-' + ia, a, b),
        mbc = midOf(k + ':' + ib, b, c),
        mca = midOf(k + ':' + ia, c, a);
      tri(a, mab, mca, sh());
      tri(mab, b, mbc, sh());
      tri(mca, mbc, c, sh());
      tri(mab, mbc, mca, sh());
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}
const ROCK_DENT = 0.035,
  ROCK_JIT = 0.07,
  ROCK_LVL = Q.rockLvl; // a 30-radius lump's face centres sit at most one unit inside its collider; the shade spread that shows the facets
// A rock kit: a cluster of lumps with per-lump shade. Returns the geometry and its collision lumps (local units: each
// lump's centre, circumradius, stretch and tilt — physics.js addLumps makes a twelve-plane rock of each). The facets get their own
// rng seeded by one draw of the kit's, so the facet level doesn't move the lumps (v9.3-v9.5 drew the facets from the kit's stream:
// this build's kits are laid out a little differently from theirs, once).
function rockLump(P, lumps, r, x, y, z, sx, sy, sz, rot, shade, rg, lvl) {
  const g = rg ? rockGeo(r, mulberry((rg() * 4294967296) >>> 0), ROCK_DENT, ROCK_JIT, lvl || ROCK_LVL) : new THREE.DodecahedronGeometry(r, 0);
  P.push(part(g, x, y, z, [shade, shade * 1.03, shade * 1.08], {r: rot, s: [sx, sy, sz]}));
  lumps.push({x: x, y: y, z: z, r: r, s: [sx, sy, sz], rot: rot});
}
// the highest point of a kit's lumps in local units (for `top` on the FLORA entry): the figure's vertices through each lump's transform
const _lm = new THREE.Matrix4(),
  _lq = new THREE.Quaternion(),
  _le = new THREE.Euler(),
  _lv = new THREE.Vector3(),
  _lp = new THREE.Vector3(),
  _ls = new THREE.Vector3();
function lumpsTop(lumps) {
  let top = -1e9;
  for (const l of lumps) {
    _le.set(l.rot[0], l.rot[1], l.rot[2]);
    _lq.setFromEuler(_le);
    _lp.set(l.x, l.y, l.z);
    _ls.set(l.s[0] * l.r, l.s[1] * l.r, l.s[2] * l.r);
    _lm.compose(_lp, _lq, _ls);
    for (const v of DODEC.v) {
      _lv.set(v[0], v[1], v[2]).applyMatrix4(_lm);
      if (_lv.y > top) top = _lv.y;
    }
  }
  return top;
}
// lumpsFoot: how far a kit reaches from its origin in x-z, local units (the footprint a placer measures the ground's tilt over)
function lumpsFoot(lumps) {
  let f = 0;
  for (const l of lumps) f = Math.max(f, Math.hypot(l.x, l.z) + l.r * Math.max(l.s[0], l.s[2]));
  return f;
}
function kit(P, lumps) {
  return {geo: merge(P), lumps: lumps, top: lumpsTop(lumps), foot: lumpsFoot(lumps)};
}
// ---- the four rock forms (v10.5). Every rock in the world is one of these, at some size, set on the ground by one rule
// (chunks.js settleOn). There are no place-specific rocks: the fields say where each form is common (young = the collapse's
// fan, where the rock is broken; sub = bare rock anywhere) and nothing reads a place.
// block: one lump (boulderGeo, above): talus, a boulder field on the fan, the odd erratic on sand
// heap: a hummock's carapace — fifteen blocks of much the same size piled two courses high, wide and low (v11.19; to v11.18 one
// big lump with four satellites: the person saw it as a videogame rock). A debris-avalanche hummock is a heap of shattered blocks
// with a size set by the fall, so the blocks are alike; nine on the ground (a ring and a centre), four on their shoulders, two on
// top. Height ~1.2, width ~3: at scale 16 a 48 m pile of 14 m blocks. Level-2 facets, 3600 tris. The base course is centred at y ~0.08:
// with sink 0.25 its blocks show their top third and the second course stands clear — a dome of blocks, its feet in the ground.
function heapGeo(seed) {
  const rg = mulberry(seed),
    P = [],
    lumps = [],
    R3 = () => [rg() * TAU, rg() * TAU, rg() * TAU];
  const blk = (r, d, a, y, sh) => rockLump(P, lumps, r, Math.cos(a) * d, y, Math.sin(a) * d, 0.9 + rg() * 0.3, 0.72 + rg() * 0.25, 0.9 + rg() * 0.3, R3(), sh + rg() * 0.22, rg);
  blk(0.4 + rg() * 0.1, 0, 0, 0.04, 0.84);
  for (let i = 0; i < 8; i++) blk(0.36 + rg() * 0.14, 0.62 + rg() * 0.4, (i / 8) * TAU + rg() * 0.5, 0.02 + rg() * 0.12, 0.84);
  for (let i = 0; i < 4; i++) blk(0.36 + rg() * 0.12, 0.28 + rg() * 0.26, (i / 4) * TAU + 0.4 + rg() * 0.6, 0.44 + rg() * 0.1, 0.88);
  for (let i = 0; i < 2; i++) blk(0.34 + rg() * 0.12, rg() * 0.22, rg() * TAU, 0.8 + rg() * 0.08, 0.9);
  return kit(P, lumps);
}
// sheet: seven wide flat lumps, shingled — the slide's coherent blocks lying in the fan (Earth's proof: the toreva blocks of
// every big flank slump). What the person liked in the rockfall: rock "completely covering the ground, flat and wide". Flat-lying
// (tilts ±0.03/±0.06 rad) and thin (0.3): a tilted plate this wide floats at its edge
function sheetGeo(seed) {
  const rg = mulberry(seed),
    P = [],
    lumps = [];
  rockLump(P, lumps, 1, 0, 0, 0, 1.35, 0.3, 1.1, [(rg() - 0.5) * 0.06, rg() * TAU, (rg() - 0.5) * 0.06], 0.95 + rg() * 0.1, rg);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + rg() * 0.8,
      d = 0.85 + rg() * 0.55,
      r = 0.5 + rg() * 0.4;
    rockLump(
      P,
      lumps,
      r,
      Math.cos(a) * d,
      -0.02 + rg() * 0.14,
      Math.sin(a) * d,
      1.1 + rg() * 0.45,
      0.24 + rg() * 0.12,
      0.9 + rg() * 0.4,
      [(rg() - 0.5) * 0.12, rg() * TAU, (rg() - 0.5) * 0.12],
      0.85 + rg() * 0.25,
      rg
    );
  }
  return kit(P, lumps);
}
// stack: five lumps stacked, the "snowman" — only the cairns on the pit's rim (CAIRNS): the person liked it as an oddity, once
function stackGeo(seed) {
  const rg = mulberry(seed),
    P = [],
    lumps = [];
  rockLump(P, lumps, 1.2, 0, 0.2, 0, 1.3, 0.6, 1.3, [0, rg() * TAU, 0], 0.9, rg);
  const ys = [0.55, 1.45, 2.25, 2.9],
    rs = [1.0, 0.85, 0.7, 0.5];
  for (let i = 0; i < 4; i++)
    rockLump(
      P,
      lumps,
      rs[i],
      (rg() - 0.5) * 0.3,
      ys[i],
      (rg() - 0.5) * 0.3,
      0.9 + rg() * 0.3,
      0.85 + rg() * 0.3,
      0.9 + rg() * 0.3,
      [rg() * 0.3, rg() * TAU, rg() * 0.3],
      0.88 + rg() * 0.2,
      rg
    );
  return kit(P, lumps);
}
// ledge: three flat lumps in a row with a chunk under them — strata on a steep face, laid along the contour (chunks.js placeCliffs)
function ledgeGeo(seed) {
  const rg = mulberry(seed),
    P = [],
    lumps = []; // facet level 1: up to ~120 a cell on a cliff
  for (let i = -1; i <= 1; i++)
    rockLump(
      P,
      lumps,
      0.95,
      i * 0.85 + (rg() - 0.5) * 0.2,
      (rg() - 0.5) * 0.12,
      (rg() - 0.5) * 0.2,
      1.0 + rg() * 0.25,
      0.42 + rg() * 0.15,
      0.7 + rg() * 0.2,
      [rg() * 0.3, rg() * TAU, rg() * 0.3],
      0.88 + rg() * 0.2,
      rg,
      1
    );
  rockLump(P, lumps, 0.55, (rg() - 0.5) * 0.8, -0.38, 0.25, 1, 0.8, 1, [rg() * TAU, rg() * TAU, rg() * TAU], 0.84, rg, 1);
  return kit(P, lumps);
}
const HEAP_A = heapGeo(7),
  HEAP_B = heapGeo(19),
  SHEET_A = sheetGeo(41),
  SHEET_B = sheetGeo(53),
  STACK = stackGeo(3),
  LEDGE = ledgeGeo(23);
const ROCKT = [
  [0.34, 0.37, 0.41],
  [0.3, 0.32, 0.34],
  [0.4, 0.39, 0.37]
]; // basalt, three greys
// a rock entry: a kit (geo, lumps, top, foot) or a single block (boulderGeo with its {d:1} collider), the rock material, the palette
function rock(id, k, o) {
  return Object.assign(
    k ? {id: id, geo: k.geo, lumps: k.lumps, top: k.top, foot: k.foot} : {id: id, geo: boulderGeo(), col: [{d: 1}]},
    {mat: MATROCK, tints: ROCKT, sx: [0.7, 1.3]},
    o
  );
}
// the tidal forest (v11; FLORA, the strand): the 6-9 m tide band is the one place a rigid trunk reaching for light is the winning form —
// in air, where buoyancy is no help and drag is the wind's. A weed of the bladder line that stood up: a stem thick enough to stand in
// air, propped on splayed struts (the water takes the base twice a day; on sand a holdfast has nothing to hold, so it stands on legs),
// a crown of flat blade-heads above the reach of the springs. The strand's scrub is its dwarf. Three sizes (7, 10.5, 14 m); the trunk
// and the props collide, the crown is soft. It lines the lagoon side of the rim and the lee shores, where the surf can't reach it.
// ---------- the greens in air (TAXA): jointed axes carried onto the tide band and the land ----------
// The greens' signature is the jointed axis — segments, nodes, stiff rounded parts — and the line that stood up in air kept it: the
// tidewood is a jointed trunk with a whorl of short branches at every node and a brush at the top (the first things to stand in air
// on Earth were leafless jointed axes; a trunk with whorls came before a leaf), never a bark-and-canopy tree. Bright green
// (pigment: land light), the trunk paler than the whorls. The base stands in water twice a day, on sand: props, not a holdfast.
const JOINT = [0.9, 0.86, 0.66], // the trunk: tinted with the rest, paler
  NODE = [0.62, 0.56, 0.42]; // the node's dark ring
// a whorl of `n` short rods at a node, tilted `up` radians above level, tapering; kink: a second shorter rod off each tip
function whorl(P, x, y, z, n, len, w, up, rg, kink, col) {
  const c = col || W;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rg() * 0.5,
      el = up + (rg() - 0.5) * 0.35,
      L = len * (0.75 + rg() * 0.5),
      v = V3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)).multiplyScalar(L);
    P.push(part(G.cyl(w * 0.45, w, L * 1.04, 4, true), x + v.x / 2, y + v.y / 2, z + v.z / 2, c, {dir: v}));
    if (kink) {
      const v2 = V3(v.x * 0.7, Math.abs(v.y) * 0.4 + L * 0.35, v.z * 0.7).normalize().multiplyScalar(L * 0.55);
      P.push(part(G.cyl(w * 0.25, w * 0.45, L * 0.57, 3, true), x + v.x + v2.x / 2, y + v.y + v2.y / 2, z + v.z + v2.z / 2, c, {dir: v2}));
    }
  }
}
// a jointed axis: `axis` with rib (the alternate flares are the joints), a dark ring at every node. Returns the nodes.
function jointed(P, o, rg) {
  const N = axis(P, Object.assign({rib: true, col: JOINT}, o), rg);
  for (let k = 1; k < N.length - 1; k++) P.push(part(G.cyl(N[k].r * 1.12, N[k].r * 1.12, N[k].r * 0.5, o.sides || 6, true), N[k].x, N[k].y, N[k].z, NODE, {dir: N[k].d}));
  return N;
}
function tidewoodB(rg, k) {
  const P = [],
    col = [],
    H = 6 + k * 3,
    segs = 5 + k,
    r0 = 0.22 + k * 0.05;
  const N = jointed(P, {segs: segs, len: H, r0: r0, r1: r0 * 0.4, wander: 0.1, lean: 0.12, sides: 6}, rg),
    tip = N[N.length - 1];
  col.push({a: [0, 0, 0], b: [tip.x, tip.y, tip.z], r: r0 * 1.4});
  // props: the base is under water twice a day, on sand
  const np = 4 + Math.floor(rg() * 3);
  for (let i = 0; i < np; i++) {
    const a = (i / np) * TAU + rg() * 0.6,
      h1 = 1.0 + rg() * 1.4,
      d = 0.8 + rg() * 1.2 + h1 * 0.35,
      n = nodeAt(N, h1 / H);
    const b = V3(Math.cos(a) * d, -0.3, Math.sin(a) * d),
      tp = V3(n.x, h1, n.z),
      v = b.clone().sub(tp);
    P.push(part(G.cyl(0.05, 0.11, v.length() * 1.02, 4, true), tp.x + v.x / 2, tp.y + v.y / 2, tp.z + v.z / 2, JOINT, {dir: v}));
    col.push({a: [tp.x, tp.y, tp.z], b: [b.x, b.y, b.z], r: 0.11});
  }
  // whorls from the third node up, longer toward the top; a brush of upright rods at the tip
  for (let j = 2; j < N.length - 1; j++) {
    const t = j / (N.length - 1),
      n = N[j];
    if (n.y < 3.2) continue; // the springs reach 4.5: nothing tender below the water's top
    whorl(P, n.x, n.y, n.z, 6 + (j % 3), 0.9 + 1.7 * t, 0.09, 0.3 + 0.45 * t, rg, true);
  }
  whorl(P, tip.x, tip.y, tip.z, 8, 1.5, 0.07, 1.0, rg, true);
  P.push(part(G.cone(0.1, 0.9, 4), tip.x, tip.y + 0.45, tip.z, W));
  return {P: P, col: col};
}
// the reed: the tidewood's dwarf on the sheltered tide band — jointed leafless uprights in a clump, a whorl or two near the top;
// under water at high tide (the swamp you swim through), standing out of it at low
function reedB(rg, k) {
  const P = [],
    n = 3 + k;
  for (let i = 0; i < n; i++) {
    const a = rg() * TAU,
      d = i ? 0.12 + rg() * 0.25 : 0,
      x = Math.cos(a) * d,
      z = Math.sin(a) * d,
      H = 1.4 + rg() * 1.2 + k * 0.4;
    const N = jointed(P, {segs: 4, len: H, r0: 0.035, r1: 0.014, wander: 0.05, lean: 0.35, sides: 4, x: x, z: z, open: true}, rg);
    whorl(P, N[3].x, N[3].y, N[3].z, 3, 0.28, 0.02, 0.6, rg, false);
    whorl(P, N[2].x, N[2].y, N[2].z, 3, 0.22, 0.02, 0.5, rg, false);
  }
  return {P: P};
}
// the scrub: the dwarf on rain above the tide — a few jointed stems with dense short whorls, dark and dry
function scrubB(rg, k) {
  const P = [],
    DRY = [0.82, 0.78, 0.6],
    n = 2 + k;
  for (let i = 0; i < n; i++) {
    const a = rg() * TAU,
      d = i ? 0.15 + rg() * 0.3 : 0,
      H = 0.6 + rg() * 0.5 + k * 0.15;
    const N = axis(P, {segs: 3, len: H, r0: 0.05, r1: 0.025, wander: 0.2, lean: 0.5, sides: 4, rib: true, col: NODE, x: Math.cos(a) * d, z: Math.sin(a) * d, open: true}, rg);
    for (let j = 1; j < N.length; j++) whorl(P, N[j].x, N[j].y, N[j].z, 5, 0.22 + 0.1 * j, 0.03, 0.1, rg, false, DRY);
  }
  return {P: P};
}
// the tussock: a tuft of small jointed shoots, the greens' turf on rain
function tussockB(rg) {
  const P = [];
  for (let i = 0; i < 5; i++) {
    const a = rg() * TAU,
      lean = 0.15 + rg() * 0.45,
      L = 0.5 + rg() * 0.6,
      v = V3(Math.sin(lean) * Math.cos(a), Math.cos(lean), Math.sin(lean) * Math.sin(a)).multiplyScalar(L),
      x = (rg() - 0.5) * 0.2,
      z = (rg() - 0.5) * 0.2;
    P.push(part(G.cyl(0.008, 0.022, L * 0.55, 3, true), x + v.x * 0.27, v.y * 0.27, z + v.z * 0.27, [0.9, 0.86, 0.66], {dir: v}));
    P.push(part(G.cyl(0.004, 0.018, L * 0.5, 3, true), x + v.x * 0.8, v.y * 0.8, z + v.z * 0.8, W, {dir: v}));
  }
  return {P: P};
}
// ---------- the reds (TAXA): a rind — flat, tough, thin; paint on rock, sheets, balls ----------
// crust: two or three flat plates a hand thick stuck to the rock, overlapping; the founder form of the reds and the light's floor.
// Pink where it lays lime in bright water (the reef's crest: limerind), red-purple down the slope (rind) — one builder, the pigment
function crustB(rg, k) {
  const P = [],
    n = 2 + (k % 2);
  for (let i = 0; i < n; i++) {
    const r = 0.3 + rg() * 0.3,
      d = i ? 0.2 + rg() * 0.25 : 0,
      a = rg() * TAU;
    P.push(part(G.cyl(r, r * (0.8 + rg() * 0.15), 0.05 + i * 0.02, 7), Math.cos(a) * d, 0.025 + i * 0.02, Math.sin(a) * d, i % 2 ? W : [0.92, 0.9, 0.9], {r: [0, rg() * TAU, 0]}));
  }
  return {P: P};
}
// sandball: a lime rind that let go and rolls — a knobbly ball on the sand, alive on every side
function sandballB(rg, k) {
  const P = [],
    r = 0.12 + k * 0.04;
  P.push(part(G.sph(r, 6, 4), 0, r * 0.85, 0, W));
  for (let i = 0; i < 6; i++) {
    const a = rg() * TAU,
      el = rg() * 1.4,
      v = V3(Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el));
    P.push(part(G.cone(r * 0.28, r * 0.5, 4), v.x * r * 0.95, r * 0.85 + v.y * r * 0.95, v.z * r * 0.95, [0.92, 0.9, 0.9], {dir: v}));
  }
  return {P: P};
}
// redblade: the reds' sheet — one thin translucent blade on a stub, the last blade before the dark
function redbladeB(rg, k) {
  const P = [part(G.cyl(0.03, 0.05, 0.12, 4), 0, 0.06, 0, NODE)];
  const nb = 1 + (k % 2);
  for (let i = 0; i < nb; i++) bladeAt(P, 0, 0.1, 0, 0.7 + rg() * 0.5 + k * 0.2, 0.28 + rg() * 0.1, rg() * TAU, 0.9, 3, W, 1.2);
  return {P: P};
}
// darkrind (v11.67, SEAFLOOR §2–3's sill relict among the weeds): the reds' crust at the light's floor. The floor of the light is the water's,
// not a number: the island's flanks lie under fed water (plankton, `nut` ~0.5) and their reds stop at −150; the sill's summits stand in the
// basin's sparse water (`nut` 0.12, the clearest in the world) and reach exactly −150, so a rind that pays there pays a little deeper — one or
// two wide plates a finger thick, dark (all pigment for no light) with a pale growing edge, on bare rock swept clean. The one photosynthesis
// that touches the drowned shields. Nothing on ours or the giant lies in water clear enough: the pool draws nowhere but the sill
function darkrindB(rg,k){const P=[],n=1+(k%2);
  for(let i=0;i<n;i++){const r=0.42+rg()*0.28,d=i?0.3+rg()*0.25:0,a=rg()*TAU,x=Math.cos(a)*d,z=Math.sin(a)*d;
    P.push(part(G.cyl(r*1.1,r*1.02,0.016,8),x,0.008+i*0.012,z,[1.7,1.45,1.5],{r:[0,rg()*TAU,0]})); // the growing edge: a wider thinner disc under the plate, paler, showing as a rim
    P.push(part(G.cyl(r*0.96,r*(0.82+rg()*0.12),0.028,8),x,0.03+i*0.012,z,W,{r:[0,rg()*TAU,0]}));}
  return {P:P};}
// per: instances per cell at full tolerance, times env's tolerance per try. y: 'floor' (default) | 'surface' | 'mid'.
// eco (v11.67): the variant is the exposure ecotype (grow.js ecoK; the builder reads k 0 sheltered .. 2 exposed) instead of a random pick.
// chem: false opts an entry out of the place's stain (grow.js tintBy) — the rock and the surface floats never take it.
// photo: a weed — tinted by pigment(ground depth) per instance (grow.js). flow: turned across the current by flowYaw. band: [lo,hi] of
// ground height the species stands in. vars: from species() — each variant's own col/pads; top: the tallest variant's highest
// point, and anything that would stand into the air is shortened in y or skipped (rigid things, ladder, ribbon).
// field: noise scale that modulates density (thick and thin forests). rim: extra chance around the pit.
// maxSlope: steepest ground an instance may stand on (default 0.9; rocks 1.9; structures unlimited, they sink on slopes).
// leePer: density where the retention field (world.js leeW) is 1 (v11.81; canopyPer to v11.80). ys: y for surface flora (default -0.45).
// pocket: noise scale; the base density applies fully only inside pockets of that noise (~15% of area) and at 10% elsewhere.
// minH: lowest ground an instance may stand on (land plants stay above the wet sand).
// col: colliders per instance in local units: {s:[x,y,z,r]} a sphere, {a:[..],b:[..],r} a capsule, {e:[cx,cy,cz,ax,ay,az]} an
// ellipsoid (fans), {d:r} a dodecahedron of circumradius r (boulders: the rock's own twelve faces through the
// instance's stretch and tilt) (physics.js addFloraSolids).
// Flora without col or lumps is soft: the sway shader bends it away. (Pads — discs a body could stand on — went with the lily pads, v10.1.)
// lumps: a rock kit's lumps (local: centre, circumradius, stretch, tilt), each registered as a twelve-plane rock solid by the cell
// (from the far layer's list for a structure). A thing with lumps lies on the ground's tilt over its footprint `foot` (chunks.js settleOn).
// big: a structure. Kept clear of landmarks, scaled down so `top` (local height of its highest point) stays under the surface.
// tilt: a random attitude (single lumps: boulders; the sessile animals that stand askew). sink: how far into the ground, in units of scale.
// face: [R, rise] — only where the ground within R rises at least `rise` above the point (talus lies under a face). fit: a kit lies only
// where the ground over its footprint departs from the plane it lies on by at most `fit` × scale (v11.19; chunks.js settleOn).
// the old dome: a giant of the polyp line, a structure — a banded mound 14–26 wide grown over centuries on the shelf edge and the
// basalt flanks (FLORA.md, giants). One lump collider (its sphere sits inside the dodecahedron's inradius, so nothing sinks in)
function olddomeGeo(seed) {
  const rg = mulberry(seed),
    P = [];
  mound(P, {r: 0.76, sq: 0.55, bands: 5, col: [0.9, 0.9, 0.9], sw: 9, sh: 6}, rg, 0, 0, 0);
  return kit(P, [{x: 0, y: 0, z: 0, r: 1, s: [1, 0.62, 1], rot: [0, 0, 0]}]);
}
const OLDDOME = olddomeGeo(89);
// tint lists: the animals' lines (the weeds are painted by pigment(h) at placement; their list only colours the far impostors)
const VIVID = [
    [0.9, 0.5, 0.6],
    [0.7, 0.5, 0.9],
    [0.55, 0.85, 0.5],
    [0.95, 0.7, 0.35],
    [0.5, 0.75, 0.9]
  ],
  VIVID2 = [
    [0.7, 0.55, 0.45],
    [0.55, 0.7, 0.5],
    [0.65, 0.5, 0.7],
    [0.8, 0.65, 0.4]
  ],
  RUSTS = [
    [0.66, 0.34, 0.14],
    [0.6, 0.3, 0.12],
    [0.72, 0.42, 0.2]
  ],
  DULL = [
    [0.75, 0.7, 0.6],
    [0.6, 0.6, 0.62],
    [0.65, 0.55, 0.45]
  ],
  CROWNT = [
    [1, 1, 1],
    [0.95, 0.92, 1],
    [0.9, 1, 0.95]
  ],
  SACT = [
    [0.82, 0.74, 0.62],
    [0.7, 0.62, 0.55],
    [0.6, 0.6, 0.63]
  ],
  RUSTB = [
    [0.75, 0.35, 0.12],
    [0.65, 0.3, 0.1],
    [0.8, 0.45, 0.2]
  ],
  GREENT = [[0.42, 0.56, 0.2]],
  FLOATT = [[0.52, 0.46, 0.18]],
  REDT = [[0.5, 0.2, 0.3]]; // the weeds' lists colour only the far impostors; pigment(h, line) paints the instances
const FLORA = [
  // weed
  // turf is the ground layer of the reef and, since v9.6, of the two forests (the strap there stood alone and read as dark sticks)
  // eco (v11.67): the ground layer and the forest read the waves (grow.js ecoK). young ≤ 0.45 on the forest and the canopy (v11.67, SEAFLOOR §2's
  // progression rule): a flow decades old carries crusts, turfs and rust, not a forest — kelp settles new lava within years but a tall canopy takes
  // longer than the rift arms, the fan's fresh blocks and the giant's flows have had; the turfs, the rinds and the rust forms keep their range
  species('turf', {mat: MATG, photo: true, line: 'green', tints: GREENT, s: [0.7, 1.5], per: 1200, env: {h: [-42, -1], sub: [0.5, 1]}, field: 0.02, eco: true}, turfB), // the greens' founder form and the reef's lawn; olive at its deep edge, then the floaters' wisp takes the ground
  species('wisp', {mat: MATG, photo: true, line: 'float', tints: FLOATT, s: [0.4, 1.6], per: 420, env: {h: [-82, -16], sub: [0.3, 1]}, field: 0.02, eco: true}, wispB), // the floaters' founder form, small and large: the forests' ground layer and their middle
  species('strap', {mat: MATG, photo: true, line: 'green', tints: GREENT, s: [0.6, 1.4], per: 2400, env: {h: [-42, -3], sub: [0.05, 0.45]}, field: 0.02}, strapB), // the flats' pasture only: dense, a lawn
  species('paddle', {mat: MATG, photo: true, line: 'green', tints: GREENT, s: [0.7, 1.4], per: 600, env: {h: [-26, -3], turb: [0.3, 1], sub: [0.05, 0.62]}, field: 0.02, eco: true}, paddleB), // the turbidity form (v11.67): surf over sand — a scrap of our windward shallows, the giant's whole windward shelf
  species(
    'chain',
    {mat: MATV, photo: true, line: 'green', tints: GREENT, s: [0.7, 1.6], tilt: true, per: 120, env: {h: [-28, -1], sub: [0.5, 1], expo: [0.3, 1]}, eco: true},
    chainB
  ),
  species('grape', {mat: MATV, photo: true, line: 'green', tints: GREENT, s: [0.7, 1.6], per: 140, env: {h: [-40, -6], sub: [0.15, 0.6]}, field: 0.02}, grapeB),
  species(
    'stipe',
    {
      mat: MATS,
      photo: true,
      line: 'float',
      tints: FLOATT,
      reach: true,
      per: 900,
      env: {h: [-54, -16], sub: [0.55, 1], nut: [0.45, 1], flow: [0.15, 0.85], young: [0, 0.45]},
      field: 0.012,
      eco: true
    },
    stipeB
  ),
  species(
    'ladder',
    {mat: MATM, photo: true, line: 'float', tints: FLOATT, s: [0.7, 1.3], tilt: true, per: 130, env: {h: [-66, -16], sub: [0.5, 1], nut: [0.4, 1], young: [0, 0.45]}, field: 0.014, eco: true},
    ladderB
  ),
  species(
    'ribbon',
    {mat: MATM, photo: true, line: 'float', tints: FLOATT, s: [0.7, 1.3], per: 70, env: {h: [-78, -16], sub: [0.45, 1], nut: [0.35, 1], young: [0, 0.45]}, field: 0.014, eco: true},
    ribbonB
  ),
  species(
    'bladder',
    {
      mat: MATB,
      photo: true,
      line: 'float',
      tints: [
        [0.62, 0.6, 0.3],
        [0.66, 0.56, 0.28]
      ],
      reach: true,
      per: 95,
      env: {h: [-80, -30], sub: [0.45, 1], nut: [0.3, 1], young: [0, 0.45]},
      eco: true
    },
    bladderB
  ), // a species since v11.67 (three variants: the ecotype); its card is far.js FAR_IMP's, as before
  // (the raft, the floater that let go, was struck 9 Sep 2026: "looks terrible"; the surface's weed is gone — TAXA)
  species('stranded', {mat: MATVD, tints: [[0.72, 0.7, 0.9], [0.8, 0.7, 0.86], [0.66, 0.66, 0.78]], s: [0.8, 1.6], tilt: true, per: 26, env: {h: [0.4, 2.6], expo: [0.5, 1]}, minH: 0.4, field: 0.03}, strandedB), // a dead sailer on the windward strand (DRIFTERS: fleets strand where the wind drives them)
  // the drifters' floats: the button, in fleets (the sailers are creatures)
  species(
    'button',
    {
      mat: MATR,
      tints: [
        [0.62, 0.86, 0.78],
        [0.56, 0.8, 0.86],
        [0.66, 0.88, 0.7]
      ],
      s: [0.8, 1.5],
      y: 'surface',
      ys: -0.08,
      per: 4,
      env: {h: [-800, -30], shel: [0, 0.1]},
      pocket: 0.006,
      leePer: 60
    },
    buttonB
  ),
  // polyps
  species('table', {mat: MATV, tints: VIVID, s: [0.6, 1.6], tilt: true, per: 55, env: {h: [-24, -6], sub: [0.6, 1], nut: [0, 0.55]}}, tableB),
  species('horn', {mat: MATV, tints: VIVID, s: [0.6, 1.6], tilt: true, per: 90, env: {h: [-24, -6], sub: [0.6, 1], nut: [0, 0.55]}}, hornB),
  species('rusthorn', {mat: MATV, tints: RUSTS, s: [0.6, 1.5], tilt: true, per: 36, env: {h: [-150, -4], young: [0.4, 1], sub: [0.5, 1]}}, hornB),
  species(
    'dome',
    {mat: MATV, tints: VIVID2, s: [0.6, 1.8], tilt: true, sx: [0.8, 1.25], per: 26, env: {h: [-24, -6], sub: [0.6, 1], nut: [0, 0.55]}},
    domeB
  ),
  species(
    'rustdome',
    {mat: MATV, tints: RUSTS, s: [0.7, 2.0], tilt: true, sx: [0.8, 1.25], per: 18, env: {h: [-150, -4], young: [0.4, 1], sub: [0.5, 1]}},
    domeB
  ),
  species('bommie', {mat: MATV, tints: VIVID, s: [0.8, 1.5], per: 14, env: {h: [-24, -6], flow: [0.6, 1], sub: [0.5, 1]}}, (rg, k) =>
    bommieB(rg, k, 3.6 + k * 0.5, 4)
  ),
  species(
    'tower',
    {mat: MATV, tints: DULL, s: [0.7, 1.2], tilt: true, per: 16, env: {h: [-150, -60], flow: [0, 0.4], sub: [0.5, 1], slope: [0, 0.5]}},
    (rg, k) => bommieB(rg, k, 4.5 + k * 0.8, 4) // 4.5–6 m (v11.20; was 11–14 × 1.4): a single fisher colony stood up out of the terrace's silt layer — nothing keeps a dead base defended for the centuries a taller one would take (REEF.md, The sizes)
  ),
  {
    id: 'fan',
    geo: fanGeo(),
    mat: MAT,
    col: [{e: [0, 1.0, 0, 1.0, 1.05, 0.3]}],
    tints: [
      [0.9, 0.45, 0.5],
      [0.95, 0.6, 0.3],
      [0.7, 0.5, 0.85],
      [0.95, 0.8, 0.5]
    ],
    s: [0.5, 1.6],
    tilt: true,
    flow: true,
    per: 200,
    env: {h: [-150, -6], flow: [0.45, 1], sub: [0.5, 1]}
  },
  species(
    'pen',
    {
      mat: MATW,
      tints: [
        [0.85, 0.78, 0.78],
        [0.75, 0.7, 0.78]
      ],
      s: [0.7, 1.6],
      flow: true,
      per: 110,
      env: {h: [-450, -18], flow: [0.3, 1], sub: [0, 0.4]}
    },
    penB
  ),
  // crowns
  species(
    'lily',
    {mat: MATV, tints: CROWNT, s: [0.7, 1.6], flow: true, per: 140, env: {h: [-300, -50], flow: [0.4, 1], sub: [0.5, 1], slope: [0, 0.4]}},
    lilyB
  ),
  species('tulip', {mat: MATV, tints: CROWNT, s: [0.7, 1.5], per: 45, env: {h: [-150, -15], sub: [0.3, 0.9]}}, tulipB),
  species(
    'loop',
    {
      mat: MATV,
      tints: [
        [0.5, 0.62, 0.3],
        [0.55, 0.55, 0.32],
        [0.6, 0.5, 0.35]
      ],
      s: [0.7, 1.6],
      tilt: true,
      per: 45,
      env: {h: [-60, -6], sub: [0.5, 1]}
    },
    loopB
  ),
  species('plume', {mat: MATV, tints: [[1, 1, 1], [0.96, 0.94, 0.92]], s: [0.7, 1.6], per: 110, env: {heat: [0.3, 1]}, field: 0.03, maxSlope: 1.4, chem: false}, plumeB), // the vents; chem:false (v11.67): the sulfur stain would wash the crown's iron-blood red, the thing to see
  species(
    'seep',
    {mat: MATV, tints: [[1, 1, 1], [0.9, 0.9, 0.92]], s: [0.8, 1.5], per: 70, env: {h: [-464, -444], sub: [0.3, 1]}, band: [-464, -444], field: 0.02, maxSlope: 1.4},
    seepB
  ), // the rim: a line round the world at the chemocline
  species(
    'stilt',
    {mat: MATV, tints: [[1, 1, 1], [0.95, 0.9, 0.84], [0.82, 0.62, 0.5]], s: [0.7, 1.6], flow: true, per: 40, env: {h: [-150, -5], sub: [0.3, 0.85], flow: [0.25, 1]}, field: 0.02},
    stiltB
  ), // the propped shell: rubble and silt in a current, the rockfall above all
  // cones: the tide band and the surf, in crowds; on the arch's legs and the skerries where the current runs
  species(
    'cone',
    {
      mat: MATV,
      tints: [
        [1, 1, 1],
        [0.95, 0.9, 0.85]
      ],
      s: [1, 2.5],
      per: 180,
      env: {h: [-7, 2.6, 3], sub: [0.55, 1], expo: [0.5, 1]},
      maxSlope: 1.6
    },
    coneB
  ),
  species('nod', {mat: MATW, tints: [[1, 1, 1], [0.95, 0.92, 0.85]], s: [0.7, 1.5], flow: true, per: 90, env: {h: [-150, -8], flow: [0.55, 1], sub: [0.6, 1]}, field: 0.02}, nodB), // the stalked cone, in the jet
  // sacs
  species('tube', {mat: MATV, tints: SACT, s: [0.5, 1.4], per: 120, env: {h: [-150, -6], sub: [0.5, 1], flow: [0.3, 1]}}, tubeB),
  species('cup', {mat: MATV, tints: SACT, s: [0.6, 1.6], per: 110, env: {h: [-150, -6], sub: [0.4, 1]}}, cupB),
  species('burr', {mat: MATV, tints: SACT, s: [0.6, 1.6], per: 55, env: {h: [-150, -6], sub: [0.4, 1]}}, burrB),
  species('star', {mat: MATV, tints: SACT, s: [0.6, 1.5], per: 50, env: {h: [-150, -6], sub: [0.2, 0.7]}}, starB),
  species('vase', {mat: MATV, tints: SACT, s: [0.7, 1.5], per: 60, env: {h: [-300, -40], sub: [0.5, 1], flow: [0.1, 0.7]}, field: 0.02}, vaseB), // was `sponge` at 7:230
  species(
    'glass',
    {
      mat: MATV,
      tints: [
        [1, 1, 1],
        [0.95, 0.97, 1]
      ],
      s: [0.8, 1.8],
      per: 40,
      env: {h: [-450, -140], sub: [0, 0.5], heat: [0, 0.2]}
    },
    glassB
  ),
  species(
    'frond',
    {
      mat: MATM,
      tints: [
        [1, 1, 1],
        [0.9, 0.95, 0.9]
      ],
      s: [0.7, 1.6],
      per: 60,
      env: {h: [-450, -140], sub: [0, 0.6], heat: [0, 0.2]}
    },
    frondB
  ),
  species('barrel', {mat: MATV, tints: SACT, s: [0.7, 1.6], per: 24, env: {h: [-300, -60], flow: [0, 0.5], sub: [0.4, 1]}}, barrelB),
  // mats
  species('beard', {mat: MATV, tints: RUSTB, s: [0.7, 1.8], per: 200, env: {h: [-150, -3], young: [0.5, 1], sub: [0.55, 1]}, maxSlope: 1.6}, beardB),
  species('iron', {mat: MATV, tints: RUSTB, s: [0.7, 1.8], tilt: true, sx: [0.8, 1.3], per: 22, env: {h: [-150, -10], young: [0.5, 1]}}, ironB),
  species('mat', {mat: MATV, tints: [[1, 1, 0.95], [1, 0.95, 0.55], [0.95, 0.9, 0.75]], s: [0.8, 1.6], per: 260, env: {heat: [0.18, 1]}, field: 0.03, maxSlope: 1.6}, matB([0.95, 0.94, 0.8])), // sulfur: white and yellow round the vents
  species('greymat', {mat: MATV, tints: [[0.6, 0.6, 0.62], [0.5, 0.5, 0.5], [0.42, 0.4, 0.42]], s: [0.8, 1.6], per: 220, env: {h: [-800, -452]}, band: [-800, -452], field: 0.03, maxSlope: 1.6}, matB([0.8, 0.8, 0.82])), // below the chemocline: grey and black, and nothing else
  // the reds (TAXA): a rind, the light's floor and the reef's glue. rind paints the slope's rock red-purple from the greens' edge to −150;
  // limerind is the same crust laying lime in the bright pounded water of the crest and the skerries (pink; a real reef's crest is this,
  // not polyps); sandball is a lime rind that let go; redblade the reds' one sheet
  species('rind', {mat: MATV, photo: true, line: 'red', tints: REDT, s: [0.6, 1.6], tilt: true, sx: [0.8, 1.3], per: 380, env: {h: [-150, -24], sub: [0.55, 1]}, field: 0.02, maxSlope: 1.6}, crustB),
  species('limerind', {mat: MATV, photo: true, line: 'red', tints: [[0.8, 0.6, 0.62]], s: [0.7, 1.8], tilt: true, sx: [0.8, 1.3], per: 260, env: {h: [-26, 2.6], sub: [0.55, 1], expo: [0.35, 1]}, maxSlope: 1.6}, crustB),
  species('sandball', {mat: MATV, photo: true, line: 'red', tints: REDT, s: [0.7, 1.5], tilt: true, per: 90, env: {h: [-60, -8], sub: [0.05, 0.45]}, field: 0.02}, sandballB),
  species('redblade', {mat: MATM, photo: true, line: 'red', tints: REDT, s: [0.8, 1.6], per: 100, env: {h: [-150, -48], sub: [0.5, 1]}, field: 0.02}, redbladeB),
  species('darkrind', {mat: MATV, photo: true, line: 'red', tints: REDT, s: [0.8, 2.0], tilt: true, sx: [0.8, 1.4], per: 220, env: {h: [-172, -142, 6], sub: [0.6, 1], nut: [0, 0.2], young: [0, 0.3]}, field: 0.02, maxSlope: 1.6}, darkrindB), // the reds at the light's floor in the clearest water (v11.67): the sill's summits, −150 and the twenty metres under it; nut ≤ 0.2 is the basin's water, and no island flank has it
  // rock (the four forms above; one placement rule, chunks.js settleOn; DESIGN Structures, "Where rock goes" — v11.19). The block:
  // the fan's boulder field and the rift arms' rubble (young), a scatter on bare rock that a block can rest on (sub; maxSlope 1.2:
  // nothing sits on a face), a few on sand and mud, and talus — blocks at the foot of a face (`face`: the ground rises 6 within 14),
  // which is where the risers, the scarp, the dike flanks and the rim shed to
  rock('boulder', null, {s: [1, 4.5], sink: 0.35, tilt: true, maxSlope: 1.9, per: 330, env: {sub: [0.55, 0.78], young: [0.4, 1]}, rim: 0.7}), // the fan's boulder field (and a ring round the pit)
  rock('boulder2', null, {s: [1, 4], sink: 0.35, tilt: true, maxSlope: 1.2, per: 60, env: {sub: [0.72, 1]}}), // the odd block on bare rock
  rock('boulder3', null, {s: [1, 3.5], sink: 0.45, tilt: true, maxSlope: 1.9, per: 12, env: {sub: [0.05, 0.5]}}), // the odd one on sand and mud
  rock('talus', null, {s: [0.8, 3.2], sink: 0.4, tilt: true, maxSlope: 1.2, per: 420, env: {sub: [0.2, 1], young: [0, 0.5]}, face: [14, 6]}), // at the foot of every face: the terraces' risers, the scarp, the dikes, the rim (the fan and the arms have their own rubble)
  // the greens in air (TAXA): the tidal forest, the reed margin, the rain scrub — one line, jointed, relicts of a bigger island
  species(
    'tidetree',
    {mat: MATTR, photo: true, line: 'green', tints: GREENT, s: [0.8, 1.3], air: true, per: 700, env: {h: [-3.5, 2.8], expo: [0, 0.75], young: [0, 0.45]}, field: 0.02, minH: -3.6, maxSlope: 0.5},
    tidewoodB
  ), // the tidewood: the tide band, out of the surf, and off the last flows (young, v11.67: a wood is decades; the reed and the tussock keep the flows)
  species(
    'reed',
    {mat: MATGL, photo: true, line: 'green', tints: GREENT, s: [0.7, 1.4], air: true, per: 900, env: {h: [-5.5, 1.6], expo: [0, 0.4]}, field: 0.02, maxSlope: 0.6},
    reedB
  ), // the reed-bed: the sheltered tide band (the rim's inner slope, the island's flat) — under water at high tide, a swamp of stems
  species('tussock', {mat: MATGL, photo: true, line: 'green', tints: GREENT, s: [0.5, 1.3], per: 1500, env: {h: [1.2, 60]}, field: 0.02, minH: 1.2}, tussockB),
  species('scrub', {mat: MATGL, photo: true, line: 'green', tints: GREENT, s: [0.7, 1.8], tilt: true, per: 110, env: {h: [2, 60]}, minH: 2}, scrubB),
  {
    id: 'chimney',
    geo: chimneyGeo(),
    mat: MAT,
    col: [
      {a: [0, 0, 0], b: [0, 4, 0], r: 1.3},
      {a: [0, 4, 0], b: [0, 11, 0], r: 0.6}
    ],
    tints: [
      [1, 1, 1],
      [1.1, 0.9, 0.8]
    ],
    s: [0.8, 3],
    tilt: true,
    per: 44,
    env: {heat: [0.45, 1]},
    vent: true,
    chem: false // v11.67: a chimney is black sulfide, not the mats' sulfur
  },
  {
    id: 'limpet',
    geo: limpetGeo(),
    mat: MAT,
    tints: [
      [0.55, 0.2, 0.1],
      [0.65, 0.3, 0.12]
    ],
    s: [0.7, 1.8],
    per: 260,
    env: {heat: [0.3, 1]},
    chem: false // v11.67: a vent grazer's shell is black sulfide (PLANET), never the mats' yellow
  },
  // structures (big: drawn by the far layer for the whole world, placed by far.js bigsFor; a cell registers only their collision)
  // heaps and sheets are the slide's (v11.19): young ≥ 0.8 is the fan where its debris is thick — the rift arms (0.7) and the fan's
  // thinning edges are out, and heat keeps them off the fissure. The biggest nearest the scarp (the fan is -85 there), smaller with
  // depth; every one must fit the ground over its footprint (`fit`: the ground's departure from the plane it lies on, in scales)
  rock('crag', HEAP_A, {s: [8, 20], sink: 0.25, per: 20, env: {h: [-180, -60], young: [0.8, 1], heat: [0, 0.05], sub: [0.5, 0.85]}, field: 0.009, fit: [0.35, 0.5], big: true}), // the fan's hummocks, near the scarp
  rock('crag2', HEAP_B, {s: [6, 14], sink: 0.25, per: 18, env: {h: [-300, -150], young: [0.8, 1], heat: [0, 0.05], sub: [0.5, 0.85]}, field: 0.009, fit: [0.35, 0.5], big: true}), // the same, out toward the apron
  rock('crag3', HEAP_B, {s: [4, 10], sink: 0.25, per: 1.5, env: {h: [-300, 3], sub: [0.6, 1]}, face: [16, 8], fit: [0.4, 0.5], big: true}), // a rockfall cone at the foot of a face: the dikes, the risers, the rim
  rock('slab', SHEET_A, {s: [6, 14], sink: 0.16, per: 12, env: {h: [-170, -60], young: [0.8, 1], heat: [0, 0.05], sub: [0.5, 0.85]}, field: 0.009, fit: [0.3, 0.55], big: true}), // the slide's coherent blocks, near the scarp
  rock('slab2', SHEET_B, {s: [5, 12], sink: 0.16, per: 10, env: {h: [-230, -100], young: [0.8, 1], heat: [0, 0.05], sub: [0.5, 0.85]}, field: 0.009, fit: [0.3, 0.55], big: true}),
  rock('tor', STACK, {s: [13, 28], sink: 0.15, per: 0, big: true}), // never by density: the cairns (CAIRNS) only
  {
    id: 'olddome',
    geo: OLDDOME.geo,
    lumps: OLDDOME.lumps,
    top: OLDDOME.top,
    foot: OLDDOME.foot,
    mat: MAT,
    tints: [
      [0.55, 0.5, 0.42],
      [0.6, 0.55, 0.4],
      [0.5, 0.55, 0.45]
    ],
    s: [14, 26],
    sink: 0.1,
    sx: [0.9, 1.2],
    per: 1,
    env: {h: [-150, -20], sub: [0.5, 1], nut: [0.4, 1]},
    field: 0.009,
    big: true
  }, // the first flora giant: a structure like the rock
  rock('ledge', LEDGE, {s: [5, 26], per: 0}) // never by density: chunks.js placeCliffs lays it on steep faces
];
const FLORA_BY_ID = {};
FLORA.forEach(f => {
  FLORA_BY_ID[f.id] = f;
});
// The cairns: seven tors — the stacked "snowmen" — in a ring on the pit's rim, among its rubble, where the pillars read as
// something put there. Placed structures: world space, appended to their cell's structure list by far.js bigsFor (same
// surface clamp and slope sink as any structure), so they draw with the far layer and collide as the cell's solids.
const CAIRNS = (function () {
  const rg = mulberry(4343),
    out = [],
    f = FLORA_BY_ID.tor;
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * TAU + (rg() - 0.5) * 0.35,
      d = 118 + rg() * 20;
    rg();
    out.push({
      f: f,
      x: PIT[0] + Math.cos(a) * d,
      z: PIT[1] + Math.sin(a) * d,
      sc: 10.5 + rg() * 3,
      yaw: rg() * TAU,
      sx: 0.95 + rg() * 0.1,
      sz: 0.95 + rg() * 0.1
    });
    rg();
  }
  return out;
})();
