// node calib.js verify.json tiers.json [newTiers.json] : fit strengths, show tier-vs-tier win %, propose new p
const T = require('./tiers.js'), fs = require('fs');
const d = JSON.parse(fs.readFileSync(process.argv[2])), cfg = JSON.parse(fs.readFileSync(process.argv[3])), names = d.names, n = names.length;
const fit = JSON.parse(fs.readFileSync('fit1.json')), slope = Object.fromEntries(fit.map(r => [r.name, Math.max(3, Math.min(6.5, r.slope))]));
const g = {}; for (const [i, j, w] of d.res) { const k = i + ',' + j; g[k] = g[k] || [i, j, 0, 0]; g[k][2] += w; g[k][3]++; }
const G = Object.values(g), s = T.bt(n, G, 1500), STEP = 0.62, base = +process.env.S0 || 0;
// centre: tier-0 mean strength = base
const tiers = names.map(nm => cfg[nm].tier), m0 = names.filter((_, i) => tiers[i] === 0).reduce((a, nm) => a + s[names.indexOf(nm)], 0) / names.filter((_, i) => tiers[i] === 0).length;
const wr = (A, B) => { let w = 0, t = 0; for (const [i, j, ww, tt] of G) { if (A.includes(i) && B.includes(j)) { w += ww; t += tt; } else if (A.includes(j) && B.includes(i)) { w += tt - ww; t += tt; } } return t ? Math.round(100 * w / t) : null; };
const idx = t => names.map((_, i) => i).filter(i => tiers[i] === t);
console.log('tier vs tier (row wins %):'); for (let a = 0; a <= 3; a++) console.log('  L' + a, [0, 1, 2, 3].map(b => a === b ? ' -- ' : String(wr(idx(a), idx(b))).padStart(4)).join(' '), '  within-tier spread', idx(a).map(i => (s[i] - m0).toFixed(2)).join(' '));
const nc = {};
for (let i = 0; i < n; i++) { const nm = names[i], tgt = tiers[i] * STEP, cur = s[i] - m0, p = cfg[nm].p * Math.exp(0.8 * (tgt - cur) / slope[nm]); nc[nm] = { tier: tiers[i], p: Math.round(p * 1000) / 1000 };
  const vsLower = tiers[i] > 0 ? wr([i], idx(tiers[i] - 1)) : null, vsSame = wr([i], idx(tiers[i]).filter(j => j !== i));
  console.log(nm.padEnd(11), 'L' + tiers[i], 'p', cfg[nm].p.toFixed(3), 'str', cur.toFixed(2).padStart(6), 'target', tgt.toFixed(2), ' vs same tier', String(vsSame).padStart(3) + '%', vsLower != null ? ' vs tier below ' + vsLower + '%' : '', ' -> p', nc[nm].p); }
if (process.argv[4]) fs.writeFileSync(process.argv[4], JSON.stringify(nc, null, 1));
