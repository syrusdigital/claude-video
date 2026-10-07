// scene-roof-layers — roof cutaway building up (opaque B-roll, 12s). Bare rafters → deck sheets pop on → underlayment
// rolls across → drip edge runs the edges → shingles lay course by course → ridge cap. A stepped cutaway on the left
// keeps every layer visible while a numbered chip with a leader line points at the layer going on. Then the cutaway
// closes, the night-navy sky turns to a clean blue sky and the finished roof catches a sheen.
// cfg.steps: optional label per stage ('' hides it); cfg.beats retimes. Compliance: no "free roof", no insurance claims.
TPL.sceneRoofLayers = {
  dur: 12,
  defaults: {
    steps: { deck: 'Roof deck', under: 'Underlayment', drip: 'Drip edge', shingles: 'Shingles', ridge: 'Ridge cap' },
    beats: { deck: 0.45, under: 1.95, drip: 3.35, shingles: 4.35, ridge: 7.15, close: 8.45, sky: 8.6, final: 9.5, sheen: 10.4 },
    final: 'A ROOF DONE RIGHT,|*LAYER BY LAYER*',
    shingle: '#3D4656', siding: '#E3DFD7',
  },
  geo() {
    const g = { eY: 1110, rY: 700, eX0: 90, eX1: 990, rX0: 300, rX1: 780 };
    g.slope = (g.rX0 - g.eX0) / (g.eY - g.rY);   // rake run per px of rise
    g.rakeL = (y) => g.eX0 + (g.eY - y) * g.slope;
    g.rakeR = (y) => g.eX1 - (g.eY - y) * g.slope;
    return g;
  },
  roofPath(g) { ctx.beginPath(); ctx.moveTo(g.eX0, g.eY); ctx.lineTo(g.rX0, g.rY); ctx.lineTo(g.rX1, g.rY); ctx.lineTo(g.eX1, g.eY); ctx.closePath(); },
  // clip to the roof, right of a cut line parallel to the left rake (off px in from the rake)
  cutClip(g, off) { ctx.beginPath(); ctx.moveTo(g.eX0 + off, g.eY + 30); ctx.lineTo(g.rX0 + off - 30 * g.slope, g.rY - 30); ctx.lineTo(1100, g.rY - 30); ctx.lineTo(1100, g.eY + 30); ctx.closePath(); ctx.clip(); },
  draw(t, c, E) {
    const K = TPL.sceneKit, S = TPL.sceneRoofLayers, b = c.beats, B = E.B, g = S.geo();
    const sky = easeIO(seg(t, b.sky, b.sky + 1.1)), close = easeIO(seg(t, b.close, b.close + 0.9));
    K.bg(t, E);
    if (sky > 0) {   // daylight comes up
      ctx.save(); ctx.globalAlpha *= sky;
      const gr = ctx.createLinearGradient(0, 0, 0, 1400); gr.addColorStop(0, '#2A74BE'); gr.addColorStop(0.55, '#6FB6EC'); gr.addColorStop(1, '#CDEBFF');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, E.W, E.H);
      K.glow(900, 560, 420, '#FFF6DA', 0.55); circle(900, 560, 70, '#FFF3CF');
      [[180, 640, 1.0, 0], [760, 840, 0.8, 2], [420, 560, 0.6, 4]].forEach(([x, y, s, ph]) => { const dx = ((t * 14 + ph * 90) % 1400) - 200; at(x + dx * 0.4 - 100, y, s, 0, () => S.cloud()); });
      ctx.restore();
    }
    const steps = c.steps || {}, order = ['deck', 'under', 'drip', 'shingles', 'ridge'];
    K.cam(t, c.dur, () => {
      S.ground(t, c, E, sky);
      S.house(t, c, E, g, sky);
      S.roof(t, c, E, g, close);
      // leader from the step chip to the layer going on
      const live = order.filter((k) => steps[k]);
      live.forEach((k, i) => {
        const t0 = b[k], t1 = live[i + 1] ? b[live[i + 1]] : b.close;
        const a = K.pop(t, t0 + 0.05, 240, 20) * K.out(t, t1 - 0.22, 0.2); if (a <= 0.01) return;
        const tg = S.target(k, g);
        ctx.save(); ctx.globalAlpha *= clamp(a); K.leader([[540, 516], [tg[0], 612], tg], clamp(a), B.sky, 4); circle(tg[0], tg[1], 12, B.sky); circle(tg[0], tg[1], 5, '#FFFFFF'); ctx.restore();
      });
    }, { z1: 1.05, fx: 540, fy: 1000 });
    const live = order.filter((k) => steps[k]);
    live.forEach((k, i) => {
      const t0 = b[k], t1 = live[i + 1] ? b[live[i + 1]] : b.close;
      K.chip(540, 470, steps[k], K.pop(t, t0, 260, 20) * K.out(t, t1 - 0.22, 0.2), E, { num: i + 1 });
    });
    K.caption(t, b.final, c.final, 400, E, { size: 68, lh: 1.14, shadow: true });
  },
  target(k, g) {   // where each leader points (on the cutaway steps near the ridge)
    const y = 790, x = g.rakeL(y);
    return { deck: [x + 135, y], under: [x + 225, y], drip: [g.rakeL(930) + 6, 930], shingles: [x + 380, y], ridge: [540, g.rY] }[k];
  },
  cloud() { const f = '#FFFFFF'; circle(0, 0, 46, f); circle(50, 10, 36, f); circle(-50, 12, 32, f); rrect(-84, 10, 168, 40, 20); ctx.fillStyle = f; ctx.fill(); },
  ground(t, c, E, sky) {
    const K = TPL.sceneKit, top = 1400;
    const gr = ctx.createLinearGradient(0, top, 0, 1920); gr.addColorStop(0, K.mix(K.mix(E.B.dark, '#1D4A3A', 0.6), '#6BAE72', sky)); gr.addColorStop(1, K.mix(E.B.dark, '#3F7D52', sky));
    ctx.fillStyle = gr; ctx.fillRect(-100, top, 1300, 600);
    ctx.fillStyle = K.mix('#24543F', '#7FC184', sky); ctx.fillRect(-100, top, 1300, 10);
    [[150, 1.0], [880, 1.2], [960, 0.8], [70, 0.7]].forEach(([x, s], i) => at(x, top + 4, s, 0, () => { const col = K.mix('#1F4A3A', '#4E9A62', sky); circle(-26, -22, 30, col); circle(16, -30, 36, col); circle(48, -16, 24, col); circle(10, -46, 22, K.mix('#2B5E48', '#6FB47A', sky)); }));
  },
  house(t, c, E, g, sky) {
    const K = TPL.sceneKit, P = K.P, x0 = 170, x1 = 910, y0 = g.eY, y1 = 1400;
    const sid = K.mix(K.mix(c.siding, '#0B1424', 0.35), c.siding, sky);
    K.box(x0, y0, x1 - x0, y1 - y0, 0, sid, { band: 0.06, hl: 0 });
    ctx.fillStyle = K.shade(sid, -0.08); for (let y = y0 + 28; y < y1; y += 28) ctx.fillRect(x0, y, x1 - x0, 3);
    ctx.fillStyle = K.shade(sid, -0.3); ctx.fillRect(x0, y0, x1 - x0, 22);   // soffit shadow
    [[260, 1180], [700, 1180]].forEach(([x, y]) => {
      K.box(x - 8, y - 8, 136, 156, 6, K.shade(sid, 0.5), { band: 0.08 });
      rrect(x, y, 120, 140, 4); const gw = ctx.createLinearGradient(0, y, 0, y + 140); gw.addColorStop(0, K.mix('#2B3A55', '#BFE3FF', sky)); gw.addColorStop(1, K.mix('#1C2840', '#7FB9E6', sky)); ctx.fillStyle = gw; ctx.fill();
      ctx.fillStyle = K.shade(sid, 0.5); ctx.fillRect(x + 57, y, 6, 140); ctx.fillRect(x, y + 67, 120, 6);
      ctx.save(); ctx.globalAlpha *= 0.25; K.poly([[x + 20, y], [x + 50, y], [x + 10, y + 140], [x - 20, y + 140]], '#FFFFFF'); ctx.restore();
    });
    // door
    K.box(468, 1210, 104, 190, 6, K.mix('#2B4466', E.B.card, 0.4), { band: 0.08 }); circle(554, 1310, 6, P.chrome);
  },
  roof(t, c, E, g, close) {
    const K = TPL.sceneKit, P = K.P, S = TPL.sceneRoofLayers, b = c.beats;
    const off = (o) => o * (1 - close);   // cutaway step offsets close up at the end
    // rafters + attic dark
    ctx.save(); S.roofPath(g); ctx.clip();
    ctx.fillStyle = '#1E2738'; ctx.fillRect(0, g.rY, 1080, g.eY - g.rY);
    for (let x = g.eX0 + 10; x < g.eX1; x += 52) K.box(x, g.rY, 18, g.eY - g.rY, 0, P.stud, { band: 0, hl: 0, side: 'r', shade: -0.2 });
    K.box(g.rX0, g.rY, g.rX1 - g.rX0, 14, 0, K.shade(P.stud, -0.1), { band: 0.4, hl: 0 });
    ctx.restore();
    // deck sheets (stepped 90px in from the rake)
    ctx.save(); S.roofPath(g); ctx.clip(); S.cutClip(g, off(90));
    const cols = 5, rows = 3, sw = (g.eX1 - g.eX0) / cols, sh = (g.eY - g.rY) / rows;
    for (let j = 0; j < rows; j++) for (let i = 0; i <= cols; i++) {
      const x = g.eX0 + i * sw - (j % 2 ? sw / 2 : 0), y = g.rY + j * sh; if (x >= g.eX1) continue;
      const d = b.deck + 0.1 + (rows - 1 - j) * 0.28 + i * 0.07, p = spring(t - d, 240, 18); if (p <= 0.001) continue;
      withAlpha(clamp(p * 2), () => at(0, -(1 - clamp(p)) * 30, 1, 0, () => {
        ctx.fillStyle = '#C59C66'; ctx.fillRect(x, y, sw, sh);
        ctx.fillStyle = '#D7B07A'; ctx.fillRect(x + 3, y + 3, sw - 6, sh - 6);
        const Rs = RNG('osb', i, j); for (let k = 0; k < 26; k++) { ctx.fillStyle = Rs.f() < 0.5 ? 'rgba(120,80,40,0.22)' : 'rgba(255,240,210,0.25)'; ctx.fillRect(x + Rs.r(6, sw - 20), y + Rs.r(6, sh - 10), Rs.r(6, 16), Rs.r(2, 5)); }
      }));
    }
    ctx.restore();
    // underlayment: courses unroll left to right from the eave up (180px in)
    ctx.save(); S.roofPath(g); ctx.clip(); S.cutClip(g, off(180));
    const uc = 3, uh = (g.eY - g.rY) / uc;
    for (let j = 0; j < uc; j++) {
      const d = b.under + 0.1 + j * 0.38, u = easeIO(seg(t, d, d + 0.55)); if (u <= 0) continue;
      const y = g.eY - (j + 1) * uh - 8, xr = lerp(g.eX0 - 40, g.eX1 + 40, u);
      ctx.save(); ctx.beginPath(); ctx.rect(0, y, xr, uh + 10); ctx.clip();
      ctx.fillStyle = '#7D8DA2'; ctx.fillRect(0, y, 1080, uh + 10);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (let k = 0; k < 3; k++) ctx.fillRect(0, y + 24 + k * 40, 1080, 3);
      ctx.fillStyle = 'rgba(0,10,30,0.25)'; ctx.fillRect(0, y + uh + 4, 1080, 6);
      ctx.restore();
      if (u < 1) { K.box(xr - 16, y - 6, 26, uh + 20, 12, '#93A2B5', { band: 0.2, hl: 0.3 }); }
    }
    ctx.restore();
    // shingles: course by course from the eave (270px in)
    ctx.save(); S.roofPath(g); ctx.clip(); S.cutClip(g, off(270));
    const exp = 37, nC = Math.ceil((g.eY - g.rY) / exp) + 1, tw = 64;
    for (let j = 0; j < nC; j++) {
      const d = b.shingles + 0.12 + j * 0.2, p = spring(t - d, 300, 20); if (p <= 0.001) continue;
      const y = g.eY - (j + 1) * exp + 4, Rr = RNG('sh', j);
      withAlpha(clamp(p * 2.5), () => at(0, -(1 - clamp(p)) * 22, 1, 0, () => {
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, y + exp - 2, 1080, 6);
        for (let x = g.eX0 - 40 - (j % 2 ? tw / 2 : 0); x < g.eX1 + 40; x += tw) {
          ctx.fillStyle = K.shade(c.shingle, Rr.r(-0.08, 0.1)); ctx.fillRect(x, y, tw - 3, exp + 2);
          ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x, y, tw - 3, 4);
        }
      }));
    }
    // sheen across the finished roof
    K.sheen(g.eX0, g.rY, g.eX1 - g.eX0, g.eY - g.rY, seg(t, b.sheen, b.sheen + 1.2), 0.18);
    ctx.restore();
    // drip edge along eave + rakes
    const du = easeIO(seg(t, b.drip + 0.1, b.drip + 0.8));
    if (du > 0) {
      const Pth = [[g.rX0, g.rY], [g.eX0 - 4, g.eY], [g.eX1 + 4, g.eY], [g.rX1, g.rY]];
      line(partial(Pth, du), 'rgba(0,10,30,0.35)', 12); line(partial(Pth, du), '#D7DEE6', 8);
    }
    // fascia + gutter
    K.box(g.eX0 - 10, g.eY, g.eX1 - g.eX0 + 20, 20, 4, '#F1F3F5', { band: 0.35 });
    // ridge cap
    const nr = 13, rw = (g.rX1 - g.rX0) / nr;
    for (let i = 0; i < nr; i++) {
      const cx = g.rX0 + (i + 0.5) * rw, edge = g.rX0 + off(270) - 30 * g.slope;   // caps only over shingled roof
      const p = spring(t - b.ridge - 0.1 - i * 0.055, 320, 16) * clamp((cx - edge) / 24 + 0.5); if (p <= 0.001) continue;
      at(cx, g.rY, p, 0, () => K.box(-rw / 2 - 4, -16, rw + 8, 28, 8, K.shade(c.shingle, -0.12), { band: 0.3, hl: 0.25 }));
    }
    // cut edges: a thin highlight on each step so the layers read as layers
    if (close < 1) withAlpha(1 - close, () => [[90, '#E8C690', b.deck + 1.0], [180, '#B3C2D4', b.under + 1.2], [270, '#6F7B8C', b.shingles + 0.3]].forEach(([o, col, tt]) => {
      if (t < tt) return; ctx.save(); S.roofPath(g); ctx.clip(); line([[g.eX0 + off(o), g.eY], [g.rX0 + off(o), g.rY]], col, 4); ctx.restore();
    }));
  },
};
