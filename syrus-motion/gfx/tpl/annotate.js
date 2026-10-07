// annotate — hand-drawn marker annotations to lay over footage: tapered strokes with a soft dark halo so they read
// on any background, drawn on like a real marker, then held. cfg.kind:
//   'circle'    — a sketchy gold loop around cfg.target (radii cfg.r = [rx, ry]), overshooting its start
//   'underline' — a quick gold underline (cfg.w wide) under cfg.target plus a shorter second flick
//   'arrow'     — a curved gold arrow from cfg.from (default up-left of the target) to cfg.target, optional cfg.label
//   'x'         — a red X (cfg.size) over a "before" thing
// Position: cfg.target [x, y] in 1080x1920 px (default centre frame — move the layer onto the subject). ~2.0s.
TPL.annotate = {
  dur: 2.0,
  defaults: { kind: 'circle', target: [540, 900], r: [270, 170], w: 520, from: null, size: 300, lw: 16, color: null, label: '', seed: 'a', start: 0.1 },
  // marker stroke along polyline P (drawn on to frac): halo pass, then tapered segments
  stroke(P, frac, color, lw) {
    const Q = partial(P, frac); if (Q.length < 2) return;
    let tot = 0; const cum = [0];
    for (let i = 1; i < P.length; i++) { tot += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); cum.push(tot); }
    ctx.save(); ctx.shadowColor = 'rgba(0,8,24,0.7)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 3;
    line(Q, 'rgba(0,8,24,0.55)', lw * 0.9); ctx.restore();
    ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = color;
    for (let i = 1; i < Q.length; i++) {
      const u = (cum[Math.min(i, cum.length - 1)]) / tot, w = lw * (0.4 + 0.6 * Math.min(1, u / 0.1, (1 - u) / 0.14 + 0.25));
      ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(Q[i - 1][0], Q[i - 1][1]); ctx.lineTo(Q[i][0], Q[i][1]); ctx.stroke();
    }
    ctx.restore();
  },
  wob(R) { const p1 = R.r(0, 6.28), p2 = R.r(0, 6.28); return (u, a) => a * (Math.sin(u * 9 + p1) * 0.6 + Math.sin(u * 23 + p2) * 0.4); },
  draw(t, c, E) {
    const B = E.B, me = TPL.annotate, R = RNG('annot', c.kind, c.seed), [tx, ty] = c.target, t0 = c.start;
    ctx.globalAlpha = 1 - easeOut((t - (c.dur - 0.3)) / 0.3);
    const gold = c.color || B.accent;
    if (c.kind === 'x') {
      const s = c.size / 2, col = c.color || B.bad, lw = c.lw * 1.35, w1 = me.wob(R), w2 = me.wob(R);
      const P1 = [], P2 = [];
      for (let i = 0; i <= 40; i++) {
        const u = i / 40;
        P1.push([tx - s * 1.02 + 2 * s * 1.04 * u + w1(u, 3), ty - s + 2 * s * u + Math.sin(u * Math.PI) * -14 + w1(u, 2)]);
        P2.push([tx + s * 1.05 - 2 * s * 1.08 * u + w2(u, 3), ty - s * 0.96 + 2 * s * 1.02 * u + Math.sin(u * Math.PI) * 12 + w2(u, 2)]);
      }
      me.stroke(P1, easeOut((t - t0) / 0.2), col, lw);
      me.stroke(P2, easeOut((t - t0 - 0.28) / 0.2), col, lw);
      return;
    }
    if (c.kind === 'underline') {
      const hw = c.w / 2, w1 = me.wob(R), P = [], Q = [];
      for (let i = 0; i <= 40; i++) { const u = i / 40; P.push([tx - hw + c.w * u, ty - 12 * u + Math.sin(u * Math.PI) * 8 + w1(u, 2)]); Q.push([tx - hw * 0.05 + c.w * 0.5 * u, ty + 34 - 14 * u + Math.sin(u * Math.PI) * 5 + w1(u, 1.5)]); }
      me.stroke(P, easeOut((t - t0) / 0.3), gold, c.lw);
      me.stroke(Q, easeOut((t - t0 - 0.32) / 0.2), gold, c.lw * 0.7);
      return;
    }
    if (c.kind === 'arrow') {
      const F = c.from || [tx - 300, ty - 420], dx = tx - F[0], dy = ty - F[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
      const T2 = [tx - ux * 46, ty - uy * 46], mx = (F[0] + T2[0]) / 2, my = (F[1] + T2[1]) / 2, bend = L * 0.24;
      const C = [mx - uy * bend * -1, my + ux * bend * -1], w1 = me.wob(R), P = [];
      for (let i = 0; i <= 50; i++) {
        const u = i / 50, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), d = u * u;
        P.push([a * F[0] + b * C[0] + d * T2[0] + w1(u, 2.5), a * F[1] + b * C[1] + d * T2[1] + w1(u, 2.5)]);
      }
      const n = P.length, hx = P[n - 1][0] - P[n - 4][0], hy = P[n - 1][1] - P[n - 4][1], hl = Math.hypot(hx, hy), ang = Math.atan2(hy / hl, hx / hl), HL = 74;
      const tip = P[n - 1], b1 = [tip[0] - Math.cos(ang - 0.55) * HL, tip[1] - Math.sin(ang - 0.55) * HL], b2 = [tip[0] - Math.cos(ang + 0.5) * HL * 0.95, tip[1] - Math.sin(ang + 0.5) * HL * 0.95];
      if (c.label) {
        const la = spring(t - t0 + 0.05, 300, 20);
        if (la > 0.001) withAlpha(clamp(la * 2), () => at(F[0], F[1] - 40, 0.7 + 0.3 * la, 0, () => text(c.label, 0, 0, fitSize(c.label, 64, 900, { weight: 900 }), '#FFFFFF', { weight: 900, align: 'center', stroke: 12, strokeColor: 'rgba(0,10,30,0.9)' })));
      }
      me.stroke(P, easeIO((t - t0) / 0.45), gold, c.lw);
      me.stroke([b1, tip, b2], easeOut((t - t0 - 0.45) / 0.2), gold, c.lw);
      return;
    }
    // circle
    const [rx, ry] = c.r, a0 = -2.35, span = Math.PI * 2 * 1.1, tilt = -0.09, p1 = R.r(0, 6.28), p2 = R.r(0, 6.28), P = [];
    for (let i = 0; i <= 120; i++) {
      const u = i / 120, a = a0 + span * u, k = (1 + 0.035 * Math.sin(2 * a + p1) + 0.02 * Math.sin(5 * a + p2)) * (1 + 0.07 * u - 0.03);
      const x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
      P.push([tx + x * Math.cos(tilt) - y * Math.sin(tilt), ty + x * Math.sin(tilt) + y * Math.cos(tilt)]);
    }
    me.stroke(P, easeIO((t - t0) / 0.6), gold, c.lw);
  },
};
