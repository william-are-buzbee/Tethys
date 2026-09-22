// audio.js — the sound of the water (AUDIO.md, v11.14). A 3D space for sound read from the world four times a second (twelve rays: the
// reverb, three early reflections, the lid, the floor), occlusion by the terrain and the rocks, and the water heard as itself — the slosh of
// the wave over you, the shore's breakers, the current, the fissure, the forest, the hush and the pressure of the deep — plus the body's own
// sounds and the water the nearest creatures move. Everything is procedural: noise buffers and impulse responses made at boot, no files.
// The DSP runs on the audio thread; the main thread pushes parameters at 20 Hz (AU_DT) with setTargetAtTime (smoothed there, so no zipper
// noise) and probes the space at 4 Hz (AU_PT). No node is made per frame; a one-shot (thump) builds a few short nodes and drops them.
// Nothing here reads a label: place is the condition fields, the geometry around the listener and the depth.
let actx=null,master=null,muted=false;
const AU_DT=0.05,AU_PT=0.25,SND_C=1480,AU_VN=8,AU_REACH=45,AU_STEP=3; // the push interval; the probe's; the speed of sound in water (m/s: 1 unit = 1 m); the voice pool; the probe's reach and step, m
const AU_K={vol:0.5,bed:1,cut:1}; // the tuner's knobs: the master (0.8 in v11.14: too loud), every bed's level, the water's lowpass scale
const AU_LINE={enc:0,size:AU_REACH,floor:AU_REACH,lid:AU_REACH,wet:0,voices:0,forest:0,cur:0,wr:0,occ:0}; // the readout's numbers (main.js)
// The twelve rays: up, down, four level, four level-up at 45°, two level-down at 30° (the world's axes; the taps are panned relative to the camera)
const AU_DIRS=(function(){const d=[[0,1,0],[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]],s=Math.SQRT1_2,c=Math.cos(Math.PI/6),n=Math.sin(Math.PI/6);
  d.push([s*s,s,s*s],[-s*s,s,s*s],[s*s,s,-s*s],[-s*s,s,-s*s],[c,-n,0],[-c,-n,0]);return d.map(v=>{const l=Math.hypot(v[0],v[1],v[2]);return [v[0]/l,v[1]/l,v[2]/l];});})();
const AU={on:false,hit:new Float32Array(12),hitK:new Uint8Array(12),ems:[],voices:[],bodies:[],taps:[],t:0,pt:0,ph:0,jetT:0,rk:0,fl:0,lastH:0,wr:0,occI:0};
function auP(p,v,tau){if(p&&isFinite(v))p.setTargetAtTime(v,actx.currentTime,tau||0.08);} // every parameter goes through here: NaN never reaches the graph
function auNoise(sec,kind){ // one looped buffer per kind: white, brown (the old bed's recipe), crackle (sparse spikes with a two-cycle ring; kind is the rate a second)
  const sr=actx.sampleRate,n=Math.floor(sec*sr),b=actx.createBuffer(1,n,sr),d=b.getChannelData(0);
  if(kind==='white'){for(let i=0;i<n;i++)d[i]=Math.random()*2-1;}
  else if(kind==='brown'){let last=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;last=(last+0.02*w)/1.02;d[i]=last*3.5;}}
  else if(kind==='pink'){let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;b0=0.99886*b0+w*0.0555179;b1=0.99332*b1+w*0.0750759;b2=0.96900*b2+w*0.1538520;b3=0.86650*b3+w*0.3104856;b4=0.55000*b4+w*0.5329522;b5=-0.7616*b5-w*0.0168980;d[i]=(b0+b1+b2+b3+b4+b5+b6+w*0.5362)*0.11;b6=w*0.115926;}} // Kellet's pink: −3 dB/oct, water's own colour
  else{let i=0;while(i<n){i+=Math.floor(-Math.log(1-Math.random())*sr/kind)+1;if(i>=n)break;const a=(Math.random()*2-1)*(0.25+0.75*Math.random()*Math.random()),len=4+Math.floor(Math.random()*8);
    for(let k=0;k<len&&i+k<n;k++)d[i+k]+=a*Math.exp(-k*0.45)*Math.cos(k*1.9);}}
  return b;}
function auIR(sec,tau,c0,c1,pre){ // an impulse response: stereo noise decaying over tau, lowpassed harder as it goes (c0 → c1 Hz: the water's tail is dull), pre s of silence first; unit energy, so a wet gain means what it says
  const sr=actx.sampleRate,n=Math.floor(sec*sr),b=actx.createBuffer(2,n,sr),p0=Math.floor(pre*sr);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);let y=0,e=0;
    for(let i=p0;i<n;i++){const tt=(i-p0)/sr,a=Math.exp(-TAU*lerp(c0,c1,tt/sec)/sr);y=a*y+(1-a)*(Math.random()*2-1);d[i]=y*Math.exp(-tt/tau);e+=d[i]*d[i];}
    const g=1/Math.sqrt(e||1);for(let i=0;i<n;i++)d[i]*=g;}
  return b;}
