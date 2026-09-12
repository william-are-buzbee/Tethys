// util.js — math helpers, seeded rng, value noise
// ---------- helpers ----------
const TAU=Math.PI*2, HPI=Math.PI/2;
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
const UP=V3(0,1,0);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const rnd=(a,b)=>a+Math.random()*(b-a);
const T1=V3(0,0,0),T2=V3(0,0,0),T3=V3(0,0,0),T4=V3(0,0,0);
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion();
function mulberry(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

// ---------- noise ----------
const perm=new Uint8Array(512);
(function(){let s=1337;const p=[];for(let i=0;i<256;i++)p[i]=i;for(let i=255;i>0;i--){s=(s*16807)%2147483647;const j=s%(i+1);const t=p[i];p[i]=p[j];p[j]=t;}for(let i=0;i<512;i++)perm[i]=p[i&255];})();
function hash(x,y){return perm[(perm[x&255]+y)&255]/255;}
function vnoise(x,y){const xi=Math.floor(x),yi=Math.floor(y);const xf=x-xi,yf=y-yi;const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const a=hash(xi,yi),b=hash(xi+1,yi),c=hash(xi,yi+1),d=hash(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;}
function fbm(x,y,o){let s=0,a=0.5,f=1,n=0;for(let i=0;i<o;i++){s+=a*vnoise(x*f,y*f);n+=a;a*=0.5;f*=2.07;}return s/n;}
function angNoise(a,k,seed){return (fbm(Math.cos(a)*k+seed,Math.sin(a)*k+seed*0.37,3)-0.5)*2;}

