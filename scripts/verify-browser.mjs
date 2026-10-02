import catalogData from "../src/data/cards.json" with { type: "json" };
import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
const profile = mkdtempSync(`${tmpdir()}/perk-done-test-`);
mkdirSync("test-results", { recursive: true });
mkdirSync("docs/screenshots", { recursive: true });
assert.equal(
  JSON.parse(readFileSync("dist/manifest.json")).action.default_popup,
  "popup.html",
);
const executablePath = process.env.CHROME_EXECUTABLE;
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
context.on("page", (p) => p.on("pageerror", (e) => errors.push(e.message)));
try {
  const worker =
    context.serviceWorkers()[0] ||
    (await context.waitForEvent("serviceworker"));
  const base = `chrome-extension://${new URL(worker.url()).host}/`;
  const feedbackHref =
    "mailto:perkdonedev@gmail.com?subject=Perk%20Done%20feedback";
  const page = await context.newPage();
  await page.goto(base + "index.html");
  await page
    .getByRole("heading", { name: "Start with your first card" })
    .waitFor();
  assert.equal(
    await page.locator(".quarter-disclosure").getAttribute("aria-expanded"),
    "false",
  );
  assert.equal(await page.locator(".due-row").count(), 0);
  assert.equal(
    await page
      .getByRole("link", { name: "Feedback", exact: true })
      .getAttribute("href"),
    feedbackHref,
  );
  async function add(search, nickname, suffix) {
    await page.getByRole("button", { name: "Add a card", exact: true }).click();
    if (!search) {
      await page.waitForFunction(
        (expected) =>
          document.querySelectorAll(".product img").length === expected &&
          [...document.querySelectorAll(".product img")].every(
            (i) => i.complete && i.naturalWidth > 0,
          ),
        catalogData.products.filter(
          (p) => (p.annualFee !== 0 || p.benefits.length) && p.image,
        ).length,
      );
      assert.ok(
        await page
          .locator(".product img")
          .evaluateAll((images) =>
            images.every((i) => i.src.startsWith("chrome-extension://")),
          ),
      );
    }
    if (search) {
      await page.getByLabel("Search cards").fill(search);
      await page.locator(".product").first().click();
    }
    await page
      .getByLabel("Nickname (optional)", { exact: true })
      .fill(nickname);
    await page
      .getByLabel("Last 4–5 digits (optional)", { exact: true })
      .fill(suffix);
    await page.getByRole("button", { name: "Add to my cards" }).click();
    await page.locator("dialog").waitFor({ state: "hidden" });
  }
  await add("", "Aspire 1", "01007");
  await page
    .getByRole("heading", { name: "Aspire 1 01007", exact: true })
    .waitFor();
  async function rename(oldName, nickname, newName) {
    await page
      .getByRole("button", { name: `Edit card ${oldName}`, exact: true })
      .click();
    await page
      .getByLabel("Nickname (optional)", { exact: true })
      .fill(nickname);
    await page.getByRole("button", { name: "Save card", exact: true }).click();
    await page.locator("dialog").waitFor({ state: "hidden" });
    await page.getByRole("heading", { name: newName, exact: true }).waitFor();
  }
  await rename("Aspire 1 01007", "", "Hilton Honors Aspire 01007");
  await rename("Hilton Honors Aspire 01007", "Hilton小卡", "Hilton小卡 01007");
  assert.equal(await page.locator(".card-title>span").count(), 0);
  await rename("Hilton小卡 01007", "Aspire 1", "Aspire 1 01007");
  const year = new Date().getFullYear();
  const today = await page.evaluate(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const q1 = page.getByRole("button", {
    name: `Aspire 1 01007 Flight Credit ${year} Q1 Mark done`,
    exact: true,
  });
  await q1.click();
  let done = page.getByRole("button", {
    name: `Aspire 1 01007 Flight Credit ${year} Q1 Done ${today}`,
    exact: true,
  });
  await done.waitFor();
  assert.equal(await page.locator(".date-popover:popover-open").count(), 0);
  assert.equal(await page.locator("dialog[open]").count(), 0);
  await done.click();
  await page.locator(".date-popover:popover-open").waitFor();
  assert.equal(await page.locator("dialog[open]").count(), 0);
  await page.locator(".date-popover input[type=date]").fill(`${year}-02-21`);
  await page.getByRole("button", { name: "Save date", exact: true }).click();
  done = page.getByRole("button", {
    name: `Aspire 1 01007 Flight Credit ${year} Q1 Done ${year}-02-21`,
    exact: true,
  });
  await done.waitFor();
  await done.click();
  await page.getByRole("button", { name: "Undo completion" }).click();
  await q1.waitFor();
  await q1.click();
  await page
    .getByRole("button", {
      name: `Aspire 1 01007 Flight Credit ${year} Q1 Done ${today}`,
      exact: true,
    })
    .waitFor();
  const colors = await page
    .locator(".period.done")
    .first()
    .evaluate((e) => {
      const s = getComputedStyle(e);
      return [s.backgroundColor, s.color];
    });
  assert.notEqual(...colors);
  assert.ok(
    Number(colors[0].match(/\d+/)[0]) >= 245,
    "Light done cells should be near white",
  );
  const doneState = await page
    .locator(".period.done .period-state")
    .first()
    .evaluate((e) => getComputedStyle(e).color);
  assert.equal(doneState, "rgb(8, 123, 230)");
  await page.waitForFunction(() => {
    const cell = document.querySelector(".period.done");
    return (
      cell &&
      getComputedStyle(cell).borderColor ===
        getComputedStyle(cell.querySelector(".period-state")).color
    );
  });
  const marker = await page
    .locator(".period.done .completion-circle")
    .first()
    .evaluate((e) => ({
      fill: getComputedStyle(e).backgroundColor,
      shape: getComputedStyle(e).borderRadius,
      checked: !!e.querySelector("svg"),
      border: getComputedStyle(e.closest(".period")).borderColor,
    }));
  assert.equal(marker.fill, doneState);
  assert.equal(marker.shape, "50%");
  assert.equal(marker.checked, true);
  assert.equal(marker.border, doneState);
  assert.equal(
    await page.locator(".period:not(.done) .completion-circle svg").count(),
    0,
  );
  const popup = await context.newPage();
  await popup.setViewportSize({ width: 430, height: 600 });
  await popup.goto(base + "popup.html");
  await popup.getByTestId("card-count").waitFor();
  assert.equal(
    await popup
      .getByRole("link", { name: "Feedback", exact: true })
      .getAttribute("href"),
    feedbackHref,
  );
  await popup
    .getByTestId("net-value")
    .filter({ hasText: "Keep going!" })
    .waitFor();
  assert.equal(await popup.locator(".return-emoji").textContent(), "💪");
  assert.ok(
    (await popup
      .locator(".popup")
      .evaluate((e) => e.getBoundingClientRect().height)) < 360,
    "Popup should stay compact",
  );
  assert.equal(await popup.getByTestId("card-count").textContent(), "1");
  assert.equal(
    await popup.locator(".due-row,.quarter-focus,.tracker").count(),
    0,
  );
  await add("CSP", "My CSP", "1234");
  await add("gold", "My Gold", "23456");
  await page.getByRole("button", { name: "Choose cards" }).click();
  const filter = page.locator(".filter-popover");
  await filter.getByLabel("My CSP 1234").uncheck();
  assert.equal(await page.locator(".card-section").count(), 2);
  await filter.getByLabel("My Gold 23456").uncheck();
  assert.equal(await page.locator(".card-section").count(), 1);
  await filter.getByRole("button", { name: "Clear", exact: true }).click();
  assert.equal(await page.locator(".card-section").count(), 0);
  await filter.getByRole("button", { name: "Select all" }).click();
  assert.equal(await page.locator(".card-section").count(), 3);
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", {
      name: "Hide Aspire 1 01007 Flight Credit",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: "Show hidden perks · Aspire 1 01007",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Restore Flight Credit", exact: true })
    .click();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.locator(".quarter-disclosure").click();
  assert.equal(
    await page.locator(".quarter-disclosure").getAttribute("aria-expanded"),
    "true",
  );
  await page.locator(".quarter-disclosure").click();
  await page.getByRole("button", { name: "Dark mode", exact: true }).click();
  await popup.waitForFunction(
    () => document.documentElement.dataset.theme === "dark",
  );
  await page.waitForFunction(
    () =>
      getComputedStyle(document.querySelector(".period.done"))
        .backgroundColor === "rgb(41, 41, 41)",
  );
  const darkColors = await page
    .locator(".period.done")
    .first()
    .evaluate((e) => {
      const s = getComputedStyle(e);
      return [s.backgroundColor, s.color];
    });
  assert.notEqual(...darkColors);
  assert.ok(
    Number(darkColors[0].match(/\d+/)[0]) < 70,
    "Dark done cells should stay dark gray",
  );
  assert.equal(
    await page
      .locator(".period.done .period-state")
      .first()
      .evaluate((e) => getComputedStyle(e).color),
    "rgb(50, 155, 255)",
  );
  assert.notEqual(colors[0], darkColors[0]);
  await page.getByRole("button", { name: "Switch to Chinese" }).click();
  await popup.getByText("本季度待完成", { exact: true }).waitFor();
  await page.getByRole("heading", { name: "我的权益", exact: true }).waitFor();
  await page.reload();
  await page.getByRole("heading", { name: "我的权益", exact: true }).waitFor();
  await page.getByRole("button", { name: "切换到英文" }).click();
  await popup.getByText("Perks to finish", { exact: true }).waitFor();
  // Direct fixture writes use only the isolated test profile. All six Aspire cash credits completed.
  await worker.evaluate(
    ({ year, today }) =>
      chrome.storage.sync.get(null).then((items) => {
        const card = Object.values(items).find(
          (v) => v?.nickname === "Aspire 1",
        );
        const group = {};
        for (let i = 0; i < 4; i++) group[`flight/${i}`] = today;
        for (let i = 0; i < 2; i++) group[`resort/${i}`] = today;
        const remove = Object.entries(items)
          .filter(([k, v]) => k.startsWith("pd:card:") && v.id !== card.id)
          .map(([k]) => k);
        return chrome.storage.sync
          .remove(remove)
          .then(() =>
            chrome.storage.sync.set({ [`pd:year:${card.id}:${year}`]: group }),
          );
      }),
    { year, today },
  );
  await popup.waitForFunction(
    () =>
      document.querySelector('[data-testid="value-ratio"]').textContent ===
      "$550/$600",
  );
  assert.equal(
    await popup.getByTestId("net-value").textContent(),
    "Net earned $50",
  );
  const data = await worker.evaluate(() => chrome.storage.sync.get(null));
  assert.equal(
    Object.values(data).find((v) => v?.nickname === "Aspire 1").last4,
    "01007",
  );
  const newTab = context.waitForEvent("page");
  await popup
    .getByRole("button", { name: "Open dashboard", exact: true })
    .click();
  const opened = await newTab;
  await opened.waitForURL(base + "index.html");
  await opened.close();
  const demo = await context.newPage();
  await demo.goto(base + "index.html?demo=1");
  await demo
    .getByRole("heading", { name: "Everyday perks 07997", exact: true })
    .waitFor();
  await demo.waitForFunction(
    () =>
      [...document.querySelectorAll(".official-card-art")].length === 3 &&
      [...document.querySelectorAll(".official-card-art")].every(
        (i) => i.complete && i.naturalWidth > 0,
      ),
  );
  const widths = await demo
    .locator(".period-grid")
    .evaluateAll((es) =>
      es.map((e) => Math.round(e.getBoundingClientRect().width)),
    );
  assert.equal(new Set(widths).size, 1);
  await demo.screenshot({
    path: "docs/screenshots/dashboard-dark.png",
    animations: "disabled",
  });
  await demo.getByRole("button", { name: "Light mode", exact: true }).click();
  await demo.waitForFunction(
    () => document.documentElement.dataset.theme === "light",
  );
  await demo.waitForFunction(() =>
    [...document.querySelectorAll(".period.done")].every(
      (e) => getComputedStyle(e).backgroundColor === "rgb(248, 248, 248)",
    ),
  );
  await demo.screenshot({
    path: "test-results/desktop-light.png",
    animations: "disabled",
  });
  await demo.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await demo.evaluate(() => document.documentElement.scrollWidth),
    390,
  );
  await demo.screenshot({
    path: "test-results/mobile-light.png",
    fullPage: true,
  });
  const demoPopup = await context.newPage();
  await demoPopup.setViewportSize({ width: 430, height: 460 });
  await demoPopup.goto(base + "popup.html?demo=1");
  await demoPopup.getByTestId("due-count").waitFor();
  await demoPopup
    .getByRole("button", { name: "Dark mode", exact: true })
    .click();
  await demoPopup.waitForFunction(
    () => document.documentElement.dataset.theme === "dark",
  );
  await demoPopup.locator(".popup").screenshot({
    path: "docs/screenshots/popup-dark.png",
    animations: "disabled",
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: real MV3; English default and synced Chinese preference; collapsed quarter list; numeric popup; 550/600 +50 calculation; immediate completion; anchored date editing and undo; multi-card filters; hide/restore; theme sync and soft-gray completion contrast; timeline widths; narrow layout; no runtime errors.",
  );
} finally {
  await context.close();
  rmSync(profile, { recursive: true, force: true });
}
