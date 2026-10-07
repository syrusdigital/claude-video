// house-anim — full-screen explainer animations for the house-style ads, built to replace stock "metaphor" shots
// (calculators, paperwork, car/gym/coffee clips). Same flat-vector language as scene-kit: navy backdrop, a camera that is
// always moving, gold for the offer, red for the problem. Every timing is a beat (seconds into the item; ad.json can give
// VO anchors like "word:labor", converted by tools/cut.py), so each animation lands on the spoken words.
// No figure appears on screen unless it is spoken in the VO.

// quoteSheet — a contractor's quote on paper. Line items write in one by one; cfg.flag picks a line that turns red with a
// tag (e.g. the labor line: "+ THOUSANDS"); cfg.markups fly red "+ MARKUP" tags onto the total while it inflates;
// cfg.total circles the bottom line in red marker; cfg.free strikes a line and stamps it FREE in gold.
TPL.quoteSheet = {
  dur: 5,
  defaults: {
    title: 'QUOTE', sub: 'Impact windows', lines: ['Impact windows', 'Permits', 'Installation labor', 'Disposal'],
    beats: [0.25, 0.55, 0.85, 1.15],          // when each line writes in
    flag: null, flagAt: 2.0, flagTag: '+ THOUSANDS',
    total: '$20,000+', totalAt: 1.6, circleAt: 2.2,
    markups: [], markupLabel: '+ MARKUP',      // beats for markup tags (the total gets more $ signs with each)
    free: null, freeAt: 3.0, freeText: 'FREE',
    caption: '', captionAt: 0.1, caption2: '', caption2At: 3.0,
  },
  draw(t, c, E) {
    const K = TPL.sceneKit, B = E.B;
    K.bg(t, E, { glowY: 1000 });
    K.cam(t, c.dur, () => {
      const ap = spring(t, 200, 18), W = 780, H = 980, x0 = 540 - W / 2, y0 = 560;
      at(540, y0 + H / 2 + (1 - ap) * 220, 0.9 + 0.1 * ap, -0.025 + 0.01 * Math.sin(t * 0.6), () => {
        const X = -W / 2, Y = -H / 2;
        ctx.globalAlpha *= clamp(ap * 1.4);
        card(X, Y, W, H, 26, '#FBFAF6', { blur: 60, dy: 26, shadowColor: 'rgba(0,6,20,0.6)' });
        rrect(X, Y, W, 150, 26); ctx.fillStyle = '#E9EEF5'; ctx.fill(); ctx.fillStyle = '#E9EEF5'; ctx.fillRect(X, Y + 100, W, 50);
        text(c.title, X + 56, Y + 102, 64, '#0B1630', { weight: 900, spacing: 6, shadow: false });
        text(c.sub, X + W - 56, Y + 96, 34, '#56637B', { weight: 600, align: 'right', shadow: false });
        const LY = Y + 230, LH = 112;
        c.lines.forEach((ln, i) => {
          const u = easeOut(seg(t, c.beats[i] ?? 0, (c.beats[i] ?? 0) + 0.35)); if (u <= 0) return;
          const y = LY + i * LH, flagged = c.flag === i, fu = flagged ? easeOut(seg(t, c.flagAt, c.flagAt + 0.3)) : 0;
          const freed = c.free === i, gu = freed ? easeOut(seg(t, c.freeAt, c.freeAt + 0.35)) : 0;
          if (fu > 0 && gu < 1) { rrect(X + 30, y - 66, W - 60, 92, 18); ctx.fillStyle = hexA(B.bad, 0.13 * fu * (1 - gu)); ctx.fill(); }
          withAlpha(u, () => {
            text(ln, X + 56 + (1 - u) * 30, y, 44, K.mix('#24324A', B.bad, fu * (1 - gu)), { weight: 700, shadow: false });
            // dotted leader to the amount column
            ctx.save(); ctx.setLineDash([3, 12]); ctx.strokeStyle = '#B9C2D0'; ctx.lineWidth = 3; ctx.beginPath();
            const lx = X + 70 + measure(ln, 44, { weight: 700 }); ctx.moveTo(lx, y - 10); ctx.lineTo(X + W - 200, y - 10); ctx.stroke(); ctx.restore();
            rrect(X + W - 180, y - 34, 124 * u, 22, 11); ctx.fillStyle = K.mix('#CBD3DF', B.bad, fu * (1 - gu)); ctx.fill();   // a blurred figure, never a number
          });
          if (fu > 0 && gu < 0.5) K.chip(X + W - 40, y + 52, c.flagTag, spring(t - c.flagAt, 260, 15) * (1 - gu * 2), E, { size: 34, fill: B.bad, color: '#FFFFFF', align: 'right' });
          if (gu > 0) {   // strike + FREE stamp
            line([[X + 50, y - 16], [X + 50 + (W - 100) * gu, y - 16]], B.bad, 7);
            const sp = spring(t - c.freeAt - 0.15, 300, 13);
            if (sp > 0.001) at(X + W - 150, y - 20, 1.6 - 0.6 * clamp(sp), -0.12, () => {
              ctx.globalAlpha *= clamp(sp * 2); card(-130, -52, 260, 104, 18, B.accent, { blur: 24, dy: 8, shadowColor: 'rgba(0,0,0,0.35)' });
              text(c.freeText, 0, 24, 66, '#1A1300', { weight: 900, align: 'center', spacing: 4, shadow: false });
            });
          }
        });
        // total
        const tu = easeOut(seg(t, c.totalAt, c.totalAt + 0.4));
        if (tu > 0) withAlpha(tu, () => {
          const ty = Y + H - 120;
          ctx.fillStyle = '#0B1630'; ctx.fillRect(X + 56, ty - 98, W - 112, 5); ctx.fillRect(X + 56, ty - 86, W - 112, 2);
          text('TOTAL', X + 56, ty, 50, '#0B1630', { weight: 900, spacing: 4, shadow: false });
          const nm = c.markups.filter((b) => t >= b).length;
          const tot = c.markups.length ? '$'.repeat(2 + nm) : c.total;
          const infl = c.markups.reduce((a, b) => a + spring(t - b, 280, 10) * 0.08, 0);
          at(X + W - 56, ty - 18, 1 + infl, 0, () => text(tot, 0, 24, 76, nm || c.flag != null ? B.bad : '#0B1630', { weight: 900, align: 'right', shadow: false }));
          // red marker circle around the total
          const cu = easeIO(seg(t, c.circleAt, c.circleAt + 0.55));
          if (cu > 0 && c.circleAt != null) {
            ctx.save(); ctx.strokeStyle = B.bad; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath();
            const cx = X + W - 56 - measure(tot, 76, { weight: 900 }) / 2, rx = measure(tot, 76, { weight: 900 }) / 2 + 46, ry = 70;
            for (let k = 0; k <= 60 * cu; k++) { const a = -Math.PI * 0.6 + (k / 60) * Math.PI * 2.15, wob = 1 + 0.04 * Math.sin(k * 0.7); const px = cx + Math.cos(a) * rx * wob, py = ty - 24 + Math.sin(a) * ry * wob; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
            ctx.stroke(); ctx.restore();
          }
          // markup tags stacking up the right edge
          c.markups.forEach((b, k) => {
            const sp = spring(t - b, 280, 14); if (sp <= 0.001) return;
            K.chip(X + W + 10 - (1 - clamp(sp)) * 120, ty - 170 - k * 92, c.markupLabel, sp, E, { size: 36, fill: B.bad, color: '#FFFFFF', align: 'right' });
          });
        });
      });
      K.caption(t, c.captionAt, c.caption, 330, E, { size: 66, t1: c.caption2 ? c.caption2At - 0.25 : null });
      if (c.caption2) K.caption(t, c.caption2At, c.caption2, 330, E, { size: 66 });
    }, { z0: 1.0, z1: 1.06 });
  },
};

// small flat icons for the comparison scenes (drawn centred on 0,0 in a ~200px box)
TPL.houseIcons = {
  car(col) {
    K_box(-150, -10, 300, 80, 34, col); K_box(-92, -70, 170, 76, 30, TPL.sceneKit.shade(col, 0.15));
    rrect(-74, -58, 62, 50, 12); ctx.fillStyle = '#CFE7FF'; ctx.fill(); rrect(0, -58, 62, 50, 12); ctx.fill();
    circle(-86, 72, 34, '#1B2433'); circle(-86, 72, 14, '#9AA7B8'); circle(86, 72, 34, '#1B2433'); circle(86, 72, 14, '#9AA7B8');
    circle(142, 18, 9, '#FFE38A');
  },
  dumbbell(col) {
    K_box(-110, -14, 220, 28, 14, '#8C97A8');
    for (const s of [-1, 1]) { K_box(s * 112 - 22, -70, 44, 140, 14, col); K_box(s * 150 - 16, -52, 32, 104, 12, TPL.sceneKit.shade(col, -0.2)); }
  },
  coffee(col) {
    ctx.beginPath(); ctx.moveTo(-70, -90); ctx.lineTo(70, -90); ctx.lineTo(54, 110); ctx.lineTo(-54, 110); ctx.closePath(); ctx.fillStyle = '#F4F1EA'; ctx.fill();
    K_box(-86, -122, 172, 38, 14, '#E2DED5'); K_box(-66, -146, 132, 30, 12, '#EDEAE3');
    ctx.beginPath(); ctx.moveTo(-64, -18); ctx.lineTo(64, -18); ctx.lineTo(58, 56); ctx.lineTo(-58, 56); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    for (let k = 0; k < 3; k++) { ctx.save(); ctx.globalAlpha *= 0.5; line([[-20 + k * 20, -170], [-30 + k * 20, -200], [-18 + k * 20, -232]], '#FFFFFF', 6); ctx.restore(); }
  },
  kitchen(col) {
    K_box(-150, -20, 300, 120, 14, col); K_box(-160, -34, 320, 22, 8, '#F4F1EA');
    for (let k = 0; k < 3; k++) K_box(-136 + k * 96, 0, 80, 84, 8, TPL.sceneKit.shade(col, -0.12));
    K_box(-150, -150, 130, 80, 10, TPL.sceneKit.shade(col, 0.1)); K_box(20, -150, 130, 80, 10, TPL.sceneKit.shade(col, 0.1));
    line([[0, -200], [0, -160]], '#C9B37A', 5); K_box(-26, -168, 52, 18, 8, '#FFE38A');
  },
};
function K_box(x, y, w, h, r, fill) { rrect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); }

