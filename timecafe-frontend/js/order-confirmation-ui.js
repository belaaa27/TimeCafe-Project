// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

function getFullImageUrl(imagePath) {
  if (!imagePath) return "https://via.placeholder.com/50?text=Pizza";

  // Return directly if it's already an absolute URL
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const cleanPath = imagePath.replace(/^\/+/, "");
  const serverBase = window.SERVER_BASE_URL || "http://localhost:5000";

  // Checks if backend path already includes 'uploads/' or not
  if (cleanPath.startsWith("uploads/")) {
    return `${serverBase}/${cleanPath}`;
  }
  return `${serverBase}/uploads/${cleanPath}`;
}

// =========================================================================
// INITIALIZATION
// =========================================================================

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("orderConfirmationApp");

  // 1. Extract parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const urlStatus = urlParams.get("status");
  const urlOrderId = urlParams.get("orderId");
  const txRef = urlParams.get("tx_ref"); // Added to catch the Chapa redirect

  if (!urlOrderId && !txRef) {
    renderInvalidState(container);
    return;
  }

  // 2. Get auth token
  const token = localStorage.getItem("timecafe_token");
  if (!token) {
    renderInvalidState(container);
    return;
  }

  // 3. Central API Base Endpoint
  const apiBase = window.API_BASE_URL || "http://localhost:5000/api";

  // 4. Fetch real order data from the backend
  try {
    let dbData;

    if (txRef) {
      // IF CHAPA REDIRECT: Call the verify endpoint using tx_ref
      const response = await fetch(`${apiBase}/orders/verify/${txRef}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const verifyResult = await response.json();

      if (!response.ok) {
        throw new Error(verifyResult.message || "Payment verification failed");
      }

      dbData = verifyResult;
    } else if (urlOrderId) {
      // IF NORMAL ORDER (e.g., Cash on Delivery): Call the standard order endpoint
      const response = await fetch(`${apiBase}/orders/${urlOrderId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      dbData = await response.json();

      if (!response.ok || !dbData.success) {
        throw new Error(dbData.message || "Order not found");
      }
    }

    const orderData = dbData.data;

    // Determine payment status safely
    const paymentInfo = Array.isArray(orderData.payment)
      ? orderData.payment[0]
      : orderData.payment || {};

    // 5. Adapt Database structure to match what the UI HTML expects
    const adaptedOrder = {
      orderId: orderData.id || txRef,
      createdAt: orderData.createdAt,
      status: urlStatus || paymentInfo.status || orderData.status || "success",
      paymentMethod: paymentInfo.method || "chapa",
      customer: {
        fullName: "Customer",
        phone: orderData.delivery_snapshot?.phone || "-",
        email: "-",
      },
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
        image: getFullImageUrl(item.product?.image_url || item.product?.image),
        price: item.unit_price,
        quantity: item.quantity,
      })),
    };

    // 6. Determine Final State
    const state = adaptedOrder.status.toLowerCase();

    // Render corresponding view
    switch (state) {
      case "success":
      case "paid":
      case "preparing":
      case "pending cash":
      case "cash_on_delivery":
        renderSuccessState(container, adaptedOrder);
        if (window.CartStore) window.CartStore.clearCart();
        break;

      case "pending":
        renderPendingState(container, adaptedOrder);
        break;

      case "failed":
      case "cancelled":
        renderFailedState(container, adaptedOrder);
        break;

      default:
        renderSuccessState(container, adaptedOrder);
        break;
    }
  } catch (err) {
    console.error("Failed to parse or fetch order:", err);
    renderInvalidState(container);
  }
});

// =========================================================================
// RENDERERS
// =========================================================================

