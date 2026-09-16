// admin/js/admin-products.js

/**
 * TimeCafé OS - Admin Products & Categories Controller
 */

let productsCache = [];

document.addEventListener("DOMContentLoaded", async () => {
  const auth = checkAdminAuth();
  if (!auth) return;

  setupDropZone();
  populateCategoryDropdown();
  loadProducts(auth.token);

  const form = document.getElementById("productForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      saveProduct(auth.token);
    });
  }
});

function getApiUrl() {
  return window.API_BASE_URL || "http://localhost:5000/api";
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

/**
 * Dynamically fetches categories from backend and merges them with defaults
 */
async function populateCategoryDropdown() {
  const selectEl = document.getElementById("productCategory");
  if (!selectEl) return;

  const defaultCategories = [
    "Hot Coffee",
    "Cold Drinks",
    "Breakfast",
    "Fast Food",
    "Desserts",
    "Traditional",
  ];

  try {
    const res = await fetch(`${getApiUrl()}/categories`);
    const result = await res.json();

    let dbCategories = [];
    if (res.ok) {
      const data = result.data || (Array.isArray(result) ? result : []);
      dbCategories = data.map((cat) =>
        typeof cat === "object" ? cat.name || cat.category : cat,
      );
    }

    const mergedCategories = Array.from(
      new Set([...defaultCategories, ...dbCategories.filter(Boolean)]),
    );

    const options = mergedCategories
      .map(
        (cat) =>
          `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`,
      )
      .join("");

    selectEl.innerHTML =
      `<option value="" disabled selected>Select Category</option>` + options;
  } catch (err) {
    console.warn("Could not fetch database categories, using defaults.", err);
  }
}

/**
 * Resolves relative database paths (/uploads/...) to full backend URLs
 */
function getImageUrl(imagePath) {
  if (!imagePath) return "https://placehold.co/100x100?text=No+Image";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const serverOrigin = getApiUrl().replace(/\/api\/?$/, "");
  return `${serverOrigin}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}

function validateFile(file) {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    alert("Invalid file format. Please select a JPG, PNG, WEBP, or GIF image.");
    return false;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    alert(`File is too large (${sizeInMB} MB). Maximum allowed size is 5 MB.`);
    return false;
  }

  return true;
}

function renderPreview(source) {
  const previewImg = document.getElementById("imagePreview");
  const prompt = document.getElementById("dropZonePrompt");
  if (!previewImg) return;

  if (source instanceof File) {
    previewImg.src = URL.createObjectURL(source);
    previewImg.classList.remove("hidden");
    if (prompt) prompt.classList.add("hidden");
  } else if (typeof source === "string" && source.trim() !== "") {
    previewImg.src = source;
    previewImg.classList.remove("hidden");
    if (prompt) prompt.classList.add("hidden");
  } else {
    previewImg.src = "";
    previewImg.classList.add("hidden");
    if (prompt) prompt.classList.remove("hidden");
  }
}

function setupDropZone() {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("productImageFile");
  const urlInput = document.getElementById("productImageUrl");
  if (!dropZone || !fileInput) return;

  dropZone.addEventListener("click", (e) => {
    if (e.target.tagName !== "INPUT") fileInput.click();
  });

  ["dragover", "dragenter"].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      dropZone.classList.add("border-adminAccent", "bg-blue-50/50");
    });
  });

  ["dragleave", "dragend"].forEach((eventName) => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.remove("border-adminAccent", "bg-blue-50/50");
    });
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("border-adminAccent", "bg-blue-50/50");

    if (e.dataTransfer.files.length) {
      const file = e.dataTransfer.files[0];

      if (!validateFile(file)) {
        resetDropZone();
        return;
      }

      fileInput.files = e.dataTransfer.files;
      if (urlInput) urlInput.value = "";
      renderPreview(file);
    }
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) {
      const file = fileInput.files[0];

      if (!validateFile(file)) {
        resetDropZone();
        return;
      }

      if (urlInput) urlInput.value = "";
      renderPreview(file);
    }
  });

  if (urlInput) {
    urlInput.addEventListener("input", () => {
      if (urlInput.value.trim() !== "") {
        if (fileInput) fileInput.value = "";
        renderPreview(urlInput.value.trim());
      } else {
        renderPreview(null);
      }
    });
  }
}

function resetDropZone() {
  const fileInput = document.getElementById("productImageFile");
  const urlInput = document.getElementById("productImageUrl");

  if (fileInput) fileInput.value = "";
  if (urlInput) urlInput.value = "";
  renderPreview(null);
}

async function loadProducts(token) {
  const tbody = document.getElementById("adminProductsBody");
  if (!tbody) return;

  try {
    const res = await fetch(`${getApiUrl()}/foods?limit=100`);
    const result = await res.json();

    if (!res.ok)
      throw new Error(result.message || "Failed to load menu items.");

    productsCache =
      result.data || result.products || (Array.isArray(result) ? result : []);

    if (productsCache.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="6" class="py-10 text-center text-slate-400 font-medium">No menu items found.</td></tr>';
      return;
    }

    tbody.innerHTML = productsCache
      .map((prod) => {
        const isAvailable = prod.is_available !== false;
        const statusBadge = isAvailable
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-rose-50 text-rose-700 border-rose-200";

        const fullImageUrl = getImageUrl(prod.image_url);
        const prodId = escapeHtml(String(prod.id));

        return `
          <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="py-3 px-4 sm:px-6">
              <div class="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 shadow-sm bg-slate-100 flex items-center justify-center">
                <img 
                  src="${fullImageUrl}" 
                  alt="${escapeHtml(prod.name)}" 
                  class="w-full h-full object-cover"
                  onerror="this.onerror=null;this.src='https://placehold.co/100x100?text=No+Image';"
                >
              </div>
            </td>
            <td class="py-3 px-4 sm:px-6 font-semibold text-slate-900">${escapeHtml(prod.name)}</td>
            <td class="py-3 px-4 sm:px-6 text-slate-600">${escapeHtml(prod.category || "General")}</td>
            <td class="py-3 px-4 sm:px-6 font-semibold text-slate-900">Br ${Number(prod.price).toFixed(2)}</td>
            <td class="py-3 px-4 sm:px-6">
              <span class="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full border ${statusBadge}">
                ${isAvailable ? "Available" : "Out of Stock"}
              </span>
            </td>
            <td class="py-3 px-4 sm:px-6 text-right space-x-1">
              <button 
                onclick="triggerEditProduct('${prodId}')" 
                class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition"
              >
                Edit
              </button>
              <button 
                onclick="deleteProduct('${prodId}')" 
                class="superadmin-only px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg border border-rose-200 transition"
              >
                Delete
              </button>
            </td>
          </tr>
        `;
      })
      .join("");

    const auth = checkAdminAuth("admin");
    if (auth && auth.role !== "super_admin") {
      document
        .querySelectorAll(".superadmin-only")
        .forEach((el) => el.classList.add("hidden"));
    }
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-8 text-center text-rose-500 font-medium">
          <i class="fa-solid fa-circle-exclamation mr-1"></i> Error loading menu items: ${escapeHtml(err.message)}
        </td>
      </tr>`;
  }
}

