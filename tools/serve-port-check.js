// Check for the "port busy" line of tools/serve.js (T53, 22 Nov 2026): what holds port 8765, found without Windows.
//   node tools/serve-port-check.js
// 1. The parsers on sample Windows output (English and Dutch netstat, tasklist with and without a match).
// 2. Live: a plain program on a port, then a fake ROBOCUS server for another folder on a port; serve.js started there must
//    say who holds it and take the next port. On Linux the lookup uses "ss"; if ss is missing the line says "could not see".
'use strict';
const assert = require('assert'), net = require('net'), http = require('http'), path = require('path'), cp = require('child_process');
const S = require('./serve.js');
let fails = 0;
const ok = (c, m) => { if (c) console.log('ok   ' + m); else { fails++; console.log('FAIL ' + m); } };

// ---- 1. parsers ----
const NETSTAT_EN = `
Active Connections

  Proto  Local Address          Foreign Address        State           PID
  TCP    0.0.0.0:135            0.0.0.0:0              LISTENING       1012
  TCP    127.0.0.1:8765         0.0.0.0:0              LISTENING       15872
  TCP    127.0.0.1:8765         127.0.0.1:51234        ESTABLISHED     15872
  TCP    127.0.0.1:51234        127.0.0.1:8765         ESTABLISHED     9100
  TCP    0.0.0.0:87650          0.0.0.0:0              LISTENING       77
  TCP    [::]:8765              [::]:0                 LISTENING       15872
  UDP    0.0.0.0:8765           *:*                                    4444
`;
const NETSTAT_NL = `
Actieve verbindingen

  Proto  Lokaal adres           Extern adres           Status          PID
  TCP    0.0.0.0:8765           0.0.0.0:0              LUISTEREN       2208
  TCP    192.168.1.20:8765      52.1.2.3:443           TIME_WAIT       0
`;
ok(JSON.stringify(S.pidsFromNetstat(NETSTAT_EN, 8765)) === '[15872]', 'netstat (English): listening PID 15872, not the client 9100, not :87650, not UDP');
ok(JSON.stringify(S.pidsFromNetstat(NETSTAT_NL, 8765)) === '[2208]', 'netstat (Dutch "LUISTEREN"): PID 2208');
ok(S.pidsFromNetstat(NETSTAT_EN, 8766).length === 0, 'netstat: nothing on 8766');
ok(S.pidsFromNetstat('', 8765).length === 0, 'netstat: empty output (command failed)');
ok(S.nameFromTasklist('"node.exe","15872","Console","1","45.678 K"\r\n') === 'node.exe', 'tasklist CSV: node.exe');
ok(S.nameFromTasklist('"Skype.exe","2208","Console","1","120,004 K"') === 'Skype.exe', 'tasklist CSV: Skype.exe');
ok(S.nameFromTasklist('INFO: Er worden geen taken uitgevoerd die voldoen aan de opgegeven criteria.') === null, 'tasklist no match (Dutch INFO line): null');
ok(/used by node\.exe \(process 15872\)\. Maybe an old game server window/.test(S.busyLine(8765, { who: { pid: 15872, name: 'node.exe' } })), 'line: node.exe gets the "old game server window" hint');
ok(S.busyLine(8765, { who: { pid: 2208, name: 'Skype.exe' } }) === 'Port 8765 is used by Skype.exe (process 2208).', 'line: Skype.exe');
ok(/process 99 \(see Task Manager/.test(S.busyLine(8765, { who: { pid: 99, name: null } })), 'line: PID without a name');
ok(/another program \(could not see which\)/.test(S.busyLine(8765, { who: null })), 'line: nothing found');
ok(/another ROBOCUS game server, for the folder C:\\old\\ROBOCUS/.test(S.busyLine(8765, { root: 'C:\\old\\ROBOCUS' })), 'line: ROBOCUS server of another folder');
ok(JSON.stringify(S.fromSs('LISTEN 0 511 127.0.0.1:8765 0.0.0.0:* users:(("node",pid=123,fd=18))\n', 8765)) === '{"pid":123,"name":"node"}', 'ss: node pid 123');

// ---- 2. live ----
function startServe(port) {
  return new Promise(res => {
    const s = cp.spawn(process.execPath, [path.join(__dirname, 'serve.js'), '--port=' + port], { env: Object.assign({}, process.env, { ROBOCUS_NO_BROWSER: '1' }) });
    let out = ''; const done = () => { s.kill(); res(out); };
    s.stdout.on('data', d => { out += d; if (/Leave this window open/.test(out)) done(); });
    s.on('exit', () => res(out)); setTimeout(done, 8000);
  });
}
(async () => {
  const P1 = 18765 + Math.floor(Math.random() * 500) * 3;
  const blocker = net.createServer(() => {}); await new Promise(r => blocker.listen(P1, '127.0.0.1', r));
  let out = await startServe(P1);
  console.log(out.trim().split('\n').map(l => '     | ' + l).join('\n'));
  ok(new RegExp('Port ' + P1 + ' is used by (node \\(process ' + process.pid + '\\)|another program \\(could not see which\\))').test(out), 'plain program on the port: the window says who (this test, node pid ' + process.pid + ')');
  ok(new RegExp('So this is ' + (P1 + 1)).test(out) && /saved settings and playtest logs per address/.test(out), 'it takes the next port and says settings are per address');
  blocker.close();
  const P2 = P1 + 1000;
  const fake = http.createServer((q, s) => { s.writeHead(200, { 'Content-Type': 'application/json' }); s.end(JSON.stringify({ id: 'robocus-serve 1', root: '/somewhere/else/ROBOCUS', pid: 1 })); });
  await new Promise(r => fake.listen(P2, '127.0.0.1', r));
  out = await startServe(P2);
  console.log(out.trim().split('\n').map(l => '     | ' + l).join('\n'));
  ok(new RegExp('Port ' + P2 + ' is used by another ROBOCUS game server, for the folder /somewhere/else/ROBOCUS').test(out), 'ROBOCUS server of another folder: named with its folder');
  fake.close();
  out = await startServe(P2 + 500);
  ok(!/is used by/.test(out) && new RegExp('127\\.0\\.0\\.1:' + (P2 + 500) + '/').test(out), 'free port: no busy line');
  console.log(fails ? fails + ' FAILED' : 'OK'); process.exit(fails ? 1 : 0);
})();
