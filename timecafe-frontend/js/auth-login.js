document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const submitBtn = document.getElementById("submitBtn");
  const btnText = document.getElementById("btnText");
  const btnSpinner = document.getElementById("btnSpinner");
  const statusMessage = document.getElementById("statusMessage");

  // Toggle Password Visibility
  document.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = button.getAttribute("data-target");
      const targetInput = document.getElementById(targetId);
      const icon = button.querySelector("i");

      if (targetInput.type === "password") {
        targetInput.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      } else {
        targetInput.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      }
    });
  });

  // Error UI handler
  function setError(inputId, errorId, message) {
    const inputElem = document.getElementById(inputId);
    const errorElem = document.getElementById(errorId);

    if (message) {
      inputElem.classList.add("border-primary");
      inputElem.classList.remove("border-gray-200");

      errorElem.textContent = message;
      errorElem.classList.remove("hidden");
    } else {
      inputElem.classList.remove("border-primary");
      inputElem.classList.add("border-gray-200");

      errorElem.textContent = "";
      errorElem.classList.add("hidden");
    }
  }

  // Validation
  function validateForm() {
    let isValid = true;

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      setError("email", "emailError", "Email address is required.");
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setError("email", "emailError", "Please enter a valid email address.");
      isValid = false;
    } else {
      setError("email", "emailError", null);
    }

    if (!password) {
      setError("password", "passwordError", "Password is required.");
      isValid = false;
    } else {
      setError("password", "passwordError", null);
    }

    return isValid;
  }

  // Loading State
  function setLoading(loading) {
    if (loading) {
      submitBtn.disabled = true;
      submitBtn.classList.add("opacity-75", "cursor-not-allowed");

      btnSpinner.classList.remove("hidden");
      btnText.textContent = "Signing In...";
    } else {
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-75", "cursor-not-allowed");

      btnSpinner.classList.add("hidden");
      btnText.textContent = "Sign In";
    }
  }

  // Submit Handler
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    statusMessage.classList.add("hidden");

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const payload = {
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
    };

    try {
      // Replaced hardcoded localhost URL with dynamic API_BASE_URL
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials.");
      }

      // ==========================================
      // SAVE AUTHENTICATION DATA
      // ==========================================

      if (!data.token) {
        throw new Error(
          "Login succeeded, but the server did not return an authentication token.",
        );
      }

      localStorage.setItem("timecafe_token", data.token);

      if (data.data && data.data.user) {
        localStorage.setItem("timecafe_user", JSON.stringify(data.data.user));
      }

      // ==========================================
      // SUCCESS MESSAGE
      // ==========================================

      statusMessage.className =
        "mb-6 p-4 rounded-xl text-sm font-medium bg-green-100 text-green-700 border border-green-200 block";

      statusMessage.textContent = "Login successful! Redirecting...";

      // ==========================================
      // REDIRECT
      // ==========================================

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    } catch (err) {
      statusMessage.className =
        "mb-6 p-4 rounded-xl text-sm font-medium bg-red-100 text-primary border border-red-200 block";

      statusMessage.textContent =
        err.message || "Unable to connect to the authentication server.";
    } finally {
      setLoading(false);
    }
  });
});
