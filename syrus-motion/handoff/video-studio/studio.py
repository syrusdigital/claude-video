#!/usr/bin/env python3
"""Video Studio: the driver Codex runs to edit Rafael's videos. Read AGENTS.md first.

  python3 studio.py doctor                     check the tools
  python3 studio.py selftest                   build two test videos end to end
  python3 studio.py new NAME                   start a project
  python3 studio.py get NAME LINK|FILE ...     download or copy clips into projects/NAME/raw
  python3 studio.py look NAME                  view footage: info, contact sheets, word-timed transcripts
  python3 studio.py rough NAME [CLIP ...]      draft edit.json: keep the speech, drop pauses and ums
  python3 studio.py cut NAME [--preset P] [--draft]   render projects/NAME/out/NAME-P.mp4, then check it
  python3 studio.py check FILE.mp4 [--preset P]
  python3 studio.py deliver NAME               copy the finals to the Exports folder
"""
import argparse, io, json, math, os, platform, re, shutil, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PROJ, BRAND = ROOT / 'projects', ROOT / 'brand'
WIN = platform.system() == 'Windows'
VENV_PY = ROOT / '.venv' / ('Scripts/python.exe' if WIN else 'bin/python')
if VENV_PY.exists() and Path(sys.prefix).resolve() != (ROOT / '.venv').resolve():   # always run inside the studio's own Python
    sys.exit(subprocess.call([str(VENV_PY), __file__, *sys.argv[1:]]))

VIDEO_EXT = {'.mp4', '.mov', '.m4v', '.mkv', '.avi', '.webm', '.mts', '.3gp'}
IMAGE_EXT = {'.jpg', '.jpeg', '.png', '.heic', '.webp'}
FPS, LUFS, TP = 30, -14.0, -1.0
PRESETS = {'reel': (1080, 1920), 'youtube': (1920, 1080), 'square': (1080, 1080)}
# caption size, caption bottom margin, side margin, lower-third y, hook top margin, logo width, logo top
LAYOUT = {'reel': (84, 560, 80, 1170, 250, 170, 170), 'youtube': (60, 70, 160, 870, 70, 200, 50),
          'square': (66, 110, 80, 830, 70, 150, 50)}
STYLES = {  # pause kept at a cut, words per caption, jump-cut zoom, music under the voice (dB), word-by-word highlight
    'calm': {'pad': 0.16, 'gap': 0.55, 'words': 4, 'zoom': 1.06, 'music': -18, 'karaoke': False},
    'standard': {'pad': 0.12, 'gap': 0.40, 'words': 3, 'zoom': 1.10, 'music': -14, 'karaoke': True},
    'punchy': {'pad': 0.08, 'gap': 0.28, 'words': 2, 'zoom': 1.15, 'music': -11, 'karaoke': True}}
S_CURVE = "curves=all='0/0 0.25/0.235 0.75/0.765 1/1'"
LOOKS = {'none': (None, 1.0, ''), 'natural': (S_CURVE, 1.04, ''),   # tone curve, saturation, colour balance
         'warm': (S_CURVE, 1.06, 'colorbalance=rm=0.03:bm=-0.03:rh=0.02:bh=-0.02'),
         'clinical': ("curves=all='0/0 0.25/0.23 0.75/0.77 1/1'", 0.96, 'colorbalance=rm=-0.01:bm=0.02:bh=0.01')}
VOICE = ('highpass=f=80,afftdn=nr=10:nf=-40,equalizer=f=250:t=q:w=1:g=-2,equalizer=f=3500:t=q:w=1.2:g=2.5,'
         'acompressor=threshold=-20dB:ratio=3:attack=10:release=120:makeup=2')
FILLERS = {'um', 'uh', 'umm', 'uhm', 'uhh', 'erm', 'hmm', 'mm', 'ah', 'eh'}
LUMA = (0.2126, 0.7152, 0.0722)
PROFILE = {'name': '', 'title': '', 'language': 'auto', 'presets': ['reel'], 'style': 'calm', 'look': 'natural',
           'accent': '#FFD54A', 'font': 'Arial', 'logo': 'end', 'end_text': '', 'music': None,
           'exports': '~/Desktop/VideoStudio Exports', 'model': 'small', 'fixes': {}}


# ---------- helpers
def die(msg): print('ERROR: ' + msg); sys.exit(1)

def run(cmd, cwd=None, check=True, text=True):
    r = subprocess.run([str(c) for c in cmd], cwd=cwd, capture_output=True, **({'text': True, 'errors': 'replace'} if text else {}))
    if check and r.returncode:
        err = r.stderr if text else r.stderr.decode('utf-8', 'replace')
        print(' '.join(map(str, cmd))[:800]); print(err[-3000:]); die(Path(str(cmd[0])).name + ' failed (see above)')
    return r

def ff(*a, cwd=None): return run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *a], cwd=cwd)

def load(p, default=None):
    try: return json.loads(Path(p).read_text(encoding='utf-8'))
    except (OSError, ValueError): return default

def save(p, obj): Path(p).write_text(json.dumps(obj, indent=2, ensure_ascii=False), encoding='utf-8')

def slug(s): return re.sub(r'[^A-Za-z0-9._-]+', '-', s).strip('-.') or 'clip'

def project(name, make=False):
    d = PROJ / slug(name)
    if make:
        for sub in ('raw', 'look', 'work', 'out'): (d / sub).mkdir(parents=True, exist_ok=True)
    elif not d.exists(): die(f'no project "{name}" (python3 studio.py new {name})')
    return d

def profile():
    p = {**PROFILE, **load(BRAND / 'profile.json', {})}
    p['fixes'] = {**load(ROOT / 'fixes.json', {}), **p.get('fixes', {})}
    return p

def frames(sec): return max(1, round(sec * FPS)) / FPS

def even(x): return max(2, int(round(x / 2)) * 2)

_FILTERS = None
def has_filter(name):
    global _FILTERS
    if _FILTERS is None: _FILTERS = run(['ffmpeg', '-hide_banner', '-filters'], check=False).stdout
    return re.search(r'\s%s\s' % re.escape(name), _FILTERS) is not None

_PROBES = {}
def probe(path):
    path = str(path)
    if path in _PROBES: return _PROBES[path]
    j = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path]).stdout)
    v = next((s for s in j['streams'] if s['codec_type'] == 'video'), None)
    a = next((s for s in j['streams'] if s['codec_type'] == 'audio'), None)
    info = {'duration': float(j['format'].get('duration') or 0), 'audio': a is not None, 'image': Path(path).suffix.lower() in IMAGE_EXT}
    if v:
        w, h, rot = int(v['width']), int(v['height']), 0
        for sd in v.get('side_data_list') or []:
            if 'rotation' in sd: rot = int(float(sd['rotation']))
        rot = int(float(v.get('tags', {}).get('rotate', rot)))
        if abs(rot) % 180 == 90: w, h = h, w
        n, d = (v.get('avg_frame_rate') or '0/1').split('/')
        info.update(w=w, h=h, fps=round(float(n) / float(d), 2) if float(d) else 0, codec=v.get('codec_name'),
                    trc=v.get('color_transfer', ''), prim=v.get('color_primaries', ''), matrix=v.get('color_space', ''),
                    pix=v.get('pix_fmt', ''))
        info['hdr'] = info['trc'] in ('arib-std-b67', 'smpte2084')
    _PROBES[path] = info
    return info

