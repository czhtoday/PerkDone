import { describe, expect, it } from "vitest";
import {
  annualValue,
  localDate,
  periods,
  validCompletion,
  quarterDue,
  benefitPeriods,
  recordKey,
  type Card,
} from "../src/model";
import { change, checkQuota, decode } from "../src/storage";
import { catalog, hydrateCard } from "../src/catalog";
import catalogData from "../src/data/cards.json";
import { setLanguage, t } from "../src/i18n";
const card: Card = {
  ...catalog[0],
  id: "test",
  nickname: "Aspire 1",
  last4: "1007",
};
describe("equal-width calendar periods", () => {
  it.each(["annual", "semiannual", "quarterly", "monthly"] as const)(
    "%s spans exactly 12 months without gaps",
    (frequency) => {
      const ps = periods(frequency, 2026);
      expect(ps.reduce((n, p) => n + p.span, 0)).toBe(12);
      expect(ps[0].start).toBe("2026-01-01");
      expect(ps.at(-1)?.end).toBe("2026-12-31");
      ps.slice(1).forEach((p, i) =>
        expect(p.startMonth).toBe(ps[i].startMonth + ps[i].span),
      );
    },
  );
  it("handles leap years and local dates", () => {
    expect(periods("monthly", 2028)[1].end).toBe("2028-02-29");
    expect(localDate(new Date(2026, 0, 1))).toBe("2026-01-01");
  });
  it("allows logging historical periods today, but blocks future dates and periods", () => {
    expect(
      validCompletion("2026-06-21", "2026-04-01", "2026-06-30", "2026-10-01"),
    ).toBe(true);
    expect(
      validCompletion("2026-10-01", "2026-11-01", "2026-06-30", "2026-10-01"),
    ).toBe(false);
    expect(
      validCompletion("2026-10-02", "2026-10-01", "2026-12-31", "2026-10-01"),
    ).toBe(false);
    expect(
      validCompletion("2026-02-30", "2026-01-01", "2026-03-31", "2026-10-01"),
    ).toBe(false);
  });
});
describe("sync record operations", () => {
  it("keeps duplicate products and different years separate", () => {
    let items = change({}, { type: "add", card });
    items = change(items, { type: "add", card: { ...card, id: "second" } });
    items = change(items, {
      type: "complete",
      id: "test",
      benefitId: "flight",
      year: 2024,
      index: 1,
      date: "2024-06-21",
    });
    items = change(items, {
      type: "complete",
      id: "test",
      benefitId: "flight",
      year: 2025,
      index: 1,
      date: "2025-06-21",
    });
    const wallet = decode(items);
    expect(wallet.cards).toHaveLength(2);
    expect(wallet.records[recordKey("test", "flight", 2024, 1)]).toBe(
      "2024-06-21",
    );
    expect(
      wallet.records[recordKey("second", "flight", 2024, 1)],
    ).toBeUndefined();
    expect(wallet.records[recordKey("test", "flight", 2025, 1)]).toBe(
      "2025-06-21",
    );
  });
  it("merges completions and undo only removes the target period", () => {
    let items = change({}, { type: "add", card });
    items = change(items, {
      type: "complete",
      id: "test",
      benefitId: "flight",
      year: 2025,
      index: 0,
      date: "2025-01-21",
    });
    items = change(items, {
      type: "complete",
      id: "test",
      benefitId: "resort",
      year: 2025,
      index: 0,
      date: "2025-01-21",
    });
    items = change(items, {
      type: "complete",
      id: "test",
      benefitId: "flight",
      year: 2025,
      index: 0,
      date: null,
    });
    expect(Object.keys(decode(items).records)).toEqual(["test/2025/resort/0"]);
  });
  it("removes all records belonging to a removed card", () => {
    let items = change({}, { type: "add", card });
    items = change(items, {
      type: "complete",
      id: "test",
      benefitId: "flight",
      year: 2025,
      index: 0,
      date: "2025-01-21",
    });
    expect(decode(change(items, { type: "remove", id: "test" }))).toEqual({
      cards: [],
      records: {},
    });
  });
  it("blocks invalid date writes and records for deleted cards", () => {
    const items = change({}, { type: "add", card });
    expect(() =>
      change(items, {
        type: "complete",
        id: "test",
        benefitId: "flight",
        year: 2025,
        index: 0,
        date: "2025-02-30",
      }),
    ).toThrow();
    expect(() =>
      change(
        {},
        {
          type: "complete",
          id: "test",
          benefitId: "flight",
          year: 2025,
          index: 0,
          date: "2025-01-21",
        },
      ),
    ).toThrow();
  });
  it("checks byte quotas and item count before writes", () => {
    expect(() => checkQuota({ large: "x".repeat(8192) })).toThrow("8 KB");
    expect(() =>
      checkQuota(
        Object.fromEntries(
          Array.from({ length: 20 }, (_, i) => [String(i), "x".repeat(6000)]),
        ),
      ),
    ).toThrow("空间已满");
    expect(() =>
      checkQuota(
        Object.fromEntries(
          Array.from({ length: 513 }, (_, i) => [String(i), true]),
        ),
      ),
    ).toThrow();
    expect(() => checkQuota({ unicode: "旅".repeat(3000) })).toThrow();
  });
  it("excludes hidden perks and completed periods from the quarter's deadlines", () => {
    const wallet = {
      cards: [
        {
          ...card,
          benefits: card.benefits.map((b) => ({
            ...b,
            hidden: b.id === "clear",
          })),
        },
      ],
      records: { [recordKey("test", "flight", 2026, 3)]: "2026-10-01" },
    };
    expect(quarterDue(wallet, "2026-10-01").map((x) => x.benefit.id)).toEqual([
      "resort",
    ]);
  });
});

