import {
  loadConfig,
  requireAuth,
  getUser,
  getApiBase,
  fetchMe,
  clearSession,
} from "./auth.js";

const nameEl = document.getElementById("user-name");
const emailEl = document.getElementById("user-email");
const userIdEl = document.getElementById("user-id");
const apiUrlEl = document.getElementById("api-url");
const avatarEl = document.getElementById("avatar");
const avatarFallback = document.getElementById("avatar-fallback");
const statusBanner = document.getElementById("status-banner");

function showStatus(text, type = "info") {
  statusBanner.textContent = text;
  statusBanner.className = `message ${type}`;
  statusBanner.classList.remove("hidden");
}

function renderUser(user) {
  const displayName = user.name || user.email.split("@")[0];
  nameEl.textContent = displayName;
  emailEl.textContent = user.email;
  userIdEl.textContent = user.id;

  if (user.picture) {
    avatarEl.src = user.picture;
    avatarEl.classList.remove("hidden");
    avatarFallback.classList.add("hidden");
  } else {
    avatarEl.classList.add("hidden");
    avatarFallback.classList.remove("hidden");
    avatarFallback.textContent = displayName.charAt(0).toUpperCase();
  }
}

document.getElementById("btn-logout").addEventListener("click", () => {
  clearSession();
  window.location.href = "/";
});

async function init() {
  if (!requireAuth()) return;

  const apiBase = await loadConfig();
  apiUrlEl.textContent = apiBase;
  document.getElementById("api-docs-link").href = `${apiBase}/docs`;

  const cached = getUser();
  if (cached) renderUser(cached);

  try {
    const user = await fetchMe();
    renderUser(user);
    localStorage.setItem("user", JSON.stringify(user));
  } catch {
    if (cached) {
      showStatus("Could not refresh profile from API. Showing cached session.", "info");
    } else {
      clearSession();
      window.location.href = "/";
    }
  }
}

init();
