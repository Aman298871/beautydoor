import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { db } from '../db/database.ts';
import { emailService } from '../services/emailService.ts';
import { smsService } from '../services/smsService.ts';
import { razorpayService } from '../services/razorpayService.ts';
import { requireCustomerAuth } from '../middleware/customerAuthMiddleware.ts';

export const storefrontRouter = Router();

/**
 * Authoritative Razorpay Availability Check
 * Online payment is available when:
 * 1. Razorpay is not explicitly disabled by store owner in database settings.
 * 2. Backend credentials (key ID & secret) are configured and valid.
 * 3. Enabled via env or db settings or active credentials.
 */
export async function getAuthoritativePaymentOptions(providedSettings?: Record<string, string>) {
  let settings = providedSettings;
  if (!settings) {
    const rawSettings = (await db.query('SELECT * FROM settings', [])) as { key: string; value: string }[];
    settings = {};
    rawSettings.forEach((r) => {
      settings![r.key] = r.value;
    });
  }

  // Refresh credentials ONLY from secure environment variables or database settings
  const envKey = process.env.RAZORPAY_KEY_ID || '';
  const envSecret = process.env.RAZORPAY_KEY_SECRET || '';
  const dbKey = settings.razorpay_key_id || '';
  const candidateKey = envKey || dbKey;

  if (candidateKey && envSecret) {
    razorpayService.refreshCredentials(candidateKey, envSecret);
  }

  // 1. Environment-level explicit disable ALWAYS wins:
  // ENABLE_RAZORPAY=false or RAZORPAY_ENABLED=false must ALWAYS prevent new online payment
  const envExplicitDisable = process.env.ENABLE_RAZORPAY === 'false' || process.env.RAZORPAY_ENABLED === 'false';
  const envExplicitEnable = process.env.ENABLE_RAZORPAY === 'true' || process.env.RAZORPAY_ENABLED === 'true';
  const dbExplicitEnable = settings.razorpay_enabled === 'true';
  const isConfigured = razorpayService.isConfigured();

  // Strict decision matrix:
  // - If envExplicitDisable is TRUE -> ALWAYS DISABLED (Database cannot override)
  // - Default is DISABLED.
  // - Online payments enabled ONLY IF:
  //     NOT envExplicitDisable
  //     AND (envExplicitEnable || dbExplicitEnable)
  //     AND isConfigured
  // - Do NOT enable Razorpay merely because credentials exist.
  const isAvailable = !envExplicitDisable && (envExplicitEnable || dbExplicitEnable) && isConfigured;

  let disabledReason: string | null = null;
  if (envExplicitDisable) {
    disabledReason = 'Online payments temporarily disabled via system environment configuration.';
  } else if (!isConfigured) {
    disabledReason = 'Razorpay credentials not configured or incomplete.';
  } else if (!isAvailable) {
    disabledReason = 'Online payment via Razorpay is temporarily disabled. Please select Cash on Delivery (Pay After Service).';
  }

  const razorpayKey = isAvailable ? (razorpayService.getKeyId() || candidateKey) : '';
  const paymentMode: 'test' | 'live' = razorpayKey.startsWith('rzp_live_') ? 'live' : 'test';

  return {
    codAvailable: true,
    razorpayAvailable: isAvailable,
    razorpayKeyId: razorpayKey,
    paymentMode,
    disabledReason
  };
}

