// material-table — comparison table on a navy card: rows slide in one per VO beat, each with a procedural stone swatch
// (code-drawn granite speckle / quartz fleck / marble veining — original), price column in gold, counting up as it lands.
// cfg.mode 'ladder' turns it into a tier ladder: tiers land bottom-up on a rail that climbs node to node
// ("Wet-area remodel $9,995" -> "Full remodel $14,995"). 5.0s.
// cfg.rows = [{ name, sub, price, stone: 'granite'|'quartz'|'marble', pre }]   (ladder rows ignore stone; pre = "from")
TPL.materialTable = {
  dur: 5.0,
  // GC Countertops offer: installed price per sq ft. Ladder tiers = a bathroom client's two packages.
  // All prices are client-confirmed values.
  defaults: { mode: 'table', kicker: null, cols: null, rows: null, start: 0.45, step: 0.8, beats: null, y: 420 },
  TABLE: {
    kicker: 'COUNTERTOPS · INSTALLED', cols: ['MATERIAL', 'PER SQ FT'],
    rows: [
      { name: 'Granite', sub: 'Natural stone', price: '$30', stone: 'granite' },
      { name: 'Quartz', sub: 'Engineered stone', price: '$55', stone: 'quartz' },
      { name: 'Marble', sub: 'Natural stone', price: '$65', stone: 'marble' },
    ],
  },
  LADDER: {
    kicker: 'BATHROOM REMODELS',
    rows: [
      { name: 'Wet-area remodel', sub: 'Shower & tub area', price: '$9,995', pre: 'from' },
      { name: 'Full remodel', sub: 'The whole bathroom', price: '$14,995', pre: 'from' },
    ],
  },
  // "$14,995" counting up: keeps prefix/suffix, formats with commas
  count(str, u) {
    const m = String(str).match(/^([^0-9]*)([0-9][0-9,]*(?:\.[0-9]+)?)(.*)$/); if (!m) return str;
    const v = parseFloat(m[2].replace(/,/g, '')), dp = (m[2].split('.')[1] || '').length;
    return m[1] + (v * clamp(u)).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp }) + m[3];
  },
  // procedural stone swatch, s px square
  stone(kind, x, y, s, key) {
    const R = RNG('stone', kind, String(key)), k = s / 128, ga = ctx.globalAlpha;
    ctx.save(); rrect(x, y, s, s, 24 * k); ctx.clip();
    const vein = (x1, y1, ang, steps, len, w, col, a) => {
      const P = [[x1, y1]]; let px = x1, py = y1;
      for (let i = 0; i < steps; i++) { ang += R.r(-0.45, 0.45); px += Math.cos(ang) * len; py += Math.sin(ang) * len; P.push([px, py]); }
      ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]);
      for (let i = 1; i < P.length - 1; i++) ctx.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + P[i + 1][0]) / 2, (P[i][1] + P[i + 1][1]) / 2);
      ctx.lineTo(P[P.length - 1][0], P[P.length - 1][1]);
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.globalAlpha = ga * a; ctx.stroke(); ctx.globalAlpha = ga;
      return P;
    };
    if (kind === 'granite') {
      ctx.fillStyle = '#5c534d'; ctx.fillRect(x, y, s, s);
      const cols = ['#1d1917', '#2b2421', '#3a322e', '#8f847b', '#bdb2a7', '#7a4a37', '#a5705a', '#efe9e1'];
      for (let i = 0; i < 560; i++) {
        const px = x + R.f() * s, py = y + R.f() * s, r = (R.f() < 0.82 ? R.r(0.9, 2.4) : R.r(2.6, 5.2)) * k;
        ctx.fillStyle = cols[R.i(0, cols.length - 1)];
        const a0 = R.r(0, 6.28); ctx.beginPath(); ctx.moveTo(px + Math.cos(a0) * r, py + Math.sin(a0) * r);
        for (let j = 1; j < 5; j++) { const aj = a0 + j * 1.256 + R.r(-0.35, 0.35), rj = r * R.r(0.55, 1.2); ctx.lineTo(px + Math.cos(aj) * rj, py + Math.sin(aj) * rj); }
        ctx.closePath(); ctx.fill();
      }
    } else if (kind === 'quartz') {
      ctx.fillStyle = '#ece9e3'; ctx.fillRect(x, y, s, s);
      vein(x - 10 * k, y + s * 0.7, -0.5, 9, 20 * k, 6 * k, '#b9b3ab', 0.18);
      const cols = ['#a9a39b', '#87817a', '#cfc9c1', '#9ba1a8', '#ffffff'];
      for (let i = 0; i < 420; i++) {
        ctx.fillStyle = cols[R.i(0, cols.length - 1)]; ctx.globalAlpha = ga * R.r(0.35, 0.9);
        const r = R.r(0.5, 1.5) * k; ctx.fillRect(x + R.f() * s, y + R.f() * s, r * 1.6, r * 1.3);
      }
      ctx.globalAlpha = ga;
    } else {   // marble
      ctx.fillStyle = '#f3f1ec'; ctx.fillRect(x, y, s, s);
      for (let i = 0; i < 3; i++) {
        const gx = x + R.f() * s, gy = y + R.f() * s, gr = ctx.createRadialGradient(gx, gy, 0, gx, gy, s * 0.6);
        gr.addColorStop(0, 'rgba(150,150,160,0.16)'); gr.addColorStop(1, 'rgba(150,150,160,0)'); ctx.fillStyle = gr; ctx.fillRect(x, y, s, s);
      }
      ctx.save(); ctx.shadowColor = 'rgba(110,112,122,0.7)'; ctx.shadowBlur = 5 * k;
      for (let v = 0; v < 3; v++) {
        const P = vein(x - 12 * k, y + s * (0.12 + 0.36 * v) + R.r(-10, 10) * k, R.r(0.15, 0.55), 10, 17 * k, R.r(1.6, 2.8) * k, '#7f828b', 0.8);
        vein(x - 12 * k, y + s * (0.2 + 0.36 * v), R.r(0.2, 0.5), 10, 17 * k, 9 * k, '#9a9da6', 0.12);
        const b = P[R.i(3, 6)]; vein(b[0], b[1], R.r(-1.2, 1.2), 4, 12 * k, 1.1 * k, '#8a8d96', 0.7);
      }
      ctx.restore();
    }
    const gr = ctx.createLinearGradient(x, y, x + s, y + s);
    gr.addColorStop(0, 'rgba(255,255,255,0.24)'); gr.addColorStop(0.42, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.14)');
    ctx.fillStyle = gr; ctx.fillRect(x, y, s, s);
    ctx.restore();
    rrect(x, y, s, s, 24 * k); ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.stroke();
  },
  draw(t, c, E) {
    const B = E.B, me = TPL.materialTable, lad = c.mode === 'ladder', base = lad ? me.LADDER : me.TABLE;
    const rows = (c.rows || base.rows).slice(0, lad ? 4 : 5), n = rows.length; if (!n) return;
    const beats = rows.map((_, i) => (c.beats && c.beats[i] != null) ? c.beats[i] : c.start + i * c.step), last = Math.max(...beats);
    const up = life(t, c.dur, 0.35, 200, 21); if (up <= 0.001) return;
    ctx.globalAlpha = clamp(up * 1.5);
    const cw = 900, pad = 56, x0 = (E.W - cw) / 2, y0 = c.y + (1 - up) * 120;
    const priceAt = (r, i, px, py, size) => {   // gold price, counts up as the row lands, small bump on landing + a late echo
      const b = beats[i], u = easeOut((t - b - 0.08) / 0.6);
      const bump = 0.07 * Math.sin(Math.PI * seg(t, b + 0.62, b + 0.86)) + 0.05 * Math.sin(Math.PI * seg(t, last + 1.1 + i * 0.12, last + 1.32 + i * 0.12));
      let w = 0;
      at(px, py, 1 + bump, 0, () => { w = text(me.count(r.price, u), 0, 0, size, B.accent, { weight: 900, align: 'right', shadow: false }); });
      if (r.pre) text(r.pre, px - measure(r.price, size, { weight: 900 }) - 14, py, 30, B.sky, { weight: 600, align: 'right', shadow: false, alpha: clamp(u * 2) });
    };
    if (lad) {
      const rowH = 256, top = 150, ch = top + n * rowH + 10, rx = x0 + pad + 24;
      card(x0, y0, cw, ch, 36, B.card);
      text(c.kicker || base.kicker, x0 + pad, y0 + 84, 34, B.sky, { weight: 700, spacing: 6, shadow: false });
      ctx.fillStyle = hexA(B.ink, 0.14); ctx.fillRect(x0 + pad, y0 + top - 26, cw - pad * 2, 2);
      const ys = rows.map((_, i) => y0 + top + (n - 1 - i) * rowH + rowH / 2);
      line([[rx, ys[0]], [rx, ys[n - 1]]], hexA(B.ink, 0.16), 6);
      let py = ys[0];
      for (let i = 1; i < n; i++) { const p = easeIO((t - beats[i] + 0.32) / 0.32); if (p > 0) py = lerp(ys[i - 1], ys[i], p); }
      if (t > beats[0]) line([[rx, ys[0]], [rx, py]], B.sky, 6);
      rows.forEach((r, i) => {
        const b = beats[i], a = spring(t - b, 260, 21), cy = ys[i];
        const nd = spring(t - b + 0.05, 380, 16);
        circle(rx, cy, 24, B.card, hexA(B.ink, 0.25), 4);
        if (nd > 0.001) { circle(rx, cy, 24 * nd, B.sky); text(String(i + 1), rx, cy + 10, 28, B.card, { weight: 900, align: 'center', shadow: false, alpha: clamp(nd * 2) }); }
        if (a <= 0.001) return;
        if (i < n - 1) { ctx.fillStyle = hexA(B.ink, 0.08 * clamp(a)); ctx.fillRect(x0 + pad + 84, cy - rowH / 2, cw - pad * 2 - 84, 2); }
        withAlpha(clamp(a * 1.6), () => at((1 - a) * 90, 0, 1, 0, () => {   // name / sub stacked left, "from $X" big below
          const nx = x0 + pad + 84, nmax = cw - pad * 2 - 84;
          const ns = Math.min(...rows.map((q) => fitSize(q.name, 54, nmax, { weight: 900 })));
          text(r.name, nx, cy - 50, ns, B.ink, { weight: 900, shadow: false });
          if (r.sub) text(r.sub, nx, cy - 8, 32, B.sky, { weight: 600, shadow: false });
          const fw = r.pre ? measure(r.pre, 34, { weight: 600 }) + 14 : 0;
          if (r.pre) text(r.pre, nx, cy + 80, 34, B.sky, { weight: 600, shadow: false });
          priceAt({ ...r, pre: '' }, i, nx + fw + measure(r.price, 84, { weight: 900 }), cy + 80, 84);
        }));
      });
      return;
    }
    const rowH = 176, top = 196, grow = beats.reduce((a, b) => a + spring(t - b + 0.05, 240, 24), 0), ch = top + grow * rowH + 24;
    card(x0, y0, cw, ch, 36, B.card);
    ctx.save(); rrect(x0, y0, cw, ch, 36); ctx.clip();
    text(c.kicker || base.kicker, x0 + pad, y0 + 84, 34, B.sky, { weight: 700, spacing: 6, shadow: false });
    const cols = c.cols || base.cols;
    text(cols[0], x0 + pad, y0 + 150, 26, hexA(B.ink, 0.55), { weight: 700, spacing: 4, shadow: false });
    text(cols[1], x0 + cw - pad, y0 + 150, 26, hexA(B.ink, 0.55), { weight: 700, spacing: 4, shadow: false, align: 'right' });
    ctx.fillStyle = hexA(B.ink, 0.14); ctx.fillRect(x0 + pad, y0 + top - 22, cw - pad * 2, 2);
    rows.forEach((r, i) => {
      const b = beats[i], a = spring(t - b, 260, 21); if (a <= 0.001) return;
      const cy = y0 + top + i * rowH + rowH / 2 - 8;
      withAlpha(clamp(a * 1.6), () => {
        if (i > 0) { ctx.fillStyle = hexA(B.ink, 0.07); ctx.fillRect(x0 + pad, cy - rowH / 2, cw - pad * 2, 2); }
        at((1 - a) * 90, 0, 1, 0, () => {
          me.stone(r.stone || ['granite', 'quartz', 'marble'][i % 3], x0 + pad, cy - 62, 124, r.name);
          const nx = x0 + pad + 124 + 34, ns = fitSize(r.name, 58, cw - pad * 2 - 124 - 34 - 240, { weight: 900 });
          text(r.name, nx, cy + (r.sub ? -2 : 20), ns, B.ink, { weight: 900, shadow: false });
          if (r.sub) text(r.sub, nx, cy + 44, 32, B.sky, { weight: 600, shadow: false });
          priceAt(r, i, x0 + cw - pad, cy + 30, 84);
        });
      });
    });
    ctx.restore();
  },
};
