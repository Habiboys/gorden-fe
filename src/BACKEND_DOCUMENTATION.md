# 🚀 Amagriya Gorden - Backend Documentation

## 📋 Overview

Backend Amagriya Gorden menggunakan **Supabase Edge Functions** dengan **Hono** framework untuk REST API. Data disimpan menggunakan **KV Store** (Key-Value Store) yang sudah terintegrasi dengan Supabase.

## 🏗️ Architecture

```
Frontend (React) → Supabase Edge Functions → KV Store (Database)
```

### Base URL
```
https://{projectId}.supabase.co/functions/v1/make-server-df4da301
```

### Authentication
Semua request memerlukan header:
```
Authorization: Bearer {publicAnonKey}
Content-Type: application/json
```

---

## 📚 API Endpoints

### 🔍 Health Check
```
GET /health
```
Cek status server.

**Response:**
```json
{
  "status": "ok"
}
```

---

### 🛍️ Products API

#### Get All Products
```
GET /products?category={category}&featured={boolean}&limit={number}
```

**Query Parameters:**
- `category` (optional): Filter by category ID
- `featured` (optional): true/false
- `limit` (optional): Limit results

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod-1",
      "name": "Gorden Blackout Premium",
      "slug": "gorden-blackout-premium",
      "description": "...",
      "price": 223200,
      "comparePrice": 280000,
      "category": "cat-2",
      "images": ["..."],
      "featured": true,
      "inStock": true,
      "stock": 50,
      "sku": "GRD-BLK-001",
      "specifications": {},
      "colors": [],
      "sizes": [],
      "tags": [],
      "views": 245,
      "sales": 28,
      "rating": 4.8,
      "reviewCount": 15,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

#### Get Product by ID
```
GET /products/{id}
```

#### Create Product (Admin)
```
POST /products
```

**Body:**
```json
{
  "name": "Gorden Name",
  "description": "...",
  "price": 150000,
  "comparePrice": 200000,
  "category": "cat-1",
  "images": ["url1", "url2"],
  "featured": true,
  "inStock": true,
  "stock": 100,
  "specifications": {},
  "colors": ["Putih", "Hitam"],
  "sizes": ["Custom"],
  "tags": ["minimalis", "modern"]
}
```

#### Update Product (Admin)
```
PUT /products/{id}
```

#### Delete Product (Admin)
```
DELETE /products/{id}
```

#### Increment View Count
```
POST /products/{id}/view
```

---

### 🗂️ Categories API

#### Get All Categories
```
GET /categories
```

#### Get Category by ID
```
GET /categories/{id}
```

#### Create Category (Admin)
```
POST /categories
```

**Body:**
```json
{
  "name": "Gorden Minimalis",
  "description": "...",
  "image": "url",
  "icon": "layout"
}
```

#### Update Category (Admin)
```
PUT /categories/{id}
```

#### Delete Category (Admin)
```
DELETE /categories/{id}
```

---

### 📰 Articles API

#### Get All Articles
```
GET /articles?category={category}&featured={boolean}&limit={number}&search={query}
```

**Query Parameters:**
- `category` (optional): Filter by category (tips, inspiration, guide, trend)
- `featured` (optional): true/false
- `limit` (optional): Limit results
- `search` (optional): Search in title and excerpt

#### Get Article by Slug
```
GET /articles/{slug}
```

#### Create Article (Admin)
```
POST /articles
```

**Body:**
```json
{
  "title": "Article Title",
  "slug": "article-title",
  "excerpt": "Short description",
  "content": "<p>Full HTML content</p>",
  "category": "tips",
  "categoryLabel": "Tips & Trik",
  "author": "Admin Amagriya",
  "readTime": "5 menit",
  "image": "url",
  "featured": true,
  "status": "published",
  "tags": ["tag1", "tag2"]
}
```

#### Update Article (Admin)
```
PUT /articles/{id}
```

#### Delete Article (Admin)
```
DELETE /articles/{id}
```

#### Increment View Count
```
POST /articles/{id}/view
```

---

### 📊 Calculator Leads API

