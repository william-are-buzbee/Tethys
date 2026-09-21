// menu.js — the menu (v11.47, the person's ask): the world under the title screen's camera (v11.47.2: the sea shot at first, then wherever you last
// left, died or saved — MENU_SHOTS, menuCam), the title, and a column — new game, continue,
// options, and the creator once it is yours (save.js PROFILE.creator: the lab used once, or #creator in the URL). New game starts as the finback
// (the slowblood) at the peak, in a new slot; continue lists the save files (save.js) to load, export to a file, or delete (twice: the word asks
// first); a file can be imported; options opens the effects list (effects.js) over the caldera; the creator opens the lab as the player's
// (lab.js lab.player: only what has been seen). Esc in play with the pointer free saves and returns here; z and l still open the bestiary and
// the lab from here (dev tools). choose() is the bare start the tests drive (anim, combat, physics): the body as the clade, the cells, play.
const menu={page:'main',confirm:null,busy:false,rise:0,wakeAt:0,idle:false}; // rise: the wall-clock ms at which the column comes up; wakeAt: the wall-clock ms the mouse last moved on the menu (the wall clock, not dt: a throttled loop — the app's pane — still idles at the right time)
const MENU_RISE=3200,MENU_RISE_BACK=1200,MENU_IDLE=12000; // ms after boot (the black fade clears at ~2.2 s) and after a return from play before the column rises; ms still before the menu fades away (v11.47.1)
function menuRise(ms){menu.rise=performance.now()+ms;mlistEl.classList.remove('up');menuWake();}
function menuWake(){menu.wakeAt=performance.now();if(menu.idle){menu.idle=false;menuEl.classList.remove('idle');}}
function updateMenu(){ // the column's rise and the idle fade (main.js, every frame)
  if(mode!=='menu')return;const now=performance.now();
  if(menu.rise&&now>=menu.rise){menu.rise=0;mlistEl.classList.add('up');}
  if(!menu.idle&&now-menu.wakeAt>MENU_IDLE&&!fxOpen&&!menu.busy){menu.idle=true;menuEl.classList.add('idle');}
}
addEventListener('mousemove',()=>{if(mode==='menu')menuWake();});addEventListener('touchstart',()=>{if(mode==='menu')menuWake();},{passive:true});addEventListener('keydown',()=>{if(mode==='menu')menuWake();});
const mlistEl=document.getElementById('mlist'),msavesEl=document.getElementById('msaves'),mslotsEl=document.getElementById('mslots'),mcreatorEl=document.getElementById('mcreator'),mnoteEl=document.getElementById('mnote');
// The title screen's camera (v11.47.2, the person's ask): a table of shots — the sea shot is the start (from the water 6 m up off the north-east
// coast, the horizon in the middle, the ocean under it, the 48 m cone at (346,−346) in the background), the caldera shot is the v11.13.1 one over
// the peak's shallows, kept — and after any game at all the title screen opens from the exact camera of the moment you left, died or last saved
// (save.js camNote/camRead, written synchronously at every one of those events), every time. The cells stream round player.pos, so a shot sets it too.
const MENU_SHOTS={sea:{p:[700,6,-700],d:[-0.55,0,0.835]},caldera:{p:[0,dispY+0.6,10],d:[0,-0.08,-1]}};
function menuCam(shot){const p=shot.p,d=shot.d;menu.shot={p:p.slice(),d:d.slice()};camera.position.set(p[0],p[1],p[2]);camera.lookAt(p[0]+d[0],p[1]+d[1],p[2]+d[2]);player.pos.set(p[0],p[1],p[2]);player.vel.set(0,0,0);snapMed=true;}
function camNow(){const d=V3(0,0,-1).applyQuaternion(camera.quaternion);return {p:[camera.position.x,camera.position.y,camera.position.z],d:[d.x,d.y,d.z]};}
function layoutMenu(){menuCam(menu.shot);} // the current shot again (a resize; the bestiary and the lab moved the camera)
menuCam(camRead()||MENU_SHOTS.sea);menuRise(MENU_RISE);
function menuPage(p){menu.page=p;menu.confirm=null;mlistEl.style.display=p==='main'?'':'none';msavesEl.classList.toggle('on',p==='saves');if(p==='saves')menuSlots();menuWake();} // 'main' | 'saves' | 'none' (the bestiary and the lab)
function menuRefresh(){mcreatorEl.style.display=PROFILE.creator?'':'none';saveRefresh(()=>{if(menu.page==='saves')menuSlots();});} // the profile and the slots read again (boot, main.js; the creator granted)
function menuNote(s){mnoteEl.textContent=s;mnoteEl.style.opacity=s?1:0;if(s)setTimeout(()=>{if(mnoteEl.textContent===s)mnoteEl.style.opacity=0;},3000);}
function fmtAgo(ms){const s=(Date.now()-ms)/1000;return s<90?'just now':s<5400?Math.round(s/60)+' min ago':s<172800?Math.round(s/3600)+' h ago':Math.round(s/86400)+' days ago';}
function fmtPlay(s){return s<3600?Math.max(1,Math.round(s/60))+' min':(s/3600).toFixed(1)+' h';}
function menuSlots(){
  if(!saveList.length){mslotsEl.innerHTML='<div class="mdim">no saved games</div>';return;}
  mslotsEl.innerHTML=saveList.map(r=>{const C=CLADES.find(c=>c.id===r.clade),conf=menu.confirm===r.id,sp=r.spec&&typeof r.spec.id==='string'&&(!C||r.spec.id!==C.spec.id)?r.spec.id:''; // a spec that is no preset shows its own id (v11.68)
    return '<div class="slot" data-id="'+escH(r.id)+'"><b>'+escH(r.name||'game')+'</b><span>'+escH(sp||(C?C.name:r.clade))+'</span><span>'+fmtPlay(+r.playT||0)+'</span><span>'+fmtAgo(+r.played||+r.made||Date.now())+'</span>'+(r.deaths&&r.deaths.length?'<span>'+r.deaths.length+' dead · '+escH(r.deaths[r.deaths.length-1].cause||'')+'</span>':'')+'<i data-act="export">export</i><i data-act="del"'+(conf?' class="warn"':'')+'>'+(conf?'sure?':'delete')+'</i></div>';}).join('');
}
function menuGo(fn){ // a quick fade to black round a change of world (a game starting, the menu coming back); the fade's own 1.8 s is the boot's and death's
  if(menu.busy)return;menu.busy=true;fadeEl.style.transition='opacity .35s';fadeEl.style.opacity=1;
  setTimeout(()=>{fn();menu.busy=false;setTimeout(()=>{fadeEl.style.opacity=0;setTimeout(()=>{fadeEl.style.transition='';},500);},120);},380);
}
function choose(c,pos,yaw,pitch){ // into play as clade c (an index or the clade), at pos (the peak by default): the body, the cells round it, the mode
  const C=typeof c==='number'?CLADES[c]:c;
  playerBody(C,pos||V3(0,dispY,0),yaw,pitch);cellsAround();
  mode='play';menuEl.classList.add('gone');fxShow(false);
  hintEl.textContent=isTouch?'left side: drag to swim. right side: drag to look, tap to bite, hold to grab. two fingers: ability':'w a s d swim, space rise, c dive, shift burst, q ability, click bite, right button or r hold, f first person, tab cursor, m mute, esc menu';
  hintEl.style.opacity=1;setTimeout(()=>{hintEl.style.opacity=0;},10000);
  saveT=SAVE_EVERY;initAudio();tryLock();
}
function toMenu(){ // play to the menu (esc with the pointer free): the game saved, the world cleared, the peak's cells back under the menu's camera
  if(mode!=='play')return;saveNow();curSave=null;unlock();
  const shot=camNow(); // the camera as it is: the title screen opens from here (v11.47.2)
  menuGo(()=>{playerDrop();mode='menu';worldClear();menuCam(shot);cellsAround();menuEl.classList.remove('gone');menuPage('main');menuRise(MENU_RISE_BACK);hintEl.style.opacity=0;menuRefresh();});
}
document.getElementById('mnew').addEventListener('click',()=>{if(mode==='menu'&&menu.page==='main')menuGo(()=>{startNew(CLADES[1]);});}); // the finback until the creator is the start (DIRECTION: the smallest body the creator allows)
document.getElementById('mcont').addEventListener('click',()=>{if(mode==='menu')menuPage('saves');});
document.getElementById('mopt').addEventListener('click',()=>{if(mode==='menu')fxShow(!fxOpen);});
mcreatorEl.addEventListener('click',()=>{if(mode==='menu'&&menu.page==='main')labEnter(undefined,true);});
document.getElementById('mback').addEventListener('click',()=>{if(mode==='menu')menuPage('main');});
document.getElementById('mimport').addEventListener('click',()=>{if(mode!=='menu')return;filePick(txt=>{saveImport(txt,rec=>{if(rec){menuNote('imported '+rec.name);menuSlots();}else menuNote('not a tethys save file');});});});
mslotsEl.addEventListener('click',e=>{
  if(mode!=='menu')return;let el=e.target;const act=el.dataset&&el.dataset.act;while(el&&el!==mslotsEl&&!(el.dataset&&el.dataset.id))el=el.parentNode;if(!el||el===mslotsEl)return;
  const id=el.dataset.id,rec=saveList.find(r=>r.id===id);if(!rec)return;
  if(act==='del'){if(menu.confirm===id){menu.confirm=null;storeDel(id,()=>{saveRefresh(menuSlots);});}else{menu.confirm=id;menuSlots();}}
  else if(act==='export')fileSave((rec.name||'game').replace(/[^\w-]+/g,'_')+'.tethys.json',JSON.stringify(rec));
  else menuGo(()=>{startFrom(rec);});
});
addEventListener('keydown',e=>{if(e.code!=='Escape'||e.defaultPrevented)return;if(mode==='play'&&!locked&&!player.dead)toMenu();else if(mode==='menu'&&menu.page==='saves')menuPage('main');}); // effects.js takes esc first when its list is open (and prevents the default); with the pointer locked the browser keeps the first esc for the lock
