/* Μηχανισμός Leitner: καθαρή λογική χωρίς DOM, ώστε να δοκιμάζεται αυτόνομα. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Leitner = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Κουτιά 1-5 με διαστήματα σε ημέρες. Το κουτί 6 κρατά τις κατακτημένες
  // ζεστές, γιατί η ημερομηνία εξέτασης δεν είναι γνωστή εκ των προτέρων.
  const INTERVALS = [1, 2, 4, 8, 16, 30];
  const MAX_BOX = 6;
  const RETRY_GAP = 4;
  const FINAL_STRETCH_DAYS = 14;
  const REFERS_TO_OTHERS = /παραπάνω|ανωτέρω|λοιπ(ές|ά|οί)(?![\p{L}])|προηγούμεν(ες|α)\s+απαντ/iu;

  const dayNum = (date = new Date()) =>
    Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 864e5);

  const parseDay = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return Math.floor(Date.UTC(y, m - 1, d) / 864e5);
  };

  const newState = () => ({
    v: 1,
    cards: {},
    daily: {},
    settings: { newPerDay: 50, examDate: null, theme: 'auto' },
    skills: {},
    exams: [],
    retry: {},
    lastBackup: null,
  });

  const daysLeft = (state, today) =>
    state.settings.examDate ? parseDay(state.settings.examDate) - today : null;

  /** Με ορισμένη εξέταση τα διαστήματα κόβονται, ώστε όλη η ύλη να ξαναπερνά εγκαίρως. */
  function intervalFor(box, state, today) {
    const base = INTERVALS[box - 1];
    const left = daysLeft(state, today);
    if (left === null || left < 0) return base;
    return Math.min(base, left <= FINAL_STRETCH_DAYS ? 3 : 7);
  }

  /** Ημερήσιο όριο νέων: ανεβαίνει αυτόματα αν δεν προλαβαίνεται η ύλη πριν την εξέταση. */
  function newLimit(state, questions, today) {
    const base = state.settings.newPerDay;
    const left = daysLeft(state, today);
    if (left === null || left <= 0) return base;
    const unseen = questions.filter((q) => !state.cards[q.i]).length;
    return Math.max(base, Math.ceil(unseen / Math.max(1, left - FINAL_STRETCH_DAYS)));
  }

  const dayStats = (state, today) => {
    if (!state.daily[today]) state.daily[today] = { n: 0, r: 0, ok: 0 };
    return state.daily[today];
  };

  const peekDay = (state, today) => state.daily[today] || { n: 0, r: 0, ok: 0 };

  function shuffled(list, rng = Math.random) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Ανακατεύει τις επιλογές· όσες αναφέρονται στις άλλες μένουν στη θέση τους. */
  function arrangeOptions(q, rng = Math.random) {
    const items = q.o.map((t, idx) => ({ t, correct: idx === q.a, pinned: REFERS_TO_OTHERS.test(t) }));
    const free = shuffled(items.filter((x) => !x.pinned), rng);
    return items.map((x) => (x.pinned ? x : free.shift()));
  }

  function dueCards(state, questions, today, subject) {
    const pool = questions.filter((q) => {
      const c = state.cards[q.i];
      return c && c.d <= today && (!subject || q.s === subject);
    });
    return shuffled(pool).sort((a, b) => state.cards[a.i].d - state.cards[b.i].d);
  }

  /** Νέες κάρτες τυχαία, με ισορροπία: κάθε φορά από το αντικείμενο με τη μικρότερη κάλυψη. */
  function pickNew(state, questions, count, subject) {
    const groups = new Map();
    for (const q of questions) {
      if (subject && q.s !== subject) continue;
      if (!groups.has(q.s)) groups.set(q.s, { total: 0, seen: 0, fresh: [] });
      const g = groups.get(q.s);
      g.total++;
      if (state.cards[q.i]) g.seen++;
      else g.fresh.push(q);
    }
    for (const g of groups.values()) g.fresh = shuffled(g.fresh);
    const picked = [];
    while (picked.length < count) {
      let best = null;
      for (const g of groups.values()) {
        if (g.fresh.length && (!best || g.seen / g.total < best.seen / best.total)) best = g;
      }
      if (!best) break;
      picked.push(best.fresh.shift());
      best.seen++;
    }
    return shuffled(picked);
  }

  function todayPlan(state, questions, today) {
    const due = dueCards(state, questions, today).length;
    const limit = newLimit(state, questions, today);
    const unseen = questions.filter((q) => !state.cards[q.i]).length;
    const fresh = Math.min(unseen, Math.max(0, limit - peekDay(state, today).n));
    return { due, fresh, limit, unseen };
  }

  /** Μια συνεδρία: πρώτα οι επαναλήψεις, μετά οι νέες, και στο τέλος ό,τι απαντήθηκε λάθος. */
  function createSession(state, questions, today, { subject = null, extraNew = 0 } = {}) {
    const due = extraNew ? [] : dueCards(state, questions, today, subject);
    const budget = extraNew || Math.max(0, newLimit(state, questions, today) - peekDay(state, today).n);
    const fresh = pickNew(state, questions, budget, subject);
    return {
      queue: [...due, ...fresh].map((q) => ({ q, retry: false })),
      pos: 0,
      planned: due.length + fresh.length,
      done: 0,
      correct: 0,
      wrong: 0,
      promoted: 0,
    };
  }

  const current = (s) => s.queue[s.pos] || null;
  const remaining = (s) => s.queue.length - s.pos;

  /**
   * Καταγράφει απάντηση και επιστρέφει τι άλλαξε, μαζί με τα στοιχεία αναίρεσης.
   * Η δεύτερη προσπάθεια της ίδιας ημέρας δεν ανεβάζει κουτί: η κάρτα μένει στο 1.
   */
  function answer(state, session, isCorrect, today) {
    const item = current(session);
    const id = item.q.i;
    const undo = {
      card: state.cards[id] ? { ...state.cards[id] } : null,
      day: { ...peekDay(state, today) },
      session: { ...session, queue: session.queue.slice() },
      id,
      today,
    };
    const stats = dayStats(state, today);
    const isNew = !state.cards[id];
    const card = state.cards[id] || (state.cards[id] = { b: 1, d: today, c: 0, w: 0 });
    const from = isNew ? 0 : card.b;

    if (isNew) stats.n++;
    else stats.r++;

    if (isCorrect) {
      stats.ok++;
      if (!item.retry) {
        card.c++;
        session.correct++;
        card.b = isNew ? 2 : Math.min(card.b + 1, MAX_BOX);
        card.d = today + intervalFor(card.b, state, today);
        session.promoted++;
      }
    } else {
      if (!item.retry) {
        card.w++;
        session.wrong++;
      }
      card.b = 1;
      card.d = today + 1;
      session.queue.splice(session.pos + 1 + RETRY_GAP, 0, { q: item.q, retry: true });
    }
    if (!item.retry) session.done++;
    session.pos++;
    return { from, to: card.b, retry: item.retry, undo };
  }

  function undoAnswer(state, session, undo) {
    if (undo.card) state.cards[undo.id] = undo.card;
    else delete state.cards[undo.id];
    state.daily[undo.today] = undo.day;
    Object.assign(session, undo.session);
  }

  function boxCounts(state, questions) {
    const counts = new Array(MAX_BOX + 1).fill(0);
    for (const q of questions) {
      const c = state.cards[q.i];
      counts[c ? c.b : 0]++;
    }
    return counts;
  }

  /** Ετοιμότητα: μέσο κουτί σε όλη την ύλη, από 0 ως 100. */
  function readiness(state, questions) {
    if (!questions.length) return 0;
    const counts = boxCounts(state, questions);
    const score = counts.reduce((sum, n, box) => sum + n * box, 0);
    return Math.round((score / (questions.length * MAX_BOX)) * 100);
  }

  function subjectStats(state, questions) {
    const map = new Map();
    for (const q of questions) {
      if (!map.has(q.s)) map.set(q.s, { s: q.s, total: 0, seen: 0, c: 0, w: 0, list: [] });
      const row = map.get(q.s);
      row.total++;
      row.list.push(q);
      const c = state.cards[q.i];
      if (c) {
        row.seen++;
        row.c += c.c;
        row.w += c.w;
      }
    }
    return [...map.values()].map((row) => ({
      ...row,
      readiness: readiness(state, row.list),
      accuracy: row.c + row.w ? Math.round((row.c / (row.c + row.w)) * 100) : null,
    }));
  }

  function forecast(state, questions, today, days = 7) {
    const out = new Array(days).fill(0);
    for (const q of questions) {
      const c = state.cards[q.i];
      const offset = c ? Math.max(0, c.d - today) : days;
      if (offset < days) out[offset]++;
    }
    return out;
  }

  function streak(state, today) {
    const active = (d) => {
      const x = state.daily[d];
      return x && x.n + x.r > 0;
    };
    let day = active(today) ? today : today - 1;
    let count = 0;
    while (active(day)) {
      count++;
      day--;
    }
    return count;
  }

  /* Δεξιότητες: γύροι εξάσκησης εκτός κουτιών. Κάθε ερώτηση μετρά μία φορά ανά γύρο. */
  const skillAnswers = (state, id) => state.skills[id] || {};

  function skillProgress(state, part) {
    const done = skillAnswers(state, part.id);
    const answered = part.items.filter((q) => q.n in done);
    return { answered: answered.length, correct: answered.filter((q) => done[q.n]).length, total: part.items.length };
  }

  const skillQueue = (state, part) => shuffled(part.items.filter((q) => !(q.n in skillAnswers(state, part.id))));

  function recordSkill(state, id, n, isCorrect) {
    state.skills[id] = { ...skillAnswers(state, id), [n]: isCorrect ? 1 : 0 };
  }

  function resetSkill(state, id) {
    delete state.skills[id];
  }

  /* Προσομοιώσεις με χρόνο. Η δυσκολία προσαρμόζεται όπως στα τεστ CAT: σωστή → δυσκολότερη, λάθος → ευκολότερη. */
  const nextLevel = (level, isCorrect, max = 5) => Math.max(1, Math.min(max, level + (isCorrect ? 1 : -1)));

  function pickAdaptive(pool, level, used, rng = Math.random) {
    for (const step of [0, 1, -1, 2, -2]) {
      const options = pool.filter((q) => q.lvl === level + step && !used.has(q.n));
      if (options.length) return options[Math.floor(rng() * options.length)];
    }
    return null;
  }

  /** Βαθμός 0-100 όπου οι δυσκολότερες σωστές μετρούν περισσότερο. */
  function adaptiveScore(results, max = 5) {
    if (!results.length) return 0;
    const earned = results.reduce((sum, r) => sum + (r.ok ? r.lvl : 0), 0);
    return Math.round((earned / (results.length * max)) * 100);
  }

  const knowledgeExam = (questions, count = 25, rng = Math.random) => shuffled(questions, rng).slice(0, count);

  function recordExam(state, kind, score, today) {
    state.exams = [...(state.exams || []), { k: kind, d: today, s: score }].slice(-60);
  }

  /* Επανάληψη λαθών στις δεξιότητες: ό,τι απαντήθηκε λάθος ξαναβγαίνει σε 2 ημέρες, μέχρι να απαντηθεί σωστά. */
  const RETRY_DAYS = 2;

  function markRetry(state, kind, n, isCorrect, today) {
    const key = `${kind}:${n}`;
    const retry = { ...(state.retry || {}) };
    if (isCorrect) delete retry[key];
    else retry[key] = today + RETRY_DAYS;
    state.retry = retry;
  }

  const retryDue = (state, kind, today) => Object.entries(state.retry || {})
    .filter(([key, day]) => key.startsWith(`${kind}:`) && day <= today)
    .map(([key]) => Number(key.split(':')[1]));

  const lastExam = (state, kind) => (state.exams || []).filter((e) => e.k === kind).pop() || null;

  function validateBackup(data) {
    const state = data && data.app === 'leitner' ? data.state : null;
    if (!state || typeof state.cards !== 'object' || typeof state.daily !== 'object' || !state.settings) {
      throw new Error('Το αρχείο δεν είναι αντίγραφο ασφαλείας της εφαρμογής.');
    }
    const ok = Object.values(state.cards).every(
      (c) => Number.isInteger(c.b) && c.b >= 1 && c.b <= MAX_BOX && Number.isInteger(c.d)
    );
    if (!ok) throw new Error('Το αντίγραφο ασφαλείας είναι κατεστραμμένο.');
    return { ...newState(), ...state, settings: { ...newState().settings, ...state.settings } };
  }

  return {
    INTERVALS, MAX_BOX, FINAL_STRETCH_DAYS, dayNum, parseDay, newState, daysLeft, intervalFor, newLimit,
    peekDay, arrangeOptions, dueCards, pickNew, todayPlan, createSession, current, remaining, answer,
    undoAnswer, boxCounts, readiness, subjectStats, forecast, streak, skillProgress, skillQueue, recordSkill,
    resetSkill, nextLevel, pickAdaptive, adaptiveScore, knowledgeExam, recordExam, lastExam, markRetry, retryDue, shuffled,
    validateBackup,
  };
});
