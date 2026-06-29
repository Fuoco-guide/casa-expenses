const STORAGE_KEY = 'casa-expenses-v1';

const COLORS = {
  sage: '#8FA888',
  clay: '#C97B63',
  maroon: '#8B3A3A',
};

const DEFAULT_THB_PER_EUR = 38;
const RATE_ENDPOINT = 'https://api.frankfurter.dev/v1/latest?from=EUR&to=THB';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDR3dWG8SpGTKoNx2BhE6JFCOyLzSv5n88',
  authDomain: 'casa-expenses.firebaseapp.com',
  projectId: 'casa-expenses',
  storageBucket: 'casa-expenses.firebasestorage.app',
  messagingSenderId: '502413795264',
  appId: '1:502413795264:web:3875ac10aa0140f7a2f225',
};
const FIREBASE_READY = !FIREBASE_CONFIG.apiKey.startsWith('PASTE_');

const PEOPLE = [
  { id: 'debora', label: 'Debora' },
  { id: 'victor', label: 'Victor' },
];

const ALL_CATEGORIES = [
  { id: 'bills', label: 'Bills', icon: 'M3 11l9-7 9 7M5 10v9h14v-9M9 19v-5h6v5',
    keywords: ['rent','affitto','bill','bills','bolletta','bollette','insurance','assicurazione','electricity','elettricita','gas','water','acqua','wifi','internet','utility','utilities','mortgage'] },
  { id: 'transportation', label: 'Transportation', icon: 'M4 16l1.2-4.8A2 2 0 017.1 9.7h9.8a2 2 0 011.9 1.5L20 16M3 16h18v3a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-3z',
    keywords: ['gasoline','benzina','fuel','train','treno','grab','uber','taxi','bus','flight','volo','metro','parking','parcheggio','toll'] },
  { id: 'grocery', label: 'Grocery', icon: 'M4 9h16l-1.6 9.4a2 2 0 01-2 1.6H7.6a2 2 0 01-2-1.6L4 9zM8 9V7a4 4 0 018 0v2',
    keywords: ['grocery','groceries','spesa','supermercato','supermarket','cleaning','detergente','food','cibo','market'] },
  { id: 'dining', label: 'Dining Out / Leisure', icon: 'M5 4h11v6a5.5 5.5 0 01-11 0V4zM16 7h2a2 2 0 010 4h-2M3 21h14',
    keywords: ['dinner','cena','wine','vino','aperitivo','gelato','cinema','museum','museo','restaurant','ristorante','coffee','caffe','bar','pranzo','lunch'] },
  { id: 'debora', label: 'Debora', icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6',
    keywords: ['clothes','vestiti','shopping','personal','scarpe','shoes'] },
  { id: 'extra', label: 'Extra', icon: 'M3 9h18v4H3zM5 9V7a2 2 0 012-2h2M19 9V7a2 2 0 00-2-2h-2M12 5v16M5 13v6a1 1 0 001 1h12a1 1 0 001-1v-6',
    keywords: ['gift','regalo','extra','present'] },
];

const PAY_ICONS = {
  card: 'M3 7h18v10H3zM3 11h18M6 15h4',
  cash: 'M3 8h18v8H3zM12 10a2 2 0 100 4 2 2 0 000-4z',
};

function isSharedCategory(catId) {
  return catId !== 'debora';
}
function categoriesForIdentity(identity) {
  return identity === 'victor' ? ALL_CATEGORIES.filter(c => isSharedCategory(c.id)) : ALL_CATEGORIES;
}

