// ctaGlass — the house closing CTA, as measured on AMC V4 / Rob-Art V4 (frosted glass card: "click" / "Get Quote" in a
// heavy italic orange→yellow gradient / "below") and Vistaguard V2 (style 'caps': CLICK / "GET QUOTE" / BELOW in heavy
// white caps with a red arrow bobbing under it, no card). Scales + fades in over 0.35 s, out over the last 0.25 s.
TPL.ctaGlass = {
  dur: 3.0,
  defaults: {
    style: 'glass', y: 0.56, w: 720, h: 360, top: 'click', mid: 'Get Quote', bot: 'below',
    grad: ['#EC4C0C', '#FCFC74'], arrow: '#E8282B',
    sans: '"Inter Display", "Inter", "Helvetica Neue", Arial, sans-serif',
  },
  draw(t, c, E) {
    const u = easeOut(t / 0.35), a = u * (1 - easeOut((t - (c.dur - 0.25)) / 0.25));
    if (a <= 0.001) return;
    const cx = E.W / 2, cy = E.H * c.y, s = 0.9 + 0.1 * u;
    ctx.globalAlpha = a;
    at(cx, cy, s, 0, () => {
      if (c.style === 'caps') {
        const H1 = { weight: 900, font: c.sans };
        text(c.top.toUpperCase(), 0, -96, 74, '#FFFFFF', { ...H1, align: 'center', blur: 24 });
        text('"' + c.mid.toUpperCase() + '"', 0, 14, fitSize('"' + c.mid.toUpperCase() + '"', 112, 940, H1), '#FFFFFF', { ...H1, align: 'center', blur: 24 });
        text(c.bot.toUpperCase(), 0, 100, 74, '#FFFFFF', { ...H1, align: 'center', blur: 24 });
        const bob = Math.sin(t * Math.PI * 2.4) * 14;
        arrowDown(0, 250 + bob, 120, c.arrow);
        return;
      }
      const w = c.w, h = c.h, x = -w / 2, y = -h / 2;
      // glass: a translucent smoked fill, a soft top sheen and a thin bright rim (no backdrop access, so it is faked)
      card(x, y, w, h, 56, 'rgba(58,60,66,0.46)', { blur: 50, dy: 18, shadowColor: 'rgba(0,0,0,0.35)' });
      ctx.save(); rrect(x, y, w, h, 56); ctx.clip();
      const sh = ctx.createLinearGradient(0, y, 0, y + h); sh.addColorStop(0, 'rgba(255,255,255,0.26)'); sh.addColorStop(0.45, 'rgba(255,255,255,0.05)'); sh.addColorStop(1, 'rgba(255,255,255,0.0)');
      ctx.fillStyle = sh; ctx.fillRect(x, y, w, h); ctx.restore();
      ctx.save(); rrect(x + 1.5, y + 1.5, w - 3, h - 3, 55); ctx.strokeStyle = 'rgba(255,255,255,0.38)'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      const L = { weight: 400, font: c.sans }, Hd = { weight: 900, font: c.sans, italic: true };
      text(c.top, 0, -h * 0.2, 64, '#FFFFFF', { ...L, align: 'center', blur: 14 });
      const ms = fitSize(c.mid, 124, w - 70, Hd), mw = measure(c.mid, ms, Hd);
      const g = ctx.createLinearGradient(-mw / 2, 0, mw / 2, 0); g.addColorStop(0, c.grad[0]); g.addColorStop(1, c.grad[1]);
      text(c.mid, 0, h * 0.1, ms, g, { ...Hd, align: 'center', blur: 16, shadowColor: 'rgba(0,0,0,0.45)' });
      text(c.bot, 0, h * 0.34, 64, '#FFFFFF', { ...L, align: 'center', blur: 14 });
    });
  },
};

// logoPill — the house brand moment (Rob-Art V4 "Rob-Art Design LLC" on a brushed-metal pill; AMC's logo over job
// footage): the client's name in white serif on a smoked-metal pill, or cfg.img (a key in spec.images) — the real logo —
// on a light pill. Pops in on a spring, holds, fades.
TPL.logoPill = {
  dur: 2.4,
  defaults: { name: '', img: null, y: 0.5, size: 76, font: '"Playfair Display", "Liberation Serif", Georgia, serif', pad: 64, imgH: 150 },
  draw(t, c, E) {
    const k = spring(t, 190, 20), a = clamp(t / 0.2) * (1 - easeOut((t - (c.dur - 0.3)) / 0.3));
    if (a <= 0.001) return;
    ctx.globalAlpha = a;
    const im = c.img ? IMGS[c.img] : null;
    const F = { weight: 600, font: c.font };
    let w, h;
    if (im) { h = c.imgH + c.pad * 0.9; w = Math.min(960, im.width * (c.imgH / im.height) + c.pad * 2); }
    else { const fs = fitSize(c.name, c.size, 860, F); w = measure(c.name, fs, F) + c.pad * 2; h = fs * 1.9; c = { ...c, size: fs }; }
    at(E.W / 2, E.H * c.y, 0.86 + 0.14 * k, 0, () => {
      const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      if (im) { g.addColorStop(0, 'rgba(255,255,255,0.96)'); g.addColorStop(1, 'rgba(232,234,238,0.96)'); }
      else { g.addColorStop(0, 'rgba(118,122,130,0.72)'); g.addColorStop(0.5, 'rgba(70,73,80,0.72)'); g.addColorStop(1, 'rgba(98,102,110,0.72)'); }
      card(-w / 2, -h / 2, w, h, h / 2, g, { blur: 40, dy: 14, shadowColor: 'rgba(0,0,0,0.4)', stroke: 'rgba(255,255,255,0.45)', lw: 3 });
      if (im) { const iw = im.width * (c.imgH / im.height), ih = c.imgH; const s = Math.min(1, (w - c.pad * 2) / iw); ctx.drawImage(im, -iw * s / 2, -ih * s / 2, iw * s, ih * s); }
      else text(c.name, 0, c.size * 0.34, c.size, '#FFFFFF', { ...F, align: 'center', blur: 10, shadowColor: 'rgba(0,0,0,0.5)' });
    });
  },
};
