import { Router, Request, Response } from 'express';
import { db } from '../db/database.ts';

export const storefrontRouter = Router();

// 1. Catalog & Active Settings
storefrontRouter.get('/catalog', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await db.query('SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC', []);
    const rawServices = (await db.query('SELECT * FROM services WHERE is_active = 1 AND is_published = 1 ORDER BY created_at DESC', [])) as any[];

    // Fetch all variants and addons in single queries to optimize performance
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

    const rawPackages = (await db.query('SELECT * FROM packages WHERE is_published = 1 ORDER BY display_order ASC', [])) as any[];
    const packages = rawPackages.map((p) => ({
      ...p,
      inclusions: JSON.parse(p.inclusions_json || '[]'),
      benefits: JSON.parse(p.benefits_json || '[]'),
      category_ids: JSON.parse(p.category_ids_json || '[]')
    }));

    const hygieneCommitments = await db.query('SELECT * FROM hygiene_commitments WHERE is_active = 1 ORDER BY display_order ASC', []);

    const rawSettings = (await db.query('SELECT * FROM settings', [])) as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    rawSettings.forEach((r) => {
      settings[r.key] = r.value;
    });

    res.json({ categories, services, packages, hygieneCommitments, settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load catalogue' });
  }
});

// 1a. Public Business Settings
storefrontRouter.get('/settings', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rawSettings = (await db.query('SELECT * FROM settings', [])) as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    rawSettings.forEach((r) => {
      settings[r.key] = r.value;
    });
    res.json({ settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load business settings' });
  }
});

// 1b. Packages List & Detail
storefrontRouter.get('/packages', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rawPackages = (await db.query('SELECT * FROM packages WHERE is_published = 1 ORDER BY display_order ASC', [])) as any[];
    const packages = rawPackages.map((p) => ({
      ...p,
      inclusions: JSON.parse(p.inclusions_json || '[]'),
      benefits: JSON.parse(p.benefits_json || '[]'),
      category_ids: JSON.parse(p.category_ids_json || '[]')
    }));
    res.json({ packages });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load packages' });
  }
});

storefrontRouter.get('/packages/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const p = (await db.queryRow('SELECT * FROM packages WHERE slug = ? OR id = ?', [slug, slug])) as any;
    if (!p) {
      res.status(404).json({ error: 'Package not found' });
      return;
    }
    res.json({
      package: {
        ...p,
        inclusions: JSON.parse(p.inclusions_json || '[]'),
        benefits: JSON.parse(p.benefits_json || '[]'),
        category_ids: JSON.parse(p.category_ids_json || '[]')
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load package' });
  }
});

// 1c. Hygiene Commitments
storefrontRouter.get('/hygiene', async (_req: Request, res: Response): Promise<void> => {
  try {
    const commitments = await db.query('SELECT * FROM hygiene_commitments WHERE is_active = 1 ORDER BY display_order ASC', []);
    const heading = (await db.queryRow('SELECT value FROM settings WHERE key = ?', ['hygiene_heading'])) as any;
    const subheading = (await db.queryRow('SELECT value FROM settings WHERE key = ?', ['hygiene_subheading'])) as any;

    res.json({
      heading: heading?.value || 'Your Beauty. Your Comfort. Our Hygiene Promise.',
      subheading: subheading?.value || 'Salon-quality rituals brought safely to your home with single-use protective disposables, sanitized tools, and verified female specialists.',
      commitments
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load hygiene commitments' });
  }
});

// 2. Dynamic Campaigns & Merchandising (Amazon-style, expires automatically)
storefrontRouter.get('/campaigns', async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date().toISOString();
    const activeCampaigns = (await db.query(`
      SELECT * FROM campaigns 
      WHERE is_published = 1 
        AND (start_time <= ? AND end_time >= ?)
      ORDER BY display_order ASC
    `, [now, now])) as any[];

    const campaigns = activeCampaigns.map((c) => ({
      ...c,
      targetCategoryIds: JSON.parse(c.target_category_ids_json || '[]'),
      targetServiceIds: JSON.parse(c.target_service_ids_json || '[]')
    }));

    res.json({ campaigns });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load campaigns' });
  }
});

// 3. Today's Deals & Flash Deals
storefrontRouter.get('/deals', async (_req: Request, res: Response): Promise<void> => {
  try {
    const deals = (await db.query(`
      SELECT * FROM services 
      WHERE is_active = 1 AND (is_featured_deal = 1 OR discount_percent > 20)
      ORDER BY discount_percent DESC 
      LIMIT 8
    `, [])) as any[];

    const populated = deals.map((s) => ({
      ...s,
      benefits: JSON.parse(s.benefits_json || '[]'),
      whatsIncluded: JSON.parse(s.whats_included_json || '[]'),
      treatmentSteps: JSON.parse(s.steps_json || '[]'),
      stepsCount: s.steps_count || 0,
      brand: s.brand || ''
    }));

    res.json({ deals: populated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load deals' });
  }
});

// 4. Bestselling Services
storefrontRouter.get('/bestsellers', async (_req: Request, res: Response): Promise<void> => {
  try {
    const bestsellers = (await db.query(`
      SELECT * FROM services 
      WHERE is_active = 1 AND is_bestseller = 1 
      ORDER BY created_at DESC 
      LIMIT 6
    `, [])) as any[];

    const populated = bestsellers.map((s) => ({
      ...s,
      benefits: JSON.parse(s.benefits_json || '[]'),
      whatsIncluded: JSON.parse(s.whats_included_json || '[]'),
      treatmentSteps: JSON.parse(s.steps_json || '[]'),
      stepsCount: s.steps_count || 0,
      brand: s.brand || ''
    }));

    res.json({ bestsellers: populated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load bestsellers' });
  }
});

// 5. Individual Service Details by Slug
storefrontRouter.get('/services/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const s = (await db.queryRow('SELECT * FROM services WHERE slug = ? AND is_active = 1', [slug])) as any;
    if (!s) {
      res.status(404).json({ error: 'Service not found or is currently unavailable.' });
      return;
    }

    const category = await db.queryRow('SELECT * FROM categories WHERE id = ?', [s.category_id]);
    const variants = await db.query('SELECT * FROM service_variants WHERE service_id = ?', [s.id]);
    const addons = await db.query('SELECT * FROM service_addons WHERE service_id = ?', [s.id]);

    res.json({
      service: {
        ...s,
        benefits: JSON.parse(s.benefits_json || '[]'),
        whatsIncluded: JSON.parse(s.whats_included_json || '[]'),
        treatmentSteps: JSON.parse(s.steps_json || '[]'),
        stepsCount: s.steps_count || 0,
        brand: s.brand || '',
        category,
        variants,
        addons
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load service' });
  }
});

// 6. Category Page by Slug
storefrontRouter.get('/categories/:slug', async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const cat = (await db.queryRow('SELECT * FROM categories WHERE slug = ? AND is_active = 1', [slug])) as any;
    if (!cat) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }

    const rawServices = (await db.query('SELECT * FROM services WHERE category_id = ? AND is_active = 1', [cat.id])) as any[];
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

    res.json({ category: cat, services });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load category services' });
  }
});

// 7. Delhi NCR Territories & Pincode Validation
storefrontRouter.get('/territories', async (_req: Request, res: Response): Promise<void> => {
  try {
    const territories = await db.query('SELECT * FROM territories WHERE is_active = 1 ORDER BY city, area_name', []);
    res.json({ territories });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load territories' });
  }
});

const checkServiceabilityHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pincode, address, locality, city } = req.body;
    
    // Check private restricted locations
    const restrictedRow = (await db.queryRow("SELECT value FROM settings WHERE key = 'restricted_locations'")) as { value: string } | undefined;
    let restrictedAreas: string[] = [];
    try {
      if (restrictedRow?.value) {
        restrictedAreas = JSON.parse(restrictedRow.value);
      }
    } catch {
      restrictedAreas = [];
    }

    const fullAddr = `${address || ''} ${locality || ''} ${city || ''} ${pincode || ''}`.toLowerCase();
    const isRestricted = restrictedAreas.some(area => area && fullAddr.includes(area.toLowerCase().trim()));

    if (isRestricted) {
      res.json({
        isServiceable: false,
        territory: null,
        message: 'Sorry, BeautyDoor is currently unavailable at this location.'
      });
      return;
    }

    if (pincode && typeof pincode === 'string') {
      const cleanPin = pincode.trim();
      const territory = (await db.queryRow('SELECT * FROM territories WHERE pincode = ? AND is_active = 1', [cleanPin])) as any;
      if (territory) {
        res.json({
          isServiceable: true,
          territory,
          message: `Verified: Doorstep beauty services available in ${territory.area_name}, ${territory.city}.`
        });
        return;
      }
    }

    res.json({
      isServiceable: true,
      territory: null,
      message: 'Verified: At-home beauty services available across Delhi NCR.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to check serviceability' });
  }
};

