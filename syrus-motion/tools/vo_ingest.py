#!/usr/bin/env python3
"""Ingest a finished voiceover take (e.g. an ElevenLabs render from the connector or the web app) into an ad.

usage: python3 tools/vo_ingest.py <ad-dir> <take.mp3|wav|https-url> [--voice "Michael"] [--take <id>]
                                  [--tighten 0.12] [--wpm 190] [--tempo 1.12]
- pauses longer than --tighten are cut down to it (the house edit has no dead air)
- then a pitch-preserving time-stretch (ffmpeg rubberband) brings the read to --wpm (house median 189), capped at 1.15x (script tokens undercount spoken words, so the cap is what usually applies);
  --tempo forces a factor instead
- word times come from faster-whisper on the final audio; the words themselves are the script's (ad.json "vo".lines),
  so on-screen text never shows a mis-hearing
Writes <ad-dir>/build/vo/{vo.wav,vo.json} and stamps the cache key so tools/cut.py uses this take as-is.
"""
import argparse, hashlib, io, json, os, subprocess, sys, tempfile
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from script_words import relabel_full, tighten   # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument('ad'); ap.add_argument('take')
ap.add_argument('--voice', default='elevenlabs'); ap.add_argument('--take-id', default=None)
ap.add_argument('--tighten', type=float, default=0.12); ap.add_argument('--wpm', type=float, default=190)
ap.add_argument('--tempo', type=float, default=None); ap.add_argument('--lead', type=float, default=0.1)
a = ap.parse_args()
AD = os.path.abspath(a.ad); A = json.load(open(os.path.join(AD, 'ad.json')))
SR = 48000; CACHE = os.path.expanduser('~/.cache/syrus-tts')

src = a.take
if src.startswith('http'):
    tmp = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False).name
    subprocess.run(['curl', '-sSfL', '-o', tmp, src], check=True); src = tmp
def decode(path, extra=()):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, *extra, '-ac', '1', '-ar', str(SR), '-f', 'wav', '-'], capture_output=True, check=True).stdout
    x, _ = sf.read(io.BytesIO(raw)); return x.astype(np.float32)

wav = decode(src)
# trim the edges, then the house lead-in
idx = np.where(np.abs(wav) > 0.01)[0]; wav = wav[max(0, idx[0] - int(0.02 * SR)): idx[-1] + int(0.08 * SR)]
wav, _, _ = tighten(wav, SR, [], [], a.tighten)
lines = A['vo']['lines']; nwords = sum(len(l['text'].split()) for l in lines)
tempo = a.tempo or float(np.clip(a.wpm / (nwords / (len(wav) / SR / 60)), 1.0, 1.15))
if tempo > 1.001:
    with tempfile.NamedTemporaryFile(suffix='.wav') as t:
        sf.write(t.name, wav, SR, subtype='PCM_16'); wav = decode(t.name, ['-af', f'rubberband=tempo={tempo:.4f}:pitchq=quality'])
wav = np.concatenate([np.zeros(int(a.lead * SR), np.float32), wav, np.zeros(int(0.3 * SR), np.float32)])
wav = wav / max(1e-6, np.abs(wav).max()) * 0.89

from faster_whisper import WhisperModel   # noqa: E402
m = WhisperModel('small.en', device='cpu', compute_type='int8', download_root=os.path.join(CACHE, 'whisper'))
a16 = np.interp(np.linspace(0, len(wav) - 1, int(len(wav) * 16000 / SR)), np.arange(len(wav)), wav).astype(np.float32)
segs, _ = m.transcribe(a16, word_timestamps=True, language='en', beam_size=1, vad_filter=False)
heard = [{'w': w.word.strip(), 't0': round(w.start, 3), 't1': round(w.end, 3)} for s in segs for w in (s.words or [])]
words, out_lines = relabel_full(heard, lines)

vo_dir = os.path.join(AD, 'build', 'vo'); os.makedirs(vo_dir, exist_ok=True)
sf.write(os.path.join(vo_dir, 'vo.wav'), wav, SR, subtype='PCM_16')
dur = round(len(wav) / SR, 3)
json.dump({'duration': dur, 'engine': 'elevenlabs', 'voice': a.voice, 'take': a.take_id, 'tempo': round(tempo, 3),
           'lines': out_lines, 'words': words}, open(os.path.join(vo_dir, 'vo.json'), 'w'), indent=1)
# stamp: cut.py keys its VO cache on ad.json "vo" — record this take there and stamp that key
A['vo'] = {**{k: v for k, v in A['vo'].items() if k in ('lines',)}, 'engine': 'elevenlabs', 'voice': a.voice, 'take': a.take_id, 'tempo': round(tempo, 3)}
json.dump(A, open(os.path.join(AD, 'ad.json'), 'w'), indent=1)
for f in os.listdir(vo_dir):
    if len(f) == 12 and all(c in '0123456789abcdef' for c in f): os.remove(os.path.join(vo_dir, f))
open(os.path.join(vo_dir, hashlib.sha1(json.dumps(A['vo'], sort_keys=True).encode()).hexdigest()[:12]), 'w').close()
print(f'{os.path.basename(AD)}: {dur:.1f}s, tempo x{tempo:.2f}, {len(words)}/{nwords} words, {nwords / (dur / 60):.0f} wpm')
