// Moments (trips), detected from the expenses that were already logged.
// No location permission, no GPS, no per expense tagging. The app reads the pattern
// it already has and asks one question.
//
// A Moment is a name plus a date range. Every shared expense in that window belongs
// to it, minus anything explicitly dropped out.
//
// PER DEVICE FOR NOW. Moments live in localStorage, not Firestore, so a trip named on
// Debora's phone does not appear on Victor's. This is not an oversight: the Firestore
// rules list collections explicitly and a read of `moments` returns 403, verified on
// 2 August 2026. To make trips shared, add this to the rules in the Firebase console,
// alongside the existing expenses and loans blocks, then ask for the sync to be wired:
//
//   match /moments/{doc} { allow read, write: if request.auth != null; }

const TRIP_WORDS = [
  // fuel and road
  'benzina', 'gasolio', 'diesel', 'disel', 'gasoline', 'petrol', 'pedaggio', 'autostrada',
  'toll', 'tolls', 'parking', 'parcheggio', 'noleggio',
  // sleeping somewhere else
  'campeggio', 'camping', 'hotel', 'albergo', 'ostello', 'hostel', 'airbnb', 'b&b',
  'rifugio', 'agriturismo', 'resort', 'guesthouse',
  // getting there
  'treno', 'train', 'volo', 'flight', 'fly', 'aereo', 'traghetto', 'battello', 'ferry',
  'taxi', 'grab', 'uber', 'bolt', 'biglietto', 'ticket',
  // mountain and holiday
  'funivia', 'seggiovia', 'skipass', 'museo', 'museum', 'terme', 'spiaggia',
];

// Hard gates, checked before any scoring. A run that fails one of these is never
// suggested no matter how travel-ish the words look. Two expenses over a weekend is
// just a Saturday, and asking about it makes the app feel nosy.
const TRIP_MIN_DAYS = 2;
const TRIP_MAX_DAYS = 6;
const TRIP_MIN_EXPENSES = 4;

const TRIP_SCORE_THRESHOLD = 5;
const MOMENT_EMOJI = ['📍', '🏔', '🏖', '🏙', '✈️', '🚗', '🎄', '❤️'];

let promptCandidate = null;

/* ---------- data helpers ---------- */

function allMoments() {
  return DATA.moments || (DATA.moments = []);
}
function dismissedRuns() {
  return DATA.dismissedRuns || (DATA.dismissedRuns = []);
}
function runKey(start, end) {
  return `${start}_${end}`;
}
function daysBetween(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}
// Everything here stays in UTC. Building a local midnight Date and reading it back
// with toISOString() silently returns the previous day in any positive offset, which
// turned the day loop below into an infinite loop the first time this ran.
function shiftDate(iso, n) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function isWeekendISO(iso) {
  const wd = new Date(iso + 'T00:00:00Z').getUTCDay();
  return wd === 0 || wd === 6;
}

// Every SHARED expense inside the window, minus the ones explicitly dropped out.
//
// The personal Debora category is excluded on purpose, exactly like the overall
// dashboard wheel and buildWhoPaidCard already do. Two reasons: the trip screen shows
// a who paid split, and personal spending would poison that fairness number; and both
// phones must show the same total for the same trip, which cannot happen if one of
// them is adding data the other does not have.
function momentExpenses(m) {
  const dropped = m.excludedIds || [];
  return DATA.expenses
    .filter(e => isSharedCategory(e.category))
    .filter(e => e.date >= m.start && e.date <= m.end && !dropped.includes(e.id))
    .sort((a, b) => a.date.localeCompare(b.date) || String(a.id).localeCompare(String(b.id)));
}
function momentTotal(m) {
  return totalFor(momentExpenses(m));
}
// A Moment belongs to a month if any part of its window falls in it, so a trip that
// straddles the end of a month shows on both. Deliberate: the 31 July to 2 August
// weekend is one trip, not two halves.
function momentsForMonth(monthKey) {
  return allMoments().filter(m => m.start.slice(0, 7) === monthKey || m.end.slice(0, 7) === monthKey);
}
function momentById(id) {
  return allMoments().find(m => m.id === id);
}
function windowOverlapsAnyMoment(start, end) {
  return allMoments().some(m => start <= m.end && end >= m.start);
}

/* ---------- detection ---------- */

