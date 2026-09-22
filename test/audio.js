// Headless audio check (v11.14): the audio graph (audio.js) built against the stub's fake AudioContext (every param throws on NaN), the player put
// at five sites with their cells loaded, and the space's numbers printed for each — the closed fraction, the mean wall distance, the floor, the lid,
// the wet, the wave's rate, the forest's density, the voices in use. Then the tick's cost: frames timed with the audio on and off. Proves the paths
// run and the numbers are sane; says nothing about how it sounds.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const ORDER=fs.readFileSync(path.join(ROOT,'src','order.txt'),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&s[0]!=='#');
let js=ORDER.map(n=>fs.readFileSync(path.join(ROOT,'src',n+'.js'),'utf8')).join('\n');
js+='\nglobal.__T={upd:0n,n:0};{const o=updateAudio;updateAudio=function(a){const t0=process.hrtime.bigint();o(a);__T.upd+=process.hrtime.bigint()-t0;__T.n++;};}';
js+='\nglobal.__au={line:()=>audioLine(),A:()=>AU_LINE,on:()=>AU.on,set:(x,y,z)=>{player.pos.set(x,y,z);player.vel.set(0,0,0);camera.position.set(x,y+2,z+8);const ci=cellOf(x),cj=cellOf(z);for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++)if(ci+di>=0&&cj+dj>=0&&ci+di<NCELL&&cj+dj<NCELL)loadChunkNow(ci+di,cj+dj);},'+
  'ground:(x,z)=>groundAt(x,z),lm:()=>LM,tide:()=>TIDE,hurt:()=>hurtPlayer(1,creatures[0]&&creatures[0].pos),mute:()=>toggleMute(),off:()=>{AU.on=false;},voices:()=>AU.voices.filter(v=>v.em).map(v=>v.em===AU.slosh?"slosh":v.em===AU.sloshB?"sloshB":v.em===AU.rain?"rain":v.em===AU.surf?"surf":v.em===AU.surfW?"surfW":v.em===AU.ventR?"ventR":v.em===AU.ventB?"ventB":v.em===AU.forest?"forest":"body")};';
const tmp=path.join(require('os').tmpdir(),'tethys_audio_bundle.js');
fs.writeFileSync(tmp,'(function(){"use strict";\n'+js+'\n})();');
process.env.PICK='1';
require('./stub.js');
require(tmp);
const h=global.__h;
for(let i=0;i<30;i++)__step(1);
h['mnew:click'][0]();h['mfounders:click'][0]({target:{dataset:{id:'fin'}}}); // v11.47: the menu's new game, then (v11.75) the finback from the founder's list
let failed=false;
function ok(c,msg){console.log((c?'  ok   ':'  FAIL ')+msg);if(!c)failed=true;}
ok(__au.on(),'the audio graph built against the stub');
const key=(code,down)=>h['win:'+(down?'keydown':'keyup')].forEach(f=>f({code,preventDefault(){}}));
key('KeyW',true);__step(40);key('KeyW',false);
const LM=__au.lm();
const sites=[
  {name:'the peak, spawn',x:0,z:0,dy:3},
  {name:'the shelf forest (330,0)',x:330,z:0,dy:3},
  {name:'the pit crater',x:LM.pit.x,z:LM.pit.z,dy:3},
  {name:'the vent, 20 m up the chimney',x:LM.chimney.x,z:LM.chimney.z,dy:20},
  {name:'the void below the chemocline',x:-67,z:-1695,dy:340}];
for(const s of sites){
  const y=__au.ground(s.x,s.z)+s.dy;__au.set(s.x,y,s.z);__step(45); // three probes
  const A=__au.A();console.log('  '+s.name+'  y '+y.toFixed(0)+'  depth '+(__au.tide()-y).toFixed(0)+'\n    '+__au.line()+'\n    voices: '+__au.voices().join(' '));
  ok(A.enc>=0&&A.enc<=1&&A.size>0&&A.wet>=0&&A.wet<=1,'numbers in range');
  s.A=Object.assign({},A);
}
ok(sites[2].A.enc>sites[0].A.enc,'the pit is more closed than the peak ('+sites[2].A.enc.toFixed(2)+' vs '+sites[0].A.enc.toFixed(2)+')');
ok(sites[1].A.forest>sites[0].A.forest,'the shelf forest reads as forest ('+sites[1].A.forest.toFixed(2)+' vs '+sites[0].A.forest.toFixed(2)+' at the peak)');
ok(sites[3].A.voices>0,'voices in use at the vent: '+sites[3].A.voices);
ok(sites[0].A.voices<=6,'the vent is not heard from the peak (voices at the peak: '+sites[0].A.voices+')');
// the events: a hit from a creature (a placed one-shot), mute and back
__au.set(0,__au.ground(0,0)+3,0);__step(5);__au.hurt();__step(5);__au.mute();__step(5);__au.mute();__step(5);ok(true,'a placed hit, mute and unmute ran');
// the cost: 600 frames sprinting through the shelf forest, updateAudio timed (the ticks are every third frame at 60 Hz, the probe every fifteenth)
__au.set(330,__au.ground(330,0)+3,0);__step(60);
key('KeyW',true);__T.upd=0n;__T.n=0;__step(600);const per=Number(__T.upd)/1e6/__T.n;
console.log('  cost: updateAudio '+per.toFixed(3)+' ms a frame averaged over '+__T.n+' frames (this machine, headless, against the stub)');
ok(per<0.3,'under 0.3 ms a frame headless');
console.log(failed?'AUDIO FAILED':'audio ok');
if(failed)process.exit(1);
