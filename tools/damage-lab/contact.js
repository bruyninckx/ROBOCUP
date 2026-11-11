// Contact experiments (Kev, 11 Nov): how often each new bump outcome happens, and what it does to fights.
// node contact.js [fightsPerPair=6] [switches=slide,under,crush,gut,crack,frag,bend,grindout | none] [check]   → per-fight counts, fight length, share of results that change.
// "check" compares the engine with every switch off against a reference engine file (ORIG=/path/engine.js): must be identical.
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const N = +process.argv[2] || 6, sw = (process.argv[3] || 'slide,under,crush,gut').split(',').filter(k => k && k !== 'none');
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), names = Object.keys(all);
const pairs = []; for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) pairs.push([names[i], names[j]]);
const pick = pairs.filter((_, k) => k % (+process.env.EVERY || 9) === 0);
function fight(a, b, seed, on) {
  for (const k of ['slide', 'under', 'crush', 'gut', 'crack', 'frag', 'bend', 'grindout']) L.ARC.cx[k] = on.includes(k); L.ARC.cx.count = true;
  const S = L.create({ a: LU.build(a), b: LU.build(b), seed, arena: 'open' });
  while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; }
  return S;
}
const tot = {}, base = {}; let len0 = 0, len1 = 0, flips = 0, n = 0, ko0 = 0, ko1 = 0; const wins = {}, wins0 = {};
const t0 = Date.now();
pick.forEach(([a, b], k) => { for (let s = 0; s < N; s++) {
  const x = s % 2 ? b : a, y = s % 2 ? a : b, seed = 9100 + 31 * k + s;
  const S0 = fight(x, y, seed, []), S1 = fight(x, y, seed, sw); n++;
  for (const q in (S0.cx || {})) base[q] = (base[q] || 0) + S0.cx[q];
  for (const q in (S1.cx || {})) tot[q] = (tot[q] || 0) + S1.cx[q];
  len0 += S0.t; len1 += S1.t; if (S0.result.winner !== S1.result.winner) flips++;
  ko0 += S0.result.how === 'KO'; ko1 += S1.result.how === 'KO';
  const w0 = S0.robots[S0.result.winner].name, w1 = S1.robots[S1.result.winner].name;
  for (const r of [x, y]) { wins[r] = wins[r] || [0, 0]; wins0[r] = wins0[r] || [0, 0]; wins[r][1]++; wins0[r][1]++; }
  wins0[w0][0]++; wins[w1][0]++;
} });
const per = o => Object.keys(o).sort().map(k => `${k} ${(o[k] / n).toFixed(2)}`).join(', ');
console.log(`${n} fights (${pick.length} pairs), switches: ${sw.join(' ') || 'none'}`);
console.log('per fight, off:', per(base)); console.log('per fight, on: ', per(tot));
console.log(`length ${(len0 / n).toFixed(0)}s → ${(len1 / n).toFixed(0)}s, KO ${Math.round(100 * ko0 / n)}% → ${Math.round(100 * ko1 / n)}%, winner changed in ${Math.round(100 * flips / n)}% of fights`);
const mv = Object.keys(wins).map(r => [r, Math.round(100 * wins0[r][0] / wins0[r][1]), Math.round(100 * wins[r][0] / wins[r][1])]).sort((p, q) => (q[2] - q[1]) - (p[2] - p[1]));
console.log('win % off → on:', mv.map(m => `${m[0]} ${m[1]}→${m[2]}`).join(', '));
console.error('ms', Date.now() - t0);
