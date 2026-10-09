const STORAGE_KEY = 'casa-expenses-v1';

const COLORS = {
  track: '#E6ECFB',
  spent: '#1D4ED8',
  over: '#0F2A5F',
};
// the ring on the blue home card: white on blue
const HERO_RING = { track: 'rgba(255,255,255,0.22)', spent: '#FFFFFF', over: '#FFFFFF' };

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

// The picture inside each category ring on the home screen: Phosphor duotone icons
// (MIT licence), kept here so they work offline. `tone` is the one colour a category owns.
const CATEGORY_ART = {
  bills: { tone: '#1D4ED8', art: '<path d="M216,116.69V216H152V152H104v64H40V116.69l82.34-82.35a8,8,0,0,1,11.32,0Z" opacity="0.2"/><path d="M240,208H224V136l2.34,2.34A8,8,0,0,0,237.66,127L139.31,28.68a16,16,0,0,0-22.62,0L18.34,127a8,8,0,0,0,11.32,11.31L32,136v72H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM48,120l80-80,80,80v88H160V152a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v56H48Zm96,88H112V160h32Z"/>' },
  transportation: { tone: '#0E8A6D', art: '<path d="M131,168H8a48,48,0,0,1,32-45.27V96h64Z" opacity="0.2"/><path d="M216,128a39.3,39.3,0,0,0-6.27.5L175.49,37.19A8,8,0,0,0,168,32H136a8,8,0,0,0,0,16h26.46l32.3,86.13a40.13,40.13,0,0,0-18,25.87H136.54l-25-66.81A8,8,0,0,0,104,88H24a8,8,0,0,0,0,16h8v13.39A56.12,56.12,0,0,0,0,168a8,8,0,0,0,8,8h8.8a40,40,0,0,0,78.4,0h81.6A40,40,0,1,0,216,128ZM56,192a24,24,0,0,1-22.62-16H78.62A24,24,0,0,1,56,192ZM16.81,160a40.07,40.07,0,0,1,25.86-29.73A8,8,0,0,0,48,122.73V104H98.46l21,56ZM216,192a24,24,0,0,1-15.43-42.36l7.94,21.17a8,8,0,0,0,15-5.62L215.55,144H216a24,24,0,0,1,0,48Z"/>' },
  grocery: { tone: '#C2700A', art: '<path d="M224,64l-12.16,66.86A16,16,0,0,1,196.1,144H70.55L56,64Z" opacity="0.2"/><path d="M230.14,58.87A8,8,0,0,0,224,56H62.68L56.6,22.57A8,8,0,0,0,48.73,16H24a8,8,0,0,0,0,16h18L67.56,172.29a24,24,0,0,0,5.33,11.27,28,28,0,1,0,44.4,8.44h45.42A27.75,27.75,0,0,0,160,204a28,28,0,1,0,28-28H91.17a8,8,0,0,1-7.87-6.57L80.13,152h116a24,24,0,0,0,23.61-19.71l12.16-66.86A8,8,0,0,0,230.14,58.87ZM104,204a12,12,0,1,1-12-12A12,12,0,0,1,104,204Zm96,0a12,12,0,1,1-12-12A12,12,0,0,1,200,204Zm4-74.57A8,8,0,0,1,196.1,136H77.22L65.59,72H214.41Z"/>' },
  dining: { tone: '#C2416B', art: '<path d="M208,40V168H152S152,64,208,40Z" opacity="0.2"/><path d="M72,88V40a8,8,0,0,1,16,0V88a8,8,0,0,1-16,0ZM216,40V224a8,8,0,0,1-16,0V176H152a8,8,0,0,1-8-8,268.75,268.75,0,0,1,7.22-56.88c9.78-40.49,28.32-67.63,53.63-78.47A8,8,0,0,1,216,40ZM200,53.9c-32.17,24.57-38.47,84.42-39.7,106.1H200ZM119.89,38.69a8,8,0,1,0-15.78,2.63L112,88.63a32,32,0,0,1-64,0l7.88-47.31a8,8,0,1,0-15.78-2.63l-8,48A8.17,8.17,0,0,0,32,88a48.07,48.07,0,0,0,40,47.32V224a8,8,0,0,0,16,0V135.32A48.07,48.07,0,0,0,128,88a8.17,8.17,0,0,0-.11-1.31Z"/>' },
  debora: { tone: '#6B4BD6', art: '<path d="M194.82,151.43l-55.09,20.3-20.3,55.09a7.92,7.92,0,0,1-14.86,0l-20.3-55.09-55.09-20.3a7.92,7.92,0,0,1,0-14.86l55.09-20.3,20.3-55.09a7.92,7.92,0,0,1,14.86,0l20.3,55.09,55.09,20.3A7.92,7.92,0,0,1,194.82,151.43Z" opacity="0.2"/><path d="M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z"/>' },
  extra: { tone: '#0C7FA8', art: '<path d="M208,128v72a8,8,0,0,1-8,8H56a8,8,0,0,1-8-8V128Z" opacity="0.2"/><path d="M216,72H180.92c.39-.33.79-.65,1.17-1A29.53,29.53,0,0,0,192,49.57,32.62,32.62,0,0,0,158.44,16,29.53,29.53,0,0,0,137,25.91a54.94,54.94,0,0,0-9,14.48,54.94,54.94,0,0,0-9-14.48A29.53,29.53,0,0,0,97.56,16,32.62,32.62,0,0,0,64,49.57,29.53,29.53,0,0,0,73.91,71c.38.33.78.65,1.17,1H40A16,16,0,0,0,24,88v32a16,16,0,0,0,16,16v64a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V136a16,16,0,0,0,16-16V88A16,16,0,0,0,216,72ZM149,36.51a13.69,13.69,0,0,1,10-4.5h.49A16.62,16.62,0,0,1,176,49.08a13.69,13.69,0,0,1-4.5,10c-9.49,8.4-25.24,11.36-35,12.4C137.7,60.89,141,45.5,149,36.51Zm-64.09.36A16.63,16.63,0,0,1,96.59,32h.49a13.69,13.69,0,0,1,10,4.5c8.39,9.48,11.35,25.2,12.39,34.92-9.72-1-25.44-4-34.92-12.39a13.69,13.69,0,0,1-4.5-10A16.6,16.6,0,0,1,84.87,36.87ZM40,88h80v32H40Zm16,48h64v64H56Zm144,64H136V136h64Zm16-80H136V88h80v32Z"/>' },
};

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
const state = { view: 'dashboard', month: currentMonthKey(), category: null, moment: null, momentFrom: 'moments', editingId: null, displayCurrency: 'EUR', todayOpen: false };

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { expenses: [], budgets: {}, exchangeRate: null, lastCurrency: 'EUR', identity: null, loans: [], voiceLang: null, moments: [], dismissedRuns: [] };
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
      loans: parsed.loans || [],
      voiceLang: parsed.voiceLang || null,
      moments: parsed.moments || [],
      dismissedRuns: parsed.dismissedRuns || [],
    };
  } catch (e) {
    return { expenses: [], budgets: {}, exchangeRate: null, lastCurrency: 'EUR', identity: null, loans: [], voiceLang: null, moments: [], dismissedRuns: [] };
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
// The month as shown in the home top bar: the name alone in the year we are in,
// a short name with the year otherwise, so the bar keeps room for 44 point buttons.
function monthLabelShort(key) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  if (y === new Date().getFullYear()) return d.toLocaleDateString('en-GB', { month: 'long' });
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
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
// One number style for both currencies: comma decimals and the sign after the figure,
// so "420,00 ฿" sits under or beside "11,15 €" and the two are easy to compare.
function baht(n) {
  try {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'THB', currencyDisplay: 'narrowSymbol' }).format(n || 0);
  } catch (e) {
    // a browser too old for the narrow sign: same figure, sign added by hand
    return new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0) + '\u00a0฿';
  }
}
function formatMoney(amount, currency) {
  return currency === 'THB' ? baht(amount) : euro(amount);
}
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function displayAmount(eur) {
  if (state.displayCurrency === 'THB') return formatMoney((eur || 0) * currentRate(), 'THB');
  return euro(eur);
}
function updateCurrencyPills() {
  const isThb = state.displayCurrency === 'THB';
  document.querySelectorAll('.currency-pill').forEach(pill => {
    pill.textContent = isThb ? '฿ THB' : '€ EUR';
    pill.classList.toggle('active-thb', isThb);
  });
}
function toggleDisplayCurrency() {
  state.displayCurrency = state.displayCurrency === 'EUR' ? 'THB' : 'EUR';
  updateCurrencyPills();
  renderCurrentView();
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
    <div class="rate-text">1 € = ${baht(r.rate)}<span class="rate-updated">${r.updatedAt ? timeAgo(r.updatedAt) : 'estimated, not yet updated'}</span></div>
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
  // house budget only: the personal Debora category never counts in the overall wheel
  return CATEGORIES.filter(c => isSharedCategory(c.id)).reduce((sum, c) => sum + budgetFor(c.id), 0);
}
// House spending only: the personal category never counts in a house total.
function sharedExpensesOn(iso) {
  return DATA.expenses.filter(e => e.date === iso && isSharedCategory(e.category));
}
// Which day opens the week on this phone: 1 is Monday, 7 is Sunday. Read from the
// phone's language and region where the browser offers it, Monday otherwise.
function firstDayOfWeek() {
  try {
    const loc = new Intl.Locale((typeof navigator !== 'undefined' && navigator.language) || 'en-GB');
    const info = typeof loc.getWeekInfo === 'function' ? loc.getWeekInfo() : loc.weekInfo;
    if (info && info.firstDay >= 1 && info.firstDay <= 7) return info.firstDay;
  } catch (e) { /* older browsers: fall through */ }
  return 1;
}
// The week we are in on the local calendar, from its first day to its last. Days
// still to come are marked and hold no total. Pinned to midday so a clock change
// can never move a date.
function currentWeek(firstDay = firstDayOfWeek()) {
  const now = new Date();
  const todayIso = todayISO();
  const back = (now.getDay() - (firstDay % 7) + 7) % 7; // days since the week began
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back + i, 12);
    const iso = isoFromParts(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const isFuture = iso > todayIso;
    days.push({ iso, letter: d.toLocaleDateString('en-GB', { weekday: 'narrow' }), isToday: iso === todayIso, isFuture, total: isFuture ? 0 : totalFor(sharedExpensesOn(iso)) });
  }
  return days;
}
// The average spent per day in a month: the total divided by the days lived so far.
// Today counts as a day. A past month uses all its days, a month still to come has none.
function monthPace(monthKey, spent) {
  const [y, m] = monthKey.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  const current = currentMonthKey();
  const isCurrent = monthKey === current;
  const daysSoFar = isCurrent ? new Date().getDate() : (monthKey < current ? days : 0);
  return { isCurrent, days, daysSoFar, averagePerDay: daysSoFar > 0 ? spent / daysSoFar : null };
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
  noticeMomentJoin(record);
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
      maybeAskAboutTrip(); // the expenses only exist now, not when finishInit ran
    });
    onSnapshot(doc(firestoreDb, 'meta', 'budgets'), (snap) => {
      DATA.budgets = { ...DATA.budgets, ...(snap.exists() ? snap.data() : {}) };
      renderCurrentView();
    });
    onSnapshot(collection(firestoreDb, 'loans'), (snapshot) => {
      DATA.loans = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (state.view === 'loans') renderLoans();
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
function addLoan({ from, to, amount, currency, note, date }) {
  const record = { from, to, amount, currency, amountEUR: toEUR(amount, currency), note, date, settled: false, settledDate: null };
  if (FIREBASE_READY && firestoreFns) {
    firestoreFns.addDoc(firestoreFns.collection(firestoreDb, 'loans'), record)
      .catch(() => showToast('Could not save loan'));
  } else {
    record.id = 'l' + Date.now() + Math.random().toString(36).slice(2, 6);
    DATA.loans.push(record);
    saveData();
    renderLoans();
  }
}
function settleLoan(id) {
  if (FIREBASE_READY && firestoreFns) {
    firestoreFns.updateDoc(firestoreFns.doc(firestoreDb, 'loans', id), { settled: true, settledDate: todayISO() })
      .then(() => showToast('All square! ✓'))
      .catch(() => showToast('Could not update'));
  } else {
    const loan = DATA.loans.find(l => l.id === id);
    if (loan) { loan.settled = true; loan.settledDate = todayISO(); }
    saveData();
    showToast('All square! ✓');
    renderLoans();
  }
}
function renderLoans() {
  const container = document.getElementById('loans-content');
  if (!container) return;
  const all = DATA.loans || [];
  const active = all.filter(l => !l.settled).sort((a, b) => b.date.localeCompare(a.date));
  const settled = all.filter(l => l.settled).sort((a, b) => (b.settledDate || '').localeCompare(a.settledDate || ''));

  const loanCardHTML = (l) => {
    const fromName = DATA.identity === l.from ? 'You' : PEOPLE.find(p => p.id === l.from)?.label || l.from;
    const toName = DATA.identity === l.to ? 'you' : PEOPLE.find(p => p.id === l.to)?.label || l.to;
    const summary = l.settled
      ? `${fromName} paid · settled ${l.settledDate ? formatDateShort(l.settledDate) : ''}`
      : `${fromName} paid · ${toName} owe${DATA.identity === l.to ? '' : 's'}`;
    return `<div class="loan-card ${l.settled ? 'settled' : ''}">
      <div class="loan-note">${escapeHTML(l.note)}</div>
      <div class="loan-date">${formatDateShort(l.date)}</div>
      <div class="loan-summary">${summary}</div>
      <div class="loan-amount">${displayAmount(l.amountEUR)}</div>
      ${!l.settled ? `<button class="btn-settle" data-loan-id="${l.id}">Settled ✓</button>` : ''}
    </div>`;
  };

  const activeHTML = active.length
    ? active.map(loanCardHTML).join('')
    : '<div class="empty-state">No open loans between you right now.</div>';

  const settledHTML = settled.length ? `
    <div class="loans-section-title" style="margin-top:20px;">
      <button class="settled-toggle" id="btn-toggle-settled">Done (${settled.length}) ▾</button>
    </div>
    <div class="settled-list hidden" id="settled-list">${settled.map(loanCardHTML).join('')}</div>
  ` : '';

  container.innerHTML = activeHTML + settledHTML;

  container.querySelectorAll('.btn-settle').forEach(btn => {
    btn.addEventListener('click', () => settleLoan(btn.dataset.loanId));
  });
  const toggleBtn = container.querySelector('#btn-toggle-settled');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const list = document.getElementById('settled-list');
      list.classList.toggle('hidden');
      toggleBtn.textContent = list.classList.contains('hidden') ? `Done (${settled.length}) ▾` : `Done (${settled.length}) ▴`;
    });
  }
}

