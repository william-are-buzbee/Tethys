// creatures_spec.js — a species is a spec, a builder is a compiler (CREATOR.md, built v11.10). compile(spec, s, pal) turns a plain
// object — a core (the body) and a list of parts — into the same {g, anim, hit, rigs} every hand builder in creatures_builders.js
// returns, so nothing downstream (spawn, the AI, the zoo, the preview, the player) knows which way an animal was made. derive(spec)
// reads the numbers off the same object: mass, drag, thrust, speed, turn, hp, the movement mode, a cost in points, warnings.
// validate(spec) is the clade grammar: which cores and parts a clade may have, the parts it must have, and every parameter's
// range (a believable band, and a wider band the lab clamps at). SPECS holds every species of the roster (all of them since v11.25:
// the last eighteen hand builders became specs — CHANGELOG v11.25; the kit they compile from stays in creatures_builders.js).
// The coordinates in a spec are the hand builders' own: metres along +z at the authoring scale `s`, the nose forward.

// ---------- the clade grammar ----------
// cores: the body kinds a clade may build on. req: parts every animal of the clade carries (validate adds them if missing; the lab
// won't remove them). Ranges: a part parameter's range is {b:[lo,hi], x:[lo,hi]} — the believable band and the extreme band —
// in the units of its kind: 'len' and 'z' are multiplied by the core's reference length, 'n' counts, 'k' plain numbers.
const GRAMMAR = {
  ringmouths: {
    cores: ['mantle', 'coilbody', 'sac'],
    req: ['eyes:collar', 'mouth', 'arms'],
    density: 1.02,
    shell: 2.6,
    eye: 'a pale iris with a black pupil'
  },
  slowbloods: {cores: ['lathe', 'chain'], req: ['eyes:ring', 'mouth:tentacles', 'tail'], density: 1.06, shell: 1.6, eye: 'silver-grey'},
  hingeshells: {cores: ['trunk', 'shield', 'bean', 'arches'], req: ['mouth'], density: 1.12, shell: 1.8, eye: 'black beads', moult: true}, // moult (v11.66, PLANET): the clade sheds its exoskeleton — a soft state and a shed carapace (creatures_ai.js MOULT)
  // the drifters (DRIFTERS.md, v11.16; in the lab since v11.25): the ring kept radial and hung with stinging arms, no eyes, no mouth
  // parts — the bell pulses, the float sails; translucent (spec.mat 'glass')
  drifters: {cores: ['bell', 'float'], req: ['arms'], density: 1.01, shell: 1, eye: 'none'}
};
const CLADE_LIMIT = {ringmouths: 16, slowbloods: 16, hingeshells: 8, drifters: 5}; // half-length in metres a spec may claim before the calculator objects (PLANET; the veil is a 16 m ringmouth)
// The creator's own ceiling (v11.67.2, CREATOR.md "The size ceiling"). Two numbers, and they have to agree: `size` is the half-length a
// spec *claims* (DEFS reads it; derive warns when the geometry disagrees) and `s` is the build scale the geometry is actually multiplied
// by. A core's own length is clamped by its extreme band (the longest is trunk L 20), so the longest body expressible is 20 × SPEC_SCALE_MAX
// — 240 m, whose half-length is SPEC_SIZE_MAX. They were 30 and 10 as bare numbers in lab.js, which capped the geometry at 200 m while the
// claim could not exceed 60, so a big animal always warned "longer than its size says". Past this the world cannot host the animal at all
// (the doc's list: a creature belongs to one 215 m cell, and the far plane is 1600)
const SPEC_SIZE_MAX = 120, SPEC_SCALE_MAX = 12;
// a palette with every key any part reads, for the dry builds the defaults, the grammar and the calculator do
const DRY_PAL = (() => {
  const o = {};
  for (const k in PAL) for (const key in PAL[k]) if (!o[key]) o[key] = PAL[k][key];
  return o;
})();
function palk(pal) {
  for (let i = 1; i < arguments.length; i++) {
    const c = pal[arguments[i]];
    if (c) return c;
  }
  return [0.5, 0.5, 0.5];
}

// ---------- the cores ----------
// A core builds the body's static parts into ctx.P and returns the frame F: the extents (nose, tail), the reference length L, the
// radius/half-width/half-height along z, and the anchors the parts default to. anim(t,spd,st,B) is the body's own motion, hit the
// capsules, volume/area the calculator's inputs (at s=1; compile scales them).
const CORES = {
  // ringmouths, the jetters (buildJetter): a mantle L long and R round at the collar, tapering back into a tail knob, the collar sphere
  mantle: {
    clade: 'ringmouths',
    params: {L: {label: 'length', k: 'k', b: [0.6, 6], x: [0.3, 14], d: 2.5}, R: {label: 'mantle radius', k: 'k', b: [0.12, 1.6], x: [0.06, 4], d: 0.6}},
    build: (ctx, c) => {
      const P = ctx.P,
        pal = ctx.pal,
        L = c.L,
        R = c.R;
      P.push(part(G.cyl(R * 0.92, R * 0.28, L, 8), 0, 0, -L / 2 + 0.1, palk(pal, 'mantle', 'top'), {r: [HPI, 0, 0], c2: pal.belly}));
      P.push(part(G.sph(R * 0.3, 6, 5), 0, 0, -L + 0.1, palk(pal, 'mantle', 'top')));
      P.push(part(G.sph(R * 1.06, 8, 6), 0, 0, 0.2, palk(pal, 'mantle', 'top'), {s: [1, 0.92, 0.72], c2: pal.belly}));
      const rAt = z =>
        z > 0.2 ? R * 1.06 * Math.max(0, 1 - Math.pow((z - 0.2) / (R * 1.06 * 0.72), 2)) : lerp(R * 0.28, R * 0.92, (z + L - 0.1) / L);
      return {
        L: L,
        nose: 0.2 + R * 0.76,
        tail: -L + 0.1,
        Rmax: R * 1.06,
        rAt: rAt,
        wAt: rAt,
        hAt: z => rAt(z) * 0.92,
        zAt: u => lerp(0.2 + R * 0.76, -L + 0.1, u),
        sway: false,
        round: true,
        anchors: {
          collar: {z: 0.42, R: R * 0.98, r: R * 0.11, sy: 0.82, y0: 0},
          cluster: {y: R * 0.62, z: 0.55, R: R * 0.42, r: R * 0.17},
          mouth: {y: -R * 0.08, z: 0.72, R: R * 0.3},
          ring: {z: 0.62, R: R * 0.62},
          skirt: {z: -L * 0.7, R: R, h: R * 1.3, len: L * 0.42},
          ridge: {w: R * 0.2, h: R * 0.26, len: L * 0.72, y: R * 0.86, z: -L * 0.44}
        },
        anim: (t, spd, st, B) => {
          const pu = 1 + 0.05 * Math.sin(t * 3) + (st.pulse || 0) * 0.15;
          B.body.scale.set(pu, pu, 1 - (st.pulse || 0) * 0.1);
        },
        hit: [{a: [0, 0, -L + 0.1], b: [0, 0, 0.6], r: R * 0.95}],
        volume: ((Math.PI * L) / 3) * (0.92 * 0.92 + 0.92 * 0.28 + 0.28 * 0.28) * R * R + (4 / 3) * Math.PI * Math.pow(R * 1.06, 3) * 0.92 * 0.72,
        area: Math.PI * R * R * 1.06 * 0.97,
        cd: 0.55,
        jet: true
      };
    }
  },
  // ringmouths, the shelled (coilBody): the soft body under a shell — a flesh ellipsoid at z, the shell a required part (coil or cone)
  // (v11.25: also the crawlers — the lurker and the watcher are a mantle laid on the floor with no shell: y lifts it, breathe is the
  // lurker's slow swell; ws/hs the sphere's segments; shell is required only when the spec says it is a coilshell)
  coilbody: {
    clade: 'ringmouths',
    params: {
      R: {label: 'body radius', k: 'k', b: [0.15, 1.2], x: [0.08, 3], d: 0.46},
      z: {label: 'z (fore–aft)', k: 'k', b: [-1, 4], x: [-4, 8], d: 0.15},
      y: {label: 'y (up)', k: 'k', b: [-0.3, 1], x: [-2, 3], d: 0},
      sx: {label: 'width', k: 'k', b: [0.8, 1.4], x: [0.5, 2], d: 1.1},
      sy: {label: 'squash', k: 'k', b: [0.6, 1.2], x: [0.3, 2], d: 0.85},
      sz: {label: 'stretch', k: 'k', b: [0.7, 2], x: [0.4, 3], d: 1.5},
      ws: {label: 'segments round', k: 'n', b: [6, 10], x: [4, 16], d: 8},
      hs: {label: 'segments up', k: 'n', b: [4, 8], x: [3, 12], d: 6},
      breathe: {label: 'breathe', k: 'k', b: [0, 0.05], x: [0, 0.2], d: 0},
      bf: {label: 'breath rate', k: 'k', b: [0.5, 2], x: [0.1, 5], d: 1.3}
    },
    build: (ctx, c) => {
      const P = ctx.P,
        pal = ctx.pal,
        R = c.R,
        z = c.z,
        y = c.y || 0,
        fl = palk(pal, 'flesh', 'top');
      P.push(part(G.sph(R, c.ws, c.hs), 0, y, z, fl, {s: [c.sx, c.sy, c.sz], c2: pal.belly || fl}));
      const rAt = zz => {
        const u = (zz - z) / (R * c.sz);
        return R * Math.max(c.sx, c.sy) * Math.sqrt(Math.max(0, 1 - u * u));
      };
      const ell = k => zz => {
        const u = (zz - z) / (R * c.sz);
        return R * k * Math.sqrt(Math.max(0, 1 - u * u));
      };
      return {
        L: R * c.sz * 2,
        nose: z + R * c.sz,
        tail: z - R * c.sz,
        Rmax: R * Math.max(c.sx, c.sy),
        rAt: rAt,
        wAt: ell(c.sx),
        hAt: ell(c.sy),
        zAt: u => lerp(z + R * c.sz, z - R * c.sz, u),
        sway: false,
        round: true,
        cy: y,
        anchors: {
          collar: {z: R * 0.95, R: R * 0.9, r: R * 0.13, sy: 0.8, y0: y},
          cluster: {y: y + R * 0.45, z: R * 0.8, R: R * 0.42, r: R * 0.18},
          mouth: {y: y - R * 0.15, z: R * 1.05, R: R * 0.32},
          ring: {z: R * 1.0, R: R * 0.62},
          ridge: {w: R * 0.2, h: R * 0.2, len: R * c.sz * 1.4, y: y + R * c.sy * 0.95, z: z},
          head: {y: y + R * c.sy * 0.9, z: z + R * c.sz * 0.8, R: R * 0.7}
        },
        anim: c.breathe
          ? (t, spd, st, B) => {
              B.body.scale.y = 1 + c.breathe * Math.sin(t * c.bf);
            }
          : null,
        hit: [{a: [0, y, z - R * c.sz * 0.6], b: [0, y, z + R * c.sz * 0.6], r: R * 0.98}],
        volume: (4 / 3) * Math.PI * R * R * R * c.sx * c.sy * c.sz,
        area: Math.PI * R * R * c.sx * c.sy,
        cd: 0.7,
        jet: true
      };
    }
  },
  // slowbloods (buildFinback and the fish): a lathe of a profile [[r,z],...] from the tail to the nose, chevrons and eyes riding it
  lathe: {
    clade: 'slowbloods',
    params: {
      segs: {label: 'segments', k: 'n', b: [6, 10], x: [5, 14], d: 8},
      sz: {label: 'stretch', k: 'k', b: [0.45, 1.2], x: [0.3, 1.6], d: 1},
      y: {label: 'y (up)', k: 'k', b: [-0.2, 0.2], x: [-1, 1], d: 0},
      belly: {label: 'belly', k: 's', opts: ['belly', 'rust'], d: 'belly'}
    },
    build: (ctx, c) => {
      const P = ctx.P,
        pal = ctx.pal,
        prof = c.prof,
        o = {r: [HPI, 0, 0], c2: pal[c.belly] || pal.belly};
      if (c.sz !== 1) o.s = [1, 1, c.sz];
      P.push(part(G.lathe(prof, c.segs), 0, c.y || 0, 0, pal.top, o));
      const rAt = profR(prof),
        nose = prof[prof.length - 1][1] * c.sz,
        tail = prof[0][1] * c.sz;
      let Rmax = 0,
        vol = 0,
        zr = 0;
      for (let i = 0; i < prof.length; i++) {
        Rmax = Math.max(Rmax, prof[i][0]);
        if (prof[i][0] === Rmax) zr = prof[i][1];
        if (i) {
          const a = prof[i - 1][0],
            b = prof[i][0],
            dz = prof[i][1] - prof[i - 1][1];
          vol += ((Math.PI * (a * a + a * b + b * b)) / 3) * dz;
        }
      }
      return {
        L: nose - tail,
        nose: nose,
        tail: tail,
        Rmax: Rmax,
        rAt: rAt,
        wAt: rAt,
        hAt: rAt,
        zAt: u => lerp(nose, tail, u),
        sway: true,
        round: true,
        cy: c.y || 0,
        anchors: {
          eyes: {z: lerp(zr, nose, 0.75), R: rAt(lerp(zr, nose, 0.75)) * 0.9},
          chevrons: {z0: lerp(zr, nose, 0.4), z1: tail + 0.05 * (nose - tail), ds: Rmax * 0.45, sz: Rmax * 0.25},
          mouth: {z: nose - 0.02 * (nose - tail), r: rAt(nose - 0.02 * (nose - tail)) * 0.9, len: Rmax, n: 6, w: Rmax * 0.2},
          fins: {z: zr, R: Rmax, h: Rmax * 1.1, len: Rmax * 1.2},
          tail: {
            z: tail + 0.03 * (nose - tail),
            len: (nose - tail) * 0.55,
            r0: rAt(tail + 0.1 * (nose - tail)) * 0.8,
            lobes: {h: Rmax * 1.7, len: Rmax}
          }
        },
        anim: null,
        hit: [{a: [0, 0, tail + Rmax * 0.2], b: [0, 0, nose + Rmax * 0.3], r: Rmax}],
        volume: vol * c.sz,
        area: Math.PI * Rmax * Rmax * c.sz,
        cd: 0.45,
        jet: false
      };
    }
  },
  // hingeshells (buildRaptor): a head box and a jointed trunk of n plates from z0 back for L, width w0→w1 and height h0→h1.
  // v11.25: z0 (the trunk's front; L*0.45 by default), y (the trunk's centreline), hy/hz (the head box off it), a tail box (tl > 0:
  // the trap's abdomen), a snout box (nl > 0: the comb's second head box). The frame carries the hingeshell fields every armour and
  // limb part reads (z0, z1, LT, w0, w1, h0, h1, H, zh, hy, ht, zf), so the other hingeshell cores can serve them too.
  trunk: {
    clade: 'hingeshells',
    params: {
      L: {label: 'length', k: 'k', b: [0.8, 12], x: [0.4, 20], d: 5.5},
      n: {label: 'plates', k: 'n', b: [3, 9], x: [3, 14], d: 7},
      z0: {label: 'first z', k: 'k', b: [-2, 8], x: [-6, 12], d: c => c.L * 0.45},
      y: {label: 'y (up)', k: 'k', b: [-0.6, 0.6], x: [-2, 2], d: 0},
      w0: {label: 'front width', k: 'k', b: [0.12, 3.2], x: [0.1, 6], d: 1.1},
      w1: {label: 'back width', k: 'k', b: [0.1, 1.4], x: [0.05, 4], d: 0.45},
      h0: {label: 'front height', k: 'k', b: [0.1, 2.2], x: [0.08, 5], d: 0.9},
      h1: {label: 'back height', k: 'k', b: [0.08, 1], x: [0.04, 3], d: 0.4},
      hw: {label: 'head width', k: 'k', b: [0.12, 3], x: [0.1, 6], d: 1.1},
      hh: {label: 'head height', k: 'k', b: [0.1, 2], x: [0.08, 5], d: 0.9},
      hl: {label: 'head length', k: 'k', b: [0.12, 2.4], x: [0.1, 5], d: 1.1},
      hy: {label: 'head y', k: 'k', b: [-0.6, 0.6], x: [-2, 2], d: c => c.y},
      hz: {label: 'head z', k: 'k', b: [-0.5, 0.5], x: [-3, 3], d: 0},
      tw: {label: 'tail width', k: 'k', b: [0.2, 2], x: [0.05, 5], d: 0.8},
      th: {label: 'tail height', k: 'k', b: [0.1, 1], x: [0.03, 3], d: 0.3},
      tl: {label: 'tail length', k: 'k', b: [0, 1.5], x: [0, 4], d: 0},
      ty: {label: 'tail y', k: 'k', b: [-0.6, 0.6], x: [-2, 2], d: c => c.y},
      tz: {label: 'tail z', k: 'k', b: [-0.5, 0.5], x: [-3, 3], d: 0},
      nw: {label: 'snout width', k: 'k', b: [0.2, 3], x: [0.05, 6], d: 1},
      nh: {label: 'snout height', k: 'k', b: [0.1, 2], x: [0.03, 5], d: 0.6},
      nl: {label: 'snout length', k: 'k', b: [0, 2], x: [0, 5], d: 0},
      ny: {label: 'snout y', k: 'k', b: [-0.6, 0.6], x: [-2, 2], d: c => c.y},
      nz: {label: 'snout z', k: 'k', b: [-0.5, 0.5], x: [-3, 3], d: 0}
    },
    build: (ctx, c) => {
      const P = ctx.P,
        pal = ctx.pal,
        L = c.L,
        n = c.n,
        z0 = c.z0,
        z1 = z0 - L,
        y = c.y || 0,
        H = {w: c.hw, h: c.hh, l: c.hl},
        zh = z0 + H.l * 0.5 + (c.hz || 0),
        ht = H.h * 0.5,
        hy = c.hy === undefined ? y : c.hy,
        zf = Math.max(zh + H.l * 0.5, c.nl > 0 ? zh + H.l * 0.5 + (c.nz || 0) + c.nl * 0.5 : -1e9);
      P.push(part(G.box(H.w, H.h, H.l), 0, hy, zh, pal.top, {c2: pal.belly}));
      if (c.nl > 0) P.push(part(G.box(c.nw, c.nh, c.nl), 0, c.ny === undefined ? y : c.ny, zh + H.l * 0.5 + (c.nz || 0) + c.nl * 0.5, pal.top, {c2: pal.belly}));
      if (c.tl > 0) P.push(part(G.box(c.tw, c.th, c.tl), 0, c.ty === undefined ? y : c.ty, z1 + (c.tz || 0) - c.tl * 0.5, pal.top, {c2: pal.belly}));
      trunk(
        P,
        pal,
        n,
        z0,
        z1,
        u => lerp(c.w0, c.w1, u),
        u => lerp(c.h0, c.h1, u),
        y ? () => y : undefined
      );
      const wAt = z => (z > z0 ? H.w * 0.5 : lerp(c.w0, c.w1, (z0 - z) / L) * 0.5),
        hAt = z => (z > z0 ? ht : lerp(c.h0, c.h1, (z0 - z) / L) * 0.5);
      let vol = 0;
      for (let k = 0; k < n; k++) {
        const u = (k + 0.5) / n;
        vol += (lerp(c.w0, c.w1, u) * lerp(c.h0, c.h1, u) * L) / n;
      }
      vol += H.w * H.h * H.l + (c.tl > 0 ? c.tw * c.th * c.tl : 0) + (c.nl > 0 ? c.nw * c.nh * c.nl : 0);
      const r = Math.max(c.w0, c.h0) * 0.5,
        zb = c.tl > 0 ? z1 + (c.tz || 0) - c.tl : z1;
      return {
        L: zf - zb,
        nose: zf,
        tail: zb,
        Rmax: Math.max(c.w0, c.h0) * 0.5,
        rAt: z => Math.max(wAt(z), hAt(z)),
        wAt: wAt,
        hAt: hAt,
        zAt: u => lerp(zf, zb, u),
        sway: false,
        round: false,
        cy: y,
        H: H,
        zh: zh,
        ht: ht,
        hy: hy,
        zf: zf,
        z0: z0,
        z1: z1,
        LT: L,
        w0: c.w0,
        w1: c.w1,
        h0: c.h0,
        h1: c.h1,
        anchors: {},
        anim: (t, spd, st, B) => {
          B.body.scale.set(1 + 0.06 * (st.tell || 0), 1 + 0.12 * (st.tell || 0), 1);
        },
        hit: [{a: [0, y, z1 + r], b: [0, y, zf - r * 0.5], r: r}],
        volume: vol,
        area: Math.max(c.w0 * c.h0, H.w * H.h),
        cd: 0.8,
        jet: false
      };
    }
  },
  // ---------- v11.25: the cores of the species that were hand builders ----------
  // ringmouths, the deep line (buildPall, buildVeil): a sac — a mantle ellipsoid (or a lathe profile) and a collar ellipsoid in front
  sac: {
    clade: 'ringmouths',
    params: {
      shape: {label: 'shape', k: 's', opts: ['sphere', 'lathe'], d: 'sphere'},
      R: {label: 'mantle radius', k: 'k', b: [0.3, 3.5], x: [0.1, 8], d: 1.0},
      sy: {label: 'squash', k: 'k', b: [0.6, 1.2], x: [0.3, 2], d: 0.95},
      sz: {label: 'stretch', k: 'k', b: [0.8, 3], x: [0.4, 5], d: 1.9},
      z: {label: 'z (fore–aft)', k: 'k', b: [-4, 1], x: [-10, 4], d: -1.1},
      ws: {label: 'segments round', k: 'n', b: [6, 12], x: [4, 16], d: 9},
      hs: {label: 'segments up', k: 'n', b: [4, 10], x: [3, 14], d: 7},
      segs: {label: 'segments', k: 'n', b: [6, 12], x: [5, 16], d: 10},
      cR: {label: 'collar radius', k: 'k', b: [0.3, 3.5], x: [0.1, 8], d: 1.05},
      cy: {label: 'collar y', k: 'k', b: [-0.5, 0.5], x: [-2, 2], d: -0.05},
      cz: {label: 'collar z', k: 'k', b: [0, 6], x: [-2, 12], d: 1.1},
      csy: {label: 'collar squash', k: 'k', b: [0.6, 1.2], x: [0.3, 2], d: 0.9},
      csz: {label: 'collar stretch', k: 'k', b: [0.4, 1.2], x: [0.2, 2], d: 0.75},
      cws: {label: 'collar segments', k: 'n', b: [6, 12], x: [4, 16], d: 8},
      chs: {label: 'collar rings', k: 'n', b: [4, 10], x: [3, 14], d: 6},
      prof: {label: 'profile', k: 'l', d: null}
    },
    build: (ctx, c) => {
      const P = ctx.P,
        pal = ctx.pal,
        lathe = c.shape === 'lathe' && c.prof,
        R = c.R,
        z = c.z;
      let rAt, tail, Rm, vol;
      if (lathe) {
        const prof = c.prof;
        P.push(part(G.lathe(prof, c.segs), 0, 0, 0, pal.top, {r: [HPI, 0, 0], c2: pal.belly}));
        rAt = profR(prof);
        tail = prof[0][1];
        Rm = 0;
        vol = 0;
        for (let i = 0; i < prof.length; i++) {
          Rm = Math.max(Rm, prof[i][0]);
          if (i) {
            const a = prof[i - 1][0],
              b = prof[i][0];
            vol += ((Math.PI * (a * a + a * b + b * b)) / 3) * (prof[i][1] - prof[i - 1][1]);
          }
        }
      } else {
        P.push(part(G.sph(R, c.ws, c.hs), 0, 0, z, pal.top, {s: [1, c.sy, c.sz], c2: pal.belly}));
        rAt = zz => {
          const u = (zz - z) / (R * c.sz);
          return R * Math.sqrt(Math.max(0, 1 - u * u));
        };
        tail = z - R * c.sz;
        Rm = R;
        vol = (4 / 3) * Math.PI * R * R * R * c.sy * c.sz;
      }
      P.push(part(G.sph(c.cR, c.cws, c.chs), 0, c.cy, c.cz, pal.top, {s: [1, c.csy, c.csz], c2: pal.belly}));
      const cR = c.cR,
        cz = c.cz,
        nose = cz + cR * c.csz,
        collR = zz => {
          const u = (zz - cz) / (cR * c.csz);
          return cR * Math.sqrt(Math.max(0, 1 - u * u));
        },
        rr = zz => Math.max(rAt(zz), collR(zz)),
        L = nose - tail;
      return {
        L: L,
        nose: nose,
        tail: tail,
        Rmax: Math.max(Rm, cR),
        rAt: rr,
        wAt: rr,
        hAt: rr,
        zAt: u => lerp(nose, tail, u),
        sway: false,
        round: true,
        anchors: {
          collar: {z: cz + cR * c.csz * 0.3, R: cR * 0.9, r: cR * 0.15, sy: 0.9, y0: c.cy},
          cluster: {y: c.cy + cR * 0.45, z: cz + cR * c.csz * 0.5, R: cR * 0.4, r: cR * 0.15},
          mouth: {y: c.cy - cR * 0.1, z: cz + cR * c.csz * 0.65, R: cR * 0.3},
          ring: {z: cz + cR * c.csz * 0.9, R: cR * 0.5},
          skirt: {z: tail + L * 0.18, R: Rm, h: Rm * 1.2, len: L * 0.28},
          ridge: {w: Rm * 0.22, h: Rm * 0.22, len: L * 0.5, y: Rm * 0.95, z: lathe ? (tail + cz) * 0.5 : z}
        },
        anim: null,
        hit: [{a: [0, 0, tail + Rm * 0.4], b: [0, 0, nose - cR * 0.4], r: Math.max(Rm, cR) * 0.95}],
        volume: vol + (4 / 3) * Math.PI * cR * cR * cR * c.csy * c.csz,
        area: Math.PI * Math.max(Rm, cR) * Math.max(Rm, cR) * 0.9,
        cd: 0.65,
        jet: true,
        jetK: 0.0625 // of a mantle's jet (DERIVE_K.jet)
      };
    }
  },
  // slowbloods, the longbacks (buildEel): the body is one chain — the head is the root, n segments trail it; tailPose lays the swim
  // wave along it each frame and physics.js gives it lag, contact and the bend limit. The static parts (the eye ring, barbels) ride
  // the head segment: the core takes the body's part list for its root (finish), and the rig's mesh is the body.
  chain: {
    clade: 'slowbloods',
    provides: ['tail'],
    params: {
      n: {label: 'segments', k: 'n', b: [6, 14], x: [3, 24], d: 11},
      L: {label: 'length', k: 'k', b: [0.3, 1.2], x: [0.1, 3], d: 0.68},
      w0: {label: 'tail width', k: 'k', b: [0.05, 0.5], x: [0.02, 1.5], d: 0.16},
      w1: {label: 'head width', k: 'k', b: [0.2, 1.2], x: [0.05, 3], d: 0.5},
      hl: {label: 'head length', k: 'k', b: [0.3, 1.2], x: [0.1, 3], d: 0.7},
      fin: {label: 'dorsal fin', k: 'b', d: true},
      fh: {label: 'fin height', k: 'k', b: [0.3, 1.5], x: [0, 3], d: 0.8},
      lobes: {label: 'tail lobes', k: 'k', b: [1, 4], x: [0, 6], d: 2.6},
      ll: {label: 'lobe length', k: 'k', b: [0.2, 1.5], x: [0.05, 3], d: 0.7},
      amp: {label: 'amplitude', k: 'k', b: [0.15, 0.45], x: [0.02, 1], d: 0.3},
      sp0: {label: 'speed at rest', k: 'k', b: [0.1, 0.5], x: [0, 1], d: 0.25},
      spk: {label: 'speed gain', k: 'k', b: [0.1, 0.5], x: [0, 1], d: 0.3},
      kph: {label: 'wave pitch', k: 'k', b: [0.4, 1.2], x: [0.1, 2], d: 0.75},
      ks: {label: 'stiffness', k: 'k', b: [60, 200], x: [20, 400], d: 130},
      damp: {label: 'damping', k: 'k', b: [6, 16], x: [3, 30], d: 12},
      cosMax: {label: 'joint limit', k: 'k', b: [0.5, 0.9], x: [0.2, 1], d: 0.72}
    },
    build: (ctx, c) => {
      const P = ctx.P,
        pal = ctx.pal,
        n = c.n,
        L = c.L,
        segd = [],
        ch = makeChain(n, -1, 0, 1, 0, {ks: c.ks, damp: c.damp, cosMax: c.cosMax}),
        wAtI = i => c.w0 + c.w1 * (1 - i / n);
      let vol = 0;
      for (let i = 0; i < n; i++) {
        const w = wAtI(i),
          S = i ? [] : P;
        S.push(part(G.box(w, w * 1.35, L * 1.04), 0, 0, -L / 2, pal.top, {c2: pal.belly}));
        vol += w * w * 1.35 * L;
        if (i === 0) S.push(part(G.box(w * 1.05, w * 1.2, c.hl), 0, -0.02, c.hl * 0.5, pal.top, {c2: pal.belly}));
        else if (i < n - 1) {
          if (c.fin) S.push(part(G.box(0.05, w * c.fh, L * 0.9), 0, w * 0.95, -L / 2, pal.fin || pal.top));
        } else tailTrio(S, pal, -L, w * c.lobes, c.ll, pal.fin || pal.top);
        segd.push({parts: S, chain: ch, k: i});
        ch.rl[i] = L;
        ch.rr[i] = w * 0.62;
      }
      const w0 = wAtI(0),
        nose = c.hl,
        tail = -n * L,
        beat = ctx.beat || (ctx.spec && ctx.spec.core.beat) || [2.2, 0.8],
        wAt = z => (z > 0 ? w0 * 0.525 : wAtI(Math.min(n - 1, Math.floor(-z / L))) * 0.5),
        hAt = z => (z > 0 ? w0 * 0.6 : wAtI(Math.min(n - 1, Math.floor(-z / L))) * 0.675);
      let ck = null;
      return {
        L: nose - tail,
        nose: nose,
        tail: tail,
        Rmax: w0 * 0.675,
        rAt: z => Math.max(wAt(z), hAt(z)),
        wAt: wAt,
        hAt: hAt,
        zAt: u => lerp(nose, tail, u),
        sway: false,
        round: false,
        anchors: {
          eyes: {z: c.hl * 0.71, R: w0 * 0.62},
          mouth: {z: c.hl, r: w0 * 0.42, len: w0 * 0.68, n: 6, w: w0 * 0.15},
          chevrons: {z0: -L * 0.5, z1: tail, ds: L, sz: w0 * 0.25}
        },
        // the body: the rig skinned over the chain, in place of the merged mesh (compile calls finish with the finished part list)
        finish: (Pf, mat) => {
          segd[0].parts = Pf;
          const rig = makeRig(segd, mat, [ch]);
          tailPose(ch, L, 0, 0, c.kph);
          rigRest(rig);
          rig.solid = true;
          return rig;
        },
        anim: (t, spd) => {
          if (!ck) ck = swimClock(beat[0], beat[1]);
          tailPose(ch, L, c.amp * Math.min(1, c.sp0 + spd * c.spk), ck(t, spd), c.kph);
        },
        thrust: n * L * (c.w0 + c.w1) * c.amp * 0.33 * Math.sqrt(beat[0] + beat[1]),
        mode: 'undulate',
        hit: [{a: [0, 0, 0], b: [0, 0, c.hl], r: w0 * 0.55}],
        volume: vol + w0 * w0 * 1.26 * c.hl,
        area: w0 * w0 * 1.35,
        cd: 0.5,
        jet: false
      };
    }
  },
  // hingeshells, the walkers' low form (buildScuttler): a domed body under the valves with a head plate and a tail plate
  shield: {
    clade: 'hingeshells',
    params: {
      R: {label: 'body radius', k: 'k', b: [0.2, 3], x: [0.08, 8], d: 0.5},
      sx: {label: 'width', k: 'k', b: [0.7, 1.4], x: [0.4, 2.5], d: 1},
      sy: {label: 'squash', k: 'k', b: [0.25, 1], x: [0.1, 2], d: 0.45},
      sz: {label: 'stretch', k: 'k', b: [0.8, 2.2], x: [0.4, 4], d: 1.4},
      y: {label: 'y (up)', k: 'k', b: [-0.5, 1], x: [-2, 3], d: 0.22},
      z: {label: 'z (fore–aft)', k: 'k', b: [-1, 1], x: [-4, 4], d: 0.02},
      ws: {label: 'segments round', k: 'n', b: [6, 10], x: [4, 16], d: 7},
      hs: {label: 'segments up', k: 'n', b: [3, 8], x: [3, 12], d: 4},
      hw: {label: 'head width', k: 'k', b: [0.2, 3], x: [0.05, 6], d: 0.62},
      hh: {label: 'head height', k: 'k', b: [0.05, 1], x: [0.02, 3], d: 0.16},
      hl: {label: 'head length', k: 'k', b: [0.1, 2], x: [0.05, 5], d: 0.42},
      hy: {label: 'head y', k: 'k', b: [-0.5, 1], x: [-2, 3], d: 0.2},
      hz: {label: 'head z', k: 'k', b: [0, 3], x: [-2, 8], d: 0.68},
      tw: {label: 'tail width', k: 'k', b: [0.1, 2], x: [0.05, 5], d: 0.4},
      th: {label: 'tail height', k: 'k', b: [0.05, 1], x: [0.02, 3], d: 0.14},
      tl: {label: 'tail length', k: 'k', b: [0, 2], x: [0, 5], d: 0.3},
      ty: {label: 'tail y', k: 'k', b: [-0.5, 1], x: [-2, 3], d: 0.16},
      tz: {label: 'tail z', k: 'k', b: [-3, 0], x: [-8, 2], d: -0.8}
    },
    build: (ctx, c) => {
      const P = ctx.P,
        pal = ctx.pal,
        R = c.R,
        y = c.y,
        z = c.z,
        H = {w: c.hw, h: c.hh, l: c.hl};
      P.push(part(G.sph(R, c.ws, c.hs), 0, y, z, pal.top, {s: [c.sx, c.sy, c.sz], c2: pal.belly}));
      P.push(part(G.box(H.w, H.h, H.l), 0, c.hy, c.hz, pal.top, {c2: pal.belly}));
      if (c.tl > 0) P.push(part(G.box(c.tw, c.th, c.tl), 0, c.ty, c.tz, pal.top, {c2: pal.belly}));
      const nose = Math.max(c.hz + H.l * 0.5, z + R * c.sz),
        tail = Math.min(c.tl > 0 ? c.tz - c.tl * 0.5 : 1e9, z - R * c.sz),
        ell = k => zz => {
          const u = (zz - z) / (R * c.sz);
          return R * k * Math.sqrt(Math.max(0, 1 - u * u));
        },
        wAt = zz => Math.max(ell(c.sx)(zz), zz > c.hz - H.l * 0.5 && zz < c.hz + H.l * 0.5 ? H.w * 0.5 : 0),
        hAt = ell(c.sy);
      return {
        L: nose - tail,
        nose: nose,
        tail: tail,
        Rmax: R * Math.max(c.sx, c.sy),
        rAt: zz => Math.max(wAt(zz), hAt(zz)),
        wAt: wAt,
        hAt: hAt,
        zAt: u => lerp(nose, tail, u),
        sway: false,
        round: true,
        cy: y,
        H: H,
        zh: c.hz,
        ht: H.h * 0.5,
        hy: c.hy,
        zf: nose,
        z0: z + R * c.sz * 0.75,
        z1: z - R * c.sz * 0.9,
        LT: R * c.sz * 1.65,
        w0: R * c.sx * 2,
        w1: R * c.sx * 1.2,
        h0: R * c.sy * 2,
        h1: R * c.sy * 1.2,
        anchors: {},
        anim: null,
        hit: [{a: [0, y, z - R * c.sz * 0.65], b: [0, y, z + R * c.sz * 0.45], r: R * Math.max(c.sy, c.sx * 0.6)}],
        volume: (4 / 3) * Math.PI * R * R * R * c.sx * c.sy * c.sz + H.w * H.h * H.l,
        area: Math.PI * R * R * c.sx * c.sy,
        cd: 0.75,
        jet: false
      };
    }
  },
  // hingeshells, the paddlers' small form (buildFlicker): the bean — an ellipsoid body that lives between its valves, a dark gut line
  bean: {
    clade: 'hingeshells',
    params: {
      R: {label: 'body radius', k: 'k', b: [0.05, 0.6], x: [0.02, 2], d: 0.12},
      sx: {label: 'width', k: 'k', b: [0.5, 1.2], x: [0.3, 2], d: 0.7},
      sy: {label: 'squash', k: 'k', b: [0.6, 1.2], x: [0.3, 2], d: 0.9},
      sz: {label: 'stretch', k: 'k', b: [1, 2.5], x: [0.5, 4], d: 1.5},
      y: {label: 'y (up)', k: 'k', b: [-0.1, 0.1], x: [-1, 1], d: -0.02},
      z: {label: 'z (fore–aft)', k: 'k', b: [-0.2, 0.2], x: [-2, 2], d: 0.05},
      ws: {label: 'segments round', k: 'n', b: [6, 10], x: [4, 16], d: 7},
      hs: {label: 'segments up', k: 'n', b: [4, 8], x: [3, 12], d: 5},
      gut: {label: 'gut line', k: 'b', d: true},
      gw: {label: 'gut width', k: 'k', b: [0.01, 0.06], x: [0.005, 0.3], d: 0.03},
      gl: {label: 'gut length', k: 'k', b: [0.1, 0.6], x: [0.02, 3], d: 0.34},
      gy: {label: 'gut y', k: 'k', b: [-0.1, 0.2], x: [-1, 1], d: 0.06}
    },
    build: (ctx, c) => {
      const P = ctx.P,
        pal = ctx.pal,
        R = c.R,
        z = c.z,
        y = c.y;
      P.push(part(G.sph(R, c.ws, c.hs), 0, y, z, pal.top, {s: [c.sx, c.sy, c.sz]}));
      if (c.gut) P.push(part(G.box(c.gw, c.gw, c.gl), 0, c.gy, z - 0.03, pal.gut || pal.joint || pal.top));
      const nose = z + R * c.sz,
        tail = z - R * c.sz,
        ell = k => zz => {
          const u = (zz - z) / (R * c.sz);
          return R * k * Math.sqrt(Math.max(0, 1 - u * u));
        },
        H = {w: R * c.sx * 2, h: R * c.sy * 2, l: R * c.sz};
      return {
        L: nose - tail,
        nose: nose,
        tail: tail,
        Rmax: R * Math.max(c.sx, c.sy),
        rAt: zz => Math.max(ell(c.sx)(zz), ell(c.sy)(zz)),
        wAt: ell(c.sx),
        hAt: ell(c.sy),
        zAt: u => lerp(nose, tail, u),
        sway: false,
        round: true,
        cy: y,
        H: H,
        zh: z + R * c.sz * 0.5,
        ht: R * c.sy,
        hy: y,
        zf: nose,
        z0: nose,
        z1: tail,
        LT: R * c.sz * 2,
        w0: H.w,
        w1: H.w,
        h0: H.h,
        h1: H.h,
        anchors: {},
        anim: null,
        hit: [{a: [0, y, tail - R * 0.3], b: [0, y, nose - R * 0.5], r: R * c.sy * 1.1}],
        volume: (4 / 3) * Math.PI * R * R * R * c.sx * c.sy * c.sz,
        area: Math.PI * R * R * c.sx * c.sy,
        cd: 0.7,
        jet: false
      };
    }
  },
  // hingeshells, the sediment feeder (buildTread): n arched plates overlapping down a long low body — each an open cylinder over a belly
  // box, the colours alternating — with a head shield and a tail knob
  arches: {
    clade: 'hingeshells',
    params: {
      n: {label: 'arches', k: 'n', b: [5, 10], x: [3, 16], d: 8},
      z0: {label: 'first z', k: 'k', b: [1, 8], x: [0, 16], d: 5},
      L: {label: 'length', k: 'k', b: [0.6, 3], x: [0.2, 6], d: 1.7},
      w0: {label: 'front width', k: 'k', b: [1, 8], x: [0.3, 16], d: 5},
      w1: {label: 'back width', k: 'k', b: [0.5, 5], x: [0.2, 10], d: 2.4},
      h0: {label: 'front height', k: 'k', b: [0.4, 2.5], x: [0.1, 5], d: 1.35},
      h1: {label: 'back height', k: 'k', b: [0.2, 1.5], x: [0.05, 4], d: 0.75},
      y: {label: 'y (up)', k: 'k', b: [-1, 0.5], x: [-3, 2], d: -0.35},
      segs: {label: 'segments', k: 'n', b: [8, 16], x: [6, 24], d: 12},
      alt: {label: 'alternate colours', k: 'b', d: true},
      hR: {label: 'shield radius', k: 'k', b: [1, 5], x: [0.3, 10], d: 2.9},
      hsy: {label: 'shield squash', k: 'k', b: [0.2, 0.8], x: [0.1, 1.5], d: 0.42},
      hsz: {label: 'shield stretch', k: 'k', b: [0.4, 1.2], x: [0.2, 2], d: 0.75},
      hy: {label: 'head y', k: 'k', b: [-1, 0.5], x: [-3, 2], d: -0.15},
      hz: {label: 'head z', k: 'k', b: [1, 9], x: [0, 18], d: 5.4},
      tR: {label: 'tail knob', k: 'k', b: [0.3, 3], x: [0.1, 6], d: 1.2},
      tsy: {label: 'knob squash', k: 'k', b: [0.2, 1], x: [0.1, 2], d: 0.5},
      tsz: {label: 'knob stretch', k: 'k', b: [0.4, 1.5], x: [0.2, 3], d: 0.9},
      ty: {label: 'tail y', k: 'k', b: [-1.5, 0.5], x: [-4, 2], d: -0.6},
      tz: {label: 'tail z', k: 'k', b: [-16, -2], x: [-30, 0], d: -8.7}
    },
    build: (ctx, c) => {
      const P = ctx.P,
        pal = ctx.pal,
        n = c.n,
        L = c.L,
        y = c.y,
        wU = u => lerp(c.w0, c.w1, u),
        hU = u => lerp(c.h0, c.h1, u);
      let vol = 0;
      for (let k = 0; k < n; k++) {
        const u = k / (n - 1),
          w = wU(u),
          h = hU(u),
          z = c.z0 - k * L - L / 2;
        P.push(part(G.cyl(w / 2, (w / 2) * 1.04, L * 1.1, c.segs, true), 0, y, z, c.alt && k % 2 ? pal.top : pal.rim || pal.top, {r: [HPI, 0, 0], s: [1, 1, h / (w / 2)]}));
        P.push(part(G.cyl((w / 2) * 0.93, (w / 2) * 0.93, L * 1.3, c.segs, true), 0, y, z, pal.leg || pal.joint, {r: [HPI, 0, 0], s: [1, 1, h / (w / 2)]}));
        P.push(part(G.box(w * 0.96, h, L * 1.3), 0, y - h / 2, z, pal.belly));
        vol += w * h * L * 1.4;
      }
      P.push(part(G.sph(c.hR, 10, 6), 0, c.hy, c.hz, pal.rim || pal.top, {s: [1, c.hsy, c.hsz], c2: pal.belly}));
      P.push(part(G.sph(c.tR, 7, 5), 0, c.ty, c.tz, pal.top, {s: [1, c.tsy, c.tsz], c2: pal.belly}));
      const nose = c.hz + c.hR * c.hsz,
        tail = Math.min(c.tz - c.tR * c.tsz, c.z0 - n * L),
        z1 = c.z0 - n * L,
        uAt = z => clamp((c.z0 - z) / (n * L), 0, 1),
        wAt = z => (z > c.z0 ? c.hR * Math.sqrt(Math.max(0, 1 - Math.pow((z - c.hz) / (c.hR * c.hsz), 2))) : z < z1 ? c.tR * 0.8 : wU(uAt(z)) * 0.5),
        hAt = z => (z > c.z0 ? c.hR * c.hsy : z < z1 ? c.tR * c.tsy : hU(uAt(z))),
        H = {w: c.hR * 2, h: c.hR * c.hsy * 2, l: c.hR * c.hsz * 2};
      return {
        L: nose - tail,
        nose: nose,
        tail: tail,
        Rmax: Math.max(c.w0 * 0.5, c.hR),
        rAt: z => Math.max(wAt(z), hAt(z)),
        wAt: wAt,
        hAt: hAt,
        zAt: u => lerp(nose, tail, u),
        sway: false,
        round: true,
        cy: y,
        H: H,
        zh: c.hz,
        ht: c.hR * c.hsy,
        hy: c.hy,
        zf: nose,
        z0: c.z0,
        z1: z1,
        LT: n * L,
        w0: c.w0,
        w1: c.w1,
        h0: c.h0 * 2,
        h1: c.h1 * 2,
        anchors: {},
        anim: null,
        hit: [{a: [0, y, tail + c.tR], b: [0, y, nose - c.hR * 0.5], r: c.h0 * 1.6}],
        volume: vol + (4 / 3) * Math.PI * Math.pow(c.hR, 3) * c.hsy * c.hsz,
        area: c.w0 * c.h0 * 1.6,
        cd: 0.9,
        jet: false
      };
    }
  },
  // drifters, the bells (buildJelly): an eight-sided lathe that pulses over an inner lathe, a core hung inside; the arms are the part
  bell: {
    clade: 'drifters',
    params: {
      R: {label: 'bell radius', k: 'k', b: [0.3, 1.5], x: [0.1, 4], d: 0.72},
      H: {label: 'height', k: 'k', b: [0.3, 1.2], x: [0.1, 3], d: 0.56},
      segs: {label: 'segments', k: 'n', b: [6, 12], x: [5, 24], d: 8},
      inner: {label: 'inner bell', k: 'b', d: true},
      core: {label: 'core', k: 'b', d: true},
      pulse: {label: 'pulse', k: 'k', b: [0.04, 0.16], x: [0, 0.4], d: 0.1},
      sway: {label: 'sway', k: 'k', b: [0, 0.1], x: [0, 0.3], d: 0.06}
    },
    build: (ctx, c) => {
      const P = ctx.P,
        pal = ctx.pal,
        kr = c.R / 0.72,
        kh = c.H / 0.56,
        bc = palk(pal, 'bell', 'top'),
        cc = palk(pal, 'core', 'belly', 'top'),
        sc = (r, h) => [r * kr, h * kh];
      P.push(part(G.lathe([sc(0.02, -0.05), sc(0.55, -0.05), sc(0.72, 0.12), sc(0.68, 0.32), sc(0.45, 0.5), sc(0.02, 0.56)], c.segs), 0, 0, 0, bc));
      if (c.inner) P.push(part(G.lathe([sc(0.02, -0.02), sc(0.5, -0.02), sc(0.62, 0.1), sc(0.55, 0.28), sc(0.02, 0.36)], c.segs), 0, 0, 0, cc));
      if (c.core && ctx.bf) {
        const core = new THREE.Mesh(merge([part(G.sph(0.22 * kr, 8, 4), 0, 0.02 * kh, 0, cc, {s: [1, 0.8, 1]}), part(G.sph(0.09 * kr, 6, 3), 0, -0.12 * kh, 0, cc)]), ctx.mat || MAT);
        ctx.bf.add(core);
      }
      const R = c.R,
        beat = ctx.beat || (ctx.spec && ctx.spec.core.beat) || [1.6, 0];
      let ck = null;
      return {
        L: R * 2,
        nose: R,
        tail: -R,
        Rmax: R,
        rAt: () => R,
        wAt: () => R,
        hAt: () => c.H * 0.6,
        zAt: u => lerp(R, -R, u),
        sway: false,
        round: true,
        anchors: {ring: {z: 0, R: R * 0.58, y0: -0.06 * kh}},
        anim: (t, spd, st, B) => {
          if (!ck) ck = swimClock(beat[0], beat[1]);
          const ph = ck(t, spd),
            p = 1 - 0.06 + c.pulse * Math.sin(ph),
            w = 1 + c.sway * Math.sin(ph + 1);
          B.body.scale.set(w, p, w);
          B.ph = ph;
        },
        thrust: R * R * c.H * c.pulse * 12,
        mode: 'drift',
        hit: [{a: [0, 0, 0], b: [0, 0, 0], r: R * 0.86}],
        volume: (2 / 3) * Math.PI * R * R * c.H,
        area: Math.PI * R * R,
        cd: 0.9,
        jet: false
      };
    }
  },
  // drifters, the floats (buildSailer): a bell that filled with gas — a crested float on the water, the feeding bodies packed under it;
  // the lines are the arms part. Its axis is the way it sails (+z); the AI yaws it to the wind.
  float: {
    clade: 'drifters',
    params: {
      sx: {label: 'width', k: 'k', b: [0.4, 1], x: [0.2, 2], d: 0.62},
      sy: {label: 'squash', k: 'k', b: [0.3, 0.9], x: [0.15, 2], d: 0.5},
      sz: {label: 'stretch', k: 'k', b: [1, 3], x: [0.5, 6], d: 1.8},
      y: {label: 'y (up)', k: 'k', b: [-0.2, 0.3], x: [-1, 1], d: 0.05},
      crest: {label: 'crest', k: 'b', d: true},
      cn: {label: 'crest slabs', k: 'n', b: [5, 13], x: [3, 20], d: 9},
      ch: {label: 'crest height', k: 'k', b: [0.2, 1], x: [0, 2], d: 0.62},
      bodies: {label: 'feeding bodies', k: 'n', b: [8, 30], x: [0, 60], d: 18}
    },
    build: (ctx, c) => {
      const P = ctx.P,
        pal = ctx.pal,
        fc = palk(pal, 'float', 'top'),
        cc = palk(pal, 'crest', 'top'),
        bc = palk(pal, 'body', 'belly', 'top');
      P.push(part(G.sph(1, 8, 6), 0, c.y, 0, fc, {s: [c.sx, c.sy, c.sz]}));
      if (c.crest)
        for (let k = 0; k < c.cn; k++) {
          const u = (k + 0.5) / c.cn,
            z = (-0.8 + u * 1.6) * c.sz,
            h = c.ch * Math.sin(u * Math.PI) + 0.1,
            y0 = c.sy * 0.94 * Math.sqrt(Math.max(0, 1 - Math.pow(z / c.sz, 2)));
          P.push(part(G.box(0.035, h, 0.36), 0, y0 + h / 2 - 0.02, z, cc, {r: [0.18, 0, 0.06 * (k - (c.cn - 1) / 2)]}));
        }
      if (c.bodies > 0 && ctx.bf) {
        const B = [];
        for (let i = 0; i < c.bodies; i++) {
          const a = (i / 18) * TAU * 2.3,
            d = 0.15 + 0.35 * (i % 3),
            y = -0.25 - 0.12 * (i % 4);
          B.push(part(G.sph(0.11 + 0.05 * (i % 2), 5, 4), Math.cos(a) * d * 0.5, y, Math.sin(a) * d * 1.2, bc));
        }
        ctx.bf.add(new THREE.Mesh(merge(B), ctx.mat || MAT));
      }
      const R = c.sz,
        ell = k => zz => k * Math.sqrt(Math.max(0, 1 - Math.pow(zz / c.sz, 2)));
      return {
        L: R * 2,
        nose: R,
        tail: -R,
        Rmax: Math.max(c.sx, c.sy),
        rAt: zz => Math.max(ell(c.sx)(zz), ell(c.sy)(zz)),
        wAt: ell(c.sx),
        hAt: ell(c.sy),
        zAt: u => lerp(R, -R, u),
        sway: false,
        round: true,
        cy: c.y,
        anchors: {ring: {z: 0, R: 0.32, y0: -0.45}},
        anim: null,
        thrust: c.sz * c.ch * 0.6,
        mode: 'sail',
        chambered: true,
        hit: [{a: [0, c.y, -c.sz * 0.67], b: [0, c.y, c.sz * 0.67], r: c.sy * 1.16}],
        volume: (4 / 3) * Math.PI * c.sx * c.sy * c.sz,
        area: Math.PI * c.sx * c.sy,
        cd: 0.5,
        jet: false
      };
    }
  }
};

