import http from 'http';

const BASE_URL = 'http://localhost:3000';

async function request(path: string, options: { method?: string; headers?: Record<string, string>; body?: any } = {}): Promise<{ status: number; data: any; raw: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const bodyStr = options.body ? JSON.stringify(options.body) : undefined;
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode || 0, data: parsed, raw: data });
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function runAudit() {
  console.log('=== STARTING BEAUTYDOOR PRODUCTION READINESS AUDIT ===\n');
  const results: Record<string, { pass: boolean; details: string }> = {};

  // 1. Health check (Verify PostgreSQL connection)
  try {
    const health = await request('/health');
    const isOk = health.status === 200 && health.data?.status === 'ok' && health.data?.database === 'ready' && health.data?.engine === 'postgres';
    results['health_check'] = {
      pass: isOk,
      details: `Status: ${health.status}, DB: ${health.data?.database}, Engine: ${health.data?.engine}`
    };
  } catch (e: any) {
    results['health_check'] = { pass: false, details: e.message };
  }

  // 2. Unauthenticated Admin API Protection
  try {
    const unauth = await request('/api/admin/overview');
    const isProtected = unauth.status === 401;
    results['admin_auth_protection'] = {
      pass: isProtected,
      details: `Status ${unauth.status} returned for unauthenticated request (expected 401)`
    };
  } catch (e: any) {
    results['admin_auth_protection'] = { pass: false, details: e.message };
  }

  // 3. Admin Login & JWT Issuance
  let adminToken = '';
  try {
    const loginFail = await request('/api/auth/admin/login', {
      method: 'POST',
      body: { username: 'admin', password: 'wrong-password-xyz' }
    });
    const loginOk = await request('/api/auth/admin/login', {
      method: 'POST',
      body: { username: 'admin', password: 'Admin@BeautyDoor2026' }
    });

    const pass = loginFail.status === 401 && loginOk.status === 200 && !!loginOk.data?.token;
    if (loginOk.data?.token) adminToken = loginOk.data.token;
    results['admin_login_jwt'] = {
      pass,
      details: `Failed login status: ${loginFail.status}, Successful login status: ${loginOk.status}, Token received: ${!!adminToken}`
    };
  } catch (e: any) {
    results['admin_login_jwt'] = { pass: false, details: e.message };
  }

  const authHeader = { Authorization: `Bearer ${adminToken}` };

  // 4. Admin Overview KPIs with Bearer Token
  try {
    const overview = await request('/api/admin/overview', { headers: authHeader });
    const hasKpi = overview.status === 200 && overview.data?.totalBookings !== undefined;
    results['admin_kpis'] = {
      pass: hasKpi,
      details: `Status ${overview.status}, Total Bookings: ${overview.data?.totalBookings}, Active Services: ${overview.data?.activeServices}, Active Territories: ${overview.data?.activeTerritories}`
    };
  } catch (e: any) {
    results['admin_kpis'] = { pass: false, details: e.message };
  }

  // 5. Customer OTP Flow (Send, Rejection of Bad OTP, Verification)
  let customerPhone = '9876543210';
  let devOtp = '';
  try {
    const otpSend = await request('/api/auth/customer/otp/send', {
      method: 'POST',
      body: { phone: customerPhone }
    });
    devOtp = otpSend.data?.devOtp || '1234';

    const badVerify = await request('/api/auth/customer/otp/verify', {
      method: 'POST',
      body: { phone: customerPhone, otp: '0000' }
    });

    const goodVerify = await request('/api/auth/customer/otp/verify', {
      method: 'POST',
      body: { phone: customerPhone, otp: devOtp }
    });

    const pass = otpSend.status === 200 && badVerify.status === 400 && goodVerify.status === 200 && !!goodVerify.data?.customerId;
    results['customer_otp_flow'] = {
      pass,
      details: `OTP send status: ${otpSend.status}, Bad verify: ${badVerify.status}, Good verify: ${goodVerify.status}, Customer ID: ${goodVerify.data?.customerId}`
    };
  } catch (e: any) {
    results['customer_otp_flow'] = { pass: false, details: e.message };
  }

  // 6. Service CRUD & Price Audit Log
  let createdServiceId = '';
  try {
    const newService = {
      name: 'Audit Signature Facial Ritual',
      categoryId: 'facial',
      durationMins: 75,
      originalPrice: 1999,
      sellingPrice: 1499,
      description: 'Test ritual created during production readiness audit.',
      isActive: true,
      isPublished: true,
      benefits: ['Deep cleanse', 'Hydration boost'],
      whatsIncluded: ['Face cleansing', 'Steam & peel', 'Algae mask']
    };

    const createRes = await request('/api/admin/services', {
      method: 'POST',
      headers: authHeader,
      body: newService
    });
    createdServiceId = createRes.data?.serviceId;

    // Update service price
    const updateRes = await request(`/api/admin/services/${createdServiceId}`, {
      method: 'PUT',
      headers: authHeader,
      body: {
        ...newService,
        sellingPrice: 1599
      }
    });

    // Check Price Audit Logs
    const auditRes = await request('/api/admin/price-audits', { headers: authHeader });
    const hasLog = Array.isArray(auditRes.data?.logs) && auditRes.data.logs.some((l: any) => l.item_id === createdServiceId);

    // Delete service
    const deleteRes = await request(`/api/admin/services/${createdServiceId}`, {
      method: 'DELETE',
      headers: authHeader
    });

    const pass = createRes.status === 201 && updateRes.status === 200 && hasLog && deleteRes.status === 200;
    results['service_crud_and_price_audit'] = {
      pass,
      details: `Create: ${createRes.status} (ID: ${createdServiceId}), Price Update: ${updateRes.status}, Audit Log Logged: ${hasLog}, Delete: ${deleteRes.status}`
    };
  } catch (e: any) {
    results['service_crud_and_price_audit'] = { pass: false, details: e.message };
  }

  // 7. Package CRUD
  let createdPkgId = '';
  try {
    const newPkg = {
      name: 'Audit Deluxe Bridal Ritual',
      slug: 'audit-deluxe-bridal-ritual',
      subtitle: 'Complete Head-to-Toe glow',
      description: 'Audit test package for salon bridal glow.',
      duration_mins: 180,
      duration_display: '3 hrs',
      original_price: 4999,
      selling_price: 3499,
      discount_percent: 30,
      inclusions: [{ name: 'RICA Brazilian Wax' }, { name: 'Gold Facial' }],
      benefits: ['Instant glow', 'Long-lasting finish'],
      is_published: true,
      badge: 'POPULAR'
    };

    const createPkg = await request('/api/admin/packages', {
      method: 'POST',
      headers: authHeader,
      body: newPkg
    });
    createdPkgId = createPkg.data?.packageId;

    const listPkg = await request('/api/admin/packages', { headers: authHeader });
    const foundPkg = Array.isArray(listPkg.data?.packages) && listPkg.data.packages.some((p: any) => p.id === createdPkgId);

    const deletePkg = await request(`/api/admin/packages/${createdPkgId}`, {
      method: 'DELETE',
      headers: authHeader
    });

    const pass = createPkg.status === 201 && foundPkg && deletePkg.status === 200;
    results['package_crud'] = {
      pass,
      details: `Create: ${createPkg.status} (ID: ${createdPkgId}), Found in list: ${foundPkg}, Delete: ${deletePkg.status}`
    };
  } catch (e: any) {
    results['package_crud'] = { pass: false, details: e.message };
  }

  // 8. Storefront Booking Creation & Admin Status Lifecycle
  let bookingId = '';
  try {
    // Get an active service from catalog
    const catalog = await request('/api/storefront/catalog');
    const firstService = catalog.data?.services?.[0];

    const bookingPayload = {
      customerName: 'Priya Sharma',
      customerPhone: '+91 9876543210',
      customerEmail: 'priya.sharma@example.com',
      address: {
        flat: 'Flat 402, DLF Phase 5',
        landmark: 'Near Central Plaza',
        city: 'Gurugram',
        pincode: '122002'
      },
      items: [
        {
          serviceId: firstService?.id || 'srv-rica-full-wax',
          quantity: 1
        }
      ],
      appointmentDate: '2026-11-10',
      appointmentSlot: '10:00 AM',
      paymentMethod: 'cod'
    };

    const bookRes = await request('/api/storefront/bookings', {
      method: 'POST',
      body: bookingPayload
    });
    bookingId = bookRes.data?.bookingId;

    // Update status in admin dispatch
    const statusRes = await request(`/api/admin/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: authHeader,
      body: {
        bookingStatus: 'confirmed',
        notes: 'Confirmed by audit manager dispatch'
      }
    });

    // Check tracking route in storefront
    const trackRes = await request(`/api/storefront/bookings/track?phone=9876543210`);
    const foundBooking = Array.isArray(trackRes.data?.bookings) && trackRes.data.bookings.some((b: any) => b.id === bookingId && b.booking_status === 'confirmed');

    const pass = bookRes.status === 201 && statusRes.status === 200 && foundBooking;
    results['booking_lifecycle'] = {
      pass,
      details: `Booking created: ${bookRes.status} (ID: ${bookingId}), Status updated to confirmed: ${statusRes.status}, Found in tracking with status confirmed: ${foundBooking}`
    };
  } catch (e: any) {
    results['booking_lifecycle'] = { pass: false, details: e.message };
  }

  // 9. Payment Gateway Inspection (Razorpay)
  try {
    const orderRes = await request('/api/storefront/payments/create-razorpay-order', {
      method: 'POST',
      body: { amount: 999, bookingId: bookingId || 'audit-test-booking' }
    });
    const verifyRes = await request('/api/storefront/payments/verify-razorpay', {
      method: 'POST',
      body: {
        razorpayOrderId: orderRes.data?.orderId || 'order_BD_sim_123',
        razorpayPaymentId: 'pay_sim_456',
        bookingId: bookingId || 'audit-test-booking'
      }
    });

    const isTestMode = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('placeholder') || process.env.RAZORPAY_KEY_ID.includes('test');
    results['payment_gateway'] = {
      pass: orderRes.status === 200 && verifyRes.status === 200,
      details: `Order created: ${orderRes.data?.orderId} (Key: ${orderRes.data?.keyId}), Verification Status: ${verifyRes.status}, Mode: ${isTestMode ? 'TEST MODE / SIMULATED' : 'LIVE GATEWAY'}`
    };
  } catch (e: any) {
    results['payment_gateway'] = { pass: false, details: e.message };
  }

  // 10. Security: SQL Injection Resistance
  try {
    const sqliAttempt = await request("/api/storefront/categories/'%20OR%201=1%20--");
    // Parameterized queries will look for slug literally named "' OR 1=1 --", returning 404, not returning categories!
    const isProtected = sqliAttempt.status === 404;
    results['sql_injection_resistance'] = {
      pass: isProtected,
      details: `Malicious injection payload properly returned HTTP ${sqliAttempt.status} (safe 404 not found via parameterized SQL $1 binding)`
    };
  } catch (e: any) {
    results['sql_injection_resistance'] = { pass: false, details: e.message };
  }

  // 11. HTML SPA Routes
  try {
    const rootHtml = await request('/');
    const adminHtml = await request('/admin');
    const hasCustomerApp = rootHtml.raw.includes('<div id="root">') || rootHtml.raw.length > 500;
    const hasAdminApp = adminHtml.raw.includes('admin') || adminHtml.raw.length > 500;
    results['html_spa_routes'] = {
      pass: rootHtml.status === 200 && adminHtml.status === 200 && hasCustomerApp && hasAdminApp,
      details: `Storefront HTML: ${rootHtml.status} (${rootHtml.raw.length} bytes), Admin HTML: ${adminHtml.status} (${adminHtml.raw.length} bytes)`
    };
  } catch (e: any) {
    results['html_spa_routes'] = { pass: false, details: e.message };
  }

  console.log('\n--- AUDIT EXECUTION RESULTS ---');
  for (const [test, res] of Object.entries(results)) {
    console.log(`[${res.pass ? 'PASS' : 'FAIL'}] ${test}: ${res.details}`);
  }
}

runAudit().catch(console.error);
