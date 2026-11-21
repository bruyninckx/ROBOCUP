// T41 (Kev, 21 Nov: "keep bend until repair"): what the wear marks a robot carries into its next fight cost it, to price them
// in the bookie's formula (src2/repair.js markCost). node markcost.js <out.jsonl> [Robot,...]; report: node markcost.js --fit <out.jsonl ...>
// Per robot: NS damaged states out of real fights (wear on, as the game keeps them: wearOf, then the free Body heal to half);
// each state fights the same NO rivals x SEEDS x 2 sides twice: with its marks, and with the marks taken off (same health).
// The difference is what the marks cost. --fit: least squares of the paired logit change on the mark sizes (zones().mk).
const fs = require('fs'), path = require('path');
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
global.DamageLab = L; global.Lineup = LU;
const R2 = require(path.join('..', '..', 'src2', 'repair.js'));
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), lv = n => all[n][0], names = Object.keys(all);
const clone = o => JSON.parse(JSON.stringify(o));
const FEAT = ['wbend', 'wwarp', 'wsnap', 'rub', 'bcrack', 'wcrack', 'open', 'cut'];
const featOf = Z => { const w = Z.weapon.mk || {}, b = Z.body.mk || {}; return { wbend: Math.min(34, w.bend || 0) / 10, wwarp: w.warp || 0, wsnap: w.snap || 0, rub: Math.min(2, b.rub || 0), bcrack: Math.min(1, b.crack || 0), wcrack: Math.min(1, w.crack || 0), open: b.open || 0, cut: Math.min(0.1, Math.max(w.cut || 0, b.cut || 0)) * 10 }; };
if (process.argv[2] === '--fit') {
  const recs = process.argv.slice(3).flatMap(f => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)));
  const lg = (w, n) => { const p = (w + 0.5) / (n + 1); return Math.log(p / (1 - p)); };
  // weighted least squares, no intercept: dlogit = sum_k c_k x_k
  const X = recs.map(r => FEAT.map(k => r.x[k] || 0)), y = recs.map(r => lg(r.wNo, r.n) - lg(r.wMk, r.n)), wt = recs.map(r => r.n);
  const K = FEAT.length, A = Array.from({ length: K }, () => Array(K).fill(0)), bv = Array(K).fill(0);
  X.forEach((x, i) => { for (let a = 0; a < K; a++) { bv[a] += wt[i] * x[a] * y[i]; for (let b = 0; b < K; b++) A[a][b] += wt[i] * x[a] * x[b]; } });
  for (let a = 0; a < K; a++) A[a][a] += 2;   // a little ridge: features never seen stay near 0
  const M = A.map((r, i) => r.concat([bv[i]])); for (let c = 0; c < K; c++) { let p = c; for (let r = c + 1; r < K; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]]; for (let r = 0; r < K; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= K; k++) M[r][k] -= f * M[c][k]; } }
  const coef = M.map((r, i) => r[K] / r[i]);
  const tot = recs.reduce((a, r) => ({ n: a.n + r.n, mk: a.mk + r.wMk, no: a.no + r.wNo, pred: a.pred + r.n * (r.pred || 0) }), { n: 0, mk: 0, no: 0, pred: 0 });
  console.log(`${recs.length} states, ${tot.n * 2} fights: wins with marks ${(100 * tot.mk / tot.n).toFixed(1)}%, marks off ${(100 * tot.no / tot.n).toFixed(1)}%`);
  console.log('fitted cost per unit (logits):', FEAT.map((k, i) => k + ' ' + coef[i].toFixed(3)).join(', '));
  const fit = recs.map(r => FEAT.reduce((a, k, i) => a + coef[i] * (r.x[k] || 0), 0));
  const mean = a => a.reduce((s, v, i) => s + v * wt[i], 0) / wt.reduce((s, v) => s + v, 0);
  console.log(`mean paired logit change ${mean(y).toFixed(3)}; mean of the fit ${mean(fit).toFixed(3)}; mean of the current markCost ${mean(recs.map(r => r.pred || 0)).toFixed(3)}`);
  const rmse = v => Math.sqrt(mean(y.map((yy, i) => (yy - v[i]) ** 2)));
  console.log(`per state, root mean square error: fit ${rmse(fit).toFixed(3)}, current markCost ${rmse(recs.map(r => r.pred || 0)).toFixed(3)}, zero ${rmse(y.map(() => 0)).toFixed(3)}`);
  process.exit(0);
}
const out = process.argv[2], who = process.argv[3] ? process.argv[3].split(',') : names;
const NS = +process.env.NS || 4, NO = +process.env.NO || 3, SEEDS = +process.env.SEEDS || 2;
const run = (A, B, seed) => { const S = L.create({ a: A, b: B, seed, arena: 'open' }); while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; } return S; };
const done = new Set(fs.existsSync(out) ? fs.readFileSync(out, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l).robot) : []);
for (const a of who) {
  if (done.has(a)) continue;
  const h = [...a].reduce((x, c) => x * 31 + c.charCodeAt(0) >>> 0, 7);
  const near = names.filter(b => b !== a && Math.abs(lv(b) - lv(a)) <= 1);
  const states = [];
  for (let i = 0; states.length < NS && i < NS * 6; i++) {
    const b = near[(h + i * 3) % near.length], side = i % 2;
    const S = run(side ? LU.build(b) : LU.build(a), side ? LU.build(a) : LU.build(b), 61000 + h % 1000 + i * 13);
    const sp = LU.build(a); sp.wear = clone(L.wearOf(S.robots[side])); R2.bodyHeal(sp, 0.5);
    if (!sp.wear.marks) continue; const x = featOf(R2.zones(sp)); if (!FEAT.some(k => x[k] > 0)) continue;
    states.push(sp.wear);
  }
  const opp = []; for (let i = 0; opp.length < NO && i < 99; i++) { const b = near[(h + 7 + i * 5) % near.length]; if (!opp.includes(b)) opp.push(b); }
  const fights = []; for (const b of opp) for (let s = 0; s < SEEDS; s++) for (const side of [0, 1]) fights.push({ b, side, seed: 81000 + h % 1000 + fights.length * 19 });
  const play = wear => { let w = 0; for (const f of fights) { const A = LU.build(a), B = LU.build(f.b); A.wear = clone(wear); const S = run(f.side ? B : A, f.side ? A : B, f.seed); if (S.result.winner === f.side) w++; } return w; };
  for (const wear of states) {
    const sp = LU.build(a); sp.wear = wear; const Z = R2.zones(sp), x = featOf(Z), noMk = clone(wear); delete noMk.marks;
    const rec = { robot: a, lv: lv(a), n: fights.length, wMk: play(wear), wNo: play(noMk), x, pred: +R2.markCost(Z).toFixed(3), marks: R2.ZONES.map(z => z.key + ': ' + Z[z.key].marks.join(', ')).join(' | ') };
    fs.appendFileSync(out, JSON.stringify(rec) + '\n');
  }
  console.log('done', a);
}
