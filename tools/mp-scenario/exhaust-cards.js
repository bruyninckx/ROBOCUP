// T34 (Kev, 20 Nov: "exhaust robots as well"): Crunch Week and Press Tour exhaust robots too, as their texts say. Solo, one screen:
//   1. Crunch Week, AI: all ready crew and Security Bots + its spare robots (never its strongest ready one), +1 Cr each;
//      an AI with one robot keeps it;
//   2. Crunch Week, you: a question with a tick per ready crew member, Security Bot and robot (T47: crew and bots ticked to start
//      with); the ticked robot is exhausted (+1 Cr), its banner says "RESTING · Crunch Week (you) · ready next Upkeep";
//      the ticks as they opened: the crew, no robot; "Exhaust nothing": nothing;
//   3. Press Tour, AI target: enough crew: no robot; 1 crew + 3 robots: its 2 weakest robots, +1 fame; 1 crew + 2 robots: says no;
//   4. Press Tour played by a rival on you (1 crew, 1 bot, 2 robots): one button per robot and "No thanks"; the robot you pick
//      rests ("Press Tour (Rust Rivets)"), +1 fame;
//   5. next Upkeep: every robot is ready again, the cause cleared.
//   node tools/mp-scenario/exhaust-cards.js [screenshotFolder]
const path = require('path'), fs = require('fs');
(async () => {
  const shots = process.argv[2]; if (shots) fs.mkdirSync(shots, { recursive: true });
  const b = await require('./launch.js')(require('playwright'));
  const PLK = require('../planck-local.js'), PL = PLK.find();
  const bad = [], errs = [];
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } }); p.on('pageerror', e => errs.push(e.message));
  await PLK.route(p, PL);
  await p.goto(require('url').pathToFileURL(path.resolve('prototypes/tabletop-2.html')).href + '?seed=11'); await p.waitForTimeout(800);
  await p.evaluate(() => { window.__noSlide = true; window.__noAuto = true; });
  await p.click('#pAct2'); await p.waitForTimeout(1500);
  const shot = n => shots ? p.screenshot({ path: path.join(shots, n) }) : null;
  const ok = (c, msg) => { if (!c) bad.push(msg); };
  // a team as the test wants it: robots (names and levels, weakest first), crew count, Security Bots
  const setTeam = (ti, bots, crew, sec) => p.evaluate(([ti, bots, crew, sec]) => {
    const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[ti], base = JSON.parse(JSON.stringify(G.teams[0].robots[0] || G.teams[ti].robots[0]));
    t.robots = bots.map(([name, level], k) => { const r = JSON.parse(JSON.stringify(base)); r.id = 'T34-' + ti + '-' + k; r.uid = 'T34u' + ti + k; r.name = name; r.level = level; r.wins = 0; r.wear = null; r.parts = []; r.exhausted = false; r.sitOut = 0; delete r.exWhy; delete r.exBy; return r; });
    t.crew = Array.from({ length: crew }, (_, k) => ({ uid: 9000 + ti * 10 + k, kind: 'mechanic' })); t.mechs = crew; t.exMechs = 0; t.secBots = sec; t.exSec = 0; t.credits = 3; t.fame = 3;
    D.updateHud(); }, [ti, bots, crew, sec]);
  const state = ti => p.evaluate(ti => { const D = window.ROBOCUS_DEBUG, t = D.G.teams[ti];
    return { cr: t.credits, fame: t.fame, exMechs: t.exMechs || 0, exSec: t.exSec || 0, robots: t.robots.map(r => ({ name: r.name, ex: !!r.exhausted, line: r.exhausted ? D.exInfo(r).line : null, line1: r.exhausted ? D.exInfo(r, 1).line : null, help: r.exhausted ? D.exInfo(r).help : null })) }; }, ti);
  const play = (fi, card, ti) => p.evaluate(([fi, card, ti]) => { const D = window.ROBOCUS_DEBUG, G = D.G, id = Object.keys(D.CARDS).find(k => D.CARDS[k].name === card);
    window.__done = false; window.__p = D.resolveScheme(G.teams[fi], id, G.teams[ti]).then(() => { window.__done = true; D.updateHud(); }); }, [fi, card, ti]);
  const done = async () => { for (let k = 0; k < 40 && !(await p.evaluate(() => window.__done)); k++) await p.waitForTimeout(150); return p.evaluate(() => window.__done); };
  const logTail = (n = 6) => p.evaluate(n => { const el = document.getElementById('logPanel'); return el ? el.innerText.split('\n').filter(Boolean).slice(-n) : []; }, n);
  // the open question (note or box): its text and buttons; click(label re), tick robots
  const question = () => p.evaluate(() => { const box = [...document.querySelectorAll('#ivModal:not([hidden]), #promptBar')].find(e => e.querySelector('button') && /Crunch Week|Press Tour/.test(e.innerText));
    return box ? { text: box.innerText, buttons: [...box.querySelectorAll('button')].map(x => x.innerText.trim()) } : null; });
  const click = async re => { await p.waitForTimeout(1000); const h = await p.evaluateHandle(src => { const re = new RegExp(src); return [...document.querySelectorAll('#ivModal:not([hidden]) button, #promptBar button')].find(x => re.test(x.innerText)) || null; }, re.source);
    const el = h.asElement(); if (!el) { bad.push('no button ' + re); return; } await p.mouse.move(5, 5); await el.click(); };

  await p.evaluate(() => { const G = window.ROBOCUS_DEBUG.G; G.round = 6; G.phase = 'intrigue'; G.intrigueTurn = 1; });

  // 1. Crunch Week, AI (Rust Rivets): 2 crew, 1 bot, 3 robots -> +3 + 2 spare robots = +5; the strongest stays ready
  await setTeam(1, [['Rumbler', 0], ['Pincher', 2], ['Hydra', 3]], 2, 1);
  await play(1, 'Crunch Week', 1); ok(await done(), '1: Crunch Week AI did not finish');
  let s = await state(1); console.log('1 Crunch Week AI: ' + JSON.stringify(s.robots.map(r => [r.name, r.ex])) + ' cr ' + s.cr + ' crew ' + s.exMechs + ' bots ' + s.exSec);
  console.log('  ' + (await logTail(2)).join(' / ')); console.log('  banner (you = seat 0): ' + s.robots[0].line + ' | seen by Rust Rivets: ' + s.robots[0].line1);
  ok(s.cr === 3 + 5 && s.exMechs === 2 && s.exSec === 1, '1: credits/crew ' + JSON.stringify(s));
  ok(s.robots.filter(r => r.ex).length === 2 && !s.robots.find(r => r.name === 'Hydra').ex, '1: the AI should keep its strongest robot ' + JSON.stringify(s.robots));
  ok(/RESTING · Crunch Week \(Rust Rivets\) · ready next Upkeep/.test(s.robots[0].line) && /RESTING · Crunch Week \(you\) · ready next Upkeep/.test(s.robots[0].line1), '1: banner ' + s.robots[0].line + ' / ' + s.robots[0].line1);
  // AI with one robot keeps it
  await setTeam(1, [['Rumbler', 0]], 1, 0); await play(1, 'Crunch Week', 1); await done(); s = await state(1);
  console.log('1b Crunch Week AI, one robot: ex ' + s.robots[0].ex + ' cr ' + s.cr); ok(!s.robots[0].ex && s.cr === 4, '1b: only robot exhausted or wrong pay');

  // 2. Crunch Week, you: 1 crew, 0 bots, Wrecker + Angler; tick Wrecker
  await setTeam(0, [['Wrecker', 0], ['Angler', 2]], 1, 0);
  await play(0, 'Crunch Week', 0); await p.waitForTimeout(1200);
  let q = await question(); console.log('2 question: ' + (q && q.text.replace(/\s+/g, ' ').slice(0, 400)) + ' | buttons ' + (q && q.buttons.join(' / ')));
  ok(q && /Wrecker/.test(q.text) && /Angler/.test(q.text) && /can't fight this round/.test(q.text), '2: question does not list the robots / the cost');
  await shot('t34-1-crunch-question.png');
  await p.evaluate(() => { const x = [...document.querySelectorAll('#ivModal input[type=checkbox]')].find(c => /Wrecker/.test(c.parentElement.innerText)); if (x) x.checked = true; });
  await click(/Exhaust the ticked/); ok(await done(), '2: Crunch Week did not finish');
  s = await state(0); console.log('2 Crunch Week you: ' + JSON.stringify(s.robots.map(r => [r.name, r.ex])) + ' cr ' + s.cr + ' | ' + (await logTail(1)).join(''));
  console.log('  banner: ' + s.robots[0].line + ' | seen by Rust Rivets: ' + s.robots[0].line1 + '\n  help: ' + s.robots[0].help);
  ok(s.cr === 3 + 2 && s.robots[0].ex && !s.robots[1].ex, '2: tick Wrecker ' + JSON.stringify(s));
  ok(/RESTING · Crunch Week \(you\) · ready next Upkeep/.test(s.robots[0].line || ''), '2: banner ' + s.robots[0].line);
  ok(/RESTING · Crunch Week \(Steel Bolts\) · ready next Upkeep/.test(s.robots[0].line1 || ''), '2: banner seen by a rival ' + s.robots[0].line1);
  await shot('t34-2-crunch-banner.png');
  // "No robots"
  await setTeam(0, [['Wrecker', 0], ['Angler', 2]], 1, 0); await play(0, 'Crunch Week', 0); await p.waitForTimeout(1200);
  // T47: crew and bots are ticks too (ticked to start with): the ticks as they open = the crew member, no robots
  q = await question(); ok(q && /Mechanic/.test(q.text), '2b: the crew member has no tick');
  await click(/Exhaust the ticked/); await done(); s = await state(0); console.log('2b as opened (crew ticked, no robots): ' + JSON.stringify(s.robots.map(r => [r.name, r.ex])) + ' cr ' + s.cr + ' crew ' + s.exMechs);
  ok(s.cr === 4 && s.exMechs === 1 && !s.robots.some(r => r.ex), '2b: as opened ' + JSON.stringify(s));
  await setTeam(0, [['Wrecker', 0], ['Angler', 2]], 1, 0); await play(0, 'Crunch Week', 0); await p.waitForTimeout(1200);
  await click(/^Exhaust nothing/); await done(); s = await state(0); console.log('2c exhaust nothing: cr ' + s.cr + ' crew ' + s.exMechs);
  ok(s.cr === 3 && !s.exMechs && !s.robots.some(r => r.ex), '2c: Exhaust nothing ' + JSON.stringify(s));

  // 3. Press Tour on an AI target (Moss Gears)
  await setTeam(2, [['Rumbler', 0], ['Pincher', 2]], 3, 0); await play(2, 'Press Tour', 2); await done(); s = await state(2);
  console.log('3a Press Tour AI, 3 crew: fame ' + s.fame + ' crew ' + s.exMechs + ' robots ' + JSON.stringify(s.robots.map(r => r.ex)));
  ok(s.fame === 4 && s.exMechs === 3 && !s.robots.some(r => r.ex), '3a: enough crew, robot exhausted or no fame');
  await setTeam(2, [['Rumbler', 0], ['Pincher', 2], ['Hydra', 3]], 1, 0); await play(2, 'Press Tour', 2); await done(); s = await state(2);
  console.log('3b Press Tour AI, 1 crew 3 robots: fame ' + s.fame + ' ' + JSON.stringify(s.robots.map(r => [r.name, r.ex])) + ' | ' + (await logTail(1)).join(''));
  ok(s.fame === 4 && s.exMechs === 1 && s.robots[0].ex && s.robots[1].ex && !s.robots[2].ex, '3b: ' + JSON.stringify(s));
  ok(/RESTING · Press Tour \(Moss Gears\) · ready next Upkeep/.test(s.robots[0].line || ''), '3b: banner ' + s.robots[0].line);
  await setTeam(2, [['Rumbler', 0], ['Pincher', 2]], 1, 0); await play(2, 'Press Tour', 2); await done(); s = await state(2);
  console.log('3c Press Tour AI, 1 crew 2 robots: fame ' + s.fame + ' ' + JSON.stringify(s.robots.map(r => r.ex)) + ' | ' + (await logTail(1)).join(''));
  ok(s.fame === 3 && !s.exMechs && !s.robots.some(r => r.ex), '3c: should say no');

  // 4. Press Tour played by Rust Rivets on you: 1 crew, 1 bot, Wrecker + Angler
  await setTeam(0, [['Wrecker', 0], ['Angler', 2]], 1, 1);
  await play(1, 'Press Tour', 0); await p.waitForTimeout(1200);
  q = await question(); console.log('4 question: ' + (q && q.text.replace(/\s+/g, ' ').slice(0, 400)) + ' | buttons ' + (q && q.buttons.join(' / ')));
  ok(q && q.buttons.some(x => /Exhaust Wrecker/.test(x)) && q.buttons.some(x => /Exhaust Angler/.test(x)) && q.buttons.some(x => /No thanks/.test(x)), '4: buttons ' + (q && q.buttons));
  await shot('t34-3-press-question.png');
  await click(/Exhaust Wrecker/); ok(await done(), '4: Press Tour did not finish');
  s = await state(0); console.log('4 Press Tour on you: fame ' + s.fame + ' crew ' + s.exMechs + ' bots ' + s.exSec + ' ' + JSON.stringify(s.robots.map(r => [r.name, r.ex])) + ' | ' + (await logTail(1)).join(''));
  console.log('  banner: ' + s.robots[0].line + ' | seen by Rust Rivets: ' + s.robots[0].line1 + '\n  help: ' + s.robots[0].help);
  ok(s.fame === 4 && s.exMechs === 1 && s.exSec === 1 && s.robots[0].ex && !s.robots[1].ex, '4: ' + JSON.stringify(s));
  ok(/RESTING · Press Tour \(Rust Rivets\) · ready next Upkeep/.test(s.robots[0].line || '') && /RESTING · Press Tour \(you\)/.test(s.robots[0].line1 || ''), '4: banner ' + s.robots[0].line + ' / ' + s.robots[0].line1);
  await shot('t34-4-press-banner.png');

  // 5. next Upkeep: all ready again
  await p.evaluate(() => { const D = window.ROBOCUS_DEBUG; D.G.round = 7; D.startRound(); D.updateHud(); }); await p.waitForTimeout(600);
  const all = await p.evaluate(() => window.ROBOCUS_DEBUG.G.teams.flatMap(t => t.robots.map(r => r.name + (r.exhausted ? ':ex(' + r.exWhy + ')' : ''))));
  console.log('5 round 7 Upkeep: ' + all.join(', ')); ok(!all.some(x => /:ex/.test(x)), '5: still exhausted next Upkeep');

  if (errs.length) bad.push('page errors: ' + errs.slice(0, 3).join(' | '));
  console.log(bad.length ? 'FAIL\n  ' + bad.join('\n  ') : 'OK');
  await b.close(); process.exit(bad.length ? 1 : 0);
})();
