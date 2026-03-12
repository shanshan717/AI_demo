let storageKey = "";

const categoryRules = [
  { category: "餐饮", keywords: ["吃", "饭", "餐", "奶茶", "咖啡", "外卖", "早餐", "午餐", "晚餐"] },
  { category: "服饰", keywords: ["衣", "裤", "鞋", "服饰", "包", "穿搭"] },
  { category: "交通", keywords: ["打车", "地铁", "公交", "车费", "高铁", "加油", "停车"] },
  { category: "居家", keywords: ["房租", "水费", "电费", "网费", "日用品", "家居"] },
  { category: "娱乐", keywords: ["电影", "游戏", "KTV", "旅游", "演出", "娱乐"] },
  { category: "学习", keywords: ["书", "课程", "培训", "学费", "订阅"] },
  { category: "医疗", keywords: ["药", "医院", "挂号", "体检", "看病"] }
];

let data = { todos: [], expenses: [] };
let activePeriod = "week";
let appEventsBound = false;

const sideMenu = document.getElementById("sideMenu");
const menuLinks = [...document.querySelectorAll("#sideMenu a[data-view]")];
const overviewGrid = document.getElementById("overviewGrid");
const contentGrid = document.getElementById("contentGrid");
const todoSection = document.getElementById("todoSection");
const expenseSection = document.getElementById("expenseSection");
const summarySection = document.getElementById("summarySection");
const recentSection = document.getElementById("recentSection");

const todoDate = document.getElementById("todoDate");
const todoInput = document.getElementById("todoInput");
const addTodoBtn = document.getElementById("addTodoBtn");
const todoList = document.getElementById("todoList");

const expenseText = document.getElementById("expenseText");
const parseSaveBtn = document.getElementById("parseSaveBtn");
const parsePreview = document.getElementById("parsePreview");
const expenseList = document.getElementById("expenseList");

const periodTabs = document.getElementById("periodTabs");
const summary = document.getElementById("summary");

const metricTodoCount = document.getElementById("metricTodoCount");
const metricTodoRate = document.getElementById("metricTodoRate");
const metricWeekSpend = document.getElementById("metricWeekSpend");
const metricMonthSpend = document.getElementById("metricMonthSpend");

init();

function init() {
  bindAuthEvents();
  const user = getCurrentUser();
  if (user) {
    startApp(user);
  } else {
    document.getElementById("authOverlay").classList.remove("is-hidden");
  }
}

// ---- Auth ----
const USERS_KEY = "daily_flow_users";
const SESSION_KEY = "daily_flow_session";

async function hashPassword(password) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(password));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
  catch { return {}; }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  return localStorage.getItem(SESSION_KEY);
}

function setCurrentUser(username) {
  localStorage.setItem(SESSION_KEY, username);
}

function clearCurrentUser() {
  localStorage.removeItem(SESSION_KEY);
}

function getUserDataKey(username) {
  return `daily_flow_data_v1_${username}`;
}

function startApp(username) {
  storageKey = getUserDataKey(username);
  const loaded = loadData();
  data.todos = loaded.todos;
  data.expenses = loaded.expenses;
  document.getElementById("profileName").textContent = username;
  document.getElementById("authOverlay").classList.add("is-hidden");

  todoDate.value = toDateInput(new Date());
  if (!appEventsBound) {
    bindEvents();
    appEventsBound = true;
  }
  setView("dashboard");
  renderAll();
}

function bindAuthEvents() {
  const authTabs = document.getElementById("authTabs");
  const authSubmitBtn = document.getElementById("authSubmitBtn");
  const authPassword = document.getElementById("authPassword");
  const logoutBtn = document.getElementById("logoutBtn");

  let currentAuthMode = "login";

  authTabs.addEventListener("click", (e) => {
    const tab = e.target.closest("button[data-tab]");
    if (!tab) return;
    currentAuthMode = tab.dataset.tab;
    [...authTabs.querySelectorAll("button")].forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === currentAuthMode);
    });
    authSubmitBtn.textContent = currentAuthMode === "login" ? "登录" : "注册";
    document.getElementById("authError").textContent = "";
  });

  authSubmitBtn.addEventListener("click", () => handleAuthSubmit(currentAuthMode));

  authPassword.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleAuthSubmit(currentAuthMode);
  });

  logoutBtn.addEventListener("click", () => {
    clearCurrentUser();
    data.todos = [];
    data.expenses = [];
    storageKey = "";
    document.getElementById("profileName").textContent = "—";
    document.getElementById("authOverlay").classList.remove("is-hidden");
    document.getElementById("authUsername").value = "";
    document.getElementById("authPassword").value = "";
    document.getElementById("authError").textContent = "";
  });
}

