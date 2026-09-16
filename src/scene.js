// scene.js — app state, quality tier, renderer, camera, lights, shared materials
if(typeof THREE==='undefined'){document.getElementById('title').textContent='three.js did not load';throw new Error('three.js missing');}

let mode='menu',t=0;
const canvas=document.getElementById('c');
const hurtEl=document.getElementById('hurt'),fadeEl=document.getElementById('fade'),biomeEl=document.getElementById('biome'),hintEl=document.getElementById('hint'),menuEl=document.getElementById('menu'),statsEl=document.getElementById('stats'),compassEl=document.getElementById('compass'),cstripEl=document.getElementById('cstrip'),cpeakEl=document.getElementById('cpeak');
const isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0;

// The URL's flags, any order, separated by & or , : the tier (#low, #high), #zoo, #lab or #lab=<spec>. v11.31.4: they were read
// as the whole hash, so a forced tier and the lab were exclusive — and the lab, which writes its spec into the hash, threw away a
// #low the person had asked for. HASH_TIER is what the lab puts back (lab.js labHash).
const HASH_FLAGS=(location.hash||'').replace('#','').split(/[&,]/),HASH_TIER=HASH_FLAGS.indexOf('low')>=0?'low':HASH_FLAGS.indexOf('high')>=0?'high':'';
// Quality tier: numbers only, never code paths. Override with #low or #high in the URL.
const Q=(function(){
  const small=Math.min(screen.width||9999,screen.height||9999)<900;
  const tier=HASH_TIER||((isTouch&&small)?'low':'high');
  return tier==='low'
    ?{tier:tier,pr:1.0,far:1000,flora:0.45,creatures:0.6,lights:2,phong:false,aa:false,budgetMs:8,farMs:2,farQ:6,surf:96,lodNear:0.7,rockLvl:1,target:14,casters:6,shafts:2,cau:3,hrtf:0,vol:1,cloud:2,snow:1000,hz:200}
    :{tier:tier,pr:1.5,far:1600,flora:1.0,creatures:1.0,lights:4,phong:true,aa:true,budgetMs:6,farMs:3,farQ:12,surf:192,lodNear:1.0,rockLvl:2,target:7.5,casters:16,shafts:4,cau:5,hrtf:1,vol:1,cloud:5,snow:1800,hz:100};
  // snow (v11.24): the marine snow's points (atmosphere.js); the deep is sparse, so many of them are dormant at a time
  // cloud (v11.17): the slices the sky shader marches up through the cumulus deck (atmosphere.js SKY_FS), two 4-octave noises per slice per sky pixel
  // hrtf, vol (v11.14, the sound): HRTF panning on the placed voices (front/back and up/down; the audio thread's one real cost) or equal-power; the master volume
  // casters (v11.23): the creatures that cast into the shadow map each frame (the nearest by size; the player always); shafts, cau (v11.13, the light pass): the
  // light-shaft grid's side (4 = sixteen shafts round the camera); the caustic's ripple trains (CAU_RINGS; 5 the sea, 3 its long rings — v11.37)
  // target (v11.12): the frame the streaming must fit in, ms — the cell generator gets what the rest of the frame leaves of it, at most
  // budgetMs (main.js). 7.5 is a 120 Hz frame with a little to spare; 14 a 60 Hz phone's. Before, 6 ms of generation on a 4 ms frame
  // made 10 ms frames all through a cell's load: fine at 60 Hz, a hitch at 120.
})();

const renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:Q.aa});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,Q.pr));
renderer.setSize(innerWidth,innerHeight);
const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x1a7591,SEA_FOG.dens);
scene.background=scene.fog.color;
const FAR=Q.far;
// The camera's numbers (v11.48, the person's ask after the Subnautica-VR scale question): fov is the vertical field in degrees in third person,
// fovFP in first person, arm is added to the clade's cam distance in third person (m). Tunable live from the readout (main.js CAM_TUNE:
// arrows and pgup-pgdn) so the big animals can be looked at at 62, 55 and 50 with the body in frame; bake a chosen number in here.
// 62 vertical is ~94° horizontal at 16:9 — Subnautica's default, the one that made a 55 m reaper feel like a shark your size on a flat screen.
const CAM_K={fov:62,fovFP:62,arm:0};const CAM_DEF=Object.assign({},CAM_K);
const camera=new THREE.PerspectiveCamera(CAM_K.fov,innerWidth/innerHeight,0.2,FAR);

// ---------- fog: by distance, two populations of light, the water's colour where the light comes from ----------
// three's fog reads view-space depth (-z), not distance, so the same object is less fogged at the edge of the screen than
// dead ahead: a landmark 350 units out vanished when you looked at it and showed in the corner of your eye. Every fog
// chunk is replaced here, before any material compiles. (1) Radial distance. (2) Two populations: the near haze as before
// (exp2, fogDensity) and a slow extinction (uFogP.x) that keeps a share (1-uFogP.y) of the contrast out to the far plane,
// so big distant things stay as ghosts instead of ending at 250 units. uFogP is per material: big things (terrain, structures,
// landmarks, glow, the surface, the dome, big creatures) read FOG_P, small things (flora, small creatures, impostors) read
// FOG_PS with a smaller ghost — see addTint. (3) Under water the veil's colour is the water's from a world-space map (WATER
// by floor biome, canopy weight in alpha, far.js), sampled at the camera and at a point at most uFogW.w units along the
// ray (the light scattered into the eye comes from the water near it: the void beyond the rim never paints the horizon),
// darkened by the daylight at that point (dark looking down into the deep, light looking up), brightened toward the sun
// (uFogS), scaled by uFogW.y. The black dome at the far plane (atmosphere.js) is fogged by the same code, so the "sky" under
// water is this veil in every direction. Above water fogColor (the air haze) is used. (4, v11.13) The chemocline PLANET asks for:
// a thin milky plate at -450 (the ray's length inside [-452,-448] in closed form from the camera's and the fragment's heights, an
// extinction of 0.25 a metre toward a pale grey) and browner water below it (the veil warmed by the bounded point's depth).
// uFogP: far, share, placeMix, under-water flag. uFogW: the tide, brightness, dlAt, reach. uFogS: sun direction, sun glow.
// uFogW.x was the water map's scale until v11.32; that is 1/(2*HALF) and HALF is a constant, so it is written into the shader
// strings as WM_SCALE and the slot carries TIDE instead — the daylight curve needs it (world.js daylightAt) and there was no
// spare component in any of the four vectors. main.js writes it with the other clock uniforms.
// uFogC / uFogR: the camera's world position and rotation (updateFogCamera, called from the frame loop).
// The extra uniforms are shared by every material through ShaderLib: three clones a library's uniforms per material,
// but assigns typed arrays by reference and calls clone() on textures, and the map returns itself from clone().
// The camera is passed by hand (v8.5) because three's own `cameraPosition` uniform is only uploaded for Phong, Standard
// and Shader materials (WebGLRenderer.setProgram, r128): on Lambert, Basic and Points it stays at the GLSL default (0,0,0).
// The world-space veil (v8.2–v8.4) read `cameraPosition` and so was right on the Phong terrain alone; every Lambert/Basic
// thing — creatures, flora, rocks, structures, impostors, the dome — was fogged as if the camera stood at the world
// origin: the home shelf's bright water at full daylight, wherever the player was. That is the "ground resists the fog"
// of v8.2 and v8.4 exactly: the ground was the one thing fogged to the water it stood in.
const SUN_POS=[30,100,10],SUN_LEN=Math.hypot(SUN_POS[0],SUN_POS[1],SUN_POS[2]); // the boot direction only: since v11 the sun (or the moon, at night) is placed by the clock every frame (atmosphere.js updateSky)
const FOG_P=new Float32Array([SEA_FOG.far,SEA_FOG.share,SEA_FOG.placeMix,1]),FOG_PS=new Float32Array([SEA_FOG.far,SEA_FOG.shareS,SEA_FOG.placeMix,1]);
const FOG_PSURF=new Float32Array([SEA_FOG.far,SEA_FOG.share,SEA_FOG.placeMix,0]); // the surface mesh's own set (v11.42): w 0 — its fragments are the boundary, so its ray is in the camera's medium whole (the plane test would put a far crest's fragment on the wrong side and fog the underside as air — v8.3's pale horizon again)
const FOG_A=new Float32Array([AIR.far,AIR.share,AIR.dens,SEA_FOG.dens]),FOG_AC=new Float32Array([AIR.fog[0],AIR.fog[1],AIR.fog[2],0]); // v11.42, the two-segment fog: the air's far, share and density and the sea's density; the air's colour (the sky's horizon by the hour) and, in w, the water level at the camera now (atmosphere.js applyFog / updateAtmosphere)
const SCAT=[0.06,0.30]; // v11.42.1: the chop scrambles what is seen through the surface from above at grazing angles — a wind sea's slopes (rms ~0.1 rad at 7 m/s) break a transmitted image up within a few slope-widths of the horizon, and what is left is the water's own colour under the reflected sky. The water segment's transmittance from above goes to zero as the ray's elevation (−rd.y) falls from SCAT[1] to SCAT[0], both × the chop (uFogChop, 0.25 in a calm): 17°–3° in the trades, 4°–1° in a calm. The person's video (14 Sep): creatures under water seen from just above it at hundreds of metres against the pale reflection, gone the moment the camera went under
const UPWELL=[0.50,0.43,0.60]; // v11.42: the water seen from above along a downward ray is the upwelling light, darker and bluer than the horizontal veil; this is the old TINT_COL (0.05,0.20,0.34) over WCOL[0] — straight down the deep is the colour it was, at grazing it is the veil
const FOG_W=new Float32Array([0,SEA_FOG.bright,SEA_FOG.dlAt,SEA_FOG.reach]),FOG_S=new Float32Array([SUN_POS[0]/SUN_LEN,SUN_POS[1]/SUN_LEN,SUN_POS[2]/SUN_LEN,SEA_FOG.sun]);
// the water/floor map's scale, a constant of the world's size, written into every shader that samples them (it was uFogW.x);
// and the two depth curves of world.js as GLSL, generated from the same constants the JS reads so the two cannot drift again
const WM_SCALE=(1/(2*HALF)).toFixed(9);
const DL_GLSL=y=>'clamp(1.0+min(0.0,('+y+')-uFogW.x)/'+DL_REF.toFixed(1)+','+DL_MIN.toFixed(2)+',1.0)';
const CAN_GLSL=y=>'smoothstep('+CAN_LO.toFixed(1)+','+CAN_HI.toFixed(1)+','+y+')';
// The veil closes completely between FOG_CUT0 and FOG_CUT1 (v11.27): the slow population never reached zero (1.1% at the far plane), so the black
// dome and a terrain fragment at the same distance differed by a percent or two of the terrain's lit colour — enough, on a dark gradient,
// for the far mesh's outline against the dome to read as a horizon. Past FOG_CUT1 every fragment is the veil at that direction exactly,
// so nothing has an edge against the dome or the far plane. 2.7% contrast at the cut's start, 0 at its end; the same term in fogExtinctOnly and the shafts.
const FOG_CUT0=FAR*0.62,FOG_CUT1=FAR*0.9,FOG_CUT_GLSL='*(1.0-smoothstep('+FOG_CUT0.toFixed(1)+','+FOG_CUT1.toFixed(1)+',d))';
const DITHER_PARS='vec3 dithering(vec3 color){float grid_position=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);vec3 dither_shift_RGB=vec3(0.25/255.0,-0.25/255.0,0.25/255.0);dither_shift_RGB=mix(2.0*dither_shift_RGB,-2.0*dither_shift_RGB,grid_position);return color+dither_shift_RGB;}'; // r128's dithering_pars_fragment without its #ifdef (the rand() it relied on lives in common.glsl, written out here so the sky shader can use it too)
const FOG_C=new Float32Array(3),FOG_R=new Float32Array([1,0,0,0,1,0,0,0,1]); // camera world position; camera world rotation as a column-major mat3
const MIST_P=new Float32Array([0,1/70,0,1/4]),MIST_C=new Float32Array([0.8,0.85,0.9,0.5]),MIST_W=new Float32Array([0,0,1/140,0]); // (v11.17.1: y,z a third layer — the vog or the dawn mist, whichever is here — its extinction and 1/scale height) the mist above the water (v11.17, atmosphere.js updateHaze): two exponential layers on the water level — the marine haze (extinction at the water, 1/scale height) and the surf's spray (the same) — the mist's colour and its forward glow toward the light, and the water level. Read by the air branch of the fog chunk and by the dome
const FOG_SKA=new Float32Array(4),FOG_SKB=new Float32Array(4),FOG_SKC=new Float32Array(4),FOG_SKD=new Float32Array([1,1,1,0]),FOG_SKE=new Float32Array([0,1,0,0]),FOG_SKF=new Float32Array([0,-1,0,0]); // the sky as every fragment reads it (v11.45): zenith+dayK, horizon+cover, the glow+moonL, the sun's colour, the sun's direction, the moon's — atmosphere.js pushSky writes them each frame; shared through ShaderLib like the mist's, so the air's far colour (skyFar) and the surface's reflection (skyLite) are the dome's own sky
// The reduced sky (v11.43 for the window, moved here v11.45 for the air's fog): the dome's gradient, aureole, horizon glow, sun disc and glare, the moon's disc
// and halo, and the deck's shade without its noise — a function of a world direction. SKY_FS (atmosphere.js) is the reference; when its gradient or glare
// changes, change this with it. skyFar is the same seen through the boundary layer to infinity (mistFar, glowing toward the light): what a fragment in air
// converges to at the far cut, in its own direction — the rule the veil has had under water since v11.27, for air (WATER.md Part 3, item 1: the air's far
// colour was one constant, the horizon keyframe, which the dome never shows, so the far sea ended in a pale rim under a darker sky, inverting toward the sun).
const SKYLITE_GLSL='vec3 skyLite2(vec3 d,float shade,float dsc){vec3 uZen=uSkA.xyz,uHor=uSkB.xyz,uGlow=uSkC.xyz,uSunC=uSkD.xyz,uSun=uSkE.xyz,uMoon=uSkF.xyz;float uDay=uSkA.w,uCover=uSkB.w,uMoonL=uSkC.w;float up=d.y;float cs=dot(d,uSun);float k=smoothstep(-0.04,0.55,up);vec3 col=mix(uHor,uZen,k)*(0.92+0.10*cs*cs);'+
  'col+=(uSunC*0.55+uHor*0.45)*0.17*pow(max(cs,0.0),6.0)*uDay*(1.4-0.6*k);vec2 dxz=normalize(d.xz+vec2(1e-4,0.0)),sxz=normalize(uSun.xz+vec2(1e-4,0.0));float hz=pow(1.0-clamp(up,0.0,1.0),4.0);col+=uGlow*pow(max(dot(dxz,sxz),0.0),3.0)*hz;'+
  'col*=1.0-0.35*uCover*shade;float disc=smoothstep('+Math.cos(SUN_R*1.3).toFixed(6)+','+Math.cos(SUN_R*0.85).toFixed(6)+',cs)*uDay*(1.0-0.9*uCover)*dsc;col=mix(col,uSunC*1.4,disc);'+
  'col+=uSunC*(pow(max(cs,0.0),300.0)*0.7*dsc+pow(max(cs,0.0),10.0)*0.13)*uDay*(1.0-0.85*uCover);'+ // dsc (v11.49): the disc and its sharp glare, or not — the window reads the sky without them per facet and draws the sun once from the mean surface (atmosphere.js), since a disc through every facet was a scatter of little bright circles flickering as the facets turned (the person, 14 Sep: "in the bin")
  'float cm=dot(d,uMoon);float md=smoothstep('+Math.cos(MOON_R*1.15).toFixed(6)+','+Math.cos(MOON_R*0.9).toFixed(6)+',cm)*(1.0-0.9*uCover)*dsc;col=mix(col,vec3(0.95,0.93,0.85)*(0.15+0.85*min(1.0,uMoonL*3.6))*(1.0-0.6*uDay),md);col+=vec3(0.80,0.85,0.95)*0.22*uMoonL*(1.0-uDay)*exp(-(1.0-cm)*2600.0);return col;}\n'+
  'vec3 skyLite(vec3 d){return skyLite2(d,1.0,1.0);}\n'+ // the reflection's sky: the deck's mean shade stands in for the clouds it cannot draw; the window (v11.49) calls skyLite2 itself, without the disc and with the clouds
  'vec3 skyFar(vec3 rd,float cy){float hm=1.0-exp(-mistFar(cy,rd.y));vec3 hc=uMistC.rgb*(1.0+uMistC.w*pow(max(dot(rd,uFogS.xyz),0.0),6.0));return mix(skyLite2(rd,0.0,1.0),hc,hm);}\n'; // the fog's far colour: no deck shade — the dome draws its clouds where they are and its gradient between them is unshaded, so a far thing must converge to the unshaded gradient or it stands as a silhouette 15% darker than the dome beside it (seen: the cone from 1500 m)
