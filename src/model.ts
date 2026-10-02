export type Frequency =
  "annual" | "semiannual" | "quarterly" | "monthly" | "manual";
export type Theme = "system" | "light" | "dark";
export type Benefit = {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
  decemberExtra?: number;
  note?: string;
  valueLabel?: string;
  hidden?: boolean;
  validFrom?: string;
  validUntil?: string;
  expiryOffsetDays?: number;
  schedule?: { start: string; end: string };
};
export type Card = {
  id: string;
  productId: string;
  name: string;
  bank: string;
  nickname: string;
  last4: string;
  color: string;
  benefits: Benefit[];
  source?: string;
  verified?: string;
  description?: string;
  aliases?: string[];
};
export type Product = Omit<Card, "id" | "nickname" | "last4">;
export type Records = Record<string, string>;
export type Wallet = { cards: Card[]; records: Records; theme?: Theme };
export type Period = {
  index: number | string;
  recordYear: number;
  startMonth: number;
  span: number;
  label: string;
  start: string;
  end: string;
};
export const frequencies: Record<Frequency, string> = {
  annual: "全年",
  semiannual: "半年",
  quarterly: "季度",
  monthly: "每月",
  manual: "实际有效期",
};
export const months = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function isDate(date: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    localDate(new Date(`${date}T12:00:00`)) === date
  );
}
export function periods(frequency: Frequency, year: number): Period[] {
  if (frequency === "manual") return [];
  const count = { annual: 1, semiannual: 2, quarterly: 4, monthly: 12 }[
      frequency
    ],
    span = 12 / count;
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    recordYear: year,
    startMonth: i * span,
    span,
    label:
      count === 1
        ? "全年"
        : count === 2
          ? i === 0
            ? "上半年"
            : "下半年"
          : count === 4
            ? `Q${i + 1}`
            : months[i],
    start: `${year}-${String(i * span + 1).padStart(2, "0")}-01`,
    end: localDate(new Date(year, (i + 1) * span, 0)),
  }));
}
export function benefitPeriods(benefit: Benefit, year: number): Period[] {
  if (benefit.frequency === "manual") {
    const s = benefit.schedule;
    if (!s || s.start > `${year}-12-31` || s.end < `${year}-01-01`) return [];
    return [
      {
        index: `${s.start}_${s.end}`,
        recordYear: Number(s.start.slice(0, 4)),
        startMonth: 0,
        span: 12,
        label: "实际有效期",
        ...s,
      },
    ];
  }
  return periods(benefit.frequency, year)
    .map((p) => {
      let end = p.end;
      if (benefit.expiryOffsetDays) {
        const d = new Date(`${end}T12:00:00`);
        d.setDate(d.getDate() + benefit.expiryOffsetDays);
        end = localDate(d);
      }
      return {
        ...p,
        start:
          benefit.validFrom && benefit.validFrom > p.start
            ? benefit.validFrom
            : p.start,
        end:
          benefit.validUntil && benefit.validUntil < end
            ? benefit.validUntil
            : end,
      };
    })
    .filter((p) => p.start <= p.end);
}
export function recordKey(
  cardId: string,
  benefitId: string,
  year: number,
  index: number | string,
) {
  return `${cardId}/${year}/${benefitId}/${index}`;
}
export function periodAmount(benefit: Benefit, startMonth: number) {
  return (
    benefit.amount + (startMonth === 11 ? (benefit.decemberExtra ?? 0) : 0)
  );
}
export function validCompletion(
  date: string,
  start: string,
  end: string,
  today = localDate(),
) {
  return isDate(date) && date >= start && date <= end && date <= today;
}
export type DueItem = {
  card: Card;
  benefit: Benefit;
  period: Period;
  key: string;
};
export function quarterDue(wallet: Wallet, today = localDate()): DueItem[] {
  const y = Number(today.slice(0, 4)),
    month = Number(today.slice(5, 7)) - 1,
    end = localDate(new Date(y, (Math.floor(month / 3) + 1) * 3, 0));
  const due: DueItem[] = [];
  const seen = new Set<string>();
  for (const card of wallet.cards)
    for (const benefit of card.benefits) {
      if (benefit.hidden) continue;
      for (const year of [y - 1, y])
        for (const period of benefitPeriods(benefit, year)) {
          const key = recordKey(
            card.id,
            benefit.id,
            period.recordYear,
            period.index,
          );
          if (
            period.end >= today &&
            period.end <= end &&
            !wallet.records[key] &&
            !seen.has(key)
          ) {
            due.push({ card, benefit, period, key });
            seen.add(key);
          }
        }
    }
  return due.sort(
    (a, b) =>
      a.period.end.localeCompare(b.period.end) ||
      a.card.name.localeCompare(b.card.name) ||
      a.benefit.name.localeCompare(b.benefit.name),
  );
}
