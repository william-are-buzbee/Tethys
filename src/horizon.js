// horizon.js — the horizon tier (v11.64, ARCHIPELAGO step 3): what lies past the far plane, seen from above the water. The far layer ends at
// FAR (1600/1000) and to v11.63 the air's fog closed there (FOG_CUT), so the giant 18 km off could not exist for the eye. Now, with the camera
// in air, a second pass draws first — the sky dome, a sea disc from the surface mesh's edge to HZ_FAR, and one coarse mesh of every island's
// land and shallows (above HZ_CUT) sampled once from sample() at Q.hz metres — through a camera whose near plane sits at HZ_NEAR of the far
// plane, and the main pass draws over it with the depth cleared: everything nearer than the far plane is the world as it was, everything
// beyond is this. The planet's curvature is a vertex-shader drop of d²/2R from the camera's foot (PLANET: 1 g and nothing else, so R is
// Earth's): from the water the giant's shore at 18 km sits 25 m under the sea's curve and its summit stands 2.6° up; from 40 m the shore shows.
// The mesh and the disc are fogged by the same air as the world (scene.js fogAir: the mist's layers, then the haze toward the sky in the ray's
// direction) without the far cut, so at 18 km the giant is the haze's contrast (~7% on a clear day, gone under a shower); the world's air was
// made a trade-wind day for this (world.js AIR: visibility ~30 km, to v11.63 ~1 km, "a hazy coast" — the person's call, WATER.md P6). Under
// water nothing changes: the pass is skipped and the dome goes back to the main scene. Built on the first frame above the water (~0.3 s, behind
// the boot's fade) and kept; nothing streams. Not in the tests: the stub's renderer has no clear, so the pass never runs headless.
const HZ_NEAR=20,HZ_FAR=250000,HZ_CUT=-5,HZ_R=6371000,HZ_SEA0=0.75; // the pass's near plane (m — not the far plane: near-plane clipping is by view depth, so a plane at FAR cut the dome and anything off-axis to a 32° cone; the main pass overdraws whatever the horizon pass drew nearer than FAR, since its depth is cleared between; 20 rather than 5 for the depth's resolution at 18 km, ~1 m); its far plane; the ground under which no triangle is kept (a triangle stays if any corner is above it, so every shore quad stays; the sea disc covers the rest — at -60 the shallows under the disc fought it for the depth at 18 km and showed as specks on the line); the planet's radius; the sea disc's inner radius as a fraction of FAR (under the surface mesh's edge at 1.05)
const HZ_LIGHT=[0.62,1.15,1.0,0.85]; // the horizon mesh's light: the sky's ambient share (zenith over horizon by the normal's tilt), the sun's share by its cosine; the sea disc's water-column weight and its reflection's ceiling (the surface's 0.85) — tuned in the pane (v11.65) against the surface mesh's far end from 300 m up: with the column term at 1 the surface's own ceiling matches it to three levels of 255 (129,149,160 against 128,147,160); without the column the disc stood a shade lighter from any height
const hzScene=new THREE.Scene(),hzCam=new THREE.PerspectiveCamera(CAM_K.fov,innerWidth/innerHeight,HZ_NEAR,HZ_FAR);
let hzMesh=null,hzSea=null,hzTried=false;
// the shared fog and sky uniforms, the same objects the world's materials read (scene.js shares them through ShaderLib)
function hzUniforms(){const L=(THREE.ShaderLib&&THREE.ShaderLib.lambert&&THREE.ShaderLib.lambert.uniforms)||{},u={};for(const k of ['uFogC','uFogR','uFogW','uFogP','uFogS','uFogT','uFogA','uFogAC','uMist','uMistC','uMistW','uWaterMap','uFloorMap','uFogB','uFogTC','uSkA','uSkB','uSkC','uSkD','uSkE','uSkF'])if(L[k])u[k]=L[k];return u;}
const HZ_VS_HEAD='uniform vec3 uFogC;uniform mat3 uFogR;uniform vec4 uFogW;varying float vFogDepth;varying vec3 vFogPos;\n'; // the fog's vertex stage by hand: vFogPos is the dropped world position
const HZ_FS_HEAD='#define USE_FOG\n'+DITHER_PARS+'\n'; // then the chunk: fogAir, skyLite, the mist
function hzMat(vs,fs){return new THREE.ShaderMaterial({uniforms:hzUniforms(),vertexShader:vs,fragmentShader:fs,vertexColors:true,side:THREE.DoubleSide,fog:false});}
const HZ_TERRAIN_MAT=hzMat(HZ_VS_HEAD+'varying vec3 vCol;varying vec3 vN;void main(){vec3 p=position;vec2 dd=p.xz-uFogC.xz;p.y-=dot(dd,dd)*'+(0.5/HZ_R).toExponential(6)+';vec4 mv=modelViewMatrix*vec4(p,1.0);vFogDepth=length(mv.xyz);vFogPos=p;vCol=color;vN=normal;gl_Position=projectionMatrix*mv;}',
  HZ_FS_HEAD+THREE.ShaderChunk.fog_pars_fragment+'\nvarying vec3 vCol;varying vec3 vN;void main(){vec3 n=normalize(vN);float sd=max(dot(n,uSkE.xyz),0.0);vec3 amb=mix(uSkB.xyz,uSkA.xyz,0.5+0.5*n.y)*'+HZ_LIGHT[0].toFixed(3)+';vec3 col=vCol*(amb+uSkD.xyz*uSkA.w*sd*'+HZ_LIGHT[1].toFixed(3)+');'+
  'float d=vFogDepth;vec3 rd=(vFogPos-uFogC)/max(d,1e-3);col=fogAir(col,uFogC,rd,d,1.0);gl_FragColor=vec4(dithering(col),1.0);}'); // lit by the sky's own uniforms (the zenith and horizon as the ambient, the sun's colour by dayK), an approximation of the world's hemisphere and sun that the haze at 1.3 km hides
