import fs from 'fs';
import path from 'path';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  isActive: boolean;
  imageTag: string;
}

export interface ServiceVariant {
  id: string;
  name: string;
  priceDelta: number;
  durationDelta: number;
  isDefault?: boolean;
}

export interface ServiceAddon {
  id: string;
  name: string;
  price: number;
  durationMins: number;
}

export interface ServiceItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  benefits: string[];
  durationMins: number;
  originalPrice: number;
  sellingPrice: number;
  discountPercent: number;
  whatsIncluded: string[];
  variants: ServiceVariant[];
  addons: ServiceAddon[];
  isActive: boolean;
  isPopular?: boolean;
  isBestseller?: boolean;
  accentBadge?: string;
}

export interface Territory {
  id: string;
  city: string;
  areaName: string;
  pincode: string;
  isActive: boolean;
  deliveryFee: number;
  minOrderAmount: number;
}

export interface Beautician {
  id: string;
  name: string;
  phone: string;
  rating: number;
  totalJobs: number;
  specialties: string[];
  territories: string[];
  isActive: boolean;
  status: 'available' | 'on_leave';
  experienceYears: number;
}

export interface BookingItem {
  serviceId: string;
  serviceName: string;
  variantId?: string;
  variantName?: string;
  addonIds: string[];
  addonNames: string[];
  unitPrice: number;
  finalItemPrice: number;
  durationMins: number;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  address: {
    flat: string;
    landmark?: string;
    area: string;
    city: string;
    pincode: string;
  };
  items: BookingItem[];
  subtotal: number;
  packageDiscount: number;
  couponDiscount: number;
  couponCode?: string;
  deliveryFee: number;
  totalPayable: number;
  appointmentDate: string; // YYYY-MM-DD
  appointmentSlot: string; // e.g. "10:00 AM"
  paymentMethod: 'COD' | 'RAZORPAY';
  paymentStatus: 'pending' | 'collected' | 'refunded';
  bookingStatus: 'pending' | 'confirmed' | 'assigned' | 'in_service' | 'completed' | 'cancelled';
  assignedBeauticianId?: string;
  internalNotes?: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number;
  expiresAt: string;
  isActive: boolean;
  description: string;
}

export interface CustomerReview {
  id: string;
  customerName: string;
  city: string;
  rating: number;
  comment: string;
  serviceName: string;
  date: string;
  source: 'google_places' | 'verified_customer';
  isApproved: boolean;
}

export interface BusinessSettings {
  brandName: string;
  tagline: string;
  contactPhone: string;
  contactEmail: string;
  supportWhatsApp: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  minOrderAmount: number;
  cancellationWindowHours: number;
  cancellationPolicy: string;
  announcementBannerText: string;
  isAnnouncementActive: boolean;
  razorpayEnabled: boolean;
  codEnabled: boolean;
}

