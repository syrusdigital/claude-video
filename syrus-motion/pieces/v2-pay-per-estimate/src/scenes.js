// =====================================================================
//  SCENES — Syrus V2 (riso). World coords 1080x1920; time TT on 2s. Every colour is plate tones:
//  teal = Syrus navy, pink = Syrus sky, yellow = Syrus gold. Gold (yellow) is the estimate and nothing else.
// =====================================================================
const cu = TIMELINE.cues;
const NAVY = { teal: 1 }, SKY = { pink: 1 }, GOLDT = { yellow: 1 }, INKBLUE = { teal: 1, pink: 0.35 };
const WALL1 = { pink: 0.22, teal: 0.05 }, WALL2 = { pink: 0.3, teal: 0.06 };

// ---- the phone (eras 1 and 3), drawn in its own local coords (0, 0 = centre)
const PHONE1 = { x: 500, y: 820, s: 1, rot: -0.05 }, PHONE3 = { x: 540, y: 680, s: 0.66, rot: 0.03 };
const CARD = { x: -180, w: 360, h: 100, y0: -330, step: 118 };
const JUNK = ['Just browsing', 'Wrong number', 'No budget', 'Out of area', 'Just looking', 'No reply'];
const toWorld = (ph, P) => { const c = Math.cos(ph.rot), s = Math.sin(ph.rot); return P.map(([u, v]) => [ph.x + ph.s * (u * c - v * s), ph.y + ph.s * (u * s + v * c)]); };
const nJunk = () => cu.junk.filter((t) => TT >= t).length;
// card k's slot from the top: the newest card sits on top and pushes the rest down (on a spring)
function cardY(k) {
  // the card slides in from above on the same spring that pushes the stack down, so the gap never closes
  const keys = [[0, -1], [cu.junk[k], 0]];
  cu.junk.forEach((t, i) => { if (i > k) keys.push([t, keys[keys.length - 1][1] + 1]); });
  keys.push([cu.gold, keys[keys.length - 1][1] + 1]);
  return CARD.y0 + springTrack(keys, SPRING.snappy) * CARD.step;
}
const goldCardY = (quiet) => CARD.y0 - (quiet ? 0 : (1 - springEase(TT - cu.gold, SPRING.snappy.k, SPRING.snappy.d)) * CARD.step);
function goldCardPts(ph) { return toWorld(ph, boxPts(CARD.x, goldCardY(), CARD.w, CARD.h + 14)); }
function phone(ph, quiet) {
  printed(PITCH.world, { T: { s: ph.s, x: ph.x, y: ph.y, rot: ph.rot }, shapes: true, box: [-250, -450, 250, 450] }, () => {
    fill(rrect(-230, -430, 460, 860, 64), INKBLUE);
    fill(rrect(-200, -384, 400, 768, 34), {});
    fill(rrect(-44, -410, 88, 12, 6), { teal: 0.6 });
    clipTo(rrect(-200, -384, 400, 768, 34));
    if (!quiet) {
      for (let k = 0; k < JUNK.length; k++) {
        if (TT < cu.junk[k]) continue;
        const y = cardY(k), s = popS(cu.junk[k]);
        fill(hand(boxPts(CARD.x, y, CARD.w, CARD.h), 'jc' + k, 1), { pink: 0.28 });
        fill(circ(CARD.x + 46, y + 50, 22), { teal: 0.35, pink: 0.2 });
        type(JUNK[k], CARD.x + 84, y + 64, 36 * Math.min(1, 0.6 + s * 0.4), NAVY, { key: 'jt' + k, weight: 800 });
        if (TT >= cu.strike + k * E16 * 0.5) line([[CARD.x + 78, y + 52], [CARD.x + 84 + Math.min(260, typeW(JUNK[k], 36, 800)) * EZ.o2(ev(cu.strike + k * E16 * 0.5, 0.2)), y + 50]], NAVY, { w: 6, amt: 0.5, key: 'st' + k });
      }
    } else {
      for (let k = 0; k < 4; k++) fill(rrect(CARD.x, CARD.y0 + 150 + k * 70, CARD.w * [0.9, 0.6, 0.75, 0.4][k], 22, 11), { pink: 0.14 });   // a calm, empty inbox
    }
    if (quiet || TT >= cu.gold) {   // the gold card: one real homeowner
      const s = 1, y = goldCardY(quiet);
      fill(hand(boxPts(CARD.x, y, CARD.w, CARD.h + 14), 'gc', 1), GOLDT);
      rimLine(boxPts(CARD.x, y, CARD.w, CARD.h + 14), 'gcr', { tones: { yellow: 1, teal: 0.25 }, w: 5, amt: 1, rough: 0.45 });
      type(quiet ? 'Estimate done' : 'Real homeowner', CARD.x + 26, y + 52, 38 * Math.min(1, 0.6 + s * 0.4), NAVY, { key: 'gt', weight: 900 });
      type(quiet ? 'Thu 10:00 AM  ·  kitchen' : 'Kitchen  ·  wants an estimate', CARD.x + 26, y + 90, 24, NAVY, { key: 'gs', weight: 600 });
    }
    unclip();
  });
}
function scenePhone(quiet) {
  beginSheet();
  printed(PITCH.field, { full: true }, () => fill(rect(-80, -80, W + 160, H + 160), WALL1));
  printed(PITCH.world, { shapes: true }, () => {
    // the desk, with grain; a mug that steams (life); a pencil
    const dy = quiet ? 1580 : 1260;   // on the payoff the desk drops out of frame: the line prints on the wall
    fill(rect(-80, dy, W + 160, H), { teal: 0.5, pink: 0.25 });
    fill(rect(-80, dy, W + 160, 22), { teal: 0.85, pink: 0.55, yellow: 0.35 });
    for (let k = 0; k < 6; k++) line([[-40, dy + 70 + k * 64], [W + 40, dy + 76 + k * 64 + (k % 2) * 8]], {}, { w: 3, amt: 1.2, key: 'grain' + k, knock: true });
    if (!quiet) {
      fill(hand(boxPts(120, 1140, 120, 140), 'mug', 1.2), SKY);
      line(arcPts(240, 1205, 34, -Math.PI / 2, Math.PI / 2, 12), SKY, { w: 14, amt: 0.6, key: 'mugh' });
      for (let i = 0; i < 2; i++) { const P = []; for (let k = 0; k <= 10; k++) { const q = k / 10; P.push([160 + i * 40 + Math.sin(q * 6 + TT * 4 + i) * 10, 1120 - q * 130]); } line(P, { teal: 0.3 }, { w: 6, taper: 0.5, amt: 0.6, key: 'steam' + i }); }
    }
  });
  phone(quiet ? PHONE3 : PHONE1, quiet);
  // the hero: wide-eyed at the pile, then up on the gold card; on the slam, a hop
  printed(PITCH.world, { shapes: true, box: [700, 840, 1060, 1400] }, () => {
    if (!quiet) {
      const up = EZ.o3(ev(cu.gold, 0.3));
      risoHero(860, 1150, 96, { key: 'hero', mood: TT < cu.gold ? 'wow' : 'happy', look: [-0.9, -0.3], arms: [lerp(0.5, 2.5, up), lerp(0.6, 2.7, up)], hop: TT >= cu.gold ? Math.sin(seg(TT, cu.gold, cu.gold + 0.5) * Math.PI) * 50 : 0 });
    }
  });
  if (quiet) {
    printed(PITCH.world, { shapes: true, box: [700, 780, 1060, 1140] }, () => {
      risoHero(870, 990, 78, { key: 'hero', mood: 'happy', look: [-0.6, -0.4], arms: [2.6, 2.6], hop: Math.sin(seg(TT, cu.hop, cu.hop + 0.5) * Math.PI) * 60 });
    });
    payoff();
  }
  endSheet();
  if (!quiet) { risoTag('your leads'); risoCaption('Leads that go nowhere?'); }
}
// the payoff line, printed: gold sits under the word it means
function payoff() {
  const a = popS(cu.line), b = popS(cu.line + 0.25), c = ev(cu.brand, 0.5);
  printed(PITCH.world, { shapes: true, box: [40, 1180, 1040, 1520] }, () => {
    if (a > 0.01) type('Pay per', CX, 1300, 124 * Math.min(1, 0.7 + a * 0.3), NAVY, { align: 'center', key: 'pp', weight: 900 });
    if (b > 0.01) {
      const w = typeW('estimate.', 132, 900);
      fill(hand(boxPts(CX - w / 2 - 10, 1395, (w + 20) * clamp(b), 34), 'ul', 1), GOLDT);
      type('estimate.', CX, 1424, 132 * Math.min(1, 0.7 + b * 0.3), NAVY, { align: 'center', key: 'est', weight: 900 });
    }
    if (c > 0) type('SYRUS DIGITAL', CX, 1490, 38, { teal: 0.75 }, { align: 'center', key: 'brand', weight: 700, frac: c });
  });
}

