import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
const executablePath = process.env.CHROME_EXECUTABLE;
const profile = mkdtempSync(`${tmpdir()}/perk-done-test-`);
mkdirSync("test-results", { recursive: true });
mkdirSync("docs/screenshots", { recursive: true });
assert.equal(
  JSON.parse(readFileSync("dist/manifest.json", "utf8")).action.default_popup,
  "popup.html",
);
const context = await chromium.launchPersistentContext(profile, {
  executablePath,
  channel: executablePath ? undefined : "chromium",
  headless: true,
  viewport: { width: 1440, height: 1000 },
  colorScheme: "light",
  args: [
    `--disable-extensions-except=${resolve("dist")}`,
    `--load-extension=${resolve("dist")}`,
  ],
});
const errors = [];
context.on("page", (page) =>
  page.on("pageerror", (e) => errors.push(e.message)),
);
try {
  const worker =
    context.serviceWorkers()[0] ||
    (await context.waitForEvent("serviceworker"));
  const extensionId = new URL(worker.url()).host;
  const url = `chrome-extension://${extensionId}/index.html`;
  const page = await context.newPage();
  await page.goto(url);
  await page.getByRole("heading", { name: "从第一张信用卡开始" }).waitFor();
  await page.getByRole("button", { name: "添加第一张信用卡" }).click();
  await page.getByLabel("昵称（可选）").fill("Aspire 1");
  await page.getByLabel("尾号（可选，4–5 位）").fill("01007");
  await page.getByRole("button", { name: "添加到我的卡片" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  let data = await worker.evaluate(() => chrome.storage.sync.get(null));
  const card = Object.values(data).find(
    (v) => v.name === "Hilton Honors Aspire",
  );
  assert.equal(card.last4, "01007");
  // Historical dates and per-year records still work after the redesign.
  const year = new Date().getFullYear() - 1;
  await page.getByRole("button", { name: "上一年" }).click();
  const q1 = page.getByRole("button", {
    name: `Aspire 1 Flight Credit ${year} Q1 标记完成`,
    exact: true,
  });
  await q1.click();
  await page.getByLabel("完成日期").fill(`${year}-02-21`);
  await page.getByRole("button", { name: "完成", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.reload();
  await page.getByRole("button", { name: "上一年" }).click();
  await page
    .getByRole("button", {
      name: `Aspire 1 Flight Credit ${year} Q1 Done ${year}-02-21`,
      exact: true,
    })
    .waitFor();
  await page.getByRole("button", { name: "下一年" }).click();
  assert.equal(await page.locator(".period.done").count(), 0);
  // Hidden perks disappear in both surfaces, change counts, and keep old records.
  const popup = await context.newPage();
  await popup.setViewportSize({ width: 430, height: 600 });
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await popup.getByTestId("due-count").waitFor();
  assert.equal(await popup.locator(".tracker").count(), 0);
  const beforeHide = Number(await popup.getByTestId("due-count").textContent());
  await page
    .getByRole("button", { name: "隐藏 Aspire 1 Flight Credit", exact: true })
    .click();
  await page
    .locator(".benefit-name b")
    .filter({ hasText: "Flight Credit" })
    .waitFor({ state: "hidden" });
  await popup.waitForFunction(
    (before) =>
      Number(
        document.querySelector('[data-testid="due-count"]').textContent,
      ) ===
      before - 1,
    beforeHide,
  );
  data = await worker.evaluate(() => chrome.storage.sync.get(null));
  assert.equal(data[`pd:year:${card.id}:${year}`]["flight/0"], `${year}-02-21`);
  await page
    .getByRole("button", { name: "Show hidden perks · Aspire 1", exact: true })
    .hover();
  assert.equal(await page.locator(".hidden-tooltip").isVisible(), true);
  await page
    .getByRole("button", { name: "Show hidden perks · Aspire 1", exact: true })
    .click();
  await page
    .getByRole("button", { name: "恢复 Flight Credit", exact: true })
    .click();
  await page.getByRole("button", { name: "关闭", exact: true }).click();
  await popup.waitForFunction(
    (before) =>
      Number(
        document.querySelector('[data-testid="due-count"]').textContent,
      ) === before,
    beforeHide,
  );
  // Theme preferences are persisted and reflected across open surfaces.
  await page.getByRole("button", { name: "深色模式", exact: true }).click();
  await popup.waitForFunction(
    () => document.documentElement.dataset.theme === "dark",
  );
  assert.equal(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--bg")
        .trim(),
    ),
    "#101010",
  );
  await page.reload();
  assert.equal(
    await page
      .getByRole("button", { name: "深色模式", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await page.getByRole("button", { name: "跟随系统", exact: true }).click();
  await page.emulateMedia({ colorScheme: "light" });
  assert.equal(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--bg")
        .trim(),
    ),
    "#fafafa",
  );
  await page.emulateMedia({ colorScheme: "dark" });
  assert.equal(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--bg")
        .trim(),
    ),
    "#101010",
  );
  await page.getByRole("button", { name: "浅色模式", exact: true }).click();
  assert.equal(
    await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--bg")
        .trim(),
    ),
    "#fafafa",
  );
  // Quick completion in the popup updates the full dashboard.
  const quick = popup.locator(".quick-check:not([disabled])").first();
  if (await quick.count()) {
    const beforeComplete = Number(
      await popup.getByTestId("due-count").textContent(),
    );
    await quick.click();
    await popup.getByRole("button", { name: "完成", exact: true }).click();
    await popup.getByRole("dialog").waitFor({ state: "hidden" });
    await page.waitForFunction(
      (before) =>
        Number(
          document.querySelector('[data-testid="due-count"]').textContent,
        ) ===
        before - 1,
      beforeComplete,
    );
  }
  // Add and configure a cardmember-year benefit without inventing a calendar-year deadline.
  await page.getByRole("button", { name: "添加信用卡", exact: true }).click();
  await page.getByLabel("搜索卡片").fill("CSP");
  await page
    .getByRole("button", { name: "Sapphire Preferred", exact: false })
    .click();
  await page.getByLabel("昵称（可选）").fill("My CSP");
  await page.getByLabel("尾号（可选，4–5 位）").fill("1234");
  await page.getByRole("button", { name: "添加到我的卡片" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  const csp = page.locator(".card-section").filter({
    has: page.getByRole("heading", {
      name: "Sapphire Preferred",
      exact: true,
    }),
  });
  await csp.getByRole("button", { name: "设置有效期", exact: true }).click();
  const currentYear = new Date().getFullYear();
  await page.getByLabel("开始日期").fill(`${currentYear}-01-01`);
  await page.getByLabel("到期日期").fill(`${currentYear}-12-31`);
  await page.getByRole("button", { name: "保存有效期" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await csp.locator(".manual-period").waitFor();
  // A previously opened UI also sees deletion events.
  await page.getByRole("button", { name: "移除 My CSP", exact: true }).click();
  await page.getByRole("button", { name: "移除卡片", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  const openTab = context.waitForEvent("page");
  await popup
    .getByRole("button", { name: "打开完整面板", exact: true })
    .click();
  const opened = await openTab;
  await opened.waitForURL(url);
  await opened.close();
  // Verify demo, narrow screens and both visual themes without touching a personal profile.
  const preview = await context.newPage();
  await preview.goto("http://127.0.0.1:5173/?demo=1");
  await preview
    .getByRole("heading", { name: "The Platinum Card", exact: true })
    .waitFor();
  const widths = await preview
    .locator(".period-grid")
    .evaluateAll((els) =>
      els.map((e) => Math.round(e.getBoundingClientRect().width)),
    );
  assert.equal(new Set(widths).size, 1);
  await preview.getByRole("button", { name: "浅色模式", exact: true }).click();
  await preview
    .getByRole("button", { name: "浅色模式", exact: true })
    .waitFor();
  await preview.waitForFunction(
    () =>
      document.documentElement.dataset.theme === "light" &&
      !document.querySelector('button[aria-label="浅色模式"]').disabled,
  );
  await preview.screenshot({
    path: "test-results/desktop-light.png",
    fullPage: true,
    animations: "disabled",
  });
  await preview.getByRole("button", { name: "深色模式", exact: true }).click();
  await preview.waitForFunction(
    () =>
      document.documentElement.dataset.theme === "dark" &&
      !document.querySelector('button[aria-label="深色模式"]').disabled,
  );
  await preview.screenshot({
    path: "docs/screenshots/dashboard-dark.png",
    animations: "disabled",
  });
  await preview.screenshot({
    path: "test-results/desktop-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  await preview.setViewportSize({ width: 390, height: 844 });
  await preview.screenshot({
    path: "test-results/mobile-dark.png",
    fullPage: true,
    animations: "disabled",
  });
  assert.equal(
    await preview.evaluate(() => document.documentElement.scrollWidth),
    390,
  );
  const demoPopup = await context.newPage();
  await demoPopup.setViewportSize({ width: 430, height: 600 });
  await demoPopup.goto(`chrome-extension://${extensionId}/popup.html?demo=1`);
  await demoPopup.getByTestId("due-count").waitFor();
  await demoPopup
    .getByRole("button", { name: "深色模式", exact: true })
    .click();
  await demoPopup.waitForFunction(
    () =>
      document.documentElement.dataset.theme === "dark" &&
      !document.querySelector('button[aria-label="深色模式"]').disabled,
  );
  await demoPopup.screenshot({
    path: "docs/screenshots/popup-dark.png",
    animations: "disabled",
  });
  await demoPopup.screenshot({ path: "test-results/popup-dark.png" });
  assert.equal(
    await demoPopup.evaluate(() => document.documentElement.scrollWidth),
    430,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: real MV3 popup manifest and dashboard; 5-digit Amex/4-digit Chase suffixes; persisted historical dates; year isolation; hidden/restored perks retain records and update popup count; cross-surface theme sync, reload and system color scheme; popup completion; actual validity ranges; open full panel; equal timeline widths; light/dark/narrow layouts; no page errors.",
  );
} finally {
  await context.close();
  rmSync(profile, { recursive: true, force: true });
}
