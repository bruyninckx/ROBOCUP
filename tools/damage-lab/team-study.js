// ROBOCUS 2.0 team-fight study (Kev, 11 Nov): node team-study.js <out.jsonl> <fights> <seed0>
// Random 2v2 fights as in real games (double duels and 2v2 are both two robots a side): every robot gets the same number of fights,
// partners and rivals drawn at random from all levels. One line per fight: [a1, a2, b1, b2, winner side]. team-report.js fits a
// team rating per robot (side strength = log of the sum of exp(rating)) and compares it with the bookie's strength model.
const fs = require('fs');
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const names = Object.keys(Object.assign({}, LU.ROBOTS, LU.ROBOTS4));
const out = process.argv[2], N = +process.argv[3] || 100, seed0 = +process.argv[4] || 91000;
let x = seed0 >>> 0; const rnd = () => (x = (x * 1664525 + 1013904223) >>> 0) / 4294967296;
for (let i = 0; i < N; i++) {
  const focal = names[i % names.length], rest = names.filter(n => n !== focal), four = [focal];
  while (four.length < 4) { const n = rest[Math.floor(rnd() * rest.length)]; if (!four.includes(n)) four.push(n); }
  const flip = i % 2, A = flip ? [four[2], four[3]] : [four[0], four[1]], B = flip ? [four[0], four[1]] : [four[2], four[3]];
  const robots = [A[0], A[1], B[0], B[1]].map((n, k) => Object.assign(LU.build(n), { team: k < 2 ? 0 : 1 }));
  const S = L.create({ mode: '2v2', robots, seed: seed0 + i * 23, arena: 'open' }); while (!S.over && S.t < 240) { L.step(S); S.fx.length = 0; }
  fs.appendFileSync(out, JSON.stringify([A[0], A[1], B[0], B[1], S.result.winTeam, Math.round(S.t)]) + '\n');
}
