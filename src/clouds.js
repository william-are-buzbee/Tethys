// clouds.js — the cloud field and the near clouds (v11.87, CLOUDS.md). The trade-wind deck as one function of a point, written twice — in GLSL for
// the dome, the sea's topside and the land in air, in JavaScript for the beam at the player and the lumps — from a hash that is exact in float32
// (Ashima's permute polynomial: integers under 2^24 only, so the GPU and the CPU agree to the pixel). The field: a billow noise (1−|2n−1|: convex
// puffs, not amoebae) in three dimensions — a slice at its height is its own shape, so the deck's slices are no longer nested contours of one map
// (the contour-map look v11.17 asked about and nobody answered; seen 23 Sep 2026) — in the wind's frame, stretched along the wind into streets while
// the trades blow (rows CLD.rowL apart, wandering; a calm dissolves them — a street needs a wind), leaning downwind with height, plus a cap over any
// island whose land stands above the base (the giant: 900 m over a 650 m base, the trades forced up its windward flank — ARCHIPELAGO "cloud on the
// top"). The threshold that cuts the field into cloud is the field's own quantile of the cover, calibrated once at load (CLD_TH), so cover 0.4 is four
// tenths of the sky and not a number. The second half is the lumps: the person's ask of 24 Sep 2026 — the near clouds as flat-shaded low-poly lumps
// with real parallax, drawn in the horizon pass (the far plane is 1600 m; a cloud a kilometre off at 650 m up would clip) at the field's maxima within
// LUMP_R of the camera, the deck fading out under them (SKY_FS reads uLump); and the giant's cap as fixed lumps that stand in front of its summit,
// which the dome's deck, drawn behind the land, cannot.
const CLD={sc:1/1250,zk:0.55,lean:0.16,street:0.5,rowL:4200,rowA:0.07,edge:0.05,rise:0.30,shade:CLD_SHADE,capR:[3000,1800],capOff:1200,capA:0.42,near:[1400,2600]}; // the noise's scale (1/m); the vertical scale of the 3D noise per unit of the deck's height (0.55: a top is related to its base, not a copy); the downwind lean of the tops (noise units per unit height); the along-wind stretch at full trades; the streets' spacing across the wind (m) and their weight; the density's edge width; the threshold's rise with height (the tops narrower than the bases); how much of the beam a cloud takes (world.js CLD_SHADE: scene.js reads it before this file loads); the cap's radii along and across the wind (m), its centre's offset downwind of the summit, its full strength; the deck's fade under the lumps (ground distance, m)
const FZ0=0.5/Q.cloud; // the base slice's height in the deck (the march samples slice i at (i+0.5)/Q.cloud): the JS twin and the shadow read the field there
const WA0=Math.cos(WIND_A),WA1=Math.sin(WIND_A),WP0=-Math.sin(WIND_A),WP1=Math.cos(WIND_A); // the wind's frame: along, across
// the caps: every island record whose land stands into the deck (v11.87: the giant); the centre a little downwind of the summit, since the cloud forms over the flank and streams off the top
const CLD_CAPS=ISLANDS.filter(R=>R.land&&R.land.h>CLOUD_H*0.8).map(R=>({x:R.x+WA0*CLD.capOff*R.sc,z:R.z+WA1*CLD.capOff*R.sc,ia:1/Math.pow(CLD.capR[0]*R.sc,2),ic:1/Math.pow(CLD.capR[1]*R.sc,2),h:R.land.h*R.sc}));
const CLD_S={th:1,street:0,cap:0,rise:CLD.rise,here:0,lump:0,deckL:0,deckC:[1,1,1]}; // the field's live state (atmosphere.js updateSky writes it): the threshold, the streets' weight, the cap's strength, the threshold's rise with height, the density over the player, the lumps' share, the deck's sunlight and its colour
const FOG_CLD=new Float32Array(4),FOG_CLDB=new Float32Array([0,0,CLD.rise,CLOUD_H]); // uCld: the wind's drift x,z (m), the threshold, the density over the player; uCldB: the streets, the cap, the rise, the base's height — shared through ShaderLib like the fog's, written by pushSky
// ---------- the field in GLSL ----------
const CLD_GLSL=['float cldP(float x){return mod((34.0*x+1.0)*x,289.0);}', // the permute: a permutation of 0..288, exact in float32 (the product stays under 2^24)
  'float cldH3(vec3 i){return cldP(cldP(cldP(mod(i.z,289.0))+mod(i.y,289.0))+mod(i.x,289.0))/289.0;}',
  'float cldV(vec3 p){vec3 i=floor(p),f=p-i;f=f*f*(3.0-2.0*f);float a=cldH3(i),b=cldH3(i+vec3(1.0,0.0,0.0)),c=cldH3(i+vec3(0.0,1.0,0.0)),d=cldH3(i+vec3(1.0,1.0,0.0)),e=cldH3(i+vec3(0.0,0.0,1.0)),g=cldH3(i+vec3(1.0,0.0,1.0)),h=cldH3(i+vec3(0.0,1.0,1.0)),k=cldH3(i+vec3(1.0,1.0,1.0));',
  '  return mix(mix(mix(a,b,f.x),mix(c,d,f.x),f.y),mix(mix(e,g,f.x),mix(h,k,f.x),f.y),f.z);}',
  'float cldF(vec3 p){float s=0.5*cldV(p);p=p*2.07+vec3(17.3,9.1,3.7);float a=0.225;for(int i=1;i<4;i++){s+=a*(1.0-abs(2.0*cldV(p)-1.0));p=p*2.07+vec3(17.3,9.1,3.7);a*=0.45;}return s*1.1478;}', // the first octave plain (the outline of a cloud is a blob), the finer three billow (|2n−1| folds the noise into ridges, 1− it into puffs: the cauliflower inside it); the gain 0.45 — at 0.5 with every octave billowed the deck was a field of cells (seen 24 Sep)
  'float cldN(vec2 w,vec2 f,float fz){float al=dot(f,vec2('+WA0.toFixed(5)+','+WA1.toFixed(5)+')),cr=dot(f,vec2('+WP0.toFixed(5)+','+WP1.toFixed(5)+'));', // w: the world point (the caps stand still); f: the field point (the world plus the wind's drift); fz: the height in the deck
  '  vec3 p=vec3(al*'+CLD.sc.toFixed(7)+'/(1.0+'+CLD.street.toFixed(2)+'*uCldB.x)-fz*'+CLD.lean.toFixed(3)+',cr*'+CLD.sc.toFixed(7)+',fz*'+CLD.zk.toFixed(3)+');float n=cldF(p);',
  '  n+='+CLD.rowA.toFixed(3)+'*uCldB.x*cos(cr*'+(TAU/CLD.rowL).toFixed(7)+'+4.0*cldV(vec3(al*'+(CLD.sc*0.18).toFixed(8)+',cr*'+(CLD.sc*0.3).toFixed(8)+',7.0)));', // the streets: rows across the wind, wandering on a slow noise
  CLD_CAPS.map(C=>'  {vec2 dd=w-vec2('+C.x.toFixed(1)+','+C.z.toFixed(1)+');float a=dot(dd,vec2('+WA0.toFixed(5)+','+WA1.toFixed(5)+')),c=dot(dd,vec2('+WP0.toFixed(5)+','+WP1.toFixed(5)+'));n+=uCldB.y*exp(-(a*a*'+C.ia.toExponential(4)+'+c*c*'+C.ic.toExponential(4)+'));}').join('\n'),
  '  return n;}'].join('\n')+'\n';