// ---------- the surface: where a part sits ----------
// A part that snaps asks the body where its surface is at (x,z): the core's shape (an ellipse section for the round bodies, the
// box for a trunk) raised by whatever armour covers that spot — a part's `cover(F,core,p)` returns {top(x,z), bottom(x,z)} in
// absolute y, or null where it does not reach. Eyes on a hooded head sit on the hood, not through it (answer 5).
function bodySurf(F, x, z, sign) {
  const rx = F.wAt(z),
    ry = F.hAt(z);
  if (!(rx > 0) || Math.abs(x) > rx) return null;
  const y = F.round ? ry * Math.sqrt(Math.max(0, 1 - (x / rx) * (x / rx))) : ry;
  return sign * y + (F.cy || 0);
}
function surfaces(F, spec) {
  const cov = [];
  for (const p of spec.parts || []) {
    const def = PARTS[p.kind];
    if (def && def.cover) {
      const c = def.cover(F, spec.core, p);
      if (c) cov.push(c);
    }
  }
  const pick = (x, z, sign) => {
    let y = bodySurf(F, x, z, sign);
    for (const c of cov) {
      const f = sign > 0 ? c.top : c.bottom;
      if (!f) continue;
      const v = f(x, z);
      if (v === null || v === undefined) continue;
      if (y === null || (sign > 0 ? v > y : v < y)) y = v;
    }
    return y;
  };
  return {top: (x, z) => pick(x, z, 1), bottom: (x, z) => pick(x, z, -1)};
}
function prepCtx(ctx, F, spec) {
  ctx.F = F;
  const S = surfaces(F, spec);
  ctx.top = S.top;
  ctx.bottom = S.bottom;
  return ctx;
}
const DEG = Math.PI / 180;
// which styles belong to which clade, and stand on which core: the registry's word (PARTS[kind].reg, v11.70; STYLE_CLADES to v11.69, which listed
// only eyes, mouth and arms and let every unlisted style through to every clade of its kind). The lab offers only these, validate corrects the
// rest (answer 1 of the second round). core: a core kind, where the asker has one — a style with `cores` stands only on those, and a kind the
// core provides itself (the chain body is its own tail) has no styles there. A style with `off` is kept in the kit and offered to no one
// (v11.70.1: arms:hold, worn by nothing; the person: disable, don't delete); `was` names the style it was split from, so a spec that
// wears the old name moves to it with its numbers (validate).
function styleClades(kind,style){const d=PARTS[kind],r=d&&d.reg[style];return r?r.clades:null;}
function stylesFor(kind,clade,core){const d=PARTS[kind];if(!d)return [];if(core&&CORES[core]&&(CORES[core].provides||[]).indexOf(kind)>=0)return [];
  return d.styles.filter(st=>{const r=d.reg[st];return !r.off&&r.clades.indexOf(clade)>=0&&(!core||!r.cores||r.cores.indexOf(core)>=0);});}
