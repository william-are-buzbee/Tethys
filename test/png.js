// test/png.js — a minimal 24-bit PNG writer and a 5×7 bitmap font, for anything under test/ that wants to draw a picture
// (test/spectro.js). The writer is the same four lines test/preview.js has had inline since v11.10, kept here so the next tool
// does not write them a third time; preview.js still has its own copy and is left alone.
'use strict';
const zlib=require('zlib');
function crc32(buf){let c,crc=0xffffffff;for(let n=0;n<buf.length;n++){c=(crc^buf[n])&0xff;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;crc=(crc>>>8)^c;}return (crc^0xffffffff)>>>0;}
function chunk(type,data){const len=Buffer.alloc(4);len.writeUInt32BE(data.length);const td=Buffer.concat([Buffer.from(type),data]);const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(td));return Buffer.concat([len,td,crc]);}
// img: W*H*3 bytes, rgb, row major
function png(img,W,H){
  const raw=Buffer.alloc((W*3+1)*H);
  for(let y=0;y<H;y++){raw[y*(W*3+1)]=0;for(let x=0;x<W*3;x++)raw[y*(W*3+1)+1+x]=img[y*W*3+x];}
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
// ---------- the font ----------
// 5 wide, 7 tall, authored as rows so a wrong pixel is visible in the source. Everything is folded to upper case before drawing.
const FONT={};
(function(){const F=
 '0 01110/10001/10011/10101/11001/10001/01110|1 00100/01100/00100/00100/00100/00100/01110|'+
 '2 01110/10001/00001/00010/00100/01000/11111|3 11111/00010/00100/00010/00001/10001/01110|'+
 '4 00010/00110/01010/10010/11111/00010/00010|5 11111/10000/11110/00001/00001/10001/01110|'+
 '6 00110/01000/10000/11110/10001/10001/01110|7 11111/00001/00010/00100/01000/01000/01000|'+
 '8 01110/10001/10001/01110/10001/10001/01110|9 01110/10001/10001/01111/00001/00010/01100|'+
 'A 01110/10001/10001/11111/10001/10001/10001|B 11110/10001/10001/11110/10001/10001/11110|'+
 'C 01110/10001/10000/10000/10000/10001/01110|D 11110/10001/10001/10001/10001/10001/11110|'+
 'E 11111/10000/10000/11110/10000/10000/11111|F 11111/10000/10000/11110/10000/10000/10000|'+
 'G 01110/10001/10000/10111/10001/10001/01111|H 10001/10001/10001/11111/10001/10001/10001|'+
 'I 01110/00100/00100/00100/00100/00100/01110|J 00111/00010/00010/00010/00010/10010/01100|'+
 'K 10001/10010/10100/11000/10100/10010/10001|L 10000/10000/10000/10000/10000/10000/11111|'+
 'M 10001/11011/10101/10101/10001/10001/10001|N 10001/11001/10101/10011/10001/10001/10001|'+
 'O 01110/10001/10001/10001/10001/10001/01110|P 11110/10001/10001/11110/10000/10000/10000|'+
 'Q 01110/10001/10001/10001/10101/10010/01101|R 11110/10001/10001/11110/10100/10010/10001|'+
 'S 01111/10000/10000/01110/00001/00001/11110|T 11111/00100/00100/00100/00100/00100/00100|'+
 'U 10001/10001/10001/10001/10001/10001/01110|V 10001/10001/10001/10001/10001/01010/00100|'+
 'W 10001/10001/10001/10101/10101/11011/10001|X 10001/01010/00100/00100/00100/01010/10001|'+
 'Y 10001/10001/01010/00100/00100/00100/00100|Z 11111/00001/00010/00100/01000/10000/11111|'+
 '. 00000/00000/00000/00000/00000/01100/01100|- 00000/00000/00000/11111/00000/00000/00000|'+
 '_ 00000/00000/00000/00000/00000/00000/11111|/ 00001/00010/00010/00100/01000/01000/10000|'+
 '+ 00000/00100/00100/11111/00100/00100/00000|% 11001/11010/00010/00100/01000/01011/10011|'+
 ': 00000/01100/01100/00000/01100/01100/00000|( 00010/00100/01000/01000/01000/00100/00010|'+
 ') 01000/00100/00010/00010/00010/00100/01000|, 00000/00000/00000/00000/01100/01100/01000';
 for(const g of F.split('|')){FONT[g[0]]=g.slice(2).split('/');}
 FONT[' ']=['00000','00000','00000','00000','00000','00000','00000'];})();
// Draw text into an rgb buffer. sc scales the glyph; the colour is [r,g,b]. Anything the font has no glyph for is a space.
function text(img,W,H,x0,y0,str,col,sc){
  sc=sc||1;let x=Math.round(x0);y0=Math.round(y0); // a fractional y silently writes between rows and nothing shows
  for(const ch of String(str).toUpperCase()){
    const g=FONT[ch]||FONT[' '];
    for(let r=0;r<7;r++)for(let c=0;c<5;c++){
      if(g[r][c]!=='1')continue;
      for(let dy=0;dy<sc;dy++)for(let dx=0;dx<sc;dx++){
        const px=x+c*sc+dx,py=y0+r*sc+dy;if(px<0||py<0||px>=W||py>=H)continue;
        const o=(py*W+px)*3;img[o]=col[0];img[o+1]=col[1];img[o+2]=col[2];}}
    x+=6*sc;}
  return x;}
function textW(str,sc){return String(str).length*6*(sc||1);}
module.exports={png:png,crc32:crc32,chunk:chunk,text:text,textW:textW};
