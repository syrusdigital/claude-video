# House-style ads: measured against the winners

Every ad was scored with `tools/study_ad.py`, the same meter used on the 21 winning ads. The first row is the winners' median.

| Ad | Length | Pace (wpm) | Voice pitch | Music under voice | SFX hits | Avg shot | Cuts | Loudness |
|---|---|---|---|---|---|---|---|---|
| **House median (21 winners)** | 55.9 s | 189.2 | 130.1 Hz | -11.7 dB | 2 | 2.2 s | | -14.3 LUFS |
| vistaguard/v1 · V1 · Two to three times cheaper | 48.5 s | 205 | 157 Hz | -7.8 dB | 0 | 1.87 s | 25 | -14.3 LUFS |
| vistaguard/v6 · V6 · Check the bottom of that quote | 47.7 s | 209 | 150 Hz | -7.5 dB | 1 | 2.07 s | 22 | -14.2 LUFS |
| vistaguard/v3 · V3 · Why pay more? (all-out) | 51.5 s | 191 | 172 Hz | -7.4 dB | 2 | 1.51 s | 33 | -14.2 LUFS |
| gc-countertops/a1 · A1 · $1,995 direct, fair price | 46.1 s | 213 | 157 Hz | -8.7 dB | 3 | 1.92 s | 23 | -14.3 LUFS |
| gc-countertops/b1 · B1 · $30 per square foot + price table | 47.1 s | 205 | 173 Hz | -9.1 dB | 3 | 2.05 s | 22 | -14.2 LUFS |
| gc-countertops/b2 · B2 · Shocked by your quote? (all-out) | 45.8 s | 209 | 176 Hz | -7.6 dB | 1 | 1.58 s | 28 | -14.6 LUFS |
| luxury-home/p1 · P1 · Seven-day showcase | 36.4 s | 216 | 160 Hz | -9.4 dB | 0 | 1.92 s | 18 | -14.3 LUFS |
| luxury-home/f1 · F1 · $14,995 full bathroom, what's included | 74.1 s | 191 | 155 Hz | -9.1 dB | 3 | 1.95 s | 37 | -14.1 LUFS |
| luxury-home/f2 · F2 · Biggest special ever, $14,995 (all-out) | 78.3 s | 198 | 157 Hz | -8.3 dB | 3 | 1.4 s | 55 | -14.4 LUFS |
| rob-art/v5 · V5 · $19,995 that's crazy | 76.0 s | 193 | 164 Hz | -10.0 dB | 7 | 1.85 s | 40 | -14.1 LUFS |
| rob-art/v1 · V1 · Why pay $40,000 | 70.5 s | 192 | 158 Hz | -9.2 dB | 2 | 2.14 s | 32 | -14.4 LUFS |
| rob-art/v4 · V4 · $349 a month (all-out) | 54.3 s | 198 | 165 Hz | -7.3 dB | 5 | 1.51 s | 35 | -14.6 LUFS |

Pace counts Whisper tokens (a price like "$1,995" counts as two), the same way the winners were measured.
SFX hits are what the detector finds: sharp transients away from words, which can include a music hit. The only effects these ads add are whooshes on the zoom-blur transitions and the CTA card.
