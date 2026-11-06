#!/usr/bin/env node
/* Weapon-swap test: every robot card with every Market weapon (quirk removed, guns at mid range), average win % vs the 12 unmodified cards.
   node tools/weapon-swap.js [fightsPerPairing=20] [cardName] [out.json] */
const Sim = require(require('path').join(__dirname, '..', 'src', 'sim.js'));
const N = +(process.argv[2] || 20), only = process.argv[3];
const clone = o => JSON.parse(JSON.stringify(o));
const C = Sim.ROBOT_CARDS, names = Object.keys(C);
const W = { laser: ['laser', null, 'mid'], mortar: ['mortar', null, 'long'], saw: ['saw', null, 'mid'], spinner: ['spinner', null, 'short'], flame: ['flame', null, 'short'],
  rapid: ['gun', 'rapid', 'mid'], medium: ['gun', 'medium', 'mid'], heavy: ['gun', 'heavy', 'mid'], burst: ['gun', 'burst', 'mid'] };
function wr(a, b, n, s0) { let s = 0; for (let k = 0; k < n; k++) { const sw = k % 2; const B = sw ? Sim.fight(b, a, s0 + k) : Sim.fight(a, b, s0 + k); const w = B.winner; if (w == null || w === -1) s += .5; else if ((w === 0) !== !!sw) s++; } return s / n; }
const avg = (bld, self) => { let t = 0, c = 0; names.forEach((o, j) => { if (o === self) return; t += wr(bld, C[o], N, 5000 + j * 97); c++; }); return t / c; };
const out = {};
for (const n of names) {
  if (only && n !== only) continue;
  const base = clone(C[n]); const row = { base: avg(base, n), sig: base.weapon === 'gun' ? base.cal : base.weapon };
  for (const [k, [w, cal, rng]] of Object.entries(W)) {
    const b = clone(C[n]); b.weapon = w; if (cal) b.cal = cal; b.range = rng; delete b.quirk;
    row[k] = avg(b, n);
  }
  out[n] = row; console.log(n, JSON.stringify(row, (k, v) => typeof v === 'number' ? Math.round(v * 100) : v));
}
if (process.argv[4]) require('fs').writeFileSync(process.argv[4], JSON.stringify(out));
