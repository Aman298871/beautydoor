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

## 5. Implementation Roadmap
- [x] Phase 1: Architecture, data model, and user alignment.
- [x] Phase 2: Design system & luxury typography (`Playfair Display`, `Plus Jakarta Sans`, `#4A0417` royal wine).
- [x] Phase 3: Production backend persistence with SQLite in WAL mode, comprehensive Delhi NCR territories, 14 categories, catalog, beauticians, campaigns.
- [x] Phase 4: Dynamic catalog, real-time filters, variant selectors, add-on configurator, and dynamic bundle discount builder.
- [x] Phase 5: Multi-step booking drawer, real-time slot conflict detector, Cash on Delivery + Razorpay gateway endpoints.
- [x] Phase 6: Customer account and booking tracking.
- [x] Phase 7: Executive Admin Portal (`admin.beautydoor.in`) with dispatch conflict engine, service catalog CRUD, campaigns, coupons, and staff roster.
- [x] Phase 8: Genuine verified review moderation and hospital-grade hygiene guarantees.
- [x] Phase 9: Custom Rule-Based Customer FAQ Chatbot on `beautydoor.in` (12 predefined buttons, dynamic answers, Hinglish keyword matcher, WhatsApp/phone links).
- [x] Phase 10: Custom Rule-Based Admin Operations Chatbot on `admin.beautydoor.in` (10 step-by-step guides, dashboard tab shortcuts).
- [x] Phase 11: Admin Chatbot FAQ Knowledgebase Management section with CRUD, keyword alias configuration, and live interactive test bench.
- [x] Phase 12: Zero-paid AI compliance audit: 100% deterministic, rule-based, database-driven solution.

***

## 6. Custom Rule-Based FAQ Chatbots Architecture

### A. Customer Chatbot (`beautydoor.in`)
- **Launcher**: Luxury floating widget in deep burgundy (`#4A0417`) and gold with pulse indicator and notification badge.
- **Welcome Message**: *"Hi! Welcome to BeautyDoor ❤️ How can I help you today?"*
- **12 Predefined Questions**:
  1. How can I book a service?
  2. What services do you offer? *(Dynamic: queries active services & categories)*
  3. What are the service prices? *(Dynamic: computes live category starting rates)*
  4. Do you provide at-home services? *(Explains single-use disposables, sanitization & doorstep setup)*
  5. Is my area serviceable? *(Dynamic: queries live Delhi NCR territories & pincodes)*
  6. What payment methods are available? *(Dynamic: returns Cash After Service / COD & Razorpay)*
  7. How can I cancel my booking? *(Dynamic: returns 4-hour complimentary policy)*
  8. How can I reschedule my booking?
  9. How can I track my booking?
  10. What offers are currently available? *(Dynamic: returns active campaigns & coupons)*
  11. How can I contact customer support? *(Dynamic: returns live phone, WhatsApp link, and working hours)*
  12. Other questions. *(Prompts text entry or one-tap WhatsApp / Call concierge)*
- **Keyword & Intent Matcher**: High-precision normalization supporting Hindi/Hinglish terms (*"ghar pe aate ho"*, *"paise kitne lagenge"*, *"COD available"*, *"booking kaise kare"*, *"kya offer hai"*, etc.).
- **Deterministic Fallback**: Shows *"Sorry, I couldn't find an answer to that question. Please select one of the options below or contact our support team."* along with suggested question pills and direct WhatsApp/Phone call links.

### B. Admin Operations Chatbot (`admin.beautydoor.in`)
- **Access**: Strictly isolated and private to authenticated staff (`/api/faq/admin` guarded by JWT).
- **Welcome Message**: *"Welcome to BeautyDoor Admin Help. What would you like assistance with?"*
- **10 Predefined Step-by-Step Guides**:
  1. How to add a service?
  2. How to update service pricing?
  3. How to create a promotion?
  4. How to create a coupon?
  5. How to manage bookings?
  6. How to assign professionals?
  7. How to manage service areas?
  8. How to update homepage banners?
  9. How to check payment records?
  10. How to manage customer accounts?
- **Interactive Action Shortcuts**: Contextual buttons (e.g. *"Go to Services Catalog"*, *"Go to Dispatch & Bookings"*) that navigate directly between dashboard tabs.

### C. Admin FAQ Knowledgebase Management
- Accessible via new **Chatbot FAQs** tab in the Admin Dashboard.
- **Complete CRUD**: Add, edit, delete questions, answers, and display order.
- **Audience Segregation**: Customer FAQs and Admin Help FAQs stored and managed independently.
- **Keyword Alias Configuration**: Configure custom keyword variations and Hinglish aliases.
- **Dynamic Handlers**: Configure whether an FAQ executes dynamic queries (`get_services_catalog`, `get_service_pricing`, `get_service_areas`, `get_payment_methods`, `get_cancellation_policy`, `get_active_offers`, `get_support_contact`).
- **Live Interactive Test Bench**: Instant test pane inside the admin dashboard to evaluate customer and admin queries in real time.
- **Strict Constraint**: Zero generative AI calls, zero token consumption, deterministic and instant.

