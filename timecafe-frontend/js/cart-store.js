// js/cart-store.js

const CartStore = {
  CART_KEY: "timecafe_cart",
  DELIVERY_FEE: 50.0, // Updated from 4.99 to 50.00 ETB

  getCart() {
    try {
      const raw = localStorage.getItem(this.CART_KEY);
      const cart = raw ? JSON.parse(raw) : [];
      return Array.isArray(cart)
        ? cart.map((item) => ({
            ...item,
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
          }))
        : [];
    } catch (e) {
      console.error("Error reading cart from localStorage", e);
      return [];
    }
  },

  saveCart(cart) {
    localStorage.setItem(this.CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
  },

  addItem(item) {
    const cart = this.getCart();
    const existingItemIndex = cart.findIndex((i) => i.id === item.id);

    const cleanPrice = Number(item.price) || 0;
    const cleanQty = Number(item.quantity) || 1;

    if (existingItemIndex > -1) {
      cart[existingItemIndex].quantity += cleanQty;
    } else {
      cart.push({
        id: String(item.id),
        name: String(item.name || "Item"),
        price: cleanPrice,
        image: item.image || "",
        quantity: cleanQty,
      });
    }
    this.saveCart(cart);
  },

  removeItem(itemId) {
    const cart = this.getCart();
    const updatedCart = cart.filter((item) => item.id !== itemId);
    this.saveCart(updatedCart);
  },

  updateQuantity(itemId, change) {
    const cart = this.getCart();
    const item = cart.find((i) => i.id === itemId);

    if (item) {
      item.quantity += change;
      if (item.quantity <= 0) {
        this.removeItem(itemId);
        return;
      }
      this.saveCart(cart);
    }
  },

  clearCart() {
    localStorage.removeItem(this.CART_KEY);
    window.dispatchEvent(new Event("cartUpdated"));
  },

  getTotals() {
    const cart = this.getCart();
    const subtotal = cart.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0,
    );
    const hasItems = cart.length > 0;
    const delivery = hasItems ? this.DELIVERY_FEE : 0;
    const total = subtotal + delivery;

    return {
      subtotal: subtotal.toFixed(2),
      delivery: delivery.toFixed(2),
      total: total.toFixed(2),
      itemCount: cart.reduce((count, item) => count + Number(item.quantity), 0),
      hasItems,
    };
  },
};

window.CartStore = CartStore;
console.log("✅ CartStore loaded successfully!");
