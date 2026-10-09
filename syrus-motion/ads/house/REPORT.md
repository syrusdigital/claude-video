# House-style ads: measured against the winners

Every ad was scored with `tools/study_ad.py`, the same meter used on the 21 winning ads. The first row is the winners' median.

| Ad | Length | Pace (wpm) | Voice pitch | Music under voice | SFX hits | Avg shot | Cuts | Loudness |
|---|---|---|---|---|---|---|---|---|
| **House median (21 winners)** | 55.9 s | 189.2 | 130.1 Hz | -11.7 dB | 2 | 2.2 s | | -14.3 LUFS |
| vistaguard/v1 · V1 · Two to three times cheaper | 48.6 s | 205 | 148 Hz | -9.8 dB | 2 | 2.21 s | 21 | -14.4 LUFS |
| vistaguard/v6 · V6 · Check the bottom of that quote | 47.8 s | 209 | 142 Hz | -9.6 dB | 2 | 2.51 s | 18 | -14.3 LUFS |
| vistaguard/v3 · V3 · Why pay more? (all-out) | 51.6 s | 188 | 160 Hz | -9.0 dB | 4 | 1.98 s | 25 | -14.3 LUFS |
| gc-countertops/a1 · A1 · $1,995 direct, fair price | 46.2 s | 212 | 142 Hz | -11.5 dB | 4 | 2.01 s | 22 | -14.4 LUFS |
| gc-countertops/b1 · B1 · $30 per square foot + price table | 47.2 s | 205 | 159 Hz | -11.4 dB | 2 | 2.05 s | 22 | -14.2 LUFS |
| gc-countertops/b2 · B2 · Shocked by your quote? (all-out) | 45.9 s | 208 | 160 Hz | -8.6 dB | 0 | 1.64 s | 27 | -14.7 LUFS |
| luxury-home/p1 · P1 · Seven-day showcase | 36.5 s | 215 | 148 Hz | -11.3 dB | 2 | 2.81 s | 12 | -14.3 LUFS |
| luxury-home/f1 · F1 · $14,995 full bathroom, what's included | 77.8 s | 191 | 142 Hz | -11.0 dB | 9 | 2.88 s | 26 | -14.0 LUFS |
| luxury-home/f2 · F2 · Biggest special ever, $14,995 (all-out) | 78.4 s | 198 | 150 Hz | -10.9 dB | 0 | 2.53 s | 30 | -14.4 LUFS |
| rob-art/v5 · V5 · $19,995 that's crazy | 78.7 s | 187 | 151 Hz | -11.8 dB | 5 | 2.13 s | 36 | -14.2 LUFS |
| rob-art/v1 · V1 · Why pay $40,000 | 70.6 s | 192 | 144 Hz | -11.0 dB | 0 | 2.21 s | 31 | -14.4 LUFS |
| rob-art/v4 · V4 · $349 a month (all-out) | 54.4 s | 199 | 150 Hz | -9.2 dB | 0 | 1.81 s | 29 | -14.7 LUFS |

Pace counts Whisper tokens (a price like "$1,995" counts as two), the same way the winners were measured.
SFX hits are what the detector finds: sharp transients away from words, which can include a music hit. The only effects these ads add are whooshes on the zoom-blur transitions and the CTA card.