async function handleAuthSubmit(mode) {
  const username = document.getElementById("authUsername").value.trim();
  const password = document.getElementById("authPassword").value;
  const errorEl = document.getElementById("authError");
  errorEl.textContent = "";

  if (!username) { errorEl.textContent = "请输入用户名"; return; }
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]{1,32}$/.test(username)) {
    errorEl.textContent = "用户名只能包含字母、数字、下划线或中文（最多 32 位）";
    return;
  }
  if (password.length < 8) { errorEl.textContent = "密码至少需要 8 位"; return; }

  const users = getUsers();
  const hashed = await hashPassword(password);

  if (mode === "register") {
    if (users[username]) { errorEl.textContent = "用户名已存在，请换一个或直接登录"; return; }
    users[username] = hashed;
    saveUsers(users);
    setCurrentUser(username);
    startApp(username);
  } else {
    if (!users[username]) { errorEl.textContent = "用户名不存在，请先注册"; return; }
    if (users[username] !== hashed) { errorEl.textContent = "密码错误"; return; }
    setCurrentUser(username);
    startApp(username);
  }
}

function bindEvents() {
  sideMenu.addEventListener("click", (e) => {
    const link = e.target.closest("a[data-view]");
    if (!link) return;
    e.preventDefault();
    setView(link.dataset.view);
  });

  addTodoBtn.addEventListener("click", addTodo);
  todoInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTodo();
  });

  todoList.addEventListener("change", (e) => {
    if (!e.target.matches("input[type='checkbox']")) return;
    const id = e.target.dataset.id;
    const item = data.todos.find((t) => t.id === id);
    if (!item) return;
    item.done = e.target.checked;
    saveData();
    renderDashboardMetrics();
  });

  todoList.addEventListener("click", (e) => {
    if (!e.target.matches("button[data-action='delete']")) return;
    const id = e.target.dataset.id;
    data.todos = data.todos.filter((t) => t.id !== id);
    saveData();
    renderTodos();
    renderDashboardMetrics();
  });

  parseSaveBtn.addEventListener("click", parseAndSaveExpense);

  periodTabs.addEventListener("click", (e) => {
    if (!e.target.matches("button[data-period]")) return;
    activePeriod = e.target.dataset.period;
    [...periodTabs.querySelectorAll("button")].forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.period === activePeriod);
    });
    renderSummary();
  });

  todoDate.addEventListener("change", () => {
    renderTodos();
    renderDashboardMetrics();
  });
}

function setView(view) {
  menuLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.view === view);
  });

  overviewGrid.classList.toggle("is-hidden", view !== "dashboard");

  todoSection.classList.remove("is-hidden");
  expenseSection.classList.remove("is-hidden");
  summarySection.classList.remove("is-hidden");
  recentSection.classList.remove("is-hidden");
  contentGrid.classList.remove("single-view");

  if (view === "todo") {
    expenseSection.classList.add("is-hidden");
    summarySection.classList.add("is-hidden");
    recentSection.classList.add("is-hidden");
    contentGrid.classList.add("single-view");
  }

  if (view === "expense") {
    todoSection.classList.add("is-hidden");
    summarySection.classList.add("is-hidden");
    contentGrid.classList.add("single-view");
  }

  if (view === "summary") {
    todoSection.classList.add("is-hidden");
    expenseSection.classList.add("is-hidden");
    recentSection.classList.add("is-hidden");
    contentGrid.classList.add("single-view");
  }
}

function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;
  data.todos.unshift({
    id: crypto.randomUUID(),
    date: todoDate.value,
    text,
    done: false,
    createdAt: Date.now()
  });
  todoInput.value = "";
  saveData();
  renderTodos();
  renderDashboardMetrics();
}

function parseAndSaveExpense() {
  const text = expenseText.value.trim();
  if (!text) return;

  const parsed = parseExpenseText(text);
  if (!parsed.length) {
    parsePreview.textContent = "未识别到金额，请按“事项 + 金额”输入，例如：午饭20元";
    return;
  }

  const now = Date.now();
  parsed.forEach((p, idx) => {
    data.expenses.unshift({
      id: crypto.randomUUID(),
      date: toDateInput(new Date()),
      category: p.category,
      amount: p.amount,
      note: p.note,
      createdAt: now + idx
    });
  });

  saveData();
  parsePreview.textContent = `已保存 ${parsed.length} 条：${parsed
    .map((p) => `${p.category} ${formatMoney(p.amount)}`)
    .join("，")}`;
  expenseText.value = "";
  renderExpenses();
  renderSummary();
  renderDashboardMetrics();
}

