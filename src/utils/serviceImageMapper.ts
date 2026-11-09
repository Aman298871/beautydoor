/**
 * Specific Service Image Resolver for BeautyDoor
 * 
 * Maps every service to an accurate, highly specific photographic representation
 * matching the anatomical zone and treatment protocol.
 * 
 * Rules:
 * 1. Explicit service.image_url / service.imageUrl always takes top priority.
 * 2. Unmatched services resolve to specific, verified zone photography.
 */
export function getServiceImageUrl(service: {
  id?: string;
  name?: string;
  category_id?: string;
  categoryId?: string;
  slug?: string;
  image_url?: string;
  imageUrl?: string;
}): string {
  // 1. TOP PRIORITY: If service has an explicit image_url from database/admin, use it directly!
  const directUrl = service.image_url || service.imageUrl;
  if (directUrl && typeof directUrl === 'string' && directUrl.trim() !== '') {
    return directUrl.trim();
  }

  const name = (service.name || '').toLowerCase();
  const cat = (service.category_id || service.categoryId || '').toLowerCase();
  const id = (service.id || '').toLowerCase();

  // 2. Threading (Eyebrows, Upper Lip, Chin, Forehead)
  if (cat === 'cat-threading' || name.includes('threading')) {
    return '/images/service_eyebrow_threading.jpg';
  }

  // 3. Manicure & Pedicure (Dedicated assets for single vs combined)
  if (name.includes('pedicure') && !name.includes('manicure')) {
    return '/images/service_pedicure_spa.jpg';
  }
  if (name.includes('manicure') && !name.includes('pedicure')) {
    return '/images/service_manicure_spa.jpg';
  }
  if (cat === 'cat-manicure-pedicure' || name.includes('mani-pedi') || (name.includes('manicure') && name.includes('pedicure'))) {
    return '/images/service_manicure_pedicure.jpg';
  }

  // 4. Korean Glass Skin Facials
  if ((cat === 'cat-facials' || name.includes('facial')) && (name.includes('korean') || name.includes('glass'))) {
    return '/images/service_facial_korean_glass.jpg';
  }

  // 5. Facial Cleanups
  if (cat === 'cat-cleanup' || name.includes('cleanup') || name.includes('clean-up')) {
    return '/images/service_cleanup.jpg';
  }

  // 6. Facials: Specific Formulations
  if (name.includes('o3') && (name.includes('shine') || name.includes('glow'))) {
    return '/images/service_facial_o3_shine.jpg';
  }
  if (name.includes('diamond')) {
    return '/images/service_facial_diamond.jpg';
  }
  if (name.includes('gold')) {
    return '/images/service_facial_gold.jpg';
  }
  if (name.includes('wine')) {
    return '/images/service_facial_wine.jpg';
  }
  if (name.includes('pearl')) {
    return '/images/service_facial_pearl.jpg';
  }
  if (name.includes('fruit')) {
    return '/images/service_facial_fruit.jpg';
  }
  if (cat === 'cat-facials' || name.includes('facial')) {
    return '/images/service_facial_treatment.jpg';
  }

  // 7. Bleach & De-Tan (Arms vs Legs vs General)
  if (cat === 'cat-bleach' || cat === 'cat-detan' || name.includes('bleach') || name.includes('de-tan')) {
    if (name.includes('arm') || name.includes('hand')) {
      return '/images/service_bleach_arms.jpg';
    }
    if (name.includes('leg') || name.includes('feet')) {
      return '/images/service_bleach_legs.jpg';
    }
    return '/images/service_detan_bleach.jpg';
  }

  // 8. Massages
  if (name.includes('head massage') || name.includes('scalp') || name.includes('head & shoulder')) {
    return '/images/service_head_massage.jpg';
  }
  if (name.includes('foot massage') || name.includes('feet massage')) {
    return '/images/service_foot_massage.jpg';
  }
  if (name.includes('back massage')) {
    return '/images/service_body_massage.jpg';
  }
  if (cat === 'cat-massage' || name.includes('body massage')) {
    return '/images/service_body_massage.jpg';
  }

  // 9. Body Polishing & Body Scrubs
  if (cat === 'cat-body-scrub' || name.includes('body polishing') || name.includes('scrub pack') || name.includes('body pack')) {
    return '/images/service_body_polishing.jpg';
  }

  // 10. Waxing: Multi-Zone Combos & Full Body
  if (
    name.includes('full body') ||
    name.includes('arms + underarms + full legs') ||
    name.includes('arms + underarms + half legs') ||
    name.includes('front + back')
  ) {
    return '/images/service_full_body_wax_combo.jpg';
  }

  // 11. Waxing: Intimate & Sensitive Areas (Bikini, Brazilian, Butt)
  if (
    name.includes('bikini') ||
    name.includes('brazilian') ||
    name.includes('butt') ||
    id.includes('bikini') ||
    id.includes('brazilian') ||
    id.includes('butt') ||
    cat === 'cat-brazilian-peel-off'
  ) {
    if (name.includes('underarm')) {
      return '/images/service_wax_underarms.jpg';
    }
    return '/images/service_wax_bikini.jpg';
  }

  // 12. Waxing: Underarms
  if ((name.includes('underarm') || id.includes('underarm')) && !name.includes('full arms') && !name.includes('half arms')) {
    return '/images/service_wax_underarms.jpg';
  }

  // 13. Waxing: Back (Full Back, Back Wax)
  if (name.includes('back') && !name.includes('body')) {
    return '/images/service_wax_back.jpg';
  }

  // 14. Waxing: Front (Stomach, Midriff, Chest)
  if ((name.includes('front') || name.includes('stomach') || name.includes('midriff')) && !name.includes('back')) {
    return '/images/service_wax_front.jpg';
  }

  // 15. Waxing: Legs Only (Full Legs, Half Legs)
  if (
    (name.includes('legs') || id.includes('legs')) &&
    !name.includes('arms') &&
    !name.includes('body')
  ) {
    return '/images/service_wax_legs.jpg';
  }

  // 16. Waxing: Cartridge Roll-on
  if (cat === 'cat-rica-rollon') {
    return '/images/service_wax_rollon.jpg';
  }

  // 17. Waxing: Arms / General Waxing
  if (name.includes('arms') || cat.includes('wax')) {
    return '/images/service_waxing_arms_legs.jpg';
  }

  // Fallback
  return '/images/service_facial_treatment.jpg';
}
