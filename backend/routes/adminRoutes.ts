import { Router, Request, Response } from 'express';
import { db } from '../db/database.ts';
import { requireAdminAuth, recordAuditLog } from '../middleware/auth.ts';

export const adminRouter = Router();

// Apply requireAdminAuth to all administrative endpoints
adminRouter.use(requireAdminAuth);

// 1. Executive Dashboard KPIs
adminRouter.get('/overview', async (req: Request, res: Response): Promise<void> => {
  const totalBookings = ((await db.queryRow('SELECT COUNT(*) as count FROM bookings', [])) as any).count;
  const today = new Date().toISOString().split('T')[0];
  const todayBookings = ((await db.queryRow('SELECT COUNT(*) as count FROM bookings WHERE appointment_date = ?', [today])) as any).count;

  const revenueRow = (await db.queryRow(`
    SELECT 
      SUM(CASE WHEN booking_status != 'cancelled' THEN total_payable ELSE 0 END) as total_revenue,
      SUM(CASE WHEN payment_status IN ('collected', 'verified') THEN total_payable ELSE 0 END) as collected_revenue
    FROM bookings
  `, [])) as any;

  const statusCountsRaw = (await db.query(`
    SELECT booking_status, COUNT(*) as count 
    FROM bookings 
    GROUP BY booking_status
  `, [])) as { booking_status: string; count: number }[];

  const statusCounts: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    assigned: 0,
    in_service: 0,
    completed: 0,
    cancelled: 0
  };
  statusCountsRaw.forEach(r => { statusCounts[r.booking_status] = r.count; });

  const activeServices = ((await db.queryRow('SELECT COUNT(*) as count FROM services WHERE is_active = 1', [])) as any).count;
  const activeSpecialists = ((await db.queryRow("SELECT COUNT(*) as count FROM beauticians WHERE is_active = 1 AND status = 'available'", [])) as any).count;
  const activeTerritories = ((await db.queryRow('SELECT COUNT(*) as count FROM territories WHERE is_active = 1', [])) as any).count;
  const now = new Date().toISOString();
  const activeCampaigns = ((await db.queryRow(`
    SELECT COUNT(*) as count FROM campaigns 
    WHERE is_published = 1 AND (start_time <= ? AND end_time >= ?)
  `, [now, now])) as any).count;

  res.json({
    totalBookings,
    todayBookings,
    totalRevenue: revenueRow.total_revenue || 0,
    collectedRevenue: revenueRow.collected_revenue || 0,
    statusCounts,
    activeServices,
    activeSpecialists,
    activeTerritories,
    activeCampaigns
  });
});

// 2. Bookings Management & Dispatch Board
adminRouter.get('/bookings', async (_req: Request, res: Response): Promise<void> => {
  const bookings = (await db.query('SELECT * FROM bookings ORDER BY created_at DESC', [])) as any[];
  const populated = await Promise.all(bookings.map(async (b) => {
    const items = (await db.query('SELECT * FROM booking_items WHERE booking_id = ?', [b.id])) as any[];
    const beautician = b.assigned_beautician_id 
      ? (await db.queryRow('SELECT id, name, phone, rating FROM beauticians WHERE id = ?', [b.assigned_beautician_id]))
      : null;
    return {
      ...b,
      beautician,
      items: items.map((i) => ({
        ...i,
        addonIds: JSON.parse(i.addon_ids_json || '[]'),
        addonNames: JSON.parse(i.addon_names_json || '[]')
      }))
    };
  }));
  res.json({ bookings: populated });
});

adminRouter.patch('/bookings/:id/assign', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { beauticianId, notes } = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  const booking = (await db.queryRow('SELECT * FROM bookings WHERE id = ?', [id])) as any;
  if (!booking) {
    res.status(404).json({ error: 'Booking not found.' });
    return;
  }

  // Conflict validation: verify beautician is not already assigned to an overlapping slot on the same date
  if (beauticianId) {
    const conflict = (await db.queryRow(`
      SELECT id FROM bookings 
      WHERE assigned_beautician_id = ? 
        AND appointment_date = ? 
        AND appointment_slot = ? 
        AND id != ? 
        AND booking_status NOT IN ('cancelled', 'completed')
    `, [beauticianId, booking.appointment_date, booking.appointment_slot, id]));

    if (conflict) {
      res.status(400).json({ error: 'Conflict detected: Selected beautician is already committed to another appointment during this exact slot.' });
      return;
    }
  }

  const newStatus = beauticianId ? 'assigned' : 'confirmed';
  const updatedNotes = notes 
    ? `${booking.internal_notes || ''} | Dispatch [${adminUser}]: ${notes}`
    : booking.internal_notes;

  (await db.execute(`
    UPDATE bookings 
    SET assigned_beautician_id = ?, 
        booking_status = ?, 
        internal_notes = ? 
    WHERE id = ?
  `, [beauticianId || null, newStatus, updatedNotes, id]));

  recordAuditLog(adminUser, 'DISPATCH_ASSIGN', 'BOOKING', id, { beauticianId, newStatus }, req.ip);

  res.json({ success: true, message: `Beautician successfully assigned. Booking is now ${newStatus}.` });
});

