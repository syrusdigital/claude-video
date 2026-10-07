// scene-floor-layers — garage floor coating cutaway (opaque B-roll, 12s). A concrete slab (stain + crack) → a diamond
// grinder passes and the surface opens up → the base coat rolls on → colour flakes are broadcast and settle → the clear
// topcoat rolls on and a reflection sweeps across. The cut face shows each layer stacking up (exaggerated), and each band
// carries its numbered label: Diamond grind · Base coat · Flake broadcast · Topcoat. Built for flake-floor clients
// (American Made Coatings, Garage Force). cfg.layers relabels the bands, cfg.base / cfg.flakes recolour the system.
TPL.sceneFloorLayers = {
  dur: 12,
  defaults: {
    layers: ['Diamond grind', 'Base coat', 'Flake broadcast', 'Topcoat'],
    intro: 'YOUR GARAGE FLOOR,|LAYER BY LAYER',
    final: 'GRIND. COAT. FLAKE. *SEAL.*',
    base: '#6E7B8B',
    flakes: ['#1F2633', '#F3F3EF', '#A7B0BA', '#4D5866', '#F3F3EF', '#1F2633', '#66C2FF'],
    beats: { grind: 0.7, base: 3.0, flake: 4.9, top: 7.3, final: 9.3, sheen: 9.9 },
  },
  draw(t, c, E) {
    const K = TPL.sceneKit, S = TPL.sceneFloorLayers, b = c.beats, B = E.B;
    K.bg(t, E);
    // band heights grow as each layer goes on
    const H0 = 170, HB = 104;
    const hB = HB * spring(t - b.base - 0.25, 140, 18), hF = HB * spring(t - b.flake - 0.4, 140, 18), hT = HB * spring(t - b.top - 0.25, 140, 18);
    const bottom = 1424, Ys = bottom - H0 - hB - hF - hT, D = 262;
    const F = { x0: 80, x1: 1000, bx0: 196, bx1: 884, Ys, D };
    F.pt = (u, v) => [lerp(lerp(F.bx0, F.bx1, u), lerp(F.x0, F.x1, u), v), Ys - D + D * v];
    // tool positions (x of the pass edge on the surface)
    const gX = lerp(0, 1100, easeIO(seg(t, b.grind + 0.2, b.grind + 2.1)));
    const rX = lerp(0, 1100, easeIO(seg(t, b.base + 0.1, b.base + 1.6)));
    const tX = lerp(0, 1100, easeIO(seg(t, b.top + 0.1, b.top + 1.6)));
    const zoom = lerp(1.22, 1.0, easeIO(seg(t, 0.2, b.top + 1.0)));
    K.cam(t, c.dur, () => {
      ctx.save(); ctx.translate(540, 1150); ctx.scale(zoom, zoom); ctx.translate(-540, -1150 + (1 - zoom) * 120);
      // ground shadow
      ctx.save(); ctx.globalAlpha *= 0.5; K.ellipse(540, bottom + 24, 500, 26, '#020812'); ctx.restore();
      S.front(t, c, E, F, bottom, H0, hB, hF, hT);
      S.top(t, c, E, F, gX, rX, tX);
      S.tools(t, c, E, F, gX, rX, tX);
      S.flying(t, c, E, F);
      S.labels(t, c, E, F, bottom, H0, hB, hF, hT);
      ctx.restore();
    }, { z1: 1.03, fx: 540, fy: 1100 });
    K.caption(t, 0.2, c.intro, 392, E, { size: 64, t1: b.final - 0.3 });
    K.caption(t, b.final, c.final, 420, E, { size: 70 });
  },
  topPath(F) { const a = F.pt(0, 0), b2 = F.pt(1, 0), c2 = F.pt(1, 1), d = F.pt(0, 1); ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b2); ctx.lineTo(...c2); ctx.lineTo(...d); ctx.closePath(); },
  front(t, c, E, F, bottom, H0, hB, hF, hT) {
    const K = TPL.sceneKit, P = K.P, x0 = F.x0, w = F.x1 - F.x0;
    let y = bottom - H0;
    // concrete band with aggregate
    ctx.save(); rrect(x0, F.Ys, w, bottom - F.Ys, 14); ctx.clip();
    ctx.fillStyle = P.concrete; ctx.fillRect(x0, y, w, H0);
    const R = RNG('agg'); for (let i = 0; i < 160; i++) circle(x0 + R.r(0, w), y + R.r(8, H0 - 6), R.r(2, 6), R.f() < 0.5 ? K.shade(P.concrete, -0.18) : K.shade(P.concrete, 0.18));
    ctx.fillStyle = K.shade(P.concrete, -0.22); ctx.fillRect(x0, bottom - 18, w, 18);
    // base coat band
    if (hB > 0.5) { y -= hB; ctx.fillStyle = c.base; ctx.fillRect(x0, y, w, hB + 1); ctx.fillStyle = K.shade(c.base, -0.15); ctx.fillRect(x0, y + hB - 6, w, 6); }
    // flake band
    if (hF > 0.5) {
      y -= hF; ctx.fillStyle = K.shade(c.base, -0.05); ctx.fillRect(x0, y, w, hF + 1);
      const Rf = RNG('fband'); for (let i = 0; i < 260; i++) { const fx = x0 + Rf.r(0, w), fy = y + Rf.r(4, Math.max(5, hF - 6)); ctx.fillStyle = c.flakes[Rf.i(0, c.flakes.length - 1)]; ctx.fillRect(fx, fy, Rf.r(6, 14), Rf.r(4, 8)); }
    }
    // clear topcoat band
    if (hT > 0.5) {
      y -= hT; const g = ctx.createLinearGradient(0, y, 0, y + hT); g.addColorStop(0, 'rgba(235,246,255,0.75)'); g.addColorStop(1, 'rgba(160,210,245,0.35)');
      ctx.fillStyle = K.shade(c.base, -0.05); ctx.fillRect(x0, y, w, hT + 1);
      const Rt = RNG('tband'); for (let i = 0; i < 160; i++) { ctx.fillStyle = K.a(c.flakes[Rt.i(0, c.flakes.length - 1)], 0.5); ctx.fillRect(x0 + Rt.r(0, w), y + Rt.r(hT * 0.55, hT - 4), Rt.r(6, 12), Rt.r(3, 6)); }
      ctx.fillStyle = g; ctx.fillRect(x0, y, w, hT + 1);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(x0, y, w, 4);
    }
    // band separators
    ctx.restore();
    ctx.save(); rrect(x0, F.Ys, w, bottom - F.Ys, 14); ctx.strokeStyle = 'rgba(0,10,30,0.25)'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
  },
  top(t, c, E, F, gX, rX, tX) {
    const K = TPL.sceneKit, P = K.P, S = TPL.sceneFloorLayers, b = c.beats;
    ctx.save(); S.topPath(F); ctx.clip();
    const yT = F.Ys - F.D, H = F.D;
    // raw concrete: speckle, a crack, an oil stain
    ctx.fillStyle = K.shade(P.concrete, 0.06); ctx.fillRect(0, yT, 1080, H);
    const R = RNG('top-agg'); for (let i = 0; i < 220; i++) { const [x, y] = F.pt(R.f(), R.f()); circle(x, y, R.r(1.5, 3.5), R.f() < 0.5 ? K.shade(P.concrete, -0.15) : K.shade(P.concrete, 0.25)); }
    ctx.save(); ctx.globalAlpha *= 0.3; const [sx, sy] = F.pt(0.66, 0.55); [[0, 0, 96, 30], [52, 10, 58, 20], [-40, 8, 50, 16], [20, -12, 44, 14]].forEach(([dx, dy, rx, ry]) => K.ellipse(sx + dx, sy + dy, rx, ry, '#5A606A')); ctx.restore();
    line([F.pt(0.12, 0.1), F.pt(0.2, 0.35), F.pt(0.17, 0.55), F.pt(0.27, 0.8), F.pt(0.25, 1)], K.shade(P.concrete, -0.35), 3);
    // ground: smooth, open, faint swirl marks
    const clipX = (x, fn) => { if (x <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(0, yT - 10, x, H + 20); ctx.clip(); fn(); ctx.restore(); };
    clipX(gX, () => {
      ctx.fillStyle = '#B9C0C8'; ctx.fillRect(0, yT, 1080, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 2;
      for (let i = 0; i < 14; i++) { const [x, y] = F.pt((i % 7) / 6.5 + 0.03, i < 7 ? 0.32 : 0.72); ctx.beginPath(); ctx.ellipse(x, y, 70, 22, 0, 0.3, Math.PI * 1.6); ctx.stroke(); }
    });
    clipX(rX, () => { ctx.fillStyle = c.base; ctx.fillRect(0, yT, 1080, H); ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 8; i++) { const [x] = F.pt(i / 8, 0.5); ctx.fillRect(x, yT, 34, H); } });
    // landed flakes
    S.flakeField(t, c, F, (f) => t >= f.land, 1);
    // topcoat: gloss + standing reflections
    clipX(tX, () => {
      const g = ctx.createLinearGradient(0, yT, 0, yT + H); g.addColorStop(0, 'rgba(255,255,255,0.32)'); g.addColorStop(0.5, 'rgba(255,255,255,0.06)'); g.addColorStop(1, 'rgba(255,255,255,0.14)');
      ctx.fillStyle = g; ctx.fillRect(0, yT, 1080, H);
      ctx.save(); ctx.globalAlpha *= 0.16; [[0.18, 60], [0.55, 110], [0.8, 40]].forEach(([u, wd]) => { const [x, y] = F.pt(u, 0); K.poly([[x, y], [x + wd, y], [x + wd - 120, y + H], [x - 120, y + H]], '#FFFFFF'); }); ctx.restore();
    });
    K.sheen(F.x0, yT, F.x1 - F.x0, H, seg(t, b.sheen, b.sheen + 1.1), 0.45);
    K.sheen(F.x0, yT, F.x1 - F.x0, H, seg(t, b.sheen + 1.5, b.sheen + 2.5), 0.3);
    ctx.restore();
    // front lip highlight
    line([F.pt(0, 1), F.pt(1, 1)], 'rgba(255,255,255,0.35)', 3);
  },
  flakeList(c, F) {
    const R = RNG('flakes'), L = [], b = c.beats;
    for (let i = 0; i < 340; i++) { const u = R.f(), v = R.f(); L.push({ u, v, col: c.flakes[R.i(0, c.flakes.length - 1)], rot: R.r(0, Math.PI), s: R.r(0.7, 1.3), land: b.flake + 0.35 + u * 1.5 + R.r(0, 0.35), fx: R.r(-1, 1) }); }
    return L;
  },
  flakeField(t, c, F, pred, al) {
    for (const f of TPL.sceneFloorLayers.flakeList(c, F)) {
      if (!pred(f)) continue;
      const [x, y] = F.pt(f.u, f.v), sc = (0.6 + 0.45 * f.v) * f.s;
      at(x, y, 1, 0, () => { ctx.scale(1, 0.55); ctx.rotate(f.rot); ctx.fillStyle = f.col; ctx.globalAlpha *= al; ctx.beginPath(); ctx.moveTo(-8 * sc, -5 * sc); ctx.lineTo(7 * sc, -6 * sc); ctx.lineTo(9 * sc, 4 * sc); ctx.lineTo(-6 * sc, 6 * sc); ctx.closePath(); ctx.fill(); });
    }
  },
  flying(t, c, E, F) {
    const fl = 0.55;
    for (const f of TPL.sceneFloorLayers.flakeList(c, F)) {
      const u = (t - (f.land - fl)) / fl; if (u <= 0 || u >= 1) continue;
      const [x1, y1] = F.pt(f.u, f.v), x0 = x1 + 300 + f.fx * 80, y0 = y1 - 260;
      const x = lerp(x0, x1, u), y = lerp(y0, y1, u) - Math.sin(u * Math.PI) * 90, sc = 1.5 - 0.5 * u;
      at(x, y, sc, f.rot + u * 6 * f.fx, () => { ctx.fillStyle = f.col; ctx.beginPath(); ctx.moveTo(-8, -5); ctx.lineTo(7, -6); ctx.lineTo(9, 4); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill(); });
    }
  },
  tools(t, c, E, F, gX, rX, tX) {
    const K = TPL.sceneKit, P = K.P, b = c.beats;
    const vis = (x, a, z) => x > 0 && x < 1100 && t > a && t < z;
    // diamond grinder (with a little dust haze behind it)
    if (vis(gX, b.grind + 0.15, b.grind + 2.15)) {
      const y = F.Ys - F.D * 0.45, x = gX;
      for (let i = 0; i < 4; i++) withAlpha(0.18, () => circle(x - 60 - i * 50, y - 10 + Math.sin(t * 7 + i) * 6, 40 + i * 10, '#E8ECF0'));
      at(x, y, 1, 0, () => {
        ctx.save(); ctx.globalAlpha *= 0.35; K.ellipse(6, 22, 92, 26, '#020812'); ctx.restore();
        line([[-10, -40], [-80, -150]], '#2E3A4B', 10); K.box(-122, -166, 84, 16, 8, '#2E3A4B', { band: 0 });
        K.ellipse(0, 10, 84, 30, '#3A4556'); K.ellipse(0, 2, 84, 30, '#566275');
        K.box(-46, -46, 92, 50, 14, E.B.sky, { band: 0.3 }); K.box(-28, -74, 56, 32, 10, '#3A4556', { band: 0.2 });
        circle(0, 2, 10 + Math.sin(t * 40) * 2, '#C9D2DB');
      });
    }
    // rollers (base coat, then clear topcoat)
    [[rX, b.base, c.base], [tX, b.top, '#DCEFFC']].forEach(([x, a, nap]) => {
      if (!vis(x, a + 0.05, a + 1.65)) return;
      const yA = F.Ys - F.D * 0.78, yB = F.Ys - F.D * 0.22, xs = x - (yB - yA) * 0.08;
      line([[xs + 20, yA - 20], [xs - 200, yA - 230]], '#C9B08A', 9);
      line([[xs + 20, yA - 20], [xs + 26, (yA + yB) / 2]], '#9AA4AF', 6);
      ctx.save(); ctx.translate(x, (yA + yB) / 2); ctx.rotate(-0.08);
      K.box(-20, -(yB - yA) / 2, 40, yB - yA, 18, nap, { band: 0.2, hl: 0.3 });
      ctx.restore();
    });
  },
  labels(t, c, E, F, bottom, H0, hB, hF, hT) {
    const K = TPL.sceneKit, b = c.beats, L = c.layers;
    const ys = [bottom - H0 / 2 - 6, bottom - H0 - hB / 2, bottom - H0 - hB - hF / 2, bottom - H0 - hB - hF - hT / 2];
    const ts = [b.grind + 0.3, b.base + 0.5, b.flake + 0.65, b.top + 0.5];
    L.forEach((s, i) => { if (s) K.chip(F.x0 + 28, ys[i], s, K.pop(t, ts[i], 240, 19), E, { num: i + 1, align: 'left', size: 52 }); });
  },
};
