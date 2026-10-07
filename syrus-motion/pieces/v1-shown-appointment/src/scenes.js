// =====================================================================
//  SCENES — Syrus V1. Each scene sets its iso origin, then draws back to front (painter's order).
//  World units ~ px x u; time TT on 1s; every move settles on a spring. Content inside x 60-940, y 250-1500.
//  Gold (GOLD) = the appointment, nothing else: the tapped button, the booked slot, the front door, the bill.
// =====================================================================
const cu = TIMELINE.cues;
const ISO1 = { ox: 540, oy: 1120, u: 1.35 };   // the phone (era 1)
const ISO4 = { ox: 540, oy: 1010, u: 1.15 };   // the phone again, pulled back to make room for the line (era 4)
const ISO2 = { ox: 500, oy: 1090, u: 1.2 };    // the calendar
const ISO3 = { ox: 520, oy: 1050, u: 1.15 };   // the house
const isoAt = (I, x, y, z = 0) => [I.ox + (x - y) * I.u, I.oy + ((x + y) * 0.5 - z * ZK) * I.u];
const textOn = (fp, dy) => (u, v) => vadd(fp(u, v), [0, dy, 0]);   // a face pushed toward +y (a raised button's top)

// ---- the phone on its plinth (eras 1 and 4)
const PL = { x: -160, y: -140, w: 320, d: 280 };
const PZ = 16 + 6 + 14 + 6 + 22;
const PH = { x: -120, y: -60, w: 240, ht: 380, t: 20 };
const BTN = { u: 24, v: 236, w: 192, h: 44, t: 5 };
const phoneFace = () => faceOf([PH.x, PH.y + PH.t, PZ + PH.ht], [1, 0, 0], [0, 0, -1]);
const btnTop = () => textOn(phoneFace(), BTN.t);
function scenePhone(bill) {
  setIso(bill ? ISO4 : ISO1);
  const t0 = bill ? cu.slam : 0;
  const dz = (i) => (bill ? 0 : (1 - spring(TT, cu.plates + i * 0.08, { k: 160, damp: 0.6 })) * 200);
  if (bill || TT > cu.plates) isoPlates(PL.x, PL.y, 0, PL.w, PL.d, [{ h: 16, r: 40, dz: dz(0) }, { h: 14, gap: 6, inset: 10, r: 34, dz: dz(1) - dz(0) }, { h: 22, gap: 6, inset: 20, r: 28, dz: dz(2) - dz(1) }]);
  // a small speaker puck behind, with a lamp that toggles (idle life)
  isoCyl(95, -100, PZ, 22, 26); lamp(faceOf([95, -78, PZ + 20], [1, 0, 0], [0, 0, -1]), 0, 4, 3, blinkOn(TT, 1.0, 0.3));
  // the phone stands on the plinth; it drops in on a spring in era 1
  const drop = bill ? 0 : (1 - spring(TT, cu.phone, { k: 140, damp: 0.62 })) * 300;
  if (bill || TT > cu.phone) {
    isoPanelY(PH.x, PH.y, PZ + drop, PH.w, PH.ht, PH.t, { r: 30 });
    const fp = (u, v) => vadd(phoneFace()(u, v), [0, 0, drop]);
    faceRR(fp, 10, 10, PH.w - 20, PH.ht - 20, 22);
    faceRR(fp, PH.w / 2 - 24, 20, 48, 7, 3.5);
    if (bill) screenBill(fp); else screenAd(fp);
  }
  isoPlant(-112, 92, PZ, 0.9, { ph: 0.8 });
  // the hero: Syrus' cube-bot, in front of the phone; it hops on the tap (era 1) and on the slam (era 4)
  if (bill || TT > cu.phone + 0.1) {
    const hz = PZ + (bill ? 0 : (1 - spring(TT, cu.phone + 0.15, { k: 170, damp: 0.5 })) * 220);
    cubeBot(102, 84, hz, 66, { key: 'hero', hop: bill ? cu.slam : cu.tap, look: -0.6 });
  }
  if (!bill) { isoTag('01', 'the ad'); isoCaption('A homeowner taps your ad.', { size: 52 }); }
  else headline();
}
// the ad in a feed: a kitchen picture, the offer, a button. The tap turns the button gold.
function screenAd(fp) {
  const tapped = TT >= cu.tap;
  ctx.save(); facePath(fp, rrectPts(10, 10, PH.w - 20, PH.ht - 20, 22, 5)); ctx.clip();
  const sc = (1 - spring(TT, cu.card, { k: 90, damp: 0.75 })) * 150;   // the feed scrolls the ad into place
  const S = (u, v) => fp(u, v + sc);
  faceRR(S, 22, -96, 196, 70, 12);                                   // the post above, scrolling away
  faceLine(S, [[36, -64], [150, -64]]); faceLine(S, [[36, -46], [110, -46]]);
  faceRR(S, 22, 40, 196, 120, 12);                                   // the picture: a kitchen, in hairlines
  for (let k = 0; k < 3; k++) faceRR(S, 36 + k * 58, 54, 50, 34, 4, { stroke: PAL.edge });
  faceRR(S, 30, 116, 180, 30, 4, { stroke: PAL.edge });
  faceLine(S, [[120, 116], [120, 100], [132, 100]], PAL.edge);
  isoText(S, 'Sponsored', 24, 182, 13, { color: PAL.textD });
  isoText(S, 'New kitchen?', 24, 208, 26, { font: SANS, weight: 700 });
  isoText(S, 'Free in-home estimate', 24, 228, 15, { font: SANS, color: PAL.textD });
  // the button, raised; gold from the tap on
  const press = tapped ? kick(TT, cu.tap, { k: 300, damp: 0.5 }) * 3 : 0;
  faceSlab(S, BTN.u, BTN.v, BTN.w, BTN.h, BTN.t - press, { r: 14, fill: tapped ? GOLD : PAL.face, edge: tapped ? GOLD_E : PAL.edge, creaseC: tapped ? GOLD_E : PAL.inner });
  const T = textOn(S, BTN.t - press);
  isoText(T, tapped ? 'Requested' : 'Book free estimate', BTN.u + BTN.w / 2, BTN.v + 28, 17, { font: SANS, weight: 600, align: 'center' });
  // the tap: a dark dot presses, then a ring opens (the one accent)
  const cxu = BTN.u + BTN.w * 0.62, cyv = BTN.v + BTN.h / 2;
  if (TT > cu.tap - 0.25 && TT < cu.tap + 0.05) accentDot(T, cxu, cyv, 9);
  if (TT >= cu.tap && TT < cu.tap + 0.6) { const q = (TT - cu.tap) / 0.6, r = 10 + q * 46; faceEll(T, cxu, cyv, r, r * 0.9, { stroke: PAL.accent, w: HAIR * (1.6 - q) }); }
  // the request form fills in, one field at a time
  ['Name', 'Phone', 'Zip'].forEach((lab, i) => {
    const s = spring(TT, cu.form + i * E8, { k: 200, damp: 0.7 });
    faceRR(S, 22, 292 + i * 22, 196, 16, 8, { stroke: s > 0.02 ? PAL.edge : PAL.inner });
    isoText(S, lab, 32, 304 + i * 22, 11, { color: PAL.textD });
    if (s > 0.02) faceRR(S, 78, 296 + i * 22, Math.max(4, [96, 112, 48][i] * s), 8, 4, { fill: PAL.inner, stroke: false });
  });
  ctx.restore();
}
// the same screen at the end: the bill is for one thing — the appointment that showed
function screenBill(fp) {
  const k = (dt) => spring(TT, cu.bill + dt, { k: 160, damp: 0.6 });
  isoText(fp, 'THIS WEEK', 24, 50, 13, { color: PAL.textD });
  const d = k(0);
  if (d > 0.01) {   // the gold door, the same door the van pulled up to
    const dy = (1 - d) * 40;
    faceRR(fp, 78, 66 + dy, 84, 132, 8, { fill: GOLD, stroke: GOLD_E });
    faceRR(fp, 88, 78 + dy, 64, 50, 4, { stroke: GOLD_E }); faceRR(fp, 88, 136 + dy, 64, 50, 4, { stroke: GOLD_E });
    faceEll(fp, 146, 134 + dy, 4, 4, { fill: GOLD_E });
  }
  if (k(0.25) > 0.02) isoText(fp, 'Shown appointment', 120, 232, 21, { font: SANS, weight: 700, align: 'center', al: clamp(k(0.25)) });
  if (k(0.4) > 0.02) isoText(fp, 'Thu  10:00 AM  in-home', 120, 256, 15, { align: 'center', color: PAL.textD, al: clamp(k(0.4)) });
  faceLine(fp, [[24, 272], [216, 272]]);
  [['Homeowner was there', 0.75], ['You walked the job', 1.0]].forEach(([s, dt], i) => {
    const w = clamp((TT - cu.bill - dt) / 0.25);
    if (w <= 0) return;
    faceLine(fp, [[26, 290 + i * 26], [30 + 4 * w, 295 + i * 26], [38 + 6 * w, 284 + i * 26]].slice(0, w > 0.5 ? 3 : 2), PAL.accent, HAIR * 1.4);
    isoText(fp, s, 48, 297 + i * 26, 17, { font: SANS, count: Math.round(w * s.length) });
  });
}
// the payoff line, set at screen size under the object (gold underlines the word it means)
function headline() {
  const f = () => {
    const a = spring(TT, cu.line, { k: 110, damp: 0.8 }), b = spring(TT, cu.line + 0.3, { k: 110, damp: 0.8 }), c = clamp((TT - cu.brand) / 0.5);
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = PAL.text;
    ctx.font = `800 76px ${SANS}`;
    if (a > 0.001) { ctx.globalAlpha = clamp(a); ctx.fillText('Pay per shown', CX, 1320 + (1 - a) * 20); }
    if (b > 0.001) {
      ctx.globalAlpha = clamp(b); const w = ctx.measureText('appointment.').width;
      ctx.fillStyle = GOLD; ctx.fillRect(CX - w / 2, 1404 + (1 - b) * 20, w * clamp(b), 16);
      ctx.fillStyle = PAL.text; ctx.fillText('appointment.', CX, 1404 + (1 - b) * 20);
    }
    if (c > 0) { ctx.globalAlpha = c; ctx.font = `600 30px ${SANS}`; ctx.fillStyle = PAL.textD; ctx.fillText('S Y R U S   D I G I T A L', CX, 1486); }
    ctx.restore();
  };
  if (DEFER) DEFER.push(f); else f();
}

