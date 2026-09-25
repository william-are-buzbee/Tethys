// clouds.js — the cloud field and the near clouds (v11.87, CLOUDS.md). The trade-wind deck as one function of a point, written twice — in GLSL for
// the dome, the sea's topside and the land in air, in JavaScript for the beam at the player — from a hash that is exact in float32
// (Ashima's permute polynomial: integers under 2^24 only, so the GPU and the CPU agree to the pixel). The field: a billow noise (1−|2n−1|: convex
// puffs, not amoebae) in three dimensions — a slice at its height is its own shape, so the deck's slices are no longer nested contours of one map
// (the contour-map look v11.17 asked about and nobody answered; seen 23 Sep 2026) — in the wind's frame, stretched along the wind into streets while
// the trades blow (rows CLD.rowL apart, wandering; a calm dissolves them — a street needs a wind), leaning downwind with height, plus a cap over any
// island whose land stands above the base (the giant: 900 m over a 650 m base, the trades forced up its windward flank — ARCHIPELAGO "cloud on the
// top"). The threshold that cuts the field into cloud is the field's own quantile of the cover, calibrated once at load (CLD_TH), so cover 0.4 is four
// tenths of the sky and not a number. The lumps of v11.87 (the near clouds as low-poly heaps in the horizon pass) and the slice deck they stood in for are struck in v11.90: the volume (the last section) is the clouds, the call of the person on v11.89.
const CLD={sc:1/750,zk:0.55,lean:0.16,street:0.5,rowL:4200,rowA:0.07,edge:0.05,rise:0.30,shade:CLD_SHADE,capR:[3000,1800],capOff:1200,capA:0.42,bump:0.5,base:0.12}; // the noise's scale (1/m; v11.90: 750 — at 1250 one cloud filled the sky overhead at half cover; trade cumulus are 0.5–1.5 km across and more of them; the person on v11.89: "almost too large"); the vertical scale of the 3D noise per unit of the deck's height (0.55: a top is related to its base, not a copy); the downwind lean of the tops (noise units per unit height); the along-wind stretch at full trades; the streets' spacing across the wind (m) and their weight; the density's edge width; the threshold's rise with height (the tops narrower than the bases); how much of the beam a cloud takes (world.js CLD_SHADE: scene.js reads it before this file loads); the cap's radii along and across the wind (m), its centre's offset downwind of the summit, its full strength; a shower cell's lift of the field at its centre (v11.88: the congestus); the base's roll-off as a share of the deck's height (v11.90: the threshold rises again under it, so a bottom is rounded, not a cut — the person: "a clear line where the clouds go and stop")
const CLD_ATLAS={w:2048,h:1024,s:256,nx:8,nz:32,zmax:0.6,per:16}; // the volume's noise atlas (v11.89): 32 slices of 256² (8 by 4 in a 2048×1024 texture), one 16-cell tile (20 km) across a slice, the slices from z 0 to 0.6 noise units (the deck's height × CLD.zk 0.55, with a margin); 78 m a texel
const FZ0=0.1; // the height in the deck at which the shadows and the beam read the field (a tenth up: the base's roll-off is under it) — the slice deck's first slice to v11.89
const WA0=Math.cos(WIND_A),WA1=Math.sin(WIND_A),WP0=-Math.sin(WIND_A),WP1=Math.cos(WIND_A); // the wind's frame: along, across
// the caps: every island record whose land stands into the deck (v11.87: the giant); the centre a little downwind of the summit, since the cloud forms over the flank and streams off the top
const CLD_CAPS=ISLANDS.filter(R=>R.land&&R.land.h>CLOUD_H*0.8).map(R=>({x:R.x+WA0*CLD.capOff*R.sc,z:R.z+WA1*CLD.capOff*R.sc,ia:1/Math.pow(CLD.capR[0]*R.sc,2),ic:1/Math.pow(CLD.capR[1]*R.sc,2),h:R.land.h*R.sc}));
const CLD_S={th:1,street:0,cap:0,rise:CLD.rise,here:0,deckL:0,deckC:[1,1,1]}; // the field's live state (atmosphere.js updateSky writes it): the threshold, the streets' weight, the cap's strength, the threshold's rise with height, the density over the player, the deck's sunlight and its colour
const FOG_CLD=new Float32Array(4),FOG_CLDB=new Float32Array([0,0,CLD.rise,CLOUD_H]),FOG_CELLA=new Float32Array(4),FOG_CELLB=new Float32Array(4); // uCellA/B (v11.88): the two showers — the cell's anchor in the field's frame, 1/R², its strength // uCld: the wind's drift x,z (m), the threshold, the density over the player; uCldB: the streets, the cap, the rise, the base's height — shared through ShaderLib like the fog's, written by pushSky
// ---------- the field in GLSL ----------
// The noise (v11.89: tileable — the cell's hash folded into a period per octave, CLD_ATLAS.per base cells doubling with each octave and a lacunarity of exactly 2, so the field
// repeats every per × 1250 m = 20 km and the volume's atlas holds one tile; a seed per octave in place of the old offsets; exact in float32 as before). CLD_NOISE_GLSL is the
// procedural noise alone (the bake runs it once over the tile); CLD_GLSL adds the field: cellK, and cldN (procedural — the shadows on the sea and the land, the beam at
// the player) and cldNT (the same field read from the atlas — the volume) from one template, CLD_FIELD.
const CLD_NOISE_GLSL=['float cldP(float x){return mod((34.0*x+1.0)*x,289.0);}', // the permute: a permutation of 0..288, exact in float32 (the product stays under 2^24)
  'float cldH3(vec3 i){return cldP(cldP(cldP(mod(i.z,289.0))+mod(i.y,289.0))+mod(i.x,289.0))/289.0;}',
  'float cldV(vec3 p,float per,vec3 sd){vec3 i=floor(p),f=p-i;f=f*f*(3.0-2.0*f);vec3 i0=mod(i,per)+sd,i1=mod(i+1.0,per)+sd;',
  '  float a=cldH3(i0),b=cldH3(vec3(i1.x,i0.y,i0.z)),c=cldH3(vec3(i0.x,i1.y,i0.z)),d=cldH3(vec3(i1.x,i1.y,i0.z)),e=cldH3(vec3(i0.x,i0.y,i1.z)),g=cldH3(vec3(i1.x,i0.y,i1.z)),h=cldH3(vec3(i0.x,i1.y,i1.z)),k=cldH3(i1);',
  '  return mix(mix(mix(a,b,f.x),mix(c,d,f.x),f.y),mix(mix(e,g,f.x),mix(h,k,f.x),f.y),f.z);}',
  'float cldF(vec3 p){float P='+CLD_ATLAS.per.toFixed(1)+';float s=0.5*cldV(p,P,vec3(0.0));p*=2.0;P*=2.0;float a=0.225;for(int i=1;i<4;i++){s+=a*(1.0-abs(2.0*cldV(p,P,vec3(float(i)*37.0,float(i)*53.0,float(i)*17.0))-1.0));p*=2.0;P*=2.0;a*=0.45;}return s*1.1478;}'].join('\n')+'\n'; // the first octave plain (the outline of a cloud is a blob), the finer three billow (|2n−1| folds the noise into ridges, 1− it into puffs: the cauliflower inside it); the gain 0.45
