// deadline — a desk calendar: "OFFER ENDS" header, three pages riffle off and it lands on cfg.date ("OCT 31"),
// then a gold marker ring circles the day. cfg.mode 'countdown' riffles 8-7-6 -> "5" + "DAYS LEFT". ~3s.
TPL.deadline = {
  dur: 3.0,
  // ONLY real deadlines the client has confirmed (an actual end date / days actually left) — never a fake or rolling
  // "ends soon". mode: 'date' (cfg.date "OCT 31") | 'countdown' (cfg.days 5 + cfg.sub "DAYS LEFT").
  defaults: { mode: 'date', date: 'OCT 31', days: 5, head: 'OFFER ENDS', sub: 'DAYS LEFT', flips: 3, note: '', y: 560, beat: 0 },
  // a page sheet: square top (under the header), rounded bottom
  sheet(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.closePath(); },
  draw(t, c, E) {
    const B = E.B, tt = t - c.beat;
    const up = life(tt, c.dur - c.beat, 0.3, 200, 20); if (up <= 0.001) return;
    const cd = c.mode === 'countdown';
    const cw = 640, hh = 136, ph = 520, ch = hh + ph, x0 = (E.W - cw) / 2, R0 = 34;
    // what each page shows
    let month = '', fin;
    if (cd) fin = String(c.days);
    else { const m = String(c.date).trim().split(/\s+/); month = m.length > 1 ? m.slice(0, -1).join(' ') : ''; fin = m[m.length - 1]; }
    const n = Number(fin), K = Math.max(0, c.flips | 0), pages = [];
    for (let i = K; i >= 0; i--) pages.push(!i ? fin : !Number.isFinite(n) ? '' : cd ? String(n + i) : n - i >= 1 ? String(n - i) : '');
    const FS = 0.38, FG = 0.2, FD = 0.27;                  // flip start, gap, duration
    const land = FS + Math.max(0, K - 1) * FG + (K ? FD : 0);
    const bump = 0.035 * Math.sin(seg(tt, land, land + 0.28) * Math.PI);
    const y0 = c.y + (1 - up) * 140, hingeY = y0 + hh, cx = E.W / 2;
    ctx.globalAlpha = clamp(up * 1.5);
    // page content (in page coords: top of the page area = py)
    const NUM = { weight: 900 };
    const numS = (v) => fitSize(v || '00', 280, cw - 250, NUM);
    const layout = (v, py) => {
      const ns = numS(v), capN = ns * 0.72, capM = 64 * 0.72, capU = 54 * 0.72, g = 88;
      const blockH = capN + (cd ? g + capU : month ? g + capM : 0), top = py + (ph - blockH) / 2 + 4;
      const yM = top + capM, yN = cd || !month ? top + capN : yM + g + capN, yU = yN + g + capU;
      return { ns, capN, yM, yN, yU };
    };
    const drawPage = (v, py, shade) => {
      this.sheet(x0, py, cw, ph, R0); ctx.fillStyle = B.ink; ctx.fill();
      const L = layout(v, py);
      if (!cd && month) text(month, cx + 5, L.yM, 64, B.card, { align: 'center', weight: 900, spacing: 10, shadow: false, alpha: 0.55 });
      if (v) text(v, cx, L.yN, L.ns, B.card, { align: 'center', weight: 900, shadow: false });
      if (cd) text(c.sub, cx + 3, L.yU, 54, B.card, { align: 'center', weight: 900, spacing: 6, shadow: false });
      const g = ctx.createLinearGradient(0, py, 0, py + 26); g.addColorStop(0, 'rgba(0,10,30,0.16)'); g.addColorStop(1, 'rgba(0,10,30,0)');
      ctx.fillStyle = g; ctx.fillRect(x0, py, cw, 26);
      if (shade > 0) { this.sheet(x0, py, cw, ph, R0); ctx.fillStyle = `rgba(0,10,30,${shade})`; ctx.fill(); }
    };
    at(cx, y0 + ch / 2, 1 + bump, 0, () => at(-cx, -(y0 + ch / 2), 1, 0, () => {
      // stacked sheets peeking under the bottom edge, then the block itself
      rrect(x0 + 16, y0 + 40, cw - 32, ch - 18, R0); ctx.fillStyle = '#D9DBDF'; ctx.fill();
      rrect(x0 + 8, y0 + 30, cw - 16, ch - 18, R0); ctx.fillStyle = '#E8E9EA'; ctx.fill();
      card(x0, y0, cw, ch, R0, B.ink, { blur: 44, dy: 16 });
      // pages: the one underneath, then any page mid-flip on top (earlier flips sit higher in the stack)
      const started = []; for (let f = 0; f < K; f++) if (tt >= FS + f * FG) started.push(f);
      const m = started.length ? started[started.length - 1] : -1;
      drawPage(pages[m + 1], hingeY, 0);
      for (let f = m; f >= 0; f--) {
        const u = clamp((tt - FS - f * FG) / FD); if (u >= 1) continue;
        const th = Math.pow(u, 1.5) * Math.PI, cs = Math.cos(th), sn = Math.sin(th);
        if (cs > 0) {
          const sg = ctx.createLinearGradient(0, hingeY, 0, hingeY + ph * cs + 60);   // its shadow on the page below
          sg.addColorStop(0, `rgba(0,10,30,${0.28 * sn})`); sg.addColorStop(1, 'rgba(0,10,30,0)');
          ctx.fillStyle = sg; ctx.fillRect(x0, hingeY, cw, ph);
          ctx.save(); ctx.translate(cx, hingeY); ctx.scale(1 + 0.07 * sn, cs); ctx.translate(-cx, -hingeY);
          drawPage(pages[f], hingeY, 0.3 * sn); ctx.restore();
        } else {   // the back of the sheet going over the top, fading
          ctx.save(); ctx.globalAlpha *= clamp(1 + cs * 1.2); ctx.translate(cx, hingeY); ctx.scale(1 + 0.07 * sn, cs); ctx.translate(-cx, -hingeY);
          this.sheet(x0, hingeY, cw, ph, R0); ctx.fillStyle = '#D6D8DC'; ctx.fill(); ctx.restore();
        }
      }
      // header strip + binder rings
      ctx.save(); rrect(x0, y0, cw, ch, R0); ctx.clip(); ctx.fillStyle = B.card; ctx.fillRect(x0, y0, cw, hh); ctx.restore();
      text(c.head, cx + 3, y0 + hh / 2 + 22, fitSize(c.head, 58, cw - 80, { weight: 900, spacing: 6 }), B.ink, { align: 'center', weight: 900, spacing: 6, shadow: false });
      for (const rx of [x0 + 120, x0 + cw - 120]) {
        circle(rx, y0 + 26, 13, 'rgba(0,0,0,0.45)');
        rrect(rx - 11, y0 - 30, 22, 62, 11); ctx.fillStyle = '#3A4252'; ctx.fill();
        rrect(rx - 6, y0 - 24, 6, 46, 3); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fill();
      }
      // the gold marker ring around the final day/number
      const ru = easeOut(seg(tt, land + 0.12, land + 0.62));
      if (ru > 0 && !(K && tt < land)) {
        const L = layout(pages[K], hingeY), nw = measure(pages[K] || '00', L.ns, NUM);
        const ex = cx, ey = L.yN - L.capN / 2, rx = Math.min((nw / 2 + 12) * 1.36, cw / 2 - 30), ry = (L.capN / 2 + 10) * 1.36, P = [];
        for (let i = 0; i <= 90; i++) {
          const k = i / 90, a = -2.2 + k * Math.PI * 2 * 1.1, wob = 1 + 0.02 * Math.sin(3 * a + 1) + 0.045 * k;
          P.push([ex + Math.cos(a) * rx * wob, ey + Math.sin(a) * ry * wob]);
        }
        const Q = partial(P, ru), glow = Math.exp(-Math.max(0, tt - land - 0.62) * 3);
        line(Q, B.card, 22); line(Q, B.accent, 13, { shadow: glow > 0.05 });
      }
    }));
    if (c.note) {
      const na = spring(tt - land - 0.5, 240, 20);
      if (na > 0.001) text(c.note, cx, y0 + ch + 110 + (1 - na) * 30, fitSize(c.note, 56, 940, { weight: 900 }), '#FFFFFF', { align: 'center', weight: 900, stroke: 10, alpha: clamp(na) });
    }
  },
};
