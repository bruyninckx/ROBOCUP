// T73 (parts that fly off in the next-gen game): screenshots of a robot that lost its piece, in Upkeep (its card with the tag, the
// garage's repair offer in the note) and on the power map, at two screen sizes. Also checks the page's numbers on the way.
//   node tools/flyoff-game-shots.js [outDir=/home/claude/out] [robot=Gyro]   -> t73-<size>-card.png, -hover.png, -pmap.png, -repaired.png
const path = require('path'), fs = require('fs');
const OUT = process.argv[2] || '/home/claude/out', WHO = process.argv[3] || 'Gyro';
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await require('./mp-scenario/launch.js')(require('playwright'));
  const PLK = require('./planck-local.js'), PL = PLK.find(), errs = [], bad = [];
  for (const [w, h] of [[1280, 720], [1920, 1080]]) {
    const p = await b.newPage({ viewport: { width: w, height: h } }), tag = w + 'x' + h; p.on('pageerror', e => errs.push(tag + ': ' + e.message));
    await PLK.route(p, PL);
    await p.goto(require('url').pathToFileURL(path.resolve(__dirname, '../prototypes/tabletop-2.html')).href + '?seed=13'); await p.waitForTimeout(800);
    await p.evaluate(() => { window.__noSlide = true; window.__noAuto = true; try { localStorage.setItem('robocus.tips', JSON.stringify({ off: true })); } catch (e) {} });
    await p.click('#pAct2'); await p.waitForTimeout(1500);
    // our first robot becomes WHO (a level 2 robot by default) and has lost its piece in the last fight; 9 Cr, one free action
    const st = await p.evaluate(who => { const D = window.ROBOCUS_DEBUG, G = D.G, t = G.teams[0], r = t.robots[0];
      r.name = who; r.level = D.mkRobot(who).level; r.parts = []; delete r.leg; delete r.rar; r.wear = { parts: {}, lost: [], ints: {}, dents: {}, drones: [], fo: 1 };
      t.credits = 9; t.rep = { used: {}, free: 1 }; D.updateHud();
      const Z = D.zonesOf(r), z = Object.values(Z).find(q => q.piece);
      return { phase: G.phase, zone: z && z.key, tag: z && z.piece.tag, broken: z && z.broken, id: String(r.id) }; }, WHO);
    console.log(tag + ': ' + JSON.stringify(st)); if (!st.tag) bad.push(tag + ': no piece on the card');
    await p.waitForTimeout(600); await p.screenshot({ path: `${OUT}/t73-${tag}-card.png` });
    // hover the red tag: its help text
    const pt = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, hh = D.hitRegions.slice().reverse().find(x => x.kind === 'piece_tag'); return hh ? D.worldToScreen(hh.x + hh.w / 2, hh.y + hh.h / 2) : null; });
    if (!pt) bad.push(tag + ': no tag on the picture'); else { await p.mouse.move(pt.x, pt.y); await p.waitForTimeout(700); await p.screenshot({ path: `${OUT}/t73-${tag}-hover.png` }); }
    // the power map (M)
    await p.mouse.move(5, h - 5); await p.keyboard.press('m'); await p.waitForTimeout(2500); await p.screenshot({ path: `${OUT}/t73-${tag}-pmap.png` }); await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    // repair it like a broken zone: click the zone's FIX
    const fix = await p.evaluate(id => { const D = window.ROBOCUS_DEBUG, hh = D.hitRegions.slice().reverse().find(x => x.kind === 'zone_fix' && String(x.robot.id) === id && x.zone === 'weapon'); return hh ? D.worldToScreen(hh.x + hh.w / 2, hh.y + hh.h / 2) : null; }, st.id);
    if (!fix) bad.push(tag + ': no FIX on the zone'); else {
      const before = await p.evaluate(() => ({ cr: window.ROBOCUS_DEBUG.G.teams[0].credits }));
      await p.mouse.click(fix.x, fix.y); await p.waitForTimeout(800);
      const after = await p.evaluate(() => { const D = window.ROBOCUS_DEBUG, r = D.G.teams[0].robots[0]; return { cr: D.G.teams[0].credits, fo: r.wear && r.wear.fo, free: D.G.teams[0].rep.free }; });
      console.log(tag + ': repaired: credits ' + before.cr + ' -> ' + after.cr + ', free actions left ' + after.free + ', piece ' + (after.fo ? 'still lost' : 'back on'));
      if (after.fo) bad.push(tag + ': still lost after FIX'); await p.screenshot({ path: `${OUT}/t73-${tag}-repaired.png` });
    }
    await p.close();
  }
  console.log(errs.length ? 'page errors: ' + errs.join(' | ') : '0 page errors'); console.log(bad.length ? 'FAIL ' + bad.join('; ') : 'OK');
  await b.close();
})();