const CLD_ATLAS_GLSL='uniform sampler2D uCldTex;float cldFT(vec3 p){vec2 f=fract(p.xy*'+(1/CLD_ATLAS.per).toFixed(6)+')*'+(1-2/CLD_ATLAS.s).toFixed(6)+'+'+(1/CLD_ATLAS.s).toFixed(6)+';float zs=clamp(p.z*'+(CLD_ATLAS.nz/CLD_ATLAS.zmax).toFixed(4)+'-0.5,0.0,'+(CLD_ATLAS.nz-1).toFixed(1)+');float s0=floor(zs),s1=min(s0+1.0,'+(CLD_ATLAS.nz-1).toFixed(1)+'),zf=zs-s0;'+
  'vec2 u0=(vec2(mod(s0,'+CLD_ATLAS.nx.toFixed(1)+'),floor(s0*'+(1/CLD_ATLAS.nx).toFixed(6)+'))+f)*vec2('+(1/CLD_ATLAS.nx).toFixed(6)+','+(CLD_ATLAS.nx/CLD_ATLAS.nz).toFixed(6)+');vec2 u1=(vec2(mod(s1,'+CLD_ATLAS.nx.toFixed(1)+'),floor(s1*'+(1/CLD_ATLAS.nx).toFixed(6)+'))+f)*vec2('+(1/CLD_ATLAS.nx).toFixed(6)+','+(CLD_ATLAS.nx/CLD_ATLAS.nz).toFixed(6)+');return mix(texture2D(uCldTex,u0).r,texture2D(uCldTex,u1).r,zf);}\n'; // the noise off the atlas: the tile's x,y inset a texel from the slice's edge (bilinear must not read the neighbour slice), the height between two slices