// monthlyStack — "less than your car payment, gym membership and takeout coffee combined": each thing pops in as an icon
// card on its word (beats[0..2]); on beats[3] the three cards drop into one tall stacked bar ("EVERY MONTH") and a
// shorter gold bar lands beside it with the offer (cfg.offer, e.g. "$349/mo").
TPL.monthlyStack = {
  dur: 4.5,
  defaults: {
    items: [{ icon: 'car', label: 'CAR PAYMENT', col: '#5AA9E6' }, { icon: 'dumbbell', label: 'GYM', col: '#E3A458' }, { icon: 'coffee', label: 'TAKEOUT COFFEE', col: '#8A5A3C' }],
    beats: [0.2, 0.9, 1.6, 2.5], offer: '$349/mo', offerLabel: 'YOUR NEW KITCHEN', stackLabel: 'COMBINED',
    caption: 'LESS THAN|*ALL THREE COMBINED*', captionAt: null,
  },
  draw(t, c, E) {
    const K = TPL.sceneKit, B = E.B, I = TPL.houseIcons, bs = c.beats, tb = bs[3];
    K.bg(t, E);
    K.cam(t, c.dur, () => {
      const m = easeIO(seg(t, tb, tb + 0.7));               // cards -> bar
      const barX = 330, barW = 300, baseY = 1500, segH = 250;
      c.items.forEach((it, i) => {
        const p = spring(t - bs[i], 240, 15); if (p <= 0.001) return;
        const cx0 = 540, cy0 = 640 + i * 330, cx1 = barX, cy1 = baseY - segH * (i + 0.5);
        const x = lerp(cx0, cx1, m), y = lerp(cy0, cy1, m), w = lerp(820, barW, m), h = lerp(280, segH, m);
        ctx.save(); ctx.globalAlpha *= clamp(p * 1.5); ctx.translate(x, y); ctx.scale(0.8 + 0.2 * p, 0.8 + 0.2 * p);
        card(-w / 2, -h / 2, w, h, lerp(36, 8, m), K.mix(B.card, it.col, m), { blur: 40, dy: 14, shadowColor: 'rgba(0,8,24,0.5)', stroke: K.a(it.col, 0.6 * (1 - m)), lw: 4 });
        withAlpha(1 - m, () => {
          at(-w / 2 + 170, 0, 0.62, 0, () => I[it.icon](it.col));
          text(it.label, -w / 2 + 330, 22, fitSize(it.label, 62, w - 380, { weight: 900 }), B.ink, { weight: 900, shadow: false });
        });
        withAlpha(m, () => at(0, 0, 0.42, 0, () => I[it.icon]('#FFFFFF')));
        ctx.restore();
      });
      if (m > 0) {
        withAlpha(m, () => text(c.stackLabel, barX, baseY + 76, 44, B.ink, { weight: 900, align: 'center', spacing: 4, shadow: false }));
        const g = spring(t - tb - 0.6, 200, 14), gh = segH * 1.15 * clamp(g), gx = 760;
        if (g > 0.001) {
          card(gx - barW / 2, baseY - gh, barW, gh, 8, B.accent, { blur: 40, dy: 12, shadowColor: 'rgba(0,0,0,0.4)' });
          withAlpha(clamp(g * 1.5), () => {
            text(c.offer, gx, baseY - gh - 40, fitSize(c.offer, 92, 420, { weight: 900 }), B.accent, { weight: 900, align: 'center', shadow: false });
            text(c.offerLabel, gx, baseY + 76, 40, B.accent, { weight: 900, align: 'center', spacing: 3, shadow: false });
            at(gx, baseY - gh / 2, 0.36, 0, () => I.kitchen('#7A5230'));
          });
        }
        ctx.save(); ctx.globalAlpha *= m; ctx.fillStyle = K.a(B.ink, 0.35); ctx.fillRect(140, baseY, 800, 4); ctx.restore();
      }
      if (c.caption) K.caption(t, c.captionAt ?? tb + 0.2, c.caption, 360, E, { size: 70 });
    }, { z0: 1.0, z1: 1.05 });
  },
};

