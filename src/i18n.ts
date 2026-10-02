import type { Language } from "./model";
let language: Language = "en";
export function setLanguage(value: Language) {
  language = value;
}
const translations: Record<string, string> = {
  本季度: "This quarter",
  净赚: "Net earned",
  "你是薅羊毛之神！": "Perk legend!",
  "回本啦！": "Broke even!",
  "接下来都是赚的。": "Every next perk is a win.",
  "加油！": "Keep going!",
  "向回本再近一步。": "Every perk gets you closer.",
  从第一张卡开始: "Add your first card",
  "让权益发挥价值。": "Make your perks count.",
  无效主题: "Invalid theme.",
  "卡片已移除，请重新打开面板。":
    "This card was removed. Reopen the dashboard.",
  "尾号需要为 4–5 位数字。": "Use four or five digits for the card suffix.",
  "权益不存在。": "This perk no longer exists.",
  "请输入有效的开始和到期日期。": "Enter valid start and expiry dates.",
  "单张卡片或年度记录超过 Chrome 同步的 8 KB 限制。请减少自定义福利。":
    "A card or annual record exceeds the Chrome Sync 8 KB limit. Reduce custom perks.",
  "Chrome 同步空间已满，修改未保存。请移除不再需要的卡片。":
    "Chrome Sync storage is full. Changes were not saved. Remove unused cards.",
  "保存失败，请重试。": "Save failed. Please try again.",

  "每季度额度；适用航空公司直购或 Amex Travel 符合条件的机票。":
    "Quarterly credit for qualifying airfare purchased directly from airlines or through Amex Travel.",
  "每半年额度；仅限参与活动的 Hilton Resorts。":
    "Half-year credit at participating Hilton Resorts only.",
  "自然年额度，用于 CLEAR+ 会员费；税费除外。":
    "Calendar-year CLEAR+ membership credit, excluding taxes.",
  "开卡首年及续卡房券；填写 Hilton 账户显示的实际有效期。":
    "Welcome and renewal free-night certificates. Enter the actual validity shown in your Hilton account.",
  "每季度额度；直接向 Hilton 旗下符合条件酒店支付。":
    "Quarterly credit for qualifying purchases paid directly to Hilton hotels.",
  "自然年消费满 $15,000 后获得；仅在已达标并收到房券后填写有效期。":
    "Earned after $15,000 of calendar-year spend. Enter dates only after receiving the certificate.",
  "美国个人版；Morgan Stanley、Schwab 或 Business 变体请核对专属条款。":
    "US personal version. Check separate terms for Morgan Stanley, Schwab and Business cards.",
  "Amex Travel 预付 FHR / THC，THC 至少两晚。":
    "Prepaid FHR / THC through Amex Travel. THC requires at least two nights.",
  "需要 enrollment；符合条件的美国 Resy 餐厅消费。":
    "Enrollment required. Qualifying purchases at US Resy restaurants.",
  "需要 enrollment；美国非 outlet 门店或官网符合条件消费。":
    "Enrollment required. Qualifying US stores (excluding outlets) or online purchases.",
  "需要 enrollment；指定服务商的合格订阅。":
    "Enrollment required. Eligible subscriptions from participating providers.",
  "美国 Uber / Uber Eats；绑定卡片并选择 Amex 付款。12 月额外 $20。":
    "US Uber / Uber Eats. Add the card and select Amex payment. Extra $20 in December.",
  "需选择航空公司，适用合格航空杂费。":
    "Select an airline. Eligible incidental airline fees only.",
  "需要 enrollment；会员费报销，税费除外。":
    "Enrollment required. Membership fee credit, excluding taxes.",
  "历史权益，2026-06-30 后结束；保留上半年记录。":
    "Historical perk ended June 30, 2026. First-half records remain available.",
  "需要 enrollment；ouraring.com 的合格 Oura Ring 购买。":
    "Enrollment required. Eligible Oura Ring purchases on ouraring.com.",
  "用符合条件的卡支付 Uber One 会员费，最高年度额度；非 Uber Cash。":
    "Pay eligible Uber One membership fees with the card, up to the annual limit. Separate from Uber Cash.",
  "需要 enrollment；符合条件的 Equinox 会员或 Equinox+。":
    "Enrollment required. Eligible Equinox memberships or Equinox+.",
  "每月符合条件的 Walmart+ 会员费，另加适用税费；不含 Plus Up。":
    "Eligible monthly Walmart+ membership fee plus applicable taxes. Excludes Plus Up.",
  "需要 enrollment；每半年符合条件 Resy 消费额度。":
    "Enrollment required. Half-year credit for eligible Resy purchases.",
  "需要 enrollment；美国 Dunkin 合格消费。":
    "Enrollment required. Eligible US Dunkin purchases.",
  "需要 enrollment；仅限当前指定餐饮商户。":
    "Enrollment required. Currently participating dining merchants only.",
  "美国 Uber / Uber Eats；绑定卡片并选择 Amex 付款。":
    "US Uber / Uber Eats. Add the card and select Amex payment.",
  "无年费版没有固定周期的报销额度，也没有年度免费房券。可以添加自定义权益。":
    "The no-fee card has no recurring statement credits or annual free-night certificate. Add custom perks if needed.",
  "当前官网额度为每账户周年年 $100；填写银行账户的实际额度周期（非自然年）。":
    "Current offer: $100 per account anniversary year. Enter your actual bank dates; this is not a calendar-year perk.",
  "需激活 DashPass；每月一次合格非餐厅订单优惠，至 2027-12-31。":
    "Activate DashPass. One eligible non-restaurant discount monthly through December 31, 2027.",
  "每账户周年年额度；填写银行显示的实际周期，重置可能随账单日（非自然年）。":
    "Account anniversary year. Enter actual bank dates; the reset may follow your statement date.",
  "2026 起自然年最高 $500；每笔合格预付订单最高 $250，至少两晚。":
    "From 2026: up to $500 per calendar year, with a $250 limit per eligible prepaid booking. Two-night minimum.",
  "2026 年限定；Chase Travel 指定酒店品牌预付至少两晚。":
    "2026 only. Prepay at least two nights at select hotel brands through Chase Travel.",
  "OpenTable 的 Sapphire Exclusive Tables 合格餐厅，每半年额度。":
    "Half-year credit at eligible Sapphire Exclusive Tables restaurants through OpenTable.",
  "需要 activation；每半年合格购票额度，至 2027-12-31。":
    "Activation required. Half-year credit for eligible ticket purchases through December 31, 2027.",
  "合格 Lyft 月度应用内额度，至 2027-09-30。":
    "Eligible monthly Lyft in-app credit through September 30, 2027.",
  "需要 activation；合格 Peloton 会员费，至 2027-12-31。":
    "Activation required. Eligible Peloton membership fees through December 31, 2027.",
  "需激活 DashPass；每月合格餐厅订单优惠，至 2027-12-31。":
    "Activate DashPass. Eligible monthly restaurant discount through December 31, 2027.",
  "需激活 DashPass；每月两次独立的 $10 非餐厅优惠之一，至 2027-12-31。":
    "Activate DashPass. First of two separate monthly $10 non-restaurant discounts through December 31, 2027.",
  "需激活 DashPass；每月两次独立的 $10 非餐厅优惠之二，至 2027-12-31。":
    "Activate DashPass. Second of two separate monthly $10 non-restaurant discounts through December 31, 2027.",
  "续卡后房券；填写 Marriott 账户实际签发日和到期日。":
    "Renewal free-night certificate. Enter issue and expiry dates from your Marriott account.",
  "自然年合格航空杂费；需要致电卡背面号码申请报销。":
    "Eligible calendar-year airline incidental fees. Call the number on your card to request reimbursement.",
  "续卡房券；填写 Marriott 账户实际有效期。":
    "Renewal free-night certificate. Enter actual dates from your Marriott account.",
  "需注册关联 MileagePlus；上半年入账的 $25 于 7/15 到期，下半年于次年 1/15 到期。":
    "Link and register MileagePlus. First-half $25 expires July 15; second-half $25 expires January 15 next year.",
  "续卡房券；以 IHG 账户实际有效期为准。":
    "Renewal free-night certificate. Use actual dates from your IHG account.",
  关闭: "Close",
  保存失败: "Save failed",
  标记完成: "Mark done",
  到期: "expires",
  " · 未开始": " · Upcoming",
  本季度暂无待完成权益: "No outstanding perks this quarter",
  "添加卡片后，这里会列出本季度到期的权益。":
    "Add a card to see perks expiring this quarter.",
  切换到英文: "Switch to English",
  中: "中",
  主题: "Theme",
  跟随系统: "System theme",
  浅色模式: "Light mode",
  深色模式: "Dark mode",
  "关于 Perk Done": "About Perk Done",
  "只留下你想用的权益。其余的，藏起来就好。":
    "Keep the perks you use. Hide the rest.",
  添加信用卡: "Add a card",
  "示例模式 · 不会保存示例记录": "Demo · Sample records are not saved",
  退出示例: "Exit demo",
  关闭错误: "Dismiss error",
  "读取权益中…": "Loading your perks…",
  "张卡片 ·": "cards ·",
  打开完整面板: "Open dashboard",
  我的权益: "My perks",
  张卡片: "cards",
  上一年: "Previous year",
  下一年: "Next year",
  从第一张信用卡开始: "Start with your first card",
  "添加信用卡，保留你想用的权益。":
    "Add your cards and keep the perks you use.",
  "全年、半年、季度、每月，自动对齐。":
    "Annual, half-year, quarterly and monthly periods, aligned.",
  添加第一张信用卡: "Add your first card",
  先看看示例: "Explore the demo",
  编辑昵称与尾号: "Edit card details",
  官方条款: "Official terms",
  添加福利: "Add a perk",
  福利: "Perk",
  "这张卡还没有权益。": "This card has no tracked perks yet.",
  添加第一项福利: "Add your first perk",
  隐藏此权益: "Hide this perk",
  此有效期不在所选年份: "This period is outside the selected year",
  按银行账户实际有效期追踪: "Track the actual dates shown by your bank",
  修改有效期: "Edit validity dates",
  设置有效期: "Set validity dates",
  此权益在: "Unavailable in",
  年不适用: "",
  未开始: "Upcoming",
  未记录: "Unrecorded",
  待完成: "To do",
  已完成: "Done",
  "未开始 / 未记录": "Upcoming / Unrecorded",
  "点击记录日期 · 隐藏不会删除历史":
    "Click to complete · Click Done to edit its date",
  福利条款与数据说明: "Terms & data",
  "选择卡片，福利会自动添加。只保留你想追踪的即可。":
    "Choose a card to add its perks. Hide any you don’t use.",
  搜索卡片: "Search cards",
  "CSP、栗子卡、白金…": "CSP, Ritz-Carlton, Platinum…",
  项可追踪权益: "tracked perks",
  自定义信用卡: "Custom card",
  其他卡片或专属权益: "Other cards or personal perks",
  卡片名称: "Card name",
  发卡银行: "Issuer",
  "昵称（可选）": "Nickname (optional)",
  "尾号（可选，4–5 位）": "Last 4–5 digits (optional)",
  "Amex 可用后五位区分卡片，无需完整卡号。":
    "Use the last five digits for Amex. No full card number needed.",
  "保存中…": "Saving…",
  添加到我的卡片: "Add to my cards",
  添加自定义福利: "Add a custom perk",
  福利名称: "Perk name",
  年度旅行报销: "Annual travel credit",
  "每个周期的额度（USD）": "Value per period (USD)",
  重置周期: "Reset frequency",
  "备注（可选）": "Note (optional)",
  "需要 enrollment": "Enrollment required",
  "非自然年权益请选择「实际有效期」，添加后填写银行显示的日期。":
    "Choose Actual validity for cardmember-year perks, then enter your bank’s dates.",
  "· 隐藏的权益不计入待办，完成记录仍保留。":
    "· Hidden perks are excluded from to-dos. Completed records are kept.",
  恢复: "Restore",
  "所有权益都已恢复显示。": "All perks are visible again.",
  设置实际有效期: "Set actual validity",
  开始日期: "Start date",
  到期日期: "Expiry date",
  "请照银行账户填写。不会自动按自然年重置；下一周期可修改日期。旧记录保留，新日期区间单独计数。":
    "Use the dates shown by your bank. Update them for the next period; old records are retained separately.",
  保存有效期: "Save validity dates",
  编辑卡片: "Edit card",
  保存卡片: "Save card",
  移除信用卡: "Remove card",
  移除: "Remove",
  "？所有年度完成记录也会删除。":
    "? Completion records for every year will also be deleted.",
  取消: "Cancel",
  移除卡片: "Remove card",
  钱包概览: "Wallet overview",
  信用卡: "Cards",
  本季度待完成: "Perks to finish",
  年费与已使用权益: "Annual fee / Earned",
  赚了: "Ahead",
  尚差: "To break even",
  "按已完成权益的额度估算；房券不自动估值。":
    "Completed credits at face value. Free nights are not valued.",
  张卡尚未设置年费: "cards have no annual fee set",
  "项权益，本季度到期": "perks expiring this quarter",
  "项权益尚未设置实际有效期，暂不计入到期待办。":
    "perks need validity dates and are excluded from this list.",
  "请选择至少一张信用卡查看权益。":
    "Select at least one card to see its perks.",
  "实际年费（USD）": "Actual annual fee (USD)",
  全年: "Full year",
  半年: "Half-year",
  季度: "Quarterly",
  每月: "Monthly",
  实际有效期: "Actual validity",
  上半年: "Jan – Jun",
  下半年: "Jul – Dec",
  隐藏: "Hide",
  修改: "Edit",
  有效期: "validity",
  完成: "Complete",
  开始: "starts",
  所有卡片: "All cards",
  选择卡片: "Choose cards",
  已选择: "selected",
  全选: "Select all",
  清空: "Clear",
  完成日期: "Completion date",
  确认修改时间: "Save date",
  撤销完成: "Undo completion",
  "扩展图标打开紧凑弹窗，用于查看本季度到期的权益和快速完成；完整面板用于管理卡片、时间轴、历史记录和隐藏权益。":
    "The popup shows wallet totals. The dashboard shows your timeline and a collapsible list of perks expiring this quarter.",
  "本季度待办包含尚未完成且到期日在今天至本季度末之间的周期（含尚未开始的月份）。隐藏的权益、已过期周期、未设置有效期的房券或账户周年额度不会计入。":
    "Quarter to-dos include incomplete periods expiring from today through quarter-end, including upcoming months. Hidden, expired and undated perks are excluded.",
  "信用卡目录来自随扩展打包的 JSON，核对日期 2026-10-01；无 API 或后台抓取。点击卡片箭头查看官方条款，实际资格和额度以银行账户为准。":
    "The catalog is bundled JSON, checked October 1, 2026. Follow each card’s link for official terms; your bank determines eligibility and amounts.",
  "Chrome Sync 需要登录并启用同步。这里只能确认使用了同步存储区域，无法确认账号同步状态。离线可使用，同一年度数据跨设备同时修改可能以后写入者为准。":
    "Chrome Sync requires sign-in and sync enabled. The app cannot confirm your account’s sync status. It works offline; concurrent edits may use the last write.",
  "不读取网页、交易或银行登录。只存产品、昵称、可选 4–5 位尾号、隐藏设置、有效期、完成日期和主题。网页预览使用独立的本地存储；示例不保存。":
    "No webpages, transactions or bank logins are read. Only cards, nicknames, optional last digits, annual fees, hidden settings, dates, theme and language are stored. Preview data stays separate; demos are not saved.",
  "请选择不晚于今天的有效日期；尚未开始的周期不可完成。":
    "Choose a valid date no later than today. Upcoming periods cannot be completed.",
};
const chinese: Record<string, string> = {
  "A LITTLE LESS TO REMEMBER.": "少记一点，轻松一点。",
  "Your perks, handled.": "你的权益，一目了然。",
  "Less noise. More perks.": "少些干扰，多些回报。",
  "Show hidden perks": "显示隐藏权益",
  "Hidden perks": "隐藏的权益",
};
export function t(text: string) {
  return language === "zh"
    ? text === "年费与已使用权益"
      ? "年费 / 已赚回"
      : (chinese[text] ?? text)
    : (translations[text] ?? text);
}
