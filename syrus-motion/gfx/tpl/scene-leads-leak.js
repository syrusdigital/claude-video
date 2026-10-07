// scene-leads-leak — for Syrus's own ads (opaque B-roll, 14s). Leads (little houses) pop out of ad cards, drop into a
// funnel and run down a glass pipe; most squirt out of four holes labelled "Slow response", "No follow-up",
// "Not qualified", "No-shows". Then Syrus patches every hole (call in minutes · follow up · qualify · confirm) and the
// leads flow through into the calendar as gold booked appointments.
// Captions: "MOST CONTRACTORS DON'T HAVE A LEAD PROBLEM." → "THEY HAVE A LEAK." → "SYRUS PLUGS THE LEAKS" → payoff.
// No numbers are shown — the flow is illustrative, not a statistic.
TPL.sceneLeadsLeak = {
  dur: 14,
  defaults: {
    caption1: "MOST CONTRACTORS DON'T|HAVE A LEAD PROBLEM.",
    caption2: 'THEY HAVE A ^LEAK.^',
    caption3: 'SYRUS PLUGS THE LEAKS',
    final: 'MORE LEADS BECOME|*BOOKED APPOINTMENTS*',
    holes: [
      { leak: 'Slow response', fix: 'Call in minutes' },
      { leak: 'No follow-up', fix: 'Follow up' },
      { leak: 'Not qualified', fix: 'Qualify' },
      { leak: 'No-shows', fix: 'Confirm' },
    ],
    beats: { c2: 4.35, patch: 7.7, patchGap: 0.36, c3: 7.6, flow: 8.75, flowGap: 0.24, final: 11.5 },
  },
  G: { pipeX: 540, pipeW: 128, pipeTop: 800, pipeBot: 1236, funTop: 652, funW: 600, holeY: [872, 970, 1068, 1166], v: 520, calY: 1262 },
  // every lead: spawn time, ad card, funnel x, the hole it leaks from (-1 = gets through)
  leads(c) {
    const b = c.beats, L = [], leakPat = [0, 1, 2, -1, 3, 0, 1, 2, 3, 0, 2, 1, -1, 3, 0, 1, 2, 3];
    leakPat.forEach((h, i) => { const R = RNG('lead', i); L.push({ s: 0.5 + i * 0.32, card: i % 3, fx: R.r(-200, 200), h, wob: R.r(0, 6) }); });
    for (let k = 0; k < 9; k++) { const R = RNG('lead2', k); L.push({ s: b.flow + k * b.flowGap, card: k % 3, fx: R.r(-200, 200), h: -1, wob: R.r(0, 6) }); }
    const S = TPL.sceneLeadsLeak, G = S.G;
    L.forEach((l) => {
      l.tPipe = l.s + 1.0;
      l.leakT = l.h >= 0 ? l.tPipe + (G.holeY[l.h] - G.pipeTop) / G.v : null;
      if (l.h >= 0 && l.leakT >= S.patchT(c, l.h)) l.leakT = null;   // hole already patched: it gets through
      l.tBot = l.tPipe + (G.pipeBot - G.pipeTop) / G.v;
    });
    const pass = L.filter((l) => l.leakT == null).sort((a, z) => a.tBot - z.tBot);
    pass.forEach((l, j) => { l.slot = j; });
    return L;
  },
  patchT(c, h) { return c.beats.patch + h * c.beats.patchGap; },
  slotXY(j) { const col = j % 6, row = Math.floor(j / 6); return [324 + col * 72 + 36, TPL.sceneLeadsLeak.G.calY + 74 + row * 58]; },
  draw(t, c, E) {
    const K = TPL.sceneKit, S = TPL.sceneLeadsLeak, G = S.G, b = c.beats, B = E.B;
    K.bg(t, E);
    const L = S.leads(c);
    K.cam(t, c.dur, () => {
      S.ads(t, c, E, L);
      S.calendar(t, c, E, L);
      S.pipe(t, c, E, L);
      L.forEach((l) => S.lead(t, c, E, l));
      S.holes(t, c, E, L);
    }, { z1: 1.04, fx: 540, fy: 960 });
    K.caption(t, 0.3, c.caption1, 400, E, { size: 58, t1: b.c2 - 0.25 });
    K.caption(t, b.c2, c.caption2, 430, E, { size: 76, t1: b.c3 - 0.25 });
    K.caption(t, b.c3, c.caption3, 430, E, { size: 64, t1: b.final - 0.25 });
    K.caption(t, b.final, c.final, 400, E, { size: 58 });
  },
  ads(t, c, E, L) {
    const K = TPL.sceneKit, B = E.B;
    [300, 540, 780].forEach((x, i) => {
      const ap = spring(t - 0.05 - i * 0.1, 240, 18); if (ap <= 0.001) return;
      let bump = 0; L.forEach((l) => { if (l.card === i) bump = Math.max(bump, Math.max(0, 1 - Math.abs(t - l.s) / 0.18)); });
      at(x, 560, ap * (1 + 0.1 * bump), 0, () => {
        card(-52, -46, 104, 92, 22, K.mix(B.card, B.sky, 0.12), { blur: 24, dy: 8, stroke: K.a(B.sky, 0.45), lw: 3 });
        rrect(-38, -32, 76, 40, 10); ctx.fillStyle = K.a(B.sky, 0.25); ctx.fill();
        K.poly([[-8, -22], [12, -12], [-8, -2]], B.ink);
        rrect(-38, 16, 52, 9, 4.5); ctx.fillStyle = K.a(B.ink, 0.5); ctx.fill(); rrect(-38, 30, 34, 7, 3.5); ctx.fillStyle = K.a(B.ink, 0.3); ctx.fill();
      });
    });
  },
  pipe(t, c, E, L) {
    const K = TPL.sceneKit, S = TPL.sceneLeadsLeak, G = S.G, B = E.B, x0 = G.pipeX - G.pipeW / 2, x1 = G.pipeX + G.pipeW / 2;
    const flowOK = seg(t, S.patchT(c, 3) + 0.2, S.patchT(c, 3) + 0.8);
    const glass = (P) => { ctx.beginPath(); ctx.moveTo(...P[0]); P.slice(1).forEach((p) => ctx.lineTo(...p)); ctx.closePath(); ctx.fillStyle = K.a(B.sky, 0.08 + 0.05 * flowOK); ctx.fill(); ctx.strokeStyle = K.a(B.sky, 0.55 + 0.35 * flowOK); ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.stroke(); };
    glass([[G.pipeX - G.funW / 2, G.funTop], [G.pipeX + G.funW / 2, G.funTop], [x1, G.pipeTop], [x1, G.pipeBot], [x0, G.pipeBot], [x0, G.pipeTop]]);
    // rim + glass highlights
    rrect(G.pipeX - G.funW / 2 - 14, G.funTop - 10, G.funW + 28, 20, 10); ctx.fillStyle = K.mix(B.sky, B.card, 0.35); ctx.fill();
    ctx.save(); ctx.globalAlpha *= 0.25; rrect(x0 + 14, G.pipeTop + 10, 10, G.pipeBot - G.pipeTop - 20, 5); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.restore();
    rrect(x0 - 10, G.pipeBot - 6, G.pipeW + 20, 18, 9); ctx.fillStyle = K.mix(B.sky, B.card, 0.35); ctx.fill();
  },
  holes(t, c, E, L) {
    const K = TPL.sceneKit, S = TPL.sceneLeadsLeak, G = S.G, B = E.B;
    c.holes.forEach((ho, h) => {
      const y = G.holeY[h], side = h % 2 ? -1 : 1, x = G.pipeX + side * G.pipeW / 2;
      const first = L.filter((l) => l.h === h && l.leakT != null).reduce((m, l) => Math.min(m, l.leakT), 99);
      const open = spring(t - first + 0.15, 260, 16), pt = S.patchT(c, h), pa = spring(t - pt, 300, 15);
      // the hole: ragged dark gash with a red glow while it leaks
      if (open > 0.001 && pa < 0.98) at(x, y, open, 0, () => {
        K.glow(0, 0, 70, B.bad, 0.35 * (1 - clamp(pa)) * (0.8 + 0.2 * Math.sin(t * 8)));
        K.poly([[-14, -30], [8, -22], [-2, -8], [14, 4], [-6, 14], [10, 30], [-16, 22], [-8, 4], [-20, -10]], '#0A1222');
      });
      // the label: red leak → sky fix
      const lx = G.pipeX + side * (G.pipeW / 2 + 30), ly = y - 50;
      const la = K.pop(t, first, 260, 19) * (1 - seg(t, pt - 0.05, pt + 0.15));
      K.chip(lx, ly, ho.leak, la, E, { size: 44, align: side > 0 ? 'left' : 'right', fill: K.mix(B.bad, B.dark, 0.25), color: '#FFFFFF' });
      const fa = K.pop(t, pt + 0.12, 260, 19);
      K.chip(lx, ly, ho.fix, fa, E, { size: 44, align: side > 0 ? 'left' : 'right', fill: B.card, stroke: B.sky, lw: 3, dot: B.good });
      // the patch plate slaps on
      if (pa > 0.001) at(x, y, 1.6 - 0.6 * clamp(pa) + 0.1 * (pa - clamp(pa)), 0, () => withAlpha(clamp(pa * 3), () => {
        card(-30, -42, 60, 84, 16, B.card, { blur: 16, dy: 6, stroke: B.sky, lw: 4 });
        [[-16, -28], [16, -28], [-16, 28], [16, 28]].forEach(([bx, by]) => circle(bx, by, 4.5, K.a(B.sky, 0.8)));
        check(0, 0, 26, B.good, clamp(seg(t, pt + 0.1, pt + 0.35)), 6);
      }));
    });
  },
  lead(t, c, E, l) {
    const K = TPL.sceneKit, S = TPL.sceneLeadsLeak, G = S.G, B = E.B, tau = t - l.s;
    if (tau < 0) return;
    let x, y, sc = 1, rot = 0, al = 1, red = 0;
    const cx = [300, 540, 780][l.card];
    if (tau < 0.6) { const u = easeOut(tau / 0.6); x = lerp(cx, G.pipeX + l.fx, u); y = lerp(560, G.funTop + 24, u) - Math.sin(u * Math.PI) * 90; sc = 0.4 + 0.6 * clamp(tau / 0.2); }
    else if (tau < 1.0) { const u = easeIn((tau - 0.6) / 0.4); x = lerp(G.pipeX + l.fx, G.pipeX, u); y = lerp(G.funTop + 24, G.pipeTop + 10, u); }
    else {
      x = G.pipeX + Math.sin(t * 5 + l.wob) * 6; y = G.pipeTop + 10 + (t - l.tPipe) * G.v;
      if (l.leakT != null && t >= l.leakT) {
        const u = t - l.leakT, side = l.h % 2 ? -1 : 1;
        x = G.pipeX + side * (G.pipeW / 2 * clamp(u * 6) + 300 * u - 60 * u * u); y = G.holeY[l.h] + 420 * u * u - 40 * u; rot = side * u * 2.2; red = clamp(u * 2.5); al = 1 - seg(u, 0.75, 1.25); sc = 1 + 0.15 * clamp(u * 4);
        if (al <= 0) return;
      } else if (y >= G.pipeBot - 10) {
        const u = clamp((t - l.tBot) / 0.4); if (u >= 1) return;
        const [sx, sy] = S.slotXY(l.slot); x = lerp(G.pipeX, sx, easeIO(u)); y = lerp(G.pipeBot - 10, sy, easeIO(u)) - Math.sin(u * Math.PI) * 30; sc = 1 - 0.4 * u;
      }
    }
    at(x, y, sc * 1.15, rot, () => withAlpha(al, () => { circle(0, 6, 26, 'rgba(0,8,24,0.35)'); K.icon.house(48, K.mix('#FFFFFF', B.bad, red * 0.7), K.mix(B.sky, B.bad, red), B.card); }));
  },
  calendar(t, c, E, L) {
    const K = TPL.sceneKit, S = TPL.sceneLeadsLeak, G = S.G, B = E.B, ap = spring(t - 0.2, 220, 19);
    if (ap <= 0.001) return;
    withAlpha(clamp(ap * 1.5), () => {
      card(300, G.calY, 480, 176, 26, K.mix(B.card, B.dark, 0.1), { blur: 30, dy: 10 });
      ctx.save(); rrect(300, G.calY, 480, 176, 26); ctx.clip(); ctx.fillStyle = K.mix(B.card, B.sky, 0.25); ctx.fillRect(300, G.calY, 480, 34); ctx.restore();
      [330, 750].forEach((x) => { rrect(x - 5, G.calY - 12, 10, 26, 5); ctx.fillStyle = B.sky; ctx.fill(); });
      for (let j = 0; j < 12; j++) {
        const [x, y] = S.slotXY(j); rrect(x - 30, y - 24, 60, 48, 10); ctx.fillStyle = K.a(B.ink, 0.07); ctx.fill();
        const l = L.find((q) => q.slot === j); if (!l) continue;
        const p = spring(t - l.tBot - 0.38, 320, 15); if (p <= 0.001) continue;
        at(x, y, p, 0, () => { K.glow(0, 0, 60, B.accent, 0.35); rrect(-30, -24, 60, 48, 10); ctx.fillStyle = B.accent; ctx.fill(); check(0, 1, 26, B.card, clamp(p * 1.3), 6); });
      }
    });
  },
};
