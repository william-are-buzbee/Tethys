// creatures_builders.js — how each creature is put together from primitives (all face +z)
// Each builder returns {g, anim(t,spd,state), hit, rigs}: hit is the body as capsules {a,b,r} in the unscaled frame (what
// other bodies and arms collide with: physics.js); rigs are the simulated chains (arms, tails, tentacles), built by
// armRing/makeRig, posed by anim (ringPose/tailPose) and stepped by physics.js after the body has moved.
// ---------- palettes ----------
const PAL={
  softP:{mantle:[0.36,0.52,0.50],belly:[0.64,0.74,0.70],ridge:[0.26,0.40,0.40],arm:[0.42,0.56,0.53],mouth:[0.05,0.06,0.07],eye:[0.80,0.84,0.76],pupil:[0.04,0.04,0.05]},
  finP:{top:[0.17,0.30,0.35],belly:[0.78,0.82,0.80],mouth:[0.06,0.04,0.04],band:[0.30,0.14,0.10],plate:[0.14,0.24,0.28],eye:[0.06,0.06,0.07]},
  coilP:{shell:[0.90,0.82,0.66],band:[0.62,0.30,0.20],flesh:[0.42,0.56,0.54],belly:[0.62,0.72,0.68],mouth:[0.05,0.06,0.07],eye:[0.80,0.84,0.76],pupil:[0.04,0.04,0.05]},
  arrow:{mantle:[0.46,0.60,0.60],belly:[0.72,0.80,0.76],ridge:[0.34,0.48,0.48],arm:[0.52,0.64,0.62],mouth:[0.05,0.06,0.07],eye:[0.82,0.86,0.80],pupil:[0.04,0.04,0.05]},
  darter:{top:[0.20,0.30,0.42],belly:[0.75,0.80,0.82],mouth:[0.06,0.04,0.04],band:[0.28,0.14,0.10],eye:[0.05,0.05,0.06]},
  grazer:{top:[0.42,0.40,0.33],belly:[0.72,0.70,0.62],mouth:[0.06,0.04,0.04],band:[0.30,0.16,0.10],plate:[0.34,0.32,0.26],eye:[0.06,0.05,0.05]},
  veil:{top:[0.22,0.28,0.30],belly:[0.42,0.50,0.50],web:[0.30,0.38,0.40],ridge:[0.16,0.22,0.24],mouth:[0.04,0.05,0.06],eye:[0.72,0.76,0.70]},
  great:{shell:[0.36,0.40,0.26],band:[0.18,0.17,0.12],flesh:[0.28,0.38,0.36],belly:[0.40,0.48,0.46],mouth:[0.04,0.05,0.06],eye:[0.76,0.80,0.72],pupil:[0.04,0.04,0.05]},
  ridge:{top:[0.11,0.15,0.19],belly:[0.45,0.50,0.48],mouth:[0.06,0.04,0.04],band:[0.32,0.13,0.09],plate:[0.09,0.12,0.15],eye:[0.04,0.04,0.05]},
  ortho:{shell:[0.86,0.83,0.72],band:[0.30,0.26,0.24],flesh:[0.32,0.46,0.44],belly:[0.46,0.58,0.55],mouth:[0.04,0.05,0.06],eye:[0.80,0.84,0.76],pupil:[0.04,0.04,0.05]},
  eel:{top:[0.20,0.28,0.14],belly:[0.55,0.60,0.40],fin:[0.32,0.42,0.18],mouth:[0.06,0.04,0.04],band:[0.30,0.15,0.09],eye:[0.05,0.05,0.04]},
  lurker:{top:[0.34,0.38,0.40],belly:[0.5,0.52,0.52],ridge:[0.26,0.30,0.32],mouth:[0.05,0.06,0.07],eye:[0.80,0.84,0.76],pupil:[0.04,0.04,0.05]},
  abyss:{top:[0.05,0.06,0.09],belly:[0.22,0.25,0.28],mouth:[0.06,0.04,0.04],band:[0.24,0.10,0.08],plate:[0.04,0.05,0.07],eye:[0.02,0.02,0.03]},
  glim:{top:[0.62,0.72,0.72],belly:[0.84,0.88,0.86],mouth:[0.06,0.04,0.04],band:[0.30,0.15,0.10],eye:[0.06,0.06,0.07]},
  scuttle:{top:[0.44,0.31,0.22],belly:[0.62,0.52,0.40],leg:[0.36,0.26,0.18],joint:[0.74,0.66,0.44],eye:[0.08,0.08,0.08]},
  // by blood (PLANET): ringmouths copper (grey-green, teal; a pale iris and a black pupil), slowbloods iron (rust, red-brown; a
  // silver-grey eye), hingeshells pale (yellow-green joints, the machine look; black beads). No eye is bright: nothing glows
  // (v11.8, the person: eyeshine is a reflection and there is no light to reflect down there)
  rasp:{shell:[0.90,0.84,0.70],band:[0.60,0.36,0.24],flesh:[0.40,0.54,0.52],mouth:[0.12,0.11,0.10],eye:[0.10,0.11,0.13]},
  watcher:{top:[0.26,0.50,0.48],belly:[0.56,0.70,0.66],ridge:[0.20,0.40,0.40],mouth:[0.05,0.06,0.07],eye:[0.82,0.86,0.78],pupil:[0.04,0.04,0.05]},
  pall:{top:[0.05,0.06,0.07],belly:[0.10,0.12,0.13],web:[0.11,0.13,0.14],mouth:[0.03,0.03,0.04],eye:[0.78,0.80,0.74]},
  needle:{top:[0.40,0.28,0.20],belly:[0.82,0.78,0.68],mouth:[0.06,0.04,0.04],band:[0.30,0.13,0.09],plate:[0.34,0.24,0.17],eye:[0.05,0.05,0.05]},
  basker:{top:[0.09,0.08,0.08],belly:[0.30,0.24,0.20],rust:[0.52,0.22,0.10],mouth:[0.06,0.04,0.04],band:[0.38,0.14,0.08],plate:[0.16,0.12,0.11],eye:[0.03,0.03,0.03]},
  stone:{top:[0.14,0.13,0.12],belly:[0.28,0.26,0.24],plate:[0.26,0.25,0.22],band:[0.30,0.14,0.10],jaw:[0.22,0.20,0.18],eye:[0.05,0.05,0.05]},
  crusher:{top:[0.36,0.20,0.14],belly:[0.66,0.56,0.46],plate:[0.50,0.30,0.20],mouth:[0.06,0.04,0.04],band:[0.30,0.12,0.08],jaw:[0.80,0.78,0.70],eye:[0.05,0.04,0.04]},
  trap:{top:[0.56,0.24,0.14],belly:[0.72,0.50,0.36],joint:[0.82,0.74,0.42],claw:[0.24,0.12,0.08],eye:[0.06,0.06,0.06]},
  hook:{top:[0.22,0.20,0.16],belly:[0.34,0.32,0.26],joint:[0.82,0.80,0.62],eye:[0.05,0.05,0.05]},
  tread:{top:[0.36,0.36,0.28],rim:[0.48,0.46,0.34],belly:[0.56,0.52,0.42],leg:[0.42,0.40,0.30],joint:[0.66,0.64,0.46],eye:[0.10,0.10,0.10]},
  picker:{top:[0.68,0.68,0.58],joint:[0.86,0.86,0.72],eye:[0.10,0.10,0.10]},
  flicker:{top:[0.84,0.86,0.78],belly:[0.84,0.86,0.78],joint:[0.84,0.86,0.78],gut:[0.50,0.44,0.34],eye:[0.04,0.04,0.04]},
  hose:{top:[0.62,0.66,0.52],belly:[0.80,0.82,0.70],flap:[0.55,0.62,0.50],joint:[0.82,0.78,0.42],claw:[0.24,0.22,0.16],eye:[0.06,0.06,0.06]},
  sickle:{top:[0.16,0.15,0.13],belly:[0.34,0.32,0.26],flap:[0.28,0.26,0.20],joint:[0.78,0.70,0.30],eye:[0.06,0.06,0.06]},
  hood:{top:[0.20,0.22,0.18],belly:[0.40,0.42,0.34],flap:[0.30,0.32,0.26],joint:[0.80,0.78,0.48],claw:[0.12,0.12,0.10],eye:[0.05,0.05,0.05]},
  lash:{top:[0.30,0.26,0.20],belly:[0.52,0.48,0.38],flap:[0.42,0.38,0.30],joint:[0.84,0.80,0.52],eye:[0.05,0.05,0.05]},
  ram:{top:[0.26,0.24,0.20],belly:[0.46,0.44,0.36],flap:[0.36,0.34,0.28],joint:[0.78,0.74,0.46],eye:[0.05,0.05,0.05]},
  comb:{top:[0.74,0.72,0.62],belly:[0.86,0.84,0.76],flap:[0.62,0.60,0.50],joint:[0.80,0.76,0.50],comb:[0.52,0.50,0.40],eye:[0.08,0.08,0.08]},
  // v11.66, the variety pass: presets the place's chemistry shifts (creatures_spec.js coatChem) — the sifter's a filter feeder's straw, the
  // cinder's the sulfide black it always lives in, the wedge's the rust of the surf's rock, the plough's the sand's, the relict's the pale of a life below the light
  sifter:{top:[0.70,0.68,0.54],belly:[0.84,0.82,0.70],flap:[0.60,0.58,0.46],joint:[0.80,0.76,0.48],comb:[0.56,0.52,0.40],eye:[0.06,0.06,0.06]},
  cinder:{top:[0.12,0.11,0.11],belly:[0.24,0.22,0.20],leg:[0.10,0.10,0.10],joint:[0.50,0.48,0.36],eye:[0.05,0.05,0.05]},
  wedge:{top:[0.32,0.20,0.15],belly:[0.52,0.42,0.34],leg:[0.24,0.16,0.12],joint:[0.66,0.58,0.40],eye:[0.06,0.06,0.06]},
  plough:{top:[0.56,0.50,0.40],belly:[0.72,0.66,0.54],leg:[0.46,0.40,0.30],joint:[0.78,0.72,0.50],eye:[0.06,0.06,0.06]},
  relict:{top:[0.78,0.76,0.70],belly:[0.86,0.84,0.78],flap:[0.70,0.70,0.64],joint:[0.80,0.76,0.60],eye:[0.06,0.06,0.06]},
  // the drifters (DRIFTERS.md; v11.25 palettes, the builders' fixed colours as keys): the bell colourless in the lit water, dark red
  // below the light (red is the first colour the water eats); the float blue-violet, sunscreen at the surface; the lines the float's
  jelly:{bell:[0.86,0.92,0.96],core:[0.78,0.86,0.94],arm:[0.86,0.92,0.96]},
  deepbell:{bell:[0.42,0.07,0.1],core:[0.3,0.05,0.08],arm:[0.42,0.07,0.1]},
  sailer:{float:[0.6,0.64,0.94],crest:[0.9,0.62,0.84],body:[0.56,0.42,0.76],line:[0.52,0.56,0.92],arm:[0.52,0.56,0.92]}
};
// Palette variants (v11.8): quick colour swaps of a built palette, for looking at the roster in other coats in the bestiary
// (zoo.js: up/down) and the preview tool (PALV=k). Nothing in the world uses them. Eyes, pupils, glow, mouths and claws are
// left alone (the read of intent survives the coat); joints and bellies stay the pale keys. Every swap is in HSL.
const PAL_FIXED={eye:1,pupil:1,glow:1,mouth:1,claw:1,gut:1},PAL_PALE={belly:1,joint:1,jaw:1};
function rgb2hsl(c){const r=c[0],g=c[1],b=c[2],mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;if(mx===mn)return [0,0,l];const d=mx-mn,s=l>0.5?d/(2-mx-mn):d/(mx+mn);let h=mx===r?((g-b)/d+(g<b?6:0)):mx===g?((b-r)/d+2):((r-g)/d+4);return [h*60,s,l];}
function hsl2rgb(h,s,l){h=((h%360)+360)%360;const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;let r,g,b;if(h<60){r=c;g=x;b=0;}else if(h<120){r=x;g=c;b=0;}else if(h<180){r=0;g=c;b=x;}else if(h<240){r=0;g=x;b=c;}else if(h<300){r=x;g=0;b=c;}else{r=c;g=0;b=x;}return [r+m,g+m,b+m];}
// the variants: [name, f(hsl, key, clade) -> hsl]. The blood variant pulls every hue to the clade's pigment (PLANET, Cross-clade
// rules: copper teal-grey, iron rust, vanadium straw); the other swaps are blind.
const PAL_VARIANTS=[
  ['as built',null],
  ['hue +35',(c)=>[c[0]+35,c[1],c[2]]],
  ['hue -35',(c)=>[c[0]-35,c[1],c[2]]],
  ['complement',(c)=>[c[0]+165,c[1],c[2]]],
  ['blood',(c,k,cl)=>{const t=cl==='ringmouths'?[172,0.32]:cl==='slowbloods'?[14,0.55]:cl==='hingeshells'?[58,0.30]:[c[0],c[1]];return [lerp(c[0],t[0],0.85),lerp(c[1],t[1],0.7),PAL_PALE[k]?Math.max(c[2],0.62):c[2]];}],
  ['dark water',(c,k)=>[c[0],Math.min(1,c[1]+0.12),PAL_PALE[k]?c[2]*0.8:c[2]*0.5]],
  ['bleached',(c)=>[c[0],c[1]*0.4,lerp(c[2],0.84,0.6)]],
  ['hard countershade',(c,k)=>[c[0],c[1],PAL_PALE[k]?lerp(c[2],0.9,0.6):c[2]*0.55]]
];
function palVariant(pal,k,clade){
  const v=PAL_VARIANTS[((k%PAL_VARIANTS.length)+PAL_VARIANTS.length)%PAL_VARIANTS.length];if(!v[1])return pal;
  const out={};for(const key in pal){const c=pal[key];if(PAL_FIXED[key]||!Array.isArray(c)){out[key]=c;continue;}const h=v[1](rgb2hsl(c),key,clade);out[key]=hsl2rgb(h[0],clamp(h[1],0,1),clamp(h[2],0.02,0.97));}
  return out;
}
// which PAL entry a roster id builds with, where the two names differ
const PAL_OF={soft:'softP',fin:'finP',coil:'coilP',abyssal:'abyss',greatsailer:'sailer'};
function palKey(id){return PAL_OF[id]===undefined?id:PAL_OF[id];}

