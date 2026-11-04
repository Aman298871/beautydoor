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

export interface CartItem {
  cartItemId: string;
  service: ServiceItem;
  selectedVariant?: ServiceVariant;
  selectedAddons: ServiceAddon[];
  totalItemPrice: number;
  totalDurationMins: number;
  isPackage?: boolean;
  packageId?: string;
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
  appointmentDate: string;
  appointmentSlot: string;
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
