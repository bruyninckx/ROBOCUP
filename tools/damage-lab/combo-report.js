// T58: the combo hunt's report (plain English) and its compact results, from the analysis the hunt writes.
//   node tools/damage-lab/combo-report.js combo-results/analysis.json      (rewrites report.md and combo-results.json next to it)
// combo-hunt.js calls render() itself at the end; this file only reads, it fights nothing.
'use strict';
const fs = require('fs'), path = require('path');
const LU = require('./lineup.js'), ALL = Object.assign({}, LU.ROBOTS, LU.ROBOTS4), lv = n => ALL[n][0];
const PN = k => { const [b, t] = k.split('@'); const RN = ['', 'Tuned ', 'Race-spec ', 'Works ', 'Masterwork ']; return (t ? RN[+t] : '') + (LU.PARTS[b] ? LU.PARTS[b].name : b); };
const BN = b => b ? b.split(',').map(PN).join(' + ') : 'nothing';
const P = x => Math.round(100 * x), S = x => (x >= 0 ? '+' : '') + P(x);
const rng = s => `${S(s.m)} (${S(s.lo)} to ${S(s.hi)})`;
const pct = s => `${P(s.m)}%`;

function render(A) {
  const out = [], o = s => out.push(s), C = A.meta.cfg || {}, res = { meta: {}, partAvg: {}, fits: {}, epic: {}, triple: {}, builds: {}, synergy: [], tiers: [], single: {} };
  const kv = Object.entries(A.v || {}).sort((a, b) => a[0] < b[0] ? -1 : 1);
  o('# ROBOCUS combo hunt: report');
  o('');
  o(`${A.meta.fights} fights, ${A.meta.robots.length} robots (${A.meta.robots.length === 33 ? 'the whole lineup' : A.meta.robots.join(', ')}), every part card, wear on, open floor. ` +
    `Depth ${A.meta.depth} of 8 (${A.meta.hours} h asked). Speed ${A.meta.rate || '?'} fights a second on ${A.meta.workers} workers (${A.meta.cores} logical processors). Engine ${A.meta.fp}${A.meta.rev ? ', branch at ' + A.meta.rev : ''}.`);
  o('');
  o('How to read it: "gain" is points of win % against robots a level up (level 4: its own level), with and without the part on the same seeds; the range in brackets is 95%. ' +
    '"Over avg" is the gain minus what the part gives an average robot (the old epic rule). Everything listed as found held on two separate sets of fresh seeds (sorting and verify); the numbers shown are the verify fights only, so they are not inflated by the picking.');
  o('');
  // ---------- part averages
  o('## 1. What each part gives an average robot (screen, vs robots a level up)');
  o('');
  const pa = Object.entries(A.pa).sort((a, b) => b[1] - a[1]);
  o(pa.map(([k, x]) => `${PN(k)} ${S(x)}`).join(' · '));
  for (const [k, x] of pa) res.partAvg[k] = P(x);
  o('');
  // ---------- epics
  const old = A.old || { fit: {}, epic: {}, triple: {} };
  const row = (id, x) => { const [n, k] = id.split('|'); return `| ${n} + ${PN(k)} | ${P(x.v.wo)}% → ${P(x.v.w)}% | ${rng(x.v)} | ${S(x.x)} | ${P(x.all.wo)}% → ${P(x.all.w)}% (${x.all.n}) |`; };
  const hdr = () => { o('| Robot + part | Verify: without → with | Gain (95%) | Over avg | All fights: without → with (fights) |'); o('|---|---|---|---|---|'); };
  o('## 2. Epic combos (gain 30+ and 20+ over the part\'s average, on both seed sets)');
  o('');
  const ep = kv.filter(([, x]) => x.final === 'epic'), epNew = ep.filter(([id]) => !old.epic[id]);
  if (ep.length) { hdr(); for (const [id, x] of ep.sort((a, b) => b[1].v.m - a[1].v.m)) o(row(id, x) + (old.epic[id] ? ` (in the game: ${old.epic[id][0]})` : ' **new**')); } else o('None found.');
  o('');
  for (const [id, x] of ep) res.epic[id] = [old.epic[id] ? old.epic[id][0] : 'NEW ' + id.replace('|', ' + '), P(x.all.wo), P(x.all.w), x.all.n];
  o(`New: ${epNew.length ? epNew.map(([id]) => id.replace('|', ' + ')).join(', ') : 'none'}.`);
  o('');
  o('### The game\'s epics today');
  o('');
  o('| Epic | In the game | Now (verify) | Verdict |'); o('|---|---|---|---|');
  for (const [id, e] of Object.entries(old.epic)) { const x = A.v[id]; o(`| ${e[0]} (${id.replace('|', ' + ')}) | ${e[1]}% → ${e[2]}% | ${x ? `${P(x.v.wo)}% → ${P(x.v.w)}%, gain ${rng(x.v)}` : 'not tested (robot not in this run)'} | ${!x ? '-' : x.final === 'epic' ? 'holds' : x.final === 'great' ? 'only a great fit now' : x.borderline ? 'borderline (passed once)' : 'gone'} |`); }
  o('');
  // ---------- fits
  o('## 3. Great and poor fits');
  o('');
  const gr = kv.filter(([, x]) => x.final === 'great' || x.final === 'epic'), po = kv.filter(([, x]) => x.final === 'poor');
  o('### Great fits (15+ over the part\'s average)'); o('');
  if (gr.length) { hdr(); for (const [id, x] of gr.sort((a, b) => b[1].x - a[1].x)) { const [n, k] = id.split('|'); o(row(id, x) + (old.fit[n] && old.fit[n][k] ? '' : ' **new**')); } } else o('None found.');
  o(''); o('### Poor fits (15+ below the part\'s average)'); o('');
  if (po.length) { hdr(); for (const [id, x] of po.sort((a, b) => a[1].x - b[1].x)) { const [n, k] = id.split('|'); o(row(id, x) + (old.fit[n] && old.fit[n][k] ? '' : ' **new**')); } } else o('None found.');
  for (const [id, x] of gr.concat(po)) { const [n, k] = id.split('|'); (res.fits[n] = res.fits[n] || {})[k] = [x.final === 'poor' ? -1 : 1, P(x.all.m)]; }
  o('');
  o('### The game\'s fits today that did not hold'); o('');
  const gone = []; for (const [n, ks] of Object.entries(old.fit)) for (const [k, f] of Object.entries(ks)) { const x = A.v[n + '|' + k]; if (!x) continue; if ((f[0] > 0 && !(x.final === 'great' || x.final === 'epic')) || (f[0] < 0 && x.final !== 'poor')) gone.push(`${n} + ${PN(k)} (${f[0] > 0 ? 'great' : 'poor'} fit, ${S(f[1] / 100)} in the game; now gain ${rng(x.v)}, ${S(x.x)} over avg${x.borderline ? ', borderline' : ''})`); }
  o(gone.length ? gone.map(s => '- ' + s).join('\n') : 'All hold (of the ones whose robot was in this run).');
  o('');
  const bl = kv.filter(([, x]) => x.borderline);
  o('### Borderline (passed the rule on one seed set, not the other)'); o('');
  o(bl.length ? bl.map(([id, x]) => `- ${id.replace('|', ' + ')}: sorting ${x.cat2 || 'average'}, verify ${x.catV || 'average'} (verify gain ${rng(x.v)}, ${S(x.x)} over avg)`).join('\n') : 'None.');
  o('');
  // ---------- synergy
  o('## 4. Synergy: two parts together vs each alone');
  o('');
  o('Synergy = gain of the pair minus the two single gains (points; the 95% range is per fight, pair, each half and bare on the same seeds). Win % adds up badly near 0 and 100, so the logit column says the same thing on a scale where independent parts add up (0 = no synergy).');
  o('');
  if (A.syn && A.syn.length) { o('| Robot | Pair | Bare | Part A alone | Part B alone | Pair | Synergy (95%) | Logit | Verdict |'); o('|---|---|---|---|---|---|---|---|---|');
    for (const s of A.syn.slice().sort((a, b) => b.syn.m - a.syn.m)) { const v = s.syn.lo > 0 ? '**real synergy**' : s.syn.hi < 0 ? '**they get in each other\'s way**' : 'noise';
      o(`| ${s.n} | ${BN(s.b)} | ${P(s.w0)}% | ${P(s.wa)}% | ${P(s.wc)}% | ${P(s.w)}% | ${rng(s.syn)} | ${s.synL >= 0 ? '+' : ''}${s.synL.toFixed(2)} | ${v} |`);
      res.synergy.push({ n: s.n, b: s.b, bare: P(s.w0), a: P(s.wa), c: P(s.wc), pair: P(s.w), syn: P(s.syn.m), lo: P(s.syn.lo), hi: P(s.syn.hi), logit: s.synL, fights: s.n2, verdict: v.replace(/\*/g, '') }); } }
  else o('Not reached.');
  o('');
  // ---------- builds
  o('## 5. The best full build per robot (2 parts + a legendary)');
  o('');
  o('Picked by successive halving against robots a level and two levels up, then fought again on fresh seeds. "Kitted" = the opponent carries its own best build from this run' +
    (A.meta.robots.length < 33 ? ' (robots outside this run: Weapon overhaul + Reinforced hull + Prototype core, the old test kit)' : '') + '.');
  o('');
  o('| Lv | Robot | Best build | Builds tried | vs a level up: as it comes → built (kitted rival) | vs two levels up: as it comes → built (kitted) | vs level 3-4 (level 0-2 only) |'); o('|---|---|---|---|---|---|---|');
  const cell = g => g ? `${pct(g.asIs)} → **${pct(g.bare)}** (${pct(g.kit)}) [${g.bare.n}]` : '-';
  for (const n of A.meta.robots.slice().sort((a, b) => lv(a) - lv(b) || (a < b ? -1 : 1))) { const bv = (A.bv[n] || []);
    for (const x of bv) { o(`| ${lv(n)} | ${n} | ${BN(x.b)}${x.old ? ' (the game\'s giant-slayer build)' : ''} | ${x.old ? '-' : (A.builds[n] || { tried: [] }).tried.length} | ${cell(x.up1)} | ${cell(x.up2)} | ${cell(x.l34)} |`);
      if (!x.old) res.builds[n] = { b: x.b, parts: x.b.split(','), up1: x.up1 && [P(x.up1.asIs.m), P(x.up1.bare.m), P(x.up1.kit.m), x.up1.bare.n], up2: x.up2 && [P(x.up2.asIs.m), P(x.up2.bare.m), P(x.up2.kit.m), x.up2.bare.n], l34: x.l34 && [P(x.l34.asIs.m), P(x.l34.bare.m), P(x.l34.kit.m), x.l34.bare.n] }; } }
  o('');
  o('### Giant slayers (level 0-2 robots whose best build beats level 3-4 robots: the game\'s rule is 80%+ against bare ones)');
  o('');
  const gs = [];
  for (const n of A.meta.robots) for (const x of (A.bv[n] || [])) if (x.l34) gs.push([n, x]);
  gs.sort((a, b) => b[1].l34.bare.m - a[1].l34.bare.m);
  o(gs.length ? gs.map(([n, x]) => `- ${n} + ${BN(x.b)}: ${pct(x.l34.asIs)} → ${pct(x.l34.bare)} vs bare level 3-4 (${P(x.l34.bare.lo)}-${P(x.l34.bare.hi)}%), ${pct(x.l34.kit)} vs kitted ones, ${x.l34.bare.n} fights each${x.l34.bare.m >= 0.8 ? ' **giant-slayer**' : ''}${x.old ? ' (in the game today)' : ''}`).join('\n') : 'No level 0-2 robots in this run.');
  for (const [n, x] of gs) if (x.l34.bare.m >= 0.8 && !x.old) res.triple[n] = [x.b.split(','), P(x.l34.asIs.m), P(x.l34.bare.m), P(x.l34.kit.m), x.l34.bare.n];
  for (const [n, x] of gs) if (x.old) res.meta['oldTriple_' + n] = [x.b.split(','), P(x.l34.asIs.m), P(x.l34.bare.m), P(x.l34.kit.m), x.l34.bare.n];
  o('');
  const two = []; for (const n of A.meta.robots) for (const x of (A.bv[n] || [])) if (x.up2 && x.up2.kit.m >= 0.5) two.push(`${n} + ${BN(x.b)} beats robots two levels up even when they are kitted: ${pct(x.up2.kit)} (${x.up2.kit.n} fights)`);
  o('Builds that beat **kitted** robots two levels up: ' + (two.length ? '\n' + two.map(s => '- ' + s).join('\n') : 'none.'));
  o('');
  // ---------- tiers
  o('## 6. Rarity tiers on the promising combos');
  o('');
  if (A.tiers && A.tiers.length) { const tiers = Object.keys(A.tiers[0].t);
    const avg = {}; for (const t of tiers) avg[t] = A.tiers.reduce((a, x) => a + x.t[t].over.m, 0) / A.tiers.length;
    o('Extra win points of a better copy over a standard copy, on the same seeds. Average over these combos: ' + tiers.map(t => `${PN('x@' + t).replace(' x', '')}: ${S(avg[t])}`).join(', ') + '. Stand-outs are 15+ points away from that average.');
    o('');
    o('| Robot + part | Standard: gain | ' + tiers.map(t => PN('x@' + t).replace(' x', '') + ': win, extra over standard').join(' | ') + ' |'); o('|---|---|' + tiers.map(() => '---|').join(''));
    for (const x of A.tiers) { const [n, k] = x.id.split('|');
      o(`| ${n} + ${PN(k)} | ${pct({ m: x.std.w })} (${S(x.std.m)}) | ` + tiers.map(t => { const y = x.t[t].over, d = y.m - avg[t]; return `${pct({ m: x.t[t].gain.w })}, ${rng(y)}${Math.abs(d) >= 0.15 ? (d > 0 ? ' **stand-out**' : ' **flat**') : ''}`; }).join(' | ') + ' |');
      res.tiers.push({ id: x.id, std: [P(x.std.wo), P(x.std.w), x.std.n], t: Object.fromEntries(tiers.map(t => [t, [P(x.t[t].gain.w), P(x.t[t].over.m), P(x.t[t].over.lo), P(x.t[t].over.hi)]])) }); }
  } else o('Not reached.');
  o('');
  // ---------- broken-looking
  o('## 7. Anything that looks broken (95%+ against robots a level up)');
  o('');
  const br = [];
  for (const [id, x] of kv) if (x.v.w >= 0.95 && x.v.n >= 16) br.push(`${id.replace('|', ' + ')}: ${pct({ m: x.v.w })} (${x.v.n} fights)`);
  for (const n of A.meta.robots) for (const x of (A.bv[n] || [])) if (x.up1 && x.up1.bare.m >= 0.95) br.push(`${n} + ${BN(x.b)}: ${pct(x.up1.bare)} vs bare robots a level up (${x.up1.bare.n} fights)`);
  for (const x of (A.tiers || [])) for (const t in x.t) if (x.t[t].gain.w >= 0.95) br.push(`${x.id.split('|')[0]} + ${PN(x.id.split('|')[1] + '@' + t)}: ${pct({ m: x.t[t].gain.w })} (${x.t[t].gain.n} fights)`);
  o(br.length ? br.map(s => '- ' + s).join('\n') : 'Nothing.');
  o('');
  // ---------- rules
  o('## 8. Do the old rules still fit?');
  o('');
  const nC = (A.cand || []).length, nCl = Object.values(A.s2 || {}).filter(x => x.why === 'clearly average').length;
  o(`- Screen: ${Object.keys(A.s1).length} robot + part combos; ${nC} went on to the sorting stage (${(A.forced || []).length} of them because the game lists them today), ${nCl} were dropped there early as clearly average.`);
  o(`- Found: ${ep.length} epic, ${gr.length - ep.length} great (not epic), ${po.length} poor; ${bl.length} borderline. In the game today: ${Object.keys(old.epic).length} epics, ${Object.values(old.fit).reduce((a, x) => a + Object.keys(x).length, 0)} fits.`);
  const spread = pa.length ? pa[0][1] - pa[pa.length - 1][1] : 0;
  o(`- The part averages spread ${P(spread)} points (best ${PN(pa[0] ? pa[0][0] : '')} ${S(pa[0] ? pa[0][1] : 0)}, weakest ${PN(pa.length ? pa[pa.length - 1][0] : '')} ${S(pa.length ? pa[pa.length - 1][1] : 0)}). ` +
    'The epic rule asks for 30+ points of gain: on a robot that already wins 70%+ that is impossible, so strong robots can only get great fits. That was true before too; the rule is kept as it was so old and new compare.');
  o('');
  res.meta = Object.assign(res.meta, { fights: A.meta.fights, robots: A.meta.robots, depth: A.meta.depth, fp: A.meta.fp, rev: A.meta.rev, rule: A.meta.rule });
  for (const [id, x] of Object.entries(A.s1)) res.single[id] = [P(x.up.wo), P(x.up.w), P(x.up.m), P(x.x), x.up.n];
  return { md: out.join('\n'), results: res };
}
module.exports = { render };
if (require.main === module) { const f = process.argv[2] || 'combo-results/analysis.json', A = JSON.parse(fs.readFileSync(f, 'utf8')), { md, results } = render(A), d = path.dirname(f);
  fs.writeFileSync(path.join(d, 'report.md'), md); fs.writeFileSync(path.join(d, 'combo-results.json'), JSON.stringify(results, null, 1)); console.log('wrote', path.join(d, 'report.md')); }
