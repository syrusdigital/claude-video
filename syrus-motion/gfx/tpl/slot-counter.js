// slot-counter — "Only 10 showcase homes": a grid of small house icons, cfg.taken of them get a TAKEN stamp one by one
// while the count rolls down, "3 SPOTS LEFT" lands in gold (the open houses light up gold), then the qualifier
// checkboxes tick one per beat. 6.0s.
TPL.slotCounter = {
  dur: 6.0,
  // NOTE: total, taken, the headline and every qualifier are CLIENT-CONFIRMED variables (scarcity rule) — set them
  // from the client's real numbers for each ad; never present an unconfirmed count, deadline or criterion as fact.
  defaults: {
    kicker: 'SHOWCASE HOME PROGRAM', title: 'Only 10 showcase homes', titleMark: '10',
    total: 10, taken: 7, left: 'SPOTS LEFT', leftOne: 'SPOT LEFT', stamp: 'TAKEN',
    qualHead: 'TO QUALIFY', quals: ['Home is 5+ years old', 'Full remodel or tub-to-shower', 'Start within 30 days'],
    beats: { houses: 0.3, stamps: 1.0, stampStep: 0.2, quals: 3.0, qualStep: 0.55 }, y: 290,
  },
  house(cx, cy, s, stroke, fill, lw, door) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(s / 100, s / 100); ctx.lineWidth = lw * 100 / s; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(46, -6); ctx.lineTo(35, -6); ctx.lineTo(35, 40); ctx.lineTo(-35, 40); ctx.lineTo(-35, -6); ctx.lineTo(-46, -6); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.stroke();
    rrect(-9, 13, 18, 27, 3); if (door) ctx.strokeStyle = door; ctx.stroke();
    ctx.restore();
  },
  draw(t, c, E) {
    const B = E.B, me = TPL.slotCounter, Bt = c.beats, total = Math.max(1, Math.min(15, c.total)), taken = clamp(c.taken, 0, total);
    const up = life(t, c.dur, 0.35, 200, 21); if (up <= 0.001) return;
    ctx.globalAlpha = clamp(up * 1.5);
    const cw = 900, pad = 56, x0 = (E.W - cw) / 2, y0 = c.y + (1 - up) * 120;
    const cols = total <= 6 ? total : total <= 12 ? Math.ceil(total / 2) : 5, nrows = Math.ceil(total / cols);
    const cell = (cw - pad * 2) / cols, cellH = Math.min(cell, 150), hs = Math.min(cell * 0.7, 104);
    const gy = y0 + 200, countY = gy + nrows * cellH + 88, divY = countY + 50, qy = divY + 70;
    const quals = c.quals || [], qg = quals.length ? spring(t - Bt.quals + 0.35, 220, 24) : 0;
    const ch = divY - y0 + 18 + qg * (qy + 20 + quals.length * 84 - divY + 6);
    card(x0, y0, cw, ch, 36, B.card);
    ctx.save(); rrect(x0, y0, cw, ch, 36); ctx.clip();
    text(c.kicker, x0 + pad, y0 + 84, 34, B.sky, { weight: 700, spacing: 6, shadow: false });
    // title with the number in gold
    { const s = fitSize(c.title, 62, cw - pad * 2, { weight: 900 }), i = c.titleMark ? c.title.indexOf(c.titleMark) : -1;
      const parts = i >= 0 ? [c.title.slice(0, i), c.titleMark, c.title.slice(i + c.titleMark.length)] : [c.title, '', ''];
      let x = x0 + pad; parts.forEach((p, j) => { if (p) x += text(p, x, y0 + 162, s, j === 1 ? B.accent : B.ink, { weight: 900, shadow: false }); }); }
    // stamp order: a seeded shuffle, so the taken homes look scattered
    const R = RNG('slots', String(total), String(taken)), order = [...Array(total).keys()];
    for (let i = total - 1; i > 0; i--) { const j = R.i(0, i); [order[i], order[j]] = [order[j], order[i]]; }
    const stampT = {}; order.slice(0, taken).forEach((h, k) => { stampT[h] = Bt.stamps + k * Bt.stampStep; });
    const tDone = taken ? Bt.stamps + (taken - 1) * Bt.stampStep + 0.06 : Bt.stamps, lit = spring(t - tDone - 0.25, 320, 16);
    for (let h = 0; h < total; h++) {
      const col = h % cols, row = Math.floor(h / cols), inRow = row === nrows - 1 ? total - row * cols : cols;
      const cx = x0 + pad + (col + 0.5 + (cols - inRow) / 2) * cell, cy = gy + row * cellH + cellH / 2;
      const a = spring(t - Bt.houses - h * 0.045, 320, 18); if (a <= 0.001) continue;
      const ts = stampT[h], isTaken = ts != null && t >= ts + 0.05;
      const dent = ts != null ? 1 - 0.1 * Math.sin(Math.PI * seg(t, ts + 0.03, ts + 0.2)) : 1;
      const glow = ts == null ? lit : 0;
      withAlpha(clamp(a * 2) * (isTaken ? 0.38 : 1), () => at(cx, cy, (0.6 + 0.4 * a) * dent * (1 + 0.08 * Math.sin(Math.PI * clamp(glow, 0, 1))), 0, () => {
        const gold = glow > 0.02;
        me.house(0, 0, hs, gold ? B.accent : B.ink, gold ? hexA(B.accent, clamp(glow)) : hexA(B.sky, 0.14), 4.5, gold && glow > 0.5 ? B.card : null);
      }));
      if (ts != null) {
        const k = spring(t - ts, 520, 26); if (k <= 0.001) continue;
        withAlpha(clamp(k * 2.5), () => at(cx, cy + 6, 1 + 0.9 * (1 - k), -0.2, () => {
          const sw = Math.min(cell - 18, 136), sh = 50;
          rrect(-sw / 2, -sh / 2, sw, sh, 9); ctx.fillStyle = hexA(B.dark, 0.72); ctx.fill(); ctx.strokeStyle = B.bad; ctx.lineWidth = 5; ctx.stroke();
          text(c.stamp, 0, 11, fitSize(c.stamp, 32, sw - 22, { weight: 900, spacing: 2 }), B.bad, { weight: 900, spacing: 2, align: 'center', shadow: false });
        }));
      }
    }
    // the count: rolls down with every stamp, lands in gold when the last one hits
    if (t > Bt.houses + 0.2) {
      const landed = order.slice(0, taken).filter((h) => t >= stampT[h] + 0.06).length, n = total - landed;
      const lastT = landed ? stampT[order[landed - 1]] + 0.06 : 0, roll = landed ? easeOut((t - lastT) / 0.16) : 1;
      const fin = t >= tDone + 0.12, f = spring(t - tDone - 0.12, 380, 15);
      const col = fin ? B.accent : B.ink, lab = n === 1 ? c.leftOne : c.left;
      const ns = 104, ls = 54, nw = measure(String(n), ns, { weight: 900 }), lw = measure(lab, ls, { weight: 900, spacing: 2 }), gap = 22;
      withAlpha(clamp((t - Bt.houses - 0.2) * 4), () => at(E.W / 2, countY, fin ? 1 + 0.12 * Math.sin(Math.PI * clamp(f, 0, 1)) : 1, 0, () => {
        const x = -(nw + gap + lw) / 2;
        ctx.save(); ctx.beginPath(); ctx.rect(x - 20, -ns, nw + 40, ns * 1.25); ctx.clip();
        text(String(n), x, -(1 - roll) * 50, ns, col, { weight: 900, shadow: false, alpha: roll });
        ctx.restore();
        text(lab, x + nw + gap, 0, ls, col, { weight: 900, spacing: 2, shadow: false });
      }));
    }
    if (!quals.length) { ctx.restore(); return; }
    ctx.fillStyle = hexA(B.ink, 0.14 * clamp(qg * 2)); ctx.fillRect(x0 + pad, divY, cw - pad * 2, 2);
    text(c.qualHead, x0 + pad, qy, 30, B.sky, { weight: 700, spacing: 6, shadow: false, alpha: clamp((t - Bt.quals + 0.3) * 4) });
    quals.forEach((q, i) => {
      const b = Bt.quals + i * Bt.qualStep, a = spring(t - b, 300, 21); if (a <= 0.001) return;
      const cy = qy + 62 + i * 84, bx = x0 + pad + 26;
      withAlpha(clamp(a * 1.6), () => at((1 - a) * -40, 0, 1, 0, () => {
        rrect(bx - 26, cy - 26, 52, 52, 13); ctx.strokeStyle = hexA(B.ink, 0.35); ctx.lineWidth = 4; ctx.stroke();
        const k = spring(t - b - 0.12, 420, 20), tick = easeOut((t - b - 0.17) / 0.22);
        if (k > 0.001) at(bx, cy, k, 0, () => { rrect(-26, -26, 52, 52, 13); ctx.fillStyle = B.good; ctx.fill(); });
        if (tick > 0) check(bx - 1, cy + 3, 28, B.card, tick, 7);
        text(q, bx + 50, cy + 16, fitSize(q, 44, cw - pad * 2 - 100, { weight: 700 }), B.ink, { weight: 700, shadow: false });
      }));
    });
    ctx.restore();
  },
};
