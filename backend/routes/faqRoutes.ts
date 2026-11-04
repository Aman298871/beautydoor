import { Router, Request, Response } from 'express';
import { db } from '../db/database.ts';
import { requireAdminAuth } from '../middleware/auth.ts';

export const faqRouter = Router();

// In-memory rate limiter: Max 60 queries per minute per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(req: Request, res: Response, next: () => void): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const limitData = rateLimitMap.get(ip);

  if (!limitData || now > limitData.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    return next();
  }

  if (limitData.count >= 60) {
    res.status(429).json({
      error: 'Too many queries. Please pause for a moment before asking another question.',
      fallback: true
    });
    return;
  }

  limitData.count++;
  next();
}

// Helper: fetch setting value
function getSetting(key: string, defaultVal: string = ''): string {
  try {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
    return row ? row.value : defaultVal;
  } catch {
    return defaultVal;
  }
}

// Dynamic Answer Generator
export function generateDynamicAnswer(handler: string | null, staticAnswer: string): string {
  if (!handler) return staticAnswer;

  try {
    switch (handler) {
      case 'get_services_catalog': {
        const categories = db.prepare('SELECT id, name, description FROM categories WHERE is_active = 1 ORDER BY display_order ASC').all() as any[];
        const totalServices = (db.prepare('SELECT COUNT(*) as count FROM services WHERE is_active = 1').get() as any).count;
        
        let reply = `BeautyDoor offers ${totalServices}+ salon-grade treatments in Delhi NCR, performed at your home by verified female specialists:\n\n`;
        for (const cat of categories) {
          reply += `• ${cat.name}: ${cat.description || ''}\n`;
        }
        reply += `\nAll treatments use sealed, single-use mono-dosages and sterile disposable kits. Select any category above to view our complete menu!`;
        return reply;
      }

      case 'get_service_pricing': {
        const lowestWaxing = db.prepare(`
          SELECT MIN(selling_price) as min_p FROM services s
          JOIN categories c ON s.category_id = c.id
          WHERE c.slug = 'waxing' AND s.is_active = 1
        `).get() as any;

        const lowestFacial = db.prepare(`
          SELECT MIN(selling_price) as min_p FROM services s
          JOIN categories c ON s.category_id = c.id
          WHERE c.slug = 'facial' AND s.is_active = 1
        `).get() as any;

        const lowestManiPedi = db.prepare(`
          SELECT MIN(selling_price) as min_p FROM services s
          JOIN categories c ON s.category_id = c.id
          WHERE c.slug = 'mani-pedi' AND s.is_active = 1
        `).get() as any;

        const lowestDeTan = db.prepare(`
          SELECT MIN(selling_price) as min_p FROM services s
          JOIN categories c ON s.category_id = c.id
          WHERE c.slug = 'de-tan' AND s.is_active = 1
        `).get() as any;

        const lowestMassage = db.prepare(`
          SELECT MIN(selling_price) as min_p FROM services s
          JOIN categories c ON s.category_id = c.id
          WHERE c.slug = 'massage' AND s.is_active = 1
        `).get() as any;

        const minOrder = getSetting('min_order_amount', '499');

        let reply = `💰 Transparent BeautyDoor Pricing (No hidden travel or kit fees):\n\n`;
        reply += `• Waxing Rituals: from ₹${lowestWaxing?.min_p || 199}\n`;
        reply += `• Facials & Cleanups: from ₹${lowestFacial?.min_p || 699}\n`;
        reply += `• Manicure & Pedicure: from ₹${lowestManiPedi?.min_p || 499}\n`;
        reply += `• De-Tan & Bleach: from ₹${lowestDeTan?.min_p || 299}\n`;
        reply += `• Body Massage & Spas: from ₹${lowestMassage?.min_p || 899}\n\n`;
        reply += `Minimum order value for doorstep delivery is ₹${minOrder}. Genuine products and disposable setup included with every visit!`;
        return reply;
      }

      case 'get_service_areas': {
        const territories = db.prepare('SELECT city, area_name, min_order_amount FROM territories WHERE is_active = 1 ORDER BY city ASC').all() as any[];
        let reply = `📍 BeautyDoor Serviceable Locations in Delhi NCR:\n\n`;
        
        const cityMap: Record<string, string[]> = {};
        for (const t of territories) {
          if (!cityMap[t.city]) cityMap[t.city] = [];
          cityMap[t.city].push(t.area_name);
        }

        for (const [city, zones] of Object.entries(cityMap)) {
          reply += `• ${city}: ${zones.join(', ')}\n`;
        }

        reply += `\nOur background-verified specialists arrive directly at your home with complete salon equipment. Enter your address in the top bar or cart to verify immediate slot availability.`;
        return reply;
      }

      case 'get_payment_methods': {
        const razorpayEnabled = getSetting('razorpay_enabled', 'true') === 'true';
        let reply = `💳 Flexible & Secure Payment Methods:\n\n`;
        reply += `1. Cash After Service (Cash on Delivery):\nPay in cash only after your treatment is complete and you are 100% satisfied.\n\n`;
        if (razorpayEnabled) {
          reply += `2. Online Payment:\nPay securely via UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, or Netbanking powered by Razorpay. You can pay during checkout or after service completion.\n\n`;
        }
        reply += `No advance payment required for regular appointments!`;
        return reply;
      }

      case 'get_cancellation_policy': {
        const hours = getSetting('cancellation_window_hours', '4');
        const policy = getSetting('cancellation_policy', 'Complimentary cancellation up to 4 hours prior to appointment.');
        return `🔄 Cancellation & Rescheduling Policy:\n\n• ${policy}\n• You can cancel or reschedule for free up to ${hours} hours before your scheduled arrival time.\n• Go to "My Bookings" in your account or message our Concierge Helpline on WhatsApp.\n• If you paid online, 100% refund is initiated instantly upon cancellation to your original payment mode.`;
      }

      case 'get_active_offers': {
        const now = new Date().toISOString();
        const campaigns = db.prepare(`
          SELECT title, banner_title, discount_type, discount_val, badge_text 
          FROM campaigns 
          WHERE is_published = 1 AND datetime(?) BETWEEN datetime(start_time) AND datetime(end_time)
          ORDER BY display_order ASC
        `).all(now) as any[];

        const coupons = db.prepare(`
          SELECT code, description, discount_type, discount_value, min_order_amount 
          FROM coupons 
          WHERE is_active = 1 AND (expires_at IS NULL OR datetime(expires_at) >= datetime(?))
        `).all(now) as any[];

        let reply = `🎁 Current BeautyDoor Offers & Savings Today:\n\n`;

        if (campaigns.length > 0) {
          reply += `Featured Deals:\n`;
          for (const c of campaigns) {
            const disc = c.discount_type === 'percentage' ? `${c.discount_val}% OFF` : `₹${c.discount_val} OFF`;
            reply += `• ${c.title} — ${disc} (${c.badge_text || 'Limited Time'})\n`;
          }
          reply += `\n`;
        }

        if (coupons.length > 0) {
          reply += `Active Coupon Codes:\n`;
          for (const cp of coupons) {
            const val = cp.discount_type === 'percentage' ? `${cp.discount_value}% OFF` : `₹${cp.discount_value} OFF`;
            reply += `• Code "${cp.code}": ${val} (Min order: ₹${cp.min_order_amount})\n`;
          }
          reply += `\n`;
        }

        if (campaigns.length === 0 && coupons.length === 0) {
          reply += `• First Booking Special: Use code "WELCOME100" at checkout for instant ₹100 off!\n`;
        }

        reply += `Apply coupons at checkout or check "Today's Deals" on our homepage.`;
        return reply;
      }

      case 'get_support_contact': {
        const phone = getSetting('contact_phone', '+91 99991 23456');
        const whatsapp = getSetting('support_whatsapp', '+91 99991 23456');
        const email = getSetting('contact_email', 'concierge@beautydoor.in');
        const start = getSetting('working_hours_start', '08:00 AM');
        const end = getSetting('working_hours_end', '08:00 PM');

        return `📞 BeautyDoor Customer Concierge & Support:\n\n• WhatsApp Chat: ${whatsapp} (Quickest assistance)\n• Helpline Phone: ${phone}\n• Email: ${email}\n• Working Hours: ${start} – ${end} (7 days a week)\n\nFeel free to tap the WhatsApp or Call button below to reach our concierge directly.`;
      }

      default:
        return staticAnswer;
    }
  } catch (err) {
    console.error('Error generating dynamic answer:', err);
    return staticAnswer;
  }
}

