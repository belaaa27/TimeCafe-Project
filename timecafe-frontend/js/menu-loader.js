// js/menu-loader.js

// Map category names to default image fallback URLs
const CATEGORY_IMAGE_MAP = {
  breakfast:
    "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=200&auto=format&fit=crop&q=60",
  burgers:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&auto=format&fit=crop&q=60",
  pizza:
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop&q=60",
};

let allProducts = [];
let activeCategoryId = "all";
let showFullMenu = false;

function formatImageUrl(imagePath, fallbackUrl) {
  if (!imagePath) return fallbackUrl;
  if (imagePath.includes("flaticon.com")) return fallbackUrl;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
  // Uses global window.SERVER_BASE_URL set in api.js
  return `${window.SERVER_BASE_URL || "http://localhost:5000"}${cleanPath}`;
}

document.addEventListener("DOMContentLoaded", () => {
  loadCategories();
  loadProducts();

  const categoryContainer = document.getElementById("category-container");
  if (categoryContainer) {
    categoryContainer.addEventListener("click", (e) => {
      const categoryCard = e.target.closest("[data-id]");
      if (categoryCard) {
        const selectedId = categoryCard.getAttribute("data-id");
        setActiveCategory(selectedId);
        showFullMenu = true;
        filterAndRenderProducts();
      }
    });
  }

  const seeFullMenuBtn = document.getElementById("see-full-menu-btn");
  if (seeFullMenuBtn) {
    seeFullMenuBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showFullMenu = true;
      activeCategoryId = "all";
      setActiveCategory("all");
      filterAndRenderProducts();
      seeFullMenuBtn.classList.add("hidden");
    });
  }

  const productGrid = document.getElementById("product-grid");
  if (productGrid) {
    productGrid.addEventListener("click", (e) => {
      const cartBtn = e.target.closest(".add-to-cart-btn");
      if (cartBtn) {
        const id = cartBtn.getAttribute("data-id");
        const name = cartBtn.getAttribute("data-name");
        const price = cartBtn.getAttribute("data-price");
        const image = cartBtn.getAttribute("data-image");

        if (
          window.CartStore &&
          typeof window.CartStore.addItem === "function"
        ) {
          window.CartStore.addItem({ id, name, price, image });
        }
      }
    });
  }
});

// --- CATEGORIES LOADING ---
async function loadCategories() {
  try {
    // DIRECT FETCH using window.API_BASE_URL
    const response = await fetch(`${window.API_BASE_URL}/categories`);
    const json = await response.json();
    let categories = Array.isArray(json)
      ? json
      : json.data || json.categories || [];

    const container = document.getElementById("category-container");
    if (!container) return;
    container.innerHTML = "";

    const defaultCategoryFallback =
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=200&auto=format&fit=crop&q=60";

    categories = [{ id: "all", name: "All", image_url: "" }, ...categories];

    categories.forEach((category, index) => {
      let catName = "Category";
      let rawImage = "";
      let catId = String(index);

      if (typeof category === "string") {
        catName = category;
        catId = category;
        rawImage = CATEGORY_IMAGE_MAP[category.toLowerCase()] || "";
      } else if (category && typeof category === "object") {
        catName =
          category.name ||
          category.title ||
          category.category_name ||
          "Category";
        rawImage =
          category.image_url ||
          category.image ||
          category.icon ||
          CATEGORY_IMAGE_MAP[catName.toLowerCase()] ||
          "";
        catId = category.id !== undefined ? String(category.id) : String(index);
      }

      const isActive = catId === activeCategoryId;

      const categoryCard = `
        <div class="category-card flex-none w-32 sm:w-40 group cursor-pointer" data-id="${catId}">
            <div class="card-inner ${isActive ? "bg-primary shadow-lg shadow-primary/40" : "bg-white border border-gray-100 shadow-sm hover:shadow-md"} rounded-full p-4 flex flex-col items-center justify-center h-48 sm:h-56 card-3d relative overflow-hidden transition-colors">
                <div class="w-20 h-20 ${isActive ? "bg-white shadow-inner" : "bg-gray-50"} rounded-full flex items-center justify-center mb-4 p-2 inner-circle">
                    ${rawImage ? `<img src="${formatImageUrl(rawImage, defaultCategoryFallback)}" alt="${catName}" onerror="this.src='${defaultCategoryFallback}';" class="w-12 h-12 object-contain group-hover:scale-110 transition-transform">` : `<i class="fa-solid fa-utensils text-2xl ${isActive ? "text-primary" : "text-gray-400"}"></i>`}
                </div>
                <span class="cat-label ${isActive ? "text-white font-bold" : "text-dark font-semibold group-hover:text-primary"} text-lg transition-colors text-center">${catName}</span>
            </div>
        </div>
      `;
      container.innerHTML += categoryCard;
    });
  } catch (error) {
    console.error("Failed to load categories:", error);
  }
}

