# حل مشكلة لوحة تحكم الخباز

## المشكلة الحالية:
لوحة التحكم `/dashboard.html` مصممة للمشرفين وليس للخبازين، وتسبب خطأ عند محاولة الوصول لها.

## الحل المقترح:

### 1. إنشاء لوحة تحكم خاصة بالخبازين

```html
<!-- pages/baker-dashboard.html -->
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>لوحة التحكم - مخبوز</title>
<link rel="icon" type="image/png" href="/logo.png">
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
</head>
<body>
<nav class="navbar" id="main-nav"></nav>

<main>
<div class="container">
  <h1>لوحة التحكم</h1>
  
  <div class="dashboard-grid">
    <div class="card">
      <h3>منتجاتي</h3>
      <button class="btn btn-primary" onclick="window.location.href='/pages/product.html'">إضافة منتج جديد</button>
      <div id="my-products"></div>
    </div>
    
    <div class="card">
      <h3>طلباتي</h3>
      <div id="my-orders"></div>
    </div>
    
    <div class="card">
      <h3>إحصائيات</h3>
      <div id="stats"></div>
    </div>
  </div>
</div>
</main>

<script src="/js/app.js"></script>
<script>
// التحقق من أن المستخدم خباز
if (!App.user || App.user.role !== 'baker') {
  window.location.href = '/pages/login.html?redirect=' + encodeURIComponent(window.location.href);
}

// تحميل بيانات الخباز
async function loadBakerData() {
  try {
    const response = await fetch('/api/products?baker=' + App.user.id, {
      headers: App.authHeaders()
    });
    const products = await response.json();
    
    document.getElementById('my-products').innerHTML = products.length + ' منتج';
    
    // تحميل الطلبات
    const ordersResponse = await fetch('/api/orders?baker=' + App.user.id, {
      headers: App.authHeaders()
    });
    const orders = await ordersResponse.json();
    
    document.getElementById('my-orders').innerHTML = orders.length + ' طلب';
    
  } catch (error) {
    console.error('Error loading baker data:', error);
  }
}

loadBakerData();
</script>
</body>
</html>
```

### 2. تعديل الـ Navigation

```javascript
// في js/app.js - تعديل دالة renderNav
renderNav() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  
  let navHTML = '<div class="container">';
  
  if (this.user) {
    navHTML += `
      <a href="/" class="nav-link">الرئيسية</a>
      <a href="/pages/cart.html" class="nav-link">السلة (${this.getCart().length})</a>
      <a href="/pages/orders.html" class="nav-link">طلباتي</a>
    `;
    
    // إضافة رابط لوحة التحكم للخبازين
    if (this.user.role === 'baker') {
      navHTML += '<a href="/pages/baker-dashboard.html" class="nav-link">لوحة التحكم</a>';
    }
    
    navHTML += `
      <span class="nav-user">${this.user.name}</span>
      <button onclick="App.logout()" class="btn btn-secondary">خروج</button>
    `;
  } else {
    navHTML += `
      <a href="/" class="nav-link">الرئيسية</a>
      <a href="/pages/login.html" class="btn btn-primary">دخول</a>
    `;
  }
  
  navHTML += '</div>';
  nav.innerHTML = navHTML;
}
```

### 3. حماية لوحة تحكم المشرفين

```javascript
// في dashboard.html - إضافة مصادقة
<script>
// التحقق من أن المستخدم مشرف
if (!App.user || App.user.role !== 'admin') {
  window.location.href = '/pages/login.html';
}
</script>
```

### 4. إضافة دور المشرف في النظام

```typescript
// في netlify/functions/auth.mts - تعديل دالة register
if (!['customer', 'baker', 'driver', 'admin'].includes(role)) {
  return Response.json({ error: 'نوع حساب غير صحيح' }, { status: 400 })
}
```

## الخطوات المطلوبة:

1. ✅ إنشاء صفحة لوحة تحكم خاصة بالخبازين
2. ✅ تعديل الـ Navigation لإضافة رابط لوحة التحكم للخبازين
3. ✅ حماية لوحة تحكم المشرفين
4. ✅ إضافة دور المشرف في نظام المصادقة
5. ✅ اختبار الوصول للوحة التحكم حسب نوع المستخدم

## الحل السريع:

حالياً يمكنك:
- تعديل `dashboard.html` لتكون متاحة للخبازين
- أو إنشاء صفحة جديدة خاصة بالخبازين
- إضافة تحقق من دور المستخدم قبل عرض لوحة التحكم
