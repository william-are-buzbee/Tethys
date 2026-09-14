// test/caustic.js — the baked caustic as a picture (v11.36): runs scene.js's bake (CAU_RINGS … CAU_TEX) against the stub and draws
// 1/|det J| through the line step at a few depths, t = 0, full chop, no swell carry, into test/preview/caustic_<d>m.png with the
// line's coverage printed. Not in --test. Env: DEP (depths, "5,10,16"), CT and CS (the line's threshold and half-width, scene.js
// CAU_T/CAU_SOFT; CS 0 is a hard step), SPAN (metres across, 16), W (pixels, 512), OX/OZ (the world offset, m — the gust tile varies over ~100 m, so SPAN=100 shows the patches). Snaps to CAU_PX blocks as the shader does (v11.36.2). What it proved on 13 Sep: six sines are dots or stripes, thirty-two are
// a net; a line is thin only where |det| is small (CT 1.5 was fat worms over a third of the floor, 3 is a net at 5 m).
const fs=require('fs'),path=require('path'),root=path.join(__dirname,'..'),{png}=require('./png.js');
require('./stub.js');const THREE=global.THREE;THREE.DataTexture=function(d,n){this.d=d;this.n=n;};
const util=fs.readFileSync(path.join(root,'src/util.js'),'utf8'),src=fs.readFileSync(path.join(root,'src/scene.js'),'utf8');
const a=src.indexOf('const CAU_RINGS='),b=src.indexOf('const CAU_PARS=');if(a<0||b<0)throw new Error('caustic: scene.js markers not found');
const num=k=>+(src.match(new RegExp(k+'=([0-9.]+)'))||[])[1];
const PX=num('CAU_PX')||0,T=num('CAU_TILE'),N=num('CAU_N'),HMAX=num('CAU_HMAX'),SUN=num('CAU_SUN'),CT=+(process.env.CT||num('CAU_T')),CS=+(process.env.CS||num('CAU_SOFT')),HI=num('CAU_HI');
const R=new Function('THREE','WIND_A','Q',util+'\n'+src.slice(a,b)+'\nreturn {t:CAU_TEX,g:CAU_GTEX,gs:CAU_GUST,gn:CAU_GN};')(THREE,3.49,{cau:9}),TEX=R.t,GT=R.g,GS=R.gs,GN=R.gn;
console.log('rings',TEX.map(r=>r.L+'m x'+r.n).join(', '),' tile',T,'m',N,'texels  CT',CT,'CS',CS,'PX',PX);
function tap(t,x,z){const u=((x/T)%1+1)%1,v=((z/T)%1+1)%1;const i=Math.floor(u*N)%N,j=Math.floor(v*N)%N,o=(j*N+i)*4;return [(t.d[o]/127.5-1)*HMAX,(t.d[o+1]/127.5-1)*HMAX,(t.d[o+2]/127.5-1)*HMAX];}
const W=+(process.env.W||512),span=+(process.env.SPAN||16),ox=+(process.env.OX||0),oz=+(process.env.OZ||0),out=path.join(__dirname,'preview');if(!fs.existsSync(out))fs.mkdirSync(out);
for(const dep of (process.env.DEP||'5,10,16').split(',').map(Number)){const img=Buffer.alloc(W*W*3);let cov=0;
  for(let y=0;y<W;y++)for(let x=0;x<W;x++){let px=x/W*span,pz=y/W*span;if(PX>0){px=(Math.floor(px/PX)+0.5)*PX;pz=(Math.floor(pz/PX)+0.5)*PX;}const H=[0,0,0];const gi=Math.floor((((px+ox)/GS[0])%1+1)%1*GN)%GN,gj=Math.floor((((pz+oz)/GS[0])%1+1)%1*GN)%GN,gu=1-GS[1]*(1-GT.d[(gj*GN+gi)*4]/255);
    for(const r of TEX){const g=Math.exp(-dep*dep*2*Math.pow(Math.PI*SUN/r.L,2));const s=tap(r.s,px,pz);for(let k=0;k<3;k++)H[k]+=s[k]*g*gu;}
    const jc=dep*0.248,dj=(1-jc*H[0])*(1-jc*H[2])-jc*jc*H[1]*H[1],I=1/Math.max(Math.abs(dj),0.02);
    const st=CS>0?Math.min(1,Math.max(0,(I-(CT-CS))/(2*CS))):(I>=CT?1:0),ci=1+(HI-1)*(st*st*(3-2*st));if(ci>1+(HI-1)*0.5)cov++;
    const v=Math.round(Math.min(255,110*ci)),o=(y*W+x)*3;img[o]=v;img[o+1]=v;img[o+2]=v;}
  fs.writeFileSync(path.join(out,'caustic_'+dep+'m.png'),png(img,W,W));console.log(dep+' m: lines over '+(cov/(W*W)*100).toFixed(1)+'% of the floor');}
