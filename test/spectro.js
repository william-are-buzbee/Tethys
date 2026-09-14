#!/usr/bin/env node
// test/spectro.js — what a sound is, as a picture and a table. Reads the wavs the sound bench posted to test/render/ (src/bench.js,
// #bench, with node serve.js running) and writes test/render/<name>.png: the envelope over a log-frequency spectrogram, with the
// numbers under it. Then a table on stdout, and test/render/_sheet.png with every panel stacked.
//   Why: nobody here can hear. A spectrogram cannot say whether a sound is good, but it says plainly whether it is what it was
// meant to be — where the energy sits, how long the tail runs, whether the "thud" is actually a hiss, whether two beds are fighting
// over the same octave, whether anything clips. The numbers are the part that can go in a test and stay true.
//   node test/spectro.js              every wav in test/render/
//   node test/spectro.js shot_ bed_   only names containing one of these
// Not part of the game and not in build.js --test: it needs the bench to have run first.
'use strict';
const fs=require('fs'),path=require('path'),{png,text,textW}=require('./png.js');
const DIR=path.join(__dirname,'render');
const W=920,MX=48,MR=8,HW=54,HS=228,HT=16,HN=30,H=HT+HW+HS+HN+8; // the panel: margins, the envelope strip, the spectrogram, the title, the numbers
const FMIN=20,NFFT=1024;
// ---------- wav in ----------
function readWav(buf){
  if(buf.toString('ascii',0,4)!=='RIFF'||buf.toString('ascii',8,12)!=='WAVE')throw new Error('not a wav');
  let o=12,fmt=null,data=null;
  while(o+8<=buf.length){const id=buf.toString('ascii',o,o+4),len=buf.readUInt32LE(o+4);
    if(id==='fmt ')fmt={fmt:buf.readUInt16LE(o+8),nc:buf.readUInt16LE(o+10),sr:buf.readUInt32LE(o+12),bits:buf.readUInt16LE(o+22)};
    else if(id==='data')data={o:o+8,len:Math.min(len,buf.length-o-8)};
    o+=8+len+(len&1);}
  if(!fmt||!data)throw new Error('no fmt/data');
  if(fmt.fmt!==1||fmt.bits!==16)throw new Error('want 16-bit pcm, got fmt '+fmt.fmt+'/'+fmt.bits+' bits');
  const n=Math.floor(data.len/2/fmt.nc),ch=[];
  for(let c=0;c<fmt.nc;c++)ch.push(new Float32Array(n));
  for(let i=0;i<n;i++)for(let c=0;c<fmt.nc;c++)ch[c][i]=buf.readInt16LE(data.o+(i*fmt.nc+c)*2)/32768;
  return {sr:fmt.sr,nc:fmt.nc,n:n,ch:ch};}
// ---------- fft ----------
function fft(re,im){ // in place, radix 2
  const n=re.length;
  for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;
    if(i<j){let t=re[i];re[i]=re[j];re[j]=t;t=im[i];im[i]=im[j];im[j]=t;}}
  for(let len=2;len<=n;len<<=1){const ang=-2*Math.PI/len,wr=Math.cos(ang),wi=Math.sin(ang);
    for(let i=0;i<n;i+=len){let cr=1,ci=0;
      for(let k=0;k<len/2;k++){const ur=re[i+k],ui=im[i+k],vr=re[i+k+len/2]*cr-im[i+k+len/2]*ci,vi=re[i+k+len/2]*ci+im[i+k+len/2]*cr;
        re[i+k]=ur+vr;im[i+k]=ui+vi;re[i+k+len/2]=ur-vr;im[i+k+len/2]=ui-vi;
        const ncr=cr*wr-ci*wi;ci=cr*wi+ci*wr;cr=ncr;}}}
  return re;}
const HANN=new Float32Array(NFFT);for(let i=0;i<NFFT;i++)HANN[i]=0.5-0.5*Math.cos(2*Math.PI*i/NFFT);
function spectrum(x,off){ // one frame's magnitude, NFFT/2 bins
  const re=new Float64Array(NFFT),im=new Float64Array(NFFT);
  for(let i=0;i<NFFT;i++){const k=off+i;re[i]=(k<x.length?x[k]:0)*HANN[i];}
  fft(re,im);
  const m=new Float64Array(NFFT/2);
  for(let i=0;i<NFFT/2;i++)m[i]=Math.sqrt(re[i]*re[i]+im[i]*im[i])/(NFFT/2);
  return m;}