export interface DatabaseSchema {
  categories: Category[];
  services: ServiceItem[];
  territories: Territory[];
  beauticians: Beautician[];
  bookings: Booking[];
  coupons: Coupon[];
  reviews: CustomerReview[];
  settings: BusinessSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'beautydoor_db.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial authentic seeds
const initialCategories: Category[] = [
  { id: 'waxing', name: 'Waxing', slug: 'waxing', description: 'Gentle, skin-friendly Honey and Italian Rica waxing for satin smooth skin.', order: 1, isActive: true, imageTag: 'waxing' },
  { id: 'facial', name: 'Facial & Cleanups', slug: 'facial', description: 'Rejuvenating glow facials, Hydra-facials, and clinical derma cleanups.', order: 2, isActive: true, imageTag: 'facial' },
  { id: 'mani-pedi', name: 'Manicure & Pedicure', slug: 'mani-pedi', description: 'Luxury crystal spa rituals, cuticle nourishment, and callus treatment.', order: 3, isActive: true, imageTag: 'mani-pedi' },
  { id: 'hair-care', name: 'Hair Care & Spas', slug: 'hair-care', description: 'Deep nourishing hair spas, Olaplex bond repair, and scalp revival.', order: 4, isActive: true, imageTag: 'hair-care' },
  { id: 'de-tan', name: 'De-Tan & Bleach', slug: 'de-tan', description: 'Skin brightening lactic peels, milk protein de-tans, and instant glow bleach.', order: 5, isActive: true, imageTag: 'de-tan' },
  { id: 'massage', name: 'Body Massage & Spas', slug: 'massage', description: 'Therapeutic Swedish, deep tissue, and aromatherapeutic relaxation at home.', order: 6, isActive: true, imageTag: 'massage' },
  { id: 'threading', name: 'Threading & Face Wax', slug: 'threading', description: 'Precision organic eyebrow sculpting and gentle facial hair removal.', order: 7, isActive: true, imageTag: 'threading' },
  { id: 'hair-styling', name: 'Hair Styling & Cut', slug: 'hair-styling', description: 'Professional blowout, curling, party updos, and expert hair trimming.', order: 8, isActive: true, imageTag: 'hair-styling' },
  { id: 'makeup', name: 'Party & Occasion Makeup', slug: 'makeup', description: 'Subtle high-definition soft glam, cocktail, and sangeet makeup artistry.', order: 9, isActive: true, imageTag: 'makeup' },
  { id: 'bridal', name: 'Bridal & Pre-Bridal', slug: 'bridal', description: 'Curated royal wedding transformations, ubtan rituals, and trousseau care.', order: 10, isActive: true, imageTag: 'bridal' }
];

const initialServices: ServiceItem[] = [
  // Waxing
  {
    id: 'srv-wax-full-arms-legs',
    categoryId: 'waxing',
    name: 'Full Arms + Full Legs + Underarms Waxing',
    description: 'Complete silky smooth body waxing with pre-wax antiseptic cleanse and post-wax soothing mint chamomile gel.',
    benefits: ['Smooth hair-free skin for up to 4 weeks', 'Reduces ingrown hairs', 'Gentle on sensitive skin'],
    durationMins: 60,
    originalPrice: 1199,
    sellingPrice: 799,
    discountPercent: 33,
    whatsIncluded: ['Full arms waxing with underarms', 'Full legs waxing', 'Pre-wax sanitization and powder', 'Post-wax calming soothing gel'],
    variants: [
      { id: 'var-wax-honey', name: 'Premium Natural Honey Wax', priceDelta: 0, durationDelta: 0, isDefault: true },
      { id: 'var-wax-rica-white', name: 'Italian Rica White Chocolate (Colophony-Free)', priceDelta: 400, durationDelta: 10 },
      { id: 'var-wax-rica-aloe', name: 'Italian Rica Aloe Vera (Sensitive Skin)', priceDelta: 450, durationDelta: 10 }
    ],
    addons: [
      { id: 'add-wax-stomach', name: 'Stomach Waxing', price: 299, durationMins: 15 },
      { id: 'add-wax-back', name: 'Full Back Waxing', price: 449, durationMins: 20 },
      { id: 'add-wax-bikini', name: 'Rica Bikini Waxing', price: 699, durationMins: 25 }
    ],
    isActive: true,
    isPopular: true,
    isBestseller: true,
    accentBadge: 'Most Booked'
  },
  {
    id: 'srv-wax-full-body',
    categoryId: 'waxing',
    name: 'Luxury Full Body Waxing Ritual',
    description: 'Comprehensive head-to-toe hair removal including full arms, underarms, full legs, full stomach, and full back.',
    benefits: ['Even skin tone and exfoliated texture', 'Colophony-free waxes for minimal redness', 'Ultra-fast appointment execution'],
    durationMins: 90,
    originalPrice: 2499,
    sellingPrice: 1699,
    discountPercent: 32,
    whatsIncluded: ['Full arms & legs', 'Underarms & stomach', 'Full back wax', 'Anti-tan body mist finish'],
    variants: [
      { id: 'var-fb-honey', name: 'Warm Honey Wax', priceDelta: 0, durationDelta: 0, isDefault: true },
      { id: 'var-fb-rica', name: 'Rica Chocolate Luxury Wax', priceDelta: 600, durationDelta: 15 }
    ],
    addons: [
      { id: 'add-tan-pack', name: 'Back De-Tan Brightening Pack', price: 349, durationMins: 15 }
    ],
    isActive: true,
    isPopular: true
  },

  // Facial
  {
    id: 'srv-facial-o3-plus',
    categoryId: 'facial',
    name: 'O3+ Bridal Radiance & Oxygen Glow Facial',
    description: 'Internationally acclaimed oxygenating treatment that instantly lifts dullness, evens pigmentation, and restores luminous glow.',
    benefits: ['Intense cellular oxygenation', 'Fades stubborn sun tan and spots', 'Plumps fine dehydration lines'],
    durationMins: 75,
    originalPrice: 2899,
    sellingPrice: 1999,
    discountPercent: 31,
    whatsIncluded: ['O2 Deep Pore Cleansing', 'Micro-dermabrasion enzymatic scrub', 'Deep lymphatic face & neck massage', 'Oxygen infused serum ampoule', 'Rubberized peel-off brightening mask'],
    variants: [
      { id: 'var-o3-standard', name: 'O3+ Brightening 5-Step', priceDelta: 0, durationDelta: 0, isDefault: true },
      { id: 'var-o3-whitening', name: 'O3+ Whitening D-Tan Special Kit', priceDelta: 350, durationDelta: 10 }
    ],
    addons: [
      { id: 'add-eye-patch', name: 'Hydrating Bio-Cellulose Under-Eye Treatment', price: 249, durationMins: 10 },
      { id: 'add-ice-globes', name: 'Cryo Ice Globe Lymphatic Drainage Massage', price: 299, durationMins: 10 }
    ],
    isActive: true,
    isPopular: true,
    isBestseller: true,
    accentBadge: 'Bridal Favorite'
  },
  {
    id: 'srv-facial-hydra-derma',
    categoryId: 'facial',
    name: 'Signature Hydro-Infusion Glass Skin Facial',
    description: 'Multi-stage vortex aqua suction, hyaluronic acid quenching, and antioxidant vitamin infusions for glass-like Korean glow.',
    benefits: ['Painless blackhead & sebum extraction', 'Deep moisture retention up to 72 hours', 'Visible reduction in enlarged pores'],
    durationMins: 80,
    originalPrice: 3499,
    sellingPrice: 2499,
    discountPercent: 29,
    whatsIncluded: ['Vortex deep cleansing', 'AHA/BHA mild clarifying peel', 'Hydro-vacuum pore extraction', 'Hyaluronic acid galvanic serum infusion', 'Cold hammer pore tightening'],
    variants: [
      { id: 'var-hydra-essential', name: 'Essential Hydro-Glow (6-in-1)', priceDelta: 0, durationDelta: 0, isDefault: true },
      { id: 'var-hydra-gold', name: '24K Gold Stem-Cell Hydro-Infusion', priceDelta: 600, durationDelta: 15 }
    ],
    addons: [
      { id: 'add-neck-decollete', name: 'Neck & Décolleté Extension', price: 499, durationMins: 15 }
    ],
    isActive: true,
    isPopular: true
  },
  {
    id: 'srv-facial-cleanup-herbal',
    categoryId: 'facial',
    name: 'Fruit Enzyme Radiance Cleanup',
    description: 'Quick refresh ritual ideal for frequent maintenance, removing excess sebum, blackheads, and environmental pollutants.',
    benefits: ['Clear fresh skin in 40 minutes', 'No harsh chemicals or irritation', 'Gentle steam and blackhead removal'],
    durationMins: 45,
    originalPrice: 899,
    sellingPrice: 599,
    discountPercent: 33,
    whatsIncluded: ['Gentle cleanse', 'Walnut apricot scrub', 'Ozone steam & blackhead extraction', 'Soothing fruit pack', 'Rose water hydration mist'],
    variants: [
      { id: 'var-cleanup-fruit', name: 'Natural Papaya & Fruit', priceDelta: 0, durationDelta: 0, isDefault: true },
      { id: 'var-cleanup-cheryls', name: "Cheryl's Cosmeceuticals Clarifying", priceDelta: 250, durationDelta: 5 }
    ],
    addons: [
      { id: 'add-face-detan', name: 'Add Instant Face De-Tan Pack', price: 199, durationMins: 10 }
    ],
    isActive: true
  },

  // Manicure & Pedicure
  {
    id: 'srv-pedi-bomb-spa',
    categoryId: 'mani-pedi',
    name: 'Luxury Rose Bath Bomb Foot Spa & Pedicure',
    description: 'Effervescent floral bath bomb soak, volcanic pumice heel smoothing, cuticles detailing, and a deeply relaxing calf massage.',
    benefits: ['Heals cracked heels and calluses', 'Relieves tired feet and muscle tension', 'Nourishes dry nail beds with jojoba oils'],
    durationMins: 55,
    originalPrice: 1199,
    sellingPrice: 799,
    discountPercent: 33,
    whatsIncluded: ['Rose petal effervescent foot bath', 'Deep heel exfoliating scrub', 'Nail shaping and cuticle care', 'Calf & foot reflexology massage (15 mins)', 'Breathable high-shine polish'],
    variants: [
      { id: 'var-pedi-rose', name: 'Damask Rose Petal Soak', priceDelta: 0, durationDelta: 0, isDefault: true },
      { id: 'var-pedi-candle', name: 'Warm Shea Butter Candle Melt Spa', priceDelta: 250, durationDelta: 10 }
    ],
    addons: [
      { id: 'add-mani-classic', name: 'Add Classic Manicure', price: 499, durationMins: 30 },
      { id: 'add-gel-polish', name: 'Long-Wear Gel Polish Upgrade', price: 349, durationMins: 15 }
    ],
    isActive: true,
    isPopular: true,
    isBestseller: true,
    accentBadge: 'Client Love'
  },
  {
    id: 'srv-mani-pedi-combo',
    categoryId: 'mani-pedi',
    name: 'Crystal Spa Manicure & Pedicure Duet',
    description: 'Complete hands and feet pampering ritual with crystal gelatin soak that softens skin, followed by deep pressure massage.',
    benefits: ['Double relaxation for tired limbs', 'Soft velvet touch hands and feet', 'Clean, polished, healthy nail beds'],
    durationMins: 90,
    originalPrice: 1999,
    sellingPrice: 1399,
    discountPercent: 30,
    whatsIncluded: ['Jelly crystal bath soak for hands & feet', 'Detox citrus scrub', 'Cuticle treatment & buffing', 'Hydrating paraffin wrap therapy', 'Long-lasting premium polish'],
    variants: [
      { id: 'var-duet-crystal', name: 'Aroma Crystal Gelatin', priceDelta: 0, durationDelta: 0, isDefault: true },
      { id: 'var-duet-icecream', name: 'Velvet Ice Cream & Berry Bliss', priceDelta: 200, durationDelta: 10 }
    ],
    addons: [
      { id: 'add-foot-pack', name: 'Brightening Foot Peel Mask', price: 299, durationMins: 15 }
    ],
    isActive: true,
    isPopular: true
  },

  // De-Tan & Bleach
  {
    id: 'srv-detan-o3-sara',
    categoryId: 'de-tan',
    name: 'O3+ Sara Milk Protein D-Tan (Face & Neck)',
    description: 'Instant tan removal formula loaded with natural eucalyptus, peppermint, and pure milk proteins that reverses UV damage.',
    benefits: ['Removes harsh sun tan in 20 minutes', 'Calms inflamed sun-damaged skin', 'Leaves no yellow bleach undertones'],
    durationMins: 30,
    originalPrice: 699,
    sellingPrice: 449,
    discountPercent: 36,
    whatsIncluded: ['Pre-cleansing with gentle lotion', 'O3+ D-Tan thick cream application', 'Cool compress removal', 'Moisturizing sunscreen fluid'],
    variants: [
      { id: 'var-detan-faceneck', name: 'Face & Neck', priceDelta: 0, durationDelta: 0, isDefault: true },
      { id: 'var-detan-fullbody', name: 'Full Body De-Tan Add-On', priceDelta: 1400, durationDelta: 45 }
    ],
    addons: [
      { id: 'add-bleach-arms', name: 'Full Arms Herbal Bleach', price: 399, durationMins: 20 }
    ],
    isActive: true,
    isPopular: true
  },

  // Hair Care
  {
    id: 'srv-hair-loreal-spa',
    categoryId: 'hair-care',
    name: "L'Oréal Professionnel Mythic Oil Hair Spa",
    description: 'Intense nourishment for dry, frizzy, or chemically treated hair. Infused with argan and avocado oils with ozone scalp steam.',
    benefits: ['Silky manageable hair', 'Tames frizz even in humid monsoon seasons', 'Re-energizes stressed hair roots with scalp massage'],
    durationMins: 60,
    originalPrice: 1799,
    sellingPrice: 1199,
    discountPercent: 33,
    whatsIncluded: ['Hair & scalp diagnostic', 'Nourishing cream bath massage (25 mins)', 'Portable nano-mist hair steaming', 'Hair rinse & serum glaze', 'Quick blast dry'],
    variants: [
      { id: 'var-hair-mid', name: 'Shoulder to Mid-Back Length', priceDelta: 0, durationDelta: 0, isDefault: true },
      { id: 'var-hair-long', name: 'Waist Length Hair', priceDelta: 300, durationDelta: 15 }
    ],
    addons: [
      { id: 'add-hair-trim', name: 'Split-End Split Polish & Trim', price: 299, durationMins: 15 },
      { id: 'add-olaplex', name: 'Olaplex No.1 & No.2 Bond Multiplier', price: 699, durationMins: 20 }
    ],
    isActive: true,
    isPopular: true
  },

  // Body Massage
  {
    id: 'srv-massage-swedish',
    categoryId: 'massage',
    name: 'Swedish Relaxation Full Body Massage (Female Only)',
    description: 'Long gliding strokes, rhythmic kneading, and warm virgin coconut or sweet almond oils designed to release deep body tension.',
    benefits: ['Increases blood circulation', 'Deep mental relaxation and stress release', 'Relieves shoulder and lower back aches'],
    durationMins: 60,
    originalPrice: 2299,
    sellingPrice: 1599,
    discountPercent: 30,
    whatsIncluded: ['Sanitized single-use disposable bed sheets', 'Choice of essential aromatherapy blend', 'Full back, legs, arms, and neck massage', 'Hot towel compress wiping'],
    variants: [
      { id: 'var-massage-60', name: '60 Minutes Session', priceDelta: 0, durationDelta: 0, isDefault: true },
      { id: 'var-massage-90', name: '90 Minutes Deluxe Session', priceDelta: 700, durationDelta: 30 }
    ],
    addons: [
      { id: 'add-potli-back', name: 'Herbal Ayurvedic Warm Potli Compression', price: 399, durationMins: 15 }
    ],
    isActive: true,
    isPopular: true
  },

  // Threading
  {
    id: 'srv-threading-eyebrow-upperlip',
    categoryId: 'threading',
    name: 'Eyebrow Sculpting + Upper Lip + Chin Threading',
    description: 'Organic antibacterial cotton thread sculpting with aloe vera soothing massage.',
    benefits: ['Flawless arch shaping', 'Clean makeup canvas', 'No chemical reactions'],
    durationMins: 20,
    originalPrice: 199,
    sellingPrice: 129,
    discountPercent: 35,
    whatsIncluded: ['Eyebrow shape consultation', 'Precision threading', 'Upper lip & chin cleanup', 'Cooling astringent aloe dab'],
    variants: [
      { id: 'var-th-basic', name: 'Classic Threading', priceDelta: 0, durationDelta: 0, isDefault: true },
      { id: 'var-th-wax', name: 'Gentle Peel-Off Face Wax Alternative', priceDelta: 120, durationDelta: 5 }
    ],
    addons: [
      { id: 'add-forehead', name: 'Forehead & Sideburns Threading', price: 99, durationMins: 10 }
    ],
    isActive: true
  },

  // Bridal Packages
  {
    id: 'srv-bridal-pre-radiance',
    categoryId: 'bridal',
    name: 'The Royal Pre-Bridal Radiance Journey',
    description: 'Curated 3-hour holistic head-to-toe transformation package designed for brides-to-be, sangeet, or engagement milestones.',
    benefits: ['Flawless 360-degree bridal glow', 'All-inclusive premium Rica & O3+ rituals', 'Executed by Senior Master Beauticians'],
    durationMins: 180,
    originalPrice: 7999,
    sellingPrice: 4999,
    discountPercent: 38,
    whatsIncluded: [
      'Full Body Italian Rica Waxing',
      'O3+ Bridal Radiance Oxygenating Facial',
      'Luxury Crystal Spa Manicure & Pedicure',
      'Full Body Milk Protein De-Tan Pack',
      'Hair Spa & Deep Conditioning Mask',
      'Full Face Threading & Eyebrow Styling'
    ],
    variants: [
      { id: 'var-pre-silver', name: 'Classic Pre-Bridal Glow', priceDelta: 0, durationDelta: 0, isDefault: true },
      { id: 'var-pre-platinum', name: 'Platinum 24K Gold & Hydra Upgrade', priceDelta: 1500, durationDelta: 30 }
    ],
    addons: [
      { id: 'add-bridal-body-polish', name: 'Ubtan Golden Body Polishing Scrub', price: 999, durationMins: 30 }
    ],
    isActive: true,
    isPopular: true,
    isBestseller: true,
    accentBadge: 'Royal Signature'
  }
];

const initialTerritories: Territory[] = [
  // Delhi
  { id: 'ter-del-1', city: 'Delhi', areaName: 'South Delhi (GK, Saket, Vasant Kunj, Hauz Khas)', pincode: '110017', isActive: true, deliveryFee: 0, minOrderAmount: 499 },
  { id: 'ter-del-2', city: 'Delhi', areaName: 'South Delhi (Defense Colony, Lajpat Nagar)', pincode: '110024', isActive: true, deliveryFee: 0, minOrderAmount: 499 },
  { id: 'ter-del-3', city: 'Delhi', areaName: 'Central Delhi (CP, Chanakyapuri, Karol Bagh)', pincode: '110001', isActive: true, deliveryFee: 0, minOrderAmount: 499 },
  { id: 'ter-del-4', city: 'Delhi', areaName: 'West Delhi (Punjabi Bagh, Rajouri Garden)', pincode: '110026', isActive: true, deliveryFee: 0, minOrderAmount: 499 },
  { id: 'ter-del-5', city: 'Delhi', areaName: 'East Delhi (Mayur Vihar, Preet Vihar)', pincode: '110091', isActive: true, deliveryFee: 0, minOrderAmount: 499 },
  { id: 'ter-del-6', city: 'Delhi', areaName: 'North Delhi (Civil Lines, Model Town)', pincode: '110009', isActive: true, deliveryFee: 0, minOrderAmount: 499 },

  // Gurugram
  { id: 'ter-ggn-1', city: 'Gurugram', areaName: 'DLF Phase 1, 2, 3 & Cyber City', pincode: '122002', isActive: true, deliveryFee: 0, minOrderAmount: 499 },
  { id: 'ter-ggn-2', city: 'Gurugram', areaName: 'Golf Course Road & Sector 54, 56', pincode: '122011', isActive: true, deliveryFee: 0, minOrderAmount: 499 },
  { id: 'ter-ggn-3', city: 'Gurugram', areaName: 'Golf Course Extension & Sector 65, 66', pincode: '122018', isActive: true, deliveryFee: 0, minOrderAmount: 499 },
  { id: 'ter-ggn-4', city: 'Gurugram', areaName: 'Sohna Road & Sector 48, 49', pincode: '122001', isActive: true, deliveryFee: 0, minOrderAmount: 499 },

  // Noida
  { id: 'ter-nda-1', city: 'Noida', areaName: 'Sector 15, 16, 18 (Atta Market & Film City)', pincode: '201301', isActive: true, deliveryFee: 0, minOrderAmount: 499 },
  { id: 'ter-nda-2', city: 'Noida', areaName: 'Sector 50, 51, 76, 78 (Expressway Corridor)', pincode: '201307', isActive: true, deliveryFee: 0, minOrderAmount: 499 },
  { id: 'ter-nda-3', city: 'Noida', areaName: 'Sector 128, 137, 142 (Jaypee Greens Corridor)', pincode: '201304', isActive: true, deliveryFee: 0, minOrderAmount: 499 },

  // Greater Noida
  { id: 'ter-gnda-1', city: 'Greater Noida', areaName: 'Pari Chowk, Alpha, Beta & Gamma', pincode: '201310', isActive: true, deliveryFee: 49, minOrderAmount: 599 },
  { id: 'ter-gnda-2', city: 'Greater Noida', areaName: 'Greater Noida West / Noida Extension', pincode: '201306', isActive: true, deliveryFee: 49, minOrderAmount: 599 },

  // Ghaziabad
  { id: 'ter-gzb-1', city: 'Ghaziabad', areaName: 'Indirapuram & Ahinsa Khand', pincode: '201014', isActive: true, deliveryFee: 0, minOrderAmount: 499 },
  { id: 'ter-gzb-2', city: 'Ghaziabad', areaName: 'Vaishali, Kaushambi & Vasundhara', pincode: '201010', isActive: true, deliveryFee: 0, minOrderAmount: 499 },
  { id: 'ter-gzb-3', city: 'Ghaziabad', areaName: 'Raj Nagar Extension & Kavi Nagar', pincode: '201002', isActive: true, deliveryFee: 49, minOrderAmount: 599 },

  // Faridabad
  { id: 'ter-fbd-1', city: 'Faridabad', areaName: 'Sector 14, 15, 16 & Old Faridabad', pincode: '121002', isActive: true, deliveryFee: 0, minOrderAmount: 499 },
  { id: 'ter-fbd-2', city: 'Faridabad', areaName: 'Sector 21C, 28, 29 & Greenfield Colony', pincode: '121001', isActive: true, deliveryFee: 0, minOrderAmount: 499 },
  { id: 'ter-fbd-3', city: 'Faridabad', areaName: 'Greater Faridabad / Neharpar', pincode: '121006', isActive: true, deliveryFee: 49, minOrderAmount: 599 }
];

const initialBeauticians: Beautician[] = [
  {
    id: 'beau-1',
    name: 'Priya Sharma',
    phone: '+91 98112 44321',
    rating: 4.96,
    totalJobs: 428,
    specialties: ['facial', 'bridal', 'de-tan'],
    territories: ['Delhi', 'Gurugram'],
    isActive: true,
    status: 'available',
    experienceYears: 8
  },
  {
    id: 'beau-2',
    name: 'Meenakshi Sen',
    phone: '+91 98731 88920',
    rating: 4.92,
    totalJobs: 382,
    specialties: ['massage', 'waxing', 'mani-pedi'],
    territories: ['Noida', 'Ghaziabad', 'Greater Noida'],
    isActive: true,
    status: 'available',
    experienceYears: 6
  },
  {
    id: 'beau-3',
    name: 'Ananya Verma',
    phone: '+91 99105 12433',
    rating: 4.95,
    totalJobs: 514,
    specialties: ['waxing', 'facial', 'threading'],
    territories: ['Delhi', 'Faridabad'],
    isActive: true,
    status: 'available',
    experienceYears: 9
  },
  {
    id: 'beau-4',
    name: 'Kavita Joshi',
    phone: '+91 98990 77612',
    rating: 4.98,
    totalJobs: 296,
    specialties: ['makeup', 'hair-styling', 'bridal'],
    territories: ['Gurugram', 'Delhi'],
    isActive: true,
    status: 'available',
    experienceYears: 7
  },
  {
    id: 'beau-5',
    name: 'Sunita Rawat',
    phone: '+91 97184 33219',
    rating: 4.89,
    totalJobs: 341,
    specialties: ['mani-pedi', 'waxing', 'hair-care'],
    territories: ['Delhi', 'Noida'],
    isActive: true,
    status: 'available',
    experienceYears: 5
  },
  {
    id: 'beau-6',
    name: 'Pooja Chaudhary',
    phone: '+91 98109 54388',
    rating: 4.97,
    totalJobs: 467,
    specialties: ['facial', 'hair-care', 'massage'],
    territories: ['Gurugram', 'Noida', 'Faridabad'],
    isActive: true,
    status: 'available',
    experienceYears: 8
  }
];

const initialCoupons: Coupon[] = [
  {
    id: 'coup-1',
    code: 'BEAUTYFIRST',
    discountType: 'flat',
    discountValue: 200,
    minOrderAmount: 799,
    maxDiscount: 200,
    expiresAt: '2027-12-31',
    isActive: true,
    description: '₹200 flat savings on your first booking above ₹799'
  },
  {
    id: 'coup-2',
    code: 'GLOW15',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 1299,
    maxDiscount: 450,
    expiresAt: '2027-12-31',
    isActive: true,
    description: '15% extra discount (up to ₹450) on facial and skincare orders'
  },
  {
    id: 'coup-3',
    code: 'NCRBRIDE',
    discountType: 'flat',
    discountValue: 800,
    minOrderAmount: 3999,
    maxDiscount: 800,
    expiresAt: '2027-12-31',
    isActive: true,
    description: '₹800 exclusive savings on royal bridal and pre-bridal packages'
  }
];

const initialBookings: Booking[] = [
  {
    id: 'BD-NCR-1082',
    customerId: 'cust-9811223344',
    customerName: 'Aaradhya Kapoor',
    customerPhone: '+91 98112 23344',
    customerEmail: 'aaradhya.k@example.com',
    address: {
      flat: 'Villa 14, Palm Terraces',
      landmark: 'Near Golf Course Club',
      area: 'Golf Course Road',
      city: 'Gurugram',
      pincode: '122011'
    },
    items: [
      {
        serviceId: 'srv-facial-o3-plus',
        serviceName: 'O3+ Bridal Radiance & Oxygen Glow Facial',
        variantId: 'var-o3-standard',
        variantName: 'O3+ Brightening 5-Step',
        addonIds: ['add-ice-globes'],
        addonNames: ['Cryo Ice Globe Lymphatic Drainage Massage'],
        unitPrice: 1999,
        finalItemPrice: 2298,
        durationMins: 85
      },
      {
        serviceId: 'srv-wax-full-arms-legs',
        serviceName: 'Full Arms + Full Legs + Underarms Waxing',
        variantId: 'var-wax-rica-white',
        variantName: 'Italian Rica White Chocolate',
        addonIds: [],
        addonNames: [],
        unitPrice: 1199,
        finalItemPrice: 1199,
        durationMins: 70
      }
    ],
    subtotal: 3497,
    packageDiscount: 175, // 5% bundle discount
    couponDiscount: 200, // BEAUTYFIRST
    couponCode: 'BEAUTYFIRST',
    deliveryFee: 0,
    totalPayable: 3122,
    appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    appointmentSlot: '11:00 AM',
    paymentMethod: 'COD',
    paymentStatus: 'pending',
    bookingStatus: 'confirmed',
    assignedBeauticianId: 'beau-1',
    internalNotes: 'Client requested fragrance-free after-care aloe gel.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'BD-NCR-1079',
    customerId: 'cust-9871100223',
    customerName: 'Simran Chawla',
    customerPhone: '+91 98711 00223',
    customerEmail: 'simran.c@example.com',
    address: {
      flat: 'B-402, ATS Greens',
      landmark: 'Opposite Sector 50 Market',
      area: 'Sector 50',
      city: 'Noida',
      pincode: '201307'
    },
    items: [
      {
        serviceId: 'srv-pedi-bomb-spa',
        serviceName: 'Luxury Rose Bath Bomb Foot Spa & Pedicure',
        variantId: 'var-pedi-rose',
        variantName: 'Damask Rose Petal Soak',
        addonIds: ['add-mani-classic'],
        addonNames: ['Add Classic Manicure'],
        unitPrice: 799,
        finalItemPrice: 1298,
        durationMins: 85
      }
    ],
    subtotal: 1298,
    packageDiscount: 0,
    couponDiscount: 0,
    deliveryFee: 0,
    totalPayable: 1298,
    appointmentDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    appointmentSlot: '03:00 PM',
    paymentMethod: 'COD',
    paymentStatus: 'pending',
    bookingStatus: 'pending',
    internalNotes: 'Awaiting admin dispatch allocation for Noida Sector 50.',
    createdAt: new Date(Date.now() - 3600000).toISOString()
  }
];

const initialReviews: CustomerReview[] = [
  {
    id: 'rev-1',
    customerName: 'Dr. Radhika Mathur',
    city: 'Vasant Vihar, South Delhi',
    rating: 5,
    comment: 'The hygiene standard is completely unmatched! Priya arrived with a sealed, hospital-grade single-use kit and sanitized each instrument in front of me. The O3+ glow facial left my skin glass-like for my brother’s engagement.',
    serviceName: 'O3+ Bridal Radiance & Oxygen Glow Facial',
    date: '14 Oct 2026',
    source: 'google_places',
    isApproved: true
  },
  {
    id: 'rev-2',
    customerName: 'Natasha Singhal',
    city: 'DLF Phase 5, Gurugram',
    rating: 5,
    comment: 'Having professional Rica waxing done in my own living room while working from home saved me at least 3 hours of Gurgaon traffic. Punctual, courteous, and zero mess left behind. Truly a luxury service.',
    serviceName: 'Full Arms + Full Legs + Underarms Waxing',
    date: '22 Oct 2026',
    source: 'google_places',
    isApproved: true
  },
  {
    id: 'rev-3',
    customerName: 'Anshika Bhardwaj',
    city: 'Sector 128, Noida',
    rating: 5,
    comment: 'The rose petal foot bomb pedicure is heavenly. My heels have never felt this soft, and the calf massage dissolved all my weekday stress. Highly recommend BeautyDoor over crowded retail salons.',
    serviceName: 'Luxury Rose Bath Bomb Foot Spa & Pedicure',
    date: '28 Oct 2026',
    source: 'google_places',
    isApproved: true
  },
  {
    id: 'rev-4',
    customerName: 'Deepika Malhotra',
    city: 'Greater Kailash II, Delhi',
    rating: 5,
    comment: 'Booked the royal pre-bridal journey before my court wedding. Every detail—from the gentle fruit scrubs to the deep conditioning hair spa—was executed with 5-star precision. Pay after service gave great peace of mind.',
    serviceName: 'The Royal Pre-Bridal Radiance Journey',
    date: '30 Oct 2026',
    source: 'verified_customer',
    isApproved: true
  }
];

const initialSettings: BusinessSettings = {
  brandName: 'BeautyDoor',
  tagline: 'Beauty at your doorstep',
  contactPhone: '+91 78277 22522',
  contactEmail: 'hello@beautydoor.in',
  supportWhatsApp: '+91 78277 22522',
  workingHoursStart: '08:00 AM',
  workingHoursEnd: '06:00 PM',
  minOrderAmount: 499,
  cancellationWindowHours: 4,
  cancellationPolicy: 'Free cancellation up to 4 hours prior to your scheduled appointment. Rescheduling is complimentary.',
  announcementBannerText: '✨ Delhi NCR Inaugural Offer: Flat ₹200 OFF on your first at-home appointment with code BEAUTYFIRST',
  isAnnouncementActive: true,
  razorpayEnabled: false,
  codEnabled: true
};

export class Database {
  private static instance: Database;
  private data: DatabaseSchema;

