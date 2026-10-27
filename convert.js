/* ---------- Convert: how much is it in another currency ----------
   The fourth tab, ported from Pluty on 27 October 2026 (English only). Any of the currencies in AUTO_RATE_CODES, with no signal too: it reads
   the whole table kept from the last rate download (DATA.allRates), and for the person's
   own currencies a typed rate when there is no fetched one. Nothing here is saved, and nothing here reaches the shared house data. */

const CONVERT = { from: null, to: null, amount: '' };

// How many units of `code` one unit of the main currency buys, or null when none is known.
function convertUnits(code) {
  const main = mainCurrency();
  if (code === main) return 1;
  const t = DATA.allRates;
  // the table may come from an earlier main currency: both sides are read through its base
  if (t && t.rates[code] > 0 && t.rates[main] > 0) return t.rates[code] / t.rates[main];
  return rateFor(code);
}
function convertAmount(amount, from, to) {
  const a = convertUnits(from);
  const b = convertUnits(to);
  return a && b ? (amount / a) * b : null;
}
// "Rates from today, 09:12", "Rates from 16 Oct", or the person's own typed rate.
function rateDateWords(iso) {
  const at = new Date(iso);
  return new Date().toDateString() === at.toDateString()
    ? `Rates from today, ${at.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}.`
    : `Rates from ${at.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}.`;
}
function convertRateDate(from, to) {
  const main = mainCurrency();
  const t = DATA.allRates;
  const inTable = (c) => c === main || (t && t.rates[c] > 0 && t.rates[main] > 0);
  if (t && inTable(from) && inTable(to)) return rateDateWords(t.at);
  // outside the table: the rate fetched for one of the person's own currencies, else a typed one
  const stamps = [from, to].filter(c => c !== main && !inTable(c)).map(rateStamp);
  if (stamps.length && stamps.every(Boolean)) return rateDateWords(stamps.sort()[0]);
  return 'Your own rate from Settings.';
}
function convertDefaults() {
  const main = mainCurrency();
  if (!CONVERT.to) CONVERT.to = main;
  if (!CONVERT.from) {
    const other = DATA.lastCurrency && DATA.lastCurrency !== main ? DATA.lastCurrency : travelCurrencies()[0];
    CONVERT.from = other || (main === 'USD' ? 'EUR' : 'USD');
  }
}
function convertTyped() {
  const n = parseFloat(CONVERT.amount);
  return n > 0 && isFinite(n) ? n : null;
}

