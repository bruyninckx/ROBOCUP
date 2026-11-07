// flanker experiment: every market robot with its own chip vs with the flanker chip, against the other six. node flank.js [seedFrom seedTo]
const L = require('./engine.js'); const [s0 = 501, s1 = 504] = process.argv.slice(2).map(Number);
const names = Object.keys(L.PRESETS).filter(k => L.PRESETS[k].market);
for (const n of names) {
  const row = []; for (const pr of [L.PRESETS[n].proc, 'flanker']) {
    let w = 0, N = 0, fl = 0, an = 0, t = 0;
    for (const m of names) if (m !== n) for (let s = s0; s <= s1; s++) for (const ar of ['open', 'pit']) {
      const swap = s % 2, a = { preset: n, proc: pr, name: 'X' }, b = { preset: m, name: 'Y' };
      const S = L.run({ a: swap ? b : a, b: swap ? a : b, seed: s, arena: ar }, 200), me = S.robots[swap ? 1 : 0];
      N++; if (S.result.winner === me.id) w++; fl += me.stats.flankD || 0; an += me.stats.anyD || 0; t += S.result.t;
    }
    row.push(`${pr.padEnd(8)} wins ${Math.round(w / N * 100)}%  side/rear ${Math.round(fl / an * 100)}%  len ${Math.round(t / N)}s`);
  }
  console.log(n.padEnd(11), row.join('   |   '));
}
