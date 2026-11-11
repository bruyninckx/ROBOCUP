// ROBOCUS 2.0 gang test, step 2 (Kev, 11 Nov): the 10 best builds of stack-search.js vs every other L3-L4 robot kitted with Weapon overhaul + Hull + Prototype core, 48 fights each
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const [lane, nl] = process.argv.slice(2).map(Number);
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), panelAll = Object.keys(all).filter(n => all[n][0] >= 3);
const C = [['Hydra',['weapon','hull','quantum']],['Hydra',['booster','powerkit','quantum']],['Hydra',['weapon','powerkit','core']],['Hydra',['gunner','weapon','quantum']],['Hydra',['laser','powerkit','core']],['Hydra',['gunner','hull','quantum']],['Angler',['weapon','powerkit','quantum']],['Orbiter',['weapon','powerkit','quantum']],['Tarantula',['weapon','hull','core']],['Corkscrew',['gunner','hull','quantum']]];
C.forEach(([a, bd], k) => { if (k % nl !== lane) return; let w = 0, n = 0; const panel = panelAll.filter(b => b !== a);
  panel.forEach((b, ib) => { for (let s = 0; s < 2; s++) for (const side of [0, 1]) { const A = LU.build(a, bd), B = LU.build(b, ['weapon', 'hull', 'core']);
    const S = L.create({ a: side ? B : A, b: side ? A : B, seed: 63000 + ib * 17 + s * 5 + side, arena: 'open' }); while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; } n++; if (S.result.winner === side) w++; } });
  console.log(JSON.stringify({ a, bd, win: Math.round(100 * w / n), n })); });