adminRouter.patch('/bookings/:id/status', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { bookingStatus, paymentStatus, notes } = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  (await db.execute(`
    UPDATE bookings 
    SET booking_status = COALESCE(?, booking_status),
        payment_status = COALESCE(?, payment_status),
        internal_notes = CASE WHEN ? IS NOT NULL THEN internal_notes || ' | ' || ? ELSE internal_notes END
    WHERE id = ?
  `, [bookingStatus || null, paymentStatus || null, notes || null, notes || null, id]));

  recordAuditLog(adminUser, 'UPDATE_BOOKING_STATUS', 'BOOKING', id, { bookingStatus, paymentStatus }, req.ip);
  res.json({ success: true });
});

// 3. Services Catalog & Dynamic Pricing CRUD
adminRouter.get('/services', async (_req: Request, res: Response): Promise<void> => {
  const rawServices = (await db.query('SELECT * FROM services ORDER BY created_at DESC', [])) as any[];
  const allVariants = (await db.query('SELECT * FROM service_variants', [])) as any[];
  const allAddons = (await db.query('SELECT * FROM service_addons', [])) as any[];

  const variantsByServiceId: Record<string, any[]> = {};
  for (const v of allVariants) {
    if (!variantsByServiceId[v.service_id]) variantsByServiceId[v.service_id] = [];
    variantsByServiceId[v.service_id].push(v);
  }

  const addonsByServiceId: Record<string, any[]> = {};
  for (const a of allAddons) {
    if (!addonsByServiceId[a.service_id]) addonsByServiceId[a.service_id] = [];
    addonsByServiceId[a.service_id].push(a);
  }

  const services = rawServices.map((s) => ({
    ...s,
    benefits: JSON.parse(s.benefits_json || '[]'),
    whatsIncluded: JSON.parse(s.whats_included_json || '[]'),
    treatmentSteps: JSON.parse(s.steps_json || '[]'),
    stepsCount: s.steps_count || 0,
    brand: s.brand || '',
    variants: variantsByServiceId[s.id] || [],
    addons: addonsByServiceId[s.id] || []
  }));
  res.json({ services });
});