const CLD_SH_GLSL='float cloudSh(vec3 wp){vec3 s=uFogS.xyz;if(s.y<0.05)return 1.0;vec2 q=wp.xz+s.xz*((uCldB.w-wp.y)/s.y);float n=cldN(q,q+uCld.xy,'+FZ0.toFixed(4)+');float th=uCld.z+uCldB.z*'+(FZ0*FZ0).toFixed(5)+';return 1.0-'+CLD.shade.toFixed(2)+'*smoothstep(th,th+'+CLD.edge.toFixed(3)+',n);}\n'; // the beam's transmission at a world point: the base slice where the ray toward the luminary meets it (uFogS: the luminary's direction, the fog chunk's)
// every fogged material can read the field and the shadow: the uniforms declared at the chunk's head, the functions after its own (scene.js writes the chunk; the sky dome takes CLD_GLSL directly)
THREE.ShaderChunk.fog_pars_fragment=THREE.ShaderChunk.fog_pars_fragment.replace('#ifdef USE_FOG\n','#ifdef USE_FOG\nuniform vec4 uCld;uniform vec4 uCldB;\n')+'\n#ifdef USE_FOG\n'+CLD_GLSL+CLD_SH_GLSL+'#endif\n';
for(const k in THREE.ShaderLib){const u=THREE.ShaderLib[k]&&THREE.ShaderLib[k].uniforms;if(u&&u.fogColor){u.uCld={value:FOG_CLD};u.uCldB={value:FOG_CLDB};}}
// ---------- the field in JavaScript: the same arithmetic ----------
function cldM(x){x=x%289;return x<0?x+289:x;}
function cldP(x){return ((34*x+1)*x)%289;}
function cldH3(x,y,z){return cldP(cldP(cldP(cldM(z))+cldM(y))+cldM(x))/289;}
function cldV(x,y,z){const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z);let fx=x-ix,fy=y-iy,fz=z-iz;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);fz=fz*fz*(3-2*fz);
  const a=cldH3(ix,iy,iz),b=cldH3(ix+1,iy,iz),c=cldH3(ix,iy+1,iz),d=cldH3(ix+1,iy+1,iz),e=cldH3(ix,iy,iz+1),g=cldH3(ix+1,iy,iz+1),h=cldH3(ix,iy+1,iz+1),k=cldH3(ix+1,iy+1,iz+1);
  const ab=a+(b-a)*fx,cd=c+(d-c)*fx,eg=e+(g-e)*fx,hk=h+(k-h)*fx,l0=ab+(cd-ab)*fy,l1=eg+(hk-eg)*fy;return l0+(l1-l0)*fz;}
