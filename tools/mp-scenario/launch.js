// Start the test browser (15 Nov). First Playwright's own Chromium; when that was never downloaded (a PC behind a company
// filter can't: "unable to get local issuer certificate"), the Edge or Chrome that is already installed on the PC.
//   BROWSER=msedge (or chrome, chromium) picks one.
module.exports = async function launch(pw, opts = {}) {
  const want = process.env.BROWSER, order = want ? [want] : ['chromium', 'msedge', 'chrome'], why = [];
  for (const name of order) {
    try { const b = await pw.chromium.launch(Object.assign({}, opts, name === 'chromium' ? {} : { channel: name })); if (name !== 'chromium' || want) console.log('(test browser: ' + (name === 'msedge' ? 'the Edge on this PC' : name === 'chrome' ? 'the Chrome on this PC' : 'Chromium') + ')'); return b; }
    catch (e) { why.push(name + ': ' + String(e.message).split('\n')[0].slice(0, 140)); }
  }
  console.log('Could not start a test browser.\n  ' + why.join('\n  ') + '\nRun tools\\remote-setup.cmd once (it downloads the test browser), or install Edge or Chrome on this PC.');
  process.exit(2);
};