const HZ_SEA_U={value:new THREE.Vector4(HZ_LIGHT[3],HZ_LIGHT[2],1,0)}; // the disc's terms, live: the reflection's ceiling, the column's weight, the body's (tuned in the pane against the surface's far end, v11.65)
const HZ_SEA_MAT=hzMat(HZ_VS_HEAD+'void main(){vec4 wp=modelMatrix*vec4(position,1.0);vec2 dd=wp.xz-uFogC.xz;wp.y-=dot(dd,dd)*'+(0.5/HZ_R).toExponential(6)+';vec4 mv=viewMatrix*wp;vFogDepth=length(mv.xyz);vFogPos=wp.xyz;gl_Position=projectionMatrix*mv;}',
  HZ_FS_HEAD+THREE.ShaderChunk.fog_pars_fragment+'\nuniform vec4 uHzSea;void main(){float d=vFogDepth;vec3 rd=(vFogPos-uFogC)/max(d,1e-3);float cm=max(-rd.y,0.0);float R=pow(1.0-cm,3.0)*uHzSea.x;float a=0.22+R-0.22*R;vec3 Rw=reflect(rd,vec3(0.0,1.0,0.0));Rw.y=max(Rw.y,1e-3);Rw=normalize(Rw);float dl=mix(0.1,1.0,uSkA.w);'+
  'vec3 col=vec3(0.07,0.23,0.30)*dl*0.22*(1.0-R)*uHzSea.z+skyLite(Rw)*R+vec3(0.04,0.14,0.22)*dl*(1.0-a)*uHzSea.y;col=fogAir(col,uFogC,rd,d,1.0);gl_FragColor=vec4(dithering(col),1.0);}'); // the surface's topside rule at its far end (atmosphere.js SURF_MAT: the Fresnel weight on the mean normal, the sky reflected at R, the body at uBody 0.22 of the rest) and, since the surface is a transparent mesh whose alpha a = uBody+R-uBody·R leaves the rest of the pixel to the water column beneath, the column as a dark blue at (1-a): without it the disc stood a shade lighter than the surface's far end from any height (v11.65). At grazing R → the ceiling: the sky a few degrees up, darker than the horizon's band — the sea line
