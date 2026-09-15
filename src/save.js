// save.js — the save files and the profile (v11.47, the person's ask): a slot is a whole game — the player, the clock, the world's ledger — kept
// in the browser's IndexedDB (localStorage where it is missing, memory in the tests), one record a game, with the profile beside them: the
// creator's key, what has been seen (species, clades, cores, part styles — the creator offers only those, lab.js) and the creator's own saved
// creatures. The browser is asked to keep the store (navigator.storage.persist), and any slot or the creatures can be written out as a .json
// file and read back in (fileSave/filePick), so nothing depends on the browser keeping it. The world outside the loaded cells *is* the ledger
// (ecology.js POP), so a save is the ledger's five tables and the clock; the loaded cells are counted into the tables as the tick counts them
// (the living, and the eggs). What a cell drew — carcasses, wounds, a school's shape — is not kept, as it is not kept across an unload either.
// A save is written every SAVE_EVERY seconds of play, on leaving to the menu (menu.js toMenu) and when the page is hidden.
const SAVE_V=1,SAVE_EVERY=30,SEEN_R=30; // the record format's version; seconds of play between autosaves; m: a species drawn nearer than this in play is seen
// ---------- the store ----------
// Callbacks, not promises: the localStorage and memory backends answer synchronously, which is what the headless tests need (their frames are
// driven by hand and no microtask ever runs between them); IndexedDB answers when it does.
const store={kind:'',db:null,mem:null}; // kind: 'idb' | 'ls' | 'mem'
function storeOpen(cb){
  if(store.kind)return cb();
  const idb=window.indexedDB;
  if(idb){try{const rq=idb.open('tethys',1);rq.onupgradeneeded=()=>{rq.result.createObjectStore('kv',{keyPath:'id'});};rq.onsuccess=()=>{store.db=rq.result;store.kind='idb';cb();};rq.onerror=()=>{storeFallback();cb();};
    try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});}catch(e){}return;}catch(e){}}
  storeFallback();cb();
}
function storeFallback(){store.kind=window.localStorage?'ls':'mem';store.mem=new Map();}
function storeOp(mode,fn,cb){try{const tx=store.db.transaction('kv',mode),rq=fn(tx.objectStore('kv'));rq.onsuccess=()=>cb(rq.result);rq.onerror=()=>cb(undefined);}catch(e){cb(undefined);}}
function kvSync(op,id,rec){ // the localStorage and memory backends
  if(store.kind==='mem'){const m=store.mem;if(op==='all')return Array.from(m.values());if(op==='get')return m.get(id);if(op==='put')m.set(rec.id,rec);else m.delete(id);return;}
  const ls=window.localStorage,P='tethys.kv.';
  try{if(op==='all'){const out=[];for(let i=0;i<ls.length;i++){const k=ls.key(i);if(k.indexOf(P)===0)out.push(JSON.parse(ls.getItem(k)));}return out;}
    if(op==='get'){const s=ls.getItem(P+id);return s?JSON.parse(s):undefined;}if(op==='put')ls.setItem(P+rec.id,JSON.stringify(rec));else ls.removeItem(P+id);}catch(e){return op==='all'?[]:undefined;}
}
function storeAll(cb){storeOpen(()=>{if(store.kind==='idb')storeOp('readonly',os=>os.getAll(),r=>cb(r||[]));else cb(kvSync('all'));});}
function storeGet(id,cb){storeOpen(()=>{if(store.kind==='idb')storeOp('readonly',os=>os.get(id),cb);else cb(kvSync('get',id));});}
function storePut(rec,cb){storeOpen(()=>{if(store.kind==='idb')storeOp('readwrite',os=>os.put(rec),()=>{if(cb)cb();});else{kvSync('put',rec.id,rec);if(cb)cb();}});}
function storeDel(id,cb){storeOpen(()=>{if(store.kind==='idb')storeOp('readwrite',os=>os.delete(id),()=>{if(cb)cb();});else{kvSync('del',id);if(cb)cb();}});}
// a file out and a file in: the browser's download, and a file picker; both only on a click
function fileSave(name,txt){try{const a=document.createElement('a');a.href=window.URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);setTimeout(()=>{window.URL.revokeObjectURL(a.href);},2000);}catch(e){console.warn('save: could not write the file: '+e.message);}}
function filePick(cb){try{const i=document.createElement('input');i.type='file';i.accept='.json,application/json';i.onchange=()=>{const f=i.files&&i.files[0];if(!f)return;const r=new window.FileReader();r.onload=()=>{cb(String(r.result));};r.readAsText(f);};i.click();}catch(e){console.warn('save: could not read a file: '+e.message);}}
function escH(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));} // a name into markup
// ---------- the profile ----------
const PROFILE={id:'profile',kind:'profile',creator:false,seen:{sp:[],cl:[],co:[],pt:[]},creatures:{}}; // creator: the menu shows the creator; seen: species ids, clades, core kinds, part kind:style; creatures: the creator's saved specs, JSON by name
let profileDirty=false,profileLoaded=false;const seenSpecs=new Set(); // nothing is written before the stored profile is read (main.js profileLoad): a write first would empty the seen lists
function profileLoad(cb){storeGet('profile',r=>{if(r){if(r.creator)PROFILE.creator=true;if(r.seen)for(const k in PROFILE.seen)if(Array.isArray(r.seen[k]))for(const v of r.seen[k])if(typeof v==='string'&&PROFILE.seen[k].indexOf(v)<0)PROFILE.seen[k].push(v);if(r.creatures&&typeof r.creatures==='object')for(const k in r.creatures)if(typeof r.creatures[k]==='string'&&!(k in PROFILE.creatures))PROFILE.creatures[k]=r.creatures[k];}for(const id of PROFILE.seen.sp)seenSpecs.add(id);profileLoaded=true;if(profileDirty)profileSave();if(cb)cb();});}
function profileSave(){if(!profileLoaded){profileDirty=true;return;}profileDirty=false;storePut(JSON.parse(JSON.stringify(PROFILE)));}
function seeSpec(id){ // a species seen up close (creatures_ai, and the player's own clade): it, its clade, its core and each part's kind:style are the creator's from here
  if(seenSpecs.has(id))return;const sp=SPECS[id];if(!sp)return;seenSpecs.add(id);const S=PROFILE.seen,add=(a,v)=>{if(a.indexOf(v)<0)a.push(v);};
  add(S.sp,id);add(S.cl,sp.clade);add(S.co,sp.core.kind);for(const p of sp.parts)add(S.pt,p.kind+':'+(p.style||''));profileDirty=true;
}
function seen(k,v){return PROFILE.seen[k].indexOf(v)>=0;}
function grantCreator(){if(PROFILE.creator)return;PROFILE.creator=true;profileSave();if(profileLoaded)menuRefresh();} // the lab used once, or #creator in the URL (main.js); the menu's word appears
// ---------- the record ----------
let curSave=null,saveT=0,playT=0,saveList=[]; // the slot being played {id,name,made,played,playT}; the autosave clock; seconds played in it; the slots known to the menu, newest played first
function r3(v){return Math.round(v*1000)/1000;}
function popRows(){ // the ledger's tables as arrays, the loaded cells counted as ecoTick counts them (creatures alive on the ledger, and the eggs)
  const n=POP.n.map(a=>Array.from(a,r3));
  for(const ch of chunks.values()){const c=ch.i*NCELL+ch.j;if(!POP.done[c])continue;const cnt=new Float32Array(SPAWN.length);for(const o of ch.creatures)if(o.alive&&o.ent>=0)cnt[o.ent]+=1;for(const g of ch.eggs)cnt[g.ent]+=g.n;for(let ei=0;ei<SPAWN.length;ei++)n[ei][c]=r3(cnt[ei]/Q.creatures);}
  return {ents:SPAWN.map(e=>e.kind),n:n,k:POP.k.map(a=>Array.from(a,r3)),ke:POP.ke.map(a=>Array.from(a,r3)),cd:POP.cd.map(a=>Array.from(a,r3)),ow:POP.ow.map(a=>Array.from(a,r3)),done:Array.from(POP.done),last:POP.last,tally:[POP.births,POP.deaths,POP.kills,POP.starved,POP.eaten,POP.recruits,POP.laid,POP.hatched]};
}
function popLoad(p){ // the ledger from a record; a save from another roster (SPAWN's kinds differ) gets a fresh census instead, and the player and the clock still load
  ecoReset();
  const ok=p&&Array.isArray(p.ents)&&p.ents.length===SPAWN.length&&p.ents.every((k,i)=>k===SPAWN[i].kind)&&['n','k','ke','cd','ow'].every(k=>Array.isArray(p[k])&&p[k].length===SPAWN.length&&p[k].every(a=>Array.isArray(a)&&a.length===ECO_CELLS))&&Array.isArray(p.done)&&p.done.length===ECO_CELLS;
  if(!ok){if(p)console.warn('save: the roster changed since this save; the world starts fresh');return false;}
  for(let ei=0;ei<SPAWN.length;ei++){POP.n[ei].set(p.n[ei]);POP.k[ei].set(p.k[ei]);POP.ke[ei].set(p.ke[ei]);POP.cd[ei].set(p.cd[ei]);POP.ow[ei].set(p.ow[ei]);}
  POP.done.set(p.done);POP.last=+p.last||0;const T=Array.isArray(p.tally)?p.tally:[];[POP.births,POP.deaths,POP.kills,POP.starved,POP.eaten,POP.recruits,POP.laid,POP.hatched]=[0,1,2,3,4,5,6,7].map(i=>+T[i]||0);
  let all=true;for(let c=0;c<ECO_CELLS;c++)if(!POP.done[c]){all=false;break;}if(all)POP.gen=null; // the paper census was done in the saved game; the settle after it is boot's, not a load's
  for(let ei=0;ei<SPAWN.length;ei++){const N=POP.n[ei];for(let c=0;c<ECO_CELLS;c++)if(!(N[c]>=0))N[c]=0;} // a hand-edited file: nothing negative or NaN into the model
  return true;
}
function saveRecord(){ // the game as it stands, as a record for the store
  const P=player,s=curSave;
  return {id:s.id,kind:'save',v:SAVE_V,name:s.name,made:s.made,played:Date.now(),playT:Math.round(playT),clade:P.clade.id,pos:[r3(P.pos.x),r3(P.pos.y),r3(P.pos.z)],yaw:r3(P.yaw),pitch:r3(P.pitch),hp:Math.round(P.hp),t:r3(t),pop:popRows()};
}
function saveNow(){if(!curSave||mode!=='play'||player.dead||!player.clade)return false;camNote();const rec=saveRecord();curSave.played=rec.played;curSave.playT=rec.playT;storePut(rec);if(profileDirty)profileSave();saveT=SAVE_EVERY;return true;}
function updateSave(dt){if(mode!=='play'||!curSave)return;playT+=dt;saveT-=dt;if(saveT<=0)saveNow();}
function saveRefresh(cb){ // the slots read again; first, a shadow the page left on its way out (saveShadow) goes into the store — it is the latest state of that slot, nothing later can exist
  let sh=null;try{const ls=window.localStorage,s=ls&&ls.getItem('tethys.last');if(s){ls.removeItem('tethys.last');sh=JSON.parse(s);}}catch(e){}
  const go=()=>storeAll(rs=>{saveList=rs.filter(r=>r&&r.kind==='save'&&r.pop).sort((a,b)=>(b.played||b.made||0)-(a.played||a.made||0));if(cb)cb();});
  if(sh&&sh.kind==='save'&&sh.pop&&typeof sh.id==='string')storePut(sh,go);else go();
}
// The title screen's camera (v11.47.2, the person's ask): from the exact spot you last died, left or saved in, every time. The camera's
// position and look direction go to localStorage synchronously at every one of those events (saveNow, saveShadow, player.js die) — a few
// dozen bytes, the one thing here that must survive even a hard close — and menu.js reads it at boot (menuCam). Nothing until the first game.
function camNote(){try{const ls=window.localStorage;if(!ls||mode!=='play')return;const d=V3(0,0,-1).applyQuaternion(camera.quaternion);ls.setItem('tethys.cam',JSON.stringify({p:[r3(camera.position.x),r3(camera.position.y),r3(camera.position.z)],d:[r3(d.x),r3(d.y),r3(d.z)],t:Date.now()}));}catch(e){}}
function camRead(){try{const ls=window.localStorage,s=ls&&ls.getItem('tethys.cam');if(!s)return null;const o=JSON.parse(s);if(!Array.isArray(o.p)||!Array.isArray(o.d)||o.p.length!==3||o.d.length!==3)return null;const p=o.p.map(v=>+v||0),d=o.d.map(v=>+v||0);if(Math.abs(p[0])>HALF+2000||Math.abs(p[2])>HALF+2000||!(d[0]*d[0]+d[1]*d[1]+d[2]*d[2]>0.1))return null;return {p:p,d:d};}catch(e){return null;}}
function saveShadow(){if(!curSave||mode!=='play'||player.dead||!player.clade)return;camNote();try{const ls=window.localStorage;if(ls)ls.setItem('tethys.last',JSON.stringify(saveRecord()));}catch(e){}} // the page going away (v11.47.1): IndexedDB's put may not finish before it does, localStorage's write is synchronous and does; read back by saveRefresh at the next boot
function saveName(){let n=0;for(const r of saveList){const m=/^game (\d+)$/.exec(r.name||'');if(m&&+m[1]>n)n=+m[1];}return 'game '+(n+1);}
function saveImport(txt,cb){ // a file back in (menu.js): checked as far as the shape goes, given a new id if its own is taken, stored
  let r=null;try{r=JSON.parse(txt);}catch(e){}
  if(!r||r.kind!=='save'||!r.pop||typeof r.clade!=='string'){if(cb)cb(null);return;}
  const rec={id:typeof r.id==='string'&&!saveList.some(s=>s.id===r.id)?r.id:'s'+Date.now().toString(36),kind:'save',v:+r.v||SAVE_V,name:typeof r.name==='string'?r.name.slice(0,40):saveName(),made:+r.made||Date.now(),played:+r.played||Date.now(),playT:+r.playT||0,clade:r.clade,pos:Array.isArray(r.pos)?r.pos.slice(0,3).map(v=>+v||0):[0,dispY,0],yaw:+r.yaw||0,pitch:+r.pitch||0,hp:+r.hp||0,t:Math.max(0,+r.t||0),pop:r.pop};
  storePut(rec,()=>{saveRefresh(()=>{if(cb)cb(rec);});});
}
// ---------- the world in and out ----------
function worldClear(){ // every cell out (the living written into the ledger), a cell mid-build dropped with what it had spawned, the lists emptied
  activeGen=null;activeKey=null;for(const ch of Array.from(chunks.values()))unloadChunk(ch);
  for(const g of eggs.slice())removeEgg(g);for(const c of creatures)disposeCreature(c);creatures.length=0;carcasses.length=0;schools.length=0;
}
function cellsAround(){const ci=cellOf(player.pos.x),cj=cellOf(player.pos.z);for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const i=ci+di,j=cj+dj;if(i>=0&&j>=0&&i<NCELL&&j<NCELL)loadChunkNow(i,j);}shadowDirty();} // the 3×3 round the player before the first frame (boot, a game starting, the menu); the rest streams
function playerBody(C,pos,yaw,pitch,hp){ // the player's body built and placed as the clade; the old one disposed
  const P=player;playerDrop();const b=C.build();castOn(b.g);scene.add(b.g);
  P.clade=C;P.b=b;P.g=b.g;P.anim=b.anim;P.mass=C.mass;P.def.size=C.size;P.maxhp=C.hp;P.hp=hp>0?Math.min(hp,C.hp):C.hp;
  P.pos.copy(pos);b.g.position.copy(pos);P.vel.set(0,0,0);P.yaw=+yaw||0;P.pitch=clamp(+pitch||0,-1.35,1.35);P.dead=false;P.cd=0;P.inkT=0;P.bleed=0;P.hold=null;P.held=0;P.grab=null;P.holding=0;P.withdrawn=false;P.fp=false;P.camAbove=false;P.camFlipT=0;P.wet=true;P.sub=1;P.hurtT=0;P.lastHurt=-100;P.jetT=0;P.pulse=0;P.biteCD=0;P.flopT=0;
  camera.position.copy(pos).add(V3(0,2,8));snapMed=true;seeSpec(C.id);
}
function playerDrop(){const P=player;if(!P.g)return;releaseAll(P);for(const c of creatures)if(c.target===P)dropTarget(c);ghostBody(P.g,false);scene.remove(P.g);P.g.traverse(o=>{if(o.geometry)o.geometry.dispose();});P.g=null;P.b=null;P.anim=null;P.dead=true;P.fp=false;P.hold=null;P.held=0;P.grab=null;}
function startNew(C){ // a new game (menu.js): a fresh ledger, the clock at boot, the player at the peak as the clade, a new slot written at once so continue lists it
  worldClear();ecoReset();t=0;clockH=0;TIDE=tideAt(0);
  curSave={id:'s'+Date.now().toString(36)+Math.floor(Math.random()*1296).toString(36),name:saveName(),made:Date.now(),played:Date.now(),playT:0};playT=0;
  choose(C);saveNow();saveRefresh();
}
function startFrom(rec){ // continue a slot (menu.js): the clock and the ledger as saved, the player where it was
  const C=CLADES.find(c=>c.id===rec.clade)||CLADES[1];
  worldClear();t=Math.max(0,+rec.t||0);clockH=t*CLOCK_RATE;TIDE=tideAt(clockH);popLoad(rec.pop);
  curSave={id:rec.id,name:rec.name,made:rec.made,played:rec.played,playT:+rec.playT||0};playT=curSave.playT;
  const p=Array.isArray(rec.pos)?V3(+rec.pos[0]||0,+rec.pos[1]||0,+rec.pos[2]||0):V3(0,dispY,0);if(Math.abs(p.x)>HALF+1500||Math.abs(p.z)>HALF+1500)p.set(0,dispY,0);
  choose(C,p,rec.yaw,rec.pitch,rec.hp);
}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveNow();});
addEventListener('pagehide',()=>{saveNow();saveShadow();});addEventListener('beforeunload',()=>{saveShadow();});
document.addEventListener('pointerlockchange',()=>{if(mode==='play'&&!document.pointerLockElement)saveNow();}); // the first esc from locked play frees the pointer (the browser keeps that esc): save there, so a close right after it loses nothing (v11.47.1)