function setActiveCategory(selectedId) {
  activeCategoryId = String(selectedId);
  const cards = document.querySelectorAll(".category-card");

  cards.forEach((card) => {
    const cardId = card.getAttribute("data-id");
    const inner = card.querySelector(".card-inner");
    const innerCircle = card.querySelector(".inner-circle");
    const label = card.querySelector(".cat-label");
    const icon = card.querySelector("i");

    if (cardId === activeCategoryId) {
      inner.className =
        "card-inner bg-primary shadow-lg shadow-primary/40 rounded-full p-4 flex flex-col items-center justify-center h-48 sm:h-56 card-3d relative overflow-hidden transition-colors";
      innerCircle.className =
        "w-20 h-20 bg-white shadow-inner rounded-full flex items-center justify-center mb-4 p-2 inner-circle";
      label.className =
        "cat-label text-white font-bold text-lg transition-colors text-center";
      if (icon) icon.className = "fa-solid fa-utensils text-2xl text-primary";
    } else {
      inner.className =
        "card-inner bg-white border border-gray-100 shadow-sm hover:shadow-md rounded-full p-4 flex flex-col items-center justify-center h-48 sm:h-56 card-3d relative overflow-hidden transition-colors";
      innerCircle.className =
        "w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 p-2 inner-circle";
      label.className =
        "cat-label text-dark font-semibold group-hover:text-primary text-lg transition-colors text-center";
      if (icon) icon.className = "fa-solid fa-utensils text-2xl text-gray-400";
    }
  });
}

// --- PRODUCTS LOADING & FILTERING ---
async function loadProducts() {
  try {
    // DIRECT FETCH using window.API_BASE_URL
    const response = await fetch(`${window.API_BASE_URL}/foods`);
    const json = await response.json();
    allProducts = Array.isArray(json)
      ? json
      : json.data || json.foods || json.products || [];

    filterAndRenderProducts();
  } catch (error) {
    console.error("Failed to load products:", error);
  }
}

function filterAndRenderProducts() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  let itemsToDisplay = allProducts;
  if (activeCategoryId !== "all") {
    itemsToDisplay = allProducts.filter((product) => {
      const catId = String(
        product.category_id || product.categoryId || product.category || "",
      );
      const catName = String(
        product.category_name || product.category || "",
      ).toLowerCase();
      return (
        catId === activeCategoryId || catName === activeCategoryId.toLowerCase()
      );
    });
  }

  if (activeCategoryId === "all" && !showFullMenu) {
    const popularItems = itemsToDisplay.filter(
      (p) => p.is_popular || p.popular || parseFloat(p.rating || 5) >= 4.5,
    );
    itemsToDisplay =
      popularItems.length > 0
        ? popularItems.slice(0, 6)
        : itemsToDisplay.slice(0, 6);
  }

  grid.innerHTML = "";

  if (itemsToDisplay.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center text-gray-500">
        <i class="fa-solid fa-utensils text-4xl mb-3 text-gray-300"></i>
        <p class="text-lg font-medium">No menu items found in this category.</p>
      </div>
    `;
    return;
  }

  const defaultFoodFallback =
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80";

  itemsToDisplay.forEach((product, index) => {
    const prodName =
      product.name || product.title || product.food_name || "Delicious Item";
    const prodDesc =
      product.description || product.desc || "A freshly prepared meal.";
    const imageUrl = formatImageUrl(
      product.image_url || product.image || product.photo || "",
      defaultFoodFallback,
    );
    const price = parseFloat(product.price || product.cost || 0).toFixed(2);
    const prodId = product.id || product._id || index;
    const rating = product.rating || "4.8";

    grid.innerHTML += `
      <div class="bg-white rounded-3xl p-5 shadow-sm hover:shadow-xl transition-all duration-300 card-3d group flex flex-col">
          <div class="relative mb-4 h-48 flex items-center justify-center">
              <button class="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-primary shadow-sm z-10 transition-colors">
                  <i class="fa-regular fa-heart"></i>
              </button>
              <div class="w-40 h-40 rounded-full bg-orange-50 absolute -z-0 group-hover:scale-110 transition-transform duration-500"></div>
              <img src="${imageUrl}" alt="${prodName}" onerror="this.src='${defaultFoodFallback}';" class="w-44 h-44 object-cover rounded-full z-10 shadow-lg group-hover:rotate-6 transition-transform duration-500">
          </div>
          
          <div class="flex items-center space-x-1 text-secondary text-sm mb-2">
              <i class="fa-solid fa-star"></i>
              <span class="text-gray-600 font-medium">${rating}</span>
          </div>
          
          <h3 class="text-xl font-bold text-dark mb-1">${prodName}</h3>
          <p class="text-sm text-gray-500 mb-4 line-clamp-2">${prodDesc}</p>
          
          <div class="mt-auto flex justify-between items-center pt-4 border-t border-gray-100">
              <span class="text-xl font-bold text-dark">ETB ${price}</span>
              <button data-id="${prodId}" data-name="${prodName}" data-price="${price}" data-image="${imageUrl}" class="add-to-cart-btn w-10 h-10 bg-dark text-white rounded-full flex items-center justify-center hover:bg-primary transition-colors btn-3d shadow-md" title="Add to Cart">
                  <i class="fa-solid fa-plus"></i>
              </button>
          </div>
      </div>
    `;
  });
}
