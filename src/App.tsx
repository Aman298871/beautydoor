import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  ShoppingBag,
  MapPin,
  Clock,
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import {
  Category,
  ServiceItem,
  ServiceVariant,
  ServiceAddon,
  CartItem,
  Territory,
  CustomerReview,
  Booking,
  BusinessSettings
} from './types.ts';
import { AnnouncementBar } from './components/AnnouncementBar.tsx';
import { Navbar } from './components/Navbar.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { ServiceCard } from './components/ServiceCard.tsx';
import { ServiceDetailModal } from './components/ServiceDetailModal.tsx';
import { PackageBuilderSection } from './components/PackageBuilderSection.tsx';
import { BookingDrawer } from './components/BookingDrawer.tsx';
import { CustomerAccountModal } from './components/CustomerAccountModal.tsx';
import { GoogleReviewsSection } from './components/GoogleReviewsSection.tsx';
import { WriteReviewModal } from './components/WriteReviewModal.tsx';
import { HygienePromiseSection } from './components/HygienePromiseSection.tsx';
import { PincodeCheckerModal } from './components/PincodeCheckerModal.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { Footer } from './components/Footer.tsx';

export default function App() {
  // Storefront catalog data
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Active category and search filter
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart & booking state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);

  // Modals state
  const [activeServiceForDetail, setActiveServiceForDetail] = useState<ServiceItem | null>(null);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);

  // Admin View toggle
  const [isAdminView, setIsAdminView] = useState(false);

  // Success toast/notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Initial Data Fetch
  const loadStoreData = async () => {
    try {
      const [catRes, terRes, revRes] = await Promise.all([
        fetch('/api/catalog').then(r => r.json()),
        fetch('/api/territories').then(r => r.json()),
        fetch('/api/reviews').then(r => r.json())
      ]);

      setCategories(catRes.categories || []);
      setServices(catRes.services || []);
      setSettings(catRes.settings || null);
      setTerritories(terRes.territories || []);
      setReviews(revRes.reviews || []);

      // Default active territory to South Delhi if none selected
      if (!selectedTerritory && terRes.territories?.length > 0) {
        const defaultTer = terRes.territories.find((t: Territory) => t.pincode === '110017') || terRes.territories[0];
        setSelectedTerritory(defaultTer);
      }
    } catch (err) {
      console.error('Failed to load store data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStoreData();
  }, []);

  // Quick Pincode check handler
  const handleCheckPincode = async (pincode: string) => {
    try {
      const res = await fetch('/api/check-pincode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode })
      });
      const data = await res.json();
      return data;
    } catch {
      return { isServiceable: false, message: 'Could not connect to service checker.', territory: null };
    }
  };

  // Add Service to Cart
  const handleAddToCart = (
    service: ServiceItem,
    selectedVariant?: ServiceVariant,
    selectedAddons: ServiceAddon[] = []
  ) => {
    const variantPrice = selectedVariant?.priceDelta || 0;
    const variantDuration = selectedVariant?.durationDelta || 0;
    const addonsPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const addonsDuration = selectedAddons.reduce((sum, a) => sum + a.durationMins, 0);

    const newItem: CartItem = {
      cartItemId: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      service,
      selectedVariant,
      selectedAddons,
      totalItemPrice: service.sellingPrice + variantPrice + addonsPrice,
      totalDurationMins: service.durationMins + variantDuration + addonsDuration
    };

    setCartItems(prev => [...prev, newItem]);
    showToast(`Added "${service.name}" to your booking bag.`);
  };

  const handleQuickAdd = (service: ServiceItem) => {
    // Check if default variant exists
    const defaultVariant = service.variants?.find(v => v.isDefault) || service.variants?.[0];
    handleAddToCart(service, defaultVariant, []);
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCartItems(prev => prev.filter(i => i.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleAddPackageToCart = (packageServices: ServiceItem[]) => {
    packageServices.forEach(s => {
      const defaultVariant = s.variants?.find(v => v.isDefault) || s.variants?.[0];
      handleAddToCart(s, defaultVariant, []);
    });
    setIsCartOpen(true);
    showToast(`Package containing ${packageServices.length} services added to bag with bundle discount!`);
  };

  // Customer cancellations & reschedules
  const handleCancelBooking = async (bookingId: string, phone: string, reason: string) => {
    const res = await fetch('/api/customer/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, phone, reason })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message || 'Appointment cancelled.');
    } else {
      showToast(data.error || 'Failed to cancel appointment.');
    }
  };

  const handleRescheduleBooking = async (bookingId: string, phone: string, newDate: string, newSlot: string) => {
    const res = await fetch('/api/customer/reschedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, phone, newDate, newSlot })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message || 'Appointment rescheduled.');
    } else {
      showToast(data.error || 'Failed to reschedule.');
    }
  };

  // Submit Review
  const handleSubmitReview = async (rev: { customerName: string; city: string; rating: number; comment: string; serviceName: string }) => {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rev)
    });
    const data = await res.json();
    if (res.ok) {
      setReviews(prev => [data.review, ...prev]);
      showToast('Thank you for submitting your verified feedback!');
    }
  };

  // Filtered Services list for display
  const filteredServices = services.filter(s => {
    if (activeCategoryId !== 'all' && s.categoryId !== activeCategoryId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.benefits?.some(b => b.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleNavigateSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // If Admin View is active, render the dedicated Enterprise Operations Center
  if (isAdminView) {
    return (
      <AdminPortal
        onCloseAdmin={() => setIsAdminView(false)}
        onRefreshData={loadStoreData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F1A1C] flex flex-col selection:bg-[#4A0417] selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1F1A1C] text-[#FAF7F2] px-4 py-3 rounded-xl shadow-lg border border-[#C5A880]/40 text-xs sm:text-sm font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom duration-200">
          <Sparkles className="w-4 h-4 text-[#C5A880] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Announcement Bar */}
      <AnnouncementBar
        text={settings?.announcementBannerText || '✨ Delhi NCR: Flat ₹200 OFF on your first booking with code BEAUTYFIRST | Free cancellation'}
        isActive={settings?.isAnnouncementActive ?? true}
      />

      {/* 2. Top Bar Contract Navbar */}
      <Navbar
        cartItemCount={cartItems.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenPincodeModal={() => setIsPincodeModalOpen(true)}
        currentTerritoryName={selectedTerritory?.areaName}
        isAdminView={isAdminView}
        onToggleAdminView={() => setIsAdminView(prev => !prev)}
        onNavigateSection={handleNavigateSection}
      />

      {/* 3. Hero Section */}
      <HeroSection
        onCheckPincode={handleCheckPincode}
        onExploreServices={() => handleNavigateSection('services')}
        onOpenPackageBuilder={() => handleNavigateSection('package-builder')}
        onSelectTerritory={(t) => {
          setSelectedTerritory(t);
          showToast(`Selected area: ${t.areaName}, ${t.city}`);
        }}
      />

      {/* 4. Service Catalog Section */}
      <section id="services" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Professional At-Home Beauty Menu</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-normal text-[#1F1A1C] tracking-tight">
              Curated treatments for every <span className="italic font-medium text-[#4A0417]">occasion.</span>
            </h2>
            <p className="mt-2 text-sm text-[#5C4D4F] font-light max-w-xl">
              From Italian Rica waxing to clinical Hydra glass facials and soothing rose bath bomb pedicures—all delivered to your living room.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-[#8C7A7C] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search facials, waxing, pedicure..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417] text-[#1F1A1C] placeholder-[#9C8C8E]"
            />
          </div>
        </div>

        {/* Category Horizontal Filter Tabs (Button elements as permitted in §1.A) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-4 scrollbar-none border-b border-[#E8DDD3] mb-8 text-xs font-semibold">
          <button
            onClick={() => setActiveCategoryId('all')}
            className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${
              activeCategoryId === 'all'
                ? 'bg-[#4A0417] text-white shadow-xs'
                : 'bg-white text-[#554749] hover:bg-[#F4EFEA] border border-[#E8DDD3]'
            }`}
          >
            All Services ({services.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-4 py-2 rounded-md whitespace-nowrap transition-colors ${
                activeCategoryId === cat.id
                  ? 'bg-[#4A0417] text-white shadow-xs'
                  : 'bg-white text-[#554749] hover:bg-[#F4EFEA] border border-[#E8DDD3]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="h-64 bg-white/70 rounded-xl border border-[#E8DDD3]" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E8DDD3] space-y-3">
            <p className="text-sm font-semibold text-[#1F1A1C]">No services found</p>
            <p className="text-xs text-[#7A6B6D]">
              Try searching for "waxing", "facial", or switch category filter.
            </p>
            <button
              onClick={() => {
                setActiveCategoryId('all');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-[#4A0417] underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => {
              const inCart = cartItems.some(i => i.service.id === service.id);
              return (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onSelectService={(s) => setActiveServiceForDetail(s)}
                  onQuickAdd={handleQuickAdd}
                  isInCart={inCart}
                />
              );
            })}
          </div>
        )}

      </section>

      {/* 5. Custom Package Builder */}
      <PackageBuilderSection
        services={services}
        onAddPackageToCart={handleAddPackageToCart}
      />

      {/* 6. Hospital-Grade Hygiene Promise */}
      <HygienePromiseSection />

      {/* 7. Delhi NCR Active Hubs Section */}
      <section id="hubs" className="py-16 sm:py-20 bg-white border-b border-[#E8DDD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-2">
              <MapPin className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Full Delhi NCR Doorstep Delivery</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-normal text-[#1F1A1C] tracking-tight">
              Six active zones, zero salon commutes.
            </h2>
            <p className="mt-2 text-sm text-[#5C4D4F] font-light">
              Our certified female specialists arrive on time equipped with portable sterilization kits, single-use bed rolls, and premium products.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { city: 'South & Central Delhi', areas: 'GK, Vasant Kunj, Saket, Hauz Khas, Chanakyapuri', note: 'Free doorstep arrival > ₹499' },
              { city: 'DLF & Golf Course GGN', areas: 'DLF Phase 1-5, Golf Course Rd, Cyber City', note: 'Free doorstep arrival > ₹499' },
              { city: 'Noida Hubs', areas: 'Sector 18, 50, 62, 128, Expressway Towers', note: 'Free doorstep arrival > ₹499' },
              { city: 'Greater Noida & West', areas: 'Pari Chowk, Gaur City, Techzone', note: 'Doorstep service available' },
              { city: 'Ghaziabad & Indirapuram', areas: 'Indirapuram, Vaishali, Vasundhara', note: 'Free doorstep arrival > ₹499' },
              { city: 'Faridabad', areas: 'Sector 14, 15, 21, 28, Neharpar', note: 'Free doorstep arrival > ₹499' }
            ].map((hub, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] hover:border-[#4A0417] transition-all group"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 mb-2" />
                <h4 className="text-xs sm:text-sm font-semibold text-[#1F1A1C] group-hover:text-[#4A0417] transition-colors leading-snug">
                  {hub.city}
                </h4>
                <p className="text-[11px] text-[#7A6B6D] mt-1">
                  {hub.areas}
                </p>
                <p className="text-[10px] text-emerald-800 font-semibold mt-2">
                  {hub.note}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-[#6B5A5C]">
              Doorstep services available across all major residential societies and colonies in Delhi NCR. No PIN code required to book.
            </p>
          </div>
        </div>
      </section>

      {/* 8. Genuine Google Reviews */}
      <GoogleReviewsSection
        reviews={reviews}
        onOpenWriteReview={() => setIsWriteReviewOpen(true)}
      />

      {/* 9. Footer */}
      <Footer
        onOpenPincodeModal={() => setIsPincodeModalOpen(true)}
        onNavigateSection={handleNavigateSection}
      />

      {/* Floating Mobile Cart Bar (when bag has items) */}
      {cartItems.length > 0 && !isCartOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1F1A1C] text-[#FAF7F2] p-4 sm:hidden border-t border-[#382F32] flex items-center justify-between shadow-2xl">
          <div>
            <div className="text-xs text-[#C5A880] font-semibold">
              {cartItems.length} {cartItems.length === 1 ? 'Service' : 'Services'} Selected
            </div>
            <div className="text-base font-bold tabular-nums">
              ₹{cartItems.reduce((sum, i) => sum + i.totalItemPrice, 0).toLocaleString('en-IN')}
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="px-5 py-2.5 bg-[#4A0417] hover:bg-[#36020F] text-white text-xs font-semibold rounded-md flex items-center gap-1.5 shadow-xs"
          >
            <ShoppingBag className="w-4 h-4 text-[#C5A880]" />
            <span>View Ritual Bag</span>
          </button>
        </div>
      )}

      {/* Service Detail Customizer Modal */}
      <ServiceDetailModal
        service={activeServiceForDetail}
        onClose={() => setActiveServiceForDetail(null)}
        onAddToCart={handleAddToCart}
      />

      {/* 12-Step Booking Drawer */}
      <BookingDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveCartItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        territories={territories}
        onBookingSuccess={(booking) => {
          showToast(`Booking ${booking.id} confirmed! Assigned to Delhi NCR dispatch.`);
        }}
      />

      {/* Customer Account & Booking History Modal */}
      <CustomerAccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        onCancelBooking={handleCancelBooking}
        onRescheduleBooking={handleRescheduleBooking}
      />

      {/* Pincode & Coverage Directory Modal */}
      <PincodeCheckerModal
        isOpen={isPincodeModalOpen}
        onClose={() => setIsPincodeModalOpen(false)}
        territories={territories}
        onSelectTerritory={(t) => {
          setSelectedTerritory(t);
          showToast(`Active locality set to: ${t.areaName}, ${t.city}`);
        }}
      />

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={isWriteReviewOpen}
        onClose={() => setIsWriteReviewOpen(false)}
        onSubmitReview={handleSubmitReview}
      />

    </div>
  );
}