// ---------- creature builders (all face +z) ----------
// ---------- ringmouths (CLADES, v11.8: the ring kept open and told apart) ----------
// The clade's kit: no head (the mantle runs straight into the ring); a collar of small eyes round the mantle's rim on every one;
// predators add a forward cluster of three or five pupiled eyes on a knuckle at the top of the ring (eyeCluster); the mouth shows as
// a dark ring with a beak at the ring's centre; the eight arms are differentiated 2-4-2 (PLAN242: two long grasp arms at the top,
// four short stiff oars held out at the sides, two short keel arms fused-looking under the siphon); the jetters carry a three-lobed
// skirt at the tail (the ring's relic) instead of paired fins, and a gladius ridge down the back. Copper blood: teal-grey, never pink.
const PLAN242=[{phi:-0.55,len:1.35,w:0.95},{phi:0.55,len:1.35,w:0.95},{phi:-1.3,len:0.5,w:1.7,sp:0.7},{phi:1.3,len:0.5,w:1.7,sp:0.7},
  {phi:-2.05,len:0.5,w:1.7,sp:0.7},{phi:2.05,len:0.5,w:1.7,sp:0.7},{phi:-2.9,len:0.5,w:1.4,sp:-0.15},{phi:2.9,len:0.5,w:1.4,sp:-0.15}];
