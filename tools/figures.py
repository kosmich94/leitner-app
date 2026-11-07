"""Σχεδιάζει ως SVG τις ασκήσεις επαγωγικού συλλογισμού, ώστε να μένουν καθαρές σε κάθε οθόνη."""
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
    return ''.join({'c': circle(r, x, 50, fill), 's': square(r - 2.5, x, 50, fill), 't': poly(3, r + 2, x, 52, fill)}[kind] for x in xs)


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


# ---------- Επιπλέον ασκήσεις επαγωγικού με επίπεδα δυσκολίας ----------
# Επίπεδο 1: ένας κανόνας. Επίπεδο 2: δύο κανόνες μαζί. Επίπεδο 3: τρεις κανόνες ή πίνακας 3x3.

LEVELS = [1, 3, 1, 1, 1, 1, 1, 2, 2, 1, 1, 2, 2, 2, 2, 3, 2, 3, 3, 3]
CORNERS = [(24, 24), (76, 24), (76, 76), (24, 76)]


def ring2(black, white):
    spots = [(0, 0), (1, 0), (2, 0), (2, 1), (2, 2), (1, 2), (0, 2), (0, 1)]
    out = rect(40, 40, 20, 20, GREY, sw=1.8)
    for i, (c, r) in enumerate(spots):
        x, y = 20 + c * 20, 20 + r * 20
        out += rect(x, y, 20, 20, sw=1.8)
        if i == black:
            out += circle(6.5, x + 10, y + 10, INK)
        if i == white:
            out += circle(6.5, x + 10, y + 10, '#fff')
    return out


def corner_box(deg, dot, tri):
    """Βέλος στο κέντρο, μαύρη κουκκίδα και τρίγωνο σε γωνίες."""
    out = arrow(deg) .replace('stroke-width="5"', 'stroke-width="4"')
    dx, dy = CORNERS[dot]
    out += circle(7, dx, dy, INK)
    tx, ty = CORNERS[tri]
    out += poly(3, 9, tx, ty + 1, '#fff')
    return out


def sized(r, kind='s', fill='#fff'):
    return square(r, fill=fill) if kind == 's' else circle(r, fill=fill)


def place(rng, correct, wrong):
    options = wrong[:4]
    answer = rng.randrange(5)
    options.insert(answer, correct)
    assert len(set(options)) == 5, 'οι επιλογές πρέπει να διαφέρουν'
    return options, answer


def generated_items(seed=7):
    rng = random_module.Random(seed)
    out = []

    def seq(frames, correct, wrong, lvl, why):
        options, answer = place(rng, correct, wrong)
        out.append((sequence_figure(frames + [None], options), answer, why, lvl))

    def mat(cells, correct, wrong, lvl, why):
        options, answer = place(rng, correct, wrong)
        out.append((matrix_figure(cells + [None], options), answer, why, lvl))

    for start, step in ((0, 90), (45, -45), (90, 45), (180, -90)):
        a = lambda k: arrow((start + k * step) % 360)
        way = 'δεξιόστροφα' if step > 0 else 'αριστερόστροφα'
        seq([a(k) for k in range(4)], a(4), [a(3), a(5), arrow((start + 4 * step + 180) % 360), arrow((start + 4 * step + 90 if abs(step) == 45 else start + 4 * step + 45) % 360)], 1,
            f'Το βέλος στρέφεται {abs(step)}° {way} σε κάθε βήμα.')
    for start, inc in ((2, 2), (1, 3), (11, -2)):
        n = lambda k: start + k * inc
        near = []
        for v in (n(4) + 1, n(4) - 1, n(3), n(4) + 2, n(4) - 2, n(4) + 3):
            if v > 0 and v != n(4) and v not in near:
                near.append(v)
        seq([dots(n(k)) for k in range(4)], dots(n(4)), [dots(v) for v in near[:4]], 1,
            f'Οι κουκκίδες {"αυξάνονται" if inc > 0 else "μειώνονται"} κατά {abs(inc)} σε κάθε βήμα.')
    for start, step in ((5, 1), (2, -2), (0, 2)):
        p = lambda k: (start + k * step) % 8
        near = []
        for v in (p(3), p(5), p(4) + 4, p(4) + 1, p(4) - 1, p(4) + 2):
            if v % 8 != p(4) and v % 8 not in near:
                near.append(v % 8)
        seq([ring(p(k)) for k in range(4)], ring(p(4)), [ring(v) for v in near[:4]], 1,
            f'Το μαύρο κελί προχωρά {abs(step)} {"θέση" if abs(step) == 1 else "θέσεις"} {"δεξιόστροφα" if step > 0 else "αριστερόστροφα"} σε κάθε βήμα.')
    seq([quad({0}), quad({3}), quad({2}), quad({1})], quad({0}), [quad({1}), quad({2}), quad({3}), quad({0, 3})], 1,
        'Το μαύρο τετράγωνο κινείται αριστερόστροφα. Μετά την πάνω δεξιά θέση επιστρέφει πάνω αριστερά.')
    seq([sized(12), sized(18), sized(24), sized(30)], sized(36), [sized(30), sized(42), sized(36, 'c'), sized(24)], 1,
        'Το τετράγωνο μεγαλώνει σταθερά σε κάθε βήμα.')

    for (b0, bs), (w0, ws) in (((0, 1), (4, -1)), ((1, 2), (7, -1)), ((6, -2), (2, 1))):
        b = lambda k: (b0 + k * bs) % 8
        w = lambda k: (w0 + k * ws) % 8
        frames = [ring2(b(k), w(k)) for k in range(4)]
        if any(b(k) == w(k) for k in range(5)):
            continue
        wrong = [ring2(b(4), w(3)), ring2(b(3), w(4)), ring2(w(4), b(4)), ring2(b(5), w(4))]
        seq(frames, ring2(b(4), w(4)), wrong, 2,
            f'Η μαύρη κουκκίδα προχωρά {abs(bs)} {"θέση" if abs(bs) == 1 else "θέσεις"} {"δεξιόστροφα" if bs > 0 else "αριστερόστροφα"} '
            f'και η λευκή {abs(ws)} {"θέση" if abs(ws) == 1 else "θέσεις"} {"δεξιόστροφα" if ws > 0 else "αριστερόστροφα"}.')
    for step, d0 in ((45, 2), (-90, 1)):
        f = lambda deg, n: arrow(deg) + dots(n, 84, 16, 12, 3.4)
        frames = [f((k * step) % 360, d0 + k) for k in range(4)]
        good = f((4 * step) % 360, d0 + 4)
        wrong = [f((3 * step) % 360, d0 + 4), f((4 * step) % 360, d0 + 3), f((4 * step + 180) % 360, d0 + 4), f((5 * step) % 360, d0 + 5)]
        seq(frames, good, wrong, 2, f'Το βέλος στρέφεται {abs(step)}° {"δεξιόστροφα" if step > 0 else "αριστερόστροφα"} και οι κουκκίδες αυξάνονται κατά μία.')
    sf = lambda sides, fill: poly(sides, 32, fill=fill, rot=-90 if sides % 2 else -90 + 180 / sides)
    seq([sf(3, '#fff'), sf(4, INK), sf(5, '#fff'), sf(6, INK)], sf(7, '#fff'), [sf(7, INK), sf(6, '#fff'), sf(8, '#fff'), circle(32)], 2,
        'Οι πλευρές αυξάνονται κατά μία και το χρώμα εναλλάσσεται λευκό και μαύρο.')

    for deg0, dstep, d0, t0 in ((0, -90, 0, 1), (90, 90, 2, 1), (45, 90, 3, 0)):
        st = lambda k: corner_box((deg0 + k * dstep) % 360, (d0 - k) % 4, (t0 + k) % 4)
        good = st(4)
        wrong = [corner_box((deg0 + 3 * dstep) % 360, (d0 - 4) % 4, (t0 + 4) % 4), corner_box((deg0 + 4 * dstep) % 360, (d0 - 3) % 4, (t0 + 4) % 4),
                 corner_box((deg0 + 4 * dstep) % 360, (d0 - 4) % 4, (t0 + 3) % 4), corner_box((deg0 + 4 * dstep + 180) % 360, (d0 - 4) % 4, (t0 + 5) % 4)]
        seq([st(k) for k in range(4)], good, wrong, 4,
            f'Τρεις κανόνες μαζί: το βέλος στρέφεται {abs(dstep)}° {"δεξιόστροφα" if dstep > 0 else "αριστερόστροφα"}, '
            'η μαύρη κουκκίδα πάει μία γωνία αριστερόστροφα και το τρίγωνο μία γωνία δεξιόστροφα.')
    fills = {'w': '#fff', 'g': '#9a9a9a', 'b': INK}
    for _ in range(2):
        kinds = rng.sample(['c', 's', 't'], 3)
        tones = rng.sample(['w', 'g', 'b'], 3)
        cell = lambda r, c: shape(kinds[(r + c) % 3], fill=fills[tones[(r + 2 * c) % 3]])
        cells = [cell(r, c) for r in range(3) for c in range(3)][:8]
        good = cell(2, 2)
        k, t = kinds[(2 + 2) % 3], tones[(2 + 4) % 3]
        other_k = [x for x in 'cst' if x != k]
        other_t = [x for x in 'wgb' if x != t]
        wrong = [shape(other_k[0], fill=fills[t]), shape(k, fill=fills[other_t[0]]), shape(other_k[1], fill=fills[other_t[1]]), shape(k, fill=fills[other_t[1]])]
        mat(cells, good, wrong, 3, 'Κάθε γραμμή και κάθε στήλη έχει μία φορά κάθε σχήμα και κάθε απόχρωση. Βρες ποιο σχήμα και ποια απόχρωση λείπουν.')
    keys = list(SEGMENTS)
    made = 0
    while made < 2:
        rows = []
        for _ in range(3):
            a, b = set(rng.sample(keys, 2)), set(rng.sample(keys, 2))
            rows.append((a, b, a ^ b))
        a, b, c = rows[2]
        if len(c) < 2 or any(len(r[2]) == 0 for r in rows):
            continue
        wrong = [segs(a | b), segs(a), segs(b), segs(c ^ {rng.choice([k for k in keys if k not in c])})]
        try:
            cells = [segs(x) for r in rows for x in r][:8]
            mat(cells, segs(c), wrong, 3, 'Η τρίτη στήλη κρατά μόνο τις γραμμές που υπάρχουν σε ένα από τα δύο πρώτα σχήματα· οι κοινές σβήνουν.')
            made += 1
        except AssertionError:
            continue
    return out


