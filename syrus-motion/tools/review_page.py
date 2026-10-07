#!/usr/bin/env python3
"""Build the review pages (artifact sites) for the motion pack and the ad cuts.

usage: python3 tools/review_page.py <out-dir> [pack|ads|masters ...]
  pack    -> <out>/pack/index.html + m/ (previews) p/ (posters) d/ (webm / mp4 downloads)
  ads     -> <out>/ads/index.html + d/ (one <=14 MB 1080x1920 mp4 per ad, used for playback and download)
  masters -> <out>/masters/index.html + z/ (lossless PNG-in-MOV alpha masters zipped per item, <=15 MB each)
Data: pack/manifest.json (+ each pack folder's files), ads/<client>/<ad>/ad.json + out/*.mp4 + ads/notes.json.
"""
import json, os, re, subprocess, sys, html, shutil, zipfile

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
OUT = os.path.abspath(sys.argv[1]); WHAT = sys.argv[2:] or ['pack', 'ads', 'masters']
MAX_FILE = 14.6e6
LINKS = json.load(open(os.path.join(OUT, 'links.json'))) if os.path.exists(os.path.join(OUT, 'links.json')) else {}   # {pack, ads, masters: artifact urls}


def sh(*a):
    r = subprocess.run([str(x) for x in a], capture_output=True, text=True)
    if r.returncode: sys.exit('FAILED: ' + ' '.join(map(str, a))[:300] + '\n' + r.stderr[-800:])
    return r.stdout