  private constructor() {
    this.data = this.loadData();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading db file, restoring defaults:', e);
    }

    const defaultData: DatabaseSchema = {
      categories: initialCategories,
      services: initialServices,
      territories: initialTerritories,
      beauticians: initialBeauticians,
      bookings: initialBookings,
      coupons: initialCoupons,
      reviews: initialReviews,
      settings: initialSettings
    };
    this.saveData(defaultData);
    return defaultData;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  // Getters
  public getCategories() { return this.data.categories; }
  public getServices() { return this.data.services; }
  public getTerritories() { return this.data.territories; }
  public getBeauticians() { return this.data.beauticians; }
  public getBookings() { return this.data.bookings; }
  public getCoupons() { return this.data.coupons; }
  public getReviews() { return this.data.reviews; }
  public getSettings() { return this.data.settings; }

  // Setters / Updates
  public updateSettings(settings: Partial<BusinessSettings>) {
    this.data.settings = { ...this.data.settings, ...settings };
    this.saveData();
    return this.data.settings;
  }

  public updateService(id: string, updates: Partial<ServiceItem>) {
    const idx = this.data.services.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.data.services[idx] = { ...this.data.services[idx], ...updates };
      this.saveData();
      return this.data.services[idx];
    }
    return null;
  }

  public addService(service: ServiceItem) {
    this.data.services.push(service);
    this.saveData();
    return service;
  }

