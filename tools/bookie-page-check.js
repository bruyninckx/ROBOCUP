// T62 (22 Nov 2026): the fight bookie in a served page, on a staged fight, against the page running the same seeds itself.
// Stages Kev's round 11 of 22 Nov (Gyro L2: Race-spec Booster + Race-spec Jammer + Quantum shield, against Scavenger L3: Overdrive
// + Weapon overhaul, open floor, teams 0 and 1, round 11), runs simOdds in the helpers with a long budget (so nothing is cut),
// then the same seeds on the page (DL.create + step, the real fight's engine set-up) and prints both counts and the seeds that differ.
//   node tools/bookie-page-check.js [--n=126] [--root=<other checkout>] [--port=8885]
// --root serves another checkout (e.g. origin/main before T62) to see the helpers' old count.
'use strict';
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path'), cp = require('child_process');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const ROOT = path.resolve(arg('root', path.join(__dirname, '..'))), N = +arg('n', 126), PORT = +arg('port', 8885);
const vend = path.join(ROOT, 'vendor/planck-1.4.3.min.js'), nm = path.join(__dirname, '..', 'node_modules/planck/dist/planck.min.js');
if (!fs.existsSync(vend)) { fs.mkdirSync(path.dirname(vend), { recursive: true }); fs.copyFileSync(nm, vend); }
function startServer() {
  return new Promise((res, rej) => {
    const s = cp.spawn(process.execPath, [path.join(ROOT, 'tools/serve.js'), '--port=' + PORT], { env: Object.assign({}, process.env, { ROBOCUS_NO_BROWSER: '1' }) });
    let out = ''; s.stdout.on('data', d => { out += d; const m = out.match(/http:\/\/127\.0\.0\.1:(\d+)\//); if (m) res({ s, base: 'http://127.0.0.1:' + m[1] + '/' }); });
    s.on('exit', c => rej(new Error('server ended ' + c + ': ' + out)));
  });
}
(async () => {
  const srv = await startServer(); process.on('exit', () => { try { srv.s.kill(); } catch (e) {} });
  const b = await chromium.launch();
  try {
    const ctx = await b.newContext(); await ctx.route(/cdn\.jsdelivr\.net|unpkg\.com/, r => r.abort());
    await ctx.addInitScript(() => { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 3 }); window.__noRender = true; });
    const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(srv.base + 'prototypes/tabletop-2.html?seed=3'); await p.waitForTimeout(7000);
    const out = await p.evaluate(async N => {
      const D = window.ROBOCUS_DEBUG, G = D.G; G.round = 11;
      const F = { format: 'duel', teams: [0, 1], sides: [0, 1], nSides: 2, arena: 'open', house: false,
        robots: [{ name: 'Gyro', level: 2, parts: ['booster', 'jammer', 'quantum'], rar: { booster: 2, jammer: 2 } }, { name: 'Scavenger', level: 3, parts: ['overdrive', 'weapon'] }] };
      const t0 = performance.now(), s = await D.simOdds(F, { ms: 1e9, n: N, stopN: 0 }), tw = performance.now() - t0;
      // the page itself, same seeds: the engine as the real fight uses it
      const m = D.buildFight(F, 1, false), bb = JSON.parse(JSON.stringify(m.bb)); bb.countdown = 0;
      let sd = ((11 * 7919 + [0, 1].reduce((a, t) => a * 31 + t + 1, 17)) ^ 0x5bd1e995) >>> 0; const page = [];
      for (let i = 0; i < N; i++) { sd = (Math.imul(sd, 1664525) + 1013904223) >>> 0; const S = window.DamageLab.create(Object.assign(JSON.parse(JSON.stringify(bb)), { seed: sd })); let g = 0; while (!S.over && g++ < 48000) { window.DamageLab.step(S); S.fx.length = 0; }
        page.push({ seed: sd, w: S.result ? String(D.winSide(F, S, m.botEnt)) : '-', t: Math.round(S.t * 10) / 10 }); }
      return { s: { n: s.n, wins: s.wins, how: s.how, per: s.per || null }, tw, page, pk: window.DamageLab.ARC.pk };
    }, N);
    const pw = {}; out.page.forEach(x => { pw[x.w] = (pw[x.w] || 0) + 1; });
    console.log(ROOT + ': helpers (' + out.s.how + ', ' + (out.tw / 1000).toFixed(0) + ' s): ' + out.s.n + ' fights, wins ' + JSON.stringify(out.s.wins));
    console.log('page, same ' + N + ' seeds: wins ' + JSON.stringify(pw) + '   (side 0 = Gyro)');
    if (out.s.per) { const per = out.s.per.split(' '); let same = 0; const diff = [];
      per.forEach((x, i) => { const [w, t] = x.split(':'); if (out.page[i] && out.page[i].w === w && Math.abs(out.page[i].t - +t) < 0.06) same++; else diff.push(i + ': helper ' + x + ', page ' + (out.page[i] ? out.page[i].w + ':' + out.page[i].t : '?')); });
      console.log('per seed: same winner and time on ' + same + ' of ' + per.length + (diff.length ? '; differ: ' + diff.slice(0, 5).join('; ') : ''));
    } else console.log('(this page does not log per-seed results)');
    if (errs.length) console.log('page errors', errs.slice(0, 3));
  } finally { await b.close(); srv.s.kill(); }
})().catch(e => { console.log('bookie-page-check failed: ' + (e && e.stack || e)); process.exit(2); });
