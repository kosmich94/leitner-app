"""Σχεδιάζει ως SVG τις αριθμητικές ερωτήσεις και τον επαγωγικό συλλογισμό, ώστε να μένουν καθαρές σε κάθε οθόνη."""
import math

FONT = "font-family=\"'Helvetica Neue',Arial,sans-serif\""
GREY, INK = '#d9d9d9', '#111111'
W = 600


def text(x, y, value, size=25, fill=INK, weight=500):
    return f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" font-weight="{weight}" fill="{fill}" text-anchor="middle" dominant-baseline="central">{value}</text>'


def rect(x, y, w, h, fill='#fff', stroke=INK, sw=1.6):
    return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'


def svg(body, height):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{height:.0f}" viewBox="0 0 {W} {height:.0f}" {FONT}>'
            f'<rect width="{W}" height="{height:.0f}" fill="#fff"/>{body}</svg>')


# ---------- Αριθμητικά ----------

def options_bar(labels, y):
    w = 132
    x = (W - w * 4) / 2
    out = ''
    for i, label in enumerate(labels):
        out += rect(x + i * w, y, w, 44, GREY) + text(x + i * w + w / 2, y + 22, label, 23)
    return out, y + 44


def grid(rows, y=0, shade=(), cell_w=None, cell_h=50):
    """shade: σύνολο (γραμμή, στήλη). Το b μπροστά από την τιμή σημαίνει μαύρο κελί."""
    cols = len(rows[0])
    cw = cell_w or min(92, (W - 20) / cols)
    x0 = (W - cw * cols) / 2
    out = ''
    for r, row in enumerate(rows):
        for c, v in enumerate(row):
            v = str(v)
            black = v.startswith('b')
            value = v[1:] if black else v
            fill = INK if black else GREY if (r, c) in shade else '#fff'
            out += rect(x0 + c * cw, y + r * cell_h, cw, cell_h, fill)
            out += text(x0 + c * cw + cw / 2, y + r * cell_h + cell_h / 2, value, 25, '#fff' if black else INK)
    return out, y + len(rows) * cell_h


def stack(rows, y=0):
    cols = len(rows[0])
    cw = min(92, (W - 20) / cols)
    x0 = (W - cw * cols) / 2
    h = 44
    out = ''
    for r, row in enumerate(rows):
        last = r == len(rows) - 1
        top = y + r * h + (8 if last else 0)
        if last:
            out += f'<line x1="{x0}" y1="{top}" x2="{x0 + cw * cols}" y2="{top}" stroke="{INK}" stroke-width="2"/>'
        for c, v in enumerate(row):
            out += text(x0 + c * cw + cw / 2, top + h / 2, v, 27)
    return out, y + len(rows) * h + 12


def circles(rows, y=0):
    cols = len(rows[0])
    cw = 92
    x0 = (W - cw * cols) / 2
    h = 50
    out = ''
    for r, row in enumerate(rows[:-1]):
        for c, v in enumerate(row):
            if not v:
                continue
            cx, cy = x0 + c * cw + cw / 2, y + r * h + h / 2
            black = v[0] == 'b'
            out += f'<circle cx="{cx}" cy="{cy}" r="21" fill="{INK if black else "#fff"}" stroke="{INK}" stroke-width="1.8"/>'
            out += text(cx, cy, v[1:], 21, '#fff' if black else INK, 600)
    top = y + (len(rows) - 1) * h + 6
    out += f'<line x1="{x0}" y1="{top}" x2="{x0 + cw * cols}" y2="{top}" stroke="{INK}" stroke-width="2"/>'
    for c, v in enumerate(rows[-1]):
        out += text(x0 + c * cw + cw / 2, top + 26, v, 27)
    return out, top + 52


def triangle(cx, y, s, top, left, center, right):
    h = s * math.sqrt(3) / 2
    ax, ay = cx, y
    bx, by = cx - s / 2, y + h
    dx, dy = cx + s / 2, y + h
    mlx, mly = (ax + bx) / 2, (ay + by) / 2
    mrx, mry = (ax + dx) / 2, (ay + dy) / 2
    mbx, mby = cx, y + h
    out = f'<path d="M{ax} {ay}L{bx} {by}L{dx} {dy}Z" fill="#fff" stroke="{INK}" stroke-width="2"/>'
    out += f'<path d="M{mlx} {mly}L{mrx} {mry}L{mbx} {mby}Z" fill="none" stroke="{INK}" stroke-width="2"/>'
    size = 16 if s < 150 else 19
    out += text(cx, y + h * .32, top, size) + text(cx, y + h * .64, center, size)
    out += text(bx + s * .2, y + h * .82, left, size) + text(dx - s * .2, y + h * .82, right, size)
    return out, y + h


