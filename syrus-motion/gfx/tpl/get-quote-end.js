// get-quote-end — end-card CTA: a simple original phone outline rises, its "Get Quote" button gets tapped (touch dot +
// ring), then "TAP GET QUOTE BELOW" slams in with a gold arrow pointing down at the ad's real CTA bar, and cfg.line2
// ("Free in-home estimate") pops in on a navy pill. 4.0s.
// The phone screen is abstract (placeholder blocks only) — not a copy of any real app UI.
TPL.getQuoteEnd = {
  dur: 4.0,
  // line2 is the client's offer line (client-confirmed); '' hides it.
  defaults: {
    button: 'Get Quote', head: 'TAP GET QUOTE BELOW', mark: 'GET QUOTE', line2: 'Free in-home estimate', y: 290,
    beats: { phone: 0, button: 0.4, tap: 1.25, head: 1.75, line2: 2.05, arrow: 2.3 },
  },
  arrow(x, y, s, fill) {   // a fat down arrow with a dark keyline so it reads over any footage
    ctx.save(); ctx.translate(x, y); ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s); ctx.lineTo(s * 0.2, -s); ctx.lineTo(s * 0.2, -s * 0.15); ctx.lineTo(s * 0.52, -s * 0.15);
    ctx.lineTo(0, s * 0.45); ctx.lineTo(-s * 0.52, -s * 0.15); ctx.lineTo(-s * 0.2, -s * 0.15); ctx.closePath();
    ctx.lineJoin = 'round'; ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6;
    ctx.strokeStyle = 'rgba(0,10,30,0.9)'; ctx.lineWidth = 10; ctx.stroke(); ctx.shadowColor = 'transparent';
    ctx.fillStyle = fill; ctx.fill(); ctx.restore();
  },
  draw(t, c, E) {
    const B = E.B, me = TPL.getQuoteEnd, Bt = c.beats;
    ctx.globalAlpha = 1 - easeOut((t - (c.dur - 0.3)) / 0.3);
    const pw = 360, ph = 640, px = (E.W - pw) / 2, rise = spring(t - Bt.phone, 170, 20), py = c.y + (1 - rise) * 280;
    const sx = px + 30, sw = pw - 60, bh = 96, by = py + ph - 74 - bh;
    const press = Math.sin(Math.PI * seg(t, Bt.tap, Bt.tap + 0.24));
    if (rise > 0.001) withAlpha(clamp(rise * 1.6), () => {
      card(px, py, pw, ph, 60, hexA(B.dark, 0.94), { stroke: B.ink, lw: 9 });
      rrect(E.W / 2 - 46, py + 26, 92, 26, 13); ctx.fillStyle = hexA(B.ink, 0.85); ctx.fill();
      const sc = clamp((t - Bt.phone - 0.2) * 3);
      withAlpha(sc, () => {
        rrect(sx, py + 82, sw, 236, 26); ctx.fillStyle = hexA(B.sky, 0.14); ctx.fill();
        if (TPL.checklist) TPL.checklist.icon('house', E.W / 2, py + 200, 110, hexA(B.sky, 0.7), 6);
        for (const [yy, ww] of [[346, 0.82], [384, 0.6], [422, 0.7]]) { rrect(sx, py + yy, sw * ww, 20, 10); ctx.fillStyle = hexA(B.ink, 0.16); ctx.fill(); }
      });
      const bk = spring(t - Bt.button, 320, 18);
      if (bk > 0.001) at(E.W / 2, by + bh / 2, (0.6 + 0.4 * bk) * (1 - 0.06 * press), 0, () => withAlpha(clamp(bk * 2), () => {
        card(-sw / 2, -bh / 2, sw, bh, bh / 2, B.accent, { blur: 18, dy: 6 });
        if (press > 0) { rrect(-sw / 2, -bh / 2, sw, bh, bh / 2); ctx.fillStyle = `rgba(0,20,60,${0.18 * press})`; ctx.fill(); }
        text(c.button, 0, 15, fitSize(c.button, 44, sw - 60, { weight: 800 }), B.card, { weight: 800, align: 'center', shadow: false });
      }));
      rrect(E.W / 2 - 60, py + ph - 34, 120, 8, 4); ctx.fillStyle = hexA(B.ink, 0.5); ctx.fill();
    });
    // touch: a dot glides in, presses, a ring expands from the tap point
    const tx = E.W / 2 + 112, ty = by + bh / 2 + 8;
    const mv = easeIO((t - Bt.tap + 0.55) / 0.5), gone = easeOut((t - Bt.tap - 0.35) / 0.35);
    if (mv > 0 && gone < 1) {
      const dx = lerp(px + pw + 150, tx, mv) + gone * 40, dy = lerp(py + ph + 120, ty, mv) + gone * 50;
      withAlpha(clamp(mv * 2) * (1 - gone), () => at(dx, dy, 1 - 0.18 * press, 0, () => {
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 16; circle(0, 0, 30, 'rgba(255,255,255,0.9)'); ctx.restore();
        circle(0, 0, 30, null, hexA(B.dark, 0.25), 3);
      }));
    }
    for (const [d, a0] of [[0.04, 0.95], [0.16, 0.5]]) {
      const u = seg(t, Bt.tap + d, Bt.tap + d + 0.6);
      if (u > 0 && u < 1) circle(tx, ty, 36 + 150 * easeOut(u), null, hexA('#ffffff', a0 * (1 - u)), 6 * (1 - u) + 2);
    }
    // headline (mark in gold), line2 pill, arrow
    const hy = py + ph + 128, hs = fitSize(c.head, 92, 900, { weight: 900 });
    const h = spring(t - Bt.head, 420, 22);
    if (h > 0.001) withAlpha(clamp(h * 2.5), () => at(E.W / 2, hy, 1 + 0.5 * (1 - h), 0, () => {
      const i = c.mark ? c.head.indexOf(c.mark) : -1;
      const parts = i >= 0 ? [c.head.slice(0, i), c.mark, c.head.slice(i + c.mark.length)] : [c.head, '', ''];
      const ws = parts.map((p) => measure(p, hs, { weight: 900 }));
      let x = -(ws[0] + ws[1] + ws[2]) / 2;
      parts.forEach((p, j) => { if (p) text(p, x, 0, hs, j === 1 ? B.accent : '#FFFFFF', { weight: 900, stroke: 12, strokeColor: 'rgba(0,10,30,0.9)', blur: 22 }); x += ws[j]; });
    }));
    const l2 = spring(t - Bt.line2, 300, 20);
    if (c.line2 && l2 > 0.001) withAlpha(clamp(l2 * 2), () => at(E.W / 2, hy + 92 + (1 - l2) * 30, 0.85 + 0.15 * l2, 0, () => {
      const s = 46, w = measure(c.line2, s, { weight: 800 }) + 84, h2 = 96;
      card(-w / 2, -h2 / 2, w, h2, h2 / 2, B.card);
      text(c.line2, 0, 16, s, B.ink, { weight: 800, align: 'center', shadow: false });
    }));
    const ar = spring(t - Bt.arrow, 300, 16);
    if (ar > 0.001) {
      const bob = 14 * Math.sin(Math.max(0, t - Bt.arrow - 0.4) * Math.PI * 2 * 1.4) * clamp((t - Bt.arrow - 0.4) * 3);
      const ay = hy + (c.line2 ? 330 : 240) + bob - (1 - ar) * 80;
      withAlpha(clamp(ar * 2), () => me.arrow(E.W / 2, ay, 150, B.accent));
    }
  },
};
