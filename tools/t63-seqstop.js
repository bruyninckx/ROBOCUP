// T63 Part 3 check (22 Nov 2026): how soon can a sequential test say "this part does little here / as usual / strong here"?
// Two SPRTs side by side on the paired differences (win with the part minus without, same seed): usual value u against u - 15
// ("does little") and u against u + 15 ("strong"), 5% error each way, noise per pair from the pairs so far (at least 0.1), checked after every
// block of 10 pairs, at most 150 pairs (no call by then: shown "as usual"). Each cell's own fights are resampled 2,000 times.
//   node tools/t63-seqstop.js     (uses tools/t60-out for Scavenger and tools/t63-out/p2.jsonl for the 8 others)
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const USUAL = { booster: 0.13, jammer: 0.17, quantum: 0.26 };   // the part's average gain on a robot vs a level up (combo hunt slice, 22 Nov)
const SIG2 = 0.62 * 0.62, D = 0.15, A = Math.log(0.95 / 0.05), B = Math.log(0.05 / 0.95), CAP = 150, BLK = 10;
const jl = f => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch (e) { return null; } }).filter(Boolean);
const cells = [];
{ // Scavenger, T60 runs (seed-paired)
  const full = new Map(jl(path.join(ROOT, 'tools/t60-out/r11.jsonl')).map(r => [r.seed, r.gyroWon]));
  for (const p of ['booster', 'jammer', 'quantum']) {
    const R = jl(path.join(ROOT, 'tools/t60-out/g_no' + p + '.jsonl')).filter(r => full.has(r.seed));
    cells.push({ opp: 'Scavenger', p, d: R.map(r => full.get(r.seed) - r.gyroWon) });
  }
}
{
  const f = path.join(ROOT, 'tools/t63-out/p2.jsonl'); const C = {};
  if (fs.existsSync(f)) for (const r of jl(f)) ((C[r.opp] = C[r.opp] || {})[r.v] = C[r.opp][r.v] || {})[r.seed] = r.w;
  for (const [opp, V] of Object.entries(C)) for (const p of ['booster', 'jammer', 'quantum']) {
    const off = V['no' + p]; if (!V.full || !off) continue;
    const d = Object.keys(V.full).filter(s => off[s] != null).map(s => V.full[s] - off[s]); if (d.length >= 20) cells.push({ opp, p, d });
  }
}
let seed = 12345; const rnd = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
// log-likelihood ratio of a mean mu1 against mu0 for one difference x (normal model)
const llr = (x, mu0, mu1) => (mu1 - mu0) / SIG2 * (x - (mu0 + mu1) / 2);
const out = ['| Opponent | Part | fights in the data | gain measured | call: does little / as usual / strong / no call | pairs needed (mean, 90% of runs within) |', '|---|---|---|---|---|---|'];
let allN = [];
for (const c of cells) {
  const u = USUAL[c.p], m = c.d.reduce((a, x) => a + x, 0) / c.d.length, calls = { little: 0, usual: 0, strong: 0, none: 0 }, Ns = [];
  for (let k = 0; k < 2000; k++) {
    let lo = 0, hi = 0, loDone = 0, hiDone = 0, n = 0, S = 0, S2 = 0, call = 'none';   // loDone: 1 = "little" accepted, -1 = "usual" accepted (lower test)
    while (n < CAP) {
      for (let b = 0; b < BLK; b++) { const x = c.d[Math.floor(rnd() * c.d.length)]; S += x; S2 += x * x; n++; }
      // the noise from the pairs so far (at least 0.1: a few pairs that never flip must not make it sure too soon)
      const s2 = Math.max(0.1, S2 / n - (S / n) ** 2);
      lo = (u - D - u) / s2 * (S - n * (u + u - D) / 2); hi = (u + D - u) / s2 * (S - n * (u + u + D) / 2);
      if (!loDone) loDone = lo >= A ? 1 : lo <= B ? -1 : 0;
      if (!hiDone) hiDone = hi >= A ? 1 : hi <= B ? -1 : 0;
      if (loDone === 1) { call = 'little'; break; } if (hiDone === 1) { call = 'strong'; break; }
      if (loDone === -1 && hiDone === -1) { call = 'usual'; break; }
    }
    calls[call]++; Ns.push(n);
  }
  Ns.sort((a, b) => a - b); allN = allN.concat(Ns);
  const pc = x => Math.round(x / 20);
  out.push(`| ${c.opp} | ${c.p} | ${c.d.length} | ${m >= 0 ? '+' : ''}${Math.round(100 * m)} (usual +${Math.round(100 * u)}) | ${pc(calls.little)}% / ${pc(calls.usual)}% / ${pc(calls.strong)}% / ${pc(calls.none)}% | ${Math.round(Ns.reduce((a, x) => a + x, 0) / Ns.length)} (${Ns[Math.floor(Ns.length * 0.9)]}) |`);
}
allN.sort((a, b) => a - b);
out.push(`All cells: mean ${Math.round(allN.reduce((a, x) => a + x, 0) / allN.length)} pairs, median ${allN[Math.floor(allN.length / 2)]}, 90% within ${allN[Math.floor(allN.length * 0.9)]} (a fixed test would use 150).`);
console.log(out.join('\n')); fs.mkdirSync(path.join(ROOT, 'tools/t63-out'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'tools/t63-out/seqstop.txt'), out.join('\n') + '\n');
