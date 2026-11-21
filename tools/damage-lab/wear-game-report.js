// ROBOCUS T37: report for wear-game.js.  node wear-game-report.js <duel .jsonl ...> [--bw bw.jsonl]  -> markdown tables on stdout
// Every number compares a variant with today's game (off) on the same fights (same robots, seed, side): paired differences, 95% ranges.
const fs = require('fs'), path = require('path');
const LU = require('./lineup.js'), all = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), lv = n => all[n][0];
const args = process.argv.slice(2), bwI = args.indexOf('--bw'), bwFile = bwI >= 0 ? args.splice(bwI, 2)[1] : null;
// Windows cmd does not expand wildcards: do it here
const glob = f => { if (!f.includes('*')) return [f]; const d = path.dirname(f), re = new RegExp('^' + path.basename(f).replace(/[.]/g, '\\.').replace(/\*/g, '.*') + '$'); return fs.readdirSync(d).filter(n => re.test(n)).sort().map(n => path.join(d, n)); };
const read = f => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const recs = args.flatMap(glob).flatMap(read), V = recs[0].r.map(x => x.v), VAR = V.filter(v => v !== 'off');
const NAMEV = { bend: 'A: bend only', all: 'B: all four' };
const pc = x => (100 * x).toFixed(0), sg = x => (x >= 0 ? '+' : '') + (100 * x).toFixed(0);
const ms = a => { const n = a.length, m = a.reduce((s, x) => s + x, 0) / n, sd = Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(1, n - 1)); return { n, m, h: 1.96 * sd / Math.sqrt(n) }; };
const get = (rec, v) => rec.r.find(x => x.v === v);
const out = []; const P = s => out.push(s);
P(`Fights: ${recs.length} matchups x ${V.length} variants (${recs.length * V.length} fights). Seeds per pair: ${Math.max(...recs.map(r => +r.id.split('|')[2])) + 1} rounds.`);
// ---- 3. fight length, knockouts, time-outs ----
P('\n### Fight length, knockouts, time-outs\n\n| | ' + V.map(v => v === 'off' ? "Today (off)" : NAMEV[v]).join(' | ') + ' |\n|---|' + V.map(() => '---|').join(''));
const len = v => ms(recs.map(r => get(r, v).t)), ko = v => ms(recs.map(r => get(r, v).ko)), to = v => ms(recs.map(r => get(r, v).ko ? 0 : 1)), draw = v => recs.filter(r => get(r, v).aw === 0.5).length;
P('| Fight length, s | ' + V.map(v => `${len(v).m.toFixed(1)} ± ${len(v).h.toFixed(1)}`).join(' | ') + ' |');
P('| Knockouts | ' + V.map(v => `${pc(ko(v).m)}%`).join(' | ') + ' |');
P('| Ends on time (judges) | ' + V.map(v => `${pc(to(v).m)}%`).join(' | ') + ' |');
P('| No winner | ' + V.map(v => draw(v)).join(' | ') + ' |');
for (const v of VAR) { const flip = recs.filter(r => get(r, v).aw !== get(r, 'off').aw).length; P(`| Winner differs from today, ${NAMEV[v]} | ` + V.map(x => x === v ? `${pc(flip / recs.length)}%` : '').join(' | ') + ' |'); }
// ---- 2. level steps ----
P('\n### Level steps: how often the higher level wins\n\n| Step | Fights | Today | ' + VAR.map(v => `${NAMEV[v]} | change`).join(' | ') + ' |\n|---|---|---|' + VAR.map(() => '---|---|').join(''));
const steps = {};
for (const r of recs) { if (Math.abs(r.la - r.lb) !== 1) continue; const lo = Math.min(r.la, r.lb), hiA = r.la > r.lb, k = `${lo} → ${lo + 1}`; (steps[k] = steps[k] || []).push(r); (steps.all = steps.all || []).push(r); }
const hw = (r, v) => { const a = get(r, v).aw; return r.la > r.lb ? a : 1 - a; };
for (const k of Object.keys(steps).filter(k => k !== 'all').sort().concat(['all'])) { const F = steps[k], b = ms(F.map(r => hw(r, 'off')));
  P(`| ${k === 'all' ? 'all steps' : 'level ' + k} | ${F.length} | ${pc(b.m)}% ± ${pc(b.h)} | ` + VAR.map(v => { const x = ms(F.map(r => hw(r, v))), d = ms(F.map(r => hw(r, v) - hw(r, 'off'))); return `${pc(x.m)}% | ${sg(d.m)} ± ${pc(d.h)}`; }).join(' | ') + ' |'); }
