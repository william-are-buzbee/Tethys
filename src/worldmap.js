// worldmap.js — the world map in the game (v11.63, the person's ask): a dev tool beside tp(), not a thing the animal carries — nothing in the
// game reads it and nothing is saved. `n` opens it over the play or the menu: the whole world from sample() with test/map.js's bands, hillshade
// and contours, the islands' land and reach rings (world.js ISLANDS), the clamp, the old square, the loaded cells, the landmarks, the player as a
// dot with its facing; under the picture the cursor's place and the ground there, and the player's. The wheel zooms about the cursor, a drag
// pans, a click goes there (tp, in play) and closes; esc or n closes. The world's picture is WMAP_N² samples made on first opening (~0.3 s,
// once, a stall the person will notice and a dev tool may have); zoomed in, the window is re-sampled at WMAP_Z² when the wheel or the drag
// rests, so the island's square reads at its own scale rather than as 66 px of the world. The pointer is released while it is open and taken
// back when it closes, as the effects list does (effects.js fxShow). The bands and contours are test/map.js's, kept in step by hand.
const WMAP_N=512,WMAP_Z=320,WMAP_REST=180; // the world picture's side in samples; the zoomed window's; the rest (ms) after a wheel or drag before the window re-samples
const WMAP_BANDS=[[0,[0.55,0.52,0.40]],[-6,[0.62,0.78,0.72]],[-60,[0.30,0.62,0.66]],[-150,[0.18,0.42,0.56]],[-450,[0.12,0.26,0.44]],[-800,[0.10,0.17,0.30]],[-1100,[0.08,0.11,0.20]],[-3000,[0.04,0.05,0.10]]];
const WMAP_CONT=[0,-60,-150,CHEMO,-800,-1000]; // the sea, the shelf's edge, the light's end, the chemocline, the deep, the floor's top (the hills cross -1100 everywhere)
const wmapEl=document.getElementById('wmap'),wmapC=document.getElementById('wmapc'),wmapL=document.getElementById('wmapl');
const wmap={open:false,cx:0,cz:0,span:2*HALF,base:null,win:null,winKey:'',rest:0,drag:null,moved:0,mx:0,mz:0,hover:false};
function wmapBand(h){if(h>=0)return h>4?[0.42,0.40,0.32]:WMAP_BANDS[0][1];for(let k=1;k<WMAP_BANDS.length;k++)if(h>=WMAP_BANDS[k][0]){const a=WMAP_BANDS[k-1][1],b=WMAP_BANDS[k][1],t=(WMAP_BANDS[k-1][0]-h)/(WMAP_BANDS[k-1][0]-WMAP_BANDS[k][0]);return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}return WMAP_BANDS[WMAP_BANDS.length-1][1];}
// the picture of the square of side span about cx,cz, W pixels a side: heights on a (W+2)² grid (a ring for the shade), lit from the north-west and low, a contour where a band is crossed toward the right or down (test/map.js, the same numbers)
function wmapPicture(cx,cz,span,W){const N=W+2,M=span/W,x0=cx-span/2,z0=cz-span/2,H=new Float32Array(N*N),f=new Float32Array(NF);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++)H[j*N+i]=sample(x0+(i-0.5)*M,z0+(j-0.5)*M,f).h;
  const cv=document.createElement('canvas');cv.width=W;cv.height=W;const g=cv.getContext('2d'),img=g.createImageData(W,W),d=img.data;
  for(let y=0;y<W;y++)for(let x=0;x<W;x++){const k=(y+1)*N+(x+1),h=H[k],dx=(H[k+1]-H[k-1])/(2*M),dz=(H[k+N]-H[k-N])/(2*M);
    const len=Math.sqrt(dx*dx+1+dz*dz),nd=(0.55*dx+0.35+0.55*dz)/len/0.75,sh=0.55+0.55*Math.max(0,Math.min(1.4,nd)),c=wmapBand(h);let r=c[0]*sh,gr=c[1]*sh,b=c[2]*sh;
    const hr=H[k+1],hd=H[k+N];for(const cl of WMAP_CONT){if((h-cl)*(hr-cl)<0||(h-cl)*(hd-cl)<0){const w=cl===CHEMO?0.35:cl===0?0.6:0.5,l=cl===CHEMO?0.6:0.95;r=r*(1-w)+l*w;gr=gr*(1-w)+l*w;b=b*(1-w)+l*w;if(cl===CHEMO)r+=0.15;}}
    const o=(y*W+x)*4;d[o]=Math.min(255,r*255);d[o+1]=Math.min(255,gr*255);d[o+2]=Math.min(255,b*255);d[o+3]=255;}
  g.putImageData(img,0,0);return cv;}