function ringSVG(size, stroke, spent, budget, palette = COLORS) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = budget > 0 ? Math.min(spent / budget, 1) : (spent > 0 ? 1 : 0);
  const overFraction = budget > 0 ? Math.max(0, (spent - budget) / budget) : 0;
  const isOver = budget > 0 && spent > budget;
  const spentLen = circumference * pct;
  const spentColor = isOver ? palette.over : palette.spent;
  const cx = size / 2, cy = size / 2;

  let overflowRing = '';
  if (isOver) {
    const r2 = r + stroke * 0.85;
    const c2 = 2 * Math.PI * r2;
    const overLen = c2 * Math.min(overFraction, 1);
    overflowRing = `<circle cx="${cx}" cy="${cy}" r="${r2}" stroke="${palette.over}" stroke-width="${(stroke * 0.4).toFixed(1)}" fill="none" stroke-linecap="round" stroke-dasharray="${overLen.toFixed(1)} ${c2.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})" opacity="0.5"/>`;
  }

  const spentArc = spentLen > 0
    ? `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${spentColor}" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-dasharray="${spentLen.toFixed(1)} ${circumference.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>`
    : '';

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke="${palette.track}" stroke-width="${stroke}" fill="none"/>
    ${spentArc}
    ${overflowRing}
  </svg>`;
}
function ringHTML(size, stroke, spent, budget, centerHTML, palette = COLORS) {
  return `<div class="ring" style="width:${size}px;height:${size}px;">
    ${ringSVG(size, stroke, spent, budget, palette)}
    <div class="ring-center" style="width:${size}px;height:${size}px;">${centerHTML}</div>
  </div>`;
}
function ringCenterHTML(spent, budget, size) {
  const isOver = budget > 0 && spent > budget;
  const amountSize = Math.round(size * 0.145);
  const subSize = Math.round(size * 0.065);
  let sub;
  if (isOver) sub = `${displayAmount(spent - budget)} over budget`;
  else if (budget > 0) sub = `spent of ${displayAmount(budget)}`;
  else sub = 'spent this month';
  return `
    <div class="ring-amount" style="font-size:${amountSize}px;">${displayAmount(spent)}</div>
    <div class="ring-sub" style="font-size:${subSize}px;">${sub}</div>
  `;
}

// A category without its own picture (none today) falls back to its line icon.
function categoryArtHTML(cat) {
  const art = CATEGORY_ART[cat.id];
  if (!art) return `<svg viewBox="0 0 24 24" class="cat-art line"><path d="${cat.icon}"/></svg>`;
  return `<svg viewBox="0 0 256 256" class="cat-art" style="color:${art.tone}" fill="currentColor" aria-hidden="true">${art.art}</svg>`;
}

const MONTH_WORDS = {
  gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6, luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12,
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};
const MONTH_NAMES_RE = Object.keys(MONTH_WORDS).join('|');

function isoFromParts(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseQuickInput(text) {
  let working = ' ' + text.trim() + ' ';
  let date = todayISO();
  let amount = null;

  const relMatch = working.match(/\b(ieri|oggi|l'altro ieri|altroieri|yesterday|today)\b/i);
  if (relMatch) {
    const word = relMatch[1].toLowerCase();
    const d = new Date();
    if (word === 'ieri' || word === 'yesterday') d.setDate(d.getDate() - 1);
    else if (word !== 'oggi' && word !== 'today') d.setDate(d.getDate() - 2);
    date = isoFromParts(d.getFullYear(), d.getMonth() + 1, d.getDate());
    working = working.replace(relMatch[0], ' ');
  }

  // spoken dates: "il 22 settembre" / "22nd of september" (day first) or "september 22" (month first)
  let wordDateMatch = working.match(new RegExp(`\\b(?:il\\s+|on\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_NAMES_RE})\\b`, 'i'));
  let wdDay = null, wdMonth = null;
  if (wordDateMatch) {
    wdDay = parseInt(wordDateMatch[1], 10);
    wdMonth = MONTH_WORDS[wordDateMatch[2].toLowerCase()];
  } else {
    wordDateMatch = working.match(new RegExp(`\\b(?:on\\s+)?(${MONTH_NAMES_RE})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i'));
    if (wordDateMatch) {
      wdDay = parseInt(wordDateMatch[2], 10);
      wdMonth = MONTH_WORDS[wordDateMatch[1].toLowerCase()];
    }
  }
  if (wordDateMatch && wdDay >= 1 && wdDay <= 31) {
    date = isoFromParts(new Date().getFullYear(), wdMonth, wdDay);
    working = working.replace(wordDateMatch[0], ' ');
  }

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
  if (/\b(thb|baht|bath)\b|฿/i.test(working)) currency = 'THB';
  else if (/\b(eur|euros|euro)\b|€/i.test(working)) currency = 'EUR';

  const amountMatch = working.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:€|฿|euros|euro|eur|baht|bath|thb)?/i);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(',', '.'));
    working = working.replace(amountMatch[0], ' ');
  }
  working = working.replace(/\b(euros|euro|eur|baht|bath|thb)\b/gi, ' ').replace(/[€฿]/g, ' ');

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
  document.getElementById('view-moment').classList.toggle('hidden', name !== 'moment');
  document.getElementById('view-moments').classList.toggle('hidden', name !== 'moments');
  document.getElementById('view-analysis').classList.toggle('hidden', name !== 'analysis');
  document.getElementById('view-loans').classList.toggle('hidden', name !== 'loans');
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.view === name));
  document.getElementById('fab-add').style.display = (name === 'category' || name === 'moment') ? 'none' : 'flex';
  window.scrollTo(0, 0);
  updateCurrencyPills();
}
function renderCurrentView() {
  if (state.view === 'dashboard') renderDashboard();
  else if (state.view === 'category') renderCategoryView();
  else if (state.view === 'moment') renderMomentView();
  else if (state.view === 'moments') renderMomentsList();
  else if (state.view === 'analysis') renderAnalysis();
  else if (state.view === 'loans') renderLoans();
}
function openCategory(catId) {
  state.category = catId;
  showView('category');
  renderCategoryView();
}