import random as random_module  # noqa: E402


# ---------- Τύποι που αναφέρθηκε ότι έπεσαν το 2025 ----------
# Σχήματα μέσα σε σχήματα, σχήμα που περνά στο επόμενο καρέ, εμφάνιση/εξαφάνιση, κουκκίδες που ορίζουν πλευρές,
# τρία στοιχεία σε πλέγμα, προσανατολισμός γραμμών, αστέρι. Δικές μας ασκήσεις, όχι του ΑΣΕΠ.

KIND_LIST = ['c', 's', 't', 'd', 'p', 'h']


def any_shape(kind, r, cx=50, cy=50, fill='#fff'):
    if kind == 'c':
        return circle(r, cx, cy, fill)
    sides, rot = {'s': (4, -45), 't': (3, -90), 'd': (4, -90), 'p': (5, -90), 'h': (6, 0)}[kind]
    return poly(sides, r * (1.08 if kind in 'st' else 1), cx, cy + (r * .12 if kind == 't' else 0), fill, rot)


def nest(kinds):
    sizes = [40, 27, 15, 8]
    return ''.join(any_shape(k, sizes[i]) for i, k in enumerate(kinds))


def corners_pair(items):
    """items: λίστα από (θέση 0-3, σχήμα, μαύρο)."""
    out = rect(14, 14, 72, 72, sw=1.6)
    for pos, kind, black in items:
        x, y = [(32, 32), (68, 32), (68, 68), (32, 68)][pos]
        out += any_shape(kind, 12, x, y, INK if black else '#fff')
    return out


def grid4(marks):
    """marks: λίστα από (στήλη, γραμμή, τύπος) σε πλέγμα 4x4."""
    out = ''
    for r in range(4):
        for c in range(4):
            out += rect(14 + c * 18, 14 + r * 18, 18, 18, sw=1.4)
    for c, r, kind in marks:
        x, y = 23 + c * 18, 23 + r * 18
        if kind in ('b', 'w'):
            out += circle(6, x, y, INK if kind == 'b' else '#fff')
        else:
            out += poly(3, 7.5, x, y + 1, '#fff' if kind == 'tw' else INK)
    return out


def three_lines(angles):
    out = ''
    for i, deg in enumerate(angles):
        y = 24 + i * 26
        out += f'<g transform="rotate({deg} 50 {y})"><line x1="38" y1="{y}" x2="62" y2="{y}" stroke="{INK}" stroke-width="4.5" stroke-linecap="round"/></g>'
    return out


def star_fig(tip, count):
    pts = []
    for i in range(10):
        r = 42 if i % 2 == 0 else 17
        a = math.radians(-90 + i * 36)
        pts.append((50 + r * math.cos(a), 52 + r * math.sin(a)))
    out = '<polygon points="' + ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts) + f'" fill="#fff" stroke="{INK}" stroke-width="2.2"/>'
    tx, ty = pts[(tip % 5) * 2]
    tx, ty = 50 + (tx - 50) * .78, 52 + (ty - 52) * .78
    out += circle(5, tx, ty, INK)
    out += dots(count, 50, 53, 9, 2.6)
    return out


