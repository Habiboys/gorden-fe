# 🔗 Integration Guide - Frontend ke Backend

## ✅ Yang Sudah Tersambung

### 1. **Admin Products** 
✅ **CONNECTED** - Fully integrated dengan backend
- Tambah produk → Tersimpan ke database
- Edit produk → Update di database
- Hapus produk → Terhapus dari database
- List produk → Fetch dari database real-time

**File:** `/pages/admin/AdminProducts.tsx`

---

## 🔧 Yang Perlu Diintegrasikan

### 2. **Calculator Page** - PERLU INTEGRASI

**File yang perlu dimodifikasi:** `/pages/CalculatorPage.tsx`

**Langkah Integrasi:**

#### Step 1: Import API
Tambahkan di bagian atas file (setelah import lainnya):
```typescript
import { calculatorLeadsApi } from '../utils/api';
```

#### Step 2: Update `handleSendToWhatsApp` function

**Cari function ini (sekitar baris 485):**
```typescript
const handleSendToWhatsApp = () => {
  if (items.length === 0) {
    alert('Mohon tambahkan minimal 1 item terlebih dahulu');
    return;
  }
  
  const whatsappUrl = generateWhatsAppMessage();
  window.open(whatsappUrl, '_blank');
};
```

**Ganti dengan:**
```typescript
const handleSendToWhatsApp = async () => {
  if (items.length === 0) {
    alert('Mohon tambahkan minimal 1 item terlebih dahulu');
    return;
  }
  
  try {
    // Prepare calculation data
    const calculationData = {
      name: customerInfo?.name || 'Unknown',
      phone: customerInfo?.phone || '',
      email: customerInfo?.email || '',
      calculatorType: calculatorType === 'smokering' ? 'Smokering' : calculatorType === 'kupu-kupu' ? 'Kupu-kupu' : 'Blind',
      estimatedPrice: grandTotal,
      calculation: {
        product: {
          name: selectedProduct.name,
          price: selectedProduct.price,
          category: selectedProduct.category,
        },
        items: items.map(item => {
          const details = calculateItemDetails(item);
          return {
            kainGorden: {
              width: item.width,
              height: item.height,
              pricePerMeter: selectedProduct.price,
              area: details.fabricArea,
              subtotal: details.fabricCost,
            },
            relGorden: item.relGorden ? {
              name: item.relGorden.name,
              price: item.relGorden.price,
            } : null,
            tassel: item.tassel ? {
              name: item.tassel.name,
              price: item.tassel.price,
              quantity: item.tasselQuantity,
              subtotal: item.tassel.price * item.tasselQuantity,
            } : null,
            hook: item.hook ? {
              name: item.hook.name,
              price: item.hook.price,
              quantity: item.hookQuantity,
              subtotal: item.hook.price * item.hookQuantity,
            } : null,
            kainVitrase: item.kainVitrase ? {
              name: item.kainVitrase.name,
              price: item.kainVitrase.price,
              area: details.fabricArea,
              subtotal: item.kainVitrase.price * details.fabricArea,
            } : null,
            relVitrase: item.relVitrase ? {
              name: item.relVitrase.name,
              price: item.relVitrase.price,
            } : null,
            totalItem: details.totalItem,
          };
        }),
        grandTotal: grandTotal,
      },
    };

    // Save to backend
    await calculatorLeadsApi.submit(calculationData);
    console.log('✅ Calculator lead saved successfully');
    
    // Open WhatsApp
    const whatsappUrl = generateWhatsAppMessage();
    window.open(whatsappUrl, '_blank');
    
    // Show success message
    alert('Estimasi berhasil disimpan! Silakan lanjutkan ke WhatsApp.');
  } catch (error) {
    console.error('Error saving calculator lead:', error);
    // Still open WhatsApp even if save fails
    const whatsappUrl = generateWhatsAppMessage();
    window.open(whatsappUrl, '_blank');
    alert('Estimasi berhasil dibuat! (Note: Terjadi error saat menyimpan ke database)');
  }
};
```

---

### 3. **Admin Calculator Leads** - PERLU INTEGRASI

**File:** `/pages/admin/AdminCalculatorLeads.tsx`

**Langkah:**

#### Step 1: Import API
```typescript
import { calculatorLeadsApi } from '../../utils/api';
```

#### Step 2: Tambahkan state dan fetch data

**Tambahkan di awal function component:**
```typescript
const [leads, setLeads] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [statusFilter, setStatusFilter] = useState('all');

useEffect(() => {
  fetchLeads();
}, [statusFilter]);

const fetchLeads = async () => {
  try {
    setLoading(true);
    const params = statusFilter !== 'all' ? { status: statusFilter } : {};
    const response = await calculatorLeadsApi.getAll(params);
    setLeads(response.data);
  } catch (error) {
    console.error('Error fetching leads:', error);
  } finally {
    setLoading(false);
  }
};
```

#### Step 3: Update status handler

```typescript
const handleUpdateStatus = async (leadId: string, newStatus: string) => {
  try {
    await calculatorLeadsApi.updateStatus(leadId, newStatus);
    alert('Status berhasil diupdate!');
    fetchLeads(); // Refresh data
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Gagal update status!');
  }
};
```

#### Step 4: Delete handler

```typescript
const handleDeleteLead = async (leadId: string) => {
  if (confirm('Yakin ingin menghapus lead ini?')) {
    try {
      await calculatorLeadsApi.delete(leadId);
      alert('Lead berhasil dihapus!');
      fetchLeads(); // Refresh data
    } catch (error) {
      console.error('Error deleting lead:', error);
      alert('Gagal menghapus lead!');
    }
  }
};
```

#### Step 5: Update render

