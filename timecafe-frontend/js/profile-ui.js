document.addEventListener("DOMContentLoaded", async () => {
  // Initialize Default Profile Data if none exists
  initProfileData();

  // Load User Profile into UI Inputs from Backend
  await renderProfileDetails();

  // Load Order History into List View
  loadOrderHistory();

  // Profile Form Submission Handler
  const profileForm = document.getElementById("profileForm");
  if (profileForm) {
    profileForm.addEventListener("submit", handleProfileUpdate);
  }
});

// Store fetched orders in memory for the Modal to use
let cachedOrders = [];

// =========================================================================
// 1. DATA STORAGE & IMAGE HELPERS
// =========================================================================

const PROFILE_KEY = "timecafe_user_profile";

function initProfileData() {
  if (!localStorage.getItem(PROFILE_KEY)) {
    const defaultProfile = {
      fullName: "Abebe Bikila",
      email: "abebe@example.com",
      phone: "0911234567",
      city: "Addis Ababa",
      area: "Bole",
      address: "Cameroon St, near Atlas Hotel, Apt 3B",
      instructions: "Ring bell twice",
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(defaultProfile));
  }
}

function getUserProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

/**
 * Gets auth token from local storage (handles fallback keys)
 */
function getAuthToken() {
  return (
    localStorage.getItem("timecafe_token") || localStorage.getItem("token")
  );
}

/**
 * Formats image relative paths to absolute backend server paths dynamically
 */
function formatImageUrl(imagePath) {
  if (!imagePath) return "https://via.placeholder.com/150?text=Pizza";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const cleanPath = imagePath.startsWith("/")
    ? imagePath
    : `/uploads/${imagePath}`;
  const serverBase =
    typeof API_BASE_URL !== "undefined"
      ? API_BASE_URL.replace(/\/api\/?$/, "")
      : "http://127.0.0.1:5000";
  return `${serverBase}${cleanPath}`;
}

// =========================================================================
// 2. TAB NAVIGATION
// =========================================================================

window.switchTab = (tabName) => {
  const ordersTab = document.getElementById("ordersTabSection");
  const profileTab = document.getElementById("profileTabSection");
  const tabOrdersBtn = document.getElementById("tabOrdersBtn");
  const tabProfileBtn = document.getElementById("tabProfileBtn");

  if (tabName === "orders") {
    ordersTab?.classList.remove("hidden");
    profileTab?.classList.add("hidden");

    if (tabOrdersBtn) {
      tabOrdersBtn.className =
        "flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all bg-white text-dark shadow-sm";
    }
    if (tabProfileBtn) {
      tabProfileBtn.className =
        "flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all text-gray-500 hover:text-dark";
    }
  } else {
    ordersTab?.classList.add("hidden");
    profileTab?.classList.remove("hidden");

    if (tabProfileBtn) {
      tabProfileBtn.className =
        "flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all bg-white text-dark shadow-sm";
    }
    if (tabOrdersBtn) {
      tabOrdersBtn.className =
        "flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-sm transition-all text-gray-500 hover:text-dark";
    }
  }
};

// =========================================================================
// 3. PROFILE DETAILS LOGIC (Direct API_BASE_URL)
// =========================================================================

