/* ---------- the Stats tab ----------
   One wheel in the category colours with the total inside, tiles under it, then a report
   over time, the three biggest expenses and each category against the period before.
   A tap on a slice, a mark or a tile turns the whole screen to that category.

   House spending only, like Home and Expenses: the personal category never counts here.
   Every date is on the local calendar and pinned to midday, like the rest of app.js.
   moments.js is the one file that works in UTC. */

function statsDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}
function statsISO(d) {
  return isoFromParts(d.getFullYear(), d.getMonth() + 1, d.getDate());
}
function statsAddDays(iso, n) {
  const d = statsDate(iso);
  return statsISO(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12));
}

// Everything the screen needs to know about one period: where it starts and ends, the
// span to compare with the period before, and one entry per bar of the report.
// `offset` is 0 for the period we are in, -1 for the one before, and so on.
// When the period is still running, it is compared with the same days of the one before,
// because a half lived month against a whole one always reads as "less".
function statsFrame(period, offset, today = todayISO(), firstDay = firstDayOfWeek()) {
  const t = statsDate(today);
  const short = (iso) => statsDate(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const current = offset === 0;

  if (period === 'week') {
    const back = (t.getDay() - (firstDay % 7) + 7) % 7; // days since the week began
    const start = statsAddDays(today, -back + 7 * offset);
    const end = statsAddDays(start, 6);
    const label = current ? 'This week' : offset === -1 ? 'Last week' : `${short(start)} to ${short(end)}`;
    return {
      period, current, start, end, label,
      cap: current ? 'Spent this week' : offset === -1 ? 'Spent last week' : `Spent ${short(start)} to ${short(end)}`,
      spanEnd: current ? today : end,
      prevStart: statsAddDays(start, -7),
      prevEnd: current ? statsAddDays(today, -7) : statsAddDays(end, -7),
      prevText: current ? 'this time last week' : 'the week before',
      prevTitle: current ? 'last week' : 'the week before',
      prevNote: current ? 'the same days of the week' : '',
      barsTitle: 'Day by day', wide: true, pace: null,
      bars: Array.from({ length: 7 }, (_, i) => {
        const iso = statsAddDays(start, i);
        const d = statsDate(iso);
        return { from: iso, to: iso, label: d.toLocaleDateString('en-GB', { weekday: 'narrow' }), tag: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }), future: iso > today, now: iso === today };
      }),
    };
  }

  if (period === 'year') {
    const y = t.getFullYear() + offset;
    return {
      period, current, start: isoFromParts(y, 1, 1), end: isoFromParts(y, 12, 31), label: String(y), cap: `Spent in ${y}`,
      spanEnd: current ? today : isoFromParts(y, 12, 31),
      prevStart: null, prevEnd: null, // a year is not compared: the first buyers have one year at most
      barsTitle: 'Month by month', wide: true, pace: null, year: y,
      bars: Array.from({ length: 12 }, (_, i) => {
        const first = new Date(y, i, 1, 12);
        const last = new Date(y, i + 1, 0, 12);
        return { from: statsISO(first), to: statsISO(last), label: first.toLocaleDateString('en-GB', { month: 'narrow' }), tag: first.toLocaleDateString('en-GB', { month: 'short' }), future: statsISO(first) > today, now: current && i === t.getMonth() };
      }),
    };
  }

  // month
  const first = new Date(t.getFullYear(), t.getMonth() + offset, 1, 12);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0, 12);
  const prevFirst = new Date(first.getFullYear(), first.getMonth() - 1, 1, 12);
  const prevLast = new Date(first.getFullYear(), first.getMonth(), 0, 12);
  const name = first.toLocaleDateString('en-GB', { month: 'long' });
  const prevName = prevFirst.toLocaleDateString('en-GB', { month: 'long' });
  const days = last.getDate();
  // the same day number in the month before, or its last day when that month is shorter
  const sameDay = new Date(prevFirst.getFullYear(), prevFirst.getMonth(), Math.min(t.getDate(), prevLast.getDate()), 12);
  const sameYear = first.getFullYear() === t.getFullYear();
  return {
    period: 'month', current, start: statsISO(first), end: statsISO(last),
    label: sameYear ? name : first.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
    cap: `Spent in ${name}`,
    spanEnd: current ? today : statsISO(last),
    prevStart: statsISO(prevFirst),
    prevEnd: current ? statsISO(sameDay) : statsISO(prevLast),
    prevText: current ? `this time in ${prevName}` : prevName,
    prevTitle: prevName,
    prevNote: current ? `the same days, 1 to ${t.getDate()}` : '',
    barsTitle: 'Day by day', wide: false,
    pace: current ? { days, lived: t.getDate(), until: `${days} ${name}` } : null,
    bars: Array.from({ length: days }, (_, i) => {
      const d = new Date(first.getFullYear(), first.getMonth(), i + 1, 12);
      const iso = statsISO(d);
      return { from: iso, to: iso, label: [1, 8, 15, 22, 29].includes(i + 1) ? String(i + 1) : '', tag: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }), future: iso > today, now: iso === today };
    }),
  };
}

