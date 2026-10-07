// scene-one-team — split screen (opaque B-roll, 12s). Left "3 different subcontractors": plumber / tile / electrician
// bookings on a 3-week calendar double-book, clash red, get bumped, leave lost days behind, and the finish flag keeps
// slipping. Right "One in-house team": one crew bar grows steadily day by day (same team does every trade), each day
// checks off, the flag lands on time. Left dims, the closing line lands. For clients with an in-house crew (the
// client confirms they don't sub out). No day counts are shown as facts — the comparison is illustrative.
TPL.sceneOneTeam = {
  dur: 12,
  defaults: {
    left: '3 DIFFERENT|SUBCONTRACTORS', right: 'ONE IN-HOUSE|TEAM',
    leftStatus: 'DAYS SLIPPING', rightStatus: 'ON SCHEDULE',
    final: 'ONE TEAM.|*START TO FINISH.*',
    days: ['M', 'T', 'W', 'T', 'F'],
    beats: { final: 8.4 },
  },
  // left schedule keyframes: [time, week, day, length]
  subs: [
    { icon: 'wrench', col: '#5AA9E6', keys: [[1.0, 0, 0, 2], [2.4, 0, 0, 3]] },
    { icon: 'tile', col: '#E3A458', keys: [[1.25, 0, 2, 2], [3.25, 1, 0, 2], [5.5, 1, 0, 3]] },
    { icon: 'bolt', col: '#B58BE6', keys: [[1.5, 0, 4, 1], [4.1, 1, 1, 1], [5.0, 1, 4, 1], [6.5, 2, 1, 1]] },
  ],
  state(keys, t) {   // interpolated [week, day, len, appear]
    if (t < keys[0][0]) return null;
    let k = 0; while (k < keys.length - 1 && t >= keys[k + 1][0]) k++;
    const a = keys[k], ap = spring(t - keys[0][0], 260, 17);
    if (k === 0) return [a[1], a[2], a[3], ap];
    const pv = keys[k - 1], u = easeIO(seg(t, a[0], a[0] + 0.55));
    return [lerp(pv[1], a[1], u), lerp(pv[2], a[2], u), lerp(pv[3], a[3], u), ap];
  },
  draw(t, c, E) {
    const K = TPL.sceneKit, S = TPL.sceneOneTeam, b = c.beats, B = E.B;
    K.bg(t, E);
    const fin = easeIO(seg(t, b.final, b.final + 0.6));
    K.cam(t, c.dur, () => {
      // panel tints + divider
      const chaos = seg(t, 2.4, 6.5);
      [[0, B.bad, 0.03 + 0.06 * chaos], [542, B.sky, 0.04 + 0.03 * seg(t, 1, 6)]].forEach(([x, col, al]) => {
        const gr = ctx.createLinearGradient(0, 260, 0, 1260); gr.addColorStop(0, K.a(col, 0)); gr.addColorStop(0.25, K.a(col, al)); gr.addColorStop(0.8, K.a(col, al)); gr.addColorStop(1, K.a(col, 0));
        ctx.fillStyle = gr; ctx.fillRect(x, 260, 538, 1000);
      });
      line(partial([[540, 330], [540, 1200]], easeOut(seg(t, 0.1, 0.8))), K.a(B.sky, 0.35), 4);
      // calendars
      const cl = spring(t - 0.5, 200, 20), cr = spring(t - 0.7, 200, 20);
      withAlpha(1 - 0.6 * fin, () => S.calendar(t, c, E, 20, cl, 'left'));
      S.calendar(t, c, E, 560, cr, 'right', fin);
      // status lines
      const ls = K.pop(t, 3.5, 240, 18), rs = K.pop(t, 5.75, 240, 18);
      withAlpha(1 - 0.6 * fin, () => K.chip(270, 1158, c.leftStatus, ls, E, { size: 44, fill: K.mix(B.bad, B.dark, 0.35), color: '#FFFFFF', dot: '#FFFFFF' }));
      K.chip(810, 1158, c.rightStatus, rs, E, { size: 44, fill: K.mix(B.good, B.dark, 0.45), color: '#FFFFFF', dot: '#FFFFFF' });
    }, { z1: 1.04, fx: 540, fy: 900 });
    // headers (screen-fixed so the camera never crops them)
    K.caption(t, 0.2, c.left, 380, E, { size: 50, x: 270, maxW: 510, lh: 1.14 });
    K.caption(t, 0.45, c.right, 380, E, { size: 50, x: 810, maxW: 510, lh: 1.14 });
    [[270, B.bad, 0.5], [810, B.sky, 0.75]].forEach(([x, col, d]) => { const u = easeOut(seg(t, d, d + 0.4)); if (u > 0) { rrect(x - 90 * u, 474, 180 * u, 8, 4); ctx.fillStyle = col; ctx.fill(); } });
    // closing line
    if (fin > 0) {
      const a = K.pop(t, b.final, 220, 20);
      withAlpha(a, () => card(110, 1232 + (1 - clamp(a)) * 30, 860, 206, 40, B.card, { blur: 40, dy: 14, stroke: K.a(B.sky, 0.5), lw: 3 }));
      K.caption(t, b.final + 0.15, c.final, 1312, E, { size: 66, lh: 1.12 });
    }
  },
  calendar(t, c, E, x0, ap, side, fin = 0) {
    const K = TPL.sceneKit, S = TPL.sceneOneTeam, B = E.B;
    if (ap <= 0.001) return;
    const W = 500, y0 = 520, H = 584, cw = 88, gx = x0 + (W - 5 * cw) / 2, rh = 152, gy = y0 + 100;
    const cell = (w, d) => [gx + d * cw, gy + w * rh];
    withAlpha(clamp(ap * 1.5), () => at(0, (1 - clamp(ap)) * 60, 1, 0, () => {
      card(x0, y0, W, H, 34, K.mix(B.card, B.dark, 0.15), { blur: 40, dy: 14, stroke: side === 'right' && fin > 0 ? K.a(B.sky, fin) : null, lw: 4 });
      c.days.forEach((d, i) => text(d, gx + i * cw + cw / 2, y0 + 66, 36, K.a(B.ink, 0.6), { align: 'center', weight: 800, shadow: false }));
      for (let w = 0; w < 3; w++) for (let d = 0; d < 5; d++) { const [x, y] = cell(w, d); rrect(x + 4, y + 4, cw - 8, rh - 8, 12); ctx.fillStyle = K.a(B.ink, 0.05); ctx.fill(); }
      if (side === 'left') S.chaos(t, c, E, cell, cw, rh); else S.calm(t, c, E, cell, cw, rh);
    }));
  },
  glyph(kind, s, col) { const I = TPL.sceneKit.icon; if (kind === 'wrench') I.wrench(s, col); else if (kind === 'tile') I.tile(s * 0.8, col); else if (kind === 'bolt') I.bolt(s, col); else I.hardhat(s, col, TPL.sceneKit.shade(col, -0.3)); },
  chaos(t, c, E, cell, cw, rh) {
    const K = TPL.sceneKit, S = TPL.sceneOneTeam, B = E.B;
    // lost days: cells a trade was booked on and left empty
    [[3.35, 0, 2], [3.45, 0, 3], [4.2, 0, 4], [5.1, 1, 1], [6.6, 1, 4]].forEach(([tt, w, d]) => {
      const u = easeOut(seg(t, tt, tt + 0.3)); if (u <= 0) return;
      const [x, y] = cell(w, d); ctx.save(); rrect(x + 4, y + 4, cw - 8, rh - 8, 12); ctx.clip(); ctx.globalAlpha *= u;
      ctx.fillStyle = K.a(B.bad, 0.16); ctx.fillRect(x, y, cw, rh); ctx.strokeStyle = K.a(B.bad, 0.4); ctx.lineWidth = 4;
      for (let k = -rh; k < cw; k += 18) { ctx.beginPath(); ctx.moveTo(x + k, y + rh); ctx.lineTo(x + k + rh, y); ctx.stroke(); }
      ctx.restore();
    });
    // bars
    const drawn = [];
    S.subs.forEach((sb) => {
      const st = S.state(sb.keys, t); if (!st) return;
      const [w, d, len, ap] = st, [x, y] = cell(w, d);
      const overlap = drawn.find((o) => Math.abs(o.w - w) < 0.3 && d < o.d + o.len - 0.2 && o.d < d + len - 0.2);
      const yy = y + (overlap ? 78 : 26), shake = overlap ? Math.sin(t * 40) * 3 : 0;
      at(x + shake, yy, 0.6 + 0.4 * clamp(ap), 0, () => withAlpha(clamp(ap * 2), () => {
        K.box(6, 0, len * cw - 12, 54, 27, sb.col, { band: 0.2, hl: 0.3, shadow: true, blur: 16, dy: 6 });
        circle(33, 27, 22, K.shade(sb.col, -0.35)); at(33, 27, 1, 0, () => S.glyph(sb.icon, 30, '#FFFFFF'));
        if (overlap) { rrect(2, -4, len * cw - 4, 62, 31); ctx.strokeStyle = B.bad; ctx.lineWidth = 5; ctx.stroke(); }
      }));
      if (overlap) {   // clash badge on the double-booked cell
        const cx = x + (Math.max(d, overlap.d) - d) * cw + cw / 2, pul = 1 + 0.15 * Math.sin(t * 12);
        at(cx, y + 12, pul, 0, () => { circle(0, 0, 21, B.bad); text('!', 0, 11, 30, '#FFFFFF', { align: 'center', weight: 900, shadow: false }); });
      }
      drawn.push({ w, d, len });
    });
    // finish flag: sits on the last booked day, turns red as it slips past the plan
    let end = -1; drawn.forEach((o) => { end = Math.max(end, o.w * 5 + o.d + o.len - 1); });
    if (end >= 0) {
      const fw = Math.floor(end / 5), fd = end - fw * 5, [x, y] = cell(fw, fd), late = clamp((end - 4) / 1);
      S.flag(x + cw - 18, y + rh - 14, K.mix(B.ink, B.bad, late), spring(t - 1.6, 260, 16));
    }
  },
  calm(t, c, E, cell, cw, rh) {
    const K = TPL.sceneKit, S = TPL.sceneOneTeam, B = E.B;
    const t0 = 1.0, per = 0.92, prog = clamp((t - t0) / per, 0, 5), days = Math.floor(prog), part = easeIO(prog - days);
    if (t < t0) return;
    const len = Math.min(5, days + part), [x, y] = cell(0, 0);
    K.box(x + 6, y + 26, Math.max(54, len * cw - 12), 54, 27, B.sky, { band: 0.2, hl: 0.3, shadow: true, blur: 16, dy: 6 });
    // same crew, every trade: icons ride inside the bar
    ['wrench', 'wrench', 'tile', 'tile', 'bolt'].forEach((k, i) => { if (len > i + 0.55) withAlpha(seg(len, i + 0.55, i + 0.85), () => at(x + i * cw + cw / 2, y + 53, 1, 0, () => S.glyph(k, 28, B.card))); });
    // crew badge at the leading edge
    at(x + Math.max(54, len * cw - 12) - 21, y + 53, 1, 0, () => { circle(0, 0, 28, B.card); circle(0, 0, 23, B.ink); at(0, 2, 1, 0, () => S.glyph('hat', 32, B.card)); });
    // a check under every finished day
    for (let i = 0; i < 5; i++) {
      const p = spring(t - t0 - (i + 1) * per, 300, 15); if (p <= 0.001) continue;
      const [cx, cy] = cell(0, i); at(cx + cw / 2, cy + 116, p, 0, () => { circle(0, 0, 20, B.good); check(0, 1, 21, '#FFFFFF', clamp(p * 1.4), 4.5); });
    }
    const [fx, fy] = cell(0, 4);
    S.flag(fx + cw - 18, fy + rh - 14, B.good, spring(t - 1.6, 260, 16));
  },
  flag(x, y, col, a) {
    if (a <= 0.001) return;
    at(x, y, a, 0, () => { line([[0, 0], [0, -46]], '#FFFFFF', 4); TPL.sceneKit.poly([[2, -46], [30, -37], [2, -27]], col); });
  },
};
