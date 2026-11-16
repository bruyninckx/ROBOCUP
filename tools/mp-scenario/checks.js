// The fixed checks in one go (15 Nov): every single-situation test, the card test (73 cards and 10 answers, host against
// joined), the old bot game, and the fights in every browser engine. One line per check; the full text of each goes to
// playtests/click-runs/checks/<name>.txt and the lines to playtests/click-runs/latest-checks.txt.
//   node tools/mp-scenario/checks.js
const { spawn } = require('child_process');
const fs = require('fs'), path = require('path');
const out = path.join('playtests', 'click-runs', 'checks'); fs.mkdirSync(out, { recursive: true });
const S = n => path.join(__dirname, n + '.js');
const list = [
  ['cards', [S('cards'), '7'], {}, 'every card dragged on a host and a joined screen'],
  ['reaction', [S('reaction')], {}, 'the reaction window'],
  ['logs', [S('logs')], {}, 'all four logs in one file, report a problem'],
  ['backing', [S('backing')], {}, 'a joined player asks for backing'],
  ['decline', [S('decline')], {}, 'declining with nobody to step in'],
  ['waiting', [S('waiting')], {}, 'the "waiting for" banner'],
  ['fight-panels', [S('fight-panels')], {}, 'damage panels after a fight replay'],
  ['bot-game', [path.join(__dirname, '..', 'mp-test.js'), '3', '5', '30'], { PAGE: 'tabletop-2.html' }, 'a whole online game by the bots, fights compared'],
  ['fight-engines', [path.join(__dirname, '..', 'fight-engines.js'), '300'], {}, '300 fights in every browser engine installed'],
];
(async () => {
  const stopAwake = require('./awake.js')();   // Windows: no sleep while the checks run
  const lines = []; let bad = 0;
  for (const [name, args, env, what] of list) {   // killed after 20 min; the bot game 35 (it takes up to 20 on a busy PC, mp-test gives up at 30)
    const t0 = Date.now(), file = path.join(out, name + '.txt'), fd = fs.openSync(file, 'w');
    const code = await new Promise(res => { const p = spawn(process.execPath, args, { env: Object.assign({}, process.env, env), stdio: ['ignore', fd, fd] }); const k = setTimeout(() => { try { p.kill('SIGKILL'); } catch (e) {} }, (name === 'bot-game' ? 35 : 20) * 60000); p.on('exit', c => { clearTimeout(k); res(c); }); });
    fs.closeSync(fd);
    const txt = fs.readFileSync(file, 'utf8').trim().split(/\r?\n/), last = txt.filter(x => x.trim()).pop() || '';
    const ok = code === 0; if (!ok) bad++;
    const line = (ok ? 'OK    ' : 'FAIL  ') + name.padEnd(14) + what + ' (' + Math.round((Date.now() - t0) / 1000) + ' s)' + (ok && !/^OK:/.test(last) ? '' : ' · ' + last.slice(0, 200));
    console.log(line); lines.push(line);
  }
  const sum = bad ? bad + ' of ' + list.length + ' checks FAILED (the full text of each is in ' + out + ')' : 'All ' + list.length + ' checks passed.';
  console.log(sum); lines.push(sum);
  fs.writeFileSync(path.join('playtests', 'click-runs', 'latest-checks.txt'), new Date().toISOString().slice(0, 16) + '\n' + lines.join('\n') + '\n');
  stopAwake();
  process.exit(bad ? 1 : 0);
})();
