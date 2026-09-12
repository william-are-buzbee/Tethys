// effects.js — the effects list (v11.23, the person's ask): the purely cosmetic systems, each switchable live, on the menu (the word
// at the bottom right, or e) and in play (e; the pointer is released while the list is open and taken back when it closes). Nothing
// here changes the world, the weather or the physics — a shower still falls with its streaks off, the sun still sets with its shadows
// off — only what is drawn. The choices persist in localStorage ('tethys.fx'); FX_DEF is what a fresh browser gets. FX is read where
// each system is drawn: the caustics and the shadows through applyFog → LIGHT_K (atmosphere.js) and updateShadow (scene.js), the
// shafts, the snow, the rain, the shimmer and the cumulus in atmosphere.js, the vignette here (the #vig layer in the shell).
// A switch is one line to add: a key in FX_DEF, a row in FX_LIST, and the system reading FX.key where it draws.
const FX_LIST=[['caustics','caustics'],['shadows','shadows'],['statics','world shadows'],['ground','ground shadows'],['sharp','sharp shadows'],['shafts','light shafts'],['snow','marine snow'],['rain','rain'],['clouds','clouds'],['shimmer','surface glow'],['blood','blood'],['vignette','vignette']];
const FX_DEF={caustics:true,shadows:Q.tier!=='low',statics:false,ground:false,sharp:false,shafts:true,snow:true,rain:true,clouds:true,shimmer:true,blood:true,vignette:true}; // shadows: off on the low tier (a phone) until measured there; statics, ground (v11.30): the world's own shadows — the flora, rock and structures, and the terrain — off until measured (scene.js updateShadowS); sharp: both shadow maps at twice the size (scene.js shadowSize)
const FX=Object.assign({},FX_DEF);
(function(){try{const s=window.localStorage&&window.localStorage.getItem('tethys.fx');if(s){const o=JSON.parse(s);for(const k in FX_DEF)if(typeof o[k]==='boolean')FX[k]=o[k];}}catch(e){}})();
function fxSave(){try{if(window.localStorage)window.localStorage.setItem('tethys.fx',JSON.stringify(FX));}catch(e){}}
const fxEl=document.getElementById('fx'),fxListEl=document.getElementById('fxlist'),fxLinkEl=document.getElementById('fxlink'),vigEl=document.getElementById('vig');
let fxOpen=false,fxLinkOn=true;
function fxApply(){vigEl.style.display=FX.vignette?'':'none';if(typeof wasAbove==='boolean')applyFog(wasAbove);shadowDirty();} // a switch changes the world map's caster set // the fog's light block reads FX (LIGHT_K); before the first frame applyFog runs on its own
function fxRender(){fxListEl.innerHTML=FX_LIST.map(e=>'<div class="row'+(FX[e[0]]?'':' off')+'" data-k="'+e[0]+'"><span>'+e[1]+'</span><b>'+(FX[e[0]]?'on':'off')+'</b></div>').join('');}
function fxToggle(k){if(!(k in FX_DEF))return;FX[k]=!FX[k];fxSave();fxApply();fxRender();}
function fxShow(on){if(on===fxOpen)return;fxOpen=on;fxEl.classList.toggle('on',on);if(on){fxRender();if(mode==='play'&&locked)unlock();}else if(mode==='play'&&!isTouch)tryLock();}
function updateFX(){const on=mode==='menu';if(on!==fxLinkOn){fxLinkOn=on;fxLinkEl.style.opacity=on?'':'0';}if(fxOpen&&!on&&mode!=='play')fxShow(false);} // the menu's word only on the menu; the list closes on the way into the bestiary or the lab
fxListEl.addEventListener('click',e=>{let el=e.target;while(el&&el!==fxListEl&&!(el.dataset&&el.dataset.k))el=el.parentNode;if(el&&el!==fxListEl&&el.dataset&&el.dataset.k)fxToggle(el.dataset.k);});
fxLinkEl.addEventListener('click',()=>{if(mode==='menu')fxShow(!fxOpen);});
addEventListener('keydown',e=>{if(e.code==='KeyE'&&(mode==='menu'||mode==='play'))fxShow(!fxOpen);else if(e.code==='Escape'&&fxOpen)fxShow(false);});
document.addEventListener('pointerlockchange',()=>{if(fxOpen&&document.pointerLockElement===canvas)fxShow(false);}); // a click on the canvas took the pointer back: the list is done with
fxApply();