**Ganti mock data dengan real data:**
```typescript
{loading ? (
  <tr>
    <td colSpan={7} className="text-center py-4">
      <p className="text-gray-600">Loading...</p>
    </td>
  </tr>
) : (
  leads.map((lead) => (
    <tr key={lead.id}>
      {/* ... render lead data ... */}
    </tr>
  ))
)}
```

---

### 4. **Website Products Pages** - PERLU INTEGRASI

**Files:**
- `/pages/ProductsPage.tsx`
- `/pages/ProductDetailPage.tsx`

**ProductsPage.tsx Integration:**

```typescript
import { useState, useEffect } from 'react';
import { productsApi } from '../utils/api';

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = categoryFilter !== 'all' ? { category: categoryFilter } : {};
      const response = await productsApi.getAll(params);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

**ProductDetailPage.tsx Integration:**

```typescript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { productsApi } from '../utils/api';

function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productsApi.getById(id);
      setProduct(response.data);
      
      // Increment view count
      await productsApi.incrementView(id);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!product) return <div>Product not found</div>;

  // ... rest of component
}
```

---

### 5. **Admin Articles** - PERLU INTEGRASI

**File:** `/pages/admin/AdminArticles.tsx`

```typescript
import { useState, useEffect } from 'react';
import { articlesApi } from '../../utils/api';

// Similar pattern seperti AdminProducts
const [articles, setArticles] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchArticles();
}, []);

const fetchArticles = async () => {
  try {
    const response = await articlesApi.getAll();
    setArticles(response.data);
  } catch (error) {
    console.error('Error fetching articles:', error);
  } finally {
    setLoading(false);
  }
};

const handleCreateArticle = async (articleData) => {
  try {
    await articlesApi.create(articleData);
    alert('Artikel berhasil ditambahkan!');
    fetchArticles();
  } catch (error) {
    console.error('Error creating article:', error);
    alert('Gagal menambahkan artikel!');
  }
};
```

---

### 6. **Admin Referrals** - PERLU INTEGRASI

**File:** `/pages/admin/AdminReferrals.tsx`

```typescript
import { useState, useEffect } from 'react';
import { referralsApi } from '../../utils/api';

const [referrals, setReferrals] = useState([]);

useEffect(() => {
  fetchReferrals();
}, []);

const fetchReferrals = async () => {
  try {
    const response = await referralsApi.getAll();
    setReferrals(response.data);
  } catch (error) {
    console.error('Error fetching referrals:', error);
  }
};

const handleApproveCommission = async (referralId, customerId) => {
  try {
    await referralsApi.approve(referralId, customerId);
    alert('Komisi berhasil diapprove!');
    fetchReferrals();
  } catch (error) {
    console.error('Error approving commission:', error);
    alert('Gagal approve komisi!');
  }
};
```

---

### 7. **Website Referral Page** - PERLU INTEGRASI

**File:** `/pages/ReferralPage.tsx`

```typescript
import { useState } from 'react';
import { referralsApi } from '../utils/api';

const handleRegisterReferral = async (formData) => {
  try {
    const response = await referralsApi.register({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
    });
    
    // Show referral code to user
    alert(`Kode Referral Anda: ${response.data.code}`);
    
    // Maybe save to localStorage
    localStorage.setItem('referralCode', response.data.code);
  } catch (error) {
    console.error('Error registering referral:', error);
    alert('Gagal mendaftar referral!');
  }
};
```

---

## 📊 Priority Order

1. **✅ DONE:** Admin Products
2. **HIGH:** Calculator Page (submit leads)
3. **HIGH:** Admin Calculator Leads (view & manage)
4. **MEDIUM:** Website Products Pages
5. **MEDIUM:** Admin Articles
6. **LOW:** Admin Referrals
7. **LOW:** Website Referral Page

---

## 🧪 Testing

### First-time Setup: Seed Database

**Jalankan sekali saja untuk populate initial data:**

```bash
curl -X POST https://{projectId}.supabase.co/functions/v1/make-server-df4da301/seed \
  -H "Authorization: Bearer {publicAnonKey}" \
  -H "Content-Type: application/json"
```

Atau via browser console:
```javascript
fetch('https://{projectId}.supabase.co/functions/v1/make-server-df4da301/seed', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer {publicAnonKey}',
    'Content-Type': 'application/json'
  }
}).then(r => r.json()).then(console.log);
```

### Verify Data

```javascript
// Check products
fetch('https://{projectId}.supabase.co/functions/v1/make-server-df4da301/products', {
  headers: {
    'Authorization': 'Bearer {publicAnonKey}'
  }
}).then(r => r.json()).then(console.log);

// Check categories  
fetch('https://{projectId}.supabase.co/functions/v1/make-server-df4da301/categories', {
  headers: {
    'Authorization': 'Bearer {publicAnonKey}'
  }
}).then(r => r.json()).then(console.log);
```

---

## 🎯 Quick Reference

### API Import
```typescript
import { 
  productsApi,
  categoriesApi,
  articlesApi,
  calculatorLeadsApi,
  documentsApi,
  referralsApi,
  ordersApi,
  dashboardApi
} from '../utils/api'; // or '../../utils/api' depending on path
```

### Common Patterns

**Fetch Data:**
```typescript
const response = await productsApi.getAll();
setData(response.data);
```

**Create:**
```typescript
await productsApi.create(formData);
```

**Update:**
```typescript
await productsApi.update(id, formData);
```

**Delete:**
```typescript
await productsApi.delete(id);
```

**With Error Handling:**
```typescript
try {
  const response = await productsApi.getAll();
  setProducts(response.data);
} catch (error) {
  console.error('Error:', error);
  alert('Terjadi kesalahan!');
}
```

---

Made with ❤️ for Amagriya Gorden
