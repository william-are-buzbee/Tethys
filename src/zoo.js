// zoo.js — the bestiary: every species of the roster (creatures_defs.js ROSTER), one at a time, in the water at the peak where the
// menu shows the three clades, with the game's own light and fog. For looking at a builder before it is placed. Open the game
// with #zoo in the URL, or press z on the menu; z or escape returns to the menu. Left and right (or a, d) step through the roster,
// space fires the action (the tell, then the strike: the states every anim reads, creatures_builders.js), s toggles a cruising
// speed, drag turns the view, the wheel zooms; on touch, drag turns and a tap on either edge steps. Floor species sit at the
// game's floor clearance (size*0.35 over the ground), swimmers mid-water. The arms and tails are simulated as in the menu.
// Up and down (w, x) cycle the coat: the species rebuilt in a palette variant (creatures_builders.js PAL_VARIANTS — hue shifts, the
// clade's blood tint, dark water, bleached, a hard countershade); the caption names it. For looking, nothing in the world reads it.
const zooEl=document.getElementById('zoo'),zooNameEl=document.getElementById('zooname'),zooLineEl=document.getElementById('zooline'),zooHintEl=document.getElementById('zoohint');
const zoo={i:0,v:0,b:null,yaw:0.6,pitch:0.22,dist:10,auto:0,drag:null,act:-1,cruise:false,radius:2,cy:0,floor:false};
function zooRadius(g){ // the bounding radius of a built creature in world units (child transforms taken as translations only)
  let r2=0;const s=g.scale.x;
  g.traverse(o=>{if(!o.isMesh||!o.geometry.attributes.position)return;const a=o.geometry.attributes.position.array,px=o.position.x,py=o.position.y,pz=o.position.z;
    for(let i=0;i<a.length;i+=3){const x=a[i]+px,y=a[i+1]+py,z=a[i+2]+pz;const d=x*x+y*y+z*z;if(d>r2)r2=d;}});
  return Math.sqrt(r2)*s;
}
function zooShow(i){
  if(zoo.b){scene.remove(zoo.b.g);zoo.b.g.traverse(o=>{if(o.geometry)o.geometry.dispose();});zoo.b=null;}
  const n=ROSTER.length;zoo.i=((i%n)+n)%n;const r=ROSTER[zoo.i],d=r.player?CLADES.find(c=>c.id===r.id):DEFS[r.id];
  // the coat: swap the species' PAL entry for the variant while it builds (the builders read PAL.x at call time), then put it back
  const pk=palKey(r.id),pal0=pk?PAL[pk]:null,vk=zoo.v%PAL_VARIANTS.length;
  if(pal0&&vk)PAL[pk]=palVariant(pal0,vk,r.clade);
  let b;try{b=d.build();}finally{if(pal0)PAL[pk]=pal0;}
  b.owner={b:b,pos:b.g.position,grab:null,reach:0,shapesW:null};
  const size=d.size,floor=r.floor||d.floor;
  zoo.floor=!!floor;zoo.cy=floor?floor0+size*0.35:clamp(floor0+4.5+size*0.5,floor0+3,TIDE-2-size*0.4);
  b.g.position.set(0,zoo.cy,0);b.g.rotation.y=0;castOn(b.g);scene.add(b.g);zoo.b=b;
  zoo.radius=Math.max(0.6,zooRadius(b.g));zoo.dist=Math.max(4,zoo.radius*2.0+1.5);zoo.act=-1;
  zooNameEl.textContent=r.name||r.id;
  // a species with a spec (creatures_spec.js) shows the calculator's numbers beside DEFS's, so the scale can be tuned (CREATOR.md)
  const sp=SPECS[r.id],dv=sp?derive(sp):null;
  zooLineEl.innerHTML=r.clade+', '+r.family+'<br>'+r.niche+'<br>half-length '+size+' m'+(r.new?'<br><i>built, not yet placed</i>':'')+
    (vk?'<br><i>coat: '+PAL_VARIANTS[vk][0]+(pal0?'':' (no palette)')+'</i>':'')+
    (dv?'<br><i>derived: '+dv.mode+', speed '+dv.speed+' (defs '+(d.speed||'–')+'), turn '+dv.turn+' ('+(d.turn||'–')+'), hp '+dv.hp+' ('+(d.hp>1e8?'∞':d.hp)+'), '+dv.mass+' t, '+dv.cost+' points — l to edit</i>':'<br><i>a hand builder, no spec</i>');
}
function zooEnter(){
  if(mode!=='menu')return;mode='zoo';picksEl.style.display='none';zooEl.classList.add('on');
  for(const b of menuCreatures)b.g.visible=false;
  zooHintEl.textContent=isTouch?'drag to turn. tap an edge for the next one':'left and right for the next one, up and down for another coat, space for the strike, s to cruise, drag to turn, wheel to close in, l for the lab, z to go back';
  zooShow(zoo.i);
}
function zooLeave(){
  if(mode!=='zoo')return;mode='menu';picksEl.style.display='';zooEl.classList.remove('on');
  if(zoo.b){scene.remove(zoo.b.g);zoo.b.g.traverse(o=>{if(o.geometry)o.geometry.dispose();});zoo.b=null;}
  for(const b of menuCreatures)b.g.visible=true;
  layoutMenu();
}
function zooAct(){if(zoo.b)zoo.act=0;}
// the action as a clock: the tell rises over 0.6 s and holds, the strike snaps in 0.15 s and holds, both let go over 0.7 s
function zooState(){
  const st={};const a=zoo.act;if(a<0)return st;
  const tell=a<0.6?smooth(0,0.6,a):a<1.4?1:1-smooth(1.4,2.1,a);const strike=a<0.75?0:a<0.9?smooth(0.75,0.9,a):a<1.4?1:1-smooth(1.4,2.1,a);
  st.tell=tell;st.strike=strike;st.jet=strike>0.5;st.pulse=strike*0.6;st.withdrawn=strike>0.5;return st;
}
function updateZoo(dt){
  if(mode!=='zoo'||!zoo.b)return;
  const b=zoo.b;
  if(zoo.act>=0){zoo.act+=dt;if(zoo.act>2.2)zoo.act=-1;}
  const st=zooState(),spd=(zoo.cruise?1.2:0.3)+2.5*(st.strike||0);
  b.anim(t,spd,st);b.g.updateMatrix();worldShapes(b.owner);stepRigs(b.owner,null,dt);
  zoo.auto-=dt;if(zoo.auto<=0)zoo.yaw+=0.18*dt;
  // the camera orbits the creature, kept under the surface and off the floor
  const cp=Math.cos(zoo.pitch),sp=Math.sin(zoo.pitch),cy=zoo.cy+(zoo.floor?zoo.radius*0.25:0);
  let x=Math.sin(zoo.yaw)*cp*zoo.dist,y=cy+sp*zoo.dist,z=Math.cos(zoo.yaw)*cp*zoo.dist;
  y=clamp(y,groundAt(x,z)+1.2,TIDE-1.0);
  camera.position.set(x,y,z);camera.lookAt(0,cy,0);
}
addEventListener('keydown',e=>{
  if(mode==='menu'&&e.code==='KeyZ'){zooEnter();return;}
  if(mode!=='zoo')return;
  if(e.code==='KeyZ'||e.code==='Escape')zooLeave();
  else if(e.code==='ArrowRight'||e.code==='KeyD')zooShow(zoo.i+1);
  else if(e.code==='ArrowLeft'||e.code==='KeyA')zooShow(zoo.i-1);
  else if(e.code==='ArrowUp'||e.code==='KeyW'){e.preventDefault();zoo.v=(zoo.v+1)%PAL_VARIANTS.length;zooShow(zoo.i);}
  else if(e.code==='ArrowDown'||e.code==='KeyX'){e.preventDefault();zoo.v=(zoo.v+PAL_VARIANTS.length-1)%PAL_VARIANTS.length;zooShow(zoo.i);}
  else if(e.code==='Space'){e.preventDefault();zooAct();}
  else if(e.code==='KeyS')zoo.cruise=!zoo.cruise;
});
canvas.addEventListener('mousedown',e=>{if(mode!=='zoo'||e.button!==0)return;zoo.drag={x:e.clientX,y:e.clientY,moved:0};});
addEventListener('mousemove',e=>{if(mode!=='zoo'||!zoo.drag)return;const dx=e.movementX||0,dy=e.movementY||0;zoo.drag.moved+=Math.abs(dx)+Math.abs(dy);zoo.yaw-=dx*0.006;zoo.pitch=clamp(zoo.pitch+dy*0.004,-0.3,1.2);zoo.auto=4;});
addEventListener('mouseup',()=>{if(mode!=='zoo'||!zoo.drag)return;if(zoo.drag.moved<4)zooAct();zoo.drag=null;});
addEventListener('wheel',e=>{if(mode!=='zoo')return;zoo.dist=clamp(zoo.dist*(e.deltaY>0?1.1:0.9),Math.max(2,zoo.radius*0.6),Math.max(12,zoo.radius*6));},{passive:true});
canvas.addEventListener('touchstart',e=>{if(mode!=='zoo')return;const tc=e.changedTouches[0];zoo.drag={x:tc.clientX,y:tc.clientY,moved:0,x0:tc.clientX};},{passive:true});
canvas.addEventListener('touchmove',e=>{if(mode!=='zoo'||!zoo.drag)return;const tc=e.changedTouches[0],dx=tc.clientX-zoo.drag.x,dy=tc.clientY-zoo.drag.y;zoo.drag.x=tc.clientX;zoo.drag.y=tc.clientY;zoo.drag.moved+=Math.abs(dx)+Math.abs(dy);zoo.yaw-=dx*0.008;zoo.pitch=clamp(zoo.pitch+dy*0.005,-0.3,1.2);zoo.auto=4;},{passive:true});
canvas.addEventListener('touchend',()=>{if(mode!=='zoo'||!zoo.drag)return;const d=zoo.drag;zoo.drag=null;if(d.moved>=12)return;if(d.x0<innerWidth*0.2)zooShow(zoo.i-1);else if(d.x0>innerWidth*0.8)zooShow(zoo.i+1);else zooAct();});
if((location.hash||'').indexOf('zoo')>=0)zooEnter();
