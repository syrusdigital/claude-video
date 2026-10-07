// wh-count-openings — Work Horse "count the openings" hook: over a full-frame kitchen photo SHOT (cut.py Ken Burns),
// a rate card lands on top ("CABINET PAINTING / $125 PER OPENING"), then numbered gold markers pop onto each cabinet
// door / drawer one per tick while a counter pill tallies them, then "× $125" and "= total" land in gold. ~7s.
// The markers ride the shot's Ken Burns: give the same source size (imgW/imgH), fx/fy, zoom [z0, z1] and len as the shot
// and start the item at the shot's start. cfg.pts = [[x, y], ...] in SOURCE image pixels (counted in order).
// The total is plain arithmetic of the client's unit price (count x rate) — the rate is the client-confirmed value.
TPL.whCountOpenings = {
  dur: 7.0,
  defaults: {
    imgW: 1542, imgH: 2048, fx: 0.5, fy: 0.5, zoom: [1.0, 1.08], len: 7.0, pts: [[400, 700], [700, 700], [1000, 700]],
    kicker: 'CABINET PAINTING', rate: 125, per: 'PER OPENING', unit: 'OPENINGS', total: true,
    beats: { head: 0.1, count: 2.7, step: 0.09, times: 4.8, total: 5.6 }, y: 250, pillY: 1500,
  },
  // source px -> frame px at item time t (replicates cut.py: cover-crop to 9:16, then zoompan about (fx, fy))
  map(p, t, c) {
    const s = Math.max(1080 / c.imgW, 1920 / c.imgH), cw = c.imgW * s, ch = c.imgH * s;
    const x = p[0] * s - (cw - 1080) * c.fx, y = p[1] * s - (ch - 1920) * c.fy;
    const n = Math.max(1, Math.round(c.len * 30) - 1), z = c.zoom[0] + (c.zoom[1] - c.zoom[0]) * clamp(Math.round(t * 30) / n);
    const ox = (1080 - 1080 / z) * c.fx, oy = (1920 - 1920 / z) * c.fy;
    return [(x - ox) * z, (y - oy) * z];
  },
  draw(t, c, E) {
    const B = E.B, me = TPL.whCountOpenings, Bt = c.beats, N = c.pts.length;
    ctx.globalAlpha = 1 - easeOut((t - (c.dur - 0.3)) / 0.3);
    // 1) rate card on top
    const h = spring(t - Bt.head, 230, 19);
    if (h > 0.001) withAlpha(clamp(h * 1.6), () => {
      const cw = 900, chh = 300, x0 = (E.W - cw) / 2, y0 = c.y - (1 - h) * 90;
      card(x0, y0, cw, chh, 38, B.card);
      text(c.kicker, E.W / 2, y0 + 78, 40, B.sky, { align: 'center', weight: 800, spacing: 7, shadow: false });
      const pr = money(c.rate), ps = 150, pw = measure(pr, ps, { weight: 900 }), gap = 26;
      const lw = Math.max(measure(c.per.split(' ')[0], 54, { weight: 900 }), measure(c.per.split(' ').slice(1).join(' '), 54, { weight: 900 }));
      const tx = E.W / 2 - (pw + gap + lw) / 2, base = y0 + 238;
      const k = spring(t - Bt.head - 0.25, 320, 16);
      at(tx + pw / 2, base - 52, 0.6 + 0.4 * k, 0, () => text(pr, 0, 52, ps, B.accent, { align: 'center', weight: 900, shadow: false, alpha: clamp(k * 2) }));
      const words = c.per.split(' '), l1 = words[0], l2 = words.slice(1).join(' ');
      withAlpha(clamp((t - Bt.head - 0.45) / 0.25), () => {
        text(l1, tx + pw + gap, base - 62, 54, B.ink, { weight: 900, shadow: false });
        text(l2, tx + pw + gap, base, 54, B.ink, { weight: 900, shadow: false });
      });
    });
    // 2) numbered markers on the doors
    let lit = 0;
    c.pts.forEach((p, i) => {
      const b = Bt.count + i * Bt.step, a = spring(t - b, 420, 17); if (a <= 0.001) return;
      lit = i + 1;
      const [x, y] = me.map(p, t, c), r = 40;
      const rp = seg(t, b, b + 0.45);
      if (rp > 0 && rp < 1) circle(x, y, r + 46 * easeOut(rp), null, hexA(B.accent, 0.8 * (1 - rp)), 6);
      at(x, y, 0.4 + 0.6 * a, 0, () => withAlpha(clamp(a * 3), () => {
        ctx.save(); ctx.shadowColor = 'rgba(0,10,30,0.6)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4; circle(0, 0, r, B.accent); ctx.restore();
        circle(0, 0, r, null, B.dark, 5);
        text(String(i + 1), 0, 15, String(i + 1).length > 1 ? 38 : 44, B.card, { align: 'center', weight: 900, shadow: false });
      }));
    });
    // 3) counter pill: "15 OPENINGS  × $125"  then "= $1,875"
    const pa = spring(t - Bt.count, 260, 20);
    if (pa > 0.001) withAlpha(clamp(pa * 1.6), () => {
      const xt = spring(t - Bt.times, 300, 18), tt = c.total ? spring(t - Bt.total, 300, 16) : 0;
      const s1 = 66, cnt = String(lit), lab = ' ' + c.unit, mul = '  × ' + money(c.rate);
      const wc = measure(cnt, s1, { weight: 900 }), wl = measure(lab, s1, { weight: 900 }), wm = measure(mul, s1, { weight: 900 });
      const rowW = wc + wl + wm * clamp(xt), tot = '= ' + money(c.rate * N), wt = measure(tot, 120, { weight: 900 });
      const cw = Math.max(rowW, wt * clamp(tt)) + 110, chh = 130 + 140 * clamp(tt), x0 = E.W / 2 - cw / 2, y0 = c.pillY + (1 - pa) * 80;
      card(x0, y0, cw, chh, 36, hexA(B.card, 0.96));
      let x = E.W / 2 - rowW / 2;
      const bump = 1 + 0.18 * Math.exp(-(t - (Bt.count + (lit - 1) * Bt.step)) * 9) * (lit > 0 ? 1 : 0);
      at(x + wc / 2, y0 + 88 - 24, bump, 0, () => text(cnt, 0, 24, s1, B.accent, { align: 'center', weight: 900, shadow: false }));
      x += wc; text(lab, x, y0 + 88, s1, B.ink, { weight: 900, shadow: false }); x += wl;
      if (xt > 0.001) text(mul, x - (1 - xt) * 40, y0 + 88, s1, B.accent, { weight: 900, shadow: false, alpha: clamp(xt * 2) });
      if (tt > 0.001) at(E.W / 2, y0 + 220, 0.7 + 0.3 * tt, 0, () => text(tot, 0, 0, 120, B.accent, { align: 'center', weight: 900, shadow: false, alpha: clamp(tt * 2) }));
    });
  },
};
