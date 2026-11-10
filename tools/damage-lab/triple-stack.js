// ROBOCUS 2.0 (Kev, 10 Nov): node triple-stack.js '[["Scythe",["booster","powerkit","core"]]]' -> stock / 1 / 2 / 3 parts vs every L3-L4 robot, and vs kitted ones
const D = './';
const L = require(D + 'engine.js'), LU = require(D + 'lineup.js'); LU.usePK();
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), lv = n => all[n][0], names = Object.keys(all), panel = names.filter(n => lv(n) >= 3);
const T = JSON.parse(process.argv[2]);   // [[robot,[p1,p2,leg]], ...]
const run = (a, bd, oppParts) => { let w = 0, n = 0; panel.forEach((b, ib) => { for (const side of [0, 1]) { const A = LU.build(a, bd), B = LU.build(b, oppParts);
  const S = L.create({ a: side ? B : A, b: side ? A : B, seed: 91000 + ib * 13 + side, arena: 'open' }); while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; } n++; if (S.result.winner === side) w++; } }); return Math.round(100 * w / n); };
for (const [a, b3] of T) console.log(JSON.stringify({ a, stock: run(a, []), one: run(a, b3.slice(0, 1)), two: run(a, b3.slice(0, 2)), three: run(a, b3), threeVsKitted: run(a, b3, ['weapon', 'hull']), threeVsFull: run(a, b3, ['weapon', 'hull', 'core']) }));