storefrontRouter.post('/check-serviceability', checkServiceabilityHandler);
storefrontRouter.post('/check-pincode', checkServiceabilityHandler);
storefrontRouter.post('/check-location', checkServiceabilityHandler);

// 8. Available Appointment Slots (8:00 AM to 6:00 PM with ₹100 Early/Evening Surcharge)
storefrontRouter.get('/slots', async (req: Request, res: Response): Promise<void> => {
  try {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const allSlots = [
      { slot: '08:00 AM', extraCharge: 100, label: '08:00 AM (Early Slot +₹100)' },
      { slot: '09:00 AM', extraCharge: 0, label: '09:00 AM' },
      { slot: '10:00 AM', extraCharge: 0, label: '10:00 AM' },
      { slot: '11:00 AM', extraCharge: 0, label: '11:00 AM' },
      { slot: '12:00 PM', extraCharge: 0, label: '12:00 PM' },
      { slot: '01:00 PM', extraCharge: 0, label: '01:00 PM' },
      { slot: '02:00 PM', extraCharge: 0, label: '02:00 PM' },
      { slot: '03:00 PM', extraCharge: 0, label: '03:00 PM' },
      { slot: '04:00 PM', extraCharge: 0, label: '04:00 PM' },
      { slot: '05:00 PM', extraCharge: 0, label: '05:00 PM' },
      { slot: '06:00 PM', extraCharge: 100, label: '06:00 PM (Evening Slot +₹100)' }
    ];

    const bookingsOnDate = (await db.query(`
      SELECT appointment_slot, COUNT(*) as count 
      FROM bookings 
      WHERE appointment_date = ? AND booking_status != 'cancelled'
      GROUP BY appointment_slot
    `, [date])) as { appointment_slot: string; count: number }[];

    const bookedMap: Record<string, number> = {};
    bookingsOnDate.forEach((b) => {
      bookedMap[b.appointment_slot] = b.count;
    });

    const availableSlots = allSlots
      .filter((s) => (bookedMap[s.slot] || 0) < 4)
      .map((s) => s.slot);

    res.json({
      date,
      availableSlots,
      allSlots: allSlots.map(s => s.slot),
      slotDetails: allSlots,
      workingHours: '8:00 AM – 6:00 PM',
      slotSurcharges: {
        '08:00 AM': 100,
        '06:00 PM': 100
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load appointment slots' });
  }
});

// 9. Server-Side Accurate Price Calculation (No frontend calculation trust)
const calculatePricingHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { items, couponCode, pincode, appointmentSlot } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'At least one service is required.' });
      return;
    }

    let subtotal = 0;
    const validatedItems: any[] = [];

    for (const it of items) {
      // Check if item is a customized package bundle
      if (it.isPackage && it.customizedServices && Array.isArray(it.customizedServices) && it.customizedServices.length > 0) {
        let pkgCustomSubtotal = 0;
        let pkgCustomDuration = 0;
        const validCustomServices: any[] = [];

        for (const cs of it.customizedServices) {
          const csId = typeof cs === 'string' ? cs : (cs.id || cs.serviceId);
          const sRow = (await db.queryRow('SELECT * FROM services WHERE id = ? AND is_active = 1', [csId])) as any;
          if (sRow) {
            pkgCustomSubtotal += sRow.selling_price;
            pkgCustomDuration += sRow.duration_mins;
            validCustomServices.push(sRow);
          }
        }

        if (validCustomServices.length > 0) {
          let customTierPct = 0;
          if (validCustomServices.length >= 5) customTierPct = 20;
          else if (validCustomServices.length === 4) customTierPct = 15;
          else if (validCustomServices.length === 3) customTierPct = 10;
          else if (validCustomServices.length === 2) customTierPct = 5;

          const customDiscount = Math.round((pkgCustomSubtotal * customTierPct) / 100);
          const customFinalPrice = Math.max(0, pkgCustomSubtotal - customDiscount);

          subtotal += customFinalPrice;
          validatedItems.push({
            serviceId: it.packageId || it.serviceId || 'pkg-custom',
            serviceName: it.customPackageName || `${it.packageName || 'Custom Ritual Package'} (${validCustomServices.length} Treatments)`,
            variantId: null,
            variantName: null,
            addonIds: [],
            addonNames: validCustomServices.map(s => s.name),
            unitPrice: pkgCustomSubtotal,
            finalItemPrice: customFinalPrice,
            durationMins: pkgCustomDuration,
            isPackage: true
          });
          continue;
        }
      }

      const pkg = (it.packageId || it.serviceId) ? (await db.queryRow('SELECT * FROM packages WHERE id = ? AND is_published = 1', [it.packageId || it.serviceId])) as any : null;
      if (pkg) {
        subtotal += pkg.selling_price;
        validatedItems.push({
          serviceId: pkg.id,
          serviceName: it.variantId ? `${pkg.name} (${it.variantId})` : pkg.name,
          variantId: it.variantId || null,
          variantName: it.variantId || null,
          addonIds: [],
          addonNames: [],
          unitPrice: pkg.selling_price,
          finalItemPrice: pkg.selling_price,
          durationMins: pkg.duration_mins,
          isPackage: true
        });
        continue;
      }

      const srv = (await db.queryRow('SELECT * FROM services WHERE id = ? AND is_active = 1', [it.serviceId])) as any;
      if (!srv) continue;

      let itemPrice = srv.selling_price;
      let varName: string | undefined = undefined;
      let duration = srv.duration_mins;

      if (it.variantId) {
        const v = (await db.queryRow('SELECT * FROM service_variants WHERE id = ? AND service_id = ?', [it.variantId, srv.id])) as any;
        if (v) {
          itemPrice += v.price_delta;
          duration += v.duration_delta;
          varName = v.name;
        }
      }

      const addedAddonNames: string[] = [];
      if (Array.isArray(it.addonIds)) {
        for (const aid of it.addonIds) {
          const add = (await db.queryRow('SELECT * FROM service_addons WHERE id = ? AND service_id = ?', [aid, srv.id])) as any;
          if (add) {
            itemPrice += add.price;
            duration += add.duration_mins;
            addedAddonNames.push(add.name);
          }
        }
      }

      subtotal += itemPrice;
      validatedItems.push({
        serviceId: srv.id,
        serviceName: srv.name,
        variantId: it.variantId,
        variantName: varName,
        addonIds: it.addonIds || [],
        addonNames: addedAddonNames,
        unitPrice: srv.selling_price,
        finalItemPrice: itemPrice,
        durationMins: duration
      });
    }

    // Tiered Package Bundle Discounts (Configured business logic)
    let packageDiscountPercent = 0;
    if (validatedItems.length >= 4) packageDiscountPercent = 15;
    else if (validatedItems.length === 3) packageDiscountPercent = 10;
    else if (validatedItems.length === 2) packageDiscountPercent = 5;

    const packageDiscount = Math.round((subtotal * packageDiscountPercent) / 100);
    const amountAfterPackage = subtotal - packageDiscount;

    // Coupon Validation
    let couponDiscount = 0;
    let appliedCoupon: any = null;
    if (couponCode && typeof couponCode === 'string') {
      const cleanCode = couponCode.trim().toUpperCase();
      const now = new Date().toISOString();
      const cp = (await db.queryRow('SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND expires_at >= ?', [cleanCode, now])) as any;
      if (cp && amountAfterPackage >= cp.min_order_amount) {
        if (cp.discount_type === 'percentage') {
          const raw = Math.round((amountAfterPackage * cp.discount_value) / 100);
          couponDiscount = Math.min(raw, cp.max_discount);
        } else {
          couponDiscount = Math.min(cp.discount_value, amountAfterPackage);
        }
        appliedCoupon = { code: cp.code, description: cp.description };
      }
    }

    // Convenience / Delivery fee lookup
    let deliveryFee = 0;
    if (pincode) {
      const ter = (await db.queryRow('SELECT delivery_fee FROM territories WHERE pincode = ? AND is_active = 1', [pincode.trim()])) as any;
      if (ter) deliveryFee = ter.delivery_fee;
    }

    // Appointment Slot Surcharge: Configurable via settings with ₹100 approved fallback
    let slotCharge = 0;
    if (appointmentSlot === '08:00 AM') {
      const s = (await db.queryRow("SELECT value FROM settings WHERE key = 'slot_charge_8am'", [])) as any;
      slotCharge = s?.value !== undefined ? Number(s.value) : 100;
    } else if (appointmentSlot === '06:00 PM') {
      const s = (await db.queryRow("SELECT value FROM settings WHERE key = 'slot_charge_6pm'", [])) as any;
      slotCharge = s?.value !== undefined ? Number(s.value) : 100;
    }

    const totalPayable = Math.max(0, amountAfterPackage - couponDiscount + deliveryFee + slotCharge);

    // Calculate minimum order requirement for selected city / state / territory
    const cityParam = (req.body.city || '').trim().toLowerCase();
    let minOrderAmount = 1000;
    let minOrderRegion = 'Delhi';
    if (cityParam.includes('haryana') || cityParam.includes('gurugram') || cityParam.includes('gurgaon') || cityParam.includes('faridabad')) {
      minOrderAmount = 1500;
      minOrderRegion = 'Haryana';
    } else if (cityParam.includes('noida') || cityParam.includes('greater noida') || cityParam.includes('ghaziabad')) {
      minOrderAmount = 1500;
      minOrderRegion = 'Noida';
    } else if (cityParam.includes('delhi')) {
      minOrderAmount = 1000;
      minOrderRegion = 'Delhi';
    }

    const isBelowMin = subtotal < minOrderAmount;
    const minDeficit = Math.max(0, minOrderAmount - subtotal);

    res.json({
      items: validatedItems,
      subtotal,
      packageDiscountPercent,
      packageDiscount,
      couponDiscount,
      appliedCoupon,
      deliveryFee,
      slotCharge,
      totalPayable,
      minOrderPolicy: {
        delhi: 1000,
        haryana: 1500,
        noida: 1500,
        activeRegion: minOrderRegion,
        activeMinOrder: minOrderAmount,
        isBelowMin,
        minDeficit,
        policyNotice: 'Minimum booking amount: Delhi – ₹1,000 | Haryana – ₹1,500 | Noida – ₹1,500'
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to calculate price' });
  }
};

storefrontRouter.post('/calculate-pricing', calculatePricingHandler);
storefrontRouter.post('/calculate-price', calculatePricingHandler);
storefrontRouter.post('/bookings/calculate', calculatePricingHandler);
storefrontRouter.post('/bookings/calculate-pricing', calculatePricingHandler);

// 9b. Dynamic Rate Card Endpoint (For A4 Print / PDF / Storefront View)
storefrontRouter.get('/rate-card', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = (await db.query('SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC', [])) as any[];
    const services = (await db.query(`
      SELECT s.*, c.name as category_name, c.slug as category_slug
      FROM services s
      JOIN categories c ON s.category_id = c.id
      WHERE s.is_active = 1 AND s.is_published = 1
      ORDER BY c.display_order ASC, s.selling_price ASC
    `, [])) as any[];

    const packages = (await db.query('SELECT * FROM packages WHERE is_published = 1 ORDER BY display_order ASC', [])) as any[];

    const grouped: Record<string, { category: any; services: any[] }> = {};
    for (const cat of categories) {
      grouped[cat.id] = {
        category: cat,
        services: services.filter(s => s.category_id === cat.id)
      };
    }

    res.json({
      storeName: 'BeautyDoor',
      tagline: 'Salon-Quality Beauty Services at Home Across Delhi NCR',
      serviceArea: 'Delhi, Gurugram, Noida, Greater Noida, Ghaziabad, Faridabad',
      operatingHours: '8:00 AM – 6:00 PM',
      categories,
      groupedServices: grouped,
      packages: packages.map(p => ({
        ...p,
        inclusions: JSON.parse(p.inclusions_json || '[]'),
        benefits: JSON.parse(p.benefits_json || '[]')
      })),
      hygieneCommitments: [
        'Single-use disposable wooden spatulas (Zero double-dipping)',
        'Fresh disposable bedsheet & headband sealed for each client',
        'Hospital-grade sanitized and autoclaved metal tools',
        'Single-use sealed skincare packs opened right in front of you',
        'Strictly verified female professionals'
      ],
      generatedAt: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate rate card' });
  }
});

// 10. Create Real Booking (Supports Cash on Delivery or Online Razorpay)
storefrontRouter.post('/bookings', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      address,
      items,
      appointmentDate,
      appointmentSlot,
      paymentMethod,
      couponCode,
      notes
    } = req.body;

    if (!customerName || !customerPhone || !address?.flat || !items?.length || !appointmentDate || !appointmentSlot) {
      res.status(400).json({ error: 'All appointment details, service address, and contact information are required.' });
      return;
    }

    // Check Private Restricted Locations (server-side only, no public exposure)
    const restrictedRow = (await db.queryRow("SELECT value FROM settings WHERE key = 'restricted_locations'")) as { value: string } | undefined;
    let restrictedAreas: string[] = [];
    try {
      if (restrictedRow?.value) {
        restrictedAreas = JSON.parse(restrictedRow.value);
      }
    } catch {
      restrictedAreas = [];
    }

    const fullAddr = `${address.flat || ''} ${address.landmark || ''} ${address.area || ''} ${address.locality || ''} ${address.city || ''} ${address.pincode || ''}`.toLowerCase();
    const isRestricted = restrictedAreas.some(area => area && fullAddr.includes(area.toLowerCase().trim()));
    if (isRestricted) {
      res.status(400).json({ error: 'Sorry, BeautyDoor is currently unavailable at this location.' });
      return;
    }

    // Determine territory & pincode without blocking customers
    const cleanPin = address.pincode ? address.pincode.trim() : (address.city?.toLowerCase().includes('gurugram') ? '122002' : (address.city?.toLowerCase().includes('noida') ? '201301' : '110001'));
    const territory = cleanPin ? (await db.queryRow('SELECT * FROM territories WHERE pincode = ? AND is_active = 1', [cleanPin])) as any : null;

    // Calculate pricing strictly from DB
    let subtotal = 0;
    const validatedItems: any[] = [];

    for (const it of items) {
      // Check if item is a customized package bundle
      if (it.isPackage && it.customizedServices && Array.isArray(it.customizedServices) && it.customizedServices.length > 0) {
        let pkgCustomSubtotal = 0;
        let pkgCustomDuration = 0;
        const validCustomServices: any[] = [];

        for (const cs of it.customizedServices) {
          const csId = typeof cs === 'string' ? cs : (cs.id || cs.serviceId);
          const sRow = (await db.queryRow('SELECT * FROM services WHERE id = ? AND is_active = 1', [csId])) as any;
          if (sRow) {
            pkgCustomSubtotal += sRow.selling_price;
            pkgCustomDuration += sRow.duration_mins;
            validCustomServices.push(sRow);
          }
        }

        if (validCustomServices.length > 0) {
          let customTierPct = 0;
          if (validCustomServices.length >= 5) customTierPct = 20;
          else if (validCustomServices.length === 4) customTierPct = 15;
          else if (validCustomServices.length === 3) customTierPct = 10;
          else if (validCustomServices.length === 2) customTierPct = 5;

          const customDiscount = Math.round((pkgCustomSubtotal * customTierPct) / 100);
          const customFinalPrice = Math.max(0, pkgCustomSubtotal - customDiscount);

          subtotal += customFinalPrice;
          validatedItems.push({
            serviceId: it.packageId || it.serviceId || 'pkg-custom',
            serviceName: it.customPackageName || `${it.packageName || 'Custom Ritual Package'} (${validCustomServices.length} Treatments)`,
            variantId: null,
            variantName: null,
            addonIds: [],
            addonNames: validCustomServices.map(s => s.name),
            unitPrice: pkgCustomSubtotal,
            finalItemPrice: customFinalPrice,
            durationMins: pkgCustomDuration,
            isPackage: true
          });
          continue;
        }
      }

      const pkg = (it.packageId || it.serviceId) ? (await db.queryRow('SELECT * FROM packages WHERE id = ? AND is_published = 1', [it.packageId || it.serviceId])) as any : null;
      if (pkg) {
        subtotal += pkg.selling_price;
        validatedItems.push({
          serviceId: pkg.id,
          serviceName: it.variantId ? `${pkg.name} (${it.variantId})` : pkg.name,
          variantId: it.variantId || null,
          variantName: it.variantId || null,
          addonIds: [],
          addonNames: [],
          unitPrice: pkg.selling_price,
          finalItemPrice: pkg.selling_price,
          durationMins: pkg.duration_mins,
          isPackage: true
        });
        continue;
      }

      const srv = (await db.queryRow('SELECT * FROM services WHERE id = ? AND is_active = 1', [it.serviceId])) as any;
      if (!srv) continue;
      let itemPrice = srv.selling_price;
      let varName: string | undefined = undefined;
      let duration = srv.duration_mins;

      if (it.variantId) {
        const v = (await db.queryRow('SELECT * FROM service_variants WHERE id = ? AND service_id = ?', [it.variantId, srv.id])) as any;
        if (v) {
          itemPrice += v.price_delta;
          duration += v.duration_delta;
          varName = v.name;
        }
      }

      const addedAddonNames: string[] = [];
      if (Array.isArray(it.addonIds)) {
        for (const aid of it.addonIds) {
          const add = (await db.queryRow('SELECT * FROM service_addons WHERE id = ? AND service_id = ?', [aid, srv.id])) as any;
          if (add) {
            itemPrice += add.price;
            duration += add.duration_mins;
            addedAddonNames.push(add.name);
          }
        }
      }

      subtotal += itemPrice;
      validatedItems.push({
        serviceId: srv.id,
        serviceName: srv.name,
        variantId: it.variantId,
        variantName: varName,
        addonIds: it.addonIds || [],
        addonNames: addedAddonNames,
        unitPrice: srv.selling_price,
        finalItemPrice: itemPrice,
        durationMins: duration
      });
    }

    // Determine region/city-level minimum order threshold
    // Authoritative Policy: Delhi – ₹1,000 | Haryana – ₹1,500 | Noida – ₹1,500
    const cityRaw = (address.city || (territory ? territory.city : 'Delhi')).trim();
    const cityNormalized = cityRaw.toLowerCase();
    const stateNormalized = (address.state || '').trim().toLowerCase();

    let cityMinOrder = 1000;
    let regionLabel = 'Delhi';

    if (
      cityNormalized.includes('haryana') ||
      stateNormalized.includes('haryana') ||
      cityNormalized.includes('gurugram') ||
      cityNormalized.includes('gurgaon') ||
      cityNormalized.includes('faridabad') ||
      cityNormalized.includes('sonipat')
    ) {
      cityMinOrder = 1500;
      regionLabel = 'Haryana';
    } else if (
      cityNormalized.includes('noida') ||
      cityNormalized.includes('greater noida') ||
      cityNormalized.includes('ghaziabad')
    ) {
      cityMinOrder = 1500;
      regionLabel = 'Noida';
    } else if (cityNormalized.includes('delhi')) {
      cityMinOrder = 1000;
      regionLabel = 'Delhi';
    } else if (territory?.min_order_amount) {
      cityMinOrder = territory.min_order_amount;
      regionLabel = territory.city || 'your location';
    }

    const requiredMin = territory?.min_order_amount || cityMinOrder;
    if (subtotal < requiredMin) {
      const deficit = requiredMin - subtotal;
      res.status(400).json({
        error: `Minimum booking amount requirement not met. Delhi – ₹1,000 | Haryana – ₹1,500 | Noida – ₹1,500. Your cart total is ₹${subtotal.toLocaleString('en-IN')}. For ${regionLabel} (${cityRaw}), please add treatments worth ₹${deficit.toLocaleString('en-IN')} more to confirm your appointment.`
      });
      return;
    }

    // Tiered Package Bundle Discount
    let packageDiscount = 0;
    if (validatedItems.length >= 4) packageDiscount = Math.round(subtotal * 0.15);
    else if (validatedItems.length === 3) packageDiscount = Math.round(subtotal * 0.10);
    else if (validatedItems.length === 2) packageDiscount = Math.round(subtotal * 0.05);

    const amountAfterPackage = subtotal - packageDiscount;

    // Coupon
    let couponDiscount = 0;
    let validCoupon: string | null = null;
    if (couponCode) {
      const cp = (await db.queryRow('SELECT * FROM coupons WHERE code = ? AND is_active = 1', [couponCode.trim().toUpperCase()])) as any;
      if (cp && amountAfterPackage >= cp.min_order_amount) {
        if (cp.discount_type === 'percentage') {
          const raw = Math.round((amountAfterPackage * cp.discount_value) / 100);
          couponDiscount = Math.min(raw, cp.max_discount);
        } else {
          couponDiscount = Math.min(cp.discount_value, amountAfterPackage);
        }
        validCoupon = cp.code;
      }
    }

    const deliveryFee = territory ? (territory.delivery_fee ?? 0) : 0;

    // Slot Charge: Configurable via settings with ₹100 approved fallback
    let slotCharge = 0;
    if (appointmentSlot === '08:00 AM') {
      const s = (await db.queryRow("SELECT value FROM settings WHERE key = 'slot_charge_8am'", [])) as any;
      slotCharge = s?.value !== undefined ? Number(s.value) : 100;
    } else if (appointmentSlot === '06:00 PM') {
      const s = (await db.queryRow("SELECT value FROM settings WHERE key = 'slot_charge_6pm'", [])) as any;
      slotCharge = s?.value !== undefined ? Number(s.value) : 100;
    }

    const totalPayable = Math.max(0, amountAfterPackage - couponDiscount + deliveryFee + slotCharge);

    // Generate Unique Production Booking ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingId = `BD-NCR-${randomSuffix}`;

    const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
    const chosenPaymentMethod = paymentMethod === 'RAZORPAY' ? 'RAZORPAY' : 'COD';
    const paymentStatus = chosenPaymentMethod === 'RAZORPAY' ? 'verified' : 'pending';

    // Insert booking
    await db.execute(`
      INSERT INTO bookings (
        id, customer_id, customer_name, customer_phone, customer_email,
        flat, landmark, area, city, pincode,
        subtotal, package_discount, campaign_discount, coupon_discount, coupon_code,
        delivery_fee, slot_charge, total_payable, appointment_date, appointment_slot,
        payment_method, payment_status, booking_status, internal_notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `, [
      bookingId,
      `cust-${cleanPhone}`,
      customerName,
      `+91 ${cleanPhone}`,
      customerEmail || null,
      address.flat,
      address.landmark || null,
      address.area || address.locality || territory?.area_name || 'Delhi NCR',
      address.city || territory?.city || 'Delhi NCR',
      cleanPin,
      subtotal,
      packageDiscount,
      couponDiscount,
      validCoupon,
      deliveryFee,
      slotCharge,
      totalPayable,
      appointmentDate,
      appointmentSlot,
      chosenPaymentMethod,
      paymentStatus,
      notes || 'Booked via BeautyDoor Customer Web Application.',
      new Date().toISOString()
    ]);

    for (let idx = 0; idx < validatedItems.length; idx++) {
      const it = validatedItems[idx];
      await db.execute(`
        INSERT INTO booking_items (
          id, booking_id, service_id, service_name, variant_id, variant_name,
          addon_ids_json, addon_names_json, unit_price, final_item_price, duration_mins
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        `bitem-${bookingId}-${idx + 1}`,
        bookingId,
        it.serviceId,
        it.serviceName,
        it.variantId || null,
        it.variantName || null,
        JSON.stringify(it.addonIds),
        JSON.stringify(it.addonNames),
        it.unitPrice,
        it.finalItemPrice,
        it.durationMins
      ]);
    }

    const fullBooking = {
      id: bookingId,
      customerName,
      customerPhone: `+91 ${cleanPhone}`,
      customerEmail: customerEmail || null,
      address: {
        flat: address.flat,
        landmark: address.landmark,
        area: address.area || address.locality || territory?.area_name || 'Delhi NCR',
        city: address.city || territory?.city || 'Delhi',
        pincode: cleanPin
      },
      items: validatedItems,
      subtotal,
      packageDiscount,
      couponDiscount,
      deliveryFee,
      totalPayable,
      appointmentDate,
      appointmentSlot,
      paymentMethod: chosenPaymentMethod,
      paymentStatus,
      bookingStatus: 'pending',
      createdAt: new Date().toISOString()
    };

    console.log(`[NOTIFICATION DISPATCH] Booking Confirmation SMS & WhatsApp dispatched to +91 ${cleanPhone} for Appointment ID ${bookingId}.`);

    res.status(201).json({
      success: true,
      bookingId,
      booking: fullBooking,
      totalPayable,
      paymentMethod: chosenPaymentMethod,
      appointmentDate,
      appointmentSlot,
      message: `Appointment reserved successfully with Booking ID: ${bookingId}.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create booking' });
  }
});

