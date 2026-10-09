// transitions — full-frame alpha transitions to drop centred on a cut (cfg.kind). Each one fully covers the frame at its
// midpoint, so put the cut on the middle frame:
//   'whip'      0.6s  motion-blurred light streaks + a white band sweep across (cfg.dir 1 = left->right, -1 = right->left)
//   'brandWipe' 0.8s  a diagonal navy panel wipes on, holds a beat, wipes off with a gold panel trailing it
//   'flash'     0.6s  soft warm-white flash with lens bloom, an anamorphic streak and faint ghosts
//   'shapeIris' 0.8s  a navy field with a gold-rimmed rounded-square iris closes to centre (rotating), then opens
// Set the item's dur to the length above (draw() scales to whatever dur it is given).
TPL.transitions = {
  dur: 0.7,
  defaults: { kind: 'whip', dir: 1 },
  whip(u, E) {
    const { W, H, B } = E, bump = Math.exp(-Math.pow((u - 0.5) / 0.13, 2));
    ctx.fillStyle = `rgba(255,255,255,${0.75 * bump})`; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.14);
    const HW = 1800, bx = lerp(-2700, 2700, easeIO(u)), g = ctx.createLinearGradient(bx - HW, 0, bx + HW, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.22, 'rgba(255,255,255,0.55)'); g.addColorStop(0.36, 'rgba(255,255,255,1)');
    g.addColorStop(0.64, 'rgba(255,255,255,1)'); g.addColorStop(0.78, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(bx - HW, -1400, 2 * HW, 2800);
    // streaks: thin bright lines with long fading tails, each at its own speed (parallax)
    const R = RNG('whip-streaks');
    for (let i = 0; i < 54; i++) {
      const y = R.r(-1250, 1250), th = 2 + Math.pow(R.f(), 2.2) * 22, len = R.r(380, 1500), sp = R.r(0.85, 1.6), off = R.r(-0.18, 0.18), a = R.r(0.35, 0.95), sky = R.f() < 0.3;
      const k = clamp((u - 0.5 + off) * sp + 0.5), hx = lerp(-700, 700 + len, k);
      if (k <= 0 || k >= 1) continue;
      const gs = ctx.createLinearGradient(hx - len, 0, hx, 0), col = sky ? B.sky : '#FFFFFF';
      gs.addColorStop(0, hexA(col, 0)); gs.addColorStop(0.85, hexA(col, a * 0.8)); gs.addColorStop(1, hexA(col, a));
      ctx.fillStyle = gs; rrect(hx - len, y - th / 2, len, th, th / 2); ctx.fill();
    }
    ctx.restore();
  },
  brandWipe(u, E) {
    const { W, H, B } = E, pad = 80, sk = (H + 2 * pad) * Math.tan(0.34), Wn = W + sk + 200, Wg = 150, gp = 26;
    const c0 = W + sk + 20, c1 = c0 + 150, end = W + sk + Wn + gp + Wg + 40;
    const xr = u < 0.42 ? lerp(0, c0, easeIO(u / 0.42)) : u < 0.56 ? lerp(c0, c1, (u - 0.42) / 0.14) : lerp(c1, end, easeIO((u - 0.56) / 0.44));
    const panel = (right, w, fill) => {   // parallelogram: top edge [right-w, right], leaning back toward the bottom
      ctx.beginPath(); ctx.moveTo(right - w, -pad); ctx.lineTo(right, -pad); ctx.lineTo(right - sk, H + pad); ctx.lineTo(right - w - sk, H + pad); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
    };
    ctx.save(); ctx.shadowColor = 'rgba(0,8,24,0.55)'; ctx.shadowBlur = 50;
    panel(xr - Wn - gp, Wg, B.accent);
    panel(xr, Wn, B.card);
    ctx.restore();
  },
  flash(u, E) {
    const { W, H, B } = E, cx = W / 2, cy = H * 0.45;
    const f = u < 0.42 ? easeIn(u / 0.42) : u < 0.56 ? 1 : Math.pow(1 - (u - 0.56) / 0.44, 2);
    ctx.fillStyle = `rgba(255,252,244,${f >= 0.999 ? 1 : 0.9 * f * f})`; ctx.fillRect(0, 0, W, H);
    const R1 = lerp(260, 1500, Math.sqrt(f)), g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R1);
    g.addColorStop(0, `rgba(255,255,255,${Math.min(1, f * 1.7)})`); g.addColorStop(0.35, `rgba(255,250,236,${0.8 * f})`); g.addColorStop(1, 'rgba(255,248,230,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // anamorphic streak + ghosts: strongest mid-rise / mid-decay, gone at full white
    const fl = Math.min(1, 4 * f * (1 - f) + 0.15 * f * (f < 0.999));
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.045);
    const gs = ctx.createRadialGradient(0, 0, 0, 0, 0, 1100); gs.addColorStop(0, `rgba(255,255,255,${0.9 * fl})`); gs.addColorStop(0.25, hexA(B.sky, 0.32 * fl)); gs.addColorStop(1, hexA(B.sky, 0));
    ctx.fillStyle = gs; ctx.fillRect(-1100, -1100, 2200, 2200); ctx.restore();
    [[0.55, 70, 0.11], [1.0, 140, 0.07], [1.45, 46, 0.14]].forEach(([k, r, a]) => {
      const gx = cx + (W * 0.22) * k, gy = cy + (H * 0.2) * k, gg = ctx.createRadialGradient(gx, gy, r * 0.2, gx, gy, r);
      gg.addColorStop(0, hexA(B.sky, a * fl * 0.4)); gg.addColorStop(0.8, hexA(B.sky, a * fl)); gg.addColorStop(1, hexA(B.sky, 0));
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(gx, gy, r, 0, Math.PI * 2); ctx.fill();
    });
  },
  shapeIris(u, E) {
    const { W, H, B } = E, cx = W / 2, cy = H / 2, SM = 1010;   // at rot 0 (u=0 and u=1) a 1010 half-size square clears the 540x960 half-frame
    const s = u < 0.44 ? lerp(SM, 0, easeIO(u / 0.44)) : u < 0.56 ? 0 : lerp(0, SM, easeIO((u - 0.56) / 0.44));
    const rot = u * Math.PI / 2, cs = Math.cos(rot), sn = Math.sin(rot), r = s * 0.3;
    const P = (x, y) => [cx + x * cs - y * sn, cy + x * sn + y * cs];
    const sq = () => {
      const a = P(-s, -s), b = P(s, -s), c2 = P(s, s), d = P(-s, s), m = P(0, -s);
      ctx.moveTo(m[0], m[1]); ctx.arcTo(b[0], b[1], c2[0], c2[1], r); ctx.arcTo(c2[0], c2[1], d[0], d[1], r); ctx.arcTo(d[0], d[1], a[0], a[1], r); ctx.arcTo(a[0], a[1], b[0], b[1], r); ctx.closePath();
    };
    ctx.save(); ctx.shadowColor = `rgba(0,8,24,${0.6 * clamp((SM - s) / 220)})`; ctx.shadowBlur = 50;
    ctx.beginPath(); ctx.rect(-10, -10, W + 20, H + 20); if (s > 0.5) sq(); ctx.fillStyle = B.card; ctx.fill('evenodd'); ctx.restore();
    if (s > 0.5) { ctx.beginPath(); sq(); ctx.strokeStyle = B.accent; ctx.lineWidth = Math.min(26, s * 0.45); ctx.lineJoin = 'round'; ctx.stroke(); }
  },
  draw(t, c, E) {
    const u = clamp(t / c.dur), f = this[c.kind];
    if (typeof f !== 'function' || c.kind === 'draw') return;
    ctx.save(); if (c.dir < 0) { ctx.translate(E.W, 0); ctx.scale(-1, 1); }
    f.call(this, u, E, c); ctx.restore();
  },
};