function CLD_FIELD(name,F){return ['float '+name+'(vec2 w,vec2 f,float fz){float al=dot(f,vec2('+WA0.toFixed(5)+','+WA1.toFixed(5)+')),cr=dot(f,vec2('+WP0.toFixed(5)+','+WP1.toFixed(5)+'));', // w: the world point (the caps stand still); f: the field point (the world plus the wind's drift); fz: the height in the deck
  '  vec3 p=vec3(al*'+CLD.sc.toFixed(7)+'/(1.0+'+CLD.street.toFixed(2)+'*uCldB.x)-fz*'+CLD.lean.toFixed(3)+',cr*'+CLD.sc.toFixed(7)+',fz*'+CLD.zk.toFixed(3)+');float n='+F+'(p);',
  '  n+='+CLD.rowA.toFixed(3)+'*uCldB.x*cos(cr*'+(TAU/CLD.rowL).toFixed(7)+'+4.0*'+F+'(vec3(al*'+(CLD.sc*0.18).toFixed(8)+',cr*'+(CLD.sc*0.3).toFixed(8)+',0.3)));', // the streets: rows across the wind, wandering on the same noise read coarse
  CLD_CAPS.map(C=>'  {vec2 dd=w-vec2('+C.x.toFixed(1)+','+C.z.toFixed(1)+');float a=dot(dd,vec2('+WA0.toFixed(5)+','+WA1.toFixed(5)+')),c=dot(dd,vec2('+WP0.toFixed(5)+','+WP1.toFixed(5)+'));n+=uCldB.y*exp(-(a*a*'+C.ia.toExponential(4)+'+c*c*'+C.ic.toExponential(4)+'));}').join('\n'),
  '  n+='+CLD.bump.toFixed(2)+'*cellK(f);return n;}'].join('\n')+'\n';}
