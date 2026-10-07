#!/usr/bin/env python3
"""Local voiceover for Syrus ads: Kokoro TTS (Apache-2.0, offline) + faster-whisper word timing.

usage:
  python3 tools/vo.py script.json out_dir [--voice am_michael] [--speed 1.05]
script.json: {"lines": [{"id": "hook", "text": "...", "after": 0.25}, ...], "lead": 0.15, "tail": 0.6}
writes out_dir/vo.wav (48 kHz mono) and out_dir/vo.json:
  {"duration": s, "lines": [{"id","text","t0","t1"}], "words": [{"w","t0","t1","line"}]}
Word times come from faster-whisper on each line's own take (offset by where the line sits), so captions sync
to what is actually said. Model files live in ~/.cache/syrus-tts.
"""
import json, os, sys, argparse
import numpy as np
import soundfile as sf

CACHE = os.path.expanduser('~/.cache/syrus-tts')
ap = argparse.ArgumentParser()
ap.add_argument('script'); ap.add_argument('out')
ap.add_argument('--voice', default='am_michael'); ap.add_argument('--speed', type=float, default=1.05)
ap.add_argument('--no-words', action='store_true')
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
S = json.load(open(a.script))

from kokoro_onnx import Kokoro
k = Kokoro(os.path.join(CACHE, 'kokoro-v1.0.onnx'), os.path.join(CACHE, 'voices-v1.0.bin'))
SR_OUT = 48000

def trim(x, sr, thr=0.008):
    idx = np.where(np.abs(x) > thr)[0]
    if not len(idx): return x
    pad = int(0.03 * sr)
    return x[max(0, idx[0] - pad): min(len(x), idx[-1] + pad)]

def resample(x, sr_in, sr_out):
    if sr_in == sr_out: return x
    n = int(round(len(x) * sr_out / sr_in))
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)

takes, t, out_lines = [], float(S.get('lead', 0.15)), []
pieces = [np.zeros(int(t * SR_OUT), np.float32)]
for ln in S['lines']:
    audio, sr = k.create(ln['text'], voice=ln.get('voice', a.voice), speed=ln.get('speed', a.speed), lang='en-us')
    audio = resample(trim(np.asarray(audio, np.float32), sr), sr, SR_OUT)
    d = len(audio) / SR_OUT
    out_lines.append({'id': ln['id'], 'text': ln['text'], 't0': round(t, 3), 't1': round(t + d, 3)})
    takes.append((t, audio, ln))
    pieces.append(audio)
    gap = float(ln.get('after', 0.22))
    pieces.append(np.zeros(int(gap * SR_OUT), np.float32))
    t += d + gap
pieces.append(np.zeros(int(float(S.get('tail', 0.6)) * SR_OUT), np.float32))
wav = np.concatenate(pieces)
wav = wav / max(1e-6, np.abs(wav).max()) * 0.89
sf.write(os.path.join(a.out, 'vo.wav'), wav, SR_OUT, subtype='PCM_16')

words = []
if not a.no_words:
    from faster_whisper import WhisperModel
    m = WhisperModel('small.en', device='cpu', compute_type='int8', download_root=os.path.join(CACHE, 'whisper'))
    for (t0, audio, ln) in takes:
        a16 = resample(audio, SR_OUT, 16000)
        segs, _ = m.transcribe(a16, word_timestamps=True, language='en', beam_size=1, vad_filter=False)
        for s in segs:
            for w in (s.words or []):
                words.append({'w': w.word.strip(), 't0': round(t0 + w.start, 3), 't1': round(t0 + w.end, 3), 'line': ln['id']})
json.dump({'duration': round(len(wav) / SR_OUT, 3), 'lines': out_lines, 'words': words}, open(os.path.join(a.out, 'vo.json'), 'w'), indent=1)
print(f"vo.wav {len(wav)/SR_OUT:.2f}s, {len(out_lines)} lines, {len(words)} words -> {a.out}")
