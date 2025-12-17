# Backend Design Specification: Gorden Project

Based on the detailed analysis of the frontend structure and data requirements, here is the comprehensive design for the Database Schema and API Endpoints.

## 1. Database Schema Design

The database should be relational (e.g., PostgreSQL or MySQL).


### 1.1 Users & Authentication
**Table: `users`**
| Column | Type | Description |
|---|---|---|
| `id` | UUID / BIGINT | Primary Key |
| `name` | VARCHAR | Full name |
| `email` | VARCHAR | Unique email |
| `password_hash` | VARCHAR | Hashed password |
| `phone` | VARCHAR | Phone number |
| `role` | ENUM | 'ADMIN', 'CUSTOMER' |
| `referral_code` | VARCHAR | Unique code for this user to share |
| `referred_by` | UUID | FK to `users.id` (who referred this user) |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

### 1.2 Products & Catalog
**Table: `categories`**
| Column | Type | Description |
|---|---|---|
| `id` | INT | Primary Key |
| `name` | VARCHAR | e.g., "Gorden Minimalis", "Vertical Blind" |
| `slug` | VARCHAR | URL friendly slug |
| `description` | TEXT | Category description for SEO/UI |
| `icon_url` | VARCHAR | Icon image URL |

**Table: `products`**
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary Key |
| `category_id` | INT | FK to `categories.id` |
| `name` | VARCHAR | Product Name |
| `sku` | VARCHAR | Stock Keeping Unit |
| `subtitle` | VARCHAR | e.g., "Ukur & Pasang Sendiri" |
| `description` | TEXT | Full description |
| `information` | TEXT | Additional information tab content |
| `price_self_measure` | DECIMAL | Price for "Ukur & Pasang Sendiri" |
| `price_self_measure_install` | DECIMAL | Price for "Ukur Sendiri & Pasang Tim" |
| `price_measure_install` | DECIMAL | Price for "Tim Ukur & Pasang" |
| `stock` | INT | Inventory count |
| `price_unit` | VARCHAR | e.g., "m2", "pcs" |
| `images` | JSON | Array of image URLs |
| `features` | JSON | Array of feature strings |
| `how_to_order` | JSON | Array of step strings |
| `status` | ENUM | 'ACTIVE', 'INACTIVE', 'ARCHIVED' |
| `is_featured` | BOOLEAN | Display in Featured section |
| `is_new_arrival` | BOOLEAN | Display in New Arrivals |
| `is_best_seller` | BOOLEAN | Display in Best Sellers |
| `meta_title` | VARCHAR | SEO Title |
| `meta_description` | TEXT | SEO Description |
| `meta_keywords` | VARCHAR | SEO Keywords |
| `created_at` | TIMESTAMP | |

### 1.3 Calculator Components (Dynamic Pricing)
**Table: `calculator_components`**
| Column | Type | Description |
|---|---|---|
| `id` | INT | PK |
| `type` | ENUM | 'product', 'rel_gorden', 'tassel', 'hook', 'vitrase_kain', 'vitrase_rel' |
| `name` | VARCHAR | Display name |
| `price` | DECIMAL | Price per unit/meter |
| `image_url` | VARCHAR | |
| `max_width` | INT | Optional (for rails) |
| `description` | VARCHAR | |

### 1.4 Orders & Transactions
**Table: `orders`**
| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary Key (Order ID) |
| `user_id` | UUID | FK to `users.id` |
| `customer_name` | VARCHAR | Snapshot of name |
| `customer_email` | VARCHAR | Snapshot |
| `customer_phone` | VARCHAR | Snapshot |
| `shipping_address` | TEXT | |
| `total_amount` | DECIMAL | Grand total |
| `status` | ENUM | 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED' |
| `payment_status` | ENUM | 'UNPAID', 'PAID', 'REFUNDED' |
| `notes` | TEXT | General order notes |
| `created_at` | TIMESTAMP | |