// the mouth parts of a hingeshell (answer 6): around a plate ring at (x0,y0,z0) that faces `down` or forward — mandibles (a pair of
// curved blades that close inward), palps (short jointed stubs, leg()), feelers (thin whiskers fanned out)
function feedParts(P, pal, y0, z0, R, down, kind, n, len) {
  const col = pal.claw || pal.joint;
  if (kind === 'mandibles')
    for (const sx of [1, -1]) {
      const segs = 3;
      let x = sx * R * 1.15,
        y = y0,
        z = z0 + (down ? 0 : R * 0.2);
      for (let i = 0; i < segs; i++) {
        const f = i / segs,
          d = down ? V3(-sx * (0.3 + f * 0.9), -1 + f * 0.6, 0.15).normalize() : V3(-sx * (0.25 + f * 0.9), -0.1, 1 - f * 0.55).normalize(),
          l = (len / segs) * (1 - 0.15 * i),
          w = R * 0.22 * (1 - 0.25 * i);
        P.push(part(G.cone(w, l, 4), x + (d.x * l) / 2, y + (d.y * l) / 2, z + (d.z * l) / 2, i ? col : pal.joint, {dir: d}));
        x += d.x * l;
        y += d.y * l;
        z += d.z * l;
      }
    }
  else if (kind === 'palps')
    for (let i = 0; i < n; i++) {
      const sx = i % 2 ? -1 : 1,
        u = Math.floor(i / 2) / Math.max(1, Math.ceil(n / 2) - 1 || 1),
        x = sx * R * (0.7 + 0.5 * u),
        zz = z0 + (down ? R * (0.5 - u) : R * 0.25),
        yy = down ? y0 : y0 - R * 0.5 * u;
      leg(
        P,
        pal,
        x,
        yy,
        zz,
        sx * len * 0.45,
        down ? -len * 0.35 : -len * 0.15,
        down ? 0 : len * 0.4,
        sx * len * 0.3,
        down ? -len * 0.85 : -len * 0.6,
        down ? len * 0.2 : len * 0.75,
        len * 0.16
      );
    }
  else if (kind === 'feelers')
    for (let i = 0; i < n; i++) {
      const u = n > 1 ? i / (n - 1) - 0.5 : 0,
        a = u * 1.6,
        d = down ? V3(Math.sin(a), -0.55, Math.cos(a) * 0.8).normalize() : V3(Math.sin(a), -0.25, Math.cos(a)).normalize();
      P.push(part(G.cyl(R * 0.03, R * 0.08, len, 4), (d.x * len) / 2, y0 + (d.y * len) / 2, z0 + (d.z * len) / 2, col, {dir: d}));
    }
}
// the arm plans (CLADES: the ring differentiated): 242 the ringmouths' 2-4-2 (creatures_builders PLAN242); fan the lurker's forward
// fan in two tiers; crawl the rasp's six (the grasp pair forward, four oars); raise the watcher's four held up. An arm's phi: for a
// ring 0 is the top, for a flat ring 0 is forward; len/w multiply the ring's, sp offsets the pose's spread.
const PLANS = {
  242: PLAN242,
  fan: [
    {phi: -0.32, len: 1.25, w: 0.9},
    {phi: 0.32, len: 1.25, w: 0.9},
    {phi: -0.8, len: 0.62, w: 1.3},
    {phi: 0.8, len: 0.62, w: 1.3},
    {phi: -1.25, len: 0.6, w: 1.3},
    {phi: 1.25, len: 0.6, w: 1.3},
    {phi: -1.7, len: 0.45, w: 1.2},
    {phi: 1.7, len: 0.45, w: 1.2}
  ],
  crawl: [
    {phi: -0.35, len: 1.3},
    {phi: 0.35, len: 1.3},
    {phi: -1.0, len: 0.75, w: 1.3},
    {phi: 1.0, len: 0.75, w: 1.3},
    {phi: -1.7, len: 0.7, w: 1.3},
    {phi: 1.7, len: 0.7, w: 1.3}
  ],
  raise: [
    {phi: -0.5, len: 1.3, w: 0.9},
    {phi: 0.5, len: 1.3, w: 0.9},
    {phi: -2.4, len: 0.7, w: 1.2},
    {phi: 2.4, len: 0.7, w: 1.2}
  ]
};
// ---------- the parts ----------
// A part: reg — the registry (v11.70): every style with the clades it belongs to, the cores it can stand on (`cores`; none listed: any of the
// clade's) and the params it reads (`params`; none listed: all); the first style is the default; `styles` and `clades` are read off it at
// load — params, each with its label (`by`: a style's own word where the key means another thing there), its unit (`unit`; a 'len' or a 'z'
// is metres), its believable band b and extreme band x and its default d next to each other, so a key means one thing per part (a default may
// be a function of the frame F: what the lab places when you add it), cost in points, req (cannot be removed once the clade requires it), mirror (a
// placed part that can be doubled across x: two for twice the cost; the required ones are symmetrical already) and build(ctx,p) →
// {anim?, rig?, hit?, thrust?, area?, mass?, turn?}: static geometry goes into ctx.P (one draw call with the body), moving parts add
// their own meshes to ctx.g and return an anim hook. ctx.clock(f0,f1) hands out swimClocks; ctx.beat is the core's [f0,f1].
const PARTS = {
  eyes: {
    reg:{
      collar:{clades:['ringmouths'],params:['n','z','R','r','sy','y0']},
      cluster:{clades:['ringmouths'],params:['n','y','z','R','r']},
      ring:{clades:['slowbloods'],params:['z','R','pred']},
      stalks:{clades:['hingeshells'],params:['n','x','y','z','len','size','tilt','splay','thick','sc','rise','snap']},
      rim:{clades:['hingeshells'],params:['n','x','y','z','size','sweep','snap']},
      crown:{clades:['hingeshells'],params:['x','y','z','len','size','tilt','snap']},
      under:{clades:['hingeshells'],params:['n','x','y','z','size','snap']},
      valve:{clades:['hingeshells'],params:['vs','vs2','vx','vy','vf','vb']},
      arc:{clades:['hingeshells'],params:['n','x','r','y','z','arc','size','snap']},
      rows:{clades:['hingeshells'],params:['n','rows','x','y','z','dy','dz','size','size2','snap']}
    },
    cost: 2,
    params: {
      n: {label: 'count', k: 'n', b: (F, p) => (p.style === 'stalks' ? [1, 3] : p.style === 'rows' ? [2, 6] : [3, 12]), x: [1, 24], d: (F, p) => (p.style === 'stalks' ? 1 : p.style === 'rim' ? 5 : p.style === 'under' || p.style === 'rows' ? 4 : p.style === 'arc' ? 7 : 8)},
      z: {
        label: 'z (fore–aft)',
        k: 'z',
        b: [-1, 1],
        x: [-4, 4],
        d: (F, p) => {
          const a = F.anchors[p.style === 'cluster' ? 'cluster' : 'collar'] || F.anchors.eyes;
          return a ? a.z : p.style === 'rim' || p.style === 'rows' ? F.zf : p.style === 'under' ? F.zf - F.H.l * 0.1 : F.zh;
        }
      },
      R: {
        label: 'ring radius',
        k: 'len',
        b: [0.05, 1],
        x: [0.02, 2],
        d: (F, p) => {
          const a = F.anchors[p.style === 'cluster' ? 'cluster' : 'collar'] || F.anchors.eyes;
          return a ? a.R : F.Rmax;
        }
      },
      r: {
        label: 'radius',
        k: 'len',
        b: [0.01, 0.2],
        x: [0.005, 0.5],
        d: (F, p) => {
          if (p.style === 'arc') return F.H ? F.H.l * 0.35 : F.Rmax * 0.3;
          const a = F.anchors[p.style === 'cluster' ? 'cluster' : 'collar'];
          return a ? a.r : F.Rmax * 0.09;
        }
      },
      y: {
        label: 'y (up)',
        k: 'len',
        b: [-0.5, 0.8],
        x: [-1, 2],
        d: (F, p) =>
          F.anchors.cluster ? F.anchors.cluster.y : F.H ? (F.hy || 0) + (p.style === 'crown' ? -F.ht * 0.3 : p.style === 'under' ? -F.ht * 0.6 : F.ht) : 0
      },
      sy: {label: 'squash', k: 'k', b: [0.6, 1], x: [0.3, 1.4], d: F => (F.anchors.collar ? F.anchors.collar.sy : 1)},
      y0: {label: 'height', k: 'k', b: [0, 1], x: [-1, 2], d: F => (F.anchors.collar ? F.anchors.collar.y0 : 0)},
      pred: {label: 'forward-facing', k: 'b', d: false},
      // the hingeshell styles (the head box): x the lateral spread (mirrored), len the stalk, size the eye, tilt forward and splay outward in degrees, sweep how far back the rim's outer eyes sit, snap: y follows the surface (armour included)
      x: {
        label: 'x (out)',
        k: 'len',
        b: [0, 0.3],
        x: [0, 1],
        d: (F, p) =>
          F.H ? (p.style === 'stalks' ? F.H.w * 0.34 : p.style === 'rim' ? F.H.w * 0.45 : p.style === 'crown' ? F.H.w * 0.52 : p.style === 'arc' ? F.H.w * 0.44 : F.H.w * 0.4) : 0
      },
      len: {label: 'length', k: 'len', b: [0.02, 0.3], x: [0.005, 1], d: (F, p) => (F.H ? F.H.h * (p.style === 'crown' ? 0.9 : 0.7) : 0.2)},
      size: {
        label: 'eye size',
        k: 'len',
        b: [0.005, 0.08],
        x: [0.002, 0.3],
        d: (F, p) => (F.H ? F.H.h * (p.style === 'stalks' ? 0.3 : p.style === 'crown' ? 0.32 : p.style === 'rim' ? 0.16 : 0.17) : 0.05)
      },
      tilt: {label: 'tilt forward', unit: '°', k: 'k', b: [-30, 80], x: [-90, 90], d: (F, p) => (p.style === 'crown' ? 11.3 : 8.5)},
      splay: {label: 'splay out', unit: '°', k: 'k', b: [0, 70], x: [-30, 90], d: 35},
      sweep: {label: 'sweep back', k: 'k', b: [0, 1], x: [-1, 2], d: 0.5},
      arc: {label: 'arc', unit: '°', k: 'k', b: [20, 90], x: [5, 180], d: 60},
      snap: {label: 'snap to the body', k: 'b', d: true},
      // v11.25: stalks that rise on the tell (the trap: rise m, their own mesh), the stalk's thickness over the eye and its colour;
      // arc: n eyes on an arc round the head's rim (the scuttle, the tread) — x and r its half-axes, sweep the half-angle in degrees;
      // rows: rows of n across the face (the hook's eight in two rows, the picker's pair), dy/dz between rows, size2 the lower row's
      rise: {label: 'rise on the tell', k: 'len', b: [0, 0.2], x: [0, 1], d: 0},
      thick: {label: 'stalk thickness', k: 'k', b: [0.2, 0.7], x: [0.05, 1.5], d: 0.4},
      sc: {label: 'stalk colour', k: 's', opts: ['joint', 'top', 'eye'], d: 'joint'},
      rows: {label: 'rows', k: 'n', b: [1, 2], x: [1, 4], d: (F, p) => (p.style === 'rows' ? 2 : 1)},
      dy: {label: 'row drop', k: 'len', b: [-0.1, 0], x: [-0.5, 0.5], d: F => -(F.H ? F.H.h * 0.33 : 0.1)},
      dz: {label: 'spacing', k: 'len', b: [-0.05, 0.05], x: [-0.5, 0.5], d: 0},
      // valve (v11.70.1: it had no controls): two pairs on the valves' faces — vs/vs2 the front and back eye, vx out across the valve (of its width), vy up, vf/vb along it (of its length); the valves part builds them
      vs: {label: 'front eye size', k: 'len', b: [0.008, 0.04], x: [0.002, 0.1], d: F => F.h0 * 0.14},
      vs2: {label: 'back eye size', k: 'len', b: [0.006, 0.04], x: [0.002, 0.1], d: F => F.h0 * 0.12},
      vx: {label: 'out', unit: '×valve', k: 'k', b: [0.3, 0.5], x: [0, 0.6], d: 0.47},
      vy: {label: 'y (up)', k: 'len', b: [-0.02, 0.03], x: [-0.1, 0.1], d: F => F.h0 * 0.06},
      vf: {label: 'front eye', unit: '×valve', k: 'k', b: [0, 0.5], x: [-0.5, 0.5], d: 0.3},
      vb: {label: 'back eye', unit: '×valve', k: 'k', b: [0, 0.4], x: [-0.5, 0.5], d: 0.1},
      size2: {label: 'lower row size', k: 'len', b: [0.005, 0.08], x: [0.002, 0.3], d: (F, p) => (F.H ? F.H.h * 0.1 : 0.04)}
    },
    build: (ctx, p) => {
      const P = ctx.P,
        pal = ctx.pal,
        F = ctx.F,
        st = p.style;
      if (st === 'collar') eyeRing(P, p.n, p.z, p.R, p.r, pal.eye, 0.5, p.sy, p.y0);
      else if (st === 'cluster') eyeCluster(P, p.n === 5 ? 5 : 3, p.y, p.z, p.R, p.r, pal.eye, pal.pupil, palk(pal, 'mantle', 'flesh', 'top'));
      else if (st === 'ring') slowEyes(P, pal, p.z, p.R, !!p.pred);
      else {
        // the hingeshell styles: placed at (x, y, z) on the body, snapped to its surface (the armour on top of it) unless told not to
        const H = F.H,
          z = p.z,
          sz = p.size,
          top = (x, zz) => {
            if (!p.snap || !ctx.top) return p.y;
            const y = ctx.top(x, zz);
            return y === null ? p.y : y;
          },
          bot = (x, zz) => {
            if (!p.snap || !ctx.bottom) return p.y;
            const y = ctx.bottom(x, zz);
            return y === null ? p.y : y - sz * 0.9;
          };
        if (st === 'stalks') {
          const n = Math.max(1, Math.round(p.n)),
            SP = p.rise > 0 ? [] : P, // rising stalks get their own mesh, lifted on the tell
            scol = p.sc === 'top' ? pal.top : p.sc === 'eye' ? pal.eye : pal.joint;
          for (let k = 0; k < n; k++) {
            const zz = z - k * p.len * 0.6;
            for (const sx of [1, -1])
              stalkEye(
                SP,
                sx * p.x,
                top(sx * p.x, zz),
                zz,
                V3(sx * Math.tan(p.splay * DEG), 1, Math.tan(p.tilt * DEG)),
                p.len * (1 - 0.12 * k),
                sz * p.thick,
                sz,
                scol,
                pal.eye
              );
          }
          if (p.rise > 0) {
            const m = new THREE.Mesh(merge(SP), ctx.mat);
            ctx.bf.add(m);
            ctx.eyeStyle = st;
            return {
              anim: (t, spd, st2) => {
                m.position.y = p.rise * (st2.tell || 0);
              }
            };
          }
        } else if (st === 'arc') {
          // an arc of n on the head's rim: half-axes x (across) and r (fore–aft) about z, from -sweep to +sweep, the middle one forward
          const n = Math.max(2, Math.round(p.n)),
            sw = p.arc * DEG;
          for (let i = 0; i < n; i++) {
            const a = -sw + (i * 2 * sw) / (n - 1),
              x = Math.sin(a) * p.x,
              zz = z + Math.cos(a) * p.r;
            P.push(part(G.sph(sz, sz > 0.1 ? 6 : 5, sz > 0.1 ? 5 : 4), x, top(x, zz), zz, pal.eye));
          }
        } else if (st === 'rows') {
          const n = Math.max(1, Math.round(p.n)),
            rows = Math.max(1, Math.round(p.rows));
          for (let r = 0; r < rows; r++)
            for (let i = 0; i < n; i++) {
              const u = n > 1 ? i / (n - 1) - 0.5 : 0,
                x = u * 2 * p.x,
                zz = z + r * p.dz,
                y = (p.snap ? top(x, zz) : p.y) + r * p.dy;
              P.push(part(G.sph(r ? p.size2 : sz, 5, 4), x, y, zz, pal.eye));
            }
        } else if (st === 'rim') {
          const n = Math.max(2, Math.round(p.n));
          for (let i = 0; i < n; i++) {
            const u = i / (n - 1) - 0.5,
              x = u * 2 * p.x,
              zz = z - Math.abs(u) * p.sweep * H.l;
            P.push(part(G.sph(sz, 5, 4), x, top(x, zz), zz, pal.eye));
          }
        } else if (st === 'crown') {
          stalkEye(P, 0, top(0, z), z, V3(0, 1, Math.tan(p.tilt * DEG)), p.len, sz * 0.3125, sz, pal.joint, pal.eye);
          for (const sx of [1, -1]) P.push(part(G.sph(sz * 0.625, 5, 4), sx * p.x, p.y, z + H.l * 0.2, pal.eye));
        } else if (st === 'under') {
          const n = Math.max(2, Math.round(p.n));
          for (let i = 0; i < n; i++) {
            const u = i / (n - 1) - 0.5,
              x = u * 2 * p.x;
            P.push(part(G.sph(sz, 5, 4), x, bot(x, z), z, pal.eye));
          }
        }
        ctx.eyeStyle = st;
        ctx.eyeP = p;
      }
      return {};
    }
  },
  mouth: {
    reg:{
      beak:{clades:['ringmouths'],params:['z','y','R']},
      tentacles:{clades:['slowbloods'],params:['z','r','len','n','w','segs','idle','tell','kk','pulse','edge']},
      plates:{clades:['hingeshells'],params:['where','z','y','R','plen','feed','fn','flen','snap']},
      rasp:{clades:['ringmouths'],params:['z','y','R','h']},
      peck:{clades:['hingeshells'],params:['z','y','len','r','dip','pk','wob']},
      slit:{clades:['hingeshells'],params:['z','y','R','h']}
    },
    cost: 3,
    params: {
      z: {label: 'z (fore–aft)', k: 'z', b: [-0.2, 1.2], x: [-4, 4], d: (F, p) => (F.anchors.mouth ? F.anchors.mouth.z : p.where === 'under' ? F.zh - F.H.l * 0.2 : F.zf)},
      // y, R (v11.70): a mouth anchor without them (the slowbloods': z, r, len, n, w) gives the axis and the ring's radius — a slit on a lathe built NaN
      y: {
        label: 'y (up)',
        k: 'len',
        b: [-0.5, 0.5],
        x: [-1, 1],
        d: (F, p) => (F.anchors.mouth ? F.anchors.mouth.y || 0 : (F.hy || 0) + (p.where === 'under' ? -F.ht * 1.05 : p.where === 'probe' ? -F.ht * 0.35 : -F.ht * 0.15))
      },
      R: {
        label: 'mouth radius',
        k: 'len',
        b: [0.01, 0.3],
        x: [0.005, 0.6],
        d: (F, p) => (F.anchors.mouth ? F.anchors.mouth.R || F.anchors.mouth.r : F.H.w * (p.where === 'under' ? 0.3 : p.where === 'probe' ? 0.16 : 0.26))
      },
      // v11.25 — rasp (the shelled grazer's disc under the front: R across, h thick); peck (the picker's proboscis: a rod from
      // (0,y,z) reaching len forward and dip down, pecking pk on the strike with a wob idle)
      h: {label: 'thickness', k: 'len', b: [0.02, 0.2], x: [0.005, 0.6], d: F => F.Rmax * 0.12},
      dip: {label: 'dip', k: 'k', b: [0, 1], x: [-1, 2], d: 0.45},
      pk: {label: 'peck', k: 'k', b: [0.3, 1.5], x: [0, 3], d: 0.9},
      wob: {label: 'wobble', k: 'k', b: [0, 0.15], x: [0, 0.5], d: 0.05},
      where: {label: 'faces', k: 's', opts: ['under', 'front', 'probe'], d: 'front'},
      // the hingeshell plate ring: where it faces, z along the body (snap: an under mouth sits on the belly, a front mouth on the face), plen the probe, and the mouth parts around it
      plen: {label: 'probe length', k: 'len', b: [0.02, 0.4], x: [0.01, 1], d: F => (F.H ? F.H.l * 0.55 : 0.3)},
      feed: {label: 'mouth parts', k: 's', opts: ['none', 'mandibles', 'palps', 'feelers'], d: 'none'},
      fn: {label: 'their count', k: 'n', b: [2, 6], x: [1, 10], d: 4},
      flen: {label: 'their length', k: 'len', b: [0.02, 0.3], x: [0.005, 1], d: F => (F.H ? F.H.l * 0.5 : 0.2)},
      snap: {label: 'snap to the body', k: 'b', d: true},
      // tentacles (mouthArms): r the ring, len the reach, n, w the width, segs; how they open: idle (a permanent gape), tell (the cock), k (the strike's share), pulse (the player's bite opens them)
      r: {label: 'radius', k: 'len', b: [0.02, 0.5], x: [0.01, 1.6], d: F => (F.anchors.mouth ? F.anchors.mouth.r : 0.2)},
      len: {label: 'length', k: 'len', b: [0.05, 1.2], x: [0.02, 3], d: F => (F.anchors.mouth ? F.anchors.mouth.len : 0.5)},
      n: {label: 'count', k: 'n', b: [4, 8], x: [3, 12], d: 6},
      w: {label: 'width', k: 'len', b: [0.01, 0.3], x: [0.005, 0.7], d: F => (F.anchors.mouth ? F.anchors.mouth.w : 0.1)},
      segs: {label: 'segments', k: 'n', b: [1, 3], x: [1, 5], d: 2},
      idle: {label: 'gape', k: 'k', b: [0, 0.3], x: [0, 0.7], d: 0},
      tell: {label: 'cock', k: 'k', b: [0, 0.3], x: [0, 1], d: 0},
      kk: {label: 'strike share', k: 'k', b: [0, 1], x: [0, 1.5], d: 1},
      pulse: {label: 'opens on the bite', k: 'b', d: false},
      edge: {label: 'inner edge', k: 's', opts: ['hold', 'cut', 'point', 'crush'], d: 'hold'} // the petals' inner edges (COMBAT.md §2, v11.54): hold (a clamp that swallows or lets go), cut (tears a piece out with a thrash), point (a needle jaw: skewers), crush (the crusher's plate jaw: shell and plate)
    },
    build: (ctx, p) => {
      const P = ctx.P,
        pal = ctx.pal,
        F = ctx.F,
        st = p.style;
      if (st === 'beak') {
        ringMouth(P, pal, p.y, p.z, p.R);
        return {};
      }
      if (st === 'rasp') {
        P.push(part(G.cyl(p.R, p.R, p.h, 8), 0, p.y, p.z, pal.mouth || pal.band || pal.belly));
        return {};
      }
      if (st === 'slit') {
        // the smallest mouth: one dark box (the forage: a school of flickers cannot afford a plate ring each)
        P.push(part(G.box(p.R * 2, p.h, p.R), 0, p.y, p.z, pal.mouth || pal.gut || pal.joint || pal.top));
        return {};
      }
      if (st === 'peck') {
        const d = V3(0, -p.dip, 1).normalize(),
          L = p.len,
          m = new THREE.Mesh(
            merge([
              part(G.cyl(p.r * 0.55, p.r, L, 5), (d.x * L) / 2, (d.y * L) / 2, (d.z * L) / 2, pal.top, {dir: d}),
              part(G.sph(p.r * 0.73, 5, 4), d.x * L, d.y * L, d.z * L, pal.joint)
            ]),
            ctx.mat
          );
        m.position.set(0, p.y, p.z);
        ctx.bf.add(m);
        return {
          anim: (t, spd, st2) => {
            m.rotation.x = p.pk * (st2.strike || 0) + p.wob * Math.sin(t * 0.7);
          },
          reach: L
        };
      }
      if (st === 'plates') {
        const H = F.H,
          R = p.R,
          down = p.where === 'under';
        let y = p.y,
          z = p.z;
        if (p.snap && ctx.bottom && down) {
          const b = ctx.bottom(0, z);
          if (b !== null) y = b - F.hAt(z) * 0.05;
        }
        if (p.snap && !down) z = F.nose;
        if (down) {
          mouthRing(P, pal, y, z, R);
          feedParts(P, pal, y, z, R, true, p.feed, p.fn, p.flen);
        } else if (p.where === 'front') {
          mouthRing(P, pal, y, z, R, true);
          feedParts(P, pal, y, z, R, false, p.feed, p.fn, p.flen);
        } else {
          const pl = p.plen;
          P.push(part(G.cyl(R * 0.75, R, pl, 6), 0, y, z + pl * 0.5, pal.top, {r: [HPI, 0, 0]}));
          mouthRing(P, pal, y, z + pl, R, true);
          feedParts(P, pal, y, z + pl, R, false, p.feed, p.fn, p.flen);
        }
        return {reach: p.where === 'probe' ? p.plen : 0};
      }
      const snout = mouthArms(ctx.g, pal, p.z, p.r, p.len, p.n, p.w, p.segs, ctx.bf),
        idle = p.idle || 0,
        tk = p.tell || 0,
        kk = p.kk;
      snout.rig.ride = true;
      return {
        rig: snout.rig,
        anim: (t, spd, st) => {
          snout.open(idle + tk * (st.tell || 0) + kk * Math.max(st.strike || 0, p.pulse ? st.pulse || 0 : 0), t);
        },
        mass: p.n * p.len * p.w * p.w * 0.5
      };
    }
  },
  // the ring of arms: the ringmouths' (jet, cone, withdraw, hold, and since v11.25 the crawlers' flat rings — crawl, raise — and
  // the deep line's webbed net) and the drifters' (hang: the bell's stinging ring; lines: the float's fishing lines). plan: the ring
  // differentiated (PLANS); phase in steps of 1/n round the ring (0.5 is a half step, armRing's own default). Flat rings (crawl,
  // raise) lie on the floor round y: z0 is where an arm starts along its axis, y0 its height, sw the sideways sweep of the pose.
  arms: {
    reg:{
      jet:{clades:['ringmouths'],params:['n','z','R','len','w','segs','curve','ks','damp','cosMax','plan','phase','taper','col','shade']},
      cone:{clades:['ringmouths'],params:['n','z','R','len','w','segs','curve','ks','damp','cosMax','plan','phase','taper','col','shade','s0','s1','a0','a1','k0','k1']},
      withdraw:{clades:['ringmouths'],cores:['coilbody'],params:['n','z','R','len','w','segs','curve','ks','damp','cosMax','plan','phase','taper','col','shade','s0','a0']},
      hold:{clades:['ringmouths'],off:true,params:['n','z','R','len','w','segs','curve','ks','damp','cosMax','plan','phase','taper','col','shade','s0','a0']}, // off (v11.70.1, the person): worn by no species; kept, offered to no one
      crawl:{clades:['ringmouths'],params:['n','len','w','segs','ks','damp','cosMax','plan','phase','z0','y0','taper','h','col','shade','s0','s1','a0','a1','k0','k1','sw']},
      raise:{clades:['ringmouths'],params:['n','len','w','segs','ks','damp','cosMax','plan','phase','z0','y0','taper','h','col','shade','s0','a0','wob','wf','f0','sw']},
      net:{clades:['ringmouths'],params:['n','z','R','len','w','segs','curve','ks','damp','cosMax','plan','phase','taper','col','shade','soft','web','wsp','s0','s1','a0','wob','wf','f0','jet']},
      hang:{clades:['drifters'],params:['n','R','len','w','segs','ks','damp','cosMax','phase','y0','taper','col','soft','a0','pm']},
      lines:{clades:['drifters'],params:['n','R','len','w','segs','ks','damp','cosMax','phase','y0','taper','col','soft','lean','toff']}
    },
    cost: 4,
    req: true,
    params: {
      n: {label: 'count', k: 'n', b: [4, 24], x: [2, 32], d: (F, p) => (p.style === 'crawl' ? 6 : p.style === 'raise' ? 4 : 8)},
      z: {label: 'z (fore–aft)', k: 'z', b: [-0.5, 1.5], x: [-4, 4], d: F => (F.anchors.ring ? F.anchors.ring.z : 0)},
      R: {label: 'ring radius', k: 'len', b: [0.05, 1], x: [0.02, 3], d: F => (F.anchors.ring ? F.anchors.ring.R : F.Rmax * 0.6)},
      len: {label: 'length', k: 'len', b: [0.3, 8], x: [0.1, 14], d: (F, p) => F.L * (p.style === 'lines' ? 7 : 0.8)},
      w: {label: 'width', k: 'len', b: [0.005, 0.5], x: [0.002, 1], d: F => F.Rmax * 0.35},
      segs: {label: 'segments', k: 'n', b: [2, 16], x: [2, 20], d: (F, p) => (p.style === 'lines' ? 14 : 4)},
      curve: {label: 'curve', k: 'k', b: [0, 0.25], x: [-0.1, 0.4], d: 0.02},
      ks: {label: 'stiffness', k: 'k', b: [8, 90], x: [3, 150], d: 55},
      damp: {label: 'damping', k: 'k', b: [4, 12], x: [2, 20], d: 9},
      cosMax: {label: 'joint limit', k: 'k', b: [0.2, 0.9], x: [0.05, 1], d: 0.55},
      plan: {label: 'plan', k: 's', opts: ['242', 'equal', 'fan', 'crawl', 'raise'], d: (F, p) => (p.style === 'crawl' ? 'crawl' : p.style === 'raise' ? 'raise' : F.anchors.collar ? '242' : 'equal')},
      phase: {label: 'phase (steps)', k: 'k', b: [0, 1], x: [-2, 2], d: 0.5},
      z0: {label: 'first z', k: 'len', b: [0, 0.6], x: [-1, 1], d: 0},
      y0: {label: 'lift', k: 'len', b: [-0.3, 0.3], x: [-2, 2], d: F => (F.anchors.ring && F.anchors.ring.y0 !== undefined ? F.anchors.ring.y0 : 0)},
      taper: {label: 'taper', k: 'k', b: [0.6, 0.98], x: [0.3, 1], d: (F, p) => (p.style === 'lines' ? 0.97 : p.style === 'hang' ? 0.9 : 0.76)},
      h: {label: 'box height', k: 'k', b: [0.5, 1.5], x: [0.2, 3], d: 1},
      col: {label: 'colour', k: 's', opts: ['arm', 'top', 'belly', 'flesh', 'web'], d: 'arm'},
      shade: {label: 'countershaded', k: 'b', d: false},
      soft: {label: 'soft (no contact)', k: 'b', d: (F, p) => p.style === 'net' || p.style === 'hang' || p.style === 'lines'},
      web: {label: 'webbed', k: 'b', d: (F, p) => p.style === 'net'},
      wsp: {label: 'web spread', k: 'k', b: [0.4, 0.9], x: [0, 1.5], d: 0.8},
      sw: {label: 'sweep', k: 'k', b: [0, 0.4], x: [0, 1], d: 0.15},
      // the pose: jet (the jetters: spread by speed, closed on the jet), cone (great/ortho: closing from s0 to s1 over the speed band
      // k0..k1), withdraw (the coilshell: pulled in when st.withdrawn), hold (a fixed spread), crawl (flat: s0/a0 at rest to s1/a1 over
      // the band), raise (held up: s0 with a slow wob), net (s0 with a wob, s1 on the jet), hang (0 spread, a0 sway, half the bell's
      // beat), lines (streamed against the water: lean per m/s, toff a phase offset)
      s0: {label: 'spread', k: 'k', b: [-0.4, 0.9], x: [-0.6, 1.5], d: (F, p) => (p.style === 'raise' ? 0.8 : p.style === 'net' ? 0.8 : p.style === 'crawl' ? 0 : 0.3)},
      s1: {label: 'spread, fast', k: 'k', b: [-0.4, 0.9], x: [-0.6, 1.5], d: (F, p) => (p.style === 'net' ? 0.15 : p.style === 'crawl' ? 0.5 : 0.1)},
      a0: {label: 'curl', k: 'k', b: [0, 0.2], x: [0, 0.5], d: (F, p) => (p.style === 'raise' ? 0.2 : p.style === 'net' ? 0.05 : p.style === 'hang' ? 0.08 : p.style === 'crawl' ? 0.04 : 0.1)},
      a1: {label: 'curl, fast', k: 'k', b: [0, 0.2], x: [0, 0.5], d: (F, p) => (p.style === 'crawl' ? 0 : 0.1)},
      k0: {label: 'from speed', k: 'k', b: [0.4, 1.4], x: [0, 3], d: (F, p) => (p.style === 'crawl' ? 1.2 : 0.6)},
      k1: {label: 'to speed', k: 'k', b: [1, 2], x: [0, 4], d: (F, p) => (p.style === 'crawl' ? 1.8 : 1.4)},
      wob: {label: 'wobble', k: 'k', b: [0, 0.15], x: [0, 0.5], d: (F, p) => (p.style === 'raise' ? 0.1 : 0.06)},
      wf: {label: 'wobble rate', k: 'k', b: [0.2, 1.2], x: [0.05, 3], d: (F, p) => (p.style === 'raise' ? 0.9 : 0.5)},
      f0: {label: 'rate', k: 'k', b: [0.3, 1.2], x: [0.05, 3], d: (F, p) => (p.style === 'raise' ? 0.7 : 0.5)},
      pm: {label: 'beat share', k: 'k', b: [0.25, 1], x: [0.05, 2], d: 0.5},
      jet: {label: 'closes on the jet', k: 'b', d: true},
      lean: {label: 'lean per m/s', k: 'k', b: [1, 4], x: [0.2, 8], d: 2.6},
      toff: {label: 'phase offset', k: 'k', b: [0, 3], x: [0, 10], d: 0}
    },
    build: (ctx, p) => {
      const st0 = p.style,
        flat = st0 === 'crawl' || st0 === 'raise',
        down = st0 === 'hang' || st0 === 'lines',
        o = {ks: p.ks, damp: p.damp, cosMax: p.cosMax, mat: ctx.mat, taper: p.taper};
      if (PLANS[p.plan]) o.plan = PLANS[p.plan];
      if (p.phase !== 0.5) o.phase = (p.phase * TAU) / Math.max(1, p.n);
      if (flat) o.flat = true;
      if (down) o.down = true;
      if (flat || down) {
        o.z0 = p.z0;
        o.y0 = p.y0;
      }
      if (p.h !== 1) o.h = p.h;
      if (p.shade) o.c2 = ctx.pal.belly;
      if (p.soft) o.soft = true;
      if (p.web) o.web = {c: palk(ctx.pal, 'web', 'belly', 'top'), spread: p.wsp};
      const col = palk(ctx.pal, p.col, 'arm', 'flesh', 'top'),
        rig = armRing(ctx.g, p.n, p.z, p.R, p.len, p.w, col, p.segs, p.curve, o),
        ck = ctx.clock(ctx.beat[0], ctx.beat[1]);
      let anim;
      if (st0 === 'jet') {
        const jetK = easer(7);
        anim = (t, spd, st) => {
          const j = jetK(t, st.jet ? 1 : 0),
            k = Math.min(1, spd * 0.15);
          ringPose(rig, lerp(0.32 - 0.12 * k + 0.06 * Math.sin(t * 1.1), 0.05, j), lerp(0.09 + 0.11 * k, 0.06, j), ck(t, spd));
        };
      } else if (st0 === 'cone')
        anim = (t, spd) => {
          const k = smooth(p.k0, p.k1, spd);
          ringPose(rig, lerp(p.s0, p.s1, k), lerp(p.a0, p.a1, k), ck(t, spd));
        };
      else if (st0 === 'withdraw')
        anim = (t, spd, st, B) => {
          const wd = !!st.withdrawn;
          B.soft.position.z = lerp(B.soft.position.z, wd ? -0.9 : 0, 0.12);
          rig.zoff = B.soft.position.z;
          ringPose(rig, wd ? -0.25 : p.s0, wd ? 0.02 : p.a0, ck(t, spd));
        };
      else if (st0 === 'crawl')
        anim = (t, spd) => {
          const k = smooth(p.k0, p.k1, spd);
          ringPose(rig, lerp(p.s0, p.s1, k), lerp(p.a0, p.a1, k), ck(t, spd), p.sw);
        };
      else if (st0 === 'raise') {
        const cw = ctx.clock(p.f0, 0);
        anim = t => {
          ringPose(rig, p.s0 + p.wob * Math.sin(t * p.wf), p.a0, cw(t, 0), p.sw);
        };
      } else if (st0 === 'net') {
        const cw = ctx.clock(p.f0, 0);
        anim = (t, spd, st) => {
          ringPose(rig, st.jet && p.jet ? p.s1 : p.s0 + p.wob * Math.sin(t * p.wf), p.a0, cw(t, 0));
        };
      } else if (st0 === 'hang')
        anim = (t, spd, st, B) => {
          ringPose(rig, 0, p.a0, (B && B.ph !== undefined ? B.ph : ck(t, spd)) * p.pm);
        };
      else if (st0 === 'lines')
        anim = (t, spd, st) => {
          linePose(rig, st.lx || 0, st.lz || 0, p.lean / ctx.s, t + p.toff);
        };
      else
        anim = (t, spd) => {
          ringPose(rig, p.s0, p.a0, ck(t, spd));
        };
      const pl = PLANS[p.plan],
        lk = pl ? pl.reduce((a, e) => a + (e.len || 1), 0) / pl.length : 1;
      return {
        rig: rig,
        anim: anim,
        mass: p.n * p.len * lk * p.w * p.w * (down ? 0.3 : 0.6),
        turn: down ? 0 : 0.3,
        thrust: down ? 0 : p.n * p.len * lk * p.w * (flat ? 0.6 : 0.4),
        legs: flat && st0 === 'crawl',
        reach: down ? 0 : p.len * lk
      };
    }
  },
  shell: {
    reg:{
      coil:{clades:['ringmouths'],params:['n','R0','R1','cy','cz','k','carry','spines']},
      cone:{clades:['ringmouths'],params:['L','z0','r0','segs','turns']}
    },
    cost: 5,
    params: {
      n: {label: 'chambers', k: 'n', b: [14, 30], x: [8, 48], d: 22},
      R0: {label: 'inner radius', k: 'len', b: [0.04, 0.2], x: [0.02, 0.5], d: 0.12},
      R1: {label: 'outer radius', k: 'len', b: [0.3, 1.4], x: [0.15, 3], d: 1.0},
      cy: {label: 'shell y', k: 'len', b: [0.2, 1], x: [-0.5, 2], d: 0.55},
      cz: {label: 'shell z', k: 'z', b: [-1.5, 0], x: [-4, 4], d: -1.0},
      k: {label: 'whorl', k: 'k', b: [0.3, 0.45], x: [0.2, 0.7], d: 0.36},
      carry: {label: 'carried', k: 's', opts: ['up', 'flat', 'vertical'], d: 'up'},
      spines: {label: 'spines', k: 'b', d: false},
      // cone (the ortho): L back from z0, r0 at the front, segs, helix turns
      L: {label: 'length', k: 'len', b: [3, 10], x: [1, 20], d: 7.5},
      z0: {label: 'first z', k: 'z', b: [1, 5], x: [-4, 8], d: 3.4},
      r0: {label: 'front radius', k: 'len', b: [0.3, 1], x: [0.1, 2], d: 0.62},
      segs: {label: 'segments', k: 'n', b: [5, 9], x: [3, 14], d: 7},
      turns: {label: 'helix turns', k: 'k', b: [2, 5], x: [0, 12], d: 3.5}
    },
    build: (ctx, p) => {
      const pal = ctx.pal,
        S = [];
      if (p.style === 'coil') {
        const o = {n: p.n, R0: p.R0, R1: p.R1, cy: p.cy, cz: p.cz, k: p.k, spines: p.spines};
        if (p.carry === 'up') o.up = true;
        else if (p.carry === 'flat') o.flat = true;
        coilShell(S, pal, o);
        ctx.g.add(new THREE.Mesh(merge(S), MAT));
        let vol = 0;
        const b = Math.log(p.R1 / p.R0) / (1.75 * TAU);
        for (let i = 0; i <= p.n; i++) {
          const R = p.R0 * Math.exp((b * 1.75 * TAU * i) / p.n),
            rr = 0.08 * p.R1 + p.k * R;
          vol += (4 / 3) * Math.PI * rr * rr * rr * 0.55;
        }
        return {
          mass: vol * GRAMMAR.ringmouths.shell,
          area: p.R1 * p.R1 * 0.9,
          chambered: true,
          extent: [p.cz - p.R1 * 1.1, p.cz + p.R1 * 0.4],
          hit: [{a: [0, p.cy + 0.1, p.cz - 0.1], b: [0, p.cy + 0.55, p.cz - 0.1], r: p.R1 * 0.8}]
        };
      }
      // the cone: cylinders tapering back from z0, the bands wound as a helix (buildOrtho)
      let z = p.z0,
        r = p.r0;
      const dz = p.L / p.segs,
        C = [];
      for (let i = 0; i < p.segs; i++) {
        const r2 = r * (1 - (i + 1) / p.segs) + 0.04;
        C.push(part(G.cyl(r, r2, dz, 8), 0, 0, z - dz / 2, [1, 1, 1], {r: [HPI, 0, 0]}));
        z -= dz;
        r = r2;
      }
      ctx.P.push(part(helix(merge(C), pal.shell, pal.band, p.z0 - p.L - 0.1, p.z0 + 0.1, p.turns), 0, 0, 0, [1, 1, 1]));
      return {
        mass: ((Math.PI * p.r0 * p.r0 * p.L) / 3) * 0.6 * GRAMMAR.ringmouths.shell,
        area: 0,
        chambered: true,
        streamline: 0.6,
        extent: [p.z0 - p.L, p.z0],
        hit: [{a: [0, 0, p.z0 - p.L], b: [0, 0, p.z0], r: p.r0 * 0.8}]
      };
    }
  },
  ridge: {
    reg:{
      gladius:{clades:['ringmouths']}
    },
    cost: 1,
    params: {
      w: {label: 'width', k: 'len', b: [0.02, 0.15], x: [0.01, 0.6], d: F => (F.anchors.ridge ? F.anchors.ridge.w : F.Rmax * 0.2)},
      h: {label: 'height', k: 'len', b: [0.03, 0.3], x: [0.01, 0.8], d: F => (F.anchors.ridge ? F.anchors.ridge.h : F.Rmax * 0.25)},
      len: {label: 'length', k: 'len', b: [0.3, 1], x: [0.1, 1.2], d: F => (F.anchors.ridge ? F.anchors.ridge.len : F.L * 0.7)},
      y: {label: 'y (up)', k: 'len', b: [0.1, 0.6], x: [0, 2], d: F => (F.anchors.ridge ? F.anchors.ridge.y : F.Rmax * 0.9)},
      z: {label: 'z (fore–aft)', k: 'z', b: [-1, 0.2], x: [-4, 4], d: F => (F.anchors.ridge ? F.anchors.ridge.z : (F.nose + F.tail) / 2)}
    },
    build: (ctx, p) => {
      ctx.P.push(part(G.box(p.w, p.h, p.len), 0, p.y, p.z, palk(ctx.pal, 'ridge', 'web', 'top')));
      return {mass: p.w * p.h * p.len * 1.5};
    }
  },
  skirt: {
    reg:{
      trio:{clades:['ringmouths']}
    },
    cost: 2,
    params: {
      z: {label: 'z (fore–aft)', k: 'z', b: [-1.2, -0.2], x: [-4, 4], d: F => (F.anchors.skirt ? F.anchors.skirt.z : F.tail + F.L * 0.3)},
      R: {label: 'ring radius', k: 'len', b: [0.1, 2], x: [0.05, 4], d: F => (F.anchors.skirt ? F.anchors.skirt.R : F.Rmax)},
      h: {label: 'height', k: 'len', b: [0.2, 2], x: [0.05, 4], d: F => (F.anchors.skirt ? F.anchors.skirt.h : F.Rmax * 1.3)},
      len: {label: 'length', k: 'len', b: [0.2, 2], x: [0.05, 4], d: F => (F.anchors.skirt ? F.anchors.skirt.len : F.L * 0.42)},
      f0: {label: 'rate', k: 'k', b: [0.5, 6], x: [0.2, 10], d: 4.5},
      f1: {label: 'rate gain', k: 'k', b: [0, 0.5], x: [0, 2], d: 0.15},
      amp: {label: 'amplitude', k: 'k', b: [0.1, 0.5], x: [0, 1], d: 0.35},
      k0: {label: 'from speed', k: 'k', b: [0.2, 1], x: [0, 1], d: 0.3},
      sk: {label: 'speed gain', k: 'k', b: [0, 0.4], x: [0, 1], d: 0.2}
    },
    build: (ctx, p) => {
      const lobes = skirtTrio(ctx.g, ctx.pal, p.z, p.R, p.h, p.len),
        ckf = ctx.clock(p.f0, p.f1);
      return {
        anim: (t, spd) => {
          const fl = p.amp * Math.sin(ckf(t, spd)) * Math.min(1, p.k0 + spd * p.sk);
          for (let i = 0; i < 3; i++) lobes[i].rotation.x = fl * (i ? -0.6 : 1);
        },
        thrust: 3 * p.h * p.len * p.amp * Math.sqrt(p.f0 + p.f1) * 0.5,
        turn: 0.4,
        area: p.h * p.R * 0.14 * 3
      };
    }
  },
  chevrons: {
    reg:{
      rows:{clades:['slowbloods']}
    },
    cost: 1,
    params: {
      z0: {label: 'first z', k: 'z', b: [0, 1], x: [-4, 4], d: F => F.anchors.chevrons.z0},
      z1: {label: 'last z', k: 'z', b: [-1.5, 0], x: [-4, 4], d: F => F.anchors.chevrons.z1},
      ds: {label: 'spacing', k: 'len', b: [0.05, 0.4], x: [0.02, 1.5], d: F => F.anchors.chevrons.ds},
      sz: {label: 'size', k: 'len', b: [0.01, 0.3], x: [0.005, 0.8], d: F => F.anchors.chevrons.sz}
    },
    build: (ctx, p) => {
      chevrons(ctx.P, ctx.pal, p.z0, p.z1, p.ds, ctx.F.rAt, p.sz);
      return {};
    }
  },
  spines: {
    reg:{
      row:{clades:['slowbloods']},
      thorns:{clades:['hingeshells'],was:'row'} // v11.70.1: a style is one clade's (the person, 21 Sep 2026: two clades' parts are genetically distinct however alike); the hingeshells' spines were the slowbloods' row, and still build as it for now — a first pass. was: a hingeshell spec that wears the old name keeps its numbers
    },
    cost: 2,
    params: {
      n: {label: 'count', k: 'n', b: [1, 9], x: [1, 16], d: 6},
      r: {label: 'radius', k: 'len', b: [0.01, 0.15], x: [0.005, 0.4], d: F => F.Rmax * 0.16},
      h: {label: 'height', k: 'len', b: [0.03, 0.9], x: [0.01, 2], d: F => F.Rmax * 0.9},
      z0: {label: 'first z', k: 'z', b: [0, 1.2], x: [-4, 4], d: F => (F.anchors.chevrons ? F.anchors.chevrons.z0 : F.z1 || F.tail)},
      dz: {label: 'spacing', k: 'len', b: [-0.5, 0.5], x: [-1.5, 1.5], d: F => F.Rmax * 0.6},
      y0: {label: 'base y', k: 'len', b: [-0.5, 1.2], x: [-3, 3], d: F => (F.hy || 0) + F.Rmax * 1.05},
      dy: {label: 'step up', k: 'k', b: [0, 0.05], x: [-0.2, 0.2], d: 0.02},
      x: {label: 'x (out)', k: 'len', b: [0, 0.4], x: [0, 1], d: 0},
      rx: {label: 'rake', unit: 'rad', k: 'k', b: [-1.6, 0], x: [-1.8, 0.5], d: -0.5},
      ry: {label: 'splay', unit: 'rad', k: 'k', b: [0, 0.4], x: [-1, 1], d: 0},
      col: {label: 'colour', k: 's', opts: ['top', 'joint', 'plate'], d: 'top'}
    },
    build: (ctx, p) => {
      const P = ctx.P,
        pal = ctx.pal,
        col = palk(pal, p.col, 'top');
      if (p.x > 0)
        for (let i = 0; i < p.n; i++)
          for (const sx of [1, -1]) P.push(part(G.cone(p.r, p.h, 4), sx * p.x, p.y0 - i * p.dy, p.z0 - i * p.dz, col, {r: [p.rx, 0, sx * p.ry]}));
      else for (let i = 0; i < p.n; i++) P.push(part(G.cone(p.r, p.h, 4), 0, p.y0 - i * p.dy, p.z0 - i * p.dz, col, {r: [p.rx, 0, 0]}));
      return {};
    }
  },
  barbels: {
    reg:{
      cone:{clades:['slowbloods'],params:['x','y','z','len','r','rx','ry']},
      whisker:{clades:['slowbloods'],params:['len','r','z','pairs']} // pairs (v11.70): the style reads it and never listed it, so only a spec that brought its own built — the lab's add threw
    },
    cost: 1,
    paired: true,
    params: {
      x: {label: 'x (out)', k: 'len', b: [0.05, 0.9], x: [0, 2], d: F => F.Rmax * 0.6},
      y: {label: 'y (up)', k: 'len', b: [-1, 0], x: [-2, 1], d: F => -F.Rmax * 0.5},
      z: {label: 'z (fore–aft)', k: 'z', b: [0.5, 1.4], x: [-4, 4], d: F => F.nose + 0.1},
      len: {label: 'length', k: 'len', b: [0.05, 1.5], x: [0.02, 4], d: F => F.Rmax * 0.7},
      r: {label: 'radius', k: 'len', b: [0.005, 0.08], x: [0.002, 0.3], d: 0.05},
      rx: {label: 'rake', unit: 'rad', k: 'k', b: [0.6, 1.6], x: [0, 3], d: HPI - 0.5},
      ry: {label: 'splay', unit: 'rad', k: 'k', b: [0, 0.8], x: [-1.5, 1.5], d: 0.5},
      pairs: {
        label: 'pairs',
        k: 'l',
        d: [
          [0.22, -0.15],
          [0.3, 0.12]
        ]
      }
    },
    build: (ctx, p) => {
      const P = ctx.P,
        pal = ctx.pal;
      if (p.style === 'whisker') {
        for (const e0 of p.pairs)
          for (const sx of [1, -1]) {
            const e = [sx * e0[0], e0[1]];
            P.push(part(G.cyl(p.r * 0.3, p.r * 0.7, p.len, 4), e[0] * 1.6, e[1], p.z, pal.band, {dir: V3(e[0], e[1] * 0.5, 1)}));
          }
        return {};
      }
      for (const sx of [1, -1]) P.push(part(G.cone(p.r, p.len, 4), sx * p.x, p.y, p.z, pal.belly, {r: [p.rx, 0, sx * p.ry]}));
      return {};
    }
  },
  plates: {
    reg:{
      rows:{clades:['slowbloods']}
    },
    cost: 3,
    cover: (F, c, p) => ({
      top: (x, z) => {
        if (z > p.z0 + p.l * 0.5 || z < p.z0 - (p.n - 1) * p.dz - p.l * 0.5) return null;
        const r = F.rAt(z),
          half = (p.rows - 1) / 2,
          xm = half * p.spread * r + p.w * 0.5;
        if (Math.abs(x) > xm) return null;
        return Math.sqrt(Math.max(0.05, r * r - x * x)) * p.yk + p.th * 0.5 + (F.cy || 0);
      }
    }),
    params: {
      rows: {label: 'rows', k: 'n', b: [1, 3], x: [1, 5], d: 3},
      n: {label: 'count', k: 'n', b: [3, 8], x: [1, 14], d: 6},
      z0: {label: 'first z', k: 'z', b: [0, 1.2], x: [-4, 4], d: F => F.anchors.chevrons.z0},
      dz: {label: 'spacing', k: 'len', b: [0.08, 0.8], x: [0.02, 2], d: F => F.Rmax * 0.6},
      w: {label: 'width', k: 'len', b: [0.05, 0.8], x: [0.02, 2], d: F => F.Rmax * 0.45},
      th: {label: 'thickness', k: 'len', b: [0.01, 0.2], x: [0.005, 0.5], d: 0.12},
      l: {label: 'plate length', k: 'len', b: [0.05, 0.8], x: [0.02, 2], d: F => F.Rmax * 0.4},
      spread: {label: 'spread', k: 'k', b: [0.3, 0.9], x: [0, 1.5], d: 0.62},
      yk: {label: 'height', k: 'k', b: [0.3, 1.1], x: [0.2, 1.5], d: 0.98},
      wk: {label: 'width over radius', k: 'k', b: [0, 0.6], x: [0, 1], d: 0},
      rr: {label: 'row radii', k: 'l', d: null}
    },
    build: (ctx, p) => {
      const P = ctx.P,
        pal = ctx.pal,
        F = ctx.F,
        cy = F.cy || 0,
        half = (p.rows - 1) / 2;
      for (let row = -half; row <= half; row++)
        for (let k = 0; k < p.n; k++) {
          const z = p.z0 - k * p.dz,
            r = p.rr ? p.rr[Math.min(k, p.rr.length - 1)] : F.rAt(z),
            x = row * p.spread * r,
            y = cy + Math.sqrt(Math.max(0.05, r * r - x * x)) * p.yk;
          P.push(part(G.box(p.wk > 0 ? p.wk * r : p.w, p.th, p.l), x, y, z, pal.plate || pal.band, {r: [0, 0, -row * 0.55]}));
        }
      return {mass: p.rows * p.n * p.w * p.th * p.l * 2, armour: 0.25};
    }
  },
  fins: {
    reg:{
      trio:{clades:['slowbloods'],cores:['lathe']} // the lathe's own (v11.70): the chain body has no fin anchor and carries its dorsal fin itself (chain.fin)
    },
    cost: 2,
    params: {
      z: {label: 'z (fore–aft)', k: 'z', b: [-0.5, 1], x: [-4, 4], d: F => F.anchors.fins.z},
      R: {label: 'ring radius', k: 'len', b: [0.05, 1.5], x: [0.02, 3], d: F => F.anchors.fins.R},
      h: {label: 'height', k: 'len', b: [0.05, 1.6], x: [0.02, 4], d: F => F.anchors.fins.h},
      len: {label: 'length', k: 'len', b: [0.1, 2], x: [0.02, 5], d: F => F.anchors.fins.len},
      amp: {label: 'amplitude', k: 'k', b: [0, 0.4], x: [0, 1], d: 0.25},
      fk: {label: 'beat ratio', k: 'k', b: [0.6, 1], x: [0.2, 2], d: 0.8},
      dorsal: {label: 'dorsal share', k: 'k', b: [0.1, 0.4], x: [0, 1], d: 0.3},
      col: {label: 'colour', k: 's', opts: ['top', 'rust'], d: 'top'}
    },
    build: (ctx, p) => {
      const fins = finTrio(ctx.bf, ctx.pal, p.z, p.R, p.h, p.len, p.col === 'rust' ? ctx.pal.rust : undefined),
        beat = ctx.beat,
        ck = ctx.clock(beat[0], beat[1]);
      return {
        anim: p.amp
          ? (t, spd) => {
              const f = p.amp * Math.sin(ck(t, spd) * p.fk);
              for (const m of fins) m.rotation.y = m.userData.i ? f * (m.userData.i === 1 ? 1 : -1) : p.dorsal * f;
            }
          : null,
        turn: p.h * p.len * 3,
        thrust: p.h * p.len * p.amp * 2,
        area: p.h * p.len * 0.1
      };
    }
  },
  tail: {
    reg:{
      lathe:{clades:['slowbloods'],params:['prof','z','lz','lh','ll','axis','amp','sp0','spk','full','body','col']},
      cyl:{clades:['slowbloods'],params:['z','L','r0','r1','segs','lz','lh','ll','axis','amp','sp0','spk','full','body','col']},
      lobes:{clades:['slowbloods'],params:['z','lz','lh','ll','axis','amp','sp0','spk','full','body','col']},
      stub:{clades:['slowbloods'],params:[]} // no tail at all (v11.70: it listed none, so it read all fifteen — fifteen sliders on a part that builds nothing)
    },
    cost: 3,
    req: true,
    params: {
      z: {label: 'z (fore–aft)', k: 'z', b: [-1.5, 0], x: [-4, 4], d: F => F.anchors.tail.z},
      L: {label: 'length', k: 'len', b: [0.15, 1.2], x: [0.05, 6], d: F => F.anchors.tail.len},
      r0: {label: 'front radius', k: 'len', b: [0.02, 0.6], x: [0.01, 1.5], d: F => F.anchors.tail.r0},
      r1: {label: 'back radius', k: 'len', b: [0.005, 0.2], x: [0.002, 0.6], d: F => F.anchors.tail.r0 * 0.25},
      segs: {label: 'segments', k: 'n', b: [6, 9], x: [4, 14], d: 8},
      lz: {label: 'lobe z', k: 'len', b: [-2.5, -0.1], x: [-6, 0], d: F => -F.anchors.tail.len * 0.95},
      lh: {label: 'lobe height', k: 'len', b: [0.1, 2.5], x: [0.02, 6], d: F => F.anchors.tail.lobes.h},
      ll: {label: 'lobe length', k: 'len', b: [0.1, 1], x: [0.02, 3], d: F => F.anchors.tail.lobes.len},
      axis: {label: 'axis', k: 's', opts: ['y', 'x'], d: 'y'},
      amp: {label: 'amplitude', k: 'k', b: [0.25, 0.5], x: [0.05, 1.2], d: 0.45},
      sp0: {label: 'speed at rest', k: 'k', b: [0.2, 0.35], x: [0, 1], d: 0.25},
      spk: {label: 'speed gain', k: 'k', b: [0.15, 0.35], x: [0, 1], d: 0.2},
      full: {label: 'whole body', k: 'b', d: false},
      body: {label: 'body colour', k: 'k', b: [0, 0.06], x: [0, 0.2], d: 0.05},
      col: {label: 'colour', k: 's', opts: ['top', 'rust'], d: 'top'},
      prof: {label: 'profile', k: 'l', d: F => FIN_TPROF.map(q => [q[0] * F.anchors.tail.r0 / 0.34, q[1] * F.anchors.tail.len / 1.35])} // the lathe style's stem (v11.70: it had no default, so the style built only on a spec that brought one — the lab's cyl → lathe threw): the blank's, at the core's tail anchor
    },
    build: (ctx, p) => {
      const pal = ctx.pal,
        c = p.col === 'rust' ? pal.rust : undefined,
        T = [];
      if (p.style === 'stub') return {}; // the platebacks' floor sitter (the stone): no tail at all
      if (p.style === 'lathe') T.push(part(G.lathe(p.prof, 8), 0, 0, 0, pal.top, {r: [HPI, 0, 0], c2: c || pal.belly}));
      else if (p.style === 'cyl') T.push(part(G.cyl(p.r0, p.r1, p.L, p.segs), 0, 0, -p.L / 2, pal.top, {r: [HPI, 0, 0], c2: c || pal.belly}));
      tailTrio(T, pal, p.lz, p.lh, p.ll, c);
      let stem = 0;
      if (p.style === 'lathe')
        for (let i = 1; i < p.prof.length; i++) stem += (p.prof[i - 1][0] + p.prof[i][0]) * Math.abs(p.prof[i][1] - p.prof[i - 1][1]);
      else if (p.style === 'cyl') stem = (p.r0 + p.r1) * p.L; // the stem's side area over pi
      const tail = new THREE.Mesh(merge(T), MAT);
      tail.position.set(0, 0, p.z);
      ctx.bf.add(tail);
      const ck = ctx.clock(ctx.beat[0], ctx.beat[1]);
      ctx.tailClock = ck;
      return {
        anim: (t, spd, st, B) => {
          const ph = ck(t, spd),
            a = p.amp * Math.sin(ph) * (p.full ? 1 : Math.min(1, p.sp0 + spd * p.spk));
          if (p.axis === 'x') tail.rotation.x = a;
          else tail.rotation.y = a;
          if (p.body) B.frame.rotation.y = p.body * Math.sin(ph + 0.5); // the whole frame: hull, fins, tail hinge and mouth (v11.18)
        },
        thrust: (p.lh * p.ll * 3 + stem) * p.amp * Math.sqrt(ctx.beat[0] + ctx.beat[1]),
        mass: stem * stem * 0.5,
        area: p.lh * p.ll * 0.05,
        extent: [p.z + p.lz - p.ll * 0.5, p.z]
      };
    }
  },
  // ---------- hingeshells (buildRaptor's choices) ----------
  comb: {
    reg:{
      rake:{clades:['hingeshells'],params:['n','y','z','w','len','snap']},
      teeth:{clades:['hingeshells'],params:['n','x','y','z','w','len','stag','rake']}
    },
    cost: 1,
    params: {
      n: {label: 'count', k: 'n', b: (F, p) => (p.style === 'teeth' ? [6, 20] : [3, 7]), x: [2, 24], d: (F, p) => (p.style === 'teeth' ? 14 : 5)},
      x: {label: 'x (out)', k: 'len', b: [0, 0.4], x: [0, 1], d: F => F.H.w * 0.3},
      y: {label: 'y (up)', k: 'len', b: [-0.2, 0.2], x: [-1, 1], d: (F, p) => (F.hy || 0) + (p.style === 'teeth' ? -F.ht * 1.2 : F.ht * 0.35)},
      z: {label: 'z (fore–aft)', k: 'z', b: [-1, 1.5], x: [-4, 4], d: (F, p) => (p.style === 'teeth' ? F.zh : F.zf)},
      w: {label: 'width', k: 'len', b: [0.005, 0.4], x: [0.002, 1], d: (F, p) => (p.style === 'teeth' ? F.H.w * 0.02 : F.H.w * 0.55)},
      len: {label: 'length', k: 'len', b: [0.02, 0.3], x: [0.005, 1], d: (F, p) => (p.style === 'teeth' ? F.H.h * 0.6 : F.H.l * 0.35)},
      stag: {label: 'stagger', k: 'len', b: [0, 0.05], x: [0, 0.3], d: F => F.H.l * 0.03},
      rake: {label: 'rake', unit: '°', k: 'k', b: [0, 30], x: [-60, 60], d: 14},
      snap: {label: 'snap to the body', k: 'b', d: false}
    },
    build: (ctx, p) => {
      let y = p.y;
      if (p.snap && ctx.top) {
        const t = ctx.top(0, p.z);
        if (t !== null) y = t;
      }
      if (p.style === 'teeth') {
        // the tread's feeding combs: a row of n hanging plates across x, every other one a little forward
        const n = Math.max(2, Math.round(p.n));
        for (let i = 0; i < n; i++) ctx.P.push(part(G.box(p.w, p.len, p.w * 3.2), -p.x + (i * 2 * p.x) / (n - 1), y, p.z + (i % 2) * p.stag, ctx.pal.joint, {r: [p.rake * DEG, 0, 0]}));
        return {};
      }
      comb(ctx.P, ctx.pal, 0, y, p.z, p.n, p.w, p.len);
      return {};
    }
  },
  tailplate: {
    reg:{
      fan:{clades:['hingeshells'],params:['w','l','x','dx','y','dy','z','dz']},
      spine:{clades:['hingeshells'],params:['sl','sr','st','sy','sz']},
      plates:{clades:['hingeshells'],params:['pz','ph','pl']},
      abdomen:{clades:['hingeshells'],params:['n','w0','dw','seg','curl','y','z','amp','flick']}
    },
    cost: 2,
    params: {
      // v11.25: the fan's blades placed (w across, l along, at ±x stepping dx out, y stepping dy up, from z stepping dz back); the
      // abdomen (the flicker): n curling segments from (0,y,z), seg long, w0 wide shrinking dw, curl per segment, a fan of three at
      // the end; sways amp on the beat and snaps under by flick on the strike
      w: {label: 'width', k: 'len', b: [0.1, 1], x: [0.02, 3], d: F => F.w1 * 1.2},
      l: {label: 'plate length', k: 'len', b: [0.05, 0.5], x: [0.01, 2], d: F => F.w1 * 0.55},
      x: {label: 'x (out)', k: 'len', b: [0, 0.5], x: [0, 2], d: F => F.w1 * 0.7},
      dx: {label: 'step out', k: 'len', b: [0, 0.2], x: [0, 1], d: 0.2},
      y: {label: 'y (up)', k: 'len', b: [-0.3, 0.3], x: [-1, 1], d: F => (F.cy || 0) + 0.05},
      dy: {label: 'step up', k: 'len', b: [0, 0.1], x: [0, 0.5], d: 0.08},
      z: {label: 'z (fore–aft)', k: 'z', b: [-2, 0], x: [-6, 2], d: F => F.z1 - 0.3},
      dz: {label: 'spacing', k: 'len', b: [0, 0.3], x: [0, 1], d: 0.4},
      n: {label: 'segments', k: 'n', b: [2, 5], x: [1, 8], d: 3},
      w0: {label: 'root width', k: 'len', b: [0.05, 0.6], x: [0.01, 2], d: F => F.w1 * 0.5},
      dw: {label: 'narrowing', k: 'len', b: [0, 0.2], x: [0, 1], d: F => F.w1 * 0.1},
      seg: {label: 'segment', k: 'len', b: [0.02, 0.4], x: [0.01, 1], d: F => F.LT * 0.12},
      curl: {label: 'curl', k: 'k', b: [0, 0.3], x: [-0.5, 0.8], d: 0.12},
      amp: {label: 'amplitude', k: 'k', b: [0, 0.3], x: [0, 1], d: 0.1},
      flick: {label: 'flick', k: 'k', b: [0.5, 2], x: [0, 3], d: 1.4},
      // v11.70.1 (they had no controls): the spine — a cone sl long, radius st at the front and sr at the back, centred at (0, sy, sz); the plates — three lobes at pz, ph high, pl long
      sl: {label: 'length', k: 'len', b: [0.1, 0.5], x: [0.02, 1], d: F => F.LT * 0.35},
      sr: {label: 'back radius', k: 'len', b: [0.005, 0.05], x: [0.001, 0.15], d: F => F.w1 * 0.18},
      st: {label: 'front radius', k: 'len', b: [0.001, 0.03], x: [0.0002, 0.1], d: 0.03},
      sy: {label: 'y (up)', k: 'len', b: [-0.1, 0.1], x: [-0.5, 0.5], d: F => F.cy || 0},
      sz: {label: 'z (fore–aft)', k: 'z', b: [-2, 0], x: [-6, 2], d: F => F.z1 - F.LT * 0.17},
      pz: {label: 'z (fore–aft)', k: 'z', b: [-2, 0], x: [-6, 2], d: F => F.z1 - F.w1 * 0.4},
      ph: {label: 'plate height', k: 'len', b: [0.05, 0.3], x: [0.01, 0.8], d: F => F.h1 * 2.2},
      pl: {label: 'plate length', k: 'len', b: [0.02, 0.2], x: [0.005, 0.6], d: F => F.w1 * 0.9}
    },
    build: (ctx, p) => {
      const P = ctx.P,
        pal = ctx.pal,
        F = ctx.F,
        z1 = F.z1;
      if (p.style === 'fan')
        for (const sx of [1, -1])
          for (let i = 0; i < 3; i++)
            P.push(
              part(G.box(p.w, 0.07, p.l), sx * (p.x + i * p.dx), p.y + i * p.dy, p.z - i * p.dz, pal.flap || pal.top, {
                r: [0, sx * 0.45, sx * 0.35],
                c2: pal.belly
              })
            );
      else if (p.style === 'spine') P.push(part(G.cyl(p.st, p.sr, p.sl, 5), 0, p.sy, p.sz, pal.top, {r: [HPI, 0, 0]}));
      else if (p.style === 'abdomen') {
        const A = [],
          n = Math.max(1, Math.round(p.n));
        let y = 0,
          z = 0,
          a = p.curl * 0.8;
        for (let k = 0; k < n; k++) {
          const w = p.w0 - k * p.dw;
          a += p.curl;
          z -= p.seg * 0.5 * Math.cos(a);
          y -= p.seg * 0.5 * Math.sin(a);
          A.push(part(G.box(w, w * 0.8, p.seg * 0.92), 0, y, z, pal.top, {r: [-a, 0, 0]}));
          z -= p.seg * 0.5 * Math.cos(a);
          y -= p.seg * 0.5 * Math.sin(a);
        }
        for (let i = -1; i <= 1; i++) A.push(part(G.box(p.w0 * 0.43, 0.01, p.seg), i * p.w0 * 0.29, y - 0.02, z - p.seg * 0.5, pal.top, {r: [-a, i * 0.3, 0]}));
        const abd = new THREE.Mesh(merge(A), ctx.mat);
        abd.position.set(0, p.y, p.z);
        ctx.bf.add(abd);
        const ck = ctx.clock(ctx.beat[0], ctx.beat[1]);
        return {
          anim: (t, spd, st) => {
            abd.rotation.x = p.amp * Math.sin(ck(t, spd)) - p.flick * (st.strike || 0);
          },
          thrust: p.w0 * p.seg * n * p.flick * 0.5,
          turn: 0.3,
          extent: [p.z - p.seg * n, p.z]
        };
      } else tailTrio(P, pal, p.pz, p.ph, p.pl, pal.flap || pal.top);
      return {turn: p.style === 'fan' ? 0.6 : 0.3, thrust: p.style === 'spine' ? 0 : F.w1 * F.w1 * 2};
    }
  },
  // the legs: rear (the raptors' pairs off the trunk's tail), placed (jointed pairs at (±x, y, z) stepping dz, the knee at +(kx,ky,kz),
  // the foot at +(fx,fy,fz), with a hook: the trap), walk (the same, in two groups a side rocking in turn: the picker; fan spreads the
  // knees and feet fore and aft), hang (the hook's six: sweeping down and closing on the drop, kzk/fzk fanning by their z), rock (the
  // scuttle's paddle rows, two meshes rocking against each other), march (the tread's rows off the body's own width, a metachronal
  // wave with a lift), swim (the flicker's thin paddles, still). All v11.25 but rear.
  legs: {
    reg:{
      rear:{clades:['hingeshells'],params:['n','z','dz','len','w']},
      placed:{clades:['hingeshells'],params:['n','x','y','z','dz','kx','ky','kz','fx','fy','fz','kzk','fzk','wl','hook']},
      walk:{clades:['hingeshells'],params:['n','x','y','z','dz','kx','ky','kz','fx','fy','fz','fan','kf','ff','wl','hook','root','amp','k0','sk']},
      hang:{clades:['hingeshells'],params:['n','x','y','z','dz','kx','ky','kz','fx','fy','fz','kzk','fzk','wl','hook','wob','swing','drop']},
      rock:{clades:['hingeshells'],params:['n','x','y','z','dz','ll','wl','th','splay','yaw','amp','k0','sk']},
      march:{clades:['hingeshells'],params:['n','z','dz','kx','ky','fx','floor','inset','wl','amp','k0','sk','lift','step','side']},
      swim:{clades:['hingeshells'],params:['n','x','y','z','dz','ll','wl','th','splay']}
    },
    cost: 3,
    paired: true,
    params: {
      n: {label: 'pairs', k: 'n', b: [1, 8], x: [1, 12], d: (F, p) => (p.style === 'march' ? 7 : p.style === 'walk' || p.style === 'swim' || p.style === 'placed' ? 4 : p.style === 'hang' || p.style === 'rock' ? 3 : 2)},
      z: {label: 'z (fore–aft)', k: 'z', b: [-1.2, 1], x: [-4, 4], d: (F, p) => (p.style === 'rear' ? F.z1 + 0.6 : F.z0 - F.LT * 0.15)},
      dz: {label: 'spacing', k: 'len', b: [-0.4, 0.4], x: [-2, 2], d: (F, p) => (p.style === 'rear' ? 0.8 : -F.LT * 0.2)},
      len: {label: 'length', k: 'k', b: [0.5, 2], x: [0.2, 4], d: 1},
      w: {label: 'width', k: 'k', b: [0.5, 2], x: [0.2, 4], d: 1},
      wl: {label: 'thickness', by: {rock: 'paddle width', swim: 'paddle width'}, k: 'len', b: [0.005, 0.1], x: [0.002, 0.5], d: F => F.w0 * 0.08},
      ll: {label: 'paddle length', k: 'len', b: [0.02, 0.5], x: [0.005, 2], d: F => F.w0 * 0.5},
      x: {label: 'x (out)', k: 'len', b: [0, 0.5], x: [0, 2], d: F => F.w0 * 0.45},
      y: {label: 'y (up)', k: 'len', b: [-0.5, 0.3], x: [-2, 2], d: F => (F.cy || 0) - F.h0 * 0.4},
      kx: {label: 'knee out', k: 'len', b: [0, 1.5], x: [-2, 3], d: F => F.w0 * 0.5},
      ky: {label: 'knee up', k: 'len', b: [-0.3, 0.6], x: [-2, 3], d: F => F.h0 * 0.3},
      kz: {label: 'knee fore', k: 'len', b: [-0.3, 0.3], x: [-2, 2], d: 0},
      fx: {label: 'foot out', k: 'len', b: [0, 2], x: [-2, 4], d: F => F.w0 * 0.8},
      fy: {label: 'foot up', k: 'len', b: [-1, 0.6], x: [-4, 3], d: F => -F.h0 * 0.6},
      fz: {label: 'foot fore', k: 'len', b: [-0.3, 0.3], x: [-2, 2], d: 0},
      hook: {label: 'hook', k: 'len', b: [0, 0.2], x: [0, 1], d: 0},
      fan: {label: 'fan', k: 'len', b: [0, 0.6], x: [-1, 1], d: 0},
      kf: {label: 'knee fan', k: 'k', b: [0, 2], x: [-4, 4], d: 0},
      ff: {label: 'foot fan', k: 'k', b: [0, 3], x: [-6, 6], d: 0},
      kzk: {label: 'knee fan by z', k: 'k', b: [0, 0.2], x: [-1, 1], d: 0},
      fzk: {label: 'foot fan by z', k: 'k', b: [0, 0.2], x: [-1, 1], d: 0},
      root: {label: 'root bar', k: 'len', b: [0, 0.8], x: [0, 2], d: 0},
      amp: {label: 'amplitude', k: 'k', b: [0, 0.5], x: [0, 1.5], d: (F, p) => (p.style === 'rock' ? 0.3 : p.style === 'march' ? 0.26 : 0.22)},
      k0: {label: 'from speed', k: 'k', b: [0, 0.5], x: [0, 1], d: (F, p) => (p.style === 'rock' ? 0.2 : p.style === 'march' ? 0.15 : 0.1)},
      sk: {label: 'speed gain', k: 'k', b: [0.2, 1], x: [0, 3], d: (F, p) => (p.style === 'rock' ? 0.6 : p.style === 'march' ? 0.7 : 0.8)},
      lift: {label: 'lift', k: 'len', b: [0, 0.1], x: [0, 0.5], d: F => F.h0 * 0.07},
      step: {label: 'step phase', k: 'k', b: [0.3, 1.5], x: [0, 3.2], d: 0.9},
      side: {label: 'side phase', k: 'k', b: [0, 1.5], x: [0, 3.2], d: 0.45},
      inset: {label: 'inset', k: 'len', b: [0, 0.3], x: [-1, 1], d: F => F.w0 * 0.1},
      floor: {label: 'the floor', k: 'len', b: [-1.5, 0], x: [-4, 0], d: F => (F.cy || 0) - F.h0 * 1.4},
      th: {label: 'thickness', k: 'len', b: [0.005, 0.1], x: [0.002, 0.5], d: F => F.h0 * 0.06},
      splay: {label: 'splay out', unit: '°', k: 'k', b: [0, 60], x: [-90, 90], d: (F, p) => (p.style === 'swim' ? 23 : 31.5)},
      yaw: {label: 'yaw', unit: '°', k: 'k', b: [0, 30], x: [-60, 60], d: 8.6},
      swing: {label: 'swing on the tell', k: 'k', b: [0, 1], x: [0, 2], d: 0.35},
      drop: {label: 'drop on the strike', k: 'k', b: [0.5, 2.5], x: [0, 3.2], d: 1.7},
      wob: {label: 'wobble', k: 'k', b: [0, 0.2], x: [0, 0.5], d: 0.06}
    },
    build: (ctx, p) => {
      const F = ctx.F,
        pal = ctx.pal,
        S = p.style,
        n = Math.max(1, Math.round(p.n));
      if (S === 'rear') {
        const l = p.len;
        for (const sx of [1, -1])
          for (let k = 0; k < n; k++)
            leg(
              ctx.P,
              pal,
              sx * F.w1 * 0.5,
              (F.cy || 0) - F.h1 * 0.4,
              p.z + k * p.dz,
              sx * F.w1 * 0.5 * l,
              -F.h1 * 0.3 * l,
              0,
              sx * F.w1 * 0.7 * l,
              -F.h1 * 1.5 * l,
              0.1 * l,
              F.w1 * 0.12 * p.w
            );
        return {legs: true, leg: F.h1 * 1.5 * l, thrust: n * F.w1 * F.h1 * 2};
      }
      if (S === 'placed') {
        for (const sx of [1, -1])
          for (let k = 0; k < n; k++) {
            const z = p.z + k * p.dz;
            leg(ctx.P, pal, sx * p.x, p.y, z, sx * p.kx, p.ky, p.kz + z * p.kzk, sx * p.fx, p.fy, p.fz + z * p.fzk, p.wl, p.hook || undefined);
          }
        return {legs: true, leg: Math.hypot(p.fx, p.fy), thrust: n * 2 * p.wl * (p.kx + p.fx) * 3};
      }
      if (S === 'swim') {
        for (const sx of [1, -1]) for (let k = 0; k < n; k++) ctx.P.push(part(G.box(p.wl, p.ll, p.th), sx * p.x, p.y, p.z + k * p.dz, pal.top, {r: [0, 0, sx * p.splay * DEG]}));
        return {paddle: true, thrust: n * p.ll * p.wl * 4, area: n * p.ll * p.wl}; // paddle (v11.71): a row of swimming legs is a metachronal row, the flaps' mode
      }
      if (S === 'rock') {
        // two side meshes of n paddles each, pivoted at y, rocking against each other on the beat
        const meshes = [];
        for (const sg of [1, -1]) {
          const L = [];
          for (let k = 0; k < n; k++) L.push(part(G.box(p.ll, p.th, p.wl), sg * p.x, 0.02, p.z + k * p.dz, pal.leg || pal.top, {r: [0, sg * p.yaw * DEG * (k - (n - 1) / 2), -sg * p.splay * DEG]}));
          const m = new THREE.Mesh(merge(L), ctx.mat);
          m.position.y = p.y;
          ctx.bf.add(m);
          meshes.push(m);
        }
        const ck = ctx.clock(ctx.beat[0], ctx.beat[1]);
        return {
          anim: (t, spd) => {
            const a = p.amp * Math.min(1, p.k0 + spd * p.sk) * Math.sin(ck(t, spd));
            meshes[0].rotation.x = a;
            meshes[1].rotation.x = -a;
          },
          legs: true,
          leg: p.ll,
          thrust: n * p.ll * p.wl * 3
        };
      }
      const groups = [],
        mk = (sx, ks, ph) => {
          const L = [];
          const fan = p.fan || 0,
            kzk = p.kzk || 0,
            fzk = p.fzk || 0;
          for (const k of ks) {
            const z = p.z + k * p.dz,
              sp = (k - (n - 1) / 2) * fan;
            if (p.root > 0) ctx.P.push(part(G.box(p.root, p.wl * 2.2, p.wl * 2.2), 0, p.y, z, pal.top)); // the leg roots across the body (the picker)
            leg(L, pal, sx * p.x, p.y, z, sx * p.kx, p.ky, p.kz + z * kzk + sp * (p.kf || 0) - (fan ? z : 0), sx * p.fx, p.fy, p.fz + z * fzk + sp * (p.ff || 0) - (fan ? z : 0), p.wl, p.hook || undefined);
          }
          const m = new THREE.Mesh(merge(L), ctx.mat);
          m.userData.sx = sx;
          m.userData.ph = ph;
          ctx.bf.add(m);
          groups.push(m);
          return m;
        };
      if (S === 'walk' || S === 'hang') {
        for (const sx of [1, -1])
          for (let grp = 0; grp < 2; grp++) {
            const ks = [];
            for (let k = grp; k < n; k += 2) ks.push(k);
            if (ks.length) mk(sx, ks, S === 'walk' ? grp * Math.PI + (sx > 0 ? 0 : HPI) : grp);
          }
        const ck = ctx.clock(ctx.beat[0], ctx.beat[1]);
        if (S === 'walk')
          return {
            anim: (t, spd) => {
              const k = Math.min(1, p.k0 + spd * p.sk),
                ph = ck(t, spd);
              for (const m of groups) m.rotation.x = p.amp * k * Math.sin(ph + m.userData.ph);
            },
            legs: true,
            leg: Math.hypot(p.fx, p.fy),
            reach: p.fx,
            thrust: n * 2 * p.wl * (p.kx + p.fx) * 3
          };
        return {
          anim: (t, spd, st) => {
            const tell = st.tell || 0,
              strike = st.strike || 0;
            for (const m of groups) {
              const sx = m.userData.sx,
                ph = m.userData.ph;
              m.rotation.z = -sx * (p.wob * Math.sin(t * 0.9 + ph * 1.6) + p.swing * tell + p.drop * strike);
              m.rotation.x = 0.1 * Math.sin(t * 1.1 + ph * 2) * Math.min(1, spd);
            }
          },
          legs: true,
          leg: Math.hypot(p.fx, p.fy),
          reach: p.fx * 0.8,
          thrust: n * 2 * p.wl * (p.kx + p.fx) * 2
        };
      }
      // march: rows off the body's width and height, each leg its own mesh at its hip, a wave of `step` per leg and `side` between sides
      const legsM = [];
      for (const sx of [1, -1])
        for (let k = 0; k < n; k++) {
          const z = p.z + k * p.dz,
            w2 = F.wAt(z),
            h = F.hAt(z),
            hip = V3(sx * (w2 - p.inset), (F.cy || 0) - h * 0.9, z),
            LP = [];
          leg(LP, pal, 0, 0, 0, sx * p.kx, p.ky, 0, sx * p.fx, p.floor - hip.y, 0, p.wl);
          const m = new THREE.Mesh(merge(LP), ctx.mat);
          m.position.copy(hip);
          ctx.bf.add(m);
          legsM.push({m: m, ph: k * p.step + (sx > 0 ? 0 : p.side), y: hip.y});
        }
      const ck = ctx.clock(ctx.beat[0], ctx.beat[1]);
      return {
        anim: (t, spd) => {
          const k = Math.min(1, p.k0 + spd * p.sk),
            ph0 = ck(t, spd);
          for (const l of legsM) {
            const ph = ph0 + l.ph;
            l.m.rotation.x = p.amp * k * Math.sin(ph);
            l.m.position.y = l.y + p.lift * k * Math.max(0, Math.sin(ph + HPI));
          }
        },
        legs: true,
        leg: Math.hypot(p.fx, p.floor),
        thrust: n * 2 * p.wl * (p.kx + p.fx) * 3,
        mass: n * 2 * p.wl * p.wl * (p.kx + p.fx) * 2
      };
    }
  },
  keel: {
    reg:{
      ventral:{clades:['hingeshells']}
    },
    cost: 1,
    params: { // v11.70.1 (it had none): a blade w thick, h deep, l long, centred at (0, y, z)
      w: {label: 'thickness', k: 'len', b: [0.003, 0.02], x: [0.001, 0.06], d: 0.08},
      h: {label: 'depth', k: 'len', b: [0.05, 0.3], x: [0.01, 0.8], d: F => F.h0 * 0.7},
      l: {label: 'length', k: 'len', b: [0.1, 0.6], x: [0.02, 1], d: F => F.LT * 0.45},
      y: {label: 'y (up)', k: 'len', b: [-0.3, 0], x: [-0.8, 0.2], d: F => (F.cy || 0) - F.h0 * 0.75},
      z: {label: 'z (fore–aft)', k: 'z', b: [-1, 1], x: [-4, 4], d: F => F.z0 - F.LT * 0.35}
    },
    cover: (F, c, p) => ({bottom: (x, z) => (Math.abs(x) <= p.w / 2 && z <= p.z + p.l / 2 && z >= p.z - p.l / 2 ? p.y - p.h / 2 : null)}),
    build: (ctx, p) => {
      const F = ctx.F;
      ctx.P.push(part(G.box(p.w, p.h, p.l), 0, p.y, p.z, ctx.pal.top, {c2: ctx.pal.belly}));
      return {streamline: 0.85, turn: -0.2};
    }
  },
  // the bivalved carapace (CLADES): back (the whole trunk), small (the front half), hood (the raptors' hooded head), and since v11.25
  // placed (z0, z1, w, y, th by hand — every walker's; the defaults are the trunk's) and clam (the flicker: two translucent ellipsoid
  // halves hinged along the top). How it opens: o0 at rest plus o1 with speed, closed by tc on the tell and sc on the strike, opened
  // by tk on the tell and sk on the strike.
  valves: {
    reg:{
      back:{clades:['hingeshells'],params:['fa','fb','fw','fy','ft','o0','o1','tc','sc','tk','sk']},
      small:{clades:['hingeshells'],params:['fa','fb','fw','fy','ft','o0','o1','tc','sc','tk','sk']},
      hood:{clades:['hingeshells'],params:['kw','kl','kh','lift','o0','o1','tc','sc','tk','sk']},
      placed:{clades:['hingeshells'],params:['z0','z1','w','y','th','o0','o1','tc','sc','tk','sk']},
      clam:{clades:['hingeshells'],params:['R','sx','sy','sz','y','ox','oy','o0','o1','tc','sc','tk','sk']}
    },
    cost: 3,
    paired: true,
    params: {
      // back and small (v11.70.1: they had only the opening): in fractions of the body, so they follow it when the core changes — placed is the
      // same pair in metres, and stays where it is put. fa the front edge back from the body's front, fb the back edge (back: forward from the
      // tail; small: back from the front), fw the width of the body's, fy the height and ft the thickness of its height. hood: kw, kl, kh the
      // plate's width, length and thickness of the head's, lift how far it lifts open
      fa: {label: 'front edge', unit: '×body', k: 'k', b: [0, 0.2], x: [-0.2, 0.5], d: 0.02},
      fb: {label: 'back edge', by: {small: 'length'}, unit: '×body', k: 'k', b: [0, 0.7], x: [-0.2, 1], d: (F, p) => (p.style === 'small' ? 0.45 : 0.12)},
      fw: {label: 'width', unit: '×body', k: 'k', b: [0.4, 1.2], x: [0.1, 2], d: (F, p) => (p.style === 'small' ? 0.6 : 0.95)},
      fy: {label: 'height', unit: '×body', k: 'k', b: [0.3, 0.7], x: [0, 1.5], d: 0.5},
      ft: {label: 'thickness', unit: '×body', k: 'k', b: [0.03, 0.2], x: [0.01, 0.5], d: 0.09},
      kw: {label: 'width', unit: '×head', k: 'k', b: [0.8, 1.8], x: [0.3, 3], d: 1.3},
      kl: {label: 'length', unit: '×head', k: 'k', b: [0.8, 2], x: [0.3, 3], d: 1.4},
      kh: {label: 'thickness', unit: '×head', k: 'k', b: [0.08, 0.3], x: [0.02, 0.6], d: 0.16},
      lift: {label: 'lift', k: 'k', b: [0, 0.6], x: [0, 1.5], d: 0.25},
      z0: {label: 'first z', k: 'z', b: [-1, 2], x: [-4, 6], d: F => F.z0 - F.LT * 0.02},
      z1: {label: 'last z', k: 'z', b: [-3, 0], x: [-8, 4], d: F => F.z1 + F.LT * 0.12},
      w: {label: 'width', k: 'len', b: [0.1, 1], x: [0.02, 3], d: F => F.w0 * 0.95},
      y: {label: 'y (up)', k: 'len', b: [-0.3, 0.6], x: [-1, 2], d: F => (F.cy || 0) + F.h0 * 0.5},
      th: {label: 'thickness', k: 'len', b: [0.005, 0.1], x: [0.002, 0.5], d: F => F.h0 * 0.09},
      R: {label: 'valve radius', k: 'len', b: [0.05, 0.6], x: [0.01, 2], d: F => F.Rmax * 1.7},
      sx: {label: 'width', k: 'k', b: [0.3, 0.8], x: [0.1, 1.5], d: 0.5},
      sy: {label: 'squash', k: 'k', b: [0.5, 1.2], x: [0.2, 2], d: 0.85},
      sz: {label: 'stretch', k: 'k', b: [1, 2], x: [0.5, 4], d: 1.5},
      ox: {label: 'valve out', k: 'len', b: [0, 0.5], x: [0, 1], d: F => F.Rmax * 0.7},
      oy: {label: 'valve down', k: 'len', b: [-1, 0], x: [-2, 1], d: F => -F.Rmax * 1.25},
      o0: {label: 'open at rest', k: 'k', b: [0, 0.6], x: [0, 1.2], d: (F, p) => (p.style === 'clam' ? 0.16 : 0.15)},
      o1: {label: 'open by speed', k: 'k', b: [0, 0.5], x: [0, 1], d: (F, p) => (p.style === 'clam' ? 0 : 0.25)},
      tc: {label: 'shut on the tell', k: 'k', b: [0, 1], x: [0, 1], d: (F, p) => (p.style === 'clam' ? 0 : 1)},
      sc: {label: 'shut on the strike', k: 'k', b: [0, 1], x: [0, 1], d: (F, p) => (p.style === 'clam' ? 1 : 0)},
      tk: {label: 'open on the tell', k: 'k', b: [0, 0.5], x: [0, 1], d: 0},
      sk: {label: 'open on the strike', k: 'k', b: [0, 0.5], x: [0, 1], d: 0}
    },
    cover: (F, c, p) => {
      if (p.style === 'hood') {
        const H = F.H,
          zc = F.zh - H.l * 0.05,
          hl = H.l * (p.kl * 0.5),
          y = (F.hy || 0) + F.ht * 0.9 + H.h * (0.1 + p.kh * 0.5);
        return {top: (x, z) => (Math.abs(x) <= H.w * (p.kw * 0.5) && z >= zc - hl && z <= zc + hl ? y : null)};
      }
      if (p.style === 'clam') return {top: (x, z) => (Math.abs(x) <= p.R * p.sx * 2 && Math.abs(z) <= p.R * p.sz ? p.y : null)};
      const pl = p.style === 'placed',
        wv = pl ? p.w : F.w0 * p.fw,
        zv0 = pl ? p.z0 : F.z0 - F.LT * p.fa,
        zv1 = pl ? p.z1 : p.style === 'back' ? F.z1 + F.LT * p.fb : F.z0 - F.LT * p.fb,
        y = pl ? p.y + p.th * 0.5 : (F.cy || 0) + F.h0 * (p.fy + p.ft * 0.5);
      return {top: (x, z) => (Math.abs(x) <= wv / 2 && z >= zv1 && z <= zv0 ? y : null)};
    },
    build: (ctx, p) => {
      const g = ctx.g,
        pal = ctx.pal,
        F = ctx.F,
        H = F.H,
        zh = F.zh,
        ht = F.ht,
        z0 = F.z0,
        z1 = F.z1,
        L = F.LT,
        cy = F.cy || 0,
        V = p.style;
      let vv;
      if (V === 'hood') {
        const Hd = new THREE.Group();
        Hd.position.set(0, (F.hy || 0) + ht * 0.9, zh - H.l * 0.3);
        g.add(Hd);
        Hd.add(
          new THREE.Mesh(
            merge([part(G.box(H.w * p.kw, H.h * p.kh, H.l * p.kl), 0, H.h * 0.1, H.l * 0.25, pal.top, {r: [0.18, 0, 0], c2: pal.joint})]),
            ctx.mat
          )
        );
        vv = {
          set: k => {
            Hd.rotation.x = -p.lift * k;
          }
        };
      } else if (V === 'clam') {
        const vg = [];
        for (const sx of [1, -1]) {
          const Gi = new THREE.Group();
          Gi.position.set(0, p.y, 0);
          g.add(Gi);
          Gi.userData.sx = sx;
          Gi.add(new THREE.Mesh(merge([part(G.sph(p.R, 7, 5), sx * p.ox, p.oy, 0, pal.valve || pal.top, {s: [p.sx, p.sy, p.sz], c2: pal.top})]), ctx.mat));
          vg.push(Gi);
        }
        vv = {
          set: k => {
            for (const Gi of vg) Gi.rotation.z = Gi.userData.sx * k;
          }
        };
      } else {
        const pl = V === 'placed',
          wv = pl ? p.w : F.w0 * p.fw,
          zv0 = pl ? p.z0 : z0 - L * p.fa,
          zv1 = pl ? p.z1 : V === 'back' ? z1 + L * p.fb : z0 - L * p.fb,
          yv = pl ? p.y : cy + F.h0 * p.fy,
          th = pl ? p.th : F.h0 * p.ft;
        vv = valves(g, pal, zv0, zv1, wv, yv, th);
        if (ctx.eyeStyle === 'valve')
          for (const Gi of g.children.slice(-2)) {
            const sx = Gi.userData.sx;
            Gi.add(
              new THREE.Mesh(
                merge([
                  part(G.sph(ctx.eyeP.vs, 5, 4), sx * wv * ctx.eyeP.vx, ctx.eyeP.vy, (zv0 - zv1) * ctx.eyeP.vf, pal.eye),
                  part(G.sph(ctx.eyeP.vs2, 5, 4), sx * wv * ctx.eyeP.vx, ctx.eyeP.vy, -(zv0 - zv1) * ctx.eyeP.vb, pal.eye)
                ]),
                ctx.mat
              )
            );
          }
      }
      return {
        anim: (t, spd, st) => {
          const tell = st.tell || 0,
            strike = st.strike || 0;
          vv.set(st.soft ? 0 : (p.o0 + p.o1 * Math.min(1, spd * 0.5)) * (1 - p.tc * tell - p.sc * strike) + p.tk * tell + p.sk * strike); // st.soft (v11.66): clamped shut through the moult — the soft body hides inside (PLANET)
        },
        armour: V === 'small' ? 0.2 : V === 'clam' ? 0.1 : 0.4,
        mass: V === 'clam' ? p.R * p.R * p.R * 0.4 : F.w0 * F.h0 * 0.1 * (V === 'hood' ? H.l : V === 'placed' ? p.z0 - p.z1 : L) * 1.2,
        area: F.w0 * F.h0 * 0.2
      };
    }
  },
  // the swimming flaps (the paddlers): np a side in three phased rows, from z0 back to z1, pivoted at (±px, py), each `len` out at the
  // widest, `w` wide, `th` thick, raked back; the defaults are the trunk's own (v11.25: placed by hand for the comb)
  flaps: {
    reg:{
      sides:{clades:['hingeshells']},
      vertical:{clades:['hingeshells']},
      rear:{clades:['hingeshells']}
    },
    cost: 4,
    paired: true,
    params: {
      np: {label: 'flaps a side', k: 'n', b: [5, 13], x: [3, 20], d: 9},
      z0: {label: 'first z', k: 'z', b: [-1, 2], x: [-4, 6], d: (F, p) => (p.style === 'rear' ? F.z0 - F.LT * 0.45 : F.z0 - F.LT * 0.05)},
      z1: {label: 'last z', k: 'z', b: [-3, 0], x: [-8, 4], d: F => F.z1 + F.LT * 0.05},
      px: {label: 'pivot out', k: 'len', b: [0, 0.3], x: [0, 2], d: (F, p) => (p.style === 'vertical' ? F.h0 : F.w0) * 0.35},
      py: {label: 'pivot up', k: 'len', b: [-0.3, 0.3], x: [-1, 1], d: (F, p) => (p.style === 'vertical' ? 0 : -F.h0 * 0.08) + (F.cy || 0)},
      len: {label: 'length', k: 'len', b: [0.03, 1], x: [0.01, 3], d: F => F.w0 * 0.85},
      w: {label: 'width', k: 'len', b: [0.01, 0.3], x: [0.005, 1.5], d: F => F.w0 * 0.32},
      th: {label: 'thickness', k: 'len', b: [0.001, 0.05], x: [0.0005, 0.3], d: 0.07},
      rake: {label: 'rake', unit: 'rad', k: 'k', b: [0, 0.6], x: [0, 1.2], d: 0.35}, // radians (flapRow turns by it as it is): to v11.69 it wore the comb's 'rake °' off the shared name table
      amp: {label: 'amplitude', k: 'k', b: [0.2, 0.7], x: [0, 1.2], d: 0.5}
    },
    build: (ctx, p) => {
      const g = ctx.g,
        pal = ctx.pal,
        F = ctx.F,
        flaps = [],
        np = p.np;
      let fg = g;
      if (p.style === 'vertical') {
        fg = new THREE.Group();
        fg.rotation.z = HPI;
        g.add(fg);
      }
      const hw = p.style === 'vertical' ? u => lerp(F.h0, F.h1, u) * 0.5 : u => lerp(F.w0, F.w1, u) * 0.5;
      for (const sx of [1, -1]) for (let ph = 0; ph < 3; ph++) flaps.push(flapRow(fg, pal, np, ph, 3, sx, p.px, p.py, p.z0, p.z1, p.len, p.w, p.th, p.rake, hw));
      const ck = ctx.clock(ctx.beat[0], ctx.beat[1]);
      return {
        anim: (t, spd) => {
          flapWave(flaps, ck(t, spd), p.amp, spd);
        },
        thrust: np * 2 * (p.style === 'rear' ? 0.5 : 1) * p.len * p.w * Math.sqrt(ctx.beat[0] + ctx.beat[1]) * 0.5,
        turn: 0.5,
        streamline: p.style === 'vertical' ? 0.9 : 1,
        area: np * p.w * p.th * 2
      };
    }
  },
  weapon: {
    reg:{
      claws:{clades:['hingeshells']},
      spears:{clades:['hingeshells']},
      fold:{clades:['hingeshells']},
      whips:{clades:['hingeshells']},
      ram:{clades:['hingeshells'],params:[]}, // no geometry and no numbers: the blow is the head's, its strength combat.js RAM's (v11.70.1: left bare — a reach control moved the ram's derived reach 4.6 → 8.1)
      combs:{clades:['hingeshells'],params:['x','y','z','n','seg','teeth','tl','len','w']}
    },
    cost: 4,
    paired: true,
    // placed at (±x, y, z) — snap hangs it from the belly there — turned by pitch (down) and yaw (out) in degrees, len and w scaling the pieces, n the teeth on a claw
    // (combs, v11.25: the filter feeder's frontal appendages — n jointed segments of `seg` with `teeth` fine spines of tl each, swept slowly)
    params: {
      x: {label: 'x (out)', k: 'len', b: [0, 0.3], x: [0, 1], d: (F, p) => F.H.w * (p.style === 'spears' ? 0.42 : p.style === 'whips' ? 0.4 : p.style === 'combs' ? 0.25 : 0.3)},
      y: {label: 'y (up)', k: 'len', b: [-0.3, 0.15], x: [-1, 1], d: (F, p) => (F.hy || 0) - F.ht * (p.style === 'spears' ? 0.7 : p.style === 'fold' ? 0.55 : 0.5)},
      seg: {label: 'segment', k: 'len', b: [0.05, 0.3], x: [0.01, 1], d: F => F.H.l * 0.85},
      teeth: {label: 'teeth', k: 'n', b: [3, 12], x: [1, 20], d: 7},
      tl: {label: 'tooth length', k: 'len', b: [0.05, 0.3], x: [0.01, 1], d: F => F.H.h * 1.2},
      z: {
        label: 'z (fore–aft)',
        k: 'z',
        b: [-0.5, 1.2],
        x: [-4, 4],
        d: (F, p) => F.zf - F.H.l * (p.style === 'spears' ? 0.3 : p.style === 'whips' ? 0.2 : p.style === 'fold' ? 0.15 : 0.1)
      },
      len: {label: 'length', k: 'k', b: [0.4, 2.2], x: [0.1, 4], d: 1},
      w: {label: 'width scale', k: 'k', b: [0.4, 2], x: [0.1, 4], d: 1},
      pitch: {label: 'pitch', unit: '°', k: 'k', b: [-60, 60], x: [-180, 180], d: 0},
      yaw: {label: 'yaw', unit: '°', k: 'k', b: [-60, 60], x: [-180, 180], d: 0},
      n: {label: 'count', k: 'n', b: [3, 8], x: [1, 14], d: 5},
      snap: {label: 'snap to the body', k: 'b', d: false}
    },
    build: (ctx, p) => {
      const g = ctx.g,
        pal = ctx.pal,
        F = ctx.F,
        H = F.H,
        L = F.LT,
        W = p.style,
        arms = [],
        ln = p.len,
        wd = p.w;
      let whips = null,
        combs = null;
      let y = p.y;
      if (p.snap && ctx.bottom && W !== 'whips') {
        const b = ctx.bottom(p.x, p.z);
        if (b !== null) y = b;
      }
      const root = sx => {
        const R = new THREE.Group();
        R.position.set(sx * p.x, y, p.z);
        R.rotation.set(p.pitch * DEG, sx * p.yaw * DEG, 0);
        g.add(R);
        return R;
      };
      if (W === 'claws')
        for (const sx of [1, -1]) {
          const U = new THREE.Group();
          root(sx).add(U);
          const d = V3(sx * 0.2, -0.4, 1).normalize(),
            Lu = H.l * 0.9 * ln;
          U.add(
            new THREE.Mesh(
              merge([
                part(G.box(H.w * 0.15 * wd, Lu, H.w * 0.17 * wd), (d.x * Lu) / 2, (d.y * Lu) / 2, (d.z * Lu) / 2, pal.top, {dir: d, c2: pal.belly}),
                part(G.sph(H.w * 0.11 * wd, 5, 4), d.x * Lu, d.y * Lu, d.z * Lu, pal.joint)
              ]),
              MAT
            )
          );
          const Lw = new THREE.Group();
          Lw.position.set(d.x * Lu, d.y * Lu, d.z * Lu);
          U.add(Lw);
          const e = V3(-sx * 0.15, -0.8, 0.6).normalize(),
            Ll = H.l * 0.85 * ln,
            LP = [
              part(G.box(H.w * 0.11 * wd, Ll, H.w * 0.12 * wd), (e.x * Ll) / 2, (e.y * Ll) / 2, (e.z * Ll) / 2, pal.top, {dir: e, c2: pal.belly})
            ];
          const nt = Math.max(1, Math.round(p.n));
          for (let i = 0; i < nt; i++) {
            const f = (i + 0.5) / nt;
            LP.push(
              part(G.cone(H.w * 0.02 * wd, H.w * 0.2 * wd, 4), e.x * Ll * f, e.y * Ll * f + 0.03, e.z * Ll * f - 0.1, pal.joint, {
                r: [-HPI - 0.5, 0, 0]
              })
            );
          }
          Lw.add(new THREE.Mesh(merge(LP), MAT));
          arms.push({A: U, B: Lw, sx: sx, kind: 'claw'});
        }
      else if (W === 'spears')
        for (const sx of [1, -1]) {
          const S = new THREE.Group();
          root(sx).add(S);
          const Ls = L * 0.45 * ln;
          S.add(
            new THREE.Mesh(
              merge([
                part(G.cyl(H.w * 0.03 * wd, H.w * 0.07 * wd, Ls, 5), 0, 0, Ls * 0.5, pal.joint, {r: [HPI, 0, 0]}),
                part(G.cone(H.w * 0.06 * wd, H.w * 0.3 * wd, 4), 0, 0, Ls + H.w * 0.12 * wd, pal.claw || pal.joint, {r: [HPI, 0, 0]})
              ]),
              MAT
            )
          );
          S.rotation.x = Math.PI * 0.92;
          arms.push({A: S, sx: sx, kind: 'spear'});
        }
      else if (W === 'fold')
        for (const sx of [1, -1]) {
          const A = new THREE.Group();
          root(sx).add(A);
          const d = V3(sx * 0.4, -0.12, 1).normalize(),
            Lm = H.l * 0.8 * ln;
          A.add(
            new THREE.Mesh(
              merge([
                part(G.box(H.w * 0.18 * wd, Lm, H.w * 0.2 * wd), (d.x * Lm) / 2, (d.y * Lm) / 2, (d.z * Lm) / 2, pal.top, {dir: d, c2: pal.belly}),
                part(G.sph(H.w * 0.12 * wd, 5, 4), d.x * Lm, d.y * Lm, d.z * Lm, pal.joint)
              ]),
              MAT
            )
          );
          const B = new THREE.Group();
          B.position.set(d.x * Lm, d.y * Lm, d.z * Lm);
          A.add(B);
          const e = V3(sx * 0.25, 0, -1).normalize(),
            Lp = H.l * 0.75 * ln;
          B.add(
            new THREE.Mesh(
              merge([
                part(G.box(H.w * 0.1 * wd, Lp, H.w * 0.12 * wd), (e.x * Lp) / 2, (e.y * Lp) / 2, (e.z * Lp) / 2, pal.top, {dir: e}),
                part(G.cone(H.w * 0.04 * wd, H.l * 0.5 * ln, 4), e.x * Lp, e.y * Lp, e.z * Lp + H.l * 0.2 * ln, pal.claw || pal.joint, {
                  r: [HPI, 0, 0]
                })
              ]),
              MAT
            )
          );
          arms.push({A: A, B: B, sx: sx, kind: 'fold'});
        }
      else if (W === 'combs') {
        combs = [];
        const ns = Math.max(1, Math.round(p.n)),
          nt = Math.max(1, Math.round(p.teeth));
        for (const sx of [1, -1]) {
          const C = new THREE.Group();
          C.position.set(sx * p.x, y, p.z);
          g.add(C);
          const CP = [];
          let q0 = V3(0, 0, 0),
            d = V3(sx * 0.4, -0.12, 1).normalize();
          for (let sg = 0; sg < ns; sg++) {
            const Ls = p.seg * ln,
              q = q0.clone().addScaledVector(d, Ls),
              w0 = p.w * H.w * 0.1 * (1 - 0.2 * sg);
            CP.push(part(G.box(w0, Ls, w0 * 1.17), (q0.x + q.x) / 2, (q0.y + q.y) / 2, (q0.z + q.z) / 2, pal.top, {dir: d}));
            CP.push(part(G.sph(w0 * 0.58, 5, 4), q.x, q.y, q.z, pal.joint));
            for (let i = 0; i < nt; i++) {
              const f = (i + 0.5) / nt,
                o = q0.clone().lerp(q, f);
              CP.push(part(G.box(0.05, p.tl, 0.05), o.x, o.y - p.tl * 0.46, o.z, pal.comb || pal.joint, {r: [0.15, 0, sx * 0.12]}));
            }
            q0 = q;
            d = V3(d.x * 0.7, d.y - 0.28, d.z * 0.85).normalize();
          }
          C.add(new THREE.Mesh(merge(CP), ctx.mat));
          combs.push({C: C, sx: sx});
        }
      } else if (W === 'whips')
        whips = armRing(g, 2, p.z, p.x, L * 0.7 * ln, H.w * 0.09 * wd, pal.top, 5, 0.02, {
          ks: 70,
          damp: 9,
          cosMax: 0.5,
          c2: pal.belly,
          plan: [
            {phi: -1.9, sp: 0.2},
            {phi: 1.9, sp: 0.2}
          ]
        });
      const anim = (t, spd, st) => {
        const tell = st.tell || 0,
          strike = st.strike || 0;
        for (const a of arms) {
          if (a.kind === 'claw') {
            a.A.rotation.x = -0.6 * tell + 0.8 * strike;
            a.A.rotation.y = a.sx * (0.4 * tell - 0.25 * strike);
            a.B.rotation.x = -0.5 * tell + 1.1 * strike;
          } else if (a.kind === 'spear') a.A.rotation.x = Math.PI * 0.92 - 0.5 * tell - 2.5 * strike;
          else {
            a.A.rotation.y = a.sx * (0.3 * tell - 0.45 * strike);
            a.B.rotation.y = -a.sx * 2.6 * strike;
          }
        }
        if (whips) ringPose(whips, 0.35 - 0.2 * tell - 0.3 * strike, 0.08 * (1 - strike), t * 0.9);
        if (combs)
          for (const c of combs) {
            c.C.rotation.x = -0.15 + 0.25 * Math.sin(t * 0.5);
            c.C.rotation.y = c.sx * (0.1 + 0.15 * Math.sin(t * 0.5 + 1));
          }
      };
      return {
        anim: anim,
        rig: whips,
        reach: (W === 'spears' ? L * 0.45 : W === 'whips' ? L * 0.7 : W === 'combs' ? p.seg * p.n * 0.8 : H.l * 1.6) * ln,
        area: W === 'ram' ? 0 : H.w * H.l * 0.1 * wd
      };
    }
  },
  // v11.25: the raised head of the ringmouth crawlers (the watcher): a sphere on the mantle carrying a forward pair of pupiled eyes and
  // three more (five in all), turning slowly to look about (swing/nod, at rates f/fn); the body's own collar of eyes stays below it
  head: {
    reg:{
      turret:{clades:['ringmouths']}
    },
    cost: 3,
    params: {
      y: {label: 'y (up)', k: 'len', b: [0.2, 1], x: [0, 3], d: F => (F.anchors.head ? F.anchors.head.y : F.Rmax * 1.1)},
      z: {label: 'z (fore–aft)', k: 'z', b: [-0.5, 1], x: [-4, 4], d: F => (F.anchors.head ? F.anchors.head.z : F.nose * 0.5)},
      R: {label: 'head radius', k: 'len', b: [0.15, 0.6], x: [0.05, 2], d: F => (F.anchors.head ? F.anchors.head.R : F.Rmax * 0.7)},
      sy: {label: 'squash', k: 'k', b: [0.7, 1.1], x: [0.4, 1.5], d: 0.9},
      n: {label: 'eyes', k: 'n', b: [3, 5], x: [2, 5], d: 5},
      er: {label: 'eye radius', k: 'len', b: [0.03, 0.5], x: [0.01, 1], d: F => (F.anchors.head ? F.anchors.head.R * 0.34 : F.Rmax * 0.24)},
      ex: {label: 'eyes out', k: 'k', b: [0.3, 0.8], x: [0, 1.2], d: 0.56},
      ey: {label: 'eyes up', k: 'k', b: [0, 0.5], x: [-0.5, 1], d: 0.24},
      ez: {label: 'eyes fore', k: 'k', b: [0.4, 1], x: [0, 1.5], d: 0.8},
      swing: {label: 'swing', k: 'k', b: [0, 0.8], x: [0, 1.5], d: 0.45},
      nod: {label: 'nod', k: 'k', b: [0, 0.3], x: [0, 0.8], d: 0.12},
      f: {label: 'swing rate', k: 'k', b: [0.2, 1], x: [0.05, 3], d: 0.45},
      fn: {label: 'nod rate', k: 'k', b: [0.1, 0.8], x: [0.05, 3], d: 0.3}
    },
    build: (ctx, p) => {
      const pal = ctx.pal,
        R = p.R,
        head = new THREE.Group();
      head.position.set(0, p.y, p.z);
      ctx.bf.add(head);
      const HP = [part(G.sph(R, 8, 6), 0, 0, 0, palk(pal, 'mantle', 'flesh', 'top'), {s: [1, p.sy, 1], c2: pal.belly})];
      eyes(HP, p.ex * R, p.ey * R, p.ez * R, p.er, pal.eye, pal.pupil);
      HP.push(part(G.sph(p.er * 0.53, 5, 4), 0, R * 0.68, R * 0.72, pal.eye));
      if (p.n > 3) {
        HP.push(part(G.sph(p.er * 0.47, 5, 4), R * 0.84, R * 0.6, R * 0.48, pal.eye));
        HP.push(part(G.sph(p.er * 0.47, 5, 4), -R * 0.84, R * 0.6, R * 0.48, pal.eye));
      }
      head.add(new THREE.Mesh(merge(HP), ctx.mat));
      return {
        anim: t => {
          head.rotation.y = p.swing * Math.sin(t * p.f);
          head.rotation.x = p.nod * Math.sin(t * p.fn + 1);
        },
        mass: (4 / 3) * Math.PI * R * R * R * p.sy,
        area: Math.PI * R * R * p.sy * 0.5
      };
    }
  }
};

