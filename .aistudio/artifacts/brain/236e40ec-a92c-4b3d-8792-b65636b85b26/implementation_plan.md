# BEAUTYDOOR — Premium At-Home Beauty Services Platform (Delhi NCR)

A luxury editorial at-home beauty and salon booking platform connecting discerning clients in Delhi NCR with certified, vetted beauticians for premium treatments in the comfort of their homes.

***

## User Review & Critical Decisions

> [!IMPORTANT]
> The following key decisions were confirmed during Phase 1 clarification:
> - **Payment Method**: Cash on Delivery (COD / Pay after service) enabled as the active primary checkout method for launch and testing, with a clean backend structure for plug-and-play Razorpay activation.
> - **Beautician Assignment**: Manual assignment by the dispatch manager / admin via an interactive Dispatch Board, with automated conflict checking, skill-matching highlights, and availability verification.
> - **Launch Coverage**: All six Delhi NCR territories pre-seeded and active (Delhi, Gurugram, Noida, Greater Noida, Ghaziabad, Faridabad) with administrative pincode toggles and serviceability lookups.

***

## 1. Overview & Core Concept

- **What It Does**: BeautyDoor provides professional, salon-grade treatments (waxing, hydra-facials, mani-pedi, bridal styling, de-tan, massage, and custom packages) directly to the customer's doorstep. Customers check pincode serviceability, configure variants and add-ons, pick time slots, and book with pay-after-service convenience.
- **Target Audience**: Women, brides, working professionals, and homemakers across Delhi NCR who demand five-star hygiene, transparent pricing, vetted beauticians, and a serene at-home salon experience.
- **Key Value**: Replaces the hassle and exposure of salon visits with punctual, hospital-grade sanitized treatments, flexible custom package discounts, and white-glove customer care.

***

## 2. User Experience & Visual Design

### A. Visual Identity & Theme
- **Color Palette**:
  - *Dominant Canvas (60%)*: Warm Ivory (`#FAF7F2`), Soft Chalk (`#FFFFFF`), Linen Cream (`#F4EFEA`).
  - *Structural Surfaces (30%)*: Muted Champagne Borders (`#E8DDD3`), Deep Espresso Charcoal (`#1F1A1C`), Soft Rose Cashmere (`#F9F3F1`).
  - *High-Intent Luxury Accent (10%)*: Deep Royal Burgundy / Wine (`#4A0417` and `#6E0D25`) derived directly from the uploaded official BeautyDoor logo, with subtle Champagne Gold (`#C5A880`).
- **Typography**:
  - *Display / Brand*: `Playfair Display` (high-contrast luxury editorial serif for headlines, category banners, and package showcases).
  - *Body / UI*: `Plus Jakarta Sans` (refined geometric sans for crisp readability, forms, and service cards).
  - *Numerals & Pricing*: `tabular-nums` for aligned Rupee (`₹`) pricing and appointment timings.
- **Brand Asset Integration**:
  - Uses the official BeautyDoor logo mark (`/assets/aistudio/WhatsApp_Image_2026-11-02_at_3.15.17_PM_49e36dff.jpeg`) cleanly integrated into the header and footer with calibrated optical sizing.
- **Anti-Slop Discipline**:
  - Strict **Zero-Pill rule**: unboxed text metadata with typographic separators (`·`).
  - Strict **Top Bar Contract**: Single row, 3-zone layout (Logo mark — Nav links — Book Appointment CTA).
  - No decorative pulsing dots, no fake system status tickers, no code-comment headings, and no low-opacity watermarks.

