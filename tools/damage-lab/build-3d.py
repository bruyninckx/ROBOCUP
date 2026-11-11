# Builds prototypes/arena-3d.html (ROBOCUS 3D Arena sketch) from engine.js + lineup.js + view3d.js + shell-3d.html.
# Writes only that one page: the 2.0 build (src2/, tabletop, Lineup Arena) is not touched. Run: python3 tools/damage-lab/build-3d.py
import pathlib
d = pathlib.Path(__file__).resolve().parent
rd = lambda n: (d / n).read_text(encoding='utf-8')
head = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<!-- ROBOCUS 3D Arena (sketch). Built from tools/damage-lab (engine.js, lineup.js, tex3d.js, view3d.js, shell-3d.html) by build-3d.py. Needs internet for planck.js, three.js and fonts. -->\n'
shell = rd('shell-3d.html'); i = shell.index('<div class="wrap">')
libs = ('<script>\n' + rd('dmath.js') + '\n</script>\n'
        '<script src="https://cdn.jsdelivr.net/npm/planck@1.4.3/dist/planck.min.js"></script>\n'
        '<script src="https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js"></script>\n'
        '<script>\n' + rd('tex3d.js') + '\n</script>\n<script>\n' + rd('engine.js') + '\n</script>\n<script>\n' + rd('lineup.js') + '\n</script>\n<script>\n' + rd('view3d.js') + '\n</script>\n')
(d.parent.parent / 'prototypes' / 'arena-3d.html').write_text(head + shell[:i] + '</head><body>\n' + shell[i:] + libs + '</body></html>\n', encoding='utf-8')
print('built prototypes/arena-3d.html')