def triangles(items, y=8):
    s = 140
    gap = (W - s * 4) / 5
    out = ''
    for i, t in enumerate(items):
        part, bottom = triangle(gap + s / 2 + i * (s + gap), y, s, *t)
        out += part
    return out, bottom


def pair_options(pairs, y):
    """Οι επιλογές με το ανεστραμμένο κεντρικό και το δεξί τρίγωνο."""
    s = 140
    gap = (W - s * 4) / 5
    h = s * math.sqrt(3) / 4
    out = ''
    for i, (center, right) in enumerate(pairs):
        x = gap + i * (s + gap) + s * .12
        half = s / 2
        out += f'<path d="M{x} {y}L{x + half} {y}L{x + half / 2} {y + h}Z" fill="#fff" stroke="{INK}" stroke-width="2"/>'
        out += f'<path d="M{x + half} {y}L{x + half / 2} {y + h}L{x + half * 1.5} {y + h}Z" fill="#fff" stroke="{INK}" stroke-width="2"/>'
        out += text(x + half / 2, y + h * .36, center, 16) + text(x + half, y + h * .66, right, 16)
        out += text(gap + s / 2 + i * (s + gap), y + h + 26, 'ΑΒΓΔ'[i], 22)
    return out, y + h + 44


def cell_options(pairs, y):
    w, h = 46, 42
    gap = W / 4
    out = ''
    for i, (a, b) in enumerate(pairs):
        x = gap * i + gap / 2 - w
        out += text(x + w, y + 14, 'ΑΒΓΔ'[i] + ':', 22)
        for j, v in enumerate((a, b)):
            black = v.startswith('b')
            value = v[1:] if black else v
            out += rect(x + j * w, y + 30, w, h, INK if black else '#fff')
            out += text(x + j * w + w / 2, y + 30 + h / 2, value, 23, '#fff' if black else INK)
    return out, y + 30 + h


def row_shade(n, cols):
    return {(n, c) for c in range(cols)}


def col_shade(n, rows):
    return {(r, n) for r in range(rows)}


def labels(*values):
    return [f'{l}: {v}' for l, v in zip('ΑΒΓΔ', values)]


Q = ';'


def numeric_figure(n):
    if n in SEQ:
        cells, opts = SEQ[n]
        body, y = grid([cells], 6)
    elif n in GRIDS:
        rows, where, opts = GRIDS[n]
        shade = where(rows) if callable(where) else where
        body, y = grid(rows, 6, shade)
    elif n in STACKS:
        rows, opts = STACKS[n]
        body, y = stack(rows, 6)
    elif n in CIRCLES:
        rows, opts = CIRCLES[n]
        body, y = circles(rows, 6)
    elif n in TRIANGLES:
        items, opts = TRIANGLES[n]
        body, y = triangles(items)
        if isinstance(opts[0], tuple):
            part, y = pair_options(opts, y + 20)
            return svg(body + part, y + 6)
    elif n == 51:
        rows = [[18, 14, 11, 30, Q], [6, 7, 5, 10, Q], [11, 6, 5, 19, Q]]
        body, y = grid(rows, 6, row_shade(2, 5))
        opt = [['Α', 'Β', 'Γ', 'Δ'], [35, 30, 30, 30], [15, 15, 16, 14], [20, 16, 14, 15]]
        part, y = grid(opt, y + 22, row_shade(0, 4) | row_shade(3, 4), cell_h=40)
        return svg(body + part, y + 6)
    elif n in COLOR_GRIDS:
        rows, opts = COLOR_GRIDS[n]
        body, y = grid(rows, 6, col_shade(0, 4) | col_shade(5, 4))
        part, y = cell_options(opts, y + 18)
        return svg(body + part, y + 6)
    part, y = options_bar(labels(*opts), y + 22)
    return svg(body + part, y + 6)


last_row = lambda rows: row_shade(len(rows) - 1, len(rows[0]))
last_col = lambda rows: col_shade(len(rows[0]) - 1, len(rows))