// Detection reads shared house spending only, matching what a Moment can contain.
function sharedExpenses() {
  return DATA.expenses.filter(e => isSharedCategory(e.category));
}
function dailyTotals() {
  const map = new Map();
  sharedExpenses().forEach(e => map.set(e.date, (map.get(e.date) || 0) + e.amountEUR));
  return map;
}
function medianDailySpend(map) {
  const vals = [...map.values()].sort((a, b) => a - b);
  if (!vals.length) return 0;
  const mid = Math.floor(vals.length / 2);
  return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
}

// Group spending days into runs. One empty day inside a run is tolerated, since a
// Saturday spent walking around costs nothing and should not split a weekend in two.
function buildRuns(dates) {
  const runs = [];
  let current = null;
  dates.forEach(d => {
    if (current && daysBetween(current.end, d) <= 2) {
      current.end = d;
    } else {
      current = { start: d, end: d };
      runs.push(current);
    }
  });
  return runs;
}

function scoreRun(run, median) {
  const list = sharedExpenses().filter(e => e.date >= run.start && e.date <= run.end);
  const span = daysBetween(run.start, run.end) + 1;
  if (span < TRIP_MIN_DAYS || span > TRIP_MAX_DAYS) return null;
  if (list.length < TRIP_MIN_EXPENSES) return null;

  let score = 0;
  const hits = [];
  list.forEach(e => {
    const text = String(e.note || '').toLowerCase();
    TRIP_WORDS.forEach(w => {
      if (text.includes(w) && !hits.includes(w)) hits.push(w);
    });
  });
  if (hits.length) score += 3;
  if (hits.length >= 3) score += 1;

  const total = totalFor(list);
  if (median > 0 && total >= median * span * 2) score += 2;

  let weekend = false;
  for (let i = 0; i < span; i++) {
    if (isWeekendISO(shiftDate(run.start, i))) { weekend = true; break; }
  }
  if (weekend) score += 1;
  if (span >= 2 && span <= 4) score += 1;

  return { start: run.start, end: run.end, span, total, score, hits, count: list.length };
}

// Everything the app can work out on its own, with no permissions asked.
function detectCandidates() {
  const map = dailyTotals();
  const median = medianDailySpend(map);
  const dates = [...map.keys()].sort();
  return buildRuns(dates)
    .map(r => scoreRun(r, median))
    .filter(c => c && c.score >= TRIP_SCORE_THRESHOLD)
    .filter(c => !dismissedRuns().includes(runKey(c.start, c.end)))
    .filter(c => !windowOverlapsAnyMoment(c.start, c.end))
    .sort((a, b) => b.start.localeCompare(a.start));
}

/* ---------- the question ---------- */

// Safe to call repeatedly. Expenses arrive from Firestore asynchronously, so the
// first call on page load usually runs against an empty ledger and finds nothing;
// the sync listener calls this again once real data lands. The flag keeps it to one
// question per page load however many times it is invoked.
let tripQuestionAsked = false;

function maybeAskAboutTrip() {
  if (tripQuestionAsked) return;
  if (!document.getElementById('modal-moment-prompt').classList.contains('hidden')) return;
  const found = detectCandidates();
  if (!found.length) return;
  tripQuestionAsked = true;
  showMomentPrompt(found[0]);
}

