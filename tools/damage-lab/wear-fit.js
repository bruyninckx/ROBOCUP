// ROBOCUS 2.0 (Kev, 11 Nov): node wear-fit.js <wear-study .jsonl>  -> what a broken Body costs, by what is lost and by robot.
// Model (Drive and Weapon fine): logit(wins damaged) = logit(wins as new) - [chip_r if the processor chip is dead] - arm_r * (armour pieces + top plate lost) / 4
// chip_r and arm_r are pulled towards the all-robot value (ridge) so a robot only moves away from it on evidence.
const fs = require('fs');
const rows = process.argv.slice(2).flatMap(f => fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l))).filter(r => r.z.drive === 'ok' && r.z.weapon === 'ok' && r.z.body === 'broken');
const robots = [...new Set(rows.map(r => r.robot))].sort(), lg = p => Math.log(p / (1 - p)), sg = x => 1 / (1 + Math.exp(-x));
const X = rows.map(r => ({ r: r.robot, n: r.n, w: r.worn, b: lg((r.base + 1) / (r.n + 2)), chip: r.lost.some(l => /chip/i.test(l)) ? 1 : 0, arm: Math.min(4, r.lost.filter(l => !/chip/i.test(l)).length) / 4 }));
const th = { chip: 1.5, arm: 0.6 }; for (const r of robots) { th['c_' + r] = 0; th['a_' + r] = 0; }
const RC = +process.env.RC || 0.5, RA = +process.env.RA || 0.5;
for (let it = 0; it < 6000; it++) {
  const g = {}; for (const k in th) g[k] = k.startsWith('c_') ? RC * th[k] : k.startsWith('a_') ? RA * th[k] : 0;
  for (const x of X) { const cost = (th.chip + th['c_' + x.r]) * x.chip + (th.arm + th['a_' + x.r]) * x.arm, p = sg(x.b - cost), e = (x.w - x.n * p) / 16;   // d logL / d cost = -(w - n p)
    g.chip += e * x.chip; g['c_' + x.r] += e * x.chip; g.arm += e * x.arm; g['a_' + x.r] += e * x.arm; }
  for (const k in th) th[k] -= 0.02 * g[k];
}
console.log(rows.length + ' body-broken states; all robots: dead chip ' + th.chip.toFixed(2) + ', all armour and top plate gone ' + th.arm.toFixed(2) + ' (logits; one level = 0.62)');
const out = {}; for (const r of robots) { const n = X.filter(x => x.r === r), nc = n.filter(x => x.chip).length; out[r] = [Math.max(0, Math.round((th.arm + th['a_' + r]) * 10) / 10), Math.max(0, Math.round((th.chip + th['c_' + r]) * 10) / 10)]; console.log(r.padEnd(13) + ' armour ' + out[r][0].toFixed(1) + '   chip ' + out[r][1].toFixed(1) + '   (' + n.length + ' states, ' + nc + ' with a dead chip)'); }
console.log(JSON.stringify(out));
