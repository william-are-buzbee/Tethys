// Static name check for the bundle. The game is one shared scope (src/ concatenated into an IIFE), so a name used in
// one file and defined in another is only checked when that line runs. The smoke test covers the main paths; this
// covers the rest: it parses the bundle, tracks scopes, and reports
//   - every identifier that is not declared anywhere it can see (a typo, a rename missed in another file) -> exit 1
//   - top-level names no other line references (dead code, or a hook kept on purpose) -> informational
// Needs acorn. Not vendored: looked for on the usual paths; if it isn't there the check is skipped with a note.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const ORDER=fs.readFileSync(path.join(ROOT,'src','order.txt'),'utf8').split('\n').map(s=>s.trim()).filter(s=>s&&s[0]!=='#');

let acorn=null;
const prefixes=['/home/claude/.npm-global',path.join(process.env.HOME||'','.npm-global'),'/usr/local','/usr'];
const candidates=[path.join(__dirname,'acorn.js'),'acorn']; // vendored first (v11.12: test/acorn.js, MIT, acorn 8.18.0), then wherever npm put one
for(const pre of prefixes)for(const sub of ['acorn','@mermaid-js/mermaid-cli/node_modules/acorn','ts-node/node_modules/acorn'])candidates.push(path.join(pre,'lib/node_modules',sub));
for(const p of candidates){try{acorn=require(p);break;}catch(e){}}
if(!acorn){console.log('lint: acorn not found, skipped (npm i -g acorn to enable)');process.exit(0);}

// the bundle with a line->file map
const files=[],starts=[];let js='',line=1;
for(const n of ORDER){const src=fs.readFileSync(path.join(ROOT,'src',n+'.js'),'utf8');files.push(n);starts.push(line);js+=src+'\n';line+=src.split('\n').length;}
function where(loc){let f=0;for(let i=0;i<starts.length;i++)if(starts[i]<=loc.line)f=i;return files[f]+'.js:'+(loc.line-starts[f]+1);}

let ast;
try{ast=acorn.parse(js,{ecmaVersion:2022,sourceType:'script',locations:true});}
catch(e){console.error('lint: parse error '+e.message);process.exit(1);}

// what the browser (and the test stub) provide
const GLOBALS=new Set(('THREE window document navigator location screen innerWidth innerHeight devicePixelRatio performance '+
  'requestAnimationFrame setTimeout clearTimeout setInterval clearInterval addEventListener removeEventListener console '+
  'Math Object Array Number String Boolean JSON Date Error RegExp Symbol Promise Set Map WeakMap Function '+
  'Float32Array Float64Array Uint8Array Uint16Array Uint32Array Int8Array Int16Array Int32Array ArrayBuffer '+
  'isFinite isNaN parseInt parseFloat undefined NaN Infinity AudioContext webkitAudioContext arguments '+
  'atob btoa escape unescape encodeURIComponent decodeURIComponent history prompt').split(' '));

// ---- scopes ----
// A scope is {names:Set, parent}. Function-like nodes and blocks get one; declarations are hoisted into the right one
// in a first pass, references resolved in a second.
const scopeOf=new Map();
function isFn(n){return n.type==='FunctionDeclaration'||n.type==='FunctionExpression'||n.type==='ArrowFunctionExpression';}
function makesBlock(n){return n.type==='BlockStatement'||n.type==='ForStatement'||n.type==='ForInStatement'||n.type==='ForOfStatement'||n.type==='CatchClause'||n.type==='SwitchStatement';}
function patternNames(p,out){
  if(!p)return out;
  switch(p.type){
    case 'Identifier':out.push(p.name);break;
    case 'ObjectPattern':for(const pr of p.properties)patternNames(pr.type==='RestElement'?pr.argument:pr.value,out);break;
    case 'ArrayPattern':for(const e of p.elements)patternNames(e,out);break;
    case 'RestElement':patternNames(p.argument,out);break;
    case 'AssignmentPattern':patternNames(p.left,out);break;
  }
  return out;
}
function children(n){const out=[];for(const k in n){if(k==='type'||k==='loc'||k==='start'||k==='end')continue;const v=n[k];if(Array.isArray(v)){for(const c of v)if(c&&typeof c.type==='string')out.push(c);}else if(v&&typeof v.type==='string')out.push(v);}return out;}

