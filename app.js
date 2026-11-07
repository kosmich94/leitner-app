/* Οθόνες της εφαρμογής. Η λογική των κουτιών βρίσκεται στο engine.js. */
(function () {
  'use strict';
  const L = window.Leitner;
  const STORE_KEY = 'leitner.state';
  const EXTRA_BATCH = 20;
  const BACKUP_EVERY_DAYS = 7;
  const NEGATION = /(?<!\p{L})(ΔΕΝ|Δεν|δεν|ΕΚΤΟΣ|Εκτός|εκτός|ΛΑΘΟΣ|λάθος|Λάθος|εσφαλμέν\p{L}*|λανθασμέν\p{L}*)(?!\p{L})/gu;
  const LETTERS = ['α', 'β', 'γ', 'δ'];
  const BOX_LABELS = ['Νέες', '1', '2', '3', '4', '5', '★'];
  // Τελευταία ενημέρωση κάθε ενότητας του Μητρώου, όπως τη δείχνει το ΑΣΕΠ.
  const REGISTRY = [[1, '14/4/2026'], [2, '2/11/2026'], [3, '3/4/2026'], [4, '9/7/2026'], [5, '18/9/2026'], [6, '3/4/2026'],
    [7, '3/4/2026'], [8, '3/4/2026'], [9, '3/4/2026'], [10, '3/4/2026'], [11, '3/4/2026']];
  const THEMES = [['auto', 'Αυτόματο'], ['light', 'Φωτεινό'], ['dark', 'Σκούρο']];
  const icon = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const ICONS = {
    skills: icon('<path d="M9.5 18h5M10.5 21h3M12 3a6 6 0 0 0-3.8 10.6c.6.5.9 1.2.9 1.9h5.8c0-.7.3-1.4.9-1.9A6 6 0 0 0 12 3z"/>'),
    home: icon('<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M4 10h16M8 3v4M16 3v4M9 15.5l2 2 4-4"/>'),
    sim: icon('<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V9.5M10 3h4M18.5 6.5l1.5-1.5"/>'),
    progress: icon('<path d="M5 20v-6M12 20V5M19 20v-9"/>'),
    settings: icon('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>'),
    close: icon('<path d="M6 6l12 12M18 6L6 18"/>'),
    check: icon('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    cross: icon('<path d="M6 6l12 12M18 6L6 18"/>'),
    seal: icon('<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/>'),
  };

  const app = document.getElementById('app');
  const toastEl = document.getElementById('toast');
  let questions = [];
  let subjects = {};
  let state = L.newState();
  let view = 'home';
  let study = null;
  let chartPick = {};
  let skillData = null;
  let skill = null;
  let run = null;
  let reader = null;
  let clock = null;
  let exam = null;

  const today = () => L.dayNum();
  const num = (n) => n.toLocaleString('el-GR');
  const plural = (n, one, many) => `${num(n)} ${n === 1 ? one : many}`;
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const boxName = (b) => (b === 0 ? 'Νέα' : b === L.MAX_BOX ? 'Κατακτημένη' : `Κουτί ${b}`);
  const isStandalone = () => window.navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
  const dateOf = (day) => new Date(day * 864e5);

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) state = { ...L.newState(), ...JSON.parse(raw) };
      // Το υλικό του τεστ 2022 (αναλογίες, αριθμητικός) αφαιρέθηκε.
      delete state.skills.verbal;
      delete state.skills.numeric;
    } catch (err) {
      toast('Η αποθηκευμένη πρόοδος δεν διαβάστηκε. Κάνε επαναφορά από αντίγραφο ασφαλείας.');
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (err) {
      toast('Η πρόοδος δεν αποθηκεύτηκε. Έλεγξε τον χώρο του iPhone.');
    }
  }

  let toastTimer;
  function toast(message, action) {
    clearTimeout(toastTimer);
    toastEl.textContent = message;
    if (action) {
      const btn = document.createElement('button');
      btn.textContent = action.label;
      btn.onclick = action.run;
      toastEl.append(btn);
    } else {
      toastTimer = setTimeout(() => { toastEl.hidden = true; }, 3500);
    }
    toastEl.hidden = false;
  }

  function applyTheme() {
    const choice = state.settings.theme;
    const dark = choice === 'dark' || (choice !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#000000' : '#f2f2f7';
  }

  function ring(percent) {
    const length = 2 * Math.PI * 50;
    return `<div class="ring"><svg viewBox="0 0 112 112" aria-hidden="true"><circle class="bg" cx="56" cy="56" r="50"/>
      <circle class="fg" cx="56" cy="56" r="50" stroke-dasharray="${length}" stroke-dashoffset="${length * (1 - percent / 100)}"/></svg><b>${percent}%</b></div>`;
  }

  /* ---------- Σήμερα ---------- */

  function tabs() {
    const item = (id, label) => `<button data-go="${id}" ${view === id ? 'aria-current="page"' : ''}>${ICONS[id]}${label}</button>`;
    return `<nav class="tabs">${item('home', 'Γνώσεις')}${item('skills', 'Δεξιότητες')}${item('sim', 'Προσομοίωση')}${item('progress', 'Πρόοδος')}${item('settings', 'Ρυθμίσεις')}</nav>`;
  }

  function boxOverview() {
    const counts = L.boxCounts(state, questions);
    const boxes = counts.slice(1);
    const max = Math.max(1, ...boxes);
    const columns = boxes.map((n, i) => `<div class="col"><span class="num">${num(n)}</span>
      <span class="track"><i style="height:${n ? Math.max(6, n / max * 100) : 0}%;background:var(--b${i + 1})"></i></span>
      <span class="lab">${BOX_LABELS[i + 1]}</span></div>`).join('');
    return `<section class="card"><div class="row-head"><h2>Τα κουτιά σου</h2>
      <span class="sub">${plural(counts[0], 'νέα', 'νέες')}</span></div><div class="cols">${columns}</div></section>`;
  }

  function backupBanner() {
    const seen = Object.keys(state.cards).length;
    if (seen < 50) return '';
    const age = state.lastBackup === null ? Infinity : today() - state.lastBackup;
    if (age < BACKUP_EVERY_DAYS) return '';
    return `<div class="banner">Η πρόοδός σου υπάρχει μόνο σε αυτό το iPhone. Κράτα ένα αντίγραφο ασφαλείας.
      <button class="linkbtn" data-do="export">Δημιουργία αντιγράφου</button></div>`;
  }

  function installBanner() {
    if (!isIOS() || isStandalone()) return '';
    return `<div class="banner">Για να δουλεύει σαν εφαρμογή και χωρίς internet, πρόσθεσέ την στην οθόνη αφετηρίας.
      <button class="linkbtn" data-go="settings">Δες πώς</button></div>`;
  }

  function examLine() {
    const left = L.daysLeft(state, today());
    if (left === null || left < 0) return '';
    return `<p class="sub">Λειτουργία εξέτασης: ${left === 0 ? 'η εξέταση είναι σήμερα' : `απομένουν ${plural(left, 'ημέρα', 'ημέρες')}`}</p>`;
  }

  function planCard() {
    const plan = L.todayPlan(state, questions, today());
    if (plan.due + plan.fresh > 0) {
      return `<section class="card">
        <div class="plan">
          <div><div class="big">${num(plan.due)}</div><div class="sub">${plan.due === 1 ? 'επανάληψη' : 'επαναλήψεις'}</div></div>
          <div><div class="big">${num(plan.fresh)}</div><div class="sub">${plan.fresh === 1 ? 'νέα ερώτηση' : 'νέες ερωτήσεις'}</div></div>
        </div>
        <button class="btn primary" data-do="start">Ξεκίνα τη μελέτη</button></section>`;
    }
    const more = plan.unseen
      ? `<button class="btn" data-do="extra">Άλλες ${EXTRA_BATCH} νέες ερωτήσεις</button>`
      : '';
    return `<section class="card"><div class="done">${ICONS.seal}<div><p class="done-title">Τελείωσες για σήμερα</p>
      <p class="sub">Οι επόμενες επαναλήψεις θα εμφανιστούν όταν έρθει η ώρα τους.</p></div></div>${more}</section>`;
  }

  function subjectList() {
    const rows = L.subjectStats(state, questions).map((row) => `
      <button class="subject" data-subject="${row.s}">
        <span class="name">${esc(subjects[row.s])}</span>
        <span class="meta">${num(row.seen)} / ${num(row.total)}<span class="chev">›</span></span>
        <span class="bar"><i style="width:${row.seen / row.total * 100}%"></i></span>
      </button>`).join('');
    return `<section class="card"><h2>Μελέτη ανά αντικείμενο</h2><div class="subjects">${rows}</div></section>`;
  }

  function renderHome() {
    const when = new Date().toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long' });
    app.innerHTML = `<main class="screen">
      <header><p class="sub">${esc(when)}</p><h1>Γνώσεις</h1>${examLine()}</header>
      ${installBanner()}${backupBanner()}${planCard()}
      ${boxOverview()}${subjectList()}
    </main>${tabs()}`;
  }

  /* ---------- Μελέτη ---------- */

  function startSession(options) {
    const session = L.createSession(state, questions, today(), options);
    if (!session.queue.length) return false;
    study = { session, options: null, result: null };
    nextCard();
    return true;
  }

  function nextCard() {
    const item = L.current(study.session);
    if (!item) {
      view = 'summary';
      render();
      return;
    }
    study.options = L.arrangeOptions(item.q);
    study.result = null;
    study.picked = null;
    view = 'study';
    render();
    window.scrollTo(0, 0);
  }

  const highlight = (text) => esc(text).replace(NEGATION, '<mark>$1</mark>');

  function tableHtml(rows) {
    const hasHeader = rows[0][1] && !/^[\d,.]+$/.test(rows[0][1]);
    const body = rows.map((r, i) => {
      const cell = hasHeader && i === 0 ? 'th' : 'td';
      return `<tr>${r.map((c) => `<${cell}>${esc(c)}</${cell}>`).join('')}</tr>`;
    }).join('');
    return `<table>${body}</table>`;
  }

  function optionClass(opt, index) {
    if (!study.result) return '';
    if (opt.correct) return 'right';
    return index === study.picked ? 'wrong' : 'dim';
  }

  function feedback() {
    const r = study.result;
    if (!r) return '';
    const wasRight = study.options[study.picked].correct;
    let detail;
    if (r.retry) detail = wasRight ? 'Θα την ξαναδείς αύριο' : 'Θα ξαναεμφανιστεί σε λίγο';
    else if (wasRight) detail = `${boxName(r.from)} → ${boxName(r.to)}`;
    else detail = 'Πίσω στο κουτί 1';
    const undo = wasRight ? '' : '<button class="linkbtn" data-do="undo">Πάτησα λάθος</button>';
    return `<div class="feedback" aria-live="polite">
      <p class="verdict ${wasRight ? 'good' : 'bad'}">${wasRight ? 'Σωστά' : 'Λάθος'} <small>· ${esc(detail)}</small></p>
      <div class="fb-actions">${undo}<button class="btn primary ${undo ? '' : 'solo'}" data-do="next">Επόμενη</button></div>
    </div>`;
  }

  function renderStudy() {
    const { session, options, result } = study;
    const item = result ? study.shown : L.current(session);
    study.shown = item;
    const q = item.q;
    const card = state.cards[q.i];
    const pct = Math.min(100, session.done / session.planned * 100);
    const status = item.retry ? 'Δεύτερη προσπάθεια' : boxName(result ? result.from : card ? card.b : 0);
    const buttons = options.map((opt, i) => {
      const sign = !result ? '' : opt.correct ? ICONS.check : i === study.picked ? ICONS.cross : '';
      return `<button class="option ${optionClass(opt, i)}" data-pick="${i}" ${result ? 'disabled' : ''}>
        <span class="letter">${LETTERS[i]}.</span><span>${esc(opt.t)}</span><span class="sign">${sign}</span></button>`;
    }).join('');
    app.innerHTML = `<div class="study">
      <div class="study-top">
        <button class="close" data-do="exit" aria-label="Έξοδος">${ICONS.close}</button>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <span class="count">${num(session.done)} / ${num(session.planned)}</span>
      </div>
      <div class="study-body ${result ? '' : 'enter'}">
        <div class="tag"><b>${esc(status)}</b><span>${esc(subjects[q.s])} · Ερώτηση ${q.n}</span></div>
        <p class="stem">${highlight(q.q)}</p>
        ${q.t ? tableHtml(q.t) : ''}
        ${q.q2 ? `<p class="stem">${highlight(q.q2)}</p>` : ''}
        <div class="options">${buttons}</div>
      </div>
      ${feedback()}
    </div>`;
  }

  function pick(index) {
    if (study.result) return;
    study.picked = index;
    study.shown = L.current(study.session);
    study.result = L.answer(state, study.session, study.options[index].correct, today());
    save();
    render();
  }

  function undo() {
    L.undoAnswer(state, study.session, study.result.undo);
    study.result = null;
    study.picked = null;
    save();
    render();
  }

  function renderSummary() {
    const s = study.session;
    const total = s.correct + s.wrong;
    const rate = total ? Math.round(s.correct / total * 100) : 0;
    app.innerHTML = `<main class="screen">
      <header><h1>Μπράβο!</h1><p class="sub">Ολοκλήρωσες ${plural(total, 'ερώτηση', 'ερωτήσεις')}.</p></header>
      <section class="card hero">${ring(rate)}<div><h2>Σωστά με την πρώτη</h2>
        <p class="sub">${plural(s.correct, 'ερώτηση ανέβηκε', 'ερωτήσεις ανέβηκαν')} κουτί και ${num(s.wrong)} γύρισαν στο κουτί 1.</p></div></section>
      <button class="btn primary" data-go="home">Τέλος</button>
    </main>`;
  }

  /* ---------- Δεξιότητες ---------- */

  const skillPart = (id) => skillData.parts.find((p) => p.id === id);

  const RUNS = {
    knowledge: { name: 'Γνώσεις', meta: '25 ερωτήσεις', minutes: 25, count: 25 },
    reading: { name: 'Λεκτικός συλλογισμός', meta: '5 κείμενα, 20 δηλώσεις, η δυσκολία προσαρμόζεται', minutes: 25, count: 5 },
    inductive: { name: 'Επαγωγικός συλλογισμός', meta: '18 ερωτήσεις, η δυσκολία προσαρμόζεται', minutes: 24, count: 18 },
    triads: { name: 'Εργασιακές συμπεριφορές', meta: '76 τριάδες', minutes: 30, count: 76 },
  };
  const VERDICTS = ['Σωστό', 'Λάθος', 'Δεν μπορεί να απαντηθεί'];
  const SHORT = ['Σ', 'Λ', 'Δ'];

  const FULL = ['knowledge', 'reading', 'inductive', 'triads'];
  const KIND_NAMES = { full: 'Πλήρης προσομοίωση', knowledge: 'Γνώσεις', reading: 'Λεκτικός', inductive: 'Επαγωγικός', triads: 'Τριάδες' };

  function retryNote(kind) {
    const due = L.retryDue(state, kind, today()).length;
    return due ? ` <em class="due">${num(due)} για επανάληψη</em>` : '';
  }

  const STRATEGY = [
    ['Λεκτικός: πώς τα λύνεις', [
      'Κρίνε κάθε δήλωση μόνο με βάση το κείμενο, όχι με όσα ξέρεις.',
      '«Σωστό»: το κείμενο το λέει ή προκύπτει άμεσα, π.χ. 45 από τους 60 είναι τα τρία τέταρτα.',
      '«Λάθος»: το κείμενο λέει το αντίθετο.',
      '«Δεν μπορεί να απαντηθεί»: το κείμενο δεν το λέει, ακόμη κι αν ακούγεται λογικό.',
      'Πρόσεξε τις λέξεις-παγίδες: «όλοι», «πάντα», «αποκλειστικά», «έχει ήδη», «σχεδιάζει», «πιθανό», «βέβαιο».',
      'Συσχέτιση δεν σημαίνει αιτία. Αν το κείμενο λέει «μπορεί να εξηγεί», η αιτία δεν είναι βέβαιη.']],
    ['Επαγωγικός: πώς τα λύνεις', [
      'Έλεγξε με τη σειρά: θέση και κίνηση, περιστροφή, πλήθος, χρώμα ή γέμισμα, μέγεθος, εναλλαγή.',
      'Συχνά ισχύουν 2 ή 3 κανόνες μαζί. Βρες έναν και κράτα μόνο τις επιλογές που τον τηρούν.',
      'Σε πίνακες 3×3 κοίτα και τις γραμμές και τις στήλες.',
      'Αν κολλήσεις, απόκλεισε ό,τι σίγουρα δεν ταιριάζει και προχώρα. Δεν υπάρχει επιστροφή.']],
    ['Σενάρια: πώς τα λύνεις', [
      'Κερδίζει η πιο σφαιρική λύση, όχι η πιο γρήγορη ή η πιο αυστηρή.',
      'Πρώτα ενημέρωση ή συζήτηση, συχνά κατ’ ιδίαν, και μετά μέτρα.',
      'Τηρούνται η νομιμότητα και η ιεραρχία. Αποφεύγονται οι αυθαίρετες ή ακραίες ενέργειες.',
      'Ο πολίτης εξυπηρετείται χωρίς να αδικούνται οι άλλοι, π.χ. εμβόλιμα όταν υπάρχει χρόνος.',
      'Ο προϊστάμενος στηρίζει και οργανώνει την ομάδα. Δεν κάνει μόνος του όλη τη δουλειά.']],
  ];

  function partRow(part) {
    const { answered, correct, total } = L.skillProgress(state, part);
    return `<button class="subject" data-skill="${part.id}">
        <span class="name">${esc(part.name)}</span>
        <span class="meta">${num(answered)} / ${num(total)}<span class="chev">›</span></span>
        <span class="bar"><i style="width:${answered / total * 100}%"></i></span>
        <span class="hint">${esc(part.hint)}${answered ? ` Σωστές: ${num(correct)}.` : ''}${retryNote(part.id)}</span>
      </button>`;
  }

  function readingProgress() {
    const done = state.skills.reading || {};
    const keys = Object.keys(done);
    return { answered: keys.length, correct: keys.reduce((n, k) => n + done[k], 0), total: skillData.reading.length };
  }

  const missing = (title) => `<main class="screen"><header><h1>${title}</h1></header>
    <p class="sub">Οι ασκήσεις δεν φορτώθηκαν. Άνοιξε την εφαρμογή μία φορά με internet.</p></main>${tabs()}`;

  function renderSkills() {
    if (!skillData) {
      app.innerHTML = missing('Δεξιότητες');
      return;
    }
    const rp = readingProgress();
    app.innerHTML = `<main class="screen">
      <header><h1>Δεξιότητες</h1><p class="sub">Εξάσκηση χωρίς χρόνο, με εξήγηση σε κάθε απάντηση</p></header>
      <section class="card"><div class="subjects">
        <button class="subject" data-do="reading-start">
          <span class="name">Λεκτικός συλλογισμός <em class="new">νέο</em></span>
          <span class="meta">${num(rp.answered)} / ${num(rp.total)}<span class="chev">›</span></span>
          <span class="bar"><i style="width:${rp.answered / rp.total * 100}%"></i></span>
          <span class="hint">Κείμενο και 4 δηλώσεις: Σωστό, Λάθος ή Δεν μπορεί να απαντηθεί.${rp.answered ? ` Σωστές δηλώσεις: ${num(rp.correct)} από ${num(rp.answered * 4)}.` : ''}${retryNote('reading')}</span>
        </button>
        <button class="subject" data-skill="inductive">
          <span class="name">Επαγωγικός συλλογισμός</span>
          <span class="meta">${num(skillPart('inductive').items.length)} ασκήσεις<span class="chev">›</span></span>
          <span class="hint">8 κατηγορίες σε 5 επίπεδα. Η δυσκολία ανεβαίνει με τις σωστές και πέφτει με τις λάθος (CAT), χωρίς όριο ερωτήσεων.${retryNote('inductive')}</span>
        </button>
        ${partRow(skillPart('work'))}</div></section>
      ${STRATEGY.map(([title, tips]) => `<details class="card tips"><summary>${esc(title)}</summary><ul class="facts">${tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></details>`).join('')}
      <p class="sub note">Τα λάθη ξαναβγαίνουν μετά από 2 ημέρες, μέχρι να τα απαντήσεις σωστά. Τα κείμενα λεκτικού, οι ασκήσεις επαγωγικού (εκτός από 2 επίσημα παραδείγματα) και όλες οι εξηγήσεις είναι δικό μας υλικό, όχι του ΑΣΕΠ.</p>
    </main>${tabs()}`;
  }

  /* ---------- Προσομοίωση ---------- */

  function renderSim() {
    if (!skillData) {
      app.innerHTML = missing('Προσομοίωση');
      return;
    }
    const runs = Object.entries(RUNS).map(([kind, r]) => {
      const last = L.lastExam(state, kind);
      const result = !last ? '' : kind === 'triads' ? ` Τελευταία φορά: ${last.s === 100 ? 'ολοκληρώθηκε' : 'δεν ολοκληρώθηκε'}.` : ` Τελευταίος βαθμός: ${last.s}/100.`;
      return `<button class="subject" data-run="${kind}">
        <span class="name">${esc(r.name)}</span><span class="meta">${r.minutes}′<span class="chev">›</span></span>
        <span class="hint">${esc(r.meta)}.${result}</span></button>`;
    }).join('');
    const total = FULL.reduce((n, k) => n + RUNS[k].minutes, 0);
    const lastFull = L.lastExam(state, 'full');
    const history = (state.exams || []).slice(-8).reverse().map((e) => `<tr><td>${dateOf(e.d).toLocaleDateString('el-GR', { day: 'numeric', month: 'numeric', timeZone: 'UTC' })}</td>
      <td>${esc(KIND_NAMES[e.k] || e.k)}</td><td>${e.k === 'triads' ? (e.s === 100 ? 'ολοκληρώθηκε' : 'μηδέν') : `${e.s}/100`}</td></tr>`).join('');
    app.innerHTML = `<main class="screen">
      <header><h1>Προσομοίωση</h1><p class="sub">Συνθήκες εξέτασης: με χρόνο και χωρίς επιστροφή</p></header>
      <button class="card guide-link" data-go="guide"><span><b>Τι ξέρουμε για την εξέταση</b><span class="sub">Μορφή, χρόνοι, τι είναι επίσημο και τι πιθανό</span></span><span class="chev">›</span></button>
      <section class="card"><h2>Πλήρης εξέταση</h2>
        <p class="sub">${FULL.map((k) => `${KIND_NAMES[k]} ${RUNS[k].minutes}′`).join(' → ')}. Συνολικά ${Math.floor(total / 60)} ώρα και ${total % 60} λεπτά, όπως ήταν το 2025 μαζί με τον νέο λεκτικό.${lastFull ? ` Τελευταίος μέσος βαθμός: ${lastFull.s}/100.` : ''}</p>
        <button class="btn primary" data-do="exam-start">Ξεκίνα την πλήρη εξέταση</button></section>
      <section class="card"><h2>Μία δοκιμασία</h2><div class="subjects">${runs}</div></section>
      ${history ? `<section class="card"><h2>Πρόσφατα αποτελέσματα</h2><table>${history}</table></section>` : ''}
    </main>${tabs()}`;
  }

  function renderExamBreak() {
    const done = exam.parts[exam.parts.length - 1];
    const next = RUNS[FULL[exam.idx]];
    app.innerHTML = `<main class="screen">
      <header><h1>Πλήρης εξέταση</h1><p class="sub">Δοκιμασία ${exam.idx + 1} από ${FULL.length}</p></header>
      <section class="card"><h2>Τέλος: ${esc(done.name)}</h2><p class="sub">${done.kind === 'triads' ? '' : `Βαθμός ${done.score}/100.`}</p></section>
      <section class="card"><h2>Επόμενη: ${esc(next.name)}</h2><p class="sub">${esc(next.meta)}, ${next.minutes} λεπτά. Στην εξέταση δεν υπάρχει διάλειμμα, οπότε συνέχισε αμέσως.</p>
        <button class="btn primary" data-do="exam-next">Συνέχεια</button></section>
      <button class="btn danger" data-do="exam-abort">Διακοπή της εξέτασης</button>
    </main>`;
  }

  function renderExamDone() {
    const scored = exam.parts.filter((p) => p.kind !== 'triads');
    const avg = Math.round(scored.reduce((n, p) => n + p.score, 0) / scored.length);
    const rows = exam.parts.map((p) => `<tr><td>${esc(p.name)}</td><td>${p.kind === 'triads'
      ? (p.done === p.count ? 'ολοκληρώθηκε' : `${p.done}/${p.count} · θα ήταν μηδέν`) : `${p.score}/100`}</td></tr>`).join('');
    app.innerHTML = `<main class="screen">
      <header><h1>Πλήρης εξέταση</h1><p class="sub">Ολοκληρώθηκε</p></header>
      <section class="card hero">${ring(avg)}<div><h2>Μέσος βαθμός ${avg}/100</h2>
        <p class="sub">Μέσος όρος γνώσεων, λεκτικού και επαγωγικού. Τα επίσημα βάρη του 3ου διαγωνισμού δεν έχουν ανακοινωθεί.</p></div></section>
      <section class="card"><table>${rows}</table></section>
      <button class="btn primary" data-go="sim">Τέλος</button>
    </main>`;
  }

  /* ---------- Οδηγός εξέτασης ---------- */

  function renderGuide() {
    const row = (a, b, c) => `<tr><td>${a}</td><td>${b}</td><td>${c}</td></tr>`;
    app.innerHTML = `<main class="screen guide">
      <header><button class="linkbtn back" data-go="sim">‹ Προσομοίωση</button><h1>Η εξέταση</h1>
        <p class="sub">Ό,τι είναι γνωστό στις 7 Νοεμβρίου 2026. Δεν έχει βγει ακόμη η προκήρυξη.</p></header>
      <section class="card"><h2>Επίσημα</h2><ul class="facts">
        <li>Ο 3ος πανελλήνιος γραπτός διαγωνισμός αναμένεται το 2027, χωρίς ανακοινωμένη ημερομηνία.</li>
        <li>Οι γνώσεις εξετάζονται από το Μητρώο Θεμάτων: 11 ενότητες, 1.988 ερωτήσεις. Όλες είναι στην εφαρμογή.</li>
        <li>Μπαίνει νέο τεστ λεκτικού συλλογισμού, προσαρμοστικό (CAT), από το ΕΚΠΑ (ανακοίνωση ΑΣΕΠ, 15/7/2026).</li>
        <li>Η εξέταση γίνεται σε υπολογιστή.</li></ul></section>
      <section class="card"><h2>Βαθμολογία</h2><ul class="facts">
        <li>Ο νόμος 4765/2021 ορίζει ότι γνώσεις και δεξιότητες μετράνε από 50%. Η κλίμακα είναι 1–100.</li>
        <li>Το 2025: γνώσεις ×0,50, επαγωγικός ×0,25, τριάδες ×0,25. Αν μπει ο λεκτικός, θα μοιραστεί το 50% των δεξιοτήτων, με ποσοστά που δεν έχουν ανακοινωθεί.</li>
        <li>Στα προσαρμοστικά τεστ (CAT) οι δυσκολότερες ερωτήσεις μετράνε περισσότερο.</li></ul></section>
      <section class="card"><h2>Πώς ήταν το 2025</h2><p class="sub">Η καλύτερη ένδειξη μέχρι να βγει η προκήρυξη.</p>
        <table><tr><th>Δοκιμασία</th><th>Μορφή</th><th>Βάρος</th></tr>
        ${row('Γνώσεις', '25 ερωτήσεις σε 25′', '50%')}${row('Επαγωγικός', '18 ερωτήσεις σε 24′, 5 επιλογές, CAT', '25%')}${row('Εργασιακές συμπεριφορές', '76 τριάδες σε 30′', '25%')}</table>
        <ul class="facts"><li>Δεν μπορείς να αφήσεις ερώτηση και να γυρίσεις πίσω.</li><li>Δεν υπάρχει αρνητική βαθμολογία ούτε βάση.</li>
        <li>Στις τριάδες, αν δεν απαντήσεις και τις 76, ο βαθμός είναι μηδέν.</li><li>Στον επαγωγικό δίνονται 10′ εξάσκησης με 5 παραδείγματα.</li></ul></section>
      <section class="card"><h2>Πιθανά, όχι επιβεβαιωμένα</h2><ul class="facts">
        <li>Λεκτικός: σύντομο κείμενο και 4 δηλώσεις για Σωστό, Λάθος ή Δεν μπορεί να απαντηθεί, μόνο με βάση το κείμενο (από δημοσιεύματα για τη σύμβαση).</li>
        <li>Σενάρια εργασιακής αποτελεσματικότητας μαζί με τον λεκτικό (από δημοσιεύματα για τη σύμβαση).</li>
        <li>Επαγωγικός και τριάδες όπως το 2025. Τα ποσοστά μπορεί να αλλάξουν με τον νέο λεκτικό.</li>
        <li>Αριθμητικός και αναλογίες λέξεων υπήρχαν μόνο το 2022 και δεν έχουν ανακοινωθεί, γι’ αυτό δεν είναι στην εφαρμογή.</li></ul></section>
      <section class="card"><h2>Η ημέρα της εξέτασης</h2><p class="sub">Από τις οδηγίες του ΑΣΕΠ και από εμπειρίες υποψηφίων του 2025.</p><ul class="facts">
        <li>Η εξέταση γίνεται σε υπολογιστή, σε εξεταστικό κέντρο στην Αθήνα ή στη Θεσσαλονίκη.</li>
        <li>Πήγαινε νωρίς με ταυτότητα. Κινητά, ρολόγια και σημειώσεις απαγορεύονται.</li>
        <li>Οι υποψήφιοι αναφέρουν ότι δίνεται πρόχειρο χαρτί. Εξασκήσου στον επαγωγικό με χαρτί και μολύβι.</li>
        <li>Δεν βγαίνεις από την αίθουσα πριν τελειώσουν όλες οι δοκιμασίες.</li></ul></section>
      <section class="card"><h2>Συμβουλές</h2><ul class="facts">
        <li>Γνώσεις: περίπου 1 λεπτό ανά ερώτηση. Διάβασε όλες τις επιλογές πριν πατήσεις.</li>
        <li>Επαγωγικός: περίπου 80″ ανά ερώτηση. Στην εφαρμογή οι ασκήσεις καλύπτουν 8 κατηγορίες (περιστροφή, μετακίνηση, εναλλαγή, αύξηση/μείωση, συνδυασμός, αφαίρεση, καθρέφτισμα, χρώμα) σε 5 επίπεδα· και η εξάσκηση και η προσομοίωση ξεκινούν από το 3 και ανεβαίνουν ή κατεβαίνουν με κάθε απάντηση. Ψάξε πρώτα κίνηση, πλήθος, χρώμα και περιστροφή. Αν κολλήσεις πάνω από ένα λεπτό, απόκλεισε ό,τι δεν ταιριάζει, διάλεξε και προχώρα.</li>
        <li>Λεκτικός: «Λάθος» σημαίνει ότι το κείμενο λέει το αντίθετο. «Δεν μπορεί» σημαίνει ότι το κείμενο δεν το λέει, ακόμη κι αν είναι αληθινό στην πραγματικότητα.</li>
        <li>Τριάδες: περίπου 23″ ανά τριάδα. Απάντα με βάση το πώς δουλεύεις συνήθως και τελείωσε και τις 76.</li></ul></section>
      <section class="card"><h2>Πηγές</h2><ul class="facts links">
        <li><a href="https://info.asep.gr/mitroo-thematon-gnoseon" target="_blank" rel="noopener">ΑΣΕΠ: Μητρώο Θεμάτων Γνώσεων</a></li>
        <li><a href="https://info.asep.gr/node/79348" target="_blank" rel="noopener">ΑΣΕΠ: συμφωνία με το ΕΚΠΑ για τον λεκτικό συλλογισμό</a></li>
        <li><a href="https://info.asep.gr/node/76412" target="_blank" rel="noopener">ΑΣΕΠ: διάρκεια και βαθμολογία 1Γ/2025</a></li>
        <li><a href="https://info.asep.gr/node/76297" target="_blank" rel="noopener">ΑΣΕΠ: δοκιμασία δεξιοτήτων 1Γ/2025</a></li></ul></section>
    </main>${tabs()}`;
  }

  /* ---------- Λεκτικός: εξάσκηση ---------- */

  function startReading() {
    const done = state.skills.reading || {};
    const due = new Set(L.retryDue(state, 'reading', today()));
    const queue = [...L.shuffled(skillData.reading.filter((t) => due.has(t.n))),
      ...L.shuffled(skillData.reading.filter((t) => !(t.n in done) && !due.has(t.n)))];
    if (!queue.length) {
      if (!confirm('Έχεις κάνει όλα τα κείμενα. Ξεκινάς νέο γύρο; Το σκορ του λεκτικού θα μηδενιστεί.')) return;
      L.resetSkill(state, 'reading');
      save();
      startReading();
      return;
    }
    reader = { queue, due, pos: 0, picks: [null, null, null, null], checked: false, anim: true };
    view = 'reading';
    render();
    window.scrollTo(0, 0);
  }

  function statementList(text, picks, checked, attr) {
    return text.st.map((st, i) => {
      const chosen = picks[i];
      const buttons = SHORT.map((label, v) => {
        let look = chosen === v ? 'on' : '';
        if (checked) look = v === st.a ? 'right' : chosen === v ? 'wrong' : 'dim';
        return `<button class="${look}" data-${attr}="${i}:${v}" ${checked ? 'disabled' : ''} aria-label="${VERDICTS[v]}">${label}</button>`;
      }).join('');
      const why = checked ? `<p class="why ${picks[i] === st.a ? 'good' : 'bad'}"><b>${VERDICTS[st.a]}.</b> ${esc(st.e)}</p>` : '';
      return `<div class="statement"><p>${i + 1}. ${esc(st.s)}</p><div class="tri">${buttons}</div>${why}</div>`;
    }).join('');
  }

  function renderReading() {
    const text = reader.queue[reader.pos];
    const rp = readingProgress();
    const animate = reader.anim;
    reader.anim = false;
    const ready = reader.picks.every((x) => x !== null);
    const right = reader.picks.filter((v, i) => v === text.st[i].a).length;
    app.innerHTML = `<div class="study">
      <div class="study-top">
        <button class="close" data-do="reading-exit" aria-label="Έξοδος">${ICONS.close}</button>
        <div class="bar"><i style="width:${rp.answered / rp.total * 100}%"></i></div>
        <span class="count">${num(rp.answered)} / ${num(rp.total)}</span>
      </div>
      <div class="study-body ${animate ? 'enter' : ''}">
        <div class="tag"><b>Λεκτικός συλλογισμός</b><span>${reader.due.has(text.n) ? 'Επανάληψη λάθους · ' : ''}Επίπεδο ${text.lvl} από 3</span></div>
        <p class="passage">${esc(text.text)}</p>
        <p class="sub">Σ = Σωστό · Λ = Λάθος · Δ = Δεν μπορεί να απαντηθεί</p>
        ${statementList(text, reader.picks, reader.checked, 'rpick')}
      </div>
      <div class="feedback">
        ${reader.checked ? `<p class="verdict ${right === 4 ? 'good' : 'bad'}">${right} / 4 σωστές</p>` : ''}
        <div class="fb-actions"><button class="btn primary solo" data-do="${reader.checked ? 'reading-next' : 'reading-check'}" ${ready ? '' : 'disabled'}>${reader.checked ? 'Επόμενο κείμενο' : 'Έλεγχος'}</button></div>
      </div>
    </div>`;
  }

  /* ---------- Προσομοιώσεις με χρόνο ---------- */

  const mmss = (sec) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec % 60)).padStart(2, '0')}`;
  const secondsLeft = () => Math.max(0, Math.round((run.endAt - Date.now()) / 1000));

  function tick() {
    if (!run || run.finished) return;
    const left = secondsLeft();
    const el = document.querySelector('.timer');
    if (el) {
      el.textContent = mmss(left);
      el.classList.toggle('low', left <= 120);
    }
    if (left <= 0) finishRun(true);
  }

  function startRun(kind) {
    if (!skillData && kind !== 'knowledge') return;
    const r = RUNS[kind];
    run = { kind, ...r, endAt: Date.now() + r.minutes * 60e3, startedAt: Date.now(), pos: 0, results: [], level: kind === 'inductive' ? 3 : 2, maxLevel: kind === 'inductive' ? 5 : 3, used: new Set(), choice: null, finished: false, anim: true };
    if (kind === 'knowledge') {
      run.items = L.knowledgeExam(questions, r.count);
      run.options = L.arrangeOptions(run.items[0]);
    }
    if (kind === 'triads') {
      run.items = skillData.triads.map((t) => L.shuffled(t));
      run.first = null;
    }
    if (kind === 'inductive' || kind === 'reading') nextAdaptive();
    if (kind === 'reading') run.picks = [null, null, null, null];
    clearInterval(clock);
    clock = setInterval(tick, 1000);
    view = 'run';
    render();
    window.scrollTo(0, 0);
  }

  function nextAdaptive() {
    const pool = run.kind === 'inductive' ? skillPart('inductive').items : skillData.reading;
    run.current = L.pickAdaptive(pool, run.level, run.used);
    if (run.current) run.used.add(run.current.n);
  }

  function advance(record) {
    run.results.push(record);
    run.pos++;
    run.choice = null;
    run.anim = true;
    if (run.pos >= run.count) return finishRun(false);
    if (run.kind === 'knowledge') run.options = L.arrangeOptions(run.items[run.pos]);
    if (run.kind === 'inductive') L.markRetry(state, 'inductive', record.q.n, record.ok, today());
    if (run.kind === 'reading') L.markRetry(state, 'reading', record.q.n, record.right === 4, today());
    if (run.kind === 'inductive' || run.kind === 'reading') {
      run.level = L.nextLevel(run.level, record.ok, run.maxLevel);
      nextAdaptive();
      if (!run.current) return finishRun(false);
    }
    if (run.kind === 'reading') run.picks = [null, null, null, null];
    if (run.kind === 'triads') run.first = null;
    render();
    window.scrollTo(0, 0);
  }

  function confirmRun() {
    if (run.kind === 'knowledge') {
      if (run.choice === null) return;
      const opt = run.options[run.choice];
      advance({ q: run.items[run.pos], ok: opt.correct, picked: opt.t });
    } else if (run.kind === 'inductive') {
      if (run.choice === null) return;
      advance({ q: run.current, lvl: run.current.lvl, ok: run.choice === run.current.a, picked: run.choice });
    } else if (run.kind === 'reading') {
      if (run.picks.some((x) => x === null)) return;
      const t = run.current;
      const right = run.picks.filter((v, i) => v === t.st[i].a).length;
      advance({ q: t, lvl: t.lvl, ok: right >= 3, right, picks: run.picks.slice() });
    }
  }

  function finishRun(timeUp) {
    if (!run || run.finished) return;
    clearInterval(clock);
    run.finished = true;
    run.timeUp = timeUp;
    run.usedSec = Math.round((Math.min(Date.now(), run.endAt) - run.startedAt) / 1000);
    const res = run.results;
    if (run.kind === 'knowledge') run.score = Math.round(res.filter((r) => r.ok).length / run.count * 100);
    if (run.kind === 'inductive') run.score = L.adaptiveScore(res.concat(Array(run.count - res.length).fill({ lvl: 1, ok: false })), 5);
    if (run.kind === 'reading') {
      run.right = res.reduce((n, r) => n + r.right, 0);
      run.score = Math.round(run.right / (run.count * 4) * 100);
    }
    if (run.kind === 'triads') run.score = res.length === run.count ? 100 : 0;
    L.recordExam(state, run.kind, run.score, today());
    if (exam) {
      exam.parts.push({ kind: run.kind, name: run.name, score: run.score, done: res.length, count: run.count });
      exam.idx++;
      if (exam.idx >= FULL.length) {
        const scored = exam.parts.filter((p) => p.kind !== 'triads');
        L.recordExam(state, 'full', Math.round(scored.reduce((n, p) => n + p.score, 0) / scored.length), today());
      }
      save();
      view = exam.idx >= FULL.length ? 'examDone' : 'examBreak';
      render();
      window.scrollTo(0, 0);
      return;
    }
    save();
    view = 'runDone';
    render();
    window.scrollTo(0, 0);
  }

  function runTop() {
    return `<div class="study-top">
        <button class="close" data-do="run-exit" aria-label="Διακοπή">${ICONS.close}</button>
        <div class="bar"><i style="width:${run.pos / run.count * 100}%"></i></div>
        <span class="count"><span class="timer">${mmss(secondsLeft())}</span> · ${num(Math.min(run.pos + 1, run.count))}/${num(run.count)}</span>
      </div>`;
  }

  function renderRun() {
    let body = '';
    let action = `<button class="btn primary solo" data-do="run-next" ${run.choice === null ? 'disabled' : ''}>Επόμενη</button>`;
    if (run.kind === 'knowledge') {
      const q = run.items[run.pos];
      const options = run.options.map((opt, i) => `<button class="option ${run.choice === i ? 'chosen' : ''}" data-run-pick="${i}">
        <span class="letter">${LETTERS[i]}.</span><span>${esc(opt.t)}</span><span class="sign"></span></button>`).join('');
      body = `<div class="tag"><b>Γνώσεις</b><span>${esc(subjects[q.s])}</span></div><p class="stem">${esc(q.q)}</p>
        ${q.t ? tableHtml(q.t) : ''}${q.q2 ? `<p class="stem">${esc(q.q2)}</p>` : ''}<div class="options">${options}</div>`;
    } else if (run.kind === 'inductive') {
      const q = run.current;
      const options = q.o.map((t, i) => `<button class="option ${run.choice === i ? 'chosen' : ''}" data-run-pick="${i}"><span class="letter">${t}</span></button>`).join('');
      body = `<div class="tag"><b>Επαγωγικός συλλογισμός</b><span>Βρες αυτό που λείπει</span></div>
        <img class="puzzle" src="${esc(q.img)}" alt="Επαγωγικός συλλογισμός"><div class="options letters">${options}</div>`;
    } else if (run.kind === 'reading') {
      const t = run.current;
      body = `<div class="tag"><b>Λεκτικός συλλογισμός</b><span>Μόνο με βάση το κείμενο</span></div>
        <p class="passage">${esc(t.text)}</p><p class="sub">Σ = Σωστό · Λ = Λάθος · Δ = Δεν μπορεί να απαντηθεί</p>
        ${statementList(t, run.picks, false, 'run-rpick')}`;
      action = `<button class="btn primary solo" data-do="run-next" ${run.picks.every((x) => x !== null) ? '' : 'disabled'}>Επόμενο κείμενο</button>`;
    } else {
      const triad = run.items[run.pos];
      const step = run.first === null ? 'Ποια δήλωση σε αντιπροσωπεύει <b>περισσότερο</b>;' : 'Από τις δύο που έμειναν, ποια σε αντιπροσωπεύει <b>περισσότερο</b>;';
      const options = triad.map((text, i) => {
        const gone = run.first === i;
        return `<button class="option ${gone ? 'chosen' : ''}" data-triad="${i}" ${gone ? 'disabled' : ''}>
          <span class="letter">${gone ? '1η' : ''}</span><span>${esc(text)}</span><span class="sign"></span></button>`;
      }).join('');
      body = `<div class="tag"><b>Εργασιακές συμπεριφορές</b><span>${Math.round(run.pos / run.count * 100)}% ολοκληρώθηκε</span></div>
        <p class="stem long">${step}</p><div class="options">${options}</div>`;
      action = '';
    }
    const enter = run.anim ? 'enter' : '';
    run.anim = false;
    app.innerHTML = `<div class="study">${runTop()}<div class="study-body ${enter}">${body}</div>
      ${action ? `<div class="feedback"><div class="fb-actions">${action}</div></div>` : ''}</div>`;
  }

  function renderRunDone() {
    const r = run;
    const used = `Χρόνος: ${mmss(r.usedSec)} από ${r.minutes}:00${r.timeUp ? ', τελείωσε ο χρόνος' : ''}.`;
    let summary = '';
    let review = '';
    if (r.kind === 'knowledge') {
      const right = r.results.filter((x) => x.ok).length;
      summary = `<h2>${num(right)} / ${num(r.count)} σωστές</h2><p class="sub">Βαθμός ${r.score}/100. ${used}</p>`;
      const wrong = r.results.filter((x) => !x.ok);
      review = wrong.length ? `<section class="card"><h2>Οι λάθος απαντήσεις</h2>${wrong.map((x) => `<div class="review"><p>${esc(x.q.q)}</p>
        <p class="bad">Απάντησες: ${esc(x.picked)}</p><p class="good">Σωστό: ${esc(x.q.o[x.q.a])}</p></div>`).join('')}
        <button class="btn" data-do="run-to-box">Βάλε τις λάθος στο κουτί 1</button></section>` : '';
    } else if (r.kind === 'inductive') {
      const right = r.results.filter((x) => x.ok).length;
      summary = `<h2>${num(right)} / ${num(r.results.length)} σωστές</h2><p class="sub">Βαθμός με βάση τη δυσκολία: ${r.score}/100. ${used}</p>`;
      const wrong = r.results.filter((x) => !x.ok);
      review = wrong.length ? `<section class="card"><h2>Οι λάθος απαντήσεις</h2>${wrong.map((x) => `<div class="review"><img class="puzzle" src="${esc(x.q.img)}" alt="">
        <p class="bad">Απάντησες: ${x.q.o[x.picked]}</p><p class="good">Σωστό: ${x.q.o[x.q.a]}. ${esc(x.q.e)}</p></div>`).join('')}</section>` : '';
    } else if (r.kind === 'reading') {
      summary = `<h2>${num(r.right)} / ${num(r.count * 4)} σωστές δηλώσεις</h2><p class="sub">${used}</p>`;
      review = r.results.map((x) => `<section class="card"><p class="passage small">${esc(x.q.text)}</p>${statementList(x.q, x.picks, true, 'none')}</section>`).join('');
    } else {
      const done = r.results.length;
      summary = done === r.count
        ? `<h2>Ολοκληρώθηκε</h2><p class="sub">${used} Περίπου ${Math.round(r.usedSec / done)}″ ανά τριάδα.</p>`
        : `<h2>${num(done)} / ${num(r.count)} τριάδες</h2><p class="sub">${used} Στην εξέταση, αν δεν ολοκληρώσεις και τις 76, ο βαθμός είναι μηδέν.</p>`;
      review = '<section class="card"><p class="sub">Εδώ δεν υπάρχουν σωστές απαντήσεις. Η εξάσκηση είναι μόνο για τη μορφή και τον ρυθμό.</p></section>';
    }
    app.innerHTML = `<main class="screen">
      <header><h1>${esc(r.name)}</h1><p class="sub">Προσομοίωση με χρόνο</p></header>
      <section class="card hero">${ring(r.score)}<div>${summary}</div></section>
      ${review}
      <button class="btn" data-run="${r.kind}">Ξανά</button>
      <button class="btn primary" data-go="sim">Τέλος</button>
    </main>`;
  }

  function startSkill(id) {
    const part = skillPart(id);
    const due = new Set(L.retryDue(state, id, today()));
    const retries = L.shuffled(part.items.filter((q) => due.has(q.n)));
    if (id === 'inductive') {
      // Εξάσκηση με CAT χωρίς όριο: πρώτα οι επαναλήψεις λαθών, μετά η δυσκολία ακολουθεί τις απαντήσεις.
      skill = { part, due, queue: retries, pos: 0, options: null, picked: null, cat: { level: 3, used: new Set(retries.map((q) => q.n)), done: 0, right: 0 } };
      nextSkill();
      return;
    }
    const queue = [...retries, ...L.skillQueue(state, part).filter((q) => !due.has(q.n))];
    skill = { part, due, queue, pos: 0, options: null, picked: null };
    if (!queue.length) {
      view = 'skillDone';
      render();
      return;
    }
    nextSkill();
  }

  function nextSkill() {
    if (skill.cat && skill.pos >= skill.queue.length) {
      const { cat } = skill;
      let pick = L.pickAdaptive(skill.part.items, cat.level, cat.used);
      if (!pick) {
        cat.used.clear();
        pick = L.pickAdaptive(skill.part.items, cat.level, cat.used);
      }
      cat.used.add(pick.n);
      skill.queue.push(pick);
    }
    const q = skill.queue[skill.pos];
    if (!q) {
      view = 'skillDone';
      render();
      window.scrollTo(0, 0);
      return;
    }
    skill.options = skill.part.fixed ? q.o.map((t, i) => ({ t, correct: i === q.a })) : L.arrangeOptions(q);
    skill.picked = null;
    view = 'skill';
    render();
    window.scrollTo(0, 0);
  }

  function pickSkill(index) {
    if (skill.picked !== null) return;
    const q = skill.queue[skill.pos];
    skill.picked = index;
    L.recordSkill(state, skill.part.id, q.n, skill.options[index].correct);
    L.markRetry(state, skill.part.id, q.n, skill.options[index].correct, today());
    if (skill.cat) {
      const ok = skill.options[index].correct;
      skill.cat.done++;
      if (ok) skill.cat.right++;
      // Οι επαναλήψεις λαθών δεν αλλάζουν το επίπεδο· μόνο οι ερωτήσεις του CAT.
      if (!skill.due.has(q.n)) skill.cat.level = L.nextLevel(skill.cat.level, ok, 5);
    }
    save();
    render();
    document.querySelector('.explain').scrollIntoView({ block: 'nearest' });
  }

  function renderSkill() {
    const { part, options, picked } = skill;
    const q = skill.queue[skill.pos];
    const answered = picked !== null;
    const stats = L.skillProgress(state, part);
    const buttons = options.map((opt, i) => {
      const look = !answered ? '' : opt.correct ? 'right' : i === picked ? 'wrong' : 'dim';
      const sign = !answered ? '' : opt.correct ? ICONS.check : i === picked ? ICONS.cross : '';
      const label = part.fixed ? `<span class="letter">${esc(opt.t)}</span>` : `<span class="letter">${LETTERS[i]}.</span><span>${esc(opt.t)}</span><span class="sign">${sign}</span>`;
      return `<button class="option ${look}" data-skill-pick="${i}" ${answered ? 'disabled' : ''}>${label}</button>`;
    }).join('');
    const right = answered && options[picked].correct;
    const levelNote = skill.cat && answered && !skill.due.has(q.n) ? ` · επόμενο επίπεδο ${skill.cat.level}` : '';
    const rightIndex = options.findIndex((opt) => opt.correct);
    const rightLabel = part.fixed ? options[rightIndex].t : LETTERS[rightIndex];
    app.innerHTML = `<div class="study">
      <div class="study-top">
        <button class="close" data-do="skill-exit" aria-label="Έξοδος">${ICONS.close}</button>
        <div class="bar"><i style="width:${skill.cat ? skill.cat.level / 5 * 100 : stats.answered / stats.total * 100}%"></i></div>
        <span class="count">${skill.cat ? `Επίπεδο ${skill.cat.level} · ${num(skill.cat.right)}/${num(skill.cat.done)}` : `${num(stats.answered)} / ${num(stats.total)}`}</span>
      </div>
      <div class="study-body ${answered ? '' : 'enter'}">
        <div class="tag"><b>${esc(part.name)}</b><span>${skill.due.has(q.n) ? 'Επανάληψη λάθους · ' : ''}${q.lvl ? `Επίπεδο ${q.lvl} από 5 · ` : ''}${esc(q.tag || `Ερώτηση ${q.n}`)}</span></div>
        ${q.img ? `<img class="puzzle" src="${esc(q.img)}" alt="${esc(part.name)}, ερώτηση ${q.n}">` : ''}
        ${q.q ? `<p class="stem long">${esc(q.q)}</p>` : ''}
        <div class="options ${part.fixed ? 'letters' : ''}">${buttons}</div>
        ${answered ? `<div class="explain"><b>${part.id === 'inductive' ? 'Μοτίβο' : 'Εξήγηση (όχι επίσημη)'}</b><p>${esc(q.e)}</p></div>` : ''}
      </div>
      ${answered ? `<div class="feedback" aria-live="polite">
        <p class="verdict ${right ? 'good' : 'bad'}">${right ? `Σωστά <small>${levelNote}</small>` : `Λάθος <small>· Σωστή η ${esc(rightLabel)}${levelNote}</small>`}</p>
        <div class="fb-actions"><button class="btn primary solo" data-do="skill-next">Επόμενη</button></div>
      </div>` : ''}
    </div>`;
  }

  function renderSkillDone() {
    const { part } = skill;
    const { correct, total } = L.skillProgress(state, part);
    app.innerHTML = `<main class="screen">
      <header><h1>${esc(part.name)}</h1><p class="sub">Ολοκλήρωσες όλες τις ερωτήσεις αυτού του γύρου.</p></header>
      <section class="card hero">${ring(Math.round(correct / total * 100))}<div><h2>${num(correct)} / ${num(total)} σωστές</h2>
        <p class="sub">Ένας νέος γύρος μηδενίζει το σκορ αυτής της δοκιμασίας.</p></div></section>
      <button class="btn" data-do="skill-restart">Νέος γύρος</button>
      <button class="btn primary" data-go="skills">Τέλος</button>
    </main>`;
  }

  /* ---------- Πρόοδος ---------- */

  function barChart(id, values, labels, describe, fixedMax) {
    const max = fixedMax || Math.max(1, ...values);
    const chosen = chartPick[id];
    const bars = values.map((v, i) => `
      <button data-chart="${id}" data-index="${i}" aria-pressed="${chosen === i}" aria-label="${esc(describe(i))}">
        <i style="height:${v ? Math.max(3, v / max * 100) : 0}%"></i></button>`).join('');
    const axis = labels.map((l) => `<span>${esc(l)}</span>`).join('');
    const caption = chosen === undefined ? 'Πάτα μια μπάρα για να δεις τον αριθμό' : describe(chosen);
    return `<div class="chart">${bars}</div><div class="axis">${axis}</div><p class="caption">${esc(caption)}</p>`;
  }

  function simCharts() {
    const shortDay = (d) => dateOf(d).toLocaleDateString('el-GR', { day: 'numeric', month: 'numeric', timeZone: 'UTC' });
    const charts = ['full', 'knowledge', 'reading', 'inductive'].map((kind) => {
      const list = (state.exams || []).filter((e) => e.k === kind).slice(-10);
      if (!list.length) return '';
      // Πάντα 10 θέσεις, ώστε λίγες προσομοιώσεις να μη γεμίζουν όλο το πλάτος.
      const pad = 10 - list.length;
      const values = [...Array(pad).fill(0), ...list.map((e) => e.s)];
      return `<h3 class="chart-title">${esc(KIND_NAMES[kind])}</h3>${barChart(`sim-${kind}`, values, values.map(() => ''),
        (i) => (i < pad ? 'Δεν έχει γίνει ακόμη προσομοίωση' : `${shortDay(list[i - pad].d)}: ${values[i]}/100`), 100)}`;
    }).join('');
    return charts ? `<section class="card"><h2>Προσομοιώσεις: οι τελευταίοι βαθμοί</h2>${charts}</section>` : '';
  }

  function renderProgress() {
    const t = today();
    const seen = questions.filter((q) => state.cards[q.i]).length;
    const day = L.peekDay(state, t);
    const answered = day.n + day.r;
    const weekday = (d) => dateOf(d).toLocaleDateString('el-GR', { weekday: 'short', timeZone: 'UTC' });
    const longDay = (d) => dateOf(d).toLocaleDateString('el-GR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

    const ahead = L.forecast(state, questions, t);
    const aheadLabels = ahead.map((_, i) => (i === 0 ? 'Σήμ' : weekday(t + i)));
    const past = Array.from({ length: 14 }, (_, i) => t - 13 + i);
    const pastValues = past.map((d) => { const x = L.peekDay(state, d); return x.n + x.r; });
    const pastLabels = past.map((d, i) => (i % 2 === 1 ? String(dateOf(d).getUTCDate()) : ''));

    const rows = L.subjectStats(state, questions).sort((a, b) => a.readiness - b.readiness).map((row) => `
      <div class="subject">
        <span class="name">${esc(subjects[row.s])}</span>
        <span class="meta">${row.readiness}%${row.accuracy === null ? '' : ` · ακρίβεια ${row.accuracy}%`}</span>
        <span class="bar"><i style="width:${row.readiness}%"></i></span>
      </div>`).join('');

    app.innerHTML = `<main class="screen">
      <header><h1>Πρόοδος</h1></header>
      <section class="card hero">${ring(L.readiness(state, questions))}<div><h2>Ετοιμότητα</h2>
        <p class="sub">Έχεις δει ${num(seen)} από ${num(questions.length)} ερωτήσεις.</p></div></section>
      <section class="tiles">
        <div class="tile"><div class="val">${num(L.streak(state, t))}</div><div class="lbl">σερί ημερών</div></div>
        <div class="tile"><div class="val">${num(answered)}</div><div class="lbl">απαντήσεις σήμερα</div></div>
        <div class="tile"><div class="val">${answered ? `${Math.round(day.ok / answered * 100)}%` : '–'}</div><div class="lbl">σωστά σήμερα</div></div>
      </section>
      ${boxOverview()}
      <section class="card"><h2>Επαναλήψεις των επόμενων 7 ημερών</h2>
        ${barChart('ahead', ahead, aheadLabels, (i) => `${longDay(t + i)}: ${plural(ahead[i], 'επανάληψη', 'επαναλήψεις')}`)}</section>
      <section class="card"><h2>Απαντήσεις των τελευταίων 14 ημερών</h2>
        ${barChart('past', pastValues, pastLabels, (i) => `${longDay(past[i])}: ${plural(pastValues[i], 'απάντηση', 'απαντήσεις')}`)}</section>
      <section class="card"><h2>Ετοιμότητα ανά αντικείμενο, από το πιο αδύναμο</h2><div class="subjects">${rows}</div></section>
      ${simCharts()}
    </main>${tabs()}`;
  }

  /* ---------- Ρυθμίσεις ---------- */

  function renderSettings() {
    const { newPerDay, examDate } = state.settings;
    const limit = L.newLimit(state, questions, today());
    const raised = limit > newPerDay
      ? `<p class="sub">Λόγω της εξέτασης, το όριο ανέβηκε αυτόματα σε ${num(limit)} τη μέρα για να προλάβεις όλη την ύλη.</p>`
      : '';
    const install = isStandalone() ? '' : `<section class="card"><h2>Εγκατάσταση στο κινητό</h2>
      <p class="sub">Σε iPhone:</p>
      <ol class="steps"><li>Άνοιξε τη σελίδα στο Safari.</li><li>Πάτα το κουμπί Κοινή χρήση.</li>
      <li>Επίλεξε «Προσθήκη στην οθόνη αφετηρίας».</li><li>Άνοιγε πάντα την εφαρμογή από το νέο εικονίδιο.</li></ol>
      <p class="sub">Σε Android:</p>
      <ol class="steps"><li>Άνοιξε τη σελίδα στο Chrome.</li><li>Πάτα το μενού με τις τρεις τελείες.</li>
      <li>Επίλεξε «Εγκατάσταση εφαρμογής» ή «Προσθήκη στην αρχική οθόνη».</li><li>Άνοιγε πάντα την εφαρμογή από το νέο εικονίδιο.</li></ol></section>`;
    const backup = state.lastBackup === null ? 'Δεν έχει γίνει ακόμα.' : `Τελευταίο: ${dateOf(state.lastBackup).toLocaleDateString('el-GR', { timeZone: 'UTC' })}.`;
    app.innerHTML = `<main class="screen">
      <header><h1>Ρυθμίσεις</h1></header>
      <section class="card"><h2>Εμφάνιση</h2>
        <div class="segmented" role="group" aria-label="Εμφάνιση">${THEMES.map(([id, label]) =>
          `<button data-theme-choice="${id}" aria-pressed="${state.settings.theme === id}">${label}</button>`).join('')}</div>
        <p class="sub">Το Αυτόματο ακολουθεί την εμφάνιση του iPhone.</p></section>
      <section class="card"><h2>Ρυθμός</h2>
        <div class="row"><span>Νέες ερωτήσεις τη μέρα</span>
          <div class="stepper"><button data-step="-10" aria-label="Μείωση">−</button><output>${num(newPerDay)}</output><button data-step="10" aria-label="Αύξηση">+</button></div></div>
        ${raised}</section>
      <section class="card"><h2>Λειτουργία εξέτασης</h2>
        <p class="sub">Όταν ανακοινωθεί η ημερομηνία, βάλε την εδώ. Οι επαναλήψεις γίνονται το πολύ κάθε 7 ημέρες, και κάθε 3 ημέρες στις τελευταίες ${L.FINAL_STRETCH_DAYS}.</p>
        <div class="row"><label for="exam">Ημερομηνία</label><input id="exam" type="date" value="${esc(examDate || '')}"></div>
        ${examDate ? '<button class="linkbtn" data-do="clear-exam">Κατάργηση ημερομηνίας</button>' : ''}</section>
      ${install}
      <section class="card"><h2>Αντίγραφο ασφαλείας</h2><p class="sub">${backup}</p>
        <button class="btn" data-do="export">Δημιουργία αντιγράφου</button>
        <button class="btn" data-do="import">Επαναφορά από αρχείο</button>
        <input id="restore" type="file" accept=".json,application/json" hidden></section>
      <section class="card"><h2>Πώς δουλεύει</h2>
        <p class="sub">Σωστή απάντηση: η κάρτα ανεβαίνει κουτί. Λάθος: επιστρέφει στο κουτί 1.
        Τα κουτιά 1 έως 5 επαναλαμβάνονται κάθε ${L.INTERVALS.slice(0, 5).join(', ')} ημέρες και οι κατακτημένες κάθε ${L.INTERVALS[5]}.</p></section>
      <section class="card"><h2>Σχετικά</h2>
        <p class="sub">Πηγή των ερωτήσεων γνώσεων: «Μητρώο Θεμάτων Γνώσεων του ΑΣΕΠ». Τελευταία ενημέρωση κάθε ενότητας:</p>
        <table>${REGISTRY.map(([id, d]) => `<tr><td>${esc(subjects[id] || id)}</td><td>${d}</td></tr>`).join('')}</table>
        <p class="sub">Η εφαρμογή είναι ανεξάρτητη. Δεν είναι εφαρμογή του ΑΣΕΠ ούτε υποστηρίζεται από αυτό. Οι ερωτήσεις και οι απαντήσεις του Μητρώου δεν αλλάζουν· μόνο η σειρά των επιλογών ανακατεύεται για τη μελέτη.</p>
        <p class="sub">Οι εξηγήσεις, τα κείμενα λεκτικού, οι τριάδες, οι ασκήσεις επαγωγικού (εκτός από 2 επίσημα παραδείγματα) και οι προσομοιώσεις είναι δικό μας περιεχόμενο. Δεν προέρχονται από το ΑΣΕΠ ούτε έχουν εγκριθεί από αυτό.</p></section>
      <button class="btn danger" data-do="reset">Διαγραφή όλης της προόδου</button>
    </main>${tabs()}`;
  }

  async function exportBackup() {
    const payload = JSON.stringify({ app: 'leitner', exportedAt: new Date().toISOString(), state });
    const stamp = new Date().toISOString().slice(0, 10);
    const file = new File([payload], `leitner-backup-${stamp}.json`, { type: 'application/json' });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Αντίγραφο Leitner' });
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file);
        link.download = file.name;
        link.click();
        URL.revokeObjectURL(link.href);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      toast('Το αντίγραφο δεν δημιουργήθηκε.');
      return;
    }
    state.lastBackup = today();
    save();
    render();
    toast('Το αντίγραφο δημιουργήθηκε.');
  }

  async function importBackup(file) {
    try {
      const restored = L.validateBackup(JSON.parse(await file.text()));
      const count = Object.keys(restored.cards).length;
      if (!confirm(`Θα αντικατασταθεί η τωρινή πρόοδος με ${plural(count, 'κάρτα', 'κάρτες')} από το αρχείο. Συνέχεια;`)) return;
      state = restored;
      save();
      applyTheme();
      view = 'home';
      render();
      toast('Η πρόοδος επανήλθε.');
    } catch (err) {
      toast(err instanceof SyntaxError ? 'Το αρχείο δεν διαβάζεται.' : err.message);
    }
  }

  /* ---------- Ενέργειες ---------- */

  const actions = {
    start() { startSession({}); },
    extra() { startSession({ extraNew: EXTRA_BATCH }); },
    next() { nextCard(); },
    undo,
    exit() { study = null; view = 'home'; render(); },
    'skill-next'() { skill.pos++; nextSkill(); },
    'skill-exit'() { skill = null; view = 'skills'; render(); },
    'skill-restart'() { L.resetSkill(state, skill.part.id); save(); startSkill(skill.part.id); },
    'reading-start': startReading,
    'reading-exit'() { reader = null; view = 'skills'; render(); },
    'reading-check'() {
      const text = reader.queue[reader.pos];
      const right = reader.picks.filter((v, i) => v === text.st[i].a).length;
      state.skills.reading = { ...(state.skills.reading || {}), [text.n]: right };
      L.markRetry(state, 'reading', text.n, right === 4, today());
      reader.checked = true;
      save();
      render();
    },
    'reading-next'() {
      reader.pos++;
      if (reader.pos >= reader.queue.length) {
        reader = null;
        view = 'skills';
        render();
        toast('Τελείωσες όλα τα κείμενα αυτού του γύρου.');
        return;
      }
      reader.picks = [null, null, null, null];
      reader.checked = false;
      reader.anim = true;
      render();
      window.scrollTo(0, 0);
    },
    'run-next': confirmRun,
    'exam-start'() {
      if (!confirm('Η πλήρης εξέταση διαρκεί περίπου 2 ώρες. Ξεκινάς τώρα;')) return;
      exam = { idx: 0, parts: [] };
      startRun(FULL[0]);
    },
    'exam-next'() { startRun(FULL[exam.idx]); },
    'exam-abort'() {
      if (!confirm('Η εξέταση θα σταματήσει. Οι δοκιμασίες που τελείωσες μένουν στο ιστορικό. Συνέχεια;')) return;
      exam = null;
      view = 'sim';
      render();
    },
    'run-exit'() {
      if (!confirm('Η προσομοίωση θα σταματήσει και δεν θα αποθηκευτεί. Συνέχεια;')) return;
      clearInterval(clock);
      run = null;
      exam = null;
      view = 'sim';
      render();
    },
    'run-to-box'() {
      const t = today();
      for (const x of run.results.filter((r) => !r.ok)) {
        const c = state.cards[x.q.i] || { b: 1, d: t, c: 0, w: 0 };
        state.cards[x.q.i] = { ...c, b: 1, d: t };
      }
      save();
      toast('Οι λάθος ερωτήσεις μπήκαν στο κουτί 1 για σήμερα.');
    },
    export: exportBackup,
    import() { document.getElementById('restore').click(); },
    'clear-exam'() { state.settings.examDate = null; save(); render(); },
    reset() {
      if (!confirm('Θα διαγραφεί όλη η πρόοδος σε αυτό το iPhone. Η ενέργεια δεν αναιρείται. Συνέχεια;')) return;
      state = L.newState();
      save();
      applyTheme();
      view = 'home';
      render();
    },
  };

  app.addEventListener('click', (event) => {
    const el = event.target.closest('button');
    if (!el) return;
    const { go, do: action, pick: picked, subject, step, chart, index, themeChoice, skill: skillId, skillPick, run: runKind, runPick, rpick, runRpick, triad } = el.dataset;
    if (themeChoice) {
      state.settings.theme = themeChoice;
      save();
      applyTheme();
      render();
    } else if (go) { view = go; study = null; skill = null; run = null; reader = null; exam = null; clearInterval(clock); render(); window.scrollTo(0, 0); }
    else if (action) actions[action]();
    else if (picked !== undefined) pick(Number(picked));
    else if (skillId) startSkill(skillId);
    else if (runKind) { exam = null; startRun(runKind); }
    else if (runPick !== undefined) { run.choice = Number(runPick); render(); }
    else if (rpick !== undefined) {
      const [i, v] = rpick.split(':').map(Number);
      reader.picks[i] = v;
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
    } else if (runRpick !== undefined) {
      const [i, v] = runRpick.split(':').map(Number);
      run.picks[i] = v;
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
    } else if (triad !== undefined) {
      const i = Number(triad);
      if (run.first === null) { run.first = i; render(); } else advance({ ok: true, order: [run.first, i] });
    }
    else if (skillPick !== undefined) pickSkill(Number(skillPick));
    else if (subject) {
      const s = Number(subject);
      if (!startSession({ subject: s }) && !startSession({ subject: s, extraNew: EXTRA_BATCH })) {
        toast('Δεν υπάρχει κάτι για μελέτη σε αυτό το αντικείμενο σήμερα.');
      }
    } else if (step) {
      state.settings.newPerDay = Math.min(200, Math.max(10, state.settings.newPerDay + Number(step)));
      save();
      render();
    } else if (chart) {
      chartPick[chart] = Number(index);
      const y = window.scrollY;
      render();
      window.scrollTo(0, y);
    }
  });

  app.addEventListener('change', (event) => {
    if (event.target.id === 'exam') {
      state.settings.examDate = event.target.value || null;
      save();
      render();
    } else if (event.target.id === 'restore' && event.target.files[0]) {
      importBackup(event.target.files[0]);
    }
  });

  function render() {
    ({
      home: renderHome, study: renderStudy, summary: renderSummary, skills: renderSkills, skill: renderSkill,
      skillDone: renderSkillDone, progress: renderProgress, settings: renderSettings, guide: renderGuide,
      reading: renderReading, run: renderRun, runDone: renderRunDone, sim: renderSim, examBreak: renderExamBreak, examDone: renderExamDone,
    })[view]();
  }

  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && view === 'home') render();
    if (!document.hidden && view === 'run') tick();
  });

  function registerWorker() {
    if (!('serviceWorker' in navigator)) return;
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      location.reload();
    });
    navigator.serviceWorker.register('sw.js').then((reg) => {
      const offer = (worker) => toast('Υπάρχει νέα έκδοση.', { label: 'Ενημέρωση', run: () => worker.postMessage('activate-update') });
      if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) offer(worker);
        });
      });
    }).catch(() => {});
  }

  async function init() {
    load();
    try {
      const data = await (await fetch('questions.json')).json();
      questions = data.questions;
      subjects = data.subjects;
    } catch (err) {
      app.innerHTML = '<p class="fatal">Οι ερωτήσεις δεν φορτώθηκαν. Άνοιξε την εφαρμογή μία φορά με internet.</p>';
      return;
    }
    try {
      skillData = await (await fetch('skills.json')).json();
    } catch (err) {
      skillData = null;
    }
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    applyTheme();
    render();
    registerWorker();
  }

  init();
})();
