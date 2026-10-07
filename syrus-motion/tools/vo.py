#!/usr/bin/env python3
"""Voiceover for Syrus ads: ElevenLabs (the house voice, needs ELEVENLABS_API_KEY) or Kokoro TTS (offline stand-in).

usage:
  python3 tools/vo.py script.json out_dir [--engine kokoro|elevenlabs] [--voice am_michael | <elevenlabs voice id>] [--speed 1.05]
         [--tighten 0.14]   # shorten every pause longer than this (s) down to it — the house edit has no dead air
  ElevenLabs renders the whole script in one take (natural flow) via /v1/text-to-speech/{voice}/with-timestamps and
  takes word times from its character alignment; Kokoro renders line by line and times words with faster-whisper.
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
ap.add_argument('--engine', default=None); ap.add_argument('--tighten', type=float, default=None)
ap.add_argument('--model', default='eleven_multilingual_v2')
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
S = json.load(open(a.script))
ENGINE = a.engine or S.get('engine', 'kokoro')
TIGHT = a.tighten if a.tighten is not None else S.get('tighten')
SR_OUT = 48000


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from script_words import tighten   # noqa: E402


if ENGINE == 'elevenlabs':
    import base64, hashlib, subprocess, urllib.request
    key = os.environ.get('ELEVENLABS_API_KEY') or sys.exit('ELEVENLABS_API_KEY is not set')
    voice = S.get('voice_id') or a.voice
    st = {'stability': 0.45, 'similarity_boost': 0.8, 'style': 0.2, 'use_speaker_boost': True, 'speed': a.speed, **S.get('voice_settings', {})}
    # one take for the whole script; remember where each line's characters sit
    text, spans = '', []
    for ln in S['lines']:
        if text: text += ' '
        spans.append((len(text), len(text) + len(ln['text']), ln['id'], ln['text'])); text += ln['text']
    body = json.dumps({'text': text, 'model_id': S.get('model', a.model), 'voice_settings': st}).encode()
    cache = os.path.join(a.out, 'el_' + hashlib.sha1(body + voice.encode()).hexdigest()[:12] + '.json')
    if os.path.exists(cache): R = json.load(open(cache))
    else:
        req = urllib.request.Request(f'https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_192',
                                     data=body, headers={'xi-api-key': key, 'Content-Type': 'application/json'})
        R = json.load(urllib.request.urlopen(req, timeout=300)); json.dump(R, open(cache, 'w'))
    mp3 = base64.b64decode(R['audio_base64'])
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'pipe:0', '-ac', '1', '-ar', str(SR_OUT), '-f', 'f32le', '-'], input=mp3, capture_output=True).stdout
    lead = float(S.get('lead', 0.12))
    wav = np.concatenate([np.zeros(int(lead * SR_OUT), np.float32), np.frombuffer(pcm, np.float32)])
    al = R.get('alignment') or R['normalized_alignment']
    ch, cs, ce = al['characters'], al['character_start_times_seconds'], al['character_end_times_seconds']
    words, cur, out_lines = [], None, []
    for i, c in enumerate(ch):
        if c.isspace():
            if cur: words.append(cur); cur = None
            continue
        if cur is None: cur = {'w': '', 't0': round(lead + cs[i], 3), 'i0': i}
        cur['w'] += c; cur['t1'] = round(lead + ce[i], 3)
    if cur: words.append(cur)
    for w in words:
        w['line'] = next((sid for (a0, a1, sid, _) in spans if a0 <= w['i0'] < a1), spans[-1][2]); del w['i0']
    for (a0, a1, sid, tx) in spans:
        ws = [w for w in words if w['line'] == sid]
        if ws: out_lines.append({'id': sid, 'text': tx, 't0': ws[0]['t0'], 't1': ws[-1]['t1']})
    if TIGHT: wav, words, out_lines = tighten(wav, SR_OUT, words, out_lines, float(TIGHT))
    wav = np.concatenate([wav, np.zeros(int(float(S.get('tail', 0.4)) * SR_OUT), np.float32)])
    wav = wav / max(1e-6, np.abs(wav).max()) * 0.89
    sf.write(os.path.join(a.out, 'vo.wav'), wav, SR_OUT, subtype='PCM_16')
    json.dump({'duration': round(len(wav) / SR_OUT, 3), 'engine': 'elevenlabs', 'voice': voice, 'lines': out_lines, 'words': words},
              open(os.path.join(a.out, 'vo.json'), 'w'), indent=1)
    print(f"vo.wav {len(wav)/SR_OUT:.2f}s (elevenlabs {voice}), {len(out_lines)} lines, {len(words)} words -> {a.out}")
    sys.exit(0)

from kokoro_onnx import Kokoro
k = Kokoro(os.path.join(CACHE, 'kokoro-v1.0.onnx'), os.path.join(CACHE, 'voices-v1.0.bin'))

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
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from script_words import relabel
    words = relabel(words, out_lines)   # on-screen text uses the script's spelling, Whisper only supplies the timing
if TIGHT and words:
    wav, words, out_lines = tighten(wav, SR_OUT, words, out_lines, float(TIGHT))
    sf.write(os.path.join(a.out, 'vo.wav'), wav, SR_OUT, subtype='PCM_16')
json.dump({'duration': round(len(wav) / SR_OUT, 3), 'engine': 'kokoro', 'voice': a.voice, 'lines': out_lines, 'words': words}, open(os.path.join(a.out, 'vo.json'), 'w'), indent=1)
print(f"vo.wav {len(wav)/SR_OUT:.2f}s, {len(out_lines)} lines, {len(words)} words -> {a.out}")