const FOG_T=new Float32Array([1,1,1,1]); // the sky's light now (v11, atmosphere.js updateSky): x = how much of noon's light reaches the surface (1 noon, ~0.3 under a full moon, 0.035 a moonless night); yzw = its colour relative to noon (warm at dusk, blue-grey by moonlight). The veil, the tint from above and the CPU-side lights all scale by it
function updateFogCamera(){const e=camera.matrixWorld.elements;FOG_C[0]=e[12];FOG_C[1]=e[13];FOG_C[2]=e[14];FOG_R[0]=e[0];FOG_R[1]=e[1];FOG_R[2]=e[2];FOG_R[3]=e[4];FOG_R[4]=e[5];FOG_R[5]=e[6];FOG_R[6]=e[8];FOG_R[7]=e[9];FOG_R[8]=e[10];}
const WM_N=NCELL*6,WM_DATA=new Uint8Array(WM_N*WM_N*4);
const waterMap=new THREE.DataTexture(WM_DATA,WM_N,WM_N,THREE.RGBAFormat,THREE.UnsignedByteType);
waterMap.minFilter=waterMap.magFilter=THREE.LinearFilter;waterMap.wrapS=waterMap.wrapT=THREE.ClampToEdgeWrapping;waterMap.generateMipmaps=false;waterMap.clone=function(){return this;};
const FM_DATA=new Uint8Array(WM_N*WM_N*4),floorMap=new THREE.DataTexture(FM_DATA,WM_N,WM_N,THREE.RGBAFormat,THREE.UnsignedByteType); // (v11.27) the floor's depth under each texel of the water map, r = depth/FM_SCALE, blurred like it (far.js fmBlur): the veil blends the floor's colour out by the height above it (world.js FLOOR_H)
FM_DATA.fill(255); // deep water and full waves everywhere until the far layer fills the map (v11.44): the wave sum reads it, and headless tests without the far layer keep the deep-water sea
const FM_SCALE=1024;floorMap.minFilter=floorMap.magFilter=THREE.LinearFilter;floorMap.wrapS=floorMap.wrapT=THREE.ClampToEdgeWrapping;floorMap.generateMipmaps=false;floorMap.clone=function(){return this;};
// The mist above the water (v11.17): two exponential layers on the water level, rho(y) = uMist.x·exp(-y·uMist.y) + uMist.z·exp(-y·uMist.w)
// (the marine haze and the surf's spray; y above the level), integrated in closed form along a ray from height cy to height fy over
// length d — the ray is cut at the water level, a fragment beneath it (the floor through the surface) counts only its part in air.
// mistFar is the same to infinity for a ray leaving the ground at slope up (the dome): the boundary layer seen edge-on.
const timeU={value:0},tideU={value:0},tideRU={value:0}; // the time; the tide now and its rate (world.js, set by main.js each frame)
// The wave sum from world.js as GLSL, so the surface mesh and the rafts move with exactly the water level the physics uses.
// sp is the local grid spacing: waves the mesh can't resolve fade out (used by the far, coarse part of the surface mesh).
// A wave the grid can't resolve is faded out (sp: the local vertex spacing) — fully drawn at seven samples a wavelength, gone at
// three and a third (v11.4; it was 3.6 to 2.0, i.e. drawn aliased right up to the Nyquist limit, a sawtooth of facets the noon sun
// lit evenly and a low sun lights light/dark: the rows of wedges on the far sea). The crest sharpening puts a wave's mean at
// WSH_MEAN of its amplitude below zero; a faded wave keeps that mean, so the far, flat sea sits at the same level as the near one.
const WSH_MEAN=-0.19514;
const FOG_SN=Q.surf,FOG_SR=FAR*1.05; // the surface grid's side and reach, as atmosphere.js SN and SR — change both or neither
const WAVE_FADE_D=WAVES.map(w=>[w.L*0.14,w.L*0.30].map(sp=>{const s0=FOG_SR*0.06*2/FOG_SN;if(sp<=s0)return 0;const u=Math.sqrt((sp*FOG_SN/(2*FOG_SR)-0.06)/2.82);return FOG_SR*(0.06*u+0.94*u*u*u);})); // per wave: the distance (max of |dx|,|dz| from the camera) at which it starts to fade, and where it is gone (the fog chunk's sum, v11.42.2)
const chopU={value:1}; // SEA_CHOP for the shaders (atmosphere.js writes it)
// The sums (v11.44): waveAmpGLSL is a wave's amplitude at a point — its deep-water amplitude × the chop (the wind sea) or half the place's wave
// energy (the swell) × Green's law as the floor comes up, no more than the breaking limit (world.js waveFac, the same numbers: WAVE_BRK,
// WAVE_SHOAL_MAX); dw is (the water depth, the wave energy) from waveDep. waveSumGLSL builds a sum with the mesh's fade either by a spacing
// parameter (the surface's aSpace, 'sp') or by the distance from the camera ('rm', the fog chunk, WAVE_FADE_D). waveBrk is the breaking excess.
const WAVE_DEP_GLSL='vec2 waveDep(vec2 p,float tide){vec4 f=texture2D(uFloorMap,p*'+WM_SCALE+'+0.5);return vec2(max(f.r*'+FM_SCALE.toFixed(1)+'+tide,0.05),f.g);}\n';
const waveAmpGLSL=(w,chop)=>'min('+w.A.toFixed(3)+'*'+(w.L<20?'('+chop+'*dw.y)':'(0.5+0.5*dw.y)')+'*clamp(pow('+(w.L*0.5).toFixed(2)+'/dw.x,0.25),1.0,'+WAVE_SHOAL_MAX.toFixed(2)+'),cap)';
const waveSumGLSL=(name,chop,wshName,fade)=>'float '+name+'(vec2 p,float t,float '+(fade==='sp'?'sp':'rm')+',vec2 dw){float h=0.0;float cap='+WAVE_BRK.toFixed(2)+'*dw.x;'+
  WAVES.map((w,i)=>'h+='+waveAmpGLSL(w,chop)+'*mix('+WSH_MEAN.toFixed(4)+','+wshName+'(sin(dot(p,vec2('+w.dx.toFixed(5)+','+w.dz.toFixed(5)+'))*'+w.k.toFixed(5)+'-'+w.w.toFixed(5)+'*t+'+w.ph.toFixed(4)+')),1.0-smoothstep('+(fade==='sp'?(w.L*0.14).toFixed(2)+','+(w.L*0.30).toFixed(2):WAVE_FADE_D[i][0].toFixed(2)+','+WAVE_FADE_D[i][1].toFixed(2))+','+(fade==='sp'?'sp':'rm')+'));').join('')+'return h;}\n';
const WAVE_GLSL='uniform float uChop;float wsh(float s){return 2.0*pow(max((s+1.0)*0.5,1e-4),1.7)-1.0;}\n'+waveSumGLSL('waveH','uChop','wsh','sp')+
  'float waveBrk(vec2 p,vec2 dw){float cap='+WAVE_BRK.toFixed(2)+'*dw.x;float b=0.0;'+WAVES.map(w=>'b=max(b,('+waveAmpGLSL(w,'uChop').replace(/^min\(/,'(').replace(/,cap\)$/,')')+'-cap)/cap);').join('')+'return clamp(b,0.0,1.0);}\n';
// The slopes (v11.46). chopSlope: the wind sea's gradient (L < 20, the full amplitude — the physics' chop) for the foam by steepness (WATER.md E): a whitecap
// is where the short waves are locally too steep, not where the swell is high. restSlope: for the surface's fragment, the gradient of what the mesh has faded
// out — each component by the complement of its drawn weight (the vertex's fade by aSpace) — so a facet tilts its reflection by the wave it no longer carries
// in height ("the ripple layer lives only in the light", for the swell at distance; WATER.md Part 3, P3), each component faded again where its phase turns
// more than SLOPE_AA rad per pixel (fwidth) so it never aliases. wshD is the crest sharpening's derivative, so the slope is the drawn shape's.
const SLOPE_AA=[0.8,1.6];
const waveSlopeGLSL=(name,chop,which,rest)=>'vec2 '+name+'(vec2 p,float t'+(rest?',float sp':'')+',vec2 dw){vec2 sl=vec2(0.0);float cap='+WAVE_BRK.toFixed(2)+'*dw.x;'+
  WAVES.map(w=>which(w)?'{float ph=dot(p,vec2('+w.dx.toFixed(5)+','+w.dz.toFixed(5)+'))*'+w.k.toFixed(5)+'-'+w.w.toFixed(5)+'*t+'+w.ph.toFixed(4)+';float s=sin(ph);float wg='+(rest?'smoothstep('+(w.L*0.14).toFixed(2)+','+(w.L*0.30).toFixed(2)+',sp)*(1.0-smoothstep('+SLOPE_AA[0].toFixed(2)+','+SLOPE_AA[1].toFixed(2)+',fwidth(ph)))':'1.0')+';'+
    'sl+='+waveAmpGLSL(w,chop)+'*'+w.k.toFixed(5)+'*vec2('+w.dx.toFixed(5)+','+w.dz.toFixed(5)+')*cos(ph)*wshD(s)*wg;}':'').join('')+'return sl;}\n';
const WSHD_GLSL='float wshD(float s){return 1.7*pow(max((s+1.0)*0.5,1e-4),0.7);}\n';
const WAVE_SLOPE_GLSL=WSHD_GLSL+waveSlopeGLSL('chopSlope','uChop',w=>w.L<20,false);
const WAVE_REST_GLSL=waveSlopeGLSL('restSlope','uChop',w=>true,true);
// The fog chunk sums the same waves per fragment near the water level (v11.42) under its own names, since the lit materials' fragment stage
// already declares uTime and uChop (LIGHT_PARS) and the surface's declares uTime.
// The fog chunk's wave sum is the *drawn* surface's (v11.42.2): the mesh fades each wave out where its grid cannot resolve it (aSpace: fully drawn at
// seven samples a wavelength, gone at three and a third, atmosphere.js sg), so 200 m out it sits at the mean level while the full sum swings ±1.2 m.
// v11.42–v11.42.1 cut the ray at the full sum, and everything in the band between the two — the far kelp's tops, 1.4 m under mean level — was
// classed as air on a trough and drawn in the air's haze: a white wall of stalks on the horizon from either side (the person's three stills).
// The fade is a function of the fragment's distance from the mesh's centre (the camera's x,z) on the grid's per-axis mapping, so the two
// distances per wave where the fade starts and ends are found here once from the same numbers the mesh is built on (Q.surf, FAR·1.05).
// The level is the higher of the drawn surface and the true wave (v11.42.3): the kelp folds to the true wave (the sway shader's cap, 0.45 m
// under it) and a raft rides it, so far out a folded top on a crest stands above the drawn mean surface — under the water all the same.
const WAVE_GLSL_FOG='uniform vec2 uFogTC;float fogWsh(float s){return 2.0*pow(max((s+1.0)*0.5,1e-4),1.7)-1.0;}\n'+WAVE_DEP_GLSL+waveSumGLSL('fogWaveH','uFogTC.y','fogWsh','rm');
const FOG_TC=new Float32Array([0,1]); // the time and the chop for the fog chunk's wave sum, as a typed array (v11.42.1): v11.42 handed the chunk timeU itself, and r128's cloneUniforms copies a number by value into every material, so the chunk's clock stood at zero — the level it cut the ray at was a frozen sea. main.js writes x, updateHaze y
const WAVE_MEAN=WSH_MEAN*WAVE_AMP; // the mean water level relative to the tide, the crest sharpening's offset
const MIST_GLSL='float mistL(float cy,float dy,float d,float rho,float ih){float k=dy*ih;float e=rho*exp(-max(cy,0.0)*ih);return abs(k)<1e-3?e*d:e*(1.0-exp(-k))*d/k;}\n'+
  'float mistRay(float cy,float fy0,float d){float fy=max(fy0,0.0);float dy0=fy0-cy;float dd=abs(dy0)>1e-3?d*clamp((fy-cy)/dy0,0.0,1.0):d;float dy=fy-cy;return mistL(cy,dy,dd,uMist.x,uMist.y)+mistL(cy,dy,dd,uMist.z,uMist.w)+mistL(cy,dy,dd,uMistW.y,uMistW.z);}\n'+
  'float mistFar(float cy,float up){float u=max(up,0.012);return (uMist.x*exp(-max(cy,0.0)*uMist.y)/uMist.y+uMist.z*exp(-max(cy,0.0)*uMist.w)/uMist.w+uMistW.y*exp(-max(cy,0.0)*uMistW.z)/uMistW.z)/u;}\n';