function cldF(x,y,z){let s=0.5*cldV(x,y,z);x=x*2.07+17.3;y=y*2.07+9.1;z=z*2.07+3.7;let a=0.225;for(let i=1;i<4;i++){s+=a*(1-Math.abs(2*cldV(x,y,z)-1));x=x*2.07+17.3;y=y*2.07+9.1;z=z*2.07+3.7;a*=0.45;}return s*1.1478;}
function cldN(wx,wz,fx,fz,h){const al=fx*WA0+fz*WA1,cr=fx*WP0+fz*WP1;let n=cldF(al*CLD.sc/(1+CLD.street*CLD_S.street)-h*CLD.lean,cr*CLD.sc,h*CLD.zk);
  n+=CLD.rowA*CLD_S.street*Math.cos(cr*(TAU/CLD.rowL)+4*cldV(al*CLD.sc*0.18,cr*CLD.sc*0.3,7));
  for(let i=0;i<CLD_CAPS.length;i++){const C=CLD_CAPS[i],dx=wx-C.x,dz=wz-C.z,a=dx*WA0+dz*WA1,c=dx*WP0+dz*WP1;n+=CLD_S.cap*Math.exp(-(a*a*C.ia+c*c*C.ic));}return n;}
// the threshold by the cover: the field's quantiles at the base slice's height, sampled once (the streets and the caps are not in the sample: they move a few percent)
const CLD_TH=(function(){const r=mulberry(8181),v=[];for(let i=0;i<6000;i++)v.push(cldF(r()*60,r()*60,FZ0*CLD.zk));v.sort((a,b)=>a-b);const T=[];for(let k=0;k<=20;k++)T.push(v[Math.min(v.length-1,Math.round((1-k/20)*(v.length-1)))]);return T;})(); // T[k]: the value that k/20 of the sky is above
function cldThOf(cover){const u=clamp(cover,0,1)*20,k=Math.min(19,Math.floor(u));return lerp(CLD_TH[k],CLD_TH[k+1],u-k);}
function cldTh0(){return CLD_S.th+CLD_S.rise*FZ0*FZ0;} // the base slice's threshold
function cldDensity(wx,wz,fx,fz){const th=cldTh0();return smooth(th,th+CLD.edge,cldN(wx,wz,fx,fz,FZ0));} // 0..1, the deck's base at a field point
// the density over a world point along a direction (the luminary): what shades it. Below the deck's base only; a ray flatter than 0.05 finds the cover
function cloudAt(x,y,z,dir){if(dir.y<0.05||y>CLOUD_H)return SKY.cover;const k=(CLOUD_H-y)/dir.y,qx=x+dir.x*k,qz=z+dir.z*k;return cldDensity(qx,qz,qx+SKY.windOff[0],qz+SKY.windOff[1]);}
// ---------- the lumps ----------
const LUMP_N=24,LUMP_CELL=300,LUMP_R=2400,LUMP_MIN=0.03,LUMP_T=0.5,LUMP_EASE=0.5,LUMP_VAR=4,LUMP_STEP=100,LUMP_WALK=14; // the pool; the scan's cell (m); how far out the field is scanned; how far over its threshold a maximum must stand; s between scans; the scale's ease rate (1/s); shape variants; the walk that measures a cloud (step, m; steps)
const lumps=[],lumpFixed=[],lumpByKey=new Map(),lumpSeen=new Set();let lumpGroup=null,lumpMat=null,lumpT=0,lumpGrid=null;const LUMP_GEO=[];
const LUMP_U={uLmpL:{value:new THREE.Vector3(1,1,1)},uLmpS:{value:new THREE.Vector3(0.5,0.5,0.5)},uLmpK:{value:new THREE.Vector4(0,0,0,0)}},lumpLit=[1,1,1],lumpShd=[0.5,0.5,0.5]; // the lit and the shade colours (the deck's own, updateClouds)
function lumpGeo(seed){const rng=mulberry(seed),parts=[],P=[],n=14+Math.floor(rng()*8); // a cumulus as lumps: 14–21 dodecahedra (detail 1: 144 faces) of the low-poly kit, packed in a flattened heap, their undersides pressed to one flat base (the lifting condensation level is a plane)
  for(let i=0;i<n;i++){const a=rng()*TAU,r=Math.sqrt(rng())*0.55,x=Math.cos(a)*r,z=Math.sin(a)*r,s=0.18+rng()*0.22,sy=s*(0.8+rng()*0.5),y=sy*0.45+rng()*0.12*(1-r);P.push([x,y,z,s,sy]);
    parts.push(part(new THREE.DodecahedronGeometry(1,1),x,y,z,[1,1,1],{s:[s,sy,s],r:[rng()*0.6,rng()*TAU,rng()*0.6],c2:[0.62,0.65,0.70]}));} // countershaded by merge: white tops, the base a shade of grey
  const g=merge(parts),p=g.attributes.position.array,nr=g.attributes.normal.array,per=p.length/3/n; // the normals: each puff's own ellipsoid, smooth, so the three steps band across a puff instead of flashing per facet (the silhouette keeps its facets)
  for(let i=0;i<p.length/3;i++){const q=P[Math.min(n-1,Math.floor(i/per))],dx=(p[i*3]-q[0])/(q[3]*q[3]),dy=(p[i*3+1]-q[1])/(q[4]*q[4]),dz=(p[i*3+2]-q[2])/(q[3]*q[3]);let L=Math.sqrt(dx*dx+dy*dy+dz*dz)||1;let nx=dx/L,ny=dy/L,nz=dz/L;
    if(p[i*3+1]<0){p[i*3+1]*=0.25;nx*=0.3;nz*=0.3;ny=ny*0.3-0.7;L=Math.sqrt(nx*nx+ny*ny+nz*nz);nx/=L;ny/=L;nz/=L;}nr[i*3]=nx;nr[i*3+1]=ny;nr[i*3+2]=nz;}
  g.computeBoundingSphere();return g;}
