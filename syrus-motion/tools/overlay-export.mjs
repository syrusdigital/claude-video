#!/usr/bin/env node
// Render an overlay piece (an index.html with a transparent <canvas id="c"> and window.renderFrame(t), window.OVERLAY = { width,
// height, fps, frames }) to editor-ready files with ALPHA:
//   <out>.mov   ProRes 4444 + alpha (Premiere, Final Cut, DaVinci, After Effects)
//   <out>.webm  VP9 + alpha (CapCut desktop, web)
//   <out>-preview.mp4  the same over a checkerboard, for review on a phone
// usage: node tools/overlay-export.mjs <piece-dir> [--out renders/name] [--keep-frames]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { execSync, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch { return require(path.join(execSync('npm root -g').toString().trim(), 'playwright')); } })();
const argv = process.argv.slice(2);
const dir = path.resolve(argv[0] || '.');
const opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const out = path.resolve(dir, opt('out', path.join('renders', path.basename(dir))));
const FR = path.join(dir, 'frames-alpha');
fs.rmSync(FR, { recursive: true, force: true }); fs.mkdirSync(FR, { recursive: true }); fs.mkdirSync(path.dirname(out), { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 400, height: 400 } });
page.on('pageerror', (e) => { console.error('PAGE ERROR:', e.message); process.exitCode = 1; });
await page.goto(pathToFileURL(path.join(dir, 'index.html')).href + '?export=1');
await page.waitForFunction(() => window.OVERLAY && typeof window.renderFrame === 'function');
const O = await page.evaluate(() => window.OVERLAY);
const t0 = Date.now();
for (let f = 0; f < O.frames; f++) {
  const b64 = await page.evaluate((fr) => { window.renderFrame(fr / window.OVERLAY.fps); return document.getElementById('c').toDataURL('image/png').split(',')[1]; }, f);
  fs.writeFileSync(path.join(FR, `f${String(f).padStart(4, '0')}.png`), Buffer.from(b64, 'base64'));
}
await browser.close();
console.log(`${O.frames} frames ${O.width}x${O.height} @ ${O.fps}fps in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
const seq = ['-framerate', String(O.fps), '-i', path.join(FR, 'f%04d.png')];
const run = (args) => { const r = spawnSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args], { stdio: 'inherit' }); if (r.status) process.exit(r.status); };
run([...seq, '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-vendor', 'apl0', out + '.mov']);
run([...seq, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '28', '-row-mt', '1', out + '.webm']);
run(['-f', 'lavfi', '-i', `color=c=#cfd3da:s=${O.width}x${O.height}:r=${O.fps}`, ...seq,
  '-filter_complex', `[0]geq=lum='if(eq(mod(floor(X/40)+floor(Y/40),2),0),200,235)':cb=128:cr=128[bg];[bg][1]overlay=shortest=1,format=yuv420p`,
  '-c:v', 'libx264', '-crf', '23', '-movflags', '+faststart', out + '-preview.mp4']);
if (!argv.includes('--keep-frames')) fs.rmSync(FR, { recursive: true, force: true });
for (const ext of ['.mov', '.webm', '-preview.mp4']) console.log('wrote', out + ext, (fs.statSync(out + ext).size / 1e6).toFixed(1) + 'MB');
