// input.js — mouse (pointer lock or drag), keyboard, and invisible touch zones
let lockArrived=false; // the click that took the lock is not a bite
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===canvas;if(locked){lockArrived=true;drag=null;}});
function tryLock(){try{if(canvas.requestPointerLock&&!isTouch)canvas.requestPointerLock();}catch(e){}}
function look(dx,dy){player.yaw-=dx*0.0022;player.pitch=clamp(player.pitch-dy*0.0022,-PITCH_MAX,PITCH_MAX);} // the heading (v11.77): the body turns toward it at its own rate (player.js)
// The mouse (v11.13.1, the person's ask): looking by default. Play starts locked (choose() asks for the lock in the pick's click); Tab
// releases it and shows the cursor, Tab or a click on the canvas takes it back. A click while locked is the bite. Where the lock is refused
// (an iframe, the app's browser) a held drag looks and a short click bites, as before. The lock is dropped on leaving play (syncLock).
function unlock(){try{if(document.exitPointerLock)document.exitPointerLock();}catch(e){}}
function syncLock(){if(locked&&mode!=='play')unlock();}
let mouseGrab=false,touchGrab=false; // the grab (combat.js, v11.31): the right button or r held; on touch, a finger held still on the right
canvas.addEventListener('contextmenu',e=>{e.preventDefault();});
canvas.addEventListener('mousedown',e=>{if(mode!=='play')return;if(e.button===2){mouseGrab=true;return;}if(e.button!==0)return;if(locked){bite();}else{drag={x:e.clientX,y:e.clientY,moved:0};tryLock();}});
addEventListener('mousemove',e=>{if(mode!=='play')return;if(locked){look(e.movementX||0,e.movementY||0);}else if(drag){const dx=e.movementX||0,dy=e.movementY||0;drag.moved+=Math.abs(dx)+Math.abs(dy);look(dx,dy);}});
addEventListener('mouseup',e=>{if(e.button===2){mouseGrab=false;return;}if(drag&&!locked&&drag.moved<4&&!lockArrived)bite();drag=null;lockArrived=false;});
addEventListener('blur',()=>{mouseGrab=false;for(const k in keys)keys[k]=false;}); // v11.33: alt-tab while holding W left the player swimming until the key was pressed again
addEventListener('keydown',e=>{if(e.code==='Space'||e.code==='KeyC'||e.code==='ShiftLeft')e.preventDefault();if(e.code==='Tab'&&mode==='play'){e.preventDefault();if(locked)unlock();else tryLock();}if(!keys[e.code]){keys[e.code]=true;if(e.code==='KeyQ')ability();if(e.code==='KeyX'&&mode==='play')playerLay();if(e.code==='KeyM')toggleMute();if(e.code==='KeyF'&&mode==='play')toggleFP();if(e.code==='Backquote'||e.code==='Quote'||e.code==='F3')toggleStats();}if(showStats&&e.code!=='Backquote'&&e.code!=='Quote'&&e.code!=='F3'){if(/^(Arrow|Page)/.test(e.code))e.preventDefault();fogTune(e.code);}}); // v11.48: the camera tuner's keys would scroll the page
addEventListener('keyup',e=>{keys[e.code]=false;});
const tstate={L:null,R:null};
canvas.addEventListener('touchstart',e=>{
  if(mode!=='play')return;e.preventDefault();
  for(const tc of e.changedTouches){const side=tc.clientX<innerWidth/2?'L':'R';if(!tstate[side])tstate[side]={id:tc.identifier,x0:tc.clientX,y0:tc.clientY,x:tc.clientX,y:tc.clientY,t0:performance.now(),moved:0};}
  if(e.touches.length>=2){touchAbility=true;ability();}
},{passive:false});
canvas.addEventListener('touchmove',e=>{
  if(mode!=='play')return;e.preventDefault();
  for(const tc of e.changedTouches){for(const side of ['L','R']){const s=tstate[side];if(s&&s.id===tc.identifier){const dx=tc.clientX-s.x,dy=tc.clientY-s.y;s.x=tc.clientX;s.y=tc.clientY;s.moved+=Math.abs(dx)+Math.abs(dy);if(side==='R')look(dx*2.4,dy*2.4);}}}
},{passive:false});
function touchEnd(e){
  for(const tc of e.changedTouches){for(const side of ['L','R']){const s=tstate[side];if(s&&s.id===tc.identifier){if(side==='R'&&s.moved<12&&performance.now()-s.t0<350)bite();tstate[side]=null;}}}
  touchAbility=e.touches.length>=2;
}
canvas.addEventListener('touchend',touchEnd);canvas.addEventListener('touchcancel',touchEnd);
function readTouch(){syncLock();const r=tstate.R;touchGrab=!!(r&&r.moved<12&&performance.now()-r.t0>350);const s=tstate.L;if(!s){touchL=null;return;}const mx=clamp((s.x-s.x0)/70,-1,1),mz=clamp(-(s.y-s.y0)/70,-1,1);touchL={mx:mx,mz:mz,sprint:(s.y0-s.y)/70>1.5};}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);if(mode==='menu')layoutMenu();});
