// scene-kitchen-build — full-screen kitchen cutaway (opaque B-roll, 12s). Empty room with dashed plan lines → cabinets
// drop in on springs (base, uppers, island) → quartz slabs slide on → range, hood + faucet → subway backsplash ripples
// across → pendants lower and switch on with a warm glow (window goes to dusk) → final hold with the label.
// cfg.steps maps each build stage to an optional numbered label ('' = no label) so editors can sync to an inclusion
// list; cfg.beats moves the stages to the VO. Stage keys: cabinets, countertop, appliances, backsplash, lights.
TPL.sceneKitchenBuild = {
  dur: 12,
  defaults: {
    steps: { cabinets: 'Custom cabinets', countertop: 'Quartz countertops', appliances: '', backsplash: 'Tile backsplash', lights: 'Pendant lighting' },
    beats: { cabinets: 0.45, uppers: 1.4, island: 2.15, countertop: 2.95, appliances: 3.85, backsplash: 4.8, lights: 6.35, on: 7.15, final: 8.8, decor: 9.7, sheen: 10.5 },
    final: 'YOUR NEW KITCHEN,|*START TO FINISH*',
    colors: {},
  },
  draw(t, c, E) {
    const K = TPL.sceneKit, b = c.beats;
    K.bg(t, E);
    const on = [0, 1, 2].map((i) => easeOut(seg(t, b.on + i * 0.32, b.on + i * 0.32 + 0.22)));
    const lit = (on[0] + on[1] + on[2]) / 3;
    const KI = K.kitchen(E, { colors: c.colors, dusk: 0.1 + 0.62 * lit }), G = KI.G;
    const pieces = (g) => KI.L.filter((p) => p.g === g);
    const clipCav = (fn) => { ctx.save(); rrect(G.cx0, G.cy0, G.cw, G.ch, 10); ctx.clip(); fn(); ctx.restore(); };
    const drop = (pc, d, k = 210, dd = 15) => {   // falls in from above the ceiling line, lands with a small bounce
      const p = spring(t - d, k, dd); if (p <= 0.001) return 0;
      clipCav(() => at(0, -(1 - p) * 760, 1, 0, () => pc.prims.forEach((q) => K.prim(q))));
      return p;
    };
    K.cam(t, c.dur, () => {
      K.room(G, E, { wall: KI.C.wall, floorFn: (g, Q) => K.planks(Q, KI.C.floor, 11, { lineShade: -0.12 }) });
      pieces('window').forEach((pc) => pc.prims.forEach((q) => K.prim(q)));
      // dashed plan lines of the layout, fading as each unit lands
      ['base', 'upper', 'island'].forEach((g) => pieces(g).forEach((pc) => {
        const d = g === 'base' ? b.cabinets + pc.i * 0.2 : g === 'upper' ? b.uppers + pc.i * 0.2 : b.island;
        const a = 1 - seg(t, d + 0.15, d + 0.45); if (a <= 0) return;
        const q = pc.prims[0]; ctx.save(); ctx.globalAlpha *= 0.55 * a; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t * 30;
        rrect(q.x, q.y, q.w, q.h, 6); ctx.strokeStyle = E.B.sky; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      }));
      // backsplash ripple (left to right)
      pieces('splash').forEach((pc) => {
        const d = b.backsplash + (pc.cx - 180) / 720 * 1.0 + ((pc.cy - KI.uBot) / 25) * 0.035, p = spring(t - d, 320, 15); if (p <= 0.001) return;
        at(pc.cx, pc.cy + 12, clamp(p, 0, 1.15), 0, () => at(-pc.cx, -pc.cy - 12, 1, 0, () => withAlpha(clamp(p * 2), () => pc.prims.forEach((q) => K.prim(q)))));
      });
      pieces('upper').forEach((pc) => drop(pc, b.uppers + pc.i * 0.2));
      pieces('hood').forEach((pc) => drop(pc, b.appliances + 0.2, 200, 16));
      // under-cabinet glow
      if (lit > 0) [[180, 440], [770, 900]].forEach(([x0, x1]) => { ctx.save(); ctx.globalAlpha *= lit; const gr = ctx.createLinearGradient(0, KI.uBot, 0, KI.uBot + 120); gr.addColorStop(0, K.a(K.P.warm, 0.5)); gr.addColorStop(1, K.a(K.P.warm, 0)); ctx.fillStyle = gr; ctx.fillRect(x0, KI.uBot, x1 - x0, 120); ctx.restore(); });
      pieces('base').forEach((pc) => { const p = drop(pc, b.cabinets + pc.i * 0.2); if (p > 0.6) K.contact(pc.cx, KI.cabBot + 2, 150, 0.2 * clamp((p - 0.6) * 3)); });
      pieces('range').forEach((pc) => drop(pc, b.appliances, 200, 16));
      const cs = [b.countertop, b.countertop + 0.18];
      pieces('counter').forEach((pc, i) => { const p = spring(t - cs[i], 170, 18); if (p > 0.001) at((i ? 1 : -1) * (1 - p) * 760, 0, 1, 0, () => pc.prims.forEach((q) => K.prim(q))); });
      pieces('faucet').forEach((pc) => { const p = spring(t - b.appliances - 0.45, 260, 15); if (p > 0.001) at(540, KI.cTop, p, 0, () => at(-540, -KI.cTop, 1, 0, () => pc.prims.forEach((q) => K.prim(q)))); });
      pieces('island').forEach((pc) => { const p = drop(pc, b.island, 200, 15); if (p > 0.5) K.contact(540, 1380, 480, 0.25 * clamp((p - 0.5) * 2)); });
      pieces('islandTop').forEach((pc) => { const p = spring(t - b.countertop - 0.36, 170, 18); if (p > 0.001) clipCav(() => at((1 - p) * 820, 0, 1, 0, () => pc.prims.forEach((q) => K.prim(q)))); });
      pieces('decor').forEach((pc) => { const p = spring(t - b.decor - pc.i * 0.4, 280, 15); if (p > 0.001) at(pc.cx, pc.cy, p, 0, () => at(-pc.cx, -pc.cy, 1, 0, () => pc.prims.forEach((q) => K.prim(q)))); });
      // sheen across the island top + counters
      [[286, 1222, 508, 24], [170, 1044, 452, 24]].forEach(([x, y, w, h], i) => { ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); K.sheen(x, y, w, h, seg(t, b.sheen + i * 0.25, b.sheen + i * 0.25 + 0.8), 0.55); ctx.restore(); });
      // pendants lower on their cords, then switch on one by one
      pieces('pendant').forEach((pc) => {
        const p = spring(t - b.lights - pc.i * 0.15, 150, 11); if (p <= 0.001) return;
        clipCav(() => at(0, -(1 - p) * 420, 1, Math.sin((t - b.lights) * 3 + pc.i) * 0.004 * (1 - clamp(t - b.lights - 1.5)), () => pc.prims.forEach((q) => K.prim(q))));
        const o = on[pc.i]; if (o <= 0) return;
        clipCav(() => {
          K.cone(pc.cx, 982, 92, 330, 250, K.P.warm, 0.2 * o);
          K.glow(pc.cx, 984, 120, K.P.warm, 0.55 * o);
          K.ellipse(pc.cx, 981, 44, 6, K.a('#FFF4D6', o));
          K.glow(pc.cx, 1226, 150, K.P.warm, 0.22 * o);
        });
      });
      if (lit > 0) clipCav(() => { ctx.fillStyle = K.a(K.P.warm, 0.07 * lit); ctx.fillRect(G.cx0, G.cy0, G.cw, G.ch); });
    }, { z1: 1.06, fx: 540, fy: 1030 });
    TPL.sceneKitchenBuild.labels(t, c, E);
  },
  labels(t, c, E) {
    const K = TPL.sceneKit, b = c.beats;
    const map = { cabinets: b.cabinets, countertop: b.countertop, appliances: b.appliances, backsplash: b.backsplash, lights: b.lights };
    const st = Object.entries(c.steps || {}).filter(([k, v]) => v && map[k] != null).map(([k, v]) => ({ at: map[k], label: v })).sort((x, y) => x.at - y.at);
    st.forEach((s, i) => {
      const next = st[i + 1] ? st[i + 1].at : b.final;
      K.chip(540, 468, s.label, K.pop(t, s.at - 0.05, 260, 20) * K.out(t, next - 0.22, 0.2), E, { num: i + 1 });
    });
    if (c.final) K.caption(t, b.final, c.final, 400, E, { size: 66, lh: 1.15, maxW: 980 });
  },
};