const CLD_GLSL=CLD_NOISE_GLSL+'float cellK(vec2 f){vec2 a=f-uCellA.xy,b=f-uCellB.xy;return uCellA.w*exp(-dot(a,a)*uCellA.z)+uCellB.w*exp(-dot(b,b)*uCellB.z);}\n'+CLD_FIELD('cldN','cldF'); // the showers (v11.88): each cell a Gaussian in the field's frame, its strength through its life
const CLD_SH_GLSL='float cloudSh(vec3 wp){vec3 s=uFogS.xyz;if(s.y<0.05)return 1.0;vec2 q=wp.xz+s.xz*((uCldB.w-wp.y)/s.y);float n=cldN(q,q+uCld.xy,'+FZ0.toFixed(4)+');float th=uCld.z+uCldB.z*'+(FZ0*FZ0).toFixed(5)+';return 1.0-'+CLD.shade.toFixed(2)+'*smoothstep(th,th+'+CLD.edge.toFixed(3)+',n);}\n'; // the beam's transmission at a world point: the base slice where the ray toward the luminary meets it (uFogS: the luminary's direction, the fog chunk's)
// every fogged material can read the field and the shadow: the uniforms declared at the chunk's head, the functions after its own (scene.js writes the chunk; the sky dome takes CLD_GLSL directly)
THREE.ShaderChunk.fog_pars_fragment=THREE.ShaderChunk.fog_pars_fragment.replace('#ifdef USE_FOG\n','#ifdef USE_FOG\nuniform vec4 uCld;uniform vec4 uCldB;uniform vec4 uCellA;uniform vec4 uCellB;\n')+'\n#ifdef USE_FOG\n'+CLD_GLSL+CLD_SH_GLSL+'#endif\n';
for(const k in THREE.ShaderLib){const u=THREE.ShaderLib[k]&&THREE.ShaderLib[k].uniforms;if(u&&u.fogColor){u.uCld={value:FOG_CLD};u.uCldB={value:FOG_CLDB};u.uCellA={value:FOG_CELLA};u.uCellB={value:FOG_CELLB};}}
// ---------- the field in JavaScript: the same arithmetic ----------
function cldM(x,per){x=x%per;return x<0?x+per:x;}
function cldP(x){return ((34*x+1)*x)%289;}
function cldH3(x,y,z){return cldP(cldP(cldP(cldM(z,289))+cldM(y,289))+cldM(x,289))/289;}
function cldV(x,y,z,per,sx,sy,sz){const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z);let fx=x-ix,fy=y-iy,fz=z-iz;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);fz=fz*fz*(3-2*fz);const x0=cldM(ix,per)+sx,y0=cldM(iy,per)+sy,z0=cldM(iz,per)+sz,x1=cldM(ix+1,per)+sx,y1=cldM(iy+1,per)+sy,z1=cldM(iz+1,per)+sz;
  const a=cldH3(x0,y0,z0),b=cldH3(x1,y0,z0),c=cldH3(x0,y1,z0),d=cldH3(x1,y1,z0),e=cldH3(x0,y0,z1),g=cldH3(x1,y0,z1),h=cldH3(x0,y1,z1),k=cldH3(x1,y1,z1);
  const ab=a+(b-a)*fx,cd=c+(d-c)*fx,eg=e+(g-e)*fx,hk=h+(k-h)*fx,l0=ab+(cd-ab)*fy,l1=eg+(hk-eg)*fy;return l0+(l1-l0)*fz;}
function cldF(x,y,z){let P=CLD_ATLAS.per,s=0.5*cldV(x,y,z,P,0,0,0);x*=2;y*=2;z*=2;P*=2;let a=0.225;for(let i=1;i<4;i++){s+=a*(1-Math.abs(2*cldV(x,y,z,P,i*37,i*53,i*17)-1));x*=2;y*=2;z*=2;P*=2;a*=0.45;}return s*1.1478;}
function cldN(wx,wz,fx,fz,h){const al=fx*WA0+fz*WA1,cr=fx*WP0+fz*WP1;let n=cldF(al*CLD.sc/(1+CLD.street*CLD_S.street)-h*CLD.lean,cr*CLD.sc,h*CLD.zk);
  n+=CLD.rowA*CLD_S.street*Math.cos(cr*(TAU/CLD.rowL)+4*cldF(al*CLD.sc*0.18,cr*CLD.sc*0.3,0.3));
  for(let i=0;i<CLD_CAPS.length;i++){const C=CLD_CAPS[i],dx=wx-C.x,dz=wz-C.z,a=dx*WA0+dz*WA1,c=dx*WP0+dz*WP1;n+=CLD_S.cap*Math.exp(-(a*a*C.ia+c*c*C.ic));}return n+CLD.bump*cellK(fx,fz);}
