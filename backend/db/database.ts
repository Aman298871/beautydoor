import pg from 'pg';
const { Pool } = pg;
import bcrypt from 'bcryptjs';
import { MASTER_CATEGORIES, MASTER_SERVICES, MASTER_PACKAGES } from './masterCatalogue.ts';

// Detect environment & target database engine
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

// Validate database configuration
if (isProduction && !databaseUrl) {
  throw new Error(
    'CRITICAL: DATABASE_URL environment variable is required in production mode. Refusing to start without PostgreSQL.'
  );
}

export type DbEngine = 'postgres';
export const DB_ENGINE: DbEngine = 'postgres';

console.log('[DB] Initializing database layer using engine: POSTGRESQL');

// --- POSTGRESQL POOL SETUP ---
let pgPool: pg.Pool;

if (databaseUrl) {
  // SSL configuration: respect DATABASE_SSL_NO_VERIFY, enable standard SSL for external hosts, allow non-SSL for internal hosts
  let sslConfig: boolean | { rejectUnauthorized: boolean } = false;
  if (process.env.DATABASE_SSL_NO_VERIFY === 'true') {
    sslConfig = { rejectUnauthorized: false };
  } else if (
    databaseUrl.includes('sslmode=require') ||
    databaseUrl.includes('.render.com') ||
    databaseUrl.includes('supabase.co') ||
    databaseUrl.includes('neon.tech')
  ) {
    sslConfig = true; // Secure certificate verification enabled
  }

  pgPool = new Pool({
    connectionString: databaseUrl,
    ssl: sslConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pgPool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle PostgreSQL client:', err);
  });
} else {
  console.log('[DB] DATABASE_URL not set. Initializing in-memory PostgreSQL emulator for local testing.');
  const { newDb } = await import('pg-mem');
  const memDb = newDb();
  const { Pool: MemPool } = memDb.adapters.createPg();
  pgPool = new MemPool() as unknown as pg.Pool;
}

/**
 * Convert ? query placeholders to , , etc. for PostgreSQL
 */
function toPgQuery(sql: string): string {
  let paramIndex = 1;
  return sql.replace(/\?/g, () => `$${paramIndex++}`);
}

/**
 * Universal Database Wrapper for PostgreSQL
 */
export class DatabaseWrapper {
  get isPostgres(): boolean {
    return true;
  }

  get isSqlite(): boolean {
    return false;
  }

  get pool(): pg.Pool {
    return pgPool;
  }

  /**
   * Execute parameterized query returning rows
   */
  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const pgSql = toPgQuery(sql);
    const res = await pgPool.query(pgSql, params);
    return res.rows as T[];
  }

  /**
   * Execute query returning single row or undefined
   */
  async queryRow<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    const pgSql = toPgQuery(sql);
    const res = await pgPool.query(pgSql, params);
    return (res.rows[0] as T) || undefined;
  }

  /**
   * Execute INSERT/UPDATE/DELETE query
   */
  async execute(sql: string, params: any[] = []): Promise<{ rowCount: number }> {
    const pgSql = toPgQuery(sql);
    const res = await pgPool.query(pgSql, params);
    return { rowCount: res.rowCount || 0 };
  }

  /**
   * Transaction execution helper for PostgreSQL
   */
  async withTransaction<T>(callback: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Graceful shutdown for connection pool
   */
  async close(): Promise<void> {
    if (pgPool && typeof pgPool.end === 'function') {
      await pgPool.end();
      console.log('[DB] PostgreSQL pool closed.');
    }
  }
}

export const db = new DatabaseWrapper();

// --- SCHEMA DEFINITIONS FOR POSTGRESQL ---
export async function initDatabase(): Promise<void> {
  await initPostgresSchema(pgPool);
  await seedEssentialData();
  await seedFaqData();
}