HZ_SEA_MAT.uniforms.uHzSea=HZ_SEA_U;
// the extent: the world's square with its apron, and every island record's land or rim with a margin
function hzExtent(){let x0=-HALF-2000,x1=HALF+2000,z0=-HALF-2000,z1=HALF+2000;for(const R of ISLANDS){const r=((R.land?R.land.r:R.rimR||0)+3000)*R.sc;x0=Math.min(x0,R.x-r);x1=Math.max(x1,R.x+r);z0=Math.min(z0,R.z-r);z1=Math.max(z1,R.z+r);}return [x0,x1,z0,z1];}
function hzBuild(){const E=hzExtent(),S=Q.hz,x0=E[0],z0=E[2],nx=Math.ceil((E[1]-x0)/S)+1,nz=Math.ceil((E[3]-z0)/S)+1,H=new Float32Array(nx*nz),F=new Float32Array(nx*nz*NF),f=new Float32Array(NF),t0=performance.now();
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const k=j*nx+i;H[k]=sample(x0+i*S,z0+j*S,f).h;F.set(f,k*NF);}
  const keep=new Int32Array(nx*nz).fill(-1),pos=[],col=[],nrm=[],idx=[],cT=new Float32Array(3);
  const use=(i,j)=>{const k=j*nx+i;if(keep[k]>=0)return keep[k];const x=x0+i*S,z=z0+j*S,h=H[k];
    const gx=(H[j*nx+Math.min(i+1,nx-1)]-H[j*nx+Math.max(i-1,0)])/(2*S),gz=(H[Math.min(j+1,nz-1)*nx+i]-H[Math.max(j-1,0)*nx+i])/(2*S),sl=Math.sqrt(gx*gx+gz*gz),L=Math.sqrt(gx*gx+1+gz*gz);
    terrainColor(x,z,h,fixF(F.subarray(k*NF,(k+1)*NF),sl),sl,cT,0);const n=pos.length/3;pos.push(x,h,z);col.push(cT[0],cT[1],cT[2]);nrm.push(-gx/L,1/L,-gz/L);keep[k]=n;return n;};
  for(let j=0;j<nz-1;j++)for(let i=0;i<nx-1;i++){const a=j*nx+i;if(H[a]<HZ_CUT&&H[a+1]<HZ_CUT&&H[a+nx]<HZ_CUT&&H[a+nx+1]<HZ_CUT)continue;const A=use(i,j),B=use(i+1,j),C=use(i,j+1),D=use(i+1,j+1);idx.push(A,C,B,B,C,D);} // a→b along +x, a→c along +z, the far layer's winding
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nrm,3));g.setIndex(idx);
  hzMesh=new THREE.Mesh(g,HZ_TERRAIN_MAT);hzMesh.frustumCulled=false;hzScene.add(hzMesh);
  // the sea disc: rings from HZ_SEA0·FAR to HZ_FAR, spaced by a power so the near rings are fine, about the camera each frame (the drop is the shader's)
  {const K=18,NS=96,r0=FAR*HZ_SEA0,p=[],c=[],ix=[];for(let k=0;k<=K;k++){const r=r0*Math.pow(HZ_FAR/r0,k/K);for(let s=0;s<NS;s++){const a=s/NS*TAU;p.push(Math.cos(a)*r,0,Math.sin(a)*r);c.push(1,1,1);}}
    for(let k=0;k<K;k++)for(let s=0;s<NS;s++){const a=k*NS+s,b=k*NS+(s+1)%NS,cc=a+NS,d=b+NS;ix.push(a,cc,b,b,cc,d);}
    const sgm=new THREE.BufferGeometry();sgm.setAttribute('position',new THREE.Float32BufferAttribute(p,3));sgm.setAttribute('color',new THREE.Float32BufferAttribute(c,3));sgm.setIndex(ix);hzSea=new THREE.Mesh(sgm,HZ_SEA_MAT);hzSea.frustumCulled=false;hzScene.add(hzSea);}
  console.log('horizon: '+nx+'×'+nz+' samples at '+S+' m, '+(pos.length/3)+' vertices, '+(idx.length/3)+' triangles, '+(performance.now()-t0).toFixed(0)+' ms');}
// the frame's render (main.js): above the water the horizon pass first, then the world over it with the depth cleared; below, the world alone
function renderFrame(){const above=wasAbove===true&&!!renderer.clearDepth;
  if(above&&!hzMesh&&!hzTried){hzTried=true;try{hzBuild();}catch(e){console.warn('the horizon tier could not build: '+e.message);}}
  if(above&&hzMesh){if(sky.parent!==hzScene)hzScene.add(sky);
    hzCam.position.copy(camera.position);hzCam.quaternion.copy(camera.quaternion);if(hzCam.fov!==camera.fov||hzCam.aspect!==camera.aspect){hzCam.fov=camera.fov;hzCam.aspect=camera.aspect;hzCam.updateProjectionMatrix();}hzCam.updateMatrixWorld();
    hzSea.position.set(camera.position.x,TIDE,camera.position.z);
    const bg=scene.background;hzScene.background=bg;scene.background=null; // three clears to a scene's background colour whatever autoClear says (WebGLBackground forces it), so the main pass takes none while the horizon pass is under it
    renderer.autoClear=false;renderer.clear();renderer.render(hzScene,hzCam);renderer.clearDepth();renderer.render(scene,camera);renderer.autoClear=true;scene.background=bg;}
  else{if(sky.parent!==scene)scene.add(sky);renderer.render(scene,camera);}}
