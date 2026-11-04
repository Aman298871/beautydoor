import { Router, Request, Response } from 'express';
import { db } from '../db/database.ts';
import { requireAdminAuth, recordAuditLog } from '../middleware/auth.ts';

export const adminRouter = Router();

// Apply requireAdminAuth to all administrative endpoints
adminRouter.use(requireAdminAuth);

// 1. Executive Dashboard KPIs
adminRouter.get('/overview', (req: Request, res: Response): void => {
  const totalBookings = (db.prepare('SELECT COUNT(*) as count FROM bookings').get() as any).count;
  const today = new Date().toISOString().split('T')[0];
  const todayBookings = (db.prepare('SELECT COUNT(*) as count FROM bookings WHERE appointment_date = ?').get(today) as any).count;

  const revenueRow = db.prepare(`
    SELECT 
      SUM(CASE WHEN booking_status != 'cancelled' THEN total_payable ELSE 0 END) as total_revenue,
      SUM(CASE WHEN payment_status IN ('collected', 'verified') THEN total_payable ELSE 0 END) as collected_revenue
    FROM bookings
  `).get() as any;

  const statusCountsRaw = db.prepare(`
    SELECT booking_status, COUNT(*) as count 
    FROM bookings 
    GROUP BY booking_status
  `).all() as { booking_status: string; count: number }[];

  const statusCounts: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    assigned: 0,
    in_service: 0,
    completed: 0,
    cancelled: 0
  };
  statusCountsRaw.forEach(r => { statusCounts[r.booking_status] = r.count; });

  const activeServices = (db.prepare('SELECT COUNT(*) as count FROM services WHERE is_active = 1').get() as any).count;
  const activeSpecialists = (db.prepare("SELECT COUNT(*) as count FROM beauticians WHERE is_active = 1 AND status = 'available'").get() as any).count;
  const activeTerritories = (db.prepare('SELECT COUNT(*) as count FROM territories WHERE is_active = 1').get() as any).count;
  const activeCampaigns = (db.prepare(`
    SELECT COUNT(*) as count FROM campaigns 
    WHERE is_published = 1 AND datetime('now') BETWEEN datetime(start_time) AND datetime(end_time)
  `).get() as any).count;

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
adminRouter.get('/bookings', (_req: Request, res: Response): void => {
  const bookings = db.prepare('SELECT * FROM bookings ORDER BY created_at DESC').all() as any[];
  const populated = bookings.map((b) => {
    const items = db.prepare('SELECT * FROM booking_items WHERE booking_id = ?').all(b.id) as any[];
    const beautician = b.assigned_beautician_id 
      ? db.prepare('SELECT id, name, phone, rating FROM beauticians WHERE id = ?').get(b.assigned_beautician_id)
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
  });
  res.json({ bookings: populated });
});

adminRouter.patch('/bookings/:id/assign', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { beauticianId, notes } = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as any;
  if (!booking) {
    res.status(404).json({ error: 'Booking not found.' });
    return;
  }

  // Conflict validation: verify beautician is not already assigned to an overlapping slot on the same date
  if (beauticianId) {
    const conflict = db.prepare(`
      SELECT id FROM bookings 
      WHERE assigned_beautician_id = ? 
        AND appointment_date = ? 
        AND appointment_slot = ? 
        AND id != ? 
        AND booking_status NOT IN ('cancelled', 'completed')
    `).get(beauticianId, booking.appointment_date, booking.appointment_slot, id);

    if (conflict) {
      res.status(400).json({ error: 'Conflict detected: Selected beautician is already committed to another appointment during this exact slot.' });
      return;
    }
  }

  const newStatus = beauticianId ? 'assigned' : 'confirmed';
  const updatedNotes = notes 
    ? `${booking.internal_notes || ''} | Dispatch [${adminUser}]: ${notes}`
    : booking.internal_notes;

  db.prepare(`
    UPDATE bookings 
    SET assigned_beautician_id = ?, 
        booking_status = ?, 
        internal_notes = ? 
    WHERE id = ?
  `).run(beauticianId || null, newStatus, updatedNotes, id);

  recordAuditLog(adminUser, 'DISPATCH_ASSIGN', 'BOOKING', id, { beauticianId, newStatus }, req.ip);

  res.json({ success: true, message: `Beautician successfully assigned. Booking is now ${newStatus}.` });
});

