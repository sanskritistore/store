/* ================================================================
   🖼️ संस्कृति Border Engine — photo slot के सजावटी borders
   Styles: '' एकल | double दोहरी | wavy लहरिया | vine बेल-पत्ती |
           scallop अर्धचंद्र | beads मोती-माला | corner कोना-फ्रेम | zigzag ज़िग-ज़ैग
   it.bdS = style, it.bdC = रंग, it.bdW = मोटाई (inch)
   ================================================================ */
window.SkBorders=(()=>{
  const TAU=Math.PI*2;

  /* rect/ellipse perimeter पर चलो — fn(x,y,ang,nx,ny): ang=दिशा, n=बाहर normal */
  function walk(it,sc,step,fn){
    const X=it.x*sc,Y=it.y*sc,W=it.w*sc,H=it.h*sc;
    if(it.shape==='circle'||it.shape==='oval'){
      const cx=X+W/2,cy=Y+H/2,rx=W/2,ry=H/2,per=Math.PI*(rx+ry);
      for(let t=0;t<per;t+=step){ const a=t/per*TAU;
        fn(cx+rx*Math.cos(a),cy+ry*Math.sin(a),a+Math.PI/2,Math.cos(a),Math.sin(a)); }
      return true;
    }
    if(!it.shape||it.shape==='rect'||it.shape==='round'){
      for(let x=0;x<W;x+=step) fn(X+x,Y,0,0,-1);
      for(let y=0;y<H;y+=step) fn(X+W,Y+y,Math.PI/2,1,0);
      for(let x=W;x>0;x-=step) fn(X+x,Y+H,Math.PI,0,1);
      for(let y=H;y>0;y-=step) fn(X,Y+y,-Math.PI/2,-1,0);
      return true;
    }
    return false;   // arch/torn आदि — pattern नहीं, solid fallback
  }

  function draw(c,it,sc,path){
    const st=it.bdS||'', col=it.bdC||'#c9a227', lw=Math.max(1,it.bdW*sc);
    c.save(); c.setLineDash([]);                      // dash leak रोक — border हमेशा साफ़
    c.strokeStyle=col; c.fillStyle=col; c.lineWidth=lw;
    c.lineCap='round'; c.lineJoin='round';
    if(it.glow){ c.shadowColor=col; c.shadowBlur=lw*5; }
    const X=it.x*sc,Y=it.y*sc,W=it.w*sc,H=it.h*sc;

    if(!st){ c.stroke(path); c.restore(); return; }   // ─ एकल लाइन

    if(st==='double'){                                 // ═ दोहरी लाइन
      c.stroke(path);
      const g=lw*2.4; c.lineWidth=Math.max(1,lw*0.55);
      if(it.shape==='circle'||it.shape==='oval'){
        c.beginPath(); c.ellipse(X+W/2,Y+H/2,Math.max(2,W/2-g),Math.max(2,H/2-g),0,0,TAU); c.stroke();
      }else if(!it.shape||it.shape==='rect'||it.shape==='round'){
        c.strokeRect(X+g,Y+g,Math.max(2,W-2*g),Math.max(2,H-2*g));
      }else c.stroke(path);
      c.restore(); return;
    }

    if(st==='corner'){                                 // ⌐ कोना-फ्रेम (सिर्फ़ 4 कोने + बिंदु)
      const L=Math.min(W,H)*0.16;
      c.lineWidth=lw*1.15;
      [[X,Y,1,1],[X+W,Y,-1,1],[X,Y+H,1,-1],[X+W,Y+H,-1,-1]].forEach(([x,y,dx,dy])=>{
        c.beginPath(); c.moveTo(x+dx*L,y); c.lineTo(x,y); c.lineTo(x,y+dy*L); c.stroke();
        c.beginPath(); c.arc(x+dx*(L+lw*1.6),y+dy*(L+lw*1.6),lw*0.85,0,TAU); c.fill();
      });
      c.restore(); return;
    }

    if(st==='wavy'||st==='vine'){                      // 〰 लहरिया / 🌿 बेल-पत्ती (पतली)
      const amp=st==='vine'?lw*1.3:lw*1.6, wl=lw*7, thin=st==='vine'?lw*0.7:lw;
      c.lineWidth=thin;
      /* stem — perimeter के साथ sine */
      c.beginPath(); let first=true, pts=[];
      walk(it,sc,Math.max(2,wl/6),(x,y,ang,nx,ny)=>{
        pts.push([x,y,ang,nx,ny]);
      });
      pts.forEach(([x,y,ang,nx,ny],i)=>{
        const off=Math.sin(i*Math.PI/3)*amp;
        const px=x+nx*off, py=y+ny*off;
        if(first){ c.moveTo(px,py); first=false; } else c.lineTo(px,py);
      });
      c.stroke();
      if(st==='vine'){                                 // पत्तियाँ — बारी-बारी दोनों ओर
        pts.forEach(([x,y,ang,nx,ny],i)=>{
          if(i%6!==3) return;
          const side=(i/6)%2? 1:-1, ls=lw*2.1;
          c.save(); c.translate(x+nx*side*ls*0.9,y+ny*side*ls*0.9); c.rotate(ang+side*0.8);
          c.beginPath(); c.ellipse(0,0,ls,ls*0.38,0,0,TAU); c.fill(); c.restore();
        });
      }
      c.restore(); return;
    }

    if(st==='scallop'){                                // ◠◠ अर्धचंद्र लहर
      const r=lw*1.5, step=r*2;
      walk(it,sc,step,(x,y,ang)=>{
        c.beginPath(); c.arc(x,y,r,ang+Math.PI,ang+TAU); c.stroke();
      });
      c.restore(); return;
    }

    if(st==='zigzag'){                                 // ⚡ ज़िग-ज़ैग
      const amp=lw*1.7, step=lw*3;
      let i=0, first=true; c.beginPath();
      walk(it,sc,step,(x,y,ang,nx,ny)=>{
        const off=(i++%2? 1:-1)*amp;
        const px=x+nx*off, py=y+ny*off;
        if(first){ c.moveTo(px,py); first=false; } else c.lineTo(px,py);
      });
      c.stroke(); c.restore(); return;
    }

    if(st==='beads'){                                  // ●● मोती-माला
      const r=lw*0.95, step=lw*3.1;
      let i=0;
      walk(it,sc,step,(x,y,ang,nx,ny)=>{
        const off=(i++%2? 0.5:-0.5)*lw;               // हल्का लहर — माला जैसा
        c.beginPath(); c.arc(x+nx*off,y+ny*off,r,0,TAU); c.fill();
      });
      c.restore(); return;
    }

    c.stroke(path); c.restore();                       // अनजान style → एकल
  }

  return {draw};
})();