// the mouth ring and beak at (0,y,z), radius R, facing +z
function ringMouth(P,pal,y,z,R){P.push(part(G.cyl(R,R*1.15,R*0.7,8,true),0,y,z,pal.mouth,{r:[HPI,0,0]}));P.push(part(G.cone(R*0.38,R*0.9,4),0,y,z+R*0.35,pal.mouth,{r:[HPI,0,0]}));}
// the three-lobed skirt at z (one up, two down and out), lobes of height h and length L on a body of radius R; returns the meshes
function skirtTrio(g,pal,z,R,h,L){const lobes=[];for(let i=0;i<3;i++){const G3=new THREE.Group();G3.position.set(0,0,z);G3.rotation.z=i*TAU/3;g.add(G3);const m=new THREE.Mesh(merge([part(G.box(R*0.14,h,L),0,R*0.45+h/2,0,pal.mantle||pal.top,{c2:pal.belly})]),MAT);G3.add(m);lobes.push(m);}return lobes;}
// The coiled shell of the coilshells: a log spiral of N spheres from R0 to R1 (1.75 turns), banded, spined on the outer whorl if
// asked. Parts pushed to S. Three carries: the Earth read (the yz plane round (cy,cz), the aperture at the mantle: a nautilus); flat
// (v11.8: the xz plane at height cy, a wheel carried level — the person: "sitting flatside on top of the animal"); up (v11.8.2, the
// person's fix: the same wheel stood on its edge, the yz plane, the outer whorl ending forward at height cy and curling up and back
// over the mantle — read from the side, edge-on to the water). The outer whorl ends at the front in both of the new carries.
function coilShell(S,pal,o){
  const N=o.n||22,R0=o.R0||0.12,R1=o.R1||1.0,thMax=1.75*TAU,b=Math.log(R1/R0)/thMax,cy=o.cy!==undefined?o.cy:1.0,cz=o.cz!==undefined?o.cz:-0.4,k=o.k||0.38,flat=!!o.flat;
  for(let i=0;i<=N;i++){
    const th=thMax*i/N,R=R0*Math.exp(b*th),rr=0.08*R1+k*R;
    let x=0,y,z,nx,ny,nz;
    if(flat){const a=th-thMax;x=R*Math.sin(a);z=cz+R*Math.cos(a);y=cy;nx=Math.sin(a);ny=0;nz=Math.cos(a);}
    else if(o.up){const a=th-thMax;z=cz+R*Math.cos(a);y=cy-R*Math.sin(a);nx=0;ny=-Math.sin(a);nz=Math.cos(a);}
    else{z=cz+R*Math.cos(th);y=cy+R*Math.sin(th);nx=0;ny=Math.sin(th);nz=Math.cos(th);}
    S.push(part(G.sph(rr,7,5),x,y,z,i%2?pal.band:pal.shell,{s:flat?[1,0.78,1]:[1.2,1,1]}));
    if(o.spines&&i>N*0.45&&i%2===0)S.push(part(G.cone(rr*0.4,rr*1.6,4),x+nx*rr*1.1,y+ny*rr*1.1,z+nz*rr*1.1,pal.band,{dir:V3(nx,ny,nz)}));
  }
}
// ---------- slowbloods (CLADES, v11.8.4: the ring fused into a point) ----------
// The clade's kit: the ancestral ring of arms kept as a ring of short stiff mouth tentacles closing to a point (st.strike, the
// player's pulse open them; never on their own — v11.8.5, the head must not move by
// itself); the eye ring survives as a ring of small dark eyes round the head, and predators carry two of them forward on lobes of
// the head's flesh, a big binocular pair (v11.8.7: no band); the mouth is rectangular flaps (v11.8.6: 'roof' — top
// 'pair' top and bottom, 'sides' one each side, 'trident' sides and a triangle below, 'square' four), blocky, small, once tentacles;
// the flaps ride the body mesh so they sway with it (v11.8.7); the
// ring's relic in the fins: three at 120° (one dorsal, two ventro-lateral) and a three-lobed tail; chevron rows of small plates
// down the back (scratchy chitin, PLANET); collar vents behind the band. No white teeth: the bite is the petals' inner edges.
// The petal snout at z (the hinge ring, radius r) reaching len forward; n petals; teeth: 'needle' (ridges), 'plate' (a thick inner
// plate: the crusher's vice), 'rake' (the grazer's comb), none. Returns {g, open(k)}: k 0 shut, 1 wide.
function mouthArms(g,pal,z,r,len,n,w,segs,capG){ // capG: where the cap goes (the spec's body frame, so it sways with the hull; the rig stays in g)
  // the mouth: n short stiff tentacles on a ring of radius r at z, converging to a point len ahead at rest (the ring's curve carries
  // each tip to the axis), blooming on the bite. The same chain rig as a ringmouth's arms, stiffer; ringPose every frame from open().
  const rig=armRing(g,n,z,r,len,w,pal.top,segs,-r/len,{ks:150,damp:14,cosMax:0.85,c2:pal.belly,taper:0.68,phase:0.5});for(const c of rig.chains)c.mouth=true; // mouth (v11.92): physics.js draws these to the struck point on the prey's surface, and only inside the mouth's cone — never to its centre through the head
  // the nose: a rounded cap the tentacles grow out of (the lathe is open at its front, and single-sided: without it you see into the
  // hull between the arms — seen v11.8.8), with the dark mouth at its centre, seen open
  (capG||g).add(new THREE.Mesh(merge([part(G.sph(r*1.12,8,6),0,0,z-r*0.15,pal.top,{s:[1,1,0.62],c2:pal.belly}),part(G.sph(r*0.55,6,5),0,0,z+len*0.18,pal.mouth||pal.band,{s:[1,1,0.6]})]),MAT));
  return {rig:rig,open:(k,t)=>ringPose(rig,k*0.7,0,t||0)};
}
// The slowblood eyes (v11.8.6–7, the person): a ring of six small dark eyes round the head at z (the species' 360° function), and on
// predators two of them carried forward and made big on lobes of the head's own flesh with room behind (a hammerhead's extension,
// not a stalk), a darker pupil you see only close. Dark on dark: readable up close, unreadable fuzzed. No band (v11.8.7).
function slowEyes(P,pal,z,R,pred){
  const n=6;for(let i=0;i<n;i++){const a=(i+0.5)/n*TAU;P.push(part(G.sph(R*0.09,5,4),Math.cos(a)*R*0.98,Math.sin(a)*R*0.98,z,pal.eye));}
  if(pred)for(const sx of [1,-1]){P.push(part(G.sph(R*0.42,6,5),sx*R*0.82,R*0.14,z+R*0.32,pal.top,{s:[1.45,0.85,1.5],c2:pal.belly}));
    P.push(part(G.sph(R*0.24,6,5),sx*R*1.18,R*0.2,z+R*0.62,pal.eye));P.push(part(G.sph(R*0.09,5,4),sx*R*1.3,R*0.2,z+R*0.8,pal.pupil||[0.02,0.02,0.02]));}
}
// Three fins at 120° (one dorsal at a0=HPI, two ventro-lateral) at z on a body of radius R, each hgt tall and len long, swept
// back; returns the meshes (rotation.y beats them; the anim phases the ventral pair against the dorsal). Colour c (pal.top).
function finTrio(g,pal,z,R,hgt,len,c){const out=[];for(let i=0;i<3;i++){const a=HPI+i*TAU/3;const Gi=new THREE.Group();Gi.position.set(0,0,z);Gi.rotation.z=a-HPI;g.add(Gi);
  const m=new THREE.Mesh(merge([part(G.box(R*0.08,hgt,len),0,R*0.9+hgt*0.45,-len*0.25,c||pal.top,{r:[0.35,0,0],c2:pal.belly})]),MAT);Gi.add(m);m.userData.i=i;out.push(m);}return out;}
