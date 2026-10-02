import {
  localDate,
  benefitPeriods,
  isDate,
  type Theme,
  validCompletion,
  type Card,
  type Wallet,
} from "./model";
import { hydrateCard } from "./catalog";
const prefix = "pd:";
export type Mutation =
  | { type: "identity"; id: string; nickname: string; last4: string }
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
  return { cards, records, ...(theme ? { theme } : {}) };
}
export function change(items: Items, mutation: Mutation) {
  const next = { ...items };
  if (mutation.type === "theme") {
    if (!["system", "light", "dark"].includes(mutation.theme))
      throw new Error("无效主题");
    next["pd:theme"] = mutation.theme;
  } else if (mutation.type === "add")
    next[`${prefix}card:${mutation.card.id}`] = mutation.card;
  else if (mutation.type === "remove") {
    delete next[`${prefix}card:${mutation.id}`];
    for (const key of Object.keys(next))
      if (key.startsWith(`${prefix}year:${mutation.id}:`)) delete next[key];
  } else {
    const stored = next[`${prefix}card:${mutation.id}`] as Card | undefined;
    const card = stored ? hydrateCard(stored) : undefined;
    if (!card) throw new Error("卡片已移除，请重新打开面板。");
    if (mutation.type === "identity") {
      if (mutation.last4 && !/^[0-9]{4,5}$/.test(mutation.last4))
        throw new Error("尾号需要为 4–5 位数字。");
      next[`${prefix}card:${card.id}`] = {
        ...card,
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
        (mutation.date &&
          !validCompletion(
            mutation.date,
            period.start,
            period.end,
            localDate(),
          ))
      )
        throw new Error("完成日期必须在该福利周期内，且不能晚于今天。");
      const key = `${prefix}year:${card.id}:${mutation.year}`;
      const group = { ...((next[key] as Record<string, string>) ?? {}) };
      const periodKey = `${mutation.benefitId}/${mutation.index}`;
      if (mutation.date) group[periodKey] = mutation.date;
      else delete group[periodKey];
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
