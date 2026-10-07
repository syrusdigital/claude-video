# House-style ads: measured against the winners

Every ad was scored with `tools/study_ad.py`, the same meter used on the 21 winning ads. The first row is the winners' median.

| Ad | Length | Pace (wpm) | Voice pitch | Music under voice | SFX hits | Avg shot | Cuts | Loudness |
|---|---|---|---|---|---|---|---|---|
| **House median (21 winners)** | 55.9 s | 189.2 | 130.1 Hz | -11.7 dB | 2 | 2.2 s | | -14.3 LUFS |
| vistaguard/v1 · V1 · Two to three times cheaper | 54.8 s | 182 | 120 Hz | -10.8 dB | 6 | 2.11 s | 25 | -13.8 LUFS |
| vistaguard/v6 · V6 · Check the bottom of that quote | 54.2 s | 185 | 120 Hz | -10.3 dB | 3 | 2.26 s | 23 | -14.0 LUFS |
| gc-countertops/a1 · A1 · $1,995 direct, fair price | 53.0 s | 184 | 118 Hz | -10.8 dB | 0 | 2.31 s | 22 | -14.1 LUFS |
| gc-countertops/b1 · B1 · $30 per square foot + price table | 55.2 s | 176 | 119 Hz | -11.0 dB | 2 | 2.4 s | 22 | -14.4 LUFS |
| luxury-home/p1 · P1 · Seven-day showcase | 40.9 s | 193 | 129 Hz | -10.0 dB | 2 | 2.15 s | 18 | -13.9 LUFS |
| luxury-home/f1 · F1 · $14,995 full bathroom, what's included | 85.6 s | 165 | 120 Hz | -12.7 dB | 6 | 2.2 s | 38 | -13.9 LUFS |
| rob-art/v5 · V5 · $19,995 that's crazy | 82.7 s | 178 | 119 Hz | -12.5 dB | 1 | 1.97 s | 41 | -14.3 LUFS |
| rob-art/v1 · V1 · Why pay $40,000 | 77.6 s | 174 | 121 Hz | -14.1 dB | 0 | 2.28 s | 33 | -14.4 LUFS |

Pace counts Whisper tokens (a price like "$1,995" counts as two), the same way the winners were measured.
SFX hits are what the detector finds: sharp transients away from words, which can include a music hit. The only effects these ads add are whooshes on the zoom-blur transitions and the CTA card.
