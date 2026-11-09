/**
 * Centralized Verified Business Configuration for BeautyDoor
 * Single Source of Truth for verified business contact, hours, and policies.
 */

export interface BusinessConfig {
  brandName: string;
  tagline: string;
  contactPerson: string;
  phone: string;
  phoneClean: string;
  phoneTel: string;
  email: string;
  emailMailto: string;
  whatsapp: string;
  whatsappUrl: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  operatingHoursDisplay: string;
  operatingDaysDisplay: string;
  slotSurcharge8am: number;
  slotSurcharge6pm: number;
  cancellationWindowHours: number;
  minimumOrderAmount: number;
  coverageAreas: string;
  hubLocations: string;
}

export const BUSINESS_CONFIG: BusinessConfig = {
  brandName: 'BeautyDoor',
  tagline: 'Beauty at your doorstep',
  contactPerson: 'Preeti Singh',
  phone: '+91 78277 22522',
  phoneClean: '+917827722522',
  phoneTel: 'tel:+917827722522',
  email: 'hello@beautydoor.in',
  emailMailto: 'mailto:hello@beautydoor.in',
  whatsapp: '+91 78277 22522',
  whatsappUrl: 'https://wa.me/917827722522',
  workingHoursStart: '08:00 AM',
  workingHoursEnd: '06:00 PM',
  operatingHoursDisplay: '08:00 AM – 06:00 PM',
  operatingDaysDisplay: '7 Days a Week (Monday – Sunday)',
  slotSurcharge8am: 100,
  slotSurcharge6pm: 100,
  cancellationWindowHours: 4,
  minimumOrderAmount: 499,
  coverageAreas: 'Delhi NCR (Delhi, Gurugram, Noida, Greater Noida, Ghaziabad, Faridabad)',
  hubLocations: 'DLF Phase 2, Gurugram & GK II, Delhi',
};