// The three-lobed tail: parts pushed to T (the tail mesh's parts) at z, one up and two down and out.
function tailTrio(T,pal,z,hgt,len,c){for(let i=0;i<3;i++){const a=HPI+i*TAU/3,ca=Math.cos(a),sa=Math.sin(a);T.push(part(G.box(0.05,hgt,len),ca*hgt*0.5,sa*hgt*0.5,z,c||pal.top,{r:[-0.55,0,a-HPI],order:'ZXY',c2:pal.belly}));}}
// Chevron rows down the back: paired small plates in a ^ from z0 to z1, spaced ds, on a body of radius rAt(z) (the lathe profile).
function chevrons(P,pal,z0,z1,ds,rAt,sz){for(let z=z0;z>z1;z-=ds){const r=rAt(z);if(r<0.05)continue;for(const sx of [1,-1])P.push(part(G.box(sz,sz*0.25,sz*0.9),sx*r*0.32,r*0.9,z,pal.plate||pal.band,{r:[0,sx*0.35,-sx*0.5]}));}}
// the radius of a lathe profile [[r,z],...] at z (linear between points; the profiles run from the tail to the nose)
function profR(prof){return (z)=>{for(let i=1;i<prof.length;i++){const a=prof[i-1],b=prof[i];if(z>=a[1]&&z<=b[1])return lerp(a[0],b[0],(z-a[1])/(b[1]-a[1]));}return 0;};}
// ---------- the roster's new species (PLANET.md, Sep 2026) ----------
// Builders only: stats, roles and envelopes come when each is placed (creatures_defs.js). Authored in metres at s=1 so the
// numbers read as sizes. The action states every anim reads, so the bestiary and later the AI drive them the same way:
// st.tell (0..1: the hydraulic tell before a strike — limbs cock, eyestalks rise, the body swells), st.strike (0..1: the strike,
// the bite, the tail flick, the drop), st.jet. A builder with no strike ignores them. Geometry language by clade (PLANET):
// hingeshells are boxes and cones with the joints showing (trunk/leg), slowbloods lathes, ringmouths spheres and chains.

