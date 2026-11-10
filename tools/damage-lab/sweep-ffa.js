// ROBOCUS 2.0 (Kev, 10 Nov): node sweep-ffa.js N seedBase -> ffa-<seed>.json (4-robot free-for-alls, random lineups)
// node ffa.js N seedBase: N four-robot free-for-alls, random lineups from the whole roster (no duplicates)
const D = './';
const L = require(D + 'engine.js'), LU = require(D + 'lineup.js'); LU.usePK();
const [N, SB] = process.argv.slice(2).map(Number), fs = require('fs');
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), names = Object.keys(all), rng = L.mkRng(SB);
const fights = [];
for (let f = 0; f < N; f++) {
  const pool = names.slice(), pick = []; while (pick.length < 4) pick.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  const S = L.create({ mode: 'ffa', robots: pick.map((p, i) => Object.assign(LU.build(p), { team: i })), seed: SB + f * 3, arena: 'open', countdown: 0 });
  while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; }
  fights.push({ pick, win: (S.result.winners || []).map(i => S.robots[i].spec.preset || pick[i]), order: (S.result.order || []).map(i => pick[i]), kos: S.robots.map(R => R.stats.kos || 0), alive: S.robots.map(R => R.alive ? 1 : 0), t: Math.round(S.t), how: S.result.how });
}
fs.writeFileSync(__dirname + '/ffa-' + SB + '.json', JSON.stringify(fights)); console.log('done', N);