function renderDashboard() {
  document.getElementById('month-label').textContent = monthLabelShort(state.month);
  const totalSpent = totalFor(expensesForMonth(state.month).filter(e => isSharedCategory(e.category)));
  const totalBudget = overallBudget();
  const pace = monthPace(state.month, totalSpent);
  const isOver = totalBudget > 0 && totalSpent > totalBudget;
  const pctText = totalBudget > 0 ? Math.round(totalSpent / totalBudget * 100) + '%' : '';

  const heroAmount = displayAmount(totalSpent);
  const hero = document.getElementById('overall-wheel');
  // the card is one button, so its spoken label has to carry the numbers it shows
  const leftLabel = isOver ? 'Over the budget' : 'Left from the budget';
  const leftAmount = displayAmount(Math.abs(totalBudget - totalSpent));
  const spoken = [`Spent in ${monthLabel(state.month)}: ${heroAmount}${pctText ? `, ${pctText} of the budget` : ''}`];
  if (totalBudget > 0) spoken.push(`${leftLabel}: ${leftAmount}`);
  if (pace.averagePerDay !== null) spoken.push(`Average per day: ${displayAmount(pace.averagePerDay)}`);
  hero.setAttribute('aria-label', spoken.join('. ') + '. Opens the spending breakdown.');
  hero.innerHTML = `
    <div class="hero-top">
      <div class="hero-amount ${heroAmount.length > 8 ? 'long' : ''}">${heroAmount}</div>
      ${ringHTML(88, 9, totalSpent, totalBudget, `<div class="hero-pct">${pctText}</div>`, HERO_RING)}
    </div>
    <div class="hero-stats">
      ${totalBudget > 0 ? `<div><span class="hero-label">${leftLabel}</span><strong>${leftAmount}</strong></div>` : ''}
      ${pace.averagePerDay !== null ? `<div><span class="hero-label">Average per day</span><strong>${displayAmount(pace.averagePerDay)}</strong></div>` : ''}
    </div>
  `;

  // today only means something in the month we are in
  const todayCard = document.getElementById('today-card');
  todayCard.classList.toggle('hidden', !pace.isCurrent);
  if (pace.isCurrent) renderTodayCard(todayCard);

  const grid = document.getElementById('category-grid');
  grid.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const spent = totalFor(expensesForCategoryMonth(cat.id, state.month));
    const budget = budgetFor(cat.id);
    const over = budget > 0 && spent > budget;
    const amount = displayAmount(spent);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'category-card';
    card.innerHTML = `
      <div class="cat-top">
        ${ringHTML(56, 6, spent, budget, categoryArtHTML(cat))}
        <div class="cat-amount ${amount.length > 8 ? 'long' : ''}">${amount}${over ? `<span>${displayAmount(spent - budget)} over</span>` : ''}</div>
      </div>
      <div class="cat-name">${cat.label}</div>
    `;
    card.addEventListener('click', () => openCategory(cat.id));
    grid.appendChild(card);
  });

  if (typeof isSearching === 'function' && isSearching()) renderSearch();
}

