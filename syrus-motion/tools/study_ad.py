#!/usr/bin/env python3
"""Measure a finished ad: what the voice, music, sound effects, cuts and captions are actually doing.

usage: python3 tools/study_ad.py <video> <out-dir> [--label NAME]
writes <out-dir>/report.json, report.md, sheet.jpg (1 frame/s), hook.jpg (0.5/1.5/3/5 s at full size), words.json

Measures (all from the file, nothing guessed):
  voice    transcript + word times (faster-whisper small.en), words per minute over the spoken span, the first money
           mention, the hook (first 5 s), median voice pitch (male < ~165 Hz < female)
  music    bed level under the voice = level in the gaps between words vs level during words (dB), a rough tempo
  sfx      sharp hits / whooshes that stand out from both the voice and the bed, and whether they land on picture cuts
  picture  cuts (ffmpeg scene score), average shot length, loudness (EBU R128)
"""
import json, os, re, subprocess, sys
import numpy as np

src, OUT = os.path.abspath(sys.argv[1]), os.path.abspath(sys.argv[2])
LABEL = sys.argv[sys.argv.index('--label') + 1] if '--label' in sys.argv else os.path.basename(src)
os.makedirs(OUT, exist_ok=True)
SR = 16000


def run(*a): return subprocess.run([str(x) for x in a], capture_output=True, text=True)


probe = json.loads(run('ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height', '-of', 'json', src).stdout)
DUR = float(probe['format']['duration'])
vs = next((s for s in probe['streams'] if s['codec_type'] == 'video'), {})
pcm = run('ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', SR, '-f', 'f32le', '-').stdout if False else None
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
x = np.frombuffer(raw, np.float32).copy()

# ---- voice: transcript with word times (decoded array in, so no container issues)
from faster_whisper import WhisperModel
m = WhisperModel('small.en', device='cpu', compute_type='int8', download_root=os.path.expanduser('~/.cache/syrus-tts/whisper'))
segs, _ = m.transcribe(x, word_timestamps=True, vad_filter=False, beam_size=5)
words = [{'w': w.word.strip(), 't0': round(w.start, 2), 't1': round(w.end, 2)} for s in segs for w in (s.words or [])]
json.dump(words, open(os.path.join(OUT, 'words.json'), 'w'), indent=0)
text = ' '.join(w['w'] for w in words)
span = (words[-1]['t1'] - words[0]['t0']) if words else 0
wpm = round(len(words) / span * 60, 1) if span else 0
money = next((w for w in words if re.search(r'\$|\d{3,}|thousand|hundred', w['w'], re.I)), None)
hook = ' '.join(w['w'] for w in words if w['t0'] < 5.0)

