// node l4parts.js [fights per pair] : (1) a level 3 robot with one part vs the level 4 robots (50% = the part still closes the level),
// (2) a level 2 robot with the Prototype core vs level 4, (3) free-for-all with one level 4 robot and three level 3 robots.
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const N = +process.argv[2] || 2, L3 = Object.keys(LU.ROBOTS).filter(k => LU.ROBOTS[k][0] === 3), L2 = Object.keys(LU.ROBOTS).filter(k => LU.ROBOTS[k][0] === 2), L4 = Object.keys(LU.ROBOTS4);
const PARTS = ['gunner', 'booster', 'weapon', 'hull', 'medic', 'shield'];
const duel = (A, B, n, s0) => { let w = 0; for (let k = 0; k < n; k++) { const swap = k % 2 === 1, S = L.run(swap ? { a: B, b: A, seed: s0 + k } : { a: A, b: B, seed: s0 + k }); if ((S.result.winner === 0) !== swap) w++; } return w; };
let w = 0, n = 0, w0 = 0;
for (const a of L3) for (const b of L4) { const pt = PARTS[(a.length + b.length) % PARTS.length]; w += duel(LU.build(a, [pt]), LU.build(b), N, 50001); w0 += duel(LU.build(a), LU.build(b), N, 50001); n += N; }
console.log(`L3 + one part vs L4: ${Math.round(100 * w / n)}% (stock L3 vs L4 on the same seeds: ${Math.round(100 * w0 / n)}%, ${n} fights)`);
w = 0; n = 0; for (const a of L2) for (const b of L4) { w += duel(LU.build(a, ['core']), LU.build(b), N, 51001); n += N; }
console.log(`L2 + Prototype core vs L4: ${Math.round(100 * w / n)}% (${n} fights)`);
const ffa = {}; for (const r of L4) ffa[r] = 0; let games = 0;
for (let g = 0; g < N * 4; g++) for (const r of L4) { const others = L3.slice().sort((x, y) => ((x.length * 7 + g * 13 + y.length) % 5) - 2).slice(0, 3); const robots = [LU.build(r)].concat(others.map(o => LU.build(o))); const S = L.run({ mode: 'ffa', robots, seed: 52001 + g }); if (S.result.winTeam === 0) ffa[r]++; }
console.log('FFA win % (one L4 + three L3, 25% = even):', Object.entries(ffa).map(([k, v]) => `${k} ${Math.round(100 * v / (N * 4))}`).join(', '));
