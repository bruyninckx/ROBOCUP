// The reaction window (Kev, 14 Nov): when a scheme is played, EVERY other player gets a small window at the same time, with
// a countdown: its cards and Pass, or "you have no card to play here" (since T2 without a button). Checks:
//   1. it opens on all three other screens at once, the one without cards included; the player of the scheme sees no names;
//      (T2, 17 Nov: the window is in the yellow note; without a card: the count and no buttons, the note stays quiet)
//   2. nobody answers: it closes by itself when the time is up and the scheme lands;
//   3. two players hold an answer and the second one in seat order clicks first: its card blocks, the other card is not spent.
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
  const win = p => p.evaluate(() => { const el = document.getElementById('promptBar'); if (!el || !el.classList.contains('rxmode')) return null; return { text: el.querySelector('.rx-txt').textContent.replace(/\s+/g, ' '), btns: [...el.querySelectorAll('[data-rk]')].map(x => x.textContent.trim()), sec: el.querySelector('.rx-sec').textContent, move: !el.classList.contains('idle') }; });
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
  if (w[T] && !(w[T].btns.some(x => /Paid Off/.test(x)) && w[T].btns.some(x => /Roll a Security Bot/.test(x)) && w[T].btns.includes('Pass'))) bad.push('the target does not see its bot, its card and Pass');
  for (const s of [0, 2]) if (w[s] && !(/no card to play here/.test(w[s].text) && w[s].btns.length === 0 && !w[s].move)) bad.push('seat ' + s + ' (no cards) does not see "no card", the count and no buttons (quiet note)');
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
  if (errs.length) bad.push(errs.length + ' page errors: ' + errs[0]);
  console.log(bad.length ? 'FAIL: ' + bad.join('; ') : 'OK');
  await b.close(); process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
