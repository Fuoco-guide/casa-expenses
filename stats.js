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
// `range` is { from, to } for dates picked in the calendar; its arrows move it by its own length.
function statsFrame(period, offset, today = todayISO(), firstDay = firstDayOfWeek(), range = null) {
  const t = statsDate(today);
  // day and month never part when a long label wraps to two lines
  const keep = (text) => text.replace(/ /g, '\u00a0');
  const short = (iso) => keep(statsDate(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
  const current = offset === 0;

  if (period === 'day') {
    const iso = statsAddDays(today, offset);
    const named = statsDate(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    // today is still running and expenses carry no time, so it is compared with nothing
    const finished = offset < 0;
    return {
      period, current, start: iso, end: iso, spanEnd: iso,
      label: current ? 'Today' : offset === -1 ? 'Yesterday' : named,
      cap: current ? 'Spent today' : offset === -1 ? 'Spent yesterday' : `Spent on ${named}`,
      prevStart: finished ? statsAddDays(iso, -1) : null,
      prevEnd: finished ? statsAddDays(iso, -1) : null,
      prevText: offset === -1 ? 'the day before yesterday' : 'the day before',
      prevTitle: offset === -1 ? 'the day before yesterday' : 'the day before',
      prevNote: '', pace: null,
      bars: null, // one day has nothing to draw over time
    };
  }

  if (period === 'range' && range) {
    const length = Math.round((statsDate(range.to) - statsDate(range.from)) / 864e5) + 1;
    const start = statsAddDays(range.from, length * offset);
    const end = statsAddDays(start, length - 1);
    // the year is written only when the dates leave the current one
    const withYear = start.slice(0, 4) !== today.slice(0, 4) || end.slice(0, 4) !== today.slice(0, 4);
    const named = (iso) => (withYear ? keep(statsDate(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })) : short(iso));
    let bars;
    if (length <= 62) {
      bars = Array.from({ length }, (_, i) => {
        const iso = statsAddDays(start, i);
        const d = statsDate(iso);
        return { from: iso, to: iso, label: length <= 14 || i % 7 === 0 ? String(d.getDate()) : '', tag: d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }), future: iso > today, now: iso === today };
      });
    } else {
      // a long span is drawn month by month, each bar cut to the picked dates
      bars = [];
      for (let d = new Date(statsDate(start).getFullYear(), statsDate(start).getMonth(), 1, 12); statsISO(d) <= end; d = new Date(d.getFullYear(), d.getMonth() + 1, 1, 12)) {
        const first = statsISO(d);
        const last = statsISO(new Date(d.getFullYear(), d.getMonth() + 1, 0, 12));
        bars.push({ from: first < start ? start : first, to: last > end ? end : last, label: d.toLocaleDateString('en-GB', { month: 'narrow' }), tag: d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }), future: first > today, now: first <= today && today <= last });
      }
    }
    return {
      period, current: end >= today, start, end, length,
      label: `${named(start)} to ${named(end)}`,
      cap: `Spent ${named(start)} to ${named(end)}`,
      spanEnd: end > today ? today : end,
      prevStart: statsAddDays(start, -length),
      prevEnd: statsAddDays(start, -1),
      prevText: `the ${length} days before`,
      prevTitle: `the ${length} days before`,
      prevNote: '', pace: null,
      barsTitle: length <= 62 ? 'Day by day' : 'Month by month',
      wide: length <= 14 || length > 62,
      bars,
    };
  }

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

