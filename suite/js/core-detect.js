/* 🪚 Sanskriti Print Suite — Core 3c: Auto Card Detection (shared)
   Photo/PDF render में ID card अपने आप ढूंढो — कोई manual crop नहीं (Dev की demand: "upload karte hi automatic").
   तरीक़ा: grayscale → Sobel edges → row/column projection → CR80 aspect के rectangle pairs search।
   Fail-soft: card न मिले तो [] — caller manual crop box दिखाता है।
   Usage: SUITE_DETECT.cards(srcCanvas, aspect) → [{x,y,w,h}, ...] src px में (y क्रम से, max 4)
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

    // grayscale
    const g = new Float32Array(w * h);
    for (let i = 0, j = 0; i < d.length; i += 4, j++)
      g[j] = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

    // Sobel edge magnitude
    const edge = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const gx =
          -g[i - w - 1] - 2 * g[i - 1] - g[i + w - 1] +
          g[i - w + 1] + 2 * g[i + 1] + g[i + w + 1];
        const gy =
          -g[i - w - 1] - 2 * g[i - w] - g[i - w + 1] +
          g[i + w - 1] + 2 * g[i + w] + g[i + w + 1];
        edge[i] = Math.abs(gx) + Math.abs(gy);
      }
    }

    // projection profiles
    const colP = new Float32Array(w), rowP = new Float32Array(h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        colP[x] += edge[y * w + x];
        rowP[y] += edge[y * w + x];
      }

    // मज़बूत lines: profile > mean + 1.2*std, local maxima, 3px dedupe
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
    const vLines = strongLines(colP, w); // vertical edges (x)
    const hLines = strongLines(rowP, h); // horizontal edges (y)
    if (vLines.length < 2 || hLines.length < 2) return [];

    // rectangles: vertical pair × horizontal pair, aspect ≈ CR80 (±12%)
    const rects = [];
    for (let a = 0; a < vLines.length; a++) {
      for (let b = a + 1; b < vLines.length; b++) {
        const x1 = Math.min(vLines[a].p, vLines[b].p), x2 = Math.max(vLines[a].p, vLines[b].p);
        const W = x2 - x1;
        if (W < w * 0.25) continue; // card कम से कम 25% चौड़ा
        const vStr = Math.min(vLines[a].v, vLines[b].v);
        for (let c = 0; c < hLines.length; c++) {
          for (let e = c + 1; e < hLines.length; e++) {
            const y1 = Math.min(hLines[c].p, hLines[e].p), y2 = Math.max(hLines[c].p, hLines[e].p);
            const H = y2 - y1;
            if (H < 8) continue;
            const ratio = W / H;
            if (Math.abs(ratio - aspect) / aspect > 0.1) continue;
            const hStr = Math.min(hLines[c].v, hLines[e].v);
            rects.push({ x: x1, y: y1, w: W, h: H, score: Math.min(vStr, hStr) });
          }
        }
      }
    }
    if (!rects.length) return [];

    // border continuity: असली card की 4ों sides पर मज़बूत continuous edge होती है (false positive रोक)
    let emax = 1;
    for (let i = 0; i < edge.length; i++) if (edge[i] > emax) emax = edge[i];
    const ethr = emax * 0.25; // max edge का 25% — flat और noisy दोनों पर ठीक
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

    // best first, overlap हटाओ (60%+ overlap = duplicate), y क्रम से
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
    // src px में वापस + थोड़ा inset (border बाहर रहे)
    const inv = 1 / sc;
    const inset = 1.5 * inv;
    return picked.map((r) => ({
      x: Math.max(0, r.x * inv + inset),
      y: Math.max(0, r.y * inv + inset),
      w: Math.min(src.width, r.w * inv - 2 * inset),
      h: Math.min(src.height, r.h * inv - 2 * inset),
    }));
  },
};
