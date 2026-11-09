/**
 * BEAUTYDOOR CUSTOMER CHATBOT KNOWLEDGE BASE & GUIDED TREE
 * 
 * 11 Comprehensive Business Categories, Structured Subcategories,
 * Curated Predefined Questions, Authoritative Responses, and Intent Matching.
 */

export interface ChatbotOption {
  id: string;
  label: string;
  category?: string;
  subcategory?: string;
  questionId?: string;
}

export interface ChatbotAnswer {
  id: string;
  category: string;
  subcategory: string;
  question: string;
  answer: string;
  followUpQuestionIds?: string[];
  actionType?: 'book' | 'booking' | 'contact' | 'packages' | 'services';
  keywords: string[];
}

export interface ChatbotCategory {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  subcategories: {
    id: string;
    name: string;
    questionIds: string[];
  }[];
}

// 1. ALL 11 BUSINESS CATEGORIES
export const CHATBOT_CATEGORIES: ChatbotCategory[] = [
  {
    id: 'cat-services',
    name: 'Explore Services',
    tagline: 'Waxing, Facials, Mani-Pedi, Massage & Spas',
    icon: 'Sparkles',
    subcategories: [
      {
        id: 'sub-waxing',
        name: 'Waxing Rituals',
        questionIds: ['faq-wax-types', 'faq-wax-combos', 'faq-brazilian', 'faq-wax-duration']
      },
      {
        id: 'sub-facials',
        name: 'Facials & Cleanups',
        questionIds: ['faq-facial-menu', 'faq-o3-difference', 'faq-korean-glass', 'faq-cleanups']
      },
      {
        id: 'sub-mani-pedi',
        name: 'Manicure & Pedicure',
        questionIds: ['faq-mani-pedi-types', 'faq-mani-pedi-hygiene']
      },
      {
        id: 'sub-massage',
        name: 'Massage & Body Spas',
        questionIds: ['faq-massage-menu', 'faq-body-polishing']
      },
      {
        id: 'sub-threading-bleach',
        name: 'Threading, Bleach & De-Tan',
        questionIds: ['faq-threading-areas', 'faq-bleach-detan']
      }
    ]
  },
  {
    id: 'cat-recommendations',
    name: 'Service Recommendations',
    tagline: 'Personalized rituals for glow, relaxation & events',
    icon: 'Heart',
    subcategories: [
      {
        id: 'sub-rec-glow',
        name: 'Glow & Tan Removal',
        questionIds: ['faq-rec-glow', 'faq-rec-bridal']
      },
      {
        id: 'sub-rec-relax',
        name: 'Relaxation & Body Care',
        questionIds: ['faq-rec-relax', 'faq-rec-maintenance']
      },
      {
        id: 'sub-rec-custom-pkgs',
        name: 'Custom Package Guidance',
        questionIds: ['faq-rec-custom-builder', 'faq-rec-bundle-discount']
      }
    ]
  },
  {
    id: 'cat-pricing',
    name: 'Pricing & Charges',
    tagline: 'Transparent rates, minimum orders & slot fees',
    icon: 'Tag',
    subcategories: [
      {
        id: 'sub-price-rates',
        name: 'Rates & Transparency',
        questionIds: ['faq-price-rates', 'faq-price-hidden-fees']
      },
      {
        id: 'sub-price-min-order',
        name: 'Minimum Booking Amounts',
        questionIds: ['faq-min-order-city', 'faq-min-order-why']
      },
      {
        id: 'sub-price-slots',
        name: 'Appointment Slot Surcharges',
        questionIds: ['faq-slot-charges', 'faq-tax-included']
      }
    ]
  },
  {
    id: 'cat-booking',
    name: 'Book an Appointment',
    tagline: 'How to book, slots, dates & multiple rituals',
    icon: 'Calendar',
    subcategories: [
      {
        id: 'sub-book-how',
        name: 'Booking Steps',
        questionIds: ['faq-how-to-book', 'faq-book-multiple', 'faq-book-for-others']
      },
      {
        id: 'sub-book-timing',
        name: 'Timing & Advance Booking',
        questionIds: ['faq-same-day-booking', 'faq-advance-booking', 'faq-booking-confirmation']
      }
    ]
  },
  {
    id: 'cat-locations',
    name: 'Service Availability',
    tagline: 'Delhi, Gurugram, Noida, Faridabad & Ghaziabad',
    icon: 'MapPin',
    subcategories: [
      {
        id: 'sub-loc-areas',
        name: 'Covered Cities & Localities',
        questionIds: ['faq-serviceable-cities', 'faq-check-locality']
      },
      {
        id: 'sub-loc-travel',
        name: 'Travel Charges & PIN Codes',
        questionIds: ['faq-travel-charges', 'faq-no-pincode-needed']
      }
    ]
  },
  {
    id: 'cat-professionals',
    name: 'Beauty Specialists',
    tagline: 'Verified female experts, arrivals & vanity setup',
    icon: 'UserCheck',
    subcategories: [
      {
        id: 'sub-prof-verify',
        name: 'Verification & Safety',
        questionIds: ['faq-specialist-verification', 'faq-gender-specialists']
      },
      {
        id: 'sub-prof-prep',
        name: 'What to Prepare at Home',
        questionIds: ['faq-what-to-prepare', 'faq-delays-or-changes']
      }
    ]
  },
  {
    id: 'cat-hygiene',
    name: 'Hygiene & Safety',
    tagline: 'Sealed mono-dosages, sterile tools & AC room',
    icon: 'ShieldCheck',
    subcategories: [
      {
        id: 'sub-hygiene-tools',
        name: 'Sterilization & Disposables',
        questionIds: ['faq-single-use-kits', 'faq-no-double-dipping']
      },
      {
        id: 'sub-hygiene-care',
        name: 'Skin Preparation & Aftercare',
        questionIds: ['faq-before-wax-ac', 'faq-after-facial-care', 'faq-sensitive-skin']
      }
    ]
  },
  {
    id: 'cat-payments',
    name: 'Payments & Offers',
    tagline: 'Cash / UPI after service, online payment & coupons',
    icon: 'CreditCard',
    subcategories: [
      {
        id: 'sub-pay-methods',
        name: 'Payment Methods',
        questionIds: ['faq-pay-cod-upi', 'faq-online-payment']
      },
      {
        id: 'sub-pay-coupons',
        name: 'Coupons & Discounts',
        questionIds: ['faq-active-coupons', 'faq-apply-coupon']
      }
    ]
  },
  {
    id: 'cat-cancellation',
    name: 'Cancellation & Refunds',
    tagline: 'Free cancellation up to 4 hrs, rescheduling & refunds',
    icon: 'RotateCcw',
    subcategories: [
      {
        id: 'sub-cancel-policy',
        name: 'Cancellation Policy',
        questionIds: ['faq-cancel-policy', 'faq-reschedule-appointment']
      },
      {
        id: 'sub-cancel-refund',
        name: 'Refund Timeline',
        questionIds: ['faq-refund-process', 'faq-specialist-noshow']
      }
    ]
  },
  {
    id: 'cat-account',
    name: 'Account & Tech Support',
    tagline: 'OTP login, order tracking & cart assistance',
    icon: 'Smartphone',
    subcategories: [
      {
        id: 'sub-acc-login',
        name: 'Login & Profile',
        questionIds: ['faq-otp-login', 'faq-track-booking']
      },
      {
        id: 'sub-acc-trouble',
        name: 'Cart & Website Help',
        questionIds: ['faq-cart-trouble', 'faq-contact-concierge']
      }
    ]
  },
  {
    id: 'cat-after-service',
    name: 'After-Service & Feedback',
    tagline: 'Share review, report concerns & concierge assistance',
    icon: 'MessageSquare',
    subcategories: [
      {
        id: 'sub-after-feedback',
        name: 'Feedback & Ratings',
        questionIds: ['faq-share-feedback', 'faq-unhappy-resolution']
      },
      {
        id: 'sub-after-contact',
        name: 'Direct Concierge Desk',
        questionIds: ['faq-speak-with-owner']
      }
    ]
  }
];

