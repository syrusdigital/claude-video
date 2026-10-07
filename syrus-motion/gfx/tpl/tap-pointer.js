// tap-pointer — an original cartoon hand (drawn in code) slides up from the bottom and taps twice toward where Meta's
// "Get Quote" button sits on the phone, with tap ripples; "TAP GET QUOTE" pops above it ("GET QUOTE" in gold). ~2.5s.
// Draws NO button or app UI — the real CTA under the video is the target. cfg.x/cfg.y = the tap point
// (~540/1600 on a 1080x1920 frame suits Reels placements; nudge per placement), cfg.textY = the words' baseline.
TPL.tapPointer = {
  dur: 2.5,
  defaults: { pre: 'TAP', em: 'GET QUOTE', x: 540, y: 1600, textY: 0, beat: 0.05, taps: [0.75, 1.4], tilt: -0.3, scale: 1.1 },
  // the hand in local coords: fingertip at (0,0) pointing up (-y); right hand, back of the hand toward camera
  hand(B, press) {
    const ink = B.ink, edge = B.dark, LW = 8;
    const shape = (fn) => { fn(); ctx.fillStyle = ink; ctx.fill(); ctx.lineWidth = LW; ctx.strokeStyle = edge; ctx.lineJoin = 'round'; ctx.stroke(); };
    // soft drop shadow for the whole silhouette
    ctx.save(); ctx.shadowColor = 'rgba(0,10,30,0.45)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 16; ctx.fillStyle = ink;
    rrect(-46, 170, 244, 210, 70); ctx.fill(); rrect(-38, 0, 76, 250, 38); ctx.fill(); ctx.restore();
    // sleeve + cuff
    rrect(-58, 352, 270, 640, 26); ctx.fillStyle = B.card; ctx.fill(); ctx.lineWidth = LW; ctx.strokeStyle = edge; ctx.stroke();
    rrect(-58, 352, 270, 26, 13); ctx.fillStyle = B.sky; ctx.fill();
    // back of hand, curled fingers (pinky -> middle), index finger, thumb
    shape(() => rrect(-46, 170, 244, 210, 70));
    for (const [x, y, h] of [[142, 176, 104], [92, 160, 116], [40, 152, 122]]) shape(() => rrect(x, y, 60, h, 30));
    shape(() => rrect(-38, 0, 76, 262, 38));
    ctx.save(); ctx.translate(-22, 318); ctx.rotate(-0.62); shape(() => rrect(-34, -124, 68, 150, 34)); ctx.restore();
    // details: nail, knuckle creases
    rrect(-20, 14, 40, 44, 16); ctx.fillStyle = 'rgba(11,20,36,0.07)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(11,20,36,0.35)'; ctx.stroke();
    ctx.lineCap = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(11,20,36,0.35)';
    for (const y of [104, 126]) { ctx.beginPath(); ctx.moveTo(-14, y); ctx.lineTo(14, y); ctx.stroke(); }
    // press shading on the fingertip
    if (press > 0) { rrect(-38, 0, 76, 70, 38); ctx.fillStyle = `rgba(11,20,36,${0.08 * press})`; ctx.fill(); }
  },
  draw(t, c, E) {
    const B = E.B, tt = t - c.beat; if (tt <= 0) return;
    const leave = easeIn(seg(t, c.dur - 0.35, c.dur));
    // text
    const ty = c.textY || c.y - 290, ta = spring(tt - 0.25, 300, 17);
    if (ta > 0.001) {
      const S = 96, O = { weight: 900 }, sp = ' ', w1 = measure(c.pre + sp, S, O), w2 = measure(c.em, S, O), sc = Math.min(1, 940 / (w1 + w2));
      withAlpha(clamp(ta * 2) * (1 - leave), () => at(E.W / 2, ty, (0.7 + 0.3 * ta) * sc, 0, () => {
        const x0 = -(w1 + w2) / 2;
        text(c.pre, x0, 0, S, '#FFFFFF', { ...O, stroke: 12, strokeColor: 'rgba(0,8,24,0.9)', blur: 22 });
        text(c.em, x0 + w1, 0, S, B.accent, { ...O, stroke: 12, strokeColor: 'rgba(0,8,24,0.9)', blur: 22 });
      }));
    }
    // taps: press 0..1 (fast down, slower release)
    let press = 0;
    for (const tp of c.taps) { const a = tt - tp; if (a > 0 && a < 0.12) press = Math.max(press, easeIn(a / 0.12)); else if (a >= 0.12 && a < 0.42) press = Math.max(press, 1 - easeOut((a - 0.12) / 0.3)); }
    // ripples (under the hand) from each contact
    for (const tp of c.taps) {
      const ru = seg(tt, tp + 0.1, tp + 0.75); if (ru <= 0 || ru >= 1) continue;
      const e = easeOut(ru);
      withAlpha(1 - leave, () => {
        circle(c.x, c.y, 26 + 120 * e, null, `rgba(255,255,255,${0.9 * (1 - ru)})`, 9 * (1 - ru) + 2);
        const r2 = seg(tt, tp + 0.2, tp + 0.85); if (r2 > 0 && r2 < 1) circle(c.x, c.y, 20 + 90 * easeOut(r2), null, hexA(B.accent, 0.9 * (1 - r2)), 7 * (1 - r2) + 2);
        if (ru < 0.35) circle(c.x, c.y, 30 * (1 - ru / 0.35), `rgba(255,255,255,${0.6 * (1 - ru / 0.35)})`);
      });
    }
    // the hand: rides up from below the frame, rests just off the target, presses onto it
    const inK = spring(tt, 150, 18), RX = 34, RY = 74;
    const hx = c.x + RX * (1 - press) + 40 * (1 - inK), hy = c.y + RY * (1 - press) + (1 - inK) * 760 + leave * 760;
    at(hx, hy, c.scale * (1 - 0.06 * press), c.tilt + 0.12 * (1 - inK), () => this.hand(B, press));
  },
};
