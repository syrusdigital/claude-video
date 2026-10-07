// =====================================================================
//  gfx/lib.js — Syrus graphics engine: one transparent 9:16 canvas, a registry of templates (gfx/tpl/*.js),
//  and a SPEC (a timeline of template items) that decides what draws when.
//  The same templates serve the standalone overlay pack (a spec with one item) and full ads (captions + many items).
//  Deterministic: every draw is a pure function of time, so any frame renders alone (closed-form springs, seeded RNG).
//
//  Template contract:  TPL.name = { dur: seconds, defaults: {...}, draw(t, c, E) }
//    t = seconds since the item started (0..dur), c = defaults <- item.cfg merged, E = { W, H, fps, B: brand, T: absolute time }
//    draw() must not keep state between frames. Use the helpers below; colours from E.B (brand) or c.
//  Spec: { fps, duration, brand: {...}, bg: null | '#hex', items: [ { tpl, at, cfg, dur? } ] }
// =====================================================================
"use strict";
const W = 1080, H = 1920;
const SANS = '"Geist", "Inter", "Helvetica Neue", Arial, sans-serif';
const SERIF = '"DejaVu Serif", Georgia, "Times New Roman", serif';
const MONO = '"Geist Mono", "DejaVu Sans Mono", Menlo, monospace';
const BRAND0 = { card: '#002F6C', ink: '#F8F8F4', accent: '#FFD700', sky: '#66C2FF', bad: '#FF4D5E', good: '#3DDC84', dark: '#0B1424', shadow: 'rgba(0,10,30,0.55)' };
const TPL = {};
const cv = document.getElementById('c');
let ctx = cv.getContext('2d');
// ---- math
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, u) => a + (b - a) * u;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const easeOut = (u) => 1 - Math.pow(1 - clamp(u), 3);
const easeIn = (u) => Math.pow(clamp(u), 3);
const easeIO = (u) => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const backOut = (u) => { u = clamp(u); const s = 1.70158; return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); };
function spring(t, k = 170, d = 20) {   // closed-form damped spring 0 -> 1
  if (t <= 0) return 0;
  const w0 = Math.sqrt(k), z = d / (2 * w0);
  if (z >= 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const wd = w0 * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t));
}
// in/out envelope for an item: pops in on a spring, leaves over `out` seconds at the end
const life = (t, dur, out = 0.3, k = 200, d = 21) => spring(t, k, d) * (1 - easeOut((t - (dur - out)) / out));
function RNG(...keys) {   // seeded mulberry32
  let h = 2166136261 >>> 0; for (const ch of keys.join('|')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  let a = h >>> 0;
  const f = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { f, r: (lo, hi) => lo + (hi - lo) * f(), i: (lo, hi) => Math.floor(lo + (hi - lo + 1) * f()) };
}
// ---- drawing
function rrect(x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function card(x, y, w, h, r, fill, o = {}) {
  ctx.save();
  if (o.shadow !== false) { ctx.shadowColor = o.shadowColor ?? 'rgba(0,10,30,0.5)'; ctx.shadowBlur = o.blur ?? 40; ctx.shadowOffsetY = o.dy ?? 14; }
  rrect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
  if (o.stroke) { ctx.save(); rrect(x, y, w, h, r); ctx.strokeStyle = o.stroke; ctx.lineWidth = o.lw ?? 3; ctx.stroke(); ctx.restore(); }
}
function font(size, o = {}) { return `${o.italic ? 'italic ' : ''}${o.weight ?? 800} ${size}px ${o.font ?? SANS}`; }
function text(str, x, y, size, color, o = {}) {   // returns width; o: align, weight, font, italic, spacing, shadow, alpha, blur, stroke
  ctx.save();
  ctx.font = font(size, o); ctx.textAlign = o.align ?? 'left'; ctx.textBaseline = o.base ?? 'alphabetic';
  if (o.spacing) ctx.letterSpacing = o.spacing + 'px';
  ctx.globalAlpha *= o.alpha ?? 1;
  if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.stroke; ctx.strokeStyle = o.strokeColor ?? 'rgba(0,0,0,0.85)'; ctx.strokeText(str, x, y); }
  if (o.shadow !== false) { ctx.shadowColor = o.shadowColor ?? 'rgba(0,0,0,0.55)'; ctx.shadowBlur = o.blur ?? 18; ctx.shadowOffsetY = 4; }
  ctx.fillStyle = color; ctx.fillText(str, x, y);
  const w = ctx.measureText(str).width; ctx.restore(); return w;
}
function measure(str, size, o = {}) { ctx.save(); ctx.font = font(size, o); if (o.spacing) ctx.letterSpacing = o.spacing + 'px'; const w = ctx.measureText(str).width; ctx.restore(); return w; }
function fitSize(str, size, maxW, o = {}) { const w = measure(str, size, o); return w > maxW ? size * maxW / w : size; }
const money = (n, dp = 0) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
function circle(x, y, r, fill, stroke, lw = 4) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } }
function line(P, color, lw = 6, o = {}) {
  if (P.length < 2) return; ctx.save(); ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (const p of P.slice(1)) ctx.lineTo(p[0], p[1]);
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = o.cap ?? 'round'; ctx.lineJoin = 'round'; if (o.dash) ctx.setLineDash(o.dash); if (o.shadow) { ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 12; }
  ctx.stroke(); ctx.restore();
}
// a polyline drawn on progressively (frac 0..1)
function partial(P, frac) {
  const L = []; let tot = 0; for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); L.push(d); tot += d; }
  let rem = tot * clamp(frac); const out = [P[0]];
  for (let i = 1; i < P.length && rem > 0; i++) { const d = L[i - 1]; if (rem >= d) { out.push(P[i]); rem -= d; } else { const u = rem / d; out.push([lerp(P[i - 1][0], P[i][0], u), lerp(P[i - 1][1], P[i][1], u)]); rem = 0; } }
  return out;
}
function check(x, y, s, color, frac = 1, lw) { line(partial([[x - s * 0.5, y], [x - s * 0.15, y + s * 0.35], [x + s * 0.55, y - s * 0.45]], frac), color, lw ?? s * 0.18); }
function arrowDown(x, y, s, color) { ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.moveTo(-s * 0.18, -s); ctx.lineTo(s * 0.18, -s); ctx.lineTo(s * 0.18, -s * 0.2); ctx.lineTo(s * 0.5, -s * 0.2); ctx.lineTo(0, s * 0.45); ctx.lineTo(-s * 0.5, -s * 0.2); ctx.lineTo(-s * 0.18, -s * 0.2); ctx.closePath(); ctx.fillStyle = color; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 14; ctx.fill(); ctx.restore(); }
function withAlpha(a, fn) { ctx.save(); ctx.globalAlpha *= clamp(a); fn(); ctx.restore(); }
function at(x, y, s, rot, fn) { ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); if (s !== 1) ctx.scale(s, s); fn(); ctx.restore(); }
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }
// ---- the runner
let SPECX = null;
function renderFrame(T) {
  const S = SPECX;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
  if (S.bg) { ctx.fillStyle = S.bg; ctx.fillRect(0, 0, W, H); }
  const B = Object.assign({}, BRAND0, S.brand || {});
  for (const it of S.items) {
    const tp = TPL[it.tpl]; if (!tp) throw new Error('unknown template ' + it.tpl);
    const dur = it.dur ?? (it.cfg && it.cfg.dur) ?? tp.dur, t = T - (it.at || 0);
    if (t < 0 || t > dur) continue;
    const c = Object.assign({}, tp.defaults || {}, it.cfg || {}, { dur });
    ctx.save(); tp.draw(t, c, { W, H, fps: S.fps, B, T }); ctx.restore();
  }
}
// images (client photos, logos): spec.images = { name: 'data:image/jpeg;base64,...' } — embedded so the canvas stays
// readable for export. IMGS[name] is a decoded Image; drawCover(img, x, y, w, h, {zoom, fx, fy}) fills a box like CSS cover.
const IMGS = {};
function drawCover(img, x, y, w, h, o = {}) {
  if (!img) return;
  const z = o.zoom ?? 1, s = Math.max(w / img.width, h / img.height) * z, iw = img.width * s, ih = img.height * s;
  const ox = x + (w - iw) * (o.fx ?? 0.5), oy = y + (h - ih) * (o.fy ?? 0.5);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.drawImage(img, ox, oy, iw, ih); ctx.restore();
}
async function boot(spec) {
  SPECX = spec;
  for (const [k, src] of Object.entries(spec.images || {})) { const im = new Image(); im.src = src; await im.decode(); IMGS[k] = im; }
  window.OVERLAY = { width: W, height: H, fps: spec.fps || 30, frames: Math.round((spec.duration || 3) * (spec.fps || 30)) };
  window.renderFrame = renderFrame;
  if (!location.search.includes('export')) { const s = performance.now(); const tick = () => { renderFrame(((performance.now() - s) / 1000) % (spec.duration + 0.5)); requestAnimationFrame(tick); }; tick(); }
}
