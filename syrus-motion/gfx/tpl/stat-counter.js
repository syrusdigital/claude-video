// stat-counter — a big number rolls up odometer-style (each digit column spins, slowing into place), lands with a gold
// flash + bump, the suffix pops on, a gold rule wipes under it. "19 YEARS IN BUSINESS", "500+ KITCHENS DONE",
// "7 DAYS START TO FINISH" (cfg.value, cfg.prefix, cfg.suffix, cfg.label). ~3s.
TPL.statCounter = {
  dur: 3.0,
  // CLIENT-CONFIRMED NUMBERS ONLY (years in business, jobs completed, timelines) — never round up or estimate a claim.
  defaults: { value: 19, prefix: '', suffix: '', label: 'YEARS IN BUSINESS', kicker: '', y: 620, beat: 0.25, count: 1.35 },
  wrap(str, size, maxW, o) {
    const out = []; let cur = '';
    for (const w of String(str).split(/\s+/)) { const s = cur ? cur + ' ' + w : w; if (cur && measure(s, size, o) > maxW) { out.push(cur); cur = w; } else cur = s; }
    if (cur) out.push(cur); return out;
  },
  draw(t, c, E) {
    const B = E.B, NO = { weight: 900 };
    const up = life(t, c.dur, 0.3, 200, 20); if (up <= 0.001) return;
    const val = Math.max(0, Math.round(Number(c.value) || 0)), D = String(val).length;
    // cells: prefix, digit columns (with thousands commas), suffix
    const cells = []; if (c.prefix) cells.push({ s: c.prefix });
    for (let p = D - 1; p >= 0; p--) { cells.push({ p }); if (p > 0 && p % 3 === 0) cells.push({ s: ',', p }); }
    const dw = (sz) => Math.max(...'0123456789'.split('').map((d) => measure(d, sz, NO)));
    const sufW = (sz) => (c.suffix ? measure(c.suffix, sz, NO) : 0);
    const widthAt = (sz) => cells.reduce((a, k) => a + (k.s ? measure(k.s, sz, NO) : dw(sz)), 0) + sufW(sz);
    const size = Math.min(300, 300 * 760 / widthAt(300)), cellW = dw(size), totalW = widthAt(size);
    const LO = { weight: 900, spacing: 3 };
    let ls = 60, lines = this.wrap(c.label, ls, 780, LO);
    if (lines.length > 2) { ls = 50; lines = this.wrap(c.label, ls, 780, LO).slice(0, 3); }
    // card + vertical layout
    const cw = 880, x0 = (E.W - cw) / 2, top = c.y + (1 - up) * 130;
    const kH = c.kicker ? 64 : 0, capN = size * 0.73;
    const yN = top + 70 + kH + capN, yRule = yN + (D > 3 ? 64 : 42), yL = yRule + 50 + ls * 0.73, lh = ls * 1.14;
    const ch = yL + (lines.length - 1) * lh + 66 - top;
    ctx.globalAlpha = clamp(up * 1.5);
    card(x0, top, cw, ch, 36, B.card);
    if (c.kicker) text(c.kicker, E.W / 2 + 3, top + 84, 34, B.sky, { align: 'center', weight: 700, spacing: 6, shadow: false });
    // the roll
    const u = seg(t, c.beat, c.beat + c.count), v = val * (1 - Math.pow(1 - u, 4)), land = c.beat + c.count, landed = t >= land;
    const fl = landed ? Math.exp(-(t - land) * 4.5) : 0, bump = 0.07 * Math.sin(seg(t, land, land + 0.32) * Math.PI);
    const col = landed ? B.accent : B.ink, rowH = size * 0.98;
    const nx0 = E.W / 2 - totalW / 2;
    at(E.W / 2, yN - capN / 2, 1 + bump, 0, () => at(-E.W / 2, -(yN - capN / 2), 1, 0, () => {
      ctx.save();
      if (fl > 0.01) { ctx.shadowColor = hexA(B.accent, 0.9 * fl); ctx.shadowBlur = 70 * fl; }
      let x = nx0;
      for (const k of cells) {
        if (k.s) {
          const a = k.p ? (landed ? 1 : clamp(0.1 + 0.9 * clamp(v - (10 ** k.p - 1)))) : 1;
          const w = measure(k.s, size, NO); text(k.s, x, yN, size, col, { weight: 900, alpha: a, shadow: false }); x += w; continue;
        }
        const p = k.p, base = 10 ** p, cx = x + cellW / 2;
        if (landed) { text(String(Math.floor(val / base) % 10), cx, yN, size, col, { align: 'center', weight: 900, shadow: false }); x += cellW; continue; }
        let d, fr;
        if (p === 0) { d = Math.floor(v) % 10; fr = v - Math.floor(v); }
        else { d = Math.floor(v / base) % 10; fr = clamp((v % base) - (base - 1)); }
        const a = p === 0 ? 1 : clamp(0.1 + 0.9 * clamp(v - (base - 1)));   // unreached leading columns stay ghosted
        ctx.save(); ctx.beginPath(); ctx.rect(x - 6, yN - size * 0.86, cellW + 12, rowH); ctx.clip();
        text(String(d), cx, yN - fr * rowH, size, col, { align: 'center', weight: 900, alpha: a, shadow: false });
        text(String((d + 1) % 10), cx, yN + (1 - fr) * rowH, size, col, { align: 'center', weight: 900, alpha: a, shadow: false });
        ctx.restore();
        x += cellW;
      }
      ctx.restore();
      // soft roll masks (card colour) at the top/bottom of the digit window while spinning
      if (!landed) {
        const x1 = nx0 + (c.prefix ? measure(c.prefix, size, NO) : 0), x2 = nx0 + totalW - sufW(size);
        const yt = yN - size * 0.86, yb = yt + rowH;
        let g = ctx.createLinearGradient(0, yt, 0, yt + size * 0.13); g.addColorStop(0, B.card); g.addColorStop(1, hexA(B.card, 0));
        ctx.fillStyle = g; ctx.fillRect(x1 - 8, yt, x2 - x1 + 16, size * 0.13);
        g = ctx.createLinearGradient(0, yb - size * 0.11, 0, yb); g.addColorStop(0, hexA(B.card, 0)); g.addColorStop(1, B.card);
        ctx.fillStyle = g; ctx.fillRect(x1 - 8, yb - size * 0.11, x2 - x1 + 16, size * 0.11);
      }
      // suffix pops on at the landing
      if (c.suffix) {
        const sp = spring(t - land + 0.02, 340, 15);
        if (sp > 0.001) { const sw = sufW(size), sx = nx0 + totalW - sw; at(sx + sw / 2, yN - capN / 2, sp, 0, () => text(c.suffix, 0, capN / 2, size, B.accent, { align: 'center', weight: 900, shadow: false, alpha: clamp(sp * 2) })); }
      }
    }));
    // gold rule wipes out from the centre
    const rw = (totalW - 20) * easeOut(seg(t, land + 0.08, land + 0.45));
    if (rw > 1) { rrect(E.W / 2 - rw / 2, yRule - 8, rw, 16, 8); ctx.fillStyle = B.accent; ctx.fill(); }
    // label
    const la = spring(t - c.beat - 0.15, 240, 21);
    if (la > 0.001) lines.forEach((s, i) => text(s, E.W / 2 + 1.5, yL + i * lh + (1 - la) * 24, ls, B.ink, { align: 'center', ...LO, shadow: false, alpha: clamp(la * 1.5) }));
  },
};
