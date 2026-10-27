/* ---------- the Settings tab ----------
   The fourth tab, called Tools until 12 October 2026. Each setting is its own box and
   shows its main action, on the azure to navy background of Home.

   In this app (Debora and Victor) the categories, the two currencies and the two people
   are fixed, so those boxes show without an add button. The sellable copy has the same
   boxes with their buttons: add a category, change a currency, add a person, backup. */

/* ---------- what Settings can change ----------
   Categories, people and travel currencies are no longer fixed in the code. They live in
   DATA.settings, on the phone and, for the two phones to agree, as one text field
   ("_settings") inside the Firestore document that already holds the budgets. That way no
   new Firestore rule is needed. applySettings() turns them into the lists the app reads. */

const CATEGORY_TONES = ['#3B6BFF', '#12A37F', '#E08A1A', '#E0527F', '#8B6BF0', '#16A0CC', '#C4763A', '#4FB06D', '#B565D9', '#7A8CA5'];
// spoken names, in the same order, for people who use a screen reader
const CATEGORY_TONE_NAMES = ['Blue', 'Green', 'Orange', 'Pink', 'Violet', 'Cyan', 'Brown', 'Light green', 'Purple', 'Grey'];
// Line icons for a category made in Settings. Only the key is stored and shared, never a drawing.
const CUSTOM_ICONS = {
  star: 'M12 4l2.4 5 5.6.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.6-.8z',
  home: 'M3 11l9-7 9 7M5 10v9h14v-9M9 19v-5h6v5',
  bed: 'M3 18v-7h18v7M3 14h18M6 11V8h5v3',
  plane: 'M3 13l18-7-7 18-3-8-8-3z',
  car: 'M4 16l1.2-4.8A2 2 0 017.1 9.7h9.8a2 2 0 011.9 1.5L20 16M3 16h18v3H3z',
  basket: 'M4 9h16l-1.6 9.4a2 2 0 01-2 1.6H7.6a2 2 0 01-2-1.6L4 9zM8 9V7a4 4 0 018 0v2',
  cup: 'M5 8h11v5a5 5 0 01-10 0V8zM16 9h2a2 2 0 010 4h-2M4 20h13',
  gift: 'M4 10h16v10H4zM12 10v10M3 7h18v3H3zM12 7c-1-3-5-3-5 0M12 7c1-3 5-3 5 0',
  health: 'M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z',
  screen: 'M4 5h16v11H4zM9 20h6M12 16v4',
  shirt: 'M8 4l4 2 4-2 4 4-3 3v9H7v-9L4 8l4-4z',
  paw: 'M12 20c-3 0-5-1.5-5-3.5S9.5 12 12 12s5 2.5 5 4.5S15 20 12 20zM6.5 10.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM10 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM14 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17.5 10.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  book: 'M5 4h13v16H5zM9 4v16M12 8h3M12 11h3',
  weights: 'M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12',
  phone: 'M7 3h10v18H7zM11 18h2',
  music: 'M9 18V5l11-2v13M9 18a3 3 0 11-3-3 3 3 0 013 3zM20 16a3 3 0 11-3-3 3 3 0 013 3z',
};

// Whatever arrives, from this phone or from the other one, is cut down to what the app
// can safely use: known shapes, plain ids, short names, a colour that is a colour.
function cleanSettings(raw) {
  const s = raw && typeof raw === 'object' ? raw : {};
  const idOk = (v) => typeof v === 'string' && /^[a-z0-9_]{1,24}$/.test(v);
  // a name is plain text: the two signs that could open markup are taken out for good measure,
  // and every place that draws a name escapes it as well
  const text = (v, max) => (typeof v === 'string' ? v.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, max) : '');
  const once = () => { const seen = new Set(); return (key) => (seen.has(key) ? false : !!seen.add(key)); };

  let categories = null;
  if (Array.isArray(s.categories)) {
    const fresh = once();
    categories = s.categories
      .map(c => (c && typeof c === 'object' ? {
        id: c.id,
        label: text(c.label, 24),
        tone: typeof c.tone === 'string' && /^#[0-9A-Fa-f]{6}$/.test(c.tone) ? c.tone : null,
        icon: typeof c.icon === 'string' && Object.prototype.hasOwnProperty.call(CUSTOM_ICONS, c.icon) ? c.icon : null,
      } : null))
      // the personal category can never be part of the shared list
      .filter(c => c && idOk(c.id) && isSharedCategory(c.id) && c.label && fresh(c.id))
      .slice(0, MAX_CATEGORIES - 1);
    if (!categories.length) categories = null;
  }

  let people = null;
  if (Array.isArray(s.people)) {
    const fresh = once();
    people = s.people
      .map(p => (p && typeof p === 'object' ? { id: p.id, label: text(p.label, 20), ...(PROFILE_TONES.includes(p.tone) && p.tone !== PROFILE_TONES[0] ? { tone: p.tone } : {}) } : null))
      .filter(p => p && idOk(p.id) && p.label && fresh(p.id))
      .slice(0, MAX_PEOPLE);
    // the two phones are tied to these two ids, so a list without them is not used
    if (!DEFAULT_PEOPLE.every(d => people.some(p => p.id === d.id))) people = null;
  }

  const code = (v) => (typeof v === 'string' && /^[A-Z]{3}$/.test(v) ? v : null);
  // the main currency of these settings, which is not always the one this phone uses yet
  const main = code(s.main) || FIRST_MAIN_CURRENCY;
  let currencies = null;
  if (Array.isArray(s.currencies)) {
    const fresh = once();
    currencies = s.currencies
      .filter(c => code(c) && c !== main && fresh(c))
      .slice(0, MAX_TRAVEL_CURRENCIES);
  }
  // the fixed rates between an earlier main currency and a later one, as "EUR>MXN": 21.4
  const bridges = {};
  if (s.bridges && typeof s.bridges === 'object') {
    Object.keys(s.bridges).forEach(key => {
      const rate = Number(s.bridges[key]);
      if (/^[A-Z]{3}>[A-Z]{3}$/.test(key) && rate > 0 && isFinite(rate)) bridges[key] = rate;
    });
  }

  const manualRates = {};
  if (s.manualRates && typeof s.manualRates === 'object') {
    Object.keys(s.manualRates).forEach(code => {
      const rate = Number(s.manualRates[code]);
      if (/^[A-Z]{3}$/.test(code) && rate > 0 && isFinite(rate)) manualRates[code] = rate;
    });
  }
  return { categories, people, currencies, manualRates, main, bridges, updatedAt: typeof s.updatedAt === 'string' ? s.updatedAt : null };
}

