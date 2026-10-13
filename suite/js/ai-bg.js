/**
 * AI Background Removal — lazy load, fail-soft.
 * Model grahak ke browser me hi chalta hai (photo server par KABHI nahi jaati).
 * Pehli baar ~30MB model download hota hai — net chahiye; baad me browser cache.
 */
(function () {
  const CDN = "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm";
  let modPromise = null;

  window.SUITE_BG = {
    /** Model load karo (ek hi baar). Fail -> null (UI soft message dikhaye). */
    async ensure(onProgress) {
      if (!modPromise) {
        modPromise = import(/* @vite-ignore */ CDN).catch((e) => {
          console.error("[SUITE_BG] load fail", e);
          return null;
        });
      }
      return modPromise;
    },

    /**
     * canvas ka background hatao -> naya canvas (transparent PNG)
     */
    async remove(cv) {
      const mod = await this.ensure();
      if (!mod || !mod.removeBackground) throw new Error("AI model अभी load नहीं हो पाया");
      const blob = await new Promise((r) => cv.toBlob(r, "image/png"));
      const out = await mod.removeBackground(blob);
      const bmp = await createImageBitmap(out);
      const out2 = document.createElement("canvas");
      out2.width = bmp.width; out2.height = bmp.height;
      out2.getContext("2d").drawImage(bmp, 0, 0);
      bmp.close();
      return out2;
    },

    /** transparent canvas ko bg color par bithao */
    flatten(cv, hex) {
      const out = document.createElement("canvas");
      out.width = cv.width; out.height = cv.height;
      const ctx = out.getContext("2d");
      ctx.fillStyle = hex || "#ffffff";
      ctx.fillRect(0, 0, out.width, out.height);
      ctx.drawImage(cv, 0, 0);
      return out;
    },
  };
})();
