// Headless snow check (v11.24): the player put at sites down the column with their cells loaded, the cloud run until its refresh
// has been round every point several times, and what the water there holds printed — the share of the count live (the density),
// the kinds' mix, the mean alpha and size, the mean settling. Then the invariants: no NaN in a position, bubbles only at the top,
// black flakes only under the chemocline or at a vent, the lit layer mostly live, the plate denser than the water above it, the
// nepheloid layer over mud denser than the mid-water over it, and the loop's cost. It proves the population goes where it should;
// it says nothing about how it looks.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const ORDER=fs.readFileSync(path.join(ROOT,'src','order.txt'),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&s[0]!=='#');
let js=ORDER.map(n=>fs.readFileSync(path.join(ROOT,'src',n+'.js'),'utf8')).join('\n');
js+='\nglobal.__T={upd:0n,n:0};{const o=updatePlankton;updatePlankton=function(a){const t0=process.hrtime.bigint();o(a);__T.upd+=process.hrtime.bigint()-t0;__T.n++;};}';
js+='\nglobal.__sn={set:(x,y,z)=>{player.pos.set(x,y,z);player.vel.set(0,0,0);camera.position.set(x,y+2,z+8);const ci=cellOf(x),cj=cellOf(z);for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++)if(ci+di>=0&&cj+dj>=0&&ci+di<NCELL&&cj+dj<NCELL)loadChunkNow(ci+di,cj+dj);},'+
  'ground:(x,z)=>groundAt(x,z),lm:()=>LM,tide:()=>TIDE,n:()=>PN_SN,'+
  'stats:()=>{const o={live:0,kinds:[0,0,0,0,0,0],alpha:0,size:0,fall:0,nan:0,ymin:1e9,ymax:-1e9};for(let i=0;i<PN_SN;i++){const x=pp[i*3],y=pp[i*3+1],z=pp[i*3+2];if(x!==x||y!==y||z!==z)o.nan++;if(pk[i]===255||pk[i]===254)continue;o.live++;o.kinds[pk[i]]++;o.alpha+=ps[i*2+1];o.size+=ps[i*2];o.fall+=SN_K[pk[i]].fall;if(y<o.ymin)o.ymin=y;if(y>o.ymax)o.ymax=y;}'+
  'if(o.live){o.alpha/=o.live;o.size/=o.live;o.fall/=o.live;}o.share=o.live/PN_SN;return o;},'+
  'W:(x,y,z)=>{snowSeed(0,x,y,z);const w=[];let W=0;for(let k=0;k<6;k++){w.push(+snowW(k,0,y).toFixed(3));W+=w[k];}return {W:+W.toFixed(3),w:w};}};';
const tmp=path.join(require('os').tmpdir(),'tethys_snow_bundle.js');
fs.writeFileSync(tmp,'(function(){"use strict";\n'+js+'\n})();');
process.env.PICK='1';
require('./stub.js');
require(tmp);
const h=global.__h;
for(let i=0;i<30;i++)__step(1);
h['mnew:click'][0]();h['mfounders:click'][0]({target:{dataset:{id:'fin'}}}); // v11.47: the menu's new game, then (v11.75) the finback from the founder's list
let failed=false;
function ok(c,msg){console.log((c?'  ok   ':'  FAIL ')+msg);if(!c)failed=true;}
const LM=__sn.lm();
const KN=['live','floc','silt','bubble','black','chain'];
const sites=[
  {name:'the lit shallows off the peak, 3 m under',x:0,z:0,y:-3},
  {name:'the windward shallows (the surf; the struck shore is stripped to rock)',x:Math.cos(0.35)*300,z:Math.sin(0.35)*300,y:-4},
  {name:'the lee shallows (sand)',x:Math.cos(3.49)*300,z:Math.sin(3.49)*300,dy:2},
  {name:'the shelf forest (330,0), 4 m over the floor',x:330,z:0,dy:4},
  {name:'the lagoon, mid-water',x:0,z:60,dy:8},
  {name:'the thermocline over the slope',x:Math.cos(5.44)*1000,z:Math.sin(5.44)*1000,y:-64},
  {name:'mid-water over the slope',x:Math.cos(5.44)*1000,z:Math.sin(5.44)*1000,y:-110},
  {name:'the deep floor: the nepheloid layer',x:Math.cos(1.5)*1500,z:Math.sin(1.5)*1500,dy:3},
  {name:'the deep, 60 m over the same floor',x:Math.cos(1.5)*1500,z:Math.sin(1.5)*1500,dy:60},
  {name:'the chemocline over the pit',x:LM.pit.x,z:LM.pit.z,y:-450}, // v11.28: the void is a flank now (-320 at the square's edge); the pit is the dark inside the square
  {name:'40 m above the chemocline',x:LM.pit.x,z:LM.pit.z,y:-410},
  {name:'below the chemocline',x:LM.pit.x,z:LM.pit.z,y:-520},
  {name:'the vent field, 6 m over the fissure',x:Math.cos(2.68)*1300,z:Math.sin(2.68)*1300,dy:6}, // the heat field sits at the warped angle, 2.66-2.7 raw; the chimney landmark at 2.60 is just outside it
  {name:'the front ring at a side break (v11.82)',x:622,z:579,y:-20},
  {name:'the slope beside it, the same depth',x:951,z:886,y:-20},
  {name:'the deep maximum over the fed slope',x:Math.cos(5.44)*1300,z:Math.sin(5.44)*1300,y:-95},
  {name:'the same column at 140',x:Math.cos(5.44)*1300,z:Math.sin(5.44)*1300,y:-140}];