(function(){
  const C=THREE.ShaderChunk;
  if(!C||!C.fog_vertex||C.fog_vertex.indexOf('mvPosition')<0)console.warn('fog chunks not as expected; fog left as three.js has it');
  // Dithering on every material (v11.29). The person saw "rings of brightness in solid lines" in the deep: banding — the veil is a smooth
  // gradient of dark blues, an 8-bit channel has only a handful of levels across it, and the fog is radial so the contours are rings
  // round the view. A red-light screen filter compresses the blue channel (the deep's whole signal) and makes it worse. The cure is the
  // one every game uses: ±half a level of per-pixel noise before the colour is quantised (three's own `dithering`, an option per
  // material, here made unconditional in the chunk so every built-in material has it; the sky shader adds the same line by hand).
  C.dithering_pars_fragment=DITHER_PARS;C.dithering_fragment='gl_FragColor.rgb=dithering(gl_FragColor.rgb);';
  C.fog_pars_vertex='#ifdef USE_FOG\nuniform vec3 uFogC;uniform mat3 uFogR;uniform vec4 uFogW;varying float vFogDepth;varying vec3 vFogPos;\n#endif'; // uFogW in the vertex stage too since v11.32: SUNK_V (the Lambert sun by depth) reads the tide from it, and until now only the fragment chunk declared it
  C.fog_vertex='#ifdef USE_FOG\nvFogDepth=length(mvPosition.xyz);vFogPos=uFogC+uFogR*mvPosition.xyz;\n#endif';
  C.fog_pars_fragment='#ifdef USE_FOG\nuniform vec3 fogColor;uniform vec3 uFogC;uniform vec4 uFogP;uniform vec4 uFogW;uniform vec4 uFogS;uniform vec4 uFogT;uniform vec4 uFogA;uniform vec4 uFogAC;uniform vec4 uMist;uniform vec4 uMistC;uniform vec4 uMistW;uniform sampler2D uWaterMap;uniform sampler2D uFloorMap;uniform vec4 uSkA,uSkB,uSkC,uSkD,uSkE,uSkF;varying float vFogDepth;varying vec3 vFogPos;\n#ifdef FOG_EXP2\nuniform float fogDensity;\n#else\nuniform float fogNear;uniform float fogFar;\n#endif\n'+MIST_GLSL+SKYLITE_GLSL+WCOL_GLSL+WAVE_GLSL_FOG+
    // the veil seen along a ray in water from o for L (v8–v11.32's fog body, now a function of its origin, v11.42): the water map at o and at the bounded point, the floor's colour only near the floor, the canopy, daylight, the sun's glow, the sky's light and tint, the chemocline's brown
    'vec3 fogVeil(vec3 o,vec3 rd,float L){vec3 sp=o+rd*min(L,uFogW.w);vec2 m0=o.xz*'+WM_SCALE+'+0.5,m1=sp.xz*'+WM_SCALE+'+0.5;vec4 w0=texture2D(uWaterMap,m0),w1=texture2D(uWaterMap,m1);'+
    'w0.rgb=mix(wcol(max(-o.y,'+OPEN_D.toFixed(1)+')),w0.rgb,exp(-max(o.y+texture2D(uFloorMap,m0).r*'+FM_SCALE.toFixed(1)+'-'+FLOOR_FREE.toFixed(1)+',0.0)*'+(1/FLOOR_H).toFixed(5)+'));w1.rgb=mix(wcol(max(-sp.y,'+OPEN_D.toFixed(1)+')),w1.rgb,exp(-max(sp.y+texture2D(uFloorMap,m1).r*'+FM_SCALE.toFixed(1)+'-'+FLOOR_FREE.toFixed(1)+',0.0)*'+(1/FLOOR_H).toFixed(5)+'));'+
    'vec4 wm=mix(w0,w1,uFogP.z);float y=mix(o.y,sp.y,uFogW.z);float cw=wm.a*'+CAN_GLSL('y')+';float dl='+DL_GLSL('y')+';float sg=pow(max(dot(rd,uFogS.xyz),0.0),6.0);'+
    'vec3 fc=mix(wm.rgb,vec3('+WATER_CANOPY.map(v=>v.toFixed(3)).join(',')+'),cw)*(1.0-0.28*cw)*uFogW.y*(0.3+0.7*dl)*(1.0+uFogS.w*sg*dl)*uFogT.x*mix(vec3(1.0),uFogT.yzw,smoothstep(-40.0,0.0,y));'+
    'fc*=mix(vec3(1.0),vec3(1.12,0.92,0.72),smoothstep('+CHEMO_TINT[0].toFixed(1)+','+CHEMO_TINT[1].toFixed(1)+',y));return fc;}\n'+
    // the water segment: the chemocline's milky plate by the ray's length inside it, then the veil by the two-population transmittance (uFogP.y the material's share); dn: the downward darkening from above; ck: the far cut, on the camera's segment only
    'vec3 fogWater(vec3 col,vec3 o,vec3 rd,float L,vec3 dn,float ck){vec3 fc=fogVeil(o,rd,L)*dn;float dy=rd.y*L;if(abs(dy)<1e-3)dy=1e-3;float sl=abs(clamp(('+(CHEMO+CHEMO_PLATE).toFixed(1)+'-o.y)/dy,0.0,1.0)-clamp(('+(CHEMO-CHEMO_PLATE).toFixed(1)+'-o.y)/dy,0.0,1.0))*L;'+
    'col=mix(col,mix(fc,vec3(0.62,0.64,0.60)*uFogT.x*0.5,0.6),1.0-exp(-0.25*sl));float tr=mix(exp(-uFogP.x*L),exp(-uFogA.w*uFogA.w*L*L),uFogP.y)*ck;return mix(col,fc,1.0-tr);}\n'+
    // the air segment: the mist on the water integrated over the segment (MIST_GLSL, heights over the water level), glowing toward the light, then the haze toward the sky's horizon colour
    'vec3 fogAir(vec3 col,vec3 o,vec3 rd,float L,float ck){float mo=mistRay(o.y-uMistW.x,o.y+rd.y*L-uMistW.x,L);col=mix(col,uMistC.rgb*(1.0+uMistC.w*pow(max(dot(rd,uFogS.xyz),0.0),6.0)),1.0-exp(-mo));'+
    'float tr=mix(exp(-uFogA.x*L),exp(-uFogA.z*uFogA.z*L*L),uFogA.y)*ck;return mix(col,skyFar(rd,o.y-uMistW.x),1.0-tr);}\n#endif'; // the far colour is the sky in the ray's direction with the haze to infinity (v11.45, skyFar), not uFogAC's constant: at the cut a fragment is the dome exactly, so the far sea, the kelp cards and the shore end in the sky behind them and the sea's edge is no longer a pale rim (WATER.md Part 3)

  // The two-segment fog (v11.42, WATER.md A and L). The medium is not the camera's: each ray is cut at the water where it crosses it, and
  // each part takes its own medium's fog — the water's veil over the part in water, the air's haze and mist over the part in air, the part
  // nearer the fragment applied first. So from above a stalk 300 m off at 4 m depth is gone into the water's colour (91%), not drawn crisp
  // through 53% of air haze and an 18% depth tint as it was (the person's third screenshot, 14 Sep: the forest readable to the horizon under
  // glass); the shallows clear over sand, the deep the upwelling blue (UPWELL); the lagoon and the open shelf differ from above as they do
  // from below; and a camera at the line sees air above the water and water below it in one frame — the split camera POLISH struck as a pass
  // is a plane test here. **From above, the water's part is fogged over the whole ray's length, not its own** (v11.42.1): the true ray refracts
  // at the surface and shows a compressed sliver of what is close under the exit point, which this geometry cannot draw; fogging the water part by
  // its own length (v11.42) let a stalk 200 m off and 5 m deep through 128 m of water against a bright surface veil — the person: "the fog goes away
  // once you leave the water", three stills of the forest crisp to the horizon from just above it. Over the whole length nothing under water is
  // seen further from above than from below, the two halves of a view at the line match, and near things stay clear either side. On top of that
  // the chop's scatter at grazing (SCAT). The water level: at the camera the wave itself (uFogAC.w, JS waveH); at a fragment within 3 m of the tide the same
  // wave sum per fragment (fogWaveH: a raft's pad on a crest is *at* the surface, not 0.4 m above a plane, so it is seen through water whole),
  // else the mean level; the crossing is found against the level blended between the two. uFogP.w 0 (the surface mesh, FOG_PSURF) keeps the
  // whole ray in the camera's medium: its fragments are the boundary. The far cut (FOG_CUT_GLSL) closes the camera's segment only.
  C.fog_fragment='#ifdef USE_FOG\n{float d=vFogDepth;vec3 rd=(vFogPos-uFogC)/max(d,1e-3);float cy=uFogC.y,fy=vFogPos.y,wl=uFogAC.w;float ck=1.0'+FOG_CUT_GLSL+';'+
    'bool cu=cy<wl;float lev=uFogW.x+((abs(fy-uFogW.x)<3.0)?max(fogWaveH(vFogPos.xz,uFogTC.x,max(abs(vFogPos.x-uFogC.x),abs(vFogPos.z-uFogC.z)),waveDep(vFogPos.xz,uFogW.x)),fogWaveH(vFogPos.xz,uFogTC.x,0.0,waveDep(vFogPos.xz,uFogW.x))):('+WAVE_MEAN.toFixed(4)+'));bool fu=fy<lev;float s=1.0;'+
    'if(uFogP.w>0.5&&cu!=fu){float den=cy-fy;if(abs(den)<1e-4)den=1e-4;float s0=clamp((cy-wl)/den,0.0,1.0);s=clamp((cy-mix(wl,lev,s0))/den,0.0,1.0);}'+
    'float dC=s*d,dO=d-dC;vec3 cp=uFogC+rd*dC;vec3 col=gl_FragColor.rgb;'+
    'if(cu){if(dO>0.0)col=fogAir(col,cp,rd,dO,1.0);col=fogWater(col,uFogC,rd,dC,vec3(1.0),ck);}'+
    'else{if(dO>0.0){float sc=smoothstep('+SCAT[0].toFixed(2)+'*uFogTC.y,'+SCAT[1].toFixed(2)+'*uFogTC.y,-rd.y);col=fogWater(col,cp,rd,d,mix(vec3(1.0),vec3('+UPWELL.map(v=>v.toFixed(2)).join(',')+'),clamp(-rd.y,0.0,1.0)),sc*ck);}col=fogAir(col,uFogC,rd,dC,1.0);}'+ // v11.64: the air part takes no cut from above — the horizon tier (horizon.js) draws what lies past the far plane, so a fragment in air keeps its haze contrast to the plane instead of dissolving into the sky by FOG_CUT1 // the water part over the whole length d (v11.42.1), its transmittance scaled by the chop's scatter at grazing (sc, SCAT: 0 at the horizon) and the far cut; the cut closes the ray to the medium the *fragment* is in (v11.42.3): on a split ray the air part takes none, or the dome and the far floor past the cut came out the sky's horizon white under the water — the white backdrop from above
    'gl_FragColor.rgb=col;}\n#endif';
  for(const k in THREE.ShaderLib){const u=THREE.ShaderLib[k]&&THREE.ShaderLib[k].uniforms;if(u&&u.fogColor){u.uFogP={value:FOG_P};u.uFogW={value:FOG_W};u.uFogS={value:FOG_S};u.uFogT={value:FOG_T};u.uMist={value:MIST_P};u.uMistC={value:MIST_C};u.uMistW={value:MIST_W};u.uFogC={value:FOG_C};u.uFogR={value:FOG_R};u.uWaterMap={value:waterMap};u.uFloorMap={value:floorMap};u.uFogA={value:FOG_A};u.uFogAC={value:FOG_AC};u.uFogTC={value:FOG_TC};u.uSkA={value:FOG_SKA};u.uSkB={value:FOG_SKB};u.uSkC={value:FOG_SKC};u.uSkD={value:FOG_SKD};u.uSkE={value:FOG_SKE};u.uSkF={value:FOG_SKF};}}
  // Sunlight by the fragment's own depth (v8.4). sun.intensity is the surface value (atmosphere.js); the directional light
  // is scaled here by the daylight at the lit point's world height (the same 0.28..1 curve the fog and the ambient use),
  // so a floor 150 under a player at the surface is lit by 64% sun, not 100% — before this, everything was lit by the
  // daylight at the *player's* depth, and from just under the surface the massif's rocks 150 down were sunlit like reef
  // rock while the veil in front of them was dim: bright tops, black flanks, hard edges the fog could not soften. Point
  // lights (vents, the player's glow) are not touched: they are local. Lambert lights in the vertex shader (world height
  // from mvPosition and the fog's camera uniforms — this runs before fog_vertex, so vFogPos isn't set yet), Phong in the
  // fragment (vFogPos from the fog varying). Both need USE_FOG for the uniforms; a Lambert material with fog off gets the
  // plain sun. If a chunk doesn't match, it warns and the sun stays as it was.
  const SUNK_V='\n#ifdef USE_FOG\ndirectLight.color*='+DL_GLSL('(uFogC+uFogR*mvPosition.xyz).y')+';\n#endif\n';
  const SUNK_F='\n#ifdef USE_FOG\ndirectLight.color*='+DL_GLSL('vFogPos.y')+';\n#endif\n';
  const reDir=/(getDirectional\w*\s*\(\s*directionalLights?\s*(?:\[\s*i\s*\])?\s*,\s*geometry\s*,\s*directLight\s*\)\s*;)/g;
  let nv=0,nf=0;
  if(C.lights_lambert_vertex)C.lights_lambert_vertex=C.lights_lambert_vertex.replace(reDir,(m)=>{nv++;return m+SUNK_V;});
  if(C.lights_fragment_begin)C.lights_fragment_begin=C.lights_fragment_begin.replace(reDir,(m)=>{nf++;return m+SUNK_F;});
  if(nv!==1||nf!==1)console.warn('sun-by-depth: light chunks not as expected (lambert '+nv+', phong '+nf+'); the sun is lit by the player\'s depth');
})();
const hemi=new THREE.HemisphereLight(0x9fd6e0,0x101c1c,0.9);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff2d8,1.2);sun.position.set(SUN_POS[0],SUN_POS[1],SUN_POS[2]);scene.add(sun);
const plight=new THREE.PointLight(0x6fbfe0,0,40,2);scene.add(plight);

// Fixed pool of point lights. Chunks register light *sources*; each frame the nearest sources are
// mapped onto the pool. The light count never changes, so shaders never recompile mid-play.
const lightPool=[],lightSources=[];
for(let i=0;i<Q.lights;i++){const l=new THREE.PointLight(0xffffff,0,1,2);scene.add(l);lightPool.push(l);}
function assignLights(){
  const cx=camera.position.x,cy=camera.position.y,cz=camera.position.z;
  for(const s of lightSources){const dx=s.x-cx,dy=s.y-cy,dz=s.z-cz;s.d=Math.sqrt(dx*dx+dy*dy+dz*dz)-s.distance*0.6;}
  lightSources.sort((a,b)=>a.d-b.d);
  for(let i=0;i<lightPool.length;i++){const l=lightPool[i],s=lightSources[i];if(s&&s.d<FAR){l.position.set(s.x,s.y,s.z);l.color.setHex(s.color);l.intensity=s.intensity;l.distance=s.distance;}else l.intensity=0;}
}

// The through-water tint from above (v5–v11.41: every fragment under the water level mixed toward TINT_COL by 1−exp(−0.05·depth) when the camera
// was in air) is gone in v11.42: the two-segment fog paints the water's part of the ray instead, by path length and place (UPWELL is what is left of
// TINT_COL). uTint stays: x the water level now (LIGHT_GLSL reads it for the depth), y 1 when the camera is above the water, z the sky's light.
// `small` gives the material the small-thing fog (FOG_PS: a smaller far ghost) instead of the big-thing fog (FOG_P).
const tintU={value:new THREE.Vector4(0,0,1,0)};
// band: the tide's mark on rock (v10.3, the person's ask): the intertidal — the spring range ±TIDE_A1 — is a dark olive film (a
// mat of what lives between the tides: the film the cones and crusts sit in), bleached pale above it in the spray zone, and the
// rock just above the water *now* is darker, wet (the line walks with the tide). By world height in the fragment (vWy), so a
// block through the surface reads its band at 1 m. Strength 0..1 per material: rock 1, the terrain 0.7 (the sand of
// the flats and the passes gets the wet mark, less of the film).
const BAND_GLSL=b=>'{float y=vWy;float it=smoothstep('+(-TIDE_A1-1.1).toFixed(2)+','+(-TIDE_A1+0.9).toFixed(2)+',y)*(1.0-smoothstep('+(TIDE_A1-0.3).toFixed(2)+','+(TIDE_A1+0.9).toFixed(2)+',y));'+
  'float sp=smoothstep('+(TIDE_A1-0.3).toFixed(2)+','+(TIDE_A1+0.7).toFixed(2)+',y)*(1.0-smoothstep('+(TIDE_A1+1.7).toFixed(2)+','+(TIDE_A1+3.5).toFixed(2)+',y));'+
  'float wt=smoothstep(uTint.x-0.3,uTint.x+0.2,y)*(1.0-smoothstep(uTint.x+0.4,uTint.x+1.6,y));'+
  'gl_FragColor.rgb*=mix(vec3(1.0),vec3(0.58,0.64,0.52),it*'+b.toFixed(2)+');gl_FragColor.rgb=mix(gl_FragColor.rgb,gl_FragColor.rgb*1.25+vec3(0.06),sp*'+(0.55*b).toFixed(2)+');gl_FragColor.rgb*=1.0-'+(0.3*b).toFixed(2)+'*wt;}';
