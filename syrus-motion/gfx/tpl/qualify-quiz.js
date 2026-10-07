// qualify-quiz — "DO YOU QUALIFY?" navy card: three yes/no questions build in one per VO beat and each ticks YES
// (green pill + check, NO dims); then a gold card slams in under it: "YOU QUALIFY" / "TAP GET QUOTE ↓". ~6s.
TPL.qualifyQuiz = {
  dur: 6.0,
  // questions = the client's real qualifiers (homeowner, project age, timeline…) — never imply approval/financing
  defaults: {
    title: 'DO YOU QUALIFY?',
    questions: ['Do you own your home?', 'Is your bathroom 5+ years old?', 'Ready to start within 30 days?'],
    result: 'YOU QUALIFY', cta: 'TAP GET QUOTE', y: 300, beat: 0.5, step: 1.15,
  },
  wrap(str, size, maxW, o) {
    const out = []; let cur = '';
    for (const w of String(str).split(/\s+/)) { const s = cur ? cur + ' ' + w : w; if (cur && measure(s, size, o) > maxW) { out.push(cur); cur = w; } else cur = s; }
    if (cur) out.push(cur); return out;
  },
  draw(t, c, E) {
    const B = E.B, Q = c.questions.slice(0, 4), n = Q.length;
    const up = life(t, c.dur, 0.3, 200, 20); if (up <= 0.001) return;
    const cw = 920, x0 = (E.W - cw) / 2, HEAD = 156, RH = 158, ch = HEAD + n * RH + 22, y0 = c.y + (1 - up) * 130;
    const qT = (i) => (c.beats && c.beats[i] != null) ? c.beats[i] : c.beat + i * c.step, yesT = (i) => qT(i) + 0.62, resT = yesT(n - 1) + 0.6;
    const dip = 0.02 * Math.sin(seg(t, resT, resT + 0.25) * Math.PI);
    ctx.globalAlpha = clamp(up * 1.5);
    at(E.W / 2, y0 + ch / 2, 1 - dip, 0, () => at(-E.W / 2, -(y0 + ch / 2), 1, 0, () => {
      card(x0, y0, cw, ch, 36, B.card);
      const ts = fitSize(c.title, 70, cw - 110, { weight: 900 });
      text(c.title, x0 + 56, y0 + 58 + ts * 0.73, ts, B.ink, { weight: 900, shadow: false });
      ctx.fillStyle = hexA(B.ink, 0.12); ctx.fillRect(x0 + 56, y0 + HEAD - 2, cw - 112, 2);
      Q.forEach((q, i) => {
        const k = spring(t - qT(i), 260, 20); if (k <= 0.001) return;
        const ry = y0 + HEAD + i * RH, mid = ry + RH / 2, yes = t >= yesT(i);
        withAlpha(clamp(k * 1.6), () => at((1 - k) * 60, 0, 1, 0, () => {
          const L = this.wrap(q, 44, cw - 56 - 350, { weight: 700 }).slice(0, 2), lh = 52;
          L.forEach((s, j) => text(s, x0 + 56, mid + 16 - ((L.length - 1) * lh) / 2 + j * lh, 44, B.ink, { weight: 700, shadow: false }));
          // YES / NO pills
          const nw = 104, yw = 150, ph = 66, nx = x0 + cw - 50 - nw, yx = nx - 14 - yw, py = mid - ph / 2;
          const yk = yes ? spring(t - yesT(i), 360, 14) : 0;
          withAlpha(yes ? 1 - 0.65 * clamp((t - yesT(i)) / 0.2) : 1, () => {
            rrect(nx, py, nw, ph, ph / 2); ctx.strokeStyle = hexA(B.ink, 0.4); ctx.lineWidth = 3; ctx.stroke();
            text('NO', nx + nw / 2 + 1, mid + 12, 34, hexA(B.ink, 0.75), { align: 'center', weight: 900, spacing: 2, shadow: false });
          });
          at(yx + yw / 2, mid, 1 + 0.12 * Math.sin(clamp(yk) * Math.PI) * (yk < 1.2 ? 1 : 0), 0, () => {
            if (yes) {
              rrect(-yw / 2, -ph / 2, yw, ph, ph / 2); ctx.fillStyle = B.good; ctx.fill();
              check(-yw / 2 + 30, 2, 30, B.dark, easeOut(seg(t, yesT(i) + 0.04, yesT(i) + 0.26)), 6);
              text('YES', 26, 12, 34, B.dark, { align: 'center', weight: 900, spacing: 2, shadow: false });
            } else {
              rrect(-yw / 2, -ph / 2, yw, ph, ph / 2); ctx.strokeStyle = hexA(B.ink, 0.4); ctx.lineWidth = 3; ctx.stroke();
              text('YES', 1, 12, 34, hexA(B.ink, 0.75), { align: 'center', weight: 900, spacing: 2, shadow: false });
            }
          });
        }));
        if (i < n - 1) { ctx.fillStyle = hexA(B.ink, 0.08); ctx.fillRect(x0 + 56, ry + RH - 1, cw - 112, 2); }
      });
    }));
    // result card slams in
    const r = spring(t - resT, 300, 17); if (r <= 0.001) return;
    const gy = y0 + ch + 28, gh = 276;
    withAlpha(clamp(r * 2.5), () => at(E.W / 2, gy + gh / 2, 1 + (1 - clamp(r)) * 0.35 + (r - clamp(r)) * 0.3, 0, () => {
      card(-cw / 2, -gh / 2, cw, gh, 36, B.accent, { blur: 44, dy: 16 });
      const rs = fitSize(c.result, 110, cw - 100, { weight: 900 });
      text(c.result, 0, -gh / 2 + 50 + rs * 0.73, rs, B.card, { align: 'center', weight: 900, shadow: false });
      const ck = spring(t - resT - 0.3, 260, 20), cs = 50, cwid = measure(c.cta, cs, { weight: 900, spacing: 4 });
      withAlpha(clamp(ck * 1.5), () => {
        const cx = -(cwid + 70) / 2, cy = gh / 2 - 46 + (1 - ck) * 16;
        text(c.cta, cx, cy, cs, B.card, { weight: 900, spacing: 4, shadow: false });
        const bob = 6 * Math.sin(Math.max(0, t - resT - 0.6) * 6);
        arrowDown(cx + cwid + 40, cy - 14 + bob, 40, B.card);
      });
    }));
  },
};
