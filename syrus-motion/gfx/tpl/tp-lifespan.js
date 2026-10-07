// tp-lifespan — roof-lifespan card for on-camera explainers (Twin Pines TP3): a navy card in the top third grows a row per
// VO beat — each row has an original code-drawn shingle swatch (3-tab / dimensional / metal + synthetic slate) and its name —
// then, on the lifespan line, the row's bar grows and the label lands ("UP TO 30+ YEARS"). Bars are qualitative (len 0–1).
// Sits above a talking head (y ≈ 250–880), so captions can stay on (hide: false). Holds until dur, then lifts away.
// cfg.rows[i] = { kind: '3tab'|'dimensional'|'metal', name, len, label, at, barAt, gold }  (at/barAt = seconds from item start)
TPL.tpLifespan = {
  dur: 12.0,
  // Copy = what the speaker says on camera; lifespans are always phrased "up to" (no warranty claims).
  defaults: {
    kicker: 'ROOF LIFESPAN', y: 250, x: 60, w: 960,
    rows: [
      { kind: '3tab', name: 'Standard 3-tab', len: 0.3, label: 'SHORTER LIFESPAN', at: 0.3, barAt: 2.9 },
      { kind: 'dimensional', name: 'Dimensional shingle', len: 0.62, label: 'UP TO 30+ YEARS', at: 4.2, barAt: 8.9 },
      { kind: 'metal', name: 'Metal & synthetic', len: 1.0, label: 'UP TO 50+ YEARS', at: 10.4, barAt: 13.0, gold: true },
    ],
  },
  HEAD: 92, ROW: 172, PAD: 26, SW: 118,
  // original shingle swatches, s px square, top-left (x, y)
  swatch(kind, x, y, s, key) {
    const R = RNG('tp-life', kind, String(key));
    ctx.save(); rrect(x, y, s, s, 20); ctx.clip();
    if (kind === '3tab') {   // flat 3-tab strips: even tabs, slots offset half a tab each course, flat grey
      ctx.fillStyle = '#5d636b'; ctx.fillRect(x, y, s, s);
      const ch = s / 4, tw = s / 3;
      for (let r = 0; r < 5; r++) {
        const cy = y + r * ch - ch * 0.3, off = (r % 2) * tw / 2;
        for (let k = -1; k < 4; k++) {
          const tx = x + k * tw + off, v = R.r(-10, 10);
          ctx.fillStyle = `rgb(${118 + v},${124 + v},${131 + v})`; ctx.fillRect(tx + 2, cy, tw - 4, ch - 4);
        }
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x, cy + ch - 5, s, 3);
      }
      for (let i = 0; i < 260; i++) { ctx.fillStyle = `rgba(255,255,255,${R.r(0.03, 0.12)})`; ctx.fillRect(x + R.f() * s, y + R.f() * s, 2, 2); }   // granules
    } else if (kind === 'dimensional') {   // laminated architectural: random tab widths, multi-tone, deep shadow band
      ctx.fillStyle = '#3b2c25'; ctx.fillRect(x, y, s, s);
      const ch = s / 4.2, tones = ['#8a6a57', '#6e5244', '#a5846c', '#5a4237', '#7d5e4c', '#94765f'];
      for (let r = 0; r < 6; r++) {
        const cy = y + r * ch - ch * 0.4; let tx = x - R.r(0, 30);
        while (tx < x + s) {
          const tw = R.r(16, 40); ctx.fillStyle = tones[R.i(0, tones.length - 1)];
          ctx.fillRect(tx + 1, cy, tw - 2, ch - 3 - R.r(0, 7)); tx += tw;
        }
        ctx.fillStyle = 'rgba(0,0,0,0.42)'; ctx.fillRect(x, cy + ch - 9, s, 7);
      }
      for (let i = 0; i < 300; i++) { ctx.fillStyle = `rgba(255,240,220,${R.r(0.03, 0.12)})`; ctx.fillRect(x + R.f() * s, y + R.f() * s, 2, 2); }
    } else {   // metal standing seam (upper-left) meets synthetic slate (lower-right) along a diagonal
      ctx.fillStyle = '#39414c'; ctx.fillRect(x, y, s, s);
      for (let k = 0; k < 6; k++) {
        const sx = x + k * s / 5;
        ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(sx, y, 3, s);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(sx + 3, y, 3, s);
      }
      const g = ctx.createLinearGradient(x, y, x + s, y + s); g.addColorStop(0.25, 'rgba(255,255,255,0)'); g.addColorStop(0.42, 'rgba(255,255,255,0.18)'); g.addColorStop(0.55, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(x, y, s, s);
      ctx.save(); ctx.beginPath(); ctx.moveTo(x + s * 1.02, y + s * 0.18); ctx.lineTo(x + s * 1.02, y + s * 1.02); ctx.lineTo(x + s * 0.18, y + s * 1.02); ctx.closePath(); ctx.clip();
      ctx.fillStyle = '#2b323b'; ctx.fillRect(x, y, s, s);
      const ch = s / 5, tw = s / 3.4;
      for (let r = 0; r < 6; r++) {
        const cy = y + r * ch, off = (r % 2) * tw / 2;
        for (let k = -1; k < 5; k++) { const v = R.r(-8, 8); ctx.fillStyle = `rgb(${84 + v},${94 + v},${108 + v})`; rrect(x + k * tw + off + 2, cy + 1, tw - 4, ch - 3, 3); ctx.fill(); }
      }
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + s * 1.02, y + s * 0.18); ctx.lineTo(x + s * 0.18, y + s * 1.02); ctx.stroke();
    }
    ctx.restore();
    rrect(x, y, s, s, 20); ctx.strokeStyle = 'rgba(248,248,244,0.22)'; ctx.lineWidth = 3; ctx.stroke();
  },
  draw(t, c, E) {
    const B = E.B, me = TPL.tpLifespan, rows = c.rows.slice(0, 4);
    const inn = spring(t, 210, 21), out = easeIn(seg(t, c.dur - 0.35, c.dur));
    if (inn <= 0.001) return;
    const grow = rows.map((r) => spring(t - r.at, 190, 22));
    const H = me.HEAD + grow.reduce((a, g) => a + g * me.ROW, 0) + me.PAD;
    const x0 = c.x, y0 = c.y - 60 * (1 - inn) - 40 * out, w = c.w;
    ctx.globalAlpha = clamp(inn * 1.6) * (1 - out);
    card(x0, y0, w, H, 34, B.card);
    text(c.kicker, x0 + 40, y0 + 62, 34, B.sky, { weight: 800, spacing: 7, shadow: false });
    ctx.fillStyle = hexA(B.ink, 0.14); ctx.fillRect(x0 + 40, y0 + me.HEAD - 8, w - 80, 2);
    ctx.save(); rrect(x0, y0, w, H, 34); ctx.clip();
    let ry = y0 + me.HEAD;
    rows.forEach((r, i) => {
      const k = grow[i]; if (k <= 0.001) return;
      const a = clamp(k * 1.8), sx = x0 + 34, sy = ry + (me.ROW - me.SW) / 2 - 4, dx = (1 - k) * -60;
      withAlpha(a, () => {
        at(sx + me.SW / 2 + dx, sy + me.SW / 2, 0.7 + 0.3 * k, 0, () => me.swatch(r.kind, -me.SW / 2, -me.SW / 2, me.SW, i));
        const tx = sx + me.SW + 30 + dx, bw = x0 + w - 38 - tx;
        const ns = fitSize(r.name, 46, bw, { weight: 900 });
        text(r.name, tx, ry + 52, ns, B.ink, { weight: 900, shadow: false });
        // the bar: track, then fill grows on barAt; label inside when it fits, else just after the fill
        const by = ry + 76, bh = 66;
        rrect(tx, by, bw, bh, bh / 2); ctx.fillStyle = hexA(B.ink, 0.1); ctx.fill();
        const u = easeOut(seg(t, r.barAt, r.barAt + 0.75)), fw = Math.max(bh, bw * r.len * u);
        if (u > 0) {
          const col = r.gold ? B.accent : r.len < 0.45 ? hexA(B.ink, 0.42) : B.sky;
          ctx.save(); if (r.gold) { ctx.shadowColor = hexA(B.accent, 0.6 * u); ctx.shadowBlur = 26; }
          rrect(tx, by, fw, bh, bh / 2); ctx.fillStyle = col; ctx.fill(); ctx.restore();
          const lk = spring(t - r.barAt - 0.45, 300, 18), LO = { weight: 900 };
          const ls = fitSize(r.label, 44, bw - 40, LO), lw = measure(r.label, ls, LO), inside = bw * r.len >= lw + 56;
          if (lk > 0.001) withAlpha(clamp(lk * 2), () => {
            const lx = inside ? tx + bw * r.len - 28 : tx + bw * r.len + 22, ly = by + bh / 2 + ls * 0.36;
            at(lx, ly - ls * 0.36, 0.7 + 0.3 * lk, 0, () => text(r.label, 0, ls * 0.36, ls, inside ? B.card : B.ink, { ...LO, align: inside ? 'right' : 'left', shadow: false }));
          });
          if (r.gold) {   // one shine across the winning bar
            const su = seg(t, r.barAt + 0.9, r.barAt + 1.5);
            if (su > 0 && su < 1) {
              ctx.save(); rrect(tx, by, fw, bh, bh / 2); ctx.clip();
              const gx = lerp(tx - 120, tx + fw + 120, easeIO(su)), g = ctx.createLinearGradient(gx - 70, 0, gx + 70, 0);
              g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
              ctx.transform(1, 0, -0.4, 1, 0, 0); ctx.fillStyle = g; ctx.fillRect(gx - 70 + 0.4 * by, by - 10, 140, bh + 20); ctx.restore();
            }
          }
        }
      });
      ry += me.ROW * k;
    });
    ctx.restore();
  },
};