#### Get All Leads (Admin)
```
GET /calculator-leads?status={status}&type={type}
```

**Query Parameters:**
- `status` (optional): new, contacted, converted, closed
- `type` (optional): Smokering, Kupu-kupu, Blind

#### Get Lead by ID
```
GET /calculator-leads/{id}
```

#### Submit Calculator Lead (Website)
```
POST /calculator-leads
```

**Body:**
```json
{
  "name": "Customer Name",
  "phone": "081234567890",
  "email": "customer@email.com",
  "calculatorType": "Smokering",
  "estimatedPrice": 2856000,
  "calculation": {
    "product": {
      "name": "...",
      "sku": "...",
      "category": "..."
    },
    "dimensions": {
      "width": 3,
      "height": 2.5,
      "area": 7.5
    },
    "components": [...],
    "installation": {...},
    "notes": "..."
  }
}
```

#### Update Lead Status (Admin)
```
PUT /calculator-leads/{id}/status
```

**Body:**
```json
{
  "status": "contacted"
}
```

#### Delete Lead (Admin)
```
DELETE /calculator-leads/{id}
```

---

### 📄 Documents API

#### Get All Documents (Admin)
```
GET /documents?type={type}&status={status}
```

**Query Parameters:**
- `type` (optional): quotation, invoice
- `status` (optional): draft, sent

#### Get Document by ID
```
GET /documents/{id}
```

#### Create Document (Admin)
```
POST /documents
```

**Body:**
```json
{
  "type": "quotation",
  "customerName": "Customer Name",
  "customerEmail": "email@email.com",
  "customerPhone": "081234567890",
  "customerAddress": "Full address",
  "amount": 2500000,
  "discount": 0,
  "referralCode": "REF123456",
  "quotationData": {
    "windows": [...],
    "paymentTerms": "...",
    "notes": "..."
  },
  "status": "draft"
}
```

#### Update Document (Admin)
```
PUT /documents/{id}
```

#### Send Document (Admin)
```
POST /documents/{id}/send
```

#### Delete Document (Admin)
```
DELETE /documents/{id}
```

---

### 🎁 Referrals API

#### Get All Referrals (Admin)
```
GET /referrals?status={status}
```

#### Get Referral by Code
```
GET /referrals/code/{code}
```

#### Register Referral (Website)
```
POST /referrals/register
```

**Body:**
```json
{
  "name": "Referral Name",
  "phone": "081234567890",
  "email": "referral@email.com",
  "address": "Full address"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "referral-...",
    "code": "REF123456",
    "name": "...",
    "totalReferrals": 0,
    "successfulReferrals": 0,
    "totalEarnings": 0,
    "status": "active",
    "referredCustomers": []
  }
}
```

#### Submit Referred Customer
```
POST /referrals/submit
```

**Body:**
```json
{
  "referralCode": "REF123456",
  "customerName": "Customer Name",
  "customerPhone": "081234567890",
  "customerEmail": "customer@email.com",
  "purchaseAmount": 2500000,
  "commission": 250000
}
```

#### Approve Commission (Admin)
```
POST /referrals/{id}/approve
```

**Body:**
```json
{
  "customerId": "cust-..."
}
```

#### Update Referral Status (Admin)
```
PUT /referrals/{id}/status
```

---

### 🛒 Orders API

#### Get All Orders (Admin)
```
GET /orders?status={status}
```

#### Get Order by ID
```
GET /orders/{id}
```

#### Create Order (Website)
```
POST /orders
```

**Body:**
```json
{
  "customerName": "Customer Name",
  "customerEmail": "email@email.com",
  "customerPhone": "081234567890",
  "customerAddress": "Full address",
  "items": [
    {
      "productId": "prod-1",
      "name": "Product Name",
      "price": 150000,
      "quantity": 2,
      "subtotal": 300000
    }
  ],
  "subtotal": 300000,
  "discount": 0,
  "shipping": 50000,
  "total": 350000,
  "paymentMethod": "transfer",
  "notes": "...",
  "referralCode": "REF123456"
}
```

#### Update Order Status (Admin)
```
PUT /orders/{id}/status
```

**Body:**
```json
{
  "status": "processing"
}
```

