// atmosphere.js — the sea surface, the sky, marine snow, fog and light by medium/biome/depth, HUD
// ---------- the surface ----------
// One mesh, both faces. A non-uniform grid (dense under the camera, coarse far out) displaced in the vertex shader by the
// same wave sum the physics uses. Flat-shaded Phong so the facets catch the sun. The look is chosen by the *face* (v11.42: the top
// face is the topside, the back face the underside — since the mesh writes depth and is a height field, a ray from air only ever
// meets a top face first and a ray from water a back face, so the face is the medium the ray is in; v8.3–v11.41 chose by the camera's
// medium (uUnder), which the split camera cannot use — with the eye at the line the top half of the view is air and the bottom water in one
// frame). uUnder stays for one case: a back face seen with the camera in air (v11.5, below). Since v11.5 the
// mesh writes depth, so a crest's front slope hides the slopes behind it, and a back face seen with the camera in air — the
// inside of a wave, from a camera in a trough looking through a crest — is drawn as the water body, opaque and dark, not as the
// far surface's underside in sky colour (the pale ceiling with a hard edge at the crest line that v11–v11.4 chased). Seen from above: teal, Fresnel toward the sky at grazing angles, foam at the crests. Seen from below: the
// facet normal is flipped so sunlight reads as coming through; inside Snell's window (the ~48° cone overhead) the sky
// comes through — since v11.43 the sky itself, the eye refracted through each facet into a reduced copy of the sky shader (skyLite:
// the gradient, the sun's aureole, disc and glare, the moon, the deck's shade; WATER.md B — v11.49: the clouds themselves, cloudDeck and cirrusA
// refracted per facet, in place of the deck's mean shade, and the sun's disc and sharp glare drawn once from the *mean* surface rather than through
// every facet, which put a little bright circle on each facet that flickered as they turned; the person, 14 Sep: "I can't see the skybox", "in the bin"), so the sun wobbles facet by facet and a
// sunset or a moon comes through the window; past the critical angle the horizon's colour, and the window is still widened to a soft
// 15–50° band, the person's look since v11.7, blending into the mirror; outside it the surface is a
// total-internal-reflection mirror of the water below, so it takes the veil's colour (fogColor, the veil at the camera)
// and the underwater horizon is one colour whether you look at the surface, the far floor or the dome. The mesh follows
// the camera, snapped to the finest spacing so the tessellation doesn't swim.
// The topside's body (v11.42, WATER.md item 3): the water's own colour is the column's, painted by the two-segment fog on what is beneath (scene.js), so the surface
// itself keeps only SURF_BODY of its dark diffuse at normal incidence (0.66 to v11.41 — the shallows wore the deep's teal), the Fresnel sky to 1.0 at grazing, and the foam opaque.
const SURF_BODY=0.22;
// The topside's reflection (v11.45, WATER.md Part 3 / item J): the sky in the reflected direction (skyLite, scene.js — the dome's own sky, the sun's disc and glare in
// it), weighted by the Fresnel term as before, in place of one constant (uSkyR, 0.85·horizon + 0.2·zenith, v11.3–v11.44) for every direction. Near the feet the sea
// reflects the zenith, far off the horizon: the reflection gradient a sea has from any height. The direction follows the *facet* by REFL_FACET (1: the facet;
// 0: the mean surface): a facet's tilt swings the reflected ray by twice its slope, so a front and a back slope of the swell reflect sky 8° apart — a tone step
// where the sky's gradient is steep (near the horizon) and nothing where it is flat (overhead): facets from above that strengthen with distance, the rows
// converging to the horizon, and at grazing a sea that reflects the sky a few degrees up — darker than the horizon's haze band, the dark sea line under a pale
// sky (the person, 14 Sep: facets yes; the line's side my call — the natural one). The Fresnel *weight* stays on the mean normal (vNup, v11.7): the wedges
// from just above the water were the weight swinging, not the direction.
const REFL_FACET=1.0,REFL_GRAZE=[0.12,0.35],WIN_T=0.7,WIN_LO=0.35,WIN_HI=0.8; // WIN_* (v11.50; v11.51 narrowed the band from 0.05–0.8 to 0.35–0.8 — the window was full to 37° off the facet and only gone at 87°, so from 14 m under the whole ceiling was one flat sky; now full to 37°, gone by 70°, the physical 49° rim softened outward rather than the snowglobe's): the underside's translucency looking straight up (the sky's share of the pixel) and the band of the facet's cosine to the eye over which it goes from nothing to full — the naive window, no critical angle // REFL_GRAZE: the cosine (of the view to the mean surface) below which the Fresnel weight is the mean surface's and above which it is the facet's — 7° to 20° of depression
const SN=Q.surf,SR=FAR*1.05,SSTEP=SR*0.06*2/SN; // reaches past the far plane; ~1 unit between vertices under the camera (v11.4: was 2.1, which could not resolve the chop), ~50 at the edge
const sg=(function(){
  const n=SN+1,pos=new Float32Array(n*n*3),sp=new Float32Array(n*n),idx=[];
  const map=u=>SR*(0.06*u+0.94*u*u*u),dmap=u=>SR*(0.06+2.82*u*u)*(2/SN);
  for(let j=0;j<n;j++)for(let i=0;i<n;i++){const u=-1+2*i/SN,v=-1+2*j/SN,k=j*n+i;pos[k*3]=map(u);pos[k*3+1]=0;pos[k*3+2]=map(v);sp[k]=Math.max(dmap(u),dmap(v));}
  for(let j=0;j<SN;j++)for(let i=0;i<SN;i++){const a=j*n+i,b=a+1,c=a+n,d=c+1;idx.push(a,c,b,b,c,d);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('aSpace',new THREE.BufferAttribute(sp,1));g.setIndex(idx);return g;
})();
// The refraction (v11.51, the person on v11.50: "almost zero occlusion or any kind of warping or refraction … it can't be a completely straight view through"):
// what is above the water is seen through the underside *displaced* per facet. The frame as drawn so far — the sky, the land, anything in the air, all opaque and
// already down before the surface (transparent, renderOrder −1) draws — is copied to a texture in the surface's onBeforeRender (copyFramebufferToTexture: one
// blit of the drawing buffer, only with the camera under water and the switch on), and the underside's fragment reads it at its own screen position moved by the
// *differential* refraction: the eye refracted into the air through the facet (tilted further by the ripple layer, ripSlope — the caustic's trains and the
// capillaries, so the wobble has the ripples' grain inside a facet) minus the eye refracted through the mean surface, projected to pixels. The mean's own bending —
// Snell's cone, the sky compressed into 97° — is what the person called a snowglobe (v11.50), so it is left out: the image sits where it sits and each facet
// wobbles it by what its tilt adds, growing toward the rim as the true window's does (near 45° a facet's 5° is 14° of sky). Past the critical angle, where
// refract has nothing, the small-angle 0.33·tilt stands in; the shift is capped at REFR_MAX of the screen's height, since a pixel pulled from an opaque body
// nearer than the surface is the artefact every screen-space refraction has — a wobbling fringe of the body's colour along its edge (seen: the player's
// dark head smeared into the sky). So the copy is not taken by the surface itself but by an empty mesh, refrMark, at renderOrder 0.5 in the *opaque* pass:
// after the sky, the far layer, the terrain, the flora and the creatures (0), before the player's own body, which finishPlayer (player.js) puts at
// renderOrder 1 while it is under water — drawn after the copy, before the surface, so it occludes the surface by depth and is never in what the surface
// samples. In the air the body goes back to 0 and is in the copy, refracted like the land. Other creatures stay at 0: a fish between the eye and the
// surface can fringe, narrow while the cap is. Five taps blurred REFR_BLUR px, wider with distance, where the ripples are under a pixel. The switch is
// `refraction` on the effects list with its `wobble` slider (FX.refrK, a multiplier on REFR_K); off, the underside blends over the frame plainly as v11.50 did.
const REFR_K=1.0,REFR_RIP=0.35,REFR_MAX=0.05,REFR_BLUR=1.5; // REFR_K: the differential shift's gain (1 physical); REFR_RIP: the ripple layer's share of the facet's tilt (the rings alone, ripSlopeR — with the capillaries the sky from 17 m was an interlace of 4–8 px stripes, their shift more than their wavelength; seen); REFR_MAX: the cap, fraction of the screen's height (0.05: 45 px at 900); REFR_BLUR: the taps' radius in px at the eye, ×2.5 at 120 m
const refrTex=new THREE.DataTexture(null,1,1,THREE.RGBFormat,THREE.UnsignedByteType);refrTex.minFilter=refrTex.magFilter=THREE.LinearFilter;refrTex.generateMipmaps=false;refrTex.wrapS=refrTex.wrapT=THREE.ClampToEdgeWrapping;refrTex.needsUpdate=true; // RGB: the drawing buffer has no alpha (WebGLRenderer alpha:false), and a copy may not ask for a component the framebuffer lacks
const REFR_V=new THREE.Vector2();
const surfaceU={uRefr:{value:refrTex},uRefrOn:{value:0},uRefrRes:{value:new THREE.Vector4(1,1,1,1)},uRefrK:{value:REFR_K},uAmp:{value:WAVE_AMP},uUnder:{value:1},uWin:{value:new THREE.Vector3(1,1,1)},uGlint:{value:new THREE.Vector3(1.0,0.97,0.88)},uRain:{value:0},uBody:{value:SURF_BODY}};
// uRefr (v11.51): the frame before the surface, uRefrOn 1 while it is fresh, uRefrRes (width, height, focal x, focal y — all px), uRefrK the wobble's gain; uUnder: 1 when the camera is under water; uWin: Snell's window's light relative to noon; uGlint: the sun's (or the moon's) colour for the refracted glint;
// uRain: rain 0..1 — bright specks where drops hit the water; uBody: the topside's body alpha (SURF_BODY). The reflected sky (uSkyR to v11.44) is skyLite
// of the reflected direction now (REFL_FACET, above). The sky as the window and the topside see it — skyLite, and skyFar with the haze to infinity — lives in
// scene.js since v11.45 (the air's fog converges to it too) and reads the sky's shared uniforms (uSkA..uSkF, written by pushSky); SKY_FS is its reference.
const SURF_MAT=(function(){
  // The topside Fresnel (cm) is judged against the mean surface (vNup, up), not the facet, since v11.7: at grazing a facet's small tilt
  // swung it from 0.7 to 0.9 and the foreshortened grid read as tennis-court wedges from just above the water; the facet still lights the
  // diffuse, the specular and the glint. The underside's window (cv) stays per facet: each facet flipping between the bright window and
  // the mirror is what makes the surface from below read as moving water (v11.7's first cut smoothed it too, and the person missed it).
  const m=new THREE.MeshPhongMaterial({color:0x123a4c,specular:0xd8d8d8,shininess:500,emissive:0x081820,transparent:true,opacity:0.66,side:THREE.DoubleSide,flatShading:true,depthWrite:true}); // depth is written since v11.5: a crest's front slope hides the slopes behind it (from a low camera the far waves' back slopes are back faces, and they were drawn over the front ones in index order)
  m.onBeforeCompile=function(sh){
    sh.uniforms.uTime=timeU;sh.uniforms.uChop=chopU;sh.uniforms.uAmp=surfaceU.uAmp;sh.uniforms.uUnder=surfaceU.uUnder;sh.uniforms.uWin=surfaceU.uWin;sh.uniforms.uGlint=surfaceU.uGlint;sh.uniforms.uRain=surfaceU.uRain;sh.uniforms.uBody=surfaceU.uBody;sh.uniforms.uRefr=surfaceU.uRefr;sh.uniforms.uRefrOn=surfaceU.uRefrOn;sh.uniforms.uRefrRes=surfaceU.uRefrRes;sh.uniforms.uRefrK=surfaceU.uRefrK;sh.uniforms.uFogP={value:FOG_PSURF};for(let i=0;i<CAU_TEX.length;i++)sh.uniforms['uCauR'+i]={value:CAU_TEX[i].g};sh.uniforms.uCauG={value:CAU_GTEX};sh.uniforms.uWindOff=windOffU;// v11.52: the Snell window and its cloud march are gone from the surface (the person, 15 Sep: it looks bad); the sky's uniforms are no longer wired here. FOG_PSURF (v11.42): the surface is the boundary — its ray is fogged in the camera's medium whole (scene.js). v11.44: for one version this comment sat mid-line and ate the six bindings after it — the surface's fog set fell back to the split one and its own crests were classed under water: dark patches along every far crest from above
    sh.vertexShader='uniform float uTime;uniform sampler2D uFloorMap;attribute float aSpace;varying float vH;varying vec2 vWp;varying vec3 vNup;varying float vBrk;varying float vSpace;varying vec2 vDw;\n'+WAVE_DEP_GLSL+WAVE_GLSL+WAVE_SLOPE_GLSL+sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n{vWp=transformed.xz+modelMatrix[3].xz;vec2 dw=waveDep(vWp,modelMatrix[3].y);float hh=waveH(vWp,uTime,aSpace,dw);transformed.y+=hh;vH=hh;vBrk=waveBrk(vWp,dw);vNup=normalMatrix*vec3(0.0,1.0,0.0);vSpace=aSpace;vDw=dw;}'); // the whitecaps (v11.46–v11.50.1, WATER.md E: the foam by steepness — chopSlope against FOAM_S, trailed 2.5 and 5 m downwave, hashed into streaks 6 m by 1.5 m, the varying vFoam) are struck in v11.50.2: from below they were sparkles, and the person asked for them gone from above as well; the surf (vBrk) is all the foam now // the mesh sits at the tide (modelMatrix[3].y), so the water depth is the floor map's plus that (v11.44); vBrk: the breaking excess, the foam // vNup: the mean surface's normal (up) in view space — the Fresnel and the window are judged against it, not the facet (v11.6)
    sh.fragmentShader='uniform float uTime;uniform float uAmp;uniform float uUnder;uniform vec3 uWin;uniform vec3 uGlint;uniform float uRain;uniform float uBody;uniform float uChop;uniform mat3 uFogR;varying float vH;varying vec2 vWp;varying vec3 vNup;varying float vBrk;varying float vSpace;varying vec2 vDw;float cv2=1.0;float winT=0.0;uniform sampler2D uRefr;uniform float uRefrOn;uniform vec4 uRefrRes;uniform float uRefrK;\n'+RIP_PARS+RIP_GLSL+WSHD_GLSL+WAVE_REST_GLSL+
      'float rainRing(vec2 wp){vec2 cw=wp*1.25,ci=floor(cw),cf=cw-ci-0.5;vec3 h=fract(sin(vec3(dot(ci,vec2(127.1,311.7)),dot(ci,vec2(269.5,183.3)),dot(ci,vec2(419.2,371.9))))*43758.5);float ph=fract(uTime*0.9+h.x),on=step(fract(h.x*7.3),0.3+0.6*uRain);vec2 o=(h.yz-0.5)*0.36;float dd=length(cf-o)*0.8,rr=ph*0.34;float ring=(1.0-smoothstep(0.0,0.045,abs(dd-rr)))*(1.0-ph)*(1.0-ph),dot0=(1.0-smoothstep(0.0,0.05,dd))*(1.0-smoothstep(0.0,0.15,ph));return (ring*0.55+dot0)*on;}\n'+sh.fragmentShader // rainRing (v11.46): the v11.18 drop rings as a function, so the underside can show them too (WATER.md K)
      .replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\n{vec3 V=normalize(vViewPosition);float cv=abs(dot(V,normal)),cm=abs(dot(V,normalize(vNup)));cv2=cv;'+
        'if(!gl_FrontFacing&&uUnder<0.5){diffuseColor.rgb=vec3(0.0);diffuseColor.a=1.0;specularStrength=0.0;vec3 rdw=normalize(vFogPos-uFogC);vec3 Tw=refract(rdw,normalize(uFogR*normal),0.75);if(dot(Tw,Tw)<0.5)Tw=vec3(rdw.x,-0.2,rdw.z);Tw=normalize(Tw);float fd=texture2D(uFloorMap,vFogPos.xz*'+WM_SCALE+'+0.5).r*'+FM_SCALE.toFixed(1)+';float L=min(uFogW.w,(vFogPos.y+fd)/max(-Tw.y,0.05));totalEmissiveRadiance=fogVeil(vFogPos,Tw,L)*mix(vec3(1.0),vec3('+UPWELL.map(v=>v.toFixed(2)).join(',')+'),clamp(-Tw.y,0.0,1.0));}'+ // seen from the water's side with the camera in air — through a crest from a trough — this is the water itself: opaque, unlit, and since v11.45 the column's own colour, the veil along the eye refracted into the water as far as the floor or the veil's reach, darkened downward as the fog chunk paints the seabed beside it (UPWELL). To v11.44 it was black plus one constant: a flat dark slab with a hard straight edge across the bottom of the view from a camera in a trough (WATER.md Part 3, "also seen")
        'else if(gl_FrontFacing){float wf=smoothstep('+REFL_GRAZE[0].toFixed(2)+','+REFL_GRAZE[1].toFixed(2)+',cm);float fr=pow(1.0-mix(cm,cv,wf),3.0),fm=vBrk*0.85;float R=fr*0.85*(1.0-fm);float a=max(uBody+R-uBody*R,fm);vec3 rdw=normalize(vFogPos-uFogC);vec3 Nw=normalize(uFogR*normalize(mix(normalize(vNup),normal,'+REFL_FACET.toFixed(2)+')));vec2 rs=restSlope(vWp,uTime,vSpace,vDw);Nw=normalize(Nw+vec3(-rs.x,0.0,-rs.y));vec3 Rw=reflect(rdw,Nw);Rw.y=max(Rw.y,0.0);Rw=normalize(Rw+vec3(0.0,1e-3,0.0));'+ // v11.50.2: the foam is the breaking (vBrk) alone — the whitecaps by steepness (v11.46) are struck; to v11.45 it was by height; the reflection's normal is the facet's plus the slope of what the mesh faded out (restSlope, scene.js): the rows go on past the grid's reach in the light alone // the reflected sky by direction (v11.45, REFL_FACET above): the reduced sky along the eye reflected off the facet, clamped to the horizon (a steep facet at grazing can reflect below it) // // foam (v11.44): the breaking excess (vBrk, the surf) and the crests' whitecaps (by height, halved and by the chop — a wind sea's, not the swell's, which shoaling now raises over the whole shelf), *emissive* in the sky's light (uWin), not lit by the facet: far off the flat normal comes from screen derivatives across triangles under a pixel quad and lit foam went dark — dark streaks along every far crest from the beach (seen 14 Sep)
        'diffuseColor.rgb=diffuseColor.rgb*uBody*(1.0-R)*(1.0-fm)/a;totalEmissiveRadiance=(totalEmissiveRadiance*uWin*uBody*(1.0-R)+skyLite(Rw)*R)*(1.0-fm)/a+vec3(0.88,0.92,0.92)*0.9*uWin*fm/a;diffuseColor.a=a;'+
        'vec2 rp=ripSlope(vWp,length(vViewPosition),uTime);normal=normalize(normalize(Nw+vec3(-rp.x,0.0,-rp.y)*'+GLIT_K.toFixed(2)+')*uFogR);specularStrength*=(1.0-fm);'+ // the glitter (v11.46, WATER.md F): the normal the sun's specular sees is the facet's tilted by the ripple layer's slope (ripSlope: the caustic's own trains as a gradient, scene.js), back in view space (v*M = Mᵀv); the reflected sky above and the Fresnel keep the flat facet. Foam has no gloss // composited as a reflection (v11.45): what reaches the eye is R of the sky plus (1−R) of the water — the body's tint over the column beneath — and the foam over both; alpha is the fraction of the column covered (uBody + R − uBody·R, the foam whole) and the colour is divided by it so the blend gives exactly R·sky. To v11.44 the reflection was scaled by the body's alpha as well (mix(uBody,1,fr)): a third of itself at 25°, the facets' swing lost in the column. R takes the *facet's* Fresnel where the view is steep (wf: cm above REFL_GRAZE[1]) and the mean's at grazing (below REFL_GRAZE[0]), where the facet weight made the v11.7 wedges
        'if(uRain>0.0){float rd=length(vViewPosition),rk=uRain*(1.0-smoothstep(10.0,34.0,rd));specularStrength*=1.0-0.6*uRain;'+ // rain: the surface goes matte
        'if(rk>0.001){vec2 cw=vWp*1.25,ci=floor(cw),cf=cw-ci-0.5;vec3 h=fract(sin(vec3(dot(ci,vec2(127.1,311.7)),dot(ci,vec2(269.5,183.3)),dot(ci,vec2(419.2,371.9))))*43758.5);'+
        'float ph=fract(uTime*0.9+h.x),on=step(fract(h.x*7.3),0.3+0.6*uRain);vec2 o=(h.yz-0.5)*0.36;float dd=length(cf-o)*0.8,rr=ph*0.34;'+
        'float ring=(1.0-smoothstep(0.0,0.045,abs(dd-rr)))*(1.0-ph)*(1.0-ph),dot0=(1.0-smoothstep(0.0,0.05,dd))*(1.0-smoothstep(0.0,0.15,ph));'+
        'diffuseColor.rgb=mix(diffuseColor.rgb,vec3(0.80,0.86,0.88),(ring*0.55+dot0)*on*rk);}}}'+ // a drop's ring (v11.18): per 0.8 m cell a splash then a ring growing out and fading over 1.1 s, within ~30 m; it was a bright 0.67 m square per cell for a frame
        'else{normal=-normal;float fo=vBrk*0.6;float trw=mix(exp(-uFogP.x*vFogDepth),exp(-uFogA.w*uFogA.w*vFogDepth*vFogDepth),uFogP.y);winT=smoothstep('+WIN_LO.toFixed(2)+','+WIN_HI.toFixed(2)+',cv)*'+WIN_T.toFixed(2)+'*trw*(1.0-0.3*uRain)*(1.0-fo);diffuseColor.rgb=mix(vec3(0.22,0.46,0.56)*0.3,vec3(0.6,0.62,0.62),fo);if(uRefrOn>0.5){diffuseColor.rgb*=1.0-winT;specularStrength*=1.0-winT;diffuseColor.a=1.0;}else diffuseColor.a=1.0-winT;}}') // v11.51: with the refraction on the underside is opaque and the frame is mixed in by winT in the emissive block below, read through the facet; off, the same share is the fragment's alpha over the frame as drawn // the underside (v11.50, the person on v11.49's window: "like a snowglobe … I just want to look up and see what is going on above me, through a shader"): translucent by the facet's angle to the eye — the sky dome, drawn under water too now, and anything in the air show through by winT (WIN_T straight up, falling to nothing by WIN_LO of cos, × the water's own transmittance to the fragment, since the dome is not fogged; less under rain and foam) over the mirror's colour; each facet its own share, so the surface still moves. The physical window (v11.43–v11.49: Snell's cone, the critical angle, the mirror outside, the sun once) is the `snell window` row on the effects list (uSnell), off by default // the underside is opaque (v11.42.1): outside the window it is a total-internal-reflection mirror, inside it the window's own colour until WATER.md B draws the refracted sky. At 0.62–0.74 the shore and the sky behind it — fogged as air since v11.42 — bled through and flickered as the facets flipped (the person's video: a white flash at the water line); the black dome and the shimmer used to be what showed through
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\nif(!gl_FrontFacing&&uUnder>0.5){vec3 rdw=normalize(vFogPos-uFogC);vec3 R=reflect(rdw,normalize(uFogR*normal));float fd=texture2D(uFloorMap,vFogPos.xz*'+WM_SCALE+'+0.5).r*'+FM_SCALE.toFixed(1)+';float L=min(uFogW.w,(vFogPos.y+fd)/max(-R.y,0.05));vec3 V=normalize(vViewPosition);float rk=uRain*(1.0-smoothstep(10.0,34.0,length(vViewPosition)));vec3 mir=fogVeil(vFogPos,R,L);totalEmissiveRadiance=mix(mir,vec3(0.72,0.75,0.75)*uWin,vBrk*0.6)+vec3(0.80,0.86,0.90)*uWin*rainRing(vWp)*0.5*rk;'+
        'if(uRefrOn>0.5&&winT>0.001){vec2 rp=ripSlopeR(vWp,length(vViewPosition),uTime)*'+REFR_RIP.toFixed(2)+';vec3 Nfw=normalize(normalize(uFogR*normal)+vec3(-rp.x,0.0,-rp.y));vec3 Nfv=normalize(Nfw*uFogR),Nmv=normalize(vNup);vec3 Tf=refract(-V,-Nfv,1.33),Tq=refract(-V,-Nmv,1.33);'+
        'vec2 off=(dot(Tf,Tf)>0.5&&dot(Tq,Tq)>0.5&&Tf.z<-0.05&&Tq.z<-0.05)?(Tf.xy/(-Tf.z)-Tq.xy/(-Tq.z)):(Nmv.xy-Nfv.xy)*0.33/max(V.z,0.3);off*=uRefrRes.zw*uRefrK;float ol=length(off),om='+REFR_MAX.toFixed(3)+'*uRefrRes.y;if(ol>om)off*=om/ol;'+
        'vec2 uv=(gl_FragCoord.xy+off)/uRefrRes.xy;vec2 bx=vec2('+REFR_BLUR.toFixed(2)+'*(0.5+min(length(vViewPosition),120.0)/60.0))/uRefrRes.xy;vec3 thru=(texture2D(uRefr,uv).rgb*2.0+texture2D(uRefr,uv+bx).rgb+texture2D(uRefr,uv-bx).rgb+texture2D(uRefr,uv+vec2(bx.x,-bx.y)).rgb+texture2D(uRefr,uv+vec2(-bx.x,bx.y)).rgb)/6.0;'+
        'totalEmissiveRadiance=totalEmissiveRadiance*(1.0-winT)+thru*winT;}}')
      .replace('#include <lights_fragment_end>','#include <lights_fragment_end>\n'+(Q.cldSh?'if(gl_FrontFacing&&uUnder<0.5){float cs=cloudSh(vFogPos);float ck=clamp(cs/max(1.0-'+CLD_SHADE.toFixed(2)+'*uCld.w,0.05),0.0,4.0);reflectedLight.directDiffuse*=ck;reflectedLight.directSpecular*=ck;}':'')) // the clouds' shadows on the sea (v11.87, clouds.js cloudSh): the topside's direct light — the sun's glitter and the little diffuse — by the deck between the point and the luminary, relative to the shade over the player (the sun light is already the player's own), so the sea under a cloud goes dark and the sea in a gap stays bright while the player stands in shade; the sky's reflection is untouched (the sky is still there)
      // the refraction (v11.51, REFR_* above): the facet's normal in world space tilted by the ripple layer as the glitter's is, back to view space (v*M = Mᵀv); the eye refracted through it and through the mean surface (-N faces the water; eta 1.33); their difference projected to pixels by the focal lengths (uRefrRes.zw) is where this facet shows the frame from, capped; the small-angle 0.33·tilt where either refract fails (past the critical angle); five taps of the frame, the blur wider with distance; the frame's share is winT (the v11.50 window's translucency), the mirror and the foam keep the rest // v11.50.1: the whitecaps were taken off the underside — from 40 m down the wind-aligned streaks were pale lozenges scattered over the surface, read as sparkles (the person, 15 Sep); v11.50.2 struck them from the topside too; the surf (vBrk) still shows from below // rain from below (v11.46, WATER.md K): the drops roughen the surface, so the eye's refraction leans toward the mean surface (Nd: the facets' flip matted by half) and the window toward the sky's mean (the sun's disc smeared), and the drops' rings and dots read as bright specks from beneath (rainRing, within ~30 m); the breaking (vBrk) is a grey patch from below // the window (v11.43, WATER.md B): the eye refracted through the facet into the air (eta 1.33; -normal faces the water) and the sky read in that direction; past the critical angle refract returns zero and the horizon's colour stands in, which the soft band blends into the mirror // the mirror is the veil in the reflected direction (v11.42.3, WATER.md C): the ray reflected off the facet, the water along it as far as the floor (uFloorMap) or the veil's reach, through the fog chunk's own fogVeil. To v11.42.2 it was fogColor·0.9, the CPU's veil at the camera — one flat colour with no daylight by direction and no sun — and with the underside opaque a camera at the line saw the near facets overhead as a dark slab against the sunlit water beside them
      ; // the refracted glint (v8.3–v11.42.4: pow(dot(T,L),40) toward the luminary) is gone in v11.43 — the sun's disc and glare in skyLite, read through the refracted eye, are the glint
  };
  m.customProgramCacheKey=function(){return 'surf';};
  return m;
})();
const surface=new THREE.Mesh(sg,SURF_MAT);surface.frustumCulled=false;scene.add(surface);
const refrMark=(function(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(0),3));const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false}));m.frustumCulled=false;m.renderOrder=0.5;scene.add(m);return m;})(); // the copy's place in the frame (v11.51, REFR_* above): an empty mesh (r128 lists it and returns from renderBufferDirect at its zero-length position) whose onBeforeRender runs in the opaque pass after everything at renderOrder 0 and before the player's body at 1
refrMark.onBeforeRender=function(r,sc,cam){surfaceU.uRefrOn.value=0;if(!FX.refract||surfaceU.uUnder.value<0.5||cam!==camera||r.getRenderTarget()!==null)return;r.getDrawingBufferSize(REFR_V);const w=REFR_V.x|0,h=REFR_V.y|0;if(w<2||h<2)return;refrTex.image.width=w;refrTex.image.height=h;const pm=camera.projectionMatrix.elements;surfaceU.uRefrRes.value.set(w,h,pm[0]*w*0.5,pm[5]*h*0.5);surfaceU.uRefrK.value=REFR_K*FX.refrK;try{r.copyFramebufferToTexture(REFR_V.set(0,0),refrTex);surfaceU.uRefrOn.value=1;}catch(e){}}; // the frame so far (v11.51): copied only under water, only to the screen (the world shadow pass renders the scene to a target and would copy that), sized to the drawing buffer every time (a resize just changes what the next copy allocates); the focal lengths in px from the projection; the uniforms are read when the surface draws, later in the same render
function updateSurface(){surface.position.set(Math.round(camera.position.x/SSTEP)*SSTEP,TIDE,Math.round(camera.position.z/SSTEP)*SSTEP);} // the mesh rides the tide; the shader adds the waves
// ---------- the sky (v11) ----------
// The sky's state this frame, from the clock (world.js: the sun's and the moon's hour angles, the moon's phase, the weather) —
// read by the dome shader, the lights, the fog, the surface and the readout. Nothing here is a place: the whole world sees one sky.
const SKY={sun:V3(0,1,0),moon:V3(0,-1,0),lum:V3(0,1,0),sunAlt:1,moonAlt:-1,illum:1,dayK:1,moonUp:0,moonL:0,skyL:1,skyLw:1,sunL:1,lumL:1,lumLw:1,night:0,cover:0,rain:0,rainA:0,
  zen:[0,0,0],hor:[0,0,0],glow:[0,0,0],sunC:[1,1,1],lumC:[1,1,1],tint:[1,1,1],bow:0,wind:[0,0],windOff:[0,0],starT:0,
  cirrus:0,upperOff:[0,0],cirrC:[1,1,1],plan:PLANETS.map(()=>V3(0,1,0)),spray:0,windK:1,eclS:0,eclL:0,dawn:0,lag:0,cloudHere:0,cellNear:0}; // cloudHere (v11.87): the deck's density over the player along the luminary, what the beam reads // v11.17: the cirrus cover, the upper wind's drift, the cirrus' colour (sunlit after sunset), the planets' directions, the surf's spray at the camera
