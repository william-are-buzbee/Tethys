// Headless creature preview: runs the bundle against the stub with real geometry (test/geo.js), builds each species, poses it
// (anim + rigRest: the swim pose, no simulation) and rasterizes a contact sheet — four views (three-quarter, side, front,
// top) per pose, idle and, for the builders that answer it, the action (st.tell / st.strike / st.jet) — to
// test/preview/<id>.png. A software Lambert render with the merge's vertex colours; not the game's light or fog, but the
// shape, the proportions, the palette and the pose are real. The dark line in the side and front views is the ground as
// the game clamps a floor creature (size*0.35 under the origin).
//   node test/preview.js            every species in ROSTER
//   node test/preview.js sickle trap  just these
//   POSE=idle|act|all  TILE=320  T=1.0 (the anim time)  SPD=0.6 (the anim speed)
//   PALV=k  builds every species in palette variant k (creatures_builders.js PAL_VARIANTS; the zoo's up/down)
//   COATS=1 writes <id>_coats.png instead: the three-quarter view in every variant side by side
//   NORIG=1  hides the chain rigs (arms, lines) so a body with 25 m lines can be looked at
//   SPEC=path.json   renders a lab spec (the lab's "copy json") instead of the roster, to test/preview/spec_<id>.png
//   FLORA=1 [DEPTH=-30] node test/preview.js reed rind   a flora species' three variants (quarter over side), tinted by pigment at DEPTH
//                    A rock kit (crag, slab, ledge...) renders as one column, the line at its sink.
//                    (default: the middle of its env.h) — to test/preview/flora_<id>.png. No ids: every species with variants
const fs=require('fs'),path=require('path'),zlib=require('zlib');
const ROOT=path.join(__dirname,'..');
const ORDER=fs.readFileSync(path.join(ROOT,'src','order.txt'),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&s[0]!=='#');
let js=ORDER.map(n=>fs.readFileSync(path.join(ROOT,'src',n+'.js'),'utf8')).join('\n');
js+='\nglobal.__zoo={DEFS,CLADES,ROSTER,rigRest,V3,PAL,PAL_VARIANTS,palVariant,palKey,compile,validate,derive,specFromJSON,FLORA,pigment};';
const tmp=path.join(require('os').tmpdir(),'tethys_preview.js');
fs.writeFileSync(tmp,'(function(){"use strict";\n'+js+'\n})();');
process.env.PICK='0';
require('./stub.js');require('./geo.js')(global.THREE);require(tmp);
const Z=global.__zoo,THREE=global.THREE;

