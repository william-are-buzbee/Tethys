// line.js — the line across generations (v11.69, LINEAGE.md §13.1–2): the lives on the slot and their tracks, the finback's clutch, the broods, the handover at death, the sparkle
// A slot's `line` is a list of lives, the last the one being played: {spec, preset, born, grown, died, cause, playT, parent, track, lay, broods}.
// born and died are the world clock `t` (seconds; DAY_S a game day), grown the clock at which the body is adult (a hatchling is ECO.juv of it
// until then, as the world's juveniles are), parent the index of the life that laid it (−1 the founder), track the position every LINE.trackS
// seconds of play run-length coded ([x,y,z] a sample, [x,y,z,k] k equal samples running), lay the clock of the last clutch. A brood is a
// record on the life that laid it — {cell, pos, n, born, hatch, spec, hatched, at} — and it is the truth about the clutch whether its cell is
// loaded or not: loaded, it is a clutch on the floor (creatures_ai.js eggs, ent −1) or young of the parent's spec (a kind of its own, lineKind)
// and n follows them; unloaded, n falls by BROOD_SURVIVE a game day — a stand-in for LINEAGE §8's sparse ledger entries, which would put the
// young through the same model as every other species. Only the current life's broods are eligible at its death (LINEAGE §4: your own
// children, not siblings or grandchildren); the earlier lives' broods still load and live as the world's animals. Nothing here is in the ledger.
// Decided for this pass (the person, 21 Sep 2026): the player breeds alone, no mate; at death you continue as the nearest living child; an
// unhatched clutch counts as a living child, and the world runs on to its hatch.
const LINE={trackS:5,near:3,cool:0.2,n:4}; // trackS: s of play between the track's samples; near: m over the floor a clutch may be laid from; cool: game days between clutches (the cost, until hunger is built: a cooldown, LINEAGE §6's bill of materials later); n: eggs a clutch (the slowblood's: several clutches, little in each, §3)
const BROOD_SURVIVE=0.8; // the share of a brood alive after a game day while its cell is unloaded (eggs and young alike) — the stand-in for §8's sparse entries: 4 eggs are 3.2 after a day and under one living child after about six
const LINE_PREY=['arrow','needle','scuttle']; // what the young of the player's line hunt: the player's own food (DESIGN The player)
function lineCur(){const L=curSave&&curSave.line;return L&&L.length?L[L.length-1]:null;}
function lifeNew(spec,preset,parent,born,grown){return {spec:JSON.parse(specToJSON(spec)),preset:preset,born:r3(born),grown:r3(grown),died:null,cause:'',playT:0,parent:parent,track:[],lay:-1e9,broods:[]};}
function lifeClade(L,k){const pre=CLADE_PRESETS.find(p=>p.id===L.preset),sp=specOk(L.spec);return sp?playerClade(sp,pre,k):CLADES.find(c=>c.id===L.preset)||CLADES[1];}
function lineStart(C){curSave.line=[lifeNew(C.spec,C.id,-1,t,t)];} // a new game: the founder, adult from the start
function lineLoadRec(rec,C){ // the line from a record, or (a record from before v11.69) the animal on it as the founder
  const ok=Array.isArray(rec.line)&&rec.line.length&&rec.line.every(L=>L&&L.spec&&Array.isArray(L.broods)&&Array.isArray(L.track));
  curSave.line=ok?JSON.parse(JSON.stringify(rec.line)):[lifeNew(C.spec,C.id,-1,t,t)];
  for(const L of curSave.line)for(const b of L.broods){b._ch=null;b._egg=null;}
}
// the kind the young of a spec are (a def per spec, as the lab's placed creature has one): the player's numbers, a hunter of the player's food
function lineKind(spec){const k='line:'+hashStr(specToJSON(spec)).toString(36);if(DEFS[k])return k;const C=playerClade(spec),st=statsOf(spec);
  DEFS[k]={build:()=>compile(spec),spec:spec,line:true,lineId:C.id,size:spec.size,speed:C.speed,accel:C.accel,hp:100,role:'hunter',turn:C.turn,cruiseF:0.45,home:20+spec.size*10,prey:LINE_PREY.filter(p=>DEFS[p]),detect:10+spec.size*5,reach:st.reach,dmg:C.bite,biteCD:1.2,cool:3,legs:C.legs,jetter:C.jet};
  return k;}
