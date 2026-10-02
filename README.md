# Perk Done

A small Chrome extension for keeping track of credit card perks — without another account, a bank connection, or a server.

**TypeScript · React · Manifest V3 · Chrome Sync**

![Perk Done dark dashboard](docs/screenshots/dashboard-dark.png)

[View the compact popup](docs/screenshots/popup-dark.png)

## What's inside

- **Toolbar popup:** see perks that expire this quarter and mark them done, then return to what you were doing.
- **Full dashboard:** manage cards and view an equal-width annual timeline. Monthly, quarterly, semiannual, and calendar-year perks share the same 12-month axis.
- **Monochrome UI:** black, white, and gray, with light, dark, and system themes. Theme preferences sync between extension surfaces and devices.
- **Multiple cards per product:** distinguish cards with nicknames and optional **4–5 digit suffixes**, including Amex's last five digits. Existing suffixes can be edited without losing records.
- **Manual completion:** `Done(6/21)`, historical date entry, date corrections, and undo.
- **Hidden perks:** use the eye icon beside a perk to hide it from the timeline and quarter's todo count. The card's `…` control says **Show hidden perks** on hover or keyboard focus and lets you restore them. Hidden perks retain their completion history.
- **Custom cards and perks:** add products not in the bundled catalog.
- **Actual validity dates:** set bank-reported ranges for cardmember-year credits and certificates instead of treating them as calendar-year credits.

There are no dollar-value or yearly-completion score cards. The dashboard focuses on what still needs attention this quarter.

## Install locally / 本地安装

1. Open `chrome://extensions` in Chrome and enable **Developer mode / 开发者模式**.
2. Click **Load unpacked / 加载已解压的扩展程序** and choose the project's **`dist`** folder.
3. Pin Perk Done to the toolbar. Clicking it opens a compact popup.
4. Choose **打开完整面板** for card management and the annual timeline.

When upgrading from v0.1, rebuild and click **Reload / 刷新** on the existing extension. Keep the same folder/extension identity; removing and reinstalling may delete local data. Existing cards, custom perks, optional four-digit suffixes, and completion dates are preserved.

```sh
# Node.js 24 LTS recommended
npm ci
npm run dev      # local preview; independent browser-local storage
npm test         # model, storage, migration, deadline and catalog tests
npm run build    # creates dist, ready for Load unpacked
npm run package  # creates release/perk-done-0.2.0.zip
```

Preview routes:

- `http://127.0.0.1:5173/` — dashboard
- `http://127.0.0.1:5173/popup.html` — popup layout
- Add `?demo=1` to either route to inspect sample data. Sample records are not saved.

The preview server is for development only. The installed extension contains its own code and catalog and does not need that server to run.

## Bundled card catalog

Edit **[`src/data/cards.json`](src/data/cards.json)** to maintain the products and benefits. No API, secret keys, recurring fetches, remote scripts, database, or scraping service is used.

Currently included:

| Bank | Product |
| --- | --- |
| American Express | The Platinum Card — U.S. personal |
| American Express | Gold |
| American Express | Hilton Honors Aspire |
| American Express | Hilton Honors Surpass |
| American Express | Hilton Honors — no annual fee |
| Chase | Sapphire Preferred / CSP |
| Chase | Sapphire Reserve / CSR |
| Chase | Marriott Bonvoy Boundless |
| Chase | The Ritz-Carlton Card / 栗子卡 |
| Chase | IHG One Rewards Premier |

The no-fee Hilton Honors card is available to add, but has no fixed recurring reimbursement or annual free-night award; the app does not invent one. Add any personal offers as custom perks.

This is a **trackable-perk catalog**, not a list of every card's points earning, insurance, status, signup bonus, or conditional merchant offer. Enrollment requirements and issuer rules still apply. Variants such as Business, Schwab, and Morgan Stanley Platinum may have different terms.

### Updating JSON

Each product has a stable `productId`, source URL, verification date, aliases, and a `benefits` array. Each perk has a stable `id`, `name`, per-period `amount`, `frequency`, and a brief `note`.

Supported frequencies: `monthly`, `quarterly`, `semiannual`, `annual` (calendar year), and `manual` (explicit bank-reported validity dates).

Optional fields:

- `decemberExtra`: December bonus, such as Platinum Uber Cash.
- `valueLabel`: a non-cash label, such as a free-night point limit.
- `validFrom` / `validUntil`: validity boundaries for limited-time or discontinued perks.
- `expiryOffsetDays`: actual expiry after a calendar period. IHG United TravelBank uses 15 days, so a July–December deposit expires on January 15 of the next year.
- `source`: an additional perk-specific evidence link when needed.

Keep existing product and perk IDs unchanged to preserve completion records. Rebuild after editing the catalog. Existing saved cards read updated catalog values and new perks while retaining their instance IDs, custom perks, hidden settings, and manually entered dates. To discontinue a perk, set `validUntil` instead of deleting its ID. Removing a catalog ID deliberately is not a record-deletion or migration mechanism.