// 2. COMPREHENSIVE KNOWLEDGE BASE OF QUESTIONS & ANSWERS
export const CHATBOT_ANSWERS: Record<string, ChatbotAnswer> = {
  // --- 1. SERVICES ---
  'faq-wax-types': {
    id: 'faq-wax-types',
    category: 'cat-services',
    subcategory: 'sub-waxing',
    question: 'What types of waxing does BeautyDoor offer?',
    answer: `BeautyDoor offers 4 specialized waxing formulations tailored to your skin sensitivity:

1. **Italian RICA Lipo-Soluble Wax**: 100% colophony-free, enriched with botanical oils for virtually pain-free extraction and smooth skin without redness.
2. **RICA Roll-On Wax**: Single-use hygienic cartridge roll-on engineered for ultra-fast, mess-free limb application.
3. **Classic Honey Wax**: Traditional warm natural sugar-honey wax that exfoliates dead skin while removing unwanted hair.
4. **Korean Botanical Wax**: Gentle low-temperature formula with Centella Asiatica & green tea extract for ultra-sensitive skin.
5. **Brazilian Peel-Off Stripless Wax**: Flexible warm hard wax reserved exclusively for intimate bikini, underarms, and delicate facial areas.`,
    followUpQuestionIds: ['faq-wax-combos', 'faq-brazilian', 'faq-before-wax-ac'],
    actionType: 'services',
    keywords: ['wax types', 'rica wax', 'honey wax', 'korean wax', 'roll on', 'waxing options', 'waxing menu', 'difference between rica and honey']
  },
  'faq-wax-combos': {
    id: 'faq-wax-combos',
    category: 'cat-services',
    subcategory: 'sub-waxing',
    question: 'Can I combine multiple waxing areas into a package?',
    answer: `Yes! We offer curated limb & full-body combinations at significant savings compared to booking individual zones:

• **Full Arms + Underarms + Full Legs**: Save up to ₹350 compared to standalone rates.
• **Full Body Waxing (Arms + Legs + Front + Back)**: Complete limb and torso waxing.
• **Full Body + Brazilian Bikini**: Complete head-to-toe hair removal with gentle stripless peel-off wax for sensitive zones.

You can also use our **"Make Your Own Package"** builder to bundle waxing with facials, cleanups, or mani-pedi to unlock up to 20% bundle discount!`,
    followUpQuestionIds: ['faq-brazilian', 'faq-rec-custom-builder', 'faq-price-rates'],
    actionType: 'packages',
    keywords: ['wax combo', 'full arms legs underarms', 'full body wax', 'combine waxing', 'waxing package']
  },
  'faq-brazilian': {
    id: 'faq-brazilian',
    category: 'cat-services',
    subcategory: 'sub-waxing',
    question: 'What is Brazilian Peel-Off Waxing and how is it done?',
    answer: `Our **Brazilian Peel-Off Waxing** is a discreet, hygienic, and highly professional intimate hair removal service performed exclusively by certified female specialists in the privacy of your home:

• **Strictly Stripless Formulation**: We apply warm, flexible peel-off wax that grips only the hair roots and not the delicate skin tissue, ensuring minimal discomfort.
• **Zero Double-Dipping**: Every dip uses a fresh disposable wooden spatula to maintain hospital-grade sterile hygiene.
• **Disposable Hygiene Drape**: A fresh sterile protective sheet is laid on your bed or recliner.
• **Soothing Chamomile Aftercare**: Soothing aloe and chamomile emulsion is applied post-wax to eliminate redness.`,
    followUpQuestionIds: ['faq-before-wax-ac', 'faq-single-use-kits', 'faq-specialist-verification'],
    actionType: 'services',
    keywords: ['brazilian wax', 'bikini wax', 'peel off wax', 'intimate wax', 'brazilian waxing kya hota hai', 'stripless wax']
  },
  'faq-wax-duration': {
    id: 'faq-wax-duration',
    category: 'cat-services',
    subcategory: 'sub-waxing',
    question: 'How long does waxing take?',
    answer: `Treatment times depend on the area:
• Underarms: ~15 mins
• Full Arms: ~25 mins
• Full Legs: ~30 mins
• Full Arms + Underarms + Full Legs: ~50 mins
• Brazilian Bikini: ~35 mins
• Full Body Waxing: ~80 to 90 mins

Our verified specialists bring quick-heating digital heaters to ensure smooth, punctual application without unnecessary delays.`,
    followUpQuestionIds: ['faq-before-wax-ac', 'faq-what-to-prepare'],
    actionType: 'services',
    keywords: ['wax duration', 'how long waxing', 'wax time', 'kitna time lagega']
  },
  'faq-facial-menu': {
    id: 'faq-facial-menu',
    category: 'cat-services',
    subcategory: 'sub-facials',
    question: 'What facials does BeautyDoor provide?',
    answer: `We provide certified professional skin ceremonies with sealed, single-use derma kits unsealed right at your vanity:

1. **O3+ Shine & Glow Facial (7 Steps)**: D-Tan micro-derma exfoliation, radiance serum, and algae peel-off mask for instant illumination.
2. **O3+ Bridal Glow / Seaweed Radiance (6 Steps)**: Deep marine oxygenation and rubberizing firming mask for bride-level radiance.
3. **FYC Korean Glass Skin Facial (7 Steps)**: Double cleanse, gentle rice polish, centella hydrator, and hydrogel glow sheet mask.
4. **Lotus White Glow & Diamond Facials (6 Steps)**: Micro-crystal diamond polishing for firming and youthful radiance.
5. **FYC Wine & Gold Facials (6 Steps)**: Antioxidant grape polyphenol and bio-gold micro-dermabrasion.
6. **Express Cleanups (4 Steps)**: Deep pore extraction and fresh fruit/aloe soothing balance.`,
    followUpQuestionIds: ['faq-o3-difference', 'faq-korean-glass', 'faq-cleanups'],
    actionType: 'services',
    keywords: ['facials', 'facial menu', 'o3 facial', 'korean facial', 'lotus facial', 'which facial', 'facial list', 'facial options']
  },
  'faq-o3-difference': {
    id: 'faq-o3-difference',
    category: 'cat-services',
    subcategory: 'sub-facials',
    question: 'What is the difference between O3+ facials?',
    answer: `Our O3+ facials are authentic, certified single-use protocols:

• **O3+ Shine & Glow (7 Steps)**: Specially formulated for dull, sun-tanned skin. Features enzymatic micro-dermabrasion, intensive whitening massage cream (15 mins), and cooling peel-off algae mask. Ideal for party readiness.
• **O3+ Bridal Glow / Seaweed (6 Steps)**: Designed for dehydrated, uneven skin and brides. Infuses active marine minerals and oxygenating ampoules with a firming rubberizing mask for long-lasting deep dermal nourishment.

Note: All O3+ kits are 100% genuine single-use sachets opened in front of you.`,
    followUpQuestionIds: ['faq-facial-menu', 'faq-rec-bridal', 'faq-after-facial-care'],
    actionType: 'services',
    keywords: ['o3 difference', 'o3 shine and glow', 'o3 bridal glow', 'o3 facial kit', 'o3 plus']
  },
  'faq-korean-glass': {
    id: 'faq-korean-glass',
    category: 'cat-services',
    subcategory: 'sub-facials',
    question: 'What is the Korean Glass Skin Facial?',
    answer: `The **Korean Glass Skin Facial** is our signature multi-step dermal radiance ceremony formulated to give skin a translucent, luminous, poreless finish:

• **Step 1**: Double Oil-to-Milk Deep Cleanse (lifts pollution without stripping).
• **Step 2**: AHA/BHA Mild Enzymatic Rice Polish (gentle buffing of surface keratosis).
• **Step 3**: Centella Asiatica Balancing Skin Hydrator.
• **Step 4**: Collagen-boosting Lymphatic Facial Massage.
• **Step 5**: Hyaluronic Acid & Niacinamide Deep Glow Ampoule.
• **Step 6**: K-Beauty Hydrogel Cooling Glow Sheet Mask (15 mins).
• **Step 7**: Ceramide Barrier Sealant & Broad-Spectrum Sun Shield.`,
    followUpQuestionIds: ['faq-facial-menu', 'faq-after-facial-care'],
    actionType: 'services',
    keywords: ['korean glass skin', 'korean facial', 'glass skin facial', 'korean glass facial kya hai']
  },
  'faq-cleanups': {
    id: 'faq-cleanups',
    category: 'cat-services',
    subcategory: 'sub-facials',
    question: 'What is included in a Cleanup vs a Facial?',
    answer: `• **Express Cleanup (30-35 mins)**: Focuses on quick pore detoxification, surface exfoliation, steam, blackhead/whitehead extraction, and a calming mask. Best for monthly maintenance between facials.
• **Full Facial (50-65 mins)**: Includes everything in a cleanup PLUS a luxurious 15-minute pressure-point face & neck massage, specialized active serums, ampoules, and specialized rubberizing/peel-off masks for targeted rejuvenation and long-lasting glow.`,
    followUpQuestionIds: ['faq-facial-menu', 'faq-rec-maintenance'],
    actionType: 'services',
    keywords: ['cleanup vs facial', 'cleanup difference', 'what is cleanup', 'cleanup kya hai']
  },
  'faq-mani-pedi-types': {
    id: 'faq-mani-pedi-types',
    category: 'cat-services',
    subcategory: 'sub-mani-pedi',
    question: 'What manicure and pedicure services are available?',
    answer: `We provide relaxing at-home hand and foot ceremonies:

• **Classic Rose Mani-Pedi**: Warm rose petal soak, nail trimming & filing, cuticle care, scrub, foot massage, and buff.
• **Korean 5-Step Mani-Pedi**: Mineral bubble bath soak, crystal salt scrub, callus smoothing, intensive moisture mask, and pressure-point reflexology massage.
• **O3+ Luxury Mani-Pedi**: Brightening and anti-tan derma kit with deep hydrating paraffin-feel cream.

All metal tools (cuticle pushers, nippers) are heat-autoclaved in sealed medical pouches, and all foot tubs use disposable plastic liners!`,
    followUpQuestionIds: ['faq-mani-pedi-hygiene', 'faq-price-rates'],
    actionType: 'services',
    keywords: ['manicure', 'pedicure', 'mani pedi', 'rose pedicure', 'korean manicure', 'foot spa']
  },
  'faq-mani-pedi-hygiene': {
    id: 'faq-mani-pedi-hygiene',
    category: 'cat-services',
    subcategory: 'sub-mani-pedi',
    question: 'How is hygiene maintained for Manicure & Pedicure at home?',
    answer: `We follow strict medical-grade hygiene protocols:
1. **Disposable Tub Liners**: We bring a single-use sterile plastic liner for your water basin or tub so your skin never touches shared plastic.
2. **Autoclaved Steel Tools**: Cuticle nippers and clippers are heat-sterilized and unsealed from protective pouches at your vanity.
3. **Single-Use Buffers & Pumice**: Nail filers and foot buffers are 100% single-client disposable.
4. **Clean Disposal**: Our specialist packs and takes all trash with her upon leaving.`,
    followUpQuestionIds: ['faq-single-use-kits', 'faq-specialist-verification'],
    actionType: 'services',
    keywords: ['pedicure hygiene', 'sterilization', 'pedicure tub liner', 'autoclave tools']
  },
  'faq-massage-menu': {
    id: 'faq-massage-menu',
    category: 'cat-services',
    subcategory: 'sub-massage',
    question: 'What massage services are offered?',
    answer: `We provide therapeutic at-home relaxation therapies performed exclusively by female therapists for female clients:

• **Full Body Swedish Relaxation Massage (60 mins)**: Long effleurage strokes, warm cold-pressed sesame/olive oils, and spine kneading to release chronic muscle tension.
• **Head & Scalp Acupressure Massage (25 mins)**: Calming herbal oil scalp massage targeting migraine points and stress relief.
• **Foot Reflexology (30 mins)**: Pressure-point massage on arches and calves to restore circulation.
• **Back & Shoulder De-stress Massage (30 mins)**: Targeted unwinding of upper back, neck, and shoulder knots.`,
    followUpQuestionIds: ['faq-body-polishing', 'faq-rec-relax'],
    actionType: 'services',
    keywords: ['massage', 'swedish massage', 'body massage', 'head massage', 'back massage', 'foot massage']
  },
  'faq-body-polishing': {
    id: 'faq-body-polishing',
    category: 'cat-services',
    subcategory: 'sub-massage',
    question: 'What is Body Scrub & Body Polishing?',
    answer: `Our **5-Step Body Polishing Ceremony (75 mins)** leaves full-body skin velvety smooth and radiant:

• **Step 1**: Gentle Dry Body Brushing (lymphatic stimulation).
• **Step 2**: Botanical Walnut & Cane Sugar Scrub (buffs away dead epidermal layers).
• **Step 3**: Warm Towel Cleansing & Surface Pore Purifying.
• **Step 4**: Mineral Kaolin Clay Detoxifying Body Wrap.
• **Step 5**: Nourishing Cold-Pressed Glow Oil Emulsion & Silky Massage Finish.

Perfect for pre-wedding glow, seasonal dead skin removal, or deep skin rejuvenation.`,
    followUpQuestionIds: ['faq-massage-menu', 'faq-rec-bridal'],
    actionType: 'services',
    keywords: ['body scrub', 'body polishing', 'body polish', 'body pack']
  },
  'faq-threading-areas': {
    id: 'faq-threading-areas',
    category: 'cat-services',
    subcategory: 'sub-threading-bleach',
    question: 'What threading services are available?',
    answer: `We use 100% organic anti-bacterial cotton thread for precise, clean hair removal:
• Eyebrow Sculpting & Shaping
• Upper Lip Threading
• Chin Threading
• Forehead Threading
• Full Face Threading

Our specialists use soothing aloe vera gel post-threading to calm sensitive follicles immediately.`,
    followUpQuestionIds: ['faq-bleach-detan', 'faq-price-rates'],
    actionType: 'services',
    keywords: ['threading', 'eyebrow threading', 'upper lip', 'chin', 'full face threading']
  },
  'faq-bleach-detan': {
    id: 'faq-bleach-detan',
    category: 'cat-services',
    subcategory: 'sub-threading-bleach',
    question: 'What is the difference between Bleach and De-Tan?',
    answer: `• **De-Tan Pack**: Uses bio-active lactic milk proteins and kojic acid to break down stubborn sun melanin and pigmentation naturally without altering facial hair color. Safe for sensitive skin.
• **Bleach (Oxy / Herbal)**: Lightens dark facial and body hair to match your skin tone while cleansing surface oil, providing an instant illuminated look for special events.

Both options include pre-treatment barrier cream and post-treatment rose soothing gel.`,
    followUpQuestionIds: ['faq-rec-glow', 'faq-price-rates'],
    actionType: 'services',
    keywords: ['bleach vs detan', 'detan pack', 'bleach kya hai', 'face detan', 'body bleach']
  },

  // --- 2. RECOMMENDATIONS ---
  'faq-rec-glow': {
    id: 'faq-rec-glow',
    category: 'cat-recommendations',
    subcategory: 'sub-rec-glow',
    question: 'I want glowing skin. Which service should I choose?',
    answer: `For luminous, glowing skin, we recommend based on your time and occasion:

1. **Party Glow (Immediate)**: **O3+ Shine & Glow Facial** (7 steps with D-Tan scrub and cooling peel-off mask) or **FYC Korean Glass Skin Facial**.
2. **Regular Radiance Maintenance**: **Lotus White Glow** or **FYC Wine Facial** paired with a Face & Neck De-Tan.
3. **Quick Refresh (30 mins)**: **Fruit Radiance Cleanup** + Eyebrow Threading.

All our facials use authentic, single-use derma kits unsealed at your dressing table.`,
    followUpQuestionIds: ['faq-facial-menu', 'faq-rec-custom-builder'],
    actionType: 'services',
    keywords: ['glow service', 'glowing skin', 'best facial for glow', 'skin brightness', 'chehre pe glow']
  },
  'faq-rec-bridal': {
    id: 'faq-rec-bridal',
    category: 'cat-recommendations',
    subcategory: 'sub-rec-glow',
    question: 'What services are recommended for pre-bridal or special events?',
    answer: `For brides, bridesmaids, or festive occasions, we recommend:

1. **Full Body Glow Package**: RICA Full Body Waxing + Full Body Polishing + O3+ Bridal Glow Seaweed Facial + Korean Mani-Pedi.
2. **Head-to-Toe Care**: Italian RICA Waxing (Arms, Legs, Underarms) + Korean Glass Skin Facial + Rose Himalayan Pedicure + Face De-Tan.

We advise scheduling waxing and body polishing 2-3 days before the main event, and your facial 1-2 days prior for maximum settled glow!`,
    followUpQuestionIds: ['faq-rec-custom-builder', 'faq-price-rates'],
    actionType: 'packages',
    keywords: ['bridal package', 'pre bridal', 'wedding beauty', 'shaadi package', 'bride services']
  },
  'faq-rec-relax': {
    id: 'faq-rec-relax',
    category: 'cat-recommendations',
    subcategory: 'sub-rec-relax',
    question: 'I want deep relaxation. What combination do you recommend?',
    answer: `For deep physical relaxation and stress relief, we recommend our **Relax & Restore Ritual**:
• **Full Body Swedish Massage (60 mins)**: Warm olive oil effleurage strokes relieving back & shoulder knots.
• **Acupressure Scalp & Head Massage (25 mins)**: Calming herbal oil application for tension release.
• **Rose Himalayan Foot Pedicure (45 mins)**: Warm mineral salt foot soak and reflexology massage.

Book directly or change services in our **"Make Your Own Package"** builder!`,
    followUpQuestionIds: ['faq-massage-menu', 'faq-rec-custom-builder'],
    actionType: 'packages',
    keywords: ['relaxation', 'relax services', 'stress relief', 'best massage', 'thakan mitane ke liye']
  },
  'faq-rec-maintenance': {
    id: 'faq-rec-maintenance',
    category: 'cat-recommendations',
    subcategory: 'sub-rec-relax',
    question: 'What is the best monthly maintenance routine?',
    answer: `Our most popular monthly routine includes:
• **Limb Waxing**: RICA Full Arms + Underarms + Full Legs.
• **Grooming**: Eyebrow & Upper Lip Threading.
• **Face Care**: Fruit or Aloe Deep Pore Cleanup.
• **Nails**: Express Rose Mani-Pedi.

Bundling these 4 services together unlocks a **15% package discount** automatically in our package builder!`,
    followUpQuestionIds: ['faq-rec-custom-builder', 'faq-wax-combos'],
    actionType: 'packages',
    keywords: ['monthly routine', 'maintenance package', 'regular salon at home', 'har mahine ka package']
  },
  'faq-rec-custom-builder': {
    id: 'faq-rec-custom-builder',
    category: 'cat-recommendations',
    subcategory: 'sub-rec-custom-pkgs',
    question: 'How does "Make Your Own Package" work?',
    answer: `Our interactive customizer allows you to build a package tailored to your exact beauty needs:

1. **Choose a Starting Style**: Select from 6 presets (Glow & Smooth, Relax & Restore, Head-to-Toe Care, Waxing & Facial Combo, Monthly Maintenance, or Build from Scratch).
2. **Add / Remove Services**: Swap any service across Waxing, Facials, Cleanups, Mani-Pedi, and Massage.
3. **Dynamic Bundle Discounts**: As you add items, our pricing engine applies automatic savings:
   • 2 services = **5% OFF**
   • 3 services = **10% OFF**
   • 4 services = **15% OFF**
   • 5+ services = **20% OFF**
4. **Instant Calculation**: Total price and time needed update live before you add to cart!`,
    followUpQuestionIds: ['faq-rec-bundle-discount', 'faq-price-rates'],
    actionType: 'packages',
    keywords: ['create your own ritual', 'custom package', 'customize package', 'build package', 'package kaise banaye']
  },
  'faq-rec-bundle-discount': {
    id: 'faq-rec-bundle-discount',
    category: 'cat-recommendations',
    subcategory: 'sub-rec-custom-pkgs',
    question: 'How are package bundle discounts calculated?',
    answer: `Bundle discounts apply progressively on the combined subtotal of all selected services in your custom ritual:
• **2 items**: 5% bundle discount
• **3 items**: 10% bundle discount
• **4 items**: 15% bundle discount
• **5 or more items**: Maximum 20% bundle discount

Discounts are calculated automatically by the server based on verified catalogue prices. No coupon code needed!`,
    followUpQuestionIds: ['faq-rec-custom-builder', 'faq-price-rates'],
    actionType: 'packages',
    keywords: ['bundle discount', 'package discount', 'discount calculation', 'how discount works']
  },

  // --- 3. PRICING & CHARGES ---
  'faq-price-rates': {
    id: 'faq-price-rates',
    category: 'cat-pricing',
    subcategory: 'sub-price-rates',
    question: 'What are the service prices at BeautyDoor?',
    answer: `Our prices are 100% transparent with zero hidden salon charges:
• Eyebrow Threading: from ₹49
• Underarms Waxing: from ₹99
• Full Arms Waxing: from ₹299
• Full Legs Waxing: from ₹399
• Full Arms + Underarms + Full Legs: from ₹849
• Facial Cleanups: from ₹699
• Branded Facials (Lotus / FYC / O3+): from ₹999 to ₹2,499
• Manicure & Pedicure: from ₹499
• Swedish Full Body Massage (60 mins): from ₹1,299

All disposable sheets, sanitization kits, and single-use products are included in the price. Check our "Rate Card" or "Services" page for the full itemized list!`,
    followUpQuestionIds: ['faq-min-order-city', 'faq-slot-charges', 'faq-price-hidden-fees'],
    actionType: 'services',
    keywords: ['prices', 'pricing', 'rate card', 'facial kitne ka hai', 'waxing kitne ki hai', 'charges']
  },
  'faq-price-hidden-fees': {
    id: 'faq-price-hidden-fees',
    category: 'cat-pricing',
    subcategory: 'sub-price-rates',
    question: 'Are there any hidden travel or product fees?',
    answer: `**No, absolutely not.**
• No travel fees or petrol surcharges.
• No charges for disposables, bedsheets, or wooden spatulas.
• No safety or PPE kit fees.

The total price displayed in your cart at checkout is the exact final price you pay.`,
    followUpQuestionIds: ['faq-min-order-city', 'faq-pay-cod-upi'],
    actionType: 'services',
    keywords: ['hidden fees', 'travel charge', 'extra charges', 'koi extra charge hai kya', 'visiting charges']
  },
  'faq-min-order-city': {
    id: 'faq-min-order-city',
    category: 'cat-pricing',
    subcategory: 'sub-price-min-order',
    question: 'What is the minimum order amount for doorstep service?',
    answer: `To dispatch verified female specialists with full salon equipment to your home, the minimum booking amounts are:

• **Delhi (All Zones)**: **₹1,000**
• **Gurugram / Gurgaon**: **₹1,500**
• **Noida & Greater Noida**: **₹1,500**
• **Faridabad**: **₹1,500**
• **Ghaziabad**: **₹1,500**

You can combine any number of services (e.g. Waxing + Threading + Cleanup) to easily meet your city threshold!`,
    followUpQuestionIds: ['faq-min-order-why', 'faq-serviceable-cities'],
    actionType: 'services',
    keywords: ['minimum order', 'min order', 'delhi minimum order', 'gurgaon minimum order', 'minimum kitne ka book kar sakte hain']
  },
  'faq-min-order-why': {
    id: 'faq-min-order-why',
    category: 'cat-pricing',
    subcategory: 'sub-price-min-order',
    question: 'Why does my cart show a minimum order requirement?',
    answer: `Because BeautyDoor delivers premium salon-grade equipment (digital wax heaters, autoclaved tools, single-use sterile kits) directly to your home with dedicated female specialists, our minimum thresholds ensure fair compensation for our professionals while keeping doorstep travel 100% free for you.

Simply add an express service (like Eyebrow Threading, Face De-Tan, or a Manicure) to cross the threshold!`,
    followUpQuestionIds: ['faq-min-order-city', 'faq-rec-glow'],
    actionType: 'services',
    keywords: ['why minimum order', 'cart below minimum', 'minimum order reason']
  },
  'faq-slot-charges': {
    id: 'faq-slot-charges',
    category: 'cat-pricing',
    subcategory: 'sub-price-slots',
    question: 'Are there additional charges for specific appointment slots?',
    answer: `• **Standard Daytime Slots (09:00 AM to 05:00 PM)**: **₹0** (No extra charge).
• **Early Morning Slot (08:00 AM)**: **₹100 surcharge** (specialist priority early transit).
• **Evening Slot (06:00 PM)**: **₹100 surcharge** (peak evening service).

All slot fees are clearly highlighted when selecting your time and itemized in your transparent bill.`,
    followUpQuestionIds: ['faq-same-day-booking', 'faq-how-to-book'],
    actionType: 'booking',
    keywords: ['slot charges', 'early slot charge', 'evening slot fee', 'extra slot charge']
  },
  'faq-tax-included': {
    id: 'faq-tax-included',
    category: 'cat-pricing',
    subcategory: 'sub-price-slots',
    question: 'Are taxes included in the displayed price?',
    answer: `Yes, all prices displayed on BeautyDoor are all-inclusive. You will never be asked for additional GST or service taxes at checkout or upon specialist arrival.`,
    followUpQuestionIds: ['faq-price-rates', 'faq-pay-cod-upi'],
    actionType: 'services',
    keywords: ['tax', 'gst', 'is tax included', 'all inclusive']
  },

  // --- 4. BOOKING & APPOINTMENTS ---
  'faq-how-to-book': {
    id: 'faq-how-to-book',
    category: 'cat-booking',
    subcategory: 'sub-book-how',
    question: 'How do I book an appointment on BeautyDoor?',
    answer: `Booking takes less than 60 seconds:
1. **Select Services**: Tap "Add" on any service or curated package.
2. **Open Bag**: Tap the floating bag icon or "Review Bag" button.
3. **Choose Date & Slot**: Pick your preferred appointment date and time (08:00 AM to 06:00 PM).
4. **Enter Address**: Provide your home address and select your city (Delhi, Gurugram, Noida, etc.). No PIN code required!
5. **Confirm**: Choose Cash/UPI After Service or Online Payment and tap "Place Booking". You'll receive instant WhatsApp and SMS confirmation!`,
    followUpQuestionIds: ['faq-same-day-booking', 'faq-pay-cod-upi', 'faq-min-order-city'],
    actionType: 'book',
    keywords: ['how to book', 'booking process', 'appointment kaise book kare', 'kaise order kare', 'book service']
  },
  'faq-book-multiple': {
    id: 'faq-book-multiple',
    category: 'cat-booking',
    subcategory: 'sub-book-how',
    question: 'Can I book multiple services in one appointment?',
    answer: `Yes, absolutely! You can add as many services as you like to your bag—such as Full Arms Waxing, O3+ Facial, and Pedicure. All treatments will be performed sequentially in one continuous, relaxing doorstep session by your assigned specialist.`,
    followUpQuestionIds: ['faq-how-to-book', 'faq-rec-custom-builder'],
    actionType: 'book',
    keywords: ['multiple services', 'ek saath service', 'combine treatments', 'book together']
  },
  'faq-book-for-others': {
    id: 'faq-book-for-others',
    category: 'cat-booking',
    subcategory: 'sub-book-how',
    question: 'Can I book for my mother, sister, or friend?',
    answer: `Yes! Simply enter their name, phone number, and address during checkout. You can also add special instructions (e.g. "Gift booking for my mother") in the appointment notes field.`,
    followUpQuestionIds: ['faq-how-to-book', 'faq-pay-cod-upi'],
    actionType: 'book',
    keywords: ['book for someone else', 'gift booking', 'kisi aur ke liye book karna']
  },
  'faq-same-day-booking': {
    id: 'faq-same-day-booking',
    category: 'cat-booking',
    subcategory: 'sub-book-timing',
    question: 'Can I book an appointment for today (same-day)?',
    answer: `Yes! Same-day appointments are available across Delhi NCR if slots are open. We recommend booking at least **2 to 3 hours in advance** so our dispatch team can assign your specialist and prepare sterile kits.`,
    followUpQuestionIds: ['faq-how-to-book', 'faq-advance-booking'],
    actionType: 'book',
    keywords: ['same day booking', 'aaj ka appointment', 'urgent booking', 'today appointment']
  },
  'faq-advance-booking': {
    id: 'faq-advance-booking',
    category: 'cat-booking',
    subcategory: 'sub-book-timing',
    question: 'How far in advance can I book an appointment?',
    answer: `You can schedule appointments up to **14 days in advance**. Advance booking is highly recommended for weekend slots, wedding ceremonies, and festive dates to guarantee your preferred time.`,
    followUpQuestionIds: ['faq-how-to-book', 'faq-cancel-policy'],
    actionType: 'book',
    keywords: ['advance booking', 'pehle se book karna', 'how far advance']
  },
  'faq-booking-confirmation': {
    id: 'faq-booking-confirmation',
    category: 'cat-booking',
    subcategory: 'sub-book-timing',
    question: 'How do I know my booking is confirmed?',
    answer: `Once you tap "Place Booking":
1. You see your unique **Booking ID** (e.g. BD-NCR-1234) on the confirmation screen.
2. An instant confirmation message is sent via SMS and WhatsApp.
3. You can track your booking status anytime under "My Bookings" in your account using your mobile number.`,
    followUpQuestionIds: ['faq-track-booking', 'faq-how-to-book'],
    actionType: 'booking',
    keywords: ['booking confirmation', 'booking confirm hua kya', 'confirmation message', 'booking id']
  },

  // --- 5. LOCATION & AVAILABILITY ---
  'faq-serviceable-cities': {
    id: 'faq-serviceable-cities',
    category: 'cat-locations',
    subcategory: 'sub-loc-areas',
    question: 'Which cities and areas does BeautyDoor serve?',
    answer: `BeautyDoor serves homes across the entire **Delhi NCR** metropolitan area:

• **Delhi**: South Delhi (Saket, Hauz Khas, Greater Kailash, Vasant Kunj), Central & West Delhi (Dwarka, Punjabi Bagh, Janakpuri), East & North Delhi.
• **Gurugram / Gurgaon**: DLF Phase 1–5, Cyber City, Golf Course Road, Sohna Road, Sector 14, 21, 56, 57.
• **Noida & Greater Noida**: Sector 15 to 150, Noida Extension / Greater Noida West.
• **Faridabad**: Green Field Colony, Sector 14–21, Neharpar.
• **Ghaziabad**: Indirapuram, Vaishali, Vasundhara, Crossings Republik.`,
    followUpQuestionIds: ['faq-check-locality', 'faq-no-pincode-needed', 'faq-min-order-city'],
    actionType: 'services',
    keywords: ['serviceable areas', 'delhi ncr', 'noida', 'gurgaon', 'faridabad', 'ghaziabad', 'where do you serve', 'kahan aate ho']
  },
  'faq-check-locality': {
    id: 'faq-check-locality',
    category: 'cat-locations',
    subcategory: 'sub-loc-areas',
    question: 'How can I check if my specific society or locality is covered?',
    answer: `All residential societies and independent homes within Delhi, Gurugram, Noida, Faridabad, and Ghaziabad are covered. You can tap the city selector in the navigation bar or simply enter your locality name in the booking drawer.`,
    followUpQuestionIds: ['faq-serviceable-cities', 'faq-no-pincode-needed'],
    actionType: 'services',
    keywords: ['check locality', 'check my society', 'mera area covered hai']
  },
  'faq-travel-charges': {
    id: 'faq-travel-charges',
    category: 'cat-locations',
    subcategory: 'sub-loc-travel',
    question: 'Is there any extra travel charge for my area?',
    answer: `No. Travel is **100% complimentary** for all orders meeting the city minimum booking value (Delhi: ₹1,000; Gurugram/Noida/Faridabad: ₹1,500).`,
    followUpQuestionIds: ['faq-min-order-city', 'faq-price-hidden-fees'],
    actionType: 'services',
    keywords: ['travel charge', 'extra travel fee', 'conveyance charges']
  },
  'faq-no-pincode-needed': {
    id: 'faq-no-pincode-needed',
    category: 'cat-locations',
    subcategory: 'sub-loc-travel',
    question: 'Do I need to enter a PIN code to book?',
    answer: `**No PIN code is required.** You simply select your City (Delhi, Gurugram, Noida, Faridabad, etc.) and type your street or society address. We removed PIN code barriers so you can book without remembering postal codes!`,
    followUpQuestionIds: ['faq-how-to-book', 'faq-serviceable-cities'],
    actionType: 'services',
    keywords: ['pincode required', 'no pincode', 'pincode nahi pata', 'without pincode']
  },

  // --- 6. BEAUTY PROFESSIONALS ---
  'faq-specialist-verification': {
    id: 'faq-specialist-verification',
    category: 'cat-professionals',
    subcategory: 'sub-prof-verify',
    question: 'Who will visit my home? Are professionals background-verified?',
    answer: `• **100% Female Specialists**: For client comfort and safety, only verified female beauty specialists are dispatched for at-home services.
• **Rigorous Background Verification**: Every specialist undergoes government ID verification, police background checks, and residential address confirmation.
• **Certified Experience**: Minimum 3+ years of professional salon experience with certified training in hygiene protocols and brand application techniques (O3+, RICA, Lotus).`,
    followUpQuestionIds: ['faq-gender-specialists', 'faq-what-to-prepare', 'faq-single-use-kits'],
    actionType: 'services',
    keywords: ['specialist verification', 'who will come', 'police verification', 'safety', 'female specialist']
  },
  'faq-gender-specialists': {
    id: 'faq-gender-specialists',
    category: 'cat-professionals',
    subcategory: 'sub-prof-verify',
    question: 'Do you offer services for men, or are specialists only female?',
    answer: `BeautyDoor provides at-home services **exclusively for female clients performed exclusively by verified female specialists**. Male grooming services are not offered at this time.`,
    followUpQuestionIds: ['faq-specialist-verification', 'faq-what-to-prepare'],
    actionType: 'services',
    keywords: ['male service', 'men waxing', 'female only', 'ladki hi aayegi']
  },
  'faq-what-to-prepare': {
    id: 'faq-what-to-prepare',
    category: 'cat-professionals',
    subcategory: 'sub-prof-prep',
    question: 'What do I need to prepare before the specialist arrives?',
    answer: `Our specialist brings all professional products, disposable sheets, heaters, and tools. You only need to provide:

1. **A quiet room** with comfortable seating or a clean bed/mat.
2. **Access to a standard electrical outlet** (for the digital wax heater or facial steamer).
3. **Warm water access** from a nearby bathroom (for foot soak or facial towels).
4. **Air-Conditioned / Cool Room (strictly required for waxing)**: Keeps wax setting properly and prevents skin irritation!`,
    followUpQuestionIds: ['faq-before-wax-ac', 'faq-specialist-verification'],
    actionType: 'services',
    keywords: ['what to prepare', 'kya tayyari karni hai', 'room requirement', 'before appointment']
  },
  'faq-delays-or-changes': {
    id: 'faq-delays-or-changes',
    category: 'cat-professionals',
    subcategory: 'sub-prof-prep',
    question: 'What happens if the specialist is delayed by traffic?',
    answer: `Our specialists aim to arrive 5–10 minutes early. If NCR traffic causes an unexpected delay, you will be notified promptly via WhatsApp or call. You can also reach our live Customer Support Helpline at +91 78277 22522 anytime for real-time dispatch updates.`,
    followUpQuestionIds: ['faq-contact-concierge', 'faq-track-booking'],
    actionType: 'contact',
    keywords: ['specialist late', 'traffic delay', 'specialist delay', 'beautician late']
  },

  // --- 7. HYGIENE & SAFETY ---
  'faq-single-use-kits': {
    id: 'faq-single-use-kits',
    category: 'cat-hygiene',
    subcategory: 'sub-hygiene-tools',
    question: 'What hygiene practices does BeautyDoor follow?',
    answer: `We hold ourselves to hospital-grade at-home hygiene:
• **Single-Use Sealed Kits**: Mono-dose facial kits, wax cartridges, and creams are unsealed in front of you.
• **100% Disposable Sheets**: Fresh disposable bedsheets, headbands, and gowns for every client.
• **Zero Double-Dipping**: A fresh wooden spatula is used for every single wax application.
• **Autoclaved Tools**: Surgical-grade stainless steel cuticle tools are pre-sterilized in sealed pouches.
• **Post-Service Cleanliness**: The specialist cleans and wipes your vanity space before departure!`,
    followUpQuestionIds: ['faq-no-double-dipping', 'faq-before-wax-ac'],
    actionType: 'services',
    keywords: ['hygiene standards', 'cleanliness', 'single use kits', 'sterilization', 'safai']
  },
  'faq-no-double-dipping': {
    id: 'faq-no-double-dipping',
    category: 'cat-hygiene',
    subcategory: 'sub-hygiene-tools',
    question: 'What is the "Zero Double-Dipping" policy?',
    answer: `Zero double-dipping means that once a wooden spatula touches your skin, it is discarded immediately into the waste bag. It is **never** dipped back into the wax pot. This prevents bacterial cross-contamination and ensures sterile waxing for sensitive and intimate areas.`,
    followUpQuestionIds: ['faq-single-use-kits', 'faq-brazilian'],
    actionType: 'services',
    keywords: ['zero double dipping', 'double dip', 'wooden spatula', 'wax spatula']
  },
  'faq-before-wax-ac': {
    id: 'faq-before-wax-ac',
    category: 'cat-hygiene',
    subcategory: 'sub-hygiene-care',
    question: 'Why is an Air-Conditioned (AC) room required for waxing?',
    answer: `An air-conditioned or cool room (recommended 22°C–24°C) is **strictly required** for all waxing treatments:
• In humid or warm rooms, body perspiration prevents wax from adhering cleanly to hair follicles.
• Perspiration causes wax strips to drag on the skin, causing redness and pain.
• In a cool AC room, wax sets crisply, allowing fast, clean, virtually painless hair removal.`,
    followUpQuestionIds: ['faq-after-facial-care', 'faq-what-to-prepare'],
    actionType: 'services',
    keywords: ['ac room required', 'why ac for wax', 'waxing me ac kyu chahiye', 'cool room']
  },
  'faq-after-facial-care': {
    id: 'faq-after-facial-care',
    category: 'cat-hygiene',
    subcategory: 'sub-hygiene-care',
    question: 'What should I do after a facial or waxing treatment?',
    answer: `• **Post-Waxing Care**: Avoid direct sunlight, hot baths, swimming pools, gym workouts, and synthetic clothing for 24 hours. Post-wax chamomile soothing gel is applied by your specialist.
• **Post-Facial Care**: Avoid washing your face with harsh soaps or face wash for 12 hours to let active serums absorb. Stay hydrated and apply gentle sunscreen before stepping outdoors.`,
    followUpQuestionIds: ['faq-sensitive-skin', 'faq-facial-menu'],
    actionType: 'services',
    keywords: ['aftercare', 'after facial care', 'after waxing care', 'facial ke baad kya kare', 'waxing ke baad']
  },
  'faq-sensitive-skin': {
    id: 'faq-sensitive-skin',
    category: 'cat-hygiene',
    subcategory: 'sub-hygiene-care',
    question: 'Can I book if I have sensitive or allergy-prone skin?',
    answer: `Yes! For sensitive skin, we strongly recommend:
• **Waxing**: Choose **Korean Botanical Wax** or **RICA Wax** (both are colophony-free and formulated for low irritation).
• **Facial**: Choose **FYC Korean Glass Skin Facial** or **Aroma Magic Herbal Facial**.
• Please inform your specialist of any allergies before starting so a patch test can be conducted on your inner wrist.`,
    followUpQuestionIds: ['faq-wax-types', 'faq-facial-menu'],
    actionType: 'services',
    keywords: ['sensitive skin', 'skin allergy', 'rashes', 'sensitive skin ke liye']
  },

  // --- 8. PAYMENTS & OFFERS ---
  'faq-pay-cod-upi': {
    id: 'faq-pay-cod-upi',
    category: 'cat-payments',
    subcategory: 'sub-pay-methods',
    question: 'Can I pay Cash or UPI after the service is completed?',
    answer: `**Yes! Pay After Service (Cash / UPI) is our default, most popular payment method.**
You do not need to pay a single rupee in advance. Once your treatment is completed and you are 100% satisfied:
• Pay in **Cash** directly to the specialist, OR
• Scan the specialist's verified **UPI QR code** using any app (Google Pay, PhonePe, Paytm, BHIM).`,
    followUpQuestionIds: ['faq-online-payment', 'faq-active-coupons'],
    actionType: 'book',
    keywords: ['pay after service', 'cash on delivery', 'cod', 'upi payment', 'gpay', 'phonepe', 'baad me paise dena']
  },
  'faq-online-payment': {
    id: 'faq-online-payment',
    category: 'cat-payments',
    subcategory: 'sub-pay-methods',
    question: 'Can I pay online during checkout?',
    answer: `Yes. You can choose "Online Payment" at checkout to pay via UPI, Credit/Debit Cards, or Netbanking. If you choose Cash After Service, you still retain the option to pay via UPI QR code upon specialist arrival.`,
    followUpQuestionIds: ['faq-pay-cod-upi', 'faq-price-rates'],
    actionType: 'book',
    keywords: ['online payment', 'card payment', 'netbanking', 'pay online']
  },
  'faq-active-coupons': {
    id: 'faq-active-coupons',
    category: 'cat-payments',
    subcategory: 'sub-pay-coupons',
    question: 'What discount coupons and offers are active today?',
    answer: `🎁 Current BeautyDoor Offers:
• **First Booking Offer**: Use code **WELCOME100** at checkout for instant ₹100 off!
• **Dynamic Custom Package Savings**: Bundle 2+ services in "Make Your Own Package" for 5% to 20% automatic discount.
• **Complimentary Inclusions**: Select curated signature packages include free threading or de-tan!

Check our "Offers" page for all seasonal festival codes.`,
    followUpQuestionIds: ['faq-apply-coupon', 'faq-rec-custom-builder'],
    actionType: 'services',
    keywords: ['coupons', 'offers', 'discount code', 'welcome100', 'promo code', 'chhoot', 'offer kya hai']
  },
  'faq-apply-coupon': {
    id: 'faq-apply-coupon',
    category: 'cat-payments',
    subcategory: 'sub-pay-coupons',
    question: 'How do I apply a coupon code?',
    answer: `In the Booking Drawer under Step 1 (Review Bag):
1. Look for the "Have a promo code?" input field.
2. Enter your coupon code (e.g. **WELCOME100**) and tap **Apply**.
3. The discount is deducted instantly from your total!`,
    followUpQuestionIds: ['faq-active-coupons', 'faq-pay-cod-upi'],
    actionType: 'book',
    keywords: ['apply coupon', 'coupon kaise lagaye', 'promo code apply']
  },

  // --- 9. CANCELLATION & REFUNDS ---
  'faq-cancel-policy': {
    id: 'faq-cancel-policy',
    category: 'cat-cancellation',
    subcategory: 'sub-cancel-policy',
    question: 'What is BeautyDoor\'s cancellation and rescheduling policy?',
    answer: `• **Free Cancellation**: You can cancel or reschedule with **zero penalty up to 4 hours** prior to your appointment time.
• **How to Cancel/Reschedule**: Simply go to "My Bookings" in your account or message our Customer Support Helpline on WhatsApp at +91 78277 22522.
• We understand plans change—our team will happily reschedule your session to a more convenient date or slot!`,
    followUpQuestionIds: ['faq-reschedule-appointment', 'faq-refund-process'],
    actionType: 'contact',
    keywords: ['cancellation policy', 'cancel booking', 'cancel kaise kare', 'reschedule policy', 'cancel charge']
  },
  'faq-reschedule-appointment': {
    id: 'faq-reschedule-appointment',
    category: 'cat-cancellation',
    subcategory: 'sub-cancel-policy',
    question: 'How do I reschedule my appointment to a different time?',
    answer: `To reschedule:
1. Message our Customer Support Desk on WhatsApp at **+91 78277 22522** with your Booking ID and preferred new date/time.
2. Or call our helpline at **+91 78277 22522** (08:00 AM – 06:00 PM).
3. We will update your appointment slot instantly at no extra cost.`,
    followUpQuestionIds: ['faq-cancel-policy', 'faq-contact-concierge'],
    actionType: 'contact',
    keywords: ['reschedule', 'change time', 'time badalna', 'date change', 'timing change']
  },
  'faq-refund-process': {
    id: 'faq-refund-process',
    category: 'cat-cancellation',
    subcategory: 'sub-cancel-refund',
    question: 'When will I receive my refund if I cancel an online payment?',
    answer: `If you paid online and cancel eligible appointments within the free cancellation window:
• 100% of your amount is automatically refunded to your original payment method (bank account, UPI, or card).
• Refunds typically reflect within **2 to 4 business days** depending on your issuing bank.`,
    followUpQuestionIds: ['faq-cancel-policy', 'faq-contact-concierge'],
    actionType: 'contact',
    keywords: ['refund', 'refund kab aayega', 'refund timeline', 'money back']
  },
  'faq-specialist-noshow': {
    id: 'faq-specialist-noshow',
    category: 'cat-cancellation',
    subcategory: 'sub-cancel-refund',
    question: 'What happens if a specialist cannot attend my appointment?',
    answer: `In the rare event of an unexpected medical or transit emergency with an assigned specialist, our dispatch manager will immediately notify you and offer either an expedited replacement specialist or priority rescheduling with an exclusive complimentary service voucher.`,
    followUpQuestionIds: ['faq-contact-concierge', 'faq-cancel-policy'],
    actionType: 'contact',
    keywords: ['specialist not came', 'beautician nahi aayi', 'no show', 'complaint']
  },

  // --- 10. ACCOUNT & TECH SUPPORT ---
  'faq-otp-login': {
    id: 'faq-otp-login',
    category: 'cat-account',
    subcategory: 'sub-acc-login',
    question: 'How do I log in or create an account?',
    answer: `We use quick, password-free login:
1. Tap **Account** in the header.
2. Enter your 10-digit mobile number and tap "Send Verification Code".
3. Enter the 6-digit OTP sent to your phone.
4. Your account is ready! All your booking history and addresses are safely stored.`,
    followUpQuestionIds: ['faq-track-booking', 'faq-cart-trouble'],
    actionType: 'services',
    keywords: ['login', 'create account', 'otp', 'sign in', 'account kaise banaye']
  },
  'faq-track-booking': {
    id: 'faq-track-booking',
    category: 'cat-account',
    subcategory: 'sub-acc-login',
    question: 'How can I check my booking status or past orders?',
    answer: `Go to **Account** $\\to$ **My Bookings**. Enter your registered phone number to view all confirmed appointments, dates, assigned specialist status, and detailed service itemization.`,
    followUpQuestionIds: ['faq-otp-login', 'faq-contact-concierge'],
    actionType: 'services',
    keywords: ['track booking', 'booking status', 'order status', 'my bookings', 'status check']
  },
  'faq-cart-trouble': {
    id: 'faq-cart-trouble',
    category: 'cat-account',
    subcategory: 'sub-acc-trouble',
    question: 'I am unable to add a service to my cart or checkout. What should I do?',
    answer: `If you experience any browser glitch:
1. Ensure your cart meets the minimum booking amount for your city (Delhi: ₹1,000; Gurugram/Noida/Faridabad: ₹1,500).
2. Tap the Refresh/Reset button or clear your browser cache.
3. If the issue persists, message our Customer Support on WhatsApp at **+91 78277 22522**—our team can create your booking for you directly over chat!`,
    followUpQuestionIds: ['faq-contact-concierge', 'faq-min-order-city'],
    actionType: 'contact',
    keywords: ['cart trouble', 'bag issue', 'checkout problem', 'button not working', 'order nahi ho raha']
  },
  'faq-contact-concierge': {
    id: 'faq-contact-concierge',
    category: 'cat-account',
    subcategory: 'sub-acc-trouble',
    question: 'How do I contact customer support?',
    answer: `You can reach our dedicated BeautyDoor Customer Support Desk 7 days a week (08:00 AM – 06:00 PM):

• **WhatsApp Helpline**: **+91 78277 22522** (Instant response)
• **Phone Call**: **+91 78277 22522**
• **Email**: **hello@beautydoor.in**
• **Customer Support Lead**: Preeti Singh

Feel free to tap the WhatsApp or Call buttons below to connect with us immediately!`,
    followUpQuestionIds: ['faq-speak-with-owner', 'faq-share-feedback'],
    actionType: 'contact',
    keywords: ['contact support', 'customer care', 'helpline', 'phone number', 'whatsapp number', 'support se baat']
  },

  // --- 11. AFTER-SERVICE ---
  'faq-share-feedback': {
    id: 'faq-share-feedback',
    category: 'cat-after-service',
    subcategory: 'sub-after-feedback',
    question: 'How do I share feedback or rate my beautician?',
    answer: `Your experience means everything to us:
• After service completion, you will receive a feedback link via SMS and WhatsApp.
• You can also tap **"Write a Review"** in the Customer Reviews section on our website.
• Or share your honest thoughts directly with our Customer Support Manager on WhatsApp at **+91 78277 22522**!`,
    followUpQuestionIds: ['faq-unhappy-resolution', 'faq-contact-concierge'],
    actionType: 'contact',
    keywords: ['feedback', 'rating', 'review', 'share feedback', 'kaisa laga service']
  },
  'faq-unhappy-resolution': {
    id: 'faq-unhappy-resolution',
    category: 'cat-after-service',
    subcategory: 'sub-after-feedback',
    question: 'What if I am unhappy with a service or treatment was incomplete?',
    answer: `We guarantee 100% satisfaction. If any treatment did not meet your expectations:
1. Please contact our Customer Support Desk within 24 hours at **+91 78277 22522** or **hello@beautydoor.in**.
2. Our customer experience lead will review your appointment details immediately.
3. Depending on the situation, we will dispatch a senior beautician for a complimentary touch-up session or issue an appropriate adjustment voucher.`,
    followUpQuestionIds: ['faq-contact-concierge', 'faq-speak-with-owner'],
    actionType: 'contact',
    keywords: ['unhappy', 'complaint', 'bad service', 'service acchi nahi lagi', 'incomplete service']
  },
  'faq-speak-with-owner': {
    id: 'faq-speak-with-owner',
    category: 'cat-after-service',
    subcategory: 'sub-after-contact',
    question: 'Can I speak directly with BeautyDoor management?',
    answer: `Yes! BeautyDoor is committed to direct personal accountability. You can connect with our Customer Support Manager Preeti Singh directly at:
• **Direct Helpline**: **+91 78277 22522**
• **Executive Email**: **hello@beautydoor.in**
• **Operating Hours**: Monday to Sunday, 08:00 AM – 06:00 PM`,
    followUpQuestionIds: ['faq-contact-concierge'],
    actionType: 'contact',
    keywords: ['speak with owner', 'management', 'preeti singh', 'senior support']
  }
};

