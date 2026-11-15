// Many click games in a row, added up (14 Nov). A mix (see click-game.js): half with watched fights (live cards clicked),
// half with card rain, a third long (nobody can win: the late game), two in five with trouble on the line (page reloads,
// slow connections); every screen its own size. At the end: the findings, and COVERAGE: what never happened in any game
// (cards never played by a joined seat, actions never clicked, no level 4 robot…), so we know what the batch did not test.
//   node tools/mp-scenario/click-many.js [games=8] [minutesEach=6] [firstSeed] [parallel] [outDir]
//     firstSeed: today's date by default (other games every night) · parallel: a quarter of the CPU cores (2 to 8); a game is
//     four browser tabs · outDir: playtests/click-runs/<date_time>. The summary is also written to summary.txt there and to
//     playtests/click-runs/latest-summary.txt. Windows: double-click tools\click-night.cmd (30 games of 15 minutes).
// Run it from the folder of the build to test (it plays prototypes/tabletop-2.html of the current folder).
// Prints every different finding once, with how many games showed it and the seeds, so a seed can be replayed alone:
//   WATCH=1 node tools/mp-scenario/click-game.js <seed> <minutes>
//   node tools/mp-scenario/click-many.js --sum <outDir>     adds an earlier batch up again
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const now = new Date(), p2 = n => String(n).padStart(2, '0'), stamp = now.getFullYear() + '-' + p2(now.getMonth() + 1) + '-' + p2(now.getDate()) + '_' + p2(now.getHours()) + p2(now.getMinutes());
const SUM = process.argv[2] === '--sum';
const N = +(process.argv[2] || 8) || 8, minutes = +(process.argv[3] || 6), first = +(process.argv[4] || 0) || ((now.getFullYear() % 100) * 10000 + (now.getMonth() + 1) * 100 + now.getDate()) * 100;
const par = +(process.argv[5] || 0) || Math.max(2, Math.min(8, Math.floor(require('os').cpus().length / 4))), out = SUM ? process.argv[3] : process.argv[6] || path.join('playtests', 'click-runs', stamp);
const lines = [], say = s => { console.log(s); lines.push(s); };
fs.mkdirSync(out, { recursive: true });
// how long it takes: a game stops as soon as someone wins, mostly well before its minutes are up. The estimate uses what a
// game took on this PC last time (playtests/click-runs/last-timing.json); the first time it can only give the longest it can take.
const TIMING = path.join('playtests', 'click-runs', 'last-timing.json');
let avgMin = null; try { avgMin = JSON.parse(fs.readFileSync(TIMING, 'utf8')).avgMinutes; } catch (e) {}
const hm = m => m >= 90 ? (m / 60).toFixed(1) + ' hours' : Math.max(1, Math.round(m)) + ' minutes', at = m => new Date(Date.now() + m * 60000).toTimeString().slice(0, 5);
if (!SUM) { const most = Math.ceil(N / par) * (minutes + 1), est = avgMin ? Math.min(most, Math.ceil(N / par) * (Math.min(minutes, avgMin) + 0.5) * 1.15) : null;
  console.log(N + ' click games of at most ' + minutes + ' minutes, ' + par + ' at a time, seeds ' + first + ' to ' + (first + N - 1) + '.');
  console.log(est ? 'About ' + hm(est) + ' (done around ' + at(est) + '): last time a game took ' + avgMin.toFixed(1) + ' minutes on this PC. At most ' + hm(most) + '.' : 'At most ' + hm(most) + ' (done by ' + at(most) + '), probably much sooner: a game stops as soon as someone wins.');
  console.log('Results: ' + out + '. A line appears for every game that ends, and a status line every minute.'); }
