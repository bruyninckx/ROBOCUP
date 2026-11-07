// AI benchmark: one team plays AI "A", the other three AI "B"; A's seat rotates every game. A wins more than 25% → A is better.
//   node tools/ai-bench.js <games> <parallel> '<A json>' '<B json>' [out.json]
//   a spec: v2, v1, v2:hostFame=6,partK=0.5, v2:off=bets+host, or JSON {"v":2,"p":{"hostFame":3}} (see AI_PARAMS in the tabletop prototype)
// All 4 teams AI, no animations, no drawing. Seeds 1..games, so two runs with the same games compare like for like.
const { chromium } = require('playwright'); const fs = require('fs');
const N = +(process.argv[2] || 100), PAR = +(process.argv[3] || 2);
// a spec is JSON, or short: v2, v1, v2:hostFame=6,partK=0.5, v2:off=bets (easier to type in PowerShell)
const spec = x => { if (!x) return null; if (x.trim().startsWith('{')) return JSON.parse(x); const [v, ps] = x.split(':'); const p = {};
  (ps || '').split(',').filter(Boolean).forEach(kv => { const [k, val] = kv.split('='); p[k] = k === 'off' ? val.split('+') : +val; }); return { v: +v.replace(/\D/g, ''), p }; };
const A = spec(process.argv[4]) || { v: 2 }, Bspec = spec(process.argv[5]) || { v: 1 }, OUT = process.argv[6];
(async () => {
  const b = await chromium.launch(); const res = []; let next = 1;
  async function one(seed) {
    const seatA = seed % 4, p = await b.newPage({ viewport: { width: 1280, height: 800 } });
    try {
      await p.addInitScript(() => { window.__noRender = true; });
      await p.goto('file://' + process.cwd() + '/prototypes/tabletop-prototype.html?seed=' + seed); await p.waitForTimeout(150);
      await p.evaluate(([A, B, s]) => window.ROBOCUS_DEBUG.ai({ versions: [0, 1, 2, 3].map(i => i === s ? A.v : B.v), params: [0, 1, 2, 3].map(i => i === s ? A.p : B.p) }), [A, Bspec, seatA]);
      await p.click('#pAct2'); await p.evaluate(() => window.ROBOCUS_DEBUG.autopilot(true));
      let last = '', same = 0;
      for (let i = 0; i < 20000; i++) {
        const st = await p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; if (G.over || G.round > 30) return null; const btn = document.getElementById('pAct2') || document.getElementById('pAct1'); if (btn && !btn.disabled) btn.click(); const m = document.querySelector('#ivModal:not([hidden]) button'); if (m) m.click(); return G.round + ':' + G.phase + ':' + (G.marketStage || '') + ':' + G.teams.map(t => t.fame).join('/'); });
        if (!st) break; same = st === last ? same + 1 : 0; last = st; if (same > 400) break; await p.waitForTimeout(5);
      }
      const r = await p.evaluate(s => { const D = window.ROBOCUS_DEBUG, G = D.G, w = G.teams.slice().sort((a, b) => b.fame - a.fame || b.credits - a.credits)[0];
        return { over: G.over, round: G.round, winA: G.over && w.i === s, fameA: G.teams[s].fame, crA: G.teams[s].credits, errs: D.PT.errs, fameByA: G.teams[s].fameBy }; }, seatA);
      r.seed = seed; res.push(r);
    } catch (e) { console.error('seed', seed, e.message); }
    await p.close();
  }
  const t0 = Date.now();
  await Promise.all(Array.from({ length: PAR }, async () => { while (next <= N) await one(next++); }));
  const ok = res.filter(r => r.over), w = ok.filter(r => r.winA).length / ok.length, se = Math.sqrt(w * (1 - w) / ok.length);
  const out = { A, B: Bspec, games: ok.length, winA: w, ci: 1.96 * se, fameA: ok.reduce((a, r) => a + r.fameA, 0) / ok.length, rounds: ok.map(r => r.round).sort((a, b) => a - b)[ok.length >> 1], errs: res.reduce((a, r) => a + r.errs, 0), min: (Date.now() - t0) / 60000 };
  console.log(JSON.stringify(out));
  if (OUT) fs.writeFileSync(OUT, JSON.stringify({ out, res }));
  await b.close();
})();