// pass 1: declare
function declare(n,fnScope,blockScope){
  if(isFn(n)){
    const s={names:new Set(),parent:blockScope};scopeOf.set(n,s);
    if(n.type==='FunctionExpression'&&n.id)s.names.add(n.id.name);
    for(const p of n.params)for(const nm of patternNames(p,[]))s.names.add(nm);
    if(n.type==='FunctionDeclaration')fnScope.names.add(n.id.name);
    for(const c of children(n))if(c!==n.id)declare(c,s,s);
    return;
  }
  if(makesBlock(n)){
    const s={names:new Set(),parent:blockScope};scopeOf.set(n,s);
    if(n.type==='CatchClause'&&n.param)for(const nm of patternNames(n.param,[]))s.names.add(nm);
    for(const c of children(n))declare(c,fnScope,s);
    return;
  }
  if(n.type==='VariableDeclaration'){
    const target=n.kind==='var'?fnScope:blockScope;
    for(const d of n.declarations)for(const nm of patternNames(d.id,[]))target.names.add(nm);
  }
  if(n.type==='ClassDeclaration'&&n.id)blockScope.names.add(n.id.name);
  for(const c of children(n))declare(c,fnScope,blockScope);
}
const top={names:new Set(),parent:null};scopeOf.set(ast,top);
for(const c of children(ast))declare(c,top,top);

// pass 2: resolve
const undeclared=[],used=new Map(); // name -> count of references (top-level names only)
function lookup(name,s){for(;s;s=s.parent)if(s.names.has(name))return s;return null;}
function resolve(n,scope,parent,key){
  if(n.type==='Identifier'){
    if(parent){
      if(parent.type==='MemberExpression'&&key==='property'&&!parent.computed)return;
      if((parent.type==='Property'||parent.type==='MethodDefinition'||parent.type==='PropertyDefinition')&&key==='key'&&!parent.computed)return;
      if(parent.type==='LabeledStatement'||parent.type==='BreakStatement'||parent.type==='ContinueStatement')return;
      if((parent.type==='FunctionDeclaration'||parent.type==='FunctionExpression'||parent.type==='ClassDeclaration')&&key==='id')return;
      if(parent.type==='VariableDeclarator'&&key==='id')return;
    }
    const s=lookup(n.name,scope);
    if(s===top)used.set(n.name,(used.get(n.name)||0)+1);
    else if(!s&&!GLOBALS.has(n.name))undeclared.push(n.name+'  '+where(n.loc.start));
    return;
  }
  if(n.type==='ThisExpression'||n.type==='Super')return;
  const s=scopeOf.get(n)||scope;
  // declaration patterns are not references, but their defaults / computed keys are
  if(n.type==='VariableDeclarator'){resolveDefaults(n.id,s);if(n.init)resolve(n.init,s,n,'init');return;}
  if(isFn(n)){for(const p of n.params)resolveDefaults(p,s);resolve(n.body,s,n,'body');return;}
  if(n.type==='CatchClause'){if(n.param)resolveDefaults(n.param,s);resolve(n.body,s,n,'body');return;}
  for(const k in n){if(k==='type'||k==='loc'||k==='start'||k==='end')continue;const v=n[k];
    if(Array.isArray(v)){for(const c of v)if(c&&typeof c.type==='string')resolve(c,s,n,k);}
    else if(v&&typeof v.type==='string')resolve(v,s,n,k);}
}
function resolveDefaults(p,s){ // walk a binding pattern, resolving only the expressions inside it
  if(!p)return;
  switch(p.type){
    case 'AssignmentPattern':resolveDefaults(p.left,s);resolve(p.right,s,p,'right');break;
    case 'ObjectPattern':for(const pr of p.properties){if(pr.type==='RestElement')resolveDefaults(pr.argument,s);else{if(pr.computed)resolve(pr.key,s,pr,'key');resolveDefaults(pr.value,s);}}break;
    case 'ArrayPattern':for(const e of p.elements)resolveDefaults(e,s);break;
    case 'RestElement':resolveDefaults(p.argument,s);break;
  }
}
for(const c of children(ast))resolve(c,top,ast,'body');

// ---- report ----
const unused=[...top.names].filter(n=>!used.has(n)).sort();
if(unused.length)console.log('lint: top-level names nothing references: '+unused.join(' '));
if(undeclared.length){console.error('lint: UNDECLARED\n  '+undeclared.join('\n  '));process.exit(1);}
console.log('lint: ok ('+top.names.size+' top-level names, '+files.length+' files)');
