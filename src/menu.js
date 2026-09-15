// menu.js — the menu (v11.47, the person's ask): the caldera under the menu's camera as before, the title, and a column — new game, continue,
// options, and the creator once it is yours (save.js PROFILE.creator: the lab used once, or #creator in the URL). New game starts as the finback
// (the slowblood) at the peak, in a new slot; continue lists the save files (save.js) to load, export to a file, or delete (twice: the word asks
// first); a file can be imported; options opens the effects list (effects.js) over the caldera; the creator opens the lab as the player's
// (lab.js lab.player: only what has been seen). Esc in play with the pointer free saves and returns here; z and l still open the bestiary and
// the lab from here (dev tools). choose() is the bare start the tests drive (anim, combat, physics): the body as the clade, the cells, play.
const menu={page:'main',confirm:null,busy:false};
const mlistEl=document.getElementById('mlist'),msavesEl=document.getElementById('msaves'),mslotsEl=document.getElementById('mslots'),mcreatorEl=document.getElementById('mcreator'),mnoteEl=document.getElementById('mnote');
function layoutMenu(){const portrait=innerWidth<innerHeight*0.95;camera.position.set(0,dispY+0.6,portrait?12:10);camera.lookAt(0,dispY-0.2,0);} // the camera as it was over the three clades (v11.13.1 numbers): the peak's shallows
layoutMenu();
function menuPage(p){menu.page=p;menu.confirm=null;mlistEl.style.display=p==='main'?'':'none';msavesEl.classList.toggle('on',p==='saves');if(p==='saves')menuSlots();} // 'main' | 'saves' | 'none' (the bestiary and the lab)
function menuRefresh(){mcreatorEl.style.display=PROFILE.creator?'':'none';saveRefresh(()=>{if(menu.page==='saves')menuSlots();});} // the profile and the slots read again (boot, main.js; the creator granted)
function menuNote(s){mnoteEl.textContent=s;mnoteEl.style.opacity=s?1:0;if(s)setTimeout(()=>{if(mnoteEl.textContent===s)mnoteEl.style.opacity=0;},3000);}
function fmtAgo(ms){const s=(Date.now()-ms)/1000;return s<90?'just now':s<5400?Math.round(s/60)+' min ago':s<172800?Math.round(s/3600)+' h ago':Math.round(s/86400)+' days ago';}
function fmtPlay(s){return s<3600?Math.max(1,Math.round(s/60))+' min':(s/3600).toFixed(1)+' h';}
function menuSlots(){
  if(!saveList.length){mslotsEl.innerHTML='<div class="mdim">no saved games</div>';return;}
  mslotsEl.innerHTML=saveList.map(r=>{const C=CLADES.find(c=>c.id===r.clade),conf=menu.confirm===r.id;
    return '<div class="slot" data-id="'+escH(r.id)+'"><b>'+escH(r.name||'game')+'</b><span>'+escH(C?C.name:r.clade)+'</span><span>'+fmtPlay(+r.playT||0)+'</span><span>'+fmtAgo(+r.played||+r.made||Date.now())+'</span><i data-act="export">export</i><i data-act="del"'+(conf?' class="warn"':'')+'>'+(conf?'sure?':'delete')+'</i></div>';}).join('');
}
function menuGo(fn){ // a quick fade to black round a change of world (a game starting, the menu coming back); the fade's own 1.8 s is the boot's and death's
  if(menu.busy)return;menu.busy=true;fadeEl.style.transition='opacity .35s';fadeEl.style.opacity=1;
  setTimeout(()=>{fn();menu.busy=false;setTimeout(()=>{fadeEl.style.opacity=0;setTimeout(()=>{fadeEl.style.transition='';},500);},120);},380);
}
function choose(c,pos,yaw,pitch,hp){ // into play as clade c (an index or the clade), at pos (the peak by default): the body, the cells round it, the mode
  const C=typeof c==='number'?CLADES[c]:c;
  playerBody(C,pos||V3(0,dispY,0),yaw,pitch,hp);cellsAround();
  mode='play';menuEl.classList.add('gone');fxShow(false);
  hintEl.textContent=isTouch?'left side: drag to swim. right side: drag to look, tap to bite, hold to grab. two fingers: ability':'w a s d swim, space rise, c dive, shift burst, q ability, click bite, right button or r hold, f first person, tab cursor, m mute, esc menu';
  hintEl.style.opacity=1;setTimeout(()=>{hintEl.style.opacity=0;},10000);
  saveT=SAVE_EVERY;initAudio();tryLock();
}
function toMenu(){ // play to the menu (esc with the pointer free): the game saved, the world cleared, the peak's cells back under the menu's camera
  if(mode!=='play')return;saveNow();curSave=null;unlock();
  menuGo(()=>{playerDrop();mode='menu';worldClear();player.pos.set(0,dispY,0);player.vel.set(0,0,0);cellsAround();layoutMenu();snapMed=true;menuEl.classList.remove('gone');menuPage('main');hintEl.style.opacity=0;menuRefresh();});
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
