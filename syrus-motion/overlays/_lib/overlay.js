// =====================================================================
//  overlays/_lib/overlay.js — shared helpers for Syrus editor overlays (transparent 9:16 canvases).
//  Every overlay: const CONFIG = {...} at the top (copy + brand), a renderFrame(t) that clears to transparent,
//  window.OVERLAY = { width, height, fps, frames }. Exported to ProRes 4444 / WebM alpha by tools/overlay-export.mjs.
//  Deterministic: everything is a function of t (closed-form springs), so any frame renders alone.
// =====================================================================
"use strict";
const W = 1080, H = 1920;
const SANS = '"Geist", "Inter", "Helvetica Neue", Arial, sans-serif';
const SERIF = '"Playfair Display", "DejaVu Serif", Georgia, "Times New Roman", serif';
const BRAND = {   // Syrus defaults; a client variant overrides these in its CONFIG.brand
  card: '#002F6C', ink: '#F8F8F4', accent: '#FFD700', sky: '#66C2FF', bad: '#FF4D5E', shadow: 'rgba(0,10,30,0.5)',
};
const ctx = document.getElementById('c').getContext('2d');
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, u) => a + (b - a) * u;
const easeOut = (u) => 1 - Math.pow(1 - clamp(u), 3);
const easeIn = (u) => Math.pow(clamp(u), 3);
const easeIO = (u) => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
// closed-form damped spring 0 -> 1 (k stiffness, d damping); overshoots a hair, settles
function spring(t, k = 170, d = 20) {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(k), z = d / (2 * w0);
  if (z >= 1) return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  const wd = w0 * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t));
}
function rrect(x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function card(x, y, w, h, r, fill, o = {}) {
  ctx.save();
  if (o.shadow !== false) { ctx.shadowColor = o.shadowColor ?? BRAND.shadow; ctx.shadowBlur = o.blur ?? 40; ctx.shadowOffsetY = o.dy ?? 14; }
  rrect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.restore();
}
// text with an optional soft shadow so it holds on busy footage; returns its width
function text(str, x, y, size, color, o = {}) {
  ctx.save();
  ctx.font = `${o.italic ? 'italic ' : ''}${o.weight ?? 800} ${size}px ${o.font ?? SANS}`;
  ctx.textAlign = o.align ?? 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = color; ctx.globalAlpha *= o.alpha ?? 1;
  if (o.spacing) ctx.letterSpacing = o.spacing + 'px';
  if (o.shadow !== false) { ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = o.blur ?? 18; ctx.shadowOffsetY = 4; }
  const w = ctx.measureText(str).width;
  ctx.fillText(str, x, y);
  ctx.restore();
  return w;
}
function measure(str, size, o = {}) { ctx.save(); ctx.font = `${o.italic ? 'italic ' : ''}${o.weight ?? 800} ${size}px ${o.font ?? SANS}`; if (o.spacing) ctx.letterSpacing = o.spacing + 'px'; const w = ctx.measureText(str).width; ctx.restore(); return w; }
const money = (n, dp = 0) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });
function frameStart() { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H); }
// wire up: OVERLAY metadata + live preview loop (the exporter passes ?export=1 and drives renderFrame itself)
function boot(renderFrame, fps, dur) {
  Object.assign(BRAND, (typeof CONFIG !== 'undefined' && CONFIG.brand) || {});
  window.OVERLAY = { width: W, height: H, fps, frames: Math.round(dur * fps) };
  window.renderFrame = renderFrame;
  if (!location.search.includes('export')) { const s = performance.now(); const tick = () => { renderFrame(((performance.now() - s) / 1000) % (dur + 0.6)); requestAnimationFrame(tick); }; tick(); }
}
