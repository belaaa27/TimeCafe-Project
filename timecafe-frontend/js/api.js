// js/api.js

// Central API Base URL
window.API_BASE_URL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://timecafe-backend.onrender.com/api";

// Root Server URL (for resolving uploaded image paths)
window.SERVER_BASE_URL = window.API_BASE_URL.replace(/\/api\/?$/, "");
