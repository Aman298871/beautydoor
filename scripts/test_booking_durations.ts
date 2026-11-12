import { db, initDatabase } from '../backend/db/database.ts';

async function testBookingCalculations() {
  await initDatabase();

  const pkgGlow = await db.query<any>('SELECT * FROM packages WHERE id = ?', ['pkg-glow-and-smooth']);
  const pkgBliss = await db.query<any>('SELECT * FROM packages WHERE id = ?', ['pkg-beauty-bliss']);

  console.log('\n--- BOOKING TOTAL & DURATION PARITY TEST ---');
  console.log(`pkg-glow-and-smooth: ${pkgGlow[0]?.name}`);
  console.log(`  selling_price: ₹${pkgGlow[0]?.selling_price}`);
  console.log(`  duration_mins: ${pkgGlow[0]?.duration_mins} mins (${pkgGlow[0]?.duration_display})`);
  
  console.log(`\npkg-beauty-bliss: ${pkgBliss[0]?.name}`);
  console.log(`  selling_price: ₹${pkgBliss[0]?.selling_price}`);
  console.log(`  duration_mins: ${pkgBliss[0]?.duration_mins} mins (${pkgBliss[0]?.duration_display})`);

  // Verify Cart Total & Minimum Order Enforcement
  const delhiMin = 1000;
  const haryanaMin = 1500;
  const noidaMin = 1500;

  console.log('\n--- REGIONAL MINIMUM ORDER COMPLIANCE ---');
  console.log(`Delhi Threshold (₹${delhiMin}): Meets = ${pkgGlow[0]?.selling_price >= delhiMin}`);
  console.log(`Haryana Threshold (₹${haryanaMin}): Meets = ${pkgGlow[0]?.selling_price >= haryanaMin}`);
  console.log(`Noida Threshold (₹${noidaMin}): Meets = ${pkgGlow[0]?.selling_price >= noidaMin}`);

  await db.close();
}

testBookingCalculations().catch(console.error);

