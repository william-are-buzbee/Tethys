// Minimal THREE + DOM stub to exercise game logic headlessly.
class Vector3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;}
 set(x,y,z){this.x=x;this.y=y;this.z=z;return this;} setScalar(s){return this.set(s,s,s);} copy(v){return this.set(v.x,v.y,v.z);} clone(){return new Vector3(this.x,this.y,this.z);}
 add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;} sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}
 addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;} multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}
 length(){return Math.hypot(this.x,this.y,this.z);} lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z;}
 normalize(){const l=this.length()||1;return this.multiplyScalar(1/l);} setLength(l){return this.normalize().multiplyScalar(l);}
 distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);} dot(v){return this.x*v.x+this.y*v.y+this.z*v.z;}
 cross(v){const x=this.y*v.z-this.z*v.y,y=this.z*v.x-this.x*v.z,z=this.x*v.y-this.y*v.x;return this.set(x,y,z);}
 lerp(v,t){this.x+=(v.x-this.x)*t;this.y+=(v.y-this.y)*t;this.z+=(v.z-this.z)*t;return this;} applyQuaternion(q){return this;} applyMatrix4(m){const e=m.e,x=this.x,y=this.y,z=this.z;this.x=e[0]*x+e[4]*y+e[8]*z+e[12];this.y=e[1]*x+e[5]*y+e[9]*z+e[13];this.z=e[2]*x+e[6]*y+e[10]*z+e[14];return this;} applyMatrix3(){return this;} fromBufferAttribute(a,i){return this.set(a.getX(i),a.getY(i),a.getZ(i));} fromArray(a){return this.set(a[0],a[1],a[2]);}}
class Vector2{constructor(x=0,y=0){this.x=x;this.y=y;} set(x,y){this.x=x;this.y=y;return this;}}
class Vector4{constructor(x=0,y=0,z=0,w=0){this.x=x;this.y=y;this.z=z;this.w=w;} set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;return this;}}
class Quaternion{constructor(){this.x=0;this.y=0;this.z=0;this.w=1;} set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;return this;} identity(){return this.set(0,0,0,1);}
 setFromEuler(e){const c1=Math.cos(e.x/2),c2=Math.cos(e.y/2),c3=Math.cos(e.z/2),s1=Math.sin(e.x/2),s2=Math.sin(e.y/2),s3=Math.sin(e.z/2);
  if(e.order==='YXZ'){this.x=s1*c2*c3+c1*s2*s3;this.y=c1*s2*c3-s1*c2*s3;this.z=c1*c2*s3-s1*s2*c3;this.w=c1*c2*c3+s1*s2*s3;}
  else{this.x=s1*c2*c3+c1*s2*s3;this.y=c1*s2*c3-s1*c2*s3;this.z=c1*c2*s3+s1*s2*c3;this.w=c1*c2*c3-s1*s2*s3;}return this;}
 setFromUnitVectors(){return this;} setFromRotationMatrix(){return this;} setFromAxisAngle(a,r){const s=Math.sin(r/2);this.x=a.x*s;this.y=a.y*s;this.z=a.z*s;this.w=Math.cos(r/2);return this;} slerp(q){return this.copy(q);} copy(q){if(q){this.x=q.x;this.y=q.y;this.z=q.z;this.w=q.w;}return this;} clone(){return new Quaternion().copy(this);} multiply(q){const ax=this.x,ay=this.y,az=this.z,aw=this.w,bx=q.x,by=q.y,bz=q.z,bw=q.w;this.x=ax*bw+aw*bx+ay*bz-az*by;this.y=ay*bw+aw*by+az*bx-ax*bz;this.z=az*bw+aw*bz+ax*by-ay*bx;this.w=aw*bw-ax*bx-ay*by-az*bz;return this;}}