SEQ = {
    35: ([8, 16, 24, 32, Q], (64, 42, 48, 40)),
    38: ([1, 3, 9, 27, Q], (39, 81, 36, 45)),
    43: ([50, 49, 46, 45, 42, 41, Q], (40, 39, 37, 38)),
    49: ([57, 57, 44, 44, 31, 31, 18, Q, Q], ('18,18', '18,7', '18,5', '18,15')),
    57: ([10, 13, 7, 16, 4, 19, 1, Q], (22, 7, 21, 10)),
}
GRIDS = {
    39: ([[20, 10, 30, 6, 7], [4, 5, 2, 5, Q], [85, 55, 65, 35, 54]], last_row, (8, 6, 7, 9)),
    47: ([[16, 4, 2, 18], [6, 4, 5, 5], [7, 6, 3, 10], [5, 3, Q, 6]], last_col, (2, 1, 4, 3)),
    48: ([[16, 13, 21, 8, 3], [5, 5, 4, 7, Q], [42, 36, 50, 30, 20]], last_row, (17, 15, 23, 7)),
    52: ([[5, 10, 7, 6, 16, 2], [9, 19, 13, 11, 31, Q]], last_row, (3, 7, 5, 9)),
    53: ([[20, 60, 20, 70, 30], [10, 20, 40, 30, 40], [16, 41, 31, 51, Q]], last_row, (31, 71, 36, 61)),
    54: ([[5, 5, 8, 9], [12, 8, 10, 15], [3, 10, 1, 7], [13, 7, 30, 25], [14, 4, 6, Q]], last_col, (12, 15, 5, 24)),
    58: ([[10, 22, 40, 70, 30], [1, 2, 10, 20, Q], [18, 40, 60, 100, 50]], last_row, (25, 15, 5, 20)),
    60: ([[48, 10, 60, 4, 26, 18], [25, 6, 31, 3, 14, Q]], last_row, (9, 8, 12, 10)),
    62: ([[8, 4, Q], [3, 72, 24], [2, 18, 9]], {(1, 1)}, (36, 38, 34, 46)),
    63: ([[5, 20, 25, 10, 15], [11, 61, 101, 51, Q]], last_row, (91, 71, 81, 76)),
    64: ([[14, 32, 8, 10], [9, 20, 5, 6], [3, 6, 2, 1], [4, Q, 8, 16]], last_col, (4, 32, 24, 28)),
    66: ([[5, 10, 7, 6, 20, 8], [14, 29, 20, 17, 59, Q]], last_row, (19, 20, 23, 27)),
    67: ([[4, 6, 10, 7, 5, 3], [12, 30, 90, 42, 20, Q]], last_row, (8, 9, 6, 5)),
    68: ([[4, 13, 12, 20, 37, 11], [6, 7, 18, 20, 13, Q]], set(), (39, 44, 60, 49)),
    72: ([[7, 2, 10, 8, 20], [16, 18, 8, 2, 2], [2, 5, 7, 15, Q]], set(), (5, 6, 3, 4)),
    73: ([[30, 60, 20], [90, 10, 70], [50, Q, 40]], {(0, 1), (1, 0), (1, 2), (2, 1)}, (40, 80, 100, 90)),
}
STACKS = {
    37: ([[3, 10, 5, 2, 18], [7, 25, 10, 10, 37], [4, 15, 5, 8, Q]], (19, 29, 55, 17)),
    40: ([[10, 30, 10, 8, 7], [5, 2, 3, 5, 5], [55, 65, 35, 45, Q]], (45, 25, 40, 35)),
    42: ([[6, 5, 7, 40, 3], [4, 5, 2, 20, 2], [9, 10, 1, 10, 1], [1, 0, 8, 50, Q]], (6, 4, 5, 1)),
    46: ([[7, 20, 16, 3], [3, 5, 4, 2], [20, 50, 40, Q]], (5, 10, 20, 6)),
    55: ([[6, 20, 17, 5, 40], [8, 10, 3, 5, Q], [7, 15, 10, 5, 30]], (10, 30, 35, 20)),
    59: ([[9, 5, 10, 10, 7], [2, 3, 9, 10, 2], [11, 8, 83, 93, Q]], (9, 7, 10, 73)),
    61: ([[5, 9, 9, 14, 8], [4, 3, 7, 5, 3], [6, 2, 4, 6, 4], [7, 8, 6, 15, Q]], (8, 7, 15, 9)),
    71: ([[9, 5, 17, 100, 8], [3, 5, 2, 0, 2], [27, 25, 34, 115, Q]], (16, 25, 10, 30)),
}
CIRCLES = {
    36: ([['', '', 'b3', '', 'w6'], ['w15', 'w7', 'b1', 'w15', 'b3'], ['b3', 'w3', 'w12', 'b14', 'w4'], [12, 10, 8, 1, Q]], (13, 10, 3, 7)),
    41: ([['w20', 'b6', 'w10', 'w8', 'b3'], ['b4', 'w18', 'b2', 'b2', 'w18'], [5, 3, 5, 4, Q]], (9, 15, 21, 6)),
    56: ([['w8', 'b10', 'w10', 'w15', 'b3'], ['b4', 'w1', 'b2', 'b1', 'w5'], [16, 21, 14, 17, Q]], (13, 11, 8, 15)),
}
TRIANGLES = {
    44: ([(2, 14, 20, 3), (4, 10, 35, 20), (3, 1, 7, 2), (2, 7, '?', 5)], (14, 10, 15, 16)),
    45: ([(2, 3, 10, 5), (8, 2, 20, 10), (4, 1, 8, 3), (4, 6, '?', '?')], [(20, 5), (15, 4), (15, 5), (10, 5)]),
    50: ([(20, 60, 30, 50), (90, 30, 100, 20), (1, 20, 16, 5), (10, 18, '?', 8)], (18, 26, 16, 20)),
    69: ([(8, 5, 10, 4), (10, 3, 6, 5), (2, 50, 25, 4), (6, 10, '?', '?')], [(15, 4), (20, 4), (15, 6), (10, 5)]),
}
COLOR_GRIDS = {
    65: ([[42, 'b4', 'b5', 6, 7, 20], [16, 'b6', 2, 'b3', 8, 18], [24, 6, f'b{Q}', Q, 'b4', 12], [20, 4, 5, 'b9', 'b3', 27]],
         [('b4', '3'), ('b3', '3'), ('b3', '4'), ('b6', '4')]),
    70: ([[30, 'b15', 16, 4, 'b15', 20], [25, 20, 'b5', 'b20', 10, 30], [10, 15, 'b7', 'b3', 25, 40], [20, f'b{Q}', Q, 7, 'b13', 10]],
         [('b13', '3'), ('b3', '7'), ('b7', '13'), ('b7', '3')]),
}


