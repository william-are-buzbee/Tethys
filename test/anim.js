// Headless check of the swimming animation's smoothness: the player's finback tail (the hinge's angular speed) and the
// soft-arm's and coilshell's arm tips (frame-to-frame change of velocity, a jerk) through a scripted run — idle, accelerate,
// cruise, turn, sprint, coast — two minutes into a session, when t is large. This is the run that caught v10.8's three
// faults: the t*f(spd) phase spin (tail 19 rad/s on any change of speed), the coil's arms shivering against their own
// hull at idle, and its short arms flung by the hard joint limit on every deceleration. T0=600 to try ten minutes in.
// Same bundle and stub as the physics test. `node test/anim.js`.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const ORDER=fs.readFileSync(path.join(ROOT,'src','order.txt'),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&s[0]!=='#');
let js=ORDER.map(n=>fs.readFileSync(path.join(ROOT,'src',n+'.js'),'utf8')).join('\n');
js+='\nglobal.__phys={player,choose,keys,t:()=>t,setT:(v)=>{t=v;},get mode(){return mode;},setMode:(m)=>{mode=m;}};';
const tmp=path.join(require('os').tmpdir(),'tethys_jank.js');
fs.writeFileSync(tmp,'(function(){"use strict";\n'+js+'\n})();');
process.env.PICK='0';
require('./stub.js');require(tmp);
const X=global.__phys,P=X.player;let fails=0;
function check(ok,msg){if(!ok){fails++;console.error('  FAIL '+msg);}else console.log('  ok   '+msg);}
const T0=parseFloat(process.env.T0||'120');
function run(clade,label){
  X.setMode('menu');X.choose(clade);P.dead=false;P.pos.set(20,-8,20);P.vel.set(0,0,0);for(const k in X.keys)X.keys[k]=false;
  X.setT(T0);global.__step(30);
  const phases=[['idle',90,{}],['accel',60,{KeyW:true}],['cruise',120,{KeyW:true}],['turn',90,{KeyW:true,KeyA:true}],['sprint',90,{KeyW:true,ShiftLeft:true}],['coast',120,{}]];
  const rows=[];
  for(const [name,n,ks] of phases){
    for(const k in X.keys)X.keys[k]=false;Object.assign(X.keys,ks);
    let sumTail=0,maxTail=0,sumJerk=0,maxJerk=0,prevTail=null,prevV=null,cnt=0;
    for(let i=0;i<n;i++){
      global.__step(1);
      const b=P.b;
      if(b.rigs){ // arm tips: mean over the chains of |Δv| per frame
        const rig=b.rigs[0];let j=0,m=0;const V=[];
        for(const c of rig.chains){const k=c.n*3;V.push([c.vel[k],c.vel[k+1],c.vel[k+2]]);}
        if(prevV){for(let q=0;q<V.length;q++){const d=Math.hypot(V[q][0]-prevV[q][0],V[q][1]-prevV[q][1],V[q][2]-prevV[q][2]);j+=d;m++;}j/=m;sumJerk+=j;maxJerk=Math.max(maxJerk,j);}
        prevV=V;
      }
      const tail=b.g.children.find(c=>c.position&&Math.abs(c.position.z+0.55)<1e-6);
      if(tail){const r=tail.rotation.y;if(prevTail!==null){const w=Math.abs(r-prevTail)/0.0167;sumTail+=w;maxTail=Math.max(maxTail,w);}prevTail=r;}
      cnt++;
    }
    rows.push({phase:name,spd:P.spd.toFixed(1),tailMean:(sumTail/cnt).toFixed(1),tailMax:maxTail.toFixed(1),jerkMean:(sumJerk/cnt).toFixed(2),jerkMax:maxJerk.toFixed(2)});
  }
  console.log(label+' at t='+T0+'s');
  if(clade===1)console.log('  phase     spd   tail rad/s mean  max');else console.log('  phase     spd   tip |dv| per frame mean  max');
  for(const r of rows)console.log('  '+r.phase.padEnd(8)+'  '+r.spd.padStart(5)+'   '+(clade===1?r.tailMean.padStart(8)+'  '+r.tailMax.padStart(6):r.jerkMean.padStart(8)+'  '+r.jerkMax.padStart(6)));
  return rows;
}
// the tail's peak angular speed is amplitude x frequency: 0.45 x (1.5+0.9 x 8.8) = 4.2 rad/s at cruise, 6.9 at sprint; the old phase spin gave 50
const fin=run(1,'finback');
check(+fin[1].tailMax<8,'finback: the tail never exceeds 8 rad/s while accelerating ('+fin[1].tailMax+')');
check(+fin[5].tailMean<3,'finback: and averages under 3 while coasting ('+fin[5].tailMean+')');
const soft=run(0,'soft-arm');
check(+soft[0].jerkMean<0.05,'soft-arm: the arm tips are still at idle ('+soft[0].jerkMean+' per frame)');
check(+soft[1].jerkMax<1.0,'soft-arm: and not flung by an acceleration ('+soft[1].jerkMax+' max)');
check(+soft[4].jerkMax<2.0,'soft-arm: nor by the jet ('+soft[4].jerkMax+' max)');
const coil=run(2,'coilshell');
check(+coil[0].jerkMean<0.05,'coilshell: the arms are still at idle, not shivering against the hull ('+coil[0].jerkMean+')');
check(+coil[5].jerkMax<1.0,'coilshell: and not flung by the joint limit while coasting ('+coil[5].jerkMax+' max)');
console.log(fails?'\nanim: '+fails+' FAILED':'\nanim: all ok');
process.exit(fails?1:0);