function showMomentPrompt(candidate) {
  promptCandidate = candidate;
  const list = sharedExpenses()
    .filter(e => e.date >= candidate.start && e.date <= candidate.end)
    .sort((a, b) => a.date.localeCompare(b.date));

  document.getElementById('moment-prompt-range').textContent =
    `${formatDateShort(candidate.start)} to ${formatDateShort(candidate.end)}`;
  document.getElementById('moment-prompt-why').textContent = whyText(candidate);

  document.getElementById('moment-prompt-list').innerHTML = list.map(e => `
    <li>
      <span class="mp-note">${escapeHTML(e.note)}</span>
      <span class="mp-amt">${displayAmount(e.amountEUR)}</span>
    </li>`).join('');

  document.getElementById('moment-prompt-total').textContent = displayAmount(candidate.total);
  document.getElementById('moment-name').value = '';
  document.getElementById('moment-start').value = candidate.start;
  document.getElementById('moment-end').value = candidate.end;

  const chips = document.getElementById('moment-emoji');
  chips.innerHTML = MOMENT_EMOJI.map((em, i) =>
    `<button type="button" class="emoji-chip${i === 0 ? ' active' : ''}" data-emoji="${em}">${em}</button>`
  ).join('');
  chips.querySelectorAll('.emoji-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      chips.querySelectorAll('.emoji-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('modal-moment-prompt').classList.remove('hidden');
}

// Says out loud what the app noticed, so the guess never feels like magic.
function whyText(c) {
  const bits = [];
  if (c.hits.length) bits.push(`${c.hits.slice(0, 3).join(', ')} in the notes`);
  bits.push(`${c.count} expenses across ${c.span} days`);
  bits.push(`${displayAmount(c.total)} total`);
  return bits.join(' · ');
}

function closeMomentPrompt() {
  document.getElementById('modal-moment-prompt').classList.add('hidden');
  promptCandidate = null;
}

function saveMomentFromPrompt(ev) {
  ev.preventDefault();
  const name = document.getElementById('moment-name').value.trim();
  const start = document.getElementById('moment-start').value;
  const end = document.getElementById('moment-end').value;
  if (!name) { showToast('Give it a name first'); return; }
  if (!start || !end || end < start) { showToast('Check the dates'); return; }

  const active = document.querySelector('#moment-emoji .emoji-chip.active');
  allMoments().push({
    id: 'm' + Date.now(),
    name,
    emoji: active ? active.dataset.emoji : '📍',
    start,
    end,
    excludedIds: [],
  });
  saveData();
  closeMomentPrompt();
  showToast(`${name} saved`);
  renderCurrentView();
}

function dismissCandidate() {
  if (promptCandidate) {
    dismissedRuns().push(runKey(promptCandidate.start, promptCandidate.end));
    saveData();
  }
  closeMomentPrompt();
}

/* ---------- a late expense joining a trip ---------- */

// Membership is worked out from the date, so an expense added weeks later is already
// in. This only tells you it happened. It deliberately does not ask: a question here
// would interrupt every ordinary entry made near those dates.
let momentToastTimer = null;

function noticeMomentJoin(record) {
  if (!record || !record.date) return;
  if (!isSharedCategory(record.category)) return;
  const m = allMoments().find(x => record.date >= x.start && record.date <= x.end);
  if (!m) return;

  const el = document.getElementById('moment-toast');
  if (!el) return;
  document.getElementById('moment-toast-text').textContent = `Added to ${m.emoji} ${m.name}`;

  const undo = document.getElementById('moment-toast-undo');
  undo.onclick = () => {
    m.excludedIds = m.excludedIds || [];
    m.excludedIds.push(record.id);
    saveData();
    el.classList.add('hidden');
    renderCurrentView();
    showToast('Kept out of the trip');
  };

  el.classList.remove('hidden');
  clearTimeout(momentToastTimer);
  momentToastTimer = setTimeout(() => el.classList.add('hidden'), 5000);
}

/* ---------- Moments tab: every moment ever, newest first ---------- */

function renderMomentsList() {
  const wrap = document.getElementById('moments-content');
  const list = allMoments().slice().sort((a, b) => b.start.localeCompare(a.start));

  if (!list.length) {
    wrap.innerHTML = `
      <p class="empty-state">
        No moments yet.<br>
        When you spend a few days away, Casa notices and asks.
      </p>`;
    return;
  }

  const grand = list.reduce((s, m) => s + momentTotal(m), 0);

  // Grouped by year so a long history stays readable without a filter control.
  const years = [];
  list.forEach(m => {
    const y = m.start.slice(0, 4);
    let g = years.find(x => x.year === y);
    if (!g) { g = { year: y, items: [] }; years.push(g); }
    g.items.push(m);
  });

  wrap.innerHTML = `
    <div class="moments-summary">
      <strong>${displayAmount(grand)}</strong>
      <span>across ${list.length} moment${list.length > 1 ? 's' : ''}</span>
    </div>
    ${years.map(g => `
      <div class="moments-year">
        <div class="strip-label"><span>${g.year}</span><i></i></div>
        <div class="strip-cards">
          ${g.items.map(m => `
            <button type="button" class="moment-card" data-id="${m.id}">
              <span class="mc-emoji">${m.emoji}</span>
              <span class="mc-text">
                <span class="mc-name">${escapeHTML(m.name)}</span>
                <span class="mc-date">${formatDateShort(m.start)} to ${formatDateShort(m.end)} · ${momentExpenses(m).length} expenses</span>
              </span>
              <span class="mc-amt">${displayAmount(momentTotal(m))}</span>
            </button>`).join('')}
        </div>
      </div>`).join('')}
  `;

  wrap.querySelectorAll('.moment-card').forEach(btn => {
    btn.addEventListener('click', () => openMoment(btn.dataset.id, 'moments'));
  });
}

// `from` remembers which screen opened this, so the back arrow returns where you were
// instead of always dumping you on the dashboard.
function openMoment(id, from) {
  state.moment = id;
  state.momentFrom = from || 'moments';
  showView('moment');
  renderMomentView();
}

function renderMomentView() {
  const m = momentById(state.moment);
  if (!m) { showView('dashboard'); return; }

  const list = momentExpenses(m).slice().reverse();
  const spent = totalFor(list);
  const days = daysBetween(m.start, m.end) + 1;

  document.getElementById('moment-title').textContent = `${m.emoji} ${m.name}`;
  document.getElementById('moment-total').textContent = displayAmount(spent);
  document.getElementById('moment-meta').textContent =
    `${formatDateShort(m.start)} to ${formatDateShort(m.end)} · ${days} days · ${list.length} expenses`;

  // Who paid, shown as the working, not as a verdict.
  const byPerson = PEOPLE.map(p => ({
    id: p.id,
    label: p.label,
    total: totalFor(list.filter(e => (e.paidBy || 'debora') === p.id)),
  }));
  const diff = Math.abs((byPerson[0]?.total || 0) - (byPerson[1]?.total || 0));
  const pct = spent > 0 ? ((byPerson[0]?.total || 0) / spent) * 100 : 50;

  document.getElementById('moment-split').innerHTML = `
    ${byPerson.map(p => `
      <div class="ms-row"><span>${p.label} paid</span><strong>${displayAmount(p.total)}</strong></div>
    `).join('')}
    <div class="ms-bar"><em style="width:${pct.toFixed(1)}%"></em></div>
    <div class="ms-row ms-diff"><span>Difference</span><strong>${displayAmount(diff)}</strong></div>
  `;

  const listEl = document.getElementById('moment-expense-list');
  listEl.innerHTML = '';
  if (!list.length) {
    listEl.innerHTML = '<li class="empty-state">Nothing left in this trip.</li>';
  } else {
    list.forEach(e => {
      const li = expenseRowEl(e);
      const drop = document.createElement('button');
      drop.type = 'button';
      drop.className = 'drop-btn';
      drop.title = 'Not part of this trip';
      drop.setAttribute('aria-label', `Remove ${e.note} from this trip`);
      drop.textContent = '×';
      drop.addEventListener('click', (ev) => {
        ev.stopPropagation();
        m.excludedIds = m.excludedIds || [];
        m.excludedIds.push(e.id);
        saveData();
        renderMomentView();
        showToast('Removed from the trip');
      });
      li.appendChild(drop);
      listEl.appendChild(li);
    });
  }

  const dropped = (m.excludedIds || []).length;
  const note = document.getElementById('moment-dropped');
  note.textContent = dropped ? `${dropped} expense${dropped > 1 ? 's' : ''} removed from this trip` : '';
  note.classList.toggle('hidden', !dropped);
}

function deleteCurrentMoment() {
  const m = momentById(state.moment);
  if (!m) return;
  DATA.moments = allMoments().filter(x => x.id !== m.id);
  saveData();
  const back = state.momentFrom === 'dashboard' ? 'dashboard' : 'moments';
  showView(back);
  renderCurrentView();
  showToast(`${m.name} deleted`);
}

/* ---------- wiring ---------- */

function wireMoments() {
  document.getElementById('moment-back').addEventListener('click', () => {
    const back = state.momentFrom === 'dashboard' ? 'dashboard' : 'moments';
    showView(back);
    renderCurrentView();
  });
  document.getElementById('moment-delete').addEventListener('click', deleteCurrentMoment);
  document.getElementById('form-moment-prompt').addEventListener('submit', saveMomentFromPrompt);
  document.getElementById('moment-not-trip').addEventListener('click', dismissCandidate);
  document.getElementById('moment-later').addEventListener('click', closeMomentPrompt);
}
