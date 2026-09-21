// Headless inventory of the creator (v11.70, the registry pass): what the lab offers against what the kit can build. Drives the real lab
// (labLoad, the panel's own input and select handlers, labPanelHTML) over every clade × every core × every part kind × every style it
// offers, in both modes — the dev lab, and the creator (lab.player) with every species seen — and reads the panel's HTML as the person
// would: a row is a control. One table, a line per combination:
//   ok      it compiles (no throw, no NaN in the geometry, the capsules or the calculator)
//   FAIL    it does not — a part from another animal type, as a rule: its defaults read a frame this core does not have
//   blank   a control with no label (the raw key shows), no value (NaN, undefined) or no range (NaN or lo ≥ hi)
//   dup     two controls with one label in one panel, a style twice in a select, a kind twice in the add list; and, where a finished animal's
//           core is changed (every species onto every other core of its clade), a part the new core is itself, or a style that cannot stand on it
//   foreign offered to a clade the registry does not declare it for; undeclared: no clade declared at all (to v11.69 stylesFor let those through to every clade of the kind)
// and, as information only: a style declared for a clade none of whose species wears it (the Ask-first list), a part with no controls.
// Then the registry read directly (labels, bands, defaults, the styles' clades, cores and params, the roster against it). Fails on any FAIL, blank,
// dup, foreign or undeclared, and on any fault in the registry. The lab is not tier-dependent: one run. Real geometry (test/geo.js), the same bundle and stub as the smoke test.
//   node test/registry.js          the summary and every line that is not clean
//   ALL=1 node test/registry.js    every line
//   SRC=path node test/registry.js another tree's src
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const SRC=process.env.SRC||path.join(ROOT,'src'); // SRC=path: another tree's src (the v11.69 table in the CHANGELOG was made so: git archive 656a37b src)
const ORDER=fs.readFileSync(path.join(SRC,'order.txt'),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&s[0]!=='#');
let js=ORDER.map(n=>fs.readFileSync(path.join(SRC,n+'.js'),'utf8')).join('\n');
js+='\nglobal.__reg={lab,labCap,labLoad,labBuild,labStyles,LAB_NAME:typeof LAB_NAME!=="undefined"?LAB_NAME:null,LAB_NAME_BY:typeof LAB_NAME_BY!=="undefined"?LAB_NAME_BY:null,labOnInput,labOnSelect,labPanelHTML,SPEC_BLANK,GRAMMAR,PARTS,CORES,SPECS,stylesFor,seeSpec,homeOf:typeof styleClades==="function"?styleClades:null,STYLE_CLADES:typeof STYLE_CLADES!=="undefined"?STYLE_CLADES:null};';
const tmp=path.join(require('os').tmpdir(),'tethys_registry.js');
fs.writeFileSync(tmp,'(function(){"use strict";\n'+js+'\n})();');
process.env.PICK='0';
const log=console.log,warn=console.warn;console.log=()=>{};console.warn=()=>{}; // the boot's chatter
require('./stub.js');require('./geo.js')(global.THREE);require(tmp);
console.log=log;console.warn=warn;
const X=global.__reg,ALL=!!process.env.ALL,CLADES=['ringmouths','slowbloods','hingeshells','drifters'];
// who wears what: kind:style → the clades of the species that carry it
const worn={};for(const id in X.SPECS){const sp=X.SPECS[id];for(const p of sp.parts){const k=p.kind+':'+(p.style||X.PARTS[p.kind].styles[0]);(worn[k]=worn[k]||{})[sp.clade]=1;}}
// the clades a style is declared for: the registry's word (styleClades, v11.70), or to v11.69 STYLE_CLADES' entry — null where none (the fall-through)
function declared(kind,style){if(X.homeOf)return X.homeOf(kind,style);const c=X.STYLE_CLADES&&X.STYLE_CLADES[kind+':'+style];return c||null;}
// ---------- the panel, read as the person reads it ----------
function rowsOf(html){ // every control in a stretch of panel: {path,key,label,type,val,lo,hi}
  const out=[];for(const chunk of html.split('<label class="row').slice(1)){const m=/<span>([\s\S]*?)<\/span>/.exec(chunk),dp=/data-path="([^"]*)"/.exec(chunk);if(!dp)continue;
    const r={path:dp[1],key:dp[1].split('.').pop(),label:m?m[1].trim():''};
    if(/type="range"/.test(chunk)){r.type='range';r.lo=+(/ min="([^"]*)"/.exec(chunk)||[])[1];r.hi=+(/ max="([^"]*)"/.exec(chunk)||[])[1];r.val=+(/ value="([^"]*)"/.exec(chunk)||[])[1];}
    else if(/type="checkbox"/.test(chunk))r.type='check';
    else if(/<select/.test(chunk)){r.type='select';r.opts=[];const re=/<option value="([^"]*)"( selected)?/g;let o;while((o=re.exec(chunk))){r.opts.push(o[1]);if(o[2])r.val=o[1];}}
    else if(/type="number"/.test(chunk)){r.type='number';r.val=+(/ value="([^"]*)"/.exec(chunk)||[])[1];}
    else r.type='text';
    out.push(r);}
  return out;}
