/**
 * Specific Service Image Resolver for BeautyDoor
 * 
 * Maps every service to an accurate, highly specific photographic representation
 * matching the anatomical zone and treatment protocol.
 */
export function getServiceImageUrl(service: {
  id?: string;
  name?: string;
  category_id?: string;
  categoryId?: string;
  slug?: string;
}): string {
  const name = (service.name || '').toLowerCase();
  const cat = (service.category_id || service.categoryId || '').toLowerCase();
  const id = (service.id || '').toLowerCase();

  // 1. Threading (Eyebrows, Upper Lip, Chin, Forehead)
  if (cat === 'cat-threading' || name.includes('threading')) {
    return '/images/service_eyebrow_threading.jpg';
  }

  // 2. Manicure & Pedicure
  if (cat === 'cat-manicure-pedicure' || name.includes('manicure') || name.includes('pedicure') || name.includes('mani-pedi')) {
    return '/images/service_manicure_pedicure.jpg';
  }

  // 3. Korean Glass Skin Facials
  if ((cat === 'cat-facials' || name.includes('facial')) && (name.includes('korean') || name.includes('glass'))) {
    return '/images/service_facial_korean_glass.jpg';
  }

  // 3. Facial Cleanups
  if (cat === 'cat-cleanup' || name.includes('cleanup') || name.includes('clean-up')) {
    return '/images/service_cleanup.jpg';
  }

  // 3. Facials: Specialized Formulations
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

  // 4. Facials (Diamond, O3+, Lotus, Cheryl's, Vedicline)
  if (cat === 'cat-facials' || name.includes('facial')) {
    return '/images/service_facial_treatment.jpg';
  }

  // 5. Bleach & De-Tan (Full Body, Legs, Arms, Back, Face+Neck)
  if (cat === 'cat-bleach' || cat === 'cat-detan' || name.includes('bleach') || name.includes('de-tan')) {
    return '/images/service_detan_bleach.jpg';
  }


  // 7. Massages
  if (name.includes('head massage') || name.includes('scalp') || name.includes('head & shoulder')) {
    return '/images/service_head_massage.jpg';
  }
  if (name.includes('foot massage') || name.includes('feet massage')) {
    return '/images/service_foot_massage.jpg';
  }
  if (name.includes('back massage')) {
    return '/images/service_wax_back.jpg';
  }
  if (cat === 'cat-massage' || name.includes('body massage')) {
    return '/images/service_body_massage.jpg';
  }

  // 8. Body Polishing & Body Scrubs
  if (cat === 'cat-body-scrub' || name.includes('body polishing') || name.includes('scrub pack') || name.includes('body pack')) {
    return '/images/service_body_polishing.jpg';
  }

  // 9. Waxing: Comprehensive Multi-Zone Combos & Full Body
  if (
    name.includes('full body') ||
    name.includes('arms + underarms + full legs') ||
    name.includes('arms + underarms + half legs') ||
    name.includes('front + back')
  ) {
    return '/images/service_full_body_wax_combo.jpg';
  }

  // 10. Waxing: Intimate & Sensitive Areas (Bikini, Brazilian, Butt)
  if (
    name.includes('bikini') ||
    name.includes('brazilian') ||
    name.includes('butt') ||
    id.includes('bikini') ||
    id.includes('brazilian') ||
    id.includes('butt')
  ) {
    return '/images/service_wax_bikini.jpg';
  }

  // 11. Waxing: Underarms
  if ((name.includes('underarm') || id.includes('underarm')) && !name.includes('full arms') && !name.includes('half arms')) {
    return '/images/service_wax_underarms.jpg';
  }

  // 12. Waxing: Back (Full Back, Back Wax)
  if (name.includes('back') && !name.includes('body')) {
    return '/images/service_wax_back.jpg';
  }

  // 13. Waxing: Legs Only (Full Legs, Half Legs)
  if (
    (name.includes('legs') || id.includes('legs')) &&
    !name.includes('arms') &&
    !name.includes('body')
  ) {
    return '/images/service_wax_legs.jpg';
  }

  // 14. Waxing: Arms / Front / Other
  if (name.includes('arms') || name.includes('front') || cat.includes('wax')) {
    return '/images/service_waxing_arms_legs.jpg';
  }

  // Fallback
  return '/images/service_facial_treatment.jpg';
}
