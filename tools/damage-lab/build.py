# Builds prototypes/damage-lab.html from engine.js + ui.js + shell.html (run: python3 tools/damage-lab/build.py)
import pathlib
d = pathlib.Path(__file__).resolve().parent
shell = (d/'shell.html').read_text(); eng = (d/'engine.js').read_text(); ui = (d/'ui.js').read_text()
cdn = '<script src="https://cdn.jsdelivr.net/npm/planck@1.4.3/dist/planck.min.js"></script>'
body = shell + '\n' + cdn + '\n<script>\n' + eng + '\n</script>\n<script>\n' + ui + '\n</script>\n'
head = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<!-- ROBOCUS 2.0 Damage Lab (beta). Built from tools/damage-lab (engine.js = sim, ui.js = renderer). Needs internet for planck.js (physics) and fonts. -->\n'
i = body.index('<div class="wrap">')
(d.parent.parent/'prototypes'/'damage-lab.html').write_text(head + body[:i] + '</head><body>\n' + body[i:] + '</body></html>\n')
print('built prototypes/damage-lab.html')
# ROBOCUS 2.0 Lineup Arena: same engine and UI, plus lineup.js, with shell-lineup.html
lu = (d/'lineup.js').read_text(); shl = (d/'shell-lineup.html').read_text()
body = shl + '\n' + cdn + '\n<script>\n' + eng + '\n</script>\n<script>\n' + lu + '\n</script>\n<script>\n' + ui + '\n</script>\n'
headl = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<!-- ROBOCUS 2.0 Lineup Arena. Built from tools/damage-lab (engine.js, lineup.js, ui.js, shell-lineup.html). Needs internet for planck.js and fonts. -->\n'
i = body.index('<div class="wrap">')
(d.parent.parent/'prototypes'/'lineup-arena.html').write_text(headl + body[:i] + '</head><body>\n' + body[i:] + '</body></html>\n')
print('built prototypes/lineup-arena.html')