# ---------- Επαγωγικός ----------
# Κάθε καρέ σχεδιάζεται σε πλαίσιο 100 x 100.

def poly(sides, r=30, cx=50, cy=50, fill='#fff', rot=-90):
    pts = ' '.join(f'{cx + r * math.cos(math.radians(rot + i * 360 / sides)):.1f},{cy + r * math.sin(math.radians(rot + i * 360 / sides)):.1f}' for i in range(sides))
    return f'<polygon points="{pts}" fill="{fill}" stroke="{INK}" stroke-width="2.4"/>'


def circle(r=30, cx=50, cy=50, fill='#fff'):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{INK}" stroke-width="2.4"/>'


def square(r=28, cx=50, cy=50, fill='#fff'):
    return f'<rect x="{cx - r}" y="{cy - r}" width="{2 * r}" height="{2 * r}" fill="{fill}" stroke="{INK}" stroke-width="2.4"/>'


def dots(n, cx=50, cy=50, spread=30, r=5.5, fill=INK):
    """Κουκκίδες σε σταθερό πλέγμα έως 12, ώστε να μετριούνται εύκολα."""
    cols = 1 if n == 1 else 2 if n <= 4 else 3 if n <= 9 else 4
    rows = math.ceil(n / cols)
    step = spread * 2 / 3.2
    out = ''
    for i in range(n):
        r_i, c_i = divmod(i, cols)
        in_row = min(cols, n - r_i * cols)
        out += f'<circle cx="{cx + (c_i - (in_row - 1) / 2) * step:.1f}" cy="{cy + (r_i - (rows - 1) / 2) * step:.1f}" r="{r}" fill="{fill}"/>'
    return out


def arrow(deg, cx=50, cy=50):
    return (f'<g transform="rotate({deg} {cx} {cy})"><line x1="{cx}" y1="{cy + 30}" x2="{cx}" y2="{cy - 22}" stroke="{INK}" stroke-width="5"/>'
            f'<path d="M{cx - 13} {cy - 16}L{cx} {cy - 34}L{cx + 13} {cy - 16}Z" fill="{INK}"/></g>')


def quad(on):
    out = ''
    for i, (x, y) in enumerate([(20, 20), (50, 20), (50, 50), (20, 50)]):
        out += rect(x, y, 30, 30, INK if i in on else '#fff', sw=2.2)
    return out


