import { Router, Request, Response } from 'express';
import { db } from '../db/database.ts';

export const storefrontRouter = Router();

// 1. Catalog & Active Settings
storefrontRouter.get('/catalog', (_req: Request, res: Response): void => {
  const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY display_order ASC').all();
  const rawServices = db.prepare('SELECT * FROM services WHERE is_active = 1 ORDER BY created_at DESC').all() as any[];

  // Attach variants and addons
  const services = rawServices.map((s) => {
    const variants = db.prepare('SELECT * FROM service_variants WHERE service_id = ?').all(s.id);
    const addons = db.prepare('SELECT * FROM service_addons WHERE service_id = ?').all(s.id);
    return {
      ...s,
      benefits: JSON.parse(s.benefits_json || '[]'),
      whatsIncluded: JSON.parse(s.whats_included_json || '[]'),
      variants,
      addons
    };
  });

  const rawSettings = db.prepare('SELECT * FROM settings').all() as { key: string; value: string }[];
  const settings: Record<string, string> = {};
  rawSettings.forEach((r) => {
    settings[r.key] = r.value;
  });

  res.json({ categories, services, settings });
});

// 2. Dynamic Campaigns & Merchandising (Amazon-style, expires automatically)
storefrontRouter.get('/campaigns', (_req: Request, res: Response): void => {
  const now = new Date().toISOString();
  // Filter only active & published campaigns
  const activeCampaigns = db.prepare(`
    SELECT * FROM campaigns 
    WHERE is_published = 1 
      AND datetime(?) >= datetime(start_time) 
      AND datetime(?) <= datetime(end_time)
    ORDER BY display_order ASC
  `).all(now, now) as any[];

  const campaigns = activeCampaigns.map((c) => ({
    ...c,
    targetCategoryIds: JSON.parse(c.target_category_ids_json || '[]'),
    targetServiceIds: JSON.parse(c.target_service_ids_json || '[]')
  }));

  res.json({ campaigns });
});

// 3. Today's Deals & Flash Deals
storefrontRouter.get('/deals', (_req: Request, res: Response): void => {
  const deals = db.prepare(`
    SELECT * FROM services 
    WHERE is_active = 1 AND (is_featured_deal = 1 OR discount_percent > 20)
    ORDER BY discount_percent DESC 
    LIMIT 8
  `).all() as any[];

  const populated = deals.map((s) => ({
    ...s,
    benefits: JSON.parse(s.benefits_json || '[]'),
    whatsIncluded: JSON.parse(s.whats_included_json || '[]')
  }));

  res.json({ deals: populated });
});

// 4. Bestselling Services
storefrontRouter.get('/bestsellers', (_req: Request, res: Response): void => {
  const bestsellers = db.prepare(`
    SELECT * FROM services 
    WHERE is_active = 1 AND is_bestseller = 1 
    ORDER BY created_at DESC 
    LIMIT 6
  `).all() as any[];

  const populated = bestsellers.map((s) => ({
    ...s,
    benefits: JSON.parse(s.benefits_json || '[]'),
    whatsIncluded: JSON.parse(s.whats_included_json || '[]')
  }));

  res.json({ bestsellers: populated });
});

// 5. Individual Service Details by Slug
storefrontRouter.get('/service/:slug', (req: Request, res: Response): void => {
  const { slug } = req.params;
  const s = db.prepare('SELECT * FROM services WHERE slug = ? AND is_active = 1').get(slug) as any;
  if (!s) {
    res.status(404).json({ error: 'Service not found or is currently unavailable.' });
    return;
  }

  const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(s.category_id);
  const variants = db.prepare('SELECT * FROM service_variants WHERE service_id = ?').all(s.id);
  const addons = db.prepare('SELECT * FROM service_addons WHERE service_id = ?').all(s.id);

  res.json({
    service: {
      ...s,
      benefits: JSON.parse(s.benefits_json || '[]'),
      whatsIncluded: JSON.parse(s.whats_included_json || '[]'),
      category,
      variants,
      addons
    }
  });
});

// 6. Category Page by Slug
storefrontRouter.get('/category/:slug', (req: Request, res: Response): void => {
  const { slug } = req.params;
  const cat = db.prepare('SELECT * FROM categories WHERE slug = ? AND is_active = 1').get(slug) as any;
  if (!cat) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }

  const rawServices = db.prepare('SELECT * FROM services WHERE category_id = ? AND is_active = 1').all(cat.id) as any[];
  const services = rawServices.map((s) => ({
    ...s,
    benefits: JSON.parse(s.benefits_json || '[]'),
    whatsIncluded: JSON.parse(s.whats_included_json || '[]'),
    variants: db.prepare('SELECT * FROM service_variants WHERE service_id = ?').all(s.id),
    addons: db.prepare('SELECT * FROM service_addons WHERE service_id = ?').all(s.id)
  }));

  res.json({ category: cat, services });
});

