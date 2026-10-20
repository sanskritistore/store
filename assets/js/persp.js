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
  /* img (canvas/Image) के rect (X,Y,W,H) को off (inch, sc scale) से मोड़कर c में बनाओ */
  function draw(c, img, X, Y, W, H, off, sc){
    const q=[ X+off[0]*sc,     Y+off[1]*sc,
              X+W+off[2]*sc,   Y+off[3]*sc,
              X+W+off[4]*sc,   Y+H+off[5]*sc,
              X+off[6]*sc,     Y+H+off[7]*sc ];
    const T=projT(q);
    const N=Math.max(14, Math.min(36, Math.round(Math.max(W,H)/16)));   /* बड़ी photo = बारीक़ grid */
    const iw=img.width||img.naturalWidth, ih=img.height||img.naturalHeight;
    for(let j=0;j<N;j++) for(let i=0;i<N;i++){
      const u0=i/N, v0=j/N, u1=(i+1)/N, v1=(j+1)/N;
      const p00=mapP(T,u0,v0), p10=mapP(T,u1,v0), p11=mapP(T,u1,v1), p01=mapP(T,u0,v1);
      const sx=i*iw/N, sy=j*ih/N, sw=iw/N, sh=ih/N;
      c.save();
      c.beginPath();
      c.moveTo(p00[0],p00[1]); c.lineTo(p10[0],p10[1]); c.lineTo(p11[0],p11[1]); c.lineTo(p01[0],p01[1]);
      c.closePath(); c.clip();
      c.transform((p10[0]-p00[0])/sw, (p10[1]-p00[1])/sw,
                  (p01[0]-p00[0])/sh, (p01[1]-p00[1])/sh, p00[0], p00[1]);
      c.drawImage(img, sx, sy, sw, sh, 0, 0, sw+0.7, sh+0.7);   /* हल्का overlap — सीवन न दिखे */
      c.restore();
    }
  }
  function has(it){ return !!(it.persp && it.persp.some(v=>Math.abs(v)>1e-4)); }
  return { draw, has, projT, mapP };
})();