function section(html,id,next){const a=html.indexOf('id="lab-'+id+'"'),b=html.indexOf('id="lab-'+next+'"');return a<0?'':html.slice(a,b<0?undefined:b);}
function partBlock(html,i){const a=html.indexOf('data-part="'+i+'"');if(a<0)return '';const b=html.indexOf('<div class="part',a+10),c=html.indexOf('<label class="row"><span>add</span>',a);return html.slice(a,b>=0&&b<c?b:c);}
function addList(html){const a=html.indexOf('data-act="add"');if(a<0)return [];const s=html.slice(a,html.indexOf('</select>',a)),out=[];const re=/<option value="([^"]+)">/g;let o;while((o=re.exec(s)))out.push(o[1]);return out;}
function styleList(block,i,cur){const m=new RegExp('<select data-path="parts\\.'+i+'\\.style">([\\s\\S]*?)</select>').exec(block);if(!m)return [cur];const out=[];const re=/<option value="([^"]*)"/g;let o;while((o=re.exec(m[1])))out.push(o[1]);return out;}
// a control has a name when its parameter declares one: the registry's `label` beside its range (v11.70), or to v11.69 an entry in lab.js's LAB_NAME / LAB_NAME_BY —
// without one the panel shows the raw key (`f1`, `px`, `fk`)
function named(owner,key){if(key==='kind'||/^[0-9]+$/.test(key))return true;const def=X.PARTS[owner]||X.CORES[owner],q=def&&def.params[key];if(X.LAB_NAME)return !!(X.LAB_NAME_BY[owner+'.'+key]||X.LAB_NAME[key]);return !!(q&&q.label);}
function blanks(rows,owner){const b=[];for(const r of rows){
    if(!r.label||!named(owner,r.key))b.push(r.key+': no label');
    if(r.type==='range'){if(!isFinite(r.val))b.push(r.key+': no value');if(!isFinite(r.lo)||!isFinite(r.hi)||!(r.hi>r.lo))b.push(r.key+': no range ('+r.lo+'..'+r.hi+')');}
    else if(r.type==='number'&&!isFinite(r.val))b.push(r.key+': no value');
    else if(r.type==='select'&&(r.val===undefined||!r.opts.length))b.push(r.key+': nothing selected');}
  return b;}
function dups(rows){const seen={},d=[];for(const r of rows){if(!r.label)continue;if(seen[r.label]&&seen[r.label]!==r.key)d.push('"'+r.label+'" is '+seen[r.label]+' and '+r.key);seen[r.label]=seen[r.label]||r.key;}return d;}
function twice(list,what){const s={},d=[];for(const v of list){if(s[v])d.push(what+' '+v+' twice');s[v]=1;}return d;}
function broken(){const L=X.lab;if(!L.b)return String(X.labCap.innerHTML).replace(/<[^>]*>/g,'').slice(0,90);let bad='';
  L.b.g.traverse(o=>{if(bad||!o.isMesh||!o.geometry||!o.geometry.attributes.position)return;const a=o.geometry.attributes.position.array;for(let i=0;i<a.length;i++)if(!isFinite(a[i])){bad='NaN in the geometry';return;}});
  if(bad)return bad;
  for(const h of L.b.hit)if(![h.r].concat(h.a,h.b).every(isFinite))return 'NaN in a hit capsule';
  for(const k of ['speed','accel','turn','mass'])if(!isFinite(L.d[k]))return 'derive.'+k+' '+L.d[k];
  try{L.b.anim(1,0.6,{});L.b.anim(1.1,2,{tell:1,strike:1,jet:1,pulse:1});}catch(e){return 'anim threw: '+e.message;}
  return '';}
