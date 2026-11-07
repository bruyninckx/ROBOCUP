// node multi.js [mode] [fights] : 2v2 / ffa smoke test + stats over random market lineups
const L = require('./engine.js'); const mode = process.argv[2] || 'ffa', N = +process.argv[3] || 40;
const M = Object.keys(L.PRESETS).filter(k => L.PRESETS[k].market), rng = L.mkRng(77);
let wins = {}, apps = {}, len = [], judges = 0, kos = 0, bad = 0, ffk = 0, t0 = Date.now(), worst = 0;
for (let f = 0; f < N; f++) {
  const pick = [0, 1, 2, 3].map(() => M[Math.floor(rng() * M.length)]);
  const S = L.create({ mode, robots: pick.map(p => ({ preset: p })), seed: 500 + f, arena: f % 2 ? 'pit' : 'open', countdown: 0 });
  while (!S.over && S.t < 200) { const a = Date.now(); L.step(S); worst = Math.max(worst, Date.now() - a); S.fx.length = 0; }
  if (!S.over) { bad++; continue; }
  for (const R of S.robots) { apps[R.spec.preset] = (apps[R.spec.preset] || 0) + 1; if (S.result.winners.includes(R.id)) wins[R.spec.preset] = (wins[R.spec.preset] || 0) + 1; kos += R.stats.kos || 0; }
  len.push(S.t); if (S.result.how === 'judges') judges++;
  if (f < 4) console.log(pick.join(', '), '=>', S.result.text, '@', S.t.toFixed(0) + 's', '| KO order:', S.result.order.map(i => S.robots[i].name + (S.robots[i].alive ? '' : '✗')).join(' > '));
}
len.sort((a, b) => a - b);
console.log(mode, 'fights', N, 'unfinished', bad, 'median', len[len.length >> 1].toFixed(0) + 's', 'judges', judges, 'credited KOs', kos, 'ms', Date.now() - t0, 'worst step ms', worst);
console.log(M.map(k => `${k} ${apps[k] ? Math.round(100 * (wins[k] || 0) / apps[k]) : '-'}%`).join('  '));
