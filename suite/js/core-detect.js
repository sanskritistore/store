/* 🪚 Sanskriti Print Suite — Core 3c: Auto Card Detection v3 (shared)
   v3 सीख (Dev के असली Aadhaar से): cards सफ़ेद/हल्के tint वाले होते हैं, केंची-रेखा crop में घुस जाती है।
   Stage A (tinted card): bg से अलग रंग का ठोस block → tight → TRIM (अकेली dashed/केंची line काटो)।
   Stage B (सफ़ेद card सफ़ेद page): content-cluster grid → bbox → CR80 aspect-fit expansion।
   Sort: row-aware (एक कतार में बाएँ→दाएँ = FRONT→BACK)।
   Usage: SUITE_DETECT.cards(srcCanvas, aspect) → [{x,y,w,h}, ...] src px (max 4)
*/
window.SUITE_DETECT = {
  cards(src, aspect, depth) {
    aspect = aspect || 1.586; // CR80
    depth = depth || 0;
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
    const toSrc = (r) => ({
      x: Math.max(0, r.x * inv),
      y: Math.max(0, r.y * inv),
      w: Math.min(src.width - r.x * inv, r.w * inv),
      h: Math.min(src.height - r.y * inv, r.h * inv),
    });

    // bleed margin: कटरन लाइन के ठीक अंदर काटने से header/strip सट जाती है —
    // print bleed की तरह थोड़ी सफ़ेद किनारी छोड़ो (ऊपर/बाएँ/दाएँ 0.5% — असली काम snapTop/snapX करते हैं, नीचे 4%)
    const bleed = (r) => {
      const px = r.w * 0.005, pt = r.h * 0.005, pb = r.h * 0.04;
      const x = Math.max(0, r.x - px), y = Math.max(0, r.y - pt);
      return {
        x, y,
        w: Math.min(src.width - x, r.w + 2 * px),
        h: Math.min(src.height - y, r.h + pt + pb),
      };
    };

    // ── top-edge snap (Dev की सीख, 14 Oct): ऊपर की फालतू line (mini-panel का text / ऊपर वाले
    // card की मेरा आधार पट्टी) crop में कभी न आए — top को सबसे चौड़ी सफ़ेद गैप में रखो ──
    // dilated scan: pixel तभी सफ़ेद जब ±4px पड़ोस में भी ink न हो — ऐसे हल्की dashed
    // cut-lines / ✂ निशान "सफ़ेद gap" नहीं बन पाते (नई PDF की L805 sheet से सीख, 14 Oct)
    // row scan सिर्फ़ बीच के 60% हिस्से में: किनारों की vertical frame/cut lines हर row में
    // ink डालकर सारी gaps खा जाती हैं (synthetic frame test से पकड़ा, 14 Oct)
    const inkRowAt = (y, r) => {
      if (y < 0 || y >= h) return 1;
      let c = 0;
      const x0 = Math.max(0, Math.round(r.x + r.w * 0.2)), x1 = Math.min(w - 1, Math.round(r.x + r.w * 0.8));
      if (x1 <= x0) return 1;
      for (let x = x0; x <= x1; x++) {
        let ink = 0;
        for (let k = -4; k <= 4; k++) {
          const xx = x + k;
          if (xx >= 0 && xx < w && mask[y * w + xx]) { ink = 1; break; }
        }
        c += ink;
      }
      return c / (x1 - x0 + 1);
    };
    const inkColAt = (x, r) => {
      if (x < 0 || x >= w) return 1;
      let c = 0;
      const y0 = Math.max(0, Math.round(r.y + r.h * 0.2)), y1 = Math.min(h - 1, Math.round(r.y + r.h * 0.8));
      if (y1 <= y0) return 1;
      for (let y = y0; y <= y1; y++) {
        let ink = 0;
        for (let k = -4; k <= 4; k++) {
          const yy = y + k;
          if (yy >= 0 && yy < h && mask[yy * w + x]) { ink = 1; break; }
        }
        c += ink;
      }
      return c / (y1 - y0 + 1);
    };
    const widestGap = (vals, thr, gapMin) => {
      let best = null, gs = -1;
      for (let i = 0; i <= vals.length; i++) {
        const white = i < vals.length && vals[i] < thr;
        if (white && gs < 0) gs = i;
        if (!white && gs >= 0) {
          const gw = i - gs;
          if (gw >= gapMin && (!best || gw > best.w)) best = { s: gs, e: i - 1, w: gw };
          gs = -1;
        }
      }
      return best;
    };
    const snapTop = (r) => {
      const y0 = Math.max(0, Math.round(r.y));
      const winUp = Math.round(r.h * 0.10), winDown = Math.round(r.h * 0.09);
      const thr = 0.008; // 0.8% ink = content row
      const gapMin = Math.max(3, Math.round(r.h * 0.02));
      const s = Math.max(0, y0 - winUp), e = Math.min(h - 1, y0 + winDown);
      let best = null, y = s;
      while (y <= e) {
        if (inkRowAt(y, r) < thr) {
          const gs = y;
          while (y <= e && inkRowAt(y, r) < thr) y++;
          const gw = y - gs;
          if (gw >= gapMin) {
            const center = (gs + y - 1) / 2;
            const score = gw * 1000 - Math.abs(center - y0); // सबसे चौड़ी gap; बराबर हो तो y0 के करीब
            if (!best || score > best.score) best = { gs, ge: y - 1, score };
          }
        } else y++;
      }
      if (!best) { return r; }
      const gapH = best.ge - best.gs + 1;
      const margin = Math.min(Math.round(gapH * 0.75), Math.round(r.h * 0.04)); // gap के निचले हिस्से को header के ऊपर margin छोड़ो
      const top = Math.max(0, best.ge - margin);
      const dy = y0 - top; // + = ऊपर बढ़ा, − = नीचे समेटा (junk अंदर था)
      if (Math.abs(dy) < 2) return r;
      return { ...r, y: top, h: Math.max(8, r.h + dy) };
    };

    // ── side-edge snap: बाएँ/दाएँ किनारे भी widest सफ़ेद gap में रखो — काली frame lines,
    // dashed cut-guides, ✂ निशान crop से बाहर रहें (Dev की नई PDF से सीख, 14 Oct) ──
    const snapX = (r) => {
      const thr = 0.008;
      const gapMin = Math.max(3, Math.round(r.w * 0.015));
      let rx = Math.round(r.x), rw = Math.round(r.w);
      const base = { y: r.y, h: r.h };
      // LEFT: junk बाहर (बाईं ओर), content अंदर — edge = gap के दाहिने छोर से margin पीछे
      {
        const wOut = Math.round(rw * 0.04), wIn = Math.round(rw * 0.06);
        const x0 = Math.max(0, rx - wOut), x1 = Math.min(w - 1, rx + wIn);
        if (x1 > x0) {
          const vals = [];
          for (let xx = x0; xx <= x1; xx++) vals.push(inkColAt(xx, base));
          const g = widestGap(vals, thr, gapMin);
          if (g) {
            const mg = Math.min(Math.round(g.w * 0.75), Math.round(rw * 0.025));
            const nx = x0 + g.e - mg;
            const dx = rx - nx;
            if (Math.abs(dx) >= 2) { rx = nx; rw += dx; }
          }
        }
      }
      // RIGHT: junk बाहर (दाईं ओर) — edge = gap के बाएँ छोर से margin आगे
      {
        const wOut = Math.round(rw * 0.04), wIn = Math.round(rw * 0.06);
        const x0 = Math.max(0, rx + rw - wIn), x1 = Math.min(w - 1, rx + rw + wOut);
        if (x1 > x0) {
          const vals = [];
          for (let xx = x0; xx <= x1; xx++) vals.push(inkColAt(xx, base));
          const g = widestGap(vals, thr, gapMin);
          if (g) {
            const mg = Math.min(Math.round(g.w * 0.75), Math.round(rw * 0.025));
            const nr = x0 + g.s + mg;
            const dx = rx + rw - nr;
            if (Math.abs(dx) >= 2) rw = nr - rx;
          }
        }
      }
      return { ...r, x: rx, w: Math.max(8, rw) };
    };

    // ── bg रंग: border ring median ──
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

    // ── mask: bg से अलग pixels ──
    const THR2 = 28 * 28 * 3; // 14²×3 से बढ़ाया: e-Aadhaar का हल्का नीला page-tint (diff ~1500) content न बने
    const mask = new Uint8Array(w * h);
    for (let i = 0, j = 0; i < d.length; i += 4, j++) {
      const dr = d[i] - bg[0], dg = d[i + 1] - bg[1], db = d[i + 2] - bg[2];
      mask[j] = dr * dr + dg * dg + db * db > THR2 ? 1 : 0;
    }
    // ── page-within-photo? (photo में सफ़ेद page, चारों ओर अलग रंग) — page काटकर recursion ──
    if (!depth) {
      const rf0 = new Float32Array(h), cf0 = new Float32Array(w);
      for (let y = 0; y < h; y++) { let c = 0; for (let x = 0; x < w; x++) c += mask[y * w + x]; rf0[y] = c / w; }
      for (let x = 0; x < w; x++) { let c = 0; for (let y = 0; y < h; y++) c += mask[y * w + x]; cf0[x] = c / h; }
      let py1 = -1, py2 = -1;
      for (let y = 0; y < h; y++) if (rf0[y] > 0.5) { if (py1 < 0) py1 = y; py2 = y; }
      let px1 = -1, px2 = -1;
      if (py1 >= 0) { // cols को सिर्फ़ band rows के अंदर नापो — पतली पट्टी (band) भी पकड़ में आए
        const bandH = py2 - py1 + 1;
        for (let x = 0; x < w; x++) {
          let c = 0;
          for (let y = py1; y <= py2; y++) c += mask[y * w + x];
          if (c / bandH > 0.5) { if (px1 < 0) px1 = x; px2 = x; }
        }
      }
      if (py1 >= 0 && px1 >= 0) {
        const pw = px2 - px1 + 1, ph = py2 - py1 + 1;
        if (pw * ph > 0.10 * w * h && (pw < w * 0.96 || ph < h * 0.96)) {
          // page bbox → src से काटकर दोबारा detect (एक ही बार)
          const inv0 = 1 / sc;
          // 1.5% OUTSET — block के बाहर की सफ़ेद margin साथ रखो: border-ring शुद्ध paper रहे (bg रंग सही)
          // और content की border lines कटे नहीं (inset card की किनारी line काट देता था!)
          const mx0 = w * 0.015, my0 = h * 0.015;
          const sx = Math.max(0, Math.round((px1 - mx0) * inv0)), sy = Math.max(0, Math.round((py1 - my0) * inv0));
          const ex = Math.min(w, Math.round(px2 + mx0)), ey = Math.min(h, Math.round(py2 + my0));
          const sw = Math.min(src.width - sx, Math.round((ex - px1 + 1) * inv0)), sh = Math.min(src.height - sy, Math.round((ey - py1 + 1) * inv0));
          const sub = document.createElement("canvas");
          sub.width = sw; sub.height = sh;
          sub.getContext("2d").drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh);
          const inner = this.cards(sub, aspect, 1);
          if (inner.length) return inner.map((r) => ({ x: r.x + sx, y: r.y + sy, w: r.w, h: r.h }));
          // inner खाली → पूरी image पर आगे बढ़ो (desk photo जैसे छोटे block पर वापसी)
        }
      }
    }

    const rowFill = new Float32Array(h);
    for (let y = 0; y < h; y++) {
      let c = 0;
      for (let x = 0; x < w; x++) c += mask[y * w + x];
      rowFill[y] = c / w;
    }

    // ── TRIM: किनारों से अंदर चलो — खाली rows/cols + "अकेली line" (dashed केंची-रेखा: खुद भरी पर पड़ोस खाली) काटो ──
    const trimRect = (r) => {
      let x = r.x, y = r.y, rw = r.w, rh = r.h;
      const rowF = (yy) => { if (yy < 0 || yy >= h) return 0; let c = 0; for (let xx = x; xx < x + rw; xx++) c += mask[yy * w + xx]; return c / Math.max(1, rw); };
      const colF = (xx) => { if (xx < 0 || xx >= w) return 0; let c = 0; for (let yy = y; yy < y + rh; yy++) c += mask[yy * w + xx]; return c / Math.max(1, rh); };
      const sparseRow = (yy) => { const f = rowF(yy); const nb = (rowF(yy - 2) + rowF(yy - 1) + rowF(yy + 1) + rowF(yy + 2)) / 4; return f < 0.12 || (f < 0.7 && nb < 0.1); };
      const maxTrimY = Math.floor(rh * 0.2), maxTrimX = Math.floor(rw * 0.2);
      let n = 0;
      while (rh > 14 && n < maxTrimY && sparseRow(y)) { y++; rh--; n++; }
      n = 0;
      while (rh > 14 && n < maxTrimY && sparseRow(y + rh - 1)) { rh--; n++; }
      // left/right: सिर्फ़ लगभग-खाली columns (अकेली-line नियम नहीं — card के किनारे की लाल पट्टी बचे)
      const sparseCol = (xx) => colF(xx) < 0.06;
      n = 0;
      while (rw > 14 && n < maxTrimX && sparseCol(x)) { x++; rw--; n++; }
      n = 0;
      while (rw > 14 && n < maxTrimX && sparseCol(x + rw - 1)) { rw--; n++; }
      return { x, y, w: rw, h: rh };
    };

    const aspectOk = (rw, rh, tol) => Math.abs(rw / rh - aspect) / aspect <= tol;
    const dedupeSort = (found) => {
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
      picked.sort((a, b) => (Math.abs(a.y - b.y) < Math.min(a.h, b.h) * 0.3 ? a.x - b.x : a.y - b.y));
      return picked.map((r) => bleed(toSrc(snapX(snapTop(r)))));
    };

    // ═══ dashed cut-guides mask से हटाओ (अकेली भरी row/col, पड़ोस खाली) ═══
    const colFillAll = new Float32Array(w);
    for (let x = 0; x < w; x++) {
      let c = 0;
      for (let y = 0; y < h; y++) c += mask[y * w + x];
      colFillAll[x] = c / h;
    }
    // dashed line = भरी पर पड़ोस खाली + run पतला (≤4 rows/cols); मोटी bands सुरक्षित
    const isoLine = (arr, i2) => arr[i2] > 0.15 && arr[i2] < 0.8 && ((arr[i2 - 2] || 0) + (arr[i2 - 1] || 0) + (arr[i2 + 1] || 0) + (arr[i2 + 2] || 0)) / 4 < 0.1;
    const thinRun = (arr, i2) => {
      let run = 1;
      for (let k = i2 - 1; k > i2 - 5 && k >= 0 && arr[k] > 0.1; k--) run++;
      for (let k = i2 + 1; k < i2 + 5 && k < arr.length && arr[k] > 0.1; k++) run++;
      return run <= 4;
    };
    const badRow = new Uint8Array(h), badCol = new Uint8Array(w);
    for (let y = 2; y < h - 2; y++) if (isoLine(rowFill, y) && thinRun(rowFill, y)) badRow[y] = 1;
    for (let x = 2; x < w - 2; x++) if (isoLine(colFillAll, x) && thinRun(colFillAll, x)) badCol[x] = 1;
    const mask2 = new Uint8Array(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) mask2[y * w + x] = mask[y * w + x] && !badRow[y] && !badCol[x] ? 1 : 0;

    // ═══ Stage A: tinted card — ठोस color bands ═══
    const stageA = () => {
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
    const tight = (r) => {
      const cf = (xx) => { let c = 0; for (let yy = r.y; yy < r.y + r.h; yy++) c += mask[yy * w + xx]; return c / r.h; };
      const rf = (yy) => { let c = 0; for (let xx = r.x; xx < r.x + r.w; xx++) c += mask[yy * w + xx]; return c / r.w; };
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
    const foundA = [];
    for (const b of blocks) {
      let r = tight(b);
      r = trimRect(r); // ✂️ केंची-रेखा बाहर!
      if (r.w < w * 0.22) continue;
      if (!aspectOk(r.w, r.h, 0.15)) continue;
      foundA.push(r);
    }
    return dedupeSort(foundA);
    };

    // ═══ Stage B: सफ़ेद card — mask2 projection (dashed lines पहले से गायब) ═══
    const stageB = () => {
      const rf = new Float32Array(h);
      for (let y = 0; y < h; y++) {
        let c = 0;
        for (let x = 0; x < w; x++) c += mask2[y * w + x];
        rf[y] = c / w;
      }
      const bands = [];
      let s2 = -1, gap = 0;
      for (let y = 0; y <= h; y++) {
        const solid = y < h && rf[y] > 0.14;
        if (solid) { if (s2 < 0) s2 = y; gap = 0; }
        else if (s2 >= 0 && ++gap > 12) {
          if (y - gap - s2 >= 20) bands.push([s2, y - gap - 1]);
          s2 = -1;
        }
      }
      const found = [];
      for (const [y1, y2] of bands) {
        const cf = new Float32Array(w);
        for (let x = 0; x < w; x++) {
          let c = 0;
          for (let y = y1; y <= y2; y++) c += mask2[y * w + x];
          cf[x] = c / (y2 - y1 + 1);
        }
        let sx = -1, gx = 0;
        for (let x = 0; x <= w; x++) {
          const solid = x < w && cf[x] > 0.05;
          if (solid) { if (sx < 0) sx = x; gx = 0; }
          else if (sx >= 0 && ++gx > 4) {
            const bw2 = x - gx - sx;
            if (bw2 >= w * 0.2) found.push({ x: sx, y: y1, w: bw2, h: y2 - y1 + 1 });
            sx = -1;
          }
        }
      }
      // जोड़ी-भरोसा: strict aspect में 2 न बने, पर 2+ blocks का aspect एक-जैसा हो (screenshot में दबी file) → ढीली सीमा
      let pool = found, relaxed = false;
      if (found.filter((r) => aspectOk(r.w, r.h, 0.2)).length < 2 && found.length >= 2) {
        const sim = found.filter((r, i) => found.some((q, j) => i !== j && Math.abs(r.w / r.h - q.w / q.h) / (q.w / q.h) < 0.08));
        if (sim.length >= 2) { pool = sim; relaxed = true; }
      }
      const out = [];
      for (let r of pool) {
        if (relaxed) { const a2 = r.w / r.h; if (a2 < 1.2 || a2 > 2.4) continue; }
        else if (!aspectOk(r.w, r.h, 0.2)) continue;
        // density guard: असली card घना होता है (≥25% content); बिखरी photo/blobs नहीं
        let dense = 0;
        for (let yy = r.y; yy < r.y + r.h; yy++)
          for (let xx = r.x; xx < r.x + r.w; xx++) dense += mask2[yy * w + xx];
        if (dense / (r.w * r.h) < 0.18) continue;
        if (r.w < w * 0.2 || r.h < h * 0.08) continue; // card इतना छोटा नहीं होता (baby-blob guard)
        // content bbox → CR80 aspect-fit (card margins वापस जोड़ो)
        let { x, y, w: rw, h: rh } = r;
        const cur = rw / rh;
        if (cur < aspect) {
          const nh = rw / aspect;
          y = Math.max(0, Math.round(y + rh / 2 - nh / 2));
          rh = Math.round(nh);
        } else {
          const nw = rh * aspect;
          x = Math.max(0, Math.round(x + rw / 2 - nw / 2));
          rw = Math.round(nw);
        }
        if (y + rh > h) rh = h - y;
        if (x + rw > w) rw = w - x;
        out.push({ x, y, w: rw, h: rh });
      }
      return dedupeSort(out);
    };

    // ═══ Stage C: कट-रेखा grid — dashed केंची-रेखाएँ (gray) ही card सीमा; cards page के नीचे ═══
    const stageC = () => {
      // gray mask: dashed रेखा/काली text (R≈G≈B, हल्का-से-गहरा); tint/रंगीन strips बाहर
      const gray = new Uint8Array(w * h); // line mask: paper/tint के अलावा सब (dashes, borders, pen निशान)
      const dark = new Uint8Array(w * h);
      for (let i = 0, j = 0; i < d.length; i += 4, j++) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        const lu = r * 0.299 + g * 0.587 + b * 0.114;
        gray[j] = lu < 205 ? 1 : 0;
        dark[j] = lu < 165 ? 1 : 0;
      }
      const rf = new Float32Array(h);
      for (let y = 0; y < h; y++) { let c = 0; for (let x = 0; x < w; x++) c += gray[y * w + x]; rf[y] = c / w; }
      // inner span: letter के काले border (5%/95%) को न छुएँ — अंदर के 6..94% में फैलाव
      const ix1 = Math.round(w * 0.06), ix2 = Math.round(w * 0.94);
      const rowSpan = (y) => {
        let mn = -1, mx = -1;
        for (let x = ix1; x < ix2; x++) if (gray[y * w + x]) { if (mn < 0) mn = x; mx = x; }
        return mn < 0 ? 0 : (mx - mn) / (ix2 - ix1);
      };
      const spikes = [];
      for (let y = 3; y < h - 3; y++) {
        const f = rf[y];
        if (f < 0.3) continue;
        const ctxA = (rf[y - 3] + rf[y - 2] + rf[y + 2] + rf[y + 3]) / 4;
        if (f > ctxA * 1.8 + 0.08 && rowSpan(y) >= 0.7) spikes.push(y);
      }
      // band-edge rows: मोटी पट्टी की सीमा (fill एक तरफ़ ठोस, दूसरी तरफ़ खाली) — spike ratio इन्हें चूक जाता है
      for (let y = 4; y < h - 4; y++) {
        const up = (rf[y - 3] + rf[y - 2]) / 2, dn = (rf[y + 2] + rf[y + 3]) / 2;
        const f = rf[y];
        if (f >= 0.4 && rowSpan(y) >= 0.7 && (up < 0.16 || dn < 0.16) && Math.max(f - up, f - dn) > 0.28) spikes.push(y);
      }
      spikes.sort((a, b) => a - b);
      const hlines = [];
      for (const y of spikes) {
        const last = hlines[hlines.length - 1];
        if (last && y - last[last.length - 1] <= 3) last.push(y);
        else hlines.push([y]);
      }
      const hYs = hlines.map((g) => Math.round(g.reduce((a, b) => a + b) / g.length));
      // pairs: cards नीचे → y1 > 40%h, y2 > 55%h; नीचे वाली जोड़ी पहले
      const pairs = [];
      for (let a = 0; a < hYs.length; a++)
        for (let b = a + 1; b < hYs.length; b++) {
          const bh2 = hYs[b] - hYs[a];
          if (bh2 < h * 0.06 || bh2 > h * 0.35) continue; // card पट्टी की ऊँचाई (A4 पर ~18%, छोटी file में ज़्यादा)
          pairs.push([hYs[a], hYs[b]]);
        }
      pairs.sort((p, q) => q[1] - p[1]);
      let solo = null; const cands = [];
      for (const [y1, y2] of pairs) {
        const bh2 = y2 - y1;
        const cf = new Float32Array(w);
        for (let x = 0; x < w; x++) { let c = 0; for (let y = y1; y <= y2; y++) c += gray[y * w + x]; cf[x] = c / bh2; }
        const vsp = [];
        for (let x = 3; x < w - 3; x++) {
          const f = cf[x];
          if (f < 0.2) continue;
          const ctxA = (cf[x - 3] + cf[x - 2] + cf[x + 2] + cf[x + 3]) / 4;
          if (f > ctxA * 1.7 + 0.05) vsp.push(x);
        }
        const vgroups = [];
        for (const x of vsp) {
          const last = vgroups[vgroups.length - 1];
          if (last && x - last[last.length - 1] <= 3) last.push(x);
          else vgroups.push([x]);
        }
        const vXs = vgroups.map((g) => Math.round(g.reduce((a2, b2) => a2 + b2) / g.length));
        // content किनारे (dark mask से — photo/text सब गिनो)
        let cL = -1, cR = -1;
        for (let x = 0; x < w; x++) {
          let c = 0;
          for (let y = y1; y <= y2; y++) c += dark[y * w + x];
          if (c / bh2 > 0.03) { if (cL < 0) cL = x; cR = x; }
        }
        if (cL < 0) continue;
        const bounds = [cL];
        for (const vx of vXs) if (vx > cL + w * 0.1 && vx < cR - w * 0.1) bounds.push(vx);
        bounds.push(cR);
        // घुमावदार strips/rotated-text spikes card को टुकड़ों में काट देती हैं।
        // छोटे (<18%) टुकड़े = strips। नियम: टुकड़ा तभी बड़े cell में मिलाओ जब उसका aspect
        // card-range [1.2,2.4] से बाहर हो और मिलाने से ठीक हो (strip card के अंदर है);
        // वरना टुकड़े को separator मानकर छोड़ दो (strip दो cards के बीच है)।
        const rawCells = [];
        for (let v = 0; v < bounds.length - 1; v++) rawCells.push([bounds[v], bounds[v + 1]]);
        const isBig = (c) => c[1] - c[0] >= w * 0.18;
        const bigs = rawCells.filter(isBig);
        for (const bc of bigs) {
          const aspOf = (c) => (c[1] - c[0]) / bh2;
          let guard = 0;
          while ((aspOf(bc) < 1.2 || aspOf(bc) > 2.4) && guard++ < 8) {
            const i = rawCells.indexOf(bc);
            const L = i > 0 && !isBig(rawCells[i - 1]) ? rawCells[i - 1] : null;
            const R = i < rawCells.length - 1 && !isBig(rawCells[i + 1]) ? rawCells[i + 1] : null;
            if (!L && !R) break;
            const aL = L ? Math.abs(aspOf([L[0], bc[1]]) - 1.586) : 99;
            const aR = R ? Math.abs(aspOf([bc[0], R[1]]) - 1.586) : 99;
            if (aL <= aR && L) { bc[0] = L[0]; rawCells.splice(i - 1, 1); }
            else if (R) { bc[1] = R[1]; rawCells.splice(i + 1, 1); }
            else break;
          }
        }
        // बचे छोटे टुकड़े separators — bounds = bigs के किनारे
        bounds.length = 0;
        bigs.sort((p, q) => p[0] - q[0]);
        for (const bc of bigs) { if (!bounds.length) bounds.push(bc[0]); bounds.push(bc[1]); }
        const rects = [];
        const loose = [];
        for (let v = 0; v < bounds.length - 1; v++) {
          const x1 = bounds[v], x2 = bounds[v + 1];
          const rw = x2 - x1;
          let dense = 0;
          for (let yy = y1; yy <= y2; yy++) for (let xx = x1; xx < x2; xx++) dense += dark[yy * w + xx];
          if (rw < w * 0.2) continue;
          const asp = rw / bh2;
          if (asp < 1.2 || asp > 2.4) continue;
          const dn = dense / (rw * bh2);
          if (dn >= 0.18) rects.push({ x: x1, y: y1, w: rw, h: bh2 });
          else if (dn >= 0.06) loose.push({ x: x1, y: y1, w: rw, h: bh2 }); // photo वाला front card: हल्की photo-bg → कम density
        }
        const all = rects.concat(loose).sort((p, q) => p.x - q.x);
        if (all.length >= 2) { // असली card-जोड़ी: दोनों का aspect लगभग बराबर — photo वाला हल्का card भी चले
          const a0 = all[0].w / all[0].h, a1 = all[1].w / all[1].h;
          if (Math.abs(a0 - a1) / a1 <= 0.1) {
            // असली cards पेज के सबसे नीचे होते हैं → पहली कसौटी = सबसे बड़ा y2;
            // बराबर y2 पर aspect CR80 (≈1.586) के करीब वाली पट्टी (ढीली/कसी हुई हार जाए)
            const score = (Math.abs(a0 - 1.586) + Math.abs(a1 - 1.586)) / 2;
            cands.push({ y2, score, cells: all });
          }
        }
        if (rects.length === 1 && !solo) solo = rects; // PAN जैसी अकेली-card letter के लिए fallback
      }
      if (cands.length) {
        cands.sort((p, q) => q.y2 - p.y2 || p.score - q.score);
        return dedupeSort(cands[0].cells);
      }
      return solo || [];
    };

    // Stage D: निचले हिस्से में लंबी continuous vertical borders (card के solid किनारे) से aligned जोड़ी
    const stageD = () => {
      const y0 = Math.round(h * 0.5), y1m = Math.round(h * 0.97);
      const zh = y1m - y0;
      // हर col का सबसे लंबा continuous mask-run (border = लंबा, text strokes = छोटे)
      const vcols = [];
      for (let x = 1; x < w - 1; x++) {
        let best = 0, run = 0;
        for (let y = y0; y < y1m; y++) {
          if (mask[y * w + x]) { run++; if (run > best) best = run; }
          else run = 0;
        }
        if (best >= zh * 0.28) vcols.push(x);
      }
      // group करो (≤4px)
      const vg = [];
      for (const x of vcols) {
        const last = vg[vg.length - 1];
        if (last && x - last[last.length - 1] <= 4) last.push(x);
        else vg.push([x]);
      }
      const vX = vg.map((g) => Math.round(g.reduce((a, b) => a + b) / g.length));
      if (vX.length < 4) return [];
      // आस-पास की border-jोड़ी = card candidates
      const cands = [];
      for (let i = 0; i + 1 < vX.length; i++) {
        const x1 = vX[i], x2 = vX[i + 1];
        const cw = x2 - x1;
        if (cw < w * 0.2 || cw > w * 0.7) continue;
        // row-extent: box के अंदर content rows
        let ry1 = -1, ry2 = -1, dens = 0;
        for (let y = y0; y < y1m; y++) {
          let c = 0;
          for (let x = x1 + 1; x < x2; x++) c += mask[y * w + x];
          dens += c;
          if (c / cw > 0.2) { if (ry1 < 0) ry1 = y; ry2 = y; }
        }
        if (ry1 < 0) continue;
        const ch = ry2 - ry1 + 1;
        const asp = cw / ch;
        if (asp < 1.15 || asp > 2.5) continue;
        if (dens / (cw * zh) < 0.1) continue;
        cands.push({ x: x1, y: ry1, w: cw, h: ch, asp });
      }
      for (let i = 0; i < cands.length; i++) {
        for (let j = i + 1; j < cands.length; j++) {
          const A = cands[i], B = cands[j];
          const ov = Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y);
          if (ov < Math.min(A.h, B.h) * 0.6) continue;
          if (Math.abs(A.h - B.h) / B.h > 0.18) continue;
          if (Math.abs(A.asp - B.asp) / B.asp > 0.15) continue;
          return dedupeSort([{ x: A.x, y: A.y, w: A.w, h: A.h }, { x: B.x, y: B.y, w: B.w, h: B.h }]);
        }
      }
      return [];
    };

    const rA = stageA();
    if (rA.length >= 2) { return rA; } // tinted cards पर A भरोसेमंद
    const rC = stageC();
    if (rC.length >= 2) { return rC; } // कट-रेखा grid (e-Aadhaar letter)
    const rB = stageB();
    const rD = stageD();
    if (rD.length >= 2) { return rD; } // नीचे aligned जोड़ी = पक्की letter पहचान
    let best = rA;
    if (rC.length > best.length) best = rC;
    if (rB.length > best.length) best = rB;
    return best;
  },
};
