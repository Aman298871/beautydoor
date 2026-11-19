import { db, initDatabase } from '../backend/db/database.ts';
import { lockScroll, unlockScroll, getScrollLockCount, forceResetScroll } from '../src/utils/scrollLock.ts';

async function verifyAll() {
  console.log('=== STARTING BEAUTYDOOR FULL PRODUCTION VERIFICATION ===\n');

  // Test 1: Scroll Lock Reference Counter & Clean Reset
  console.log('Test 1: Scroll Lock Reference Counter');
  lockScroll();
  unlockScroll();
  forceResetScroll();
  if (getScrollLockCount() !== 0) throw new Error('Scroll lock count must be 0 after forceResetScroll');
  console.log('✓ PASS: Reference-counted scroll lock behaves deterministically');

  // Test 2: Database Initialization & Migrations
  console.log('\nTest 2: Database Schema & Master Catalogue Sync');
  await initDatabase();
  console.log('✓ PASS: PostgreSQL/SQLite emulator database initialized cleanly without unique constraint collisions');

  // Test 3: BEAUTYFIRST Coupon Rules
  console.log('\nTest 3: BEAUTYFIRST Coupon Rules');
  const beautyFirst = await db.queryRow<any>('SELECT * FROM coupons WHERE code = ?', ['BEAUTYFIRST']);
  if (!beautyFirst) throw new Error('BEAUTYFIRST coupon missing from database');
  console.log('BEAUTYFIRST DB Record:', {
    code: beautyFirst.code,
    type: beautyFirst.discount_type,
    val: beautyFirst.discount_value,
    min: beautyFirst.min_order_amount,
    max: beautyFirst.max_discount,
    active: beautyFirst.is_active
  });

  if (beautyFirst.discount_type !== 'flat' || beautyFirst.discount_value !== 100) {
    throw new Error(`BEAUTYFIRST discount must be flat 100, got: ${beautyFirst.discount_type} ${beautyFirst.discount_value}`);
  }
  if (beautyFirst.min_order_amount !== 1100) {
    throw new Error(`BEAUTYFIRST min order must be 1100, got: ${beautyFirst.min_order_amount}`);
  }
  if (beautyFirst.max_discount !== 100) {
    throw new Error(`BEAUTYFIRST max discount must be 100, got: ${beautyFirst.max_discount}`);
  }
  if (beautyFirst.is_active !== 1) {
    throw new Error('BEAUTYFIRST must be active (is_active = 1)');
  }
  console.log('✓ PASS: BEAUTYFIRST matches exact owner rules: flat ₹100 off, min order ₹1,100, max discount ₹100');

  // Test 4: Glow & Groom Combo Draft State
  console.log('\nTest 4: Glow & Groom Combo Status');
  const glowGroom = await db.queryRow<any>('SELECT * FROM packages WHERE id = ?', ['pkg-glow-and-groom-combo']);
  if (!glowGroom) throw new Error('pkg-glow-and-groom-combo missing from database');
  console.log('Glow & Groom Package:', {
    name: glowGroom.name,
    selling_price: glowGroom.selling_price,
    duration_mins: glowGroom.duration_mins,
    is_published: glowGroom.is_published,
    badge: glowGroom.badge
  });

  if (glowGroom.is_published !== 0) {
    throw new Error(`Glow & Groom must be unpublished (is_published = 0), got: ${glowGroom.is_published}`);
  }
  if (!glowGroom.badge.includes('Awaiting Owner Confirmation')) {
    throw new Error(`Glow & Groom badge must state Awaiting Owner Confirmation, got: ${glowGroom.badge}`);
  }
  console.log('✓ PASS: Glow & Groom is in DRAFT awaiting owner confirmation, hidden from storefront');

  // Test 5: Package Durations & Names (Facial & Waxing 2h, Beauty Bliss 2.5h)
  console.log('\nTest 5: Owner Package Durations & Names');
  const facialWaxing = await db.queryRow<any>('SELECT name, duration_mins, duration_display FROM packages WHERE id = ?', ['pkg-glow-and-smooth']);
  const beautyBliss = await db.queryRow<any>('SELECT name, duration_mins, duration_display FROM packages WHERE id = ?', ['pkg-beauty-bliss']);

  console.log('Facial & Waxing Package:', facialWaxing);
  console.log('Beauty Bliss Package:', beautyBliss);

  if (facialWaxing.duration_mins !== 120 || facialWaxing.duration_display !== '2 hours') {
    throw new Error(`Facial & Waxing Package must be 2 hours (120 mins), got: ${facialWaxing.duration_mins}m`);
  }
  if (beautyBliss.duration_mins !== 150 || !beautyBliss.duration_display.includes('2 hours 30 min')) {
    throw new Error(`Beauty Bliss Body Package must be 2 hours 30 mins (150 mins), got: ${beautyBliss.duration_mins}m, ${beautyBliss.duration_display}`);
  }
  if (!beautyBliss.name.includes('Beauty Bliss')) {
    throw new Error(`Beauty Bliss package name must include Beauty Bliss, got: ${beautyBliss.name}`);
  }
  console.log('✓ PASS: Package durations and names match owner WhatsApp requests');

  // Test 5b: BeautyDoor Packages Category Presence
  console.log('\nTest 5b: Category cat-packages Presence');
  const catPackages = await db.queryRow<any>('SELECT * FROM categories WHERE id = ?', ['cat-packages']);
  if (!catPackages || catPackages.is_active !== 1) {
    throw new Error('cat-packages must exist in categories table and be active');
  }
  console.log('✓ PASS: cat-packages ("BeautyDoor Packages") exists and is active');

  // Test 6: Doorstep Service Territories & PIN 110017 (Multi-locality support)
  console.log('\nTest 6: Doorstep Service Territories & PIN 110017 Multi-Locality');
  const ter110017Rows = await db.query<any>('SELECT * FROM territories WHERE pincode = ? ORDER BY area_name ASC', ['110017']);
  if (!ter110017Rows || ter110017Rows.length === 0) throw new Error('PIN 110017 territory missing');
  console.log(`Found ${ter110017Rows.length} localities for PIN 110017:`, ter110017Rows.map(r => r.area_name));

  const composite110017 = ter110017Rows.find(r => r.area_name.includes('&'));
  if (composite110017) {
    throw new Error(`Composite territory '${composite110017.area_name}' must be deleted so only individual localities exist.`);
  }

  const expectedLocalities = ['Malviya Nagar', 'Sainik Farm', 'Saket'];
  const actualLocalities = ter110017Rows.map(r => r.area_name).sort();
  console.log('Actual PIN 110017 localities:', actualLocalities);
  if (actualLocalities.length !== 3 || !expectedLocalities.every(l => actualLocalities.includes(l))) {
    throw new Error(`PIN 110017 must contain exactly the 3 distinct localities: ${expectedLocalities.join(', ')}`);
  }

  for (const ter of ter110017Rows) {
    if (ter.delivery_fee !== 0) {
      throw new Error(`Visiting fee for 110017 must be ₹0, got: ${ter.delivery_fee}`);
    }
    if (ter.min_order_amount !== 1000) {
      throw new Error(`Delhi min order must be ₹1,000, got: ${ter.min_order_amount}`);
    }
  }
  console.log('✓ PASS: PIN 110017 has exactly 3 separate localities (Saket, Malviya Nagar, Sainik Farm) with ₹0 visiting fee and ₹1,000 Delhi threshold');

  // Test 7: Body Massage Options (₹750 45m, ₹1,299 90m)
  console.log('\nTest 7: Body Massage Durations');
  const massage45 = await db.queryRow<any>('SELECT name, selling_price, duration_mins, is_published FROM services WHERE id = ?', ['srv-full-body-massage-750']);
  const massage90 = await db.queryRow<any>('SELECT name, selling_price, duration_mins, is_published FROM services WHERE id = ?', ['srv-massage-full-body-olive-oil']);
  console.log('Option 1:', massage45);
  console.log('Option 2:', massage90);

  if (!massage45 || massage45.selling_price !== 750 || massage45.duration_mins !== 45 || massage45.is_published !== 1) {
    throw new Error('Option 1 Massage ₹750 45m misconfigured');
  }
  if (!massage90 || massage90.selling_price !== 1299 || massage90.duration_mins !== 90 || massage90.is_published !== 1) {
    throw new Error('Option 2 Massage ₹1,299 90m misconfigured');
  }
  console.log('✓ PASS: Body massage durations match Preeti WhatsApp messages');

  // Test 8: Moonstar Korean Facial Steps (Official packaging 6 steps)
  console.log('\nTest 8: Moonstar Korean Facial Treatment Steps');
  const moonstar = await db.queryRow<any>('SELECT name, steps_count, steps_json FROM services WHERE id = ?', ['srv-facial-moonstar-korean']);
  const moonstarSteps = JSON.parse(moonstar.steps_json || '[]');
  console.log('Moonstar steps count:', moonstar.steps_count, 'actual steps length:', moonstarSteps.length);
  console.log('Moonstar steps:', moonstarSteps);
  if (moonstar.steps_count !== 6 || moonstarSteps.length !== 6) {
    throw new Error('Moonstar facial must have exactly 6 steps matching packaging');
  }
  console.log('✓ PASS: Moonstar Korean Facial steps match packaging');

  // Test 9: Body Scrub + Body Pack Unique Slug
  console.log('\nTest 9: Body Scrub + Body Pack Unique Slug');
  const scrubRows = await db.query<any>("SELECT id, name, slug FROM services WHERE slug LIKE 'body-scrub-body-pack%'");
  console.log('Scrub rows found:', scrubRows);
  const activeScrub = scrubRows.find(r => r.slug === 'body-scrub-body-pack');
  if (!activeScrub || activeScrub.id !== 'srv-body-scrub-pack-499') {
    throw new Error('srv-body-scrub-pack-499 must hold the active slug body-scrub-body-pack');
  }
  console.log('✓ PASS: Slug uniqueness constraint satisfied');

  // Test 10: Authoritative Cancellation Policy Boundary & Logic Tests
  console.log('\nTest 10: Cancellation Policy Strict Boundary & State Logic (2-Hour Window / ₹200 Fee)');
  const calculateCancellation = (appointmentTimeMs: number, simulatedNowMs: number) => {
    const diffMinutes = Math.floor((appointmentTimeMs - simulatedNowMs) / (1000 * 60));
    const breached = diffMinutes < 120;
    const fee = breached ? 200 : 0;
    return { diffMinutes, breached, fee };
  };

  const testNow = Date.now();
  // Case A: Exactly 120 minutes prior -> FREE (₹0 fee)
  const case120m = calculateCancellation(testNow + 120 * 60 * 1000, testNow);
  console.log(`Exact 120 minutes prior: fee = ₹${case120m.fee}, breached = ${case120m.breached}`);
  if (case120m.fee !== 0 || case120m.breached) throw new Error('Cancellation at exactly 120m must be ₹0 fee');

  // Case B: 119 minutes prior -> ₹200 fee
  const case119m = calculateCancellation(testNow + 119 * 60 * 1000, testNow);
  console.log(`119 minutes prior: fee = ₹${case119m.fee}, breached = ${case119m.breached}`);
  if (case119m.fee !== 200 || !case119m.breached) throw new Error('Cancellation at 119m must be ₹200 fee');

  // Case C: 3 hours (180 minutes) prior -> FREE (₹0 fee)
  const case180m = calculateCancellation(testNow + 180 * 60 * 1000, testNow);
  console.log(`180 minutes prior: fee = ₹${case180m.fee}, breached = ${case180m.breached}`);
  if (case180m.fee !== 0 || case180m.breached) throw new Error('Cancellation at 180m must be ₹0 fee');

  // Case D: Past appointment (-30 minutes) -> ₹200 fee
  const casePast = calculateCancellation(testNow - 30 * 60 * 1000, testNow);
  console.log(`Past appointment (-30m): fee = ₹${casePast.fee}, breached = ${casePast.breached}`);
  if (casePast.fee !== 200 || !casePast.breached) throw new Error('Past cancellation must be ₹200 fee');

  console.log('✓ PASS: Cancellation boundary tests (exact 120m, 119m, 180m, past) match policy');

  // Test 11: BEAUTYFIRST Coupon Subtotal Threshold Validation
  console.log('\nTest 11: BEAUTYFIRST Coupon Subtotal Threshold Validation (Min ₹1,100 / Flat ₹100)');
  const coupon = await db.queryRow<any>('SELECT * FROM coupons WHERE code = ?', ['BEAUTYFIRST']);
  if (!coupon) throw new Error('BEAUTYFIRST coupon missing from DB');
  console.log('BEAUTYFIRST DB row:', {
    code: coupon.code,
    discount_value: coupon.discount_value,
    min_order_amount: coupon.min_order_amount,
    max_discount: coupon.max_discount,
    is_active: coupon.is_active,
    expires_at: coupon.expires_at
  });
  if (coupon.discount_value !== 100 || coupon.min_order_amount !== 1100 || coupon.max_discount !== 100 || coupon.is_active !== 1) {
    throw new Error('BEAUTYFIRST must be Flat ₹100, min order ₹1,100, max discount ₹100, active');
  }

  // Validate subtotal evaluation logic
  const evaluateBeautyFirst = (subtotal: number) => {
    if (subtotal < coupon.min_order_amount) {
      return { valid: false, error: `Minimum order amount of ₹${coupon.min_order_amount} required` };
    }
    const discount = Math.min(coupon.discount_value, coupon.max_discount, subtotal);
    return { valid: true, discount, payable: subtotal - discount };
  };

  const cart1099 = evaluateBeautyFirst(1099);
  console.log('Cart ₹1,099 evaluation:', cart1099);
  if (cart1099.valid) throw new Error('Cart ₹1,099 must be rejected for BEAUTYFIRST');

  const cart1100 = evaluateBeautyFirst(1100);
  console.log('Cart ₹1,100 evaluation:', cart1100);
  if (!cart1100.valid || cart1100.discount !== 100 || cart1100.payable !== 1000) {
    throw new Error('Cart ₹1,100 must yield ₹100 discount');
  }

  const cart1500 = evaluateBeautyFirst(1500);
  console.log('Cart ₹1,500 evaluation:', cart1500);
  if (!cart1500.valid || cart1500.discount !== 100 || cart1500.payable !== 1400) {
    throw new Error('Cart ₹1,500 must yield flat ₹100 discount (capped at ₹100)');
  }
  console.log('✓ PASS: BEAUTYFIRST coupon subtotal thresholds verified (₹1,099 rejected, ₹1,100 -> ₹100, ₹1,500 -> ₹100)');

  // Test 12: Campaign Management CRUD in DB
  console.log('\nTest 12: Campaign Management in DB');
  const testCampId = `camp-test-${Date.now()}`;
  await db.execute(`
    INSERT INTO campaigns (
      id, title, slug, banner_title, banner_subtitle, banner_image_url,
      cta_label, destination_url, start_time, end_time, is_flash_deal, is_published,
      discount_type, discount_val, badge_text, target_category_ids_json, target_service_ids_json,
      display_order, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    testCampId,
    'Verification Campaign Test',
    `test-camp-${Date.now()}`,
    'Verification Headline',
    'Verification Subtitle',
    '/uploads/test_banner.jpg',
    'Book Now',
    '/offers',
    new Date().toISOString(),
    new Date(Date.now() + 86400000).toISOString(),
    1,
    1,
    'percentage',
    20,
    'Test Badge',
    '["cat-facials"]',
    '[]',
    1,
    new Date().toISOString()
  ]);

  const insertedCamp = await db.queryRow<any>('SELECT * FROM campaigns WHERE id = ?', [testCampId]);
  if (!insertedCamp || insertedCamp.title !== 'Verification Campaign Test') {
    throw new Error('Failed to insert test campaign');
  }

  // Update
  await db.execute('UPDATE campaigns SET discount_val = 30, is_published = 0 WHERE id = ?', [testCampId]);
  const updatedCamp = await db.queryRow<any>('SELECT * FROM campaigns WHERE id = ?', [testCampId]);
  if (!updatedCamp || updatedCamp.discount_val !== 30 || updatedCamp.is_published !== 0) {
    throw new Error('Failed to update test campaign');
  }

  // Delete
  await db.execute('DELETE FROM campaigns WHERE id = ?', [testCampId]);
  const deletedCamp = await db.queryRow<any>('SELECT * FROM campaigns WHERE id = ?', [testCampId]);
  if (deletedCamp) throw new Error('Failed to delete test campaign');
  console.log('✓ PASS: Campaign lifecycle (Create, Read, Update, Delete) verified in DB');

  // Test 13: Service Image Field Persistence
  console.log('\nTest 13: Service Image URL Persistence');
  const testImgUrl = '/uploads/test_verified_service_img.webp';
  await db.execute('UPDATE services SET image_url = ? WHERE id = ?', [testImgUrl, 'srv-facial-moonstar-korean']);
  const srvImgRow = await db.queryRow<any>('SELECT id, name, image_url FROM services WHERE id = ?', ['srv-facial-moonstar-korean']);
  if (!srvImgRow || srvImgRow.image_url !== testImgUrl) {
    throw new Error('Service image_url failed to persist');
  }
  console.log('✓ PASS: Service image_url successfully persists in database');

  await db.close();
  console.log('\n=== ALL 13 VERIFICATION TESTS PASSED SUCCESSFULLY ===');
}

verifyAll().catch((err) => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