function wmapKey(){return Math.round(wmap.cx)+','+Math.round(wmap.cz)+','+Math.round(wmap.span);}
function wmapShow(on){if(on===wmap.open)return;if(on&&mode!=='play'&&mode!=='menu')return;wmap.open=on;wmapEl.classList.toggle('on',on);
  if(on){try{const W=Math.max(200,Math.min(innerWidth,innerHeight)-90);wmapC.width=W;wmapC.height=W;if(!wmap.base)wmap.base=wmapPicture(0,0,2*HALF,WMAP_N);wmap.win=null;wmap.rest=0;
      if(mode==='play'&&player.clade){wmap.cx=player.pos.x;wmap.cz=player.pos.z;if(wmap.span>=2*HALF)wmap.span=2*HALF;} // opened in play: centred on you, the world whole (a zoom is kept between openings)
      wmapDraw();}catch(e){console.warn('the world map could not draw: '+e.message);wmap.open=false;wmapEl.classList.toggle('on',false);return;}
    if(mode==='play'&&locked)unlock();}
  else if(mode==='play'&&!isTouch)tryLock();}
function wmapDraw(){if(!wmap.open)return;const W=wmapC.width,g=wmapC.getContext('2d'),S=wmap.span,x0=wmap.cx-S/2,z0=wmap.cz-S/2,px=x=>(x-x0)/S*W,pz=z=>(z-z0)/S*W;
  g.fillStyle='#03080f';g.fillRect(0,0,W,W);
  const win=wmap.win&&wmap.winKey===wmapKey()?wmap.win:null;
  if(win)g.drawImage(win,0,0,W,W);else{const k=WMAP_N/(2*HALF);g.imageSmoothingEnabled=S>=HALF;g.drawImage(wmap.base,(x0+HALF)*k,(z0+HALF)*k,S*k,S*k,0,0,W,W);} // the world's picture, or the window's when it is fresh; a coarse zoom of the world shows its blocks rather than a blur
  const ring=(x,z,r,col,dash)=>{g.strokeStyle=col;g.setLineDash(dash||[]);g.beginPath();g.arc(px(x),pz(z),r/S*W,0,TAU);g.stroke();g.setLineDash([]);};
  const rect=(xa,za,xb,zb,col,dash)=>{g.strokeStyle=col;g.setLineDash(dash||[]);g.strokeRect(px(xa),pz(za),(xb-xa)/S*W,(zb-za)/S*W);g.setLineDash([]);};
  g.lineWidth=1;
  for(const ch of chunks.values())rect(ch.x0,ch.z0,ch.x0+CELL,ch.z0+CELL,'rgba(200,215,225,0.22)'); // the loaded cells
  rect(-HALF+25,-HALF+25,HALF-25,HALF-25,'rgba(150,150,150,0.6)',[6,6]); // the clamp
  rect(-1720,-1720,1720,1720,'rgba(250,220,90,0.55)',[4,4]); // the island's square (v11.57's world)
  for(const R of ISLANDS){ring(R.x,R.z,R.reach*R.sc,'rgba(150,150,150,0.5)',[4,6]);if(R.land)ring(R.x,R.z,R.land.r*R.sc,'rgba(200,210,230,0.7)');} // the island records: the reach, the land
  g.fillStyle='rgba(240,240,230,0.9)';for(const p of LM.all){g.beginPath();g.arc(px(p.x),pz(p.z),2,0,TAU);g.fill();} // the landmarks
  if(mode==='play'&&player.clade){const x=px(player.pos.x),y=pz(player.pos.z),fx=-Math.sin(player.yaw),fz=-Math.cos(player.yaw); // the player: a dot and the way it faces (player.js finishPlayer: forward is (-sin yaw, -cos yaw))
    g.strokeStyle='rgba(255,230,120,0.95)';g.lineWidth=1.5;g.beginPath();g.moveTo(x,y);g.lineTo(x+fx*14,y+fz*14);g.stroke();g.fillStyle='rgba(255,230,120,0.95)';g.beginPath();g.arc(x,y,3.5,0,TAU);g.fill();g.lineWidth=1;}
  if(wmap.hover){const x=px(wmap.mx),y=pz(wmap.mz);g.strokeStyle='rgba(240,240,230,0.7)';g.beginPath();g.moveTo(x-8,y);g.lineTo(x-3,y);g.moveTo(x+3,y);g.lineTo(x+8,y);g.moveTo(x,y-8);g.lineTo(x,y-3);g.moveTo(x,y+3);g.lineTo(x,y+8);g.stroke();} // the cursor
  const sb=S>=16000?5000:S>=6000?2000:S>=2500?1000:S>=1000?500:100,sw=sb/S*W;g.strokeStyle='rgba(240,240,230,0.85)';g.beginPath();g.moveTo(16,W-16);g.lineTo(16+sw,W-16);g.moveTo(16,W-21);g.lineTo(16,W-11);g.moveTo(16+sw,W-21);g.lineTo(16+sw,W-11);g.stroke(); // the scale bar
  g.fillStyle='rgba(240,240,230,0.85)';g.font='11px Georgia, serif';g.fillText((sb>=1000?sb/1000+' km':sb+' m'),18,W-25);
  const f=n=>{const v=Math.round(n);return (v<0?'−':'')+Math.abs(v);};let s=wmap.hover?'x '+f(wmap.mx)+'   z '+f(wmap.mz)+'   ground '+f(sample(wmap.mx,wmap.mz).h)+' m':'the world, north up';
  if(mode==='play'&&player.clade)s+='      you  x '+f(player.pos.x)+'   z '+f(player.pos.z)+'   y '+f(player.pos.y);
  s+='      n close  ·  click go  ·  wheel zoom  ·  drag pan';wmapL.textContent=s;}
