// scene-see-it-first — "See it before it's built" (opaque B-roll, 11s). The kitchen from scene-kitchen-build draws itself
// in white line art on dark navy (room → window → cabinets → range → island → backsplash → pendants), then fills with
// colour and material section by section, the lines melt away, the pendants switch on warm and the diorama frame settles
// in: a finished illustration. Illustration only, no design-software UI. cfg.caption is the label; cfg.colors restyles
// the kitchen (cab, island, counter, splash, wall, floor...).
TPL.sceneSeeItFirst = {
  dur: 11,
  defaults: {
    caption: 'SEE YOUR NEW KITCHEN|*BEFORE WE BUILD IT*',
    colors: {},
    beats: { caption: 0.3, draw: 0.15, fill: 4.1, lights: 7.6, frame: 7.4, sheen: 9.2 },
  },
  // draw-on and fill order by group: [group, draw start, fill start] (offsets from beats.draw / beats.fill)
  // listed in back-to-front order (each piece hides the lines behind it while it draws)
  order: [['shell', 0, 0], ['window', 0.55, 0.3], ['splash', 2.35, 1.5], ['upper', 0.8, 0.6], ['hood', 1.2, 1.15], ['base', 1.1, 0.75], ['range', 1.45, 1.2],
    ['counter', 1.7, 1.0], ['faucet', 1.9, 1.35], ['decor', 3.1, 3.0], ['island', 2.0, 1.75], ['islandTop', 2.2, 1.95], ['pendant', 2.8, 2.6]],
  bounds(prims) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const add = (x, y) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
    prims.forEach((p) => {
      if (p.k === 'rect') { add(p.x, p.y); add(p.x + p.w, p.y + p.h); }
      else if (p.k === 'circ') { add(p.x - p.r, p.y - p.r); add(p.x + p.r, p.y + p.r); }
      else if (p.k === 'ell') { add(p.x - p.rx, p.y - p.ry); add(p.x + p.rx, p.y + p.ry); }
      else p.P.forEach(([x, y]) => add(x, y));
    });
    return { x0, y0, x1, y1 };
  },
  draw(t, c, E) {
    const K = TPL.sceneKit, S = TPL.sceneSeeItFirst, b = c.beats, B = E.B;
    K.bg(t, E);
    const on = [0, 1, 2].map((i) => easeOut(seg(t, b.lights + i * 0.28, b.lights + i * 0.28 + 0.22)));
    const lit = (on[0] + on[1] + on[2]) / 3;
    const KI = K.kitchen(E, { colors: c.colors, dusk: 0.1 + 0.62 * lit }), G = KI.G;
    // faint blueprint dot-grid that dissolves as the colour comes in
    const gridA = 0.5 * (1 - seg(t, b.fill, b.fill + 2.5));
    if (gridA > 0) { ctx.save(); ctx.globalAlpha *= gridA; ctx.fillStyle = K.a(B.sky, 0.35); for (let y = 520; y < 1480; y += 40) for (let x = 40; x < 1060; x += 40) ctx.fillRect(x - 1.5, y - 1.5, 3, 3); ctx.restore(); }
    K.cam(t, c.dur, () => {
      // the diorama frame settles in at the end
      const fr = easeOut(seg(t, b.frame, b.frame + 0.8));
      if (fr > 0) withAlpha(fr, () => {
        ctx.save(); ctx.globalAlpha *= 0.5; K.ellipse(G.X + G.Wd / 2, G.Y + G.Ht + 26, G.Wd * 0.48, 26, '#020812'); ctx.restore();
        card(G.X, G.Y, G.Wd, G.Ht, 30, K.mix(B.card, B.dark, 0.25), { blur: 60, dy: 24, shadowColor: 'rgba(0,6,20,0.55)' });
      });
      const lineFade = 1 - 0.85 * seg(t, b.fill + 1.2, b.fill + 3.4), paper = K.mix(B.dark, B.card, 0.32);
      S.order.forEach(([grp, dOff, fOff]) => {
        const pcs = KI.L.filter((p) => p.g === grp);
        pcs.forEach((pc, j) => {
          const stag = grp === 'splash' ? (pc.cx - 180) / 720 * 0.6 + j * 0.002 : j * 0.12;
          const d0 = b.draw + dOff + stag * 0.8, f0 = b.fill + fOff + stag * 0.7;
          const lu = easeIO(seg(t, d0, d0 + (grp === 'splash' ? 0.35 : grp === 'shell' ? 1.0 : 0.6)));
          const fu = easeIO(seg(t, f0, f0 + (grp === 'shell' ? 0.6 : grp === 'splash' ? 0.25 : 0.4)));
          if (lu <= 0 && fu <= 0) return;
          if (fu < 1 && lu > 0) {   // navy 'paper' under the line art so nearer pieces hide what is behind them
            ctx.save(); ctx.globalAlpha *= clamp(lu * 4) * (grp === 'shell' ? 0.55 : 1);
            pc.prims.forEach((q) => { if (q.k === 'path' || q.line === false) return; K.primPath(q); ctx.fillStyle = paper; ctx.fill(); });
            ctx.restore();
          }
          if (fu > 0) {
            const bb = S.bounds(pc.prims), h = bb.y1 - bb.y0 + 12;
            ctx.save(); ctx.beginPath(); ctx.rect(bb.x0 - 8, bb.y1 + 6 - h * fu, bb.x1 - bb.x0 + 16, h * fu + 2); ctx.clip();
            pc.prims.forEach((q) => K.prim(q, { fill: 1 }));
            if (grp === 'shell') K.planks(pc.prims[3].P, KI.C.floor, 11, { lineShade: -0.12 });
            ctx.restore();
            // a bright edge rides the fill line
            if (fu < 1) withAlpha(0.6 * Math.sin(fu * Math.PI), () => { ctx.fillStyle = B.sky; ctx.fillRect(bb.x0 - 4, bb.y1 + 6 - h * fu - 2, bb.x1 - bb.x0 + 8, 3); });
          }
          const la = lu * (fu > 0 ? lineFade : 1);
          if (la > 0) pc.prims.forEach((q) => K.prim(q, { fill: 0, line: lu, lineColor: fu > 0.5 ? K.mix(B.ink, B.card, 0.4) : B.ink, lw: grp === 'splash' ? 2 : 3, lineAlpha: fu > 0 ? lineFade : 0.95 }));
        });
      });
      // lights on: pendants glow, warm wash, under-cabinet light
      if (lit > 0) {
        ctx.save(); rrect(G.cx0, G.cy0, G.cw, G.ch, 10); ctx.clip();
        KI.L.filter((p) => p.g === 'pendant').forEach((pc) => {
          const o = on[pc.i]; if (o <= 0) return;
          K.cone(pc.cx, 982, 92, 330, 250, K.P.warm, 0.2 * o); K.glow(pc.cx, 984, 120, K.P.warm, 0.55 * o);
          K.ellipse(pc.cx, 981, 44, 6, K.a('#FFF4D6', o)); K.glow(pc.cx, 1226, 150, K.P.warm, 0.22 * o);
        });
        [[180, 440], [770, 900]].forEach(([x0, x1]) => { const gr = ctx.createLinearGradient(0, KI.uBot, 0, KI.uBot + 120); gr.addColorStop(0, K.a(K.P.warm, 0.5 * lit)); gr.addColorStop(1, K.a(K.P.warm, 0)); ctx.fillStyle = gr; ctx.fillRect(x0, KI.uBot, x1 - x0, 120); });
        ctx.fillStyle = K.a(K.P.warm, 0.07 * lit); ctx.fillRect(G.cx0, G.cy0, G.cw, G.ch);
        ctx.restore();
      }
      [[286, 1222, 508, 24], [170, 1044, 452, 24]].forEach(([x, y, w, h], i) => { ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); K.sheen(x, y, w, h, seg(t, b.sheen + i * 0.25, b.sheen + i * 0.25 + 0.8), 0.55); ctx.restore(); });
    }, { z0: 0.97, z1: 1.04, fx: 540, fy: 1000 });
    K.caption(t, b.caption, c.caption, 400, E, { size: 66, lh: 1.15, maxW: 980 });
  },
};
