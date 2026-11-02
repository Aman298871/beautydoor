# BEAUTYDOOR REST API SPECIFICATION

All endpoints return JSON responses. Protected admin endpoints require an `Authorization: Bearer <TOKEN>` header.

---

## 1. Authentication APIs (`/api/auth/*`)

### `POST /api/auth/admin/login`
- **Description**: Authenticate administrative users and issue JWT Bearer token.
- **Request Body**:
  ```json
  { "username": "admin", "password": "Admin@BeautyDoor2026" }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": { "id": "admin-super-1", "username": "admin", "role": "superadmin" }
  }
  ```

### `POST /api/auth/customer/otp/send`
- **Description**: Issue OTP to customer mobile phone.
- **Request Body**: `{ "phone": "9810123456" }`
- **Response**: `{ "success": true, "message": "OTP sent successfully." }`

### `POST /api/auth/customer/otp/verify`
- **Description**: Verify OTP and establish customer session.
- **Request Body**: `{ "phone": "9810123456", "otp": "1234" }`
- **Response**: `{ "success": true, "customer": { "phone": "+91 9810123456" } }`

---

## 2. Customer Storefront APIs (`/api/storefront/*`)

### `GET /api/storefront/catalog`
- **Description**: Returns all active categories, baseline services with variants and add-ons, and global business settings.

### `GET /api/storefront/campaigns`
- **Description**: Returns active and time-valid promotional campaigns for hero banners and countdown deals.

### `GET /api/storefront/deals`
- **Description**: Returns today's discounted treatments and featured deals.

### `GET /api/storefront/territories`
- **Description**: Returns all active Delhi NCR service zones and pincodes.

### `POST /api/storefront/check-pincode`
- **Description**: Validates if a 6-digit Delhi NCR pincode is serviceable.
- **Request Body**: `{ "pincode": "110017" }`
- **Response**: `{ "isServiceable": true, "city": "Delhi", "area": "South Delhi", "deliveryFee": 0 }`

### `POST /api/storefront/calculate-pricing`
- **Description**: Server-side dynamic price calculator applying tier package bundle rules and coupons.
- **Request Body**:
  ```json
  {
    "items": [{ "serviceId": "srv-facial-o3-plus", "variantId": "var-fac-1" }],
    "couponCode": "BEAUTYFIRST",
    "pincode": "110017"
  }
  ```
- **Response**: Returns validated item prices, package discount, coupon savings, delivery fee, and `totalPayable`.

### `POST /api/storefront/bookings`
- **Description**: Atomically reserves an appointment in the database.
- **Request Body**:
  ```json
  {
    "customerName": "Ananya Sen",
    "customerPhone": "9810123456",
    "customerEmail": "ananya@example.com",
    "address": {
      "flat": "Flat 802, Tower 4",
      "landmark": "Near DLF Golf Club",
      "pincode": "122002"
    },
    "appointmentDate": "2026-11-05",
    "appointmentSlot": "11:00 AM - 01:00 PM",
    "paymentMethod": "COD",
    "items": [{ "serviceId": "srv-facial-o3-plus" }]
  }
  ```
- **Response**: Returns `bookingId` (`BD-NCR-XXXX`) and complete `booking` confirmation record.

### `POST /api/storefront/payment/razorpay/order`
- **Description**: Generates a Razorpay payment order for online payments.
- **Request Body**: `{ "amount": 1999, "bookingId": "BD-NCR-2030" }`
- **Response**: `{ "success": true, "orderId": "order_BD_...", "amount": 199900, "currency": "INR", "keyId": "rzp_test_..." }`

### `POST /api/storefront/payment/razorpay/verify`
- **Description**: Verifies payment signature and marks appointment `payment_status: "verified"`.

### `GET /api/storefront/customer/bookings?phone=...`
- **Description**: Retrieves appointment history for a verified customer phone number.

### `POST /api/storefront/customer/cancel`
- **Description**: Cancels an appointment respecting the 4-hour cancellation policy window.

### `POST /api/storefront/customer/reschedule`
- **Description**: Reschedules an existing appointment to a new date and time slot.

---

## 3. Administrative Control APIs (`/api/admin/*`)

All administrative routes require the JWT Bearer token and record immutable audit trail entries in `audit_logs`.

- `GET /api/admin/overview`: Executive metrics (revenue, bookings, active staff).
- `GET /api/admin/bookings`: Full list of appointments with assigned specialists and item details.
- `PATCH /api/admin/bookings/:id/assign`: Assigns a specialist with automatic schedule overlap conflict detection.
- `PATCH /api/admin/bookings/:id/status`: Updates booking status (`pending`, `confirmed`, `assigned`, `in_service`, `completed`, `cancelled`) and payment status (`pending`, `collected`, `verified`).
- `GET /api/admin/services` & `POST /api/admin/services` & `PUT /api/admin/services/:id`: Full catalog and dynamic pricing CRUD.
- `GET /api/admin/categories` & `POST /api/admin/categories` & `PUT /api/admin/categories/:id`: Service categories taxonomy management.
- `GET /api/admin/campaigns` & `POST /api/admin/campaigns` & `PATCH /api/admin/campaigns/:id/publish`: Promotional merchandising engine.
- `GET /api/admin/beauticians` & `POST /api/admin/beauticians` & `PATCH /api/admin/beauticians/:id/status`: Staff roster management.
- `GET /api/admin/territories` & `PATCH /api/admin/territories/:id`: Pincode and service area coverage control.
- `GET /api/admin/coupons` & `POST /api/admin/coupons` & `PATCH /api/admin/coupons/:id/toggle`: Promo code management.
- `GET /api/admin/customers`: Customer directory with lifetime bookings and spend metrics.
- `GET /api/admin/reviews` & `PATCH /api/admin/reviews/:id`: Review moderation engine.
- `GET /api/admin/audit-logs`: Chronological audit log with user, action, resource, timestamp, and IP.
- `GET /api/admin/settings` & `PATCH /api/admin/settings`: Global business settings (announcement bar, membership, referral, policies, Razorpay credentials).
