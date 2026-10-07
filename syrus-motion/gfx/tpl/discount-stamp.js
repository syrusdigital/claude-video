// discount-stamp — a rubber-stamp promo that slams onto the frame: drops from big, lands with a squash, a short
// camera-shake and one outline shockwave. Gold ink on a navy card, seeded speckle + uneven ink pressure (all in code),
// slight tilt; a glint crosses it at ~1.2s. "10% OFF / THIS MONTH", "$1,500 OFF", "FREE / INSTALL" (cfg.big, cfg.small). 2.5s.
TPL.discountStamp = {
  dur: 2.5,
  // copy = the offer the client is actually running (never invent a discount); small = '' for a one-line stamp
  defaults: { big: '10% OFF', small: 'THIS MONTH', rot: -7, y: 760, beat: 0.08 },
  star(x, y, r, color) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  },
  draw(t, c, E) {
    const B = E.B, tt = t - c.beat;
    if (tt <= 0) return;
    const DROP = 0.17, ti = tt - DROP;
    const leave = easeIn((t - (c.dur - 0.3)) / 0.3);
    // layout (the stamp sizes itself to the copy)
    const bigO = { weight: 900 }, smO = { weight: 900, spacing: 10 };
    const bs = fitSize(c.big, 176, 700, bigO), bw = measure(c.big, bs, bigO);
    const ss = c.small ? fitSize(c.small, 56, 540, smO) : 0, sw = c.small ? measure(c.small, ss, smO) : 0;
    const gap = 46, capB = bs * 0.73, capS = ss * 0.73;
    const contentH = capB + (c.small ? gap + capS : 0);
    const w = Math.max(bw, c.small ? sw + 150 : 0) + 170, h = contentH + 190;
    // motion: drop (scale 2.3 -> 1, accelerating), squash on impact, decaying shake
    let s, a, dx = 0, dy = 0, dr = 0;
    if (ti < 0) { const u = tt / DROP; s = lerp(2.3, 1, easeIn(u)); a = clamp(u * 2.5); }
    else {
      s = 1 - 0.075 * Math.exp(-ti * 9) * Math.sin(ti * 32);
      a = 1;
      const e = Math.exp(-ti * 10);
      dx = 16 * e * Math.sin(ti * 83 + 0.7); dy = 12 * e * Math.sin(ti * 67 + 2.1); dr = 0.022 * e * Math.sin(ti * 59 + 1.3);
    }
    s *= 1 - 0.12 * leave; a *= 1 - leave;
    const rot = c.rot * Math.PI / 180 + dr, cx = E.W / 2 + dx, cy = c.y + dy;
    ctx.globalAlpha = a;
    // shockwave outline (behind the stamp)
    if (ti > 0 && ti < 0.55) {
      const u = ti / 0.55, g = 1 + 0.32 * easeOut(u);
      at(cx, cy, 1, rot, () => { rrect(-w * g / 2, -h * g / 2, w * g, h * g, 34 * g); ctx.strokeStyle = hexA(B.accent, 0.8 * (1 - u)); ctx.lineWidth = 12 * (1 - u) + 2; ctx.stroke(); });
    }
    at(cx, cy, s, rot, () => {
      card(-w / 2, -h / 2, w, h, 34, B.card, { blur: 46, dy: 18 });
      ctx.save(); rrect(-w / 2, -h / 2, w, h, 34); ctx.clip();
      // ink: double rule, the offer, starred sub-line
      ctx.strokeStyle = B.accent;
      rrect(-w / 2 + 22, -h / 2 + 22, w - 44, h - 44, 22); ctx.lineWidth = 9; ctx.stroke();
      rrect(-w / 2 + 40, -h / 2 + 40, w - 80, h - 80, 12); ctx.lineWidth = 3; ctx.stroke();
      const yb = -contentH / 2 + capB;
      text(c.big, 0, yb, bs, B.accent, { align: 'center', weight: 900, shadow: false });
      if (c.small) {
        const ys = yb + gap + capS;
        text(c.small, 5, ys, ss, B.accent, { align: 'center', ...smO, shadow: false });   // +5: letterSpacing trails the last glyph
        this.star(-sw / 2 - 40, ys - capS / 2, 17, B.accent); this.star(sw / 2 + 40, ys - capS / 2, 17, B.accent);
      }
      // rubber texture: specks + scratches knocked out of the ink in card colour, then uneven pressure
      const R = RNG('stamp', c.big, c.small);
      ctx.fillStyle = B.card;
      for (let i = 0; i < 560; i++) {
        const x = R.r(-w / 2, w / 2), y = R.r(-h / 2, h / 2), r = 0.8 + Math.pow(R.f(), 3) * 5.5;
        ctx.beginPath(); ctx.ellipse(x, y, r, r * R.r(0.45, 1), R.r(0, 3.14), 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = B.card; ctx.lineCap = 'round';
      for (let i = 0; i < 16; i++) {
        const x = R.r(-w / 2, w / 2), y = R.r(-h / 2, h / 2), L = R.r(20, 80), an = R.r(-0.5, 0.5);
        ctx.lineWidth = R.r(1.5, 3.5); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(an) * L, y + Math.sin(an) * L); ctx.stroke();
      }
      const gr = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      gr.addColorStop(0, hexA(B.card, 0)); gr.addColorStop(0.55, hexA(B.card, 0.06)); gr.addColorStop(1, hexA(B.card, 0.34));
      ctx.fillStyle = gr; ctx.fillRect(-w / 2, -h / 2, w, h);
      // glint
      const gu = seg(tt, 1.1, 1.7);
      if (gu > 0 && gu < 1) {
        const gx = lerp(-w * 0.9, w * 0.9, easeIO(gu)), g2 = ctx.createLinearGradient(gx - 110, 0, gx + 110, 0);
        g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(0.5, 'rgba(255,255,255,0.26)'); g2.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save(); ctx.transform(1, 0, -0.4, 1, 0, 0); ctx.fillStyle = g2; ctx.fillRect(gx - 110, -h, 220, 2 * h); ctx.restore();
      }
      ctx.restore();
    });
  },
};