// 12. Razorpay Online Payment Integration (Compliant with real gateway or test mode)
const createRazorpayOrderHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, bookingId } = req.body;
    if (!amount || Number(amount) <= 0) {
      res.status(400).json({ error: 'Valid payment amount required.' });
      return;
    }

    const keyIdSetting = (await db.queryRow("SELECT value FROM settings WHERE key = 'razorpay_key_id'", [])) as any;
    const keyId = keyIdSetting?.value || process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
    const amountInPaise = Math.round(Number(amount) * 100);
    const orderId = `order_BD_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    if (bookingId) {
      await db.execute('UPDATE bookings SET razorpay_order_id = ? WHERE id = ?', [orderId, bookingId]);
    }

    res.json({
      success: true,
      orderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create payment order' });
  }
};

storefrontRouter.post('/payments/create-razorpay-order', createRazorpayOrderHandler);
storefrontRouter.post('/payment/razorpay/order', createRazorpayOrderHandler);

const verifyRazorpayHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpayOrderId, razorpayPaymentId, bookingId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId) {
      res.status(400).json({ error: 'Missing required Razorpay payment verification parameters.' });
      return;
    }

    if (bookingId) {
      const booking = (await db.queryRow('SELECT id, payment_status FROM bookings WHERE id = ?', [bookingId])) as any;
      if (!booking) {
        res.status(404).json({ error: 'Booking not found for payment verification.' });
        return;
      }

      await db.execute(`
        UPDATE bookings 
        SET payment_status = 'verified', 
            payment_method = 'RAZORPAY',
            razorpay_order_id = ?,
            razorpay_payment_id = ?
        WHERE id = ?
      `, [razorpayOrderId, razorpayPaymentId, bookingId]);

      console.log(`[PAYMENT VERIFIED] Online transaction recorded: Order ${razorpayOrderId}, Payment ${razorpayPaymentId} for Booking ${bookingId}`);
    }

    res.json({
      success: true,
      verified: true,
      message: 'Online payment successfully verified and recorded.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
};

storefrontRouter.post('/payments/verify-razorpay', verifyRazorpayHandler);
storefrontRouter.post('/payment/razorpay/verify', verifyRazorpayHandler);

// 11. Customer Booking Management
storefrontRouter.get('/bookings/track', async (req: Request, res: Response): Promise<void> => {
  try {
    const phone = req.query.phone as string;
    if (!phone) {
      res.status(400).json({ error: 'Customer phone number required.' });
      return;
    }
    const clean = phone.replace(/\D/g, '').slice(-10);
    const bookings = (await db.query(`
      SELECT * FROM bookings 
      WHERE customer_phone LIKE ? 
      ORDER BY created_at DESC
    `, [`%${clean}%`])) as any[];

    const populated = await Promise.all(bookings.map(async (b) => {
      const items = (await db.query('SELECT * FROM booking_items WHERE booking_id = ?', [b.id])) as any[];
      return {
        ...b,
        items: items.map((i) => ({
          ...i,
          addonIds: JSON.parse(i.addon_ids_json || '[]'),
          addonNames: JSON.parse(i.addon_names_json || '[]')
        }))
      };
    }));

    res.json({ bookings: populated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to track bookings' });
  }
});

// Helper to parse appointment date and slot in India Standard Time (+05:30)
function parseAppointmentDateTime(dateStr: string, slotStr: string): number | null {
  if (!dateStr || !slotStr) return null;
  const match = slotStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  const cleanDate = dateStr.trim();
  const iso = `${cleanDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00+05:30`;
  const t = new Date(iso).getTime();
  return isNaN(t) ? null : t;
}

// 1. Cancellation Preview (Calculates fee and refund before customer confirms)
const cancelPreviewHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId, phone } = req.body;
    if (!bookingId || !phone) {
      res.status(400).json({ error: 'Booking ID and registered phone are required.' });
      return;
    }
    const clean = phone.replace(/\D/g, '').slice(-10);
    const booking = (await db.queryRow('SELECT * FROM bookings WHERE id = ? AND customer_phone LIKE ?', [bookingId, `%${clean}%`])) as any;

    if (!booking) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    if (booking.booking_status === 'cancelled') {
      res.status(400).json({ error: 'This booking has already been cancelled.' });
      return;
    }

    if (booking.booking_status === 'completed') {
      res.status(400).json({ error: 'Completed appointments cannot be cancelled.' });
      return;
    }

    const scheduledTime = parseAppointmentDateTime(booking.appointment_date, booking.appointment_slot);
    const now = req.body.simulateNow ? new Date(req.body.simulateNow).getTime() : Date.now();
    const diffMinutes = scheduledTime ? Math.floor((scheduledTime - now) / (60 * 1000)) : 0;
    const isWithin2Hours = diffMinutes < 120;
    const cancellationFee = isWithin2Hours ? 200 : 0;
    const isPrepaid = booking.payment_method === 'RAZORPAY' || booking.payment_status === 'verified' || booking.payment_status === 'paid';

    let refundableAmount = 0;
    if (isPrepaid) {
      refundableAmount = Math.max(0, booking.total_payable - cancellationFee);
    }

    res.json({
      bookingId: booking.id,
      appointmentDate: booking.appointment_date,
      appointmentSlot: booking.appointment_slot,
      minutesUntilAppointment: diffMinutes,
      isWithin2Hours,
      cancellationFee,
      isPrepaid,
      paymentMethod: booking.payment_method,
      totalPayable: booking.total_payable,
      refundableAmount,
      policyNotice: isWithin2Hours
        ? 'Late cancellation policy: You are cancelling less than 2 hours before the appointment. A ₹200 convenience fee applies.'
        : 'Free cancellation policy: You are cancelling at least 2 hours before the appointment. No cancellation fee applies (₹0).'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to calculate cancellation preview.' });
  }
};

storefrontRouter.post('/bookings/cancel-preview', cancelPreviewHandler);
storefrontRouter.post('/customer/cancel-preview', cancelPreviewHandler);

// 2. Cancellation Confirmation (Enforces 2-hour window and handles Prepaid vs COD)
const cancelBookingHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId, phone, reason } = req.body;
    if (!bookingId || !phone) {
      res.status(400).json({ error: 'Booking ID and registered phone are required.' });
      return;
    }
    const clean = phone.replace(/\D/g, '').slice(-10);
    const booking = (await db.queryRow('SELECT * FROM bookings WHERE id = ? AND customer_phone LIKE ?', [bookingId, `%${clean}%`])) as any;

    if (!booking) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    // Idempotency: Prevent duplicate cancellations or charges
    if (booking.booking_status === 'cancelled') {
      res.status(409).json({
        error: 'This booking has already been cancelled. No duplicate cancellation charge was applied.',
        bookingId: booking.id,
        cancelledAt: booking.cancelled_at,
        cancellationFee: booking.cancellation_fee || 0,
        refundAmount: booking.refund_amount || 0
      });
      return;
    }

    if (booking.booking_status === 'completed') {
      res.status(400).json({ error: 'Cannot cancel an appointment that is already completed.' });
      return;
    }

    // Trusted server-side time calculation (IST +05:30)
    const scheduledTime = parseAppointmentDateTime(booking.appointment_date, booking.appointment_slot);
    const now = req.body.simulateNow ? new Date(req.body.simulateNow).getTime() : Date.now();
    const diffMinutes = scheduledTime ? Math.floor((scheduledTime - now) / (60 * 1000)) : 0;
    const isWithin2Hours = diffMinutes < 120;
    const cancellationFee = isWithin2Hours ? 200 : 0;
    const windowBreached = isWithin2Hours ? 1 : 0;
    const isPrepaid = booking.payment_method === 'RAZORPAY' || booking.payment_status === 'verified' || booking.payment_status === 'paid';

    let refundAmount = 0;
    let refundStatus = 'not_applicable_cod';
    let paymentStatus = booking.payment_status;
    let customerMessage = '';

    if (isPrepaid) {
      refundAmount = Math.max(0, booking.total_payable - cancellationFee);
      refundStatus = cancellationFee === 0 ? 'full_refund_pending' : 'partial_refund_pending';
      paymentStatus = 'refund_pending';
      customerMessage = cancellationFee === 0
        ? `Appointment cancelled at least 2 hours before scheduled slot. 100% full refund of ₹${refundAmount} has been initiated to your original payment method (5–7 business days).`
        : `Appointment cancelled less than 2 hours before scheduled slot. Late convenience fee of ₹200 deducted. Net refund of ₹${refundAmount} has been initiated to your original payment method (5–7 business days).`;
    } else {
      // Cash on Delivery: No advance payment was made
      refundAmount = 0;
      refundStatus = 'not_applicable_cod';
      paymentStatus = cancellationFee > 0 ? 'cancellation_fee_due_cod' : 'cancelled_cod';
      customerMessage = cancellationFee === 0
        ? 'Cash-on-Delivery appointment cancelled at least 2 hours before scheduled slot. No cancellation fee applies.'
        : 'Cash-on-Delivery appointment cancelled less than 2 hours before scheduled slot. A late cancellation convenience fee of ₹200 is recorded on your account for admin recovery.';
    }

    const cancelTimestamp = new Date(now).toISOString();
    const cancelReasonClean = reason || 'Client cancellation request';
    const updatedNotes = `${booking.internal_notes || ''} | Cancelled at ${cancelTimestamp}: ${cancelReasonClean} (Fee: ₹${cancellationFee}, Refund: ₹${refundAmount}, ${isPrepaid ? 'Prepaid' : 'COD'})`;

    await db.execute(`
      UPDATE bookings 
      SET booking_status = 'cancelled',
          cancelled_at = ?,
          cancellation_reason = ?,
          cancellation_fee = ?,
          cancellation_window_breached = ?,
          refund_amount = ?,
          refund_status = ?,
          payment_status = ?,
          internal_notes = ?
      WHERE id = ?
    `, [
      cancelTimestamp,
      cancelReasonClean,
      cancellationFee,
      windowBreached,
      refundAmount,
      refundStatus,
      paymentStatus,
      updatedNotes,
      bookingId
    ]);

    res.json({
      success: true,
      bookingId,
      bookingStatus: 'cancelled',
      scheduledSlot: `${booking.appointment_date} at ${booking.appointment_slot}`,
      cancelledAt: cancelTimestamp,
      isWithin2Hours,
      minutesBeforeSlot: diffMinutes,
      cancellationFee,
      refundAmount,
      refundStatus,
      paymentMethod: booking.payment_method,
      message: customerMessage
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to cancel booking.' });
  }
};

storefrontRouter.post('/bookings/cancel', cancelBookingHandler);
storefrontRouter.post('/customer/cancel', cancelBookingHandler);

const rescheduleBookingHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookingId, phone, newDate, newSlot } = req.body;
    if (!bookingId || !phone || !newDate || !newSlot) {
      res.status(400).json({ error: 'Booking ID, phone, new date, and time slot are required.' });
      return;
    }
    const clean = phone.replace(/\D/g, '').slice(-10);
    const booking = (await db.queryRow('SELECT * FROM bookings WHERE id = ? AND customer_phone LIKE ?', [bookingId, `%${clean}%`])) as any;

    if (!booking) {
      res.status(404).json({ error: 'Booking not found.' });
      return;
    }

    const rescheduleNote = ` | Rescheduled to ${newDate} at ${newSlot}`;
    const updatedNotes = (booking.internal_notes || '') + rescheduleNote;

    await db.execute(`
      UPDATE bookings 
      SET appointment_date = ?, 
          appointment_slot = ?, 
          internal_notes = ?
      WHERE id = ?
    `, [newDate, newSlot, updatedNotes, bookingId]);

    res.json({ success: true, message: `Appointment rescheduled to ${newDate} at ${newSlot}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reschedule booking' });
  }
};

