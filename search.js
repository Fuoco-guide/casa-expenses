// Casa Lab experiment: search across every expense, not just the month on screen.
// If you are searching, you do not know when it was. Scoping search to the current
// month would defeat the point.
//
// One field, any kind of term: words, amounts, dates, a person, a category, a trip.
// Multiple terms narrow (AND), each term can match any field (OR).

// Strips accents so "caffe" finds "caffè" and "citta" finds "città".
function foldText(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

const MONTH_NAMES_SEARCH = [
  ['jan', 'january', 'gennaio', 'gen'],
  ['feb', 'february', 'febbraio'],
  ['mar', 'march', 'marzo'],
  ['apr', 'april', 'aprile'],
  ['may', 'maggio', 'mag'],
  ['jun', 'june', 'giugno', 'giu'],
  ['jul', 'july', 'luglio', 'lug'],
  ['aug', 'august', 'agosto', 'ago'],
  ['sep', 'september', 'settembre', 'set'],
  ['oct', 'october', 'ottobre', 'ott'],
  ['nov', 'november', 'novembre'],
  ['dec', 'december', 'dicembre', 'dic'],
];
const WEEKDAY_NAMES_SEARCH = [
  ['sunday', 'domenica'], ['monday', 'lunedi'], ['tuesday', 'martedi'],
  ['wednesday', 'mercoledi'], ['thursday', 'giovedi'], ['friday', 'venerdi'],
  ['saturday', 'sabato'],
];

// Everything about one expense, flattened into a single string to match against.
function searchBlob(e) {
  const parts = [];
  parts.push(e.note);

  // amounts, in the shapes a person actually types
  const amt = Number(e.amount) || 0;
  const eur = Number(e.amountEUR) || 0;
  parts.push(String(amt), amt.toFixed(2), amt.toFixed(2).replace('.', ','));
  parts.push(String(Math.round(amt)));
  if (Math.abs(eur - amt) > 0.005) {
    parts.push(String(eur), eur.toFixed(2), String(Math.round(eur)));
  }
  parts.push(e.currency, e.currency === 'THB' ? 'baht' : 'euro');

  // dates, in every shape a person might type
  const iso = e.date || '';
  const [y, mo, d] = iso.split('-');
  const mi = parseInt(mo, 10) - 1;
  parts.push(iso, `${d}/${mo}`, `${d}/${mo}/${y}`, `${d}-${mo}`, y, String(parseInt(d, 10)));
  if (MONTH_NAMES_SEARCH[mi]) parts.push(...MONTH_NAMES_SEARCH[mi]);
  const wd = new Date(iso + 'T00:00:00Z').getUTCDay();
  if (WEEKDAY_NAMES_SEARCH[wd]) parts.push(...WEEKDAY_NAMES_SEARCH[wd]);

  // category, person, payment
  const cat = ALL_CATEGORIES.find(c => c.id === e.category);
  if (cat) parts.push(cat.label, cat.id);
  const person = PEOPLE.find(p => p.id === (e.paidBy || 'debora'));
  if (person) parts.push(person.label, person.id);
  parts.push(e.payment);

  // the trip it belongs to, so "mountain" finds every expense from that weekend
  if (typeof allMoments === 'function') {
    allMoments().forEach(m => {
      const dropped = m.excludedIds || [];
      if (e.date >= m.start && e.date <= m.end && !dropped.includes(e.id)) {
        parts.push(m.name, m.emoji);
      }
    });
  }

  return foldText(parts.filter(Boolean).join(' '));
}

function searchExpenses(query) {
  const terms = foldText(query).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return DATA.expenses
    .filter(e => {
      const blob = searchBlob(e);
      return terms.every(t => blob.includes(t)); // every term must land somewhere
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

/* ---------- rendering ---------- */

function isSearching() {
  const el = document.getElementById('dash-search');
  return !!(el && el.value.trim());
}

function renderSearch() {
  const input = document.getElementById('dash-search');
  const panel = document.getElementById('search-results');
  const query = input.value.trim();

  // Swap the month view for results while a query is present, restore it when cleared.
  // The month picker means nothing while searching, since results span every month.
  ['overall-wheel', 'today-card', 'category-grid', 'moment-strip'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = query ? 'none' : '';
  });
  const nav = document.querySelector('#view-dashboard .month-nav');
  if (nav) nav.style.visibility = query ? 'hidden' : '';

  if (!query) {
    panel.classList.add('hidden');
    panel.innerHTML = '';
    return;
  }

  // askExpenses understands a question ("how much on gasoline in the last 2
  // weeks"): it strips the question words and turns the time phrase into a date
  // window, then matches the rest exactly like a plain search.
  const { list: results, terms, time } = askExpenses(query);
  panel.classList.remove('hidden');

  if (!results.length) {
    panel.innerHTML = `<p class="empty-state">Nothing found for &ldquo;${escapeHTML(query)}&rdquo;.</p>`;
    return;
  }

  const total = totalFor(results);
  panel.innerHTML = `
    <div class="search-summary">
      <strong>${displayAmount(total)}</strong>
      <span>${askReadingHTML(terms, time, results.length)}</span>
    </div>
    <div id="search-groups"></div>`;

  // Grouped by month, since results run across the whole history.
  const groups = [];
  results.forEach(e => {
    const key = e.date.slice(0, 7);
    let g = groups.find(x => x.key === key);
    if (!g) { g = { key, items: [] }; groups.push(g); }
    g.items.push(e);
  });

  const holder = document.getElementById('search-groups');
  groups.forEach(g => {
    const head = document.createElement('div');
    head.className = 'strip-label';
    head.innerHTML = `<span>${monthLabel(g.key)} · ${displayAmount(totalFor(g.items))}</span><i></i>`;
    holder.appendChild(head);

    const ul = document.createElement('ul');
    ul.className = 'expense-list';
    g.items.forEach(e => ul.appendChild(expenseRowEl(e)));
    holder.appendChild(ul);
  });
}

// The field is not part of the resting dashboard. It appears on the glyph, and the
// × puts the dashboard back exactly as it was.
function openSearch() {
  document.getElementById('search-bar').classList.remove('hidden');
  document.getElementById('btn-search-toggle').setAttribute('aria-expanded', 'true');
  document.getElementById('dash-search').focus();
}

function closeSearch() {
  const input = document.getElementById('dash-search');
  input.value = '';
  renderSearch();
  document.getElementById('search-bar').classList.add('hidden');
  document.getElementById('btn-search-toggle').setAttribute('aria-expanded', 'false');
}

function toggleSearch() {
  const open = !document.getElementById('search-bar').classList.contains('hidden');
  if (open) closeSearch(); else openSearch();
}

function wireSearch() {
  const input = document.getElementById('dash-search');
  if (!input) return;
  input.addEventListener('input', renderSearch);
  input.addEventListener('search', renderSearch); // the native × on type="search"
  input.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeSearch(); });
  document.getElementById('search-clear').addEventListener('click', closeSearch);
  document.getElementById('btn-search-toggle').addEventListener('click', toggleSearch);
}
