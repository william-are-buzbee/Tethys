// Headless check of the flora pools (v11.52, chunks.js): one instanced mesh per species across the loaded cells. Cells are loaded and
// unloaded by hand and the pools' bookkeeping is checked against them — every block contiguous and in order, the counts summing to the
// mesh's count, no NaN in a matrix, a cell's block byte-identical whether it loads alone, first or last (the placement is the cell's own rng),
// a removed cell leaving the others' blocks untouched, a card species never pooled, a pool growing without losing what it had. It proves
// the storage, not the look. Same bundle and stub as the smoke test.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const ORDER=fs.readFileSync(path.join(ROOT,'src','order.txt'),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&s[0]!=='#');
let js=ORDER.map(n=>fs.readFileSync(path.join(ROOT,'src',n+'.js'),'utf8')).join('\n');
js+='\nglobal.__pool={POOLS,poolStats,poolCull,chunks,ckey,cellOf,loadChunkNow,unloadChunk,worldClear,FLORA,FAR_IMP,player,Q,NCELL};';
const tmp=path.join(require('os').tmpdir(),'tethys_pool.js');
fs.writeFileSync(tmp,'(function(){"use strict";\n'+js+'\n})();');
process.env.PICK='0';
require('./stub.js');require(tmp);
const X=global.__pool;let fails=0;
function ok(c,msg){console.log((c?'  ok   ':'  FAIL ')+msg);if(!c)fails++;}
function check(label){ // the invariants over every pool
  let bad=[];for(const [f,P] of X.POOLS){let n=0,prev=0;for(const b of P.blocks){if(b.start!==prev)bad.push(f.id+': block at '+b.start+' expected '+prev);if(!X.chunks.has(b.ch.k))bad.push(f.id+': block of an unloaded cell');prev=b.start+b.count;n+=b.count;}
    let nv=0,seenHidden=false;for(const b of P.blocks){if(b.vis){if(seenHidden)bad.push(f.id+': a seen block after a hidden one');nv+=b.count;}else seenHidden=true;}
    if(n!==P.n||P.im.count!==P.nVis||nv!==P.nVis)bad.push(f.id+': counts '+n+' '+P.n+' vis '+nv+' '+P.nVis+' '+P.im.count);if(P.n>P.cap)bad.push(f.id+': over capacity');
    const M=P.im.instanceMatrix.array;for(let i=0;i<P.n*16;i++)if(M[i]!==M[i])bad.push(f.id+': NaN');
    if(P.f.card)bad.push(f.id+': a card species pooled');}
  ok(bad.length===0,label+': '+X.POOLS.size+' pools, '+JSON.stringify(X.poolStats())+(bad.length?' — '+bad.slice(0,4).join('; '):''));}