for(const s of sites){
  const g=__sn.ground(s.x,s.z),y=s.y!==undefined?s.y:g+s.dy;__sn.set(s.x,y,s.z);__step(400); // six refreshes round every point
  const S=__sn.stats(),W=__sn.W(s.x+3,y,s.z+3);s.S=S;s.W=W;
  const mix=S.kinds.map((n,k)=>n?KN[k]+' '+(100*n/S.live).toFixed(0)+'%':'').filter(Boolean).join('  ');
  console.log('  '+s.name+'  y '+y.toFixed(0)+' (floor '+g.toFixed(0)+', depth '+(__sn.tide()-y).toFixed(0)+')\n    live '+(100*S.share).toFixed(0)+'% of '+__sn.n()+'  W '+W.W+' ['+W.w.join(' ')+']  alpha '+S.alpha.toFixed(2)+'  size '+S.size.toFixed(2)+'  fall '+(S.fall*100).toFixed(1)+' cm/s\n    '+(mix||'nothing'));
  ok(S.nan===0,'no NaN in a position');
}
const sh=(s,k)=>s.S.live?s.S.kinds[k]/s.S.live:0;
ok(sites[0].W.w[0]>sites[0].W.w[2]+sites[0].W.w[3]&&sh(sites[0],0)+sh(sites[0],5)>0.35,'the lit water over the lagoon is mostly live (the water '+sites[0].W.w[0]+' vs silt '+sites[0].W.w[2]+' and bubbles '+sites[0].W.w[3]+'; the box '+(100*(sh(sites[0],0)+sh(sites[0],5))).toFixed(0)+'% with the chains, v11.82)');
ok(sh(sites[1],3)>0.03,'the surf carries bubbles ('+(100*sh(sites[1],3)).toFixed(0)+'%)');
ok(sh(sites[2],2)>0.15,'the lee shallows carry sand ('+(100*sh(sites[2],2)).toFixed(0)+'%)');
ok(sh(sites[6],3)===0&&sh(sites[7],3)===0,'no bubbles in the mid-water or the deep');
ok(sites[5].W.w[1]>sites[6].W.w[1],'the thermocline holds more floc than the water under it ('+sites[5].W.w[1]+' vs '+sites[6].W.w[1]+'; by the weight since v11.82: the live kind is the field\'s now and its share moves)');
ok(sites[7].W.w[2]>sites[7].W.w[1]&&sh(sites[7],2)>0.2,'the nepheloid layer over the deep mud is silt (the layer '+sites[7].W.w[2]+' vs floc '+sites[7].W.w[1]+'; the box '+(100*sh(sites[7],2)).toFixed(0)+'%)');
ok(sites[7].S.share>sites[8].S.share,'the bed is denser than 60 m over it ('+(100*sites[7].S.share).toFixed(0)+'% vs '+(100*sites[8].S.share).toFixed(0)+'%)');
ok(sites[9].S.share>sites[10].S.share,'the plate is denser than 40 m above it ('+(100*sites[9].S.share).toFixed(0)+'% vs '+(100*sites[10].S.share).toFixed(0)+'%)');
ok(sh(sites[11],4)>0.7&&sh(sites[11],1)<0.2,'below the chemocline it is black flakes ('+(100*sh(sites[11],4)).toFixed(0)+'%)');
ok(sh(sites[10],4)===0&&sh(sites[6],4)===0,'no black flakes in oxic water away from a vent');
ok(sites[11].W.W<sites[9].W.W*0.7,'the anoxic water is sparser than the plate (the column\'s weight '+sites[11].W.W+' vs '+sites[9].W.W+')'); // v11.28: by the column's weight, not the cloud's share — over the pit the site is 34 m off the bed and the nepheloid layer is in the box; the void, 280 m over its floor, is a flank now
ok(sh(sites[12],4)>0.15,'the vent field has its sulfide grains ('+(100*sh(sites[12],4)).toFixed(0)+'%)');
// v11.82 (PLANKTON.md §9): the snow's life follows the field
ok(sites[13].W.w[0]>sites[14].W.w[0]*1.5&&sites[13].S.share>sites[14].S.share,'the ring at the break holds more life than the slope beside it (the live weight '+sites[13].W.w[0]+' vs '+sites[14].W.w[0]+'; the box '+(100*sites[13].S.share).toFixed(0)+'% vs '+(100*sites[14].S.share).toFixed(0)+'%)');
ok(sh(sites[13],5)>0.03,'and chains in it ('+(100*sh(sites[13],5)).toFixed(0)+'%)');
ok(sites[15].W.w[0]>sites[16].W.w[0]*1.5&&sh(sites[15],0)>0.15,'the deep maximum at 95 m is alive where the same column 45 m under it is not (the live weight '+sites[15].W.w[0]+' vs '+sites[16].W.w[0]+' at 140; the box '+(100*sh(sites[15],0)).toFixed(0)+'% live)');
// the cost
__sn.set(330,__sn.ground(330,0)+3,0);__step(60);__T.upd=0n;__T.n=0;
const key=(code,down)=>h['win:'+(down?'keydown':'keyup')].forEach(f=>f({code,preventDefault(){}}));
key('KeyW',true);__step(400);key('KeyW',false);const per=Number(__T.upd)/1e6/__T.n;
console.log('  cost: updatePlankton '+per.toFixed(3)+' ms a frame over '+__T.n+' frames moving through the shelf forest (this machine, headless)');
ok(per<0.6,'under 0.6 ms a frame headless');
console.log(failed?'SNOW FAILED':'snow ok');
if(failed)process.exit(1);