def ring(pos):
    spots = [(0, 0), (1, 0), (2, 0), (2, 1), (2, 2), (1, 2), (0, 2), (0, 1)]
    out = ''
    for i, (c, r) in enumerate(spots):
        out += rect(20 + c * 20, 20 + r * 20, 20, 20, INK if i == pos else '#fff', sw=1.8)
    out += rect(40, 40, 20, 20, GREY, sw=1.8)
    return out


def lines(n, vertical=False):
    out = ''
    for i in range(n):
        p = 50 + (i - (n - 1) / 2) * 11
        a = (p, 20, p, 80) if vertical else (20, p, 80, p)
        out += f'<line x1="{a[0]}" y1="{a[1]}" x2="{a[2]}" y2="{a[3]}" stroke="{INK}" stroke-width="4"/>'
    return out


def rings(n):
    return ''.join(circle(8 + i * 7.5, fill='none') for i in range(n))


def pie(n, start=0, clockwise=True):
    out = circle(32)
    for i in range(n):
        s = i if clockwise else -i - 1
        a0 = math.radians(-90 + (start + s) * 45)
        a1 = a0 + math.radians(45)
        out += f'<path d="M50 50L{50 + 32 * math.cos(a0):.1f} {50 + 32 * math.sin(a0):.1f}A32 32 0 0 1 {50 + 32 * math.cos(a1):.1f} {50 + 32 * math.sin(a1):.1f}Z" fill="{INK}"/>'
    for i in range(8):
        a = math.radians(-90 + i * 45)
        out += f'<line x1="50" y1="50" x2="{50 + 32 * math.cos(a):.1f}" y2="{50 + 32 * math.sin(a):.1f}" stroke="{INK}" stroke-width="1.4"/>'
    return out


def track(top, bottom):
    out = ''
    for r, pos in enumerate((top, bottom)):
        for c in range(4):
            x, y = 14 + c * 18, 32 + r * 18
            out += rect(x, y, 18, 18, sw=1.6)
            if c == pos:
                out += circle(5.8, x + 9, y + 9, INK if r == 0 else '#fff')
    return out


def flag(deg, fill):
    return (f'<g transform="rotate({deg} 50 50)"><line x1="50" y1="82" x2="50" y2="18" stroke="{INK}" stroke-width="4"/>'
            f'<path d="M50 18L80 30L50 42Z" fill="{fill}" stroke="{INK}" stroke-width="2.4"/></g>')


SEGMENTS = {'t': (24, 24, 76, 24), 'r': (76, 24, 76, 76), 'b': (24, 76, 76, 76), 'l': (24, 24, 24, 76), 'd': (24, 24, 76, 76), 'e': (76, 24, 24, 76)}


def segs(keys):
    out = ''
    for k in sorted(keys):
        a = SEGMENTS[k]
        out += f'<line x1="{a[0]}" y1="{a[1]}" x2="{a[2]}" y2="{a[3]}" stroke="{INK}" stroke-width="4" stroke-linecap="round"/>'
    return out


def shape(kind, **kw):
    return {'c': circle, 's': square, 't': lambda **k: poly(3, 33, **k)}[kind](**kw)


def several(kind, n, fill='#fff'):
    r = 14
    xs = {1: [50], 2: [32, 68], 3: [22, 50, 78]}[n]
    return ''.join({'c': circle(r, x, 50, fill), 's': square(r - 1, x, 50, fill), 't': poly(3, r + 2, x, 52, fill)}[kind] for x in xs)


def poly_dots(sides, n):
    return poly(sides, 40) + dots(n, spread=17, r=4.2)


def diag(stars, count):
    """Το επίσημο παράδειγμα 1: τετράγωνο με διαγώνιο, αστέρια κάτω αριστερά και κουκκίδες πάνω δεξιά."""
    star_at = [(30, 66), (16, 58), (44, 80), (24, 80), (17, 74)]
    dot_at = [(54, 30), (70, 22), (70, 42), (84, 30), (84, 52), (56, 16)]
    out = rect(6, 6, 88, 88, sw=2.2) + f'<line x1="6" y1="6" x2="94" y2="94" stroke="{INK}" stroke-width="1.6"/>'
    for x, y in star_at[:stars]:
        out += star(x, y)
    if count is None:
        out += text(72, 32, '?', 38, weight=700)
    else:
        for x, y in dot_at[:count]:
            out += circle(7, x, y, INK)
    return out


