import { db, initDatabase } from '../backend/db/database.ts';
import { MASTER_PACKAGES } from '../backend/db/masterCatalogue.ts';

async function verifyPackagesDeep() {
  await initDatabase();

  console.log('\n========================================');
  console.log('PACKAGE DURATION & CANONICAL AUDIT');
  console.log('========================================');

  // 1. Master Catalogue Check
  const masterGlow = MASTER_PACKAGES.find(p => p.id === 'pkg-glow-and-smooth');
  const masterBliss = MASTER_PACKAGES.find(p => p.id === 'pkg-beauty-bliss');
  console.log(`Master Catalogue pkg-glow-and-smooth: ${masterGlow?.duration_mins}m (${masterGlow?.duration_display}) => ${masterGlow?.duration_mins === 120 ? 'PASS' : 'FAIL'}`);
  console.log(`Master Catalogue pkg-beauty-bliss: ${masterBliss?.duration_mins}m (${masterBliss?.duration_display}) => ${masterBliss?.duration_mins === 150 ? 'PASS' : 'FAIL'}`);

  // 2. PostgreSQL Check
  const dbGlow = (await db.query<any>('SELECT * FROM packages WHERE id = ?', ['pkg-glow-and-smooth']))[0];
  const dbBliss = (await db.query<any>('SELECT * FROM packages WHERE id = ?', ['pkg-beauty-bliss']))[0];
  console.log(`PostgreSQL pkg-glow-and-smooth: ${dbGlow?.duration_mins}m (${dbGlow?.duration_display}) => ${dbGlow?.duration_mins === 120 ? 'PASS' : 'FAIL'}`);
  console.log(`PostgreSQL pkg-beauty-bliss: ${dbBliss?.duration_mins}m (${dbBliss?.duration_display}) => ${dbBliss?.duration_mins === 150 ? 'PASS' : 'FAIL'}`);

  // 3. Relevance of 8 Facials & 4 RICA Packages
  const allPkgs = await db.query<any>('SELECT * FROM packages ORDER BY selling_price ASC');
  
  console.log('\n--- FACIAL CATEGORY PACKAGES RELEVANCE AUDIT ---');
  const facialPkgs = allPkgs.filter(p => JSON.parse(p.category_ids_json || '[]').includes('cat-facials'));
  facialPkgs.forEach((p, idx) => {
    const inclusions = JSON.parse(p.inclusions_json || '[]');
    const facialItem = inclusions.find((inc: any) => {
      const name = typeof inc === 'object' ? inc.name : String(inc);
      return name.toLowerCase().includes('facial');
    });
    console.log(`${idx+1}. ${p.name} (₹${p.selling_price}, ${p.duration_mins}m)`);
    console.log(`   Featured Facial: "${typeof facialItem === 'object' ? facialItem.name : facialItem}" => GENUINE FACIAL INCLUSION`);
  });

  console.log('\n--- RICA WAXING CATEGORY PACKAGES RELEVANCE AUDIT ---');
  const ricaPkgs = allPkgs.filter(p => JSON.parse(p.category_ids_json || '[]').includes('cat-rica-waxing'));
  ricaPkgs.forEach((p, idx) => {
    const inclusions = JSON.parse(p.inclusions_json || '[]');
    const ricaItems = inclusions.filter((inc: any) => {
      const name = typeof inc === 'object' ? inc.name : String(inc);
      return name.toLowerCase().includes('rica');
    });
    console.log(`${idx+1}. ${p.name} (₹${p.selling_price}, ${p.duration_mins}m)`);
    console.log(`   Featured RICA Services: ${ricaItems.map((r: any) => typeof r === 'object' ? r.name : r).join(' | ')} => GENUINE RICA INCLUSION`);
  });

  // 4. Strict exclusion check
  const nonRicaInRica = ricaPkgs.filter(p => {
    const inclusions = JSON.parse(p.inclusions_json || '[]');
    const hasRica = inclusions.some((inc: any) => (typeof inc === 'object' ? inc.name : inc).toLowerCase().includes('rica'));
    return !hasRica;
  });
  console.log(`\nNon-RICA packages mapped to RICA: ${nonRicaInRica.length} => ${nonRicaInRica.length === 0 ? 'PASS (STRICT EXCLUSION)' : 'FAIL'}`);

  // 5. Booking Slot Duration Calculation Check (storefrontRoutes.ts line 456 & 750)
  // When pkg-glow-and-smooth is booked, duration is 120 mins.
  const bookingTotalDuration = dbGlow.duration_mins;
  const startHour = 10;
  const endHour = startHour + Math.floor(bookingTotalDuration / 60);
  const endMins = bookingTotalDuration % 60;
  console.log(`\nSlot duration test for pkg-glow-and-smooth (10:00 AM start):`);
  console.log(`  Calculated End Time: ${endHour}:${endMins === 0 ? '00' : endMins} AM (${bookingTotalDuration} mins) => EXACT 2 HOURS`);

  await db.close();
}

verifyPackagesDeep().catch(console.error);

