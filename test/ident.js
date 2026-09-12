// Dev harness (v11.10): does compile(SPECS.x) produce the same geometry as the hand builder it replaces? Compares triangle count,
// bounds and an order-insensitive checksum of positions and colours, idle and in the action pose, with real geometry.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const ORDER=fs.readFileSync(path.join(ROOT,'src','order.txt'),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&s[0]!=='#');
let js=ORDER.map(n=>fs.readFileSync(path.join(ROOT,'src',n+'.js'),'utf8')).join('\n');
const OLD=process.env.OLD?fs.readFileSync(process.env.OLD,'utf8'):'';
js+='\nconst __OLD=(function(){\n'+OLD+'\nreturn typeof buildRaptor!=="undefined"?{buildSoftArm,buildArrow,buildCoil,buildGreat,buildOrtho,buildFinback,buildAbyssal,buildGrazer,buildDarter,buildNeedle,buildBasker,buildCrusher,buildRaptor,RAPTORS}:{buildVeil,buildLurker,buildRasp,buildStone,buildEel,buildScuttler,buildTrap,buildHook,buildPicker,buildFlicker,buildTread,buildComb,buildWatcher,buildPall,buildJelly,buildSailer};})();';
js+='\nglobal.__id={SPECS,compile,rigRest,PAL,DEFS,CLADES,derive,statsOf,validate,OLD:__OLD};';
const tmp=path.join(require('os').tmpdir(),'tethys_ident.js');
fs.writeFileSync(tmp,'(function(){"use strict";\n'+js+'\n})();');
process.env.PICK='0';require('./stub.js');require('./geo.js')(global.THREE);require(tmp);
const Z=global.__id,THREE=global.THREE,O=Z.OLD;
function localMatrix(o){const q=new THREE.Quaternion();const e=o.rotation;if(e.x||e.y||e.z)q.setFromEuler(e);else q.copy(o.quaternion);return new THREE.Matrix4().compose(o.position,q,o.scale);}
function gather(g){const out=[];const walk=(o,M)=>{if(o.visible===false)return;const m=new THREE.Matrix4().multiplyMatrices(M,localMatrix(o));
  if(o.isMesh&&o.geometry&&o.geometry.attributes.position){const pa=o.geometry.attributes.position.array,ca=o.geometry.attributes.color?o.geometry.attributes.color.array:null,e=m.elements;
    for(let i=0;i<pa.length;i+=3){const x=pa[i],y=pa[i+1],z=pa[i+2];out.push([e[0]*x+e[4]*y+e[8]*z+e[12],e[1]*x+e[5]*y+e[9]*z+e[13],e[2]*x+e[6]*y+e[10]*z+e[14],ca?ca[i]:1,ca?ca[i+1]:1,ca?ca[i+2]:1]);}}
  for(const ch of o.children)walk(ch,m);};walk(g,new THREE.Matrix4());return out;}
