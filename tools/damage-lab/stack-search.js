// node stack-search.js lane nlanes : every L4 robot x (2 of 6 strong parts + 1 legendary) vs the other L4s kitted with Weapon overhaul + Hull + Prototype core
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const [lane, nl] = process.argv.slice(2).map(Number);
const L4 = Object.keys(LU.ROBOTS4).filter(n => LU.ROBOTS4[n][0] === 4);
const REG = ['gunner', 'laser', 'booster', 'weapon', 'hull', 'powerkit'], LEG = ['core', 'hospital', 'quantum'];
const builds = []; for (const a of L4) for (let i = 0; i < REG.length; i++) for (let j = i + 1; j < REG.length; j++) for (const g of LEG) builds.push([a, [REG[i], REG[j], g]]);
const out = [];
builds.forEach(([a, bd], k) => { if (k % nl !== lane) return; let w = 0, n = 0;
  L4.filter(b => b !== a).forEach((b, ib) => { for (const side of [0, 1]) { const A = LU.build(a, bd), B = LU.build(b, ['weapon', 'hull', 'core']);
    const S = L.create({ a: side ? B : A, b: side ? A : B, seed: 47000 + ib * 11 + side, arena: 'open' }); while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; } n++; if (S.result.winner === side) w++; } });
  out.push({ a, bd, win: Math.round(100 * w / n) }); });
require('fs').writeFileSync(`ss_${lane}.json`, JSON.stringify(out)); console.log('done', lane, out.length);
