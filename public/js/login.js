import {
  loadConfig,
  setSession,
  startOAuth,
  continueWithEmail,
  loginWithPassword,
  signUp,
  getToken,
} from "./auth.js";

const views = {
  main: document.getElementById("view-main"),
  password: document.getElementById("view-password"),
  signup: document.getElementById("view-signup"),
};

const messageEl = document.getElementById("message");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signupNameInput = document.getElementById("signup-name");
const signupEmailInput = document.getElementById("signup-email");
const signupPasswordInput = document.getElementById("signup-password");

let currentEmail = "";

function showMessage(text, type = "info") {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
  messageEl.classList.remove("hidden");
}

function hideMessage() {
  messageEl.classList.add("hidden");
}

function showView(name) {
  Object.entries(views).forEach(([key, el]) => {
    el.classList.toggle("hidden", key !== name);
  });
  hideMessage();
}

function setLoading(button, loading) {
  button.disabled = loading;
  if (loading) {
    button.dataset.label = button.textContent;
    button.innerHTML = '<span class="spinner"></span>';
  } else {
    button.textContent = button.dataset.label || button.textContent;
  }
}

document.querySelectorAll("[data-oauth]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const provider = btn.dataset.oauth;
    setLoading(btn, true);
    try {
      await startOAuth(provider);
    } catch (err) {
      setLoading(btn, false);
      showMessage(err.message, "error");
    }
  });
});

document.getElementById("continue-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("btn-continue");
  const email = emailInput.value.trim();
  if (!email) return;

  setLoading(btn, true);
  try {
    const res = await continueWithEmail(email);
    currentEmail = email;

    if (res.require_password) {
      document.getElementById("password-email-label").textContent = email;
      passwordInput.value = "";
      showView("password");
      if (res.message) showMessage(res.message, "info");
    } else if (res.message?.toLowerCase().includes("sign up")) {
      signupEmailInput.value = email;
      showView("signup");
      showMessage(res.message, "info");
    } else {
      showMessage(res.message || "Use a social provider to sign in.", "info");
    }
  } catch (err) {
    showMessage(err.message, "error");
  } finally {
    setLoading(btn, false);
  }
});

document.getElementById("password-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("btn-login");
  setLoading(btn, true);
  try {
    const data = await loginWithPassword(currentEmail, passwordInput.value);
    setSession(data);
    window.location.href = "/profile";
  } catch (err) {
    showMessage(err.message, "error");
  } finally {
    setLoading(btn, false);
  }
});

document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("btn-signup");
  setLoading(btn, true);
  try {
    const data = await signUp({
      email: signupEmailInput.value.trim(),
      password: signupPasswordInput.value,
      name: signupNameInput.value.trim(),
    });
    setSession(data);
    window.location.href = "/profile";
  } catch (err) {
    showMessage(err.message, "error");
  } finally {
    setLoading(btn, false);
  }
});

document.getElementById("link-signup").addEventListener("click", (e) => {
  e.preventDefault();
  signupEmailInput.value = emailInput.value.trim();
  showView("signup");
});

document.querySelectorAll("[data-back]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    showView("main");
  });
});

async function init() {
  if (getToken()) {
    window.location.href = "/profile";
    return;
  }
  await loadConfig();
}

init();