function lumpMaterial(){const m=hzMat(HZ_VS_HEAD+'varying vec3 vCol;varying vec3 vN;void main(){vN=normalize(mat3(modelMatrix)*normal);vec3 p=(modelMatrix*vec4(position,1.0)).xyz;vec2 dd=p.xz-uFogC.xz;p.y-=dot(dd,dd)*'+(0.5/HZ_R).toExponential(6)+';vec4 mv=viewMatrix*vec4(p,1.0);vFogDepth=length(mv.xyz);vFogPos=p;vCol=color;gl_Position=projectionMatrix*mv;}', // the horizon pass's own drop for the curvature; the normal in world space (the mesh is scaled unevenly, so it is only nearly right — enough for three steps)
  HZ_FS_HEAD+THREE.ShaderChunk.fog_pars_fragment+'\nuniform vec3 uLmpL;uniform vec3 uLmpS;uniform vec4 uLmpK;varying vec3 vCol;varying vec3 vN;void main(){vec3 n=normalize(vN);float sd=clamp(dot(n,uFogS.xyz)*1.3+0.35+uLmpK.x*max(-n.y,0.0),0.0,1.0);sd=floor(sd*3.0+0.5)/3.0;vec3 col=vCol*mix(uLmpS,uLmpL,sd);float d=vFogDepth;vec3 rd=(vFogPos-uFogC)/max(d,1e-3);col=fogAir(col,uFogC,rd,d,1.0);gl_FragColor=vec4(dithering(col),1.0);}'); // the puff's normal, lit by the luminary in the deck's three steps, the undersides lit by a low sun (uLmpK.x, as the deck's bases are), the base's grey in the vertex colour, fogged by the air
  Object.assign(m.uniforms,LUMP_U);m.side=THREE.FrontSide;return m;}
