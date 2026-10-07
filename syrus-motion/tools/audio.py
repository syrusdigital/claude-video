#!/usr/bin/env python3
"""Syrus ad audio: an original synthesized music bed + sound effects + voiceover, mixed with ducking.

usage: python3 tools/audio.py plan.json out.wav
plan.json: {
  "duration": 42.0, "bpm": 104, "key": "D", "mood": "warm" | "drive" | "tension",
  "vo": "path/vo.wav" | null, "music_db": -18, "duck_db": -9,
  "hits":   [t, ...]            # impacts (price slams, the payoff)
  "whoosh": [t, ...]            # graphic entries / transitions
  "ticks":  [t, ...]            # checklist ticks, counters
  "riser":  [t0, t1] | null,    # build into the CTA
  "stop":   [t0, t1] | null     # music drops out (silence before a payoff)
}
Everything is generated here (no samples), deterministic (seeded noise). Output 48 kHz stereo 16-bit.
"""
import json, sys
import numpy as np
import soundfile as sf

SR = 48000
P = json.load(open(sys.argv[1]))
DUR = float(P['duration']); N = int(DUR * SR) + 1
t = np.arange(N) / SR
rng = np.random.default_rng(7)
BPM = float(P.get('bpm', 104)); BEAT = 60 / BPM; BAR = 4 * BEAT
NOTES = {'C': 0, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'Gb': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}
root = 50 + NOTES.get(P.get('key', 'D'), 2)            # D3 = midi 50
mood = P.get('mood', 'warm')
# I - V - vi - IV (warm/drive), i - VI - III - VII (tension)
prog = [(0, 'maj'), (7, 'maj'), (9, 'min'), (5, 'maj')] if mood != 'tension' else [(0, 'min'), (8, 'maj'), (3, 'maj'), (10, 'maj')]
hz = lambda m: 440.0 * 2 ** ((m - 69) / 12)

def env(n, a, d, sus=0.0, rel=0.05):
    e = np.ones(n); na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    nd = int(d * SR); e[na:na + nd] = np.linspace(1, sus, len(e[na:na + nd]))
    e[na + nd:] = sus
    nr = int(rel * SR)
    if nr and nr < n: e[-nr:] *= np.linspace(1, 0, nr)
    return e

def add(buf, start, sig, gain=1.0):
    i0 = int(start * SR)
    if i0 >= len(buf): return
    s = sig[: len(buf) - i0] * gain
    buf[i0:i0 + len(s)] += s

music = np.zeros(N)
# ---- pad: detuned saws per chord, filtered (vectorised filter via FFT smoothing of harmonics: use additive saw with few harmonics)
def saw(f, n, harmonics=10):
    tt = np.arange(n) / SR; out = np.zeros(n)
    for k in range(1, harmonics + 1):
        out += np.sin(2 * np.pi * f * k * tt) / k * (0.85 ** k)
    return out
bars = int(np.ceil(DUR / BAR)) + 1
for b in range(bars):
    deg, q = prog[b % 4]
    chord = [0, 4 if q == 'maj' else 3, 7, 12]
    n = int(BAR * SR) + int(0.3 * SR)
    sig = np.zeros(n)
    for iv in chord:
        f = hz(root + deg + iv + 12)
        sig += saw(f, n, 6) * 0.5 + saw(f * 1.004, n, 6) * 0.5
    sig *= env(n, 0.35, BAR, 0.8, 0.3) * 0.035
    add(music, b * BAR, sig)
    # bass: root on beats, short
    for k in range(4):
        n2 = int(BEAT * 0.9 * SR); f = hz(root + deg - 12)
        b2 = (np.sin(2 * np.pi * f * np.arange(n2) / SR) + 0.3 * np.sin(4 * np.pi * f * np.arange(n2) / SR)) * env(n2, 0.005, 0.35, 0.25, 0.08)
        add(music, b * BAR + k * BEAT, b2, 0.11 if mood != 'warm' or k % 2 == 0 else 0.07)
    # pluck arpeggio on 8ths
    arp = [chord[i % 3] for i in (0, 1, 2, 1, 0, 2, 1, 2)]
    for k, iv in enumerate(arp):
        n3 = int(0.35 * SR); f = hz(root + deg + iv + 24)
        p3 = saw(f, n3, 5) * env(n3, 0.002, 0.25, 0.0, 0.05)
        add(music, b * BAR + k * BEAT / 2, p3, 0.022 if mood == 'warm' else 0.028)
