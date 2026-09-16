// admin/js/admin-auth.js

/**
 * TimeCafé OS - Admin Authentication & Access Guard
 */

// Safely reference API_BASE_URL from window (configured in js/api.js) with fallback
const getApiBaseUrl = () => window.API_BASE_URL || "http://localhost:5000/api";

/**
 * Checks admin authentication and enforces role privileges.
 * @param {string} requiredRole - Minimum role required ("admin" or "super_admin"). Defaults to "admin".
 * @returns {{ token: string, role: string, user: object } | null}
 */
function checkAdminAuth(requiredRole = "admin") {
  // 1. Retrieve token and role
  const token =
    localStorage.getItem("timecafe_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("adminToken");

  const userRole =
    localStorage.getItem("timecafe_role") ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem("adminUser") || "{}").role;
      } catch {
        return null;
      }
    })();

  let user = {};
  try {
    user = JSON.parse(
      localStorage.getItem("timecafe_user") ||
        localStorage.getItem("adminUser") ||
        "{}",
    );
  } catch (err) {
    console.error("Error parsing stored admin user:", err);
  }

  // 2. Client-side JWT expiration check
  if (token && isTokenExpired(token)) {
    alert("Session expired. Please log in again.");
    logoutAdmin();
    return null;
  }

  // 3. Validate token presence and authorized role
  if (!token || (userRole !== "admin" && userRole !== "super_admin")) {
    redirectToLogin();
    return null;
  }

  // 4. Restrict super_admin-only pages
  if (requiredRole === "super_admin" && userRole !== "super_admin") {
    alert("Access Denied: Superadmin privileges required.");
    window.location.href = "dashboard.html";
    return null;
  }

  return { token, role: userRole, user };
}

/**
 * Decodes client-side JWT payload to check expiration
 */
function isTokenExpired(token) {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return false;
    const payload = JSON.parse(atob(payloadBase64));
    return payload.exp && payload.exp * 1000 < Date.now();
  } catch {
    return false; // Fall back to server 401 handling if not a standard JWT
  }
}

/**
 * Helper to safely redirect unauthenticated users
 */
function redirectToLogin() {
  const path = window.location.pathname;
  const isLoginPage =
    path.endsWith("index.html") ||
    path.endsWith("login.html") ||
    path.endsWith("/admin/") ||
    path.endsWith("/");

  if (!isLoginPage) {
    window.location.href = "index.html";
  }
}

/**
 * Purges all admin authentication tokens and redirects to login.
 */
function logoutAdmin() {
  const authKeys = [
    "timecafe_token",
    "timecafe_role",
    "timecafe_user",
    "token",
    "adminToken",
    "adminUser",
  ];

  authKeys.forEach((key) => localStorage.removeItem(key));
  window.location.href = "index.html";
}

// Automatically enforce access control on script evaluation
(function autoProtectPage() {
  const path = window.location.pathname;
  const isLoginPage =
    path.endsWith("index.html") ||
    path.endsWith("login.html") ||
    path.endsWith("/admin/") ||
    path.endsWith("/");

  if (!isLoginPage) {
    const requiredRole = path.endsWith("staff.html") ? "super_admin" : "admin";
    checkAdminAuth(requiredRole);
  }
})();