### Quarter todo rules

The popup and dashboard count **incomplete, visible periods expiring between today and the end of the current quarter**. Each monthly deadline is a separate item. Future months in the same quarter appear as “未开始” and cannot be completed early. Expired periods are excluded. The focus always uses today's quarter even when browsing another timeline year.

Calendar-year and semiannual perks appear when their actual expiration falls in the current quarter. Bank-reported manual ranges are included only after you set them. A cardmember-year credit has no assumed December deadline. Changing a manual date range creates a separate completion key and retains the former record. The dashboard displays the currently configured range; to track multiple simultaneously valid certificates, add separate custom perks.

IHG TravelBank's expiry can cross the calendar year; the quarter todo checks the previous year's periods too. The timeline shows its half-year deposit period and explicitly labels the later expiration date. Manual periods are shown as a labeled date range spanning the row; they do not imply a January–December reset.

## Verification and sources

Catalog review date: **2026-10-01**. Exact amounts, eligibility, enrollment, billing-cycle reset dates, and certificate expiry should be checked against the issuer account. Card headers link to official terms.

Official sources used for the current catalog:

- [Amex Platinum benefits](https://global.americanexpress.com/card-benefits/view-all/platinum)
- [Platinum lifestyle benefits](https://www.americanexpress.com/en-us/credit-cards/credit-intel/amex-platinum-benefits/)
- [Platinum wellness and shopping](https://www.americanexpress.com/en-us/credit-cards/credit-intel/american-express-platinum-shopping-benefits/)
- [Platinum Uber One credit](https://global.americanexpress.com/card-benefits/detail/uber-one-credit/platinum)
- [Amex CLEAR+ benefit](https://www.americanexpress.com/en-us/travel/benefits/clear/)
- [Amex Gold](https://www.americanexpress.com/us/credit-cards/card/gold-card/)
- [Hilton Aspire](https://www.americanexpress.com/us/credit-cards/card/hilton-honors-aspire/)
- [Hilton Surpass](https://www.americanexpress.com/us/credit-cards/card/hilton-honors-surpass/)
- [Hilton Honors](https://www.americanexpress.com/us/credit-cards/card/hilton-honors/)
- [Chase Sapphire Preferred](https://creditcards.chase.com/rewards-credit-cards/sapphire/preferred)
- [Chase Sapphire Reserve](https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve)
- [Marriott Boundless](https://marriott.chase.com/boundless)
- [Ritz-Carlton](https://marriott.chase.com/ritz-carlton)
- [IHG Premier](https://creditcards.chase.com/travel-credit-cards/ihg-rewards-club/premier)

The discontinued Saks perk's 2026-06-30 cutoff is documented by [NerdWallet's report of American Express's confirmation](https://www.nerdwallet.com/travel/news/amex-platinum-saks-credit); its source is also stored in JSON. It remains for historical tracking and is excluded from later periods.

## Storage and privacy

Only the `storage` permission is requested. No content scripts, bank connection, transaction/history access, analytics, third-party fonts, or personal-data server.

Cards, custom perks, hidden states, actual validity dates, completion records, and theme preferences use `chrome.storage.sync`. Sign in to the same Chrome account and enable sync to sync devices. Offline/disabled sync retains local data; the app cannot determine whether the account is actively syncing. Development-mode cross-device installs also need a consistent extension ID.

[Chrome Sync limits](https://developer.chrome.com/docs/extensions/reference/api/storage): 102,400 bytes total, 8,192 bytes per item, 512 items, plus write-rate limits. Data is separated by card and card/year. Quotas are checked before writes; errors appear in the active dialog. A service worker serializes writes on one device. Chrome can still apply last-writer-wins behavior if different devices edit the same card/year concurrently; this version does not resolve distributed conflicts. Uninstalling can remove data. Keep a backup of important records outside the app.

`PRIVACY.md` describes what this release stores. The browser preview has a separate `localStorage` wallet and is not automatically migrated into extension storage.

## Browser checks

```sh
npm run build
npm run dev # keep this running on port 5173
npx playwright install chromium
npm run test:browser
```

The browser test uses a temporary Chromium profile and the actual unpacked extension. It checks popup configuration, Chrome storage persistence, five-digit suffixes, year isolation, hidden/restore behavior, theme syncing/system mode, quick completion, bank-reported date ranges, equal timeline widths, and narrow-screen layouts. It does not use your personal Chrome profile or verify your Google account's cross-device sync. Screenshots are written to ignored `test-results/`.

For an existing Chrome-for-Testing installation, pass its executable path through `CHROME_EXECUTABLE`.

## Publishing

`release/perk-done-0.2.0.zip` contains only the built extension. Source, dependencies, tests, screenshots, and personal records are excluded. The extension has not been published to the Chrome Web Store.

The GitHub repository stores the source. Rebuild locally for Load unpacked. Chrome Web Store distribution additionally needs a developer registration, a one-time registration fee, listing screenshots, and a publicly accessible privacy policy.
