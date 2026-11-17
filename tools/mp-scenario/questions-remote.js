// T20 (17 Nov): a question to a JOINED player is asked in that player's yellow note too (the host sends the same message as
// before; the joined screen puts it in the note when it fits). One host + 3 joined tabs (local transport, bots frozen).
//   1. second robot of a double duel, asked of seat 1 (a joined screen): its note shows the robots, a click on one adds it
//      on the host; the host's waiting list names the question for seat 1 (as before); "Just one" adds none;
//   2. Hostile Buyout played by the host on seat 1: Refuse costs seat 1 one fame, Sell it hands over its robot for 4 Cr;
//   3. Joint Venture played by the host on seat 1: the host answers in its own note; seat 1's question is closed by the host
//      (a player who left: cancelSeat) and counts as Defect, its default since T20 (a default never costs you credits).
//   node tools/mp-scenario/questions-remote.js [seed=7] [screenshotFolder]
const { setup, hostLog } = require('./lib.js');
const fs = require('fs'), path = require('path');
(async () => {
  const { b, host, errs, seatOf } = await setup(+process.argv[2] || 7, () => { const G = window.ROBOCUS_GAME && window.ROBOCUS_GAME.G; return !!(G && G.phase === 'intrigue' && G.round >= 1 && G.intrigueTurn >= 0 && !G.ivBusy); });
  const shots = process.argv[3]; if (shots) fs.mkdirSync(shots, { recursive: true });
  const bad = [], C = 1;
  const H = await host.evaluate(() => window.ROBOCUS_GAME.HS);
  if (H !== 0) bad.push('the host is not seat 0');
  const prep = (extra = 0) => host.evaluate(([C, extra]) => { const D = window.ROBOCUS_DEBUG, G = D.G;
    G.teams.forEach((t, i) => { t.credits = 12; t.fame = 8; t.hand = []; t.secBots = 0; t.exSec = 0; t.robots.forEach(r => { r.exhausted = false; }); });
    const T = G.teams[C]; if (!window.__r0) window.__r0 = JSON.stringify(T.robots[0]); T.robots = [JSON.parse(window.__r0)];
    for (let k = 0; k < extra; k++) { const src = G.teams[(C + 1 + k) % 4].robots[0], r = JSON.parse(JSON.stringify(src)); r.id = 800 + k; r.exhausted = false; T.robots.push(r); }
    window.__res = undefined; D.updateHud(); }, [C, extra]);
  const note = p => p.evaluate(() => { const el = document.getElementById('promptBar');
    return { q: el.classList.contains('qmode') && !el.classList.contains('qpop'), rx: el.classList.contains('rxmode') && !el.classList.contains('qmode'), move: !el.classList.contains('idle'), flash: el.classList.contains('flash'),
      title: (el.querySelector('.q-t') || {}).textContent || '', bs: [...el.querySelectorAll('[data-rk]:not(:disabled)')].map(x => x.textContent.trim()), box: !!(document.getElementById('ivModal') && !document.getElementById('ivModal').hidden), sec: (el.querySelector('.rx-sec') || {}).textContent || '', all: el.querySelectorAll('[data-rk]').length, sent: el.classList.contains('rx-sent'), mine: ((document.querySelector('#waitRail .wr-row.move') || {}).innerText || '').replace(/\s+/g, ' ') }; });
  const waitQ = async (p, re) => { for (let t = 0; t < 15000; t += 150) { const n = await note(p); if (n.q && n.all && !n.sent && re.test(n.title)) return n; await p.waitForTimeout(150); } return null; };
  const click = async (p, re) => { for (let t = 0; t < 3000; t += 100) { if (await p.evaluate(() => !document.querySelector('#promptBar.qmode [data-rk].arming'))) break; await p.waitForTimeout(100); } return click0(p, re); };   // T20: buttons inactive for 0.8 s
  const click0 = (p, re) => p.evaluate(src => { const bt = [...document.querySelectorAll('#promptBar.qmode [data-rk]:not(:disabled)')].find(x => new RegExp(src).test(x.textContent)); if (!bt) return false; bt.click(); const d = document.querySelector('#promptBar [data-rk].done'); return d ? 'tick' : 'clicked'; }, re.source);
  const res = async () => { for (let t = 0; t < 20000; t += 200) { const v = await host.evaluate(() => window.__res); if (v !== undefined) return v; await host.waitForTimeout(200); } return 'TIMEOUT'; };
  // the reaction window every person gets when the host plays a scheme: nobody holds a card, so everyone clicks OK (it ends early)
  const okAll = async () => { for (let t = 0; t < 6000; t += 150) { let any = false; for (const s of [1, 2, 3]) { const n = await note(seatOf[s]); if (n.rx && n.bs.includes('OK')) { any = true; await seatOf[s].evaluate(() => { const bt = [...document.querySelectorAll('#promptBar [data-rk]:not(:disabled)')].find(x => x.textContent.trim() === 'OK'); if (bt) bt.click(); }); } } if (any) return; await host.waitForTimeout(150); } };

  // ---- 1. second robot, asked of seat 1
  const second = C => host.evaluate(C => { const D = window.ROBOCUS_DEBUG, G = D.G; const F = { teams: [C, 2], robots: [G.teams[C].robots[0], G.teams[2].robots[0]], sides: [0, 1] };
    D.addSeconds(F).then(() => { window.__res = { n: F.robots.length, second: F.teams[2] === C ? F.robots[2].id : null }; }); }, C);
  for (const [ans, want] of [[/^🤖/, 'robot'], [/^Just one$/, null]]) {
    await prep(2); await second(C);
    const n = await waitQ(seatOf[C], /Second robot/);
    if (!n) { bad.push('second robot: no question in seat ' + C + '\'s note'); continue; }
    await seatOf[C].waitForTimeout(1000);   // the buttons wait 0.8 s
    const n2 = await note(seatOf[C]);
    const wl = await host.evaluate(C => { const rows = [...document.querySelectorAll('#waitRail .wr-row')]; return rows.map(r => r.textContent.replace(/\s+/g, ' ').trim()).join(' / '); }, C);
    console.log('seat ' + C + ' (joined) note: ' + n2.title + ' · ' + n2.bs.join(' | ') + (n2.flash ? ' · flashing' : '') + (n2.box ? ' · BOX OPEN' : '') + '\n  host waiting list: ' + wl);
    if (shots && want) { await seatOf[C].screenshot({ path: path.join(shots, 'joined-second-robot.png') }); await seatOf[C].locator('#promptBar').screenshot({ path: path.join(shots, 'joined-second-robot-note.png') }); }
    if (!(n2.move && (n.flash || n2.flash)) || n2.box || n2.bs.length !== 3) bad.push('second robot on the joined screen: ' + JSON.stringify(n2));
    console.log('  seat ' + C + '\'s own waiting list: ' + n2.mine);
    if (!/YOUR MOVE/i.test(n2.mine)) bad.push('second robot: the joined screen\'s waiting list does not say YOUR MOVE: ' + n2.mine);
    if (!/Second robot/.test(wl)) bad.push('the host\'s waiting list does not name the question: ' + wl);
    const c = await click(seatOf[C], ans); if (c !== 'tick') bad.push('second robot: click on the joined screen gave ' + c);
    const r = await res();
    console.log('  → ' + ans.source + ': ' + JSON.stringify(r));
    if (want ? !(r.n === 3 && r.second >= 800) : r.n !== 2) bad.push('second robot from the joined screen (' + ans + '): ' + JSON.stringify(r));
  }
  // ---- 2. Hostile Buyout by the host on seat 1
  const hb = C => host.evaluate(C => { const D = window.ROBOCUS_DEBUG, G = D.G, T = G.teams[C]; G.teams[0].hand = ['hostile_buyout']; const c0 = T.credits, f0 = T.fame, n0 = T.robots.length;
    D.playScheme(G.teams[0], 'hostile_buyout', T).then(() => { window.__res = { cr: T.credits - c0, fame: T.fame - f0, robots: T.robots.length - n0 }; }); }, C);
  for (const [ans, want] of [[/^Refuse/, { cr: 0, fame: -1, robots: 0 }], [/^Sell it/, { cr: 4, fame: 0, robots: -1 }]]) {
    await prep(1); await hb(C); await okAll();
    const n = await waitQ(seatOf[C], /Hostile Buyout/);
    if (!n) { bad.push('Hostile Buyout: no question in seat ' + C + '\'s note'); continue; }
    if (shots && /Refuse/.test(ans.source)) await seatOf[C].locator('#promptBar').screenshot({ path: path.join(shots, 'joined-hostile-buyout-note.png') });
    const c = await click(seatOf[C], ans); if (c !== 'tick') bad.push('Hostile Buyout: click on the joined screen gave ' + c);
    const r = await res();
    console.log('Hostile Buyout on seat ' + C + ' (joined) → ' + ans.source + ': ' + JSON.stringify(r) + ' · ' + (await hostLog(host, 1))[0]);
    if (JSON.stringify(r) !== JSON.stringify(want)) bad.push('Hostile Buyout from the joined screen (' + ans + '): ' + JSON.stringify(r) + ', want ' + JSON.stringify(want));
  }
  // ---- 3. Joint Venture: the host answers in its own note; seat 1's question is closed by the host → Commit (its default)
  { await prep(); await host.evaluate(C => { const D = window.ROBOCUS_DEBUG, G = D.G; G.teams[0].hand = ['joint_venture']; const a = G.teams[0].credits, c = G.teams[C].credits;
      D.playScheme(G.teams[0], 'joint_venture', G.teams[C]).then(() => { window.__res = { host: G.teams[0].credits - a, seat: G.teams[C].credits - c }; }); }, C);
    await okAll();
    const nh = await waitQ(host, /Joint Venture/);
    if (!nh) bad.push('Joint Venture: no question in the host\'s note'); else { const c = await click(host, /^Commit$/); if (c !== 'tick') bad.push('Joint Venture on the host: ' + c); }
    const n = await waitQ(seatOf[C], /Joint Venture/);
    if (!n) bad.push('Joint Venture: no question in seat ' + C + '\'s note');
    else { await seatOf[C].waitForTimeout(1200); const n3 = await note(seatOf[C]); console.log('  seat ' + C + ' (joined) Joint Venture countdown: ' + n3.sec);
      if (shots) await seatOf[C].locator('#promptBar').screenshot({ path: path.join(shots, 'joined-joint-venture-note.png') });
      if (!/^\d+ s$/.test(n3.sec) || +n3.sec.split(' ')[0] > 19) bad.push('Joint Venture on the joined screen: no running countdown (' + n3.sec + ')'); }
    await host.evaluate(C => window.ROBOCUS_NET.cancelSeat(C), C);
    const r = await res();
    const gone = await note(seatOf[C]);
    console.log('Joint Venture (host Commit, seat ' + C + ' closed by the host: Defect, T20): ' + JSON.stringify(r) + ' · seat ' + C + '\'s note after: ' + (gone.q ? 'STILL THE QUESTION' : 'back to the game'));
    if (!(r.host === -2 && r.seat === 2)) bad.push('Joint Venture: a closed question did not count as Defect: ' + JSON.stringify(r));
    if (gone.q && gone.bs.length) bad.push('Joint Venture: the closed question stays in seat ' + C + '\'s note'); }
  console.log(errs.length ? 'PAGE ERRORS:\n' + errs.join('\n') : 'no page errors');
  console.log(bad.length ? 'FAIL\n' + bad.join('\n') : 'OK');
  await b.close();
  process.exit(bad.length || errs.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