function seed(){let a=12345;Math.random=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
function sig(b,st){b.anim(1.0,0.6,st);if(b.rigs)for(const r of b.rigs)Z.rigRest(r);const V=gather(b.g);let lo=[1e9,1e9,1e9],hi=[-1e9,-1e9,-1e9],sum=[0,0,0,0,0,0],sq=0;
  for(const v of V){for(let a=0;a<3;a++){lo[a]=Math.min(lo[a],v[a]);hi[a]=Math.max(hi[a],v[a]);}for(let a=0;a<6;a++)sum[a]+=v[a];sq+=v[0]*v[0]*1.3+v[1]*v[1]*1.7+v[2]*v[2]*1.1+v[3]*7+v[4]*11+v[5]*13;}
  return {n:V.length/3,lo:lo.map(x=>+x.toFixed(3)),hi:hi.map(x=>+x.toFixed(3)),sum:sum.map(x=>+x.toFixed(2)),sq:+sq.toFixed(1)};}
const pairs=[['soft',()=>O.buildSoftArm(1.0,Z.PAL.softP)],['arrow',()=>O.buildArrow(1.1,Z.PAL.arrow)],['coil',()=>O.buildCoil(1.0,Z.PAL.coilP)],['great',()=>O.buildGreat(3.2,Z.PAL.great)],['ortho',()=>O.buildOrtho(1,Z.PAL.ortho)],
  ['fin',()=>O.buildFinback(1.05,Z.PAL.finP,{pred:true})],['ridge',()=>O.buildFinback(3.1,Z.PAL.ridge,{spikes:true,pred:true})],['abyssal',()=>O.buildAbyssal(5.0,Z.PAL.abyss)],['grazer',()=>O.buildGrazer(1.5,Z.PAL.grazer)],['darter',()=>O.buildDarter(1.2,Z.PAL.darter,false)],['needle',()=>O.buildNeedle(0.75,Z.PAL.needle)],['basker',()=>O.buildBasker(1.2,Z.PAL.basker)],['crusher',()=>O.buildCrusher(1.15,Z.PAL.crusher)],
  ['sickle',()=>O.buildRaptor(1.0,Z.PAL.sickle,O.RAPTORS.keel)],['hood',()=>O.buildRaptor(1.0,Z.PAL.hood,O.RAPTORS.hood)],['hose',()=>O.buildRaptor(1.0,Z.PAL.hose,O.RAPTORS.splay)],['lash',()=>O.buildRaptor(1.0,Z.PAL.lash,O.RAPTORS.lash)],['ram',()=>O.buildRaptor(1.0,Z.PAL.ram,O.RAPTORS.ram)]];
// v11.25: the second migration (OLD= a copy of creatures_builders.js from v11.24)
const pairs2=[['rasp',()=>O.buildRasp(1.0,Z.PAL.rasp)],['veil',()=>O.buildVeil(1.4,Z.PAL.veil)],['lurker',()=>O.buildLurker(1.6,Z.PAL.lurker)],['watcher',()=>O.buildWatcher(1.0,Z.PAL.watcher)],['pall',()=>O.buildPall(1.8,Z.PAL.pall)],
  ['eel',()=>O.buildEel(1,Z.PAL.eel)],['stone',()=>O.buildStone(1.0,Z.PAL.stone)],['scuttle',()=>O.buildScuttler(1.0,Z.PAL.scuttle)],['trap',()=>O.buildTrap(1.0,Z.PAL.trap)],['hook',()=>O.buildHook(1.0,Z.PAL.hook)],['picker',()=>O.buildPicker(1.0,Z.PAL.picker)],
  ['flicker',()=>O.buildFlicker(1.0,Z.PAL.flicker)],['tread',()=>O.buildTread(1.0,Z.PAL.tread)],['comb',()=>O.buildComb(1.0,Z.PAL.comb)],['jelly',()=>O.buildJelly(1.2)],['deepbell',()=>O.buildJelly(3.8,true)],['sailer',()=>O.buildSailer(1)],['greatsailer',()=>O.buildSailer(2.5)]];
let bad=0;
for(const [id,old] of (O.buildRaptor?pairs:pairs2)){
  if(!Z.SPECS[id]){console.log(id.padEnd(8),'no spec');continue;}
  for(const [nm,st] of [['idle',{}],['act',{tell:1,strike:1,jet:true,pulse:0.6,withdrawn:true}]]){
    let a,b;try{seed();a=sig(old(),st);}catch(e){console.log(id,'old failed',e.message);bad++;continue;}
    try{seed();b=sig(Z.compile(Z.SPECS[id]),st);}catch(e){console.log(id,'spec failed',e.stack);bad++;continue;}
    const same=JSON.stringify(a)===JSON.stringify(b);if(!same)bad++;
    console.log(id.padEnd(8),nm.padEnd(5),same?'same':'DIFF','tris '+a.n+'/'+b.n,'sq '+a.sq+'/'+b.sq,same?'':'\n   old '+JSON.stringify(a)+'\n   new '+JSON.stringify(b));
  }
  const v=Z.validate(Z.SPECS[id]);if(v.warnings.length)console.log('   warnings:',v.warnings.join('; '));
}
console.log(bad?'IDENT FAILED '+bad:'IDENT OK');process.exit(bad?1:0);