function auSrc(buf){const s=actx.createBufferSource();s.buffer=buf;s.loop=true;s.start(0,Math.random()*Math.max(0,buf.duration-0.5));return s;} // a loop started somewhere in the buffer: two voices from one buffer don't march in step
function auFilt(type,f,q){const b=actx.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=q||0.7;return b;}
function auGain(v){const g=actx.createGain();g.gain.value=v||0;return g;}
// A source chain that lives for the session: a loop → its filter → out. A self chain goes straight to the dry bus (unpanned: it is at the ear);
// a placed one (x,y,z) is an emitter that borrows a voice from the pool while it is audible. a: its strength now, set each tick; c0: the cutoff
// it would have at the ear (absorption and occlusion lower it); send: its share into the reverb (a wall's slap; the vent's hum in its hole).
function auChain(buf,type,f,q,self,c0,send,flat,reach){const s=auSrc(buf),b=auFilt(type,f,q),out=auGain(0);s.connect(b);b.connect(out);if(self)out.connect(AU.dry);
  return {out:out,f:b,a:0,x:0,y:0,z:0,c0:c0||3000,send:send===undefined?0.6:send,voice:null,occ:0,pri:0,self:!!self,flat:!!flat,reach:reach||0,d:0,g:0};} // flat: a is already its strength at the ear (no distance curve: the slosh, whose fade is depth's; the forest, summed with its own reach); reach: silent past it, m
function auVoice(){const g=auGain(0),lp=auFilt('lowpass',3000,0.3),pan=actx.createPanner(),sg=auGain(0);
  pan.panningModel=Q.hrtf?'HRTF':'equalpower';pan.distanceModel='linear';pan.refDistance=1;pan.maxDistance=1e5;pan.rolloffFactor=0; // the distance is ours (below, auDist): the water's reach and its absorption, not the browser's curve
  g.connect(lp);lp.connect(pan);pan.connect(AU.dry);pan.connect(sg);sg.connect(AU.send);return {g:g,lp:lp,pan:pan,sg:sg,em:null};}