function lumpMake(){lumpGroup=new THREE.Group();hzScene.add(lumpGroup);lumpMat=lumpMaterial();for(let v=0;v<LUMP_VAR;v++)LUMP_GEO.push(lumpGeo(5151+v*17));
  for(let i=0;i<LUMP_N;i++){const m=new THREE.Mesh(LUMP_GEO[i%LUMP_VAR],lumpMat);m.visible=false;m.rotation.y=-WIND_A;lumpGroup.add(m);lumps.push({key:0,fx:0,fz:0,rx:0,rz:0,s:0,alive:false,mesh:m});}
  // the caps as fixed lumps: five over each cap's centre, spread along the wind, their base a little under the deck's so the summit stands into them
  for(let c=0;c<CLD_CAPS.length;c++){const C=CLD_CAPS[c],rng=mulberry(6161+c);for(let i=0;i<5;i++){const a=(rng()-0.5)*2*CLD.capR[0]*0.5,s=(rng()-0.5)*2*CLD.capR[1]*0.45,m=new THREE.Mesh(LUMP_GEO[i%LUMP_VAR],lumpMat);m.visible=false;m.rotation.y=-WIND_A;lumpGroup.add(m);
    lumpFixed.push({cap:C,x:C.x+WA0*a+WP0*s,z:C.z+WA1*a+WP1*s,rx:1100+rng()*500,rz:700+rng()*300,mesh:m});}}}
// the scan: the field on a grid of LUMP_CELL cells in its own frame about the camera; a cell above every neighbour and over the threshold is a cloud, keyed by its cell, so a
// lump keeps its cloud while the world drifts under the field. A maximum that hops a cell (the threshold moves with the cover) re-keys the lump beside it rather than replacing it
function lumpScan(){const K=SKY,ox=K.windOff[0],oz=K.windOff[1],cx=camera.position.x+ox,cz=camera.position.z+oz,S=LUMP_CELL,R=Math.ceil(LUMP_R/S),ci=Math.round(cx/S),cj=Math.round(cz/S),N=2*R+3;
  if(!lumpGrid||lumpGrid.length<N*N)lumpGrid=new Float32Array(N*N);const grid=lumpGrid,th0=cldTh0();
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const fx=(ci-R-1+i)*S,fz=(cj-R-1+j)*S;grid[j*N+i]=cldN(fx-ox,fz-oz,fx,fz,FZ0);}
  lumpSeen.clear();
  for(let j=1;j<N-1;j++)for(let i=1;i<N-1;i++){const n=grid[j*N+i];if(n<th0+LUMP_MIN)continue;let mx=true;for(let dj=-1;dj<=1&&mx;dj++)for(let di=-1;di<=1;di++)if((di||dj)&&grid[(j+dj)*N+i+di]>=n){mx=false;break;}if(!mx)continue;
    const gi=ci-R-1+i,gj=cj-R-1+j,fx=gi*S,fz=gj*S;if((fx-cx)*(fx-cx)+(fz-cz)*(fz-cz)>LUMP_R*LUMP_R)continue;const key=gi*73856093^gj*19349663;lumpSeen.add(key);
    let L=lumpByKey.get(key);
    if(!L){for(const M of lumps)if(M.alive&&!lumpSeen.has(M.key)&&Math.abs(M.fx-fx)<=S*1.5&&Math.abs(M.fz-fz)<=S*1.5){lumpByKey.delete(M.key);M.key=key;lumpByKey.set(key,M);L=M;break;}}
    if(!L){for(const M of lumps)if(!M.alive&&M.s<0.01){L=M;break;}if(!L)continue;L.alive=true;L.key=key;lumpByKey.set(key,L);lumpMeasure(L,fx,fz,ox,oz,th0);L.mesh.geometry=LUMP_GEO[(Math.abs(key)>>3)%LUMP_VAR];}
    L.alive=true;}
  for(const L of lumps)if(L.alive&&!lumpSeen.has(L.key)){L.alive=false;lumpByKey.delete(L.key);}}