// ---- the calendar (era 2): the gold slot lands, three checks, the bot books it
const CAL = { x: -160, y: -130, w: 320, d: 280, h: 18 };
const CZ = 18 + 6 + 12;                      // plinth top
const ZT = CZ + CAL.h;                       // calendar top
const TILE = { w: 64, d: 56, pu: 74, pv: 68, u0: 20, v0: 66, gi: 2, gj: 1 };
const tileXY = (i, j) => [CAL.x + TILE.u0 + i * TILE.pu, CAL.y + TILE.v0 + j * TILE.pv];
const GOLD_H = 16;
const goldTop = () => { const [x, y] = tileXY(TILE.gi, TILE.gj); return faceOf([x, y, ZT + GOLD_H], [1, 0, 0], [0, 1, 0]); };
function sceneCalendar() {
  setIso(ISO2);
  isoPlates(-190, -200, 0, 380, 390, [{ h: 18, r: 44 }, { h: 12, gap: 6, inset: 12, r: 36 }]);
  // the qualifying checklist stands behind the calendar
  const pf = faceOf([-170, -176, CZ + 210], [1, 0, 0], [0, 0, -1]);
  isoPanelY(-170, -190, CZ, 290, 210, 14, { r: 18 });
  isoText(pf, 'QUALIFIED', 22, 34, 14, { color: PAL.textD });
  ['Owns the home', 'In your service area', 'Ready for an estimate'].forEach((s, k) => {
    const w = clamp((TT - cu.chk - k * 0.5) / 0.25), y = 52 + k * 46;
    faceRR(pf, 20, y, 30, 30, 7, { stroke: w > 0 ? PAL.edge : PAL.inner });
    if (w > 0) faceLine(pf, [[28, y + 14], [34, y + 21], [44, y + 7]].slice(0, w > 0.5 ? 3 : 2), PAL.accent, HAIR * 1.4);
    isoText(pf, s, 60, y + 22, 22, { font: SANS, color: w > 0 ? PAL.text : PAL.textD });
  });
  // the calendar slab, its header, and the day tiles (they ripple once as the slot lands)
  isoBox(CAL.x, CAL.y, CZ, CAL.w, CAL.d, CAL.h, { r: 26 });
  const top = faceOf([CAL.x, CAL.y, ZT], [1, 0, 0], [0, 1, 0]);
  faceRR(top, 18, 14, 284, 40, 10);
  const land = cu.hop + 0.34, bk = 'BOOKED  Thu 10:00 AM';
  if (TT < land) isoText(top, 'THIS WEEK', 32, 41, 18, { font: SANS, weight: 700 });
  else isoText(top, bk, 32, 41, 18, { font: SANS, weight: 700, count: Math.floor((TT - land) * 40) });
  const days = ['Mon', 'Tue', 'Wed', 'Thu'], times = ['8a', '10a', '1p'];
  isoGrid(4, 3, (i, j) => {
    const [x, y] = tileXY(i, j), gold = i === TILE.gi && j === TILE.gj;
    const rip = kick(TT, cu.slot + (Math.abs(i - TILE.gi) + Math.abs(j - TILE.gj)) * 0.06, { k: 200, damp: 0.45 });
    const h = gold ? GOLD_H : 6 + rip * 5;
    isoBox(x, y, ZT, TILE.w, TILE.d, h, gold ? { r: 9, seg: 3, fill: GOLD, edge: GOLD_E, creaseC: GOLD_E } : { r: 9, seg: 3, creaseC: PAL.inner });
    const tf = faceOf([x, y, ZT + h], [1, 0, 0], [0, 1, 0]);
    isoText(tf, gold ? 'Thu 10a' : days[i] + ' ' + times[j], 8, 22, 12, { color: gold ? PAL.text : PAL.textD, font: gold ? SANS : ISOMONO, weight: gold ? 700 : 400 });
  });
  // the hero waits at the front corner, then hops onto the gold slot: booked
  const [gx, gy] = tileXY(TILE.gi, TILE.gj), u = EZ.io(clamp((TT - cu.hop) / 0.34));
  const bx = lerp(150, gx + TILE.w / 2, u), by = lerp(170, gy + TILE.d / 2, u), bz = lerp(CZ, ZT + GOLD_H, u);
  cubeBot(bx, by, bz, 58, { key: 'hero', hop: cu.hop, look: TT < cu.hop ? -0.8 : 0.3 });
  isoTag('02', 'qualified + booked');
  isoCaption('We qualify it. We book it.', { size: 52 });
}

