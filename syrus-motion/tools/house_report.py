#!/usr/bin/env python3
"""Score the house-style ads with the same meter used on the 21 winners (tools/study_ad.py) and write
ads/house/REPORT.md + ads/house/report.json.

usage: python3 tools/house_report.py
"""
import glob, json, os, statistics as st, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
H = os.path.join(ROOT, 'ads', 'house'); N = json.load(open(os.path.join(H, 'notes.json')))

def g(d, *ks):
    for k in ks: d = (d or {}).get(k)
    return d

# house medians from the study reports
S = [json.load(open(p)) for p in glob.glob(os.path.join(ROOT, 'study', '*', '*', 'report.json'))]
med = lambda f: round(st.median([v for v in (f(r) for r in S) if v is not None]), 1)
house = {'dur': med(lambda r: r['duration']), 'wpm': med(lambda r: g(r, 'voice', 'wpm')), 'f0': med(lambda r: g(r, 'voice', 'pitch_hz')),
         'floor': med(lambda r: g(r, 'music', 'floor_rel_db')), 'sfx': med(lambda r: g(r, 'sfx', 'hit_count')),
         'shot': med(lambda r: g(r, 'picture', 'avg_shot_s')), 'lufs': med(lambda r: g(r, 'loudness', 'integrated_lufs')), 'n': len(S)}

rows = []
for ad in N['ads']:
    d = os.path.join(H, ad['dir']); mp4 = sorted(glob.glob(os.path.join(d, 'out', '*.mp4')))
    if not mp4: continue
    od = os.path.join(d, 'build', 'study')
    if not os.path.exists(os.path.join(od, 'report.json')) or os.path.getmtime(os.path.join(od, 'report.json')) < os.path.getmtime(mp4[0]):
        subprocess.run([sys.executable, os.path.join(HERE, 'study_ad.py'), mp4[0], od, '--label', ad['label']], capture_output=True)
    r = json.load(open(os.path.join(od, 'report.json')))
    rows.append({'dir': ad['dir'], 'label': ad['label'], 'dur': round(r['duration'], 1), 'wpm': round(g(r, 'voice', 'wpm')), 'f0': round(g(r, 'voice', 'pitch_hz')),
                 'floor': round(g(r, 'music', 'floor_rel_db'), 1), 'sfx': g(r, 'sfx', 'hit_count'), 'shot': round(g(r, 'picture', 'avg_shot_s'), 2),
                 'cuts': g(r, 'picture', 'cuts'), 'lufs': round(g(r, 'loudness', 'integrated_lufs'), 1)})
    print(rows[-1])

json.dump({'house': house, 'ads': rows}, open(os.path.join(H, 'report.json'), 'w'), indent=1)
L = ['# House-style ads: measured against the winners', '',
     f"Every ad was scored with `tools/study_ad.py`, the same meter used on the {house['n']} winning ads. The first row is the winners' median.", '',
     '| Ad | Length | Pace (wpm) | Voice pitch | Music under voice | SFX hits | Avg shot | Cuts | Loudness |',
     '|---|---|---|---|---|---|---|---|---|',
     f"| **House median ({house['n']} winners)** | {house['dur']} s | {house['wpm']} | {house['f0']} Hz | {house['floor']} dB | {house['sfx']} | {house['shot']} s | | {house['lufs']} LUFS |"]
for r in rows:
    L.append(f"| {r['dir']} · {r['label']} | {r['dur']} s | {r['wpm']} | {r['f0']} Hz | {r['floor']} dB | {r['sfx']} | {r['shot']} s | {r['cuts']} | {r['lufs']} LUFS |")
L += ['', 'Pace counts Whisper tokens (a price like "$1,995" counts as two), the same way the winners were measured.',
      'SFX hits are what the detector finds: sharp transients away from words, which can include a music hit. The only effects these ads add are whooshes on the zoom-blur transitions and the CTA card.']
open(os.path.join(H, 'REPORT.md'), 'w').write('\n'.join(L) + '\n')
print('->', os.path.join(H, 'REPORT.md'))
