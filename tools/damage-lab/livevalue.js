// ROBOCUS 2.0: how much each live card swings a fight (node livevalue.js [fights]). The card is played for robot A at 15 s.
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const N = +process.argv[2] || 60, names = Object.keys(LU.ROBOTS), out = {};
const own = { waypoint: 0, overclock: 1, field_eng: 1, hype: 1, trigger: 1 }; // played on A; others target B or B's spot
const types = ['none'].concat(Object.keys(L.LIVE));
for (const t of types) {
  let w = 0;
  for (let i = 0; i < N; i++) {
    const a = names[i % names.length], lv = LU.ROBOTS[a][0], same = names.filter(b => LU.ROBOTS[b][0] === lv && b !== a), b = same[i % same.length];
    const S = L.create({ a: LU.build(a), b: LU.build(b), seed: 3000 + i });
    while (!S.over && S.t < 200) {
      L.step(S);
      if (t !== 'none' && S.step === 1800) { const A = S.robots[0], B = S.robots[1], bp = B.body.getPosition(), ap = A.body.getPosition(), tg = L.LIVE[t].target;
        if (t === 'waypoint') { const d = Math.hypot(bp.x - ap.x, bp.y - ap.y) || 1; L.command(S, { type: t, robot: 0, x: ap.x - (bp.x - ap.x) / d * 1.5, y: ap.y - (bp.y - ap.y) / d * 1.5 }); } // back off to the side
        else if (tg === 'bot') L.command(S, { type: t, robot: own[t] ? 0 : 1 });
        else if (t === 'supply') L.command(S, { type: t, x: ap.x, y: ap.y, crate: 'overcharge' });
        else if (t === 'smoke') L.command(S, { type: t, x: ap.x, y: ap.y });
        else L.command(S, { type: t, x: bp.x, y: bp.y }); }
    }
    if (S.result.winner === 0) w++;
  }
  out[t] = Math.round(100 * w / N); console.log(t.padEnd(10), out[t] + '%');
}
require('fs').writeFileSync('livevalue-results.json', JSON.stringify(out, null, 1));
