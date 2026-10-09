// scene-tub-to-shower — full-screen bathroom cutaway (opaque B-roll, 12s). Dated tile + old tub → the curtain comes
// down, tiles pop off, the tub lifts away → new wall panels drop in → shower base slides in → glass door swings shut →
// rainfall head + fixtures pop in, water runs. A wall clock runs 8 AM → 5 PM the whole time. Ends on the claim label.
// cfg.claim is a CLIENT-CONFIRMED claim: only ship "in a day" when the client confirms the install time ('' hides it).
// cfg.steps: optional numbered step labels, each { at, label } — retime/relabel to match the VO or an inclusion list.
// No people in the scene (never imply the viewer's limitation).
TPL.sceneTubToShower = {
  dur: 12,
  defaults: {
    claim: 'TUB TO WALK-IN SHOWER|*IN A DAY*',
    finalAt: 8.7,
    steps: [
      { at: 0.35, label: 'Old tub out' },
      { at: 2.75, label: 'New wall panels' },
      { at: 3.9, label: 'New shower base' },
      { at: 4.85, label: 'Glass door' },
      { at: 6.3, label: 'Rainfall head + fixtures' },
    ],
    clock: { from: 8, to: 17, t0: 0.4, t1: 8.5 },
    beats: { curtain: 0.45, tiles: 0.95, tub: 1.4, panels: 2.85, base: 3.95, glass: 4.85, door: 5.15, rain: 6.35, valve: 6.65, hand: 6.95, niche: 7.25, water: 7.7, sheen: 9.4, glint: 10.4 },
    wall: '#DCE3EA', panel: '#EEF1F4', towel: '#E3A587',
  },
  draw(t, c, E) {
    const K = TPL.sceneKit, S = TPL.sceneTubToShower;
    K.bg(t, E);
    const g = K.roomGeo(70, 575, 940, 845);
    const A = { x0: 196, x1: 680, top: g.by, tileTop: 708, bot: g.fy, baseTop: g.fy - 48 };
    const cu = seg(t, c.clock.t0, c.clock.t1), hrs = lerp(c.clock.from, c.clock.to, lerp(cu, easeIO(cu), 0.4));
    K.cam(t, c.dur, () => {
      K.room(g, E, {
        wall: c.wall,
        floorFn: (gg, Q) => K.planks(Q, '#C7D0DA', 9, { rows: 3, lineShade: -0.09 }),
        wallFn: () => S.wall(t, c, E, g, A, hrs),
      });
      S.props(t, c, E, g, A, hrs);
      S.tub(t, c, E, A);
      S.base(t, c, E, A);
      S.fixtures(t, c, E, g, A);
      S.water(t, c, E, A);
      S.glass(t, c, E, A);
    }, { z1: 1.06, fx: 470, fy: 1010 });
    S.labels(t, c, E);
  },
  wall(t, c, E, g, A, hrs) {
    const K = TPL.sceneKit, P = K.P, b = c.beats, w = A.x1 - A.x0;
    ctx.save(); ctx.beginPath(); ctx.rect(A.x0, A.top, w, A.bot - A.top); ctx.clip();
    // backer board revealed by the demo
    ctx.fillStyle = '#BCC6D0'; ctx.fillRect(A.x0, A.top, w, A.bot - A.top);
    ctx.fillStyle = '#AEB9C4'; for (let i = 1; i < 3; i++) ctx.fillRect(A.x0 + w * i / 3 - 2, A.top, 4, A.bot - A.top);
    for (let j = 0; j < 7; j++) for (let i = 0; i < 6; i++) circle(A.x0 + 30 + i * (w - 60) / 5, A.top + 60 + j * 95, 3.5, '#9AA6B3');
    ctx.restore();
    // dated tile: almond squares + a mauve accent row, bullnose cap; each tile pops off in a top-down wave
    const ts = w / 10, rows = Math.ceil((A.bot - A.tileTop) / ts);
    const R = RNG('tub-tiles');
    ctx.save(); ctx.beginPath(); ctx.rect(A.x0 - 20, A.top, w + 40, A.bot - A.top); ctx.clip();
    const pu = seg(t, b.tiles - 0.05, b.tiles + 0.45);   // old paint above the tile comes off with it
    if (pu < 1) withAlpha(1 - pu, () => { ctx.fillStyle = c.wall; ctx.fillRect(A.x0, A.top, w, A.tileTop - A.top); });
    for (let j = 0; j < rows; j++) for (let i = 0; i < 10; i++) {
      const jit = R.f(), rot = R.r(-1, 1);
      const d = b.tiles + j * 0.075 + i * 0.012 + jit * 0.12, u = seg(t, d, d + 0.55);
      if (u >= 1) continue;
      const x = A.x0 + i * ts, y = A.tileTop + j * ts, col = j === 4 ? P.tileOldBand : P.tileOld;
      at(x + ts / 2, y + ts / 2 + 180 * u * u, 1 - 0.25 * u, rot * 1.1 * u, () => withAlpha(1 - easeIn(u), () => {
        ctx.fillStyle = K.shade(col, -0.1); ctx.fillRect(-ts / 2, -ts / 2, ts, ts);
        rrect(-ts / 2 + 2, -ts / 2 + 2, ts - 4, ts - 4, 4); ctx.fillStyle = col; ctx.fill();
        ctx.fillStyle = K.shade(col, 0.22); ctx.fillRect(-ts / 2 + 6, -ts / 2 + 5, ts - 12, 4);
      }));
    }
    const capU = seg(t, b.tiles - 0.05, b.tiles + 0.4);
    if (capU < 1) withAlpha(1 - capU, () => K.box(A.x0 - 6, A.tileTop - 16 - capU * 40, w + 12, 18, 6, K.shade(P.tileOld, -0.06), { band: 0.4 }));
    ctx.restore();
    // old fixtures on the tile (spout, two handles, small shower arm) leave with the tile
    const fo = seg(t, b.tiles + 0.1, b.tiles + 0.6);
    if (fo < 1) withAlpha(1 - fo, () => at(0, fo * 120, 1, 0, () => {
      K.box(A.x0 + 40, 1088, 70, 18, 8, P.chrome, { band: 0.4 }); K.box(A.x0 + 92, 1088, 18, 34, 6, P.chrome, { band: 0.3 });
      circle(A.x0 + 70, 1030, 14, P.chrome); circle(A.x0 + 130, 1030, 14, P.chrome);
      K.box(A.x0 + 60, 770, 64, 12, 6, P.chrome, { band: 0.4 }); K.poly([[A.x0 + 118, 762], [A.x0 + 150, 776], [A.x0 + 150, 796], [A.x0 + 118, 790]], P.chromeDark);
    }));
    // new wall panels drop in from the ceiling line (3 panels, soft marble veining)
    for (let k = 0; k < 3; k++) {
      const d = b.panels + k * 0.22, p = spring(t - d, 170, 16); if (p <= 0.001) continue;
      const px = A.x0 + k * w / 3, pw = w / 3, ph = A.bot - A.top, yo = -(1 - p) * (ph + 30);
      ctx.save(); ctx.beginPath(); ctx.rect(A.x0, A.top, w, ph); ctx.clip(); ctx.translate(0, yo);
      const gr = ctx.createLinearGradient(0, A.top, 0, A.bot); gr.addColorStop(0, K.shade(c.panel, 0.4)); gr.addColorStop(1, K.shade(c.panel, -0.05));
      ctx.fillStyle = gr; ctx.fillRect(px + 1.5, A.top, pw - 3, ph);
      ctx.fillStyle = K.shade(c.panel, -0.12); ctx.fillRect(px + pw - 3, A.top, 3, ph);
      const V = RNG('vein', k);
      for (let v = 0; v < 2; v++) {
        const x0 = px + V.r(0.1, 0.9) * pw, y0 = A.top + V.r(0.05, 0.5) * ph;
        ctx.beginPath(); ctx.moveTo(x0, y0);
        ctx.bezierCurveTo(x0 + V.r(-90, 90), y0 + V.r(80, 200), x0 + V.r(-90, 90), y0 + V.r(200, 380), x0 + V.r(-120, 120), y0 + V.r(380, 560));
        ctx.strokeStyle = K.a(K.P.vein, 0.38); ctx.lineWidth = 2.5; ctx.stroke();
        ctx.strokeStyle = K.a(K.P.vein, 0.22); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0 + 10, y0 + 120); ctx.quadraticCurveTo(x0 + V.r(-60, 60), y0 + 200, x0 + V.r(-80, 80), y0 + 280); ctx.stroke();
      }
      ctx.restore();
    }
    // soft daylight patch that crawls across the back wall as the day goes on
    const u = (hrs - c.clock.from) / Math.max(1, c.clock.to - c.clock.from), lx = lerp(g.bx + 40, g.bx + g.bw - 260, u);
    ctx.save(); ctx.beginPath(); ctx.rect(g.bx, g.by, g.bw, g.bh); ctx.clip(); ctx.globalAlpha *= 0.13 + 0.05 * Math.sin(u * Math.PI);
    K.poly([[lx, g.by], [lx + 170, g.by], [lx + 330, g.fy], [lx + 160, g.fy]], K.mix('#FFFFFF', K.P.warm, u * 0.8));
    ctx.restore();
  },
  props(t, c, E, g, A, hrs) {
    const K = TPL.sceneKit;
    // clock + a time tag that ticks over each hour
    K.clock(806, 778, 52, hrs, E);
    const h = Math.floor(hrs + 1e-6), lab = `${((h + 11) % 12) + 1} ${h >= 12 ? 'PM' : 'AM'}`;
    const bump = 1 + 0.12 * Math.max(0, 1 - (hrs - h) * 6) * (hrs > c.clock.from + 0.2 ? 1 : 0);
    at(806, 880, bump, 0, () => K.chip(0, 0, lab, 1, E, { size: 40, fill: E.B.card }));
    // towel bar + towel
    K.box(742, 1002, 136, 12, 6, K.P.chrome, { band: 0.4 });
    K.box(764, 1008, 92, 150, 10, c.towel, { band: 0.12, side: 'r' });
    ctx.fillStyle = K.shade(c.towel, 0.25); ctx.fillRect(764, 1118, 92, 10);
    K.contact(842, 1372, 90, 0.25);
    K.plant(842, 1366, 1.05, t * 0.8);
  },
  tub(t, c, E, A) {
    const K = TPL.sceneKit, P = K.P, b = c.beats, w = A.x1 - A.x0;
    const lift = easeIn(seg(t, b.tub, b.tub + 1.15)), al = 1 - seg(lift, 0.45, 1);
    // dust puffs at the base while it comes free
    const du = seg(t, b.tub + 0.05, b.tub + 1.3);
    if (du > 0 && du < 1) for (let i = 0; i < 5; i++) withAlpha(0.35 * (1 - du), () => circle(A.x0 + 40 + i * (w - 80) / 4, A.bot - 10 - du * 30, 26 + du * 50 + i % 2 * 12, '#E6EAF0'));
    if (al <= 0.001) return;
    K.contact(A.x0 + w / 2, A.bot + 8, w * (1 - lift * 0.6), 0.3 * al);
    // curtain + rod come down first
    const cb = easeIO(seg(t, b.curtain, b.curtain + 0.35)), cl = easeIn(seg(t, b.curtain + 0.3, b.curtain + 0.75));
    if (cl < 1) withAlpha(1 - cl, () => at(0, -cl * 160, 1, 0, () => {
      K.box(A.x0 - 8, 712, w + 16, 9, 4, P.chrome, { band: 0.4 });
      const cw = lerp(270, 90, cb), cx1 = A.x1 - 6, n = Math.max(4, Math.round(cw / 26));
      for (let i = 0; i < n; i++) {
        const x = cx1 - cw + i * cw / n;
        ctx.fillStyle = i % 2 ? '#C9A6A0' : '#E3D2C2'; ctx.fillRect(x, 722, cw / n + 1, 470);
        ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(x + cw / n * 0.6, 722, cw / n * 0.4, 470);
        circle(x + cw / n / 2, 717, 5, P.chromeDark);
      }
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(cx1 - cw, 1140, cw, 14);
    }));
    at(A.x0 + w / 2, A.bot - lift * 330, 1 + lift * 0.06, Math.sin(lift * Math.PI) * 0.035, () => withAlpha(al, () => {
      const x = -w / 2, top = -170;
      K.box(x, top + 14, w, 156, 16, P.porcelain, { band: 0.18, shade: -0.1 });
      K.box(x - 8, top, w + 16, 28, 14, '#FFFFFF', { band: 0.35, shade: -0.08 });
      ctx.fillStyle = 'rgba(0,20,50,0.06)'; ctx.fillRect(x + 20, top + 44, w - 40, 6);
      K.box(x + 30, top + 146, 40, 14, 6, '#E9ECEF', { band: 0.5 }); K.box(x + w - 70, top + 146, 40, 14, 6, '#E9ECEF', { band: 0.5 });
    }));
  },
  base(t, c, E, A) {
    const K = TPL.sceneKit, w = A.x1 - A.x0, p = spring(t - c.beats.base, 190, 19); if (p <= 0.001) return;
    at((1 - p) * 620, 0, 1, 0, () => {
      K.contact(A.x0 + w / 2, A.bot + 6, w, 0.25);
      K.box(A.x0 - 6, A.baseTop, w + 12, 50, 8, K.P.porcelain, { band: 0.4, shade: -0.08 });
      rrect(A.x0 + 30, A.baseTop + 6, w - 60, 6, 3); ctx.fillStyle = K.P.chromeDark; ctx.fill();
    });
  },
  fixtures(t, c, E, g, A) {
    const K = TPL.sceneKit, P = K.P, b = c.beats;
    const rp = spring(t - b.rain, 260, 17);
    if (rp > 0.001) at(380, g.by, 1, 0, () => {
      K.box(-7, 0, 14, 110 * clamp(rp), 6, P.chrome, { band: 0, hl: 0.3 });
      at(0, 118, rp, 0, () => { K.box(-86, -8, 172, 22, 10, P.chrome, { band: 0.45 }); for (let i = 0; i < 9; i++) circle(-64 + i * 16, 10, 2.5, P.chromeDark); });
    });
    const vp = spring(t - b.valve, 260, 17);
    if (vp > 0.001) at(318, 1010, vp, -0.6 * (1 - clamp(vp)), () => { circle(0, 0, 40, P.chrome); circle(0, 0, 32, K.shade(P.chrome, 0.25)); K.box(-6, -6, 64, 14, 7, P.chromeDark, { band: 0 }); circle(0, 0, 10, P.chromeDark); });
    const hp = spring(t - b.hand, 240, 17);
    if (hp > 0.001) withAlpha(hp, () => {
      K.box(240, 880, 10, 250 * clamp(hp), 5, P.chrome, { band: 0, hl: 0.3 });
      at(245, 930, hp, -0.25, () => { K.box(-14, -10, 28, 90, 12, P.chrome, { band: 0.3 }); K.box(-22, -36, 44, 34, 12, K.shade(P.chrome, 0.15), { band: 0.4 }); });
    });
    const np = spring(t - b.niche, 230, 18);
    if (np > 0.001) withAlpha(np, () => {
      const nx = 560, ny = 924, nw = 96, nh = 132;
      rrect(nx, ny, nw, nh, 8); ctx.fillStyle = K.shade(c.panel, -0.13); ctx.fill();
      ctx.fillStyle = K.shade(c.panel, -0.22); ctx.fillRect(nx, ny, nw, 12);
      [[nx + 14, '#7FB7E8', 70], [nx + 44, '#F7F7F2', 56], [nx + 70, K.P.plant, 46]].forEach(([x, col, hh], i) => at(x + 9, ny + nh, spring(t - b.niche - 0.12 - i * 0.1, 300, 16), 0, () => K.box(-9, -hh, 18 + (i === 1 ? 4 : 0), hh, 6, col, { band: 0.2 })));
    });
  },
  water(t, c, E, A) {
    const K = TPL.sceneKit, wa = seg(t, c.beats.water, c.beats.water + 0.5); if (wa <= 0) return;
    const y0 = 780 - 0, y1 = A.baseTop;
    ctx.save(); ctx.globalAlpha *= 0.42 * wa;
    for (let i = 0; i < 11; i++) {
      const x = 310 + i * 14 + Math.sin(i * 1.7) * 4, sp = 900 + (i % 3) * 120, ph = (i * 37) % 60;
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x + (i - 5) * 2.5, lerp(y0, y1, wa));
      ctx.setLineDash([26, 34]); ctx.lineDashOffset = -(t * sp + ph); ctx.strokeStyle = i % 2 ? '#FFFFFF' : E.B.sky; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
    }
    ctx.restore();
    if (wa >= 1) K.glow(380, y1, 110, '#FFFFFF', 0.18);
  },
  glass(t, c, E, A) {
    const K = TPL.sceneKit, b = c.beats, top = 724, bot = A.baseTop + 2, hx = A.x0 + 2, dw = 318;
    const pane = (P) => {
      ctx.beginPath(); ctx.moveTo(...P[0]); P.slice(1).forEach((p) => ctx.lineTo(...p)); ctx.closePath();
      ctx.fillStyle = K.a(K.P.glass, 0.22); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 4; ctx.stroke();
    };
    const gp = spring(t - b.glass, 200, 19);
    if (gp > 0.001) withAlpha(gp, () => at((1 - gp) * 200, 0, 1, 0, () => {
      const fx0 = hx + dw + 8;
      pane([[fx0, top], [A.x1 - 2, top], [A.x1 - 2, bot], [fx0, bot]]);
      ctx.save(); ctx.globalAlpha *= 0.35; K.poly([[fx0 + 30, top + 20], [fx0 + 60, top + 20], [fx0 + 20, top + 200], [fx0 + 8, top + 200]], '#FFFFFF'); ctx.restore();
    }));
    const dp = spring(t - b.door, 120, 11); if (dp <= 0.001) return;
    const th = Math.abs(1.25 * (1 - dp)), fxx = hx + dw * Math.cos(th), grow = dw * Math.sin(th) * 0.11;
    withAlpha(clamp(dp * 3), () => {
      pane([[hx, top], [fxx, top - grow], [fxx, bot + grow], [hx, bot]]);
      // hinges + handle
      K.box(hx - 4, top + 60, 12, 34, 4, K.P.chromeDark, { band: 0 }); K.box(hx - 4, bot - 94, 12, 34, 4, K.P.chromeDark, { band: 0 });
      const hxp = lerp(hx, fxx, 0.88);
      K.box(hxp - 5, 930 - grow * 0.2, 10, 150 + grow * 0.4, 5, K.P.chrome, { band: 0, hl: 0.3 });
      // highlight streaks + the payoff sheen
      ctx.save(); ctx.beginPath(); ctx.moveTo(hx, top); ctx.lineTo(fxx, top - grow); ctx.lineTo(fxx, bot + grow); ctx.lineTo(hx, bot); ctx.closePath(); ctx.clip();
      ctx.globalAlpha *= 0.3; K.poly([[hx + 40, top], [hx + 90, top], [hx + 20, top + 260], [hx - 30, top + 260]], '#FFFFFF');
      ctx.restore();
    });
    ctx.save(); ctx.beginPath(); ctx.rect(hx, top, A.x1 - hx, bot - top); ctx.clip();
    K.sheen(hx, top, A.x1 - hx, bot - top, seg(t, b.sheen, b.sheen + 1.0), 0.32);
    ctx.restore();
    // two small glints after the sheen
    [[b.glint, 600, 790], [b.glint + 0.7, 260, 1150]].forEach(([tg, x, y]) => {
      const u = seg(t, tg, tg + 0.6); if (u <= 0 || u >= 1) return;
      const s = Math.sin(u * Math.PI) * 22;
      ctx.save(); ctx.globalAlpha *= Math.sin(u * Math.PI) * 0.9; ctx.fillStyle = '#FFFFFF';
      ctx.beginPath(); ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s); ctx.quadraticCurveTo(x, y, x - s, y); ctx.quadraticCurveTo(x, y, x, y - s); ctx.fill(); ctx.restore();
    });
  },
  labels(t, c, E) {
    const K = TPL.sceneKit, st = c.steps || [];
    st.forEach((s, i) => {
      if (!s.label) return;
      const next = st[i + 1] ? st[i + 1].at : c.finalAt;
      const a = K.pop(t, s.at, 260, 20) * K.out(t, next - 0.2, 0.2);
      K.chip(540, 468, s.label, a, E, { num: i + 1 });
    });
    if (c.claim) K.caption(t, c.finalAt, c.claim, 400, E, { size: 66, lh: 1.15, maxW: 980 });
  },
};