class Euler{constructor(x=0,y=0,z=0,o='XYZ'){this.x=x;this.y=y;this.z=z;this.order=o;} set(x,y,z,o){this.x=x;this.y=y;this.z=z;if(o)this.order=o;return this;}}
class Matrix4{constructor(){this.e=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];} get elements(){return this.e;}
 compose(p,q,s){const x=q.x,y=q.y,z=q.z,w=q.w,x2=x+x,y2=y+y,z2=z+z,xx=x*x2,xy=x*y2,xz=x*z2,yy=y*y2,yz=y*z2,zz=z*z2,wx=w*x2,wy=w*y2,wz=w*z2,e=this.e;
  e[0]=(1-(yy+zz))*s.x;e[1]=(xy+wz)*s.x;e[2]=(xz-wy)*s.x;e[3]=0;e[4]=(xy-wz)*s.y;e[5]=(1-(xx+zz))*s.y;e[6]=(yz+wx)*s.y;e[7]=0;e[8]=(xz+wy)*s.z;e[9]=(yz-wx)*s.z;e[10]=(1-(xx+yy))*s.z;e[11]=0;e[12]=p.x;e[13]=p.y;e[14]=p.z;e[15]=1;return this;}
 lookAt(){return this;} clone(){const m=new Matrix4();m.e=this.e.slice();return m;} copy(m){this.e=m.e.slice();return this;} invert(){return this;}
 multiplyMatrices(a,b){const ae=a.e,be=b.e,te=new Array(16);for(let i=0;i<4;i++)for(let j=0;j<4;j++){let s=0;for(let k=0;k<4;k++)s+=ae[i+k*4]*be[k+j*4];te[i+j*4]=s;}this.e=te;return this;} premultiply(m){return this.multiplyMatrices(m,this);}}
class Matrix3{getNormalMatrix(){return this;}}
class Color{constructor(r,g,b){this.r=1;this.g=1;this.b=1;if(typeof r==='number'&&g===undefined){this.r=((r>>16)&255)/255;this.g=((r>>8)&255)/255;this.b=(r&255)/255;}else if(r!==undefined){this.r=r;this.g=g;this.b=b;}}
 setRGB(r,g,b){this.r=r;this.g=g;this.b=b;return this;} copy(c){return this.setRGB(c.r,c.g,c.b);} multiply(c){this.r*=c.r;this.g*=c.g;this.b*=c.b;return this;} multiplyScalar(s){this.r*=s;this.g*=s;this.b*=s;return this;} lerp(c,t){this.r+=(c.r-this.r)*t;this.g+=(c.g-this.g)*t;this.b+=(c.b-this.b)*t;return this;} setHSL(){return this;} setHex(){return this;} getHex(){return 0;}}
class BufferAttribute{constructor(arr,n){this.array=arr;this.itemSize=n;this.count=arr.length/n;this.needsUpdate=false;this.updateRange={offset:0,count:-1};} setUsage(){return this;}
 setXYZ(i,x,y,z){const a=this.array,k=i*this.itemSize;a[k]=x;a[k+1]=y;a[k+2]=z;} getX(i){return this.array[i*this.itemSize];} getY(i){return this.array[i*this.itemSize+1];} getZ(i){return this.array[i*this.itemSize+2];} setY(i,v){this.array[i*this.itemSize+1]=v;}}
class Float32BufferAttribute extends BufferAttribute{constructor(a,n){super(Float32Array.from(a),n);}}
class InstancedBufferAttribute extends BufferAttribute{}
class BufferGeometry{constructor(){this.attributes={};this.index=null;}
 setAttribute(n,a){this.attributes[n]=a;return this;} setIndex(i){this.index=i;return this;} toNonIndexed(){const g=new BufferGeometry();g.attributes.position=new BufferAttribute(Float32Array.from(this.attributes.position.array),3);if(this.attributes.color)g.attributes.color=new BufferAttribute(Float32Array.from(this.attributes.color.array),3);return g;}
 applyMatrix4(){return this;} computeBoundingSphere(){} clone(){const g=new BufferGeometry();for(const k in this.attributes){const a=this.attributes[k];g.attributes[k]=new BufferAttribute(Float32Array.from(a.array),a.itemSize);}g.index=this.index;return g;} computeVertexNormals(){const n=this.attributes.position.array.length;this.attributes.normal=new BufferAttribute(new Float32Array(n).map((_,i)=>i%3===1?1:0),3);} dispose(){} rotateX(){return this;} translate(){return this;}}
