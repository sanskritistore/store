/* 📄 फटा किनारा (torn paper edge) — Template Maker / Viewer / Builder तीनों में एक जैसा
   tornRect(path,x,y,w,h,side,depthF,seed,sc): side='R'|'L'|'T'|'B', depthF=0.02-0.35 (भाग), seed=हर item का अपना (हर redraw पर same), sc=px प्रति inch */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function tornRect(path,x,y,w,h,side,depthF,seed,sc){
  const dep=Math.min(0.35,Math.max(0.02,depthF||0.12))*((side==='R'||side==='L')?w:h);
  const rnd=mulberry32(seed||7);
  const jag=(x0,y0,x1,y1,nx,ny)=>{ const len=Math.hypot(x1-x0,y1-y0);
    const n=Math.max(9,Math.round(len/((sc||30)*0.55)));  /* असली कागज़ जैसा: jag की संख्या physical size से */
    for(let i=1;i<n;i++){ const t=i/n; const d=(0.25+rnd()*0.75)*dep;
      path.lineTo(x0+(x1-x0)*t+nx*d, y0+(y1-y0)*t+ny*d); } };
  if(side==='R'){ path.moveTo(x,y); path.lineTo(x,y+h); path.lineTo(x+w,y+h); jag(x+w,y+h,x+w,y,-1,0); path.lineTo(x+w,y); }
  else if(side==='L'){ path.moveTo(x+w,y); path.lineTo(x+w,y+h); path.lineTo(x,y+h); jag(x,y+h,x,y,1,0); path.lineTo(x,y); }
  else if(side==='T'){ path.moveTo(x,y+h); path.lineTo(x+w,y+h); path.lineTo(x+w,y); jag(x+w,y,x,y,0,1); path.lineTo(x,y); }
  else { path.moveTo(x,y); path.lineTo(x+w,y); path.lineTo(x+w,y+h); jag(x+w,y+h,x,y+h,0,-1); path.lineTo(x,y+h); }
  path.closePath();
}
