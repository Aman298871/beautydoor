# BEAUTYDOOR PRODUCTION DEPLOYMENT GUIDE

## 1. Environment Configuration

Create a `.env` file in the project root:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Security Secrets
JWT_SECRET=your_super_secure_jwt_secret_key_here_at_least_32_characters

# Online Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_live_your_actual_key_id
RAZORPAY_KEY_SECRET=your_actual_razorpay_secret_key

# Third-Party Notifications (SMS & WhatsApp Provider)
SMS_PROVIDER_API_KEY=your_sms_gateway_api_key
WHATSAPP_BUSINESS_TOKEN=your_whatsapp_cloud_api_token
```

---

## 2. Dual Domain Routing via Nginx Reverse Proxy

To deploy `beautydoor.in` and `admin.beautydoor.in` using a single backend service:

```nginx
# 1. Customer Storefront
server {
    server_name beautydoor.in www.beautydoor.in;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/beautydoor.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/beautydoor.in/privkey.pem;
}

# 2. Administrative Control Portal
server {
    server_name admin.beautydoor.in;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/admin.beautydoor.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.beautydoor.in/privkey.pem;
}
```

---

## 3. Production Build & Process Supervision

1. **Install dependencies**:
   ```bash
   npm install --omit=dev
   ```

2. **Compile production assets**:
   ```bash
   npm run build
   ```

3. **Start process with PM2**:
   ```bash
   pm2 start tsx --name "beautydoor" -- server.ts
   pm2 save
   pm2 startup
   ```

---

## 4. Database Persistence & Backups

The SQLite production database is stored at `/data/beautydoor.db` with Write-Ahead Logging (`WAL` mode) enabled for high write concurrency.

To automate daily backups to secure cloud storage:
```bash
# Add to crontab: 0 2 * * *
sqlite3 /data/beautydoor.db ".backup '/backups/beautydoor_$(date +\%Y\%m\%d).db'"
```