// 1. Catalog & Active Settings
storefrontRouter.get('/catalog', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await db.query('SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC', []);
    const rawServices = (await db.query('SELECT * FROM services WHERE is_active = 1 AND is_published = 1 AND COALESCE(is_archived, 0) = 0 ORDER BY created_at DESC', [])) as any[];

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

    const rawPackages = (await db.query('SELECT * FROM packages WHERE is_published = 1 AND COALESCE(is_archived, 0) = 0 ORDER BY display_order ASC', [])) as any[];
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

    const paymentOptions = await getAuthoritativePaymentOptions(settings);

    res.json({
      categories,
      services,
      packages,
      hygieneCommitments,
      settings,
      paymentOptions,
      razorpay: {
        enabled: paymentOptions.razorpayAvailable,
        keyId: paymentOptions.razorpayKeyId
      }
    });
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

    const paymentOptions = await getAuthoritativePaymentOptions(settings);

    res.json({
      settings,
      paymentOptions,
      razorpay: {
        enabled: paymentOptions.razorpayAvailable,
        keyId: paymentOptions.razorpayKeyId
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load business settings' });
  }
});

// 1b. Packages List & Detail
storefrontRouter.get('/packages', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rawPackages = (await db.query('SELECT * FROM packages WHERE is_published = 1 AND COALESCE(is_archived, 0) = 0 ORDER BY display_order ASC', [])) as any[];
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

// 4b. All Active Services List
storefrontRouter.get('/services', async (_req: Request, res: Response): Promise<void> => {
  try {
    const rawServices = (await db.query('SELECT * FROM services WHERE is_active = 1 AND is_published = 1 AND COALESCE(is_archived, 0) = 0 ORDER BY created_at DESC', [])) as any[];
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
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load services' });
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

    const locationQuery = (pincode || locality || address || '').toString().trim();
    if (locationQuery) {
      const cleanInput = locationQuery.toLowerCase();
      // Return all matching active localities for the requested PIN or area
      const matchingTerritories = (await db.query(
        'SELECT * FROM territories WHERE (pincode = ? OR LOWER(area_name) LIKE ? OR LOWER(city) LIKE ?) AND is_active = 1 ORDER BY area_name ASC',
        [locationQuery, `%${cleanInput}%`, `%${cleanInput}%`]
      )) as any[];

      if (matchingTerritories.length > 0) {
        const primary = matchingTerritories[0];
        const localityNames = matchingTerritories.map(t => t.area_name).join(', ');
        const customMsg = locationQuery === '110017' || localityNames.toLowerCase().includes('saket')
          ? 'Service available in Saket, Malviya Nagar and Sainik Farm, South Delhi. Enter your PIN code to check whether your exact locality is covered.'
          : (matchingTerritories.length === 1
            ? `Verified: Doorstep beauty services available in ${primary.area_name}, ${primary.city}.`
            : `Verified: Doorstep beauty services available in ${localityNames} (${primary.pincode}, ${primary.city}).`);

        res.json({
          isServiceable: true,
          territory: primary,
          territories: matchingTerritories,
          message: customMsg
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
          const sRow = (await db.queryRow('SELECT * FROM services WHERE id = ? AND is_active = 1 AND is_published = 1 AND COALESCE(is_archived, 0) = 0', [csId])) as any;
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

      const pkg = (it.packageId || it.serviceId) ? (await db.queryRow('SELECT * FROM packages WHERE id = ? AND is_published = 1 AND COALESCE(is_archived, 0) = 0', [it.packageId || it.serviceId])) as any : null;
      if (pkg) {
        subtotal += pkg.selling_price;
        const chosenVariantName = it.variantName || it.variantId || null;
        validatedItems.push({
          serviceId: pkg.id,
          serviceName: chosenVariantName ? `${pkg.name} (${chosenVariantName})` : pkg.name,
          variantId: it.variantId || null,
          variantName: chosenVariantName,
          addonIds: [],
          addonNames: [],
          unitPrice: pkg.selling_price,
          finalItemPrice: pkg.selling_price,
          durationMins: pkg.duration_mins,
          isPackage: true
        });
        continue;
      }

      const srv = (await db.queryRow('SELECT * FROM services WHERE id = ? AND is_active = 1 AND is_published = 1 AND COALESCE(is_archived, 0) = 0', [it.serviceId])) as any;
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

    // Coupon Validation (Validated strictly against pre-discount cart subtotal)
    let couponDiscount = 0;
    let appliedCoupon: any = null;
    if (couponCode && typeof couponCode === 'string') {
      const cleanCode = couponCode.trim().toUpperCase();
      const todayDateStr = new Date().toISOString().split('T')[0];
      const cp = (await db.queryRow('SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR SUBSTR(expires_at, 1, 10) >= ?)', [cleanCode, todayDateStr])) as any;
      if (cp && subtotal >= cp.min_order_amount) {
        if (cp.discount_type === 'percentage') {
          const raw = Math.round((amountAfterPackage * cp.discount_value) / 100);
          couponDiscount = Math.min(raw, cp.max_discount || raw);
        } else {
          couponDiscount = Math.min(cp.discount_value, cp.max_discount || cp.discount_value, amountAfterPackage);
        }
        appliedCoupon = { code: cp.code, description: cp.description, discountAmount: couponDiscount };
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
        'Salon-grade sanitized and sterilized metal tools',
        'Single-use sealed skincare packs opened right in front of you',
        'Experienced female professionals'
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

    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
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

    // Determine territory & pincode without blocking customers (pincode is 100% optional)
    const cleanPin = address.pincode && address.pincode.trim() ? address.pincode.trim() : null;
    const territory = cleanPin
      ? (await db.queryRow('SELECT * FROM territories WHERE pincode = ? AND is_active = 1', [cleanPin])) as any
      : (await db.queryRow('SELECT * FROM territories WHERE LOWER(city) LIKE ? AND is_active = 1', [`%${(address.city || 'delhi').toLowerCase()}%`])) as any;

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
          const sRow = (await db.queryRow('SELECT * FROM services WHERE id = ? AND is_active = 1 AND is_published = 1 AND COALESCE(is_archived, 0) = 0', [csId])) as any;
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

      const pkg = (it.packageId || it.serviceId) ? (await db.queryRow('SELECT * FROM packages WHERE id = ? AND is_published = 1 AND COALESCE(is_archived, 0) = 0', [it.packageId || it.serviceId])) as any : null;
      if (pkg) {
        subtotal += pkg.selling_price;
        const chosenVariantName = it.variantName || it.variantId || null;
        validatedItems.push({
          serviceId: pkg.id,
          serviceName: chosenVariantName ? `${pkg.name} (${chosenVariantName})` : pkg.name,
          variantId: it.variantId || null,
          variantName: chosenVariantName,
          addonIds: [],
          addonNames: [],
          unitPrice: pkg.selling_price,
          finalItemPrice: pkg.selling_price,
          durationMins: pkg.duration_mins,
          isPackage: true
        });
        continue;
      }

      const srv = (await db.queryRow('SELECT * FROM services WHERE id = ? AND is_active = 1 AND is_published = 1 AND COALESCE(is_archived, 0) = 0', [it.serviceId])) as any;
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

    // Coupon Validation (Validated strictly against pre-discount cart subtotal)
    let couponDiscount = 0;
    let validCoupon: string | null = null;
    if (couponCode && typeof couponCode === 'string') {
      const todayDateStr = new Date().toISOString().split('T')[0];
      const cp = (await db.queryRow('SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND (expires_at IS NULL OR SUBSTR(expires_at, 1, 10) >= ?)', [couponCode.trim().toUpperCase(), todayDateStr])) as any;
      if (cp && subtotal >= cp.min_order_amount) {
        if (cp.discount_type === 'percentage') {
          const raw = Math.round((amountAfterPackage * cp.discount_value) / 100);
          couponDiscount = Math.min(raw, cp.max_discount || raw);
        } else {
          couponDiscount = Math.min(cp.discount_value, cp.max_discount || cp.discount_value, amountAfterPackage);
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
    const paymentOptions = await getAuthoritativePaymentOptions();
    if (paymentMethod === 'RAZORPAY' && !paymentOptions.razorpayAvailable) {
      res.status(400).json({
        error: paymentOptions.disabledReason || 'Online payment via Razorpay is currently disabled. Please select Cash on Delivery (Pay After Service).',
        code: 'RAZORPAY_DISABLED'
      });
      return;
    }
    const chosenPaymentMethod = (paymentOptions.razorpayAvailable && paymentMethod === 'RAZORPAY') ? 'RAZORPAY' : 'COD';
    // Payments start as pending until verified through gateway webhook / signature or collected on doorstep
    const paymentStatus = 'pending';
    const nowIso = new Date().toISOString();

    // Upsert customer record
    const customerId = `cust-${cleanPhone}`;
    try {
      await db.execute(`
        INSERT INTO customers (id, name, phone, email, total_bookings, total_spent, last_booking_at, created_at)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?)
        ON CONFLICT (id) DO UPDATE SET
          name = COALESCE(EXCLUDED.name, customers.name),
          email = COALESCE(EXCLUDED.email, customers.email),
          total_bookings = customers.total_bookings + 1,
          total_spent = customers.total_spent + EXCLUDED.total_spent,
          last_booking_at = EXCLUDED.last_booking_at
      `, [
        customerId,
        customerName,
        `+91 ${cleanPhone}`,
        customerEmail || null,
        totalPayable,
        nowIso,
        nowIso
      ]);
    } catch (custErr: any) {
      console.warn('[DB] Customer upsert notice:', custErr.message);
    }

    // Atomic Booking & Line Items Transaction
    await db.withTransaction(async (tx) => {
      await tx.execute(`
        INSERT INTO bookings (
          id, customer_id, customer_name, customer_phone, customer_email,
          flat, landmark, area, city, pincode,
          subtotal, package_discount, campaign_discount, coupon_discount, coupon_code,
          delivery_fee, slot_charge, total_payable, appointment_date, appointment_slot,
          payment_method, payment_status, booking_status, internal_notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
      `, [
        bookingId,
        customerId,
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
        nowIso
      ]);

      for (let idx = 0; idx < validatedItems.length; idx++) {
        const it = validatedItems[idx];
        await tx.execute(`
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
    });

    // Real Razorpay Order creation if customer chose online payment
    let razorpayOrderData: any = null;
    if (chosenPaymentMethod === 'RAZORPAY') {
      try {
        const amountInPaise = Math.round(totalPayable * 100);
        const order = await razorpayService.createOrder({
          bookingId,
          amountInPaise,
          currency: 'INR',
          notes: {
            bookingId,
            customerName,
            customerPhone: `+91 ${cleanPhone}`
          }
        });
        await db.execute('UPDATE bookings SET razorpay_order_id = ? WHERE id = ?', [order.id, bookingId]);
        razorpayOrderData = {
          orderId: order.id,
          amount: amountInPaise,
          currency: 'INR',
          keyId: razorpayService.getKeyId(),
          bookingId
        };
      } catch (rpErr: any) {
        console.error('[Razorpay] Order creation on booking checkout failed:', rpErr.message);
        res.status(502).json({
          error: `Online payment gateway error: ${rpErr.message || 'Could not initiate Razorpay order'}. Please retry online payment or choose Pay After Service (COD).`,
          bookingId,
          canRetryRazorpay: true,
          canFallbackCod: true
        });
        return;
      }
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
      createdAt: nowIso
    };

    // 1. Dispatches immediate new booking alert email to business owner (hello@beautydoor.in)
    emailService.sendNewBookingAlertToOwner(fullBooking).catch(err => {
      console.warn('[Email:OwnerAlert] Dispatch error:', err.message);
    });

    // 2. Dispatches customer booking received SMS
    smsService.sendCustomerBookingReceivedSms(cleanPhone, bookingId, totalPayable, appointmentSlot, appointmentDate).catch(err => {
      console.warn('[SMS:Customer] Dispatch error:', err.message);
    });

    console.log(`[NOTIFICATION DISPATCH] Booking Confirmation Notifications queued for Customer (+91 ${cleanPhone}) & Owner (Email) for Appointment ID ${bookingId}.`);

    if (customerEmail && customerEmail.trim().includes('@')) {
      emailService.sendBookingReceivedEmail({
        id: bookingId,
        customer_name: customerName,
        customer_phone: `+91 ${cleanPhone}`,
        customer_email: customerEmail.trim(),
        flat: address.flat,
        area: address.area || address.locality || territory?.area_name || 'Delhi NCR',
        city: address.city || territory?.city || 'Delhi',
        pincode: cleanPin,
        appointment_date: appointmentDate,
        appointment_slot: appointmentSlot,
        payment_method: chosenPaymentMethod,
        total_payable: totalPayable
      }).catch(err => console.warn('[Email] Storefront booking received dispatch error:', err.message));
    }

    res.status(201).json({
      success: true,
      bookingId,
      booking: fullBooking,
      totalPayable,
      paymentMethod: chosenPaymentMethod,
      appointmentDate,
      appointmentSlot,
      razorpayOrder: razorpayOrderData,
      message: `Appointment reserved successfully with Booking ID: ${bookingId}.`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create booking' });
  }
});

// 12. Real Razorpay Online Payment Integration (Compliant with real gateway or test mode)
const createRazorpayOrderHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const paymentOpts = await getAuthoritativePaymentOptions();
    if (!paymentOpts.razorpayAvailable) {
      res.status(403).json({
        error: paymentOpts.disabledReason || 'Online payments are temporarily disabled. Please book using Pay After Service (Cash / UPI) at doorstep.',
        code: 'RAZORPAY_DISABLED'
      });
      return;
    }

    const { bookingId } = req.body;
    if (!bookingId) {
      res.status(400).json({ error: 'bookingId is required to initialize payment.' });
      return;
    }

    // Authoritative check: Fetch booking directly from database
    const booking = (await db.queryRow('SELECT * FROM bookings WHERE id = ?', [bookingId])) as any;
    if (!booking) {
      res.status(404).json({ error: 'Booking not found for payment initialization.' });
      return;
    }

    if (booking.booking_status === 'cancelled') {
      res.status(400).json({ error: 'Cannot create payment order for a cancelled appointment.' });
      return;
    }

    if (booking.payment_status === 'verified' || booking.payment_status === 'paid') {
      res.status(400).json({ error: 'This appointment has already been paid and verified.' });
      return;
    }

    // Amount strictly calculated from authoritative booking record (in paise)
    const amountInPaise = Math.round(Number(booking.total_payable) * 100);
    if (isNaN(amountInPaise) || amountInPaise <= 0) {
      res.status(400).json({ error: 'Authoritative booking payable amount must be greater than zero.' });
      return;
    }

    const order = await razorpayService.createOrder({
      bookingId,
      amountInPaise,
      currency: 'INR',
      notes: {
        bookingId,
        customerName: booking.customer_name,
        customerPhone: booking.customer_phone
      }
    });

    await db.execute('UPDATE bookings SET razorpay_order_id = ? WHERE id = ?', [order.id, bookingId]);

    res.json({
      success: true,
      orderId: order.id,
      amount: amountInPaise,
      currency: 'INR',
      keyId: razorpayService.getKeyId(),
      bookingId
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create Razorpay payment order' });
  }
};

storefrontRouter.post('/payments/create-razorpay-order', createRazorpayOrderHandler);
storefrontRouter.post('/payment/razorpay/order', createRazorpayOrderHandler);
storefrontRouter.post('/payment/razorpay/create-order', createRazorpayOrderHandler);

const verifyRazorpayHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const paymentOpts = await getAuthoritativePaymentOptions();
    if (!paymentOpts.razorpayAvailable) {
      res.status(403).json({
        error: paymentOpts.disabledReason || 'Online payments are temporarily disabled. Please book using Pay After Service (Cash / UPI) at doorstep.',
        code: 'RAZORPAY_DISABLED'
      });
      return;
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !bookingId) {
      res.status(400).json({
        error: 'Missing required payment verification parameters: bookingId, razorpayOrderId, razorpayPaymentId, and razorpaySignature are required.'
      });
      return;
    }

    const booking = (await db.queryRow('SELECT * FROM bookings WHERE id = ?', [bookingId])) as any;
    if (!booking) {
      res.status(404).json({ error: 'Booking not found for payment verification.' });
      return;
    }

    // Security Check: Verify that the order ID matches the booking being verified
    if (booking.razorpay_order_id && booking.razorpay_order_id !== razorpayOrderId) {
      res.status(400).json({ error: 'Security validation failed: Razorpay Order ID does not match the registered booking order.' });
      return;
    }

    // Authoritative Server-Side HMAC-SHA256 Signature Verification
    const sigCheck = razorpayService.verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature
    });

    if (!sigCheck.valid) {
      res.status(400).json({ error: sigCheck.error || 'Payment signature verification failed. Authentication mismatch.' });
      return;
    }

    // Idempotent and Transactional Ledger Update
    await db.withTransaction(async (client) => {
      const lockClause = db.isPostgres ? 'FOR UPDATE' : '';
      const current = (await client.queryRow(`SELECT * FROM bookings WHERE id = ? ${lockClause}`, [bookingId])) as any;
      if (!current) throw new Error('BOOKING_NOT_FOUND');

      // Prevent duplicate verification & replay attacks
      if (current.payment_status === 'verified' || current.payment_status === 'paid') {
        return; // Already verified safely
      }

      const existingPayment = (await client.queryRow('SELECT id FROM booking_payments WHERE id = ?', [razorpayPaymentId])) as any;
      if (existingPayment) {
        return; // Payment already recorded
      }

      const timestamp = new Date().toISOString();
      const totalPayable = Number(current.total_payable);

      // Record in booking_payments ledger
      await client.execute(`
        INSERT INTO booking_payments (id, booking_id, amount, payment_method, notes, collected_by, created_at)
        VALUES (?, ?, ?, 'RAZORPAY', ?, 'razorpay_gateway', ?)
      `, [
        razorpayPaymentId,
        bookingId,
        totalPayable,
        `Razorpay online payment captured. Order: ${razorpayOrderId}`,
        timestamp
      ]);

      const updatedNotes = `${current.internal_notes || ''} | Razorpay online payment of ₹${totalPayable} verified (Payment ID: ${razorpayPaymentId}, Order ID: ${razorpayOrderId}) at ${timestamp}`;

      // Update booking status and balances
      await client.execute(`
        UPDATE bookings 
        SET payment_status = 'verified', 
            payment_method = 'RAZORPAY',
            amount_collected = ?,
            remaining_balance = 0,
            razorpay_order_id = ?,
            razorpay_payment_id = ?,
            razorpay_signature = ?,
            internal_notes = ?
        WHERE id = ?
      `, [
        totalPayable,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        updatedNotes,
        bookingId
      ]);
    });

    console.log(`[PAYMENT VERIFIED] Real Razorpay signature authenticated: Order ${razorpayOrderId}, Payment ${razorpayPaymentId} for Booking ${bookingId}`);

    res.json({
      success: true,
      verified: true,
      paymentId: razorpayPaymentId,
      bookingId,
      message: 'Razorpay payment successfully verified and recorded in accounting ledger.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
};

storefrontRouter.post('/payments/verify-razorpay', verifyRazorpayHandler);
storefrontRouter.post('/payment/razorpay/verify', verifyRazorpayHandler);

// Razorpay Webhook Endpoint
const razorpayWebhookHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!razorpayService.isConfigured()) {
      res.status(403).json({
        error: 'Razorpay payment gateway credentials not configured on backend.',
        code: 'RAZORPAY_NOT_CONFIGURED'
      });
      return;
    }

    const signature = req.headers['x-razorpay-signature'] as string;
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);

    const sigCheck = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!sigCheck.valid) {
      res.status(400).json({ error: sigCheck.error || 'Invalid webhook signature.' });
      return;
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity;
      const orderId = paymentEntity?.order_id || payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;

      if (orderId && paymentId) {
        const booking = (await db.queryRow('SELECT * FROM bookings WHERE razorpay_order_id = ?', [orderId])) as any;
        if (booking && booking.payment_status !== 'verified' && booking.payment_status !== 'paid') {
          await db.withTransaction(async (client) => {
            const timestamp = new Date().toISOString();
            const total = Number(booking.total_payable);

            await client.execute(`
              INSERT INTO booking_payments (id, booking_id, amount, payment_method, notes, collected_by, created_at)
              VALUES (?, ?, ?, 'RAZORPAY', ?, 'razorpay_webhook', ?)
            `, [paymentId, booking.id, total, `Webhook payment.captured. Order: ${orderId}`, timestamp]);

            await client.execute(`
              UPDATE bookings 
              SET payment_status = 'verified', 
                  payment_method = 'RAZORPAY',
                  amount_collected = ?,
                  remaining_balance = 0,
                  razorpay_payment_id = ?,
                  internal_notes = internal_notes || ' | Webhook verified ' || ?
              WHERE id = ?
            `, [total, paymentId, timestamp, booking.id]);
          });
        }
      }
    }

    res.json({ status: 'ok' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Webhook processing failed' });
  }
};

storefrontRouter.post('/payments/razorpay/webhook', razorpayWebhookHandler);
storefrontRouter.post('/payment/razorpay/webhook', razorpayWebhookHandler);

/**
 * Verify Twilio Webhook Authenticity via HMAC-SHA1
 */
export function verifyTwilioWebhookSignature(
  authToken: string,
  twilioSignature: string,
  url: string,
  params: Record<string, any>
): boolean {
  if (!authToken || !twilioSignature) return false;

  const sortedKeys = Object.keys(params).sort();
  let data = url;
  for (const key of sortedKeys) {
    data += key + (params[key] !== undefined && params[key] !== null ? String(params[key]) : '');
  }

  const expected = crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64');

  try {
    const a = Buffer.from(twilioSignature, 'utf-8');
    const b = Buffer.from(expected, 'utf-8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// Twilio SMS Delivery Status Webhook
export const twilioStatusWebhookHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const authToken = process.env.TWILIO_AUTH_TOKEN || '';
    const twilioSignature = (req.headers['x-twilio-signature'] as string) || '';

    // Verify webhook authenticity: reject unauthenticated webhook events
    if (!authToken && process.env.NODE_ENV === 'production') {
      res.status(403).json({ error: 'Twilio webhook verification failed: TWILIO_AUTH_TOKEN is not configured.' });
      return;
    }

    if (authToken) {
      if (!twilioSignature) {
        res.status(401).json({ error: 'Missing Twilio signature header (X-Twilio-Signature).' });
        return;
      }
      const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
      const defaultUrl = `${proto}://${host}${req.originalUrl}`;
      const candidateUrls = [
        process.env.TWILIO_WEBHOOK_URL,
        defaultUrl,
        `https://${host}${req.originalUrl}`,
        `http://${host}${req.originalUrl}`
      ].filter(Boolean) as string[];

      const isValid = candidateUrls.some(u => verifyTwilioWebhookSignature(authToken, twilioSignature, u, req.body || {}));
      if (!isValid) {
        res.status(403).json({ error: 'Invalid Twilio webhook signature.' });
        return;
      }
    }

    const messageSid = req.body?.MessageSid || req.body?.SmsSid;
    const messageStatus = req.body?.MessageStatus || req.body?.SmsStatus;

    if (!messageSid || !messageStatus) {
      res.status(400).json({ error: 'Missing MessageSid or MessageStatus in webhook payload.' });
      return;
    }

    // Do not trust arbitrary webhook payloads: verify message SID exists in audit records
    const existing = (await db.queryRow(
      "SELECT id, status, provider FROM booking_notifications WHERE message_id = ?",
      [messageSid]
    )) as any;

    if (!existing) {
      res.status(404).json({ error: 'Message SID not found in notification audit records.' });
      return;
    }

    // Distinguish queued/accepted from delivered. Only claim delivery when confirmed by provider.
    let updatedStatus: string;
    if (messageStatus === 'delivered') {
      updatedStatus = 'delivered';
    } else if (messageStatus === 'undelivered' || messageStatus === 'failed') {
      updatedStatus = 'failed';
    } else if (messageStatus === 'sent') {
      updatedStatus = 'sent';
    } else if (messageStatus === 'accepted') {
      updatedStatus = 'accepted';
    } else {
      updatedStatus = 'queued';
    }

    await db.execute(
      "UPDATE booking_notifications SET status = ?, error_message = COALESCE(error_message, '') || ' | Twilio status: ' || ? WHERE message_id = ?",
      [updatedStatus, messageStatus, messageSid]
    );

    res.type('text/xml').send('<Response></Response>');
  } catch (err: any) {
    res.status(500).send(err.message || 'Twilio webhook processing error');
  }
};
storefrontRouter.post('/webhooks/twilio/sms-status', twilioStatusWebhookHandler);

// Email Delivery Status Webhook (Resend / SMTP provider delivery notifications)
export const emailStatusWebhookHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const configuredSecret = process.env.EMAIL_WEBHOOK_SECRET || process.env.RESEND_WEBHOOK_SECRET || '';
    const incomingAuth = (req.headers['x-webhook-secret'] as string) || (req.headers['authorization'] as string) || '';

    // Verify webhook authenticity: reject unauthenticated webhook events
    if (configuredSecret) {
      const token = incomingAuth.replace(/^Bearer\s+/i, '');
      if (!token || token !== configuredSecret) {
        res.status(403).json({ error: 'Invalid or missing email webhook secret/signature.' });
        return;
      }
    } else if (process.env.NODE_ENV === 'production') {
      res.status(403).json({ error: 'Email webhook secret not configured. Unauthenticated webhooks rejected.' });
      return;
    }

    const event = req.body;
    const emailId = event?.data?.email_id || event?.id;
    const eventType = event?.type;

    if (!emailId || !eventType) {
      res.status(400).json({ error: 'Missing emailId or event type in webhook payload.' });
      return;
    }

    // Do not trust arbitrary webhook payloads: verify email ID exists in audit records
    const existing = (await db.queryRow(
      "SELECT id, status FROM booking_notifications WHERE message_id = ?",
      [emailId]
    )) as any;

    if (!existing) {
      res.status(404).json({ error: 'Email message ID not found in notification audit records.' });
      return;
    }

    const isSuccess = eventType === 'email.delivered';
    const isFailed = eventType === 'email.bounced' || eventType === 'email.complained';
    const updatedStatus = isSuccess ? 'delivered' : (isFailed ? 'failed' : 'sent');

    await db.execute(
      "UPDATE booking_notifications SET status = ?, error_message = COALESCE(error_message, '') || ' | Email event: ' || ? WHERE message_id = ?",
      [updatedStatus, eventType, emailId]
    );

    res.json({ received: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Email status webhook processing error' });
  }
};
storefrontRouter.post('/webhooks/email-status', emailStatusWebhookHandler);

// 11. Customer Booking Management (Protected with Firebase / OTP Customer Auth)
const trackBookingsHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Authenticated phone number derived securely from verified token
    const customerPhone = req.customer?.phone || (req.query.phone as string);
    if (!customerPhone) {
      res.status(401).json({ error: 'Customer authentication required.' });
      return;
    }
    const clean = customerPhone.replace(/\D/g, '').slice(-10);
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
};

storefrontRouter.get('/bookings/track', requireCustomerAuth, trackBookingsHandler);
storefrontRouter.get('/customer/bookings', requireCustomerAuth, trackBookingsHandler);

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
    const now = (process.env.NODE_ENV === 'test' && req.body.simulateNow)
      ? new Date(req.body.simulateNow).getTime()
      : Date.now();
    const diffMinutes = scheduledTime ? Math.floor((scheduledTime - now) / (60 * 1000)) : -1;
    const isWithin2Hours = diffMinutes < 120;
    const cancellationFee = isWithin2Hours ? 200 : 0;

    // Only verified captured payments qualify as prepaid refundable
    const isRazorpay = booking.payment_method === 'RAZORPAY';
    const isVerifiedCaptured = (booking.payment_status === 'verified' || booking.payment_status === 'paid');
    const amountCollected = Number(booking.amount_collected || 0);
    const isPrepaid = isRazorpay && isVerifiedCaptured;

    let refundableAmount = 0;
    if (isPrepaid && amountCollected > 0) {
      refundableAmount = Math.max(0, amountCollected - cancellationFee);
    } else if (!isRazorpay && amountCollected > 0) {
      refundableAmount = Math.max(0, amountCollected - cancellationFee);
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
      paymentStatus: booking.payment_status,
      totalPayable: booking.total_payable,
      amountCollected,
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

// 2. Cancellation Confirmation (Enforces 2-hour window and handles Verified Razorpay vs Unpaid vs COD)
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
    const now = (process.env.NODE_ENV === 'test' && req.body.simulateNow)
      ? new Date(req.body.simulateNow).getTime()
      : Date.now();
    const diffMinutes = scheduledTime ? Math.floor((scheduledTime - now) / (60 * 1000)) : -1;
    const isWithin2Hours = diffMinutes < 120;
    const cancellationFee = isWithin2Hours ? 200 : 0;
    const windowBreached = isWithin2Hours ? 1 : 0;

    // Strict verified payment state classification:
    // A booking with payment_method = 'RAZORPAY' is not necessarily paid!
    const isRazorpay = booking.payment_method === 'RAZORPAY';
    const isVerifiedCaptured = (booking.payment_status === 'verified' || booking.payment_status === 'paid');
    const amountCollected = Number(booking.amount_collected || 0);

    let refundAmount = 0;
    let refundStatus = 'not_applicable';
    let paymentStatus = booking.payment_status;
    let refundType: 'razorpay' | 'cod_cash' | 'none' = 'none';
    let customerMessage = '';
    let razorpayRefundId: string | null = null;

    if (isRazorpay) {
      if (!isVerifiedCaptured || amountCollected <= 0) {
        // Pending or failed online payment: Customer was never charged
        refundAmount = 0;
        refundStatus = 'not_applicable';
        refundType = 'none';
        paymentStatus = cancellationFee > 0 ? 'cancellation_fee_due_online' : 'cancelled_unpaid';
        customerMessage = cancellationFee === 0
          ? 'Online appointment request cancelled before payment was captured. No charge has been made to your bank account.'
          : 'Online appointment cancelled less than 2 hours before scheduled slot. A late cancellation convenience fee of ₹200 is due on your account.';
      } else {
        // Verified captured Razorpay payment
        refundAmount = Math.max(0, amountCollected - cancellationFee);
        refundType = 'razorpay';
        if (refundAmount > 0) {
          try {
            const refRes = await razorpayService.initiateRefund({
              paymentId: booking.razorpay_payment_id || `pay_${booking.id}`,
              amountInPaise: Math.round(refundAmount * 100),
              notes: { bookingId: booking.id, reason: reason || 'Customer cancellation' }
            });
            if (refRes.success && refRes.refundId) {
              refundStatus = 'refunded';
              paymentStatus = 'refunded';
              razorpayRefundId = refRes.refundId;
              customerMessage = cancellationFee === 0
                ? `Appointment cancelled at least 2 hours before scheduled slot. Full refund of ₹${refundAmount} successfully processed to your original payment method (Ref: ${refRes.refundId}).`
                : `Appointment cancelled less than 2 hours before scheduled slot. Late fee of ₹200 deducted. Net refund of ₹${refundAmount} successfully processed to your original payment method (Ref: ${refRes.refundId}).`;
            } else {
              refundStatus = 'razorpay_refund_pending';
              paymentStatus = 'refund_pending';
              customerMessage = cancellationFee === 0
                ? `Appointment cancelled at least 2 hours before scheduled slot. 100% full refund of ₹${refundAmount} has been registered and is pending gateway processing (5–7 business days).`
                : `Appointment cancelled less than 2 hours before scheduled slot. Late fee of ₹200 deducted. Net refund of ₹${refundAmount} has been registered and is pending gateway processing (5–7 business days).`;
            }
          } catch {
            refundStatus = 'razorpay_refund_pending';
            paymentStatus = 'refund_pending';
            customerMessage = `Net refund of ₹${refundAmount} registered and queued for gateway settlement.`;
          }
        } else {
          refundStatus = 'retained_as_cancellation_fee';
          paymentStatus = 'retained_as_cancellation_fee';
          customerMessage = 'Appointment cancelled less than 2 hours before slot. Payment retained as cancellation fee.';
        }
      }
    } else {
      // Cash on Delivery
      if (amountCollected > 0) {
        refundAmount = Math.max(0, amountCollected - cancellationFee);
        refundType = 'cod_cash';
        if (refundAmount > 0) {
          refundStatus = 'cod_cash_refund_due';
          paymentStatus = 'cod_cash_refund_pending';
          customerMessage = `Appointment cancelled. Cash refund of ₹${refundAmount} is due to you from BeautyDoor concierge.`;
        } else {
          refundStatus = 'retained_as_cancellation_fee';
          paymentStatus = 'retained_as_cancellation_fee';
          customerMessage = 'Doorstep deposit retained as late cancellation fee.';
        }
      } else {
        // COD Unpaid: No payment was made
        refundAmount = 0;
        refundStatus = 'not_applicable';
        refundType = 'none';
        paymentStatus = cancellationFee > 0 ? 'cancellation_fee_due_cod' : 'cancelled_cod';
        customerMessage = cancellationFee === 0
          ? 'Cash-on-Delivery appointment cancelled at least 2 hours before scheduled slot. No cancellation fee applies.'
          : 'Cash-on-Delivery appointment cancelled less than 2 hours before scheduled slot. A late cancellation convenience fee of ₹200 is recorded on your account.';
      }
    }

    const cancelTimestamp = new Date(now).toISOString();
    const cancelReasonClean = reason || 'Client cancellation request';
    const paymentDesc = isRazorpay
      ? (isVerifiedCaptured ? `Razorpay Verified (Captured ₹${amountCollected})` : 'Razorpay Unpaid/Pending')
      : (amountCollected > 0 ? `COD Collected (Cash ₹${amountCollected})` : 'COD Unpaid');
    const updatedNotes = `${booking.internal_notes || ''} | Cancelled at ${cancelTimestamp}: ${cancelReasonClean} (Fee: ₹${cancellationFee}, Refund: ₹${refundAmount}, ${paymentDesc})${razorpayRefundId ? ` | Razorpay Refund ID: ${razorpayRefundId}` : ''}`;

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
          razorpay_refund_id = COALESCE(?, razorpay_refund_id),
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
      razorpayRefundId || null,
      updatedNotes,
      bookingId
    ]);

    if (booking.customer_email) {
      emailService.sendBookingCancellationEmail(booking, cancellationFee, refundAmount, {
        isPrepaid: isRazorpay && isVerifiedCaptured,
        isCod: !isRazorpay,
        amountCollected,
        refundStatus
      }).catch(err => {
        console.warn('[Email] Storefront cancellation dispatch error:', err.message);
      });
    }

    if (booking.customer_phone) {
      smsService.sendCustomerBookingCancelledSms(booking.customer_phone, bookingId).catch(err => {
        console.warn('[SMS] Customer cancellation dispatch error:', err.message);
      });
    }

    res.json({
      success: true,
      bookingId,
      bookingStatus: 'cancelled',
      scheduledSlot: `${booking.appointment_date} at ${booking.appointment_slot}`,
      cancelledAt: cancelTimestamp,
      isWithin2Hours,
      minutesBeforeSlot: diffMinutes,
      cancellationFee,
      fee: cancellationFee,
      refundAmount,
      refundStatus,
      paymentStatus,
      paymentMethod: booking.payment_method,
      refundType,
      razorpayRefundId,
      message: customerMessage
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to cancel booking.' });
  }
};

storefrontRouter.post('/bookings/cancel', requireCustomerAuth, cancelBookingHandler);
storefrontRouter.post('/customer/cancel', requireCustomerAuth, cancelBookingHandler);

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

storefrontRouter.post('/bookings/reschedule', requireCustomerAuth, rescheduleBookingHandler);
storefrontRouter.post('/customer/reschedule', requireCustomerAuth, rescheduleBookingHandler);

// 12. Reviews & Customer Feedback (Only Genuine Approved Reviews)
storefrontRouter.get('/reviews', async (_req: Request, res: Response): Promise<void> => {
  try {
    const reviews = await db.query('SELECT * FROM reviews WHERE is_approved = 1 ORDER BY is_featured DESC, display_order ASC, created_at DESC', []);
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
      INSERT INTO reviews (id, customer_name, customer_location, rating, comment, service_tag, verified_booking, is_approved, is_featured, display_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, 0, 0, 0, ?)
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

// Active Customer FAQs for storefront FAQ page
storefrontRouter.get('/faqs', async (_req: Request, res: Response): Promise<void> => {
  try {
    const faqs = await db.query(
      "SELECT id, category, question, answer, display_order FROM faqs WHERE audience = 'customer' AND is_active = 1 ORDER BY display_order ASC, id ASC"
    );
    res.json({ faqs });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load FAQs' });
  }
});

// Active Customer Coupons for storefront Offers & Cart pages
storefrontRouter.get('/coupons', async (_req: Request, res: Response): Promise<void> => {
  try {
    const todayDateStr = new Date().toISOString().split('T')[0];
    const coupons = await db.query(
      'SELECT id, code, discount_type, discount_value, min_order_amount, max_discount, expires_at, description FROM coupons WHERE is_active = 1 AND (expires_at IS NULL OR SUBSTR(expires_at, 1, 10) >= ?) ORDER BY min_order_amount ASC',
      [todayDateStr]
    );
    res.json({ coupons });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load coupons' });
  }
});

// Customer Contact & Enquiry Submission Endpoint
const handleContactEnquiry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, email, topic, message } = req.body;

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'Please enter your full name.' });
      return;
    }

    const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      res.status(400).json({ error: 'Please provide a valid 10-digit Indian mobile number.' });
      return;
    }

    if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    if (!message || message.trim().length < 5) {
      res.status(400).json({ error: 'Please enter your message (at least 5 characters).' });
      return;
    }

    const enquiryId = `enq-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const nowIso = new Date().toISOString();
    const cleanTopic = (topic || 'General Enquiry').trim().slice(0, 128);

    await db.execute(`
      INSERT INTO contact_enquiries (id, name, phone, email, topic, message, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'unread', ?)
    `, [
      enquiryId,
      name.trim(),
      `+91 ${cleanPhone}`,
      email ? email.trim() : null,
      cleanTopic,
      message.trim(),
      nowIso
    ]);

    // Record in audit log
    await db.execute(`
      INSERT INTO audit_logs (id, admin_username, action, resource_type, resource_id, details_json, timestamp, ip_address)
      VALUES (?, 'system', 'contact_enquiry_submitted', 'contact_enquiry', ?, ?, ?, ?)
    `, [
      `audit-enq-${Date.now()}`,
      enquiryId,
      JSON.stringify({ name: name.trim(), phone: `+91 ${cleanPhone}`, topic: cleanTopic }),
      nowIso,
      req.ip || 'storefront'
    ]);

    console.log(`[CONTACT ENQUIRY] Received enquiry ${enquiryId} from ${name.trim()} (+91 ${cleanPhone}): "${cleanTopic}"`);

    res.json({
      success: true,
      enquiryId,
      message: 'Thank you for contacting BeautyDoor. Our client support team led by Preeti Singh will respond within 2 business hours.'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to submit contact enquiry' });
  }
};

storefrontRouter.post('/contact', handleContactEnquiry);
storefrontRouter.post('/enquiries', handleContactEnquiry);
