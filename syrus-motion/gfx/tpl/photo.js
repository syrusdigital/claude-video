// photo.js — full-frame treatments of a client's OWN photos (spec.images, embedded). Opaque: they paint the frame.
// Rule: a client's photos only ever go in that client's ads. "Before/after" pairs must be the same real job.

// photoBeforeAfter — the before photo holds, a divider sweeps across revealing the after, pills label each side,
// then the divider settles and the after takes the frame. cfg.before / cfg.after = image names.
TPL.photoBeforeAfter = {
  dur: 6.0,
  defaults: { before: 'before', after: 'after', badge: '', split: 0.5, fyB: 0.5, fyA: 0.5 },
  draw(t, c, E) {
    const zb = 1.04 + 0.04 * seg(t, 0, c.dur), za = 1.1 - 0.06 * seg(t, 0, c.dur);
    drawCover(IMGS[c.before], 0, 0, E.W, E.H, { zoom: zb, fy: c.fyB });
    // the divider: in from the right edge, past the middle, back to split, then on to the left edge (after wins)
    const u1 = easeIO(seg(t, 0.9, 2.3)), u2 = easeIO(seg(t, 3.8, 4.8));
    const x = lerp(E.W, E.W * c.split, u1) * (1 - u2);
    if (x < E.W) {
      ctx.save(); ctx.beginPath(); ctx.rect(x, 0, E.W - x, E.H); ctx.clip();
      drawCover(IMGS[c.after], 0, 0, E.W, E.H, { zoom: za, fy: c.fyA });
      ctx.restore();
      if (x > 2) {
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 24; ctx.fillStyle = '#fff'; ctx.fillRect(x - 4, 0, 8, E.H); ctx.restore();
        circle(x, E.H * 0.5, 46, '#fff'); line([[x - 16, E.H * 0.5 - 14], [x - 30, E.H * 0.5], [x - 16, E.H * 0.5 + 14]], E.B.card, 7); line([[x + 16, E.H * 0.5 - 14], [x + 30, E.H * 0.5], [x + 16, E.H * 0.5 + 14]], E.B.card, 7);
      }
    }
    const pill = (s, px, a, bg, fg) => { if (a <= 0.01) return; const w = measure(s, 40, { weight: 900, spacing: 4 }) + 60; at(px, 330, 0.7 + 0.3 * a, 0, () => withAlpha(a, () => { card(-w / 2, -40, w, 80, 40, bg); text(s, 0, 14, 40, fg, { align: 'center', weight: 900, spacing: 4, shadow: false }); })); };
    const showPills = (1 - u2);
    pill('BEFORE', 270, spring(t - 0.3, 260, 20) * showPills, '#ffffff', E.B.card);
    pill('AFTER', 810, spring(t - 2.0, 260, 20) * showPills, E.B.accent, '#111');
    if (c.badge) { const a = spring(t - 4.9, 220, 20); if (a > 0.01) { const w = measure(c.badge, 52, { weight: 900 }) + 80; at(E.W / 2, 1420, 0.8 + 0.2 * a, 0, () => withAlpha(a, () => { card(-w / 2, -60, w, 110, 30, E.B.card); text(c.badge, 0, 18, 52, E.B.accent, { align: 'center', weight: 900, shadow: false }); })); } }
  },
};

// photoCallouts — a slow push on a finished photo; 1-3 feature labels draw in on leader lines.
// cfg.items = [{ at: [x, y] in frame px, label, sub, side: 'left'|'right', y: label y }]
TPL.photoCallouts = {
  dur: 7.0,
  defaults: { img: 'after', fx: 0.5, fy: 0.5, items: [{ at: [560, 980], label: 'QUARTZ COUNTERTOPS', side: 'right', y: 760 }, { at: [380, 640], label: 'SOFT-CLOSE CABINETS', side: 'left', y: 520 }] },
  draw(t, c, E) {
    drawCover(IMGS[c.img], 0, 0, E.W, E.H, { zoom: 1.02 + 0.08 * easeIO(t / c.dur), fx: c.fx, fy: c.fy });
    ctx.fillStyle = 'rgba(5,12,25,0.18)'; ctx.fillRect(0, 0, E.W, E.H);
    c.items.forEach((it, i) => {
      const t0 = 0.6 + i * 1.6, a = seg(t, t0, t0 + 0.3), d = easeOut(seg(t, t0 + 0.2, t0 + 0.75)), l = spring(t - t0 - 0.6, 240, 20);
      if (a <= 0) return;
      const [px, py] = it.at, right = (it.side ?? 'right') === 'right', lx = right ? 1000 : 80, ly = it.y ?? py - 200;
      const pulse = 1 + 0.25 * Math.sin((t - t0) * 6) * Math.exp(-(t - t0) * 0.8);
      circle(px, py, 30 * pulse * a, hexA(E.B.accent, 0.25)); circle(px, py, 13 * a, E.B.accent, '#fff', 4);
      const elbow = [right ? lx - 300 : lx + 300, ly];
      line(partial([[px, py], elbow, [right ? lx - 20 : lx + 20, ly]], d), '#fff', 5, { shadow: true });
      if (l > 0.01) {
        const w = measure(it.label, 44, { weight: 900 }) + 56, x0 = right ? lx - w : lx;
        at(0, (1 - l) * 20, 1, 0, () => withAlpha(l, () => { card(x0, ly - 92, w, it.sub ? 132 : 92, 22, E.B.card); text(it.label, x0 + 28, ly - 30, 44, E.B.ink, { weight: 900, shadow: false }); if (it.sub) text(it.sub, x0 + 28, ly + 20, 32, E.B.sky, { weight: 600, shadow: false }); }));
      }
    });
  },
};

