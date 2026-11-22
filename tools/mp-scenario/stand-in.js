// T59 (Kev, 22 Nov: "wonder how it was decided that rust rivets steps in here"; "The host picks the replacement from the teams
// with a ready robot": "yes"). An invited team drops out of a duel (no ready robot, or it declines): with 2+ teams that could step
// in, the host picks. Solo page (you are seat 0, three AI teams), a fresh page per case:
//   1. you host and invite yourself and team 1, which has no ready robot; teams 2 and 3 could step in: a question in the note
//      (2 answers, each team's strongest robot and its band), the pit shows the candidates; you pick the second (team 3): it fights,
//      the log says "the host picks ... to step in";
//   2. only team 3 could step in: no question, team 3 steps in ("steps in.");
//   3. no answer (askBoxMs 3 s): the team with the most fame steps in (team 3 has more fame than team 2), a ⌛ line, the log says so;
//   4. you host and invite yourself and team 1, then decline: you are asked who steps in for you (teams 2 and 3);
//   5. an AI host (team 1) invites itself and team 2 (no ready robot); candidates you (seat 0) and team 3: no question anywhere,
//      it picks by its valuation (D.standlog: the scores, the pick = the best score), the log says "the host picks";
//   6. BAL.hostPicksStandIn false: no question, the first in seat order steps in ("steps in.").
// Online (one host page + 3 joined screens, local transport, bots frozen):
//   7. joined seat 1 is the host, invites itself and seat 2 (no ready robot): seat 1's note asks (2 answers: seat 0 and seat 3), the
//      host page's waiting list names seat 1 and the question; seat 1 clicks the second: seat 3 fights;
//   8. joined seat 1 hosts, invites seats 2 and 3; seat 2 declines: seat 1 is asked (seat 0 and seat 1 itself), picks seat 0.
//   node tools/mp-scenario/stand-in.js [screenshotFolder]   (the screenshot of case 1 at 1905 x 932: <folder>/t59-stand-in.png)
const path = require('path'), fs = require('fs');
(async () => {
  const shots = process.argv[2]; if (shots) fs.mkdirSync(shots, { recursive: true });
  const b = await require('./launch.js')(require('playwright'));
  const PLK = require('../planck-local.js'), PL = PLK.find();
  const bad = [], errs = [];
  async function open(bal = {}, w = 1905, h = 932) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', e => errs.push(e.message + (process.env.STACK ? ' ' + e.stack : '')));
    await PLK.route(p, PL);
    await p.goto(require('url').pathToFileURL(path.resolve('prototypes/tabletop-2.html')).href + '?seed=11&bal=' + encodeURIComponent(JSON.stringify(Object.assign({ tradeFloor: false }, bal)))); await p.waitForTimeout(800);
    await p.evaluate(() => { window.__noSlide = true; window.__noAuto = true; });
    await p.click('#pAct2'); await p.waitForTimeout(1500); await p.mouse.move(5, 5);
    return p;
  }
  // the arena, host `host`: every team 12 Cr, `fame`, one ready robot each (out: teams with every robot exhausted)
  const prep = (p, host, out, fame = [8, 8, 8, 8]) => p.evaluate(([host, out, fame]) => { const D = window.ROBOCUS_DEBUG, G = D.G;
    G.teams.forEach((t, i) => { t.credits = 12; t.fame = fame[i]; t.hand = []; t.secBots = 0; t.debt = 0; t.robots.forEach(r => { r.exhausted = out.includes(i); }); });
    for (let s = 0; s < 4; s++) D.PS(s).choose = false;
    G.phase = 'arena'; G.host = host; G.fight = null; G.pickTeams = null; G.hostStep = false; G.chooseMyBot = false; G.arenaEvent = null; G.houseRobot = false; G.arenaPick = 'open'; G.pendingFormat = 'duel'; G.nextEvent = null; G.standIn = null;
    D.updateHud(); }, [host, out, fame]);
  const note = p => p.evaluate(() => { const el = document.getElementById('promptBar');
    return { q: el.classList.contains('qmode') && !el.classList.contains('qpop'), title: (el.querySelector('.q-t') || {}).textContent || '', text: (el.querySelector('.rx-txt') || {}).textContent || '',
      bs: [...el.querySelectorAll('[data-rk]')].map(x => x.textContent.trim()), sec: (el.querySelector('.rx-sec') || {}).textContent || '', sent: el.classList.contains('rx-sent') }; });
  const waitQ = async (p, ms = 8000) => { for (let t = 0; t < ms; t += 100) { const n = await note(p); if (n.q && /steps in/i.test(n.title) && n.bs.length && !n.sent) return n; await p.waitForTimeout(100); } return null; };
  const click = async (p, k) => { for (let t = 0; t < 3000; t += 100) { if (await p.evaluate(() => !document.querySelector('#promptBar.qmode [data-rk].arming'))) break; await p.waitForTimeout(100); }
    return p.evaluate(k => { const bt = document.querySelector('#promptBar.qmode [data-rk="' + k + '"]'); if (!bt) return false; bt.click(); return true; }, k); };
  const log = (p, n = 6) => p.evaluate(n => window.ROBOCUS_DEBUG.PT.game.events.filter(e => e.k === 'msg').slice(-n).map(e => e.text.replace(/<[^>]+>/g, '')), n);
  const fightTeams = p => p.evaluate(() => { const F = window.ROBOCUS_DEBUG.G.fight; return F ? F.teams.slice() : null; });
  const names = p => p.evaluate(() => window.ROBOCUS_DEBUG.G.teams.map(t => t.name));
  const settle = async (p, ms = 5000) => { for (let t = 0; t < ms; t += 100) { if (await fightTeams(p)) return; await p.waitForTimeout(100); } };
  const say = (tag, x) => console.log(tag + ': ' + x);

  // ---- 1. you host, invite yourself + team 1 (no ready robot); teams 2 and 3 could step in; pick the second (team 3)
  { const p = await open(), N = await names(p);
    await prep(p, 0, [1]); await p.evaluate(() => { const D = window.ROBOCUS_DEBUG; D.G.houseRobot = true; D.invite([0, 1], [0, 1], 'duel'); });   // Kev's round 5: a duel + House Robot
    const n = await waitQ(p);
    if (!n) bad.push('1: no question in the note');
    else {
      say('1 note', n.title + ' · ' + n.text + ' · ' + n.bs.join(' | ') + ' · ' + n.sec);
      if (n.bs.length !== 2 || !new RegExp(N[2]).test(n.bs[0]) || !new RegExp(N[3]).test(n.bs[1])) bad.push('1: the answers are ' + JSON.stringify(n.bs) + ', want ' + N[2] + ' then ' + N[3]);
      if (!n.bs.every(x => /·.*·/.test(x))) bad.push('1: an answer without robot and band: ' + JSON.stringify(n.bs));
      if (!/^\d+ s$/.test(n.sec) || +n.sec.split(' ')[0] < 25) bad.push('1: the countdown is ' + n.sec + ', want askBoxMs (30 s)');
      const pit = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG; return { st: !!D.G.standIn, hits: D.hitRegions.filter(r => r.kind === 'standin').length, wait: (document.getElementById('waitRail') || {}).innerText || '' }; });
      say('1 pit', JSON.stringify(pit).slice(0, 200));
      if (!pit.st || pit.hits !== 2) bad.push('1: the pit does not show the 2 candidates: ' + JSON.stringify(pit));
      if (shots) { await p.waitForTimeout(1200); await p.screenshot({ path: path.join(shots, 't59-stand-in.png') }); }
      if (!(await click(p, 1))) bad.push('1: no second answer');
      await settle(p);
      const ft = await fightTeams(p), L = await log(p, 3); say('1 →', JSON.stringify(ft) + ' · ' + L.slice(-1)[0]);
      if (!ft || ft[1] !== 3) bad.push('1: fight ' + JSON.stringify(ft) + ', want [0,3]');
      if (!L.some(x => new RegExp('no ready robot and declines \\(−1 fame\\); the host picks ' + N[3] + ' to step in').test(x))) bad.push('1: log ' + JSON.stringify(L));
    }
    await p.close(); }
  // ---- 2. one candidate (team 3): no question
  { const p = await open(), N = await names(p);
    await prep(p, 0, [1, 2]); await p.evaluate(() => { window.ROBOCUS_DEBUG.invite([0, 1], [0, 1], 'duel'); });
    const n = await waitQ(p, 1500); if (n) bad.push('2: a question with one candidate');
    await settle(p); const ft = await fightTeams(p), L = await log(p, 3); say('2 →', JSON.stringify(ft) + ' · ' + L.slice(-1)[0]);
    if (!ft || ft[1] !== 3) bad.push('2: fight ' + JSON.stringify(ft) + ', want [0,3]');
    if (!L.some(x => new RegExp('declines \\(−1 fame\\); ' + N[3] + ' steps in\\.').test(x))) bad.push('2: log ' + JSON.stringify(L));
    await p.close(); }
  // ---- 3. no answer: the most fame (team 3: 9 fame, team 2: 8)
  { const p = await open({ askBoxMs: 3000 }), N = await names(p);
    await prep(p, 0, [1], [8, 8, 8, 9]); await p.evaluate(() => { window.ROBOCUS_DEBUG.invite([0, 1], [0, 1], 'duel'); });
    const n = await waitQ(p); if (!n) bad.push('3: no question');
    await settle(p, 9000); const ft = await fightTeams(p), L = await log(p, 4); say('3 →', JSON.stringify(ft) + ' · ' + L.slice(-2).join(' / '));
    if (!ft || ft[1] !== 3) bad.push('3: fight ' + JSON.stringify(ft) + ', want [0,3] (the most fame)');
    if (!L.some(x => /⌛/.test(x) && /most fame/.test(x))) bad.push('3: no ⌛ line: ' + JSON.stringify(L));
    if (!L.some(x => new RegExp('did not answer in time: ' + N[3] + ' steps in \\(the most fame\\)').test(x))) bad.push('3: log ' + JSON.stringify(L));
    await p.close(); }
  // ---- 4. you host, invite yourself + team 1, then decline: you are asked who steps in for you
  { const p = await open(), N = await names(p);
    await prep(p, 0, []); await p.evaluate(() => { window.ROBOCUS_DEBUG.invite([0, 1], [0, 1], 'duel'); });
    for (let t = 0; t < 3000; t += 100) { if (await p.evaluate(() => window.ROBOCUS_DEBUG.PS(0).choose)) break; await p.waitForTimeout(100); }
    await p.evaluate(() => window.ROBOCUS_DEBUG.act('decline'));
    const n = await waitQ(p);
    if (!n) bad.push('4: no question after the decline');
    else { say('4 note', n.text + ' · ' + n.bs.join(' | '));
      if (n.bs.length !== 2 || !/declines/.test(n.text)) bad.push('4: ' + JSON.stringify(n));
      await click(p, 0); await p.waitForTimeout(800);
      const ft = await fightTeams(p), L = await log(p, 4); say('4 →', JSON.stringify(ft) + ' · ' + L.slice(-1)[0]);
      if (!ft || ft[0] !== 2) bad.push('4: fight ' + JSON.stringify(ft) + ', want [2,1]');
      if (!L.some(x => new RegExp('declines the invite \\(−1 Fame\\); the host picks ' + N[2] + ' to step in').test(x))) bad.push('4: log ' + JSON.stringify(L)); }
    await p.close(); }
  // ---- 5. an AI host (team 1) invites itself and team 2 (no ready robot): candidates you and team 3; it picks by its valuation
  { const p = await open(), N = await names(p);
    await prep(p, 1, [2]); await p.evaluate(() => { window.ROBOCUS_DEBUG.invite([1, 2], [0, 1], 'duel'); });
    await p.waitForTimeout(600); const n = await note(p); if (n.q && /steps in/.test(n.title)) bad.push('5: you were asked, but the AI hosts');
    const r = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG; return { sl: D.standlog.slice(-1)[0], ft: D.G.fight && D.G.fight.teams.slice() }; }), L = await log(p, 3);
    say('5 →', JSON.stringify(r) + ' · ' + L.slice(-1)[0]);
    const best = r.sl && r.sl.cands.slice().sort((a, b) => b.s - a.s)[0];
    if (!r.sl || r.sl.cands.length !== 2 || r.sl.way !== 'value' || best.i !== r.sl.pick) bad.push('5: the AI host did not pick by its valuation: ' + JSON.stringify(r.sl));
    if (!r.ft || r.ft[1] !== (r.sl || {}).pick) bad.push('5: fight ' + JSON.stringify(r.ft));
    if (!L.some(x => new RegExp('the host picks ' + N[(r.sl || {}).pick] + ' to step in').test(x))) bad.push('5: log ' + JSON.stringify(L));
    await p.close(); }
  // ---- 6. the switch off: no question, the first in seat order
  { const p = await open({ hostPicksStandIn: false }), N = await names(p);
    await prep(p, 0, [1]); await p.evaluate(() => { window.ROBOCUS_DEBUG.invite([0, 1], [0, 1], 'duel'); });
    const n = await waitQ(p, 1500); if (n) bad.push('6: a question with the switch off');
    await settle(p); const ft = await fightTeams(p), L = await log(p, 3); say('6 →', JSON.stringify(ft) + ' · ' + L.slice(-1)[0]);
    if (!ft || ft[1] !== 2) bad.push('6: fight ' + JSON.stringify(ft) + ', want [0,2] (seat order)');
    if (!L.some(x => new RegExp('declines \\(−1 fame\\); ' + N[2] + ' steps in\\.').test(x))) bad.push('6: log ' + JSON.stringify(L));
    await p.close(); }
  await b.close();

  // ---- online
  if (!process.env.NO_ONLINE) {
    const { setup } = require('./lib.js');
    const { b: b2, host, errs: e2, seatOf } = await setup(7, () => { const G = window.ROBOCUS_GAME && window.ROBOCUS_GAME.G; return !!(G && G.phase === 'intrigue' && G.round >= 1 && G.intrigueTurn >= 0 && !G.ivBusy); });
    const N = await names(host);
    const oprep = out => host.evaluate(out => { const D = window.ROBOCUS_DEBUG, G = D.G;
      G.teams.forEach((t, i) => { t.fame = 8; t.robots.forEach(r => { r.exhausted = out.includes(i); }); });
      for (let s = 0; s < 4; s++) D.PS(s).choose = false;
      G.phase = 'arena'; G.host = 1; G.fight = null; G.pickTeams = null; G.hostStep = false; G.chooseMyBot = false; G.arenaEvent = null; G.houseRobot = false; G.arenaPick = 'open'; G.pendingFormat = 'duel'; G.standIn = null; D.updateHud(); }, out);
    // 7. joined seat 1 hosts, invites itself + seat 2 (no ready robot)
    await oprep([2]); await host.evaluate(() => { window.ROBOCUS_DEBUG.invite([1, 2], [0, 1], 'duel'); });
    let n = await waitQ(seatOf[1], 15000);
    if (!n) bad.push('7: no question on joined seat 1');
    else { await seatOf[1].waitForTimeout(1200);
      const wl = await host.evaluate(() => [...document.querySelectorAll('#waitRail .wr-row')].map(r => r.textContent.replace(/\s+/g, ' ').trim()).join(' / '));
      say('7 seat 1 note', n.text + ' · ' + n.bs.join(' | ') + '\n  host waiting list: ' + wl);
      if (n.bs.length !== 2 || !new RegExp(N[0]).test(n.bs[0]) || !new RegExp(N[3]).test(n.bs[1])) bad.push('7: answers ' + JSON.stringify(n.bs));
      if (!/steps in/i.test(wl)) bad.push('7: the waiting list does not show the host choosing: ' + wl);
      const pit = await seatOf[1].evaluate(() => window.ROBOCUS_DEBUG.hitRegions.filter(r => r.kind === 'standin').length); if (pit !== 2) bad.push('7: the joined host\'s pit shows ' + pit + ' candidates');
      await click(seatOf[1], 1); await settle(host, 8000);
      const ft = await fightTeams(host), L = await log(host, 3); say('7 →', JSON.stringify(ft) + ' · ' + L.slice(-1)[0]);
      if (!ft || ft[1] !== 3) bad.push('7: fight ' + JSON.stringify(ft) + ', want [1,3]');
      if (!L.some(x => new RegExp('the host picks ' + N[3] + ' to step in').test(x))) bad.push('7: log ' + JSON.stringify(L)); }
    // 8. joined seat 1 hosts, invites seats 2 and 3; seat 2 declines: seat 1 is asked (seat 0, seat 1), picks seat 0
    await oprep([]); await host.evaluate(() => { window.ROBOCUS_DEBUG.invite([2, 3], [0, 1], 'duel'); });
    for (let t = 0; t < 5000; t += 150) { if (await host.evaluate(() => window.ROBOCUS_DEBUG.PS(2).choose)) break; await host.waitForTimeout(150); }
    await seatOf[2].waitForTimeout(500); await seatOf[2].evaluate(() => window.ROBOCUS_DEBUG.act('decline'));
    n = await waitQ(seatOf[1], 15000);
    if (!n) bad.push('8: no question on joined seat 1 after seat 2 declined');
    else { say('8 seat 1 note', n.text + ' · ' + n.bs.join(' | '));
      if (n.bs.length !== 2 || !new RegExp(N[0]).test(n.bs[0]) || !/\(you\)/.test(n.bs[1])) bad.push('8: answers ' + JSON.stringify(n.bs));
      await click(seatOf[1], 0);
      let ft = null; for (let t = 0; t < 8000; t += 150) { ft = await fightTeams(host); if (ft && ft[0] === 0) break; await host.waitForTimeout(150); }
      const L = await log(host, 3); say('8 →', JSON.stringify(ft) + ' · ' + L.slice(-1)[0]);
      if (!ft || ft[0] !== 0) bad.push('8: fight ' + JSON.stringify(ft) + ', want [0,3]');
      if (!L.some(x => new RegExp('declines the invite \\(−1 Fame\\); the host picks ' + N[0] + ' to step in').test(x))) bad.push('8: log ' + JSON.stringify(L)); }
    errs.push(...e2);
    await b2.close();
  }
  if (errs.length) bad.push(errs.length + ' page errors: ' + errs.slice(0, 3).join(' | '));
  console.log(bad.length ? 'FAIL\n  ' + bad.join('\n  ') : 'OK');
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
