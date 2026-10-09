// scene-process — the estimate-first process as a journey (opaque B-roll, 13s). A small van drives a switchback road
// past 4-5 stations; the camera follows it down. Each station lights up with its label as the van stops there
// (In-home estimate → Itemized quote → Showroom selection → Install → Final walkthrough), the road behind it lights
// sky blue, and the camera pulls back over the whole journey for the closing line.
// cfg.stations = [{ label, icon }] (icon: house | doc | swatches | tools | key), 3-5 entries; cfg.beats.first / cfg.beats.gap
// time the stops to the VO.
TPL.sceneProcess = {
  dur: 13,
  defaults: {
    stations: [
      { label: 'In-home estimate', icon: 'house' }, { label: 'Itemized quote', icon: 'doc' }, { label: 'Showroom selection', icon: 'swatches' },
      { label: 'Install', icon: 'tools' }, { label: 'Final walkthrough', icon: 'key' },
    ],
    intro: 'HOW IT WORKS',
    final: 'ESTIMATE FIRST.|*THEN WE BUILD.*',
    beats: { first: 1.0, gap: 1.95, overview: 10.0, final: 10.35 },
  },
  geo(n) {
    // switchback road: level i runs L→R (even) / R→L (odd) at y = Y0 + i*GAP, joined by half-circle U-turns
    const Y0 = 640, GAP = 400, XL = 310, XR = 770, R = GAP / 2, P = [];
    P.push([-120, Y0]);
    for (let i = 0; i < n; i++) {
      const y = Y0 + i * GAP, ltr = i % 2 === 0;
      const xa = ltr ? XL : XR, xb = ltr ? XR : XL;
      if (i > 0) P.push([xa, y]);
      if (i === n - 1) { P.push([ltr ? 1240 : -160, y]); break; }
      P.push([xb, y]);
      const cx = xb, cy = y + R;
      for (let k = 1; k <= 24; k++) { const a = -Math.PI / 2 + (ltr ? 1 : -1) * Math.PI * k / 24; P.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); }
    }
    const L = [0]; for (let i = 1; i < P.length; i++) L.push(L[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    // station i sits at x=540 on level i
    const st = [];
    for (let i = 0; i < n; i++) {
      const y = Y0 + i * GAP; let best = 0;
      for (let j = 1; j < P.length; j++) { const a = P[j - 1], b = P[j]; if (Math.abs(a[1] - y) < 0.5 && Math.abs(b[1] - y) < 0.5 && (a[0] - 540) * (b[0] - 540) <= 0) { best = L[j - 1] + Math.abs(540 - a[0]); break; } }
      st.push({ x: 540, y, d: best });
    }
    return { P, L, st, Y0, GAP, total: L[L.length - 1] };
  },
  at(G, d) {   // position + angle at distance d
    const { P, L } = G; d = clamp(d, 0, G.total);
    let j = 1; while (j < L.length - 1 && L[j] < d) j++;
    const a = P[j - 1], b = P[j], u = (d - L[j - 1]) / Math.max(1e-6, L[j] - L[j - 1]);
    return { x: lerp(a[0], b[0], u), y: lerp(a[1], b[1], u), ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
  },
  draw(t, c, E) {
    const K = TPL.sceneKit, S = TPL.sceneProcess, b = c.beats, B = E.B, n = c.stations.length;
    const G = S.geo(n);
    const arrive = (i) => b.first + i * b.gap;
    // van distance: rolls in to the first stop, then eases stop to stop with a short dwell
    let d;
    if (t < arrive(0)) d = lerp(0, G.st[0].d, easeOut(seg(t, 0, arrive(0))));
    else { d = G.st[n - 1].d; for (let i = 0; i < n - 1; i++) { if (t < arrive(i + 1)) { d = lerp(G.st[i].d, G.st[i + 1].d, easeIO(seg(t, arrive(i) + 0.55, arrive(i + 1)))); break; } } }
    const V = S.at(G, d);
    // camera: follow the van's height, then pull back over the whole map
    const ov = easeIO(seg(t, b.overview, b.overview + 1.4));
    const top = G.Y0 - 300, bot = G.Y0 + (n - 1) * G.GAP + 70, zf = Math.min(1, 930 / (bot - top));
    const camY = lerp(V.y, (top + bot) / 2, ov), z = lerp(1, zf, ov), scrY = lerp(980, 990, ov);
    K.bg(t, E, { glowY: 960 });
    ctx.save();
    ctx.translate(540 + Math.sin(t * 0.35) * 6, scrY + Math.cos(t * 0.27) * 5); ctx.scale(z * (1 + 0.02 * (1 - ov) * Math.sin(t * 0.2)), z); ctx.translate(-540, -camY);
    S.map(t, c, E, G, d, n, arrive, ov);
    // van
    at(V.x, V.y, 1, V.ang, () => S.van(t, E, d));
    ctx.restore();
    // keep the caption band and the subtitle band calm: the map fades out toward the top and bottom
    const top0 = K.mix(B.dark, B.card, 0.38), fe = lerp(640, 470, ov), gT = ctx.createLinearGradient(0, 0, 0, fe);
    gT.addColorStop(0, K.a(top0, 1)); gT.addColorStop(0.55, K.a(top0, 0.92)); gT.addColorStop(1, K.a(top0, 0)); ctx.fillStyle = gT; ctx.fillRect(0, 0, E.W, fe);
    const gB = ctx.createLinearGradient(0, 1400, 0, 1760); gB.addColorStop(0, K.a(B.dark, 0)); gB.addColorStop(1, K.a(B.dark, 0.9)); ctx.fillStyle = gB; ctx.fillRect(0, 1400, E.W, 520);
    K.caption(t, 0.15, c.intro, 400, E, { size: 64, t1: b.first + 0.9 });
    K.caption(t, b.final, c.final, 380, E, { size: 70, lh: 1.12 });
  },
  map(t, c, E, G, d, n, arrive, ov) {
    const K = TPL.sceneKit, S = TPL.sceneProcess, B = E.B;
    // land parcels between the road levels + trees (seeded)
    const R = RNG('proc-map');
    for (let i = 0; i < n; i++) {
      const y = G.Y0 + i * G.GAP;
      rrect(40, y - G.GAP / 2 + 64, 1000, G.GAP - 128, 56); ctx.fillStyle = K.a(B.sky, 0.05); ctx.fill();
    }
    for (let k = 0; k < 14; k++) {
      const i = k % n, side = k % 2, y = G.Y0 + i * G.GAP + (R.f() < 0.5 ? -1 : 1) * R.r(120, 150), x = side ? R.r(850, 1000) : R.r(80, 230);
      const sw = Math.sin(t * 0.9 + k) * 1.5, sz = R.r(0.8, 1.15);
      [[0, 0, 34], [30, 12, 26], [-24, 16, 22]].forEach(([dx, dy, r]) => circle(x + dx * sz + 5, y + dy * sz + 10, r * sz, 'rgba(0,8,24,0.35)'));
      [[0, 0, 34], [30, 12, 26], [-24, 16, 22]].forEach(([dx, dy, r], j) => { circle(x + dx * sz + sw, y + dy * sz, r * sz, K.mix('#2C6A74', B.card, 0.2 + j * 0.08)); circle(x + dx * sz - r * sz * 0.28 + sw, y + dy * sz - r * sz * 0.28, r * sz * 0.5, K.mix('#3E8C8E', B.sky, 0.12)); });
    }
    // road
    line(G.P, K.mix(B.dark, B.card, 0.2), 96, { cap: 'round' });
    line(G.P, K.mix(B.dark, B.card, 0.55), 84, { cap: 'round' });
    ctx.save(); ctx.setLineDash([22, 26]); line(G.P, K.a(B.ink, 0.35), 5, { cap: 'butt' }); ctx.restore();
    // travelled road glows sky
    const done = [], Ld = G.L; for (let j = 0; j < G.P.length && Ld[j] <= d; j++) done.push(G.P[j]);
    const V = S.at(G, d); done.push([V.x, V.y]);
    if (done.length > 1) { line(done, K.a(B.sky, 0.18), 70); line(done, B.sky, 8); }
    if (ov > 0) withAlpha(ov, () => { line(G.P.slice(0, Math.max(2, done.length)), B.sky, 8 + 8 * ov); });
    // stations
    c.stations.forEach((s, i) => {
      const st = G.st[i], lit = easeOut(seg(t, arrive(i) - 0.15, arrive(i) + 0.2)), pop = spring(t - arrive(i) + 0.15, 260, 14);
      const bx = st.x, by = st.y - 118;
      // stop marker on the road
      circle(st.x, st.y, 30, K.mix(K.mix(B.dark, B.card, 0.55), B.sky, lit * 0.35));
      // badge
      at(bx, by, 1 + 0.12 * Math.sin(clamp(pop) * Math.PI) * (pop > 0 ? 1 : 0), 0, () => {
        if (lit > 0) K.glow(0, 0, 170, B.sky, 0.4 * lit);
        circle(0, 6, 76, 'rgba(0,8,24,0.4)');
        circle(0, 0, 76, K.mix(K.shade(B.card, 0.25), B.sky, lit));
        circle(0, 0, 67, K.mix(K.shade(B.card, 0.08), B.ink, lit));
        withAlpha(0.45 + 0.55 * lit, () => S.icon(s.icon, 84, E, lit));
        // step number
        at(56, -56, 1, 0, () => { circle(0, 0, 26, lit > 0.5 ? B.card : K.shade(B.card, 0.25)); text(String(i + 1), 0, 10, 28, lit > 0.5 ? B.sky : K.a(B.ink, 0.6), { align: 'center', weight: 900, shadow: false }); });
      });
      // label under the road
      const la = spring(t - arrive(i) - 0.05, 260, 19) * (1 - seg(ov, 0, 0.3));
      K.chip(st.x, st.y - 250, s.label, la, E, { size: 52 });
      if (ov > 0.55) withAlpha(seg(ov, 0.55, 1), () => text(s.label, st.x, st.y - 214, 112, B.ink, { align: 'center', weight: 800, shadow: false }));
    });
  },
  icon(kind, s, E, lit) {
    const K = TPL.sceneKit, I = K.icon, B = E.B, ink = K.mix(B.ink, B.card, lit);
    if (kind === 'house') I.house(s, ink, B.sky, K.mix(B.card, B.ink, 1 - lit));
    else if (kind === 'doc') { I.doc(s * 0.95, K.mix(B.card, '#FFFFFF', lit), K.mix(B.ink, B.sky, lit)); at(s * 0.26, s * 0.3, 1, 0, () => { circle(0, 0, s * 0.18, B.good); check(0, 1, s * 0.18, '#FFFFFF', 1, 4); }); }
    else if (kind === 'swatches') I.swatches(s * 0.95, ['#D9B27C', B.sky, K.mix(B.card, '#9FB3C8', 0.5)]);
    else if (kind === 'tools') I.tools(s * 0.9, K.mix(B.ink, '#7D8A99', lit), '#D9824B');
    else if (kind === 'key') at(-s * 0.05, s * 0.05, 1, 0, () => I.key(s * 0.9, K.mix(B.ink, B.card, lit)));
  },
  van(t, E, d) {
    const K = TPL.sceneKit, B = E.B, bob = Math.sin(d * 0.08) * 1.2;
    ctx.save(); ctx.globalAlpha *= 0.4; rrect(-62, -30 + 8, 128, 64, 18); ctx.fillStyle = '#020812'; ctx.fill(); ctx.restore();
    at(0, bob * 0.3, 1, 0, () => {
      K.box(-64, -32, 128, 64, 16, '#F4F6F8', { band: 0.18, shade: -0.12, hl: 0.4 });
      rrect(26, -26, 24, 52, 8); ctx.fillStyle = K.mix(B.card, B.sky, 0.45); ctx.fill();
      rrect(-50, -26, 70, 52, 8); ctx.fillStyle = '#E3E8EE'; ctx.fill();
      ctx.fillStyle = B.sky; ctx.fillRect(-50, -6, 70, 12);
      rrect(18, -40, 10, 10, 3); ctx.fillStyle = '#C3CBD4'; ctx.fill(); rrect(18, 30, 10, 10, 3); ctx.fill();
      circle(60, -20, 4, '#FFF4D6'); circle(60, 20, 4, '#FFF4D6');
    });
  },
};
