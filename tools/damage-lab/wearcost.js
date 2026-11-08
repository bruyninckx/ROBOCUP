// ROBOCUS 2.0: what a piece of carried-over damage costs in win % (node wearcost.js [fights per robot])
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const N = +process.argv[2] || 8, names = Object.keys(LU.ROBOTS);
const conds = {
  stock: () => null,
  'one wheel lost': R => ({ lost: [R.parts.find(p => p.kind === 'wheel').label] }),
  'side armour lost': R => { const q = R.parts.find(p => p.kind === 'armour' && /Left/.test(p.label)); return q ? { lost: [q.label] } : null; },
  'lid off': () => ({ lid: 0 }),
  'chassis at 50%': () => ({ parts: { Chassis: 0.5 } }),
  'drive motor dead': R => ({ ints: { [R.internals.find(q => q.key === 'motor').label]: 0 } }),
  'weapon motor dead': R => R.wmotor ? { ints: { [R.wmotor.label]: 0 } } : R.turret ? { ints: { [R.turret.label]: 0 } } : null,
  'weapon lost': R => { const q = R.parts.find(p => p.kind === 'weapon'); return q ? { lost: R.parts.filter(p => p.kind === 'weapon').map(p => p.label) } : null; },
  'everything at 60%': R => { const w = { parts: {}, ints: {}, lid: 0.6 }; for (const q of R.parts) w.parts[q.label] = 0.6; for (const q of R.internals) w.ints[q.label] = 0.6; return w; },
};
const res = {};
for (const [cn, f] of Object.entries(conds)) {
  let win = 0, n = 0;
  names.forEach((a, i) => {
    const probe = L.create({ a: LU.build(a), b: LU.build(a), seed: 1 }).robots[0], w = f(probe);
    if (cn !== 'stock' && !w) return;
    const lv = LU.ROBOTS[a][0], same = names.filter(b => LU.ROBOTS[b][0] === lv && b !== a);
    for (let k = 0; k < N; k++) {
      const b = same[k % same.length], sw = k % 2, sa = Object.assign(LU.build(a), { wear: w }), sb = LU.build(b), seed = 7000 + i * 31 + k;
      const S = L.run(sw ? { a: sb, b: sa, seed } : { a: sa, b: sb, seed }, 200);
      if ((S.result.winner === 0) !== !!sw) win++; n++;
    }
  });
  res[cn] = { win: Math.round(100 * win / n), n }; console.log(cn.padEnd(20), res[cn].win + '%', '(' + n + ' fights)');
}
require('fs').writeFileSync('wearcost-results.json', JSON.stringify(res, null, 1));
