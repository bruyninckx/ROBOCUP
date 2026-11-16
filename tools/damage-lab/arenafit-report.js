// node arenafit-report.js <dir> [shrink=0.5] [--fit]
// Merges the arenafit.js --out files in <dir> (open-*.json, saws-*.json, ...) and prints, per arena: fight length, KO / judges
// share, hazard share of all damage, and every robot's win % against its own level there vs on the open floor
// (change in points, its ± (1 sd), and the logit change x shrink = the tabletop's ARENA_FIT). --fit prints ARENA_FIT as JSON.
// Also: what an arena pick is worth to a host (same-level pairs, best arena for the host's robot vs the rival, in points).
const fs = require('fs'), path = require('path');
const dir = process.argv[2], shrink = +(process.argv.find(a => /^[0-9.]+$/.test(a)) || 0.5), asFit = process.argv.includes('--fit');
const runs = {};
for (const f of fs.readdirSync(dir)) { if (!f.endsWith('.json')) continue; const r = JSON.parse(fs.readFileSync(path.join(dir, f))); const A = runs[r.arena] = runs[r.arena] || { fights: 0, secs: 0, kos: 0, judges: 0, hz: 0, dmg: 0, koWhy: {}, w: {}, n: {}, trait: {} };
  for (const k of ['fights', 'secs', 'kos', 'judges', 'hz', 'dmg']) A[k] += r[k] || 0;
  for (const k in r.koWhy) A.koWhy[k] = (A.koWhy[k] || 0) + r.koWhy[k];
  for (const k in r.n) { A.n[k] = (A.n[k] || 0) + r.n[k]; A.w[k] = (A.w[k] || 0) + (r.w[k] || 0); }
  Object.assign(A.trait, r.trait); }
const O = runs.open; if (!O) { console.error('no open-floor runs in ' + dir); process.exit(1); }
const lg = p => { p = Math.min(0.97, Math.max(0.03, p)); return Math.log(p / (1 - p)); };
const pc = x => Math.round(100 * x);
const FIT = {}, rows = {};
for (const a of Object.keys(runs)) {
  const A = runs[a];
  if (!asFit) console.log(`\n## ${a}: ${A.fights} fights, avg ${(A.secs / A.fights).toFixed(1)} s, KO ${pc(A.kos / A.fights)}%, judges ${pc(A.judges / A.fights)}%, hazard ${(100 * A.hz / Math.max(1, A.dmg)).toFixed(1)}% of damage` + (a === 'open' ? '' : ''));
  if (a === 'open') continue;
  const list = [];
  for (const r in A.n) { const p1 = A.w[r] / A.n[r], p0 = O.w[r] / O.n[r], se = Math.sqrt(p1 * (1 - p1) / A.n[r] + p0 * (1 - p0) / O.n[r]);
    const f = Math.round((lg(p1) - lg(p0)) * shrink * 100) / 100; (FIT[r] = FIT[r] || {})[a] = f;
    list.push({ r, lv: A.trait[r].lv, p0, p1, d: p1 - p0, se, n: A.n[r], n0: O.n[r], f, t: A.trait[r] }); }
  list.sort((x, y) => y.d - x.d); rows[a] = list;
  if (asFit) continue;
  const big = list.filter(x => Math.abs(x.d) >= 0.08), sure = list.filter(x => Math.abs(x.d) >= 2 * x.se);
  console.log(`robots moved 8+ points: ${big.length} (${big.filter(x => x.d > 0).length} up, ${big.filter(x => x.d < 0).length} down); outside 2 sd: ${sure.length}; mean |change| ${pc(list.reduce((s, x) => s + Math.abs(x.d), 0) / list.length)} pts`);
  console.log('| Robot | Lv | kg | drive | weapon | open % | here % | change | ± | fit |'); console.log('|---|---|---|---|---|---|---|---|---|---|');
  for (const x of list) console.log(`| ${x.r} | ${x.lv} | ${x.t.kg} | ${x.t.drive} | ${x.t.weapon} | ${pc(x.p0)} | ${pc(x.p1)} | ${x.d >= 0 ? '+' : ''}${pc(x.d)} | ${pc(x.se)} | ${x.f} |`);
  console.log('KO causes: ' + Object.entries(A.koWhy).sort((x, y) => y[1] - x[1]).slice(0, 6).map(([k, v]) => `${k} ${pc(v / A.fights)}%`).join(', '));
}
if (!asFit) console.log(`\n## open KO causes: ` + Object.entries(O.koWhy).sort((x, y) => y[1] - x[1]).slice(0, 6).map(([k, v]) => `${k} ${pc(v / O.fights)}%`).join(', '));
// what the arena pick is worth to a host: every same-level pair, the host takes the arena with the biggest (fit mine - fit foe) if > 0
if (!asFit) { const ar = Object.keys(rows), names = Object.keys(O.n), lvOf = r => O.trait[r].lv; let sum = 0, cnt = 0, pick = {};
  for (const x of names) for (const y of names) { if (x === y || lvOf(x) !== lvOf(y)) continue; let best = 0, bk = 'open';
    for (const a of ar) { const v = (FIT[x][a] - FIT[y][a]) / shrink; if (v > best) { best = v; bk = a; } }
    sum += 1 / (1 + Math.exp(-best)) - 0.5; cnt++; pick[bk] = (pick[bk] || 0) + 1; }
  console.log(`\nArena pick worth to the host (same-level pairs, measured change, not shrunk): +${(100 * sum / cnt).toFixed(1)} points on average from 50%; best arena: ` + Object.entries(pick).map(([k, v]) => `${k} ${pc(v / cnt)}%`).join(', '));
  let sumS = 0; for (const x of names) for (const y of names) { if (x === y || lvOf(x) !== lvOf(y)) continue; let best = 0; for (const a of ar) best = Math.max(best, FIT[x][a] - FIT[y][a]); sumS += 1 / (1 + Math.exp(-best)) - 0.5; }
  console.log(`  (with the shrunk ARENA_FIT the bookie uses: +${(100 * sumS / cnt).toFixed(1)} points)`); }
if (asFit) console.log(JSON.stringify(FIT));