// ---------- gather triangles from a group, in the group's frame ----------
function localMatrix(o){const q=new THREE.Quaternion();const e=o.rotation;if(e.x||e.y||e.z)q.setFromEuler(e);else q.copy(o.quaternion);return new THREE.Matrix4().compose(o.position,q,o.scale);}
function gather(g){
  const tris=[];// {p:[9 numbers], c:[r,g,b]}
  const walk=(o,M)=>{if(o.visible===false)return;const m=new THREE.Matrix4().multiplyMatrices(M,localMatrix(o));
    if(o.isMesh&&o.geometry&&o.geometry.attributes.position){const pa=o.geometry.attributes.position.array,ca=o.geometry.attributes.color?o.geometry.attributes.color.array:null,e=m.elements;
      const mat=o.material||{},base=mat.color?[mat.color.r,mat.color.g,mat.color.b]:[1,1,1],op=mat.transparent?(mat.opacity||1):1;
      for(let i=0;i<pa.length;i+=9){const p=[];for(let k=0;k<9;k+=3){const x=pa[i+k],y=pa[i+k+1],z=pa[i+k+2];p.push(e[0]*x+e[4]*y+e[8]*z+e[12],e[1]*x+e[5]*y+e[9]*z+e[13],e[2]*x+e[6]*y+e[10]*z+e[14]);}
        const c=ca?[(ca[i]+ca[i+3]+ca[i+6])/3*base[0],(ca[i+1]+ca[i+4]+ca[i+7])/3*base[1],(ca[i+2]+ca[i+5]+ca[i+8])/3*base[2]]:base;tris.push({p:p,c:c,op:op});}}
    for(const ch of o.children)walk(ch,m);};
  walk(g,new THREE.Matrix4());return tris;
}
// ---------- rasterizer ----------
function norm(v){const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
const VIEWS={
  quarter:(()=>{const f=norm([1,0.75,1.25]);const r=norm(cross([0,1,0],f));const u=cross(f,r);return {r,u,f};})(),
  side:{r:[0,0,1],u:[0,1,0],f:[-1,0,0]},
  front:{r:[1,0,0],u:[0,1,0],f:[0,0,1]},
  top:{r:[-1,0,0],u:[0,0,1],f:[0,1,0]}
};
const LIGHT=norm([-0.45,0.8,0.7]);
function renderTile(img,W,ox,oy,S,tris,view,centre,radius,ground){
  const scale=S*0.44/radius,cx=S/2,cy=S/2,zb=new Float32Array(S*S).fill(-1e9);
  const bg=[0.10,0.32,0.42];
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=((oy+y)*W+ox+x)*3;img[i]=bg[0]*255;img[i+1]=bg[1]*255;img[i+2]=bg[2]*255;}
  if(ground!==null&&(view===VIEWS.side||view===VIEWS.front)){const gy=Math.round(cy-(ground-centre[1])*scale);if(gy>=0&&gy<S)for(let x=0;x<S;x++){const i=((oy+gy)*W+ox+x)*3;img[i]=20;img[i+1]=40;img[i+2]=50;}}
  const P=[];
  for(const t of tris){const p=t.p,v=[];for(let k=0;k<9;k+=3){const d=[p[k]-centre[0],p[k+1]-centre[1],p[k+2]-centre[2]];v.push([cx+dot(d,view.r)*scale,cy-dot(d,view.u)*scale,dot(d,view.f)]);}
    const e1=[p[3]-p[0],p[4]-p[1],p[5]-p[2]],e2=[p[6]-p[0],p[7]-p[1],p[8]-p[2]],n=norm(cross(e1,e2));const nv=[dot(n,view.r),dot(n,view.u),dot(n,view.f)];
    if(nv[2]<=0)continue; // back face (the game's materials are single-sided)
    const sh=0.32+0.68*Math.max(0,dot(nv,LIGHT));P.push({v,c:[t.c[0]*sh,t.c[1]*sh,t.c[2]*sh],op:t.op});}
  P.sort((a,b)=>(a.v[0][2]+a.v[1][2]+a.v[2][2])-(b.v[0][2]+b.v[1][2]+b.v[2][2])); // painter's for the translucent parts; the z-buffer does the rest
  for(const t of P){const [a,b,c]=t.v;const minx=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),maxx=Math.min(S-1,Math.ceil(Math.max(a[0],b[0],c[0]))),miny=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),maxy=Math.min(S-1,Math.ceil(Math.max(a[1],b[1],c[1])));
    const area=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);if(Math.abs(area)<1e-9)continue;
    for(let y=miny;y<=maxy;y++)for(let x=minx;x<=maxx;x++){const px=x+0.5,py=y+0.5;
      const w0=((b[0]-px)*(c[1]-py)-(b[1]-py)*(c[0]-px))/area,w1=((c[0]-px)*(a[1]-py)-(c[1]-py)*(a[0]-px))/area,w2=1-w0-w1;
      if(w0<0||w1<0||w2<0)continue;const z=w0*a[2]+w1*b[2]+w2*c[2];const zi=y*S+x;if(z<=zb[zi])continue;if(t.op>=0.99)zb[zi]=z;
      const i=((oy+y)*W+ox+x)*3,k=t.op;img[i]=clamp255(img[i]*(1-k)+t.c[0]*255*k);img[i+1]=clamp255(img[i+1]*(1-k)+t.c[1]*255*k);img[i+2]=clamp255(img[i+2]*(1-k)+t.c[2]*255*k);}}
}
function clamp255(v){return v<0?0:v>255?255:v;}
// ---------- png ----------
function crc32(buf){let c,crc=0xffffffff;for(let n=0;n<buf.length;n++){c=(crc^buf[n])&0xff;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;crc=(crc>>>8)^c;}return (crc^0xffffffff)>>>0;}
function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const td=Buffer.concat([Buffer.from(type),data]);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(td));return Buffer.concat([len,td,crc]);}
function png(img,W,H){const raw=Buffer.alloc((W*3+1)*H);for(let y=0;y<H;y++){raw[y*(W*3+1)]=0;for(let x=0;x<W*3;x++)raw[y*(W*3+1)+1+x]=img[y*W*3+x];}
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=2;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
// ---------- sheets ----------
const S=+(process.env.TILE||320),T0=+(process.env.T||1.0),SPD=+(process.env.SPD||0.6),POSE=process.env.POSE||'all';
const want=process.argv.slice(2);
const outDir=path.join(__dirname,'preview');if(!fs.existsSync(outDir))fs.mkdirSync(outDir);
let ids=Z.ROSTER.filter(r=>!want.length||want.indexOf(r.id)>=0);
if(process.env.SPEC){const sp=Z.validate(Z.specFromJSON(fs.readFileSync(process.env.SPEC,'utf8'))),dv=Z.derive(sp.spec);
  for(const w of sp.warnings)console.log('  warn:',w);console.log('  derived:',JSON.stringify(dv));
  ids=[{id:'spec_'+(sp.spec.id||'x'),clade:sp.spec.clade,spec:sp.spec}];}
const PALV=+(process.env.PALV||0),COATS=!!process.env.COATS;
if(process.env.FLORA){
  const fl=Z.FLORA.filter(f=>(f.vars||f.lumps)&&(!want.length||want.indexOf(f.id)>=0)); // a rock kit (lumps, no variants) renders once, the ground line at its sink (v11.19)
  for(const f of fl){
    const h=process.env.DEPTH!==undefined?+process.env.DEPTH:f.env&&f.env.h?(f.env.h[0]+f.env.h[1])/2:-20,tint=f.photo?Z.pigment(h,f.line):[1,1,1];
    const pa=f.geo.attributes.position.array,ca=f.geo.attributes.color.array,va=f.geo.attributes.vid?f.geo.attributes.vid.array:null,nv=va?3:1,W=S*nv,H=S*2,img=new Uint8Array(W*H*3),gl=f.lumps?-(f.sink||0):0;
    for(let k=0;k<nv;k++){const tris=[];
      for(let i=0;i<pa.length/3;i+=3){if(va&&va[i]!==k)continue;const p=[],j=i*3;for(let q=0;q<9;q++)p.push(pa[j+q]);
        tris.push({p:p,c:[(ca[j]+ca[j+3]+ca[j+6])/3*tint[0],(ca[j+1]+ca[j+4]+ca[j+7])/3*tint[1],(ca[j+2]+ca[j+5]+ca[j+8])/3*tint[2]],op:1});}
      let lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];for(const t of tris)for(let q=0;q<9;q+=3)for(let a=0;a<3;a++){lo[a]=Math.min(lo[a],t.p[q+a]);hi[a]=Math.max(hi[a],t.p[q+a]);}
      const centre=[(lo[0]+hi[0])/2,(lo[1]+hi[1])/2,(lo[2]+hi[2])/2],radius=Math.max(hi[0]-lo[0],hi[1]-lo[1],hi[2]-lo[2])/2||1;
      renderTile(img,W,k*S,0,S,tris,VIEWS.quarter,centre,radius,gl);renderTile(img,W,k*S,S,S,tris,VIEWS.side,centre,radius,gl);
      if(k===0)console.log(f.id.padEnd(9),'tris '+String(tris.length).padStart(5),' extent x %s y %s z %s (m) at',(hi[0]-lo[0]).toFixed(2),(hi[1]-lo[1]).toFixed(2),(hi[2]-lo[2]).toFixed(2),h);}
    fs.writeFileSync(path.join(outDir,'flora_'+f.id+'.png'),png(img,W,H));
  }
  console.log('wrote',fl.length,'flora sheets to test/preview/');process.exit(0);
}
// build a species in a palette variant: swap its PAL entry while the builder runs, as the zoo does
function buildIn(r,build,k){if(r.spec)return Z.compile(r.spec);const pk=Z.palKey(r.id),pal0=pk?Z.PAL[pk]:null;if(pal0&&k)Z.PAL[pk]=Z.palVariant(pal0,k,r.clade);try{return build();}finally{if(pal0)Z.PAL[pk]=pal0;}}
if(COATS){
  const nv=Z.PAL_VARIANTS.length;
  for(const r of ids){
    const build=r.player?Z.CLADES.find(c=>c.id===r.id).build:Z.DEFS[r.id].build,W=S*nv,H=S,img=new Uint8Array(W*H*3);
    for(let k=0;k<nv;k++){const b=buildIn(r,build,k);b.anim(T0,SPD,{});if(b.rigs)for(const rig of b.rigs)Z.rigRest(rig);const tris=gather(b.g);
      let lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];for(const t of tris)for(let q=0;q<9;q+=3)for(let a=0;a<3;a++){lo[a]=Math.min(lo[a],t.p[q+a]);hi[a]=Math.max(hi[a],t.p[q+a]);}
      const centre=[(lo[0]+hi[0])/2,(lo[1]+hi[1])/2,(lo[2]+hi[2])/2],radius=Math.max(hi[0]-lo[0],hi[1]-lo[1],hi[2]-lo[2])/2||1;
      renderTile(img,W,k*S,0,S,tris,VIEWS.quarter,centre,radius,null);}
    fs.writeFileSync(path.join(outDir,r.id+'_coats.png'),png(img,W,H));
  }
  console.log('wrote',ids.length,'coat strips to test/preview/');process.exit(0);
}
for(const r of ids){
  const build0=r.spec?null:r.player?Z.CLADES.find(c=>c.id===r.id).build:Z.DEFS[r.id].build,build=()=>buildIn(r,build0,PALV);
  const poses=[{name:'idle',st:{}}];
  if(POSE!=='idle')poses.push({name:'act',st:{tell:1,strike:1,jet:true,pulse:0.6,lunge:true}});
  if(POSE==='act')poses.shift();
  const W=S*4,H=S*poses.length,img=new Uint8Array(W*H*3);
  let row=0,ntri=0;
  for(const pose of poses){
    const b=build();b.anim(T0,SPD,pose.st);if(b.rigs)for(const rig of b.rigs){Z.rigRest(rig);if(process.env.NORIG)rig.mesh.visible=false;}
    const tris=gather(b.g);ntri=tris.length;
    let lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9];for(const t of tris)for(let k=0;k<9;k+=3)for(let a=0;a<3;a++){lo[a]=Math.min(lo[a],t.p[k+a]);hi[a]=Math.max(hi[a],t.p[k+a]);}
    const centre=[(lo[0]+hi[0])/2,(lo[1]+hi[1])/2,(lo[2]+hi[2])/2],radius=Math.max(hi[0]-lo[0],hi[1]-lo[1],hi[2]-lo[2])/2||1;
    const size=r.spec?r.spec.size:r.player?Z.CLADES.find(c=>c.id===r.id).size:Z.DEFS[r.id].size;
    const ground=r.floor?-size*0.35:null;
    let col=0;for(const v of ['quarter','side','front','top']){renderTile(img,W,col*S,row*S,S,tris,VIEWS[v],centre,radius,ground);col++;}
    if(pose.name==='idle')console.log(r.id.padEnd(9),'tris '+String(ntri).padStart(5),' extent x %s y %s z %s (m)',(hi[0]-lo[0]).toFixed(2),(hi[1]-lo[1]).toFixed(2),(hi[2]-lo[2]).toFixed(2),' y range '+lo[1].toFixed(2)+'..'+hi[1].toFixed(2),' z '+lo[2].toFixed(2)+'..'+hi[2].toFixed(2),ground!==null?' ground at '+ground.toFixed(2):'');
    row++;
  }
  fs.writeFileSync(path.join(outDir,r.id+'.png'),png(img,W,H));
}
console.log('wrote',ids.length,'sheets to test/preview/');
