// wh-ba-stack — rapid before/after montage of REAL same-job pairs, stacked: BEFORE panel on top, AFTER panel below.
// For each pair the before lands, then the after wipes in left -> right behind a white edge and its gold pill pops;
// a soft flash cuts to the next pair. Opaque (paints the whole frame; captions are covered while it runs).
// Panels are wide (1000 x 730), so horizontal photos show almost whole; vertical ones crop to their middle (use fy).
// cfg.pairs = [{ b, a, fxB, fyB, fxA, fyA, tag }] (image names from ad.json "images"), cfg.each = seconds per pair,
// cfg.wipe = seconds into each pair before the after wipes in. Rule: only confirmed same-job pairs.
TPL.whBaStack = {
  dur: 5.1,
  defaults: { pairs: [{ b: 'before', a: 'after' }], each: 1.7, wipe: 0.35, wipeDur: 0.5, top: 170, ph: 730, gap: 30, bg: null },
  panel(img, x, y, w, h, z, fx, fy) {
    ctx.save(); rrect(x, y, w, h, 30); ctx.clip();
    ctx.fillStyle = '#05080f'; ctx.fillRect(x, y, w, h);
    drawCover(IMGS[img], x, y, w, h, { zoom: z, fx: fx ?? 0.5, fy: fy ?? 0.5 });
    ctx.restore();
  },
  pill(s, x, y, bg, fg, a) {
    if (a <= 0.01) return;
    const w = measure(s, 40, { weight: 900, spacing: 4 }) + 56;
    at(x + w / 2, y + 38, 0.7 + 0.3 * a, 0, () => withAlpha(clamp(a * 2), () => { card(-w / 2, -38, w, 76, 38, bg, { blur: 20, dy: 6 }); text(s, 0, 14, 40, fg, { align: 'center', weight: 900, spacing: 4, shadow: false }); }));
  },
  draw(t, c, E) {
    const B = E.B, me = TPL.whBaStack, n = c.pairs.length;
    ctx.globalAlpha = 1 - easeOut((t - (c.dur - 0.25)) / 0.25);
    ctx.fillStyle = c.bg || B.dark; ctx.fillRect(0, 0, E.W, E.H);
    const k = Math.min(n - 1, Math.floor(t / c.each)), lt = t - k * c.each, P = c.pairs[k];
    const pw = 1000, x0 = (E.W - pw) / 2, yT = c.top, yB = c.top + c.ph + c.gap, ph = c.ph;
    const tin = spring(t, 200, 21), slide = (1 - tin) * 1100;
    const span = k === n - 1 ? c.dur - k * c.each : c.each, z = 1.03 + 0.06 * clamp(lt / span);
    // top: BEFORE
    at(-slide, 0, 1, 0, () => {
      me.panel(P.b, x0, yT, pw, ph, z, P.fxB, P.fyB);
      me.pill('BEFORE', x0 + 26, yT + 26, '#FFFFFF', B.card, spring(lt - 0.05, 300, 20));
      if (P.tag) { const w = measure(P.tag, 34, { weight: 800, spacing: 4 }) + 44; card(x0 + pw - 26 - w, yT + 30, w, 68, 34, hexA(B.card, 0.9), { blur: 16, dy: 4 }); text(P.tag, x0 + pw - 26 - w / 2, yT + 76, 34, B.ink, { align: 'center', weight: 800, spacing: 4, shadow: false }); }
    });
    // bottom: dark until the AFTER wipes in
    at(slide, 0, 1, 0, () => {
      ctx.save(); rrect(x0, yB, pw, ph, 30); ctx.fillStyle = hexA('#000000', 0.45); ctx.fill(); ctx.restore();
      const u = easeIO(seg(lt, c.wipe, c.wipe + c.wipeDur)), xw = x0 + pw * u;
      if (u > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(x0, yB, pw * u, ph); ctx.clip(); me.panel(P.a, x0, yB, pw, ph, 1.1 - (z - 1.03), P.fxA, P.fyA); ctx.restore();
        if (u < 1) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 24; ctx.fillStyle = '#fff'; ctx.fillRect(xw - 4, yB, 8, ph); ctx.restore(); }
      }
      me.pill('AFTER', x0 + 26, yB + 26, B.accent, '#111111', spring(lt - c.wipe - c.wipeDur * 0.6, 300, 18));
    });
    // gold seam between the panels
    ctx.fillStyle = B.accent; ctx.fillRect(x0 + 60, yT + ph + c.gap / 2 - 3, (pw - 120) * clamp(tin), 6);
    // soft flash on each cut to the next pair
    if (k > 0 && lt < 0.16) { ctx.fillStyle = `rgba(255,255,255,${0.55 * (1 - lt / 0.16)})`; ctx.fillRect(0, 0, E.W, E.H); }
  },
};
