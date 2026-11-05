#!/usr/bin/env node
/* Robot card matchup table: the 12 Market robot cards + the Scrap Bot starter, each pairing fought N times
   (sides swapped every other fight). Uses the shared Sim (src/sim.js).

   node tools/robot-cards.js                 # 100 fights per pairing, current Sim.FORM
   node tools/robot-cards.js --n 60 --form 0.15,0.1,6   # try a form-of-the-day level (fp, speed, accuracy points)
   node tools/robot-cards.js --parts          # also: average win % of every card with each new part fitted
   node tools/robot-cards.js --json out.json  # write the raw table
*/
const path = require('path');
const fs = require('fs');
const Sim = require(path.join(__dirname, '..', 'src', 'sim.js'));

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const N = +opt('n', 100);
if (opt('form')) { const [fp, sp, acc] = opt('form').split(',').map(Number); Sim.FORM.fp = fp; Sim.FORM.speed = sp; Sim.FORM.acc = acc; }

const CARDS = Sim.ROBOT_CARDS;
const names = Object.keys(CARDS);
const clone = o => JSON.parse(JSON.stringify(o));

function winRate(a, b, n, seed0) {
  let s = 0;
  for (let k = 0; k < n; k++) {
    const swap = k % 2 === 1;
    const B = swap ? Sim.fight(b, a, seed0 + k) : Sim.fight(a, b, seed0 + k);
    const w = B.winner;
    if (w === -1 || w == null) s += 0.5; else if ((w === 0) !== swap) s += 1;
  }
  return s / n;
}

function table(builds, n) {
  const ks = Object.keys(builds), M = {};
  ks.forEach((a, i) => { M[a] = M[a] || {}; ks.forEach((b, j) => {
    if (j <= i) return;
    const r = winRate(builds[a], builds[b], n, 1000 * (i * 31 + j));
    M[a][b] = r; (M[b] = M[b] || {})[a] = 1 - r;
  }); });
  return M;
}

function summary(M, ks) {
  const avg = {}; let pairs = 0, lop = 0, hard = 0;
  for (const a of ks) {
    const others = ks.filter(b => b !== a);
    avg[a] = others.reduce((s, b) => s + M[a][b], 0) / others.length;
  }
  for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) {
    const r = M[ks[i]][ks[j]]; pairs++;
    if (r >= 0.9 || r <= 0.1) lop++;
    if (r >= 0.8 || r <= 0.2) hard++;
  }
  return { avg, lopsided: lop / pairs, over80: hard / pairs };
}

const t0 = Date.now();
const M = table(CARDS, N);
const cardsOnly = names.filter(n => n !== 'Scrap Bot');
const S = summary(M, names), S12 = summary(M, cardsOnly);
console.log(`Robot cards, ${N} fights per pairing, form ${JSON.stringify(Sim.FORM)}  (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
console.log(`12 cards: ${(S12.lopsided * 100).toFixed(0)}% of pairings 90/10 or worse, ${(S12.over80 * 100).toFixed(0)}% 80/20 or worse`);
const order = names.slice().sort((a, b) => S.avg[b] - S.avg[a]);
console.log('\nAverage win % vs the other 12 (cards + Scrap Bot):');
for (const a of order) console.log('  ' + a.padEnd(11) + (S.avg[a] * 100).toFixed(0).padStart(4) + '%');
console.log('\nRow beats column (%):');
console.log(''.padEnd(11) + order.map(n => n.slice(0, 5).padStart(6)).join(''));
for (const a of order) console.log(a.slice(0, 10).padEnd(11) + order.map(b => a === b ? '     -' : String(Math.round(M[a][b] * 100)).padStart(6)).join(''));

if (args.includes('--parts')) {
  const parts = {
    'Heat Shield': b => (b.arm = 'heat'), 'Ablative Plating': b => (b.arm = 'ablative'), 'Reactive Spikes': b => (b.arm = 'spikes'), 'Composite Mesh': b => (b.arm = 'mesh'),
    'Quantum Shield (module)': b => (b.mod = 'quantum'), 'Burst Gun (gun robots)': b => { if (b.weapon !== 'gun') return false; b.cal = 'burst'; },
  };
  const n2 = Math.max(20, Math.round(N / 3));
  console.log(`\nNew parts: average win % vs the 13 stock cards (${n2} fights per pairing), with and without the part`);
  for (const [pn, fit] of Object.entries(parts)) {
    let base = 0, withP = 0, cnt = 0;
    for (const a of cardsOnly) {
      const b2 = clone(CARDS[a]); if (fit(b2) === false) continue;
      let s0 = 0, s1 = 0;
      for (const o of names) { if (o === a) continue; s0 += winRate(CARDS[a], CARDS[o], n2, 7); s1 += winRate(b2, CARDS[o], n2, 7); }
      base += s0 / (names.length - 1); withP += s1 / (names.length - 1); cnt++;
    }
    console.log('  ' + pn.padEnd(26) + ` ${(base / cnt * 100).toFixed(0)}% -> ${(withP / cnt * 100).toFixed(0)}%  (${cnt} robots)`);
  }
}
if (opt('json')) fs.writeFileSync(opt('json'), JSON.stringify({ form: Sim.FORM, n: N, M, avg: S.avg, lopsided12: S12.lopsided }, null, 1));