let DATA = loadData();
let CATEGORIES = categoriesForIdentity(DATA.identity);
const state = { view: 'dashboard', month: currentMonthKey(), category: null, editingId: null };

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { expenses: [], budgets: {}, exchangeRate: null, lastCurrency: 'EUR', identity: null };
    const parsed = JSON.parse(raw);
    const expenses = (parsed.expenses || []).map(e => ({
      ...e,
      currency: e.currency || 'EUR',
      amountEUR: e.amountEUR != null ? e.amountEUR : e.amount,
      paidBy: e.paidBy || parsed.identity || 'debora',
    }));
    return {
      expenses,
      budgets: parsed.budgets || {},
      exchangeRate: parsed.exchangeRate || null,
      lastCurrency: parsed.lastCurrency || 'EUR',
      identity: parsed.identity || null,
    };
  } catch (e) {
    return { expenses: [], budgets: {}, exchangeRate: null, lastCurrency: 'EUR', identity: null };
  }
}
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DATA));
}

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}
function shiftMonth(key, delta) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatDateShort(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function euro(n) {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n || 0);
}
function formatMoney(amount, currency) {
  if (currency === 'THB') {
    return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(amount || 0);
  }
  return euro(amount);
}
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function currentRate() {
  return (DATA.exchangeRate && DATA.exchangeRate.rate) || DEFAULT_THB_PER_EUR;
}
function toEUR(amount, currency) {
  return currency === 'THB' ? amount / currentRate() : amount;
}
async function refreshExchangeRate() {
  try {
    const res = await fetch(RATE_ENDPOINT);
    if (!res.ok) throw new Error('bad response');
    const data = await res.json();
    if (!data.rates || !data.rates.THB) throw new Error('no rate in response');
    DATA.exchangeRate = { rate: data.rates.THB, updatedAt: new Date().toISOString() };
    saveData();
  } catch (e) {
    if (!DATA.exchangeRate) DATA.exchangeRate = { rate: DEFAULT_THB_PER_EUR, updatedAt: null };
  }
  renderExchangeRateDisplay();
}
function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'updated just now';
  if (mins < 60) return `updated ${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `updated ${hours}h ago`;
  return `updated ${Math.round(hours / 24)}d ago`;
}
function renderExchangeRateDisplay() {
  const el = document.getElementById('exchange-rate-display');
  if (!el) return;
  const r = DATA.exchangeRate || { rate: DEFAULT_THB_PER_EUR, updatedAt: null };
  el.innerHTML = `
    <div class="rate-text">1 EUR = ${r.rate.toFixed(2)} &#3647;<span class="rate-updated">${r.updatedAt ? timeAgo(r.updatedAt) : 'estimated, not yet updated'}</span></div>
    <button type="button" class="icon-btn" id="btn-refresh-rate" aria-label="Refresh exchange rate">
      <svg viewBox="0 0 24 24" class="icon"><path d="M4 4v5h5M20 20v-5h-5M4.6 9a8 8 0 0114-4.4M19.4 15a8 8 0 01-14 4.4"/></svg>
    </button>
  `;
  document.getElementById('btn-refresh-rate').addEventListener('click', async () => {
    showToast('Checking latest rate…');
    await refreshExchangeRate();
    showToast('Exchange rate updated');
  });
}

function expensesForMonth(monthKey) {
  return DATA.expenses.filter(e => e.date.slice(0, 7) === monthKey);
}
function expensesForCategoryMonth(catId, monthKey) {
  return expensesForMonth(monthKey).filter(e => e.category === catId);
}
function totalFor(list) {
  return list.reduce((sum, e) => sum + e.amountEUR, 0);
}
function budgetFor(catId) {
  return DATA.budgets[catId] || 0;
}
function overallBudget() {
  return CATEGORIES.reduce((sum, c) => sum + budgetFor(c.id), 0);
}
function allMonthsWithData() {
  return Array.from(new Set(DATA.expenses.map(e => e.date.slice(0, 7)))).sort();
}

function addExpense({ note, amount, currency, date, category, payment, paidBy }) {
  const record = { note, amount, currency, amountEUR: toEUR(amount, currency), date, category, payment, paidBy };
  DATA.lastCurrency = currency;
  if (FIREBASE_READY && isSharedCategory(category)) {
    addSharedExpense(record);
    saveData();
    return;
  }
  record.id = 'e' + Date.now() + Math.random().toString(36).slice(2, 7);
  DATA.expenses.push(record);
  saveData();
}
function updateExpense(id, fields) {
  const e = DATA.expenses.find(x => x.id === id);
  if (!e) return;
  const updated = { ...e, ...fields };
  updated.amountEUR = toEUR(updated.amount, updated.currency);
  if (FIREBASE_READY && isSharedCategory(updated.category)) {
    updateSharedExpense(id, updated);
    return;
  }
  Object.assign(e, updated);
  saveData();
}
function deleteExpense(id) {
  const e = DATA.expenses.find(x => x.id === id);
  if (e && FIREBASE_READY && isSharedCategory(e.category)) {
    deleteSharedExpense(id);
    return;
  }
  DATA.expenses = DATA.expenses.filter(x => x.id !== id);
  saveData();
}

const FIREBASE_SDK_BASE = 'https://www.gstatic.com/firebasejs/10.12.2';
let firestoreDb = null;
let firestoreFns = null;
let sharedSyncStarted = false;

async function startSharedSync() {
  if (!FIREBASE_READY || sharedSyncStarted) return;
  sharedSyncStarted = true;
  try {
    const { initializeApp } = await import(`${FIREBASE_SDK_BASE}/firebase-app.js`);
    const firestoreModule = await import(`${FIREBASE_SDK_BASE}/firebase-firestore.js`);
    const { getAuth, signInAnonymously } = await import(`${FIREBASE_SDK_BASE}/firebase-auth.js`);
    const { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, setDoc, onSnapshot, enableIndexedDbPersistence } = firestoreModule;

    const firebaseApp = initializeApp(FIREBASE_CONFIG);
    firestoreDb = getFirestore(firebaseApp);
    firestoreFns = { collection, doc, addDoc, updateDoc, deleteDoc, setDoc };
    try { await enableIndexedDbPersistence(firestoreDb); } catch (e) {}

    await signInAnonymously(getAuth(firebaseApp));

    onSnapshot(collection(firestoreDb, 'expenses'), (snapshot) => {
      const shared = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      DATA.expenses = [...DATA.expenses.filter(e => !isSharedCategory(e.category)), ...shared];
      renderCurrentView();
    });
    onSnapshot(doc(firestoreDb, 'meta', 'budgets'), (snap) => {
      DATA.budgets = { ...DATA.budgets, ...(snap.exists() ? snap.data() : {}) };
      renderCurrentView();
    });
  } catch (e) {
    showToast('Could not connect to the shared house data');
  }
}
function addSharedExpense(record) {
  if (!firestoreFns) return;
  firestoreFns.addDoc(firestoreFns.collection(firestoreDb, 'expenses'), record)
    .catch(() => showToast('Could not save, check your connection'));
}
function updateSharedExpense(id, fields) {
  if (!firestoreFns) return;
  const { id: _drop, ...rest } = fields;
  firestoreFns.updateDoc(firestoreFns.doc(firestoreDb, 'expenses', id), rest)
    .catch(() => showToast('Could not save changes'));
}
function deleteSharedExpense(id) {
  if (!firestoreFns) return;
  firestoreFns.deleteDoc(firestoreFns.doc(firestoreDb, 'expenses', id))
    .catch(() => showToast('Could not delete'));
}
function saveSharedBudgets(values) {
  if (!firestoreFns) return;
  firestoreFns.setDoc(firestoreFns.doc(firestoreDb, 'meta', 'budgets'), values, { merge: true })
    .catch(() => showToast('Could not save budgets'));
}

function ringSVG(size, stroke, spent, budget) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = budget > 0 ? Math.min(spent / budget, 1) : (spent > 0 ? 1 : 0);
  const overFraction = budget > 0 ? Math.max(0, (spent - budget) / budget) : 0;
  const isOver = budget > 0 && spent > budget;
  const spentLen = circumference * pct;
  const spentColor = isOver ? COLORS.maroon : COLORS.clay;
  const cx = size / 2, cy = size / 2;

  let overflowRing = '';
  if (isOver) {
    const r2 = r + stroke * 0.85;
    const c2 = 2 * Math.PI * r2;
    const overLen = c2 * Math.min(overFraction, 1);
    overflowRing = `<circle cx="${cx}" cy="${cy}" r="${r2}" stroke="${COLORS.maroon}" stroke-width="${(stroke * 0.4).toFixed(1)}" fill="none" stroke-linecap="round" stroke-dasharray="${overLen.toFixed(1)} ${c2.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})" opacity="0.5"/>`;
  }

  const spentArc = spentLen > 0
    ? `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${spentColor}" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-dasharray="${spentLen.toFixed(1)} ${circumference.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`
    : '';

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke="${COLORS.sage}" stroke-width="${stroke}" fill="none"/>
    ${spentArc}
    ${overflowRing}
  </svg>`;
}
function ringHTML(size, stroke, spent, budget, centerHTML) {
  return `<div class="ring" style="width:${size}px;height:${size}px;">
    ${ringSVG(size, stroke, spent, budget)}
    <div class="ring-center" style="width:${size}px;height:${size}px;">${centerHTML}</div>
  </div>`;
}
function ringCenterHTML(spent, budget, size) {
  const isOver = budget > 0 && spent > budget;
  const diff = Math.abs(budget - spent);
  const amountSize = Math.round(size * 0.145);
  const subSize = Math.round(size * 0.065);
  return `
    <div class="ring-amount" style="font-size:${amountSize}px;">${euro(diff)}</div>
    <div class="ring-sub" style="font-size:${subSize}px;">${isOver ? 'over budget' : 'left of ' + euro(budget)}</div>
  `;
}
function categoryCenterHTML(cat) {
  return `<svg viewBox="0 0 24 24" class="cat-icon-ring"><path d="${cat.icon}"/></svg>`;
}

