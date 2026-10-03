export type Frequency =
  "annual" | "semiannual" | "quarterly" | "monthly" | "manual";
export type Language = "en" | "zh";
export type Theme = "system" | "light" | "dark";
export type Benefit = {
  id: string;
  name: string;
  amount: number;
  frequency: Frequency;
  decemberExtra?: number;
  amountChanges?: { from: string; amount: number }[];
  trackAmount?: boolean;
  windows?: { start: string; end: string }[];
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
  image?: string;
  imageSource?: string;
  source?: string;
  verified?: string;
  description?: string;
  aliases?: string[];
  annualFee?: number;
};
export type Product = Omit<Card, "id" | "nickname" | "last4">;
export type Records = Record<string, string>;
export type Wallet = {
  cards: Card[];
  records: Records;
  progress?: Record<string, { amount: number; date: string }>;
  theme?: Theme;
  language?: Language;
};
export type Period = {
  index: number | string;
  recordYear: number;
  startMonth: number;
  span: number;
  label: string;
  start: string;
  end: string;
  deadlineKnown?: boolean;
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
  if (
    (benefit.validFrom && benefit.validFrom > `${year}-12-31`) ||
    (benefit.validUntil && benefit.validUntil < `${year}-01-01`)
  )
    return [];
  if (benefit.windows)
    return benefit.windows.flatMap((w, index) =>
      w.start <= `${year}-12-31` && w.end >= `${year}-01-01`
        ? [
            {
              index,
              recordYear: Number(w.start.slice(0, 4)),
              startMonth: Number(w.start.slice(5, 7)) - 1,
              span: 12,
              label: "限时优惠",
              ...w,
            },
          ]
        : [],
    );
  if (benefit.frequency === "manual") {
    const s = benefit.schedule;
    if (!s)
      return [
        {
          index: "undated",
          recordYear: year,
          startMonth: 0,
          span: 12,
          label: "自由记录",
          start:
            benefit.validFrom && benefit.validFrom > `${year}-01-01`
              ? benefit.validFrom
              : `${year}-01-01`,
          end:
            benefit.validUntil && benefit.validUntil < `${year}-12-31`
              ? benefit.validUntil
              : `${year}-12-31`,
          deadlineKnown: false,
        },
      ];
    if (s.start > `${year}-12-31` || s.end < `${year}-01-01`) return [];
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
export function periodAmount(
  benefit: Benefit,
  startMonth: number,
  year = new Date().getFullYear(),
) {
  const start = `${year}-${String(startMonth + 1).padStart(2, "0")}-01`;
  const changed = benefit.amountChanges
    ?.filter((v) => v.from <= start)
    .sort((a, b) => b.from.localeCompare(a.from))[0];
  return (
    (changed?.amount ?? benefit.amount) +
    (startMonth === 11 ? (benefit.decemberExtra ?? 0) : 0)
  );
}
export function validCompletion(
  date: string,
  start: string,
  _end: string,
  today = localDate(),
) {
  return isDate(date) && date <= today && start <= today;
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
            period.deadlineKnown !== false &&
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

// Face value of completed cash-equivalent perks, attributed to their calendar period.
// Hidden completions still count: hiding a perk does not undo value already used.
export function annualValue(wallet: Wallet, year: number) {
  let recovered = 0;
  const seen = new Set<string>();
  for (const card of wallet.cards)
    for (const benefit of card.benefits) {
      if (benefit.frequency === "manual") {
        for (const [key, date] of Object.entries({
          ...wallet.progress,
          ...wallet.records,
        })) {
          const parts = key.split("/");
          if (
            parts[0] === card.id &&
            parts[2] === benefit.id &&
            Number(
              (typeof date === "string" ? date : date.date).slice(0, 4),
            ) === year &&
            !seen.has(key)
          ) {
            recovered += wallet.progress?.[key]?.amount ?? benefit.amount;
            seen.add(key);
          }
        }
      } else
        for (const p of benefitPeriods(benefit, year)) {
          const key = recordKey(card.id, benefit.id, p.recordYear, p.index);
          if (
            (wallet.records[key] || wallet.progress?.[key]) &&
            !seen.has(key)
          ) {
            recovered +=
              wallet.progress?.[key]?.amount ??
              periodAmount(benefit, p.startMonth, p.recordYear);
            seen.add(key);
          }
        }
    }
  const fees = wallet.cards.reduce((n, c) => n + (c.annualFee ?? 0), 0);
  recovered = Math.round(recovered * 100) / 100;
  return {
    fees: Math.round(fees * 100) / 100,
    recovered,
    net: Math.round((recovered - fees) * 100) / 100,
    missingFees: wallet.cards.filter((c) => c.annualFee === undefined).length,
  };
}

export function cardLabel(card: Pick<Card, "name" | "nickname" | "last4">) {
  return [card.nickname.trim() || card.name, card.last4]
    .filter(Boolean)
    .join(" ");
}
