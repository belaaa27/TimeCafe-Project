// js/cart-ui.js

document.addEventListener("DOMContentLoaded", () => {
  function renderCartPage() {
    if (!window.CartStore) {
      console.error(
        "❌ CartStore is missing! Ensure js/cart-store.js is loaded BEFORE js/cart-ui.js",
      );
      return;
    }

    const cart = window.CartStore.getCart();
    const totals = window.CartStore.getTotals();

    console.log("🛒 Rendering Cart Page with", cart.length, "items");

    // 1. Locate Cart Containers
    const emptyState =
      document.getElementById("emptyCartState") ||
      document.querySelector(".empty-cart");
    const activeState =
      document.getElementById("activeCartState") ||
      document.querySelector(".active-cart");
    const itemsContainer =
      document.getElementById("cartItemsContainer") ||
      document.querySelector(".cart-items") ||
      document.querySelector("#cart-items");

    // 2. Locate Summary Elements
    const summaryCount =
      document.getElementById("summaryItemCount") ||
      document.querySelector(".summary-count");
    const summarySubtotal =
      document.getElementById("summarySubtotal") ||
      document.querySelector(".summary-subtotal");
    const summaryDelivery =
      document.getElementById("summaryDelivery") ||
      document.querySelector(".summary-delivery");
    const summaryTotal =
      document.getElementById("summaryTotal") ||
      document.querySelector(".summary-total");

    // Handle Empty Cart View vs Active Cart View
    if (!totals.hasItems) {
      if (emptyState) emptyState.classList.remove("hidden");
      if (activeState) activeState.classList.add("hidden");
      return;
    }

    // Show Active Cart UI
    if (emptyState) emptyState.classList.add("hidden");
    if (activeState) activeState.classList.remove("hidden");

    // Update Summary Totals safely (ETB standard)
    if (summaryCount) summaryCount.textContent = totals.itemCount;
    if (summarySubtotal) summarySubtotal.textContent = `${totals.subtotal} ETB`;
    if (summaryDelivery) summaryDelivery.textContent = `${totals.delivery} ETB`;
    if (summaryTotal) summaryTotal.textContent = `${totals.total} ETB`;

    // Render Cart Items into Container
    if (itemsContainer) {
      itemsContainer.innerHTML = cart
        .map((item) => {
          const itemPrice = Number(item.price) || 0;
          const itemQty = Number(item.quantity) || 1;
          const itemTotal = (itemPrice * itemQty).toFixed(2);

          return `
                    <div class="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-gray-100 last:border-0 last:pb-0 gap-4">
                        
                        <!-- Item Image & Info -->
                        <div class="flex items-center gap-4 w-full sm:w-auto">
                            <img src="${item.image || "https://via.placeholder.com/80?text=Item"}" 
                                 alt="${item.name}" 
                                 class="w-20 h-20 object-cover rounded-2xl bg-gray-50 border border-gray-100 shadow-sm">
                            <div>
                                <h3 class="font-bold text-gray-900 text-base font-serif">${item.name}</h3>
                                <p class="text-amber-600 font-semibold text-sm">${itemPrice.toFixed(2)} ETB</p>
                            </div>
                        </div>

                        <!-- Quantity Controls & Actions -->
                        <div class="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                            
                            <!-- Quantity Buttons -->
                            <div class="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                                <button onclick="handleQtyChange('${item.id}', -1)" 
                                        class="px-3 py-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-900 font-bold transition-colors">
                                    <i class="fa-solid fa-minus text-xs"></i>
                                </button>
                                <span class="px-4 py-1.5 font-bold text-sm text-gray-900 bg-white min-w-[36px] text-center">${itemQty}</span>
                                <button onclick="handleQtyChange('${item.id}', 1)" 
                                        class="px-3 py-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-900 font-bold transition-colors">
                                    <i class="fa-solid fa-plus text-xs"></i>
                                </button>
                            </div>

                            <!-- Total Price -->
                            <span class="font-bold text-gray-900 text-lg min-w-[75px] text-right">
                                ${itemTotal} ETB
                            </span>

                            <!-- Trash Button -->
                            <button onclick="handleRemoveItem('${item.id}')" 
                                    class="text-gray-400 hover:text-red-500 transition-colors p-2" 
                                    title="Remove item">
                                <i class="fa-solid fa-trash-can text-lg"></i>
                            </button>
                        </div>
                    </div>
                `;
        })
        .join("");
    } else {
      console.warn(
        "⚠️ Warning: Could not find cart items container (#cartItemsContainer or .cart-items) in cart.html",
      );
    }
  }

  // Global Actions
  window.handleQtyChange = (id, change) => {
    window.CartStore.updateQuantity(id, change);
  };

  window.handleRemoveItem = (id) => {
    window.CartStore.removeItem(id);
  };

  // Re-render when cart updates
  window.addEventListener("cartUpdated", renderCartPage);

  // Initial Render
  renderCartPage();
});
