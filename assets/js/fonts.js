/* ============ संस्कृति Fonts — एक ही जगह config, सब pages इस्तेमाल करें ============
   नया font जोड़ना हो तो सिर्फ़ FONTS में एक line जोड़ो — बाकी सब अपने-आप।
   सारे fonts: Google Fonts (OFL license — commercial use 100% legal ✓) या हमारा खुद का SanskritiScript। */
(function(){
'use strict';
const FONTS=[
  {v:'',       l:'साधारण अक्षर',              w:'600', fam:"Georgia,'Nirmala UI',serif"},
  {v:'script', l:'💫 संस्कृति Script',         w:'400', fam:"SanskritiScript,'Nirmala UI',cursive"},
  {v:'royal',  l:'👑 Royal Caps',             w:'400', fam:"Georgia,'Times New Roman',serif", ls:0.20},
  {v:'gvibes', l:'💍 Great Vibes (नामों के लिए)', w:'400', fam:"'Great Vibes',cursive"},
  {v:'pinyon', l:'👑 Pinyon Script (शाही)',    w:'400', fam:"'Pinyon Script',cursive"},
  {v:'alex',   l:'🌹 Alex Brush',             w:'400', fam:"'Alex Brush',cursive"},
  {v:'dance',  l:'✨ Dancing Script',         w:'500', fam:"'Dancing Script',cursive"},
  {v:'playfair',l:'🏛️ Playfair (Royal)',       w:'600', fam:"'Playfair Display',serif"},
  {v:'cinzel', l:'⚜️ Cinzel (शाही CAPS)',      w:'600', fam:"Cinzel,serif"},
  {v:'cormor', l:'📜 Cormorant (Classic)',    w:'500', fam:"'Cormorant Garamond',serif"},
  {v:'rozha',  l:'🌺 Rozha One (हिंदी शाही)',  w:'400', fam:"'Rozha One','Nirmala UI',serif"},
  {v:'yatra',  l:'🎨 Yatra One (हिंदी सजावटी)', w:'400', fam:"'Yatra One','Nirmala UI',system-ui"},
  {v:'tiro',   l:'📖 Tiro (हिंदी सुंदर)',      w:'400', fam:"'Tiro Devanagari Hindi','Nirmala UI',serif"},
  {v:'kalam',  l:'✍️ Kalam (हिंदी लिखावट)',   w:'400', fam:"Kalam,'Nirmala UI',cursive"},
];
const GF_URL='https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cinzel:wght@600&family=Cormorant+Garamond:ital,wght@0,500;1,500&family=Dancing+Script:wght@500&family=Great+Vibes&family=Kalam:wght@400;700&family=Pinyon+Script&family=Playfair+Display:wght@500;700&family=Rozha+One&family=Tiro+Devanagari+Hindi&family=Yatra+One&display=swap';
function fontByV(v){ return FONTS.find(f=>f.v===(v||''))||FONTS[0]; }
/* canvas ctx.font string */
function fontFam(it,sc){ const f=fontByV(it.f); return f.w+' '+(it.size*sc)+'px '+f.fam; }
/* letter-spacing (0 = कोई नहीं) */
function fontLS(it,sc){ const f=fontByV(it.f); return f.ls?it.size*sc*f.ls:0; }
/* items में जो fonts लगे हैं उन्हें load करो — फिर cb (async; canvas redraw के लिए) */
function ensureFonts(items){
  const fams=new Set();
  (items||[]).forEach(it=>{ if(it&&it.kind==='text') fams.add(fontByV(it.f).fam.split(',')[0].replace(/'/g,'').trim()); });
  if(typeof document==='undefined'||!document.fonts||!fams.size) return Promise.resolve();
  return Promise.all([...fams].map(n=>document.fonts.load('24px "'+n+'"').catch(()=>{}))).then(()=>{}).catch(()=>{});
}
/* page में ज़रूरी font files जोड़ो (Google Fonts + हमारा Script font) */
function injectFontLinks(base){
  if(typeof document==='undefined') return;
  const b=base||'';
  if(!document.querySelector('link[data-sk-gf]')){ const l=document.createElement('link'); l.rel='stylesheet'; l.href=GF_URL; l.setAttribute('data-sk-gf','1'); document.head.appendChild(l); }
  if(!document.querySelector('link[data-sk-sc]')){ const l=document.createElement('link'); l.rel='stylesheet'; l.href=b+'assets/fonts/sanskriti-script.css'; l.setAttribute('data-sk-sc','1'); document.head.appendChild(l); }
}
window.SkFonts={FONTS:FONTS,fontFam:fontFam,fontLS:fontLS,ensureFonts:ensureFonts,injectFontLinks:injectFontLinks};
injectFontLinks('');
})();
