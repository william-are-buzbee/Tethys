// lab.js — the creature lab (CREATOR.md, v11.10–11.11): a spec (creatures_spec.js) edited live, shown the way the bestiary shows a
// species — at the peak, in the game's own light and water, the arms simulated — with its derived numbers beside it. Open with #lab
// in the URL (#lab=<base64 spec> opens a saved creature), l on the menu, l in the bestiary on a species that has a spec, or l in
// play (the world waits beside you; l again puts you back).
// The panel: a nav that follows the scroll (click to jump); the species (a roster spec or a clade's blank), the core and its
// numbers, the parts (each a fold: click its name; the cursor on a part lights it on the creature; add and remove; only the
// styles the clade has), the coat (the roster's palettes, a coat drawn by chemistry — coatFor — or every key by hand), the readout
// (derive: a lock beside a stat holds a hand value over the derived one, the plausibility warnings, tris and draws) and the save
// row (the JSON to the clipboard, a paste box, the link, the export lines for creatures_defs.js). Keys as the zoo's: space for the
// action, s to cruise, r to spin or stop, drag turns (and stops the spin), wheel zooms; p places the creature in the world (a
// temporary species, DEFS.lab); l or escape back to where you came from.
// The creator (v11.47): the same panel opened from the menu's `creator` word (menu.js) with lab.player set — only the species, clades,
// cores and part styles the profile has seen are offered (save.js PROFILE.seen; labOk, labStyles) — and a `saved creatures` list in the
// save section (the profile's, with a file out and in), shown in every mode. Opening the lab at all grants the creator (grantCreator).
const labEl = document.getElementById('lab'),
  labPanel = document.getElementById('labpanel'),
  labCap = document.getElementById('labcap');
const lab = {
  spec: null,
  b: null,
  v: null,
  warn: [],
  d: null,
  yaw: 0.6,
  pitch: 0.22,
  dist: 10,
  spin: true,
  drag: null,
  act: -1,
  cruise: false,
  radius: 2,
  o: V3(0, 0, 0),
  floor: false,
  pend: false,
  placed: 0,
  from: 'menu',
  open: {},
  hi: -1,
  sec: 'species',
  player: false // the creator (v11.47): opened from the menu's `creator` word; only the species, clades, cores and part styles the profile has seen are offered (save.js PROFILE.seen, labOk)
};
function labOk(k,v){return !lab.player||seen(k,v);} // k: 'sp' | 'cl' | 'co' | 'pt'
function labStyles(kind,clade,cur){const st=stylesFor(kind,clade);return lab.player?st.filter(s=>s===cur||seen('pt',kind+':'+s)):st;} // the styles offered for a part: all of the clade's, or in the creator the seen ones (and the one it wears)
const LAB_CLADES = ['ringmouths', 'slowbloods', 'hingeshells', 'drifters'],
  LAB_SECS = ['species', 'core', 'parts', 'coat', 'readout', 'save'];