function auPos(pan,x,y,z,tau){if(pan.positionX){auP(pan.positionX,x,tau);auP(pan.positionY,y,tau);auP(pan.positionZ,z,tau);}else if(isFinite(x+y+z))pan.setPosition(x,y,z);}
function initAudio(){
  if(actx)return;
  try{
    actx=new (window.AudioContext||window.webkitAudioContext)();
    const white=auNoise(2.5,'white'),brown=auNoise(4,'brown'),pink=auNoise(4,'pink'),crL=auNoise(6,45),crR=auNoise(6,45);AU.whiteBuf=white;
    // the buses: dry + the taps + the reverbs → the medium (the water's lowpass by depth, a shelf for the hollow and the flinch) → the compressor → master.
    // music (the person's, later) joins after the medium: the water does not colour it.
    master=auGain(muted?0:AU_K.vol*(Q.vol||1));const comp=actx.createDynamicsCompressor();comp.threshold.value=-3;comp.knee.value=2;comp.ratio.value=8;comp.attack.value=0.005;comp.release.value=0.25; // a guard on peaks only: the browser's compressor adds makeup gain by its threshold, and −14 dB lifted the whole bed (v11.14.1)
    const shelf=auFilt('lowshelf',180,0.7);shelf.gain.value=0;const med=auFilt('lowpass',1800,0.5);med.connect(shelf);shelf.connect(comp);comp.connect(master);master.connect(actx.destination);
    AU.med=med;AU.shelf=shelf;AU.music=auGain(1);AU.music.connect(comp);
    AU.dry=auGain(1);AU.dry.connect(med);
    // the reverbs: the send → a cove (0.7 s, dense, closing 3 kHz → 500) and a cavern (2.4 s, 1.2 kHz → 200, a 12 ms pre-delay), mixed by the space's size
    AU.send=auGain(0);AU.rvA=actx.createConvolver();AU.rvA.buffer=auIR(0.7,0.18,3000,500,0.004);AU.rvB=actx.createConvolver();AU.rvB.buffer=auIR(2.4,0.7,1200,200,0.012);
    AU.wetA=auGain(0);AU.wetB=auGain(0);AU.send.connect(AU.rvA);AU.rvA.connect(AU.wetA);AU.wetA.connect(med);AU.send.connect(AU.rvB);AU.rvB.connect(AU.wetB);AU.wetB.connect(med);
    // the early reflections: the dry bus, dulled (2.5 kHz), into three delays — each the round trip to one of the nearest walls the probe found, panned to that wall's side
    const tapIn=auFilt('lowpass',2500,0.5);AU.dry.connect(tapIn);
    for(let i=0;i<3;i++){const d=actx.createDelay(0.2),g=auGain(0);d.delayTime.value=0.02;let p=null;if(actx.createStereoPanner){p=actx.createStereoPanner();tapIn.connect(d);d.connect(p);p.connect(g);}else{tapIn.connect(d);d.connect(g);}g.connect(med);AU.taps.push({d:d,g:g,p:p});}
    for(let i=0;i<AU_VN;i++)AU.voices.push(auVoice());
    // the self sounds: at the ear, unpanned. 1 the column (the water's own hiss, the shallows'), 2 the deep (brown) and the pressure (two sines beating below the chemocline),
    // 5 the current, 8 the crackle (two loops, left and right), 11 the flow past the body, 14 the scrape on rock, 15 the brush through weed, the heat's bubbling on the fissure
    AU.col=auChain(pink,'bandpass',550,0.7,true);AU.deep=auChain(brown,'lowpass',120,0.5,true);AU.cur=auChain(pink,'lowpass',450,0.5,true);
    AU.flow=auChain(pink,'lowpass',300,0.4,true);AU.scrape=auChain(white,'bandpass',900,2.5,true);AU.brush=auChain(white,'bandpass',2600,0.8,true);AU.heat=auChain(pink,'bandpass',1500,0.6,true);
    AU.wind=auChain(brown,'bandpass',320,0.3,true);AU.rainAir=auChain(auNoise(6,380),'bandpass',1500,0.5,true);AU.rainHush=auChain(pink,'lowpass',1400,0.4,true); // v11.18: the rain in air is a patter (380 drops a second rung through a wide 1.5 kHz band) over a soft hush; it was pink noise above 2.4 kHz — a hiss
    AU.crk=[auChain(crL,'bandpass',3600,0.9,false),auChain(crR,'bandpass',3600,0.9,false)];
    AU.crk.forEach((c,i)=>{if(actx.createStereoPanner){const p=actx.createStereoPanner();p.pan.value=i?0.7:-0.7;c.out.connect(p);p.connect(AU.dry);}else c.out.connect(AU.dry);});
    const pr=auGain(0),o1=actx.createOscillator(),o2=actx.createOscillator();o1.frequency.value=32;o2.frequency.value=34.3;o1.connect(pr);o2.connect(pr);pr.connect(AU.dry);o1.start();o2.start();AU.press=pr;
    // the placed beds: 3 the slosh (the surface over you; the rain's patter joins it), 4 the breakers, 6 the vent (a rumble and a boil, two chains at one point), 7 the forest
    AU.slosh=auChain(pink,'bandpass',650,0.5,false,1800,0.35,true);AU.sloshB=auChain(brown,'lowpass',160,0.5,false,800,0.2,true);AU.rain=auChain(pink,'bandpass',900,0.35,false,3500,0.2,true); // v11.18: the rain heard from under the surface is a broad rush (pink through a wide 900 Hz band); it was white noise above 3 kHz met by the water's 2.4 kHz lowpass — a narrow screech
    AU.surf=auChain(brown,'lowpass',500,0.5,false,1500,0.5);AU.surfW=auChain(pink,'bandpass',900,0.5,false,2500,0.5);
    AU.ventR=auChain(brown,'lowpass',90,0.6,false,400,0.9,false,320);AU.ventB=auChain(pink,'bandpass',1100,0.6,false,2200,0.9,false,320);
    AU.forest=auChain(pink,'bandpass',1300,0.6,false,2600,0.5,true);
    AU.ems.push(AU.slosh,AU.sloshB,AU.rain,AU.surf,AU.surfW,AU.ventR,AU.ventB,AU.forest);
    // 18 the passing bodies: the water the six nearest creatures displace (physics.js gathers them for the snow); a low hiss the size of the thing
    for(let i=0;i<6;i++){const e=auChain(pink,'lowpass',600,0.5,false,2000,0.7);e.c=null;AU.bodies.push(e);AU.ems.push(e);}
    AU.on=true;
  }catch(e){actx=null;AU.on=false;}
}
// ---------- the space ----------
// Is the point inside a solid? The hash physics.js keeps (spheres, capsules, ellipsoids, twelve-plane rocks; pads are rafts: nothing to sound)
function auSolid(x,y,z){
  const i=cellOf(x),j=cellOf(z);if(i<0||j<0||i>=NCELL||j>=NCELL)return false;const ch=chunkGrid[i*NCELL+j];if(!ch||!ch.solids.length)return false;
  const B=ch.hash[clamp(Math.floor((z-ch.z0)/HB),0,HN-1)*HN+clamp(Math.floor((x-ch.x0)/HB),0,HN-1)];if(!B)return false;
  for(let k=0;k<B.length;k++){const s=B[k];if(s.t===2)continue;
    const dx=x-s.x,dy=y-s.y,dz=z-s.z;
    if(s.t===4){if(dx*dx+dy*dy+dz*dz>=s.br*s.br)continue;const pl=s.pl;let inside=true;for(let q=0;q<48;q+=4){if(pl[q]*x+pl[q+1]*y+pl[q+2]*z-pl[q+3]>0.5){inside=false;break;}}if(inside)return true;continue;}
    if(s.t===3){if(dx*dx+dy*dy+dz*dz>=s.br*s.br)continue;const mi=s.mi,qx=mi[0]*dx+mi[3]*dy+mi[6]*dz,qy=mi[1]*dx+mi[4]*dy+mi[7]*dz,qz=mi[2]*dx+mi[5]*dy+mi[8]*dz;if(qx*qx+qy*qy+qz*qz<1.1)return true;continue;}
    if(s.t===1){const ex=s.x2-s.x,ey=s.y2-s.y,ez=s.z2-s.z,l2=ex*ex+ey*ey+ez*ez,tt=l2>1e-6?clamp((dx*ex+dy*ey+dz*ez)/l2,0,1):0,px=dx-ex*tt,py=dy-ey*tt,pz=dz-ez*tt,R=s.r+0.5;if(px*px+py*py+pz*pz<R*R)return true;continue;}
    const R=s.r+0.5;if(dx*dx+dy*dy+dz*dz<R*R)return true;}
  return false;}