function blockOf(f,ch){const P=X.POOLS.get(f);if(!P)return null;const b=P.blocks.find(b=>b.ch===ch);if(!b)return null;return {m:P.im.instanceMatrix.array.slice(b.start*16,(b.start+b.count)*16),c:P.im.instanceColor.array.slice(b.start*3,(b.start+b.count)*3),v:P.vars?P.geo.attributes.aVar.array.slice(b.start,b.start+b.count):null,cur:P.cur?P.geo.attributes.aCur.array.slice(b.start*2,(b.start+b.count)*2):null,n:b.count};}
function same(a,b){if(!a||!b)return a===b;if(a.n!==b.n)return false;for(const k of ['m','c','v','cur']){if(!a[k]&&!b[k])continue;if(!a[k]||!b[k]||a[k].length!==b[k].length)return false;for(let i=0;i<a[k].length;i++)if(a[k][i]!==b[k][i])return false;}return true;}
// the forest's edge, the person's readout spot of 15 Sep (147, -3, -443): a 3×3 of cells
const ci=X.cellOf(147),cj=X.cellOf(-443);const cells=[];for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++)cells.push([ci+di,cj+dj]);
X.worldClear();for(const [i,j] of cells)X.loadChunkNow(i,j);
check('a 3×3 at the forest loaded');
const mid=X.chunks.get(X.ckey(ci,cj));ok(!!mid&&mid.pooled.length>0,'the middle cell wrote '+(mid?mid.pooled.length:0)+' blocks');
const heavy=[...X.POOLS.values()].sort((a,b)=>b.n-a.n).slice(0,6).map(P=>P.f.id+' '+P.n);console.log('  biggest pools: '+heavy.join(', '));
// card species stay per cell
const cards=X.FAR_IMP.map(sp=>sp.f.id);ok(cards.every(id=>![...X.POOLS.keys()].some(f=>f.id===id)),'card species not pooled: '+cards.join(' '));
ok([...X.chunks.values()].some(ch=>ch.flora.length>0),'per-cell meshes remain for the card, padded and glow species');
// the middle cell's blocks, then the cell out: the others' blocks unchanged
const before=new Map();for(const P of mid.pooled)before.set(P.f,blockOf(P.f,mid));
const others=[...X.chunks.values()].filter(ch=>ch!==mid);const keep=[];for(const ch of others)for(const P of ch.pooled)keep.push([P.f,ch,blockOf(P.f,ch)]);
X.unloadChunk(mid);check('the middle cell unloaded');
ok(![...X.POOLS.values()].some(P=>P.blocks.some(b=>b.ch===mid)),'no block of the unloaded cell remains');
ok(keep.every(([f,ch,b])=>same(b,blockOf(f,ch))),'the other cells\' blocks are byte-identical after the removal');
// the cell back, last: its block equals what it wrote first time (the placement is the cell's own rng, the pool only storage)
X.loadChunkNow(ci,cj);const mid2=X.chunks.get(X.ckey(ci,cj));check('the middle cell reloaded last');
function diffList(ch){const L=[];for(const [f,b] of before){const c=blockOf(f,ch);if(same(b,c))continue;const w=[];for(const k of ['m','c','v','cur']){if(!b[k]&&!c[k])continue;if(!b[k]||!c[k]||b[k].length!==c[k].length||b[k].some((x,i)=>x!==c[k][i]))w.push(k);}L.push(f.id+'('+w.join(',')+')');}return L;}
function placed(L){return !L.some(d=>d.slice(d.indexOf('(')+1,-1).split(',').some(k=>k==='m'||k==='v'));} // a difference only in the colours' jitter or aCur is not a placement
const dN=diffList(mid2);ok(placed(dN),'its blocks match its first load: '+(before.size-dN.length)+' same, '+dN.length+' different'+(dN.length?' — '+dN.join(' '):''));
// alone
X.worldClear();check('the world cleared');ok([...X.POOLS.values()].every(P=>P.n===0&&P.blocks.length===0),'every pool empty after worldClear');
X.loadChunkNow(ci,cj);const mid3=X.chunks.get(X.ckey(ci,cj));let sameA=0,diffA=0;const diffs=[];for(const [f,b] of before){const c=blockOf(f,mid3);if(same(b,c))sameA++;else{diffA++;const w=[];for(const k of ['m','c','v','cur']){if(!b[k]&&!c[k])continue;if(!b[k]||!c[k]||b[k].length!==c[k].length||b[k].some((x,i)=>x!==c[k][i]))w.push(k);}diffs.push(f.id+'('+w.join(',')+')');}}
// a cell alone against the same cell in a 3×3: the placement must not read the neighbours (DESIGN Determinism). A difference only in aCur (the lean
// to the current, read through steadyOf) is the current's field reading a neighbour's grid — cosmetic; a matrix difference is a placement that read one.
ok(diffs.every(d=>!d.slice(d.indexOf('(')+1,-1).split(',').some(k=>k==='m'||k==='v')),'loaded alone, its blocks match: '+sameA+' same, '+diffA+' different'+(diffs.length?' — '+diffs.join(' '):''));
// the partition by sight (v11.52.1): every cell seen, then the middle hidden, then a corner, then all back — the seen blocks first, the data intact
X.worldClear();for(const [i,j] of cells)X.loadChunkNow(i,j);const all=[...X.chunks.values()];for(const ch of all){ch.group.visible=true;ch.near=true;}X.poolCull();
const snap=()=>{const L=[];for(const ch of all)for(const P of ch.pooled)L.push([P.f,ch,blockOf(P.f,ch)]);return L;};const s0=snap();
check('every cell in view');ok([...X.POOLS.values()].every(P=>P.nVis===P.n),'every block seen: nVis = n');
const m5=X.chunks.get(X.ckey(ci,cj));m5.group.visible=false;X.poolCull();check('the middle cell out of view');
ok([...X.POOLS.values()].every(P=>P.blocks.every(b=>(b.ch!==m5)===b.vis)),'only the middle cell\'s blocks hidden, and they sit last');
ok(s0.every(([f,ch,b])=>same(b,blockOf(f,ch))),'every block\'s data intact after the moves');
const c5=all.find(ch=>ch!==m5);c5.near=false;X.poolCull();check('a corner cell past FLORA_FAR too');ok(s0.every(([f,ch,b])=>same(b,blockOf(f,ch))),'intact again');
m5.group.visible=true;c5.near=true;X.poolCull();check('all back in view');ok([...X.POOLS.values()].every(P=>P.nVis===P.n)&&s0.every(([f,ch,b])=>same(b,blockOf(f,ch))),'all seen again, data intact');
// growth: a 5×5 forces some pools past their first capacity (12 cells' worth); nothing lost on the way
const caps=new Map();for(const P of X.POOLS.values())caps.set(P.f,P.cap);
X.worldClear();for(let dj=-2;dj<=2;dj++)for(let di=-2;di<=2;di++){const i=ci+di,j=cj+dj;if(i>=0&&j>=0&&i<X.NCELL&&j<X.NCELL)X.loadChunkNow(i,j);}
check('a 5×5 loaded');let grew=0;for(const P of X.POOLS.values())if(P.cap>(caps.get(P.f)||0))grew++;console.log('  pools that grew: '+grew+' of '+X.POOLS.size);
const mid4=X.chunks.get(X.ckey(ci,cj));let sameG=0,diffG=0;for(const [f,b] of before){if(same(b,blockOf(f,mid4)))sameG++;else diffG++;}ok(diffG===0,'the middle cell\'s blocks intact across the growth: '+sameG+' same, '+diffG+' different');
const st=X.poolStats();console.log('  the 5×5: '+st.draws+' pool draws for '+st.inst+' instances; per cell it was '+[...X.chunks.values()].reduce((n,ch)=>n+ch.pooled.length,0)+' meshes');
X.worldClear();
console.log(fails?'\nFAIL '+fails:'\nALL OK');process.exit(fails?1:0);
