# BEAUTYDOOR ENTERPRISE ARCHITECTURE

## 1. System Overview
BeautyDoor is a premium at-home beauty and salon booking platform operating across Delhi NCR (Delhi, Gurugram, Noida, Greater Noida, Ghaziabad, Faridabad). The platform is engineered with a strict two-application decoupled architecture communicating with a shared backend API and centralized ACID relational database.

```
                           +-------------------------------------+
                           |            Clients / DNS            |
                           +-------------------------------------+
                                      |                |
                    Host: beautydoor.in                Host: admin.beautydoor.in
                    (or Path: /*)                      (or Path: /admin/*)
                                      v                v
                           +-------------------------------------+
                           |      Express Multi-App Dispatcher   |
                           |            (server.ts)              |
                           +-------------------------------------+
                                      |                |
                     Serves index.html                 Serves admin.html
                                      |                |
                    +--------------------+   +-----------------------+
                    | Customer Storefront|   | Dedicated Admin Portal|
                    | (apps/storefront/) |   |     (apps/admin/)     |
                    +--------------------+   +-----------------------+
                                      \             /
                                       \           /
                                  REST APIs (/api/*)
                                         v
                         +-------------------------------+
                         |   Authentication & Security   |
                         |   - requireAdminAuth (JWT)    |
                         |   - Audit Logging Engine      |
                         |   - Dynamic Pricing Engine    |
                         +-------------------------------+
                                         |
                                         v
                         +-------------------------------+
                         |   Normalized Relational DB    |
                         |   (data/beautydoor.db)        |
                         |   SQLite in WAL Mode          |
                         +-------------------------------+
```

---

## 2. Decoupled Multi-Application Architecture

### Application A: Customer Storefront (`beautydoor.in`)
- **Root Entry**: `/index.html` -> `/apps/storefront/main.tsx`
- **Routing**: Multi-page client router supporting `/`, `/services`, `/services/:category`, `/service/:slug`, `/offers`, `/packages`, `/how-it-works`, `/about`, `/contact`, `/faq`, `/login`, `/account`, `/privacy-policy`, `/terms`, `/cancellation-policy`.
- **Isolation Guarantee**: Zero references to administrative components. No `isAdminView` state or toggles exist in the customer bundle.
- **Top Bar Contract**: Brand Wordmark + 5 Nav Links (Services, Deals, Packages, How It Works, Hygiene/FAQ) + Pincode Quick Selector + Customer Account & Book Appointment Bag.
- **Mobile Ergonomics**: Full slide-out navigation drawer and sticky bottom app bar (Home, Services, Packages, Deals, Bag).

### Application B: Admin Business Control (`admin.beautydoor.in` / `/admin`)
- **Root Entry**: `/admin.html` -> `/apps/admin/main.tsx`
- **Authentication**: Isolated JWT Bearer authentication (`requireAdminAuth`). Default credentials: `admin` / `Admin@BeautyDoor2026`.
- **Zero Component Switching**: Does not render storefront components and provides no "Back to Storefront" button.
- **12 Operational Modules**:
  1. Executive KPIs (Total Bookings, Today Appointments, Revenue, Active Specials).
  2. Live Dispatch Board with automated schedule conflict detection.
  3. Services Catalog & Dynamic Pricing CRUD with variant & add-on management.
  4. Categories Management CRUD (add, edit, disable, reorder).
  5. Promotional Merchandising & Flash Deals with live countdown timers.
  6. Certified Beauticians Roster with territory assignments & leave status.
  7. Delhi NCR Territories & Serviceable Pincodes toggle.
  8. Promotional Coupon Codes CRUD with order limits & expiry.
  9. Customer Directory with lifetime value and order history.
  10. Review Moderation (only genuine verified feedback).
  11. Operational Audit Trail (immutable logging of all mutations with IP).
  12. Business Settings & Operating Policies (Announcement bar, optional membership, referral, working hours, Razorpay keys).

---

## 3. Database Schema Design (ACID Relational)

- **`admin_users`**: Administrative credentials with bcrypt password hashes.
- **`categories`**: Taxonomy with display order and active flags.
- **`services`**: Core catalog with duration, original price, selling price, and deal badges.
- **`service_variants`**: Specific formula options (e.g. Natural Honey vs Italian Rica White Chocolate).
- **`service_addons`**: Add-on treatments (e.g. Cryo Ice Globe massage, under-eye masks).
- **`campaigns`**: Amazon-style time-bounded promotional merchandising with flash deal timers.
- **`coupons`**: Discount codes with minimum order amount and maximum discount caps.
- **`territories`**: Delhi NCR coverage by city, area, pincode, delivery fee, and minimum order.
- **`beauticians`**: Certified staff roster with rating, specialties, assigned territories, and availability.
- **`bookings`**: Full transactional appointment records with pricing breakdown, address, and status.
- **`booking_items`**: Line items linked to bookings with variant and add-on selections.
- **`reviews`**: Genuine customer feedback linked to completed bookings with admin moderation.
- **`audit_logs`**: Chronological log of administrative actions.
- **`settings`**: Dynamic key-value store for business policies.

---

## 4. Business Logic & Security Enforcements

1. **Server-Authoritative Pricing**: Total payable amounts are calculated in the backend (`/api/storefront/calculate-pricing` and `/api/storefront/bookings`). The server rejects client-side price tampering.
2. **Dispatch Conflict Detection**: When assigning a specialist to an appointment, the system queries overlapping bookings on the same date and slot. If a conflict is found, the mutation is rejected with HTTP 400.
3. **Pincode Serviceability Validation**: Bookings are strictly restricted to active Delhi NCR territories. Invalid or out-of-service pincodes are rejected before checkout.
4. **Zero-Fabricated Reviews Policy**: All synthetic Google review quotes, fake customer ratings, and artificial counters have been permanently purged. Only approved feedback from completed appointments is presented.
