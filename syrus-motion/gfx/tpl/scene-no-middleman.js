// scene-no-middleman — full-screen price chain (opaque B-roll, 13s). Manufacturer → Distributor → Showroom → Salesperson
// → You: a parcel travels down the chain, and at every hop a red markup tag flies off that middleman and stacks under the
// price tag, which inflates ($8,000 → $12,000 → $16,500 → $21,000). Then the middlemen drop out, the chain collapses to
// Manufacturer → Us → You, and the price rolls down to the gold offer on a navy tag.
// Prices are ILLUSTRATIVE defaults: the client confirms every number (chain prices + final price) before it ships.
TPL.sceneNoMiddleman = {
  dur: 13,
  defaults: {
    chain: [
      { label: 'Manufacturer', icon: 'factory' }, { label: 'Distributor', icon: 'truck' }, { label: 'Showroom', icon: 'store' },
      { label: 'Salesperson', icon: 'sales' }, { label: 'You', icon: 'house' },
    ],
    prices: [8000, 12000, 16500, 21000],   // price at each hop before "You" (client-confirmed)
    direct: { label: 'Us', icon: 'crew' },
    price: 14995,                           // the offer (gold) — client-confirmed
    priceLabel: 'YOU PAY',
    symbols: false, symbolFinal: 'DIRECT',   // symbols: true shows $/$$/$$$ instead of figures
    caption1: 'EVERY MIDDLEMAN|ADDS A MARKUP',
    caption2: 'WE CUT OUT|THE MIDDLEMEN',
    final: 'DIRECT TO YOU.|NO MIDDLEMAN MARKUP.',
    beats: { nodes: 0.1, start: 1.2, hop: 1.25, collapse: 7.0, us: 7.55, direct: 8.25, drop: 9.25, final: 10.4 },
  },
  draw(t, c, E) {
    const K = TPL.sceneKit, S = TPL.sceneNoMiddleman, b = c.beats, B = E.B;
    K.bg(t, E);
    const n = c.chain.length, Y1 = [600, 780, 960, 1140, 1320], X = 176;
    const ny = (i) => Y1[i] ?? 600 + i * 180;
    const col = easeIO(seg(t, b.collapse + 0.25, b.collapse + 0.9));   // collapse progress
    const last = n - 1, yTop = lerp(ny(0), 680, col), yBot = lerp(ny(last), 1240, col), yUs = 960;
    // parcel position (phase 1: hop k at b.start + k*b.hop; phase 2: direct run)
    const hopT = (k) => b.start + k * b.hop;   // arrival time at node k
    let k1 = 0; for (let k = 1; k < n; k++) if (t >= hopT(k)) k1 = k;
    const markups = Math.min(k1, c.prices.length - 1);
    K.cam(t, c.dur, () => {
      // chain line
      const draw1 = easeOut(seg(t, b.nodes, b.nodes + 1.0)) * (1 - col);
      if (draw1 > 0) { ctx.save(); ctx.setLineDash([2, 16]); ctx.lineCap = 'round'; line(partial([[X, ny(0)], [X, ny(last)]], draw1), K.a(B.sky, 0.55), 7); ctx.restore(); }
      const draw2 = easeOut(seg(t, b.us, b.us + 0.6));
      if (draw2 > 0) { line(partial([[X, yTop], [X, yBot]], draw2), K.a(B.sky, 0.25), 18); line(partial([[X, yTop], [X, yBot]], draw2), B.sky, 7); }
      // nodes
      c.chain.forEach((nd, i) => {
        const mid = i > 0 && i < last;
        const ap = spring(t - b.nodes - i * 0.18, 240, 18); if (ap <= 0.001) return;
        let y = ny(i), sc = ap, al = 1, rot = 0;
        if (i === 0) y = yTop; if (i === last) y = yBot;
        if (mid) { const u = seg(t, b.collapse + (i - 1) * 0.1, b.collapse + 0.32 + (i - 1) * 0.1); if (u >= 1) return; sc *= 1 + 0.15 * Math.sin(u * Math.PI) - easeIn(u); al = 1 - easeIn(u); rot = (i % 2 ? 0.25 : -0.25) * u; }
        const hit = mid ? Math.max(0, 1 - Math.abs(t - hopT(i) - 0.15) / 0.45) : 0;   // red flash as the markup comes off
        withAlpha(al, () => S.node(X, y, nd, sc, rot, hit, i <= k1 || col > 0, E));
      });
      // "Us" joins the chain
      const up = spring(t - b.us, 230, 15);
      if (up > 0.001) S.node(X, yUs, c.direct, up, 0, 0, true, E, true);
      // parcel
      let py = null, uu = 0;
      if (t >= b.start - 0.3 && t < b.collapse) {
        const k = Math.min(last, k1), nxt = Math.min(last, k + 1); uu = k === last ? 0 : easeIO(seg(t, hopT(k) + 0.55, hopT(nxt)));
        py = k === last ? ny(last) : lerp(ny(k), ny(nxt), uu);
      } else if (t >= b.direct && t < b.drop + 0.6) { uu = easeIO(seg(t, b.direct, b.drop)); py = lerp(yTop, yBot, uu); uu = (uu * 2) % 1; }
      if (py != null) {
        const pa = clamp(seg(t, b.start - 0.3, b.start)) * (1 - seg(t, b.collapse - 0.2, b.collapse)) + (t >= b.direct ? 1 - seg(t, b.drop + 0.3, b.drop + 0.6) : 0);
        const badge = 1 - clamp(Math.min(uu, 1 - uu) * 7);   // parks as a little badge on the node's corner
        withAlpha(pa, () => { K.glow(X + 48 * badge, py + 48 * badge, 60, B.sky, 0.6); at(X + 48 * badge, py + 48 * badge, 1 - 0.3 * badge, 0, () => S.parcel(E)); });
      }
      // the price tag + the markup stack
      S.tag(t, c, E, k1, markups, col);
    }, { z1: 1.05, fx: 540, fy: 960 });
    // captions
    K.caption(t, 0.25, c.caption1, 382, E, { size: 60, t1: b.collapse - 0.25 });
    K.caption(t, b.collapse + 0.1, c.caption2, 382, E, { size: 60, t1: b.final - 0.3 });
    K.caption(t, b.final, c.final, 382, E, { size: 60 });
  },
  node(x, y, nd, sc, rot, hit, active, E, isUs) {
    const K = TPL.sceneKit, B = E.B, r = 64;
    at(x, y, sc, rot, () => {
      if (isUs) K.glow(0, 0, 130, B.sky, 0.35);
      circle(0, 6, r + 4, 'rgba(0,8,24,0.35)');
      circle(0, 0, r + 6, hit > 0 ? K.mix(B.sky, B.bad, hit) : active ? B.sky : K.shade(B.card, 0.2));
      circle(0, 0, r, isUs ? K.shade(B.card, 0.1) : B.card);
      TPL.sceneNoMiddleman.icon(nd.icon, 74, E);
      text(nd.label, r + 34, 18, 54, hit > 0 ? K.mix(B.ink, '#FF9AA3', hit) : B.ink, { weight: 800, shadow: false });
    });
  },
  icon(kind, s, E) {
    const K = TPL.sceneKit, I = K.icon, B = E.B, w = B.ink, sk = B.sky;
    if (kind === 'factory') {
      K.poly([[-s * 0.45, s * 0.38], [-s * 0.45, -s * 0.05], [-s * 0.2, -s * 0.22], [-s * 0.2, -s * 0.05], [s * 0.05, -s * 0.22], [s * 0.05, -s * 0.05], [s * 0.3, -s * 0.22], [s * 0.3, s * 0.38]], w);
      rrect(s * 0.3, -s * 0.48, s * 0.14, s * 0.86, 3); ctx.fillStyle = w; ctx.fill();
      for (let i = 0; i < 3; i++) { rrect(-s * 0.36 + i * s * 0.22, s * 0.08, s * 0.12, s * 0.12, 2); ctx.fillStyle = sk; ctx.fill(); }
    } else if (kind === 'truck') {
      K.box(-s * 0.48, -s * 0.28, s * 0.6, s * 0.48, 5, w, { band: 0, hl: 0 });
      K.poly([[s * 0.15, -s * 0.12], [s * 0.34, -s * 0.12], [s * 0.48, s * 0.04], [s * 0.48, s * 0.2], [s * 0.15, s * 0.2]], w);
      rrect(s * 0.2, -s * 0.07, s * 0.14, s * 0.1, 2); ctx.fillStyle = sk; ctx.fill();
      [-0.28, 0.3].forEach((u) => { circle(s * u, s * 0.24, s * 0.11, B.card); circle(s * u, s * 0.24, s * 0.07, w); });
    } else if (kind === 'store') {
      K.box(-s * 0.4, -s * 0.08, s * 0.8, s * 0.46, 4, w, { band: 0, hl: 0 });
      for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? w : sk; ctx.beginPath(); ctx.moveTo(-s * 0.46 + i * s * 0.184, -s * 0.36); ctx.lineTo(-s * 0.46 + (i + 1) * s * 0.184, -s * 0.36); ctx.lineTo(-s * 0.46 + (i + 1) * s * 0.184, -s * 0.12); ctx.arc(-s * 0.46 + (i + 0.5) * s * 0.184, -s * 0.12, s * 0.092, 0, Math.PI); ctx.closePath(); ctx.fill(); }
      rrect(-s * 0.3, s * 0.06, s * 0.3, s * 0.2, 3); ctx.fillStyle = sk; ctx.fill(); rrect(s * 0.08, s * 0.04, s * 0.2, s * 0.34, 3); ctx.fillStyle = B.card; ctx.fill();
    } else if (kind === 'sales') {
      I.person(s * 0.95, w, w);
      K.poly([[-s * 0.06, s * 0.04], [s * 0.06, s * 0.04], [s * 0.08, s * 0.3], [0, s * 0.42], [-s * 0.08, s * 0.3]], B.bad);
    } else if (kind === 'house') {
      I.house(s * 0.95, w, sk, B.card);
    } else if (kind === 'crew') {
      at(0, s * 0.1, 1, 0, () => I.hardhat(s * 1.15, B.sky, w));
    } else if (kind === 'office') {   // a glass tower
      K.box(-s * 0.26, -s * 0.46, s * 0.52, s * 0.86, 4, w, { band: 0, hl: 0 });
      for (let r = 0; r < 5; r++) for (let q = 0; q < 3; q++) { rrect(-s * 0.2 + q * s * 0.145, -s * 0.38 + r * s * 0.15, s * 0.1, s * 0.09, 2); ctx.fillStyle = sk; ctx.fill(); }
    } else if (kind === 'tv') {
      K.box(-s * 0.44, -s * 0.3, s * 0.88, s * 0.56, 6, w, { band: 0, hl: 0 }); rrect(-s * 0.38, -s * 0.24, s * 0.76, s * 0.44, 4); ctx.fillStyle = sk; ctx.fill();
      K.poly([[-s * 0.06, -s * 0.12], [s * 0.1, -s * 0.02], [-s * 0.06, s * 0.08]], w);   // play button
      rrect(-s * 0.16, s * 0.3, s * 0.32, s * 0.06, 3); ctx.fillStyle = w; ctx.fill();
    } else if (kind === 'billboard') {
      K.box(-s * 0.46, -s * 0.42, s * 0.92, s * 0.46, 4, w, { band: 0, hl: 0 }); rrect(-s * 0.4, -s * 0.36, s * 0.8, s * 0.34, 3); ctx.fillStyle = B.bad; ctx.fill();
      text('$$$', 0, -s * 0.1, s * 0.26, w, { weight: 900, align: 'center', shadow: false });
      ctx.fillStyle = w; ctx.fillRect(-s * 0.24, s * 0.04, s * 0.06, s * 0.38); ctx.fillRect(s * 0.18, s * 0.04, s * 0.06, s * 0.38);
    }
  },
  parcel(E) {
    const K = TPL.sceneKit;
    K.box(-22, -20, 44, 40, 6, '#D9B27C', { band: 0.2 }); ctx.fillStyle = '#B88E5A'; ctx.fillRect(-4, -20, 8, 40);
  },
  // the tag: white paper tag that inflates and goes red, then flips to navy with the gold offer
  tag(t, c, E, k1, markups, col) {
    const K = TPL.sceneKit, B = E.B, b = c.beats, S = TPL.sceneNoMiddleman;
    const ap = spring(t - b.start, 220, 16); if (ap <= 0.001) return;
    const last = c.chain.length - 1, mv = easeIO(seg(t, b.drop - 0.2, b.drop + 0.7)), cx = lerp(822, 772, mv), cy = lerp(880, 968, mv);
    // price over time: count up at each hop, then roll down to the offer
    let val = c.prices[0];
    for (let k = 1; k < c.prices.length; k++) val = lerp(val, c.prices[k], easeOut(seg(t, b.start + k * b.hop + 0.15, b.start + k * b.hop + 0.6)));
    const dropU = easeIO(seg(t, b.drop, b.drop + 0.9));
    val = lerp(val, c.price, dropU);
    const pay = seg(t, b.start + last * b.hop, b.start + last * b.hop + 0.3) * (1 - dropU);   // red "you pay" state
    let infl = 0; for (let k = 1; k <= Math.min(markups, c.prices.length - 1); k++) infl += spring(t - b.start - k * b.hop - 0.15, 260, 11) * 0.11;
    infl *= 1 - easeIO(seg(t, b.drop, b.drop + 0.6));
    const sc = lerp((0.7 + 0.3 * ap) * (1 + infl), 1.36, mv) * (1 + 0.07 * Math.sin(Math.PI * seg(t, b.drop + 0.85, b.drop + 1.1)));
    const navy = easeIO(seg(t, b.drop - 0.1, b.drop + 0.4));
    const wob = Math.sin((t - b.start) * 9) * 0.03 * Math.exp(-((t - b.start) % b.hop) * 3) * (t < b.collapse ? 1 : 0);
    at(cx, cy, sc, -0.05 + wob, () => {
      const w = 300, h = 168, x0 = -w / 2, y0 = -h / 2;
      // string
      line([[x0 + 30, 0], [x0 + 8, -34], [x0 + 22, -62]], K.mix('#D9D3C6', B.sky, navy), 4);
      ctx.save(); ctx.shadowColor = 'rgba(0,8,24,0.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
      ctx.beginPath(); ctx.moveTo(x0 + 54, y0); ctx.lineTo(x0 + w - 20, y0); ctx.arcTo(x0 + w, y0, x0 + w, y0 + 20, 20); ctx.lineTo(x0 + w, y0 + h - 20); ctx.arcTo(x0 + w, y0 + h, x0 + w - 20, y0 + h, 20);
      ctx.lineTo(x0 + 54, y0 + h); ctx.lineTo(x0 + 4, 12); ctx.quadraticCurveTo(x0 - 4, 0, x0 + 4, -12); ctx.closePath();
      ctx.fillStyle = K.mix(K.mix(B.ink, '#FFE9EA', pay), B.card, navy); ctx.fill(); ctx.restore();
      if (navy > 0) { ctx.save(); ctx.globalAlpha *= navy; ctx.strokeStyle = B.sky; ctx.lineWidth = 4; ctx.stroke(); ctx.clip(); K.sheen(x0, y0, w, h, seg(t, b.drop + 2.1, b.drop + 2.9), 0.22); K.sheen(x0, y0, w, h, seg(t, b.drop + 3.3, b.drop + 4.1), 0.16); ctx.restore(); }
      circle(x0 + 30, 0, 11, K.mix('#C9C3B5', B.dark, navy));
      text(c.priceLabel, x0 + 66, y0 + 50, 30, K.mix(K.mix(B.card, B.bad, pay), B.sky, navy), { weight: 800, spacing: 4, shadow: false });
      const pc = navy > 0.5 ? B.accent : K.mix(B.card, B.bad, pay);
      // cfg.symbols: no figures on screen (nothing client-confirmed to show): the tag grows $ -> $$ -> $$$ with each markup,
      // then lands on cfg.symbolFinal (e.g. 'DIRECT') instead of an offer price
      const str = c.symbols ? (dropU > 0.5 ? c.symbolFinal : '$'.repeat(1 + Math.min(markups, c.prices.length - 1) + (pay > 0.5 ? 1 : 0)))
        : money(Math.round(val)), fs = fitSize(str, 84, w - 80, { weight: 900 });
      text(str, x0 + 64, y0 + 132, fs, pc, { weight: 900, shadow: false });
      const ul = easeOut(seg(t, b.drop + 0.8, b.drop + 1.2));
      if (ul > 0) { rrect(x0 + 64, y0 + 146, (w - 96) * ul, 9, 4.5); ctx.fillStyle = B.accent; ctx.fill(); }
    });
    // markup tags fly from the middleman to the stack under the price tag, then fall off at the collapse
    for (let k = 1; k < c.prices.length; k++) {
      const t0 = b.start + k * b.hop - 0.05, fly = easeIO(seg(t, t0, t0 + 0.45)); if (t < t0) continue;
      const amt = '+' + money(c.prices[k] - c.prices[k - 1]);
      const sx = 176 + 100 + measure(c.chain[k].label, 54, { weight: 800 }) + 120, sy = [600, 780, 960, 1140, 1320][k];
      const tx = cx + (k % 2 ? -18 : 18), ty = cy + 150 + infl * 160 + (k - 1) * 84;
      const off = seg(t, b.collapse + 0.05 * k, b.collapse + 0.6 + 0.05 * k);
      if (off >= 1) continue;
      const x = lerp(Math.min(sx, 760), tx, fly), y = lerp(sy, ty, fly) - Math.sin(fly * Math.PI) * 120 + 700 * off * off;
      at(x, y, 1 - 0.1 * fly, (k % 2 ? -0.06 : 0.05) * fly + off * (k % 2 ? 0.8 : -0.8), () => withAlpha(seg(t, t0, t0 + 0.12) * (1 - easeIn(off)), () => K.chip(0, 0, amt, 1, E, { size: 50, fill: B.bad, color: '#FFFFFF' })));
    }
    // offer check badge
    const ck = spring(t - b.drop - 1.0, 260, 15);
    if (ck > 0.001) at(cx + 150 * sc, cy - 84 * sc, ck, 0, () => { circle(0, 0, 34, B.good); check(0, 2, 34, '#FFFFFF', clamp(ck * 1.5), 7); });
  },
};