const WX={},cirrTmp=[0,0,0];
function skyLerp(out,keys,idx,s){let a=keys[0],b=keys[keys.length-1];for(let i=1;i<keys.length;i++)if(s<=keys[i][0]){a=keys[i-1];b=keys[i];break;}
  const u=clamp((s-a[0])/(b[0]-a[0]),0,1),ca=a[idx],cb=b[idx];out[0]=lerp(ca[0],cb[0],u);out[1]=lerp(ca[1],cb[1],u);out[2]=lerp(ca[2],cb[2],u);return out;}
function updateSky(dt){const K=SKY;
  skyDir(sunHA(clockH),K.sun,sunDec(clockH));skyDir(moonHA(clockH),K.moon);K.sunAlt=K.sun.y;K.moonAlt=K.moon.y;K.illum=0.5*(1-K.sun.dot(K.moon)); // the lit fraction from the geometry (v11.17.1; moonIllum(h) was a cosine on the hour, an hour out of step with the conjunctions)
  weatherAt(clockH,WX);updateCells(dt);K.cover=clamp(WX.cover+0.25*K.cellNear,0.08,0.92);K.rainA+=(K.rain-K.rainA)*(1-Math.exp(-0.5*dt)); // v11.88: the rain is the shower cell's at the camera (clouds.js updateCells; WX.rain is only the trigger), the cover lifted a quarter near one; a shower arrives over a few seconds
  // the cloud field's state (v11.87, clouds.js): the threshold by the cover's quantile, the streets while the trades blow, the tops spreading, the giant's cap (the trades over its flank
  // all day, swelling through the afternoon as the land heats), and the cloud over the player — the deck's base along the luminary, eased over a second or so, which the beam reads below
  CLD_S.th=cldThOf(K.cover);CLD_S.street=WX.wind*(1-0.7*K.rainA);CLD_S.rise=CLD.rise*(1-0.6*WX.spread);
  {const lh=(clockH+SOLAR_H0)%DAY_H,aft=smooth(10,19,lh)*smooth(26,21,lh);CLD_S.cap=(0.22+0.20*aft)*(0.4+0.6*WX.wind)*(1-0.5*K.rainA);}
  {const dir=K.sun.y>0.05?K.sun:K.moon;const c=cloudAt(player.pos.x,player.pos.y,player.pos.z,dir);CLD_S.here+=(c-CLD_S.here)*(1-Math.exp(-1.5*dt));K.cloudHere=CLD_S.here;}
  K.cirrus=WX.cirrus;K.upperOff[0]+=Math.cos(UPPER_A)*UPPER_U*dt;K.upperOff[1]+=Math.sin(UPPER_A)*UPPER_U*dt; // the cirrus streams on the upper wind, real time
  for(let i=0;i<PLANETS.length;i++){const e=PLANETS[i][0]*Math.PI/180;skyDir(sunHA(clockH)-e,K.plan[i],TILT*Math.sin(TAU*yearPhase(clockH)-e));} // the wanderers on the ecliptic (v11.83: the sun's track tilted, each at its own longitude's declination)
  // daylight at the surface as a fraction of noon's: the sun's disc is a fiftieth as bright on the horizon, the sky a tenth — in a
  // renderer without exposure the look is what counts: dusk clearly lit and warm at ~0.22, gone by six degrees under
  K.dayK=smooth(-0.12,0.05,K.sunAlt)*0.28+smooth(0,0.4,K.sunAlt)*0.72;
  // the eclipses (v11.17.1; world.js UMBRA_R): the sun's disc covered by the moon's, and the moon's disc in the planet's shadow
  K.eclS=discOverlap(Math.acos(clamp(K.sun.dot(K.moon),-1,1)),SUN_R,MOON_R);K.eclL=discOverlap(Math.acos(clamp(-K.sun.dot(K.moon),-1,1)),MOON_R,UMBRA_R);
  K.dayK*=1-0.97*K.eclS; // totality is deep twilight: the light, the sky's colours below and the stars follow
  K.windK=Math.max(WX.wind,K.rain); // a shower is a gust front (v11.88: the cell's, here)
  K.moonUp=smooth(-0.05,0.25,K.moonAlt);K.moonL=MOONL*K.moonUp*Math.pow(K.illum,1.8)*(1-0.97*K.eclL); // a half moon gives a tenth of a full one's light; an eclipsed moon almost none
  const shade=1-0.30*K.cover-0.20*K.rain; // cloud takes what it takes from the whole sky (v11.18: a shower leaves ~0.52 of noon; it left 0.24, under a full-moon night's 0.31 — 'much worse than nighttime'. The beam still dies under it, below)
  // The night's cloud (v11.34). Rain reached the night twice: weatherAt adds 0.5*rain straight into cover, and the night term then
  // took 0.7 of that off the moon — so a full shower left half of a clear night (0.128 against 0.256, fitted from the person's own
  // readouts), and half of a night is unreadable where half of noon is merely grey. coverN is the cover rain did not put there, and
  // the rain's own share is a gentle 0.15 on top, so a rainy night keeps ~0.75 of a clear one and a clear night is unchanged to the
  // digit (the person, 13 Sep: night itself is 'perfectly fine'; it was the rain). The beam is left alone below: no direct moonlight
  // survives thick cloud, and an overcast sky scatters rather than extinguishes, which is what this term is.
  const coverN=Math.max(0.08,K.cover-0.5*K.rain);
  K.sunL=K.dayK*(1-CLD_SHADE*K.cloudHere)*(1-0.7*K.rain); // the direct beam: gone under a shower; v11.87: by the cloud actually over the player (cloudHere), not the cover — full sun in a gap, shade as a cloud drifts over at the wind's speed (to v11.86: ×(1−0.85·cover^1.5), never full sun under any cloud in the sky, never shade)
  K.skyL=K.dayK*shade+(1-K.dayK)*(K.moonL*(1-0.7*coverN-0.15*K.rain)+STARL);
  // the water's light (v11.23): the sea is lit by the whole sky's downwelling light, and an overcast sky is still a sky — cloud takes
  // its share of the *beam* (the caustics, the shafts, the shadows die with sunL) but little of the diffuse light the water sees; and
  // the renderer has no exposure, so the look is what counts (the person: a shower under water was 'extremely dark'). skyLw is what
  // everything under the water scales by (the veil, the ambient, the depth's daylight); skyL stays the air's and the surface's from above.
  K.skyLw=K.dayK*(1-0.12*K.cover-0.08*K.rain)+(1-K.dayK)*(K.moonL*(1-0.4*coverN-0.08*K.rain)+STARL);
  skyLerp(K.zen,SKYC,1,K.sunAlt);skyLerp(K.hor,SKYC,2,K.sunAlt);skyLerp(K.glow,SKYC,3,K.sunAlt);skyLerp(K.sunC,SKYC,4,K.sunAlt);
  const ml=K.moonL/MOONL*(1-K.dayK); // the moonlit sky: a little brighter and blue
  for(let i=0;i<3;i++){K.zen[i]+=[0.030,0.045,0.080][i]*ml;K.hor[i]+=[0.050,0.060,0.090][i]*ml;}
  const gk=clamp(0.55*K.cover+0.5*K.rain,0,1),gl=K.dayK+ml*0.3; // overcast: toward grey by day, darker by night
  for(let i=0;i<3;i++){K.zen[i]=lerp(K.zen[i],GREYC[i]*0.85*gl+K.zen[i]*0.15,gk*K.dayK)*(1-0.5*gk*(1-K.dayK));K.hor[i]=lerp(K.hor[i],GREYC[i]*1.15*gl+K.hor[i]*0.15,gk*K.dayK)*(1-0.5*gk*(1-K.dayK));K.glow[i]*=1-0.8*gk;}
  // the luminary: the one directional light is the sun by day and the moon by night — whichever gives more
  const sunP=K.sunL,moonP=K.moonL*(1-0.8*K.cloudHere)*(1-0.7*K.rain);
  if(sunP>=moonP){K.lum.copy(K.sun);K.lumL=sunP;for(let i=0;i<3;i++)K.lumC[i]=K.sunC[i];}else{K.lum.copy(K.moon);K.lumL=moonP;for(let i=0;i<3;i++)K.lumC[i]=MOONC[i];}
  K.lumLw=Math.max(K.lumL,0.6*K.dayK*(1-0.12*K.cover-0.08*K.rain)); // the key light under water when the beam is gone: the overcast sky's diffuse light from above (scene.js updateShadow raises the key to the zenith as the beam dies)
  // the light's colour relative to noon, for everything that scales a noon look: warm at dusk, blue-grey by moonlight, grey under rain
  for(let i=0;i<3;i++){const w=K.dayK*(1-0.6*gk);K.tint[i]=(K.sunC[i]/SKYC[4][4][i]*w+MOONC[i]*(1-K.dayK)+[0.9,0.92,0.95][i]*K.dayK*0.6*gk)/(w+(1-K.dayK)+K.dayK*0.6*gk);}
  K.night=Math.max(smooth(-0.02,-0.14,K.sunAlt),0.8*smooth(0.93,1.0,K.eclS))*(1-0.55*K.moonUp*K.illum*(1-K.eclL))*(1-0.9*gk); // how much the stars show: from the sun a degree under to eight (civil twilight's end), washed by the moon and hidden by cloud (v11.17: it was (1-dayK)², which had stars out at sunset with the sun still up)
  K.bow=Math.max(K.rainA,K.cellNear)*K.sunL*smooth(0.66,0.35,K.sunAlt)*smooth(0.0,0.04,K.sunAlt); // v11.88: a cell in reach, and the dome draws the bow only on its curtain (or in the rain here) // a bow needs sun behind you and rain in front; below 42° or there is no bow above the horizon
  {const u=WIND_U*(0.15+0.85*K.windK)*(1+0.8*K.rainA);K.wind[0]=Math.cos(WIND_A)*u;K.wind[1]=Math.sin(WIND_A)*u;} // a calm leaves a breath of the trades
  K.windOff[0]+=K.wind[0]*dt;K.windOff[1]+=K.wind[1]*dt;windOffU.value.set(K.windOff[0]%CAU_GUST[0],K.windOff[1]%CAU_GUST[0]); // the clouds' drift, real time; and the caustic's gusts' (scene.js, v11.39), modulo the gust tile
  K.starT=sunHA(clockH); // the stars turn with the sun (no year is decided: the same stars every night)
  // the cirrus' colour: at CIRRUS_H it stays in the sun until the sun is ~3 degrees under the horizon (the depression for 9.5 km),
  // lit then by the reddened light of a sun that low — the pink after sunset — and by day a white a touch warmer than the sky; unlit it
  // is the night sky's grey, moonlit a little
  {const dep=Math.sqrt(2*CIRRUS_H/6.371e6),cl=smooth(-dep-0.02,-dep+0.02,K.sunAlt),lc=skyLerp(cirrTmp,SKYC,4,K.sunAlt+dep);
    for(let i=0;i<3;i++){const lit=lc[i]*0.78+K.zen[i]*0.30+0.06,nt=K.zen[i]*0.55+K.hor[i]*0.15+MOONC[i]*K.moonL*0.4;K.cirrC[i]=lerp(lerp(nt,lit,cl),K.hor[i]*1.02,gk);}} // v11.87: under an overcast the cirrus goes to the grey sky's own colour (it was ×(1−0.55·gk): brown streaks through the gaps of a shower's deck, seen 24 Sep); unlit, the cirrus is darker than the twilight behind it (a silhouette), not lighter — it was zen·0.9+hor·0.35, a field of pale ticks over the stars (seen 23 Sep)
  // the deck's sunlight (v11.87, clouds.js CLD_S): at CLOUD_H the deck stays in the sun until the sun is ~0.8° under the horizon, lit then from below by the reddened light of a sun that
  // low — the undersides amber and pink at sunset while the tops go grey; by day a white barely warmer than the sky. To v11.86 the deck's lit colour followed the beam's strength, so
  // at sunset the clouds went blue-grey as the sun weakened, the one hour they should be lit
  {const dep=Math.sqrt(2*CLOUD_H/6.371e6);CLD_S.deckL=smooth(-dep-0.015,-dep+0.03,K.sunAlt)*(1-0.5*K.rainA);const lc=skyLerp(cirrTmp,SKYC,4,K.sunAlt+dep),dim=0.55+0.45*smooth(0,0.15,K.sunAlt);for(let i=0;i<3;i++)CLD_S.deckC[i]=lc[i]*dim;} // dim: a sun on the horizon is dimmer than the keyframes' colour says (their red stays 1.0), so the lit sides at sunset are vivid, not noon-bright
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
  uDeckC:{value:new THREE.Vector3(1,1,1)},uDeckL:{value:0},uLump:{value:0},uCld:{value:FOG_CLD},uCldB:{value:FOG_CLDB},uCellA:{value:FOG_CELLA},uCellB:{value:FOG_CELLB},uCldTex:cldTexU,uVolT:{value:new THREE.Vector2(CLOUD_T,CLOUD_T)},uVol:{value:0}, // v11.89 (clouds.js): the atlas, the deck's depth (a plain deck's, the deepest cell's), the volume on // v11.87 (clouds.js): the deck's sunlight and its colour, the lumps' share (the deck fades out under them), the field's state
  uMist:{value:MIST_P},uMistC:{value:MIST_C},uMistW:{value:MIST_W},uPlanD:{value:new Float32Array(9)},uPlanC:{value:new Float32Array(PLANETS.map(p=>[p[1][0],p[1][1],p[1][2],p[2]]).flat())}};