function parseQuickInput(text) {
  let working = ' ' + text.trim() + ' ';
  let date = todayISO();
  let amount = null;

  const dateMatch = working.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/);
  if (dateMatch) {
    const [full, dd, mm, yy] = dateMatch;
    const year = yy ? (yy.length === 2 ? 2000 + parseInt(yy, 10) : parseInt(yy, 10)) : new Date().getFullYear();
    const day = parseInt(dd, 10), month = parseInt(mm, 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      working = working.replace(full, ' ');
    }
  }

  let currency = DATA.lastCurrency || 'EUR';
  if (/\b(thb|baht)\b|฿/i.test(working)) currency = 'THB';
  else if (/\b(eur|euro)\b|€/i.test(working)) currency = 'EUR';

  const amountMatch = working.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:€|฿|eur|euro|thb|baht)?/i);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(',', '.'));
    working = working.replace(amountMatch[0], ' ');
  }
  working = working.replace(/\b(eur|euro|thb|baht)\b/gi, ' ').replace(/[€฿]/g, ' ');

  const note = working.replace(/\s+/g, ' ').trim();
  const lower = note.toLowerCase();
  let category = null;
  for (const cat of CATEGORIES) {
    if (cat.keywords.some(k => new RegExp(`\\b${k}\\b`, 'i').test(lower))) { category = cat.id; break; }
  }

  return { date, amount, note, category, currency };
}

