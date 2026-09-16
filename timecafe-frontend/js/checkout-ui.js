// js/checkout-ui.js

document.addEventListener("DOMContentLoaded", () => {
  if (!window.CartStore) {
    console.error(
      "❌ CartStore missing! Ensure js/cart-store.js is loaded first.",
    );
    return;
  }

  const cart = window.CartStore.getCart();
  const totals = window.CartStore.getTotals();

  if (!totals.hasItems) {
    alert("Your cart is empty! Redirecting to cart page...");
    window.location.href = "cart.html";
    return;
  }

  const form = document.getElementById("checkoutForm");
  const itemsContainer = document.getElementById("checkoutItemsContainer");
  const countEl = document.getElementById("checkoutItemCount");
  const subtotalEl = document.getElementById("checkoutSubtotal");
  const deliveryEl = document.getElementById("checkoutDelivery");
  const totalEl = document.getElementById("checkoutTotal");
  const globalError = document.getElementById("formGlobalError");
  const payButtonText = document.getElementById("payButtonText");

  const modal = document.getElementById("paymentModal");

  // Auto pre-fill user profile fields from localStorage
  try {
    const storedUser = JSON.parse(
      localStorage.getItem("timecafe_user") || "{}",
    );
    if (storedUser) {
      if (storedUser.fullName || storedUser.name) {
        const nameInput = document.getElementById("fullName");
        if (nameInput && !nameInput.value)
          nameInput.value = storedUser.fullName || storedUser.name;
      }
      if (storedUser.email) {
        const emailInput = document.getElementById("email");
        if (emailInput && !emailInput.value)
          emailInput.value = storedUser.email;
      }
      if (storedUser.phone) {
        const phoneInput = document.getElementById("phone");
        if (phoneInput && !phoneInput.value)
          phoneInput.value = storedUser.phone;
      }
    }
  } catch (e) {
    console.warn("Could not parse stored user profile for pre-fill:", e);
  }

  function renderSummary() {
    if (countEl) countEl.textContent = totals.itemCount;
    if (subtotalEl) subtotalEl.textContent = `${totals.subtotal} ETB`;
    if (deliveryEl) deliveryEl.textContent = `${totals.delivery} ETB`;
    if (totalEl) totalEl.textContent = `${totals.total} ETB`;

    if (itemsContainer) {
      const fallbackImage =
        "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80";

      itemsContainer.innerHTML = cart
        .map((item) => {
          const itemPrice = Number(item.price) || 0;
          const itemQty = Number(item.quantity) || 1;
          const itemTotal = (itemPrice * itemQty).toFixed(2);
          const imgSrc = item.image || fallbackImage;

          return `
            <div class="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                <div class="flex items-center gap-3">
                    <img src="${imgSrc}" 
                         alt="${item.name}" 
                         onerror="this.src='${fallbackImage}';"
                         class="w-12 h-12 object-cover rounded-xl bg-gray-50 border border-gray-100">
                    <div>
                        <h4 class="font-bold text-dark text-xs">${item.name}</h4>
                        <p class="text-gray-400 text-xs">${itemQty} x ${itemPrice.toFixed(2)} ETB</p>
                    </div>
                </div>
                <span class="font-bold text-dark text-xs">${itemTotal} ETB</span>
            </div>
          `;
        })
        .join("");
    }
  }

  renderSummary();

  const paymentRadios = document.querySelectorAll(
    'input[name="paymentMethod"]',
  );
  paymentRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      if (payButtonText) {
        payButtonText.textContent =
          e.target.value === "chapa" ? "Pay with Chapa" : "Complete Cash Order";
      }
    });
  });

  function showError(fieldId, message) {
    const inputEl = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}Error`);

    if (inputEl) {
      inputEl.classList.add("border-primary", "bg-red-50/30");
      inputEl.classList.remove("border-gray-200");
    }
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove("hidden");
    }
  }

  function clearError(fieldId) {
    const inputEl = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}Error`);

    if (inputEl) {
      inputEl.classList.remove("border-primary", "bg-red-50/30");
      inputEl.classList.add("border-gray-200");
    }
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.classList.add("hidden");
    }
  }

  ["fullName", "phone", "email", "city", "area", "address"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", () => clearError(id));
    }
  });

  function validateForm() {
    let isValid = true;

    const fullName = document.getElementById("fullName")?.value.trim() || "";
    const phone = document.getElementById("phone")?.value.trim() || "";
    const email = document.getElementById("email")?.value.trim() || "";
    const city = document.getElementById("city")?.value.trim() || "";
    const area = document.getElementById("area")?.value.trim() || "";
    const address = document.getElementById("address")?.value.trim() || "";

    if (!fullName || fullName.length < 2) {
      showError("fullName", "Name must be at least 2 characters.");
      isValid = false;
    }

    const phoneRegex = /^(\+251|0)?[97]\d{8}$|^[0-9\+\-\s]{9,15}$/;
    if (!phone || !phoneRegex.test(phone.replace(/\s+/g, ""))) {
      showError(
        "phone",
        "Please enter a valid phone number (e.g. 0911234567).",
      );
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showError("email", "Please enter a valid email address.");
      isValid = false;
    }

    if (!city) {
      showError("city", "City is required.");
      isValid = false;
    }
    if (!area) {
      showError("area", "Area or sub-city is required.");
      isValid = false;
    }
    if (!address) {
      showError("address", "Address is required.");
      isValid = false;
    }

    if (!isValid && globalError) {
      globalError.textContent = "Please fix the highlighted fields above.";
      globalError.classList.remove("hidden");
    } else if (globalError) {
      globalError.classList.add("hidden");
    }

    return isValid;
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      const token = localStorage.getItem("timecafe_token")?.trim();
      if (!token) {
        alert("You must be logged in to place an order.");
        window.location.href = "login.html";
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = payButtonText
        ? payButtonText.textContent
        : "Submit Order";
      if (submitBtn) {
        submitBtn.disabled = true;
        if (payButtonText) payButtonText.textContent = "Processing...";
      }

      const selectedPayment =
        document.querySelector('input[name="paymentMethod"]:checked')?.value ||
        "chapa";

      const orderPayload = {
        items: window.CartStore.getCart().map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        paymentMethod: selectedPayment,
        deliveryInfo: {
          city: document.getElementById("city").value.trim(),
          area: document.getElementById("area").value.trim(),
          address: document.getElementById("address").value.trim(),
          phone: document.getElementById("phone").value.trim(),
          instructions:
            document.getElementById("instructions")?.value.trim() || "",
        },
      };

      try {
        // DIRECT FETCH using window.API_BASE_URL (matching auth-signup pattern)
        const response = await fetch(`${window.API_BASE_URL}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderPayload),
        });

        if (response.status === 401) {
          localStorage.removeItem("timecafe_token");
          localStorage.removeItem("timecafe_user");
          window.location.href = "login.html";
          throw new Error("Session expired. Please log in again.");
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to create order");
        }

        if (typeof window.CartStore.clearCart === "function") {
          window.CartStore.clearCart();
        }

        const checkoutUrl = data.checkoutUrl || data.data?.checkoutUrl;
        const orderId =
          data.orderId || data.data?.orderId || data._id || data.data?._id;

        if (selectedPayment === "chapa" && checkoutUrl) {
          window.location.href = checkoutUrl;
        } else {
          window.location.href = `order-confirmation.html?orderId=${orderId || ""}`;
        }
      } catch (err) {
        console.error("Checkout error:", err);
        if (globalError) {
          globalError.textContent =
            err.message || "An error occurred during checkout.";
          globalError.classList.remove("hidden");
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          if (payButtonText) payButtonText.textContent = originalBtnText;
        }
      }
    });
  }

  window.closeModal = () => {
    if (modal) modal.classList.add("hidden");
  };
});
