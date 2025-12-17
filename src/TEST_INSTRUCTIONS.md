# 🧪 Testing Backend Connection - Amagriya Gorden

## ⚡ Quick Test (Automated)

**Cara tercepat untuk test backend:**

1. **Buka browser dan kunjungi:**
   ```
   /auto-test
   ```

2. **Halaman akan otomatis:**
   - ✅ Test koneksi backend
   - ✅ Seed database dengan sample data
   - ✅ Test semua API endpoints
   - ✅ Tampilkan hasil real-time
   - ✅ Diagnosa masalah jika ada

3. **Jika semua test HIJAU (✅):**
   - Backend sudah siap!
   - Klik "Go to Admin Products" untuk mulai menambah produk
   - Produk yang ditambahkan akan tersimpan di database

4. **Jika ada test MERAH (❌):**
   - Lihat error message di detail
   - Check console browser (F12)
   - Kemungkinan masalah:
     - Edge Function belum deploy
     - CORS issue
     - API key salah

---

## 🔍 Manual Test (Advanced)

### Opsi 1: Via Browser Console

Buka Console (F12 → Console), lalu copy-paste:

```javascript
// Test 1: Health Check
fetch('https://kimgjhjeerslwmlcwydr.supabase.co/functions/v1/make-server-df4da301/health', {
  headers: { 
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpbWdqaGplZXJzbHdtbGN3eWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTE4OTcsImV4cCI6MjA4MDk4Nzg5N30.6dZHA42Yd0k8NZwmilith4SrFgHQvSAqRnwTBoqXtiw' 
  }
})
.then(r => r.json())
.then(data => console.log('✅ Health:', data))
.catch(err => console.error('❌ Error:', err));
```

**Expected Result:**
```json
{ "status": "ok" }
```

---

### Opsi 2: Seed Database

```javascript
// Test 2: Seed Database (Run ONCE)
fetch('https://kimgjhjeerslwmlcwydr.supabase.co/functions/v1/make-server-df4da301/seed', {
  method: 'POST',
  headers: { 
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpbWdqaGplZXJzbHdtbGN3eWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTE4OTcsImV4cCI6MjA4MDk4Nzg5N30.6dZHA42Yd0k8NZwmilith4SrFgHQvSAqRnwTBoqXtiw',
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('✅ Seeded:', data))
.catch(err => console.error('❌ Error:', err));
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Database seeded successfully",
  "counts": {
    "products": 12,
    "categories": 5,
    "articles": 3
  }
}
```

---

### Opsi 3: Get Products

```javascript
// Test 3: Get Products
fetch('https://kimgjhjeerslwmlcwydr.supabase.co/functions/v1/make-server-df4da301/products', {
  headers: { 
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpbWdqaGplZXJzbHdtbGN3eWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTE4OTcsImV4cCI6MjA4MDk4Nzg5N30.6dZHA42Yd0k8NZwmilith4SrFgHQvSAqRnwTBoqXtiw' 
  }
})
.then(r => r.json())
.then(data => {
  console.log('✅ Products:', data);
  console.log(`📦 Found ${data.data.length} products`);
})
.catch(err => console.error('❌ Error:', err));
```

**Expected Result:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod-...",
      "name": "Product name",
      "price": 150000,
      ...
    }
  ]
}
```

---

### Opsi 4: Create Product

```javascript
// Test 4: Create Product
fetch('https://kimgjhjeerslwmlcwydr.supabase.co/functions/v1/make-server-df4da301/products', {
  method: 'POST',
  headers: { 
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpbWdqaGplZXJzbHdtbGN3eWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTE4OTcsImV4cCI6MjA4MDk4Nzg5N30.6dZHA42Yd0k8NZwmilith4SrFgHQvSAqRnwTBoqXtiw',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Test Product Manual',
    sku: 'TEST-MANUAL-001',
    category: 'Gorden Custom',
    price: 299000,
    stock: 20,
    description: 'This is a manually created test product'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Created:', data);
  console.log(`🆕 New product ID: ${data.data.id}`);
})
.catch(err => console.error('❌ Error:', err));
```

---

## 📊 Test via Admin Panel

### 1. Login to Admin

```
URL: /admin/login
Password: admin123
```

### 2. Go to Products Page

```
URL: /admin/products
```

**What should happen:**
- Page loads
- Console shows: "🔄 Fetching products from backend..."
- Console shows: "✅ Products fetched: { success: true, data: [...] }"
- Products appear in table

**If you see errors:**
- Check console for error messages
- Error akan dimunculkan dengan alert
- Check Network tab (F12) untuk melihat HTTP requests

### 3. Add New Product

1. Click "Tambah Produk"
2. Fill in the form:
   - Nama Produk: "Test Gorden Baru"
   - SKU: "TEST-001"
   - Kategori: "Gorden Custom"
   - Harga: 250000
3. Click "Tambah Produk"

**What should happen:**
- Console shows: Creating product with data...
- Alert: "Produk berhasil ditambahkan!"
- Product appears in the table
- **Backend should have the product saved**

---

## 🐛 Common Issues & Solutions

### Issue 1: "Failed to fetch" or Network Error

**Cause:** Backend server not running or CORS issue

**Solution:**
- Check if Supabase Edge Function is deployed
- Verify project ID in `/utils/supabase/info.tsx`
- Check browser console for CORS errors

---

### Issue 2: "Unauthorized" or 401 Error

**Cause:** API key invalid or expired

**Solution:**
- Verify `publicAnonKey` in `/utils/supabase/info.tsx`
- Make sure it matches your Supabase project

---

### Issue 3: Empty product list after seeding

**Cause:** Seed ran but data not returned properly

**Solution:**
```javascript
// Manually check KV store
fetch('https://kimgjhjeerslwmlcwydr.supabase.co/functions/v1/make-server-df4da301/products')
  .then(r => r.json())
  .then(console.log);
```

---

### Issue 4: Products not showing in admin

**Cause:** Frontend not fetching data properly

**Solution:**
- Open `/admin/products`
- Check browser console
- Look for error messages
- Verify `productsApi.getProducts()` is called

---

## ✅ Success Checklist

- [ ] `/auto-test` shows all tests passing (green ✅)
- [ ] Can see products in `/admin/products`
- [ ] Can add new product via admin panel
- [ ] New product appears in table immediately
- [ ] Can refresh page and product is still there (persisted)
- [ ] Console shows no errors

---

## 🎯 Next Steps After Backend is Working

Once all tests pass:

1. **Remove test routes** (optional):
   - Delete `/test-backend` route from App.tsx
   - Delete `/auto-test` route from App.tsx
   - Delete test files if desired

2. **Integrate Calculator Page**:
   - Follow `INTEGRATION_GUIDE.md`
   - Add calculator lead submission

3. **Integrate other admin pages**:
   - Calculator Leads
   - Articles
   - Referrals

4. **Connect website pages**:
   - Products listing page
   - Product detail page
   - Articles page

---

## 📞 Quick Reference

**Backend URL:**
```
https://kimgjhjeerslwmlcwydr.supabase.co/functions/v1/make-server-df4da301
```

**Endpoints:**
- `GET /health` - Health check
- `POST /seed` - Seed database
- `GET /products` - Get all products
- `POST /products` - Create product
- `GET /categories` - Get categories
- `POST /calculator-leads` - Submit calculator lead

**Test Pages:**
- `/auto-test` - Automated test suite (recommended)
- `/test-backend` - Manual test panel
- `/admin/products` - Admin products page

---

Made with ❤️ for Amagriya Gorden
