// ROBOCUS 2.0 epic combo check (Kev, 10 Nov): node epic-confirm.js Robot+part ... -> wins with / without vs every robot a level up, fresh seeds
const D = './';
const L = require(D + 'engine.js'), LU = require(D + 'lineup.js'); LU.usePK();
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), lv = n => all[n][0], names = Object.keys(all);
const list = process.argv.slice(2).map(s => s.split('+'));
for (const [a, p] of list) {
  const opp = names.filter(b => b !== a && lv(b) === Math.min(4, lv(a) + 1)); let w0 = 0, w1 = 0, n = 0;
  for (const b of opp) for (let s = 0; s < 3; s++) for (const side of [0, 1]) {
    const seed = 31000 + n * 17;
    for (const pt of [null, p]) { const A = LU.build(a, pt ? [pt] : []), B = LU.build(b);
      const S = L.create({ a: side ? B : A, b: side ? A : B, seed, arena: 'open' }); while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; }
      if (S.result.winner === side) { if (pt) w1++; else w0++; } }
    n++; }
  console.log(JSON.stringify({ c: a + '+' + p, n, without: Math.round(100 * w0 / n), with: Math.round(100 * w1 / n), dw: Math.round(100 * (w1 - w0) / n) }));
}