def star(cx, cy, r=9):
    pts = ' '.join(f'{cx + (r if i % 2 == 0 else r * .42) * math.cos(math.radians(-90 + i * 36)):.1f},{cy + (r if i % 2 == 0 else r * .42) * math.sin(math.radians(-90 + i * 36)):.1f}' for i in range(10))
    return f'<polygon points="{pts}" fill="{INK}"/>'


def half(count):
    spots = [(58, 30), (72, 30), (65, 44), (79, 44), (44, 16), (58, 16), (72, 16), (86, 16), (86, 30), (86, 58)]
    out = f'<path d="M6 6L94 6L94 94Z" fill="#fff" stroke="{INK}" stroke-width="2.2"/>'
    for x, y in spots[:count]:
        out += circle(6, x, y, INK)
    return out


def board(rows, h=(), v=()):
    """Το επίσημο παράδειγμα 2: έξι σύμβολα με γραμμές σύνδεσης."""
    xs, ys = (32, 68), (22, 50, 78)
    out = ''
    for r in h:
        out += f'<line x1="32" y1="{ys[r]}" x2="68" y2="{ys[r]}" stroke="{INK}" stroke-width="3"/>'
    for c, r in v:
        out += f'<line x1="{xs[c]}" y1="{ys[r]}" x2="{xs[c]}" y2="{ys[r + 1]}" stroke="{INK}" stroke-width="3"/>'
    for r, row in enumerate(rows):
        for c, s in enumerate(row):
            fill = INK if s.isupper() else '#fff'
            out += (square(7.5, xs[c], ys[r], fill) if s in 'Ss' else circle(8, xs[c], ys[r], fill))
    return out


def framed(content, x, y, size, border=True):
    scale = size / 100
    box = rect(x, y, size, size, sw=2) if border else ''
    return f'{box}<g transform="translate({x:.1f} {y:.1f}) scale({scale:.3f})">{content}</g>'


def question_mark(x, y, size):
    return rect(x, y, size, size, sw=2) + text(x + size / 2, y + size / 2, '?', size * .5, weight=700)


def option_row(options, y, border=True):
    size = 100
    gap = (W - size * 5) / 6
    out = ''
    for i, content in enumerate(options):
        x = gap + i * (size + gap)
        out += framed(content, x, y, size, border) + text(x + size / 2, y + size + 24, 'ΑΒΓΔΕ'[i], 24, weight=700)
    return out, y + size + 44


def sequence_figure(frames, options, border=True):
    size = 104
    gap = (W - size * 5) / 6
    body = ''
    for i, content in enumerate(frames):
        x = gap + i * (size + gap)
        body += question_mark(x, 8, size) if content is None else framed(content, x, 8, size, border)
    part, y = option_row(options, 8 + size + 26, border)
    return svg(body + part, y + 4)


