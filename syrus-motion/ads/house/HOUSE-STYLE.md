# The Syrus house style, measured

I measured 21 of our own winning Meta video ads across 8 accounts with `tools/study_ad.py`:
- American Made Coatings (AMC)
- Anyvision
- Five Star Bath
- Innovative Interiors
- Rob-Art Design
- Total Home Remodeling
- Vistaguard
- Work Horse

The reports, contact sheets and hook frames are in `study/<account>/<ad>/`. The numbers below are medians, with the range in brackets.

| | House (21 winners) |
|---|---|
| Length | 56 s (19–86). AI/VO ads 41–86 s |
| Voice | Male ElevenLabs-style read, ~130 Hz (120–152), warm, conversational |
| Pace | 189 wpm (161–240). Pauses cut to almost nothing; the only breaths left are at full stops |
| Music | A real stock bed (lo-fi / corporate-inspirational, ~86 BPM), 11.7 dB under the voice (7–25), audible in every gap. It stops with the voice or runs out at the last word |
| Sound effects | **2 per ad** (0–6). Whooshes on 2–4 zoom-blur transitions and on the CTA card. No cash register, no boom on the price |
| Shots | 2.2 s average (1.2–3.8), 15–40 cuts. Every shot drifts (a push-in on stills and video), with hard cuts plus a few zoom-blur whips |
| Loudness | −14.3 LUFS integrated |

## On-screen text: the signature
- **Centred**, at 47–52% of frame height. It is never bottom subtitles.
- **1–3 words at a time.** Each word appears on its spoken syllable. A chunk holds until the next one starts, then clears.
- **Mixed weight inside every chunk.** Filler words are small, light and lowercase. The key word is about 2× bigger and heavy.
- **Serif italic** (Playfair or Times style) for prices, places and "premium" words: *$19,995*, *New Jersey*, *custom*, *warranty*, *2012*. Vistaguard uses a heavy sans italic instead.
- **White only**, with a soft shadow and no boxes. Colour is reserved for the hook price (a gold gradient) and the CTA.
- **The hook builds a stack:**
  - The price lands first in big gold serif.
  - The rest of the line builds under it ("FOR A / CONCRETE FLOOR COATING?").
  - Small caps for the function words, heavy caps for the rest.

## Structure
1. **Hook (0–4 s).** The price or offer is the first word, as in "$1,995 for a concrete floor coating? That's crazy." Or a "Why pay $X when…" line that calls out the ICP.
2. **Body.** The script runs word for word. Proven scripts are replicated, not rewritten. Garage Force A1 is AMC Script 4 copied verbatim, and it now beats the original ($13.92 vs $22.22 CPL).
3. **One brand moment.** The client name on a pill, or the logo over job footage.
4. **CTA, read in the VO.** Either a frosted-glass card ("click / **Get Quote** / below", with Get Quote in an orange→yellow gradient) or caps "CLICK "GET QUOTE" BELOW" with a red arrow. There is no end slate.

## Footage
The client's own job footage and photos are the backbone:
- About 80% on Rob-Art V4, where phone stills get Ken Burns pushes.
- Most of Vistaguard V2 and AMC V4.

Stock is used only for metaphor lines:
- a calculator for "quotes";
- a storm for "hurricane";
- a highway for "big companies".

AI imagery is rare.

## How the 10 new ads apply it
- `gfx/tpl/kinetic.js` is the centred text, `gfx/tpl/cta-glass.js` is the CTA card and logo pill, and `tools/cut.py` handles whips, the real music bed and the end-with-VO timing.
- VO: ElevenLabs "Michael", one take per ad. `tools/vo_ingest.py` cuts pauses to 0.12 s and paces the read to about 180–190 wpm.
- Every ad is scored with `tools/study_ad.py`, the same meter used on the 21 winners. Results are in `ads/house/REPORT.md`.