// Words of a category name the quick line can match, letters and digits only.
function labelKeywords(label) {
  return label.toLowerCase().split(/\s+/).filter(w => /^[\p{L}\p{N}]{3,}$/u.test(w));
}

// Rebuilds PEOPLE, ALL_CATEGORIES and CATEGORIES from DATA.settings. Call it after any
// change to the settings or to the identity of the phone.
function applySettings() {
  const s = cleanSettings(DATA.settings);
  DATA.settings = s;
  PEOPLE = (s.people || DEFAULT_PEOPLE).map(p => ({ id: p.id, label: p.label, ...(p.tone ? { tone: p.tone } : {}) }));
  const plainId = (v) => typeof v === 'string' && /^[a-z0-9_]{1,24}$/.test(v);
  // A payer that was removed on the other phone while an expense still names them keeps a
  // place in the lists, so the expense is still counted for someone and an edit cannot
  // quietly hand it to another person.
  DATA.expenses.forEach(e => {
    if (plainId(e.paidBy) && !PEOPLE.some(p => p.id === e.paidBy)) PEOPLE.push({ id: e.paidBy, label: 'Someone else', orphan: true });
  });

  const builtIn = DEFAULT_CATEGORIES.filter(c => isSharedCategory(c.id));
  const shared = s.categories
    ? s.categories.map(c => {
      const base = builtIn.find(d => d.id === c.id);
      const drawn = c.icon ? { icon: CUSTOM_ICONS[c.icon], iconKey: c.icon, lineIcon: true } : {};
      if (base) return { ...base, label: c.label, ...(c.tone ? { tone: c.tone } : {}), ...drawn };
      return { id: c.id, label: c.label, tone: c.tone || CATEGORY_TONES[0], icon: CUSTOM_ICONS.star, iconKey: 'star', lineIcon: true, custom: true, keywords: labelKeywords(c.label), ...drawn };
    })
    : builtIn.slice();
  // The same for a category: an expense in a shared category this phone no longer lists
  // (removed on the other phone, or lost when two changes crossed) gets a stand in called
  // "Other". Without it the month total would count money that no category shows.
  DATA.expenses.forEach(e => {
    if (isSharedCategory(e.category) && plainId(e.category) && !shared.some(c => c.id === e.category)) {
      shared.push({ id: e.category, label: 'Other', tone: '#7A8CA5', icon: CUSTOM_ICONS.star, iconKey: 'star', lineIcon: true, custom: true, orphan: true, keywords: [] });
    }
  });

  // the personal category keeps its place and carries its owner's name
  const owner = PEOPLE.find(p => p.id === 'debora');
  const personal = { ...DEFAULT_CATEGORIES.find(c => !isSharedCategory(c.id)), label: owner ? owner.label : 'Debora' };
  ALL_CATEGORIES = [...shared.slice(0, 4), personal, ...shared.slice(4)];
  CATEGORIES = categoriesForIdentity(DATA.identity);

  if (!activeCurrencies().includes(state.displayCurrency)) state.displayCurrency = mainCurrency();
  if (!activeCurrencies().includes(DATA.lastCurrency)) DATA.lastCurrency = mainCurrency();
}

// Saves a change made on this phone, redraws what depends on it, and shares it.
function saveSettings(change) {
  DATA.settings = cleanSettings({ ...DATA.settings, ...change, updatedAt: new Date().toISOString() });
  applySettings();
  saveData();
  renderChoiceToggles();
  updateCurrencyPills();
  renderCurrentView();
  if (FIREBASE_READY && firestoreFns) {
    const sent = DATA.settings.updatedAt;
    firestoreFns.setDoc(firestoreFns.doc(firestoreDb, 'meta', 'budgets'), { _settings: JSON.stringify(DATA.settings) }, { merge: true })
      .then(() => { DATA.settingsSentAt = sent; saveData(); })
      .catch(() => showToast('Could not share the change, check your connection'));
  }
}
// Settings arriving from the other phone. The newer change wins.
function receiveSharedSettings(json) {
  let parsed;
  try { parsed = JSON.parse(json); } catch (e) { return; }
  const next = cleanSettings(parsed);
  const mine = cleanSettings(DATA.settings);
  if (JSON.stringify(next) === JSON.stringify(mine)) return;
  // A change made here that has not reached the server yet is kept when it is the newer
  // one. Once this phone's change has been delivered, whatever the server holds is the
  // latest word, whatever the two clocks say.
  const pending = mine.updatedAt && DATA.settingsSentAt !== mine.updatedAt;
  if (pending && (!next.updatedAt || next.updatedAt < mine.updatedAt)) return;
  const currenciesBefore = activeCurrencies().join();
  const mainBefore = mainCurrency();
  // a fixed rate is never forgotten: settings that crossed on the way, or came from a phone
  // on an older version, may not carry the ones this phone holds
  next.bridges = { ...mine.bridges, ...next.bridges };
  DATA.settings = next;
  DATA.settingsSentAt = next.updatedAt;
  // the main currency was changed on the other phone: the rates fetched here were for the
  // old one, and the person here is told, because every figure on screen just changed
  if (mainCurrency() !== mainBefore) {
    DATA.rates = null; DATA.ratesBase = mainCurrency(); state.displayCurrency = mainCurrency();
    showToast(`Main currency is now ${mainCurrency()}`);
  }
  applySettings();
  saveData();
  renderChoiceToggles();
  updateCurrencyPills();
  // a currency switched on from the other phone needs its rate here too
  if (activeCurrencies().join() !== currenciesBefore) refreshExchangeRate().then(() => renderCurrentView());
}