const MAT_HI = addTint(new THREE.MeshLambertMaterial({vertexColors: true, emissive: new THREE.Color(0.55, 0.32, 0.08)}), 'lam', true, undefined, undefined, 'body'); // the part under the cursor
function labClone(o) {
  return JSON.parse(JSON.stringify(o));
}
// ---------- the creature ----------
function labBuild() {
  if (lab.b) {
    scene.remove(lab.b.g);
    lab.b.g.traverse(o => {
      if (o.geometry) o.geometry.dispose();
    });
    lab.b = null;
  }
  const v = validate(lab.spec);
  lab.v = v.spec;
  lab.warn = v.warnings;
  let b;
  try {
    b = compile(lab.v, undefined, undefined, {split: true});
  } catch (e) {
    labCap.innerHTML = '<i>the build failed: ' + String(e.message).replace(/</g, '&lt;') + '</i>';
    return;
  }
  b.owner = {b: b, pos: b.g.position, grab: null, reach: 0, shapesW: null};
  const size = lab.v.size || 2,
    floor = !!(lab.v.behaviour && lab.v.behaviour.floor);
  lab.floor = floor;
  if (lab.from === 'play') {
    lab.o.y = Math.max(groundAt(lab.o.x, lab.o.z) + size * 0.4, Math.min(lab.o.y, TIDE - 1 - size * 0.4));
  } else {
    lab.o.set(0, floor ? floor0 + size * 0.35 : clamp(floor0 + 4.5 + size * 0.5, floor0 + 3, TIDE - 2 - size * 0.4), 0);
  }
  b.g.position.copy(lab.o);
  castOn(b.g);
  scene.add(b.g);
  lab.b = b;
  lab.radius = Math.max(0.6, zooRadius(b.g));
  if (lab.pend) {
    lab.dist = Math.max(4, lab.radius * 2.0 + 1.5);
    lab.pend = false;
  }
  lab.d = derive(lab.v);
  let tris = 0,
    draws = 0;
  b.g.traverse(o => {
    if (o.isMesh && o.geometry.attributes.position) {
      tris += o.geometry.attributes.position.count / 3;
      draws++;
    }
  });
  lab.d.tris = Math.round(tris);
  lab.d.draws = draws;
  if (lab.hi >= 0) labHi(lab.hi, true);
  labCaption();
  labReadout();
}
// light the part under the cursor: its meshes swap to the lit material (the arms' chains too)
function labHi(i, force) {
  if (!force && i === lab.hi) return;
  if (lab.b && lab.b.built) {
    const set = (j, m) => {
      const r = lab.b.built[j];
      if (!r || !r.meshes) return;
      for (const o of r.meshes)
        o.traverse(x => {
          if (x.isMesh && (x.material === MAT || x.material === MAT_HI)) x.material = m;
        });
    };
    if (lab.hi >= 0 && lab.hi !== i) set(lab.hi, MAT);
    if (i >= 0) set(i, MAT_HI);
  }
  lab.hi = i;
}
function labCaption() {
  const s = lab.v,
    d = lab.d;
  if (!s || !d) return;
  labCap.innerHTML =
    '<div id="labname">' +
    (s.id || 'new') +
    '</div><div id="labline">' +
    s.clade +
    ' · ' +
    d.mode +
    ' · ' +
    d.length +
    ' m long · ' +
    d.mass +
    ' t' +
    '<br>speed ' +
    d.speed +
    ' · turn ' +
    d.turn +
    ' · hp ' +
    d.hp +
    ' · ' +
    d.cost +
    ' points' +
    (d.plausible.length ? '<br><i>' + d.plausible.join(' · ') + '</i>' : '') +
    '</div>';
}
// ---------- the panel ----------
function labSel(path, opts, val, labels) {
  return (
    '<select data-path="' +
    path +
    '">' +
    opts.map((o, i) => '<option value="' + o + '"' + (o === val ? ' selected' : '') + '>' + (labels ? labels[i] : o) + '</option>').join('') +
    '</select>'
  );
}
function labNum(path, val, step, lo, hi) {
  return (
    '<input type="number" data-path="' +
    path +
    '" value="' +
    (+val).toFixed(step < 0.01 ? 3 : step < 1 ? 2 : 0) +
    '" step="' +
    step +
    '"' +
    (lo !== undefined ? ' min="' + lo + '"' : '') +
    (hi !== undefined ? ' max="' + hi + '"' : '') +
    '>'
  );
}
const LAB_UNIT = {len: 'm', z: 'm'},
  LAB_NAME = {
    n: 'count',
    z: 'z (fore–aft)',
    x: 'x (out)',
    y: 'y (up)',
    R: 'ring radius',
    r: 'radius',
    len: 'length',
    w: 'width',
    segs: 'segments',
    sz: 'stretch',
    sy: 'squash',
    pred: 'forward-facing',
    plen: 'probe length',
    feed: 'mouth parts',
    flen: 'their length',
    snap: 'snap to the body',
    tilt: 'tilt forward °',
    splay: 'splay out °',
    sweep: 'sweep back',
    size: 'eye size',
    pitch: 'pitch °',
    yaw: 'yaw °',
    np: 'flaps a side',
    dz: 'spacing',
    where: 'faces',
    carry: 'carried',
    R0: 'inner radius',
    R1: 'outer radius',
    k: 'whorl',
    turns: 'helix turns',
    ks: 'stiffness',
    damp: 'damping',
    plan: 'plan',
    idle: 'gape',
    tell: 'cock',
    kk: 'strike share',
    s0: 'spread',
    s1: 'spread, fast',
    a0: 'curl',
    a1: 'curl, fast',
    k0: 'from speed',
    k1: 'to speed',
    rows: 'rows',
    th: 'thickness',
    l: 'plate length',
    spread: 'spread',
    yk: 'height',
    rx: 'rake',
    ry: 'splay',
    h: 'height',
    z0: 'first z',
    z1: 'last z',
    ds: 'spacing',
    lz: 'lobe z',
    lh: 'lobe height',
    ll: 'lobe length',
    axis: 'axis',
    amp: 'amplitude',
    sp0: 'speed at rest',
    spk: 'speed gain',
    full: 'whole body',
    body: 'body colour',
    col: 'colour',
    belly: 'belly',
    L: 'length',
    r0: 'front radius',
    r1: 'back radius',
    w0: 'front width',
    w1: 'back width',
    h0: 'front height',
    h1: 'back height',
    hw: 'head width',
    hh: 'head height',
    hl: 'head length',
    sx: 'width',
    prof: 'profile',
    // v11.25: the migrated species' parts
    arc: 'arc °',
    rise: 'rise on the tell',
    thick: 'stalk thickness',
    sc: 'stalk colour',
    size2: 'lower row size',
    dy: 'row drop',
    dip: 'dip',
    pk: 'peck',
    wob: 'wobble',
    wf: 'wobble rate',
    f0: 'rate',
    pm: 'beat share',
    lean: 'lean per m/s',
    toff: 'phase offset',
    y0: 'height',
    taper: 'taper',
    phase: 'phase (steps)',
    shade: 'countershaded',
    soft: 'soft (no contact)',
    web: 'webbed',
    wsp: 'web spread',
    sw: 'sweep',
    jet: 'closes on the jet',
    wk: 'width over radius',
    stag: 'stagger',
    rake: 'rake °',
    dx: 'step out',
    seg: 'segment',
    curl: 'curl',
    flick: 'flick',
    dw: 'narrowing',
    wl: 'thickness',
    kx: 'knee out',
    ky: 'knee up',
    kz: 'knee fore',
    fx: 'foot out',
    fy: 'foot up',
    fz: 'foot fore',
    hook: 'hook',
    fan: 'fan',
    kf: 'knee fan',
    ff: 'foot fan',
    kzk: 'knee fan by z',
    fzk: 'foot fan by z',
    root: 'root bar',
    lift: 'lift',
    step: 'step phase',
    side: 'side phase',
    inset: 'inset',
    floor: 'the floor',
    swing: 'swing on the tell',
    drop: 'drop on the strike',
    o0: 'open at rest',
    o1: 'open by speed',
    tc: 'shut on the tell',
    tk: 'open on the tell',
    sk: 'open on the strike',
    ox: 'valve out',
    oy: 'valve down',
    teeth: 'teeth',
    tl: 'tooth length',
    er: 'eye radius',
    ex: 'eyes out',
    ey: 'eyes up',
    ez: 'eyes fore',
    nod: 'nod',
    fn: 'nod rate',
    breathe: 'breathe',
    bf: 'breath rate',
    ws: 'segments round',
    hs: 'segments up',
    shape: 'shape',
    cR: 'collar radius',
    cy: 'collar y',
    cz: 'collar z',
    csy: 'collar squash',
    csz: 'collar stretch',
    cws: 'collar segments',
    chs: 'collar rings',
    fh: 'fin height',
    lobes: 'tail lobes',
    kph: 'wave pitch',
    cosMax: 'joint limit',
    hy: 'head y',
    hz: 'head z',
    tw: 'tail width',
    ty: 'tail y',
    tz: 'tail z',
    nw: 'snout width',
    nh: 'snout height',
    nl: 'snout length',
    ny: 'snout y',
    nz: 'snout z',
    gut: 'gut line',
    gw: 'gut width',
    gl: 'gut length',
    gy: 'gut y',
    alt: 'alternate colours',
    hR: 'shield radius',
    hsy: 'shield squash',
    hsz: 'shield stretch',
    tR: 'tail knob',
    tsy: 'knob squash',
    tsz: 'knob stretch',
    H: 'height',
    inner: 'inner bell',
    core: 'core',
    pulse: 'pulse',
    sway: 'sway',
    crest: 'crest',
    cn: 'crest slabs',
    ch: 'crest height',
    bodies: 'feeding bodies'
  };
