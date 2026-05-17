require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:8000";

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/config", (_req, res) => {
  res.json({ apiBaseUrl: API_BASE_URL });
});

app.get("/login", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/profile", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "profile.html"));
});

app.get("/auth/callback", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "callback.html"));
});

app.get("/dashboard", (_req, res) => {
  res.redirect(302, "/profile");
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.listen(PORT, () => {
  console.log(`Login app: http://localhost:${PORT}`);
  console.log(`API backend: ${API_BASE_URL}`);
});