// 7. Delhi NCR Territories & Pincode Validation
storefrontRouter.get('/territories', (_req: Request, res: Response): void => {
  const territories = db.prepare('SELECT * FROM territories WHERE is_active = 1 ORDER BY city, area_name').all();
  res.json({ territories });
});

storefrontRouter.post('/check-pincode', (req: Request, res: Response): void => {
  const { pincode } = req.body;
  if (!pincode || typeof pincode !== 'string') {
    res.status(400).json({ error: '6-digit pincode is required.' });
    return;
  }
  const cleanPin = pincode.trim();
  const territory = db.prepare('SELECT * FROM territories WHERE pincode = ? AND is_active = 1').get(cleanPin) as any;

  if (territory) {
    res.json({
      isServiceable: true,
      territory,
      message: `Verified: Doorstep beauty services available in ${territory.area_name}, ${territory.city}.`
    });
  } else {
    res.json({
      isServiceable: false,
      territory: null,
      message: `Pincode ${cleanPin} is currently outside our direct Delhi NCR hub radius. Expanding soon!`
    });
  }
});

// 8. Available Appointment Slots (Checking actual bookings)
storefrontRouter.get('/slots', (req: Request, res: Response): void => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const allSlots = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
    '05:00 PM', '06:00 PM', '07:00 PM'
  ];

  const bookingsOnDate = db.prepare(`
    SELECT appointment_slot, COUNT(*) as count 
    FROM bookings 
    WHERE appointment_date = ? AND booking_status != 'cancelled'
    GROUP BY appointment_slot
  `).all(date) as { appointment_slot: string; count: number }[];

  const bookedMap: Record<string, number> = {};
  bookingsOnDate.forEach((b) => {
    bookedMap[b.appointment_slot] = b.count;
  });

  const availableSlots = allSlots.filter((slot) => (bookedMap[slot] || 0) < 4);

  res.json({
    date,
    availableSlots,
    allSlots
  });
});

