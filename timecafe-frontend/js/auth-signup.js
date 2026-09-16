document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
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

  function validateForm() {
    let isValid = true;
    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!fullName || fullName.length < 2) {
      setError(
        "fullName",
        "fullNameError",
        "Name must be at least 2 characters.",
      );
      isValid = false;
    } else {
      setError("fullName", "fullNameError", null);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("email", "emailError", "Please enter a valid email address.");
      isValid = false;
    } else {
      setError("email", "emailError", null);
    }

    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(phone.replace(/\s+/g, ""))) {
      setError("phone", "phoneError", "Please enter a valid phone number.");
      isValid = false;
    } else {
      setError("phone", "phoneError", null);
    }

    if (password.length < 8) {
      setError(
        "password",
        "passwordError",
        "Password must be at least 8 characters.",
      );
      isValid = false;
    } else {
      setError("password", "passwordError", null);
    }

    if (password !== confirmPassword) {
      setError(
        "confirmPassword",
        "confirmPasswordError",
        "Passwords do not match.",
      );
      isValid = false;
    } else {
      setError("confirmPassword", "confirmPasswordError", null);
    }

    return isValid;
  }

  function setLoading(loading) {
    if (loading) {
      submitBtn.disabled = true;
      submitBtn.classList.add("opacity-75", "cursor-not-allowed");
      btnSpinner.classList.remove("hidden");
      btnText.textContent = "Registering...";
    } else {
      submitBtn.disabled = false;
      submitBtn.classList.remove("opacity-75", "cursor-not-allowed");
      btnSpinner.classList.add("hidden");
      btnText.textContent = "Register Account";
    }
  }

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusMessage.classList.add("hidden");
    if (!validateForm()) return;
    setLoading(true);

    const payload = {
      fullName: document.getElementById("fullName").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      password: document.getElementById("password").value,
    };

    try {
      // Replaced hardcoded localhost URL with dynamic API_BASE_URL
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        statusMessage.className =
          "mb-6 p-4 rounded-xl text-sm font-medium bg-green-100 text-green-700 border border-green-200 block";
        statusMessage.textContent =
          data.message || "Account created successfully! Redirecting...";
        signupForm.reset();
        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
      } else {
        throw new Error(data.message || "Registration failed.");
      }
    } catch (err) {
      statusMessage.className =
        "mb-6 p-4 rounded-xl text-sm font-medium bg-red-100 text-primary border border-red-200 block";
      statusMessage.textContent =
        err.message || "Unable to connect to the server.";
    } finally {
      setLoading(false);
    }
  });
});
