import { change, type Mutation } from "./storage";
// Serialize local read/modify/write operations across all dashboard tabs.
let queue = Promise.resolve();
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== chrome.runtime.id || message.kind !== "mutate") return;
  queue = queue.then(async () => {
    try {
      const before = await chrome.storage.sync.get(null);
      const after = change(before, message.mutation as Mutation);
      const updates = Object.fromEntries(
        Object.entries(after).filter(
          ([key, value]) =>
            JSON.stringify(value) !== JSON.stringify(before[key]),
        ),
      );
      const removed = Object.keys(before).filter((key) => !(key in after));
      if (Object.keys(updates).length) await chrome.storage.sync.set(updates);
      if (removed.length) await chrome.storage.sync.remove(removed);
      respond({ ok: true });
    } catch (error) {
      respond({
        ok: false,
        error: error instanceof Error ? error.message : "保存失败",
      });
    }
  });
  return true;
});
