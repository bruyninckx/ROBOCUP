// An invited joined player declines a duel while no other team has a ready robot to step in.
// 14 Nov: the game used to put a team WITHOUT a robot in the fight, the fight crashed on the missing robot and the round hung.
// Passes when there are no page errors and the round goes on without a fight.
const { setup, hostLog } = require('./lib.js');
(async () => {
  const { b, host, errs, seatOf } = await setup(+process.argv[2] || 7, () => { const GM = window.ROBOCUS_GAME, G = GM && GM.G; return !!(G && G.phase === 'arena' && G.fight && G.fight.format === 'duel' && [1, 2, 3].some(s => GM.seatBusyWith(s) === 'robot pick')); });
  const s = await host.evaluate(() => [1, 2, 3].find(s => window.ROBOCUS_GAME.seatBusyWith(s) === 'robot pick'));
  await host.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; G.teams.forEach(t => { if (!G.fight.teams.includes(t.i)) t.robots.forEach(r => { r.exhausted = true; }); }); window.ROBOCUS_DEBUG.updateHud(); });   // nobody else can step in
  await host.waitForTimeout(500);
  await seatOf[s].evaluate(() => window.ROBOCUS_DEBUG.act('decline'));
  await host.waitForTimeout(2500);
  const st = await host.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; return { phase: G.phase, fight: G.fight ? (G.fight.robots || []).map(r => r ? r.name : null) : null }; });
  const log = await hostLog(host, 4);
  console.log(log.join('\n')); console.log(JSON.stringify(st));
  const bad = [errs.length && errs.length + ' page errors: ' + errs[0], st.fight && st.fight.includes(null) && 'a fight with a missing robot', !log.some(x => /no fight this round/.test(x)) && 'the round did not go on without a fight'].filter(Boolean);
  console.log(bad.length ? 'FAIL: ' + bad.join('; ') : 'OK');
  await b.close(); process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