def generated_items_2025(seed=2025):
    rng = random_module.Random(seed)
    out = []

    def seq(frames, correct, wrong, lvl, why):
        options, answer = place(rng, correct, wrong)
        out.append((sequence_figure(frames + [None], options), answer, why, lvl))

    # 1. Σχήματα μέσα σε σχήματα: κάθε καρέ χάνει το εξωτερικό και κερδίζει νέο εσωτερικό.
    for depth, lvl in ((3, 3), (2, 2), (4, 3)):
        order = rng.sample(KIND_LIST, 6)
        frame = lambda k: [order[(k + i) % 6] for i in range(depth)]
        good = frame(4)
        wrong = [nest(list(reversed(good))), nest(frame(3)), nest(good[:-1] + [order[(4 + depth + 1) % 6]]), nest(good[:-1] if depth > 2 else good + [order[(6 + depth) % 6]])]
        seq([nest(frame(k)) for k in range(4)], nest(good), wrong, lvl,
            'Το εσωτερικό σχήμα κάθε καρέ γίνεται το επόμενο πιο έξω: σε κάθε βήμα φεύγει το εξωτερικό και μπαίνει ένα νέο στο κέντρο.'
            if depth > 2 else 'Το εσωτερικό σχήμα κάθε καρέ γίνεται το εξωτερικό του επόμενου, και μέσα του μπαίνει ένα νέο σχήμα.')

    # 2. Εμφάνιση και εξαφάνιση: το νεότερο σχήμα είναι μαύρο, το παλαιότερο λευκό, και προχωρούν δεξιόστροφα.
    for keep in (2, 2, 3):
        kinds = rng.sample(KIND_LIST, 4)
        frame = lambda k: [((k + i) % 4, kinds[(k + i) % 4], i == keep - 1) for i in range(keep)]
        good = frame(4)
        swap = [(p, kd, not b) for p, kd, b in good]
        extra = good + [((4 + keep) % 4, kinds[(4 + keep) % 4], False)] if keep == 2 else good[:2]
        wrong_kind = [(p, kinds[(p + 1) % 4] if i == 0 else kd, b) for i, (p, kd, b) in enumerate(good)]
        seq([corners_pair(frame(k)) for k in range(4)], corners_pair(good),
            [corners_pair(frame(3)), corners_pair(swap), corners_pair(extra), corners_pair(wrong_kind)], 2,
            'Σε κάθε βήμα εμφανίζεται ένα νέο σχήμα στην επόμενη γωνία δεξιόστροφα (μαύρο, γιατί είναι το νεότερο) και εξαφανίζεται το παλαιότερο. Κάθε γωνία έχει πάντα το ίδιο σχήμα.')

    # 3. Οι κουκκίδες ορίζουν τις πλευρές του επόμενου σχήματος.
    for s0, d0 in ((3, 5), (4, 6), (5, 3)):
        states = [(s0, d0)]
        for _ in range(4):
            s, d = states[-1]
            states.append((d, s + 1))
        fig = lambda s, d: poly(s, 38, rot=-90 if s % 2 else -90 + 180 / s) + dots(d, 50, 52, 15, 3.4)
        s4, d4 = states[4]
        wrong = [fig(d4, s4), fig(s4, d4 - 1), fig(s4 + 1, d4), fig(s4, d4 + 1)]
        seq([fig(*st) for st in states[:4]], fig(s4, d4), wrong, 4,
            'Οι κουκκίδες κάθε καρέ δίνουν τις πλευρές του επόμενου σχήματος, και οι νέες κουκκίδες είναι οι πλευρές του προηγούμενου συν μία.')

    # 4. Τρία στοιχεία κινούνται μαζί σε πλέγμα 4x4.
    made = 0
    while made < 3:
        b0, w0, t0 = (rng.randrange(4), rng.randrange(4)), (rng.randrange(4), rng.randrange(4)), (rng.randrange(4), rng.randrange(4))
        pos = lambda k: [((b0[0] + k) % 4, b0[1], 'b'), (w0[0], (w0[1] + k) % 4, 'w'), ((t0[0] + k) % 4, (t0[1] + k) % 4, 't')]
        if any(len({(c, r) for c, r, _ in pos(k)}) < 3 for k in range(6)):
            continue
        good = pos(4)
        b, w, t = good
        variants = [[pos(3)[0], w, t], [b, pos(5)[1], t], [b, w, pos(3)[2]], [(w[0], w[1], 'b'), (b[0], b[1], 'w'), t]]
        if any(len({(c, r) for c, r, _ in v}) < 3 for v in variants) or len({grid4(v) for v in variants} | {grid4(good)}) < 5:
            continue
        seq([grid4(pos(k)) for k in range(4)], grid4(good), [grid4(v) for v in variants], 4,
            'Τρεις κανόνες μαζί: η μαύρη κουκκίδα πάει μία θέση δεξιά, η λευκή μία θέση κάτω και το τρίγωνο μία θέση διαγώνια. Στην άκρη ξαναρχίζουν από την αρχή.')
        made += 1

    # 5. Γραμμές που αλλάζουν προσανατολισμό με διαφορετικό κανόνα ανά σειρά.
    for a1, step in ((0, 45), (90, -45), (45, 90)):
        ang = lambda k: [(a1 + k * step) % 180, 0, 90 * (k % 2)]
        good = ang(4)
        wrong = [[(a1 + 3 * step) % 180, 0, 0], [good[0], 90, good[2]], [good[0], 0, 90], [(good[0] + 45) % 180 if (good[0] + 45) % 180 != (a1 + 3 * step) % 180 else (good[0] + 135) % 180, 0, good[2]]]
        seq([three_lines(ang(k)) for k in range(4)], three_lines(good), [three_lines(v) for v in wrong], 2,
            f'Κάθε σειρά έχει δικό της κανόνα: η πάνω γραμμή στρέφεται {abs(step)}°, η μεσαία μένει οριζόντια και η κάτω εναλλάσσεται οριζόντια και κάθετη.')

    # 6. Αστέρι: η κουκκίδα πηδά δύο μύτες και οι κουκκίδες στο κέντρο αυξάνονται.
    for t0, c0 in ((0, 1), (3, 2), (1, 1)):
        good = star_fig(t0 + 8, c0 + 4)
        wrong = [star_fig(t0 + 6, c0 + 4), star_fig(t0 + 9, c0 + 4), star_fig(t0 + 8, c0 + 3), star_fig(t0 + 8, c0 + 5)]
        seq([star_fig(t0 + 2 * k, c0 + k) for k in range(4)], good, wrong, 2,
            'Η μαύρη κουκκίδα πηδά δύο μύτες δεξιόστροφα σε κάθε βήμα και οι κουκκίδες στο κέντρο αυξάνονται κατά μία.')
    return out


# ---------- Πολύ δύσκολες ασκήσεις (επίπεδα 4 και 5) ----------
# Επίπεδο 4: τρεις κανόνες ή κανόνες με μεταβαλλόμενο βήμα. Επίπεδο 5: τέσσερις κανόνες ή αριθμητικές σχέσεις.
# Κάθε λάθος επιλογή παραβιάζει έναν μόνο κανόνα, ώστε να μη λύνεται με αποκλεισμό του προφανούς.

