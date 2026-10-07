// scene-speed-to-lead — for Syrus's own ads (opaque B-roll, 12s). A phone gets a new-lead notification → a stopwatch
// races 5 MIN → 1 HOUR → NEXT DAY while the "chance of booking" bars step down and the lead cools → the watch rewinds:
// Syrus calls in under 5 minutes, the first bar stays tall → a calendar slot books in gold.
// CLAIMS: "under 5 minutes" is a Syrus service claim — keep it only while it is true for the account (cfg.c3).
// The bar heights (cfg.bars) are an ILLUSTRATIVE shape, not data: no numbers are drawn. Only if cfg.stat is supplied
// ({ text, source }) with a real, sourced figure does a statistic appear (its source line is drawn under the chart).
TPL.sceneSpeedToLead = {
  dur: 12,
  defaults: {
    c1: 'A NEW LEAD|COMES IN',
    c2: 'THE FASTER YOU CALL,|THE MORE YOU BOOK.',
    c3: 'SYRUS CALLS IN|~UNDER 5 MINUTES~',
    final: 'CALLED FAST.|*APPOINTMENT BOOKED.*',
    times: ['5 MIN', '1 HOUR', 'NEXT DAY'], fast: 'UNDER 5 MIN',
    barLabels: ['5 min', '1 hour', 'Next day'],
    bars: [1.0, 0.52, 0.22],          // illustrative shape only (see header)
    chartLabel: 'CHANCE OF BOOKING',
    stat: null,                       // { text: '...', source: 'Source: ...' } — only a real, sourced figure
    slots: ['9:00', '11:30', '2:00'], bookSlot: 1,
    beats: { lead: 0.35, move: 1.75, race: 2.1, marks: [2.7, 3.95, 5.25], rewind: 6.35, call: 6.75, cal: 8.9, book: 9.55, c2: 1.95, c3: 6.35, final: 9.3 },
  },
  draw(t, c, E) {
    const K = TPL.sceneKit, S = TPL.sceneSpeedToLead, b = c.beats, B = E.B;
    K.bg(t, E);
    const mv = easeIO(seg(t, b.move, b.move + 0.7));
    K.cam(t, c.dur, () => {
      // phone: centre stage, then steps to the left
      const pa = spring(t - 0.05, 200, 19);
      at(lerp(540, 268, mv), lerp(930, 772, mv) + (1 - clamp(pa)) * 300, lerp(1, 0.72, mv), lerp(0, -0.04, mv), () => withAlpha(clamp(pa * 2), () => S.phone(t, c, E)));
      S.watch(t, c, E);
      S.calendar(t, c, E);
      S.chart(t, c, E);
    }, { z1: 1.04, fx: 540, fy: 960 });
    K.caption(t, 0.25, c.c1, 392, E, { size: 64, t1: b.c2 - 0.2 });
    K.caption(t, b.c2, c.c2, 392, E, { size: 60, t1: b.c3 - 0.2 });
    K.caption(t, b.c3, c.c3, 392, E, { size: 64, t1: b.final - 0.2 });
    K.caption(t, b.final, c.final, 392, E, { size: 62 });
  },
  phone(t, c, E) {
    const K = TPL.sceneKit, B = E.B, b = c.beats, w = 300, h = 590;
    const cool = seg(t, b.marks[0], b.marks[2] + 0.4) * (1 - seg(t, b.rewind, b.rewind + 0.3)), call = seg(t, b.call, b.call + 0.35);
    card(-w / 2, -h / 2, w, h, 48, '#0E1A2E', { blur: 50, dy: 20, shadowColor: 'rgba(0,6,20,0.6)', stroke: K.mix(B.card, B.sky, 0.3), lw: 5 });
    ctx.save(); rrect(-w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 36); ctx.clip();
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, K.mix(B.card, B.sky, 0.25)); g.addColorStop(1, K.mix(B.card, B.dark, 0.3)); ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
    rrect(-46, -h / 2 + 24, 92, 22, 11); ctx.fillStyle = '#0E1A2E'; ctx.fill();
    // notification card (new lead) — cools to grey while nobody calls
    const na = spring(t - b.lead, 260, 17) * (1 - call);
    if (na > 0.001) at(0, -120 + (1 - clamp(na)) * -60, 0.85 + 0.15 * clamp(na), 0, () => withAlpha(clamp(na * 2), () => {
      card(-130, -62, 260, 124, 24, K.mix('#FFFFFF', '#B9C2CC', cool), { blur: 20, dy: 8 });
      circle(-84, 0, 32, K.mix(B.sky, '#8D99A6', cool)); at(-84, 2, 1, 0, () => K.icon.house(38, '#FFFFFF', B.card, K.mix(B.sky, '#8D99A6', cool)));
      text('NEW LEAD', -40, -8, fitSize('NEW LEAD', 28, 152, { weight: 900 }), K.mix(B.card, '#5D6B7B', cool), { weight: 900, shadow: false });
      rrect(-40, 10, 120, 12, 6); ctx.fillStyle = K.a(B.card, 0.25); ctx.fill(); rrect(-40, 30, 82, 12, 6); ctx.fill();
      if (cool > 0.05) withAlpha(cool, () => at(112, -50, 1, 0, () => { circle(0, 0, 20, B.bad); line([[0, 0], [0, -10]], '#FFFFFF', 3.5); line([[0, 0], [8, 4]], '#FFFFFF', 3.5); }));
    }));
    // ping rings while it's fresh
    for (let k = 0; k < 3; k++) { const u = ((t - b.lead) * 0.9 + k / 3) % 1; if (t > b.lead && t < b.marks[0]) withAlpha((1 - u) * 0.5, () => { rrect(-130 - u * 40, -182 - u * 40, 260 + u * 80, 124 + u * 80, 24 + u * 20); ctx.strokeStyle = B.sky; ctx.lineWidth = 3; ctx.stroke(); }); }
    // call screen
    if (call > 0) withAlpha(call, () => {
      circle(0, -110, 64, K.a(B.ink, 0.15)); at(0, -106, 1, 0, () => K.icon.house(70, '#FFFFFF', B.sky, B.card));
      rrect(-80, -20, 160, 16, 8); ctx.fillStyle = K.a(B.ink, 0.5); ctx.fill(); rrect(-54, 8, 108, 12, 6); ctx.fillStyle = K.a(B.ink, 0.3); ctx.fill();
      for (let k = 0; k < 3; k++) { const u = ((t - b.call) * 1.1 + k / 3) % 1; withAlpha((1 - u) * 0.6, () => circle(0, 170, 44 + u * 70, null, B.sky, 4)); }
      circle(0, 170, 46, B.good);
      at(0, 170, 1, -0.6 + Math.sin(t * 14) * 0.08, () => { rrect(-26, -9, 52, 18, 9); ctx.fillStyle = '#FFFFFF'; ctx.fill(); rrect(-28, -16, 14, 22, 6); ctx.fill(); rrect(14, -16, 14, 22, 6); ctx.fill(); });
    });
    ctx.restore();
  },
  watch(t, c, E) {
    const K = TPL.sceneKit, B = E.B, b = c.beats;
    const ap = spring(t - b.race + 0.25, 230, 17) * (1 - easeIn(seg(t, b.cal - 0.1, b.cal + 0.25)));
    if (ap <= 0.001) return;
    // elapsed: races through the three marks, then rewinds to almost nothing
    const m = b.marks, el = t < m[0] ? lerp(0, 0.18, easeIO(seg(t, b.race, m[0]))) : t < m[1] ? lerp(0.18, 0.5, easeIO(seg(t, m[0] + 0.15, m[1]))) : lerp(0.5, 0.92, easeIO(seg(t, m[1] + 0.15, m[2])));
    const rw = easeIO(seg(t, b.rewind, b.rewind + 0.6)), e = lerp(el, 0.06, rw);
    const spins = t < b.rewind ? (t - b.race) * (1.2 + 2.2 * seg(t, m[0], m[2])) : lerp((b.rewind - b.race) * 3.4, 0, rw);
    at(780, 760, ap, 0, () => {
      K.box(-16, -150, 32, 30, 8, K.mix(B.card, B.sky, 0.3), { band: 0 }); K.box(-34, -168, 68, 22, 10, K.mix(B.card, B.sky, 0.3), { band: 0.3 });
      circle(0, 6, 128, 'rgba(0,8,24,0.4)'); circle(0, 0, 128, K.mix(B.card, B.sky, 0.3)); circle(0, 0, 114, '#F8F8F4');
      const late = seg(e, 0.2, 0.6), col = rw > 0.5 ? B.sky : K.mix(B.sky, B.bad, late);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 104, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * e); ctx.closePath(); ctx.fillStyle = K.a(col, 0.35); ctx.fill();
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; line([[Math.sin(a) * 92, -Math.cos(a) * 92], [Math.sin(a) * 104, -Math.cos(a) * 104]], B.card, i % 3 ? 3 : 6); }
      const ha = spins * Math.PI * 2; line([[0, 0], [Math.sin(ha) * 88, -Math.cos(ha) * 88]], col, 7); circle(0, 0, 10, B.card);
    });
    // checkpoint label
    const labs = c.times.map((s, i) => ({ s, t0: m[i], t1: i < 2 ? m[i + 1] : b.rewind }));
    labs.forEach((L, i) => K.chip(780, 952, L.s, K.pop(t, L.t0, 280, 18) * K.out(t, L.t1 - 0.1, 0.15) * ap, E, { size: 48, fill: i === 0 ? B.card : K.mix(B.bad, B.dark, 0.3), color: '#FFFFFF' }));
    K.chip(780, 952, c.fast, K.pop(t, b.rewind + 0.45, 260, 17) * ap, E, { size: 48, fill: B.card, stroke: B.sky, color: B.sky });
  },
  calendar(t, c, E) {
    const K = TPL.sceneKit, B = E.B, b = c.beats, ap = spring(t - b.cal, 220, 17);
    if (ap <= 0.001) return;
    at(780, 790, 0.8 + 0.2 * clamp(ap), 0, () => withAlpha(clamp(ap * 2), () => {
      card(-200, -190, 400, 380, 32, '#F8F8F4', { blur: 40, dy: 16 });
      ctx.save(); rrect(-200, -190, 400, 380, 32); ctx.clip(); ctx.fillStyle = B.card; ctx.fillRect(-200, -190, 400, 76); ctx.restore();
      [-140, 140].forEach((x) => { rrect(x - 7, -206, 14, 34, 7); ctx.fillStyle = B.sky; ctx.fill(); });
      rrect(-150, -160, 180, 18, 9); ctx.fillStyle = K.a('#FFFFFF', 0.85); ctx.fill();
      c.slots.forEach((s, i) => {
        const y = -82 + i * 92, bk = i === c.bookSlot ? spring(t - b.book, 300, 15) : 0;
        text(s, -170, y + 50, 34, K.a(B.card, 0.6), { weight: 800, shadow: false });
        rrect(-52, y + 8, 226, 64, 16); ctx.fillStyle = K.a(B.card, 0.08); ctx.fill();
        if (bk > 0.001) at(61, y + 40, bk, 0, () => {
          K.glow(0, 0, 150, B.accent, 0.45);
          rrect(-113, -32, 226, 64, 16); ctx.fillStyle = B.accent; ctx.fill();
          check(-70, 2, 30, B.card, clamp(seg(t, b.book + 0.1, b.book + 0.4)), 7);
          text('BOOKED', -40, 14, 38, B.card, { weight: 900, shadow: false });
          ctx.save(); rrect(-113, -32, 226, 64, 16); ctx.clip(); K.sheen(-113, -32, 226, 64, seg(t, b.book + 1.2, b.book + 1.9), 0.5); K.sheen(-113, -32, 226, 64, seg(t, b.book + 2.0, b.book + 2.6), 0.3); ctx.restore();
        });
      });
    }));
  },
  chart(t, c, E) {
    const K = TPL.sceneKit, B = E.B, b = c.beats, base = 1352, maxH = 218, xs = [330, 540, 750], bw = 138;
    const ap = spring(t - b.race, 220, 19); if (ap <= 0.001) return;
    const rw = seg(t, b.rewind + 0.3, b.rewind + 0.8);
    withAlpha(clamp(ap * 2), () => {
      text(c.stat ? c.stat.text : c.chartLabel, 540, 1040, c.stat ? 34 : 40, B.sky, { align: 'center', weight: 800, spacing: c.stat ? 0 : 5, shadow: false });
      line([[230, base + 2], [850, base + 2]], K.a(B.ink, 0.25), 4);
      xs.forEach((x, i) => {
        const g = spring(t - b.marks[i] - 0.05, 170, 15), h = Math.max(0, maxH * c.bars[i] * g);
        const col = i === 0 ? B.sky : i === 1 ? K.mix(B.sky, B.bad, 0.55) : B.bad, dim = i > 0 ? 1 - 0.7 * rw : 1;
        withAlpha(dim, () => {
          if (i === 0 && rw > 0) K.glow(x, base - h / 2, 200, B.sky, 0.35 * rw * (0.8 + 0.2 * Math.sin(t * 5)));
          if (h > 1) K.box(x - bw / 2, base - h, bw, h, 18, col, { band: 0.12, hl: 0.3 });
          text(c.barLabels[i], x, base + 52, 42, K.a(B.ink, g > 0.2 ? 0.9 : 0.3), { align: 'center', weight: 800, shadow: false });
        });
        if (i === 0 && rw > 0) { const p = spring(t - b.rewind - 0.5, 300, 13); at(x, base - h - 36, p, 0, () => { circle(0, 0, 24, B.good); check(0, 1, 24, '#FFFFFF', clamp(p * 1.3), 5); }); }
      });
      if (c.stat && c.stat.source) text(c.stat.source, 540, 1440, 26, K.a(B.ink, 0.6), { align: 'center', weight: 600, shadow: false });
    });
  },
};