// ---------- the light (v11.13, POLISH.md pass A): caustics and the sun's shadows of bodies, in every tinted material's fragment ----------
// Fill is nearly free here and vertices are the frame (AUDIT: four times the pixels cost 0.4 ms), so the light is done per fragment
// in the shaders that already exist, from what every fragment already carries under USE_FOG: vFogPos (the world position), uFogC
// (the camera), uFogS.xyz (the luminary), uFogT (the sky's light), uWaterMap (canopy weight in alpha), uTint.x (the water level now).
// The flat face normal is cross(dFdx, dFdy) of the world position — what the terrain's flat shading already does.
// Caustics (v11.35, redone from the 13 Sep effects audit; DESIGN The light): derived, not painted. The web on a floor is the sun
// focused by the surface's curvature — the Jacobian of the map from a surface point to where its refracted ray lands, J = I − d·c·H
// (d the depth, c = 1 − 1/1.33 the paraxial refraction factor, H the surface height's Hessian), and the irradiance is 1/|det J|:
// mean 1 over the floor by construction, so light is redistributed and never added (v11.13's was a gain, 1 + 1.3·k, and blew the
// sand to white). The swell (WAVES) can't do it: its shortest wave (L 6, A 0.06) has a focal length of ~60 m, so it never focuses in
// the top 30 m; the web comes from the wind's ripples, 1–3 m, which the surface mesh can't hold anyway (it fades waves under seven
// samples a wavelength). So CAU_RINGS is that ripple layer, living only in the light: Q.cau rings of trains round WIND_A, baked at boot (v11.36, below), each ring at its own
// deep-water speed (√(g k), as WAVES), amplitude by uChop (a calm goes glassy and the web dies — true). The surface point read is the
// one the fragment's beam came through (up the refracted sun, uSunW, by d), the Hessian is analytic (−A k² sin · dir⊗dir per train),
// each train blurred by the sun's disc and the beam's scatter at depth (CAU_SUN; the contrast fades by wavelength, the mean stays 1), and the result is
// a line where the focus reaches CAU_T (a soft step of CAU_SOFT either side, ×CAU_HI; two tones, pale lines on the floor and nothing
// else — v11.35.2–3) — then applied as 1 + cau·(I − 1) (cau = LIGHT_K.x, 1 physical; the readout's t-y) by the beam's share (uSunW.w), by
// 1 − 0.85 canopy, and by whether the beam reaches this face at all (the shadows' nl rule, v11.34.1: clamp(dot(fn, sun)·2.5)).
// Nothing at the surface itself (d·c·H → 0 gives I → 1 on its own); wd gates the block to under water.
// Shadows (v11.23, the second pass): one low-resolution shadow map along the sun, rendered by three's own depth pass (sun.castShadow)
// and read by hand in every tinted fragment from the world position — never through three's receiveShadow (r128 keys a material's
// program on it and shares one program per material, so a mixed scene would be a lottery; here nothing "receives" as far as three
// knows and every fragment samples uShMap itself). The map is an orthographic box SHM_R either side of a point ahead of the camera,
// SHM_D deep both ways along the light, its texels snapped so the shadows don't crawl as the camera moves, its up vector north (the
// sun's and the moon's tracks lie east–west over the zenith, so the box never spins). Under water the light — and the Lambert key
// with it — is the refracted sun (uSunW), in air the true one, blended by the crossing (medK); under cloud the key rises toward the
// zenith and the shadows fade with the beam's share (uSunW.w), as the caustics do. Per fragment: the map coordinate (a mat4), one
// centre tap for the caster's distance, then four taps on a rotated square whose radius widens 5% a metre from the caster (a
// penumbra), each tap faded by that distance (35 m under water — scattering — 300 in air), the box's edge faded over its outer 7%.
// The casters are the creatures' meshes (castShadow, creatures_ai.js spawn; the nearest Q.casters bodies by size each frame,
// updateShadow) and the player's — in first person the body wears a ghost material that writes nothing but still casts, so your own
// shadow is under you. Nothing else casts: the flora, the rock and the terrain are lit by their build-time occlusion (below).
// LIGHT_FX false strips the whole light block (the fallback if the GLSL ever fails: everything tinted goes black or magenta at boot,
// since warmShaders compiles it all).
const LIGHT_FX=true;
const SUN_W=new Float32Array([0,1,0,0]); // the sun under water: xyz the refracted direction toward it, w the beam's share of the light (atmosphere.js updateSky)
const LIGHT_K=new Float32Array([SEA_FOG.cau,SEA_FOG.shd]); // caustic contrast (1 physical, v11.35), shadow strength: the readout's tuner moves them (main.js); the effects list zeroes them (effects.js)
const lightKU={value:LIGHT_K};
// the ripple layer the caustics are focused by (v11.35; baked v11.36). Six sines gave dots or stripes — the sea is a random field, and a
// net (connected fold lines round cells) needs a broadband one. The Hessian is linear in the trains and trains of one wavelength share
// one frequency (dispersion), so a ring of CAU_DIRS trains at that wavelength, random phases, directions within ±CAU_SPREAD of the
// wind, is baked once at boot into two tiles — the sin and cos parts of (Hxx, Hxy, Hzz), since sin(k·x − ωt + φ) = sin(k·x+φ)cos ωt −
// cos(k·x+φ)sin ωt — and the fragment recovers the exact field at any time from two taps and one sincos a ring. The wave vectors sit
// on the CAU_TILE lattice (k = 2π n / T) so the tile wraps; a ring is the lattice vectors whose wavelength lies within ±18% of its own.
// CAU_RINGS: [wavelength m, amplitude m per train at full chop]; Q.cau rings are used, longest first (5 high, 3 low). Bytes, ±CAU_HMAX.
const CAU_RINGS=[[8.0,0.076],[4.0,0.038],[2.0,0.019],[1.0,0.0095],[0.5,0.0048]],CAU_DIRS=8,CAU_SPREAD=1.2,CAU_TILE=40,CAU_N=384,CAU_HMAX=1.2; // v11.39 (PLANET, decided 14 Sep): a wind sea and nothing else — constant steepness ak 0.06 across the rings (8 m at 7.6 cm down to 0.5 m at 5 mm), which puts the
// curvature in the short waves: a fine fast web in the top few metres, metre cells at 5–10, 2 m at 10–15, soft 4 m patches by 20, each ring folding at its own
// depth and the sun's disc and the beam's diffusion taking the short ones first. The person chose believability over size ("even if it means smaller caustics");
// there is no film on this sea and no stated stylisation. v11.38 had 8 m down to 1 at equal curvature (a filmed sea, in effect); v11.37: ×2.5 in wavelength, and the amplitudes ∝ L² — equal curvature a ring — so the 5 m ring is an equal partner and the cells come out at its scale (the person, 14 Sep: cells of a metre are "tiny blobs" in a world whose grain is a 4 m facet and a 3 m animal; constant steepness, the physics of a wind sea, puts the curvature in the shortest waves and gives the fine web of a snorkel, which is what he did not want). The 0.7 m ring is a trace of that fine web in the top few metres
// the gusts (v11.37): a second tile, value noise at CAU_GUST[0] m, modulates the rings' amplitude by 1 − CAU_GUST[1]·(1 − n) — patches of strong net and patches of calm, as a gusty wind ripples a sea in patches, instead of one texture over the whole floor (the person's five shots of v11.36.1: "the same density everywhere")
const CAU_GUST=[110,0.75],CAU_GN=64;
// The de-res (v11.40, PIXEL.md pass A): in pixel mode every tinted surface's colour is constant over a cell of a texel grid fixed to the thing it is on —
// the world for the ground (TERRAIN_MAT, the landmarks' MATLM: grid 'world'), the body for an animal (object space × the object's scale), the instance for a
// plant or a placed rock or structure (instance space × its scale, read before the sway so the texels ride the blade). The light's blocks (CAU_PX) are the
// same size as the world's texel, so PIX_T is the one knob. PIX_TB: the bodies' texel (decided 14 Sep: 0.15). PIX_TONES: levels a channel is posterised to
// after the snap, so a gradient over a body reads as bands of tone, as pixel art does. The fragment cannot re-run the vertex stage, but within a facet every
// interpolated quantity is linear, so it extrapolates its own colour to the cell's centre with screen-space derivatives (PIX_GLSL, exact for a linear
// interpolant; the flat-shaded terrain's light is constant over a facet anyway). The cell is a column along the face's dominant axis — the xz grid on a floor,
// yz or xy on a wall — the three-way pick a Minecraft block makes; the centre is moved along the face's plane so it stays on the surface. The fog stays
// continuous (decided: water is not a surface); the caustic and the shadows snap themselves (v11.38). Off, the whole thing is one uniform test.
// v11.41.1: its own switch, `texels` (uTex, texU) — the person wants the textures with the smooth light too, so the light's blocks (uPix) and the texels are separate rows on the effects list.
const PIX_T=0.3,PIX_TB=0.15,PIX_TONES=16; // the world's texel m (= CAU_PX), the bodies' texel m, tone levels per channel
const CAU_SUN=0.02,CAU_T=3.0,CAU_SOFT=0.5,CAU_HI=1.5,CAU_D=30,CAU_DARK=0.35,CAU_SWELL=4,CAU_FAR=[30,70],CAU_PX=PIX_T,CAU_STEP=0;
// CAU_DARK (v11.39, PLANET decided 14 Sep: light is moved, not made): the cells of the net — where the surface defocuses, 1/|det J| < 1 — are darkened by
// CAU_DARK·(1 − I), so what the lines add the cells give back; test/caustic.js prints the mean of the drawn factor, ~1 at the depths the net is drawn
// CAU_SOFT 0.5 (v11.38.1; was 1.2): a wide step painted weak focus — a calm gust, a fold seen off its line — as broad faint smears beside crisp lines (the
// person: "arbitrary thin and blurry zones"); softness belongs to depth, not to the local strength. CAU_D: the beam's diffusion by scatter, a contrast fade
// exp(−d/CAU_D) on top of the sun-disc blur (which sets the cells' size) — the person had a clear net at 73 m; real caustics are gone by 25–30 m in clear water.
// Two versions of the light, one switch (v11.38, the person's ask: keep the pixel style and the high-resolution one, and compare): uPix (effects.js 'pixel light',
// pixU). Pixel: the caustic in CAU_PX blocks with a hard step, and the shadows snapped to the same world grid with a hard edge — one grain for both systems.
// Smooth: no snap, and a wide soft step (CAU_SOFT) for the caustic and the four-tap penumbra for the shadows — the OG's broad sweeping patches over the
// baked structure. The snapped point is moved along the face's plane (dy = −(fn.x·dx + fn.z·dz)/fn.y), so it stays on the surface and a slope takes no acne;
// a face steeper than ~72° (|fn.y| < 0.3) is not snapped.
const pixU={value:1},texU={value:0},texLU={value:0},windOffU={value:new THREE.Vector2(0,0)}; // uWindOff: the wind's integral (K.windOff, atmosphere.js) modulo the gust tile, for the gusts' drift (v11.39) // v11.37: CAU_SUN back to 0.02 — 0.03 left every floor past ~18 m dark (the person: "nothing in the kelp forest"); CAU_PX 0.3, lines two or three blocks wide at these scales // the beam's angular spread rad (v11.35.2: the sun's half-degree disc plus forward scatter; a ring's contrast at depth d falls by exp(-2(pi d CAU_SUN/L)^2), so the deep is the long rings' alone); the focus a line needs (1/|det J| at or over CAU_T; v11.36: 3 — a fold line is thin only where |det| is small, 1.5 was fat worms over a third of the floor) and the half-width of the step to it (v11.35.3: a hard two-tone at 40 cm read as a print); the line's brightness; how many of WAVES, longest first, the ripples ride; the fade from the eye per ring, in wavelengths
const CAU_TEX=[];let CAU_GTEX=null;
// the de-res fragment (v11.40; the reasoning at PIX_T): the grid-space tangent basis gx, gy from the varying, the cell centre's offset d put on the face's
// plane along its dominant axis, the 2×2 solve for the screen offset (a, b) that moves by d, the colour extrapolated there and posterised. det guards a
// face seen edge-on (nothing to extrapolate along). `grid` 'world' sizes the cell PIX_T; otherwise PIX_T for an instance and PIX_TB for a body.
// The pattern in the texel (v11.41, PIXEL.md pass B): a tone step per cell from a hash of the cell's index, ±PIX_GRAIN weighted by the material's
// class (PIX_CLASS: sand heavy, rock and the plants lighter, a body by half), and the class's own mark — rock: the grain on clumps of PIX_ROCK_CLUMP
// cells (v11.41.1; a stratum every 1.2 m of world height was rings round every boulder — binned by the person); a blade or a card: a vein, a darker line every PIX_VEIN[0] cells across the growth axis; the terrain: sand grain heavy,
// rock grain light, told apart by the vertex colour's luminance (the terrain colours by substrate); a body: its coat's pattern (creatures_spec.js
// PATTERNS, by clade unless the spec says — the person's rule, PIXEL.md Decided 5), carried per vertex as aPat (kind, cells per period, tone) on
// the body's own geometry, drawn in body space: stripes are bands along z (every creature faces +z), spots hashed clusters of scale² cells at a
// threshold, plates a coarser grid with a darker seam, scales the same grid with every other row offset by half. Applied after the posterise as
// one multiplier, so the grain is a step of tone and not quantised away. The chosen cell is the column along the face's dominant axis (pass A),
// so the pattern is read on the two axes across it (cid) and the across-growth index (ca) is the one not the growth axis.
const PIX_GRAIN=0.06,PIX_CLASS={terr:[0.6,1.0],rock:0.7,plant:0.4,blade:0.4,card:0.4,body:0.5},PIX_ROCK_CLUMP=3,PIX_VEIN=[3,0.08]; // the tone step; the grain weight per class (terr: [rock, sand] by luminance); rock's grain hashed on clumps of n cells (v11.41.1: the person wanted it "much more coarse"); a vein every n cells across by this much
const PIX_CLS_GLSL=cls=>(cls==='terr'?'\n#ifdef USE_COLOR\nfloat pw=mix('+PIX_CLASS.terr[0].toFixed(2)+','+PIX_CLASS.terr[1].toFixed(2)+',smoothstep(0.3,0.6,dot(vColor,vec3(0.3,0.5,0.2))));\n#else\nfloat pw='+PIX_CLASS.terr[1].toFixed(2)+';\n#endif\n':'float pw='+(PIX_CLASS[cls]||0).toFixed(2)+';')+
  'float tn=(floor(ph*3.0)-1.0)*'+PIX_GRAIN.toFixed(3)+'*pw;'+
  (cls==='rock'?'ph=fract(sin(dot(floor(cid/'+PIX_ROCK_CLUMP.toFixed(1)+'),vec2(12.9898,78.233)))*43758.5453);tn=(floor(ph*3.0)-1.0)*'+PIX_GRAIN.toFixed(3)+'*pw;':'')+
  (cls==='blade'||cls==='card'?'if(mod(ca,'+PIX_VEIN[0].toFixed(1)+')<0.5)tn-='+PIX_VEIN[1].toFixed(3)+';':'')+
  (cls==='body'?'float pk=vPat.x,psc=max(vPat.y,1.0),pto=vPat.z;'+
    'if(pk>0.5&&pk<1.5){if(mod(floor(ci.z/psc),2.0)<0.5)tn-=pto;}'+
    'else if(pk<2.5){if(fract(sin(dot(floor(cid/psc),vec2(41.17,7.31)))*23758.545)<0.3)tn-=pto;}'+
    'else if(pk<3.5){vec2 pm=mod(cid,psc);if(pm.x<0.5||pm.y<0.5)tn-=pto;}'+
    'else if(pk<4.5){float prow=floor(cid.y/psc);float pcx=cid.x+(mod(prow,2.0)<0.5?0.0:floor(psc*0.5));if(mod(cid.y,psc)<0.5||mod(pcx,psc)<0.5)tn-=pto;}':'');
const PIX_GLSL=(grid,cls)=>'if(uTex>0.5){vec3 gx=dFdx(vGrid),gy=dFdy(vGrid);float xx=dot(gx,gx),xy=dot(gx,gy),yy=dot(gy,gy),det=xx*yy-xy*xy;if(det>1e-4*xx*yy){'+(grid==='world'?'float pt='+PIX_T.toFixed(3)+';':'\n#ifdef USE_INSTANCING\nfloat pt='+PIX_T.toFixed(3)+';\n#else\nfloat pt='+PIX_TB.toFixed(3)+';\n#endif\n')+
  'vec3 nn=cross(gx,gy),an=abs(nn);vec3 ci=floor(vGrid/pt);vec3 d=(ci+0.5)*pt-vGrid;vec2 cid;float ca;if(an.y>=an.x&&an.y>=an.z){d.y=-(nn.x*d.x+nn.z*d.z)/nn.y;cid=ci.xz;ca=ci.x;}else if(an.x>=an.z){d.x=-(nn.y*d.y+nn.z*d.z)/nn.x;cid=ci.yz;ca=ci.z;}else{d.z=-(nn.x*d.x+nn.y*d.y)/nn.z;cid=ci.xy;ca=ci.x;}'+
  'float bx=dot(gx,d),by=dot(gy,d),a=(yy*bx-xy*by)/det,b=(xx*by-xy*bx)/det;vec3 lt=vec3(1.0),c0=gl_FragColor.rgb;if(uTexL<0.5){vec3 alb=max(diffuseColor.rgb,vec3(0.002));lt=c0/alb;c0=alb;}c0+=a*dFdx(c0)+b*dFdy(c0);float bdx=mod(cid.x,2.0),bdy=mod(cid.y,2.0),bd=0.125+0.5*bdx+0.75*bdy-bdx*bdy;c0=floor(clamp(c0,0.0,1.0)*'+(PIX_TONES-1).toFixed(1)+'+bd)/'+(PIX_TONES-1).toFixed(1)+';'+
  'float ph=fract(sin(dot(cid,vec2(12.9898,78.233)))*43758.5453);'+PIX_CLS_GLSL(cls)+'gl_FragColor.rgb=c0*(1.0+tn)*lt;}}';