function prim(n){const g=new BufferGeometry();const a=new Float32Array(n*9);for(let i=0;i<a.length;i++)a[i]=Math.random();g.attributes.position=new BufferAttribute(a,3);g.index={};return g;}
class BoxGeometry extends BufferGeometry{constructor(){super();Object.assign(this,prim(12));}}
class SphereGeometry extends BufferGeometry{constructor(){super();Object.assign(this,prim(20));}}
class CylinderGeometry extends BufferGeometry{constructor(){super();Object.assign(this,prim(16));}}
class ConeGeometry extends BufferGeometry{constructor(){super();Object.assign(this,prim(8));}}
class LatheGeometry extends BufferGeometry{constructor(pts,s){super();Object.assign(this,prim(pts.length*(s||8)));}}
class DodecahedronGeometry extends BufferGeometry{constructor(){super();Object.assign(this,prim(36));this.index=null;}}
class TorusGeometry extends BufferGeometry{constructor(){super();Object.assign(this,prim(40));}}
class Sphere{constructor(c,r){this.center=c;this.radius=r;}}
class Frustum{setFromProjectionMatrix(){return this;} intersectsSphere(){return true;}}
class PlaneGeometry extends BufferGeometry{constructor(w,h,ws,hs){super();const n=(ws+1)*(hs+1);const a=new Float32Array(n*3);let k=0;for(let j=0;j<=hs;j++)for(let i=0;i<=ws;i++){a[k++]=-w/2+w*i/ws;a[k++]=0;a[k++]=-h/2+h*j/hs;}this.attributes.position=new BufferAttribute(a,3);this.index={};}}
class Layers{constructor(){this.mask=1;} set(n){this.mask=1<<n;} enable(n){this.mask|=1<<n;} test(l){return (this.mask&l.mask)!==0;}} // v11.30: the world's shadow map draws layer 1
class Object3D{constructor(){this.position=new Vector3();this.rotation=new Euler();this.quaternion=new Quaternion();this.scale=new Vector3(1,1,1);this.children=[];this.userData={};this.visible=true;this.matrix=new Matrix4();this.matrixWorld=new Matrix4();this.up=new Vector3(0,1,0);this.layers=new Layers();}
 add(o){this.children.push(o);return this;} traverse(f){f(this);this.children.forEach(c=>c.traverse?c.traverse(f):f(c));} updateMatrixWorld(){} remove(o){this.children=this.children.filter(c=>c!==o);return this;} updateMatrix(){this.matrix.compose(this.position,new Quaternion().setFromEuler(this.rotation),this.scale);} lookAt(){} }
class Group extends Object3D{}
class Mesh extends Object3D{constructor(g,m){super();this.isMesh=true;this.geometry=g;this.material=m;}}
class Points extends Object3D{constructor(g,m){super();this.isPoints=true;this.geometry=g;this.material=m;}}
class LineSegments extends Object3D{constructor(g,m){super();this.isLineSegments=true;this.geometry=g;this.material=m;}}
class InstancedMesh extends Mesh{constructor(g,m,n){super(g,m);this.isInstancedMesh=true;this.count=n;this.instanceMatrix=new InstancedBufferAttribute(new Float32Array(n*16),16);this.instanceColor=null;} dispose(){} setMatrixAt(i,m){this.instanceMatrix.array.set(m.elements,i*16);} setColorAt(){this.instanceColor={needsUpdate:false};}}
class Material{constructor(o){Object.assign(this,o||{});this.color=new Color(o&&o.color);this.opacity=1;} dispose(){}}
class Scene extends Object3D{}
class Light extends Object3D{constructor(c,i,d,dec){super();this.color=new Color(c);this.groundColor=new Color(typeof i==='number'&&d!==undefined&&typeof d!=='number'?i:0);this.intensity=i;this.castShadow=false;this.target=new Object3D();this.shadow={camera:Object.assign(new Camera(),{left:-5,right:5,top:5,bottom:-5,near:0.5,far:500}),mapSize:new Vector2(512,512),matrix:new Matrix4(),map:null,bias:0};}} // shadow, target (v11.23): the shadow map's light
class Camera extends Object3D{constructor(fov,aspect){super();this.fov=fov;this.aspect=aspect;this.projectionMatrix=new Matrix4();this.matrixWorldInverse=new Matrix4();} updateProjectionMatrix(){}}
class FogExp2{constructor(c,d){this.color=new Color(c);this.density=d;}}
class WebGLRenderer{constructor(){this.info={render:{calls:0,triangles:0}};this.shadowMap={enabled:false,type:0};this.rt=null;} setPixelRatio(){} setSize(){} getRenderTarget(){return this.rt;} setRenderTarget(t){this.rt=t;} getDrawingBufferSize(v){v.x=1600;v.y=900;return v;} copyFramebufferToTexture(){}
 render(scene,cam){if(!this.shadowMap.enabled)return;scene.traverse(o=>{if(o.shadow&&o.castShadow&&o.layers.test(cam.layers)&&!o.shadow.map)o.shadow.map={texture:{},dispose(){}};});} compile(){}} // render (v11.30): a projected light with castShadow gets its map, as three does
