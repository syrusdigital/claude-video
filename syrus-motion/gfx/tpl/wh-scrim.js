// wh-scrim — a soft dark band behind on-screen type, so white/red/gold text reads over bright footage (windows, sky,
// white siding). Vertical gradient: transparent -> cfg.alpha at the band centre -> transparent; fades in/out ~0.25s.
// Put it in the gfx list BEFORE the text item it supports. cfg.y = band centre, cfg.h = band height, cfg.color.
TPL.whScrim = {
  dur: 3.0,
  defaults: { y: 760, h: 900, alpha: 0.6, color: '#050c19', fade: 0.25 },
  draw(t, c, E) {
    const a = clamp(t / c.fade) * (1 - clamp((t - (c.dur - c.fade)) / c.fade));
    if (a <= 0.001) return;
    const y0 = c.y - c.h / 2, g = ctx.createLinearGradient(0, y0, 0, y0 + c.h);
    g.addColorStop(0, hexA(c.color, 0)); g.addColorStop(0.3, hexA(c.color, c.alpha * a));
    g.addColorStop(0.7, hexA(c.color, c.alpha * a)); g.addColorStop(1, hexA(c.color, 0));
    ctx.fillStyle = g; ctx.fillRect(0, y0, E.W, c.h);
  },
};