async function initPostgresSchema(pool: pg.Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id VARCHAR(255) PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(64) NOT NULL DEFAULT 'admin',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at VARCHAR(64) NOT NULL,
      last_login VARCHAR(64)
    );

    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS services (
      id VARCHAR(255) PRIMARY KEY,
      category_id VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT NOT NULL,
      detailed_description TEXT,
      benefits_json TEXT NOT NULL DEFAULT '[]',
      duration_mins INTEGER NOT NULL,
      original_price INTEGER,
      selling_price INTEGER NOT NULL,
      discount_percent INTEGER NOT NULL DEFAULT 0,
      whats_included_json TEXT NOT NULL DEFAULT '[]',
      ingredients_json TEXT NOT NULL DEFAULT '[]',
      steps_json TEXT NOT NULL DEFAULT '[]',
      before_instructions TEXT,
      after_instructions TEXT,
      room_conditions TEXT,
      equipment_requirements TEXT,
      hygiene_precautions TEXT,
      brand VARCHAR(128),
      service_type VARCHAR(64) NOT NULL DEFAULT 'single',
      is_combo INTEGER NOT NULL DEFAULT 0,
      combo_items_json TEXT NOT NULL DEFAULT '[]',
      steps_count INTEGER,
      sub_type VARCHAR(64),
      is_active INTEGER NOT NULL DEFAULT 1,
      is_published INTEGER NOT NULL DEFAULT 1,
      pending_notes TEXT,
      is_popular INTEGER NOT NULL DEFAULT 0,
      is_bestseller INTEGER NOT NULL DEFAULT 0,
      is_featured_deal INTEGER NOT NULL DEFAULT 0,
      deal_badge VARCHAR(64),
      image_url TEXT,
      created_at VARCHAR(64) NOT NULL,
      updated_at VARCHAR(64) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS service_variants (
      id VARCHAR(255) PRIMARY KEY,
      service_id VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      price_delta INTEGER NOT NULL DEFAULT 0,
      duration_delta INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS service_addons (
      id VARCHAR(255) PRIMARY KEY,
      service_id VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      price INTEGER NOT NULL,
      duration_mins INTEGER NOT NULL DEFAULT 15
    );

    CREATE TABLE IF NOT EXISTS packages (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      subtitle TEXT,
      description TEXT NOT NULL,
      duration_mins INTEGER NOT NULL,
      duration_display VARCHAR(128) NOT NULL,
      original_price INTEGER NOT NULL,
      selling_price INTEGER NOT NULL,
      discount_percent INTEGER NOT NULL DEFAULT 0,
      inclusions_json TEXT NOT NULL DEFAULT '[]',
      benefits_json TEXT NOT NULL DEFAULT '[]',
      badge VARCHAR(64),
      is_published INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at VARCHAR(64) NOT NULL,
      updated_at VARCHAR(64) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS hygiene_commitments (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      icon_name VARCHAR(64) NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at VARCHAR(64) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS price_audit_logs (
      id VARCHAR(255) PRIMARY KEY,
      item_type VARCHAR(64) NOT NULL,
      item_id VARCHAR(255) NOT NULL,
      item_name VARCHAR(255) NOT NULL,
      old_price INTEGER,
      new_price INTEGER NOT NULL,
      changed_by VARCHAR(255) NOT NULL,
      timestamp VARCHAR(64) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS campaigns (
      id VARCHAR(255) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      banner_title VARCHAR(255) NOT NULL,
      banner_subtitle TEXT,
      banner_image_url TEXT,
      cta_label VARCHAR(64) NOT NULL,
      destination_url VARCHAR(255) NOT NULL,
      start_time VARCHAR(64) NOT NULL,
      end_time VARCHAR(64) NOT NULL,
      is_flash_deal INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      discount_type VARCHAR(64) NOT NULL,
      discount_val INTEGER NOT NULL,
      badge_text VARCHAR(64),
      target_category_ids_json TEXT NOT NULL DEFAULT '[]',
      target_service_ids_json TEXT NOT NULL DEFAULT '[]',
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at VARCHAR(64) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id VARCHAR(255) PRIMARY KEY,
      code VARCHAR(64) UNIQUE NOT NULL,
      discount_type VARCHAR(64) NOT NULL,
      discount_value INTEGER NOT NULL,
      min_order_amount INTEGER NOT NULL DEFAULT 0,
      max_discount INTEGER NOT NULL DEFAULT 9999,
      expires_at VARCHAR(64) NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS territories (
      id VARCHAR(255) PRIMARY KEY,
      city VARCHAR(128) NOT NULL,
      area_name VARCHAR(255) NOT NULL,
      pincode VARCHAR(32) UNIQUE NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      delivery_fee INTEGER NOT NULL DEFAULT 0,
      min_order_amount INTEGER NOT NULL DEFAULT 499
    );

    CREATE TABLE IF NOT EXISTS beauticians (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(64) UNIQUE NOT NULL,
      specialties_json TEXT NOT NULL DEFAULT '[]',
      territories_json TEXT NOT NULL DEFAULT '[]',
      experience_years INTEGER NOT NULL DEFAULT 3,
      is_active INTEGER NOT NULL DEFAULT 1,
      status VARCHAR(64) NOT NULL DEFAULT 'available',
      rating NUMERIC NOT NULL DEFAULT 5.0,
      total_jobs INTEGER NOT NULL DEFAULT 0,
      created_at VARCHAR(64) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id VARCHAR(255) PRIMARY KEY,
      customer_id VARCHAR(255) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(64) NOT NULL,
      customer_email VARCHAR(255),
      flat VARCHAR(255) NOT NULL,
      landmark VARCHAR(255),
      area VARCHAR(255) NOT NULL,
      city VARCHAR(128) NOT NULL,
      pincode VARCHAR(32) NOT NULL,
      subtotal INTEGER NOT NULL,
      package_discount INTEGER NOT NULL DEFAULT 0,
      campaign_discount INTEGER NOT NULL DEFAULT 0,
      coupon_discount INTEGER NOT NULL DEFAULT 0,
      coupon_code VARCHAR(64),
      slot_charge INTEGER NOT NULL DEFAULT 0,
      delivery_fee INTEGER NOT NULL DEFAULT 0,
      total_payable INTEGER NOT NULL,
      appointment_date VARCHAR(64) NOT NULL,
      appointment_slot VARCHAR(64) NOT NULL,
      payment_method VARCHAR(64) NOT NULL DEFAULT 'COD',
      payment_status VARCHAR(64) NOT NULL DEFAULT 'pending',
      razorpay_order_id VARCHAR(255),
      razorpay_payment_id VARCHAR(255),
      booking_status VARCHAR(64) NOT NULL DEFAULT 'pending',
      assigned_beautician_id VARCHAR(255),
      internal_notes TEXT,
      created_at VARCHAR(64) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS booking_items (
      id VARCHAR(255) PRIMARY KEY,
      booking_id VARCHAR(255) NOT NULL,
      service_id VARCHAR(255) NOT NULL,
      service_name VARCHAR(255) NOT NULL,
      variant_id VARCHAR(255),
      variant_name VARCHAR(255),
      addon_ids_json TEXT NOT NULL DEFAULT '[]',
      addon_names_json TEXT NOT NULL DEFAULT '[]',
      unit_price INTEGER NOT NULL,
      final_item_price INTEGER NOT NULL,
      duration_mins INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id VARCHAR(255) PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      customer_location VARCHAR(255) NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      service_tag VARCHAR(128) NOT NULL,
      verified_booking INTEGER NOT NULL DEFAULT 1,
      is_approved INTEGER NOT NULL DEFAULT 1,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at VARCHAR(64) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(255) PRIMARY KEY,
      admin_username VARCHAR(255) NOT NULL,
      action VARCHAR(64) NOT NULL,
      resource_type VARCHAR(64) NOT NULL,
      resource_id VARCHAR(255),
      details_json TEXT,
      timestamp VARCHAR(64) NOT NULL,
      ip_address VARCHAR(64)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(255) PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS faqs (
      id VARCHAR(255) PRIMARY KEY,
      audience VARCHAR(64) NOT NULL DEFAULT 'customer',
      category VARCHAR(128) NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      keywords_json TEXT NOT NULL DEFAULT '[]',
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_dynamic INTEGER NOT NULL DEFAULT 0,
      dynamic_handler VARCHAR(128),
      created_at VARCHAR(64) NOT NULL,
      updated_at VARCHAR(64) NOT NULL
    );
  `);
}

async function seedEssentialData() {
  const now = new Date().toISOString();

  // 1. Initial Admin User Provisioning via ENV (Security compliance)
  // Reads ADMIN_USERNAME / ADMIN_PASSWORD from environment, with secure fallback
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? null : 'Admin@BeautyDoor2026');
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@beautydoor.in';

  const existingAdmin = await db.queryRow('SELECT id FROM admin_users WHERE username = ?', [adminUsername]);
  if (!existingAdmin && adminPassword) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(adminPassword, salt);
    await db.execute(`
      INSERT INTO admin_users (id, username, email, password_hash, role, is_active, created_at)
      VALUES (?, ?, ?, ?, 'superadmin', 1, ?)
    `, [`admin-${Date.now()}`, adminUsername, adminEmail, hash, now]);
    console.log(`[DB] Admin account provisioned for user: ${adminUsername}`);
  }

  // 2. Initial Settings (idempotent; does not overwrite custom admin updates)
  const defaultSettings: Record<string, string> = {
    brand_name: 'BeautyDoor',
    tagline: 'Beauty at your doorstep',
    contact_name: 'Preeti Singh',
    contact_phone: '+91 93103 72015',
    contact_email: 'hello@beautydoor.in',
    support_whatsapp: '+91 93103 72015',
    working_hours_start: '08:00 AM',
    working_hours_end: '06:00 PM',
    slot_charge_8am: '100',
    slot_charge_6pm: '100',
    cancellation_window_hours: '4',
    cancellation_policy: 'Complimentary cancellation up to 4 hours prior to appointment.',
    announcement_text: '✨ Delhi NCR Official Catalogue: RICA, Roll-On, Honey, Korean & Brazilian Peel-Off Waxing | Cash after service',
    announcement_active: 'true',
    razorpay_enabled: 'false',
    razorpay_key_id: '',
    google_places_api_key: '',
    google_place_id: '',
    min_order_amount: '499',
    hygiene_heading: 'Your Beauty. Your Comfort. Our Hygiene Promise.',
    hygiene_subheading: 'Salon-quality rituals brought safely to your home with single-use protective disposables, sanitized tools, and verified female specialists.'
  };

  for (const [k, v] of Object.entries(defaultSettings)) {
    const existing = await db.queryRow('SELECT key FROM settings WHERE key = ?', [k]);
    if (!existing) {
      await db.execute('INSERT INTO settings (key, value) VALUES (?, ?)', [k, v]);
    }
  }

  // Idempotent migration of legacy placeholder contacts to verified business info
  await db.execute("UPDATE settings SET value = 'Preeti Singh' WHERE key = 'contact_name' AND (value = '' OR value IS NULL)");
  await db.execute("UPDATE settings SET value = '+91 93103 72015' WHERE key = 'contact_phone' AND (value = '+91 99991 23456' OR value LIKE '%99991%')");
  await db.execute("UPDATE settings SET value = '+91 93103 72015' WHERE key = 'support_whatsapp' AND (value = '+91 99991 23456' OR value LIKE '%99991%')");
  await db.execute("UPDATE settings SET value = 'hello@beautydoor.in' WHERE key = 'contact_email' AND (value = 'concierge@beautydoor.in' OR value LIKE '%concierge%')");
  await db.execute("UPDATE settings SET value = '06:00 PM' WHERE key = 'working_hours_end' AND value = '08:00 PM'");

  // 3. Official Service Categories (idempotent)
  const catCountRow = await db.queryRow<{ count: string | number }>('SELECT COUNT(*) as count FROM categories');
  if (Number(catCountRow?.count || 0) === 0) {
    for (const c of MASTER_CATEGORIES) {
      await db.execute(
        'INSERT INTO categories (id, name, slug, description, display_order, is_active) VALUES (?, ?, ?, ?, ?, 1)',
        [c.id, c.name, c.slug, c.description, c.display_order]
      );
    }
  }

  // 4. Genuine Delhi NCR Territories & Serviceable Pincodes (idempotent)
  const terCountRow = await db.queryRow<{ count: string | number }>('SELECT COUNT(*) as count FROM territories');
  if (Number(terCountRow?.count || 0) === 0) {
    const territories = [
      { id: 'ter-del-1', city: 'Delhi', area: 'Vasant Kunj & Shanti Kunj', pin: '110070', fee: 0, min: 499 },
      { id: 'ter-del-2', city: 'Delhi', area: 'Hauz Khas, Green Park & Safdarjung', pin: '110016', fee: 0, min: 499 },
      { id: 'ter-del-3', city: 'Delhi', area: 'Saket, Malviya Nagar & Sainik Farm', pin: '110017', fee: 0, min: 499 },
      { id: 'ter-del-4', city: 'Delhi', area: 'Greater Kailash 1 & 2 (GK)', pin: '110048', fee: 0, min: 499 },
      { id: 'ter-del-5', city: 'Delhi', area: 'Lajpat Nagar & Defence Colony', pin: '110024', fee: 0, min: 499 },
      { id: 'ter-del-6', city: 'Delhi', area: 'Dwarka (Sector 4, 6, 10, 12, 19)', pin: '110075', fee: 0, min: 499 },
      { id: 'ter-del-7', city: 'Delhi', area: 'Punjabi Bagh & Rajouri Garden', pin: '110026', fee: 0, min: 499 },
      { id: 'ter-del-8', city: 'Delhi', area: 'Rohini (Sector 7, 8, 9, 13, 14)', pin: '110085', fee: 0, min: 499 },
      { id: 'ter-del-9', city: 'Delhi', area: 'Pitampura & Saraswati Vihar', pin: '110034', fee: 0, min: 499 },
      { id: 'ter-del-10', city: 'Delhi', area: 'Mayur Vihar Phase 1 & 2', pin: '110091', fee: 0, min: 499 },
      { id: 'ter-ggn-1', city: 'Gurugram', area: 'DLF Phase 1, 2, 3, 4, 5', pin: '122002', fee: 0, min: 499 },
      { id: 'ter-ggn-2', city: 'Gurugram', area: 'Sohna Road & Sector 48, 49, 50', pin: '122018', fee: 0, min: 499 },
      { id: 'ter-ggn-3', city: 'Gurugram', area: 'Golf Course Extn & Sector 65, 66', pin: '122102', fee: 0, min: 499 },
      { id: 'ter-nda-1', city: 'Noida', area: 'Sector 15, 16, 18 (Film City & Atta)', pin: '201301', fee: 0, min: 499 },
      { id: 'ter-nda-2', city: 'Noida', area: 'Sector 50, 76, 78 (Expressway Corridor)', pin: '201307', fee: 0, min: 499 },
      { id: 'ter-nda-3', city: 'Noida', area: 'Sector 128, 137, 142 (Jaypee Greens)', pin: '201304', fee: 0, min: 499 },
      { id: 'ter-gnda-1', city: 'Greater Noida', area: 'Pari Chowk, Alpha, Beta & Gamma', pin: '201310', fee: 49, min: 599 },
      { id: 'ter-gzb-1', city: 'Ghaziabad', area: 'Indirapuram & Ahinsa Khand', pin: '201014', fee: 0, min: 499 },
      { id: 'ter-gzb-2', city: 'Ghaziabad', area: 'Vaishali & Kaushambi', pin: '201010', fee: 0, min: 499 },
      { id: 'ter-fbd-1', city: 'Faridabad', area: 'Sector 14, 15, 16 & Greenfield', pin: '121002', fee: 0, min: 499 }
    ];

    for (const t of territories) {
      await db.execute(
        'INSERT INTO territories (id, city, area_name, pincode, is_active, delivery_fee, min_order_amount) VALUES (?, ?, ?, ?, 1, ?, ?)',
        [t.id, t.city, t.area, t.pin, t.fee, t.min]
      );
    }
  }

  // 5. Promotional Coupons (idempotent)
  const cpCountRow = await db.queryRow<{ count: string | number }>('SELECT COUNT(*) as count FROM coupons');
  if (Number(cpCountRow?.count || 0) === 0) {
    const coupons = [
      { id: 'cp-1', code: 'BEAUTYFIRST', type: 'flat', val: 200, min: 799, max: 200, exp: '2028-12-31', desc: 'Flat ₹200 savings on your inaugural at-home beauty ritual.' },
      { id: 'cp-2', code: 'GLOW15', type: 'percentage', val: 15, min: 1499, max: 500, exp: '2028-12-31', desc: '15% extra savings on premium facials and cleanups.' },
      { id: 'cp-3', code: 'NCRBRIDE', type: 'flat', val: 800, min: 3999, max: 800, exp: '2028-12-31', desc: '₹800 savings on royal bridal packages.' }
    ];
    for (const c of coupons) {
      await db.execute(
        'INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_discount, expires_at, is_active, description) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)',
        [c.id, c.code, c.type, c.val, c.min, c.max, c.exp, c.desc]
      );
    }
  }

  // 6. OFFICIAL SERVICES (Master Catalogue - idempotent, preserves admin updates)
  const srvCountRow = await db.queryRow<{ count: string | number }>('SELECT COUNT(*) as count FROM services');
  if (Number(srvCountRow?.count || 0) === 0) {
    for (const s of MASTER_SERVICES) {
      await db.execute(`
        INSERT INTO services (
          id, category_id, name, slug, description, detailed_description,
          benefits_json, duration_mins, original_price, selling_price, discount_percent,
          whats_included_json, ingredients_json, steps_json,
          before_instructions, after_instructions, room_conditions, equipment_requirements, hygiene_precautions,
          brand, service_type, is_combo, combo_items_json, steps_count, sub_type,
          is_active, is_published, pending_notes, is_popular, is_bestseller, is_featured_deal, deal_badge,
          image_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        s.id,
        s.category_id,
        s.name,
        s.slug,
        s.description,
        s.detailed_description || s.description,
        JSON.stringify(s.is_combo ? (s.combo_items || []) : [s.name]),
        s.duration_mins,
        s.original_price || null,
        s.selling_price,
        s.discount_percent || 0,
        JSON.stringify(s.combo_items || [s.name]),
        JSON.stringify([]),
        JSON.stringify([]),
        s.before_instructions || null,
        s.after_instructions || null,
        s.room_conditions || null,
        s.equipment_requirements || null,
        s.hygiene_precautions || null,
        s.brand || null,
        s.service_type || 'single',
        s.is_combo || 0,
        JSON.stringify(s.combo_items || []),
        s.steps_count || null,
        s.sub_type || null,
        1,
        s.is_published,
        s.pending_notes || null,
        s.is_popular || 0,
        s.is_bestseller || 0,
        s.is_featured_deal || 0,
        s.deal_badge || null,
        '/assets/aistudio/WhatsApp_Image_2026-11-02_at_3.15.17_PM_49e36dff.jpeg',
        now,
        now
      ]);
    }
  }

  // 7. OFFICIAL PACKAGES (idempotent)
  const pkgCountRow = await db.queryRow<{ count: string | number }>('SELECT COUNT(*) as count FROM packages');
  if (Number(pkgCountRow?.count || 0) === 0) {
    let pOrder = 1;
    for (const p of MASTER_PACKAGES) {
      await db.execute(`
        INSERT INTO packages (
          id, name, slug, subtitle, description, duration_mins, duration_display,
          original_price, selling_price, discount_percent, inclusions_json, benefits_json,
          badge, is_published, display_order, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        p.id,
        p.name,
        p.slug,
        p.subtitle,
        p.description,
        p.duration_mins,
        p.duration_display,
        p.original_price,
        p.selling_price,
        p.discount_percent,
        JSON.stringify(p.inclusions),
        JSON.stringify(p.benefits),
        p.badge || null,
        1,
        pOrder++,
        now,
        now
      ]);
    }
  }

  // 8. HYGIENE & SAFETY COMMITMENTS (idempotent)
  const hygCountRow = await db.queryRow<{ count: string | number }>('SELECT COUNT(*) as count FROM hygiene_commitments');
  if (Number(hygCountRow?.count || 0) === 0) {
    const commitments = [
      { id: 'hyg-1', title: 'Single-Use Disposable Waxing Spatulas', desc: 'Fresh disposable wooden spatulas used for each wax application. We strictly observe zero double-dipping protocol.', icon: 'Sparkles', order: 1 },
      { id: 'hyg-2', title: 'Fresh Disposable Bedsheets & Headbands', desc: 'A brand-new sealed disposable protective bedsheet and headband laid out in your room for every single visit.', icon: 'ShieldCheck', order: 2 },
      { id: 'hyg-3', title: 'Clean & Sanitized Metal Tools', desc: 'All tweezers, scissors, and cuticle instruments are thoroughly sterilized and sealed in individual pouches before arrival.', icon: 'CheckCircle2', order: 3 },
      { id: 'hyg-4', title: 'Fresh Clean Service Towels', desc: 'Clean, freshly laundered towels delivered in sealed pouches for each client appointment.', icon: 'Sparkles', order: 4 },
      { id: 'hyg-5', title: 'Monodosage Sealed Skincare Packs', desc: 'Facials and cleanups utilize single-use, client-specific sealed tubes and packs unsealed exclusively before your eyes.', icon: 'ShieldCheck', order: 5 },
      { id: 'hyg-6', title: 'Proper Hand & Product Hygiene', desc: 'Specialists practice hand sanitization, wear fresh disposable masks and gloves, and follow professional handling procedures.', icon: 'CheckCircle2', order: 6 },
      { id: 'hyg-7', title: 'Post-Service Area Cleaning & Sanitization', desc: 'After treatments conclude, our specialist cleans and sanitizes your area, packing all single-use disposables away.', icon: 'Sparkles', order: 7 },
      { id: 'hyg-8', title: 'Client Comfort, Sanctuary & Privacy', desc: 'Strictly female-verified estheticians respecting your household sanctity and personal space at all times.', icon: 'ShieldCheck', order: 8 }
    ];

    for (const h of commitments) {
      await db.execute(
        'INSERT INTO hygiene_commitments (id, title, description, icon_name, display_order, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)',
        [h.id, h.title, h.desc, h.icon, h.order, now]
      );
    }
  }

  // 9. Beauticians Roster (idempotent)
  const beauCountRow = await db.queryRow<{ count: string | number }>('SELECT COUNT(*) as count FROM beauticians');
  if (Number(beauCountRow?.count || 0) === 0) {
    const beauticians = [
      { id: 'beau-1', name: 'Priya Sharma', phone: '+91 98112 44321', specs: JSON.stringify(['cat-rica-waxing', 'cat-honey-waxing', 'cat-korean-waxing', 'cat-facials']), terrs: JSON.stringify(['Delhi', 'Gurugram']), exp: 8, rating: 4.9, jobs: 428 },
      { id: 'beau-2', name: 'Meenakshi Sen', phone: '+91 98731 88920', specs: JSON.stringify(['cat-brazilian-peel-off', 'cat-massage', 'cat-manicure-pedicure']), terrs: JSON.stringify(['Noida', 'Ghaziabad', 'Greater Noida']), exp: 6, rating: 4.9, jobs: 382 },
      { id: 'beau-3', name: 'Ananya Verma', phone: '+91 99105 12433', specs: JSON.stringify(['cat-rica-waxing', 'cat-korean-waxing', 'cat-threading', 'cat-facials']), terrs: JSON.stringify(['Delhi', 'Faridabad']), exp: 9, rating: 5.0, jobs: 514 }
    ];
    for (const b of beauticians) {
      await db.execute(
        "INSERT INTO beauticians (id, name, phone, specialties_json, territories_json, experience_years, is_active, status, rating, total_jobs, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, 'available', ?, ?, ?)",
        [b.id, b.name, b.phone, b.specs, b.terrs, b.exp, b.rating, b.jobs, now]
      );
    }
  }

  // 10. Campaigns (idempotent)
  const campCountRow = await db.queryRow<{ count: string | number }>('SELECT COUNT(*) as count FROM campaigns');
  if (Number(campCountRow?.count || 0) === 0) {
    const campaigns = [
      {
        id: 'camp-waxing-luxury',
        title: 'Italian Liposoluble & Brazilian Waxing Rituals',
        slug: 'waxing-rituals-delhi-ncr',
        banner_title: 'Italian RICA & Brazilian Waxing from ₹280',
        banner_subtitle: 'Colophony-free waxes for minimal redness, smooth satin skin, and strictly zero double-dipping across Delhi NCR.',
        banner_image_url: '/banners/waxing_luxury_banner.svg',
        cta_label: 'Explore Waxing',
        destination_url: '/services?category=cat-rica-waxing',
        start_time: new Date(Date.now() - 86400000).toISOString(),
        end_time: new Date(Date.now() + 60 * 86400000).toISOString(),
        is_flash_deal: 0,
        is_published: 1,
        discount_type: 'percentage',
        discount_val: 20,
        badge_text: 'Zero Double-Dipping',
        target_category_ids: JSON.stringify(['cat-rica-waxing', 'cat-honey-waxing', 'cat-korean-waxing', 'cat-brazilian-peel-off']),
        target_service_ids: JSON.stringify(['srv-rica-full-arms-underarms-full-legs', 'srv-korean-full-arms-underarms-full-legs']),
        display_order: 1
      },
      {
        id: 'camp-botanical-facials',
        title: 'Botanical Radiance & O3+ Derma Facials',
        slug: 'botanical-facials-delhi-ncr',
        banner_title: 'O3+ & Cheryl’s Monodose Facials at Home',
        banner_subtitle: 'Oxygenating glow therapy with authentic salon kits unsealed directly at your vanity table with hospital-grade sanitization.',
        banner_image_url: '/banners/facial_luxury_banner.svg',
        cta_label: 'Explore Facials',
        destination_url: '/services?category=cat-facials',
        start_time: new Date(Date.now() - 86400000).toISOString(),
        end_time: new Date(Date.now() + 60 * 86400000).toISOString(),
        is_flash_deal: 0,
        is_published: 1,
        discount_type: 'percentage',
        discount_val: 25,
        badge_text: 'Monodose Sealed',
        target_category_ids: JSON.stringify(['cat-facials']),
        target_service_ids: JSON.stringify(['srv-facial-o3-whitening', 'srv-facial-cheryls-glovite']),
        display_order: 2
      },
      {
        id: 'camp-pedicure-wellness',
        title: 'Rose Petal Mani-Pedi & Foot Spa Therapies',
        slug: 'rose-pedicure-delhi-ncr',
        banner_title: 'Effervescent Rose Petal Foot Spas at Home',
        banner_subtitle: 'Autoclaved stainless steel tools, botanical effervescent bath soaks, and intensive heel callus smoothing.',
        banner_image_url: '/banners/pedicure_luxury_banner.svg',
        cta_label: 'Explore Mani-Pedi',
        destination_url: '/services?category=cat-manicure-pedicure',
        start_time: new Date(Date.now() - 86400000).toISOString(),
        end_time: new Date(Date.now() + 60 * 86400000).toISOString(),
        is_flash_deal: 0,
        is_published: 1,
        discount_type: 'percentage',
        discount_val: 15,
        badge_text: 'Autoclaved Tools',
        target_category_ids: JSON.stringify(['cat-manicure-pedicure']),
        target_service_ids: JSON.stringify(['srv-mani-pedi-rose-spa']),
        display_order: 3
      }
    ];

    for (const cp of campaigns) {
      await db.execute(`
        INSERT INTO campaigns (
          id, title, slug, banner_title, banner_subtitle, banner_image_url,
          cta_label, destination_url, start_time, end_time, is_flash_deal, is_published,
          discount_type, discount_val, badge_text, target_category_ids_json, target_service_ids_json,
          display_order, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        cp.id, cp.title, cp.slug, cp.banner_title, cp.banner_subtitle, cp.banner_image_url,
        cp.cta_label, cp.destination_url, cp.start_time, cp.end_time, cp.is_flash_deal, cp.is_published,
        cp.discount_type, cp.discount_val, cp.badge_text, cp.target_category_ids, cp.target_service_ids,
        cp.display_order, now
      ]);
    }
  }

  // 11. Initial Verified Reviews (idempotent)
  const revCountRow = await db.queryRow<{ count: string | number }>('SELECT COUNT(*) as count FROM reviews');
  if (Number(revCountRow?.count || 0) === 0) {
    const reviews = [
      { id: 'rev-1', name: 'Simran Khurana', loc: 'Greater Kailash 1, Delhi', rating: 5, comment: 'Priya arrived right on time with sealed disposables. The RICA waxing was almost painless and my room was left sparkling clean. Truly salon luxury in the comfort of home!', tag: 'RICA Full Body Ritual', order: 1 },
      { id: 'rev-2', name: 'Dr. Radhika Nair', loc: 'DLF Phase 4, Gurugram', rating: 5, comment: 'The O3+ Whitening facial was unsealed in front of me. Exceptional hygienic technique and wonderful calming massage.', tag: 'O3+ Luxury Facial', order: 2 },
      { id: 'rev-3', name: 'Tanvi Aggarwal', loc: 'Sector 50, Noida', rating: 5, comment: 'Brazilian peel-off wax was completely stripless and gentle. No double dipping protocol gave me total peace of mind.', tag: 'Brazilian Peel-Off Wax', order: 3 }
    ];
    for (const r of reviews) {
      await db.execute(
        'INSERT INTO reviews (id, customer_name, customer_location, rating, comment, service_tag, verified_booking, is_approved, display_order, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, ?)',
        [r.id, r.name, r.loc, r.rating, r.comment, r.tag, r.order, now]
      );
    }
  }
}

async function seedFaqData() {
  const faqCountRow = await db.queryRow<{ count: string | number }>('SELECT COUNT(*) as count FROM faqs');
  if (Number(faqCountRow?.count || 0) > 0) return;

  const now = new Date().toISOString();

  const customerFaqs = [
    {
      id: 'faq-cust-how-to-book',
      audience: 'customer',
      category: 'Booking & Appointments',
      question: 'How can I book a service?',
      answer: `Booking your at-home salon appointment with BeautyDoor takes less than 60 seconds:
1. Browse our service catalogue or search for your desired treatment (RICA, Honey, Korean, Brazilian waxing, or Beauty Packages).
2. Click "Add to Cart" or "Book Package".
3. Open your Cart, verify your selected treatments, and click "Book Appointment".
4. Select your preferred date, convenient 2-hour arrival slot, and service address in Delhi NCR.
5. Choose your payment method (Online via UPI/Card or Cash after service).
6. Instant confirmation will be sent with details of your assigned certified beauty specialist.`,
      keywords: ['book', 'how to book', 'booking', 'schedule', 'appointment', 'reserve', 'kaise book kare', 'booking kaise kare', 'book service', 'slot book', 'order kaise kare'],
      display_order: 1,
      is_dynamic: 0,
      dynamic_handler: null
    },
    {
      id: 'faq-cust-services-offered',
      audience: 'customer',
      category: 'Services & Treatments',
      question: 'What services do you offer?',
      answer: 'BeautyDoor brings full salon-grade treatments right to your doorstep.',
      keywords: ['services', 'what services', 'offer', 'menu', 'treatments', 'facial', 'waxing', 'pedicure', 'manicure', 'massage', 'service list', 'kya kya service hai'],
      display_order: 2,
      is_dynamic: 1,
      dynamic_handler: 'get_services_catalog'
    },
    {
      id: 'faq-cust-service-prices',
      audience: 'customer',
      category: 'Pricing & Packages',
      question: 'What are the service prices?',
      answer: 'Our rates are transparent with no hidden travel or kit charges.',
      keywords: ['price', 'pricing', 'cost', 'charges', 'rate', 'rate card', 'kitna kharcha', 'paise kitne', 'kitne ka hai', 'price list', 'facial price', 'waxing price'],
      display_order: 3,
      is_dynamic: 1,
      dynamic_handler: 'get_service_pricing'
    },
    {
      id: 'faq-cust-at-home-service',
      audience: 'customer',
      category: 'Hygiene & Doorstep Model',
      question: 'Do you provide at-home services?',
      answer: `Yes! BeautyDoor is 100% an at-home salon service. You never have to step outside or face traffic:
• Our background-verified female beauty professionals arrive at your doorstep equipped with complete salon setups.
• We bring single-use disposable bedsheets, headbands, wax strips, single-use wooden spatulas (no double-dipping), and sanitized tools.
• Air-conditioned room required for optimal waxing consistency.
• Post-service, our specialist cleans and sanitizes your area completely, leaving your home spotless.`,
      keywords: ['at home', 'home service', 'doorstep', 'ghar pe', 'ghar par', 'do you come home', 'visit home', 'salon at home', 'ghar me service', 'ghar pe aate ho'],
      display_order: 4,
      is_dynamic: 0,
      dynamic_handler: null
    },
    {
      id: 'faq-cust-serviceable-areas',
      audience: 'customer',
      category: 'Service Areas',
      question: 'Is my area serviceable?',
      answer: 'We serve major residential sectors and localities across Delhi NCR.',
      keywords: ['area', 'location', 'serviceable', 'delhi', 'noida', 'gurugram', 'gurgaon', 'ghaziabad', 'faridabad', 'greater noida', 'pincode', 'where do you provide', 'kahan service dete ho'],
      display_order: 5,
      is_dynamic: 1,
      dynamic_handler: 'get_service_areas'
    },
    {
      id: 'faq-cust-payment-methods',
      audience: 'customer',
      category: 'Payments & Billing',
      question: 'What payment methods are available?',
      answer: 'We offer flexible, customer-friendly payment options.',
      keywords: ['payment', 'pay', 'cod', 'cash', 'cash on delivery', 'online payment', 'upi', 'gpay', 'phonepe', 'card', 'paise kaise de', 'cod available'],
      display_order: 6,
      is_dynamic: 1,
      dynamic_handler: 'get_payment_methods'
    },
    {
      id: 'faq-cust-cancel-booking',
      audience: 'customer',
      category: 'Cancellations & Refunds',
      question: 'How can I cancel my booking?',
      answer: 'We provide free cancellations with a hassle-free refund policy.',
      keywords: ['cancel', 'cancellation', 'cancel booking', 'cancel order', 'booking cancel', 'cancel kaise kare', 'refund', 'booking hatana'],
      display_order: 7,
      is_dynamic: 1,
      dynamic_handler: 'get_cancellation_policy'
    },
    {
      id: 'faq-cust-reschedule-booking',
      audience: 'customer',
      category: 'Booking & Appointments',
      question: 'How can I reschedule my booking?',
      answer: `Need to modify your appointment timing? Rescheduling is completely free:
1. Log into your account at beautydoor.in and navigate to "My Bookings".
2. Click "Reschedule Appointment" next to your active booking.
3. Pick your newly preferred date and time slot.
4. Or message our Concierge Helpline on WhatsApp at least 2 hours before your scheduled arrival time.`,
      keywords: ['reschedule', 'change time', 'change date', 'postpone', 'prepone', 'slot change', 'timing change', 'time badalna'],
      display_order: 8,
      is_dynamic: 0,
      dynamic_handler: null
    },
    {
      id: 'faq-cust-track-booking',
      audience: 'customer',
      category: 'Booking & Appointments',
      question: 'How can I track my booking?',
      answer: `You receive end-to-end transparent visibility of your appointment:
1. Real-time Status: Check your booking status (Confirmed, Specialist Assigned, En Route, In Service) in "My Bookings".
2. Specialist Profile: View your verified specialist's name, photograph, hygiene certification badge, and rating.
3. Live SMS & WhatsApp alerts: You'll receive instant updates when the professional departs and reaches your doorstep.`,
      keywords: ['track', 'tracking', 'status', 'booking status', 'where is beautician', 'kaise track kare', 'kab aayegi', 'specialist kahan hai'],
      display_order: 9,
      is_dynamic: 0,
      dynamic_handler: null
    },
    {
      id: 'faq-cust-current-offers',
      audience: 'customer',
      category: 'Pricing & Packages',
      question: 'What offers are currently available?',
      answer: 'BeautyDoor runs attractive seasonal campaigns and packages.',
      keywords: ['offers', 'offer', 'discount', 'coupons', 'coupon', 'promo', 'deal', 'deals', 'kya offer hai', 'discount code', 'best deals'],
      display_order: 10,
      is_dynamic: 1,
      dynamic_handler: 'get_active_offers'
    },
    {
      id: 'faq-cust-contact-support',
      audience: 'customer',
      category: 'Support & Assistance',
      question: 'How can I contact customer support?',
      answer: 'Our dedicated customer support concierge is ready to help you.',
      keywords: ['support', 'contact', 'help', 'customer care', 'phone number', 'whatsapp', 'call', 'baat karni hai', 'number', 'email', 'helpline'],
      display_order: 11,
      is_dynamic: 1,
      dynamic_handler: 'get_support_contact'
    },
    {
      id: 'faq-cust-other-questions',
      audience: 'customer',
      category: 'Support & Assistance',
      question: 'Other questions',
      answer: `Have a specific beauty question, custom bridal package requirement, or special request?
• You can type your question right here in the chatbox (e.g., "facial price", "service in Noida", "refund policy", "waxing options").
• Our intelligent rule-based knowledge engine will instantly assist you.
• Or tap the "Contact Support" button below to chat directly with our concierge desk on WhatsApp.`,
      keywords: ['other', 'more', 'help', 'question', 'kuch aur', 'aur sawaal'],
      display_order: 12,
      is_dynamic: 0,
      dynamic_handler: null
    }
  ];

  const adminFaqs = [
    {
      id: 'faq-admin-add-service',
      audience: 'admin',
      category: 'Catalog Management',
      question: 'How to add a service?',
      answer: `To add a new beauty treatment or ritual:
1. In the Admin Dashboard, click on "Services Catalog".
2. Click the "+ Add New Service" button.
3. Fill in the service name, select category (e.g. RICA, Honey, Korean, Brazilian Peel-Off).
4. Enter duration in minutes, selling price, before/aftercare instructions, and room conditions.
5. Toggle "Active & Published" and click "Create Service". The service is live immediately on the storefront.`,
      keywords: ['add service', 'new service', 'create service', 'service add'],
      display_order: 1,
      is_dynamic: 0,
      dynamic_handler: null
    },
    {
      id: 'faq-admin-update-pricing',
      audience: 'admin',
      category: 'Catalog Management',
      question: 'How to update service pricing?',
      answer: `To adjust pricing:
1. Go to "Services Catalog" or "Packages".
2. Locate the service or package and click "Edit".
3. Update the "Selling Price". All price changes are automatically recorded in the Price Audit Log.
4. Click "Save Changes". The new price reflects immediately across the storefront and booking engine.`,
      keywords: ['update pricing', 'change price', 'price update', 'service price', 'pricing'],
      display_order: 2,
      is_dynamic: 0,
      dynamic_handler: null
    },
    {
      id: 'faq-admin-create-promotion',
      audience: 'admin',
      category: 'Marketing & Campaigns',
      question: 'How to create a promotion?',
      answer: 'Go to Campaigns tab, click New Campaign, specify discount type, dates, target categories, and publish.',
      keywords: ['create promotion', 'new campaign', 'banner promotion'],
      display_order: 3,
      is_dynamic: 0,
      dynamic_handler: null
    },
    {
      id: 'faq-admin-create-coupon',
      audience: 'admin',
      category: 'Marketing & Campaigns',
      question: 'How to create a coupon?',
      answer: 'Navigate to Coupons tab, click Create Coupon Code, define discount value and minimum order amount, and save.',
      keywords: ['create coupon', 'new coupon', 'add coupon', 'promo code'],
      display_order: 4,
      is_dynamic: 0,
      dynamic_handler: null
    },
    {
      id: 'faq-admin-manage-bookings',
      audience: 'admin',
      category: 'Operations & Dispatch',
      question: 'How to manage bookings?',
      answer: 'Go to Bookings & Dispatch tab to view, assign beauticians, reschedule, mark completed, or update notes.',
      keywords: ['manage bookings', 'view bookings', 'booking status', 'orders'],
      display_order: 5,
      is_dynamic: 0,
      dynamic_handler: null
    },
    {
      id: 'faq-admin-assign-professionals',
      audience: 'admin',
      category: 'Operations & Dispatch',
      question: 'How to assign professionals?',
      answer: 'In Dispatch Board, select unassigned booking, pick verified specialist matching territory and specialty, and confirm.',
      keywords: ['assign professionals', 'assign beautician', 'specialist assignment'],
      display_order: 6,
      is_dynamic: 0,
      dynamic_handler: null
    },
    {
      id: 'faq-admin-manage-service-areas',
      audience: 'admin',
      category: 'Territory Management',
      question: 'How to manage service areas?',
      answer: 'Navigate to Pincodes & Hubs tab to view or toggle active status of Delhi NCR zones and minimum order values.',
      keywords: ['manage service areas', 'territories', 'add pincode', 'service area'],
      display_order: 7,
      is_dynamic: 0,
      dynamic_handler: null
    },
    {
      id: 'faq-admin-update-banners',
      audience: 'admin',
      category: 'Content & Merchandising',
      question: 'How to update homepage banners?',
      answer: 'Go to Settings & Policies or Campaigns to update announcement bar text or promotional banners.',
      keywords: ['update banners', 'homepage banner', 'announcement bar'],
      display_order: 8,
      is_dynamic: 0,
      dynamic_handler: null
    },
    {
      id: 'faq-admin-check-payments',
      audience: 'admin',
      category: 'Finance & Payments',
      question: 'How to check payment records?',
      answer: 'Open Bookings to filter by payment status (COD collected vs pending, online payment verified).',
      keywords: ['check payments', 'payment records', 'revenue', 'cash collection'],
      display_order: 9,
      is_dynamic: 0,
      dynamic_handler: null
    },
    {
      id: 'faq-admin-manage-customers',
      audience: 'admin',
      category: 'Customer CRM',
      question: 'How to manage customer accounts?',
      answer: 'Navigate to Customers tab to view customer profiles, lifetime bookings, spend totals, and address history.',
      keywords: ['manage customers', 'customer accounts', 'crm', 'user profiles'],
      display_order: 10,
      is_dynamic: 0,
      dynamic_handler: null
    }
  ];

  for (const f of customerFaqs) {
    await db.execute(`
      INSERT INTO faqs (
        id, audience, category, question, answer, keywords_json,
        display_order, is_active, is_dynamic, dynamic_handler, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `, [
      f.id, f.audience, f.category, f.question, f.answer,
      JSON.stringify(f.keywords), f.display_order, f.is_dynamic, f.dynamic_handler,
      now, now
    ]);
  }

  for (const f of adminFaqs) {
    await db.execute(`
      INSERT INTO faqs (
        id, audience, category, question, answer, keywords_json,
        display_order, is_active, is_dynamic, dynamic_handler, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `, [
      f.id, f.audience, f.category, f.question, f.answer,
      JSON.stringify(f.keywords), f.display_order, f.is_dynamic, f.dynamic_handler,
      now, now
    ]);
  }
}
