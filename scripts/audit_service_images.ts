import { db, initDatabase } from '../backend/db/database.ts';
import { getServiceImageUrl } from '../src/utils/serviceImageMapper.ts';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('=== BEAUTYDOOR SERVICE IMAGE AUDIT ===\n');
  await initDatabase();

  const services = await db.query<any>(`
    SELECT s.id, s.name, s.category_id, s.image_url, c.name as category_name
    FROM services s
    JOIN categories c ON s.category_id = c.id
    WHERE s.is_active = 1
    ORDER BY s.category_id, s.name
  `);

  console.log(`Found ${services.length} active services in database.\n`);

  let missingFiles = 0;
  let mismatchedAnatomy = 0;
  const imageCounts: Record<string, number> = {};

  const publicDir = path.resolve(process.cwd(), 'public');

  const reportRows: Array<{
    id: string;
    name: string;
    category: string;
    dbImageUrl: string | null;
    resolvedUrl: string;
    fileExists: boolean;
  }> = [];

  for (const s of services) {
    const resolvedUrl = getServiceImageUrl(s);
    imageCounts[resolvedUrl] = (imageCounts[resolvedUrl] || 0) + 1;

    // Check file existence on disk
    const localRelPath = resolvedUrl.startsWith('/') ? resolvedUrl.slice(1) : resolvedUrl;
    const fullDiskPath = path.join(publicDir, localRelPath);
    const exists = fs.existsSync(fullDiskPath);

    if (!exists) {
      missingFiles++;
      console.error(`❌ MISSING FILE: Service "${s.name}" (${s.id}) resolves to ${resolvedUrl} which does not exist on disk!`);
    }

    // Anatomical validation checks
    const sName = s.name.toLowerCase();
    const catId = s.category_id.toLowerCase();

    if ((sName.includes('bikini') || sName.includes('brazilian') || sName.includes('butt')) && !resolvedUrl.includes('bikini') && !resolvedUrl.includes('combo')) {
      mismatchedAnatomy++;
      console.error(`❌ ANATOMICAL MISMATCH: Intimate service "${s.name}" resolves to non-bikini image: ${resolvedUrl}`);
    }

    if (catId === 'cat-massage' && !resolvedUrl.includes('massage')) {
      mismatchedAnatomy++;
      console.error(`❌ ANATOMICAL MISMATCH: Massage service "${s.name}" resolves to non-massage image: ${resolvedUrl}`);
    }

    if ((sName.includes('full legs') || sName.includes('half legs')) && !sName.includes('arms') && !sName.includes('body') && !resolvedUrl.includes('legs')) {
      mismatchedAnatomy++;
      console.error(`❌ ANATOMICAL MISMATCH: Leg wax service "${s.name}" resolves to non-leg image: ${resolvedUrl}`);
    }

    reportRows.push({
      id: s.id,
      name: s.name,
      category: s.category_name,
      dbImageUrl: s.image_url,
      resolvedUrl,
      fileExists: exists
    });
  }

  console.log('\n--- IMAGE DISTRIBUTION SUMMARY ---');
  for (const [img, count] of Object.entries(imageCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`• ${img.padEnd(42)}: ${count} services`);
  }

  console.log('\n--- AUDIT RESULTS ---');
  console.log(`Total active services audited: ${services.length}`);
  console.log(`Missing image files on disk : ${missingFiles}`);
  console.log(`Anatomical mismatches        : ${mismatchedAnatomy}`);

  if (missingFiles === 0 && mismatchedAnatomy === 0) {
    console.log('\n✅ 100% SERVICE IMAGES VALIDATED SUCCESSFULLY!\n');
  } else {
    console.error('\n❌ AUDIT FAILED WITH ISSUES ABOVE!\n');
    process.exit(1);
  }

  await db.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
