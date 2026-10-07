#!/usr/bin/env node
// Render a gfx SPEC (gfx/lib.js + gfx/tpl/*.js) to files.
//   node tools/gfx.mjs <spec.json> <out-base> [--mode alpha|track|opaque] [--frames-only] [--still t1,t2 --still-out x.png]
//   alpha  (default): <out>.mov ProRes 4444 + alpha, <out>.webm VP9 alpha, <out>-preview.mp4 over a checkerboard
//   track : <out>-frames/f00000.png ... kept for the ad compiler (no encode)
//   opaque: <out>.mp4 H.264 (for specs with bg set: full-screen pieces)
// --still t1,t2,...: render those times side by side to --still-out (a review sheet), no video.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync, spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); } })();
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const specPath = path.resolve(argv[0]), out = path.resolve(argv[1]);
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
spec.fps ??= 30;
if (spec.duration == null) spec.duration = Math.max(...spec.items.map((i) => (i.at || 0) + (i.dur ?? i.cfg?.dur ?? 3)));
const mode = opt('mode', spec.bg ? 'opaque' : 'alpha');
// spec.imageFiles = { name: 'relative/or/abs/path.jpg' } -> embedded as data URIs (resolved against the spec's folder)
if (spec.imageFiles) {
  spec.images ??= {};
  const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
  for (const [k, p] of Object.entries(spec.imageFiles)) { const f = path.resolve(path.dirname(specPath), p); spec.images[k] = `data:${MIME[f.split('.').pop().toLowerCase()] || 'image/jpeg'};base64,` + fs.readFileSync(f).toString('base64'); }
  delete spec.imageFiles;
}
fs.mkdirSync(path.dirname(out), { recursive: true });

// the page: lib + every template + this spec
const tpls = fs.readdirSync(path.join(ROOT, 'gfx', 'tpl')).filter((f) => f.endsWith('.js')).sort();
const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:repeating-conic-gradient(#ccc 0 25%,#eee 0 50%) 0 0/40px 40px}canvas{height:100vh;display:block;margin:0 auto}</style></head>
<body><canvas id="c" width="1080" height="1920"></canvas>
<script src="${pathToFileURL(path.join(ROOT, 'gfx', 'lib.js')).href}"></script>
${tpls.map((f) => `<script src="${pathToFileURL(path.join(ROOT, 'gfx', 'tpl', f)).href}"></script>`).join('\n')}
<script>boot(${JSON.stringify(spec)});</script></body></html>`;
const page0 = out + '.html';
fs.writeFileSync(page0, html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
let err = null;
page.on('pageerror', (e) => { err = e; console.error('PAGE ERROR:', e.message); });
await page.goto(pathToFileURL(page0).href + '?export=1');
await page.waitForFunction(() => window.OVERLAY && typeof window.renderFrame === 'function', null, { timeout: 15000 }).catch(() => {});
if (err) { await browser.close(); process.exit(1); }
const O = await page.evaluate(() => window.OVERLAY);
const grab = (t) => page.evaluate((tt) => { window.renderFrame(tt); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, t);

const still = opt('still', null);
if (still) {   // a review sheet: the given times side by side at half size, over a mid-grey checker
  const times = still.split(',').map(Number), dir = out + '-stills';
  fs.mkdirSync(dir, { recursive: true });
  for (const [i, t] of times.entries()) fs.writeFileSync(path.join(dir, `s${i}.png`), Buffer.from(await grab(t), 'base64'));
  await browser.close();
  const ins = times.flatMap((_, i) => ['-i', path.join(dir, `s${i}.png`)]);
  const bg = spec.bg ? '' : `color=c=#8a93a3:s=1080x1920[g];`;
  const parts = times.map((_, i) => spec.bg ? `[${i}:v]scale=540:960[v${i}]` : `color=c=#7f8896:s=1080x1920[g${i}];[g${i}][${i}:v]overlay,scale=540:960[v${i}]`).join(';');
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', ...ins, '-filter_complex', `${parts};${times.map((_, i) => `[v${i}]`).join('')}hstack=inputs=${times.length}`, '-frames:v', '1', opt('still-out', out + '-stills.png')], { stdio: 'inherit' });
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('still sheet', opt('still-out', out + '-stills.png'), r.status === 0 ? 'ok' : 'FAILED');
  process.exit(r.status);
}

const FR = out + '-frames';
fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true });
const t0 = Date.now();
for (let f = 0; f < O.frames; f++) fs.writeFileSync(path.join(FR, `f${String(f).padStart(5, '0')}.png`), Buffer.from(await grab(f / O.fps), 'base64'));
await browser.close();
fs.rmSync(page0, { force: true });
console.log(`${O.frames} frames @ ${O.fps}fps in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
if (mode === 'track') { console.log('frames kept at', FR); process.exit(0); }
const seq = ['-framerate', String(O.fps), '-i', path.join(FR, 'f%05d.png')];
const run = (args) => { const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' }); if (r.status) process.exit(r.status); };
if (mode === 'opaque') {
  run([...seq, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', out + '.mp4']);
} else {
  run([...seq, '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-vendor', 'apl0', out + '.mov']);
  run([...seq, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '30', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '4', out + '.webm']);
  run(['-f', 'lavfi', '-i', `color=c=#7f8896:s=1080x1920:r=${O.fps}`, ...seq, '-filter_complex', '[0][1]overlay=shortest=1,scale=540:960,format=yuv420p', '-c:v', 'libx264', '-crf', '24', '-movflags', '+faststart', out + '-preview.mp4']);
}
if (!argv.includes('--keep-frames')) fs.rmSync(FR, { recursive: true, force: true });
for (const ext of mode === 'opaque' ? ['.mp4'] : ['.mov', '.webm', '-preview.mp4']) console.log('wrote', out + ext, (fs.statSync(out + ext).size / 1e6).toFixed(1) + 'MB');
