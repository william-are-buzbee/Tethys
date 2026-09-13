// atmosphere.js — the sea surface, the sky, marine snow, fog and light by medium/biome/depth, HUD
// ---------- the surface ----------
// One mesh, both faces. A non-uniform grid (dense under the camera, coarse far out) displaced in the vertex shader by the
// same wave sum the physics uses. Flat-shaded Phong so the facets catch the sun. The look is chosen by the *camera's medium*
// (uUnder), not by which face is in front (v8.3: until then the far slopes — front faces, seen from under water — wore the
// topside's sky Fresnel at 96% alpha, which painted the underwater horizon a pale sky-cyan no fog could reach). Since v11.5 the
// mesh writes depth, so a crest's front slope hides the slopes behind it, and a back face seen with the camera in air — the
// inside of a wave, from a camera in a trough looking through a crest — is drawn as the water body, opaque and dark, not as the
// far surface's underside in sky colour (the pale ceiling with a hard edge at the crest line that v11–v11.4 chased). Seen from above: teal, Fresnel toward the sky at grazing angles, foam at the crests. Seen from below: the
// facet normal is flipped so sunlight reads as coming through; inside Snell's window (the ~48° cone overhead) the sky
// comes through, bright, with a refracted glint where a facet bends the sun toward you (the window is widened to a soft
// 15–50° band so the upper third of the view stays lit as it always was); outside it the surface is a
// total-internal-reflection mirror of the water below, so it takes the veil's colour (fogColor, the veil at the camera)
// and the underwater horizon is one colour whether you look at the surface, the far floor or the dome. The mesh follows
// the camera, snapped to the finest spacing so the tessellation doesn't swim.
const SN=Q.surf,SR=FAR*1.05,SSTEP=SR*0.06*2/SN; // reaches past the far plane; ~1 unit between vertices under the camera (v11.4: was 2.1, which could not resolve the chop), ~50 at the edge
const sg=(function(){
  const n=SN+1,pos=new Float32Array(n*n*3),sp=new Float32Array(n*n),idx=[];
  const map=u=>SR*(0.06*u+0.94*u*u*u),dmap=u=>SR*(0.06+2.82*u*u)*(2/SN);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const u=-1+2*i/SN,v=-1+2*j/SN,k=j*n+i;pos[k*3]=map(u);pos[k*3+1]=0;pos[k*3+2]=map(v);sp[k]=Math.max(dmap(u),dmap(v));}
  for(let j=0;j<SN;j++)for(let i=0;i<SN;i++){const a=j*n+i,b=a+1,c=a+n,d=c+1;idx.push(a,c,b,b,c,d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aSpace',new THREE.BufferAttribute(sp,1));g.setIndex(idx);return g;
})();
const surfaceU={uAmp:{value:WAVE_AMP},uDf:{value:1},uUnder:{value:1},uSkyR:{value:new THREE.Vector3(0.62,0.76,0.86)},uWin:{value:new THREE.Vector3(1,1,1)},uGlint:{value:new THREE.Vector3(1.0,0.97,0.88)},uRain:{value:0}};
// uDf: how much daylight reaches the player's depth (× the sky's light since v11); uUnder: 1 when the camera is under water; uSkyR: the sky the
// top face reflects at grazing angles (the sky's own colour now, so a sunset lies on the water); uWin: Snell's window's light relative to noon;
// uGlint: the sun's (or the moon's) colour for the refracted glint; uRain: rain 0..1 — bright specks where drops hit the water
const SURF_MAT=(function(){
  // The topside Fresnel (cm) is judged against the mean surface (vNup, up), not the facet, since v11.7: at grazing a facet's small tilt
  // swung it from 0.7 to 0.9 and the foreshortened grid read as tennis-court wedges from just above the water; the facet still lights the
  // diffuse, the specular and the glint. The underside's window (cv) stays per facet: each facet flipping between the bright window and
  // the mirror is what makes the surface from below read as moving water (v11.7's first cut smoothed it too, and the person missed it).
  const m=new THREE.MeshPhongMaterial({color:0x123a4c,specular:0x8a8a8a,shininess:90,emissive:0x081820,transparent:true,opacity:0.66,side:THREE.DoubleSide,flatShading:true,depthWrite:true}); // depth is written since v11.5: a crest's front slope hides the slopes behind it (from a low camera the far waves' back slopes are back faces, and they were drawn over the front ones in index order)
  m.onBeforeCompile=function(sh){
    sh.uniforms.uTime=timeU;sh.uniforms.uChop=chopU;sh.uniforms.uAmp=surfaceU.uAmp;sh.uniforms.uDf=surfaceU.uDf;sh.uniforms.uUnder=surfaceU.uUnder;sh.uniforms.uSkyR=surfaceU.uSkyR;sh.uniforms.uWin=surfaceU.uWin;sh.uniforms.uGlint=surfaceU.uGlint;sh.uniforms.uRain=surfaceU.uRain;
    sh.vertexShader='uniform float uTime;attribute float aSpace;varying float vH;varying vec2 vWp;varying vec3 vNup;\n'+WAVE_GLSL+sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n{vWp=transformed.xz+modelMatrix[3].xz;float hh=waveH(vWp,uTime,aSpace);transformed.y+=hh;vH=hh;vNup=normalMatrix*vec3(0.0,1.0,0.0);}'); // vNup: the mean surface's normal (up) in view space — the Fresnel and the window are judged against it, not the facet (v11.6)
    sh.fragmentShader='uniform float uTime;uniform float uAmp;uniform float uDf;uniform float uUnder;uniform vec3 uSkyR;uniform vec3 uWin;uniform vec3 uGlint;uniform float uRain;varying float vH;varying vec2 vWp;varying vec3 vNup;float snell=1.0;float cv2=1.0;\n'+sh.fragmentShader
      .replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\n{vec3 V=normalize(vViewPosition);float cv=abs(dot(V,normal)),cm=abs(dot(V,normalize(vNup)));cv2=cv;'+
        'if(uUnder<0.5){if(!gl_FrontFacing){diffuseColor.rgb=vec3(0.0);diffuseColor.a=1.0;specularStrength=0.0;totalEmissiveRadiance=vec3(0.05,0.20,0.34)*uWin;}'+ // seen from the water's side with the camera in air — through a crest from a trough — this is the water itself: opaque, dark, unlit (v11.5)
        'else{float fr=pow(1.0-cm,3.0),fm=smoothstep(0.62,0.98,vH/uAmp)*0.85,k=fr*0.85*(1.0-fm);diffuseColor.rgb=mix(diffuseColor.rgb*(1.0-k),vec3(0.88,0.92,0.92),fm);totalEmissiveRadiance=totalEmissiveRadiance*uWin+uSkyR*k;diffuseColor.a=mix(diffuseColor.a,1.0,fr);'+ // the reflected sky is emissive (a reflection is not lit by the sun) and the surface is opaque at grazing angles (v11.3)
        'if(uRain>0.0){float rd=length(vViewPosition),rk=uRain*(1.0-smoothstep(10.0,34.0,rd));specularStrength*=1.0-0.6*uRain;'+ // rain: the surface goes matte
        'if(rk>0.001){vec2 cw=vWp*1.25,ci=floor(cw),cf=cw-ci-0.5;vec3 h=fract(sin(vec3(dot(ci,vec2(127.1,311.7)),dot(ci,vec2(269.5,183.3)),dot(ci,vec2(419.2,371.9))))*43758.5);'+
        'float ph=fract(uTime*0.9+h.x),on=step(fract(h.x*7.3),0.3+0.6*uRain);vec2 o=(h.yz-0.5)*0.36;float dd=length(cf-o)*0.8,rr=ph*0.34;'+
        'float ring=(1.0-smoothstep(0.0,0.045,abs(dd-rr)))*(1.0-ph)*(1.0-ph),dot0=(1.0-smoothstep(0.0,0.05,dd))*(1.0-smoothstep(0.0,0.15,ph));'+
        'diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.80,0.86,0.88),(ring*0.55+dot0)*on*rk);}}}}'+ // a drop's ring (v11.18): per 0.8 m cell a splash then a ring growing out and fading over 1.1 s, within ~30 m; it was a bright 0.67 m square per cell for a frame
        'else{normal=-normal;snell=smoothstep(0.25,0.65,cv);diffuseColor.rgb=vec3(0.22,0.46,0.56)*snell;diffuseColor.a=mix(0.74,0.62,snell);}}')
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nif(uUnder>0.5)totalEmissiveRadiance=mix(fogColor*0.9,vec3(0.16,0.34,0.42)*uWin*(0.35+0.65*uDf),snell);')
      .replace('#include <lights_fragment_end>','#include <lights_fragment_end>\nif(uUnder>0.5){vec3 L=directionalLights[0].direction;vec3 V=normalize(vViewPosition);vec3 T=refract(-V,-normal,1.25);float g=pow(saturate(dot(T,L)),40.0)*smoothstep(0.60,0.72,cv2);reflectedLight.directSpecular+=uGlint*g*1.5*snell;}');
  };
  m.customProgramCacheKey=function(){return 'surf';};
  return m;
})();
const surface=new THREE.Mesh(sg,SURF_MAT);surface.frustumCulled=false;scene.add(surface);
function updateSurface(){surface.position.set(Math.round(camera.position.x/SSTEP)*SSTEP,TIDE,Math.round(camera.position.z/SSTEP)*SSTEP);} // the mesh rides the tide; the shader adds the waves
// ---------- the sky (v11) ----------
// The sky's state this frame, from the clock (world.js: the sun's and the moon's hour angles, the moon's phase, the weather) —
// read by the dome shader, the lights, the fog, the surface and the readout. Nothing here is a place: the whole world sees one sky.
const SKY={sun:V3(0,1,0),moon:V3(0,-1,0),lum:V3(0,1,0),sunAlt:1,moonAlt:-1,illum:1,dayK:1,moonUp:0,moonL:0,skyL:1,skyLw:1,sunL:1,lumL:1,lumLw:1,night:0,cover:0,rain:0,rainA:0,
  zen:[0,0,0],hor:[0,0,0],glow:[0,0,0],sunC:[1,1,1],lumC:[1,1,1],tint:[1,1,1],bow:0,wind:[0,0],windOff:[0,0],starT:0,
  cirrus:0,upperOff:[0,0],cirrC:[1,1,1],plan:PLANETS.map(()=>V3(0,1,0)),spray:0,windK:1,eclS:0,eclL:0,vog:0,dawn:0,lag:0}; // v11.17: the cirrus cover, the upper wind's drift, the cirrus' colour (sunlit after sunset), the planets' directions, the surf's spray at the camera
const WX={},cirrTmp=[0,0,0];
function skyLerp(out,keys,idx,s){let a=keys[0],b=keys[keys.length-1];for(let i=1;i<keys.length;i++)if(s<=keys[i][0]){a=keys[i-1];b=keys[i];break;}
  const u=clamp((s-a[0])/(b[0]-a[0]),0,1),ca=a[idx],cb=b[idx];out[0]=lerp(ca[0],cb[0],u);out[1]=lerp(ca[1],cb[1],u);out[2]=lerp(ca[2],cb[2],u);return out;}
function updateSky(dt){const K=SKY;
  skyDir(sunHA(clockH),K.sun);skyDir(moonHA(clockH),K.moon);K.sunAlt=K.sun.y;K.moonAlt=K.moon.y;K.illum=0.5*(1-K.sun.dot(K.moon)); // the lit fraction from the geometry (v11.17.1; moonIllum(h) was a cosine on the hour, an hour out of step with the conjunctions)
  weatherAt(clockH,WX);K.cover=WX.cover;K.rain=WX.rain;K.rainA+=(K.rain-K.rainA)*(1-Math.exp(-0.5*dt)); // a shower arrives over a few seconds
  K.cirrus=WX.cirrus;K.upperOff[0]+=Math.cos(UPPER_A)*UPPER_U*dt;K.upperOff[1]+=Math.sin(UPPER_A)*UPPER_U*dt; // the cirrus streams on the upper wind, real time
  for(let i=0;i<PLANETS.length;i++)skyDir(sunHA(clockH)-PLANETS[i][0]*Math.PI/180,K.plan[i]); // the wanderers on the sun's track
  // daylight at the surface as a fraction of noon's: the sun's disc is a fiftieth as bright on the horizon, the sky a tenth — in a
  // renderer without exposure the look is what counts: dusk clearly lit and warm at ~0.22, gone by six degrees under
  K.dayK=smooth(-0.12,0.05,K.sunAlt)*0.28+smooth(0,0.4,K.sunAlt)*0.72;
  // the eclipses (v11.17.1; world.js UMBRA_R): the sun's disc covered by the moon's, and the moon's disc in the planet's shadow
  K.eclS=discOverlap(Math.acos(clamp(K.sun.dot(K.moon),-1,1)),SUN_R,MOON_R);K.eclL=discOverlap(Math.acos(clamp(-K.sun.dot(K.moon),-1,1)),MOON_R,UMBRA_R);
  K.dayK*=1-0.97*K.eclS; // totality is deep twilight: the light, the sky's colours below and the stars follow
  K.windK=WX.wind;
  K.moonUp=smooth(-0.05,0.25,K.moonAlt);K.moonL=MOONL*K.moonUp*Math.pow(K.illum,1.8)*(1-0.97*K.eclL); // a half moon gives a tenth of a full one's light; an eclipsed moon almost none
  const shade=1-0.30*K.cover-0.20*K.rain; // cloud takes what it takes from the whole sky (v11.18: a shower leaves ~0.52 of noon; it left 0.24, under a full-moon night's 0.31 — 'much worse than nighttime'. The beam still dies under it, below)
  K.sunL=K.dayK*(1-0.85*Math.pow(K.cover,1.5))*(1-0.7*K.rain); // the direct beam: gone under a shower
  K.skyL=K.dayK*shade+(1-K.dayK)*(K.moonL*(1-0.7*K.cover)+STARL);
  // the water's light (v11.23): the sea is lit by the whole sky's downwelling light, and an overcast sky is still a sky — cloud takes
  // its share of the *beam* (the caustics, the shafts, the shadows die with sunL) but little of the diffuse light the water sees; and
  // the renderer has no exposure, so the look is what counts (the person: a shower under water was 'extremely dark'). skyLw is what
  // everything under the water scales by (the veil, the ambient, the depth's daylight); skyL stays the air's and the surface's from above.
  K.skyLw=K.dayK*(1-0.12*K.cover-0.08*K.rain)+(1-K.dayK)*(K.moonL*(1-0.4*K.cover)+STARL);
  skyLerp(K.zen,SKYC,1,K.sunAlt);skyLerp(K.hor,SKYC,2,K.sunAlt);skyLerp(K.glow,SKYC,3,K.sunAlt);skyLerp(K.sunC,SKYC,4,K.sunAlt);
  const ml=K.moonL/MOONL*(1-K.dayK); // the moonlit sky: a little brighter and blue
  for(let i=0;i<3;i++){K.zen[i]+=[0.030,0.045,0.080][i]*ml;K.hor[i]+=[0.050,0.060,0.090][i]*ml;}
  const gk=clamp(0.55*K.cover+0.5*K.rain,0,1),gl=K.dayK+ml*0.3; // overcast: toward grey by day, darker by night
  for(let i=0;i<3;i++){K.zen[i]=lerp(K.zen[i],GREYC[i]*0.85*gl+K.zen[i]*0.15,gk*K.dayK)*(1-0.5*gk*(1-K.dayK));K.hor[i]=lerp(K.hor[i],GREYC[i]*1.15*gl+K.hor[i]*0.15,gk*K.dayK)*(1-0.5*gk*(1-K.dayK));K.glow[i]*=1-0.8*gk;}
  // the luminary: the one directional light is the sun by day and the moon by night — whichever gives more
  const sunP=K.sunL,moonP=K.moonL*(1-0.8*Math.pow(K.cover,1.5))*(1-0.7*K.rain);
  if(sunP>=moonP){K.lum.copy(K.sun);K.lumL=sunP;for(let i=0;i<3;i++)K.lumC[i]=K.sunC[i];}else{K.lum.copy(K.moon);K.lumL=moonP;for(let i=0;i<3;i++)K.lumC[i]=MOONC[i];}
  K.lumLw=Math.max(K.lumL,0.6*K.dayK*(1-0.12*K.cover-0.08*K.rain)); // the key light under water when the beam is gone: the overcast sky's diffuse light from above (scene.js updateShadow raises the key to the zenith as the beam dies)
  // the light's colour relative to noon, for everything that scales a noon look: warm at dusk, blue-grey by moonlight, grey under rain
  for(let i=0;i<3;i++){const w=K.dayK*(1-0.6*gk);K.tint[i]=(K.sunC[i]/SKYC[4][4][i]*w+MOONC[i]*(1-K.dayK)+[0.9,0.92,0.95][i]*K.dayK*0.6*gk)/(w+(1-K.dayK)+K.dayK*0.6*gk);}
  K.night=Math.max(smooth(-0.02,-0.14,K.sunAlt),0.8*smooth(0.93,1.0,K.eclS))*(1-0.55*K.moonUp*K.illum*(1-K.eclL))*(1-0.9*gk); // how much the stars show: from the sun a degree under to eight (civil twilight's end), washed by the moon and hidden by cloud (v11.17: it was (1-dayK)², which had stars out at sunset with the sun still up)
  K.bow=K.rainA*K.sunL*smooth(0.66,0.35,K.sunAlt)*smooth(0.0,0.04,K.sunAlt); // a bow needs sun behind you and rain in front; below 42° or there is no bow above the horizon
  {const u=WIND_U*(0.15+0.85*K.windK)*(1+0.8*K.rainA);K.wind[0]=Math.cos(WIND_A)*u;K.wind[1]=Math.sin(WIND_A)*u;} // a calm leaves a breath of the trades
  K.windOff[0]+=K.wind[0]*dt;K.windOff[1]+=K.wind[1]*dt; // the clouds' drift, real time
  K.starT=sunHA(clockH); // the stars turn with the sun (no year is decided: the same stars every night)
  // the cirrus' colour: at CIRRUS_H it stays in the sun until the sun is ~3 degrees under the horizon (the depression for 9.5 km),
  // lit then by the reddened light of a sun that low — the pink after sunset — and by day a white a touch warmer than the sky; unlit it
  // is the night sky's grey, moonlit a little
  {const dep=Math.sqrt(2*CIRRUS_H/6.371e6),cl=smooth(-dep-0.02,-dep+0.02,K.sunAlt),lc=skyLerp(cirrTmp,SKYC,4,K.sunAlt+dep);
    for(let i=0;i<3;i++){const lit=lc[i]*0.78+K.zen[i]*0.30+0.06,nt=K.zen[i]*0.9+K.hor[i]*0.35+MOONC[i]*K.moonL*0.5;K.cirrC[i]=lerp(nt,lit,cl)*(1-0.55*gk);}}
  FOG_T[0]=K.skyL;FOG_T[1]=K.tint[0];FOG_T[2]=K.tint[1];FOG_T[3]=K.tint[2];
  FOG_S[0]=K.lum.x;FOG_S[1]=K.lum.y;FOG_S[2]=K.lum.z;FOG_S[3]=SEA_FOG.sun*clamp(K.lumL/Math.max(K.skyL,0.02),0,1.2); // the veil's glow toward the light: the beam's share of the sky's light
  sun.position.copy(K.lum).multiplyScalar(100);sun.color.setRGB(K.lumC[0],K.lumC[1],K.lumC[2]);
  // the sun under water (v11.13, scene.js SUN_W): the luminary refracted at the surface (sin θw = sin θa / 1.33: never flatter than 48°
  // from the vertical), and the beam's share of the light — the caustics and the shadows scale by it: nothing under cloud or rain,
  // little from a low sun (a grazing beam mostly reflects), a full moon's share under a clear sky, a crescent's not
  {const L=K.lum,ly=L.y;if(ly>0.01){const sa=Math.sqrt(Math.max(0,1-ly*ly))/1.33,cwr=Math.sqrt(1-sa*sa),hl=Math.max(Math.hypot(L.x,L.z),1e-6);SUN_W[0]=L.x/hl*sa;SUN_W[1]=cwr;SUN_W[2]=L.z/hl*sa;}else{SUN_W[0]=0;SUN_W[1]=1;SUN_W[2]=0;}
    SUN_W[3]=clamp(K.lumL/Math.max(K.skyL,0.02),0,1)*smooth(0.03,0.3,ly)*clamp(K.lumL*3,0,1);}
}
// One dome that follows the camera, shown only when the camera is above water, and one shader that is the whole sky (v11.17 rewrote
// most of it; DESIGN, The sky). In order: the gradient (horizon = the air fog's colour, zenith above, brightest toward the sun and
// darkest 90° from it as a Rayleigh sky is, with a broad aureole round the sun from the haze); the glow round a low sun; the stars —
// two hashed grids in the sky's own frame (a 3D cell grid on the unit sphere, so a star is the same round dot everywhere: the old
// azimuth/elevation grid drew them as radial dashes near the pole and the zenith), a band of a galaxy with a dark lane, hidden by
// day and washed by the moon; the wanderers (PLANETS: steady, untwinkling, on the sun's track, out in the twilight before the stars);
// the moon — a sphere lit by the sun's actual direction, so the phase is geometry, with the planet's own light on its dark side and
// mare-like patches; the sun's disc; the cirrus (a streaked field at CIRRUS_H moving on the upper wind, thin, sunlit pink after
// sunset); the cumulus — a deck between CLOUD_H and CLOUD_H+CLOUD_T marched in Q.cloud slices, each the view ray projected onto its
// plane (so the clouds foreshorten to the horizon like a real deck and slide with the camera) and thresholded from one value noise
// by the cover, the threshold rising with height so a cloud is widest at its flat base and domed on top where the noise peaks —
// the slices composite base first, and where the base is thin (an edge, or seen low from the side) the lit upper slices show through:
// the sides and tops of the trade cumulus, from below, without a volume; each slice lit in three flat steps by sampling the field
// toward the light (the lit edge faces the sun) and by its height (tops lit, bases shaded), cores darker, fogged toward the horizon
// haze by their distance; under a shower the base drops, the deck thickens and ragged scud drifts under it; then the boundary-layer
// haze (MIST_GLSL mistFar: the same layer every fragment in air integrates, here to infinity — the horizon's white band, glowing
// toward the light), the sun's glare, and the bow. The moon's disc, the stars and the planets only pay for pixels near them.
const skyU={uZen:{value:new THREE.Vector3()},uHor:{value:new THREE.Vector3()},uGlow:{value:new THREE.Vector3()},uSunC:{value:new THREE.Vector3()},uLumC:{value:new THREE.Vector3()},uCirrC:{value:new THREE.Vector3()},
  uSun:{value:new THREE.Vector3()},uMoon:{value:new THREE.Vector3()},uLum:{value:new THREE.Vector3()},uCam:{value:new THREE.Vector3()},uWind:{value:new THREE.Vector2()},uUpper:{value:new THREE.Vector2()},
  uDay:{value:1},uNight:{value:0},uCover:{value:0},uRain:{value:0},uMoonL:{value:0},uLumL:{value:1},uStarT:{value:0},uTime:timeU,uBow:{value:0},uCloudH:{value:CLOUD_H},uCloudT:{value:CLOUD_T},uCirrusH:{value:CIRRUS_H},uCirr:{value:0},uCamH:{value:0},uEclS:{value:0},uEclL:{value:0},uFxCloud:{value:1},
  uMist:{value:MIST_P},uMistC:{value:MIST_C},uMistW:{value:MIST_W},uPlanD:{value:new Float32Array(9)},uPlanC:{value:new Float32Array(PLANETS.map(p=>[p[1][0],p[1][1],p[1][2],p[2]]).flat())}};
const SKY_VS='varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
const SKY_FS=[DITHER_PARS,'uniform vec3 uZen,uHor,uGlow,uSunC,uLumC,uCirrC,uSun,uMoon,uLum,uCam;uniform vec2 uWind,uUpper;uniform float uDay,uNight,uCover,uRain,uMoonL,uLumL,uStarT,uTime,uBow,uCloudH,uCloudT,uCirrusH,uCirr,uCamH,uEclS,uEclL,uFxCloud;',
  'uniform vec4 uMist,uMistC,uMistW;uniform vec3 uPlanD[3];uniform vec4 uPlanC[3];varying vec3 vDir;',
  MIST_GLSL,
  'float h21(vec2 p){p=fract(p*vec2(233.34,851.73));p+=dot(p,p+23.45);return fract(p.x*p.y);}',
  'float h31(vec3 p){return h21(vec2(dot(p,vec3(1.0,57.0,113.0)),dot(p,vec3(7.7,13.3,31.1))));}',
  'float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);float a=h21(i),b=h21(i+vec2(1.0,0.0)),c=h21(i+vec2(0.0,1.0)),d=h21(i+vec2(1.0,1.0));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}',
  'float fbm(vec2 p){float s=0.0,a=0.5;for(int i=0;i<4;i++){s+=a*vn(p);p=p*2.07+vec2(17.3,9.1);a*=0.5;}return s*1.0667;}',
  'vec3 rotAx(vec3 v,vec3 ax,float a){float c=cos(a),s=sin(a);return v*c+cross(ax,v)*s+ax*dot(ax,v)*(1.0-c);}',
  // a star: the cell of a 3D grid over the unit sphere holds one at a hashed point, its angular size by its brightness (the chord
  // is the angle at these sizes), a core and a faint halo on the brightest, a twinkle, a tint by hash
  'float star(vec3 s,float N,float thr,float sz,inout vec3 c){vec3 i=floor(s*N);float h=h31(i);if(h<thr)return 0.0;',
  '  vec3 o=vec3(h31(i+7.1),h31(i+3.3),h31(i+5.9))*0.6+0.2;vec3 q=normalize((i+o)/N);float br=(h-thr)/(1.0-thr);float r=sz*(0.5+br);float dd=length(s-q);',
  '  float tw=0.8+0.2*sin(uTime*(2.0+5.0*h31(i+1.7))+h31(i+2.9)*6.28);float v=(1.0-smoothstep(r*0.35,r,dd))*tw*(0.3+0.7*br)+br*br*0.10*exp(-dd*dd/(r*r*12.0));',
  '  float hc=h31(i+4.4);c=hc<0.14?vec3(0.72,0.82,1.0):(hc<0.34?vec3(1.0,0.84,0.66):vec3(1.0));return v;}',
  'void main(){vec3 d=normalize(vDir);float up=d.y;float cs=dot(d,uSun);',
  // the gradient: horizon to zenith, brightest toward the sun and darkest 90 degrees from it, a broad haze aureole round the sun
  '  float k=smoothstep(-0.04,0.55,up);vec3 col=mix(uHor,uZen,k)*(0.92+0.10*cs*cs);',
  '  col+=(uSunC*0.55+uHor*0.45)*0.17*pow(max(cs,0.0),6.0)*uDay*(1.4-0.6*k);',
  '  vec2 dxz=normalize(d.xz+vec2(1e-4,0.0)),sxz=normalize(uSun.xz+vec2(1e-4,0.0));float hz=pow(1.0-clamp(up,0.0,1.0),4.0);',
  '  col+=uGlow*pow(max(dot(dxz,sxz),0.0),3.0)*hz;',
  // the stars, in the frame that turns with the sky (the pole LAT above the north horizon); the galaxy a band with a dark lane
  '  if(uNight>0.002&&up>-0.02){vec3 ax=vec3(0.0,'+Math.sin(LAT).toFixed(4)+','+(-Math.cos(LAT)).toFixed(4)+');vec3 s=rotAx(d,ax,uStarT);',
  '    vec3 bn=normalize(vec3(0.3,0.55,0.78));vec3 bu=normalize(cross(bn,vec3(0.0,1.0,0.0)));vec3 bv=cross(bn,bu);float bx=dot(s,bn);float al=atan(dot(s,bv),dot(s,bu));',
  '    float mw=exp(-bx*bx*34.0)*(0.5+1.0*fbm(vec2(al*2.2,bx*9.0)+vec2(3.1,0.0)))*(1.0-0.6*exp(-pow((bx+0.03)*55.0,2.0))*smoothstep(0.3,0.6,fbm(vec2(al*4.0,7.0))));',
  '    vec3 c1=vec3(1.0),c2=vec3(1.0);float v=star(s,16.0,0.66-0.15*mw,0.0016,c1);vec3 sc=c1*v;v=star(s+vec3(0.37,0.11,0.53),44.0,0.74-0.28*mw,0.0012,c2)*0.7;sc+=c2*v;',
  '    col+=(sc+vec3(0.085,0.095,0.135)*mw)*uNight*smoothstep(-0.02,0.12,up);}',
  // the wanderers: steady points on the sun's track, out in the twilight, gone low in the haze
  '  float pl=smoothstep(0.30,0.10,uDay)*smoothstep(0.0,0.10,up);if(pl>0.001){for(int i=0;i<3;i++){float dd=length(d-uPlanD[i]);if(dd<0.02){float v=(1.0-smoothstep(0.0009,0.0022,dd))*uPlanC[i].w+0.10*uPlanC[i].w*exp(-dd*dd/2.0e-5);col+=uPlanC[i].rgb*v*pl;}}}',
  // the moon: a sphere lit by the sun, with the planet's light on its night side
  '  float cm=dot(d,uMoon);float mm=0.0;',
  '  if(cm>'+Math.cos(MOON_R*1.3).toFixed(6)+'){vec3 e1=normalize(cross(uMoon,vec3(0.01,1.0,0.0)));vec3 e2=cross(uMoon,e1);vec2 q=vec2(dot(d,e1),dot(d,e2))*'+(1/Math.sin(MOON_R)).toFixed(3)+';float r2=dot(q,q);',
  '    if(r2<1.0){float nz=sqrt(1.0-r2);vec3 n=e1*q.x+e2*q.y-uMoon*nz;float lit=smoothstep(-0.02,0.14,dot(n,uSun));',
  '      float alb=0.72+0.28*fbm(q*3.1+vec2(4.2,1.7));alb=mix(alb,0.5,smoothstep(0.52,0.66,fbm(q*1.6+vec2(9.0,3.0))));',
  '      vec3 mc=vec3(1.05,1.0,0.92)*alb*lit+vec3(0.30,0.42,0.60)*0.10*nz*alb*(1.0-lit);mc=mix(mc,vec3(0.55,0.16,0.06)*alb*0.5,uEclL); // in the planet\'s shadow the moon is lit by every sunset on the planet at once: red',
  '      float ma=(1.0-smoothstep(0.90,1.0,r2))*max(mix(1.0,lit*0.7,uDay),step(0.001,uEclS));mm=ma*step(0.001,uEclS);col=mix(col,mix(mc,col,0.35*uDay*(1.0-mm)),ma);}}',
  '  col+=vec3(0.80,0.85,0.95)*0.22*uMoonL*(1.0-uDay)*exp(-(1.0-cm)*2600.0); // the moon\'s halo: its light forward-scattered by the haze',
  // the sun: its disc, then the clouds over it, then the glare that spills round them
  
  // the cirrus: a thin streaked field high up, stretched along the upper wind, seen through the deck below it
  '  if(uCirr>0.002&&up>0.012){vec2 cq=uCam.xz+d.xz*(uCirrusH/up)+uUpper;vec2 ua=vec2('+Math.cos(UPPER_A).toFixed(4)+','+Math.sin(UPPER_A).toFixed(4)+');vec2 cp=vec2(dot(cq,ua),dot(cq,vec2(-ua.y,ua.x)))*vec2(1.0/7000.0,1.0/1600.0);',
  '    float n=fbm(cp)*0.72+0.28*fbm(cp*vec2(1.0,3.5)+vec2(2.3,7.1));float th=0.80-0.22*uCirr;float cv=smoothstep(th,th+0.18,n)*0.45*smoothstep(0.012,0.09,up);col=mix(col,uCirrC,cv);}',
  // the cumulus deck, marched base to top
  '  float ca=0.0;',
  '  if(up>0.004&&uFxCloud>0.5){float hf=smoothstep(0.004,0.05,up);float th=0.78-0.50*uCover;vec2 lxz=normalize(uLum.xz+vec2(1e-4,0.0))*0.11;',
  '    vec3 dayLit=mix(uZen*2.2+uHor*0.8,uLumC*1.3,clamp(uLumL*3.0,0.0,0.9)),nightLit=uZen*1.6+uHor*0.6+uLumC*uMoonL*0.30;vec3 litC=mix(nightLit,dayLit,uDay);',
  '    vec3 shdC=mix(mix(uZen*0.9+uHor*0.2,uZen*0.6+uHor*0.45,uDay),uHor*0.5,uRain*0.5);float accA=0.0;vec3 accC=vec3(0.0);',
  '    float T=min(uCloudT,up*800.0);for(int i=0;i<'+Q.cloud+';i++){float fz=(float(i)+0.5)/'+Q.cloud.toFixed(1)+';float ds=(uCloudH+T*fz)/max(up,0.02);vec2 p=(uCam.xz+d.xz*ds+uWind)*(1.0/1250.0);float n=fbm(p);float thi=th+0.30*fz*fz;float c=smoothstep(thi,thi+0.08,n);',
  '      if(c>0.003){float n2=fbm(p+lxz);float lit=clamp((n-n2)*7.0+0.30+0.45*fz,0.0,1.0);lit=floor(lit*3.0+0.5)/3.0;float core=smoothstep(th+0.12,th+0.40,n)*(0.45-0.30*fz);',
  '        vec3 ci=mix(shdC,litC,lit)*(1.0-core)*(1.0-0.35*uRain);accC+=(1.0-accA)*c*ci;accA+=(1.0-accA)*c;}if(accA>0.995)break;}',
  // scud under a shower: ragged low fragments in front of the deck
  '    if(uRain>0.02){float ds=uCloudH*0.45/max(up,0.02);vec2 p=(uCam.xz+d.xz*ds+uWind*1.4)*(1.0/380.0);float n=fbm(p);float c=smoothstep(0.66,0.80,n)*uRain;vec3 sc=shdC*0.8;accC=accC*(1.0-c)+sc*c;accA=accA*(1.0-c)+c;}',
  '    ca=accA*hf;if(ca>0.001){vec3 cc=accC/max(accA,1e-3);float fk=1.0-exp(-(uCloudH/max(up,0.02))/9000.0);cc=mix(cc,uHor,fk*0.85);col=mix(col,cc,ca);}}',
  // the boundary layer seen edge on: the marine haze (and the spray) to infinity, whitening the lowest degrees and glowing toward the light
  '  float hm=1.0-exp(-mistFar(uCamH,up));{vec3 hc=uMistC.rgb*(1.0+uMistC.w*pow(max(dot(d,uLum),0.0),6.0));col=mix(col,hc,hm);}',
  // the sun's disc, over the haze (a low sun through haze is still a disc, dimmed and reddened by it) and under the clouds
  '  float disc=smoothstep('+Math.cos(SUN_R*1.3).toFixed(6)+','+Math.cos(SUN_R*0.85).toFixed(6)+',cs)*uDay*(1.0-ca);col=mix(col,uSunC*mix(1.6,1.0,hm),disc*(1.0-mm));col+=uSunC*0.6*exp(-(1.0-cs)*9000.0)*smoothstep(0.9,1.0,uEclS)*(1.0-mm); // the moon over the sun; the corona in totality',
  '  col+=uSunC*(pow(max(cs,0.0),300.0)*0.7+pow(max(cs,0.0),10.0)*0.13)*uDay*(1.0-0.85*ca)*(1.0-0.6*hm);', // the glare, less through the haze (the disc has to read at the horizon)
  // the bow: 42 degrees from the point opposite the sun, violet inside to red outside, and the fainter reversed one at 51
  '  if(uBow>0.002&&up>-0.02){float ang=acos(clamp(dot(d,-uSun),-1.0,1.0));float x=(ang-0.7243)/0.0157;float x2=(0.9076-ang)/0.0175;',
  '    float w=1.0-smoothstep(0.8,1.0,abs(x)),w2=(1.0-smoothstep(0.8,1.0,abs(x2)))*0.35;float xx=w>w2?x:x2;float ww=max(w,w2);',
  '    vec3 rb=vec3(smoothstep(-0.25,0.65,xx),1.0-min(abs(xx)*1.3,1.0),1.0-smoothstep(-0.6,0.35,xx));col+=rb*0.30*ww*uBow*smoothstep(-0.02,0.1,up)*(1.0-0.6*ca);}',
  '  gl_FragColor=vec4(dithering(col),1.0);}'].join('\n'); // dithered (v11.29): the dusk gradient bands like the deep does
const sky=(function(){const g=new THREE.SphereGeometry(FAR*0.94,24,12);
  const m=new THREE.Mesh(g,new THREE.ShaderMaterial({uniforms:skyU,vertexShader:SKY_VS,fragmentShader:SKY_FS,side:THREE.BackSide,depthWrite:false,fog:false}));m.frustumCulled=false;m.renderOrder=-10;m.visible=false;scene.add(m);return m;})();
function pushSky(){const K=SKY,U=skyU;U.uZen.value.fromArray(K.zen);U.uHor.value.fromArray(K.hor);U.uGlow.value.fromArray(K.glow);U.uSunC.value.fromArray(K.sunC);U.uLumC.value.fromArray(K.lumC);U.uCirrC.value.fromArray(K.cirrC);
  U.uSun.value.copy(K.sun);U.uMoon.value.copy(K.moon);U.uLum.value.copy(K.lum);U.uCam.value.copy(camera.position);U.uWind.value.set(K.windOff[0],K.windOff[1]);U.uUpper.value.set(K.upperOff[0],K.upperOff[1]);
  U.uDay.value=K.dayK;U.uNight.value=K.night;U.uCover.value=K.cover;U.uRain.value=K.rainA;U.uMoonL.value=K.moonL/MOONL;U.uLumL.value=clamp(K.lumL,0,1);U.uStarT.value=K.starT;U.uBow.value=K.bow;U.uCirr.value=K.cirrus;U.uEclS.value=K.eclS;U.uEclL.value=K.eclL;U.uFxCloud.value=FX.clouds?1:0;
  const cy=camera.position.y;U.uCloudH.value=CLOUD_H*(1-0.35*K.rainA)-cy;U.uCloudT.value=CLOUD_T*(1+2.0*K.rainA);U.uCirrusH.value=CIRRUS_H-cy;U.uCamH.value=cy-TIDE; // under a shower the base drops and the deck grows to congestus
  const pd=U.uPlanD.value;for(let i=0;i<3;i++){const v=K.plan[i];pd[i*3]=v.x;pd[i*3+1]=v.y;pd[i*3+2]=v.z;}}
// The mist above the water (v11.17; world.js HAZE): the fog chunk's air branch and the dome integrate rho(y) = dens·exp(-y/h) +
// spray·exp(-y/sprayH) over the water level. The haze is everywhere (sea salt in the boundary layer: the horizon's white band) and
// thickens under a shower; the spray is the surf's, by the wave-exposure field at the camera — the same field that places the cones
// and stirs the sand — read from sample() and eased over a few seconds so a shore is a drift, not an event. The mist's colour is the
// horizon's lifted toward the light's (white by day, amber at dusk, blue-grey by moonlight, dark on a moonless night), and it glows
// toward the light by the beam's share of the sky's light (a Mie forward peak: the bright horizon under a low sun).
const hzS={h:0,f:new Float32Array(NF)};
// v11.17.1: a calm kills the spray (whitecaps want a Beaufort 4) and the chop (SEA_CHOP: the short waves die to the swell); the vog is a
// Gaussian plume downwind of the fumarole sampled at the camera; the dawn mist is the lagoon field × a clear calm night × the hours
// round sunrise. Vog and dawn mist share the third layer (uMistW.yz); the vog also greys and warms the mist's colour.
function updateHaze(dt,above){const K=SKY,rk=K.rainA,wk=K.windK;
  const smp=above?sample(player.pos.x,player.pos.z,hzS):null;const sp=smp?smp.f[FI.expo]:K.spray,lg=smp?smp.f[FI.shel]:K.lag;
  K.spray+=(sp-K.spray)*(1-Math.exp(-0.7*dt));K.lag+=(lg-K.lag)*(1-Math.exp(-0.7*dt));
  SEA_CHOP=chopU.value=0.25+0.75*wk;
  MIST_P[0]=HAZE.dens*(1+2.5*rk);MIST_P[1]=1/(HAZE.h*(1+1.5*rk));MIST_P[2]=HAZE.spray*K.spray*K.spray*wk*wk*(1+0.8*rk);MIST_P[3]=1/HAZE.sprayH;MIST_W[0]=TIDE;
  // the vog: the plume's axis runs downwind from the cone; s along it, q across; the half-width grows; in a calm it pools round the cone
  {const dx=player.pos.x-FUME.x,dz=player.pos.z-FUME.z,wx=Math.cos(WIND_A),wz=Math.sin(WIND_A),sA=dx*wx+dz*wz,q=-dx*wz+dz*wx;
    const w=VOG.w0+VOG.spread*Math.max(sA,0)*(0.3+0.7*wk)+(1-wk)*300,vg=Math.exp(-q*q/(2*w*w))*(VOG.w0/w)*smooth(-VOG.w0*1.5,VOG.w0,sA)*smooth(VOG.reach,VOG.reach*0.5,sA);
    K.vog+=(vg-K.vog)*(1-Math.exp(-0.5*dt));}
  // the dawn mist: clear, calm, sheltered water, the hours round sunrise (the sun's altitude in hours: 15 h of night, 360/30 = 12 deg an hour)
  {const hs=Math.asin(clamp(K.sunAlt,-1,1))*180/Math.PI/12,rising=K.sun.x>0;const win=rising?smooth(MIST_DAWN.from,MIST_DAWN.peak,hs)*smooth(MIST_DAWN.to,MIST_DAWN.peak,hs):0; // K.sun.x>0: the sun is east of the meridian (rising; east is +x)
    K.dawn=win*smooth(0.45,0.15,K.cover)*smooth(0.5,0.1,wk)*K.lag*K.lag;}
  MIST_W[1]=VOG.dens*K.vog+MIST_DAWN.dens*K.dawn;MIST_W[2]=1/lerp(MIST_DAWN.h,VOG.h,K.vog*VOG.dens/Math.max(MIST_W[1],1e-9));
  const g=clamp(K.lumL/Math.max(K.skyL,0.02),0,1.2),vk=Math.min(1,K.vog*2);for(let i=0;i<3;i++)MIST_C[i]=lerp(K.hor[i],0.96*K.tint[i]*K.skyL,HAZE.lift)*lerp(1,[0.93,0.89,0.80][i],vk);MIST_C[3]=HAZE.glow*g;
  updateFume(dt,above);}
// The fumarole's plume (v11.17.1; world.js FUME): FUME.n puffs as points, each born at the summit with a rise that decays, carried by
// the wind, growing from r0 to r1 and fading over its life; a soft disc, lit by the sky, fogged by distance toward the mist's colour.
// Above the water only. One draw. (Points: the size is clamped by the GPU's point limit — a puff nearer than ~80 m may draw small.)
const fmP=new Float32Array(FUME.n*3),fmA=new Float32Array(FUME.n),fmS=new Float32Array(FUME.n),fmT=new Float32Array(FUME.n);
for(let i=0;i<FUME.n;i++)fmT[i]=rnd(0,FUME.life);
const fmG=new THREE.BufferGeometry();fmG.setAttribute('position',new THREE.BufferAttribute(fmP,3));fmG.setAttribute('aA',new THREE.BufferAttribute(fmA,1));fmG.setAttribute('aS',new THREE.BufferAttribute(fmS,1));
const fmU={uCol:{value:new THREE.Vector3(0.9,0.9,0.9)},uMistC:{value:MIST_C},uScale:{value:450},uCam:{value:new THREE.Vector3()}};
const fmM=new THREE.ShaderMaterial({uniforms:fmU,transparent:true,depthWrite:false,depthTest:true,
  vertexShader:'attribute float aA;attribute float aS;uniform float uScale;uniform vec3 uCam;varying float vA;varying float vD;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vD=length(mv.xyz);vA=aA;gl_PointSize=aS*uScale/max(vD,1.0);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 uCol;uniform vec4 uMistC;varying float vA;varying float vD;void main(){float r=length(gl_PointCoord-0.5)*2.0;float a=(1.0-smoothstep(0.35,1.0,r))*vA;vec3 c=mix(uCol,uMistC.rgb,1.0-exp(-vD*0.0028));gl_FragColor=vec4(c,a);}'});
const fume=new THREE.Points(fmG,fmM);fume.frustumCulled=false;fume.visible=false;fume.renderOrder=2;scene.add(fume);
function updateFume(dt,above){const K=SKY;fume.visible=above;if(!above)return;const L=FUME.life;
  for(let i=0;i<FUME.n;i++){let a=fmT[i]+dt;if(a>=L)a-=L;fmT[i]=a;const u=a/L,rise=FUME.rise*L*(1-Math.exp(-a/(L*0.35)))*0.35; // the rise slows as the plume cools
    fmP[i*3]=FUME.x+K.wind[0]*a*0.85+Math.sin(i*7.1+a*0.15)*(3+u*12);fmP[i*3+1]=FUME.y+rise;fmP[i*3+2]=FUME.z+K.wind[1]*a*0.85+Math.cos(i*3.7+a*0.11)*(3+u*12);
    fmS[i]=lerp(FUME.r0,FUME.r1,Math.sqrt(u))*2;fmA[i]=0.55*(1-u)*(1-u)*smooth(0,0.06,u);}
  fmG.attributes.position.needsUpdate=true;fmG.attributes.aA.needsUpdate=true;fmG.attributes.aS.needsUpdate=true;
  fmU.uCol.value.set(0.92*K.tint[0]*K.skyL+0.05,0.92*K.tint[1]*K.skyL+0.05,0.92*K.tint[2]*K.skyL+0.05);fmU.uScale.value=innerHeight*Q.pr*0.5;}
// the sun's (or the moon's) shimmer under the water: an additive glow plane in the light's direction. Since v11.6 it hangs SHIM_H
// above the surface, clear of every crest, and draws before the surface (renderOrder -2), so the surface blends over it: the glitter
// is on the water, seen through the window and the mirror, and a camera under the water can never reach its plane. Until v11.6 it hung
// 1.5 under the surface — from depth a glitter patch, but rising to the surface the camera came up underneath it (a glowing ceiling
// half a metre overhead covering the whole sky), then the near plane sliced it (a straight edge sweeping down to the horizon in five
// frames), then it was culled: the band of transition at the water line in the person's video.
const sunTex=(function(){const cv=document.createElement('canvas');cv.width=cv.height=256;const cx=cv.getContext('2d');const gr=cx.createRadialGradient(128,128,0,128,128,128);gr.addColorStop(0,'rgba(255,250,230,0.85)');gr.addColorStop(0.25,'rgba(200,235,240,0.35)');gr.addColorStop(1,'rgba(0,0,0,0)');cx.fillStyle=gr;cx.fillRect(0,0,256,256);return new THREE.CanvasTexture(cv);})();
const SHIM_H=1.5,SHIM_A=1.4; // the shimmer plane's height above the surface (above the highest crest, WAVE_AMP 1.17) and its strength (0.9 when it drew over the surface; ×1.5 now that the surface blends over it)
const sunMesh=(function(){const m=new THREE.Mesh(new THREE.PlaneGeometry(90,90),new THREE.MeshBasicMaterial({map:sunTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0.9}));m.rotation.x=HPI;m.renderOrder=-2;scene.add(m);return m;})();
// Light shafts (v11.13, POLISH.md 3, the person: "as long as it's not forced and is believably based on appropriate water physics").
// SH_K² tall additive quads (3 × up to 30 m) hanging from SH_TOP under the surface along the refracted sun (SUN_W), on a fixed world
// grid of SH_S m cells round a centre 12 m ahead of the camera toward the sun's azimuth (where rays are seen): a shaft is a function of
// its cell — position, width and phase hashed from (ci, cj) — so when the camera moves the set of cells shifts and the shafts stay put,
// the ones at the edge faded by distance from the centre. Each is turned to face the camera about the vertical; the vertices are
// written on the CPU each frame (SH_N × 4, the snow's way). Alpha per shaft: none over water shallower than 4 m under its top, full at
// 16 (it never reaches the ground: the bottom stops 1.5 m over groundAt); by 1 - 0.85 canopy (the water map); fading within 5 m of the
// camera (so the near plane never slices one). In the shader: a soft width, a profile that rises over the top 14% and decays down
// the length, a flicker on two slow sines (the sun through waves), the fog's extinction only (an additive thing takes no veil, DESIGN).
// Strength: SH_A × the beam's share × the sky's light × wk (hidden the frame the camera is in air, faded in under it, like the shimmer).
// Believability: crepuscular rays through a wave surface, only from a sun that is up and clear, never under the canopy or a shower.
const SH_K=Q.shafts,SH_N=SH_K*SH_K,SH_S=7.0,SH_L=30,SH_TOP=3,SH_A=0.16;
const shP=new Float32Array(SH_N*12),shA=new Float32Array(SH_N*4),shV=new Float32Array(SH_N*4),shPh=new Float32Array(SH_N*4),shUV=new Float32Array(SH_N*8);
for(let i=0;i<SH_N;i++){const b=i*4;shV[b]=0;shV[b+1]=0;shV[b+2]=1;shV[b+3]=1;shUV.set([0,0,1,0,1,1,0,1],i*8);}
const shI=new Uint16Array(SH_N*6);for(let i=0;i<SH_N;i++){const b=i*4,k=i*6;shI[k]=b;shI[k+1]=b+1;shI[k+2]=b+2;shI[k+3]=b;shI[k+4]=b+2;shI[k+5]=b+3;}
const shG=new THREE.BufferGeometry();shG.setAttribute('position',new THREE.BufferAttribute(shP,3));shG.setAttribute('uv',new THREE.BufferAttribute(shUV,2));shG.setAttribute('aA',new THREE.BufferAttribute(shA,1));shG.setAttribute('aV',new THREE.BufferAttribute(shV,1));shG.setAttribute('aPh',new THREE.BufferAttribute(shPh,1));shG.setIndex(new THREE.BufferAttribute(shI,1));
const shU={uTime:timeU,uCol:{value:new THREE.Color(0.55,0.72,0.8)},uK:{value:0},uFogP:{value:FOG_PS},uFogD:{value:SEA_FOG.dens}};
const shM=new THREE.ShaderMaterial({uniforms:shU,transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:'attribute float aA;attribute float aV;attribute float aPh;varying float vA;varying float vV;varying float vPh;varying float vD;varying vec2 vU;\nvoid main(){vA=aA;vV=aV;vPh=aPh;vU=uv;vec4 mv=modelViewMatrix*vec4(position,1.0);vD=length(mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float uTime;uniform vec3 uCol;uniform float uK;uniform vec4 uFogP;uniform float uFogD;varying float vA;varying float vV;varying float vPh;varying float vD;varying vec2 vU;\n'+
    'void main(){float w=1.0-abs(vU.x*2.0-1.0);w*=w;float pr=smoothstep(0.0,0.14,vV)*exp(-vV*2.4);float fl=0.6+0.4*sin(uTime*1.1+vPh)*sin(uTime*0.37+vPh*1.7);'+
    'float d=vD;float tn=exp(-uFogD*uFogD*d*d);float ex=mix(exp(-uFogP.x*d),tn,uFogP.y)'+FOG_CUT_GLSL+';gl_FragColor=vec4(uCol*(uK*vA*w*pr*fl*ex),1.0);}'});
const shafts=new THREE.Mesh(shG,shM);shafts.frustumCulled=false;shafts.renderOrder=-3;shafts.visible=false;scene.add(shafts);
function shHash(i,j,k){let n=(Math.imul(i,73856093)^Math.imul(j,19349663)^Math.imul(k,83492791))|0;n=Math.imul(n^(n>>>13),1274126177);n=(n^(n>>>16))>>>0;return n/4294967296;}
const shWM=[0,0,0,0];
function updateShafts(above,wk){
  const K=SKY,on=!above&&SUN_W[3]>0.02&&wk>0.01&&K.skyL>0.01&&FX.shafts;shafts.visible=on;if(!on)return;
  const sx=SUN_W[0],sy=Math.max(SUN_W[1],0.2),sz=SUN_W[2],hl=Math.hypot(sx,sz),ax=hl>1e-4?sx/hl:0,az=hl>1e-4?sz/hl:0;
  const px=camera.position.x,pz=camera.position.z,cx=px+ax*12,cz=pz+az*12,top=TIDE-SH_TOP,ci0=Math.floor(cx/SH_S)-((SH_K-1)>>1),cj0=Math.floor(cz/SH_S)-((SH_K-1)>>1),R=SH_K*SH_S;
  let n=0;
  for(let jj=0;jj<SH_K;jj++)for(let ii=0;ii<SH_K;ii++){const ci=ci0+ii,cj=cj0+jj,x=(ci+0.15+0.7*shHash(ci,cj,1))*SH_S,z=(cj+0.15+0.7*shHash(ci,cj,2))*SH_S,w=2+2*shHash(ci,cj,3);
    const g=groundAt(x,z),avail=top-g-1.5,len=Math.min(SH_L,Math.max(avail,0.1));
    let a=clamp((avail-4)/12,0,1)*(1-smooth(R*0.32,R*0.5,Math.hypot(x-cx,z-cz)))*smooth(1.5,5,Math.hypot(x-px,z-pz));
    if(a>0){const cf=canopyFade(top);if(cf>0){wmSample(x,z,shWM);a*=1-0.85*shWM[3]*cf;}} // the mats over the shaft's head (v11.32: the shader's ramp)
    const bx=x-sx/sy*len,bz=z-sz/sy*len,vx=px-x,vz=pz-z,vl=Math.max(Math.hypot(vx,vz),1e-3),rx=-vz/vl*w*0.5,rz=vx/vl*w*0.5,b=n*4,k=n*12;
    shP[k]=x-rx;shP[k+1]=top;shP[k+2]=z-rz;shP[k+3]=x+rx;shP[k+4]=top;shP[k+5]=z+rz;shP[k+6]=bx+rx;shP[k+7]=top-len;shP[k+8]=bz+rz;shP[k+9]=bx-rx;shP[k+10]=top-len;shP[k+11]=bz-rz;
    shA[b]=shA[b+1]=shA[b+2]=shA[b+3]=a;const ph=shHash(ci,cj,4)*TAU;shPh[b]=shPh[b+1]=shPh[b+2]=shPh[b+3]=ph;n++;}
  shG.attributes.position.needsUpdate=true;shG.attributes.aA.needsUpdate=true;shG.attributes.aPh.needsUpdate=true;
  shU.uK.value=SH_A*SUN_W[3]*K.skyL*wk*(1-smooth(30,70,TIDE-camera.position.y)); // and gone for a camera deeper than ~50 m: rays are a thing of the top of the column
  shU.uCol.value.setRGB(0.55*K.lumC[0],0.72*K.lumC[1],0.8*K.lumC[2]); // the shafts take the lamp's colour (v11.31.4): warm at a low sun, silver under the moon
}
// Rain: streaks that fall round the camera, only drawn above the water while a shower is on — each a short line along its own
// velocity (the fall plus the wind), wrapped in a box that follows the camera like the marine snow. The drops' crowns on the sea
// are in the surface shader (uRain); the ambience opens up with it (audio, updateAtmosphere).
// v11.18: the drops fade with distance in the vertex shader (RAIN_R), so nothing pops at the box's edge, and each streak tapers
// from the drop to its tail; per drop its own fall speed (drop size) and streak length. The box is ±RAIN_R round the camera, -6..+12 up.
const RAIN_N=Q.tier==='low'?260:620,RAIN_R=14,rainP=new Float32Array(RAIN_N*6),rainQ=new Float32Array(RAIN_N*5),rainA=new Float32Array(RAIN_N*2); // rainQ: x,y,z, fall speed, streak s
for(let i=0;i<RAIN_N;i++){const a=rnd(0.45,1);rainQ[i*5]=rnd(-RAIN_R,RAIN_R);rainQ[i*5+1]=rnd(-6,12);rainQ[i*5+2]=rnd(-RAIN_R,RAIN_R);rainQ[i*5+3]=rnd(6.5,10);rainQ[i*5+4]=rnd(0.045,0.08);rainA[i*2]=a;rainA[i*2+1]=a*0.3;}
const rainG=new THREE.BufferGeometry();rainG.setAttribute('position',new THREE.BufferAttribute(rainP,3));rainG.setAttribute('aA',new THREE.BufferAttribute(rainA,1));
const rainM=new THREE.ShaderMaterial({uniforms:{uCol:{value:new THREE.Color(0.8,0.85,0.9)},uOp:{value:0},uR:{value:RAIN_R}},
  vertexShader:'attribute float aA;uniform float uR;varying float vA;void main(){vec4 mv=modelViewMatrix*vec4(position,1.0);vA=aA*(1.0-smoothstep(uR*0.4,uR,length(mv.xyz)));gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 uCol;uniform float uOp;varying float vA;void main(){gl_FragColor=vec4(uCol,vA*uOp);}',transparent:true,depthWrite:false});
const rainL=new THREE.LineSegments(rainG,rainM);rainL.frustumCulled=false;rainL.visible=false;rainL.renderOrder=2;scene.add(rainL); // after the surface (renderOrder 1 from above): the streaks fall in front of the sea, not under it
function updateRain(dt,above){const K=SKY,on=above&&K.rainA>0.02&&FX.rain;rainL.visible=on;if(!on)return;
  const cx=camera.position.x,cy=camera.position.y,cz=camera.position.z,vx=K.wind[0]*0.5,vz=K.wind[1]*0.5,R=RAIN_R,W=2*R;
  for(let i=0;i<RAIN_N;i++){const q=i*5,vy=-rainQ[q+3],L=rainQ[q+4];let x=rainQ[q]+vx*dt,y=rainQ[q+1]+vy*dt,z=rainQ[q+2]+vz*dt;
    if(x>R)x-=W;else if(x<-R)x+=W;if(z>R)z-=W;else if(z<-R)z+=W;if(y<-6)y+=18;
    rainQ[q]=x;rainQ[q+1]=y;rainQ[q+2]=z;const k=i*6;rainP[k]=cx+x;rainP[k+1]=cy+y;rainP[k+2]=cz+z;rainP[k+3]=cx+x-vx*L;rainP[k+4]=cy+y-vy*L;rainP[k+5]=cz+z-vz*L;}
  rainG.attributes.position.needsUpdate=true;const c=0.5+0.45*Math.min(1,K.skyL);rainM.uniforms.uCol.value.setRGB(c*0.9,c*0.95,c);rainM.uniforms.uOp.value=0.6*K.rainA;} // lit by the sky: grey by day, dim by night
// Under water the "sky" is the fog itself: a black dome just inside the far plane, fogged like everything else, so the last
// of the water in every direction is the water's colour there (the map) at its daylight — dark toward the deep, sunlit
// toward the shallows and the surface — instead of one flat background colour with a visible edge against the surface.
const waterDome=(function(){const m=new THREE.Mesh(new THREE.SphereGeometry(FAR*0.95,24,12),new THREE.MeshBasicMaterial({color:0x000000,side:THREE.BackSide,depthWrite:false}));m.frustumCulled=false;m.renderOrder=-11;scene.add(m);return m;})();

// ---------- marine snow (v11.24) ----------
// What is in the water, by what the column is doing (the person's ask, 10 Sep: the stuff at the bottom of the world is not the stuff
// at the top). Marine snow is not one thing evenly spread: it is five populations, each with a source, a sink and a size, and
// the column is layered by density, so it is sparse in the middle and piles up at the interfaces. Five kinds (SN_K):
//   live   — the lit layer's own life and its finest debris: tiny, greenish-pale, all but weightless (0.5 cm/s), stirred by the
//            wind's turbulence in the mixed layer. Most under the surface, and again at the thermocline where the nutrients sit
//            (a chlorophyll maximum, real); more where the water is fed (`nut`).
//   floc   — the snow proper: the aggregates (dead cells, mucus, pellets) that form under the lit layer and sink through the
//            dark. Fewer with depth as bacteria eat them (the Martin curve, flux ~ (d/90)^-0.86), bigger and browner as the
//            small ones go; a thin layer on the thermocline (-64) and the particle maximum at the chemocline (-450: iron and
//            manganese come out of solution at the redox edge — the Black Sea has this layer), rusty in the last 25 m above the
//            plate, milky in it. More under the canopy (the rafts shed); gone below the chemocline.
//   silt   — mineral: the bed lifted. Where waves reach the floor (`expo`: the top 30 m) the whole column carries sand; over any
//            mud or sand the current stirs a bottom nepheloid layer (7 m e-folding); the lagoon's still water holds its fines.
//            Nothing over bare rock (`sub` 1). The colour of the bed: olivine sand, grey-brown mud, dark at the vents.
//   bubble — from breakers and whitecaps in the top 2 m, and rain on the surface: white, rising (28 cm/s: mm bubbles).
//   black  — below the chemocline the water is ferrous and sulfidic and iron sulfide falls out: black flakes, big, sparse,
//            nearly still (the deep is stratified, no turbulence); and at a vent field the sulfide grains of the plume, dark with
//            a white share (anhydrite, bacterial floc), carried up by the field's convection near the floor and settling downwind.
// The column (per frame, cheap): settling slowed at the two density steps (particles pile up there — that is why thin layers
// exist); the wind's turbulence in the top ~60 m, the current's over the bed, the vent's convection, none below the chemocline;
// the swell's orbital motion in the top 20 m (the two longest waves, e^-kd: the snow circles under a passing crest — real,
// and the Stokes drift downwind falls out of it); the current everywhere; the flow round bodies (FLOW, physics.js) with a
// velocity per point that persists as a wake. Every point is one kind, chosen where it is from the kinds' weights there, or
// dormant (parked at the camera, clipped) when the water there is sparse — so the count is spent where the snow is: dense
// fines at the top, a few big flakes in the dark. A point re-rolls when it wraps the box, and at its refresh (one point in 64
// a frame: the fields, the floor, the canopy re-read) when its kind has faded where it has sunk to, or it was dormant.
// Fall rates are a compromise with the eye: real aggregates do 50-200 m a day (2 mm/s, motionless to a swimmer); 8 cm/s (the
// old rate, 7 km a day) read as a snowfall. These are ~10× reality and read as slow.
// Drawn as one Points with a per-point colour (the particle's own), size and alpha (aSz), lit by the material colour (the ambient
// by depth and daylight, updateAtmosphere) plus the player's light by distance — so the snow shows in a torch's reach in the
// dark and is invisible outside it. The shader patch reads r128's points chunks; if a line isn't found it warns and the snow
// draws uniform (the old look) rather than not at all.
const PN=Q.snow,SN_HW=30,pp=new Float32Array(PN*3),pv=new Float32Array(PN*3),pc=new Float32Array(PN*3),ps=new Float32Array(PN*2),pk=new Uint8Array(PN),pr=new Float32Array(PN),ph=new Float32Array(PN),pf=new Float32Array(PN*7);
const SN_K=[{sz:0.5,fall:0.005},{sz:1.0,fall:0.02},{sz:0.6,fall:0.05},{sz:0.55,fall:-0.28},{sz:1.35,fall:0.006}]; // size × the material's, m/s down
const SN_TH=-64,SN_CH=CHEMO,SN_W0=0.9,SN_GAIN=3.0,SN_REF=63; // the thermocline, the chemocline (y); the weight that fills the count; weight → alpha; the refresh mask (one point in 64 a frame: a point re-rolls about once a second)
const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pp,3));pg.setAttribute('color',new THREE.BufferAttribute(pc,3));pg.setAttribute('aSz',new THREE.BufferAttribute(ps,2));
const plU={value:new THREE.Vector4(0,0,0,0)},plCU={value:new THREE.Color(0x6fbfe0)};
const pm=new THREE.PointsMaterial({color:0xcfe6ee,size:0.14,transparent:true,opacity:0.55,depthWrite:false,vertexColors:true});
pm.onBeforeCompile=function(sh){sh.uniforms.uPL=plU;sh.uniforms.uPLc=plCU;let n=0;
  sh.vertexShader=sh.vertexShader.replace('uniform float size;',()=>{n++;return 'attribute vec2 aSz;uniform vec4 uPL;varying float vA;varying float vL;uniform float size;';})
    .replace('gl_PointSize = size;',()=>{n++;return 'gl_PointSize=size*aSz.x;vA=aSz.y*smoothstep(0.5,2.0,-mvPosition.z);{vec3 dl=transformed-uPL.xyz;vL=uPL.w/(0.5+dot(dl,dl));}';})
    .replace('#include <logdepthbuf_vertex>',()=>{n++;return 'gl_PointSize=min(gl_PointSize,24.0);\n#include <logdepthbuf_vertex>';});
  sh.fragmentShader=sh.fragmentShader.replace('uniform vec3 diffuse;',()=>{n++;return 'varying float vA;varying float vL;uniform vec3 uPLc;uniform vec3 diffuse;';})
    .replace('#include <color_fragment>',()=>{n++;return 'diffuseColor.rgb=vColor*(diffuse+uPLc*vL);diffuseColor.a*=vA;';});
  if(n!==5)console.warn('snow: points chunks not as expected ('+n+' of 5); the snow draws uniform');};
