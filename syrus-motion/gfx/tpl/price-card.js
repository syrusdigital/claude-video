// price-card — lower-third card: kicker types on, "starting at", the price rolls up like an odometer and lands,
// a gold underline wipes under it. 3.0s.
TPL.priceCard = {
  dur: 3.0,
  defaults: { kicker: 'FULL BATHROOM REMODEL', pre: 'starting at', price: 14995, note: '', y: 1110 },
  draw(t, c, E) {
    const up = life(t, c.dur, 0.35, 190, 19); if (up <= 0.001) return;
    const cw = 860, ch = c.note ? 380 : 330, cx = (E.W - cw) / 2, cy = c.y + (1 - up) * 140;
    ctx.globalAlpha = clamp(up * 1.4);
    card(cx, cy, cw, ch, 34, E.B.card);
    const kn = Math.floor(clamp((t - 0.25) / 0.45) * c.kicker.length);
    text(c.kicker.slice(0, kn), cx + 56, cy + 78, 34, E.B.sky, { weight: 700, spacing: 6, shadow: false });
    text(c.pre, cx + 56, cy + 138, 36, E.B.ink, { weight: 500, shadow: false, alpha: clamp((t - 0.45) / 0.25) });
    const val = c.price * easeOut((t - 0.55) / 0.9), bump = 0.06 * Math.sin(seg(t, 1.4, 1.65) * Math.PI);
    let pw = 0;
    at(cx + 56, cy + 262, 1 + bump, 0, () => { text(money(val), 0, 0, 132, E.B.ink, { weight: 900, shadow: false }); });
    pw = measure(money(c.price), 132, { weight: 900 });
    const uw = pw * easeOut((t - 1.45) / 0.4);
    if (uw > 1) { rrect(cx + 56, cy + 282, uw, 16, 8); ctx.fillStyle = E.B.accent; ctx.fill(); }
    if (c.note) text(c.note, cx + 56, cy + 346, 28, E.B.sky, { weight: 500, shadow: false });
  },
};