const sel=(act,v)=>X.labOnSelect({target:{dataset:{act:act},value:v}}),
  input=(p,v)=>X.labOnInput({target:{dataset:{path:p},value:v,tagName:'SELECT',type:'select-one'}});
// ---------- the walk ----------
const alike={},finger=()=>{let n=0,sum=0;X.lab.b.g.traverse(o=>{sum+=o.position.x*3+o.position.y*5+o.position.z*7+o.rotation.x*11+o.rotation.y*13+o.rotation.z*17+o.scale.x*19+o.scale.y*23;if(!o.isMesh||!o.geometry||!o.geometry.attributes.position)return;const a=o.geometry.attributes.position.array;n+=a.length/9;for(let i=0;i<a.length;i++)sum+=a[i]*(1+(i%7));});return n+':'+sum.toFixed(3);};
const lines=[],tot={offered:0,ok:0,fail:0,blank:0,dup:0,foreign:0,undeclared:0},unworn={},empty={};
function note(mode,clade,core,what,r){tot.offered++;const bad=r.fail||r.blank.length||r.dup.length||r.foreign;if(r.fail)tot.fail++;else tot.ok++;if(r.blank.length)tot.blank++;if(r.dup.length)tot.dup++;if(r.foreign)tot[/^foreign/.test(r.foreign)?'foreign':'undeclared']++;
  if(bad||ALL)lines.push([mode,clade.slice(0,5),core,what,r.fail?'FAIL '+r.fail:'ok',r.n+' rows',r.blank.length?'blank: '+r.blank.join('; '):'',r.dup.length?'dup: '+r.dup.join('; '):'',r.foreign||''].filter(s=>s!=='').join(' | '));}
