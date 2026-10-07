// name-lower-third — presenter super for on-camera ads: a gold accent bar grows, a navy card wipes out of it, the name
// slides in, the title follows; holds still, then wipes back into the bar and the bar closes. "George" /
// "Owner, Frontline Services". Left-aligned at cfg.x (or cfg.align 'right'). ~4s — stretch the hold with dur.
TPL.nameLowerThird = {
  dur: 4.0,
  defaults: { name: 'George', title: 'Owner, Frontline Services', x: 60, y: 1170, align: 'left', beat: 0.1 },
  // card with square left side (it sits against the bar) and rounded right corners
  shape(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r); ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r); ctx.lineTo(x, y + h); ctx.closePath(); },
  draw(t, c, E) {
    const B = E.B, tt = t - c.beat; if (tt <= 0) return;
    const NO = { weight: 900 }, TO = { weight: 600 };
    const ns = fitSize(c.name, 92, 800, NO), ts = fitSize(c.title, 46, 800, TO);
    const nw = measure(c.name, ns, NO), tw = measure(c.title, ts, TO);
    const BAR = 16, PX = 46, ch = 50 + ns * 0.73 + 34 + ts * 0.73 + 50, cw = Math.max(nw, tw) + PX * 2;
    const right = c.align === 'right', bx = right ? E.W - c.x - BAR : c.x, y = c.y;
    const outT = c.dur - 0.55;
    const barK = spring(tt, 260, 21) * (1 - easeIn(seg(t, c.dur - 0.22, c.dur)));
    const wipe = spring(tt - 0.16, 190, 22) * (1 - easeIn(seg(t, outT, outT + 0.32)));
    const nk = spring(tt - 0.32, 220, 20), tk = spring(tt - 0.5, 220, 20);
    if (wipe > 0.002) {
      ctx.save();
      if (right) { ctx.translate(E.W, 0); ctx.scale(-1, 1); }   // mirror the geometry; text is un-mirrored below
      const cx0 = (right ? c.x : bx) + BAR, w = cw * wipe;
      ctx.save(); ctx.shadowColor = 'rgba(0,10,30,0.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
      this.shape(cx0, y, w, ch, 30); ctx.fillStyle = B.card; ctx.fill(); ctx.restore();
      this.shape(cx0, y, w, ch, 30); ctx.clip();
      if (right) { ctx.translate(E.W, 0); ctx.scale(-1, 1); }
      const tx = right ? E.W - c.x - BAR - PX : cx0 + PX, al = right ? 'right' : 'left', dir = right ? 1 : -1;
      text(c.name, tx + dir * (1 - nk) * 60, y + 50 + ns * 0.73, ns, B.ink, { ...NO, align: al, shadow: false, alpha: clamp(nk * 1.5) });
      text(c.title, tx, y + 50 + ns * 0.73 + 34 + ts * 0.73 + (1 - tk) * 30, ts, B.sky, { ...TO, align: al, shadow: false, alpha: clamp(tk * 1.5) });
      ctx.restore();
    }
    if (barK > 0.002) {
      const bh = ch * barK;
      ctx.save(); ctx.shadowColor = 'rgba(0,10,30,0.45)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
      rrect(bx, y + (ch - bh) / 2, BAR, bh, 7); ctx.fillStyle = B.accent; ctx.fill(); ctx.restore();
    }
  },
};