const SKY_VS='varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
// The sky's noise and its clouds as strings (v11.49): the cumulus deck (marched base to top), the scud and the cirrus were inline in SKY_FS; the surface's
// window draws them too now, refracted per facet, so the clouds are seen from under the water (WATER.md item 6 said the window had none — the person, 14 Sep:
// "I can't see the skybox"). cloudDeck(d, zen, hor) is the deck's colour and cover along a world direction, fogged toward the horizon; cirrusA(d) the cirrus'
// alpha. Both read the sky's uniforms (SURF_MAT binds skyU's own objects for them). SKY_FS is the reference for everything else in the dome.
const SKY_NOISE_GLSL=['float h21(vec2 p){p=fract(p*vec2(233.34,851.73));p+=dot(p,p+23.45);return fract(p.x*p.y);}','float h31(vec3 p){return h21(vec2(dot(p,vec3(1.0,57.0,113.0)),dot(p,vec3(7.7,13.3,31.1))));}','float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);float a=h21(i),b=h21(i+vec2(1.0,0.0)),c=h21(i+vec2(0.0,1.0)),d=h21(i+vec2(1.0,1.0));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}','float fbm(vec2 p){float s=0.0,a=0.5;for(int i=0;i<4;i++){s+=a*vn(p);p=p*2.07+vec2(17.3,9.1);a*=0.5;}return s*1.0667;}'].join('\n')+'\n';
// v11.87 (CLOUDS.md §3): the cirrus is thresholded on a coarse field for where it is (sheets ~20 km along the upper wind) and a fine one for its fibres, so half
// cover is fewer streaks, not shorter ones (it was one threshold on the fine field: a sky of dashes at any partial cover, seen 23 Sep). The deck reads the cloud
// field (clouds.js cldN: 3D billow noise in the wind's frame, streets, the lean, the caps; the threshold the cover's quantile) — each slice its own shape, the
// thickness darkening smooth (the old `core`, a third contour of the one map); lit by the sun's real elevation — a high sun lights the tops, a low one the bases
// and the sides toward it, in the deck's own sunlight uDeckC (amber at sunset, when it used to go grey with the beam); a silver lining where thin cloud stands
// near the sun (forward scatter, fw); and the deck fades out within CLD.near of the camera by uLump, where the lumps stand in for it.
const CLOUD_GLSL=['float cirrusA(vec3 d){float up=d.y;float cv=0.0;',
  '  if(uCirr>0.002&&up>0.012){vec2 cq=uCam.xz+d.xz*(uCirrusH/up)+uUpper;vec2 ua=vec2('+Math.cos(UPPER_A).toFixed(4)+','+Math.sin(UPPER_A).toFixed(4)+');vec2 cp=vec2(dot(cq,ua),dot(cq,vec2(-ua.y,ua.x)))*vec2(1.0/7000.0,1.0/1600.0);',
  '    float cov=fbm(cp*0.30+vec2(5.7,1.3));float thc=0.70-0.30*uCirr;float wh=smoothstep(thc,thc+0.16,cov);if(wh>0.002){float fib=fbm(cp)*0.7+0.3*fbm(cp*vec2(1.0,2.5)+vec2(2.3,7.1));cv=wh*smoothstep(0.50,0.76,fib)*0.45*smoothstep(0.012,0.09,up);}}return cv;}',
  'vec4 cloudDeck(vec3 d,vec3 zen,vec3 hor){float up=d.y;float ca=0.0;vec3 cc=vec3(0.0);',
  '  if(up>0.004&&uFxCloud>0.5){float ds0=uCloudH/max(up,0.02);float hf=smoothstep(0.004,0.05,up)*mix(1.0,smoothstep('+CLD.near[0].toFixed(1)+','+CLD.near[1].toFixed(1)+',ds0),uLump);vec2 lm=normalize(uLum.xz+vec2(1e-4,0.0))*180.0;',
  '    vec3 dayLit=mix(zen*2.2+hor*0.8,uDeckC*1.3,uDeckL*0.9),nightLit=zen*1.6+hor*0.6+uLumC*uMoonL*0.30;vec3 litC=mix(nightLit,dayLit,max(uDay,uDeckL));',
  '    vec3 shdC=mix(mix(zen*0.9+hor*0.2,zen*0.42+hor*0.36,uDay),hor*0.5,uRain*0.5);float accA=0.0;vec3 accC=vec3(0.0);float sunUp=clamp(uLum.y*2.5,0.0,1.0);float fw=pow(max(dot(d,uLum),0.0),16.0)*uDeckL*uDay;',
  '    float T=min(uCloudT*(1.0+2.0*cellK(uCam.xz+d.xz*ds0+uCld.xy)),up*800.0);for(int i=0;i<'+Q.cloud+';i++){float fz=(float(i)+0.5)/'+Q.cloud.toFixed(1)+';float ds=(uCloudH+T*fz)/max(up,0.02);vec2 q=uCam.xz+d.xz*ds;float n=cldN(q,q+uCld.xy,fz);float thi=uCld.z+uCldB.z*fz*fz;float c=smoothstep(thi,thi+'+CLD.edge.toFixed(3)+',n);',
  '      if(c>0.003){float n2=cldN(q+lm,q+lm+uCld.xy,fz);float lit=clamp((n-n2)*12.0*(2.0-sunUp)+0.30+0.45*fz*sunUp+0.40*(1.0-fz)*(1.0-sunUp)*uDeckL,0.0,1.0);lit=floor(lit*3.0+0.5)/3.0;float thick=smoothstep(0.0,0.30,n-thi)*(0.45-0.30*fz);',
  '        vec3 ci=(mix(shdC,litC,lit)+uDeckC*fw*(1.0-c)*1.2)*(1.0-thick)*(1.0-0.35*uRain);accC+=(1.0-accA)*c*ci;accA+=(1.0-accA)*c;}if(accA>0.995)break;}',
  '    if(uRain>0.02){float ds=uCloudH*0.45/max(up,0.02);vec2 p=(uCam.xz+d.xz*ds+uWind*1.4)*(1.0/380.0);float n=fbm(p);float c=smoothstep(0.66,0.80,n)*uRain;vec3 sc=shdC*0.8;accC=accC*(1.0-c)+sc*c;accA=accA*(1.0-c)+c;}',
  '    ca=accA*hf;if(ca>0.001){cc=accC/max(accA,1e-3);float fk=1.0-exp(-(uCloudH/max(up,0.02))/9000.0);cc=mix(cc,hor,fk*0.85);}}return vec4(cc,ca);}'].join('\n')+'\n';
