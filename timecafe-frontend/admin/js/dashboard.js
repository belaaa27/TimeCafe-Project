// admin/js/dashboard.js

/**
 * TimeCafé OS - Admin Dashboard Controller
 */

let previousPendingCount = null;
let soundEnabled = true;

document.addEventListener("DOMContentLoaded", async () => {
  const auth = checkAdminAuth();
  if (!auth) return;

  const userBadge = document.getElementById("adminUserBadge");
  if (userBadge) {
    userBadge.innerText = `Role: ${auth.role.toUpperCase()}`;
  }

  // Unlock Audio Context on first user click (bypasses browser autoplay restrictions)
  document.addEventListener("click", enableAudioOnInteraction, { once: true });

  // 1. Initial data fetch
  await loadDashboardData(auth);

  // 2. Poll every 30 seconds
  const POLL_INTERVAL = 30000;
  const pollTimer = setInterval(() => {
    loadDashboardData(auth);
  }, POLL_INTERVAL);

  window.addEventListener("beforeunload", () => clearInterval(pollTimer));
});

// Synthesize a pleasant dual-tone alert chime (E5 -> G5)
function playNotificationSound() {
  if (!soundEnabled) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5 note
    osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5 note

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (err) {
    console.warn("Audio alert blocked by browser:", err);
  }
}

function enableAudioOnInteraction() {
  playNotificationSound();
}

async function loadDashboardData(auth) {
  try {
    const apiBase = window.API_BASE_URL || "http://localhost:5000/api";

    // 1. Fetch stats from /admin/stats
    const statsRes = await fetch(`${apiBase}/admin/stats`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    const statsData = await statsRes.json();

    if (statsRes.ok && (statsData.success || statsData.data)) {
      const stats = statsData.data || statsData;

      const salesEl = document.getElementById("statSales");
      const pendingEl = document.getElementById("statPending");
      const productsEl = document.getElementById("statProducts");

      const rawSales = stats.totalSales ?? stats.totalRevenue ?? 0;
      const pendingCount = Number(stats.pendingOrders ?? stats.pending ?? 0);
      const productsCount = stats.totalProducts ?? stats.products ?? 0;

      if (salesEl) salesEl.innerText = `Br ${Number(rawSales).toFixed(2)}`;
      if (pendingEl) pendingEl.innerText = pendingCount;
      if (productsEl) productsEl.innerText = productsCount;

      // Play audio notification when new pending orders arrive
      if (
        previousPendingCount !== null &&
        pendingCount > previousPendingCount
      ) {
        playNotificationSound();
      }
      previousPendingCount = pendingCount;
    }

    // 2. Fetch recent orders from /orders/admin
    const ordersRes = await fetch(`${apiBase}/orders/admin`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (ordersRes.ok) {
      const ordersData = await ordersRes.json();
      const orders =
        ordersData.data ||
        ordersData.orders ||
        (Array.isArray(ordersData) ? ordersData : []);

      renderRecentOrders(orders.slice(0, 5));
    } else {
      renderRecentOrders([]);
    }
  } catch (err) {
    console.error("Failed to refresh dashboard data:", err);
  }
}

/**
 * Renders recent orders with Tailwind styling
 */
function renderRecentOrders(orders) {
  const tbody = document.getElementById("recentOrdersBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!Array.isArray(orders) || orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-10 text-center text-slate-400 font-medium">
          No recent orders found.
        </td>
      </tr>`;
    return;
  }

  orders.forEach((order) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50/80 transition-colors";

    // Displays full ID (no character truncation)
    const orderId = order.id || order.orderId || "N/A";

    const timeStr = order.createdAt
      ? new Date(order.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

    const amount = Number(
      order.total_amount || order.totalPrice || order.total || 0,
    ).toFixed(2);

    const rawStatus = (order.status || "pending")
      .toString()
      .toLowerCase()
      .replace(/_/g, " ");

    let statusBadge = `<span class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">${rawStatus.toUpperCase()}</span>`;

    if (rawStatus === "pending") {
      statusBadge = `<span class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200"><i class="fa-regular fa-clock text-[10px] mr-1.5"></i> PENDING</span>`;
    } else if (rawStatus === "preparing" || rawStatus === "in progress") {
      statusBadge = `<span class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200"><i class="fa-solid fa-fire text-[10px] mr-1.5"></i> PREPARING</span>`;
    } else if (rawStatus === "out for delivery" || rawStatus === "dispatched") {
      statusBadge = `<span class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200"><i class="fa-solid fa-truck-fast text-[10px] mr-1.5"></i> OUT FOR DELIVERY</span>`;
    } else if (
      rawStatus === "completed" ||
      rawStatus === "delivered" ||
      rawStatus === "paid"
    ) {
      statusBadge = `<span class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200"><i class="fa-solid fa-check text-[10px] mr-1.5"></i> COMPLETED</span>`;
    } else if (rawStatus === "cancelled") {
      statusBadge = `<span class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200"><i class="fa-solid fa-xmark text-[10px] mr-1.5"></i> CANCELLED</span>`;
    }

    tr.innerHTML = `
      <td class="py-4 px-6 font-mono font-bold text-slate-900">#${escapeHtml(orderId)}</td>
      <td class="py-4 px-6 text-slate-500">${escapeHtml(timeStr)}</td>
      <td class="py-4 px-6 font-bold text-slate-900">Br ${amount}</td>
      <td class="py-4 px-6">${statusBadge}</td>
      <td class="py-4 px-6 text-right">
        <a href="orders.html?id=${orderId}" class="px-3 py-1.5 text-xs font-semibold text-adminAccent bg-blue-50 hover:bg-blue-100 rounded-lg transition border border-blue-200 inline-flex items-center gap-1">
          Manage <i class="fa-solid fa-arrow-right text-[10px]"></i>
        </a>
      </td>
    `;
    tbody.appendChild(tr);
  });
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
