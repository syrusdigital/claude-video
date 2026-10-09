// before-after-wipe — transparent wipe UI to lay over two clips: a full-height divider with a round handle sweeps in
// from the right on a spring and settles at cfg.split (0.5 = centre), BEFORE / AFTER pills pop in, optional badge
// ("Tub to shower in 1 day"), then a soft pulse on the handle. 4.0s.
//   Divider x(t) = W * lerp(1.06, split, spring(t - beats.sweep, 70, 12)) — AFTER is the side right of the line.
//   cfg.matte: true draws ONLY that AFTER region in white (render with "bg": "#000000") -> a luma track matte for the
//   AFTER clip that follows the divider exactly.
// cfg.layout 'stack' = for top/bottom stacked clips: a horizontal split line at y = H * split that draws out from the
//   centre, BEFORE pill just above it, AFTER pill just below (badge optional, off by default for stack).
TPL.beforeAfterWipe = {
  dur: 4.0,
  // badge is a client claim ("in 1 day"): only ship it when the client confirms it; badge: '' hides it.
  defaults: {
    layout: 'wipe', split: 0.5, before: 'BEFORE', after: 'AFTER',
    badge: 'Tub to shower in 1 day', badgeMark: '1 day', pillY: 330, handleY: 960, badgeY: 1360,
    matte: false, beats: { sweep: 0.15, pills: 1.0, badge: 1.6, nudge: 2.5 },
  },
  pos(t, c, E) { return E.W * lerp(1.06, c.split, spring(t - c.beats.sweep, 70, 12)); },
  pill(str, cx, cy, k, after, E) {   // k = 0..1 spring
    if (k <= 0.001) return;
    const B = E.B, s = 46, w = measure(str, s, { weight: 900, spacing: 5 }) + 88, h = 96;
    withAlpha(clamp(k * 2), () => at(cx, cy, 0.5 + 0.5 * k, 0, () => {
      card(-w / 2, -h / 2, w, h, h / 2, after ? B.accent : B.card, { blur: 26, dy: 8 });
      text(str, 2.5, 16, s, after ? B.card : B.ink, { weight: 900, spacing: 5, align: 'center', shadow: false });
    }));
  },
  badge(t, c, E) {
    const B = E.B, k = spring(t - c.beats.badge, 260, 20); if (k <= 0.001 || !c.badge) return;
    const s = 48, i = c.badgeMark ? c.badge.indexOf(c.badgeMark) : -1;
    const parts = i >= 0 ? [c.badge.slice(0, i), c.badgeMark, c.badge.slice(i + c.badgeMark.length)] : [c.badge, '', ''];
    const ws = parts.map((p, j) => measure(p, s, { weight: j === 1 ? 900 : 800 })), tw = ws[0] + ws[1] + ws[2];
    const h = 116, w = h + tw + 48, x = (E.W - w) / 2, y = c.badgeY - h / 2 + (1 - k) * 60;
    withAlpha(clamp(k * 1.8), () => {
      card(x, y, w, h, h / 2, B.card);
      const ix = x + h / 2 + 4, iy = y + h / 2;
      circle(ix, iy, 38, hexA(B.sky, 0.16));
      circle(ix, iy, 21, null, B.sky, 5);   // clock
      const hand = easeOut((t - c.beats.badge - 0.15) / 0.5) * Math.PI * 1.5;
      line([[ix, iy], [ix, iy - 12]], B.sky, 5); line([[ix, iy], [ix + Math.sin(hand + 1.6) * 10, iy - Math.cos(hand + 1.6) * 10]], B.sky, 5);
      let tx = ix + 60;
      parts.forEach((p, j) => { if (p) text(p, tx, iy + 17, s, j === 1 ? B.accent : B.ink, { weight: j === 1 ? 900 : 800, shadow: false }); tx += ws[j]; });
    });
  },
  draw(t, c, E) {
    const B = E.B, me = TPL.beforeAfterWipe, Bt = c.beats;
    if (c.matte) {
      if (c.layout === 'stack') { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, E.H * c.split, E.W, E.H); return; }
      const x = me.pos(t, c, E); ctx.fillStyle = '#ffffff'; ctx.fillRect(x, 0, E.W - x + 2, E.H); return;
    }
    ctx.globalAlpha = 1 - easeOut((t - (c.dur - 0.3)) / 0.3);
    if (c.layout === 'stack') {
      const y = E.H * c.split, g = spring(t - Bt.sweep, 170, 22), hw = (E.W / 2 + 12) * clamp(g, 0, 1.02);
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 18; ctx.fillStyle = '#ffffff'; ctx.fillRect(E.W / 2 - hw, y - 4, hw * 2, 8); ctx.restore();
      const pl = (str, after, k) => { const w = measure(str, 46, { weight: 900, spacing: 5 }) + 88; me.pill(str, 80 + w / 2, after ? y + 30 + 48 : y - 30 - 48, k, after, E); };
      pl(c.before, false, spring(t - Bt.pills + 0.25, 360, 18));
      pl(c.after, true, spring(t - Bt.pills + 0.07, 360, 18));
      me.badge(t, c, E);
      return;
    }
    const x = me.pos(t, c, E), hy = c.handleY;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 18; ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 4, 0, 8, E.H); ctx.restore();
    const nr = seg(t, Bt.nudge, Bt.nudge + 0.8);
    if (nr > 0 && nr < 1) circle(x, hy, 56 + 64 * easeOut(nr), null, hexA('#ffffff', 0.85 * (1 - nr)), 5);
    const nb = 1 + 0.08 * Math.sin(Math.PI * seg(t, Bt.nudge, Bt.nudge + 0.3));
    at(x, hy, nb, 0, () => {
      ctx.save(); ctx.shadowColor = 'rgba(0,10,30,0.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; circle(0, 0, 56, '#ffffff'); ctx.restore();
      ctx.fillStyle = B.card;
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 35, 0); ctx.lineTo(d * 13, -18); ctx.lineTo(d * 13, 18); ctx.closePath(); ctx.fill(); }
    });
    me.pill(c.before, E.W * c.split / 2, c.pillY, spring(t - Bt.pills, 360, 18), false, E);
    me.pill(c.after, E.W * (c.split + (1 - c.split) / 2), c.pillY, spring(t - Bt.pills - 0.18, 360, 18), true, E);
    me.badge(t, c, E);
  },
};
