// same seed, same game: node tools/seed-check.js <seed> [page]. Runs an autopilot game with ?seed=N and prints a fingerprint (fame, credits, robots, log hash). Run it on two versions to prove a refactor changed nothing.
const { chromium } = require('playwright');
(async () => {
  const seed = process.argv[2] || 7, page = process.argv[3] || 'tabletop-prototype.html';
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + process.cwd() + '/prototypes/' + page + '?seed=' + seed); await p.waitForTimeout(300);
  await p.click('#pAct2'); await p.waitForTimeout(100);
  await p.evaluate(() => window.ROBOCUS_DEBUG.autopilot(true));
  let last = '', same = 0;
  for (let i = 0; i < 20000; i++) {
    const st = await p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; if (G.over || G.round > 30) return null;
      const btn = document.getElementById('pAct2') || document.getElementById('pAct1'); if (btn && !btn.disabled) btn.click();
      const m = document.querySelector('#ivModal:not([hidden]) button'); if (m) m.click();
      return G.round + ':' + G.phase + ':' + G.teams.map(t => t.fame).join('/'); });
    if (!st) break; same = st === last ? same + 1 : 0; last = st; if (same > 400) { console.log('STALL', st); break; }
    await p.waitForTimeout(15);
  }
  const fp = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G; return { round: G.round, fame: G.teams.map(t => t.fame), cr: G.teams.map(t => t.credits), rob: G.teams.map(t => t.robots.map(r => r.name + ':' + r.dmg)), msgs: D.PT.game.events.filter(e => e.k === 'msg').length, h: (() => { let h = 0; for (const e of D.PT.game.events) if (e.k === 'msg') for (const ch of String(e.text)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return h; })(), fights: D.PT.game.events.filter(e => e.k === 'fight_end').map(e => e.winner ?? e.win ?? '').join(',') }; });
  console.log(JSON.stringify(fp), errs.length ? 'ERRS ' + errs.slice(0, 3).join(' | ') : '');
  await b.close();
})();
