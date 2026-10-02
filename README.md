# Perk Done

**English** · [简体中文](README.zh-CN.md)

A Chrome extension to keep your credit card perks organized. Add your cards, mark benefits done, and see what remains this quarter—without a separate account or bank connection.

**TypeScript · React · Manifest V3 · Chrome Sync · [MIT License](LICENSE)**

![Perk Done dark dashboard](docs/screenshots/dashboard-dark.png)

[View the compact popup](docs/screenshots/popup-dark.png)

## Features

- **One annual timeline.** Monthly, quarterly, semiannual, and annual perks share the same 12-month axis. View all your cards or select a subset.
- **One-click completion.** Mark a period done with today's date. Click it again to correct the date or undo completion.
- **A compact popup.** See your card count, remaining quarter perks, and annual fees versus completed credit value at a glance.
- **Your cards, your names.** Add multiple copies of a product, use a nickname, and distinguish them with optional last-four or last-five digits.
- **Track what matters.** Hide unused perks, restore them later, or add custom cards and benefits. Set actual validity dates for cardmember-year credits and certificates.
- **A bundled catalog.** 48 selectable products across American Express, Chase, Capital One, Citi, Bank of America, Bilt, and Wells Fargo, with locally bundled issuer artwork. No live banking API is needed.
- **Light and dark themes.** Black, white, and gray with a blue completion accent; system theme is also supported.
- **English and Chinese.** English is the default; switch languages inside the extension.
- **Chrome Sync.** Records and preferences sync between desktop Chrome browsers when the same Google account and the relevant sync settings are enabled.

The quarter count includes visible, incomplete periods expiring between today and the end of this quarter. Completed credit value assumes the full amount of each marked period; it is an estimate, not bank-verified reimbursement or actual profit. Free-night certificates and points have no automatic cash value. Check issuer terms for eligibility, enrollment, and expiration rules.

## Install locally

The Chrome Web Store release has been submitted for review. Until it is available, build the extension locally or use an unpacked build supplied by the maintainer.

1. Open `chrome://extensions` in desktop Chrome and enable **Developer mode**.
2. Click **Load unpacked** and select the folder containing `manifest.json`. For a local build, this is `dist`; for a ZIP, extract it first and select the extracted folder.
3. Pin **Perk Done** to the toolbar. Click its icon for the popup, then **Open dashboard** for the annual timeline.

Keep the installed folder in place. To update a local build, replace its files and click **Reload** on the existing extension. Removing and reinstalling may delete records. Local builds and the eventual store installation can have different extension IDs, so records do not automatically transfer between them.

## Development

Use Node.js 24 or newer:

```sh
npm ci
npm run dev      # browser preview
npm test         # model, storage, migration, deadline, and catalog checks
npm run build    # creates dist for Load unpacked
npm run package  # creates a versioned ZIP in release
```

Preview the dashboard at `http://127.0.0.1:5173/` or the popup at `http://127.0.0.1:5173/popup.html`. Add `?demo=1` for sample records. The preview uses a separate local wallet; demo records are not saved. The installed extension runs without the development server.

See [development notes](docs/development.md) for catalog fields, deadline rules, value calculations, storage details, and actual-extension browser checks. See the [catalog review](docs/catalog-review.md) for product sources and verification dates. Keep existing product and benefit IDs stable when contributing catalog updates.

## Privacy

Only the `storage` permission is requested. There is no bank connection, browsing-history access, analytics, or developer-operated wallet server. Wallet records use `chrome.storage.sync`; Google handles synchronization when enabled. Without sync, records remain on the device.

Chrome Sync has a per-extension quota of about 100 KB, with an 8 KB limit per item. The app checks quotas before writes. Cross-device edits can overwrite each other, and uninstalling can remove data; keep an independent backup of important records.

Read the [privacy policy](PRIVACY.md) for stored fields and voluntary feedback emails.

## Contributing and feedback

Issues, catalog corrections, and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

Use [GitHub Issues](https://github.com/czhtoday/PerkDone/issues) or email [perkdonedev@gmail.com](mailto:perkdonedev@gmail.com). The extension's Feedback button opens your email app; nothing is sent automatically.

## License

Original code and documentation are licensed under [MIT](LICENSE). You may fork, study, modify, distribute, and use them commercially while retaining the copyright and license notices.

Third-party card imagery, trademarks, and dependencies retain their own rights. MIT does not grant reuse rights to issuer artwork; see [third-party notices](THIRD_PARTY_NOTICES.md). Perk Done is not affiliated with the issuers.
