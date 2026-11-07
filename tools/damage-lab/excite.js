// excitement + strength per robot vs the market roster: node excite.js Name[,Name] [fights per opponent]
// counts per fight: big moments (callouts), parts flying off (both robots), airtime throws, plus win % and length
const L = require('./engine.js');
const names = (process.argv[2] || '').split(',').filter(Boolean), n = +(process.argv[3] || 6);
const roster = Object.keys(L.PRESETS).filter(k => L.PRESETS[k].market);
const parse = x => x.includes('{') ? JSON.parse(x) : { preset: x };
for (const nm of names) {
  const me = parse(nm); let w = 0, N = 0, moments = 0, parts = 0, air = 0, t = 0, first = 0;
  for (const op of roster) { if (op === me.preset && !me.weapon) continue; for (let s = 1; s <= n; s++) {
    const swap = s % 2, a = Object.assign({}, me, { name: 'X' }), b = { preset: op, name: 'Y' };
    const S = L.create({ a: swap ? b : a, b: swap ? a : b, seed: 700 + s, arena: s % 4 < 2 ? 'open' : 'pit', countdown: 0 }); const id = swap ? 1 : 0; let fh = null, wasAir = [0, 0];
    while (!S.over && S.t < 130) { L.step(S); for (const e of S.fx) if (e.type === 'callout' && !/CLOSING|BUMPERS|HAMMER!|NITRO|OVERCHARGE|SHIELD!|REPAIRED/.test(e.text)) moments++; S.fx.length = 0;
      S.robots.forEach((R, i) => { if (R.airborne > 0.2 && !wasAir[i]) air++; wasAir[i] = R.airborne > 0.2; }); if (fh == null && S.robots.some(R => R.stats.dealt > 5)) fh = S.t; }
    N++; if (S.result.winner === id) w++; parts += S.robots[0].stats.lost.length + S.robots[1].stats.lost.length; t += S.result.t; first += fh || 60;
  } }
  console.log((me.preset + (me.weapon ? '/' + me.weapon : '') + (me.shape ? '/' + me.shape : '')).padEnd(22), 'win', Math.round(w / N * 100) + '%', ' moments/min', (moments / (t / 60)).toFixed(1), ' parts/fight', (parts / N).toFixed(1), ' throws/fight', (air / N).toFixed(1), ' len', Math.round(t / N) + 's', ' first hit', (first / N).toFixed(1) + 's');
}