// the registry, read (v11.70). A part's styles and clades are its reg's (the first style is the default); which of a part's params a style
// reads is the style's `params` (the lab shows only these; none listed: all) — PSTYLE to v11.69.
for(const k in PARTS){const d=PARTS[k];d.styles=Object.keys(d.reg);d.clades=[];for(const st of d.styles)for(const c of d.reg[st].clades)if(d.clades.indexOf(c)<0)d.clades.push(c);}
function paramsFor(kind,style){const d=PARTS[kind];if(!d)return [];const r=d.reg[style];return (r&&r.params)||Object.keys(d.params);}
// A parameter as its readers want it — the lab's panel today; next the editor at conception, which prices a child's diff from these
// (LINEAGE.md §6), and direct manipulation, which hangs a handle on each: {key, label, unit, k, b, x, d, val, lo, hi, b0, b1} with the bands
// resolved against the frame and in the spec's units (a 'len' or a 'z' is multiplied by the core's reference length). owner: a part kind or a
// core kind; p: the part (or the core) the value is read off. k is the type: 'n' a count, 'k' a plain number, 'len' a length and 'z' a
// place along the body (metres), 'b' a switch, 's' one of opts, 'l' a list the panel edits elsewhere (a profile) or not at all.
function paramOf(owner,key,p,F){const d=PARTS[owner]||CORES[owner],q=d&&d.params[key];if(!q)return null;
  const o={key:key,label:(q.by&&p&&q.by[p.style])||q.label||key,unit:q.unit!==undefined?q.unit:q.k==='len'||q.k==='z'?'m':'',k:q.k,opts:q.opts,d:q.d,val:p?p[key]:undefined};
  if(q.x&&F){const qb=bandOf(q,F,p),mul=q.k==='len'||q.k==='z'?F.L:1;o.b=qb.b;o.x=qb.x;o.lo=qb.x[0]*mul;o.hi=qb.x[1]*mul;o.b0=qb.b[0]*mul;o.b1=qb.b[1]*mul;}
  return o;}
