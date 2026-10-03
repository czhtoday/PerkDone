import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  X,
  CreditCard,
  GripVertical,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  cardLabel,
  localDate,
  type Card,
  type DueItem,
  type Product,
} from "./model";
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
            <span>{cardLabel(c)}</span>
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
  amount,
  setAmount,
  total,
  done = true,
}: {
  amount?: string;
  setAmount?: (value: string) => void;
  total?: number;
  done?: boolean;
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
      aria-label={amount === undefined ? t("完成日期") : t("记录已使用金额")}
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
        {amount !== undefined && (
          <label>
            {t("已使用金额")}
            <span className="amount-input">
              <input
                type="number"
                min="0"
                max={total}
                step="0.01"
                required
                value={amount}
                placeholder="0"
                onChange={(e) => setAmount?.(e.target.value)}
              />{" "}
              <span className="amount-limit">/ ${total}</span>
            </span>
            <small>{t("填写累计金额，记满自动完成。")}</small>
          </label>
        )}
        {(amount === undefined || done) && (
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
        )}
        {error && (
          <p className="error" role="alert">
            {t(error)}
          </p>
        )}
        <button className="primary" disabled={busy}>
          {t(amount === undefined ? "确认修改时间" : "保存金额")}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={busy}
          onClick={onUndo}
        >
          {t(amount === undefined || done ? "撤销完成" : "清空金额")}
        </button>
      </form>
    </div>
  );
}

export function CardArt({
  card,
  mini = false,
}: {
  card: Pick<Product, "name" | "bank" | "image">;
  mini?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [card.image]);
  return card.image && !failed ? (
    <img
      className={mini ? "mini-card-image" : "official-card-art"}
      src={card.image}
      alt={card.name}
      width={mini ? 46 : 77}
      height={mini ? 29 : 49}
      onError={() => setFailed(true)}
    />
  ) : (
    <span className={mini ? "mini-card" : "card-art"} aria-label={card.name}>
      <CreditCard size={mini ? 17 : 19} />
      {!mini && <span>{card.bank}</span>}
    </span>
  );
}

export function CardOrder({
  cards,
  busy,
  onSave,
}: {
  cards: Card[];
  busy: boolean;
  onSave: (ids: string[]) => void;
}) {
  const [ids, setIds] = useState(cards.map((c) => c.id));
  const [dragged, setDragged] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  function move(id: string, target: string) {
    setIds((old) => {
      const next = old.filter((x) => x !== id);
      next.splice(old.indexOf(target), 0, id);
      return next;
    });
  }
  return (
    <>
      <p className="modal-copy">{t("拖动卡片调整顺序，也可使用上下箭头。")}</p>
      <ol className="reorder-list">
        {ids.map((id, i) => {
          const card = cards.find((c) => c.id === id)!;
          return (
            <li
              key={id}
              className={over === id ? "drag-over" : ""}
              draggable={!busy}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", id);
                e.dataTransfer.effectAllowed = "move";
                setDragged(id);
              }}
              onDragOver={(e) => {
                if (dragged && dragged !== id) {
                  e.preventDefault();
                  setOver(id);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragged && dragged !== id) move(dragged, id);
                setDragged(null);
                setOver(null);
              }}
              onDragEnd={() => {
                setDragged(null);
                setOver(null);
              }}
            >
              <GripVertical size={16} className="drag-handle" />
              <CardArt card={card} mini />
              <b>{cardLabel(card)}</b>
              <button
                className="icon-button"
                aria-label={`${t("上移")} ${cardLabel(card)}`}
                disabled={busy || i === 0}
                onClick={() => move(id, ids[i - 1])}
              >
                <ArrowUp size={15} />
              </button>
              <button
                className="icon-button"
                aria-label={`${t("下移")} ${cardLabel(card)}`}
                disabled={busy || i === ids.length - 1}
                onClick={() => move(id, ids[i + 1])}
              >
                <ArrowDown size={15} />
              </button>
            </li>
          );
        })}
      </ol>
      <button
        className="primary form-submit"
        disabled={busy}
        onClick={() => onSave(ids)}
      >
        {t("保存顺序")}
      </button>
    </>
  );
}
