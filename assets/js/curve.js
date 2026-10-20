/* 📺 SkCurve — Curved LED TV जैसा घुमावदार screen frame
   Photo को lens-आकार (⌒ ऊपर, ⌣ नीचे) में मोड़ता है — column-strip warp (कोई सीवन नहीं) */
window.SkCurve=(()=>{
  /* घुमावदार outline — ऊपर किनारा centre में ऊपर उठा, नीचे किनारा centre में नीचा */
  function path(x,y,W,H,b){
    const p=new Path2D(), SEG=26;
    p.moveTo(x,y);
    for(let i=1;i<=SEG;i++){ const t=i/SEG,u=(t-0.5)*2; p.lineTo(x+t*W, y-b*(1-u*u)); }
    for(let i=SEG;i>=0;i--){ const t=i/SEG,u=(t-0.5)*2; p.lineTo(x+t*W, y+H+b*(1-u*u)); }
    p.closePath(); return p;
  }
  /* img के rect (X,Y,W,H) को b px घुमाव में खींचो — vertical strips, outer clip एक बार = सीवन ज़ीरो */
  function draw(c, img, X, Y, W, H, b){
    c.save();
    c.clip(path(X,Y,W,H,b));
    const iw=img.width||img.naturalWidth, ih=img.height||img.naturalHeight;
    const N=Math.max(28, Math.min(72, Math.round(W/16)));
    for(let i=0;i<N;i++){
      const t0=i/N, tm=(i+0.5)/N, u=(tm-0.5)*2, off=b*(1-u*u);
      c.drawImage(img, t0*iw, 0, iw/N, ih, X+t0*W, Y-off, W/N+0.8, H+2*off);
    }
    c.restore();
  }
  return { path, draw };
})();