// The period on screen, as the buttons and the calendar left it.
function statsCurrentFrame() {
  return statsFrame(state.statsPeriod, state.statsOffset, todayISO(), firstDayOfWeek(), state.statsRange);
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
  const frame = statsCurrentFrame();
  const inPeriod = statsBetween(shared, frame.start, frame.end);
  const cats = statsByCategory(inPeriod);
  if (state.statsSel && !cats.some(x => x.cat.id === state.statsSel)) state.statsSel = null;
  const sel = state.statsSel;
  const total = totalFor(inPeriod);
  const scope = sel ? inPeriod.filter(e => e.category === sel) : inPeriod;
  const selCat = sel ? cats.find(x => x.cat.id === sel).cat : null;

  document.getElementById('stats-label').textContent = frame.label;
  document.getElementById('stats-label-btn').classList.toggle('long', frame.label.length > 14);
  // going back stops at the first period that holds an expense
  document.getElementById('stats-prev').disabled = frame.start <= earliest;
  document.getElementById('stats-next').disabled = frame.end >= todayISO();
  document.getElementById('stats-label-btn').setAttribute('aria-label', `${frame.label}. Choose dates`);
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
      return `<div class="stats-person"><span class="stats-avatar"${avatarTone(p)} aria-hidden="true">${escapeHTML(p.label.charAt(0))}</span><span class="stats-person-text"><small>${escapeHTML(p.label)}</small><strong class="${amount.length > 10 ? 'long' : ''}">${amount}</strong></span></div>`;
    }).join('')}</div>`;
  }

  // the report over time, for every period longer than a day
  if (frame.bars) {
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
  }

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
  if (chart) {
    const values = frame.bars.map(b => (b.future ? 0 : totalFor(statsBetween(scope, b.from, b.to))));
    const top = values.indexOf(Math.max(...values));
    chart.setAttribute('aria-label', `${frame.barsTitle}. Highest: ${frame.bars[top].tag}, ${displayAmount(values[top])}`);
  }
  const big = document.getElementById('stats-big');
  scope.slice().sort((a, b) => mainValue(b) - mainValue(a)).slice(0, 3).forEach(e => {
    const li = expenseDayRowEl(e, !!sel, frame.period !== 'day'); // one day needs no date on each row
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
  document.getElementById('stats-next').addEventListener('click', () => { if (statsCurrentFrame().end < todayISO()) { state.statsOffset += 1; renderAnalysis(); } });
  wireStatsCalendar();
}

/* ---------- the calendar under the period label ----------
   One tap picks a day, a second tap later on picks the last day of a span. Quick picks
   choose at once. Days still to come cannot be picked, and a dot marks each day with an expense. */
const cal = { from: null, to: null, month: null };

function statsShowDates(from, to) {
  state.statsSel = null;
  if (!to || to === from) {
    state.statsPeriod = 'day';
    state.statsOffset = -Math.round((statsDate(todayISO()) - statsDate(from)) / 864e5);
  } else {
    state.statsPeriod = 'range';
    state.statsRange = { from, to };
    state.statsOffset = 0;
  }
  document.getElementById('modal-cal').classList.add('hidden');
  renderAnalysis();
}

function openStatsCalendar() {
  const frame = statsCurrentFrame();
  const today = todayISO();
  cal.from = frame.start > today ? today : frame.start;
  cal.to = frame.period === 'day' ? null : (frame.end > today ? today : frame.end);
  cal.month = (cal.to || cal.from).slice(0, 7);
  renderStatsCalendar();
  document.getElementById('modal-cal').classList.remove('hidden');
}

function renderStatsCalendar() {
  const today = todayISO();
  const [y, m] = cal.month.split('-').map(Number);
  const first = new Date(y, m - 1, 1, 12);
  const days = new Date(y, m, 0, 12).getDate();
  const startDay = firstDayOfWeek() % 7;
  const spent = new Set(statsShared().map(e => e.date));
  const earliest = statsShared().reduce((min, e) => (e.date < min ? e.date : min), today);

  document.getElementById('cal-month-label').textContent = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  document.getElementById('cal-prev').disabled = cal.month <= earliest.slice(0, 7);
  document.getElementById('cal-next').disabled = cal.month >= today.slice(0, 7);

  // 4 October 2026 is a Sunday: the seven names start from it
  let html = Array.from({ length: 7 }, (_, i) => `<span class="cal-wd" aria-hidden="true">${new Date(2026, 9, 4 + ((startDay + i) % 7), 12).toLocaleDateString('en-GB', { weekday: 'narrow' })}</span>`).join('');
  html += '<span></span>'.repeat((first.getDay() - startDay + 7) % 7);
  for (let d = 1; d <= days; d++) {
    const iso = isoFromParts(y, m, d);
    const end = cal.to || cal.from;
    const cls = ['cal-day',
      iso === cal.from ? 'start' : '', iso === end ? 'end' : '',
      cal.to && iso > cal.from && iso < cal.to ? 'in' : '',
      iso === today ? 'today' : '', spent.has(iso) ? 'dot' : ''].filter(Boolean).join(' ');
    const picked = iso === cal.from || iso === end;
    html += `<button type="button" class="${cls}" data-iso="${iso}" aria-pressed="${picked}" aria-label="${escapeHTML(dayLabel(iso))}"${iso > today ? ' disabled' : ''}><span>${d}</span></button>`;
  }
  const grid = document.getElementById('cal-grid');
  grid.innerHTML = html;
  grid.querySelectorAll('.cal-day').forEach(b => b.addEventListener('click', () => {
    const iso = b.dataset.iso;
    if (!cal.from || cal.to) { cal.from = iso; cal.to = null; }
    else if (iso < cal.from) cal.from = iso;
    else if (iso > cal.from) cal.to = iso;
    renderStatsCalendar();
  }));

  const length = cal.to ? Math.round((statsDate(cal.to) - statsDate(cal.from)) / 864e5) + 1 : 1;
  const short = (iso) => statsDate(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: cal.from.slice(0, 4) !== today.slice(0, 4) ? 'numeric' : undefined });
  document.getElementById('cal-count').textContent = length === 1 ? '1 day' : `${length} days`;
  document.getElementById('cal-span').textContent = cal.to ? `${short(cal.from)} to ${short(cal.to)}` : dayLabel(cal.from);
}

function wireStatsCalendar() {
  // a new stats.js next to an older cached index.html has no calendar to wire, and must not stop the start
  if (!document.getElementById('modal-cal') || !document.getElementById('stats-label-btn')) return;
  document.getElementById('stats-label-btn').addEventListener('click', openStatsCalendar);
  document.getElementById('cal-close').addEventListener('click', () => document.getElementById('modal-cal').classList.add('hidden'));
  document.getElementById('cal-prev').addEventListener('click', () => { cal.month = shiftMonth(cal.month, -1); renderStatsCalendar(); });
  document.getElementById('cal-next').addEventListener('click', () => { cal.month = shiftMonth(cal.month, 1); renderStatsCalendar(); });
  document.getElementById('cal-show').addEventListener('click', () => statsShowDates(cal.from, cal.to));
  document.querySelectorAll('#cal-quick button').forEach(b => b.addEventListener('click', () => {
    const today = todayISO();
    const back = Number(b.dataset.back);
    if (b.dataset.kind === 'day') statsShowDates(statsAddDays(today, -back), null);
    else statsShowDates(statsAddDays(today, -back), today);
  }));
}
