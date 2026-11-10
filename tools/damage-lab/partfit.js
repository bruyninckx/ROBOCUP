// node fit.js lane nLanes -> fit/<robot>.json: every deck part on the robot vs 4 robots one level up (level 4: own level), 4 seeds x 2 sides
const D = './';
const L = require(D + 'engine.js'), LU = require(D + 'lineup.js'); LU.usePK();
const [lane, nl] = process.argv.slice(2).map(Number), fs = require('fs');
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), lv = n => all[n][0], names = Object.keys(all).sort();
const OFF = new Set(['laser', 'waller', 'blocker', 'spotter', 'repair', 'armourkit', 'bodyguard']);
const parts = ['none', ...Object.keys(LU.PARTS).filter(k => !OFF.has(k) && LU.PARTS[k].kind !== 'legendary' || ['core', 'hospital', 'quantum'].includes(k))];
const health = R => { let h = 0, m = 0; for (const q of R.parts.concat(R.internals || [])) { m += q.maxHp; h += q.attached === false ? 0 : Math.max(0, Math.min(q.hp, q.maxHp)); } return m ? 100 * h / m : 0; };
names.forEach((a, ia) => {
  if (ia % nl !== lane) return;
  const up = names.filter(b => lv(b) === Math.min(4, lv(a) + 1) && b !== a), opp = [0, 1, 2, 3].map(i => up[Math.floor(i * up.length / 4)]).filter((x, i, A) => A.indexOf(x) === i);
  const out = { robot: a, level: lv(a), opp, parts: {} };
  for (const pt of parts) { const f = [];
    opp.forEach((b, ib) => { for (let s = 0; s < 4; s++) for (const side of [0, 1]) {
      const A = LU.build(a, pt === 'none' ? [] : [pt]), B = LU.build(b);
      const S = L.create({ a: side ? B : A, b: side ? A : B, seed: 12000 + ib * 101 + s * 13 + side, arena: 'open' });
      while (!S.over && S.t < 200) { L.step(S); S.fx.length = 0; }
      const me = S.robots[side]; f.push([S.result.winner === side ? 1 : 0, Math.round(health(me) - health(me.enemy)), s]);
    } });
    out.parts[pt] = f; }
  fs.mkdirSync('fit', { recursive: true }); fs.writeFileSync('fit/' + a + '.json', JSON.stringify(out)); console.log('done', a);
});