describe("quarterly deadlines and actual schedules", () => {
  it("includes future monthly periods this quarter but excludes expired months", () => {
    const monthly = {
      ...card,
      benefits: [
        {
          id: "monthly",
          name: "Monthly",
          amount: 10,
          frequency: "monthly" as const,
        },
      ],
    };
    expect(
      quarterDue({ cards: [monthly], records: {} }, "2026-10-02").map(
        (x) => x.period.label,
      ),
    ).toEqual(["OCT", "NOV", "DEC"]);
    expect(
      quarterDue({ cards: [monthly], records: {} }, "2026-11-02").map(
        (x) => x.period.label,
      ),
    ).toEqual(["NOV", "DEC"]);
  });
  it("counts calendar annual and semiannual perks only in their deadline quarter", () => {
    expect(
      quarterDue({ cards: [card], records: {} }, "2026-04-01").map(
        (x) => x.benefit.id,
      ),
    ).toEqual(["flight", "resort"]);
    expect(
      quarterDue({ cards: [card], records: {} }, "2026-07-01").map(
        (x) => x.benefit.id,
      ),
    ).toEqual(["flight"]);
  });
  it("honors TravelBank actual expiry across calendar years", () => {
    const ihg = {
      ...catalog.find((c) => c.productId === "chase-ihg-premier")!,
      id: "ihg",
      nickname: "",
      last4: "",
    };
    ihg.benefits = ihg.benefits.filter((b) => b.id === "united");
    const due = quarterDue({ cards: [ihg], records: {} }, "2027-01-01");
    expect(due).toHaveLength(1);
    expect(due[0].period.recordYear).toBe(2026);
    expect(due[0].period.end).toBe("2027-01-15");
    expect(
      quarterDue({ cards: [ihg], records: {} }, "2027-01-16"),
    ).toHaveLength(0);
  });
  it("does not invent cardmember or certificate deadlines", () => {
    const csp = {
      ...catalog.find((c) => c.productId === "chase-csp")!,
      id: "csp",
      nickname: "",
      last4: "",
    };
    expect(
      quarterDue({ cards: [csp], records: {} }, "2026-10-01").some(
        (x) => x.benefit.id === "hotel",
      ),
    ).toBe(false);
    const items = change(change({}, { type: "add", card: csp }), {
      type: "schedule",
      id: "csp",
      benefitId: "hotel",
      start: "2026-06-15",
      end: "2027-06-14",
    });
    const wallet = decode(items),
      due = quarterDue(wallet, "2027-04-01");
    expect(
      due.some(
        (x) => x.benefit.id === "hotel" && x.period.end === "2027-06-14",
      ),
    ).toBe(true);
  });
  it("gives a renewed manual schedule a distinct completion key", () => {
    const benefit = {
      id: "certificate",
      name: "Free Night",
      amount: 0,
      frequency: "manual" as const,
      schedule: { start: "2026-02-01", end: "2027-01-31" },
    };
    const first = benefitPeriods(benefit, 2026)[0];
    const second = benefitPeriods(
      { ...benefit, schedule: { start: "2026-03-01", end: "2027-02-28" } },
      2026,
    )[0];
    expect(recordKey("c", benefit.id, first.recordYear, first.index)).not.toBe(
      recordKey("c", benefit.id, second.recordYear, second.index),
    );
  });
  it("respects discontinued and limited-time benefits", () => {
    const platinum = catalog.find((c) => c.productId === "amex-platinum")!;
    expect(
      benefitPeriods(
        platinum.benefits.find((b) => b.id === "saks")!,
        2026,
      ),
    ).toHaveLength(1);
    const reserve = catalog.find((c) => c.productId === "chase-csr")!;
    expect(
      benefitPeriods(
        reserve.benefits.find((b) => b.id === "select-hotels-2026")!,
        2027,
      ),
    ).toHaveLength(0);
  });
});