for(const mode of ['dev','creator']){
  X.lab.player=mode==='creator';if(X.lab.player)for(const id in X.SPECS)X.seeSpec(id);
  for(const clade of CLADES)for(const core of X.GRAMMAR[clade].cores){
    const fresh=()=>{X.labLoad(X.SPEC_BLANK[clade]);if(X.lab.spec.core.kind!==core)input('core.kind',core);};
    try{fresh();}catch(e){note(mode,clade,core,'(core)',{fail:'threw: '+e.message,blank:[],dup:[],n:0});continue;}
    let html=X.labPanelHTML();
    const crows=rowsOf(section(html,'core','parts')),kindsSel=crows.find(r=>r.key==='kind');
    note(mode,clade,core,'(core)',{fail:broken(),blank:blanks(crows,core),dup:dups(crows).concat(kindsSel?twice(kindsSel.opts,'core'):[]),n:crows.length});
    const add=addList(html),n0=X.lab.spec.parts.length;
    for(const d of twice(add,'kind'))note(mode,clade,core,'(add list)',{fail:'',blank:[],dup:[d],n:add.length});
    for(const kind of add){
      if(X.PARTS[kind].clades.indexOf(clade)<0){note(mode,clade,core,kind,{fail:'',blank:[],dup:[],foreign:'foreign: the kind is not a '+clade+' part',n:0});continue;}
      let styles; // the add as the person does it, for the style select it shows; where the add itself throws (the panel is wedged from there), the lab's own list
      try{fresh();sel('add',kind);const i=X.lab.v.parts.length-1;html=X.labPanelHTML();styles=styleList(partBlock(html,i),i,X.lab.v.parts[i].style);}catch(e){styles=X.labStyles(kind,clade);}
      for(const d of twice(styles,'style'))note(mode,clade,core,kind,{fail:'',blank:[],dup:[d],n:styles.length});
      for(const st of styles){
        let fail='';
        try{fresh();X.lab.spec.parts.push({kind:kind,style:st});X.labBuild();}catch(e){fail='threw: '+e.message.slice(0,80);} // what the add and the style select leave in the spec
        let rows=[];
        if(!fail){const j=X.lab.v.parts.length-1;if(X.lab.v.parts[j].kind!==kind||X.lab.v.parts[j].style!==st)fail='the lab built '+X.lab.v.parts[j].kind+':'+X.lab.v.parts[j].style+' instead';else{fail=broken();rows=rowsOf(partBlock(X.labPanelHTML(),j)).filter(r=>r.key!=='style');}}
        const dec=declared(kind,st),key=kind+':'+st,w=worn[key]||{};
        let foreign='';
        if(!dec){if(!w[clade]&&Object.keys(w).length)foreign='foreign: worn only by '+Object.keys(w).join(', ')+', declared for no clade, so offered to every clade of the kind';else foreign='undeclared: no clade listed for it (offered by the fall-through)';}
        else if(dec.indexOf(clade)<0)foreign='foreign: declared for '+dec.join(', ');
        else if(!w[clade])(unworn[key]=unworn[key]||{})[clade]=1;
        if(!rows.length&&!fail)empty[key]=1;
        if(!fail&&mode==='dev'){const a=alike[clade+' '+core+' '+kind]=alike[clade+' '+core+' '+kind]||{},fp=finger();(a[fp]=a[fp]||[]).push(st);}
        note(mode,clade,core,key,{fail:fail,blank:blanks(rows,kind),dup:dups(rows),foreign:foreign,n:rows.length});
      }
    }
  }
}
X.lab.player=false;
// ---------- the registry itself, read without the lab ----------
// every style declares its clades (and any cores, which must be bodies of those clades) and lists only params the part has, once; every param
// has a label, and a ranged one a believable band inside its extreme band with a constant default inside that; GRAMMAR's cores and CORES' clades
// agree; every species of the roster wears only what the registry gives its clade and its core
const R=[];
for(const c in X.GRAMMAR)for(const k of X.GRAMMAR[c].cores)if(!X.CORES[k]||X.CORES[k].clade!==c)R.push('GRAMMAR gives '+c+' the core '+k+', CORES says '+(X.CORES[k]?X.CORES[k].clade:'nothing'));
for(const k in X.CORES)if(X.GRAMMAR[X.CORES[k].clade].cores.indexOf(k)<0)R.push('the core '+k+' is in no grammar');
const checkParams=(owner,params)=>{for(const key in params){const q=params[key];if(!q.label)R.push(owner+'.'+key+': no label');
  if(q.k!=='b'&&q.k!=='s'&&q.k!=='l'){if(!q.b||!q.x)R.push(owner+'.'+key+': no range');else if(typeof q.b!=='function'&&typeof q.x!=='function'){if(!(q.x[0]<=q.b[0]&&q.b[1]<=q.x[1]&&q.b[0]<q.b[1]))R.push(owner+'.'+key+': the believable band '+q.b+' is not inside the extreme band '+q.x);
    if(typeof q.d==='number'&&q.k!=='len'&&q.k!=='z'&&(q.d<q.x[0]||q.d>q.x[1]))R.push(owner+'.'+key+': the default '+q.d+' is outside '+q.x);}}
  if(q.k==='s'&&(!q.opts||(typeof q.d!=='function'&&q.opts.indexOf(q.d)<0)))R.push(owner+'.'+key+': the default is not one of its options');
  if(q.by)for(const st in q.by)if(!X.PARTS[owner]||!X.PARTS[owner].reg[st])R.push(owner+'.'+key+': a label for a style the part has not ('+st+')');}};
for(const k in X.CORES)checkParams(k,X.CORES[k].params);
for(const k in X.PARTS){const d=X.PARTS[k];checkParams(k,d.params);if(!d.reg||!Object.keys(d.reg).length){R.push(k+': no styles');continue;}
  for(const st in d.reg){const r=d.reg[st];if(!r.clades||!r.clades.length)R.push(k+':'+st+': no clade');else for(const c of r.clades)if(!X.GRAMMAR[c])R.push(k+':'+st+': '+c+' is no clade');
    for(const c of r.cores||[])if(!X.CORES[c]||r.clades.indexOf(X.CORES[c].clade)<0)R.push(k+':'+st+': the core '+c+' is not a body of its clades');
    for(const p of r.params||[])if(!d.params[p])R.push(k+':'+st+': reads '+p+', which the part has not');R.push.apply(R,twice(r.params||[],k+':'+st+' lists'));}}
