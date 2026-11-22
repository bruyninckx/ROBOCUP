// T49 (Kev, 21 Nov: Repair kit "give it something extra, for example protecting the battery"): every robot with a part card against
// every robot a level up (level 4: its own level), the same seeds as parttest.js, with how each fight ended. docs/robocus-repair-kit-extra.md
//   node kitextra.js VARIANT shard nShards fLo fHi out.jsonl      (appends one line a fight; skips fights already in out.jsonl, so a restart loses little)
// VARIANT: none | kit | shield | medic | hull | tow | any part key, optionally with knobs for the kit: kit+repairBatt=0.5+repairFix=1
// (knobs go into ARC.pk; every one is unset on main = today's kit). Lines: [robot, variant, opp, f, score 1/0.5/0, how, cause, t, healed]
const L = require('./engine.js'), LU = require('./lineup.js'), fs = require('fs');
const [vname, shard, nsh, fLo, fHi, out] = [process.argv[2], +process.argv[3], +process.argv[4], +process.argv[5], +process.argv[6], process.argv[7]];
const [pk0, ...kn] = vname.split('+'); const knobs = {};
for (const s of kn) { const [k, v] = s.split('='); knobs[k] = +v; }
LU.usePK(); Object.assign(L.ARC.pk, knobs);
const part = pk0 === 'none' ? null : pk0 === 'kit' ? 'repair' : pk0;
const all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), names = Object.keys(all), lv = n => all[n][0];
const done = new Set(); if (fs.existsSync(out)) for (const ln of fs.readFileSync(out, 'utf8').split('\n')) if (ln) { try { const r = JSON.parse(ln); done.add(r[0] + '|' + r[2] + '|' + r[3]); } catch (e) {} }
const cause = s => !s ? '' : /battery/.test(s) ? 'battery' : /chassis/.test(s) ? 'chassis' : /radio/.test(s) ? 'radio' : /immobilised|crippled/.test(s) ? 'drive' : /upside/.test(s) ? 'flipped' : /pit/.test(s) ? 'pit' : 'other';
let job = 0;
for (let f = fLo; f < fHi; f++) for (const n of names) { const opp = names.filter(m => m !== n && lv(m) === Math.min(4, lv(n) + 1));
  for (const o of opp) { if ((job++ % nsh) !== shard) continue; if (done.has(n + '|' + o + '|' + f)) continue;
    const sw = f % 2, A = LU.build(n, part ? [part] : []), B = LU.build(o), S = L.create({ a: sw ? B : A, b: sw ? A : B, seed: 41000 + f * 97 + names.indexOf(o), arena: 'open' });
    const me = S.robots[sw ? 1 : 0]; let healed = 0;
    while (!S.over && S.t < 200) { const h0 = me.chassis.hp; L.step(S); S.fx.length = 0; if (me.healing) healed += Math.max(0, me.chassis.hp - h0); }
    const w = S.result.winner, sc = w == null ? 0.5 : ((w === 0) !== !!sw ? 1 : 0), lo = S.robots.find(R => !R.alive);
    // cause: why the loser lost a KO; '+' prefix = our robot was knocked out, '-' = the opponent was
    const c = S.result.how === 'KO' && lo ? (lo === me ? '+' : '-') + cause(lo.ko) : '';
    fs.appendFileSync(out, JSON.stringify([n, vname, o, f, sc, S.result.how, c, Math.round(S.t * 10) / 10, Math.round(healed)]) + '\n'); } }
