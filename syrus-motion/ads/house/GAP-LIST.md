# Gap list: our 9 ads vs the house style

This compares our first batch against the 21 measured winners (see HOUSE-STYLE.md):
- Elite Craft EC1–EC3
- Work Horse WH1–WH3
- Twin Pines TP1–TP3

The numbers for our ads come from their `ad.json` and timelines.

| # | What | Our 9 ads | House (median of 21 winners) | Fixed in the 10 new ads by |
|---|---|---|---|---|
| 1 | **Voice** | Kokoro TTS "am_michael", flat, 145–174 wpm, natural pauses left in | ElevenLabs-style male, 189 wpm, pauses cut to almost zero | ElevenLabs Michael, pauses ≤0.12 s, paced to ~180 wpm with a pitch-preserving stretch |
| 2 | **Where the text sits** | Bottom subtitles (y 1240–1500, 65–78% down) | **Centred** (47–52%), 1–3 words at a time | `kinetic` template |
| 3 | **Text look** | ALL CAPS, one heavy weight (900) with a thick black outline, gold for prices/emphasis words | Light filler + heavy key word; serif italic for prices, places and premium words; white only | Same template: mixed weight, Playfair italic, white |
| 4 | **Graphics load** | 6–14 graphic cards per ad: price cards, checklists, stamps, stat counters, trust badges, unit calculator… | Almost none: the hook price, one logo moment, the CTA. Graphics *are* the kinetic type | Only kinetic text + logo pill + CTA card (plus GC's required price table) |
| 5 | **Sound effects** | **9–49 hits per ad** (WH1: 49) | **2** (0–6), whooshes on transitions and the CTA only | 2–4 per ad: whips + the CTA |
| 6 | **Music** | Synthesized bed at −17 to −24 dB, ducked hard under the voice | Real stock bed ~11.7 dB under the voice, audible in the gaps, ends with the VO | Two real beds (vidIQ), set 10 dB under the voice, light 2 dB duck, cut at the last word |
| 7 | **Hook** | `hookText` / `priceShock` cards, a separate graphic | Price is the first spoken word and lands big in gold serif; the line builds under it | Kinetic hook stack with the gold price pinned |
| 8 | **CTA** | 4 s animated phone-tap card + "TAP GET QUOTE BELOW" + offer line | Glass "click / Get Quote / below" card, or caps + red arrow, under the VO's CTA; no end slate | `ctaGlass` (glass or caps) |
| 9 | **Cutting pace** | AI/VO: 2.0–3.1 s per shot. On-camera TP: **4.7–5.3 s** | 2.2 s; on-camera winners (Vistaguard VID 2/3) cut every 1.2–1.7 s | 1.97–2.3 s, cuts snapped to spoken words, 2–3 zoom-blur whips |
| 10 | **Motion** | Static holds under graphics | Constant drift: a push on every shot | Alternating push-in / pull-out on every shot |
| 11 | **Footage priority** | Client phone clips buried under cards; AI clips as heroes | Client's real job footage/photos are the backbone, stock only for metaphors | Vistaguard + GC: client install/job footage. Rob-Art: their real job photos from robartdesign.com |
| 12 | **Brand moment** | Location supers and name lower-thirds | One logo / name pill | `logoPill` (GC uses its real logo) |
| 13 | **Script** | New edits per ad | Proven scripts replicated word for word | All 10 are word for word from Veer's docs / the Notion Script Library (Rob-Art V1/V5 from the aired ads) |
| 14 | **Loudness** | −14 LUFS ✓ | −14.3 LUFS | unchanged |

## The three biggest misses
1. **Too many graphics and sound effects.** We were decorating, and the house ads don't. WH1 had 14 cards and 49 SFX against a house median of 2 SFX and essentially zero cards.
2. **Text at the bottom, in one style.** The house look is centred, light/heavy and serif italic. It is the most recognisable thing in a Syrus ad.
3. **The voice and pace.** A flat local TTS at ~150 wpm with natural pauses, against an ElevenLabs read at ~190 wpm with no dead air.