function statsShared() {
  return DATA.expenses.filter(e => isSharedCategory(e.category));
}
function statsBetween(list, from, to) {
  return list.filter(e => e.date >= from && e.date <= to);
}
// Category totals for a list, largest first, without the empty ones.
function statsByCategory(list) {
  return CATEGORIES.filter(c => isSharedCategory(c.id))
    .map(cat => ({ cat, total: totalFor(list.filter(e => e.category === cat.id)) }))
    .filter(x => x.total > 0)
    .sort((a, b) => b.total - a.total);
}
// What was paid in each currency, as paid: these figures are exact, never converted.
function statsByCurrency(list) {
  const sums = {};
  list.forEach(e => { sums[e.currency] = (sums[e.currency] || 0) + e.amount; });
  return Object.keys(sums).sort((a, b) => sums[b] - sums[a]).map(code => ({ code, amount: sums[code] }));
}
// The line under the wheel against the period before. Null when there is nothing fair to
// compare with: no earlier period, or tracking began after that period started.
function statsCompare(frame, list, catId) {
  if (!frame.prevStart) return null;
  const first = list.reduce((min, e) => (e.date < min ? e.date : min), '9999-12-31');
  if (first > frame.prevStart) return null;
  const pick = (l) => (catId ? l.filter(e => e.category === catId) : l);
  const now = totalFor(pick(statsBetween(list, frame.start, frame.spanEnd)));
  const before = totalFor(pick(statsBetween(list, frame.prevStart, frame.prevEnd)));
  return { now, before, diff: now - before };
}

// Stats shows one currency, the one of the round button in the top row. The main currency
// is the one the totals are counted in. Any other view is the main total at today's rate,
// an estimate, and says so.
function statsIsEstimate() {
  return state.displayCurrency !== mainCurrency() && !!rateFor(state.displayCurrency);
}
// One expense in the currency on screen. Paid in that currency: the amount as paid, exact.
// Paid in another one: its value in the view currency with the "about" sign, and what was
// really paid as a small second line.
function statsRowAmounts(e, view = state.displayCurrency) {
  if (e.currency === view) return { main: formatMoney(e.amount, e.currency), sub: '' };
  const value = view === mainCurrency() || !rateFor(view) ? mainMoney(mainValue(e)) : formatMoney(mainValue(e) * rateFor(view), view);
  return { main: '\u2248 ' + value, sub: 'paid ' + formatMoney(e.amount, e.currency) };
}

const STATS_UP = 'M12 19V5M6 11l6-6 6 6';
const STATS_DOWN = 'M12 5v14M6 13l6 6 6-6';
function statsArrow(up) {
  return `<svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path d="${up ? STATS_UP : STATS_DOWN}"/></svg>`;
}

