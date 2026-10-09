// service-map — service-area call-out on an abstract map (no real map tiles): a navy map panel whose street grid and
// arterials draw on, a region blob traces itself (cfg.points, normalised 0..1 inside the panel, or a default organic
// shape) and fills, a pin drops with a bounce, a radius ring opens and pulses, then the area label slides in. 4.0s.
TPL.serviceMap = {
  dur: 4.0,
  // Snohomish & King County (WA) remodeling client — the area named is the client's confirmed service area.
  defaults: {
    label: 'SNOHOMISH & KING COUNTY', who: 'HOMEOWNERS', points: null, pin: [0.56, 0.47], radius: 0.2, water: true,
    seed: 'pnw', y: 290, h: 780,
    beats: { streets: 0.08, region: 0.55, pin: 1.35, ring: 1.6, label: 2.0, pulse: [1.75, 2.75] },
  },
  // closed Catmull-Rom through pts -> sampled polyline
  smooth(pts, per = 14) {
    const n = pts.length, out = [];
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      for (let k = 0; k < per; k++) {
        const u = k / per, u2 = u * u, u3 = u2 * u;
        out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * u + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * u2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * u3)));
      }
    }
    out.push(out[0]); return out;
  },
  open(pts, per = 12) {   // open Catmull-Rom (end points duplicated)
    const P = [pts[0], ...pts, pts[pts.length - 1]], out = [];
    for (let i = 1; i < P.length - 2; i++) for (let k = 0; k <= per; k++) {
      const u = k / per, u2 = u * u, u3 = u2 * u, p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
      out.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * u + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * u2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * u3)));
    }
    return out;
  },
  pinShape(x, y, s, fill, dot) {   // teardrop pin, tip at (x, y), s = overall height
    const r = s * 0.42, h = s - r, b = Math.acos(r / h);
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, -h, r, Math.PI / 2 + b, Math.PI / 2 - b); ctx.closePath();
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6; ctx.fillStyle = fill; ctx.fill();
    ctx.shadowColor = 'transparent'; circle(0, -h, r * 0.42, dot);
    ctx.restore();
  },
  draw(t, c, E) {
    const B = E.B, me = TPL.serviceMap, Bt = c.beats;
    const up = life(t, c.dur, 0.35, 200, 21); if (up <= 0.001) return;
    ctx.globalAlpha = clamp(up * 1.5);
    const mw = 860, mh = c.h, x0 = (E.W - mw) / 2, y0 = c.y + (1 - up) * 120, R = RNG('map', c.seed);
    const P = (u, v) => [x0 + u * mw, y0 + v * mh];
    card(x0, y0, mw, mh, 40, B.card);
    ctx.save(); rrect(x0, y0, mw, mh, 40); ctx.clip();
    const gl = ctx.createRadialGradient(x0 + mw * 0.55, y0 + mh * 0.45, 0, x0 + mw * 0.55, y0 + mh * 0.45, mw * 0.75);
    gl.addColorStop(0, hexA(B.sky, 0.12)); gl.addColorStop(1, hexA(B.sky, 0)); ctx.fillStyle = gl; ctx.fillRect(x0, y0, mw, mh);
    // street grid: two families of lines on a tilted grid, each growing out from its middle
    const cx = x0 + mw / 2, cy = y0 + mh / 2, D = Math.hypot(mw, mh) * 0.6, gap = 58;
    for (const ang of [-0.2, -0.2 + Math.PI / 2]) {
      const ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux;
      for (let i = -11; i <= 11; i++) {
        const avenue = R.f() < 0.22, off = i * gap + R.r(-8, 8), p = easeOut((t - Bt.streets - Math.abs(i) * 0.018 - R.r(0, 0.12)) / 0.55);
        if (p <= 0) continue;
        const mx = cx + nx * off, my = cy + ny * off, L = D * p;
        line([[mx - ux * L, my - uy * L], [mx + ux * L, my + uy * L]], hexA(B.ink, avenue ? 0.12 : 0.06), avenue ? 4 : 2, { cap: 'butt' });
      }
    }
    // arterials + one highway, drawn on
    const roads = [
      { pts: [[-0.05, 0.22], [0.3, 0.3], [0.62, 0.24], [1.05, 0.33]], w: 7, a: 0.16 },
      { pts: [[0.18, 1.05], [0.3, 0.7], [0.48, 0.5], [0.52, 0.2], [0.6, -0.05]], w: 7, a: 0.16 },
      { pts: [[-0.05, 0.78], [0.35, 0.72], [0.7, 0.82], [1.05, 0.7]], w: 7, a: 0.14 },
      { pts: [[0.82, 1.05], [0.78, 0.6], [0.88, 0.3], [0.84, -0.05]], w: 12, a: 0.2 },
    ];
    roads.forEach((rd, i) => {
      const f = easeIO((t - Bt.streets - 0.1 - i * 0.07) / 0.7); if (f <= 0) return;
      line(partial(me.open(rd.pts.map(([u, v]) => P(u, v))), f), hexA(B.ink, rd.a), rd.w);
    });
    // water along the west edge
    if (c.water) {
      const wa = clamp((t - Bt.streets) * 3);
      const W0 = me.smooth([[-0.2, -0.1], [0.1, -0.1], [0.15, 0.12], [0.08, 0.3], [0.16, 0.5], [0.07, 0.7], [0.13, 0.92], [0.05, 1.12], [-0.2, 1.12]].map(([u, v]) => P(u, v)), 10);
      withAlpha(wa, () => {
        ctx.beginPath(); W0.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
        ctx.fillStyle = hexA(B.dark, 0.88); ctx.fill(); ctx.strokeStyle = hexA(B.sky, 0.18); ctx.lineWidth = 3; ctx.stroke();
      });
    }
    // region: default = an organic blob around the pin
    let pts = c.points;
    if (!pts) { const Rr = RNG('region', c.seed), n = 11; pts = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 - Math.PI / 2, k = Rr.r(0.78, 1.12); pts.push([0.56 + Math.cos(a) * 0.3 * k, 0.47 + Math.sin(a) * 0.33 * k]); } }
    const RP = me.smooth(pts.map(([u, v]) => P(u, v)), 14);
    const rf = easeIO((t - Bt.region) / 0.8), fill = easeOut((t - Bt.region - 0.55) / 0.45);
    if (fill > 0) { ctx.beginPath(); RP.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fillStyle = hexA(B.sky, 0.2 * fill); ctx.fill(); }
    if (rf > 0) { ctx.save(); ctx.shadowColor = hexA(B.sky, 0.8); ctx.shadowBlur = 14; line(partial(RP, rf), B.sky, 6); ctx.restore(); }
    // radius ring + pulses
    const [pxp, pyp] = P(c.pin[0], c.pin[1]), Rr = c.radius * mw;
    const rg = spring(t - Bt.ring, 200, 18);
    if (rg > 0.001) { ctx.save(); ctx.setLineDash([16, 14]); circle(pxp, pyp, Rr * rg, hexA(B.ink, 0.06), hexA(B.ink, 0.6), 4); ctx.restore(); }
    for (const pt of Bt.pulse) { const u = seg(t, pt, pt + 1.0); if (u > 0 && u < 1) circle(pxp, pyp, Rr * (0.25 + 1.0 * easeOut(u)), null, hexA(B.ink, 0.7 * (1 - u)), 5); }
    ctx.restore();
    // pin: drops and bounces (the overshoot is reflected so it bounces up, never sinks)
    const d = spring(t - Bt.pin, 260, 10);
    if (t > Bt.pin) {
      const yo = -Math.abs(1 - d) * 260, sh = clamp(1 - Math.abs(yo) / 260);
      ctx.save(); ctx.beginPath(); ctx.ellipse(pxp, pyp, 26 * (0.4 + 0.6 * sh), 9 * (0.4 + 0.6 * sh), 0, 0, Math.PI * 2); ctx.fillStyle = `rgba(0,0,0,${0.35 * sh})`; ctx.fill(); ctx.restore();
      withAlpha(clamp((t - Bt.pin) * 8), () => me.pinShape(pxp, pyp + yo, 130, B.ink, B.card));
    }
    // label card slides in over the bottom edge of the map
    const lb = spring(t - Bt.label, 240, 22);
    if (lb > 0.001) {
      const lw = mw - 80, lh = 156, lx = x0 + 40 + (1 - lb) * -120, ly = y0 + mh - 86;
      withAlpha(clamp(lb * 1.8), () => {
        card(lx, ly, lw, lh, 32, B.card, { stroke: hexA(B.sky, 0.25), lw: 2 });
        circle(lx + 78, ly + lh / 2, 46, hexA(B.sky, 0.16));
        me.pinShape(lx + 78, ly + lh / 2 + 30, 64, B.sky, B.card);
        const tx = lx + 148, ts = fitSize(c.label, 56, lw - 148 - 40, { weight: 900 });
        text(c.label, tx, ly + 76, ts, B.ink, { weight: 900, shadow: false });
        text(c.who, tx, ly + 122, 32, B.sky, { weight: 700, spacing: 8, shadow: false, alpha: clamp((t - Bt.label - 0.12) * 5) });
      });
    }
  },
};
