// wh-worry-flip — the homeowner's worries stack in as question cards, one per VO beat (red "?" badge, a small jolt),
// hold, then each card flips over (a quick vertical card-flip, staggered) to its answer with a green tick.
// A kicker pill above swaps from cfg.kickerQ to cfg.kickerA on the first flip. 2–4 rows. ~8s.
// cfg.items = [{ q, a }] (answers must be the client's own script claims), cfg.beats = { q: [s, ...], flip: s, flipStep: s }.
TPL.whWorryFlip = {
  dur: 8.0,
  defaults: {
    kickerQ: 'MOST HOMEOWNERS WORRY', kickerA: 'WITH WORK HORSE PRO PAINTING',
    items: [
      { q: 'WILL THEY SHOW UP ON TIME?', a: 'SHOWS UP ON TIME' },
      { q: 'WILL THEY PREP PROPERLY?', a: 'FULL PREP + PRESSURE WASH' },
      { q: 'WILL THEY CUT CORNERS?', a: 'DONE THE RIGHT WAY' },
      { q: 'WILL THE PAINT LAST?', a: 'DONE RIGHT THE FIRST TIME' },
    ],
    beats: { q: [0.1, 1.5, 2.9, 4.3], flip: 5.9, flipStep: 0.28 }, y: 430, rowH: 150, gap: 26,
  },
  draw(t, c, E) {
    const B = E.B, Bt = c.beats, items = c.items.slice(0, 4), cw = 940, x0 = (E.W - cw) / 2;
    ctx.globalAlpha = 1 - easeOut((t - (c.dur - 0.3)) / 0.3);
    // kicker pill (flips with the first card)
    const ka = spring(t - Bt.q[0] + 0.05, 260, 20);
    if (ka > 0.001) {
      const fu = seg(t, Bt.flip, Bt.flip + 0.36), sy = Math.abs(Math.cos(fu * Math.PI)), isA = fu >= 0.5;
      const s = isA ? c.kickerA : c.kickerQ, fs = fitSize(s, 40, 860, { weight: 900, spacing: 5 }), w = measure(s, fs, { weight: 900, spacing: 5 }) + 70;
      at(E.W / 2, c.y - 70, 1, 0, () => withAlpha(clamp(ka * 2), () => {
        ctx.scale(0.8 + 0.2 * ka, (0.8 + 0.2 * ka) * Math.max(0.02, sy));
        card(-w / 2, -44, w, 88, 44, isA ? B.accent : B.bad);
        text(s, 0, 15, fs, isA ? B.card : '#FFFFFF', { align: 'center', weight: 900, spacing: 5, shadow: false });
      }));
    }
    items.forEach((it, i) => {
      const b = Bt.q[i] ?? (Bt.q[0] + i * 1.4), a = spring(t - b, 300, 19); if (a <= 0.001) return;
      const ft = Bt.flip + 0.12 + i * Bt.flipStep, fu = seg(t, ft, ft + 0.36), sy = Math.abs(Math.cos(fu * Math.PI)), isA = fu >= 0.5;
      const y = c.y + 40 + i * (c.rowH + c.gap), jolt = (() => { const d = t - b - 0.12; return d > 0 && d < 0.25 ? Math.sin(d * 70) * 8 * (1 - d / 0.25) : 0; })();
      const dx = (1 - a) * 260 + jolt;
      at(E.W / 2 + dx, y + c.rowH / 2, 1, 0, () => withAlpha(clamp(a * 2), () => {
        ctx.scale(1, Math.max(0.02, sy));
        const hh = c.rowH, L = -cw / 2;
        card(L, -hh / 2, cw, hh, 34, isA ? B.card : hexA(B.dark, 0.94), isA ? { stroke: B.accent, lw: 5 } : { stroke: hexA(B.bad, 0.9), lw: 4 });
        // badge
        const bx = L + 40 + 44, pop = isA ? spring(t - ft - 0.18, 380, 16) : 1;
        if (isA) { circle(bx, 0, 44 * (0.6 + 0.4 * pop), B.good); check(bx - 1, 4, 44, B.card, easeOut((t - ft - 0.22) / 0.25), 9); }
        else { circle(bx, 0, 44, B.bad); text('?', bx, 22, 62, '#FFFFFF', { align: 'center', weight: 900, shadow: false }); }
        const s = isA ? it.a : it.q, maxW = cw - 40 - 88 - 36 - 40, fs = fitSize(s, 52, maxW, { weight: 900 });
        text(s, L + 40 + 88 + 36, fs * 0.36, fs, isA ? B.ink : '#FFFFFF', { weight: 900, shadow: false });
      }));
    });
  },
};