// A closed wheel: one slice per category in its own colour, largest first from the top,
// flat ends and a small gap, so it never reads as the "spent against budget" ring of Home.
// A slice under 6% keeps its colour but gets no mark, the mark would not fit.
function statsWheelHTML(cats, total, frame) {
  const size = 248, stroke = 28, r = size / 2 - stroke / 2 - 4, c = size / 2, len = 2 * Math.PI * r;
  let acc = 0, arcs = '', marks = '';
  cats.forEach(({ cat, total: v }) => {
    const share = v / total;
    const dash = Math.max(2, share * len - 3);
    const dim = state.statsSel && state.statsSel !== cat.id ? ' dim' : '';
    arcs += `<circle class="stats-slice${dim}" data-cat="${cat.id}" cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${categoryTone(cat)}" stroke-width="${stroke}" stroke-dasharray="${dash.toFixed(1)} ${(len - dash).toFixed(1)}" stroke-dashoffset="${(-acc * len).toFixed(1)}" transform="rotate(-90 ${c} ${c})"/>`;
    if (share >= 0.06) {
      const a = (acc + share / 2) * 2 * Math.PI - Math.PI / 2;
      marks += `<button type="button" class="stats-mark${dim}" data-cat="${cat.id}" style="background:${categoryTone(cat)};left:${(c + r * Math.cos(a)).toFixed(1)}px;top:${(c + r * Math.sin(a)).toFixed(1)}px">${categoryArtHTML(cat, 'art')}</button>`;
    }
    acc += share;
  });
  if (!cats.length) arcs = `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${COLORS.track}" stroke-width="${stroke}"/>`;

  const picked = cats.find(x => x.cat.id === state.statsSel);
  const amount = (statsIsEstimate() ? '\u2248 ' : '') + displayAmount(picked ? picked.total : total);
  const inner = picked
    ? `<span class="stats-cap">${escapeHTML(picked.cat.label)}</span><span class="dial-amount ${amount.length > 8 ? 'long' : ''}">${splitAmountHTML(amount)}</span><span class="stats-cap">${Math.round((picked.total / total) * 100)}% · tap for all</span>`
    : `<span class="stats-cap">${escapeHTML(frame.cap)}</span><span class="dial-amount ${amount.length > 8 ? 'long' : ''}">${splitAmountHTML(amount)}</span>`;
  return `<div class="stats-wheel"><svg viewBox="0 0 ${size} ${size}" aria-hidden="true">${arcs}</svg>${marks}<button type="button" class="stats-centre" id="stats-centre">${inner}</button></div>`;
}

