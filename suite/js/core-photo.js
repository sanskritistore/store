/**
 * C2 — Photo Pipeline (client-side; photos KABHI server par nahi jaati)
 * upload -> trim -> enhance -> crop -> export 300 DPI / KB compress
 */
(function () {
  const PHOTO = {
    /** File se Image banao (EXIF rotation ke saath — createImageBitmap sambhalta hai) */
    async load(file) {
      if (!file || !/^image\//.test(file.type)) throw new Error("सिर्फ़ photo file डालें (JPG/PNG)");
      if (file.size > 25 * 1024 * 1024) throw new Error("Photo बहुत बड़ी है (25MB से कम रखें)");
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      const cv = document.createElement("canvas");
      cv.width = bmp.width; cv.height = bmp.height;
      cv.getContext("2d").drawImage(bmp, 0, 0);
      bmp.close();
      return cv; // canvas me — aage sab canvas par
    },

    /** Scan/photo ke safed kinare auto-kaato */
    trimMargins(cv, threshold) {
      threshold = threshold || 245;
      const ctx = cv.getContext("2d");
      const { width: w, height: h } = cv;
      const d = ctx.getImageData(0, 0, w, h).data;
      let top = 0, bottom = h, left = 0, right = w;
      const isWhite = (x, y) => {
        const i = (y * w + x) * 4;
        return d[i] > threshold && d[i + 1] > threshold && d[i + 2] > threshold;
      };
      outerTop: for (let y = 0; y < h; y++) { for (let x = 0; x < w; x += 4) if (!isWhite(x, y)) { top = y; break outerTop; } }
      outerBottom: for (let y = h - 1; y > top; y--) { for (let x = 0; x < w; x += 4) if (!isWhite(x, y)) { bottom = y + 1; break outerBottom; } }
      outerLeft: for (let x = 0; x < w; x++) { for (let y = top; y < bottom; y += 4) if (!isWhite(x, y)) { left = x; break outerLeft; } }
      outerRight: for (let x = w - 1; x > left; x--) { for (let y = top; y < bottom; y += 4) if (!isWhite(x, y)) { right = x + 1; break outerRight; } }
      if (right - left < 50 || bottom - top < 50) return cv; // kuch gadbad — mat kaato
      const out = document.createElement("canvas");
      out.width = right - left; out.height = bottom - top;
      out.getContext("2d").drawImage(cv, left, top, out.width, out.height, 0, 0, out.width, out.height);
      return out;
    },

    /** Auto enhance: halka contrast + brightness normalize (natural look) */
    autoEnhance(cv) {
      const ctx = cv.getContext("2d");
      const img = ctx.getImageData(0, 0, cv.width, cv.height);
      const d = img.data;
      let min = 255, max = 0;
      for (let i = 0; i < d.length; i += 16) {
        const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        if (lum < min) min = lum;
        if (lum > max) max = lum;
      }
      if (max - min < 40) return cv; // already theek
      const range = max - min;
      const lo = Math.min(min + range * 0.04, 250), hi = Math.max(max - range * 0.04, lo + 10);
      const scale = 255 / (hi - lo);
      for (let i = 0; i < d.length; i += 4) {
        for (let c = 0; c < 3; c++) {
          let v = (d[i + c] - lo) * scale;
          d[i + c] = v < 0 ? 0 : v > 255 ? 255 : v;
        }
      }
      ctx.putImageData(img, 0, 0);
      return cv;
    },

    /**
     * Exact px size me crop+resize (face guide ke hisaab se user ne jo select kiya)
     * sel = {x,y,w,h} source canvas par
     */
    cropTo(cv, sel, outW, outH) {
      const out = document.createElement("canvas");
      out.width = outW; out.height = outH;
      const ctx = out.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(cv, sel.x, sel.y, sel.w, sel.h, 0, 0, outW, outH);
      return out;
    },

    /** KB limit ke andar JPEG (exam forms ke liye) — quality binary search */
    async compressToKB(cv, minKB, maxKB) {
      const toBlob = (q) => new Promise((res) => cv.toBlob(res, "image/jpeg", q));
      let lo = 0.3, hi = 0.95, best = null;
      for (let i = 0; i < 8; i++) {
        const q = (lo + hi) / 2;
        const b = await toBlob(q);
        const kb = b.size / 1024;
        if (kb >= minKB && kb <= maxKB) { best = b; break; }
        if (kb > maxKB) hi = q; else lo = q;
        best = b;
      }
      return best; // Blob
    },

    /** Download helper */
    download(blob, filename) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    },
  };

  window.SUITE_PHOTO = PHOTO;
})();
