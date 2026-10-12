/* ---------- the Settings tab ----------
   The fourth tab, called Tools until 12 October 2026. Each setting is its own box and
   shows its main action, on the azure to navy background of Home.

   In this app (Debora and Victor) the categories, the two currencies and the two people
   are fixed, so those boxes show without an add button. The sellable copy has the same
   boxes with their buttons: add a category, change a currency, add a person, backup. */

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
  const rows = [['Date', 'What', 'Category', 'Amount', 'Currency', 'Value in EUR', 'Paid with', 'Paid by']];
  list
    .filter(e => isSharedCategory(e.category) && CATEGORIES.some(c => c.id === e.category))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach(e => {
      const cat = CATEGORIES.find(c => c.id === e.category);
      const person = PEOPLE.find(p => p.id === (e.paidBy || PEOPLE[0].id));
      rows.push([e.date, e.note, cat.label, num(e.amount), e.currency, num(e.amountEUR), e.payment === 'cash' ? 'Cash' : 'Card', person ? person.label : '']);
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
  };
}
async function saveBackupFile() {
  const backup = buildBackup();
  if (!(await handOverFile(`casa-backup-${todayISO()}.json`, JSON.stringify(backup, null, 2), 'application/json'))) return;
  DATA.lastBackupAt = backup.savedAt;
  saveData();
  if (state.view === 'tools') renderSettings();
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

function renderSettings() {
  const box = document.getElementById('settings-content');
  const month = currentMonthKey();
  const budget = overallBudget();
  const spent = totalFor(expensesForMonth(month).filter(e => isSharedCategory(e.category)));
  const used = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const rate = DATA.exchangeRate || { rate: DEFAULT_THB_PER_EUR, updatedAt: null };
  const marks = CATEGORIES.map(cat => `<span class="set-mark" style="background:${categoryTone(cat)}">${categoryArtHTML(cat, 'art')}</span>`).join('');

  box.innerHTML = `
    <h2 class="set-group first">Your money</h2>
    <section class="set-card">
      <div class="set-head"><b>Categories</b></div>
      <div class="set-marks" id="set-marks">${marks}</div>
    </section>
    <section class="set-card">
      <div class="set-head"><b>Budgets</b><button type="button" class="set-btn quiet" id="set-budgets">Edit</button></div>
      ${budget > 0 ? `<div class="set-big">${euro(budget)}<small>a month · ${used}% used</small></div>` : '<p class="set-note">No budget set yet.</p>'}
      ${budget > 0 ? `<div class="set-bar"><i style="width:${Math.min(used, 100)}%"></i></div>` : ''}
    </section>
    <section class="set-card">
      <div class="set-head"><b>Currencies</b></div>
      <div class="set-big">EUR and THB</div>
    </section>
    <section class="set-card">
      <div class="set-head"><b>Exchange rate</b><button type="button" class="set-btn quiet" id="set-rate">Update</button></div>
      <div class="set-big">1 € = ${baht(rate.rate)}<small>${rate.updatedAt ? timeAgo(rate.updatedAt) : 'estimated, not yet updated'}</small></div>
    </section>

    <h2 class="set-group">People</h2>
    <section class="set-card">
      <div class="set-head"><b>Who uses it</b></div>
      <div class="set-people">${PEOPLE.map(p => `<span class="set-avatar" aria-hidden="true">${escapeHTML(p.label.charAt(0))}</span>`).join('')}<span class="set-names">${escapeHTML(PEOPLE.map(p => p.label).join(' and '))}</span></div>
      <p class="set-note">Money one of you lent the other.</p>
      <div class="set-acts"><button type="button" class="set-btn quiet" id="set-loans">Between us</button></div>
    </section>

    <h2 class="set-group">Your data</h2>
    <section class="set-card">
      <div class="set-head"><b>Backup</b><span>${backupAgeText(DATA.lastBackupAt)}</span></div>
      <p class="set-note">One file with everything on this phone. Keep it somewhere safe.</p>
      <div class="set-acts"><button type="button" class="set-btn" id="set-backup"><svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 20h14"/></svg>Save a backup</button></div>
    </section>
    <section class="set-card">
      <div class="set-head"><b>Spreadsheet (CSV)</b></div>
      <p class="set-note">The house expenses in one file, to open in Excel, Numbers or Google Sheets.</p>
      <div class="set-acts"><button type="button" class="set-btn quiet" id="set-csv"><svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 20h14"/></svg>Export CSV</button></div>
    </section>

    <h2 class="set-group">Help</h2>
    <div class="set-acts set-help">
      <button type="button" class="set-btn quiet" id="set-write"><svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path d="M3 6h18v12H3zM3 7l9 7 9-7"/></svg>Write to us</button>
      <button type="button" class="set-btn quiet" id="set-problem"><svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path d="M4 5h16v11H9l-5 4V5z"/></svg>Report a problem</button>
    </div>
  `;
  document.getElementById('set-marks').setAttribute('aria-label', CATEGORIES.map(c => c.label).join(', '));
  document.getElementById('set-marks').setAttribute('role', 'img');
  document.getElementById('set-budgets').addEventListener('click', openBudgetsModal);
  document.getElementById('set-loans').addEventListener('click', () => { showView('loans'); renderLoans(); });
  document.getElementById('set-csv').addEventListener('click', exportExpensesCsv);
  document.getElementById('set-backup').addEventListener('click', saveBackupFile);
  document.getElementById('set-write').addEventListener('click', () => openHelp('question'));
  document.getElementById('set-problem').addEventListener('click', () => openHelp('problem'));
  document.getElementById('set-rate').addEventListener('click', async () => {
    // refreshExchangeRate keeps the saved rate when the phone is offline, so say which happened
    const before = DATA.exchangeRate && DATA.exchangeRate.updatedAt;
    showToast('Checking latest rate…');
    await refreshExchangeRate();
    const after = DATA.exchangeRate && DATA.exchangeRate.updatedAt;
    if (state.view === 'tools') renderSettings();
    showToast(after && after !== before ? 'Exchange rate updated' : 'No connection. Rate kept as it was.');
  });
}