// ---- the house (era 3): the van pulls up, the gold door opens. Then silence.
const HS = { x: -170, y: -150, w: 230, d: 170, h: 170 };
const GZ = 18 + 6 + 12;
const DOOR = { u: 128, w: 84, h: 150 };
const FRONT_Y = HS.y + HS.d;
const doorFace = () => faceOf([HS.x + DOOR.u, FRONT_Y + 6, GZ + DOOR.h], [1, 0, 0], [0, 0, -1]);
const vanX = () => 30 + 720 * (1 - spring(TT, cu.van, { k: 34, damp: 0.86 }));
function sceneHouse() {
  setIso(ISO3);
  isoPlates(-200, -170, 0, 400, 345, [{ h: 18, r: 44 }, { h: 12, gap: 6, inset: 12, r: 36 }]);
  const top = HS.h + GZ, ridgeY = HS.y + HS.d / 2, ridgeZ = top + 84, o = 14;
  const quad = (P3) => { polyPath(P3.map(isoP), true); ctx.fillStyle = PAL.face; ctx.fill(); hair(PAL.edge); ctx.stroke(); };
  quad([[HS.x - o, HS.y - o, top - 6], [HS.x + HS.w + o, HS.y - o, top - 6], [HS.x + HS.w + o, ridgeY, ridgeZ], [HS.x - o, ridgeY, ridgeZ]]);   // back slope
  isoBox(HS.x, HS.y, GZ, HS.w, HS.d, HS.h, { r: 4 });
  quad([[HS.x + HS.w, HS.y, top], [HS.x + HS.w, HS.y + HS.d, top], [HS.x + HS.w, ridgeY, ridgeZ]]);                                         // gable end
  quad([[HS.x - o, FRONT_Y + o, top - 6], [HS.x + HS.w + o, FRONT_Y + o, top - 6], [HS.x + HS.w + o, ridgeY, ridgeZ], [HS.x - o, ridgeY, ridgeZ]]);   // front slope
  for (let k = 1; k < 5; k++) line3([[HS.x - o + k * (HS.w + 2 * o) / 5, FRONT_Y + o, top - 6], [HS.x - o + k * (HS.w + 2 * o) / 5, ridgeY, ridgeZ]], PAL.inner);   // roof seams
  const fr = faceOf([HS.x, FRONT_Y, top], [1, 0, 0], [0, 0, -1]);
  for (const wu of [22]) { faceRR(fr, wu, 34, 84, 64, 6, { stroke: PAL.edge }); faceLine(fr, [[wu + 42, 34], [wu + 42, 98]]); faceLine(fr, [[wu, 66], [wu + 84, 66]]); }
  const sd = faceOf([HS.x + HS.w, HS.y, top], [0, 1, 0], [0, 0, -1]);
  faceRR(sd, 44, 34, 84, 64, 6, { stroke: PAL.edge }); faceLine(sd, [[86, 34], [86, 98]]);
  lamp(fr, DOOR.u + DOOR.w + 14, 40, 5, blinkOn(TT, 1.0));                       // the porch light
  // the doorway (navy inside: the one accent once the door opens) and the gold door on its hinge
  faceRR(fr, DOOR.u, HS.h - DOOR.h, DOOR.w, DOOR.h, 3, { fill: PAL.accent, stroke: PAL.edge });
  const al = 78 * DEG * spring(TT, cu.door, { k: 60, damp: 0.7 });
  isoSlab([HS.x + DOOR.u, FRONT_Y, GZ], [Math.cos(al), Math.sin(al), 0], [0, 0, 1], [-Math.sin(al), Math.cos(al), 0], DOOR.w, DOOR.h, 6, { r: 4, seg: 2, fill: GOLD, edge: GOLD_E, creaseC: GOLD_E });
  if (al < 0.02) { const df = doorFace(); faceRR(df, 10, 12, 64, 54, 4, { stroke: GOLD_E }); faceRR(df, 10, 80, 64, 56, 4, { stroke: GOLD_E }); faceEll(df, 72, 76, 4, 4, { fill: GOLD_E }); }
  // the walk, a mailbox, a tree
  const g = faceOf([HS.x + DOOR.u, FRONT_Y, GZ], [1, 0, 0], [0, 1, 0]);
  faceRR(g, 0, 8, DOOR.w, 70, 6); for (let k = 1; k < 3; k++) faceLine(g, [[0, 8 + k * 23], [DOOR.w, 8 + k * 23]]);
  isoPlant(-178, 128, GZ, 1.25, { ph: 2.1 });
  isoCyl(150, 40, GZ, 5, 64); isoBox(128, 26, GZ + 64, 44, 28, 26, { r: 10 });
  // the van: your crew, pulling up to the curb; the hero rides on its roof
  const vx = vanX(), vy = 98, vz = GZ + 14;
  isoBox(vx - 50, vy, vz, 50, 66, 58, { r: 16 });
  isoBox(vx, vy, vz, 156, 66, 80, { r: 12 });
  const side = faceOf([vx - 50, vy + 66, vz + 80], [1, 0, 0], [0, 0, -1]);
  faceRR(side, 8, 30, 34, 22, 6, { stroke: PAL.edge });
  if (vx < 260) isoText(side, 'YOUR CREW', 70, 46, 18, { font: SANS, weight: 700 });
  for (const wu of [30, 166]) faceEll(side, wu, 80, 17, 17, { fill: PAL.face, stroke: PAL.edge }), faceEll(side, wu, 80, 6, 6, { stroke: PAL.inner });
  cubeBot(vx + 96, vy + 33, vz + 80, 54, { key: 'hero', hop: cu.park + 0.2, look: TT > cu.door ? -0.9 : -0.3 });
  isoTag('03', 'shown');
  isoCaption("They're home. You walk in.", { size: 52 });
}
