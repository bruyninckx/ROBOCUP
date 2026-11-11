# Builds prototypes/arena-looks.html (three top-down art directions on the same fight) from engine.js + lineup.js + looks.js + shell-looks.html.
# Writes only that one page; the 2.0 build is not touched. Run: python3 tools/damage-lab/build-looks.py
import pathlib
d = pathlib.Path(__file__).resolve().parent
rd = lambda n: (d / n).read_text(encoding='utf-8')
head = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<!-- ROBOCUS Arena Looks. Built from tools/damage-lab (engine.js, lineup.js, looks.js, shell-looks.html) by build-looks.py. Needs internet for planck.js and fonts. -->\n'
shell = rd('shell-looks.html'); i = shell.index('<div class="wrap">')
libs = ('<script>\n' + rd('dmath.js') + '\n</script>\n<script src="https://cdn.jsdelivr.net/npm/planck@1.4.3/dist/planck.min.js"></script>\n'
        '<script>\n' + rd('engine.js') + '\n</script>\n<script>\n' + rd('lineup.js') + '\n</script>\n<script>\n' + rd('looks.js') + '\n</script>\n')
(d.parent.parent / 'prototypes' / 'arena-looks.html').write_text(head + shell[:i] + '</head><body>\n' + shell[i:] + libs + '</body></html>\n', encoding='utf-8')
print('built prototypes/arena-looks.html')
