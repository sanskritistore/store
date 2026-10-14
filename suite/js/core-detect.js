/* 🪚 Sanskriti Print Suite — Core 3c: Auto Card Detection v2 (shared)
   v2 सीख: edge-density गलत नज़रिया था — card का border नरम होता है, text तेज़।
   नया तरीक़ा: card = page के bg रंग से अलग बड़ा ठोस BLOCK (नीला card/सफ़ेद page, सफ़ेद card/काली मेज़)।
   Pipeline: bg रंग (border ring median) → color-distance mask → row/col solid-fill bands →
   CR80 aspect filter → (0 मिले तो पुराना edge-projection fallback)।
   Usage: SUITE_DETECT.cards(srcCanvas, aspect) → [{x,y,w,h}, ...] src px (y,x क्रम, max 4)
*/
window.SUITE_DETECT = {
  cards(src, aspect) {
    aspect = aspect || 1.586; // CR80
    const MAX = 480;
    const sc = Math.min(1, MAX / Math.max(src.width, src.height));
    const w = Math.max(8, Math.round(src.width * sc));
    const h = Math.max(8, Math.round(src.height * sc));
    const cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(src, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    const inv = 1 / sc;
    const inset = 1.5 * inv;
    const toSrc = (r) => ({
      x: Math.max(0, r.x * inv + inset),
      y: Math.max(0, r.y * inv + inset),
      w: Math.min(src.width, r.w * inv - 2 * inset),
      h: Math.min(src.height, r.h * inv - 2 * inset),
    });

    // ── Stage A: ठोस color-block detection ──
    const ring = [];
    const bw = Math.max(2, Math.round(w * 0.03)), bh = Math.max(2, Math.round(h * 0.03));
    for (let y = 0; y < h; y += 2)
      for (let x = 0; x < w; x += 2)
        if (y < bh || y >= h - bh || x < bw || x >= w - bw) {
          const i = (y * w + x) * 4;
          ring.push([d[i], d[i + 1], d[i + 2]]);
        }
    const medC = (ch) => { const a = ring.map((p) => p[ch]).sort((p, q) => p - q); return a[a.length >> 1]; };
    const bg = [medC(0), medC(1), medC(2)];

    const THR2 = 14 * 14 * 3; // हल्का नीला card भी पकड़े (PAN 232,240,250 vs 255,255,255)
    const mask = new Uint8Array(w * h);
    for (let i = 0, j = 0; i < d.length; i += 4, j++) {
      const dr = d[i] - bg[0], dg = d[i + 1] - bg[1], db = d[i + 2] - bg[2];
      mask[j] = dr * dr + dg * dg + db * db > THR2 ? 1 : 0;
    }

    const rowFill = new Float32Array(h);
    for (let y = 0; y < h; y++) {
      let c = 0;
      for (let x = 0; x < w; x++) c += mask[y * w + x];
      rowFill[y] = c / w;
    }
    // ठोस horizontal bands (fill > 0.5, छोटे gaps ≤2px माफ़, min ऊँचाई 10px)
    const bands = [];
    let s = -1, gap = 0;
    for (let y = 0; y <= h; y++) {
      const solid = y < h && rowFill[y] > 0.5;
      if (solid) { if (s < 0) s = y; gap = 0; }
      else if (s >= 0 && ++gap > 2) {
        if (y - gap - s >= 10) bands.push([s, y - gap - 1]);
        s = -1;
      }
    }
    // हर band में ठोस vertical blocks
    const blocks = [];
    for (const [y1, y2] of bands) {
      const colFill = new Float32Array(w);
      for (let x = 0; x < w; x++) {
        let c = 0;
        for (let y = y1; y <= y2; y++) c += mask[y * w + x];
        colFill[x] = c / (y2 - y1 + 1);
      }
      let sx = -1, gx = 0;
      for (let x = 0; x <= w; x++) {
        const solid = x < w && colFill[x] > 0.5;
        if (solid) { if (sx < 0) sx = x; gx = 0; }
        else if (sx >= 0 && ++gx > 2) {
          if (x - gx - sx >= w * 0.2) blocks.push({ x: sx, y: y1, w: x - gx - sx, h: y2 - y1 + 1 });
          sx = -1;
        }
      }
    }
    // edges tight करो: भीतर fill ~90%, बाहर ~0 — जहाँ fill 0.35 cross हो वहीं किनारा
    const tight = (r) => {
      const cf = (x) => { let c = 0; for (let y = r.y; y < r.y + r.h; y++) c += mask[y * w + x] ? 1 : 0; return c / r.h; };
      const rf = (y) => { let c = 0; for (let x = r.x; x < r.x + r.w; x++) c += mask[y * w + x] ? 1 : 0; return c / r.w; };
      let nx = r.x;
      while (nx > 0 && cf(nx - 1) > 0.35) nx--;
      let nx2 = r.x + r.w - 1;
      while (nx2 < w - 1 && cf(nx2 + 1) > 0.35) nx2++;
      let ny = r.y;
      while (ny > 0 && rf(ny - 1) > 0.35) ny--;
      let ny2 = r.y + r.h - 1;
      while (ny2 < h - 1 && rf(ny2 + 1) > 0.35) ny2++;
      return { x: nx, y: ny, w: nx2 - nx + 1, h: ny2 - ny + 1 };
    };
    let found = [];
    for (const b of blocks) {
      const r = tight(b);
      const ratio = r.w / r.h;
      if (Math.abs(ratio - aspect) / aspect > 0.15) continue; // CR80 ±15%
      if (r.w < w * 0.22) continue;
      found.push(r);
    }
    // overlap dedupe + sort
    found.sort((a, b) => b.w * b.h - a.w * a.h);
    const picked = [];
    for (const r of found) {
      const dup = picked.some((p) => {
        const ix = Math.max(0, Math.min(p.x + p.w, r.x + r.w) - Math.max(p.x, r.x));
        const iy = Math.max(0, Math.min(p.y + p.h, r.y + r.h) - Math.max(p.y, r.y));
        return (ix * iy) / (r.w * r.h) > 0.5;
      });
      if (!dup) picked.push(r);
      if (picked.length >= 4) break;
    }
    if (picked.length) {
      // row-aware: एक ही कतार के cards (y फ़र्क < 30% ऊँचाई) में x से क्रम — warna e-Aadhaar का FRONT/BACK उल्टा हो जाता है
      picked.sort((a, b) => (Math.abs(a.y - b.y) < Math.min(a.h, b.h) * 0.3 ? a.x - b.x : a.y - b.y));
      return picked.map(toSrc);
    }

    // ── Stage B (fallback): पुराना edge-projection — सफ़ेद card सफ़ेद page जैसी हालत में ──
    return this._edges(d, w, h, aspect).map(toSrc);
  },

  _edges(d, w, h, aspect) {
    const g = new Float32Array(w * h);
    for (let i = 0, j = 0; i < d.length; i += 4, j++)
      g[j] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const edge = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const gx = -g[i - w - 1] - 2 * g[i - 1] - g[i + w - 1] + g[i - w + 1] + 2 * g[i + 1] + g[i + w + 1];
        const gy = -g[i - w - 1] - 2 * g[i - w] - g[i - w + 1] + g[i + w - 1] + 2 * g[i + w] + g[i + w + 1];
        edge[i] = Math.abs(gx) + Math.abs(gy);
      }
    const colP = new Float32Array(w), rowP = new Float32Array(h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) { colP[x] += edge[y * w + x]; rowP[y] += edge[y * w + x]; }
    function strongLines(P, n) {
      let mean = 0;
      for (let i = 0; i < n; i++) mean += P[i];
      mean /= n;
      let sd = 0;
      for (let i = 0; i < n; i++) sd += (P[i] - mean) * (P[i] - mean);
      sd = Math.sqrt(sd / n);
      const thr = mean + 1.2 * sd;
      const lines = [];
      for (let i = 1; i < n - 1; i++) {
        if (P[i] >= thr && P[i] >= P[i - 1] && P[i] >= P[i + 1]) {
          const near = lines.find((l) => Math.abs(l.p - i) <= 3);
          if (near) { if (P[i] > near.v) { near.p = i; near.v = P[i]; } }
          else lines.push({ p: i, v: P[i] });
        }
      }
      return lines.sort((a, b) => b.v - a.v).slice(0, 24);
    }
    const vLines = strongLines(colP, w);
    const hLines = strongLines(rowP, h);
    if (vLines.length < 2 || hLines.length < 2) return [];
    const rects = [];
    for (let a = 0; a < vLines.length; a++)
      for (let b = a + 1; b < vLines.length; b++) {
        const x1 = Math.min(vLines[a].p, vLines[b].p), x2 = Math.max(vLines[a].p, vLines[b].p);
        const W = x2 - x1;
        if (W < w * 0.25) continue;
        const vStr = Math.min(vLines[a].v, vLines[b].v);
        for (let c = 0; c < hLines.length; c++)
          for (let e = c + 1; e < hLines.length; e++) {
            const y1 = Math.min(hLines[c].p, hLines[e].p), y2 = Math.max(hLines[c].p, hLines[e].p);
            const H = y2 - y1;
            if (H < 8) continue;
            const ratio = W / H;
            if (Math.abs(ratio - aspect) / aspect > 0.1) continue;
            rects.push({ x: x1, y: y1, w: W, h: H, score: Math.min(vStr, Math.min(hLines[c].v, hLines[e].v)) });
          }
      }
    if (!rects.length) return [];
    let emax = 1;
    for (let i = 0; i < edge.length; i++) if (edge[i] > emax) emax = edge[i];
    const ethr = emax * 0.25;
    const sideScore = (x1, y1, x2, y2) => {
      const len = Math.max(1, Math.hypot(x2 - x1, y2 - y1));
      let hit = 0, n = 0;
      for (let t = 0; t <= 1; t += 1 / len) {
        const x = Math.round(x1 + (x2 - x1) * t), y = Math.round(y1 + (y2 - y1) * t);
        let best = 0;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
            if (edge[yy * w + xx] > best) best = edge[yy * w + xx];
          }
        if (best > ethr) hit++;
        n++;
      }
      return hit / n;
    };
    const checked = [];
    for (const r of rects) {
      const cont = Math.min(
        sideScore(r.x, r.y, r.x + r.w, r.y),
        sideScore(r.x + r.w, r.y, r.x + r.w, r.y + r.h),
        sideScore(r.x + r.w, r.y + r.h, r.x, r.y + r.h),
        sideScore(r.x, r.y + r.h, r.x, r.y)
      );
      if (cont >= 0.5 && r.w >= w * 0.3) checked.push(r);
    }
    if (!checked.length) return [];
    checked.sort((a, b) => b.score - a.score);
    const picked = [];
    for (const r of checked) {
      const dup = picked.some((p) => {
        const ix = Math.max(0, Math.min(p.x + p.w, r.x + r.w) - Math.max(p.x, r.x));
        const iy = Math.max(0, Math.min(p.y + p.h, r.y + r.h) - Math.max(p.y, r.y));
        return (ix * iy) / (r.w * r.h) > 0.6;
      });
      if (!dup) picked.push(r);
      if (picked.length >= 4) break;
    }
    picked.sort((a, b) => a.y - b.y || a.x - b.x);
    return picked;
  },
};
