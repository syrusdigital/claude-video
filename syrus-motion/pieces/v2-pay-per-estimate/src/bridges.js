// =====================================================================
//  ERAS, CAMERAS, BRIDGES — Syrus V2 (read by kit/morph.js). One morph: the gold card -> the gold clipboard.
//  Era 2 -> 3 is the one hard cut (the slam). Colours for the renderer are printed ink colours (inkRGB).
// =====================================================================
const ERA_BG = [rgbHex(inkRGB(WALL1)), rgbHex(inkRGB(WALL2)), rgbHex(inkRGB(WALL1))];
function pieceCam(era, t) {
  if (era === 0) return push(t, 1.5, 2.6, { z: 1.06, p: [500, 640], to: [500, 640] }, 3.2, 3.6);
  if (era === 1) return push(t, 5.0, cu.silence, { z: 1.06, p: [CLIP.x + CLIP.w / 2, CLIP.y + CLIP.h / 2], to: [CLIP.x + CLIP.w / 2, CLIP.y + CLIP.h / 2] });
  return null;
}
const GOLD_HEX = rgbHex(inkRGB({ yellow: 1 }));
const BRIDGES = [
  { tc: 4.0, d: 0.45, A: () => ({ P: goldCardPts(PHONE1), c: GOLD_HEX }), B: () => ({ P: clipPts(), c: GOLD_HEX }) },
];
