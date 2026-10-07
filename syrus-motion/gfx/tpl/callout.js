// callout — a label with a leader line pointing at a spot in the footage: a dot pops and keeps pulsing at the target,
// the leader draws out (diagonal, then horizontal), and a navy label card pops at its end (label + optional sub; a sub
// with a $ or a number goes gold). 1–3 callouts in sequence via cfg.items. 4.0s.
// cfg.items = [{ target: [x, y], label, sub, side: 'auto'|'left'|'right', at: s, rise: px }]  (or single target/label/sub)
TPL.callout = {
  dur: 4.0,
  // GC Countertops — quartz at $55/sq ft installed (client-confirmed price).
  defaults: { items: null, target: [700, 1150], label: 'QUARTZ COUNTERTOPS', sub: '$55 / sq ft installed', side: 'auto', rise: 230, start: 0.1, step: 1.1 },
  one(t, it, c, E) {
    if (t <= 0) return;
    const B = E.B, [tx, ty] = it.target, rise = it.rise ?? c.rise, side = it.side ?? 'auto';
    const dir = side === 'left' ? -1 : side === 'right' ? 1 : (tx > E.W / 2 ? -1 : 1);
    const vy = ty - rise < 280 ? 1 : -1;   // card goes above the target unless that leaves the safe area
    const ex = tx + dir * rise * 0.5, ey = ty + vy * rise, lx = ex + dir * 70;
    const ls = 46, ss = 36, label = it.label || '', sub = it.sub || '';
    const lw = measure(label, ls, { weight: 900, spacing: 1 }), sw = sub ? measure(sub, ss, { weight: 800 }) : 0;
    const cwid = Math.min(940, Math.max(lw, sw) + 68), chh = sub ? 152 : 100;
    const cx = clamp(dir > 0 ? lx : lx - cwid, 60, 1020 - cwid), cy = ey - chh / 2;
    const end = [dir > 0 ? cx : cx + cwid, ey];
    // pulse + dot
    for (const off of [0.15, 0.75]) {
      if (t < off) continue;
      const u = ((t - off) % 1.2) / 1.2;
      circle(tx, ty, 16 + 46 * easeOut(u), null, hexA('#ffffff', 0.85 * (1 - u)), 4 * (1 - u) + 1.5);
    }
    const d = spring(t, 380, 16);
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 14; circle(tx, ty, 16 * d, '#ffffff'); ctx.restore();
    circle(tx, ty, 7 * d, B.card);
    // leader: starts at the dot's edge
    const L = Math.hypot(ex - tx, ey - ty), sx = tx + (ex - tx) / L * 22, sy = ty + (ey - ty) / L * 22;
    const lf = easeIO((t - 0.18) / 0.42);
    if (lf > 0) line(partial([[sx, sy], [ex, ey], end], lf), '#ffffff', 6, { shadow: true });
    // card
    const k = spring(t - 0.55, 300, 20); if (k <= 0.001) return;
    const ax = dir > 0 ? cx : cx + cwid;
    withAlpha(clamp(k * 2), () => at(ax, ey, 0.6 + 0.4 * k, 0, () => {
      const x0 = cx - ax, y0 = cy - ey;
      card(x0, y0, cwid, chh, 28, B.card);
      text(label, x0 + 34, y0 + 66, fitSize(label, ls, cwid - 68, { weight: 900, spacing: 1 }), B.ink, { weight: 900, spacing: 1, shadow: false });
      if (sub) text(sub, x0 + 34, y0 + 120, fitSize(sub, ss, cwid - 68, { weight: 800 }), /[$0-9]/.test(sub) ? B.accent : B.sky, { weight: 800, shadow: false, alpha: clamp((t - 0.7) * 5) });
    }));
  },
  draw(t, c, E) {
    const items = (c.items || [{ target: c.target, label: c.label, sub: c.sub, side: c.side }]).slice(0, 3);
    ctx.globalAlpha = 1 - easeOut((t - (c.dur - 0.3)) / 0.3);
    items.forEach((it, i) => TPL.callout.one(t - (it.at ?? c.start + i * c.step), it, c, E));
  },
};