function showView(name) {
  state.view = name;
  document.getElementById('view-dashboard').classList.toggle('hidden', name !== 'dashboard');
  document.getElementById('view-category').classList.toggle('hidden', name !== 'category');
  document.getElementById('view-analysis').classList.toggle('hidden', name !== 'analysis');
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.view === name));
  document.getElementById('fab-add').style.display = (name === 'category') ? 'none' : 'flex';
  window.scrollTo(0, 0);
}
function renderCurrentView() {
  if (state.view === 'dashboard') renderDashboard();
  else if (state.view === 'category') renderCategoryView();
  else if (state.view === 'analysis') renderAnalysis();
}
function openCategory(catId) {
  state.category = catId;
  showView('category');
  renderCategoryView();
}

function renderDashboard() {
  document.getElementById('month-label').textContent = monthLabel(state.month);
  const totalSpent = totalFor(expensesForMonth(state.month));
  const totalBudget = overallBudget();

  document.getElementById('overall-wheel').innerHTML =
    ringHTML(208, 18, totalSpent, totalBudget, ringCenterHTML(totalSpent, totalBudget, 208));

  const grid = document.getElementById('category-grid');
  grid.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const spent = totalFor(expensesForCategoryMonth(cat.id, state.month));
    const budget = budgetFor(cat.id);
    const over = budget > 0 && spent > budget;
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'category-card';
    card.innerHTML = `
      ${ringHTML(76, 8, spent, budget, categoryCenterHTML(cat))}
      <div class="cat-name">${cat.label}</div>
      <div class="cat-figure ${over ? 'over' : ''}">${euro(spent)} / ${euro(budget)}</div>
    `;
    card.addEventListener('click', () => openCategory(cat.id));
    grid.appendChild(card);
  });
}