def tonemap(info):
    """iPhone/Android HDR (HLG or PQ) looks grey and washed out unless it is tone-mapped to normal video."""
    if not info.get('hdr') or not has_filter('zscale'): return ''
    return (f"zscale=tin={info['trc']}:pin={info['prim'] or 'bt2020'}:min={info['matrix'] or 'bt2020nc'}:t=linear:npl=100,"
            'format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p')

def grab(path, times, pre='', size=96, image=False):
    """Small RGB frames (0..1) at the given times, for measuring."""
    import numpy as np
    out = []
    for t in times:
        vf = ','.join(x for x in (pre, f'scale={size}:{size}', 'format=rgb24') if x)
        src = ['-i', str(path)] if image else ['-ss', f'{max(0, t):.3f}', '-i', str(path)]
        r = subprocess.run(['ffmpeg', '-v', 'error', *src, '-frames:v', '1', '-vf', vf, '-f', 'rawvideo', '-'], capture_output=True)
        if len(r.stdout) == size * size * 3: out.append(np.frombuffer(r.stdout, np.uint8).reshape(size, size, 3))
    return np.array(out, float) / 255 if out else None

def loud(path):
    r = run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-vn', '-af', f'loudnorm=I={LUFS}:TP={TP}:LRA=11:print_format=json',
             '-f', 'null', '-'], check=False)
    m = re.search(r'\{[^{}]*"input_i"[^{}]*\}', r.stderr, re.S)
    if not m: return None
    j = json.loads(m.group(0))
    return {k: float(v) if v not in ('-inf', 'inf') else (-99.0 if v == '-inf' else 99.0) for k, v in j.items() if k != 'normalization_type'}