// ---- 1. per robot ----
const per = {}; const add = (n, kind, r, side) => { const o = per[n] = per[n] || { own: [], up: [], down: [], cx: {} }; o[kind].push({ r, side }); };
for (const r of recs) { const d = r.lb - r.la; if (d === 0) { add(r.a, 'own', r, 'A'); add(r.b, 'own', r, 'B'); } else if (d === 1) { add(r.a, 'up', r, 'A'); add(r.b, 'down', r, 'B'); } else { add(r.b, 'up', r, 'B'); add(r.a, 'down', r, 'A'); } }
const wn = (x, v) => { const a = get(x.r, v).aw; return x.side === 'A' ? a : 1 - a; };
const names = Object.keys(per).sort((a, b) => lv(a) - lv(b) || a.localeCompare(b)), summary = {};
for (const v of VAR) {
  P(`\n### Per robot, ${NAMEV[v]} (win %, change against today on the same fights, 95% range)\n\n| Lv | Robot | vs own level: fights | today | ${v} | change | vs a level up: fights | today | ${v} | change | all fights: change |\n|---|---|---|---|---|---|---|---|---|---|---|`);
  for (const n of names) { const o = per[n], cell = F => { if (!F.length) return '- | - | - | -'; const b = ms(F.map(x => wn(x, 'off'))), w = ms(F.map(x => wn(x, v))), d = ms(F.map(x => wn(x, v) - wn(x, 'off'))); return `${F.length} | ${pc(b.m)} | ${pc(w.m)} | ${sg(d.m)} ± ${pc(d.h)}`; };
    const A = o.own.concat(o.up, o.down), d = ms(A.map(x => wn(x, v) - wn(x, 'off')));
    (summary[v] = summary[v] || {})[n] = { d: d.m, h: d.h, n: d.n };
    P(`| ${lv(n)} | ${n} | ${cell(o.own)} | ${cell(o.up)} | **${sg(d.m)} ± ${pc(d.h)}** (${d.n}) |`); }
}
// ---- 4. who gains / loses, and what happens to them ----
const cxOf = (x, v) => get(x.r, v)[x.side].cx || {};
const KEYS = ['wbend', 'snap', 'warp', 'bend', 'rub', 'crack', 'crackin', 'split', 'cut', 'frag'];
for (const v of VAR) {
  const s = Object.entries(summary[v]).sort((a, b) => b[1].d - a[1].d);
  P(`\n### Biggest movers, ${NAMEV[v]} (all fights; per fight: wear events on this robot / on its opponents)\n\n| Robot | Lv | change | ${KEYS.join(' | ')} | kink at end, ° |\n|---|---|---|${KEYS.map(() => '---|').join('')}---|`);
  for (const [n, q] of s.slice(0, 6).concat(s.slice(-6))) {
    const A = per[n].own.concat(per[n].up, per[n].down), cnt = k => A.reduce((t, x) => t + (cxOf(x, v)[k] || 0), 0) / A.length, opp = k => A.reduce((t, x) => t + ((get(x.r, v)[x.side === 'A' ? 'B' : 'A'].cx || {})[k] || 0), 0) / A.length;
    const kink = A.reduce((t, x) => t + get(x.r, v)[x.side].kink, 0) / A.length;
    P(`| ${n} | ${lv(n)} | ${sg(q.d)} ± ${pc(q.h)} | ${KEYS.map(k => `${cnt(k).toFixed(1)} / ${opp(k).toFixed(1)}`).join(' | ')} | ${kink.toFixed(0)} |`);
  }
  const sig = s.filter(([, q]) => Math.abs(q.d) > q.h);
  P(`\nRobots whose change is outside its 95% range (${NAMEV[v]}): ${sig.map(([n, q]) => `${n} ${sg(q.d)}`).join(', ') || 'none'} (with ${names.length} robots, about ${Math.round(names.length * 0.05)} would land outside by luck alone).`);
  const sd = Math.sqrt(s.reduce((t, [, q]) => t + q.d * q.d, 0) / s.length), noise = Math.sqrt(s.reduce((t, [, q]) => t + (q.h / 1.96) ** 2, 0) / s.length);
  P(`Spread of the robot changes: ${pc(sd)} points (root mean square); the noise alone would give about ${pc(noise)}.`);
}
// ---- 5. the bookie ----
const MX = require('./matrix-data.json').arenas.open.pairs, lg = p => Math.log(p / (1 - p)), sgm = x => 1 / (1 + Math.exp(-x)), cl = (p, a, b) => Math.max(a, Math.min(b, p));
const book = (a, b) => { let p = MX[a + '|' + b] ? MX[a + '|' + b][0] / MX[a + '|' + b][1] : MX[b + '|' + a] ? 1 - MX[b + '|' + a][0] / MX[b + '|' + a][1] : null; if (p == null) return null; return cl(sgm(lg(cl(p, 0.04, 0.96))), 0.03, 0.97); };   // tabletop-2 pairP for robots as they come, open floor, counterTrust 1
const lvl = (a, b) => sgm(0.62 * (lv(a) - lv(b)));   // the strength model alone (repair.js: LEVEL 0.62)
P('\n### The bookie: today\'s odds against each variant\'s results (all fights; lower Brier is better)\n\n| Odds | Results | Brier | favourite wins | mean odds of the favourite |\n|---|---|---|---|---|');
for (const [nm, f] of [['matchup table (game odds, robots as they come)', book], ['level only (strength model)', lvl]]) for (const v of V) {
  const X = recs.map(r => ({ p: f(r.a, r.b), w: get(r, v).aw })).filter(x => x.p != null), br = ms(X.map(x => (x.p - x.w) ** 2)), fav = X.filter(x => x.p !== 0.5), fw = ms(fav.map(x => (x.p > 0.5 ? x.w : 1 - x.w)));
  P(`| ${nm} | ${v === 'off' ? 'today' : NAMEV[v]} (${X.length}) | ${br.m.toFixed(3)} | ${pc(fw.m)}% ± ${pc(fw.h)} | ${pc(ms(fav.map(x => Math.max(x.p, 1 - x.p))).m)}% |`); }
