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
js+='\nglobal.__st={player,choose,keys,founderClade,hurtPlayer,waveH,groundAt,cellsAround,STEER,PITCH_MAX,TURN_MIN,camera,creatures,removeCreature,WALK,solidPush,V3,HEAD_MAX,setTouch:(o)=>{tstate.L=o?{id:0,x0:100,y0:400,x:100+70*o.mx,y:400-70*o.mz,t0:0,moved:1}:null;},toggleFP,get t(){return t;},setT:(v)=>{t=v;},get mode(){return mode;},setMode:(m)=>{mode=m;}};';
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
  let side=0,rise=0,last=fwdQ(P.g.quaternion),maxTurn=0,maxAngV=0,strafe=0,minUp=1,nan=0,airFrames=0,arcOff=0,subMin=1,subMax=0,y0=P.pos.y,yMin=P.pos.y,yMax=P.pos.y;
  for(let i=0;i<n;i++){
    if(head)head(i);
    global.__step(1);
    const f=fwdQ(P.g.quaternion),u=upQ(P.g.quaternion),turn=ang(f,last)/DT;last=f;
    if(!fin(P.pos)||!fin(P.vel)||!isFinite(P.g.quaternion.x+P.g.quaternion.y+P.g.quaternion.z+P.g.quaternion.w)||!fin(X.camera.position))nan++;
    if(i>0){maxTurn=Math.max(maxTurn,turn);if(turn>(P.sub<0.5&&!P.grounded?capAir:cap))over++;}maxAngV=Math.max(maxAngV,(P.angV||0)*DEG);minUp=Math.min(minUp,u.y);
    const v=P.vel.length();if(i===n-1&&v>1&&P.sub>=0.5&&!P.grounded){const along=P.vel.dot(f)/v;strafe=Math.sqrt(Math.max(0,1-along*along));} // the steady state: the share of the velocity across the body on the phase's last frame
    if(i===n-1){const rt={x:-Math.cos(P.byaw),y:0,z:Math.sin(P.byaw)};side=v>0.5?Math.abs(P.vel.dot(rt))/v:0;rise=v>0.5?P.vel.y/v:0;} // the velocity's share across the body and up, on the last frame
    if(P.sub<0.5&&!P.grounded){airFrames++;if(v>2.5&&airFrames>10){const vv={x:P.vel.x/v,y:P.vel.y/v,z:P.vel.z/v};arcOff=Math.max(arcOff,ang(f,vv));}}
    subMin=Math.min(subMin,P.sub);subMax=Math.max(subMax,P.sub);yMin=Math.min(yMin,P.pos.y);yMax=Math.max(yMax,P.pos.y);
  }
  const f=fwdQ(P.g.quaternion),h=headV(),off=ang(f,h);
  const bf={x:-Math.sin(P.byaw)*Math.cos(P.bpitch),y:Math.sin(P.bpitch),z:-Math.cos(P.byaw)*Math.cos(P.bpitch)},compose=ang(f,bf);
  return {name,off,maxTurn,over,maxAngV,strafe,side,vup:rise,minUp,nan,airFrames,arcOff,subMin,subMax,rise:P.pos.y-y0,yMin,yMax,compose,spd:P.vel.length()};
}
function run(C,label){
  X.setMode('menu');X.choose(C);P.dead=false;clearKeys();X.setT(120);
  place(700,-90,-700); // deep water over the flank (the smoke's clade 5 boots here: ground −151): eight seconds straight up stays under
  P.yaw=0.4;P.pitch=0;P.byaw=P.yaw;P.bpitch=0;global.__step(30);
  const rate=P.clade.turn*DEG,cap=rate*1.05,capAir=rate*X.STEER.air*1.05; // the turn's cap (deg/s): derive's, and the arc's allowance in the air
  console.log(label+': turn '+P.clade.turn+' rad/s ('+rate.toFixed(0)+'°/s at its top speed, '+(rate*X.TURN_MIN).toFixed(0)+' at rest), speed '+P.clade.speed+', mode '+P.clade.mode+', buoyancy '+P.clade.buoy);
  const R=[];
  R.push(phase('settle',120,{KeyW:true},null,cap,capAir));
  R.push(phase('straight up',480,{KeyW:true},i=>{P.pitch=X.PITCH_MAX;},cap,capAir)); // the heading held there every frame, as a mouse would: HEAD_MAX lets it lead the body by 80° at most (v11.77.1)
  R.push(phase('straight down',480,{KeyW:true},i=>{P.pitch=-X.PITCH_MAX;},cap,capAir));
  R.push(phase('level',180,{KeyW:true},i=>{P.pitch=0;},cap,capAir));
  const y1=P.yaw;R.push(phase('a loop',360,{KeyW:true},i=>{P.yaw=y1+Math.PI*2*(i+1)/360;},cap,capAir)); // the heading swept once round in six seconds
  R.push(phase('after the loop',300,{KeyW:true},null,cap,capAir));
  let knock=null;R.push(phase('a knockback',150,{KeyW:true},i=>{if(i===10){const from=P.pos.clone();from.x+=2;X.hurtPlayer(10,from);knock=fwdQ(P.g.quaternion);}},cap,capAir));
  const yA=P.yaw;R.push(phase('a and d',120,{KeyW:true,KeyA:true},null,cap,capAir));const turnedA=P.yaw-yA;const sideA=R[R.length-1].side;
  const yD=P.yaw;R.push(phase('d',120,{KeyW:true,KeyD:true},null,cap,capAir));const turnedD=P.yaw-yD,sideD=R[R.length-1].side,offD=R[R.length-1].off;
  const pS=P.pitch;R.push(phase('space and c',90,{KeyW:true,Space:true},null,cap,capAir));const pitchedS=P.pitch-pS,upS=R[R.length-1].vup,bpS=P.bpitch;
  const pC=P.pitch;R.push(phase('c',180,{KeyW:true,KeyC:true},null,cap,capAir));const pitchedC=P.pitch-pC,upC=R[R.length-1].vup,bpC=P.bpitch;
  R.push(phase('s',300,{KeyS:true},i=>{P.pitch=0;},cap,capAir));
  // touch: the left stick sideways turns, up swims
  const yT=P.yaw;R.push(phase('touch',120,null,i=>{X.setTouch(i<119?{mx:1,mz:1,sprint:false}:null);},cap,capAir));X.setTouch(null);const turnedT=P.yaw-yT;
  // the breach: from just under the surface, up at a steep pitch at a sprint — the body follows its arc in the air, and comes back to the heading
  const wl=X.waveH(700,-700);place(700,wl-8,-700);P.yaw=P.byaw=1.2;P.pitch=P.bpitch=0.6;global.__step(20);
  const B=phase('the breach',360,{KeyW:true,ShiftLeft:true},null,cap,capAir);R.push(B);
  R.push(phase('back under',300,{KeyW:true},i=>{P.pitch=-0.4;},cap,capAir)); // the heading down, or it porpoises on
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
  check(Math.abs(turnedA)<0.01&&Math.abs(turnedD)<0.01&&sideA>0.4&&sideD>0.4&&offD<3,label+': a and d sidestep — the velocity runs '+(sideD*100).toFixed(0)+'% across the body, which keeps its facing ('+offD.toFixed(1)+'° off the heading, the heading untouched)');
  check(Math.abs(pitchedS)<0.01&&Math.abs(pitchedC)<0.01&&upS>0.3&&upC<-0.3&&Math.abs(bpS)<0.1&&Math.abs(bpC)<0.1,label+': space rises and c dives ('+(upS*100).toFixed(0)+'% and '+(upC*100).toFixed(0)+'% of the velocity vertical) with the body level ('+(bpC*DEG).toFixed(0)+'°), the heading untouched');
  const sP=R.find(r=>r.name==='s');check(P.clade.jet?sP.spd>0.5:sP.spd<0.5,label+': s '+(P.clade.jet?'backs a jetter ('+sP.spd.toFixed(1)+' m/s)':'brakes a body that cannot back ('+sP.spd.toFixed(2)+' m/s)'));
  const tc=R.find(r=>r.name==='touch');check(Math.abs(turnedT)<0.01&&tc.spd>1&&tc.side>0.4,label+': the touch stick swims and sidesteps ('+tc.spd.toFixed(1)+' m/s, '+(tc.side*100).toFixed(0)+'% across) on the same model');
  P.yaw+=Math.PI;global.__step(1);const ahead=Math.abs(((P.yaw-P.byaw+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI);check(ahead<=X.HEAD_MAX+0.01,label+': a flick of the mouse round the back stops '+(ahead*DEG).toFixed(0)+'° off the body (HEAD_MAX '+(X.HEAD_MAX*DEG).toFixed(0)+'°): the camera never looks it in the face');global.__step(120);
  return R;
}
const soft=X.founderClade('soft'),finC=X.founderClade('fin'),coil=X.founderClade('coil'),hose=X.founderClade('hose'),sickle=X.founderClade('sickle');
run(finC,'finback');run(soft,'soft-arm');run(coil,'coilshell');run(hose,'hose (hingeshell)');run(sickle,'sickle (the slowest hingeshell)');
// ---- walking on the floor (v11.78): a legged founder walks a slope nose-up at derive's walk speed, turns on the spot, steps back where its legs are
// jointed, keeps its feet down a step and falls off a ledge, hops, cannot swim when its legs are all it has (and sinks back), walks the strand; a
// flapper with legs (the ram) walks on the floor and swims off it ----
// the west shelf's slope (ground −14..−5, gradient 0.2–0.5, rising 5 m over 24 m uphill) and the beach above it (ground +0.6..2, the sea behind, rising ahead), each with a path clear of rock (the picker walked into a boulder and stood there: contact, not the walk)
const gh=(x,z)=>X.groundAt(x,z),gradAt=(x,z)=>({x:(gh(x+1,z)-gh(x-1,z))/2,z:(gh(x,z+1)-gh(x,z-1))/2});
function clearPath(x,z,ux,uz,len){for(let s=-2;s<=len;s+=2){const px=x+ux*s,pz=z+uz*s,p=X.V3(px,gh(px,pz)+1.0,pz);if(X.solidPush(p,1.2,null,null,true))return false;}return true;}
function findSpot(kind){for(let x=-330;x<=-260;x+=4)for(let z=0;z<=100;z+=4){const h=gh(x,z);const g=gradAt(x,z),gl=Math.hypot(g.x,g.z)||1e-9,ux=g.x/gl,uz=g.z/gl;
    if(kind==='slope'){if(!(h>-14&&h<-5&&gl>0.2&&gl<0.5))continue;if(!(gh(x+12*ux,z+12*uz)-h>2.6&&gh(x+24*ux,z+24*uz)-h>5))continue;P.pos.set(x,h+2,z);X.cellsAround();if(clearPath(x,z,ux,uz,26))return [x,z];}
    else{if(!(h>0.6&&h<2&&gl>0.08&&gl<0.3))continue;if(!(gh(x+8*ux,z+8*uz)-h>0.6&&gh(x+16*ux,z+16*uz)-h>1.2&&gh(x-8*ux,z-8*uz)-h<-0.6))continue;P.pos.set(x,h+2,z);X.cellsAround();if(clearPath(x,z,ux,uz,16))return [x,z];}}
  return null;}
let SLOPE=null,STRAND=null;
function walkRun(id,label){
  const C=X.founderClade(id);X.setMode('menu');X.choose(C);P.dead=false;clearKeys();X.setT(120);
  const ls=P.clade.landSpeed,cap=P.clade.turn*DEG*1.05,capAir=cap*X.STEER.air,grad=gradAt;
  if(!SLOPE){SLOPE=findSpot('slope');STRAND=findSpot('strand');console.log('the slope at '+SLOPE+' (ground '+gh(SLOPE[0],SLOPE[1]).toFixed(1)+'), the strand at '+STRAND+' (ground '+gh(STRAND[0],STRAND[1]).toFixed(1)+')');}
  const set=(x,z,dy)=>{const h=gh(x,z);P.pos.set(x,h+P.clade.clear+(dy||0.05),z);P.vel.set(0,0,0);P.hold=null;X.cellsAround();P.grounded=true;P.wasGrounded=true;};
  set(SLOPE[0],SLOPE[1]);const g=grad(P.pos.x,P.pos.z);P.yaw=P.byaw=Math.atan2(-g.x,-g.z);P.pitch=P.bpitch=0;global.__step(30); // facing uphill
  console.log(label+': walk '+ls+' m/s (swims '+P.clade.speed+', mode '+P.clade.mode+', canSwim '+P.clade.canSwim+', backs '+P.clade.legsBack+'), clearance '+P.clade.clear.toFixed(2)+' m, turn '+P.clade.turn+' rad/s; the slope '+Math.hypot(g.x,g.z).toFixed(2)+' at '+P.pos.y.toFixed(1)+' m');
  const walk=(name,n,ks,head)=>{clearKeys();Object.assign(K,ks||{});for(const c of X.creatures.slice())X.removeCreature(c);let gr=0,pit=0,nan=0,ymin=1e9,ymax=-1e9,off=0,over=0,last=fwdQ(P.g.quaternion);const p0=P.pos.clone();
    for(let i=0;i<n;i++){if(head)head(i);global.__step(1);const f=fwdQ(P.g.quaternion),turn=ang(f,last)/DT;last=f;if(P.grounded)gr++;pit+=P.bpitch;if(!fin(P.pos)||!fin(P.vel)||!isFinite(P.rollBias||0))nan++;ymin=Math.min(ymin,P.pos.y);ymax=Math.max(ymax,P.pos.y);if(i>0&&turn>(P.grounded?cap:capAir))over++;}
    const f=fwdQ(P.g.quaternion),h={x:-Math.sin(P.yaw),y:0,z:-Math.cos(P.yaw)},fh={x:f.x,y:0,z:f.z};const l=Math.hypot(fh.x,fh.z)||1;fh.x/=l;fh.z/=l;off=ang(fh,h);
    const d=P.pos.clone().sub(p0),along=d.x*fh.x+d.z*fh.z,spd=Math.hypot(d.x,d.z)/(n*DT);
    const r={name,gr:gr/n,pitch:pit/n,nan,ymin,ymax,off,over,along,spd,rise:P.pos.y-p0.y,ground:gh(P.pos.x,P.pos.z),sub:P.sub,lean:P.rollBias||0};
    console.log('  '+name.padEnd(12)+' grounded '+(r.gr*100).toFixed(0).padStart(3)+'%  pitch '+(r.pitch*DEG).toFixed(0).padStart(4)+'°  lean '+(r.lean*DEG).toFixed(0).padStart(3)+'°  off '+r.off.toFixed(1).padStart(5)+'°  along '+r.along.toFixed(1).padStart(6)+' m  '+r.spd.toFixed(2)+' m/s  rise '+r.rise.toFixed(2).padStart(6)+'  y '+P.pos.y.toFixed(1)+' over '+r.ground.toFixed(1)+'  sub '+r.sub.toFixed(2)+(r.nan?'  NaN '+r.nan:'')+(r.over?'  spikes '+r.over:''));return r;};
  const up=walk('uphill',240,{KeyW:true});
  check(up.nan===0&&up.over===0,label+': no NaN and no spike walking');
  check(up.gr>0.95&&up.rise>1&&up.pitch>0.08,label+': walks up the slope with its feet on the ground ('+(up.gr*100).toFixed(0)+'% grounded), rose '+up.rise.toFixed(1)+' m, nose up '+(up.pitch*DEG).toFixed(0)+'°');
  check(Math.abs(up.spd-ls)<ls*0.4,label+': at derive\'s walk speed ('+up.spd.toFixed(2)+' of '+ls+' m/s)');
  const y0=P.yaw;P.yaw=y0+HPI2;const tn=walk('turn',120,{KeyW:true});
  check(tn.off<5&&tn.gr>0.95,label+': turns on its legs to a heading a right angle off ('+tn.off.toFixed(1)+'° left after 2 s)');
  walk('settle',40,{});const bk=walk('back',120,{KeyS:true});
  check(P.clade.legsBack?bk.along<-0.8:Math.abs(bk.along)<0.4,label+(P.clade.legsBack?': steps back on s ('+bk.along.toFixed(1)+' m)':': cannot step back on s — its legs are a paddle row ('+bk.along.toFixed(1)+' m)'));
  // a step and a ledge: lifted a little it keeps its feet; lifted a body's height it is off the ground and falls back onto it
  P.pos.y+=0.2;const st=walk('a step',30,{});
  check(st.gr>0.9,label+': a step of 0.2 m keeps its feet on the ground ('+(st.gr*100).toFixed(0)+'%)');
  P.pos.y+=X.WALK.step*Math.max(0.8,P.clade.size)+1.5;let fell=0,landed=-1;clearKeys();for(let i=0;i<240;i++){global.__step(1);if(!P.grounded)fell++;else if(fell>3&&landed<0)landed=i;}
  check(fell>3&&(landed>0||(P.clade.canSwim&&P.vel.y<0)),label+': off a ledge it '+(landed>0?'falls ('+fell+' frames in the water) and lands again at '+(landed*DT).toFixed(1)+' s':'is off the ground, sinking at '+(-P.vel.y).toFixed(2)+' m/s (a swimmer settles at its buoyancy)'));
  // the hop: off the floor; a legs-only body has no thrust in the water and sinks back; a flapper swims away
  const yb=P.pos.y;let hopped=0,hs=0,land=-1,peak=yb,vmax=0;clearKeys();K.KeyW=true;K.Space=true;global.__step(2);K.Space=false;for(let i=0;i<300;i++){global.__step(1);if(!P.grounded){hopped++;peak=Math.max(peak,P.pos.y);vmax=Math.max(vmax,P.vel.length());}else if(hopped>3&&land<0){land=i;break;}}
  if(P.clade.canSwim)check(hopped>100&&vmax>ls*1.5,label+': hops off the floor and swims away on its flaps ('+vmax.toFixed(1)+' m/s, off the ground for '+hopped+' frames'+(land>0?', until the rising shelf':'')+')'); // the slope climbs to the beach ahead: on the low tier's grid it meets the ground again 26 m on
  else check(hopped>3&&land>0&&vmax<ls*1.3,label+': hops '+(peak-yb).toFixed(2)+' m off the floor, cannot swim (top '+vmax.toFixed(1)+' m/s with w held) and sinks back onto it at '+(land*DT).toFixed(1)+' s');
  // the strand
  set(STRAND[0],STRAND[1]);{const g2=grad(P.pos.x,P.pos.z);P.yaw=P.byaw=Math.atan2(-g2.x,-g2.z);}P.pitch=P.bpitch=0;global.__step(20); // up the beach, away from the sea
  const sd=walk('the strand',180,{KeyW:true});
  check(sd.sub<0.5&&sd.gr>0.9&&sd.along>3&&Math.abs(sd.spd-ls)<ls*0.4&&sd.nan===0,label+': walks the strand ashore ('+sd.along.toFixed(1)+' m at '+sd.spd.toFixed(2)+' m/s, '+(sd.gr*100).toFixed(0)+'% grounded)');
}
const HPI2=Math.PI/2;
walkRun('picker','picker (walk legs)');walkRun('scuttle','scuttle (paddle legs)');walkRun('ram','ram (flaps and legs)');
console.log(fails?'\nsteer: '+fails+' FAILED':'\nsteer: all ok');
process.exit(fails?1:0);