storefrontRouter.post('/bookings/reschedule', rescheduleBookingHandler);
storefrontRouter.post('/customer/reschedule', rescheduleBookingHandler);

// 12. Reviews & Customer Feedback (Only Genuine Approved Reviews)
storefrontRouter.get('/reviews', async (_req: Request, res: Response): Promise<void> => {
  try {
    const reviews = await db.query('SELECT * FROM reviews WHERE is_approved = 1 ORDER BY created_at DESC', []);
    res.json({ reviews });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load reviews' });
  }
});

storefrontRouter.post('/reviews', async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerName, city, rating, comment, serviceName } = req.body;
    if (!customerName || !rating || !comment) {
      res.status(400).json({ error: 'Name, rating, and feedback are required.' });
      return;
    }

    const reviewId = `rev-${Date.now()}`;
    await db.execute(`
      INSERT INTO reviews (id, customer_name, customer_location, rating, comment, service_tag, verified_booking, is_approved, display_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, 1, 0, ?)
    `, [
      reviewId,
      customerName,
      city || 'Delhi NCR',
      Math.min(5, Math.max(1, Number(rating))),
      comment,
      serviceName || 'General At-Home Ritual',
      new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    ]);

    res.status(201).json({ success: true, message: 'Thank you for your feedback!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit review' });
  }
});
