# Builds prototypes/arena-25d.html (ROBOCUS 2.5D Arena) from engine.js + lineup.js + ui25.js + shell-25d.html.
# ui25.js is ui.js with a 2.5D layer (tilted camera, every flat part stood up with sides). Writes only that page. Run: python3 tools/damage-lab/build-25d.py
import pathlib
d = pathlib.Path(__file__).resolve().parent
rd = lambda n: (d / n).read_text(encoding='utf-8')
cdn = '<script>\n' + rd('dmath.js') + '\n</script>\n<script src="https://cdn.jsdelivr.net/npm/planck@1.4.3/dist/planck.min.js"></script>'
mxf = d / 'matrix-data.json'
mx = '<script>\nwindow.LU_MATRIX = ' + mxf.read_text().strip() + ';\n</script>\n' if mxf.exists() else ''
body = rd('shell-25d.html') + '\n' + cdn + '\n<script>\n' + rd('engine.js') + '\n</script>\n<script>\n' + rd('lineup.js') + '\n</script>\n' + mx + '<script>\n' + rd('ui25.js') + '\n</script>\n'
head = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<!-- ROBOCUS 2.5D Arena. Built from tools/damage-lab (engine.js, lineup.js, ui25.js, shell-25d.html) by build-25d.py. Needs internet for planck.js and fonts. -->\n'
i = body.index('<div class="wrap">')
(d.parent.parent / 'prototypes' / 'arena-25d.html').write_text(head + body[:i] + '</head><body>\n' + body[i:] + '</body></html>\n', encoding='utf-8')
print('built prototypes/arena-25d.html')