// The light in the texel (v11.41.2). The person's v11.41.1 screenshots: the ground's light — the player's own point light, the sun's falloff — is a smooth
// ramp per vertex, and sixteen tones turn a ramp into level rings that travel with the player ("like light sources glow with rigid contours … reminds
// me of Morrowind", whose vertex lighting banded the same way). So by default the fragment splits what it has: the albedo is diffuseColor.rgb (the
// vertex colour times the material's, in scope at fog_fragment in r128's Lambert and Phong), the light is what is left after dividing it out; the albedo
// alone is extrapolated to the cell, posterised and grained, and the smooth light multiplies back — colour in cells, light continuous, countershade
// still banded since it is in the vertex colour. `banded light` on the effects list (uTexL, texLU) is the v11.41 look, kept to compare.
// v11.41.3: the person on the smooth light — "rainbow sherbet", the ground's colour patches frozen and the light no longer read as light. So the posterise is
// dithered instead: a 2×2 Bayer offset per cell (bd: 1/8, 5/8, 7/8, 3/8 on the cell's parity) in place of the half-step rounding, in both modes — a tone
// boundary becomes a checkered band of cells instead of a rigid contour, the way pixel art has always drawn a gradient. Banded light is the default again.
// the grid varying (vertex): the position before the model and instance matrices, read at begin_vertex (before the sway, the collapse, the wave), scaled
// to metres by the object's and the instance's scale; 'world' takes the world position instead so the cells' terrain and the far terrain share one grid
const PIX_GRID_V=grid=>grid==='world'?'vGrid=(modelMatrix*wpp).xyz;':'vGrid=pGrid*vec3(length(modelMatrix[0].xyz),length(modelMatrix[1].xyz),length(modelMatrix[2].xyz));\n#ifdef USE_INSTANCING\nvGrid*=vec3(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz),length(instanceMatrix[2].xyz));\n#endif\n';
(function(){ // the bake: for each ring, the lattice vectors in its band, one train per direction bin within the spread, then the tiles
  const rng=mulberry(1717),T=CAU_TILE,N=CAU_N,nmax=Math.ceil(T/CAU_RINGS[CAU_RINGS.length-1][0]*1.25)+1;
  for(let r=0;r<Math.min(Q.cau,CAU_RINGS.length);r++){const L=CAU_RINGS[r][0],A0=CAU_RINGS[r][1],trains=[];
    const bins=new Array(CAU_DIRS).fill(null);
    for(let nx=-nmax;nx<=nmax;nx++)for(let nz=-nmax;nz<=nmax;nz++){const nn=Math.hypot(nx,nz);if(nn<0.5)continue;const l=T/nn;if(Math.abs(l/L-1)>0.18)continue;
      let a=Math.atan2(nz,nx)-WIND_A;a=Math.atan2(Math.sin(a),Math.cos(a));if(Math.abs(a)>CAU_SPREAD)continue;
      const b=Math.min(CAU_DIRS-1,Math.floor((a+CAU_SPREAD)/(2*CAU_SPREAD)*CAU_DIRS)),err=Math.abs(l/L-1);if(!bins[b]||err<bins[b].err)bins[b]={nx:nx,nz:nz,a:a,err:err};}
    for(const b of bins)if(b){const k=TAU*Math.hypot(b.nx,b.nz)/T,dx=b.nx/Math.hypot(b.nx,b.nz),dz=b.nz/Math.hypot(b.nx,b.nz),A=A0*(0.6+0.4*Math.cos(b.a))*(0.7+0.6*rng());trains.push({kx:TAU*b.nx/T,kz:TAU*b.nz/T,c:-A*k*k,dx:dx,dz:dz,ph:rng()*TAU});}
    const S=new Uint8Array(N*N*4),C=new Uint8Array(N*N*4),G=new Uint8Array(N*N*4),q=127.5/CAU_HMAX;
    let sm=0;for(const w of trains)sm+=Math.abs(w.c)/Math.hypot(w.kx,w.kz);sm=Math.max(sm,1e-4);const qg=127.5/sm; // the ring's slope scale: Σ A·k (|c| = A k², over k) — the gradient tile's full range (v11.46)
    for(let j=0;j<N;j++)for(let i=0;i<N;i++){const x=(i+0.5)/N*T,z=(j+0.5)/N*T;let sxx=0,sxy=0,szz=0,cxx=0,cxy=0,czz=0,gsx=0,gsz=0,gcx=0,gcz=0;
      for(const w of trains){const p=x*w.kx+z*w.kz+w.ph,s=Math.sin(p)*w.c,c=Math.cos(p)*w.c,ak=-w.c/Math.hypot(w.kx,w.kz);sxx+=s*w.dx*w.dx;sxy+=s*w.dx*w.dz;szz+=s*w.dz*w.dz;cxx+=c*w.dx*w.dx;cxy+=c*w.dx*w.dz;czz+=c*w.dz*w.dz;gsx+=Math.sin(p)*ak*w.dx;gsz+=Math.sin(p)*ak*w.dz;gcx+=Math.cos(p)*ak*w.dx;gcz+=Math.cos(p)*ak*w.dz;}
      const o=(j*N+i)*4;S[o]=clamp(sxx*q+127.5,0,255);S[o+1]=clamp(sxy*q+127.5,0,255);S[o+2]=clamp(szz*q+127.5,0,255);S[o+3]=255;C[o]=clamp(cxx*q+127.5,0,255);C[o+1]=clamp(cxy*q+127.5,0,255);C[o+2]=clamp(czz*q+127.5,0,255);C[o+3]=255;
      G[o]=clamp(gsx*qg+127.5,0,255);G[o+1]=clamp(gsz*qg+127.5,0,255);G[o+2]=clamp(gcx*qg+127.5,0,255);G[o+3]=clamp(gcz*qg+127.5,0,255);} // the gradient tile (v11.46, the glitter): the slope's sin part (rg) and cos part (ba) of the same trains — h = Σ A sin(p − ωt), so ∇h = Σ A k dir (cos p cos ωt + sin p sin ωt)
    const mk=d=>{const t=new THREE.DataTexture(d,N,N,THREE.RGBAFormat,THREE.UnsignedByteType);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.minFilter=t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;t.needsUpdate=true;t.clone=function(){return this;};return t;};
    CAU_TEX.push({L:L,w:Math.sqrt(9.8*TAU/L),n:trains.length,s:mk(S),c:mk(C),g:mk(G),sm:sm});}
  {const G=CAU_GN,D=new Uint8Array(G*G*4),sc=CAU_GUST[0];for(let j=0;j<G;j++)for(let i=0;i<G;i++){const o=(j*G+i)*4;let v=0,w=0;for(let k=0;k<3;k++){const f=1<<k;v+=fbm(((i/G)*f%1)*sc*0.035+40,((j/G)*f%1)*sc*0.035+70,2)/f;w+=1/f;}v=clamp((v/w-0.5)*4.0+0.5,0,1);D[o]=D[o+1]=D[o+2]=Math.round(v*255);D[o+3]=255;}
    const t=new THREE.DataTexture(D,G,G,THREE.RGBAFormat,THREE.UnsignedByteType);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.minFilter=t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;t.needsUpdate=true;t.clone=function(){return this;};CAU_GTEX=t;} // the gust tile: three octaves of the world's value noise, wrapped by taking each octave's coordinate mod 1 of the tile (a seam per octave that the blur hides), stretched to fill 0..1
})();
// The ripples' slope at a surface point, for the glitter (v11.46, WATER.md F): the same trains the caustic is drawn from — "the ripple layer that lives only in the
// light" (PLANET, 14 Sep) — read as a gradient from the tiles' rg/ba parts at the ring's phase, carried by the swell as the caustic's are, gusted by the same
// patches (cat's paws are exactly what glitter shows), each ring faded where its wavelength is under a few pixels (RIP_FAR: the caustic's own CAU_FAR, in
// metres of distance per metre of wavelength). The surface's fragment tilts the normal the *specular* sees by it (GLIT_K), and nothing else: the reflected sky
// and the Fresnel keep the facet, the mesh holds no ripples. Uniforms bound by SURF_MAT: uCauR<i>, uCauG, uWindOff, uChop.
const RIP_FAR=[30,70],GLIT_K=1.0;
const RIP_CAP=[[0.22,0.10,-0.5],[0.15,0.09,0.3],[0.11,0.08,0.9]]; // slopes to a Cox–Munk rms of ~0.16 rad at 7 m/s (the first cut at half this left the lobe whole: one grey oval per near facet, seen) // the capillary ripples (v11.46): [wavelength m, slope rad, direction off the wind] — the cm-scale roughness a 7 m/s wind raises on every wave, which the caustic's rings stop short of (0.5 m: the net's scale) and which is what makes a sea *sparkle* rather than sheen; analytic in the fragment with the capillary dispersion (σ/ρ 7.4e-5), each faded where its phase turns more than ~1 rad a pixel, so they live within ~10 m of the eye, where the rings' smooth slopes gave one soft oval per facet (seen). Wind-scaled by uChop like the rings
const RIP_PARS=CAU_TEX.map((r,i)=>'uniform sampler2D uCauR'+i+';').join('')+'uniform sampler2D uCauG;uniform vec2 uWindOff;';
function ripGLSL(name,caps){let s='vec2 '+name+'(vec2 wp,float dist,float ct){vec2 ps=wp;'; // caps: with the capillary trains (the glitter's ripSlope) or the rings alone (ripSlopeR, v11.51: the underside's refraction — a capillary 0.11–0.22 m long is 4–8 px from 17 m and shifts the image by more than that, so the sky folded into an interlace of stripes; the rings are 0.5 m and up and shift it by a fraction of themselves)
  for(let i=0;i<CAU_SWELL;i++){const w=WAVES[i];s+='ps+=vec2('+w.dx.toFixed(5)+','+w.dz.toFixed(5)+')*('+w.A.toFixed(3)+(w.L<20?'*uChop':'')+'*sin(dot(ps,vec2('+w.dx.toFixed(5)+','+w.dz.toFixed(5)+'))*'+w.k.toFixed(5)+'-'+w.w.toFixed(5)+'*ct+'+w.ph.toFixed(4)+'));';}
  s+='vec2 cu=ps*'+(1/CAU_TILE).toFixed(6)+';float gu=1.0-'+CAU_GUST[1].toFixed(2)+'*(1.0-texture2D(uCauG,(ps-uWindOff)*'+(1/CAU_GUST[0]).toFixed(6)+').r);vec2 sl=vec2(0.0);';
  for(let i=0;i<CAU_TEX.length;i++){const r=CAU_TEX[i];s+='{float g=1.0-smoothstep('+(r.L*RIP_FAR[0]).toFixed(1)+','+(r.L*RIP_FAR[1]).toFixed(1)+',dist);if(g>0.002){float ph='+r.w.toFixed(5)+'*ct;vec4 t=texture2D(uCauR'+i+',cu)*2.0-1.0;sl+=(t.ba*cos(ph)+t.rg*sin(ph))*('+r.sm.toFixed(4)+'*g*gu);}}';}
  if(caps)for(const c of RIP_CAP){const k=TAU/c[0],w=Math.sqrt(9.8*k+7.4e-5*k*k*k),a=WIND_A+c[2],dx=Math.cos(a),dz=Math.sin(a);s+='{float ph=dot(wp,vec2('+dx.toFixed(5)+','+dz.toFixed(5)+'))*'+k.toFixed(4)+'-'+w.toFixed(4)+'*ct+'+(c[2]*5.1).toFixed(3)+';sl+=vec2('+dx.toFixed(5)+','+dz.toFixed(5)+')*('+c[1].toFixed(3)+'*cos(ph))*(1.0-smoothstep(0.8,1.6,fwidth(ph)));}';}
  return s+'return sl*uChop;}\n';}
const RIP_GLSL=ripGLSL('ripSlope',true)+ripGLSL('ripSlopeR',false);
// The focusing at a surface point, now, on the CPU (v11.39): the shader's math over the same tiles — the swell carry, the gust, the rings' sin/cos parts at
// their phases, the sun-disc blur, det J. The light shafts read it at their heads (atmosphere.js updateShafts): a shaft is a beam the surface focused, so its
// brightness is the same field the floor's net is drawn from — one clock for both, and the audit's "four clocks for one surface" is down to the shimmer.
function cauFocus(x,z,dep,t){
  let px=x,pz=z;const wf=waveFac(x,z,_wfac);for(let i=0;i<CAU_SWELL;i++){const w=WAVES[i],a=wf[i]*Math.sin((px*w.dx+pz*w.dz)*w.k-w.w*t+w.ph);px+=w.dx*a;pz+=w.dz*a;} // the amplitude now (v11.44: shoaled, sheltered, capped — world.js waveFac)
  const G=CAU_GN,gd=CAU_GTEX.image.data,gs=1/CAU_GUST[0],gx=((px-windOffU.value.x)*gs%1+1)%1,gz=((pz-windOffU.value.y)*gs%1+1)%1,gu=1-CAU_GUST[1]*(1-gd[((Math.floor(gz*G)%G)*G+Math.floor(gx*G)%G)*4]/255);
  const N=CAU_N,u=((px/CAU_TILE)%1+1)%1,v=((pz/CAU_TILE)%1+1)%1,o=((Math.floor(v*N)%N)*N+Math.floor(u*N)%N)*4,q=CAU_HMAX/127.5;let hxx=0,hxy=0,hzz=0;
  for(const r of CAU_TEX){const g=Math.exp(-dep*dep*2*Math.pow(Math.PI*CAU_SUN/r.L,2))*gu;if(g<0.002)continue;const S=r.s.image.data,C=r.c.image.data,ph=r.w*t,cp=Math.cos(ph)*g*q,sp=Math.sin(ph)*g*q;
    hxx+=(S[o]-127.5)*cp-(C[o]-127.5)*sp;hxy+=(S[o+1]-127.5)*cp-(C[o+1]-127.5)*sp;hzz+=(S[o+2]-127.5)*cp-(C[o+2]-127.5)*sp;}
  const jc=dep*0.248*SEA_CHOP,dj=(1-jc*hxx)*(1-jc*hzz)-jc*jc*hxy*hxy;return 1/Math.max(Math.abs(dj),0.02);
}
const CAU_PARS=CAU_TEX.map((r,i)=>'uniform sampler2D uCauS'+i+';uniform sampler2D uCauC'+i+';').join('')+'uniform sampler2D uCauG;uniform float uPix;uniform float uTex;uniform float uTexL;uniform vec2 uWindOff;';
const CAU_GLSL=(function(){let s='vec2 ps=vFogPos.xz+uSunW.xz*(dep/max(uSunW.y,0.3));vec3 H=vec3(0.0);float ct='+(CAU_STEP>0?'floor(uTime*'+CAU_STEP.toFixed(1)+')/'+CAU_STEP.toFixed(1):'uTime')+';';
  // the ripples ride the swell: the surface's horizontal orbital displacement (A sin, along the wave) carries the ripple field with it — for a 1.6 m ripple on a 46 m swell of 0.5 m that is ~2 rad of phase, and it is what keeps three fixed trains from interfering into a lattice (seen, 13 Sep)
  for(let i=0;i<CAU_SWELL;i++){const w=WAVES[i];s+='ps+=vec2('+w.dx.toFixed(5)+','+w.dz.toFixed(5)+')*('+w.A.toFixed(3)+(w.L<20?'*uChop':'')+'*sin(dot(ps,vec2('+w.dx.toFixed(5)+','+w.dz.toFixed(5)+'))*'+w.k.toFixed(5)+'-'+w.w.toFixed(5)+'*ct+'+w.ph.toFixed(4)+'));';}
  if(CAU_PX>0)s+='if(uPix>0.5)ps=(floor(ps*'+(1/CAU_PX).toFixed(4)+')+0.5)*'+CAU_PX.toFixed(4)+';';
  s+='vec2 cu=ps*'+(1/CAU_TILE).toFixed(6)+';float gu=1.0-'+CAU_GUST[1].toFixed(2)+'*(1.0-texture2D(uCauG,(ps-uWindOff)*'+(1/CAU_GUST[0]).toFixed(6)+').r);'; // the gust at this point; the patches drift downwind at the wind's speed (v11.39: cat's paws move — uWindOff is the wind's integral, atmosphere.js)
  for(let i=0;i<CAU_TEX.length;i++){const r=CAU_TEX[i]; // each ring: the field now from its two tiles, blurred by the sun's disc at depth and faded from the eye, both by its wavelength
    s+='{float ph='+r.w.toFixed(5)+'*ct;float g=exp(-dep*dep*'+(2*Math.pow(Math.PI*CAU_SUN/r.L,2)).toFixed(6)+')*(1.0-smoothstep('+(r.L*CAU_FAR[0]).toFixed(1)+','+(r.L*CAU_FAR[1]).toFixed(1)+',vFogDepth));'+
      'if(g>0.002)H+=((texture2D(uCauS'+i+',cu).rgb*2.0-1.0)*cos(ph)-(texture2D(uCauC'+i+',cu).rgb*2.0-1.0)*sin(ph))*('+CAU_HMAX.toFixed(3)+'*g*gu);}';}
  s+='float jc=dep*0.248*uChop;float dj=(1.0-jc*H.x)*(1.0-jc*H.z)-jc*jc*H.y*H.y;'+
    'float cf=1.0/max(abs(dj),0.02);float ci=1.0+exp(-dep/'+CAU_D.toFixed(1)+')*('+(CAU_HI-1).toFixed(2)+'*(uPix>0.5?step('+CAU_T.toFixed(2)+',cf):smoothstep('+(CAU_T-CAU_SOFT).toFixed(2)+','+(CAU_T+CAU_SOFT).toFixed(2)+',cf))-'+CAU_DARK.toFixed(2)+'*(1.0-min(cf,1.0)));';
  return s;})();
