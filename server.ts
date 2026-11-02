import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db, Booking, ServiceItem, Beautician, Coupon } from './src/server/dataStore.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // 1. Catalog & Settings
  app.get('/api/catalog', (_req: Request, res: Response) => {
    res.json({
      categories: db.getCategories(),
      services: db.getServices().filter(s => s.isActive),
      settings: db.getSettings()
    });
  });

  // 2. Territories & Pincode check
  app.get('/api/territories', (_req: Request, res: Response) => {
    res.json({ territories: db.getTerritories() });
  });

  app.post('/api/check-pincode', (req: Request, res: Response) => {
    const { pincode } = req.body;
    if (!pincode || typeof pincode !== 'string') {
      res.status(400).json({ error: 'Valid 6-digit pincode required' });
      return;
    }
    const cleanPincode = pincode.trim();
    const territory = db.getTerritories().find(t => t.pincode === cleanPincode && t.isActive);

    if (territory) {
      res.json({
        isServiceable: true,
        territory,
        message: `Great news! We deliver premium beauty services to ${territory.areaName}, ${territory.city}.`
      });
    } else {
      res.json({
        isServiceable: false,
        territory: null,
        message: `Pincode ${cleanPincode} is currently outside our immediate active zones in Delhi NCR. We are expanding soon!`
      });
    }
  });

  // 3. Available Appointment Slots
  app.get('/api/slots', (req: Request, res: Response) => {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const pincode = req.query.pincode as string;

    const allSlots = [
      '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
      '05:00 PM', '06:00 PM', '07:00 PM'
    ];

    // Find bookings on that date
    const existingBookings = db.getBookings().filter(
      b => b.appointmentDate === date && b.bookingStatus !== 'cancelled'
    );

    // If pincode is passed, count bookings
    const bookedCounts: Record<string, number> = {};
    existingBookings.forEach(b => {
      bookedCounts[b.appointmentSlot] = (bookedCounts[b.appointmentSlot] || 0) + 1;
    });

    // We have 6 beauticians in Delhi NCR; slot is full if >= 4 bookings in that slot across territory
    const availableSlots = allSlots.filter(s => (bookedCounts[s] || 0) < 4);

    res.json({
      date,
      allSlots,
      availableSlots,
      bookedCounts
    });
  });

  // 4. Calculate Price & Package Bundles
  app.post('/api/calculate-price', (req: Request, res: Response) => {
    const { items, couponCode, pincode } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'At least one service is required' });
      return;
    }

    const allServices = db.getServices();
    let subtotal = 0;
    const validatedItems = [];

    for (const it of items) {
      const srv = allServices.find(s => s.id === it.serviceId);
      if (!srv) continue;

      let itemPrice = srv.sellingPrice;
      let varName: string | undefined = undefined;
      let itemDuration = srv.durationMins;

      // Variant check
      if (it.variantId) {
        const variant = srv.variants?.find(v => v.id === it.variantId);
        if (variant) {
          itemPrice += variant.priceDelta;
          itemDuration += variant.durationDelta;
          varName = variant.name;
        }
      }

      // Addons check
      const addedAddonNames: string[] = [];
      if (Array.isArray(it.addonIds)) {
        for (const addId of it.addonIds) {
          const add = srv.addons?.find(a => a.id === addId);
          if (add) {
            itemPrice += add.price;
            itemDuration += add.durationMins;
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
        unitPrice: srv.sellingPrice,
        finalItemPrice: itemPrice,
        durationMins: itemDuration
      });
    }

    // Tiered package bundle discount:
    // 2 items = 5%, 3 items = 10%, 4+ items = 15%
    let packageDiscount = 0;
    let bundleDiscountPercent = 0;
    if (validatedItems.length >= 4) {
      bundleDiscountPercent = 15;
    } else if (validatedItems.length === 3) {
      bundleDiscountPercent = 10;
    } else if (validatedItems.length === 2) {
      bundleDiscountPercent = 5;
    }
    if (bundleDiscountPercent > 0) {
      packageDiscount = Math.round((subtotal * bundleDiscountPercent) / 100);
    }

    // Coupon discount check
    let couponDiscount = 0;
    let appliedCoupon: Coupon | null = null;
    if (couponCode && typeof couponCode === 'string') {
      const cleanCode = couponCode.trim().toUpperCase();
      const cp = db.getCoupons().find(c => c.code === cleanCode && c.isActive);
      if (cp) {
        const amountAfterBundle = subtotal - packageDiscount;
        if (amountAfterBundle >= cp.minOrderAmount) {
          if (cp.discountType === 'percentage') {
            const rawDiscount = Math.round((amountAfterBundle * cp.discountValue) / 100);
            couponDiscount = Math.min(rawDiscount, cp.maxDiscount);
          } else {
            couponDiscount = Math.min(cp.discountValue, amountAfterBundle);
          }
          appliedCoupon = cp;
        }
      }
    }

    // Delivery / Convenience fee check
    let deliveryFee = 0;
    if (pincode) {
      const territory = db.getTerritories().find(t => t.pincode === pincode.trim());
      if (territory) {
        deliveryFee = territory.deliveryFee;
      }
    }

    const totalPayable = Math.max(0, subtotal - packageDiscount - couponDiscount + deliveryFee);

    res.json({
      items: validatedItems,
      itemCount: validatedItems.length,
      subtotal,
      bundleDiscountPercent,
      packageDiscount,
      couponDiscount,
      appliedCoupon: appliedCoupon ? { code: appliedCoupon.code, description: appliedCoupon.description } : null,
      deliveryFee,
      totalPayable
    });
  });

  // 5. Create Booking
  app.post('/api/bookings', (req: Request, res: Response) => {
    const {
      customerName,
      customerPhone,
      customerEmail,
      address,
      items,
      appointmentDate,
      appointmentSlot,
      couponCode,
      notes
    } = req.body;

    if (!customerName || !customerPhone || !address?.pincode || !address?.flat || !items?.length || !appointmentDate || !appointmentSlot) {
      res.status(400).json({ error: 'Missing required booking information' });
      return;
    }

    // Check pincode serviceability
    const cleanPincode = address.pincode.trim();
    const territory = db.getTerritories().find(t => t.pincode === cleanPincode && t.isActive);
    if (!territory) {
      res.status(400).json({ error: `Pincode ${cleanPincode} is currently not in our active Delhi NCR coverage.` });
      return;
    }

    // Pricing calculation
    const allServices = db.getServices();
    let subtotal = 0;
    const validatedItems: Booking['items'] = [];

    for (const it of items) {
      const srv = allServices.find(s => s.id === it.serviceId);
      if (!srv) continue;
      let itemPrice = srv.sellingPrice;
      let varName: string | undefined = undefined;
      let itemDuration = srv.durationMins;

      if (it.variantId) {
        const variant = srv.variants?.find(v => v.id === it.variantId);
        if (variant) {
          itemPrice += variant.priceDelta;
          itemDuration += variant.durationDelta;
          varName = variant.name;
        }
      }

      const addedAddonNames: string[] = [];
      if (Array.isArray(it.addonIds)) {
        for (const addId of it.addonIds) {
          const add = srv.addons?.find(a => a.id === addId);
          if (add) {
            itemPrice += add.price;
            itemDuration += add.durationMins;
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
        unitPrice: srv.sellingPrice,
        finalItemPrice: itemPrice,
        durationMins: itemDuration
      });
    }

    const settings = db.getSettings();
    if (subtotal < territory.minOrderAmount) {
      res.status(400).json({
        error: `Minimum order amount for ${territory.areaName} is ₹${territory.minOrderAmount}. Current subtotal is ₹${subtotal}.`
      });
      return;
    }

    // Bundle discount
    let packageDiscount = 0;
    if (validatedItems.length >= 4) {
      packageDiscount = Math.round(subtotal * 0.15);
    } else if (validatedItems.length === 3) {
      packageDiscount = Math.round(subtotal * 0.10);
    } else if (validatedItems.length === 2) {
      packageDiscount = Math.round(subtotal * 0.05);
    }

    // Coupon
    let couponDiscount = 0;
    let validCouponCode: string | undefined = undefined;
    if (couponCode) {
      const cleanCode = couponCode.trim().toUpperCase();
      const cp = db.getCoupons().find(c => c.code === cleanCode && c.isActive);
      if (cp && (subtotal - packageDiscount) >= cp.minOrderAmount) {
        if (cp.discountType === 'percentage') {
          const raw = Math.round(((subtotal - packageDiscount) * cp.discountValue) / 100);
          couponDiscount = Math.min(raw, cp.maxDiscount);
        } else {
          couponDiscount = Math.min(cp.discountValue, subtotal - packageDiscount);
        }
        validCouponCode = cleanCode;
      }
    }

    const deliveryFee = territory.deliveryFee;
    const totalPayable = Math.max(0, subtotal - packageDiscount - couponDiscount + deliveryFee);

    // Generate unique ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingId = `BD-NCR-${randomSuffix}`;

    const newBooking: Booking = {
      id: bookingId,
      customerId: `cust-${customerPhone.replace(/\D/g, '').slice(-10)}`,
      customerName,
      customerPhone,
      customerEmail,
      address: {
        flat: address.flat,
        landmark: address.landmark,
        area: address.area || territory.areaName,
        city: territory.city,
        pincode: cleanPincode
      },
      items: validatedItems,
      subtotal,
      packageDiscount,
      couponDiscount,
      couponCode: validCouponCode,
      deliveryFee,
      totalPayable,
      appointmentDate,
      appointmentSlot,
      paymentMethod: 'COD',
      paymentStatus: 'pending',
      bookingStatus: 'pending', // Awaiting admin dispatch assignment
      internalNotes: notes || 'Booked online via BeautyDoor portal (Cash on Delivery).',
      createdAt: new Date().toISOString()
    };

    db.addBooking(newBooking);

    res.status(201).json({
      success: true,
      booking: newBooking,
      message: `Appointment reserved successfully! Booking ID: ${bookingId}. Our concierge will verify and assign your certified beautician.`
    });
  });

  // 6. Customer History & Actions
  app.get('/api/customer/bookings', (req: Request, res: Response) => {
    const phone = req.query.phone as string;
    if (!phone) {
      res.status(400).json({ error: 'Phone number parameter required' });
      return;
    }
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    const bookings = db.getBookings().filter(b => b.customerPhone.replace(/\D/g, '').slice(-10) === cleanDigits);
    res.json({ bookings });
  });

  app.post('/api/customer/cancel', (req: Request, res: Response) => {
    const { bookingId, phone, reason } = req.body;
    if (!bookingId || !phone) {
      res.status(400).json({ error: 'Booking ID and phone required' });
      return;
    }
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    const booking = db.getBookings().find(b => b.id === bookingId && b.customerPhone.replace(/\D/g, '').slice(-10) === cleanDigits);

    if (!booking) {
      res.status(404).json({ error: 'Booking not found or phone number does not match' });
      return;
    }

    if (booking.bookingStatus === 'completed' || booking.bookingStatus === 'cancelled') {
      res.status(400).json({ error: `Cannot cancel an appointment that is already ${booking.bookingStatus}.` });
      return;
    }

    const updated = db.updateBooking(bookingId, {
      bookingStatus: 'cancelled',
      internalNotes: `${booking.internalNotes || ''} | Cancelled by customer: ${reason || 'No reason provided'}`
    });

    res.json({ success: true, booking: updated, message: 'Your appointment has been cancelled without penalty.' });
  });

  app.post('/api/customer/reschedule', (req: Request, res: Response) => {
    const { bookingId, phone, newDate, newSlot } = req.body;
    if (!bookingId || !phone || !newDate || !newSlot) {
      res.status(400).json({ error: 'Booking ID, phone, new date, and new slot required' });
      return;
    }
    const cleanDigits = phone.replace(/\D/g, '').slice(-10);
    const booking = db.getBookings().find(b => b.id === bookingId && b.customerPhone.replace(/\D/g, '').slice(-10) === cleanDigits);

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const updated = db.updateBooking(bookingId, {
      appointmentDate: newDate,
      appointmentSlot: newSlot,
      internalNotes: `${booking.internalNotes || ''} | Rescheduled by customer to ${newDate} at ${newSlot}`
    });

    res.json({ success: true, booking: updated, message: `Appointment successfully rescheduled to ${newDate} at ${newSlot}.` });
  });

  // 7. Reviews
  app.get('/api/reviews', (_req: Request, res: Response) => {
    res.json({ reviews: db.getReviews().filter(r => r.isApproved) });
  });

  app.post('/api/reviews', (req: Request, res: Response) => {
    const { customerName, city, rating, comment, serviceName } = req.body;
    if (!customerName || !rating || !comment) {
      res.status(400).json({ error: 'Name, rating, and comment are required' });
      return;
    }
    const newRev = {
      id: `rev-${Date.now()}`,
      customerName,
      city: city || 'Delhi NCR',
      rating: Math.min(5, Math.max(1, Number(rating))),
      comment,
      serviceName: serviceName || 'General At-Home Service',
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      source: 'verified_customer' as const,
      isApproved: true
    };
    db.addReview(newRev);
    res.status(201).json({ success: true, review: newRev, message: 'Thank you for your valuable review!' });
  });

  // --- ADMIN PORTAL ENDPOINTS ---

  app.get('/api/admin/overview', (_req: Request, res: Response) => {
    const bookings = db.getBookings();
    const services = db.getServices();
    const beauticians = db.getBeauticians();
    const territories = db.getTerritories();

    const todayStr = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(b => b.appointmentDate === todayStr);

    let totalRevenue = 0;
    let collectedRevenue = 0;
    const statusCounts: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      assigned: 0,
      in_service: 0,
      completed: 0,
      cancelled: 0
    };

    bookings.forEach(b => {
      statusCounts[b.bookingStatus] = (statusCounts[b.bookingStatus] || 0) + 1;
      if (b.bookingStatus !== 'cancelled') {
        totalRevenue += b.totalPayable;
      }
      if (b.paymentStatus === 'collected') {
        collectedRevenue += b.totalPayable;
      }
    });

    res.json({
      totalBookings: bookings.length,
      todayBookingsCount: todayBookings.length,
      statusCounts,
      totalRevenue,
      collectedRevenue,
      activeServicesCount: services.filter(s => s.isActive).length,
      activeBeauticiansCount: beauticians.filter(b => b.isActive && b.status === 'available').length,
      activeTerritoriesCount: territories.filter(t => t.isActive).length
    });
  });

  app.get('/api/admin/bookings', (_req: Request, res: Response) => {
    res.json({ bookings: db.getBookings() });
  });

  app.patch('/api/admin/bookings/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;
    const updated = db.updateBooking(id, updates);
    if (!updated) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }
    res.json({ success: true, booking: updated });
  });

  // Admin Catalog Management
  app.get('/api/admin/services', (_req: Request, res: Response) => {
    res.json({ services: db.getServices() });
  });

  app.post('/api/admin/services', (req: Request, res: Response) => {
    const service: ServiceItem = {
      ...req.body,
      id: req.body.id || `srv-${Date.now()}`
    };
    const created = db.addService(service);
    res.status(201).json({ success: true, service: created });
  });

  app.put('/api/admin/services/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = db.updateService(id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    res.json({ success: true, service: updated });
  });

  app.delete('/api/admin/services/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = db.deleteService(id);
    if (!deleted) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    res.json({ success: true, deleted });
  });

  app.patch('/api/admin/categories/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;
    const updated = db.toggleCategory(id, !!isActive);
    res.json({ success: true, category: updated });
  });

  // Admin Beauticians & Staff
  app.get('/api/admin/beauticians', (_req: Request, res: Response) => {
    res.json({ beauticians: db.getBeauticians() });
  });

  app.post('/api/admin/beauticians', (req: Request, res: Response) => {
    const beautician: Beautician = {
      ...req.body,
      id: req.body.id || `beau-${Date.now()}`
    };
    const created = db.addBeautician(beautician);
    res.status(201).json({ success: true, beautician: created });
  });

  app.patch('/api/admin/beauticians/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = db.updateBeautician(id, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Beautician not found' });
      return;
    }
    res.json({ success: true, beautician: updated });
  });

  // Admin Territories
  app.patch('/api/admin/territories/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = db.updateTerritory(id, req.body);
    res.json({ success: true, territory: updated });
  });

  // Admin Coupons
  app.get('/api/admin/coupons', (_req: Request, res: Response) => {
    res.json({ coupons: db.getCoupons() });
  });

  app.post('/api/admin/coupons', (req: Request, res: Response) => {
    const coupon: Coupon = {
      ...req.body,
      id: req.body.id || `coup-${Date.now()}`
    };
    const created = db.addCoupon(coupon);
    res.status(201).json({ success: true, coupon: created });
  });

  app.patch('/api/admin/coupons/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = db.toggleCoupon(id, !!req.body.isActive);
    res.json({ success: true, coupon: updated });
  });

  // Admin Settings
  app.get('/api/admin/settings', (_req: Request, res: Response) => {
    res.json({ settings: db.getSettings() });
  });

  app.patch('/api/admin/settings', (req: Request, res: Response) => {
    const updated = db.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  });

  // --- VITE MIDDLEWARE INTEGRATION ---
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ BeautyDoor Server listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start BeautyDoor server:', err);
});