const LAB_NAME_BY = {'valves.sc': 'shut on the strike', 'weapon.tl': 'tooth length', 'weapon.w': 'width scale', 'legs.swing': 'swing on the tell', 'head.swing': 'swing', 'arms.h': 'box height', 'arms.jet': 'closes on the jet', 'mouth.h': 'thickness', 'bell.H': 'height', 'arms.y0': 'lift', 'shell.cy': 'shell y', 'shell.cz': 'shell z', 'mouth.fn': 'their count', 'mouth.pulse': 'opens on the bite', 'legs.ll': 'paddle length', 'tailplate.w0': 'root width', 'chain.w0': 'tail width'}; // where a key means another thing on another part. v11.31.4: the nine keys that were twice in LAB_NAME (the later won, so a mouth's fn read 'nod rate' and a shell's cy 'collar y') live here now, one entry each
function labSlider(path, name, q, val, ref, F, p) {
  const label = LAB_NAME_BY[(p && p.kind ? p.kind : lab.v.core.kind) + '.' + name] || LAB_NAME[name] || name;
  if (q.k === 'b')
    return '<label class="row"><span>' + label + '</span><input type="checkbox" data-path="' + path + '"' + (val ? ' checked' : '') + '></label>';
  if (q.k === 's') return '<label class="row"><span>' + label + '</span>' + labSel(path, q.opts, val) + '</label>';
  if (q.k === 'l') return '';
  const qb = bandOf(q, F, p),
    mul = q.k === 'len' || q.k === 'z' ? ref : 1,
    lo = qb.x[0] * mul,
    hi = qb.x[1] * mul,
    b0 = qb.b[0] * mul,
    b1 = qb.b[1] * mul,
    v = +val,
    step = q.k === 'n' ? 1 : (hi - lo) / 200;
  const out = v < b0 || v > b1;
  return (
    '<label class="row' +
    (out ? ' out' : '') +
    '" title="' +
    (out ? 'past the believable band ' + b0.toFixed(2) + ' – ' + b1.toFixed(2) : 'believable ' + b0.toFixed(2) + ' – ' + b1.toFixed(2)) +
    '"><span>' +
    label +
    '</span><input type="range" data-path="' +
    path +
    '" min="' +
    lo +
    '" max="' +
    hi +
    '" step="' +
    step +
    '" value="' +
    v +
    '"><b>' +
    (q.k === 'n' ? v : v.toFixed(2)) +
    (LAB_UNIT[q.k] ? '<i>' + LAB_UNIT[q.k] + '</i>' : '') +
    '</b></label>'
  );
}
function labProfile(path, prof) {
  let h = '<div class="prof">';
  prof.forEach((p, i) => {
    h +=
      '<div class="row pt"><span>' +
      i +
      '</span>r ' +
      labNum(path + '.' + i + '.0', p[0], 0.01, 0) +
      ' z ' +
      labNum(path + '.' + i + '.1', p[1], 0.01) +
      '<button data-act="delpt" data-path="' +
      path +
      '" data-i="' +
      i +
      '">×</button></div>';
  });
  return h + '<button data-act="addpt" data-path="' + path + '">+ point</button></div>';
}
// a snapped part's y (or z, for a mouth on the face) is the body's to give: the slider is hidden
function labHidden(p, k) {
  if (p.kind === 'mouth') return p.where === 'under' ? k === 'y' : k === 'z';
  if (p.kind === 'eyes') return k === 'y' && p.style !== 'crown';
  return k === 'y';
}
function labIsReq(p, gr, core) {
  const def = PARTS[p.kind];
  return !!(
    def.req ||
    gr.req.some(r => r.split(':')[0] === p.kind && (!r.split(':')[1] || r.split(':')[1] === p.style)) ||
    (core.req || []).indexOf(p.kind) >= 0
  );
}
function labPanelHTML() {
  const s = lab.v,
    d = lab.d,
    F = compileFrame(s),
    ref = F.L,
    core = CORES[s.core.kind],
    gr = GRAMMAR[s.clade];
  let h =
    '<div class="nav">' + LAB_SECS.map(k => '<a data-go="' + k + '"' + (k === lab.sec ? ' class="on"' : '') + '>' + k + '</a>').join('') + '</div>';
  h += '<div class="sec" id="lab-species"><div class="hd">species</div>';
  h +=
    '<label class="row"><span>from</span><select data-act="load"><option value="">—</option>' +
    LAB_CLADES.filter(c => labOk('cl', c)).map(c => '<option value="new:' + c + '">new ' + c.replace(/s$/, '') + '</option>').join('') +
    Object.keys(SPECS).filter(k => labOk('sp', k))
      .map(k => '<option value="' + k + '">' + k + ' (' + SPECS[k].clade + ')</option>')
      .join('') +
    '</select></label>';
  h += '<label class="row"><span>name</span><input type="text" data-path="id" value="' + (s.id || '') + '"></label>';
  h += '<label class="row"><span>clade</span><span class="v">' + s.clade + '</span></label>';
  h += '<label class="row"><span>half-length</span>' + labNum('size', s.size, 0.1, 0.1, 30) + '<b>m</b></label>';
  h += '<label class="row"><span>scale</span>' + labNum('s', s.s || 1, 0.05, 0.1, 10) + '</label>';
  h += '<label class="row"><span>depth</span>' + labNum('depth', s.depth !== undefined ? s.depth : -30, 5, -800, 0) + '<b>m</b></label>';
  h +=
    '<label class="row"><span>on the floor</span><input type="checkbox" data-path="behaviour.floor"' +
    (s.behaviour && s.behaviour.floor ? ' checked' : '') +
    '></label>';
  h +=
    '<label class="row"><span>spin</span><input type="checkbox" data-act="spin"' +
    (lab.spin ? ' checked' : '') +
    '><i class="dim">r</i></label></div>';
  // the core
  h +=
    '<div class="sec" id="lab-core"><div class="hd">core</div><label class="row"><span>kind</span>' +
    labSel('core.kind', gr.cores.filter(c => c === s.core.kind || labOk('co', c)), s.core.kind) +
    '</label>';
  for (const k in core.params) h += labSlider('core.' + k, k, core.params[k], s.core[k], ref, F, s.core);
  h +=
    '<label class="row"><span>beat</span>' +
    labNum('core.beat.0', (s.core.beat || [1.5, 0.9])[0], 0.1, 0.1, 12) +
    ' + ' +
    labNum('core.beat.1', (s.core.beat || [1.5, 0.9])[1], 0.05, 0, 4) +
    '<b>× spd</b></label>';
  if (s.core.kind === 'lathe' || (s.core.kind === 'sac' && s.core.shape === 'lathe' && s.core.prof))
    h += '<div class="hd2">profile, tail to nose [r, z]</div>' + labProfile('core.prof', s.core.prof);
  h += '</div>';
  // the parts: a fold each; only the clade's styles
  h += '<div class="sec" id="lab-parts"><div class="hd">parts <span class="v">' + d.cost + ' points</span></div>';
  s.parts.forEach((p, i) => {
    const def = PARTS[p.kind];
    if (!def) return;
    const req = labIsReq(p, gr, core),
      styles = labStyles(p.kind, s.clade, p.style),
      open = lab.open[i] !== false;
    h +=
      '<div class="part' +
      (open ? ' open' : '') +
      '" data-part="' +
      i +
      '"><div class="ph" data-act="fold" data-i="' +
      i +
      '"><span>' +
      (open ? '▾' : '▸') +
      ' ' +
      p.kind +
      '</span>' +
      (styles.length > 1 ? labSel('parts.' + i + '.style', styles, p.style) : '<i>' + p.style + '</i>') +
      (req ? '<i>required</i>' : '<button data-act="del" data-i="' + i + '" title="remove">×</button>') +
      '</div>';
    if (open) {
      h += '<div class="pb">';
      for (const k of paramsFor(p.kind, p.style)) {
        if (k === 'prof' || k === 'pairs' || k === 'rr') continue;
        if (p.snap && labHidden(p, k)) continue;
        h += labSlider('parts.' + i + '.' + k, k, def.params[k], p[k], ref, F, p);
      }
      if (p.prof) h += '<div class="hd2">profile</div>' + labProfile('parts.' + i + '.prof', p.prof);
      h += '</div>';
    }
    h += '</div>';
  });
  const kinds = Object.keys(PARTS).filter(k => PARTS[k].clades.indexOf(s.clade) >= 0 && (labStyles(k, s.clade).length > 0 || (!stylesFor(k, s.clade).length && labOk('pt', k + ':'))));
  h +=
    '<label class="row"><span>add</span><select data-act="add"><option value="">—</option>' +
    kinds.map(k => '<option value="' + k + '">' + k + ' (' + labStyles(k, s.clade).join(', ') + ')</option>').join('') +
    '</select></label></div>';
  // the coat
  const pal = typeof s.coat === 'string' ? PAL[s.coat] : s.coat,
    palKeys = Object.keys(PAL).filter(k => Array.isArray(PAL[k].top || PAL[k].mantle || PAL[k].shell || PAL[k].bell || PAL[k].float));
  h +=
    '<div class="sec" id="lab-coat"><div class="hd">coat</div><label class="row"><span>palette</span><select data-act="coat"><option value="">by hand</option>' +
    palKeys.map(k => '<option value="' + k + '"' + (s.coat === k ? ' selected' : '') + '>' + k + '</option>').join('') +
    '</select></label>';
  h +=
    '<label class="row"><span>drawn at</span>' +
    labNum('_depth', lab.coatDepth !== undefined ? lab.coatDepth : s.depth !== undefined ? s.depth : -30, 10, -800, 0) +
    '<b>m</b></label>';
  h +=
    '<label class="row"><span>diet</span><select data-act="diet">' +
    Object.keys(COAT_DIET)
      .map(k => '<option value="' + k + '"' + (lab.diet === k ? ' selected' : '') + '>' + k + '</option>')
      .join('') +
    '</select><button data-act="draw">draw a coat</button></label>';
  { // the texel pattern (v11.41, PIXEL.md pass B): by clade unless the spec says; drawn in pixel mode only; custom (painted cell by cell) is pass D
    const pt=Object.assign({kind:PATTERN_BY_CLADE[s.clade]||'none'},PATTERN_DEF,s.pattern||{});
    h+='<label class="row"><span>pattern</span>'+labSel('pattern.kind',PATTERNS,pt.kind)+'</label><label class="row"><span>period</span>'+labNum('pattern.scale',pt.scale,1,1,12)+'<b>cells</b></label><label class="row"><span>tone</span>'+labNum('pattern.tone',pt.tone,0.02,0,0.5)+'</label>';
    if(!FX.texels)h+='<div class="note">the pattern draws with texels on (e)</div>';
  }
  if (pal && pal.note) h += '<div class="note">' + pal.note + '</div>';
  if (pal) {
    h += '<div class="swatches">';
    for (const k in pal) {
      const c = pal[k];
      if (!Array.isArray(c)) continue;
      const hex = '#' + [0, 1, 2].map(i => ('0' + Math.round(clamp(c[i], 0, 1) * 255).toString(16)).slice(-2)).join('');
      h += '<label class="sw"><input type="color" data-coat="' + k + '" value="' + hex + '"><span>' + k + '</span></label>';
    }
    h += '</div>';
  }
  h += '</div>';
  // the readout
  const st = s.stats || {};
  h += '<div class="sec" id="lab-readout"><div class="hd">readout</div>';
  for (const k of ['speed', 'accel', 'turn', 'hp', 'mass'])
    h +=
      '<label class="row"><span>' +
      k +
      '</span><span class="v">' +
      d[k] +
      '</span><input type="checkbox" data-lock="' +
      k +
      '"' +
      (st[k] !== undefined && st[k] !== null ? ' checked' : '') +
      ' title="hold a hand value">' +
      (st[k] !== undefined && st[k] !== null ? labNum('stats.' + k, st[k], k === 'hp' ? 1 : 0.1) : '') +
      '</label>';
  h +=
    '<div class="note">' +
    d.mode +
    ', ' +
    d.buoyancy +
    ' · ' +
    d.length +
    ' m · reach ' +
    d.reach +
    ' · thrust ' +
    d.thrust +
    ' / drag ' +
    d.drag +
    '<br>' +
    d.tris +
    ' tris, ' +
    d.draws +
    ' draws</div>';
  if (d.plausible.length) h += '<div class="warn">' + d.plausible.join('<br>') + '</div>';
  if (lab.warn.length) h += '<div class="warn dim">' + lab.warn.join('<br>') + '</div>';
  h += '</div>';
  // save
  h +=
    '<div class="sec" id="lab-save"><div class="hd">save</div><div class="row btns"><button data-act="copy">copy json</button><button data-act="link">link</button><button data-act="export">export</button><button data-act="drop">place in the world</button></div>';
  // the saved creatures (v11.47): the profile's, by name (save.js PROFILE.creatures); a file out and in for keeping them off the browser
  const cr = Object.keys(PROFILE.creatures).sort();
  h += '<div class="hd2">saved creatures</div><div class="row btns"><button data-act="csave">save as ' + escH(s.id || 'new') + '</button><button data-act="cexport">export file</button><button data-act="cimport">import file</button></div>';
  h += cr.map(k => '<div class="row"><span class="v" data-act="cload" data-id="' + escH(k) + '" title="load">' + escH(k) + '</span><button data-act="cdel" data-id="' + escH(k) + '" title="delete">×</button></div>').join('');
  h += '<textarea data-act="paste" placeholder="paste a spec or export lines here"></textarea><div class="note" id="labmsg"></div></div>';
  return h;
}
function labRender() {
  const sc = labPanel.scrollTop || 0;
  labPanel.innerHTML = labPanelHTML();
  labPanel.scrollTop = sc;
}
function labReadout() {
  // the readout and the caption refresh without rebuilding the panel (a slider drag keeps its focus)
  const el = labPanel.querySelectorAll ? labPanel.querySelectorAll('.sec') : [];
  if (!el.length) return;
  const tmp = document.createElement('div');
  if (!tmp.querySelectorAll) return;
  tmp.innerHTML = labPanelHTML();
  const secs = tmp.querySelectorAll('.sec');
  if (secs[4] && el[4]) el[4].innerHTML = secs[4].innerHTML;
  const hd = el[2] && el[2].querySelector ? el[2].querySelector('.hd .v') : null;
  if (hd) hd.textContent = lab.d.cost + ' points';
}
// the nav follows the scroll
function labScroll() {
  if (!labPanel.querySelectorAll) return;
  const y = labPanel.scrollTop + 60;
  let cur = LAB_SECS[0];
  for (const k of LAB_SECS) {
    const el = document.getElementById('lab-' + k);
    if (el && el.offsetTop <= y) cur = k;
  }
  if (cur !== lab.sec) {
    lab.sec = cur;
    for (const a of labPanel.querySelectorAll('.nav a')) a.classList.toggle('on', a.dataset.go === cur);
  }
}
// set a value at a dotted path in the working spec
function labSet(path, val) {
  const ks = path.split('.');
  let o = lab.spec;
  for (let i = 0; i < ks.length - 1; i++) {
    const k = ks[i];
    if (o[k] === undefined) o[k] = isNaN(+ks[i + 1]) ? {} : [];
    o = o[k];
  }
  o[ks[ks.length - 1]] = val;
}
function labGet(path) {
  const ks = path.split('.');
  let o = lab.spec;
  for (const k of ks) {
    if (o === undefined) return undefined;
    o = o[k];
  }
  return o;
}
let labT = null;
function labRebuildSoon(rerender) {
  if (labT) return;
  labT = setTimeout(() => {
    labT = null;
    labBuild();
    if (rerender) labRender();
  }, 0);
}
function labMsg(m) {
  const el = document.getElementById('labmsg');
  if (el) el.textContent = m;
}
function labLoad(spec) {
  lab.spec = labClone(spec);
  if (!lab.spec.core.beat) lab.spec.core.beat = [1.5, 0.9];
  lab.pend = true;
  lab.open = {};
  lab.hi = -1;
  labBuild();
  labRender();
  if (lab.v)
    try {
      location.hash = labHash();
    } catch (e) {}
}
// The spec in the address bar, keeping the tier the person asked for (v11.31.4: `location.hash = specToHash(...)` ate a forced
// #low, so a reload or a shared link came back on high). scene.js reads the flags in any order, separated by &.
function labHash() {
  return '#' + (HASH_TIER ? HASH_TIER + '&' : '') + specToHash(lab.v).slice(1);
}
function labOnInput(e) {
  const t = e.target;
  if (!t) return;
  const path = t.dataset && t.dataset.path;
  if (t.dataset && t.dataset.coat) {
    // a colour by hand: the coat becomes inline
    let pal = lab.spec.coat;
    if (typeof pal === 'string' || !pal) pal = lab.spec.coat = labClone(PAL[pal] || PAL.softP);
    const hex = t.value;
    pal[t.dataset.coat] = [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];
    labRebuildSoon(false);
    return;
  }
  if (t.dataset && t.dataset.act === 'spin') {
    lab.spin = t.checked;
    return;
  }
  if (!path) return;
  let v;
  if (t.type === 'checkbox') v = t.checked;
  else if (t.type === 'range' || t.type === 'number') v = +t.value;
  else v = t.value;
  if (path === '_depth') {
    lab.coatDepth = v;
    return;
  }
  if (typeof v === 'number' && isNaN(v)) return; // a number field mid-edit ('-', '1e') is NaN: it would go into the spec, and a NaN in a build reaches the uniforms (v11.31.4; only stats.* was guarded)
  labSet(path, v);
  const b = t.parentNode && t.parentNode.querySelector ? t.parentNode.querySelector('b') : null;
  if (b && t.type === 'range') {
    const u = b.querySelector ? b.querySelector('i') : null;
    b.textContent = t.step === '1' ? v : (+v).toFixed(2);
    if (u) b.appendChild(u);
  }
  // a style or kind change reshapes the row set; a value change only rebuilds the creature
  const structural = path === 'core.kind' || /\.style$/.test(path) || t.tagName === 'SELECT' || /\.snap$/.test(path) || /\.where$/.test(path);
  if (path === 'core.kind') {
    const c = lab.spec.core;
    lab.spec.core = {kind: v, beat: c.beat};
    if (v === 'lathe') {
      lab.spec.core.prof = FIN_PROF.map(p => p.slice());
    }
    if (v === 'chain') lab.spec.core.beat = [2.2, 0.8];
    if (v === 'bell') lab.spec.core.beat = [1.6, 0];
  }
  if (path === 'core.shape' && v === 'lathe' && !lab.spec.core.prof) lab.spec.core.prof = SPECS.veil.core.prof.map(p => [p[0] * 0.3, p[1] * 0.3]); // a sac drawn as a lathe: start from the veil's profile at a third
  const ms = /^parts\.(\d+)\.(style|where)$/.exec(path);
  if (ms) {
    const p = lab.spec.parts[+ms[1]],
      keep = ms[2] === 'where' ? ['where', 'feed', 'fn', 'flen', 'snap'] : paramsFor(p.kind, v);
    for (const k in p) if (k !== 'kind' && k !== 'style' && k !== 'mirror' && keep.indexOf(k) < 0) delete p[k];
  }
  labRebuildSoon(structural);
}
function labOnChange(e) {
  const t = e.target;
  if (t.dataset && t.dataset.lock !== undefined) {
    const k = t.dataset.lock;
    if (!lab.spec.stats) lab.spec.stats = {};
    lab.spec.stats[k] = t.checked ? lab.d[k] : null;
    labRebuildSoon(true);
  }
}
function labOnClick(e) {
  let t = e.target;
  while (t && t !== labPanel && !(t.dataset && (t.dataset.act || t.dataset.go))) t = t.parentNode;
  if (!t || t === labPanel) return;
  const act = t.dataset.act;
  if (t.dataset.go) {
    const el = document.getElementById('lab-' + t.dataset.go);
    if (el && el.scrollIntoView) el.scrollIntoView({behavior: 'smooth', block: 'start'});
    return;
  }
  if (act === 'fold') {
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON') return;
    const i = +t.dataset.i;
    lab.open[i] = lab.open[i] === false;
    labRender();
  } else if (act === 'del') {
    const i = +t.dataset.i;
    lab.spec.parts.splice(i, 1);
    lab.hi = -1;
    const o = {};
    for (const k in lab.open) {
      const j = +k;
      if (j < i) o[j] = lab.open[k];
      else if (j > i) o[j - 1] = lab.open[k];
    }
    lab.open = o;
    labRebuildSoon(true);
  } else if (act === 'delpt') {
    const pr = labGet(t.dataset.path);
    if (pr.length > 3) pr.splice(+t.dataset.i, 1);
    labRebuildSoon(true);
  } else if (act === 'addpt') {
    const pr = labGet(t.dataset.path),
      a = pr[pr.length - 2],
      b = pr[pr.length - 1];
    pr.splice(pr.length - 1, 0, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
    labRebuildSoon(true);
  } else if (act === 'draw') {
    const depth = lab.coatDepth !== undefined ? lab.coatDepth : lab.spec.depth !== undefined ? lab.spec.depth : -30;
    lab.spec.coat = coatFor(lab.spec.clade, depth, lab.diet || 'hunter', mulberry(Math.floor(Math.random() * 1e6)));
    labRebuildSoon(true);
  } else if (act === 'copy') {
    const txt = specToJSON(lab.v);
    labClip(txt);
    labMsg('copied the spec (' + txt.length + ' chars)');
  } else if (act === 'link') {
    const h = labHash();
    location.hash = h;
    labClip(location.href.split('#')[0] + h);
    labMsg('the link is in the address bar and the clipboard');
  } else if (act === 'export') {
    const ta = labPanel.querySelector ? labPanel.querySelector('textarea') : null;
    const txt = specExport(lab.v);
    if (ta) ta.value = txt;
    labClip(txt);
    labMsg('the export lines are in the box and the clipboard');
  } else if (act === 'drop') labDrop();
  else if (act === 'csave') {
    const id = String(lab.v.id || 'new').trim().slice(0, 40) || 'new';
    PROFILE.creatures[id] = specToJSON(lab.v);
    profileSave();
    labRender();
    labMsg('saved ' + id);
  } else if (act === 'cload') {
    const j = PROFILE.creatures[t.dataset.id];
    if (!j) return;
    try {
      labLoad(specFromJSON(j));
      labMsg('loaded ' + t.dataset.id);
    } catch (err) {
      labMsg('not a spec: ' + err.message);
    }
  } else if (act === 'cdel') {
    delete PROFILE.creatures[t.dataset.id];
    profileSave();
    labRender();
  } else if (act === 'cexport') fileSave('creatures.tethys.json', JSON.stringify({kind: 'creatures', creatures: PROFILE.creatures}));
  else if (act === 'cimport')
    filePick(txt => {
      let n = 0;
      try {
        const o = JSON.parse(txt),
          cs = o && o.kind === 'creatures' && o.creatures && typeof o.creatures === 'object' ? o.creatures : null;
        if (!cs) throw new Error('not a creatures file');
        for (const k in cs) {
          if (typeof cs[k] !== 'string') continue;
          specFromJSON(cs[k]); // parses, or throws: nothing that is not a spec goes in
          PROFILE.creatures[String(k).slice(0, 40)] = cs[k];
          n++;
        }
        profileSave();
        labRender();
        labMsg('imported ' + n);
      } catch (err) {
        labMsg('not a creatures file: ' + err.message);
      }
    });
}
function labClip(txt) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt);
  } catch (e) {}
}
function labOnSelect(e) {
  const t = e.target;
  if (!t.dataset) return;
  if (t.dataset.act === 'load') {
    const v = t.value;
    if (!v) return;
    if (v.indexOf('new:') === 0) labLoad(SPEC_BLANK[v.slice(4)]);
    else labLoad(SPECS[v]);
  } else if (t.dataset.act === 'add') {
    const k = t.value;
    if (!k) return;
    const st = labStyles(k, lab.spec.clade)[0];
    const p = {kind: k};
    if (st) p.style = st;
    lab.spec.parts.push(p);
    lab.open[lab.spec.parts.length - 1] = true;
    labRebuildSoon(true);
  } else if (t.dataset.act === 'coat') {
    if (t.value) lab.spec.coat = t.value;
    labRebuildSoon(true);
  } else if (t.dataset.act === 'diet') {
    lab.diet = t.value;
  }
}
function labOnPaste(e) {
  const t = e.target;
  if (!t.dataset || t.dataset.act !== 'paste') return;
  setTimeout(() => {
    const txt = t.value.trim();
    if (!txt) return;
    try {
      const m = /SPECS:\s*(\{[\s\S]*\})\s*$/.exec(txt);
      labLoad(specFromJSON(m ? m[1] : txt));
      labMsg('loaded');
      t.value = '';
    } catch (err) {
      labMsg('not a spec: ' + err.message);
    }
  }, 0);
}
function labOnOver(e) {
  let t = e.target;
  while (t && t !== labPanel && !(t.dataset && t.dataset.part !== undefined)) t = t.parentNode;
  labHi(t && t !== labPanel ? +t.dataset.part : -1);
}
// ---------- the world ----------
// p: the creature as a temporary species in DEFS (lab) with its derived stats, spawned near the peak — or, in play, ahead of the player.
function labDrop() {
  const s = lab.v;
  if (!s) return;
  const st = statsOf(s),
    b = s.behaviour || {},
    role = b.role === 'player' ? 'hunter' : b.role || 'wander';
  const spec = labClone(s),
    inPlay = mode === 'play' || lab.from === 'play';
  DEFS.lab = {
    build: () => compile(spec),
    size: s.size,
    speed: st.speed,
    accel: st.accel,
    hp: st.hp,
    role: role,
    turn: st.turn,
    cruiseF: 0.45,
    home: 20 + s.size * 10,
    prey: ['darter', 'flicker'],
    detect: 10 + s.size * 5,
    reach: st.reach,
    dmg: Math.round(st.mass * 3) + 2,
    biteCD: 1.2,
    cool: 3,
    legs: st.legs,
    jetter: st.jet,
    floor: !!b.floor
  };
  const p = inPlay
    ? V3(0, 0, 1)
        .applyQuaternion(player.g.quaternion)
        .multiplyScalar(6 + s.size * 2)
        .add(player.pos)
    : V3(2, floor0 + 4 + s.size * 0.5, -6);
  p.y = Math.max(p.y, groundAt(p.x, p.z) + s.size * 0.4);
  const ch = chunkAt(p.x, p.z);
  if (!ch) {
    labMsg('no cell there yet');
    return;
  }
  const c = spawn(ch, 'lab', p, mulberry(lab.placed++));
  c.home.copy(p);
  labMsg(inPlay ? 'placed ahead of you' : 'placed at the peak: pick a clade to meet it');
}
// ---------- enter, leave, frame ----------
function labEnter(spec, asPlayer) {
  if (mode !== 'menu' && mode !== 'zoo' && mode !== 'play') return;
  if (mode === 'zoo') zooLeave();
  lab.from = mode;
  mode = 'lab';
  lab.player = !!asPlayer; // the creator (menu.js): gated to what has been seen
  grantCreator(); // the lab used once is the creator used (v11.47): the menu shows the word from here
  labEl.classList.add('on');
  lab.pend = true;
  if (lab.from === 'play') {
    try {
      if (document.exitPointerLock) document.exitPointerLock();
    } catch (e) {}
    const size = (spec || lab.spec || SPECS.soft).size || 2;
    lab.o.copy(
      V3(0, 0, 1)
        .applyQuaternion(player.g.quaternion)
        .multiplyScalar(5 + size * 2.5)
        .add(player.pos)
    );
    lab.yaw = player.yaw + Math.PI * 0.75;
  } else {
    menuPage('none');
    player.pos.set(0, dispY, 0); // the cells stream round player.pos: the peak, where the creature is shown (v11.47.2: the menu's camera may be anywhere)
  }
  hintEl.textContent = isTouch
    ? 'drag to turn'
    : 'space for the action, s to cruise, r to spin, drag to turn, wheel to close in, p to place it in the world, l to go back';
  hintEl.style.opacity = 1;
  labLoad(spec || lab.spec || SPECS.soft);
}
function labLeave() {
  if (mode !== 'lab') return;
  mode = lab.from === 'play' ? 'play' : 'menu';
  labEl.classList.remove('on');
  hintEl.style.opacity = 0;
  if (lab.b) {
    scene.remove(lab.b.g);
    lab.b.g.traverse(o => {
      if (o.geometry) o.geometry.dispose();
    });
    lab.b = null;
  }
  lab.player = false;
  if (mode === 'menu') {
    menuPage('main');
    layoutMenu();
  } else {
    hintEl.textContent = 'click to look again; l for the lab';
    hintEl.style.opacity = 1;
    setTimeout(() => {
      hintEl.style.opacity = 0;
    }, 4000);
  }
}
function updateLab(dt) {
  if (mode !== 'lab' || !lab.b) return;
  const b = lab.b;
  if (lab.act >= 0) {
    lab.act += dt;
    if (lab.act > 2.2) lab.act = -1;
  }
  const a = lab.act,
    st = {};
  if (a >= 0) {
    st.tell = a < 0.6 ? smooth(0, 0.6, a) : a < 1.4 ? 1 : 1 - smooth(1.4, 2.1, a);
    st.strike = a < 0.75 ? 0 : a < 0.9 ? smooth(0.75, 0.9, a) : a < 1.4 ? 1 : 1 - smooth(1.4, 2.1, a);
    st.jet = st.strike > 0.5;
    st.pulse = st.strike * 0.6;
    st.withdrawn = st.strike > 0.5;
  }
  const spd = (lab.cruise ? 1.2 : 0.3) + 2.5 * (st.strike || 0);
  b.anim(t, spd, st);
  b.g.updateMatrix();
  worldShapes(b.owner);
  stepRigs(b.owner, null, dt);
  if (lab.spin && !lab.drag) lab.yaw += 0.18 * dt;
  const cp = Math.cos(lab.pitch),
    sp = Math.sin(lab.pitch),
    o = lab.o,
    cy = o.y + (lab.floor ? lab.radius * 0.25 : 0);
  let x = o.x + Math.sin(lab.yaw) * cp * lab.dist,
    y = cy + sp * lab.dist,
    z = o.z + Math.cos(lab.yaw) * cp * lab.dist;
  y = clamp(y, groundAt(x, z) + 1.2, TIDE - 1.0);
  camera.position.set(x, y, z);
  camera.lookAt(o.x, cy, o.z);
}
labPanel.addEventListener('input', labOnInput);
labPanel.addEventListener('change', e => {
  labOnChange(e);
  labOnSelect(e);
});
labPanel.addEventListener('click', labOnClick);
labPanel.addEventListener('paste', labOnPaste);
labPanel.addEventListener('mouseover', labOnOver);
labPanel.addEventListener('mouseleave', () => labHi(-1));
labPanel.addEventListener('focusin', labOnOver);
labPanel.addEventListener('scroll', labScroll, {passive: true});
labPanel.addEventListener('keydown', e => {
  e.stopPropagation();
});
labPanel.addEventListener('keyup', e => {
  e.stopPropagation();
});
labPanel.addEventListener(
  'wheel',
  e => {
    e.stopPropagation();
  },
  {passive: true}
);
addEventListener('keydown', e => {
  if (mode === 'menu' && e.code === 'KeyL') {
    labEnter();
    return;
  }
  if (mode === 'zoo' && e.code === 'KeyL') {
    const r = ROSTER[zoo.i];
    if (SPECS[r.id]) labEnter(SPECS[r.id]);
    return;
  }
  if (mode === 'play' && e.code === 'KeyL' && !player.dead) {
    labEnter();
    return;
  }
  if (mode === 'play' && e.code === 'KeyP' && lab.v) {
    labDrop();
    return;
  }
  if (mode !== 'lab') return;
  if (e.code === 'KeyL' || e.code === 'Escape') labLeave();
  else if (e.code === 'Space') {
    e.preventDefault();
    if (lab.b) lab.act = 0;
  } else if (e.code === 'KeyS') lab.cruise = !lab.cruise;
  else if (e.code === 'KeyR') {
    lab.spin = !lab.spin;
    const c = labPanel.querySelector ? labPanel.querySelector('[data-act=spin]') : null;
    if (c) c.checked = lab.spin;
  } else if (e.code === 'KeyP') labDrop();
});
canvas.addEventListener('mousedown', e => {
  if (mode !== 'lab' || e.button !== 0) return;
  lab.drag = {moved: 0};
});
addEventListener('mousemove', e => {
  if (mode !== 'lab' || !lab.drag) return;
  const dx = e.movementX || 0,
    dy = e.movementY || 0;
  lab.drag.moved += Math.abs(dx) + Math.abs(dy);
  lab.yaw -= dx * 0.006;
  lab.pitch = clamp(lab.pitch + dy * 0.004, -0.3, 1.2);
  if (lab.drag.moved > 4) lab.spin = false;
});
addEventListener('mouseup', () => {
  if (mode !== 'lab' || !lab.drag) return;
  if (lab.drag.moved < 4 && lab.b) lab.act = 0;
  else {
    const c = labPanel.querySelector ? labPanel.querySelector('[data-act=spin]') : null;
    if (c) c.checked = lab.spin;
  }
  lab.drag = null;
});
addEventListener(
  'wheel',
  e => {
    if (mode !== 'lab') return;
    lab.dist = clamp(lab.dist * (e.deltaY > 0 ? 1.1 : 0.9), Math.max(2, lab.radius * 0.6), Math.max(12, lab.radius * 6));
  },
  {passive: true}
);
if (HASH_FLAGS.some(f => f === 'lab' || f.indexOf('lab=') === 0)) {
  let sp = null;
  try {
    sp = specFromHash(location.hash);
  } catch (e) {}
  labEnter(sp || undefined);
}
