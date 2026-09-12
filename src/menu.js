// menu.js — clade selection: three creatures turning in the shallows, click one to become it
const menuCreatures=CLADES.map(c=>{const b=c.build();castOn(b.g);scene.add(b.g);b.owner={b:b,pos:b.g.position,grab:null,reach:0,shapesW:null};return b;}); // owner: what physics.js stepRigs wants
let leaving=[];
function layoutMenu(){
  const portrait=innerWidth<innerHeight*0.95;picksEl.classList.toggle('col',portrait);
  const dist=portrait?12:10;const hw=dist*Math.tan(camera.fov*Math.PI/360)*(portrait?1:camera.aspect);
  menuCreatures.forEach((b,i)=>{const o=i-1;if(portrait)b.g.position.set(0,dispY-o*hw*0.5,0);else b.g.position.set(o*hw*0.62,dispY,0);b.g.userData.base=b.g.position.clone();});
  camera.position.set(0,dispY+0.6,dist);camera.lookAt(0,dispY-0.2,0);
}
layoutMenu();
function updateMenu(dt){
  if(mode==='menu')menuCreatures.forEach((b,i)=>{b.g.rotation.y=0.6+t*0.25+i*2;b.g.position.y=b.g.userData.base.y+0.25*Math.sin(t*0.7+i);b.anim(t+i*3,0.3,{});b.g.updateMatrix();worldShapes(b.owner);stepRigs(b.owner,null,dt);});
  for(let i=leaving.length-1;i>=0;i--){const l=leaving[i];l.t-=dt;l.b.g.position.addScaledVector(l.dir,5*dt);l.b.g.quaternion.slerp(l.q,0.05);l.b.anim(t,1.5,{});l.b.g.updateMatrix();worldShapes(l.b.owner);stepRigs(l.b.owner,null,dt);if(l.t<=0){scene.remove(l.b.g);leaving.splice(i,1);}}
}
function choose(i){
  if(mode!=='menu')return;mode='play';
  const C=CLADES[i];player.clade=C;player.b=menuCreatures[i];player.g=menuCreatures[i].g;player.anim=menuCreatures[i].anim;player.mass=C.mass;player.def.size=C.size;
  player.pos.copy(player.g.position);player.vel.set(0,0,0);player.hp=player.maxhp=C.hp;player.dead=false;player.yaw=0;player.pitch=0;player.cd=0;
  menuCreatures.forEach((b,j)=>{if(j===i)return;const dir=V3(j-1===0?(i===0?1:-1):(j-1),0.2,-1).normalize();const q=new THREE.Quaternion();_m.lookAt(V3(0,0,0).copy(b.g.position).add(dir),b.g.position,UP);q.setFromRotationMatrix(_m);leaving.push({b:b,dir:dir,q:q,t:5});});
  menuEl.classList.add('gone');
  hintEl.textContent=isTouch?'left side: drag to swim. right side: drag to look, tap to bite, hold to grab. two fingers: ability':'w a s d swim, space rise, c dive, shift burst, q ability, click bite, right button or r hold, f first person, tab cursor, m mute';
  hintEl.style.opacity=1;setTimeout(()=>{hintEl.style.opacity=0;},10000);
  initAudio();tryLock();
}
document.querySelectorAll('.pick').forEach(el=>{el.addEventListener('click',()=>choose(+el.dataset.i));});