// ---- the kitchen (era 2): the gold card is now the clipboard; measure, check, price
const CLIP = { x: 560, y: 880, w: 250, h: 320 };
const clipPts = () => boxPts(CLIP.x, CLIP.y, CLIP.w, CLIP.h);
function sceneKitchen() {
  beginSheet();
  printed(PITCH.field, { full: true }, () => fill(rect(-80, -80, W + 160, H + 160), WALL2));
  printed(PITCH.world, { shapes: true }, () => {
    // a pendant lamp that swings a little (life)
    const sw = Math.sin(TT * 2.4) * 18;
    line([[540, 180], [540 + sw, 330]], { teal: 1, pink: 1, yellow: 1 }, { w: 4, amt: 0.4, key: 'cord', knock: true });
    fill(hand(arcPts(540 + sw, 380, 70, Math.PI, TAU, 16).concat([[610 + sw, 380]]), 'dome', 0.8), NAVY);
    // upper cabinets
    for (let i = 0; i < 3; i++) {
      const x = 120 + i * 280;
      fill(hand(boxPts(x, 420, 260, 300), 'up' + i, 1), { teal: 0.55, pink: 0.35 });
      line(boxPts(x + 26, 446, 208, 248).concat([[x + 26, 446]]), {}, { w: 4, amt: 0.8, key: 'upi' + i, knock: true });
      fill(rect(x + (i === 1 ? 30 : 200), 650, 30, 10), {});
    }
    // backsplash tiles: paper grout over the wall
    for (let y = 750; y < 960; y += 52) line([[100, y], [980, y + 2]], { pink: 0.5 }, { w: 3, amt: 0.8, key: 'bs' + y });
    // counter and lower cabinets
    fill(rect(80, 960, 920, 40), { teal: 1, pink: 1, yellow: 1 });
    specks(90, 965, 990, 995, 40, 'counter');
    fill(hand(boxPts(100, 1000, 880, 250), 'low', 0.8), { teal: 0.42, pink: 0.22 });
    for (let i = 1; i < 4; i++) line([[100 + i * 220, 1010], [100 + i * 220, 1240]], {}, { w: 4, amt: 0.8, key: 'ld' + i, knock: true });
    for (let i = 0; i < 4; i++) fill(circ(100 + i * 220 + (i % 2 ? 30 : 190), 1060, 9), { teal: 1, pink: 1, yellow: 1 });
    // the floor
    fill(rect(-80, 1250, W + 160, H), { pink: 0.4, teal: 0.1 });
    for (let y = 1320; y < H; y += 80) line([[-40, y], [W + 40, y + 2]], {}, { w: 4, amt: 1, key: 'fl' + y, knock: true });
    // the tape measure runs the length of the counter
    const ex = lerp(196, 900, EZ.o3(ev(cu.tape, 0.6)));
    fill(circ(160, 944, 36), NAVY); fill(circ(160, 944, 12), {});
    if (ex > 200) {
      line([[196, 948], [ex, 948]], SKY, { w: 18, amt: 0.3, key: 'tape' });
      for (let x = 216; x < ex - 6; x += 24) line([[x, 940], [x, x % 96 === 24 ? 956 : 948]], NAVY, { w: 3, amt: 0.2, key: 'tk' + x });
    }
    // the hero holds the gold clipboard out: the estimate, written line by line
    risoHero(400, 1150, 116, { key: 'hero', mood: TT < cu.price ? 'smile' : 'happy', look: [0.9, -0.3], arms: [0.35, 1.45] });
    fill(hand(clipPts(), 'clip', 1), GOLDT);
    rimLine(clipPts(), 'clipr', { tones: { yellow: 1, teal: 0.25 }, w: 5, amt: 1, rough: 0.45 });
    fill(rrect(CLIP.x + 80, CLIP.y - 22, 90, 44, 12), NAVY);
    type('ESTIMATE', CLIP.x + 26, CLIP.y + 62, 30, NAVY, { key: 'eh', weight: 900 });
    ['Measured', 'Scope', 'Materials'].forEach((s, k) => {
      const y = CLIP.y + 112 + k * 52, w = ev(cu.chk + k * 0.5, 0.25);
      fill(hand(boxPts(CLIP.x + 24, y - 26, 30, 30), 'cb' + k, 0.6), { yellow: 1, teal: 0.15 });
      if (w > 0) line([[CLIP.x + 28, y - 12], [CLIP.x + 38, y - 1], [CLIP.x + 58, y - 30]], NAVY, { w: 6, amt: 0.4, key: 'ck' + k, frac: w });
      type(s, CLIP.x + 70, y, 26, NAVY, { key: 'cl' + k, weight: 700 });
    });
    const pw = ev(cu.price, 0.5);
    type('$', CLIP.x + 24, CLIP.y + 290, 40, NAVY, { key: 'usd', weight: 900 });
    if (pw > 0) line([[CLIP.x + 60, CLIP.y + 282], [CLIP.x + 110, CLIP.y + 266], [CLIP.x + 150, CLIP.y + 284], [CLIP.x + 200, CLIP.y + 268]], NAVY, { w: 6, amt: 0.8, key: 'pr', frac: pw });
  });
  endSheet();
  risoTag('the estimate');
  risoCaption('You write the estimate.');
}