// A jointed trunk (hingeshells): n plates from z0 (front) back to z1, width w(u) and height h(u) (u 0 at the front, 1 at the
// back), each a box with a narrower joint box in the joint colour behind it. y(u): the centreline height. Parts pushed to P.
function trunk(P,pal,n,z0,z1,w,h,y){const L=(z0-z1)/n;for(let k=0;k<n;k++){const u=(k+0.5)/n,z=z0-(k+0.5)*L,ww=w(u),hh=h(u),yy=y?y(u):0;P.push(part(G.box(ww,hh,L*0.78),0,yy,z,pal.top,{c2:pal.belly}));if(k<n-1)P.push(part(G.box(ww*0.8,hh*0.8,L*0.34),0,yy,z-L*0.5,pal.joint));}}
// A two-segment leg (hingeshells): the hip at (x,y,z), the knee at hip+(kx,ky,kz) with a joint knob, the foot at hip+(fx,fy,fz);
// w thick. hook: a claw of that length curving from the foot toward -y.
function leg(P,pal,x,y,z,kx,ky,kz,fx,fy,fz,w,hook){
  const u=V3(kx,ky,kz),ul=u.length(),col=pal.leg||pal.top;P.push(part(G.box(w,ul,w),x+kx/2,y+ky/2,z+kz/2,col,{dir:u}));
  P.push(part(G.sph(w*0.72,5,4),x+kx,y+ky,z+kz,pal.joint));
  const v=V3(fx-kx,fy-ky,fz-kz),vl=v.length();P.push(part(G.box(w*0.75,vl,w*0.75),x+(kx+fx)/2,y+(ky+fy)/2,z+(kz+fz)/2,col,{dir:v}));
  if(hook){const hx=x+fx,hy=y+fy,hz=z+fz,d=V3(-Math.sign(fx)*0.3,-1,0.15);P.push(part(G.sph(w*0.6,5,4),hx,hy,hz,pal.joint));P.push(part(G.cone(w*0.55,hook,4),hx+d.x*hook*0.45,hy+d.y*hook*0.45,hz+d.z*hook*0.45,col,{dir:d}));}
}
// A row of swimming flaps down one side (the paddlers): flaps k0, k0+every, ... of n along the body from z0 (front) to z1 (back),
// out to `len` at the widest (a hump: shorter at both ends), `w` wide, `th` thick, swept back by `rake`; hw(u) is the body's
// half-width there so every root is inside the body. One mesh pivoted on the body's side at (sx*px, py, 0): rotation.z beats
// it, the caller phases its siblings for the metachronal wave. Returns the mesh.
function flapRow(g,pal,n,k0,every,sx,px,py,z0,z1,len,w,th,rake,hw){
  const P=[],a=sx*rake;
  for(let k=k0;k<n;k+=every){const u=(k+0.5)/n,z=z0+(z1-z0)*u,L=len*(0.5+0.5*Math.sin(u*Math.PI)),X=sx*L/2,rx=sx*(hw(u)-px);
    P.push(part(G.box(L+0.2,th,w*(0.75+0.25*Math.sin(u*Math.PI))),rx+X*Math.cos(a),0,z-X*Math.sin(a),pal.flap,{r:[0,a,0],c2:pal.belly}));}
  const m=new THREE.Mesh(merge(P),MAT);m.position.set(sx*px,py,0);m.userData.sx=sx;m.userData.ph=k0/every;g.add(m);return m;
}
// the flap wave: three phases down each side, damped when still
function flapWave(flaps,ph,amp,spd){const k=0.35+0.65*Math.min(1,spd);for(const m of flaps)m.rotation.z=m.userData.sx*amp*k*Math.sin(ph-m.userData.ph*2.1);}

