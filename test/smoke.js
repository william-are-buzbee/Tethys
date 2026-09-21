// Headless logic check: concatenates src/ in build order (src/order.txt), runs it against a stubbed THREE/DOM (stub.js),
// drives input — every listener on an event, as a browser does (v11.31.4: taking the first meant the mouse reached zoo.js and
// never input.js, so neither the bite nor the look had ever run here). Catches runtime errors (undefined names, bad calls) on
// the paths it drives — it says nothing about rendering or frame rate. TIER=low runs the low tier. Per clade: 30 menu frames,
// pick, then 1500 frames sprinting forward with bites, the grab, the ability and space every so often (stub.js __run), then the
// mouse both ways (locked, and the drag with the lock refused), then a kill and the respawn (v11.68: a fourth run as a spec that is no preset); the finback
// also swims 8400 frames from the peak straight out into the void, with a mid-run coilshell-style 'C' hold.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const ORDER=fs.readFileSync(path.join(ROOT,'src','order.txt'),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&s[0]!=='#');
let js=ORDER.map(n=>fs.readFileSync(path.join(ROOT,'src',n+'.js'),'utf8')).join('\n');
js+='\nglobal.__dbg=()=>({cells:chunks.size,creatures:creatures.length,visible:visibleCreatures,pos:[player.pos.x|0,player.pos.y|0,player.pos.z|0],ground:groundAt(player.pos.x,player.pos.z)|0,sub:+(function(){const ch=chunkAt(player.pos.x,player.pos.z);return ch?ch.f(player.pos.x,player.pos.z)[0]:sample(player.pos.x,player.pos.z).f[0];})().toFixed(2),lights:lightSources.length,hp:player.dead?0:1|0});';
js+='\nglobal.__hurt=(d)=>die("the test");';
js+='\nglobal.__eco=()=>{let s=0,nan=0;for(const N of POP.n)for(let c=0;c<N.length;c++){if(N[c]!==N[c])nan++;s+=N[c];}return {ledger:s|0,nan,kills:POP.kills,starved:POP.starved|0,laid:POP.laid,hatched:POP.hatched,eggs:eggs.length,carcasses:carcasses.length,juv:creatures.filter(c=>c.alive&&c.def.juv).length};};'
js+='\nglobal.__fx=(k)=>{fxToggle(k);return FX[k];};'; // v11.40: the effects list's switch (the de-res on: fxApply, the shimmer hidden)
js+='\nglobal.__mouse=()=>({yaw:player.yaw,pitch:player.pitch,biteCD:player.biteCD,grab:mouseGrab,locked:locked});'; // v11.31.4: the mouse reaches input.js at all
js+='\nglobal.__zoo={n:()=>ROSTER.length,mode:()=>mode,specs:()=>Object.keys(SPECS),labLoad:(id)=>labLoad(SPECS[id]),labBlank:(c)=>labLoad(SPEC_BLANK[c]),labAdd:(k)=>{lab.spec.parts.push({kind:k,style:stylesFor(k,lab.spec.clade)[0]});labBuild();labRender();}};';
js+='\nglobal.__start=(i)=>{if(i<CLADES.length){choose(i);return;}const sp=JSON.parse(JSON.stringify(SPECS.sickle));sp.id="smoke";choose(playerClade(sp));};'; // v11.47: the bare start (menu.js choose) for the clades the menu no longer offers; stub.js __run. v11.68: pick 3 is a spec that is no preset (the sickle, a hingeshell: no ability, derive's numbers)
js+='\nglobal.__clade=()=>({id:player.clade.id,spec:player.clade.spec.id,speed:player.clade.speed,ability:player.clade.ability});';
// the saves (v11.47): the slot the menu wrote, esc to the menu, continue from the list, and what came back
js+='\nglobal.__save={slots:()=>saveList.map(r=>({id:r.id,name:r.name,clade:r.clade,playT:r.playT,deaths:(r.deaths||[]).length})),cur:()=>curSave&&curSave.id,now:()=>saveNow(),menu:()=>{const h=global.__h;h["win:keydown"].forEach(f=>f({code:"Escape",preventDefault(){}}));},cont:(id)=>{saveRefresh();const r=saveList.find(r=>r.id===id);if(!r)throw new Error("no slot "+id);startFrom(r);},del:(id)=>{storeDel(id);saveRefresh();},t:()=>t,pop:()=>{let s=0;for(const N of POP.n)for(let c=0;c<N.length;c++)s+=N[c];return s;},seen:()=>PROFILE.seen.sp.length,creator:()=>PROFILE.creator,locked:()=>locked};';
const tmp=path.join(require('os').tmpdir(),'tethys_bundle.js');
fs.writeFileSync(tmp,'(function(){"use strict";\n'+js+'\n})();');
let failed=false;
for(const pick of [0,1,2,3]){
  for(const k of Object.keys(require.cache))delete require.cache[k];
  process.env.PICK=String(pick);
  try{
    require('./stub.js');
    const t0=Date.now();require(tmp);
    const boot=Date.now()-t0;
    const h=global.__h;
    console.log('clade',pick,'boot',boot+'ms',JSON.stringify(__dbg()));
    if(pick===1){if(__fx('pixel')!==true||__fx('texels')!==true)throw new Error('the pixel light or the texels switch did not turn on');console.log('  pixel light and texels: on');} // v11.40: the de-res through the switch (the stub compiles no shader; this is the JS path)
    if(pick===0){ // the bestiary: every species of the roster shown, its strike fired, then back to the menu
      const key=(code)=>h['win:keydown'].forEach(f=>f({code,preventDefault(){}}));
      __step(5);key('KeyZ');const n=__zoo.n();for(let i=0;i<n;i++){__step(6);key('Space');__step(40);key('KeyS');__step(10);key('KeyS');key('ArrowUp');__step(4);key('ArrowDown');key('ArrowRight');}
      for(let k=0;k<8;k++){key('ArrowUp');__step(3);} // every coat of one species (v11.8: the palette variants)
      key('KeyZ');__step(5);console.log('  bestiary:',n,'species shown, mode',__zoo.mode());
      if(__zoo.mode()!=='menu')throw new Error('the bestiary did not return to the menu');
      // the lab (v11.10): open it, load every spec and each clade's blank, fire the action, cruise, place one in the world, back
      key('KeyL');__step(5);if(__zoo.mode()!=='lab')throw new Error('l on the menu did not open the lab');
      let nl=0;for(const id of __zoo.specs()){__zoo.labLoad(id);__step(4);key('Space');__step(30);key('KeyS');__step(10);key('KeyS');nl++;}
      for(const c of ['ringmouths','slowbloods','hingeshells','drifters']){__zoo.labBlank(c);__step(6);}
      __zoo.labLoad('fin');__step(3);key('KeyP');__step(20);
      key('KeyL');__step(5);console.log('  lab:',nl,'specs built, one placed, mode',__zoo.mode(),'creatures',__dbg().creatures);
      if(__zoo.mode()!=='menu')throw new Error('the lab did not return to the menu');
    }
    console.log('  short run:',__run(),JSON.stringify(__dbg()));
    if(pick===3){const c=__clade();console.log('  as a spec:',JSON.stringify(c));if(c.spec!=='smoke')throw new Error('pick 3 is not the non-preset spec');}
    if(__dbg().visible<1)throw new Error('no creature is drawn after the short run (v11.18.1: an edit ate c.lodFar and every creature went invisible while still biting)');
    {const d=__dbg();if(!(d.visible>0))throw new Error('no creature drawn after the short run (v11.18 shipped with lodFar commented out: everything invisible, still biting)');}
    { // the mouse (v11.31.4): both ways of playing, since the test drove neither. Locked (how play starts): a move is the look, a
      // click is the bite, the right button is the grab. Tab releases the lock; then a drag looks and a short click bites.
      const fire=(k,e)=>h[k].forEach(f=>f(e||{})),key=(code,down)=>h['win:'+(down?'keydown':'keyup')].forEach(f=>f({code,preventDefault(){}}));
      const m0=__mouse();if(!m0.locked)throw new Error('play did not start with the pointer locked (menu.js choose asks for it)');
      fire('win:mousemove',{movementX:120,movementY:40});const m1=__mouse();
      if(Math.abs(m1.yaw-m0.yaw)<0.1||Math.abs(m1.pitch-m0.pitch)<0.05)throw new Error('a locked mousemove did not turn the head (the mouse never reached input.js)');
      fire('c:mousedown',{button:0,clientX:1,clientY:1});const m2=__mouse();if(!(m2.biteCD>0))throw new Error('a click while locked did not bite');
      fire('win:mouseup',{button:0});
      fire('c:mousedown',{button:2});if(!__mouse().grab)throw new Error('the right button did not take the grab');
      fire('win:mouseup',{button:2});if(__mouse().grab)throw new Error('the grab did not let go with the right button');
      key('Tab',true);key('Tab',false);if(__mouse().locked)throw new Error('Tab did not release the pointer');
      global.__nolock=true; // as an iframe or the app's browser refuses it: the drag fallback
      __step(2);const m3=__mouse();
      fire('c:mousedown',{button:0,clientX:10,clientY:10});fire('win:mousemove',{movementX:90,movementY:0});
      if(__mouse().locked)throw new Error('the lock was refused and taken anyway');
      if(Math.abs(__mouse().yaw-m3.yaw)<0.1)throw new Error('a drag did not turn the head with the lock refused');
      fire('win:mouseup',{button:0});
      fire('c:mousedown',{button:0,clientX:10,clientY:10});__step(40);const pre=__mouse().biteCD;fire('win:mouseup',{button:0});
      if(!(__mouse().biteCD>pre))throw new Error('a short click did not bite with the lock refused');
      global.__nolock=false;fire('c:mousedown',{button:0,clientX:1,clientY:1});fire('win:mouseup',{button:0}); // and back to locked play
      if(!__mouse().locked)throw new Error('a click did not take the pointer back');
      console.log('  mouse: look, bite and grab, locked and dragged');
    }
    if(pick===1){ // the lab from play (v11.11): l beside the player, a part added, l back to play
      const key=(code)=>h['win:keydown'].forEach(f=>f({code,preventDefault(){}}));
      key('KeyL');__step(3);if(__zoo.mode()!=='lab')throw new Error('l in play did not open the lab');
      __zoo.labLoad('lash');__step(3);__zoo.labAdd('weapon');__step(4);key('Space');__step(20);key('KeyR');__step(3);h['win:keyup'].forEach(f=>f({code:'KeyR',preventDefault(){}})); // r up again: held, it is the grab (v11.31)
      key('KeyL');__step(3);if(__zoo.mode()!=='play')throw new Error('the lab did not return to play');console.log('  lab from play: ok');}
    __hurt(1e4);__step(20);
    if(pick===1){ // a slot (v11.55, COMBAT.md §9): the death ends the animal — the menu comes back, the slot carries the death, continue puts a new animal at the peak
      const S0=global.__save;if(__zoo.mode()!=='menu')throw new Error('the death did not return to the menu');
      const dead=S0.slots().find(r=>r.deaths>0);if(!dead)throw new Error('the death was not written to the slot');
      S0.cont(dead.id);__step(3);if(__zoo.mode()!=='play')throw new Error('continue after a death did not start play');}
    const d=__dbg();console.log('  killed and '+(pick===1?'continued as a new animal':'respawned')+':',JSON.stringify(d));
    if(d.hp<=0||Math.hypot(d.pos[0],d.pos[2])>20)throw new Error('respawn did not put the player back at the peak alive');
    if(pick===1){
      const key=(code,down)=>h['win:'+(down?'keydown':'keyup')].forEach(f=>f({code,preventDefault(){}}));
      const mm=e=>h['win:mousemove'].forEach(f=>f(e));
      h['c:mousedown'].forEach(f=>f({button:0,clientX:1,clientY:1}));h['win:mouseup'].forEach(f=>f({button:0})); // the lab left the pointer free: take it back, or the look below does nothing
      key('KeyW',true);key('ShiftLeft',true);mm({movementX:0,movementY:60});key('Backquote',true);key('Backquote',false);
      let t1=Date.now();
      for(let k=0;k<12;k++){__step(700);const d=__dbg();console.log('  frame',(k+1)*700,'wall',(Date.now()-t1)+'ms',JSON.stringify(d));t1=Date.now();if(k===6)key('KeyC',true);}
      const e=__eco();console.log('  ecology:',JSON.stringify(e));if(e.nan)throw new Error('NaN in the ledger');if(!(e.ledger>500))throw new Error('the ledger holds almost nothing');
      { // the saves (v11.47): the slot new game wrote, esc to the menu (the pointer freed by tab first), continue from the list, the world back as it was, delete
        const S=global.__save,id=S.cur();if(!id)throw new Error('new game made no slot');
        if(!S.slots().some(r=>r.id===id))throw new Error('the slot is not in the list');
        key('Tab',true);key('Tab',false);if(S.locked())throw new Error('tab did not free the pointer');
        const p0=__dbg().pos.slice(),t0=S.t(),pop0=S.pop();if(!S.now())throw new Error('saveNow refused');
        S.menu();__step(3);if(__zoo.mode()!=='menu')throw new Error('esc did not return to the menu');
        if(__dbg().creatures<1)throw new Error('the menu has no creatures under it');
        S.cont(id);__step(3);if(__zoo.mode()!=='play')throw new Error('continue did not start play');
        const p1=__dbg().pos,dd=Math.hypot(p1[0]-p0[0],p1[2]-p0[2]);if(dd>2)throw new Error('continue put the player '+dd.toFixed(0)+' m from where it saved');
        if(Math.abs(S.t()-t0)>1)throw new Error('the clock did not come back: '+t0.toFixed(0)+' vs '+S.t().toFixed(0));
        const pop1=S.pop();if(Math.abs(pop1-pop0)>pop0*0.05+5)throw new Error('the ledger came back different: '+pop0.toFixed(0)+' vs '+pop1.toFixed(0));
        if(!(S.seen()>0))throw new Error('nothing was seen');if(!S.creator())throw new Error('the lab was used and the creator is not granted');
        S.del(id);if(S.slots().some(r=>r.id===id))throw new Error('delete left the slot');
        console.log('  saves: slot, menu, continue at',dd.toFixed(1),'m, clock',t0.toFixed(0),'s, ledger',pop0.toFixed(0),'->',pop1.toFixed(0),'seen',S.seen());
      }
    }
  }catch(e){failed=true;console.error('FAILED clade',pick,e&&e.stack||e);}
}
process.exit(failed?1:0);