describe("upgrades and preferences", () => {
  it("adds catalog perks to old cards without losing custom perks, hidden state or dates", () => {
    const legacy = {
      ...card,
      benefits: [
        { ...card.benefits[0], hidden: true },
        {
          id: "custom",
          name: "Custom",
          amount: 20,
          frequency: "annual" as const,
        },
      ],
    };
    const wallet = decode({
      "pd:card:test": legacy,
      "pd:year:test:2026": { "flight/0": "2026-01-21" },
    });
    expect(
      wallet.cards[0].benefits.find((b) => b.id === "flight")?.hidden,
    ).toBe(true);
    expect(wallet.cards[0].benefits.some((b) => b.id === "clear")).toBe(true);
    expect(wallet.cards[0].benefits.some((b) => b.id === "custom")).toBe(true);
    expect(wallet.records["test/2026/flight/0"]).toBe("2026-01-21");
    expect(() =>
      change(
        { "pd:card:test": legacy },
        { type: "hidden", id: "test", benefitId: "clear", hidden: true },
      ),
    ).not.toThrow();
  });
  it("hide and restore retain historical completion records", () => {
    let items = change({}, { type: "add", card });
    items = change(items, {
      type: "complete",
      id: "test",
      benefitId: "flight",
      year: 2025,
      index: 0,
      date: "2025-01-21",
    });
    items = change(items, {
      type: "hidden",
      id: "test",
      benefitId: "flight",
      hidden: true,
    });
    expect(decode(items).records["test/2025/flight/0"]).toBe("2025-01-21");
    expect(
      decode(items).cards[0].benefits.find((b) => b.id === "flight")?.hidden,
    ).toBe(true);
    items = change(items, {
      type: "hidden",
      id: "test",
      benefitId: "flight",
      hidden: false,
    });
    expect(
      decode(items).cards[0].benefits.find((b) => b.id === "flight")?.hidden,
    ).toBe(false);
  });
  it("can change an existing card suffix to five digits without changing records", () => {
    const items = {
      "pd:card:test": card,
      "pd:year:test:2025": { "flight/0": "2025-01-21" },
    };
    const updated = decode(
      change(items, {
        type: "identity",
        id: "test",
        nickname: "Updated",
        last4: "01007",
      }),
    );
    expect(updated.cards[0].last4).toBe("01007");
    expect(updated.records["test/2025/flight/0"]).toBe("2025-01-21");
    expect(() =>
      change(items, {
        type: "identity",
        id: "test",
        nickname: "",
        last4: "123456",
      }),
    ).toThrow();
  });
  it("persists theme preferences alongside the wallet", () => {
    expect(decode(change({}, { type: "theme", theme: "dark" })).theme).toBe(
      "dark",
    );
  });
  it("ships the expanded eligible catalog with source links and stable unique IDs", () => {
    expect(catalog.length).toBeGreaterThanOrEqual(45);
    expect(new Set(catalog.map((c) => c.productId)).size).toBe(catalog.length);
    for (const c of catalog) {
      expect(c.source).toMatch(/^https:\/\//);
      expect(new Set(c.benefits.map((b) => b.id)).size).toBe(c.benefits.length);
    }
    expect(catalog.some((c) => c.productId === "amex-hilton")).toBe(false);
    expect(
      catalog.every((c) => c.annualFee !== 0 || c.benefits.length > 0),
    ).toBe(true);
  });
});

describe("wallet value and language", () => {
  it("calculates Aspire 550/600 and retains earned value when hidden", () => {
    const c = { ...card, annualFee: 550 };
    const records = Object.fromEntries(
      c.benefits
        .filter((b) => ["flight", "resort"].includes(b.id))
        .flatMap((b) =>
          benefitPeriods(b, 2025).map((p) => [
            recordKey(c.id, b.id, 2025, p.index),
            "2025-12-31",
          ]),
        ),
    );
    expect(annualValue({ cards: [c], records }, 2025)).toEqual({
      fees: 550,
      recovered: 600,
      net: 50,
      missingFees: 0,
    });
    expect(
      annualValue(
        {
          cards: [
            { ...c, benefits: c.benefits.map((b) => ({ ...b, hidden: true })) },
          ],
          records,
        },
        2025,
      ).recovered,
    ).toBe(600);
    delete records[recordKey(c.id, "flight", 2025, 0)];
    expect(annualValue({ cards: [c], records }, 2025).net).toBe(0);
  });
  it("counts December extras and renewed manual records only once", () => {
    const c = {
      ...card,
      benefits: [
        {
          id: "cash",
          name: "cash",
          amount: 15,
          decemberExtra: 20,
          frequency: "monthly" as const,
        },
        {
          id: "manual",
          name: "manual",
          amount: 100,
          frequency: "manual" as const,
        },
      ],
    };
    const records = {
      "test/2025/cash/11": "2025-12-02",
      "test/2024/manual/2024-02-01_2026-01-31": "2025-12-03",
    };
    expect(annualValue({ cards: [c], records }, 2025).recovered).toBe(135);
    expect(annualValue({ cards: [c], records }, 2024).recovered).toBe(0);
  });
  it("persists language and fee overrides through catalog hydration", () => {
    let items = change(
      { "pd:card:test": card },
      { type: "language", language: "zh" },
    );
    items = change(items, {
      type: "identity",
      id: "test",
      nickname: "",
      last4: "",
      annualFee: 0,
    });
    expect(decode(items).language).toBe("zh");
    expect(decode(items).cards[0].annualFee).toBe(0);
  });
});

describe("expanded catalog safety", () => {
  it("each product fits one Chrome Sync item", () => {
    for (const product of catalog) {
      const saved = {
        ...product,
        id: product.productId,
        nickname: "My card",
        last4: "51007",
      };
      expect(() =>
        checkQuota({ ["pd:card:" + saved.id]: saved }),
      ).not.toThrow();
    }
  });
  it("keeps unlisted legacy cards accessible without deleting records", () => {
    const legacy = catalogData.products.find(
      (p) => p.productId === "amex-hilton",
    )!;
    const saved = {
      ...legacy,
      id: "old",
      nickname: "Hilton",
      last4: "1007",
    } as unknown as Card;
    expect(hydrateCard(saved).productId).toBe("amex-hilton");
    expect(decode({ "pd:card:old": saved }).cards).toHaveLength(1);
  });
  it("keeps anniversary credits manual and United monthly amounts distinct", () => {
    const quest = catalog.find((p) => p.productId === "chase-united-quest")!;
    expect(quest.benefits.find((b) => b.id === "hotel")?.frequency).toBe(
      "manual",
    );
    expect(
      quest.benefits
        .filter((b) => b.id.startsWith("instacart"))
        .map((b) => b.amount),
    ).toEqual([10, 5]);
    const ride = quest.benefits.find((b) => b.id === "rideshare")!;
    expect(ride.amount * 12 + (ride.decemberExtra ?? 0)).toBe(100);
    expect(
      benefitPeriods(
        quest.benefits.find((b) => b.id === "travelbank")!,
        2026,
      ),
    ).toHaveLength(0);
  });
  it("does not turn noncash Bilt benefits into cash recovery", () => {
    const product = catalog.find((p) => p.productId === "bilt-palladium")!;
    const c = { ...product, id: "bilt", nickname: "", last4: "" };
    expect(
      annualValue(
        { cards: [c], records: { "bilt/2026/bilt-cash/0": "2026-10-01" } },
        2026,
      ).recovered,
    ).toBe(0);
  });
  it("shows new catalog notes in English and Chinese", () => {
    const note = catalog
      .find((p) => p.productId === "amex-business-platinum")!
      .benefits.find((b) => b.id === "chatgpt")!.note!;
    setLanguage("en");
    expect(t(note)).toContain("ChatGPT Business");
    expect(t(note)).not.toMatch(/[\u4e00-\u9fff]/);
    setLanguage("zh");
    expect(t(note)).toBe(note);
    setLanguage("en");
  });
});
