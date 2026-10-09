#!/usr/bin/env python3
"""Decode a Google Drive download_file_content tool result (saved JSON with base64 'content') into a real file,
then delete the bulky JSON. usage: python3 -I tools/drive_pull.py <saved-result.json|.txt> <dest-file>"""
import json, base64, os, sys
src, dst = sys.argv[1], sys.argv[2]
d = json.load(open(src))
data = base64.b64decode(d['content'])
os.makedirs(os.path.dirname(os.path.abspath(dst)), exist_ok=True)
open(dst, 'wb').write(data)
os.remove(src)
print(f"{dst} {len(data)/1e6:.1f}MB {d.get('mimeType','')}")
