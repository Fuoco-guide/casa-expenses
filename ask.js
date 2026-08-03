// Ask: answers questions about your own expenses, with arithmetic instead of a
// language model.
//
// "how much on gasoline in the last 2 weeks" is three things: a time range, a
// subject, and a sum. searchBlob() in search.js already handles the subject. This
// file adds the other two, plus the small job of ignoring the words that make a
// sentence a question ("how much", "did we spend", "quanto abbiamo speso").
//
// No API key, no server, no cost, works offline, and the number is arithmetic
// rather than a guess. On a money app that last point is the whole argument.

// Words that carry no meaning for a search but appear in every question. Only
// stripped when something else survives, so a note that genuinely reads "the last
// one" is still findable.
const ASK_STOPWORDS = new Set([
  // english
  'how', 'much', 'many', 'what', 'whats', 'did', 'do', 'does', 'we', 'i', 'you',
  'spend', 'spent', 'spending', 'pay', 'paid', 'cost', 'costs', 'total', 'sum',
  'on', 'in', 'the', 'a', 'an', 'of', 'at', 'to', 'from', 'for', 'over', 'is',
  'was', 'were', 'all', 'my', 'our', 'and', 'show', 'me', 'tell', 'please',
  // italian
  'quanto', 'quanti', 'quante', 'abbiamo', 'ho', 'speso', 'spesi', 'pagato',
  'costa', 'costato', 'totale', 'nel', 'nella', 'negli', 'nelle', 'il', 'lo',
  'la', 'gli', 'le', 'di', 'del', 'della', 'dei', 'delle', 'che', 'cosa',
  'mostrami', 'dimmi', 'per', 'con', 'su', 'da',
]);

/* ---------- local calendar helpers ---------- */
// Expenses are stored on the local calendar (todayISO in app.js uses getFullYear
// and friends), so ranges are computed the same way. Date arithmetic goes through
// a Date object rather than string maths, which keeps month lengths and DST right.

function askToday() {
  const d = new Date();
  d.setHours(12, 0, 0, 0); // midday, so a DST shift can never move the day
  return d;
}
function askISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function askShift(d, days) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
// Monday as the first day of the week, which is what both Italy and the UK use.
function askStartOfWeek(d) {
  const x = new Date(d);
  const wd = (x.getDay() + 6) % 7;
  return askShift(x, -wd);
}

/* ---------- time phrases ---------- */

// Each entry is a regex plus a function returning [from, to] as Date objects.
// Order matters: the longer, more specific phrases are tested first so
// "last month" never gets eaten by a looser "last" rule.
const TIME_PHRASES = [
  // last N days / weeks / months, both languages
  {
    re: /\b(?:last|past|ultim[oiae])\s+(\d+)\s+(days?|weeks?|months?|giorni|giorno|settiman[ae]|mes[ei])\b/,
    range: (m, today) => {
      const n = parseInt(m[1], 10);
      const unit = m[2];
      if (/giorn|day/.test(unit)) return [askShift(today, -n), today];
      if (/settiman|week/.test(unit)) return [askShift(today, -n * 7), today];
      const from = new Date(today);
      from.setMonth(from.getMonth() - n);
      return [from, today];
    },
  },
  // last week / month / year
  {
    re: /\b(?:last|scors[ao]|passat[ao])\s+(week|settimana)\b|\b(?:settimana)\s+(?:scorsa|passata)\b/,
    range: (m, today) => {
      const start = askShift(askStartOfWeek(today), -7);
      return [start, askShift(start, 6)];
    },
  },
  {
    re: /\blast\s+month\b|\bmese\s+(?:scorso|passato)\b/,
    range: (m, today) => {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1, 12);
      const to = new Date(today.getFullYear(), today.getMonth(), 0, 12);
      return [from, to];
    },
  },
  {
    re: /\blast\s+year\b|\banno\s+(?:scorso|passato)\b/,
    range: (m, today) => [
      new Date(today.getFullYear() - 1, 0, 1, 12),
      new Date(today.getFullYear() - 1, 11, 31, 12),
    ],
  },
  // this week / month / year
  {
    re: /\bthis\s+week\b|\bquesta\s+settimana\b/,
    range: (m, today) => [askStartOfWeek(today), today],
  },
  {
    re: /\bthis\s+month\b|\bquesto\s+mese\b/,
    range: (m, today) => [new Date(today.getFullYear(), today.getMonth(), 1, 12), today],
  },
  {
    re: /\bthis\s+year\b|\bquest[o']?\s*anno\b/,
    range: (m, today) => [new Date(today.getFullYear(), 0, 1, 12), today],
  },
  // single days
  { re: /\byesterday\b|\bieri\b/, range: (m, today) => [askShift(today, -1), askShift(today, -1)] },
  { re: /\btoday\b|\boggi\b/, range: (m, today) => [today, today] },
];

// Pulls the first time phrase out of the text and returns the range plus the text
// with that phrase removed, so the leftover words can be matched as a subject.
function extractTimeRange(text) {
  const today = askToday();
  for (const p of TIME_PHRASES) {
    const m = text.match(p.re);
    if (!m) continue;
    const [from, to] = p.range(m, today);
    return {
      from: askISO(from),
      to: askISO(to),
      label: m[0].trim(),
      rest: (text.slice(0, m.index) + ' ' + text.slice(m.index + m[0].length)).trim(),
    };
  }
  return null;
}

/* ---------- the question ---------- */

function parseAsk(query) {
  const folded = foldText(query);
  const time = extractTimeRange(folded);
  const body = time ? time.rest : folded;

  const words = body.split(/\s+/).filter(Boolean);
  const meaningful = words.filter(w => !ASK_STOPWORDS.has(w));
  // Only drop the filler if something is left; otherwise "the" stays searchable.
  const terms = meaningful.length ? meaningful : words;

  return { terms, time };
}

// Same matching rules as searchExpenses, plus an optional date window.
function askExpenses(query) {
  const { terms, time } = parseAsk(query);
  if (!terms.length && !time) return { list: [], terms, time };

  const list = DATA.expenses
    .filter(e => !time || (e.date >= time.from && e.date <= time.to))
    .filter(e => {
      if (!terms.length) return true;
      const blob = searchBlob(e);
      return terms.every(t => blob.includes(t));
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return { list, terms, time };
}

// Says out loud what the question was understood to mean, so a wrong answer is
// visibly a wrong reading rather than a mystery.
function askReadingHTML(terms, time, count) {
  const bits = [];
  if (terms.length) bits.push(escapeHTML(terms.join(' ')));
  if (time) bits.push(escapeHTML(time.label));
  bits.push(`${count} expense${count === 1 ? '' : 's'}`);
  return bits.join(' &middot; ');
}