# ---- drums (drive/tension get a fuller groove)
def kick():
    n = int(0.35 * SR); tt = np.arange(n) / SR
    f = 45 + 80 * np.exp(-tt * 28); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-tt * 9)
def hat(dec=0.04):
    n = int(0.08 * SR); x = rng.standard_normal(n); x = np.diff(np.concatenate([[0], x]))   # crude high-pass
    return x * np.exp(-np.arange(n) / SR / dec)
K, Hh = kick(), hat()
for b in range(bars):
    for k in range(4):
        tb = b * BAR + k * BEAT
        if mood != 'warm' or k in (0, 2): add(music, tb, K, 0.32)
        add(music, tb + BEAT / 2, Hh, 0.035)
        if mood == 'drive': add(music, tb, Hh, 0.02)
# ---- music drop-outs ("stop": silence before a payoff) and a fade at the end
gain = np.ones(N)
if P.get('stop'):
    a, b = P['stop']; ia, ib = int(a * SR), int(b * SR)
    ramp = int(0.05 * SR); gain[ia:ib] = 0.02
    gain[max(0, ia - ramp):ia] = np.linspace(1, 0.02, len(gain[max(0, ia - ramp):ia]))
nf = int(1.2 * SR); gain[-nf:] *= np.linspace(1, 0, nf)
music *= gain

# ---- sfx
sfx = np.zeros(N)
def whoosh():
    n = int(0.45 * SR); x = rng.standard_normal(n); tt = np.arange(n) / SR
    # band sweep via cumulative smoothing at a moving rate
    y = np.zeros(n); acc = 0.0
    for i in range(n):
        a = 0.97 - 0.5 * (i / n); acc = (1 - a) * x[i] + a * acc; y[i] = acc
    return y * np.sin(np.pi * tt / tt[-1]) ** 2 * 0.9
def impact():
    n = int(0.9 * SR); tt = np.arange(n) / SR
    f = 38 + 90 * np.exp(-tt * 18); sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 3.5)
    nz = rng.standard_normal(n) * np.exp(-tt * 22) * 0.5
    return sub + nz
def tick():
    n = int(0.12 * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1760 * tt) + 0.5 * np.sin(2 * np.pi * 2640 * tt)) * np.exp(-tt * 40)
WH, IM, TK = whoosh(), impact(), tick()
for x in P.get('whoosh', []): add(sfx, max(0, x - 0.25), WH, 0.16)
for x in P.get('hits', []): add(sfx, x, IM, 0.55)
for x in P.get('ticks', []): add(sfx, x, TK, 0.10)
if P.get('riser'):
    a, b = P['riser']; n = int((b - a) * SR); tt = np.arange(n) / SR
    f = 200 * (8 ** (tt / tt[-1])); r = np.sin(2 * np.pi * np.cumsum(f) / SR) * (tt / tt[-1]) ** 2
    add(sfx, a, r, 0.05)

# ---- voiceover + ducking
vo = np.zeros(N)
if P.get('vo'):
    v, sr = sf.read(P['vo'])
    if v.ndim > 1: v = v.mean(axis=1)
    if sr != SR: v = np.interp(np.linspace(0, len(v) - 1, int(len(v) * SR / sr)), np.arange(len(v)), v)
    vo[: min(N, len(v))] = v[: min(N, len(v))]
    # envelope: RMS over 60 ms, smoothed, so the music dips while the voice speaks
    w = int(0.06 * SR); e = np.sqrt(np.convolve(vo ** 2, np.ones(w) / w, mode='same'))
    speaking = (e > 0.02).astype(float)
    k = int(0.25 * SR); speaking = np.convolve(speaking, np.ones(k) / k, mode='same')
    duck = 10 ** (P.get('duck_db', -9) / 20)
    music *= 1 - (1 - duck) * np.clip(speaking, 0, 1)
mg = 10 ** (P.get('music_db', -18) / 20)
music = music / max(1e-6, np.abs(music).max()) * mg
mix = vo * 0.9 + music + sfx * 0.6
L = mix + np.roll(music, 240) * 0.15       # a touch of width on the music
R = mix - np.roll(music, 240) * 0.15
st = np.stack([L, R], axis=1)
st /= max(1.0, np.abs(st).max() / 0.95)
sf.write(sys.argv[2], st.astype(np.float32), SR, subtype='PCM_16')
print('audio', sys.argv[2], f'{DUR:.2f}s')
