// T62 (22 Nov 2026): re-run the bookie's test fights from a playtest log, headless, and print the count next to the logged one.
//   node tools/bookie-replay.js <log.json> [round] [--n=200] [--nopk]
// Needs `bookie` events from build 2026-11-22h or later (they carry rb, seed0, per). Each fight is built as the page's
// buildFight(F, seed, false) builds it (spec2: Lineup.build(name, parts, tiers) + level + wear; copies for a mirror, the House
// Robot, the Cage rule, countdown 0) and run with the bookie's own seeds. Per seed it compares the winner and the fight's seconds
// with what the host's helpers logged. --n runs more seeds than the bookie did (to see where its count sits); --nopk runs with the
// engine's default part dials (how the helpers fought before 2026-11-22h: docs/robocus-sim-bookie.md, T62).
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const DL = require(path.join(ROOT, 'src2/engine.js')), LU = require(path.join(ROOT, 'src2/lineup.js'));
const argv = process.argv.slice(2), opt = k => { const a = argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : null; };
const pos = argv.filter(x => !x.startsWith('--'));
const MAIN = require.main === module;
if (MAIN && !pos[0]) { console.log('usage: node tools/bookie-replay.js <log.json> [round] [--n=200] [--nopk]'); process.exit(1); }
LU.usePK();   // as the page
if (MAIN && argv.includes('--nopk')) for (const k in DL.ARC.pk) delete DL.ARC.pk[k];
const clone = o => JSON.parse(JSON.stringify(o));
const HOUSE = 'House Robot';

function buildBB(ev) {
  LU.levelBoost = ev.lb || 0;
  const copies = ev.fmt === 'mirror' ? 2 : 1, list = [], botEnt = [];
  ev.rb.forEach((r, e) => {
    if (!r) return;
    const sp = Object.assign(LU.build(r.nm, r.p || [], r.rar || null), { name: r.nm, level: r.lv, teamName: '' });
    if (r.w) sp.wear = clone(r.w);
    for (let c = 0; c < copies; c++) { list.push(Object.assign(clone(sp), { team: r.s })); botEnt.push(e); }
  });
  if (ev.house && list.length < 4) { list.push(Object.assign(LU.build(HOUSE), { name: HOUSE, level: 0, teamName: 'House', team: 9 })); botEnt.push(-1); }
  const twoSides = !list.some(x => x.team === 9) && new Set(list.map(x => x.team)).size === 2;
  let arena = ev.arena && DL.ARENAS[ev.arena] ? ev.arena : 'open';
  if (arena === 'cage' && list.length > 2) arena = 'open';
  const wear = ev.wear !== false;
  const bb = list.length === 2 ? { a: list[0], b: list[1], countdown: 0, arena, wear } : { mode: twoSides ? '2v2' : 'ffa', robots: list, countdown: 0, arena, wear };
  return { bb, botEnt };
}
function side(ev, botEnt, S) {
  const x = S.result; if (!x) return '-';
  if (S.multi && S.mode === '2v2') return x.winTeam === 9 ? 'h' : String(x.winTeam);
  const e = botEnt[x.winner]; return e == null || e < 0 ? 'h' : String(ev.rb[e].s);
}
function replay(ev) {
  const { bb, botEnt } = buildBB(ev);
  const logged = (ev.per || '').split(' ').filter(Boolean).map(x => { const [s, t] = x.split(':'); return { s, t: t === '' ? null : +t }; });
  const N = Math.max(+(opt('n') || 0), logged.length);
  let sd = ev.seed0 >>> 0; const wins = {}, winsK = {}; let same = 0, diff = [], t0 = Date.now();
  for (let i = 0; i < N; i++) {
    sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0;
    const S = DL.create(Object.assign(clone(bb), { seed: sd })); let g = 0; while (!S.over && g++ < 48000) { DL.step(S); S.fx.length = 0; }
    const s = side(ev, botEnt, S), t = Math.round(S.t * 10) / 10;
    wins[s] = (wins[s] || 0) + 1; if (i < logged.length) { winsK[s] = (winsK[s] || 0) + 1; const L = logged[i]; if (L.s === s && (L.t == null || Math.abs(L.t - t) < 0.06)) same++; else diff.push(i + ' (seed ' + sd + '): logged ' + L.s + ' at ' + L.t + ' s, here ' + s + ' at ' + t + ' s'); }
    if ((i + 1) % 25 === 0) process.stderr.write('  ' + (i + 1) + '/' + N + '\r');
  }
  const pct = (w, n) => n ? Math.round(1000 * w / n) / 10 + '%' : '-';
  const sides = [...new Set(Object.keys(ev.wins || {}).concat(Object.keys(wins)))].sort();
  console.log(`round ${ev.r}: ${ev.fmt} on ${ev.arena}${ev.house ? ' + House Robot' : ''}: ` + ev.rb.filter(Boolean).map(r => `side ${r.s} ${r.nm} L${r.lv}${(r.p || []).length ? ' (' + r.p.map(k => k + (r.rar && r.rar[k] ? '~' + r.rar[k] : '')).join(', ') + ')' : ''}${r.w ? ' worn' : ''}`).join(' vs '));
  console.log(`  bookie on the host: ${ev.n} fights (${ev.how}, ${ev.ms} ms, sent ${ev.sent}, ${ev.late || 0} late and not counted): ` + sides.map(s => `side ${s} ${(ev.wins || {})[s] || 0} (${pct((ev.wins || {})[s] || 0, ev.n)})`).join(', ') + `; odds ${JSON.stringify(ev.odds)} (formula ${JSON.stringify(ev.formula)})`);
  if (logged.length) console.log(`  replayed, same ${logged.length} seeds: ` + sides.map(s => `side ${s} ${winsK[s] || 0} (${pct(winsK[s] || 0, logged.length)})`).join(', ') + `; same winner and time on ${same} of ${logged.length}`);
  if (N > logged.length) console.log(`  replayed, first ${N} seeds: ` + sides.map(s => `side ${s} ${wins[s] || 0} (${pct(wins[s] || 0, N)})`).join(', '));
  for (const d of diff.slice(0, 5)) console.log('    differs: ' + d);
  if (diff.length > 5) console.log('    ... ' + (diff.length - 5) + ' more differ');
  console.log(`  (${((Date.now() - t0) / 1000).toFixed(1)} s here)`);
  return { same, n: logged.length, diff: diff.length };
}
module.exports = { buildBB, side };
if (MAIN) {
const L = JSON.parse(fs.readFileSync(pos[0], 'utf8')), round = pos[1] != null ? +pos[1] : null;
const evs = (L.events || []).filter(e => e.k === 'bookie' && (round == null || e.r === round));
if (!evs.length) { console.log('no bookie event' + (round != null ? ' in round ' + round : '') + ' in this log'); process.exit(1); }
console.log(`${pos[0]}: build ${L.build || '?'}` + (argv.includes('--nopk') ? ' (engine default part dials: --nopk)' : ''));
let bad = 0;
for (const ev of evs) {
  if (!ev.rb || ev.seed0 == null) { console.log(`round ${ev.r}: logged ${ev.n} fights, wins ${JSON.stringify(ev.wins)}: no replay data in this event (build before 2026-11-22h)`); continue; }
  if (!ev.n) { console.log(`round ${ev.r}: the bookie ran no fights (${ev.how})`); continue; }
  const r = replay(ev); if (r.diff) bad++;
}
process.exitCode = bad ? 2 : 0;
}
