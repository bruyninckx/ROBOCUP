#!/usr/bin/env python3
# Builds the "parts that fly off" voting page: 15 robots, a drawing each, votes and feedback boxes.
import base64, json, math, io, os
HERE = os.path.dirname(os.path.abspath(__file__))
from PIL import Image

INK = '#2B2118'; BLUE = '#3A78B5'; DBLUE = '#2C5E91'; TREAD = '#2a2622'; STEEL = '#A9ADA8'; DSTEEL = '#6F746F'
GOLD = '#E3B83A'; RUST = '#C4521E'; FLOOR = '#EFE8DA'; RED = '#D8402F'

def P(pts): return ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts)
def poly(n, cx, cy, r, rot=0): return [(cx + r*math.cos(rot + 2*math.pi*i/n), cy + r*math.sin(rot + 2*math.pi*i/n)) for i in range(n)]
def shadow(cx, cy, rx, ry): return f'<ellipse cx="{cx+5}" cy="{cy+7}" rx="{rx}" ry="{ry}" fill="{INK}" opacity=".13"/>'
def tread(x, y, w, h):
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="4" fill="{TREAD}" stroke="{INK}" stroke-width="2"/>'
    for k in range(int(h//11)):
        s += f'<line x1="{x+3}" y1="{y+8+k*11}" x2="{x+w-3}" y2="{y+8+k*11}" stroke="#55504a" stroke-width="2"/>'
    return s
def chassis(cx, cy, w=120, h=120, treads=True, panel=True):
    x, y = cx-w/2, cy-h/2
    s = shadow(cx, cy, w/2+18, h/2+6)
    if treads: s += tread(x-17, y-5, 17, h+10) + tread(x+w, y-5, 17, h+10)
    s += f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7" fill="{BLUE}" stroke="{INK}" stroke-width="3"/>'
    if panel: s += f'<rect x="{x+13}" y="{y+13}" width="{w-26}" height="{h-26}" rx="4" fill="{DBLUE}" stroke="{INK}" stroke-width="2"/>'
    for bx, by in ((x+7, y+7), (x+w-7, y+7), (x+7, y+h-7), (x+w-7, y+h-7)):
        s += f'<circle cx="{bx}" cy="{by}" r="2.2" fill="{FLOOR}" stroke="{INK}" stroke-width="1"/>'
    return s
def lab(tx, ty, text, x, y, anchor='start'):
    w = len(text)*7.3 + 12
    bx = tx-6 if anchor == 'start' else tx-w+6
    return (f'<line x1="{tx}" y1="{ty-4}" x2="{x}" y2="{y}" stroke="{INK}" stroke-width="1.4"/><circle cx="{x}" cy="{y}" r="3" fill="{INK}"/>'
            f'<rect x="{bx}" y="{ty-15}" width="{w}" height="21" rx="3" fill="#FBF8F1" stroke="{INK}" stroke-width="1.4"/>'
            f'<text x="{tx}" y="{ty}" text-anchor="{anchor}" font-family="IBM Plex Mono,monospace" font-size="12.5" font-weight="600" fill="{INK}">{text}</text>')
def spark(cx, cy, r=11):
    pts = []
    for i in range(14):
        rr = r if i % 2 == 0 else r*0.42
        a = math.pi*i/7
        pts.append((cx+rr*math.cos(a), cy+rr*math.sin(a)))
    return f'<polygon points="{P(pts)}" fill="{GOLD}" stroke="{RUST}" stroke-width="1.5"/>'
def arc(cx, cy, r, a0, a1, dash='5 5', w=2):
    x0, y0 = cx+r*math.cos(a0), cy+r*math.sin(a0); x1, y1 = cx+r*math.cos(a1), cy+r*math.sin(a1)
    big = 1 if (a1-a0) > math.pi else 0
    return f'<path d="M{x0:.1f} {y0:.1f} A{r} {r} 0 {big} 1 {x1:.1f} {y1:.1f}" fill="none" stroke="{INK}" stroke-width="{w}" stroke-dasharray="{dash}" stroke-linecap="round"/>'
def gear(cx, cy, r, fill=STEEL):
    pts = []
    for i in range(16):
        rr = r if i % 2 == 0 else r*0.72
        a = math.pi*i/8
        pts.append((cx+rr*math.cos(a), cy+rr*math.sin(a)))
    return f'<polygon points="{P(pts)}" fill="{fill}" stroke="{INK}" stroke-width="1.5"/><circle cx="{cx}" cy="{cy}" r="{r*0.25:.1f}" fill="{FLOOR}" stroke="{INK}" stroke-width="1.2"/>'
def nut(cx, cy, r, fill=DSTEEL): return f'<polygon points="{P(poly(6, cx, cy, r, .3))}" fill="{fill}" stroke="{INK}" stroke-width="1.5"/><circle cx="{cx}" cy="{cy}" r="{r*0.4:.1f}" fill="{FLOOR}" stroke="{INK}" stroke-width="1"/>'
def record(cx, cy, r, c):
    return (f'<circle cx="{cx+3}" cy="{cy+4}" r="{r}" fill="{INK}" opacity=".15"/><circle cx="{cx}" cy="{cy}" r="{r}" fill="#1d1a18" stroke="{INK}" stroke-width="1.5"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r*0.68:.1f}" fill="none" stroke="#4a4541" stroke-width="1"/><circle cx="{cx}" cy="{cy}" r="{r*0.36:.1f}" fill="{c}"/><circle cx="{cx}" cy="{cy}" r="1.6" fill="{FLOOR}"/>')
def brick(cx, cy, rot):
    return (f'<g transform="rotate({rot} {cx} {cy})"><rect x="{cx-13}" y="{cy-5}" width="30" height="16" rx="2" fill="{INK}" opacity=".13"/>'
            f'<rect x="{cx-15}" y="{cy-8}" width="30" height="16" rx="2" fill="{RUST}" stroke="{INK}" stroke-width="2"/>'
            f'<circle cx="{cx-6}" cy="{cy}" r="2.4" fill="#8e3a14"/><circle cx="{cx+6}" cy="{cy}" r="2.4" fill="#8e3a14"/></g>')
def svg(body):
    return (f'<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg" role="img"><rect width="300" height="300" fill="{FLOOR}"/>'
            f'<g stroke="#DDD3BF" stroke-width="1">' + ''.join(f'<line x1="{k}" y1="0" x2="{k}" y2="300"/><line x1="0" y1="{k}" x2="300" y2="{k}"/>' for k in range(50, 300, 50)) + '</g>'
            + body + '</svg>')

def d_gyro():
    cx, cy = 190, 118
    s = shadow(cx, cy, 58, 54)
    s += f'<circle cx="{cx}" cy="{cy}" r="54" fill="{BLUE}" stroke="{INK}" stroke-width="3"/>'
    s += f'<circle cx="{cx}" cy="{cy}" r="37" fill="{GOLD}" stroke="{INK}" stroke-width="3"/>'
    for i in range(6):
        a = i*math.pi/3 + .3
        s += f'<line x1="{cx}" y1="{cy}" x2="{cx+37*math.cos(a):.1f}" y2="{cy+37*math.sin(a):.1f}" stroke="{INK}" stroke-width="2.5"/>'
    s += f'<circle cx="{cx}" cy="{cy}" r="11" fill="{TREAD}" stroke="{INK}" stroke-width="2"/><circle cx="{cx}" cy="{cy}" r="3" fill="{RED}"/>'
    s += arc(cx, cy, 66, -1.2, -.2) + arc(cx, cy, 74, 1.4, 2.6) + arc(cx, cy, 66, 3.3, 4.1)
    sx, sy = 92, 218
    o = poly(8, sx, sy, 66, .5); i = poly(8, sx, sy, 41, .5)[::-1]
    s += f'<path d="M{P(o).replace(" ", " L")} Z M{P(i).replace(" ", " L")} Z" transform="translate(5 7)" fill="{INK}" opacity=".13" fill-rule="evenodd"/>'
    s += f'<path d="M{P(o).replace(" ", " L")} Z M{P(i).replace(" ", " L")} Z" fill="{STEEL}" stroke="{INK}" stroke-width="3" fill-rule="evenodd"/>'
    for bx, by in poly(8, sx, sy, 53, .5 + math.pi/8): s += f'<circle cx="{bx:.1f}" cy="{by:.1f}" r="2.6" fill="{FLOOR}" stroke="{INK}" stroke-width="1"/>'
    s += f'<polyline points="{sx+42},{sy-8} {sx+50},{sy-2} {sx+47},{sy+5} {sx+62},{sy+9}" fill="none" stroke="{INK}" stroke-width="2"/>'
    return s + lab(14, 132, 'shell on the floor', 60, 178) + lab(286, 222, 'bare flywheel', 205, 140, 'end')

def d_pogo():
    cx, cy = 140, 135
    s = chassis(cx, cy)
    s += f'<circle cx="{cx}" cy="{cy}" r="30" fill="{TREAD}" stroke="{INK}" stroke-width="2"/>'
    pts = []
    for k in range(0, 150):
        a = k*.22; r = 4 + k*.17
        pts.append((cx+r*math.cos(a), cy+r*math.sin(a)))
    ex, ey = pts[-1]
    tail = []
    for k in range(0, 60):
        t = k/59
        tail.append((ex + t*105, ey + t*70 + 15*math.sin(t*22)*(1 - .3*t)))
    s += f'<polyline points="{P(pts+tail)}" fill="none" stroke="{INK}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>'
    s += f'<polyline points="{P(pts+tail)}" fill="none" stroke="{GOLD}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'
    for (hx, hy, rot, a0) in ((52, 248, -25, 0), (150, 262, 20, math.pi)):
        h = [(hx+40*math.cos(a0+math.pi*i/10 - math.pi/2), hy+40*math.sin(a0+math.pi*i/10 - math.pi/2)) for i in range(11)]
        h += [(hx+25*math.cos(a0+math.pi*i/10 - math.pi/2), hy+25*math.sin(a0+math.pi*i/10 - math.pi/2)) for i in range(10, -1, -1)]
        s += f'<polygon points="{P(h)}" transform="rotate({rot} {hx} {hy}) translate(4 6)" fill="{INK}" opacity=".13"/>'
        s += f'<polygon points="{P(h)}" transform="rotate({rot} {hx} {hy})" fill="{STEEL}" stroke="{INK}" stroke-width="2.5"/>'
    return s + lab(14, 30, 'casing burst', 36, 218) + lab(286, 150, 'spring out', 244, 196, 'end')

def d_blacksmith():
    cx, cy = 165, 128
    s = '<defs><radialGradient id="fg"><stop offset="0" stop-color="#FFE38A"/><stop offset=".45" stop-color="#F08A2B"/><stop offset="1" stop-color="#C4521E" stop-opacity="0"/></radialGradient></defs>'
    s += chassis(cx, cy)
    s += f'<circle cx="{cx}" cy="{cy-6}" r="78" fill="url(#fg)" opacity=".75"/>'
    s += f'<rect x="{cx-36}" y="{cy-40}" width="72" height="58" rx="4" fill="#3a1d10" stroke="{INK}" stroke-width="3"/>'
    for (ox, oy, r, c) in ((-18, -20, 11, '#F08A2B'), (4, -24, 9, '#FFD35A'), (20, -8, 12, '#F08A2B'), (-6, -2, 13, '#FFD35A'), (-24, 4, 8, RED), (14, 8, 7, RED)):
        s += f'<circle cx="{cx+ox}" cy="{cy+oy}" r="{r}" fill="{c}" stroke="#8e3a14" stroke-width="1.5"/>'
    for ox in (-26, 0, 26):
        s += f'<path d="M{cx+ox} {cy-52} q7 -9 0 -18 q-7 -9 0 -18" fill="none" stroke="{RUST}" stroke-width="2.5" stroke-linecap="round"/>'
    s += f'<rect x="{cx-10}" y="{cy+30}" width="20" height="16" rx="2" fill="{DSTEEL}" stroke="{INK}" stroke-width="2"/>'
    hx, hy = 70, 240
    s += f'<g transform="rotate(-18 {hx} {hy})"><polygon points="{hx-46},{hy-26} {hx+46},{hy-26} {hx+54},{hy+30} {hx-54},{hy+30}" transform="translate(5 7)" fill="{INK}" opacity=".13"/>'
    s += f'<polygon points="{hx-46},{hy-26} {hx+46},{hy-26} {hx+54},{hy+30} {hx-54},{hy+30}" fill="#4b4a47" stroke="{INK}" stroke-width="3"/>'
    s += f'<rect x="{hx-30}" y="{hy-12}" width="60" height="26" rx="3" fill="#353431" stroke="{INK}" stroke-width="2"/></g>'
    return s + lab(14, 178, 'hood', 50, 215) + lab(286, 250, 'open forge: burns', 190, 140, 'end')

def d_whaler():
    s = ''
    for side in (-1, 1):
        hx = 150 + side*62
        s += shadow(hx, 130, 40, 66)
        s += tread(hx + (side*38 if side > 0 else -55), 62, 17, 136)
        x0 = hx-38
        jag = [(x0, 66), (x0+76, 66), (x0+76, 194), (x0, 194)]
        if side < 0: jag = [(x0, 66), (x0+70, 66), (x0+60, 92), (x0+74, 118), (x0+62, 146), (x0+72, 172), (x0+64, 194), (x0, 194)]
        else: jag = [(x0+8, 66), (x0+76, 66), (x0+76, 194), (x0+2, 194), (x0+12, 170), (x0, 144), (x0+14, 118), (x0+2, 92)]
        s += f'<polygon points="{P(jag)}" fill="{BLUE}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
        s += f'<rect x="{hx-18 - side*4}" y="84" width="34" height="92" rx="4" fill="{DBLUE}" stroke="{INK}" stroke-width="2"/>'
    cx, cy = 150, 130
    s += f'<circle cx="{cx}" cy="{cy}" r="27" fill="{DSTEEL}" stroke="{INK}" stroke-width="3"/>'
    for r in (21, 16, 11): s += f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#B9824A" stroke-width="4"/><circle cx="{cx}" cy="{cy}" r="{r+2.2}" fill="none" stroke="{INK}" stroke-width=".8"/>'
    s += f'<circle cx="{cx}" cy="{cy}" r="6" fill="{TREAD}"/>'
    rope = [(cx + 20*math.sin(t*.9), cy+24 + t*8) for t in range(0, 14)]
    s += f'<polyline points="{P(rope)}" fill="none" stroke="{INK}" stroke-width="6" stroke-linecap="round"/><polyline points="{P(rope)}" fill="none" stroke="#B9824A" stroke-width="3.5" stroke-linecap="round"/>'
    ex, ey = rope[-1]
    s += f'<polygon points="{ex},{ey+26} {ex-11},{ey+2} {ex-4},{ey+6} {ex-4},{ey-6} {ex+4},{ey-6} {ex+4},{ey+6} {ex+11},{ey+2}" fill="{STEEL}" stroke="{INK}" stroke-width="2"/>'
    return s + lab(14, 36, 'hull splits', 96, 80) + lab(286, 262, 'winch and rope', 168, 140, 'end')

def d_lodestone():
    cx, cy = 130, 128
    s = chassis(cx, cy)
    s += f'<rect x="{cx-24}" y="{cy-58}" width="48" height="12" rx="2" fill="{STEEL}" stroke="{INK}" stroke-width="2"/>'
    s += f'<ellipse cx="{cx}" cy="{cy-34}" rx="18" ry="7" fill="#D98A3D" stroke="{INK}" stroke-width="2"/><ellipse cx="{cx}" cy="{cy-27}" rx="14" ry="5" fill="#D98A3D" stroke="{INK}" stroke-width="2"/>'
    s += f'<circle cx="{cx}" cy="{cy-8}" r="5" fill="{TREAD}"/><circle cx="{cx}" cy="{cy+6}" r="5" fill="{TREAD}"/>'
    w = (f'M{cx+14} {cy-27} C {cx+60} {cy-40}, {cx+40} {cy+30}, {cx+78} {cy+10} S {cx+110} {cy-50}, {cx+70} {cy-30} S {cx+50} {cy+60}, {cx+100} {cy+70} '
         f'S {cx+150} {cy+40}, {cx+120} {cy+100} S {cx+20} {cy+140}, {cx-10} {cy+105} S {cx-90} {cy+130}, {cx-100} {cy+90}')
    s += f'<path d="{w}" fill="none" stroke="{INK}" stroke-width="5.5" stroke-linecap="round"/><path d="{w}" fill="none" stroke="#E0903F" stroke-width="3" stroke-linecap="round"/>'
    for k in range(4):
        y = cy - 20 + k*13
        s += f'<path d="M{cx+58} {y} q14 -6 22 4" fill="none" stroke="{INK}" stroke-width="5.5" stroke-linecap="round"/><path d="M{cx+58} {y} q14 -6 22 4" fill="none" stroke="#E0903F" stroke-width="3" stroke-linecap="round"/>'
    s += arc(cx, cy-52, 30, math.pi*1.15, math.pi*1.85, '3 6', 1.6) + arc(cx, cy-52, 42, math.pi*1.2, math.pi*1.8, '3 6', 1.6)
    return s + lab(286, 30, 'wire in the tracks', 205, 126, 'end') + lab(14, 276, 'coil half gone', 122, 98)

def d_buzzkill():
    cx, cy = 150, 165
    s = chassis(cx, cy, 120, 110)
    px, py = cx, cy-10
    s += arc(px, py, 78, -2.2, -.9, '6 6') + arc(px, py, 78, .3, 1.2, '6 6') + arc(px, py, 64, -3.4, -2.6, '6 6')
    s += f'<g transform="rotate(38 {px} {py})"><rect x="{px-9}" y="{py-80}" width="18" height="86" rx="4" fill="{STEEL}" stroke="{INK}" stroke-width="3"/>'
    s += f'<polygon points="{px-9},{py+6} {px-3},{py+14} {px+2},{py+5} {px+9},{py+12} {px+9},{py}" fill="{STEEL}" stroke="{INK}" stroke-width="2"/></g>'
    s += f'<circle cx="{px}" cy="{py}" r="10" fill="{TREAD}" stroke="{INK}" stroke-width="2"/>'
    bx, by = 58, 62
    s += f'<g transform="rotate(-62 {bx} {by})"><rect x="{bx-5}" y="{by-35}" width="18" height="78" rx="4" fill="{INK}" opacity=".13"/>'
    s += f'<polygon points="{bx-9},{by-40} {bx+9},{by-40} {bx+9},{by+30} {bx+3},{by+40} {bx-2},{by+30} {bx-9},{by+38}" fill="{STEEL}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/></g>'
    return s + lab(286, 30, 'half bar: faster', 196, 98, 'end') + lab(14, 122, 'snapped half', 62, 72)

def d_hornet():
    cx, cy = 150, 228
    s = chassis(cx, cy, 96, 90)
    s += f'<polygon points="{cx-7},{cy-45} {cx-7},{cy-92} {cx-2},{cy-84} {cx+3},{cy-96} {cx+7},{cy-88} {cx+7},{cy-45}" fill="{STEEL}" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>'
    s += f'<circle cx="{cx}" cy="{cy}" r="7" fill="#F08A2B" stroke="{INK}" stroke-width="2"/>'
    s += shadow(150, 40, 110, 40)
    s += tread(38, -20, 17, 96) + tread(245, -20, 17, 96)
    s += f'<rect x="55" y="-30" width="190" height="104" rx="7" fill="#C9C3B4" stroke="{INK}" stroke-width="3" stroke-dasharray="9 5"/>'
    s += f'<text x="150" y="30" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="12.5" fill="{INK}" opacity=".7">the other robot</text>'
    s += f'<polygon points="{cx},{48} {cx-8},{104} {cx-3},{98} {cx+2},{108} {cx+8},{100}" fill="{STEEL}" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>'
    s += spark(cx-16, 76, 8) + spark(cx+15, 72, 6)
    return s + lab(286, 128, 'tip stays stuck', 156, 92, 'end') + lab(14, 150, 'blunt stump', 146, 150)

def d_railgun():
    cx, cy = 150, 200
    s = chassis(cx, cy, 120, 110)
    for sg in (-1, 1):
        s += f'<g transform="rotate({sg*19} {cx+sg*9} {cy})"><rect x="{cx+sg*9-6}" y="{cy-138}" width="12" height="140" rx="2" fill="{TREAD}" stroke="{INK}" stroke-width="2.5"/>'
        for k in range(7): s += f'<rect x="{cx+sg*9-4}" y="{cy-130+k*19}" width="8" height="7" fill="#B8742F"/>'
        s += '</g>'
    for k in range(3): s += f'<rect x="{cx-22+k*16}" y="{cy+22}" width="12" height="24" rx="5" fill="{TREAD}" stroke="{INK}" stroke-width="1.5"/>'
    for (tx, ty) in ((48, 18), (150, 6), (258, 26)):
        s += f'<line x1="{cx}" y1="{cy-40}" x2="{tx}" y2="{ty}" stroke="{RUST}" stroke-width="2" stroke-dasharray="3 7" stroke-linecap="round"/>'
    s += f'<circle cx="92" cy="96" r="6" fill="{GOLD}" stroke="{INK}" stroke-width="2"/>'
    return s + lab(14, 232, 'rails peeled', 108, 110) + lab(286, 62, 'fires wide', 232, 60, 'end')

def d_bricklayer():
    cx, cy = 165, 120
    s = chassis(cx, cy)
    s += f'<g transform="rotate(-38 {cx} {cy})"><rect x="{cx-9}" y="{cy-96}" width="18" height="104" fill="{GOLD}" stroke="{INK}" stroke-width="2.5"/>'
    for k in range(6): s += f'<line x1="{cx-9}" y1="{cy-88+k*16}" x2="{cx+9}" y2="{cy-78+k*16}" stroke="{INK}" stroke-width="2.5"/>'
    s += f'<path d="M{cx-14} {cy-96} v-16 M{cx+14} {cy-96} v-16 M{cx-14} {cy-96} h28" fill="none" stroke="{INK}" stroke-width="4" stroke-linecap="round"/></g>'
    s += f'<circle cx="{cx}" cy="{cy}" r="12" fill="{TREAD}" stroke="{INK}" stroke-width="2"/>'
    s += f'<rect x="{cx-28}" y="{cy+20}" width="56" height="28" rx="3" fill="#24476d" stroke="{INK}" stroke-width="2" stroke-dasharray="5 4"/>'
    for (bx, by, r) in ((48, 208, -20), (86, 236, 12), (60, 262, 70), (126, 258, -8), (170, 232, 35), (214, 262, -50), (252, 226, 15), (30, 150, 85)):
        s += brick(bx, by, r)
    return s + lab(14, 28, 'empty crane', 96, 44) + lab(286, 292, 'bricks block the way', 172, 240, 'end')

def d_jukebox():
    cx, cy = 118, 128
    s = chassis(cx, cy)
    s += f'<circle cx="{cx}" cy="{cy-6}" r="34" fill="{TREAD}" stroke="{INK}" stroke-width="2.5"/><circle cx="{cx}" cy="{cy-6}" r="5" fill="{STEEL}" stroke="{INK}" stroke-width="1.5"/>'
    s += f'<line x1="{cx+30}" y1="{cy-40}" x2="{cx+8}" y2="{cy-12}" stroke="{STEEL}" stroke-width="4" stroke-linecap="round"/>'
    s += f'<g transform="rotate(24 222 92)"><rect x="196" y="66" width="56" height="50" fill="{INK}" opacity=".13" transform="translate(5 7)"/><rect x="194" y="64" width="56" height="50" rx="3" fill="#7A5A3A" stroke="{INK}" stroke-width="2.5"/><rect x="201" y="71" width="42" height="36" fill="#3d2c1c" stroke="{INK}" stroke-width="1.5"/></g>'
    for (rx, ry, r, c) in ((214, 172, 22, '#5BC06A'), (256, 214, 18, GOLD), (186, 232, 20, RED), (120, 252, 19, '#6CA7DE'), (238, 266, 16, '#E58CC0'), (54, 238, 17, '#F08A2B')):
        s += record(rx, ry, r, c)
    return s + lab(286, 30, 'crate tipped', 232, 76, 'end') + lab(14, 292, 'records to fetch', 108, 262)

def d_scavenger():
    cx, cy = 150, 105
    s = chassis(cx, cy)
    s += f'<polygon points="{cx-44},{cy-52} {cx+44},{cy-52} {cx+30},{cy+34} {cx-30},{cy+34}" fill="#24211e" stroke="{INK}" stroke-width="3"/>'
    s += f'<polyline points="{cx-6},{cy-50} {cx+4},{cy-28} {cx-8},{cy-10} {cx+6},{cy+10} {cx-4},{cy+34}" fill="none" stroke="{FLOOR}" stroke-width="3"/>'
    s += f'<polygon points="{cx-12},{cy+34} {cx+12},{cy+34} {cx+6},{cy+60} {cx-8},{cy+60}" fill="{FLOOR}" stroke="{INK}" stroke-width="2"/>'
    s += f'<ellipse cx="{cx}" cy="{cy-34}" rx="26" ry="8" fill="#5a544d"/>'
    junk = [('g', 150, 186, 13), ('n', 126, 204, 9), ('g', 176, 214, 10), ('n', 152, 228, 8), ('b', 108, 232, 0), ('g', 136, 254, 15), ('n', 186, 250, 10), ('b', 208, 226, 40), ('n', 96, 264, 8), ('g', 222, 272, 11), ('b', 164, 276, -30), ('n', 66, 244, 7), ('g', 250, 244, 8)]
    for k, x, y, r in junk:
        if k == 'g': s += gear(x, y, r, STEEL if r > 10 else GOLD)
        elif k == 'n': s += nut(x, y, r)
        else: s += f'<g transform="rotate({r} {x} {y})"><rect x="{x-14}" y="{y-3}" width="28" height="6" rx="2" fill="{DSTEEL}" stroke="{INK}" stroke-width="1.5"/><rect x="{x-17}" y="{y-6}" width="7" height="12" fill="{DSTEEL}" stroke="{INK}" stroke-width="1.5"/></g>'
    return s + lab(14, 26, 'cracked hopper', 142, 82) + lab(286, 196, 'junk pours out', 218, 230, 'end')

def d_tarantula():
    cx, cy = 150, 128
    s = shadow(cx, cy, 70, 56)
    legs = [(-1, -40, 1), (-1, -14, 0), (-1, 14, 1), (-1, 40, 0), (1, -40, 1), (1, -14, 1), (1, 14, 0), (1, 40, 1)]
    def leg(x, y, sg, a):
        return (f'<g transform="rotate({a} {x} {y})"><polyline points="{x},{y} {x+sg*34},{y-14} {x+sg*62},{y+10}" fill="none" stroke="{INK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>'
                f'<polyline points="{x},{y} {x+sg*34},{y-14} {x+sg*62},{y+10}" fill="none" stroke="{DSTEEL}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
                f'<circle cx="{x+sg*34}" cy="{y-14}" r="4" fill="{GOLD}" stroke="{INK}" stroke-width="1.5"/></g>')
    for sg, oy, on in legs:
        x, y = cx+sg*46, cy+oy
        if on: s += leg(x, y, sg, oy*.5*sg)
        else:
            s += f'<line x1="{x}" y1="{y}" x2="{x+sg*12}" y2="{y-4}" stroke="{INK}" stroke-width="9" stroke-linecap="round"/><line x1="{x}" y1="{y}" x2="{x+sg*12}" y2="{y-4}" stroke="{DSTEEL}" stroke-width="5" stroke-linecap="round"/>' + spark(x+sg*20, y-6, 8)
    s += f'<polygon points="{P(poly(6, cx, cy, 56, math.pi/2))}" fill="{BLUE}" stroke="{INK}" stroke-width="3"/><polygon points="{P(poly(6, cx, cy, 38, math.pi/2))}" fill="{DBLUE}" stroke="{INK}" stroke-width="2"/>'
    for k in range(4): s += f'<circle cx="{cx-15+k*10}" cy="{cy-40}" r="3.4" fill="{RED}" stroke="{INK}" stroke-width="1"/>'
    for (x, y, a, sg) in ((60, 240, 30, 1), (160, 262, -160, 1), (246, 236, 80, -1)):
        s += leg(x, y, sg, a)
    return s + lab(14, 28, 'stump', 84, 108) + lab(286, 292, 'three legs gone: limps', 196, 256, 'end')

def d_hydra():
    cx, cy = 150, 180
    s = chassis(cx, cy, 120, 110)
    def neck(x0, y0, x1, y1, bend):
        d = f'M{x0} {y0} Q{(x0+x1)/2+bend} {(y0+y1)/2} {x1} {y1}'
        return f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="15" stroke-linecap="round"/><path d="{d}" fill="none" stroke="{DSTEEL}" stroke-width="10" stroke-linecap="round" stroke-dasharray="9 3"/>'
    def head(x, y, a):
        return (f'<g transform="rotate({a} {x} {y})"><polygon points="{x-15},{y+12} {x-11},{y-16} {x-3},{y-2} {x},{y-22} {x+3},{y-2} {x+11},{y-16} {x+15},{y+12}" fill="{STEEL}" stroke="{INK}" stroke-width="2.5" stroke-linejoin="round"/>'
                f'<circle cx="{x-6}" cy="{y+4}" r="2.6" fill="{RED}"/><circle cx="{x+6}" cy="{y+4}" r="2.6" fill="{RED}"/></g>')
    s += neck(cx, cy-40, cx, cy-112, 0) + head(cx, cy-120, 0)
    s += neck(cx-34, cy-40, cx-54, cy-78, -6) + spark(cx-60, cy-90, 13)
    s += neck(cx+34, cy-40, cx+54, cy-78, 6) + spark(cx+60, cy-90, 13)
    s += f'<ellipse cx="42" cy="52" rx="20" ry="16" fill="{INK}" opacity=".13" transform="translate(4 6)"/>' + head(40, 50, -70)
    s += f'<ellipse cx="258" cy="150" rx="20" ry="16" fill="{INK}" opacity=".13" transform="translate(4 6)"/>' + head(258, 150, 120)
    return s + lab(14, 112, 'lost head', 44, 62) + lab(286, 40, 'sparking stump', 214, 86, 'end')

def d_grandmaster():
    cx, cy = 165, 125
    s = chassis(cx, cy, 124, 124, panel=False)
    s += f'<circle cx="{cx}" cy="{cy}" r="52" fill="#24211e" stroke="{INK}" stroke-width="3"/><circle cx="{cx}" cy="{cy}" r="36" fill="none" stroke="#5a544d" stroke-width="2" stroke-dasharray="4 4"/>'
    for i in range(6):
        a = i*math.pi/3 - math.pi/2; x = cx+36*math.cos(a); y = cy+36*math.sin(a); rot = math.degrees(a)+90
        g = f'<g transform="rotate({rot:.0f} {x:.1f} {y:.1f})">'
        if i == 0: g += gear(x, y, 11, STEEL)
        elif i == 1: g += f'<rect x="{x-9}" y="{y-9}" width="18" height="11" rx="2" fill="{DSTEEL}" stroke="{FLOOR}" stroke-width="1.2"/><rect x="{x-2}" y="{y+2}" width="4" height="10" fill="#B9824A"/>'
        elif i == 2: g += f'<polygon points="{x},{y-13} {x-6},{y+9} {x+6},{y+9}" fill="{STEEL}" stroke="{FLOOR}" stroke-width="1.2"/>'
        elif i == 3: g += f'<path d="M{x-9} {y+8} v-10 a9 9 0 0 1 18 0 v10" fill="none" stroke="{GOLD}" stroke-width="4" stroke-linecap="round"/>'
        elif i == 4: g += f'<polygon points="{x-7},{y+9} {x+7},{y+9} {x+3},{y-4} {x},{y-13} {x-3},{y-4}" fill="{RUST}" stroke="{FLOOR}" stroke-width="1.2"/>'
        else: g += f'<rect x="{x-3}" y="{y-12}" width="6" height="22" rx="2" fill="{STEEL}" stroke="{FLOOR}" stroke-width="1.2"/><circle cx="{x}" cy="{y-10}" r="5.5" fill="none" stroke="{STEEL}" stroke-width="3"/>'
        s += g + '</g>'
    s += f'<circle cx="{cx}" cy="{cy}" r="12" fill="{RED}" stroke="{INK}" stroke-width="2"/><text x="{cx}" y="{cy+5.5}" text-anchor="middle" font-family="Big Shoulders Display,sans-serif" font-weight="800" font-size="17" fill="#fff">?</text>'
    s += arc(cx, cy, 62, -.5, .5, '5 5') + arc(cx, cy, 62, 2.6, 3.6, '5 5')
    hx, hy = 70, 244
    s += f'<g transform="rotate(-20 {hx} {hy})"><polygon points="{hx-30},{hy-24} {hx+30},{hy-24} {hx+50},{hy+26} {hx-50},{hy+26}" transform="translate(5 7)" fill="{INK}" opacity=".13"/><polygon points="{hx-30},{hy-24} {hx+30},{hy-24} {hx+50},{hy+26} {hx-50},{hy+26}" fill="{GOLD}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/><line x1="{hx-38}" y1="{hy+8}" x2="{hx+38}" y2="{hy+8}" stroke="{INK}" stroke-width="2"/></g>'
    return s + lab(14, 186, 'hat', 52, 222) + lab(286, 292, 'tool wheel: picks at random', 200, 160, 'end')

def d_popcorn():
    cx, cy = 150, 120
    s = chassis(cx, cy)
    s += f'<polygon points="{cx-52},{cy-52} {cx+50},{cy-56} {cx+30},{cy-80} {cx+2},{cy-70} {cx-22},{cy-88} {cx-46},{cy-78}" fill="{STEEL}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
    s += f'<polyline points="{cx+2},{cy-70} {cx-4},{cy-54}" fill="none" stroke="{INK}" stroke-width="2"/><polyline points="{cx-22},{cy-88} {cx-18},{cy-53}" fill="none" stroke="{INK}" stroke-width="1.5" stroke-dasharray="3 3"/>'
    for bx in (cx-40, cx+38): s += f'<rect x="{bx-5}" y="{cy-58}" width="10" height="16" rx="2" fill="{TREAD}" stroke="{INK}" stroke-width="1.5"/>'
    px, py = 150, 246
    s += f'<g transform="rotate(14 {px} {py})"><polygon points="{px-48},{py-22} {px+48},{py-22} {px+64},{py+22} {px-64},{py+22}" transform="translate(5 7)" fill="{INK}" opacity=".13"/><polygon points="{px-48},{py-22} {px+48},{py-22} {px+64},{py+22} {px-64},{py+22}" fill="{GOLD}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/>'
    for k in range(5): s += f'<polygon points="{px-46+k*23-9},{py+14} {px-46+k*23},{py-6} {px-46+k*23+9},{py+14}" fill="{INK}"/>'
    s += '</g>'
    return s + lab(14, 28, 'bare flipper: bends', 108, 46) + lab(286, 292, 'teeth plate', 200, 262, 'end')

ROBOTS = [
 ('gyro', 'Gyro', 'Shell', d_gyro, 'The grey shell (it can already come loose today).', 'A bare gold flywheel on a small blue base.', 'Lighter and faster, but it wobbles and hits less hard. The shell stays on the floor as a bump.'),
 ('pogo', 'Pogo', 'Shell', d_pogo, 'The casing bursts in two halves.', 'The gold spring uncoils across the floor.', "Pogo can't jump any more. Anyone who drives over the spring gets bounced."),
 ('blacksmith', 'Blacksmith', 'Shell', d_blacksmith, 'The dark hood.', 'A glowing forge.', 'Touching Blacksmith now burns, but with the hood off it overheats and has to pause.'),
 ('whaler', 'Whaler', 'Shell', d_whaler, 'The hull splits down the middle.', 'The winch drum and its rope.', 'The harpoon still fires, but reels in slower, and the rope can be cut.'),
 ('lodestone', 'Lodestone', 'Shell', d_lodestone, 'The copper coil unwinds.', 'A thin bare magnet core.', 'Weaker pull. The loose wire tangles tracks, its own included.'),
 ('buzzkill', 'Buzzkill', 'Weapon', d_buzzkill, 'Half of the spinning bar: first it bends, then it snaps.', 'A short half bar.', 'Spins faster and reaches less far: quick small hits instead of one big one.'),
 ('hornet', 'Hornet', 'Weapon', d_hornet, 'The spear tip.', 'A blunt stump.', 'The tip stays stuck in the other robot and keeps hurting it a bit. Hornet can only shove after that.'),
 ('railgun', 'Railgun', 'Weapon', d_railgun, 'The two rails peel apart.', 'The cells between the rails.', 'Still fires, but wide: it can miss, or hit something it was not aiming at.'),
 ('bricklayer', 'Bricklayer', 'Cargo', d_bricklayer, 'The brick stack topples.', 'An empty crane.', 'Bricks lie around as small walls for everyone. The crane has nothing left to drop.'),
 ('jukebox', 'Jukebox', 'Cargo', d_jukebox, 'The record crate tips over.', 'One last record on the player.', 'Jukebox has to drive to a record on the floor before it can throw again.'),
 ('scavenger', 'Scavenger', 'Cargo', d_scavenger, 'The hopper cracks open.', 'An empty hopper.', 'All its junk pours out in one pile: a rough patch for others, and Scavenger starts collecting from zero.'),
 ('tarantula', 'Tarantula', 'Limbs', d_tarantula, 'Legs, one at a time.', 'Sparking stumps.', 'First it limps, then it turns in circles, then it drags itself. Loose legs stay on the floor.'),
 ('hydra', 'Hydra', 'Limbs', d_hydra, 'Heads, cut off one by one.', 'Sparking stumps.', 'Fewer bites per second. A stump zaps whoever touches it.'),
 ('grandmaster', 'Grandmaster', 'Hat', d_grandmaster, 'The yellow hat.', 'Its "brain": a wheel of six tools.', 'Without the hat it stops choosing: it grabs a tool at random each time.'),
 ('popcorn', 'Popcorn', 'Hat', d_popcorn, 'The yellow teeth plate.', 'A thin bare flipper.', 'Flips are weaker, and the bare flipper bends a little more with every flip.'),
]
RULES = [
 ('r_floor', 'What comes off stays on the floor', 'A real object for the rest of the fight: robots bump into it, trip over it, get pushed onto it.'),
 ('r_behave', 'Every lost piece changes how the robot fights', 'Never only looks: slower, wilder, weaker, or sometimes more dangerous.'),
 ('r_card', 'It shows on the card afterwards', 'The robot card shows the robot without its piece until you pay for the repair in the garage.'),
]

def thumb(k):
    im = Image.open(HERE + f'/img/{k}.jpg').resize((168, 168), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=72)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()

data = {'robots': [{'k': k, 'n': n, 'kind': kind, 'img': thumb(k), 'svg': svg(fn()), 'off': a, 'shows': b, 'fight': c} for k, n, kind, fn, a, b, c in ROBOTS],
        'rules': [{'k': k, 't': t, 'd': d} for k, t, d in RULES]}
esc = lambda o: json.dumps(o, ensure_ascii=False).replace('<', '\\u003c')
css = open('' + HERE + '/page.css').read(); app = open('' + HERE + '/app.js').read()
assert '</script' not in app and '</style' not in css
HEAD = ('<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ROBOCUS: parts that fly off</title>'
        '<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=IBM+Plex+Mono:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">')
html = ('<!doctype html><html lang="en"><head>' + HEAD + '<style id="css">' + css + '</style></head><body><div id="root"></div>'
        '<script id="state" type="application/json">{}</script><script id="data" type="application/json">' + esc(data) + '</script><script id="app">' + app + '</script></body></html>')
open('' + HERE + '/index.html', 'w').write(html)
print(len(html))
