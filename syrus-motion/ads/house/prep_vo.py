#!/usr/bin/env python3
"""Voice the house ads: scripts.json -> <client>/<ad>/ad.json "vo" block + build/vo (exactly what tools/cut.py would make,
stamped with the same cache key, so cut.py reuses it).

usage: python3 ads/house/prep_vo.py [client/ad ...] [--engine elevenlabs --voice-id <id>] [--force]
Default voice is the placeholder (Kokoro am_fenrir, speed 1.06 ≈ the house 190 wpm, pauses tightened to 0.12 s).
With --engine elevenlabs (needs ELEVENLABS_API_KEY) the same lines are re-voiced in one take with the chosen voice.
"""
import hashlib, json, os, re, subprocess, sys
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
S = json.load(open(os.path.join(HERE, 'scripts.json')))
args = sys.argv[1:]
opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
engine, vid, force = opt('--engine', 'kokoro'), opt('--voice-id'), '--force' in args
picks = [a for a in args if '/' in a and not a.startswith('-')] or [k for k in S if not k.startswith('_')]

def lines_for(s):
    sent = lambda t: [x.strip() for x in re.split(r'(?<=[.?!…])\s+(?=[A-Z$"0-9])', t) if x.strip()]
    L = [{'id': 'hook', 'text': s['hook'], 'after': 0.05}]
    L += [{'id': f'b{i + 1}', 'text': x, 'after': 0.05} for i, x in enumerate(sent(s['body']))]
    L += [{'id': 'cta', 'text': s['cta'], 'after': 0.05}]
    return L

def run(key):
    s = S[key]; ad = os.path.join(HERE, key); os.makedirs(ad, exist_ok=True)
    p = os.path.join(ad, 'ad.json'); A = json.load(open(p)) if os.path.exists(p) else {'title': f"{s['client']} {s['label'].split(' |')[0]} house"}
    V = {'lines': lines_for(s), 'voice': 'am_fenrir', 'speed': 1.06, 'tighten': 0.12, 'lead': 0.1}
    if engine == 'elevenlabs': V = {**V, 'engine': 'elevenlabs', 'voice': vid, 'voice_id': vid, 'speed': 1.08}
    A['vo'] = V; json.dump(A, open(p, 'w'), indent=1)
    vo_dir = os.path.join(ad, 'build', 'vo'); os.makedirs(vo_dir, exist_ok=True)
    vkey = hashlib.sha1(json.dumps(V, sort_keys=True).encode()).hexdigest()[:12]
    if os.path.exists(os.path.join(vo_dir, vkey)) and not force: return key, 'cached'
    json.dump({'lead': V.get('lead', 0.15), 'tail': V.get('vo_tail', 0.3), 'lines': V['lines'],
               **{k: V[k] for k in ('engine', 'tighten', 'voice_id', 'voice_settings', 'model') if k in V}}, open(os.path.join(vo_dir, 'script.json'), 'w'))
    r = subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'vo.py'), os.path.join(vo_dir, 'script.json'), vo_dir,
                        '--voice', V['voice'], '--speed', str(V['speed'])], capture_output=True, text=True)
    if r.returncode: return key, 'FAILED ' + r.stderr[-400:]
    for f in os.listdir(vo_dir):
        if re.fullmatch(r'[0-9a-f]{12}', f): os.remove(os.path.join(vo_dir, f))
    open(os.path.join(vo_dir, vkey), 'w').close()
    vo = json.load(open(os.path.join(vo_dir, 'vo.json'))); n = len(vo['words'])
    return key, f"{vo['duration']:.1f}s, {n} words, {n / (vo['duration'] / 60):.0f} wpm"

with ThreadPoolExecutor(3) as ex:
    for k, msg in ex.map(run, picks): print(k, msg, flush=True)