  public deleteService(id: string) {
    const idx = this.data.services.findIndex(s => s.id === id);
    if (idx !== -1) {
      const removed = this.data.services.splice(idx, 1);
      this.saveData();
      return removed[0];
    }
    return null;
  }

  public toggleCategory(id: string, isActive: boolean) {
    const cat = this.data.categories.find(c => c.id === id);
    if (cat) {
      cat.isActive = isActive;
      this.saveData();
    }
    return cat;
  }

  public toggleTerritory(id: string, isActive: boolean) {
    const ter = this.data.territories.find(t => t.id === id);
    if (ter) {
      ter.isActive = isActive;
      this.saveData();
    }
    return ter;
  }

  public updateTerritory(id: string, updates: Partial<Territory>) {
    const idx = this.data.territories.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.data.territories[idx] = { ...this.data.territories[idx], ...updates };
      this.saveData();
      return this.data.territories[idx];
    }
    return null;
  }

  public addBooking(booking: Booking) {
    this.data.bookings.unshift(booking);
    this.saveData();
    return booking;
  }

  public updateBooking(id: string, updates: Partial<Booking>) {
    const idx = this.data.bookings.findIndex(b => b.id === id);
    if (idx !== -1) {
      this.data.bookings[idx] = { ...this.data.bookings[idx], ...updates };
      this.saveData();
      return this.data.bookings[idx];
    }
    return null;
  }

  public addBeautician(b: Beautician) {
    this.data.beauticians.push(b);
    this.saveData();
    return b;
  }

  public updateBeautician(id: string, updates: Partial<Beautician>) {
    const idx = this.data.beauticians.findIndex(b => b.id === id);
    if (idx !== -1) {
      this.data.beauticians[idx] = { ...this.data.beauticians[idx], ...updates };
      this.saveData();
      return this.data.beauticians[idx];
    }
    return null;
  }

  public addReview(review: CustomerReview) {
    this.data.reviews.unshift(review);
    this.saveData();
    return review;
  }

  public addCoupon(coupon: Coupon) {
    this.data.coupons.push(coupon);
    this.saveData();
    return coupon;
  }

  public toggleCoupon(id: string, isActive: boolean) {
    const cp = this.data.coupons.find(c => c.id === id);
    if (cp) {
      cp.isActive = isActive;
      this.saveData();
    }
    return cp;
  }
}

export const db = Database.getInstance();