**Table: `order_items`**
| Column | Type | Description |
|---|---|---|
| `id` | UUID | PK |
| `order_id` | UUID | FK to `orders.id` |
| `product_id` | UUID | FK to `products.id` |
| `product_name` | VARCHAR | Snapshot |
| `quantity` | INT | |
| `unit_price` | DECIMAL | Price at time of purchase |
| `width` | DECIMAL | Custom size width (cm) |
| `height` | DECIMAL | Custom size height (cm) |
| `subtotal` | DECIMAL | |
| `package_variant` | VARCHAR | 'self', 'self_install', 'team_install' |
| `components_snapshot` | JSON | Details of calculator components |

### 1.5 Referrals
**Table: `referrals`**
| Column | Type | Description |
|---|---|---|
| `id` | UUID | PK |
| `referrer_id` | UUID | User who receives commission |
| `order_id` | UUID | The order that generated this commission |
| `commission_amount`| DECIMAL | e.g., 10% of order |
| `status` | ENUM | 'PENDING', 'PAID' |
| `created_at` | TIMESTAMP | |
| `paid_at` | TIMESTAMP | |

### 1.6 Content Management (CMS)
**Table: `gallery_projects`**
| Column | Type | Description |
|---|---|---|
| `id` | UUID | PK |
| `title` | VARCHAR | Project Title |
| `category` | VARCHAR | 'Rumah Tinggal', 'Apartemen', 'Kantor', 'Cafe / Resto' |
| `type` | VARCHAR | e.g. "Gorden Smokering" (corresponds to frontend 'type') |
| `location` | VARCHAR | City/Area |
| `description` | TEXT | |
| `date` | DATE | Date of installation |
| `image_url` | VARCHAR | Main image |
| `is_featured` | BOOLEAN | |
| `sort_order` | INT | Display order |
| `created_at` | TIMESTAMP | |

**Table: `site_settings`**
| Column | Type | Description |
|---|---|---|
| `key` | VARCHAR | PK (e.g., 'siteName', 'siteEmail', 'sitePhone', 'whatsappNumber', 'enableNotifications') |
| `value` | TEXT | Value content (stores generic strings, booleans as string, etc) |
| `type` | VARCHAR | 'string', 'boolean', 'json' |
| `description` | VARCHAR | Admin UI label |

### 1.7 Articles (Blog/Tips)
**Table: `articles`**
| Column | Type | Description |
|---|---|---|
| `id` | UUID | PK |
| `title` | VARCHAR | Article Title |
| `slug` | VARCHAR | URL friendly slug (unique) |
| `excerpt` | TEXT | Short summary |
| `content` | TEXT | HTML Content |
| `category` | VARCHAR | e.g. 'tips', 'inspiration', 'guide', 'trend' |
| `author` | VARCHAR | Author name |
| `image_url` | VARCHAR | Featured image |
| `is_featured` | BOOLEAN | |
| `status` | ENUM | 'DRAFT', 'PUBLISHED' |
| `view_count` | INT | |
| `created_at` | TIMESTAMP | |

### 1.8 Calculator Leads
**Table: `calculator_leads`**
| Column | Type | Description |
|---|---|---|
| `id` | UUID | PK |
| `name` | VARCHAR | Customer Name |
| `phone` | VARCHAR | |
| `email` | VARCHAR | |
| `calculator_type` | VARCHAR | 'Smokering', 'Kupu-kupu', 'Blind' |
| `estimated_price` | DECIMAL | |
| `calculation_data` | JSON | Full snapshot of calculation details |
| `status` | ENUM | 'NEW', 'CONTACTED', 'CONVERTED', 'CLOSED' |
| `created_at` | TIMESTAMP | |

### 1.9 Documents (Invoices/Quotes)
**Table: `documents`**
| Column | Type | Description |
|---|---|---|
| `id` | UUID | PK |
| `type` | ENUM | 'QUOTATION', 'INVOICE' |
| `document_number`| VARCHAR | e.g., 'INV-2024-001' |
| `customer_name` | VARCHAR | |
| `customer_email` | VARCHAR | |
| `customer_phone` | VARCHAR | |
| `address` | TEXT | |
| `total_amount` | DECIMAL | |
| `discount_amount`| DECIMAL | |
| `data` | JSON | Line items (windows, items), payment terms, notes |
| `status` | ENUM | 'DRAFT', 'SENT', 'PAID', 'CANCELLED' |
| `referral_code` | VARCHAR | Optional |
| `created_at` | TIMESTAMP | |

