/* ROBOCUS online settings (src/net.js reads this). Without a relay, devices link up directly (WebRTC + STUN), which
 * fails on some networks (two devices on the same home Wi-Fi behind some routers, mobile data, work Wi-Fi). The relay
 * (TURN server) passes the game traffic through instead, only when a direct link fails.
 * Relay: Metered (dashboard.metered.ca, app "robocup"), credential made 7 Nov 2026. Plan: trial, 500 MB a month; the
 * free plan has 20 GB. These values are public (anyone with the page can see them): fine for a friends' game. If the
 * quota runs out, the relay stops until next month and only the direct links work. */
window.ROBOCUS_NET_CONFIG = {
  metered: { app: '', apiKey: '' },
  iceServers: [
    { urls: 'stun:stun.relay.metered.ca:80' },
    { urls: 'turn:global.relay.metered.ca:80', username: '473b100a08cd427f607f1f0e', credential: 'UAJMlYnjHde9yGhr' },
    { urls: 'turn:global.relay.metered.ca:80?transport=tcp', username: '473b100a08cd427f607f1f0e', credential: 'UAJMlYnjHde9yGhr' },
    { urls: 'turn:global.relay.metered.ca:443', username: '473b100a08cd427f607f1f0e', credential: 'UAJMlYnjHde9yGhr' },
    { urls: 'turns:global.relay.metered.ca:443?transport=tcp', username: '473b100a08cd427f607f1f0e', credential: 'UAJMlYnjHde9yGhr' }
  ]
};
