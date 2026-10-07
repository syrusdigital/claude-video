// location-super — geo call-out in the top third: a navy tab slides in from the left edge, a pin drops into its well
// with a bounce and sends one ripple, "SUFFOLK COUNTY" / "HOMEOWNERS" ride in with it; holds, then slides back out. 3.0s.
TPL.locationSuper = {
  dur: 3.0,
  // Long Island (Suffolk County) client — the area is the client's confirmed service area.
  defaults: { place: 'SUFFOLK COUNTY', who: 'HOMEOWNERS', y: 330 },
  draw(t, c, E) {
    const B = E.B, h = 188, y0 = c.y;
    const ps = fitSize(c.place, 76, 640, { weight: 900 }), ws = fitSize(c.who, 36, 640, { weight: 800, spacing: 8 });
    const tw = Math.max(measure(c.place, ps, { weight: 900 }), measure(c.who, ws, { weight: 800, spacing: 8 }));
    const tabW = Math.min(1000, 252 + tw + 64);
    const inn = spring(t, 190, 21), out = easeIn((t - (c.dur - 0.35)) / 0.35);
    const x = -(tabW + 80) * (1 - inn) - (tabW + 80) * out;
    if (inn <= 0.001) return;
    card(x - 80, y0, tabW + 80, h, 40, B.card);
    const px = x + 150, py = y0 + h / 2;
    circle(px, py, 60, hexA(B.sky, 0.16));
    // pin drop + ripple
    const d = spring(t - 0.3, 260, 10), yo = -Math.abs(1 - d) * 120;
    ctx.save(); rrect(x - 80, y0, tabW + 80, h, 40); ctx.clip();
    const rp = seg(t, 0.55, 1.35);
    if (rp > 0 && rp < 1) { ctx.save(); ctx.beginPath(); ctx.ellipse(px, py + 38, 20 + 70 * easeOut(rp), 7 + 22 * easeOut(rp), 0, 0, Math.PI * 2); ctx.strokeStyle = hexA(B.sky, 0.8 * (1 - rp)); ctx.lineWidth = 4; ctx.stroke(); ctx.restore(); }
    if (t > 0.3) withAlpha(clamp((t - 0.3) * 8), () => {
      const r = 31, hh = 80 - r, b = Math.acos(r / hh);
      ctx.save(); ctx.translate(px, py + 40 + yo);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, -hh, r, Math.PI / 2 + b, Math.PI / 2 - b); ctx.closePath();
      ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4; ctx.fillStyle = B.ink; ctx.fill();
      ctx.shadowColor = 'transparent'; circle(0, -hh, 13, B.card); ctx.restore();
    });
    ctx.restore();
    // copy rides in slightly behind the tab
    const a = spring(t - 0.12, 240, 22);
    withAlpha(clamp(a * 2), () => {
      text(c.place, x + 252 + (1 - a) * -30, y0 + 104, ps, B.ink, { weight: 900, shadow: false });
      text(c.who, x + 254 + (1 - a) * -50, y0 + 152, ws, B.sky, { weight: 800, spacing: 8, shadow: false });
    });
  },
};