function triggerEditProduct(prodId) {
  const prod = productsCache.find((p) => String(p.id) === String(prodId));
  if (prod) openProductModal(prod);
}

function openProductModal(prod = null) {
  const modal = document.getElementById("productModal");
  if (!modal) return;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  resetDropZone();

  if (prod) {
    document.getElementById("modalTitle").innerText = "Edit Product";
    document.getElementById("productId").value = prod.id;
    document.getElementById("productName").value = prod.name || "";
    document.getElementById("productCategory").value = prod.category || "";
    document.getElementById("productPrice").value = prod.price || "";
    document.getElementById("productImageUrl").value = prod.image_url || "";
    document.getElementById("productDescription").value =
      prod.description || "";
    document.getElementById("productAvailable").checked =
      prod.is_available !== false;

    if (prod.image_url) {
      renderPreview(getImageUrl(prod.image_url));
    }
  } else {
    document.getElementById("modalTitle").innerText = "Add New Product";
    document.getElementById("productId").value = "";
    document.getElementById("productForm").reset();
    document.getElementById("productAvailable").checked = true;
  }
}

function closeProductModal() {
  const modal = document.getElementById("productModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

async function saveProduct(token) {
  const id = document.getElementById("productId").value;
  const isEdit = Boolean(id);

  const fileInput = document.getElementById("productImageFile");
  const imageUrlInput = document.getElementById("productImageUrl");

  const formData = new FormData();
  formData.append("name", document.getElementById("productName").value);
  formData.append("category", document.getElementById("productCategory").value);
  formData.append("price", document.getElementById("productPrice").value);
  formData.append(
    "description",
    document.getElementById("productDescription").value,
  );
  formData.append(
    "is_available",
    document.getElementById("productAvailable").checked,
  );

  if (fileInput && fileInput.files[0]) {
    formData.append("image", fileInput.files[0]);
  } else if (imageUrlInput && imageUrlInput.value) {
    formData.append("image_url", imageUrlInput.value);
  }

  const url = isEdit
    ? `${getApiUrl()}/foods/${encodeURIComponent(id)}`
    : `${getApiUrl()}/foods`;
  const method = isEdit ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await res.json();

    if (res.ok) {
      closeProductModal();
      loadProducts(token);
    } else {
      alert(`Error: ${result.message || "Failed to save product."}`);
    }
  } catch (err) {
    console.error("Save error:", err);
    alert("Failed to save product due to a network error.");
  }
}

async function deleteProduct(id) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  const auth = checkAdminAuth();
  const token = auth ? auth.token : localStorage.getItem("timecafe_token");

  try {
    const res = await fetch(`${getApiUrl()}/foods/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      loadProducts(token);
    } else {
      const result = await res.json();
      alert(`Delete failed: ${result.message || "Server error"}`);
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("Network error deleting product.");
  }
}

/**
 * Renames a category across all existing products in the database
 */
async function renameCategory(oldName) {
  if (!oldName) {
    alert("Please select a category to rename.");
    return;
  }

  const newName = prompt(`Enter new name for category "${oldName}":`);
  if (!newName || newName.trim() === "" || newName.trim() === oldName) return;

  const auth = checkAdminAuth();
  const token = auth ? auth.token : localStorage.getItem("timecafe_token");

  try {
    const res = await fetch(`${getApiUrl()}/categories/rename`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ oldName, newName: newName.trim() }),
    });

    const result = await res.json();

    if (res.ok) {
      alert(result.message || "Category renamed successfully.");
      await populateCategoryDropdown();
      loadProducts(token);
    } else {
      alert(`Error: ${result.message || "Failed to rename category."}`);
    }
  } catch (err) {
    console.error("Rename error:", err);
    alert("Network error renaming category.");
  }
}

/**
 * Deletes a category and reassigns its products to 'General'
 */
async function deleteCategory(categoryName) {
  if (!categoryName) {
    alert("Please select a category to delete.");
    return;
  }

  if (
    !confirm(
      `Are you sure you want to delete category "${categoryName}"? All products in this category will be reassigned to "General".`,
    )
  ) {
    return;
  }

  const auth = checkAdminAuth();
  const token = auth ? auth.token : localStorage.getItem("timecafe_token");

  try {
    const res = await fetch(
      `${getApiUrl()}/categories/${encodeURIComponent(categoryName)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const result = await res.json();

    if (res.ok) {
      alert(result.message || "Category deleted successfully.");
      await populateCategoryDropdown();
      loadProducts(token);
    } else {
      alert(`Error: ${result.message || "Failed to delete category."}`);
    }
  } catch (err) {
    console.error("Delete category error:", err);
    alert("Network error deleting category.");
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