pm.customProgramCacheKey=function(){return 'snow';};
const plankton=new THREE.Points(pg,pm);plankton.frustumCulled=false;scene.add(plankton);
const snF=new Float32Array(NF),snWM=[0,0,0,0],snW=[0,0,0,0,0],snLast=V3(1e9,0,0);let snFrame=0; // snLast: the camera last frame — a jump (spawn, the zoo, a respawn) reseeds the whole cloud at once
function snGauss(u){return Math.exp(-u*u);}
// the kind's weight at a point: y and the point's cached conditions (pf: sub, flow, expo, nut, heat, shel, canopy; ph: the floor)
function snowW(k,i,y){const b=i*7,d=TIDE-y,hf=y-ph[i];if(d<0.3||hf<0)return 0;
  switch(k){
    case 0:return (0.35+0.65*pf[b+3])*(0.7*Math.exp(-d/40)+0.75*snGauss((y-SN_TH+2)/9));
    case 1:{const form=smooth(4,45,d),martin=Math.pow(Math.max(d,90)/90,-0.86);
      return (0.4+0.6*pf[b+3])*(1+1.2*pf[b+6]*smooth(-90,-60,y))*(form*martin+0.9*snGauss((y-SN_TH)/6)+1.6*snGauss((y-SN_CH)/7))*0.9*smooth(SN_CH-15,SN_CH,y);}
    case 2:{const stir=pf[b+2]*(0.35+0.65*SEA_CHOP)*(0.3+0.7*Math.exp(-hf/12)),bed=(0.15+0.85*pf[b+1])*(1.2*Math.exp(-hf/6)+0.4*Math.exp(-hf/30)),lag=0.4*pf[b+5]*Math.exp(-hf/10); // the bed: a sharp layer in the bottom few metres inside the thicker bottom mixed layer
      return (1-pf[b])*(stir+bed+lag)*(1+0.5*pf[b+4]);}
    case 3:return Math.max(pf[b+2]*(0.3+0.7*SEA_CHOP),0.25*smooth(0.45,1,SEA_CHOP))*Math.exp(-d/2.2)+0.35*SKY.rainA*Math.exp(-d/1.2);
    case 4:return 0.45*smooth(SN_CH+2,SN_CH-14,y)+pf[b+4]*1.3*Math.exp(-hf/70);
  }return 0;}
