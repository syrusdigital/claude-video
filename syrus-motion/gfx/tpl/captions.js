// captions — word-by-word ad captions in the editors' house style: 1-3 word chunks pop in on a spring,
// the spoken word is white, emphasis words (prices, numbers, cfg.em list) go accent-gold and a step bigger.
// cfg.words = [{ w, t0, t1 }] in ABSOLUTE seconds (item.at should be 0). cfg.hide = [[a, b], ...] absolute
// windows with no captions (e.g. while a big price card is up). cfg.y = baseline centre.
TPL.captions = {
  dur: 60,
  defaults: { words: [], y: 1240, size: 84, maxChars: 16, maxWords: 3, em: [], hide: [], upper: true, style: 'pop' },
  draw(t, c, E) {
    const T = E.T;
    if (c.hide.some(([a, b]) => T >= a && T < b)) return;
    // chunk the words (cached on the cfg object — derived only from cfg, so frames stay independent)
    if (!c._chunks) {
      const ch = []; let cur = [];
      const flush = () => { if (cur.length) ch.push(cur); cur = []; };
      for (const w of c.words) {
        const s = w.w.replace(/\s+/g, '');
        if (!s) continue;
        if (/^[,.!?;:]/.test(s) && cur.length) { cur[cur.length - 1] = { ...cur[cur.length - 1], w: cur[cur.length - 1].w + s, t1: w.t1 }; if (/[.!?,]$/.test(s)) flush(); continue; }
        const len = cur.reduce((a, x) => a + x.w.length + 1, 0) + s.length;
        if (cur.length >= c.maxWords || len > c.maxChars) flush();
        cur.push({ ...w, w: s });
        if (/[.!?,]$/.test(s)) flush();
      }
      flush();
      c._chunks = ch.map((ws, i) => ({ ws, t0: ws[0].t0, t1: Math.max(ws[ws.length - 1].t1, (ch[i + 1] ? Math.min(ch[i + 1][0].t0, ws[ws.length - 1].t1 + 0.6) : ws[ws.length - 1].t1 + 0.4)) }));
      TPL.captions._cache = c._chunks;
    }
    const chunk = c._chunks.find((k) => T >= k.t0 - 0.03 && T < k.t1);
    if (!chunk) return;
    const isEm = (s) => /[$%0-9]/.test(s) || c.em.some((e) => s.toLowerCase().replace(/[^a-z0-9$]/g, '').startsWith(e.toLowerCase()));
    const fmt = (s) => (c.upper ? s.toUpperCase() : s).replace(/[,.;:]$/, '');
    const pop = spring(T - chunk.t0, 380, 20);
    const words = chunk.ws.map((w) => ({ ...w, s: fmt(w.w), em: isEm(w.w) }));
    const sizes = words.map((w) => (w.em ? c.size * 1.18 : c.size));
    const gap = c.size * 0.28;
    const widths = words.map((w, i) => measure(w.s, sizes[i], { weight: 900 }));
    let total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
    const sc = Math.min(1, 940 / total);
    at(E.W / 2, c.y, (0.82 + 0.18 * pop) * sc, 0, () => {
      let x = -total / 2;
      words.forEach((w, i) => {
        const said = T >= w.t0 - 0.02;
        const col = w.em ? E.B.accent : '#FFFFFF';
        text(w.s, x, 0, sizes[i], col, { weight: 900, stroke: 10, strokeColor: 'rgba(0,0,0,0.9)', blur: 22, alpha: said ? 1 : 0.55 });
        x += widths[i] + gap;
      });
    });
  },
};
