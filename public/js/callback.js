import { loadConfig, completeOAuth, setSession } from "./auth.js";

const statusEl = document.getElementById("status");
const messageEl = document.getElementById("message");

async function init() {
  await loadConfig();
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (error) {
    statusEl.textContent = "Sign in failed";
    messageEl.textContent = error;
    messageEl.className = "message error";
    return;
  }

  if (!code || !state) {
    statusEl.textContent = "Invalid callback";
    messageEl.textContent = "Missing authorization code. Return to sign in and try again.";
    messageEl.className = "message error";
    return;
  }

  try {
    const data = await completeOAuth(code, state);
    setSession(data);
    statusEl.textContent = "Success";
    messageEl.textContent = "Redirecting…";
    messageEl.className = "message success";
    window.location.replace("/profile");
  } catch (err) {
    statusEl.textContent = "Sign in failed";
    messageEl.textContent = err.message;
    messageEl.className = "message error";
    document.getElementById("retry-link").classList.remove("hidden");
  }
}

init();