function renderSuccessState(container, order) {
  const orderId =
    order.orderId || "#TC-" + Math.floor(100000 + Math.random() * 900000);
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleString()
    : new Date().toLocaleString();
  const estTime = order.estimatedDeliveryTime || "30 - 45 Minutes";

  container.innerHTML = `
        <div class="space-y-8 animate-fade-in">
            <!-- Header Banner -->
            <div class="bg-white rounded-3xl p-8 text-center shadow-sm border border-emerald-100 relative overflow-hidden">
                <div class="w-20 h-20 bg-emerald-100 text-chapa rounded-full flex items-center justify-center mx-auto text-3xl mb-4 shadow-sm">
                    <i class="fa-solid fa-circle-check"></i>
                </div>
                <span class="inline-block px-3 py-1 bg-emerald-50 text-chapa text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                    Payment Successful
                </span>
                <h1 class="text-3xl font-serif font-bold text-dark">Thank You for Your Order!</h1>
                <p class="text-gray-500 text-sm mt-2 max-w-md mx-auto">
                    Your pizza is being freshly crafted by our chefs and will be on its way shortly.
                </p>

                <!-- Order Reference Badge -->
                <div class="mt-6 inline-flex items-center gap-4 bg-gray-50 border border-gray-200 rounded-2xl px-6 py-3 text-sm">
                    <div>
                        <span class="text-xs text-gray-400 block font-medium">Order Number</span>
                        <span class="font-mono font-bold text-dark text-base">${orderId}</span>
                    </div>
                    <div class="h-8 w-px bg-gray-200"></div>
                    <div>
                        <span class="text-xs text-gray-400 block font-medium">Date & Time</span>
                        <span class="font-bold text-dark">${orderDate}</span>
                    </div>
                </div>
            </div>

            <!-- Delivery Tracker Bar -->
            <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-xl">
                        <i class="fa-solid fa-motorcycle"></i>
                    </div>
                    <div>
                        <h3 class="font-bold text-dark text-sm">Estimated Delivery Time</h3>
                        <p class="text-xs text-gray-500">Delivering to ${order.delivery?.area || "your address"}, ${order.delivery?.city || "Addis Ababa"}</p>
                    </div>
                </div>
                <div class="text-right w-full md:w-auto bg-amber-50/50 md:bg-transparent p-4 md:p-0 rounded-2xl">
                    <span class="text-2xl font-bold text-amber-600 font-serif">${estTime}</span>
                </div>
            </div>

            <!-- Order Details Grid -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <!-- Left: Items Breakdown -->
                <div class="md:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
                    <h2 class="text-lg font-bold font-serif text-dark border-b border-gray-100 pb-3">Ordered Items</h2>
                    <div class="space-y-3">
                        ${(order.items || [])
                          .map(
                            (item) => `
                            <div class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                <div class="flex items-center gap-3">
                                    <img src="${item.image}" alt="${item.name}" class="w-12 h-12 object-cover rounded-xl border border-gray-100">
                                    <div>
                                        <h4 class="font-bold text-dark text-sm">${item.name}</h4>
                                        <p class="text-xs text-gray-400">Qty: ${item.quantity} × ETB ${Number(item.price).toFixed(2)}</p>
                                    </div>
                                </div>
                                <span class="font-bold text-dark text-sm">ETB ${(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                            </div>
                        `,
                          )
                          .join("")}
                    </div>

                    <!-- Totals Summary -->
                    <div class="border-t border-gray-100 pt-4 space-y-2 text-sm">
                        <div class="flex justify-between text-gray-500">
                            <span>Subtotal</span>
                            <span class="font-medium text-dark">ETB ${order.totals?.subtotal || "0.00"}</span>
                        </div>
                        <div class="flex justify-between text-gray-500">
                            <span>Delivery Fee</span>
                            <span class="font-medium text-dark">ETB ${order.totals?.delivery || "0.00"}</span>
                        </div>
                        <div class="flex justify-between font-bold text-base text-dark pt-2 border-t border-gray-100">
                            <span>Total Paid</span>
                            <span class="text-chapa">ETB ${order.totals?.total || "0.00"}</span>
                        </div>
                    </div>
                </div>

                <!-- Right: Customer & Payment Details -->
                <div class="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6 h-fit">
                    <div>
                        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Customer Details</h3>
                        <p class="font-bold text-dark text-sm">${order.customer?.fullName || "-"}</p>
                        <p class="text-xs text-gray-500">${order.customer?.phone || "-"}</p>
                        <p class="text-xs text-gray-500">${order.customer?.email || "-"}</p>
                    </div>

                    <div class="border-t border-gray-100 pt-4">
                        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Address</h3>
                        <p class="text-xs text-gray-700 leading-relaxed">
                            ${order.delivery?.address || ""}<br>
                            ${order.delivery?.area || ""}, ${order.delivery?.city || ""}
                        </p>
                        ${order.delivery?.instructions ? `<p class="text-xs text-amber-600 italic mt-2">"${order.delivery.instructions}"</p>` : ""}
                    </div>

                    <div class="border-t border-gray-100 pt-4">
                        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payment Status</h3>
                        <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-chapaDark font-bold text-xs rounded-full">
                            <i class="fa-solid fa-circle-check text-[10px]"></i>
                            ${order.paymentMethod === "chapa" ? "Paid via Chapa" : "Cash on Delivery"}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            ${renderActionButtons()}
        </div>
    `;
}

function renderPendingState(container, order) {
  const orderId = order?.orderId || "#TC-PENDING";

  container.innerHTML = `
        <div class="bg-white rounded-3xl p-8 text-center shadow-sm border border-amber-100 max-w-2xl mx-auto space-y-6">
            <div class="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto text-3xl shadow-sm">
                <i class="fa-solid fa-clock animate-pulse"></i>
            </div>
            <div>
                <span class="inline-block px-3 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                    Payment Pending
                </span>
                <h1 class="text-3xl font-serif font-bold text-dark">Awaiting Payment Confirmation</h1>
                <p class="text-gray-500 text-sm mt-2">
                    We are currently waiting for Chapa to confirm your payment transaction for <span class="font-mono font-bold text-dark">${orderId}</span>.
                </p>
            </div>

            <div class="p-4 bg-amber-50/50 rounded-2xl text-xs text-amber-800 text-left border border-amber-100 flex items-start gap-3">
                <i class="fa-solid fa-circle-info text-amber-500 text-base mt-0.5"></i>
                <p>If you completed the payment on Telebirr or your bank app, this screen will update automatically once Chapa verifies the transaction.</p>
            </div>

            <div class="pt-4 border-t border-gray-100">
                ${renderActionButtons()}
            </div>
        </div>
    `;
}

function renderFailedState(container, order) {
  container.innerHTML = `
        <div class="bg-white rounded-3xl p-8 text-center shadow-sm border border-red-100 max-w-2xl mx-auto space-y-6">
            <div class="w-20 h-20 bg-red-100 text-primary rounded-full flex items-center justify-center mx-auto text-3xl shadow-sm">
                <i class="fa-solid fa-circle-xmark"></i>
            </div>
            <div>
                <span class="inline-block px-3 py-1 bg-red-50 text-primary text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                    Payment Unsuccessful
                </span>
                <h1 class="text-3xl font-serif font-bold text-dark">Payment Failed</h1>
                <p class="text-gray-500 text-sm mt-2">
                    Your payment could not be processed or was canceled. Don't worry, your items are still saved in your cart.
                </p>
            </div>

            <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-gray-100">
                <a href="checkout.html" class="w-full sm:w-auto px-6 py-3.5 bg-primary hover:bg-primaryDark text-white font-bold rounded-xl shadow-3d-btn transition-all text-sm">
                    <i class="fa-solid fa-rotate-right mr-1"></i> Retry Checkout
                </a>
                <a href="cart.html" class="w-full sm:w-auto px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-dark font-bold rounded-xl transition-all text-sm">
                    Return to Cart
                </a>
            </div>
        </div>
    `;
}

function renderInvalidState(container) {
  container.innerHTML = `
        <div class="bg-white rounded-3xl p-10 text-center shadow-sm border border-gray-100 max-w-xl mx-auto space-y-6">
            <div class="w-20 h-20 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto text-3xl">
                <i class="fa-solid fa-receipt"></i>
            </div>
            <div>
                <h1 class="text-2xl font-serif font-bold text-dark">No Active Order Found</h1>
                <p class="text-gray-500 text-sm mt-2">
                    We couldn't find details for this order session. It may have expired or been cleared.
                </p>
            </div>
            <a href="index.html" class="inline-block px-8 py-3.5 bg-primary hover:bg-primaryDark text-white font-bold rounded-xl shadow-3d-btn transition-all text-sm">
                Browse Menu
            </a>
        </div>
    `;
}

function renderActionButtons() {
  return `
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="index.html" class="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primaryDark text-white font-bold rounded-xl shadow-3d-btn transition-all text-sm text-center">
                <i class="fa-solid fa-pizza-slice mr-2"></i> Continue Shopping
            </a>

            <a href="profile.html" class="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-dark font-bold rounded-xl text-sm transition-colors text-center">
               <i class="fa-solid fa-clock-rotate-left mr-2"></i> View Order History
            </a>
        </div>
    `;
}
