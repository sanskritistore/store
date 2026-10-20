/* 🎯 SkPersp v1 — 4-कोना perspective warp (Photoshop Distort जैसा)
   Canvas 2D में सीधा perspective नहीं होता — image को grid में बाँटकर
   हर खाने को projective transform से मोड़ते हैं (बारीक grid = सटीक warp)
   it.persp = [dx0,dy0, dx1,dy1, dx2,dy2, dx3,dy3]  — कोना क्रम: TL,TR,BR,BL (inch में) */
window.SkPersp=(function(){
  /* unit square (0,0)(1,0)(1,1)(0,1) → quad q=[x0,y0,x1,y1,x2,y2,x3,y3] homography */
  function projT(q){
    const x0=q[0],y0=q[1],x1=q[2],y1=q[3],x2=q[4],y2=q[5],x3=q[6],y3=q[7];
    const dx1=x1-x2, dx2=x3-x2, dy1=y1-y2, dy2=y3-y2;
    const sx=x0-x1+x2-x3, sy=y0-y1+y2-y3;
    const den=dx1*dy2-dx2*dy1 || 1e-9;
    const g=(sx*dy2-sy*dx2)/den, h=(dx1*sy-dy1*sx)/den;
    return [x1-x0+g*x1, x3-x0+h*x3, x0,  y1-y0+g*y1, y3-y0+h*y3, y0,  g, h];
  }
  function mapP(T,u,v){ const z=T[6]*u+T[7]*v+1;
    return [(T[0]*u+T[1]*v+T[2])/z, (T[3]*u+T[4]*v+T[5])/z]; }
  /* 3 बिंदु जोड़े से affine matrix — src त्रिकोण → dst त्रिकोण (0.9px फैलाव = सीवन जीरो) */
  function tri(c, img, sx0,sy0,sx1,sy1,sx2,sy2, d0,d1,d2){
    const cx=(d0[0]+d1[0]+d2[0])/3, cy=(d0[1]+d1[1]+d2[1])/3;
    const ex=p=>{ const dx=p[0]-cx, dy=p[1]-cy, l=Math.hypot(dx,dy)||1;
      return [p[0]+dx/l*0.9, p[1]+dy/l*0.9]; };
    const e0=ex(d0), e1=ex(d1), e2=ex(d2);
    const u1=sx1-sx0, v1=sy1-sy0, u2=sx2-sx0, v2=sy2-sy0;
    const det=u1*v2-u2*v1 || 1e-9;
    const a=((e1[0]-e0[0])*v2-(e2[0]-e0[0])*v1)/det;
    const b=((e1[1]-e0[1])*v2-(e2[1]-e0[1])*v1)/det;
    const cc=(u1*(e2[0]-e0[0])-u2*(e1[0]-e0[0]))/det;
    const dd=(u1*(e2[1]-e0[1])-u2*(e1[1]-e0[1]))/det;
    const e=e0[0]-a*sx0-cc*sy0, f=e0[1]-b*sx0-dd*sy0;
    c.save();
    c.beginPath(); c.moveTo(e0[0],e0[1]); c.lineTo(e1[0],e1[1]); c.lineTo(e2[0],e2[1]); c.closePath(); c.clip();
    c.transform(a,b,cc,dd,e,f);
    c.drawImage(img,0,0);
    c.restore();
  }
  /* img (canvas/Image) के rect (X,Y,W,H) को off (inch, sc scale) से मोड़कर c में बनाओ
     हर grid खाना = 2 त्रिकोण — त्रिकोण affine में EXACT मैप होता है, इसलिए कोई सीवन/lines नहीं */
  function draw(c, img, X, Y, W, H, off, sc){
    const q=[ X+off[0]*sc,     Y+off[1]*sc,
              X+W+off[2]*sc,   Y+off[3]*sc,
              X+W+off[4]*sc,   Y+H+off[5]*sc,
              X+off[6]*sc,     Y+H+off[7]*sc ];
    const T=projT(q);
    const N=Math.max(12, Math.min(28, Math.round(Math.max(W,H)/18)));   /* बड़ी photo = बारीक़ grid */
    const iw=img.width||img.naturalWidth, ih=img.height||img.naturalHeight;
    const sw=iw/N, sh=ih/N;
    c.save();   /* बाहरी सीमा एक बार clip — किनारे साफ़ */
    c.beginPath(); c.moveTo(q[0],q[1]); c.lineTo(q[2],q[3]); c.lineTo(q[4],q[5]); c.lineTo(q[6],q[7]); c.closePath(); c.clip();
    for(let j=0;j<N;j++) for(let i=0;i<N;i++){
      const u0=i/N, v0=j/N, u1=(i+1)/N, v1=(j+1)/N;
      const p00=mapP(T,u0,v0), p10=mapP(T,u1,v0), p11=mapP(T,u1,v1), p01=mapP(T,u0,v1);
      const sx=i*sw, sy=j*sh;
      tri(c, img, sx,sy,  sx+sw,sy,  sx+sw,sy+sh,  p00,p10,p11);
      tri(c, img, sx,sy,  sx+sw,sy+sh,  sx,sy+sh,  p00,p11,p01);
    }
    c.restore();
  }
  function has(it){ return !!(it.persp && it.persp.some(v=>Math.abs(v)>1e-4)); }
  return { draw, has, projT, mapP };
})();