function paramsOf(owner,p,F){return (PARTS[owner]?paramsFor(owner,p.style):Object.keys(CORES[owner].params)).map(k=>paramOf(owner,k,p,F));}
// ---------- compile ----------
// spec → {g, anim, hit, rigs}: the same object every hand builder returns. s: the build scale (spec.s by default); pal: the palette
// (the spec's coat by default — a PAL key, or the palette itself). The static parts of the core and the parts merge into one body
// mesh; the moving parts add their own; each part's anim hook runs every frame after the core's, in the order of the spec.
function compile(spec, s, pal, opt) {
  spec = fillSpec(spec);
  s = s || spec.s || 1;
  pal = pal || (typeof spec.coat === 'string' ? PAL[spec.coat] : spec.coat) || PAL.softP;
  const g = new THREE.Group(),
    P = [],
    core = CORES[spec.core.kind],
    mat = spec.mat === 'glass' ? MATT : MAT, // glass: the translucent small things (the flicker, the drifters) — every mesh, the rigs too
    ctx = {
      g: g,
      P: P,
      pal: pal,
      spec: spec,
      core: spec.core,
      beat: spec.core.beat || [1.5, 0.9],
      s: s,
      mat: mat,
      clocks: [],
      clock: (f0, f1) => {
        const c = swimClock(f0, f1);
        ctx.clocks.push(c);
        return c;
      }
    };
  // the body frame (v11.18): a group that carries the hull and every part that rides it — fins, tail, the mouth's cap — so the
  // slowbloods' body sway (the tail part's `body`) moves all of it, not the merged hull alone; the rigs stay in g (they are skinned in
  // the creature's frame) and any rig flagged `ride` has its rest points yawed with the frame after the hooks have posed it
  const bf = new THREE.Group();
  g.add(bf);
  ctx.bf = bf;
  const F = core.build(ctx, spec.core);
  prepCtx(ctx, F, spec);
  const hooks = [],
    rigs = [],
    hit = F.hit.slice(),
    hitOwn = hit.map(() => -1), // which part each hit capsule belongs to (−1: the core); the covering is read off it (v11.54, COMBAT.md §2)
    soft = spec.core.kind === 'coilbody' ? new THREE.Group() : null;
  // the shelled ringmouths carry the soft body in its own group so it can withdraw (buildCoil); the shell mesh is added first
  const built = [],
    nCore = P.length;
  for (const p of spec.parts) {
    const def = PARTS[p.kind];
    if (!def) {
      built.push(null);
      continue;
    }
    const n0 = P.length,
      c0 = g.children.length,
      d0 = bf.children.length;
    const r = def.build(ctx, p) || {};
    r.P = [n0, P.length];
    r.C = [c0, g.children.length];
    r.D = [d0, bf.children.length];
    built.push(r);
    r.nodes = g.children.slice(c0).concat(bf.children.slice(d0)); // the objects this part added (v11.57: a lost part hides them; the references survive the reorder below)
    if (r.rig) rigs.push(r.rig);
    if (r.hit)
      for (const h of r.hit) {
        hit.push(h);
        hitOwn.push(spec.parts.indexOf(p));
      }
    if (r.anim) hooks.push(r.anim);
  }
  const split = !!(opt && opt.split) && !F.finish; // the lab: every part's static geometry as its own mesh, so a part can be lit up under the cursor (not on a chain body: its parts ride the root segment)
  let body;
  if (F.finish) {
    // a chain body (the eel): the core skins the rig over the finished part list and the rig's mesh is the body
    const rig = F.finish(P, mat);
    rigs.unshift(rig);
    body = rig.mesh;
  } else body = new THREE.Mesh(merge(split ? P.slice(0, nCore) : P), mat);
  if (soft) {
    soft.add(body);
    bf.add(soft);
  } else bf.add(body);
  if (split)
    for (const r of built) {
      if (!r) continue;
      r.meshes = g.children.slice(r.C[0], r.C[1]).concat(bf.children.slice(r.D[0], r.D[1]));
      if (r.P[1] > r.P[0]) {
        const m = new THREE.Mesh(merge(P.slice(r.P[0], r.P[1])), mat);
        (soft || bf).add(m);
        r.meshes.push(m);
      }
    }
  // draw order: the body before the parts that were added while building (fins, tails, skirts, rigs), as the hand builders had it
  bf.children.splice(bf.children.indexOf(soft || body), 1);
  bf.children.unshift(soft || body);
  g.scale.setScalar(s);
  const pat=patternOf(spec);g.traverse(o=>{if(o.isMesh&&o.geometry&&o.geometry.attributes.position)patternOn(o.geometry,pat);}); // the texel pattern on every mesh of the body, the rigs' too (v11.41; the far LOD gets it in creatures_ai.js spawn)
  const B = {body: body, soft: soft, frame: bf},
    ca = F.anim;
  const anim = (t, spd, st) => {
    st = st || {};
    if (ca) ca(t, spd, st, B);
    for (const h of hooks) h(t, spd, st, B);
    const yw = bf.rotation.y;
    if (yw !== 0) {
      const cs = Math.cos(yw),
        sn = Math.sin(yw);
      for (const rig of rigs) {
        if (!rig.ride) continue;
        for (const c of rig.chains) {
          const R = c.restL;
          for (let k = 0; k <= c.n; k++) {
            const x = R[k * 3],
              z = R[k * 3 + 2];
            R[k * 3] = cs * x + sn * z;
            R[k * 3 + 2] = cs * z - sn * x;
          }
        }
      }
    }
  };
  // the grip (v11.31, combat.js): where this body takes hold of another and how, read off its parts — a slowblood's jaws at the mouth,
  // a ringmouth's arms closing on what the beak is at, a hingeshell's claws (the weapon, else the plate mouth as a clamp). In the
  // authoring frame like the hit capsules; the group's scale carries it. No mouth, or a rasp, a slit or a peck: no grip — it stings or
  // it does not fight
  let grip = null;
  const cl = spec.clade;
  spec.parts.forEach((p, i) => {
    const r = built[i];
    if (!r) return;
    const y = isFinite(p.y) ? p.y : 0;
    if (p.kind === 'weapon' && (p.style === 'claws' || p.style === 'spears' || p.style === 'fold' || p.style === 'whips')) grip = {kind: 'claws', at: [0, y, p.z + (r.reach || 0) * 0.5]};
    else if (p.kind === 'mouth' && !grip && p.style !== 'rasp' && p.style !== 'slit' && p.style !== 'peck')
      grip = {kind: cl === 'slowbloods' ? 'jaw' : cl === 'hingeshells' ? 'claws' : 'arms', at: [0, y, p.z + (p.style === 'plates' && p.where === 'probe' ? p.plen : 0)]};
  });
  if (grip && grip.kind === 'arms' && !rigs.length) grip.kind = 'jaw'; // a beak with no arms to hold with bites like a jaw
  // The edge and the coverings (v11.54, COMBAT.md §2 — pass 1 of injury as states): what this body cuts with, and what each of its hit
  // capsules is covered by, both read off the parts so a fight can ask whether the one gets through the other (combat.js EDGE). The edge is the
  // weapon's if it has one, else the mouth's: a beak, a rasp, the hingeshells' shredding mouthparts, or the slowbloods' petals by their `edge`
  // (hold, cut, point, crush). A covering is by clade — ringmouths skin, slowbloods hide (plate under `plates`), hingeshells plate (shell under
  // the big valves), drifters skin — and a shell part's own capsule is shell. gape: the mouth's radius at the world scale, what it can take whole.
  let edge = null, gape = 0;
  const hasPlates = spec.parts.some(p => p.kind === 'plates'), bigValves = spec.parts.some(p => p.kind === 'valves' && (p.style === 'back' || p.style === 'hood' || p.style === 'placed'));
  for (const p of spec.parts) {
    if (p.kind === 'weapon') { if (p.style === 'spears') edge = 'point'; else if (p.style === 'claws' || p.style === 'fold' || p.style === 'whips') edge = 'claws'; else if (p.style === 'ram') edge = 'ram'; }
    else if (p.kind === 'mouth' && !edge) { if (p.style === 'beak') edge = 'beak'; else if (p.style === 'rasp') edge = 'rasp'; else if (p.style === 'plates') edge = 'shred'; else if (p.style === 'tentacles') edge = p.edge || 'hold'; }
    if (p.kind === 'mouth' && !gape) gape = (p.style === 'tentacles' ? p.r : p.style === 'peck' ? p.r : p.R) || 0;
  }
  const base = cl === 'slowbloods' ? (hasPlates ? 'plate' : 'hide') : cl === 'hingeshells' ? (bigValves ? 'shell' : 'plate') : 'skin';
  const shellIdx = spec.parts.findIndex(p => p.kind === 'shell');
  if (spec.hit) { hitOwn.length = 0; spec.hit.forEach((h, i) => hitOwn.push(h.own ? spec.parts.findIndex(p => p.kind === h.own) : i === 0 && shellIdx >= 0 ? shellIdx : -1)); } // a spec's own hit list: the shell's capsule first (coil, great, ortho); a tail's marked own: 'tail' (fin, ridge, abyssal, basker; v11.57)
  const coverOf = i => (i < 0 ? base : spec.parts[i].kind === 'shell' ? 'shell' : spec.parts[i].kind === 'tail' || spec.parts[i].kind === 'fins' ? 'skin' : base), // a fin or a tail is skin on any clade (COMBAT.md §2)
    cover = hitOwn.map(coverOf);
  // No capsule past the nose (v11.54). Measured against the real hulls (the CHANGELOG's table): every lathe's capsule, the cores' formulas and the
  // kept hand lists alike, ended 0.5–0.7 of a body unit past the frame's nose — 2 m of capsule in front of the ridge's mouth, 1.6 of the basker's — so
  // two bodies touched and pushed apart before a mouth reached the other, and a hold's rope, which stops closing at the contact, held the prey
  // that far off the jaws for good. The mouth sits at F.nose (its default z); a capsule's surface now ends there. The tail end is left alone.
  const hitF = (spec.hit || hit).map(h => {
    const o = {a: h.a.slice(), b: h.b.slice(), r: h.r};
    if (isFinite(F.nose)) { if (o.a[2] + o.r > F.nose) o.a[2] = F.nose - o.r; if (o.b[2] + o.r > F.nose) o.b[2] = F.nose - o.r; }
    return o;
  });
  return {g: g, anim: anim, rigs: rigs, hit: hitF, hitOwn: hitOwn, built: built, F: F, grip: grip, edge: edge, cover: cover, gape: gape * s, pat: pat, frame: bf, body: body}; // frame, body (v11.53): the secondary motion scales and rolls the frame (fx.js bodyPose)
}
// A spec with every part's defaults filled and its styles resolved, without touching the given object.
function fillSpec(spec) {
  const out = Object.assign({}, spec),
    core = CORES[spec.core.kind];
  out.pattern=Object.assign({kind:PATTERN_BY_CLADE[spec.clade]||'none'},PATTERN_DEF,spec.pattern||{}); // the texel pattern (v11.41): by clade unless the spec says
  const c = Object.assign({}, spec.core);
  for (const k in core.params) if (c[k] === undefined && typeof core.params[k].d !== 'function') c[k] = core.params[k].d;
  for (const k in core.params) if (c[k] === undefined) c[k] = core.params[k].d(c); // a default read off the others (the trunk's z0 from L)
  out.core = c;
  // the frame the defaults are read from: a dry build against a throwaway list
  const dry = {P: [], g: new THREE.Group(), pal: DRY_PAL, spec: out, core: c, clock: swimClock},
    F = core.build(dry, c);
  out.parts = (spec.parts || []).map(p0 => {
    const def = PARTS[p0.kind];
    if (!def) return p0;
    const p = Object.assign({}, p0);
    if (!p.style || def.styles.indexOf(p.style) < 0) p.style = def.styles[0];
    for (const k of paramsFor(p.kind, p.style)) {
      if (p[k] !== undefined) continue;
      const d = def.params[k].d;
      p[k] = typeof d === 'function' ? d(F, p) : d;
    }
    return p;
  });
  return out;
}
// The grammar applied: the core must belong to the clade, every part must be allowed there, the required parts are added if missing,
// every ranged parameter is clamped to its extreme band and flagged if it left the believable one. Returns {spec, warnings}.
function validate(spec0) {
  const spec = fillSpec(spec0),
    W = [],
    gr = GRAMMAR[spec.clade],
    core = CORES[spec.core.kind];
  if (!gr) return {spec: spec, warnings: ['unknown clade ' + spec.clade]};
  if (gr.cores.indexOf(spec.core.kind) < 0) W.push('a ' + spec.core.kind + ' core is not a ' + spec.clade + ' body');
  const req = gr.req.filter(r => !(core.provides || []).some(k => k === r.split(':')[0])); // a core may carry a required part itself (the chain body is its own tail)
  if (core.req) for (const r of core.req) req.push(r);
  for (const r of req) {
    const [k, st] = r.split(':');
    if (!spec.parts.some(p => p.kind === k && (!st || p.style === st))) {
      const p = {kind: k},
        sf = stylesFor(k, spec.clade);
      p.style = st || sf[0];
      spec.parts.push(p);
      W.push('a ' + spec.clade.replace(/s$/, '') + ' has ' + (st ? st + ' ' : '') + k + ': added');
    }
  }
  for (const p of spec.parts) {
    const ok = stylesFor(p.kind, spec.clade, spec.core.kind); // by the core too (v11.70)
    if (!ok.length && PARTS[p.kind] && stylesFor(p.kind, spec.clade).length) W.push('a ' + spec.core.kind + ' cannot carry ' + p.kind + ((core.provides || []).indexOf(p.kind) >= 0 ? ': it is its own' : '')); // warned, not removed: the lab's part indices are the spec's (it removes them itself when the core changes)
    const heir = ok.find(st => PARTS[p.kind].reg[st].was === p.style); // a style split off per clade (v11.70.1): the numbers go with it
    if (heir) { p.style = heir; continue; }
    if (ok.length && ok.indexOf(p.style) < 0) {
      W.push(p.style + ' ' + p.kind + ' are not a ' + spec.clade.replace(/s$/, '') + "'s: " + ok[0]);
      p.style = ok[0];
      for (const k in p) if (k !== 'kind' && k !== 'style') delete p[k];
    }
  }
  spec.parts = fillSpec(spec).parts;
  const F = compileFrame(spec),
    ref = F.L;
  const clampP = (p, def, k) => {
    const q = def[k];
    if (!q || !q.x) return;
    const qb = bandOf(q, F, p),
      mul = q.k === 'len' || q.k === 'z' ? ref : 1,
      lo = qb.x[0] * mul,
      hi = qb.x[1] * mul;
    if (typeof p[k] !== 'number') return;
    if (q.k === 'z') {
      if (p[k] < lo || p[k] > hi) W.push(k + ' ' + p[k].toFixed(2) + ' is a long way from the body');
      return;
    } // a position is never clamped
    if (p[k] < lo || p[k] > hi) {
      W.push(k + ' ' + p[k].toFixed(2) + ' clamped to ' + clamp(p[k], lo, hi).toFixed(2));
      p[k] = clamp(p[k], lo, hi);
    } else if (p[k] < qb.b[0] * mul || p[k] > qb.b[1] * mul)
      W.push(k + ' ' + p[k].toFixed(2) + ' is past the believable band (' + (qb.b[0] * mul).toFixed(2) + '–' + (qb.b[1] * mul).toFixed(2) + ')');
  };
  for (const k in core.params) clampP(spec.core, core.params, k);
  for (const p of spec.parts) {
    const def = PARTS[p.kind];
    if (!def) {
      W.push('unknown part ' + p.kind);
      continue;
    }
    if (def.clades.indexOf(spec.clade) < 0) W.push(p.kind + ' is not a ' + spec.clade + ' part');
    for (const k of paramsFor(p.kind, p.style)) clampP(p, def.params, k);
  }
  if (spec.size > CLADE_LIMIT[spec.clade])
    W.push('a ' + spec.size + ' m ' + spec.clade.replace(/s$/, '') + " is past PLANET's limit (" + CLADE_LIMIT[spec.clade] + ')');
  return {spec: spec, warnings: W};
}
// a parameter's bands, which may be functions of the frame and the part (v11.25: the eye count's band is the style's)
function bandOf(q, F, p) {
  return {b: typeof q.b === 'function' ? q.b(F, p) : q.b, x: typeof q.x === 'function' ? q.x(F, p) : q.x};
}
function compileFrame(spec) {
  const dry = {P: [], g: new THREE.Group(), pal: DRY_PAL, spec: spec, core: spec.core, clock: swimClock};
  return CORES[spec.core.kind].build(dry, spec.core);
}

