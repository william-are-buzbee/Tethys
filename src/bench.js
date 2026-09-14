// bench.js — the sound bench (AUDIO.md; v11.34): every sound the game makes, rendered to a wav and posted to serve.js, so that
// what a sound *is* can be looked at (test/spectro.js draws it) instead of only heard. Open with #bench in the URL, or b in play
// or on the menu. Not part of the game: nothing here runs unless the bench is opened.
//   The rule of the thing: the bench never reimplements a sound. A one-shot is rendered by calling the real thump(); a bed is
// recorded off the real chain that initAudio built. A bench that owned its own copy of the recipes would measure the copy, and
// the copy would go stale the first time a knob moved. So: while the bench holds the graph, AU.bench stops auTick (which would
// fight it for every gain), and an offline render swaps actx out from under audio.js's own helpers (one shared scope; util.js's
// rule) and puts it back. Both are restored in a finally.
//   Three engines:
//   offline  a one-shot through the real thump(), into an OfflineAudioContext. Dry, at the ear, faster than real time.
//   solo     one live chain recorded off the master with everything else silenced, the medium open and the reverb shut: the bed
//            as the chain makes it, six seconds, real time (there is no offline copy of a graph that is already running).
//   live     the master bus exactly as the person hears it, wherever the player is standing. The space, the reverb and all.
// The wavs land in test/render/. `node test/spectro.js` turns them into pictures and a table of numbers.
const BN_SR=48000,BN_BED=6,BN_LIVE=20; // the render rate (fixed, so two runs compare); a bed's seconds; a live capture's
const bench={on:false,busy:false,log:[],el:null,logEl:null};
// ---------- wav ----------
// 16-bit pcm, the only format worth the four lines it takes. A float over 1 would wrap, so it clips — and spectro.js counts the clips.
function bnWav(chans,sr){
  const n=chans[0].length,nc=chans.length,b=new ArrayBuffer(44+n*nc*2),v=new DataView(b);
  const s=(o,t)=>{for(let i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i));};
  s(0,'RIFF');v.setUint32(4,36+n*nc*2,true);s(8,'WAVE');s(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,nc,true);
  v.setUint32(24,sr,true);v.setUint32(28,sr*nc*2,true);v.setUint16(32,nc*2,true);v.setUint16(34,16,true);s(36,'data');v.setUint32(40,n*nc*2,true);
  let o=44;for(let i=0;i<n;i++)for(let c=0;c<nc;c++){const x=Math.max(-1,Math.min(1,chans[c][i]));v.setInt16(o,x<0?x*32768:x*32767,true);o+=2;}
  return new Blob([b],{type:'audio/wav'});}
function bnPost(name,blob){ // to serve.js's sink. A file:// page or a dead server means no bench; say so rather than failing quietly
  return fetch('/_bench/'+name,{method:'POST',body:blob}).then(r=>{if(!r.ok)throw new Error(r.status+'');return name+'  '+(blob.size/1024).toFixed(0)+' kB';})
    .catch(e=>{throw new Error('post failed ('+e.message+') — is node serve.js running?');});}
function bnSay(s){bench.log.push(s);if(bench.logEl)bench.logEl.textContent=bench.log.slice(-26).join('\n');console.log('bench  '+s);}
// ---------- the offline engine ----------
// actx, AU.dry, AU.send and AU.whiteBuf are what every helper in audio.js reaches for. Point them at an offline context, let the
// real code build into it, put them back. AU.bench is up throughout: the tick must not touch a graph that is not there any more.
function bnOffline(sec,build,nc){
  const off=new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(nc||1,Math.ceil(sec*BN_SR),BN_SR);
  const kA=actx,kD=AU.dry,kS=AU.send,kW=AU.whiteBuf,kM=muted;
  actx=off;muted=false;
  const out=auGain(1);out.connect(off.destination);AU.dry=out;AU.send=auGain(0); // the send goes nowhere: an offline render is dry, and the space is the live capture's business
  AU.whiteBuf=auNoise(2.5,'white');
  let p;
  try{build(out,off);p=off.startRendering();}
  finally{actx=kA;AU.dry=kD;AU.send=kS;AU.whiteBuf=kW;muted=kM;} // back before the next frame, whatever build did
  return p;}
