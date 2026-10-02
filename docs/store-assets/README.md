# Chrome Web Store assets

- `store-icon-128.png`: 128 × 128 PNG with transparent padding; original monochrome Perk Done double-check mark.
- `dashboard-dark-1280x800.png`: actual dark dashboard using built-in demo records.
- `dashboard-light-1280x800.png`: actual light dashboard using built-in demo records.
- `popup-overview-1280x800.png`: actual demo popup with a short introductory layout.
- `promo-440x280.png`: monochrome small promotional tile.

Screenshots and promotional tile are 24-bit RGB PNGs without alpha. UI screenshots retain the application's blue completion accent and issuer artwork. The surrounding designs and store icon use black, white, and gray.

The source renderer is `scripts/store-assets.mjs`. Rebuild the app before regenerating:

```sh
npm run build
node scripts/store-assets.mjs
```

The renderer uses Playwright Chromium; if needed install it with `npx playwright install chromium`, or set `CHROME_EXECUTABLE` to an existing Chrome-for-Testing binary. It runs against a temporary local server and a separate browser context, not your personal Chrome profile. Demo totals and periods reflect the date when generated.

Original designs use the project MIT License. Issuer imagery retains third-party rights described in `THIRD_PARTY_NOTICES.md`.
