/* ROBOCUS online settings (src/net.js reads this). Optional: without it, devices link up directly (WebRTC + STUN),
 * which fails on some networks (mobile data, some routers, work Wi-Fi). A relay (TURN server) fixes that.
 * Free relay: sign up at https://www.metered.ca/tools/openrelay/ (20 GB a month, a game uses a few MB), create an app,
 * and fill in its name and API key below. Then commit and push; every player gets it with the page. */
window.ROBOCUS_NET_CONFIG = {
  metered: { app: '', apiKey: '' },   // e.g. { app: 'robocus', apiKey: 'abc123…' } → https://robocus.metered.live
  iceServers: []                      // or list your own: [{ urls: 'turn:host:3478', username: '…', credential: '…' }]
};