function growS(spec){return ecoOf(lineKind(spec)).grow*DAY_S;} // seconds from the hatch to adult: the world's rule (ECO.grow × mass^¼ days)
function hatchS(spec){return ECO.hatch*Math.pow(ecoOf(lineKind(spec)).mass,0.25)*DAY_S;} // seconds from the laying to the hatch (layEggs' rule, without its jitter)
// ---------- the track ----------
let lineAcc=0,lineCnt=0;
function lineTick(dt){ // in play (save.js updateSave): the life's clock and track, the loaded broods counted, the hatchling grown
  const L=lineCur(),P=player;if(!L||P.dead)return;L.playT+=dt;lineAcc+=dt;
  if(lineAcc>=LINE.trackS){lineAcc-=LINE.trackS;const s=[Math.round(P.pos.x),Math.round(P.pos.y),Math.round(P.pos.z)],T=L.track,q=T[T.length-1];
    if(q&&q[0]===s[0]&&q[1]===s[1]&&q[2]===s[2])q[3]=(q[3]||1)+1;else T.push(s);}
  lineCnt-=dt;if(lineCnt<=0){lineCnt=1;for(const M of curSave.line)for(const b of M.broods)if(b._ch&&b.hatched)b.n=broodLive(b);}
  if(P.clade.juv&&t>=L.grown)playerRebody(lifeClade(L,1)); // grown: the adult body in one step, as a juvenile of the world's grows up (there out of sight; here in view — a stand-in)
}
function broodLive(b){let n=0;for(const c of creatures)if(c.alive&&c.brood===b)n++;return n;}
// ---------- laying (x) ----------
function playerLay(){
  const P=player,C=P.clade,L=lineCur();if(mode!=='play'||P.dead||!C||!L)return false;
  const h=groundAt(P.pos.x,P.pos.z),ch=chunkAt(P.pos.x,P.pos.z);let why='';
  if(C.spec.clade!=='slowbloods')why='not this body'; // the slowblood's mode alone (LINEAGE §13.2); the ringmouth's one spawning and the hingeshell's den are §13.6
  else if(C.juv)why='not yet grown';
  else if(t-L.lay<LINE.cool*DAY_S)why='not yet';
  else if(P.sub<0.9||h>-4||P.pos.y-h>LINE.near+1.1||!ch)why='on the floor, under water';
  const at=V3(P.pos.x,h,P.pos.z);if(!why&&solidPush(at,0.6,null,ch))why='not here';
  if(why){hintEl.textContent=why;hintEl.style.opacity=1;setTimeout(()=>{if(hintEl.textContent===why)hintEl.style.opacity=0;},1500);return false;}
  const b={cell:ch.i*NCELL+ch.j,pos:[r3(at.x),r3(at.y),r3(at.z)],n:LINE.n,born:r3(t),hatch:r3(t+hatchS(L.spec)),spec:L.spec,hatched:false,at:r3(t),_ch:ch,_egg:null};
  L.broods.push(b);L.lay=r3(t);broodEgg(ch,b);P.pulse=1;thump(0.3,90,40,null,0.6,0.05);saveNow();return true;
}
// ---------- the broods in the world ----------
function broodEgg(ch,b){ // the clutch on the floor: the world's own egg (creatures_ai.js layEggs), outside the ledger (ent −1), its brood on it
  const kind=lineKind(b.spec),sz=0.12*Math.pow(b.spec.size,0.6),m=new THREE.Mesh(eggGeo(b.spec.clade),MATT),at=V3(b.pos[0],b.pos[1],b.pos[2]),n=Math.round(b.n);
  m.position.copy(at);m.scale.setScalar(sz);m.rotation.y=(b.born*7)%TAU;scene.add(m);
  const g={mesh:m,pos:at,ent:-1,e:null,kind:kind,chunk:ch,n:n,n0:n,t:Math.max(0.01,b.hatch-t),flesh:n*sz*sz*sz*40,flesh0:n*sz*sz*sz*40,gone:false,def:{size:sz*2},egg:true,brood:b};
  b.n=n;b._egg=g;eggs.push(g);ch.eggs.push(g);return g;
}
function broodHatch(g){const b=g.brood;b.hatched=true;b.n=g.n;b.at=r3(t);b._egg=null;broodSpawn(g.chunk,b,g.n);POP.hatched+=g.n;} // creatures_ai.js updateEggs
function broodSpawn(ch,b,n){ // the young at the clutch, as old as the brood is (juveniles until grown, then adults)
  const kind=lineKind(b.spec),age=t-b.hatch,gs=growS(b.spec),rng=mulberry((b.born*1000+n*7919)>>>0);
  for(let i=0;i<n;i++){const p=V3(b.pos[0]+(rng()-0.5)*6,0,b.pos[2]+(rng()-0.5)*6);p.y=groundAt(p.x,p.z)+1+b.spec.size*0.5;
    const c=spawn(ch,kind,p,rng,{ent:-1,juv:age<gs});if(age<gs)c.juv=Math.max(1,gs-age);c.brood=b;c.home.set(b.pos[0],p.y,b.pos[2]);}
}
function broodCatchUp(b){if(b._ch)return;const d=(t-b.at)/DAY_S;if(d<=0)return;if(!b.hatched&&t>=b.hatch)b.hatched=true;b.n*=Math.pow(BROOD_SURVIVE,d);b.at=r3(t);} // an unloaded brood, lazily: its hatch by the clock, its losses by the knob
function lineLoad(ch){ // a cell loaded (chunks.js genChunk): every brood of the line that lies in it is put back — the clutch, or its living young
  if(!curSave||!curSave.line)return;const ci=ch.i*NCELL+ch.j;
  for(const L of curSave.line)for(const b of L.broods){if(b.cell!==ci||b._ch)continue;broodCatchUp(b);const n=Math.round(b.n);if(n<1){b.n=0;continue;}b._ch=ch;
    if(!b.hatched)broodEgg(ch,b);else{b.n=n;broodSpawn(ch,b,n);}}
}
function lineUnload(ch){ // a cell unloading (chunks.js unloadChunk), before its creatures and eggs go: each brood's count from what is alive in it
  if(!curSave||!curSave.line)return;
  for(const L of curSave.line)for(const b of L.broods){if(b._ch!==ch)continue;b.n=b.hatched?broodLive(b):b._egg?b._egg.n:0;b._ch=null;b._egg=null;b.at=r3(t);}
}
// ---------- death and the handover ----------
// the current life's living children, each where it is: a young in a loaded cell, a clutch on its floor, an unloaded brood at its clutch
function lineChildren(){const L=lineCur(),out=[];if(!L)return out;
  for(const b of L.broods){if(b._ch){if(b.hatched){for(const c of creatures)if(c.alive&&c.brood===b)out.push({b:b,c:c,p:c.pos});}else if(b._egg&&b._egg.n>=1)out.push({b:b,c:null,p:V3(b.pos[0],b.pos[1],b.pos[2])});}
    else{broodCatchUp(b);if(Math.round(b.n)>=1)out.push({b:b,c:null,p:V3(b.pos[0],b.pos[1],b.pos[2])});}}
  return out;}