### B. Core Customer User Flows
1. **Discovery & Pincode Check**: Visitor lands on the editorial homepage, enters their Delhi NCR pincode (or picks their city) to verify immediate serviceability, and browses 14 distinct beauty categories.
2. **Service Exploration & Customization**: User opens a service detail modal, selects variants (e.g. Honey vs. Rica vs. Roll-on wax; 45-min vs. 60-min facial), toggles add-ons (e.g. peel-off rubber mask), and adds items to the floating luxury booking drawer.
3. **Build Your Own Package**: Interactive bundling interface allowing customers to pick 3+ services across categories to automatically trigger tiered bundle savings (10% to 20% off).
4. **Checkout & Slot Reservation**: Clean multi-step drawer: Address details (flat, landmark, city, validated pincode) $\to$ Date picker $\to$ Real-time slot selection (09:00 AM to 07:00 PM in 1-hour slots) $\to$ Promo code application $\to$ Cash on Delivery confirmation $\to$ Instant reservation with unique Booking ID (`BD-NCR-XXXX`).
5. **Customer Portal & Feedback**: Customers log in via phone number, manage active bookings, request reschedule/cancellation, and submit genuine star ratings and treatment feedback.

### C. Admin & Operations User Flow
1. **Executive Dashboard**: Daily/monthly revenue, booking volume by status, city distribution, and active beautician metrics.
2. **Dispatch & Booking Manager**: View all incoming bookings, filter by date/territory/status, check beautician availability, assign/reassign staff, reschedule, or cancel with internal audit notes.
3. **Catalog & Dynamic Pricing**: Add/edit services, modify original & selling prices, manage variant options, add-ons, and toggle category visibility without redeploying code.
4. **Territory & Pincode Control**: Enable or disable any of the 6 Delhi NCR zones or individual pincodes.
5. **Offers & Coupons**: Configure flat or percentage discount codes with minimum order values and validity dates.
6. **Beautician Roster**: Manage staff profiles, phone numbers, assigned service specialties, working hours, and leave schedules.

***

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Full-Stack Express API + React SPA inside AI Studio**
  - *Chosen Approach*: Node.js Express server mounting Vite in dev, hosting REST endpoints (`/api/*`) with persistent file-backed data storage (`/data/beautydoor_db.json`).
  - *Why*: Provides real backend data persistence, dynamic pricing calculations, conflict checks, and admin mutations without external database provisioning bottlenecks.
  - *Alternatives Considered*: Pure client-side state (rejected: admin changes would not persist across browser sessions or reloads).

- **Decision 2: Manual Beautician Dispatch with Conflict Validation**
  - *Chosen Approach*: The admin dispatch manager assigns bookings to beauticians, while the backend actively validates that the beautician is qualified for the booked services and has no overlapping slot commitments.
  - *Why*: Reflects the user's explicit preference while ensuring operational safety and zero double-booking.

- **Decision 3: Tiered Custom Package Engine**
  - *Chosen Approach*: Real-time rule-based discount calculator in backend and frontend: 2 services = 5% off, 3 services = 10% off, 4+ services = 15% off, with transparent savings breakdown.
  - *Why*: Maximizes average order value (AOV) and empowers clients to personalize treatments.

***

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                   BEAUTYDOOR CLIENT (React 19 SPA)                    │
│                                                                        │
│  ┌───────────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │ Customer Storefront   │  │ Package Builder │  │ Booking Drawer   │  │
│  │ (Hero, Catalog, PDP)  │  │ & Offers Hub    │  │ (Address, Slots) │  │
│  └───────────┬───────────┘  └────────┬────────┘  └────────┬─────────┘  │
│              │                       │                    │            │
│  ┌───────────┴───────────────────────┴────────────────────┴─────────┐  │
│  │ Admin Dashboard (KPIs, Dispatch Board, Catalog, Staff, Locations) │  │
│  └───────────────────────────────────┬───────────────────────────────┘  │
└──────────────────────────────────────┼─────────────────────────────────┘
                                       │ REST API calls (fetch)