// priceToMonthly — "stop thinking about it as a $19,995 one-time payment and start thinking about it as $349 a month":
// beats[0] the big one-time price slab lands (muted, with ONE-TIME), beats[1] a red strike crosses it and it shrinks away,
// beats[2] a calendar flips its pages while the gold monthly figure lands. cfg.fine is optional small print under it.
TPL.priceToMonthly = {
  dur: 5,
  defaults: { big: '$19,995', bigLabel: 'ONE-TIME PAYMENT', monthly: '$349', per: 'A MONTH', beats: [0.2, 2.2, 3.0], fine: '' },
  draw(t, c, E) {
    const K = TPL.sceneKit, B = E.B, [b0, b1, b2] = c.beats;
    K.bg(t, E);
    K.cam(t, c.dur, () => {
      const p0 = spring(t - b0, 220, 15), go = easeIO(seg(t, b1 + 0.45, b1 + 1.0));
      if (p0 > 0.001 && go < 1) at(540, lerp(900, 520, go), (0.8 + 0.2 * p0) * lerp(1, 0.55, go), -0.02, () => {
        ctx.globalAlpha *= clamp(p0 * 1.5) * (1 - 0.5 * go);
        card(-400, -170, 800, 340, 40, K.mix(B.card, '#3A4256', 0.5), { blur: 50, dy: 18, shadowColor: 'rgba(0,8,24,0.55)', stroke: K.a(B.ink, 0.2), lw: 3 });
        text(c.bigLabel, 0, -80, 40, K.a(B.ink, 0.75), { weight: 800, align: 'center', spacing: 6, shadow: false });
        text(c.big, 0, 90, 170, B.ink, { weight: 900, align: 'center', shadow: false });
        const su = easeOut(seg(t, b1, b1 + 0.35));
        if (su > 0) line([[-360, 60], [-360 + 720 * su, -10]], B.bad, 16);
      });
      const p2 = spring(t - b2, 200, 13);
      if (p2 > 0.001) {
        at(540, 1080, 0.85 + 0.15 * p2, 0, () => {   // calendar with flipping pages
          ctx.globalAlpha *= clamp(p2 * 1.5);
          card(-200, -170, 400, 380, 34, B.card, { blur: 50, dy: 18, shadowColor: 'rgba(0,8,24,0.55)', stroke: K.a(B.accent, 0.5), lw: 4 });
          rrect(-200, -170, 400, 96, 34); ctx.fillStyle = B.bad; ctx.fill(); ctx.fillRect(-200, -110, 400, 36);
          for (const s of [-1, 1]) { K_box(s * 110 - 12, -196, 24, 60, 12, '#2A3448'); }
          const flips = Math.max(0, (t - b2) * 2.2), fk = flips % 1, months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
          text(months[Math.floor(flips) % 12], 0, -104, 46, '#FFFFFF', { weight: 900, align: 'center', spacing: 4, shadow: false });
          text(c.monthly, 0, 96, 128, B.accent, { weight: 900, align: 'center', shadow: false });
          if (fk < 0.3) { ctx.save(); ctx.globalAlpha *= 0.85 * (1 - fk / 0.3); K_box(-200, -74, 400, 284 * (1 - fk / 0.3), 0, K.mix(B.card, '#FFFFFF', 0.12)); ctx.restore(); }
        });
        withAlpha(clamp(p2 * 1.4), () => {
          at(540, 1380, 0.8 + 0.2 * p2, 0, () => {
            text(c.per, 0, 0, 92, B.ink, { weight: 900, align: 'center', spacing: 10, shadow: false });
          });
          if (c.fine) text(c.fine, 540, 1470, 30, K.a(B.ink, 0.6), { weight: 600, align: 'center', shadow: false });
        });
      }
    }, { z0: 1.0, z1: 1.05 });
  },
};

// finePrint — a one-line disclosure under the action (e.g. "Starting price for a standard bathroom..."): small, soft
// shadow, fades in and out. For price qualifiers the client or brief requires on screen.
TPL.finePrint = {
  dur: 3,
  defaults: { text: '', y: 1600, size: 34 },
  draw(t, c, E) {
    const a = clamp(t / 0.25) * (1 - clamp((t - (c.dur - 0.3)) / 0.3)); if (a <= 0.001 || !c.text) return;
    const fs = fitSize(c.text, c.size, 960, { weight: 600 });
    text(c.text, 540, c.y, fs, '#FFFFFF', { weight: 600, align: 'center', alpha: a * 0.92, blur: 8, shadowColor: 'rgba(0,0,0,0.8)' });
  },
};