function bnBufFromCtx(buf){const ch=[];for(let c=0;c<buf.numberOfChannels;c++)ch.push(buf.getChannelData(c));return ch;}
// ---------- the live tap ----------
// A recorder hung off master. ScriptProcessor is deprecated and perfectly adequate for a dev tool that runs on demand: an
// AudioWorklet would want a module url, which the inlined single-file build does not have to give.
function bnRecord(sec){
  return new Promise(res=>{
    const sp=actx.createScriptProcessor(4096,2,2),sink=auGain(0),want=Math.ceil(sec*actx.sampleRate),L=[],R=[];let got=0,done=false;
    sp.onaudioprocess=e=>{if(done)return;const a=e.inputBuffer.getChannelData(0),b=e.inputBuffer.getChannelData(1);
      L.push(new Float32Array(a));R.push(new Float32Array(b));got+=a.length;
      if(got>=want){done=true;sp.disconnect();sink.disconnect();master.disconnect(sp);
        const cat=arr=>{const o=new Float32Array(got);let k=0;for(const p of arr){o.set(p,k);k+=p.length;}return o.subarray(0,want);};
        res([cat(L),cat(R)]);}};
    master.connect(sp);sp.connect(sink);sink.connect(actx.destination); // the sink is silent: the tap must be pulled, not heard twice
  });}
// Every chain audio.js owns, by name. This is a list of *references*, not of recipes — if a chain changes, the bench records the change.
function bnChains(){
  const c=[];const add=(id,e)=>{if(e)c.push({id:id,e:e});};
  add('col',AU.col);add('deep',AU.deep);add('cur',AU.cur);add('flow',AU.flow);add('scrape',AU.scrape);add('brush',AU.brush);add('heat',AU.heat);
  add('wind',AU.wind);add('rain_air',AU.rainAir);add('rain_hush',AU.rainHush);
  if(AU.crk)AU.crk.forEach((e,i)=>add('crackle_'+(i?'r':'l'),e));
  add('slosh',AU.slosh);add('slosh_low',AU.sloshB);add('rain_under',AU.rain);add('surf',AU.surf);add('surf_wash',AU.surfW);
  add('vent_rumble',AU.ventR);add('vent_boil',AU.ventB);add('forest',AU.forest);
  if(AU.bodies&&AU.bodies[0])add('body_pass',AU.bodies[0]);
  return c;}
// Solo: every chain's gain to zero but one, the medium wide open, the reverb and the taps shut, the emitters unhooked from their
// voices and their out gains up. Then record. The graph is restored by the caller's finally through bnRestore.
function bnHush(){
  const s={med:AU.med.frequency.value,shelf:AU.shelf.gain.value,wa:AU.wetA.gain.value,wb:AU.wetB.gain.value,taps:AU.taps.map(t=>t.g.gain.value),chains:[],press:AU.press.gain.value};
  const now=actx.currentTime,set=(p,v)=>{p.cancelScheduledValues(now);p.setValueAtTime(v,now);};
  set(AU.med.frequency,16000);set(AU.shelf.gain,0);set(AU.wetA.gain,0);set(AU.wetB.gain,0);set(AU.press.gain,0);
  AU.taps.forEach(t=>set(t.g.gain,0));
  for(const c of bnChains()){s.chains.push({e:c.e,g:c.e.out.gain.value,a:c.e.a});set(c.e.out.gain,0);c.e.a=0;}
  for(const v of AU.voices){s.chains.push({v:v,g:v.g.gain.value});set(v.g.gain,0);}
  return s;}
function bnRestore(s){
  const now=actx.currentTime,set=(p,v)=>{p.cancelScheduledValues(now);p.setValueAtTime(v,now);};
  set(AU.med.frequency,s.med);set(AU.shelf.gain,s.shelf);set(AU.wetA.gain,s.wa);set(AU.wetB.gain,s.wb);set(AU.press.gain,s.press);
  AU.taps.forEach((t,i)=>set(t.g.gain,s.taps[i]));
  for(const r of s.chains){if(r.v)set(r.v.g.gain,r.g);else{set(r.e.out.gain,r.g);r.e.a=r.a;}}}
