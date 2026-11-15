// Every screen says who the game is waiting for (14 Nov): on someone's Intrigue turn the other three see
// "Waiting for <name> Intrigue turn" over the pit, and the player on turn sees "Everyone is waiting for you".
//   node tools/mp-scenario/waiting.js [seed] [screenshot.png]
const { setup } = require('./lib.js');
(async () => {
  const { b, host, errs, seatOf } = await setup(+process.argv[2] || 7, () => { const G = window.ROBOCUS_GAME && window.ROBOCUS_GAME.G; return !!(G && G.phase === 'intrigue' && G.round >= 1 && G.intrigueTurn >= 0 && !G.ivBusy); });
  await host.waitForTimeout(1500);
  const turn = await host.evaluate(() => window.ROBOCUS_DEBUG.G.intrigueTurn), name = await host.evaluate(t => window.ROBOCUS_DEBUG.G.teams[t].name, turn);
  const txt = p => p.evaluate(() => { const el = document.getElementById('waitRail'); return el && !el.hidden ? el.textContent : ''; });
  const seen = []; for (let s = 0; s < 4; s++) seen.push(await txt(seatOf[s]));
  seen.forEach((t, s) => console.log('seat ' + s + (s === turn ? ' (on turn)' : '') + ': ' + (t || '(no banner)')));
  if (process.argv[3]) await seatOf[[1, 2, 3].find(s => s !== turn)].screenshot({ path: process.argv[3] });
  const bad = [];
  // 2.0.1: the list on the right. The player on turn sees YOUR MOVE on its own row, the others WAITING FOR 1 and DECIDING
  seen.forEach((t, s) => { if (s === turn ? !/YOUR MOVE/.test(t) : !(/WAITING FOR 1/.test(t) && /DECIDING/.test(t) && !/YOUR MOVE/.test(t))) bad.push('seat ' + s + ' shows the wrong list'); });
  if (errs.length) bad.push(errs.length + ' page errors: ' + errs[0]);
  console.log(bad.length ? 'FAIL: ' + bad.join('; ') : 'OK');
  await b.close(); process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