function renderConvert() {
  convertDefaults();
  const chev = '<svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  document.getElementById('convert-content').innerHTML = `
    <h2 class="set-group first">How much is it?</h2>
    <div class="cv-card">
      <label class="cv-lab" for="cv-amount">Amount</label>
      <div class="cv-row">
        <input type="number" id="cv-amount" class="cv-num" step="any" min="0" inputmode="decimal" placeholder="0" autocomplete="off">
        <button type="button" class="cv-cur" id="cv-from" aria-label="Currency of the amount: ${escapeHTML(currencyName(CONVERT.from))}">${CONVERT.from}${chev}</button>
      </div>
    </div>
    <button type="button" class="cv-swap" id="cv-swap" aria-label="Swap the two currencies"><svg viewBox="0 0 24 24" class="icon" aria-hidden="true"><path d="M8 4v16M8 4L4 8M8 4l4 4M16 20V4M16 20l-4-4M16 20l4-4"/></svg></button>
    <div class="cv-card">
      <div class="cv-lab">${`In ${escapeHTML(currencyName(CONVERT.to))}`}</div>
      <div class="cv-row">
        <output class="cv-num res" id="cv-result" aria-live="polite"></output>
        <button type="button" class="cv-cur" id="cv-to" aria-label="Currency of the result: ${escapeHTML(currencyName(CONVERT.to))}">${CONVERT.to}${chev}</button>
      </div>
    </div>
    <p class="cv-rate" id="cv-rate"></p>
    <button type="button" class="cv-add" id="cv-add">${SET_PLUS}Add as an expense</button>
    <div id="cv-others"></div>
    <p class="set-note rate-credit cv-credit"><a href="https://www.exchangerate-api.com" target="_blank" rel="noopener">Rates By Exchange Rate API</a></p>
  `;
  const input = document.getElementById('cv-amount');
  input.value = CONVERT.amount;
  input.addEventListener('input', () => { CONVERT.amount = input.value; updateConvert(); });
  document.getElementById('cv-from').addEventListener('click', () => openConvertPicker('from'));
  document.getElementById('cv-to').addEventListener('click', () => openConvertPicker('to'));
  document.getElementById('cv-swap').addEventListener('click', () => {
    [CONVERT.from, CONVERT.to] = [CONVERT.to, CONVERT.from];
    renderConvert();
  });
  document.getElementById('cv-add').addEventListener('click', addFromConvert);
  updateConvert();
  // a table older than half a day is fetched again; with no signal the old one stays
  const t = DATA.allRates;
  if (!t || Date.now() - new Date(t.at).getTime() > 12 * 3600000) {
    refreshExchangeRate().then(() => { if (state.view === 'convert') updateConvert(); });
  }
}

// Only the figures change while typing, so the keyboard stays open.
function updateConvert() {
  const result = document.getElementById('cv-result');
  if (!result) return;
  const amount = convertTyped();
  const one = convertAmount(1, CONVERT.from, CONVERT.to);
  const rate = document.getElementById('cv-rate');
  const others = document.getElementById('cv-others');
  if (one == null) {
    const missing = convertUnits(CONVERT.from) ? CONVERT.to : CONVERT.from;
    result.textContent = '';
    rate.textContent = `No rate for ${missing} yet. Connect to the internet and open Convert again.`;
    others.innerHTML = '';
    return;
  }
  result.textContent = amount == null ? fitMoney(0, CONVERT.to, 12) : fitMoney(amount * one, CONVERT.to, 12);
  result.classList.toggle('long', result.textContent.length > 8);
  // the rate reads the way round that gives a number above one: "1 USD = 33.00 THB", never "1 THB = 0.0303 USD"
  const pair = one >= 1 ? `1 ${CONVERT.from} = ${rateWords(one)} ${CONVERT.to}` : `1 ${CONVERT.to} = ${rateWords(1 / one)} ${CONVERT.from}`;
  rate.textContent = `${pair}. ${convertRateDate(CONVERT.from, CONVERT.to)}`;
  const list = activeCurrencies().filter(c => c !== CONVERT.from && c !== CONVERT.to)
    .map(c => ({ c, v: amount == null ? null : convertAmount(amount, CONVERT.from, c) }))
    .filter(x => x.v != null);
  others.innerHTML = list.length ? `
    <h2 class="set-group">In your currencies</h2>
    <div class="set-list pro-list">${list.map(x => `<div class="set-row static"><b>${escapeHTML(currencyName(x.c))}</b><span class="pro-value">${escapeHTML(formatMoney(x.v, x.c))}</span></div>`).join('')}</div>` : '';
}

// The amount goes into the Add sheet in a currency the sheet knows: the one typed, else the
// result, else the value in the main currency.
function addFromConvert() {
  const amount = convertTyped();
  if (amount == null) { showToast('Type an amount first'); return; }
  const mine = activeCurrencies();
  let currency = CONVERT.from;
  let value = amount;
  if (!mine.includes(currency)) {
    currency = mine.includes(CONVERT.to) ? CONVERT.to : mainCurrency();
    value = convertAmount(amount, CONVERT.from, currency);
    if (value == null) { showToast(`No rate for ${CONVERT.from} yet`); return; }
    const digits = NO_CENTS.includes(currency) ? 1 : 100;
    value = Math.round(value * digits) / digits;
  }
  openQuickAdd();
  setActiveToggle('quick-currency', currency);
  document.getElementById('quick-amount').value = value;
  updateConversion('quick');
  document.getElementById('quick-note').focus();
}

// A search over every currency, the person's own first.
function openConvertPicker(side, search) {
  search = typeof search === 'string' ? search : '';
  const query = search.trim().toLowerCase();
  const first = activeCurrencies().concat(['EUR', 'USD', 'GBP', 'THB', 'MXN', 'AUD', 'CHF', 'JPY', 'IDR', 'VND', 'INR']).filter((c, i, list) => list.indexOf(c) === i);
  const pool = allCurrencyCodes().concat(activeCurrencies()).filter((c, i, list) => list.indexOf(c) === i);
  const rank = (c) => (c.toLowerCase().startsWith(query) ? 0 : first.includes(c) ? 1 + first.indexOf(c) : 100);
  const found = (query
    ? pool.filter(c => c.toLowerCase().includes(query) || currencyName(c).toLowerCase().includes(query)).sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    : first.filter(c => pool.includes(c))).slice(0, 8);
  const now = CONVERT[side];
  const body = openSetSheet(side === 'from' ? 'Currency of the amount' : 'Currency of the result', `
    <input type="text" id="cv-search" placeholder="Search, for example dollar or USD" autocomplete="off" autocapitalize="off" enterkeyhint="search" aria-label="Search currencies">
    <div class="set-list">${found.map(code => `<button type="button" class="set-row" data-cv="${code}"><b class="code">${code}</b><span class="grow">${escapeHTML(currencyName(code))}</span>${code === now ? `<span class="pro-value">Chosen</span>` : ''}</button>`).join('') || `<p class="set-note">No currency with that name.</p>`}</div>
  `);
  const input = document.getElementById('cv-search');
  input.value = search;
  input.addEventListener('input', () => {
    openConvertPicker(side, input.value);
    const again = document.getElementById('cv-search');
    again.focus();
    again.setSelectionRange(again.value.length, again.value.length);
  });
  body.querySelectorAll('[data-cv]').forEach(btn => btn.addEventListener('click', () => {
    const code = btn.dataset.cv;
    const other = side === 'from' ? 'to' : 'from';
    // the same currency on both sides would only say 1 = 1, so the two change places
    if (CONVERT[other] === code) CONVERT[other] = CONVERT[side];
    CONVERT[side] = code;
    closeSetSheet();
    renderConvert();
  }));
}
