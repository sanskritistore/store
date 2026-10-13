/**
 * C1 — Config Engine (Print Suite ki neev)
 * Sab sizes/prices/plans yahan se aate hain. Koi hardcode nahi.
 * Static JSON pehle -> baad me backend API se override (P6/SaaS).
 * Golden rule: purana config kabhi delete nahi — naya version.
 */
(function () {
  const FILES = ["sizes", "forms", "pricing", "plans", "idtypes", "professions", "albumtypes"];
  const BASE = "config/";

  const SUITE = {
    cfg: {},
    versions: {},
    ready: false,

    /** Saare config files load karo. Ek fail ho to baaki chale (degraded, not dead). */
    async load() {
      const jobs = FILES.map(async (name) => {
        try {
          const r = await fetch(BASE + name + ".json?v=" + Date.now());
          if (!r.ok) throw new Error("HTTP " + r.status);
          const j = await r.json();
          SUITE.cfg[name] = j;
          SUITE.versions[name] = j.v || 0;
        } catch (e) {
          console.error("[SUITE] config fail:", name, e.message);
          SUITE.cfg[name] = { v: 0, error: true };
        }
      });
      await Promise.all(jobs);
      SUITE.ready = true;
      return SUITE.cfg;
    },

    /** mm -> px (runtime only; kabhi hardcode px mat likho) */
    mmToPx(mm, dpi) {
      return Math.round((mm / 25.4) * (dpi || 300));
    },

    /** size object se px dimensions */
    sizePx(size, dpi) {
      const d = dpi || size.dpi || SUITE.cfg.sizes?.defaults?.dpi || 300;
      return { w: SUITE.mmToPx(size.w_mm, d), h: SUITE.mmToPx(size.h_mm, d), dpi: d };
    },

    /** id se dhoondo: list name + item id */
    find(listName, key, id) {
      const arr = SUITE.cfg[listName]?.[key] || [];
      return arr.find((x) => x.id === id) || null;
    },

    photoSize(id) { return SUITE.find("sizes", "photo_sizes", id); },
    sheet(id) { return SUITE.find("sizes", "sheets", id); },

    /** Version badge — har page par config ki umar dikhe (transparency) */
    badge(el) {
      if (!el) return;
      const parts = FILES.filter((f) => SUITE.versions[f]).map((f) => f + " v" + SUITE.versions[f]);
      el.textContent = "config: " + parts.join(" · ");
      el.style.cssText = "font-size:11px;opacity:.55;text-align:center;padding:8px 0;";
    },

    /** P6 hook: backend se override — abhi soft-fail (static hi kaafi hai) */
    async tryRemoteOverride(apiBase) {
      try {
        const r = await fetch(apiBase + "/api/v1/suite/config", { signal: AbortSignal.timeout(4000) });
        if (!r.ok) return false;
        const j = await r.json();
        Object.assign(SUITE.cfg, j);
        console.log("[SUITE] remote config mil gayi");
        return true;
      } catch (e) {
        return false; // offline/static — koi rok nahi
      }
    },
  };

  window.SUITE = SUITE;
})();
