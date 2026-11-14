// A live card that reaches a joined screen late makes it replay the fight from the start (resimFight -> RobocusView.replace).
// The damage panels beside the arena must follow the replayed fight (13 Nov: they kept showing the old one, so a joined
// player's panels froze while the arena went on: "stats didn't move", "we saw a different fight than the host").
const { setup } = require('./lib.js');
(async () => {
  const { b, host, errs, seatOf } = await setup(+process.argv[2] || 7, () => { const G = window.ROBOCUS_GAME && window.ROBOCUS_GAME.G; return !!(G && G.phase === 'fight' && G.fight && G.fight.S && G.fight.S.step > 240); }, { watch: true });
  const C = seatOf[1];
  const r = await C.evaluate(async () => {
    const G = window.ROBOCUS_DEBUG.G, DL = window.DamageLab, VW = window.RobocusView;
    const S2 = DL.create(JSON.parse(JSON.stringify(G.fight.bb)));
    S2.countdown = 0; let n = 0; while (!S2.over && n++ < 120 * 400) { DL.step(S2); S2.fx.length = 0; }   // the same fight, played to the end
    VW.replace(S2);
    await new Promise(res => setTimeout(res, 500));
    const txt = R => { const lost = R.stats.lost.length; return lost ? 'Lost this fight: ' + R.stats.lost.slice(-3).map(q => q.label).join(', ') + (lost > 3 ? ' +' + (lost - 3) + ' more' : '') : 'Nothing lost this fight'; };   // as src2/view.js writes it
    const got = [...document.querySelectorAll('#fightView .fv-panel')].map(x => x.querySelector('h3').textContent + ': ' + x.querySelector('.fv-lost').textContent);
    return { want: S2.robots.map(R => R.name + ': ' + txt(R)), got, lostAny: S2.robots.some(R => R.stats.lost.length) };
  });
  console.log('fight played to the end :', r.want.join(' | '));
  console.log('panels on the joined tab:', r.got.join(' | '));
  const key = a => a.slice().sort().join('|');
  const bad = [!r.lostAny && 'no robot lost a part in this fight: try another seed', key(r.want) !== key(r.got) && 'the panels do not show the replayed fight', errs.length && errs.length + ' page errors: ' + errs[0]].filter(Boolean);
  console.log(bad.length ? 'FAIL: ' + bad.join('; ') : 'OK');
  await b.close(); process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