**Status Options:**
- pending
- processing
- shipped
- delivered
- cancelled

#### Update Payment Status (Admin)
```
PUT /orders/{id}/payment
```

**Body:**
```json
{
  "paymentStatus": "paid"
}
```

**Payment Status Options:**
- pending
- paid
- failed

#### Delete Order (Admin)
```
DELETE /orders/{id}
```

---

### 📊 Dashboard API

#### Get Dashboard Stats (Admin)
```
GET /dashboard/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalRevenue": 15000000,
      "totalOrders": 45,
      "pendingOrders": 8,
      "totalProducts": 25,
      "newLeads": 12,
      "activeReferrals": 6
    },
    "recentOrders": [...],
    "topProducts": [...]
  }
}
```

---

### 🌱 Seed Database

#### Initialize Database with Sample Data
```
POST /seed
```

**Response:**
```json
{
  "success": true,
  "message": "Database seeded successfully",
  "seeded": {
    "categories": 4,
    "products": 4,
    "calculatorLeads": 1,
    "articles": 1
  }
}
```

---

## 🔧 Frontend Integration

### Using the API Utility

Import the API utility in your React components:

```typescript
import { productsApi, categoriesApi, articlesApi } from '../utils/api';

// Get all products
const { data } = await productsApi.getAll({ category: 'cat-1', featured: true });

// Get product by ID
const { data: product } = await productsApi.getById('prod-1');

// Create product (admin)
const { data: newProduct } = await productsApi.create({
  name: 'New Product',
  price: 150000,
  // ...
});
```

### Example: Fetch Products in Component

```typescript
import { useEffect, useState } from 'react';
import { productsApi } from '../utils/api';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await productsApi.getAll({ featured: true, limit: 8 });
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProducts();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

---

## 🗄️ Data Models

### Product
```typescript
{
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice: number | null;
  category: string; // category ID
  images: string[];
  featured: boolean;
  inStock: boolean;
  stock: number;
  sku: string;
  specifications: object;
  colors: string[];
  sizes: string[];
  tags: string[];
  views: number;
  sales: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}
```

### Calculator Lead
```typescript
{
  id: string;
  name: string;
  phone: string;
  email: string;
  calculatorType: 'Smokering' | 'Kupu-kupu' | 'Blind';
  estimatedPrice: number;
  calculation: {
    product: object;
    dimensions: object;
    components: array;
    installation: object;
    notes: string;
  };
  status: 'new' | 'contacted' | 'converted' | 'closed';
  submittedAt: string;
  updatedAt: string;
}
```

---

## 🚀 Getting Started

### 1. Seed the Database
First time setup, run the seed endpoint to populate initial data:

```bash
POST https://{projectId}.supabase.co/functions/v1/make-server-df4da301/seed
Authorization: Bearer {publicAnonKey}
```

### 2. Test Health Check
```bash
GET https://{projectId}.supabase.co/functions/v1/make-server-df4da301/health
```

### 3. Fetch Products
```bash
GET https://{projectId}.supabase.co/functions/v1/make-server-df4da301/products
Authorization: Bearer {publicAnonKey}
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- All prices are in Indonesian Rupiah (IDR)
- KV Store uses prefix-based keys for data organization
- Data is automatically sorted by creation date (newest first) in most endpoints
- Admin endpoints should be protected by authentication (to be implemented)

---

## 🔐 Security Considerations

1. **Authentication**: Currently using public anon key - implement proper admin authentication
2. **Authorization**: Add role-based access control for admin endpoints
3. **Validation**: Add input validation on all POST/PUT endpoints
4. **Rate Limiting**: Consider adding rate limiting for public endpoints
5. **Sanitization**: Sanitize user inputs to prevent XSS attacks

---

## 🎯 Next Steps

1. ✅ Backend API implemented
2. ✅ Frontend API utility created
3. ✅ Seed data prepared
4. 🔄 Connect frontend components to real API
5. 🔄 Implement admin authentication
6. 🔄 Add email notifications
7. 🔄 Implement file upload for images

---

Made with ❤️ for Amagriya Gorden
