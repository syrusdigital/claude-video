// process-steps — 3–5 numbered step cards build down the screen, one per VO beat, each with a small original icon.
// A gold highlight frame springs from step to step; finished steps flip their number to a ✓. ~7s for 5 steps.
// Default = Veer's order: in-home estimate -> itemized quote -> pick materials in our showroom -> install -> walkthrough.
TPL.processSteps = {
  dur: 7.0,
  // icons: house | quote | swatch | tools | badge | check (one per step; missing -> check)
  defaults: {
    title: 'HOW IT WORKS',
    steps: ['In-home estimate', 'Itemized quote', 'Pick materials in our showroom', 'Install', 'Final walkthrough'],
    icons: ['house', 'quote', 'swatch', 'tools', 'badge'],
    y: 370, beat: 0.35, step: 1.15,
  },
  wrap(str, size, maxW, o) {
    const out = []; let cur = '';
    for (const w of String(str).split(/\s+/)) { const s = cur ? cur + ' ' + w : w; if (cur && measure(s, size, o) > maxW) { out.push(cur); cur = w; } else cur = s; }
    if (cur) out.push(cur); return out;
  },
  icon(k, x, y, s, col, bg) {   // drawn in a 100-unit box centred on x,y
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 100, s / 100);
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const P = (pts, close) => { ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); if (close) ctx.closePath(); ctx.stroke(); };
    if (k === 'house') {
      P([[-46, -2], [0, -42], [46, -2]]); P([[-32, -14], [-32, 40], [32, 40], [32, -14]]);
      rrect(-11, 12, 22, 28, 4); ctx.stroke(); P([[24, -34], [24, -20]]);
    } else if (k === 'quote') {
      rrect(-34, -38, 68, 84, 10); ctx.stroke(); rrect(-15, -48, 30, 18, 6); ctx.fill();
      for (const yy of [-10, 9, 28]) { P([[-20, yy], [-14, yy]]); P([[-2, yy], [20, yy]]); }
    } else if (k === 'swatch') {
      for (const [a, i] of [[-0.42, 0], [0, 1], [0.42, 2]]) {
        ctx.save(); ctx.translate(0, 38); ctx.rotate(a); rrect(-15, -84, 30, 84, 8); ctx.fillStyle = bg; ctx.fill(); ctx.stroke();
        if (i === 1) { ctx.fillStyle = col; rrect(-15, -84, 30, 26, 8); ctx.fill(); } ctx.restore();
      }
      circle(0, 30, 6, col);
    } else if (k === 'tools') {   // open-end wrench
      ctx.rotate(-0.78); ctx.lineWidth = 16; P([[0, -2], [0, 50]]); ctx.lineWidth = 12;
      ctx.beginPath(); ctx.arc(0, -24, 22, -Math.PI / 2 + 0.75, -Math.PI / 2 - 0.75 + Math.PI * 2); ctx.stroke();
    } else if (k === 'badge') {   // rosette with a check: the finished job
      ctx.beginPath(); for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, r = i % 2 ? 38 : 46; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r - 6); } ctx.closePath(); ctx.stroke();
      ctx.lineWidth = 9; P([[-16, -6], [-4, 7], [18, -18]]);
    } else { ctx.lineWidth = 10; P([[-24, 0], [-6, 18], [26, -20]]); }
    ctx.restore();
  },
  draw(t, c, E) {
    const B = E.B, steps = c.steps.slice(0, 5), n = steps.length;
    const fade = 1 - easeOut((t - (c.dur - 0.3)) / 0.3); if (fade <= 0) return;
    ctx.globalAlpha = fade;
    const cw = 920, x0 = (E.W - cw) / 2, CH = n > 4 ? 150 : 172, GAP = n > 4 ? 22 : 30, PITCH = CH + GAP, y0 = c.y;
    const bt = (i) => c.beat + i * c.step, doneAll = bt(n - 1) + 1.15;
    // title pill
    const ta = spring(t - 0.05, 260, 20);
    if (c.title && ta > 0.001) {
      const tw = measure(c.title, 34, { weight: 800, spacing: 6 }) + 64;
      withAlpha(clamp(ta * 1.5), () => at(E.W / 2, y0 - 66 + (1 - ta) * 24, 1, 0, () => {
        card(-tw / 2, -32, tw, 64, 32, B.card, { blur: 24, dy: 8 });
        text(c.title, 3, 12, 34, B.sky, { align: 'center', weight: 800, spacing: 6, shadow: false });
      }));
    }
    // cards
    steps.forEach((s, i) => {
      const k = spring(t - bt(i) + 0.04, 240, 21); if (k <= 0.001) return;
      const cy = y0 + i * PITCH, nextT = i < n - 1 ? bt(i + 1) : doneAll;
      const active = t >= bt(i) && t < nextT, done = t >= nextT;
      withAlpha(clamp(k * 1.6), () => at((1 - k) * 320, 0, 1, 0, () => {
        card(x0, cy, cw, CH, 30, B.card);
        const nx = x0 + 84, ny = cy + CH / 2;
        if (done) {
          const f = easeOut(seg(t, nextT, nextT + 0.25));
          circle(nx, ny, 44, hexA(B.sky, 0.16)); circle(nx, ny, 44, null, hexA(B.sky, 0.55), 3);
          check(nx - 1, ny + 2, 40, B.sky, f, 9);
          if (f < 1) text(String(i + 1), nx, ny + 16, 46, B.sky, { align: 'center', weight: 900, shadow: false, alpha: 1 - f });
        } else if (active) {
          const p = spring(t - bt(i), 320, 15);
          circle(nx, ny, 44 * (0.8 + 0.2 * p), B.accent);
          text(String(i + 1), nx, ny + 16, 46, B.card, { align: 'center', weight: 900, shadow: false });
        } else {
          circle(nx, ny, 44, null, hexA(B.sky, 0.6), 4);
          text(String(i + 1), nx, ny + 16, 46, B.sky, { align: 'center', weight: 900, shadow: false });
        }
        const L = this.wrap(s, 46, cw - 168 - 150, { weight: 800 }).slice(0, 2), lh = 54;
        const ty = ny + 17 - ((L.length - 1) * lh) / 2;
        L.forEach((ln, j) => text(ln, x0 + 160, ty + j * lh, 46, B.ink, { weight: 800, shadow: false, alpha: done ? 0.78 : 1 }));
        const ic = (c.icons && c.icons[i]) || 'check';
        this.icon(ic, x0 + cw - 86, ny, 76, active ? B.accent : done ? hexA(B.sky, 0.7) : B.sky, B.card);
      }));
    });
    // the active-step highlight: springs down from card to card, fades when the last step completes
    const h0 = spring(t - bt(0), 260, 20); if (h0 <= 0.001) return;
    let hy = y0; for (let i = 1; i < n; i++) hy += spring(t - bt(i), 230, 21) * PITCH;
    const ha = clamp(h0 * 1.5) * (1 - easeOut(seg(t, doneAll, doneAll + 0.35)));
    if (ha > 0.001) withAlpha(ha, () => {
      ctx.save(); ctx.shadowColor = hexA(B.accent, 0.6); ctx.shadowBlur = 26;
      rrect(x0 - 7, hy - 7, cw + 14, CH + 14, 36); ctx.strokeStyle = B.accent; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
    });
  },
};