// ---------- the numbers ----------
const db=v=>20*Math.log10(Math.max(v,1e-9));
function measure(w){
  const x=w.ch[0],n=w.n;
  let peak=0,sum=0,dc=0,clip=0;
  for(let c=0;c<w.nc;c++){const y=w.ch[c];for(let i=0;i<n;i++){const a=Math.abs(y[i]);if(a>peak)peak=a;if(a>=0.999)clip++;sum+=y[i]*y[i];dc+=y[i];}}
  const rms=Math.sqrt(sum/(n*w.nc)),dco=dc/(n*w.nc);
  // the mean spectrum over the whole file, and the bands it lands in
  const hop=Math.max(NFFT/2,Math.floor((n-NFFT)/220)||NFFT/2),mean=new Float64Array(NFFT/2);let frames=0;
  for(let o=0;o+NFFT<=n;o+=hop){const m=spectrum(x,o);for(let i=0;i<m.length;i++)mean[i]+=m[i]*m[i];frames++;}
  if(frames)for(let i=0;i<mean.length;i++)mean[i]=Math.sqrt(mean[i]/frames);
  const bf=i=>i*w.sr/NFFT;
  let e=0,ef=0;for(let i=1;i<mean.length;i++){const p=mean[i]*mean[i];e+=p;ef+=p*bf(i);}
  const centroid=e>0?ef/e:0;
  let acc=0,roll=0;for(let i=1;i<mean.length;i++){acc+=mean[i]*mean[i];if(acc>=0.85*e){roll=bf(i);break;}}
  const BANDS=[[0,120],[120,500],[500,2000],[2000,8000],[8000,24000]],bands=[];
  for(const [lo,hi] of BANDS){let b=0;for(let i=1;i<mean.length;i++){const f=bf(i);if(f>=lo&&f<hi)b+=mean[i]*mean[i];}bands.push(e>0?b/e:0);}
  // the envelope, and from it the attack and the decay of a one-shot
  const win=Math.max(1,Math.round(w.sr*0.005)),env=[];
  for(let o=0;o+win<=n;o+=win){let s=0;for(let i=0;i<win;i++)s+=x[o+i]*x[o+i];env.push(Math.sqrt(s/win));}
  let pi=0;for(let i=0;i<env.length;i++)if(env[i]>env[pi])pi=i;
  const ep=env[pi]||1e-9;
  let d40=-1;for(let i=pi;i<env.length;i++)if(env[i]<ep*0.01){d40=(i-pi)*win/w.sr;break;}
  const attack=pi*win/w.sr;
  // how steady is it? the spread of the frame energies says bed (steady) from event (not)
  let em=0;for(const v of env)em+=v;em/=Math.max(1,env.length);
  let ev=0;for(const v of env)ev+=(v-em)*(v-em);ev=Math.sqrt(ev/Math.max(1,env.length));
  return {peak:db(peak),rms:db(rms),crest:db(peak)-db(rms),clip:clip,dc:dco,centroid:centroid,roll:roll,bands:bands,
    attack:attack,decay:d40,steady:em>0?ev/em:0,env:env,mean:mean,hop:hop};}
// ---------- the picture ----------
const BG=[10,16,20],FG=[150,196,205],DIM=[52,80,88];
function ramp(v){ // 0..1 → dark blue, cyan, yellow, white. Enough contrast to see a 40 dB range at a glance
  v=Math.max(0,Math.min(1,v));
  const S=[[8,14,26],[16,64,110],[24,150,160],[190,205,90],[255,250,235]],x=v*(S.length-1),i=Math.min(S.length-2,Math.floor(x)),f=x-i;
  return [S[i][0]+(S[i+1][0]-S[i][0])*f,S[i][1]+(S[i+1][1]-S[i][1])*f,S[i][2]+(S[i+1][2]-S[i][2])*f];}