function renderCategoryView() {
  const cat = CATEGORIES.find(c => c.id === state.category);
  document.getElementById('category-title').textContent = cat.label;
  const list = expensesForCategoryMonth(cat.id, state.month).sort((a, b) => b.date.localeCompare(a.date));
  const spent = totalFor(list);
  const budget = budgetFor(cat.id);

  document.getElementById('category-wheel').innerHTML =
    ringHTML(140, 14, spent, budget, ringCenterHTML(spent, budget, 140));

  const cardTotal = totalFor(list.filter(e => e.payment === 'card'));
  const cashTotal = totalFor(list.filter(e => e.payment === 'cash'));
  document.getElementById('payment-summary').innerHTML = `
    <div class="pay-stat"><strong>${euro(cardTotal)}</strong><span>Card</span></div>
    <div class="pay-stat"><strong>${euro(cashTotal)}</strong><span>Cash</span></div>
  `;

  document.getElementById('cat-add-date').value = todayISO();
  setActiveToggle('cat-add-currency', DATA.lastCurrency || 'EUR');
  setActiveToggle('cat-add-paidby', DATA.identity);

  const listEl = document.getElementById('category-expense-list');
  listEl.innerHTML = '';
  if (list.length === 0) {
    listEl.innerHTML = '<li class="empty-state">No expenses yet this month.</li>';
  } else {
    list.forEach(e => listEl.appendChild(expenseRowEl(e)));
  }
}

function expenseRowEl(e) {
  const li = document.createElement('li');
  li.className = 'expense-row';
  const payIcon = e.payment === 'cash' ? PAY_ICONS.cash : PAY_ICONS.card;
  const eurNote = e.currency === 'THB' ? `<div class="ex-eur-note">&asymp; ${euro(e.amountEUR)}</div>` : '';
  li.innerHTML = `
    <div class="ex-pay"><svg viewBox="0 0 24 24" class="icon"><path d="${payIcon}"/></svg></div>
    <div class="ex-main">
      <div class="ex-note">${escapeHTML(e.note)}</div>
      <div class="ex-date">${formatDateShort(e.date)}</div>
    </div>
    <div class="ex-amount-wrap">
      <div class="ex-amount">${formatMoney(e.amount, e.currency)}</div>
      ${eurNote}
    </div>
  `;
  li.addEventListener('click', () => openEditModal(e.id));
  return li;
}

function renderAnalysis() {
  const months = allMonthsWithData().slice(-6);
  const container = document.getElementById('analysis-content');

  if (months.length < 2) {
    container.innerHTML = `<div class="empty-state">Add another month of expenses and this page will start comparing your spending across months.</div>`;
    return;
  }

  const thisMonth = months[months.length - 1];
  const lastMonth = months[months.length - 2];

  const thisTotals = CATEGORIES.map(cat => ({ cat, spent: totalFor(expensesForCategoryMonth(cat.id, thisMonth)), budget: budgetFor(cat.id) }));
  const lastTotals = CATEGORIES.map(cat => ({ cat, spent: totalFor(expensesForCategoryMonth(cat.id, lastMonth)) }));

  const overList = thisTotals.filter(t => t.budget > 0 && t.spent > t.budget).sort((a, b) => (b.spent - b.budget) - (a.spent - a.budget));
  const underList = thisTotals.filter(t => t.budget > 0 && t.spent <= t.budget).sort((a, b) => (a.spent - a.budget) - (b.spent - b.budget));
  const overBudget = overList[0];
  const underBudget = underList[0];

  const deltas = thisTotals.map(t => ({ cat: t.cat, delta: t.spent - lastTotals.find(l => l.cat.id === t.cat.id).spent }));
  const biggestIncrease = deltas.slice().sort((a, b) => b.delta - a.delta)[0];
  const biggestDecrease = deltas.slice().sort((a, b) => a.delta - b.delta)[0];

  const insights = [];
  if (overBudget) insights.push({ up: true, text: `${overBudget.cat.label} went ${euro(overBudget.spent - overBudget.budget)} over budget this month.` });
  if (underBudget) insights.push({ up: false, text: `${underBudget.cat.label} stayed ${euro(underBudget.budget - underBudget.spent)} under budget this month.` });
  if (biggestIncrease && biggestIncrease.delta > 0) insights.push({ up: true, text: `${biggestIncrease.cat.label} is up ${euro(biggestIncrease.delta)} compared to ${monthLabel(lastMonth)}.` });
  if (biggestDecrease && biggestDecrease.delta < 0) insights.push({ up: false, text: `${biggestDecrease.cat.label} is down ${euro(Math.abs(biggestDecrease.delta))} compared to ${monthLabel(lastMonth)}, nice save.` });

  const insightsHTML = insights.map(i => `
    <li class="insight-row ${i.up ? 'up' : 'down'}">
      <svg viewBox="0 0 24 24" class="icon"><path d="${i.up ? 'M12 19V5M5 12l7-7 7 7' : 'M12 5v14M19 12l-7 7-7-7'}"/></svg>
      <span>${i.text}</span>
    </li>`).join('');

  container.innerHTML = `
    ${buildWhoPaidCard(thisMonth)}
    <ul class="insight-list">${insightsHTML}</ul>
    <div class="analysis-grid-wrap">${buildAnalysisGrid(months)}</div>
  `;
}