adminRouter.patch('/bookings/:id/status', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { bookingStatus, paymentStatus, notes } = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  db.prepare(`
    UPDATE bookings 
    SET booking_status = COALESCE(?, booking_status),
        payment_status = COALESCE(?, payment_status),
        internal_notes = CASE WHEN ? IS NOT NULL THEN internal_notes || ' | ' || ? ELSE internal_notes END
    WHERE id = ?
  `).run(bookingStatus || null, paymentStatus || null, notes || null, notes || null, id);

  recordAuditLog(adminUser, 'UPDATE_BOOKING_STATUS', 'BOOKING', id, { bookingStatus, paymentStatus }, req.ip);
  res.json({ success: true });
});

// 3. Services Catalog & Dynamic Pricing CRUD
adminRouter.get('/services', (_req: Request, res: Response): void => {
  const rawServices = db.prepare('SELECT * FROM services ORDER BY created_at DESC').all() as any[];
  const services = rawServices.map((s) => ({
    ...s,
    benefits: JSON.parse(s.benefits_json || '[]'),
    whatsIncluded: JSON.parse(s.whats_included_json || '[]'),
    variants: db.prepare('SELECT * FROM service_variants WHERE service_id = ?').all(s.id),
    addons: db.prepare('SELECT * FROM service_addons WHERE service_id = ?').all(s.id)
  }));
  res.json({ services });
});