// photoBlueprint — "see it before it's built": the finished room appears as white line art on a navy blueprint grid,
// then the real photo sweeps in over it. cfg.lines = an edge-detected version of the photo (made with ffmpeg).
TPL.photoBlueprint = {
  dur: 6.0,
  defaults: { img: 'after', lines: 'lines', label: 'PLANNED. THEN BUILT.' },
  draw(t, c, E) {
    ctx.fillStyle = '#062452'; ctx.fillRect(0, 0, E.W, E.H);
    ctx.strokeStyle = 'rgba(102,194,255,0.16)'; ctx.lineWidth = 2;
    for (let x = 0; x <= E.W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, E.H); ctx.stroke(); }
    for (let y = 0; y <= E.H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(E.W, y); ctx.stroke(); }
    const z = 1.06 - 0.04 * seg(t, 0, c.dur), draw = easeOut(seg(t, 0.2, 2.2));
    // the line art draws on top-down
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, E.W, E.H * draw); ctx.clip(); ctx.globalCompositeOperation = 'screen'; drawCover(IMGS[c.lines], 0, 0, E.W, E.H, { zoom: z }); ctx.restore();
    // the real photo sweeps in on a soft diagonal
    const s = easeIO(seg(t, 2.8, 4.2));
    if (s > 0) {
      ctx.save(); ctx.beginPath(); const k = s * (E.W + E.H + 400) - 200; ctx.moveTo(-200, -200); ctx.lineTo(k, -200); ctx.lineTo(k - E.H, E.H + 200); ctx.lineTo(-200, E.H + 200); ctx.closePath(); ctx.clip();
      drawCover(IMGS[c.img], 0, 0, E.W, E.H, { zoom: z }); ctx.restore();
    }
    const a = spring(t - 4.3, 220, 20);
    if (a > 0.01) { const w = measure(c.label, 56, { weight: 900 }) + 80; at(E.W / 2, 1400, 0.8 + 0.2 * a, 0, () => withAlpha(a, () => { card(-w / 2, -66, w, 116, 30, E.B.card); text(c.label, 0, 20, 56, E.B.ink, { align: 'center', weight: 900, shadow: false }); })); }
    const b = 1 - seg(t, 2.6, 3.2);
    if (b > 0) text('THE PLAN', E.W / 2, 330, 48, E.B.sky, { align: 'center', weight: 900, spacing: 10, alpha: b * seg(t, 0.3, 0.8) });
  },
};

// photoGallery — real project photos fly in as cards, stack with small rotations, then the last one opens to full frame.
TPL.photoGallery = {
  dur: 6.5,
  defaults: { imgs: ['p1', 'p2', 'p3', 'p4', 'p5'], title: 'RECENT PROJECTS', bg: '#0B1424' },
  draw(t, c, E) {
    ctx.fillStyle = c.bg; ctx.fillRect(0, 0, E.W, E.H);
    const n = c.imgs.length, R = RNG('gal', n), open = easeIO(seg(t, 0.75 + n * 0.55, 1.35 + n * 0.55));
    const ta = spring(t - 0.15, 220, 20);
    text(c.title, E.W / 2, 330, 56, E.B.ink, { align: 'center', weight: 900, spacing: 8, alpha: clamp(ta) * (1 - open) });
    c.imgs.forEach((k, i) => {
      const t0 = 0.4 + i * 0.55, s = spring(t - t0, 160, 18); if (s <= 0.001) return;
      const rot = (R.f() - 0.5) * 0.22, dx = (R.f() - 0.5) * 120, dy = (R.f() - 0.5) * 120, last = i === n - 1;
      const cw = lerp(720, E.W, last ? open : 0), ch = lerp(960, E.H, last ? open : 0);
      const cx = lerp(E.W / 2 + dx, E.W / 2, last ? open : 0), cy = lerp(E.H * 0.52 + dy, E.H / 2, last ? open : 0) + (1 - s) * 900;
      at(cx, cy, 1, rot * (last ? 1 - open : 1), () => {
        const pad = lerp(18, 0, last ? open : 0);
        card(-cw / 2 - pad, -ch / 2 - pad, cw + 2 * pad, ch + 2 * pad, lerp(16, 0, last ? open : 0), '#fff', { blur: 50, dy: 20 });
        drawCover(IMGS[k], -cw / 2, -ch / 2, cw, ch, { zoom: 1.05 });
      });
    });
  },
};

