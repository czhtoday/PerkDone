import {
  localDate,
  periodAmount,
  benefitPeriods,
  isDate,
  type Theme,
  type Language,
  validCompletion,
  type Card,
  type Wallet,
} from "./model";
import { hydrateCard } from "./catalog";
const prefix = "pd:";
export type Mutation =
  | { type: "order"; ids: string[] }
  | {
      type: "amount";
      id: string;
      year: number;
      benefitId: string;
      index: number | string;
      amount: number;
      date: string;
    }
  | { type: "language"; language: Language }
  | {
      type: "identity";
      id: string;
      nickname: string;
      last4: string;
      annualFee?: number;
    }
  | { type: "theme"; theme: Theme }
  | { type: "hidden"; id: string; benefitId: string; hidden: boolean }
  | {
      type: "schedule";
      id: string;
      benefitId: string;
      start: string;
      end: string;
    }
  | { type: "add"; card: Card }
  | { type: "remove"; id: string }
  | { type: "benefit"; id: string; benefit: Card["benefits"][number] }
  | {
      type: "complete";
      id: string;
      year: number;
      benefitId: string;
      index: number | string;
      date: string | null;
    };
export type Items = Record<string, unknown>;
export function decode(items: Items): Wallet {
  const cards = Object.entries(items)
    .filter(([key]) => key.startsWith(`${prefix}card:`))
    .map(([, value]) => hydrateCard(value as Card));
  const order = (items["pd:order"] as string[] | undefined) ?? [];
  cards.sort(
    (a, b) =>
      (order.indexOf(a.id) < 0 ? order.length : order.indexOf(a.id)) -
      (order.indexOf(b.id) < 0 ? order.length : order.indexOf(b.id)),
  );
  const progress: NonNullable<Wallet["progress"]> = {};
  for (const [key, value] of Object.entries(items))
    if (key.startsWith("pd:amount:")) {
      const [, , id, year] = key.split(":");
      for (const [period, amount] of Object.entries(value as typeof progress))
        progress[`${id}/${year}/${period}`] = amount;
    }
  const records: Wallet["records"] = {};
  for (const [key, value] of Object.entries(items))
    if (key.startsWith(`${prefix}year:`)) {
      const [, , id, year] = key.split(":");
      for (const [period, date] of Object.entries(
        value as Record<string, string>,
      ))
        records[`${id}/${year}/${period}`] = date;
    }
  const theme = items["pd:theme"] as Theme | undefined;
  const language = items["pd:language"] as Language | undefined;
  return {
    cards,
    records,
    progress,
    ...(theme ? { theme } : {}),
    ...(language ? { language } : {}),
  };
}
export function change(items: Items, mutation: Mutation) {
  const next = { ...items };
  if (mutation.type === "order") {
    const ids = decode(items).cards.map((c) => c.id);
    if (
      new Set(mutation.ids).size !== mutation.ids.length ||
      mutation.ids.some((id) => !ids.includes(id))
    )
      throw new Error("Invalid card order.");
    next["pd:order"] = [
      ...mutation.ids,
      ...ids.filter((id) => !mutation.ids.includes(id)),
    ];
  } else if (mutation.type === "language") {
    if (!["en", "zh"].includes(mutation.language))
      throw new Error("Invalid language.");
    next["pd:language"] = mutation.language;
  } else if (mutation.type === "theme") {
    if (!["system", "light", "dark"].includes(mutation.theme))
      throw new Error("无效主题");
    next["pd:theme"] = mutation.theme;
  } else if (mutation.type === "add") {
    const ids = decode(items).cards.map((c) => c.id);
    next[`${prefix}card:${mutation.card.id}`] = mutation.card;
    next["pd:order"] = ids.includes(mutation.card.id)
      ? ids
      : [...ids, mutation.card.id];
  } else if (mutation.type === "remove") {
    delete next[`${prefix}card:${mutation.id}`];
    for (const key of Object.keys(next))
      if (
        key.startsWith(`${prefix}year:${mutation.id}:`) ||
        key.startsWith(`${prefix}amount:${mutation.id}:`)
      )
        delete next[key];
    if (next["pd:order"]) {
      const order = (next["pd:order"] as string[]).filter(
        (id) => id !== mutation.id,
      );
      if (order.length) next["pd:order"] = order;
      else delete next["pd:order"];
    }
  } else {
    const stored = next[`${prefix}card:${mutation.id}`] as Card | undefined;
    const card = stored ? hydrateCard(stored) : undefined;
    if (!card) throw new Error("卡片已移除，请重新打开面板。");
    if (mutation.type === "identity") {
      if (mutation.last4 && !/^[0-9]{4,5}$/.test(mutation.last4))
        throw new Error("尾号需要为 4–5 位数字。");
      if (
        mutation.annualFee !== undefined &&
        (!Number.isFinite(mutation.annualFee) || mutation.annualFee < 0)
      )
        throw new Error("Annual fee must be a non-negative number.");
      next[`${prefix}card:${card.id}`] = {
        ...card,
        ...(mutation.annualFee !== undefined
          ? { annualFee: mutation.annualFee }
          : {}),
        nickname: mutation.nickname,
        last4: mutation.last4,
      };
    } else if (mutation.type === "benefit")
      next[`${prefix}card:${card.id}`] = {
        ...card,
        benefits: [...card.benefits, mutation.benefit],
      };
    else if (mutation.type === "hidden" || mutation.type === "schedule") {
      if (!card.benefits.some((b) => b.id === mutation.benefitId))
        throw new Error("权益不存在。");
      if (
        mutation.type === "schedule" &&
        (!isDate(mutation.start) ||
          !isDate(mutation.end) ||
          mutation.end < mutation.start)
      )
        throw new Error("请输入有效的开始和到期日期。");
      next[`${prefix}card:${card.id}`] = {
        ...card,
        benefits: card.benefits.map((b) =>
          b.id === mutation.benefitId
            ? {
                ...b,
                ...(mutation.type === "hidden"
                  ? { hidden: mutation.hidden }
                  : { schedule: { start: mutation.start, end: mutation.end } }),
              }
            : b,
        ),
      };
    } else {
      const benefit = card.benefits.find((b) => b.id === mutation.benefitId);
      const period =
        benefit &&
        benefitPeriods(benefit, mutation.year).find(
          (p) => p.index === mutation.index && p.recordYear === mutation.year,
        );
      if (
        !period ||
        (mutation.type === "amount" && !isDate(mutation.date)) ||
        (mutation.date &&
          !validCompletion(
            mutation.date,
            period.start,
            period.end,
            localDate(),
          ))
      )
        throw new Error("请选择不晚于今天的有效日期；尚未开始的周期不可完成。");
      const key = `${prefix}year:${card.id}:${mutation.year}`;
      const group = { ...((next[key] as Record<string, string>) ?? {}) };
      const periodKey = `${mutation.benefitId}/${mutation.index}`;
      const amountKey = `${prefix}amount:${card.id}:${mutation.year}`;
      const amounts = {
        ...((next[amountKey] as NonNullable<Wallet["progress"]>) ?? {}),
      };
      if (mutation.type === "amount") {
        const cap = periodAmount(
          benefit!,
          period.startMonth,
          period.recordYear,
        );
        if (
          !benefit!.trackAmount ||
          !Number.isFinite(mutation.amount) ||
          mutation.amount < 0 ||
          mutation.amount > cap ||
          (Math.round(mutation.amount * 100) !== mutation.amount * 100 &&
            Math.abs(
              Math.round(mutation.amount * 100) - mutation.amount * 100,
            ) > 1e-7)
        )
          throw new Error("请输入额度范围内的有效金额。");
        if (mutation.amount > 0)
          amounts[periodKey] = { amount: mutation.amount, date: mutation.date };
        else delete amounts[periodKey];
        if (mutation.amount === cap) group[periodKey] = mutation.date;
        else delete group[periodKey];
      } else if (mutation.date) {
        group[periodKey] = mutation.date;
        if (amounts[periodKey])
          amounts[periodKey] = { ...amounts[periodKey], date: mutation.date };
      } else {
        delete group[periodKey];
        delete amounts[periodKey];
      }
      if (Object.keys(amounts).length) next[amountKey] = amounts;
      else delete next[amountKey];
      if (Object.keys(group).length) next[key] = group;
      else delete next[key];
    }
  }
  checkQuota(next);
  return next;
}
export function checkQuota(items: Items) {
  const encoder = new TextEncoder();
  const sizes = Object.entries(items).map(
    ([key, value]) =>
      encoder.encode(key).length + encoder.encode(JSON.stringify(value)).length,
  );
  if (sizes.some((s) => s > 8192))
    throw new Error(
      "单张卡片或年度记录超过 Chrome 同步的 8 KB 限制。请减少自定义福利。",
    );
  if (sizes.reduce((a, b) => a + b, 0) > 102400 || sizes.length > 512)
    throw new Error("Chrome 同步空间已满，修改未保存。请移除不再需要的卡片。");
}
export const isExtension =
  typeof chrome !== "undefined" && !!chrome.runtime?.id;
const previewKey = "perk-done-preview-v1";
export async function readWallet(): Promise<Wallet> {
  const items = isExtension
    ? await chrome.storage.sync.get(null)
    : JSON.parse(localStorage.getItem(previewKey) ?? "{}");
  return decode(items);
}
export async function mutate(mutation: Mutation) {
  if (isExtension) {
    const result = await chrome.runtime.sendMessage({
      kind: "mutate",
      mutation,
    });
    if (!result?.ok) throw new Error(result?.error ?? "保存失败，请重试。");
  } else {
    const items = JSON.parse(localStorage.getItem(previewKey) ?? "{}");
    localStorage.setItem(previewKey, JSON.stringify(change(items, mutation)));
  }
  return readWallet();
}
export function subscribe(listener: () => void) {
  if (isExtension) {
    const handler = (_: unknown, area: string) => {
      if (area === "sync") listener();
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  }
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}
