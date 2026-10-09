// checklist — "What's included": a navy card with a kicker, a title and the price in gold; the items arrive one per
// VO beat (the card grows to fit), each with an original line icon drawn in code, and each one ticks. 4–8 items. 5.5s.
// cfg.items = [{ icon, label }]   icon names: TPL.checklist.ICONS (vanity, toilet, walkin-shower, glass-door,
//   wall-surround, flooring, fixtures, lighting, cabinets, countertop, backsplash, demo, haul-away, cleanup, plumbing,
//   paint-roller, window, roof, tub, house). Unknown names fall back to a plain tick.
// cfg.beats = [s, s, ...] per item (seconds from item start), or cfg.start + cfg.step. cfg.y = card top.
TPL.checklist = {
  dur: 5.5,
  // Innovative Interiors — "$14,495 full bathroom". Price and inclusions are client-confirmed values.
  defaults: {
    kicker: "WHAT'S INCLUDED", title: 'Full bathroom', price: '$14,495',
    items: [
      { icon: 'walkin-shower', label: 'Walk-in shower' },
      { icon: 'glass-door', label: 'Glass shower door' },
      { icon: 'vanity', label: 'New vanity' },
      { icon: 'toilet', label: 'New toilet' },
      { icon: 'flooring', label: 'New flooring' },
      { icon: 'fixtures', label: 'New fixtures' },
      { icon: 'demo', label: 'Full tear-out & haul-away' },
    ],
    start: 0.55, step: 0.5, beats: null, y: 300,
  },
  // icon renderer: draws ICONS[name] in a -50..50 box centred on (x, y), s px wide, stroke lw px.
  icon(name, x, y, s, color, lw) {
    const f = TPL.checklist.ICONS[name] || TPL.checklist.ICONS.tick;
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 100, s / 100);
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw * 100 / s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const g = {
      l: (P) => { ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (const p of P.slice(1)) ctx.lineTo(p[0], p[1]); ctx.stroke(); },
      r: (x0, y0, w, h, r) => { rrect(x0, y0, w, h, r); ctx.stroke(); },
      c: (cx, cy, r) => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); },
      d: (cx, cy, r = 3.6) => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); },
      p: (fn, close) => { ctx.beginPath(); fn(ctx); if (close) ctx.closePath(); ctx.stroke(); },
      w: (k) => { ctx.lineWidth = lw * 100 / s * k; },
    };
    f(g); ctx.restore();
  },
  ICONS: {
    tick(g) { g.l([[-26, 0], [-8, 18], [28, -20]]); },
    vanity(g) {
      g.r(-38, 0, 76, 42, 5); g.l([[-46, 0], [46, 0]]); g.l([[0, 0], [0, 42]]); g.d(-8, 20); g.d(8, 20);
      g.p((c) => { c.moveTo(-32, -18); c.quadraticCurveTo(-30, -1, -8, -1); c.quadraticCurveTo(14, -1, 16, -18); }, true);
      g.p((c) => { c.moveTo(30, 0); c.lineTo(30, -30); c.quadraticCurveTo(30, -38, 22, -38); c.quadraticCurveTo(12, -38, 12, -30); c.lineTo(12, -27); });
    },
    toilet(g) {
      g.r(-38, -46, 24, 42, 5); g.l([[-32, -36], [-22, -36]]);
      g.p((c) => { c.moveTo(-38, -2); c.lineTo(38, -2); c.quadraticCurveTo(36, 22, 6, 26); c.lineTo(8, 44); c.lineTo(-22, 44); c.lineTo(-20, 25); c.quadraticCurveTo(-38, 20, -38, -2); }, true);
    },
    'walkin-shower'(g) {
      g.p((c) => { c.moveTo(-38, 44); c.lineTo(-38, -28); c.quadraticCurveTo(-38, -42, -24, -42); c.lineTo(4, -42); c.lineTo(4, -38); });
      g.p((c) => c.arc(4, -26, 13, Math.PI, Math.PI * 2), true);
      for (const [x, k] of [[-5, -1], [4, 0], [13, 1]]) { g.l([[x + k * 1, -13], [x + k * 3, -3]]); g.l([[x + k * 5, 6], [x + k * 7, 16]]); }
      g.l([[-46, 44], [46, 44]]); g.l([[18, 36], [30, 36]]);
    },
    'glass-door'(g) {
      g.r(-30, -46, 60, 92, 4); g.w(1.5); g.l([[17, -10], [17, 12]]); g.w(1);
      g.l([[-18, -12], [-2, -30]]); g.l([[-18, 4], [6, -22]]);
    },
    'wall-surround'(g) {
      g.r(-42, -42, 84, 84, 6);
      for (const y of [-21, 0, 21]) g.l([[-42, y], [42, y]]);
      for (const [y0, xs] of [[-42, [-14, 14]], [-21, [-28, 0, 28]], [0, [-14, 14]], [21, [-28, 0, 28]]]) for (const x of xs) g.l([[x, y0], [x, y0 + 21]]);
    },
    flooring(g) {
      g.p((c) => { c.moveTo(-46, 40); c.lineTo(46, 40); c.lineTo(28, -24); c.lineTo(-28, -24); }, true);
      const bot = [-46, -23, 0, 23, 46], top = [-28, -14, 0, 14, 28], xat = (j, y) => top[j] + (bot[j] - top[j]) * (y + 24) / 64;
      for (let j = 1; j < 4; j++) g.l([[bot[j], 40], [top[j], -24]]);
      [-4, 18, 2, 24].forEach((y, j) => g.l([[xat(j, y), y], [xat(j + 1, y), y]]));
    },
    fixtures(g) {
      g.r(-24, -8, 22, 48, 5);
      g.p((c) => { c.moveTo(-2, 2); c.lineTo(22, 2); c.quadraticCurveTo(34, 2, 34, 14); c.lineTo(34, 18); });
      g.l([[-13, -8], [-13, -22], [12, -31]]); g.d(34, 31, 4.5);
    },
    lighting(g) {
      g.l([[0, -48], [0, -24]]);
      g.p((c) => { c.moveTo(-30, 6); c.lineTo(-14, -24); c.lineTo(14, -24); c.lineTo(30, 6); }, true);
      g.p((c) => c.arc(0, 6, 9, 0, Math.PI));
      g.l([[-22, 22], [-30, 32]]); g.l([[0, 26], [0, 38]]); g.l([[22, 22], [30, 32]]);
    },
    cabinets(g) {
      g.r(-40, -42, 80, 84, 6); g.l([[-40, -14], [40, -14]]); g.l([[0, -14], [0, 42]]);
      g.l([[-10, -28], [10, -28]]); g.l([[-9, 4], [-9, 18]]); g.l([[9, 4], [9, 18]]);
    },
    countertop(g) {
      g.p((c) => { c.moveTo(-46, -10); c.lineTo(-28, -28); c.lineTo(46, -28); c.lineTo(28, -10); }, true);
      g.l([[-46, -10], [-46, 0], [28, 0], [28, -10]]); g.l([[28, 0], [46, -18], [46, -28]]);
      g.w(0.6); g.p((c) => { c.moveTo(-26, -15); c.quadraticCurveTo(-8, -25, 6, -19); c.quadraticCurveTo(18, -14, 30, -24); }); g.w(1);
      g.l([[-40, 0], [-40, 42], [22, 42], [22, 0]]); g.l([[-9, 0], [-9, 42]]); g.d(-16, 14); g.d(-2, 14);
    },
    backsplash(g) {
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) g.r(-42 + i * 21 + 2, -42 + j * 21 + 2, 17, 17, 3);
      g.w(1.3); g.l([[-48, 10], [48, 10]]); g.w(1);
      g.l([[-40, 10], [-40, 44], [40, 44], [40, 10]]); g.l([[0, 10], [0, 44]]); g.d(-8, 24); g.d(8, 24);
    },
    demo(g) {
      g.p((c) => { c.moveTo(41.2, -9); c.lineTo(27.1, 5.2); c.lineTo(-1.2, -23); c.lineTo(12.9, -37.2); }, true);
      g.w(1.3); g.l([[12.9, -8.9], [-38, 42]]); g.w(1);
      g.l([[12, 46], [20, 32], [28, 40], [40, 26]]); g.r(34, 38, 8, 8, 1.5);
    },
    'haul-away'(g) {
      g.p((c) => { c.moveTo(-44, -8); c.lineTo(44, -8); c.lineTo(38, 30); c.lineTo(-38, 30); }, true);
      g.l([[-14, -8], [-12, 30]]); g.l([[14, -8], [12, 30]]);
      g.c(-26, 39, 7); g.c(26, 39, 7);
      g.l([[-22, -8], [-32, -32]]); g.l([[0, -8], [10, -36]]); g.r(18, -26, 17, 17, 2);
    },
    cleanup(g) {
      g.l([[36, -46], [3, 1]]);
      g.p((c) => { c.moveTo(-8, -6); c.lineTo(14, 8); c.lineTo(-2, 34); c.lineTo(-34, 14); }, true);
      for (const u of [0.33, 0.66]) g.l([[-8 + 22 * u, -6 + 14 * u], [-34 + 32 * u, 14 + 20 * u]]);
      g.l([[34, 18], [34, 38]]); g.l([[24, 28], [44, 28]]); g.l([[42, 2], [42, 10]]); g.l([[38, 6], [46, 6]]);
    },
    plumbing(g) {
      g.p((c) => { c.moveTo(-28, -46); c.lineTo(-28, 6); c.arc(0, 6, 28, Math.PI, 0, true); c.lineTo(28, -12); c.lineTo(46, -12); });
      g.p((c) => { c.moveTo(-12, -46); c.lineTo(-12, 6); c.arc(0, 6, 12, Math.PI, 0, true); c.lineTo(12, -28); c.lineTo(46, -28); });
      g.l([[-33, -32], [-7, -32]]); g.l([[36, -33], [36, -7]]);
    },
    'paint-roller'(g) {
      g.r(-42, -42, 66, 26, 9); g.l([[24, -29], [36, -29], [36, -6], [-4, -6], [-4, 8]]); g.r(-11, 8, 14, 36, 6);
    },
    window(g) {
      g.r(-34, -42, 68, 80, 4); g.l([[0, -42], [0, 38]]); g.l([[-34, -2], [34, -2]]); g.l([[-42, 45], [42, 45]]);
      g.w(0.6); g.l([[-24, -20], [-14, -32]]); g.w(1);
    },
    roof(g) {
      g.l([[-48, 6], [0, -38], [48, 6]]);
      g.l([[-36, -4], [-36, 42], [36, 42], [36, -4]]);
      g.l([[20, -20], [20, -38], [31, -38], [31, -10]]);
      g.l([[-22, -18], [22, -18]]); g.l([[-33, -6], [33, -6]]);
      g.r(-8, 20, 16, 22, 2);
    },
    tub(g) {
      g.p((c) => { c.moveTo(-46, -2); c.lineTo(46, -2); c.lineTo(42, 18); c.quadraticCurveTo(38, 30, 24, 30); c.lineTo(-24, 30); c.quadraticCurveTo(-38, 30, -42, 18); }, true);
      g.l([[-30, 30], [-34, 40]]); g.l([[30, 30], [34, 40]]);
      g.p((c) => { c.moveTo(-38, -2); c.lineTo(-38, -32); c.quadraticCurveTo(-38, -42, -28, -42); c.lineTo(-20, -42); c.lineTo(-20, -34); });
    },
    house(g) {
      g.p((c) => { c.moveTo(0, -44); c.lineTo(44, -6); c.lineTo(34, -6); c.lineTo(34, 40); c.lineTo(-34, 40); c.lineTo(-34, -6); c.lineTo(-44, -6); }, true);
      g.r(-9, 14, 18, 26, 3);
    },
  },
  draw(t, c, E) {
    const B = E.B, me = TPL.checklist, items = c.items.slice(0, 8), n = items.length;
    if (!n) return;
    const beats = items.map((_, i) => (c.beats && c.beats[i] != null) ? c.beats[i] : c.start + i * c.step);
    const last = Math.max(...beats);
    const up = life(t, c.dur, 0.35, 200, 21); if (up <= 0.001) return;
    const cw = 900, pad = 56, x0 = (E.W - cw) / 2, y0 = c.y + (1 - up) * 120;
    const rowH = Math.min(132, Math.max(100, 860 / n)), head = 236;
    const grow = beats.reduce((a, b) => a + spring(t - b + 0.05, 240, 24), 0);
    const ch = head + grow * rowH + 30;
    ctx.globalAlpha = clamp(up * 1.5);
    card(x0, y0, cw, ch, 36, B.card);
    // header: kicker, title, price (gold) + its underline once the last item has ticked
    text(c.kicker, x0 + pad, y0 + 84, 34, B.sky, { weight: 700, spacing: 6, shadow: false });
    const pw = measure(c.price, 76, { weight: 900 });
    const ts = fitSize(c.title, 64, cw - pad * 2 - pw - 36, { weight: 900 });
    text(c.title, x0 + pad, y0 + 170, ts, B.ink, { weight: 900, shadow: false });
    const pp = spring(t - 0.2, 260, 18);
    at(x0 + cw - pad, y0 + 170, 0.85 + 0.15 * pp, 0, () => text(c.price, 0, 0, 76, B.accent, { weight: 900, align: 'right', shadow: false, alpha: clamp(pp * 2) }));
    const u = easeOut((t - last - 0.4) / 0.4);
    if (u > 0) { rrect(x0 + cw - pad - pw, y0 + 190, pw * u, 10, 5); ctx.fillStyle = B.accent; ctx.fill(); }
    ctx.fillStyle = hexA(B.ink, 0.14); ctx.fillRect(x0 + pad, y0 + head - 18, cw - pad * 2, 2);
    // rows (clipped to the growing card)
    ctx.save(); rrect(x0, y0, cw, ch, 36); ctx.clip();
    items.forEach((it, i) => {
      const b = beats[i], a = spring(t - b, 300, 21); if (a <= 0.001) return;
      const cy = y0 + head + i * rowH + rowH / 2, dx = (1 - a) * -50;
      withAlpha(clamp(a * 1.6), () => {
        if (i > 0) { ctx.fillStyle = hexA(B.ink, 0.07); ctx.fillRect(x0 + pad + 112, cy - rowH / 2, cw - pad * 2 - 112, 2); }
        at(x0 + pad + 42 + dx, cy, 0.7 + 0.3 * a, 0, () => {
          rrect(-42, -42, 84, 84, 22); ctx.fillStyle = hexA(B.sky, 0.14); ctx.fill();
          me.icon(it.icon, 0, 0, 56, B.sky, 4.5);
        });
        const lx = x0 + pad + 84 + 28 + dx, maxW = cw - pad * 2 - 84 - 28 - 64 - 24;
        const ls = fitSize(it.label, 46, maxW, { weight: 700 });
        text(it.label, lx, cy + ls * 0.36, ls, B.ink, { weight: 700, shadow: false });
        const kx = x0 + cw - pad - 30, k = spring(t - b - 0.12, 420, 20), tick = easeOut((t - b - 0.17) / 0.22);
        circle(kx, cy, 30, null, hexA(B.ink, 0.25), 4);
        if (k > 0.001) circle(kx, cy, 30 * k, B.good);
        if (tick > 0) check(kx - 1, cy + 3, 30, B.card, tick, 7);
      });
    });
    ctx.restore();
  },
};
