// Headless check of the steering (v11.77): the mouse sets a heading, the body's own facing turns toward it at derive's rate, and the orientation is
// composed from the facing — never a lookAt against up. Scripted input through the real frame loop for every playable clade (the three roster
// players, and a hingeshell founder — the hose, and the sickle, the slowest-turning body you can found): straight up, straight down, a loop, a
// knockback, the old strafe keys, a breach (the surface crossed both ways) and first person. Fails on a flip (the body's forward more than a set
// angle from the heading once it has had time to come round), a spike in angular speed (any frame faster than the body's turn rate — the arc's
// allowance in the air), a strafe (a velocity across the body while swimming), a body ever upside down, or a NaN anywhere. `node test/steer.js`; TIER=low.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const ORDER=fs.readFileSync(path.join(ROOT,'src','order.txt'),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&s[0]!=='#');
let js=ORDER.map(n=>fs.readFileSync(path.join(ROOT,'src',n+'.js'),'utf8')).join('\n');
js+='\nglobal.__st={player,choose,keys,founderClade,hurtPlayer,waveH,groundAt,cellsAround,STEER,PITCH_MAX,TURN_MIN,camera,creatures,removeCreature,setTouch:(o)=>{tstate.L=o?{id:0,x0:100,y0:400,x:100+70*o.mx,y:400-70*o.mz,t0:0,moved:1}:null;},toggleFP,get t(){return t;},setT:(v)=>{t=v;},get mode(){return mode;},setMode:(m)=>{mode=m;}};';
const tmp=path.join(require('os').tmpdir(),'tethys_steer.js');
fs.writeFileSync(tmp,'(function(){"use strict";\n'+js+'\n})();');
process.env.PICK='0';
require('./stub.js');require(tmp);
const X=global.__st,P=X.player,K=X.keys;let fails=0;
function check(ok,msg){if(!ok){fails++;console.error('  FAIL '+msg);}else console.log('  ok   '+msg);}
const DT=1/60,DEG=180/Math.PI;
const V=Object.getPrototypeOf(P.pos).constructor,fwdQ=(q)=>new V(0,0,1).applyQuaternion(q); // the body's forward off its quaternion (the stub's applyQuaternion is real)
const upQ=(q)=>new V(0,1,0).applyQuaternion(q);
const headV=()=>{const cp=Math.cos(P.pitch);return {x:-Math.sin(P.yaw)*cp,y:Math.sin(P.pitch),z:-Math.cos(P.yaw)*cp};};
const ang=(a,b)=>Math.acos(Math.max(-1,Math.min(1,a.x*b.x+a.y*b.y+a.z*b.z)))*DEG;
const fin=(v)=>isFinite(v.x)&&isFinite(v.y)&&isFinite(v.z);
function clearKeys(){for(const k in K)K[k]=false;}
function place(x,y,z){P.pos.set(x,y,z);P.vel.set(0,0,0);P.hold=null;X.cellsAround();}
// a phase: n frames with the keys down and a heading function per frame; returns the worst frame's turn (deg/s), the angle to the heading at the end,
// the strafe (the share of the velocity across the body on the last frame, swimming faster than 1 m/s), the least body-up y, and NaNs
function phase(name,n,ks,head,cap,capAir){ // cap, capAir: the turn allowed a frame (deg/s) in the water and in the air
  clearKeys();Object.assign(K,ks||{});let over=0;for(const c of X.creatures.slice())X.removeCreature(c); // the world's bodies out of the way: a shove is not the steering
  let last=fwdQ(P.g.quaternion),maxTurn=0,maxAngV=0,strafe=0,minUp=1,nan=0,airFrames=0,arcOff=0,subMin=1,subMax=0,y0=P.pos.y,yMin=P.pos.y,yMax=P.pos.y;
  for(let i=0;i<n;i++){
    if(head)head(i);
    global.__step(1);
    const f=fwdQ(P.g.quaternion),u=upQ(P.g.quaternion),turn=ang(f,last)/DT;last=f;
    if(!fin(P.pos)||!fin(P.vel)||!isFinite(P.g.quaternion.x+P.g.quaternion.y+P.g.quaternion.z+P.g.quaternion.w)||!fin(X.camera.position))nan++;
    if(i>0){maxTurn=Math.max(maxTurn,turn);if(turn>(P.sub<0.5&&!P.grounded?capAir:cap))over++;}maxAngV=Math.max(maxAngV,(P.angV||0)*DEG);minUp=Math.min(minUp,u.y);
    const v=P.vel.length();if(i===n-1&&v>1&&P.sub>=0.5&&!P.grounded){const along=P.vel.dot(f)/v;strafe=Math.sqrt(Math.max(0,1-along*along));} // the steady state: the share of the velocity across the body on the phase's last frame
    if(P.sub<0.5&&!P.grounded){airFrames++;if(v>2.5&&airFrames>10){const vv={x:P.vel.x/v,y:P.vel.y/v,z:P.vel.z/v};arcOff=Math.max(arcOff,ang(f,vv));}}
    subMin=Math.min(subMin,P.sub);subMax=Math.max(subMax,P.sub);yMin=Math.min(yMin,P.pos.y);yMax=Math.max(yMax,P.pos.y);
  }
  const f=fwdQ(P.g.quaternion),h=headV(),off=ang(f,h);
  const bf={x:-Math.sin(P.byaw)*Math.cos(P.bpitch),y:Math.sin(P.bpitch),z:-Math.cos(P.byaw)*Math.cos(P.bpitch)},compose=ang(f,bf);
  return {name,off,maxTurn,over,maxAngV,strafe,minUp,nan,airFrames,arcOff,subMin,subMax,rise:P.pos.y-y0,yMin,yMax,compose,spd:P.vel.length()};
}
function run(C,label){
  X.setMode('menu');X.choose(C);P.dead=false;clearKeys();X.setT(120);
  place(700,-90,-700); // deep water over the flank (the smoke's clade 5 boots here: ground −151): eight seconds straight up stays under
  P.yaw=0.4;P.pitch=0;P.byaw=P.yaw;P.bpitch=0;global.__step(30);
  const rate=P.clade.turn*DEG,cap=rate*1.05,capAir=rate*X.STEER.air*1.05; // the turn's cap (deg/s): derive's, and the arc's allowance in the air
  console.log(label+': turn '+P.clade.turn+' rad/s ('+rate.toFixed(0)+'°/s at its top speed, '+(rate*X.TURN_MIN).toFixed(0)+' at rest), speed '+P.clade.speed+', mode '+P.clade.mode+', buoyancy '+P.clade.buoy);
  const R=[];
  R.push(phase('settle',120,{KeyW:true},null,cap,capAir));
  P.pitch=X.PITCH_MAX;R.push(phase('straight up',480,{KeyW:true},null,cap,capAir));
  P.pitch=-X.PITCH_MAX;R.push(phase('straight down',480,{KeyW:true},null,cap,capAir));
  P.pitch=0;R.push(phase('level',180,{KeyW:true},null,cap,capAir));
  const y1=P.yaw;R.push(phase('a loop',360,{KeyW:true},i=>{P.yaw=y1+Math.PI*2*(i+1)/360;},cap,capAir)); // the heading swept once round in six seconds
  R.push(phase('after the loop',300,{KeyW:true},null,cap,capAir));
  let knock=null;R.push(phase('a knockback',150,{KeyW:true},i=>{if(i===10){const from=P.pos.clone();from.x+=2;X.hurtPlayer(10,from);knock=fwdQ(P.g.quaternion);}},cap,capAir));
  const yA=P.yaw;R.push(phase('a and d',120,{KeyW:true,KeyA:true},null,cap,capAir));const turnedA=P.yaw-yA;
  const yD=P.yaw;R.push(phase('d',120,{KeyW:true,KeyD:true},null,cap,capAir));const turnedD=P.yaw-yD;
  const pS=P.pitch;R.push(phase('space and c',90,{KeyW:true,Space:true},null,cap,capAir));const pitchedS=P.pitch-pS;
  const pC=P.pitch;R.push(phase('c',180,{KeyW:true,KeyC:true},null,cap,capAir));const pitchedC=P.pitch-pC;
  P.pitch=0;R.push(phase('s',300,{KeyS:true},null,cap,capAir));
  // touch: the left stick sideways turns, up swims
  const yT=P.yaw;R.push(phase('touch',120,null,i=>{X.setTouch(i<119?{mx:1,mz:1,sprint:false}:null);},cap,capAir));X.setTouch(null);const turnedT=P.yaw-yT;
  // the breach: from just under the surface, up at a steep pitch at a sprint — the body follows its arc in the air, and comes back to the heading
  const wl=X.waveH(700,-700);place(700,wl-8,-700);P.yaw=P.byaw=1.2;P.pitch=P.bpitch=0.6;global.__step(20);
  const B=phase('the breach',360,{KeyW:true,ShiftLeft:true},null,cap,capAir);R.push(B);
  P.pitch=-0.4;R.push(phase('back under',300,{KeyW:true},null,cap,capAir)); // the heading down, or it porpoises on
  // first person: the camera at the nose, the body still steering itself
  place(700,-90,-700);X.toggleFP();R.push(phase('first person',120,{KeyW:true},i=>{P.yaw+=0.01;},cap,capAir));X.toggleFP();
  console.log('  phase           off°  turn°/s  angV°/s strafe  up.y  air arcOff°  sub       rise   spd');
  for(const r of R)console.log('  '+r.name.padEnd(15)+r.off.toFixed(1).padStart(5)+'  '+r.maxTurn.toFixed(0).padStart(6)+'  '+r.maxAngV.toFixed(0).padStart(6)+'  '+r.strafe.toFixed(2).padStart(5)+' '+r.minUp.toFixed(2).padStart(5)+'  '+String(r.airFrames).padStart(3)+' '+r.arcOff.toFixed(0).padStart(6)+'  '+r.subMin.toFixed(2)+'-'+r.subMax.toFixed(2)+' '+r.rise.toFixed(1).padStart(6)+' '+r.spd.toFixed(1).padStart(5));
  const nan=R.reduce((s,r)=>s+r.nan,0);check(nan===0,label+': no NaN in the body, its velocity, its orientation or the camera'+(nan?' ('+nan+' frames)':''));
  check(R.every(r=>r.compose<0.5),label+': the quaternion composes the facing (forward off the quaternion within 0.5° of byaw/bpitch)');
  const held=R.filter(r=>['settle','straight up','straight down','level','after the loop','s','back under'].indexOf(r.name)>=0);
  check(held.every(r=>r.off<3),label+': the body comes round to a held heading within 3° ('+held.map(r=>r.name+' '+r.off.toFixed(1)).join(', ')+')');
  check(R[1].rise>5&&R[2].rise<-5,label+': straight up rose '+R[1].rise.toFixed(1)+' m and straight down fell '+(-R[2].rise).toFixed(1)+' m — pitching the head, no elevator key');
  const water=R.filter(r=>r.name!=='the breach'&&r.name!=='back under');
  check(R.every(r=>r.over===0),label+': no spike — every frame turns within the body\'s rate, the arc\'s allowance in the air (the worst under water '+Math.max(...water.map(r=>r.maxTurn)).toFixed(0)+' of '+cap.toFixed(0)+'°/s)');
  check(B.over===0&&R[R.length-2].over===0,label+': through the surface within the arc\'s allowance ('+Math.max(B.maxTurn,R[R.length-2].maxTurn).toFixed(0)+' of '+capAir.toFixed(0)+'°/s)');
  check(B.subMin<0.5&&B.airFrames>3,label+': the breach left the water ('+B.airFrames+' frames in the air, sub down to '+B.subMin.toFixed(2)+')');
  check(B.arcOff<25,label+': in the air the body followed its arc (forward within '+B.arcOff.toFixed(0)+'° of the velocity)');
  check(R.every(r=>r.minUp>-0.01),label+': never upside down (body up.y ≥ '+Math.min(...R.map(r=>r.minUp)).toFixed(2)+')');
  check(held.every(r=>r.strafe<0.2),label+': no strafe — a held heading swum, the velocity is along the body (across share '+held.map(r=>r.strafe.toFixed(2)).join(' ')+')');
  const kb=R.find(r=>r.name==='a knockback');check(kb.off<6&&kb.maxTurn<=cap,label+': a knockback does not turn the body to the knock (off '+kb.off.toFixed(1)+'° after it)');
  check(turnedA>0.3&&turnedD<-0.3,label+': a and d turn the heading ('+(turnedA*DEG).toFixed(0)+'° and '+(turnedD*DEG).toFixed(0)+'° in two seconds), not the body sideways');
  check(pitchedS>0.2&&pitchedC<-0.2,label+': space and c pitch it ('+(pitchedS*DEG).toFixed(0)+'° up, '+(pitchedC*DEG).toFixed(0)+'° down)');
  const sP=R.find(r=>r.name==='s');check(P.clade.jet?sP.spd>0.5:sP.spd<0.5,label+': s '+(P.clade.jet?'backs a jetter ('+sP.spd.toFixed(1)+' m/s)':'brakes a body that cannot back ('+sP.spd.toFixed(2)+' m/s)'));
  const tc=R.find(r=>r.name==='touch');check(turnedT<-0.3&&tc.spd>1,label+': the touch stick steers ('+(turnedT*DEG).toFixed(0)+'°) and swims ('+tc.spd.toFixed(1)+' m/s) on the same model');
  return R;
}
const soft=X.founderClade('soft'),finC=X.founderClade('fin'),coil=X.founderClade('coil'),hose=X.founderClade('hose'),sickle=X.founderClade('sickle');
run(finC,'finback');run(soft,'soft-arm');run(coil,'coilshell');run(hose,'hose (hingeshell)');run(sickle,'sickle (the slowest hingeshell)');
console.log(fails?'\nsteer: '+fails+' FAILED':'\nsteer: all ok');
process.exit(fails?1:0);
