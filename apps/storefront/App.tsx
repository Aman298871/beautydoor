import React, { useState, useEffect } from 'react';
import { RouterProvider, useRouter } from './router.tsx';
import { StorefrontNavbar } from './components/StorefrontNavbar.tsx';
import { AnnouncementBar } from '../../src/components/AnnouncementBar.tsx';
import { Footer } from '../../src/components/Footer.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { ServicesPage } from './pages/ServicesPage.tsx';
import { ServiceDetailPage } from './pages/ServiceDetailPage.tsx';
import { OffersPage } from './pages/OffersPage.tsx';
import { HowItWorksPage } from './pages/HowItWorksPage.tsx';
import { AccountPage } from './pages/AccountPage.tsx';
import { AboutPage, ContactPage, FAQPage, PolicyPage } from './pages/InfoPages.tsx';
import { PackagesPage } from './pages/PackagesPage.tsx';
import { RateCardPage } from './pages/RateCardPage.tsx';
import { PackageBuilderSection } from '../../src/components/PackageBuilderSection.tsx';
import { BookingDrawer } from '../../src/components/BookingDrawer.tsx';
import { PincodeCheckerModal } from '../../src/components/PincodeCheckerModal.tsx';
import { WriteReviewModal } from '../../src/components/WriteReviewModal.tsx';
import { CustomerChatbot } from './components/CustomerChatbot.tsx';
import { Sparkles, ShoppingBag } from 'lucide-react';