***

## 6. Video QA Feedback & Acceptance Results

### A. WhatsApp Booking Video QA & Error Resolution (01:00 Crash)
- **Incident**: At timestamp `01:00` in `WhatsApp_Video_2026-11-07_at_3.37.48_PM__1__69072b6b.mp4`, the user attempted to confirm an order without a matched territory PIN code, which triggered a fatal error: `Cannot read properties of undefined (reading 'min_order_amount')`.
- **Root Cause**: Backend `/api/bookings` directly accessed `territory.min_order_amount`, `territory.delivery_fee`, `territory.area_name`, and `territory.city` without safe navigation or city-level fallbacks when `territory` was `null`.
- **Fix Implemented**:
  1. Safe navigation implemented throughout `backend/routes/storefrontRoutes.ts` with explicit city fallbacks (`territory?.min_order_amount || cityMinOrder`).
  2. Owner-approved city minimum order table enforced across both backend and frontend:
     - **Delhi**: ₹1,000 (Orders of ₹3,000 proceed with zero error)
     - **Gurugram**: ₹1,500
     - **Noida / Greater Noida**: ₹1,500
     - **Ghaziabad**: ₹1,500
     - **Faridabad**: ₹1,500
  3. Safe delivery fee fallback (`territory ? territory.delivery_fee : 0`) and address mapping (`territory?.area_name || address.city`).
  4. Fully verified via automated test script `scripts/verify_video_feedback.ts` (8/8 tests passing).

### B. Mobile Checkout Overlay & Chatbot Collision (00:00 - 00:20)
- **Issue**: Floating chatbot button was fixed at `bottom-6 right-6 z-50`, obscuring the sticky "Enter Address" and "Place Booking" CTA buttons in `BookingDrawer`.
- **Fix Implemented**:
  1. Passed `isDrawerOpen={isCartOpen}` to `CustomerChatbot.tsx`. When the drawer is open, the chatbot completely hides (`return null`).
  2. Removed decorative pulsing green dot per anti-slop guidelines (§1.E).
  3. Added safe-area bottom padding `pb-36 sm:pb-40` inside `BookingDrawer` scrollable container so sticky footers never cover form fields or payment options on mobile viewports (320px–430px).

### C. Back Navigation & Step Transition
- **Issue**: In the customer video, pressing "Back" or navigating between steps caused unexpected drawer behavior or underlying element jumps.
- **Fix Implemented**:
  1. Added header "← Back" button on steps 2, 3, and 4.
  2. Upgraded step indicator into clickable, interactive breadcrumbs (1. Rituals $\to$ 2. Address $\to$ 3. Slot $\to$ 4. Review).
  3. Explicit `type="button"` and `onClick={() => setStep((prev) => Math.max(1, prev - 1) as any)}` in sticky footer.
  4. All form fields (`flat`, `landmark`, `area`, `city`, `pincode`, `selectedDate`, `selectedSlot`, `customerName`, `customerPhone`) remain completely preserved in React state across back and forward steps.

### D. Custom Package Acceptance Criteria
- **Customer Feature**: Customers can customize any official package or build their own bespoke package:
  1. Open any existing package via "Customize" button on package cards or inside the Details modal.
  2. View all included treatments with individual duration and price tags.
  3. Remove any included treatment (down to minimum 1).
  4. Add eligible treatments across Waxing, Facials, Cleanup, Mani-Pedi, Massage, Bleach & Detan from the catalogue.
  5. Dynamic real-time recalculation of duration, subtotal, tiered package savings (5% to 20%), and final price.
  6. One-click "Reset Defaults" restores original package contents.
  7. Add customized package to ritual bag; backend validates service IDs, prices, calculates discounts, and stores full itemization in `booking_items`.

### E. Stylebee Aesthetic Refinements
- **Inspiration from Stylebee Desktop Reference**:
  1. Clean, luxury service card typography with unboxed metadata.
  2. Star ratings with verified review indicators: `★ 4.8 · 120+ Verified Doorstep Sessions`.
  3. Benefit highlight bullets on service cards: `100% Single-use sealed disposables` and `Certified background-verified specialist`.
  4. Refined tabular pricing baselines with clear strikethrough original prices.

***

## 7. Verification & Audit Results

- **Video QA Verification Suite (`scripts/verify_video_feedback.ts`)**: 8/8 Tests Passed (100%).
- **Full Production Audit Suite (`scripts/audit_suite.ts`)**: 16/16 Tests Passed (100%).
- **Compilation Check (`compile_applet`)**: Build succeeded.
- **Lint Check (`lint_applet` / `tsc --noEmit`)**: 0 errors.