// A placed chain (one that borrows a voice) is recorded straight: its out is patched to the dry bus for the take and unpatched after.
function bnSolo(c,sec){
  const now=actx.currentTime,patched=!c.e.self&&!c.e.voice;
  if(patched)c.e.out.connect(AU.dry);
  c.e.out.gain.cancelScheduledValues(now);c.e.out.gain.setValueAtTime(0.5,now); // a fixed level: two beds compare, and the master's own gain is the only thing between here and the file
  return bnRecord(sec).then(ch=>{c.e.out.gain.setValueAtTime(0,actx.currentTime);if(patched)try{c.e.out.disconnect(AU.dry);}catch(e){}return ch;});}
// ---------- the catalogue of one-shots ----------
// Every thump() in the game, with the arguments its call site actually passes. Where a call site scales by a state (a speed, a
// fall), the value here is a plausible middle and the comment says which. Grep a name here against src/ and it should be there.
const BN_SHOTS=[
  {id:'jet_squeeze',f:()=>thump(0.12,320,120,null,0.7),c:'audio.js: the ringmouth\'s jet, at full submersion'},
  {id:'land_rock',f:()=>thump(0.35,180,70,null,1.2,0.05),c:'audio.js: bottoming out on rock, landV≈5'},
  {id:'land_sediment',f:()=>thump(0.25,55,32,null,0.5,0.14),c:'audio.js: bottoming out on sediment, landV≈5'},
  {id:'knock_rock',f:()=>thump(0.25,150,60,null,1.4,0.04),c:'audio.js: the knock, spd≈3'},
  {id:'into_weed',f:()=>thump(0.07,0,0,null,2.8,0.12),c:'audio.js: brushing into weed — noise only, no chirp'},
  {id:'player_hurt',f:()=>thump(0.6,80,30,null,0.5,0.1),c:'player.js: taking damage'},
  {id:'player_bite',f:()=>thump(0.35,120,50,null,1.6,0.03),c:'combat.js: the player\'s bite'},
  {id:'fin_pulse',f:()=>thump(0.7,60,25,null,0.25,0.12),c:'player.js: the finback\'s ability'},
  {id:'flop',f:()=>thump(0.25,150,60,null,0.8,0.06),c:'player.js: a flop on land'},
  {id:'breach',f:()=>thump(0.4,260,40,null,2.5,0.3),c:'player.js: crossing the surface, v≈6'},
  {id:'clamp_blocked',f:()=>thump(0.3,90,40,null,0.8,0.06),c:'combat.js: a hold that did no damage'},
  {id:'hold_break',f:()=>thump(0.25,140,60,null,1.2,0.05),c:'combat.js: a hold torn free'},
  {id:'bite_landed',f:()=>thump(0.3,110,45,null,0.9,0.05),c:'combat.js: a bite on the player, dmg≈15'}
];
// ---------- the runs ----------
function bnShots(){ // every one-shot, offline. 1.2 s each: thump's longest tail is 0.45 plus the noise's
  let p=Promise.resolve();
  for(const s of BN_SHOTS)p=p.then(()=>bnOffline(1.2,()=>{s.f();}).then(b=>bnPost('shot_'+s.id+'.wav',bnWav(bnBufFromCtx(b),BN_SR))).then(bnSay));
  return p;}
function bnNoises(){ // the raw material: the four noise buffers and the two impulse responses, as auNoise and auIR make them
  const kinds=[['white','white'],['brown','brown'],['pink','pink'],['crackle',45]];
  let p=Promise.resolve();
  for(const [id,k] of kinds)p=p.then(()=>bnOffline(4,(out,off)=>{const s=off.createBufferSource();s.buffer=auNoise(4,k);s.connect(out);s.start();})
    .then(b=>bnPost('noise_'+id+'.wav',bnWav(bnBufFromCtx(b),BN_SR))).then(bnSay));
  const irs=[['cove',0.7,0.18,3000,500,0.004],['cavern',2.4,0.7,1200,200,0.012]];
  for(const [id,sec,tau,c0,c1,pre] of irs)p=p.then(()=>bnOffline(sec,(out,off)=>{const s=off.createBufferSource();s.buffer=auIR(sec,tau,c0,c1,pre);s.connect(out);s.start();},2)
    .then(b=>bnPost('ir_'+id+'.wav',bnWav(bnBufFromCtx(b),BN_SR))).then(bnSay));
  return p;}
