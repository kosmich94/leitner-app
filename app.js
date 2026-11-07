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
  const THEMES = [['auto', 'Αυτόματο'], ['light', 'Φωτεινό'], ['dark', 'Σκούρο']];
  const icon = (paths) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const ICONS = {
    skills: icon('<path d="M9.5 18h5M10.5 21h3M12 3a6 6 0 0 0-3.8 10.6c.6.5.9 1.2.9 1.9h5.8c0-.7.3-1.4.9-1.9A6 6 0 0 0 12 3z"/>'),
    home: icon('<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M4 10h16M8 3v4M16 3v4M9 15.5l2 2 4-4"/>'),
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
    return `<nav class="tabs">${item('home', 'Σήμερα')}${item('skills', 'Δεξιότητες')}${item('progress', 'Πρόοδος')}${item('settings', 'Ρυθμίσεις')}</nav>`;
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
      <header><p class="sub">${esc(when)}</p><h1>Σήμερα</h1>${examLine()}</header>
      ${installBanner()}${backupBanner()}${planCard()}${boxOverview()}${subjectList()}
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

  function renderSkills() {
    if (!skillData) {
      app.innerHTML = `<main class="screen"><header><h1>Δεξιότητες</h1></header>
        <p class="sub">Οι ερωτήσεις δεν φορτώθηκαν. Άνοιξε την εφαρμογή μία φορά με internet.</p></main>${tabs()}`;
      return;
    }
    const stats = skillData.parts.map((part) => ({ part, ...L.skillProgress(state, part) }));
    const sum = (key) => stats.reduce((n, x) => n + x[key], 0);
    const total = sum('total');
    const rows = stats.map(({ part, answered, correct, total: size }) => `
      <button class="subject" data-skill="${part.id}">
        <span class="name">${esc(part.name)}</span>
        <span class="meta">${num(answered)} / ${num(size)}<span class="chev">›</span></span>
        <span class="bar"><i style="width:${answered / size * 100}%"></i></span>
        <span class="hint">${esc(part.hint)}${answered ? ` Σωστές: ${num(correct)}.` : ''}</span>
      </button>`).join('');
    const verdict = sum('answered') < total ? `Ολοκλήρωσε και τα τρία μέρη για να δεις αν περνάς τη βάση των ${skillData.base}.`
      : sum('correct') >= skillData.base ? `Πέρασες τη βάση των ${skillData.base}.` : `Είσαι κάτω από τη βάση των ${skillData.base}.`;
    app.innerHTML = `<main class="screen">
      <header><h1>Δεξιότητες</h1><p class="sub">${esc(skillData.source)}</p></header>
      <section class="card hero">${ring(Math.round(sum('correct') / total * 100))}<div><h2>${num(sum('correct'))} / ${num(total)} σωστές</h2>
        <p class="sub">${esc(verdict)}</p></div></section>
      <section class="card"><h2>Δοκιμασίες</h2><div class="subjects">${rows}</div></section>
      <p class="sub note">Οι εξηγήσεις δεν προέρχονται από το ΑΣΕΠ. Οι αριθμητικές ελέγχθηκαν με τις επίσημες λύσεις, ενώ στις γλωσσικές και στα σενάρια είναι ερμηνεία της σωστής απάντησης.</p>
    </main>${tabs()}`;
  }

  function startSkill(id) {
    const part = skillPart(id);
    const queue = L.skillQueue(state, part);
    skill = { part, queue, pos: 0, options: null, picked: null };
    if (!queue.length) {
      view = 'skillDone';
      render();
      return;
    }
    nextSkill();
  }

  function nextSkill() {
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
    const rightIndex = options.findIndex((opt) => opt.correct);
    const rightLabel = part.fixed ? options[rightIndex].t : LETTERS[rightIndex];
    app.innerHTML = `<div class="study">
      <div class="study-top">
        <button class="close" data-do="skill-exit" aria-label="Έξοδος">${ICONS.close}</button>
        <div class="bar"><i style="width:${stats.answered / stats.total * 100}%"></i></div>
        <span class="count">${num(stats.answered)} / ${num(stats.total)}</span>
      </div>
      <div class="study-body ${answered ? '' : 'enter'}">
        <div class="tag"><b>${esc(part.name)}</b><span>Ερώτηση ${q.n}</span></div>
        ${q.img ? `<img class="puzzle" src="${esc(q.img)}" alt="Αριθμητική ερώτηση ${q.n}">` : ''}
        ${q.q ? `<p class="stem ${q.q2 ? '' : 'long'}">${esc(q.q)}</p>` : ''}
        ${q.q2 ? `<p class="stem">${esc(q.q2)}</p>` : ''}
        <div class="options ${part.fixed ? 'letters' : ''}">${buttons}</div>
        ${answered ? `<div class="explain"><b>${part.fixed ? 'Κανόνας' : 'Εξήγηση (όχι επίσημη)'}</b><p>${esc(q.e)}</p></div>` : ''}
      </div>
      ${answered ? `<div class="feedback" aria-live="polite">
        <p class="verdict ${right ? 'good' : 'bad'}">${right ? 'Σωστά' : `Λάθος <small>· Σωστή η ${esc(rightLabel)}</small>`}</p>
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

  function barChart(id, values, labels, describe) {
    const max = Math.max(1, ...values);
    const chosen = chartPick[id];
    const bars = values.map((v, i) => `
      <button data-chart="${id}" data-index="${i}" aria-pressed="${chosen === i}" aria-label="${esc(describe(i))}">
        <i style="height:${v ? Math.max(3, v / max * 100) : 0}%"></i></button>`).join('');
    const axis = labels.map((l) => `<span>${esc(l)}</span>`).join('');
    const caption = chosen === undefined ? 'Πάτα μια μπάρα για να δεις τον αριθμό' : describe(chosen);
    return `<div class="chart">${bars}</div><div class="axis">${axis}</div><p class="caption">${esc(caption)}</p>`;
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
    const { go, do: action, pick: picked, subject, step, chart, index, themeChoice, skill: skillId, skillPick } = el.dataset;
    if (themeChoice) {
      state.settings.theme = themeChoice;
      save();
      applyTheme();
      render();
    } else if (go) { view = go; study = null; skill = null; render(); window.scrollTo(0, 0); }
    else if (action) actions[action]();
    else if (picked !== undefined) pick(Number(picked));
    else if (skillId) startSkill(skillId);
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
      skillDone: renderSkillDone, progress: renderProgress, settings: renderSettings,
    })[view]();
  }

  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && view === 'home') render();
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
