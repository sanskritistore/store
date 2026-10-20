/* Sanskriti Album Render Engine v1 — album-maker से निकाला गया single source */
const Engine=(()=>{
let IMG_CACHE={};
function loadImage(src){return new Promise(res=>{if(IMG_CACHE[src])return res(IMG_CACHE[src]);const im=new Image();im.onload=()=>{IMG_CACHE[src]=im;res(im)};im.onerror=()=>res(null);im.src=src;})}
function flourPath(c){
  /* असली wedding-album style: outline फूल (पंखुड़ी+केशर+सुनहरा बीच) + टहनी पर जोड़ी पत्तियाँ */
  const bez=(p,t)=>{ const u=1-t;
    return [u*u*u*p[0][0]+3*u*u*t*p[1][0]+3*u*t*t*p[2][0]+t*t*t*p[3][0],
            u*u*u*p[0][1]+3*u*u*t*p[1][1]+3*u*t*t*p[2][1]+t*t*t*p[3][1]]; };
  const bezTan=(p,t)=>{ const u=1-t;
    const dx=3*u*u*(p[1][0]-p[0][0])+6*u*t*(p[2][0]-p[1][0])+3*t*t*(p[3][0]-p[2][0]);
    const dy=3*u*u*(p[1][1]-p[0][1])+6*u*t*(p[2][1]-p[1][1])+3*t*t*(p[3][1]-p[2][1]);
    return Math.atan2(dy,dx); };
  const flower=(cx,cy,R,rot)=>{
    c.save(); c.translate(cx,cy); c.rotate(rot||0);
    const P=6, lw=c.lineWidth;
    for(let i=0;i<P;i++){ c.save(); c.rotate(i*Math.PI*2/P);
      c.beginPath(); c.ellipse(R*0.50,0,R*0.48,R*0.26,0,0,7); c.stroke(); c.restore(); }
    c.lineWidth=lw*0.55;
    for(let i=0;i<12;i++){ const a=i*Math.PI/6+Math.PI/12;
      c.beginPath(); c.moveTo(Math.cos(a)*R*0.20,Math.sin(a)*R*0.20);
      c.lineTo(Math.cos(a)*R*0.42,Math.sin(a)*R*0.42); c.stroke(); }
    c.lineWidth=lw; c.restore();
    c.beginPath(); c.arc(cx,cy,R*0.17,0,7); c.fill();
  };
  const leaf=(x,y,ang,len)=>{
    c.save(); c.translate(x,y); c.rotate(ang);
    c.beginPath(); c.moveTo(0,0);
    c.quadraticCurveTo(len*0.38,-len*0.32, len,0);
    c.quadraticCurveTo(len*0.38, len*0.32, 0,0); c.stroke();
    const lw=c.lineWidth; c.lineWidth=lw*0.55;
    c.beginPath(); c.moveTo(len*0.10,0); c.lineTo(len*0.88,0); c.stroke();
    c.lineWidth=lw; c.restore();
  };
  const berry=(x,y)=>{ c.beginPath(); c.arc(x,y,0.016,0,7); c.fill(); };
  const stemWithLeaves=(p,leafLen,side)=>{
    c.beginPath(); c.moveTo(p[0][0],p[0][1]);
    c.bezierCurveTo(p[1][0],p[1][1],p[2][0],p[2][1],p[3][0],p[3][1]); c.stroke();
    [0.30,0.45,0.60,0.75,0.90].forEach((t,i)=>{
      const [x,y]=bez(p,t), a=bezTan(p,t);
      const dir=(i%2? 1:-1)*side;
      leaf(x,y, a+dir*1.05, leafLen*(1-t*0.35));
    });
  };
  // टहनियाँ: corner से दोनों किनारों के साथ
  stemWithLeaves([[0.06,0.16],[0.30,0.04],[0.62,0.14],[0.98,0.05]], 0.13, 1);   // bottom edge
  stemWithLeaves([[0.16,0.06],[0.04,0.30],[0.14,0.62],[0.05,0.98]], 0.13, -1);  // side edge
  stemWithLeaves([[0.04,0.04],[0.16,0.10],[0.10,0.16],[0.22,0.22]], 0.10, 1);   // diagonal sprig
  // फूल cluster — corner की ओर
  flower(0.36,0.36,0.17,0.3);
  flower(0.185,0.50,0.125,1.2);
  flower(0.50,0.185,0.125,-0.6);
  flower(0.155,0.155,0.10,0.8);
  // berries: छोटे सुनहरे दाने
  berry(0.62,0.30); berry(0.68,0.34); berry(0.64,0.38);
  berry(0.30,0.62); berry(0.34,0.68); berry(0.38,0.64);
  berry(0.78,0.16); berry(0.16,0.78);
}
function hexA(hex,a){ const n=parseInt(hex.slice(1),16); return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`; }
function drawDecor(c,it,sc){
  c.save();
  c.strokeStyle=it.c; c.fillStyle=it.c;
  if(it.decor==='corners'){
    const s=(it.size||1.6)*sc;
    const P=0.12*sc;  // page से हल्का अंदर (c.canvas = preview/export दोनों)
    const w=c.canvas.width, h=c.canvas.height;
    const draw=(x,y,fx,fy)=>{ c.save(); c.translate(x,y); c.scale(fx*s,fy*s); c.lineWidth=0.032; c.lineCap='round'; flourPath(c); c.restore(); };
    draw(P,P,1,1); draw(w-P,P,-1,1); draw(P,h-P,1,-1); draw(w-P,h-P,-1,-1);
  }else if(it.decor==='mandala'){
    const w=c.canvas.width, h=c.canvas.height;
    const cx=it.cx!=null? it.cx*sc : w/2, cy=it.cy!=null? it.cy*sc : h/2;
    const R=(it.size||2.6)*sc/2;
    c.lineWidth=Math.max(1,0.012*R);
    c.globalAlpha=it.alpha!=null? it.alpha : 0.55;
    // rings
    [1,0.86,0.7].forEach(f=>{ c.beginPath(); c.arc(cx,cy,R*f,0,7); c.stroke(); });
    // petals
    const n=16;
    for(let i=0;i<n;i++){
      const a=i*Math.PI*2/n;
      c.save(); c.translate(cx,cy); c.rotate(a);
      c.beginPath(); c.ellipse(R*0.78,0,R*0.16,R*0.07,0,0,7); c.stroke(); c.restore();
    }
    // dots ring
    for(let i=0;i<n*2;i++){
      const a=i*Math.PI/(n);
      c.beginPath(); c.arc(cx+Math.cos(a)*R*0.93, cy+Math.sin(a)*R*0.93, Math.max(1,0.02*R), 0, 7); c.fill();
    }
    c.globalAlpha=1;
  }else if(it.decor==='palm'){
    const s=(it.size||3)*sc, cx=(it.cx||0)*sc, cy=(it.cy||0)*sc;
    c.save(); c.translate(cx,cy); c.rotate((it.rot||0)*Math.PI/180); c.scale(it.flip||1,1);
    c.globalAlpha=it.alpha!=null? it.alpha : 0.9;
    c.lineCap='round';
    c.lineWidth=Math.max(1,0.011*s);
    c.beginPath(); c.moveTo(0,0); c.quadraticCurveTo(0.45*s,-0.18*s, s,-0.22*s); c.stroke();
    const blw=c.lineWidth;
    for(let i=0;i<17;i++){
      const t=0.04+i*0.056, u=1-t;
      const px=2*u*t*0.45*s+t*t*s, py=2*u*t*(-0.18*s)+t*t*(-0.22*s);
      const tdx=2*u*0.45*s+2*t*0.55*s, tdy=2*u*(-0.18*s)+2*t*(-0.04*s);
      const tan=Math.atan2(tdy,tdx);
      const L=(1-t*0.70)*0.34*s;
      const side=i%2? 1:-1;
      c.save(); c.translate(px,py); c.rotate(tan+side*0.60);
      c.lineWidth=blw*0.7;
      c.beginPath(); c.moveTo(0,0);
      c.quadraticCurveTo(L*0.55,-L*0.03, L, L*0.16);   // हल्का झुकाव (droop)
      c.stroke(); c.restore();
    }
    c.restore();
  }else if(it.decor==='wash'){
    const cx=(it.cx||0)*sc, cy=(it.cy||0)*sc, R=(it.size||3)*sc;
    c.save();
    try{ c.filter=`blur(${Math.max(2,R*0.16)}px)`; }catch(_){}
    c.globalAlpha=it.alpha!=null? it.alpha:0.5;
    c.fillStyle=it.c;
    c.beginPath(); c.ellipse(cx,cy,R,R*0.72,0.3,0,7); c.fill();
    c.beginPath(); c.ellipse(cx+R*0.38,cy-R*0.22,R*0.68,R*0.48,-0.4,0,7); c.fill();
    c.beginPath(); c.ellipse(cx-R*0.32,cy+R*0.26,R*0.58,R*0.42,0.5,0,7); c.fill();
    c.filter='none'; c.globalAlpha=1; c.restore();
  }else if(it.decor==='spotlight'){
    const cx=(it.cx!=null?it.cx:9)*sc, cy=(it.cy!=null?it.cy:6)*sc;
    const R=(it.size||6)*sc;
    const g=c.createRadialGradient(cx,cy,0,cx,cy,R);
    g.addColorStop(0,hexA(it.c, it.alpha!=null? it.alpha:0.5));
    g.addColorStop(1,hexA(it.c,0));
    c.fillStyle=g; c.fillRect(cx-R,cy-R,R*2,R*2);
  }else if(it.decor==='frame'){
    const w=c.canvas.width, h=c.canvas.height;
    const lw=Math.max(1,0.012*sc);
    c.lineWidth=lw*2.2;
    c.strokeRect(0.18*sc,0.18*sc,w-0.36*sc,h-0.36*sc);
    c.lineWidth=lw;
    c.strokeRect(0.30*sc,0.30*sc,w-0.60*sc,h-0.60*sc);
  }
  c.restore();
}
function drawItem(c,it,sc,forExport){
  c.save();
  if(it.kind==='decor'){ c.restore(); drawDecor(c,it,sc); return; }
  const X=it.x*sc, Y=it.y*sc;
  if(it.kind==='photo'){
    const W=it.w*sc, H=it.h*sc;
    const mkPath=(ox,oy)=>{ const path=new Path2D();
      if(it.tornSide&&(!it.shape||it.shape==='rect'||it.shape==='round')){ tornRect(path,ox,oy,W,H,it.tornSide,it.tornDepth,it.tornSeed,sc); return path; } /* 📄 फटा किनारा */
      if(it.shape==='circle'){ const r=Math.min(W,H)/2; path.arc(ox+W/2,oy+H/2,r,0,7); }
      else if(it.shape==='oval'){ path.ellipse(ox+W/2,oy+H/2,W/2,H/2,0,0,7); }
      else if(it.shape==='tri'){ path.moveTo(ox,oy+H); path.lineTo(ox+W,oy+H); path.lineTo(ox+W,oy); path.closePath(); }
      else if(it.shape==='arch'){ const r=W/2, top=oy+r;
        path.moveTo(ox,oy+H); path.lineTo(ox,top); path.arc(ox+r,top,r,Math.PI,0); path.lineTo(ox+W,oy+H); path.closePath(); }
      else if(it.shape==='round'){ const r=Math.min(W,H)*0.09;
        if(path.roundRect) path.roundRect(ox,oy,W,H,r); else path.rect(ox,oy,W,H); }
      else path.rect(ox,oy,W,H);
      return path; };
    c.save();
    if(it.rot){ c.translate(X+W/2,Y+H/2); c.rotate(it.rot*Math.PI/180); c.translate(-X-W/2,-Y-H/2); }
    const path=mkPath(X,Y);
    if(it.photo){
      // offscreen tile — fade सिर्फ photo पर लगे, नीचे की चीज़ें सुरक्षित
      const oc=document.createElement('canvas'); oc.width=Math.max(2,Math.round(W)); oc.height=Math.max(2,Math.round(H));
      const o=oc.getContext('2d');
      const op=mkPath(0,0); o.clip(op);
      if((it.fx||1)!==1||(it.fy||1)!==1){ o.translate(W/2,H/2); o.scale(it.fx||1,it.fy||1); o.translate(-W/2,-H/2); }   /* ⇄⇅ आईना/उल्टा */
      const sr=it.photo.width/it.photo.height, tr=W/H;
      const zoom=it.zoom||1, px=(it.px==null?0.5:it.px), py=(it.py==null?0.5:it.py);
      if(it.fit==='blur'){
        /* पूरी photo — कुछ नहीं कटेगा; पीछे धुंधला पसारा */
        let bw2,bh2; if(sr>tr){ bh2=H; bw2=H*sr; } else { bw2=W; bh2=W/sr; }
        o.save(); o.filter='blur('+Math.max(6,Math.round(W*0.03))+'px) brightness(0.82) saturate(1.15)';
        o.drawImage(it.photo,(W-bw2)/2,(H-bh2)/2,bw2,bh2); o.restore();
        let cw,ch; if(sr>tr){ cw=W*0.97; ch=cw/sr; } else { ch=H*0.97; cw=ch*sr; }
        cw*=zoom; ch*=zoom;
        if(it.bw){ o.filter='grayscale(1)'; }
        o.drawImage(it.photo,(W-cw)*px,(H-ch)*py,cw,ch);
        if(it.bw){ o.filter='none'; }
      }else{
        /* भरकर (cover) — zoom + खिसकाओ; default सिर-सुरक्षित */
        let dw,dh; if(sr>tr){ dh=H; dw=H*sr; } else { dw=W; dh=W/sr; }
        dw*=zoom; dh*=zoom;
        if(it.bw){ o.filter='grayscale(1)'; }
        o.drawImage(it.photo,(W-dw)*px,(H-dh)*py,dw,dh);
        if(it.bw){ o.filter='none'; }
      }
      if(it.fadeR>0){ /* 4-तरफ़ feather — हर किनारा पूरी तरह घुलता है, joint का पता नहीं चलता (Dev: 2 photo he ya 4, ek hi lage) */
        const f=Math.min(it.fadeR,0.5);
        o.globalCompositeOperation='destination-in';
        let g=o.createLinearGradient(0,0,W,0);   /* बाएँ↔दाएँ */
        g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(f,'rgba(0,0,0,1)');
        g.addColorStop(1-f,'rgba(0,0,0,1)'); g.addColorStop(1,'rgba(0,0,0,0)');
        o.fillStyle=g; o.fillRect(0,0,W,H);
        g=o.createLinearGradient(0,0,0,H);       /* ऊपर↔नीचे */
        g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(f,'rgba(0,0,0,1)');
        g.addColorStop(1-f,'rgba(0,0,0,1)'); g.addColorStop(1,'rgba(0,0,0,0)');
        o.fillStyle=g; o.fillRect(0,0,W,H);
        o.globalCompositeOperation='source-over';
      }
      if(it.fade>0){
        const f=Math.min(it.fade,0.9);
        o.globalCompositeOperation='destination-in';
        const g=o.createLinearGradient(0,0,0,H);
        g.addColorStop(0,'rgba(0,0,0,1)');
        g.addColorStop(Math.max(0.05,1-f*1.35),'rgba(0,0,0,1)');
        g.addColorStop(1,`rgba(0,0,0,${1-f})`);
        o.fillStyle=g; o.fillRect(0,0,W,H);
        o.globalCompositeOperation='source-over';
      }
      if(window.SkPersp&&SkPersp.has(it)){   /* 🎯 perspective — border+frame भी tile के साथ मुड़े */
        if(it.bdW>0){ (window.SkBorders?SkBorders.draw:(c2,itt,sc2,p)=>{ c2.setLineDash([]); c2.strokeStyle=itt.bdC; c2.lineWidth=itt.bdW*sc2; c2.stroke(p); })(o,it,sc,mkPath(0,0)); }
        if(it.bdImg){ let im=it._bdIm;
          if(!im){ im=new Image(); im.onload=()=>{ if(typeof draw==='function')draw(); }; im.src=it.bdImg; it._bdIm=im; }
          if(im.complete&&im.naturalWidth) o.drawImage(im,0,0,W,H); }
        SkPersp.draw(c,oc,X,Y,W,H,it.persp,sc);
      }
      else c.drawImage(oc,X,Y,oc.width,oc.height);
    }else{
      c.fillStyle='#ffffff14'; c.fill(path);
      c.strokeStyle='#ffffff55'; c.setLineDash([8,6]); c.lineWidth=2; c.stroke(path); c.setLineDash([]);
      if(!forExport){
        c.fillStyle='#ffffff88'; c.font=`${Math.min(W,H)*0.22}px sans-serif`;
        c.textAlign='center'; c.textBaseline='middle';
        c.fillText('📷', X+W/2, Y+H/2);
      }
    }
    if(it.bdW>0&&!(window.SkPersp&&SkPersp.has(it))){ (window.SkBorders?SkBorders.draw:(c2,itt,sc2,p)=>{ c2.setLineDash([]); c2.strokeStyle=itt.bdC; c2.lineWidth=itt.bdW*sc2; c2.stroke(p); })(c,it,sc,path); }   /* persp में border tile के अंदर मुड़ा */
    if(it.bdImg&&!(window.SkPersp&&SkPersp.has(it))){ let im=it._bdIm;   /* 🖼️ अपना Border frame */
      if(!im){ im=new Image(); im.src=it.bdImg; it._bdIm=im; }
      if(im.complete&&im.naturalWidth) c.drawImage(im,X,Y,W,H); }
    c.restore();
  }else{
    c.fillStyle=it.c;
    c.font=(window.SkFonts?SkFonts.fontFam(it,sc):`600 ${it.size*sc}px Georgia,'Nirmala UI',serif`);
    c.textAlign='center'; c.textBaseline='middle';
    c.shadowColor='#0003'; c.shadowBlur=sc*0.03;
    const lsPx=(window.SkFonts?SkFonts.fontLS(it,sc):(it.f==='royal'?it.size*sc*0.20:0));
    if(lsPx && 'letterSpacing' in c) c.letterSpacing=lsPx+'px';
    c.save();   /* ⇄⇅ आईना/उल्टा — text भी */
    if((it.fx||1)!==1||(it.fy||1)!==1){ c.translate(X,Y); c.scale(it.fx||1,it.fy||1); c.translate(-X,-Y); }
    c.fillText(it.text, X, Y);
    if(it.box){
      const tw=c.measureText(it.text).width, ph=it.size*sc;
      c.shadowBlur=0; c.strokeStyle=it.c; c.lineWidth=Math.max(1,ph*0.022);
      c.strokeRect(X-tw/2-ph*0.35, Y-ph*0.62, tw+ph*0.70, ph*1.24);
    }
    if('letterSpacing' in c) c.letterSpacing='0px';
    c.restore();   /* ⇄⇅ flip wrap समाप्त */
  }
  c.restore();
}
/* template render: canvas पर template + photos (demo या customer) */
async function renderPage(cv,tpl,photos,dpi){
  cv.width=Math.round(tpl.W*dpi); cv.height=Math.round(tpl.H*dpi);
  const c=cv.getContext('2d');
  if(tpl.bg&&tpl.bg.grad){const g=c.createLinearGradient(0,0,cv.width,cv.height);g.addColorStop(0,tpl.bg.c1);g.addColorStop(1,tpl.bg.c2);c.fillStyle=g;}
  else c.fillStyle=(tpl.bg&&tpl.bg.c1)||'#222';
  c.fillRect(0,0,cv.width,cv.height);
  // photo slots में photos बाँटो (aspect-match + सिर-सुरक्षित fit)
  const slots=tpl.items.filter(it=>it.kind==='photo'&&!it.fill); /* 🎨 कागज़ panel photo slot नहीं */
  const items=tpl.items.map(it=>({...it}));
  const used=new Set();
  for(const it of items){
    if(it.kind==='photo'&&!it.photo&&!it.fill&&photos&&photos.length){
      if(used.size>=photos.length) used.clear();
      const srr=it.w/it.h; let bi=0,bs=1e9;
      photos.forEach((im,j)=>{ if(used.has(j))return; const sc=Math.abs(Math.log((im.width/im.height)/srr)); if(sc<bs){bs=sc;bi=j;} });
      const im=photos[bi]; used.add(bi);
      it.photo=im; it.pr=im.width/im.height;
      /* Dev 17 Oct: photo हमेशा FULL box भरे (cover) — blur पट्टियाँ नहीं; सिर-सुरक्षित crop */
      if((im.width/im.height)<srr){ it.py=0.22; }
    }
  }
  for(const it of items) drawItem(c,it,dpi,true);
  return slots.length;
}
/* preload photos from URLs */
async function loadPhotos(urls){
  const ims=await Promise.all(urls.map(loadImage));
  return ims.filter(Boolean);
}
return {renderPage,loadPhotos,loadImage,drawItem,drawDecor};
})();
