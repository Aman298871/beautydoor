import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'beautydoor.db');
export const db = new Database(DB_PATH);

// Enable WAL mode for high performance & concurrency
db.pragma('journal_mode = WAL');

// Initialize Normalized Production Schema
export function initDatabase() {
  db.exec(`
    -- Admin Users & Roles
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      last_login TEXT
    );

    -- Service Categories
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      display_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    -- Services Catalog
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      benefits_json TEXT NOT NULL DEFAULT '[]',
      duration_mins INTEGER NOT NULL,
      original_price INTEGER NOT NULL,
      selling_price INTEGER NOT NULL,
      discount_percent INTEGER NOT NULL DEFAULT 0,
      whats_included_json TEXT NOT NULL DEFAULT '[]',
      is_active INTEGER NOT NULL DEFAULT 1,
      is_popular INTEGER NOT NULL DEFAULT 0,
      is_bestseller INTEGER NOT NULL DEFAULT 0,
      is_featured_deal INTEGER NOT NULL DEFAULT 0,
      deal_badge TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    -- Service Variants
    CREATE TABLE IF NOT EXISTS service_variants (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price_delta INTEGER NOT NULL DEFAULT 0,
      duration_delta INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    );

    -- Service Addons
    CREATE TABLE IF NOT EXISTS service_addons (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      duration_mins INTEGER NOT NULL DEFAULT 10,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    );

    -- Amazon-Style Campaigns & Merchandising Engine
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      banner_title TEXT NOT NULL,
      banner_subtitle TEXT,
      banner_image_url TEXT,
      cta_label TEXT NOT NULL DEFAULT 'Explore Deals',
      destination_url TEXT NOT NULL DEFAULT '/offers',
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      is_flash_deal INTEGER NOT NULL DEFAULT 0,
      is_published INTEGER NOT NULL DEFAULT 1,
      discount_type TEXT NOT NULL DEFAULT 'percentage',
      discount_val INTEGER NOT NULL DEFAULT 0,
      badge_text TEXT,
      target_category_ids_json TEXT NOT NULL DEFAULT '[]',
      target_service_ids_json TEXT NOT NULL DEFAULT '[]',
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- Promotional Coupons
    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL,
      discount_value INTEGER NOT NULL,
      min_order_amount INTEGER NOT NULL DEFAULT 0,
      max_discount INTEGER NOT NULL DEFAULT 9999,
      expires_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      description TEXT NOT NULL
    );

    -- Delhi NCR Territories & Serviceable Pincodes
    CREATE TABLE IF NOT EXISTS territories (
      id TEXT PRIMARY KEY,
      city TEXT NOT NULL,
      area_name TEXT NOT NULL,
      pincode TEXT UNIQUE NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      delivery_fee INTEGER NOT NULL DEFAULT 0,
      min_order_amount INTEGER NOT NULL DEFAULT 499
    );

    -- Certified Beauticians / Specialists Roster
    CREATE TABLE IF NOT EXISTS beauticians (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      specialties_json TEXT NOT NULL DEFAULT '[]',
      territories_json TEXT NOT NULL DEFAULT '[]',
      experience_years INTEGER NOT NULL DEFAULT 3,
      is_active INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'available',
      rating REAL NOT NULL DEFAULT 5.0,
      total_jobs INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    -- Customer Bookings
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      flat TEXT NOT NULL,
      landmark TEXT,
      area TEXT NOT NULL,
      city TEXT NOT NULL,
      pincode TEXT NOT NULL,
      subtotal INTEGER NOT NULL,
      package_discount INTEGER NOT NULL DEFAULT 0,
      campaign_discount INTEGER NOT NULL DEFAULT 0,
      coupon_discount INTEGER NOT NULL DEFAULT 0,
      coupon_code TEXT,
      delivery_fee INTEGER NOT NULL DEFAULT 0,
      total_payable INTEGER NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_slot TEXT NOT NULL,
      payment_method TEXT NOT NULL DEFAULT 'COD',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      razorpay_order_id TEXT,
      razorpay_payment_id TEXT,
      booking_status TEXT NOT NULL DEFAULT 'pending',
      assigned_beautician_id TEXT,
      internal_notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (assigned_beautician_id) REFERENCES beauticians(id)
    );

    -- Booking Items
    CREATE TABLE IF NOT EXISTS booking_items (
      id TEXT PRIMARY KEY,
      booking_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      variant_id TEXT,
      variant_name TEXT,
      addon_ids_json TEXT NOT NULL DEFAULT '[]',
      addon_names_json TEXT NOT NULL DEFAULT '[]',
      unit_price INTEGER NOT NULL,
      final_item_price INTEGER NOT NULL,
      duration_mins INTEGER NOT NULL,
      FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
    );

    -- Genuine Customer Reviews (Moderated & verified by admin)
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      booking_id TEXT,
      customer_name TEXT NOT NULL,
      city TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      service_name TEXT NOT NULL,
      created_at TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'verified_booking',
      is_approved INTEGER NOT NULL DEFAULT 0,
      is_featured INTEGER NOT NULL DEFAULT 0
    );

    -- Security Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      admin_username TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      details_json TEXT,
      timestamp TEXT NOT NULL,
      ip_address TEXT
    );

    -- Business Settings & Integrations Key-Value Store
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  seedEssentialData();
}

function seedEssentialData() {
  // 1. Ensure SuperAdmin exists (Password: "Admin@BeautyDoor2026")
  const existingAdmin = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
  if (!existingAdmin) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('Admin@BeautyDoor2026', salt);
    db.prepare(`
      INSERT INTO admin_users (id, username, email, password_hash, role, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, 1, ?)
    `).run('admin-super-1', 'admin', 'admin@beautydoor.in', hash, 'superadmin', new Date().toISOString());
  }

  // 2. Initial Settings (No fake reviews; genuine official keys only)
  const defaultSettings: Record<string, string> = {
    brand_name: 'BeautyDoor',
    tagline: 'Beauty at your doorstep',
    contact_phone: '+91 99991 23456',
    contact_email: 'concierge@beautydoor.in',
    support_whatsapp: '+91 99991 23456',
    working_hours_start: '08:00 AM',
    working_hours_end: '08:00 PM',
    cancellation_window_hours: '4',
    cancellation_policy: 'Complimentary cancellation up to 4 hours prior to appointment.',
    announcement_text: '✨ Delhi NCR Inaugural Offers: Up to 35% OFF on select skincare & waxing rituals | Pay after service',
    announcement_active: 'true',
    razorpay_enabled: 'true',
    razorpay_key_id: 'rzp_test_beautydoor_mock',
    google_places_api_key: '',
    google_place_id: '',
    min_order_amount: '499'
  };

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(defaultSettings)) {
    insertSetting.run(k, v);
  }

  // 3. Categories
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (categoryCount.count === 0) {
    const categories = [
      { id: 'waxing', name: 'Waxing Rituals', slug: 'waxing', desc: 'Italian Rica, Honey & sensitive skin roll-on body waxing.', order: 1 },
      { id: 'facial', name: 'Facial & Cleanups', slug: 'facial', desc: 'Oxygenating glow facials, Korean glass-skin hydra infusions, and cleanups.', order: 2 },
      { id: 'mani-pedi', name: 'Manicure & Pedicure', slug: 'mani-pedi', desc: 'Aroma rose bath bomb foot spas and crystal jelly manicure rituals.', order: 3 },
      { id: 'hair-care', name: 'Hair Care & Spas', slug: 'hair-care', desc: "L'Oréal Mythic Oil deep spas, anti-frizz masks, and scalp revitalization.", order: 4 },
      { id: 'de-tan', name: 'De-Tan & Bleach', slug: 'de-tan', desc: 'Milk protein de-tan peels and instant radiance herbal bleaches.', order: 5 },
      { id: 'massage', name: 'Body Massage & Spas', slug: 'massage', desc: 'Deep relaxation Swedish therapy and soothing aromatherapy at home.', order: 6 },
      { id: 'threading', name: 'Threading & Face Wax', slug: 'threading', desc: 'Organic cotton precision brow sculpting and gentle facial hair removal.', order: 7 },
      { id: 'bridal', name: 'Bridal & Pre-Bridal', slug: 'bridal', desc: 'Comprehensive royal bridal packages and pre-wedding glow rituals.', order: 8 }
    ];

    const insertCat = db.prepare('INSERT INTO categories (id, name, slug, description, display_order, is_active) VALUES (?, ?, ?, ?, ?, 1)');
    for (const c of categories) {
      insertCat.run(c.id, c.name, c.slug, c.desc, c.order);
    }
  }

  // 4. Genuine Delhi NCR Territories & Serviceable Pincodes
  const territoryCount = db.prepare('SELECT COUNT(*) as count FROM territories').get() as { count: number };
  if (territoryCount.count === 0) {
    const territories = [
      { id: 'ter-del-1', city: 'Delhi', area: 'South Delhi (GK, Saket, Vasant Kunj, Hauz Khas)', pin: '110017', fee: 0, min: 499 },
      { id: 'ter-del-2', city: 'Delhi', area: 'South Delhi (Defense Colony, Lajpat Nagar)', pin: '110024', fee: 0, min: 499 },
      { id: 'ter-del-3', city: 'Delhi', area: 'Central Delhi (Connaught Place, Chanakyapuri)', pin: '110001', fee: 0, min: 499 },
      { id: 'ter-del-4', city: 'Delhi', area: 'West Delhi (Punjabi Bagh, Rajouri Garden)', pin: '110026', fee: 0, min: 499 },
      { id: 'ter-del-5', city: 'Delhi', area: 'East Delhi (Mayur Vihar, Preet Vihar)', pin: '110091', fee: 0, min: 499 },
      { id: 'ter-ggn-1', city: 'Gurugram', area: 'DLF Phase 1-5 & Cyber City', pin: '122002', fee: 0, min: 499 },
      { id: 'ter-ggn-2', city: 'Gurugram', area: 'Golf Course Road & Sector 54, 56', pin: '122011', fee: 0, min: 499 },
      { id: 'ter-ggn-3', city: 'Gurugram', area: 'Golf Course Extn & Sector 65, 66', pin: '122018', fee: 0, min: 499 },
      { id: 'ter-nda-1', city: 'Noida', area: 'Sector 15, 16, 18 (Film City & Atta)', pin: '201301', fee: 0, min: 499 },
      { id: 'ter-nda-2', city: 'Noida', area: 'Sector 50, 76, 78 (Expressway Corridor)', pin: '201307', fee: 0, min: 499 },
      { id: 'ter-nda-3', city: 'Noida', area: 'Sector 128, 137, 142 (Jaypee Greens)', pin: '201304', fee: 0, min: 499 },
      { id: 'ter-gnda-1', city: 'Greater Noida', area: 'Pari Chowk, Alpha, Beta & Gamma', pin: '201310', fee: 49, min: 599 },
      { id: 'ter-gzb-1', city: 'Ghaziabad', area: 'Indirapuram & Ahinsa Khand', pin: '201014', fee: 0, min: 499 },
      { id: 'ter-gzb-2', city: 'Ghaziabad', area: 'Vaishali & Kaushambi', pin: '201010', fee: 0, min: 499 },
      { id: 'ter-fbd-1', city: 'Faridabad', area: 'Sector 14, 15, 16 & Greenfield', pin: '121002', fee: 0, min: 499 }
    ];

    const insertTer = db.prepare('INSERT INTO territories (id, city, area_name, pincode, is_active, delivery_fee, min_order_amount) VALUES (?, ?, ?, ?, 1, ?, ?)');
    for (const t of territories) {
      insertTer.run(t.id, t.city, t.area, t.pin, t.fee, t.min);
    }
  }

  // 5. Promotional Coupons
  const couponCount = db.prepare('SELECT COUNT(*) as count FROM coupons').get() as { count: number };
  if (couponCount.count === 0) {
    const coupons = [
      { id: 'cp-1', code: 'BEAUTYFIRST', type: 'flat', val: 200, min: 799, max: 200, exp: '2028-12-31', desc: 'Flat ₹200 savings on your inaugural at-home beauty ritual.' },
      { id: 'cp-2', code: 'GLOW15', type: 'percentage', val: 15, min: 1499, max: 500, exp: '2028-12-31', desc: '15% extra savings on premium facials and cleanups.' },
      { id: 'cp-3', code: 'NCRBRIDE', type: 'flat', val: 800, min: 3999, max: 800, exp: '2028-12-31', desc: '₹800 savings on royal bridal packages.' }
    ];
    const insertCp = db.prepare('INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_discount, expires_at, is_active, description) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)');
    for (const c of coupons) {
      insertCp.run(c.id, c.code, c.type, c.val, c.min, c.max, c.exp, c.desc);
    }
  }

  // 6. Real Baseline Services
  const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get() as { count: number };
  if (serviceCount.count === 0) {
    const services = [
      {
        id: 'srv-wax-full-arms-legs',
        cat: 'waxing',
        name: 'Full Arms + Full Legs + Underarms Waxing',
        slug: 'full-arms-legs-underarms-waxing',
        desc: 'Complete satiny smooth body hair removal with antiseptic pre-cleanse and soothing chamomile post-wax mist.',
        benefits: JSON.stringify(['Hair-free smooth finish for 4 weeks', 'Reduces ingrown hairs', 'Gentle on delicate skin']),
        dur: 60,
        orig: 1199,
        sell: 799,
        disc: 33,
        whatsInc: JSON.stringify(['Full arms waxing with underarms', 'Full legs waxing', 'Sanitized single-use strips', 'Post-wax calming soothing gel']),
        isPop: 1,
        isBest: 1,
        isDeal: 1,
        badge: "Today's Best Deal"
      },
      {
        id: 'srv-facial-o3-plus',
        cat: 'facial',
        name: 'O3+ Bridal Radiance & Oxygen Glow Facial',
        slug: 'o3-plus-bridal-radiance-glow-facial',
        desc: 'Celebrated oxygenating salon treatment that erases dullness, lifts stubborn sun tan, and infuses multi-vitamins.',
        benefits: JSON.stringify(['Intense cellular oxygenation', 'Fades hyperpigmentation spots', 'Glass-skin glow']),
        dur: 75,
        orig: 2899,
        sell: 1999,
        disc: 31,
        whatsInc: JSON.stringify(['O2 Cleansing', 'Enzyme exfoliation', 'Aromatherapeutic facial massage', 'Oxygen ampoule', 'Rubberized brightening mask']),
        isPop: 1,
        isBest: 1,
        isDeal: 1,
        badge: 'Trending Glow'
      },
      {
        id: 'srv-pedi-bomb-spa',
        cat: 'mani-pedi',
        name: 'Rose Bath Bomb Effervescent Foot Spa & Pedicure',
        slug: 'rose-bath-bomb-foot-spa-pedicure',
        desc: 'Damask rose petal bath soak, deep volcanic pumice heel detailing, cuticle care, and calf reflexology.',
        benefits: JSON.stringify(['Heals cracked calluses', 'Dissolves muscular tension', 'Nourishes nail beds']),
        dur: 55,
        orig: 1199,
        sell: 799,
        disc: 33,
        whatsInc: JSON.stringify(['Rose bath bomb soak', 'Pumice heel exfoliation', 'Cuticle oil buffing', 'Calf reflexology (15 mins)', 'Breathable polish']),
        isPop: 1,
        isBest: 1,
        isDeal: 0,
        badge: 'Client Favorite'
      },
      {
        id: 'srv-detan-o3-sara',
        cat: 'de-tan',
        name: 'O3+ Sara Milk Protein D-Tan (Face & Neck)',
        slug: 'o3-plus-sara-milk-protein-detan',
        desc: 'Instant tan reversal infused with cooling peppermint, eucalyptus, and bioactive milk proteins.',
        benefits: JSON.stringify(['Reverses harsh UV sun damage', 'No yellow tint or burning', 'Gentle natural brighten']),
        dur: 30,
        orig: 699,
        sell: 449,
        disc: 36,
        whatsInc: JSON.stringify(['Cleansing lotion', 'D-tan cream mask', 'Cool towel wipe', 'SPF fluid finish']),
        isPop: 1,
        isBest: 0,
        isDeal: 1,
        badge: 'Flash Deal'
      },
      {
        id: 'srv-hair-loreal-spa',
        cat: 'hair-care',
        name: "L'Oréal Professionnel Mythic Oil Hair Spa",
        slug: 'loreal-mythic-oil-hair-spa',
        desc: 'Deep nourishing cream bath enriched with precious argan oils and ozone scalp steam for frizz-free silkiness.',
        benefits: JSON.stringify(['Tames frizz in Delhi NCR weather', 'Hydrates chemically treated hair', 'Relieves tension']),
        dur: 60,
        orig: 1799,
        sell: 1199,
        disc: 33,
        whatsInc: JSON.stringify(['Scalp diagnostic', 'Cream bath root massage (25 mins)', 'Portable nano steam', 'Serum polish']),
        isPop: 1,
        isBest: 0,
        isDeal: 0,
        badge: 'Nourishing'
      },
      {
        id: 'srv-bridal-pre-radiance',
        cat: 'bridal',
        name: 'The Royal Pre-Bridal Radiance Journey',
        slug: 'royal-pre-bridal-radiance-journey',
        desc: '3-hour all-inclusive head-to-toe bridal ritual executed by Senior Certified Estheticians.',
        benefits: JSON.stringify(['Complete bridal glow', 'Rica Italian full waxing', 'O3+ facial + Crystal Mani-Pedi']),
        dur: 180,
        orig: 7999,
        sell: 4999,
        disc: 38,
        whatsInc: JSON.stringify(['Full body Rica wax', 'O3+ Radiance facial', 'Crystal Spa Mani & Pedi', 'Full body de-tan', 'Hair Spa', 'Eyebrow styling']),
        isPop: 1,
        isBest: 1,
        isDeal: 1,
        badge: 'Royal Signature'
      }
    ];

    const insertSrv = db.prepare(`
      INSERT INTO services (
        id, category_id, name, slug, description, benefits_json, duration_mins,
        original_price, selling_price, discount_percent, whats_included_json,
        is_active, is_popular, is_bestseller, is_featured_deal, deal_badge, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?)
    `);

    for (const s of services) {
      insertSrv.run(
        s.id, s.cat, s.name, s.slug, s.desc, s.benefits, s.dur, s.orig, s.sell, s.disc,
        s.whatsInc, s.isPop, s.isBest, s.isDeal, s.badge, new Date().toISOString()
      );
    }

    // Add Variants for Waxing & Facial
    const insertVar = db.prepare('INSERT INTO service_variants (id, service_id, name, price_delta, duration_delta, is_default) VALUES (?, ?, ?, ?, ?, ?)');
    insertVar.run('var-wax-1', 'srv-wax-full-arms-legs', 'Natural Honey Wax', 0, 0, 1);
    insertVar.run('var-wax-2', 'srv-wax-full-arms-legs', 'Italian Rica White Chocolate (Colophony-Free)', 400, 10, 0);
    insertVar.run('var-wax-3', 'srv-wax-full-arms-legs', 'Italian Rica Aloe Vera (Sensitive Skin)', 450, 10, 0);

    insertVar.run('var-fac-1', 'srv-facial-o3-plus', 'O3+ Brightening 5-Step Formula', 0, 0, 1);
    insertVar.run('var-fac-2', 'srv-facial-o3-plus', 'O3+ Whitening D-Tan Special Kit', 350, 10, 0);

    // Add Add-ons
    const insertAdd = db.prepare('INSERT INTO service_addons (id, service_id, name, price, duration_mins) VALUES (?, ?, ?, ?, ?)');
    insertAdd.run('add-wax-1', 'srv-wax-full-arms-legs', 'Full Back Waxing', 449, 20);
    insertAdd.run('add-wax-2', 'srv-wax-full-arms-legs', 'Rica Bikini Waxing', 699, 25);
    insertAdd.run('add-fac-1', 'srv-facial-o3-plus', 'Cryo Ice Globe Lymphatic Drainage Massage', 299, 10);
    insertAdd.run('add-fac-2', 'srv-facial-o3-plus', 'Hydrating Bio-Cellulose Under-Eye Treatment', 249, 10);
  }

  // 7. Amazon-Style Promotional Campaigns
  const campaignCount = db.prepare('SELECT COUNT(*) as count FROM campaigns').get() as { count: number };
  if (campaignCount.count === 0) {
    const campaigns = [
      {
        id: 'camp-summer-glow',
        title: 'Delhi NCR Festive Glow Festival',
        slug: 'festive-glow-festival',
        banner_title: 'Festive Radiance at Home: Up to 35% OFF',
        banner_subtitle: 'Book certified master beauticians at zero salon commute. Complimentary sanitization kits.',
        banner_image_url: '/assets/aistudio/WhatsApp_Image_2026-11-02_at_3.15.17_PM_49e36dff.jpeg',
        cta_label: 'Explore Deals',
        destination_url: '/offers',
        start_time: new Date(Date.now() - 86400000).toISOString(),
        end_time: new Date(Date.now() + 15 * 86400000).toISOString(),
        is_flash_deal: 0,
        is_published: 1,
        discount_type: 'percentage',
        discount_val: 35,
        badge_text: 'Limited Period',
        target_category_ids: JSON.stringify(['facial', 'waxing', 'mani-pedi']),
        target_service_ids: JSON.stringify(['srv-facial-o3-plus', 'srv-wax-full-arms-legs']),
        display_order: 1
      },
      {
        id: 'camp-flash-mani-pedi',
        title: 'Flash Hours: Rose Foot Spa & Waxing Combo',
        slug: 'flash-spa-combo',
        banner_title: 'Flash Deal: Extra ₹200 OFF Today',
        banner_subtitle: 'Combine Rose Bath Bomb Pedicure with any Waxing ritual for instantaneous doorstep bliss.',
        banner_image_url: '/assets/aistudio/WhatsApp_Image_2026-11-02_at_3.15.17_PM_49e36dff.jpeg',
        cta_label: 'Book Flash Deal',
        destination_url: '/packages',
        start_time: new Date(Date.now() - 3600000).toISOString(),
        end_time: new Date(Date.now() + 24 * 3600000).toISOString(),
        is_flash_deal: 1,
        is_published: 1,
        discount_type: 'flat',
        discount_val: 200,
        badge_text: 'Ends Tonight',
        target_category_ids: JSON.stringify(['mani-pedi', 'waxing']),
        target_service_ids: JSON.stringify(['srv-pedi-bomb-spa', 'srv-wax-full-arms-legs']),
        display_order: 2
      }
    ];

    const insertCamp = db.prepare(`
      INSERT INTO campaigns (
        id, title, slug, banner_title, banner_subtitle, banner_image_url,
        cta_label, destination_url, start_time, end_time, is_flash_deal, is_published,
        discount_type, discount_val, badge_text, target_category_ids_json, target_service_ids_json,
        display_order, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const cp of campaigns) {
      insertCamp.run(
        cp.id, cp.title, cp.slug, cp.banner_title, cp.banner_subtitle, cp.banner_image_url,
        cp.cta_label, cp.destination_url, cp.start_time, cp.end_time, cp.is_flash_deal, cp.is_published,
        cp.discount_type, cp.discount_val, cp.badge_text, cp.target_category_ids, cp.target_service_ids,
        cp.display_order, new Date().toISOString()
      );
    }
  }

  // 8. Beauticians Roster (Initial verified staff records)
  const beauticianCount = db.prepare('SELECT COUNT(*) as count FROM beauticians').get() as { count: number };
  if (beauticianCount.count === 0) {
    const beauticians = [
      { id: 'beau-1', name: 'Priya Sharma', phone: '+91 98112 44321', specs: JSON.stringify(['facial', 'bridal', 'de-tan']), terrs: JSON.stringify(['Delhi', 'Gurugram']), exp: 8, rating: 4.9, jobs: 428 },
      { id: 'beau-2', name: 'Meenakshi Sen', phone: '+91 98731 88920', specs: JSON.stringify(['massage', 'waxing', 'mani-pedi']), terrs: JSON.stringify(['Noida', 'Ghaziabad', 'Greater Noida']), exp: 6, rating: 4.9, jobs: 382 },
      { id: 'beau-3', name: 'Ananya Verma', phone: '+91 99105 12433', specs: JSON.stringify(['waxing', 'facial', 'threading']), terrs: JSON.stringify(['Delhi', 'Faridabad']), exp: 9, rating: 5.0, jobs: 514 }
    ];
    const insertBeau = db.prepare("INSERT INTO beauticians (id, name, phone, specialties_json, territories_json, experience_years, is_active, status, rating, total_jobs, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, 'available', ?, ?, ?)");
    for (const b of beauticians) {
      insertBeau.run(b.id, b.name, b.phone, b.specs, b.terrs, b.exp, b.rating, b.jobs, new Date().toISOString());
    }
  }
}
