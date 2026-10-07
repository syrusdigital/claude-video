// financing-safe — the compliant financing line on a navy pill: an icon well (calendar + gold coin) pops, the pill
// stretches open to "$0 DOWN / OPTIONS AVAILABLE", the coin flips once. Optional cfg.disclosure renders in small
// stroked text under the pill — ONLY when provided. 3.0s.
TPL.financingSafe = {
  dur: 3.0,
  // Compliance: this is the ONLY financing line allowed without a disclosure ("$0 down options available").
  // Rates, monthly payments, "approved", "no credit check" etc. need the client's full disclosure line in cfg.disclosure.
  defaults: { big: '$0 DOWN', rest: 'OPTIONS AVAILABLE', disclosure: '', y: 960, flip: 1.15 },
  icon(t, c, E) {   // calendar with a coin on its corner, drawn around (0,0)
    const B = E.B;
    ctx.lineWidth = 5; ctx.strokeStyle = B.ink; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    rrect(-34, -28, 58, 54, 9); ctx.stroke();
    line([[-34, -14], [24, -14]], B.ink, 5);
    line([[-20, -36], [-20, -22]], B.ink, 5); line([[10, -36], [10, -22]], B.ink, 5);
    ctx.fillStyle = B.ink; for (const [x, y] of [[-22, -1], [-5, -1], [12, -1], [-22, 13], [-5, 13]]) { ctx.beginPath(); ctx.arc(x, y, 3.6, 0, Math.PI * 2); ctx.fill(); }
    const f = seg(t, c.flip, c.flip + 0.55), sx = Math.cos(f * Math.PI * 2);
    at(22, 20, 1, 0, () => {
      ctx.scale(Math.max(0.06, Math.abs(sx)), 1);
      circle(0, 0, 22, B.accent, B.card, 5);
      if (sx > 0) text('$', 0, 10, 28, B.card, { weight: 900, align: 'center', shadow: false });
      else circle(0, 0, 11, null, hexA(B.card, 0.6), 3);
    });
  },
  draw(t, c, E) {
    const B = E.B, me = TPL.financingSafe;
    const up = life(t, c.dur, 0.3, 220, 21); if (up <= 0.001) return;
    ctx.globalAlpha = clamp(up * 1.5);
    const h = 176, r = h / 2, bs = 80, rs = 36;
    const tw = Math.max(measure(c.big, bs, { weight: 900 }), measure(c.rest, rs, { weight: 800, spacing: 5 }));
    const fullW = Math.min(960, h + 22 + tw + 70), x0 = (E.W - fullW) / 2, y0 = c.y + (1 - up) * 70;
    const g = spring(t - 0.18, 210, 22), w = lerp(h, fullW, clamp(g, 0, 1.02));
    card(x0, y0, w, h, r, B.card);
    const ic = spring(t, 320, 17);
    at(x0 + r, y0 + r, 0.5 + 0.5 * ic, 0, () => { circle(0, 0, r - 20, hexA(B.sky, 0.16)); me.icon(t, c, E); });
    ctx.save(); rrect(x0, y0, w, h, r); ctx.clip();
    const tx = x0 + h + 22, a = clamp((g - 0.3) * 2);
    text(c.big, tx + (1 - g) * -40, y0 + 98, fitSize(c.big, bs, fullW - h - 90, { weight: 900 }), B.accent, { weight: 900, shadow: false, alpha: a });
    text(c.rest, tx + 2 + (1 - g) * -40, y0 + 145, fitSize(c.rest, rs, fullW - h - 90, { weight: 800, spacing: 5 }), B.ink, { weight: 800, spacing: 5, shadow: false, alpha: a });
    ctx.restore();
    if (c.disclosure) {   // small print, wrapped, stroked so it survives busy footage
      const s = 30, maxW = 900, words = c.disclosure.split(/\s+/), lines = []; let cur = '';
      for (const wd of words) { const nx = cur ? cur + ' ' + wd : wd; if (measure(nx, s, { weight: 600 }) > maxW && cur) { lines.push(cur); cur = wd; } else cur = nx; }
      if (cur) lines.push(cur);
      const da = clamp((t - 0.45) * 4);
      lines.forEach((l, i) => text(l, E.W / 2, y0 + h + 52 + i * 40, s, B.ink, { weight: 600, align: 'center', stroke: 7, strokeColor: 'rgba(0,10,30,0.85)', shadow: false, alpha: da }));
    }
  },
};