def matrix_figure(cells, options):
    size = 104
    x0 = (W - size * 3) / 2
    body = ''
    for i, content in enumerate(cells):
        x, y = x0 + (i % 3) * size, 8 + (i // 3) * size
        body += question_mark(x, y, size) if content is None else framed(content, x, y, size)
    part, y = option_row(options, 8 + size * 3 + 24)
    return svg(body + part, y + 4)


def inductive_items():
    """Επιστρέφει (λεζάντα, svg, θέση σωστής, εξήγηση). Οι δύο πρώτες είναι τα επίσημα παραδείγματα."""
    ex2 = [
        board(['Ss', 'sS', 'ss'], h=(1, 2)), board(['ss', 'sS', 'ss'], h=(0,)), board(['SC', 'cs', 'sc'], h=(0,)),
        board(['sc', 'CC', 'cS'], h=(0,)), None, board(['cS', 'cS', 'cS'], h=(0, 1, 2), v=((0, 0), (0, 1))),
        board(['sC', 'Sc', 'sc'], h=(0,), v=((0, 0),)), board(['sS', 'Cc', 'sS'], h=(0, 1), v=((0, 0),)), board(['Sc', 'cS', 'ss'], h=(1, 2)),
    ]
    ex2_options = [
        board(['Sc', 'Sc', 'cs'], h=(0, 2), v=((1, 1),)), board(['Ss', 'sS', 'Ss']), board(['cS', 'Cs', 'Ss'], h=(2,), v=((1, 0),)),
        board(['CC', 'cC', 'cs'], h=(1, 2), v=((1, 0),)), board(['Sc', 'cs', 'Cs'], v=((0, 0), (1, 1))),
    ]
    items = [
        ('Επίσημο παράδειγμα', sequence_figure(
            [diag(1, 2), diag(2, 3), diag(3, 4), diag(4, 5), diag(5, None)], [half(4), half(10), half(6), half(5), half(1)], border=False), 2,
         'Τα αστέρια και οι κουκκίδες αυξάνονται κατά ένα σε κάθε σχήμα. Το τελευταίο πρέπει να έχει 6 κουκκίδες.'),
        ('Επίσημο παράδειγμα', matrix_figure(ex2, ex2_options), 0,
         'Σε κάθε κουτί οι οριζόντιες γραμμές είναι όσα και τα μαύρα τετράγωνα. Μόνο η Α έχει 2 και 2.'),
    ]
    own = 'Άσκηση εξάσκησης'
    seq = lambda frames, options, answer, why: items.append((own, sequence_figure(frames, options), answer, why))
    mat = lambda cells, options, answer, why: items.append((own, matrix_figure(cells, options), answer, why))

    seq([arrow(0), arrow(45), arrow(90), arrow(135), None], [arrow(225), arrow(90), arrow(180), arrow(45), arrow(270)], 2,
        'Το βέλος στρέφεται 45° δεξιόστροφα σε κάθε βήμα.')
    seq([dots(1), dots(3), dots(5), dots(7), None], [dots(8), dots(9), dots(10), dots(7), dots(6)], 1,
        'Οι κουκκίδες αυξάνονται κατά 2: 1, 3, 5, 7, 9.')
    seq([poly(3), poly(4, rot=-45), poly(5), poly(6), None], [poly(6), poly(5), poly(8), poly(7), circle()], 3,
        'Το σχήμα κερδίζει μία πλευρά σε κάθε βήμα: από τις 6 πάμε στις 7.')
    seq([quad({0}), quad({1}), quad({2}), quad({3}), None], [quad({0}), quad({1}), quad({2}), quad({3}), quad({0, 2})], 0,
        'Το μαύρο τετράγωνο κινείται δεξιόστροφα. Μετά την κάτω αριστερή γωνία επιστρέφει πάνω αριστερά.')
    seq([ring(0), ring(3), ring(6), ring(1), None], [ring(2), ring(3), ring(5), ring(6), ring(4)], 4,
        'Το μαύρο κελί προχωρά τρεις θέσεις δεξιόστροφα σε κάθε βήμα.')
    a = lambda s, n: (circle(36) if s == 'c' else square(34)) + dots(n, spread=20, r=4.6)
    b = lambda s, n: (circle(36, fill=INK) if s == 'c' else square(34, fill=INK)) + dots(n, spread=20, r=4.6, fill='#fff')
    seq([a('c', 1), b('s', 2), a('c', 3), b('s', 4), None], [b('c', 5), a('s', 5), a('c', 5), a('c', 4), b('s', 5)], 2,
        'Δύο κανόνες μαζί: εναλλάσσονται λευκός κύκλος και μαύρο τετράγωνο, και οι κουκκίδες αυξάνονται κατά μία.')
    seq([lines(5), lines(4, True), lines(3), lines(2, True), None], [lines(2), lines(1, True), lines(3), lines(1), lines(2, True)], 3,
        'Οι γραμμές μειώνονται κατά μία και η κατεύθυνση εναλλάσσεται οριζόντια και κάθετη.')
    seq([rings(1), rings(2), rings(3), rings(4), None], [rings(5), rings(4), rings(3), rings(2), rings(1)], 0,
        'Κάθε βήμα προσθέτει έναν ακόμα ομόκεντρο κύκλο.')
    seq([pie(1), pie(2), pie(3), pie(4), None], [pie(4), pie(5, 3), pie(6), pie(5), pie(5, 0, False)], 3,
        'Κάθε βήμα μαυρίζει ένα ακόμα κομμάτι, δεξιόστροφα, ξεκινώντας πάντα από την κορυφή.')
    seq([track(0, 3), track(1, 2), track(2, 1), track(3, 0), None], [track(3, 3), track(0, 0), track(1, 3), track(0, 3), track(3, 0)], 3,
        'Η μαύρη κουκκίδα πάει δεξιά και η λευκή αριστερά, μία θέση τη φορά. Στο τέλος της γραμμής ξεκινούν ξανά.')
    seq([flag(0, '#fff'), flag(90, INK), flag(180, '#fff'), flag(270, INK), None],
        [flag(0, INK), flag(90, '#fff'), flag(270, '#fff'), flag(180, '#fff'), flag(0, '#fff')], 4,
        'Η σημαία στρέφεται 90° δεξιόστροφα και το χρώμα της εναλλάσσεται λευκό και μαύρο.')
    seq([dots(1), square(30) + dots(4, spread=16, r=4.4), dots(2), square(30) + dots(3, spread=16, r=4.4), None],
        [dots(3), square(30) + dots(2, spread=16, r=4.4), dots(4), dots(2), square(30) + dots(3, spread=16, r=4.4)], 0,
        'Δύο σειρές εναλλάξ: χωρίς πλαίσιο οι κουκκίδες αυξάνονται 1, 2, 3 και μέσα στο τετράγωνο μειώνονται 4, 3.')
    seq([arrow(0) + dots(1, 84, 16, r=4.6), arrow(90) + dots(2, 84, 16, 12, 4), arrow(180) + dots(3, 84, 16, 12, 3.6), arrow(270) + dots(4, 84, 16, 12, 3.6), None],
        [arrow(90) + dots(5, 84, 16, 12, 3.2), arrow(0) + dots(4, 84, 16, 12, 3.6), arrow(0) + dots(5, 84, 16, 12, 3.2), arrow(270) + dots(5, 84, 16, 12, 3.2), arrow(180) + dots(5, 84, 16, 12, 3.2)], 2,
        'Το βέλος στρέφεται 90° δεξιόστροφα και οι κουκκίδες της γωνίας αυξάνονται κατά μία.')

    fills = {'w': '#fff', 'g': '#9a9a9a', 'b': INK}
    latin = lambda k, f: shape(k, fill=fills[f])
    mat([latin('c', 'w'), latin('s', 'g'), latin('t', 'b'), latin('s', 'b'), latin('t', 'w'), latin('c', 'g'), latin('t', 'g'), latin('c', 'b'), None],
        [latin('s', 'b'), latin('t', 'w'), latin('s', 'g'), latin('c', 'w'), latin('s', 'w')], 4,
        'Κάθε γραμμή και στήλη έχει μία φορά κάθε σχήμα και κάθε χρώμα. Λείπει το λευκό τετράγωνο.')
    mat([several('c', 1), several('c', 2), several('c', 3), several('s', 1), several('s', 2), several('s', 3), several('t', 1), several('t', 2), None],
        [several('t', 2), several('t', 3), several('s', 3), several('c', 3), several('t', 1)], 1,
        'Το πλήθος αυξάνεται από αριστερά προς τα δεξιά και κάθε γραμμή κρατά το ίδιο σχήμα. Λείπουν 3 τρίγωνα.')
    xor = [{'t', 'l'}, {'t', 'r'}, {'l', 'r'}, {'d', 'b'}, {'b', 'e'}, {'d', 'e'}, {'t', 'd'}, {'d', 'r'}]
    mat([segs(x) for x in xor] + [None],
        [segs({'t', 'd', 'r'}), segs({'d'}), segs({'t'}), segs({'t', 'r'}), segs({'r', 'b'})], 3,
        'Η τρίτη στήλη κρατά ό,τι υπάρχει μόνο σε ένα από τα δύο πρώτα σχήματα. Οι κοινές γραμμές σβήνουν.')
    union = [{'t'}, {'b'}, {'t', 'b'}, {'l'}, {'d'}, {'l', 'd'}, {'r'}, {'e'}]
    mat([segs(x) for x in union] + [None],
        [segs({'r'}), segs({'e'}), segs({'r', 'e'}), segs({'l', 'e'}), segs({'r', 'b'})], 2,
        'Η τρίτη στήλη ενώνει τις γραμμές των δύο πρώτων σχημάτων.')
    pairs = [(3, 3), (4, 4), (5, 5), (4, 4), (5, 5), (3, 3), (5, 5), (3, 3)]
    mat([poly_dots(s, n) for s, n in pairs] + [None],
        [poly_dots(4, 5), poly_dots(4, 4), poly_dots(3, 4), poly_dots(5, 4), poly_dots(4, 3)], 1,
        'Οι κουκκίδες είναι όσες και οι πλευρές του σχήματος, και κάθε γραμμή έχει τρίγωνο, τετράγωνο και πεντάγωνο. Λείπει τετράγωνο με 4 κουκκίδες.')
    return items
