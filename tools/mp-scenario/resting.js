// T25 (Kev, 17 Nov: "it seems like my robot wrecker is permanently resting" / "I think I only was able to spare angler,
// not wrecker?"): resting robots say why and when they are back; the fate step says each robot's status and why the host
// decided. Solo, on one screen, at 1600x900 and 1280x720:
//   1. round 6 Intrigue: Rust Rivets plays Rogue Firmware on Wrecker: out, back in round 8 (banner, hover, log line);
//      Angler rests after a fight (fought this round · ready next Upkeep);
//   2. round 7 Upkeep: Wrecker still out (back in round 8, "nothing to do" / repairs still work), Angler ready again;
//   3. round 8 Upkeep: Wrecker ready again, its cause cleared;
//   4. a rival's robot out on its ticket (Steel Bolts plays Rogue Firmware on Rust Rivets);
//   5. the fate step: Angler at risk, Wrecker safe (Fan Favourite); a 2 Cr plea; the result line and why.
//   node tools/mp-scenario/resting.js [screenshotFolder]
const path = require('path'), fs = require('fs');
(async () => {
  const shots = process.argv[2]; if (shots) fs.mkdirSync(shots, { recursive: true });
  const b = await require('./launch.js')(require('playwright'));
  const PLK = require('../planck-local.js'), PL = PLK.find();
  const bad = [], errs = [];
  const shot = (p, n) => shots ? p.screenshot({ path: path.join(shots, n) }) : null;
  async function open(w, h) {
    const p = await b.newPage({ viewport: { width: w, height: h } }); p.on('pageerror', e => errs.push(w + 'x' + h + ': ' + e.message));
    await PLK.route(p, PL);
    await p.goto(require('url').pathToFileURL(path.resolve('prototypes/tabletop-2.html')).href + '?seed=11'); await p.waitForTimeout(800);
    await p.evaluate(() => { window.__noSlide = true; window.__noAuto = true; });
    await p.click('#pAct2'); await p.waitForTimeout(1500);
    return p;
  }
  // hover the help region whose title matches re (the tooltip shows), return its title and text
  async function hover(p, re) {
    await p.waitForTimeout(250);
    const pt = await p.evaluate(src => { const D = window.ROBOCUS_DEBUG, re = new RegExp(src); const h = D.helpRegions.slice().reverse().find(x => re.test(x.title || x.t || '')); if (!h) return null;
      const s = D.worldToScreen(h.x + h.w / 2, h.y + h.h / 2); return { x: s.x, y: s.y, title: h.title || h.t, body: h.body || h.html || h.text || '' }; }, re.source);
    if (pt) { await p.mouse.move(pt.x, pt.y); await p.waitForTimeout(500); }
    return pt;
  }
  const logTail = (p, n = 8) => p.evaluate(n => { const el = document.getElementById('logPanel'); return el ? el.innerText.split('\n').filter(Boolean).slice(-n) : []; }, n);
  const rob = (p, ti, k) => p.evaluate(([ti, k]) => { const D = window.ROBOCUS_DEBUG, r = D.G.teams[ti].robots[k]; if (!r) return null; const xi = r.exhausted ? D.exInfo(r) : null;
    return { name: r.name, ex: !!r.exhausted, sitOut: r.sitOut || 0, why: r.exWhy || null, by: r.exBy, back: xi && xi.back, line: xi && xi.line, round: D.G.round, phase: D.G.phase }; }, [ti, k]);

  for (const [w, h] of [[1600, 900], [1280, 720]]) {
    const p = await open(w, h), tag = w + 'x' + h;
    // Kev's garage: Wrecker (3 Fan tokens: a Fan Favourite) and Angler; round 6 Intrigue
    await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[0];
      const W = JSON.parse(JSON.stringify(t.robots[0])); W.name = 'Wrecker'; W.level = 0; W.wins = 3; W.wear = null; W.parts = []; W.exhausted = false; W.sitOut = 0;
      t.robots = [W]; t.fame = 5; G.teams[1].fame = 3; G.teams[2].fame = 3; G.teams[3].fame = 2;
      G.round = 6; G.phase = 'intrigue'; G.intrigueTurn = 1; G.pickBot = W.id; D.updateHud(); });
    await p.evaluate(async () => { const D = window.ROBOCUS_DEBUG, G = D.G, id = Object.keys(D.CARDS).find(k => D.CARDS[k].name === 'Rogue Firmware'); await D.resolveScheme(G.teams[1], id, G.teams[0]); G.pickBot = null;
      const t = G.teams[0], A = JSON.parse(JSON.stringify(t.robots[0])); A.id = 'T25-A'; A.uid = 'T25uA'; A.name = 'Angler'; A.level = 2; A.wins = 0; A.wear = null; A.sitOut = 0; A.exhausted = false; delete A.exWhy;
      t.robots.push(A); D.exhaustBot(A, 'fight', null); D.updateHud(); });
    let W = await rob(p, 0, 0), A = await rob(p, 0, 1);
    console.log(tag + ' round 6 Intrigue: ' + JSON.stringify(W) + ' | ' + JSON.stringify(A));
    if (!W.ex || W.sitOut !== 1 || W.back !== 8 || !/OUT · Rogue Firmware \(Rust Rivets\) · back in round 8/.test(W.line)) bad.push(tag + ': round 6 banner ' + W.line);
    if (!/RESTING · fought this round · ready next Upkeep/.test(A.line || '')) bad.push(tag + ': fought banner ' + A.line);
    const lg6 = await logTail(p, 6); console.log('  log: ' + lg6.filter(x => /Rogue Firmware/.test(x)).join(' / '));
    if (!lg6.some(x => /Rust Rivets played Rogue Firmware: Wrecker \(Steel Bolts\) misses this round's fight and next round's; back in round 8/.test(x))) bad.push(tag + ': no clear victim line in the log');
    await shot(p, tag + '-1-round6-firmware-and-fought.png');
    let hv = await hover(p, /^😴 Wrecker/); console.log('  hover: ' + (hv && hv.title));
    if (!hv || !/out until round 8/.test(hv.title)) bad.push(tag + ': hover title ' + (hv && hv.title));
    await shot(p, tag + '-1b-round6-hover.png');
    hv = await hover(p, /^😴 Angler/); await shot(p, tag + '-1c-fought-hover.png');

    // round 7 Upkeep: still out, back in round 8; Angler ready
    await p.mouse.move(5, 5);
    await p.evaluate(() => { const D = window.ROBOCUS_DEBUG; D.G.round = 7; D.startRound(); D.updateHud(); });
    await p.waitForTimeout(600);
    W = await rob(p, 0, 0); A = await rob(p, 0, 1);
    console.log(tag + ' round 7 ' + W.phase + ': ' + JSON.stringify(W) + ' | Angler ex ' + A.ex + ' why ' + A.why);
    if (!W.ex || W.sitOut !== 0 || W.back !== 8 || !/back in round 8/.test(W.line)) bad.push(tag + ': round 7 banner ' + W.line);
    if (A.ex || A.why) bad.push(tag + ': Angler not ready in round 7');
    const lg7 = await logTail(p, 12); const still = lg7.find(x => /still out/.test(x)); console.log('  log: ' + still);
    if (!still || !/comes back by itself in round 8/.test(still)) bad.push(tag + ': no "still out" line in round 7 Upkeep');
    await shot(p, tag + '-2-round7-upkeep.png');
    hv = await hover(p, /^😴 Wrecker: out until round 8/); await shot(p, tag + '-2b-round7-hover.png');
    const act = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG; return D.helpRegions.filter(x => /^😴 Wrecker/.test(x.title || x.t || '')).length; });
    if (act < 2) bad.push(tag + ': round 7 Upkeep: the action line does not explain the rest');

    // round 8 Upkeep: ready again
    await p.mouse.move(5, 5);
    await p.evaluate(() => { const D = window.ROBOCUS_DEBUG; D.G.round = 8; D.startRound(); D.updateHud(); });
    await p.waitForTimeout(400);
    W = await rob(p, 0, 0); console.log(tag + ' round 8 ' + W.phase + ': ' + JSON.stringify(W));
    if (W.ex || W.why) bad.push(tag + ': Wrecker not ready in round 8');

    // a rival's robot out on its ticket
    await p.evaluate(async () => { const D = window.ROBOCUS_DEBUG, G = D.G, id = Object.keys(D.CARDS).find(k => D.CARDS[k].name === 'Rogue Firmware'); G.phase = 'intrigue'; G.intrigueTurn = 0; await D.resolveScheme(G.teams[0], id, G.teams[1]); D.updateHud(); });
    const R1 = await rob(p, 1, 0); console.log(tag + ' rival: ' + JSON.stringify(R1));
    if (!R1.ex || R1.back !== 10 || !/Steel Bolts/.test(R1.line)) bad.push(tag + ': rival banner ' + R1.line);
    hv = await hover(p, new RegExp('^😴 ' + R1.name + ':')); console.log('  rival hover: ' + (hv && hv.title));
    await shot(p, tag + '-3-rival-ticket.png');
    await p.mouse.move(5, 5);

    // the fate step: host Rust Rivets (AI); Steel Bolts lost Angler (at risk) and Wrecker (Fan Favourite: safe); a 2 Cr plea
    let res = null;
    for (let tries = 0; tries < 8 && !(res && res.scrapped); tries++) {
      await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[0];
        const W = t.robots[0]; W.exhausted = false; delete W.exWhy; W.wins = 3;
        let A = t.robots.find(r => r.name === 'Angler'); if (!A) { A = JSON.parse(JSON.stringify(W)); A.id = 'T25-A' + Math.random().toString(36).slice(2, 6); A.name = 'Angler'; A.level = 2; A.wins = 0; t.robots.push(A); }
        t.credits = 13; t.fame = 5; G.teams[1].fame = 3; G.teams[3].fame = 2; G.teams[3].credits = 9;
        G.round = 9; G.phase = 'after'; G.host = 1; G.awaitingJudgment = false;
        const foe = G.teams[3].robots[0];
        G.fight = { teams: [0, 0, 3], sides: [0, 0, 1], robots: [A, W, foe], bets: [], loser: { team: 0, robot: A }, fateQueue: [{ team: 0, robot: W }], fateN: 2, fateI: 1, crateQueue: [], crateTxt: [], winner: { team: 3, robot: foe }, winners: [{ team: 3, robot: foe }] };
        D.fateIntro([{ ti: 0, r: A }, { ti: 0, r: W }]); D.updateHud(); D.fateStep(); });
      await p.waitForTimeout(700);
      await shot(p, tag + '-4-fate-plea' + (tries ? '-try' + tries : '') + '.png');
      const note = await p.evaluate(() => (document.getElementById('promptBar') || {}).innerText);
      console.log(tag + ' fate note: ' + JSON.stringify(note));
      if (!/Angler: the host decides; you can offer credits to spare it/.test(note || '') || !/Wrecker: safe \(Fan Favourite, can't be scrapped\)/.test(note || '')) bad.push(tag + ': fate note status');
      // the plea: +2 Cr, lock
      for (let k = 0; k < 2; k++) await p.click('#dealModal [data-cr="give"][data-d="1"]');
      await p.click('#dealModal [data-k="lock"]'); await p.waitForTimeout(900);
      res = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, el = document.getElementById('logPanel'), txt = el ? el.innerText : '';
        const lines = txt.split('\n').filter(Boolean); return { scrapped: !D.G.teams[0].robots.some(r => r.name === 'Angler'), why: lines.filter(x => /^.?\s*(👎|👍) Why Angler/.test(x) || /Why Angler/.test(x)).slice(-1)[0], offers: lines.filter(x => /Offers to the host/.test(x)).slice(-1)[0], safe: lines.filter(x => /Wrecker.*is safe/.test(x)).slice(-1)[0], status: lines.filter(x => /Your losing robots/.test(x)).slice(-1)[0] }; });
      console.log(tag + ' fate try ' + tries + ': ' + JSON.stringify(res));
    }
    if (!res || !res.why) bad.push(tag + ': no why line after the fate decision');
    if (res && res.scrapped && !/the host took .* to scrap over your 2 Cr to spare|the host turned down your 2 Cr to spare/.test(res.why || '')) bad.push(tag + ': why line wording: ' + res.why);
    await shot(p, tag + '-5-fate-result.png');
    await p.close();
  }
  await b.close();
  if (errs.length) bad.push('page errors: ' + errs.slice(0, 5).join(' | '));
  console.log(bad.length ? 'FAIL\n  ' + bad.join('\n  ') : 'OK');
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
