// kinetic — the Syrus house on-screen text, measured off the winning AI/VO ads (AMC V4, Vistaguard V2, Rob-Art V4/V5,
// Innovative Interiors): the voiceover's own words, 1–3 at a time, CENTRED in the frame (not bottom subtitles).
//   · each chunk is a small light line + one big key word (a price/number, an emphasis word, else the longest word)
//   · prices, numbers, places and "premium" words are set in a SERIF ITALIC (emStyle 'serif'), or a heavy sans italic
//     (emStyle 'italic', the Vistaguard look); everything else is white sans — colour is kept for the hook price only
//   · words cut on at their own spoken time (a 60 ms fade, a hair of scale), a chunk holds until the next one starts
//   · the hook (chunks starting before hookEnd) is set in caps, bigger, with the price in a gold gradient
//   · soft shadow only — no boxes, no outlines
// cfg.words = [{ w, t0, t1 }] ABSOLUTE times (item.at must be 0). cfg.hide = [[a,b],...] absolute windows to blank
// (graphics that take the centre). cfg.em / cfg.places = words to set in the emphasis face.
TPL.kinetic = {
  dur: 60,
  defaults: {
    words: [], hide: [], em: [], places: [], hookEnd: 0, y: 0.5, maxWords: 3, maxChars: 18, gap: 0.5, scale: 1,
    sans: '"Inter Display", "Inter", "Helvetica Neue", Arial, sans-serif',
    serif: '"Playfair Display", "Liberation Serif", Georgia, serif',
    goldFont: '"Cinzel", "Playfair Display", Georgia, serif',
    emStyle: 'serif', hookMoney: 'gold', white: '#FFFFFF', soft: '#F3F3F3',
    gold: ['#FCFC6C', '#F4D434', '#B8901A'], hookAccent: null,
  },
  _cache: null,
  isMoney: (w) => /^\$|\d/.test(w),
  chunks(c) {
    const key = c.words.length + ':' + (c.words[0] ? c.words[0].t0 : 0) + ':' + c.maxWords + ':' + c.hookEnd;
    if (this._cache && this._cache.key === key) return this._cache.list;
    // merge split money tokens first ("$1" ",995" -> "$1,995") — whisper splits them, TTS aligners usually don't
    const W = [];
    for (const w of c.words) {
      if (!w.w.trim()) continue;
      const p = W[W.length - 1];
      if (p && /^[,.]\d/.test(w.w) && /\d$/.test(p.w)) W[W.length - 1] = { ...p, w: p.w + w.w, t1: w.t1 };
      else W.push({ ...w });
    }
    const list = []; let cur = [];
    const flush = () => { if (cur.length) list.push(cur); cur = []; };
    W.forEach((w) => {
      const hook = (cur[0] || w).t0 < c.hookEnd;
      const prev = cur[cur.length - 1];
      if (hook) {   // the hook builds a whole sentence (≤8 words) on screen, so the price stays pinned while the rest lands
        if (cur.length && (cur.length >= 8 || /[.!?]$/.test(prev.w) || w.t0 - prev.t1 > 0.6)) flush();
      } else {
        const len = cur.reduce((a, x) => a + x.w.length + 1, 0) + w.w.length;
        // a short word that closes a clause ("it," "too.") stays with the phrase it ends instead of opening an orphan chunk
        const tail = /[,;:.!?]$/.test(w.w) && w.w.replace(/[^A-Za-z0-9$]/g, '').length <= 3 && cur.length <= c.maxWords && !/[,;:.!?]$/.test(prev ? prev.w : '');
        if (cur.length && (tail ? (w.t0 - prev.t1 > 0.35) : (cur.length >= c.maxWords || len > c.maxChars || w.t0 - prev.t1 > 0.35 || /[.!?]$/.test(prev.w) || (/[,;:]$/.test(prev.w) && cur.length >= 2)))) flush();
        if (this.isMoney(w.w) && cur.length >= 2) flush();   // a price starts its own chunk, so it lands big
      }
      if (cur.length && w.t0 >= c.hookEnd && cur[0].t0 < c.hookEnd) flush();
      cur.push(w);
    });
    flush();
    this._cache = { key, list }; return list;
  },
  stop: new Set(['a', 'an', 'the', 'for', 'of', 'to', 'at', 'just', 'starting', 'or', 'and', 'that', 'thats', 'its', 'why', 'is', 'are', 'in', 'on', 'with', 'from', 'your', 'our', 'only', 'than', 'when', 'you', 'can', 'get', 'more', 'or', 'as', 'low', 'this', 'we', 'by']),
  clean: (s) => s.toLowerCase().replace(/[^a-z0-9$]/g, ''),
  isEm(w, c) { const s = this.clean(w); return !!s && [...c.em, ...c.places].some((e) => { const x = this.clean(e); return x && (s === x || (x.length > 3 && s.startsWith(x))); }); },
  keyIndex(ch, c) {
    let k = ch.findIndex((w) => this.isMoney(w.w)); if (k >= 0) return k;
    k = ch.findIndex((w) => this.isEm(w.w, c)); if (k >= 0) return k;
    let best = 0; ch.forEach((w, i) => { if (this.clean(w.w).length > this.clean(ch[best].w).length) best = i; }); return best;
  },
  draw(t, c, E) {
    const T = E.T, me = TPL.kinetic, list = me.chunks(c), S = c.scale;
    if (c.hide.some(([a, b]) => T >= a && T < b)) return;
    let idx = -1;
    for (let i = 0; i < list.length; i++) if (list[i][0].t0 - 0.02 <= T) idx = i; else break;
    if (idx < 0) return;
    const ch = list[idx], next = list[idx + 1];
    // a chunk that starts inside a hidden window stays hidden for its whole life (it must not pop in after the window)
    if (c.hide.some(([a, b]) => ch[0].t0 >= a - 0.02 && ch[0].t0 < b)) return;
    const end = next ? next[0].t0 - 0.02 : ch[ch.length - 1].t1 + c.gap;
    if (T >= end) return;
    const hook = ch[0].t0 < c.hookEnd, k = me.keyIndex(ch, c), keyW = ch[k];
    const strip = (s) => s.replace(/^["'“(]+|[,;:"”)]+$/g, '');
    const fmt = (s) => (hook ? strip(s).toUpperCase() : strip(s));
    const keyMoney = me.isMoney(keyW.w), keyEm = keyMoney || me.isEm(keyW.w, c);
    const maxW = 960 * Math.min(1, S * 1.05), cx = E.W / 2;
    // faces
    const F = {
      small: hook ? { weight: 800, font: c.sans } : { weight: 500, font: c.sans },
      key: { weight: 900, font: c.sans },
      em: c.emStyle === 'serif' ? { weight: 500, font: c.serif, italic: true } : { weight: 900, font: c.sans, italic: true },
      gold: c.hookMoney === 'gold' ? { weight: 700, font: c.goldFont } : { weight: 900, font: c.sans },
    };
    const keyFace = hook && keyMoney ? F.gold : keyEm ? F.em : F.key;
    const base0 = hook ? (keyMoney ? 200 : 150) : keyMoney ? 150 : keyEm ? 136 : 118;
    const keyStr = fmt(keyW.w);
    const keySize = fitSize(keyStr, base0 * S, maxW, keyFace);
    const smallBase = (hook ? 70 : 60) * S;
    const smallLine = (ws) => { const s = fmt(ws.map((w) => w.w).join(' ')); return { ws, size: fitSize(s, smallBase, maxW, F.small), face: F.small, tier: 'small' }; };
    const lines = [];
    if (hook) {
      // hook stack: the price alone in gold; every other run splits into its lead-in function words (small) and the
      // rest (heavy caps, wrapped at ~16 characters) — "$1,995 / FOR A / CONCRETE FLOOR / COATING?"
      const heavyBase = 112 * S;
      const runs = []; let run = [];
      ch.forEach((w) => { if (me.isMoney(w.w)) { if (run.length) runs.push(run); runs.push([w]); run = []; } else run.push(w); });
      if (run.length) runs.push(run);
      for (const r of runs) {
        if (r.length === 1 && me.isMoney(r[0].w)) { lines.push({ ws: r, size: fitSize(fmt(r[0].w), 200 * S, maxW, F.gold), face: F.gold, tier: 'key', gold: true }); continue; }
        // alternate: runs of function words -> one small line; runs of content words -> heavy rows
        const segs = []; for (const w of r) { const st = me.stop.has(me.clean(w.w)); const g = segs[segs.length - 1]; if (g && g.st === st) g.ws.push(w); else segs.push({ st, ws: [w] }); }
        if (segs.length > 1 && segs[segs.length - 1].st) { const tl = segs.pop(); segs[segs.length - 1].ws.push(...tl.ws); }   // "...COATING? FOR" never strands a tail
        for (const g of segs) {
          if (g.st) { lines.push(smallLine(g.ws)); continue; }
          let row = [];
          for (const w of g.ws) {
            if (row.length && (row.map((x) => x.w).join(' ') + ' ' + w.w).length > 16) { lines.push({ ws: row, size: 0, face: F.key, tier: 'key' }); row = []; }
            row.push(w);
          }
          if (row.length) lines.push({ ws: row, size: 0, face: F.key, tier: 'key' });
        }
      }
      for (const l of lines) if (!l.size) l.size = fitSize(fmt(l.ws.map((w) => w.w).join(' ')), heavyBase, maxW, F.key);
    } else {
      const before = ch.slice(0, k), after = ch.slice(k + 1);
      if (before.length) lines.push(smallLine(before));
      lines.push({ ws: [keyW], size: keySize, face: keyFace, tier: 'key' });
      if (after.length) lines.push(smallLine(after));
    }
    const lh = (l) => l.size * (l.tier === 'key' ? 1.0 : 1.18);
    const total = lines.reduce((a, l) => a + lh(l), 0);
    let y = E.H * c.y - total / 2;
    const pop = (w) => { const u = clamp((T - w.t0 + 0.02) / 0.06); return { a: u, s: 1 + 0.06 * (1 - easeOut(u)) }; };
    for (const l of lines) {
      y += lh(l);
      const base = y - l.size * 0.18;
      const parts = l.ws.map((w) => { const s = fmt(w.w); return { w, s, width: measure(s + ' ', l.size, l.face) }; });
      const lw = parts.reduce((a, p) => a + p.width, 0) - measure(' ', l.size, l.face);
      let x = cx - lw / 2;
      for (const p of parts) {
        const P = pop(p.w);
        if (P.a > 0.001) {
          let col = l.tier === 'small' ? (hook && c.hookAccent ? c.hookAccent : c.soft) : c.white;
          if (l.gold) {
            const g = ctx.createLinearGradient(0, -l.size * 0.75, 0, l.size * 0.05);
            g.addColorStop(0, c.gold[0]); g.addColorStop(0.55, c.gold[1]); g.addColorStop(1, c.gold[2]); col = g;
          }
          const wpx = measure(p.s, l.size, l.face);
          at(x + wpx / 2, base, P.s, 0, () => text(p.s, -wpx / 2, 0, l.size, col, { ...l.face, alpha: P.a, shadowColor: 'rgba(0,0,0,0.6)', blur: 26 }));
        }
        x += p.width;
      }
    }
  },
};
