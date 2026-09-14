#!/usr/bin/env node
// serve.js — a static server for looking at the game from Claude Code (file:// is blocked in the app's browser).
//   node serve.js            http://localhost:8080/dev.html   (edit src/*.js and refresh; no build needed)
//                            http://localhost:8080/tethys.html (the built game; run build.js first)
//   PORT=9000 node serve.js
// It also takes POST /_bench/<name> from the sound bench (src/bench.js, #bench) and writes it to test/render/<name> (a png too, v11.40: the canvas posted as a screenshot from the app's browser),
// which is how a rendered sound gets off the page and under test/spectro.js. No dependencies, no caching, serves this folder only. Not part of the game.
'use strict';
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=__dirname,PORT=+(process.env.PORT||8080);
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.css':'text/css'};
const SINK=path.join(ROOT,'test','render'); // the sound bench (src/bench.js) posts its wavs here for test/spectro.js to read
http.createServer((req,res)=>{
  let url;try{url=decodeURIComponent(req.url.split('?')[0].split('#')[0]);}catch(e){res.writeHead(400);res.end('bad url');return;} // a stray % threw here and took the server down with it
  if(req.method==='POST'&&url.indexOf('/_bench/')===0){ // POST /_bench/<name> → test/render/<name>. The name is a plain file name and nothing else; no directories, no traversal
    const name=url.slice(8);
    if(!/^[A-Za-z0-9_.-]{1,80}$/.test(name)||name.indexOf('..')>=0||!/\.(wav|json|txt|png)$/.test(name)){res.writeHead(400);res.end('bad name');return;}
    const parts=[];let n=0;
    req.on('data',c=>{n+=c.length;if(n>64e6){req.destroy();return;}parts.push(c);}); // a 30 s stereo wav is 5 MB; 64 is a fuse, not a target
    req.on('end',()=>{try{fs.mkdirSync(SINK,{recursive:true});fs.writeFileSync(path.join(SINK,name),Buffer.concat(parts));console.log('bench  '+name+'  '+(n/1024).toFixed(0)+' kB');res.writeHead(200,{'Content-Type':'text/plain','Access-Control-Allow-Origin':'*'});res.end('ok');}catch(e){res.writeHead(500);res.end(String(e.message));}});
    return;}
  if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,GET','Access-Control-Allow-Headers':'Content-Type'});res.end();return;}
  const file=path.normalize(path.join(ROOT,url==='/'?'/dev.html':url));
  if(!file.startsWith(ROOT)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404,{'Content-Type':'text/plain'});res.end('not found: '+url);return;}
    res.writeHead(200,{'Content-Type':MIME[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(data);
  });
}).listen(PORT,'127.0.0.1',()=>console.log('tethys at http://localhost:'+PORT+'/dev.html (ctrl-c to stop)'));