class WebGLRenderTarget{constructor(w,h){this.width=w;this.height=h;} dispose(){}}
class CanvasTexture{}
class DataTexture{constructor(data,w,h){this.image={data,width:w,height:h};this.needsUpdate=true;} clone(){return new DataTexture(this.image.data,this.image.width,this.image.height);}}
const ShaderChunk={fog_pars_vertex:'#ifdef USE_FOG\n\tvarying float vFogDepth;\n#endif',fog_vertex:'#ifdef USE_FOG\n\tvFogDepth = - mvPosition.z;\n#endif',fog_pars_fragment:'',fog_fragment:''};
const ShaderLib={lambert:{uniforms:{fogColor:{value:new Color(0)}}},phong:{uniforms:{fogColor:{value:new Color(0)}}},basic:{uniforms:{fogColor:{value:new Color(0)}}},points:{uniforms:{fogColor:{value:new Color(0)}}},depth:{uniforms:{}}};
global.THREE={DataTexture,Vector4,LineSegments,ShaderMaterial:Material,LineBasicMaterial:Material,InstancedBufferAttribute,DynamicDrawUsage:35048,ShaderChunk,ShaderLib,LinearFilter:1006,ClampToEdgeWrapping:1001,RGBAFormat:1023,RGBFormat:1022,UnsignedByteType:1009,Vector3,Vector2,Quaternion,Euler,Matrix4,Color,BufferAttribute,Float32BufferAttribute,BufferGeometry,BoxGeometry,SphereGeometry,CylinderGeometry,ConeGeometry,LatheGeometry,DodecahedronGeometry,PlaneGeometry,Object3D,Group,Mesh,Points,InstancedMesh,Scene,FogExp2,WebGLRenderer,CanvasTexture,PerspectiveCamera:Camera,OrthographicCamera:Camera,Camera,WebGLRenderTarget,MeshDepthMaterial:Material,RGBADepthPacking:3201,HemisphereLight:Light,DirectionalLight:Light,PointLight:Light,MeshLambertMaterial:Material,MeshPhongMaterial:Material,Matrix3,TorusGeometry,Sphere,Frustum,MeshBasicMaterial:Material,PointsMaterial:Material,DoubleSide:2,BackSide:1,AdditiveBlending:2,CustomBlending:5,AddEquation:100,OneMinusDstColorFactor:209,OneFactor:201,BasicShadowMap:0};
// DOM
const handlers=global.__h={};const els={};
function el(id){if(!els[id])els[id]={id,style:{},classList:{add(){},remove(){},toggle(){}},textContent:'',dataset:{i:id.replace('pick','')},firstElementChild:{style:{}},addEventListener(n,f){(handlers[id+':'+n]=handlers[id+':'+n]||[]).push(f);},getContext(){return{createRadialGradient(){return{addColorStop(){}}},fillRect(){}}},requestPointerLock(){if(global.__nolock)throw new Error('no lock');document.pointerLockElement=this;fire('doc:pointerlockchange');}};return els[id];}
function fire(k,e){const L=handlers[k];if(L)for(const f of L.slice())f(e||{});} // as the browser does: every listener on the event, in registration order
// The pointer lock works (v11.31.4): play starts locked (menu.js choose), so a mousemove is the look and a click is the bite —
// the paths the person actually plays. It threw 'no lock' before, which left the test on the drag fallback and never on either
// (the mouse reached zoo.js only). `global.__nolock` puts the refusal back, for the drag fallback (smoke.js).
global.document={getElementById:el,querySelectorAll(){return[];},addEventListener(n,f){(handlers['doc:'+n]=handlers['doc:'+n]||[]).push(f);},createElement(){return el('cv');},pointerLockElement:null,exitPointerLock(){this.pointerLockElement=null;fire('doc:pointerlockchange');}};
global.window=global;global.innerWidth=1280;global.innerHeight=720;global.screen={width:1920,height:1080};global.location={hash:process.env.TIER?'#'+process.env.TIER:''};global.navigator={maxTouchPoints:0};
global.addEventListener=(n,f)=>{(handlers['win:'+n]=handlers['win:'+n]||[]).push(f);};
let __now=0;let raf=null;global.requestAnimationFrame=f=>{raf=f;};global.__step=function(n){for(let i=0;i<n;i++){const f=raf;raf=null;__now+=16.7;f(__now);}};global.performance={now:()=>__now};
global.setTimeout=(f)=>{f();};
// A fake AudioContext (v11.14): every node is an inert object, every AudioParam checks the value it is given is finite — the smoke test drives
// the whole audio graph (audio.js) headlessly and fails on an undefined name, a NaN into a param, a node method it lacks. It proves nothing about sound.
function AParam(v){this.value=v||0;}
AParam.prototype.chk=function(v){if(typeof v!=='number'||!isFinite(v))throw new Error('audio param given '+v);this.value=v;return this;};
AParam.prototype.setValueAtTime=function(v){return this.chk(v);};AParam.prototype.setTargetAtTime=function(v){return this.chk(v);};
AParam.prototype.linearRampToValueAtTime=function(v){return this.chk(v);};AParam.prototype.exponentialRampToValueAtTime=function(v){if(v<=0)throw new Error('exponential ramp to '+v);return this.chk(v);};
AParam.prototype.cancelScheduledValues=function(){return this;};
function ANode(params){for(const k in params)this[k]=new AParam(params[k]);}
ANode.prototype.connect=function(n){if(!n)throw new Error('connect to nothing');return n;};ANode.prototype.disconnect=function(){};ANode.prototype.start=function(){};ANode.prototype.stop=function(){};
ANode.prototype.setPosition=function(x,y,z){if(!isFinite(x+y+z))throw new Error('setPosition NaN');};ANode.prototype.setOrientation=function(){};
global.AudioContext=function(){this.sampleRate=48000;this.currentTime=0;this.state='running';this.destination=new ANode({});
  this.listener=new ANode({positionX:0,positionY:0,positionZ:0,forwardX:0,forwardY:0,forwardZ:-1,upX:0,upY:1,upZ:0});
  this.createBuffer=(ch,n,sr)=>{const d=[];for(let i=0;i<ch;i++)d.push(new Float32Array(n));return {numberOfChannels:ch,length:n,sampleRate:sr,duration:n/sr,getChannelData:i=>d[i]};};
  this.createBufferSource=()=>{const n=new ANode({playbackRate:1});n.loop=false;n.buffer=null;return n;};
  this.createBiquadFilter=()=>{const n=new ANode({frequency:350,Q:1,gain:0,detune:0});n.type='lowpass';return n;};
  this.createGain=()=>new ANode({gain:1});this.createOscillator=()=>{const n=new ANode({frequency:440,detune:0});n.type='sine';return n;};
  this.createPanner=()=>{const n=new ANode({positionX:0,positionY:0,positionZ:0,orientationX:1,orientationY:0,orientationZ:0});n.panningModel='equalpower';n.distanceModel='inverse';n.refDistance=1;n.maxDistance=1e4;n.rolloffFactor=1;return n;};
  this.createStereoPanner=()=>new ANode({pan:0});this.createDelay=()=>new ANode({delayTime:0});this.createConvolver=()=>{const n=new ANode({});n.buffer=null;return n;};
  this.createDynamicsCompressor=()=>new ANode({threshold:-24,knee:30,ratio:12,attack:0.003,release:0.25});
  this.resume=()=>Promise.resolve();};
