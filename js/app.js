/* Makhboz Marketplace — Shared Utilities */

const App = {
  // Auth state
  user: null,

  init() {
    const saved = localStorage.getItem('makhboz_user');
    if (saved) {
      try { this.user = JSON.parse(saved); } catch(e) { localStorage.removeItem('makhboz_user'); }
    }
    this.renderNav();
    this.updateCartBadge();
  },

  // Auth
  async login(phone, password) {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'login', phone, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل تسجيل الدخول');
    this.user = data.user;
    localStorage.setItem('makhboz_user', JSON.stringify(data.user));
    localStorage.setItem('makhboz_token', data.token);
    return data.user;
  },

  async register(userData) {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'register', ...userData })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'فشل التسجيل');
    this.user = data.user;
    localStorage.setItem('makhboz_user', JSON.stringify(data.user));
    localStorage.setItem('makhboz_token', data.token);
    return data.user;
  },

  logout() {
    this.user = null;
    localStorage.removeItem('makhboz_user');
    localStorage.removeItem('makhboz_token');
    window.location.href = '/';
  },

  getToken() {
    return localStorage.getItem('makhboz_token') || '';
  },

  authHeaders() {
    return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + this.getToken() };
  },

  // Cart (localStorage-based)
  getCart() {
    try { return JSON.parse(localStorage.getItem('makhboz_cart') || '[]'); } catch(e) { return []; }
  },

  addToCart(product, qty = 1) {
    const cart = this.getCart();
    const existing = cart.find(i => i.id === product.id);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ id: product.id, name: product.name, bakerName: product.bakerName, price: product.price, unit: product.unit, qty, emoji: product.emoji || '🍪' });
    }
    localStorage.setItem('makhboz_cart', JSON.stringify(cart));
    this.updateCartBadge();
    return cart;
  },

  updateCartQty(productId, qty) {
    let cart = this.getCart();
    if (qty <= 0) {
      cart = cart.filter(i => i.id !== productId);
    } else {
      const item = cart.find(i => i.id === productId);
      if (item) item.qty = qty;
    }
    localStorage.setItem('makhboz_cart', JSON.stringify(cart));
    this.updateCartBadge();
    return cart;
  },

  removeFromCart(productId) {
    return this.updateCartQty(productId, 0);
  },

  clearCart() {
    localStorage.removeItem('makhboz_cart');
    this.updateCartBadge();
  },

  getCartTotal() {
    return this.getCart().reduce((sum, i) => sum + (i.price * i.qty), 0);
  },

  getCartCount() {
    return this.getCart().reduce((sum, i) => sum + i.qty, 0);
  },

  updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
      const count = this.getCartCount();
      badge.textContent = count;
      badge.style.display = count > 0 ? 'inline' : 'none';
    }
  },

  // Navigation
  renderNav() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    const currentPath = window.location.pathname;
    const isActive = (path) => currentPath === path ? 'active' : '';

    let userLinks = '';
    if (this.user) {
      if (this.user.role === 'baker') {
        userLinks = `
          <a href="/pages/baker.html" class="${isActive('/pages/baker.html')}">👩‍🍳 <span class="nav-text">لوحة التحكم</span></a>
          <a href="/pages/orders.html" class="${isActive('/pages/orders.html')}">📋 <span class="nav-text">طلباتي</span></a>
        `;
      } else {
        userLinks = `
          <a href="/pages/orders.html" class="${isActive('/pages/orders.html')}">📋 <span class="nav-text">طلباتي</span></a>
        `;
      }
      userLinks += `<button onclick="App.logout()" title="خروج">🚪</button>`;
      userLinks += `<span class="nav-user">${this.user.name.split(' ')[0]}</span>`;
    } else {
      userLinks = `<a href="/pages/login.html" class="${isActive('/pages/login.html')}">دخول</a>`;
    }

    nav.innerHTML = `
      <div class="nav-inner">
        <a href="/" class="nav-brand">
          <img src="/logo.png" alt="مخبوز">
          <span>مخبوز</span>
        </a>
        <div class="nav-links">
          <a href="/" class="${isActive('/')}">🏠 <span class="nav-text">الرئيسية</span></a>
          <a href="/pages/cart.html" class="${isActive('/pages/cart.html')}">🛒 <span id="cart-badge" class="nav-cart-badge" style="display:none">0</span></a>
          ${userLinks}
        </div>
      </div>
    `;
    this.updateCartBadge();
  },

  // Utility
  formatPrice(price) {
    return new Intl.NumberFormat('ar-SD').format(price);
  },

  categoryEmoji(cat) {
    const map = { kaak: '🍪', petitfour: '🧁', biscuit: '🍘', manin: '🥮' };
    return map[cat] || '🍪';
  },

  categoryName(cat) {
    const map = { kaak: 'كعك', petitfour: 'بيتفور', biscuit: 'بسكويت', manin: 'منين' };
    return map[cat] || cat;
  },

  areaName(area) {
    const map = { bahri: 'بحري', omdurman: 'أم درمان', khartoum: 'الخرطوم', 'khartoum-north': 'الخرطوم شمال', other: 'أخرى' };
    return map[area] || area;
  },

  statusName(s) {
    const map = { pending: 'قيد الانتظار', confirmed: 'مؤكد', preparing: 'قيد التحضير', delivering: 'قيد التوصيل', delivered: 'تم التوصيل', cancelled: 'ملغي' };
    return map[s] || s;
  },

  timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `منذ ${hrs} ساعة`;
    const days = Math.floor(hrs / 24);
    return `منذ ${days} يوم`;
  },

  showAlert(container, msg, type = 'error') {
    const el = document.createElement('div');
    el.className = `alert alert-${type}`;
    el.textContent = msg;
    container.prepend(el);
    setTimeout(() => el.remove(), 5000);
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
