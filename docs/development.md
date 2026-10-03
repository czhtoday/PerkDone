# Development notes

[Project overview](../README.md) · [Contribution guidelines](../CONTRIBUTING.md)

## Bundled card catalog

Edit **[`src/data/cards.json`](../src/data/cards.json)** to maintain the products and benefits. No API, secret keys, recurring fetches, remote scripts, database, or scraping service is used.

**49 selectable products**. Initial review: October 1, 2026; Chase/IHG, Hilton and selected premium-card follow-up: October 3, 2026. Per-product dates are recorded in JSON:

| Issuer | Included families |
| --- | --- |
| American Express | Platinum (personal, Business, Schwab, Morgan Stanley), Gold / Business Gold, Green, Hilton Aspire / Surpass / Business, Marriott Brilliant / Bevy / Business, Delta Gold / Platinum / Reserve (personal and Business), Blue Cash Preferred / Everyday |
| Chase | Sapphire Preferred / Reserve / Reserve for Business, Marriott Boundless / Bountiful, Ritz-Carlton, IHG Premier / Premier Select / Business, Hyatt / Hyatt Business, Aeroplan, United Explorer / Quest / Club / Business / Club Business |
| Capital One | Venture X / Venture X Business |
| Citi | Strata Premier / Elite, AAdvantage Executive / Globe |
| Bank of America | Premium Rewards / Premium Rewards Elite |
| Column / Bilt | Bilt Obsidian / Palladium |
| Wells Fargo | Autograph Journey |

See the [complete catalog review](catalog-review.md) for each product's official source, fee, tracked perks, eligibility decisions and deferred candidates. Zero-fee products without recurring credits are omitted from the picker. Previously added Hilton Honors cards remain accessible; Blue Cash Everyday stays eligible because it has a monthly streaming credit.

This is a **trackable-perk catalog**, not a list of every card's points earning, insurance, status, signup bonus, or conditional merchant offer. Enrollment requirements and issuer rules still apply. Business and co-branded variants have independent catalog IDs and notes. Relationship-specific rewards can be added as custom perks.

### Card artwork

Artwork is downloaded from public issuer and co-brand product pages and bundled in `public/cards/`. Products with verified artwork include a local `image` path and the original `imageSource` URL. There are 48 local images for 49 selectable products; Schwab currently uses the fallback icon rather than another card’s artwork. [`public/cards/sources.json`](../public/cards/sources.json) records the exact sources. Existing cards pick up artwork from the catalog when loaded. The extension never fetches issuer images at runtime and needs no host permissions. Card imagery and trademarks belong to their respective issuers; the app uses them for product identification and is not affiliated with those issuers.

### Updating JSON

Each product has a stable `productId`, source URL, verification date, aliases, default `annualFee` in USD, and a `benefits` array. Each perk has a stable `id`, `name`, per-period `amount`, `frequency`, and a brief `note`.

Supported frequencies: `monthly`, `quarterly`, `semiannual`, `annual` (calendar year), and `manual` (optional bank-reported validity dates; otherwise flexible yearly tracking).

Optional fields:

- `trackAmount`: enables a small cumulative-used-amount editor. Reaching the cap sets Done; reducing it clears Done. Use only for cumulative credits, not single-use vouchers.
- `amountChanges`: date-effective amount changes; earlier periods keep earlier values (CSR DoorDash and Business The Edit).
- `windows`: explicit non-recurring offer windows; no periods appear outside them. `hidden` can exclude eligibility-specific offers until the user restores them.
- `decemberExtra`: December bonus, such as Platinum Uber Cash.
- `valueLabel`: a non-cash label, such as a free-night point limit.
- `validFrom` / `validUntil`: validity boundaries for limited-time or discontinued perks.
- `expiryOffsetDays`: actual expiry after a calendar period. IHG United TravelBank uses 15 days, so a July–December deposit expires on January 15 of the next year.
- `source`: an additional perk-specific evidence link when needed.

Keep existing product and perk IDs unchanged to preserve completion records. Rebuild after editing the catalog. Existing saved cards read updated catalog values and new perks while retaining their instance IDs, custom perks, hidden settings, and manually entered dates. To discontinue a perk, set `validUntil` instead of deleting its ID. Removing a catalog ID deliberately is not a record-deletion or migration mechanism.

### Quarter todo rules

The popup and dashboard count **incomplete, visible periods expiring between today and the end of the current quarter**. Each monthly deadline is a separate item. Future months in the same quarter appear as “Upcoming” and cannot be completed early. Expired periods are excluded. The focus always uses today's quarter even when browsing another timeline year.

Calendar-year and semiannual perks appear when their actual expiration falls in the current quarter. Bank-reported manual ranges are included only after you set them. A cardmember-year credit has no assumed December deadline. Changing a manual date range creates a separate completion key and retains the former record. The dashboard displays the currently configured range; to track multiple simultaneously valid certificates, add separate custom perks.

