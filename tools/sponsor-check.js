// sponsor balance: N AI-only games (random sponsors, dealt 2 keep 1); prints the win share per sponsor (fair = 25%).
//   node tools/sponsor-check.js <games> <parallel> [out.json]   (run in the ROBOCUS folder)
const { chromium } = require('playwright'); const fs = require('fs');
const REPO = process.cwd(), N = +(process.argv[2] || 200), PAR = +(process.argv[3] || 4), OUT = process.argv[4] || 'sponsor-games.json';
(async () => {
  const b = await chromium.launch(); const res = []; let next = 1;
  async function one(seed) {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    try {
      await p.addInitScript(() => { window.__noRender = true; });
      await p.goto('file://' + REPO + '/prototypes/' + (process.env.PAGE || 'tabletop-prototype.html') + '?seed=' + seed); await p.waitForTimeout(200);
      await p.click('#pAct2'); await p.evaluate(() => window.ROBOCUS_DEBUG.autopilot(true));
      let last = '', same = 0;
      for (let i = 0; i < 20000; i++) {
        const st = await p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; if (G.over || G.round > 30) return null; const btn = document.getElementById('pAct2') || document.getElementById('pAct1'); if (btn && !btn.disabled) btn.click(); const m = document.querySelector('#ivModal:not([hidden]) button'); if (m) m.click(); return G.round + ':' + G.phase + ':' + (G.marketStage || '') + ':' + G.teams.map(t => t.fame).join('/'); });
        if (!st) break; same = st === last ? same + 1 : 0; last = st; if (same > 400) break; await p.waitForTimeout(10);
      }
      const r = await p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; const w = G.teams.slice().sort((a, b) => b.fame - a.fame || b.credits - a.credits)[0];
        return { over: G.over, round: G.round, teams: G.teams.map(t => ({ sp: t.sponsor, fame: t.fame, cr: t.credits, robots: t.robots.length, fameBy: t.fameBy, win: G.over && t === w })) }; });
      r.seed = seed; res.push(r);
    } catch (e) { console.log('seed', seed, e.message); }
    await p.close();
  }
  await Promise.all(Array.from({ length: PAR }, async () => { while (next <= N) await one(next++); }));
  fs.writeFileSync(OUT, JSON.stringify(res));
  const S = {}; for (const g of res.filter(r => r.over)) for (const t of g.teams) { const x = S[t.sp] = S[t.sp] || { n: 0, w: 0 }; x.n++; x.w += t.win ? 1 : 0; }
  console.log(res.length + ' games: ' + Object.entries(S).sort((a, b) => b[1].w / b[1].n - a[1].w / a[1].n).map(([k, x]) => k + ' ' + Math.round(100 * x.w / x.n) + '% (n ' + x.n + ')').join(' · '));
  await b.close();
})();