const game = path.join(__dirname, 'click-game.js'), jobs = Array.from({ length: N }, (_, k) => ({ seed: first + k, watch: k % 2 === 0, rain: process.env.RAIN === '1' || (process.env.RAIN !== '0' && k % 4 >= 2), long: k % 3 === 1, chaos: k % 5 >= 3 }));   // a mix: half watched, half with card rain, a third long (nobody can win), two in five with trouble on the line
const run = j => new Promise(res => {
  const json = path.join(out, 'run-' + j.seed + '.json'), log = fs.openSync(path.join(out, 'run-' + j.seed + '.txt'), 'w');
  try { fs.unlinkSync(json); } catch (e) {}
  const p = spawn(process.execPath, [game, String(j.seed), String(minutes), path.join(out, 'shots-' + j.seed)], { env: Object.assign({}, process.env, { JSON: json, WATCH: j.watch ? '1' : '0', RAIN: j.rain ? '1' : '0', LONG: j.long ? '1' : '0', CHAOS: j.chaos ? '1' : '0' }), stdio: ['ignore', log, log] });
  const kill = setTimeout(() => { try { p.kill('SIGKILL'); } catch (e) {} }, (minutes + 3) * 60000);
  p.on('exit', () => { clearTimeout(kill); let r = null; try { r = JSON.parse(fs.readFileSync(json, 'utf8')); } catch (e) {} console.log('seed ' + j.seed + (j.watch ? ' (watched fights)' : '') + (j.rain ? ' (card rain)' : '') + (j.long ? ' (long)' : '') + (j.chaos ? ' (chaos)' : '') + ': ' + (r ? (r.over ? 'finished' : 'played') + ' ' + r.round + ' rounds, ' + (r.notes.length + r.stuck.length + r.errors.length + r.warns.length) + ' findings' : 'NO RESULT (the run crashed or hung: see run-' + j.seed + '.txt)')); res({ j, r }); });
});
(async () => {
  const stopAwake = SUM ? () => {} : require('./awake.js')();   // Windows: no sleep while the batch runs
  const results = []; let next = 0; const t00 = Date.now(), running = new Set();
  const beat = SUM ? null : setInterval(() => { const done = results.length, fnd = results.reduce((a, x) => a + (x.r ? x.r.notes.length + x.r.stuck.length + x.r.errors.length + x.r.warns.length : 1), 0), el = (Date.now() - t00) / 60000, left = done ? el / done * (N - done) : null;
    console.log('  ' + new Date().toTimeString().slice(0, 5) + ' · ' + done + ' of ' + N + ' games done · playing seeds ' + [...running].join(', ') + ' · findings so far: ' + fnd + (left != null ? ' · about ' + hm(left) + ' to go' : '')); }, 60000);
  if (SUM) { const dir = out; for (const f of fs.readdirSync(dir)) { const m = /^run-(\d+)\.json$/.exec(f); if (m) results.push({ j: { seed: +m[1] }, r: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) }); } }
  else await Promise.all(Array.from({ length: par }, async () => { while (next < jobs.length) { const j = jobs[next++]; running.add(j.seed); const x = await run(j); running.delete(j.seed); results.push(x); } }));
  if (beat) clearInterval(beat);
  stopAwake();
  const found = {}, add = (kind, text, seed) => { const k = kind + ' · ' + text.replace(/\d+/g, '#'); (found[k] = found[k] || { kind, text, seeds: [] }).seeds.push(seed); };
  let rounds = 0, hung = [];
  for (const { j, r } of results) {
    if (!r) { hung.push(j.seed); continue; }
    rounds += r.round;
    for (const x of r.notes) add(x.kind, x.text, j.seed);
    for (const x of r.stuck) add('stuck', x.kind + ' seat' + (x.size ? ' (' + x.size + ' screen)' : '') + ' · ' + x.label.replace(/ (Thumper|[A-Z][a-z]+)$/, ' <robot>') + ' · could click: ' + (x.canClick.slice(0, 6).join(', ') || 'nothing'), j.seed);
    for (const x of r.errors) add('page error', String(x).replace(/^(host|P\d): /, '').slice(0, 200), j.seed);
    for (const x of r.warns) add('fight mismatch', String(x).replace(/^(host|P\d): /, '').replace(/[0-9a-f:]{6,}/g, '#').slice(0, 80), j.seed);
    for (const x of r.clientTrouble || []) add('joined screen reported', String(x).replace(/seat \d/, 'seat #').slice(0, 160), j.seed);
    r.fame.clients.forEach(c => { if (JSON.stringify(c.fame) !== JSON.stringify(r.fame.host)) add('end', 'a joined screen ends on other fame than the host', j.seed); if (c.desyncs) add('fight mismatch', 'a joined screen counted fights that ended differently', j.seed); });
  }
  // host against joined, all games together: a step or a result the host seat gets and the joined seats never do (or the
  // other way round). One host seat and three joined seats play each game, so "never" for joined is a strong sign.
  const steps = {}, outc = {};
  const normLabel = l => l.replace(/\b(Host|P\d?)\b/g, 'X').replace(/^(deal panel: (?:Plead to spare|Push to scrap|Payoff from|Trade with|Ask X for backing|Buy off|Ask to be)).*/, '$1').replace(/\s+/g, ' ').trim();
  for (const { r } of results) { if (!r) continue;
    for (const k of Object.keys(r.stat)) { const [label, kind] = k.split(' | '), n = normLabel(label); steps[n] = steps[n] || { host: 0, joined: 0 }; steps[n][kind] += r.stat[k].ok + r.stat[k].stuck; }
    for (const k of Object.keys(r.outcomes || {})) { outc[k] = outc[k] || { host: 0, joined: 0 }; outc[k].host += r.outcomes[k].host; outc[k].joined += r.outcomes[k].joined; } }
  const lop = [];
  for (const k of Object.keys(steps).sort()) { const v = steps[k]; if (k === 'draft' || k === 'sponsor') continue; /* the opening picks: the test bots do most of them before the clicking starts */  if (v.host >= 2 && v.joined === 0) lop.push('only the HOST seat ever got: ' + k + ' (' + v.host + '×)'); if (v.joined >= 12 && v.host === 0) lop.push('only JOINED seats ever got: ' + k + ' (' + v.joined + '×)'); }
  for (const k of Object.keys(outc).sort()) { const v = outc[k]; if (v.host >= 2 && v.joined === 0) lop.push('only the HOST seat ever managed: ' + k + ' (' + v.host + '×, joined 0×)'); }
  { const a = outc['backing asked'], g = outc['backing got']; if (a && a.joined >= 4 && (!g || g.joined === 0) && g && g.host > 0) lop.push('joined seats asked for backing ' + a.joined + '× and never got it; the host got it ' + g.host + '× of ' + a.host); }
  for (const x of [...new Set(lop)]) add('host ≠ joined', x, 'all');
  const list = Object.values(found).sort((a, b) => b.seeds.length - a.seeds.length);
  say('\n=== ' + results.length + ' click games, ' + rounds + ' rounds played' + (SUM ? '' : ' in ' + hm((Date.now() - t00) / 60000)) + ' ===');
  if (!SUM) { const ok = results.filter(x => x.r); if (ok.length) try { fs.mkdirSync(path.dirname(TIMING), { recursive: true }); fs.writeFileSync(TIMING, JSON.stringify({ avgMinutes: ok.reduce((a, x) => a + x.r.minutes, 0) / ok.length, games: ok.length, parallel: par, when: new Date().toISOString() })); } catch (e) {} }
  if (hung.length) say('No result (crashed or hung): seeds ' + hung.join(', '));
  if (Object.keys(outc).length) { say('what came of it (host seat · the 3 joined seats together):'); for (const k of Object.keys(outc).sort()) say('  ' + k.padEnd(40) + String(outc[k].host).padStart(5) + ' ·' + String(outc[k].joined).padStart(5)); }
  if (!list.length) say('No findings.');
  for (const f of list) say(String(f.seeds.length).padStart(3) + '× ' + f.kind + ' · ' + f.text + '   [seeds ' + [...new Set(f.seeds)].slice(0, 6).join(', ') + ']');
  // ---- coverage: what did all these games together never do?
  { const cards = {}, acts = {}, live = {}, logc = {}; let names = {}, n = 0, l4 = 0, leg = 0, r3 = 0, reloads = 0;
    for (const { r } of results) { if (!r || !r.cover) continue; n++; names = Object.assign(names, r.cover.names); if (r.cover.maxLevel >= 4) l4++; if (r.cover.legend) leg++; if (r.cover.robots3) r3++; reloads += r.reloads || 0;
      for (const [src, dst] of [[r.cover.cards, cards], [r.cover.acts, acts], [r.cover.live, live], [r.cover.log || {}, logc]]) for (const k of Object.keys(src)) { dst[k] = dst[k] || { host: 0, joined: 0 }; dst[k].host += src[k].host; dst[k].joined += src[k].joined; } }
    if (n) {
      let allActs = []; try { allActs = [...new Set((fs.readFileSync(path.join('prototypes', 'tabletop-2.html'), 'utf8').match(/\bACT\.(\w+) = /g) || []).map(x => x.slice(4, -3)))]; } catch (e) {}
      const nm = k => names[k] || k, ids = Object.keys(names), by = (k, who) => (cards[k] ? cards[k][who] : 0) + (live[k] ? live[k][who] : 0) + (logc[k] ? logc[k][who] : 0), played = k => by(k, 'host') + by(k, 'joined');
      const RETIRED = { crate: 'retired', skipFight: 'host only, by design' };
      const never = ids.filter(k => !played(k)), noJoined = ids.filter(k => played(k) && !by(k, 'joined')), noHost = ids.filter(k => played(k) && !by(k, 'host'));
      say('\nCOVERAGE over ' + n + ' games:');
      say('  cards played at least once: ' + (ids.length - never.length) + ' of ' + ids.length + (never.length ? ' · NEVER played: ' + never.map(nm).join(', ') : ''));
      if (noJoined.length) say('  played, but never by a joined seat: ' + noJoined.map(nm).join(', '));
      if (noHost.length) say('  played, but never by the host seat (one seat in four, so less telling): ' + noHost.map(nm).join(', '));
      if (allActs.length) { const nA = allActs.filter(a => !acts[a] && !RETIRED[a]), nJ = allActs.filter(a => acts[a] && !acts[a].joined); say('  actions clicked at least once: ' + (allActs.length - nA.length) + ' of ' + allActs.length + (nA.length ? ' · NEVER: ' + nA.join(', ') : '') + (nJ.length ? ' · never by a joined seat: ' + nJ.join(', ') : '')); }
      say('  late game: ' + l4 + ' games reached a level 4 robot, ' + leg + ' a legendary part, ' + r3 + ' a full garage (3 robots)' + (reloads ? ' · ' + reloads + ' page reloads survived or reported' : ''));
    } }
  { const seeds = [...new Set(list.flatMap(f => f.seeds).filter(x => typeof x === 'number'))].sort((a, b) => a - b).slice(0, 12);
    if (seeds.length) { say('\nReplay a game that showed something (its text and screenshots are in ' + out + '):'); for (const sd of seeds) { const j = (results.find(x => x.j.seed === sd) || {}).j || {}; say('  node tools/mp-scenario/click-game.js ' + sd + ' ' + minutes + (j.watch ? ' --watch' : '') + (j.rain ? ' --rain' : '') + (j.long ? ' --long' : '') + (j.chaos ? ' --chaos' : ''));  } } }
  try { fs.writeFileSync(path.join(out, 'summary.txt'), lines.join('\n') + '\n'); fs.mkdirSync(path.join('playtests', 'click-runs'), { recursive: true }); fs.writeFileSync(path.join('playtests', 'click-runs', 'latest-summary.txt'), 'Batch ' + out + ', build of ' + new Date().toISOString().slice(0, 16) + '\n' + lines.join('\n') + '\n'); } catch (e) {}
  fs.writeFileSync(path.join(out, 'summary.json'), JSON.stringify({ games: results.length, rounds, hung, findings: list }, null, 1));
  process.exit(list.length || hung.length ? 1 : 0);
})();
