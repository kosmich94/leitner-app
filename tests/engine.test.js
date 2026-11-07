const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const L = require('../engine.js');
const { questions } = JSON.parse(fs.readFileSync(path.join(__dirname, '../questions.json'), 'utf8'));
const T = 20000;

test('το αρχείο έχει 1.988 ερωτήσεις με 4 επιλογές και μία σωστή', () => {
  assert.equal(questions.length, 1988);
  assert.ok(questions.every((q) => q.o.length === 4 && q.a >= 0 && q.a <= 3 && q.q));
  assert.equal(new Set(questions.map((q) => q.i)).size, 1988);
});

test('η πρώτη μέρα έχει 50 νέες, ισορροπημένες ανά αντικείμενο', () => {
  const st = L.newState();
  const s = L.createSession(st, questions, T);
  assert.equal(s.queue.length, 50);
  assert.equal(new Set(s.queue.map((x) => x.q.s)).size, 11);
});

test('οι νέες είναι τυχαίες μέσα στο αντικείμενο και όχι με τη σειρά του PDF', () => {
  const st = L.newState();
  const picks = L.pickNew(st, questions, 40, 1).map((q) => q.n);
  assert.equal(new Set(picks).size, 40);
  assert.ok(picks.every((n) => n >= 1 && n <= 265));
  assert.notDeepEqual(picks, Array.from({ length: 40 }, (_, i) => i + 1));
  assert.ok(Math.max(...picks) > 40);
  const other = L.pickNew(st, questions, 40, 1).map((q) => q.n);
  assert.notDeepEqual(picks, other);
});

test('οι τυχαίες νέες καλύπτουν ισορροπημένα όλα τα αντικείμενα', () => {
  const st = L.newState();
  const count = {};
  for (const q of L.pickNew(st, questions, 200)) count[q.s] = (count[q.s] || 0) + 1;
  const totals = {};
  for (const q of questions) totals[q.s] = (totals[q.s] || 0) + 1;
  const shares = Object.keys(totals).map((s) => (count[s] || 0) / totals[s]);
  assert.ok(Math.max(...shares) - Math.min(...shares) < 0.05);
});

test('σωστή απάντηση ανεβάζει κουτί και ορίζει το διάστημα', () => {
  const st = L.newState();
  const s = L.createSession(st, questions, T);
  const id = L.current(s).q.i;
  const r = L.answer(st, s, true, T);
  assert.deepEqual([r.from, r.to], [0, 2]);
  assert.equal(st.cards[id].d, T + 2);
});

test('λάθος στέλνει στο κουτί 1 και η κάρτα ξαναβγαίνει στη συνεδρία χωρίς προαγωγή', () => {
  const st = L.newState();
  const q = questions[0];
  st.cards[q.i] = { b: 5, d: T, c: 4, w: 0 };
  const s = L.createSession(st, questions, T);
  assert.equal(L.current(s).q.i, q.i);
  L.answer(st, s, false, T);
  assert.equal(st.cards[q.i].b, 1);
  assert.equal(st.cards[q.i].d, T + 1);
  const retryAt = s.queue.findIndex((x, i) => i >= s.pos && x.q.i === q.i);
  assert.equal(retryAt, 5);
  assert.ok(s.queue[retryAt].retry);
  s.pos = retryAt;
  const r = L.answer(st, s, true, T);
  assert.equal(r.to, 1);
  assert.equal(st.cards[q.i].b, 1);
  assert.equal(st.cards[q.i].d, T + 1);
});

test('το κουτί 6 δεν ξεπερνιέται και επανέρχεται σε 30 ημέρες', () => {
  const st = L.newState();
  const q = questions[0];
  st.cards[q.i] = { b: 6, d: T, c: 9, w: 0 };
  const s = L.createSession(st, questions, T);
  L.answer(st, s, true, T);
  assert.equal(st.cards[q.i].b, 6);
  assert.equal(st.cards[q.i].d, T + 30);
});

test('η αναίρεση επαναφέρει κάρτα, ημέρα και ουρά', () => {
  const st = L.newState();
  const s = L.createSession(st, questions, T);
  const id = L.current(s).q.i;
  const r = L.answer(st, s, false, T);
  L.undoAnswer(st, s, r.undo);
  assert.equal(st.cards[id], undefined);
  assert.equal(s.pos, 0);
  assert.equal(s.queue.length, 50);
  assert.equal(L.peekDay(st, T).n, 0);
});

