// node l4diag.js Robot Opp [fights] : damage dealt/taken by cause, callouts, and the robot's log lines
const L = require('./engine.js'), LU = require('./lineup.js'); LU.usePK();
const [r, o] = process.argv.slice(2, 4), N = +process.argv[4] || 4;
if (process.env.DMGK) for (const kv of process.env.DMGK.split(",")) { const [k, v] = kv.split(":"); L.PRESETS[k].dmgK = +v; }
for (let k = 0; k < N; k++) {
  const pg = process.env.PG ? +process.env.PG : 1, S = L.create({ a: { preset: r, name: r, dmgK: (L.PRESETS[r].dmgK || 1) * pg, hpK: pg }, b: Object.assign(LU.build(o), { name: o }), seed: 10001 + k });
  const calls = {}; while (!S.over && S.t < 200) { L.step(S); for (const f of S.fx) if (f.type === 'callout') calls[f.text] = (calls[f.text] || 0) + 1; S.fx.length = 0; }
  const [A, B] = S.robots, f = x => Object.entries(x).sort((a, b) => b[1] - a[1]).map(([k2, v]) => `${k2} ${v.toFixed ? v.toFixed(0) : v}`).join(', ');
  console.log(`#${k} ${S.result.text} (${S.t.toFixed(0)} s)\n  ${r} dealt ${A.stats.dealt.toFixed(0)}: ${f(A.stats.dealtBy)}\n  ${o} dealt ${B.stats.dealt.toFixed(0)}: ${f(B.stats.dealtBy)}\n  calls: ${f(calls)}`);
  if (process.env.LOG) console.log(S.log.filter(l => l.side === 0).slice(0, 25).map(l => '   ' + l.t.toFixed(1) + ' ' + l.text).join('\n'));
}