function buildWhoPaidCard(monthKey) {
  const sharedIds = new Set(CATEGORIES.filter(c => isSharedCategory(c.id)).map(c => c.id));
  const list = expensesForMonth(monthKey).filter(e => sharedIds.has(e.category));
  const totals = {};
  PEOPLE.forEach(p => { totals[p.id] = 0; });
  list.forEach(e => { totals[e.paidBy] = (totals[e.paidBy] || 0) + e.amountEUR; });
  const total = PEOPLE.reduce((sum, p) => sum + totals[p.id], 0);

  const segments = total > 0
    ? PEOPLE.map((p, i) => `<div class="who-paid-segment ${i === 0 ? 'a' : 'b'}" style="width:${((totals[p.id] / total) * 100).toFixed(1)}%;"></div>`).join('')
    : '<div class="who-paid-segment empty"></div>';

  const stats = PEOPLE.map((p, i) => `
    <div class="who-paid-stat"><span class="who-paid-dot ${i === 0 ? 'a' : 'b'}"></span>${p.label}: <strong>${euro(totals[p.id])}</strong></div>
  `).join('');

  return `
    <div class="who-paid-card">
      <h3>Who paid the house this month</h3>
      <div class="who-paid-bar">${segments}</div>
      <div class="who-paid-stats">${stats}</div>
    </div>
  `;
}

function buildAnalysisGrid(months) {
  const head = '<tr><th></th>' + months.map(m => `<th>${monthLabel(m).slice(0, 3)}</th>`).join('') + '</tr>';
  const rows = CATEGORIES.map(cat => {
    const budget = budgetFor(cat.id);
    const cells = months.map(m => {
      const spent = totalFor(expensesForCategoryMonth(cat.id, m));
      if (budget <= 0) return '<td class="cell cell-empty">&middot;</td>';
      const diff = spent - budget;
      let cls = 'cell-under';
      if (diff > budget * 0.5) cls = 'cell-over';
      else if (diff > 0) cls = 'cell-over-light';
      const label = diff > 0 ? `+${Math.round(diff)}` : Math.round(diff);
      return `<td class="cell ${cls}">${label}</td>`;
    }).join('');
    return `<tr><td class="row-label">${cat.label}</td>${cells}</tr>`;
  }).join('');
  return `<table class="analysis-grid">${head}${rows}</table>`;
}

function wireToggleGroup(id) {
  document.querySelectorAll(`#${id} .toggle-btn`).forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll(`#${id} .toggle-btn`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}
function setActiveToggle(id, value) {
  document.querySelectorAll(`#${id} .toggle-btn`).forEach(b => b.classList.toggle('active', b.dataset.value === value));
}
function getActiveToggle(id) {
  const el = document.querySelector(`#${id} .toggle-btn.active`) || document.querySelector(`#${id} .toggle-btn`);
  return el ? el.dataset.value : null;
}

function renderCategoryChips(containerId, selectedId) {
  const wrap = document.getElementById(containerId);
  wrap.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (cat.id === selectedId ? ' active' : '');
    chip.dataset.value = cat.id;
    chip.innerHTML = `<svg viewBox="0 0 24 24" class="icon"><path d="${cat.icon}"/></svg>${cat.label}`;
    chip.addEventListener('click', () => {
      wrap.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
    wrap.appendChild(chip);
  });
}
function getSelectedChip(containerId) {
  const active = document.querySelector(`#${containerId} .chip.active`);
  return active ? active.dataset.value : null;
}

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 2500);
}

