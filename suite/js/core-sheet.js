/**
 * C3 — Print Sheet Engine
 * Ek bade sheet (4x6, A4, 12 inch roll) par kitni photos aayengi, kahan kahan —
 * sab auto-calculate. per_sheet kabhi hardcode nahi.
 */
(function () {
  const SHEET = {
    /**
     * Grid layout nikalo.
     * @returns {positions: [{x,y}...], count, cols, rows} — sab px me
     */
    layout(photoW, photoH, sheetW, sheetH, gap, margin) {
      gap = gap || 0; margin = margin || 0;
      const usableW = sheetW - 2 * margin;
      const usableH = sheetH - 2 * margin;
      const cols = Math.max(1, Math.floor((usableW + gap) / (photoW + gap)));
      const rows = Math.max(1, Math.floor((usableH + gap) / (photoH + gap)));
      const gridW = cols * photoW + (cols - 1) * gap;
      const gridH = rows * photoH + (rows - 1) * gap;
      const startX = Math.round((sheetW - gridW) / 2);
      const startY = Math.round((sheetH - gridH) / 2);
      const positions = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          positions.push({ x: startX + c * (photoW + gap), y: startY + r * (photoH + gap) });
        }
      }
      return { positions, count: positions.length, cols, rows };
    },

    /**
     * 300 DPI print sheet banao.
     * @param img — tayaar photo (Image/Canvas), exact photoW×photoH px
     * @returns canvas (sheet size, 300 DPI) + count
     */
    render(img, photoW, photoH, sheet, dpi, SUITE) {
      const sheetW = SUITE.mmToPx(sheet.w_mm, dpi);
      const sheetH = SUITE.mmToPx(sheet.h_mm, dpi);
      const gap = SUITE.mmToPx(sheet.gap_mm || 0, dpi);
      const margin = SUITE.mmToPx(sheet.margin_mm || 0, dpi);
      const lay = SHEET.layout(photoW, photoH, sheetW, sheetH, gap, margin);
      const cv = document.createElement("canvas");
      cv.width = sheetW; cv.height = sheetH;
      const ctx = cv.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, sheetW, sheetH);
      for (const p of lay.positions) {
        ctx.drawImage(img, p.x, p.y, photoW, photoH);
        // cutting guide — halke grey corners (print me cut aasaan)
        ctx.strokeStyle = "rgba(0,0,0,0.25)";
        ctx.lineWidth = Math.max(1, Math.round(dpi / 300));
        ctx.strokeRect(p.x + 0.5, p.y + 0.5, photoW - 1, photoH - 1);
      }
      return { canvas: cv, count: lay.count, cols: lay.cols, rows: lay.rows };
    },
  };

  window.SUITE_SHEET = SHEET;
})();