function parseExpenseText(text) {
  const parts = text
    .split(/[，。,；;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const result = [];
  for (const part of parts) {
    const amountMatch = part.match(/(\d+(?:\.\d+)?)/);
    if (!amountMatch) continue;
    const amount = Number(amountMatch[1]);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const category = inferCategory(part);
    result.push({ category, amount, note: part });
  }
  return result;
}

function inferCategory(text) {
  const lower = text.toLowerCase();
  for (const rule of categoryRules) {
    if (rule.keywords.some((k) => lower.includes(k.toLowerCase()))) {
      return rule.category;
    }
  }
  return "其他";
}

function renderAll() {
  renderTodos();
  renderExpenses();
  renderSummary();
  renderDashboardMetrics();
}

function renderTodos() {
  const list = data.todos
    .filter((t) => t.date === todoDate.value)
    .sort((a, b) => b.createdAt - a.createdAt);

  if (!list.length) {
    todoList.innerHTML = '<li class="item"><span>当天还没有任务</span></li>';
    return;
  }

  todoList.innerHTML = list
    .map(
      (t) => `
      <li class="item">
        <label>
          <input type="checkbox" data-id="${t.id}" ${t.done ? "checked" : ""} />
          ${escapeHtml(t.text)}
        </label>
        <button data-action="delete" data-id="${t.id}">删除</button>
      </li>
    `
    )
    .join("");
}

function renderExpenses() {
  const list = [...data.expenses]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 12);

  if (!list.length) {
    expenseList.innerHTML = '<li class="item"><span>还没有记账记录</span></li>';
    return;
  }

  expenseList.innerHTML = list
    .map(
      (e) => `
      <li class="item">
        <span>${e.date} · ${e.category} · ${escapeHtml(e.note)}</span>
        <strong>${formatMoney(e.amount)}</strong>
      </li>
    `
    )
    .join("");
}

function renderSummary() {
  const scoped = filterByPeriod(data.expenses, activePeriod);
  if (!scoped.length) {
    summary.innerHTML = '<div class="metric">当前周期暂无支出记录。</div>';
    return;
  }

  const total = scoped.reduce((sum, x) => sum + x.amount, 0);
  const byCategory = scoped.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {});

  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const [maxCat, maxVal] = entries[0];
  const [minCat, minVal] = entries[entries.length - 1];

  summary.innerHTML = `
    <div class="metric">总支出：<strong>${formatMoney(total)}</strong></div>
    <div class="metric">开销最大：${maxCat}（${formatMoney(maxVal)}）</div>
    <div class="metric">开销最小：${minCat}（${formatMoney(minVal)}）</div>
    <div class="metric">分类明细：${entries
      .map(([cat, val]) => `${cat} ${formatMoney(val)}`)
      .join("，")}</div>
  `;
}

function renderDashboardMetrics() {
  const todayTodos = data.todos.filter((t) => t.date === todoDate.value);
  const doneCount = todayTodos.filter((t) => t.done).length;
  const rate = todayTodos.length ? Math.round((doneCount / todayTodos.length) * 100) : 0;

  const weekSpend = filterByPeriod(data.expenses, "week").reduce((sum, e) => sum + e.amount, 0);
  const monthSpend = filterByPeriod(data.expenses, "month").reduce((sum, e) => sum + e.amount, 0);

  metricTodoCount.textContent = `${todayTodos.length} 项`;
  metricTodoRate.textContent = `${rate}%`;
  metricWeekSpend.textContent = formatMoney(weekSpend);
  metricMonthSpend.textContent = formatMoney(monthSpend);
}

function filterByPeriod(expenses, period) {
  const now = new Date();
  const nowTs = now.getTime();

  return expenses.filter((e) => {
    const d = new Date(e.date + "T00:00:00");
    if (Number.isNaN(d.getTime())) return false;

    if (period === "year") {
      return d.getFullYear() === now.getFullYear();
    }

    if (period === "month") {
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }

    const diffDays = Math.floor((nowTs - d.getTime()) / 86400000);
    return diffDays >= 0 && diffDays < 7;
  });
}

function loadData() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { todos: [], expenses: [] };
    const parsed = JSON.parse(raw);
    return {
      todos: Array.isArray(parsed.todos) ? parsed.todos : [],
      expenses: Array.isArray(parsed.expenses) ? parsed.expenses : []
    };
  } catch {
    return { todos: [], expenses: [] };
  }
}

function saveData() {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

function toDateInput(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMoney(n) {
  return `¥${n.toFixed(2)}`;
}

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
