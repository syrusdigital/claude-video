#!/usr/bin/env python3
"""House-style shot planner: ad.json "beats" -> ad.json "shots" (word-timed), then optionally compile with cut.py.

usage: python3 tools/house_build.py <ad-dir> [--cut] [--force-vo]
ad.json:
  "media": "../media",                                   # where clip paths resolve (the client's catalog folder)
  "beats": [ { "at": "line:hook", "clips": ["client/a.mp4@0.3", "stock/b.mp4", "client/c.mp4@4 whip x0.5"] }, ... ]
A beat runs from its "at" anchor to the next beat's (the first starts at 0, the last runs to the end). Its clips split
the beat evenly, and every cut is snapped to the nearest spoken word onset (±0.3 s) so pictures change on words, as in
the house edit. A clip is "path[@in] [whip] [xSPEED] [fx=0.3] [zoom=1.0:1.12]"; with no @in the catalog's best ranges
are used in turn. Low-res client footage (<720 px wide) gets a sharpen in its grade. Video shots drift on a slow push.
"""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
AD = os.path.abspath(sys.argv[1]); P = os.path.join(AD, 'ad.json'); A = json.load(open(P))
VO = json.load(open(os.path.join(AD, 'build', 'vo', 'vo.json')))
MEDIA = os.path.normpath(os.path.join(AD, A.get('media', '../media')))
cat = {}
cp = os.path.join(MEDIA, 'catalog.json')
if os.path.exists(cp):
    C = json.load(open(cp)); C = C if isinstance(C, list) else C.get('items', [])
    cat = {c['file']: c for c in C}
DUR = VO['duration'] + float(A.get('tail', 0.4))
onsets = [w['t0'] for w in VO['words']]
norm = lambda s: re.sub(r'[^a-z0-9$]', '', s.lower())

def anchor(a):
    if isinstance(a, (int, float)): return float(a)
    m = re.match(r'^(.*?)([+-]\d+(\.\d+)?)?$', a.strip()); base, off = m.group(1), float(m.group(2) or 0)
    if base == 'end': return DUR + off
    if base.startswith('line:'):
        lid = base[5:]; end = lid.endswith('.end'); lid = lid[:-4] if end else lid
        ln = next(l for l in VO['lines'] if l['id'] == lid); return (ln['t1'] if end else ln['t0']) + off
    if base.startswith('word:'):
        w, _, n = base[5:].partition('#'); hits = [x for x in VO['words'] if norm(x['w']).startswith(norm(w))]
        return hits[int(n or 1) - 1]['t0'] + off
    return float(base) + off

def snap(t, lo, hi):
    best = min(onsets, key=lambda o: abs(o - t)) if onsets else t
    return best if abs(best - t) <= 0.3 and lo + 0.7 <= best <= hi - 0.7 else t

used = {}
def parse(spec):
    if isinstance(spec, dict): return dict(spec)
    toks = spec.split(); path, _, tin = toks[0].partition('@'); d = {'file': path}
    if tin: d['in'] = float(tin)
    for t in toks[1:]:
        if t == 'whip': d['whip'] = True
        elif t.startswith('x'): d['speed'] = float(t[1:])
        elif t.startswith('fx='): d['fx'] = float(t[3:])
        elif t.startswith('fy='): d['fy'] = float(t[3:])
        elif t.startswith('zoom='): d['zoom'] = [float(v) for v in t[5:].split(':')]
    return d

beats = A['beats']; starts = [0.0] + [anchor(b['at']) for b in beats[1:]]
shots = []
for bi, b in enumerate(beats):
    t0, t1 = starts[bi], (starts[bi + 1] if bi + 1 < len(beats) else DUR)
    clips = [parse(c) for c in b['clips']]; n = len(clips)
    cuts = [t0] + [snap(t0 + (t1 - t0) * k / n, t0, t1) for k in range(1, n)] + [t1]
    for k, c in enumerate(clips):
        info = cat.get(c['file'], {}); ln = cuts[k + 1] - cuts[k]
        if 'in' not in c:   # next unused "best" range, else the clip's start
            bests = info.get('best') or [[0.0, info.get('duration') or 3.0]]
            i = used.get(c['file'], 0); used[c['file']] = i + 1; c['in'] = float(bests[i % len(bests)][0])
        sp = float(c.get('speed', 1.0)); dur = info.get('duration')
        if dur and c['in'] + ln * sp > dur - 0.05: c['in'] = max(0.0, dur - 0.05 - ln * sp)
        is_img = c['file'].lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))
        s = {'src': os.path.relpath(os.path.join(MEDIA, c['file']), AD), 'in': round(c['in'], 2), 'len': round(ln, 3),
             'fx': c.get('fx', 0.5), 'fy': c.get('fy', 0.5),
             'zoom': c.get('zoom', [1.0, 1.12] if is_img else [1.0, 1.07] if k % 2 == 0 else [1.07, 1.0])}
        if sp != 1.0: s['speed'] = sp
        if c.get('whip'): s['whip'] = True
        w = info.get('w') or 1080
        g = 'eq=contrast=1.06:saturation=1.12:brightness=0.01'
        if min(w, info.get('h') or 1920) < 720: g += ',unsharp=5:5:0.9:5:5:0.0'
        s['grade'] = c.get('grade', g)
        shots.append(s)
A['shots'] = shots; A['tail'] = A.get('tail', 0.4)
json.dump(A, open(P, 'w'), indent=1)
print(f'{os.path.basename(AD)}: {len(shots)} shots over {DUR:.1f}s, avg {DUR / len(shots):.2f}s')
if '--cut' in sys.argv:
    sys.exit(subprocess.call([sys.executable, os.path.join(HERE, 'cut.py'), AD] + [a for a in sys.argv[2:] if a == '--force-vo']))