// 3. Natural Language Intent Matcher for Typed Customer Queries (English & Hinglish)
export function matchQueryToAnswer(query: string): ChatbotAnswer | null {
  const norm = query.toLowerCase().replace(/[^\w\s\u0900-\u097F]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!norm) return null;

  // 1. Keyword rule triggers
  if (/offer|discount|coupon|deal|promo|sasta|chhoot|welcome100/.test(norm)) {
    return CHATBOT_ANSWERS['faq-active-coupons'];
  }
  if (/delhi|noida|gurgaon|gurugram|ghaziabad|faridabad|greater noida|area|location|kahan aate|serviceable/.test(norm)) {
    return CHATBOT_ANSWERS['faq-serviceable-cities'];
  }
  if (/ghar|doorstep|home service|aate ho|home visit|ghar pe|ghar par/.test(norm)) {
    return CHATBOT_ANSWERS['faq-serviceable-cities'];
  }
  if (/min.*order|minimum order|kam se kam|kitne ka book|minimum amount|threshold/.test(norm)) {
    return CHATBOT_ANSWERS['faq-min-order-city'];
  }
  if (/brazilian|bikini|intimate wax|peel off/.test(norm)) {
    return CHATBOT_ANSWERS['faq-brazilian'];
  }
  if (/korean.*glass|glass skin|korean facial/.test(norm)) {
    return CHATBOT_ANSWERS['faq-korean-glass'];
  }
  if (/o3|o3\+|shine and glow|bridal glow/.test(norm)) {
    return CHATBOT_ANSWERS['faq-o3-difference'];
  }
  if (/facial|facial kitne|best facial|facial price/.test(norm)) {
    return CHATBOT_ANSWERS['faq-facial-menu'];
  }
  if (/wax|waxing|rica|honey wax|roll on/.test(norm)) {
    return CHATBOT_ANSWERS['faq-wax-types'];
  }
  if (/massage|swedish|body massage|foot massage|head massage/.test(norm)) {
    return CHATBOT_ANSWERS['faq-massage-menu'];
  }
  if (/mani|pedi|manicure|pedicure/.test(norm)) {
    return CHATBOT_ANSWERS['faq-mani-pedi-types'];
  }
  if (/threading|eyebrow/.test(norm)) {
    return CHATBOT_ANSWERS['faq-threading-areas'];
  }
  if (/bleach|detan|de tan/.test(norm)) {
    return CHATBOT_ANSWERS['faq-bleach-detan'];
  }
  if (/price|rate|charges|cost|paise kitne|kitna kharcha|rate card|kitne ka/.test(norm)) {
    return CHATBOT_ANSWERS['faq-price-rates'];
  }
  if (/cod|cash|pay|payment|upi|gpay|phonepe|card|paise kaise|pay after/.test(norm)) {
    return CHATBOT_ANSWERS['faq-pay-cod-upi'];
  }
  if (/cancel|refund|wapas|booking hatana/.test(norm)) {
    return CHATBOT_ANSWERS['faq-cancel-policy'];
  }
  if (/reschedule|change time|change date|timing badalna/.test(norm)) {
    return CHATBOT_ANSWERS['faq-reschedule-appointment'];
  }
  if (/how to book|kaise book|appointment book|order kaise/.test(norm)) {
    return CHATBOT_ANSWERS['faq-how-to-book'];
  }
  if (/ac room|ac kyu|air condition/.test(norm)) {
    return CHATBOT_ANSWERS['faq-before-wax-ac'];
  }
  if (/custom|package custom|create.*ritual|apna package/.test(norm)) {
    return CHATBOT_ANSWERS['faq-rec-custom-builder'];
  }
  if (/support|contact|help|care|phone|whatsapp|call|baat karni/.test(norm)) {
    return CHATBOT_ANSWERS['faq-contact-concierge'];
  }
  if (/safe|hygiene|steril|clean|disposable|single use/.test(norm)) {
    return CHATBOT_ANSWERS['faq-single-use-kits'];
  }
  if (/female|specialist|ladki|beautician|who will come/.test(norm)) {
    return CHATBOT_ANSWERS['faq-specialist-verification'];
  }

  // 2. Score-based fallback search across all answers keywords
  let bestMatch: ChatbotAnswer | null = null;
  let highestScore = 0;

  for (const item of Object.values(CHATBOT_ANSWERS)) {
    let score = 0;
    const qNorm = item.question.toLowerCase();
    if (norm === qNorm) score += 100;
    else if (norm.includes(qNorm) || qNorm.includes(norm)) score += 40;

    for (const kw of item.keywords) {
      const kwNorm = kw.toLowerCase();
      if (norm === kwNorm) score += 70;
      else if (norm.includes(kwNorm)) score += 35;
      else {
        const tokens = norm.split(' ');
        const kwTokens = kwNorm.split(' ');
        const overlap = tokens.filter(t => t.length > 2 && kwTokens.includes(t));
        score += overlap.length * 15;
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (highestScore >= 30) {
    return bestMatch;
  }

  return null;
}
