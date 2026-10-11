import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

// Standalone brand graphics; no app build or personal browser profile needed.
const output = resolve("docs/store-assets");
mkdirSync(output, { recursive: true });
const mark = `<svg viewBox="0 0 128 128" aria-hidden="true"><circle cx="64" cy="64" r="48" fill="#242424"/><path d="M37 65l13 13 24-29M60 65l13 13 20-29" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const browser = await chromium.launch({
  executablePath: process.env.CHROME_EXECUTABLE,
  headless: true,
});
try {
  for (const large of [false, true]) {
    const width = large ? 1400 : 440;
    const height = large ? 560 : 280;
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    const timeline = large
      ? `<div class="timeline"><div class="quarters"><span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span></div><div class="row four"><div class="done">✓</div><div class="done">✓</div><div>·</div><div>·</div></div><div class="row two"><div class="done">✓</div><div>·</div></div><div class="row one"><div class="done">✓</div></div><div class="caption">One year. All your perks.</div></div>`
      : "";
    await page.setContent(`<html><head><style>
      *{box-sizing:border-box}body{margin:0;width:${width}px;height:${height}px;background:#111110;color:#f5f5f5;font-family:Arial,sans-serif;padding:${large ? "64px 76px" : "32px 36px"};display:flex;align-items:${large ? "center" : "stretch"};gap:70px}
      .copy{display:flex;flex-direction:column;justify-content:space-between;${large ? "width:580px;height:380px" : "width:100%"}}
      .brand{display:flex;align-items:center;gap:${large ? 14 : 10}px;font-size:${large ? 28 : 18}px;font-weight:600}.brand svg{width:${large ? 56 : 36}px;height:${large ? 56 : 36}px}
      h1{font-size:${large ? 66 : 35}px;letter-spacing:${large ? -2.4 : -1.2}px;line-height:1.12;margin:0;font-weight:600}p{font-size:${large ? 18 : 13}px;color:#aaa;margin:0;line-height:1.5}
      .timeline{flex:1;min-width:0;border:1px solid #363636;border-radius:24px;background:#191919;padding:28px;transform:rotate(-3deg)}
      .quarters{display:grid;grid-template-columns:repeat(4,1fr);text-align:center;font-size:14px;letter-spacing:1px;color:#aaa;margin-bottom:16px}
      .row{display:grid;gap:10px;margin-bottom:12px}.four{grid-template-columns:repeat(4,1fr)}.two{grid-template-columns:repeat(2,1fr)}.one{grid-template-columns:1fr}
      .row div{height:64px;border:1px solid #3c3c3c;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#666;font-size:28px;background:#202020}.row .done{background:#303030;border-color:#626262;color:#eee}
      .caption{font-size:15px;color:#999;margin-top:22px}
    </style></head><body><div class="copy"><div class="brand">${mark}Perk Done</div><h1>Every perk.<br>One clear timeline.</h1><p>Track. Complete. Make your cards count.</p></div>${timeline}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    const path = `${output}/promo-${width}x${height}.png`;
    await page.screenshot({ path, omitBackground: false });
    console.log(path);
    await page.close();
  }
} finally {
  await browser.close();
}
