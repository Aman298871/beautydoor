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

async function runVideoFeedbackVerification() {
  console.log('=====================================================================');
  console.log('   BEAUTYDOOR — VIDEO QA FEEDBACK & ACCEPTANCE TEST SUITE');
  console.log('=====================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function report(name: string, passed: boolean, message: string) {
    totalTests++;
    if (passed) {
      passedTests++;
      console.log(`[PASS] ${name}: ${message}`);
    } else {
      console.error(`[FAIL] ${name}: ${message}`);
    }
  }

  // 1. Check Server & PostgreSQL Health
  try {
    const health = await request('/health');
    report(
      'Server & Database Health',
      health.status === 200 && health.data?.database === 'ready',
      `Server ready, engine=${health.data?.engine}`
    );
  } catch (err: any) {
    report('Server & Database Health', false, err.message);
  }

  // 2. Verify Territories Minimum Order Amounts in DB
  try {
    const terRes = await request('/api/storefront/territories');
    const ters: any[] = terRes.data?.territories || [];
    const delhiTers = ters.filter(t => t.city.toLowerCase().includes('delhi'));
    const ggnTers = ters.filter(t => t.city.toLowerCase().includes('gurugram'));
    const noidaTers = ters.filter(t => t.city.toLowerCase().includes('noida'));
    const fbdTers = ters.filter(t => t.city.toLowerCase().includes('faridabad'));

    const delhiCorrect = delhiTers.every(t => t.min_order_amount === 1000);
    const ggnCorrect = ggnTers.every(t => t.min_order_amount === 1500);
    const noidaCorrect = noidaTers.every(t => t.min_order_amount === 1500);
    const fbdCorrect = fbdTers.every(t => t.min_order_amount === 1500);

    report(
      'Territories Minimum Orders Alignment',
      delhiCorrect && ggnCorrect && noidaCorrect && fbdCorrect,
      `Delhi=₹1,000 (${delhiTers.length} areas), Gurugram=₹1,500 (${ggnTers.length}), Noida=₹1,500 (${noidaTers.length}), Faridabad=₹1,500 (${fbdTers.length})`
    );
  } catch (err: any) {
    report('Territories Minimum Orders Alignment', false, err.message);
  }

  // 3. Reproduce Video Timestamp 01:00 Crash Test:
  // User creates a Delhi booking with no pincode, ₹3,000 subtotal (O3+ Facial / services)
  // MUST NOT throw `Cannot read properties of undefined (reading 'min_order_amount')`
  try {
    const bookingPayload = {
      customerName: 'Pooja Verma',
      customerPhone: '+91 98111 22334',
      customerEmail: 'pooja@example.com',
      address: {
        flat: 'Apartment 502, Tower 4, Royal Enclave',
        landmark: 'Near Central Park',
        area: 'South Delhi',
        city: 'Delhi',
        pincode: '' // Video showed empty/unmatched pincode
      },
      items: [
        {
          serviceId: 'srv-facial-o3-bridal-glow-vit-c', // As seen in video at 00:35
          isPackage: false
        },
        {
          serviceId: 'srv-wax-full-arms-legs',
          isPackage: false
        }
      ],
      appointmentDate: '2028-12-10',
      appointmentSlot: '11:00 AM',
      paymentMethod: 'COD',
      notes: 'Customer video reproduction test'
    };

    const res = await request('/api/bookings', { method: 'POST', body: bookingPayload });
    const success = (res.status === 200 || res.status === 201) && (res.data?.booking?.id || res.data?.bookingId);
    const hasMinOrderCrash = JSON.stringify(res.data).includes('min_order_amount');

    report(
      'Zero min_order_amount Crash (Video 01:00 Reproduce)',
      success && !hasMinOrderCrash,
      `Status: ${res.status}, Booking ID: ${res.data?.booking?.id || res.data?.bookingId || 'none'}`
    );
  } catch (err: any) {
    report('Zero min_order_amount Crash (Video 01:00 Reproduce)', false, err.message);
  }

  // 4. Minimum Order Acceptance: Delhi ₹3,000 MUST NOT show minimum order error
  try {
    const delhiOrder = {
      customerName: 'Ritika Sen',
      customerPhone: '+91 98100 12345',
      address: {
        flat: 'House 12, Block C',
        area: 'Vasant Vihar',
        city: 'Delhi',
        pincode: '110057'
      },
      items: [
        {
          serviceId: 'srv-facial-o3-bridal-glow-vit-c', // ₹1,999
          isPackage: false
        },
        {
          serviceId: 'srv-wax-full-arms-legs', // ₹1,099
          isPackage: false
        }
      ],
      appointmentDate: '2028-12-10',
      appointmentSlot: '02:00 PM',
      paymentMethod: 'COD'
    };

    const res = await request('/api/bookings', { method: 'POST', body: delhiOrder });
    report(
      'Delhi ₹3,000 Order Acceptance (No Min Order Block)',
      res.status === 200 || res.status === 201,
      `Delhi order of ₹${res.data?.booking?.subtotal || 3098} succeeded with status ${res.status}`
    );
  } catch (err: any) {
    report('Delhi ₹3,000 Order Acceptance (No Min Order Block)', false, err.message);
  }

  // 5. Minimum Order Enforcement: Delhi order of ₹600 (below ₹1,000) must be rejected
  try {
    const lowOrder = {
      customerName: 'Test Low',
      customerPhone: '+91 98100 99999',
      address: {
        flat: 'Test Flat',
        area: 'Saket',
        city: 'Delhi',
        pincode: '110017'
      },
      items: [
        {
          serviceId: 'srv-threading-eyebrow', // ₹99
          isPackage: false
        }
      ],
      appointmentDate: '2028-12-10',
      appointmentSlot: '11:00 AM',
      paymentMethod: 'COD'
    };

    const res = await request('/api/bookings', { method: 'POST', body: lowOrder });
    const isRejected = res.status === 400 && res.data?.error?.includes('Minimum order amount');
    report(
      'Delhi Sub-₹1,000 Order Rejection Rule',
      isRejected,
      `Correctly rejected with 400: "${res.data?.error}"`
    );
  } catch (err: any) {
    report('Delhi Sub-₹1,000 Order Rejection Rule', false, err.message);
  }

  // 6. Minimum Order Enforcement: Gurugram order of ₹1,200 (below ₹1,500) must be rejected
  try {
    const ggnLowOrder = {
      customerName: 'Test GGN Low',
      customerPhone: '+91 98100 99999',
      address: {
        flat: 'DLF Phase 4 Flat 101',
        area: 'DLF Phase 4',
        city: 'Gurugram',
        pincode: '122002'
      },
      items: [
        {
          serviceId: 'srv-wax-full-arms-legs', // ~₹1,099
          isPackage: false
        }
      ],
      appointmentDate: '2028-12-10',
      appointmentSlot: '11:00 AM',
      paymentMethod: 'COD'
    };

    const res = await request('/api/bookings', { method: 'POST', body: ggnLowOrder });
    const isRejected = res.status === 400 && res.data?.error?.includes('1500');
    report(
      'Gurugram Sub-₹1,500 Order Rejection Rule',
      isRejected,
      `Correctly rejected with 400: "${res.data?.error}"`
    );
  } catch (err: any) {
    report('Gurugram Sub-₹1,500 Order Rejection Rule', false, err.message);
  }

  // 7. Custom Package Acceptance: Booking with customized services list
  try {
    const customPkgOrder = {
      customerName: 'Ananya Sharma',
      customerPhone: '+91 98765 43210',
      customerEmail: 'ananya@example.com',
      address: {
        flat: 'Villa 14, Nirvana Country',
        landmark: 'Sector 50',
        area: 'Golf Course Extension',
        city: 'Gurugram',
        pincode: '122018'
      },
      items: [
        {
          isPackage: true,
          packageId: 'pkg-total-care',
          customPackageName: 'Total Care Ritual (Customized)',
          customizedServices: [
            { id: 'srv-wax-full-arms-legs', name: 'RICA Full Arms + Full Legs' },
            { id: 'srv-facial-o3-bridal-glow-vit-c', name: 'O3+ Bridal Glow Vitamin C Facial' },
            { id: 'srv-pedi-bomb-spa', name: 'Crystal Bomb Deluxe Pedicure' }
          ]
        }
      ],
      appointmentDate: '2028-12-11',
      appointmentSlot: '01:00 PM',
      paymentMethod: 'COD'
    };

    const res = await request('/api/bookings', { method: 'POST', body: customPkgOrder });
    const isSuccess = (res.status === 200 || res.status === 201) && (res.data?.booking?.id || res.data?.bookingId);

    report(
      'Customized Package Booking & Validation',
      isSuccess,
      `Status: ${res.status}, Booking ID: ${res.data?.booking?.id || res.data?.bookingId}, Total: ₹${res.data?.booking?.totalPayable}`
    );
  } catch (err: any) {
    report('Customized Package Booking & Validation', false, err.message);
  }

  // 8. Calculate-Pricing Endpoint for Custom Packages
  try {
    const calcPayload = {
      items: [
        {
          isPackage: true,
          packageId: 'pkg-just-relax',
          customizedServices: [
            { id: 'srv-wax-full-arms-legs' },
            { id: 'srv-facial-o3-shine-glow' },
            { id: 'srv-pedi-bomb-spa' },
            { id: 'srv-massage-foot-reflex' }
          ]
        }
      ],
      pincode: '110017',
      appointmentSlot: '11:00 AM'
    };

    const res = await request('/api/calculate-price', { method: 'POST', body: calcPayload });
    const isOk = res.status === 200 && res.data?.subtotal > 0 && res.data?.totalPayable > 0;
    report(
      'Custom Package Dynamic Price Calculation',
      isOk,
      `Subtotal: ₹${res.data?.subtotal}, Package Discount: ₹${res.data?.packageDiscount} (${res.data?.packageDiscountPercent}%), Final: ₹${res.data?.totalPayable}`
    );
  } catch (err: any) {
    report('Custom Package Dynamic Price Calculation', false, err.message);
  }

  console.log('\n=====================================================================');
  console.log(`VERIFICATION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('=====================================================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runVideoFeedbackVerification().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
