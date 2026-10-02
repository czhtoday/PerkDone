# Contributing to Perk Done

Fork the repository, create a branch, and open a pull request against `main`.
Bug reports and suggestions are welcome in
[GitHub Issues](https://github.com/czhtoday/PerkDone/issues) or by email at
[perkdonedev@gmail.com](mailto:perkdonedev@gmail.com). Do not post personal card
records, full card numbers, or private account screenshots in public issues.

Use Node.js 24 or newer, then run:

```sh
npm ci
npm run dev
npm test
npm run build
```

For behavior changes, check the relevant popup/dashboard flows in both themes.
For storage changes, preserve existing records and test migration. The README
explains how to run the actual-extension browser checks.

Catalog contributions should cite official issuer terms and include a
verification date. Keep product and perk IDs stable, distinguish calendar-year
from cardmember-year benefits, and use `validUntil` for discontinued perks.
Prefer recurring credits and reimbursements; see `docs/catalog-review.md` for
eligibility rules. Record image sources and respect third-party artwork rights.

Contributions are made under the project's MIT License. Third-party assets must
retain their original licenses and notices; see `THIRD_PARTY_NOTICES.md`.
