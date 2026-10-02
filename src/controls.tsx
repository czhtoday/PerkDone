import { useEffect, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { localDate, type Card, type DueItem } from "./model";
import { t } from "./i18n";
function position(node: HTMLElement, anchor: HTMLElement | null) {
  const r = anchor?.getBoundingClientRect();
  const width = node.offsetWidth,
    height = node.offsetHeight;
  node.style.left = `${Math.max(8, Math.min(r?.left ?? 20, innerWidth - width - 8))}px`;
  node.style.top = `${Math.max(8, Math.min((r?.bottom ?? 20) + 6, innerHeight - height - 8))}px`;
}
export function CardFilter({
  cards,
  selected,
  onChange,
}: {
  cards: Card[];
  selected: string[] | null;
  onChange: (ids: string[] | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null),
    button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  function choose(id: string) {
    const ids = selected ?? cards.map((c) => c.id);
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    onChange(next.length === cards.length ? null : next);
  }
  return (
    <div className="card-filter">
      <button
        ref={button}
        className={`filter-button ${selected !== null ? "active" : ""}`}
        aria-label={t("选择卡片")}
        aria-expanded={open}
        onClick={() => {
          ref.current?.togglePopover();
          if (ref.current) position(ref.current, button.current);
        }}
      >
        {selected === null
          ? t("所有卡片")
          : `${selected.length} / ${cards.length} ${t("已选择")}`}
        <ChevronDown size={14} />
      </button>
      <div
        ref={ref}
        popover="auto"
        className="filter-popover"
        onToggle={(e) => setOpen(e.newState === "open")}
      >
        <div className="filter-actions">
          <button onClick={() => onChange(null)}>{t("全选")}</button>
          <button onClick={() => onChange([])}>{t("清空")}</button>
        </div>
        {cards.map((c) => (
          <label key={c.id}>
            <input
              type="checkbox"
              checked={selected === null || selected.includes(c.id)}
              onChange={() => choose(c.id)}
            />
            <span>
              {c.nickname || c.name}
              {c.last4 && <small> · {c.last4}</small>}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
export function DateEditor({
  item,
  anchor,
  date,
  setDate,
  onClose,
  error,
  busy,
  onSave,
  onUndo,
}: {
  item: DueItem;
  anchor: HTMLElement | null;
  date: string;
  setDate: (value: string) => void;
  onClose: () => void;
  error: string;
  busy: boolean;
  onSave: () => void;
  onUndo: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const node = ref.current!;
    node.showPopover();
    position(node, anchor);
    node.querySelector("input")?.focus();
    const handler = (e: Event) => {
      if ((e as ToggleEvent).newState === "closed") close.current();
    };
    node.addEventListener("toggle", handler);
    return () => {
      node.removeEventListener("toggle", handler);
      anchor?.isConnected && anchor.focus();
    };
  }, [anchor]);
  return (
    <div
      ref={ref}
      popover="auto"
      className="date-popover"
      role="dialog"
      aria-label={t("完成日期")}
    >
      <div className="date-head">
        <b>{item.benefit.name}</b>
        <button
          className="icon-button"
          aria-label={t("关闭")}
          onClick={onClose}
        >
          <X size={15} />
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
      >
        <label>
          {t("完成日期")}
          <input
            type="date"
            required
            max={localDate()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {t(error)}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {t("确认修改时间")}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={onUndo}
        >
          {t("撤销完成")}
        </button>
      </form>
    </div>
  );
}
