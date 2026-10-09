# Video Studio (Rafael's editing kit for Codex)

The same framework as the Syrus ad pipeline, cut down to one driver Codex can run on Rafael's computer:
download -> look (contact sheets + word-timed transcripts) -> rough cut on real pauses -> edit.json -> auto colour + HDR tone-map -> captions, hook, lower third, b-roll, privacy blur, end card, music ducking -> exact export -> automatic check.

| File | What it is |
|---|---|
| `studio.py` | The driver (pure Python + ffmpeg; Mac, Windows, Linux). `doctor`, `selftest`, `new`, `get`, `look`, `rough`, `cut`, `check`, `deliver`. |
| `AGENTS.md` | Codex's operating manual: the A-to-Z workflow, edit.json reference, exact output spec, health and privacy rules, first-time interview. |
| `vocab.txt` | Words the transcriber must spell right (glioblastoma and treatment terms). |
| `fixes.json` | Misheard -> correct spelling fixes for captions. |
| `requirements.txt` | faster-whisper, numpy, pillow, yt-dlp, gdown. ffmpeg comes from Homebrew / winget. |

Tested here (Oct 9): `selftest` passes for reel and YouTube (HLG HDR clip, photo, b-roll, blur box, jump-cut zoom, music).
A real iPhone HDR talking-head test with two pauses and a flubbed retake also passes. The rough cut split on the real silences, Codex-style editing dropped the flub, and captions followed the retake.
Both formats passed every check: -14.0 LUFS, -1.0 dBTP, exact size, 30 fps and fast start.

Notes:
- Whisper smears word times across pauses and skips repeated takes inside one chunk. So `look` finds speech from the audio level first and transcribes each stretch on its own.
- Speed: HDR tone-mapping is CPU-heavy. A 17 s two-format render took 5 min on this sandbox, so use `--draft` while iterating.
- The WhatsApp/Codex setup message is being written in a separate task. It should embed these files verbatim, install ffmpeg + `.venv`, then run `doctor` and `selftest` and the first-time interview.