// the nearest living child of the dead (the person, 21 Sep 2026); an unhatched clutch counts, and the world runs on to its hatch: every cell out
// (the living into the ledger, the broods to their records), the clock to the hatch, the model catching up over the next ticks (ecology.js)
function lineNext(from){
  for(let k=0;k<20;k++){const cs=lineChildren();if(!cs.length)return null;let best=null,bd=1e18;for(const x of cs){const d=x.p.distanceTo(from);if(d<bd){bd=d;best=x;}}
    if(best.c||best.b.hatched)return best;
    worldClear();t=Math.max(t,best.b.hatch)+0.01;clockH=t*CLOCK_RATE;TIDE=tideAt(clockH);}
  return null;}
function lineContinue(x,cause){ // you are the child now, where and as it is (LINEAGE §4.5): its age, its place, the parent's spec
  const L=lineCur(),b=x.b,spec=b.spec,gs=growS(spec),grown=b.hatch+gs;let pos,yaw=player.yaw;
  if(x.c){const c=x.c;pos=c.pos.clone();T1.set(0,0,1).applyQuaternion(c.g.quaternion);yaw=Math.atan2(-T1.x,-T1.z);removeCreature(c);b.n=broodLive(b);}
  else{b.n=Math.max(0,b.n-1);pos=V3(b.pos[0],0,b.pos[2]);pos.y=groundAt(pos.x,pos.z)+2;}
  L.died=r3(t);L.cause=cause||'';
  curSave.line.push(lifeNew(spec,L.preset,curSave.line.length-1,b.hatch,grown));
  const C=lifeClade(lineCur(),t<grown?ECO.juv:1);
  playerBody(C,pos,yaw,0);cellsAround();snapMed=true;
  setTimeout(()=>{fadeEl.style.opacity=0;},300);sparkStart();saveNow();
}
// ---------- the sparkle (LINEAGE §7): the one mark of the magic, and here only at the handover ----------
// A four-point star on the screen with a short trail: it comes down from high in the view onto the child the camera now looks at, flickers
// like a candle's flame there and goes. starPath is the mark itself — one shape, so the save icon §7 asks for can be the same drawing. Nothing
// else in the game may show it (the rule of §7).
const SPARK={t:2.2,trail:16,r:14}; // s it lasts; points in its trail; px its radius at 1080 lines
let spark=null;const sparkEl=document.getElementById('spark');
function starPath(x,y,r,cx){cx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4-Math.PI/2,q=i&1?r*0.22:r;cx.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}cx.closePath();}
function sparkStart(){spark={t:0,tr:[]};}
function updateSpark(dt){
  if(!spark||!sparkEl)return;const cx=sparkEl.getContext&&sparkEl.getContext('2d');if(!cx){spark=null;return;}
  const W=innerWidth,H=innerHeight;if(sparkEl.width!==W||sparkEl.height!==H){sparkEl.width=W;sparkEl.height=H;}
  spark.t+=dt;const k=spark.t/SPARK.t;cx.clearRect(0,0,W,H);if(k>=1){spark=null;return;}
  T1.copy(player.pos).project(camera);const tx=(T1.x*0.5+0.5)*W,ty=(-T1.y*0.5+0.5)*H,s=H/1080; // the child on the screen
  const m=Math.min(1,k/0.55),e=1-(1-m)*(1-m),x=tx+(W*0.18)*(1-e)*Math.cos(e*2.2),y=ty-(H*0.42)*(1-e); // down in a curl onto it, easing in
  spark.tr.push(x,y);if(spark.tr.length>SPARK.trail*2)spark.tr.splice(0,2);
  const fl=0.85+0.15*Math.sin(spark.t*37)*Math.sin(spark.t*23),a=k<0.55?1:1-(k-0.55)/0.45,r=SPARK.r*s*fl*(k<0.55?1:1+1.5*(k-0.55));
  cx.globalCompositeOperation='lighter';
  for(let i=0;i<spark.tr.length-2;i+=2){const f=i/spark.tr.length;cx.fillStyle='rgba(255,236,200,'+(0.35*f*a).toFixed(3)+')';cx.beginPath();cx.arc(spark.tr[i],spark.tr[i+1],2.2*s*(0.4+f),0,TAU);cx.fill();}
  cx.fillStyle='rgba(255,244,222,'+(0.9*a).toFixed(3)+')';starPath(x,y,r,cx);cx.fill();
  cx.fillStyle='rgba(255,255,255,'+a.toFixed(3)+')';starPath(x,y,r*0.45,cx);cx.fill();cx.globalCompositeOperation='source-over';
}