adminRouter.post('/services', async (req: Request, res: Response): Promise<void> => {
  const s = req.body;
  const adminUser = req.adminUser?.username || 'admin';
  const serviceId = s.id || `srv-${Date.now()}`;
  const slug = (s.slug || s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) + `-${Math.floor(Math.random() * 1000)}`;
  const cleanSteps = Array.isArray(s.treatmentSteps) 
    ? s.treatmentSteps.map((st: any) => typeof st === 'string' ? st.trim() : '').filter(Boolean)
    : [];

  const now = new Date().toISOString();
  // begin transaction block
    (await db.execute(`
      INSERT INTO services (
        id, category_id, name, slug, description, benefits_json, duration_mins,
        original_price, selling_price, discount_percent, whats_included_json,
        steps_json, steps_count, brand,
        is_active, is_popular, is_bestseller, is_featured_deal, deal_badge, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [serviceId,
      s.categoryId || 'cat-facials',
      s.name,
      slug,
      s.description || '',
      JSON.stringify(s.benefits || []),
      Number(s.durationMins) || 60,
      Number(s.originalPrice) || 1000,
      Number(s.sellingPrice) || 1000,
      Number(s.discountPercent) || 0,
      JSON.stringify(s.whatsIncluded || []),
      JSON.stringify(cleanSteps),
      cleanSteps.length,
      s.brand || null,
      s.isActive ? 1 : 0,
      s.isPopular ? 1 : 0,
      s.isBestseller ? 1 : 0,
      s.isFeaturedDeal ? 1 : 0,
      s.dealBadge || null,
      now,
      now]));

    if (Array.isArray(s.variants)) {
      for (let idx = 0; idx < s.variants.length; idx++) {
        const v = s.variants[idx];
        await db.execute(
          'INSERT INTO service_variants (id, service_id, name, price_delta, duration_delta, is_default) VALUES (?, ?, ?, ?, ?, ?)',
          [`var-${serviceId}-${idx + 1}`, serviceId, v.name, Number(v.priceDelta) || 0, Number(v.durationDelta) || 0, v.isDefault ? 1 : 0]
        );
      }
    }

    if (Array.isArray(s.addons)) {
      for (let idx = 0; idx < s.addons.length; idx++) {
        const a = s.addons[idx];
        await db.execute(
          'INSERT INTO service_addons (id, service_id, name, price, duration_mins) VALUES (?, ?, ?, ?, ?)',
          [`add-${serviceId}-${idx + 1}`, serviceId, a.name, Number(a.price) || 0, Number(a.durationMins) || 10]
        );
      }
    }
  // end transaction block

  recordAuditLog(adminUser, 'CREATE_SERVICE', 'CATALOG', serviceId, { name: s.name, price: s.sellingPrice }, req.ip);
  res.status(201).json({ success: true, serviceId });
});

adminRouter.put('/services/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const s = req.body;
  const adminUser = req.adminUser?.username || 'admin';
  const cleanSteps = Array.isArray(s.treatmentSteps)
    ? s.treatmentSteps.map((st: any) => typeof st === 'string' ? st.trim() : '').filter(Boolean)
    : null;

  // begin transaction block
    const current = (await db.queryRow('SELECT selling_price, name FROM services WHERE id = ?', [id])) as any;
    if (current && Number(s.sellingPrice) !== current.selling_price) {
      (await db.execute(`
        INSERT INTO price_audit_logs (id, item_type, item_id, item_name, old_price, new_price, changed_by, timestamp)
        VALUES (?, 'service', ?, ?, ?, ?, ?, ?)
      `, [`log-${Date.now()}`, id, current.name, current.selling_price, Number(s.sellingPrice), adminUser, new Date().toISOString()]));
    }

    (await db.execute(`
      UPDATE services 
      SET name = ?, description = ?, detailed_description = ?, duration_mins = ?,
          original_price = ?, selling_price = ?, discount_percent = ?,
          category_id = ?, is_active = ?, is_published = ?, pending_notes = ?,
          is_popular = ?, is_bestseller = ?,
          is_featured_deal = ?, deal_badge = ?, benefits_json = ?, whats_included_json = ?,
          steps_json = CASE WHEN ? IS NOT NULL THEN ? ELSE steps_json END,
          steps_count = CASE WHEN ? IS NOT NULL THEN ? ELSE steps_count END,
          brand = COALESCE(?, brand),
          before_instructions = ?, after_instructions = ?, room_conditions = ?,
          equipment_requirements = ?, hygiene_precautions = ?, updated_at = ?
      WHERE id = ?
    `, [s.name,
      s.description,
      s.detailedDescription || s.description,
      Number(s.durationMins),
      s.originalPrice ? Number(s.originalPrice) : null,
      Number(s.sellingPrice),
      Number(s.discountPercent || 0),
      s.categoryId,
      s.isActive ? 1 : 0,
      s.isPublished !== false ? 1 : 0,
      s.pendingNotes || null,
      s.isPopular ? 1 : 0,
      s.isBestseller ? 1 : 0,
      s.isFeaturedDeal ? 1 : 0,
      s.dealBadge || null,
      JSON.stringify(s.benefits || []),
      JSON.stringify(s.whatsIncluded || []),
      cleanSteps !== null ? 'update' : null,
      cleanSteps !== null ? JSON.stringify(cleanSteps) : '[]',
      cleanSteps !== null ? cleanSteps.length : null,
      cleanSteps !== null ? cleanSteps.length : 0,
      s.brand || null,
      s.beforeInstructions || null,
      s.afterInstructions || null,
      s.roomConditions || null,
      s.equipmentRequirements || null,
      s.hygienePrecautions || null,
      new Date().toISOString(),
      id]));
  // end transaction block

  recordAuditLog(adminUser, 'UPDATE_SERVICE', 'CATALOG', id, { price: s.sellingPrice, active: s.isActive }, req.ip);
  res.json({ success: true });
});

// Dedicated Treatment Steps Management Endpoint
adminRouter.put('/services/:id/steps', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { treatmentSteps } = req.body;
  if (!Array.isArray(treatmentSteps)) {
    res.status(400).json({ error: 'treatmentSteps must be an array of strings' });
    return;
  }
  const cleanSteps = treatmentSteps.map((st: any) => typeof st === 'string' ? st.trim() : '').filter(Boolean);
  const adminUser = req.adminUser?.username || 'admin';
  await db.execute(
    'UPDATE services SET steps_json = ?, steps_count = CASE WHEN ? > 0 THEN ? ELSE steps_count END, updated_at = ? WHERE id = ?',
    [JSON.stringify(cleanSteps), cleanSteps.length, cleanSteps.length, new Date().toISOString(), id]
  );
  recordAuditLog(adminUser, 'UPDATE_SERVICE_STEPS', 'CATALOG', id, { stepsCount: cleanSteps.length }, req.ip);
  res.json({ success: true, stepsCount: cleanSteps.length, treatmentSteps: cleanSteps });
});

adminRouter.delete('/services/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const adminUser = req.adminUser?.username || 'admin';

  (await db.execute('DELETE FROM services WHERE id = ?', [id]));
  recordAuditLog(adminUser, 'DELETE_SERVICE', 'CATALOG', id, {}, req.ip);
  res.json({ success: true });
});

// 3b. Packages CRUD & Price Auditing are defined in Section 13 below with full audit logging and schema parity.

// 3c. Hygiene Commitments CRUD
adminRouter.get('/hygiene', async (_req: Request, res: Response): Promise<void> => {
  const commitments = (await db.query('SELECT * FROM hygiene_commitments ORDER BY display_order ASC', []));
  res.json({ commitments });
});

adminRouter.post('/hygiene', async (req: Request, res: Response): Promise<void> => {
  const h = req.body;
  const hygId = h.id || `hyg-${Date.now()}`;
  const now = new Date().toISOString();

  (await db.execute(`
    INSERT INTO hygiene_commitments (id, title, description, icon_name, display_order, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [hygId, h.title, h.description, h.iconName || 'ShieldCheck', Number(h.displayOrder) || 0, h.isActive !== false ? 1 : 0, now]));

  res.status(201).json({ success: true, id: hygId });
});

adminRouter.put('/hygiene/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const h = req.body;

  (await db.execute(`
    UPDATE hygiene_commitments SET
      title = ?, description = ?, icon_name = ?, display_order = ?, is_active = ?
    WHERE id = ?
  `, [h.title, h.description, h.iconName || 'ShieldCheck', Number(h.displayOrder) || 0, h.isActive ? 1 : 0, id]));

  res.json({ success: true });
});

