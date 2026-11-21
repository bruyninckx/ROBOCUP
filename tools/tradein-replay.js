// T52 (21 Nov 2026): replay an AI team's trade-in decisions from a playtest log. For every trade-in of --team in the log: its
// robots (name, level, parts, wins) and every rival's robots at that Market, the robot lot it won and the price, then what the
// AI values the lot at and which robot it would scrap, with the old rule (tiV2 0) and the new one (tiV2 1). Damage and wear are
// not in the log's roster lines, so robots are rebuilt as new (with their parts). Credits and fame as in the log.
//   node tools/tradein-replay.js --log=path/to/robocus2-playtest.json --team=3
'use strict';
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.slice(k.length + 3) : d; };
const LOG = arg('log', ''), TEAM = +arg('team', 3);
const PLK = require('./planck-local.js'), PL = PLK.find('');
(async () => {
  const E = JSON.parse(fs.readFileSync(LOG, 'utf8')).events;
  const cases = [], joined = {};   // robot name -> the round the team won its lot
  for (const m of E.filter(e => e.k === 'market')) {
    for (const l of m.lots) if (l.winner === TEAM && /^robot:/.test(l.id) && joined[l.id.slice(6)] == null) { /* set after this Market */ }
    const won = m.lots.filter(l => l.winner === TEAM && /^robot:/.test(l.id));
    if (!won.length) continue;
    const ph = E.filter(e => e.k === 'phase' && e.ph === 'market' && e.r === m.r && e.t <= m.t).pop() || E.filter(e => e.k === 'phase' && e.ph === 'market' && e.r === m.r)[0];
    const ti = E.find(e => e.k === 'trade_in' && e.r === m.r && e.team === TEAM);
    for (const l of won) cases.push({ joined: Object.assign({}, joined), r: m.r, lot: l.id.slice(6), price: l.price, bids: l.bids, teams: ph.teams.map(t => ({ fame: t.fame, cr: t.cr, sponsor: t.sponsor, robots: t.robots.map(r => ({ name: r.name, wins: r.wins, level: r.b && r.b.level, parts: (r.b && r.b.parts) || [], dmg: r.b && r.b.damage })) })), traded: ti ? ti.robot : null });
    for (const l of won) joined[l.id.slice(6)] = m.r;
  }
  const b = await chromium.launch(), p = await b.newPage(); await PLK.route(p, PL);
  await p.addInitScript(() => { window.__noRender = true; });
  await p.goto('file://' + path.resolve(__dirname, '../prototypes/tabletop-2.html') + '?seed=1'); await p.waitForTimeout(500);
  await p.click('#pAct2'); await p.waitForTimeout(300);
  const out = await p.evaluate(([cases, TEAM]) => {
    const D = window.ROBOCUS_DEBUG, G = D.G, res = [];
    for (const c of cases) {
      G.round = c.r;
      c.teams.forEach((T, i) => { const t = G.teams[i]; t.fame = T.fame; t.credits = T.cr; t.sponsor = T.sponsor;
        t.robots = T.robots.map(x => { const r = D.mkRobot(x.name); r.wins = x.wins || 0; r.parts = x.parts.slice(); if (i === TEAM && c.joined[x.name] != null) r.joinR = c.joined[x.name]; return r; }); });
      const t = G.teams[TEAM], id = D.robotLot(c.lot), o = {};
      for (const v of [0, 1]) { D.setAIP(TEAM, { tiV2: v }); const pick = D.aiTradeInPick(t); o['v' + v] = { want: +D.robotWant(t, id, 4).toFixed(2), scraps: pick && pick.name, keep: v ? +D.tiKeep(t, pick).toFixed(2) : null }; }
      res.push({ r: c.r, lot: c.lot, price: c.price, bids: c.bids, traded: c.traded, cr: c.teams[TEAM].cr, fame: c.teams.map(x => x.fame), robots: c.teams[TEAM].robots.map(x => x.name + ' L' + D.G.teams[TEAM].robots.find(r => r.name === x.name).level + ' w' + x.wins + (x.parts.length ? ' +' + x.parts.join('/') : '')).join(', '), old: o.v0, now: o.v1 });
    }
    return res;
  }, [cases, TEAM]);
  for (const x of out) console.log(JSON.stringify(x));
  await b.close();
})();
