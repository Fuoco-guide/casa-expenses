# Casa Expenses — Project Context

## What this project is
A household expense tracker for Debora and Victor. Started as a personal tool replacing the old workflow of jotting expenses in iPhone Notes and retyping them into Notion. Grew into a shared tool: both of them log expenses on their own phones, the 5 house categories sync between the two phones, and Debora's separate personal category never leaves her device. Fast entry, automatic categorization with a confirm step so a bad guess never slips through silently, and a visual budget picture (wheel charts) that stays calm and friendly instead of feeling like a banking app.

## Where the code lives
Everything is in this folder: `~/CLAUDE/CASA-EXPENSES/`

- `index.html` — all screens (Dashboard, Category detail, Analysis), the identity setup screen, and the modals (quick add, edit, budgets)
- `styles.css` — the whole visual design
- `app.js` — all logic: categories, identity, parsing, rendering, local storage, and the Firestore sync layer
- `manifest.json` + `sw.js` — PWA setup so it can be added to the iPhone home screen and works offline
- `fonts/` — self hosted Fraunces and Inter, no CDN dependency, so it works fully offline
- `icons/` — app icon at the sizes iOS needs

One app, one URL, used by both Debora and Victor. No build step, just static files. Firebase is the one deliberate backend exception, added specifically so the 5 shared house categories can sync between two phones, see "Two people, one house budget" below. The exchange rate fetch (see Currency) is the other network dependency, unrelated to Firebase.

## Two people, one house budget
Plain local storage cannot sync across two separate phones, there is no way around that, so this project uses Firebase (free tier) as the shared piece. Key design choices:

- **One link, asked once.** The first time the app opens on a phone, it asks "Is this Debora's phone or Victor's?" (the `identity-setup` screen in `index.html`, `showIdentitySetup`/`chooseIdentity` in `app.js`). The answer is stored locally as `DATA.identity` and never asked again on that device.
- **`CATEGORIES` is filtered by identity.** `ALL_CATEGORIES` in `app.js` is the full list of 6. The module level `CATEGORIES` variable (not a const, reassigned once identity is known via `categoriesForIdentity()`) is what the rest of the app actually renders from. Victor's `CATEGORIES` excludes `debora`. Almost the entire app reads from `CATEGORIES`, not `ALL_CATEGORIES`, so this one filter point controls visibility everywhere.
- **The `debora` category is the only local only one.** `isSharedCategory(catId)` is simply `catId !== 'debora'`. Everything else (Bills, Transportation, Grocery, Dining Out/Leisure, Extra) is shared. The personal category's expenses and budget stay in `localStorage` exactly like the original single user build, they are never written to Firestore, not even in raw form. This is deliberate, not a UI filter, do not change it to "store everything in Firestore and just hide it in the UI" even if it seems simpler, that would put her personal spending data somewhere Victor's account can technically reach.
- **`addExpense`/`updateExpense`/`deleteExpense` route by category.** If `isSharedCategory()` is true and `FIREBASE_READY` (see below), the write goes to Firestore via `addSharedExpense`/`updateSharedExpense`/`deleteSharedExpense`. Otherwise it goes to the local `DATA.expenses` array exactly as before. Same pattern for budgets in the `form-budgets` submit handler, `saveSharedBudgets` for the 5 shared categories, plain `saveData()` for the `debora` one.
- **Sync is real time via `onSnapshot`,** not polling. `startSharedSync()` in `app.js` signs in anonymously, then listens on the `expenses` collection and the `meta/budgets` document, merging whatever it receives into the local `DATA.expenses`/`DATA.budgets` and re-rendering. This is what makes "Victor adds something and it shows up on Debora's phone" work without either of them refreshing.
- **`paidBy`** (`'debora'` or `'victor'`, see the `PEOPLE` array) is stored on every expense, set via the new toggle on every add/edit form, defaulting to whoever's phone it is. The Analysis tab's "Who paid the house this month" card (`buildWhoPaidCard` in `app.js`) sums `amountEUR` grouped by `paidBy`, explicitly filtered to `isSharedCategory()` categories only, so Debora's personal category is never counted in it even though every expense carries a `paidBy` value. Since 8 July 2026 this card always renders for `currentMonthKey()`, independent of `renderAnalysis`'s month-over-month history check, so it doesn't disappear just because there's only one month of data (this broke once when June's expenses were deleted, leaving only July, and the whole card vanished along with the comparison table it used to share a gate with).

### Firebase setup
- `FIREBASE_CONFIG` near the top of `app.js` holds the project's web config (apiKey, projectId, etc). These values are not secret, Firebase's own security model is the Firestore rules, not hiding the config.
- `FIREBASE_READY` is `false` whenever `FIREBASE_CONFIG.apiKey` is still the placeholder string. While `false`, every category (including the 5 normally shared ones) falls back to local storage only, so the app stays fully testable and functional even before Firebase is connected. Once Debora pastes in the real config, this flips to `true` automatically.
- Auth is anonymous (`signInAnonymously`), no login screen, paired with Firestore rules requiring `request.auth != null` on the `expenses` collection and the `meta/budgets` document. This is a real, deliberate floor (blocks unauthenticated drive by access) but not bank grade security, it relies on only Debora and Victor ever having the config. Fine for this use case, do not present it as more secure than that.
- Firestore SDK is loaded via dynamic `import()` of the CDN modular SDK (`https://www.gstatic.com/firebasejs/10.12.2/...`) directly inside `app.js`, not via a `<script type="module">` tag in `index.html`. This was a deliberate choice to avoid converting the whole app to a module script for one feature.
- `enableIndexedDbPersistence` is attempted (wrapped in try/catch since it can fail in private browsing) so the shared categories degrade reasonably offline too, on top of the local-only `debora` category which was always offline safe.

## How data is stored
Single localStorage key `casa-expenses-v1` on each phone, holding:
- `expenses`: array of `{id, date, amount, currency, amountEUR, category, note, payment, paidBy}`. For shared categories this is a local mirror of Firestore, kept fresh by the `onSnapshot` listener. For the `debora` category it is the only copy that exists anywhere.
- `budgets`: `{categoryId: monthlyBudget}`, same shared/local split as expenses.
- `exchangeRate`: `{rate, updatedAt}`, the last known THB per EUR rate, per device, not synced (it is just a public reference rate, no need to share it).
- `lastCurrency`: the currency used last time, so new entries default to it.
- `identity`: `'debora' | 'victor' | null`, set once per device by the identity setup screen.

The overall budget shown on the Dashboard is always the sum of all budgets in `CATEGORIES` (already filtered by identity). All totals, wheels, and the Analysis tab always use `amountEUR`, never the raw `amount`, since `amount` can be in either currency.

## Currency (EUR and THB)
Debora splits time between Europe and Thailand, so an expense can be entered in EUR or THB. Everything that aggregates (wheels, budgets, Analysis) is always in EUR. Each expense stores both its original `amount` + `currency` (shown as the primary figure in the expense list, since that is what she actually paid) and a frozen `amountEUR` (used for all math, shown as a small "≈ €X" note under THB entries).

The EUR conversion is frozen at the moment the expense is saved (add or edit), using whatever rate is current then. It never recalculates later even if the exchange rate updates, on purpose, so a past month's EUR totals never silently shift just because today's rate moved. This is standard practice for any multi currency ledger, do not change it to a "live recompute" model.

The rate itself auto refreshes from `https://api.frankfurter.dev/v1/latest?from=EUR&to=THB` (free, no key, CORS enabled, ECB based) once per app load, stored in `DATA.exchangeRate`. If the fetch fails (offline), it falls back to the last known rate, or to `DEFAULT_THB_PER_EUR` in `app.js` if there has never been a successful fetch. Visible in Settings with a manual refresh button. Note: this was originally `api.frankfurter.app`, which started redirecting to the `.dev` domain and broke CORS in the browser, if the rate ever silently stops updating, check whether the API has moved domains again.

## Categories
Defined in the `ALL_CATEGORIES` array at the top of `app.js`:
1. Bills — rent, utilities, insurance (shared)
2. Transportation — gasoline, train, Grab, Uber (shared)
3. Grocery — food, cleaning products, household (shared)
4. Dining Out / Leisure — dinners, wine, aperitivo, gelato, cinema, museum (shared)
5. Debora — her own personal spending (local only, see "Two people, one house budget" above)
6. Extra — gifts, one off costs (shared)

Each category carries a keyword list used to guess the category from the freeform "Add" text (e.g. "gasoline" matches Transportation, by whole word match, not substring, so "gas" does not falsely match "gasoline" into Bills). To add, rename, or re-icon a category, `ALL_CATEGORIES` is the only place to touch, just remember a new category defaults to shared unless you also exclude it in `isSharedCategory()`.

## Voice input (added 4 July 2026)
The quick add sheet has a mic button next to the freeform text field, plus a small IT/EN pill. Tapping the mic starts the browser's Web Speech API (`setupVoice` in `app.js`), streams the transcript into the same `quick-add-input`, and runs it through the existing `parseQuickInput`, so voice and typing share one pipeline, there is no separate voice parser. The user still confirms with Save expense, deliberately: speech recognition mishears numbers and this is money data.

- The IT/EN pill sets `recognition.lang` (`it-IT` or `en-US`) and persists per device as `DATA.voiceLang`. First time default: Italian on Debora's phone, English on Victor's, derived from `DATA.identity`.
- `parseQuickInput` understands spoken dates in both languages (ieri, oggi, yesterday, today, "il 22 settembre", "september 22", "22nd of september") and spoken currency words (euro, euros, baht, also "bath" since recognizers often transcribe baht that way). Currency words select EUR or THB exactly like the typed flow.
- Keyword alternations in the amount and cleanup regexes must stay longest first (euros before euro before eur), otherwise "15 euros" leaves "os" in the note. This bit us once during the build.
- If the browser has no SpeechRecognition support, the mic and pill hide themselves and typing works as always. On iOS the feature needs Siri and Dictation enabled, and support inside home screen PWAs can lag behind Safari itself.

## Spending breakdown modal (added 8 July 2026)
Tapping the overall dashboard wheel (`#overall-wheel`, now `role="button" tabindex="0"`) opens `#modal-spend-summary` via `openSpendSummary()` in `app.js`. It shows exactly what makes up the number just tapped: the `buildWhoPaidCard(monthKey)` bar (Debora vs Victor, house categories only) followed by `buildSpendSummaryHTML`'s per-category rows, one per shared category, each showing its total plus a Debora/Victor split computed the same way `buildWhoPaidCard` does (`amountEUR` grouped by `paidBy`). Filtered to `isSharedCategory()` throughout, so the personal Debora category never appears in this modal, consistent with the wheel it explains. Uses `state.month`, the month currently browsed on the dashboard, not always the real current month.

## Search (added 2 August 2026)
All logic in `search.js`, wired by `wireSearch()` in `finishInit()`. At rest the dashboard shows only a magnifier glyph in `.topbar-right` next to the currency pill: no field, no placeholder. Tapping it reveals the field and focuses it; the × or Escape clears the query and restores the dashboard exactly. The glyph turns terracotta while open.

**It searches every expense ever, not the month on screen.** If you are searching you do not know when it was. While a query is present the wheel, the category grid and the month arrows are hidden and results replace them, grouped by month with a subtotal per month. Rows reuse `expenseRowEl()`, so tapping a result opens the normal edit modal.

`searchBlob(e)` flattens one expense into a single string: the note, the amount in several written shapes (raw, two decimals, comma decimals, rounded, plus the EUR conversion on THB entries), the currency and its word, the date in many shapes (ISO, `31/07`, day number, month and weekday names in English **and** Italian), the category label and id, who paid, the payment method, and the name of any Moment it falls inside. `foldText()` strips accents, so "caffe" finds "caffè". Multiple terms narrow (every term must match), each term can land on any field. Consequence to keep in mind: a bare number matches amounts **and** dates, so "25" returns things costing 25 and things bought on the 25th. That follows directly from the brief of one field for anything.

## Moments (trips) (added 2 August 2026)
A Moment is **a name plus a date range**, not a tag on each expense, so the Add flow is completely untouched. All logic in `moments.js`. Lives in its own fourth tab, `#view-moments`, holding every moment ever, newest first, grouped by year with a grand total. **There is deliberately nothing on the dashboard**, per Debora on 2 August: trips belong in their own tab, not under the categories where they read like a seventh category.

- **Shared categories only.** `momentExpenses()` filters by `isSharedCategory()`, and detection reads `sharedExpenses()`. The personal Debora category is excluded on purpose, matching the overall wheel and `buildWhoPaidCard`: the trip screen shows a who paid split that personal spending would poison, and both phones must show the same total for the same trip.
- **Detection asks, it never decides.** `detectCandidates()` groups spending days into runs (one empty day inside a run is tolerated) and scores them: travel words in the note (+3, +1 more for three or more), total at least double the median daily spend (+2), contains a weekend day (+1), lasts 2 to 4 days (+1). Threshold 5. Hard gates before any scoring: **at least 4 expenses**, and **2 to 6 days**. Two expenses over a weekend is just a Saturday, and asking about it makes the app feel nosy.
- **No location, no GPS, no permission prompt.** A PWA cannot track position in the background, especially on iOS, so it would cost a scary permission on a money app and still give an incomplete answer. `whyText()` shows exactly what was noticed, so the guess never feels like magic.
- **A late expense joins silently and says so.** `noticeMomentJoin()` at the end of `addExpense()` shows a toast with one tap to drop it back out. Deliberately not a question: a modal there would interrupt every ordinary entry near those dates. Undo adds the id to `excludedIds`, it never deletes the expense.
- **A trip crossing a month boundary belongs to both months.** `momentsForMonth()` matches on either end of the range.

### Two things that bit during the build, do not undo them
1. **All date maths in `moments.js` is UTC.** Building a local midnight `Date` and reading it back with `toISOString()` returns the previous day in any positive offset, which turned the day loop in `scoreRun()` into an infinite loop that wedged the browser. Keep `T00:00:00Z` and `setUTCDate`.
2. **`maybeAskAboutTrip()` is called from the `expenses` `onSnapshot` handler, not only from `finishInit()`.** Expenses arrive from Firestore asynchronously, so the call on page load runs against an empty ledger and finds nothing. This did not show up in local testing because the test data was in localStorage and therefore instant. The `tripQuestionAsked` flag keeps it to one question per page load.

### Moments are per device for now
They live in `localStorage`, not Firestore, so a trip named on Debora's phone does not appear on Victor's. Verified on 2 August 2026: the Firestore rules list collections explicitly, and a read of `moments` returns **403** while `expenses` and `loans` return 200. To make trips shared, add this alongside the existing blocks in the Firebase console rules, then the sync needs wiring in `startSharedSync()` following the `loans` pattern:

```
match /moments/{doc} { allow read, write: if request.auth != null; }
```

## Design system
- Colors: terracotta `#E2725B` (brand), sage `#8FA888` (remaining), clay `#C97B63` (spent within budget), deep maroon `#8B3A3A` (over budget arc only), warm ivory `#FBF6EE` (background), pale terracotta `#FAF0E8` (cards), warm charcoal `#3A2E2A` (text)
- Fonts: Fraunces for headings and big euro numbers, Inter for everything else, both self hosted in `fonts/`
- Why: the brief was "money should feel like a friend," so the palette draws from hospitality and food rather than corporate banking blue and gray. The over budget state stays visible but never alarming, no red alert colors, no warning icons, just a calm deep maroon and plain text.

## The wheel charts
Hand rolled SVG rings (`ringSVG` in `app.js`), not a charting library, so there is zero external dependency. Sage = remaining, clay = spent, maroon = over budget. Once spending passes the budget, the ring fills fully and a second, thinner arc appears just outside it representing the overage, like a second lap. The center text always states the actual number and a word, so the meaning never depends on color alone.

Since 4 July 2026 the center number is the amount **spent**, not the amount left ("€347 / spent of €1.000", or "€150 over budget" when over), per Debora's request. Same for the category detail wheel, one ring, one meaning. The overall dashboard wheel counts **only the 5 shared house categories** in both its spent total and its budget total (`overallBudget` and `renderDashboard` filter by `isSharedCategory`). The personal Debora category shows only inside its own category card and detail view, it never enters the overall sum, so Debora's dashboard wheel and Victor's show the same house picture.

## Current status — 29 June 2026
**Fully live at https://fuoco-guide.github.io/casa-expenses/** (GitHub Pages, source repo `Fuoco-guide/casa-expenses`, served from the `main` branch root), with real Firestore sync connected and verified end to end (`FIREBASE_CONFIG` in `app.js` holds the real `casa-expenses` Firebase project values, `FIREBASE_READY` is `true`). Both the single user flow and the Debora + Victor shared sync are tested and working. Both phones should use "Add to Home Screen" pointing at the live link above.

One thing worth knowing for next time: the security rules took several attempts to actually land, the Firestore console's rules editor is easy to think you've published when you haven't (watch for an actual confirmation, not just the "Sviluppa e testa" button which is unrelated, that one opens an Emulator Suite info panel). If sync ever silently stops working again, the fastest diagnostic is the one used here: sign in anonymously via `POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=<apiKey>` with `{"returnSecureToken":true}`, then `GET https://firestore.googleapis.com/v1/projects/casa-expenses/databases/(default)/documents/expenses` with that token as a Bearer header. A clean `{}` or real documents means rules are fine, a 403 `permission-denied` means the rules need fixing, check they match the actual collection paths used in `app.js` (`expenses` and `meta/budgets`), not just that something is published.

## How to make updates
1. Edit the files directly in `~/CLAUDE/CASA-EXPENSES/`
2. Test locally first: `cd ~/CLAUDE/CASA-EXPENSES && python3 -m http.server 8743`, then open `http://localhost:8743/index.html`. `FIREBASE_CONFIG` already holds the real, live project values, so local testing exercises real Firestore sync too, not just fallback mode.
3. After editing `app.js`, `styles.css`, or `index.html`, bump `CACHE_NAME` in `sw.js` (e.g. v4 to v5). Otherwise the service worker keeps serving the old cached version to anyone who already added the app to their home screen, this bit us once already during testing.
4. Push the change to the live site: clone or use a working copy of `https://github.com/Fuoco-guide/casa-expenses`, copy in the updated files, commit, and push to `main` with a token that has Contents: Read and write on that repo (a fine-grained PAT scoped to just this repo, ask Debora to generate one the same way as the original setup if a working one isn't already available, GitHub Pages auto-rebuilds within a couple of minutes of any push to `main`, can take a bit longer than expected, poll `app.js` for the change before assuming it failed). Do not commit secrets, `FIREBASE_CONFIG` is fine since it is not sensitive by design, but never put a deploy token in a file in the repo.
5. To test real Firebase sync end to end: open the app in two separate browser profiles or devices, set one to Debora and one to Victor, add an expense on one, confirm it appears on the other without a manual reload. Already verified working as of this status date.

## Rules
- No Notion, no backend, no accounts beyond what is documented above. The Firebase exception exists only to sync the 5 shared house categories between two phones, and the exchange rate fetch is a separate, unrelated read only call, neither should grow into anything bigger without her asking.
- Debora's personal category is local only, on principle, not just in the UI. Never change this to "store it in Firestore but hide it from Victor's view."
- No dashes in any copy, including this file.
- Keep the tone calm and non judgmental everywhere, even in over budget states, that is the whole point of the project.