function lumpMeasure(L,fx,fz,ox,oz,th0){ // the cloud's extent from its maximum: walked along and across the wind until the field drops under the threshold; the centre moved to the middle of each walk
  const W=[0,0,0,0],D=[[WA0,WA1],[-WA0,-WA1],[WP0,WP1],[-WP0,-WP1]];
  for(let d=0;d<4;d++){let k=1;for(;k<=LUMP_WALK;k++){const x=fx+D[d][0]*k*LUMP_STEP,z=fz+D[d][1]*k*LUMP_STEP;if(cldN(x-ox,z-oz,x,z,FZ0)<th0)break;}W[d]=(k-0.5)*LUMP_STEP;}
  const sa=(W[0]-W[1])*0.5,sc=(W[2]-W[3])*0.5;L.fx=fx+WA0*sa+WP0*sc;L.fz=fz+WA1*sa+WP1*sc;L.rx=Math.max(220,(W[0]+W[1])*0.5);L.rz=Math.max(220,(W[2]+W[3])*0.5);L.s=0;} // never under 220 m: a maximum right at the threshold measured as a 50 m sliver
function updateClouds(dt){const K=SKY;if(!lumpGroup){if(typeof hzScene==='undefined')return;lumpMake();}
  const above=wasAbove===true,on=FX.clouds&&FX.lumps&&above;lumpGroup.visible=on&&CLD_S.lump>0.01;
  CLD_S.lump+=((on?1:0)-CLD_S.lump)*(1-Math.exp(-4*dt)); // the deck's near fade follows the lumps in over a quarter second (the crossing eases the sky the same way)
  // the lumps' light: the deck's own colours (atmosphere.js cloudDeck: dayLit, nightLit, shdC)
  {const z=K.zen,h=K.hor,dL=CLD_S.deckL*0.9,ml=K.moonL/MOONL,d=K.dayK,r=K.rainA*0.5,lit=lumpLit,shd=lumpShd;
    for(let i=0;i<3;i++){const day=lerp(z[i]*2.2+h[i]*0.8,CLD_S.deckC[i]*1.3,dL),night=z[i]*1.6+h[i]*0.6+K.lumC[i]*ml*0.30;lit[i]=lerp(night,day,Math.max(d,CLD_S.deckL))*(1-0.35*K.rainA);shd[i]=lerp(lerp(z[i]*0.9+h[i]*0.2,z[i]*0.42+h[i]*0.36,d),h[i]*0.5,r)*(1-0.35*K.rainA);}
    LUMP_U.uLmpL.value.fromArray(lit);LUMP_U.uLmpS.value.fromArray(shd);LUMP_U.uLmpK.value.x=0.45*(1-clamp(K.lum.y*2.5,0,1))*CLD_S.deckL;}
  if(!on)return;
  lumpT-=dt;if(lumpT<=0){lumpT=LUMP_T;lumpScan();}
  const ox=K.windOff[0],oz=K.windOff[1],base=CLOUD_H*(1-0.35*K.rainA),e=1-Math.exp(-LUMP_EASE*dt),lumpK=CLD_S.lump;
  for(const L of lumps){L.s+=((L.alive?1:0)-L.s)*e;const m=L.mesh;if(L.s<0.01){m.visible=false;continue;}m.visible=true;
    const wx=L.fx-ox,wz=L.fz-oz,dx=wx-camera.position.x,dz=wz-camera.position.z,dd=Math.sqrt(dx*dx+dz*dz),far=1-smooth(CLD.near[0],CLD.near[1],dd); // past the deck's fade the lump shrinks away and the deck takes over
    const s=L.s*far*lumpK,sy=Math.min(0.9*Math.min(L.rx,L.rz),CLOUD_T);m.position.set(wx,base,wz);m.scale.set(L.rx*s,sy*s,L.rz*s);}
  for(const F of lumpFixed){const m=F.mesh,k=CLD_S.cap/CLD.capA*lumpK,dx=F.cap.x-camera.position.x,dz=F.cap.z-camera.position.z;if(k<0.02||dx*dx+dz*dz<LUMP_R*LUMP_R){m.visible=false;continue;}m.visible=true; // within the scan's reach the cap is the scan's
    m.position.set(F.x,CLOUD_H-150,F.z);m.scale.set(F.rx*k,Math.min(0.9*F.rz,CLOUD_T)*k,F.rz*k);}}