// ---------- hingeshells (CLADES, v11.9: the ring sequenced and armoured) ----------
// The clade's kit, on top of trunk/leg/flapRow: `valves` — the bivalved carapace hinged at the midline along the back (the clade's own
// thing and its name), two plates raised when swimming or walking so the flaps and legs clear it, clamped shut on the tell and (later)
// through the moult; pale inside (the joint colour), so opening them shows. `comb` — a rake of rigid plates on the front of the shield
// in place of antennae (the clade has none): the sensing organ. `mouthRing` at the front (`front`), the ancestral ring of plates.
// Stalked eyes that never track, plus a rim row where the shield has an edge.
function valves(g,pal,z0,z1,w,y,th){
  const L=z0-z1,zc=(z0+z1)/2,out=[];
  for(const sx of [1,-1]){const Gi=new THREE.Group();Gi.position.set(0,y,zc);g.add(Gi);Gi.userData.sx=sx;
    Gi.add(new THREE.Mesh(merge([part(G.box(w/2,th,L),sx*w/4,0,0,pal.valve||pal.top,{c2:pal.joint})]),MAT));out.push(Gi);}
  return {set:(k)=>{for(const Gi of out)Gi.rotation.z=Gi.userData.sx*k;}};
}
function comb(P,pal,x,y,z,n,w,len){for(let i=0;i<n;i++){const u=n>1?i/(n-1)-0.5:0;P.push(part(G.box(len*0.14,len*0.3,len),x+u*w,y-len*0.15,z+len*0.45,pal.joint,{r:[0.55,u*0.7,0]}));}}
// The mouth of the anomalocarids: a ring of plates at (0,y,z), radius R — facing down (under the head), or forward (front: on the
// head's face, the axis z).
function mouthRing(P,pal,y,z,R,front){
  if(front){P.push(part(G.cyl(R,R*1.1,R*0.35,14,true),0,y,z,pal.belly,{r:[HPI,0,0]}));for(let i=0;i<14;i++){const a=i/14*TAU;P.push(part(G.box(R*0.2,R*0.28,R*0.7),Math.cos(a)*R*0.62,y+Math.sin(a)*R*0.62,z+R*0.15,pal.joint,{r:[0,0,a]}));}return;}
  P.push(part(G.cyl(R,R*1.1,R*0.35,14,true),0,y,z,pal.belly));for(let i=0;i<14;i++){const a=i/14*TAU;P.push(part(G.box(R*0.28,R*0.2,R*0.8),Math.cos(a)*R*0.62,y-R*0.1,z+Math.sin(a)*R*0.62,pal.joint,{r:[0,HPI-a,0]}));}
}
// The remaining hand builders went in v11.25: every species of the roster is a spec in creatures_spec.js (SPECS); the kit above is what
// they compile from. The old builders are kept out of the repo (a session copy served test/ident.js).