// ---------- derive: the numbers off the build ----------
// Closed form, no simulation (CREATOR.md, the calculator). Volume from the core's profile and the parts that carry mass; density by
// clade (shelled and armoured heavier, a gas chamber lifts); frontal area from the core and what stands out of it; thrust from the
// propulsors (a tail, fins, a skirt, flap rows, a jet from the mantle's volume), each a number the roster calibrates; the speed as
// sqrt(thrust/drag) scaled so the roster's finback reads its DEFS speed; turn against length and mass, plus what the fins add;
// no hp since v11.55 (COMBAT.md: injury is a state). mode is what the propulsors say, never a menu. Everything is at the world scale (spec.s applied).
const DERIVE_K = {
  speed: 3.15, // m/s: the top speed of a 2 m body at thrust/drag 1 on a tail. v11.71: the roster's fit — the geometric mean of derived/hand over the ten tailed kinds that swim for their life or their meal (flee where a kind has one, else speed) was 1.21 at the old 3.8, spread ×1.21
  tdExp: 0.35, // speed against thrust/drag: a steady body's goes as the square root (drag ∝ v²); the beat slowing under load flattens it, and the roster's tails fit 0.35 from the darter to the abyssal
  lenExp: 0.4, // speed against length: stride per beat ∝ L, beat rate ∝ L^-0.6 (muscle strain rate; Bainbridge's fish sit near L^0.5)
  mode: {undulate: 1, flap: 1, jet: 0.95, drift: 0.4, sail: 0.25}, // the propulsor against a tail at the same thrust/drag: a metachronal row matches it (fit 0.97 over seven paddlers), a jet wastes a little more in its refill (fit 1.00 over four), a bell's pulse and a sail's windage are slow by kind
  jet: 4, // a jet's thrust per mantle volume^(2/3): the water per pulse goes as the volume and the pulse rate as 1/length. To v11.70 it was volume × 4, so thrust/drag grew with the body and the veil derived 11.7 m/s
  walk: 1.0, // a walker's Froude number: speed = walk × sqrt(g × leg). A leg is a pendulum; the five walkers that flee fit 0.59 of this at the old 0.6
  walkTD: 1.5, // a walker's grip on the ground, standing in for thrust/drag in its accel
  chamber: 0.8, // a gas-chambered shell: the drag of a wheel carried flat, and no hard jetting against a shell's own buoyancy
  flex: 1.8, // turn, a body that bends along its whole length (the chain core) against a stiff hull of the same length: the eel's hand turn was 1.9× derive's
  ceilL: 60, // m: the length the speed ceiling bends at (CREATOR.md, The size ceiling, item 4). Power ∝ L³ against drag ∝ L²v³ has no ceiling, but a burst is an anaerobic store that lasts ~mass^0.25 while the time to reach speed grows faster (Hirt et al. 2017: the fastest animals are mid-sized) — past ceilL speed is flat in L
  ceilN: 4, // how sharply: the factor is (1+(L/ceilL)^n)^(-lenExp/n) — 0.999 at the abyssal's 19 m, 0.994 at 30 m, 0.93 at 60, and a 600 m body does what a 60 m one does
  accel: 1.4, // 1/s: the rate a body closes on the speed it wants, at thrust/drag 1 and 1 t (the three presets' hand numbers fit 0.97 of this)
  accMass: 0.15, // accel against mass: falls with it, gently — no ceiling term: a 10⁶ t body is already at 0.12 of a 1 t one's
  turn: 8, // rad/s at 1 m long (the roster's fit over thirty kinds: 1.04, spread ×1.5 — a facing rate, the loosest of the three)
  turnExp: 0.85, // turn against length: 0.04 rad/s at 600 m needs no ceiling either
  turnMax: 8 // rad/s: a body under a metre turns as fast as it likes
};
function derive(spec0) {
  const spec = fillSpec(spec0),
    s = spec.s || 1,
    gr = GRAMMAR[spec.clade] || GRAMMAR.ringmouths,
    dry = {
      P: [],
      g: new THREE.Group(),
      pal: DRY_PAL,
      spec: spec,
      core: spec.core,
      bf: new THREE.Group(),
      mat: MAT,
      clocks: [],
      clock: () => () => 0,
      beat: spec.core.beat || [1.5, 0.9]
    };
  const core = CORES[spec.core.kind],
    F = core.build(dry, spec.core);
  prepCtx(dry, F, spec);
  let vol = F.volume,
    area = F.area,
    cd = F.cd,
    thrust = 0,
    turn = 0,
    armour = 0,
    chambered = false,
    legs = false,
    legLen = 0,
    reach = 0,
    cost = 1,
    jet = F.jet,
    tail = false,
    flaps = false,
    eyes = 0,
    zmin = F.tail,
    zmax = F.nose;
  for (const p of spec.parts) {
    const def = PARTS[p.kind];
    if (!def) continue;
    let r;
    try {
      r = def.build(dry, p) || {};
    } catch (e) {
      r = {};
    }
    cost += def.cost * (def.paired || (p.kind === 'spines' && p.x > 0) || p.mirror ? 2 : 1);
    if (r.mass) vol += r.mass;
    if (r.area) area += r.area;
    if (r.thrust) thrust += r.thrust;
    if (r.turn) turn += r.turn;
    if (r.armour) armour += r.armour;
    if (r.chambered) chambered = true;
    if (r.legs) legs = true;
    if (r.leg) legLen = Math.max(legLen, r.leg);
    if (r.paddle) flaps = true;
    if (r.reach) reach = Math.max(reach, r.reach);
    if (r.streamline) cd *= r.streamline;
    if (r.extent) {
      zmin = Math.min(zmin, r.extent[0]);
      zmax = Math.max(zmax, r.extent[1]);
    }
    if (p.kind === 'tail' && p.style !== 'stub') tail = true;
    if (p.kind === 'flaps') flaps = true;
    if (p.kind === 'eyes') eyes += (p.n || 2) * (p.rows || 1);
    if (p.kind === 'head') eyes += p.n || 5;
  }
  // what the core does itself (v11.25): a chain body undulates, a bell pulses, a float sails and floats
  if (F.thrust) thrust += F.thrust;
  if (F.chambered) chambered = true;
  if (F.mode === 'undulate') tail = true;
  // to the world scale: volume with the cube, areas and thrust (a muscle's cross-section) with the square
  const s3 = s * s * s,
    s2 = s * s,
    L = (zmax - zmin) * s;
  vol *= s3;
  area *= s2;
  const dens = gr.density + armour * 0.6,
    mass = vol * dens;
  if (jet) thrust += Math.pow(F.volume, 2 / 3) * DERIVE_K.jet * (F.jetK || 1); // the jet: the mantle's volume per pulse, and the pulse rate falling as 1/length (a sac pulses feebly: jetK)
  thrust *= s2;
  const drag = Math.max(0.02, area * cd);
  const mode = F.mode === 'sail' ? 'sail' : flaps ? 'flap' : tail ? 'undulate' : jet ? 'jet' : legs ? 'walk' : 'drift';
  // speed (v11.71, one calculator for every animal): a swimmer's top speed is K × efficiency(mode) × (thrust/drag)^tdExp × (L/2)^lenExp, under the
  // ceiling; a walker's is Froude's, sqrt(g × leg) — a leg is a pendulum, and drag is not what stops it. Everything is a named term in DERIVE_K.
  const K = DERIVE_K,
    Lc = Math.max(0.2, L),
    ceil = Math.pow(1 + Math.pow(Lc / K.ceilL, K.ceilN), -K.lenExp / K.ceilN), // neutral below ~30 m (0.994 at 30), and speed flat in L past ceilL
    td = Math.pow(thrust / drag, K.tdExp);
  let speed = mode === 'walk' ? K.walk * Math.sqrt(GRAV * Math.max(0.02, legLen * s)) : K.speed * K.mode[mode] * td * Math.pow(Lc / 2, K.lenExp) * ceil;
  if (chambered) speed *= K.chamber;
  const accel = ((K.accel * (mode === 'walk' ? K.walkTD : td)) / Math.pow(Math.max(0.3, mass), K.accMass)) * (mode === 'jet' ? 1.1 : mode === 'flap' ? 1.3 : 1);
  const turnK = Math.min(
    K.turnMax,
    (K.turn / Math.pow(Math.max(0.5, L), K.turnExp)) *
      (1 + 0.15 * turn) *
      (mode === 'jet' ? 1.5 : 1) *
      (chambered ? 0.5 : 1) *
      (mode === 'flap' ? 0.7 : 1) *
      (F.mode === 'undulate' ? K.flex : 1)
  );
  const buoy = chambered ? 'floats' : mass > vol * 1.05 ? 'sinks' : 'neutral';
  const plausible = [];
  if (spec.size > CLADE_LIMIT[spec.clade]) plausible.push("past PLANET's size limit for the clade");
  if (spec.clade === 'hingeshells' && tail) plausible.push('a hingeshell cannot undulate');
  if (spec.clade === 'drifters' && eyes > 0) plausible.push('a drifter has no eyes');
  if (spec.clade === 'slowbloods' && !tail && !(spec.behaviour && spec.behaviour.floor)) plausible.push('a slowblood off the floor wants a tail');
  if (spec.clade === 'ringmouths' && chambered && spec.depth !== undefined && spec.depth < -450)
    plausible.push('a chambered shell implodes below −450');
  if (spec.depth !== undefined && spec.depth < -200 && eyes > 8) plausible.push('many eyes below the light');
  if (thrust < 0.01) plausible.push('nothing propels it');
  if (L / 2 > spec.size * 1.6) plausible.push('longer than its size says (' + (L / 2).toFixed(1) + ' m half-length)');
  return {
    mass: +mass.toFixed(2),
    volume: +vol.toFixed(2),
    drag: +drag.toFixed(3),
    thrust: +thrust.toFixed(2),
    speed: +speed.toFixed(1),
    accel: +accel.toFixed(2),
    turn: +turnK.toFixed(2),
    mode: mode,
    buoyancy: buoy,
    jet: jet && !legs,
    legs: legs,
    reach: +(reach * s + L * 0.5).toFixed(1),
    cost: cost,
    length: +L.toFixed(2),
    plausible: plausible
  };
}
// The stats a species runs on: derive's. v11.71 (the person, 21 Sep 2026: one universal logic for every animal): a spec's locks (spec.stats: a hand
// value per key, CREATOR decision 2) are a tuning tool of the dev lab and nothing else — they are read only when the caller asks (locks), and only
// the dev lab's readout and its placed creature ask. Nothing that lives in the world, the player included, runs on a lock; no SPECS entry carries one.
function statsOf(spec, locks) {
  const d = derive(spec),
    o = Object.assign({}, d);
  if (locks && spec.stats) for (const k in spec.stats) if (spec.stats[k] !== undefined && spec.stats[k] !== null) o[k] = spec.stats[k];
  return o;
}

// ---------- the texel pattern (v11.41, PIXEL.md pass B) ----------
// In pixel mode (effects.js) a body's texels carry a pattern in body space (scene.js PIX_CLS_GLSL 'body'): stripes are bands along z, spots hashed
// clusters, plates a coarser grid with a seam, scales the same with every other row offset. By clade unless the spec's `pattern` says otherwise —
// the person's rule (PIXEL.md Decided 5): ringmouths spots, slowbloods stripes, hingeshells plates, drifters none. `scale` is cells per period,
// `tone` how much darker the mark is. It rides the geometry as a per-vertex attribute aPat (kind, scale, tone) so a shared material needs no
// per-mesh uniform; a geometry without it (an egg, a plant) reads zero and draws no pattern. The painter for a custom coat is pass D.
const PATTERNS=['none','stripes','spots','plates','scales'],PATTERN_BY_CLADE={ringmouths:'spots',slowbloods:'stripes',hingeshells:'plates',drifters:'none'},PATTERN_DEF={scale:3,tone:0.12};
function patternOf(spec){const p=spec.pattern||{};const k=PATTERNS.indexOf(p.kind||PATTERN_BY_CLADE[spec.clade]||'none');return [k<0?0:k,+(p.scale||PATTERN_DEF.scale),p.tone!==undefined?+p.tone:PATTERN_DEF.tone];}
function patternOn(geo,pat){const n=geo.attributes.position.count,old=geo.attributes.aPat;if(old&&old.count===n&&old.array[0]===pat[0]&&old.array[1]===pat[1]&&old.array[2]===pat[2])return;const a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=pat[0];a[i*3+1]=pat[1];a[i*3+2]=pat[2];}geo.setAttribute('aPat',new THREE.BufferAttribute(a,3));}
// ---------- the coat: colour by chemistry ----------
// What an animal here can be coloured with, and why (CREATOR.md, Colour). Three sources: its blood (copper: a grey-green to teal cast
// in the flesh; iron: rust and red-brown; vanadium: straw and yellow-green — PLANET), the pigments it makes itself (melanins: black,
// brown, rust — every clade; ommochromes from an amino acid: yellow through red-brown — the ringmouths' chromatophore family), and
// what it eats: carotenoids (yellow, orange, red) come only from the photosynthesisers, so they run out with the light and are absent
// entirely on the vent and chemocline food chains. Blue is a structure, not a pigment (no animal makes a blue pigment to speak of):
// rare, costly, and pointless below −20 where nothing sees it. Depth does the rest: red is free camouflage below −15 because red light
// is gone (a red animal is black there), the deep is red and black, the floor pale and cream where the bottom scatters, and the
// countershade (dark over pale) belongs to the lit water where something looks up at you. The pale keys (belly, joint, jaw) hold
// their lightness; eyes are the clade's and never move.
const COAT_BAND = [
  // by the water's depth: the tints a coat is drawn from, [hue, sat, light] with a weight; the picker mixes the band's tints
  {
    h: -15,
    name: 'the sunlit shallows',
    tints: [
      [170, 0.28, 0.42, 1],
      [95, 0.22, 0.4, 0.6],
      [40, 0.45, 0.48, 0.5],
      [20, 0.5, 0.4, 0.3],
      [200, 0.2, 0.3, 0.4]
    ],
    belly: 0.78,
    contrast: 0.55
  },
  {
    h: -60,
    name: 'the shelf',
    tints: [
      [175, 0.24, 0.36, 1],
      [110, 0.2, 0.34, 0.5],
      [30, 0.35, 0.36, 0.5],
      [15, 0.4, 0.32, 0.4],
      [200, 0.12, 0.26, 0.3]
    ],
    belly: 0.72,
    contrast: 0.5
  },
  {
    h: -200,
    name: 'the slope',
    tints: [
      [10, 0.45, 0.28, 1],
      [25, 0.3, 0.24, 0.6],
      [190, 0.12, 0.22, 0.4],
      [0, 0.02, 0.1, 0.6]
    ],
    belly: 0.5,
    contrast: 0.3
  },
  {
    h: -450,
    name: 'the dark rim',
    tints: [
      [5, 0.5, 0.2, 1],
      [0, 0.02, 0.07, 1],
      [30, 0.15, 0.15, 0.3]
    ],
    belly: 0.28,
    contrast: 0.15
  },
  {
    h: -800,
    name: 'the dark',
    tints: [
      [0, 0.02, 0.05, 1],
      [5, 0.4, 0.14, 0.6],
      [30, 0.05, 0.3, 0.3]
    ],
    belly: 0.16,
    contrast: 0.05
  }
];
const COAT_DIET = {
  // what the food adds: a carotenoid warmth needs the photosynthesisers; a vent or chemocline diet is pale
  browser: {hue: 35, sat: 0.12, note: 'a grazer of the lit water: carotenoids, a warm cast'},
  hunter: {hue: 0, sat: 0, note: 'a hunter: what its prey ate, faded'},
  filter: {hue: 45, sat: 0.06, note: 'a filter feeder: a little of everything'},
  vent: {hue: 0, sat: -0.15, note: 'a vent or chemocline diet: no carotenoids at all — pale, or iron-red'},
  floor: {hue: 25, sat: -0.05, note: 'a floor dweller: the colour of its floor, mottled'}
};
const COAT_BLOOD = {ringmouths: [172, 0.32], slowbloods: [14, 0.55], hingeshells: [58, 0.3], drifters: [200, 0.1]}; // the drifters: no blood pigment to speak of (translucent)
// ---------- the coat by the place's chemistry (v11.66) ----------
// PLANET, Cross-clade rules: shell colour is water chemistry, read by place — rust where dissolved iron meets oxygen on the basalt (rock in
// the lit water), cream calcite on the reef (the lime rind's own ground: the shallows' rock where the surf strikes), black iron sulfide below
// the chemocline and at the vents, manganese-dark on the plain (the mud below the light); and darker where the rock is fresh (SEAFLOOR §2: reading
// `young` tints an island's life without an island id). A kind's PAL entry is its preset; the class shifts it. What shifts is by clade
// (COAT_CHEM_KEYS): a hingeshell's whole exoskeleton mineralises, so every plate key moves; the other clades' rows are empty until their own
// passes decide what their pigment does (a ringmouth's shell, a slowblood's plates are the candidates). Two more classes are states, not places:
// `soft` (the moult: the whole animal pale, the bleached coat of v11.8) and `shed` (the cast carapace: dull, drying). The pale keys (joint, belly,
// jaw) keep their lightness where the class darkens; eyes, pupils, mouths and claws never move (PAL_FIXED, as palVariant). coatClassAt reads the
// class off the ground's height, the water's depth and the fields; creatures_ai.js spawn caches a geometry per kind and class.
const COAT_CHEM_KEYS = {hingeshells: ['top', 'belly', 'flap', 'plate', 'leg', 'valve', 'rim', 'shell', 'comb', 'gut'], ringmouths: [], slowbloods: [], drifters: []};
const COAT_CLASSES = {
  rust: (c, k) => [lerp(c[0], 14, 0.6), lerp(c[1], 0.55, 0.5), c[2] * 0.95],
  lime: (c, k) => [lerp(c[0], 40, 0.5), c[1] * 0.55, lerp(c[2], 0.72, 0.3)], // seen 15 Sep 2026 at 0.45/0.78/0.5: the hose in the forest read bleached, a soft one; toned to a cream cast
  sulfide: (c, k) => [c[0], c[1] * 0.5, PAL_PALE[k] ? c[2] * 0.75 : c[2] * 0.5],
  mn: (c, k) => [lerp(c[0], 30, 0.3), c[1] * 0.4, PAL_PALE[k] ? c[2] * 0.8 : c[2] * 0.6],
  d: (c, k) => [c[0], c[1] * 0.9, PAL_PALE[k] ? c[2] * 0.9 : c[2] * 0.78], // the young suffix: fresh basalt, darker
  soft: (c, k) => [c[0], c[1] * 0.35, lerp(c[2], 0.86, 0.7)],
  shed: (c, k) => [c[0], c[1] * 0.6, PAL_PALE[k] ? c[2] * 0.9 : lerp(c[2], 0.7, 0.35)]
};
// the class at a place: h the ground's height, y the animal's depth, f the fields there. '' is the preset — and '' for a clade whose key
// list is empty (nothing would move, and a class is a geometry in the cache)
function coatClassAt(h, y, f, clade) {
  if (clade && !(COAT_CHEM_KEYS[clade] || []).length) return '';
  const sulf = y < CHEMO || f[FI.heat] > 0.3,
    lime = h > -26 && f[FI.sub] > 0.55 && f[FI.expo] > 0.35,
    rust = !lime && f[FI.sub] > 0.55 && h > -80,
    mn = !sulf && h < -200 && f[FI.sub] < 0.35;
  let cls = sulf ? 'sulfide' : lime ? 'lime' : rust ? 'rust' : mn ? 'mn' : '';
  if (f[FI.young] > 0.4 && !sulf) cls += 'd';
  return cls;
}
// the palette shifted by a class (a place's, or 'soft'/'shed'), for a clade; the same object back when nothing in it moves
function coatChem(pal, cls, clade) {
  if (!cls || !pal) return pal;
  const state = cls === 'soft' || cls === 'shed',
    keys = state ? Object.keys(pal) : COAT_CHEM_KEYS[clade] || [],
    place = state ? null : COAT_CLASSES[cls.replace(/d$/, '')],
    young = !state && /d$/.test(cls);
  if (!state && !place && !young) return pal;
  const out = Object.assign({}, pal);
  let moved = false;
  for (const k of keys) {
    const c = pal[k];
    if (!Array.isArray(c) || (PAL_FIXED[k] && cls !== 'shed')) continue; // a cast carapace's eyes are cuticle, pale as the rest (seen 15 Sep 2026: black beads on a shed trap read alive)
    let h = rgb2hsl(c);
    if (state) h = COAT_CLASSES[cls](h, k);
    else {
      if (place) h = place(h, k);
      if (young) h = COAT_CLASSES.d(h, k);
    }
    out[k] = hsl2rgb(h[0], clamp(h[1], 0, 1), clamp(h[2], 0.02, 0.97));
    moved = true;
  }
  return moved ? out : pal;
}
// A coat drawn for a clade at a depth on a diet: the palette keys the clade's builders read. rng: a seeded generator (mulberry(seed)).
// f (v11.66): the fields at the place — the chemistry class shifts the drawn coat as it shifts a preset (coatChem)
function coatFor(clade, depth, diet, rng, f) {
  rng = rng || Math.random;
  let band = COAT_BAND[0];
  for (const b of COAT_BAND) if (depth <= b.h) band = b;
  const blood = COAT_BLOOD[clade] || [0, 0],
    dt = COAT_DIET[diet] || COAT_DIET.hunter;
  // pick a tint by weight, pull it toward the blood a little, then the diet
  let W = 0;
  for (const t of band.tints) W += t[3];
  let x = rng() * W,
    tint = band.tints[0];
  for (const t of band.tints) {
    x -= t[3];
    if (x <= 0) {
      tint = t;
      break;
    }
  }
  let h = lerp(tint[0], blood[0], 0.35),
    sa = clamp(lerp(tint[1], blood[1], 0.3) + dt.sat, 0.02, 0.9),
    li = tint[2] * (0.85 + 0.3 * rng());
  if (dt.hue && dt.sat > 0) h = lerp(h, dt.hue, 0.25);
  const top = hsl2rgb(h, sa, li),
    belly = hsl2rgb(h + 8, sa * 0.5, lerp(li, band.belly, band.contrast + 0.35)),
    dark = hsl2rgb(h - 10, sa * 0.8, li * 0.6);
  const pale = hsl2rgb(blood[0], blood[1] * 0.6, 0.74),
    paleJ = hsl2rgb(blood[0], blood[1] * 0.7, 0.68);
  const pal = {
    top: top,
    belly: belly,
    mantle: top,
    flesh: top,
    arm: hsl2rgb(h + 4, sa * 0.9, li * 1.05),
    ridge: dark,
    web: hsl2rgb(h, sa * 0.7, li * 0.9),
    plate: dark,
    band: hsl2rgb(blood[0], blood[1], 0.28),
    rust: hsl2rgb(14, 0.55, 0.32),
    shell: hsl2rgb(40, 0.22, depth < -450 ? 0.12 : depth < -40 ? 0.4 : 0.78),
    flap: hsl2rgb(h, sa * 0.8, li * 0.9),
    joint: paleJ,
    jaw: pale,
    claw: hsl2rgb(h, sa * 0.6, 0.14),
    leg: dark,
    mouth: [0.05, 0.06, 0.07],
    eye: clade === 'ringmouths' ? [0.8, 0.84, 0.76] : clade === 'slowbloods' ? [0.06, 0.06, 0.07] : [0.06, 0.06, 0.06],
    pupil: [0.04, 0.04, 0.05],
    // the drifters' keys (v11.25): a bell colourless in the light and dark red below it (DRIFTERS.md); a float blue-violet at the surface
    bell: depth < -200 ? hsl2rgb(355, 0.72, 0.12) : hsl2rgb(200, 0.3, 0.9),
    core: depth < -200 ? hsl2rgb(355, 0.7, 0.08) : hsl2rgb(205, 0.35, 0.85),
    float: hsl2rgb(235, 0.7, 0.76),
    crest: hsl2rgb(320, 0.55, 0.76),
    body: hsl2rgb(270, 0.3, 0.55),
    line: hsl2rgb(232, 0.75, 0.72)
  };
  pal.note = band.name + '; ' + dt.note;
  if (f) {
    const cls = coatClassAt(depth, depth, f);
    if (cls) {
      const q = coatChem(pal, cls, clade);
      q.note = pal.note + '; ' + cls;
      return q;
    }
  }
  return pal;
}

