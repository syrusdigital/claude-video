  // =====================================================================
  //  SCORE BODY — Syrus V1. Thin at the ad, fuller through booked and shown, a hard stop into
  //  silence on the open door, then the loudest hit on the slam: a stab + sub, and a flat chord after.
  // =====================================================================
  const T = TIMELINE, q = T.cues;
  to = 'm';
  pad(0.0, 4.1, ['D3', 'A3', 'E4'], 0.026, { type: 'triangle', cut: 1100, att: 0.4, rel: 0.3, send: 0.5 });
  pad(4.0, 8.1, ['B2', 'Fs3', 'D4', 'A4'], 0.028, { type: 'triangle', cut: 1300, att: 0.25, rel: 0.3, send: 0.5 });
  pad(8.0, 11.2, ['G2', 'D3', 'B3', 'Fs4'], 0.026, { type: 'triangle', cut: 1500, att: 0.2, rel: 0.05, send: 0.3 });
  for (let i = 0; i < 12; i++) if (8.0 + i * BEAT < 11.0) bass(8.0 + i * BEAT, nz(i % 4 < 2 ? 'G2' : 'D2'), 0.05);
  // the appointment's motif: a rising fifth, on the tap, the booking and the door
  [['D4', 0], ['A4', E8]].forEach(([n, dt]) => pluck(q.tap + dt, nz(n), 0.16, 0, 0.6, 2400, 0.35));
  [['Fs4', 0], ['Cs5', E8]].forEach(([n, dt]) => pluck(q.hop + 0.34 + dt, nz(n), 0.16, 0, 0.6, 2600, 0.35));
  [['G4', 0], ['D5', E8]].forEach(([n, dt]) => pluck(q.door + dt, nz(n), 0.17, 0, 0.7, 2800, 0.3));
  // the payoff: stab + sub on the slam, then a flat chord
  pluck(q.slam, nz('D4'), 0.5, -0.15, 0.4, 3600, 0.2); pluck(q.slam, nz('A4'), 0.45, 0.15, 0.4, 3600, 0.2); pluck(q.slam, nz('Fs5'), 0.35, 0, 0.4, 4200, 0.2);
  pad(q.slam + 0.05, 16.0, ['D3', 'A3', 'D4', 'Fs4'], 0.05, { type: 'triangle', cut: 1600, att: 0.08, rel: 0.6, send: 0.5 });
  to = 's';
  sub(q.slam, 0.9);
  noiseHit(q.slam, 0.25, 'lowpass', 2400, 0.8, 0.22);
  for (let i = 0; i < 3; i++) blip(q.plates + i * 0.08, 900 + i * 120, 700, 0.03, 0.03);
  blip(q.phone + 0.15, 700, 500, 0.06, 0.04);
  blip(q.tap - 0.05, 2200, 1800, 0.02, 0.05);                                          // the tap
  for (let i = 0; i < 3; i++) blip(q.form + i * E8, 2600 + i * 200, 2400, 0.015, 0.025);   // fields fill
  sweep(3.65, 4.0, 0.008, 600, 2400, 0); sweep(7.65, 8.0, 0.008, 600, 2400, 0);         // into the morphs
  for (let i = 0; i < 6; i++) blip(q.slot + i * 0.06, 1500 + i * 90, 1300, 0.015, 0.02, (i % 2 ? 0.2 : -0.2));   // tiles ripple
  for (let k = 0; k < 3; k++) blip(q.chk + k * 0.5, 1800, 2600, 0.04, 0.03);                // checks
  blip(q.hop, 500, 1100, 0.1, 0.04);
  noiseHit(q.van, 0.8, 'bandpass', 380, 1.1, 0.03, 0.4, 0.1, 160);                        // the van rolls in
  blip(q.park + 0.2, 500, 1100, 0.1, 0.04);
  chime(q.door + 0.1, [nz('D6'), nz('A6')], 0.03);                                          // the door