global.__run=function(){
  let now=0;const frame=()=>{const f=raf;raf=null;__now+=16.7;now=__now;f(now);};
  for(let i=0;i<30;i++)frame();
  const pick=+(process.env.PICK||1);if(pick===1)fire('mnew:click');else global.__start(pick); // v11.47: the menu's `new game` is the finback; the other clades start through the bare choose (smoke.js __start)
  const key=(code,down)=>handlers['win:'+(down?'keydown':'keyup')].forEach(f=>f({code,preventDefault(){}}));
  // every listener, not the first (v11.31.4): zoo.js and lab.js register on the canvas and the window before input.js does, so
  // taking [0] meant the mouse never reached input.js at all — no bite, no look, for all of the fifteen hundred frames.
  const md=e=>fire('c:mousedown',e), mu=e=>fire('win:mouseup',e), mm=e=>fire('win:mousemove',e);
  key('KeyW',true);key('ShiftLeft',true);
  for(let i=0;i<1500;i++){frame();if(i%97===0){md({button:0,clientX:1,clientY:1});mm({movementX:3,movementY:1});mu({button:0});}if(i%211===0)key('KeyQ',true);if(i%211===5)key('KeyQ',false);if(i%400===0){key('Space',true);}if(i%400===50)key('Space',false);
    if(i%313===0)md({button:2});if(i%313===60)mu({button:2});} // the right button: the grab held for a second (combat.js, v11.31)
  return 'ran '+now.toFixed(0)+'ms';
};
