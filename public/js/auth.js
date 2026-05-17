const TOKEN_KEY = "access_token";
const USER_KEY = "user";

let apiBaseUrl = "http://localhost:8000";

export async function loadConfig() {
  const res = await fetch("/api/config");
  const data = await res.json();
  apiBaseUrl = data.apiBaseUrl.replace(/\/$/, "");
  return apiBaseUrl;
}

export function getApiBase() {
  return apiBaseUrl;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setSession({ access_token, user }) {
  localStorage.setItem(TOKEN_KEY, access_token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function requireAuth() {
  if (!getToken()) {
    window.location.href = "/login";
    return false;
  }
  return true;
}

export async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const hasBody = options.body != null;
  if (hasBody && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }
  if (!res.ok) {
    const detail = data?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d) => d.msg || d).join(", ")
          : res.statusText;
    throw new Error(message || "Request failed");
  }
  return data;
}

export async function startOAuth(provider) {
  const redirectUri = `${window.location.origin}/auth/callback`;
  const res = await apiFetch(
    `/auth/${provider}/authorize-url?redirect_uri=${encodeURIComponent(redirectUri)}`,
    { method: "GET" }
  );
  sessionStorage.setItem("oauth_provider", provider);
  sessionStorage.setItem("oauth_state", res.state);
  sessionStorage.setItem("oauth_redirect_uri", redirectUri);
  window.location.href = res.url;
}

export async function completeOAuth(code, state) {
  const provider = sessionStorage.getItem("oauth_provider");
  const redirectUri = sessionStorage.getItem("oauth_redirect_uri");
  if (!provider) throw new Error("Missing OAuth session. Try signing in again.");

  const data = await apiFetch(`/auth/${provider}/token`, {
    method: "POST",
    body: JSON.stringify({ code, state, redirect_uri: redirectUri }),
  });

  sessionStorage.removeItem("oauth_provider");
  sessionStorage.removeItem("oauth_state");
  sessionStorage.removeItem("oauth_redirect_uri");
  return data;
}

export async function continueWithEmail(email) {
  return apiFetch("/auth/continue", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function loginWithPassword(email, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function signUp({ email, password, name }) {
  return apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name: name || undefined }),
  });
}

export async function fetchMe() {
  return apiFetch("/auth/me", { method: "GET" });
}

export async function fetchUsers() {
  return apiFetch("/auth/users", { method: "GET" });
}