function renderAnalysis() {
  const shared = statsShared();
  const earliest = shared.reduce((min, e) => (e.date < min ? e.date : min), todayISO());
  const frame = statsFrame(state.statsPeriod, state.statsOffset);
  const inPeriod = statsBetween(shared, frame.start, frame.end);
  const cats = statsByCategory(inPeriod);
  if (state.statsSel && !cats.some(x => x.cat.id === state.statsSel)) state.statsSel = null;
  const sel = state.statsSel;
  const total = totalFor(inPeriod);
  const scope = sel ? inPeriod.filter(e => e.category === sel) : inPeriod;
  const selCat = sel ? cats.find(x => x.cat.id === sel).cat : null;

  document.getElementById('stats-label').textContent = frame.label;
  // going back stops at the first period that holds an expense
  document.getElementById('stats-prev').disabled = frame.start <= earliest;
  document.getElementById('stats-next').disabled = state.statsOffset >= 0;
  document.querySelectorAll('#stats-period .toggle-btn').forEach(b => b.classList.toggle('active', b.dataset.value === state.statsPeriod));

  const box = document.getElementById('analysis-content');
  let html = statsWheelHTML(cats, total, frame);
  if (!inPeriod.length) {
    box.innerHTML = html + `<p class="exp-empty">${shared.length ? 'Nothing logged in this period.' : 'Your first expense shows up here.'}</p>`;
    wireStatsScreen(cats, total, frame);
    return;
  }

  // the lines under the wheel
  const lines = [];
  const cmp = statsCompare(frame, shared, sel);
  if (cmp) {
    lines.push(Math.abs(cmp.diff) < 0.005
      ? `<div>The same as ${frame.prevText}</div>`
      : `<div>${statsArrow(cmp.diff > 0)}${displayAmount(Math.abs(cmp.diff))} ${cmp.diff > 0 ? 'more' : 'less'} than ${frame.prevText}</div>`);
  } else if (frame.period === 'year') {
    // an average only means something over finished months
    const thisMonth = todayISO().slice(0, 7);
    const finished = scope.filter(e => e.date.slice(0, 7) < thisMonth);
    const months = new Set(inPeriod.filter(e => e.date.slice(0, 7) < thisMonth).map(e => e.date.slice(0, 7)));
    if (months.size >= 2) lines.push(`<div>Average ${displayAmount(totalFor(finished) / months.size)} a month</div>`);
  }
  const paid = statsByCurrency(scope);
  if (paid.length > 1) lines.push(`<div class="soft">Paid as ${paid.map(p => formatMoney(p.amount, p.code)).join(' and ')}</div>`);
  if (frame.pace && !sel) lines.push(`<div class="soft">At this pace about ${displayAmount(Math.round((total / frame.pace.lived) * frame.pace.days))} by ${frame.pace.until}</div>`);
  // the pace is for the whole month only. Its line keeps its height while a category is chosen, so the tiles do not jump
  if (frame.pace && sel) lines.push('<div class="soft" aria-hidden="true">&nbsp;</div>');
  if (statsIsEstimate()) lines.push('<div class="soft">Converted at today\u2019s rate</div>');
  html += `<div class="stats-lines">${lines.join('')}</div>`;

  html += `<div class="tiles stats-tiles">${cats.map(({ cat, total: v }) =>
    `<button type="button" class="tile stats-tile${sel === cat.id ? ' active' : ''}" data-cat="${cat.id}" aria-pressed="${sel === cat.id}"><span class="tile-mark" style="background:${categoryTone(cat)}">${categoryArtHTML(cat, 'art')}</span><strong>${displayAmount(v)}</strong><b>${escapeHTML(cat.label)}</b></button>`).join('')}</div>`;

  // one small panel per person, only when two people use the app
  if (PEOPLE.length > 1) {
    html += `<div class="stats-who">${PEOPLE.map(p => {
      const sum = totalFor(scope.filter(e => (e.paidBy || PEOPLE[0].id) === p.id));
      const amount = displayAmount(sum);
      // a six digit baht figure gets a smaller size so it stays inside the panel
      return `<div class="stats-person"><span class="stats-avatar" aria-hidden="true">${escapeHTML(p.label.charAt(0))}</span><span class="stats-person-text"><small>${escapeHTML(p.label)}</small><strong class="${amount.length > 10 ? 'long' : ''}">${amount}</strong></span></div>`;
    }).join('')}</div>`;
  }

  // the report over time
  const values = frame.bars.map(b => (b.future ? 0 : totalFor(statsBetween(scope, b.from, b.to))));
  const max = Math.max(...values, 0.01);
  const top = values.indexOf(Math.max(...values));
  const barColour = (b) => (selCat ? categoryTone(selCat) : b.now ? (frame.period === 'year' ? '#FFFFFF' : 'var(--today)') : '');
  html += `<h2 class="stats-h">${frame.barsTitle}${selCat ? `<small>${escapeHTML(selCat.label)} only</small>` : ''}</h2>`;
  html += `<div class="stats-tagrow">${values[top] > 0 ? `<span class="stats-tag" style="left:clamp(72px, ${(((top + 0.5) / values.length) * 100).toFixed(1)}%, calc(100% - 72px))">${escapeHTML(frame.bars[top].tag)} · ${displayAmount(values[top])}</span>` : ''}</div>`;
  html += `<div class="stats-chart${frame.wide ? ' wide' : ''}" id="stats-chart" role="img">${frame.bars.map((b, i) =>
    b.future ? '<i class="later"></i>' : `<i style="height:${Math.max(3, (values[i] / max) * 120).toFixed(0)}px;${barColour(b) ? `background:${barColour(b)}` : ''}"></i>`).join('')}</div>`;
  // in a month only five days carry a number, each placed under its own bar
  html += frame.wide
    ? `<div class="stats-axis">${frame.bars.map(b => `<span>${escapeHTML(b.label)}</span>`).join('')}</div>`
    : `<div class="stats-axis placed">${frame.bars.map((b, i) => (b.label ? `<span style="left:${(((i + 0.5) / frame.bars.length) * 100).toFixed(2)}%">${escapeHTML(b.label)}</span>` : '')).join('')}</div>`;

  html += `<h2 class="stats-h">${selCat ? `Biggest in ${escapeHTML(selCat.label)}` : 'Biggest expenses'}</h2><ul class="exp-day" id="stats-big"></ul>`;

  // each category against the period before
  if (cmp) {
    const nowList = statsBetween(shared, frame.start, frame.spanEnd);
    const beforeList = statsBetween(shared, frame.prevStart, frame.prevEnd);
    const rows = CATEGORIES.filter(c => isSharedCategory(c.id) && (!sel || c.id === sel)).map(cat => {
      const a = totalFor(nowList.filter(e => e.category === cat.id));
      const b = totalFor(beforeList.filter(e => e.category === cat.id));
      return { cat, diff: a - b, any: a + b > 0 };
    }).filter(x => x.any).sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff));
    html += `<h2 class="stats-h">Compared with ${escapeHTML(frame.prevTitle)}${frame.prevNote ? `<small>${escapeHTML(frame.prevNote)}</small>` : ''}</h2>`;
    html += `<ul class="exp-day stats-cmp">${rows.map(({ cat, diff }) =>
      // arrow, amount and word each sit in their own column, so they line up down the list
      `<li><span class="exp-mark" style="background:${categoryTone(cat)}">${categoryArtHTML(cat, 'art')}</span><b>${escapeHTML(cat.label)}</b>${Math.abs(diff) < 0.005
        ? '<span class="stats-same">the same</span>'
        : `<span class="stats-arrow">${statsArrow(diff > 0)}</span><span class="stats-amount">${displayAmount(Math.abs(diff))}</span><span class="stats-word">${diff > 0 ? 'more' : 'less'}</span>`}</li>`).join('')}</ul>`;
  }

  box.innerHTML = html;
  // set as attributes, never written into the markup: escapeHTML leaves quotes alone
  const chart = document.getElementById('stats-chart');
  if (chart) chart.setAttribute('aria-label', `${frame.barsTitle}. Highest: ${frame.bars[top].tag}, ${displayAmount(values[top])}`);
  const big = document.getElementById('stats-big');
  scope.slice().sort((a, b) => mainValue(b) - mainValue(a)).slice(0, 3).forEach(e => {
    const li = expenseDayRowEl(e, !!sel, true);
    // a ranking is only readable in one currency, so the row leads with the one on screen
    const amounts = statsRowAmounts(e);
    li.querySelector('.exp-amt').innerHTML = `<b>${escapeHTML(amounts.main)}</b>${amounts.sub ? `<small>${escapeHTML(amounts.sub)}</small>` : ''}`;
    big.appendChild(li);
  });
  wireStatsScreen(cats, total, frame);
}

