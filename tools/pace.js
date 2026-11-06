// pacing test: node tools/pace.js <games> <tag> ["ROBOCUS_DEBUG.tune({win:16,catchup:{leaderhost:1}})"], then node tools/pace-report.js <tag>. Results in $PACE_OUT (default: temp/robocus-pace).
// autopilot games: all 4 teams AI, no animations. node pace.js <games> <tag> [setup-js]
const { chromium } = require('playwright');
const OUTD = process.env.PACE_OUT || require('os').tmpdir() + '/robocus-pace'; require('fs').mkdirSync(OUTD, { recursive: true });
const N = +(process.argv[2] || 4), TAG = process.argv[3] || 'base', SETUP = process.argv[4] || '';
(async () => {
  const b = await chromium.launch();
  const out = [];
  for (let g = 0; g < N; g++) {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 4).join(' | ')));
    await p.goto('file://' + process.cwd() + '/prototypes/' + (process.env.PAGE || 'tabletop-prototype.html'));
    await p.waitForTimeout(300);
    if (SETUP) await p.evaluate(SETUP);
    await p.click('#pAct2'); await p.waitForTimeout(100);
    await p.evaluate(() => window.ROBOCUS_DEBUG.autopilot(true));
    const t0 = Date.now(); let last = '', same = 0, stall = false;
    for (let i = 0; i < 20000; i++) {
      const st = await p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; if (G.over || G.round > 30) return null;
        const btn = document.getElementById('pAct2') || document.getElementById('pAct1'); if (btn && !btn.disabled) btn.click();
        const m = document.querySelector('#ivModal:not([hidden]) button'); if (m) m.click();
        return G.round + ':' + G.phase + ':' + (G.marketStage || '') + ':' + G.teams.map(t => t.fame).join('/'); });
      if (!st) break;
      same = st === last ? same + 1 : 0; last = st;
      if (same > 400) { stall = true; break; }
      await p.waitForTimeout(15);
    }
    const res = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G, ev = D.PT.game.events;
      const ups = ev.filter(e => e.k === 'phase' && e.ph === 'upkeep'); const byR = {}; ups.forEach(e => { if (!byR[e.r]) byR[e.r] = e.teams.map(t => t.fame); });
      const fights = ev.filter(e => e.k === 'fight_start').map(e => e.format);
      const markets = ev.filter(e => e.k === 'market').map(e => { const R = e.lots.filter(l => /^robot:/.test(l.id)); return { robots: R.length, sold: R.filter(l => l.winner != null && l.winner >= 0).length }; });
      const robR = {}; ups.forEach(e => { if (!robR[e.r]) robR[e.r] = e.teams.map(t => t.robots.length); });
      return { over: G.over, round: G.round, fame: G.teams.map(t => t.fame), fameBy: G.teams.map(t => t.fameBy || {}), byR, robots: G.teams.map(t => t.robots.length), cr: G.teams.map(t => t.credits), crew: G.teams.map(t => t.crew.length), fights, markets, robR,
        scrapped: ev.filter(e => e.k === 'msg' && /scrapp/i.test(e.text)).length, debts: ev.filter(e => e.k === 'msg' && /can.t pay/.test(e.text)).length, hostSelf: ev.filter(e => e.k === 'msg' && /^👑 Host .* invites (.+?) vs/.test(e.text)).length, errors: ev.filter(e => e.k === 'error').map(e => e.msg), uneven: ev.filter(e => e.k === 'msg' && /Uneven fight/.test(e.text)).length, robotSales: ev.filter(e => e.k === 'msg' && /sells its robot/.test(e.text)).length, hostSelf: ev.filter(e => e.k === 'msg' && /^👑 Host (.+?) invites \1 vs|^👑 Host (.+?) invites .+ vs \2!/.test(e.text)).length, doubles: ev.filter(e => e.k === 'fight_start' && e.format === 'double').length }; });
    res.secs = Math.round((Date.now() - t0) / 1000); res.stall = stall; if (stall) res.tail = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG; return { phase: D.G.phase, stage: D.G.marketStage, fs: JSON.stringify(D.PT.game.events.filter(e => e.k === 'fight_start').slice(-1)[0]).slice(0, 1500), ev: D.PT.game.events.filter(e => e.k !== 'button' && e.k !== 'click').slice(-25).map(e => e.k + ' ' + (e.text || e.msg || e.label || '').toString().slice(0, 140)) }; }); res.errs = errs.slice(0, 3); out.push(res); require('fs').writeFileSync(OUTD + '/' + TAG + '_' + process.pid + '.json', JSON.stringify(out)); process.stdout.write('.');
    await p.close();
  }
  require('fs').writeFileSync(OUTD + '/' + TAG + '_' + process.pid + '.json', JSON.stringify(out));
  console.log('\n' + TAG, out.map(r => (r.stall ? 'STALL ' : '') + 'R' + r.round + ' ' + r.fame.join('/') + ' ' + r.secs + 's').join(' | '));
  await b.close();
})();
