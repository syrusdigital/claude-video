#!/usr/bin/env python3
"""Lift a music bed out of one of our winning ads: the voice is removed with demucs, then the bed is made ad-ready.

usage: python3 tools/bed_lift.py <no_vocals.wav> <out.mp3> [--from 7.0] [--to 40.0] [--len 90] [--bars 8] [--bpm 128]
1. un-duck: the winners duck their bed under the voice, and demucs leaves those dips in the stem. A slow envelope
   (1.5 s) over a fast one (60 ms) gives back up to +4 dB where the old voice pushed the music down.
2. tempo: autocorrelation of the hi-hat (7–12 kHz) and kick (35–140 Hz) onset envelopes, refined to 0.1 BPM.
3. loop: the bed plays straight from the first kick at --from; when it reaches --to (the end of the steady section) it jumps back a whole
   number of bars, at the sample offset where the two waveforms line up best, with a 40 ms equal-power crossfade.
   It repeats until --len seconds, so tools/audio.py never has to tile it.
4. a final loudness match (-16 LUFS) so every bed sits the same under the voice at the same ad.json "db".
"""
import argparse, subprocess, tempfile, numpy as np, soundfile as sf, scipy.signal as ss

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--from', dest='a', type=float, default=0.0); ap.add_argument('--to', dest='b', type=float, default=None)
ap.add_argument('--len', type=float, default=90.0); ap.add_argument('--bars', type=int, default=8)
ap.add_argument('--bpm', type=float, default=None); ap.add_argument('--unduck', type=float, default=4.0)
a = ap.parse_args()

x, sr = sf.read(a.src); x = x if x.ndim > 1 else x[:, None]
mono = x.mean(1)

# 1. un-duck
def rms(sig, win):
    k = max(1, int(win * sr)); return np.sqrt(ss.fftconvolve(sig ** 2, np.ones(k) / k, 'same').clip(0)) + 1e-6
fast, slow = rms(mono, 0.06), rms(mono, 1.5)
g = np.clip(slow / fast, 1.0, 10 ** (a.unduck / 20))
g = ss.fftconvolve(g, np.ones(int(0.03 * sr)) / int(0.03 * sr), 'same')
x = x * g[:, None]; mono = x.mean(1)

# 2. tempo
def onset(sig, lo, hi, hop):
    y = ss.sosfilt(ss.butter(4, [lo / (sr / 2), min(hi / (sr / 2), .99)], 'band', output='sos'), sig)
    n = len(y) // hop; e = np.log(np.sqrt((y[:n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-7)
    d = np.maximum(0, np.diff(e, prepend=e[0])); return d - ss.medfilt(d, 41)
hop = int(sr * 0.005)
env = onset(mono, 7000, 12000, hop) + onset(mono, 35, 140, hop)
if a.bpm: bpm = a.bpm
else:
    e = env - env.mean(); ac = np.correlate(e, e, 'full')[len(e) - 1:]
    lags = np.arange(len(ac)); cand = 60 / (np.maximum(lags, 1) * hop / sr)
    ok = (cand >= 90) & (cand <= 150); bpm = float(cand[np.argmax(np.where(ok, ac, -np.inf))])
beat = 60 / bpm; bar = 4 * beat

# 3. loop
A = int(a.a * sr); B = int((a.b if a.b else len(mono) / sr - 0.5) * sr)
kick = onset(mono, 35, 140, hop)   # start on a kick (within half a beat of --from), so the bed lands with the hook
i0 = A // hop; w = int(beat * sr / 2 / hop); lo = max(0, i0 - w); A = max(0, (lo + int(np.argmax(kick[lo:i0 + w]))) * hop - int(0.01 * sr))
L = int(round(a.bars * bar * sr))
while L > (B - A) * 0.8 and L > int(2 * bar * sr): L -= int(round(2 * bar * sr))   # shorter loops for short steady sections
# best jump: compare a 1.5 s window ending at B with candidates ending near B - L (± half a beat)
W = int(1.5 * sr); ref = mono[B - W:B]
best, bo = -2, 0
for off in range(-int(beat * sr / 2), int(beat * sr / 2), int(sr * 0.002)):
    j = B - L + off
    if j - W < A: continue
    c = mono[j - W:j]; r = float(np.dot(ref, c) / (np.linalg.norm(ref) * np.linalg.norm(c) + 1e-9))
    if r > best: best, bo = r, off
J = B - L + bo   # playback jumps from B back to J
# fine-align: +-3 ms on the raw waveform around the jump
seg = mono[B - 2048:B + 2048]
lag = max(range(-132, 133, 2), key=lambda k: float(np.dot(seg, mono[J - 2048 + k:J + 2048 + k])))
J += lag
xf = int(0.04 * sr); fade = np.sqrt(np.linspace(0, 1, xf))[:, None]
out = [x[A:B]]; total = B - A; N = int(a.len * sr)
while total < N:
    piece = x[J:B].copy()
    out[-1] = out[-1].copy(); tail = out[-1][-xf:]
    head = x[J - xf:J]   # crossfade the tail of what played into the audio just before the jump target
    out[-1][-xf:] = tail * fade[::-1] + head * fade
    out.append(piece); total += len(piece)
y = np.concatenate(out)[:N]
fo = int(0.5 * sr); y[-fo:] *= np.linspace(1, 0, fo)[:, None]

# 4. loudness
with tempfile.NamedTemporaryFile(suffix='.wav') as t:
    sf.write(t.name, y, sr, subtype='PCM_24')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', t.name, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', '44100',
                    '-c:a', 'libmp3lame', '-b:a', '192k', a.out], check=True)
print(f'{a.out}: {bpm:.1f} BPM, steady {a.a:.1f}-{B / sr:.1f}s, loop {L / sr / bar:.0f} bars ({(B - J) / sr:.2f}s, match {best:.2f}), {len(y) / sr:.0f}s')