async function fetchUserProfile() {
  try {
    const token = getAuthToken();
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;

    const dbData = await response.json();
    if (dbData.success && dbData.data && dbData.data.user) {
      return dbData.data.user;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch profile from backend:", error);
    return null;
  }
}

async function renderProfileDetails() {
  const dbUser = await fetchUserProfile();
  const localProfile = getUserProfile();

  const profile = {
    ...localProfile,
    fullName:
      dbUser?.name ||
      dbUser?.fullName ||
      localProfile.fullName ||
      "User Account",
    email: dbUser?.email || localProfile.email || "",
    phone: dbUser?.phone || localProfile.phone || "",
  };

  const greeting = document.getElementById("welcomeGreeting");
  const emailBadge = document.getElementById("userEmailBadge");
  const initialsAvatar = document.getElementById("userAvatarInitials");

  const nameStr = profile.fullName;
  if (greeting) {
    greeting.textContent = `Welcome back, ${nameStr.split(" ")[0]}!`;
  }
  if (emailBadge) {
    emailBadge.innerHTML = `<i class="fa-solid fa-envelope text-xs text-gray-400"></i> ${profile.email || "no-email@timecafe.com"}`;
  }

  if (initialsAvatar) {
    const parts = nameStr.split(" ");
    const initials =
      parts.length > 1
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : nameStr.substring(0, 2).toUpperCase();
    initialsAvatar.textContent = initials;
  }

  const fieldMap = {
    profFullName: profile.fullName,
    profPhone: profile.phone,
    profEmail: profile.email,
    profCity: profile.city || "Addis Ababa",
    profArea: profile.area || "",
    profAddress: profile.address || "",
    profInstructions: profile.instructions || "",
  };

  Object.keys(fieldMap).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = fieldMap[id];
  });
}

