// The reaction window (Kev, 14 Nov): when a scheme is played, EVERY other player gets a small window at the same time, with
// a countdown: its cards and Let it happen, or "you have no card to play here" and OK. Checks:
//   1. it opens on all three other screens at once, the one without cards included; the player of the scheme sees no names;
//      (T2, 17 Nov: the window is in the yellow note; without a card: the count and OK, the note stays quiet)
//   2. nobody answers: it closes by itself when the time is up and the scheme lands;
//   3. two players hold an answer and the second one in seat order clicks first: its card blocks, the other card is not spent;
//   4. (T2) the target, a joined screen, presses Let it happen in its note: the scheme lands and its Firewall stays in its hand;
//   5. (T2) everyone clicks (Let it happen, OK, OK): the window closes early, as before T2.
//   node tools/mp-scenario/reaction.js [seed] [screenshotFolder]
const { setup, hostLog } = require('./lib.js');
const fs = require('fs'), path = require('path');
(async () => {
  const { b, host, errs, seatOf } = await setup(+process.argv[2] || 7, () => { const G = window.ROBOCUS_GAME && window.ROBOCUS_GAME.G; return !!(G && G.phase === 'intrigue' && G.round >= 1 && G.intrigueTurn >= 0 && !G.ivBusy); });
  const shots = process.argv[3]; if (shots) fs.mkdirSync(shots, { recursive: true });
  const bad = [], A = 3, T = 1;   // seat 3 plays Smash and Grab on seat 1; seats 0 (host) and 2 look on
  const prep = hands => host.evaluate(([A, T, hands]) => { const D = window.ROBOCUS_DEBUG, G = D.G;
    G.teams.forEach((t, i) => { t.credits = 12; t.fame = 8; t.secBots = i === T ? 1 : 0; t.exSec = 0; t.hand = hands[i] || []; t.sponsor = 'aegis'; });
    G.intrigueTurn = A; G.cashMode = false; D.updateHud(); return D.PT.game.events.filter(e => e.k === 'msg').length; }, [A, T, hands]);
  // T2 (17 Nov): the window is drawn in the note (#promptBar.rxmode): the text, the count, the answer buttons (none without a card)
  const win = p => p.evaluate(() => { const el = document.getElementById('promptBar'); if (!el || !el.classList.contains('rxmode') || el.classList.contains('qmode')) return null; return { text: el.querySelector('.rx-txt').textContent.replace(/\s+/g, ' '), btns: [...el.querySelectorAll('[data-rk]')].map(x => x.textContent.trim()), sec: el.querySelector('.rx-sec').textContent, move: !el.classList.contains('idle') }; });
  const banner = p => p.evaluate(() => { const el = document.getElementById('waitRail'); return el && !el.hidden ? el.textContent : ''; });
  const play = () => seatOf[A].evaluate(T => window.ROBOCUS_DEBUG.act('play', 'smash_and_grab', T), T);
  const ms = await host.evaluate(() => window.ROBOCUS_DEBUG.G && 10000);
  // ---- 1 and 2: the target holds Paid Off and a garage bot, the others nothing; nobody answers
  await prep({ [A]: ['smash_and_grab'], [T]: ['paid_off'] }); await host.waitForTimeout(500);
  const t0 = Date.now(); await play(); await host.waitForTimeout(1500);
  const w = {}; for (const s of [0, 1, 2]) w[s] = await win(seatOf[s]);
  for (const s of [0, 1, 2]) console.log('seat ' + s + (s === T ? ' (target, holds Paid Off + 1 bot)' : ' (no cards)') + ': ' + (w[s] ? w[s].sec + ' · ' + w[s].btns.join(' | ') : 'NO WINDOW'));
  console.log('seat ' + A + ' (plays the scheme): banner "' + await banner(seatOf[A]) + '"');
  if (shots) { await seatOf[T].screenshot({ path: path.join(shots, 'reaction-target.png') }); await seatOf[2].screenshot({ path: path.join(shots, 'reaction-no-cards.png') }); await seatOf[A].screenshot({ path: path.join(shots, 'reaction-player.png') }); }
  for (const s of [0, 1, 2]) if (!w[s]) bad.push('seat ' + s + ' got no reaction window');
  if (w[T] && !(w[T].btns.some(x => /Paid Off/.test(x)) && w[T].btns.some(x => /Roll a Security Bot/.test(x)) && w[T].btns.includes('Let it happen'))) bad.push('the target does not see its bot, its card and Let it happen');
  for (const s of [0, 2]) if (w[s] && !(/no card to play here/.test(w[s].text) && w[s].btns.join() === 'OK' && !w[s].move)) bad.push('seat ' + s + ' (no cards) does not see "no card" and OK in a quiet (grey) note');
  if (w[T] && !w[T].move) bad.push('the target\'s note is not YOUR MOVE');
  if (/DECIDING|YOUR MOVE|READY/.test(await banner(seatOf[A])) || !/REACTION WINDOW/.test(await banner(seatOf[A]))) bad.push('the list shows who is still answering');
  let closed = 0; for (let k = 0; k < 60; k++) { await host.waitForTimeout(250); if (!(await win(seatOf[T])) && !(await win(seatOf[0])) && !(await win(seatOf[2]))) { closed = Date.now() - t0; break; } }
  await host.waitForTimeout(800);
  const log1 = await hostLog(host, 3);
  console.log('nobody answered: the windows closed after ' + (closed / 1000).toFixed(1) + ' s · ' + log1[log1.length - 1]);
  if (!closed || closed < 8000 || closed > 14000) bad.push('the windows did not close by themselves after about 10 s (' + closed + ' ms)');
  if (!log1.some(x => /grabs/.test(x))) bad.push('the scheme did not land after the time was up');
  // ---- 3: seat 0 and seat 2 both hold Firewall; seat 2 clicks first
  await prep({ [A]: ['smash_and_grab'], 0: ['firewall'], 2: ['firewall'] });
  await host.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; G.teams[1].secBots = 0; G.teams.forEach(t => { t.fame = 10; }); window.ROBOCUS_DEBUG.updateHud(); }); await host.waitForTimeout(500);
  await play(); await host.waitForTimeout(1200);
  await seatOf[2].evaluate(() => { const bt = [...document.querySelectorAll('#promptBar [data-rk]')].find(x => /Firewall/.test(x.textContent)); if (bt) bt.click(); });
  await host.waitForTimeout(1500);
  const still = []; for (const s of [0, 1]) if (await win(seatOf[s])) still.push(s);
  // an Override window may follow the block (everyone but the target): let it run out
  await host.waitForTimeout(11500);
  const log2 = await hostLog(host, 4), hands = await host.evaluate(() => window.ROBOCUS_DEBUG.G.teams.map(t => t.hand.join(',')));
  console.log('seat 2 clicked Firewall first: ' + log2.filter(x => /blocks/.test(x)).join(' ') + ' · hands now: seat 0 [' + hands[0] + '], seat 2 [' + hands[2] + ']');
  if (!log2.some(x => /P2 blocks it with Firewall/.test(x))) bad.push('the first click did not block');
  if (hands[0] !== 'firewall') bad.push('the other player\'s Firewall was spent too');
  if (hands[2] !== '') bad.push('the clicked Firewall is still in the hand');
  // ---- 4 (T2): the target (a joined client) holds Firewall and clicks Let it happen in its note: the scheme lands, the card stays
  await prep({ [A]: ['smash_and_grab'], [T]: ['firewall'] });
  await host.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; G.teams.forEach(t => { t.secBots = 0; t.fame = 10; t.credits = 12; }); window.ROBOCUS_DEBUG.updateHud(); }); await host.waitForTimeout(500);
  const cr0 = await host.evaluate(T => window.ROBOCUS_DEBUG.G.teams[T].credits, T);
  await play(); await host.waitForTimeout(1200);
  const w4 = await win(seatOf[T]); if (shots) await seatOf[T].screenshot({ path: path.join(shots, 'reaction-client-firewall.png') });
  if (!(w4 && w4.move && w4.btns.join('|') === '🛡️ Firewall|Let it happen')) bad.push('pass case: the target\'s note shows ' + JSON.stringify(w4));
  await seatOf[T].evaluate(() => { const bt = [...document.querySelectorAll('#promptBar [data-rk]')].find(x => x.textContent.trim() === 'Let it happen'); if (bt) bt.click(); });
  await host.waitForTimeout(300); const w4b = await win(seatOf[T]);
  if (shots) await seatOf[T].locator('#promptBar').screenshot({ path: path.join(shots, 'reaction-client-passed-note.png') });
  await host.waitForTimeout(12000);
  const log4 = await hostLog(host, 4), after4 = await host.evaluate(T => ({ cr: window.ROBOCUS_DEBUG.G.teams[T].credits, hand: window.ROBOCUS_DEBUG.G.teams[T].hand.join(',') }), T);
  console.log('target passed from its note: ✓ shown ' + !!(w4b && w4b.btns.some(x => /✓/.test(x))) + ' · credits ' + cr0 + ' → ' + after4.cr + ', hand [' + after4.hand + ']');
  if (!(after4.cr < cr0 && after4.hand === 'firewall' && log4.some(x => /grabs/.test(x)))) bad.push('Let it happen from a joined client did not let the scheme land');
  // ---- 5 (T2): everyone clicks (the target Let it happen, the two others OK): the window closes early, before the 10 s
  await prep({ [A]: ['smash_and_grab'], [T]: ['firewall'] });
  await host.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; G.teams.forEach(t => { t.secBots = 0; t.fame = 10; t.credits = 12; }); window.ROBOCUS_DEBUG.updateHud(); }); await host.waitForTimeout(500);
  const m5 = await host.evaluate(() => window.ROBOCUS_DEBUG.PT.game.events.filter(e => e.k === 'msg').length);
  await play();
  for (let k = 0; k < 40 && !(await win(seatOf[0])); k++) await host.waitForTimeout(100);
  const t5 = Date.now();
  for (const [s, lab] of [[T, 'Let it happen'], [0, 'OK'], [2, 'OK']]) await seatOf[s].evaluate(lab => { const bt = [...document.querySelectorAll('#promptBar [data-rk]')].find(x => x.textContent.trim() === lab); if (bt) bt.click(); }, lab);
  let land5 = 0; for (let k = 0; k < 60; k++) { await host.waitForTimeout(250); if (await host.evaluate(m => window.ROBOCUS_DEBUG.PT.game.events.filter(e => e.k === 'msg').slice(m).some(e => /grabs/.test(e.text)), m5)) { land5 = Date.now() - t5; break; } }
  console.log('everyone clicked (Let it happen, OK, OK): the scheme landed ' + (land5 / 1000).toFixed(1) + ' s after the clicks (the window is 10 s)');
  if (!land5 || land5 > 4000) bad.push('the window did not close early when everyone had clicked (' + land5 + ' ms)');
  if (errs.length) bad.push(errs.length + ' page errors: ' + errs[0]);
  console.log(bad.length ? 'FAIL: ' + bad.join('; ') : 'OK');
  await b.close(); process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
