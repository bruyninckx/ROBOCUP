// A joined player lacks the fame for a card, asks for backing, makes an offer in the deal panel, the others accept.
// Passes when the host's log says someone backs the player (13 Nov bug: the deal panel never opened on a client).
const { setup, modal, press, hostLog } = require('./lib.js');
(async () => {
  const { b, host, errs, seatOf } = await setup(+process.argv[2] || 7, () => { const G = window.ROBOCUS_GAME && window.ROBOCUS_GAME.G; return !!(G && G.phase === 'intrigue' && G.round >= 1 && G.intrigueTurn >= 0 && !G.ivBusy); });
  let turn = await host.evaluate(() => window.ROBOCUS_DEBUG.G.intrigueTurn);
  if (turn === 0) { await host.evaluate(() => window.ROBOCUS_DEBUG.act('endTurn')); await host.waitForTimeout(800); turn = await host.evaluate(() => window.ROBOCUS_DEBUG.G.intrigueTurn); }
  const A = seatOf[turn], target = [1, 2, 3].find(s => s !== turn);
  await host.evaluate(s => { const G = window.ROBOCUS_DEBUG.G; G.teams.forEach(t => { t.fame = 5; t.credits = 9; }); G.teams[s].hand.push('coolant_leak'); window.ROBOCUS_DEBUG.updateHud(); }, turn);
  await host.waitForTimeout(600);
  await A.evaluate(t => window.ROBOCUS_DEBUG.act('play', 'coolant_leak', t), target);
  let sawDeal = false;
  for (let k = 0; k < 24; k++) {
    await host.waitForTimeout(400);
    if (/dealModal/.test(await modal(A))) sawDeal = true;
    await press(A, 'ivModal', /^Ask$/); await press(A, 'dealModal', /Lock in/);
    for (let s = 0; s < 4; s++) if (s !== turn) await press(seatOf[s], 'ivModal', /Accept/);
  }
  const log = await hostLog(host, 8), backed = log.some(x => / backs /.test(x));
  console.log(log.join('\n'));
  const bad = [!sawDeal && 'the deal panel never opened on the joined player\'s screen', !backed && 'nobody backed', errs.length && errs.length + ' page errors: ' + errs[0]].filter(Boolean);
  console.log(bad.length ? 'FAIL: ' + bad.join('; ') : 'OK');
  await b.close(); process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