function openQuickAdd() {
  document.getElementById('form-quick-add').reset();
  document.getElementById('quick-add-input').value = '';
  document.getElementById('quick-preview').textContent = '';
  document.getElementById('quick-date').value = todayISO();
  renderCategoryChips('quick-category-chips', null);
  setActiveToggle('quick-payment', 'card');
  setActiveToggle('quick-currency', DATA.lastCurrency || 'EUR');
  setActiveToggle('quick-paidby', DATA.identity);
  document.getElementById('modal-add').classList.remove('hidden');
  document.getElementById('quick-add-input').focus();
}
function closeQuickAdd() {
  document.getElementById('modal-add').classList.add('hidden');
}

function openEditModal(id) {
  const e = DATA.expenses.find(x => x.id === id);
  if (!e) return;
  state.editingId = id;
  document.getElementById('edit-note').value = e.note;
  document.getElementById('edit-amount').value = e.amount;
  document.getElementById('edit-date').value = e.date;
  renderCategoryChips('edit-category-chips', e.category);
  setActiveToggle('edit-payment', e.payment);
  setActiveToggle('edit-currency', e.currency);
  setActiveToggle('edit-paidby', e.paidBy || DATA.identity);
  document.getElementById('modal-edit').classList.remove('hidden');
}
function closeEditModal() {
  document.getElementById('modal-edit').classList.add('hidden');
  state.editingId = null;
}

function openBudgetsModal() {
  renderExchangeRateDisplay();
  const wrap = document.getElementById('budget-fields');
  wrap.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const row = document.createElement('div');
    row.className = 'budget-field';
    row.innerHTML = `
      <label for="budget-${cat.id}">${cat.label}</label>
      <input type="number" id="budget-${cat.id}" min="0" step="1" value="${budgetFor(cat.id) || ''}">
    `;
    wrap.appendChild(row);
  });
  document.getElementById('modal-budgets').classList.remove('hidden');
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

function showIdentitySetup() {
  document.getElementById('identity-setup').classList.remove('hidden');
  document.querySelectorAll('#identity-setup .identity-btn').forEach(btn => {
    btn.addEventListener('click', () => chooseIdentity(btn.dataset.value));
  });
}
function chooseIdentity(value) {
  DATA.identity = value;
  saveData();
  CATEGORIES = categoriesForIdentity(value);
  document.getElementById('identity-setup').classList.add('hidden');
  finishInit();
}

function init() {
  if (!DATA.identity) {
    showIdentitySetup();
    return;
  }
  finishInit();
}

