# Chrome 商店首次上架与更新

适用版本：0.4.1。本文准备了操作步骤及可复制的英文填写内容。
项目目前尚未上架；推送 GitHub 不会自动发布到 Chrome 商店。

## 首次上架

1. 用准备长期维护项目的 Google 账号登录 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)。可以使用专门的开发账号，并将联系邮箱设为 `perkdonedev@gmail.com`。
2. 完成开发者注册、同意协议并支付一次性注册费。具体金额以付款页面为准；开启该 Google 账号的两步验证，填写发布者名称并验证联系邮箱。
3. 在项目目录运行 `npm ci`（首次安装依赖）、`npm test`、`npm run package`。目前生成 `release/perk-done-0.4.1.zip`；上传整个 ZIP，不是源码目录，也不是 `.crx`。
4. 后台点击 **Add new item → Choose file → Upload**，选择 ZIP。压缩包根目录已包含 `manifest.json`。
5. 填写 **Store listing**：默认语言选 English，名称 Perk Done，分类选择最贴近效率工具的可用分类。填写下方描述、图标、截图、推广图及支持链接。
6. 填写 **Privacy practices**：单一用途、`storage` 权限理由、不使用远程代码，以及实际数据使用情况。隐私政策 URL 使用公开的 [PRIVACY.md](https://github.com/czhtoday/PerkDone/blob/main/PRIVACY.md)。
7. 在 **Distribution** 选择免费及发布范围。希望所有人可以搜索安装时选 Public。先小范围测试可用 Private / trusted testers；Unlisted 则通过链接访问。
8. 填写测试说明，点击 **Submit for review**。可以选审核后自动发布，也可以审核通过后手动发布。审核时间不固定，后台会显示进度；如收到修改要求，按反馈修改后重新提交。

官方说明：[注册](https://developer.chrome.com/docs/webstore/register)、[账号设置](https://developer.chrome.com/docs/webstore/set-up-account)、[两步验证](https://developer.chrome.com/docs/webstore/program-policies/two-step-verification)、[首次发布](https://developer.chrome.com/docs/webstore/publish)。

### 图片准备

- 扩展图标：`public/icons/128.png`，128 × 128 PNG，已随 ZIP 打包。
- 至少一张真实使用截图，建议 1280 × 800；最多五张。展示浅色与深色时间表、小窗口即可，使用演示数据。
- 小推广图：440 × 280 PNG 或 JPEG；用自己的 Perk Done 标识和简短介绍。
- `docs/screenshots/` 的图片用于 README，不能直接假定尺寸符合商店。商店图片需要单独按上述尺寸制作；不要上传个人真实记录。

详见 [Google 图片要求](https://developer.chrome.com/docs/webstore/images) 与 [Listing 字段](https://developer.chrome.com/docs/webstore/cws-dashboard-listing)。

### 可直接填写的英文内容

**Short description**

> Track credit card perks, mark them done, and see annual fees versus used credits. Sync through Chrome.

**Detailed description**

```text
Keep your credit card perks in one place.

Perk Done is a manual credit card benefit tracker with a compact toolbar popup and a full annual timeline. Add your cards, see their recurring benefits, and mark a period done with one click.

• Track monthly, quarterly, semiannual, and annual credits on the same timeline.
• Record today's completion date instantly, then edit the date or undo it.
• Add multiple cards with nicknames and optional last-four or last-five digits.
• Hide benefits you do not use, or add custom cards and perks.
• See all cards together or select a subset.
• View current-quarter deadlines and annual fees versus completed credit value.
• Switch between light, dark, and system themes, and English or Chinese.
• Sync records through Chrome Sync when enabled.

No separate Perk Done account or bank connection is required. The extension only requests the storage permission and does not read your browsing history or transactions. The card catalog is bundled with the extension; no live banking API is used.

Completion is recorded manually. Used-credit totals assume the full credit amount for each completed period and are estimates, not bank-verified reimbursements. Issuer eligibility, enrollment, and actual expiration rules still apply.

Open source: https://github.com/czhtoday/PerkDone
Feedback: perkdonedev@gmail.com
```

**Single purpose**

```text
Help users manually track the use and deadlines of recurring credit card benefits across their own cards.
```

**Storage permission justification**

```text
The storage permission saves user-entered cards, optional card suffixes, nicknames, custom benefits, hidden settings, validity dates, completion records, annual fees, and theme/language preferences. chrome.storage.sync allows Chrome to synchronize these records across the user's devices when Chrome Sync is enabled. The developer does not receive wallet records.
```

**Remote code**

选择 **No, I am not using remote code**。代码、目录和图片都打包在扩展中，没有远程脚本。

**Data usage**

按实际保存的数据申报，而不是因为没有自有服务器就直接认定“没有用户数据”。扩展保存卡片产品、可选尾号、年费和权益金额，建议在金融/付款信息相关字段披露这些钱包元数据，并说明由 Chrome 保存及按用户设置同步、开发者不接收。没有完整卡号、账户密码或银行交易；没有浏览历史、网页内容、位置或行为追踪。主动发来的反馈邮件会包含发件地址与用户自愿填写的内容，已在隐私政策单独说明。后台字段和定义可能变化，提交时逐项核对，并确保声明与隐私政策一致。

详见 [Google 隐私字段说明](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy)。

**Links**

- Homepage: `https://github.com/czhtoday/PerkDone`
- Support: `https://github.com/czhtoday/PerkDone/issues`
- Privacy policy: `https://github.com/czhtoday/PerkDone/blob/main/PRIVACY.md`
- Contact email: `perkdonedev@gmail.com`

**Reviewer test instructions**

```text
No account, credentials, or backend service is required.
1. Click the extension toolbar icon, then Open dashboard.
2. Add a card from the catalog; an optional nickname/suffix can be entered.
3. Click an available unfinished benefit period to mark it done today.
4. Click the completed period to edit its date or undo completion.
5. Hide a perk and restore it using Show hidden perks.
6. Test the card filter, theme switch, and EN/Chinese switch.
7. Reopen the toolbar popup to see card count, current-quarter remaining perks, and annual fee/completed-credit estimates.
Records persist in Chrome extension storage. Cross-device synchronization depends on the user's Chrome Sync settings.
```

## 上架后的每次更新

1. 修改代码或 `src/data/cards.json`，保持已有 product/perk IDs 和存储迁移兼容。目录与图片是本地打包的，所以目录调整也需要发布新版本。
2. 把 `public/manifest.json` 的版本提高，例如 `0.4.1` → `0.4.2`。同时更新 `package.json` 和 `package-lock.json` 的项目版本；`npm version 0.4.2 --no-git-tag-version` 可以同步后两者。这只是下次更新的例子，不会在本文中实际执行。
3. 更新隐私政策版本、发布日期及涉及变化的 README。运行 `npm test`；交互、存储或迁移变化按需运行 README 所述的实际扩展浏览器检查。
4. 运行 `npm run package`。脚本核对 manifest 与 package 版本一致，自动生成 `release/perk-done-0.4.2.zip`，并附上许可证。发布 ZIP 包含完整扩展，不只是差异文件。
5. 提交并推送 GitHub。这个步骤只更新源代码。
6. 打开商店后台**已有的 Perk Done 项目**，在 **Package → Upload new package** 上传新 ZIP。更新变动的描述/隐私字段，然后重新 **Submit for review**。
7. 审核通过并发布后，Chrome 会自动向已安装用户分发更新，通常不需要卸载或重新安装。不要为每次更新创建新的商店项目；沿用项目才能保留安装身份和现有用户。

官方说明：[更新商店项目](https://developer.chrome.com/docs/webstore/update)、[Chrome 自动更新机制](https://developer.chrome.com/docs/extensions/develop/concepts/extensions-update-lifecycle)。

### 从本地测试版换成商店版

网页预览、本地加载的扩展、商店扩展可能使用不同的钱包或扩展 ID，现有测试数据不会自动跨这些身份迁移。本版尚无导入/导出工具，换装前请先另外记录重要数据。商店版后续正常原位更新不需要换身份，但具体数据保留仍取决于更新是否兼容现有存储。

## 开源与发布包

原创代码和文档采用标准 MIT License，可以 fork、研究、修改、分发及商用；分发时保留版权与许可证。银行图片及商标不属于 MIT 授权范围，见 `THIRD_PARTY_NOTICES.md`。GitHub 开源和 Chrome 商店发布可以同时进行，当前运行方式无需额外服务器或数据库。