def dur(f): return float(sh('ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f).strip() or 0)


def tc(s):   # seconds -> HH:MM:SS:FF at 30 fps (editors read timecode)
    f = int(round(s * 30)); return f'{f // 108000:02d}:{f // 1800 % 60:02d}:{f // 30 % 60:02d}:{f % 30:02d}'


def fresh(src, dst): return os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src)


def poster(src, dst, t):
    if not fresh(src, dst): sh('ffmpeg', '-y', '-v', 'error', '-ss', f'{t:.2f}', '-i', src, '-frames:v', 1, '-vf', 'scale=360:-2', '-q:v', 4, dst)


def small(src, dst, w=540, crf=27):
    if not fresh(src, dst):
        sh('ffmpeg', '-y', '-v', 'error', '-i', src, '-vf', f'scale={w}:-2,format=yuv420p', '-c:v', 'libx264', '-crf', crf, '-preset', 'slow',
           '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', dst)


def fit_mp4(src, dst):   # 1080x1920 H.264 under MAX_FILE: two-pass at the bitrate the duration allows
    if fresh(src, dst): return
    d = dur(src); kbps = int(min(6000, (MAX_FILE * 8 / d) / 1000 - 140))
    log = dst + '.2pass'
    sh('ffmpeg', '-y', '-v', 'error', '-i', src, '-c:v', 'libx264', '-preset', 'slow', '-b:v', f'{kbps}k', '-pass', 1, '-passlogfile', log, '-an', '-f', 'mp4', '/dev/null')
    sh('ffmpeg', '-y', '-v', 'error', '-i', src, '-c:v', 'libx264', '-preset', 'slow', '-b:v', f'{kbps}k', '-maxrate', f'{int(kbps * 1.6)}k', '-bufsize', f'{kbps * 2}k',
       '-pass', 2, '-passlogfile', log, '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', dst)
    for f in os.listdir(os.path.dirname(dst)):
        if f.startswith(os.path.basename(log)): os.remove(os.path.join(os.path.dirname(dst), f))


def page(title, desc, body, data):
    tpl = open(os.path.join(HERE, 'review_page.html')).read(); data = {**data, 'links': LINKS}
    return (tpl.replace('{{TITLE}}', html.escape(title)).replace('{{DESC}}', html.escape(desc))
               .replace('{{BODY}}', body).replace('{{DATA}}', json.dumps(data).replace('</', '<\\/')))


def build_pack():
    out = os.path.join(OUT, 'pack'); [os.makedirs(os.path.join(out, k), exist_ok=True) for k in 'mpd']
    items = []
    for m in json.load(open(os.path.join(ROOT, 'pack', 'manifest.json'))):
        d = os.path.join(ROOT, 'pack', m['id']); fs = os.listdir(d)
        prev = next((f for f in fs if f.endswith('-preview.mp4')), None)
        full = next((f for f in fs if f.endswith('.mp4') and not f.endswith('-preview.mp4') and 'matte' not in f), None)
        webm = next((f for f in fs if f.endswith('.webm')), None)
        mov = next((f for f in fs if f.endswith('.mov')), None)
        alpha = bool(webm)
        src = os.path.join(d, prev or full); D = dur(os.path.join(d, webm or full))
        small(src, os.path.join(out, 'm', m['id'] + '.mp4'), 540 if not prev else 540, 28 if prev else 27)
        poster(src, os.path.join(out, 'p', m['id'] + '.jpg'), (D / 2 if m['group'] == 'transition' else max(0.1, D - 0.55)) if webm else min(D * 0.62, D - 0.2))   # overlays: settled end state; transitions: fully covered middle
        dl = []
        if webm: shutil.copy2(os.path.join(d, webm), os.path.join(out, 'd', m['id'] + '.webm')); dl.append({'label': 'WebM (transparent)', 'path': f"d/{m['id']}.webm", 'name': webm})
        if mov:   # fill + luma matte pair: works in any editor with a track matte (Premiere: Track Matte Key, Matte Luma)
            src_mov = os.path.join(d, mov); fill, mat = (os.path.join(out, 'd', f"{m['id']}-{k}.mp4") for k in ('fill', 'matte'))
            if not (fresh(src_mov, fill) and fresh(src_mov, mat)):
                sh('ffmpeg', '-y', '-v', 'error', '-i', src_mov, '-filter_complex', '[0]format=rgba,split[a][b];[a]format=rgb24,format=yuv420p[f];[b]alphaextract,format=yuv420p[m]',
                   '-map', '[f]', '-c:v', 'libx264', '-crf', 14, '-preset', 'slow', '-movflags', '+faststart', fill,
                   '-map', '[m]', '-c:v', 'libx264', '-crf', 14, '-preset', 'slow', '-movflags', '+faststart', mat)
            stem = mov[:-4]
            dl += [{'label': 'Fill MP4', 'path': f"d/{m['id']}-fill.mp4", 'name': stem + '-fill.mp4'},
                   {'label': 'Matte MP4', 'path': f"d/{m['id']}-matte.mp4", 'name': stem + '-matte.mp4'}]
        if full:
            dst = os.path.join(out, 'd', m['id'] + '.mp4')
            if os.path.getsize(os.path.join(d, full)) <= MAX_FILE: shutil.copy2(os.path.join(d, full), dst)
            else: fit_mp4(os.path.join(d, full), dst)
            dl.append({'label': 'MP4 1080x1920', 'path': f"d/{m['id']}.mp4", 'name': full})
        matte = next((f for f in fs if 'matte' in f and f.endswith('.mp4')), None)
        if matte: shutil.copy2(os.path.join(d, matte), os.path.join(out, 'd', m['id'] + '-wipe-matte.mp4')); dl.append({'label': 'Wipe matte MP4', 'path': f"d/{m['id']}-wipe-matte.mp4", 'name': matte})
        items.append({**m, 'alpha': alpha, 'dur': round(D, 2), 'tc': tc(D), 'frames': int(round(D * 30)), 'mov': bool(mov),
                      'movMB': round(os.path.getsize(os.path.join(d, mov)) / 1e6, 1) if mov else None, 'dl': dl,
                      'preview': f"m/{m['id']}.mp4", 'poster': f"p/{m['id']}.jpg"})
    open(os.path.join(out, 'index.html'), 'w').write(page('Syrus Motion Pack', 'pack', '', {'kind': 'pack', 'items': items}))
    print('pack', len(items), 'items ->', out)


def build_ads():
    out = os.path.join(OUT, 'ads'); [os.makedirs(os.path.join(out, k), exist_ok=True) for k in 'dp']
    notes = json.load(open(os.path.join(ROOT, 'ads', 'notes.json')))
    ads = []
    for n in notes['ads']:
        ad_dir = os.path.join(ROOT, 'ads', n['dir']); A = json.load(open(os.path.join(ad_dir, 'ad.json')))
        mp4 = [f for f in os.listdir(os.path.join(ad_dir, 'out')) if f.endswith('.mp4')]
        if not mp4: print('  missing render:', n['dir']); continue
        src = os.path.join(ad_dir, 'out', mp4[0]); slug = os.path.basename(n['dir'])
        fit_mp4(src, os.path.join(out, 'd', slug + '.mp4')); poster(src, os.path.join(out, 'p', slug + '.jpg'), n.get('poster', 2.0))
        D = dur(src)
        ads.append({**n, 'slug': slug, 'title': A.get('title', slug), 'dur': round(D, 1), 'tc': tc(D), 'file': f'd/{slug}.mp4', 'name': mp4[0],
                    'poster': f'p/{slug}.jpg', 'mb': round(os.path.getsize(os.path.join(out, 'd', slug + '.mp4')) / 1e6, 1)})
    open(os.path.join(out, 'index.html'), 'w').write(page('Syrus Ad Cuts', 'ads', '', {'kind': 'ads', 'clients': notes['clients'], 'ads': ads}))
    print('ads', len(ads), '->', out)


def build_masters():
    out = os.path.join(OUT, 'masters'); os.makedirs(os.path.join(out, 'z'), exist_ok=True)
    items, big = [], []
    for m in json.load(open(os.path.join(ROOT, 'pack', 'manifest.json'))):
        d = os.path.join(ROOT, 'pack', m['id']); mov = next((f for f in os.listdir(d) if f.endswith('.mov')), None)
        if not mov: continue
        size = os.path.getsize(os.path.join(d, mov))
        if size > MAX_FILE: big.append({'id': m['id'], 'title': m['title'], 'mb': round(size / 1e6, 1)}); continue
        z = os.path.join(out, 'z', m['id'] + '.zip')
        if not fresh(os.path.join(d, mov), z):
            with zipfile.ZipFile(z, 'w', zipfile.ZIP_STORED) as zf: zf.write(os.path.join(d, mov), mov)
        items.append({'id': m['id'], 'title': m['title'], 'group': m['group'], 'mb': round(os.path.getsize(z) / 1e6, 1), 'path': f"z/{m['id']}.zip", 'name': m['id'] + '.zip'})
    open(os.path.join(out, 'index.html'), 'w').write(page('Syrus Motion Masters', 'masters', '', {'kind': 'masters', 'items': items, 'big': big}))
    print('masters', len(items), 'zips,', len(big), 'too big ->', out, f"{sum(i['mb'] for i in items):.0f} MB")


def build_house():
    """The 10 house-style ads: gap list + measured house numbers + every ad scored + the videos by client."""
    H = os.path.join(ROOT, 'ads', 'house'); out = os.path.join(OUT, 'house'); [os.makedirs(os.path.join(out, k), exist_ok=True) for k in 'dpa']
    notes = json.load(open(os.path.join(H, 'notes.json')))
    rep = json.load(open(os.path.join(H, 'report.json'))) if os.path.exists(os.path.join(H, 'report.json')) else {'house': {}, 'ads': []}
    score = {r['dir']: r for r in rep['ads']}
    gap = []   # the GAP-LIST.md table -> rows
    for ln in open(os.path.join(H, 'GAP-LIST.md')):
        cells = [c.strip() for c in ln.strip().strip('|').split('|')]
        if len(cells) == 5 and cells[0].isdigit(): gap.append({'n': int(cells[0]), 'what': cells[1].strip('*'), 'ours': cells[2], 'house': cells[3], 'fix': cells[4]})
    ads = []
    for n in notes['ads']:
        ad_dir = os.path.join(H, n['dir']); A = json.load(open(os.path.join(ad_dir, 'ad.json')))
        mp4 = [f for f in os.listdir(os.path.join(ad_dir, 'out')) if f.endswith('.mp4')] if os.path.isdir(os.path.join(ad_dir, 'out')) else []
        if not mp4: print('  missing render:', n['dir']); continue
        src = os.path.join(ad_dir, 'out', mp4[0]); slug = n['dir'].replace('/', '-')
        fit_mp4(src, os.path.join(out, 'd', slug + '.mp4')); poster(src, os.path.join(out, 'p', slug + '.jpg'), n.get('poster', 2.0))
        D = dur(src)
        ads.append({**n, 'slug': slug, 'title': A.get('title', slug), 'dur': round(D, 1), 'tc': tc(D), 'file': f'd/{slug}.mp4', 'name': mp4[0],
                    'poster': f'p/{slug}.jpg', 'mb': round(os.path.getsize(os.path.join(out, 'd', slug + '.mp4')) / 1e6, 1), 'score': score.get(n['dir'])})
    aud = []
    for f in sorted(os.listdir(os.path.join(H, 'vo-audition'))):
        if f.endswith('.mp3'): shutil.copy2(os.path.join(H, 'vo-audition', f), os.path.join(out, 'a', f)); aud.append({'file': f'a/{f}', 'name': f})
    open(os.path.join(out, 'index.html'), 'w').write(page('Syrus House-Style Ads', 'house', '', {'kind': 'house', 'clients': notes['clients'], 'ads': ads,
                                                                                         'gap': gap, 'house': rep['house'], 'audition': aud}))
    print('house', len(ads), 'ads ->', out)


for w in WHAT: {'pack': build_pack, 'ads': build_ads, 'masters': build_masters, 'house': build_house}[w]()
