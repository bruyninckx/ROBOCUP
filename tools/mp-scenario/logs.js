// All four logs in one file, and "report a problem" (15 Nov).
//   1. every joined screen's playtest log reaches the host while the game runs (PT.screens: one log per joined seat);
//   2. a joined player presses 🐞 report, types a line and sends it: the host's log gets the report with the whole table,
//      every screen's log gets a mark at that moment with what that screen shows, and the marks reach the host's file too.
//   node tools/mp-scenario/logs.js [seed]
const { setup, press } = require('./lib.js');
(async () => {
  const { b, host, errs, seatOf } = await setup(+process.argv[2] || 7, () => { const G = window.ROBOCUS_GAME && window.ROBOCUS_GAME.G; return !!(G && G.phase === 'intrigue' && G.round >= 1 && G.intrigueTurn >= 0 && !G.ivBusy); });
  const bad = [], TEXT = 'my repair button does nothing (test ' + Date.now() % 1000 + ')';
  const screens = () => host.evaluate(() => (window.ROBOCUS_DEBUG.PT.screens || []).map(x => ({ seat: x.seat, name: x.name, n: x.events.length, gaps: x.events.filter(e => e.k === 'gap').length, marks: x.events.filter(e => e.k === 'report_mark').map(e => ({ n: e.n, text: e.text, phase: e.screen && e.screen.phase, prompt: e.screen && (e.screen.prompt || '').slice(0, 40) })) })));
  await host.waitForTimeout(6000);
  const s1 = await screens();
  console.log('joined logs on the host after 6 s: ' + (s1.map(x => x.name + ' ' + x.n + ' events').join(' · ') || 'none'));
  if (s1.length !== 3 || s1.some(x => x.n < 20)) bad.push('the host does not hold all three joined logs');
  if (s1.some(x => x.gaps)) bad.push('a log has gaps');
  // a joined player reports a problem with the real button
  const P = seatOf[2];
  await P.evaluate(() => document.getElementById('bugBtn').click()); await P.waitForTimeout(300);
  await P.evaluate(t => { document.getElementById('ptRepTxt').value = t; }, TEXT);
  if (!(await press(P, 'ivModal', /Report/))) bad.push('no Report button on the joined screen');
  await host.waitForTimeout(1500);
  const rep = await host.evaluate(() => window.ROBOCUS_DEBUG.PT.game.events.filter(e => e.k === 'report').map(e => ({ n: e.n, seat: e.seat, name: e.name, text: e.text, teams: (e.teams || []).length, waitsFor: e.waitsFor })));
  console.log('host log: ' + JSON.stringify(rep));
  if (!(rep.length === 1 && rep[0].seat === 2 && rep[0].text === TEXT && rep[0].teams === 4)) bad.push('the report is not in the host\'s log with the table');
  for (let s = 0; s < 4; s++) { const line = await seatOf[s].evaluate(t => document.getElementById('ticker').textContent.includes(t), TEXT); if (!line) bad.push('seat ' + s + ' does not see the report in its log'); }
  for (let s = 1; s < 4; s++) { const m = await seatOf[s].evaluate(() => window.ROBOCUS_DEBUG.PT.game.events.filter(e => e.k === 'report_mark').length); if (m !== 1) bad.push('seat ' + s + ' has ' + m + ' marks in its own log'); }
  await host.waitForTimeout(5500);
  const s2 = await screens();
  console.log('marks in the host\'s copy of the joined logs: ' + s2.map(x => x.name + ' ' + JSON.stringify(x.marks)).join(' · '));
  if (s2.length !== 3 || s2.some(x => x.marks.length !== 1 || x.marks[0].text !== TEXT)) bad.push('the marks did not reach the host\'s file');
  const size = await host.evaluate(() => { const PT = window.ROBOCUS_DEBUG.PT; return { host: JSON.stringify(PT.game).length, all: JSON.stringify(Object.assign({}, PT.game, { screens: PT.screens })).length }; });
  console.log('file size now: host log ' + Math.round(size.host / 1024) + ' KB, with the three joined logs ' + Math.round(size.all / 1024) + ' KB');
  if (errs.length) bad.push(errs.length + ' page errors: ' + errs[0]);
  console.log(bad.length ? 'FAIL: ' + bad.join('; ') : 'OK');
  await b.close(); process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
