// day-timeline — "DAY 1 → DAY 7": a navy card with a day counter; a progress bar hops marker to marker, each day lights
// up as the bar arrives and its label pops (labels alternate above/below so they never collide). On the last day the
// bar sweeps gold and the counter + "Done" land in gold. cfg.days, cfg.labels ([{d, s}] or strings spread evenly). ~6s.
TPL.dayTimeline = {
  dur: 6.0,
  // "a bathroom remodel done in seven days" is the client's claim — only use with their confirmed timeline (cfg.days/labels)
  defaults: {
    kicker: 'YOUR BATHROOM REMODEL', days: 7,
    labels: [{ d: 1, s: 'Demo' }, { d: 2, s: 'Plumbing' }, { d: 4, s: 'Walls' }, { d: 6, s: 'Vanity' }, { d: 7, s: 'Done' }],
    y: 620, beats: [0.6, 4.4],
  },
  draw(t, c, E) {
    const B = E.B, N = Math.max(2, c.days | 0);
    const up = life(t, c.dur, 0.3, 200, 20); if (up <= 0.001) return;
    const cw = 960, ch = 520, x0 = (E.W - cw) / 2, y0 = c.y + (1 - up) * 130;
    ctx.globalAlpha = clamp(up * 1.5);
    card(x0, y0, cw, ch, 36, B.card);
    const L = (c.labels || []).map((l, i, a) => (typeof l === 'string' ? { d: a.length === N ? i + 1 : Math.round(1 + i * (N - 1) / Math.max(1, a.length - 1)), s: l } : l));
    // timing: marker 1 lights at beats[0], marker N at beats[1]; the bar hops between them
    const [b0, b1] = c.beats, step = (b1 - b0) / (N - 1), HOP = 0.72;
    const lightT = (k) => b0 + (k - 1) * step;
    let pos = 1; for (let k = 1; k < N; k++) pos += easeIO(seg(t, lightT(k + 1) - step * HOP, lightT(k + 1)));
    const lit = t < b0 ? 0 : Math.min(N, 1 + Math.floor((t - b0) / step + 1e-6));
    const done = t >= b1, gold = easeOut(seg(t, b1 + 0.05, b1 + 0.5));
    // header: kicker + counter
    text(c.kicker, x0 + 58, y0 + 84, 34, B.sky, { weight: 700, spacing: 6, shadow: false });
    const n = Math.max(1, lit), cb = 1 + 0.07 * Math.sin(seg(t, lightT(n), lightT(n) + 0.28) * Math.PI);
    at(x0 + 58, y0 + 196, cb, 0, () => {
      const w = text('DAY ' + n, 0, 0, 104, done ? B.accent : B.ink, { weight: 900, shadow: false, alpha: lit ? 1 : 0.5 });
      text('OF ' + N, w + 22, 0, 46, B.sky, { weight: 800, spacing: 2, shadow: false });
    });
    // track + fill
    const mx = (k) => x0 + 92 + (k - 1) * (cw - 184) / (N - 1), by = y0 + 352;
    rrect(mx(1), by - 7, mx(N) - mx(1), 14, 7); ctx.fillStyle = hexA(B.ink, 0.14); ctx.fill();
    const fx = lerp(mx(1), mx(N), (pos - 1) / (N - 1));
    if (t >= b0 && fx > mx(1) + 1) { rrect(mx(1), by - 7, fx - mx(1), 14, 7); ctx.fillStyle = B.sky; ctx.fill(); }
    if (gold > 0) { rrect(mx(1), by - 7, (mx(N) - mx(1)) * gold, 14, 7); ctx.fillStyle = B.accent; ctx.fill(); }
    // markers
    for (let k = 1; k <= N; k++) {
      const on = t >= lightT(k), p = on ? spring(t - lightT(k), 340, 14) : 0, last = k === N && on;
      const r = 30 * (on ? 0.85 + 0.15 * p : 0.85);
      if (on && p < 1.2) { const ru = seg(t, lightT(k), lightT(k) + 0.45); if (ru < 1) circle(mx(k), by, r + 30 * easeOut(ru), null, hexA(last ? B.accent : B.sky, 0.7 * (1 - ru)), 4); }
      circle(mx(k), by, r, on ? (last ? B.accent : B.ink) : B.card, on ? null : hexA(B.sky, 0.55), 4);
      text(String(k), mx(k), by + 11, 30, on ? B.card : B.sky, { align: 'center', weight: 900, shadow: false, alpha: on ? 1 : 0.8 });
    }
    // labels (alternate above / below; edge labels hug the card)
    L.forEach((l, i) => {
      const k = Math.max(1, Math.min(N, l.d)), a = spring(t - lightT(k) - 0.06, 300, 18); if (a <= 0.001) return;
      const above = i % 2 === 1, isLast = k === N, sz = 44, w = measure(l.s, sz, { weight: 800 });
      let lx = mx(k); const lo = x0 + 40 + w / 2, hi = x0 + cw - 40 - w / 2; lx = Math.max(lo, Math.min(hi, lx));
      const ly = above ? by - 66 : by + 98, dy = (1 - a) * (above ? 22 : -22);
      withAlpha(clamp(a * 1.6), () => {
        ctx.fillStyle = hexA(B.ink, 0.35); ctx.fillRect(mx(k) - 1.5, above ? by - 50 : by + 36, 3, 14);
        text(l.s, lx, ly + dy, sz, isLast && done ? B.accent : B.ink, { align: 'center', weight: 800, shadow: false });
      });
    });
  },
};
