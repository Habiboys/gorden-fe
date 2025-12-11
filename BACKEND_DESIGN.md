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
| `subtitle` | VARCHAR | e.g., "Ukur & Pasang Sendiri" |
| `description` | TEXT | Full description |
| `price` | DECIMAL | Base price |
| `original_price` | DECIMAL | Strike-through price |
| `stock` | INT | Inventory count |
| `discount_percent` | INT | |
| `price_unit` | VARCHAR | e.g., "m2", "pcs" |
| `images` | JSON | Array of image URLs |
| `features` | JSON | Array of feature strings |
| `how_to_order` | JSON | Array of step strings |
| `status` | ENUM | 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK' |
| `created_at` | TIMESTAMP | |

**Table: `product_packages`** (for "Pilih Paket" options)
| Column | Type | Description |
|---|---|---|
| `id` | INT | PK |
| `product_id` | UUID | FK to `products.id` |
| `name` | VARCHAR | e.g., "Ukur & Pasang Sendiri" |
| `slug` | VARCHAR | system identifier (e.g., 'self') |
| `description` | TEXT | |

### 1.3 Calculator Components (Dynamic Pricing)
**Table: `calculator_components`**
| Column | Type | Description |
|---|---|---|
| `id` | INT | PK |
| `type` | ENUM | 'rel_gorden', 'tassel', 'hook', 'vitrase_kain', 'vitrase_rel' |
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
| `customer_name` | VARCHAR | Snapshot of name (in case user changes) |
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
| `package_variant` | VARCHAR | e.g., 'full-service' |
| `components_snapshot` | JSON | Details of calculator components selected (rel, tassel, etc.) |

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

### 1.6 Content Management (CMS)
**Table: `gallery_projects`**
| Column | Type | Description |
|---|---|---|
| `id` | UUID | PK |
| `title` | VARCHAR | Project Title |
| `category` | ENUM | 'RESIDENTIAL', 'APARTMENT', 'OFFICE', 'CAFE_RESTO' |
| `installation_type` | VARCHAR | e.g. "Blackout Curtain" |
| `location` | VARCHAR | City/Area |
| `completion_date` | DATE | |
| `image_url` | VARCHAR | Main image |
| `created_at` | TIMESTAMP | |

**Table: `site_settings`**
| Column | Type | Description |
|---|---|---|
| `key` | VARCHAR | PK (e.g., 'site_phone', 'maintenance_mode') |
| `value` | TEXT | Value content |
| `type` | VARCHAR | 'string', 'boolean', 'json' |
| `description` | VARCHAR | For admin UI tooltip |

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
    - Query Params: `?category=slug&search=query&sort=price_asc`
- `GET /products/:id`
    - Response: Full product detail including variants/packages.
- `GET /categories`
    - Response: List of categories.

### 2.3 Calculator Data
- `GET /calculator/components`
    - Response: `{ rel_gorden: [...], tassel: [...], ... }`
    - Used to populate the selection modals in Calculator Page so prices aren't hardcoded.

### 2.4 Cart & Orders
- `POST /orders` (Checkout)
    - Auth Required
    - Body:
      ```json
      {
        "items": [
          {
            "product_id": "...",
            "quantity": 1,
            "width": 200,
            "height": 250,
            "package_variant": "self",
            "components": { "rel_id": 1, "tassel_id": 2 }
          }
        ],
        "notes": "..."
      }
      ```
- `GET /orders` (My Orders)
    - Auth Required
    - Returns list of user's orders.
- `GET /orders/:id`

### 2.5 Admin
- `GET /admin/stats` (Dashboard)
- `GET /admin/orders`
    - Query: `?status=pending&page=1`
- `PATCH /admin/orders/:id/status`
    - Body: `{ status: 'PROCESSING' }`
- `POST /admin/products` (Create Product)
- `PUT /admin/products/:id`
- `PUT /admin/calculator-components/:id` (Update prices)
- `GET /admin/settings`
- `PUT /admin/settings` (Bulk update)
- `POST /admin/gallery`
- `DELETE /admin/gallery/:id`

### 2.6 Referral System
- `GET /referrals/stats`
    - Auth Required
    - Response: `{ total_earnings, referrer_code, history: [...] }`

---

## 3. Technology Recommendations
- **Backend Framework**: Node.js (Express/NestJS) or Go (Gin/Fiber) or Laravel (PHP) - user's previous context mentioned Laravel, might be a good fit.
- **Database**: PostgreSQL (recommended for robust relational data).
- **ORM**: Prisma (Node) or Eloquent (Laravel).
- **Authentication**: JWT (JSON Web Tokens).