// The volume (v11.89, CLOUDS.md §8): the deck marched as a slab of density — the ray's entry and exit of the slab (the base uCldB.w to the deepest top uVolT.y; a camera
// inside it starts at itself: fogged in on the giant's summit), up to Q.vol steps growing with the distance (VOL_DT) with an ordered 4×4 dither of the start (the sky's own dither hides it; a hashed jitter was speckle, a small one bands), the density off the atlas (clouds.js cldDensT), the transmittance by
// VOL_SIG; at every step with cloud two samples toward the luminary (VOL_L1, VOL_L2 m) give the light that reaches it — the sun's share is the mean over the ray's cloud,
// quantised to three steps (the light banded after it has passed through the cloud: terminator lines on a form, not contours of a map), the ambient by the mean height in the
// deck (the base darker); a low sun lights the bases and the sunward sides on its own, since the light samples from a base leave the cloud sideways into clear air; the
// silver lining stays (forward scatter for thin cloud); the whole fogged toward the horizon by the mean distance of what was seen (aerial perspective) and cut under the
// lumps' near fade when they are on. VOL_FAR caps the march: the lowest degrees of the sky ran 45 km through the slab.
const VOL_SIG=1/120,VOL_SIGL=1/150,VOL_L1=120,VOL_L2=300,VOL_FAR=16000,VOL_DT=[30,0.018]; // the extinction per metre of full density (a 300 m path is 92% opaque); the light samples' extinction; the two light samples' distances (m); the march's reach (m); the step: the greater of 45 m and 2.2% of the distance (v11.89: an even step over the slab was 400 m on a low ray and drew the far clouds' sides as stripes)
const VOL_GLSL=['vec4 cloudVol(vec3 d,vec3 zen,vec3 hor){float up=d.y;if(up<0.004||uFxCloud<0.5)return vec4(0.0);float base=uCldB.w-uCam.y,top=base+uVolT.y;if(top<=0.0)return vec4(0.0);',
  '  float t0=base>0.0?base/up:0.0,t1=min(top/up,'+VOL_FAR.toFixed(1)+');if(t1<=t0)return vec4(0.0);float hf=smoothstep(0.004,0.05,up)*mix(1.0,smoothstep('+CLD.near[0].toFixed(1)+','+CLD.near[1].toFixed(1)+',t0),uLump);',
  '  vec2 bq=mod(floor(gl_FragCoord.xy),4.0);float jit=fract(dot(bq,vec2(0.25,0.0625))+0.5*mod(bq.x+bq.y,2.0));float rowW=cldRowW(uCam.xz+d.xz*t0);',
  '  vec3 dayLit=mix(zen*2.2+hor*0.8,uDeckC*1.3,uDeckL*0.9),nightLit=zen*1.6+hor*0.6+uLumC*uMoonL*0.30;vec3 litC=mix(nightLit,dayLit,max(uDay,uDeckL));vec3 shdC=mix(mix(zen*0.9+hor*0.2,mix(zen*0.5+hor*0.45,vec3(0.55,0.57,0.60),0.35),uDay),hor*0.5,uRain*0.5);',
  '  float T=1.0,sA=0.0,sS=0.0,sM=0.0,sT=0.0,fz=0.0,fzl=0.0;vec3 L=uLum;float fw=pow(max(dot(d,uLum),0.0),16.0)*uDeckL*uDay;',
  '  float t=t0;for(int i=0;i<'+Q.vol+';i++){float dt=max('+VOL_DT[0].toFixed(1)+',t*'+VOL_DT[1].toFixed(4)+');float ts=t+jit*dt;t+=dt;if(ts>t1)break;vec3 wp=uCam+d*ts;float dn=cldDensT(wp,rowW,fz);if(dn>0.003){float a=1.0-exp(-dn*dt*'+VOL_SIG.toExponential(4)+');float l1=cldDensT(wp+L*'+VOL_L1.toFixed(1)+',rowW,fzl),l2=cldDensT(wp+L*'+VOL_L2.toFixed(1)+',rowW,fzl);float lt=exp(-(l1*'+VOL_L1.toFixed(1)+'+l2*'+(VOL_L2-VOL_L1).toFixed(1)+')*'+VOL_SIGL.toExponential(4)+');float w=T*a;sA+=w;sS+=w*lt;sM+=w*fz;sT+=w*ts;T*=1.0-a;if(T<0.02)break;}}',
  '  if(sA<0.002)return vec4(0.0);float q=floor(sS/sA*3.0+0.5)/3.0;float amb=0.85+0.3*(sM/sA);vec3 col=mix(shdC*amb,litC,q)+uDeckC*fw*(1.0-sA)*1.2;float fk=1.0-exp(-(sT/sA)/9000.0);col=mix(col,hor,fk*0.85)*(1.0-0.35*uRain);return vec4(col,sA*hf);}'].join('\n')+'\n';
