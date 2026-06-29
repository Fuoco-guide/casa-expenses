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
- **`paidBy`** (`'debora'` or `'victor'`, see the `PEOPLE` array) is stored on every expense, set via the new toggle on every add/edit form, defaulting to whoever's phone it is. The Analysis tab's "Who paid the house this month" card (`buildWhoPaidCard` in `app.js`) sums `amountEUR` grouped by `paidBy`, explicitly filtered to `isSharedCategory()` categories only, so Debora's personal category is never counted in it even though every expense carries a `paidBy` value.

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

## Design system
- Colors: terracotta `#E2725B` (brand), sage `#8FA888` (remaining), clay `#C97B63` (spent within budget), deep maroon `#8B3A3A` (over budget arc only), warm ivory `#FBF6EE` (background), pale terracotta `#FAF0E8` (cards), warm charcoal `#3A2E2A` (text)
- Fonts: Fraunces for headings and big euro numbers, Inter for everything else, both self hosted in `fonts/`
- Why: the brief was "money should feel like a friend," so the palette draws from hospitality and food rather than corporate banking blue and gray. The over budget state stays visible but never alarming, no red alert colors, no warning icons, just a calm deep maroon and plain text.

## The wheel charts
Hand rolled SVG rings (`ringSVG` in `app.js`), not a charting library, so there is zero external dependency. Sage = remaining, clay = spent, maroon = over budget. Once spending passes the budget, the ring fills fully and a second, thinner arc appears just outside it representing the overage, like a second lap. The center text always states the actual number and a word ("left" or "over"), so the meaning never depends on color alone.

## Current status — 29 June 2026
**Permanently hosted and live at https://fuoco-guide.github.io/casa-expenses/** (GitHub Pages, source repo `Fuoco-guide/casa-expenses`, served from the `main` branch root). Single user version is fully tested. The Debora + Victor sync version (identity setup, Paid by, Firestore, Who Paid card) is built and live in fallback mode, but **Firestore sync is not yet active**, `FIREBASE_CONFIG` in `app.js` still holds placeholder values. Waiting on Debora to create the Firebase project and send the real config plus confirm the security rules are published, see "Two people, one house budget" above for the exact steps she was given. Once that config is in, both phones should redo "Add to Home Screen" pointing at the live link above (not the old local WiFi address) for the icon to keep working away from home.

## How to make updates
1. Edit the files directly in `~/CLAUDE/CASA-EXPENSES/`
2. Test locally first: `cd ~/CLAUDE/CASA-EXPENSES && python3 -m http.server 8743`, then open `http://localhost:8743/index.html`. With `FIREBASE_READY` false this exercises everything except real cross device sync.
3. After editing `app.js`, `styles.css`, or `index.html`, bump `CACHE_NAME` in `sw.js` (e.g. v3 to v4). Otherwise the service worker keeps serving the old cached version to anyone who already added the app to their home screen, this bit us once already during testing.
4. Push the change to the live site: clone or use a working copy of `https://github.com/Fuoco-guide/casa-expenses`, copy in the updated files, commit, and push to `main` with a token that has Contents: Read and write on that repo (a fine-grained PAT scoped to just this repo, ask Debora to generate one the same way as the original setup if a working one isn't already available, GitHub Pages auto-rebuilds within a minute or two of any push to `main`). Do not commit secrets, `FIREBASE_CONFIG` is fine since it is not sensitive by design, but never put a deploy token in a file in the repo.
5. To test the real Firebase sync end to end once it's connected: open the app in two separate browser profiles or devices, set one to Debora and one to Victor, add an expense on one, confirm it appears on the other without a manual reload

## Rules
- No Notion, no backend, no accounts beyond what is documented above. The Firebase exception exists only to sync the 5 shared house categories between two phones, and the exchange rate fetch is a separate, unrelated read only call, neither should grow into anything bigger without her asking.
- Debora's personal category is local only, on principle, not just in the UI. Never change this to "store it in Firestore but hide it from Victor's view."
- No dashes in any copy, including this file.
- Keep the tone calm and non judgmental everywhere, even in over budget states, that is the whole point of the project.
