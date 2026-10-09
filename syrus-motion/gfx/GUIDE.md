# Syrus gfx — template guide (read fully before writing a template)

Syrus Digital is a contractor-marketing agency. Our clients' Meta ads are ~95% AI-voiceover over B-roll, 9:16, 38–78s,
word-by-word captions, a hard price in the first 2 seconds, "click Get Quote below" at the end. Editors (Wojtek, Maanov) use
Premiere / CapCut. These templates become (a) a pack of drop-in files for editors and (b) graphics inside full ads we cut.

## Engine
- `gfx/lib.js` — helpers + runner. **Do not edit lib.js** (other people are writing templates at the same time).
- One file per template in `gfx/tpl/<slug>.js`. All template files load into ONE page, so a file must only do
  `TPL.camelName = { dur, defaults, draw(t, c, E) { ... } };` — no other top-level declarations. Put helpers inside
  the object (`TPL.x.helper = ...` / methods) or inside `draw`. Never redeclare lib names.
- `draw(t, c, E)`: `t` = seconds since the item started, `c` = defaults merged with the item's cfg (+ `c.dur`),
  `E = { W: 1080, H: 1920, fps: 30, B: brand, T: absolute time }`. Must be a pure function of time: no state across
  frames, no `Math.random` (use `RNG(key)`), no Date.
- Helpers available (see lib.js): `clamp lerp seg easeOut easeIn easeIO backOut spring(t,k,d) life(t,dur,out,k,d) RNG`,
  `rrect card(x,y,w,h,r,fill,{shadow,stroke}) font text(str,x,y,size,color,{align,weight,font,italic,spacing,shadow,alpha,stroke,strokeColor}) measure fitSize money circle line(P,color,lw,{dash}) partial(P,frac) check(x,y,s,color,frac) arrowDown withAlpha(a,fn) at(x,y,scale,rot,fn) hexA(hex,a)`,
  fonts `SANS SERIF MONO`, global `ctx`.
- Brand: `E.B = { card '#002F6C' navy, ink '#F8F8F4', accent '#FFD700' gold, sky '#66C2FF', bad '#FF4D5E', good '#3DDC84', dark '#0B1424' }`.
  Always colour through `E.B` (a client variant swaps the brand). Gold = the offer / the money / the payoff only.
- Render: `node tools/gfx.mjs <spec.json> <out-base>` (alpha .mov + .webm + preview) or with `"bg": "#hex"` in the spec
  for full-screen opaque pieces (→ .mp4). Review stills: `node tools/gfx.mjs <spec> <out> --still 0.5,1.5,3 --still-out sheet.png`
  then LOOK at the sheet with the Read tool. A spec: `{ "fps": 30, "duration": 4, "items": [ { "tpl": "checklist", "at": 0, "cfg": {...} } ] }`.
- Render ONE thing at a time (memory). Each render takes seconds; frames are deleted after encode.

## Look and motion (match what wins in our ads)
- Phone-first: anything that matters ≥ 100px; body text ≥ 44px; nothing important outside x 60–1020, y 250–1500
  (the Reels UI covers the rest). Overlays must read over ANY footage: solid navy cards with soft shadow, or white/gold type
  with a dark stroke (`stroke: 10`) — never thin text floating on video.
- Premium-minimal, not neon/HUD (Eddie rejected the neon JARVIS look). Heavy sans (900) for numbers/headlines,
  serif italic only for the "price-shock" style numbers. Rounded cards r 28–40.
- Motion: things enter on springs within 0.25–0.45s (`spring(t-beat, 200..320, 17..22)`), small overshoot, then HOLD still
  so the editor can cut anywhere. Leave over the last ~0.3s (`life()`), so the file can be trimmed. Stagger lists ~0.25–0.4s
  per item (one item per VO beat). Something new every 1–2s while it's on screen. No everything-fades-in, no particle bursts.
- Every template is config-driven: copy, numbers, item lists, positions (`y`), beat times. Put a real Syrus-client example
  in `defaults`.

## Compliance (hard rules)
- No invented reviews, star ratings, review counts or fake app/product UI. Ever.
- Financing: only the safe line "$0 down options available" unless cfg supplies a full disclosure line.
- Scarcity numbers, deadlines, warranties, years in business are cfg values the client confirms — never hard-code a claim as fact.
- Roofing: never "free roof", "we pay your deductible", "we handle your claim".
- Draw original icons/characters only (no logos of real brands, no copyrighted characters).

## Deliverables for each pack item
- Folder `pack/<NN>-<slug>/` containing: `spec.json` (the exact spec rendered), `<slug>.mov`, `<slug>.webm`, `<slug>-preview.mp4`
  (alpha items) or `<slug>.mp4` (full-screen), and `sheet.png` (a 4–6 still review sheet).
- Before finishing an item: view its sheet, fix overlaps/clipping/illegible text, re-render. Then one line in your report:
  `NN slug — what it is — duration — how an editor uses it`.