// ---------- the species that are specs ----------
// Each entry is the hand builder it replaced, parameter for parameter (v11.10: the tris and extents match to the bit; test/ident.js).
// s is the authoring scale DEFS/CLADES built at; size the roster's half-length; coat the PAL key; hit the builder's own capsules.
const FIN_PROF = [
    [0.02, -0.58],
    [0.36, -0.55],
    [0.5, -0.2],
    [0.52, 0.3],
    [0.42, 0.9],
    [0.3, 1.25],
    [0.26, 1.4]
  ],
  FIN_TPROF = [
    [0.02, 0.03],
    [0.34, 0.02],
    [0.34, 0],
    [0.28, -0.35],
    [0.16, -0.8],
    [0.08, -1.15],
    [0.02, -1.35]
  ];
const SPECS = {
  soft: {
    id: 'soft',
    clade: 'ringmouths',
    size: 1.6,
    s: 1.0,
    coat: 'softP',
    core: {kind: 'mantle', L: 2.5, R: 0.6, beat: [1.8, 0.45]},
    parts: [
      {kind: 'ridge'},
      {kind: 'eyes', style: 'collar', n: 8},
      {kind: 'eyes', style: 'cluster', n: 3},
      {kind: 'mouth', style: 'beak'},
      {kind: 'skirt'},
      {kind: 'arms', style: 'jet', len: 2.1, w: 0.21, segs: 4}
    ],
    behaviour: {role: 'player'}
  },
  arrow: {
    id: 'arrow',
    clade: 'ringmouths',
    size: 1.0,
    s: 1.1,
    coat: 'arrow',
    core: {kind: 'mantle', L: 1.1, R: 0.25, beat: [1.8, 0.45]},
    parts: [
      {kind: 'ridge'},
      {kind: 'eyes', style: 'collar', n: 8},
      {kind: 'eyes', style: 'cluster', n: 3},
      {kind: 'mouth', style: 'beak'},
      {kind: 'skirt'},
      {kind: 'arms', style: 'jet', len: 0.8, w: 0.08, segs: 3, ks: 80, damp: 10}
    ],
    behaviour: {role: 'hunter'}
  },
  coil: {
    id: 'coil',
    clade: 'ringmouths',
    size: 1.5,
    s: 1.0,
    coat: 'coilP',
    core: {kind: 'coilbody', R: 0.46, z: 0.15, beat: [2.2, 1]},
    parts: [
      {kind: 'shell', style: 'coil', n: 22, R0: 0.12, R1: 1.0, cy: 0.55, cz: -1.0, k: 0.36, carry: 'up'},
      {kind: 'eyes', style: 'collar', n: 8},
      {kind: 'eyes', style: 'cluster', n: 3},
      {kind: 'mouth', style: 'beak'},
      {kind: 'arms', style: 'withdraw', len: 0.95, w: 0.09, segs: 3, ks: 70, damp: 10, s0: 0.26, a0: 0.12}
    ],
    hit: [
      {a: [0, 0.65, -1.1], b: [0, 1.1, -1.1], r: 0.8},
      {a: [0, 0, -0.4], b: [0, 0, 0.9], r: 0.45}
    ],
    behaviour: {role: 'player'}
  },
  great: {
    id: 'great',
    clade: 'ringmouths',
    size: 6,
    s: 3.2,
    coat: 'great',
    core: {kind: 'coilbody', R: 0.58, z: 0.15, beat: [1.6, 0.8]},
    parts: [
      {kind: 'shell', style: 'coil', n: 28, R0: 0.09, R1: 1.05, cy: 0.62, cz: -1.05, k: 0.38, carry: 'up', spines: true},
      {kind: 'eyes', style: 'collar', n: 8},
      {kind: 'eyes', style: 'cluster', n: 5},
      {kind: 'mouth', style: 'beak'},
      {kind: 'arms', style: 'cone', len: 1.15, w: 0.12, segs: 4, ks: 60, damp: 10, s0: 0.3, s1: 0.1, a0: 0.1, a1: 0.1, k0: 0.6, k1: 1.4}
    ],
    hit: [
      {a: [0, 0.7, -1.15], b: [0, 1.2, -1.15], r: 0.9},
      {a: [0, 0, -0.5], b: [0, 0, 1.0], r: 0.55}
    ],
    behaviour: {role: 'coil'}
  },
  ortho: {
    id: 'ortho',
    clade: 'ringmouths',
    size: 8,
    s: 1,
    coat: 'ortho',
    core: {kind: 'coilbody', R: 0.7, z: 3.55, sx: 1, sy: 0.92, sz: 0.75, beat: [2, 1]},
    parts: [
      {kind: 'shell', style: 'cone', L: 7.5, z0: 3.4, r0: 0.62, segs: 7, turns: 3.5},
      {kind: 'eyes', style: 'collar', n: 8, z: 3.75, R: 0.62, r: 0.08, sy: 0.82, y0: 0},
      {kind: 'eyes', style: 'cluster', n: 5, y: 0.4, z: 3.85, R: 0.3, r: 0.12},
      {kind: 'mouth', style: 'beak', y: -0.05, z: 4.0, R: 0.2},
      {
        kind: 'arms',
        style: 'cone',
        z: 3.95,
        R: 0.38,
        len: 2.2,
        w: 0.22,
        segs: 4,
        curve: 0.03,
        ks: 60,
        damp: 9,
        s0: 0.3,
        s1: 0.1,
        a0: 0.16,
        a1: 0.08,
        k0: 0.9,
        k1: 1.5
      }
    ],
    hit: [
      {a: [0, 0, -3.6], b: [0, 0, 3.4], r: 0.5},
      {a: [0, 0, 3.4], b: [0, 0, 4.1], r: 0.6}
    ],
    behaviour: {role: 'hunter'}
  },
  fin: {
    id: 'fin',
    clade: 'slowbloods',
    size: 1.8,
    s: 1.05,
    coat: 'finP',
    core: {kind: 'lathe', prof: FIN_PROF, segs: 8, beat: [1.5, 0.9]},
    parts: [
      {kind: 'eyes', style: 'ring', z: 1.1, R: 0.37, pred: true},
      {kind: 'chevrons', z0: 0.8, z1: -0.5, ds: 0.22, sz: 0.12},
      {kind: 'mouth', style: 'tentacles', z: 1.38, r: 0.22, len: 0.5, n: 6, w: 0.1, segs: 2, pulse: true},
      {kind: 'fins', z: 0.35, R: 0.5, h: 0.55, len: 0.6, amp: 0.25, dorsal: 0.3},
      {kind: 'tail', style: 'lathe', prof: FIN_TPROF, z: -0.55, lz: -1.25, lh: 0.85, ll: 0.5, amp: 0.45, sp0: 0.25, spk: 0.2, body: 0.05}
    ],
    hit: [
      {a: [0, 0, -0.45], b: [0, 0, 1.6], r: 0.5},
      {a: [0, 0, -1.8], b: [0, 0, -0.45], r: 0.24, own: 'tail'}
    ],
    behaviour: {role: 'player'}
  },
  ridge: {
    id: 'ridge',
    clade: 'slowbloods',
    size: 9,
    s: 3.1,
    coat: 'ridge',
    core: {kind: 'lathe', prof: FIN_PROF, segs: 8, beat: [1.5, 0.9]},
    parts: [
      {kind: 'eyes', style: 'ring', z: 1.1, R: 0.37, pred: true},
      {kind: 'chevrons', z0: 0.8, z1: -0.5, ds: 0.22, sz: 0.12},
      {kind: 'spines', n: 6, r: 0.08, h: 0.45, z0: 0.5, dz: 0.32, y0: 0.55, dy: 0.02, x: 0, rx: -0.5},
      {kind: 'mouth', style: 'tentacles', z: 1.38, r: 0.22, len: 0.5, n: 6, w: 0.1, segs: 2, pulse: true, edge: 'cut'},
      {kind: 'fins', z: 0.35, R: 0.5, h: 0.55, len: 0.6, amp: 0.25, dorsal: 0.3},
      {kind: 'tail', style: 'lathe', prof: FIN_TPROF, z: -0.55, lz: -1.25, lh: 0.85, ll: 0.5, amp: 0.45, sp0: 0.25, spk: 0.2, body: 0.05}
    ],
    hit: [
      {a: [0, 0, -0.45], b: [0, 0, 1.6], r: 0.5},
      {a: [0, 0, -1.8], b: [0, 0, -0.45], r: 0.24, own: 'tail'}
    ],
    behaviour: {role: 'hunter'}
  },
  abyssal: {
    id: 'abyssal',
    clade: 'slowbloods',
    size: 15,
    s: 5.0,
    coat: 'abyss',
    depth: -600,
    core: {
      kind: 'lathe',
      prof: [
        [0.02, -0.7],
        [0.4, -0.65],
        [0.62, -0.2],
        [0.66, 0.35],
        [0.55, 0.95],
        [0.36, 1.3],
        [0.3, 1.45]
      ],
      segs: 9,
      beat: [1.2, 0.7]
    },
    parts: [
      {kind: 'eyes', style: 'ring', z: 1.15, R: 0.42, pred: true},
      {kind: 'chevrons', z0: 0.9, z1: -0.55, ds: 0.2, sz: 0.14},
      {kind: 'spines', n: 7, r: 0.07, h: 0.5, z0: 0.6, dz: 0.3, y0: 0.62, dy: 0.03, x: 0.14, rx: -0.45, ry: 0.25},
      {
        kind: 'barbels',
        style: 'whisker',
        pairs: [
          [0.22, -0.15],
          [0.3, 0.12]
        ],
        len: 1.3,
        r: 0.05,
        z: 1.9
      },
      {kind: 'mouth', style: 'tentacles', z: 1.45, r: 0.27, len: 0.7, n: 8, w: 0.1, segs: 2, edge: 'cut'},
      {kind: 'fins', z: 0.35, R: 0.62, h: 0.7, len: 0.9, amp: 0.2, dorsal: 0.3},
      {
        kind: 'tail',
        style: 'lathe',
        prof: [
          [0.02, 0.03],
          [0.42, 0.02],
          [0.42, 0],
          [0.32, -0.45],
          [0.18, -0.95],
          [0.08, -1.3],
          [0.02, -1.5]
        ],
        z: -0.65,
        lz: -1.4,
        lh: 1.1,
        ll: 0.6,
        amp: 0.4,
        sp0: 0.25,
        spk: 0.2,
        body: 0.04
      }
    ],
    hit: [
      {a: [0, 0, -0.55], b: [0, 0, 1.75], r: 0.62},
      {a: [0, 0, -2.1], b: [0, 0, -0.55], r: 0.3, own: 'tail'}
    ],
    behaviour: {role: 'hunter'}
  },
  grazer: {
    id: 'grazer',
    clade: 'slowbloods',
    size: 2.6,
    s: 1.5,
    coat: 'grazer',
    core: {
      kind: 'lathe',
      prof: [
        [0.02, -1.0],
        [0.3, -0.95],
        [0.62, -0.3],
        [0.68, 0.4],
        [0.58, 0.95],
        [0.45, 1.25],
        [0.4, 1.35]
      ],
      segs: 8,
      beat: [1.6, 1]
    },
    parts: [
      {kind: 'eyes', style: 'ring', z: 1.05, R: 0.55, pred: false},
      {kind: 'chevrons', z0: 0.8, z1: -0.85, ds: 0.25, sz: 0.14},
      {kind: 'spines', n: 6, r: 0.07, h: 0.4, z0: 0.6, dz: 0.3, y0: 0.6, dy: 0.02, x: 0, rx: -0.5}, // the grazer's spines (v11.55, COMBAT.md §3b): a herd animal that cannot outrun a holder is a bad thing to hold
      {kind: 'mouth', style: 'tentacles', z: 1.33, r: 0.36, len: 0.42, n: 8, w: 0.12, segs: 2, idle: 0.15, kk: 0},
      {kind: 'fins', z: 0.3, R: 0.66, h: 0.45, len: 0.6, amp: 0.35, dorsal: 0.2},
      {
        kind: 'tail',
        style: 'cyl',
        r0: 0.3,
        r1: 0.08,
        L: 0.6,
        segs: 8,
        z: -0.95,
        lz: -0.7,
        lh: 0.7,
        ll: 0.45,
        axis: 'x',
        amp: 0.3,
        sp0: 0.3,
        spk: 0.3,
        body: 0
      }
    ],
    hit: [{a: [0, 0, -0.85], b: [0, 0, 1.2], r: 0.62}],
    behaviour: {role: 'graze'}
  },
  darter: {
    id: 'darter',
    clade: 'slowbloods',
    size: 0.6,
    s: 1.2,
    coat: 'darter',
    core: {
      kind: 'lathe',
      prof: [
        [0.01, -0.28],
        [0.08, -0.15],
        [0.11, 0.02],
        [0.09, 0.2],
        [0.07, 0.26]
      ],
      segs: 6,
      beat: [6, 2]
    },
    parts: [
      {kind: 'eyes', style: 'ring', z: 0.17, R: 0.085, pred: false},
      {kind: 'mouth', style: 'tentacles', z: 0.25, r: 0.055, len: 0.1, n: 4, w: 0.025, segs: 1, kk: 0},
      {kind: 'fins', z: 0.02, R: 0.11, h: 0.11, len: 0.13, amp: 0},
      {kind: 'tail', style: 'lobes', z: -0.26, lz: -0.1, lh: 0.2, ll: 0.14, amp: 0.5, full: true, body: 0}
    ],
    hit: [{a: [0, 0, -0.25], b: [0, 0, 0.25], r: 0.1}],
    behaviour: {role: 'boid'}
  },
  needle: {
    id: 'needle',
    clade: 'slowbloods',
    size: 0.9,
    s: 0.75,
    coat: 'needle',
    core: {
      kind: 'lathe',
      prof: [
        [0.01, -0.75],
        [0.09, -0.65],
        [0.14, -0.1],
        [0.15, 0.4],
        [0.12, 0.85],
        [0.09, 1.05],
        [0.08, 1.12]
      ],
      segs: 7,
      beat: [4, 2]
    },
    parts: [
      {kind: 'eyes', style: 'ring', z: 0.92, R: 0.115, pred: true},
      {kind: 'chevrons', z0: 0.7, z1: -0.5, ds: 0.2, sz: 0.05},
      {kind: 'mouth', style: 'tentacles', z: 1.1, r: 0.07, len: 0.65, n: 4, w: 0.035, segs: 2, kk: 0.8, edge: 'point'},
      {kind: 'fins', z: 0.35, R: 0.15, h: 0.16, len: 0.25, amp: 0},
      {kind: 'tail', style: 'cyl', r0: 0.09, r1: 0.03, L: 0.5, segs: 6, z: -0.7, lz: -0.6, lh: 0.36, ll: 0.2, amp: 0.45, sp0: 0.3, spk: 0.3, body: 0}
    ],
    hit: [{a: [0, 0, -1.1], b: [0, 0, 1.5], r: 0.15}],
    behaviour: {role: 'hunter'}
  },
  basker: {
    id: 'basker',
    clade: 'slowbloods',
    size: 5,
    s: 1.2,
    coat: 'basker',
    core: {
      kind: 'lathe',
      prof: [
        [0.02, -2.3],
        [0.55, -2.2],
        [1.15, -1.0],
        [1.42, 0.3],
        [1.38, 1.6],
        [1.1, 2.6],
        [0.8, 3.15],
        [0.7, 3.3]
      ],
      segs: 10,
      beat: [1.2, 0.8],
      belly: 'rust'
    },
    parts: [
      {kind: 'eyes', style: 'ring', z: 2.7, R: 1.0, pred: true},
      {kind: 'chevrons', z0: 2.0, z1: -1.6, ds: 0.5, sz: 0.3},
      {kind: 'spines', n: 7, r: 0.12, h: 0.9, z0: 1.4, dz: 0.6, y0: 1.25, dy: 0.06, x: 0, rx: -0.5}, // the basker's spines (v11.55, COMBAT.md §3b): the slowbloods' defensive venom sits on them
      {kind: 'mouth', style: 'tentacles', z: 3.25, r: 0.62, len: 1.0, n: 6, w: 0.24, segs: 2, edge: 'cut'},
      {kind: 'fins', z: 0.9, R: 1.4, h: 1.5, len: 2.0, amp: 0.15, fk: 0.7, dorsal: 0.3, col: 'rust'},
      {
        kind: 'tail',
        style: 'cyl',
        r0: 0.55,
        r1: 0.15,
        L: 2.0,
        segs: 9,
        z: -2.2,
        lz: -2.3,
        lh: 2.2,
        ll: 0.9,
        amp: 0.4,
        sp0: 0.25,
        spk: 0.25,
        body: 0,
        col: 'rust'
      }
    ],
    hit: [
      {a: [0, 0, -1.9], b: [0, 0, 3.6], r: 1.3},
      {a: [0, 0, -4.2], b: [0, 0, -1.9], r: 0.5, own: 'tail'}
    ],
    behaviour: {role: 'hunter'}
  },
  crusher: {
    id: 'crusher',
    clade: 'slowbloods',
    size: 4,
    s: 1.15,
    coat: 'crusher',
    core: {
      kind: 'lathe',
      prof: [
        [0.02, -1.6],
        [0.55, -1.5],
        [1.05, -0.6],
        [1.22, 0.5],
        [1.18, 1.6],
        [1.05, 2.5],
        [0.9, 3.1],
        [0.8, 3.3]
      ],
      segs: 9,
      beat: [1.4, 1]
    },
    parts: [
      {kind: 'eyes', style: 'ring', z: 2.8, R: 0.98, pred: true},
      {kind: 'barbels', style: 'cone', x: 0.7, y: -0.5, z: 3.4, len: 0.7, r: 0.05, rx: HPI - 0.5, ry: 0.5},
      {kind: 'plates', rows: 3, n: 6, z0: 2.4, dz: 0.75, w: 0.55, th: 0.12, l: 0.5, spread: 0.62, yk: 0.98, rr: [1.15, 1.15, 1.15, 1.15, 0.9, 0.9]},
      {kind: 'mouth', style: 'tentacles', z: 3.25, r: 0.7, len: 0.85, n: 6, w: 0.3, segs: 2, tell: 0.12, edge: 'crush'},
      {kind: 'fins', z: 1.0, R: 1.2, h: 0.9, len: 1.2, amp: 0.3, dorsal: 0.2},
      {kind: 'tail', style: 'cyl', r0: 0.5, r1: 0.12, L: 1.1, segs: 8, z: -1.5, lz: -1.25, lh: 1.5, ll: 0.8, amp: 0.35, sp0: 0.25, spk: 0.3, body: 0}
    ],
    hit: [{a: [0, 0, -1.4], b: [0, 0, 3.6], r: 1.1}],
    behaviour: {role: 'hunter'}
  },
  // the raptor family (v11.9.1): five looks of one hingeshell body
  sickle: {
    id: 'sickle',
    clade: 'hingeshells',
    size: 5,
    s: 1,
    coat: 'sickle',
    core: {kind: 'trunk', L: 9.5, n: 8, w0: 1.5, w1: 0.6, h0: 2.0, h1: 0.8, hw: 1.8, hh: 1.8, hl: 1.9, beat: [1.6, 0.8]},
    parts: [
      {kind: 'eyes', style: 'rim'},
      {kind: 'mouth', style: 'plates', where: 'front'},
      {kind: 'comb', n: 5},
      {kind: 'tailplate', style: 'plates'},
      {kind: 'keel'},
      {kind: 'valves', style: 'small'},
      {kind: 'flaps', style: 'vertical', np: 9},
      {kind: 'weapon', style: 'spears'}
    ],
    behaviour: {role: 'hunter'}
  },
  hood: {
    id: 'hood',
    clade: 'hingeshells',
    size: 5,
    s: 1,
    coat: 'hood',
    core: {kind: 'trunk', L: 8.5, n: 7, w0: 3.0, w1: 1.2, h0: 0.9, h1: 0.5, hw: 2.6, hh: 0.9, hl: 1.8, beat: [1.6, 0.8]},
    parts: [
      {kind: 'eyes', style: 'under'},
      {kind: 'mouth', style: 'plates', where: 'under'},
      {kind: 'tailplate', style: 'spine'},
      {kind: 'legs'},
      {kind: 'valves', style: 'hood'},
      {kind: 'flaps', style: 'rear', np: 7},
      {kind: 'weapon', style: 'claws'}
    ],
    behaviour: {role: 'hunter'}
  },
  hose: {
    id: 'hose',
    clade: 'hingeshells',
    size: 1.5,
    s: 1,
    coat: 'hose',
    core: {kind: 'trunk', L: 2.4, n: 7, w0: 0.9, w1: 0.35, h0: 0.36, h1: 0.2, hw: 0.8, hh: 0.36, hl: 0.6, beat: [1.6, 0.8]},
    parts: [
      {kind: 'eyes', style: 'valve'},
      {kind: 'mouth', style: 'plates', where: 'probe'},
      {kind: 'tailplate', style: 'fan'},
      {kind: 'valves', style: 'back'},
      {kind: 'flaps', style: 'sides', np: 9},
      {kind: 'weapon', style: 'fold'}
    ],
    behaviour: {role: 'hunter'}
  },
  lash: {
    id: 'lash',
    clade: 'hingeshells',
    size: 3,
    s: 1,
    coat: 'lash',
    core: {kind: 'trunk', L: 5.5, n: 8, w0: 1.1, w1: 0.45, h0: 0.9, h1: 0.4, hw: 1.1, hh: 0.9, hl: 1.1, beat: [1.6, 0.8]},
    parts: [
      {kind: 'eyes', style: 'crown'},
      {kind: 'mouth', style: 'plates', where: 'under'},
      {kind: 'comb', n: 5},
      {kind: 'tailplate', style: 'spine'},
      {kind: 'valves', style: 'small'},
      {kind: 'flaps', style: 'sides', np: 9},
      {kind: 'weapon', style: 'whips'}
    ],
    behaviour: {role: 'hunter'}
  },
  ram: {
    id: 'ram',
    clade: 'hingeshells',
    size: 4,
    s: 1,
    coat: 'ram',
    core: {kind: 'trunk', L: 7.0, n: 6, w0: 2.4, w1: 1.0, h0: 1.6, h1: 0.7, hw: 2.8, hh: 1.5, hl: 2.2, beat: [1.6, 0.8]},
    parts: [
      {kind: 'eyes', style: 'rim'},
      {kind: 'mouth', style: 'plates', where: 'front'},
      {kind: 'comb', n: 5},
      {kind: 'tailplate', style: 'plates'},
      {kind: 'legs'},
      {kind: 'valves', style: 'back'},
      {kind: 'flaps', style: 'sides', np: 7},
      {kind: 'weapon', style: 'ram'}
    ],
    behaviour: {role: 'hunter'}
  },
  // ---------- v11.25: the species that were hand builders (IDEAS #4: every creature in the creator) ----------
  // ringmouths, coilshells: the shelled floor grazer (buildRasp)
  rasp: {
    id: 'rasp',
    clade: 'ringmouths',
    size: 0.5,
    s: 1.0,
    coat: 'rasp',
    core: {kind: 'coilbody', R: 0.24, z: 0.28, y: 0.1, sx: 1, sy: 0.8, sz: 1.3, ws: 7, hs: 5, beat: [1.6, 1]},
    parts: [
      {kind: 'shell', style: 'coil', n: 16, R0: 0.06, R1: 0.4, cy: 0.3, cz: -0.38, k: 0.36, carry: 'up'},
      {kind: 'eyes', style: 'collar', n: 8, z: 0.3, R: 0.21, r: 0.032, sy: 0.8, y0: 0.1},
      {kind: 'mouth', style: 'rasp', y: -0.1, z: 0.44, R: 0.09, h: 0.06},
      {kind: 'arms', style: 'crawl', n: 6, len: 0.5, w: 0.06, segs: 3, ks: 60, damp: 9, cosMax: 0.45, plan: 'crawl', z0: 0.34, y0: -0.08, taper: 0.78, h: 0.8, col: 'flesh', s0: -0.15, s1: -0.15, a0: 0.06, a1: 0.06, sw: 0.3}
    ],
    hit: [
      {a: [0, 0.35, -0.42], b: [0, 0.55, -0.42], r: 0.38},
      {a: [0, 0.05, 0.0], b: [0, 0.05, 0.45], r: 0.2}
    ],
    behaviour: {role: 'graze', floor: true}
  },
  // ringmouths, crawlers: the floor ambush (buildLurker) — the arm fan forward in two tiers, the mantle tucked behind
  lurker: {
    id: 'lurker',
    clade: 'ringmouths',
    size: 2.4,
    s: 1.6,
    coat: 'lurker',
    core: {kind: 'coilbody', R: 1.0, z: -0.7, y: 0.6, sx: 1.15, sy: 0.8, sz: 1.3, breathe: 0.04, bf: 1.3, beat: [0.9, 0]},
    parts: [
      {kind: 'ridge', w: 0.2, h: 0.2, len: 1.8, y: 1.3, z: -0.8},
      {kind: 'eyes', style: 'collar', n: 8, z: 0.3, R: 0.95, r: 0.11, sy: 0.6, y0: 0.6},
      {kind: 'eyes', style: 'cluster', n: 3, y: 0.95, z: 0.35, R: 0.36, r: 0.15},
      {kind: 'mouth', style: 'beak', y: 0.2, z: 0.5, R: 0.28},
      {kind: 'arms', style: 'crawl', n: 8, len: 4.0, w: 0.34, segs: 5, curve: 0, ks: 45, damp: 8, cosMax: 0.45, plan: 'fan', z0: 0.3, y0: 0.12, taper: 0.78, h: 0.8, col: 'top', shade: true, s0: 0, s1: 0.5, a0: 0.04, a1: 0, k0: 1.2, k1: 1.8, sw: 0.15}
    ],
    hit: [{a: [0, 0.6, -1.0], b: [0, 0.6, -0.3], r: 0.95}],
    behaviour: {role: 'ambush', floor: true}
  },
  // ringmouths, crawlers: the curious omnivore (buildWatcher) — walks on four arms, four held up, a raised head that looks about
  watcher: {
    id: 'watcher',
    clade: 'ringmouths',
    size: 1.8,
    s: 1.0,
    coat: 'watcher',
    core: {kind: 'coilbody', R: 0.72, z: -0.55, y: 0.35, sx: 1.0, sy: 0.85, sz: 1.55, beat: [1.3, 1]},
    parts: [
      {kind: 'ridge', w: 0.18, h: 0.16, len: 1.8, y: 0.95, z: -0.55},
      {kind: 'eyes', style: 'collar', n: 8, z: 0.4, R: 0.6, r: 0.06, sy: 0.85, y0: 0.35},
      {kind: 'head', style: 'turret', y: 0.85, z: 0.5, R: 0.5, sy: 0.9, n: 5, er: 0.17, ex: 0.56, ey: 0.24, ez: 0.8},
      {kind: 'mouth', style: 'beak', y: 0.1, z: 0.45, R: 0.14},
      {kind: 'arms', style: 'crawl', n: 4, len: 2.2, w: 0.2, segs: 5, ks: 45, damp: 8, cosMax: 0.45, plan: 'equal', phase: 0.5, z0: 0.35, y0: 0.1, taper: 0.8, h: 0.85, col: 'top', shade: true, s0: -0.32, s1: -0.32, a0: 0.06, a1: 0.06, sw: 0.25},
      {kind: 'arms', style: 'raise', n: 4, len: 2.0, w: 0.16, segs: 5, ks: 40, damp: 8, cosMax: 0.45, plan: 'raise', z0: 0.35, y0: 0.45, taper: 0.78, h: 0.85, col: 'top', shade: true, s0: 0.8, a0: 0.2, wob: 0.1, wf: 0.9, f0: 0.7, sw: 0.15}
    ],
    hit: [{a: [0, 0.35, -1.2], b: [0, 0.6, 0.5], r: 0.65}],
    behaviour: {role: 'watch', floor: true}
  },
  // ringmouths, the deep line: the dark's resident (buildPall) — black, eight arms webbed into a net held open, twelve pale eyes
  pall: {
    id: 'pall',
    clade: 'ringmouths',
    size: 9,
    s: 1.8,
    coat: 'pall',
    core: {kind: 'sac', R: 1.0, sy: 0.95, sz: 1.9, z: -1.1, ws: 9, hs: 7, cR: 1.05, cy: -0.05, cz: 1.1, csy: 0.9, csz: 0.75, beat: [0.5, 0]},
    parts: [
      {kind: 'ridge', w: 0.22, h: 0.22, len: 2.6, y: 0.95, z: -1.0},
      {kind: 'eyes', style: 'collar', n: 12, z: 1.3, R: 0.95, r: 0.16, sy: 0.9, y0: 0},
      {kind: 'mouth', style: 'beak', y: -0.1, z: 1.6, R: 0.3},
      {kind: 'arms', style: 'net', n: 8, z: 1.8, R: 0.5, len: 5.0, w: 0.34, segs: 5, curve: 0.12, ks: 30, damp: 7, cosMax: 0.4, plan: 'equal', col: 'top', shade: true, soft: false, web: true, wsp: 0.8, s0: 0.8, s1: 0.15, a0: 0.05, wob: 0.06, wf: 0.5, f0: 0.5}
    ],
    hit: [{a: [0, 0, -3.0], b: [0, 0, 1.8], r: 1.0}],
    behaviour: {role: 'wander'}
  },
  // ringmouths, the deep line: the big filter feeder (buildVeil) — no forward eyes, a collar of twelve, twenty-two arms webbed into a funnel
  veil: {
    id: 'veil',
    clade: 'ringmouths',
    size: 16,
    s: 1.4,
    coat: 'veil',
    core: {
      kind: 'sac',
      shape: 'lathe',
      prof: [
        [0.02, -6.2],
        [1.5, -4.8],
        [2.7, -1.8],
        [3.0, 1.2],
        [2.7, 3.8],
        [2.3, 4.9],
        [0.02, 5.3]
      ],
      segs: 10,
      cR: 2.75,
      cy: 0,
      cz: 4.6,
      csy: 0.9,
      csz: 0.6,
      cws: 10,
      chs: 7,
      beat: [0.8, 0]
    },
    parts: [
      {kind: 'ridge', w: 0.5, h: 0.5, len: 7, y: 2.75, z: 0.4},
      {kind: 'eyes', style: 'collar', n: 12, z: 5.3, R: 2.45, r: 0.28, sy: 0.82, y0: 0},
      {kind: 'mouth', style: 'beak', y: -0.2, z: 5.5, R: 1.0},
      {kind: 'skirt', z: -4.2, R: 3.0, h: 3.6, len: 3.2, f0: 0.7, f1: 0, amp: 0.2, k0: 1, sk: 0},
      {kind: 'arms', style: 'net', n: 22, z: 5.6, R: 2.1, len: 7, w: 0.16, segs: 3, curve: 0.2, ks: 20, damp: 6, cosMax: 0.3, plan: 'equal', col: 'belly', soft: true, web: true, wsp: 0.55, s0: 0.55, s1: 0.55, jet: false, a0: 0.1, wob: 0.05, wf: 0.4, f0: 0.8}
    ],
    hit: [{a: [0, 0, -4.6], b: [0, 0, 4.6], r: 2.8}],
    behaviour: {role: 'wander'}
  },
  // slowbloods, longbacks: the structure hunter (buildEel) — the body is one chain, the head its root
  eel: {
    id: 'eel',
    clade: 'slowbloods',
    size: 4,
    s: 1,
    coat: 'eel',
    core: {kind: 'chain', n: 11, L: 0.68, w0: 0.16, w1: 0.5, hl: 0.7, fin: true, fh: 0.8, lobes: 2.6, ll: 0.7, amp: 0.3, sp0: 0.25, spk: 0.3, kph: 0.75, ks: 130, damp: 12, cosMax: 0.72, beat: [2.2, 0.8]},
    parts: [
      {kind: 'eyes', style: 'ring', z: 0.5, R: 0.4092, pred: true},
      {kind: 'mouth', style: 'tentacles', z: 0.7, r: 0.28, len: 0.45, n: 6, w: 0.1, segs: 2, edge: 'cut'}
    ],
    hit: [{a: [0, 0, 0], b: [0, 0, 0.75], r: 0.36}],
    behaviour: {role: 'hunter'}
  },
  // slowbloods, platebacks: the torpid floor ambush (buildStone) — a plated lump the colour of its floor, eight thick mouth tentacles
  stone: {
    id: 'stone',
    clade: 'slowbloods',
    size: 3,
    s: 1.0,
    coat: 'stone',
    core: {
      kind: 'lathe',
      prof: [
        [0.02, -2.6],
        [0.9, -2.5],
        [1.65, -1.6],
        [2.0, -0.4],
        [1.95, 0.9],
        [1.75, 1.7],
        [1.5, 2.1],
        [1.3, 2.25]
      ],
      segs: 10,
      sz: 0.52,
      y: -0.05,
      beat: [1.5, 0.9]
    },
    parts: [
      {kind: 'plates', rows: 3, n: 5, z0: 1.7, dz: 0.9, th: 0.1, l: 0.75, spread: 0.4675, yk: 0.5, wk: 0.35, rr: [1.4754, 1.8554, 1.9486, 1.8, 1.3311]},
      {kind: 'eyes', style: 'ring', z: 1.0, R: 1.5},
      {kind: 'barbels', style: 'cone', x: 0.55, y: -0.85, z: 2.25, len: 0.45, r: 0.05, rx: 1.2708, ry: 0.4},
      {kind: 'mouth', style: 'tentacles', z: 1.15, r: 0.8, len: 0.75, n: 8, w: 0.3, segs: 2, tell: 0.06},
      {kind: 'tail', style: 'stub'}
    ],
    hit: [{a: [0, -0.1, -2.2], b: [0, -0.1, 2.2], r: 1.0}],
    behaviour: {role: 'trap', floor: true}
  },
  // hingeshells, walkers: the floor grazer that walks on land (buildScuttler)
  scuttle: {
    id: 'scuttle',
    clade: 'hingeshells',
    size: 0.7,
    s: 1.0,
    coat: 'scuttle',
    core: {kind: 'shield', R: 0.5, sx: 1, sy: 0.45, sz: 1.4, y: 0.22, z: 0.02, ws: 7, hs: 4, hw: 0.62, hh: 0.16, hl: 0.42, hy: 0.2, hz: 0.68, tw: 0.4, th: 0.14, tl: 0.3, ty: 0.16, tz: -0.8, beat: [4, 4]},
    parts: [
      {kind: 'eyes', style: 'arc', n: 5, x: 0.3, r: 0.18, y: 0.3, z: 0.7, arc: 51.6, size: 0.04, snap: false},
      {kind: 'eyes', style: 'stalks', n: 1, x: 0.16, y: 0.27, z: 0.62, len: 0.14, size: 0.04, tilt: 21.8, splay: 21.8, thick: 0.45, snap: false},
      {kind: 'comb', y: 0.08, z: 0.86, n: 5, w: 0.42, len: 0.2},
      {kind: 'mouth', style: 'plates', where: 'under', y: 0.05, z: 0.5, R: 0.13, snap: false},
      {kind: 'valves', style: 'placed', z0: 0.52, z1: -0.62, w: 1.02, y: 0.36, th: 0.1, o0: 0.04, o1: 0.2, tc: 0},
      {kind: 'legs', style: 'rock', n: 3, x: 0.42, y: 0.14, z: 0.35, dz: -0.35, ll: 0.55, wl: 0.07, th: 0.06, splay: 31.5, yaw: 8.6, amp: 0.3, k0: 0.2, sk: 0.6}
    ],
    hit: [{a: [0, 0.24, -0.9], b: [0, 0.24, 0.6], r: 0.32}],
    behaviour: {role: 'graze', floor: true}
  },
  // hingeshells, walkers: the floor ambush (buildTrap) — buried to the eyestalks under its valves; the raptorial fold unfolds on the strike
  trap: {
    id: 'trap',
    clade: 'hingeshells',
    size: 2,
    s: 1.0,
    coat: 'trap',
    core: {kind: 'trunk', L: 2.7, n: 6, z0: 1.0, y: -0.38, w0: 1.7, w1: 1.15, h0: 0.6, h1: 0.46, hw: 1.55, hh: 0.55, hl: 0.75, hy: -0.32, hz: -0.075, tw: 1.0, th: 0.34, tl: 0.5, ty: -0.42, tz: 0.05, beat: [1.6, 0.8]},
    parts: [
      {kind: 'legs', style: 'placed', n: 4, x: 0.65, y: -0.5, z: 0.35, dz: -0.5, kx: 0.4, ky: 0.05, kz: 0, fx: 0.7, fy: -0.2, fz: 0.06, wl: 0.09},
      {kind: 'comb', y: -0.22, z: 1.68, n: 5, w: 0.9, len: 0.36},
      {kind: 'mouth', style: 'plates', where: 'front', y: -0.36, z: 1.68, R: 0.2, snap: false},
      {kind: 'valves', style: 'placed', z0: 1.3, z1: -1.85, w: 1.8, y: -0.06, th: 0.07, o0: 0, o1: 0, tc: 0, tk: 0.3, sk: 0.15},
      {kind: 'eyes', style: 'stalks', n: 1, x: 0.38, y: -0.55, z: 1.35, len: 0.75, size: 0.14, tilt: 0, splay: 0, thick: 0.64, rise: 0.35, snap: false},
      {kind: 'weapon', style: 'fold', x: 0.48, y: -0.3, z: 1.55, len: 1.58, w: 1.08, pitch: 0, yaw: 0}
    ],
    hit: [{a: [0, -0.35, -1.9], b: [0, -0.35, 1.5], r: 0.6}],
    behaviour: {role: 'trap', floor: true}
  },
  // hingeshells, walkers: the structure hunter (buildHook) — six long hooked legs, eight eyes in two rows; hangs under what it climbs
  hook: {
    id: 'hook',
    clade: 'hingeshells',
    size: 2.5,
    s: 1.0,
    coat: 'hook',
    core: {kind: 'trunk', L: 3.5, n: 7, z0: 1.6, w0: 0.44, w1: 0.32, h0: 0.48, h1: 0.3, hw: 0.58, hh: 0.52, hl: 0.62, hy: 0.02, hz: 0.04, beat: [1.6, 0.8]},
    parts: [
      {kind: 'eyes', style: 'rows', n: 4, rows: 2, x: 0.21, y: 0.17, z: 2.25, dy: -0.17, dz: 0.02, size: 0.065, size2: 0.05, snap: false},
      {kind: 'spines', n: 3, r: 0.06, h: 0.3, z0: -1.95, dz: -0.1, y0: 0.3, dy: 0, rx: -1.1708, x: 0, col: 'joint', style: 'thorns'},
      {kind: 'comb', y: -0.12, z: 2.26, n: 4, w: 0.4, len: 0.26},
      {kind: 'mouth', style: 'plates', where: 'front', y: -0.16, z: 2.28, R: 0.11, snap: false},
      {kind: 'valves', style: 'placed', z0: 1.45, z1: -1.6, w: 0.95, y: 0.26, th: 0.05, o0: 0.2, o1: 0, tc: 1},
      {kind: 'legs', style: 'hang', n: 3, x: 0.3, y: 0.12, z: 1.35, dz: -1.3, kx: 1.5, ky: 0.95, kz: 0, kzk: 0.12, fx: 2.3, fy: 2.3, fz: 0, fzk: 0.05, wl: 0.11, hook: 0.35, wob: 0.06, swing: 0.35, drop: 1.7}
    ],
    hit: [{a: [0, 0, -1.8], b: [0, 0, 2.1], r: 0.32}],
    behaviour: {role: 'ambush'}
  },
  // hingeshells, walkers: the scavenger at the rim of the dark (buildPicker) — eight legs longer than the body, a proboscis that pecks
  picker: {
    id: 'picker',
    clade: 'hingeshells',
    size: 1.5,
    s: 1.0,
    coat: 'picker',
    core: {kind: 'trunk', L: 0.88, n: 4, z0: 0.43, w0: 0.16, w1: 0.16, h0: 0.14, h1: 0.14, hw: 0.15, hh: 0.15, hl: 0.16, hy: 0.11, hz: -0.07, beat: [2, 1]},
    parts: [
      {kind: 'eyes', style: 'rows', n: 2, rows: 1, x: 0.05, y: 0.21, z: 0.44, size: 0.03, snap: false},
      {kind: 'spines', n: 1, r: 0.05, h: 0.18, z0: -0.55, dz: 0, y0: 0.02, dy: 0, rx: -1.5708, x: 0, style: 'thorns'},
      {kind: 'comb', y: 0.06, z: 0.52, n: 3, w: 0.18, len: 0.14},
      {kind: 'mouth', style: 'peck', y: -0.02, z: 0.5, len: 0.55, r: 0.055, dip: 0.45, pk: 0.9, wob: 0.05},
      {kind: 'valves', style: 'placed', z0: 0.42, z1: -0.42, w: 0.5, y: 0.08, th: 0.03, o0: 0.55, o1: 0, tc: 0},
      {kind: 'legs', style: 'walk', n: 4, x: 0.3, y: 0, z: 0.32, dz: -0.22, kx: 0.85, ky: 0.55, kz: 0, fx: 1.45, fy: -0.525, fz: 0, fan: 0.4, kf: 1.3, ff: 2.2, wl: 0.05, root: 0.62, amp: 0.22, k0: 0.1, sk: 0.8}
    ],
    hit: [{a: [0, 0, -0.5], b: [0, 0, 0.5], r: 0.2}],
    behaviour: {role: 'graze', floor: true}
  },
  // hingeshells, paddlers: the small forage (buildFlicker) — a swimming bean inside translucent valves; the abdomen snaps under on the escape
  flicker: {
    id: 'flicker',
    clade: 'hingeshells',
    size: 0.4,
    s: 1.0,
    coat: 'flicker',
    mat: 'glass',
    core: {kind: 'bean', R: 0.12, sx: 0.7, sy: 0.9, sz: 1.5, y: -0.02, z: 0.05, ws: 7, hs: 5, gut: true, gw: 0.03, gl: 0.34, gy: 0.06, beat: [5, 0.3]},
    parts: [
      {kind: 'eyes', style: 'stalks', n: 1, x: 0.05, y: 0.04, z: 0.28, len: 0.09, size: 0.028, tilt: 73.3, splay: 59, thick: 0.43, sc: 'top', snap: false},
      {kind: 'comb', y: 0.02, z: 0.28, n: 3, w: 0.06, len: 0.09},
      {kind: 'legs', style: 'swim', n: 4, x: 0.06, y: -0.16, z: 0.16, dz: -0.08, ll: 0.15, wl: 0.016, th: 0.02, splay: 22.9},
      {kind: 'valves', style: 'clam', R: 0.2, sx: 0.5, sy: 0.85, sz: 1.5, y: 0.14, ox: 0.085, oy: -0.15, o0: 0.16, o1: 0, tc: 0, sc: 1},
      {kind: 'tailplate', style: 'abdomen', n: 3, w0: 0.14, dw: 0.03, seg: 0.12, curl: 0.12, y: -0.02, z: -0.28, amp: 0.1, flick: 1.4},
      {kind: 'mouth', style: 'slit', y: -0.1, z: 0.18, R: 0.02, h: 0.012}
    ],
    hit: [{a: [0, 0, -0.4], b: [0, 0, 0.3], r: 0.14}],
    behaviour: {role: 'boid'}
  },
  // hingeshells, walkers: the sediment-feeding giant (buildTread) — eight arched plates, nine eyes along the shield's rim, fourteen legs
  tread: {
    id: 'tread',
    clade: 'hingeshells',
    size: 7,
    s: 1.0,
    coat: 'tread',
    core: {kind: 'arches', n: 8, z0: 5.0, L: 1.7, w0: 5.0, w1: 2.4, h0: 1.35, h1: 0.75, y: -0.35, segs: 12, alt: true, hR: 2.9, hsy: 0.42, hsz: 0.75, hy: -0.15, hz: 5.4, tR: 1.2, tsy: 0.5, tsz: 0.9, ty: -0.6, tz: -8.7, beat: [1.4, 0.6]},
    parts: [
      {kind: 'eyes', style: 'arc', n: 9, x: 2.55, r: 2.0, y: -0.05, z: 5.4, arc: 71.6, size: 0.17, snap: false},
      {kind: 'comb', style: 'teeth', n: 14, x: 1.69, y: -1.55, z: 5.2, w: 0.1, len: 1.0, stag: 0.15, rake: 14.3},
      {kind: 'mouth', style: 'plates', where: 'under', y: -1.4, z: 5.9, R: 0.35, snap: false},
      {kind: 'legs', style: 'march', n: 7, z: 3.9, dz: -1.5, kx: 1.25, ky: 0.55, fx: 1.55, floor: -2.45, inset: 0.5, wl: 0.4, amp: 0.26, k0: 0.15, sk: 0.7, lift: 0.18, step: 0.9, side: 0.45}
    ],
    hit: [{a: [0, -0.3, -8.5], b: [0, -0.3, 6.5], r: 2.2}],
    behaviour: {role: 'graze', floor: true}
  },
  // hingeshells, paddlers: the big filter feeder (buildComb) — frontal combs that sweep, a slow flap wave under raised valves, a tail fan
  comb: {
    id: 'comb',
    clade: 'hingeshells',
    size: 7,
    s: 1.0,
    coat: 'comb',
    core: {kind: 'trunk', L: 9.5, n: 9, z0: 4.5, w0: 2.5, w1: 0.9, h0: 1.15, h1: 0.45, hw: 2.4, hh: 1.1, hl: 2.0, hz: 0, nw: 1.8, nh: 0.8, nl: 1.0, ny: -0.05, nz: -0.1, beat: [0.9, 0.5]},
    parts: [
      {kind: 'eyes', style: 'stalks', n: 1, x: 0.7, y: 0.5, z: 6.2, len: 0.55, size: 0.2, tilt: 11.3, splay: 31, thick: 0.5, snap: false},
      {kind: 'mouth', style: 'plates', where: 'under', y: -0.6, z: 5.0, R: 0.6, snap: false},
      {kind: 'tailplate', style: 'fan', w: 1.8, l: 0.8, x: 0.9, dx: 0.3, y: 0.05, dy: 0.1, z: -5.3, dz: 0.55},
      {kind: 'valves', style: 'placed', z0: 4.4, z1: -4.4, w: 2.2, y: 0.55, th: 0.1, o0: 0.15, o1: 0.2, tc: 0},
      {kind: 'flaps', style: 'sides', np: 13, z0: 4.2, z1: -4.7, px: 1.0, py: -0.1, len: 2.4, w: 0.85, th: 0.08, rake: 0.3, amp: 0.4},
      {kind: 'weapon', style: 'combs', x: 0.6, y: -0.3, z: 6.9, n: 3, seg: 1.7, teeth: 7, tl: 1.3, len: 1, w: 1}
    ],
    hit: [{a: [0, 0, -5.2], b: [0, 0, 7.2], r: 1.15}],
    behaviour: {role: 'wander'}
  },
  // ---------- v11.66: the hingeshell variety pass — five forms by mechanism (PLANET roster; CLADES, the tells) ----------
  // Written as the lab exports them (dense, the person's rule for new code); every one validated and previewed headless (test/preview.js).
  // paddlers: the comb's small relative in the lit, fed water — a filter-feeding swarmer the size of a forearm, its frontal combs sweeping; tells: stalked eyes, flap rows
  sifter:{id:'sifter',clade:'hingeshells',size:0.6,s:1,coat:'sifter',core:{kind:'trunk',L:0.95,n:6,w0:0.3,w1:0.13,h0:0.24,h1:0.11,hw:0.3,hh:0.24,hl:0.3,beat:[2.6,1.3]},parts:[{kind:'eyes',style:'stalks',n:1},{kind:'mouth',style:'plates',where:'front'},{kind:'comb',n:3},{kind:'valves',style:'small'},{kind:'flaps',style:'sides',np:7,th:0.03},{kind:'weapon',style:'combs',n:3,seg:0.14,teeth:5,tl:0.1,w:0.8},{kind:'tailplate',style:'spine'}],behaviour:{role:'boid'}},
  // walkers: the seep form — the picker's cousin on the diffuse vents' mats, plated where the picker is stilted, black by the sulfide it lives in, poison by its diet (combat.js POISON); tells: mouth under
  cinder:{id:'cinder',clade:'hingeshells',size:1.2,s:1,coat:'cinder',core:{kind:'trunk',L:1.7,n:5,z0:0.75,w0:0.72,w1:0.5,h0:0.34,h1:0.24,hw:0.7,hh:0.34,hl:0.5,hz:0,beat:[2,1]},parts:[{kind:'eyes',style:'rows',n:3,rows:1,x:0.2,size:0.045},{kind:'comb',n:4},{kind:'mouth',style:'plates',where:'under'},{kind:'valves',style:'placed',th:0.06,o0:0.08,o1:0.15},{kind:'legs',style:'walk',n:4,x:0.4,y:-0.12,z:0.5,dz:-0.38,kx:0.42,ky:0.12,fx:0.7,fy:-0.42,wl:0.06,amp:0.25},{kind:'spines',n:3,r:0.05,h:0.16,z0:0.3,dz:-0.35,y0:0.2,x:0,rx:-1.3,col:'joint',style:'thorns'}],behaviour:{role:'graze',floor:true}},
  // walkers: the surf-zone walker — the scuttle's exposure ecotype (SEAFLOOR §2): a low wide shield, short paddle legs, valves twice as thick, wedged on the rock the waves strike; tells: mouth under
  wedge:{id:'wedge',clade:'hingeshells',size:0.9,s:1,coat:'wedge',core:{kind:'shield',R:0.55,sx:1.4,sy:0.28,sz:1.25,y:0.14,z:0,ws:8,hs:4,hw:0.9,hh:0.12,hl:0.42,hy:0.12,hz:0.62,tw:0.5,th:0.1,tl:0.25,ty:0.1,tz:-0.78,beat:[3.5,3]},parts:[{kind:'eyes',style:'arc',n:7,x:0.5,r:0.22,y:0.2,z:0.62,arc:60,size:0.035,snap:false},{kind:'comb',y:0.04,z:0.82,n:5,w:0.5,len:0.16},{kind:'mouth',style:'plates',where:'under',y:0.0,z:0.45,R:0.14,snap:false},{kind:'valves',style:'placed',z0:0.5,z1:-0.62,w:1.5,y:0.28,th:0.14,o0:0.03,o1:0.06,tc:1},{kind:'legs',style:'rock',n:4,x:0.62,y:0.08,z:0.38,dz:-0.26,ll:0.34,wl:0.07,th:0.06,splay:36,yaw:7,amp:0.28,k0:0.2,sk:0.6}],hit:[{a:[0,0.14,-0.75],b:[0,0.14,0.5],r:0.32}],behaviour:{role:'graze',floor:true}},
  // walkers: the flats' burrower that is not the trap — feeding combs under the front, no weapon, the mouth under, on the sand the grazers pasture; tells: stalked eyes, mouth under
  plough:{id:'plough',clade:'hingeshells',size:1.6,s:1,coat:'plough',core:{kind:'trunk',L:2.5,n:6,z0:1.05,y:-0.18,w0:1.15,w1:0.75,h0:0.48,h1:0.32,hw:1.05,hh:0.44,hl:0.6,hy:-0.18,hz:0,beat:[1.5,0.8]},parts:[{kind:'eyes',style:'stalks',n:2,x:0.28,y:0.02,z:1.25,len:0.22,size:0.06,tilt:20,splay:25,snap:false},{kind:'comb',style:'teeth',n:10,x:0.42,y:-0.46,z:1.3,w:0.03,len:0.28,stag:0.04,rake:15},{kind:'mouth',style:'plates',where:'under',y:-0.4,z:1.1,R:0.16,snap:false},{kind:'valves',style:'placed',z0:1.2,z1:-1.35,w:1.2,y:0.04,th:0.06,o0:0.05,o1:0.06,tc:1},{kind:'legs',style:'placed',n:4,x:0.55,y:-0.38,z:0.7,dz:-0.45,kx:0.32,ky:0.06,kz:0,fx:0.55,fy:-0.24,fz:0.04,wl:0.07}],hit:[{a:[0,-0.18,-1.5],b:[0,-0.18,1.2],r:0.5}],behaviour:{role:'graze',floor:true}},
  // paddlers: the sill relict (SEAFLOOR §3) — the hose's line stranded on the drowned summits as their island sank, larger, pale, its eyes small below the light and its comb large, the proboscis picking pickers off the rock; tells: stalked eyes, flap rows
  relict:{id:'relict',clade:'hingeshells',size:4,s:1,coat:'relict',core:{kind:'trunk',L:7.0,n:8,w0:1.2,w1:0.5,h0:0.9,h1:0.4,hw:1.25,hh:0.9,hl:1.3,beat:[1.0,0.5]},parts:[{kind:'eyes',style:'stalks',n:1,x:0.38,len:0.28,size:0.11,tilt:15,splay:30},{kind:'mouth',style:'plates',where:'probe',plen:1.5,R:0.2},{kind:'comb',n:7,w:1.15,len:0.75},{kind:'valves',style:'back'},{kind:'flaps',style:'sides',np:11},{kind:'tailplate',style:'spine'}],behaviour:{role:'hunter'}},
  // drifters, bells: the pulser of the lit water (buildJelly) — colourless, eight arms hung loose that part round what swims through
  jelly: {
    id: 'jelly',
    clade: 'drifters',
    size: 1.4,
    s: 1.2,
    coat: 'jelly',
    mat: 'glass',
    core: {kind: 'bell', R: 0.72, H: 0.56, segs: 8, inner: true, core: true, pulse: 0.1, sway: 0.06, beat: [1.6, 0]},
    parts: [{kind: 'arms', style: 'hang', n: 8, R: 0.42, len: 2.4, w: 0.035, segs: 4, ks: 14, damp: 5, cosMax: 0.2, phase: 0, y0: -0.06, taper: 0.9, col: 'arm', soft: true, a0: 0.08, pm: 0.5}],
    hit: [{a: [0, 0, 0], b: [0, 0, 0], r: 0.62}],
    behaviour: {role: 'drift'}
  },
  // drifters, floats: sails the surface, fishes with lines (buildSailer) — a crested float, eight 25 m lines and eight short ones
  sailer: {
    id: 'sailer',
    clade: 'drifters',
    size: 1.8,
    s: 1,
    coat: 'sailer',
    mat: 'glass',
    core: {kind: 'float', sx: 0.62, sy: 0.5, sz: 1.8, y: 0.05, crest: true, cn: 9, ch: 0.62, bodies: 18, beat: [1, 0]},
    parts: [
      {kind: 'arms', style: 'lines', n: 8, R: 0.32, len: 25, w: 0.05, segs: 14, ks: 8, damp: 4, cosMax: 0.35, phase: 0.2546, y0: -0.45, taper: 0.97, col: 'arm', soft: true, lean: 2.6, toff: 0},
      {kind: 'arms', style: 'lines', n: 8, R: 0.5, len: 2.4, w: 0.04, segs: 3, ks: 12, damp: 5, cosMax: 0.3, phase: 0.7639, y0: -0.4, taper: 0.85, col: 'arm', soft: true, lean: 1.2, toff: 1}
    ],
    hit: [{a: [0, 0.05, -1.2], b: [0, 0.05, 1.2], r: 0.58}],
    behaviour: {role: 'sail'}
  }
};
// the scale variants (v11.25): the same spec at another size in another coat, so the bestiary's l and the lab's list have them
SPECS.deepbell = Object.assign({}, SPECS.jelly, {id: 'deepbell', size: 4.5, s: 3.8, coat: 'deepbell'});
SPECS.greatsailer = Object.assign({}, SPECS.sailer, {id: 'greatsailer', size: 4.5, s: 2.5});
SPECS.glim = Object.assign({}, SPECS.darter, {id: 'glim', size: 0.55, s: 1.1, coat: 'glim'});
// a blank of each clade, for the lab's "new" (the players' proportions, the required parts)
const SPEC_BLANK = {
  ringmouths: {
    id: 'new',
    clade: 'ringmouths',
    size: 1.6,
    s: 1,
    coat: 'softP',
    core: {kind: 'mantle', L: 2.5, R: 0.6, beat: [1.8, 0.45]},
    parts: [
      {kind: 'eyes', style: 'collar', n: 8},
      {kind: 'mouth', style: 'beak'},
      {kind: 'arms', style: 'jet', len: 2.1, w: 0.21, segs: 4}
    ]
  },
  slowbloods: {
    id: 'new',
    clade: 'slowbloods',
    size: 1.8,
    s: 1,
    coat: 'finP',
    core: {kind: 'lathe', prof: FIN_PROF, segs: 8, beat: [1.5, 0.9]},
    parts: [
      {kind: 'eyes', style: 'ring', z: 1.1, R: 0.37},
      {kind: 'mouth', style: 'tentacles', z: 1.38, r: 0.22, len: 0.5, n: 6, w: 0.1, segs: 2},
      {kind: 'tail', style: 'lathe', prof: FIN_TPROF, z: -0.55, lz: -1.25, lh: 0.85, ll: 0.5}
    ]
  },
  hingeshells: {
    id: 'new',
    clade: 'hingeshells',
    size: 3,
    s: 1,
    coat: 'lash',
    core: {kind: 'trunk', L: 5.5, n: 8, w0: 1.1, w1: 0.45, h0: 0.9, h1: 0.4, hw: 1.1, hh: 0.9, hl: 1.1, beat: [1.6, 0.8]},
    parts: [
      {kind: 'eyes', style: 'rim'},
      {kind: 'mouth', style: 'plates', where: 'front'},
      {kind: 'flaps', style: 'sides', np: 9}
    ]
  },
  drifters: {
    id: 'new',
    clade: 'drifters',
    size: 1.4,
    s: 1.2,
    coat: 'jelly',
    mat: 'glass',
    core: {kind: 'bell', R: 0.72, H: 0.56, beat: [1.6, 0]},
    parts: [{kind: 'arms', style: 'hang', n: 8}]
  }
};
// ---------- save, load, export ----------
// A coat with every colour the clade's bodies read (v11.70). A palette is a species' own keys: the jetter's has no `top` and no `shell`, so
// in the lab a jetter's coat on a sac, or a shell added under it, threw in merge (a part with no colour) and the panel said "the build
// failed". The missing keys come from the clade's other coats — the blank's first, then the roster's in order (all: then any coat's, the lab's second try) — and the given ones are kept.
// Only the lab calls it, and only when a build has thrown: a key filled in ahead of need would cut short the `pal.mouth || pal.band` chains
// the kit chooses colours by, and move the roster's.
function coatFill(coat,clade,all){const pal=typeof coat==='string'?PAL[coat]:coat,out=Object.assign({},pal||{}),add=p=>{for(const k in p)if(out[k]===undefined&&Array.isArray(p[k]))out[k]=p[k].slice();};
  if(SPEC_BLANK[clade])add(PAL[SPEC_BLANK[clade].coat]);for(const id in SPECS)if(SPECS[id].clade===clade&&typeof SPECS[id].coat==='string')add(PAL[SPECS[id].coat]);if(all)add(DRY_PAL);delete out.note;return out;}