// (re)seed point i at x,y,z: read the conditions there, pick a kind by the weights (or park it), colour and size it. y is
// moved into the water if it was in air or under the floor; if there is no water in the box's column there, the point parks.
// `keep`: a refresh of a live point — its velocity and look stay if it draws the same kind again (no pop).
let snDirty=true;
function snowSeed(i,x,y,z,keep){
  const ch=chunkAt(x,z),b=i*7,k0=keep?pk[i]:255;let f,h;if(ch){f=ch.f(x,z);h=ch.h(x,z);}else{const s=sample(x,z,snF);f=s.f;h=s.h;}
  pf[b]=f[FI.sub];pf[b+1]=f[FI.flow];pf[b+2]=f[FI.expo];pf[b+3]=f[FI.nut];pf[b+4]=f[FI.heat];pf[b+5]=f[FI.shel];wmSample(x,z,snWM);pf[b+6]=snWM[3];ph[i]=h; // the canopy's weight over this column (it floats over deep water; snowW applies it by the point's own height)
  const cy=camera.position.y,lo=Math.max(cy-SN_HW,h+0.3),hi=Math.min(cy+SN_HW,TIDE-0.4);
  const park=()=>{pk[i]=255;pp[i*3]=camera.position.x;pp[i*3+1]=cy;pp[i*3+2]=camera.position.z;ps[i*2+1]=0;}; // parked at the camera: clipped by the near plane
  if(hi<=lo){park();return;}
  if(y<lo||y>hi)y=lo+Math.random()*(hi-lo);
  let W=0;for(let k=0;k<5;k++){snW[k]=snowW(k,i,y);W+=snW[k];}
  if(Math.random()*SN_W0>=W){park();return;} // parked: sparse water here
  let k=0,acc=snW[0];const pick=Math.random()*W;while(k<4&&pick>acc){k++;acc+=snW[k];}
  pk[i]=k;pp[i*3]=x;pp[i*3+1]=y;pp[i*3+2]=z;ps[i*2+1]=Math.min(1,snW[k]*SN_GAIN);if(k===k0)return; // the alpha is set here, at the seed and the refresh, not every frame: it moves as slowly as the point sinks. A refresh that drew the same kind keeps the point's look
  pr[i]=Math.random();pv[i*3]=pv[i*3+1]=pv[i*3+2]=0;snDirty=true;
  const d=TIDE-y,q=pr[i],j=(q-0.5)*0.1;let cr,cg,cb;
  if(k===0){const nt=pf[b+3];cr=lerp(0.82,0.66,nt);cg=lerp(0.9,0.86,nt);cb=lerp(0.78,0.6,nt);}
  else if(k===1){const dk=smooth(60,260,d),ru=smooth(SN_CH+32,SN_CH+10,y),mk=snGauss((y-SN_CH)/7);
    cr=lerp(lerp(lerp(0.86,0.6,dk),0.72,ru),0.92,mk);cg=lerp(lerp(lerp(0.86,0.56,dk),0.44,ru),0.92,mk);cb=lerp(lerp(lerp(0.82,0.48,dk),0.26,ru),0.88,mk);}
  else if(k===2){const sd=smooth(0.05,0.33,pf[b]),ht=pf[b+4];cr=lerp(lerp(0.5,0.7,sd),0.25,ht);cg=lerp(lerp(0.47,0.68,sd),0.23,ht);cb=lerp(lerp(0.42,0.5,sd),0.22,ht);}
  else if(k===3){cr=cg=cb=1;}
  else{const ht=pf[b+4];if(ht>0.05&&q>0.7){cr=cg=0.85;cb=0.83;}else{cr=lerp(0.09,0.28,ht);cg=lerp(0.10,0.27,ht);cb=lerp(0.12,0.27,ht);}}
  pc[i*3]=cr+j;pc[i*3+1]=cg+j;pc[i*3+2]=cb+j;ps[i*2]=SN_K[k].sz*(0.7+0.6*q);
}
for(let i=0;i<PN;i++){pk[i]=255;pf.fill(0,i*7,i*7+7);} // all parked until the first frame under water seeds them where the camera is
function updatePlankton(dt){
  const cx=camera.position.x,cy=camera.position.y,cz=camera.position.z,kd=Math.exp(-2.5*dt),kf=Math.min(1,8*dt),K=SKY;
  currentAt(cx,cz,cy,CURV);const cux=CURV.x*dt,cuz=CURV.z*dt; // the snow drifts with the current
  const w0=WAVES[0],w1=WAVES[1],e0=w0.A*w0.w,e1=w1.A*w1.w,t0=w0.w*t-w0.ph,t1=w1.w*t-w1.ph,wind=0.35+0.65*K.windK;
  snFrame++;const ref=snFrame&SN_REF;
  if(Math.abs(cx-snLast.x)+Math.abs(cy-snLast.y)+Math.abs(cz-snLast.z)>SN_HW){for(let i=0;i<PN;i++)snowSeed(i,cx+(Math.random()-0.5)*2*SN_HW,cy+(Math.random()-0.5)*2*SN_HW,cz+(Math.random()-0.5)*2*SN_HW);}snLast.set(cx,cy,cz);
  for(let i=0;i<PN;i++){
    const k=pk[i],b=i*7;
    if(k===255){if((i&SN_REF)===ref)snowSeed(i,cx+(Math.random()-0.5)*2*SN_HW,cy+(Math.random()-0.5)*2*SN_HW,cz+(Math.random()-0.5)*2*SN_HW);else{pp[i*3]=cx;pp[i*3+1]=cy;pp[i*3+2]=cz;}continue;} // parked: ride at the camera (clipped); one in 64 a frame tries the water at a random spot in the box
    let x=pp[i*3],y=pp[i*3+1],z=pp[i*3+2],vx=pv[i*3]*kd,vy=pv[i*3+1]*kd,vz=pv[i*3+2]*kd;
    for(let bb=0;bb<flowN;bb++){const f=FLOW[bb],rx=x-f.x;if(rx>f.a4||rx<-f.a4)continue;const ry=y-f.y,rz=z-f.z,r2=rx*rx+ry*ry+rz*rz;if(r2>f.a4*f.a4)continue; // physics.js flowAt, inlined: this is the hot loop
      const a=f.a;let r=Math.sqrt(r2),fx=0,fy=0,fz=0;if(r<a*0.9){const q=(a*0.9-r)*8;r=Math.max(r,1e-3);fx+=rx/r*q;fy+=ry/r*q;fz+=rz/r*q;r=a*0.9;}
      const inv=a*a*a/(2*r*r*r),ur=(f.ux*rx+f.uy*ry+f.uz*rz)/(r*r),dr=Math.exp(-(r-a)/(0.35*a))*0.6;
      fx+=inv*(3*ur*rx-f.ux)+f.ux*dr;fy+=inv*(3*ur*ry-f.uy)+f.uy*dr;fz+=inv*(3*ur*rz-f.uz)+f.uz*dr;
      vx+=(fx-vx)*kf;vy+=(fy-vy)*kf;vz+=(fz-vz)*kf;}
    const d=TIDE-y,hf=y-ph[i],heat=pf[b+4],q=pr[i];
    // settling, slowed at the two density steps; the vent field's convection lifts everything near its floor
    let fall=SN_K[k].fall*(k===1||k===3?0.6+0.8*q:1)*(1-0.75*snGauss((y-SN_TH)/5))*(1-0.8*snGauss((y-SN_CH)/6));
    if(heat>0.02)fall-=0.12*heat*Math.exp(-hf/45);
    // turbulence: the wind's in the mixed layer, the current's over the bed, the vent's; the deep and the anoxic water are still
    const amp=0.22*smooth(75,25,d)*wind+0.15*pf[b+1]*Math.exp(-hf/5)+0.2*heat*Math.exp(-hf/40);
    let ux=0,uz=0,uy=0;if(amp>0.004){const ang=i*0.37+t*(0.5+0.4*q),sa=Math.sin(ang),ca=Math.cos(ang);ux=amp*sa;uz=amp*ca*(q<0.5?1:-1);uy=0.4*amp*ca*(q<0.25||q>0.75?1:-1);} // an eddy per point at its own rate, two trig; none for the still water of the deep
    if(d<15){ // the swell's orbits: u along the wave in phase with the crest, w a quarter behind (deep-water linear theory); cut where they are under 13% (e^-kd)
      const p0=(x*w0.dx+z*w0.dz)*w0.k-t0,a0=e0*Math.exp(-w0.k*d),s0=Math.sin(p0),c0=Math.cos(p0);ux+=a0*s0*w0.dx;uz+=a0*s0*w0.dz;uy-=a0*c0;
      if(d<6){const p1=(x*w1.dx+z*w1.dz)*w1.k-t1,a1=e1*Math.exp(-w1.k*d),s1=Math.sin(p1),c1=Math.cos(p1);ux+=a1*s1*w1.dx;uz+=a1*s1*w1.dz;uy-=a1*c1;}}
    x+=(ux+vx)*dt+cux;y+=(uy-fall+vy)*dt;z+=(uz+vz)*dt+cuz;
    let wrap=false;
    if(x-cx>SN_HW){x-=2*SN_HW;wrap=true;}else if(x-cx<-SN_HW){x+=2*SN_HW;wrap=true;}
    if(y-cy>SN_HW){y-=2*SN_HW;wrap=true;}else if(y-cy<-SN_HW){y+=2*SN_HW;wrap=true;}
    if(z-cz>SN_HW){z-=2*SN_HW;wrap=true;}else if(z-cz<-SN_HW){z+=2*SN_HW;wrap=true;}
    if(wrap){snowSeed(i,x,y,z);continue;}
    pp[i*3]=x;pp[i*3+1]=y;pp[i*3+2]=z;pv[i*3]=vx;pv[i*3+1]=vy;pv[i*3+2]=vz;
    if((i&SN_REF)===ref)snowSeed(i,x,y,z,true);else if(y>TIDE-0.3||y<ph[i])ps[i*2+1]=0; // out of the water or into the floor between refreshes: hidden // the refresh: every point re-rolls where it is (keeping its look if the kind holds), so the live share tracks the water's density and a point that has sunk out of its layer changes kind
  }
  pg.attributes.position.needsUpdate=true;pg.attributes.aSz.needsUpdate=true;if(snDirty){pg.attributes.color.needsUpdate=true;snDirty=false;}
  plU.value.set(plight.position.x,plight.position.y,plight.position.z,plight.intensity*1.6);
}

