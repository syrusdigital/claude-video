// price-shock — "WHY PAY $40,000 / $50,000 / OR EVEN $60,000?" stacks in red on the VO beats, gets struck through,
// falls away, and "STARTING AT JUST $17,995" slams in gold. Centre frame. 4.5s.
TPL.priceShock = {
  dur: 4.5,
  defaults: { lead: 'WHY PAY', anchors: ['$40,000', '$50,000', 'OR EVEN $60,000?'], reveal: 'STARTING AT JUST', price: '$17,995', beats: { anchors: [0.15, 0.6, 1.05], strike: 1.6, drop: 2.2, reveal: 2.5 }, y: 640 },
  draw(t, c, E) {
    const Bt = c.beats, cx = E.W / 2, y0 = c.y;
    ctx.globalAlpha = 1 - easeOut((t - (c.dur - 0.3)) / 0.3);
    const la = spring(t, 220, 22);
    if (t < Bt.drop + 0.4) text(c.lead, cx, y0 - (1 - la) * 30, 64, '#ffffff', { align: 'center', alpha: clamp(la) * (1 - easeIn((t - Bt.drop) / 0.35)), spacing: 4 });
    c.anchors.forEach((s, i) => {
      const a = spring(t - Bt.anchors[i], 260, 18); if (a <= 0.001) return;
      const fall = easeIn((t - Bt.drop - i * 0.05) / 0.45), y = y0 + 140 + i * 150 + fall * 700, rot = fall * (i % 2 ? -0.25 : 0.2);
      const sz = fitSize(s, i === c.anchors.length - 1 ? 104 : 120, 900, { font: SERIF, italic: true, weight: 700 });
      at(cx, y, 0.6 + 0.4 * a, rot, () => withAlpha(clamp(a) * (1 - fall), () => {
        const w = text(s, 0, 0, sz, E.B.bad, { align: 'center', font: SERIF, italic: true, weight: 700 });
        const k = easeOut((t - Bt.strike - i * 0.08) / 0.18);
        if (k > 0) { ctx.save(); ctx.fillStyle = '#ffffff'; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 10; ctx.fillRect(-w / 2 - 12, -sz * 0.32, (w + 24) * k, 10); ctx.restore(); }
      }));
    });
    const r = spring(t - Bt.reveal, 180, 20), p = spring(t - Bt.reveal - 0.25, 320, 17);
    if (r > 0.001) text(c.reveal, cx, y0 + 220 - (1 - r) * 30, 58, '#ffffff', { align: 'center', alpha: clamp(r), spacing: 4 });
    if (p > 0.001) {
      const sz = fitSize(c.price, 190, 940, { font: SERIF, weight: 700 });
      let w = 0;
      at(cx, y0 + 400, 1 + (1 - clamp(p)) * 0.8 + (p - clamp(p)) * 0.4, 0, () => withAlpha(p * 2, () => { w = text(c.price, 0, 0, sz, E.B.accent, { align: 'center', font: SERIF, weight: 700, blur: 26 }); }));
      const u = easeOut((t - Bt.reveal - 0.55) / 0.35) * w;
      if (u > 1) { ctx.save(); rrect(cx - w / 2, y0 + 440, u, 14, 7); ctx.fillStyle = E.B.accent; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 12; ctx.fill(); ctx.restore(); }
    }
  },
};