function StorefrontContent() {
  const { path, params, navigate } = useRouter();

  // Data state
  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [bestsellers, setBestsellers] = useState<any[]>([]);
  const [territories, setTerritories] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [selectedTerritory, setSelectedTerritory] = useState<any>(null);

  // Cart state
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [isWriteReviewOpen, setIsWriteReviewOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      const [catRes, campRes, dealsRes, bestRes, terRes, revRes] = await Promise.all([
        fetch('/api/storefront/catalog').then(r => r.json()),
        fetch('/api/storefront/campaigns').then(r => r.json()),
        fetch('/api/storefront/deals').then(r => r.json()),
        fetch('/api/storefront/bestsellers').then(r => r.json()),
        fetch('/api/storefront/territories').then(r => r.json()),
        fetch('/api/storefront/reviews').then(r => r.json())
      ]);

      setCategories(catRes.categories || []);
      setServices(catRes.services || []);
      setPackages(catRes.packages || []);
      setSettings(catRes.settings || null);
      setCampaigns(campRes.campaigns || []);
      setDeals(dealsRes.deals || []);
      setBestsellers(bestRes.bestsellers || []);
      setTerritories(terRes.territories || []);
      setReviews(revRes.reviews || []);

      if (terRes.territories?.length > 0) {
        const defaultTer = terRes.territories.find((t: any) => t.pincode === '110017') || terRes.territories[0];
        setSelectedTerritory(defaultTer);
      }
    } catch (e) {
      console.error('Failed to load storefront data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCheckPincode = async (pincode: string) => {
    try {
      const res = await fetch('/api/storefront/check-pincode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode })
      });
      return await res.json();
    } catch {
      return { isServiceable: false, message: 'Could not connect to service checker.', territory: null };
    }
  };

  const handleAddToCart = (service: any, variant?: any, addons: any[] = []) => {
    const variantPrice = variant?.priceDelta || variant?.price_delta || 0;
    const variantDuration = variant?.durationDelta || variant?.duration_delta || 0;
    const addonsPrice = addons.reduce((sum, a) => sum + (a.price || 0), 0);
    const addonsDuration = addons.reduce((sum, a) => sum + (a.durationMins || a.duration_mins || 0), 0);

    const newItem = {
      cartItemId: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      service: {
        id: service.id,
        name: service.name,
        sellingPrice: service.sellingPrice || service.selling_price,
        durationMins: service.durationMins || service.duration_mins,
        variants: service.variants || [],
        addons: service.addons || []
      },
      selectedVariant: variant,
      selectedAddons: addons,
      totalItemPrice: (service.sellingPrice || service.selling_price) + variantPrice + addonsPrice,
      totalDurationMins: (service.durationMins || service.duration_mins) + variantDuration + addonsDuration
    };

    setCartItems(prev => [...prev, newItem]);
    showToast(`Added "${service.name}" to your cart.`);
  };

  const handleQuickAdd = (service: any) => {
    const defaultVariant = service.variants?.find((v: any) => v.is_default === 1 || v.isDefault) || service.variants?.[0];
    handleAddToCart(service, defaultVariant, []);
  };

  const handleAddOfficialPackage = (pkg: any, selectedVariant?: string) => {
    const pkgName = selectedVariant ? `${pkg.name} (${selectedVariant})` : pkg.name;
    const newItem = {
      cartItemId: `pkg-${pkg.id}-${Date.now()}`,
      isPackage: true,
      service: {
        id: pkg.id,
        name: pkgName,
        sellingPrice: pkg.selling_price || pkg.sellingPrice,
        durationMins: pkg.duration_mins || pkg.durationMins,
        variants: [],
        addons: []
      },
      selectedVariant: selectedVariant ? { id: selectedVariant, name: selectedVariant, priceDelta: 0, durationDelta: 0 } : undefined,
      selectedAddons: [],
      totalItemPrice: pkg.selling_price || pkg.sellingPrice,
      totalDurationMins: pkg.duration_mins || pkg.durationMins
    };

    setCartItems(prev => [...prev, newItem]);
    setIsCartOpen(true);
    showToast(`Added ready-made package "${pkg.name}" to your cart.`);
  };

  const handleAddCustomizedPackage = (customizedPkg: any) => {
    const newItem = {
      cartItemId: `cust-pkg-${customizedPkg.id}-${Date.now()}`,
      isPackage: true,
      service: {
        id: customizedPkg.id,
        name: customizedPkg.name,
        sellingPrice: customizedPkg.selling_price || customizedPkg.sellingPrice,
        durationMins: customizedPkg.duration_mins || customizedPkg.durationMins,
        variants: [],
        addons: []
      },
      customizedServices: customizedPkg.customizedServices,
      customPackageName: customizedPkg.name,
      selectedVariant: undefined,
      selectedAddons: [],
      totalItemPrice: customizedPkg.selling_price || customizedPkg.sellingPrice,
      totalDurationMins: customizedPkg.duration_mins || customizedPkg.durationMins
    };

    setCartItems(prev => [...prev, newItem as any]);
    setIsCartOpen(true);
    showToast(`Added "${customizedPkg.name}" (${customizedPkg.customizedServices?.length || 0} services) to your cart.`);
  };

  const handleAddPackageToCart = (packageServices: any[]) => {
    packageServices.forEach(s => {
      handleQuickAdd(s);
    });
    setIsCartOpen(true);
    showToast(`Added ${packageServices.length} services to your cart.`);
  };

  const handleSubmitReview = async (rev: any) => {
    try {
      const res = await fetch('/api/storefront/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rev)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Thank you for submitting your verified feedback!');
        loadData();
      } else {
        showToast(data.error || 'Failed to submit review.');
      }
    } catch {
      showToast('Error submitting feedback.');
    }
  };

  const cartItemIds = cartItems.map(i => i.service.id);

  // Route Dispatcher (Strip query parameters for route matching)
  const cleanPath = path.split('?')[0];
  let pageContent: React.ReactNode = null;

  if (cleanPath === '/') {
    pageContent = (
      <HomePage
        campaigns={campaigns}
        deals={deals}
        bestsellers={bestsellers}
        services={services}
        packages={packages}
        reviews={reviews}
        googlePlaceId={settings?.google_place_id}
        onCheckPincode={handleCheckPincode}
        onSelectTerritory={(t) => {
          setSelectedTerritory(t);
          showToast(`Selected area: ${t.area_name}, ${t.city}`);
        }}
        onQuickAdd={handleQuickAdd}
        onAddPackage={handleAddOfficialPackage}
        cartItemIds={cartItemIds}
        onOpenWriteReview={() => setIsWriteReviewOpen(true)}
      />
    );
  } else if (cleanPath === '/services' || cleanPath.startsWith('/services/')) {
    pageContent = (
      <ServicesPage
        services={services}
        categories={categories}
        onQuickAdd={handleQuickAdd}
        cartItemIds={cartItemIds}
      />
    );
  } else if (cleanPath.startsWith('/service/')) {
    pageContent = (
      <ServiceDetailPage
        slug={params.slug}
        onAddToCart={handleAddToCart}
        onOpenCart={() => setIsCartOpen(true)}
      />
    );
  } else if (cleanPath === '/offers') {
    pageContent = <OffersPage campaigns={campaigns} />;
  } else if (cleanPath === '/packages') {
    pageContent = (
      <PackagesPage
        onAddPackageToCart={handleAddOfficialPackage}
        cartItemIds={cartItemIds}
        services={services}
        onAddCustomizedPackage={handleAddCustomizedPackage}
      />
    );
  } else if (cleanPath === '/rate-card') {
    pageContent = <RateCardPage />;
  } else if (path === '/custom-package-builder') {
    pageContent = (
      <div className="py-10 bg-[#FAF7F2] min-h-[85vh]">
        <div className="max-w-7xl mx-auto px-4 mb-4">
          <p className="text-xs text-[#8C7A7C]">
            <span onClick={() => navigate('/')} className="hover:text-[#4A0417] cursor-pointer">Home</span> / Custom Package Builder
          </p>
        </div>
        <PackageBuilderSection
          services={services.map(s => ({
            id: s.id,
            categoryId: s.category_id,
            name: s.name,
            description: s.description,
            benefits: s.benefits || [],
            durationMins: s.duration_mins,
            originalPrice: s.original_price,
            sellingPrice: s.selling_price,
            discountPercent: s.discount_percent,
            whatsIncluded: s.whatsIncluded || [],
            variants: s.variants || [],
            addons: s.addons || [],
            isActive: true
          }))}
          onAddPackageToCart={handleAddPackageToCart}
        />
      </div>
    );
  } else if (path === '/how-it-works') {
    pageContent = <HowItWorksPage />;
  } else if (path === '/about') {
    pageContent = <AboutPage />;
  } else if (path === '/contact') {
    pageContent = <ContactPage />;
  } else if (path === '/faq') {
    pageContent = <FAQPage />;
  } else if (path === '/account' || path === '/login' || path === '/account/bookings' || path === '/account/addresses') {
    pageContent = <AccountPage />;
  } else if (path === '/privacy-policy') {
    pageContent = <PolicyPage type="privacy" />;
  } else if (path === '/terms') {
    pageContent = <PolicyPage type="terms" />;
  } else if (path === '/cancellation-policy') {
    pageContent = <PolicyPage type="cancellation" />;
  } else {
    // Fallback to Home
    pageContent = (
      <HomePage
        campaigns={campaigns}
        deals={deals}
        bestsellers={bestsellers}
        reviews={reviews}
        googlePlaceId={settings?.google_place_id}
        onCheckPincode={handleCheckPincode}
        onSelectTerritory={setSelectedTerritory}
        onQuickAdd={handleQuickAdd}
        cartItemIds={cartItemIds}
        onOpenWriteReview={() => setIsWriteReviewOpen(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1F1A1C] flex flex-col selection:bg-[#4A0417] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1F1A1C] text-[#FAF7F2] px-4 py-3 rounded-xl shadow-lg border border-[#C5A880]/40 text-xs sm:text-sm font-medium flex items-center gap-2 animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-[#C5A880] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Dynamic Announcement Bar */}
      <AnnouncementBar
        text={settings?.announcement_text || '✨ Delhi NCR: Up to 35% OFF on select skincare & waxing rituals | Pay after service'}
        isActive={settings?.announcement_active !== 'false'}
      />

      {/* 2. Top Bar Contract Navbar (NO ADMIN BUTTON) */}
      <StorefrontNavbar
        cartItemCount={cartItems.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenPincodeModal={() => setIsPincodeModalOpen(true)}
        currentTerritoryName={selectedTerritory?.area_name}
        categories={categories}
      />

      {/* 3. Main Multi-Page Content */}
      <main className="flex-1">
        {pageContent}
      </main>

      {/* 4. Luxury Footer */}
      <Footer
        onOpenPincodeModal={() => setIsPincodeModalOpen(true)}
        onNavigateSection={(sec) => {
          if (sec === 'services') navigate('/services');
          else if (sec === 'hubs') setIsPincodeModalOpen(true);
          else if (sec === 'package-builder') navigate('/packages');
          else if (sec === 'hygiene') navigate('/how-it-works');
          else if (sec === 'reviews') navigate('/#reviews');
        }}
      />

      {/* Floating Mobile Cart Bar */}
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
            <span>View Cart</span>
          </button>
        </div>
      )}

      {/* 12-Step Booking Drawer */}
      <BookingDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveCartItem={(id) => setCartItems(prev => prev.filter(i => i.cartItemId !== id))}
        onClearCart={() => setCartItems([])}
        territories={territories.map(t => ({
          id: t.id,
          city: t.city,
          areaName: t.area_name,
          pincode: t.pincode,
          isActive: t.is_active === 1,
          deliveryFee: t.delivery_fee,
          minOrderAmount: t.min_order_amount
        }))}
        onBookingSuccess={(b) => {
          showToast(`Booking ${b.id} placed successfully!`);
        }}
      />

      {/* Pincode Directory Modal */}
      <PincodeCheckerModal
        isOpen={isPincodeModalOpen}
        onClose={() => setIsPincodeModalOpen(false)}
        territories={territories.map(t => ({
          id: t.id,
          city: t.city,
          areaName: t.area_name,
          pincode: t.pincode,
          isActive: t.is_active === 1,
          deliveryFee: t.delivery_fee,
          minOrderAmount: t.min_order_amount
        }))}
        onSelectTerritory={(t) => {
          setSelectedTerritory(t);
          showToast(`Active area set: ${t.areaName}, ${t.city}`);
        }}
      />

      {/* Write Review Modal */}
      <WriteReviewModal
        isOpen={isWriteReviewOpen}
        onClose={() => setIsWriteReviewOpen(false)}
        onSubmitReview={handleSubmitReview}
      />

      {/* Floating Rule-Based Customer FAQ Chatbot (Hidden when booking drawer is active) */}
      <CustomerChatbot isDrawerOpen={isCartOpen} onOpenBookingModal={() => setIsCartOpen(true)} />
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <StorefrontContent />
    </RouterProvider>
  );
}