// Every expense this phone can see, as a spreadsheet file. Semicolons and comma decimals,
// the way a spreadsheet set to Italian reads it, and the same number style as the app.
// House expenses only. The personal category is left out on every phone: the file can be
// sent anywhere from the share sheet, and that category is local only on principle.
function buildExpensesCsv(list = DATA.expenses) {
  const cell = (v) => {
    let s = String(v == null ? '' : v);
    // a note such as "-20 refund" or "=..." would be read as a formula by a spreadsheet
    if (/^[=+\-@]/.test(s) && !/^-?\d+,\d\d$/.test(s)) s = "'" + s;
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const num = (n) => (Number(n) || 0).toFixed(2).replace('.', ',');
  const rows = [['Date', 'What', 'Category', 'Amount', 'Currency', `Value in ${mainCurrency()}`, 'Paid with', 'Paid by']];
  list
    .filter(e => isSharedCategory(e.category) && CATEGORIES.some(c => c.id === e.category))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach(e => {
      const cat = CATEGORIES.find(c => c.id === e.category);
      const person = PEOPLE.find(p => p.id === (e.paidBy || PEOPLE[0].id));
      rows.push([e.date, e.note, cat.label, num(e.amount), e.currency, num(mainValue(e)), e.payment === 'cash' ? 'Cash' : 'Card', person ? person.label : '']);
    });
  return rows.map(r => r.map(cell).join(';')).join('\r\n');
}

// On an iPhone the share sheet is the dependable way to hand over a file ("Save to Files").
// Where sharing a file is not offered, the browser downloads it. Returns false when the
// person closed the share sheet without choosing anything.
async function handOverFile(name, text, type) {
  const blob = new Blob([text], { type: `${type};charset=utf-8` });
  try {
    const file = new File([blob], name, { type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: name });
      return true;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return false;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

async function exportExpensesCsv() {
  // the mark at the start tells a spreadsheet the file is UTF-8, so "฿" and accents survive
  if (await handOverFile(`casa-expenses-${todayISO()}.csv`, '\ufeff' + buildExpensesCsv(), 'text/csv')) showToast('Spreadsheet file ready');
}

// A backup is one file with everything this phone holds, the personal category included:
// that category lives nowhere else, so this file is its only second copy. It is made on
// the phone and handed to the person, never sent anywhere by the app.
function buildBackup(now = new Date()) {
  return {
    app: 'casa-expenses', format: 1, savedAt: now.toISOString(), identity: DATA.identity,
    expenses: DATA.expenses, budgets: DATA.budgets, loans: DATA.loans || [],
    exchangeRate: DATA.exchangeRate || null, lastCurrency: DATA.lastCurrency || 'EUR',
    moments: DATA.moments || [], dismissedRuns: DATA.dismissedRuns || [],
    settings: DATA.settings || null, rates: DATA.rates || null, ratesBase: DATA.ratesBase || null,
    personalBudgetBase: DATA.personalBudgetBase || null, budgetBase: DATA.budgetBase || null,
  };
}
async function saveBackupFile() {
  const backup = buildBackup();
  if (!(await handOverFile(`casa-backup-${todayISO()}.json`, JSON.stringify(backup, null, 2), 'application/json'))) return;
  DATA.lastBackupAt = backup.savedAt;
  saveData();
  if (state.view === 'tools') renderSettings();
  if (state.view === 'profile') renderProfile();
  showToast('Backup file ready');
}
function backupAgeText(iso, now = new Date()) {
  if (!iso) return 'No backup yet';
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'Last one today';
  return days === 1 ? 'Last one yesterday' : `Last one ${days} days ago`;
}

// Where a question or a problem report goes. One place to change it.
const SUPPORT_EMAIL = 'debora.cesca@gmail.com';
const APP_NAME = 'Casa';
const APP_VERSION = '1.0';
function openHelp(kind) {
  const problem = kind === 'problem';
  document.getElementById('help-title').textContent = problem ? 'Report a problem' : 'Write to us';
  document.getElementById('help-lead').textContent = problem
    ? 'Tell us what happened and what you expected. A screenshot helps.'
    : 'A question or an idea? We read every message.';
  document.getElementById('help-address').textContent = SUPPORT_EMAIL;
  document.getElementById('help-note').textContent = problem
    ? 'The email starts with your phone model, so we can find the problem faster. Your expenses are never sent.'
    : 'Your expenses are never sent.';
  const subject = problem ? `${APP_NAME}: a problem` : `${APP_NAME}: a question`;
  const body = problem ? `\n\n\nPhone: ${navigator.userAgent || ''}` : '';
  document.getElementById('help-open').setAttribute('href', `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  document.getElementById('modal-help').classList.remove('hidden');
}
function wireHelp() {
  document.getElementById('btn-close-help').addEventListener('click', () => document.getElementById('modal-help').classList.add('hidden'));
  document.getElementById('btn-copy-address').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(SUPPORT_EMAIL); showToast('Address copied'); }
    catch (e) { showToast('Press and hold the address to copy it'); }
  });
}

// "a", "a and b", "a, b and c"
function listWords(items) {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}
function currencyName(code) {
  try { return new Intl.DisplayNames(['en'], { type: 'currency' }).of(code) || code; } catch (e) { return code; }
}
function allCurrencyCodes() {
  // only the currencies in use today: the phone's own list also holds old ones
  return AUTO_RATE_CODES.slice();
}
const SET_PLUS = '<svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';

function renderSettings() {
  const box = document.getElementById('settings-content');
  const month = currentMonthKey();
  const budget = overallBudget();
  const spent = totalFor(expensesForMonth(month).filter(e => isSharedCategory(e.category)));
  const used = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const marks = CATEGORIES.map(cat => `<span class="set-mark" style="background:${categoryTone(cat)}">${categoryArtHTML(cat, 'art')}</span>`).join('');
  const travel = travelCurrencies();
  const canAddCategory = ALL_CATEGORIES.filter(c => isSharedCategory(c.id)).length < MAX_CATEGORIES - 1;

  box.innerHTML = `
    <h2 class="set-group first">Your money</h2>
    <section class="set-card">
      <div class="set-head"><b>Categories</b><span>${CATEGORIES.length} of ${CATEGORIES.some(c => !isSharedCategory(c.id)) ? MAX_CATEGORIES : MAX_CATEGORIES - 1}</span></div>
      <div class="set-marks" id="set-marks">${marks}</div>
      <div class="set-acts">${canAddCategory ? `<button type="button" class="set-btn" id="set-cat-add">${SET_PLUS}Add a category</button>` : ''}<button type="button" class="set-btn quiet" id="set-cat-edit">Edit</button></div>
    </section>
    <section class="set-card">
      <div class="set-head"><b>Budgets</b><button type="button" class="set-btn quiet" id="set-budgets">Edit</button></div>
      ${budget > 0 ? `<div class="set-big">${mainMoney(budget)}<small>a month · ${used}% used</small></div>` : '<p class="set-note">No budget set yet.</p>'}
      ${budget > 0 ? `<div class="set-bar"><i style="width:${Math.min(used, 100)}%"></i></div>` : ''}
    </section>
    <section class="set-card">
      <div class="set-part">
        <div class="grow"><div class="set-label">Main currency<button type="button" class="set-info" id="set-info-main" aria-label="What is the main currency?">i</button></div>
          <div class="set-big">${mainCurrency()}<small>${escapeHTML(currencyName(mainCurrency()))}</small></div></div>
        <button type="button" class="set-btn quiet" id="set-main">Change</button>
      </div>
      <div class="set-part">
        <div class="grow"><div class="set-label">Other currencies<button type="button" class="set-info" id="set-info-other" aria-label="What are other currencies?">i</button></div>
          ${travel.length ? `<div class="set-big">${escapeHTML(travel.join(', '))}</div>` : '<div class="set-none">None</div>'}</div>
        <button type="button" class="set-btn quiet" id="set-cur">${travel.length ? 'Edit' : 'Add'}</button>
      </div>
    </section>
    ${travel.length ? `<section class="set-card">
      <div class="set-head"><b>Exchange rate</b><button type="button" class="set-btn quiet" id="set-rate">Update</button></div>
      ${travel.map(code => `<div class="set-big">1 ${escapeHTML(currencyMark(mainCurrency()))} = ${rateFor(code) ? escapeHTML(rateText(rateFor(code), code)) : `${code}, no rate yet`}<small>${escapeHTML(rateAgeText(code))}</small></div>`).join('')}
    </section>` : ''}

    <h2 class="set-group">People</h2>
    <section class="set-card">
      <div class="set-head"><b>Who uses it</b><button type="button" class="set-btn quiet" id="set-people">Edit</button></div>
      <div class="set-people">${PEOPLE.map(p => `<span class="set-avatar"${avatarTone(p)} aria-hidden="true">${escapeHTML(p.label.charAt(0))}</span>`).join('')}<span class="set-names">${escapeHTML(listWords(PEOPLE.map(p => p.label)))}</span></div>
      <div class="set-acts">${PEOPLE.length < MAX_PEOPLE ? `<button type="button" class="set-btn" id="set-person-add">${SET_PLUS}Add a person</button>` : ''}<button type="button" class="set-btn quiet" id="set-loans">Loans</button></div>
    </section>

    <h2 class="set-group">Your data</h2>
    <section class="set-card">
      <div class="set-head"><b>Backup</b><span>${backupAgeText(DATA.lastBackupAt)}</span></div>
      <p class="set-note">One file with everything on this phone. Keep it somewhere safe.</p>
      <div class="set-acts"><button type="button" class="set-btn" id="set-backup"><svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 20h14"/></svg>Save a backup</button></div>
    </section>
    <section class="set-card">
      <div class="set-head"><b>Spreadsheet</b></div>
      <p class="set-note">The house expenses in one file, to open in Excel, Numbers or Google Sheets.</p>
      <div class="set-acts"><button type="button" class="set-btn quiet" id="set-csv"><svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 20h14"/></svg>Export</button></div>
    </section>

    <h2 class="set-group">Help</h2>
    <div class="set-acts set-help">
      <button type="button" class="set-btn quiet" id="set-write"><svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path d="M3 6h18v12H3zM3 7l9 7 9-7"/></svg>Write to us</button>
      <button type="button" class="set-btn quiet" id="set-problem"><svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path d="M4 5h16v11H9l-5 4V5z"/></svg>Report a problem</button>
    </div>
    <p class="set-note rate-credit"><a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">Rates By Exchange Rate API</a></p>
  `;
  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
  document.getElementById('set-marks').setAttribute('aria-label', CATEGORIES.map(c => c.label).join(', '));
  document.getElementById('set-marks').setAttribute('role', 'img');
  on('set-cat-add', () => openCategoryEditor(null));
  on('set-cat-edit', openCategoriesSheet);
  on('set-budgets', openBudgetsModal);
  on('set-cur', () => openCurrenciesSheet());
  on('set-main', () => openMainCurrencySheet());
  on('set-info-main', () => openInfoSheet('Main currency', 'Your totals, budgets and Stats are shown in this currency.'));
  on('set-info-other', () => openInfoSheet('Other currencies', `Enter an expense in another currency. It is added to your totals in your main currency. Up to ${MAX_TRAVEL_CURRENCIES}.`));
  on('set-person-add', () => openPeopleSheet(true));
  on('set-people', () => openPeopleSheet(false));
  on('set-loans', () => { state.loansFrom = 'tools'; showView('loans'); renderLoans(); });
  on('set-csv', exportExpensesCsv);
  on('set-backup', saveBackupFile);
  on('set-write', () => openHelp('question'));
  on('set-problem', () => openHelp('problem'));
  on('set-rate', async () => {
    // refreshExchangeRate keeps the saved rates when the phone is offline, so say which happened
    const stamps = () => travelCurrencies().map(rateStamp).join('|');
    const before = stamps();
    showToast('Checking latest rate…');
    await refreshExchangeRate();
    if (state.view === 'tools') renderSettings();
    showToast(stamps() !== before ? 'Exchange rate updated' : 'No connection. Rate kept as it was.');
  });
}

/* ---------- the profile: the screen behind the letter on Home ---------- */

// The colours a person can give their letter. The first one is the plain white of the app.
const PROFILE_TONES = ['#FFFFFF', '#5CC8FF', '#12A37F', '#E08A1A', '#E0527F', '#8B6BF0'];
const PROFILE_TONE_NAMES = ['White', 'Sky', 'Green', 'Orange', 'Pink', 'Violet'];
// The letter on a colour is drawn in the darkest navy of the app, so it reads on all six.
const AVATAR_INK = '#07162B';
// A name as it will be stored: the two signs cleanSettings takes out are taken out here
// first, so a name made only of them is caught as empty before anything is saved.
function plainName(value) {
  return String(value || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
}
// The colour of a person's letter as a style attribute, or nothing for the plain white.
function avatarTone(person) {
  return person && person.tone ? ` style="background:${person.tone};color:${AVATAR_INK}"` : '';
}
// The person this phone belongs to.
function profileOwner() {
  return PEOPLE.find(p => p.id === DATA.identity) || PEOPLE[0];
}
// The people as the settings store them, with one of them changed.
function peopleWith(id, change) {
  return PEOPLE.filter(p => !p.orphan).map(p => ({ id: p.id, label: p.label, tone: p.tone, ...(p.id === id ? change : {}) }));
}
function privacyText() {
  const lines = [];
  if (CATEGORIES.some(c => !isSharedCategory(c.id))) lines.push('Your personal category stays on this phone. It is never sent anywhere.');
  lines.push('The house expenses, the budgets and the settings are shared between the phones through a private database, so everyone sees the same numbers.');
  lines.push('For exchange rates the app asks one service and sends the currency codes only, never an amount.');
  lines.push('The app has no ads and collects nothing about how you use it.');
  return lines;
}
function renderProfile() {
  const me = profileOwner();
  const others = PEOPLE.filter(p => !p.orphan);
  const chevron = '<svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  const row = (id, label, value = '') => `<button type="button" class="set-row" id="${id}"><b>${label}</b>${value ? `<span class="pro-value">${escapeHTML(value)}</span>` : ''}${chevron}</button>`;
  const tone = me.tone || PROFILE_TONES[0];
  document.getElementById('profile-content').innerHTML = `
    <div class="pro-hero">
      <span class="pro-avatar"${avatarTone(me)} aria-hidden="true">${escapeHTML(me.label.charAt(0))}</span>
      <h2>${escapeHTML(me.label)}</h2>
      <button type="button" class="pro-link" id="pro-name">Change name</button>
      <div class="pro-tones" role="group" aria-label="Colour of your letter">${PROFILE_TONES.map((t, i) => `<button type="button" class="pro-tone${t === tone ? ' on' : ''}" data-tone="${t}" aria-label="${PROFILE_TONE_NAMES[i]}" aria-pressed="${t === tone}"><i style="background:${t}"></i></button>`).join('')}</div>
    </div>
    <div class="set-list pro-list">${row('pro-settings', 'Settings')}</div>
    <div class="set-list pro-list">${row('pro-people', 'People', others.length > 1 ? listWords(others.map(p => p.label)) : 'Just me')}${row('pro-loans', 'Loans')}</div>
    <div class="set-list pro-list">${row('pro-backup', 'Save a backup', backupAgeText(DATA.lastBackupAt))}${row('pro-csv', 'Export a spreadsheet')}</div>
    <div class="set-list pro-list">${row('pro-write', 'Write to us')}${row('pro-problem', 'Report a problem')}${row('pro-privacy', 'Privacy')}
      <div class="set-row static"><b>Version</b><span class="pro-value">${APP_VERSION}</span></div></div>
  `;
  const on = (id, fn) => document.getElementById(id).addEventListener('click', fn);
  on('pro-name', openNameSheet);
  on('pro-settings', () => { showView('tools'); renderSettings(); window.scrollTo(0, 0); });
  on('pro-people', () => openPeopleSheet(false));
  on('pro-loans', () => { state.loansFrom = 'profile'; showView('loans'); renderLoans(); });
  on('pro-backup', saveBackupFile);
  on('pro-csv', exportExpensesCsv);
  on('pro-write', () => openHelp('question'));
  on('pro-problem', () => openHelp('problem'));
  on('pro-privacy', () => {
    openSetSheet('Privacy', `${privacyText().map(line => `<p class="set-info-text">${escapeHTML(line)}</p>`).join('')}<button type="button" class="set-btn wide" id="set-info-ok">Got it</button>`);
    document.getElementById('set-info-ok').addEventListener('click', closeSetSheet);
  });
  document.querySelectorAll('#profile-content .pro-tone').forEach(btn => btn.addEventListener('click', () => {
    saveSettings({ people: peopleWith(me.id, { tone: btn.dataset.tone }) });
  }));
}
function openNameSheet() {
  const me = profileOwner();
  openSetSheet('Your name', `
    <input type="text" id="pro-name-input" maxlength="20" autocomplete="off" autocapitalize="words" enterkeyhint="done" aria-label="Your name">
    <button type="button" class="btn-primary btn-wide" id="pro-name-save">Save</button>`);
  const input = document.getElementById('pro-name-input');
  input.value = me.label;
  const save = () => {
    const label = plainName(input.value);
    if (!label) { showToast('Type a name first'); return; }
    saveSettings({ people: peopleWith(me.id, { label }) });
    closeSetSheet();
    showToast('Name saved');
  };
  document.getElementById('pro-name-save').addEventListener('click', save);
  input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { ev.preventDefault(); save(); } });
}

/* ---------- the sheets behind the boxes: one sheet, filled for each job ---------- */

function openSetSheet(title, html) {
  document.getElementById('set-sheet-title').textContent = title;
  const body = document.getElementById('set-sheet-body');
  body.innerHTML = html;
  document.getElementById('modal-set').classList.remove('hidden');
  return body;
}
function closeSetSheet() {
  document.getElementById('modal-set').classList.add('hidden');
}
// The small i next to a label: one short text and a way out.
function openInfoSheet(title, text) {
  openSetSheet(title, `<p class="set-info-text">${escapeHTML(text)}</p><button type="button" class="set-btn wide" id="set-info-ok">Got it</button>`);
  document.getElementById('set-info-ok').addEventListener('click', closeSetSheet);
}
function wireSetSheet() {
  document.getElementById('btn-close-set').addEventListener('click', closeSetSheet);
}

/* categories */

// The shared categories as they are stored: id, name, colour, and the icon key of a made one.
function sharedCategoryList() {
  return ALL_CATEGORIES.filter(c => isSharedCategory(c.id) && !c.orphan).map(c => ({ id: c.id, label: c.label, tone: categoryTone(c), icon: c.iconKey || null }));
}
function openCategoriesSheet() {
  const shared = ALL_CATEGORIES.filter(c => isSharedCategory(c.id));
  const personal = CATEGORIES.find(c => !isSharedCategory(c.id));
  const row = (cat, locked) => `<button type="button" class="set-row" ${locked ? 'disabled' : `data-id="${cat.id}"`}><span class="set-mark" style="background:${categoryTone(cat)}">${categoryArtHTML(cat, 'art')}</span><b>${escapeHTML(cat.label)}</b>${locked ? '<small>only on this phone</small>' : '<svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>'}</button>`;
  const body = openSetSheet('Categories', `
    <div class="set-list">${shared.map(c => row(c, false)).join('')}${personal ? row(personal, true) : ''}</div>
    ${shared.length < MAX_CATEGORIES - 1 ? `<button type="button" class="btn-primary btn-wide" id="sheet-cat-add">Add a category</button>` : '<p class="set-note">That is the most the app holds, so adding an expense stays quick.</p>'}
  `);
  body.querySelectorAll('.set-row[data-id]').forEach(btn => btn.addEventListener('click', () => openCategoryEditor(btn.dataset.id)));
  const add = document.getElementById('sheet-cat-add');
  if (add) add.addEventListener('click', () => openCategoryEditor(null));
}
function openCategoryEditor(id) {
  const list = sharedCategoryList();
  const cat = id ? ALL_CATEGORIES.find(c => c.id === id) : null;
  // a stand in ("Other") is not in the stored list yet. Saving it here makes it a real category again.
  const current = id ? (list.find(c => c.id === id) || (cat && cat.orphan ? { id, label: cat.label, tone: categoryTone(cat), icon: 'star' } : null)) : null;
  const made = !current || (cat && cat.custom);
  const used = id ? DATA.expenses.filter(e => e.category === id).length : 0;
  const draft = current ? { ...current } : { id: null, label: '', tone: CATEGORY_TONES.find(t => !list.some(c => c.tone === t)) || CATEGORY_TONES[0], icon: 'star' };

  const body = openSetSheet(current ? 'Edit category' : 'New category', `
    <label class="field-label">Name
      <input type="text" id="cat-name" maxlength="24" autocomplete="off" enterkeyhint="done">
    </label>
    <div class="field-label">Colour
      <div class="set-swatches" id="cat-tones" role="group" aria-label="Colour">${CATEGORY_TONES.map((t, i) => `<button type="button" class="set-swatch" data-tone="${t}" aria-label="${CATEGORY_TONE_NAMES[i]}" style="background:${t}"></button>`).join('')}</div>
    </div>
    ${made ? `<div class="field-label">Icon
      <div class="set-icons" id="cat-icons" role="group" aria-label="Icon">${Object.keys(CUSTOM_ICONS).map(k => `<button type="button" class="set-icon" data-icon="${k}" aria-label="${k}"><svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path d="${CUSTOM_ICONS[k]}"/></svg></button>`).join('')}</div>
    </div>` : ''}
    <button type="button" class="btn-primary btn-wide" id="cat-save">${current ? 'Save' : 'Add category'}</button>
    ${current ? (used > 0
      ? `<p class="set-note center">It holds ${used === 1 ? '1 expense' : `${used} expenses`}, so it cannot be removed.</p>`
      : (list.length > 1 ? '<button type="button" class="btn-danger" id="cat-remove">Remove this category</button>' : '')) : ''}
  `);
  const name = document.getElementById('cat-name');
  name.value = draft.label;
  const paint = () => {
    body.querySelectorAll('.set-swatch').forEach(b => { const on = b.dataset.tone.toLowerCase() === String(draft.tone).toLowerCase(); b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    body.querySelectorAll('.set-icon').forEach(b => { const on = b.dataset.icon === draft.icon; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); b.style.background = on ? draft.tone : ''; });
  };
  body.querySelectorAll('.set-swatch').forEach(b => b.addEventListener('click', () => { draft.tone = b.dataset.tone; paint(); }));
  body.querySelectorAll('.set-icon').forEach(b => b.addEventListener('click', () => { draft.icon = b.dataset.icon; paint(); }));
  paint();

  document.getElementById('cat-save').addEventListener('click', () => {
    const label = name.value.replace(/\s+/g, ' ').trim();
    if (!label) { showToast('Give it a name'); return; }
    const entry = { id: draft.id || 'c' + Date.now().toString(36), label, tone: draft.tone, icon: made ? draft.icon : (current ? current.icon : null) };
    const next = list.some(c => c.id === entry.id) ? list.map(c => (c.id === entry.id ? entry : c)) : list.concat([entry]);
    saveSettings({ categories: next });
    showToast(current ? 'Category saved' : `${label} added`);
    openCategoriesSheet();
  });
  const remove = document.getElementById('cat-remove');
  if (remove) remove.addEventListener('click', () => {
    saveSettings({ categories: list.filter(c => c.id !== id) });
    showToast('Category removed');
    openCategoriesSheet();
  });
}

/* currencies */

function openCurrenciesSheet(search) {
  const travel = travelCurrencies();
  // only a typed text counts as a search: a click event must never be read as one
  search = typeof search === 'string' ? search : '';
  const query = search.trim().toLowerCase();
  const full = travel.length >= MAX_TRAVEL_CURRENCIES;
  const starters = ['USD', 'GBP', 'THB', 'VND', 'IDR', 'JPY', 'AUD', 'CHF', 'MXN', 'INR'];
  const pool = allCurrencyCodes().filter(c => c !== mainCurrency() && !travel.includes(c));
  // "dol" matches dozens of dollars: a code that starts with the text comes first, then the
  // currencies travellers use most, then the rest by code
  const rank = (c) => (c.toLowerCase().startsWith(query) ? 0 : starters.includes(c) ? 1 + starters.indexOf(c) : 100);
  const found = (query
    ? pool.filter(c => c.toLowerCase().includes(query) || currencyName(c).toLowerCase().includes(query)).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    : starters.filter(c => pool.includes(c))).slice(0, 12);

  const body = openSetSheet('Currencies', `
    <div class="field-label">Main currency
      <div class="set-fixed"><b>${mainCurrency()}</b><span>${escapeHTML(currencyName(mainCurrency()))}</span></div>
    </div>
    <p class="set-note">Your totals, budgets and Stats are shown in this currency.</p>
    <div class="field-label">Other currencies, up to ${MAX_TRAVEL_CURRENCIES}
      <div class="set-list">${travel.length ? travel.map(code => `<div class="set-row static"><b class="code">${code}</b><span class="grow">${escapeHTML(currencyName(code))}<small>1 ${escapeHTML(currencyMark(mainCurrency()))} = ${rateFor(code) ? escapeHTML(rateText(rateFor(code), code)) : 'no rate yet'} · ${escapeHTML(rateAgeText(code).replace(/^updated /, ''))}</small></span><button type="button" class="set-btn quiet small" data-remove="${code}">Remove</button></div>`).join('') : '<p class="set-note">None. The app shows the main currency only.</p>'}</div>
    </div>
    ${full ? `<p class="set-note">Remove one to add another.</p>` : `
    <div class="field-label">Add a currency
      <input type="text" id="cur-search" placeholder="Search, for example dollar or USD" autocomplete="off" autocapitalize="off" enterkeyhint="search">
      <div class="set-list" id="cur-found">${found.map(code => `<button type="button" class="set-row" data-add="${code}"><b class="code">${code}</b><span class="grow">${escapeHTML(currencyName(code))}${rateIsFetchable(code) && rateIsFetchable(mainCurrency()) ? '' : '<small>manual rate</small>'}</span>${SET_PLUS}</button>`).join('') || '<p class="set-note">No currency with that name.</p>'}</div>
    </div>`}
    <div id="cur-rate-box"></div>
  `);
  const input = document.getElementById('cur-search');
  if (input) {
    input.value = search || '';
    input.addEventListener('input', () => {
      const at = input.selectionStart;
      openCurrenciesSheet(input.value);
      const again = document.getElementById('cur-search');
      again.focus();
      try { again.setSelectionRange(at, at); } catch (e) { /* not every keyboard allows it */ }
    });
  }
  body.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => {
    saveSettings({ currencies: travel.filter(c => c !== btn.dataset.remove) });
    showToast(`${btn.dataset.remove} removed. Old expenses keep it.`);
    openCurrenciesSheet();
  }));
  body.querySelectorAll('[data-add]').forEach(btn => btn.addEventListener('click', () => {
    const code = btn.dataset.add;
    if (rateIsFetchable(code) && rateIsFetchable(mainCurrency())) { addTravelCurrency(code, null); return; }
    // a currency the rate service does not know: ask for the rate before it is switched on
    const boxEl = document.getElementById('cur-rate-box');
    boxEl.innerHTML = `<div class="field-label">How many ${code} is 1 ${mainCurrency()}?
      <div class="set-rate-row"><input type="number" id="cur-rate" inputmode="decimal" min="0" step="any" placeholder="0"><button type="button" class="set-btn" id="cur-rate-add">Add ${code}</button></div></div>`;
    document.getElementById('cur-rate').focus();
    document.getElementById('cur-rate-add').addEventListener('click', () => {
      const rate = parseFloat(document.getElementById('cur-rate').value);
      if (!(rate > 0)) { showToast('Type the rate first'); return; }
      addTravelCurrency(code, rate);
    });
  }));
}
async function addTravelCurrency(code, typedRate) {
  const travel = travelCurrencies();
  if (travel.includes(code) || travel.length >= MAX_TRAVEL_CURRENCIES) return;
  const manualRates = { ...(DATA.settings.manualRates || {}) };
  if (typedRate) manualRates[code] = typedRate;
  saveSettings({ currencies: travel.concat([code]), manualRates });
  if (!typedRate) await refreshExchangeRate();
  showToast(rateFor(code) ? `${code} added` : `${code} added. It needs a connection once, to get its rate.`);
  if (state.view === 'tools') renderSettings();
  openCurrenciesSheet();
}

/* main currency */

// Changing the main currency rewrites nothing that is stored. It writes one fixed rate from
// every currency a value was ever frozen in to the new main one, and from then on mainValue
// and budgetFor read the old figures through it. "rate" is how many units of the new
// currency one unit of the present main currency buys today.
function changeMainCurrency(code, rate) {
  const old = mainCurrency();
  if (!/^[A-Z]{3}$/.test(code) || code === old || !(rate > 0) || !isFinite(rate)) return false;
  const s = cleanSettings(DATA.settings);
  const bridges = { ...s.bridges };
  const bases = new Set([FIRST_MAIN_CURRENCY, old, DATA.budgetBase || FIRST_MAIN_CURRENCY, DATA.personalBudgetBase || FIRST_MAIN_CURRENCY]);
  DATA.expenses.concat(DATA.loans || []).forEach(e => bases.add(e.base || FIRST_MAIN_CURRENCY));
  Object.keys(bridges).forEach(key => bases.add(key.slice(0, 3)));
  bases.forEach(base => {
    if (base === code) return;
    // bridgeRate also reads a rate held the other way round
    const toOld = bridgeRate(base, old);
    if (toOld > 0) bridges[`${base}>${code}`] = toOld * rate;
  });

  // the rates of the other currencies were counted from the old main currency
  const travel = travelCurrencies();
  const rest = travel.filter(c => c !== code);
  // the old main currency must stay in use, or every expense paid in it could not be edited
  if (rest.length >= MAX_TRAVEL_CURRENCIES) return false;
  const others = rest.concat([old]);
  const fetched = liveRates();
  const now = new Date().toISOString();
  const live = {};
  const manualRates = {};
  const keepLive = rateIsFetchable(code);
  others.forEach(c => {
    const before = c === old ? 1 : rateFor(c);
    if (!before) return;
    const stamp = c === old ? now : fetched[c] && fetched[c].updatedAt;
    if (keepLive && rateIsFetchable(c) && stamp) live[c] = { rate: before / rate, updatedAt: stamp };
    else manualRates[c] = before / rate;
  });
  DATA.rates = live;
  DATA.ratesBase = code;
  state.displayCurrency = code;
  DATA.lastCurrency = code;
  saveSettings({ main: code, bridges, currencies: others, manualRates });
  refreshExchangeRate().then(() => { if (state.view === 'tools') renderSettings(); });
  return true;
}

// Today's rate from the main currency to another one: the one the app already holds, or
// one fetched now. Null when neither is possible, and the person types it.
async function rateToCurrency(code) {
  const main = mainCurrency();
  if (travelCurrencies().includes(code) && rateFor(code)) return rateFor(code);
  if (!rateIsFetchable(code) || !rateIsFetchable(main)) return null;
  const ask = (async () => {
    try {
      const res = await fetch(`${RATE_BASE}/${main}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.rates && data.rates[code] > 0 ? data.rates[code] : null;
    } catch (e) {
      return null;
    }
  })();
  // a slow connection must not hold the person: after five seconds the rate is typed
  return Promise.race([ask, new Promise(done => setTimeout(() => done(null), 5000))]);
}

function openMainCurrencySheet(search) {
  const main = mainCurrency();
  search = typeof search === 'string' ? search : '';
  const query = search.trim().toLowerCase();
  const first = travelCurrencies().concat(['EUR', 'USD', 'GBP', 'THB', 'MXN', 'AUD', 'CHF', 'JPY', 'IDR', 'VND', 'INR']).filter((c, i, list) => list.indexOf(c) === i);
  const pool = allCurrencyCodes().filter(c => c !== main);
  const rank = (c) => (c.toLowerCase().startsWith(query) ? 0 : first.includes(c) ? 1 + first.indexOf(c) : 100);
  const found = (query
    ? pool.filter(c => c.toLowerCase().includes(query) || currencyName(c).toLowerCase().includes(query)).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    : first.filter(c => pool.includes(c))).slice(0, 8);
  const body = openSetSheet('Main currency', `
    <div class="field-label">Now
      <div class="set-fixed"><b>${main}</b><span>${escapeHTML(currencyName(main))}</span></div>
    </div>
    <div class="field-label">Change to
      <input type="text" id="main-search" placeholder="Search, for example dollar or USD" autocomplete="off" autocapitalize="off" enterkeyhint="search">
      <div class="set-list" id="main-found">${found.map(code => `<button type="button" class="set-row" data-main="${code}"><b class="code">${code}</b><span class="grow">${escapeHTML(currencyName(code))}</span></button>`).join('') || '<p class="set-note">No currency with that name.</p>'}</div>
    </div>
  `);
  const input = document.getElementById('main-search');
  input.value = search;
  input.addEventListener('input', () => {
    openMainCurrencySheet(input.value);
    const again = document.getElementById('main-search');
    again.focus();
    again.setSelectionRange(again.value.length, again.value.length);
  });
  body.querySelectorAll('[data-main]').forEach(btn => btn.addEventListener('click', () => confirmMainCurrency(btn.dataset.main)));
}

// The step before the change: what will be different, the rate that will be used, and a
// way back. Nothing is asked, the person reads and confirms.
let mainConfirmTurn = 0;
async function confirmMainCurrency(code) {
  const turn = ++mainConfirmTurn;
  const main = mainCurrency();
  const name = currencyName(code);
  const travel = travelCurrencies();
  if (!travel.includes(code) && travel.length >= MAX_TRAVEL_CURRENCIES) {
    openSetSheet('One currency too many', `
      <p class="set-info-text">${main} stays in use as an other currency after the change, and you already have ${MAX_TRAVEL_CURRENCIES}. Remove one first.</p>
      <button type="button" class="set-btn wide" id="main-edit-others">Edit other currencies</button>`);
    document.getElementById('main-edit-others').addEventListener('click', () => openCurrenciesSheet());
    return;
  }
  const example = travel.find(c => c !== code) || main;
  openSetSheet(`Change main currency to ${name}?`, `
    <p class="set-info-text">Your totals, budgets and Stats will show in ${code}, also for the past.</p>
    <div class="set-ratebox" id="main-ratebox"><span>Getting today\u2019s rate\u2026</span></div>
    <p class="set-info-text">What you paid stays the same. An expense of ${escapeHTML(formatMoney(500, example))} is still ${escapeHTML(formatMoney(500, example))}.</p>
    <div class="set-two"><button type="button" class="set-btn quiet wide" id="main-cancel">Cancel</button><button type="button" class="set-btn wide" id="main-go" disabled>Change</button></div>
  `);
  document.getElementById('main-cancel').addEventListener('click', closeSetSheet);
  let rate = await rateToCurrency(code);
  // another currency was tapped, or the sheet was filled with something else, while the rate was on its way
  const box = document.getElementById('main-ratebox');
  const go = document.getElementById('main-go');
  if (turn !== mainConfirmTurn || !box || !go || mainCurrency() !== main) return;
  if (rate) {
    box.innerHTML = `<span>Past expenses are converted at today\u2019s rate</span><b>1 ${main} = ${escapeHTML(rateWords(rate))} ${code}</b>`;
    go.disabled = false;
  } else {
    box.innerHTML = `<label for="main-rate">Type today\u2019s rate. How many ${code} is 1 ${main}?</label><input type="number" id="main-rate" inputmode="decimal" min="0" step="any" placeholder="0">`;
    const typed = document.getElementById('main-rate');
    typed.addEventListener('input', () => { rate = parseFloat(typed.value); go.disabled = !(rate > 0); });
  }
  go.addEventListener('click', () => {
    if (!changeMainCurrency(code, rate)) return;
    closeSetSheet();
    showToast(`Main currency is now ${code}`);
  });
}

/* people */

function personInUse(id) {
  return DATA.expenses.some(e => e.paidBy === id) || (DATA.loans || []).some(l => l.from === id || l.to === id);
}
function openPeopleSheet(addOne) {
  const draft = PEOPLE.filter(p => !p.orphan).map(p => ({ id: p.id, label: p.label, tone: p.tone }));
  if (addOne && draft.length < MAX_PEOPLE) draft.push({ id: null, label: '' });
  const fixed = (id) => DEFAULT_PEOPLE.some(d => d.id === id);

  const draw = () => {
    const body = openSetSheet('Who uses it', `
      <div class="set-list plain">${draft.map((p, i) => `<div class="set-person-row"><span class="set-avatar" aria-hidden="true">${escapeHTML((p.label || '?').charAt(0))}</span><input type="text" data-i="${i}" maxlength="20" autocomplete="off" placeholder="Name" aria-label="Name ${i + 1}">${fixed(p.id) ? '' : (p.id && personInUse(p.id) ? '<small class="set-inuse">has expenses, so stays</small>' : `<button type="button" class="set-btn quiet small" data-drop="${i}">Remove</button>`)}</div>`).join('')}</div>
      ${draft.length < MAX_PEOPLE ? `<button type="button" class="set-btn quiet" id="person-more">${SET_PLUS}Add a person</button>` : ''}
      <p class="set-note">Everyone here can be chosen under "Paid by", and Stats shows what each of them paid. The names are the same on both phones.</p>
      <button type="button" class="btn-primary btn-wide" id="people-save">Save</button>
    `);
    body.querySelectorAll('input[data-i]').forEach(input => {
      input.value = draft[+input.dataset.i].label;
      input.addEventListener('input', () => { draft[+input.dataset.i].label = input.value; });
    });
    body.querySelectorAll('[data-drop]').forEach(btn => btn.addEventListener('click', () => { draft.splice(+btn.dataset.drop, 1); draw(); }));
    const more = document.getElementById('person-more');
    if (more) more.addEventListener('click', () => { draft.push({ id: null, label: '' }); draw(); });
    document.getElementById('people-save').addEventListener('click', () => {
      const people = draft.map((p, i) => ({ id: p.id || 'p' + Date.now().toString(36) + i, label: plainName(p.label), tone: p.tone }));
      if (people.some(p => !p.label)) { showToast('Every person needs a name'); return; }
      saveSettings({ people });
      closeSetSheet();
      showToast('People saved');
    });
    const empty = body.querySelector('input[data-i]:placeholder-shown');
    if (addOne && empty) empty.focus();
  };
  draw();
}