┌──────────────────────────────────────▼─────────────────────────────────┐
│               FULL-STACK BACKEND (Express / server.ts)                 │
│                                                                        │
│  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌────────────┐  │
│  │ Booking Engine│ │ Pricing & Promo│ │ Staff Manager │ │ Location   │  │
│  │ & Slots Logic │ │ Engine        │ │ & Dispatch    │ │ Validator  │  │
│  └───────┬───────┘ └───────┬───────┘ └───────┬───────┘ └──────┬─────┘  │
│          └─────────────────┴────────┬────────┴────────────────┘        │
│                                     │                                  │
│                 ┌───────────────────▼──────────────────┐               │
│                 │ Persistent JSON Data Store           │               │
│                 │ (/data/beautydoor_db.json)           │               │
│                 └──────────────────────────────────────┘               │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Entities & Schema
- **Category**: `id`, `name`, `slug`, `description`, `icon`, `image`, `order`, `isActive`.
- **Service**: `id`, `categoryId`, `name`, `description`, `benefits[]`, `durationMins`, `originalPrice`, `sellingPrice`, `discountPercent`, `whatsIncluded[]`, `image`, `variants[]`, `addons[]`, `isActive`, `isPopular`, `isBestseller`.
- **Territory / Pincode**: `id`, `city`, `areaName`, `pincode`, `isActive`, `deliveryFee`, `minOrderAmount`.
- **Beautician**: `id`, `name`, `phone`, `rating`, `totalJobs`, `specialties[]`, `territories[]`, `avatar`, `isActive`, `status` (`available`, `on_leave`).
- **Booking**: `id` (`BD-NCR-XXXX`), `customerId`, `customerName`, `customerPhone`, `address` (`line1`, `landmark`, `city`, `pincode`), `items[]` (`serviceId`, `variantId`, `addonIds[]`, `price`), `subtotal`, `packageDiscount`, `couponDiscount`, `totalPayable`, `date`, `slot`, `paymentMethod` (`COD`), `paymentStatus` (`pending`, `collected`), `bookingStatus` (`pending`, `confirmed`, `assigned`, `completed`, `cancelled`), `assignedBeauticianId`, `notes`, `createdAt`.
- **Coupon**: `code`, `discountType` (`percentage`, `flat`), `discountValue`, `minOrderAmount`, `maxDiscount`, `expiresAt`, `isActive`.
- **Review**: `id`, `customerName`, `rating`, `comment`, `serviceName`, `date`, `source` (`google_places`, `verified_customer`), `isApproved`.
- **BusinessSettings**: `brandName`, `contactPhone`, `contactEmail`, `workingHoursStart`, `workingHoursEnd`, `slotIntervalMins`, `minOrderAmount`, `cancellationPolicy`, `hygieneProtocols[]`.

***

## 5. Implementation Roadmap (Phases 2 through 12)

- **Phase 1 (Complete)**: Architecture, data model, and user alignment.
- **Phase 2 (Design System & Shell)**: Tailwind theme configuration, luxury font loading (`Playfair Display`, `Plus Jakarta Sans`), Top Bar contract with official logo, and modal/drawer foundations.
- **Phase 3 (Backend & Persistence)**: Express server with comprehensive seeded database for Delhi NCR (6 territories, 14 categories, 35+ realistic services, beauticians, and promo coupons).
- **Phase 4 (Catalog & Custom Package Builder)**: Category grids, detailed service view modal with variants and add-ons, and dynamic bundle discount calculator.
- **Phase 5 (Booking Engine & Pincode Checker)**: Real-time slot availability, address validation against NCR pincodes, coupon redemption, and instant COD booking generation.
- **Phase 6 (Customer Account)**: Phone/OTP simulated sign-in, order history, cancel/reschedule dialogs, and genuine review submission.
- **Phase 7 (Admin Dashboard)**: Operations console with real-time KPIs, visual dispatch board, catalog editor, staff roster, and location toggles.
- **Phase 8 (Google Reviews & Trust)**: Verified Google Business Profile review showcase, write-review modal, and hospital-grade hygiene guarantee section.
- **Phase 9 (Final Polish & Verification)**: Mobile responsiveness audit, zero-pill verification, single-line control check, compilation, and end-to-end booking verification.