const SHM_R=Q.tier==='low'?40:64,SHM_D=120,SHM_BIAS=0.3; // the box's half-side, its half-depth along the light, the depth bias in metres
const SHM_P=new Float32Array([0,0,0,0]),SHM_L=new Float32Array([0,1,0,2*SHM_D]); // uShP: texel size (map units), on, bias (depth units), the receiver's normal offset (m); uShL: the map's light direction, its depth range in metres
const shMapU={value:null},shMatU={value:sun.shadow.matrix},shPU={value:SHM_P},shLU={value:SHM_L};
function shadowSize(){return (Q.tier==='low'?1024:2048)*(FX.sharp?2:1);}
sun.castShadow=true;sun.shadow.bias=0;sun.shadow.camera.up.set(0,0,1);
{const c=sun.shadow.camera;c.left=-SHM_R;c.right=SHM_R;c.top=SHM_R;c.bottom=-SHM_R;c.near=1;c.far=2*SHM_D+1;c.updateProjectionMatrix();}
renderer.shadowMap.enabled=false;renderer.shadowMap.type=THREE.BasicShadowMap; // enabled per frame by updateShadow; Basic: a plain depth pass (the filtering is ours)
function setShadowSize(L){L=L||sun;const n=shadowSize();if(L.shadow.mapSize.x===n)return;L.shadow.mapSize.set(n,n);dropShadowMap(L);} // three makes the map again at the next shadow pass
function dropShadowMap(L){if(L.shadow.map){L.shadow.map.dispose();L.shadow.map=null;}}
function castOn(g){g.traverse(o=>{if(o.isMesh)o.castShadow=true;});} // a built creature casts: the menu's, the bestiary's, the lab's, every spawn
const SHM_BEST=[];for(let i=0;i<Q.casters;i++)SHM_BEST.push({c:null,s:0});
// The box's frame (v11.30, shared with the static map below): SH_F holds x (0..2), y (3..5) and z = the light (6..8). The light: the
// refracted sun under water and the true one in air, blended by the crossing; under cloud the key rises to the zenith. z the light,
// x = up × z with up north (as three's lookAt builds it), y = z × x. The light along north itself never happens (its track is
// east–west); guarded anyway. shadowCentre snaps a point to the map's texels in that frame (out: xyz), so the shadows don't crawl.
const SH_F=new Float32Array(9);
function shadowFrame(){
  const K=SKY,k=medK,zen=(1-k)*(1-clamp(K.lumL/Math.max(K.lumLw,1e-4),0,1));
  let lx=(SUN_W[0]*(1-k)+K.lum.x*k)*(1-zen),ly=(SUN_W[1]*(1-k)+K.lum.y*k)*(1-zen)+zen,lz=(SUN_W[2]*(1-k)+K.lum.z*k)*(1-zen);
  let ll=Math.sqrt(lx*lx+ly*ly+lz*lz);if(!(ll>1e-4)){lx=0;ly=1;lz=0;ll=1;}lx/=ll;ly/=ll;lz/=ll;
  let xx=-ly,xy=lx,xz=0,xl=Math.hypot(xx,xy);if(xl<1e-4){xx=1;xy=0;xl=1;}xx/=xl;xy/=xl;
  SH_F[0]=xx;SH_F[1]=xy;SH_F[2]=xz;SH_F[3]=ly*xz-lz*xy;SH_F[4]=lz*xx-lx*xz;SH_F[5]=lx*xy-ly*xx;SH_F[6]=lx;SH_F[7]=ly;SH_F[8]=lz;
}
function shadowCentre(cx,cy,cz,tx,out){
  const F=SH_F,px=Math.round((cx*F[0]+cy*F[1]+cz*F[2])/tx)*tx,py=Math.round((cx*F[3]+cy*F[4]+cz*F[5])/tx)*tx,pz=cx*F[6]+cy*F[7]+cz*F[8];
  out[0]=F[0]*px+F[3]*py+F[6]*pz;out[1]=F[1]*px+F[4]*py+F[7]*pz;out[2]=F[2]*px+F[5]*py+F[8]*pz;
}
const SH_C=new Float32Array(3);
function updateShadow(){
  setShadowSize();
  const on=FX.shadows&&LIGHT_K[1]>0;renderer.shadowMap.enabled=on;SHM_P[1]=on&&sun.shadow.map?1:0;shadowFrame();if(!on){if(sun.shadow.map){dropShadowMap(sun);shMapU.value=null;}return;} // off: the map freed (v11.52; the 13 Sep audit — it was kept at 16 MB, 67 sharp, for nothing)
  const N=sun.shadow.mapSize.x;SHM_P[0]=1/N;SHM_P[2]=SHM_BIAS/(2*SHM_D);SHM_P[3]=2*(2*SHM_R/N);
  const lx=SH_F[6],ly=SH_F[7],lz=SH_F[8];SHM_L[0]=lx;SHM_L[1]=ly;SHM_L[2]=lz;
  // the centre: ahead of the camera by 0.45 of the box, snapped to the map's texels in the box's frame
  const e=camera.matrixWorld.elements;let fx=-e[8],fz=-e[10];const fl=Math.hypot(fx,fz)||1;fx/=fl;fz/=fl;
  shadowCentre(camera.position.x+fx*SHM_R*0.45,camera.position.y,camera.position.z+fz*SHM_R*0.45,2*SHM_R/N,SH_C);const cx=SH_C[0],cy=SH_C[1],cz=SH_C[2];
  sun.position.set(cx+lx*SHM_D,cy+ly*SHM_D,cz+lz*SHM_D);sun.target.position.set(cx,cy,cz);sun.target.updateMatrixWorld();
  shMapU.value=sun.shadow.map?sun.shadow.map.texture:null;
  // which creatures cast: the nearest Q.casters bodies by size (distance less eight times the size, so the abyssal 60 m overhead
  // outranks the darters at the camera), within the box's reach; the rest are switched off so the depth pass stays small
  const room=Q.casters;let m=0;
  for(const c of creatures){if(!c.shM)continue;if(!c.alive||c.gone||!c.g.visible){if(c.cast)castSet(c,false);continue;}const sz=c.def.size||1,dx=c.pos.x-cx,dy=c.pos.y-cy,dz=c.pos.z-cz,d=Math.sqrt(dx*dx+dy*dy+dz*dz);
    if(d>SHM_R+SHM_D*0.5+sz*4){if(c.cast)castSet(c,false);continue;}const s=d-sz*8;
    if(m<room){SHM_BEST[m].c=c;SHM_BEST[m].s=s;m++;}else{let w=0;for(let i=1;i<m;i++)if(SHM_BEST[i].s>SHM_BEST[w].s)w=i;if(s<SHM_BEST[w].s){if(SHM_BEST[w].c.cast)castSet(SHM_BEST[w].c,false);SHM_BEST[w].c=c;SHM_BEST[w].s=s;}else if(c.cast)castSet(c,false);}}
  for(let i=0;i<m;i++)if(!SHM_BEST[i].c.cast)castSet(SHM_BEST[i].c,true);
}
function castSet(c,on){c.cast=on;for(const o of c.shM)o.castShadow=on;}
// ---------- the world's shadows (v11.30): a second map for what does not move, rendered only when something has changed ----------
// The creatures' map above is redrawn every frame because they move. The flora, the rock, the structures and the ground don't, so
// their map (`sunS`, a DirectionalLight that is never in the scene — it lights nothing; only its shadow is used) is rendered by hand,
// — a render of the scene through `camS`, an orthographic camera on layer 1 looking at an empty box 500 km up, into a 4×4 target:
// three's depth pass can only run inside renderer.render (r128's setProgram reads the render state that render sets up), and this
// render draws nothing (every static caster is frustum-culled by `shBounds`, its cell's sphere, against camS's empty box — r128's
// Frustum.intersectsObject is patched below to read it — while the depth pass tests the same sphere against the light's box, a
// better cull than a cell's overlap test) and casts everything on layer 1 into sunS's map (sunS sits on layer 1 in the scene: the
// main camera never projects it, so it is neither a light nor a shadow to anything the person looks at) — and only when: the light has turned SHS_ANG
// (0.005 rad, ~0.3°; the sun does that in ~2 s by day — the tip of a 30 m shadow moves 15 cm, two texels), the camera has drifted
// SHS_MOVE (20 m; the box is SHS_R 80 either side of the camera itself — not ahead of it, so turning round moves nothing), a cell inside
// the box has loaded or gone, a switch flipped, or the map is missing. Between refreshes it costs the fragment its taps and nothing else.
// A refresh is a spike: every instanced mesh of every cell the box overlaps is drawn once (an instanced mesh can't be drawn by halves,
// so a cell at the box's corner still submits all of it — ~4 cells at noon, ~8 at a low sun); the readout shows it (`shsMs`, `shsN`).
// Casters: the cells' instanced flora and rock (`ch.flora`, chunks.js makeInstanced), drawn at rest through `depthFor` (a MeshDepthMaterial
// with the species' own vertex code under DEPTH_PASS: the variant collapse and the lean to the current kept, the sway, the bodies' pushes,
// the wave and the breathing dropped — a shadow that swayed only at each refresh would jump; still is better), the structures through a
// per-cell proxy on layer 1 only (`ch.shBig`, chunks.js placeBigSolids: the far layer's region meshes hold a whole region's structures
// and are never drawn into it), the landmarks (far.js LMK), and the ground itself (`ch.terrain`, the cell's mesh; a cliff's shadow on
// the sand; its own switch). Everything static sits on layer 1 as well as 0 and casts only while `castShadow` is true; the pass sets
// it on the casters inside the box, renders through `camS` (layer 1 only, so the creatures on layer 0 stay out of the map), and sets
// it off again before three's own pass runs in renderer.render — so the per-frame depth pass stays the creatures' few dozen draws.
// The depth programs are compiled at boot behind the fade (main.js warmShaders runs one forced pass over its warm-up meshes) so the
// switch does not stall the first time. The fragment reads both maps (uShMapS, uShMatS, uShPS, uShLS) and keeps the darker.
// Off (the default): the map is disposed (16 MB at 2048², 67 MB sharp), uShPS.y 0, the fragment's branch skipped.
const SHS_R=Q.tier==='low'?50:80,SHS_MOVE=20,SHS_ANG=0.005,SHS_GAP=0.25; // the box's half-side, the drift that refreshes, the light's turn that refreshes, the least time between refreshes
const SHS_P=new Float32Array([0,0,0,0]),SHS_L=new Float32Array([0,1,0,2*SHM_D]);
const sunS=new THREE.DirectionalLight(0x000000,0);sunS.castShadow=true;sunS.shadow.bias=0;sunS.shadow.camera.up.set(0,0,1);sunS.layers.set(1);scene.add(sunS); // in the scene (three renders a map for a light it projected), on layer 1 (the main camera projects nothing there)
{const c=sunS.shadow.camera;c.left=-SHS_R;c.right=SHS_R;c.top=SHS_R;c.bottom=-SHS_R;c.near=1;c.far=2*SHM_D+1;c.updateProjectionMatrix();}
const shMapSU={value:null},shMatSU={value:sunS.shadow.matrix},shPSU={value:SHS_P},shLSU={value:SHS_L};
const camS=new THREE.OrthographicCamera(-1,1,1,-1,0.1,2);camS.layers.set(1);camS.position.set(0,5e5,0);camS.updateMatrixWorld(); // the pass's render: layer 1, a 2 m box 500 km up with nothing in it
const shsRT=new THREE.WebGLRenderTarget(4,4); // where that render's (empty) picture goes; the map is its own target
hemi.layers.enable(1);plight.layers.enable(1);for(const l of lightPool)l.layers.enable(1); // the pass's render projects the same count of each kind of light as the main one (sunS for sun), so three's light-state hash — and every material's program binding — is untouched by it
const _fio=THREE.Frustum.prototype.intersectsObject; // r128: the object's geometry sphere by its matrixWorld — useless for an instanced mesh, whose instances are anywhere; shBounds is the mesh's real sphere
THREE.Frustum.prototype.intersectsObject=function(o){return o.shBounds?this.intersectsSphere(o.shBounds):_fio?_fio.call(this,o):true;};
let shsDirty=true,shsT=0,shsMs=0,shsN=0;const SHS_C=new Float32Array([1e9,0,0]),SHS_LD=new Float32Array(3);
function shadowDirty(ch){if(!ch||cellInBox(ch,SHS_C,SHS_R+SHS_MOVE))shsDirty=true;} // a cell far from the box changes nothing in it
// does the cell's box (x0..x0+CELL, minH..maxH, z0..z0+CELL) overlap the shadow box round c? The cell's corners projected on the box's
// three axes — a separating-axis test on the box's axes alone, so it can say yes to a cell that only nearly touches, never no to one that does
function cellInBox(ch,c,R){
  const F=SH_F,x0=ch.x0-c[0],x1=x0+CELL,z0=ch.z0-c[2],z1=z0+CELL,y0=ch.minH-c[1],y1=Math.max(ch.maxH,0)+60-c[1];
  for(let a=0;a<3;a++){const ax=F[a*3],ay=F[a*3+1],az=F[a*3+2],lim=a<2?R:SHM_D;let lo=1e9,hi=-1e9;
    for(let k=0;k<8;k++){const p=(k&1?x1:x0)*ax+(k&2?y1:y0)*ay+(k&4?z1:z0)*az;if(p<lo)lo=p;if(p>hi)hi=p;}
    if(hi<-lim||lo>lim)return false;}
  return true;
}
const depthCache=new Map();
function depthFor(mat){ // the depth material for a tinted material: its own vertex code (onBeforeCompile) under DEPTH_PASS, three's RGBA depth (what shDepth unpacks)
  let d=depthCache.get(mat);if(d)return d;
  d=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking});d.defines={DEPTH_PASS:1};
  if(mat.onBeforeCompile)d.onBeforeCompile=mat.onBeforeCompile;
  const key=mat.customProgramCacheKey?mat.customProgramCacheKey():'';d.customProgramCacheKey=function(){return key+'depth';};
  depthCache.set(mat,d);return d;
}
function shadowCaster(o,mat,bounds){o.layers.enable(1);o.customDepthMaterial=depthFor(mat);if(bounds){o.shBounds=bounds;o.frustumCulled=true;}return o;} // an object that may cast into the world's map; bounds: its world sphere (an instanced mesh: its cell's), for the cull
const shsVis=[];
function updateShadowS(dt,force){ // after updateShadow (shadowFrame has run); force: the warm-up's one pass over its meshes
  const on=force||((FX.statics||FX.ground)&&LIGHT_K[1]>0);
  if(!on){SHS_P[1]=0;if(sunS.shadow.map){dropShadowMap(sunS);shMapSU.value=null;shsDirty=true;}return;}
  setShadowSize(sunS);shsT-=dt;
  const F=SH_F,lx=F[6],ly=F[7],lz=F[8],p=camera.position,dx=p.x-SHS_C[0],dy=p.y-SHS_C[1],dz=p.z-SHS_C[2],dl=lx-SHS_LD[0],dm=ly-SHS_LD[1],dn=lz-SHS_LD[2];
  const need=force||!sunS.shadow.map||(shsT<=0&&(shsDirty||dx*dx+dy*dy+dz*dz>SHS_MOVE*SHS_MOVE||dl*dl+dm*dm+dn*dn>SHS_ANG*SHS_ANG));
  SHS_P[1]=sunS.shadow.map?1:0;if(!need)return;
  const t0=performance.now(),N=sunS.shadow.mapSize.x;SHS_P[0]=1/N;SHS_P[2]=SHM_BIAS/(2*SHM_D);SHS_P[3]=2*(2*SHS_R/N);
  SHS_L[0]=lx;SHS_L[1]=ly;SHS_L[2]=lz;SHS_LD[0]=lx;SHS_LD[1]=ly;SHS_LD[2]=lz;
  shadowCentre(p.x,p.y,p.z,2*SHS_R/N,SHS_C);const cx=SHS_C[0],cy=SHS_C[1],cz=SHS_C[2];
  sunS.position.set(cx+lx*SHM_D,cy+ly*SHM_D,cz+lz*SHM_D);sunS.target.position.set(cx,cy,cz);sunS.updateMatrixWorld();sunS.target.updateMatrixWorld();
  // the casters on: the cells the box overlaps (made visible for the pass — cullChunks hides what is behind the camera, and a kelp
  // behind you casts ahead of you), the landmarks within reach
  const st=force||FX.statics,gr=force||FX.ground;shsVis.length=0;
  for(const ch of chunks.values()){if(!cellInBox(ch,SHS_C,SHS_R))continue;shsVis.push(ch,ch.group.visible);ch.group.visible=true;
    if(st){for(const m of ch.flora)m.castShadow=true;for(const m of ch.shBig)m.castShadow=true;}if(gr&&ch.terrain)ch.terrain.castShadow=true;}
  if(st)for(const P of POOLS.values()){P.im.castShadow=true;P.im.count=P.n;} // the species pools (v11.52, chunks.js): every loaded cell's small flora and rock at once — the blocks out of sight too (v11.52.1), a kelp behind you casts ahead
  if(st)for(const m of LMK.meshes){const q=m.position;if(Math.abs(q.x-cx)<SHS_R+SHM_D&&Math.abs(q.z-cz)<SHS_R+SHM_D)m.castShadow=true;}
  const en=renderer.shadowMap.enabled,rt=renderer.getRenderTarget();renderer.shadowMap.enabled=true;
  try{renderer.setRenderTarget(shsRT);renderer.render(scene,camS);}catch(e){console.warn('world shadows: '+e.message);}
  renderer.setRenderTarget(rt);renderer.shadowMap.enabled=en;
  for(let i=0;i<shsVis.length;i+=2){const ch=shsVis[i];ch.group.visible=shsVis[i+1];for(const m of ch.flora)m.castShadow=false;for(const m of ch.shBig)m.castShadow=false;if(ch.terrain)ch.terrain.castShadow=false;}
  for(const m of LMK.meshes)m.castShadow=false;for(const P of POOLS.values()){P.im.castShadow=false;P.im.count=P.nVis;}shsVis.length=0;
  shMapSU.value=sunS.shadow.map?sunS.shadow.map.texture:null;SHS_P[1]=sunS.shadow.map?1:0;
  shsDirty=false;shsT=SHS_GAP;shsN++;shsMs=performance.now()-t0;
}
// one map's shadow (v11.30, the same code for both): `s` names the uniform set ('' the creatures' uShMap/uShMat/uShP/uShL, 'S' the world's)
const SHM_PEN=[1.0,0.025]; // the penumbra (v11.52): the tap square's radius in texels at the caster and its widening per metre of caster distance — 1.5 and 0.05 to v11.51; the 13 Sep audit called the soft edge the foreign half of an otherwise in-style shadow and the person (15 Sep) said harden it: both halved, unseen
const SH_GLSL=s=>'if(uShP'+s+'.y>0.5){vec3 sp=pxp+fn*(uShP'+s+'.w*sign(dot(fn,uShL'+s+'.xyz)));vec4 sc=uShMat'+s+'*vec4(sp,1.0);'+ // the receiver stepped off its face along the light's side of it (no acne on a facet edge-on to the light)
  'float ef=smoothstep(0.0,0.07,min(min(sc.x,1.0-sc.x),min(sc.y,1.0-sc.y)));if(ef>0.0&&sc.z<1.0){float z=sc.z-uShP'+s+'.z;float fd=mix(300.0,35.0,wd);'+
  'float dm=max(z-shDepth(texture2D(uShMap'+s+',sc.xy)),0.0)*uShL'+s+'.w;float rr=uShP'+s+'.x*('+SHM_PEN[0].toFixed(2)+'+'+SHM_PEN[1].toFixed(3)+'*dm);vec2 o1=vec2(rr,0.4*rr),o2=vec2(-0.4*rr,rr);'+
  'float u=uPix>0.5?4.0*shTap(uShMap'+s+',sc.xy,z,fd):shTap(uShMap'+s+',sc.xy+o1,z,fd)+shTap(uShMap'+s+',sc.xy-o1,z,fd)+shTap(uShMap'+s+',sc.xy+o2,z,fd)+shTap(uShMap'+s+',sc.xy-o2,z,fd);'+ // pixel light (v11.38): one hard tap at the snapped point
  'sh=min(sh,1.0-0.25*u*ef);}}';
