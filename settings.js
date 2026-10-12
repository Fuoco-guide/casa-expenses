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
// Where sharing a file is not offered, the browser downloads it.
async function exportExpensesCsv() {
  const name = `casa-expenses-${todayISO()}.csv`;
  // the mark at the start tells a spreadsheet the file is UTF-8, so "฿" and accents survive
  const blob = new Blob(['﻿' + buildExpensesCsv()], { type: 'text/csv;charset=utf-8' });
  try {
    const file = new File([blob], name, { type: 'text/csv' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: name });
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return; // the share sheet was closed, nothing to do
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Spreadsheet file saved');
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
      <div class="set-head"><b>Spreadsheet</b></div>
      <p class="set-note">The house expenses in one file, to open in Excel, Numbers or Google Sheets.</p>
      <div class="set-acts"><button type="button" class="set-btn" id="set-csv"><svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 20h14"/></svg>Export to a spreadsheet</button></div>
    </section>
  `;
  document.getElementById('set-marks').setAttribute('aria-label', CATEGORIES.map(c => c.label).join(', '));
  document.getElementById('set-marks').setAttribute('role', 'img');
  document.getElementById('set-budgets').addEventListener('click', openBudgetsModal);
  document.getElementById('set-loans').addEventListener('click', () => { showView('loans'); renderLoans(); });
  document.getElementById('set-csv').addEventListener('click', exportExpensesCsv);
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
