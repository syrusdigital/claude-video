// versus-split — "THEM vs US": two panels slide in (left muted red-tint "Big showroom company", right navy + gold "Us"),
// a VS medallion pops, then each row lands on a VO beat: the row label chip, ✗ on their side, ✓ on ours. Ends with the
// "Us" panel winning (gold edge glows, their side dims). 3–4 rows. ~6s.
TPL.versusSplit = {
  dur: 6.0,
  // rows must be true of the client vs the competitor type (no named competitors, no invented stats)
  defaults: { them: 'Big showroom company', us: 'Us', rows: ['Price shown up front', 'One in-house team', 'Itemized estimate'], y: 330, beat: 0.1, rowStart: 1.0, rowStep: 1.15 },
  mix(a, b, u) {
    const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)), A = p(a), Z = p(b);
    return `rgb(${A.map((v, i) => Math.round(lerp(v, Z[i], u))).join(',')})`;
  },
  wrap(str, size, maxW, o) {
    const out = []; let cur = '';
    for (const w of String(str).split(/\s+/)) { const s = cur ? cur + ' ' + w : w; if (cur && measure(s, size, o) > maxW) { out.push(cur); cur = w; } else cur = s; }
    if (cur) out.push(cur); return out;
  },
  title(str, cx, y0, maxW, color, big) {   // 1 line -> big; 2+ lines -> 46px stack; centred in the header band
    const O = { weight: 900 }, mid = y0 + 128;
    let L = this.wrap(str, 46, maxW, O);
    if (L.length === 1) { const s = fitSize(str, big, maxW, O); text(str, cx, mid + s * 0.36, s, color, { align: 'center', ...O, shadow: false }); return; }
    L = L.slice(0, 3); const lh = 54, top = mid - ((L.length - 1) * lh + 34) / 2 + 34;
    L.forEach((s, i) => text(s, cx, top + i * lh, 46, color, { align: 'center', ...O, shadow: false }));
  },
  draw(t, c, E) {
    const B = E.B, rows = c.rows.slice(0, 4), n = rows.length;
    const fade = 1 - easeOut((t - (c.dur - 0.3)) / 0.3); if (fade <= 0) return;
    const pw = 465, gap = 30, xl = (E.W - 2 * pw - gap) / 2, xr = xl + pw + gap, HEAD = 250, PITCH = 186;
    const ph = HEAD + n * PITCH + 24, y0 = c.y;
    const step = Math.min(c.rowStep, (c.dur - 1.9 - c.rowStart) / Math.max(1, n));
    const rowT = (i) => c.rowStart + i * step, winT = rowT(n - 1) + 0.95;
    const win = easeOut(seg(t, winT, winT + 0.45));
    const sl = spring(t - c.beat, 210, 21), sr = spring(t - c.beat - 0.12, 210, 21);
    ctx.globalAlpha = fade;
    const themFill = this.mix(B.dark, B.bad, 0.26), themInk = this.mix(B.ink, B.bad, 0.18);
    // THEM panel
    if (sl > 0.001) withAlpha(clamp(sl * 1.4), () => at(-(1 - sl) * 280, 0, 1, 0, () => {
      card(xl, y0, pw, ph, 34, themFill, { stroke: hexA(B.bad, 0.4), lw: 3 });
      this.title(c.them, xl + pw / 2 - 16, y0, pw - 110, hexA(B.ink, 0.82), 84);
      ctx.fillStyle = hexA(B.ink, 0.12); ctx.fillRect(xl + 36, y0 + HEAD - 14, pw - 72, 2);
      if (win > 0) { rrect(xl, y0, pw, ph, 34); ctx.fillStyle = hexA(B.dark, 0.38 * win); ctx.fill(); }   // their side dims
    }));
    // US panel
    if (sr > 0.001) withAlpha(clamp(sr * 1.4), () => at((1 - sr) * 280, 0, 1, 0, () => {
      at(xr + pw / 2, y0 + ph / 2, 1 + 0.025 * win, 0, () => at(-(xr + pw / 2), -(y0 + ph / 2), 1, 0, () => {
        if (win > 0) { ctx.save(); ctx.shadowColor = hexA(B.accent, 0.75 * win); ctx.shadowBlur = 46 * win; rrect(xr, y0, pw, ph, 34); ctx.fillStyle = B.card; ctx.fill(); ctx.restore(); }
        card(xr, y0, pw, ph, 34, B.card, { stroke: B.accent, lw: 5 + 3 * win });
        this.title(c.us, xr + pw / 2 + 16, y0, pw - 120, B.accent, 104);
        ctx.fillStyle = hexA(B.ink, 0.12); ctx.fillRect(xr + 36, y0 + HEAD - 14, pw - 72, 2);
      }));
    }));
    // VS medallion on the seam
    const vs = spring(t - c.beat - 0.45, 320, 16);
    if (vs > 0.001) at(E.W / 2, y0 + 128, vs, 0, () => {
      ctx.save(); ctx.shadowColor = 'rgba(0,10,30,0.55)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8; circle(0, 0, 52, B.dark); ctx.restore();
      circle(0, 0, 52, null, B.accent, 5);
      text('VS', 2, 14, 38, B.ink, { align: 'center', weight: 900, shadow: false, spacing: 2 });
    });
    // rows
    rows.forEach((s, i) => {
      const rt = rowT(i), ry = y0 + HEAD + i * PITCH;
      const k = spring(t - rt, 300, 19); if (k <= 0.001) return;
      const ls = fitSize(s, 46, 820, { weight: 800 }), lw = measure(s, ls, { weight: 800 }) + 76, cy = ry + 48;
      withAlpha(clamp(k * 2), () => at(E.W / 2, cy, 0.7 + 0.3 * k, 0, () => {
        card(-lw / 2, -38, lw, 76, 38, B.ink, { blur: 22, dy: 8 });
        text(s, 0, ls * 0.36, ls, B.card, { align: 'center', weight: 800, shadow: false });
      }));
      const iy = ry + 134, ix = xl + pw / 2, jx = xr + pw / 2;
      const kx = spring(t - rt - 0.4, 340, 15);
      if (kx > 0.001) withAlpha(clamp(kx * 2) * (1 - 0.3 * win), () => at(ix, iy, 0.5 + 0.5 * kx, 0, () => {
        circle(0, 0, 46, B.bad); const f = easeOut(seg(t, rt + 0.42, rt + 0.7)), L = 17;
        line(partial([[-L, -L], [L, L]], clamp(f * 2)), B.ink, 10);
        if (f > 0.5) line(partial([[L, -L], [-L, L]], clamp(f * 2 - 1)), B.ink, 10);
      }));
      const kc = spring(t - rt - 0.7, 340, 15);
      if (kc > 0.001) {
        const ru = seg(t, rt + 0.72, rt + 1.15);
        if (ru > 0 && ru < 1) circle(jx, iy, 46 + 34 * easeOut(ru), null, hexA(B.accent, 0.8 * (1 - ru)), 5 * (1 - ru) + 1);
        withAlpha(clamp(kc * 2), () => at(jx, iy, 0.5 + 0.5 * kc, 0, () => {
          circle(0, 0, 46, B.accent); check(-1, 2, 46, B.card, easeOut(seg(t, rt + 0.72, rt + 0.98)), 10);
        }));
      }
    });
  },
};