// after the loop's frame (main.js): the dot moves, the loaded cells change; a zoomed window is sampled once the view has rested
function updateWMap(dt){if(!wmap.open)return;if(mode!=='play'&&mode!=='menu'){wmapShow(false);return;}
  if(wmap.rest>0){wmap.rest-=dt*1000;if(wmap.rest<=0&&wmap.span<2*HALF*0.6&&wmap.winKey!==wmapKey()){try{wmap.win=wmapPicture(wmap.cx,wmap.cz,wmap.span,WMAP_Z);wmap.winKey=wmapKey();}catch(e){wmap.win=null;}}}
  wmapDraw();}
function wmapAt(e){const r=wmapC.getBoundingClientRect(),W=wmapC.width,u=(e.clientX-r.left)/r.width,v=(e.clientY-r.top)/r.height;return [wmap.cx-wmap.span/2+u*wmap.span,wmap.cz-wmap.span/2+v*wmap.span,u*W,v*W];}
wmapC.addEventListener('mousedown',e=>{if(e.button!==0)return;wmap.drag={x:e.clientX,y:e.clientY,cx:wmap.cx,cz:wmap.cz};wmap.moved=0;e.preventDefault();});
addEventListener('mousemove',e=>{if(!wmap.open)return;if(wmap.drag){const r=wmapC.getBoundingClientRect(),k=wmap.span/r.width;wmap.cx=wmap.drag.cx-(e.clientX-wmap.drag.x)*k;wmap.cz=wmap.drag.cz-(e.clientY-wmap.drag.y)*k;wmap.moved+=Math.abs(e.movementX)+Math.abs(e.movementY);wmap.rest=WMAP_REST;}
  const r=wmapC.getBoundingClientRect();wmap.hover=e.clientX>=r.left&&e.clientX<r.right&&e.clientY>=r.top&&e.clientY<r.bottom;if(wmap.hover){const p=wmapAt(e);wmap.mx=p[0];wmap.mz=p[1];}});
addEventListener('mouseup',e=>{if(!wmap.open||!wmap.drag)return;const d=wmap.drag;wmap.drag=null;if(wmap.moved>4)return; // a drag panned; a click goes
  if(mode==='play'&&player.clade){const p=wmapAt(e);window.tp(p[0],p[1]);wmapShow(false);}});
wmapC.addEventListener('wheel',e=>{if(!wmap.open)return;e.preventDefault();const p=wmapAt(e),k=Math.pow(1.25,e.deltaY>0?1:-1),S=clamp(wmap.span*k,300,2*HALF*1.25); // zoom about the cursor: the place under it stays under it
  wmap.cx=p[0]-(p[0]-wmap.cx)*S/wmap.span;wmap.cz=p[1]-(p[1]-wmap.cz)*S/wmap.span;wmap.span=S;wmap.rest=WMAP_REST;},{passive:false});
addEventListener('keydown',e=>{if(e.code==='KeyN'&&(mode==='play'||mode==='menu')&&!showStats)wmapShow(!wmap.open);else if(e.code==='Escape'&&wmap.open){wmapShow(false);e.preventDefault();}}); // with the readout open n is the fog tuner's (main.js FOG_TUNE dlAt), so the map stands down then; the default prevented: menu.js's esc (play to the menu) runs after this and stands down
document.addEventListener('pointerlockchange',()=>{if(wmap.open&&document.pointerLockElement===canvas)wmapShow(false);}); // a click on the game's canvas took the pointer back: the map is done with