test('το όριο νέων μειώνεται με όσες έγιναν σήμερα', () => {
  const st = L.newState();
  const s = L.createSession(st, questions, T);
  for (let i = 0; i < 30; i++) L.answer(st, s, true, T);
  assert.equal(L.todayPlan(st, questions, T).fresh, 20);
});

test('η εξέταση περιορίζει τα διαστήματα και ανεβάζει το όριο νέων', () => {
  const st = L.newState();
  const iso = (d) => new Date(d * 864e5).toISOString().slice(0, 10);
  st.settings.examDate = iso(T + 30);
  assert.equal(L.intervalFor(5, st, T), 7);
  assert.equal(L.intervalFor(5, st, T + 20), 3);
  assert.equal(L.intervalFor(1, st, T), 1);
  assert.equal(L.newLimit(st, questions, T), Math.ceil(1988 / 16));
});

test('οι επιλογές ανακατεύονται, κρατούν τη σωστή και καρφώνουν τις αναφορές', () => {
  for (const q of questions) {
    const a = L.arrangeOptions(q);
    assert.equal(a.filter((x) => x.correct).length, 1);
    assert.equal(a.find((x) => x.correct).t, q.o[q.a]);
    assert.deepEqual(a.map((x) => x.t).sort(), q.o.slice().sort());
  }
  const q = questions.find((x) => x.o[3] === 'Όλα τα παραπάνω');
  assert.equal(L.arrangeOptions(q)[3].t, 'Όλα τα παραπάνω');
});

test('προσομοίωση 120 ημερών: όλη η ύλη καλύπτεται μέσα σε 40 ημέρες', () => {
  const st = L.newState();
  let peak = 0, seed = 7, finishDay = null;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let d = 0; d < 120; d++) {
    const day = T + d;
    const s = L.createSession(st, questions, day);
    let n = 0;
    while (L.current(s)) { L.answer(st, s, rnd() < 0.8, day); n++; }
    peak = Math.max(peak, n);
    if (finishDay === null && L.todayPlan(st, questions, day).unseen === 0) finishDay = d + 1;
  }
  console.log('ύλη καλύφθηκε μέρα', finishDay, '· μέγιστος φόρτος', peak, 'απαντήσεις', '· ετοιμότητα', L.readiness(st, questions));
  assert.ok(finishDay <= 40);
});

test('αντίγραφο ασφαλείας: δέχεται έγκυρο, απορρίπτει ξένο', () => {
  const st = L.newState();
  st.cards.x = { b: 2, d: T, c: 1, w: 0 };
  const back = L.validateBackup(JSON.parse(JSON.stringify({ app: 'leitner', state: st })));
  assert.equal(back.cards.x.b, 2);
  assert.throws(() => L.validateBackup({ foo: 1 }));
  assert.throws(() => L.validateBackup({ app: 'leitner', state: { ...st, cards: { x: { b: 9, d: 1 } } } }));
});

test('οι δεξιότητες έχουν 100 ερωτήσεις με 4 επιλογές, μία σωστή και εξήγηση', () => {
  const { parts, base } = JSON.parse(fs.readFileSync(path.join(__dirname, '../skills.json'), 'utf8'));
  assert.equal(base, 55);
  assert.deepEqual(parts.map((p) => p.items.length), [34, 39, 27]);
  const items = parts.flatMap((p) => p.items);
  assert.deepEqual(items.map((q) => q.n), Array.from({ length: 100 }, (_, i) => i + 1));
  assert.ok(items.every((q) => q.o.length === 4 && q.a >= 0 && q.a <= 3 && q.e && (q.q || q.img)));
  assert.ok(parts[1].items.every((q) => fs.existsSync(path.join(__dirname, '..', q.img))));
});

test('ο γύρος δεξιοτήτων συνεχίζει από όπου έμεινε και δεν επηρεάζει τα κουτιά', () => {
  const st = L.newState();
  const part = { id: 'x', items: [{ n: 1 }, { n: 2 }, { n: 3 }] };
  L.recordSkill(st, 'x', 2, true);
  L.recordSkill(st, 'x', 3, false);
  assert.deepEqual(L.skillProgress(st, part), { answered: 2, correct: 1, total: 3 });
  assert.deepEqual(L.skillQueue(st, part).map((q) => q.n), [1]);
  assert.deepEqual(st.cards, {});
  L.resetSkill(st, 'x');
  assert.equal(L.skillQueue(st, part).length, 3);
});
