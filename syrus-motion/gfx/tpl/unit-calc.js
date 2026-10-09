// unit-calc — rate lands, the quantity counts up while a grid of tiles fills, "= total" lands in gold.
// "$6.50 per sq ft x 1,500 sq ft = $9,750", "$125 per opening", "$30 per sq ft granite". 5.0s.
TPL.unitCalc = {
  dur: 5.0,
  defaults: { kicker: 'YOUR ROOF, ALL-IN', rate: 6.5, rateDp: 2, unit: 'sq ft', per: '', qty: 1500, qtyLabel: '1,500 sq ft roof', grid: { cols: 10, rows: 6 }, beats: { rate: 0.1, qty: 0.9, total: 2.9 }, y: 520 },
  draw(t, c, E) {
    const Bt = c.beats, cw = 900, cx0 = (E.W - cw) / 2;
    const up = life(t, c.dur, 0.35, 200, 21); if (up <= 0.001) return;
    ctx.globalAlpha = clamp(up * 1.5);
    const y0 = c.y + (1 - up) * 120, ch = 960;
    card(cx0, y0, cw, ch, 40, E.B.card);
    text(c.kicker, cx0 + 60, y0 + 92, 36, E.B.sky, { spacing: 6, weight: 700, shadow: false });
    const r = spring(t - Bt.rate, 260, 20);
    if (r > 0.001) withAlpha(r, () => at(0, (1 - r) * 30, 1, 0, () => {
      const w = text(money(c.rate, c.rateDp), cx0 + 60, y0 + 210, 110, E.B.ink, { weight: 900, shadow: false });
      text('per ' + (c.per || c.unit), cx0 + 80 + w, y0 + 210, 46, E.B.sky, { weight: 600, shadow: false });
    }));
    const qe = easeIO((t - Bt.qty) / 1.6);
    if (t > Bt.qty) {
      text('×', cx0 + 60, y0 + 330, 84, E.B.accent, { weight: 900, shadow: false });
      text(Math.round(c.qty * qe).toLocaleString('en-US') + ' ' + c.unit, cx0 + 140, y0 + 330, 84, E.B.ink, { weight: 900, shadow: false });
      const { cols, rows } = c.grid, gx = cx0 + 60, gy = y0 + 380, gw = cw - 120, cell = gw / cols, gh = cell * rows * 0.62, lit = qe * cols * rows;
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const a = clamp(lit - (j * cols + i));
        rrect(gx + i * cell + 4, gy + j * (gh / rows) + 4, cell - 8, gh / rows - 8, 8);
        ctx.fillStyle = a > 0 ? hexA(E.B.sky, 0.25 + 0.6 * a) : 'rgba(248,248,244,0.08)'; ctx.fill();
      }
      text(c.qtyLabel, cx0 + 60, gy + gh + 46, 32, E.B.sky, { weight: 600, shadow: false, alpha: clamp((t - Bt.qty - 1.2) / 0.3) });
    }
    const tt = spring(t - Bt.total, 300, 17);
    if (tt > 0.001) withAlpha(tt * 2, () => at(cx0 + 60, y0 + ch - 64, 1 + (1 - clamp(tt)) * 0.5, 0, () => text('= ' + money(c.rate * c.qty), 0, 0, 130, E.B.accent, { weight: 900, shadow: false })));
  },
};
