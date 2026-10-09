// hook-text — kinetic hook text for the first ~2 seconds, white/gold heavy type with a dark keyline (reads over any
// footage). cfg.style:
//   'highlight' — words land one by one, then a gold marker swipes behind cfg.mark and the marked words flip to navy.
//   'stack'     — 2–4 short lines slam in stacked, each fitted to full width, alternating white / gold, with a jolt.
//                 cfg.lines overrides the automatic split of cfg.text.
//   'type'      — typewriter with a gold cursor (money words type in gold), then the last word punch-zooms in gold.
// cfg.y = centre of the text block. 2.5s.
TPL.hookText = {
  dur: 2.5,
  // a bathroom client's price-anchor hook; the quoted figure is a client-confirmed number.
  defaults: { style: 'highlight', text: 'BEEN QUOTED $13,000 TO REPLACE YOUR TUB?', mark: '$13,000', lines: null, size: 124, maxSize: 190, maxW: 940, y: 760, cps: 30, step: 0.11 },
  O: { weight: 900, stroke: 13, strokeColor: 'rgba(0,10,30,0.92)', blur: 24 },
  wrap(words, size, maxW) {
    const sp = size * 0.26, lines = []; let cur = [], w = 0;
    for (const wd of words) {
      const ww = measure(wd, size, { weight: 900 });
      if (cur.length && w + sp + ww > maxW) { lines.push(cur); cur = []; w = 0; }
      w += (cur.length ? sp : 0) + ww; cur.push(wd);
    }
    if (cur.length) lines.push(cur);
    return lines;
  },
  // phrase split: money words stand alone, other words pack into lines of <= 11 chars (falls back to width-wrap)
  split(words) {
    const lines = []; let cur = '';
    for (const w of words) { if (/[$0-9]/.test(w)) { if (cur) lines.push(cur); lines.push(w); cur = ''; } else if (cur && (cur + ' ' + w).length > 11) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }
    if (cur) lines.push(cur);
    return lines;
  },
  // lay words out centred; returns { size, lh, rows: [{ y, items: [{ s, i, x, w }] }] } with y = baseline
  layout(words, c, maxLines, breakLast, cx) {
    const me = TPL.hookText;
    let size = Math.min(c.size, ...words.map((w) => fitSize(w, c.size, c.maxW, { weight: 900 })));
    let lines = c.lines ? c.lines.map((l) => l.split(/\s+/).filter(Boolean)) : me.split(words).map((l) => l.split(' '));
    if (lines.length <= maxLines) size = Math.min(size, ...lines.map((l) => fitSize(l.join(' '), size, c.maxW, { weight: 900 })));
    else for (;;) {
      lines = me.wrap(words, size, c.maxW);
      if (lines.length <= maxLines || size < 64) break;
      size *= 0.93;
    }
    const lh = size * 1.06, sp = size * 0.26, extra = breakLast ? size * 0.12 : 0;
    const H = lh * lines.length + extra, top = c.y - H / 2;
    let idx = 0;
    const rows = lines.map((ln, r) => {
      const ws = ln.map((s) => measure(s, size, { weight: 900 })), tot = ws.reduce((a, b) => a + b, 0) + sp * (ln.length - 1);
      let x = cx - tot / 2;
      const items = ln.map((s, j) => { const it = { s, i: idx++, x, w: ws[j] }; x += ws[j] + sp; return it; });
      return { y: top + lh * (r + 1) - size * 0.2 + (r === lines.length - 1 ? extra : 0), items };
    });
    return { size, lh, rows };
  },
  draw(t, c, E) {
    const B = E.B, me = TPL.hookText, O = me.O;
    ctx.globalAlpha = 1 - easeOut((t - (c.dur - 0.25)) / 0.25);
    const words = c.text.split(/\s+/).filter(Boolean), money = (s) => /[$0-9]/.test(s);
    if (c.style === 'stack') {
      let lines = c.lines;
      if (!lines) lines = me.split(words);
      lines = lines.slice(0, 4);
      const sizes = lines.map((l) => Math.min(c.maxSize, fitSize(l, 400, c.maxW, { weight: 900 })));
      const H = sizes.reduce((a, s) => a + s * 0.9, 0) + 16 * (lines.length - 1);
      let jolt = 0; const ts = lines.map((_, i) => 0.05 + i * (c.lineStep ?? 0.3));   // cfg.lineStep: seconds between lines (time them to the VO)
      ts.forEach((ti) => { const d = t - ti - 0.07; if (d > 0 && d < 0.22) jolt += Math.sin(d * 75) * 11 * (1 - d / 0.22); });
      let y = c.y - H / 2 + jolt;
      lines.forEach((l, i) => {
        const s = sizes[i]; y += s * 0.9; const a = spring(t - ts[i], 520, 24);
        if (a > 0.001) withAlpha(clamp(a * 4), () => at(E.W / 2, y - s * 0.36, 1 + 0.45 * (1 - a), 0, () => text(l, 0, s * 0.36, s, i % 2 ? B.accent : '#FFFFFF', { ...O, align: 'center' })));
        y += 16;
      });
      return;
    }
    if (c.style === 'type') {
      const L = me.layout(words, c, 4, false, E.W / 2), s = L.size, all = L.rows.flatMap((r) => r.items.map((it) => ({ ...it, y: r.y })));
      let ci = 0; const starts = all.map((it) => { const st = ci; ci += it.s.length + 1; return st; });
      const total = ci - 1, typed = Math.floor(clamp((t - 0.05) * c.cps, 0, total)), tEnd = 0.05 + total / c.cps, tp = tEnd + 0.22;
      let cur = null;
      const lastIt = all[all.length - 1], k = t >= tp ? spring(t - tp, 300, 13) : 0, grow = 0.3 * k * lastIt.w / 2;
      all.forEach((it, j) => {
        const n = clamp(typed - starts[j], 0, it.s.length); if (n <= 0) return;
        const last = j === all.length - 1, str = it.s.slice(0, n), dx = it.y === lastIt.y ? -grow : 0;
        if (last && t >= tp) {
          at(it.x + it.w / 2, it.y - s * 0.36, 1 + 0.3 * k, 0, () => text(it.s, 0, s * 0.36, s, B.accent, { ...O, align: 'center' }));
        } else {
          const w = text(str, it.x + dx, it.y, s, money(it.s) ? B.accent : '#FFFFFF', O);
          cur = [it.x + w, it.y];
        }
      });
      if (!cur) cur = [all[0].x, all[0].y];
      const blink = t < tEnd + 0.02 || Math.floor((t - tEnd) * 4) % 2 === 1;
      if (t < tp && blink) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 12; rrect(cur[0] + 10, cur[1] - s * 0.8, 14, s * 0.92, 4); ctx.fillStyle = B.accent; ctx.fill(); ctx.restore(); }
      return;
    }
    // highlight
    const L = me.layout(words, c, 4, false, E.W / 2), s = L.size;
    const markW = (c.mark || '').split(/\s+/).filter(Boolean), norm = (x) => x.toUpperCase().replace(/[^A-Z0-9$]/g, '');
    const mi = new Set();
    for (let i = 0; markW.length && i + markW.length <= words.length; i++) if (markW.every((m, k) => norm(m) === norm(words[i + k]))) { markW.forEach((_, k) => mi.add(i + k)); break; }
    const tm = 0.08 + (words.length - 1) * c.step + 0.3, sw = easeIO(seg(t, tm, tm + 0.3));
    const segs = L.rows.map((r) => { const its = r.items.filter((it) => mi.has(it.i)); return its.length ? { y: r.y, x1: its[0].x - 18, x2: its[its.length - 1].x + its[its.length - 1].w + 18 } : null; }).filter(Boolean);
    const totW = segs.reduce((a, g) => a + g.x2 - g.x1, 0); let acc = 0;
    const pop = 1 + 0.06 * Math.sin(Math.PI * seg(t, tm + 0.3, tm + 0.52));
    segs.forEach((g) => {
      g.edge = g.x1 + clamp(sw * totW - acc, 0, g.x2 - g.x1); acc += g.x2 - g.x1;
      if (g.edge > g.x1 + 1) at((g.x1 + g.x2) / 2, g.y - s * 0.36, pop, -0.025, () => {
        ctx.save(); ctx.shadowColor = 'rgba(0,10,30,0.5)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 6;
        const cx = (g.x1 + g.x2) / 2, cy = g.y - s * 0.36; rrect(g.x1 - cx, -s * 0.6, g.edge - g.x1, s * 1.08, 14); ctx.fillStyle = B.accent; ctx.fill(); ctx.restore();
      });
    });
    L.rows.forEach((r) => r.items.forEach((it) => {
      const a = spring(t - 0.08 - it.i * c.step, 420, 21); if (a <= 0.001) return;
      const g = mi.has(it.i) ? segs.find((q) => q.y === r.y) : null, sc = (1.4 - 0.4 * a) * (g ? pop : 1);
      withAlpha(clamp(a * 3), () => at(it.x + it.w / 2, r.y - s * 0.36, sc, g ? -0.025 * clamp((t - tm) * 6) : 0, () => {
        const draw = (col, o) => text(it.s, 0, s * 0.36, s, col, { ...o, align: 'center' });
        if (!g || g.edge <= it.x) { draw('#FFFFFF', O); return; }
        const ex = g.edge - (it.x + it.w / 2);   // marker edge in local coords
        ctx.save(); ctx.beginPath(); ctx.rect(ex, -s * 2, s * 20, s * 4); ctx.clip(); draw('#FFFFFF', O); ctx.restore();
        ctx.save(); ctx.beginPath(); ctx.rect(-s * 20, -s * 2, s * 20 + ex, s * 4); ctx.clip(); draw(B.card, { weight: 900, shadow: false }); ctx.restore();
      }));
    }));
  },
};
