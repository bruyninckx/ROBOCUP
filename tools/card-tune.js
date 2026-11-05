#!/usr/bin/env node
/* Tries every single stat-point move (one level from one stat to another, total stays the same) on one robot card
   and reports the moves that bring its average win % closest to a target while making the fewest lopsided matchups.
   node tools/card-tune.js Juggernaut 0.70 [--n 40] [--form 0.25,0.15,10]
*/
const path = require('path');
const Sim = require(path.join(__dirname, '..', 'src', 'sim.js'));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const name = args[0], target = +args[1];
const N = +opt('n', 40);
if (opt('form')) { const [fp, sp, acc] = opt('form').split(',').map(Number); Object.assign(Sim.FORM, { fp, speed: sp, acc }); }
const C = Sim.ROBOT_CARDS, others = Object.keys(C).filter(n => n !== name);
const clone = o => JSON.parse(JSON.stringify(o));
function wr(a, b, n) { let s = 0; for (let k = 0; k < n; k++) { const sw = k % 2; const B = sw ? Sim.fight(b, a, 500 + k) : Sim.fight(a, b, 500 + k); s += B.winner === -1 ? 0.5 : ((B.winner === 0) !== !!sw ? 1 : 0); } return s / n; }
function evalB(b) { const rs = others.map(o => wr(b, C[o], N)); const avg = rs.reduce((a, x) => a + x, 0) / rs.length; return { avg, lop: rs.filter(r => r >= 0.9 || r <= 0.1).length, rs }; }
const base = evalB(C[name]);
const res = [];
for (const from of Sim.STATS) for (const to of Sim.STATS) {
  if (from === to) continue;
  const b = clone(C[name]); if (b.lv[from] <= 0 || b.lv[to] >= 4) continue;
  b.lv[from]--; b.lv[to]++;
  const e = evalB(b); res.push({ move: `${from}-1 ${to}+1`, ...e, score: Math.abs(e.avg - target) * 10 + e.lop * 0.3 });
}
res.sort((a, b) => a.score - b.score);
console.log(`${name}: now ${(base.avg * 100).toFixed(0)}% avg, ${base.lop} lopsided of ${others.length}; target ${(target * 100).toFixed(0)}%`);
for (const r of res.slice(0, 6)) console.log(`  ${r.move.padEnd(20)} ${(r.avg * 100).toFixed(0)}%  lopsided ${r.lop}`);
