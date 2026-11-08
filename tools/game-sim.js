// Whole-game simulation: all 4 teams AI, no drawing, many games in parallel. Measures game length, Intrigue use,
// live cards, credit flow, attacks, fame sources; on 2.0 also repairs, zone damage, fight cards, robot levels,
// bookie calibration, scraps and timing. Results go to sims/<tag>.json; compare with tools/game-sim-report.js.
//   node tools/game-sim.js --tag=start4 --games=200 --par=8 --start=4 --win=12
//   node tools/game-sim.js --page=prototypes/tabletop-2.html --tag=v2base --games=40 --par=2
// Options: --games (default 100), --par (parallel games, default 4; about your number of CPU cores),
//          --start (start fame, e.g. 0, 1, 2, 4, 7; default: the page's own (2.0: 0, BAL.startFame; 1.0: 4)),
//          --win (fame to win, default 12), --seed0 (first seed, default 1),
//          --bal='{"repair":{"brokenTwo":true}}' (2.0: deep-merged into the page's BAL settings via ?bal=; see docs/robocus-2.0-sim.md),
//          --balFile=path.json (the same from a file; --bal is merged on top),
//          --ai (v2 or v1, default v2), --page (default prototypes/tabletop-prototype.html),
//          --planck (local planck.min.js for 2.0 when the CDN can't be reached; default: node_modules/planck, then
//          vendor/planck-1.4.3.min.js; --planck=cdn always uses the network), --maxRound (give up after, default 40)
// The same seeds in two runs = the same shuffles to start with, so two settings compare like for like.
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const N = +arg('games', 100), PAR = +arg('par', 4), START = arg('start', null) == null ? null : +arg('start'), WIN = +arg('win', 12), SEED0 = +arg('seed0', 1);
const AIV = +String(arg('ai', 'v2')).replace(/\D/g, ''), PAGE = arg('page', 'prototypes/tabletop-prototype.html'), MAXR = +arg('maxRound', 40);
// BAL overrides (2.0): --balFile, then --bal on top; --start also goes in as BAL.startFame
const BALF = arg('balFile', null), BAL = (() => {
  const o = {}, merge = (a, b) => { for (const k in b) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') merge(a[k], b[k]); else a[k] = b[k]; } return a; };
  if (BALF) merge(o, JSON.parse(fs.readFileSync(BALF, 'utf8')));
  if (arg('bal', null)) merge(o, JSON.parse(arg('bal')));
  if (START != null) o.startFame = START;
  return o;
})();
const TAG = arg('tag', 's' + (START == null ? 'def' : START) + '_w' + WIN), OUTD = path.join(process.cwd(), 'sims');
fs.mkdirSync(OUTD, { recursive: true });

// 2.0 loads planck from cdn.jsdelivr.net; serve a local copy instead (offline / proxied machines), same version
const PLANCK = (() => {
  const a = arg('planck', ''); if (a === 'cdn') return null;
  for (const f of [a, 'node_modules/planck/dist/planck.min.js', path.join(__dirname, '..', 'vendor', 'planck-1.4.3.min.js')]) if (f && fs.existsSync(f)) return fs.readFileSync(f);
  return null;
})();

// Runs in the page before the game starts: watches what the 2.0 game does without changing it. Repairs (Repair2.repairZone
// and the team's repair state: free action / crew / credits), fight entrants (strength + zone damage at fight_start),
// engine time per fight (DamageLab.step), damaged zones before/after each Upkeep. Everything lands in window.__sim.
function installHooks() {
  if (window.__sim) return;
  const D = window.ROBOCUS_DEBUG, R2 = window.Repair2, DL = window.DamageLab;
  const X = window.__sim = { reps: [], ups: [], fights: [], scraps: [], tradeIns: [], stepMs: 0, steps: 0, fightWall: [], hookErrs: [], house: [] };
  const G = () => D.G;
  const sumUsed = rep => rep && rep.used ? Object.values(rep.used).reduce((a, b) => a + (b || 0), 0) : 0;
  const zoneSum = r => { const Z = D.zonesOf(r), o = {}; for (const k of ['drive', 'weapon', 'body']) o[k] = Z[k] ? (Z[k].broken ? 'broken' : Z[k].damaged ? 'damaged' : 'ok') : 'ok'; return o; };
  const teamDamage = t => { const o = { drive: 0, weapon: 0, body: 0, broken: 0 }; for (const r of t.robots) { const z = zoneSum(r); for (const k in z) if (z[k] !== 'ok') { o[k]++; if (z[k] === 'broken') o.broken++; } } return o; };
  let lastRepTeam = null; const snap = {};
  X.hookTeams = () => {
    for (const t of G().teams) {
      if (t.__h) continue;
      let rep = t.rep; Object.defineProperty(t, '__h', { value: 1, enumerable: false });
      Object.defineProperty(t, 'rep', { enumerable: true, configurable: true, get() { return rep; }, set(v) {
        rep = v; lastRepTeam = t.i;
        try { // a new Upkeep for this team: what it has to work with
          snap[t.i] = { free: v.free || 0, used: sumUsed(v), cr: t.credits };
          X.ups.push({ r: G().round, team: t.i, free: v.free || 0, crew: t.crew.length, cr: t.credits, robots: t.robots.length, dmg: teamDamage(t) });
        } catch (e) { X.hookErrs.push('rep: ' + e.message); }
      } });
    }
  };
  if (R2 && R2.repairZone) {
    const orig = R2.repairZone;
    R2.repairZone = function (spec, key) {
      try {
        const g = G(); let ti = lastRepTeam;
        const wj = JSON.stringify(spec.wear || null), byWear = g.teams.find(t => t.robots.some(r => JSON.stringify(r.wear || null) === wj));
        if (ti == null && byWear) ti = byWear.i;
        const t = g.teams[ti], s = snap[ti] || {}, rep = t.rep || {};
        const now = { free: rep.free || 0, used: sumUsed(rep), cr: t.credits };
        const how = now.free < (s.free != null ? s.free : now.free) ? 'free' : now.used > (s.used != null ? s.used : now.used) ? 'crew' : now.cr <= (s.cr != null ? s.cr : now.cr) - 2 ? 'credits' : 'unknown';
        snap[ti] = now;
        const z = R2.zones(spec)[key];
        X.reps.push({ r: g.round, ph: g.phase, team: ti, zone: key, how, broken: !!(z && z.broken), robot: spec.name });
      } catch (e) { X.hookErrs.push('repair: ' + e.message); }
      return orig.apply(this, arguments);
    };
  }
  if (DL && DL.step) {   // engine time: wall time inside DamageLab.step and from a fight's first to its last step
    const orig = DL.step; let curS = null, t0 = 0, tl = 0, n = 0, hs = null;
    // the House Robot (Big Mallet): swings, hits, damage per hit, how often other robots are within 1.5 m of it
    const close = () => { if (curS) { X.fightWall.push({ ms: tl - t0, steps: n }); if (hs) X.house.push(hs); } hs = null; };
    X.closeFight = close;
    DL.step = function (S) {
      const a = performance.now();
      if (S !== curS) { close(); curS = S; t0 = a; n = 0; }
      const r = orig.apply(this, arguments); tl = performance.now(); X.stepMs += tl - a; X.steps++; n++;
      try {
        const H = S.house;
        if (H && H.l4) {
          if (!hs) hs = { swings: 0, hits: 0, dmg: [], near: 0, nearN: 0, last: null };
          const ls = H.l4.lastSlam; if (ls && ls !== hs.last) { hs.last = ls; hs.swings++; if (ls.hit) { hs.hits++; hs.dmg.push(Math.round(H.stats.dealt - ls.dealt0)); } }
          if (S.step % 12 === 0 && H.alive) { const hp = H.body.getPosition(); for (const R of S.robots) if (R !== H && R.alive) { const q = R.body.getPosition(); hs.nearN++; if (Math.hypot(q.x - hp.x, q.y - hp.y) < 1.5) hs.near++; } }
        }
      } catch (e) { X.hookErrs.push('house: ' + e.message); }
      return r;
    };
  }
  // the event log: add what the bookie and the zones looked like when a fight starts; damage left after Upkeep
  const hookEvents = () => {
    const ev = D.PT.game && D.PT.game.events; if (!ev || ev.__h) return;
    Object.defineProperty(ev, '__h', { value: 1, enumerable: false });
    const push = ev.push;
    ev.push = function (e) {
      try {
        const g = G();
        if (e && e.k === 'fight_start' && g.fight) {
          const F = g.fight;
          e.x2 = F.teams.map((ti, i) => { const r = F.robots[i]; return r ? { team: ti, side: F.sides[i], name: r.name, level: r.level, parts: (r.parts || []).length + (r.leg ? 1 : 0), s: D.str2(r), z: zoneSum(r), face: (r.faceDown || []).length } : null; });
          e.house = !!F.house;
        }
        if (e && e.k === 'market') e.fameNow = g.teams.map(t => t.fame);   // fame when the lots are sold (who buys level 4: leader or not)
        if (e && e.k === 'phase' && e.ph === 'intrigue') {
          if (!X.ups.some(u => u.r === g.round && u.after)) for (const t of g.teams) { const u = X.ups.filter(u => u.r === g.round && u.team === t.i).pop(); if (u) { u.after = teamDamage(t); u.crAfter = t.credits; } }
        }
        if (e && e.k === 'msg' && /scrap/i.test(e.text || '')) {
          if (/Host scrapped/.test(e.text) && g.fight && g.fight.loser) X.scraps.push({ r: g.round, team: g.fight.loser.team, robot: g.fight.loser.robot.name, why: 'host', host: g.host });
          else if (/can't pay its upkeep and scraps/.test(e.text)) { const t = g.teams.find(t => e.text.includes(t.name)); X.scraps.push({ r: g.round, team: t ? t.i : -1, why: 'debt' }); }
        }
        if (e && e.k === 'trade_in') X.tradeIns.push({ r: e.r, team: e.team, robot: e.robot, level: e.level, cr: e.cr, parts: e.parts, got: e.got });
        if (e && e.k === 'msg' && /has no robots left/.test(e.text || '')) X.scraps.push({ r: g.round, why: 'none-left', team: (g.teams.find(t => e.text.includes(t.name)) || {}).i });
      } catch (err) { X.hookErrs.push('event: ' + err.message); }
      return push.apply(this, arguments);
    };
  };
  X.hookEvents = hookEvents; hookEvents();
  try { X.hookTeams(); } catch (e) { X.hookErrs.push('teams: ' + e.message); }
}

(async () => {
  const b = await chromium.launch(); const res = []; let next = SEED0, done = 0; const t0 = Date.now();
  async function one(seed) {
    const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = [], g0 = Date.now();
    p.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' | ')));
    p.on('requestfailed', q => { if (/\.js(\?|$)/.test(q.url())) errs.push('load failed: ' + q.url() + ' ' + (q.failure() || {}).errorText); });
    try {
      if (PLANCK) await p.route(/planck(\.min)?\.js/, r => r.fulfill({ contentType: 'application/javascript', body: PLANCK }));
      await p.addInitScript(() => { window.__noRender = true; });
      await p.goto('file://' + path.resolve(PAGE) + '?seed=' + seed + (Object.keys(BAL).length ? '&bal=' + encodeURIComponent(JSON.stringify(BAL)) : '')); await p.waitForTimeout(150);
      const v2 = await p.evaluate(() => !!window.Repair2);
      if (v2 && !(await p.evaluate(() => !!window.planck))) throw new Error('planck.js did not load (pass --planck=<file>)');
      await p.evaluate(([v, start, win]) => {
        const D = window.ROBOCUS_DEBUG; D.ai({ versions: [v, v, v, v] }); D.tune({ win });
        if (start == null) return;
        const s = document.getElementById('pFame'); if (s) { if (![...s.options].some(o => +o.value === start)) s.add(new Option(start, start)); s.value = String(start); s.dispatchEvent(new Event('change')); }
        else { D.G.startFame = start; D.G.teams.forEach(t => { t.fame = start; }); }
      }, [AIV, START, WIN]);
      if (v2) await p.evaluate(installHooks);
      await p.click('#pAct2'); await p.evaluate(() => window.ROBOCUS_DEBUG.autopilot(true));
      let last = '', same = 0, stall = false;
      for (let i = 0; i < 40000; i++) {
        const st = await p.evaluate(maxR => { const D = window.ROBOCUS_DEBUG, G = D.G; if (window.__sim) { window.__sim.hookEvents(); window.__sim.hookTeams(); } if (G.over || G.round > maxR) return null; const btn = document.getElementById('pAct2') || document.getElementById('pAct1'); if (btn && !btn.disabled) btn.click(); const m = document.querySelector('#ivModal:not([hidden]) button'); if (m) m.click(); return G.round + ':' + G.phase + ':' + (G.marketStage || '') + ':' + G.teams.map(t => t.fame + '/' + t.credits).join(','); }, MAXR);
        if (!st) break; same = st === last ? same + 1 : 0; last = st; if (same > 600) { stall = true; break; } await p.waitForTimeout(5);
      }
      const r = await p.evaluate(() => {
        const D = window.ROBOCUS_DEBUG, G = D.G, ev = D.PT.game.events, C = D.CARDS_ALL();
        const w = G.teams.slice().sort((a, b) => b.fame - a.fame || b.credits - a.credits)[0];
        const ups = {}; ev.filter(e => e.k === 'phase' && e.ph === 'upkeep').forEach(e => { if (!ups[e.r]) ups[e.r] = { fame: e.teams.map(t => t.fame), cr: e.teams.map(t => t.cr), robots: e.teams.map(t => t.robots.length), hand: e.teams.map(t => t.hand) }; });
        const fights = ev.filter(e => e.k === 'fight_start' && !e.fid);
        const fends = ev.filter(e => e.k === 'fight_end' && !e.sandbox && !e.fid);
        const market = ev.filter(e => e.k === 'market').map(e => e.lots.reduce((a, l) => a + (l.winner != null && l.winner >= 0 ? (l.price || 0) : 0), 0));
        const betCr = fights.reduce((a, f) => a + (f.bets || []).reduce((s, x) => s + (x && (x.amt || x.amount) || 0), 0), 0);
        const auctions = ev.filter(e => e.k === 'card_auction');
        const out = { startFame: G.startFame, bal: D.BAL ? JSON.parse(JSON.stringify(D.BAL)) : null, over: G.over, round: G.round, winner: G.over ? w.i : -1, fame: G.teams.map(t => t.fame), cr: G.teams.map(t => t.credits),
          fameBy: G.teams.map(t => t.fameBy || {}), ups, cstat: G.cstat || {}, cash: Object.fromEntries(Object.keys(G.cstat || {}).map(id => [id, C[id] ? { cash: C[id].cash, fam: C[id].fam, name: C[id].name, live: C[id].phase === 'fight', harmful: !!C[id].harmful, auction: !!C[id].auction } : null])),
          deckSize: D.DECK().length, fights: fights.length, fightCards: fends.map(f => (f.log || []).filter(x => x.k === 'card').length),
          formats: fights.map(f => f.format), marketCr: market, betCr, hostBids: ev.filter(e => e.k === 'host_bid').length,
          auctions: auctions.map(a => ({ r: a.r, cards: a.cards, wins: a.wins })), errs: D.PT.errs,
          errEvents: ev.filter(e => e.k === 'error').map(e => ({ msg: e.msg, n: e.n, stack: (e.stack || '').split('\n').slice(0, 3).join(' | ') })) };
        const X = window.__sim;
        if (X) {   // 2.0
          if (X.closeFight) X.closeFight();
          const L = D.LOTS;
          const fstarts = ev.filter(e => e.k === 'fight_start'), fe = ev.filter(e => e.k === 'fight_end');
          out.v2 = {
            reps: X.reps, ups: X.ups, scraps: X.scraps, tradeIns: X.tradeIns, hookErrs: X.hookErrs.slice(0, 10),
            fightsX: fstarts.map((e, i) => ({ r: e.r, format: e.format, mode: e.mode, house: !!e.house, p: e.p, x2: e.x2, bets: (e.bets || []).map(b => ({ team: b.team, side: b.side, amt: b.amt })),
              win: fe[i] ? fe[i].winSide : null, how: fe[i] ? fe[i].how : null, time: fe[i] ? fe[i].time : null })),
            lots: ev.filter(e => e.k === 'market').flatMap(e => e.lots.map(l => { const x = L[l.id] || {}; return { r: e.r, id: l.id, winner: l.winner, price: l.price || 0, kind: x.robot ? 'robot' : x.crew ? 'crew' : x.part ? (x.kind || 'part') : 'other', level: x.robot ? (window.Lineup && (Lineup.ROBOTS[x.starter || x.name] || (Lineup.ROBOTS4 || {})[x.starter || x.name] || [0])[0]) : null, name: x.name, fame: e.fameNow || null }; })),
            house: (X.house || []).map(h => ({ swings: h.swings, hits: h.hits, dmg: h.dmg, near: h.near, nearN: h.nearN })),
            live: ev.filter(e => e.k === 'live_card').map(e => ({ r: e.r, team: e.team, id: e.id, type: e.type, t: e.t })),
            stepMs: X.stepMs, steps: X.steps, fightWall: X.fightWall,
            robotsEnd: G.teams.map(t => t.robots.map(r => ({ name: r.name, level: r.level, parts: (r.parts || []).length + (r.leg ? 1 : 0) }))),
            hostScrap: X.scraps.filter(s => s.why === 'host').length
          };
        }
        return out;
      });
      r.seed = seed; r.stall = stall; r.pageErrs = errs.slice(0, 5); r.pageErrN = errs.length; r.sec = (Date.now() - g0) / 1000; res.push(r);
    } catch (e) { res.push({ seed, crash: e.message, pageErrs: errs.slice(0, 5), sec: (Date.now() - g0) / 1000 }); }
    await p.close();
    done++; if (done % 5 === 0 || done === N) process.stdout.write('\r' + TAG + ': ' + done + '/' + N + ' games, ' + ((Date.now() - t0) / 60000).toFixed(1) + ' min   ');
  }
  await Promise.all(Array.from({ length: PAR }, async () => { while (next < SEED0 + N) await one(next++); }));
  const file = path.join(OUTD, TAG + '.json');
  const ok = res.find(r => r.startFame != null), balFull = ok && ok.bal; res.forEach(r => { delete r.bal; });   // the page's whole BAL: once per file
  fs.writeFileSync(file, JSON.stringify({ tag: TAG, start: START != null ? START : ok ? ok.startFame : null, bal: BAL, balFile: BALF, balFull, win: WIN, ai: AIV, page: PAGE, par: PAR, games: N, at: new Date().toISOString(), min: (Date.now() - t0) / 60000, res }));
  console.log('\nsaved ' + file + '  (summary: node tools/game-sim-report.js ' + TAG + ')');
  await b.close();
})();