adminRouter.delete('/hygiene/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  (await db.execute('DELETE FROM hygiene_commitments WHERE id = ?', [id]));
  res.json({ success: true });
});

// 3d. Price Change Audit Logs
adminRouter.get('/price-audits', async (_req: Request, res: Response): Promise<void> => {
  const logs = (await db.query('SELECT * FROM price_audit_logs ORDER BY timestamp DESC LIMIT 100', []));
  res.json({ logs });
});

// 3e. Pending / Incomplete Services (Missing Data View)
adminRouter.get('/pending-services', async (_req: Request, res: Response): Promise<void> => {
  const pendingServices = (await db.query(`
    SELECT * FROM services 
    WHERE is_published = 0 OR is_active = 0 OR selling_price = 0 OR pending_notes IS NOT NULL
    ORDER BY category_id ASC
  `, []));
  res.json({ pendingServices });
});

// 4. Amazon-Style Promotional Campaigns CRUD
adminRouter.get('/campaigns', async (_req: Request, res: Response): Promise<void> => {
  const rawCampaigns = (await db.query('SELECT * FROM campaigns ORDER BY display_order ASC', [])) as any[];
  const campaigns = rawCampaigns.map((c) => ({
    ...c,
    targetCategoryIds: JSON.parse(c.target_category_ids_json || '[]'),
    targetServiceIds: JSON.parse(c.target_service_ids_json || '[]')
  }));
  res.json({ campaigns });
});