const LIGHT_GLSL=LIGHT_FX?'\n#ifdef USE_FOG\n{float dep=uTint.x-vFogPos.y;if(uSunW.w>0.002){vec3 fn=normalize(cross(dFdx(vFogPos),dFdy(vFogPos)));float wd=clamp(dep*0.7-0.2,0.0,1.0);'+ // 0 in air and at the surface itself (a raft's pad at -0.45 barely), full 1.7 m under
  'if(wd>0.0&&uLightK.x>0.0){'+CAU_GLSL+'float cw=texture2D(uWaterMap,vFogPos.xz*'+WM_SCALE+'+0.5).a*'+CAN_GLSL('vFogPos.y')+';float nc=clamp(dot(fn,uSunW.xyz)*2.5,0.0,1.0);'+
  'gl_FragColor.rgb*=1.0+uLightK.x*(ci-1.0)*wd*nc*uSunW.w*(1.0-0.85*cw);}'+ // the fade from the eye is per train (CAU_FAR, in wavelengths: a 0.4 m train is gone by 28 m, the 2 m one by 140)
  'vec3 pxp=vFogPos;if(uPix>0.5&&abs(fn.y)>0.3){vec2 q=(floor(vFogPos.xz*'+(1/CAU_PX).toFixed(4)+')+0.5)*'+CAU_PX.toFixed(4)+';pxp=vec3(q.x,vFogPos.y-(fn.x*(q.x-vFogPos.x)+fn.z*(q.y-vFogPos.z))/fn.y,q.y);}'+ // the receiver snapped to the caustic's grid, along its face (v11.38)
  'float sh=1.0;'+SH_GLSL('')+SH_GLSL('S')+ // the creatures' map, then the world's (v11.30): the darker of the two
  'float nl=clamp(dot(fn,uShL.xyz)*2.5,0.0,1.0);'+ // the shadow takes away the beam, so a face the beam never reached loses nothing (v11.34.1)
  'float dl='+DL_GLSL('vFogPos.y')+';gl_FragColor.rgb*=1.0-uLightK.y*(1.0-sh)*uSunW.w*dl*nl;}}\n#endif\n':'';
// shDepth: three's RGBA depth packing undone (packing.glsl's unpackRGBAToDepth, written out so no chunk is relied on); shTap: one tap of
// the map, a shadow if the caster is nearer the light than the fragment, faded by the metres between them
const LIGHT_PARS=CAU_PARS+'uniform float uTime;uniform float uChop;uniform vec4 uSunW;uniform vec2 uLightK;uniform sampler2D uShMap;uniform mat4 uShMat;uniform vec4 uShP;uniform vec4 uShL;uniform sampler2D uShMapS;uniform mat4 uShMatS;uniform vec4 uShPS;uniform vec4 uShLS;\n'+
  'float shDepth(vec4 v){return dot(v,vec4(0.99609375/16777216.0,0.99609375/65536.0,0.99609375/256.0,0.99609375));}\n'+
  'float shTap(sampler2D m,vec2 uv,float z,float fd){float dz=z-shDepth(texture2D(m,uv));return dz>0.0?exp(-dz*uShL.w/fd):0.0;}\n'; // both maps are 2·SHM_D deep, so uShL.w serves the world's too
function addTint(m,key,small,band,grid,cls){ // grid (v11.40): 'world' puts the de-res texels on the world grid; default the object's or instance's own. cls (v11.41): the texel pattern's class — terr, rock, plant, blade, card, body (PIX_CLASS)
  const prev=m.onBeforeCompile;
  m.onBeforeCompile=function(sh){
    if(prev)prev.call(m,sh);
    sh.uniforms.uTint=tintU;if(small)sh.uniforms.uFogP={value:FOG_PS};
    const lit=LIGHT_FX&&key!=='glow';if(lit){sh.uniforms.uTime=timeU;sh.uniforms.uChop=chopU;sh.uniforms.uSunW={value:SUN_W};for(let i=0;i<CAU_TEX.length;i++){sh.uniforms['uCauS'+i]={value:CAU_TEX[i].s};sh.uniforms['uCauC'+i]={value:CAU_TEX[i].c};}sh.uniforms.uCauG={value:CAU_GTEX};sh.uniforms.uPix=pixU;sh.uniforms.uTex=texU;sh.uniforms.uTexL=texLU;sh.uniforms.uWindOff=windOffU;sh.uniforms.uLightK=lightKU;sh.uniforms.uShMap=shMapU;sh.uniforms.uShMat=shMatU;sh.uniforms.uShP=shPU;sh.uniforms.uShL=shLU;sh.uniforms.uShMapS=shMapSU;sh.uniforms.uShMatS=shMatSU;sh.uniforms.uShPS=shPSU;sh.uniforms.uShLS=shLSU;}
    sh.vertexShader='varying float vWy;'+(lit?'varying vec3 vGrid;':'')+(lit&&cls==='body'?'varying vec3 vPat;\n#ifndef USE_INSTANCING\nattribute vec3 aPat;\n#endif\n':'')+'\n'+(lit?sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvec3 pGrid=transformed;'):sh.vertexShader).replace('#include <worldpos_vertex>','#include <worldpos_vertex>\n{vec4 wpp=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nwpp=instanceMatrix*wpp;\n#endif\nvWy=(modelMatrix*wpp).y;'+(lit?PIX_GRID_V(grid):'')+(lit&&cls==='body'?'\n#ifdef USE_INSTANCING\nvPat=vec3(0.0);\n#else\nvPat=aPat;\n#endif\n':'')+'}');
    sh.fragmentShader='uniform vec4 uTint;varying float vWy;'+(lit?'varying vec3 vGrid;':'')+(lit&&cls==='body'?'varying vec3 vPat;':'')+'\n'+(lit?LIGHT_PARS:'')+sh.fragmentShader.replace('#include <fog_fragment>',(lit?PIX_GLSL(grid,cls)+LIGHT_GLSL:'')+(band?BAND_GLSL(band):'')+'\n#include <fog_fragment>');
  };
  m.customProgramCacheKey=function(){return key+'tint'+(band||'')+(grid||'')+(cls||'');};
  if(LIGHT_FX&&key!=='glow')m.extensions={derivatives:true}; // dFdx/dFdy on WebGL1 (WebGL2 has them)
  return m;
}
// Translucency for thin things (v11.13): r128's Lambert lights both faces of a double-sided material in the vertex shader (vLightFront,
// vLightBack) and the fragment picks one by gl_FrontFacing. A blade, a bladder, a pen, a far card passes a share of the light on its far
// face through — the canopy from below, lit through at a sunset. `k` is the share (0.35 blades); a stipe or a trunk is not thin. If the
// chunk isn't the expected text it warns once and the material lights as before. A depth material (DEPTH_PASS, v11.30) has no Lambert chunk and is left alone.
const THIN_RE=/reflectedLight\.directDiffuse\s*=\s*\(\s*gl_FrontFacing\s*\)\s*\?\s*vLightFront\s*:\s*vLightBack\s*;/;let thinWarned=false;
function thinLight(sh,k){if(sh.defines&&sh.defines.DEPTH_PASS)return;const f=sh.fragmentShader;if(!THIN_RE.test(f)){if(!thinWarned){thinWarned=true;console.warn('thinLight: lambert chunk not as expected; blades are opaque');}return;}
  sh.fragmentShader=f.replace(THIN_RE,'reflectedLight.directDiffuse=mix((gl_FrontFacing)?vLightFront:vLightBack,(gl_FrontFacing)?vLightBack:vLightFront,'+k.toFixed(2)+');');}
const MAT=addTint(new THREE.MeshLambertMaterial({vertexColors:true}),'lam',true,undefined,undefined,'body'); // creatures, small flora (instanced: the plant class in the shader)
const MATGHOST=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false}); // the first-person body (v11.23, player.js): drawn as nothing, still cast into the shadow map
function ghostBody(g,on){g.traverse(o=>{if(!o.isMesh)return;if(on){if(o.material!==MATGHOST){o.userData.mat0=o.material;o.material=MATGHOST;}}else if(o.userData.mat0){o.material=o.userData.mat0;o.userData.mat0=null;}});}
const MAT_HIT=addTint(new THREE.MeshLambertMaterial({vertexColors:true,emissive:0x262626}),'lam',true,undefined,undefined,'body'); // the flush (fx.js flushBody, POLISH 24, v11.53): MAT with a pale emissive for FLUSH_T after a bite; off by default
const MATBIG=addTint(new THREE.MeshLambertMaterial({vertexColors:true}),'lam',false,undefined,undefined,'body'); // big creatures' far LOD: the full ghost
const MATLM=addTint(new THREE.MeshLambertMaterial({vertexColors:true}),'lam',false,undefined,'world','rock'); // the landmarks that are not rock (far.js): MATBIG's fog, the de-res on the world grid (v11.40; on MATBIG they took the bodies' texel)
// The foot of a boulder (v11.13): the cell's rock sinks `sink` (0.35–0.45) of its scale into the ground (chunks.js settleOn), and the
// band where it meets the sand is darkened in the vertex shader — from the sink line up over 0.8 of the scale, by 35% — the
// occlusion a shadow map would give the one place it shows. Instanced only (the cell's boulders); structures are merged and keep their light.
const ROCK_FOOT='\n#ifdef USE_INSTANCING\n{float sy=length(instanceMatrix[1].xyz);float wy=(modelMatrix*instanceMatrix*vec4(transformed,1.0)).y;float gy=(modelMatrix*vec4(instanceMatrix[3].xyz,1.0)).y+0.4*sy;vFoot=1.0-0.35*(1.0-smoothstep(gy,gy+0.8*sy,wy));}\n#endif\n';
function rockMaterial(){const m=new THREE.MeshLambertMaterial({vertexColors:true});m.onBeforeCompile=function(sh){
  sh.vertexShader='varying float vFoot;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFoot=1.0;'+ROCK_FOOT);
  sh.fragmentShader='varying float vFoot;\n'+sh.fragmentShader.replace('#include <fog_fragment>','gl_FragColor.rgb*=vFoot;\n#include <fog_fragment>');};return m;}
