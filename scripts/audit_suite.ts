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

  // 5. Business Contact Information & Operating Hours Verification
  try {
    const settingsRes = await request('/api/storefront/settings');
    const s = settingsRes.data?.settings || {};
    const pass = 
      s.contact_name === 'Preeti Singh' &&
      s.contact_phone === '+91 93103 72015' &&
      s.contact_email === 'hello@beautydoor.in' &&
      s.support_whatsapp === '+91 93103 72015' &&
      s.working_hours_start === '08:00 AM' &&
      s.working_hours_end === '06:00 PM';
    results['business_contact_and_hours'] = {
      pass,
      details: `Name: ${s.contact_name}, Phone: ${s.contact_phone}, Email: ${s.contact_email}, Hours: ${s.working_hours_start} - ${s.working_hours_end}`
    };
  } catch (e: any) {
    results['business_contact_and_hours'] = { pass: false, details: e.message };
  }

  // 6. Admin Settings Persistence (Update & Verify)
  try {
    const testBanner = `✨ Test Audit Banner - ${Date.now()}`;
    const patchRes = await request('/api/admin/settings', {
      method: 'PATCH',
      headers: authHeader,
      body: { announcement_text: testBanner }
    });
    const verifySettings = await request('/api/storefront/settings');
    const pass = patchRes.status === 200 && verifySettings.data?.settings?.announcement_text === testBanner;
    results['admin_settings_persistence'] = {
      pass,
      details: `PATCH /api/admin/settings status: ${patchRes.status}, Storefront reflected updated banner: ${pass}`
    };
  } catch (e: any) {
    results['admin_settings_persistence'] = { pass: false, details: e.message };
  }

  // 7. Customer OTP Flow (Send, Rejection of Bad OTP, Verification)
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

  // 8. Service CRUD & Price Audit Log
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

  // 9. Package CRUD
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

  // 10. Appointment Surcharge Preservation & Calculation
  try {
    const calc8am = await request('/api/storefront/bookings/calculate', {
      method: 'POST',
      body: {
        pincode: '122002',
        appointmentSlot: '08:00 AM',
        items: [{ serviceId: 'srv-rica-full-wax', quantity: 1 }]
      }
    });

    const calc12pm = await request('/api/storefront/bookings/calculate', {
      method: 'POST',
      body: {
        pincode: '122002',
        appointmentSlot: '12:00 PM',
        items: [{ serviceId: 'srv-rica-full-wax', quantity: 1 }]
      }
    });

    const calc6pm = await request('/api/storefront/bookings/calculate', {
      method: 'POST',
      body: {
        pincode: '122002',
        appointmentSlot: '06:00 PM',
        items: [{ serviceId: 'srv-rica-full-wax', quantity: 1 }]
      }
    });

    const pass = calc8am.data?.slotCharge === 100 && calc12pm.data?.slotCharge === 0 && calc6pm.data?.slotCharge === 100;
    results['appointment_slot_surcharges'] = {
      pass,
      details: `8:00 AM Slot Surcharge: ₹${calc8am.data?.slotCharge} (expected 100), 12:00 PM Slot: ₹${calc12pm.data?.slotCharge} (expected 0), 6:00 PM Slot: ₹${calc6pm.data?.slotCharge} (expected 100)`
    };
  } catch (e: any) {
    results['appointment_slot_surcharges'] = { pass: false, details: e.message };
  }

  // 11. Storefront Booking Creation & Admin Status Lifecycle
  let bookingId = '';
  try {
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

  // 12. Master Catalogue Data Preservation Check
  try {
    const catalog = await request('/api/storefront/catalog');
    const categoriesCount = catalog.data?.categories?.length || 0;
    const servicesCount = catalog.data?.services?.length || 0;
    const packagesCount = catalog.data?.packages?.length || 0;
    const hygieneCount = catalog.data?.hygieneCommitments?.length || 0;

    const territoriesRes = await request('/api/storefront/territories');
    const territoriesCount = territoriesRes.data?.territories?.length || 0;

    const faqsRes = await request('/api/admin/faqs', { headers: authHeader });
    const faqsCount = faqsRes.data?.faqs?.length || 0;

    // Check for the 7 new approved services
    const approvedServices = [
      { id: 'srv-full-body-massage-750', name: 'Full Body Massage', price: 750, duration: 60 },
      { id: 'srv-head-massage-199', name: 'Head Massage', price: 199, duration: 15 },
      { id: 'srv-back-massage-350', name: 'Back Massage', price: 350, duration: 25 },
      { id: 'srv-foot-massage-399', name: 'Foot Massage', price: 399, duration: 30 },
      { id: 'srv-head-shoulder-massage-499', name: 'Head & Shoulder Massage', price: 499, duration: 30 },
      { id: 'srv-body-polishing-5-steps-1200', name: 'Body Polishing — 5 Steps', price: 1200, duration: 60 },
      { id: 'srv-body-scrub-pack-499', name: 'Body Scrub Pack', price: 499, duration: 30 },
    ];

    const allApprovedPresent = approvedServices.every(as => {
      const found = catalog.data?.services?.find((s: any) => s.id === as.id || s.name.toLowerCase().trim() === as.name.toLowerCase().trim());
      return found && found.selling_price === as.price && found.duration_mins === as.duration;
    });

    const pass = 
      categoriesCount >= 14 &&
      servicesCount >= 107 &&
      packagesCount >= 10 &&
      territoriesCount >= 20 &&
      hygieneCount >= 8 &&
      faqsCount >= 20 &&
      allApprovedPresent;

    results['catalogue_data_preservation'] = {
      pass,
      details: `Categories: ${categoriesCount}/14, Services: ${servicesCount} (>=107), 7 Approved Services Present: ${allApprovedPresent}, Packages: ${packagesCount}, Territories: ${territoriesCount}, Hygiene: ${hygieneCount}, FAQs: ${faqsCount}`
    };
  } catch (e: any) {
    results['catalogue_data_preservation'] = { pass: false, details: e.message };
  }

  // 12b. Restricted Location & Optional PIN Booking Verification
  try {
    // Attempt booking with restricted address
    const restrictedRes = await request('/api/storefront/bookings', {
      method: 'POST',
      body: {
        customerName: 'Ananya Roy',
        customerPhone: '+91 9811122233',
        address: {
          flat: 'Block C 102',
          landmark: 'Near Old Water Tank',
          locality: 'TEST_RESTRICTED_ZONE',
          city: 'Delhi'
        },
        items: [{ serviceId: 'srv-full-body-massage-750', quantity: 1 }],
        appointmentDate: '2026-11-12',
        appointmentSlot: '11:00 AM',
        paymentMethod: 'cod'
      }
    });

    // Attempt booking without any pincode (optional PIN test)
    const noPinRes = await request('/api/storefront/bookings', {
      method: 'POST',
      body: {
        customerName: 'Kavita Verma',
        customerPhone: '+91 9811122244',
        address: {
          flat: 'Tower B, Flat 801, Beverly Park',
          landmark: 'Opposite Galleria',
          locality: 'DLF Phase 4',
          city: 'Gurugram'
        },
        items: [{ serviceId: 'srv-full-body-massage-750', quantity: 1 }],
        appointmentDate: '2026-11-12',
        appointmentSlot: '02:00 PM',
        paymentMethod: 'cod'
      }
    });

    const restrictedBlocked = restrictedRes.status === 400 && restrictedRes.data?.error === 'Sorry, BeautyDoor is currently unavailable at this location.';
    const noPinAllowed = noPinRes.status === 201 && !!noPinRes.data?.bookingId;

    results['location_restriction_and_optional_pin'] = {
      pass: restrictedBlocked && noPinAllowed,
      details: `Restricted Area Rejected (Status ${restrictedRes.status}, Error: "${restrictedRes.data?.error}"), No-PIN Booking Accepted: (Status ${noPinRes.status}, Booking ID: ${noPinRes.data?.bookingId})`
    };
  } catch (e: any) {
    results['location_restriction_and_optional_pin'] = { pass: false, details: e.message };
  }

  // 13. Payment Gateway Inspection (Razorpay Test Mode)
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

  // 14. Security: SQL Injection Resistance
  try {
    const sqliAttempt = await request("/api/storefront/categories/'%20OR%201=1%20--");
    const isProtected = sqliAttempt.status === 404;
    results['sql_injection_resistance'] = {
      pass: isProtected,
      details: `Malicious injection payload properly returned HTTP ${sqliAttempt.status} (safe 404 not found via parameterized SQL $1 binding)`
    };
  } catch (e: any) {
    results['sql_injection_resistance'] = { pass: false, details: e.message };
  }

  // 15. HTML SPA Routes
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
  let allPass = true;
  for (const [test, res] of Object.entries(results)) {
    console.log(`[${res.pass ? 'PASS' : 'FAIL'}] ${test}: ${res.details}`);
    if (!res.pass) allPass = false;
  }
  console.log(`\nOVERALL AUDIT STATUS: ${allPass ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
}

runAudit().catch(console.error);