function cellK(fx,fz){const A=FOG_CELLA,B=FOG_CELLB,ax=fx-A[0],az=fz-A[1],bx=fx-B[0],bz=fz-B[1];return A[3]*Math.exp(-(ax*ax+az*az)*A[2])+B[3]*Math.exp(-(bx*bx+bz*bz)*B[2]);} // the showers' lift at a field point, 0..1 (the GLSL cellK)
// the threshold by the cover: the field's quantiles at the base slice's height, sampled once (the streets and the caps are not in the sample: they move a few percent)
const CLD_TH=(function(){const r=mulberry(8181),v=[];for(let i=0;i<6000;i++)v.push(cldF(r()*60,r()*60,FZ0*CLD.zk));v.sort((a,b)=>a-b);const T=[];for(let k=0;k<=20;k++)T.push(v[Math.min(v.length-1,Math.round((1-k/20)*(v.length-1)))]);return T;})(); // T[k]: the value that k/20 of the sky is above
function cldThOf(cover){const u=clamp(cover,0,1)*20,k=Math.min(19,Math.floor(u));return lerp(CLD_TH[k],CLD_TH[k+1],u-k);}
function cldTh0(){return CLD_S.th+CLD_S.rise*FZ0*FZ0;} // the base slice's threshold
function cldDensity(wx,wz,fx,fz){const th=cldTh0();return smooth(th,th+CLD.edge,cldN(wx,wz,fx,fz,FZ0));} // 0..1, the deck's base at a field point
// the density over a world point along a direction (the luminary): what shades it. Below the deck's base only; a ray flatter than 0.05 finds the cover
function cloudAt(x,y,z,dir){if(dir.y<0.05||y>CLOUD_H)return SKY.cover;const k=(CLOUD_H-y)/dir.y,qx=x+dir.x*k,qz=z+dir.z*k;return cldDensity(qx,qz,qx+SKY.windOff[0],qz+SKY.windOff[1]);}
// ---------- the showers (v11.88, CLOUDS.md §6: pass D) ----------
// A shower is a cell with a place. The weather's rain (world.js weatherAt, the regional trigger: ~8% of hours, before dawn and on a disturbed day)
// opens an episode; each episode births one cell SHWR.ahead upwind of the player on a track across the wind hashed from the episode (±SHWR.band:
// most pass beside you, a quarter over you), steered along the wind at SHWR.u × the trades — the flow at 1–3 km that carries a congestus outruns
// the surface wind and the deck's drift — and alive SHWR.life real seconds (the deck drifts in real time; a shower crossing at 45× would be a film
// run fast), growing over SHWR.grow and dying over SHWR.fade. Its congestus is a bump in the cloud field at its anchor (cellK: the deck thickens and
// darkens there and grows to a tower, the sea goes dark under it through cloudSh), its rain at the camera the cell's profile at the camera's distance
// (SHWR.shaft of its radius: the rain shaft is narrower than the cloud), and the dome draws the shaft as a curtain from the base to the sea
// (atmosphere.js SKY_FS curtain). Everything that read the weather's rain reads the cell's here now — the rain, its rings, the patter, the haze,
// the gust, the base's drop, the scud, the bow (which stands on the curtain). Two cells at most (an episode every ~7 game hours, a cell alive 13
// real minutes: they overlap). Born from the player's position at the episode's start, so a cell is a place from then on; a save loaded mid-episode
// gets none (the shower passed).
const SHWR={n:2,u:2.2,life:800,grow:120,fade:220,R:[2200,3200],shaft:0.5,band:4500,ahead:6000,vis:2500}; // cells at once; the cell's speed in trade winds; its life, growth and fade (real s); its radius (m); the rain shaft as a share of the radius; the track's spread across the wind (m); how far upwind it is born; the curtain's visibility (m: the path through the shaft that hides half)
const CELLS=[],cellTmp={};let cellLast=-1; // cellLast: the episode (its start hour ×4) last given a cell
function cellEpisode(h){let hs=h;for(let i=0;i<12;i++){weatherAt(hs-0.25,cellTmp);if(cellTmp.rain<=0.001)break;hs-=0.25;}return Math.floor(hs*4);} // the episode's start, walked back a quarter hour at a time
function cellStrength(c){return smooth(0,SHWR.grow,c.t)*smooth(SHWR.life,SHWR.life-SHWR.fade,c.t);}
function updateCells(dt){const K=SKY;
  if(WX.rain>0.001){const ep=cellEpisode(clockH);if(ep!==cellLast){cellLast=ep;const r=mulberry(ep*7919+31),px=player.pos.x,pz=player.pos.z,al=px*WA0+pz*WA1-SHWR.ahead,cr=px*WP0+pz*WP1+(r()-0.5)*2*SHWR.band,R=lerp(SHWR.R[0],SHWR.R[1],r());
    const x=al*WA0+cr*WP0,z=al*WA1+cr*WP1;if(CELLS.length>=SHWR.n)CELLS.shift();CELLS.push({ax:x+K.windOff[0],az:z+K.windOff[1],R:R,t:0,s:0,here:0,x:x,z:z});}}
  const vx=SHWR.u*WIND_U*WA0-K.wind[0],vz=SHWR.u*WIND_U*WA1-K.wind[1]; // the cell's motion in the field's frame: its own steering less the field's drift
  let rain=0,near=0;for(let i=CELLS.length-1;i>=0;i--){const c=CELLS[i];c.t+=dt;if(c.t>SHWR.life){CELLS.splice(i,1);continue;}c.ax+=vx*dt;c.az+=vz*dt;c.x=c.ax-K.windOff[0];c.z=c.az-K.windOff[1];c.s=cellStrength(c);
    const dx=c.x-player.pos.x,dz=c.z-player.pos.z,d=Math.sqrt(dx*dx+dz*dz),rs=c.R*SHWR.shaft;c.here=c.s*smooth(rs*1.15,rs*0.5,d);rain=Math.max(rain,c.here);near=Math.max(near,c.s*smooth(c.R*3,c.R,d));}
  for(let i=0;i<2;i++){const c=CELLS[i],F=i?FOG_CELLB:FOG_CELLA;if(c){F[0]=c.ax;F[1]=c.az;F[2]=1/(c.R*c.R);F[3]=c.s;}else{F[0]=0;F[1]=0;F[2]=1;F[3]=0;}}
  K.rain=rain;K.cellNear=near;} // rain: the shaft over the camera; cellNear: a cell within three radii, for the cover's lift and the bow