// The probe (4 Hz): twelve rays from the listener, each marched to AU_REACH, stopping at the ground, the surface (from below: the underside is a
// mirror) or a solid. hit: the distance (AU_REACH is open); hitK: 0 open, 1 rock or ground, 2 the surface. Then the space's numbers: enc (the closed
// fraction, the surface at half weight), the mean hit distance (which reverb), the floor, the lid — and the three nearest walls become the taps.
function auProbe(lx,ly,lz,under){
  const H=AU.hit,K=AU.hitK;let hitN=0,sumD=0;
  for(let r=0;r<12;r++){const d=AU_DIRS[r];let hd=AU_REACH,hk=0;
    if(under&&d[1]>0){const sd=(TIDE-ly)/d[1];if(sd<hd){hd=Math.max(sd,0.2);hk=2;}} // the surface is analytic: exact, not at the step
    for(let s=AU_STEP;s<=hd;s+=AU_STEP){const x=lx+d[0]*s,y=ly+d[1]*s,z=lz+d[2]*s;
      if(y<groundAt(x,z)||auSolid(x,y,z)){hd=s;hk=1;break;}}
    H[r]=hd;K[r]=hk;if(hk){hitN+=hk===2?0.5:1;sumD+=hd;}}
  AU_LINE.enc=hitN/12;AU_LINE.size=hitN>0?sumD/Math.max(1,Math.round(hitN)):AU_REACH;AU_LINE.floor=H[1];AU_LINE.lid=K[0]===2?H[0]:AU_REACH;
  if(under&&underCanopy(lx,lz,ly)&&AU_LINE.lid>AU_REACH-1){AU_LINE.lid=Math.max(2,TIDE-ly);} // the mats over you are a lid too
}
// Occlusion (each voice, ~5 Hz): the line from the source to the listener in steps; every step under the ground or in a solid counts (solids within 6 m of
// the source don't: the vent sits in its own chimney). 1 − 0.85ⁿ: one boulder is a shadow, a ridge a rumble. Smoothed where it is applied.
function auOcc(e,lx,ly,lz){
  const dx=lx-e.x,dy=ly-e.y,dz=lz-e.z,d=Math.sqrt(dx*dx+dy*dy+dz*dz);if(d<3)return 0;
  const n=Math.min(40,Math.ceil(d/4)),st=d/n;let c=0;
  for(let i=1;i<n;i++){const s=i*st,x=e.x+dx/d*s,y=e.y+dy/d*s,z=e.z+dz/d*s;if(y<groundAt(x,z)||(s>6&&auSolid(x,y,z))){c++;if(c>=8)break;}}
  return 1-Math.pow(0.85,c);}