function finishInit() {
  wireToggleGroup('cat-add-payment');
  wireToggleGroup('quick-payment');
  wireToggleGroup('edit-payment');
  wireToggleGroup('cat-add-currency');
  wireToggleGroup('quick-currency');
  wireToggleGroup('edit-currency');
  wireToggleGroup('cat-add-paidby');
  wireToggleGroup('quick-paidby');
  wireToggleGroup('edit-paidby');
  document.getElementById('cat-add-date').value = todayISO();

  document.getElementById('btn-back').addEventListener('click', () => { showView('dashboard'); renderDashboard(); });
  document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => { showView(btn.dataset.view); renderCurrentView(); }));
  document.getElementById('month-prev').addEventListener('click', () => { state.month = shiftMonth(state.month, -1); renderCurrentView(); });
  document.getElementById('month-next').addEventListener('click', () => { state.month = shiftMonth(state.month, 1); renderCurrentView(); });

  document.getElementById('fab-add').addEventListener('click', openQuickAdd);
  document.getElementById('btn-cancel-add').addEventListener('click', closeQuickAdd);
  document.getElementById('quick-add-input').addEventListener('input', (ev) => {
    const parsed = parseQuickInput(ev.target.value);
    document.getElementById('quick-note').value = parsed.note;
    if (parsed.amount != null) document.getElementById('quick-amount').value = parsed.amount;
    if (parsed.date) document.getElementById('quick-date').value = parsed.date;
    if (parsed.category) renderCategoryChips('quick-category-chips', parsed.category);
    setActiveToggle('quick-currency', parsed.currency);
    const cat = CATEGORIES.find(c => c.id === parsed.category);
    document.getElementById('quick-preview').textContent = parsed.amount != null
      ? `${formatMoney(parsed.amount, parsed.currency)} · ${cat ? cat.label : 'pick a category'} · ${formatDateShort(parsed.date)}`
      : '';
  });
  document.getElementById('form-quick-add').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const note = document.getElementById('quick-note').value.trim();
    const amount = parseFloat(document.getElementById('quick-amount').value);
    const date = document.getElementById('quick-date').value || todayISO();
    const category = getSelectedChip('quick-category-chips');
    const payment = getActiveToggle('quick-payment');
    const currency = getActiveToggle('quick-currency');
    const paidBy = getActiveToggle('quick-paidby');
    if (!note || isNaN(amount) || !category) { showToast('Add a note, amount and category first'); return; }
    addExpense({ note, amount, currency, date, category, payment, paidBy });
    closeQuickAdd();
    renderCurrentView();
    showToast(`Saved to ${CATEGORIES.find(c => c.id === category).label}`);
  });

  document.getElementById('form-category-add').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const note = document.getElementById('cat-add-note').value.trim();
    const amount = parseFloat(document.getElementById('cat-add-amount').value);
    const date = document.getElementById('cat-add-date').value || todayISO();
    const payment = getActiveToggle('cat-add-payment');
    const currency = getActiveToggle('cat-add-currency');
    const paidBy = getActiveToggle('cat-add-paidby');
    if (!note || isNaN(amount)) return;
    addExpense({ note, amount, currency, date, category: state.category, payment, paidBy });
    ev.target.reset();
    document.getElementById('cat-add-date').value = todayISO();
    setActiveToggle('cat-add-payment', 'card');
    setActiveToggle('cat-add-currency', currency);
    setActiveToggle('cat-add-paidby', DATA.identity);
    renderCategoryView();
    showToast(`Saved to ${CATEGORIES.find(c => c.id === state.category).label}`);
  });

  document.getElementById('form-edit').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const note = document.getElementById('edit-note').value.trim();
    const amount = parseFloat(document.getElementById('edit-amount').value);
    const date = document.getElementById('edit-date').value;
    const category = getSelectedChip('edit-category-chips');
    const payment = getActiveToggle('edit-payment');
    const currency = getActiveToggle('edit-currency');
    const paidBy = getActiveToggle('edit-paidby');
    if (!note || isNaN(amount) || !category) return;
    updateExpense(state.editingId, { note, amount, currency, date, category, payment, paidBy });
    closeEditModal();
    renderCurrentView();
    showToast('Updated');
  });
  document.getElementById('btn-delete-expense').addEventListener('click', () => {
    if (confirm('Delete this expense?')) {
      deleteExpense(state.editingId);
      closeEditModal();
      renderCurrentView();
      showToast('Deleted');
    }
  });

  document.getElementById('btn-settings').addEventListener('click', openBudgetsModal);
  document.getElementById('btn-close-budgets').addEventListener('click', () => document.getElementById('modal-budgets').classList.add('hidden'));
  document.getElementById('form-budgets').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const sharedValues = {};
    CATEGORIES.forEach(cat => {
      const value = parseFloat(document.getElementById(`budget-${cat.id}`).value) || 0;
      DATA.budgets[cat.id] = value;
      if (isSharedCategory(cat.id)) sharedValues[cat.id] = value;
    });
    if (FIREBASE_READY && Object.keys(sharedValues).length) saveSharedBudgets(sharedValues);
    saveData();
    document.getElementById('modal-budgets').classList.add('hidden');
    renderCurrentView();
    showToast('Budgets updated');
  });

  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.classList.add('hidden'); });
  });

  showView('dashboard');
  renderDashboard();
  if (!CATEGORIES.some(c => budgetFor(c.id) > 0)) openBudgetsModal();
  registerServiceWorker();
  refreshExchangeRate();
  startSharedSync();
}

document.addEventListener('DOMContentLoaded', init);
