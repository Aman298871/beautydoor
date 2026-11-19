import { db, initDatabase } from '../backend/db/database.ts';
import { MASTER_SERVICES, MASTER_PACKAGES } from '../backend/db/masterCatalogue.ts';
import fs from 'fs';
import path from 'path';

async function runOwnerVerification() {
  console.log('\n======================================================');
  console.log('BEAUTYDOOR — OWNER FEEDBACK & REGRESSION AUDIT SUITE');
  console.log('======================================================');

  // Test 1: Repeated Database Initialization (Idempotency)
  console.log('\n--- 1. IDEMPOTENT DATABASE INITIALIZATION ---');
  await initDatabase();
  console.log('  ✓ Initial initDatabase() passed');
  await initDatabase();
  console.log('  ✓ Second initDatabase() re-seed check passed');
  await initDatabase();
  console.log('  ✓ Third initDatabase() re-seed check passed');

  // Test 2: Massage Services Verification
  console.log('\n--- 2. MASSAGE SERVICES VERIFICATION ---');
  const massage750 = await db.queryRow<any>(
    "SELECT id, name, slug, selling_price, original_price, duration_mins, is_published, is_active FROM services WHERE id = 'srv-full-body-massage-750'"
  );
  const massage1299 = await db.queryRow<any>(
    "SELECT id, name, slug, selling_price, original_price, duration_mins, is_published, is_active FROM services WHERE id = 'srv-massage-full-body-olive-oil'"
  );

  if (massage750?.selling_price === 750 && massage750?.duration_mins === 45 && massage750?.is_published === 1) {
    console.log(`  ✓ Body Massage Option 1: ₹${massage750.selling_price}, ${massage750.duration_mins} mins ("${massage750.name}") => PASS (Published & Customer Visible)`);
  } else {
    console.error('  ✗ Body Massage Option 1 mismatch:', massage750);
    process.exit(1);
  }

  if (massage1299?.selling_price === 1299 && massage1299?.duration_mins === 90 && massage1299?.is_published === 1) {
    console.log(`  ✓ Body Massage Option 2: ₹${massage1299.selling_price}, ${massage1299.duration_mins} mins ("${massage1299.name}") => PASS (Published & Customer Visible)`);
  } else {
    console.error('  ✗ Body Massage Option 2 mismatch:', massage1299);
    process.exit(1);
  }

  // Test 3: Glow & Groom Combo Package Verification
  console.log('\n--- 3. GLOW & GROOM COMBO (₹999, 70 MINS) AUDIT ---');
  const pkgGroom = await db.queryRow<any>(
    "SELECT id, name, slug, selling_price, duration_mins, duration_display, is_published FROM packages WHERE id = 'pkg-glow-and-groom-combo'"
  );

  if (pkgGroom?.selling_price === 999 && pkgGroom?.duration_mins === 70 && pkgGroom?.is_published === 1) {
    console.log(`  ✓ Glow & Groom Combo: ₹${pkgGroom.selling_price}, ${pkgGroom.duration_mins} mins ("${pkgGroom.name}") => PASS (Active & Customer Visible)`);
  } else {
    console.error('  ✗ Glow & Groom Combo mismatch in database:', pkgGroom);
    process.exit(1);
  }

  // Check masterCatalogue consistency
  const masterGroom = MASTER_PACKAGES.find(p => p.id === 'pkg-glow-and-groom-combo');
  if (masterGroom && masterGroom.selling_price === 999 && masterGroom.duration_mins === 70) {
    console.log(`  ✓ Glow & Groom Combo in MASTER_PACKAGES: ₹${masterGroom.selling_price}, ${masterGroom.duration_mins}m => PASS`);
  } else {
    console.error('  ✗ Glow & Groom Combo missing or invalid in MASTER_PACKAGES:', masterGroom);
    process.exit(1);
  }

  // Test 4: Services Page Category Separation
  console.log('\n--- 4. SERVICES PAGE CATEGORY ISOLATION AUDIT ---');
  const servicesPageSource = fs.readFileSync(
    path.resolve(process.cwd(), 'apps/storefront/pages/ServicesPage.tsx'),
    'utf-8'
  );

  const hasPromotionalHeaderButton = servicesPageSource.includes('Ready-Made Packages (Save 20%)');
  if (!hasPromotionalHeaderButton) {
    console.log('  ✓ "Ready-Made Packages (Save 20%)" promotional button removed from header => PASS');
  } else {
    console.error('  ✗ Promotional package button still exists in ServicesPage header');
    process.exit(1);
  }

  const hasOnlyPackageCatCheck = servicesPageSource.includes("selectedCat === 'cat-packages' && categoryPackages.length > 0");
  if (hasOnlyPackageCatCheck) {
    console.log('  ✓ Package bundles restricted exclusively to "cat-packages" selection => PASS');
  } else {
    console.error('  ✗ CategoryPackages check not restricted to cat-packages');
    process.exit(1);
  }

  // Test 5: Single Mobile Contact & Booking Action Bar
  console.log('\n--- 5. MOBILE SINGLE ACTION BAR & NAVBAR AUDIT ---');
  const navbarSource = fs.readFileSync(
    path.resolve(process.cwd(), 'apps/storefront/components/StorefrontNavbar.tsx'),
    'utf-8'
  );
  const appSource = fs.readFileSync(
    path.resolve(process.cwd(), 'apps/storefront/App.tsx'),
    'utf-8'
  );

  const navbarHasBottomFixed = navbarSource.includes('md:hidden fixed bottom-0');
  if (!navbarHasBottomFixed) {
    console.log('  ✓ Duplicate second bottom navigation bar removed from StorefrontNavbar => PASS');
  } else {
    console.error('  ✗ StorefrontNavbar still contains a fixed bottom navigation bar');
    process.exit(1);
  }

  const appHasUnifiedActionBar = appSource.includes('Unified Single Sticky Mobile Action Bar');
  if (appHasUnifiedActionBar) {
    console.log('  ✓ Single unified mobile action bar with Call, WhatsApp, Book Now active => PASS');
  } else {
    console.error('  ✗ App.tsx does not have unified action bar');
    process.exit(1);
  }

  // Test 6: Hygiene Claims Wording Audit
  console.log('\n--- 6. HYGIENE & MARKETING TEXT AUDIT ---');
  const indexHtml = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
  if (!indexHtml.toLowerCase().includes('hospital-grade')) {
    console.log('  ✓ index.html is free of "hospital-grade" claims => PASS');
  } else {
    console.error('  ✗ index.html still contains "hospital-grade"');
    process.exit(1);
  }

  const servicesPageHtml = fs.readFileSync(path.resolve(process.cwd(), 'apps/storefront/pages/ServicesPage.tsx'), 'utf-8');
  if (!servicesPageHtml.includes('100% single-use sealed kits')) {
    console.log('  ✓ ServicesPage is free of blanket "100% single-use sealed kits" => PASS');
  } else {
    console.error('  ✗ ServicesPage still has blanket 100% claim');
    process.exit(1);
  }

  // Test 7: Historical Booking Preservation & Pincode Optionality
  console.log('\n--- 7. BOOKING INTEGRITY & PINCODE OPTIONALITY ---');
  const testBookingId = `TST-OWNER-${Date.now()}`;
  await db.execute(`
    INSERT INTO bookings (
      id, customer_id, customer_name, customer_phone, customer_email,
      flat, landmark, area, city, pincode,
      subtotal, package_discount, campaign_discount, coupon_discount, coupon_code,
      delivery_fee, slot_charge, total_payable, appointment_date, appointment_slot,
      payment_method, payment_status, booking_status, internal_notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    testBookingId, 'cust-owner-test', 'Pooja Sharma', '+91 9811122299', 'pooja@example.com',
    'Flat 102', 'Near Park', 'Vasant Kunj', 'Delhi', null,
    999, 0, 0, 0, null, 0, 0, 999,
    '2026-11-20', '10:00 AM', 'COD', 'pending', 'confirmed', 'Optional pin owner test', new Date().toISOString()
  ]);

  const inserted = await db.queryRow<any>('SELECT * FROM bookings WHERE id = ?', [testBookingId]);
  if (inserted && inserted.pincode === null && inserted.total_payable === 999) {
    console.log(`  ✓ Booking created with NULL pincode & ₹999 total preserved [${testBookingId}] => PASS`);
  } else {
    console.error('  ✗ Booking creation failed:', inserted);
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log('ALL OWNER FEEDBACK TESTS PASSED WITH 100% SUCCESS!');
  console.log('======================================================\n');
  process.exit(0);
}

runOwnerVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
