// Auto-detect API base URL for local development vs production
// - When opened as a local file (file://) hostname is "", treat as local dev
// - When running on localhost: use the backend on port 5000
// - On Vercel / production: use relative /api (same origin)
const hostname = window.location.hostname;
const isLocalLike =
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "";

const API_BASE = isLocalLike ? "http://localhost:5000/api" : "/api";

let authToken = null;
let accountsCache = [];
let selectedAccountId = null;

function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(num);
}

async function apiRequest(path, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  headers["Content-Type"] = "application/json";
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });
  } catch (err) {
    console.error("Network error while calling API", err);
    throw new Error(
      "Cannot reach Kodbank server. Please make sure the backend is running on http://localhost:5000."
    );
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

function showAuthMessage(text, isError = false) {
  const el = document.getElementById("auth-message");
  el.textContent = text;
  el.classList.remove("error", "success");
  if (!text) return;
  el.classList.add(isError ? "error" : "success");
}

function showTransferMessage(text, isError = false) {
  const el = document.getElementById("transfer-message");
  el.textContent = text;
  el.classList.remove("error", "success");
  if (!text) return;
  el.classList.add(isError ? "error" : "success");
}

function saveToken(token) {
  authToken = token;
  try {
    localStorage.setItem("kodbank_token", token);
  } catch (e) {
    // ignore storage issues
  }
}

function loadTokenFromStorage() {
  try {
    const token = localStorage.getItem("kodbank_token");
    if (token) {
      authToken = token;
      return token;
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function clearToken() {
  authToken = null;
  try {
    localStorage.removeItem("kodbank_token");
  } catch (e) {
    // ignore
  }
}

function switchToDashboard() {
  document.getElementById("auth-section").hidden = true;
  document.getElementById("dashboard-section").hidden = false;
}

function switchToAuth() {
  document.getElementById("dashboard-section").hidden = true;
  document.getElementById("auth-section").hidden = false;
}

function setActiveAccount(id) {
  selectedAccountId = id;
  const items = document.querySelectorAll(".account-item");
  items.forEach((item) => {
    if (String(item.dataset.id) === String(id)) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

function renderAccounts() {
  const list = document.getElementById("accounts-list");
  const fromSelect = document.getElementById("from-account");
  const toSelect = document.getElementById("to-account");

  list.innerHTML = "";
  fromSelect.innerHTML = "";
  toSelect.innerHTML = "";

  let total = 0;

  accountsCache.forEach((account) => {
    total += Number(account.balance) || 0;

    const li = document.createElement("li");
    li.className = "account-item";
    li.dataset.id = account.id;
    li.innerHTML = `
      <div>
        <p class="account-name">${account.name}</p>
        <p class="account-type">${account.type.toUpperCase()}</p>
      </div>
      <p class="account-balance">${formatCurrency(account.balance)}</p>
    `;
    li.addEventListener("click", () => {
      setActiveAccount(account.id);
      loadTransactions(account.id);
    });
    list.appendChild(li);

    const optFrom = document.createElement("option");
    optFrom.value = account.id;
    optFrom.textContent = `${account.name} (${account.type})`;
    fromSelect.appendChild(optFrom);

    const optTo = document.createElement("option");
    optTo.value = account.id;
    optTo.textContent = `${account.name} (${account.type})`;
    toSelect.appendChild(optTo);
  });

  document.getElementById("total-balance").textContent = formatCurrency(total);
  document.getElementById("account-count").textContent = String(accountsCache.length);

  if (accountsCache.length > 0 && !selectedAccountId) {
    setActiveAccount(accountsCache[0].id);
    loadTransactions(accountsCache[0].id);
  }
}

async function loadProfileAndAccounts() {
  try {
    const [{ user }, { accounts }] = await Promise.all([
      apiRequest("/profile"),
      apiRequest("/accounts"),
    ]);
    document.getElementById("user-name").textContent = user.name;
    accountsCache = accounts || [];
    renderAccounts();
  } catch (err) {
    console.error(err);
    clearToken();
    switchToAuth();
  }
}

async function loadTransactions(accountId) {
  if (!accountId) return;
  try {
    const { transactions } = await apiRequest(`/accounts/${accountId}/transactions`);
    const list = document.getElementById("transactions-list");
    const subtitle = document.getElementById("transactions-subtitle");

    subtitle.textContent = "Most recent transactions for this account.";

    list.innerHTML = "";
    if (!transactions || transactions.length === 0) {
      const li = document.createElement("li");
      li.className = "transaction-item";
      li.innerHTML = `<p class="transaction-description">No transactions yet.</p>`;
      list.appendChild(li);
      return;
    }

    transactions.forEach((tx) => {
      const li = document.createElement("li");
      li.className = "transaction-item";
      const type = (tx.type || "").toUpperCase();
      const sign = type === "CREDIT" ? "+" : "-";
      const className = type === "CREDIT" ? "credit" : "debit";

      const date = tx.created_at ? new Date(tx.created_at) : null;
      const dateStr = date ? date.toLocaleString() : "";

      li.innerHTML = `
        <div class="transaction-main">
          <p class="transaction-description">${tx.description || type}</p>
          <p class="transaction-meta">${dateStr}</p>
        </div>
        <div class="transaction-amount ${className}">${sign}${formatCurrency(tx.amount)}</div>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }
}

async function handleLogin(event) {
  event.preventDefault();
  showAuthMessage("");

  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    saveToken(data.token);
    showAuthMessage("Login successful. Loading your dashboard…", false);
    switchToDashboard();
    await loadProfileAndAccounts();
  } catch (err) {
    showAuthMessage(err.message, true);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  showAuthMessage("");

  const name = document.getElementById("register-name").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value;

  try {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    saveToken(data.token);
    showAuthMessage("Account created! Taking you to your new dashboard…", false);
    switchToDashboard();
    await loadProfileAndAccounts();
  } catch (err) {
    showAuthMessage(err.message, true);
  }
}

async function handleTransfer(event) {
  event.preventDefault();
  showTransferMessage("");

  const fromAccountId = document.getElementById("from-account").value;
  const toAccountId = document.getElementById("to-account").value;
  const amount = document.getElementById("transfer-amount").value;
  const description = document.getElementById("transfer-description").value.trim();

  try {
    await apiRequest("/transfer", {
      method: "POST",
      body: JSON.stringify({ fromAccountId, toAccountId, amount, description }),
    });
    showTransferMessage("Transfer completed successfully.", false);
    document.getElementById("transfer-form").reset();
    await loadProfileAndAccounts();
    if (selectedAccountId) {
      await loadTransactions(selectedAccountId);
    }
  } catch (err) {
    showTransferMessage(err.message, true);
  }
}

function initTabs() {
  const loginTab = document.getElementById("login-tab");
  const registerTab = document.getElementById("register-tab");
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");

  loginTab.addEventListener("click", () => {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");
    loginForm.classList.add("active");
    registerForm.classList.remove("active");
    showAuthMessage("");
  });

  registerTab.addEventListener("click", () => {
    registerTab.classList.add("active");
    loginTab.classList.remove("active");
    registerForm.classList.add("active");
    loginForm.classList.remove("active");
    showAuthMessage("");
  });
}

function initAuthForms() {
  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("register-form").addEventListener("submit", handleRegister);
}

function initTransferForm() {
  document.getElementById("transfer-form").addEventListener("submit", handleTransfer);
}

function initLogout() {
  document.getElementById("logout-btn").addEventListener("click", () => {
    clearToken();
    accountsCache = [];
    selectedAccountId = null;
    document.getElementById("accounts-list").innerHTML = "";
    document.getElementById("transactions-list").innerHTML = "";
    document.getElementById("total-balance").textContent = formatCurrency(0);
    document.getElementById("account-count").textContent = "0";
    showAuthMessage("");
    showTransferMessage("");
    switchToAuth();
  });
}

async function bootstrap() {
  initTabs();
  initAuthForms();
  initTransferForm();
  initLogout();

  const token = loadTokenFromStorage();
  if (token) {
    try {
      switchToDashboard();
      await loadProfileAndAccounts();
    } catch (err) {
      clearToken();
      switchToAuth();
    }
  }
}

document.addEventListener("DOMContentLoaded", bootstrap);

