# BeautyDoor — Production Render & PostgreSQL Deployment Guide

This document outlines the exact procedure to deploy BeautyDoor to **Render** using a managed **PostgreSQL** database.

---

## 1. Architecture Overview

* **Frontend**: React 19 SPA built with Vite 8 + Tailwind CSS.
  * Storefront entry: `dist/index.html` (served at `/` or `beautydoor.in`).
  * Admin Operations entry: `dist/admin.html` (served at `/admin` or `admin.beautydoor.in`).
* **Backend**: Express + TypeScript (`server.ts`) running on Node.js.
* **Database**: PostgreSQL (via `pg` connection pool with SSL enabled).
* **Package Manager**: `npm` with clean `package-lock.json` (Vite 8 + `esbuild ^0.28.0`).

---

## 2. Render Web Service Configuration

In the Render Dashboard, create a **New Web Service**:

| Parameter | Configuration |
|---|---|
| **Service Type** | **Web Service** |
| **Repository** | `https://github.com/Aman298871/beautydoor` |
| **Branch** | `main` |
| **Environment** | `Node` |
| **Root Directory** | `.` (Leave blank or set to repository root) |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |
| **Plan** | `Free` or `Starter` |
| **Health Check Path** | `/health` |
| **Auto-Deploy** | `Yes` (Triggered on git push to `main`) |

---

## 3. PostgreSQL Database Connection

### If you already have a Render PostgreSQL Database:
1. Open your PostgreSQL database in the Render Dashboard.
2. Under **Connections**, copy the **Internal Database URL** (recommended if both services are in the same Render region) or **External Database URL**.
3. It has the format:
   ```
   postgresql://<user>:<password>@<host>:5432/<dbname>?sslmode=require
   ```
4. Paste this value as the `DATABASE_URL` environment variable in your Web Service settings.

### Connection Pooling & SSL:
* BeautyDoor automatically enables connection pooling with up to 20 concurrent clients.
* Strict SSL/TLS certificate verification is enabled by default for external cloud hosts (`.render.com`, `supabase.co`, `neon.tech`, or when `sslmode=require` is present).
* When connecting via Render's Internal Database URL (`dpg-xxx-a:5432` within the same region), non-SSL private networking is supported without TLS handshake errors.
* Set `DATABASE_SSL_NO_VERIFY=true` only if self-signed or unverified certificates must bypass CA verification.

---

## 4. Environment Variables

Configure these variables under **Environment** in your Render Web Service:

| Variable Name | Required | Default / Example Value | Description |
|---|:---:|---|---|
| `NODE_ENV` | Yes | `production` | Enables production mode and disables dev OTP |
| `PORT` | Yes | `10000` | Port assigned by Render (automatically bound to `0.0.0.0`) |
| `DATABASE_URL` | Yes | `postgresql://...` | Connection string to your Render PostgreSQL database |
| `DATABASE_SSL_NO_VERIFY` | Optional | `true` | Allows self-signed certificates on managed PostgreSQL |
| `JWT_SECRET` | Yes | `generate_strong_64_character_random_secret` | Secret for signing admin sessions. **Startup fails if missing in production.** |
| `ADMIN_USERNAME` | Optional | `admin` | Initial superadmin username provisioned on fresh DB |
| `ADMIN_PASSWORD` | Optional | `YourStrongAdminPassword2026!` | Initial superadmin password. If unset in production, manual DB insert is required. |
| `ADMIN_EMAIL` | Optional | `admin@beautydoor.in` | Administrator notification email |
| `ENABLE_DEV_OTP` | Optional | `false` | Set to `false` in production. Cryptographically secure random 4-digit OTP is used. |
| `CDN_BASE_URL` | Optional | `https://cdn.beautydoor.in` | CDN / Object storage base URL for media assets |
| `RAZORPAY_KEY_ID` | Optional | `rzp_live_...` | Live Razorpay Key ID for online payments |
| `RAZORPAY_KEY_SECRET` | Optional | `your_secret...` | Live Razorpay Key Secret |
| `SMS_PROVIDER_API_KEY` | Optional | `...` | Cell gateway API key for customer OTP SMS dispatch |

---

## 5. Database Schema & Migration Procedure

* **Zero-Touch Automated Migration**:
  * On every server startup, `initDatabase()` connects to PostgreSQL via `DATABASE_URL`.
  * It executes `initPostgresSchema()` using idempotent `CREATE TABLE IF NOT EXISTS` statements for all 18 normalized tables.
* **Idempotent Data Seeding**:
  * `seedEssentialData()` provisions the initial admin account, default business settings, master categories, verified Delhi NCR territories, and default packages.
  * It verifies existence before inserting (`SELECT COUNT(*) ...`). **Existing admin customizations and live booking records are never overwritten on deployment restarts.**

---

## 6. Upload Storage & Asset Management

* **Ephemeral Filesystem Safeguard**: Render web services run in containers with an ephemeral filesystem; any file written to local disk is lost when the container redeploys or restarts.
* **Storage Architecture (`backend/services/storageService.ts`)**:
  * BeautyDoor does NOT write user uploads to the local container filesystem.
  * Services, treatments, campaigns, and package images use external HTTPS URLs or CDN URLs resolved via `storageService.resolveUrl()`.
  * For production custom image uploads, connect an S3-compatible bucket (Cloudflare R2, AWS S3, or Google Cloud Storage) and configure `CDN_BASE_URL`.

---

## 7. Verification Checklist

After deploying on Render:

1. **Check `/health` endpoint**:
   ```bash
   curl -I https://your-service.onrender.com/health
   # Expected: HTTP/1.1 200 OK
   # Body: {"status":"ok","database":"ready","engine":"postgres",...}
   ```
2. **Access Customer Storefront**:
   * Open `https://your-service.onrender.com/` in your browser.
   * Verify catalogue treatments, categories, packages, and pincode checker load properly.
3. **Access Admin Control Panel**:
   * Open `https://your-service.onrender.com/admin`.
   * Log in with your configured `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
   * Verify the dispatch board, analytics KPIs, and pricing audit logs.
4. **Test Rule-Based Chatbot**:
   * Click the floating concierge icon and ask *"How can I book?"* or *"What are your prices?"*.
   * Verify dynamic database-driven answers are returned instantly.