const fogTarget=new THREE.Color(),hemiSkyA=new THREE.Color(AIR.hemiSky),hemiGroundA=new THREE.Color(AIR.hemiGround),wmHere=[0,0,0,0],skyT=new THREE.Color(),skyT2=new THREE.Color(),WHITE=new THREE.Color(1,1,1);
let curDepth=-1,wasAbove=null,snapMed=true; // snapMed: the next medium change is instant (boot, respawn), not a crossfade
// One density per medium. Writes the fog uniforms for the medium the camera is in (both the big-thing and the small-thing
// sets, see scene.js) — called on a surface crossing and by the readout's fog tuner (main.js). In air the haze thickens with rain.
function applyFog(above){
  const rk=above?SKY.rainA:0;
  scene.fog.density=above?AIR.dens*(1+1.2*rk):SEA_FOG.dens;
  if(above){FOG_P[0]=FOG_PS[0]=AIR.far*(1+1.0*rk);FOG_P[1]=FOG_PS[1]=AIR.share;FOG_P[2]=FOG_PS[2]=0;FOG_P[3]=FOG_PS[3]=0;}
  else{FOG_P[0]=FOG_PS[0]=SEA_FOG.far;FOG_P[1]=SEA_FOG.share;FOG_PS[1]=SEA_FOG.shareS;FOG_P[2]=FOG_PS[2]=SEA_FOG.placeMix;FOG_P[3]=FOG_PS[3]=1;}
  FOG_W[1]=SEA_FOG.bright;FOG_W[2]=SEA_FOG.dlAt;FOG_W[3]=SEA_FOG.reach;LIGHT_K[0]=FX.caustics?SEA_FOG.cau:0;LIGHT_K[1]=FX.shadows?SEA_FOG.shd:0; // the effects list (effects.js) can zero either
}
// The crossing (v11.7). The medium changes in one frame — the camera's side, the surface's look, the fog, the domes and the tint from
// above are the medium and switch with it — and the *light* crossfades over MED_T: the hemisphere, the sun, the audio. medK is the
// mix: 0 water, 1 air. The water's own things — the shimmer, the snow, the player's glow — fade *in* by medK when the camera goes
// under and are gone the frame it comes up (v11.7.2): they fade both ways until then, and the shimmer plane, 1.5 m over the surface
// and 90 m wide, sat a metre over a camera that had just surfaced — an additive ceiling over the whole sky for a quarter of a second,
// the sky three times too bright at the flip and dimming: the flash on every breach in the person's fifth video. (v11.7's first cut
// also mixed the fogs and the domes; the water's veil read into the air wrapped the shore in teal on every breach — seen, struck.)
const MED_T=0.25;let medK=0;
const seaFogC=new THREE.Color(),airFogC=new THREE.Color(),hemiSea=new THREE.Color(),hemiSeaG=new THREE.Color(),hemiAir=new THREE.Color(),hemiAirG=new THREE.Color();
function updateAtmosphere(dt){
  updateSky(dt);const K=SKY,tint=K.tint;skyT.setRGB(tint[0],tint[1],tint[2]);
  const uc=underCanopy(player.pos.x,player.pos.z,player.pos.y),depth=TIDE-player.pos.y; // depth under the water level now
  const dfD=daylightAt(player.pos.y)*(uc?0.72:1),df=dfD*K.skyLw; // daylight at the player's depth (world.js, one curve with the shader's since v11.32): by depth, then by the sky the water sees (v11; v11.23 skyLw)
  // the water here, read from the same blurred map the fog shader reads at the camera (so the background, the ambient
  // light and the fog agree, and a border is a drift over ~100 units of travel, not an event); the canopy mixed in as the shader does
  wmSample(player.pos.x,player.pos.z,wmHere);const cw=wmHere[3]*canopyFade(player.pos.y),w=WATER_CANOPY,bw=SEA_FOG.bright*(1-0.28*cw); // v11.32: the shader's ramp, not a cut at -70
  {const fw=Math.exp(-Math.max(player.pos.y+wmFloor(player.pos.x,player.pos.z)-FLOOR_FREE,0)/FLOOR_H),oc=wcolAt(Math.max(-player.pos.y,OPEN_D));for(let i=0;i<3;i++)wmHere[i]=lerp(oc[i],wmHere[i],fw);} // v11.27: the floor's colour only within FLOOR_H of it, as the shader has it (world.js FLOOR_H)
  const wr=lerp(wmHere[0],w[0],cw)*bw,wg=lerp(wmHere[1],w[1],cw)*bw,wb=lerp(wmHere[2],w[2],cw)*bw,dl=daylightAt(player.pos.y);
  // the medium is the camera's: air above the surface, water below. Crossing it snaps fog and light; within it they drift.
  const above=mode==='play'?player.camAbove:camera.position.y>waveH(camera.position.x,camera.position.z); // in play the camera's side is decided with hysteresis and the camera is held clear of the wave (player.js finishPlayer); the raw test here flipped every frame the chop passed the camera (v11.6)
  surfaceU.uDf.value=df;surfaceU.uUnder.value=above?0:1;surfaceU.uRain.value=FX.rain?K.rainA:0;
  // Where the surface sits in the transparent pass, by the medium, not by three's sort (v11.6). Three orders transparent objects by the
  // NDC depth of each object's *origin*; the surface's origin is the camera's snapped x,z at TIDE, so near the line it is within a metre
  // of the camera and hops a grid step at a time — in front of the camera plane one frame, behind it the next — and the surface swapped
  // places with the shimmer sprite (90 m, additive: blended down by the mirror when drawn under it, added on top when drawn over it),
  // the jellies and the snow every few frames: the glow on the surface flickering on approach. From below the surface is the farthest
  // transparent thing on any ray, so it draws first; from above everything transparent is beneath it, so it draws last.
  surface.renderOrder=above?1:-1;
  surfaceU.uSkyR.value.set(K.hor[0]*0.85+K.zen[0]*0.2,K.hor[1]*0.85+K.zen[1]*0.2,K.hor[2]*0.85+K.zen[2]*0.2); // the sky the water reflects at grazing angles: the horizon, mostly (noon ≈ the old constant)
  surfaceU.uWin.value.set(tint[0]*K.skyL,tint[1]*K.skyL,tint[2]*K.skyL);surfaceU.uGlint.value.set(K.lumC[0]*K.lumL*1.05,K.lumC[1]*K.lumL*1.05,K.lumC[2]*K.lumL*1.05);
  const snap=above!==wasAbove;wasAbove=above;const dK=dt/MED_T;medK=above?Math.min(1,medK+dK):Math.max(0,medK-dK);if(snapMed){medK=above?1:0;snapMed=false;}
  const k=medK;
  const shallow=smooth(-40,0,-depth); // the light's colour reaches the shallows only (red is gone by -15)
  airFogC.setRGB(K.hor[0],K.hor[1],K.hor[2]);
  fogTarget.setRGB(wr,wg,wb).multiplyScalar((0.3+0.7*dl)*K.skyLw).multiply(skyT2.copy(skyT).lerp(WHITE,1-shallow));
  FOG_T[0]=above?K.skyL:K.skyLw; // the veil and the shader-side daylight scale by the medium's sky (v11.23)
  // Under water scene.fog.color only drives the hemisphere light and the background behind the dome (the fog itself reads
  // the map in the shader); it follows the map with a short lag. In air it is the sky's horizon, which moves with the hour.
  seaFogC.lerp(fogTarget,1-Math.exp(-1.5*dt));scene.fog.color.copy(above?airFogC:seaFogC);if(snap||above)applyFog(above);
  waterDome.visible=!above;waterDome.position.copy(camera.position);
  // the ambient. Air: the sky's — the approved noon pair scaled by the sky's light and coloured by it, the sun (or the moon) as the
  // key. Water: the water's — sky = the veil colour lifted, ground = the same colour dimmed (upwelling light — undersides seen from
  // below, the pads of the canopy above all, read as water-dark rather than black)
  hemiAir.copy(hemiSkyA).multiplyScalar(Math.pow(K.skyL,0.85)).multiply(skyT);hemiAirG.copy(hemiGroundA).multiplyScalar(K.skyL).multiply(skyT);
  hemiSea.copy(seaFogC).multiplyScalar(1.8);hemiSeaG.copy(seaFogC).multiplyScalar(SEA_FOG.ground);
  hemi.intensity=lerp(0.3+0.7*df,0.85,k);hemi.color.copy(hemiSea).lerp(hemiAir,k);hemi.groundColor.copy(hemiSeaG).lerp(hemiAirG,k);
  const sunSea=(0.9+0.2*Math.sin(t*2.3)+0.1*Math.sin(t*3.9))*1.2*(uc?0.72:1)*K.lumLw; // the surface value: the shader scales it by the daylight at the lit point (scene.js, sun-by-depth)
  sun.intensity=lerp(sunSea,1.35*K.lumL,k);
  const wk=above?0:1-k; // the water's things: fading in under the water (k falls from 1), gone the frame the camera is in air (v11.7.2)
  plight.intensity=(1.3*(1-dfD)*(1-dfD)+0.5*(1-K.skyL)*(1-K.skyL))*wk; // the player's own light: in the deep as before, and a little at night (unseen; see CHANGELOG v11)
  // the shimmer: over the surface in the light's direction, no further than 60 m off, fading as the light does. Seen through the
  // surface (drawn before it), so the surface's alpha takes 62–74% of it: SHIM_A is the knob if it reads too faint or too strong
  const L=K.lum,ly=Math.max(L.y,0.08),sl=clamp((TIDE+SHIM_H-player.pos.y)/ly,0,60/Math.max(Math.hypot(L.x,L.z),1e-3));
  sunMesh.visible=!above&&FX.shimmer;sunMesh.material.opacity=SHIM_A*dfD*dfD*Math.min(1,K.lumL*1.4)*Math.min(1,ly*4)*wk;sunMesh.position.set(player.pos.x+L.x*sl,TIDE+SHIM_H,player.pos.z+L.z*sl);
  sunMesh.material.color.setRGB(K.lumC[0],K.lumC[1],K.lumC[2]);
  updateShafts(above,wk);
  updateHaze(dt,above);sky.visible=above;sky.position.copy(camera.position);if(above)pushSky();
  plankton.visible=!above&&FX.snow;tintU.value.set(TIDE,above?1:0,K.skyL,0); // the tint is the water column seen from above: the medium's, so it switches with it
  pm.color.setRGB(lerp(0.45,1,df),lerp(0.75,1,df),lerp(0.95,1,df));pm.opacity=0.6*(0.45+0.55*df)*wk; // the light on the snow (v11.24: the particle's own colour is per point): blue-green and dim with depth and the night; the player's light is added in the shader
  updateRain(dt,above);
  if(mode!=='play')return;
  // the depth, and nothing else: no place has a name (the person, Sep 2026). Shown under the water, in whole metres, faded at the surface
  const dm=Math.round(depth);if(dm!==curDepth){curDepth=dm;biomeEl.textContent=dm>0?dm+' m':'';}
  biomeEl.style.opacity=above?0:0.55*smooth(2,8,depth);
}
function updateHUD(){const P=player;hpBar.style.width=(100*Math.max(0,P.hp)/P.maxhp)+'%';hpEl.style.opacity=(P.hp<P.maxhp*0.985&&!P.dead)?1:0;}
// Compass: a strip of cardinal letters under a hairline tick, fading in while you move or turn and out when you rest.
// North is -z. The dot below the letters is the bearing of the peak (home), shown once you're well away from it.
let compT=0,lastHdg=-1,compOn=false;
function updateCompass(dt){
  const P=player;
  if(mode!=='play'||P.dead){if(compOn){compassEl.style.opacity=0;compOn=false;}compT=0;return;}
  let hdg=(-P.yaw*180/Math.PI)%360;if(hdg<0)hdg+=360;
  let dh=Math.abs(hdg-lastHdg);if(dh>180)dh=360-dh;
  const turned=lastHdg<0||dh>0.1;
  if(turned||P.spd>0.6)compT=3.5;else compT-=dt;
  const on=compT>0;if(on!==compOn){compOn=on;compassEl.style.opacity=on?1:0;}
  if(turned){lastHdg=hdg;cstripEl.style.transform='translateX('+(130-(hdg+360)*2.4).toFixed(1)+'px)';}
  else if(P.spd<0.6)return;
  const dist=Math.hypot(P.pos.x,P.pos.z);
  if(dist>150){let rel=Math.atan2(-P.pos.x,P.pos.z)*180/Math.PI-hdg;rel=((rel+540)%360)-180;cpeakEl.style.left=clamp(130+rel*2.4,12,248).toFixed(1)+'px';cpeakEl.style.opacity=Math.abs(rel)<50?1:0.45;}
  else cpeakEl.style.opacity=0;
}
