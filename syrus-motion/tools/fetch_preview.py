#!/usr/bin/env python3
"""Download the playable video behind a Meta ad preview (ads_get_ad_preview -> preview_url).

usage: python3 tools/fetch_preview.py '<preview_url>' out.mp4
The preview iframe page embeds the ad's video as an fbcdn .mp4 (a 360x640-ish rendition with audio) — enough to study
voice, music, sound effects, captions and pacing. Pass the preview_url exactly as the tool returned it (&amp; is fine).
"""
import re, subprocess, sys

url, out = sys.argv[1].replace('&amp;', '&'), sys.argv[2]
UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
html = subprocess.run(['curl', '-sS', '-L', '--max-time', '40', '-A', UA, url], capture_output=True, text=True).stdout
cands = []
for u in re.findall(r'https:\\/\\/[^"]*?\.mp4[^"]*', html):
    u = u.replace('\\/', '/').encode().decode('unicode_escape')
    if u not in cands: cands.append(u)
if not cands: sys.exit('no video in preview (image ad, expired preview link, or a carousel)')
r = subprocess.run(['curl', '-sS', '-L', '--max-time', '120', '-A', UA, '-o', out, cands[0]])
print(out if r.returncode == 0 else 'download failed')
