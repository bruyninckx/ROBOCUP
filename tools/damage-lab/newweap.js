// node newweap.js [fightsPerOpp] : the new mechanical weapons vs the 7 market robots (win %, length, damage by cause, big moments/min)
const L = require('./engine.js'); const N = +process.argv[2] || 8, only = process.argv[3] ? process.argv[3].split(',') : null;
if (process.env.DMGK) for (const kv of process.env.DMGK.split(',')) { const [k, v] = kv.split(':'); L.PRESETS[k].dmgK = +v; }
const NEW = (only || ['Gyro', 'Scythe', 'Mincer', 'Pincher']), M = L.MARKET_TABLE.names;
for (const r of NEW) {
  let w = 0, n = 0, T = [], by = {}, big = 0, ko = {}, per = {};
  for (const o of M) { let wo = 0;
    for (let k = 0; k < N; k++) {
      const seed = (+process.env.SEED0 || 9001) + k, swap = k % 2 === 1, arena = 'open';
      const A = { preset: r, name: 'A' }, B = { preset: o, name: 'B' };
      const S = L.create(swap ? { a: B, b: A, seed, arena } : { a: A, b: B, seed, arena });
      let bigs = 0; while (!S.over && S.t < 200) { L.step(S); for (const f of S.fx) if (f.type === 'callout' && f.big) bigs++; S.fx.length = 0; }
      const me = S.robots[swap ? 1 : 0], won = S.result.winner === me.id; if (won) { w++; wo++; } n++; T.push(S.t); big += bigs / (S.t / 60);
      for (const [c, v] of Object.entries(me.stats.dealtBy)) by[c] = (by[c] || 0) + v;
      const los = S.robots[won ? 1 - me.id : me.id]; const kk = S.result.how === 'KO' ? (los.ko || '').replace(/ \(.*/, '').replace(/,.*/, '') : 'judges'; ko[kk] = (ko[kk] || 0) + 1;
    } per[o] = Math.round(100 * wo / N); }
  T.sort((a, b) => a - b);
  const tot = Object.values(by).reduce((a, b) => a + b, 0);
  console.log(`\n${r} (${L.WEAPONS[L.PRESETS[r].weapon].label}, ${L.weightOf({ preset: r })} kg): wins ${Math.round(100 * w / n)}%  median ${T[T.length >> 1].toFixed(0)} s  big moments/min ${(big / n).toFixed(1)}`);
  console.log('  vs', Object.entries(per).map(([k, v]) => k + ' ' + v).join(', '));
  console.log('  damage by', Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} ${Math.round(100 * v / tot)}%`).join(', '));
  console.log('  endings', Object.entries(ko).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} ${v}`).join(', '));
}
