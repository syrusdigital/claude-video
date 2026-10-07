#!/usr/bin/env python3
"""Syrus ad compiler: ad.json -> a finished 9:16 ad (footage + graphics + captions + VO + music).

usage: python3 tools/cut.py <ad-dir> [--force-vo] [--stills]
<ad-dir>/ad.json:
{
  "title": "LHR F1", "brand": {...gfx brand overrides...},
  "vo": { "lines": [ {"id": "hook", "text": "...", "after": 0.25}, ... ], "voice": "am_michael", "speed": 1.1 },
  "music": { "bpm": 104, "key": "D", "mood": "warm", "db": -18, "stop": ["word:only", "word:only+0.6"] },
  "tail": 1.2,
  "shots": [ { "src": "media/a.mp4", "in": 2.0, "len": 2.2 | "until": "<anchor>", "fit": "cover"|"blur",
               "fx": 0.5, "fy": 0.5, "zoom": [1.0, 1.08], "speed": 1.0 }, ... ],   # photos (.jpg/.png) get Ken Burns from "zoom"
  "gfx": [ { "tpl": "priceShock", "at": "<anchor>", "dur": 4.5, "cfg": {...}, "hide": true, "sfx": ["whoosh", ["hit", 2.75]] }, ... ],
  "captions": { "y": 1240, "em": ["free"] }
}
Anchors: number | "word:<w>" (first occurrence) | "word:<w>#2" | "line:<id>" (its start) | "line:<id>.end" | "end";
any anchor may carry "+0.4" / "-0.2". Shots run back to back; the last shot stretches to the end.
Outputs <ad-dir>/out/<slug>.mp4 and out/sheet.jpg (1 frame/2s contact sheet).
"""
import json, os, re, subprocess, sys, shutil, hashlib

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
AD = os.path.abspath(sys.argv[1]); A = json.load(open(os.path.join(AD, 'ad.json')))
BUILD = os.path.join(AD, 'build'); OUT = os.path.join(AD, 'out'); os.makedirs(BUILD, exist_ok=True); os.makedirs(OUT, exist_ok=True)
FPS = 30
def sh(cmd, **kw):
    r = subprocess.run(cmd, **kw)
    if r.returncode: sys.exit(f'FAILED: {" ".join(map(str, cmd))[:400]}')
