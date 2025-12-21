# DropXCult Platform Documentation

> **Version:** 1.0.0  
> **Last Updated:** December 21, 2025  
> **Classification:** Internal/Developer Documentation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Microservices Overview](#microservices-overview)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [Authentication & Authorization](#authentication--authorization)
9. [Payment Integration](#payment-integration)
10. [Feature Modules](#feature-modules)
11. [Environment Configuration](#environment-configuration)
12. [Deployment Guide](#deployment-guide)
13. [Security Considerations](#security-considerations)
14. [Monitoring & Logging](#monitoring--logging)

---

## Executive Summary

**DropXCult** is a full-stack e-commerce platform for custom apparel with integrated 3D design capabilities. The platform enables users to:

- Browse and purchase streetwear products
- Create custom t-shirt/hoodie designs using a 3D editor
- Participate in pre-order campaigns
- Engage with a community of designers
- Earn royalties through approved designs

### Key Business Features

| Feature | Description |
|---------|-------------|
| **E-Commerce Store** | Full shopping experience with cart, checkout, Razorpay payments |
| **3D Design Editor** | Fabric.js + Three.js powered live preview editor |
| **Admin Dashboard** | Complete order/product/user/design management |
| **Community Platform** | Social features - follows, likes, comments, shares |
| **Referral Program** | User referrals with ₹100 credit rewards |
| **Pre-Order Campaigns** | Campaign-based product launches with minimum quantities |
| **Royalty System** | Designer earnings from approved community designs |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         NGINX / Vercel                          │
│                        (Load Balancer)                          │
└─────────────────┬───────────────┬───────────────┬───────────────┘
                  │               │               │
                  ▼               ▼               ▼
        ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
        │   Store     │   │   Admin     │   │   Editor    │
        │  :3001      │   │   :3002     │   │   :3000     │
        │ (Next.js)   │   │ (Next.js)   │   │ (Next.js)   │
        └──────┬──────┘   └──────┬──────┘   └──────┬──────┘
               │                 │                 │
               └─────────────────┼─────────────────┘
                                 │
                                 ▼
                    ┌────────────────────┐
                    │   PostgreSQL DB    │
                    │   (Prisma ORM)     │
                    └────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
           ┌──────────────┐          ┌──────────────┐
           │  Cloudinary  │          │   Razorpay   │
           │   (CDN)      │          │  (Payments)  │
           └──────────────┘          └──────────────┘
```

### Communication Patterns

- **Inter-service:** REST APIs via `axios`
- **State Management:** Redux Toolkit with persistence
- **Real-time:** Server Actions + React Query refetch
- **File Storage:** Cloudinary (images, media)
- **Payments:** Razorpay webhooks

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.x | React framework with App Router |
| **React** | 19.x | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.x | Styling |
| **Redux Toolkit** | 2.x | State management |
| **React Query** | 5.x | Server state & caching |
| **Three.js** | 0.181 | 3D rendering |
| **Fabric.js** | 6.x | 2D canvas editing |
| **Framer Motion** | 12.x | Animations |
| **Lucide React** | 0.555 | Icons |
| **Recharts** | 3.x | Charts & analytics |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 16.x | REST API endpoints |
| **Prisma** | 5.22 | Database ORM |
| **PostgreSQL** | 15+ | Primary database |
| **bcryptjs** | 3.x | Password hashing |
| **jsonwebtoken** | 9.x | JWT authentication |
| **Resend** | 6.x | Transactional emails |
| **Cloudinary** | 2.x | Image management |
| **Razorpay** | 2.x | Payment gateway |

---

## Project Structure

```
DropXCult_Main_New/
├── dropxcult-store/          # Customer-facing storefront
│   ├── app/                  # Next.js App Router pages
│   │   ├── api/              # REST API endpoints
│   │   ├── shop/             # Product listing
│   │   ├── product/[slug]/   # Product details
│   │   ├── cart/             # Shopping cart
│   │   ├── checkout/         # Checkout flow
│   │   ├── community/        # Social feed
│   │   ├── profile/          # User profiles
│   │   ├── referrals/        # Referral program
│   │   └── ...
│   ├── components/           # Reusable UI components
│   ├── lib/                  # Utilities & helpers
│   ├── redux/                # Redux store & slices
│   └── prisma/               # Database schema
│
├── dropxcult-admin/          # Admin dashboard
│   ├── app/
│   │   ├── api/              # Admin API endpoints
│   │   ├── products/         # Product CRUD
│   │   ├── orders/           # Order management
│   │   ├── users/            # User management
│   │   ├── 3d-designs/       # Design moderation
│   │   ├── campaigns/        # Pre-order campaigns
│   │   ├── audit-logs/       # Security audit logs
│   │   └── ...
│   ├── components/           # Admin UI components
│   └── lib/                  # Admin utilities
│
├── Test/tshirt-editor/       # 3D Design Editor
│   ├── app/                  # Editor application
│   ├── components/
│   │   ├── FabricCanvas.jsx  # 2D canvas editor
│   │   ├── TshirtModel.jsx   # 3D model renderer
│   │   └── ui/               # UI primitives
│   ├── redux/                # Editor state
│   └── public/
│       ├── models/           # GLB 3D models
│       └── designs/          # Template images
│
└── multi-project-runner/     # Dev orchestration
    └── package.json          # Concurrent runner
```

---

## Microservices Overview

### 1. Store Service (Port 3001)

**Purpose:** Customer-facing e-commerce application

**Key Routes:**
- `/` - Homepage with featured products
- `/shop` - Product catalog with filters
- `/product/[slug]` - Product detail page
- `/cart` - Shopping cart management
- `/checkout` - Payment & order creation
- `/community` - Social feed & designs
- `/profile/[userId]` - User profiles
- `/referrals` - Referral dashboard

**Key APIs:**
```
GET    /api/products          - List products
GET    /api/products/[slug]   - Product details
POST   /api/orders            - Create order
POST   /api/checkout          - Process payment
GET    /api/community/designs - Community feed
POST   /api/referrals         - Apply referral code
```

---

### 2. Admin Service (Port 3002)

**Purpose:** Administrative control panel

**Key Routes:**
- `/` - Dashboard with analytics
- `/products` - Product management
- `/orders` - Order processing
- `/users` - User management
- `/3d-designs` - Design moderation
- `/campaigns` - Pre-order campaigns
- `/coupons` - Discount codes
- `/audit-logs` - Security logs

**Key APIs:**
```
GET    /api/dashboard/stats   - Analytics data
POST   /api/products          - Create product
PUT    /api/orders/[id]       - Update order status
POST   /api/designs/[id]/action - Approve/reject design
GET    /api/audit-logs        - Security audit trail
```

---

### 3. Editor Service (Port 3000)

**Purpose:** 3D T-shirt/Hoodie design editor

**Key Features:**
- Fabric.js 2D canvas with text, images, shapes
- Three.js 3D preview with real-time updates
- Auto-background removal (AI-powered)
- Cloud save to database
- Design submission for approval
- View-only mode for previewing

**Important Files:**
- `FabricCanvas.jsx` - Core 2D editor
- `TshirtModel.jsx` - 3D model renderer
- `page.tsx` - Main editor page

---

## Database Schema

### Core Models

```prisma
User {
  id              String   @id
  name            String
  email           String   @unique
  password        String   (hashed)
  isAdmin         Boolean
  
  // Profile
  image           String?
  bio             String?
  username        String?  @unique
  
  // Gamification
  rank            String   (Initiate → Legend)
  ordersCount     Int
  designsApproved Int
  royaltyEarnings Int
  
  // Referrals
  referralCode    String?  @unique
  referralCredits Float
}

Product {
  id          String
  name        String
  slug        String   @unique
  description String
  price       Float
  category    String
  images      String[]
  sizes       String[]
  colors      String[]
  stock       Int
  isFeatured  Boolean
}

Order {
  id              String
  userId          String?
  orderItems      OrderItem[]
  shippingAddress Json
  paymentMethod   String
  paymentResult   Json?
  totalPrice      Float
  isPaid          Boolean
  isDelivered     Boolean
  status          String
}

Design {
  id              String
  userId          String
  name            String
  tshirtType      String  (regular|oversized|hoodie)
  tshirtColor     String
  status          String  (Pending|Accepted|Rejected|Draft)
  canvasState     Json    (Fabric.js export)
  previewImage    String?
  likesCount      Int
  commentsCount   Int
}

AuditLog {
  id           String
  userId       String?
  userEmail    String?
  userRole     String?   (user|admin)
  action       String    (LOGIN|CREATE|UPDATE|DELETE|etc)
  entity       String    (User|Order|Product|Design|etc)
  entityId     String?
  details      Json?
  ipAddress    String?
  status       String    (SUCCESS|FAILURE|DENIED)
  createdAt    DateTime
}
```

### Relationships Diagram

```
User ─────────< Order ─────────< OrderItem >───────── Product
  │                                                      │
  ├──────< Design ─────< DesignLike                      │
  │           │                                          │
  │           └────< DesignComment                       │
  │                                                      │
  ├──────< Review >──────────────────────────────────────┘
  │
  ├──────< Address
  │
  ├──────< Follow (self-referential)
  │
  └──────< Referral
```

---

## API Reference

### Authentication

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}

Response: 201 Created
{
  "id": "cuid...",
  "name": "John Doe",
  "email": "john@example.com",
  "token": "jwt..."
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response: 200 OK
{
  "id": "cuid...",
  "token": "jwt...",
  "isAdmin": false
}
```

### Products

```http
GET /api/products?category=Hoodies&sort=price-asc&page=1&limit=12

Response: 200 OK
{
  "products": [...],
  "pagination": {
    "page": 1,
    "totalPages": 5,
    "total": 60
  }
}
```

### Orders

```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderItems": [...],
  "shippingAddress": {...},
  "paymentMethod": "razorpay",
  "totalPrice": 2499
}

Response: 201 Created
{
  "orderId": "cuid...",
  "razorpayOrderId": "order_..."
}
```

### Designs

```http
POST /api/designs
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Fire Dragon",
  "tshirtType": "oversized",
  "tshirtColor": "#000000",
  "canvasState": {...},
  "previewImage": "data:image/png;base64,..."
}

Response: 201 Created
{
  "id": "cuid...",
  "status": "Draft"
}
```

---

## Authentication & Authorization

### JWT Token Structure

```javascript
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "id": "user_cuid",
    "email": "user@example.com",
    "isAdmin": false,
    "iat": 1703180400,
    "exp": 1703784000
  }
}
```

### Role-Based Access

| Role | Permissions |
|------|-------------|
| **Guest** | Browse products, view designs |
| **User** | + Create orders, designs, reviews |
| **Admin** | + Full CRUD, moderation, analytics |

### Middleware Pattern

```typescript
// lib/auth.ts
export function verifyToken(token: string) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

export function requireAdmin(handler) {
  return async (req) => {
    const user = verifyToken(req.headers.authorization);
    if (!user.isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    return handler(req, user);
  };
}
```

---

## Payment Integration

### Razorpay Flow

```
1. User clicks "Pay" 
   └─> Frontend calls POST /api/checkout

2. Server creates Razorpay order
   └─> razorpay.orders.create({
         amount: totalPrice * 100, // paise
         currency: "INR"
       })

3. Frontend opens Razorpay checkout modal
   └─> Razorpay.open({
         key: NEXT_PUBLIC_RAZORPAY_KEY_ID,
         order_id: razorpayOrderId
       })

4. User completes payment
   └─> Razorpay calls webhook: POST /api/razorpay/webhook

5. Webhook verifies signature & updates order
   └─> Order.isPaid = true
       Order.paymentResult = { razorpay_payment_id, ... }
```

### Webhook Verification

```typescript
const shasum = crypto.createHmac('sha256', RAZORPAY_SECRET);
shasum.update(JSON.stringify(req.body));
const digest = shasum.digest('hex');

if (digest !== req.headers['x-razorpay-signature']) {
  return Response.json({ error: 'Invalid signature' }, { status: 400 });
}
```

---

## Feature Modules

### 1. Community Feed

Social platform for sharing designs:

- **Design Posts:** Users share approved designs
- **Likes:** Users can like designs
- **Comments:** Threaded comment system
- **Shares:** Track share counts
- **Following:** Follow other designers

### 2. Referral Program

- Each user gets unique referral code
- Referred user applies code at signup
- Both users get ₹100 credit after first order
- Credits tracked in `referralCredits` field

### 3. Pre-Order Campaigns

- Admin creates campaign for products
- Sets minimum quantity & deadline
- Users place pre-orders at discounted price
- If minimum met: production starts
- If not met: automatic refunds

### 4. Audit Logging

All admin actions are logged:

```javascript
await logAudit({
  userId: admin.id,
  userEmail: admin.email,
  userRole: 'admin',
  action: 'UPDATE',
  entity: 'Order',
  entityId: orderId,
  details: { oldStatus, newStatus },
  ipAddress: getClientIP(request),
  status: 'SUCCESS'
});
```

---

## Environment Configuration

### Store (.env)

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dropxcult"

# Auth
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"

# Razorpay
RAZORPAY_KEY_ID="rzp_live_xxx"
RAZORPAY_KEY_SECRET="xxx"

# Cloudinary
CLOUDINARY_CLOUD_NAME="xxx"
CLOUDINARY_API_KEY="xxx"
CLOUDINARY_API_SECRET="xxx"

# Email (Resend)
RESEND_API_KEY="re_xxx"

# App URLs
NEXT_PUBLIC_STORE_URL="https://dropxcult.com"
NEXT_PUBLIC_EDITOR_URL="https://editor.dropxcult.com"
NEXT_PUBLIC_ADMIN_URL="https://admin.dropxcult.com"
```

### Admin (.env)

```bash
DATABASE_URL="postgresql://user:pass@host:5432/dropxcult"
JWT_SECRET="your-jwt-secret" # Same as store
RESEND_API_KEY="re_xxx"
CLOUDINARY_CLOUD_NAME="xxx"
CLOUDINARY_API_KEY="xxx"
CLOUDINARY_API_SECRET="xxx"
```

### Editor (.env)

```bash
DATABASE_URL="postgresql://user:pass@host:5432/dropxcult"
NEXT_PUBLIC_STORE_URL="https://dropxcult.com"
```

---

## Deployment Guide

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Cloudinary account
- Razorpay account
- Resend account (optional)

### Production Deployment

```bash
# 1. Clone repository
git clone https://github.com/your-org/dropxcult.git
cd dropxcult

# 2. Install dependencies
cd dropxcult-store && npm install
cd ../dropxcult-admin && npm install
cd ../Test/tshirt-editor && npm install

# 3. Setup database
cd dropxcult-store
npx prisma migrate deploy
npx prisma generate

# 4. Build applications
npm run build  # In each project

# 5. Start production servers
npm start  # In each project
```

### Vercel Deployment

Each service can be deployed as separate Vercel project:

1. Connect GitHub repository
2. Set root directory (`dropxcult-store`, `dropxcult-admin`, etc.)
3. Add environment variables
4. Deploy

---

## Security Considerations

### Implemented Security Measures

| Measure | Implementation |
|---------|---------------|
| **Password Hashing** | bcrypt with salt rounds = 10 |
| **JWT Auth** | Signed tokens with expiry |
| **Rate Limiting** | Token bucket per IP/endpoint |
| **Input Validation** | Zod schemas |
| **SQL Injection** | Prisma ORM (parameterized) |
| **XSS Protection** | React escaping + CSP |
| **CORS** | Configured per environment |
| **Audit Logging** | All admin actions logged |

### Security Checklist

- ✅ HTTPS only in production
- ✅ Secure cookie flags (httpOnly, secure, sameSite)
- ✅ Environment variables for secrets
- ✅ Admin routes require authentication
- ✅ Webhook signature verification
- ✅ Image upload validation

---

## Monitoring & Logging

### Audit Log Categories

| Action | Entity | Description |
|--------|--------|-------------|
| LOGIN | User | User login attempt |
| LOGOUT | User | User logout |
| CREATE | Order, Product, Design | New entity created |
| UPDATE | Order, Product, Design | Entity modified |
| DELETE | Product, User | Entity deleted |
| APPROVE | Design | Design approved by admin |
| REJECT | Design | Design rejected |

### Metrics to Monitor

- Order conversion rate
- Payment success/failure ratio
- API response times
- Error rates by endpoint
- Design approval rate
- User registration trends

---

## Support & Contact

**Development Team:** DropXCult Engineering  
**Repository:** Private  
**Issue Tracking:** GitHub Issues  

---

*This documentation is confidential and intended for internal use only.*