// A day with spending is always clearly taller than an empty day, so a cheap day
// and a day with nothing never look the same next to one large bill.
function barHeight(day, max) {
  if (day.isFuture || day.total <= 0) return 3;
  return Math.max(9, Math.round(day.total / max * 32));
}
// Today's house spending and this week as bars. The entries stay folded away until
// the line under the total is tapped, so a busy day never pushes the categories down.
function renderTodayCard(card) {
  const list = sharedExpensesOn(todayISO());
  const total = totalFor(list);
  const week = currentWeek();
  const max = Math.max(...week.map(d => d.total), 1);
  const open = state.todayOpen && list.length > 0;
  const countLabel = `${open ? 'Hide' : 'See'} ${list.length === 1 ? '1 expense' : `the ${list.length} expenses`}`;
  card.innerHTML = `
    <div class="today-head">
      <div>
        <h2 class="today-title"><i></i>Today</h2>
        <div class="today-amount">${displayAmount(total)}</div>
      </div>
      <div class="week-bars" role="img" aria-label="House spending this week, day by day">
        ${week.map(d => `<div class="${d.isToday ? 'now' : d.isFuture ? 'off' : ''}"><i style="height:${barHeight(d, max)}px"></i><span>${d.letter}</span></div>`).join('')}
      </div>
    </div>
    ${list.length === 0
      ? '<p class="today-empty">Nothing spent for the house today.</p>'
      : `<button type="button" class="today-toggle" aria-expanded="${open}">
          <span>${countLabel}</span>
          <svg viewBox="0 0 24 24" class="icon"><path d="${open ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'}"/></svg>
        </button>`}
    <ul class="today-list${open ? '' : ' hidden'}"></ul>
  `;
  const toggle = card.querySelector('.today-toggle');
  if (toggle) toggle.addEventListener('click', () => { state.todayOpen = !state.todayOpen; renderTodayCard(card); });
  if (open) {
    const listEl = card.querySelector('.today-list');
    list.forEach(e => listEl.appendChild(todayRowEl(e)));
  }
}
function todayRowEl(e) {
  const li = document.createElement('li');
  li.className = 'today-row';
  const cat = ALL_CATEGORIES.find(c => c.id === e.category);
  const eurNote = e.currency === 'THB' ? `<small>&asymp; ${euro(e.amountEUR)}</small>` : '';
  // a real button, so it is announced and focusable, not only tappable
  li.innerHTML = `
    <button type="button">
      <span class="today-note">${escapeHTML(e.note)}<small>${cat ? cat.label : ''}</small></span>
      <strong>${formatMoney(e.amount, e.currency)}${eurNote}</strong>
      <svg viewBox="0 0 24 24" class="icon today-chevron" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
    </button>
  `;
  const btn = li.querySelector('button');
  // The spoken label is set as an attribute value, never written into the markup:
  // escapeHTML does not escape quotes, so a note with a quote would break out of it.
  const spoken = ['Edit ' + e.note, cat ? cat.label : '', formatMoney(e.amount, e.currency)];
  if (e.currency === 'THB') spoken.push('about ' + euro(e.amountEUR));
  btn.setAttribute('aria-label', spoken.filter(Boolean).join(', '));
  btn.addEventListener('click', () => openEditModal(e.id));
  return li;
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
    <div class="pay-stat"><strong>${displayAmount(cardTotal)}</strong><span>Card</span></div>
    <div class="pay-stat"><strong>${displayAmount(cashTotal)}</strong><span>Cash</span></div>
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
  // always shown, independent of how much month-over-month history exists
  const whoPaidHTML = buildWhoPaidCard(currentMonthKey());

  if (months.length < 2) {
    container.innerHTML = `
      ${whoPaidHTML}
      <div class="empty-state">Add another month of expenses and this page will start comparing your spending across months.</div>
    `;
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
    ${whoPaidHTML}
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

function buildSpendSummaryHTML(monthKey) {
  const rows = CATEGORIES.filter(c => isSharedCategory(c.id)).map(cat => {
    const list = expensesForCategoryMonth(cat.id, monthKey);
    const spent = totalFor(list);
    const byPerson = {};
    PEOPLE.forEach(p => { byPerson[p.id] = 0; });
    list.forEach(e => { byPerson[e.paidBy] = (byPerson[e.paidBy] || 0) + e.amountEUR; });
    const split = PEOPLE.map(p => `${p.label} ${displayAmount(byPerson[p.id])}`).join(' &middot; ');
    return `
      <div class="summary-row">
        <div class="summary-row-top">
          <span class="summary-row-label"><svg viewBox="0 0 24 24" class="icon"><path d="${cat.icon}"/></svg>${cat.label}</span>
          <span class="summary-row-amount">${displayAmount(spent)}</span>
        </div>
        <div class="summary-row-split">${split}</div>
      </div>
    `;
  }).join('');

  return `${buildWhoPaidCard(monthKey)}<div class="summary-list">${rows}</div>`;
}

function openSpendSummary() {
  document.getElementById('spend-summary-title').textContent = `Spending breakdown — ${monthLabel(state.month)}`;
  document.getElementById('spend-summary-content').innerHTML = buildSpendSummaryHTML(state.month);
  document.getElementById('modal-spend-summary').classList.remove('hidden');
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

function applyParsedToQuickForm(text) {
  const parsed = parseQuickInput(text);
  document.getElementById('quick-note').value = parsed.note;
  if (parsed.amount != null) document.getElementById('quick-amount').value = parsed.amount;
  if (parsed.date) document.getElementById('quick-date').value = parsed.date;
  if (parsed.category) renderCategoryChips('quick-category-chips', parsed.category);
  setActiveToggle('quick-currency', parsed.currency);
  const cat = CATEGORIES.find(c => c.id === parsed.category);
  document.getElementById('quick-preview').textContent = parsed.amount != null
    ? `${formatMoney(parsed.amount, parsed.currency)} · ${cat ? cat.label : 'pick a category'} · ${formatDateShort(parsed.date)}`
    : '';
}

let recognition = null;
let listening = false;

function voiceLang() {
  // first time: Italian on Debora's phone, English on Victor's; the pill remembers any change
  return DATA.voiceLang || (DATA.identity === 'victor' ? 'en-US' : 'it-IT');
}

function setListening(on) {
  listening = on;
  document.getElementById('btn-voice').classList.toggle('listening', on);
  document.getElementById('quick-add-input').placeholder = on
    ? (voiceLang() === 'it-IT' ? 'Ti ascolto…' : 'Listening…')
    : 'e.g. gasoline 15 22/09';
}

function updateLangPill() {
  document.getElementById('btn-voice-lang').textContent = voiceLang() === 'it-IT' ? 'IT' : 'EN';
}

function setupVoice() {
  const btn = document.getElementById('btn-voice');
  const langBtn = document.getElementById('btn-voice-lang');
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { btn.style.display = 'none'; langBtn.style.display = 'none'; return; }

  updateLangPill();
  langBtn.addEventListener('click', () => {
    DATA.voiceLang = voiceLang() === 'it-IT' ? 'en-US' : 'it-IT';
    saveData();
    updateLangPill();
    if (listening) recognition.stop();
  });

  recognition = new SR();
  recognition.lang = voiceLang();
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.addEventListener('result', (ev) => {
    let transcript = '';
    for (const res of ev.results) transcript += res[0].transcript;
    transcript = transcript.trim();
    document.getElementById('quick-add-input').value = transcript;
    applyParsedToQuickForm(transcript);
  });
  recognition.addEventListener('end', () => setListening(false));
  recognition.addEventListener('error', (ev) => {
    setListening(false);
    if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
      showToast('Allow microphone access to dictate expenses');
    } else if (ev.error === 'no-speech') {
      showToast('Could not hear anything, try again');
    }
  });

  btn.addEventListener('click', () => {
    if (listening) { recognition.stop(); return; }
    document.getElementById('quick-add-input').blur();
    recognition.lang = voiceLang();
    try { recognition.start(); setListening(true); } catch (e) {}
  });
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
  if (listening && recognition) recognition.stop();
  document.getElementById('modal-add').classList.add('hidden');
}

function openLoanModal() {
  const fromWrap = document.getElementById('loan-from-chips');
  fromWrap.innerHTML = '';
  PEOPLE.forEach(p => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (p.id === DATA.identity ? ' active' : '');
    chip.dataset.value = p.id;
    chip.textContent = p.label;
    chip.addEventListener('click', () => {
      fromWrap.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
    fromWrap.appendChild(chip);
  });
  document.getElementById('loan-note').value = '';
  document.getElementById('loan-amount').value = '';
  document.getElementById('loan-date').value = todayISO();
  setActiveToggle('loan-currency', DATA.lastCurrency || 'EUR');
  document.getElementById('modal-add-loan').classList.remove('hidden');
  document.getElementById('loan-note').focus();
}
function closeLoanModal() {
  document.getElementById('modal-add-loan').classList.add('hidden');
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
  if (!('serviceWorker' in navigator)) return;

  // A home screen PWA on iOS often resumes from a snapshot instead of reloading, so
  // a deployed change can sit there for days: the new worker installs but the page
  // on screen keeps its old HTML. Reloading once the new worker takes control makes
  // the app pick up its own updates without anyone force quitting anything.
  let reloadingForUpdate = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadingForUpdate) return;
    reloadingForUpdate = true;
    window.location.reload();
  });

  navigator.serviceWorker.register('sw.js')
    .then(reg => { reg.update().catch(() => {}); })
    .catch(() => {});
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
  wireToggleGroup('loan-currency');
  document.getElementById('cat-add-date').value = todayISO();

  document.querySelectorAll('.currency-pill').forEach(pill => pill.addEventListener('click', toggleDisplayCurrency));
  updateCurrencyPills();

  document.getElementById('btn-back').addEventListener('click', () => { showView('dashboard'); renderDashboard(); });
  document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => { showView(btn.dataset.view); renderCurrentView(); }));
  document.getElementById('month-prev').addEventListener('click', () => { state.month = shiftMonth(state.month, -1); renderCurrentView(); });
  document.getElementById('month-next').addEventListener('click', () => { state.month = shiftMonth(state.month, 1); renderCurrentView(); });

  document.getElementById('fab-add').addEventListener('click', () => {
    if (state.view === 'loans') openLoanModal();
    else openQuickAdd();
  });
  document.getElementById('btn-cancel-add').addEventListener('click', closeQuickAdd);
  document.getElementById('btn-cancel-loan').addEventListener('click', closeLoanModal);
  document.getElementById('form-add-loan').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const from = document.querySelector('#loan-from-chips .chip.active')?.dataset.value;
    const note = document.getElementById('loan-note').value.trim();
    const amount = parseFloat(document.getElementById('loan-amount').value);
    const currency = getActiveToggle('loan-currency');
    const date = document.getElementById('loan-date').value || todayISO();
    if (!from || !note || isNaN(amount)) { showToast('Fill in who paid, what for, and the amount'); return; }
    const to = PEOPLE.find(p => p.id !== from)?.id;
    addLoan({ from, to, amount, currency, note, date });
    closeLoanModal();
    showToast(`Loan saved`);
  });
  document.getElementById('quick-add-input').addEventListener('input', (ev) => {
    applyParsedToQuickForm(ev.target.value);
  });
  setupVoice();
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

  document.getElementById('overall-wheel').addEventListener('click', openSpendSummary);
  document.getElementById('overall-wheel').addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openSpendSummary(); }
  });
  document.getElementById('btn-close-spend-summary').addEventListener('click', () => document.getElementById('modal-spend-summary').classList.add('hidden'));
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

  wireMoments();
  wireSearch();

  // An iPhone home screen app resumes without reloading, so "today" can go stale
  // overnight. When the app comes back on a new day, draw the screen again, and
  // follow the calendar into the new month if it was showing the current one.
  let seenDay = todayISO();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || seenDay === todayISO()) return;
    if (state.month === seenDay.slice(0, 7)) state.month = currentMonthKey();
    seenDay = todayISO();
    renderCurrentView();
  });

  showView('dashboard');
  renderDashboard();
  if (!CATEGORIES.some(c => budgetFor(c.id) > 0)) openBudgetsModal();
  registerServiceWorker();
  refreshExchangeRate();
  startSharedSync();

  // once the dashboard is up, look at what was logged and ask about a trip
  setTimeout(maybeAskAboutTrip, 600);
}

document.addEventListener('DOMContentLoaded', init);