const MATROCK=addTint(rockMaterial(),'lamrock',true,1,undefined,'rock'); // rock placed by the cell (boulders, ledges): with the tide's band and the foot
const MATROCKB=addTint(new THREE.MeshLambertMaterial({vertexColors:true}),'lam',false,1,undefined,'rock'); // structures (far.js): the same with the big-thing fog
// The far cards (v11.13): a sway on uTime by the card's height above its base, so the hand-off at FLORA_FAR is not a forest going still —
// 1.2 m at 25 m up, on the sway materials' phase from the instance's x,z; the raft discs (y 0) don't move. Thin like the blades (thinLight).
function farMaterial(){const m=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});m.onBeforeCompile=function(sh){sh.uniforms.uTime=timeU;
  sh.vertexShader='uniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\n{float sx=length(instanceMatrix[0].xyz),sy=length(instanceMatrix[1].xyz),sz=length(instanceMatrix[2].xyz);float hw=transformed.y*sy;float k=pow(min(hw/25.0,1.0),1.5)*1.2;float ph=uTime*0.55+instanceMatrix[3][0]*0.31+instanceMatrix[3][2]*0.23;transformed.x+=sin(ph)*k/sx;transformed.z+=sin(ph*0.7+1.3)*k*0.6/sz;}\n#endif\n');
  thinLight(sh,0.35);};return m;}
const MATFAR=addTint(farMaterial(),'lamds',true,undefined,undefined,'card'); // far impostor cards: seen from either side; small-thing fog so the swap with real kelp doesn't pop
const GLOW=addTint(new THREE.MeshBasicMaterial({vertexColors:true}),'glow'); // no FLORA entry sets `glow` since v10.1 took the bioluminescence out; kept, with its branches in chunks.js, for when it returns as events (PLANET Hooks) — one program at the boot warm-up (v11.33)
const MATT=addTint(new THREE.MeshLambertMaterial({vertexColors:true,transparent:true,opacity:0.7}),'lamt',true,undefined,undefined,'body'); // translucent small creatures (the flicker); bakeLOD skips transparent parts, so they keep their real mesh at far LOD
const TERRAIN_MAT=addTint(Q.phong?new THREE.MeshPhongMaterial({vertexColors:true,flatShading:true,shininess:0,specular:0x000000}):new THREE.MeshLambertMaterial({vertexColors:true}),'terr',false,0.7,'world','terr'); // 'world' (v11.40): the cells' terrain and the far terrain de-res on one grid
// Instanced sway: displacement in world units, scaled per instance so tall and short plants bend alike.
// bob: the whole instance rides the wave at its origin (surface rafts) and sinks by its aDip attribute (a pad under a body).
// H: the geometry's height along its growth axis in local units (dir: +1 grows up from the root, -1 hangs down from it).
// Disturbance (physics.js updateDisturbers; three vec4 arrays: uDistA xyz+radius, uDistB tail xyz+amplitude, uDistU
// velocity+flow radius). A stalk is pushed where the body is, and everything above the push goes with it: for each
// disturber the stalk is read at the body's height along it (`pd`: the body centre's projection on the stalk, clamped to
// the plant), the
// push found there — contact (out of the capsule by the depth inside, times the sample's amplitude, negative on the
// trail's rebound) plus the water the body pushes (potential flow round a sphere of radius a moving at U, the formula
// the marine snow follows, times KFLOW) — and applied to this vertex scaled by min(h/hd, 1): full from the contact
// height up, tapering to nothing at the root. So a fish at the base of a kelp stalk shoves the whole stalk aside from
// its knee up, and a fish that only brushes past it sways it. `strand` (rafts: a cluster of separate tendrils under one
// pad) reads each tendril on the vertical through its own vertex instead of the instance's axis. v9.1 read each vertex
// at its own height and ramped by height alone: the base never moved and the top only shifted when the body was up there.
const DIST_GLSL='uniform vec4 uDistA['+DIST_N+'];uniform vec4 uDistB['+DIST_N+'];uniform vec4 uDistU['+DIST_N+'];\n';
const KFLOW=0.45; // units of bend per unit of flow speed
// The tide (v10.3): rafts and colonies (bob) ride the wave plus uTide; every upright sway thing in the water (cap: MATG, MATB,
// MATS, MATM, MATW; not the tussock's MATGL) is folded down to 0.45 under the water now — the tide plus the wave at the instance's base (v11.4) — keeping 4% of its excess so the
// folded parts don't z-fight — a stipe reaching the surface at mean tide has its top 4 m in the air at a low spring, and a kelp
// does not stand in air: the canopy lies on the water instead. The current a sway instance leans to is aCur (steady) plus
// aTide (the tidal stream at full flood, chunks.js) times uTideR (the tide's rate now): on the dikes it turns with the tide.
// The current (v10.2): every sway instance carries `aCur`, the water's velocity at its base (chunks.js currentOf, world xz), and
// leans downstream by LEAN times its sway amplitude at full current (CUR_MAX), on the same height profile as the sway (k, ~h²:
// a cantilever), the tip dropping so the stalk doesn't stretch; the oscillation halves at full current (a stalk in a current
// streams and flutters; the back-and-forth is surge). v10.1 swayed about the vertical and only the colonies' baked lines trailed.
const LEAN=3.0;
// Species variants (grow.js): a flora geometry carries `vid` per vertex (which of its three variants a vertex belongs to) and the
// cell gives every instance `aVar`; vertices of the other variants collapse to the instance origin — degenerate triangles, no fill,
// one draw call per species. A geometry without `vid` (rocks, the kept plants) reads 0 for both and is untouched.
const VAR_GLSL='attribute float vid;attribute float aVar;\n',VAR_COLLAPSE='if(abs(vid-aVar)>0.5)transformed=vec3(0.0);',
  VAR_BRANCH='if(abs(vid-aVar)>0.5){transformed=vec3(0.0);}else'; // in the sway shader the collapse comes first so a collapsed vertex skips the disturbance loop (two thirds of the vertices are collapsed; the loop is the cost)
// The flora's draw distance (v11.12). Small flora is collapsed per instance in the shader beyond FLORA_FAR (the variants' trick:
// nothing drawn, and nothing pops as a cell), and a cell whose nearest edge is past it hides its instanced meshes and turns its far
// impostors on (chunks.js cullChunks, far.js farApplyCell). At 450 the veil leaves 6.6% contrast (world.js SEA_FOG), so what goes was
// already a ghost. The stipe, bladder, raft, colony and tidal-tree materials are not cut: their cards take over when the cell hides.
// Measured in the shelf's weed forest on an RTX 4060, 1600x900: 6.3 → 3.0 ms a frame with the loop guard below, draws 418 → 263.
const FLORA_FAR=450;
const FAR_CUT='\n#ifdef USE_FOG\nif(distance((modelMatrix*vec4(instanceMatrix[3].xyz,1.0)).xyz,uFogC)>'+FLORA_FAR.toFixed(1)+'){transformed=vec3(0.0);}else\n#endif\n'; // uFogC: the camera (fog_pars_vertex)
// The disturbance loop runs only for plants within DIST_R of the camera: every disturber is within 70 of it (physics.js
// updateDisturbers) plus a body. It ran for every vertex of every plant to the far plane; this alone was 6.3 → 4.6 ms in the forest.
const DIST_R=90,DIST_GUARD='\n#ifdef USE_FOG\nif(distance(base,uFogC)<'+DIST_R.toFixed(1)+')\n#endif\n';
// cut: collapsed beyond FLORA_FAR (the small things); the impostored species leave it off
function swayMaterial(amp,freq,hn,dir,bob,H,strand,cap,cut,thin){
  const m=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
  m.onBeforeCompile=function(sh){
    if(thin)thinLight(sh,thin);
    sh.uniforms.uChop=chopU;sh.uniforms.uTime=timeU;sh.uniforms.uDistA=distU;sh.uniforms.uDistB=distBU;sh.uniforms.uDistU=distUU;sh.uniforms.uTide=tideU;sh.uniforms.uTideR=tideRU;
    sh.vertexShader='uniform float uTime;uniform float uTide;uniform float uTideR;attribute vec2 aCur;attribute vec2 aTide;\n'+VAR_GLSL+DIST_GLSL+(bob?'attribute float aDip;\n':'')+(bob||cap?'uniform sampler2D uFloorMap;\n'+WAVE_DEP_GLSL+WAVE_GLSL:'')+sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n'+(cut?FAR_CUT:'')+VAR_BRANCH+'{float sx=length(instanceMatrix[0].xyz),sy=length(instanceMatrix[1].xyz),sz=length(instanceMatrix[2].xyz);float ph=uTime*'+freq.toFixed(2)+'+instanceMatrix[3][0]*0.31+instanceMatrix[3][2]*0.23;float hw=max(transformed.y*'+dir.toFixed(1)+',0.0)*sy;float k=clamp(hw/'+hn.toFixed(2)+',0.0,1.3);k=k*k;'+
      'vec3 gd=normalize((modelMatrix*vec4(instanceMatrix[1].xyz,0.0)).xyz)*'+dir.toFixed(1)+';float hmax='+H.toFixed(2)+'*sy;'+
      (strand?'vec3 base=(modelMatrix*instanceMatrix*vec4(transformed,1.0)).xyz-gd*hw;':'vec3 base=(modelMatrix*vec4(instanceMatrix[3].xyz,1.0)).xyz;')+
      'vec3 push=vec3(0.0);\n#ifndef DEPTH_PASS\n'+DIST_GUARD+ // at rest in the world's shadow map (v11.30): no pushes, no sway, no wave
      'for(int i=0;i<'+DIST_N+';i++){vec4 A=uDistA[i];if(A.w<=0.0)continue;vec4 Bv=uDistB[i];vec4 Uv=uDistU[i];'+
        'vec3 Cb=(A.xyz+Bv.xyz)*0.5;float hd=clamp(dot(Cb-base,gd),0.25,hmax);vec3 pd=base+gd*hd;vec3 q=vec3(0.0);'+
        'vec3 ab=Bv.xyz-A.xyz;float l2=dot(ab,ab);float tt=l2>1e-4?clamp(dot(pd-A.xyz,ab)/l2,0.0,1.0):0.0;vec3 dv=pd-(A.xyz+ab*tt);float dl=length(dv);if(dl<A.w)q+=Bv.w*(A.w-dl)*(dv/max(dl,0.05));'+
        'float a=Uv.w;if(a>0.0){vec3 rv=pd-Cb;float r2=dot(rv,rv);if(r2<16.0*a*a){float r=max(sqrt(r2),a);vec3 rh=rv/r;float inv=a*a*a/(2.0*r*r*r);float ur=dot(Uv.xyz,rh);q+='+KFLOW.toFixed(2)+'*(inv*(3.0*ur*rh-Uv.xyz)+Uv.xyz*0.6*exp(-(r-a)/(0.35*a)));}}'+
        'push+=q*min(hw/hd,1.0);}'+
      'push.y*=0.3;float pl=length(push);if(pl>2.6)push*=2.6/pl;\n#endif\n'+
      'vec2 cv=aCur+aTide*uTideR;float cs=length(cv),cf=min(cs*'+(1/CUR_MAX).toFixed(4)+',1.0);if(cs>0.001&&hw>0.0){float dl=min('+(LEAN*amp).toFixed(3)+'*k*cf,hw*0.85);push+=vec3(cv.x,0.0,cv.y)*(dl/cs)-gd*(dl*dl/(2.0*max(hw,0.3)));}'+
      'mat3 im=mat3(instanceMatrix);transformed+=vec3(dot(im[0],push)/(sx*sx),dot(im[1],push)/(sy*sy),dot(im[2],push)/(sz*sz));'+
      '\n#ifndef DEPTH_PASS\nfloat sa=1.0-0.5*cf;transformed.x+=sin(ph)*k*sa*'+amp.toFixed(2)+'/sx;transformed.z+=sin(ph*0.7+1.3)*k*sa*'+(amp*0.6).toFixed(2)+'/sz;\n#endif\n'+
      (bob?'\n#ifdef DEPTH_PASS\ntransformed.y+=(uTide-aDip)/sy;\n#else\ntransformed.y+=(waveH(instanceMatrix[3].xz,uTime,0.0,waveDep(instanceMatrix[3].xz,uTide))+uTide-aDip)/sy;\n#endif\n':cap?'float wy=(modelMatrix*instanceMatrix*vec4(transformed,1.0)).y;float wl=uTide-0.45;\n#ifndef DEPTH_PASS\nif(wy>uTide-1.8)wl+=waveH(base.xz,uTime,0.0,waveDep(base.xz,uTide));\n#endif\ntransformed.y-=max(wy-wl,0.0)*0.96/sy;':'')+'}');
  };
  m.sway=true; // the cell gives its instances aCur (chunks.js makeInstanced)
  return addTint(m,'sway'+amp+freq+hn+dir+(bob?'b':'')+H+(strand?'s':'')+(cap?'c':'')+(cut?'x':'')+(thin?'t'+thin:''),true,undefined,undefined,thin?'blade':'plant');
}
// rigid flora with variants: Lambert, double-sided (the cones' comb legs and the stars are planes), the collapse and nothing else
// The sessile animals breathe (v11.13): a 2.5% radial pulse of everything above 0.25 m local, 0.4–0.6 Hz, phase from the instance's x,z —
// the tubes, cups, lilies, tulips, chains, burrs and loops, which were rigid. Crusts and cones under 0.25 m don't move; a collapsed vertex stays at zero.
const PULSE_GLSL='{float pp=uTime*0.7+instanceMatrix[3][0]*0.37+instanceMatrix[3][2]*0.29;float pk=smoothstep(0.25,1.0,transformed.y)*0.025*(1.0+0.5*sin(pp*1.7));transformed.xz*=1.0+pk*sin(pp);}';
function varMaterial(dead){const m=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});m.onBeforeCompile=function(sh){sh.uniforms.uTime=timeU;sh.vertexShader='uniform float uTime;\n'+VAR_GLSL+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>'+FAR_CUT+VAR_COLLAPSE+(dead?'':'\n#if defined(USE_INSTANCING)&&!defined(DEPTH_PASS)\n'+PULSE_GLSL+'\n#endif\n'));};return addTint(m,dead?'lamvd':'lamv',true,undefined,undefined,'plant');} // no breathing in the world's shadow map (v11.30) // cut beyond FLORA_FAR too (v11.12)
const MATV=varMaterial(),MATVD=varMaterial(true); // MATVD: the variants without the breath — a stranded float is a corpse (v11.31.4)
// (v11.33: fogExtinctOnly is gone — nothing has called it since the glow clouds went in v10.1. The rule it carried stands and the
// light shafts re-implement it by hand: an additive thing must lose its own colour with distance and never take the veil's.)
const MATG=swayMaterial(0.35,1.6,2.4,1,false,2.4,false,true,true,0.35),MATB=swayMaterial(3.0,0.5,45,1,false,1.0,false,true,false,0.3),MATR=swayMaterial(2.2,0.9,12,-1,true,12,true,false,false,0.2), // the bladder, rafts and colonies: no cut, their cards take over
  MATW=swayMaterial(0.5,1.1,6,1,false,6.5,false,true,true,0.35), // whip corals bend too (fans are rigid and solid since v9.1); cut beyond FLORA_FAR
  MATS=swayMaterial(3.2,0.7,40,1,false,1.0,false,true), // the stipe: unit height stretched to the surface like the bladder, a slower deeper sway; no cut (the cards)
  MATM=swayMaterial(1.6,1.0,12,1,false,14,false,true,true,0.35), // mid-height weed (ladder, ribbon, the pen): bends over its top ten metres; cut
  MATGL=swayMaterial(0.35,1.6,2.4,1,false,2.4,false,false,true,0.35), // the tussock: the grass sway on land, never folded to the water (cap); cut
  MATTR=swayMaterial(0.3,0.45,9,1,false,14); // the tidal forest (v11): a trunk in the wind — a slow sway from the crown, never capped to the water, never leaning to the current (land: chunks.js makeInstanced gives it no aCur); no cut (the cards)
MATTR.land=true; // thin (the last argument, v11.13): the share of the far face's light that comes through a blade — the weed, bladders, rafts, whips, the tussock; not the stipe, not the trunks