function auDist(e,lx,ly,lz){const dx=e.x-lx,dy=e.y-ly,dz=e.z-lz;return Math.sqrt(dx*dx+dy*dy+dz*dz);}
// ---------- the tick (20 Hz) ----------
function auTick(dt,P,play){
  const now=actx.currentTime,K=SKY,cam=camera;
  const lx=play?P.pos.x:cam.position.x,ly=play?P.pos.y:cam.position.y,lz=play?P.pos.z:cam.position.z; // the listener: at the body, facing as the camera (AUDIO.md Q1)
  const under=play?!P.camAbove:cam.position.y<waveH(cam.position.x,cam.position.z),k=medK; // k: 0 water, 1 air (atmosphere.js, the crossing's fade)
  const depth=Math.max(0,TIDE-ly),gh=groundAt(lx,lz),sub=play?P.sub:1;
  const L=actx.listener;T1.set(0,0,-1).applyQuaternion(cam.quaternion);T2.set(0,1,0).applyQuaternion(cam.quaternion);
  if(L.positionX){auP(L.positionX,lx,0.04);auP(L.positionY,ly,0.04);auP(L.positionZ,lz,0.04);auP(L.forwardX,T1.x,0.04);auP(L.forwardY,T1.y,0.04);auP(L.forwardZ,T1.z,0.04);auP(L.upX,T2.x,0.04);auP(L.upY,T2.y,0.04);auP(L.upZ,T2.z,0.04);}
  else{if(isFinite(lx+ly+lz))L.setPosition(lx,ly,lz);if(isFinite(T1.x+T2.x))L.setOrientation(T1.x,T1.y,T1.z,T2.x,T2.y,T2.z);}
  // the wave over the listener: its rate (m/s) is the slosh you hear — differenced tick to tick, the sound follows the chop you see
  const wh=waveH(lx,lz),wr=clamp(Math.abs(wh-AU.lastH)/Math.max(dt,0.01),0,1.6);AU.lastH=wh;AU.wr+=(wr-AU.wr)*0.35;AU_LINE.wr=AU.wr;
  const wm=0.35+0.9*Math.min(1,AU.wr/0.7);
  // the probe, and the space it found
  AU.pt+=dt;if(AU.pt>=AU_PT){AU.pt=0;auProbe(lx,ly,lz,under);
    const enc=AU_LINE.enc,size=AU_LINE.size,wet=(under?1:0.35)*enc*enc,kb=smooth(6,25,size);
    AU_LINE.wet=wet;auP(AU.wetA.gain,0.5*wet*(1-kb),0.3);auP(AU.wetB.gain,0.55*wet*kb,0.3);auP(AU.send.gain,1,0.3);
    // the taps: the three nearest walls (not the floor: that is the shelf), delayed by their round trip and panned to their side of the camera
    T3.set(1,0,0).applyQuaternion(cam.quaternion);const best=[-1,-1,-1];
    for(let r=0;r<12;r++){if(r===1||!AU.hitK[r])continue;const d=AU.hit[r];for(let b=0;b<3;b++){if(best[b]<0||d<AU.hit[best[b]]){for(let c=2;c>b;c--)best[c]=best[c-1];best[b]=r;break;}}}
    for(let b=0;b<3;b++){const tp=AU.taps[b],r=best[b];
      if(r<0){auP(tp.g.gain,0,0.2);continue;}
      const d=AU.hit[r],dir=AU_DIRS[r],g=(AU.hitK[r]===2?0.35:0.55)/(1+d/6)*(under?1:0.4);
      auP(tp.d.delayTime,clamp(2*d/SND_C,0.003,0.19),0.15);auP(tp.g.gain,g,0.2);if(tp.p)auP(tp.p.pan,clamp(dir[0]*T3.x+dir[1]*T3.y+dir[2]*T3.z,-1,1),0.15);}
  }
  // the medium: the water's lowpass by depth (open in air), the shelf for a hollow's boom, the flinch, the pressure below the chemocline
  const hurt=play?P.hurtT/0.7:0,press=smooth(380,470,depth);
  auP(AU.med.frequency,lerp(lerp(2400,600,smooth(0,260,depth))*AU_K.cut*(1-0.55*hurt),16000,k),0.1);
  auP(AU.shelf.gain,3*smooth(4,1,AU_LINE.floor)+5*hurt+2*press,0.15);
  // the self beds: the column, the deep, the pressure, the current, the crackle, the heat, the wind and the rain in air
  const ch=chunkAt(lx,lz),f=ch?ch.f(lx,lz):null,nut=f?f[FI.nut]:0,heat=f?f[FI.heat]:0,expo=f?f[FI.expo]:0,subK=f?f[FI.sub]:0.5;
  const uc=underCanopy(lx,lz,ly)?1:0;
  const B=AU_K.bed;
  auP(AU.col.out.gain,B*(0.05*smooth(150,10,depth)*(0.75+0.25*K.skyL)*(1-0.35*uc)+0.015)*(1-k),0.2);
  auP(AU.deep.out.gain,B*(0.06+0.11*smooth(30,220,depth))*(1-k),0.3);
  auP(AU.press.gain,B*0.05*press*(1-k),0.5);
  currentAt(lx,lz,ly,CURV);const cur=Math.hypot(CURV.x,CURV.z);AU_LINE.cur=cur;
  auP(AU.cur.out.gain,B*0.14*Math.pow(clamp(cur/1.3,0,1),1.4)*(1-k),0.25);auP(AU.cur.f.frequency,300+500*Math.min(1,cur),0.25);
  const crk=B*0.025*nut*smooth(140,8,depth)*(0.55+0.45*(1-K.skyL))*(1-k);auP(AU.crk[0].out.gain,crk,0.3);auP(AU.crk[1].out.gain,crk*0.9,0.3);
  auP(AU.heat.out.gain,B*0.05*heat*(1-k),0.3);
  const wind=Math.hypot(K.wind[0],K.wind[1])/WIND_U;auP(AU.wind.out.gain,B*0.1*wind*k,0.3);auP(AU.rainAir.out.gain,B*0.09*K.rainA*k,0.3);auP(AU.rainHush.out.gain,B*0.06*K.rainA*k,0.3);
  // the body: the flow past it (by speed, a swish on a turn), the finback's beat as a slow swell, the scrape on rock, the brush through weed
  if(play&&P.clade){const C=P.clade,vmax=C.speed*(C.sprint||1),yr=P.angV||0; // the body's own turn (player.js faceToward, v11.77)
    let s=clamp(P.spd/vmax,0,1.3)+clamp(yr*0.12,0,0.3);AU.ph+=dt*(1.1+P.spd*0.22);const beat=C.spec.clade==='slowbloods'?0.7+0.3*Math.sin(AU.ph*TAU):1;
    auP(AU.flow.out.gain,0.16*s*s*sub*beat,0.06);auP(AU.flow.f.frequency,180+1100*s,0.08);
    auP(AU.scrape.out.gain,P.hitRk&&P.spd>0.8?0.1*Math.min(1,P.spd/4)*(subK>0.5?1:0.6):0,0.05);auP(AU.scrape.f.frequency,subK>0.5?900:400,0.1);
    auP(AU.brush.out.gain,P.hitFl?0.09*Math.min(1,P.spd/3)+0.02:0,0.06);}
  else{auP(AU.flow.out.gain,0,0.1);auP(AU.scrape.out.gain,0,0.1);auP(AU.brush.out.gain,0,0.1);}
  // the placed beds. 3 the slosh: the surface point over the listener, the wave's rate, the lid (in the chop: louder and brighter), the rain's patter through it
  const lid=smooth(3.5,1,AU_LINE.lid),dk=1/(1+depth/6),sl=under?dk*wm*(1+1.2*lid)*(1-0.6*uc):0.5*wm; // in air the same source is the water lapping under you
  AU.slosh.x=AU.sloshB.x=AU.rain.x=lx;AU.slosh.z=AU.sloshB.z=AU.rain.z=lz;AU.slosh.y=AU.sloshB.y=AU.rain.y=wh;
  AU.slosh.a=B*0.22*sl;AU.slosh.c0=under?1800*(1+lid):5000;AU.sloshB.a=B*0.28*sl;AU.rain.a=B*K.rainA*(under?0.16*dk:0.08); // under: a bed the slosh's size (0.22), fading with depth; in air the surface's own hiss is small beside the patter
  // 4 the breakers: where the shore lies (uphill), at the surface, by the exposure and the shallowness, swelling on the first wave's period
  const gx=groundAt(lx+4,lz)-groundAt(lx-4,lz),gz=groundAt(lx,lz+4)-groundAt(lx,lz-4),gl=Math.hypot(gx,gz)||1,shal=smooth(28,5,TIDE-gh)*expo;
  const swell=0.45+0.55*Math.pow(0.5+0.5*Math.sin(t*WAVES[0].w*0.5+lx*0.01),2);
  AU.surf.x=AU.surfW.x=lx+gx/gl*22;AU.surf.z=AU.surfW.z=lz+gz/gl*22;AU.surf.y=AU.surfW.y=TIDE;AU.surf.a=B*0.32*shal*swell*(under?1:1.3);AU.surfW.a=B*0.16*shal*swell*(under?0.6:1.3);
  // 6 the vent: at the chimney's throat, from anywhere within reach; the boil wanders (a random walk at the tick)
  const vp=LM.chimney,vy=(LMK.chimney?LMK.chimney.y:vp.h)+52;AU.ventR.x=AU.ventB.x=vp.x;AU.ventR.z=AU.ventB.z=vp.z;AU.ventR.y=AU.ventB.y=vy; // at the mouth, where the plume and the light are (chunks.js placeLandmarks)
  AU.boil=clamp((AU.boil||0.7)+(Math.random()-0.5)*0.3,0.4,1);AU.ventR.a=B*0.9*(1-k);AU.ventB.a=B*0.4*AU.boil*(1-k);
  // 7 the forest: the flora's height in the cells' 4×4 buckets (chunks.js), summed with a reach of 30 m; placed at the weighted centre; loud in a stream, near silent in slack water
  let fw=0,fx=0,fz=0;const ci=cellOf(lx),cj=cellOf(lz);
  for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){const i=ci+di,j=cj+dj;if(i<0||j<0||i>=NCELL||j>=NCELL)continue;const c=chunkGrid[i*NCELL+j];if(!c||!c.ac)continue;
    for(let b=0;b<16;b++){const w=c.ac[b];if(w<=0)continue;const bx=c.x0+((b&3)+0.5)*CELL/4,bz=c.z0+((b>>2)+0.5)*CELL/4,dh=bx-lx,dv=bz-lz;if(dh*dh+dv*dv>14400)continue;const d=Math.sqrt(dh*dh+dv*dv+Math.pow(c.h(bx,bz)+4-ly,2)),q=w/(1+d/30);fw+=q;fx+=bx*q;fz+=bz*q;}} // the plants stand on their ground: the rim's weed 100 m over the pit's floor is 100 m off
  const fd=clamp(Math.sqrt(fw/6000),0,1);AU_LINE.forest=fd; // fw is metres of plant within reach: the shelf's stipe forest sums to ~6000, the peak's lawn to ~300
  if(fw>0){AU.forest.x=fx/fw;AU.forest.z=fz/fw;AU.forest.y=groundAt(AU.forest.x,AU.forest.z)+6;}else{AU.forest.x=lx;AU.forest.z=lz;AU.forest.y=ly;}
  AU.forest.a=B*0.1*fd*(0.2+0.8*Math.min(1,cur/0.6+AU.wr*0.6))*(1-k);
  // 18 the passing bodies: the six nearest (physics.js N6) keep their emitter while they stay near; strength by size and speed
  const N6=updateDisturbers.N6||[];for(const e of AU.bodies){if(e.c&&(N6.indexOf(e.c)<0||!e.c.alive)){e.c=null;}}
  for(const c of N6){if(c===player)continue;let e=null;for(const b of AU.bodies)if(b.c===c){e=b;break;}if(!e){for(const b of AU.bodies)if(!b.c){e=b;break;}if(!e)break;e.c=c;e.x=c.pos.x;e.y=c.pos.y;e.z=c.pos.z;}
    const sz=c.def.size,sp=c.vel.length();e.x=c.pos.x;e.y=c.pos.y;e.z=c.pos.z;e.a=B*0.45*Math.pow(clamp(sz/8,0.05,1.2),1.5)*clamp(sp/5,0,1.3)*(1-k);e.c0=200+1200/(1+sz/4);}
  for(const e of AU.bodies)if(!e.c)e.a=0;
  // the pool: the audible emitters by their loudness at the ear; the top AU_VN keep or take a voice, the rest give theirs back
  const ems=AU.ems;let nw=0;
  for(const e of ems){const d=e.d=auDist(e,lx,ly,lz);e.g=e.a*(e.flat?1:1/(1+d/18))*(e.reach?smooth(e.reach,e.reach*0.6,d):1);e.pri=e.g>0.006?e.g:0;} // g: the strength at the ear before occlusion
  ems.sort((a,b)=>b.pri-a.pri);
  for(const v of AU.voices){if(v.em&&(v.em.pri<=0||ems.indexOf(v.em)>=AU_VN)){v.em.out.disconnect();v.em.voice=null;v.em=null;auP(v.g.gain,0,0.05);}}
  for(let i=0;i<ems.length&&i<AU_VN;i++){const e=ems[i];if(e.pri<=0)break;
    if(!e.voice){let v=null;for(const w of AU.voices)if(!w.em){v=w;break;}if(!v)break;v.em=e;e.voice=v;e.out.connect(v.g);v.g.gain.setValueAtTime(0,now);if(v.pan.positionX){v.pan.positionX.setValueAtTime(e.x,now);v.pan.positionY.setValueAtTime(e.y,now);v.pan.positionZ.setValueAtTime(e.z,now);}else v.pan.setPosition(e.x,e.y,e.z);}
    nw++;}
  // one or two occlusion marches a tick (every voice about five times a second), then every held voice's distance, absorption, occlusion and position
  for(let m=0;m<2;m++){AU.occI=(AU.occI+1)%AU_VN;const v=AU.voices[AU.occI];if(v.em)v.em.occ=auOcc(v.em,lx,ly,lz);}
  let occSum=0,occN=0;
  for(const v of AU.voices){const e=v.em;if(!e)continue;const d=e.d,occ=e.occ;occSum+=occ;occN++;
    auP(v.g.gain,e.g*(1-0.8*occ),0.08);auP(v.lp.frequency,clamp(e.c0/(1+(d/60)*(d/60))/(1+7*occ),80,16000),0.12);auP(v.sg.gain,e.send*(1+0.5*occ),0.2);
    auP(e.out.gain,1,0.05);auPos(v.pan,e.x,e.y,e.z,0.06);}
  AU_LINE.voices=nw;AU_LINE.occ=occN?occSum/occN:0;
}
// The frame: the events (a squeeze, a landing, a knock on rock, a brush into weed), then the tick when it is due
function updateAudio(dt){
  if(!AU.on||AU.bench)return; // AU.bench: the sound bench (bench.js) has the graph — the tick would fight it for every gain
  const P=player,play=mode==='play'&&!P.dead; // ticks while muted too, so unmuting has nothing to catch up
  if(actx.state==='suspended'&&actx.resume)actx.resume();
  if(play&&P.clade){
    if(P.jetT>AU.jetT+0.2&&P.sub>0.3)thump(0.12*P.sub,320,120,null,0.7);AU.jetT=P.jetT; // the jet's squeeze: a burst of water (jetT wraps to 0.5)
    if(P.landV>0.8){const ch=chunkAt(P.pos.x,P.pos.z),rock=ch&&ch.f(P.pos.x,P.pos.z)[FI.sub]>0.5,v=clamp(P.landV/8,0.1,0.7);if(rock)thump(v*0.7,180,70,null,1.2,0.05);else thump(v*0.5,55,32,null,0.5,0.14);} // bottoming out: a click on rock, a thud on sediment
    P.landV=0;
    if(P.hitRk&&!AU.rk&&P.spd>1.2)thump(clamp(P.spd/12,0.08,0.4),150,60,null,1.4,0.04); // the knock
    if(P.hitFl&&!AU.fl&&P.spd>1)thump(0.07,0,0,null,2.8,0.12); // into the weed
    AU.rk=P.hitRk;AU.fl=P.hitFl;
  }
  AU.t+=dt;if(AU.t>=AU_DT){auTick(AU.t,P,play);AU.t=0;}
}
// A one-shot: a sine chirp f0 → f1 over 0.3 s (f0 0: none) under a noise transient (a burst through a bandpass at nf kHz, nd s), through the space:
// placed at pos if given (delayed by its distance at the speed of sound, absorbed, panned) or at the ear. The bites, hits, flops and splashes
// (player.js) come here as before; the squeeze, the knock, the thud and the brush are new.
function thump(vol,f0,f1,pos,nf,nd){
  if(!actx||muted||!AU.on)return;const now=actx.currentTime;let at=now,dest=AU.dry,dg=1,cut=8000;
  if(pos){const lx=player.pos.x,ly=player.pos.y,lz=player.pos.z,d=Math.hypot(pos.x-lx,pos.y-ly,pos.z-lz);at=now+d/SND_C;dg=1/(1+d/18);cut=8000/(1+(d/60)*(d/60));
    const pan=actx.createPanner();pan.panningModel='equalpower';pan.distanceModel='linear';pan.refDistance=1;pan.maxDistance=1e5;pan.rolloffFactor=0;if(pan.positionX){pan.positionX.value=pos.x;pan.positionY.value=pos.y;pan.positionZ.value=pos.z;}else pan.setPosition(pos.x,pos.y,pos.z);
    const lp=auFilt('lowpass',cut,0.3),sg=auGain(0.5);lp.connect(pan);pan.connect(AU.dry);pan.connect(sg);sg.connect(AU.send);dest=lp;}
  else{const sg=auGain(0.3);sg.connect(AU.send);const g=auGain(1);g.connect(AU.dry);g.connect(sg);dest=g;}
  if(!isFinite(vol*dg)||!isFinite(at))return;
  if(f0>0){const o=actx.createOscillator(),g=actx.createGain();o.type='sine';o.frequency.setValueAtTime(f0,at);o.frequency.exponentialRampToValueAtTime(Math.max(1,f1),at+0.3);g.gain.setValueAtTime(vol*dg,at);g.gain.exponentialRampToValueAtTime(0.001,at+0.4);o.connect(g);g.connect(dest);o.start(at);o.stop(at+0.45);}
  if(nf){const s=actx.createBufferSource(),b=auFilt('bandpass',nf*1000,1.2),g=actx.createGain(),len=nd||0.08;s.buffer=AU.whiteBuf;s.connect(b);b.connect(g);g.connect(dest);
    g.gain.setValueAtTime(0.0001,at);g.gain.exponentialRampToValueAtTime(vol*dg*0.9,at+0.008);g.gain.exponentialRampToValueAtTime(0.0005,at+len);s.start(at,Math.random()*1.5);s.stop(at+len+0.02);}
}
function toggleMute(){muted=!muted;if(master)master.gain.value=muted?0:AU_K.vol*(Q.vol||1);}
// The tuner (main.js, while the readout is open): g-h the master, j-k the beds, v-b the water's lowpass; backspace resets with the fog's. Paste the line back and the numbers get baked in here.
const AU_DEF={vol:0.5,bed:1,cut:1};
const AU_TUNE=[{k:'vol',lo:'KeyG',hi:'KeyH',step:0.05,min:0,max:1.5,d:2},{k:'bed',lo:'KeyJ',hi:'KeyK',step:0.1,min:0,max:3,d:1},{k:'cut',lo:'KeyV',hi:'KeyB',step:0.1,min:0.2,max:4,d:1}];
function audioTune(code){if(code==='Backspace'){Object.assign(AU_K,AU_DEF);}else{const e=AU_TUNE.find(e=>e.lo===code||e.hi===code);if(!e)return false;AU_K[e.k]=clamp(AU_K[e.k]+(code===e.hi?e.step:-e.step),e.min,e.max);}if(master&&!muted)master.gain.value=AU_K.vol*(Q.vol||1);return true;}
function audioLine(){if(!AU.on)return 'audio off';const A=AU_LINE;return 'audio  vol '+AU_K.vol.toFixed(2)+' bed '+AU_K.bed.toFixed(1)+' cut '+AU_K.cut.toFixed(1)+' (g-h j-k v-b)  voices '+A.voices+'  enc '+A.enc.toFixed(2)+'  size '+A.size.toFixed(0)+'  floor '+A.floor.toFixed(0)+'  lid '+(A.lid<AU_REACH?A.lid.toFixed(0):'-')+'  wet '+A.wet.toFixed(2)+'  occ '+A.occ.toFixed(2)+'  wave '+A.wr.toFixed(2)+'  cur '+A.cur.toFixed(2)+'  forest '+A.forest.toFixed(2)+(muted?'  muted':'');}