def sheet(path, out, n=12, cols=6, width=1800, pre=None, label=''):
    """A contact sheet: n frames across the clip, each stamped with its time. Codex opens these to SEE the footage."""
    from PIL import Image, ImageDraw, ImageFont
    info = probe(path); D = info['duration'] or 1
    tw = width // cols; pre = tonemap(info) if pre is None else pre
    try: font = ImageFont.load_default(size=max(14, tw // 12))
    except TypeError: font = ImageFont.load_default()
    thumbs = []
    for i in range(n):
        t = 0 if info['image'] else D * (i + 0.5) / n
        vf = ','.join(x for x in (pre, f'scale={tw}:-2') if x)
        src = ['-i', str(path)] if info['image'] else ['-ss', f'{t:.3f}', '-i', str(path)]
        r = subprocess.run(['ffmpeg', '-v', 'error', *src, '-frames:v', '1', '-vf', vf, '-f', 'image2pipe', '-vcodec', 'png', '-'], capture_output=True)
        if not r.stdout: continue
        im = Image.open(io.BytesIO(r.stdout)).convert('RGB'); d = ImageDraw.Draw(im)
        txt = f'{t:.1f}s'; box = d.textbbox((0, 0), txt, font=font)
        d.rectangle((0, 0, box[2] + 12, box[3] + 10), fill=(0, 0, 0)); d.text((6, 4), txt, fill=(255, 220, 80), font=font)
        thumbs.append(im)
        if info['image']: break
    if not thumbs: return None
    th = max(im.height for im in thumbs); rows = math.ceil(len(thumbs) / cols); top = 36 if label else 0
    g = Image.new('RGB', (tw * min(cols, len(thumbs)), th * rows + top), (20, 20, 20))
    if label: ImageDraw.Draw(g).text((8, 8), label, fill=(255, 255, 255), font=font)
    for i, im in enumerate(thumbs): g.paste(im, ((i % cols) * tw, top + (i // cols) * th))
    g.save(out, quality=85)
    return out


# ---------- colour: measure each shot and bring it to one house target, so every shot matches
_COLOR = {}
def autocolor(path, info, t0, t1, exposure=0.0):
    key = (str(path), round(t0, 2), round(t1, 2), exposure)
    if key not in _COLOR: _COLOR[key] = _autocolor(path, info, t0, t1, exposure)
    return _COLOR[key]

def _autocolor(path, info, t0, t1, exposure):
    import numpy as np
    image = info['image']
    ts = [t0] if image else [t0 + (t1 - t0) * (i + 0.5) / 5 for i in range(5)]
    a = grab(path, ts, tonemap(info), image=image)
    if a is None: return '', {}
    Y = a @ LUMA
    if ((Y > 0.96) | (Y < 0.03)).mean() > 0.35: return '', {'kind': 'screen'}   # slides / screen recording: leave as is
    before = float(Y.mean()); s = 0.7
    lo = min(float(np.percentile(Y, 0.5)), 0.10) * s
    hi = 1 - (1 - max(float(np.percentile(Y, 99.5)), 0.70)) * s
    a = np.clip((a - lo) / (hi - lo), 0, 1)
    Y = a @ LUMA; mx, mn = a.max(-1), a.min(-1); sat = (mx - mn) / np.maximum(mx, 1e-3)
    m = (Y > 0.15) & (Y < 0.85) & (sat < 0.35)            # near-neutral mid-tones: white balance (grey world)
    gr = gb = 1.0
    if m.mean() > 0.02:
        r, g, b = (float(a[m][:, i].mean()) for i in range(3))
        gr = float(np.clip(1 + (g / max(r, 1e-3) - 1) * 0.6, 0.88, 1.12)); gb = float(np.clip(1 + (g / max(b, 1e-3) - 1) * 0.6, 0.88, 1.12))
    k = 1 / (LUMA[0] * gr + LUMA[1] + LUMA[2] * gb); gains = (gr * k, k, gb * k)
    a = np.clip(a * gains, 0, 1); Y = a @ LUMA
    gamma = float(np.clip(math.log(float(np.clip(Y.mean(), 0.05, 0.95))) / math.log(0.45 + exposure), 0.85, 1.45))   # brighten dark shots fully, darken bright rooms only gently
    a = a ** (1 / gamma); mx, mn = a.max(-1), a.min(-1)
    sm = float(((mx - mn) / np.maximum(mx, 1e-3))[(a @ LUMA) > 0.1].mean()) if ((a @ LUMA) > 0.1).any() else 0
    sat_f = 1.0 if sm < 0.06 else float(np.clip(0.30 / sm, 0.90, 1.25))
    f = [f'colorlevels=rimin={lo:.4f}:gimin={lo:.4f}:bimin={lo:.4f}:rimax={hi:.4f}:gimax={hi:.4f}:bimax={hi:.4f}',
         mixer(gains, sat_f), f'lutrgb=r=gammaval({1 / gamma:.4f}):g=gammaval({1 / gamma:.4f}):b=gammaval({1 / gamma:.4f})']
    if before < 0.30: f.insert(0, 'hqdn3d=2:2:6:6')   # dark shots get lifted, so take the noise down first
    return ','.join(f), {'kind': 'camera', 'luma_before': round(before, 3), 'gamma': round(gamma, 3), 'sat': round(sat_f, 3)}

def mixer(gains=(1, 1, 1), sat=1.0):
    """One colorchannelmixer that applies white-balance gains and a saturation change."""
    lr, lg, lb = LUMA; s = sat
    M = [[lr * (1 - s) + s, lg * (1 - s), lb * (1 - s)], [lr * (1 - s), lg * (1 - s) + s, lb * (1 - s)], [lr * (1 - s), lg * (1 - s), lb * (1 - s) + s]]
    names = 'rgb'
    return 'colorchannelmixer=' + ':'.join(f'{names[i]}{names[j]}={M[i][j] * gains[j]:.4f}' for i in range(3) for j in range(3))

def look_filter(name):
    curve, sat, bal = LOOKS.get(name, LOOKS['natural'])
    return ','.join(x for x in (curve, mixer(sat=sat) if sat != 1.0 else '', bal) if x)


# ---------- framing: fill the frame (crop) or show it whole over a blurred copy (blur)
def framing(info, W, H, fit='auto', fx=0.5, fy=0.5, zoom=1.0, kind='camera', tag='f', src='c'):
    sw, sh = info['w'], info['h']; sar, tar = sw / sh, W / H
    if fit == 'auto':
        fit = 'crop' if (abs(sar - tar) / tar < 0.3 or (sar > tar and kind != 'screen')) else 'blur'
    if fit == 'crop':
        k = max(W / sw, H / sh) * zoom; w, h = even(sw * k), even(sh * k)
        x, y = int((w - W) * min(max(fx, 0), 1)), int((h - H) * min(max(fy, 0), 1))
        return f'[{src}]scale={w}:{h}:flags=lanczos,crop={W}:{H}:{x}:{y}[{tag}]'
    kb = max(W / sw, H / sh); kf = min(W / sw, H / sh) * zoom
    bw, bh, fw, fh = even(sw * kb), even(sh * kb), even(min(sw * kf, W * zoom)), even(min(sh * kf, H * zoom))
    return (f'[{src}]split[{tag}a][{tag}b];[{tag}a]scale={bw // 4 * 2}:{bh // 4 * 2},boxblur=20:2,scale={bw}:{bh},crop={W}:{H},'
            f'lutrgb=r=val*0.7:g=val*0.7:b=val*0.7[{tag}g];[{tag}b]scale={fw}:{fh}:flags=lanczos[{tag}h];'
            f'[{tag}g][{tag}h]overlay=(W-w)/2:(H-h)/2[{tag}]')

def blur_boxes(boxes, W, H, src, tag):
    """Hide private details (names, faces, records): boxes are [x, y, w, h] as fractions of the finished frame."""
    if not boxes: return '', src
    out, cur = [], src
    for i, (x, y, w, h) in enumerate(boxes):
        bx, by, bw, bh = int(x * W), int(y * H), even(w * W), even(h * H)
        out.append(f'[{cur}]split[q{i}a][q{i}b];[q{i}b]crop={bw}:{bh}:{bx}:{by},boxblur=25:4[q{i}c];[q{i}a][q{i}c]overlay={bx}:{by}[q{i}]')
        cur = f'q{i}'
    return ';'.join(out) + ';', cur


# ---------- words: whisper with Rafael's vocabulary, then his spelling fixes
def vocab_prompt():
    p = ROOT / 'vocab.txt'
    words = [w.strip() for w in p.read_text(encoding='utf-8').splitlines() if w.strip() and not w.startswith('#')] if p.exists() else []
    return ', '.join(words)[:700] or None

def speech(path, dur):
    """Where he is actually talking, from the audio level (exact to ~10 ms). Silences = everything quieter than his
    average level minus 16 dB for at least 0.3 s."""
    vd = run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-vn', '-af', 'volumedetect', '-f', 'null', '-'], check=False).stderr
    m = re.search(r'mean_volume: (-?[\d.]+) dB', vd); thr = min(-30.0, max(-50.0, (float(m.group(1)) if m else -30) - 16))
    sd = run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-vn', '-af', f'silencedetect=n={thr:.1f}dB:d=0.3', '-f', 'null', '-'], check=False).stderr
    marks = [(k, float(v)) for k, v in re.findall(r'silence_(start|end): (-?[\d.]+)', sd)]
    isl, cur = [], 0.0
    for k, v in marks:
        if k == 'start':
            if v - cur >= 0.2: isl.append([round(cur, 3), round(v, 3)])
            cur = None
        else: cur = v
    if cur is not None and dur - cur >= 0.2: isl.append([round(cur, 3), round(dur, 3)])
    return isl

_MODEL = None
def transcribe(path, model, lang, islands):
    """Each stretch of speech is transcribed on its own: timings cannot smear across a pause, and a retake of the
    same sentence gets its own words (Whisper skips repeats inside one long chunk)."""
    global _MODEL
    import numpy as np
    from faster_whisper import WhisperModel
    if _MODEL is None or _MODEL[0] != model: _MODEL = (model, WhisperModel(model, device='cpu', compute_type='int8'))
    pcm = np.frombuffer(run(['ffmpeg', '-v', 'error', '-i', path, '-vn', '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], text=False).stdout, np.float32)
    dur = len(pcm) / 16000; chunks = []
    for a, b in islands:   # breaths under 0.5 s stay inside one chunk; longer pauses split
        if chunks and a - chunks[-1][1] < 0.5 and b - chunks[-1][0] < 25: chunks[-1][1] = b
        else: chunks.append([a, b])
    lang = None if lang in (None, '', 'auto') else lang; words = []
    for a, b in chunks:
        a0, b0 = max(0, a - 0.15), min(dur, b + 0.15)
        segs, inf = _MODEL[1].transcribe(pcm[int(a0 * 16000):int(b0 * 16000)], language=lang, word_timestamps=True, vad_filter=False,
                                         condition_on_previous_text=False, initial_prompt=vocab_prompt(), beam_size=5)
        segs = list(segs)
        if lang is None and b - a > 2: lang = inf.language
        for w in (w for sg in segs if sg.no_speech_prob < 0.7 for w in (sg.words or []) if w.word.strip()):
            ws, we = a0 + w.start, a0 + w.end
            for s_, e_ in zip([x[1] for x in islands], [x[0] for x in islands[1:]]):   # silences inside the chunk
                if ws < s_ < we: we = s_ if ws < s_ - 0.05 else we
                if s_ <= ws < e_: ws = e_
            words.append({'w': w.word.strip(), 's': round(ws, 3), 'e': round(max(we, ws + 0.05), 3)})
    return words, lang or 'en'

def fix_words(words, fixes):
    """Apply spelling fixes, e.g. {"glio blastoma": "glioblastoma"}; multi-word keys merge words."""
    if not fixes: return words
    words = [dict(w) for w in words]
    for key, val in sorted(fixes.items(), key=lambda kv: -len(kv[0].split())):
        toks = key.lower().split(); n = len(toks); i = 0
        while i <= len(words) - n:
            core = [re.sub(r'[^\w\'-]', '', words[i + j]['w'].lower()) for j in range(n)]
            if core == toks:
                tail = re.sub(r'^.*?([.,!?;:]*)$', r'\1', words[i + n - 1]['w'])
                words[i:i + n] = [{'w': val + tail, 's': words[i]['s'], 'e': words[i + n - 1]['e']}]
            i += 1
    return words

def clean(w): return re.sub(r'[^\w\'-]', '', w.lower())


# ---------- commands
def cmd_doctor(a):
    ok = True
    def line(good, what, fix=''):
        nonlocal ok; ok &= good; print(('OK      ' if good else 'MISSING ') + what + ('' if good else '  ->  ' + fix))
    line(sys.version_info >= (3, 9), f'Python {platform.python_version()}', 'install Python 3.10+')
    mac, win = platform.system() == 'Darwin', WIN
    hint = 'brew install ffmpeg' if mac else ('winget install -e --id Gyan.FFmpeg' if win else 'sudo apt install ffmpeg')
    for tool in ('ffmpeg', 'ffprobe'): line(shutil.which(tool) is not None, tool, hint)
    if shutil.which('ffmpeg'):
        for f in ('subtitles', 'zscale', 'loudnorm', 'sidechaincompress', 'colorlevels', 'lutrgb', 'boxblur'):
            line(has_filter(f), f'ffmpeg filter {f}', 'reinstall a full ffmpeg build: ' + hint)
        enc = run(['ffmpeg', '-hide_banner', '-encoders'], check=False).stdout
        line(' libx264 ' in enc, 'ffmpeg encoder libx264', hint)
    for mod, pip in (('faster_whisper', 'faster-whisper'), ('numpy', 'numpy'), ('PIL', 'pillow'), ('yt_dlp', 'yt-dlp'), ('gdown', 'gdown')):
        try: __import__(mod); line(True, f'python module {mod}')
        except ImportError: line(False, f'python module {mod}', f'{VENV_PY} -m pip install -r requirements.txt')
    line(VENV_PY.exists(), 'studio Python (.venv)', 'python3 -m venv .venv  then  .venv pip install -r requirements.txt')
    print('\nALL GOOD' if ok else '\nFix the MISSING lines, then run doctor again.')
    sys.exit(0 if ok else 1)

def cmd_new(a):
    d = project(a.name, make=True)
    if not (d / 'edit.json').exists(): save(d / 'notes.json', {'created': True})
    print(f'project ready: {d}')

def cmd_get(a):
    d = project(a.name, make=True); raw = d / 'raw'
    for src in a.src:
        p = Path(os.path.expanduser(src))
        if p.exists():
            files = [x for x in sorted(p.rglob('*')) if x.suffix.lower() in VIDEO_EXT | IMAGE_EXT] if p.is_dir() else [p]
            for f in files:
                dst = raw / slug(f.name); shutil.copy2(f, dst); print('copied ', dst.name)
            continue
        if 'drive.google.com' in src and '/folders/' in src:
            run([sys.executable, '-m', 'gdown', '--folder', src, '-O', str(raw)])
        elif 'drive.google.com' in src or 'docs.google.com' in src:
            run([sys.executable, '-m', 'gdown', '--fuzzy', src, '-O', str(raw) + os.sep])
        elif re.search(r'dropbox\.com', src):
            run([sys.executable, '-m', 'yt_dlp', '-o', str(raw / '%(title).80B.%(ext)s'), re.sub(r'dl=0', 'dl=1', src)])
        else:
            run([sys.executable, '-m', 'yt_dlp', '-f', 'bv*+ba/b', '--merge-output-format', 'mp4', '--no-playlist',
                 '-o', str(raw / '%(title).80B.%(ext)s'), src])
        print('downloaded', src)
    for f in list(raw.iterdir()):   # safe names for ffmpeg; iPhone HEIC photos become JPG
        if f.name != slug(f.name): f = f.rename(raw / slug(f.name))
        if f.suffix.lower() == '.heic' and shutil.which('sips'):
            run(['sips', '-s', 'format', 'jpeg', f, '--out', f.with_suffix('.jpg')]); f.unlink()
    print('\n'.join(f'  {f.name}' for f in sorted(raw.iterdir())))

def cmd_look(a):
    d = project(a.name); P = profile(); raw = sorted(f for f in (d / 'raw').iterdir() if f.suffix.lower() in VIDEO_EXT | IMAGE_EXT)
    if not raw: die('no clips in raw/ (use get)')
    lines = [f'# {d.name}: {len(raw)} clips\n']
    for f in raw:
        info = probe(f); stem = f.stem; out = d / 'look'
        sh = out / f'{stem}.sheet.jpg'
        if not sh.exists() or sh.stat().st_mtime < f.stat().st_mtime:
            n = 1 if info['image'] else min(24, max(6, int(info['duration'] / 3)))
            sheet(f, sh, n=n, cols=8 if info.get('h', 0) > info.get('w', 0) else 6, label=f.name)
        desc = f"{f.name}: {info.get('w')}x{info.get('h')}"
        if not info['image']: desc += f" {info['duration']:.1f}s {info.get('fps')}fps"
        if info.get('hdr'): desc += ' HDR (auto tone-mapped)' + ('' if has_filter('zscale') else ' WARNING: ffmpeg has no zscale, HDR will look grey')
        if not info['audio'] and not info['image']: desc += ' NO AUDIO'
        words_p = out / f'{stem}.words.json'
        if info['audio'] and not a.no_words and (not words_p.exists() or words_p.stat().st_mtime < f.stat().st_mtime or a.redo):
            print(f'transcribing {f.name} ...', flush=True)
            isl = speech(f, info['duration'])
            words, lang = transcribe(f, a.model or P['model'], a.lang or P['language'], isl)
            save(words_p, {'lang': lang, 'words': words, 'speech': isl})
        W = load(words_p, {})
        if W:
            words = fix_words(W['words'], P['fixes']); txt, cur, t0 = [], [], None
            for i, w in enumerate(words):
                if t0 is None: t0 = w['s']
                cur.append(w['w'])
                nxt = words[i + 1] if i + 1 < len(words) else None
                if not nxt or nxt['s'] - w['e'] > 0.6 or re.search(r'[.!?]$', w['w']):
                    txt.append(f"[{t0:7.2f} - {w['e']:7.2f}] {' '.join(cur)}"); cur, t0 = [], None
            (out / f'{stem}.txt').write_text('\n'.join(txt), encoding='utf-8')
            desc += f" | {W.get('lang')} | {len(words)} words: {' '.join(x['w'] for x in words[:14])}..."
        lines.append(f'- {desc}\n  sheet: look/{sh.name}' + (f'\n  transcript: look/{stem}.txt' if W else ''))
        print(lines[-1])
    (d / 'look' / 'summary.md').write_text('\n'.join(lines), encoding='utf-8')
    print(f'\nOpen every sheet image and read every transcript in {d / "look"} before you cut.')

def cmd_rough(a):
    d = project(a.name); P = profile(); st = STYLES[P['style']]
    clips = a.clips or [f.name for f in sorted((d / 'raw').iterdir()) if (d / 'look' / f'{f.stem}.words.json').exists()]
    segs = []
    for c in clips:
        f = d / 'raw' / c; W = load(d / 'look' / f'{f.stem}.words.json', {}); dur = probe(f)['duration']
        words = W.get('words', [])
        blocks = []   # speech from the audio level, joined across pauses shorter than the style's gap
        for a_, b_ in W.get('speech') or [[w['s'], w['e']] for w in words]:
            if blocks and a_ - blocks[-1][1] < st['gap']: blocks[-1][1] = b_
            else: blocks.append([a_, b_])
        prev_end = 0.0
        for a_, b_ in blocks:
            said = [w for w in words if a_ - 0.05 <= (w['s'] + w['e']) / 2 <= b_ + 0.05]
            if not said or all(clean(w['w']) in FILLERS for w in said): continue   # breath, cough, noise or just "um"
            a_, b_ = max(a_, said[0]['s'] - 0.3), min(b_, said[-1]['e'] + 0.3)   # no long run-in or tail of room noise
            s0, e0 = max(prev_end, a_ - st['pad']), min(dur, b_ + st['pad'] + 0.04)
            text = ' '.join(w['w'] for w in said if clean(w['w']) not in FILLERS)
            if segs and segs[-1]['clip'] == c and s0 - segs[-1]['out'] < 0.12:
                segs[-1]['out'] = round(e0, 2); segs[-1]['text'] += ' ' + text
            else: segs.append({'clip': c, 'in': round(s0, 2), 'out': round(e0, 2), 'text': text})
            prev_end = e0
    ed = {'presets': P['presets'], 'style': P['style'], 'look': P['look'], 'captions': True, 'highlight': [],
          'hook': None, 'lower_third': bool(P['name']), 'logo': P['logo'], 'end_card': bool(P['end_text'] or (BRAND / 'logo.png').exists()),
          'music': P['music'], 'segments': segs}
    target = d / ('edit.json' if a.force or not (d / 'edit.json').exists() else 'edit.rough.json')
    save(target, ed)
    total = sum(s['out'] - s['in'] for s in segs)
    print(f'{target.name}: {len(segs)} segments, {total:.1f}s of speech kept. Now read the "text" of each segment, delete flubs and repeated takes, reorder for the story.')

def segment_cmd(d, s, i, W, H, look, zoom, kind_cache, work, draft):
    """Render one segment (video + levelled audio) at the final size, colour-corrected, with any b-roll on top."""
    src = d / 'raw' / s['clip']; info = probe(src)
    if 'w' not in info: die(f"{s['clip']} has no picture")
    dur = frames(s.get('dur', 3.0) if info['image'] else s['out'] - s['in'])
    t_in = 0 if info['image'] else s['in']
    inputs, fc = [], []
    if info['image']: inputs += ['-loop', '1', '-framerate', str(FPS), '-t', f'{dur:.3f}', '-i', src]
    else: inputs += ['-ss', f'{t_in:.3f}', '-t', f'{dur:.3f}', '-i', src]
    col, meta = ('', {}) if s.get('color') == 'off' else autocolor(src, info, t_in, t_in + dur, s.get('exposure', 0.0))
    kind_cache[s['clip']] = meta.get('kind', kind_cache.get(s['clip'], 'camera'))
    pre = ','.join(x for x in (tonemap(info), 'format=gbrp', col) if x)
    fc.append(f'[0:v]{pre}[c]')
    fc.append(framing(info, W, H, s.get('fit', 'auto'), s.get('fx', 0.5), s.get('fy', 0.5), zoom, kind_cache[s['clip']]))
    cur = 'f'
    for j, b in enumerate(s.get('broll', [])):
        bsrc = d / 'raw' / b['clip']; binfo = probe(bsrc); bd = frames(b.get('dur', 2.5))
        k = sum(1 for x in inputs if x == '-i')
        if binfo['image']: inputs += ['-loop', '1', '-framerate', str(FPS), '-t', f'{bd:.3f}', '-i', bsrc]
        else: inputs += ['-ss', f"{b.get('in', 0):.3f}", '-t', f'{bd:.3f}', '-i', bsrc]
        bcol, bm = autocolor(bsrc, binfo, b.get('in', 0), b.get('in', 0) + bd) if b.get('color') != 'off' else ('', {})
        fc.append(f"[{k}:v]{','.join(x for x in (tonemap(binfo), 'format=gbrp', bcol) if x)}[bc{j}]")
        fc.append(framing(binfo, W, H, b.get('fit', 'auto'), b.get('fx', 0.5), b.get('fy', 0.5), 1.0, bm.get('kind', 'camera'), f'bf{j}', f'bc{j}'))
        at = b.get('at', 0.0)
        fc.append(f"[bf{j}]setpts=PTS-STARTPTS+{at:.3f}/TB[bp{j}];[{cur}][bp{j}]overlay=eof_action=pass:enable='between(t,{at:.3f},{at + bd:.3f})'[o{j}]")
        cur = f'o{j}'
    bb, cur = blur_boxes(s.get('blur'), W, H, cur, 'bl')
    fc.append(bb + f'[{cur}]{look_filter(look)},scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,fps={FPS},setsar=1[v]')
    mode = s.get('audio', 'voice')
    if info['audio'] and not info['image'] and mode != 'mute':
        a_in = '0:a:0'; gain = 0.0
        vd = run(['ffmpeg', '-hide_banner', '-nostats', '-ss', f'{t_in:.3f}', '-t', f'{dur:.3f}', '-i', src, '-vn', '-af', 'volumedetect', '-f', 'null', '-'], check=False).stderr
        m = re.search(r'mean_volume: (-?[\d.]+) dB', vd)
        if m: gain = max(-10.0, min(15.0, (-20.0 if mode == 'voice' else -34.0) - float(m.group(1))))
    else:
        k = sum(1 for x in inputs if x == '-i'); inputs += ['-f', 'lavfi', '-t', f'{dur:.3f}', '-i', 'anullsrc=r=48000:cl=stereo']
        a_in, gain = f'{k}:a', 0.0
    af = f'aresample=48000,aformat=channel_layouts=stereo,volume={gain:.2f}dB,apad,atrim=0:{dur:.3f},afade=t=in:d=0.015,afade=t=out:st={max(0, dur - 0.03):.3f}:d=0.03'
    fc.append(f'[{a_in}]{af}[a]')
    out = work / f'seg{i:03d}.mkv'
    return ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *inputs, '-filter_complex', ';'.join(fc), '-map', '[v]', '-map', '[a]',
            '-t', f'{dur:.3f}', '-c:v', 'libx264', '-preset', 'veryfast' if draft else 'fast', '-crf', '20' if draft else '14',
            '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
            '-c:a', 'pcm_s16le', out], dur, meta

def ass_time(t): t = max(0, t); return f'{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}'

def ass_color(hexc, alpha=0): h = hexc.lstrip('#'); return f'&H{alpha:02X}{h[4:6]}{h[2:4]}{h[0:2]}'.upper()

def esc(t): return t.replace('\\', '').replace('{', '(').replace('}', ')').replace('\n', ' ')

def build_ass(path, W, H, pr, ed, P, st, words, overlays, t_main, t_end):
    size, mv, ml, lt_y, hook_m, _, _ = LAYOUT[pr]; font = P['font']; acc = ass_color(P['accent'])
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,{font},{size},&H00FFFFFF,&H00FFFFFF,&H00000000,&H78000000,-1,0,0,0,100,100,0,0,1,{max(3, size // 13)},2,2,{ml},{ml},{mv},1
Style: Box,{font},{int(size * 1.05)},&H00FFFFFF,&H00FFFFFF,&H50101010,&H50101010,-1,0,0,0,100,100,0,0,3,{size // 5},0,8,{ml},{ml},{hook_m},1
Style: Third,{font},{int(size * 0.8)},&H00FFFFFF,&H00FFFFFF,&H40101010,&H40101010,-1,0,0,0,100,100,0,0,3,{size // 6},0,1,{ml // 2 + 30},{ml},0,1
Style: End,{font},{int(size * 0.9)},&H00FFFFFF,&H00FFFFFF,&H00000000,&H78000000,-1,0,0,0,100,100,0,0,1,{max(3, size // 14)},2,2,{ml},{ml},{int(H * 0.22)},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    def add(t0, t1, style, text, layer=0): ev.append(f'Dialogue: {layer},{ass_time(t0)},{ass_time(t1)},{style},,0,0,0,,{text}')
    hl = {clean(x) for h in ed.get('highlight', []) for x in h.split()}
    if ed.get('captions', True) and words:
        phrases, cur = [], []
        for i, w in enumerate(words):
            cur.append(w); nxt = words[i + 1] if i + 1 < len(words) else None
            if (not nxt or len(cur) >= st['words'] or nxt['s'] - w['e'] > 0.35 or re.search(r'[.!?,;:]$', w['w'])
                    or len(' '.join(x['w'] for x in cur)) > (16 if pr == 'reel' else 26)):
                phrases.append(cur); cur = []
        for k, ph in enumerate(phrases):
            t0 = ph[0]['s']; t1 = min(ph[-1]['e'] + 0.25, phrases[k + 1][0]['s'] if k + 1 < len(phrases) else t_main)
            toks = [re.sub(r'[.,;:]$', '', esc(w['w'])) if j == len(ph) - 1 else esc(w['w']) for j, w in enumerate(ph)]
            def render(cur_j):
                parts = []
                for j, tk in enumerate(toks):
                    on = (j == cur_j) or clean(ph[j]['w']) in hl
                    parts.append(f'{{\\c{acc}&}}{tk}{{\\c&H00FFFFFF&}}' if on else tk)
                return ' '.join(parts)
            pop = '{\\fscx90\\fscy90\\t(0,90,\\fscx100\\fscy100)}'
            if st['karaoke']:
                for j, w in enumerate(ph):
                    a0 = t0 if j == 0 else w['s']; a1 = ph[j + 1]['s'] if j + 1 < len(ph) else t1
                    if a1 > a0: add(a0, a1, 'Cap', (pop if j == 0 else '') + render(j))
            else: add(t0, t1, 'Cap', '{\\fad(80,60)}' + render(-1))
    hook = ed.get('hook')
    if hook and hook.get('text'): add(0, min(t_main, hook.get('dur', 3.0)), 'Box', '{\\fad(120,200)}' + esc(hook['text']), 1)
    for t0, t1, text in overlays: add(t0, t1, 'Box', '{\\fad(120,150)}' + esc(text), 1)
    lt = ed.get('lower_third')
    if lt:
        lt = {'name': P['name'], 'title': P['title'], 'at': 1.0, 'dur': 4.0, **(lt if isinstance(lt, dict) else {})}
        if lt['name']:
            txt = f"{{\\fad(250,250)\\pos({ml // 2 + 30},{lt_y})}}{esc(lt['name'])}" + (f"\\N{{\\fs{int(size * 0.6)}\\b0}}{esc(lt['title'])}" if lt['title'] else '')
            add(lt['at'], min(t_main, lt['at'] + lt['dur']), 'Third', txt, 2)
    ec = ed.get('end_card')
    if ec and t_end > t_main:
        text = ec.get('text') if isinstance(ec, dict) else P['end_text']
        if text: add(t_main + 0.2, t_end, 'End', '{\\fad(250,0)}' + esc(text), 1)
    Path(path).write_text(head + '\n'.join(ev) + '\n', encoding='utf-8')

def mix_audio(work, total, ed, st):
    music = ed.get('music')
    voice_chain = VOICE if ed.get('voice_fx', True) else 'anull'
    ff('-i', 'timeline.mkv', '-vn', '-af', voice_chain, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', 'voice.wav', cwd=work)
    src = 'voice.wav'
    if music:
        m = music if isinstance(music, dict) else {'file': music}
        mf = Path(os.path.expanduser(m['file'])); mf = mf if mf.is_absolute() else ROOT / mf
        if not mf.exists(): die(f'music file not found: {mf}')
        vI = (loud(work / 'voice.wav') or {}).get('input_i', -20.0); mI = (loud(mf) or {}).get('input_i', -16.0)
        vI = -20.0 if vI < -60 else vI
        g = vI - mI + m.get('db', st['music'])
        fc = (f"[1:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0:{total:.3f},volume={g:.2f}dB,afade=t=in:d=0.4,"
              f"afade=t=out:st={max(0, total - 1.5):.3f}:d=1.5[m];[0:a]asplit[v1][v2];"
              f"[m][v2]sidechaincompress=threshold=0.04:ratio=6:attack=15:release=350[md];[v1][md]amix=inputs=2:normalize=0:duration=first[o]")
        ff('-i', 'voice.wav', '-stream_loop', '-1', '-i', mf, '-filter_complex', fc, '-map', '[o]', '-t', f'{total:.3f}',
           '-c:a', 'pcm_s16le', 'premix.wav', cwd=work)
        src = 'premix.wav'
    L = loud(work / src)
    if not L or L['input_i'] < -60:
        shutil.copy(work / src, work / 'mix.wav'); return
    ln = (f"loudnorm=I={LUFS}:TP={TP}:LRA=11:measured_I={L['input_i']}:measured_TP={L['input_tp']}:measured_LRA={L['input_lra']}:"
          f"measured_thresh={L['input_thresh']}:offset={L['target_offset']}:linear=true,alimiter=limit=0.89:level=false")
    ff('-i', src, '-af', ln, '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', 'mix.wav', cwd=work)

def render(d, ed, P, pr, draft=False):
    W, H = PRESETS[pr]; st = STYLES[ed.get('style') or P['style']]; look = ed.get('look') or P['look']
    work = d / 'work' / pr; work.mkdir(parents=True, exist_ok=True)
    for f in work.glob('seg*.mkv'): f.unlink()
    segs = ed.get('segments') or die('edit.json has no segments')
    t, words, overlays, parts, kinds, prev, zin = 0.0, [], [], [], {}, None, False
    for i, s in enumerate(segs):
        src = d / 'raw' / s['clip']
        if not src.exists(): die(f"segment {i}: {s['clip']} is not in raw/")
        info = probe(src)
        if s.get('zoom') is not None: zoom = s['zoom']
        else:   # jump cut inside one take: alternate a slight punch-in so the cut reads as intentional
            same = prev and prev['clip'] == s['clip'] and not info['image'] and 0 <= s['in'] - prev['out'] < 4
            zin = (not zin) if same else False
            zoom = st['zoom'] if zin and kinds.get(s['clip']) != 'screen' else 1.0
        cmd, dur, meta = segment_cmd(d, s, i, W, H, look, zoom, kinds, work, draft)
        print(f"  [{pr}] {i + 1}/{len(segs)} {s['clip']} {dur:.2f}s" + (f" colour {meta}" if meta else ''), flush=True)
        run(cmd); parts.append(f'seg{i:03d}.mkv')
        if s.get('audio', 'voice') == 'voice' and not info['image']:
            W_ = load(d / 'look' / f'{src.stem}.words.json', {})
            for w in fix_words(W_.get('words', []), {**P['fixes'], **ed.get('fixes', {})}):
                if w['s'] >= s['in'] - 0.05 and w['e'] <= s['in'] + dur + 0.08 and clean(w['w']) not in FILLERS:
                    words.append({'w': w['w'], 's': round(t + max(0, w['s'] - s['in']), 3), 'e': round(t + min(dur, w['e'] - s['in']), 3)})
        if s.get('overlay'): overlays.append((t, t + dur, s['overlay']))
        t += dur; prev = s
    t_main = t
    ec = ed.get('end_card'); logo = BRAND / 'logo.png'
    if ec:
        edur = frames(ec.get('dur', 2.5) if isinstance(ec, dict) else 2.5)
        ff('-sseof', '-0.1', '-i', parts[-1], '-frames:v', '1', '-update', '1', 'last.png', cwd=work)
        ins = ['-loop', '1', '-framerate', str(FPS), '-t', f'{edur:.3f}', '-i', 'last.png']
        fc = '[0:v]boxblur=25:3,lutrgb=r=val*0.55:g=val*0.55:b=val*0.55[b]'
        if logo.exists() and ed.get('logo', P['logo']) != 'off':
            ins += ['-i', logo]
            fc += f';[1:v]scale=w=\'min({int(W * 0.5)},iw*{int(H * 0.22)}/ih)\':h=-2[l];[b][l]overlay=(W-w)/2:(H-h)/2-{int(H * 0.04)}[b2]'
            fc += ';[b2]'
        else: fc += ';[b]'
        fc += 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,fps=30,setsar=1[v]'
        ff(*ins, '-f', 'lavfi', '-t', f'{edur:.3f}', '-i', 'anullsrc=r=48000:cl=stereo', '-filter_complex', fc, '-map', '[v]',
           '-map', f"{ins.count('-i')}:a", '-t', f'{edur:.3f}', '-c:v', 'libx264', '-preset', 'fast',
           '-crf', '14', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
           '-c:a', 'pcm_s16le', 'segend.mkv', cwd=work)
        parts.append('segend.mkv'); t += edur
    (work / 'list.txt').write_text(''.join(f"file '{p}'\n" for p in parts), encoding='utf-8')
    ff('-f', 'concat', '-safe', '0', '-i', 'list.txt', '-c', 'copy', 'timeline.mkv', cwd=work)
    mix_audio(work, t, ed, st)
    build_ass(work / 'captions.ass', W, H, pr, ed, P, st, words, overlays, t_main, t)
    fonts = os.path.relpath(ROOT / 'fonts', work).replace(os.sep, '/') if (ROOT / 'fonts').exists() else ''
    vf = '[0:v]subtitles=captions.ass' + (f':fontsdir={fonts}' if fonts else '') + '[s]'
    ins = ['-i', 'timeline.mkv', '-i', 'mix.wav']; last = 's'
    if logo.exists() and ed.get('logo', P['logo']) == 'corner':
        _, _, _, _, _, lw, ltop = LAYOUT[pr]
        ins += ['-i', logo]
        vf += f";[2:v]scale={lw}:-2,format=rgba,colorchannelmixer=aa=0.85[lg];[s][lg]overlay=W-w-{int(W * 0.05)}:{ltop}:enable='lt(t,{t_main:.3f})'[s2]"
        last = 's2'
    out = d / 'out' / f'{d.name}-{pr}.mp4'
    ff(*ins, '-filter_complex', vf, '-map', f'[{last}]', '-map', '1:a', '-c:v', 'libx264', '-preset', 'veryfast' if draft else 'medium',
       '-crf', '23' if draft else '18', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', str(FPS), '-g', str(FPS * 2),
       '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
       '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', '-movflags', '+faststart', '-shortest', out, cwd=work)
    print(f'rendered {out} ({t:.1f}s)')
    return out

def cmd_cut(a):
    d = project(a.name); P = profile()
    ed = load(d / 'edit.json') or die('no edit.json (run: rough)')
    presets = [a.preset] if a.preset else (ed.get('presets') or P['presets'])
    ok = True
    for pr in presets:
        if pr not in PRESETS: die(f'unknown preset {pr}: use {", ".join(PRESETS)}')
        ok &= check(render(d, ed, P, pr, a.draft), pr)
    print('\nALL CHECKS PASSED' if ok else '\nSOME CHECKS FAILED: fix them before delivering')

def atoms(path):
    order = []
    with open(path, 'rb') as f:
        while len(order) < 12:
            h = f.read(8)
            if len(h) < 8: break
            size, kind = int.from_bytes(h[:4], 'big'), h[4:8].decode('latin1')
            if size == 1: size = int.from_bytes(f.read(8), 'big'); f.seek(size - 16, 1)
            elif size == 0: order.append(kind); break
            else: f.seek(size - 8, 1)
            order.append(kind)
    return order

def check(path, pr=None):
    """Exact-output check: every file must pass this before it goes to Rafael."""
    path = Path(path); res = []
    def r(level, what): res.append((level, what))
    j = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', path]).stdout)
    v = next((s for s in j['streams'] if s['codec_type'] == 'video'), {}); au = next((s for s in j['streams'] if s['codec_type'] == 'audio'), {})
    W, H = PRESETS.get(pr, (v.get('width'), v.get('height')))
    r('PASS' if (v.get('width'), v.get('height')) == (W, H) else 'FAIL', f"size {v.get('width')}x{v.get('height')} (want {W}x{H})")
    r('PASS' if v.get('codec_name') == 'h264' and v.get('profile') == 'High' else 'FAIL', f"video {v.get('codec_name')} {v.get('profile')}")
    r('PASS' if v.get('pix_fmt') == 'yuv420p' else 'FAIL', f"pixels {v.get('pix_fmt')}")
    r('PASS' if v.get('r_frame_rate') == f'{FPS}/1' else 'FAIL', f"frame rate {v.get('r_frame_rate')}")
    r('PASS' if au.get('codec_name') == 'aac' and au.get('sample_rate') == '48000' and au.get('channels') == 2 else 'FAIL',
      f"audio {au.get('codec_name')} {au.get('sample_rate')} Hz {au.get('channels')} ch")
    order = atoms(path)
    r('PASS' if 'moov' in order and 'mdat' in order and order.index('moov') < order.index('mdat') else 'FAIL', 'fast start (plays before fully downloaded)')
    L = loud(path) or {}
    r('PASS' if abs(L.get('input_i', -99) - LUFS) <= 1.0 else 'FAIL', f"loudness {L.get('input_i')} LUFS (want {LUFS} +-1)")
    r('PASS' if L.get('input_tp', 99) <= -0.5 else 'FAIL', f"true peak {L.get('input_tp')} dBTP (want <= -1)")
    D = float(j['format'].get('duration', 0))
    bd = run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-vf', 'blackdetect=d=0.4:pix_th=0.08', '-an', '-f', 'null', '-'], check=False).stderr
    blacks = re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', bd)
    r('PASS' if not blacks else 'WARN', 'black frames: ' + (', '.join(f'{float(a):.1f}-{float(b):.1f}s' for a, b in blacks) or 'none'))
    sd = run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-vn', '-af', 'silencedetect=n=-45dB:d=1.5', '-f', 'null', '-'], check=False).stderr
    gaps = [(float(a), float(b)) for a, b in re.findall(r'silence_start: ([\d.]+).*?silence_end: ([\d.]+)', sd, re.S) if float(a) < D - 3.5]
    r('PASS' if not gaps else 'WARN', 'dead air over 1.5 s: ' + (', '.join(f'{a:.1f}-{b:.1f}s' for a, b in gaps) or 'none'))
    n = int(min(40, max(6, D / 1.5))); ts = [D * (i + 0.5) / n for i in range(n)]
    fr = grab(path, ts, size=64)
    if fr is not None:
        Y = fr @ LUMA; means = Y.mean(axis=(1, 2)); clip = ((Y > 0.985) | (Y < 0.015)).mean(axis=(1, 2))
        bad = [f'{t:.1f}s' for t, m_, c in zip(ts, means, clip) if (m_ < 0.16 or m_ > 0.80 or c > 0.12) and t < D - 3]
        r('PASS' if not bad else 'WARN', f'exposure {means.min():.2f}-{means.max():.2f} (0 black, 1 white)' + (f'; check {", ".join(bad[:8])}' if bad else ''))
    sh = sheet(path, path.with_suffix('.check.jpg'), n=12 if (v.get('height') or 0) > (v.get('width') or 1) else 9,
               cols=6 if (v.get('height') or 0) > (v.get('width') or 1) else 3, pre='', label=path.name)
    print(f'\nCHECK {path.name} ({D:.1f}s, {path.stat().st_size / 1e6:.1f} MB)')
    for level, what in res: print(f'  {level:4}  {what}')
    print(f'  look at the frames: {sh}')
    return all(l != 'FAIL' for l, _ in res)

def cmd_check(a): sys.exit(0 if check(a.file, a.preset) else 1)

def cmd_deliver(a):
    d = project(a.name); P = profile(); dest = Path(os.path.expanduser(P['exports'])); dest.mkdir(parents=True, exist_ok=True)
    import datetime
    files = sorted((d / 'out').glob('*.mp4')) or die('nothing rendered yet (run: cut)')
    for f in files:
        to = dest / f"{datetime.date.today()} {f.stem}.mp4"; shutil.copy2(f, to); print('delivered', to)
    if not a.no_open:
        opener = ['open'] if platform.system() == 'Darwin' else (['explorer'] if WIN else ['xdg-open'])
        if shutil.which(opener[0]): subprocess.Popen([*opener, str(dest)])

def cmd_selftest(a):
    """Builds a fake project (a talking-head clip with a colour cast, a vertical clip, a photo) and cuts it both ways."""
    d = PROJ / '_selftest'; shutil.rmtree(d, ignore_errors=True); project('_selftest', make=True); raw = d / 'raw'
    say = shutil.which('say') if platform.system() == 'Darwin' else None
    ff('-f', 'lavfi', '-i', 'testsrc2=s=1920x1080:r=30:d=9', '-f', 'lavfi', '-i', 'sine=f=180:d=9:sample_rate=48000',
       '-vf', 'eq=brightness=-0.12,colorbalance=rm=0.12:bm=-0.12', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', raw / 'talk.mp4')
    hdr = has_filter('zscale') and ' libx265 ' in run(['ffmpeg', '-hide_banner', '-encoders'], check=False).stdout
    vert = ['-vf', 'zscale=tin=bt709:min=bt709:pin=bt709:rin=tv:t=arib-std-b67:m=bt2020nc:p=bt2020:r=tv,format=yuv420p10le', '-color_trc', 'arib-std-b67',
            '-color_primaries', 'bt2020', '-colorspace', 'bt2020nc', '-pix_fmt', 'yuv420p10le'] if hdr else ['-pix_fmt', 'yuv420p']
    ff('-f', 'lavfi', '-i', 'smptehdbars=s=1080x1920:r=30:d=5', '-f', 'lavfi', '-i', 'sine=f=300:d=5:sample_rate=48000', *vert,
       '-c:v', 'libx265' if hdr else 'libx264', '-c:a', 'aac', '-shortest', raw / 'phone.mov')
    ff('-f', 'lavfi', '-i', 'mandelbrot=s=1600x1200', '-frames:v', '1', raw / 'photo.png')
    ff('-f', 'lavfi', '-i', 'sine=f=440:d=12:sample_rate=48000', '-af', 'volume=-12dB', d / 'music.wav')
    if say and not a.fast:
        subprocess.run([say, '-o', str(d / 'speech.aiff'), 'Hello, this is a test of the video studio. Glioblastoma research moves forward every year.'])
        ff('-i', raw / 'talk.mp4', '-i', d / 'speech.aiff', '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', 'apad', '-c:a', 'aac', '-t', '9', raw / 'talk2.mp4')
        (raw / 'talk.mp4').unlink(); (raw / 'talk2.mp4').rename(raw / 'talk.mp4')
        look = argparse.Namespace(name='_selftest', model='tiny', lang='en', no_words=False, redo=True); cmd_look(look)
    else:
        save(d / 'look' / 'talk.words.json', {'lang': 'en', 'words': [{'w': w, 's': 0.6 + i * 0.42, 'e': 0.6 + i * 0.42 + 0.34} for i, w in
              enumerate('This is a test of the Video Studio. Glioblastoma research moves forward every single year and every test counts.'.split())]})
        cmd_look(argparse.Namespace(name='_selftest', model=None, lang=None, no_words=True, redo=False))
    save(d / 'edit.json', {'presets': ['reel', 'youtube'], 'style': 'standard', 'look': 'natural', 'captions': True, 'highlight': ['glioblastoma'],
         'hook': {'text': 'Video Studio self-test', 'dur': 2.0}, 'lower_third': {'name': 'Rafael Palhinha', 'title': 'Self-test'},
         'end_card': {'text': 'Thanks for watching', 'dur': 2.0}, 'logo': 'end', 'music': {'file': str(d / 'music.wav'), 'db': -16},
         'segments': [{'clip': 'talk.mp4', 'in': 0.5, 'out': 3.0}, {'clip': 'talk.mp4', 'in': 3.2, 'out': 5.6, 'overlay': 'Jump cut + punch-in'},
                      {'clip': 'phone.mov', 'in': 0.5, 'out': 3.0, 'audio': 'mute'}, {'clip': 'photo.png', 'dur': 1.5},
                      {'clip': 'talk.mp4', 'in': 5.8, 'out': 8.6, 'broll': [{'clip': 'phone.mov', 'in': 1.0, 'at': 0.5, 'dur': 1.2}],
                       'blur': [[0.05, 0.05, 0.25, 0.1]]}]})
    ok = True
    for pr in ('reel', 'youtube'):
        ok &= check(render(d, load(d / 'edit.json'), profile(), pr), pr)
    print('\nSELFTEST PASS' if ok else '\nSELFTEST FAIL')
    if not hdr: print('note: ffmpeg has no zscale, so iPhone HDR clips cannot be tone-mapped. Install a full ffmpeg build.')
    sys.exit(0 if ok else 1)

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter); sp = ap.add_subparsers(dest='cmd', required=True)
    sp.add_parser('doctor').set_defaults(fn=cmd_doctor)
    p = sp.add_parser('selftest'); p.add_argument('--fast', action='store_true'); p.set_defaults(fn=cmd_selftest)
    p = sp.add_parser('new'); p.add_argument('name'); p.set_defaults(fn=cmd_new)
    p = sp.add_parser('get'); p.add_argument('name'); p.add_argument('src', nargs='+'); p.set_defaults(fn=cmd_get)
    p = sp.add_parser('look'); p.add_argument('name'); p.add_argument('--model'); p.add_argument('--lang')
    p.add_argument('--no-words', action='store_true'); p.add_argument('--redo', action='store_true'); p.set_defaults(fn=cmd_look)
    p = sp.add_parser('rough'); p.add_argument('name'); p.add_argument('clips', nargs='*'); p.add_argument('--force', action='store_true'); p.set_defaults(fn=cmd_rough)
    p = sp.add_parser('cut'); p.add_argument('name'); p.add_argument('--preset'); p.add_argument('--draft', action='store_true'); p.set_defaults(fn=cmd_cut)
    p = sp.add_parser('check'); p.add_argument('file'); p.add_argument('--preset'); p.set_defaults(fn=cmd_check)
    p = sp.add_parser('deliver'); p.add_argument('name'); p.add_argument('--no-open', action='store_true'); p.set_defaults(fn=cmd_deliver)
    a = ap.parse_args(); a.fn(a)

if __name__ == '__main__':
    main()
