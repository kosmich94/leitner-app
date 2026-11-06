#!/usr/bin/env python3
"""Χτίζει το questions.json από τα PDF του Μητρώου Θεμάτων Γνώσεων.

Χρήση: python build_questions.py <φάκελος PDF> <questions.json>
Απαιτεί PyMuPDF. Η σωστή απάντηση αναγνωρίζεται από το κόκκινο χρώμα.
Το id κάθε ερώτησης προκύπτει από το περιεχόμενό της, ώστε η πρόοδος να
διατηρείται όταν αλλάζει η αρίθμηση σε νέα έκδοση του Μητρώου.
"""
import collections, glob, hashlib, json, os, re, sys, unicodedata
import fitz

SUBJECTS = {1: 'Συνταγματικό Δίκαιο', 2: 'Διοικητικό Δίκαιο', 3: 'Ευρωπαϊκοί Θεσμοί',
            4: 'Οικονομικές Επιστήμες', 5: 'Πληροφορική', 6: 'Σύγχρονη Ιστορία',
            7: 'Κώδικας Κατάστασης', 8: 'GDPR', 9: 'Διοίκηση Επιχειρήσεων',
            10: 'Ανθρώπινο Δυναμικό', 11: 'Κώδικας Συμπεριφοράς'}
QRE = re.compile(r'^\s*(\d{1,4})\s*[\.\)]\s*(.*)$', re.S)
ORE = re.compile(r'^\s*([αβγδ])\s*[\.\)]\s*(.*)$', re.S)
# Ερωτήσεις με ελαττώματα στο PDF: (αντικείμενο, αριθμός) -> διόρθωση
SPLIT = {(2, 268): (2, r'\s+δ\.\s+'), (3, 97): (0, r'\s+β\s+(?=Μόνο)')}
ANSWER = {(2, 268): 0, (3, 97): 0, (4, 227): 1, (5, 160): 1}
TABLES = {
    (4, 150): ('Στον παρακάτω πίνακα παρουσιάζονται τα κλιμάκια φορολογητέου εισοδήματος και οι αντίστοιχοι οριακοί φορολογικοί συντελεστές.',
               [['Κλιμάκια Φορολογητέου Εισοδήματος (€)', 'Οριακός Φορολογικός Συντελεστής (%)'],
                ['0 – 10.000', '10'], ['10.001 – 30.000', '20'], ['30.001 και άνω', '40']],
               'Η φορολογία στο εν λόγω παράδειγμα χαρακτηρίζεται ως:'),
    (4, 197): ('Για τις χώρες Α, Β, Γ και Δ υπολογίστηκε ο συντελεστής Gini για το προσωπικό εισόδημα ως ακολούθως:',
               [['Χώρα Α', '0,38'], ['Χώρα Β', '0,45'], ['Χώρα Γ', '0,42'], ['Χώρα Δ', '0,40']],
               'Σε ποια από τέσσερις χώρες είναι πιθανό να αντιστοιχεί μεγαλύτερη οικονομική ανισότητα;'),
}
# Επιλογές που αναφέρονται στις άλλες: η σειρά τους δεν ανακατεύεται
KEEP_ORDER = re.compile(r'παραπάνω|ανωτέρω|λοιπ(ές|ά|οί)\b|προηγούμεν(ες|α)\s+απαντ', re.I)


def is_red(c):
    r, g, b = (c >> 16) & 255, (c >> 8) & 255, c & 255
    return r >= 150 and g <= 60 and b <= 60


def clean(t):
    return re.sub(r'\s+', ' ', t.replace('­', '')).strip()


def norm(t):
    t = unicodedata.normalize('NFD', t.lower())
    return re.sub(r'\W+', ' ', ''.join(c for c in t if not unicodedata.combining(c))).strip()


def page_lines(page):
    lines = []
    for b in page.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            t = ''.join(s['text'] for s in l['spans'])
            if t.strip():
                lines.append([round(l['bbox'][1]), l['bbox'][0], t, list(l['spans'])])
    lines.sort(key=lambda x: (x[0], x[1]))
    merged = []
    for y, x, t, sp in lines:
        if merged and abs(merged[-1][0] - y) <= 3:
            merged[-1][2] += t
            merged[-1][3] += sp
        else:
            merged.append([y, x, t, sp])
    return merged


def parse(path, subj):
    qs, cur, opt = [], None, None
    for page in fitz.open(path):
        for _, _, t, sp in page_lines(page):
            if re.search(r'Σελίδα\s+\d+\s+από\s+\d+', t):
                continue
            red = sum(len(s['text'].strip()) for s in sp if is_red(s['color']))
            tot = sum(len(s['text'].strip()) for s in sp) or 1
            q = QRE.match(t)
            if q:
                num = int(q.group(1))
                exp = qs[-1]['n'] + 1 if qs else 1
                if num == exp:
                    cur = {'n': num, 'q': q.group(2), 'opts': []}
                    qs.append(cur)
                    opt = None
                    continue
            m = ORE.match(t)
            if m and cur is not None:
                opt = {'t': m.group(2), 'red': red, 'tot': tot}
                cur['opts'].append(opt)
            elif opt is not None:
                opt['t'] += ' ' + t
                opt['red'] += red
                opt['tot'] += tot
            elif cur is not None:
                cur['q'] += ' ' + t
    return qs


def finish(q, subj):
    key = (subj, q['n'])
    opts = q['opts']
    if key in SPLIT:
        idx, pat = SPLIT[key]
        a, b = re.split(pat, opts[idx]['t'], maxsplit=1)
        opts[idx]['t'] = a
        opts.insert(idx + 1, {'t': b, 'red': 0, 'tot': 1})
    texts = [clean(o['t']) for o in opts]
    assert len(texts) == 4 and all(texts), key
    reds = [i for i, o in enumerate(opts) if o['red'] / o['tot'] > 0.5]
    ans = ANSWER.get(key, reds[0] if len(reds) == 1 else None)
    assert ans is not None, (key, reds)
    stem = clean(q['q'])
    rec = {'s': subj, 'n': q['n'], 'q': stem, 'o': texts, 'a': ans}
    if key in TABLES:
        rec['q'], rec['t'], rec['q2'] = TABLES[key]
    if any(KEEP_ORDER.search(t) for t in texts):
        rec['k'] = 1
    base = '|'.join([str(subj), norm(stem)] + sorted(norm(t) for t in texts))
    rec['i'] = hashlib.sha1(base.encode()).hexdigest()[:10]
    return rec


def main(src, out):
    files = sorted(glob.glob(os.path.join(src, '*.pdf')), key=lambda p: int(os.path.basename(p).split('.')[0]))
    questions = []
    for f in files:
        subj = int(os.path.basename(f).split('.')[0])
        qs = parse(f, subj)
        questions += [finish(q, subj) for q in qs]
        print(f'{subj:2} {SUBJECTS[subj]:28} {len(qs)}')
    ids = collections.Counter(q['i'] for q in questions)
    dup = [k for k, v in ids.items() if v > 1]
    assert not dup, dup
    with open(out, 'w', encoding='utf-8') as fh:
        json.dump({'subjects': SUBJECTS, 'questions': questions}, fh, ensure_ascii=False, separators=(',', ':'))
    print('ΣΥΝΟΛΟ', len(questions), 'με σταθερή σειρά επιλογών', sum('k' in q for q in questions))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
