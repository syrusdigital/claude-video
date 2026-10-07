// scene-kit — shared look for the full-screen explainer scenes (gfx/tpl/scene-*.js, TPL.scene*).
// One flat-vector illustration language: soft geometric shapes, 2-3 tone shading, rounded corners, thin (<=6px) lines,
// navy backdrop with slow drifting shapes, a camera that is always gently moving, and captions in the safe band
// y 300-1450 (editors put their own subtitles below 1450). Helpers only run inside draw(), so load order does not matter.
// Usage inside a scene:  const K = TPL.sceneKit;  K.bg(t, E);  K.cam(t, c.dur, () => { ...illustration... });  K.caption(...)
TPL.sceneKit = {
  dur: 3,
  defaults: {},
  draw(t, c, E) { TPL.sceneKit.bg(t, E); },   // not a scene on its own; draws the backdrop if someone places it

  // ---------------------------------------------------------------- colour
  rgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; },
  mix(a, b, u) {
    const A = this.rgb(a), B = this.rgb(b), k = clamp(u);
    return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join('');
  },
  shade(h, k) { return k >= 0 ? this.mix(h, '#ffffff', k) : this.mix(h, '#000000', -k); },
  a(h, al) { return hexA(h, clamp(al)); },
  // neutral material palette for illustrations (brand colours come from E.B)
  P: {
    paint: '#D6E0EA', paintWarm: '#E9E1D6', white: '#F4F6F8', porcelain: '#FBFBF8', chrome: '#B7C2CE', chromeDark: '#7D8A99',
    wood: '#C89B6D', woodDark: '#9C7350', woodLight: '#DDB98F', oak: '#B98A5E', tileOld: '#D8C9A8', tileOldBand: '#B98F86',
    concrete: '#9AA3AD', concreteDark: '#7E8792', stud: '#D9B27C', copper: '#D9824B', plant: '#5FA37A', plantDark: '#3F7D5A',
    stone: '#E8E6E1', vein: '#B9C1CB', charcoal: '#2E3A4B', slate: '#46566B', warm: '#FFD99A', glass: '#9FD8FF', red: '#E4574E',
  },

  // ---------------------------------------------------------------- backdrop + camera
  // full-frame backdrop: deep navy gradient, a soft central glow and slow-drifting rounded shapes (parallax layer)
  bg(t, E, o = {}) {
    const K = this, B = E.B;
    if (o.light) {
      const g = ctx.createLinearGradient(0, 0, 0, E.H); g.addColorStop(0, o.top ?? '#BFE3FF'); g.addColorStop(1, o.bottom ?? '#F8F8F4');
      ctx.fillStyle = g; ctx.fillRect(0, 0, E.W, E.H);
    } else {
      const g = ctx.createLinearGradient(0, 0, 0, E.H); g.addColorStop(0, K.mix(B.dark, B.card, 0.38)); g.addColorStop(0.55, K.mix(B.dark, B.card, 0.16)); g.addColorStop(1, B.dark);
      ctx.fillStyle = g; ctx.fillRect(0, 0, E.W, E.H);
      const r = ctx.createRadialGradient(540, o.glowY ?? 920, 40, 540, o.glowY ?? 920, 900);
      r.addColorStop(0, K.a(B.card, 0.55)); r.addColorStop(1, K.a(B.card, 0)); ctx.fillStyle = r; ctx.fillRect(0, 0, E.W, E.H);
    }
    // drifting shapes: big, soft, low contrast; they move slower than the camera so the frame always breathes
    const col = o.light ? '#FFFFFF' : B.sky, al = o.light ? 0.35 : (o.shapeAlpha ?? 0.05);
    const S = [[120, 330, 260, 0.0], [960, 560, 200, 1.7], [880, 1560, 320, 3.1], [160, 1500, 180, 4.4], [560, 160, 150, 5.2]];
    S.forEach(([x, y, r, ph], i) => {
      const dx = Math.sin(t * 0.21 + ph) * 26 - t * (i % 2 ? 4 : -4), dy = Math.cos(t * 0.17 + ph) * 22;
      ctx.save(); ctx.globalAlpha *= al * (i === 4 ? 0.7 : 1); ctx.fillStyle = col;
      if (i % 2) { ctx.translate(x + dx, y + dy); ctx.rotate(0.3 + t * 0.02 * (i - 2)); rrect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6, r * 0.42); ctx.fill(); }
      else { circle(x + dx, y + dy, r, col); }
      ctx.restore();
    });
  },
  // slow push-in + sway; everything drawn inside fn moves with the camera
  cam(t, dur, fn, o = {}) {
    const z = (o.z0 ?? 1.0) + ((o.z1 ?? 1.05) - (o.z0 ?? 1.0)) * easeIO(t / dur * 0.85 + 0.075) , fx = o.fx ?? 540, fy = o.fy ?? 980;
    const dx = Math.sin(t * 0.35) * (o.sway ?? 7), dy = Math.cos(t * 0.27) * (o.sway ?? 7) * 0.7;
    ctx.save(); ctx.translate(fx + dx + (o.x ?? 0), fy + dy + (o.y ?? 0)); ctx.scale(z, z); ctx.translate(-fx, -fy); fn(); ctx.restore();
  },

  // ---------------------------------------------------------------- motion
  pop(t, t0, k = 240, d = 19) { return spring(t - t0, k, d); },
  out(t, t1, len = 0.3) { return t1 == null ? 1 : 1 - easeIn((t - t1) / len); },
  // stays between t0 and t1 (null = forever): springs in, eases out
  inout(t, t0, t1, k = 240, d = 19, len = 0.3) { return this.pop(t, t0, k, d) * this.out(t, t1, len); },

  // ---------------------------------------------------------------- type
  wrap(str, size, maxW, o = {}) {
    const words = String(str).split(/\s+/).filter(Boolean), lines = []; let cur = [];
    for (const w of words) {
      const test = cur.concat(w).join(' ').replace(/[*~]/g, '');
      if (cur.length && measure(test, size, o) > maxW) { lines.push(cur); cur = [w]; } else cur.push(w);
    }
    if (cur.length) lines.push(cur);
    return lines;
  },
  // caption block: words pop up one after another (stagger), *word* = accent (gold, payoff only), ~word~ = sky.
  // o: size(64) maxW(920) lh(1.12) align('center') x(540) kicker stagger(0.06) t1(exit time) color weight shadow
  caption(t, t0, str, y, E, o = {}) {
    if (t < t0 || !str) return y;
    const K = this, size = o.size ?? 64, wt = o.weight ?? 900, maxW = o.maxW ?? 920, lh = size * (o.lh ?? 1.12);
    const exitA = K.out(t, o.t1, 0.28); if (exitA <= 0.001) return y;
    const exitY = o.t1 == null ? 0 : -18 * easeIn((t - o.t1) / 0.28);
    let yy = y + exitY;
    if (o.kicker) {
      const ka = K.pop(t, t0 - 0.05, 220, 22);
      text(o.kicker, o.x ?? 540, yy, o.kickerSize ?? 40, o.kickerColor ?? E.B.sky, { align: o.align ?? 'center', weight: 800, spacing: 6, shadow: false, alpha: clamp(ka) * exitA });
      yy += (o.kickerSize ?? 40) * 0.6 + size * 0.95;
    }
    const lines = K.wrap(str, size, maxW, { weight: wt });
    let wi = 0;
    lines.forEach((ws, li) => {
      const plain = ws.map((w) => w.replace(/[*~]/g, ''));
      const full = measure(plain.join(' '), size, { weight: wt }), sp = measure(' ', size, { weight: wt });
      const al = o.align ?? 'center', x0 = al === 'center' ? (o.x ?? 540) - full / 2 : al === 'right' ? (o.x ?? 540) - full : (o.x ?? 540);
      let x = x0;
      ws.forEach((w, i) => {
        const p = K.pop(t, t0 + wi * (o.stagger ?? 0.06), 260, 20); wi++;
        const gold = /^\*.*\*[.,!?]?$/.test(w) || o.gold, sky = /^~.*~[.,!?]?$/.test(w);
        const col = gold ? E.B.accent : sky ? E.B.sky : (o.color ?? E.B.ink);
        if (p > 0.001) text(plain[i], x, yy + li * lh + (1 - clamp(p)) * 26, size, col, { weight: wt, shadow: o.shadow ?? false, alpha: clamp(p * 1.6) * exitA, stroke: o.stroke, strokeColor: o.strokeColor });
        x += measure(plain[i], size, { weight: wt }) + sp;
      });
    });
    return yy + (lines.length - 1) * lh;
  },
  // pill label. a = appear progress (spring). o: size(52) align('center'|'left'|'right') fill dot(colour) num(string) color pad
  chip(x, y, str, a, E, o = {}) {
    if (a <= 0.001 || !str) return 0;
    const K = this, size = o.size ?? 52, wt = o.weight ?? 800, pad = o.pad ?? size * 0.62, h = size * 1.62;
    const lead = o.num != null ? h * 0.78 + size * 0.3 : o.dot ? size * 0.62 : 0;
    const w = measure(str, size, { weight: wt }) + pad * 2 + lead;
    const x0 = (o.align ?? 'center') === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    const s = 0.86 + 0.14 * a;
    ctx.save(); ctx.globalAlpha *= clamp(a * 1.5);
    ctx.translate(x0 + w / 2, y); ctx.scale(s, s); ctx.translate(-(x0 + w / 2), -y);
    card(x0, y - h / 2, w, h, h / 2, o.fill ?? E.B.card, { blur: 30, dy: 10, shadowColor: 'rgba(0,8,24,0.45)', stroke: o.stroke, lw: o.lw ?? 3 });
    let tx = x0 + pad;
    if (o.num != null) {
      const r = h * 0.36; circle(x0 + h * 0.12 + r + 4, y, r, o.numFill ?? E.B.sky);
      text(String(o.num), x0 + h * 0.12 + r + 4, y + r * 0.36, r * 1.0, o.numColor ?? E.B.dark, { align: 'center', weight: 900, shadow: false });
      tx = x0 + h * 0.12 + 2 * r + 4 + size * 0.36;
    } else if (o.dot) { circle(x0 + pad + size * 0.18, y, size * 0.18, o.dot); tx += lead; }
    text(str, tx, y + size * 0.36, size, o.color ?? E.B.ink, { weight: wt, shadow: false });
    ctx.restore();
    return w;
  },
  // thin leader line with a dot at its anchor, drawn on with frac
  leader(P, frac, color, lw = 4) {
    if (frac <= 0) return;
    circle(P[0][0], P[0][1], 9 * clamp(frac * 3), color);
    line(partial(P, frac), color, lw);
  },

  // ---------------------------------------------------------------- shapes
  // 2-3 tone flat block: base fill, darker base band, light top lip. o: shade(-0.14) band(0.16 of h) hl(0.22) shadow side('l'|'r')
  box(x, y, w, h, r, base, o = {}) {
    const K = this;
    if (w <= 0 || h <= 0) return;
    ctx.save();
    if (o.shadow) { ctx.shadowColor = o.shadowColor ?? 'rgba(0,10,30,0.35)'; ctx.shadowBlur = o.blur ?? 28; ctx.shadowOffsetY = o.dy ?? 10; }
    rrect(x, y, w, h, r); ctx.fillStyle = base; ctx.fill(); ctx.restore();
    ctx.save(); rrect(x, y, w, h, r); ctx.clip();
    const band = o.band ?? 0.16;
    if (band > 0) { ctx.fillStyle = K.shade(base, o.shade ?? -0.14); ctx.fillRect(x, y + h * (1 - band), w, h * band + 1); }
    if (o.side) { ctx.fillStyle = K.shade(base, (o.shade ?? -0.14) * 0.6); ctx.fillRect(o.side === 'r' ? x + w * 0.86 : x, y, w * 0.14, h); }
    if ((o.hl ?? 0.22) > 0 && h > 14) { ctx.fillStyle = K.shade(base, o.hl ?? 0.22); ctx.fillRect(x, y, w, Math.min(o.hlH ?? 7, h * 0.12)); }
    ctx.restore();
  },
  poly(P, fill) { ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (const p of P.slice(1)) ctx.lineTo(p[0], p[1]); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); },
  ellipse(x, y, rx, ry, fill) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), 0, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); },
  // soft contact shadow under an object
  contact(x, y, w, al = 0.22) { ctx.save(); ctx.globalAlpha *= al; this.ellipse(x, y, w / 2, Math.max(4, w * 0.05), '#061024'); ctx.restore(); },
  glow(x, y, r, color, al = 0.6) {
    if (al <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, this.a(color, al)); g.addColorStop(1, this.a(color, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  },
  // a light cone from a fixture downward
  cone(x, y, wTop, wBot, h, color, al) {
    if (al <= 0) return;
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, this.a(color, al)); g.addColorStop(1, this.a(color, 0));
    ctx.beginPath(); ctx.moveTo(x - wTop / 2, y); ctx.lineTo(x + wTop / 2, y); ctx.lineTo(x + wBot / 2, y + h); ctx.lineTo(x - wBot / 2, y + h); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
  },
  // diagonal sheen band sweeping across a clip region (call inside a clip). u: 0..1 progress
  sheen(x, y, w, h, u, al = 0.35) {
    if (u <= 0 || u >= 1) return;
    const cx = x - w * 0.4 + (w * 1.8) * u, bw = w * 0.22;
    ctx.save(); ctx.globalAlpha *= al; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.moveTo(cx, y - 10); ctx.lineTo(cx + bw, y - 10); ctx.lineTo(cx + bw - h * 0.5, y + h + 10); ctx.lineTo(cx - h * 0.5, y + h + 10); ctx.closePath(); ctx.fill();
    ctx.globalAlpha *= 0.5; ctx.beginPath(); ctx.moveTo(cx + bw * 1.3, y - 10); ctx.lineTo(cx + bw * 1.6, y - 10); ctx.lineTo(cx + bw * 1.6 - h * 0.5, y + h + 10); ctx.lineTo(cx + bw * 1.3 - h * 0.5, y + h + 10); ctx.closePath(); ctx.fill();
    ctx.restore();
  },

  // ---------------------------------------------------------------- room diorama (one-point cutaway box)
  // returns geometry. Box outer rect X,Y,Wd,Ht; th = cut-wall thickness; s = back-wall scale toward the vanishing point.
  roomGeo(X = 70, Y = 600, Wd = 940, Ht = 800, o = {}) {
    const th = o.th ?? 34, s = o.s ?? 0.85, cx0 = X + th, cy0 = Y + th, cw = Wd - th * 2, ch = Ht - th * 2;
    const vx = cx0 + cw / 2, vy = cy0 + ch * (o.vp ?? 0.34);
    const bx = vx + (cx0 - vx) * s, by = vy + (cy0 - vy) * s, bw = cw * s, bh = ch * s;
    return { X, Y, Wd, Ht, th, cx0, cy0, cw, ch, vx, vy, bx, by, bw, bh, fy: by + bh, fx0: cx0, fx1: cx0 + cw, fyF: cy0 + ch };
  },
  // shell: cut slab, ceiling, side walls, floor, back wall. o: wall floor side cut floorFn(g) wallFn(g)
  room(g, E, o = {}) {
    const K = this, wall = o.wall ?? K.P.paint, cut = o.cut ?? K.mix(E.B.card, E.B.dark, 0.25);
    // ground shadow + cut slab
    ctx.save(); ctx.globalAlpha *= 0.5; K.ellipse(g.X + g.Wd / 2, g.Y + g.Ht + 26, g.Wd * 0.48, 26, '#020812'); ctx.restore();
    card(g.X, g.Y, g.Wd, g.Ht, 30, cut, { blur: 60, dy: 24, shadowColor: 'rgba(0,6,20,0.55)' });
    ctx.save(); rrect(g.X, g.Y, g.Wd, g.Ht, 30); ctx.clip();
    ctx.fillStyle = K.shade(cut, 0.1); ctx.fillRect(g.X, g.Y, g.Wd, 6);
    ctx.restore();
    const C = { tl: [g.cx0, g.cy0], tr: [g.cx0 + g.cw, g.cy0], br: [g.cx0 + g.cw, g.cy0 + g.ch], bl: [g.cx0, g.cy0 + g.ch] };
    const Bk = { tl: [g.bx, g.by], tr: [g.bx + g.bw, g.by], br: [g.bx + g.bw, g.by + g.bh], bl: [g.bx, g.by + g.bh] };
    ctx.save(); rrect(g.cx0, g.cy0, g.cw, g.ch, 10); ctx.clip();
    K.poly([C.tl, C.tr, Bk.tr, Bk.tl], o.ceil ?? K.shade(wall, -0.2));
    K.poly([C.tl, Bk.tl, Bk.bl, C.bl], o.side ?? K.shade(wall, -0.1));
    K.poly([C.tr, Bk.tr, Bk.br, C.br], o.side ?? K.shade(wall, -0.13));
    K.poly([Bk.bl, Bk.br, C.br, C.bl], o.floor ?? K.P.wood);
    if (o.floorFn) o.floorFn(g, [Bk.bl, Bk.br, C.br, C.bl]);
    ctx.fillStyle = wall; ctx.fillRect(g.bx, g.by, g.bw, g.bh);
    if (o.wallFn) o.wallFn(g);
    // baseboard + soft corner shading
    ctx.fillStyle = K.shade(wall, -0.05); ctx.fillRect(g.bx, g.fy - 14, g.bw, 14);
    ctx.restore();
  },
  // planks on a floor quad (perspective-correct enough for flat illustration)
  planks(Q, base, n = 9, o = {}) {
    const K = this, [bl, br, fr, fl] = Q;
    ctx.save(); K.poly(Q, base); ctx.beginPath(); ctx.moveTo(...bl); ctx.lineTo(...br); ctx.lineTo(...fr); ctx.lineTo(...fl); ctx.closePath(); ctx.clip();
    ctx.strokeStyle = K.shade(base, o.lineShade ?? -0.16); ctx.lineWidth = 3;
    for (let i = 1; i < n; i++) { const u = i / n; ctx.beginPath(); ctx.moveTo(lerp(bl[0], br[0], u), bl[1]); ctx.lineTo(lerp(fl[0], fr[0], u), fl[1]); ctx.stroke(); }
    if (o.rows) for (let j = 1; j < o.rows; j++) { const v = Math.pow(j / o.rows, 1.25), y = lerp(bl[1], fl[1], v); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(2000, y); ctx.stroke(); }
    ctx.restore();
  },

  // ---------------------------------------------------------------- objects shared by several scenes
  // wall clock, hrs = hour as float (8.5 = 8:30). draws centred at x,y radius r
  clock(x, y, r, hrs, E, o = {}) {
    const K = this;
    circle(x + 3, y + 6, r + 6, 'rgba(0,10,30,0.18)');
    circle(x, y, r + 6, o.rim ?? E.B.card); circle(x, y, r - 2, o.face ?? '#FBFBF8');
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const r0 = i % 3 ? r * 0.8 : r * 0.72; line([[x + Math.sin(a) * r0, y - Math.cos(a) * r0], [x + Math.sin(a) * r * 0.88, y - Math.cos(a) * r * 0.88]], K.shade(E.B.card, 0.2), i % 3 ? 3 : 5); }
    const ha = (hrs % 12) / 12 * Math.PI * 2, ma = (hrs % 1) * Math.PI * 2;
    line([[x, y], [x + Math.sin(ha) * r * 0.48, y - Math.cos(ha) * r * 0.48]], E.B.card, 6);
    line([[x, y], [x + Math.sin(ma) * r * 0.72, y - Math.cos(ma) * r * 0.72]], o.hand ?? E.B.card, 4);
    circle(x, y, 6, o.pin ?? E.B.sky);
  },
  plant(x, y, s = 1, sway = 0) {
    const K = this;
    at(x, y, s, 0, () => {
      [[-0.5, 60, 0], [0.25, 70, 1], [-0.15, 82, 2], [0.6, 56, 3], [-0.85, 48, 4]].forEach(([a, L, i]) => {
        at(0, -40, 1, a + Math.sin(sway + i) * 0.03, () => { ctx.beginPath(); ctx.ellipse(0, -L / 2, 15, L / 2, 0, 0, Math.PI * 2); ctx.fillStyle = i % 2 ? K.P.plantDark : K.P.plant; ctx.fill(); });
      });
      K.box(-34, -46, 68, 54, 12, '#E8E4DC', { band: 0.25 });
    });
  },

  // ---------------------------------------------------------------- icons (centred at 0,0, ~s px tall)
  icon: {
    house(s, body, roof, door) {
      const K = TPL.sceneKit;
      K.poly([[-s * 0.5, -s * 0.06], [0, -s * 0.5], [s * 0.5, -s * 0.06]], roof);
      K.box(-s * 0.38, -s * 0.1, s * 0.76, s * 0.56, s * 0.06, body, { band: 0.2, hl: 0 });
      rrect(-s * 0.09, s * 0.12, s * 0.18, s * 0.34, s * 0.04); ctx.fillStyle = door; ctx.fill();
    },
    doc(s, paper, ink) {
      const K = TPL.sceneKit;
      K.box(-s * 0.36, -s * 0.48, s * 0.72, s * 0.96, s * 0.08, paper, { band: 0.08 });
      for (let i = 0; i < 4; i++) { rrect(-s * 0.22, -s * 0.26 + i * s * 0.16, i === 3 ? s * 0.26 : s * 0.44, s * 0.06, s * 0.03); ctx.fillStyle = ink; ctx.fill(); }
    },
    swatches(s, cols) {
      const K = TPL.sceneKit;
      cols.forEach((c0, i) => at(-s * 0.1 + i * s * 0.04, s * 0.38, 1, (i - 1) * 0.34, () => { K.box(-s * 0.16, -s * 0.82, s * 0.32, s * 0.84, s * 0.06, c0, { band: 0.12 }); circle(0, -s * 0.12, s * 0.05, 'rgba(255,255,255,0.7)'); }));
    },
    tools(s, metal, handle) {
      const K = TPL.sceneKit;
      at(0, 0, 1, -0.75, () => { rrect(-s * 0.06, -s * 0.1, s * 0.12, s * 0.58, s * 0.05); ctx.fillStyle = handle; ctx.fill(); rrect(-s * 0.24, -s * 0.36, s * 0.48, s * 0.2, s * 0.06); ctx.fillStyle = metal; ctx.fill(); });
      at(0, 0, 1, 0.75, () => {
        rrect(-s * 0.06, -s * 0.2, s * 0.12, s * 0.66, s * 0.06); ctx.fillStyle = metal; ctx.fill();
        circle(0, -s * 0.34, s * 0.16, metal); circle(0, -s * 0.42, s * 0.08, 'rgba(0,0,0,0)'); ctx.save(); ctx.globalCompositeOperation = 'destination-out'; rrect(-s * 0.05, -s * 0.56, s * 0.1, s * 0.2, s * 0.03); ctx.fill(); ctx.restore();
      });
    },
    key(s, col) {
      circle(-s * 0.2, -s * 0.2, s * 0.24, col); ctx.save(); ctx.globalCompositeOperation = 'destination-out'; circle(-s * 0.2, -s * 0.2, s * 0.09, '#000'); ctx.restore();
      at(0, 0, 1, Math.PI / 4, () => { rrect(-s * 0.06, -s * 0.06, s * 0.62, s * 0.12, s * 0.05); ctx.fillStyle = col; ctx.fill(); rrect(s * 0.36, s * 0.0, s * 0.08, s * 0.16, s * 0.03); ctx.fill(); rrect(s * 0.48, s * 0.0, s * 0.08, s * 0.12, s * 0.03); ctx.fill(); });
    },
    wrench(s, col) {
      at(0, 0, 1, -0.78, () => {
        rrect(-s * 0.07, -s * 0.2, s * 0.14, s * 0.66, s * 0.07); ctx.fillStyle = col; ctx.fill();
        circle(0, -s * 0.3, s * 0.2, col);
        ctx.save(); ctx.globalCompositeOperation = 'destination-out'; rrect(-s * 0.075, -s * 0.56, s * 0.15, s * 0.28, s * 0.03); ctx.fill(); ctx.restore();
      });
    },
    tile(s, col) { for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { rrect(-s * 0.4 + i * s * 0.42, -s * 0.4 + j * s * 0.42, s * 0.38, s * 0.38, s * 0.07); ctx.fillStyle = col; ctx.fill(); } },
    bolt(s, col) { TPL.sceneKit.poly([[s * 0.08, -s * 0.5], [-s * 0.3, s * 0.06], [-s * 0.02, s * 0.06], [-s * 0.1, s * 0.5], [s * 0.3, -s * 0.08], [s * 0.02, -s * 0.08]], col); },
    hardhat(s, col, band) {
      ctx.beginPath(); ctx.arc(0, s * 0.12, s * 0.36, Math.PI, 0); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
      rrect(-s * 0.5, s * 0.08, s * 1.0, s * 0.13, s * 0.06); ctx.fill();
      rrect(-s * 0.06, -s * 0.3, s * 0.12, s * 0.4, s * 0.05); ctx.fillStyle = band; ctx.fill();
    },
    phone(s, body, screen) {
      const K = TPL.sceneKit;
      K.box(-s * 0.3, -s * 0.5, s * 0.6, s, s * 0.1, body, { band: 0, hl: 0.15 });
      rrect(-s * 0.25, -s * 0.44, s * 0.5, s * 0.88, s * 0.07); ctx.fillStyle = screen; ctx.fill();
    },
    calendar(s, paper, head, ink) {
      const K = TPL.sceneKit;
      K.box(-s * 0.46, -s * 0.4, s * 0.92, s * 0.86, s * 0.1, paper, { band: 0.08 });
      ctx.save(); rrect(-s * 0.46, -s * 0.4, s * 0.92, s * 0.86, s * 0.1); ctx.clip(); ctx.fillStyle = head; ctx.fillRect(-s * 0.46, -s * 0.4, s * 0.92, s * 0.24); ctx.restore();
      for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) { rrect(-s * 0.32 + i * s * 0.23, -s * 0.06 + j * s * 0.2, s * 0.16, s * 0.13, s * 0.03); ctx.fillStyle = ink; ctx.fill(); }
      rrect(-s * 0.28, -s * 0.5, s * 0.08, s * 0.18, s * 0.04); ctx.fillStyle = head; ctx.fill(); rrect(s * 0.2, -s * 0.5, s * 0.08, s * 0.18, s * 0.04); ctx.fill();
    },
    // simple person bust (no face details, no limitation implied)
    person(s, shirt, skin) {
      circle(0, -s * 0.22, s * 0.2, skin);
      ctx.beginPath(); ctx.moveTo(-s * 0.38, s * 0.46); ctx.quadraticCurveTo(-s * 0.38, s * 0.02, 0, s * 0.02); ctx.quadraticCurveTo(s * 0.38, s * 0.02, s * 0.38, s * 0.46); ctx.closePath(); ctx.fillStyle = shirt; ctx.fill();
    },
  },
};
