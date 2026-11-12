import { db, initDatabase } from '../backend/db/database.ts';

async function audit() {
  await initDatabase();

  const allFacials = await db.query<any>(`
    SELECT id, name, brand, duration_mins, selling_price, steps_count, steps_json, is_published
    FROM services
    WHERE category_id = 'cat-facials'
    ORDER BY is_published DESC, name ASC
  `);

  const published = allFacials.filter(f => f.is_published === 1);
  const unpublished = allFacials.filter(f => f.is_published === 0);

  const ownerApprovedIds = ['srv-facial-astaberry-wine', 'srv-facial-moonstar-korean'];
  const ownerApproved = published.filter(f => ownerApprovedIds.includes(f.id));

  const emptyOrUnverified = allFacials.filter(f => {
    let steps: any[] = [];
    try {
      steps = JSON.parse(f.steps_json || '[]');
    } catch {
      steps = [];
    }
    return steps.length === 0 || f.id === 'srv-facial-raaga-fairness';
  });

  const verified = published.filter(f => !ownerApprovedIds.includes(f.id) && !emptyOrUnverified.map(x => x.id).includes(f.id));

  console.log('\n========================================');
  console.log('BEAUTYDOOR DATABASE FACIAL AUDIT REPORT');
  console.log('========================================');
  console.log(`Total Facial Records in Database: ${allFacials.length}`);
  console.log(`Published (Customer-Facing) Facials: ${published.length}`);
  console.log(`Unpublished (Draft / Internal) Facials: ${unpublished.length}`);
  console.log(`Officially / Brand Verified Steps Facials: ${verified.length}`);
  console.log(`Owner-Approved Specific Steps Facials: ${ownerApproved.length}`);
  console.log(`Empty or Unverified Steps Facials: ${emptyOrUnverified.length}`);
  console.log('----------------------------------------\n');

  console.log('--- ALL 23 FACIAL RECORDS BREAKDOWN ---');
  allFacials.forEach((f, i) => {
    let steps: string[] = [];
    try {
      steps = JSON.parse(f.steps_json || '[]');
    } catch {
      steps = [];
    }
    let status = 'OFFICIALLY VERIFIED';
    if (ownerApprovedIds.includes(f.id)) status = 'OWNER APPROVED';
    if (f.id === 'srv-facial-vlcc-fruit') status = 'PARTIALLY VERIFIED / NEEDS OWNER CONFIRMATION';
    if (f.id === 'srv-facial-raaga-fairness') status = 'NEEDS OWNER CONFIRMATION (UNPUBLISHED DRAFT)';

    console.log(`${i+1}. [${f.id}] ${f.name}`);
    console.log(`   Brand: ${f.brand || 'N/A'} | Price: ₹${f.selling_price} | Published: ${f.is_published === 1 ? 'YES' : 'NO'}`);
    console.log(`   Step Count Column: ${f.steps_count} | Actual JSON Steps: ${steps.length} | Status: ${status}`);
    if (steps.length > 0) {
      console.log(`   Steps: [ ${steps.slice(0, 3).join(', ')}${steps.length > 3 ? ` ... +${steps.length-3} more` : ''} ]`);
    } else {
      console.log(`   Steps: [ EMPTY ]`);
    }
  });

  await db.close();
}

audit().catch(console.error);

