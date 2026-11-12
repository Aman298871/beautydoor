import { db, initDatabase } from '../backend/db/database.ts';

async function main() {
  await initDatabase();
  const facials = await db.query<any>(`
    SELECT id, name, brand, duration_mins, selling_price, steps_count, steps_json, is_published
    FROM services
    WHERE category_id = 'cat-facials'
    ORDER BY name
  `);

  console.log(`\nFound ${facials.length} facials in database:`);
  for (const f of facials) {
    let steps: string[] = [];
    try {
      steps = JSON.parse(f.steps_json || '[]');
    } catch {
      steps = [];
    }
    console.log(`\nID: ${f.id}`);
    console.log(`Name: ${f.name} | Brand: ${f.brand || 'None'} | Price: ₹${f.selling_price} | Duration: ${f.duration_mins}m | Steps Count: ${f.steps_count} | Steps Length: ${steps.length}`);
    console.log('Steps:', steps);
  }
  await db.close();
}

main().catch(console.error);