// ---------- the volume (v11.89, CLOUDS.md §8; the only clouds since v11.90 — the slice deck of v11.17 and the lumps of v11.87 are struck, the person: "this is definitely the system we are going with") ----------
function updateClouds(dt){if(!cldBaked)cldBake();} // the atlas once, when the renderer is up (atmosphere.js updateAtmosphere)
// The deck as a volume: the same field, read from an atlas the GPU bakes once from CLD_NOISE_GLSL (cldBake: a quad over a render target, the noise at every texel of every
// slice — half float where the frame buffer allows it, bytes otherwise), and marched by the dome (atmosphere.js cloudVol). cldDensT is the density at a world point: the field's
// coordinate (the wind's frame, the streets' stretch, the lean, the height in the local deck — a shower cell's is deeper), the threshold rising with the height, the cell bumps and
// the caps as in cldN; the rows' wander is taken once a ray (rowW) since it changes over kilometres. The procedural cldN stays for the shadows and the beam (their materials have
// no texture unit to spare; the two agree to the atlas's interpolation).
const cldTexU={value:null};let cldBaked=false,cldRT=null; // cldRT: the atlas's render target, kept for a read-back
const CLD_VOL_GLSL=CLD_ATLAS_GLSL+['float cldDensT(vec3 wp,float rowW,out float fz){vec2 f=wp.xz+uCld.xy;float al=dot(f,vec2('+WA0.toFixed(5)+','+WA1.toFixed(5)+')),cr=dot(f,vec2('+WP0.toFixed(5)+','+WP1.toFixed(5)+'));float ck=cellK(f);float Tl=uVolT.x*(1.0+2.0*ck);fz=(wp.y-uCldB.w)/Tl;if(fz<0.0||fz>1.0)return 0.0;',
  '  vec3 p=vec3(al*'+CLD.sc.toFixed(7)+'/(1.0+'+CLD.street.toFixed(2)+'*uCldB.x)-fz*'+CLD.lean.toFixed(3)+',cr*'+CLD.sc.toFixed(7)+',fz*'+CLD.zk.toFixed(3)+');float n=cldFT(p)+'+CLD.rowA.toFixed(3)+'*uCldB.x*cos(cr*'+(TAU/CLD.rowL).toFixed(7)+'+4.0*rowW);',
  CLD_CAPS.map(C=>'  {vec2 dd=wp.xz-vec2('+C.x.toFixed(1)+','+C.z.toFixed(1)+');float a=dot(dd,vec2('+WA0.toFixed(5)+','+WA1.toFixed(5)+')),c=dot(dd,vec2('+WP0.toFixed(5)+','+WP1.toFixed(5)+'));n+=uCldB.y*exp(-(a*a*'+C.ia.toExponential(4)+'+c*c*'+C.ic.toExponential(4)+'));}').join('\n'),
  '  n+='+CLD.bump.toFixed(2)+'*ck;float th=uCld.z+uCldB.z*fz*fz+'+(0.8*CLD.rise).toFixed(3)+'*pow(max('+CLD.base.toFixed(3)+'-fz,0.0)*'+(1/CLD.base).toFixed(4)+',2.0);return smoothstep(th,th+'+CLD.edge.toFixed(3)+',n);}', // the threshold rises with the height (the tops narrower) and again under CLD.base (the bottom rounded)
  'float cldRowW(vec2 wxz){vec2 f=wxz+uCld.xy;float al=dot(f,vec2('+WA0.toFixed(5)+','+WA1.toFixed(5)+')),cr=dot(f,vec2('+WP0.toFixed(5)+','+WP1.toFixed(5)+'));return cldFT(vec3(al*'+(CLD.sc*0.18).toFixed(8)+',cr*'+(CLD.sc*0.3).toFixed(8)+',0.3));}'].join('\n')+'\n';
