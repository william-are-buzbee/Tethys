// main.js — boot, the frame loop, the debug readout (backquote) and its fog tuner
// the readout's hold line (v11.54, COMBAT.md §2): every hold near the player — holder grip/edge on held covering: the edge's verdict there, the hold's age and its struggle
function holdLine(){let s='',n=0;for(const h of holds){if(n>=3)break;if(!(h.a===player||h.b===player||h.a.pos.distanceTo(player.pos)<95))continue;n++;const nm=o=>o===player?'you':o.kind;s+=(s?'   ':'')+nm(h.a)+' '+h.kind+'/'+(h.edge||'-')+' on '+nm(h.b)+' '+(h.cover||'?')+': '+(h.thru||'-')+'  '+h.t.toFixed(1)+'s pull '+h.pull.toFixed(2);}return s?'\nhold '+s:'';}
let showStats=false,statT=0,fpsEma=60,msEma=16,physEma=0,physMs=0,renderMs=0,renderEma=0,frameMs=0,genMs=0; // frameMs: the whole of the last frame's work; genMs: the streaming's share of it (the cells and the far layer) // physMs: the frame's creature, contact, arm, pad, disturbance and snow time (physics.js and friends); renderMs: renderer.render — the submit plus any wait on the GPU's queue (v11.12; when it runs away from the rest of the frame the GPU is the limit)
// The work, not the wait (v11.32.1). `ms` is dt: the wall clock between frames, which on a vsynced 120 Hz display is 8.3 whatever
// the frame costs, so every screenshot of a machine with headroom read the same number and the headroom was invisible. `work` is
// frameMs — the top of loop() to the bottom — as an EMA and, after the slash, the worst single frame since the readout last drew
// (a quarter second). The worst is the one that matters: the shadow map re-renders only when the sun turns, the camera drifts 20 m
// or a cell loads, and on those frames it adds its whole cost at once. An EMA hides that; a max does not. `gen` is the streaming's
// share of the same frame. All three are CPU time: renderer.render is the submit, not the GPU's own execution.
let frameEma=0,frameMax=0,genEma=0;
function toggleStats(){showStats=!showStats;statsEl.style.display=showStats?'block':'none';statT=0;}
// Fog tuner: while the readout is open, these keys nudge the sea fog live and the readout's second line shows the numbers,
// so the look can be dialled in without a build — paste the line back and it gets baked into SEA_FOG (world.js).
// Backspace restores the built-in numbers. Shares at 1, sun 0 and ground 0.15 is close to the pre-v8 fog (the water colours aside).
// shareS only matters if it differs from share: it lets small things (flora, small creatures) fade sooner than the terrain.
const FOG_DEF=Object.assign({},SEA_FOG);
const FOG_TUNE=[
  {k:'share',lo:'Digit1',hi:'Digit2',step:0.02,min:0,max:1,d:2},
  {k:'shareS',lo:'Digit3',hi:'Digit4',step:0.02,min:0,max:1,d:2},
  {k:'dens',lo:'Digit5',hi:'Digit6',step:0.0004,min:0.001,max:0.03,d:4},
  {k:'far',lo:'Digit7',hi:'Digit8',step:0.0001,min:0,max:0.01,d:4},
  {k:'bright',lo:'Digit9',hi:'Digit0',step:0.05,min:0.2,max:3,d:2},
  {k:'sun',lo:'Minus',hi:'Equal',step:0.1,min:0,max:3,d:1},
  {k:'ground',lo:'BracketLeft',hi:'BracketRight',step:0.05,min:0,max:2,d:2},
  {k:'reach',lo:'Comma',hi:'Period',step:20,min:20,max:1600,d:0},
  {k:'placeMix',lo:'Semicolon',hi:'Slash',step:0.05,min:0,max:1,d:2},
  {k:'dlAt',lo:'KeyO',hi:'KeyN',step:0.1,min:0,max:1,d:1}, // 1: daylight at the sample point; 0: at the camera (with placeMix 0, the pre-v8 uniform veil). v11.34: was o-p, and p places the lab's creature, so with the readout open in the lab it did both. KeyO has no other use and KeyN none at all — every other letter is taken (the game's, or AU_TUNE's g-h j-k v-b)
  {k:'cau',lo:'KeyT',hi:'KeyY',step:0.1,min:0,max:4,d:1}, // the caustics' contrast (v11.35: 1 is the physical focusing, 0 none)
  {k:'shd',lo:'KeyU',hi:'KeyI',step:0.05,min:0,max:1,d:2}]; // the bodies' shadows' strength (v11.13; 0 is none)