const SKY_FS=[DITHER_PARS,'uniform vec3 uZen,uHor,uGlow,uSunC,uLumC,uCirrC,uSun,uMoon,uLum,uCam,uDeckC;uniform vec2 uWind,uUpper;uniform float uDay,uNight,uCover,uRain,uMoonL,uLumL,uStarT,uTime,uBow,uCloudH,uCloudT,uCirrusH,uCirr,uCamH,uEclS,uEclL,uFxCloud,uDeckL,uLump;',
  'uniform vec4 uMist,uMistC,uMistW,uCld,uCldB,uCellA,uCellB;uniform vec2 uVolT;uniform float uVol;uniform vec3 uPlanD[3];uniform vec4 uPlanC[3];varying vec3 vDir;',
  MIST_GLSL,
  SKY_NOISE_GLSL,CLD_GLSL,CLOUD_GLSL,(Q.vol>0?CLD_VOL_GLSL+VOL_GLSL:'vec4 cloudVol(vec3 d,vec3 zen,vec3 hor){return vec4(0.0);}'),
  'float curtain(vec3 d,inout vec3 col,vec4 C,vec3 shd){if(C.w<0.01||d.y<0.0)return 0.0;vec2 c=C.xy-uCld.xy-uCam.xz;float R=inversesqrt(C.z)*'+SHWR.shaft.toFixed(2)+';float hz=max(length(d.xz),1e-4);vec2 dd=d.xz/hz;float tc=dot(c,dd),h2=dot(c,c)-tc*tc;if(h2>R*R||tc+R<0.0)return 0.0;',
  '  float w=sqrt(R*R-h2),t0=max(tc-w,0.0),t1=min(tc+w,uCloudH*hz/max(d.y,1e-3));if(t1<=t0)return 0.0;float a=(1.0-exp(-(t1-t0)/(hz*'+SHWR.vis.toFixed(1)+')))*C.w*smoothstep(0.0,0.35,1.0-h2/(R*R));float fk=1.0-exp(-t0/9000.0),mh=1.0-exp(-mistRay(uCamH,uCamH+d.y*(t0/hz),t0/hz));col=mix(col,mix(mix(shd*0.9,uHor,fk*0.85),uMistC.rgb,mh),a);return a;}', // a ray\'s ground-distance entry and exit of the shaft (a circle in xz), the exit cut where the ray reaches the base; denser toward the axis; fogged toward the horizon by its distance
  'vec3 rotAx(vec3 v,vec3 ax,float a){float c=cos(a),s=sin(a);return v*c+cross(ax,v)*s+ax*dot(ax,v)*(1.0-c);}',
  // a star: the cell of a 3D grid over the unit sphere holds one at a hashed point, its angular size by its brightness (the chord
  // is the angle at these sizes), a core and a faint halo on the brightest, a twinkle, a tint by hash
  'float star(vec3 s,float N,float thr,float sz,inout vec3 c){vec3 i=floor(s*N);float h=h31(i);if(h<thr)return 0.0;',
  '  vec3 o=vec3(h31(i+7.1),h31(i+3.3),h31(i+5.9))*0.6+0.2;vec3 q=normalize((i+o)/N);float br=(h-thr)/(1.0-thr);float r=sz*(0.5+br);float dd=length(s-q);',
  '  float tw=0.8+0.2*sin(uTime*(2.0+5.0*h31(i+1.7))+h31(i+2.9)*6.28);float v=(1.0-smoothstep(r*0.35,r,dd))*tw*(0.3+0.7*br)+br*br*0.10*exp(-dd*dd/(r*r*12.0));',
  '  float hc=h31(i+4.4);c=hc<0.14?vec3(0.72,0.82,1.0):(hc<0.34?vec3(1.0,0.84,0.66):vec3(1.0));return v;}',
  'void main(){if(uCamH+normalize(vDir).y*'+(FAR*0.94).toFixed(1)+'<0.0)discard;vec3 d=normalize(vDir);float up=d.y;float cs=dot(d,uSun);',
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
  '  col=mix(col,uCirrC,cirrusA(d));',
  // the cumulus deck, marched base to top
  '  vec4 cdk=uVol>0.5?cloudVol(d,uZen,uHor):cloudDeck(d,uZen,uHor);float ca=cdk.a;if(ca>0.001)col=mix(col,cdk.rgb,ca);', // v11.89: the volume, or the slices (the low tier, no atlas, or the `cloud volume` switch off)
  // the showers' rain curtains (v11.88): the shaft under each cell as a vertical cylinder from the sea to the base, the ray's path through it
  '  float cta=0.0;if(uFxCloud>0.5){vec3 shdC=mix(uZen*0.42+uHor*0.36,uHor*0.5,0.5)*(0.85-0.35*uRain);cta=max(curtain(d,col,uCellA,shdC),curtain(d,col,uCellB,shdC));}',
  // the boundary layer seen edge on: the marine haze (and the spray) to infinity, whitening the lowest degrees and glowing toward the light
  '  float hm=(1.0-exp(-mistFar(uCamH,up)))*(1.0-cta);{vec3 hc=uMistC.rgb*(1.0+uMistC.w*pow(max(dot(d,uLum),0.0),6.0));col=mix(col,hc,hm);}', // v11.88: a ray into a rain curtain takes the haze to the curtain, not to infinity (the curtain fogs itself to its own distance)
  // the sun's disc, over the haze (a low sun through haze is still a disc, dimmed and reddened by it) and under the clouds
  '  float disc=smoothstep('+Math.cos(SUN_R*1.3).toFixed(6)+','+Math.cos(SUN_R*0.85).toFixed(6)+',cs)*uDay*(1.0-ca);col=mix(col,uSunC*mix(1.6,1.0,hm),disc*(1.0-mm));col+=uSunC*0.6*exp(-(1.0-cs)*9000.0)*smoothstep(0.9,1.0,uEclS)*(1.0-mm); // the moon over the sun; the corona in totality',
  '  col+=uSunC*(pow(max(cs,0.0),300.0)*0.7+pow(max(cs,0.0),10.0)*0.13)*uDay*(1.0-0.85*ca)*(1.0-0.6*hm);', // the glare, less through the haze (the disc has to read at the horizon)
  // the bow: 42 degrees from the point opposite the sun, violet inside to red outside, and the fainter reversed one at 51
  '  if(uBow>0.002&&up>-0.02){float ang=acos(clamp(dot(d,-uSun),-1.0,1.0));float x=(ang-0.7243)/0.0157;float x2=(0.9076-ang)/0.0175;',
  '    float w=1.0-smoothstep(0.8,1.0,abs(x)),w2=(1.0-smoothstep(0.8,1.0,abs(x2)))*0.35;float xx=w>w2?x:x2;float ww=max(w,w2);',
  '    vec3 rb=vec3(smoothstep(-0.25,0.65,xx),1.0-min(abs(xx)*1.3,1.0),1.0-smoothstep(-0.6,0.35,xx));col+=rb*0.30*ww*uBow*max(cta,uRain)*smoothstep(-0.02,0.1,up)*(1.0-0.6*ca);}', // v11.88: the bow stands on the rain — the curtain along the ray, or the rain here
  '  gl_FragColor=vec4(dithering(col),1.0);}'].join('\n'); // dithered (v11.29): the dusk gradient bands like the deep does
const sky=(function(){const g=new THREE.SphereGeometry(FAR*0.94,24,12);
  const m=new THREE.Mesh(g,new THREE.ShaderMaterial({uniforms:skyU,vertexShader:SKY_VS,fragmentShader:SKY_FS,side:THREE.BackSide,depthWrite:false,fog:false}));m.frustumCulled=false;m.renderOrder=-10;m.visible=false;scene.add(m);return m;})();
function pushSky(){const K=SKY,U=skyU;U.uZen.value.fromArray(K.zen);U.uHor.value.fromArray(K.hor);U.uGlow.value.fromArray(K.glow);U.uSunC.value.fromArray(K.sunC);U.uLumC.value.fromArray(K.lumC);U.uCirrC.value.fromArray(K.cirrC);
  U.uSun.value.copy(K.sun);U.uMoon.value.copy(K.moon);U.uLum.value.copy(K.lum);U.uCam.value.copy(camera.position);U.uWind.value.set(K.windOff[0],K.windOff[1]);U.uUpper.value.set(K.upperOff[0],K.upperOff[1]);
  U.uDay.value=K.dayK;U.uNight.value=K.night;U.uCover.value=K.cover;U.uRain.value=K.rainA;U.uMoonL.value=K.moonL/MOONL;U.uLumL.value=clamp(K.lumL,0,1);U.uStarT.value=K.starT;U.uBow.value=K.bow;U.uCirr.value=K.cirrus;U.uEclS.value=K.eclS;U.uEclL.value=K.eclL;U.uFxCloud.value=FX.clouds?1:0;
  const cy=camera.position.y;U.uCloudH.value=CLOUD_H*(1-0.35*K.rainA)-cy;U.uCloudT.value=CLOUD_T*(WX.deep||1);U.uCirrusH.value=CIRRUS_H-cy;U.uCamH.value=cy-TIDE; // under a shower the base drops and the deck grows to congestus; v11.87: deeper in the still season and on a disturbed day (weatherAt deep)
  U.uDeckC.value.fromArray(CLD_S.deckC);U.uDeckL.value=CLD_S.deckL;U.uLump.value=CLD_S.lump;{let cm=0;for(const c of CELLS)cm=Math.max(cm,c.s);const T0=CLOUD_T*(WX.deep||1);U.uVolT.value.set(T0,T0*(1+2*cm));U.uVol.value=(FX.volume&&Q.vol>0&&cldTexU.value)?1:0;}FOG_CLD[0]=K.windOff[0];FOG_CLD[1]=K.windOff[1];FOG_CLD[2]=CLD_S.th;FOG_CLD[3]=CLD_S.here;FOG_CLDB[0]=CLD_S.street;FOG_CLDB[1]=CLD_S.cap;FOG_CLDB[2]=CLD_S.rise;FOG_CLDB[3]=CLOUD_H*(1-0.35*K.rainA); // the field's state for every shader that reads it (v11.87, clouds.js): the dome, the sea's topside, the land in air; v11.89: the deck's depth and the deepest cell's (uVolT), the volume when the atlas baked and the switch is on (uVol)
  const pd=U.uPlanD.value;for(let i=0;i<3;i++){const v=K.plan[i];pd[i*3]=v.x;pd[i*3+1]=v.y;pd[i*3+2]=v.z;}
  for(let i=0;i<3;i++){FOG_SKA[i]=K.zen[i];FOG_SKB[i]=K.hor[i];FOG_SKC[i]=K.glow[i];FOG_SKD[i]=K.sunC[i];}FOG_SKA[3]=K.dayK;FOG_SKB[3]=K.cover;FOG_SKC[3]=K.moonL/MOONL;FOG_SKE[0]=K.sun.x;FOG_SKE[1]=K.sun.y;FOG_SKE[2]=K.sun.z;FOG_SKF[0]=K.moon.x;FOG_SKF[1]=K.moon.y;FOG_SKF[2]=K.moon.z;} // the same sky for every material's skyLite/skyFar (v11.45, scene.js)
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
  SEA_CHOP=chopU.value=FOG_TC[1]=0.25+0.75*wk;
  MIST_P[0]=HAZE.dens*(1+2.5*rk)*(WX.hazeK||1);MIST_P[1]=1/(HAZE.h*(1+1.5*rk));MIST_P[2]=HAZE.spray*K.spray*K.spray*wk*wk*(1+0.8*rk);MIST_P[3]=1/HAZE.sprayH;MIST_W[0]=TIDE;
  // the vog and the fumarole's plume (v11.17.1) are struck (v11.86: the cone is a cold tuff cone — world.js CONE); the third mist layer is the dawn mist's alone now
  // the dawn mist: clear, calm, sheltered water, the hours round sunrise (the sun's altitude in hours: 15 h of night, 360/30 = 12 deg an hour)
  {const hs=Math.asin(clamp(K.sunAlt,-1,1))*180/Math.PI/12,rising=K.sun.x>0;const win=rising?smooth(MIST_DAWN.from,MIST_DAWN.peak,hs)*smooth(MIST_DAWN.to,MIST_DAWN.peak,hs):0; // K.sun.x>0: the sun is east of the meridian (rising; east is +x)
    K.dawn=win*smooth(0.45,0.15,K.cover)*smooth(0.5,0.1,wk)*K.lag*K.lag;}
  MIST_W[1]=MIST_DAWN.dens*K.dawn;MIST_W[2]=1/MIST_DAWN.h;
  const g=clamp(K.lumL/Math.max(K.skyL,0.02),0,1.2);for(let i=0;i<3;i++)MIST_C[i]=lerp(K.hor[i],0.96*K.tint[i]*K.skyL,HAZE.lift);MIST_C[3]=HAZE.glow*g;}
// The shimmer sprite (v11.6–v11.42.4: an additive glow plane in the light's direction over the surface) is gone in v11.43: the window shows the
// sun itself, refracted through each facet (SURF_MAT, WATER.md B).
// Light shafts (v11.13, POLISH.md 3, the person: "as long as it's not forced and is believably based on appropriate water physics").
// SH_K² tall additive quads (3 × up to 30 m) hanging from SH_TOP under the surface along the refracted sun (SUN_W), on a fixed world
// grid of SH_S m cells round a centre 12 m ahead of the camera toward the sun's azimuth (where rays are seen): a shaft is a function of
// its cell — position, width and phase hashed from (ci, cj) — so when the camera moves the set of cells shifts and the shafts stay put,
// the ones at the edge faded by distance from the centre. Each is turned to face the camera about the vertical; the vertices are
// written on the CPU each frame (SH_N × 4, the snow's way). Alpha per shaft: none over water shallower than 4 m under its top, full at
// 16 (it never reaches the ground: the bottom stops 1.5 m over groundAt); fading within 5 m of the
// camera (so the near plane never slices one). In the shader: a soft width, a profile that rises over the top 14% and decays down
// the length, the fog's extinction only (an additive thing takes no veil, DESIGN). Blended as screen since v11.50.1, see shM.
// Strength: SH_A × the beam's share × the sky's light × wk (hidden the frame the camera is in air, faded in under it, like the shimmer).
// Believability: crepuscular rays through a wave surface, only from a sun that is up and clear, never under a shower.
const SH_K=Q.shafts,SH_N=SH_K*SH_K,SH_S=7.0,SH_L=30,SH_TOP=3,SH_A=0.16,SH_FOC=8; // SH_FOC (v11.39): the depth at which a shaft reads the surface's focusing (scene.js cauFocus) — its brightness is the same field the floor's net is drawn from; the two-sine flicker it had is gone
const shP=new Float32Array(SH_N*12),shA=new Float32Array(SH_N*4),shV=new Float32Array(SH_N*4),shPh=new Float32Array(SH_N*4),shUV=new Float32Array(SH_N*8);
for(let i=0;i<SH_N;i++){const b=i*4;shV[b]=0;shV[b+1]=0;shV[b+2]=1;shV[b+3]=1;shUV.set([0,0,1,0,1,1,0,1],i*8);}
const shI=new Uint16Array(SH_N*6);for(let i=0;i<SH_N;i++){const b=i*4,k=i*6;shI[k]=b;shI[k+1]=b+1;shI[k+2]=b+2;shI[k+3]=b;shI[k+4]=b+2;shI[k+5]=b+3;}
const shG=new THREE.BufferGeometry();shG.setAttribute('position',new THREE.BufferAttribute(shP,3));shG.setAttribute('uv',new THREE.BufferAttribute(shUV,2));shG.setAttribute('aA',new THREE.BufferAttribute(shA,1));shG.setAttribute('aV',new THREE.BufferAttribute(shV,1));shG.setAttribute('aPh',new THREE.BufferAttribute(shPh,1));shG.setIndex(new THREE.BufferAttribute(shI,1));
const shU={uTime:timeU,uCol:{value:new THREE.Color(0.55,0.72,0.8)},uK:{value:0},uFogP:{value:FOG_PS},uFogD:{value:SEA_FOG.dens}};
const shM=new THREE.ShaderMaterial({uniforms:shU,transparent:true,depthWrite:false,depthTest:true,blending:THREE.CustomBlending,blendEquation:THREE.AddEquation,blendSrc:THREE.OneMinusDstColorFactor,blendDst:THREE.OneFactor,side:THREE.DoubleSide, // screen, not additive (v11.50.2): dst+src*(1-dst) — what a shaft adds is scaled by the pixel's distance from white, so it can never clip. Kept as a bound; the person's white patch the shape of a shaft (15 Sep) was the draw order, see renderOrder below (v11.50.3)
  
  vertexShader:'attribute float aA;attribute float aV;attribute float aPh;varying float vA;varying float vV;varying float vPh;varying float vD;varying vec2 vU;\nvoid main(){vA=aA;vV=aV;vPh=aPh;vU=uv;vec4 mv=modelViewMatrix*vec4(position,1.0);vD=length(mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float uTime;uniform vec3 uCol;uniform float uK;uniform vec4 uFogP;uniform float uFogD;varying float vA;varying float vV;varying float vPh;varying float vD;varying vec2 vU;\n'+
    'void main(){float w=1.0-abs(vU.x*2.0-1.0);w*=w;float pr=smoothstep(0.0,0.14,vV)*exp(-vV*2.4);float fl=1.0;'+
    'float d=vD;float tn=exp(-uFogD*uFogD*d*d);float ex=mix(exp(-uFogP.x*d),tn,uFogP.y)'+FOG_CUT_GLSL+';gl_FragColor=vec4(uCol*(uK*vA*w*pr*fl*ex),1.0);}'});