adminRouter.post('/services', (req: Request, res: Response): void => {
  const s = req.body;
  const adminUser = req.adminUser?.username || 'admin';
  const serviceId = s.id || `srv-${Date.now()}`;
  const slug = (s.slug || s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) + `-${Math.floor(Math.random() * 1000)}`;

  db.transaction(() => {
    db.prepare(`
      INSERT INTO services (
        id, category_id, name, slug, description, benefits_json, duration_mins,
        original_price, selling_price, discount_percent, whats_included_json,
        is_active, is_popular, is_bestseller, is_featured_deal, deal_badge, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      serviceId,
      s.categoryId || 'facial',
      s.name,
      slug,
      s.description || '',
      JSON.stringify(s.benefits || []),
      Number(s.durationMins) || 60,
      Number(s.originalPrice) || 1000,
      Number(s.sellingPrice) || 1000,
      Number(s.discountPercent) || 0,
      JSON.stringify(s.whatsIncluded || []),
      s.isActive ? 1 : 0,
      s.isPopular ? 1 : 0,
      s.isBestseller ? 1 : 0,
      s.isFeaturedDeal ? 1 : 0,
      s.dealBadge || null,
      new Date().toISOString()
    );

    if (Array.isArray(s.variants)) {
      const insertVar = db.prepare('INSERT INTO service_variants (id, service_id, name, price_delta, duration_delta, is_default) VALUES (?, ?, ?, ?, ?, ?)');
      s.variants.forEach((v: any, idx: number) => {
        insertVar.run(`var-${serviceId}-${idx + 1}`, serviceId, v.name, Number(v.priceDelta) || 0, Number(v.durationDelta) || 0, v.isDefault ? 1 : 0);
      });
    }

    if (Array.isArray(s.addons)) {
      const insertAdd = db.prepare('INSERT INTO service_addons (id, service_id, name, price, duration_mins) VALUES (?, ?, ?, ?, ?)');
      s.addons.forEach((a: any, idx: number) => {
        insertAdd.run(`add-${serviceId}-${idx + 1}`, serviceId, a.name, Number(a.price) || 0, Number(a.durationMins) || 10);
      });
    }
  })();

  recordAuditLog(adminUser, 'CREATE_SERVICE', 'CATALOG', serviceId, { name: s.name, price: s.sellingPrice }, req.ip);
  res.status(201).json({ success: true, serviceId });
});

adminRouter.put('/services/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const s = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  db.transaction(() => {
    const current = db.prepare('SELECT selling_price, name FROM services WHERE id = ?').get(id) as any;
    if (current && Number(s.sellingPrice) !== current.selling_price) {
      db.prepare(`
        INSERT INTO price_audit_logs (id, item_type, item_id, item_name, old_price, new_price, changed_by, timestamp)
        VALUES (?, 'service', ?, ?, ?, ?, ?, ?)
      `).run(`log-${Date.now()}`, id, current.name, current.selling_price, Number(s.sellingPrice), adminUser, new Date().toISOString());
    }

    db.prepare(`
      UPDATE services 
      SET name = ?, description = ?, detailed_description = ?, duration_mins = ?,
          original_price = ?, selling_price = ?, discount_percent = ?,
          category_id = ?, is_active = ?, is_published = ?, pending_notes = ?,
          is_popular = ?, is_bestseller = ?,
          is_featured_deal = ?, deal_badge = ?, benefits_json = ?, whats_included_json = ?,
          before_instructions = ?, after_instructions = ?, room_conditions = ?,
          equipment_requirements = ?, hygiene_precautions = ?, updated_at = ?
      WHERE id = ?
    `).run(
      s.name,
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
      s.beforeInstructions || null,
      s.afterInstructions || null,
      s.roomConditions || null,
      s.equipmentRequirements || null,
      s.hygienePrecautions || null,
      new Date().toISOString(),
      id
    );
  })();

  recordAuditLog(adminUser, 'UPDATE_SERVICE', 'CATALOG', id, { price: s.sellingPrice, active: s.isActive }, req.ip);
  res.json({ success: true });
});

adminRouter.delete('/services/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const adminUser = req.adminUser?.username || 'admin';

  db.prepare('DELETE FROM services WHERE id = ?').run(id);
  recordAuditLog(adminUser, 'DELETE_SERVICE', 'CATALOG', id, {}, req.ip);
  res.json({ success: true });
});

// 3b. Packages CRUD & Price Auditing
adminRouter.get('/packages', (_req: Request, res: Response): void => {
  const rawPackages = db.prepare('SELECT * FROM packages ORDER BY display_order ASC').all() as any[];
  const packages = rawPackages.map((p) => ({
    ...p,
    inclusions: JSON.parse(p.inclusions_json || '[]'),
    benefits: JSON.parse(p.benefits_json || '[]')
  }));
  res.json({ packages });
});

adminRouter.post('/packages', (req: Request, res: Response): void => {
  const p = req.body;
  const adminUser = req.adminUser?.username || 'admin';
  const pkgId = p.id || `pkg-${Date.now()}`;
  const slug = p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO packages (
      id, name, slug, description, duration_mins, duration_label,
      original_price, selling_price, inclusions_json, benefits_json,
      image_url, is_published, is_featured, display_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    pkgId, p.name, slug, p.description, Number(p.durationMins) || 60, p.durationLabel || `${p.durationMins || 60} mins`,
    p.originalPrice ? Number(p.originalPrice) : null, Number(p.sellingPrice),
    JSON.stringify(p.inclusions || []), JSON.stringify(p.benefits || []),
    p.imageUrl || '/assets/aistudio/WhatsApp_Image_2026-11-02_at_3.15.17_PM_49e36dff.jpeg',
    p.isPublished !== false ? 1 : 0, p.isFeatured !== false ? 1 : 0,
    Number(p.displayOrder) || 0, now, now
  );

  db.prepare(`
    INSERT INTO price_audit_logs (id, item_type, item_id, item_name, old_price, new_price, changed_by, timestamp)
    VALUES (?, 'package', ?, ?, NULL, ?, ?, ?)
  `).run(`log-${Date.now()}`, pkgId, p.name, Number(p.sellingPrice), adminUser, now);

  res.status(201).json({ success: true, packageId: pkgId });
});

adminRouter.put('/packages/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const p = req.body;
  const adminUser = req.adminUser?.username || 'admin';
  const now = new Date().toISOString();

  const current = db.prepare('SELECT selling_price, name FROM packages WHERE id = ?').get(id) as any;
  if (current && Number(p.sellingPrice) !== current.selling_price) {
    db.prepare(`
      INSERT INTO price_audit_logs (id, item_type, item_id, item_name, old_price, new_price, changed_by, timestamp)
      VALUES (?, 'package', ?, ?, ?, ?, ?, ?)
    `).run(`log-${Date.now()}`, id, current.name, current.selling_price, Number(p.sellingPrice), adminUser, now);
  }

  db.prepare(`
    UPDATE packages SET
      name = ?, description = ?, duration_mins = ?, duration_label = ?,
      original_price = ?, selling_price = ?, inclusions_json = ?, benefits_json = ?,
      image_url = ?, is_published = ?, is_featured = ?, display_order = ?, updated_at = ?
    WHERE id = ?
  `).run(
    p.name, p.description, Number(p.durationMins), p.durationLabel,
    p.originalPrice ? Number(p.originalPrice) : null, Number(p.sellingPrice),
    JSON.stringify(p.inclusions || []), JSON.stringify(p.benefits || []),
    p.imageUrl, p.isPublished ? 1 : 0, p.isFeatured ? 1 : 0,
    Number(p.displayOrder), now, id
  );

  res.json({ success: true });
});

adminRouter.delete('/packages/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  db.prepare('DELETE FROM packages WHERE id = ?').run(id);
  res.json({ success: true });
});

// 3c. Hygiene Commitments CRUD
adminRouter.get('/hygiene', (_req: Request, res: Response): void => {
  const commitments = db.prepare('SELECT * FROM hygiene_commitments ORDER BY display_order ASC').all();
  res.json({ commitments });
});

adminRouter.post('/hygiene', (req: Request, res: Response): void => {
  const h = req.body;
  const hygId = h.id || `hyg-${Date.now()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO hygiene_commitments (id, title, description, icon_name, display_order, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(hygId, h.title, h.description, h.iconName || 'ShieldCheck', Number(h.displayOrder) || 0, h.isActive !== false ? 1 : 0, now);

  res.status(201).json({ success: true, id: hygId });
});

adminRouter.put('/hygiene/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const h = req.body;

  db.prepare(`
    UPDATE hygiene_commitments SET
      title = ?, description = ?, icon_name = ?, display_order = ?, is_active = ?
    WHERE id = ?
  `).run(h.title, h.description, h.iconName || 'ShieldCheck', Number(h.displayOrder) || 0, h.isActive ? 1 : 0, id);

  res.json({ success: true });
});

adminRouter.delete('/hygiene/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  db.prepare('DELETE FROM hygiene_commitments WHERE id = ?').run(id);
  res.json({ success: true });
});

// 3d. Price Change Audit Logs
adminRouter.get('/price-audits', (_req: Request, res: Response): void => {
  const logs = db.prepare('SELECT * FROM price_audit_logs ORDER BY timestamp DESC LIMIT 100').all();
  res.json({ logs });
});

// 3e. Pending / Incomplete Services (Missing Data View)
adminRouter.get('/pending-services', (_req: Request, res: Response): void => {
  const pendingServices = db.prepare(`
    SELECT * FROM services 
    WHERE is_published = 0 OR is_active = 0 OR selling_price = 0 OR pending_notes IS NOT NULL
    ORDER BY category_id ASC
  `).all();
  res.json({ pendingServices });
});

// 4. Amazon-Style Promotional Campaigns CRUD
adminRouter.get('/campaigns', (_req: Request, res: Response): void => {
  const rawCampaigns = db.prepare('SELECT * FROM campaigns ORDER BY display_order ASC').all() as any[];
  const campaigns = rawCampaigns.map((c) => ({
    ...c,
    targetCategoryIds: JSON.parse(c.target_category_ids_json || '[]'),
    targetServiceIds: JSON.parse(c.target_service_ids_json || '[]')
  }));
  res.json({ campaigns });
});

adminRouter.post('/campaigns', (req: Request, res: Response): void => {
  const c = req.body;
  const adminUser = req.adminUser?.username || 'admin';
  const campId = c.id || `camp-${Date.now()}`;
  const slug = c.slug || c.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  db.prepare(`
    INSERT INTO campaigns (
      id, title, slug, banner_title, banner_subtitle, banner_image_url,
      cta_label, destination_url, start_time, end_time, is_flash_deal, is_published,
      discount_type, discount_val, badge_text, target_category_ids_json, target_service_ids_json,
      display_order, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    campId,
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
    new Date().toISOString()
  );

  recordAuditLog(adminUser, 'CREATE_CAMPAIGN', 'CAMPAIGN', campId, { title: c.title }, req.ip);
  res.status(201).json({ success: true, campaignId: campId });
});

adminRouter.patch('/campaigns/:id/publish', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { isPublished } = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  db.prepare('UPDATE campaigns SET is_published = ? WHERE id = ?').run(isPublished ? 1 : 0, id);
  recordAuditLog(adminUser, 'TOGGLE_CAMPAIGN', 'CAMPAIGN', id, { isPublished }, req.ip);
  res.json({ success: true });
});

// 5. Beauticians Roster CRUD
adminRouter.get('/beauticians', (_req: Request, res: Response): void => {
  const raw = db.prepare('SELECT * FROM beauticians ORDER BY name ASC').all() as any[];
  const beauticians = raw.map((b) => ({
    ...b,
    specialties: JSON.parse(b.specialties_json || '[]'),
    territories: JSON.parse(b.territories_json || '[]')
  }));
  res.json({ beauticians });
});

adminRouter.post('/beauticians', (req: Request, res: Response): void => {
  const b = req.body;
  const adminUser = req.adminUser?.username || 'admin';
  const id = b.id || `beau-${Date.now()}`;

  db.prepare(`
    INSERT INTO beauticians (id, name, phone, specialties_json, territories_json, experience_years, is_active, status, rating, total_jobs, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, 'available', 5.0, 0, ?)
  `).run(
    id,
    b.name,
    b.phone,
    JSON.stringify(b.specialties || ['facial', 'waxing']),
    JSON.stringify(b.territories || ['Delhi', 'Gurugram']),
    Number(b.experienceYears) || 3,
    new Date().toISOString()
  );

  recordAuditLog(adminUser, 'ONBOARD_BEAUTICIAN', 'STAFF', id, { name: b.name }, req.ip);
  res.status(201).json({ success: true, beauticianId: id });
});

adminRouter.patch('/beauticians/:id/status', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { status, isActive } = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  db.prepare(`
    UPDATE beauticians 
    SET status = COALESCE(?, status),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(status || null, isActive !== undefined ? (isActive ? 1 : 0) : null, id);

  recordAuditLog(adminUser, 'UPDATE_BEAUTICIAN_STATUS', 'STAFF', id, { status, isActive }, req.ip);
  res.json({ success: true });
});

// 6. Delhi NCR Territories & Pincodes
adminRouter.get('/territories', (_req: Request, res: Response): void => {
  const territories = db.prepare('SELECT * FROM territories ORDER BY city, area_name').all();
  res.json({ territories });
});

adminRouter.patch('/territories/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { isActive, deliveryFee, minOrderAmount } = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  db.prepare(`
    UPDATE territories 
    SET is_active = COALESCE(?, is_active),
        delivery_fee = COALESCE(?, delivery_fee),
        min_order_amount = COALESCE(?, min_order_amount)
    WHERE id = ?
  `).run(
    isActive !== undefined ? (isActive ? 1 : 0) : null,
    deliveryFee !== undefined ? Number(deliveryFee) : null,
    minOrderAmount !== undefined ? Number(minOrderAmount) : null,
    id
  );

  recordAuditLog(adminUser, 'UPDATE_TERRITORY', 'LOCATION', id, { isActive, deliveryFee }, req.ip);
  res.json({ success: true });
});

// 7. Coupons CRUD
adminRouter.get('/coupons', (_req: Request, res: Response): void => {
  const coupons = db.prepare('SELECT * FROM coupons ORDER BY expires_at DESC').all();
  res.json({ coupons });
});

adminRouter.post('/coupons', (req: Request, res: Response): void => {
  const c = req.body;
  const adminUser = req.adminUser?.username || 'admin';
  const id = `cp-${Date.now()}`;

  db.prepare(`
    INSERT INTO coupons (id, code, discount_type, discount_value, min_order_amount, max_discount, expires_at, is_active, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `).run(
    id,
    c.code.toUpperCase(),
    c.discountType,
    Number(c.discountValue),
    Number(c.minOrderAmount) || 0,
    Number(c.maxDiscount) || 9999,
    c.expiresAt || '2028-12-31',
    c.description
  );

  recordAuditLog(adminUser, 'CREATE_COUPON', 'MARKETING', id, { code: c.code }, req.ip);
  res.status(201).json({ success: true, couponId: id });
});

adminRouter.patch('/coupons/:id/toggle', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { isActive } = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  db.prepare('UPDATE coupons SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, id);
  recordAuditLog(adminUser, 'TOGGLE_COUPON', 'MARKETING', id, { isActive }, req.ip);
  res.json({ success: true });
});

// 8. Reviews Moderation (Approve genuine reviews, reject spam)
adminRouter.get('/reviews', (_req: Request, res: Response): void => {
  const reviews = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
  res.json({ reviews });
});

adminRouter.patch('/reviews/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { isApproved, isFeatured } = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  db.prepare(`
    UPDATE reviews 
    SET is_approved = COALESCE(?, is_approved),
        is_featured = COALESCE(?, is_featured)
    WHERE id = ?
  `).run(isApproved !== undefined ? (isApproved ? 1 : 0) : null, isFeatured !== undefined ? (isFeatured ? 1 : 0) : null, id);

  recordAuditLog(adminUser, 'MODERATE_REVIEW', 'FEEDBACK', id, { isApproved, isFeatured }, req.ip);
  res.json({ success: true });
});

// 9. Audit Logs
adminRouter.get('/audit-logs', (_req: Request, res: Response): void => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100').all();
  res.json({ logs });
});

// 10. Settings & Content Management
adminRouter.get('/settings', (_req: Request, res: Response): void => {
  const raw = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  raw.forEach(r => { settings[r.key] = r.value; });
  res.json({ settings });
});

adminRouter.patch('/settings', (req: Request, res: Response): void => {
  const updates = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  db.transaction(() => {
    for (const [k, v] of Object.entries(updates)) {
      upsert.run(k, String(v));
    }
  })();

  recordAuditLog(adminUser, 'UPDATE_SETTINGS', 'CONFIG', 'SYSTEM', updates, req.ip);
  res.json({ success: true });
});

// 11. Categories Management CRUD
adminRouter.get('/categories', (_req: Request, res: Response): void => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY display_order ASC').all();
  res.json({ categories });
});

adminRouter.post('/categories', (req: Request, res: Response): void => {
  const { name, slug, description, displayOrder } = req.body;
  const adminUser = req.adminUser?.username || 'admin';
  const id = req.body.id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const catSlug = slug || id;

  db.prepare(`
    INSERT INTO categories (id, name, slug, description, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `).run(id, name, catSlug, description || '', Number(displayOrder) || 0);

  recordAuditLog(adminUser, 'CREATE_CATEGORY', 'CATALOG', id, { name }, req.ip);
  res.status(201).json({ success: true, categoryId: id });
});

adminRouter.put('/categories/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { name, slug, description, displayOrder, isActive } = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  db.prepare(`
    UPDATE categories 
    SET name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        description = COALESCE(?, description),
        display_order = COALESCE(?, display_order),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(
    name || null,
    slug || null,
    description !== undefined ? description : null,
    displayOrder !== undefined ? Number(displayOrder) : null,
    isActive !== undefined ? (isActive ? 1 : 0) : null,
    id
  );

  recordAuditLog(adminUser, 'UPDATE_CATEGORY', 'CATALOG', id, { name, isActive }, req.ip);
  res.json({ success: true });
});

adminRouter.delete('/categories/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const adminUser = req.adminUser?.username || 'admin';

  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  recordAuditLog(adminUser, 'DELETE_CATEGORY', 'CATALOG', id, {}, req.ip);
  res.json({ success: true });
});

// 12. Customer Directory & Booking History
adminRouter.get('/customers', (_req: Request, res: Response): void => {
  const customers = db.prepare(`
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
    GROUP BY customer_id
    ORDER BY last_booking_at DESC
  `).all();
  res.json({ customers });
});

// 13. Package Management CRUD
adminRouter.get('/packages', (_req: Request, res: Response): void => {
  const rawPackages = db.prepare('SELECT * FROM packages ORDER BY display_order ASC').all() as any[];
  const packages = rawPackages.map((p) => ({
    ...p,
    inclusions: JSON.parse(p.inclusions_json || '[]'),
    benefits: JSON.parse(p.benefits_json || '[]')
  }));
  res.json({ packages });
});

adminRouter.post('/packages', (req: Request, res: Response): void => {
  const p = req.body;
  const adminUser = req.adminUser?.username || 'admin';
  const id = p.id || `pkg-${Date.now()}`;
  const slug = p.slug || p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  db.prepare(`
    INSERT INTO packages (
      id, name, slug, subtitle, description, original_price, selling_price,
      discount_percent, duration_mins, duration_display, inclusions_json,
      benefits_json, is_published, badge, display_order, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
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
    p.is_published !== false ? 1 : 0,
    p.badge || null,
    Number(p.display_order || 0),
    new Date().toISOString(),
    new Date().toISOString()
  );

  db.prepare(`
    INSERT INTO price_audit_logs (id, item_type, item_id, item_name, old_price, new_price, changed_by, timestamp)
    VALUES (?, 'package', ?, ?, null, ?, ?, ?)
  `).run(`log-${Date.now()}`, id, p.name, Number(p.selling_price), adminUser, new Date().toISOString());

  recordAuditLog(adminUser, 'CREATE_PACKAGE', 'CATALOG', id, { name: p.name, price: p.selling_price }, req.ip);
  res.status(201).json({ success: true, packageId: id });
});

adminRouter.put('/packages/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const p = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  db.transaction(() => {
    const current = db.prepare('SELECT selling_price, name FROM packages WHERE id = ?').get(id) as any;
    if (current && Number(p.selling_price) !== current.selling_price) {
      db.prepare(`
        INSERT INTO price_audit_logs (id, item_type, item_id, item_name, old_price, new_price, changed_by, timestamp)
        VALUES (?, 'package', ?, ?, ?, ?, ?, ?)
      `).run(`log-${Date.now()}`, id, current.name, current.selling_price, Number(p.selling_price), adminUser, new Date().toISOString());
    }

    db.prepare(`
      UPDATE packages 
      SET name = ?, slug = ?, subtitle = ?, description = ?, original_price = ?,
          selling_price = ?, discount_percent = ?, duration_mins = ?, duration_display = ?,
          inclusions_json = ?, benefits_json = ?, is_published = ?, badge = ?,
          display_order = ?, updated_at = ?
      WHERE id = ?
    `).run(
      p.name,
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
      p.is_published !== undefined ? (p.is_published ? 1 : 0) : 1,
      p.badge || null,
      Number(p.display_order || 0),
      new Date().toISOString(),
      id
    );
  })();

  recordAuditLog(adminUser, 'UPDATE_PACKAGE', 'CATALOG', id, { name: p.name, price: p.selling_price }, req.ip);
  res.json({ success: true });
});

adminRouter.delete('/packages/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const adminUser = req.adminUser?.username || 'admin';

  db.prepare('DELETE FROM packages WHERE id = ?').run(id);
  recordAuditLog(adminUser, 'DELETE_PACKAGE', 'CATALOG', id, {}, req.ip);
  res.json({ success: true });
});

// 14. Hygiene Commitments CRUD
adminRouter.get('/hygiene', (_req: Request, res: Response): void => {
  const commitments = db.prepare('SELECT * FROM hygiene_commitments ORDER BY display_order ASC').all();
  res.json({ commitments });
});

adminRouter.post('/hygiene', (req: Request, res: Response): void => {
  const h = req.body;
  const adminUser = req.adminUser?.username || 'admin';
  const id = h.id || `hyg-${Date.now()}`;

  db.prepare(`
    INSERT INTO hygiene_commitments (id, title, description, icon_name, is_single_use, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    h.title,
    h.description,
    h.icon_name || 'ShieldCheck',
    h.is_single_use !== false ? 1 : 0,
    Number(h.display_order || 0),
    h.is_active !== false ? 1 : 0
  );

  recordAuditLog(adminUser, 'CREATE_HYGIENE_COMMITMENT', 'CONTENT', id, { title: h.title }, req.ip);
  res.status(201).json({ success: true, commitmentId: id });
});

adminRouter.put('/hygiene/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const h = req.body;
  const adminUser = req.adminUser?.username || 'admin';

  db.prepare(`
    UPDATE hygiene_commitments
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        icon_name = COALESCE(?, icon_name),
        is_single_use = COALESCE(?, is_single_use),
        display_order = COALESCE(?, display_order),
        is_active = COALESCE(?, is_active)
    WHERE id = ?
  `).run(
    h.title || null,
    h.description || null,
    h.icon_name || null,
    h.is_single_use !== undefined ? (h.is_single_use ? 1 : 0) : null,
    h.display_order !== undefined ? Number(h.display_order) : null,
    h.is_active !== undefined ? (h.is_active ? 1 : 0) : null,
    id
  );

  recordAuditLog(adminUser, 'UPDATE_HYGIENE_COMMITMENT', 'CONTENT', id, { title: h.title }, req.ip);
  res.json({ success: true });
});

adminRouter.delete('/hygiene/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const adminUser = req.adminUser?.username || 'admin';

  db.prepare('DELETE FROM hygiene_commitments WHERE id = ?').run(id);
  recordAuditLog(adminUser, 'DELETE_HYGIENE_COMMITMENT', 'CONTENT', id, {}, req.ip);
  res.json({ success: true });
});

// 15. Price Change Audit Trail
adminRouter.get('/price-audits', (_req: Request, res: Response): void => {
  const audits = db.prepare('SELECT * FROM price_audit_logs ORDER BY timestamp DESC LIMIT 200').all();
  res.json({ audits });
});

// 16. Missing Data / Pending Owner Confirmation
adminRouter.get('/pending-services', (_req: Request, res: Response): void => {
  const pending = db.prepare(`
    SELECT * FROM services 
    WHERE is_published = 0 OR pending_notes IS NOT NULL OR selling_price IS NULL OR selling_price = 0
    ORDER BY created_at DESC
  `).all();
  res.json({ pending });
});