// Camera tuner (v11.48): the field of view and the third-person arm, live, for the scale question — on a flat screen a wide field renders every
// animal at about half its true angular size, and the fix is a narrower field with a longer arm (the body keeps its framing, the far creature
// grows relative to it). Arrows and pgup-pgdn: every letter is taken. The bestiary's arrows stand down while the readout is open (zoo.js).
const CAM_TUNE=[{k:'fov',lo:'ArrowLeft',hi:'ArrowRight',step:2,min:30,max:110,d:0},{k:'fovFP',lo:'PageDown',hi:'PageUp',step:2,min:30,max:110,d:0},{k:'arm',lo:'ArrowDown',hi:'ArrowUp',step:0.5,min:-4,max:8,d:1}];
function camTune(code){if(code==='Backspace'){Object.assign(CAM_K,CAM_DEF);}else{const e=CAM_TUNE.find(e=>e.lo===code||e.hi===code);if(!e)return false;CAM_K[e.k]=clamp(CAM_K[e.k]+(code===e.hi?e.step:-e.step),e.min,e.max);}applyCam();return true;}
function camLine(){return 'cam  fov '+CAM_K.fov.toFixed(0)+'°  fovFP '+CAM_K.fovFP.toFixed(0)+'°  arm '+(CAM_K.arm>=0?'+':'')+CAM_K.arm.toFixed(1)+'m  ('+(camera.fov*2*Math.atan(Math.tan(camera.fov*Math.PI/360)*camera.aspect)*180/Math.PI/camera.fov).toFixed(0)+'° across)   (←→ fov  pgdn-pgup fovFP  ↓↑ arm)';}
function fogTune(code){
  if(code==='Backspace'){Object.assign(SEA_FOG,FOG_DEF);audioTune(code);camTune(code);}
  else{if(audioTune(code)||camTune(code)){statT=0;return;}const e=FOG_TUNE.find(e=>e.lo===code||e.hi===code);if(!e)return;SEA_FOG[e.k]=clamp(SEA_FOG[e.k]+(code===e.hi?e.step:-e.step),e.min,e.max);}
  applyFog(wasAbove===true);statT=0;
}
function fogLine(){return 'fog  '+FOG_TUNE.map(e=>e.k+' '+SEA_FOG[e.k].toFixed(e.d)).join('  ')+'   (1-2 3-4 5-6 7-8 9-0 -= [] ,. ;/ o-n t-y u-i  backspace resets)';}
function updateStats(dt){
  fpsEma+=(1/Math.max(dt,0.001)-fpsEma)*0.05;msEma+=(dt*1000-msEma)*0.05;physEma+=(physMs-physEma)*0.05;renderEma+=(renderMs-renderEma)*0.05;
  frameEma+=(frameMs-frameEma)*0.05;genEma+=(genMs-genEma)*0.05;if(frameMs>frameMax)frameMax=frameMs; // the worst frame since the last draw, below
  statT-=dt;if(statT>0||!showStats)return;statT=0.25;
  const fMax=frameMax;frameMax=0; // read and reset: the max belongs to the quarter second just gone, not to the session
  const r=renderer.info.render;
  statsEl.textContent=fpsEma.toFixed(0)+' fps  '+msEma.toFixed(1)+' ms  work '+frameEma.toFixed(1)+'/'+fMax.toFixed(1)+'ms'+(genEma>0.05?'  gen '+genEma.toFixed(1)+'ms':'')+'  draws '+r.calls+'  tris '+(r.triangles/1000).toFixed(0)+'k  cells '+visibleChunks+'/'+chunks.size+'  pools '+poolStats().draws+'  far '+visibleRegions+'/'+farBuilt+'  creatures '+visibleCreatures+'/'+creatures.length+'  phys '+physEma.toFixed(2)+'ms  render '+renderEma.toFixed(2)+'ms'+(SHS_P[1]>0?'  wshadow '+shsMs.toFixed(2)+'ms/'+shsN:'')+'  lights '+lightSources.length+(performance.memory?'  heap '+(performance.memory.usedJSHeapSize/1048576).toFixed(0)+'M':'')+'  '+Q.tier+'  '+(player.sub<0.5?(player.grounded?'strand':'air'):'sea')+'  '+player.pos.x.toFixed(0)+','+player.pos.y.toFixed(0)+','+player.pos.z.toFixed(0)+'  tide '+(TIDE>=0?'+':'')+TIDE.toFixed(1)+'m '+(tideRate(clockH)>0.02?'rising':tideRate(clockH)<-0.02?'falling':'slack')+' '+((clockH+SOLAR_H0)%DAY_H).toFixed(1)+'h  sun '+(Math.asin(SKY.sunAlt)*180/Math.PI).toFixed(0)+'°  moon '+(Math.asin(SKY.moonAlt)*180/Math.PI).toFixed(0)+'° '+(SKY.illum*100).toFixed(0)+'%  light '+SKY.skyL.toFixed(2)+(wasAbove===false?'/'+SKY.skyLw.toFixed(2):'')+'  cloud '+SKY.cover.toFixed(2)+(SKY.rainA>0.02?'  rain '+SKY.rainA.toFixed(2):'')+(SKY.windK<0.5?'  calm':'')+(SKY.eclL>0.02?'  eclipse '+SKY.eclL.toFixed(2):'')+(SKY.dawn>0.02?'  mist '+SKY.dawn.toFixed(2):'')+(SKY.vog>0.15?'  vog '+SKY.vog.toFixed(2):'')+'\n'+fogLine()+'\n'+audioLine()+'\n'+camLine()+'\n'+ecoLine()+holdLine();
}
// the first 3x3 cells are built before the first frame; the rest stream in under a per-frame time budget
cellsAround(); // save.js: the 3×3 round the player (the peak, under the menu's camera)
profileLoad(()=>{if(HASH_FLAGS.indexOf('creator')>=0)grantCreator();menuRefresh();}); // the profile and the slots (save.js), then the menu's creator word and its list; #creator grants the creator
// Every shader program compiled behind the fade instead of on first sight (v11.12): a sway program is ~90 ms, and the flicker's
// translucent material, the big creatures' far ghost, the sky (on the first breach) and the rain compiled mid-play. One tiny mesh per
// material, in the instanced form where the game uses it (the instanced programs are separate), compiled by renderer.compile with the
// scene's lights and fog, then removed. Run at the end of the first frame, so the programs that frame compiled anyway cost nothing
// more and only the rest are paid for (~400 ms, under the black fade). A failure only means the old stalls.
let warmed=false;
function warmShaders(){
  try{
    const g=new THREE.Group(),geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,0,0.01,0,0.01,0,0],3));geo.setAttribute('normal',new THREE.Float32BufferAttribute([0,1,0,0,1,0,0,1,0],3));geo.setAttribute('color',new THREE.Float32BufferAttribute([1,1,1,1,1,1,1,1,1],3));
    for(const m of [MAT,MAT_HIT,MATBIG,MATLM,MATT,TERRAIN_MAT,MAT_HI,shM,new THREE.MeshLambertMaterial({color:0x06080a,transparent:true,opacity:0.9})])g.add(new THREE.Mesh(geo,m)); // the last is the ink cloud's; shM the light shafts' (v11.13)
    const c=new THREE.Color(1,1,1);
    for(const m of [MAT,MATROCK,MATROCKB,MATFAR,GLOW,MATV,MATG,MATB,MATR,MATW,MATS,MATM,MATGL,MATTR]){const ig=geo.clone();ig.setAttribute('aVar',new THREE.InstancedBufferAttribute(new Float32Array(1),1));ig.setAttribute('aDip',new THREE.InstancedBufferAttribute(new Float32Array(1),1));ig.setAttribute('aCur',new THREE.InstancedBufferAttribute(new Float32Array(2),2));ig.setAttribute('aTide',new THREE.InstancedBufferAttribute(new Float32Array(2),2));const im=new THREE.InstancedMesh(ig,m,1);im.setColorAt(0,c);g.add(im);}
    g.position.set(0,-1e5,0);scene.add(g);renderer.compile(scene,camera);
    g.traverse(o=>{if(o.isMesh){shadowCaster(o,o.material);o.castShadow=true;o.frustumCulled=false;}});shadowFrame();updateShadowS(0,true); // the depth programs of the world's shadow map (v11.30), one forced pass over these meshes; the map itself goes at the next frame if the switch is off
    scene.remove(g);
  }catch(e){console.warn('shader warm-up skipped: '+e.message);}
}
let last=performance.now();
function loop(now){
  requestAnimationFrame(loop);
  const f0=performance.now(),dt=clamp((now-last)/1000,0,0.05);last=now;t+=dt;timeU.value=t;FOG_TC[0]=t;
  clockH=t*CLOCK_RATE;TIDE=tideAt(clockH);tideU.value=TIDE;tideRU.value=tideRate(clockH);tintU.value.x=TIDE;FOG_W[0]=TIDE; // the clock and the tide (world.js), once a frame, before anything reads the water level (FOG_W[0]: the fog chunk's copy, v11.32 — the daylight curve measures depth from it)
  readTouch();
  // the streaming gets what the rest of the last frame left of Q.target (v11.12): a 3 ms frame leaves 4.5 for the cells, a 6 ms frame 2 (the floor)
  const g0=performance.now();manageChunks(Math.min(Q.budgetMs,Math.max(2,Q.target-(frameMs-genMs))));manageFar(mode==='menu'&&t<2.4?14:Q.farMs);genMs=performance.now()-g0; // the far layer streams in behind the fade (black until ~2.2 s), then in the gaps (v11.12: 14 ms all through the menu had its creatures stuttering for the first second)
  updateMenu(dt);updateZoo(dt);updateLab(dt);if(mode==='play')updatePlayer(dt); // updateMenu (v11.47.1): the column's rise and the idle fade
  const p0=performance.now();
  updateSchools(dt);updateCreatures(dt);if(mode==='play')finishPlayer(dt,bodies); // bodies, contact, arms, then the camera
  updateEggs(dt);ecoTick(dt);updateSave(dt); // the clutches hatch; the world's ledger (v11.26): the model every few seconds, the births owed; the autosave clock (save.js, v11.47)
  updatePads(dt);updateDisturbers(dt);if(FX.snow)updatePlankton(dt);physMs=performance.now()-p0;
  updateWounds(dt);updateInks(dt);updateSplashes(dt);updateBlood(dt);updateDebris(dt);updateFlush(dt); // the wounds bleed and the blood drifts (combat.js, v11.31)
  updateAtmosphere(dt);updateSurface();
  camera.updateMatrixWorld();updateFogCamera();cullChunks(dt);cullFar();assignLights();updateShadow();updateShadowS(dt);updateAudio(dt); // the shadow map's box and casters (v11.23): after everything has moved; the sound (v11.14) last, with the camera where it is
  updateHUD();updateCompass(dt);updateFX();
  const r0=performance.now();renderer.render(scene,camera);renderMs=performance.now()-r0;
  if(!warmed){warmed=true;warmShaders();} // the first frame, behind the fade
  updateStats(dt);frameMs=performance.now()-f0;
}
setTimeout(()=>{fadeEl.style.opacity=0;},400);
requestAnimationFrame(loop);
