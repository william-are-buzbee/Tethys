#!/usr/bin/env node
// serve.js — a static server for looking at the game from Claude Code (file:// is blocked in the app's browser).
//   node serve.js            http://localhost:8080/dev.html   (edit src/*.js and refresh; no build needed)
//                            http://localhost:8080/tethys.html (the built game; run build.js first)
//   PORT=9000 node serve.js
// No dependencies, no caching, serves this folder only. Not part of the game.
'use strict';
const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=__dirname,PORT=+(process.env.PORT||8080);
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.png':'image/png','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.css':'text/css'};
http.createServer((req,res)=>{
  const url=decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  const file=path.normalize(path.join(ROOT,url==='/'?'/dev.html':url));
  if(!file.startsWith(ROOT)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404,{'Content-Type':'text/plain'});res.end('not found: '+url);return;}
    res.writeHead(200,{'Content-Type':MIME[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(data);
  });
}).listen(PORT,'127.0.0.1',()=>console.log('tethys at http://localhost:'+PORT+'/dev.html (ctrl-c to stop)'));
