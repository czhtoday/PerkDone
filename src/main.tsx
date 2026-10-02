import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Plus,
  X,
  Trash2,
  Cloud,
  CircleHelp,
  MoreHorizontal,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Monitor,
  Settings2,
  Pencil,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { catalog } from "./catalog";
import {
  benefitPeriods,
  frequencies,
  localDate,
  months,
  periodAmount,
  recordKey,
  quarterDue,
  validCompletion,
  type Card,
  type Benefit,
  type Frequency,
  type Wallet,
  type Period,
  type DueItem,
  type Theme,
} from "./model";
import {
  isExtension,
  mutate,
  readWallet,
  subscribe,
  type Mutation,
} from "./storage";
import "./styles.css";
const popup = window.location.pathname.endsWith("/popup.html");
const money = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
const shortDate = (date: string) =>
  `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;
const value = (b: Benefit, p?: Period) =>
  b.valueLabel || money(periodAmount(b, p?.startMonth ?? 0));
function cachedTheme(): Theme {
  try {
    const v = localStorage.getItem("pd-theme");
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}
function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme =
    theme === "system" ? "light dark" : theme;
}
applyTheme(cachedTheme());
const empty: Wallet = { cards: [], records: {} };
function Modal({
  title,
  children,
  onClose,
  error,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  error?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button className="icon-button" aria-label="关闭" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {children}
    </dialog>
  );
}
function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <CheckCheck size={23} />
      </span>
      perk done<span className="brand-dot">.</span>
    </span>
  );
}
function App() {
  const [wallet, setWallet] = useState<Wallet>(empty),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [demo, setDemo] = useState(
      new URLSearchParams(window.location.search).get("demo") === "1",
    ),
    [theme, setTheme] = useState<Theme>(cachedTheme);
  const [year, setYear] = useState(new Date().getFullYear()),
    [selected, setSelected] = useState("all"),
    [add, setAdd] = useState(false),
    [benefitCard, setBenefitCard] = useState<Card | null>(null),
    [remove, setRemove] = useState<Card | null>(null),
    [editCard, setEditCard] = useState<Card | null>(null),
    [help, setHelp] = useState(false),
    [hiddenCard, setHiddenCard] = useState<Card | null>(null),
    [showAllDue, setShowAllDue] = useState(false);
  const [completion, setCompletion] = useState<DueItem | null>(null),
    [date, setDate] = useState(localDate()),
    [schedule, setSchedule] = useState<{ card: Card; benefit: Benefit } | null>(
      null,
    );
  const [search, setSearch] = useState(""),
    [product, setProduct] = useState(catalog[0].productId);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    const load = () =>
      readWallet()
        .then((w) => {
          if (active) {
            setWallet(w);
            setTheme(w.theme ?? cachedTheme());
            setLoading(false);
          }
        })
        .catch((e) => {
          if (active) {
            setError(String(e));
            setLoading(false);
          }
        });
    void load();
    const stop = subscribe(() => void load());
    return () => {
      active = false;
      stop();
    };
  }, []);
  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem("pd-theme", theme);
    } catch {}
  }, [theme]);
  const demoCards = catalog
    .filter((p) =>
      ["amex-aspire", "amex-platinum", "chase-csr"].includes(p.productId),
    )
    .map((p, i) => ({
      ...p,
      id: `demo-${i}`,
      nickname: ["Travel card", "Everyday perks", "Travel & dining"][i],
      last4: ["01007", "07997", "4218"][i],
      benefits: p.benefits.map((b) => ({
        ...b,
        hidden: [
          "clear",
          "equinox",
          "walmart",
          "free-night",
          "travel",
          "peloton",
          "doordash-1",
          "doordash-2",
          "doordash-dining",
          "lyft",
        ].includes(b.id),
      })),
    }));
  const demoWallet: Wallet = {
    cards: demoCards,
    records: Object.fromEntries(
      demoCards.flatMap((card) =>
        card.benefits.flatMap((b) =>
          benefitPeriods(b, year)
            .filter((p) => p.end < localDate())
            .map((p) => [
              recordKey(card.id, b.id, p.recordYear, p.index),
              p.end,
            ]),
        ),
      ),
    ),
  };
  const shown = demo ? demoWallet : wallet,
    cards = shown.cards.filter((c) => selected === "all" || c.id === selected),
    due = quarterDue(shown),
    quarter = Math.floor(new Date().getMonth() / 3) + 1;
  const activeHiddenCard = shown.cards.find((c) => c.id === hiddenCard?.id);
  const unset = shown.cards.reduce(
    (n, c) =>
      n +
      c.benefits.filter(
        (b) => !b.hidden && b.frequency === "manual" && !b.schedule,
      ).length,
    0,
  );
  async function save(m: Mutation) {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      setWallet(await mutate(m));
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function changeTheme(t: Theme) {
    const old = theme;
    setTheme(t);
    if (!(await save({ type: "theme", theme: t }))) setTheme(old);
  }
  async function openPanel() {
    if (isExtension) {
      await chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
      window.close();
    } else window.open("./index.html", "_blank");
  }
  function openAdd() {
    setDemo(false);
    setAdd(true);
    setSearch("");
    setProduct(catalog[0].productId);
  }
  function openCompletion(card: Card, benefit: Benefit, period: Period) {
    const key = recordKey(card.id, benefit.id, period.recordYear, period.index);
    setCompletion({ card, benefit, period, key });
    setDate(
      shown.records[key] ||
        (period.end < localDate() ? period.end : localDate()),
    );
    setError("");
  }
  async function addCard(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      p = catalog.find((c) => c.productId === product);
    const card: Card = {
      ...(p ?? {
        productId: "custom",
        name: String(f.get("name")).trim(),
        bank: String(f.get("bank")).trim(),
        color: "neutral",
        benefits: [],
      }),
      id: crypto.randomUUID(),
      nickname: String(f.get("nickname")).trim(),
      last4: String(f.get("last4")).trim(),
    };
    if (await save({ type: "add", card })) {
      setSelected("all");
      setAdd(false);
    }
  }
  async function addBenefit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!benefitCard) return;
    const f = new FormData(e.currentTarget);
    const benefit: Benefit = {
      id: crypto.randomUUID(),
      name: String(f.get("name")).trim(),
      amount: Number(f.get("amount")),
      frequency: String(f.get("frequency")) as Frequency,
      note: String(f.get("note")).trim(),
    };
    if (await save({ type: "benefit", id: benefitCard.id, benefit }))
      setBenefitCard(null);
  }
  async function finish(doneDate: string | null) {
    if (!completion) return;
    const { card, benefit, period } = completion;
    if (
      await save({
        type: "complete",
        id: card.id,
        benefitId: benefit.id,
        year: period.recordYear,
        index: period.index,
        date: doneDate,
      })
    )
      setCompletion(null);
  }
  async function saveSchedule(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!schedule) return;
    const f = new FormData(e.currentTarget);
    if (
      await save({
        type: "schedule",
        id: schedule.card.id,
        benefitId: schedule.benefit.id,
        start: String(f.get("start")),
        end: String(f.get("end")),
      })
    )
      setSchedule(null);
  }
  function DueList() {
    return (
      <>
        {(popup || showAllDue ? due : due.slice(0, 4)).map((item) => (
          <div className="due-row" key={item.key}>
            <button
              className="quick-check"
              disabled={busy || demo || item.period.start > localDate()}
              onClick={() =>
                openCompletion(item.card, item.benefit, item.period)
              }
              aria-label={`完成 ${item.card.nickname || item.card.name} ${item.benefit.name} ${item.period.label}`}
              title={
                item.period.start > localDate()
                  ? `${item.period.start} 开始`
                  : "标记完成"
              }
            >
              <Check size={14} />
            </button>
            <div className="due-description">
              <b>{item.benefit.name}</b>
              <span>
                {item.card.nickname || item.card.name}
                {item.card.last4 ? ` · ${item.card.last4}` : ""}{" "}
                <span className="due-period">/ {item.period.label}</span>
              </span>
            </div>
            <div className="due-meta">
              <b>{value(item.benefit, item.period)}</b>
              <span>
                {shortDate(item.period.end)} 到期
                {item.period.start > localDate() ? " · 未开始" : ""}
              </span>
            </div>
          </div>
        ))}
        {due.length === 0 && (
          <div className="quarter-clear">
            <CheckCheck size={18} />
            <span>
              {shown.cards.length
                ? "本季度暂无待完成权益"
                : "添加卡片后，这里会列出本季度到期的权益。"}
            </span>
          </div>
        )}
        {!popup && due.length > 4 && (
          <button className="more-due" onClick={() => setShowAllDue((v) => !v)}>
            {showAllDue ? "收起" : `查看全部 ${due.length} 项`}
            <ChevronDown size={14} />
          </button>
        )}
      </>
    );
  }
  return (
    <div className={popup ? "app popup" : "app dashboard"}>
      <header className="app-header">
        <Brand />
        <div className="header-actions">
          {!popup && (
            <span className="sync">
              <Cloud size={14} />
              {demo ? "DEMO" : isExtension ? "Chrome Sync" : "Local preview"}
            </span>
          )}
          <div className="theme-control" aria-label="主题">
            {(["system", "light", "dark"] as Theme[]).map((t) => (
              <button
                key={t}
                className={theme === t ? "selected" : ""}
                aria-label={
                  { system: "跟随系统", light: "浅色模式", dark: "深色模式" }[t]
                }
                title={
                  { system: "跟随系统", light: "浅色模式", dark: "深色模式" }[t]
                }
                aria-pressed={theme === t}
                disabled={busy}
                onClick={() => void changeTheme(t)}
              >
                {t === "system" ? (
                  <Monitor size={14} />
                ) : t === "light" ? (
                  <Sun size={14} />
                ) : (
                  <Moon size={14} />
                )}
              </button>
            ))}
          </div>
          {!popup && (
            <button
              className="icon-button"
              aria-label="关于 Perk Done"
              onClick={() => setHelp(true)}
            >
              <CircleHelp size={17} />
            </button>
          )}
        </div>
      </header>
      <main>
        {!popup && (
          <div className="page-heading">
            <div>
              <div className="eyebrow">A LITTLE LESS TO REMEMBER.</div>
              <h1>Your perks, handled.</h1>
              <p>只留下你想用的权益。其余的，藏起来就好。</p>
            </div>
            <button
              className="primary"
              onClick={openAdd}
              disabled={busy || loading}
            >
              <Plus size={16} />
              添加信用卡
            </button>
          </div>
        )}
        {demo && (
          <div className="demo-banner">
            <span>示例模式 · 不会保存示例记录</span>
            <button
              onClick={() => {
                setDemo(false);
                setSelected("all");
              }}
            >
              退出示例
              <X size={13} />
            </button>
          </div>
        )}
        {error &&
          !completion &&
          !add &&
          !benefitCard &&
          !hiddenCard &&
          !schedule &&
          !remove &&
          !editCard && (
            <div className="error" role="alert">
              {error}
              <button aria-label="关闭错误" onClick={() => setError("")}>
                <X size={14} />
              </button>
            </div>
          )}
        {loading ? (
          <div className="empty">
            <p>读取权益中…</p>
          </div>
        ) : (
          <>
            <section className="quarter-focus">
              <div className="quarter-heading">
                <div>
                  <span className="eyebrow">
                    THIS QUARTER / {new Date().getFullYear()} Q{quarter}
                  </span>
                  <h2>
                    <strong data-testid="due-count">{due.length}</strong>
                    <span>项权益，本季度到期</span>
                  </h2>
                </div>
                <span className="quarter-end">
                  截至 {quarter * 3}/{[31, 30, 30, 31][quarter - 1]}
                </span>
              </div>
              <div className="due-list">
                <DueList />
              </div>
              {unset > 0 && (
                <p className="unset-note">
                  {unset} 项权益尚未设置实际有效期，暂不计入到期待办。
                  {popup && (
                    <button onClick={() => void openPanel()}>
                      去设置
                      <ArrowRight size={12} />
                    </button>
                  )}
                </p>
              )}
            </section>
            {popup ? (
              <footer className="popup-footer">
                <span>
                  {shown.cards.length} 张卡片 ·{" "}
                  {isExtension ? "Chrome Sync" : "Local preview"}
                </span>
                <button className="primary" onClick={() => void openPanel()}>
                  打开完整面板
                  <ArrowUpRight size={14} />
                </button>
              </footer>
            ) : (
              <section className="tracker">
                <div className="tracker-toolbar">
                  <div className="toolbar-left">
                    <h2>我的权益</h2>
                    <span className="card-count">
                      {shown.cards.length} 张卡片
                    </span>
                    {shown.cards.length > 0 && (
                      <select
                        aria-label="筛选信用卡"
                        value={selected}
                        onChange={(e) => setSelected(e.target.value)}
                      >
                        <option value="all">全部信用卡</option>
                        {shown.cards.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nickname || c.name}
                            {c.last4 ? ` · ${c.last4}` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="year-control">
                    <button
                      aria-label="上一年"
                      disabled={year <= 2000}
                      onClick={() => setYear((y) => y - 1)}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span>{year}</span>
                    <button
                      aria-label="下一年"
                      disabled={year >= 2100}
                      onClick={() => setYear((y) => y + 1)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
                {shown.cards.length === 0 ? (
                  <div className="empty">
                    <span className="empty-icon">
                      <CreditCard size={32} />
                    </span>
                    <h3>从第一张信用卡开始</h3>
                    <p>
                      添加信用卡，保留你想用的权益。
                      <br />
                      全年、半年、季度、每月，自动对齐。
                    </p>
                    <button className="primary" onClick={openAdd}>
                      <Plus size={16} />
                      添加第一张信用卡
                    </button>
                    <button
                      className="text-button"
                      onClick={() => {
                        setDemo(true);
                        setSelected("all");
                      }}
                    >
                      先看看示例
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="timeline-scroll">
                    <div className="timeline">
                      <div className="month-row">
                        <div className="label-cell">PERKS / {year}</div>
                        <div className="month-grid">
                          {months.map((m, i) => (
                            <span
                              className={
                                year === new Date().getFullYear() &&
                                i === new Date().getMonth()
                                  ? "current-month"
                                  : ""
                              }
                              key={m}
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </div>
                      {cards.map((card) => (
                        <section className="card-section" key={card.id}>
                          <div className="card-heading">
                            <div className="card-art">
                              <span>
                                {card.bank === "Chase" ? "CHASE" : "AMEX"}
                              </span>
                              <CreditCard size={19} />
                              <b>
                                {card.last4 ? `•• ${card.last4}` : "PERK DONE"}
                              </b>
                            </div>
                            <div className="card-title">
                              <small>{card.bank}</small>
                              <h3>{card.name}</h3>
                              {(card.nickname || card.last4) && (
                                <span>
                                  {card.nickname}
                                  {card.last4 ? ` · ${card.last4}` : ""}
                                </span>
                              )}
                            </div>
                            <div className="card-actions">
                              <button
                                className="icon-button"
                                aria-label={`编辑 ${card.nickname || card.name} 昵称与尾号`}
                                title="编辑昵称与尾号"
                                disabled={demo || busy}
                                onClick={() => {
                                  setEditCard(card);
                                  setError("");
                                }}
                              >
                                <Pencil size={14} />
                              </button>
                              {card.source && (
                                <a
                                  href={card.source}
                                  target="_blank"
                                  rel="noreferrer"
                                  aria-label={`${card.name} 官方条款`}
                                  title="官方条款"
                                >
                                  <ArrowUpRight size={16} />
                                </a>
                              )}
                              <button
                                disabled={demo || busy}
                                onClick={() => {
                                  setBenefitCard(card);
                                  setError("");
                                }}
                                title="添加福利"
                              >
                                <Plus size={14} />
                                福利
                              </button>
                              <button
                                className="icon-button"
                                disabled={demo || busy}
                                aria-label={`移除 ${card.nickname || card.name}`}
                                onClick={() => setRemove(card)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          {card.benefits.length === 0 && (
                            <div className="no-benefits">
                              <p>{card.description || "这张卡还没有权益。"}</p>
                              <button
                                className="text-button"
                                onClick={() => setBenefitCard(card)}
                              >
                                添加第一项福利
                                <Plus size={13} />
                              </button>
                            </div>
                          )}
                          {card.benefits
                            .filter((b) => !b.hidden)
                            .map((benefit) => {
                              const ps = benefitPeriods(benefit, year);
                              return (
                                <div
                                  className={`benefit-row ${benefit.frequency === "manual" ? "manual-row" : ""}`}
                                  key={benefit.id}
                                >
                                  <div className="benefit-label">
                                    <div className="benefit-name">
                                      <b title={benefit.note}>{benefit.name}</b>
                                      <button
                                        className="hide-perk"
                                        disabled={demo || busy}
                                        aria-label={`隐藏 ${card.nickname || card.name} ${benefit.name}`}
                                        title="隐藏此权益"
                                        onClick={() =>
                                          void save({
                                            type: "hidden",
                                            id: card.id,
                                            benefitId: benefit.id,
                                            hidden: true,
                                          })
                                        }
                                      >
                                        <EyeOff size={13} />
                                      </button>
                                    </div>
                                    <span>
                                      {frequencies[benefit.frequency]} ·{" "}
                                      {value(benefit)}
                                      {benefit.decemberExtra
                                        ? " · DEC +$20"
                                        : ""}
                                    </span>
                                  </div>
                                  <div className="period-grid">
                                    {ps.length === 0 ? (
                                      <div
                                        className="inactive-perk"
                                        style={{ gridColumn: "span 12" }}
                                      >
                                        {benefit.frequency === "manual" ? (
                                          <>
                                            <span>
                                              {benefit.schedule
                                                ? "此有效期不在所选年份"
                                                : "按银行账户实际有效期追踪"}
                                            </span>
                                            <button
                                              disabled={demo || busy}
                                              onClick={() => {
                                                setSchedule({ card, benefit });
                                                setError("");
                                              }}
                                            >
                                              <Settings2 size={13} />
                                              {benefit.schedule
                                                ? "修改有效期"
                                                : "设置有效期"}
                                            </button>
                                          </>
                                        ) : (
                                          <span>此权益在 {year} 年不适用</span>
                                        )}
                                      </div>
                                    ) : (
                                      ps.map((p) => {
                                        const key = recordKey(
                                            card.id,
                                            benefit.id,
                                            p.recordYear,
                                            p.index,
                                          ),
                                          done = shown.records[key],
                                          status =
                                            p.start > localDate()
                                              ? "future"
                                              : p.end < localDate()
                                                ? "expired"
                                                : "current";
                                        return (
                                          <div
                                            className={`period-wrap ${benefit.frequency === "manual" ? "manual-period" : ""}`}
                                            style={{
                                              gridColumn: `span ${p.span}`,
                                            }}
                                            key={key}
                                          >
                                            <button
                                              className={`period ${done ? "done" : status} ${p.span === 1 ? "compact" : ""}`}
                                              disabled={
                                                busy ||
                                                demo ||
                                                status === "future"
                                              }
                                              aria-label={`${card.nickname || card.name} ${benefit.name} ${p.recordYear} ${p.label} ${done ? `Done ${done}` : "标记完成"}`}
                                              title={`${p.start} — ${p.end}${benefit.note ? `\n${benefit.note}` : ""}`}
                                              onClick={() =>
                                                openCompletion(card, benefit, p)
                                              }
                                            >
                                              <span className="period-top">
                                                {benefit.frequency === "manual"
                                                  ? `${p.start} → ${p.end}`
                                                  : p.label}
                                                <span>{value(benefit, p)}</span>
                                              </span>
                                              <span className="period-state">
                                                {done ? (
                                                  <>
                                                    <Check size={13} />
                                                    <span>
                                                      Done
                                                      <span className="done-date">
                                                        ({shortDate(done)})
                                                      </span>
                                                    </span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <span className="status-dot" />
                                                    {status === "future"
                                                      ? "未开始"
                                                      : status === "expired"
                                                        ? "未记录"
                                                        : "待完成"}
                                                  </>
                                                )}
                                              </span>
                                              {benefit.expiryOffsetDays && (
                                                <span className="expiry-note">
                                                  {shortDate(p.end)} 到期
                                                </span>
                                              )}
                                            </button>
                                            {benefit.frequency === "manual" && (
                                              <button
                                                className="schedule-edit"
                                                aria-label={`修改 ${benefit.name} 有效期`}
                                                disabled={demo || busy}
                                                onClick={() =>
                                                  setSchedule({ card, benefit })
                                                }
                                              >
                                                <Settings2 size={13} />
                                              </button>
                                            )}
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          {card.benefits.some((b) => b.hidden) && (
                            <div className="hidden-footer">
                              <button
                                className="hidden-trigger"
                                disabled={busy}
                                onClick={() => {
                                  setHiddenCard(card);
                                  setError("");
                                }}
                                title="Show hidden perks"
                                aria-label={`Show hidden perks · ${card.nickname || card.name}`}
                              >
                                <MoreHorizontal size={21} />
                                <span className="hidden-tooltip">
                                  Show hidden perks
                                </span>
                              </button>
                            </div>
                          )}
                        </section>
                      ))}
                    </div>
                  </div>
                )}
                <footer className="tracker-footer">
                  <span>
                    <Check size={13} />
                    已完成
                    <span className="legend-dot" />
                    待完成
                    <span className="legend-empty" />
                    未开始 / 未记录
                  </span>
                  <span>点击记录日期 · 隐藏不会删除历史</span>
                </footer>
              </section>
            )}
            {!popup && (
              <footer className="page-footer">
                <span>Less noise. More perks.</span>
                <button onClick={() => setHelp(true)}>
                  福利条款与数据说明
                  <ArrowUpRight size={12} />
                </button>
              </footer>
            )}
          </>
        )}
      </main>
      {add && (
        <Modal error={error} title="添加信用卡" onClose={() => setAdd(false)}>
          <form onSubmit={addCard}>
            <p className="modal-copy">
              选择卡片，福利会自动添加。只保留你想追踪的即可。
            </p>
            <label>
              搜索卡片
              <input
                placeholder="CSP、栗子卡、白金…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className="product-list">
              {catalog
                .filter((p) =>
                  `${p.bank} ${p.name} ${(p.aliases ?? []).join(" ")}`
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((p) => (
                  <button
                    type="button"
                    key={p.productId}
                    className={
                      product === p.productId ? "product selected" : "product"
                    }
                    onClick={() => setProduct(p.productId)}
                  >
                    <span className="mini-card">
                      <CreditCard size={17} />
                    </span>
                    <span>
                      <b>{p.name}</b>
                      <small>
                        {p.bank} · {p.benefits.length} 项可追踪权益
                      </small>
                    </span>
                    {product === p.productId && <Check size={16} />}
                  </button>
                ))}
              <button
                className={
                  product === "custom" ? "product selected" : "product"
                }
                type="button"
                onClick={() => setProduct("custom")}
              >
                <span className="mini-card">
                  <Plus size={17} />
                </span>
                <span>
                  <b>自定义信用卡</b>
                  <small>其他卡片或专属权益</small>
                </span>
                {product === "custom" && <Check size={16} />}
              </button>
            </div>
            {product === "custom" && (
              <div className="form-pair">
                <label>
                  卡片名称
                  <input name="name" required maxLength={80} />
                </label>
                <label>
                  发卡银行
                  <input name="bank" required maxLength={60} />
                </label>
              </div>
            )}
            <div className="form-pair">
              <label>
                昵称（可选）
                <input name="nickname" maxLength={40} placeholder="Aspire 1" />
              </label>
              <label>
                尾号（可选，4–5 位）
                <input
                  name="last4"
                  inputMode="numeric"
                  pattern="[0-9]{4,5}"
                  maxLength={5}
                  placeholder="01007"
                />
              </label>
            </div>
            <p className="field-hint">
              Amex 可用后五位区分卡片，无需完整卡号。
            </p>
            <button className="primary form-submit" disabled={busy}>
              {busy ? "保存中…" : "添加到我的卡片"}
            </button>
          </form>
        </Modal>
      )}
      {benefitCard && (
        <Modal
          error={error}
          title="添加自定义福利"
          onClose={() => setBenefitCard(null)}
        >
          <form onSubmit={addBenefit}>
            <p className="modal-copy">
              {benefitCard.nickname || benefitCard.name}
            </p>
            <label>
              福利名称
              <input
                name="name"
                required
                maxLength={80}
                placeholder="年度旅行报销"
              />
            </label>
            <div className="form-pair">
              <label>
                每个周期的额度（USD）
                <input
                  type="number"
                  name="amount"
                  min="0"
                  max="100000"
                  step="0.01"
                  defaultValue="0"
                  required
                />
              </label>
              <label>
                重置周期
                <select name="frequency" defaultValue="quarterly">
                  {Object.entries(frequencies).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              备注（可选）
              <input
                name="note"
                maxLength={240}
                placeholder="需要 enrollment"
              />
            </label>
            <p className="field-hint">
              非自然年权益请选择「实际有效期」，添加后填写银行显示的日期。
            </p>
            <button className="primary form-submit" disabled={busy}>
              添加福利
            </button>
          </form>
        </Modal>
      )}
      {completion && (
        <Modal
          error={error}
          title={shown.records[completion.key] ? "完成记录" : "标记福利完成"}
          onClose={() => setCompletion(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void finish(date);
            }}
          >
            <p className="modal-copy">
              {completion.benefit.name}
              <br />
              {completion.card.nickname || completion.card.name} ·{" "}
              {completion.period.label} ·{" "}
              {value(completion.benefit, completion.period)}
            </p>
            <label>
              完成日期
              <input
                type="date"
                required
                min={completion.period.start}
                max={
                  completion.period.end < localDate()
                    ? completion.period.end
                    : localDate()
                }
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>
            <p className="field-hint">
              {completion.benefit.note || "记录你使用福利的日期。"}
            </p>
            <button
              className="primary form-submit"
              disabled={
                busy ||
                !validCompletion(
                  date,
                  completion.period.start,
                  completion.period.end,
                )
              }
            >
              <Check size={16} />
              {shown.records[completion.key] ? "保存日期" : "完成"}
            </button>
            {shown.records[completion.key] && (
              <button
                type="button"
                className="undo"
                disabled={busy}
                onClick={() => void finish(null)}
              >
                撤销完成记录
              </button>
            )}
          </form>
        </Modal>
      )}
      {hiddenCard && (
        <Modal
          error={error}
          title="Hidden perks"
          onClose={() => setHiddenCard(null)}
        >
          <p className="modal-copy">
            {hiddenCard.nickname || hiddenCard.name} ·
            隐藏的权益不计入待办，完成记录仍保留。
          </p>
          <div className="hidden-list">
            {activeHiddenCard?.benefits
              .filter((b) => b.hidden)
              .map((b) => (
                <div key={b.id}>
                  <span>
                    <b>{b.name}</b>
                    <small>
                      {frequencies[b.frequency]} · {value(b)}
                    </small>
                  </span>
                  <button
                    className="secondary"
                    disabled={busy || demo}
                    aria-label={`恢复 ${b.name}`}
                    onClick={() =>
                      void save({
                        type: "hidden",
                        id: hiddenCard.id,
                        benefitId: b.id,
                        hidden: false,
                      })
                    }
                  >
                    <Eye size={13} />
                    恢复
                  </button>
                </div>
              ))}
            {!activeHiddenCard?.benefits.some((b) => b.hidden) && (
              <p className="field-hint">所有权益都已恢复显示。</p>
            )}
          </div>
        </Modal>
      )}
      {schedule && (
        <Modal
          error={error}
          title="设置实际有效期"
          onClose={() => setSchedule(null)}
        >
          <form onSubmit={saveSchedule}>
            <p className="modal-copy">
              {schedule.benefit.name}
              <br />
              {schedule.benefit.note}
            </p>
            <div className="form-pair">
              <label>
                开始日期
                <input
                  type="date"
                  name="start"
                  required
                  defaultValue={schedule.benefit.schedule?.start}
                />
              </label>
              <label>
                到期日期
                <input
                  type="date"
                  name="end"
                  required
                  defaultValue={schedule.benefit.schedule?.end}
                />
              </label>
            </div>
            <p className="field-hint">
              请照银行账户填写。不会自动按自然年重置；下一周期可修改日期。旧记录保留，新日期区间单独计数。
            </p>
            <button className="primary form-submit" disabled={busy}>
              保存有效期
            </button>
          </form>
        </Modal>
      )}
      {editCard && (
        <Modal title="编辑卡片" error={error} onClose={() => setEditCard(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (
                await save({
                  type: "identity",
                  id: editCard.id,
                  nickname: String(f.get("nickname")).trim(),
                  last4: String(f.get("last4")).trim(),
                })
              )
                setEditCard(null);
            }}
          >
            <p className="modal-copy">{editCard.name}</p>
            <div className="form-pair">
              <label>
                昵称（可选）
                <input
                  name="nickname"
                  maxLength={40}
                  defaultValue={editCard.nickname}
                />
              </label>
              <label>
                尾号（可选，4–5 位）
                <input
                  name="last4"
                  inputMode="numeric"
                  pattern="[0-9]{4,5}"
                  maxLength={5}
                  defaultValue={editCard.last4}
                />
              </label>
            </div>
            <button className="primary form-submit" disabled={busy}>
              保存卡片
            </button>
          </form>
        </Modal>
      )}
      {remove && (
        <Modal error={error} title="移除信用卡" onClose={() => setRemove(null)}>
          <p className="modal-copy">
            移除 {remove.nickname || remove.name}
            {remove.last4 ? ` · ${remove.last4}` : ""}
            ？所有年度完成记录也会删除。
          </p>
          <div className="dialog-actions">
            <button onClick={() => setRemove(null)} className="secondary">
              取消
            </button>
            <button
              className="primary"
              disabled={busy}
              onClick={async () => {
                if (await save({ type: "remove", id: remove.id })) {
                  setRemove(null);
                  setSelected("all");
                }
              }}
            >
              移除卡片
            </button>
          </div>
        </Modal>
      )}
      {help && (
        <Modal title="关于 Perk Done" onClose={() => setHelp(false)}>
          <div className="about">
            <p>
              扩展图标打开紧凑弹窗，用于查看本季度到期的权益和快速完成；完整面板用于管理卡片、时间轴、历史记录和隐藏权益。
            </p>
            <p>
              本季度待办包含尚未完成且到期日在今天至本季度末之间的周期（含尚未开始的月份）。隐藏的权益、已过期周期、未设置有效期的房券或账户周年额度不会计入。
            </p>
            <p>
              信用卡目录来自随扩展打包的 JSON，核对日期 2026-10-01；无 API
              或后台抓取。点击卡片箭头查看官方条款，实际资格和额度以银行账户为准。
            </p>
            <p>
              Chrome Sync
              需要登录并启用同步。这里只能确认使用了同步存储区域，无法确认账号同步状态。离线可使用，同一年度数据跨设备同时修改可能以后写入者为准。
            </p>
            <p>
              不读取网页、交易或银行登录。只存产品、昵称、可选 4–5
              位尾号、隐藏设置、有效期、完成日期和主题。网页预览使用独立的本地存储；示例不保存。
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
