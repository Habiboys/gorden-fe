# 🚀 Backend Testing - Quick Start

## ⚡ **LANGKAH CEPAT (30 detik)**

### **Kunjungi halaman ini di browser:**

```
/auto-test
```

Halaman akan **otomatis**:
- ✅ Test semua endpoint backend
- ✅ Seed database dengan sample data
- ✅ Tampilkan hasil real-time
- ✅ Beri diagnosis jika ada masalah

---

## 📋 **Apa yang Akan Terjadi:**

### ✅ **Jika Sukses (Semua Hijau):**

```
✅ Health Check - PASSED
✅ Seed Database - PASSED
✅ Get Products - PASSED (12 products)
✅ Get Categories - PASSED (5 categories)
✅ Create Product - PASSED

🎉 All Tests Passed!
Backend is working perfectly.
```

**Artinya:**
- Backend sudah tersambung 100%
- Database sudah terisi sample data
- Siap untuk tambah produk di admin
- Calculator leads siap digunakan

---

### ❌ **Jika Gagal (Ada Merah):**

```
❌ Health Check - FAILED
Error: Failed to fetch
```

**Artinya:**
- Backend server belum running
- CORS issue
- API key salah
- Network problem

**Solusi ada di halaman test**

---

## 🎯 **Setelah Test Berhasil:**

### 1. **Test Admin Products:**

```
1. Buka: /admin/login
2. Password: admin123
3. Buka: /admin/products
4. Klik "Tambah Produk"
5. Isi form dan submit
6. ✅ Produk muncul di table
7. ✅ Produk tersimpan di database
```

### 2. **Test Calculator:**

```
1. Buka: /calculator
2. Isi nama & HP
3. Hitung estimasi gorden
4. Klik WhatsApp
5. ✅ Data tersimpan
6. Cek di /admin/calculator-leads
```

---

## 🔧 **Troubleshooting**

### Problem: "Backend tidak connect"

**Cek:**
1. Buka `/auto-test`
2. Lihat test mana yang merah
3. Baca error message
4. Follow solusi yang diberikan

### Problem: "Produk tidak muncul"

**Solusi:**
```javascript
// Paste di browser console:
fetch('https://kimgjhjeerslwmlcwydr.supabase.co/functions/v1/make-server-df4da301/products', {
  headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpbWdqaGplZXJzbHdtbGN3eWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MTE4OTcsImV4cCI6MjA4MDk4Nzg5N30.6dZHA42Yd0k8NZwmilith4SrFgHQvSAqRnwTBoqXtiw' }
}).then(r => r.json()).then(console.log);
```

---

## 📊 **Status Saat Ini:**

✅ **Backend Server:** Ready  
✅ **API Endpoints:** 8 modules  
✅ **Database:** KV Store ready  
✅ **Admin Products:** Connected  
⏳ **Calculator Page:** Need integration  
⏳ **Admin Leads:** Need integration  

---

## 🎬 **Demo Flow:**

1. **Test Backend:** `/auto-test` → All green ✅
2. **Seed Data:** Auto-seeded dengan 12 products
3. **Admin Login:** `/admin/login` → password: admin123
4. **View Products:** `/admin/products` → See 12 products
5. **Add Product:** Click "Tambah Produk" → Fill form → Submit
6. **Verify:** Product appears in table ✅
7. **Calculator:** `/calculator` → Fill form → Submit
8. **Check Leads:** `/admin/calculator-leads` → See lead ✅

---

## 📞 **Quick Links:**

- 🧪 **Auto Test:** `/auto-test`
- 🔧 **Manual Test:** `/test-backend`
- 📦 **Admin Products:** `/admin/products`
- 📊 **Calculator Leads:** `/admin/calculator-leads`
- 🧮 **Calculator:** `/calculator`

---

**Status:** 🟢 READY TO TEST  
**Last Updated:** Now  
**Next Step:** Kunjungi `/auto-test` sekarang!