def ff(*args): sh(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', *map(str, args)])

# ---- 1. voiceover (cached on the script text)
vo_dir = os.path.join(BUILD, 'vo'); os.makedirs(vo_dir, exist_ok=True)
V = A['vo']; vkey = hashlib.sha1(json.dumps(V, sort_keys=True).encode()).hexdigest()[:12]
if '--force-vo' in sys.argv or not os.path.exists(os.path.join(vo_dir, vkey)):
    json.dump({'lead': V.get('lead', 0.15), 'tail': 0.3, 'lines': V['lines']}, open(os.path.join(vo_dir, 'script.json'), 'w'))
    sh([sys.executable, os.path.join(HERE, 'vo.py'), os.path.join(vo_dir, 'script.json'), vo_dir, '--voice', V.get('voice', 'am_michael'), '--speed', str(V.get('speed', 1.1))], stderr=subprocess.DEVNULL)
    open(os.path.join(vo_dir, vkey), 'w').close()
VO = json.load(open(os.path.join(vo_dir, 'vo.json')))
DUR = round(VO['duration'] + float(A.get('tail', 1.2)), 3)

norm = lambda s: re.sub(r'[^a-z0-9$]', '', s.lower())
def anchor(a):
    if isinstance(a, (int, float)): return float(a)
    m = re.match(r'^(.*?)([+-]\d+(\.\d+)?)?$', a.strip()); base, off = m.group(1), float(m.group(2) or 0)
    if base == 'end': return DUR + off
    if base.startswith('line:'):
        lid = base[5:]; end = lid.endswith('.end'); lid = lid[:-4] if end else lid
        ln = next(l for l in VO['lines'] if l['id'] == lid); return (ln['t1'] if end else ln['t0']) + off
    if base.startswith('word:'):
        w, _, n = base[5:].partition('#'); n = int(n or 1); hits = [x for x in VO['words'] if norm(x['w']).startswith(norm(w))]
        if len(hits) < n: sys.exit(f'anchor not found: {a} (words: {" ".join(x["w"] for x in VO["words"])[:300]})')
        return hits[n - 1]['t0'] + off
    return float(base) + off

# ---- 2. footage: one segment per shot, 1080x1920 @ 30fps
shots = A['shots']; t = 0.0; segs = []
for i, s in enumerate(shots):
    start = t
    end = DUR if i == len(shots) - 1 else (anchor(s['until']) if 'until' in s else t + float(s['len']))
    ln = max(0.2, round(end - start, 3)); t = start + ln
    src = os.path.join(AD, s['src']); out = os.path.join(BUILD, f'seg{i:02d}.mp4'); segs.append(out)
    is_img = src.lower().endswith(('.jpg', '.jpeg', '.png', '.webp', '.heic'))
    fx, fy = s.get('fx', 0.5), s.get('fy', 0.5); z0, z1 = s.get('zoom', [1.0, 1.1] if is_img else [1.0, 1.0])
    grade = s.get('grade', 'eq=contrast=1.05:saturation=1.1:brightness=0.01')
    nfr = int(round(ln * FPS))
    if is_img:
        # Ken Burns: upscale 2x first so zoompan's integer steps don't jitter; zoom z0->z1, centred on (fx, fy)
        zexpr = f"{z0}+({z1}-{z0})*on/{max(1, nfr - 1)}"
        vf = (f"scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840:(iw-2160)*{fx}:(ih-3840)*{fy},"
              f"zoompan=z='{zexpr}':x='(iw-iw/zoom)*{fx}':y='(ih-ih/zoom)*{fy}':d={nfr}:s=1080x1920:fps={FPS},{grade},format=yuv420p")
        ff('-loop', 1, '-i', src, '-vf', vf, '-frames:v', nfr, '-an', '-c:v', 'libx264', '-crf', 17, '-preset', 'veryfast', out)
    else:
        sp = float(s.get('speed', 1.0)); need = ln * sp
        if s.get('fit') == 'blur':
            vf = (f"setpts=PTS/{sp},split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,boxblur=24:2,eq=brightness=-0.12[bg];"
                  f"[b]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,fps={FPS},{grade},format=yuv420p")
        else:
            zz = z1 if z1 != z0 else z0
            # a slow push on video: scale up by zz over the shot via scale+crop with a time-varying crop window
            cw, ch = f"1080/({z0}+({z1}-{z0})*t/{ln})", f"1920/({z0}+({z1}-{z0})*t/{ln})"
            vf = (f"setpts=PTS/{sp},scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920:(iw-1080)*{fx}:(ih-1920)*{fy},"
                  + (f"scale=2160:3840,crop=w='2*{cw}':h='2*{ch}':x='(iw-ow)*{fx}':y='(ih-oh)*{fy}',scale=1080:1920," if z1 != z0 else '')
                  + f"fps={FPS},{grade},format=yuv420p")
        ff('-ss', s.get('in', 0), '-t', need + 0.2, '-i', src, '-filter_complex' if s.get('fit') == 'blur' else '-vf', vf, '-frames:v', nfr, '-an', '-c:v', 'libx264', '-crf', 17, '-preset', 'veryfast', out)
    s['_t0'], s['_len'] = start, ln
lst = os.path.join(BUILD, 'segs.txt'); open(lst, 'w').write(''.join(f"file '{p}'\n" for p in segs))
base = os.path.join(BUILD, 'base.mp4'); ff('-f', 'concat', '-safe', 0, '-i', lst, '-c', 'copy', base)

# ---- 3. graphics track: captions + items, one transparent pass
items, hide, whoosh, hits, ticks = [], [], [], [], []
for g in A.get('gfx', []):
    at = anchor(g['at']); it = {'tpl': g['tpl'], 'at': round(at, 3), 'cfg': g.get('cfg', {})}
    if 'dur' in g: it['dur'] = g['dur']
    items.append(it)
    d = g.get('dur', g.get('cfg', {}).get('dur', 3.0))
    if g.get('hide', True): hide.append([round(at, 3), round(at + d, 3)])
    for e in g.get('sfx', ['whoosh']):
        kind, off = (e, 0.0) if isinstance(e, str) else (e[0], float(e[1]))
        {'whoosh': whoosh, 'hit': hits, 'tick': ticks}[kind].append(round(at + off, 3))
cap = A.get('captions', {})
spec = {'fps': FPS, 'duration': DUR, 'brand': A.get('brand', {}), 'images': {},
        'items': ([{'tpl': 'captions', 'at': 0, 'dur': DUR, 'cfg': {**cap, 'words': VO['words'], 'hide': hide + cap.get('hide', [])}}] if cap.get('on', True) else []) + items}
for k, p in A.get('images', {}).items():   # logos / photos the graphics draw, embedded
    import base64, mimetypes
    spec['images'][k] = f"data:{mimetypes.guess_type(p)[0] or 'image/png'};base64," + base64.b64encode(open(os.path.join(AD, p), 'rb').read()).decode()
sp = os.path.join(BUILD, 'gfx.json'); json.dump(spec, open(sp, 'w'))
trk = os.path.join(BUILD, 'track')
sh(['node', os.path.join(HERE, 'gfx.mjs'), sp, trk, '--mode', 'track'])

# ---- 4. audio
mu = A.get('music', {})
plan = {'duration': DUR, 'bpm': mu.get('bpm', 104), 'key': mu.get('key', 'D'), 'mood': mu.get('mood', 'warm'), 'music_db': mu.get('db', -18),
        'duck_db': mu.get('duck', -9), 'vo': os.path.join(vo_dir, 'vo.wav'), 'whoosh': whoosh, 'hits': hits, 'ticks': ticks,
        'riser': [anchor(x) for x in mu['riser']] if mu.get('riser') else None, 'stop': [anchor(x) for x in mu['stop']] if mu.get('stop') else None}
json.dump(plan, open(os.path.join(BUILD, 'audio.json'), 'w'))
mix = os.path.join(BUILD, 'mix.wav'); sh([sys.executable, os.path.join(HERE, 'audio.py'), os.path.join(BUILD, 'audio.json'), mix])

# ---- 5. final: footage + graphics + audio, loudness -14 LUFS
slug = re.sub(r'[^A-Za-z0-9]+', '-', A.get('title', os.path.basename(AD))).strip('-')
final = os.path.join(OUT, slug + '.mp4')
ff('-i', base, '-framerate', FPS, '-i', os.path.join(trk + '-frames', 'f%05d.png'), '-i', mix,
   '-filter_complex', '[0:v][1:v]overlay=format=auto,format=yuv420p[v];[2:a]loudnorm=I=-14:TP=-1.0:LRA=11[a]',
   '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', 19, '-preset', 'medium', '-c:a', 'aac', '-b:a', '192k', '-ar', 48000,
   '-movflags', '+faststart', '-t', DUR, final)
shutil.rmtree(trk + '-frames', ignore_errors=True)
ff('-i', final, '-vf', 'fps=0.5,scale=270:-2,tile=8x3:padding=6:color=0x0b1424', '-frames:v', 1, '-q:v', 3, os.path.join(OUT, 'sheet.jpg'))
json.dump({'duration': DUR, 'shots': [{k: v for k, v in s.items()} for s in shots], 'gfx': items, 'lines': VO['lines']}, open(os.path.join(OUT, 'timeline.json'), 'w'), indent=1)
print(f'ad -> {final} ({DUR:.1f}s)')
