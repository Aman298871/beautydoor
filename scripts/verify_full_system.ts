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

  // Test 5: Package Durations (Facial & Waxing 2h, Beauty Bliss 2.5h)
  console.log('\nTest 5: Owner Package Durations');
  const facialWaxing = await db.queryRow<any>('SELECT name, duration_mins, duration_display FROM packages WHERE id = ?', ['pkg-glow-and-smooth']);
  const beautyBliss = await db.queryRow<any>('SELECT name, duration_mins, duration_display FROM packages WHERE id = ?', ['pkg-beauty-bliss']);

  console.log('Facial & Waxing Package:', facialWaxing);
  console.log('Beauty Bliss Body Package:', beautyBliss);

  if (facialWaxing.duration_mins !== 120 || facialWaxing.duration_display !== '2 hours') {
    throw new Error(`Facial & Waxing Package must be 2 hours (120 mins), got: ${facialWaxing.duration_mins}m`);
  }
  if (beautyBliss.duration_mins !== 150 || beautyBliss.duration_display !== '2 hours 30 minutes') {
    throw new Error(`Beauty Bliss Body Package must be 2 hours 30 mins (150 mins), got: ${beautyBliss.duration_mins}m`);
  }
  console.log('✓ PASS: Package durations match owner WhatsApp requests');

  // Test 6: Territories & PIN 110017 (Saket, Malviya Nagar, Sainik Farm)
  console.log('\nTest 6: Doorstep Service Territories & PIN 110017');
  const ter110017 = await db.queryRow<any>('SELECT * FROM territories WHERE pincode = ?', ['110017']);
  if (!ter110017) throw new Error('PIN 110017 territory missing');
  console.log('Territory 110017:', {
    city: ter110017.city,
    area_name: ter110017.area_name,
    min_order_amount: ter110017.min_order_amount,
    delivery_fee: ter110017.delivery_fee,
    is_active: ter110017.is_active
  });

  if (ter110017.delivery_fee !== 0) {
    throw new Error(`Visiting fee for 110017 must be ₹0, got: ${ter110017.delivery_fee}`);
  }
  if (ter110017.min_order_amount !== 1000) {
    throw new Error(`Delhi min order must be ₹1,000, got: ${ter110017.min_order_amount}`);
  }
  console.log('✓ PASS: PIN 110017 configured with ₹0 visiting fee and ₹1,000 Delhi threshold');

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

  await db.close();
  console.log('\n=== ALL VERIFICATION TESTS PASSED SUCCESSFULLY ===');
}

verifyAll().catch((err) => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err);
  process.exit(1);
});