async function handleProfileUpdate(e) {
  e.preventDefault();

  const fullName = document.getElementById("profFullName").value.trim();
  const phone = document.getElementById("profPhone").value.trim();
  const email = document.getElementById("profEmail").value.trim();

  let isValid = true;

  if (!fullName) {
    showProfError("profFullName", "Full name is required");
    isValid = false;
  } else {
    clearProfError("profFullName");
  }

  if (!phone) {
    showProfError("profPhone", "Phone number is required");
    isValid = false;
  } else {
    clearProfError("profPhone");
  }

  if (!isValid) return;

  // Send Name and Phone to Backend
  try {
    const token = getAuthToken();
    await fetch(`${API_BASE_URL}/auth/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ fullName, phone }),
    });
  } catch (error) {
    console.error("Failed to update backend profile:", error);
  }

  // Save Address fields to Local Storage
  const updatedProfile = {
    fullName,
    phone,
    email,
    city: document.getElementById("profCity").value.trim(),
    area: document.getElementById("profArea").value.trim(),
    address: document.getElementById("profAddress").value.trim(),
    instructions: document.getElementById("profInstructions").value.trim(),
  };

  localStorage.setItem(PROFILE_KEY, JSON.stringify(updatedProfile));

  await renderProfileDetails();

  const alertEl = document.getElementById("saveSuccessAlert");
  if (alertEl) {
    alertEl.classList.remove("hidden");
    setTimeout(() => alertEl.classList.add("hidden"), 3000);
  }
}

function showProfError(id, msg) {
  const errEl = document.getElementById(`${id}Error`);
  const inputEl = document.getElementById(id);
  if (errEl) {
    errEl.textContent = msg;
    errEl.classList.remove("hidden");
  }
  if (inputEl) inputEl.classList.add("border-primary");
}

function clearProfError(id) {
  const errEl = document.getElementById(`${id}Error`);
  const inputEl = document.getElementById(id);
  if (errEl) {
    errEl.textContent = "";
    errEl.classList.add("hidden");
  }
  if (inputEl) inputEl.classList.remove("border-primary");
}

// =========================================================================
// 4. ORDER HISTORY LOGIC (Direct API_BASE_URL)
// =========================================================================

window.loadOrderHistory = async () => {
  const container = document.getElementById("ordersListContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="flex justify-center items-center py-10">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  `;

  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      localStorage.removeItem("timecafe_token");
      localStorage.removeItem("token");
      localStorage.removeItem("timecafe_user");
      window.location.href = "login.html";
      throw new Error("Session expired. Please log in again.");
    }

    const dbData = await response.json();

    if (!response.ok || !dbData.success) {
      throw new Error(dbData.message || "Failed to load orders");
    }

    cachedOrders = dbData.data.map((orderData) => {
      const paymentInfo = Array.isArray(orderData.payment)
        ? orderData.payment[0]
        : orderData.payment || {};

      return {
        orderId: orderData.id,
        createdAt: orderData.createdAt,
        status: orderData.status || "success",
        paymentMethod: paymentInfo.method || "chapa",
        paymentStatus: paymentInfo.status || "Paid",
        delivery:
          typeof orderData.delivery_snapshot === "string"
            ? JSON.parse(orderData.delivery_snapshot)
            : orderData.delivery_snapshot || {},
        totals: {
          total: Number(orderData.total_amount || 0).toFixed(2),
          subtotal: Number(orderData.subtotal || 0).toFixed(2),
          delivery: Number(orderData.delivery_fee || 0).toFixed(2),
        },
        items: (orderData.items || []).map((item) => ({
          name: item.product?.name || "Menu Item",
          image: formatImageUrl(item.product?.image_url || item.product?.image),
          price: item.unit_price,
          quantity: item.quantity,
        })),
      };
    });

    if (cachedOrders.length === 0) {
      renderEmptyOrdersState(container);
      return;
    }

    container.innerHTML = cachedOrders
      .map((order) => {
        const orderId = order.orderId || "#TC-0000";
        const dateStr = order.createdAt
          ? new Date(order.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Recent";
        const totalAmount = order.totals?.total || "0.00";
        const itemCount = (order.items || []).reduce(
          (sum, i) => sum + (Number(i.quantity) || 1),
          0,
        );

        const statusBadge = getStatusBadge(order.status || "success");
        const paymentBadge = getPaymentBadge(
          order.paymentStatus || "Paid",
          order.paymentMethod,
        );

        return `
        <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:border-gray-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="space-y-2">
                <div class="flex items-center gap-3">
                    <span class="font-mono font-bold text-dark text-base">${orderId}</span>
                    ${statusBadge}
                    ${paymentBadge}
                </div>
                <p class="text-xs text-gray-400 font-medium">
                    Placed on <span class="text-gray-600 font-semibold">${dateStr}</span> &bull; ${itemCount} Item(s)
                </p>
                <div class="flex items-center gap-2 pt-1">
                    ${(order.items || [])
                      .slice(0, 3)
                      .map(
                        (item) => `
                        <span class="inline-block bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-xs text-gray-600 font-medium">
                            ${item.quantity}x ${item.name}
                        </span>
                    `,
                      )
                      .join("")}
                    ${(order.items || []).length > 3 ? `<span class="text-xs text-gray-400">+${order.items.length - 3} more</span>` : ""}
                </div>
            </div>

            <div class="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-gray-100">
                <div class="text-left md:text-right">
                    <span class="text-xs text-gray-400 block">Total Amount</span>
                    <span class="text-xl font-bold text-dark font-serif">ETB ${totalAmount}</span>
                </div>
                <button onclick="openOrderModal('${orderId}')" class="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-dark font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5">
                    <i class="fa-solid fa-eye text-xs"></i> View Details
                </button>
            </div>
        </div>
      `;
      })
      .join("");
  } catch (error) {
    console.error("Failed to load order history:", error);
    container.innerHTML = `
      <div class="bg-red-50 text-red-500 p-6 rounded-2xl text-center text-sm font-medium border border-red-100">
        Unable to load your order history right now. Please try refreshing the page.
      </div>
    `;
  }
};

function renderEmptyOrdersState(container) {
  container.innerHTML = `
        <div class="bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100 space-y-4">
            <div class="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto text-2xl">
                <i class="fa-solid fa-receipt"></i>
            </div>
            <h3 class="text-lg font-serif font-bold text-dark">No Orders Placed Yet</h3>
            <p class="text-xs text-gray-400 max-w-sm mx-auto">
                Looks like you haven't ordered any items yet. Explore our menu and place your first order!
            </p>
            <a href="index.html" class="inline-block px-6 py-3 bg-primary hover:bg-primaryDark text-white font-bold rounded-xl shadow-3d-btn transition-all text-xs">
                Browse Menu
            </a>
        </div>
    `;
}

// =========================================================================
// 5. STATUS BADGE HELPERS
// =========================================================================

function getStatusBadge(status) {
  switch (status.toLowerCase()) {
    case "success":
    case "delivered":
    case "completed":
      return `<span class="px-2.5 py-0.5 bg-emerald-50 text-chapa text-[11px] font-bold rounded-full border border-emerald-100">Delivered</span>`;
    case "pending":
    case "preparing":
      return `<span class="px-2.5 py-0.5 bg-amber-50 text-amber-600 text-[11px] font-bold rounded-full border border-amber-100">Preparing</span>`;
    case "failed":
    case "cancelled":
      return `<span class="px-2.5 py-0.5 bg-red-50 text-primary text-[11px] font-bold rounded-full border border-red-100">Cancelled</span>`;
    default:
      return `<span class="px-2.5 py-0.5 bg-gray-50 text-gray-600 text-[11px] font-bold rounded-full">Processing</span>`;
  }
}

function getPaymentBadge(payStatus, method) {
  if (payStatus === "Paid" || method === "chapa") {
    return `<span class="px-2 py-0.5 bg-emerald-100 text-chapaDark text-[10px] font-bold rounded-md">Paid</span>`;
  }
  return `<span class="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded-md">Cash on Delivery</span>`;
}

// =========================================================================
// 6. ORDER DETAIL MODAL
// =========================================================================

window.openOrderModal = (orderId) => {
  const modal = document.getElementById("orderDetailsModal");
  const modalTitle = document.getElementById("modalOrderId");
  const modalBody = document.getElementById("modalOrderBody");

  const order = cachedOrders.find((o) => o.orderId === orderId);
  if (!order) return;

  if (modalTitle) modalTitle.textContent = order.orderId;

  if (modalBody) {
    modalBody.innerHTML = `
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl text-xs border border-gray-100">
                <div>
                    <span class="text-gray-400 block font-medium">Date Placed</span>
                    <span class="font-bold text-dark">${order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}</span>
                </div>
                <div>
                    <span class="text-gray-400 block font-medium">Payment Method</span>
                    <span class="font-bold text-dark uppercase">${order.paymentMethod || "Chapa"}</span>
                </div>
                <div>
                    <span class="text-gray-400 block font-medium">Status</span>
                    <span class="font-bold text-dark capitalize">${order.status || "Active"}</span>
                </div>
            </div>

            <div>
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Order Items</h4>
                <div class="space-y-3">
                    ${(order.items || [])
                      .map(
                        (item) => `
                        <div class="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                            <div class="flex items-center gap-3">
                                <img src="${item.image}" onerror="this.onerror=null; this.src='https://via.placeholder.com/150?text=Pizza';" class="w-12 h-12 object-cover rounded-xl border border-gray-100">
                                <div>
                                    <h5 class="font-bold text-dark text-sm">${item.name}</h5>
                                    <p class="text-xs text-gray-400">${item.quantity} × ETB ${Number(item.price).toFixed(2)}</p>
                                </div>
                            </div>
                            <span class="font-bold text-dark text-sm">ETB ${(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>

            <div class="border-t border-gray-100 pt-4">
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Address</h4>
                <p class="text-xs text-gray-700 leading-relaxed">
                    ${order.delivery?.address || ""}, ${order.delivery?.area || ""}, ${order.delivery?.city || ""}
                </p>
            </div>

            <div class="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div class="flex justify-between text-gray-500 text-xs">
                    <span>Subtotal</span>
                    <span class="font-medium text-dark">ETB ${order.totals?.subtotal || "0.00"}</span>
                </div>
                <div class="flex justify-between text-gray-500 text-xs">
                    <span>Delivery Fee</span>
                    <span class="font-medium text-dark">ETB ${order.totals?.delivery || "0.00"}</span>
                </div>
                <div class="flex justify-between font-bold text-base text-dark pt-2 border-t border-gray-100">
                    <span>Total</span>
                    <span class="text-chapa">ETB ${order.totals?.total || "0.00"}</span>
                </div>
            </div>
        `;
  }

  modal?.classList.remove("hidden");
};

window.closeOrderModal = () => {
  const modal = document.getElementById("orderDetailsModal");
  modal?.classList.add("hidden");
};