for(const id in X.SPECS){const sp=X.SPECS[id];for(const p of sp.parts){const d=X.PARTS[p.kind],st=p.style||(d&&d.styles[0]);if(!d){R.push(id+': no part '+p.kind);continue;}
  if(X.stylesFor(p.kind,sp.clade,sp.core.kind).indexOf(st)<0&&!((X.CORES[sp.core.kind].provides||[]).indexOf(p.kind)>=0))R.push(id+' wears '+p.kind+':'+st+', which the registry does not give a '+sp.clade.replace(/s$/,'')+' on a '+sp.core.kind);}}
// ---------- every species' own panel: the controls of what the roster actually wears ----------
for(const id in X.SPECS){X.labLoad(X.SPECS[id]);const html=X.labPanelHTML(),sp=X.lab.v;
  const crows=rowsOf(section(html,'core','parts'));let bl=blanks(crows,sp.core.kind).map(s=>'core.'+s),du=dups(crows).map(s=>'core: '+s);
  sp.parts.forEach((p,i)=>{const rows=rowsOf(partBlock(html,i)).filter(r=>r.key!=='style');bl=bl.concat(blanks(rows,p.kind).map(s=>p.kind+'.'+s));du=du.concat(dups(rows).map(s=>p.kind+': '+s));});
  note('roster',sp.clade,sp.core.kind,id,{fail:broken(),blank:bl,dup:du,n:0});}
// ---------- the core changed under a finished animal: every species onto every other core of its clade ----------
// what the last core's parts leave behind: a part the new core provides itself (a tail on a chain body: two tails), a style that cannot stand on it
for(const id in X.SPECS){const sp0=X.SPECS[id];for(const core of X.GRAMMAR[sp0.clade].cores){if(core===sp0.core.kind)continue;let fail='',bl=[],du=[];
  try{X.labLoad(sp0);input('core.kind',core);}catch(e){fail='threw: '+e.message.slice(0,80);}
  if(!fail){fail=broken();const html=X.labPanelHTML(),sp=X.lab.v;bl=blanks(rowsOf(section(html,'core','parts')),core).map(s=>'core.'+s);
    sp.parts.forEach((p,i)=>{bl=bl.concat(blanks(rowsOf(partBlock(html,i)).filter(r=>r.key!=='style'),p.kind).map(s=>p.kind+'.'+s));
      if((X.CORES[core].provides||[]).indexOf(p.kind)>=0)du.push('a '+p.kind+' part on a core that is its own '+p.kind);
      else if(X.stylesFor(p.kind,sp.clade,core).indexOf(p.style)<0)du.push(p.kind+':'+p.style+' left on a core it cannot stand on');});}
  note('switch',sp0.clade,sp0.core.kind+'→'+core,id,{fail:fail,blank:bl,dup:du,n:0});}}
// ---------- the table ----------
console.log('registry: '+tot.offered+' offered (clade × core × kind × style in two modes, the '+Object.keys(X.SPECS).length+' panels of the roster, each species onto every other core of its clade): '+tot.ok+' compile, '+tot.fail+' do not, '+tot.blank+' with a blank control, '+tot.dup+' with a duplicate, '+tot.foreign+' foreign, '+tot.undeclared+' undeclared');
for(const l of lines)console.log('  '+l);
const uw=Object.keys(unworn).map(k=>k+' ('+Object.keys(unworn[k]).join(', ')+')');
if(uw.length)console.log('  declared for a clade none of whose species wears it (information; the Ask-first list): '+uw.join('; '));
if(Object.keys(empty).length)console.log('  parts with no controls (information): '+Object.keys(empty).join(', '));
const la=[];for(const k in alike)for(const fp in alike[k])if(alike[k][fp].length>1)la.push(k+': '+alike[k][fp].join(' = '));
if(la.length)console.log('  styles that build the same body at their defaults (information; a duplicate that might be two things): '+la.join('; '));
console.log('registry, read directly: '+(R.length?R.length+' faults':'sound'));for(const r of R)console.log('  '+r);
const bad=tot.fail+tot.blank+tot.dup+tot.foreign+tot.undeclared+R.length;
console.log(bad?'FAILED':'OK');
process.exit(bad?1:0);