// photoLoupe — a magnifier circle travels to a detail and holds, showing it 2.2x with a label.
TPL.photoLoupe = {
  dur: 5.0,
  defaults: { img: 'after', target: [620, 900], from: [300, 1300], zoom: 2.2, label: 'HAND-SET TILE', r: 230 },
  draw(t, c, E) {
    const z = 1.03 + 0.03 * seg(t, 0, c.dur);
    drawCover(IMGS[c.img], 0, 0, E.W, E.H, { zoom: z });
    ctx.fillStyle = 'rgba(5,12,25,0.35)'; ctx.fillRect(0, 0, E.W, E.H);
    const m = easeIO(seg(t, 0.4, 1.6)), a = spring(t - 0.2, 200, 18);
    const x = lerp(c.from[0], c.target[0], m), y = lerp(c.from[1], c.target[1], m), r = c.r * clamp(a);
    if (r < 2) return;
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    // the same photo, magnified about the loupe centre
    ctx.translate(x, y); ctx.scale(c.zoom, c.zoom); ctx.translate(-x, -y);
    drawCover(IMGS[c.img], 0, 0, E.W, E.H, { zoom: z });
    ctx.restore();
    circle(x, y, r, null, '#fff', 10); circle(x, y, r + 10, null, hexA(E.B.accent, 0.9), 6);
    const l = spring(t - 1.8, 240, 20);
    if (l > 0.01) { const w = measure(c.label, 46, { weight: 900 }) + 56, ly = y + r + 90 > 1500 ? y - r - 40 : y + r + 90; at(x, ly, 0.8 + 0.2 * l, 0, () => withAlpha(l, () => { card(-w / 2, -64, w, 96, 24, E.B.card); text(c.label, 0, 0, 46, E.B.ink, { align: 'center', weight: 900, shadow: false }); })); }
  },
};

// photoProgress — the real job in stages (before / during / after photos) with a day bar filling underneath.
TPL.photoProgress = {
  dur: 7.0,
  defaults: { imgs: ['before', 'during', 'after'], labels: ['DAY 1', 'DAY 3', 'DAY 7'], title: '' },
  draw(t, c, E) {
    const n = c.imgs.length, each = (c.dur - 0.6) / n, i = Math.min(n - 1, Math.floor(t / each)), lt = t - i * each;
    drawCover(IMGS[c.imgs[i]], 0, 0, E.W, E.H, { zoom: 1.04 + 0.05 * (lt / each) });
    if (lt < 0.18 && i > 0) { ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - lt / 0.18)})`; ctx.fillRect(0, 0, E.W, E.H); }
    // the day bar
    const x0 = 110, x1 = 970, y = 1380, p = clamp(t / (c.dur - 0.6));
    card(x0 - 40, y - 110, x1 - x0 + 80, 190, 30, hexA(E.B.card, 0.92), { blur: 30 });
    rrect(x0, y, x1 - x0, 16, 8); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill();
    rrect(x0, y, (x1 - x0) * p, 16, 8); ctx.fillStyle = E.B.accent; ctx.fill();
    c.labels.forEach((s, k) => { const px = lerp(x0, x1, n === 1 ? 1 : k / (n - 1)), on = k <= i; circle(px, y + 8, 18, on ? E.B.accent : E.B.card, on ? null : 'rgba(255,255,255,0.5)', 4); text(s, px, y - 36, 36, on ? E.B.ink : 'rgba(255,255,255,0.5)', { align: 'center', weight: 900, shadow: false }); });
    if (c.title) text(c.title, E.W / 2, 330, 60, '#fff', { align: 'center', weight: 900, stroke: 10 });
  },
};