adminRouter.post('/campaigns', async (req: Request, res: Response): Promise<void> => {
  const c = req.body;
  const adminUser = req.adminUser?.username || 'admin';
  const campId = c.id || `camp-${Date.now()}`;
  const slug = c.slug || c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  (await db.execute(`
    INSERT INTO campaigns (
      id, title, slug, banner_title, banner_subtitle, banner_image_url,
      cta_label, destination_url, start_time, end_time, is_flash_deal, is_published,
      discount_type, discount_val, badge_text, target_category_ids_json, target_service_ids_json,
      display_order, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [campId,
    c.title,
    slug,
    c.banner_title || c.title,
    c.banner_subtitle || '',
    c.banner_image_url || '/assets/aistudio/WhatsApp_Image_2026-11-02_at_3.15.17_PM_49e36dff.jpeg',
    c.cta_label || 'Shop Now',
    c.destination_url || '/offers',
    c.start_time || new Date().toISOString(),
    c.end_time || new Date(Date.now() + 7 * 86400000).toISOString(),
    c.is_flash_deal ? 1 : 0,
    c.is_published ? 1 : 0,
    c.discount_type || 'percentage',
    Number(c.discount_val) || 0,
    c.badge_text || null,
    JSON.stringify(c.targetCategoryIds || []),
    JSON.stringify(c.targetServiceIds || []),
    Number(c.display_order) || 0,
    new Date().toISOString()]));

  recordAuditLog(adminUser, 'CREATE_CAMPAIGN', 'CAMPAIGN', campId, { title: c.title }, req.ip);
  res.status(201).json({ success: true, campaignId: campId });
});

adminRouter.patch('/campaigns/:id/publish', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { isPublished } = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  (await db.execute('UPDATE campaigns SET is_published = ? WHERE id = ?', [isPublished ? 1 : 0, id]));
  recordAuditLog(adminUser, 'TOGGLE_CAMPAIGN', 'CAMPAIGN', id, { isPublished }, req.ip);
  res.json({ success: true });
});

// 5. Beauticians Roster CRUD
adminRouter.get('/beauticians', async (_req: Request, res: Response): Promise<void> => {
  const raw = (await db.query('SELECT * FROM beauticians ORDER BY name ASC', [])) as any[];
  const beauticians = raw.map((b) => ({
    ...b,
    specialties: JSON.parse(b.specialties_json || '[]'),
    territories: JSON.parse(b.territories_json || '[]')
  }));
  res.json({ beauticians });
});

adminRouter.post('/beauticians', async (req: Request, res: Response): Promise<void> => {
  const b = req.body;
  const adminUser = req.adminUser?.username || 'admin';
  const id = b.id || `beau-${Date.now()}`;

  (await db.execute(`
    INSERT INTO beauticians (id, name, phone, specialties_json, territories_json, experience_years, is_active, status, rating, total_jobs, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, 'available', 5.0, 0, ?)
  `, [id,
    b.name,
    b.phone,
    JSON.stringify(b.specialties || ['facial', 'waxing']),
    JSON.stringify(b.territories || ['Delhi', 'Gurugram']),
    Number(b.experienceYears) || 3,
    new Date().toISOString()]));

  recordAuditLog(adminUser, 'ONBOARD_BEAUTICIAN', 'STAFF', id, { name: b.name }, req.ip);
  res.status(201).json({ success: true, beauticianId: id });
});

adminRouter.patch('/beauticians/:id/status', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, isActive } = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  (await db.execute(`
    UPDATE beauticians 
    SET status = COALESCE(?, status),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `, [status || null, isActive !== undefined ? (isActive ? 1 : 0) : null, id]));

  recordAuditLog(adminUser, 'UPDATE_BEAUTICIAN_STATUS', 'STAFF', id, { status, isActive }, req.ip);
  res.json({ success: true });
});

// 6. Delhi NCR Territories & Pincodes
adminRouter.get('/territories', async (_req: Request, res: Response): Promise<void> => {
  const territories = (await db.query('SELECT * FROM territories ORDER BY city, area_name', []));
  res.json({ territories });
});

adminRouter.patch('/territories/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { isActive, deliveryFee, minOrderAmount } = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  (await db.execute(`
    UPDATE territories 
    SET is_active = COALESCE(?, is_active),
        delivery_fee = COALESCE(?, delivery_fee),
        min_order_amount = COALESCE(?, min_order_amount)
    WHERE id = ?
  `, [isActive !== undefined ? (isActive ? 1 : 0) : null,
    deliveryFee !== undefined ? Number(deliveryFee) : null,
    minOrderAmount !== undefined ? Number(minOrderAmount) : null,
    id]));

  recordAuditLog(adminUser, 'UPDATE_TERRITORY', 'LOCATION', id, { isActive, deliveryFee }, req.ip);
  res.json({ success: true });
});

// 7. Coupons CRUD
adminRouter.get('/coupons', async (_req: Request, res: Response): Promise<void> => {
  const coupons = (await db.query('SELECT * FROM coupons ORDER BY expires_at DESC', []));
  res.json({ coupons });
});

adminRouter.post('/coupons', async (req: Request, res: Response): Promise<void> => {
  const c = req.body;
  const adminUser = req.adminUser?.username || 'admin';
  const id = `cp-${Date.now()}`;

  (await db.execute(`
    INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_discount, expires_at, is_active, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `, [id,
    c.code.toUpperCase(),
    c.discountType,
    Number(c.discountValue),
    Number(c.minOrderAmount) || 0,
    Number(c.maxDiscount) || 9999,
    c.expiresAt || '2028-12-31',
    c.description]));

  recordAuditLog(adminUser, 'CREATE_COUPON', 'MARKETING', id, { code: c.code }, req.ip);
  res.status(201).json({ success: true, couponId: id });
});

adminRouter.patch('/coupons/:id/toggle', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { isActive } = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  (await db.execute('UPDATE coupons SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]));
  recordAuditLog(adminUser, 'TOGGLE_COUPON', 'MARKETING', id, { isActive }, req.ip);
  res.json({ success: true });
});

// 8. Reviews Moderation (Approve genuine reviews, reject spam)
adminRouter.get('/reviews', async (_req: Request, res: Response): Promise<void> => {
  const reviews = (await db.query('SELECT * FROM reviews ORDER BY created_at DESC', []));
  res.json({ reviews });
});

adminRouter.patch('/reviews/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { isApproved, isFeatured } = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  (await db.execute(`
    UPDATE reviews 
    SET is_approved = COALESCE(?, is_approved),
        is_featured = COALESCE(?, is_featured)
    WHERE id = ?
  `, [isApproved !== undefined ? (isApproved ? 1 : 0) : null, isFeatured !== undefined ? (isFeatured ? 1 : 0) : null, id]));

  recordAuditLog(adminUser, 'MODERATE_REVIEW', 'FEEDBACK', id, { isApproved, isFeatured }, req.ip);
  res.json({ success: true });
});

// 9. Audit Logs
adminRouter.get('/audit-logs', async (_req: Request, res: Response): Promise<void> => {
  const logs = (await db.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100', []));
  res.json({ logs });
});

// 10. Settings & Content Management
adminRouter.get('/settings', async (_req: Request, res: Response): Promise<void> => {
  const raw = (await db.query('SELECT * FROM settings', [])) as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  raw.forEach(r => { settings[r.key] = r.value; });
  res.json({ settings });
});

adminRouter.patch('/settings', async (req: Request, res: Response): Promise<void> => {
  const updates = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  const upsertQuery = db.isPostgres
    ? 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value'
    : 'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)';

  for (const [k, v] of Object.entries(updates)) {
    await db.execute(upsertQuery, [k, String(v)]);
  }

  await recordAuditLog(adminUser, 'UPDATE_SETTINGS', 'CONFIG', 'SYSTEM', updates, req.ip);
  res.json({ success: true });
});

// 11. Categories Management CRUD
adminRouter.get('/categories', async (_req: Request, res: Response): Promise<void> => {
  const categories = (await db.query('SELECT * FROM categories ORDER BY display_order ASC', []));
  res.json({ categories });
});

adminRouter.post('/categories', async (req: Request, res: Response): Promise<void> => {
  const { name, slug, description, displayOrder } = req.body;
  const adminUser = req.adminUser?.username || 'admin';
  const id = req.body.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const catSlug = slug || id;

  (await db.execute(`
    INSERT INTO categories (id, name, slug, description, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `, [id, name, catSlug, description || '', Number(displayOrder) || 0]));

  recordAuditLog(adminUser, 'CREATE_CATEGORY', 'CATALOG', id, { name }, req.ip);
  res.status(201).json({ success: true, categoryId: id });
});

adminRouter.put('/categories/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, slug, description, displayOrder, isActive } = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  (await db.execute(`
    UPDATE categories 
    SET name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        description = COALESCE(?, description),
        display_order = COALESCE(?, display_order),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `, [name || null,
    slug || null,
    description !== undefined ? description : null,
    displayOrder !== undefined ? Number(displayOrder) : null,
    isActive !== undefined ? (isActive ? 1 : 0) : null,
    id]));

  recordAuditLog(adminUser, 'UPDATE_CATEGORY', 'CATALOG', id, { name, isActive }, req.ip);
  res.json({ success: true });
});

adminRouter.delete('/categories/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const adminUser = req.adminUser?.username || 'admin';

  (await db.execute('DELETE FROM categories WHERE id = ?', [id]));
  recordAuditLog(adminUser, 'DELETE_CATEGORY', 'CATALOG', id, {}, req.ip);
  res.json({ success: true });
});

// 12. Customer Directory & Booking History
adminRouter.get('/customers', async (_req: Request, res: Response): Promise<void> => {
  const customers = (await db.query(`
    SELECT 
      customer_id as id,
      customer_name as name,
      customer_phone as phone,
      customer_email as email,
      COUNT(id) as total_bookings,
      SUM(total_payable) as total_spend,
      MAX(created_at) as last_booking_at,
      city,
      pincode
    FROM bookings
    GROUP BY customer_id, customer_name, customer_phone, customer_email, city, pincode
    ORDER BY last_booking_at DESC
  `, []));
  res.json({ customers });
});

// 13. Package Management CRUD
adminRouter.get('/packages', async (_req: Request, res: Response): Promise<void> => {
  const rawPackages = (await db.query('SELECT * FROM packages ORDER BY display_order ASC', [])) as any[];
  const packages = rawPackages.map((p) => ({
    ...p,
    inclusions: JSON.parse(p.inclusions_json || '[]'),
    benefits: JSON.parse(p.benefits_json || '[]'),
    category_ids: JSON.parse(p.category_ids_json || '[]')
  }));
  res.json({ packages });
});

adminRouter.post('/packages', async (req: Request, res: Response): Promise<void> => {
  const p = req.body;
  const adminUser = req.adminUser?.username || 'admin';
  const id = p.id || `pkg-${Date.now()}`;
  const slug = p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  (await db.execute(`
    INSERT INTO packages (
      id, name, slug, subtitle, description, original_price, selling_price,
      discount_percent, duration_mins, duration_display, inclusions_json,
      benefits_json, category_ids_json, is_published, badge, display_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [id,
    p.name,
    slug,
    p.subtitle || null,
    p.description || '',
    p.original_price ? Number(p.original_price) : null,
    Number(p.selling_price),
    Number(p.discount_percent || 0),
    Number(p.duration_mins || 60),
    p.duration_display || `${p.duration_mins} mins`,
    JSON.stringify(p.inclusions || []),
    JSON.stringify(p.benefits || []),
    JSON.stringify(p.category_ids || []),
    p.is_published !== false ? 1 : 0,
    p.badge || null,
    Number(p.display_order || 0),
    new Date().toISOString(),
    new Date().toISOString()]));

  (await db.execute(`
    INSERT INTO price_audit_logs (id, item_type, item_id, item_name, old_price, new_price, changed_by, timestamp)
    VALUES (?, 'package', ?, ?, null, ?, ?, ?)
  `, [`log-${Date.now()}`, id, p.name, Number(p.selling_price), adminUser, new Date().toISOString()]));

  recordAuditLog(adminUser, 'CREATE_PACKAGE', 'CATALOG', id, { name: p.name, price: p.selling_price }, req.ip);
  res.status(201).json({ success: true, packageId: id });
});

adminRouter.put('/packages/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const p = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  // begin transaction block
    const current = (await db.queryRow('SELECT selling_price, name FROM packages WHERE id = ?', [id])) as any;
    if (current && Number(p.selling_price) !== current.selling_price) {
      (await db.execute(`
        INSERT INTO price_audit_logs (id, item_type, item_id, item_name, old_price, new_price, changed_by, timestamp)
        VALUES (?, 'package', ?, ?, ?, ?, ?, ?)
      `, [`log-${Date.now()}`, id, current.name, current.selling_price, Number(p.selling_price), adminUser, new Date().toISOString()]));
    }

    (await db.execute(`
      UPDATE packages 
      SET name = ?, slug = ?, subtitle = ?, description = ?, original_price = ?,
          selling_price = ?, discount_percent = ?, duration_mins = ?, duration_display = ?,
          inclusions_json = ?, benefits_json = ?,
          category_ids_json = CASE WHEN ? IS NOT NULL THEN ? ELSE category_ids_json END,
          is_published = ?, badge = ?,
          display_order = ?, updated_at = ?
      WHERE id = ?
    `, [p.name,
      p.slug,
      p.subtitle || null,
      p.description || '',
      p.original_price ? Number(p.original_price) : null,
      Number(p.selling_price),
      Number(p.discount_percent || 0),
      Number(p.duration_mins || 60),
      p.duration_display || `${p.duration_mins} mins`,
      JSON.stringify(p.inclusions || []),
      JSON.stringify(p.benefits || []),
      p.category_ids ? JSON.stringify(p.category_ids) : null,
      p.category_ids ? JSON.stringify(p.category_ids) : null,
      p.is_published !== undefined ? (p.is_published ? 1 : 0) : 1,
      p.badge || null,
      Number(p.display_order || 0),
      new Date().toISOString(),
      id]));
  // end transaction block

  recordAuditLog(adminUser, 'UPDATE_PACKAGE', 'CATALOG', id, { name: p.name, price: p.selling_price }, req.ip);
  res.json({ success: true });
});

adminRouter.delete('/packages/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const adminUser = req.adminUser?.username || 'admin';

  (await db.execute('DELETE FROM packages WHERE id = ?', [id]));
  recordAuditLog(adminUser, 'DELETE_PACKAGE', 'CATALOG', id, {}, req.ip);
  res.json({ success: true });
});

