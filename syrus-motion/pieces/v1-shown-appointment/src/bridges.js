// =====================================================================
//  ERAS, CAMERAS, BRIDGES — Syrus V1 (read by kit/morph.js). Gold carries across every bridge:
//  the tapped button -> the booked slot -> the front door. Era 3 -> 4 is the one hard cut (the slam).
// =====================================================================
const ERA_BG = [PAL.paper, PAL.paper, PAL.paper, PAL.paper];
function pieceCam(era, t) {
  if (era === 1) { const g = isoAt(ISO2, 40, 32, ZT); return push(t, 5.25, 7.5, { z: 1.05, p: g, to: g }, 7.5, 7.85); }
  if (era === 2) { const d = isoAt(ISO3, HS.x + DOOR.u + DOOR.w / 2, FRONT_Y, GZ + DOOR.h / 2); return push(t, cu.door + 0.2, cu.silence, { z: 1.05, p: d, to: d }); }
  if (era === 3) { const p = isoAt(ISO4, 0, -40, PZ + 190); return push(t, cu.line, 15.6, { z: 1.03, p, to: p }); }
  return null;
}
const BRIDGES = [
  { tc: 4.0, d: 0.4,
    A: () => { setIso(ISO1); return { P: facePts(btnTop(), rrectPts(BTN.u, BTN.v, BTN.w, BTN.h, 14, 3)), c: GOLD }; },
    B: () => { setIso(ISO2); return { P: facePts(goldTop(), rrectPts(0, 0, TILE.w, TILE.d, 9, 3)), c: GOLD }; } },
  { tc: 8.0, d: 0.4,
    A: () => { setIso(ISO2); return { P: facePts(goldTop(), rrectPts(0, 0, TILE.w, TILE.d, 9, 3)), c: GOLD }; },
    B: () => { setIso(ISO3); return { P: facePts(doorFace(), rrectPts(0, 0, DOOR.w, DOOR.h, 4, 3)), c: GOLD }; } },
];