for (const v of VAR) { const X = recs.map(r => { const p = book(r.a, r.b); return p == null ? null : (p - get(r, v).aw) ** 2 - (p - get(r, 'off').aw) ** 2; }).filter(x => x != null), d = ms(X); P(`\nBrier change, matchup table, ${NAMEV[v]}: ${d.m >= 0 ? '+' : ''}${d.m.toFixed(3)} ± ${d.h.toFixed(3)} (paired).`); }
// ---- 6. Buzzkill vs Whirlwind ----
if (bwFile) { const B = read(bwFile);
  P(`\n### Buzzkill vs Whirlwind (${B.length} fights a variant, both sides)\n\n| Variant | Buzzkill wins | Robot | bar bent 10°+ at some point | most bent arm, ° (mean / max) | bent at the end, ° (mean) | bar snapped |\n|---|---|---|---|---|---|---|`);
  for (const v of V) { const F = B.map(r => get(r, v)), bw = ms(F.map((x, i) => B[i].side ? x.aw : x.aw));
    for (const s of ['A', 'B']) { const nm = s === 'A' ? 'Buzzkill' : 'Whirlwind', k = F.map(x => x[s].kmax || 0), e = F.map(x => x[s].kink);
      P(`| ${s === 'A' ? (v === 'off' ? 'today (off)' : NAMEV[v]) : ''} | ${s === 'A' ? pc(bw.m) + '% ± ' + pc(bw.h) : ''} | ${nm} | ${k.filter(x => x >= 10).length} of ${F.length} | ${(k.reduce((a, b) => a + b, 0) / k.length).toFixed(0)} / ${Math.max(...k).toFixed(0)} | ${(e.reduce((a, b) => a + b, 0) / e.length).toFixed(0)} | ${F.filter(x => (x[s].cx.snap || 0) > 0).length} |`); } }
  P('\nPer fight, bend only (most bent arm during the fight, Buzzkill / Whirlwind, degrees): ' + B.map(r => { const x = get(r, 'bend'); return x ? `${Math.round(x.A.kmax)}/${Math.round(x.B.kmax)}` : ''; }).join(', '));
}
console.log(out.join('\n'));
