# ROBOCUS: the same small web server as tools/serve.js, for a PC with Python but no Node (Kev, 20 Nov 2026, TASKS.md T32).
# play-latest.cmd uses tools/serve.js when Node is installed, else this. Same rules: this PC only (127.0.0.1), read-only
# (GET and HEAD), files under the repo folder only (no hidden files such as .git, no folder listings), "Cache-Control:
# no-cache" on every answer (so the files stamp keeps working), ports 8765..8784, and a second start for the same folder
# only opens the game in the browser. Python 3.7 or newer, no extra packages.
#   py -3 tools/serve.py [--open[=page]] [--port=N] [--check]
import http.server, json, os, sys, urllib.request, urllib.parse, webbrowser, socketserver

ROOT = os.path.realpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
HOST = '127.0.0.1'
ID = 'robocus-serve 1'

def arg(k, d=None):
    for a in sys.argv[1:]:
        if a == '--' + k: return True
        if a.startswith('--' + k + '='): return a.split('=', 1)[1]
    return d

FIRST = int(arg('port', 8765) or 8765)
OPEN = arg('open', False)
PAGE = 'prototypes/tabletop-2.html' if OPEN is True else (OPEN or '')
EXTRA = {'.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
         '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
         '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.md': 'text/plain; charset=utf-8', '.wasm': 'application/wasm'}

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map, **EXTRA)

    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def log_message(self, *a): pass   # quiet window

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def _plain(self, code, text):
        b = (text + '\n').encode()
        self.send_response(code); self.send_header('Content-Type', 'text/plain; charset=utf-8'); self.send_header('Content-Length', str(len(b))); self.end_headers()
        if self.command != 'HEAD': self.wfile.write(b)

    def _ok(self):
        port = self.server.server_address[1]
        if self.headers.get('Host', '').lower() not in (HOST + ':' + str(port), 'localhost:' + str(port)):
            self._plain(403, 'Forbidden: this server only answers http://%s:%d/' % (HOST, port)); return False
        try: rel = urllib.parse.unquote(self.path.split('?')[0].split('#')[0], errors='strict')
        except Exception: self._plain(400, 'Bad address'); return False
        if rel == '/__robocus': self._plain(200, json.dumps({'id': ID, 'root': ROOT, 'pid': os.getpid()})); return False
        if rel in ('', '/'):
            self.send_response(302); self.send_header('Location', '/prototypes/tabletop-2.html'); self.send_header('Content-Length', '0'); self.end_headers(); return False
        parts = [p for p in rel.replace('\\', '/').split('/') if p]
        if '\0' in rel or any(p == '..' or p.startswith('.') or ':' in p for p in parts): self._plain(403, 'Forbidden'); return False
        real = os.path.realpath(os.path.join(ROOT, *parts))
        if real != ROOT and not real.startswith(ROOT + os.sep): self._plain(403, 'Forbidden'); return False
        return True

    def do_GET(self):
        if self._ok(): super().do_GET()

    def do_HEAD(self):
        if self._ok(): super().do_HEAD()

    def list_directory(self, path):   # no folder listings
        self._plain(404, 'Not found'); return None

def probe(port):
    try:
        with urllib.request.build_opener(urllib.request.ProxyHandler({})).open('http://%s:%d/__robocus' % (HOST, port), timeout=1.5) as r:
            j = json.loads(r.read().decode())
            return j if str(j.get('id', '')).startswith('robocus-serve') else None
    except Exception:
        return None

class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = False

def main():
    for port in range(FIRST, FIRST + 20):
        j = probe(port)
        url = 'http://%s:%d/%s' % (HOST, port, PAGE)
        if j and os.path.realpath(j.get('root', '')) == ROOT:
            if arg('check'): print(url); sys.exit(0)
            print('The game server is already running in another window (%s:%d). Opening the game there.' % (HOST, port))
            if PAGE and not os.environ.get('ROBOCUS_NO_BROWSER'): webbrowser.open(url)
            sys.exit(0)
        if j or arg('check'): continue
        try: srv = Server((HOST, port), Handler)
        except OSError: continue
        print('\nROBOCUS game server: http://%s:%d/  (this PC only; folder %s)' % (HOST, port, ROOT))
        if port != FIRST: print('Port %d was busy, so this is %d. Saved settings and logs in the browser belong to one port.' % (FIRST, port))
        print('Leave this window open while you play. Close it when you are done.')
        if PAGE:
            print('Opening ' + url)
            if not os.environ.get('ROBOCUS_NO_BROWSER'): webbrowser.open(url)
        try: srv.serve_forever()
        except KeyboardInterrupt: pass
        return
    if arg('check'): print('no ROBOCUS server running'); sys.exit(1)
    print('No free port between %d and %d.' % (FIRST, FIRST + 19)); sys.exit(3)

if __name__ == '__main__':
    main()
