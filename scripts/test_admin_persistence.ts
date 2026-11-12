import { db, initDatabase } from '../backend/db/database.ts';

async function testAdminPersistence() {
  await initDatabase();

  console.log('\n--- TESTING ADMIN EDIT PERSISTENCE ---');
  // 1. Simulate admin updating package duration to 125 mins
  await db.execute('UPDATE packages SET duration_mins = 125, duration_display = ? WHERE id = ?', ['2 hours 5 mins', 'pkg-glow-and-smooth']);
  
  let p = await db.query<any>('SELECT duration_mins, duration_display FROM packages WHERE id = ?', ['pkg-glow-and-smooth']);
  console.log(`Admin update result: duration_mins = ${p[0]?.duration_mins}, duration_display = ${p[0]?.duration_display} => ${p[0]?.duration_mins === 125 ? 'PASS' : 'FAIL'}`);

  // Restore back to approved 120 mins
  await db.execute('UPDATE packages SET duration_mins = 120, duration_display = ? WHERE id = ?', ['2 hours', 'pkg-glow-and-smooth']);
  p = await db.query<any>('SELECT duration_mins, duration_display FROM packages WHERE id = ?', ['pkg-glow-and-smooth']);
  console.log(`Restored to approved: duration_mins = ${p[0]?.duration_mins} => ${p[0]?.duration_mins === 120 ? 'PASS' : 'FAIL'}`);

  // 2. Simulate admin updating service steps
  const customSteps = JSON.stringify(['Custom Step 1', 'Custom Step 2', 'Custom Step 3']);
  await db.execute('UPDATE services SET steps_json = ?, steps_count = 3 WHERE id = ?', [customSteps, 'srv-facial-astaberry-wine']);
  
  let s = await db.query<any>('SELECT steps_json, steps_count FROM services WHERE id = ?', ['srv-facial-astaberry-wine']);
  console.log(`Admin service steps update: count = ${s[0]?.steps_count} => ${s[0]?.steps_count === 3 ? 'PASS' : 'FAIL'}`);

  // Restore back to approved 5 steps
  const approvedAstaberry = JSON.stringify(['Wine Scrub', 'Wine Gel', 'Wine Creme', 'Wine Mask', 'Wine Serum']);
  await db.execute('UPDATE services SET steps_json = ?, steps_count = 5 WHERE id = ?', [approvedAstaberry, 'srv-facial-astaberry-wine']);
  s = await db.query<any>('SELECT steps_json, steps_count FROM services WHERE id = ?', ['srv-facial-astaberry-wine']);
  console.log(`Restored to owner approved 5 steps: count = ${s[0]?.steps_count} => ${s[0]?.steps_count === 5 ? 'PASS' : 'FAIL'}`);

  await db.close();
}

testAdminPersistence().catch(console.error);

