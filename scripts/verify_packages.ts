import { db, initDatabase } from '../backend/db/database.ts';

async function verify() {
  await initDatabase();

  const pkgs = await db.query<any>('SELECT id, name, slug, duration_mins, duration_display, selling_price, category_ids_json, inclusions_json FROM packages ORDER BY selling_price ASC');

  console.log(`\n--- VERIFYING ${pkgs.length} PACKAGES IN DATABASE ---`);
  for (const p of pkgs) {
    const catIds = JSON.parse(p.category_ids_json || '[]');
    const inclusions = JSON.parse(p.inclusions_json || '[]');
    console.log(`\nID: ${p.id} | Name: ${p.name}`);
    console.log(`  Duration: ${p.duration_mins} mins (${p.duration_display}) | Price: ₹${p.selling_price}`);
    console.log(`  Categories: [${catIds.join(', ')}]`);
    console.log(`  Inclusions (${inclusions.length}):`);
    inclusions.forEach((inc: any, i: number) => {
      console.log(`    ${i+1}. ${typeof inc === 'object' ? inc.name : inc} ${inc.is_free ? '(FREE)' : ''}`);
    });
  }

  // Check durations explicitly
  const glow = pkgs.find((p: any) => p.id === 'pkg-glow-and-smooth');
  const bliss = pkgs.find((p: any) => p.id === 'pkg-beauty-bliss');

  console.log('\n--- DURATION CHECKS ---');
  console.log(`pkg-glow-and-smooth duration_mins: ${glow?.duration_mins} (Expected: 120) => ${glow?.duration_mins === 120 ? 'PASS' : 'FAIL'}`);
  console.log(`pkg-beauty-bliss duration_mins: ${bliss?.duration_mins} (Expected: 150) => ${bliss?.duration_mins === 150 ? 'PASS' : 'FAIL'}`);

  // Check Category Mapping
  console.log('\n--- CATEGORY DISCOVERY CHECKS ---');
  const facialPackages = pkgs.filter((p: any) => JSON.parse(p.category_ids_json || '[]').includes('cat-facials'));
  const ricaPackages = pkgs.filter((p: any) => JSON.parse(p.category_ids_json || '[]').includes('cat-rica-waxing'));

  console.log(`\nPackages found under cat-facials: ${facialPackages.length}`);
  facialPackages.forEach((p: any) => console.log(`  - ${p.name} (₹${p.selling_price}, ${p.duration_mins}m)`));

  console.log(`\nPackages found under cat-rica-waxing: ${ricaPackages.length}`);
  ricaPackages.forEach((p: any) => console.log(`  - ${p.name} (₹${p.selling_price}, ${p.duration_mins}m)`));

  // Verify RICA excludes Honey and Korean wax packages
  const honeyUnderRica = ricaPackages.filter((p: any) => p.id === 'pkg-honey-brazilian-bikini' || p.id === 'pkg-glow-and-smooth');
  console.log(`\nHoney/Korean packages incorrectly mapped to cat-rica-waxing: ${honeyUnderRica.length} => ${honeyUnderRica.length === 0 ? 'PASS (STRICT EXCLUSION)' : 'FAIL'}`);

  await db.close();
}

verify().catch(console.error);
