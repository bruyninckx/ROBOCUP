// node l4.js [fights per opponent] [Robot,Robot] : level 4 robots vs the level 3 and level 2 lineup robots (power grades from lineup.js)
// win %, median length, big moments / min, parts per fight, KO causes, worst matchup. Env: SEED0 (default 10001), VS=3|2|both, P=Robot:grade,...
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
if (process.env.CX) for (const k of (process.env.CX === 'all' ? 'slide,under,crush,gut,crack,frag,bend,grindout' : process.env.CX).split(',')) L.ARC.cx[k] = true; // 2.0.1 contact and wear switches
const N = +process.argv[2] || 10, only = process.argv[3] ? process.argv[3].split(',') : L.L4;
const P4 = {}; if (process.env.P) for (const kv of process.env.P.split(',')) { const [k, v] = kv.split(':'); P4[k] = +v; }
if (process.env.DMGK) for (const kv of process.env.DMGK.split(',')) { const [k, v] = kv.split(':'); L.PRESETS[k].dmgK = +v; }
const lv = n => Object.keys(LU.ROBOTS).filter(k => LU.ROBOTS[k][0] === n);
const VS = process.env.VS || 'both', opps = VS === 'both' ? lv(3).concat(lv(2)) : VS.split(',').map(Number).flatMap(lv); // VS=3, VS=2, VS=0,1 ...
const spec4 = r => { const g = (LU.ROBOTS4 || {})[r] || (LU.CANDIDATES || {})[r], p = P4[r] || (g && g[1]) || 1; return { preset: r, dmgK: (L.PRESETS[r].dmgK || 1) * p, hpK: p }; };
const res = {};
for (const r of only) {
  let T = [], big = 0, n = 0, parts = 0, ko = {}, per = {}, w3 = [0, 0], w2 = [0, 0], byLv = {};
  for (const o of opps) { let wo = 0;
    for (let k = 0; k < N; k++) {
      const seed = (+process.env.SEED0 || 10001) + k, swap = k % 2 === 1;
      const A = Object.assign(spec4(r), { name: 'A' }), B = Object.assign(LU.build(o), { name: 'B' });
      const S = L.create(swap ? { a: B, b: A, seed } : { a: A, b: B, seed });
      let bigs = 0; while (!S.over && S.t < 200) { L.step(S); for (const f of S.fx) if (f.type === 'callout' && f.big) bigs++; S.fx.length = 0; }
      const me = S.robots[swap ? 1 : 0], won = S.result.winner === me.id; if (won) wo++; n++; T.push(S.t); big += bigs / (S.t / 60); parts += me.enemy.stats.lost.length;
      const los = S.robots[won ? 1 - me.id : me.id]; const kk = (won ? '' : '-') + (S.result.how === 'KO' ? (los.ko || '').replace(/ \(.*/, '').replace(/,.*/, '') : 'judges'); ko[kk] = (ko[kk] || 0) + 1;
    }
    per[o] = Math.round(100 * wo / N); const lo = LU.ROBOTS[o][0], t = lo === 3 ? w3 : lo === 2 ? w2 : null; if (t) { t[0] += wo; t[1] += N; } byLv[lo] = byLv[lo] || [0, 0]; byLv[lo][0] += wo; byLv[lo][1] += N;
  }
  T.sort((a, b) => a - b);
  const s3 = w3[1] ? Math.round(100 * w3[0] / w3[1]) : null, s2 = w2[1] ? Math.round(100 * w2[0] / w2[1]) : null;
  res[r] = { byLevel: Object.fromEntries(Object.entries(byLv).map(([k, v]) => [k, Math.round(100 * v[0] / v[1])])), vsL3: s3, vsL2: s2, median: Math.round(T[T.length >> 1]), big: +(big / n).toFixed(1), parts: +(parts / n).toFixed(1), per, ko };
  console.log(`\n${r} (${L.WEAPONS[L.PRESETS[r].weapon].label}, ${L.weightOf({ preset: r })} kg):${s3 != null ? ` vs L3 ${s3}%` : ''}${s2 != null ? `  vs L2 ${s2}%` : ''}  median ${res[r].median} s  big moments/min ${res[r].big}  enemy parts lost ${res[r].parts}`);
  console.log('  by level', Object.entries(res[r].byLevel).map(([k, v]) => `L${k} ${v}%`).join(', '));
  console.log('  vs', Object.entries(per).map(([k, v]) => k + ' ' + v).join(', '));
  console.log('  endings', Object.entries(ko).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([k, v]) => `${k} ${v}`).join(', '));
}
if (process.env.OUT) require('fs').writeFileSync(process.env.OUT, JSON.stringify(res, null, 1));
