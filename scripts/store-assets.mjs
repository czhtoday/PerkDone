import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve, extname } from "node:path";

const output = resolve("docs/store-assets");
mkdirSync(output, { recursive: true });
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};
const server = createServer((request, response) => {
  const path = new URL(request.url, "http://localhost").pathname;
  try {
    const file = resolve("dist", `.${path === "/" ? "/index.html" : path}`);
    if (!file.startsWith(resolve("dist") + "/"))
      throw new Error("Invalid path");
    const contents = readFileSync(file);
    response.writeHead(200, {
      "Content-Type": types[extname(file)] || "application/octet-stream",
    });
    response.end(contents);
  } catch {
    response.writeHead(404);
    response.end();
  }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: process.env.CHROME_EXECUTABLE,
  headless: true,
});
const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><circle cx="64" cy="64" r="48" fill="#191919"/><path d="M37 65l13 13 24-29M60 65l13 13 20-29" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
try {
  const icon = await browser.newPage({
    viewport: { width: 128, height: 128 },
    deviceScaleFactor: 1,
  });
  await icon.setContent(
    `<html><body style="margin:0;background:transparent">${mark}</body></html>`,
  );
  await icon.screenshot({
    path: `${output}/store-icon-128.png`,
    omitBackground: true,
  });
  for (const theme of ["dark", "light"]) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
      colorScheme: theme,
    });
    await context.addInitScript((theme) => {
      localStorage.setItem("pd-theme", theme);
      localStorage.setItem("pd-language", "en");
    }, theme);
    const page = await context.newPage();
    await page.goto(`${base}/index.html?demo=1`);
    await page.locator(".card-section").first().waitFor();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        [...document.images].map((image) => image.decode().catch(() => {})),
      );
    });
    await page.screenshot({
      path: `${output}/dashboard-${theme}-1280x800.png`,
    });
    await context.close();
  }
  const feature = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
  });
  await feature.addInitScript(() => {
    localStorage.setItem("pd-theme", "dark");
    localStorage.setItem("pd-language", "en");
  });
  const page = await feature.newPage();
  await page.goto(`${base}/popup.html?demo=1`);
  await page.setContent(`<html><head><style>
    *{box-sizing:border-box}body{margin:0;background:#111110;color:#f5f5f5;font-family:Arial,sans-serif;width:1280px;height:800px;display:flex;align-items:center;padding:90px;gap:80px}
    .copy{flex:1}.brand{display:flex;align-items:center;gap:12px;font-size:22px;font-weight:600;margin-bottom:46px}.brand svg{width:52px;height:52px}h1{font-size:64px;letter-spacing:-3px;line-height:1.06;margin:0 0 26px;font-weight:600}p{font-size:21px;line-height:1.6;color:#aaa;margin:0;max-width:450px}.tags{font-size:14px;color:#777;margin-top:42px;letter-spacing:1px}
    iframe{width:430px;height:440px;border:1px solid #333;border-radius:22px;background:#191919;box-shadow:0 28px 70px #0005}
  </style></head><body><div class="copy"><div class="brand">${mark}Perk Done</div><h1>Your perks.<br>Your progress.</h1><p>See what’s left this quarter.<br>Track fees and credits at a glance.</p><div class="tags">NO BANK LOGIN · CHROME SYNC</div></div><iframe src="${base}/popup.html?demo=1"></iframe></body></html>`);
  await page
    .frameLocator("iframe")
    .locator(".popup-stats")
    .waitFor({ timeout: 3000 })
    .catch(async () => {
      await page
        .frameLocator("iframe")
        .getByText("Cards", { exact: true })
        .waitFor();
    });
  await page.screenshot({ path: `${output}/popup-overview-1280x800.png` });
  await page.setViewportSize({ width: 440, height: 280 });
  await page.setContent(
    `<html><head><style>*{box-sizing:border-box}body{margin:0;width:440px;height:280px;background:#111110;color:#f5f5f5;font-family:Arial,sans-serif;padding:32px 36px;display:flex;flex-direction:column;justify-content:space-between}.brand{display:flex;align-items:center;gap:10px;font-size:18px;font-weight:600}.brand svg{width:36px;height:36px}h1{font-size:35px;letter-spacing:-1.2px;line-height:1.12;margin:0}p{font-size:13px;color:#aaa;margin:0}</style></head><body><div class="brand">${mark}Perk Done</div><h1>Every perk.<br>One clear timeline.</h1><p>Track. Complete. Make your cards count.</p></body></html>`,
  );
  await page.screenshot({ path: `${output}/promo-440x280.png` });
  await feature.close();
  console.log(`Created store assets in ${output}`);
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