// 14. Hygiene Commitments CRUD
adminRouter.get('/hygiene', async (_req: Request, res: Response): Promise<void> => {
  const commitments = (await db.query('SELECT * FROM hygiene_commitments ORDER BY display_order ASC', []));
  res.json({ commitments });
});

adminRouter.post('/hygiene', async (req: Request, res: Response): Promise<void> => {
  const h = req.body;
  const adminUser = req.adminUser?.username || 'admin';
  const id = h.id || `hyg-${Date.now()}`;

  (await db.execute(`
    INSERT INTO hygiene_commitments (id, title, description, icon_name, is_single_use, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [id,
    h.title,
    h.description,
    h.icon_name || 'ShieldCheck',
    h.is_single_use !== false ? 1 : 0,
    Number(h.display_order || 0),
    h.is_active !== false ? 1 : 0]));

  recordAuditLog(adminUser, 'CREATE_HYGIENE_COMMITMENT', 'CONTENT', id, { title: h.title }, req.ip);
  res.status(201).json({ success: true, commitmentId: id });
});

adminRouter.put('/hygiene/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const h = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  (await db.execute(`
    UPDATE hygiene_commitments
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        icon_name = COALESCE(?, icon_name),
        is_single_use = COALESCE(?, is_single_use),
        display_order = COALESCE(?, display_order),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `, [h.title || null,
    h.description || null,
    h.icon_name || null,
    h.is_single_use !== undefined ? (h.is_single_use ? 1 : 0) : null,
    h.display_order !== undefined ? Number(h.display_order) : null,
    h.is_active !== undefined ? (h.is_active ? 1 : 0) : null,
    id]));

  recordAuditLog(adminUser, 'UPDATE_HYGIENE_COMMITMENT', 'CONTENT', id, { title: h.title }, req.ip);
  res.json({ success: true });
});

adminRouter.delete('/hygiene/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const adminUser = req.adminUser?.username || 'admin';

  (await db.execute('DELETE FROM hygiene_commitments WHERE id = ?', [id]));
  recordAuditLog(adminUser, 'DELETE_HYGIENE_COMMITMENT', 'CONTENT', id, {}, req.ip);
  res.json({ success: true });
});

// 15. Price Change Audit Trail
adminRouter.get('/price-audits', async (_req: Request, res: Response): Promise<void> => {
  const audits = (await db.query('SELECT * FROM price_audit_logs ORDER BY timestamp DESC LIMIT 200', []));
  res.json({ audits });
});

// 16. Missing Data / Pending Owner Confirmation
adminRouter.get('/pending-services', async (_req: Request, res: Response): Promise<void> => {
  const pending = (await db.query(`
    SELECT * FROM services 
    WHERE is_published = 0 OR pending_notes IS NOT NULL OR selling_price IS NULL OR selling_price = 0
    ORDER BY created_at DESC
  `, []));
  res.json({ pending });
});

