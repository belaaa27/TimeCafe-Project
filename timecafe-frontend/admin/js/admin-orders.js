// admin/js/admin-orders.js

/**
 * TimeCafé OS - Admin Orders Controller
 */

document.addEventListener("DOMContentLoaded", async () => {
  const auth = checkAdminAuth();
  if (!auth) return;

  loadOrders(auth.token);

  const statusFilter = document.getElementById("statusFilter");
  if (statusFilter) {
    statusFilter.addEventListener("change", (e) => {
      loadOrders(auth.token, e.target.value);
    });
  }
});

async function loadOrders(token, filterStatus = "all") {
  const tbody = document.getElementById("adminOrdersBody");
  if (!tbody) return;

  try {
    const apiBase = window.API_BASE_URL || "http://localhost:5000/api";
    const res = await fetch(`${apiBase}/orders/admin`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const result = await res.json();

    if (!res.ok) throw new Error(result.message || "Failed to load orders.");

    let orders =
      result.data || result.orders || (Array.isArray(result) ? result : []);

    if (filterStatus !== "all") {
      orders = orders.filter(
        (o) => (o.status || "").toLowerCase() === filterStatus.toLowerCase(),
      );
    }

    if (orders.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="py-10 text-center text-slate-400 font-medium">
            No orders found for this filter.
          </td>
        </tr>`;
      return;
    }

    // Tailwind Badge Theme Mapper
    const statusStyles = {
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      preparing: "bg-blue-50 text-blue-700 border-blue-200",
      out_for_delivery: "bg-purple-50 text-purple-700 border-purple-200",
      delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
      cancelled: "bg-rose-50 text-rose-700 border-rose-200",
    };

    tbody.innerHTML = orders
      .map((order) => {
        const orderId = order.id || "N/A";
        const dateStr = order.createdAt
          ? new Date(order.createdAt).toLocaleString([], {
              dateStyle: "short",
              timeStyle: "short",
            })
          : "-";
        const address =
          order.delivery_snapshot?.address || "No address provided";
        const phone = order.delivery_snapshot?.phone || "N/A";
        const amount = Number(
          order.total_amount || order.totalPrice || order.total || 0,
        ).toFixed(2);

        const rawStatus = (order.status || "pending").toString().toLowerCase();
        const badgeStyle =
          statusStyles[rawStatus] ||
          "bg-slate-100 text-slate-700 border-slate-200";

        return `
          <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="py-4 px-6">
              <span class="font-bold text-slate-900 block">#${escapeHtml(orderId)}</span>
              <span class="text-xs text-slate-400 font-normal">${escapeHtml(dateStr)}</span>
            </td>
            <td class="py-4 px-6 max-w-xs">
              <p class="font-medium text-slate-800 truncate" title="${escapeHtml(address)}">${escapeHtml(address)}</p>
              <p class="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <i class="fa-solid fa-phone text-[10px] text-slate-400"></i> ${escapeHtml(phone)}
              </p>
            </td>
            <td class="py-4 px-6 font-semibold text-slate-900">
              Br ${amount}
            </td>
            <td class="py-4 px-6">
              <span class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full border ${badgeStyle}">
                ${escapeHtml(rawStatus.replace(/_/g, " ").toUpperCase())}
              </span>
            </td>
            <td class="py-4 px-6 text-right">
              <select 
                onchange="updateOrderStatus('${escapeHtml(orderId)}', this.value)" 
                class="bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-adminAccent cursor-pointer"
              >
                <option value="" disabled selected>Update Status...</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </td>
          </tr>
        `;
      })
      .join("");
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-8 text-center text-rose-500 font-medium">
          <i class="fa-solid fa-circle-exclamation mr-1"></i> Error loading orders: ${escapeHtml(err.message)}
        </td>
      </tr>`;
  }
}

async function updateOrderStatus(orderId, newStatus) {
  const auth = checkAdminAuth();
  if (!auth) return;

  try {
    const apiBase = window.API_BASE_URL || "http://localhost:5000/api";
    const res = await fetch(
      `${apiBase}/orders/admin/${encodeURIComponent(orderId)}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      },
    );

    const result = await res.json();
    if (res.ok) {
      loadOrders(
        auth.token,
        document.getElementById("statusFilter")?.value || "all",
      );
    } else {
      alert(
        `Failed to update order status: ${result.message || "Unknown error"}`,
      );
    }
  } catch (err) {
    alert("Network error while updating status.");
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