function panel(name,w,M){
  const img=Buffer.alloc(W*H*3);
  for(let i=0;i<W*H;i++){img[i*3]=BG[0];img[i*3+1]=BG[1];img[i*3+2]=BG[2];}
  const px=(x,y,c)=>{if(x<0||y<0||x>=W||y>=H)return;const o=((y|0)*W+(x|0))*3;img[o]=c[0];img[o+1]=c[1];img[o+2]=c[2];};
  const PW=W-MX-MR;
  text(img,W,H,MX,4,name,FG,1);
  const hdr=(w.n/w.sr).toFixed(2)+'s  '+w.sr+'hz  '+(w.nc>1?'stereo':'mono');
  text(img,W,H,W-MR-textW(hdr,1),4,hdr,DIM,1);
  // the envelope strip: the peak of each column, linear, with a −20 dB and a −40 dB guide
  const y0=HT,mid=y0+HW/2;
  for(const g of [0.1,0.01]){const yy=HW/2*g;for(let x=MX;x<MX+PW;x+=3){px(x,mid-yy,DIM);px(x,mid+yy,DIM);}}
  for(let x=0;x<PW;x++){
    const a=Math.floor(x/PW*w.n),b=Math.max(a+1,Math.floor((x+1)/PW*w.n));let p=0;
    for(let i=a;i<b;i++){const v=Math.abs(w.ch[0][i]);if(v>p)p=v;}
    const hgt=Math.max(1,p*HW/2);
    for(let y=-hgt;y<=hgt;y++)px(MX+x,mid+y,p>=0.999?[255,90,80]:FG);}
  // the spectrogram: log f from FMIN to nyquist, dB from −78 to 0 relative to the file's loudest bin
  const s0=y0+HW+2,ny=w.sr/2,lg=Math.log(ny/FMIN);
  const cols=PW,hop=Math.max(64,Math.floor((w.n-NFFT)/cols)),frames=[];
  let top=1e-9;
  for(let c=0;c<cols;c++){const m=spectrum(w.ch[0],Math.min(Math.max(0,w.n-NFFT),c*hop));frames.push(m);for(let i=1;i<m.length;i++)if(m[i]>top)top=m[i];}
  for(let c=0;c<cols;c++){const m=frames[c];
    for(let y=0;y<HS;y++){
      const f=FMIN*Math.exp(lg*(1-y/HS)),i0=f*NFFT/w.sr,i1=FMIN*Math.exp(lg*(1-(y-1)/HS))*NFFT/w.sr;
      let v=0,k0=Math.max(1,Math.floor(i0)),k1=Math.max(k0+1,Math.ceil(i1));
      for(let k=k0;k<k1&&k<m.length;k++)if(m[k]>v)v=m[k];
      px(MX+c,s0+y,ramp((db(v/top)+78)/78));}}
  // the frequency axis
  for(const f of [30,100,300,1000,3000,10000,20000]){
    if(f>=ny)continue;const y=s0+HS*(1-Math.log(f/FMIN)/lg);
    for(let x=MX-3;x<MX;x++)px(x,y,DIM);
    text(img,W,H,2,y-3,f>=1000?(f/1000)+'K':''+f,DIM,1);}
  // the numbers
  const B=M.bands.map(v=>Math.round(v*100));
  const l1='peak '+M.peak.toFixed(1)+'dB   rms '+M.rms.toFixed(1)+'dB   crest '+M.crest.toFixed(1)+'dB   centroid '+M.centroid.toFixed(0)+'hz   roll85 '+M.roll.toFixed(0)+'hz'+(M.clip?'   CLIPPED '+M.clip:'')+(Math.abs(M.dc)>0.002?'   DC '+M.dc.toFixed(3):'');
  const l2='bands  sub'+B[0]+'% low'+B[1]+'% mid'+B[2]+'% hi'+B[3]+'% air'+B[4]+'%    attack '+(M.attack*1000).toFixed(0)+'ms   decay40 '+(M.decay<0?'-':(M.decay*1000).toFixed(0)+'ms')+'   steadiness '+(1-Math.min(1,M.steady)).toFixed(2);
  text(img,W,H,MX,s0+HS+5,l1,M.clip?[255,120,110]:FG,1);
  text(img,W,H,MX,s0+HS+15,l2,DIM,1);
  return img;}
// ---------- run ----------
function main(){
  if(!fs.existsSync(DIR)){console.error('no test/render/ — run the bench first: node serve.js, open dev.html#bench, click once');process.exit(1);}
  const filt=process.argv.slice(2);
  const names=fs.readdirSync(DIR).filter(f=>f.endsWith('.wav')).filter(f=>!filt.length||filt.some(q=>f.indexOf(q)>=0)).sort();
  if(!names.length){console.error('no wavs in test/render/'+(filt.length?' matching '+filt.join(' '):''));process.exit(1);}
  const rows=[],panels=[];
  for(const f of names){
    let w;try{w=readWav(fs.readFileSync(path.join(DIR,f)));}catch(e){console.error(f+': '+e.message);continue;}
    const M=measure(w),img=panel(f.replace(/\.wav$/,''),w,M);
    fs.writeFileSync(path.join(DIR,f.replace(/\.wav$/,'.png')),png(img,W,H));
    panels.push(img);
    rows.push([f.replace(/\.wav$/,''),(w.n/w.sr).toFixed(2),M.peak.toFixed(1),M.rms.toFixed(1),M.crest.toFixed(1),M.centroid.toFixed(0),M.roll.toFixed(0),
      M.bands.map(v=>String(Math.round(v*100)).padStart(2)).join('/'),(M.attack*1000).toFixed(0),M.decay<0?'-':(M.decay*1000).toFixed(0),(1-Math.min(1,M.steady)).toFixed(2),M.clip?'CLIP':'']);}
  const head=['name','s','peak','rms','crest','centr','roll85','sub/low/mid/hi/air','atk','dec40','steady',''];
  const wid=head.map((h,i)=>Math.max(h.length,...rows.map(r=>String(r[i]).length)));
  const line=r=>r.map((c,i)=>String(c).padEnd(wid[i])).join('  ').trimEnd();
  console.log('');console.log(line(head));console.log(wid.map(n=>'-'.repeat(n)).join('  '));
  for(const r of rows)console.log(line(r));
  console.log('\n'+rows.length+' sounds  →  test/render/*.png');
  if(panels.length>1){ // the sheet: every panel stacked, for looking at the lot in one go
    const SH=panels.length*H,sheet=Buffer.alloc(W*SH*3);
    panels.forEach((p,i)=>p.copy(sheet,i*W*H*3));
    fs.writeFileSync(path.join(DIR,'_sheet.png'),png(sheet,W,SH));
    console.log('sheet             →  test/render/_sheet.png');}
}
main();
