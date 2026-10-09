# Syrus motion — procedural videos in code

Two Syrus Digital test videos made with Chase AI's **animate** skill for Claude Code
([cth9191/animate](https://github.com/cth9191/animate), MIT). The method comes from the video
"Claude Now Does Video (FOR FREE) Thanks To JavaScript": JavaScript draws every frame on a `<canvas>`,
a headless Chromium (Playwright) renders the frames, ffmpeg stitches them to MP4, and the score is
synthesized in code. No AI video generator and no paid render.

These files sit outside the `/watch` skill (`skills/watch/`) and don't change it.

| piece | style | length | the line |
|---|---|---|---|
| `pieces/v1-shown-appointment` | `syrus-iso`: isometric line art in Syrus navy, gold for the appointment | 16s, 9:16 | Pay per shown appointment. |
| `pieces/v2-pay-per-estimate` | `syrus-riso`: a riso print made with Syrus navy, sky and gold inks | 12s, 9:16 | Pay per estimate. |

Both offer lines are the approved Syrus wording (OpenBrain decision, 2026-09-14). In each piece,
gold stands for the appointment or estimate and is used for nothing else.

## Styles

`styles/syrus-iso/` and `styles/syrus-riso/` are recoloured copies of the skill's `isometric` and `riso`
kits, with the Syrus palette from Bloom (`#002F6C` navy, `#FFD700` gold, `#66C2FF` sky, `#F8F8F4` paper)
and Geist type, falling back to Inter. `build.mjs` finds them because they sit next to `pieces/`.

## Rebuild

```bash
# one-time: install the skill (Node 18+, Playwright Chromium and ffmpeg are required)
git clone https://github.com/cth9191/animate /tmp/animate
cp -r /tmp/animate/plugins/animate/skills/animate ~/.claude/skills/animate
SK=~/.claude/skills/animate

cd syrus-motion
node $SK/tools/build.mjs pieces/v1-shown-appointment            # -> index.html (open it to preview; click for sound)
node $SK/tools/storyboard.mjs pieces/v1-shown-appointment       # -> storyboard.png
node $SK/tools/export.mjs pieces/v1-shown-appointment --share   # -> renders/final.mp4 + share.mp4
node $SK/tools/review.mjs pieces/v1-shown-appointment           # measured checks + contact sheets
```

## Review results (`review.mjs`)

| check | V1 | V2 |
|---|---|---|
| cuts and morphs on the 120 BPM 8th grid | PASS | PASS |
| story arc (silence before the payoff, loudest hit on it) | 4/4 | 4/4 |
| text cut off or overlapping | 0 | 0 |
| dead beats over 3s | 0 | 0 |
| loudness | -14.9 LUFS, peak -1.0 dBFS | -14.9 LUFS, peak -1.0 dBFS |

## Notes

- The skill's storyboard renderer (`kit/board.js`) needs a `HAND` font constant, and the isometric demo
  head doesn't define one, so storyboards crash with `HAND is not defined`. Both piece heads here define it.
  This could go upstream as a PR.
- Nobody has listened to the scores yet. They're measured, not heard.
