// admin/js/admin-staff.js

/**
 * TimeCafé OS - Admin Staff Management Controller
 */

function getApiUrl() {
  return (
    (typeof API_BASE_URL !== "undefined"
      ? API_BASE_URL
      : window.API_BASE_URL) || "http://localhost:5000/api"
  );
}

let staffListCache = [];

document.addEventListener("DOMContentLoaded", async () => {
  const auth = checkAdminAuth("super_admin");
  if (!auth) return;

  loadStaff(auth.token);

  const form = document.getElementById("staffForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      saveStaff(auth.token);
    });
  }
});

/**
 * Fetches and renders all staff accounts from the API
 */
async function loadStaff(token) {
  const tbody = document.getElementById("staffTableBody");
  if (!tbody) return;

  try {
    const res = await fetch(`${getApiUrl()}/staff`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Failed to load staff accounts");
    }

    staffListCache = result.data || result || [];

    if (!Array.isArray(staffListCache) || staffListCache.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="py-10 text-center text-slate-400 font-medium">
            <i class="fa-solid fa-users-slash text-2xl mb-2 block text-slate-300"></i>
            No staff accounts found.
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = staffListCache
      .map((member) => {
        const memberId = escapeHtml(String(member.id || member._id));
        const isSuper = member.role === "super_admin";
        const createdAt = member.created_at || member.createdAt;

        const roleBadge = isSuper
          ? `<span class="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full border bg-purple-50 text-purple-700 border-purple-200">SUPERADMIN</span>`
          : `<span class="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full border bg-blue-50 text-blue-700 border-blue-200">ADMIN</span>`;

        return `
          <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="py-3 px-4 sm:px-6 font-semibold text-slate-900 text-xs sm:text-sm">${escapeHtml(member.name)}</td>
            <td class="py-3 px-4 sm:px-6 text-slate-600 text-xs sm:text-sm">${escapeHtml(member.email)}</td>
            <td class="py-3 px-4 sm:px-6">${roleBadge}</td>
            <td class="py-3 px-4 sm:px-6 text-slate-500 text-xs sm:text-sm hidden md:table-cell">${createdAt ? new Date(createdAt).toLocaleDateString() : "N/A"}</td>
            <td class="py-3 px-4 sm:px-6 text-right space-x-1 sm:space-x-2 whitespace-nowrap">
              <button onclick="editStaffById('${memberId}')" class="px-2.5 py-1.5 text-xs font-semibold text-adminAccent bg-blue-50 hover:bg-blue-100 rounded-lg transition border border-blue-200 inline-flex items-center gap-1">
                <i class="fa-solid fa-pen-to-square"></i> <span class="hidden sm:inline">Edit</span>
              </button>
              <button onclick="deleteStaff('${memberId}')" class="px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition border border-rose-200 inline-flex items-center gap-1">
                <i class="fa-solid fa-trash"></i> <span class="hidden sm:inline">Delete</span>
              </button>
            </td>
          </tr>
        `;
      })
      .join("");
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-8 text-center text-rose-500 font-medium">
          <i class="fa-solid fa-circle-exclamation mr-1"></i> Error loading staff: ${escapeHtml(err.message)}
        </td>
      </tr>`;
  }
}

/**
 * Opens modal for adding or editing a staff member
 */
function openStaffModal(member = null) {
  const modal = document.getElementById("staffModal");
  const modalTitle = document.getElementById("modalTitle");
  if (!modal) return;

  modal.classList.remove("hidden");

  if (member) {
    if (modalTitle) {
      modalTitle.innerHTML = `<i class="fa-solid fa-user-pen text-adminAccent"></i> Edit Staff Member`;
    }
    document.getElementById("staffId").value = member.id || member._id || "";
    document.getElementById("staffName").value = member.name || "";
    document.getElementById("staffEmail").value = member.email || "";
    document.getElementById("staffRole").value = member.role || "admin";
    document.getElementById("staffPassword").value = "";
  } else {
    if (modalTitle) {
      modalTitle.innerHTML = `<i class="fa-solid fa-user-plus text-adminAccent"></i> Add Staff Member`;
    }
    document.getElementById("staffId").value = "";
    document.getElementById("staffForm").reset();
  }
}

function closeStaffModal() {
  const modal = document.getElementById("staffModal");
  if (modal) modal.classList.add("hidden");
}

function editStaffById(id) {
  const member = staffListCache.find(
    (item) => String(item.id || item._id) === String(id),
  );
  if (member) openStaffModal(member);
}

/**
 * Handles Create (POST) and Update (PUT) operations
 */
async function saveStaff(token) {
  const id = document.getElementById("staffId").value;
  const isEdit = Boolean(id);
  const password = document.getElementById("staffPassword").value;

  if (!isEdit && !password) {
    alert("Password is required when creating a new staff account.");
    return;
  }

  const payload = {
    name: document.getElementById("staffName").value.trim(),
    email: document.getElementById("staffEmail").value.trim(),
    role: document.getElementById("staffRole").value,
  };

  if (password) payload.password = password;

  const url = isEdit
    ? `${getApiUrl()}/staff/${encodeURIComponent(id)}`
    : `${getApiUrl()}/staff`;
  const method = isEdit ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (res.ok) {
      alert(isEdit ? "Staff account updated!" : "Staff account created!");
      closeStaffModal();
      loadStaff(token);
    } else {
      alert(`Error: ${result.message || "Failed to save staff account."}`);
    }
  } catch (err) {
    alert("Network error saving staff account.");
  }
}

/**
 * Deletes a staff member
 */
async function deleteStaff(id) {
  const auth = checkAdminAuth("super_admin");
  if (!auth) return;

  // Prevent self-deletion if current user ID matches target ID
  if (auth.user && (auth.user.id === id || auth.user._id === id)) {
    alert("You cannot delete your own active administrator account.");
    return;
  }

  if (!confirm("Are you sure you want to delete this staff account?")) return;

  try {
    const res = await fetch(`${getApiUrl()}/staff/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${auth.token}` },
    });

    if (res.ok) {
      alert("Staff account deleted.");
      loadStaff(auth.token);
    } else {
      const result = await res.json();
      alert(`Delete failed: ${result.message || "Server error"}`);
    }
  } catch (err) {
    alert("Network error deleting staff account.");
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
