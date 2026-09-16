// Helper function to check if a JWT token is expired
function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payloadBase64 = token.split(".")[1];
    const decodedJson = atob(payloadBase64);
    const payload = JSON.parse(decodedJson);
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    return true;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("timecafe_token");
  const userString = localStorage.getItem("timecafe_user");

  // Navigation Elements
  const guestNav = document.getElementById("guestNav");
  const userNav = document.getElementById("userNav");
  const userNameDisplay = document.getElementById("userNameDisplay");
  const logoutBtn = document.getElementById("logoutBtn");

  const mobileGuestNav = document.getElementById("mobileGuestNav");
  const mobileUserNav = document.getElementById("mobileUserNav");
  const mobileUserNameDisplay = document.getElementById(
    "mobileUserNameDisplay",
  );
  const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");

  function handleLogout() {
    localStorage.removeItem("timecafe_token");
    localStorage.removeItem("timecafe_user");
    window.location.href = "login.html";
  }

  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
  if (mobileLogoutBtn) mobileLogoutBtn.addEventListener("click", handleLogout);

  // --- AUTHENTICATION STATE SYNC ---
  if (token && userString) {
    if (isTokenExpired(token)) {
      localStorage.removeItem("timecafe_token");
      localStorage.removeItem("timecafe_user");
      if (guestNav) guestNav.classList.remove("hidden");
      if (userNav) userNav.classList.add("hidden");
      if (mobileGuestNav) mobileGuestNav.classList.remove("hidden");
      if (mobileUserNav) mobileUserNav.classList.add("hidden");
      return;
    }

    const user = JSON.parse(userString);
    const displayName = user.name || user.fullName || "Account";

    // Desktop
    if (guestNav) guestNav.classList.add("hidden");
    if (userNav) userNav.classList.remove("hidden");
    if (userNameDisplay) userNameDisplay.textContent = displayName;

    // Mobile
    if (mobileGuestNav) mobileGuestNav.classList.add("hidden");
    if (mobileUserNav) mobileUserNav.classList.remove("hidden");
    if (mobileUserNameDisplay) mobileUserNameDisplay.textContent = displayName;
  } else {
    // Guest State
    if (guestNav) guestNav.classList.remove("hidden");
    if (userNav) userNav.classList.add("hidden");
    if (mobileGuestNav) mobileGuestNav.classList.remove("hidden");
    if (mobileUserNav) mobileUserNav.classList.add("hidden");
  }

  // --- DEDICATED HAMBURGER TOGGLE (Clears duplicate listeners) ---
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");

  if (mobileMenuBtn && mobileMenu) {
    // Clone element to wipe away duplicate event listeners from other JS files
    const cleanBtn = mobileMenuBtn.cloneNode(true);
    mobileMenuBtn.parentNode.replaceChild(cleanBtn, mobileMenuBtn);

    cleanBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      mobileMenu.classList.toggle("hidden");
    });
  }
});
