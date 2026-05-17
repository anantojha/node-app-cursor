import {
  loadConfig,
  requireAuth,
  getUser,
  fetchMe,
  fetchUsers,
  clearSession,
} from "./auth.js";

const nameEl = document.getElementById("user-name");
const emailEl = document.getElementById("user-email");
const userIdEl = document.getElementById("user-id");
const avatarEl = document.getElementById("avatar");
const avatarFallback = document.getElementById("avatar-fallback");
const statusBanner = document.getElementById("status-banner");
const usersList = document.getElementById("users-list");
const usersHint = document.getElementById("users-hint");

function showStatus(text, type = "info") {
  statusBanner.textContent = text;
  statusBanner.className = `message ${type}`;
  statusBanner.classList.remove("hidden");
}

function renderProfile(user) {
  const displayName = user.name || user.username || user.email.split("@")[0];
  nameEl.textContent =
    user.role === "admin" ? `${displayName} (Admin)` : displayName;
  emailEl.textContent = user.username
    ? `${user.username} · ${user.email}`
    : user.email;
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

function renderUsers(users, currentUserId) {
  usersList.innerHTML = "";

  if (users.length === 0) {
    usersHint.textContent = "No registered users yet.";
    return;
  }

  usersHint.textContent = `${users.length} user${users.length === 1 ? "" : "s"} (in-memory; resets when API restarts)`;

  for (const user of users) {
    const li = document.createElement("li");
    li.className = "users-list-item";
    if (user.id === currentUserId) li.classList.add("is-you");

    const displayName = user.name || user.email.split("@")[0];
    const initial = displayName.charAt(0).toUpperCase();

    li.innerHTML = `
      <div class="users-list-avatar" aria-hidden="true">${user.picture ? `<img src="${user.picture}" alt="" width="36" height="36" />` : initial}</div>
      <div class="users-list-meta">
        <strong>${escapeHtml(displayName)}${user.id === currentUserId ? ' <span class="badge-you">You</span>' : ""}</strong>
        <span>${escapeHtml(user.email)}</span>
      </div>
    `;
    usersList.appendChild(li);
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function loadUsers(currentUser, isAdmin) {
  if (!isAdmin) {
    usersHint.textContent = "Registered users list is only available to admin accounts.";
    usersList.innerHTML = "";
    document.getElementById("btn-refresh").classList.add("hidden");
    return;
  }

  usersHint.textContent = "Loading…";
  try {
    const users = await fetchUsers();
    renderUsers(users, currentUser.id);
  } catch (err) {
    usersHint.textContent = `Could not load users: ${err.message}`;
    usersList.innerHTML = "";
  }
}

document.getElementById("btn-logout").addEventListener("click", () => {
  clearSession();
  window.location.href = "/login";
});

document.getElementById("btn-refresh").addEventListener("click", async () => {
  const cached = getUser();
  if (cached) await loadUsers(cached, cached.role === "admin");
});

async function init() {
  if (!requireAuth()) return;

  await loadConfig();

  const cached = getUser();
  let currentUser = cached;
  if (cached) renderProfile(cached);

  try {
    currentUser = await fetchMe();
    renderProfile(currentUser);
    localStorage.setItem("user", JSON.stringify(currentUser));
  } catch {
    if (!cached) {
      clearSession();
      window.location.href = "/login";
      return;
    }
    showStatus("Could not refresh profile from API. Showing cached session.", "info");
  }

  if (currentUser) await loadUsers(currentUser, currentUser.role === "admin");
}

init();