function wireStatsScreen(cats, total, frame) {
  const pick = (id) => { state.statsSel = state.statsSel === id ? null : id; renderAnalysis(); };
  document.querySelectorAll('#analysis-content [data-cat]').forEach(el => {
    const entry = cats.find(x => x.cat.id === el.dataset.cat);
    if (entry && el.tagName === 'BUTTON') el.setAttribute('aria-label', `${entry.cat.label}, ${displayAmount(entry.total)}, ${Math.round((entry.total / total) * 100)}%`);
    el.addEventListener('click', () => pick(el.dataset.cat));
  });
  const centre = document.getElementById('stats-centre');
  if (!centre) return;
  centre.setAttribute('aria-label', state.statsSel ? 'Show all categories' : `${frame.cap}: ${displayAmount(total)}`);
  centre.addEventListener('click', () => { if (state.statsSel) { state.statsSel = null; renderAnalysis(); } });
}

function wireStats() {
  document.querySelectorAll('#stats-period .toggle-btn').forEach(btn => btn.addEventListener('click', () => {
    state.statsPeriod = btn.dataset.value;
    state.statsOffset = 0;
    renderAnalysis();
  }));
  document.getElementById('stats-prev').addEventListener('click', () => { state.statsOffset -= 1; renderAnalysis(); });
  document.getElementById('stats-next').addEventListener('click', () => { if (state.statsOffset < 0) { state.statsOffset += 1; renderAnalysis(); } });
}