### 1.10 Services
**Table: `services`**
| Column | Type | Description |
|---|---|---|
| `id` | UUID | PK |
| `title` | VARCHAR | Service Name |
| `description` | TEXT | |
| `icon` | VARCHAR | |
| `image_url` | VARCHAR | |
| `created_at` | TIMESTAMP | |

### 1.11 FAQs
**Table: `faqs`**
| Column | Type | Description |
|---|---|---|
| `id` | UUID | PK |
| `question` | TEXT | |
| `answer` | TEXT | |
| `category` | VARCHAR | |
| `created_at` | TIMESTAMP | |

### 1.12 Contacts (Messages)
**Table: `contacts`**
| Column | Type | Description |
|---|---|---|
| `id` | UUID | PK |
| `name` | VARCHAR | |
| `email` | VARCHAR | |
| `phone` | VARCHAR | |
| `message` | TEXT | |
| `status` | ENUM | 'NEW', 'READ', 'RESPONDED' |
| `created_at` | TIMESTAMP | |

---

## 2. API Endpoints Specification

Base URL: `/api/v1`

### 2.1 Authentication
- `POST /auth/register`
    - Body: `{ name, email, password, referral_code (opt) }`
- `POST /auth/login`
    - Body: `{ email, password }`
    - Response: `{ token, user: { id, name, role } }`
- `GET /auth/me`
    - Header: `Authorization: Bearer <token>`

### 2.2 Products (Public)
- `GET /products`
    - Query Params: `?category=slug&search=query&sort=price_asc&featured=true`
- `GET /products/:id`
    - Response: Full product detail.
- `GET /categories`
    - Response: List of categories.

### 2.3 Calculator Data
- `GET /calculator/components`
    - Response: `{ rel_gorden: [...], tassel: [...], ... }`
    - Used to populate the selection modals in Calculator Page.

### 2.4 Cart & Orders
- `POST /orders` (Checkout)
    - Auth Required
    - Body: Order details + items
- `GET /orders` (My Orders)
    - Auth Required
- `GET /orders/:id`

### 2.5 Admin
- `GET /admin/stats` (Dashboard)
- `GET /admin/orders`
- `PATCH /admin/orders/:id/status`
- `POST /admin/products` (Create Product)
- `PUT /admin/products/:id`
- `DELETE /admin/products/:id`
- `GET /admin/calculator-components`
- `POST /admin/calculator-components`
- `PUT /admin/calculator-components/:id`
- `GET /admin/settings` (Fetch all settings as key-value pairs)
- `PUT /admin/settings` (Bulk update: `{ siteName: "...", ... }`)
- `GET /admin/gallery`
- `POST /admin/gallery`
- `PUT /admin/gallery/:id`
- `DELETE /admin/gallery/:id`
- `GET /admin/articles`
- `POST /admin/articles`
- `PUT /admin/articles/:id`
- `DELETE /admin/articles/:id`
- `POST /admin/upload/image` (File upload, returns URL)

### 2.6 Referral System
- `GET /referrals/stats` (For Referral Admin Dashboard)
    - Auth Required (Admin checks all, User checks own)
    - Response: Overview of referrals, commissions, etc.

### 2.7 Documents (Admin)
- `GET /admin/documents`
- `POST /admin/documents`
- `PUT /admin/documents/:id`
- `DELETE /admin/documents/:id`

---

## 3. Technology Recommendations
- **Backend Framework**: Node.js (Express/NestJS) or Go (Gin/Fiber) or Laravel (PHP) - user's previous context mentioned Laravel, might be a good fit.
- **Database**: PostgreSQL (recommended for robust relational data).
- **ORM**: Prisma (Node) or Eloquent (Laravel).
- **Authentication**: JWT (JSON Web Tokens).