function cldBake(){if(cldBaked)return;cldBaked=true;
  try{const A=CLD_ATLAS,mk=type=>new THREE.WebGLRenderTarget(A.w,A.h,{type:type,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,depthBuffer:false,stencilBuffer:false,generateMipmaps:false});
    const sc=new THREE.Scene(),cam=new THREE.OrthographicCamera(-1,1,1,-1,0,2),m=new THREE.ShaderMaterial({uniforms:{},vertexShader:'void main(){gl_Position=vec4(position.xy,0.5,1.0);}',
      fragmentShader:CLD_NOISE_GLSL+'void main(){vec2 uv=gl_FragCoord.xy/vec2('+A.w.toFixed(1)+','+A.h.toFixed(1)+');vec2 g=uv*vec2('+A.nx.toFixed(1)+','+(A.nz/A.nx).toFixed(1)+');vec2 f=fract(g);float s=floor(g.x)+floor(g.y)*'+A.nx.toFixed(1)+';vec3 p=vec3(f*'+A.per.toFixed(1)+',(s+0.5)*'+(A.zmax/A.nz).toFixed(6)+');gl_FragColor=vec4(cldF(p),0.0,0.0,1.0);}'}); // a slice's texel: the tile's x,y at the texel's centre, the slice's z at its centre
    sc.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),m));const gl=renderer.getContext(),prev=renderer.getRenderTarget();
    let rt=mk(THREE.HalfFloatType);renderer.setRenderTarget(rt);let half=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
    if(!half){renderer.setRenderTarget(null);rt.dispose();rt=mk(THREE.UnsignedByteType);renderer.setRenderTarget(rt);}
    renderer.render(sc,cam);renderer.setRenderTarget(prev);if(!rt.texture)throw new Error('no texture');cldTexU.value=rt.texture;cldRT=rt;m.dispose();
    console.log('clouds: the atlas baked, '+A.w+'×'+A.h+(half?', half float':', bytes'));}
  catch(e){cldTexU.value=null;console.warn('clouds: no atlas ('+(e&&e.message)+'); the sky keeps the slices');}}
