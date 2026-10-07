// scene-bath-build — full-screen bathroom cutaway build (opaque B-roll, 13s), same language as scene-kitchen-build.
// Dated bathroom → demo (fixtures drop out, the old wall breaks away to the studs, vinyl peels off) → plumbing lines draw
// in → shower tile + drywall go up → floating vanity + mirror → floor tile lays in → sconces + can lights switch on →
// final hold with the label. cfg.steps maps each stage to an optional numbered label ('' hides it) so editors can sync to
// an inclusion list; cfg.beats retimes the stages. Stage keys: demo, plumbing, walls, vanity, flooring, lighting.
TPL.sceneBathBuild = {
  dur: 13,
  defaults: {
    steps: { demo: 'Full demo', plumbing: 'New plumbing', walls: 'Shower walls', vanity: 'Vanity + mirror', flooring: 'Tile flooring', lighting: 'Lighting' },
    beats: { demo: 0.35, old: 0.45, chunks: 0.75, peel: 1.05, plumbing: 2.15, walls: 3.85, drywall: 4.25, glass: 4.85, fixtures: 5.1, vanity: 5.5, mirror: 5.85, faucet: 6.15, flooring: 6.95, lighting: 8.35, cans: 8.75, decor: 9.1, final: 9.7, sheen: 10.7 },
    final: 'YOUR NEW BATHROOM,|*START TO FINISH*',
    wall: '#DDE6EE', tile: '#E6E2DC', vanity: '#B98A5E', floorTile: '#D9D3C9',
  },
  draw(t, c, E) {
    const K = TPL.sceneKit, S = TPL.sceneBathBuild, b = c.beats;
    K.bg(t, E);
    const g = K.roomGeo(70, 575, 940, 845);
    const lit = easeOut(seg(t, b.lighting, b.lighting + 0.3)), cans = easeOut(seg(t, b.cans, b.cans + 0.3));
    K.cam(t, c.dur, () => {
      K.room(g, E, {
        wall: c.wall,
        floorFn: (gg, Q) => S.floor(t, c, E, Q),
        wallFn: () => S.wall(t, c, E, g),
      });
      S.oldStuff(t, c, E, g);
      S.newStuff(t, c, E, g, lit, cans);
    }, { z1: 1.06, fx: 540, fy: 1020 });
    S.labels(t, c, E);
  },
  // ---- walls: old finish breaks away in chunks → studs + plumbing → tile + drywall
  wall(t, c, E, g) {
    const K = TPL.sceneKit, P = K.P, b = c.beats, S = TPL.sceneBathBuild;
    const x0 = g.bx, x1 = g.bx + g.bw, y0 = g.by, y1 = g.fy;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
    // framing
    ctx.fillStyle = '#3C4A60'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let x = x0 + 6; x < x1 - 10; x += 64) K.box(x, y0, 22, y1 - y0, 2, P.stud, { band: 0, hl: 0, side: 'r', shade: -0.18 });
    K.box(x0, y0, x1 - x0, 20, 0, K.shade(P.stud, -0.05), { band: 0.3, hl: 0 }); K.box(x0, y1 - 20, x1 - x0, 20, 0, K.shade(P.stud, -0.05), { band: 0.3, hl: 0 });
    K.box(x0, 880, x1 - x0, 16, 0, K.shade(P.stud, -0.08), { band: 0.3, hl: 0 });
    S.pipes(t, c, E);
    // new shower tile (left) — set row by row from the floor up
    const tx0 = x0, tx1 = 520, tw = (tx1 - tx0) / 2, rows = 5, th = (y1 - y0) / rows;
    for (let r = 0; r < rows; r++) for (let q = 0; q < 2; q++) {
      const d = b.walls + (rows - 1 - r) * 0.13 + q * 0.06, p = spring(t - d, 260, 17); if (p <= 0.001) continue;
      const x = tx0 + q * tw, y = y0 + r * th;
      withAlpha(clamp(p * 2), () => at(x + tw / 2, y + th / 2 - (1 - clamp(p)) * 40, 0.92 + 0.08 * p, 0, () => {
        ctx.fillStyle = K.shade(c.tile, -0.14); ctx.fillRect(-tw / 2 - 0.5, -th / 2 - 0.5, tw + 1, th + 1);
        K.box(-tw / 2 + 2, -th / 2 + 2, tw - 4, th - 4, 3, c.tile, { band: 0.05, hl: 0.4, hlH: 4 });
        const V = RNG('bt', r, q); ctx.strokeStyle = K.a(P.vein, 0.35); ctx.lineWidth = 2; ctx.beginPath(); const vx = V.r(-tw / 3, tw / 3);
        ctx.moveTo(vx, -th / 2 + 6); ctx.bezierCurveTo(vx + V.r(-40, 40), -10, vx + V.r(-40, 40), 20, vx + V.r(-50, 50), th / 2 - 6); ctx.stroke();
      }));
    }
    // drywall sheets slide in from the right, already painted
    [[520, 715], [715, x1]].forEach(([a, bb], i) => {
      const p = spring(t - b.drywall - i * 0.18, 190, 18); if (p <= 0.001) return;
      ctx.save(); ctx.beginPath(); ctx.rect(520, y0, x1 - 520, y1 - y0); ctx.clip();
      at((1 - p) * 420, 0, 1, 0, () => { ctx.fillStyle = c.wall; ctx.fillRect(a, y0, bb - a, y1 - y0); ctx.fillStyle = K.shade(c.wall, -0.06); ctx.fillRect(bb - 2, y0, 2, y1 - y0); ctx.fillRect(a, y1 - 14, bb - a, 14); });
      ctx.restore();
    });
    // old finish: beige paint + almond tile, broken into chunks that drop away
    const cols = 6, rws = 6, cw = (x1 - x0) / cols, ch = (y1 - y0) / rws, R = RNG('bath-chunks');
    for (let j = 0; j < rws; j++) for (let i = 0; i < cols; i++) {
      const jit = R.f(), rot = R.r(-1, 1), d = b.chunks + j * 0.1 + i * 0.035 + jit * 0.1, u = seg(t, d, d + 0.7);
      if (u >= 1) continue;
      const cx = x0 + i * cw, cy = y0 + j * ch;
      ctx.save(); ctx.translate(cx + cw / 2, cy + ch / 2 + 560 * u * u); ctx.rotate(rot * 0.7 * u); ctx.translate(-(cx + cw / 2), -(cy + ch / 2)); ctx.globalAlpha *= 1 - easeIn(u);
      ctx.beginPath(); ctx.rect(cx - 0.5, cy - 0.5, cw + 1, ch + 1); ctx.clip();
      S.oldWall(c, E, g);
      if (u > 0) { ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 3; ctx.strokeRect(cx, cy, cw, ch); }
      ctx.restore();
    }
    ctx.restore();
  },
  oldWall(c, E, g) {
    const K = TPL.sceneKit, P = K.P;
    ctx.fillStyle = '#E3D6BE'; ctx.fillRect(g.bx, g.by, g.bw, g.bh);
    const ts = 33, x0 = 190, x1 = 520;
    ctx.fillStyle = K.shade(P.tileOld, -0.12); ctx.fillRect(x0, 708, x1 - x0, g.fy - 708);
    for (let y = 708; y < g.fy; y += ts) for (let x = x0; x < x1; x += ts) { rrect(x + 1.5, y + 1.5, Math.min(ts, x1 - x) - 3, ts - 3, 3); ctx.fillStyle = Math.round((y - 708) / ts) === 5 ? P.tileOldBand : P.tileOld; ctx.fill(); }
    ctx.fillStyle = K.shade('#E3D6BE', -0.08); ctx.fillRect(g.bx, g.fy - 14, g.bw, 14);
  },
  pipes(t, c, E) {
    const K = TPL.sceneKit, b = c.beats, hot = K.P.copper, cold = E.B.sky, drain = '#C5CCD4';
    const runs = [
      { P: [[300, 1308], [300, 1150], [720, 1150], [720, 1104]], c: cold, d: 0.0, lw: 10 },
      { P: [[300, 1150], [300, 1030], [338, 1030]], c: cold, d: 0.35, lw: 10 },
      { P: [[410, 1308], [410, 1186], [770, 1186], [770, 1104]], c: hot, d: 0.15, lw: 10 },
      { P: [[410, 1186], [410, 1030], [362, 1030]], c: hot, d: 0.5, lw: 10 },
      { P: [[350, 1018], [350, 760], [376, 744]], c: K.mix(hot, cold, 0.5), d: 0.75, lw: 9 },
      { P: [[745, 1308], [745, 1206]], c: drain, d: 0.9, lw: 18 },
      { P: [[352, 1308], [352, 1288]], c: drain, d: 0.95, lw: 18 },
    ];
    runs.forEach((r) => {
      const u = easeIO(seg(t, b.plumbing + r.d, b.plumbing + r.d + 0.6)); if (u <= 0) return;
      line(partial(r.P, u), K.shade(r.c, -0.25), r.lw + 4); line(partial(r.P, u), r.c, r.lw);
      if (u >= 1) { r.P.slice(1, -1).forEach(([x, y]) => circle(x, y, r.lw * 0.85, K.shade(r.c, -0.1))); circle(r.P[r.P.length - 1][0], r.P[r.P.length - 1][1], r.lw * 0.75, K.shade(r.c, 0.2)); }
      // flow pulses once the run is in
      if (u >= 1 && r.lw < 14) { ctx.save(); ctx.globalAlpha *= 0.7 * (1 - seg(t, b.walls + 0.3, b.walls + 0.8)); ctx.setLineDash([6, 40]); ctx.lineDashOffset = -t * 160; line(r.P, '#FFFFFF', 4); ctx.restore(); }
    });
    const vu = spring(t - b.plumbing - 0.75, 260, 16); if (vu > 0.001) at(350, 1030, vu, 0, () => K.box(-18, -18, 36, 36, 6, '#B7BEC7', { band: 0.3 }));
  },
  // ---- floor: vinyl peels away → plywood subfloor → large tiles lay in
  floor(t, c, E, Q) {
    const K = TPL.sceneKit, b = c.beats, [bl, br, fr, fl] = Q;
    K.planks(Q, '#C9A77C', 4, { rows: 2, lineShade: -0.18 });
    const quad = (u0, u1, v0, v1) => {
      const pt = (u, v) => [lerp(lerp(bl[0], br[0], u), lerp(fl[0], fr[0], u), v), lerp(bl[1], fl[1], v)];
      return [pt(u0, v0), pt(u1, v0), pt(u1, v1), pt(u0, v1)];
    };
    const nc = 7, nr = 2;
    for (let j = 0; j < nr; j++) for (let i = 0; i < nc; i++) {
      const d = b.flooring + i * 0.1 + j * 0.16, p = spring(t - d, 260, 17); if (p <= 0.001) continue;
      const q = quad(i / nc, (i + 1) / nc, j / nr, (j + 1) / nr), cx = (q[0][0] + q[2][0]) / 2, cy = (q[0][1] + q[2][1]) / 2;
      withAlpha(clamp(p * 2), () => at(cx, cy - (1 - clamp(p)) * 24, 0.9 + 0.1 * p, 0, () => at(-cx, -cy, 1, 0, () => {
        K.poly(q, K.shade(c.floorTile, -0.18));
        const ins = q.map(([x, y]) => [lerp(x, cx, 0.06), lerp(y, cy, 0.12)]);
        K.poly(ins, K.shade(c.floorTile, ((i + j) % 2) * 0.05));
      })));
    }
    // old vinyl on top, peeling away to the back
    const u = easeIO(seg(t, b.peel, b.peel + 0.8)); if (u >= 1) return;
    ctx.save(); K.poly(Q, 'rgba(0,0,0,0)'); ctx.beginPath(); ctx.moveTo(...bl); ctx.lineTo(...br); ctx.lineTo(...fr); ctx.lineTo(...fl); ctx.closePath(); ctx.clip();
    const yCut = lerp(fl[1] + 4, bl[1], u);
    ctx.beginPath(); ctx.rect(0, bl[1] - 2, 1080, yCut - bl[1] + 2); ctx.clip();
    ctx.fillStyle = '#D9CBB0'; ctx.fillRect(0, bl[1], 1080, fl[1] - bl[1]);
    ctx.fillStyle = '#C8B793'; for (let i = 0; i < 18; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2) ctx.fillRect(60 + i * 56 - j * 8, bl[1] + j * 27, 56, 27);
    ctx.restore();
    if (u > 0) { ctx.save(); ctx.beginPath(); ctx.ellipse(540, yCut, 470, 9, 0, 0, Math.PI * 2); ctx.fillStyle = '#E8DCC4'; ctx.fill(); ctx.restore(); }
  },
  // ---- the dated fixtures fall out first
  oldStuff(t, c, E, g) {
    const K = TPL.sceneKit, P = K.P, b = c.beats;
    const fall = (d, cx, cy, rot, fn) => {
      const u = seg(t, d, d + 0.75); if (u >= 1) return;
      ctx.save(); rrect(g.cx0, g.cy0, g.cw, g.ch, 10); ctx.clip();
      at(cx, cy + 640 * u * u, 1, rot * u, () => withAlpha(1 - easeIn(u), fn)); ctx.restore();
    };
    fall(b.old + 0.3, 358, 1225, -0.25, () => { K.box(-164, -64, 328, 140, 14, '#F2EADB', { band: 0.2 }); K.box(-170, -78, 340, 24, 12, '#FAF5EA', { band: 0.3 }); });
    fall(b.old, 730, 1195, 0.3, () => {
      K.box(-120, -100, 240, 205, 8, '#B88A57', { band: 0.1 }); K.box(-128, -114, 256, 22, 6, '#E2D3B5', { band: 0.3 });
      [-58, 58].forEach((x) => { rrect(x - 48, -78, 96, 160, 6); ctx.strokeStyle = K.shade('#B88A57', -0.2); ctx.lineWidth = 4; ctx.stroke(); circle(x + (x < 0 ? 34 : -34), 0, 6, P.chromeDark); });
    });
    fall(b.old + 0.12, 730, 900, -0.2, () => { K.box(-100, -110, 200, 220, 4, '#C9D7E3', { band: 0, hl: 0 }); ctx.save(); ctx.globalAlpha *= 0.4; K.poly([[-60, -110], [-20, -110], [-80, 110], [-100, 110], [-100, 60]], '#FFFFFF'); ctx.restore(); });
    fall(b.old + 0.2, 730, 760, 0.25, () => { K.box(-104, -14, 208, 26, 8, '#C6B79A', { band: 0.3 }); for (let i = 0; i < 4; i++) circle(-72 + i * 48, 10, 15, '#FFFBEF'); });
  },
  newStuff(t, c, E, g, lit, cans) {
    const K = TPL.sceneKit, P = K.P, b = c.beats;
    // shower: curb, glass, rain head + valve trim
    const fx = spring(t - b.fixtures, 260, 16);
    if (fx > 0.001) {
      at(350, 1030, fx, 0, () => { circle(0, 0, 38, P.chrome); circle(0, 0, 30, K.shade(P.chrome, 0.25)); K.box(-6, -6, 58, 13, 6, P.chromeDark, { band: 0 }); });
      at(376, g.by, 1, 0, () => { K.box(-6, 0, 12, 92 * clamp(fx), 5, P.chrome, { band: 0, hl: 0.3 }); at(0, 98, fx, 0, () => { K.box(-74, -8, 148, 20, 9, P.chrome, { band: 0.45 }); }); });
    }
    const cu = spring(t - b.walls - 0.7, 220, 18);
    if (cu > 0.001) withAlpha(cu, () => K.box(g.bx - 4, g.fy - 30, 524 - g.bx + 4, 34, 6, '#F4F5F3', { band: 0.35 }));
    const gp = spring(t - b.glass, 200, 18);
    if (gp > 0.001) withAlpha(gp, () => at((1 - gp) * -160, 0, 1, 0, () => {
      rrect(380, 724, 140, g.fy - 30 - 724, 3); ctx.fillStyle = K.a(P.glass, 0.24); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 4; ctx.stroke();
      ctx.save(); ctx.globalAlpha *= 0.32; K.poly([[410, 740], [440, 740], [396, 960], [384, 960]], '#FFFFFF'); ctx.restore();
      ctx.save(); rrect(380, 724, 140, g.fy - 754, 3); ctx.clip(); K.sheen(380, 724, 140, g.fy - 754, seg(t, b.sheen, b.sheen + 0.9), 0.4); ctx.restore();
    }));
    // floating vanity + top + faucet, mirror, sconces
    const vp = spring(t - b.vanity, 200, 15);
    if (vp > 0.001) {
      ctx.save(); rrect(g.cx0, g.cy0, g.cw, g.ch, 10); ctx.clip();
      at(0, -(1 - vp) * 700, 1, 0, () => {
        K.box(604, 1068, 276, 128, 8, c.vanity, { band: 0.1, hl: 0.25 });
        [0, 1].forEach((i) => { K.box(614 + i * 133, 1078, 123, 108, 5, K.shade(c.vanity, 0.05), { band: 0.12, hl: 0 }); K.box(614 + i * 133 + 40, 1094, 44, 8, 4, P.chromeDark, { band: 0, hl: 0 }); });
        K.box(594, 1046, 296, 24, 5, '#F7F7F3', { band: 0.3, shade: -0.1, hl: 0.5 });
      });
      ctx.restore();
      if (vp > 0.6) K.contact(742, 1300, 230, 0.16 * clamp((vp - 0.6) * 2.5));
    }
    const fp = spring(t - b.faucet, 280, 15);
    if (fp > 0.001) at(742, 1046, fp, 0, () => { K.box(-12, -8, 24, 10, 4, P.chrome, { band: 0.4 }); line([[0, -6], [0, -62], [10, -76], [30, -76], [36, -64]], P.chrome, 8); });
    const mp = spring(t - b.mirror, 210, 17);
    if (mp > 0.001) withAlpha(clamp(mp * 2), () => at(742, 880, 0.8 + 0.2 * mp, 0, () => {
      rrect(-92, -136, 184, 272, 92); ctx.fillStyle = '#2B3647'; ctx.fill();
      rrect(-84, -128, 168, 256, 84); const gr = ctx.createLinearGradient(0, -128, 0, 128); gr.addColorStop(0, '#CFE6F7'); gr.addColorStop(1, '#9FC3DE'); ctx.fillStyle = gr; ctx.fill();
      ctx.save(); rrect(-84, -128, 168, 256, 84); ctx.clip(); ctx.globalAlpha *= 0.4; K.poly([[-20, -140], [20, -140], [-70, 140], [-110, 140]], '#FFFFFF'); ctx.globalAlpha *= 0.6; K.poly([[40, -140], [56, -140], [-30, 140], [-46, 140]], '#FFFFFF'); ctx.restore();
    }));
    // sconces either side of the mirror
    [628, 856].forEach((x, i) => {
      const sp = spring(t - b.mirror - 0.25 - i * 0.1, 280, 16); if (sp <= 0.001) return;
      at(x, 860, sp, 0, () => { K.box(-6, -4, 12, 30, 4, '#2B3647', { band: 0 }); K.box(-17, -50, 34, 54, 12, lit > 0 ? K.mix('#F3F0EA', '#FFF3D6', lit) : '#F3F0EA', { band: 0.15 }); });
      if (lit > 0) { K.glow(x, 836, 150, K.P.warm, 0.5 * lit); K.glow(x, 836, 40, '#FFFFFF', 0.6 * lit); }
    });
    // recessed cans in the ceiling band
    [360, 740].forEach((x) => {
      const y = g.cy0 + (g.by - g.cy0) * 0.55, ap = spring(t - b.cans + 0.35, 280, 16); if (ap <= 0.001) return;
      K.ellipse(x, y, 34 * ap, 7 * ap, cans > 0 ? K.mix('#C7CDD5', '#FFF4D6', cans) : '#C7CDD5');
      if (cans > 0) { ctx.save(); rrect(g.cx0, g.cy0, g.cw, g.ch, 10); ctx.clip(); K.cone(x, y, 70, 360, 560, K.P.warm, 0.16 * cans); K.glow(x, y, 60, '#FFFFFF', 0.5 * cans); ctx.restore(); }
    });
    // towel ring + plant
    const dp = spring(t - b.decor, 260, 16);
    if (dp > 0.001) at(560, 960, dp, 0, () => { circle(0, -20, 18, null, P.chrome, 5); K.box(-30, -8, 60, 120, 10, '#F2C3A8', { band: 0.15, side: 'r' }); });
    const pp = spring(t - b.decor - 0.25, 260, 16);
    if (pp > 0.001) { K.contact(866, 1366, 90 * pp, 0.25); K.plant(866, 1360, pp, t * 0.8); }
    if (lit + cans > 0) { ctx.save(); rrect(g.cx0, g.cy0, g.cw, g.ch, 10); ctx.clip(); ctx.fillStyle = K.a(K.P.warm, 0.05 * (lit + cans) / 2); ctx.fillRect(g.cx0, g.cy0, g.cw, g.ch); ctx.restore(); }
  },
  labels(t, c, E) {
    const K = TPL.sceneKit, b = c.beats;
    const map = { demo: b.demo, plumbing: b.plumbing, walls: b.walls, vanity: b.vanity, flooring: b.flooring, lighting: b.lighting };
    const st = Object.entries(c.steps || {}).filter(([k, v]) => v && map[k] != null).map(([k, v]) => ({ at: map[k], label: v })).sort((x, y) => x.at - y.at);
    st.forEach((s, i) => {
      const next = st[i + 1] ? st[i + 1].at : b.final;
      K.chip(540, 468, s.label, K.pop(t, s.at - 0.05, 260, 20) * K.out(t, next - 0.22, 0.2), E, { num: i + 1 });
    });
    if (c.final) K.caption(t, b.final, c.final, 400, E, { size: 66, lh: 1.15, maxW: 980 });
  },
};