// Normalizer for keyword matching
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Intent Matcher for Customer queries
function matchCustomerIntent(query: string, faqs: any[]): any | null {
  const norm = normalizeText(query);
  if (!norm) return null;

  // 1. High-confidence Domain & Hinglish Intent Triggers
  if (/offer|discount|coupon|deal|promo|sasta|chhoot|kya offer|offers/.test(norm)) {
    const f = faqs.find(q => q.id === 'faq-cust-current-offers');
    if (f) return f;
  }
  if (/delhi|noida|gurgaon|gurugram|ghaziabad|faridabad|greater noida|area|location|kahan|pincode|serviceable/.test(norm)) {
    const f = faqs.find(q => q.id === 'faq-cust-serviceable-areas');
    if (f) return f;
  }
  if (/ghar|doorstep|home service|aate ho|home visit|ghar pe|ghar par|visit home|come home/.test(norm)) {
    const f = faqs.find(q => q.id === 'faq-cust-at-home-service');
    if (f) return f;
  }
  if (/price|pricing|rate|charges|cost|paise kitne|kitna kharcha|kitna lagega|rate card|facial price|waxing price|kitne ka/.test(norm)) {
    const f = faqs.find(q => q.id === 'faq-cust-service-prices');
    if (f) return f;
  }
  if (/cod|cash|pay|payment|upi|gpay|phonepe|card|paise kaise|pay after service|cash available/.test(norm)) {
    const f = faqs.find(q => q.id === 'faq-cust-payment-methods');
    if (f) return f;
  }
  if (/cancel|cancellation|refund|wapas|booking hatana|cancel kaise|cancel order|cancel booking/.test(norm)) {
    const f = faqs.find(q => q.id === 'faq-cust-cancel-booking');
    if (f) return f;
  }
  if (/reschedule|change time|change date|postpone|timing badalna|slot change|time badalna/.test(norm)) {
    const f = faqs.find(q => q.id === 'faq-cust-reschedule-booking');
    if (f) return f;
  }
  if (/track|tracking|status|kahan hai|kab aayegi|specialist kahan|booking status/.test(norm)) {
    const f = faqs.find(q => q.id === 'faq-cust-track-booking');
    if (f) return f;
  }
  if (/how to book|kaise book|appointment|slot book|book service|order kaise|booking kaise/.test(norm)) {
    const f = faqs.find(q => q.id === 'faq-cust-how-to-book');
    if (f) return f;
  }
  if (/support|contact|help|helpline|care number|customer care|whatsapp|phone number|call|baat karni/.test(norm)) {
    const f = faqs.find(q => q.id === 'faq-cust-contact-support');
    if (f) return f;
  }
  if (/services|what services|kya kya service|menu|treatments|facial|waxing|pedicure|manicure/.test(norm)) {
    const f = faqs.find(q => q.id === 'faq-cust-services-offered');
    if (f) return f;
  }

  // 2. Exact or Substring match on Question Text or Database Keyword Aliases (for custom Admin-added FAQs)
  let bestMatch: any = null;
  let highestScore = 0;

  for (const faq of faqs) {
    let score = 0;
    const qNorm = normalizeText(faq.question);

    if (norm === qNorm) {
      score += 100;
    } else if (norm.includes(qNorm) || qNorm.includes(norm)) {
      score += 50;
    }

    let keywords: string[] = [];
    try {
      keywords = JSON.parse(faq.keywords_json || '[]');
    } catch {
      keywords = [];
    }

    for (const kw of keywords) {
      const kwNorm = normalizeText(kw);
      if (!kwNorm) continue;

      if (norm === kwNorm) {
        score += 80;
      } else if (norm.includes(kwNorm)) {
        score += 40;
      } else if (kwNorm.includes(norm) && norm.length >= 4) {
        score += 20;
      } else {
        const normTokens = norm.split(' ');
        const kwTokens = kwNorm.split(' ');
        const overlap = normTokens.filter(t => t.length > 2 && kwTokens.includes(t));
        if (overlap.length > 0) {
          score += overlap.length * 10;
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = faq;
    }
  }

  if (highestScore >= 30) {
    return bestMatch;
  }

  return null;
}

// ---------------------------------------------------------------------------
// 1. CUSTOMER CHATBOT ENDPOINTS (beautydoor.in)
// ---------------------------------------------------------------------------

// GET /api/faq/customer - Fetch active customer predefined questions & welcome metadata
faqRouter.get('/customer', (req: Request, res: Response): void => {
  try {
    const questions = db.prepare(`
      SELECT id, category, question, display_order, is_dynamic
      FROM faqs
      WHERE audience = 'customer' AND is_active = 1
      ORDER BY display_order ASC
    `).all();

    const supportPhone = getSetting('contact_phone', '+91 99991 23456');
    const supportWhatsapp = getSetting('support_whatsapp', '+91 99991 23456');

    res.json({
      welcomeMessage: "Hi! Welcome to BeautyDoor ❤️ How can I help you today?",
      questions,
      support: {
        phone: supportPhone,
        whatsapp: supportWhatsapp,
        cleanWhatsapp: supportWhatsapp.replace(/[^\d+]/g, '')
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load FAQs' });
  }
});

// POST /api/faq/customer/query - Handle question click or typed natural query
faqRouter.post('/customer/query', checkRateLimit, (req: Request, res: Response): void => {
  try {
    const { questionId, query } = req.body;

    const allCustomerFaqs = db.prepare(`
      SELECT * FROM faqs
      WHERE audience = 'customer' AND is_active = 1
      ORDER BY display_order ASC
    `).all() as any[];

    // 1. Direct Predefined Question Selection
    if (questionId) {
      const selected = allCustomerFaqs.find(f => f.id === questionId);
      if (!selected) {
        res.status(404).json({
          error: 'Question not found',
          fallbackMessage: "Sorry, I couldn't find an answer to that question. Please select one of the options below or contact our support team."
        });
        return;
      }

      const answer = generateDynamicAnswer(selected.dynamic_handler, selected.answer);
      res.json({
        matched: true,
        faq: {
          id: selected.id,
          question: selected.question,
          category: selected.category,
          answer
        }
      });
      return;
    }

    // 2. Typed natural query matching
    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'Question query text is required' });
      return;
    }

    const matchedFaq = matchCustomerIntent(query.trim(), allCustomerFaqs);

    if (matchedFaq) {
      const answer = generateDynamicAnswer(matchedFaq.dynamic_handler, matchedFaq.answer);
      res.json({
        matched: true,
        faq: {
          id: matchedFaq.id,
          question: matchedFaq.question,
          category: matchedFaq.category,
          answer
        }
      });
      return;
    }

    // Fallback response required by specification
    const fallbackMessage = "Sorry, I couldn't find an answer to that question. Please select one of the options below or contact our support team.";
    
    // Provide top 4 suggested options
    const suggestedOptions = allCustomerFaqs.slice(0, 4).map(f => ({
      id: f.id,
      question: f.question
    }));

    res.json({
      matched: false,
      fallbackMessage,
      suggestedOptions,
      contactSupport: {
        phone: getSetting('contact_phone', '+91 99991 23456'),
        whatsapp: getSetting('support_whatsapp', '+91 99991 23456')
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process question query' });
  }
});

// ---------------------------------------------------------------------------
// 2. ADMIN CHATBOT ENDPOINTS (admin.beautydoor.in - Protected)
// ---------------------------------------------------------------------------

// GET /api/faq/admin - Fetch active admin help questions (Requires Admin Auth)
faqRouter.get('/admin', requireAdminAuth, (req: Request, res: Response): void => {
  try {
    const questions = db.prepare(`
      SELECT id, category, question, display_order
      FROM faqs
      WHERE audience = 'admin' AND is_active = 1
      ORDER BY display_order ASC
    `).all();

    res.json({
      welcomeMessage: "Welcome to BeautyDoor Admin Help. What would you like assistance with?",
      questions
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load Admin FAQs' });
  }
});

// POST /api/faq/admin/query - Query admin help questions (Requires Admin Auth)
faqRouter.post('/admin/query', requireAdminAuth, (req: Request, res: Response): void => {
  try {
    const { questionId, query } = req.body;

    const allAdminFaqs = db.prepare(`
      SELECT * FROM faqs
      WHERE audience = 'admin' AND is_active = 1
      ORDER BY display_order ASC
    `).all() as any[];

    if (questionId) {
      const selected = allAdminFaqs.find(f => f.id === questionId);
      if (!selected) {
        res.status(404).json({ error: 'Help guide not found' });
        return;
      }
      res.json({
        matched: true,
        faq: {
          id: selected.id,
          question: selected.question,
          category: selected.category,
          answer: selected.answer
        }
      });
      return;
    }

    if (!query || typeof query !== 'string' || !query.trim()) {
      res.status(400).json({ error: 'Search text is required' });
      return;
    }

    const norm = normalizeText(query);
    let matched: any = null;

    for (const faq of allAdminFaqs) {
      const qNorm = normalizeText(faq.question);
      if (norm.includes(qNorm) || qNorm.includes(norm)) {
        matched = faq;
        break;
      }
      let kwList: string[] = [];
      try {
        kwList = JSON.parse(faq.keywords_json || '[]');
      } catch {
        kwList = [];
      }
      if (kwList.some(kw => norm.includes(normalizeText(kw)) || normalizeText(kw).includes(norm))) {
        matched = faq;
        break;
      }
    }

    if (matched) {
      res.json({
        matched: true,
        faq: {
          id: matched.id,
          question: matched.question,
          category: matched.category,
          answer: matched.answer
        }
      });
      return;
    }

    res.json({
      matched: false,
      fallbackMessage: "No specific admin guide matched your search. Select a help category or step-by-step topic below:",
      suggestedOptions: allAdminFaqs.slice(0, 5).map(f => ({ id: f.id, question: f.question }))
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to process admin help query' });
  }
});

// ---------------------------------------------------------------------------
// 3. ADMIN FAQ MANAGEMENT (CRUD Endpoints - Requires Admin Auth)
// ---------------------------------------------------------------------------

// GET /api/admin/faqs - List all FAQs (both customer & admin, filterable)
faqRouter.get('/manage', requireAdminAuth, (req: Request, res: Response): void => {
  try {
    const audience = req.query.audience as string | undefined;
    let query = 'SELECT * FROM faqs';
    const params: any[] = [];

    if (audience && (audience === 'customer' || audience === 'admin')) {
      query += ' WHERE audience = ?';
      params.push(audience);
    }

    query += ' ORDER BY audience ASC, display_order ASC';
    const faqs = db.prepare(query).all(...params);

    res.json({ faqs });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load FAQ management records' });
  }
});

// POST /api/admin/faqs - Create a new FAQ record
faqRouter.post('/manage', requireAdminAuth, (req: Request, res: Response): void => {
  try {
    const { audience, category, question, answer, keywords, display_order, is_active, is_dynamic, dynamic_handler } = req.body;

    if (!audience || !['customer', 'admin'].includes(audience)) {
      res.status(400).json({ error: "Audience must be 'customer' or 'admin'" });
      return;
    }
    if (!question || !question.trim()) {
      res.status(400).json({ error: 'Question is required' });
      return;
    }
    if (!answer || !answer.trim()) {
      res.status(400).json({ error: 'Answer is required' });
      return;
    }

    const id = `faq-${audience}-${Date.now()}`;
    const now = new Date().toISOString();
    const keywordsJson = Array.isArray(keywords) ? JSON.stringify(keywords) : (typeof keywords === 'string' ? JSON.stringify(keywords.split(',').map((k: string) => k.trim()).filter(Boolean)) : '[]');

    db.prepare(`
      INSERT INTO faqs (
        id, audience, category, question, answer, keywords_json,
        display_order, is_active, is_dynamic, dynamic_handler, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, audience, category || 'General', question.trim(), answer.trim(), keywordsJson,
      Number(display_order) || 0, is_active !== false && is_active !== 0 ? 1 : 0,
      is_dynamic ? 1 : 0, dynamic_handler || null, now, now
    );

    res.status(201).json({ success: true, id, message: 'FAQ created successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create FAQ: ' + err.message });
  }
});

// PUT /api/admin/faqs/:id - Update an existing FAQ record
faqRouter.put('/manage/:id', requireAdminAuth, (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { category, question, answer, keywords, display_order, is_active, is_dynamic, dynamic_handler } = req.body;

    const existing = db.prepare('SELECT id FROM faqs WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ error: 'FAQ record not found' });
      return;
    }

    const now = new Date().toISOString();
    let keywordsJson = undefined;
    if (keywords !== undefined) {
      keywordsJson = Array.isArray(keywords)
        ? JSON.stringify(keywords)
        : (typeof keywords === 'string' ? JSON.stringify(keywords.split(',').map((k: string) => k.trim()).filter(Boolean)) : '[]');
    }

    db.prepare(`
      UPDATE faqs SET
        category = COALESCE(?, category),
        question = COALESCE(?, question),
        answer = COALESCE(?, answer),
        keywords_json = COALESCE(?, keywords_json),
        display_order = COALESCE(?, display_order),
        is_active = COALESCE(?, is_active),
        is_dynamic = COALESCE(?, is_dynamic),
        dynamic_handler = COALESCE(?, dynamic_handler),
        updated_at = ?
      WHERE id = ?
    `).run(
      category, question, answer, keywordsJson,
      display_order !== undefined ? Number(display_order) : null,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      is_dynamic !== undefined ? (is_dynamic ? 1 : 0) : null,
      dynamic_handler !== undefined ? dynamic_handler : null,
      now, id
    );

    res.json({ success: true, message: 'FAQ updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update FAQ: ' + err.message });
  }
});

// DELETE /api/admin/faqs/:id - Delete an FAQ record
faqRouter.delete('/manage/:id', requireAdminAuth, (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM faqs WHERE id = ?').run(id);
    res.json({ success: true, message: 'FAQ deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete FAQ: ' + err.message });
  }
});
