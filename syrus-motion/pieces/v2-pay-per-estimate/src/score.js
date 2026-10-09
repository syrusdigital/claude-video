  // =====================================================================
  //  SCORE BODY — Syrus V2. A dull bonk per junk lead, faster and faster; a bright rising fifth on the
  //  gold card; a warm pad in the kitchen with a tape zip and pencil checks; a hard stop into silence;
  //  the loudest hit on the slam (stab + sub), then a flat chord.
  // =====================================================================
  const T = TIMELINE, q = T.cues;
  to = 'm';
  pad(0.0, 3.0, ['A2', 'E3', 'G3'], 0.022, { type: 'triangle', cut: 900, att: 0.3, rel: 0.1, send: 0.3 });
  for (let i = 0; i < 6; i++) bass(i * BEAT, nz(i % 2 ? 'E2' : 'A2'), 0.05);
  [['D4', 0], ['A4', E8], ['D5', BEAT]].forEach(([n, dt]) => pluck(q.gold + dt, nz(n), 0.15, 0, 0.6, 3000, 0.35));   // the gold motif
  pad(3.0, 4.1, ['D3', 'A3', 'Fs4'], 0.026, { type: 'triangle', cut: 1300, att: 0.1, rel: 0.3, send: 0.5 });
  pad(4.0, 7.15, ['G2', 'D3', 'B3', 'Fs4'], 0.03, { type: 'triangle', cut: 1400, att: 0.25, rel: 0.05, send: 0.4 });
  for (let i = 0; i < 6; i++) if (4.0 + i * BEAT < 7.1) pluck(4.0 + i * BEAT, nz(['B4', 'D5', 'Fs5', 'D5', 'B4', 'A4'][i]), 0.06, 0.2 - i * 0.08, 0.4, 2600, 0.3);
  pluck(q.slam, nz('D4'), 0.5, -0.15, 0.4, 3600, 0.2); pluck(q.slam, nz('A4'), 0.45, 0.15, 0.4, 3600, 0.2); pluck(q.slam, nz('Fs5'), 0.35, 0, 0.4, 4200, 0.2);
  pad(q.slam + 0.05, 12.0, ['D3', 'A3', 'D4', 'Fs4'], 0.05, { type: 'triangle', cut: 1600, att: 0.08, rel: 0.6, send: 0.5 });
  to = 's';
  q.junk.forEach((t, i) => { blip(t, 340 - i * 12, 200, 0.09, 0.05, (i % 2 ? 0.25 : -0.25)); noiseHit(t, 0.06, 'lowpass', 700, 0.8, 0.02); });
  for (let i = 0; i < 6; i++) blip(q.strike + i * E16 * 0.5, 2200, 1700, 0.03, 0.02);   // strike-throughs
  chime(q.gold + 0.02, [nz('A5'), nz('D6')], 0.03);
  sweep(3.6, 4.0, 0.009, 600, 2600, 0);
  sweep(q.tape, q.tape + 0.55, 0.012, 2400, 5200, -0.2);                                   // the tape zips out
  for (let k = 0; k < 3; k++) noiseHit(q.chk + k * 0.5, 0.12, 'highpass', 3200, 0.7, 0.03);  // pencil checks
  noiseHit(q.price, 0.4, 'highpass', 2800, 0.7, 0.025);
  sub(q.slam, 0.9); noiseHit(q.slam, 0.25, 'lowpass', 2400, 0.8, 0.22);
