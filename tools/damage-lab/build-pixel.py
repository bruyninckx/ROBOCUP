# Builds prototypes/damage-lab-pixel.html: the Damage Lab (same engine.js, ui.js, shell.html) drawn at low resolution
# with the Noita-style pixel layer from pixel.js. engine.js and ui.js are not changed: the build patches a copy of ui.js.
# run: python3 tools/damage-lab/build-pixel.py
import pathlib
d = pathlib.Path(__file__).resolve().parent
shell = (d/'shell.html').read_text(); eng = (d/'engine.js').read_text(); ui = (d/'ui.js').read_text(); dm = (d/'dmath.js').read_text(); px = (d/'pixel.js').read_text()
def patch(s, old, new):
    assert old in s, 'patch target missing: ' + old[:60]
    return s.replace(old, new, 1)
ui = patch(ui, 'dpr = Math.min(2, window.devicePixelRatio || 1);', 'dpr = 1;')
ui = patch(ui, 'const w = Math.max(200, Math.round(cv.clientWidth * dpr));', 'const w = window.PIX ? PIX.GW : Math.max(200, Math.round(cv.clientWidth * dpr));')
ui = patch(ui, '    drawArena();\n', '    drawArena();\n    if (window.PIX) PIX.draw(ctx);\n')
ui = patch(ui, '    drawParticles();\n', '    drawParticles();\n    if (window.PIX) PIX.glow(ctx);\n')
ui = patch(ui, "spec: [{ preset: 'Brawler' }, { preset: 'Juggernaut' }", "spec: [{ preset: 'Mauler' }, { preset: 'Buzzkill' }")  # Kev's screenshot matchup
ui = patch(ui, '  const curMode = ', '  window.__TC = i => TC(i);\n  const curMode = ')
shell = patch(shell, '<title>ROBOCUS 2.0 Damage Lab</title>', '<title>ROBOCUS Pixel Lab</title>')
shell = patch(shell, '<h1>ROBOCUS 2.0 Damage Lab</h1>', '<h1>ROBOCUS Pixel Lab</h1>')
shell = patch(shell, '</style>', '#arena { image-rendering: pixelated; image-rendering: crisp-edges; }\n</style>')
cdn = '<script>\n' + dm + '\n</script>\n<script src="https://cdn.jsdelivr.net/npm/planck@1.4.3/dist/planck.min.js"></script>'
body = shell + '\n' + cdn + '\n<script>\n' + eng + '\n</script>\n<script>\n' + px + '\n</script>\n<script>\n' + ui + '\n</script>\n'
head = '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<!-- ROBOCUS Pixel Lab: the Damage Lab with a Noita-style pixel layer. Built by tools/damage-lab/build-pixel.py from engine.js, pixel.js, ui.js (patched copy), shell.html. Needs internet for planck.js and fonts. -->\n'
i = body.index('<div class="wrap">')
(d.parent.parent/'prototypes'/'damage-lab-pixel.html').write_text(head + body[:i] + '</head><body>\n' + body[i:] + '</body></html>\n')
print('built prototypes/damage-lab-pixel.html')