const shafts=new THREE.Mesh(shG,shM);shafts.frustumCulled=false;shafts.renderOrder=0;shafts.visible=false;scene.add(shafts); // renderOrder 0 (v11.50.3; was -3): after the surface, which is -1 under water and writes depth. Drawn before it, a shaft was erased wherever the surface was drawn over it — the whole far water above the horizon line — and survived only on the far kelp crowns and the floor, which sit in front of the surface: the person's white patch the shape of a shaft, made of crowns (15 Sep). After the surface its light lies over the water and the crowns alike; before the fume and the rain (2)
function shHash(i,j,k){let n=(Math.imul(i,73856093)^Math.imul(j,19349663)^Math.imul(k,83492791))|0;n=Math.imul(n^(n>>>13),1274126177);n=(n^(n>>>16))>>>0;return n/4294967296;}
function updateShafts(above,wk){
  const K=SKY,on=!above&&SUN_W[3]>0.02&&wk>0.01&&K.skyL>0.01&&FX.shafts;shafts.visible=on;if(!on)return;
  const sx=SUN_W[0],sy=Math.max(SUN_W[1],0.2),sz=SUN_W[2],hl=Math.hypot(sx,sz),ax=hl>1e-4?sx/hl:0,az=hl>1e-4?sz/hl:0;
  const px=camera.position.x,pz=camera.position.z,cx=px+ax*12,cz=pz+az*12,top=TIDE-SH_TOP,ci0=Math.floor(cx/SH_S)-((SH_K-1)>>1),cj0=Math.floor(cz/SH_S)-((SH_K-1)>>1),R=SH_K*SH_S;
  let n=0;
  for(let jj=0;jj<SH_K;jj++)for(let ii=0;ii<SH_K;ii++){const ci=ci0+ii,cj=cj0+jj,x=(ci+0.15+0.7*shHash(ci,cj,1))*SH_S,z=(cj+0.15+0.7*shHash(ci,cj,2))*SH_S,w=2+2*shHash(ci,cj,3);
    const g=groundAt(x,z),avail=top-g-1.5,len=Math.min(SH_L,Math.max(avail,0.1));
    let a=clamp((avail-4)/12,0,1)*(1-smooth(R*0.32,R*0.5,Math.hypot(x-cx,z-cz)))*smooth(1.5,5,Math.hypot(x-px,z-pz));
    const bx=x-sx/sy*len,bz=z-sz/sy*len,vx=px-x,vz=pz-z,vl=Math.max(Math.hypot(vx,vz),1e-3),rx=-vz/vl*w*0.5,rz=vx/vl*w*0.5,b=n*4,k=n*12;
    shP[k]=x-rx;shP[k+1]=top;shP[k+2]=z-rz;shP[k+3]=x+rx;shP[k+4]=top;shP[k+5]=z+rz;shP[k+6]=bx+rx;shP[k+7]=top-len;shP[k+8]=bz+rz;shP[k+9]=bx-rx;shP[k+10]=top-len;shP[k+11]=bz-rz;
    if(a>0)a*=clamp(0.25+0.5*cauFocus(x,z,SH_FOC,t),0.2,1.6); // the surface's focusing over this shaft (v11.39)
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
function updateRain(dt,above){const K=SKY,on=above&&K.rainA>0.02&&FX.rain&&FX.clouds;rainL.visible=on;if(!on)return;
  const cx=camera.position.x,cy=camera.position.y,cz=camera.position.z,vx=K.wind[0]*0.5,vz=K.wind[1]*0.5,R=RAIN_R,W=2*R;
  for(let i=0;i<RAIN_N;i++){const q=i*5,vy=-rainQ[q+3],L=rainQ[q+4];let x=rainQ[q]+vx*dt,y=rainQ[q+1]+vy*dt,z=rainQ[q+2]+vz*dt;
    if(x>R)x-=W;else if(x<-R)x+=W;if(z>R)z-=W;else if(z<-R)z+=W;if(y<-6)y+=18;
    rainQ[q]=x;rainQ[q+1]=y;rainQ[q+2]=z;const k=i*6;rainP[k]=cx+x;rainP[k+1]=cy+y;rainP[k+2]=cz+z;rainP[k+3]=cx+x-vx*L;rainP[k+4]=cy+y-vy*L;rainP[k+5]=cz+z-vz*L;}
  rainG.attributes.position.needsUpdate=true;const c=0.5+0.45*Math.min(1,K.skyL);rainM.uniforms.uCol.value.setRGB(c*0.9,c*0.95,c);rainM.uniforms.uOp.value=0.6*K.rainA;} // lit by the sky: grey by day, dim by night
// Under water the "sky" is the fog itself: a black dome just inside the far plane, fogged like everything else, so the last
// of the water in every direction is the water's colour there (the map) at its daylight — dark toward the deep, sunlit
// toward the shallows and the surface — instead of one flat background colour with a visible edge against the surface.
// The dome is the water's far wall, on both sides of the water (v11.42.3): black, fogged by the chunk into the veil in every direction, drawn only
// below the water level (its fragments above it are discarded), while the sky sphere is drawn only above it (SKY_FS discards a direction whose
// point at its radius lies under the water). The two tile at the water plane at the far plane. Until v11.42.3 the sky was a whole sphere and the
// dome was hidden in air: from above, and from within SKY_NEAR of the surface (v11.42), the sky's lower half showed wherever the far terrain
// was clipped by the draw distance — a white band under the horizon just beneath the surface line, the "white nothingness" the far kelp stood
// against in the person's stills, gone the moment the camera went below SKY_NEAR.
const waterDome=(function(){const mat=new THREE.MeshBasicMaterial({color:0x000000,side:THREE.BackSide,depthWrite:false});mat.onBeforeCompile=function(sh){sh.fragmentShader=sh.fragmentShader.replace('#include <fog_fragment>','\n#ifdef USE_FOG\nif(vFogPos.y>uFogW.x)discard;\n#endif\n#include <fog_fragment>');};mat.customProgramCacheKey=function(){return 'dome';};const m=new THREE.Mesh(new THREE.SphereGeometry(FAR*0.95,24,12),mat);m.frustumCulled=false;m.renderOrder=-11;scene.add(m);return m;})();

// ---------- marine snow (v11.24) ----------
// What is in the water, by what the column is doing (the person's ask, 10 Sep: the stuff at the bottom of the world is not the stuff
// at the top). Marine snow is not one thing evenly spread: it is five populations, each with a source, a sink and a size, and
// the column is layered by density, so it is sparse in the middle and piles up at the interfaces. Five kinds (SN_K):
//   live   — the lit layer's own life and its finest debris: tiny, all but weightless (0.5 cm/s), stirred by the wind's turbulence in
//            the mixed layer. Since v11.82 (PLANKTON.md §9, pass 2) its weight is the plankton field's crop at the point (world.js bloomC
//            off the maps' texel, far.js wmBloom: the ring, the lee, the fed flank, the deep maximum at 95 and the thermocline's pile
//            appear in the snow for free) and its colour is the mix of the three pigment kinds winning there — green on the shelf, gold on
//            the flank, plum in the deep maximum, pale where the water is poor. To v11.81 it was a smooth function of depth and `nut`.
//   chain  — v11.82: two or three points seeded adjacent and falling together — diatom-like chains, faecal strings, the discarded mucus
//            houses of filter-feeding drifters (the biggest single contributor to real marine snow); where the life is, a share of it.
//            An untextured point is always square, so this is the only way to a thing two pixels long without a texture fetch or a
//            discard. The followers ride the leader's eddy phase (snL) and are re-rolled when it changes kind or parks.
//   floc   — the snow proper: the aggregates (dead cells, mucus, pellets) that form under the lit layer and sink through the
//            dark. Fewer with depth as bacteria eat them (the Martin curve, flux ~ (d/90)^-0.86), bigger and browner as the
//            small ones go; a thin layer on the thermocline (-64) and the particle maximum at the chemocline (-450: iron and
//            manganese come out of solution at the redox edge — the Black Sea has this layer), rusty in the last 25 m above the
//            plate, milky in it. Gone below the chemocline. (The canopy's floc boost went with the canopy, v11.81.)
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
// a frame: the fields and the floor re-read) when its kind has faded where it has sunk to, or it was dormant.
// Fall rates are a compromise with the eye: real aggregates do 50-200 m a day (2 mm/s, motionless to a swimmer); 8 cm/s (the
// old rate, 7 km a day) read as a snowfall. These are ~10× reality and read as slow.
// Drawn as one Points with a per-point colour (the particle's own), size and alpha (aSz), lit by the material colour (the ambient
// by depth and daylight, updateAtmosphere) plus the player's light by distance — so the snow shows in a torch's reach in the
// dark and is invisible outside it. The shader patch reads r128's points chunks; if a line isn't found it warns and the snow
// draws uniform (the old look) rather than not at all.
const PN=Q.snow,SN_SW=Math.min(480,Math.floor(PN*0.25)),SN_SWN=6,SN_SWP=SN_SW/SN_SWN,PN_SN=PN-SN_SW,SN_HW=30,pp=new Float32Array(PN*3),pv=new Float32Array(PN*3),pc=new Float32Array(PN*3),ps=new Float32Array(PN*2),pk=new Uint8Array(PN),pr=new Float32Array(PN),ph=new Float32Array(PN),pf=new Float32Array(PN*10),snL=new Uint16Array(PN); // pf (v11.82): the six fields, then the maps' texel (the two crops, X, the floor); snL: a chain follower's leader (its own index otherwise)
const SN_K=[{sz:0.5,fall:0.005},{sz:1.0,fall:0.02},{sz:0.6,fall:0.05},{sz:0.55,fall:-0.28},{sz:1.35,fall:0.006},{sz:0.5,fall:0.012}]; // size × the material's, m/s down; 5 the chain (v11.82)
const SN_PIG=[[0.70,0.86,0.62],[0.86,0.78,0.48],[0.78,0.62,0.68]],SN_PALE=[0.82,0.90,0.78],SN_CHAIN=[0.80,0.78,0.66],SN_CK=0.6,SN_CHW=0.12;
// The swarm block (v11.84, PLANKTON.md §10): the last SN_SW points of the snow's own buffer are the swarms' — SN_SWN swarms nearest the camera
// within SW_SEE get SN_SWP points each, drawn with the same material and the kinds' colours a shade warmer and bigger (SW_SZ), so what tells a
// swarm from the snow is motion and density: the points hold an offset in the cloud (swOff, a slowly turning jitter), relax back to it after the
// flow round a body scatters them (the same FLOW the snow reads), and the whole cloud rises and sinks with its record (creatures_ai.js updateSwarm).
// A swarm that leaves the reach or the world gives its block back; an unassigned block parks at the camera like a parked point.
const SW_SEE=160,SW_SZ=1.7,swAt=new Array(SN_SWN).fill(null),swOff=new Float32Array(SN_SW*3),swSeed=new Float32Array(SN_SW);let swT=0;const SW_COL=[[0.78,0.90,0.66],[0.92,0.82,0.50],[0.84,0.66,0.72]]; // the cloud's radius is swarmR (creatures_ai.js SW_R, v11.85: the intake reads the same volume); SW_COL the kinds' colours for a swarm
function swAssign(){ // every half second: the nearest swarms take the blocks, the rest give theirs back
  const cx=camera.position.x,cy=camera.position.y,cz=camera.position.z,near=[];
  for(const c of creatures){if(c.def.role!=='swarm'||!c.alive)continue;const dd=len3(c.pos.x-cx,c.pos.y-cy,c.pos.z-cz);if(dd<SW_SEE)near.push([dd,c]);}
  near.sort((a,b)=>a[0]-b[0]);const keep=new Set(near.slice(0,SN_SWN).map(e=>e[1]));
  for(let k=0;k<SN_SWN;k++)if(swAt[k]&&!keep.has(swAt[k]))swAt[k]=null;
  for(const [,c] of near.slice(0,SN_SWN)){if(swAt.indexOf(c)>=0)continue;const k=swAt.indexOf(null);if(k<0)break;swAt[k]=c;swBlock(k,c);}
}
function swBlock(k,c){ // a block seeded for a swarm: offsets in a flattened cloud, the kind's colour, a bigger size; the points start at the cloud
  const R=swarmR(c),col=SW_COL[c.pig||0];
  for(let m=0;m<SN_SWP;m++){const i=PN_SN+k*SN_SWP+m,a=Math.random()*TAU,u=Math.random()*2-1,rr=R*Math.cbrt(Math.random()),s=Math.sqrt(1-u*u);
    swOff[(i-PN_SN)*3]=rr*s*Math.cos(a);swOff[(i-PN_SN)*3+1]=rr*u*0.45;swOff[(i-PN_SN)*3+2]=rr*s*Math.sin(a);swSeed[i-PN_SN]=Math.random()*TAU;
    pp[i*3]=c.pos.x+swOff[(i-PN_SN)*3];pp[i*3+1]=c.pos.y+swOff[(i-PN_SN)*3+1];pp[i*3+2]=c.pos.z+swOff[(i-PN_SN)*3+2];pv[i*3]=pv[i*3+1]=pv[i*3+2]=0;
    const j=(Math.random()-0.5)*0.08;pc[i*3]=col[0]+j;pc[i*3+1]=col[1]+j;pc[i*3+2]=col[2]+j;ps[i*2]=SW_SZ*(0.7+0.6*Math.random());ps[i*2+1]=0.85;pk[i]=254;snL[i]=i;}
  snDirty=true;
} // the live kind's colour by pigment kind (green, gold, red) and in poor water; the chain's; the crop (mg/m³) at which the live kind is half its full weight; the chains' share of the live weight
const SN_TH=-64,SN_CH=CHEMO,SN_W0=0.9,SN_GAIN=3.0,SN_REF=63; // the thermocline, the chemocline (y); the weight that fills the count; weight → alpha; the refresh mask (one point in 64 a frame: a point re-rolls about once a second)
const pg=new THREE.BufferGeometry();pg.setAttribute('position',new THREE.BufferAttribute(pp,3));pg.setAttribute('color',new THREE.BufferAttribute(pc,3));pg.setAttribute('aSz',new THREE.BufferAttribute(ps,2));
const plU={value:new THREE.Vector4(0,0,0,0)},plCU={value:new THREE.Color(0x6fbfe0)},snAU={value:new THREE.Vector4(0,1/2.5,0,0)}; // snAU (v11.82.1): the tide, 1/the depth the snow fades over seen from the air, 1 with the camera in air
// square on purpose (the person, 13 Sep 2026): an untextured PointsMaterial writes the whole quad, and a round sprite would cost a
// texture fetch per fragment or a discard — squares are both the cheaper option and the one that suits the flat-shaded art
const pm=new THREE.PointsMaterial({color:0xcfe6ee,size:0.14,transparent:true,opacity:0.55,depthWrite:false,vertexColors:true});
pm.onBeforeCompile=function(sh){sh.uniforms.uPL=plU;sh.uniforms.uPLc=plCU;sh.uniforms.uSnA=snAU;let n=0;
  sh.vertexShader=sh.vertexShader.replace('uniform float size;',()=>{n++;return 'attribute vec2 aSz;uniform vec4 uPL;uniform vec4 uSnA;varying float vA;varying float vL;uniform float size;';})
    .replace('gl_PointSize = size;',()=>{n++;return 'gl_PointSize=size*aSz.x;vA=aSz.y*smoothstep(0.5,2.0,-mvPosition.z)*mix(1.0,exp(-max(uSnA.x-transformed.y,0.0)*uSnA.y),uSnA.z);{vec3 dl=transformed-uPL.xyz;vL=uPL.w/(0.5+dot(dl,dl));}';})
    .replace('#include <logdepthbuf_vertex>',()=>{n++;return 'gl_PointSize=min(gl_PointSize,24.0);\n#include <logdepthbuf_vertex>';});
  sh.fragmentShader=sh.fragmentShader.replace('uniform vec3 diffuse;',()=>{n++;return 'varying float vA;varying float vL;uniform vec3 uPLc;uniform vec3 diffuse;';})
    .replace('#include <color_fragment>',()=>{n++;return 'diffuseColor.rgb=vColor*(diffuse+uPLc*vL);diffuseColor.a*=vA;';});
  if(n!==5)console.warn('snow: points chunks not as expected ('+n+' of 5); the snow draws uniform');};
pm.customProgramCacheKey=function(){return 'snow';};
const plankton=new THREE.Points(pg,pm);plankton.frustumCulled=false;scene.add(plankton);
const snF=new Float32Array(NF),snW=[0,0,0,0,0,0],snB=[0,0,0,0],snC=[0,0,0],snLast=V3(1e9,0,0);let snFrame=0,snCi=-1,snCy=0; // snB, snC: the maps' texel and the crops at the point being weighed (snCrop); snCi/snCy: which point and height they hold // snLast: the camera last frame — a jump (spawn, the zoo, a respawn) reseeds the whole cloud at once
function snGauss(u){return Math.exp(-u*u);}
// the crops at point i at height y (world.js bloomC off the texel cached at its seed), once per point and height: snC = [green, gold, red], returns their sum
function snCrop(i,y){if(i!==snCi||y!==snCy){const b=i*10;snB[0]=pf[b+6];snB[1]=pf[b+7];snB[2]=pf[b+8];bloomC(snB,pf[b+9],TIDE-y,snC);snCi=i;snCy=y;}return snC[0]+snC[1]+snC[2];}
// the kind's weight at a point: y and the point's cached conditions (pf: sub, flow, expo, nut, heat, shel, then the maps' texel; ph: the floor)
function snowW(k,i,y){const b=i*10,d=TIDE-y,hf=y-ph[i];if(d<0.3||hf<0)return 0;
  switch(k){
    case 0:{const C=snCrop(i,y);return 0.12*smooth(200,20,d)+0.9*C/(C+SN_CK)*(1+0.5*snGauss((y-SN_TH)/6));} // v11.82: the field's crop here (the vertical is bloomC's), a floor of the finest debris in lit water, the thermocline's pile
    case 5:return SN_CHW*snowW(0,i,y);
    case 1:{const form=smooth(4,45,d),martin=Math.pow(Math.max(d,90)/90,-0.86);
      return (0.4+0.6*pf[b+3])*(form*martin+0.9*snGauss((y-SN_TH)/6)+1.6*snGauss((y-SN_CH)/7))*0.9*smooth(SN_CH-15,SN_CH,y);}
    case 2:{const stir=pf[b+2]*(0.35+0.65*SEA_CHOP)*(0.3+0.7*Math.exp(-hf/12)),bed=(0.15+0.85*pf[b+1])*(1.2*Math.exp(-hf/6)+0.4*Math.exp(-hf/30)),lag=0.4*pf[b+5]*Math.exp(-hf/10); // the bed: a sharp layer in the bottom few metres inside the thicker bottom mixed layer
      return (1-pf[b])*(stir+bed+lag)*(1+0.5*pf[b+4]);}
    case 3:return Math.max(pf[b+2]*(0.3+0.7*SEA_CHOP),0.25*smooth(0.45,1,SEA_CHOP))*Math.exp(-d/2.2)+0.35*SKY.rainA*Math.exp(-d/1.2);
    case 4:return 0.45*smooth(SN_CH+2,SN_CH-14,y)+pf[b+4]*1.3*Math.exp(-hf/70);
  }return 0;}
// (re)seed point i at x,y,z: read the conditions there, pick a kind by the weights (or park it), colour and size it. y is
// moved into the water if it was in air or under the floor; if there is no water in the box's column there, the point parks.
// `keep`: a refresh of a live point — its velocity and look stay if it draws the same kind again (no pop).
let snDirty=true;
// a chain's followers (the next one or two points, snL === the leader) re-rolled where they are, when the leader changes
function snFree(i){for(let m=1;m<=2;m++){const j=i+m;if(j<PN&&snL[j]===i){snL[j]=j;snowSeed(j,pp[j*3],pp[j*3+1],pp[j*3+2]);}}}
function snowSeed(i,x,y,z,keep){
  const ch=chunkAt(x,z),b=i*10,k0=keep?pk[i]:255;let f,h;if(ch){f=ch.f(x,z);h=ch.h(x,z);}else{const s=sample(x,z,snF);f=s.f;h=s.h;}
  pf[b]=f[FI.sub];pf[b+1]=f[FI.flow];pf[b+2]=f[FI.expo];pf[b+3]=f[FI.nut];pf[b+4]=f[FI.heat];pf[b+5]=f[FI.shel];ph[i]=h;wmBloom(x,z,snB);pf[b+6]=snB[0];pf[b+7]=snB[1];pf[b+8]=snB[2];pf[b+9]=snB[3];snCi=-1; // the maps' texel for the crop (v11.82; the canopy's weight sat here to v11.80)
  if(snL[i]!==i)snL[i]=i;else if(!keep)snFree(i); // a re-rolled point is its own; a leader that leaves the box frees its followers (they re-roll where they are); a refresh frees them only if it changes kind (below)
  const cy=camera.position.y,lo=Math.max(cy-SN_HW,h+0.3),hi=Math.min(cy+SN_HW,TIDE-0.4);
  const park=()=>{pk[i]=255;pp[i*3]=camera.position.x;pp[i*3+1]=cy;pp[i*3+2]=camera.position.z;ps[i*2+1]=0;snFree(i);}; // parked at the camera: clipped by the near plane
  if(hi<=lo){park();return;}
  if(y<lo||y>hi)y=lo+Math.random()*(hi-lo);
  let W=0;for(let k=0;k<6;k++){snW[k]=snowW(k,i,y);W+=snW[k];}
  if(Math.random()*SN_W0>=W){park();return;} // parked: sparse water here
  let k=0,acc=snW[0];const pick=Math.random()*W;while(k<5&&pick>acc){k++;acc+=snW[k];}
  if(k0===5&&k!==5)snFree(i); // the chain's leader became something else: its followers re-roll
  pk[i]=k;pp[i*3]=x;pp[i*3+1]=y;pp[i*3+2]=z;ps[i*2+1]=Math.min(1,snW[k]*SN_GAIN);if(k===k0)return; // the alpha is set here, at the seed and the refresh, not every frame: it moves as slowly as the point sinks. A refresh that drew the same kind keeps the point's look
  pr[i]=Math.random();pv[i*3]=pv[i*3+1]=pv[i*3+2]=0;snDirty=true;
  const d=TIDE-y,q=pr[i],j=(q-0.5)*0.1;let cr,cg,cb;
  if(k===0||k===5){const C=snCrop(i,y),sat=C/(C+0.5)*(k===5?0.5:1),P=k===5?SN_CHAIN:SN_PALE;let mr=0,mg=0,mb=0;if(C>1e-6)for(let m=0;m<3;m++){const w=snC[m]/C,S=SN_PIG[m];mr+=w*S[0];mg+=w*S[1];mb+=w*S[2];}cr=lerp(P[0],mr,sat);cg=lerp(P[1],mg,sat);cb=lerp(P[2],mb,sat);} // v11.82: the mix of the kinds winning here, pale where the water is poor
  else if(k===1){const dk=smooth(60,260,d),ru=smooth(SN_CH+32,SN_CH+10,y),mk=snGauss((y-SN_CH)/7);
    cr=lerp(lerp(lerp(0.86,0.6,dk),0.72,ru),0.92,mk);cg=lerp(lerp(lerp(0.86,0.56,dk),0.44,ru),0.92,mk);cb=lerp(lerp(lerp(0.82,0.48,dk),0.26,ru),0.88,mk);}
  else if(k===2){const sd=smooth(0.05,0.33,pf[b]),ht=pf[b+4];cr=lerp(lerp(0.5,0.7,sd),0.25,ht);cg=lerp(lerp(0.47,0.68,sd),0.23,ht);cb=lerp(lerp(0.42,0.5,sd),0.22,ht);}
  else if(k===3){cr=cg=cb=1;}
  else{const ht=pf[b+4];if(ht>0.05&&q>0.7){cr=cg=0.85;cb=0.83;}else{cr=lerp(0.09,0.28,ht);cg=lerp(0.10,0.27,ht);cb=lerp(0.12,0.27,ht);}}
  pc[i*3]=cr+j;pc[i*3+1]=cg+j;pc[i*3+2]=cb+j;ps[i*2]=SN_K[k].sz*(0.7+0.6*q);
  if(k===5){const n=q<0.5?1:2,a=Math.random()*TAU,c=Math.random()*2-1,s=Math.sqrt(1-c*c),dx=s*Math.cos(a)*0.28,dy=c*0.28,dz=s*Math.sin(a)*0.28; // the chain (v11.82): one or two followers strung along a random direction, sharing the leader's look, fall and eddy
    for(let m=1;m<=n;m++){const j=i+m;if(j>=PN)break;if(snL[j]!==j&&snL[j]!==i)continue;pk[j]=5;snL[j]=i;pp[j*3]=x+dx*m;pp[j*3+1]=y+dy*m;pp[j*3+2]=z+dz*m;pv[j*3]=pv[j*3+1]=pv[j*3+2]=0;pr[j]=q;ph[j]=h;for(let c2=0;c2<10;c2++)pf[j*10+c2]=pf[b+c2];pc[j*3]=pc[i*3];pc[j*3+1]=pc[i*3+1];pc[j*3+2]=pc[i*3+2];ps[j*2]=ps[i*2];ps[j*2+1]=ps[i*2+1];}}
}
for(let i=0;i<PN;i++){pk[i]=255;snL[i]=i;pf.fill(0,i*10,i*10+10);} // all parked until the first frame under water seeds them where the camera is; the swarm block (i ≥ PN_SN) is assigned by swAssign
function updatePlankton(dt){
  const cx=camera.position.x,cy=camera.position.y,cz=camera.position.z,kd=Math.exp(-2.5*dt),kf=Math.min(1,8*dt),K=SKY;
  currentAt(cx,cz,cy,CURV);const cux=CURV.x*dt,cuz=CURV.z*dt; // the snow drifts with the current
  const w0=WAVES[0],w1=WAVES[1],e0=w0.A*w0.w,e1=w1.A*w1.w,t0=w0.w*t-w0.ph,t1=w1.w*t-w1.ph,wind=0.35+0.65*K.windK;
  snFrame++;const ref=snFrame&SN_REF;
  swT-=dt;if(swT<=0){swT=0.5;swAssign();}
  if(Math.abs(cx-snLast.x)+Math.abs(cy-snLast.y)+Math.abs(cz-snLast.z)>SN_HW){for(let i=0;i<PN_SN;i++)snowSeed(i,cx+(Math.random()-0.5)*2*SN_HW,cy+(Math.random()-0.5)*2*SN_HW,cz+(Math.random()-0.5)*2*SN_HW);}snLast.set(cx,cy,cz);
  for(let i=0;i<PN;i++){
    const k=pk[i],b=i*10;
    if(i>=PN_SN){const sw=swAt[Math.floor((i-PN_SN)/SN_SWP)];if(!sw||!sw.alive||(i-PN_SN)%SN_SWP>=swarmShare(sw)*SN_SWP){pp[i*3]=cx;pp[i*3+1]=cy;pp[i*3+2]=cz;ps[i*2+1]=0;continue;} // the swarm block (v11.84): parked when its swarm is gone — or eaten (v11.85: a swarm draws the share of its points its flesh leaves, so a cloud thins as a filter feeder works through it)
      let x=pp[i*3],y=pp[i*3+1],z=pp[i*3+2],vx=pv[i*3]*kd,vy=pv[i*3+1]*kd,vz=pv[i*3+2]*kd;
      for(let bb=0;bb<flowN;bb++){const f=FLOW[bb],rx=x-f.x;if(rx>f.a4||rx<-f.a4)continue;const ry=y-f.y,rz=z-f.z,r2=rx*rx+ry*ry+rz*rz;if(r2>f.a4*f.a4)continue;const a=f.a;let r=Math.sqrt(r2),fx=0,fy=0,fz=0;if(r<a*0.9){const q=(a*0.9-r)*8;r=Math.max(r,1e-3);fx+=rx/r*q;fy+=ry/r*q;fz+=rz/r*q;r=a*0.9;}const inv=a*a*a/(2*r*r*r),ur=(f.ux*rx+f.uy*ry+f.uz*rz)/(r*r),dr=Math.exp(-(r-a)/(0.35*a))*0.6;fx+=inv*(3*ur*rx-f.ux)+f.ux*dr;fy+=inv*(3*ur*ry-f.uy)+f.uy*dr;fz+=inv*(3*ur*rz-f.uz)+f.uz*dr;vx+=(fx-vx)*kf;vy+=(fy-vy)*kf;vz+=(fz-vz)*kf;} // scattered by a body, as the snow is
      const o=(i-PN_SN)*3,ph=swSeed[i-PN_SN]+t*0.6,tx=sw.pos.x+swOff[o]+0.6*Math.sin(ph),ty=sw.pos.y+swOff[o+1]+0.25*Math.cos(ph*1.3),tz=sw.pos.z+swOff[o+2]+0.6*Math.cos(ph*0.8); // its place in the cloud, jittering
      const kk=Math.min(1,1.5*dt);x+=(tx-x)*kk+vx*dt;y+=(ty-y)*kk+vy*dt;z+=(tz-z)*kk+vz*dt;pp[i*3]=x;pp[i*3+1]=y;pp[i*3+2]=z;pv[i*3]=vx;pv[i*3+1]=vy;pv[i*3+2]=vz;ps[i*2+1]=y>TIDE-0.3||y<groundAt(x,z)?0:0.85;continue;}
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
    let ux=0,uz=0,uy=0;if(amp>0.004){const ang=snL[i]*0.37+t*(0.5+0.4*q),sa=Math.sin(ang),ca=Math.cos(ang);ux=amp*sa;uz=amp*ca*(q<0.5?1:-1);uy=0.4*amp*ca*(q<0.25||q>0.75?1:-1);} // an eddy per point at its own rate, two trig; none for the still water of the deep
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
    if((i&SN_REF)===ref&&snL[i]===i)snowSeed(i,x,y,z,true);else if(y>TIDE-0.3||y<ph[i])ps[i*2+1]=0; // a chain's follower is not refreshed on its own: it goes when its leader does (snFree) // out of the water or into the floor between refreshes: hidden // the refresh: every point re-rolls where it is (keeping its look if the kind holds), so the live share tracks the water's density and a point that has sunk out of its layer changes kind
  }
  pg.attributes.position.needsUpdate=true;pg.attributes.aSz.needsUpdate=true;if(snDirty){pg.attributes.color.needsUpdate=true;snDirty=false;}
  plU.value.set(plight.position.x,plight.position.y,plight.position.z,plight.intensity*1.6);
}

const fogTarget=new THREE.Color(),hemiSkyA=new THREE.Color(AIR.hemiSky),hemiGroundA=new THREE.Color(AIR.hemiGround),wmHere=[0,0,0,0],skyT=new THREE.Color(),skyT2=new THREE.Color(),WHITE=new THREE.Color(1,1,1);
let curDepth=-1,wasAbove=null,snapMed=true; // snapMed: the next medium change is instant (boot, respawn), not a crossfade
// One density per medium, both media in every shader (v11.42, the two-segment fog): the sea's sets (big-thing, small-thing, the surface's own —
// scene.js) and the air's (FOG_A) are written together; the ray decides per fragment. Called every frame in air (the haze thickens with rain), on
// a crossing, and by the readout's fog tuner (main.js). `above` only scales the air by the rain.
function applyFog(above){
  const rk=above?SKY.rainA:0;
  FOG_P[0]=FOG_PS[0]=FOG_PSURF[0]=SEA_FOG.far;FOG_P[1]=FOG_PSURF[1]=SEA_FOG.share;FOG_PS[1]=SEA_FOG.shareS;FOG_P[2]=FOG_PS[2]=FOG_PSURF[2]=SEA_FOG.placeMix;FOG_P[3]=FOG_PS[3]=1;FOG_PSURF[3]=0;
  FOG_A[0]=AIR.far*(1+1.0*rk);FOG_A[1]=AIR.share;FOG_A[2]=AIR.dens*(1+1.2*rk);FOG_A[3]=SEA_FOG.dens;
  FOG_W[1]=SEA_FOG.bright;FOG_W[2]=SEA_FOG.dlAt;FOG_W[3]=SEA_FOG.reach;LIGHT_K[0]=FX.caustics?SEA_FOG.cau*FX.cauK:0;LIGHT_K[1]=FX.shadows?SEA_FOG.shd:0; // the effects list (effects.js) can zero either
}
// The crossing (v11.7). The medium changes in one frame — the camera's side, the surface's look, the fog, the domes and the tint from
// above are the medium and switch with it — and the *light* crossfades over MED_T: the hemisphere, the sun, the audio. medK is the
// mix: 0 water, 1 air. The water's own things — the shimmer, the snow, the player's glow — fade *in* by medK when the camera goes
// under and are gone the frame it comes up (v11.7.2): they fade both ways until then, and the shimmer plane, 1.5 m over the surface
// and 90 m wide, sat a metre over a camera that had just surfaced — an additive ceiling over the whole sky for a quarter of a second,
// the sky three times too bright at the flip and dimming: the flash on every breach in the person's fifth video. (v11.7's first cut
// also mixed the fogs and the domes; the water's veil read into the air wrapped the shore in teal on every breach — seen, struck.)
const MED_T=0.25,SKY_NEAR=1.5;let medK=0; // SKY_NEAR (v11.42): how far under the wave the camera can be with the sky still drawn; deeper the surface's underside covers it (through its alpha the sky would tint the mirror — WATER.md B makes that the window)
const amC=[0,0,0],seaFogC=new THREE.Color(),airFogC=new THREE.Color(),hemiSea=new THREE.Color(),hemiSeaG=new THREE.Color(),hemiAir=new THREE.Color(),hemiAirG=new THREE.Color();
function updateAtmosphere(dt){
  updateSky(dt);const K=SKY,tint=K.tint;skyT.setRGB(tint[0],tint[1],tint[2]);
  const depth=TIDE-player.pos.y; // depth under the water level now
  const dfD=daylightAt(player.pos.y),df=dfD*K.skyLw; // daylight at the player's depth (world.js, one curve with the shader's since v11.32): by depth, then by the sky the water sees (v11; v11.23 skyLw)
  // the water here, read from the same blurred map the fog shader reads at the camera (so the background, the ambient
  // light and the fog agree, and a border is a drift over ~100 units of travel, not an event); the plankton's tint as the shader has it (v11.81)
  wmSample(player.pos.x,player.pos.z,wmHere);const bw=SEA_FOG.bright;
  {const fw=Math.exp(-Math.max(player.pos.y+wmFloor(player.pos.x,player.pos.z)-FLOOR_FREE,0)/FLOOR_H),oc=wcolAt(Math.max(-player.pos.y,OPEN_D));for(let i=0;i<3;i++)wmHere[i]=lerp(oc[i],wmHere[i],fw);} // v11.27: the floor's colour only within FLOOR_H of it, as the shader has it (world.js FLOOR_H)
  bloomTint(wmHere,bloomAt(player.pos.x,player.pos.y,player.pos.z,amC)); // v11.81: the crops at the player's own depth, from the bloom map (far.js), as fogVeil tints each of its samples
  const wr=wmHere[0]*bw,wg=wmHere[1]*bw,wb=wmHere[2]*bw,dl=daylightAt(player.pos.y);
  // the medium is the camera's: air above the surface, water below. Crossing it snaps fog and light; within it they drift.
  const above=mode==='play'?player.camAbove:camera.position.y>waveH(camera.position.x,camera.position.z); // in play the camera's side is decided with hysteresis and the camera is held clear of the wave (player.js finishPlayer); the raw test here flipped every frame the chop passed the camera (v11.6)
  const wlc=waveH(camera.position.x,camera.position.z),camUnder=camera.position.y<wlc; // the wave at the camera and the camera's true side, this frame (v11.42): the fog's split (uFogAC.w) and the surface's one camera-side branch read these, not the lagging flag
  surfaceU.uUnder.value=camUnder?1:0;surfaceU.uRain.value=FX.rain&&FX.clouds?K.rainA:0;FOG_AC[3]=wlc;
  // Where the surface sits in the transparent pass, by the medium, not by three's sort (v11.6). Three orders transparent objects by the
  // NDC depth of each object's *origin*; the surface's origin is the camera's snapped x,z at TIDE, so near the line it is within a metre
  // of the camera and hops a grid step at a time — in front of the camera plane one frame, behind it the next — and the surface swapped
  // places with the shimmer sprite (90 m, additive: blended down by the mirror when drawn under it, added on top when drawn over it),
  // the jellies and the snow every few frames: the glow on the surface flickering on approach. From below the surface is the farthest
  // transparent thing on any ray, so it draws first; from above everything transparent is beneath it, so it draws last.
  surface.renderOrder=above?1:-1;
  surfaceU.uWin.value.set(tint[0]*K.skyL,tint[1]*K.skyL,tint[2]*K.skyL);surfaceU.uGlint.value.set(K.lumC[0]*K.lumL*1.05,K.lumC[1]*K.lumL*1.05,K.lumC[2]*K.lumL*1.05);
  const snap=above!==wasAbove;wasAbove=above;const dK=dt/MED_T;medK=above?Math.min(1,medK+dK):Math.max(0,medK-dK);if(snapMed){medK=above?1:0;snapMed=false;}
  const k=medK;
  const shallow=smooth(-40,0,-depth); // the light's colour reaches the shallows only (red is gone by -15)
  airFogC.setRGB(K.hor[0],K.hor[1],K.hor[2]);FOG_AC[0]=airFogC.r;FOG_AC[1]=airFogC.g;FOG_AC[2]=airFogC.b; // the air segment's colour in every shader (v11.42)
  fogTarget.setRGB(wr,wg,wb).multiplyScalar((0.3+0.7*dl)*K.skyLw).multiply(skyT2.copy(skyT).lerp(WHITE,1-shallow));
  FOG_T[0]=above?K.skyL:K.skyLw; // the veil and the shader-side daylight scale by the medium's sky (v11.23)
  // Under water scene.fog.color only drives the hemisphere light and the background behind the dome (the fog itself reads
  // the map in the shader); it follows the map with a short lag. In air it is the sky's horizon, which moves with the hour.
  seaFogC.lerp(fogTarget,1-Math.exp(-1.5*dt));scene.fog.color.copy(above?airFogC:seaFogC);if(snap||above)applyFog(above);
  waterDome.visible=true;waterDome.position.copy(camera.position); // both media since v11.42.3: the dome draws only under the water level, the sky only over it
  // the ambient. Air: the sky's — the approved noon pair scaled by the sky's light and coloured by it, the sun (or the moon) as the
  // key. Water: the water's — sky = the veil colour lifted, ground = the same colour dimmed (upwelling light — undersides seen from
  // below, the pads of the canopy above all, read as water-dark rather than black)
  hemiAir.copy(hemiSkyA).multiplyScalar(Math.pow(K.skyL,0.85)).multiply(skyT);hemiAirG.copy(hemiGroundA).multiplyScalar(K.skyL).multiply(skyT);
  hemiSea.copy(seaFogC).multiplyScalar(1.8);hemiSeaG.copy(seaFogC).multiplyScalar(SEA_FOG.ground);
  hemi.intensity=lerp(0.3+0.7*df,0.85,k);hemi.color.copy(hemiSea).lerp(hemiAir,k);hemi.groundColor.copy(hemiSeaG).lerp(hemiAirG,k);
  const sunSea=(0.9+0.2*Math.sin(t*2.3)+0.1*Math.sin(t*3.9))*1.2*K.lumLw; // the surface value: the shader scales it by the daylight at the lit point (scene.js, sun-by-depth)
  sun.intensity=lerp(sunSea,1.35*K.lumL,k);
  const wk=above?0:1-k; // the water's things: fading in under the water (k falls from 1), gone the frame the camera is in air (v11.7.2)
  plight.intensity=(1.3*(1-dfD)*(1-dfD)+0.5*(1-K.skyL)*(1-K.skyL))*wk*(FX.plight?1:0); // the player's own light: in the deep as before, and a little at night; `own light` on the effects list (v11.52, POLISH.md Raised 13 Sep: the person wants to see the world without it)
  updateShafts(above,wk);
  updateHaze(dt,above);sky.visible=true;sky.position.copy(camera.position);pushSky();updateClouds(dt); // the near clouds' lumps (clouds.js, v11.87) after the sky's state is pushed // every frame since v11.43: the surface's window reads the sky's uniforms from under the water, where the sphere is hidden // the sky stays up within SKY_NEAR under the line (v11.42): a camera just under sees air through the near plane's gap above the water, and that is the sky, not the dome
  plankton.visible=FX.snow;snAU.value.set(TIDE,1/2.5,above?1:0,0);tintU.value.set(TIDE,above?1:0,K.skyL,0); // the snow from the air too (v11.82.1, the person: none showed below the surface): the top few metres, fading over 2.5 m, through the surface's body // x the water level (LIGHT_GLSL's depth); the through-water tint that read y and z went with v11.42 (scene.js)
  pm.color.setRGB(lerp(0.45,1,df),lerp(0.75,1,df),lerp(0.95,1,df));pm.opacity=0.6*(0.45+0.55*df)*(above?1:wk); // the light on the snow (v11.24: the particle's own colour is per point): blue-green and dim with depth and the night; the player's light is added in the shader
  updateRain(dt,above);
  if(mode!=='play')return;
  // the depth, and nothing else: no place has a name (the person, Sep 2026). Shown under the water, in whole metres, faded at the surface
  const dm=Math.round(depth);if(dm!==curDepth){curDepth=dm;biomeEl.textContent=dm>0?dm+' m':'';}
  biomeEl.style.opacity=above?0:0.55*smooth(2,8,depth);
}
// Compass: a strip of cardinal letters under a hairline tick, fading in while you move or turn and out when you rest.
// North is -z. The dot below the letters is the bearing of the peak (home), shown once you're well away from it.
let compT=0,lastHdg=-1,compOn=false;
function updateCompass(dt){
  const P=player;
  if(mode!=='play'||P.dead){if(compOn){compassEl.style.opacity=0;compOn=false;}compT=0;return;}
  let hdg=(-P.byaw*180/Math.PI)%360; // the way the body faces (v11.77), not the heading asked forif(hdg<0)hdg+=360;
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
