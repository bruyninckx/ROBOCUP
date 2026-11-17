// T27 (Kev's solo playtest, 17 Nov 18:08: "wondering now, moss gear did not get -1 fame"): he played Inside Leak on Moss Gears,
// Moss's Security Bot blocked it, Rust Rivets played Override (good for Kev), and the window then offered Kev his own Firewall
// against that Override; he clicked it and kept his own scheme blocked. Now a reaction is only offered where it can help you.
// Online (host + 3 joined screens, every seat a person), seat A plays, seat T is the target:
//   K. Kev's case: A plays Inside Leak on T; T blocks (PR Spin); seat 2 plays Override; in the Firewall window A, who holds
//      Firewall, gets the quiet window ("no card", OK, grey), the target, who holds Firewall, IS offered it with the new label;
//      the list says CAN ANSWER for everyone; nobody stops the Override and T loses 1 fame; A's Firewall stays in its hand.
//   K2. the same without a Firewall in A's hand: A's window is exactly the same (text and buttons) as in K.
//   G. a gift (Celebrity Endorsement on T): T, holding PR Spin, is not offered a block (quiet), seat 2 is; seat 2 blocks; seat 2
//      (the blocker) holds Override and is not offered it, A is ("your ... goes through"); A overrides; in the Firewall window
//      T (holding Firewall) is not offered it, seat 0 is; it lands: T +1 fame.
// Then on one screen (solo: you against three AI teams):
//   S. Kev's exact case: you play Inside Leak on an AI team whose Security Bots block it, an AI team overrides it: you hold
//      Firewall and see no window at all (as a player without the card), the scheme lands, your Firewall stays.
//   A. the AI: an AI team plays Celebrity Endorsement on another AI team holding PR Spin: the target never blocks its own gift.
//   node tools/mp-scenario/reaction-own.js [seed] [screenshotFolder]
const { setup, hostLog } = require('./lib.js');
const fs = require('fs'), path = require('path');
(async () => {
  const shots = process.argv[3]; if (shots) fs.mkdirSync(shots, { recursive: true });
  const { b, host, errs, seatOf, all } = await setup(+process.argv[2] || 7, () => { const G = window.ROBOCUS_GAME && window.ROBOCUS_GAME.G; return !!(G && G.phase === 'intrigue' && G.round >= 1 && G.intrigueTurn >= 0 && !G.ivBusy); });
  const bad = [], A = 3, T = 1;
  const prep = hands => host.evaluate(([A, T, hands]) => { const D = window.ROBOCUS_DEBUG, G = D.G;
    G.teams.forEach((t, i) => { t.credits = 12; t.fame = 8; t.secBots = 0; t.exSec = 0; t.exMechs = 0; t.hand = (hands[i] || []).slice(); while (t.crew.length < 2) t.crew.push(Object.assign({}, t.crew[0] || { kind: 'mechanic' }, { uid: 't27-' + i + '-' + t.crew.length + '-' + G.round })); });
    G.intrigueTurn = A; G.cashMode = false; D.updateHud(); }, [A, T, hands]);
  const win = p => p.evaluate(() => { const el = document.getElementById('promptBar'); if (!el || !el.classList.contains('rxmode') || el.classList.contains('qmode')) return null;
    const r = el.getBoundingClientRect();
    return { title: (el.querySelector('.rx-head b') || {}).textContent, text: el.querySelector('.rx-txt').textContent.replace(/\s+/g, ' ').trim(), html: el.querySelector('.rx-txt').innerHTML,
      btns: [...el.querySelectorAll('[data-rk]')].map(x => x.textContent.replace(/\s+/g, ' ').trim()), move: !el.classList.contains('idle'),
      cut: [...el.querySelectorAll('[data-rk]')].some(x => { const q = x.getBoundingClientRect(); return q.bottom > r.bottom - 1 || q.right > r.right + 1 || q.top < r.top; }) }; });
  const rail = p => p.evaluate(() => { const el = document.getElementById('waitRail'); return el && !el.hidden ? el.textContent : ''; });
  const waitTitle = async (re, seats, ms = 50000) => { for (let t = 0; t < ms; t += 150) { for (const s of seats) { const w = await win(seatOf[s]); if (w && re.test(w.title || '')) return true; } await host.waitForTimeout(150); } return false; };
  const click = (s, re) => seatOf[s].evaluate(src => { const bt = [...document.querySelectorAll('#promptBar.rxmode [data-rk]:not(:disabled)')].find(x => new RegExp(src).test(x.textContent.replace(/\s+/g, ' ').trim())); if (bt) bt.click(); return !!bt; }, re.source);
  const passAll = async seats => { for (const s of seats) await click(s, /^(Let it happen|OK)/); };
  const fame = () => host.evaluate(() => window.ROBOCUS_DEBUG.G.teams.map(t => t.fame));
  const hands = () => host.evaluate(() => window.ROBOCUS_DEBUG.G.teams.map(t => t.hand.join(',')));
  const play = (id, to) => seatOf[A].evaluate(([id, to]) => window.ROBOCUS_DEBUG.act('play', id, to), [id, to]);
  const settle = async () => { for (let t = 0; t < 60000; t += 250) { if (!(await host.evaluate(() => !!window.ROBOCUS_DEBUG.G.ivBusy || !!window.ROBOCUS_DEBUG.G.reacting))) return; await passAll([0, 1, 2, 3]); await host.waitForTimeout(250); } };   // passes the Pile-On window that follows lost fame
  const sizes = async (seats, name) => { if (!shots) return; for (const [w, h] of [[1600, 900], [1280, 720]]) for (const [s, n] of seats) {
    await seatOf[s].setViewportSize({ width: w, height: h }); await seatOf[s].waitForTimeout(250);
    await seatOf[s].screenshot({ path: path.join(shots, w + 'x' + h + '-' + name + '-' + n + '.png') });
    await seatOf[s].locator('#promptBar').screenshot({ path: path.join(shots, w + 'x' + h + '-' + name + '-' + n + '-note.png') });
    const wv = await win(seatOf[s]); if (wv && wv.cut) bad.push(name + ' ' + n + ' at ' + w + 'x' + h + ': a button is cut off'); }
    for (const [s] of seats) await seatOf[s].setViewportSize({ width: 1500, height: 900 }); };

  // ---------- K and K2: Kev's case, A's own scheme; K2 without the Firewall in A's hand
  const seenA = {};
  for (const run of ['K', 'K2']) {
    await prep({ [A]: ['inside_leak'].concat(run === 'K' ? ['firewall'] : []), [T]: ['pr_spin', 'firewall'], 2: ['override'] }); await host.waitForTimeout(500);
    // K takes screenshots at two sizes inside each window: the host gives the windows 40 s for that run (BAL.reactMs; K2 has the usual 10 s)
    await host.evaluate(ms => { window.ROBOCUS_DEBUG.BAL.reactMs = ms; }, run === 'K' && shots ? 40000 : null);
    const f0 = await fame(); await play('inside_leak', T);
    if (!await waitTitle(/Reaction window/, [T])) { bad.push(run + ': no reaction window for the target (' + (await hostLog(seatOf[A], 3)).join(' / ') + ' · ' + JSON.stringify(await host.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; return { ph: G.phase, turn: G.intrigueTurn, busy: !!G.ivBusy, r: G.round }; })) + ')'); break; }
    const w1 = await win(seatOf[T]); console.log(run + ' block window, target: ' + w1.text + ' · ' + w1.btns.join(' | '));
    if (run === 'K') await sizes([[T, 'target']], 'block');
    if (!w1.btns.some(x => /^🛡️ PR Spin: block it/.test(x)) || !w1.btns.some(x => /^Let it happen.*hits you/.test(x))) bad.push(run + ': the block buttons do not say what they do: ' + w1.btns.join(' | '));
    if (!/on YOU/.test(w1.text) || !/It hits you/.test(w1.text)) bad.push(run + ': the target\'s text does not say it is hit');
    await click(T, /PR Spin/);   // the first card played ends the window for everyone
    if (!await waitTitle(/Override/, [2])) { bad.push(run + ': no Override window'); break; }
    const w2 = await win(seatOf[2]), w2a = await win(seatOf[A]); console.log(run + ' Override window, seat 2: ' + w2.text + ' · ' + w2.btns.join(' | ') + '\n   player: ' + w2a.text + ' · ' + w2a.btns.join(' | '));
    if (run === 'K') await sizes([[2, 'other'], [A, 'player']], 'override');
    if (!w2.btns.some(x => /^⛓️ Override the block/.test(x) && /goes through/.test(x))) bad.push(run + ': Override button: ' + w2.btns.join(' | '));
    if (!/YOUR Inside Leak/.test(w2a.text)) bad.push(run + ': the player is not told it is its scheme in the Override window');
    await click(2, /Override/);
    if (!await waitTitle(/Firewall/, [T])) { bad.push(run + ': no Firewall window'); break; }
    await host.waitForTimeout(300);
    const wT = await win(seatOf[T]), wA = await win(seatOf[A]), w0 = await win(seatOf[0]);
    console.log(run + ' Firewall window\n   target: ' + wT.text + ' · ' + wT.btns.join(' | ') + '\n   player (' + (run === 'K' ? 'holds' : 'no') + ' Firewall): ' + (wA ? wA.text + ' · ' + wA.btns.join(' | ') + (wA.move ? ' (YOUR MOVE)' : ' (quiet)') : 'NO WINDOW') + '\n   seat 0: ' + (w0 ? w0.btns.join(' | ') : 'NO WINDOW'));
    const rails = []; for (const s of [0, 1, 2, 3]) rails.push(await rail(seatOf[s]));
    if (rails.some(r => !/CAN ANSWER|REACTION WINDOW/.test(r) || /DECIDING|READY/.test(r))) bad.push(run + ': the list does not say CAN ANSWER for everyone: ' + rails.join(' / '));
    if (run === 'K') await sizes([[T, 'target'], [A, 'player-quiet']], 'firewall');
    seenA[run] = wA;
    if (!wA || wA.btns.join('|') !== 'OK' || wA.move || !/no card to play here/.test(wA.text)) bad.push(run + ': the player of the scheme is offered something or sees no quiet window: ' + JSON.stringify(wA));
    if (!wA || !/YOUR Inside Leak/.test(wA.text) || !/your scheme goes through unless someone stops the Override/.test(wA.text)) bad.push(run + ': the player\'s text does not say its scheme goes through');
    if (!wT.btns.some(x => /^🛡️ Firewall: keep the block.*Inside Leak fails/.test(x)) || !wT.btns.some(x => /^Let it happen.*hits you/.test(x)) || !wT.move) bad.push(run + ': the target is not offered Firewall with the new label: ' + wT.btns.join(' | '));
    await passAll([T, A, 0]); await settle(); await host.waitForTimeout(500);
    const f1 = await fame(), h1 = await hands(), log = await hostLog(host, 6);
    console.log(run + ' result: target fame ' + f0[T] + ' → ' + f1[T] + ', player hand [' + h1[A] + '] · ' + log.slice(-2).join(' / '));
    if (f1[T] !== f0[T] - 1) bad.push(run + ': the scheme did not go through after the Override');
    if (h1[A] !== (run === 'K' ? 'firewall' : '')) bad.push(run + ': the player\'s hand is [' + h1[A] + ']');
  }
  if (seenA.K && seenA.K2 && (seenA.K.html !== seenA.K2.html || seenA.K.btns.join() !== seenA.K2.btns.join() || seenA.K.move !== seenA.K2.move)) bad.push('the player with Firewall (not offered) does not see exactly what the player without it sees');
  else if (seenA.K && seenA.K2) console.log('secrecy: the player\'s Firewall window is the same with and without Firewall in its hand');

  // ---------- G: a gift on T (Celebrity Endorsement): T may not block it, nor keep a block on it; the blocker may not Override
  await prep({ [A]: ['celebrity_endorsement', 'override'], [T]: ['pr_spin', 'firewall'], 2: ['pr_spin', 'override', 'firewall'], 0: ['firewall'] }); await host.waitForTimeout(500);
  { const f0 = await fame(); await play('celebrity_endorsement', T);
    if (!await waitTitle(/Reaction window/, [2])) bad.push('G: no reaction window');
    else {
      const wT = await win(seatOf[T]), w2 = await win(seatOf[2]);
      console.log('G block window\n   target (holds PR Spin): ' + wT.text + ' · ' + wT.btns.join(' | ') + '\n   seat 2: ' + w2.btns.join(' | '));
      if (wT.btns.join() !== 'OK' || wT.move) bad.push('G: the target of a gift is offered a block: ' + wT.btns.join(' | '));
      if (!/It helps you/.test(wT.text)) bad.push('G: the target is not told the scheme helps it');
      if (!w2.btns.some(x => /PR Spin: block it/.test(x))) bad.push('G: a bystander is not offered PR Spin');
      await click(2, /PR Spin/);
      if (!await waitTitle(/Override/, [A])) bad.push('G: no Override window');
      else {
        const wA = await win(seatOf[A]), w2b = await win(seatOf[2]);
        console.log('G Override window\n   player: ' + wA.text + ' · ' + wA.btns.join(' | ') + '\n   seat 2 (blocker, holds Override): ' + (w2b ? w2b.btns.join(' | ') : 'NO WINDOW'));
        if (!wA.btns.some(x => /^⛓️ Override the block.*your Celebrity Endorsement goes through/.test(x)) || !wA.btns.some(x => /^Let it happen.*stays blocked/.test(x))) bad.push('G: the player\'s Override buttons: ' + wA.btns.join(' | '));
        if (!w2b || w2b.btns.join() !== 'OK') bad.push('G: the blocker is offered Override against its own block');
        await click(A, /Override/);
        if (!await waitTitle(/Firewall/, [0])) bad.push('G: no Firewall window');
        else {
          await host.waitForTimeout(300);
          const fT = await win(seatOf[T]), f2 = await win(seatOf[2]), f0w = await win(seatOf[0]);
          console.log('G Firewall window\n   target (holds Firewall): ' + fT.text + ' · ' + fT.btns.join(' | ') + '\n   seat 2 (blocker): ' + f2.btns.join(' | ') + '\n   seat 0: ' + f0w.btns.join(' | '));
          if (fT.btns.join() !== 'OK' || fT.move) bad.push('G: the target of a gift is offered Firewall to keep the block on it');
          if (!f2.btns.some(x => /Firewall: keep the block/.test(x))) bad.push('G: the blocker is not offered Firewall');
          if (!f0w.btns.some(x => /Firewall: keep the block/.test(x))) bad.push('G: a bystander is not offered Firewall');
          await passAll([T, 2, 0]); await settle(); await host.waitForTimeout(500);
          const f1 = await fame(); console.log('G result: target fame ' + f0[T] + ' → ' + f1[T]);
          if (f1[T] !== f0[T] + 1) bad.push('G: the gift did not land after the Override');
        }
      }
    }
  }
  if (errs.length) bad.push(errs.length + ' page errors (online): ' + errs[0]);
  await b.close();

  // ---------- S and A: one screen (solo)
  const b2 = await require('./launch.js')(require('playwright'));
  const PLK = require('../planck-local.js'), PL = PLK.find(), errs2 = [];
  const p = await b2.newPage({ viewport: { width: 1600, height: 900 } }); p.on('pageerror', e => errs2.push(e.message));
  await PLK.route(p, PL);
  await p.goto(require('url').pathToFileURL(path.resolve('prototypes/tabletop-2.html')).href + '?seed=11'); await p.waitForTimeout(800);
  await p.evaluate(() => { window.__noSlide = true; window.__noAuto = true; });
  await p.click('#pAct2'); await p.waitForTimeout(1500);
  // S: seat 0 (you) plays Inside Leak on team 2 (8 Security Bots: one will block), team 1 holds Override; team 2 is the sole leader
  // (an AI overrides a block against a sole leader); you hold Firewall
  const sRes = await p.evaluate(async () => { const D = window.ROBOCUS_DEBUG, G = D.G;
    G.teams.forEach((t, i) => { t.credits = 12; t.fame = i === 2 ? 10 : 6; t.exMechs = 0; t.exSec = 0; t.secBots = i === 2 ? 8 : 0; t.hand = i === 0 ? ['inside_leak', 'firewall'] : i === 1 ? ['override'] : []; });
    D.updateHud(); let seen = false; const iv = setInterval(() => { if (document.getElementById('promptBar').matches('.rxmode:not(.qmode)')) seen = true; }, 50);
    const f0 = G.teams[2].fame; await D.playScheme(G.teams[0], 'inside_leak', G.teams[2]); clearInterval(iv);
    return { seen, f0, f1: G.teams[2].fame, hand: G.teams[0].hand.join(','), ov: G.teams[1].hand.join(','), log: D.PT.game.events.filter(e => e.k === 'msg').slice(-4).map(e => e.text) }; });
  console.log('S solo, Kev\'s case: window shown ' + sRes.seen + ' · team 2 fame ' + sRes.f0 + ' → ' + sRes.f1 + ' · your hand [' + sRes.hand + '] · team 1 hand [' + sRes.ov + ']\n   ' + sRes.log.join(' / '));
  if (sRes.ov !== '') bad.push('S: the AI did not play Override (the test needs it): ' + sRes.log.join(' / '));
  else { if (sRes.seen) bad.push('S: you were shown a window against your own scheme'); if (sRes.f1 !== sRes.f0 - 1 || sRes.hand !== 'firewall') bad.push('S: the scheme did not land or your Firewall was spent'); }
  // A: team 1 (the leader) plays Celebrity Endorsement on team 2, which holds PR Spin (it blocked 6 in 10 before T27), 4 times
  const aRes = await p.evaluate(async () => { const D = window.ROBOCUS_DEBUG, G = D.G, out = [];
    for (let k = 0; k < 4; k++) {
      G.teams.forEach((t, i) => { t.credits = 12; t.fame = i === 1 ? 10 : 7; t.secBots = 0; t.hand = i === 1 ? ['celebrity_endorsement'] : i === 2 ? ['pr_spin'] : []; });
      const f0 = G.teams[2].fame; await D.playScheme(G.teams[1], 'celebrity_endorsement', G.teams[2]); out.push({ kept: G.teams[2].hand.includes('pr_spin'), up: G.teams[2].fame - f0 }); }
    return out; });
  console.log('A the AI target of a gift: ' + aRes.map(x => (x.kept ? 'kept PR Spin' : 'BLOCKED') + ', fame +' + x.up).join(' · '));
  if (aRes.some(x => !x.kept || x.up !== 1)) bad.push('A: an AI team blocked a gift to itself');
  await b2.close();
  if (errs2.length) bad.push(errs2.length + ' page errors (solo): ' + errs2[0]);
  console.log(bad.length ? 'FAIL: ' + bad.join('; ') : 'OK');
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
