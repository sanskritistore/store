/* 🪚 Sanskriti Print Suite — Core 3b: Crop Box Editor (shared)
   असली crop box: 4 कोने draggable (aspect locked), box के बाहर अंधेरा, thirds grid, अंदर drag = move.
   photo.html (Module A) और idcard.html (Module B) दोनों इसी से चलते हैं — duplication शून्य।
   Usage:
     const ed = SUITE_CROP.create($("cropWrap"), $("cropCanvas"));
     ed.setAspect(35/45); ed.setImage(srcCanvas);  →  ed.rectSrc() // src px में crop rect
*/
window.SUITE_CROP = {
  create(wrap, cvs) {
    let src = null, winW = 0, winH = 0, cscale = 1, aspect = 1;
    let crop = { x: 0, y: 0, w: 10, h: 10 }; // canvas px

    function fit() {
      if (!src) return;
      const maxW = Math.min(360, window.innerWidth - 28), maxH = 440;
      cscale = Math.min(maxW / src.width, maxH / src.height);
      winW = Math.max(1, Math.round(src.width * cscale));
      winH = Math.max(1, Math.round(src.height * cscale));
      wrap.style.width = winW + "px";
      wrap.style.height = winH + "px";
      cvs.width = winW; cvs.height = winH;
      let rw = winW * 0.94, rh = rw / aspect;
      if (rh > winH * 0.94) { rh = winH * 0.94; rw = rh * aspect; }
      crop = { x: (winW - rw) / 2, y: (winH - rh) / 2, w: rw, h: rh };
      draw();
    }

    function draw() {
      if (!src) return;
      const ctx = cvs.getContext("2d");
      ctx.drawImage(src, 0, 0, winW, winH);
      ctx.fillStyle = "rgba(0,0,0,0.55)"; // box के बाहर अंधेरा
      ctx.fillRect(0, 0, winW, Math.max(0, crop.y));
      ctx.fillRect(0, crop.y + crop.h, winW, Math.max(0, winH - crop.y - crop.h));
      ctx.fillRect(0, crop.y, Math.max(0, crop.x), crop.h);
      ctx.fillRect(crop.x + crop.w, crop.y, Math.max(0, winW - crop.x - crop.w), crop.h);
      ctx.strokeStyle = "rgba(255,255,255,0.4)"; // thirds grid
      ctx.lineWidth = 1;
      for (let i = 1; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(crop.x + (crop.w * i) / 3, crop.y); ctx.lineTo(crop.x + (crop.w * i) / 3, crop.y + crop.h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(crop.x, crop.y + (crop.h * i) / 3); ctx.lineTo(crop.x + crop.w, crop.y + (crop.h * i) / 3); ctx.stroke();
      }
      ctx.strokeStyle = "#fff"; // border
      ctx.lineWidth = 2;
      ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);
      ctx.lineWidth = 6; // मोटे corner handles
      ctx.lineCap = "round";
      const L = Math.max(14, Math.min(26, crop.w / 3, crop.h / 3));
      [[crop.x, crop.y, 1, 1], [crop.x + crop.w, crop.y, -1, 1],
       [crop.x, crop.y + crop.h, 1, -1], [crop.x + crop.w, crop.y + crop.h, -1, -1]].forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx + dx * L, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dy * L);
        ctx.stroke();
      });
    }

    const HIT = 32; // कोना पकड़ने का दायरा (px)
    function cPos(e) {
      const r = cvs.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function cornerAt(p) {
      const c = crop;
      const m = [["tl", c.x, c.y], ["tr", c.x + c.w, c.y], ["bl", c.x, c.y + c.h], ["br", c.x + c.w, c.y + c.h]];
      for (const [k, x, y] of m) if (Math.abs(p.x - x) <= HIT && Math.abs(p.y - y) <= HIT) return k;
      return null;
    }
    let drag = null;
    wrap.addEventListener("pointerdown", (e) => {
      const p = cPos(e);
      const k = cornerAt(p);
      const inside = p.x > crop.x && p.x < crop.x + crop.w && p.y > crop.y && p.y < crop.y + crop.h;
      drag = k ? { mode: k, last: p } : inside ? { mode: "move", last: p } : null;
      if (drag) wrap.setPointerCapture(e.pointerId);
    });
    wrap.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const p = cPos(e);
      const MIN = 34;
      if (drag.mode === "move") {
        crop.x = Math.max(0, Math.min(winW - crop.w, crop.x + p.x - drag.last.x));
        crop.y = Math.max(0, Math.min(winH - crop.h, crop.y + p.y - drag.last.y));
      } else {
        const ax = drag.mode.includes("l") ? crop.x + crop.w : crop.x; // सामने वाला कोना anchor
        const ay = drag.mode.includes("t") ? crop.y + crop.h : crop.y;
        let w2 = Math.abs(p.x - ax);
        w2 = Math.min(w2, drag.mode.includes("l") ? ax : winW - ax);
        let h2 = w2 / aspect;
        const maxH = drag.mode.includes("t") ? ay : winH - ay;
        if (h2 > maxH) { h2 = maxH; w2 = h2 * aspect; }
        if (w2 < MIN) { w2 = MIN; h2 = w2 / aspect; }
        crop.w = w2; crop.h = h2;
        crop.x = drag.mode.includes("l") ? ax - w2 : ax;
        crop.y = drag.mode.includes("t") ? ay - h2 : ay;
      }
      drag.last = p;
      draw();
    });
    wrap.addEventListener("pointerup", () => (drag = null));
    wrap.addEventListener("pointercancel", () => (drag = null));

    return {
      setImage(s) { src = s; fit(); },
      setAspect(a) { aspect = a; if (src) fit(); },
      redraw() { draw(); },
      rectSrc() { return { x: crop.x / cscale, y: crop.y / cscale, w: crop.w / cscale, h: crop.h / cscale }; },
    };
  },
};
