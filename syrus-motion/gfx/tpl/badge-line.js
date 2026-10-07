// badge-line — 1–3 small navy badges pop in along the top of frame in ONE row, staggered one per beat: each has a gold
// check seated on its top edge and heavy caps balanced onto ≤2 lines (so three fit across a phone at 44px).
// A soft shine runs across them at ~1.6s. "FREE IN-HOME ESTIMATE", "NO PUSHY SALESMAN", "ITEMIZED PRICING" (cfg.items).
// cfg.layout 'pills' = one-line pills instead (wrap to centred rows when long). ~3s.
TPL.badgeLine = {
  dur: 3.0,
  // each badge must be something the client actually offers (no warranties/financing terms unless the client supplies them)
  defaults: { items: ['FREE IN-HOME ESTIMATE', 'NO PUSHY SALESMAN', 'ITEMIZED PRICING'], layout: 'row', y: 290, size: 44, beat: 0.15, stagger: 0.32 },
  split(s, size, O) {   // best 1- or 2-line break (smallest widest line)
    const w = String(s).split(/\s+/); let best = [s], bw = measure(s, size, O);
    for (let i = 1; i < w.length; i++) {
      const L = [w.slice(0, i).join(' '), w.slice(i).join(' ')], m = Math.max(measure(L[0], size, O), measure(L[1], size, O));
      if (m < bw - 1) { best = L; bw = m; }
    }
    return { lines: best, w: bw };
  },
  shine(t, i, x, y, w, h, r) {
    const su = seg(t, 1.5 + i * 0.14, 2.05 + i * 0.14); if (su <= 0 || su >= 1) return;
    ctx.save(); rrect(x, y, w, h, r); ctx.clip();
    const gx = lerp(x - 120, x + w + 120, easeIO(su)), g = ctx.createLinearGradient(gx - 70, 0, gx + 70, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.2)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.transform(1, 0, -0.4, 1, 0, 0); ctx.fillStyle = g; ctx.fillRect(gx - 70, y - 10, 140, h + 20); ctx.restore();
  },
  draw(t, c, E) {
    const B = E.B, O = { weight: 900, spacing: 1 }, items = c.items.slice(0, 3), MAXW = 960, GAP = 16;
    const leave = easeIn((t - (c.dur - 0.3)) / 0.3);
    const pop = (i) => spring(t - c.beat - i * c.stagger, 330, 17);
    if (c.layout === 'pills') return this.pills(t, c, E, items, leave, pop);
    // size the row: shrink (to 34px at most) until all tiles fit across
    let S = c.size, T;
    for (let k = 0; k < 12; k++) {
      T = items.map((s) => { const sp = this.split(s, S, O); return { ...sp, tw: sp.w + 52 }; });
      if (T.reduce((a, b) => a + b.tw, 0) + GAP * (T.length - 1) <= MAXW || S <= 34) break;
      S -= 2;
    }
    const nl = Math.max(...T.map((b) => b.lines.length)), lh = S * 1.14, IR = 30;
    const th = 50 + S * 0.73 + (nl - 1) * lh + 34;
    let x = (E.W - (T.reduce((a, b) => a + b.tw, 0) + GAP * (T.length - 1))) / 2;
    T.forEach((b, i) => {
      const bx = x; x += b.tw + GAP;
      const k = pop(i); if (k <= 0.001) return;
      const t0 = c.beat + i * c.stagger;
      withAlpha(clamp(k * 2) * (1 - leave), () => at(bx + b.tw / 2, c.y + th / 2 - 12 * leave, (0.55 + 0.45 * k) * (1 - 0.12 * leave), 0, () => {
        const X = -b.tw / 2, Y = -th / 2;
        card(X, Y, b.tw, th, 30, B.card, { blur: 26, dy: 10 });
        this.shine(t, i, X, Y, b.tw, th, 30);
        const ty = Y + 50 + S * 0.73 + ((nl - b.lines.length) * lh) / 2;
        b.lines.forEach((s, j) => text(s, 1, ty + j * lh, S, B.ink, { ...O, align: 'center', shadow: false }));
        ctx.save(); ctx.shadowColor = 'rgba(0,10,30,0.45)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4; circle(0, Y, IR, B.accent); ctx.restore();
        circle(0, Y, IR, null, B.card, 4);
        check(-1, Y + 2, IR * 1.05, B.card, easeOut(seg(t, t0 + 0.12, t0 + 0.34)), IR * 0.27);
      }));
    });
  },
  pills(t, c, E, items, leave, pop) {
    const B = E.B, S = c.size, O = { weight: 900, spacing: 1 }, MAXW = 960, GAP = 18, ROWG = 18;
    const h = Math.round(S * 2.05), ic = h - 24, padL = 12, padR = 36, gapI = 16;
    const P = items.map((s, i) => {
      const room = MAXW - padL - ic - gapI - padR, sz = Math.min(S, S * room / measure(s, S, O)), tw = measure(s, sz, O);
      return { s, i, sz, w: padL + ic + gapI + tw + padR };
    });
    const rows = []; let cur = [], rw = 0;
    for (const p of P) { if (cur.length && rw + GAP + p.w > MAXW) { rows.push(cur); cur = []; rw = 0; } rw += (cur.length ? GAP : 0) + p.w; cur.push(p); }
    if (cur.length) rows.push(cur);
    rows.forEach((r, j) => { let x = (E.W - r.reduce((a, p) => a + p.w, 0) - GAP * (r.length - 1)) / 2; for (const p of r) { p.x = x; p.y = c.y + j * (h + ROWG); x += p.w + GAP; } });
    for (const p of P) {
      const k = pop(p.i), t0 = c.beat + p.i * c.stagger; if (k <= 0.001) continue;
      withAlpha(clamp(k * 2) * (1 - leave), () => at(p.x + p.w / 2, p.y + h / 2 - 12 * leave, (0.55 + 0.45 * k) * (1 - 0.12 * leave), 0, () => {
        const x = -p.w / 2, y = -h / 2, icx = x + padL + ic / 2;
        card(x, y, p.w, h, h / 2, B.card, { blur: 26, dy: 10 });
        circle(icx, 0, ic / 2, B.accent);
        check(icx - 1, 2, ic * 0.52, B.card, easeOut(seg(t, t0 + 0.12, t0 + 0.34)), ic * 0.13);
        text(p.s, x + padL + ic + gapI, p.sz * 0.36, p.sz, B.ink, { ...O, shadow: false });
        this.shine(t, p.i, x, y, p.w, h, h / 2);
      }));
    }
  },
};