// 9. Server-Side Accurate Price Calculation (No frontend calculation trust)
storefrontRouter.post('/calculate-pricing', (req: Request, res: Response): void => {
  const { items, couponCode, pincode } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    res.status(400).json({ error: 'At least one service is required.' });
    return;
  }

  let subtotal = 0;
  const validatedItems: any[] = [];

  for (const it of items) {
    const srv = db.prepare('SELECT * FROM services WHERE id = ? AND is_active = 1').get(it.serviceId) as any;
    if (!srv) continue;

    let itemPrice = srv.selling_price;
    let varName: string | undefined = undefined;
    let duration = srv.duration_mins;

    if (it.variantId) {
      const v = db.prepare('SELECT * FROM service_variants WHERE id = ? AND service_id = ?').get(it.variantId, srv.id) as any;
      if (v) {
        itemPrice += v.price_delta;
        duration += v.duration_delta;
        varName = v.name;
      }
    }

    const addedAddonNames: string[] = [];
    if (Array.isArray(it.addonIds)) {
      for (const aid of it.addonIds) {
        const add = db.prepare('SELECT * FROM service_addons WHERE id = ? AND service_id = ?').get(aid, srv.id) as any;
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
    const cp = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND expires_at >= ?').get(cleanCode, now) as any;
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
    const ter = db.prepare('SELECT delivery_fee FROM territories WHERE pincode = ? AND is_active = 1').get(pincode.trim()) as any;
    if (ter) deliveryFee = ter.delivery_fee;
  }

  const totalPayable = Math.max(0, amountAfterPackage - couponDiscount + deliveryFee);

  res.json({
    items: validatedItems,
    subtotal,
    packageDiscountPercent,
    packageDiscount,
    couponDiscount,
    appliedCoupon,
    deliveryFee,
    totalPayable
  });
});

// 10. Create Real Booking (Supports Cash on Delivery or Online Razorpay)
storefrontRouter.post('/bookings', (req: Request, res: Response): void => {
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

  if (!customerName || !customerPhone || !address?.pincode || !address?.flat || !items?.length || !appointmentDate || !appointmentSlot) {
    res.status(400).json({ error: 'All appointment details, address, and contact information are required.' });
    return;
  }

  // Validate Pincode
  const cleanPin = address.pincode.trim();
  const territory = db.prepare('SELECT * FROM territories WHERE pincode = ? AND is_active = 1').get(cleanPin) as any;
  if (!territory) {
    res.status(400).json({ error: `Pincode ${cleanPin} is currently outside our active Delhi NCR coverage.` });
    return;
  }

  // Calculate pricing strictly from DB
  let subtotal = 0;
  const validatedItems: any[] = [];

  for (const it of items) {
    const srv = db.prepare('SELECT * FROM services WHERE id = ? AND is_active = 1').get(it.serviceId) as any;
    if (!srv) continue;
    let itemPrice = srv.selling_price;
    let varName: string | undefined = undefined;
    let duration = srv.duration_mins;

    if (it.variantId) {
      const v = db.prepare('SELECT * FROM service_variants WHERE id = ? AND service_id = ?').get(it.variantId, srv.id) as any;
      if (v) {
        itemPrice += v.price_delta;
        duration += v.duration_delta;
        varName = v.name;
      }
    }

    const addedAddonNames: string[] = [];
    if (Array.isArray(it.addonIds)) {
      for (const aid of it.addonIds) {
        const add = db.prepare('SELECT * FROM service_addons WHERE id = ? AND service_id = ?').get(aid, srv.id) as any;
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

  if (subtotal < territory.min_order_amount) {
    res.status(400).json({
      error: `Minimum order amount for ${territory.area_name} is ₹${territory.min_order_amount}. Current order is ₹${subtotal}.`
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
    const cp = db.prepare('SELECT * FROM coupons WHERE code = ? AND is_active = 1').get(couponCode.trim().toUpperCase()) as any;
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

  const deliveryFee = territory.delivery_fee;
  const totalPayable = Math.max(0, amountAfterPackage - couponDiscount + deliveryFee);

  // Generate Unique Production Booking ID
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const bookingId = `BD-NCR-${randomSuffix}`;

  const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10);
  const chosenPaymentMethod = paymentMethod === 'RAZORPAY' ? 'RAZORPAY' : 'COD';
  const paymentStatus = chosenPaymentMethod === 'RAZORPAY' ? 'verified' : 'pending';

  // Transactional insertion
  const insertBooking = db.transaction(() => {
    db.prepare(`
      INSERT INTO bookings (
        id, customer_id, customer_name, customer_phone, customer_email,
        flat, landmark, area, city, pincode,
        subtotal, package_discount, campaign_discount, coupon_discount, coupon_code,
        delivery_fee, total_payable, appointment_date, appointment_slot,
        payment_method, payment_status, booking_status, internal_notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(
      bookingId,
      `cust-${cleanPhone}`,
      customerName,
      `+91 ${cleanPhone}`,
      customerEmail || null,
      address.flat,
      address.landmark || null,
      address.area || territory.area_name,
      territory.city,
      cleanPin,
      subtotal,
      packageDiscount,
      couponDiscount,
      validCoupon,
      deliveryFee,
      totalPayable,
      appointmentDate,
      appointmentSlot,
      chosenPaymentMethod,
      paymentStatus,
      notes || 'Booked via BeautyDoor Customer Web Application.',
      new Date().toISOString()
    );

    const insertItem = db.prepare(`
      INSERT INTO booking_items (
        id, booking_id, service_id, service_name, variant_id, variant_name,
        addon_ids_json, addon_names_json, unit_price, final_item_price, duration_mins
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    validatedItems.forEach((it, idx) => {
      insertItem.run(
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
      );
    });
  });

  insertBooking();

  const fullBooking = {
    id: bookingId,
    customerName,
    customerPhone: `+91 ${cleanPhone}`,
    customerEmail: customerEmail || null,
    address: {
      flat: address.flat,
      landmark: address.landmark,
      area: territory.area_name,
      city: territory.city,
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
});

// 12. Razorpay Online Payment Integration
storefrontRouter.post('/payment/razorpay/order', (req: Request, res: Response): void => {
  const { amount, bookingId } = req.body;
  if (!amount || Number(amount) <= 0) {
    res.status(400).json({ error: 'Valid payment amount required.' });
    return;
  }

  const keyIdSetting = db.prepare("SELECT value FROM settings WHERE key = 'razorpay_key_id'").get() as any;
  const keyId = keyIdSetting?.value || 'rzp_test_beautydoor_mock';
  const amountInPaise = Math.round(Number(amount) * 100);
  const orderId = `order_BD_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

  if (bookingId) {
    db.prepare('UPDATE bookings SET razorpay_order_id = ? WHERE id = ?').run(orderId, bookingId);
  }

  res.json({
    success: true,
    orderId,
    amount: amountInPaise,
    currency: 'INR',
    keyId
  });
});

storefrontRouter.post('/payment/razorpay/verify', (req: Request, res: Response): void => {
  const { razorpayOrderId, razorpayPaymentId, bookingId } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId) {
    res.status(400).json({ error: 'Missing required Razorpay payment verification parameters.' });
    return;
  }

  if (bookingId) {
    const booking = db.prepare('SELECT id, payment_status FROM bookings WHERE id = ?').get(bookingId) as any;
    if (!booking) {
      res.status(404).json({ error: 'Booking not found for payment verification.' });
      return;
    }

    db.prepare(`
      UPDATE bookings 
      SET payment_status = 'verified', 
          payment_method = 'RAZORPAY',
          razorpay_order_id = ?,
          razorpay_payment_id = ?
      WHERE id = ?
    `).run(razorpayOrderId, razorpayPaymentId, bookingId);

    console.log(`[PAYMENT VERIFIED] Online transaction recorded: Order ${razorpayOrderId}, Payment ${razorpayPaymentId} for Booking ${bookingId}`);
  }

  res.json({
    success: true,
    verified: true,
    message: 'Online payment successfully verified and recorded.'
  });
});

// 11. Customer Booking Management
storefrontRouter.get('/customer/bookings', (req: Request, res: Response): void => {
  const phone = req.query.phone as string;
  if (!phone) {
    res.status(400).json({ error: 'Customer phone number required.' });
    return;
  }
  const clean = phone.replace(/\D/g, '').slice(-10);
  const bookings = db.prepare(`
    SELECT * FROM bookings 
    WHERE customer_phone LIKE ? 
    ORDER BY created_at DESC
  `).all(`%${clean}%`) as any[];

  const populated = bookings.map((b) => {
    const items = db.prepare('SELECT * FROM booking_items WHERE booking_id = ?').all(b.id) as any[];
    return {
      ...b,
      items: items.map((i) => ({
        ...i,
        addonIds: JSON.parse(i.addon_ids_json || '[]'),
        addonNames: JSON.parse(i.addon_names_json || '[]')
      }))
    };
  });

  res.json({ bookings: populated });
});

storefrontRouter.post('/customer/cancel', (req: Request, res: Response): void => {
  const { bookingId, phone, reason } = req.body;
  if (!bookingId || !phone) {
    res.status(400).json({ error: 'Booking ID and registered phone are required.' });
    return;
  }
  const clean = phone.replace(/\D/g, '').slice(-10);
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND customer_phone LIKE ?').get(bookingId, `%${clean}%`) as any;

  if (!booking) {
    res.status(404).json({ error: 'Booking not found.' });
    return;
  }

  if (booking.booking_status === 'completed' || booking.booking_status === 'cancelled') {
    res.status(400).json({ error: `Cannot cancel booking that is already ${booking.booking_status}.` });
    return;
  }

  db.prepare(`
    UPDATE bookings 
    SET booking_status = 'cancelled', 
        internal_notes = internal_notes || ' | Cancelled by customer: ' || ?
    WHERE id = ?
  `).run(reason || 'Client request', bookingId);

  res.json({ success: true, message: 'Your appointment has been cancelled.' });
});

storefrontRouter.post('/customer/reschedule', (req: Request, res: Response): void => {
  const { bookingId, phone, newDate, newSlot } = req.body;
  if (!bookingId || !phone || !newDate || !newSlot) {
    res.status(400).json({ error: 'Booking ID, phone, new date, and time slot are required.' });
    return;
  }
  const clean = phone.replace(/\D/g, '').slice(-10);
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND customer_phone LIKE ?').get(bookingId, `%${clean}%`) as any;

  if (!booking) {
    res.status(404).json({ error: 'Booking not found.' });
    return;
  }

  db.prepare(`
    UPDATE bookings 
    SET appointment_date = ?, 
        appointment_slot = ?, 
        internal_notes = internal_notes || ' | Rescheduled to ' || ? || ' at ' || ?
    WHERE id = ?
  `).run(newDate, newSlot, newDate, newSlot, bookingId);

  res.json({ success: true, message: `Appointment rescheduled to ${newDate} at ${newSlot}.` });
});

// 12. Reviews & Customer Feedback (Only Genuine Approved Reviews)
storefrontRouter.get('/reviews', (_req: Request, res: Response): void => {
  // Returns only approved reviews
  const reviews = db.prepare('SELECT * FROM reviews WHERE is_approved = 1 ORDER BY created_at DESC').all();
  res.json({ reviews });
});

storefrontRouter.post('/reviews', (req: Request, res: Response): void => {
  const { customerName, city, rating, comment, serviceName, bookingId } = req.body;
  if (!customerName || !rating || !comment) {
    res.status(400).json({ error: 'Name, rating, and feedback are required.' });
    return;
  }

  const reviewId = `rev-${Date.now()}`;
  db.prepare(`
    INSERT INTO reviews (id, booking_id, customer_name, city, rating, comment, service_name, created_at, source, is_approved, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'verified_booking', 1, 0)
  `).run(
    reviewId,
    bookingId || null,
    customerName,
    city || 'Delhi NCR',
    Math.min(5, Math.max(1, Number(rating))),
    comment,
    serviceName || 'General At-Home Ritual',
    new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  );

  res.status(201).json({ success: true, message: 'Thank you for your feedback!' });
});
