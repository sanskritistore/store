const CFG={};
async function loadCfg(){
 const [site,cats,prods,frames]=await Promise.all(
  ['site','categories','products','frames'].map(n=>fetch('config/'+n+'.json?v=2').then(r=>r.json())));
 CFG.site=site;CFG.cats=cats;CFG.prods=prods;CFG.frames=frames;
}
const fmt=n=>'₹'+Math.round(n).toLocaleString('en-IN');
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const qp=k=>new URLSearchParams(location.search).get(k);
function wa(msg){return 'https://wa.me/'+CFG.site.wa+'?text='+encodeURIComponent(msg)}
/* ---- cart ---- */
function cartGet(){try{return JSON.parse(localStorage.getItem('ss_cart')||'[]')}catch(e){return[]}}
function cartSet(c){localStorage.setItem('ss_cart',JSON.stringify(c));cartBadge()}
function cartBadge(){const n=cartGet().length;$$('.cart-count').forEach(e=>{e.textContent=n;e.style.display=n?'inline-flex':'none'})}
function toast(t){const d=document.createElement('div');d.textContent=t;
 d.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#241A13;color:#fff;padding:12px 22px;border-radius:12px;z-index:99;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.3)';
 document.body.appendChild(d);setTimeout(()=>d.remove(),1800)}
/* ---- shell (header/footer single source) ---- */
function shell(active){
 const nav=[['index.html','होम','home'],['category.html?c=oils','कच्ची घानी तेल','oils'],
  ['category.html?c=spices','मसाले','spices'],['frames.html','🖼️ फोटो फ्रेम','frames'],['acrylic.html','💎 Acrylic','acrylic'],
  ['category.html?c=handicraft','हैंडीक्राफ्ट','handicraft'],['category.html?c=cyber','साइबर सेवाएँ','cyber']];
 $('#hd').innerHTML=`<div class="wrap"><div class="hd-in">
  <a class="logo" href="index.html">${CFG.site.name}<span>STORES & DIGITAL</span></a>
  <div class="hd-acts"><a class="hd-cart" href="cart.html">🛒<b class="cart-count"></b></a>
  <a class="hd-wa" href="${wa('नमस्ते! मुझे जानकारी चाहिए।')}" target="_blank">WhatsApp</a></div></div>
  <nav class="hd-nav">${nav.map(n=>`<a href="${n[0]}" class="${active===n[2]?'on':''}">${n[1]}</a>`).join('')}</nav></div>
  ${CFG.site.announce?`<div class="announce">${CFG.site.announce}</div>`:''}`;
 $('#ft').innerHTML=`<div class="wrap"><div class="cols">
  <div><h3>${CFG.site.name}</h3><p style="margin-top:6px;font-size:14px">${CFG.site.tagline}</p>
   <p style="margin-top:10px;font-size:13.5px">📍 ${CFG.site.city}</p></div>
  <div><h4 style="color:#fff">खरीदारी</h4><p style="font-size:14px;margin-top:6px">
   <a href="category.html?c=oils">कच्ची घानी तेल</a><br><a href="category.html?c=spices">मसाले</a><br>
   <a href="frames.html">फोटो फ्रेम</a><br><a href="category.html?c=handicraft">हैंडीक्राफ्ट</a></p></div>
  <div><h4 style="color:#fff">संपर्क</h4><p style="font-size:14px;margin-top:6px">
   <a href="${wa('नमस्ते!')}" target="_blank">WhatsApp करें</a><br>📞 98731 52325</p></div></div>
  <div class="cpr">© ${new Date().getFullYear()} Sanskriti Stores & Digital • ❤️ के साथ बनाया गया</div></div>`;
 cartBadge();
}
/* ---- shared card renderers ---- */
function pCard(p){return `<a class="prod card" href="product.html?id=${p.id}">
 <img src="${p.img}" alt="${p.name}" loading="lazy">${p.badge?`<span class="badge">${p.badge}</span>`:''}
 <div class="prod-t"><h4>${p.name}</h4><div class="pr">${fmt(p.price)}<s>${fmt(p.mrp)}</s></div>
 <div class="rt">⭐ ${p.rating} • ${p.en}</div></div></a>`}

/* === Drawn frames (Generator) — बिना PNG के बने frames: borders + windows + collage === */
function shapeClipCss(sh){
 if(sh==='rounded')return 'border-radius:6%';
 if(sh==='oval'||sh==='circle')return 'border-radius:50%';
 if(sh==='custom')return '';
 if(sh&&sh.startsWith('custom:'))return 'border-radius:'+sh.slice(7).split(',').map(v=>v+'%').join(' ');
 if(['heart','bean','egg','arch','scallop'].includes(sh))return '-webkit-mask:var(--'+sh+') center/100% 100% no-repeat;mask:var(--'+sh+') center/100% 100% no-repeat';
 return ''}
function frDrawHTML(f,photos){
 /* draw = {b1:{w,c}, b2:{w,c}?, bg?, windows:[{x,y,w,h,shape}]} — photos: per-window image urls */
 const d=f.draw;if(!d)return'';
 let h='';
 if(d.b2)h+=`<div style="position:absolute;inset:${d.b1.w}%;background:${d.b2.c}"></div>`;
 if(d.bg)h+=`<div style="position:absolute;inset:${d.b1.w+(d.b2?d.b2.w:0)}%;background:${d.bg}"></div>`;
 d.windows.forEach((w,i)=>{
  const ph=photos&&photos[i%photos.length];
  h+=`<div class="fr-win" data-win="${i}" style="position:absolute;left:${w.x}%;top:${w.y}%;width:${w.w}%;height:${w.h}%;overflow:hidden;${shapeClipCss(w.shape)}">${ph?`<img src="${ph}" data-a="${ph}" data-b="${photos[(i+1)%photos.length]}" style="width:100%;height:100%;object-fit:cover;display:block" alt="">`:''}</div>`});
 return h}
function frDrawBg(f){return f.draw?`background:${f.draw.b1.c}`:''}

/* === Custom frames merge — backend से owner-made frames (11-10 Frame Maker) === */
async function loadCustomFrames(){
  try{const r=await fetch(BACKEND()+'/api/v1/store/frames');
    if(!r.ok)return;
    const cf=await r.json();
    const base=location.pathname.replace(/[^/]*$/,'');
    CFG.frames.frames=CFG.frames.frames.concat(cf.map(f=>({...f,img:BACKEND()+f.img,samp:f.samp?BACKEND()+f.samp:'',custom:true})));
  }catch(e){/* backend न मिले तो static frames ही */}}

/* === Ratio helpers (11-10) === */
function rtClass(r){return 'rt-'+r.replace(':','')}
function sizesFor(fcfg,frame){return (fcfg.ratios[frame.ratio]||Object.values(fcfg.ratios)[0]).sizes}
function BACKEND(){return (CFG.site&&CFG.site.backend)||''}

/* === Order API (11-10 pipeline) === */
async function orderCreate(fd){
  const r=await fetch(BACKEND()+'/api/v1/store/orders',{method:'POST',body:fd});
  if(!r.ok) throw new Error('HTTP '+r.status);
  return r.json();
}