# ---- level envelope (50 ms) and a speech mask from the word times
hop = int(0.05 * SR); n = len(x) // hop
rms = np.sqrt(np.mean(x[:n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12); db = 20 * np.log10(rms + 1e-9)
tt = (np.arange(n) + 0.5) * hop / SR
speech = np.zeros(n, bool)
for w in words: speech[(tt >= w['t0'] - 0.03) & (tt <= w['t1'] + 0.03)] = True
inside = (tt > (words[0]['t0'] if words else 0)) & (tt < (words[-1]['t1'] if words else DUR))
gap = inside & ~speech
# gaps shorter than 0.15 s are mostly word tails; keep longer ones
gap_db = db[gap]; sp_db = db[speech]
voice_db = float(np.median(sp_db)) if len(sp_db) else None
bed_db = float(np.percentile(gap_db, 50)) if len(gap_db) > 10 else None
bed_rel = round(bed_db - voice_db, 1) if (bed_db is not None and voice_db is not None) else None
# dense VO leaves almost no gaps, so also read the FLOOR: in 10 ms frames, speech alone dips 25+ dB below its median
# between syllables; a music bed holds the floor up. floor_rel = 3rd percentile - median, inside the spoken span.
hop10 = int(0.01 * SR); n10 = len(x) // hop10
db10 = 20 * np.log10(np.sqrt(np.mean(x[:n10 * hop10].reshape(n10, hop10) ** 2, axis=1)) + 1e-9)
t10 = (np.arange(n10) + 0.5) * 0.01
span10 = db10[(t10 > (words[0]['t0'] if words else 0) + 0.2) & (t10 < (words[-1]['t1'] if words else DUR) - 0.2)]
floor_rel = round(float(np.percentile(span10, 3) - np.median(span10)), 1) if len(span10) > 100 else None
# calibrated on our own cuts: VO-only reads about -30 or lower; a bed 10 dB under the voice reads about -12
music_present = bool((floor_rel is not None and floor_rel > -22) or (bed_db is not None and bed_db > -50))
tail = db10[t10 > (words[-1]['t1'] + 0.3 if words else DUR)]
tail_db = round(float(np.median(tail)), 1) if len(tail) > 10 else None

# ---- pitch of the voice: autocorrelation on voiced 40 ms frames inside words
def f0(frame):
    frame = frame - frame.mean(); c = np.correlate(frame, frame, 'full')[len(frame) - 1:]
    lo, hi = int(SR / 350), int(SR / 70)
    if c[0] <= 0: return None
    k = lo + int(np.argmax(c[lo:hi])); return SR / k if c[k] / c[0] > 0.45 else None
fr = int(0.04 * SR); pitches = []
for w in words[:400]:
    a, b = int(w['t0'] * SR), int(w['t1'] * SR)
    for s in range(a, max(a, b - fr), fr):
        seg_ = x[s:s + fr]
        if len(seg_) == fr and np.sqrt(np.mean(seg_ ** 2)) > 0.02:
            p = f0(seg_)
            if p: pitches.append(p)
pitch = round(float(np.median(pitches)), 1) if pitches else None

# ---- tempo of the bed: autocorrelation of a high-passed onset envelope (rough)
from scipy.signal import butter, sosfilt, find_peaks
hp = sosfilt(butter(4, 2500, 'hp', fs=SR, output='sos'), x)
hop2 = int(0.01 * SR); n2 = len(hp) // hop2
env = np.sqrt(np.mean(hp[:n2 * hop2].reshape(n2, hop2) ** 2, axis=1))
on = np.maximum(0, np.diff(np.log(env + 1e-6), prepend=0)); on -= on.mean()
ac = np.correlate(on, on, 'full')[len(on) - 1:]
lags = np.arange(len(ac)) * 0.01; band = (lags > 60 / 170) & (lags < 60 / 70)
bpm = round(60 / lags[band][np.argmax(ac[band])], 1) if band.any() else None
bpm_conf = round(float(ac[band].max() / (ac[0] + 1e-9)), 3) if band.any() else None

# ---- sound effects: sharp broadband hits and noise swells that stand out from the local bed
# spectral flux on a 20 ms grid; a hit = a flux peak far above its 2 s neighbourhood, with energy above 4 kHz
hop3 = int(0.02 * SR); win = 1024; n3 = (len(x) - win) // hop3
if n3 > 10:
    frames = np.lib.stride_tricks.sliding_window_view(x, win)[::hop3][:n3] * np.hanning(win)
    S = np.abs(np.fft.rfft(frames, axis=1)); fq = np.fft.rfftfreq(win, 1 / SR)
    flux = np.maximum(0, np.diff(S, axis=0)).sum(axis=1); flux = np.concatenate([[0], flux])
    hf = S[:, fq > 4000].sum(axis=1) / (S.sum(axis=1) + 1e-9)
    t3 = np.arange(n3) * hop3 / SR + win / 2 / SR
    k = int(1.0 / 0.02); med = np.array([np.median(flux[max(0, i - k):i + k]) for i in range(n3)])
    pk, _ = find_peaks(flux, height=med * 6 + 1e-6, distance=int(0.25 / 0.02))
    word_on = np.array([w['t0'] for w in words]) if words else np.array([99999.0])
    hits = [round(float(t3[i]), 2) for i in pk if hf[i] > 0.12 and np.min(np.abs(word_on - t3[i])) > 0.08]
    # swells (whoosh / riser): HF share rising for > 0.25 s in a gap
    sw = []
    hfz = (hf - np.median(hf)) / (np.std(hf) + 1e-9)
    above = hfz > 2.0; i = 0
    while i < n3:
        if above[i]:
            j = i
            while j < n3 and above[j]: j += 1
            if (j - i) * 0.02 >= 0.25: sw.append([round(float(t3[i]), 2), round(float(t3[j - 1]), 2)])
            i = j
        else: i += 1
else:
    hits, sw = [], []

# ---- picture: cuts and loudness
sc = run('ffmpeg', '-v', 'info', '-i', src, '-vf', "select='gt(scene,0.28)',showinfo", '-an', '-f', 'null', '-').stderr
cuts = [round(float(v), 2) for v in re.findall(r'pts_time:([\d.]+)', sc)]
shots = np.diff([0] + cuts + [DUR]) if True else []
lu = run('ffmpeg', '-v', 'info', '-i', src, '-af', 'ebur128', '-f', 'null', '-').stderr
I = re.findall(r'I:\s+(-?[\d.]+) LUFS', lu); LRA = re.findall(r'LRA:\s+([\d.]+) LU', lu)
hits_on_cuts = sum(1 for h in hits if any(abs(h - c) < 0.15 for c in cuts))

# ---- frames to read captions and graphics
run('ffmpeg', '-y', '-v', 'error', '-i', src, '-vf', 'fps=1,scale=180:-2,tile=10x%d:padding=4:color=0x0b1424' % int(np.ceil(DUR / 10)), '-frames:v', 1, os.path.join(OUT, 'sheet.jpg'))
ins = []; fl = []
for i, t in enumerate([0.5, 1.5, 3.0, 5.0]):
    ins += ['-ss', str(min(t, DUR - 0.1)), '-i', src]; fl.append(f'[{i}:v]scale=-2:640[v{i}]')
run('ffmpeg', '-y', '-v', 'error', *ins, '-filter_complex', ';'.join(fl) + ';' + ''.join(f'[v{i}]' for i in range(4)) + 'hstack=4', '-frames:v', 1, os.path.join(OUT, 'hook.jpg'))

R = {'label': LABEL, 'file': src, 'duration': round(DUR, 2), 'size': f"{vs.get('width')}x{vs.get('height')}",
     'voice': {'words': len(words), 'wpm': wpm, 'pitch_hz': pitch, 'voice_guess': (None if pitch is None else ('male' if pitch < 165 else 'female')),
               'first_word_at': words[0]['t0'] if words else None, 'first_money_at': money['t0'] if money else None,
               'first_money_word': money['w'] if money else None, 'hook_5s': hook, 'text': text},
     'music': {'present': music_present, 'floor_rel_db': floor_rel, 'after_vo_db': tail_db, 'bed_db_rel_voice': bed_rel, 'voice_dbfs': None if voice_db is None else round(voice_db, 1),
               'bed_dbfs': None if bed_db is None else round(bed_db, 1), 'tempo_bpm_rough': bpm, 'tempo_confidence': bpm_conf},
     'sfx': {'hits': hits, 'hit_count': len(hits), 'hits_per_min': round(len(hits) / DUR * 60, 1), 'hits_on_cuts': hits_on_cuts, 'swells': sw},
     'picture': {'cuts': len(cuts), 'cut_times': cuts, 'avg_shot_s': round(float(np.mean(shots)), 2) if len(shots) else None,
                 'median_shot_s': round(float(np.median(shots)), 2) if len(shots) else None},
     'loudness': {'integrated_lufs': float(I[-1]) if I else None, 'lra': float(LRA[-1]) if LRA else None}}
json.dump(R, open(os.path.join(OUT, 'report.json'), 'w'), indent=1)
v, mu, s, p = R['voice'], R['music'], R['sfx'], R['picture']
md = f"""# {LABEL}
{R['duration']}s · {R['size']} · {R['loudness']['integrated_lufs']} LUFS
- **Voice:** {v['voice_guess']} (~{v['pitch_hz']} Hz), {v['wpm']} wpm, first word at {v['first_word_at']}s, first money at {v['first_money_at']}s ("{v['first_money_word']}")
- **Hook (0-5s):** {v['hook_5s']}
- **Music:** {'yes' if mu['present'] else 'no'} · floor {mu['floor_rel_db']} dB vs voice (≈ minus how far the music sits under the voice; VO-only reads below -30) · gap bed {mu['bed_db_rel_voice']} dB · after VO {mu['after_vo_db']} dBFS · tempo ~{mu['tempo_bpm_rough']} (conf {mu['tempo_confidence']})
- **SFX:** {s['hit_count']} hits ({s['hits_per_min']}/min), {s['hits_on_cuts']} on cuts · swells {s['swells'][:8]}
- **Picture:** {p['cuts']} cuts, avg shot {p['avg_shot_s']}s (median {p['median_shot_s']}s)

{v['text']}
"""
open(os.path.join(OUT, 'report.md'), 'w').write(md)
print(md[:900])