function specToJSON(spec) {
  return JSON.stringify(spec, (k, v) => (typeof v === 'number' ? +v.toFixed(4) : v));
}
function specFromJSON(txt) {
  const o = JSON.parse(txt);
  if (!o || !o.core || !o.clade) throw new Error('not a spec');
  return o;
}
function specToHash(spec) {
  return '#lab=' + btoa(unescape(encodeURIComponent(specToJSON(spec))));
}
function specFromHash(h) {
  const m = /lab=([A-Za-z0-9+/=]+)/.exec(h || '');
  return m ? specFromJSON(decodeURIComponent(escape(atob(m[1])))) : null;
}
// The three lines a species needs in creatures_defs.js (a PAL entry if the coat is inline, the DEFS entry with the stats, the ROSTER
// entry), plus the spec itself for SPECS. A placed species is still a SPAWN envelope written by hand.
function specExport(spec) {
  const st = statsOf(spec),
    id = spec.id || 'new',
    b = spec.behaviour || {},
    role = b.role === 'player' ? 'hunter' : b.role || 'wander';
  const coat = typeof spec.coat === 'string' ? spec.coat : id;
  const lines = [];
  if (typeof spec.coat !== 'string')
    lines.push('// PAL: ' + id + ':' + JSON.stringify(spec.coat, (k, v) => (typeof v === 'number' ? +v.toFixed(2) : v)));
  const d = {size: spec.size, hp: 100, role: role, cruiseF: 0.45, home: Math.round(20 + spec.size * 20)}; // v11.71: no speed, no turn — defPhysics reads them off the build
  if (role === 'hunter') {
    d.prey = ['darter'];
    d.detect = Math.round(10 + spec.size * 6);
    d.reach = st.reach;
    d.dmg = Math.round(st.mass * 3);
    d.biteCD = 1.2;
    d.cool = 3;
  }
  if (st.legs) d.legs = true;
  if (st.jet) d.jetter = true;
  lines.push('// DEFS: ' + id + ':{build:()=>compile(SPECS.' + id + ',undefined,PAL.' + coat + '),' + JSON.stringify(d).slice(1));
  lines.push("// ROSTER: {id:'" + id + "',clade:'" + spec.clade + "',family:'?',niche:'?',new:true}");
  lines.push('// SPECS: ' + id + ':' + specToJSON(spec));
  return lines.join('\n');
}