IHG TravelBank's expiry can cross the calendar year; the quarter todo checks the previous year's periods too. The timeline shows its half-year deposit period and explicitly labels the later expiration date. Undated manual perks can be completed with one click (or an amount entry), grouped by the selected year, with no inferred deadline. Known manual periods are shown as a labeled date range spanning the row; they do not imply a January–December reset.

## Verification and sources

Latest catalog update: **2026-10-03**; individual product verification dates remain in JSON. Exact amounts, eligibility, enrollment, billing-cycle reset dates, and certificate expiry should be checked against the issuer account. Card headers link to official terms.

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
- [Platinum annual fee](https://www.americanexpress.com/en-us/credit-cards/credit-intel/platinum-fee/)
- [Marriott Chase card fees](https://help.marriott.com/s/article/marriott-bonvoy-chase-credit-cards)
- [IHG Premier](https://creditcards.chase.com/travel-credit-cards/ihg-rewards-club/premier)

The discontinued Saks perk's 2026-06-30 cutoff is documented by [NerdWallet's report of American Express's confirmation](https://www.nerdwallet.com/travel/news/amex-platinum-saks-credit); its source is also stored in JSON. It remains for historical tracking and is excluded from later periods.

## Annual fees and used value

The popup uses the current calendar year across **all cards**, independent of dashboard filters. The first number sums actual annual fees (editable when adding or editing a card); the second sums recorded partial amounts and the face value of completed periods without amount records. Example: Aspire $550 / $600 → **Net earned $50**. Undo reduces used value. Hidden completed credits still count.

A one-click completion without an amount record assumes the entire period credit was used. Amount-enabled credits count the entered amount, including partial usage, once. This is an estimate, not bank-verified reimbursement or a measure of actual profit. Free-night certificates have zero automatic cash value; signup bonuses, points, taxes and additional spending are excluded. Calendar perks are attributed to their timeline year, even when recorded later. Manual credits use the completion-date year, including retained records from earlier date ranges. Annual fees represent current configured fees, not a historical billing ledger; adjust for waivers, introductory offers or personal pricing. Catalog defaults are the public standard annual fees.

## Storage and privacy

Only the `storage` permission is requested. No content scripts, bank connection, transaction/history access, analytics, third-party fonts, or personal-data server.

Cards, display order, custom perks, hidden states, optional actual validity dates, entered amounts, completion records, annual fee overrides, theme and language preferences use `chrome.storage.sync`. Sign in to the same Chrome account and enable sync to sync devices. Offline/disabled sync retains local data; the app cannot determine whether the account is actively syncing. Development-mode cross-device installs also need a consistent extension ID.

[Chrome Sync limits](https://developer.chrome.com/docs/extensions/reference/api/storage): 102,400 bytes total, 8,192 bytes per item, 512 items, plus write-rate limits. Data is separated by card and card/year. Quotas are checked before writes; errors appear in the active editor or page. A service worker serializes writes on one device. Chrome can still apply last-writer-wins behavior if different devices edit the same card/year concurrently; this version does not resolve distributed conflicts. Uninstalling can remove data. Keep a backup of important records outside the app.

`PRIVACY.md` describes what this release stores. The browser preview has a separate `localStorage` wallet and is not automatically migrated into extension storage.

## Browser checks

```sh
npm run build
npx playwright install chromium
npm run test:browser
```

The browser test uses a temporary Chromium profile and the actual unpacked extension. It checks popup configuration, Chrome storage persistence, five-digit suffixes, year isolation, hidden/restore behavior, theme syncing/system mode, one-click completion, anchored date correction/undo, multi-card filtering, numeric return totals, language sync, equal timeline widths, and narrow-screen layouts. It does not use your personal Chrome profile or verify your Google account's cross-device sync. Screenshots are written to ignored `test-results/`.

For an existing Chrome-for-Testing installation, pass its executable path through `CHROME_EXECUTABLE`.


## 0.5.0 compatibility

Existing `pd:card:*` and `pd:year:<card>:<year>` records stay compatible. Completion values remain date strings. Partial amounts are stored separately in `pd:amount:<card>:<year>` with amount/date pairs. Undo and card removal clear the corresponding amount records. `pd:order` persists card order; new cards append without changing existing order. Reordering preserves card IDs, history, and selection filters. Catalog hydration retains user-hidden flags, custom perks and explicit schedules.

Undated manual perks use the stable `undated` index for the selected year. They are usable without opening-date or date-range setup and are excluded from expiry counts. This is a tracking bucket, not an inferred bank reset. Optional bank dates use their existing range keys; changing the range retains earlier history.

The real-extension browser test additionally checks partial amount reloads, reaching the cap, undo, certificate completion without dates, arrow/drag sorting after reload, filtering after reorder, and matching dark root/body popup canvases.