FILLS = {'w': '#fff', 'g': '#9a9a9a', 'b': INK}


def boxed_dots(kind, fill, n):
    dot = '#fff' if fill == 'b' else INK
    return any_shape(kind, 38, fill=FILLS[fill]) + dots(n, 50, 52, 15, 3.4, dot)


def generated_items_hard(seed=4040):
    rng = random_module.Random(seed)
    out = []

    def add(figure_fn, frames, correct, wrong, lvl, why):
        options, answer = place(rng, correct, wrong)
        out.append((figure_fn(frames + [None], options), answer, why, lvl))

    # Επίπεδο 4α: πίνακας 3x3 με τρία χαρακτηριστικά (σχήμα, απόχρωση, πλήθος), καθένα μία φορά ανά γραμμή και στήλη.
    for _ in range(3):
        kinds, tones, counts = rng.sample(['c', 's', 't'], 3), rng.sample(['w', 'g', 'b'], 3), rng.sample([1, 2, 3], 3)
        attr = lambda r, c: (kinds[(r + c) % 3], tones[(r + 2 * c) % 3], counts[(2 * r + c) % 3])
        draw = lambda k, t, n: several(k, n, FILLS[t])
        k, t, n = attr(2, 2)
        ok_ = [x for x in 'cst' if x != k]
        ot = [x for x in 'wgb' if x != t]
        on = [x for x in (1, 2, 3) if x != n]
        wrong = [draw(ok_[0], t, n), draw(k, ot[0], n), draw(k, t, on[0]), draw(ok_[1], ot[1], n)]
        add(matrix_figure, [draw(*attr(r, c)) for r in range(3) for c in range(3)][:8], draw(k, t, n), wrong, 4,
            'Τρία χαρακτηριστικά, καθένα μία φορά σε κάθε γραμμή και στήλη: σχήμα, απόχρωση και πλήθος. Έλεγξε και τα τρία χωριστά.')

    # Επίπεδο 4β: βήμα που μεγαλώνει (1, 2, 3, 4) για τη μαύρη, σταθερό για τη λευκή.
    made = 0
    while made < 3:
        b0, w0, wstep = rng.randrange(8), rng.randrange(8), rng.choice([-1, 2])
        b = lambda k: (b0 + k * (k + 1) // 2) % 8
        w = lambda k: (w0 + wstep * k) % 8
        if any(b(k) == w(k) for k in range(5)):
            continue
        cand = [(b(3) + 3, w(4)), (b(4), w(3)), (b(4) + 1, w(4)), (b(4), w(4) + wstep), (w(4), b(4))]
        wrong = []
        for bb, ww in cand:
            bb, ww = bb % 8, ww % 8
            if bb != ww and (bb, ww) != (b(4), w(4)) and (bb, ww) not in wrong:
                wrong.append((bb, ww))
        if len(wrong) < 4:
            continue
        add(sequence_figure, [ring2(b(k), w(k)) for k in range(4)], ring2(b(4), w(4)), [ring2(*x) for x in wrong[:4]], 4,
            f'Η μαύρη κουκκίδα προχωρά δεξιόστροφα με βήμα που μεγαλώνει: 1, 2, 3 και μετά 4 θέσεις. Η λευκή κινείται σταθερά {abs(wstep)} {"θέση" if abs(wstep) == 1 else "θέσεις"} {"αριστερόστροφα" if wstep < 0 else "δεξιόστροφα"}.')
        made += 1

    # Επίπεδο 4γ: περιστροφή που εναλλάσσει +90° και −45°, και κουκκίδες που εναλλάσσουν +2 και −1.
    for a0, d0 in ((0, 1), (45, 2), (90, 1)):
        ang = [a0, a0 + 90, a0 + 45, a0 + 135, a0 + 90]
        cnt = [d0, d0 + 2, d0 + 1, d0 + 3, d0 + 2]
        f = lambda a, n: arrow(a % 360) + dots(n, 84, 16, 12, 3.2)
        wrong = [f(ang[3] + 90, cnt[4]), f(ang[4], cnt[4] + 2), f(ang[4] + 45, cnt[4]), f(ang[4] + 180, cnt[3] - 1)]
        add(sequence_figure, [f(ang[k], cnt[k]) for k in range(4)], f(ang[4], cnt[4]), wrong, 4,
            'Δύο κανόνες με εναλλασσόμενο βήμα: το βέλος στρέφεται +90° και μετά −45°, ξανά και ξανά, και οι κουκκίδες +2 και μετά −1.')

    # Επίπεδο 4δ: σχήματα μέσα σε σχήματα που μετακινούνται, με το εσωτερικό μαύρο κάθε δεύτερο καρέ.
    for _ in range(3):
        order = rng.sample(KIND_LIST, 6)
        layers = lambda k: [order[(k + i) % 6] for i in range(3)]
        sizes = [40, 27, 15]
        fig = lambda ks, black: ''.join(any_shape(kk, sizes[i], fill=INK if (i == 2 and black) else '#fff') for i, kk in enumerate(ks))
        good = fig(layers(4), True)
        wrong = [fig(layers(4), False), fig(list(reversed(layers(4))), True), fig(layers(3), True), fig(layers(5), True)]
        add(sequence_figure, [fig(layers(k), k % 2 == 0) for k in range(4)], good, wrong, 4,
            'Δύο κανόνες: κάθε σχήμα περνά ένα επίπεδο πιο έξω και μπαίνει νέο στο κέντρο, ενώ το εσωτερικό είναι μαύρο κάθε δεύτερο καρέ.')

    # Επίπεδο 5α: κουκκίδες όπου κάθε πλήθος είναι το άθροισμα των δύο προηγούμενων, με εναλλαγή σχήματος και χρώματος.
    for a, b0 in ((1, 2), (2, 1), (1, 3), (2, 3), (3, 1)):
        cnt = [a, b0]
        for _ in range(3):
            cnt.append(cnt[-1] + cnt[-2])
        kind = lambda k: 'c' if k % 2 == 0 else 's'
        tone = lambda k: 'b' if (k // 2) % 2 == 1 else 'w'
        good = boxed_dots(kind(4), tone(4), cnt[4])
        wrong = [boxed_dots(kind(4), tone(4), cnt[4] + 1), boxed_dots(kind(4), tone(4), cnt[4] - 1),
                 boxed_dots(kind(3), tone(4), cnt[4]), boxed_dots(kind(4), 'b', cnt[4])]
        add(sequence_figure, [boxed_dots(kind(k), tone(k), cnt[k]) for k in range(4)], good, wrong, 5,
            'Τρεις κανόνες: οι κουκκίδες είναι το άθροισμα των δύο προηγούμενων πλήθων, το σχήμα εναλλάσσεται κύκλος–τετράγωνο και το χρώμα αλλάζει ανά δύο καρέ (λευκό, λευκό, μαύρο, μαύρο, λευκό).')

    # Επίπεδο 5β: τέσσερις κανόνες σε πλέγμα 4x4.
    made = 0
    while made < 5:
        b0, w0, t0 = (rng.randrange(4), rng.randrange(4)), (rng.randrange(4), rng.randrange(4)), (rng.randrange(4), rng.randrange(4))
        pos = lambda k: [((b0[0] + k * (k + 1) // 2) % 4, b0[1], 'b'), (w0[0], (w0[1] + k) % 4, 'w'),
                         ((t0[0] + k) % 4, (t0[1] + k) % 4, 't' if k % 2 == 0 else 'tw')]
        if any(len({(c, r) for c, r, _ in pos(k)}) < 3 for k in range(5)):
            continue
        good = pos(4)
        bb, ww, tt = good
        nxt = ((pos(3)[0][0] + 1) % 4, bb[1], 'b')
        variants = [[nxt, ww, tt], [bb, pos(3)[1], tt], [bb, ww, (tt[0], tt[1], 'tw')], [bb, ww, (pos(3)[2][0], pos(3)[2][1], 't')]]
        if any(len({(c, r) for c, r, _ in v}) < 3 for v in variants) or len({grid4(v) for v in variants} | {grid4(good)}) < 5:
            continue
        add(sequence_figure, [grid4(pos(k)) for k in range(4)], grid4(good), [grid4(v) for v in variants], 5,
            'Τέσσερις κανόνες: η μαύρη κουκκίδα πάει δεξιά με βήμα 1, 2, 3, 4· η λευκή μία θέση κάτω· το τρίγωνο μία θέση διαγώνια· και το τρίγωνο εναλλάσσεται μαύρο–λευκό.')
        made += 1

    # Επίπεδο 5γ: πίνακας όπου η τρίτη στήλη έχει το άθροισμα των κουκκίδων και κάθε γραμμή άλλο σχήμα.
    for _ in range(5):
        kinds = rng.sample(['c', 's', 'p'], 3)
        rows = []
        for r in range(3):
            x, y = rng.randint(1, 4), rng.randint(1, 4)
            rows.append((x, y, x + y))
        cell = lambda r, c: any_shape(kinds[(r + c) % 3], 38) + dots(rows[r][c], 50, 52, 15, 3.2)
        k = kinds[(2 + 2) % 3]
        n = rows[2][2]
        other = [x for x in kinds if x != k]
        good = any_shape(k, 38) + dots(n, 50, 52, 15, 3.2)
        wrong = [any_shape(k, 38) + dots(n + 1, 50, 52, 15, 3.2), any_shape(k, 38) + dots(abs(rows[2][0] - rows[2][1]) or n + 2, 50, 52, 15, 3.2),
                 any_shape(other[0], 38) + dots(n, 50, 52, 15, 3.2), any_shape(other[1], 38) + dots(n - 1, 50, 52, 15, 3.2)]
        if len(set(wrong + [good])) < 5:
            continue
        add(matrix_figure, [cell(r, c) for r in range(3) for c in range(3)][:8], good, wrong, 5,
            'Δύο κανόνες: σε κάθε γραμμή οι κουκκίδες της τρίτης στήλης είναι το άθροισμα των δύο πρώτων, και κάθε σχήμα εμφανίζεται μία φορά σε κάθε γραμμή και στήλη.')
    return out


# ---------- Οι 8 κατηγορίες επαγωγικού σε όλα τα επίπεδα ----------
# Περιστροφή, μετακίνηση θέσης, εναλλαγή, αύξηση/μείωση, συνδυασμός σχημάτων, αφαίρεση στοιχείων, καθρέφτισμα, χρώμα/σκίαση.
# Οι κατηγορίες ακολουθούν όσες παρουσιάζουν σελίδες προετοιμασίας (π.χ. e-asep.gr). Οι ασκήσεις είναι δικές μας.

def glyph(f, r, cx=50, cy=50, s=1.0, color=INK):
    """Ασύμμετρο «F»: κάθε συνδυασμός περιστροφής και καθρεφτίσματος φαίνεται διαφορετικός."""
    body = (f'<path d="M40 76V24H66M40 48H58" fill="none" stroke="{color}" stroke-width="7" stroke-linecap="square"/>'
            f'<circle cx="62" cy="70" r="5" fill="{color}"/>')
    return f'<g transform="translate({cx} {cy}) rotate({r % 360}) scale({-s if f else s} {s}) translate(-50 -50)">{body}</g>'


def flip_h(state):
    f, r = state
    return (1 - f, (-r) % 360)


def flip_v(state):
    f, r = state
    return (1 - f, (180 - r) % 360)


def turn(state, d):
    f, r = state
    return (f, (r + d) % 360)


ALL_STATES = [(f, r) for f in (0, 1) for r in (0, 90, 180, 270)]


def small_arrow(deg, cx, cy, s=.55):
    return f'<g transform="translate({cx} {cy}) scale({s}) translate(-50 -50)">{arrow(deg)}</g>'


def row_shapes(kinds, slots=7, fills=None):
    step = 72 / (slots - 1)
    out = ''
    for i, k in enumerate(kinds):
        if k is None:
            continue
        out += any_shape(k, 6.5, 14 + i * step, 50, fills[i] if fills else '#fff')
    return out


def dot_ring(present, black=None):
    out = ''
    for i in range(8):
        a = math.radians(-90 + i * 45)
        x, y = 50 + 30 * math.cos(a), 50 + 30 * math.sin(a)
        if i in present:
            out += circle(7, x, y, INK if (black is None or i in black) else '#fff')
        else:
            out += f'<circle cx="{x:.1f}" cy="{y:.1f}" r="7" fill="none" stroke="{GREY}" stroke-width="1.5" stroke-dasharray="2 2"/>'
    return out


def cells9(black):
    out = ''
    for i in range(9):
        r, c = divmod(i, 3)
        out += rect(20 + c * 20, 20 + r * 20, 20, 20, INK if i in black else '#fff', sw=1.6)
    return out


def corner_mark(kind, corner, fill):
    x, y = CORNERS[corner]
    return rect(10, 10, 80, 80, sw=1.4) + any_shape(kind, 11, x, y, fill)


def generated_categories(seed=8):
    rng = random_module.Random(seed)
    out = []

    def distinct(correct, wrong, extra):
        picked = []
        for w in list(wrong) + list(extra):
            if w != correct and w not in picked:
                picked.append(w)
        if len(picked) < 4:
            raise AssertionError('λίγες διαφορετικές επιλογές')
        return picked[:4]

    def seq(frames, correct, wrong, lvl, why, extra=()):
        options, answer = place(rng, correct, distinct(correct, wrong, extra))
        out.append((sequence_figure(frames + [None], options), answer, why, lvl))

    def mat(cells, correct, wrong, lvl, why, extra=()):
        options, answer = place(rng, correct, distinct(correct, wrong, extra))
        out.append((matrix_figure(cells + [None], options), answer, why, lvl))
    # Σημείωση: όπου οι επιλογές δεν βγαίνουν διαφορετικές, η άσκηση παραλείπεται (βλ. try/except παρακάτω).

    def others(good, pool):
        return [x for x in pool if x != good]

    # ---- Καθρέφτισμα ----
    for r0 in (0, 90):
        s0 = (0, r0)
        st = [s0, flip_h(s0), s0, flip_h(s0)]
        good = s0
        wrong = others(good, [flip_h(s0), flip_v(s0), turn(s0, 90), turn(s0, 180)])
        seq([glyph(*x) for x in st], glyph(*good), [glyph(*x) for x in wrong], 1, extra=[glyph(*x) for x in ALL_STATES], why=
            'Το σχήμα καθρεφτίζεται οριζόντια σε κάθε βήμα, οπότε επιστρέφει στην αρχική του μορφή κάθε δεύτερο καρέ.')
    for r0 in (0, 270):
        st = [(0, r0)]
        for k in range(4):
            st.append(flip_h(st[-1]) if k % 2 == 0 else flip_v(st[-1]))
        wrong = others(st[4], [st[3], flip_h(st[4]), turn(st[4], 90), turn(st[4], 270)])
        seq([glyph(*x) for x in st[:4]], glyph(*st[4]), [glyph(*x) for x in wrong], 2, extra=[glyph(*x) for x in ALL_STATES], why=
            'Το σχήμα καθρεφτίζεται εναλλάξ οριζόντια και κάθετα, και κάθε καθρέφτισμα γίνεται πάνω στο προηγούμενο καρέ.')
    for d in (90, -90):
        pair = lambda st, right: glyph(*st, cx=30, s=.5) + glyph(*right, cx=70, s=.5) + f'<line x1="50" y1="18" x2="50" y2="82" stroke="{GREY}" stroke-width="1.5" stroke-dasharray="3 3"/>'
        left = lambda k: (0, (k * d) % 360)
        good = pair(left(4), flip_h(left(4)))
        wrong = [pair(left(4), left(4)), pair(left(4), flip_v(left(4))), pair(left(3), flip_h(left(3))), pair(flip_h(left(4)), left(4) if False else turn(flip_h(left(4)), 180))]
        seq([pair(left(k), flip_h(left(k))) for k in range(4)], good, wrong, 3, extra=[pair(left(4), x) for x in ALL_STATES], why=
            f'Το αριστερό σχήμα στρέφεται {abs(d)}° {"δεξιόστροφα" if d > 0 else "αριστερόστροφα"} σε κάθε βήμα και το δεξί είναι πάντα το καθρέφτισμά του ως προς την κάθετη γραμμή.')
    for r0 in (0, 180):
        st = [(0, r0)]
        for _ in range(4):
            st.append(flip_h(turn(st[-1], 90)))
        f = lambda s, n: glyph(*s) + dots(n, 84, 16, 12, 3.2)
        wrong = [f(turn(st[3], 90), 5), f(st[4], 4), f(flip_h(st[4]), 5), f(turn(st[4], 90), 5)]
        seq([f(st[k], k + 1) for k in range(4)], f(st[4], 5), wrong, 4, extra=[f(x, 5) for x in ALL_STATES], why=
            'Δύο κανόνες: σε κάθε βήμα το σχήμα στρέφεται 90° δεξιόστροφα και μετά καθρεφτίζεται οριζόντια· οι κουκκίδες αυξάνονται κατά μία.')
    for r0 in (0, 90):
        ops = [flip_h, lambda x: turn(x, 90), flip_v, lambda x: turn(x, 90)]
        st = [(0, r0)]
        for k in range(4):
            st.append(ops[k](st[-1]))
        bg = lambda k: GREY if (k // 2) % 2 else '#fff'
        f = lambda s, k: rect(8, 8, 84, 84, bg(k), sw=0) + glyph(*s)
        wrong = [f(st[3], 4), f(flip_h(st[4]), 4), f(st[4], 2), f(turn(st[4], 90), 4)]
        seq([f(st[k], k) for k in range(4)], f(st[4], 4), wrong, 5, extra=[f(x, 4) for x in ALL_STATES], why=
            'Τρεις κανόνες: οι αλλαγές επαναλαμβάνονται με τη σειρά «καθρέφτισμα οριζόντια, στροφή 90°, καθρέφτισμα κάθετα, στροφή 90°», και το φόντο αλλάζει ανά δύο καρέ (λευκό, λευκό, γκρι, γκρι, λευκό).')

    # ---- Αφαίρεση στοιχείων ----
    for _ in range(2):
        kinds = rng.sample(KIND_LIST, 5)
        frame = lambda k: kinds[:5 - k] + [None] * k
        good = row_shapes(frame(4), 5)
        wrong = [row_shapes(kinds[:2] + [None] * 3, 5), row_shapes([None] * 4 + [kinds[4]], 5), row_shapes([kinds[1]] + [None] * 4, 5), row_shapes([None] * 5, 5)]
        seq([row_shapes(frame(k), 5) for k in range(4)], good, wrong, 1,
            'Σε κάθε βήμα αφαιρείται το τελευταίο σχήμα από τα δεξιά. Μένει μόνο το πρώτο.')
    for start in (0, 2):
        pres = lambda k: {(start + i) % 8 for i in range(k, 8)}
        good = dot_ring(pres(4))
        wrong = [dot_ring({(start - i) % 8 for i in range(4, 8)}), dot_ring(pres(3)), dot_ring(pres(5)), dot_ring({(start + i) % 8 for i in range(0, 8, 2)})]
        seq([dot_ring(pres(k)) for k in range(4)], good, wrong, 2,
            'Σε κάθε βήμα αφαιρείται μία κουκκίδα, προχωρώντας δεξιόστροφα. Μετά από τέσσερα βήματα μένει η μισή στεφάνη.')
    for _ in range(2):
        kinds = rng.sample(KIND_LIST, 6) + [rng.choice(KIND_LIST)]
        bounds = [(0, 7), (1, 7), (1, 6), (2, 6), (2, 5)]
        frame = lambda k: [kinds[i] if bounds[k][0] <= i < bounds[k][1] else None for i in range(7)]
        good = row_shapes(frame(4))
        wrong = [row_shapes(frame(3)), row_shapes([kinds[i] if 3 <= i < 6 else None for i in range(7)]), row_shapes([kinds[i] if 2 <= i < 4 else None for i in range(7)]), row_shapes([kinds[i] if i in (2, 4, 5) else None for i in range(7)])]
        seq([row_shapes(frame(k)) for k in range(4)], good, wrong, 3,
            'Τα σχήματα αφαιρούνται εναλλάξ: ένα από αριστερά, μετά ένα από δεξιά, ξανά αριστερά και ούτω καθεξής.')
    keys = list(SEGMENTS)
    made = 0
    while made < 2:
        rows = []
        for _ in range(3):
            a = set(rng.sample(keys, 4))
            b = set(rng.sample(sorted(a), 2))
            rows.append((a, b, a - b))
        a, b, c = rows[2]
        wrong = [segs(a), segs(b), segs(c | {rng.choice(sorted(b))}), segs(a ^ {rng.choice([k for k in keys if k not in a])})]
        try:
            mat([segs(x) for r in rows for x in r][:8], segs(c), wrong, 4,
                'Η τρίτη στήλη είναι η πρώτη χωρίς τις γραμμές της δεύτερης: αφαιρείς ό,τι υπάρχει στο δεύτερο σχήμα.')
            made += 1
        except AssertionError:
            continue
    for _ in range(2):
        kinds = rng.sample(KIND_LIST, 6)
        seqs = [kinds[k:] for k in range(5)]
        order = lambda k: seqs[k] if k % 2 == 0 else list(reversed(seqs[k]))
        fill = lambda k: [INK if (i + k) % 2 == 0 else '#fff' for i in range(len(seqs[k]))]
        f = lambda items, fills: row_shapes(items + [None] * (6 - len(items)), 6, fills + ['#fff'] * (6 - len(fills)))
        good = f(order(4), fill(4))
        wrong = [f(list(reversed(order(4))), fill(4)), f(order(4), fill(3)), f(order(3), fill(4)[:len(order(3))] + ['#fff']), f(kinds[3:5], fill(4))]
        seq([f(order(k), fill(k)) for k in range(4)], good, wrong, 5,
            'Τρεις κανόνες: σε κάθε βήμα αφαιρείται το πρώτο σχήμα της αρχικής σειράς, η σειρά αντιστρέφεται κάθε δεύτερο καρέ, και τα μαύρα–λευκά εναλλάσσονται.')

    # ---- Εναλλαγή ----
    for pair in (('c', 's'), ('t', 'h')):
        f = lambda k: any_shape(pair[k % 2], 30)
        wrong = [any_shape(pair[1], 30), any_shape(pair[0], 30, fill=INK), any_shape('d' if 'd' not in pair else 'p', 30), any_shape(pair[0], 18)]
        seq([f(k) for k in range(4)], f(4), wrong, 1, 'Τα δύο σχήματα εναλλάσσονται σε κάθε βήμα.')
    for _ in range(2):
        kinds = rng.sample(['c', 's', 't', 'p'], 3)
        f = lambda k: any_shape(kinds[k % 3], 30, fill=INK if k % 2 == 0 else '#fff')
        wrong = [any_shape(kinds[1], 30), any_shape(kinds[2], 30, fill=INK), any_shape(kinds[0], 30, fill=INK), any_shape(kinds[1], 30, fill=INK)]
        seq([f(k) for k in range(4)], f(4), wrong, 3, extra=[any_shape(x, 30, fill=c) for x in kinds + ['d'] for c in (INK, '#fff')], why=
            'Δύο εναλλαγές με διαφορετικό ρυθμό: τα σχήματα επαναλαμβάνονται ανά τρία, ενώ το χρώμα εναλλάσσεται μαύρο–λευκό σε κάθε βήμα.')
    for _ in range(2):
        kinds = rng.sample(['c', 's', 't'], 3)
        f = lambda k: corner_mark(kinds[k % 3], k % 4, INK if k % 2 == 0 else '#fff')
        wrong = [corner_mark(kinds[1], 0, INK), corner_mark(kinds[1], 1, '#fff'), corner_mark(kinds[1], 0, '#fff'), corner_mark(kinds[2], 0, INK)]
        seq([f(k) for k in range(4)], f(4), wrong, 4, extra=[corner_mark(x, c, fl) for x in kinds for c in range(4) for fl in (INK, '#fff')], why=
            'Τρεις εναλλαγές μαζί: σχήμα ανά τρία, χρώμα ανά δύο, και θέση που προχωρά μία γωνία δεξιόστροφα.')
    for _ in range(2):
        kinds = rng.sample(['c', 's', 't'], 3)
        f = lambda k: corner_mark(kinds[k % 3], (2 * k) % 4, INK if (k // 2) % 2 == 0 else '#fff') + dots(k + 1, 50, 50, 12, 3.2)
        k = 4
        wrong = [corner_mark(kinds[1], 0, INK) + dots(4, 50, 50, 12, 3.2), corner_mark(kinds[1], 2, INK) + dots(5, 50, 50, 12, 3.2),
                 corner_mark(kinds[1], 0, '#fff') + dots(5, 50, 50, 12, 3.2), corner_mark(kinds[2], 0, INK) + dots(5, 50, 50, 12, 3.2)]
        seq([f(i) for i in range(4)], f(4), wrong, 5, extra=[corner_mark(x, c, fl) + dots(5, 50, 50, 12, 3.2) for x in kinds for c in range(4) for fl in (INK, '#fff')], why=
            'Τέσσερις κανόνες: σχήμα ανά τρία, θέση που πηδά δύο γωνίες, χρώμα που αλλάζει ανά δύο καρέ, και κουκκίδες που αυξάνονται κατά μία.')

    # ---- Συνδυασμός σχημάτων ----
    single = [('t',), ('b',), ('l',), ('r',)]
    for _ in range(2):
        rows = []
        pool = rng.sample(['t', 'b', 'l', 'r', 'd', 'e'], 6)
        for i in range(3):
            a, b = pool[(2 * i) % 6], pool[(2 * i + 1) % 6]
            rows.append(({a}, {b}, {a, b}))
        a, b, c = rows[2]
        wrong = [segs(a), segs(b), segs(c | {rng.choice([x for x in pool if x not in c])}), segs({rng.choice([x for x in pool if x not in c])} | a)]
        mat([segs(x) for r in rows for x in r][:8], segs(c), wrong, 1, 'Η τρίτη στήλη βάζει μαζί τη γραμμή του πρώτου και τη γραμμή του δεύτερου σχήματος.')
    made = 0
    while made < 2:
        rows = []
        for _ in range(3):
            a, b = set(rng.sample(keys, 2)), set(rng.sample(keys, 2))
            rows.append((a, b, a | b))
        a, b, c = rows[2]
        rest = [x for x in keys if x not in c]
        if not rest:
            continue
        wrong = [segs(a ^ b) if a ^ b != c else segs(a), segs(a), segs(b), segs(c | {rest[0]})]
        try:
            mat([segs(x) for r in rows for x in r][:8], segs(c), wrong, 2, 'Η τρίτη στήλη ενώνει όλες τις γραμμές των δύο πρώτων σχημάτων.')
            made += 1
        except AssertionError:
            continue
    made = 0
    while made < 2:
        rows = []
        for _ in range(3):
            a, b = set(rng.sample(keys, 3)), set(rng.sample(keys, 3))
            rows.append((a, b, a ^ b))
        a, b, c = rows[2]
        if len(c) < 2 or not (a & b) or any(not r[2] for r in rows):
            continue
        wrong = [segs(a | b), segs(a & b), segs(c | {sorted(a & b)[0]}), segs(c - {sorted(c)[0]})]
        try:
            mat([segs(x) for r in rows for x in r][:8], segs(c), wrong, 4,
                'Η τρίτη στήλη κρατά μόνο όσες γραμμές υπάρχουν σε ένα από τα δύο σχήματα· όσες υπάρχουν και στα δύο σβήνουν.')
            made += 1
        except AssertionError:
            continue
    made = 0
    while made < 2:
        rows = []
        for _ in range(3):
            a, b = set(rng.sample(keys, 2)), set(rng.sample(keys, 2))
            x, y = rng.randint(1, 3), rng.randint(1, 3)
            rows.append(((a, x), (b, y), (a | b, x + y)))
        (a, x), (b, y), (c, n) = rows[2]
        cell = lambda sg, k: segs(sg) + dots(k, 50, 50, 10, 3.2)
        wrong = [cell(c, n + 1), cell(a ^ b if a ^ b != c else a, n), cell(c, max(x, y)), cell(a, n)]
        try:
            mat([cell(*v) for r in rows for v in r][:8], cell(c, n), wrong, 5,
                'Δύο κανόνες συνδυασμού: οι γραμμές της τρίτης στήλης είναι όλες οι γραμμές των δύο πρώτων, και οι κουκκίδες είναι το άθροισμά τους.')
            made += 1
        except AssertionError:
            continue

    # ---- Χρώμα και σκίαση ----
    for start in (0, 1):
        sh = lambda k: {(start + k) % 4} if k % 2 == 0 else {(start + k) % 4, (start + k + 1) % 4}
        wrong = [quad(sh(3)), quad({(start + 3) % 4}), quad(sh(5)), quad({(start + 4) % 4, (start + 2) % 4})]
        seq([quad(sh(k)) for k in range(4)], quad(sh(4)), wrong, 2,
            'Η σκίαση προχωρά δεξιόστροφα μία θέση σε κάθε βήμα, και εναλλάξ σκιάζεται ένα ή δύο τετράγωνα.')
    for _ in range(2):
        base = set(rng.sample(range(9), 3))
        blk = lambda k: {(c + k) % 9 for c in base} if k % 2 == 0 else set(range(9)) - {(c + k) % 9 for c in base}
        wrong = [cells9({(c + 4) % 9 for c in base} ^ set(range(9))), cells9({(c + 3) % 9 for c in base}), cells9({(c + 5) % 9 for c in base}), cells9(base)]
        try:
            seq([cells9(blk(k)) for k in range(4)], cells9(blk(4)), wrong, 5,
                'Δύο κανόνες: το μοτίβο προχωρά ένα κελί σε κάθε βήμα (από αριστερά προς τα δεξιά, γραμμή-γραμμή), και κάθε δεύτερο καρέ τα χρώματα αντιστρέφονται.')
        except AssertionError:
            print('προειδοποίηση: παραλείφθηκε μία άσκηση λόγω ίδιων επιλογών')

    # ---- Περιστροφή ----
    for a0 in (0, 90):
        f = lambda k: small_arrow((a0 + 45 * k) % 360, 50, 28) + small_arrow((a0 - 90 * k) % 360, 50, 72)
        wrong = [small_arrow((a0 + 180) % 360, 50, 28) + small_arrow((a0 + 90) % 360, 50, 72), small_arrow((a0 + 135) % 360, 50, 28) + small_arrow(a0 % 360, 50, 72),
                 small_arrow((a0 + 180) % 360, 50, 28) + small_arrow((a0 + 180) % 360, 50, 72), small_arrow(a0 % 360, 50, 28) + small_arrow(a0 % 360, 50, 72)]
        try:
            seq([f(k) for k in range(4)], f(4), wrong, 3, extra=[small_arrow((a0 + 45 * i) % 360, 50, 28) + small_arrow((a0 + 90 * j) % 360, 50, 72) for i in range(8) for j in range(4)], why='Δύο βέλη με διαφορετικό κανόνα: το πάνω στρέφεται 45° δεξιόστροφα και το κάτω 90° αριστερόστροφα.')
        except AssertionError:
            print('προειδοποίηση: παραλείφθηκε μία άσκηση λόγω ίδιων επιλογών')
    for a0 in (0, 45):
        ang = [a0, a0 + 45, a0 + 135, a0 + 270, a0 + 450]
        bg = lambda k: GREY if k % 2 else '#fff'
        f = lambda k, a: rect(8, 8, 84, 84, bg(k), sw=0) + arrow(a % 360)
        wrong = [f(4, ang[3] + 135), f(4, ang[3] + 180), f(3, ang[4]), f(4, ang[4] + 90)]
        seq([f(k, ang[k]) for k in range(4)], f(4, ang[4]), wrong, 5, extra=[f(4, ang[4] + 45 * i) for i in range(1, 8)] + [f(3, ang[4] + 45 * i) for i in range(1, 8)], why=
            'Η γωνία στροφής μεγαλώνει σε κάθε βήμα (45°, 90°, 135°, 180°) και το φόντο εναλλάσσεται λευκό–γκρι.')

    # ---- Μετακίνηση θέσης ----
    snake = [0, 1, 2, 5, 4, 3, 6, 7, 8]
    for st0, step in ((0, 2), (1, 3)):
        pos = lambda k: snake[(st0 + step * k) % 9]
        wrong = [cells9({snake[(st0 + step * 3) % 9]}), cells9({(pos(4) + 1) % 9}), cells9({snake[(st0 + step * 4 + 1) % 9]}), cells9({8 - pos(4)})]
        try:
            seq([cells9({pos(k)}) for k in range(4)], cells9({pos(4)}), wrong, 3,
                f'Το μαύρο κελί κινείται σαν φίδι: δεξιά στην πρώτη γραμμή, αριστερά στη δεύτερη, δεξιά στην τρίτη, {step} κελιά σε κάθε βήμα.')
        except AssertionError:
            print('προειδοποίηση: παραλείφθηκε μία άσκηση λόγω ίδιων επιλογών')

    # ---- Αύξηση ή μείωση ----
    for start in (1, 2):
        cnt = [start]
        for k in range(1, 5):
            cnt.append(cnt[-1] + k)
        wrong = [dots(cnt[3] + 3), dots(cnt[4] - 1), dots(cnt[4] + 1), dots(cnt[3] * 2)]
        seq([dots(cnt[k]) for k in range(4)], dots(cnt[4]), wrong, 3, extra=[dots(cnt[4] + i) for i in (2, -2, 3, -3)], why=
            'Οι κουκκίδες αυξάνονται με βήμα που μεγαλώνει: +1, +2, +3, +4.')
    return out


def inductive_bank():
    """Όλες οι ασκήσεις επαγωγικού: (λεζάντα, svg, θέση σωστής, εξήγηση, επίπεδο)."""
    base = [(tag, figure, answer, why, lvl) for (tag, figure, answer, why), lvl in zip(inductive_items(), LEVELS)]
    extra = [('Άσκηση εξάσκησης', figure, answer, why, lvl) for figure, answer, why, lvl in generated_items() + generated_items_2025() + generated_items_hard() + generated_categories()]
    return base + extra