function bnBeds(){ // the live chains, one at a time, real time. Six seconds each; twenty-odd chains is about two minutes
  const cs=bnChains();let p=Promise.resolve(),st=null;
  p=p.then(()=>{st=bnHush();});
  cs.forEach((c,i)=>{p=p.then(()=>{bnSay('bed '+(i+1)+'/'+cs.length+'  '+c.id);return bnSolo(c,BN_BED);})
    .then(ch=>bnPost('bed_'+c.id+'.wav',bnWav(ch,actx.sampleRate))).then(bnSay);});
  return p.then(()=>{if(st)bnRestore(st);},e=>{if(st)bnRestore(st);throw e;});}
function bnLive(sec){ // what the person hears, here, now. The tick keeps running: this one wants the space
  const was=AU.bench;AU.bench=false;
  return bnRecord(sec||BN_LIVE).then(ch=>{AU.bench=was;return bnPost('live_'+bnSite()+'.wav',bnWav(ch,actx.sampleRate));},e=>{AU.bench=was;throw e;})
    .then(bnSay);}
function bnSite(){ // a live take names itself by where it was taken: the depth and the fields, not a place name (PLANET: no place has a name)
  const P=player,d=Math.round(TIDE-P.pos.y),ch=chunkAt(P.pos.x,P.pos.z),f=ch?ch.f(P.pos.x,P.pos.z):null;
  const q=v=>Math.round(v*10);
  return (d<0?'air'+(-d):'d'+d)+(f?'_n'+q(f[FI.nut])+'e'+q(f[FI.expo])+'h'+q(f[FI.heat])+'f'+q(f[FI.flow]):'');}
// ---------- the panel ----------
function bnPanel(){
  if(bench.el)return;
  const d=document.createElement('div');
  d.style.cssText='position:fixed;left:12px;top:12px;z-index:60;background:rgba(6,14,18,0.88);color:#cfe6ea;font:11px ui-monospace,monospace;padding:10px 12px;border:1px solid #24424a;max-width:min(520px,60vw);white-space:pre;line-height:1.45';
  const h=document.createElement('div');h.textContent='sound bench   [1] one-shots   [2] noise + irs   [3] beds (~2 min)   [4] live 20 s here   [0] all three   b close';
  h.style.cssText='color:#7fb2bd;margin-bottom:6px';
  const l=document.createElement('div');l.textContent='ready. node serve.js must be running; the wavs land in test/render/.';
  d.appendChild(h);d.appendChild(l);document.body.appendChild(d);bench.el=d;bench.logEl=l;}
function bnOpen(v){
  bench.on=v;
  if(v){if(!AU.on)initAudio();if(!AU.on){alert('no audio context — click the page once first');bench.on=false;return;}bnPanel();bench.el.style.display='block';AU.bench=true;}
  else{if(bench.el)bench.el.style.display='none';AU.bench=false;}}
function bnRun(fn,what){
  if(bench.busy){bnSay('busy');return;}
  bench.busy=true;bench.log.length=0;bnSay(what+' …');
  fn().then(()=>bnSay('done: '+what),e=>bnSay('FAILED: '+e.message)).then(()=>{bench.busy=false;});}
addEventListener('keydown',e=>{
  if(e.code==='KeyB'&&!e.ctrlKey&&!e.metaKey&&(mode==='menu'||mode==='play')&&!showStats){bnOpen(!bench.on);return;} // not while the readout is open: v-b tune the water there
  if(!bench.on)return;
  if(e.code==='Digit1')bnRun(bnShots,'one-shots');
  else if(e.code==='Digit2')bnRun(bnNoises,'noise + irs');
  else if(e.code==='Digit3')bnRun(bnBeds,'beds');
  else if(e.code==='Digit4')bnRun(()=>bnLive(BN_LIVE),'live capture');
  else if(e.code==='Digit0')bnRun(()=>bnShots().then(bnNoises).then(bnBeds),'everything');
  else if(e.code==='Escape')bnOpen(false);});
if(HASH_FLAGS.indexOf('bench')>=0)addEventListener('click',function once(){removeEventListener('click',once);bnOpen(true);bnRun(()=>bnShots().then(bnNoises),'one-shots + noise (press 3 for the beds)');}); // a context needs a gesture; #bench arms the first click
