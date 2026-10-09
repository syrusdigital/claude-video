// trust-badges — one trust lockup per item, picked by cfg.kind: a navy card with a seal medallion (rosette edge) that
// spins in, its centre content builds (counter / shield tick / ribboned seal / crew), the text lines slide in, then a
// light sweep crosses the seal. 3.0s.
//   'years'    — counter counts up to cfg.years inside the seal, "IN BUSINESS / SINCE <cfg.since>"
//   'licensed' — shield seal, "LICENSED & INSURED" (+ optional cfg.sub, e.g. a licence number)
//   'warranty' — ribboned seal with cfg.warrantyYears, "<n>-YEAR LABOR WARRANTY"
//   'inhouse'  — crew seal, "IN-HOUSE CREW / NO SUBCONTRACTORS"
// Override any copy with cfg.top / cfg.big (array of lines) / cfg.sub.
TPL.trustBadges = {
  dur: 3.0,
  // Every claim here is a CLIENT-CONFIRMED cfg value (years in business + founding year, licence & insurance, warranty
  // length and type, in-house crew). Never ship one the client hasn't confirmed; keep years and since consistent.
  defaults: { kind: 'years', years: 19, since: 2007, warrantyYears: 2, top: null, big: null, sub: null, y: 330 },
  COPY: {
    years: (c) => ({ top: 'IN BUSINESS', big: ['SINCE ' + c.since], sub: '' }),
    licensed: () => ({ top: '', big: ['LICENSED &', 'INSURED'], sub: '' }),
    warranty: (c) => ({ top: '', big: [c.warrantyYears + '-YEAR LABOR', 'WARRANTY'], sub: '' }),
    inhouse: () => ({ top: '', big: ['IN-HOUSE CREW'], sub: 'NO SUBCONTRACTORS' }),
  },
  rosette(r, fill) {
    const N = 40; ctx.beginPath();
    for (let k = 0; k <= N * 2; k++) { const a = (k / (N * 2)) * Math.PI * 2, rr = k % 2 ? r * 0.935 : r; k ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(rr, 0); }
    ctx.closePath(); ctx.lineJoin = 'round'; ctx.fillStyle = fill; ctx.fill();
  },
  // seal content, drawn at the medallion centre; u = build progress (seconds since content start)
  content(kind, u, c, E, r) {
    const B = E.B;
    if (kind === 'years' || kind === 'warranty') {
      const n = kind === 'years' ? c.years : c.warrantyYears, s = String(n).length > 2 ? 72 : 96;
      if (kind === 'years') text(String(Math.round(n * easeOut(u / 0.9))), 0, 22, s, B.accent, { weight: 900, align: 'center', shadow: false });
      else { const k = spring(u, 320, 15); if (k > 0.001) at(0, -10, 0.4 + 0.6 * k, 0, () => text(String(n), 0, 32, s, B.accent, { weight: 900, align: 'center', shadow: false, alpha: clamp(k * 2) })); }
      text(n === 1 ? 'YEAR' : 'YEARS', 3, 60, 22, B.ink, { weight: 800, spacing: 5, align: 'center', shadow: false, alpha: clamp(u * 4) });
    } else if (kind === 'licensed') {
      const k = spring(u, 300, 18);
      at(0, 0, 0.6 + 0.4 * k, 0, () => {
        ctx.beginPath(); ctx.moveTo(0, -46); ctx.lineTo(38, -32); ctx.lineTo(36, 4); ctx.quadraticCurveTo(32, 32, 0, 50); ctx.quadraticCurveTo(-32, 32, -36, 4); ctx.lineTo(-38, -32); ctx.closePath();
        ctx.fillStyle = hexA(B.sky, 0.18 * clamp(k)); ctx.fill(); ctx.strokeStyle = B.ink; ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.globalAlpha *= clamp(k * 2); ctx.stroke();
      });
      check(-2, 4, 40, B.accent, easeOut((u - 0.3) / 0.3), 9);
    } else {   // inhouse: three crew members, centre one in a hard hat
      const k = spring(u, 300, 18);
      at(0, 6, 0.6 + 0.4 * k, 0, () => withAlpha(clamp(k * 2), () => {
        ctx.lineWidth = 5; ctx.strokeStyle = B.ink; ctx.lineCap = 'round';
        for (const [x, y, s] of [[-34, 6, 0.78], [34, 6, 0.78], [0, 0, 1]]) {
          ctx.fillStyle = s === 1 ? B.card : hexA(B.card, 1);
          ctx.beginPath(); ctx.arc(x, y + 40 * s, 30 * s, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.arc(x, y - 6 * s, 15 * s, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(0, -10, 17, Math.PI, Math.PI * 2); ctx.closePath(); ctx.fillStyle = B.accent; ctx.fill();
        ctx.fillRect(-23, -12, 46, 6);
      }));
    }
  },
  draw(t, c, E) {
    const B = E.B, me = TPL.trustBadges, kind = me.COPY[c.kind] ? c.kind : 'years', copy = me.COPY[kind](c);
    const top = c.top ?? copy.top, big = c.big ?? copy.big, sub = c.sub ?? copy.sub;
    const up = life(t, c.dur, 0.3, 220, 21); if (up <= 0.001) return;
    ctx.globalAlpha = clamp(up * 1.5);
    const cw = 900, chh = 280, x0 = (E.W - cw) / 2 + (1 - up) * -60, y0 = c.y, mr = 112, mx = x0 + 40 + mr, my = y0 + chh / 2;
    card(x0, y0, cw, chh, 36, B.card);
    // medallion
    const m = spring(t - 0.08, 200, 14), shine = seg(t, 1.3, 1.85), bump = 1 + 0.05 * Math.sin(Math.PI * seg(t, 1.3, 1.6));
    if (m > 0.001) at(mx, my, (0.3 + 0.7 * m) * bump, (1 - m) * -1.4, () => {
      if (kind === 'warranty') {   // ribbon tails behind the seal
        for (const d of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(d * -6, 60); ctx.lineTo(d * 40, 44); ctx.lineTo(d * 76, 116); ctx.lineTo(d * 52, 110); ctx.lineTo(d * 32, 134); ctx.closePath();
          ctx.fillStyle = d < 0 ? B.sky : hexA(B.sky, 0.82); ctx.save(); ctx.shadowColor = 'rgba(0,10,30,0.4)'; ctx.shadowBlur = 10; ctx.fill(); ctx.restore();
        }
      }
      ctx.save(); ctx.shadowColor = 'rgba(0,10,30,0.45)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6; me.rosette(mr, B.ink); ctx.restore();
      circle(0, 0, mr * 0.84, B.card);
      ctx.save(); ctx.setLineDash([1, 11]); ctx.lineCap = 'round'; circle(0, 0, mr * 0.75, null, hexA(B.sky, 0.7), 4); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, mr * 0.7, 0, Math.PI * 2); ctx.clip();
      me.content(kind, t - 0.3, c, E, mr);
      if (shine > 0 && shine < 1) { ctx.rotate(0.5); const sx = lerp(-mr * 1.4, mr * 1.4, easeIO(shine)); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(sx - 18, -mr * 1.5, 36, mr * 3); }
      ctx.restore();
    });
    // text block, vertically centred in the card
    const tx = x0 + 300, tw = cw - 300 - 48;
    const bs = Math.min(66, ...big.map((l) => fitSize(l, 66, tw, { weight: 900 })));
    const lines = [];
    if (top) lines.push({ s: top, size: 30, col: B.sky, o: { weight: 700, spacing: 6 }, h: 46 });
    big.forEach((l) => lines.push({ s: l, size: bs, col: B.ink, o: { weight: 900 }, h: bs * 1.04 }));
    if (sub) lines.push({ s: sub, size: fitSize(sub, 32, tw, { weight: 700, spacing: 4 }), col: B.sky, o: { weight: 700, spacing: 4 }, h: 50 });
    const H = lines.reduce((a, l) => a + l.h, 0);
    let y = my - H / 2;
    lines.forEach((l, i) => {
      const a = spring(t - 0.28 - i * 0.1, 300, 22);
      y += l.h;
      if (a > 0.001) text(l.s, tx, y - (l.h - l.size * 0.76) / 2 - l.size * 0.04 + (1 - a) * 24, l.size, l.col, { ...l.o, shadow: false, alpha: clamp(a * 2) });
    });
  },
};
