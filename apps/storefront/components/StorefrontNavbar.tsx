import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, User, MapPin, Sparkles, ChevronDown, Menu, X, Sparkle, Clock, ShieldCheck, Heart, Phone, MessageCircle } from 'lucide-react';
import { useRouter } from '../router.tsx';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

interface Props {
  cartItemCount: number;
  onOpenCart: () => void;
  onOpenPincodeModal: () => void;
  currentTerritoryName?: string;
  categories?: Category[];
}

export const StorefrontNavbar: React.FC<Props> = ({
  cartItemCount,
  onOpenCart,
  onOpenPincodeModal,
  currentTerritoryName,
  categories = []
}) => {
  const { path, navigate } = useRouter();
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsServicesOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsServicesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleCategoryClick = (catId: string) => {
    setIsServicesOpen(false);
    setIsMobileMenuOpen(false);
    navigate(`/services?category=${catId}`);
  };

  const [mobileServicesExpanded, setMobileServicesExpanded] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DDD3] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
          
          {/* Zone 1: Brand Logo & Area Indicator */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-[#4A0417] hover:bg-[#F4EFEA] rounded-lg transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <button
              onClick={() => navigate('/')}
              className="flex items-center focus:outline-none"
              aria-label="BeautyDoor Home"
            >
              <img
                src="/assets/aistudio/WhatsApp_Image_2026-11-02_at_3.15.17_PM_49e36dff.jpeg"
                alt="BeautyDoor — Beauty at your doorstep"
                className="h-10 sm:h-12 w-auto object-contain rounded-md shadow-xs hover:opacity-95 transition-opacity"
                referrerPolicy="no-referrer"
              />
            </button>

            {/* Quick Area Indicator */}
            <div
              className="hidden lg:flex items-center gap-1.5 text-xs text-[#5C4D4F] px-2.5 py-1 rounded-md bg-[#F4EFEA] border border-[#E8DDD3]"
              title="Delhi NCR Doorstep Delivery"
            >
              <MapPin className="w-3.5 h-3.5 text-[#4A0417]" />
              <span className="font-medium truncate max-w-[150px]">
                {currentTerritoryName || 'Delhi NCR Service Area'}
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation with Accessible Luxury Mega Menu */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4A3E3D]" aria-label="Main Navigation">
            
            {/* Services Dropdown */}
            <div 
              className="relative" 
              ref={dropdownRef}
              onMouseEnter={() => setIsServicesOpen(true)}
              onMouseLeave={() => setIsServicesOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsServicesOpen(!isServicesOpen)}
                aria-expanded={isServicesOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1.5 py-2 hover:text-[#4A0417] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 cursor-pointer ${
                  path.startsWith('/services') || path.startsWith('/service') ? 'text-[#4A0417] font-semibold underline' : ''
                }`}
              >
                <span>Services</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isServicesOpen ? 'rotate-180 text-[#4A0417]' : 'text-[#8C7A7C]'}`} />
              </button>

              {/* Accessible Mega Dropdown with Hover Bridge */}
              {isServicesOpen && (
                <div
                  role="menu"
                  aria-label="Salon & Spa Categories"
                  className="absolute left-0 top-full pt-2 w-[680px] z-50 animate-in fade-in slide-in-from-top-2 duration-150 before:absolute before:-top-3 before:left-0 before:right-0 before:h-3 before:content-['']"
                >
                  <div className="bg-white rounded-2xl shadow-2xl border border-[#E8DDD3] p-5">
                    {/* Mega Menu Header */}
                    <div className="pb-3 border-b border-[#F4EFEA] mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#C5A880]" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[#4A0417]">
                          Delhi NCR Salon Menu
                        </span>
                      </div>
                      <button
                        onClick={() => { setIsServicesOpen(false); navigate('/services'); }}
                        className="text-xs text-[#4A0417] hover:text-[#36020F] font-semibold flex items-center gap-1 group cursor-pointer"
                      >
                        <span>View All Treatments</span>
                        <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                      </button>
                    </div>

                    {/* 2-Column Category Grid */}
                    {categories.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
                        {categories.map((c) => (
                          <button
                            key={c.id}
                            role="menuitem"
                            onClick={() => handleCategoryClick(c.id)}
                            className="w-full text-left p-2.5 rounded-xl hover:bg-[#FAF7F2] transition-colors flex items-start justify-between group border border-transparent hover:border-[#E8DDD3] cursor-pointer"
                          >
                            <div className="pr-2">
                              <p className="text-xs font-semibold text-[#1F1A1C] group-hover:text-[#4A0417] transition-colors">
                                {c.name}
                              </p>
                              {c.description ? (
                                <p className="text-[11px] text-[#7A6B6D] line-clamp-1 mt-0.5 font-light">
                                  {c.description}
                                </p>
                              ) : (
                                <p className="text-[11px] text-[#8C7A7C] mt-0.5 font-light">
                                  Premium at-home ritual
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-[#C5A880] group-hover:text-[#4A0417] group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5">
                              →
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-xs text-[#7A6B6D]">
                        Loading treatments...
                      </div>
                    )}

                    {/* Mega Menu Footer Actions */}
                    <div className="mt-3 pt-3 border-t border-[#F4EFEA] flex items-center justify-between gap-3 text-xs">
                      <button
                        onClick={() => { setIsServicesOpen(false); navigate('/packages'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#EAE2D8] text-[#4A0417] font-semibold transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>Ready-Made Packages (Save up to 20%)</span>
                      </button>

                      <button
                        onClick={() => { setIsServicesOpen(false); navigate('/rate-card'); }}
                        className="text-[#7A6B6D] hover:text-[#4A0417] font-medium transition-colors cursor-pointer"
                      >
                        Download Rate Card PDF
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/offers')}
              className={`hover:text-[#4A0417] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 flex items-center gap-1.5 ${
                path === '/offers' ? 'text-[#4A0417] font-semibold underline' : 'text-[#4A0417]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Today's Deals</span>
            </button>

            <button
              onClick={() => navigate('/rate-card')}
              className={`hover:text-[#4A0417] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 flex items-center gap-1 ${
                path === '/rate-card' ? 'text-[#4A0417] font-semibold underline' : ''
              }`}
            >
              <span>Rate Card</span>
            </button>

            <button
              onClick={() => navigate('/packages')}
              className={`hover:text-[#4A0417] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 ${
                path === '/packages' ? 'text-[#4A0417] font-semibold underline' : ''
              }`}
            >
              Packages
            </button>

            <button
              onClick={() => navigate('/how-it-works')}
              className={`hover:text-[#4A0417] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 ${
                path === '/how-it-works' ? 'text-[#4A0417] font-semibold underline' : ''
              }`}
            >
              How It Works
            </button>

            <button
              onClick={() => navigate('/faq')}
              className={`hover:text-[#4A0417] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 ${
                path === '/faq' ? 'text-[#4A0417] font-semibold underline' : ''
              }`}
            >
              Hygiene & FAQ
            </button>
          </nav>

          {/* Zone 3: Primary Action + Direct Contact + Customer Account + Bag */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Direct Action: Call */}
            <a
              href="tel:+917827722522"
              className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-[#4A0417] bg-[#F4EFEA] hover:bg-[#E8DDD3] border border-[#E8DDD3] rounded-md transition-colors shadow-xs"
              title="Call Helpline (+91 78277 22522)"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Call</span>
            </a>

            {/* Direct Action: WhatsApp */}
            <a
              href="https://wa.me/917827722522?text=Hi%20BeautyDoor%2C%20I%20would%20like%20to%20enquire%20about%20your%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors shadow-xs"
              title="Chat on WhatsApp (+91 78277 22522)"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>

            <button
              onClick={() => navigate('/account')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#4A3E3D] hover:text-[#4A0417] rounded-md hover:bg-[#F4EFEA] transition-colors"
              title="Customer Profile & Appointments"
            >
              <User className="w-4 h-4 text-[#4A0417]" />
              <span className="hidden sm:inline">My Account</span>
            </button>

            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#4A0417] hover:bg-[#36020F] text-[#FAF7F2] text-xs sm:text-sm font-semibold rounded-md shadow-xs hover:shadow transition-all whitespace-nowrap active:scale-[0.98]"
            >
              <ShoppingBag className="w-4 h-4 text-[#C5A880]" />
              <span className="hidden xs:inline">Book Appointment</span>
              <span className="xs:hidden">Book</span>
              {cartItemCount > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-[#C5A880] text-[#1F1A1C] font-bold text-xs flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Slide-Out Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-sm bg-[#FAF7F2] h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-6 z-10">
            <div className="space-y-6">
              
              {/* Header with Close */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E8DDD3]">
                <img
                  src="/assets/aistudio/WhatsApp_Image_2026-11-02_at_3.15.17_PM_49e36dff.jpeg"
                  alt="BeautyDoor"
                  className="h-9 w-auto object-contain"
                />
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-[#5C4D4F] hover:text-[#1F1A1C] rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Service Area Badge for Mobile */}
              <div className="p-3 rounded-xl bg-white border border-[#E8DDD3] text-left flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-[#4A0417] shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-[#8C7A7C]">Service Area</p>
                    <p className="text-xs font-semibold text-[#1F1A1C]">
                      {currentTerritoryName || 'Delhi NCR (Doorstep Service)'}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Active
                </span>
              </div>

              {/* Direct Mobile Quick Actions: Call & WhatsApp */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="tel:+917827722522"
                  className="py-2.5 px-3 bg-white hover:bg-[#F4EFEA] border border-[#E8DDD3] rounded-xl text-xs font-semibold text-[#4A0417] flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#4A0417]" />
                  <span>Call Concierge</span>
                </a>
                <a
                  href="https://wa.me/917827722522?text=Hi%20BeautyDoor%2C%20I%20would%20like%20to%20enquire%20about%20your%20services."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp Us</span>
                </a>
              </div>

              {/* Minimum Order Policy Badge for Mobile */}
              <div className="p-3 rounded-xl bg-[#F4EFEA] border border-[#E8DDD3] text-[11px] text-[#5C4D4F] space-y-1">
                <div className="font-bold text-[#1F1A1C]">Minimum Booking Policy:</div>
                <div className="grid grid-cols-3 gap-1 font-mono text-[10px] text-[#4A0417] font-bold">
                  <span>Delhi: ₹1k</span>
                  <span>Haryana: ₹1.5k</span>
                  <span>Noida: ₹1.5k</span>
                </div>
                <p className="text-[10px] text-[#7A6B6D] pt-0.5">
                  Delhi ₹1,000 · Haryana ₹1,500 · Noida ₹1,500
                </p>
              </div>

              {/* Navigation Links with Expandable Services Accordion */}
              <div className="space-y-1.5">
                {/* Services Accordion */}
                <div className="border border-[#E8DDD3] rounded-xl bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setMobileServicesExpanded(!mobileServicesExpanded)}
                    className="w-full flex items-center justify-between py-2.5 px-3.5 text-sm font-semibold text-[#1F1A1C] hover:bg-[#FAF7F2] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#C5A880]" />
                      <span>All Beauty Services</span>
                    </span>
                    <ChevronDown className={`w-4 h-4 text-[#8C7A7C] transition-transform duration-200 ${mobileServicesExpanded ? 'rotate-180 text-[#4A0417]' : ''}`} />
                  </button>

                  {mobileServicesExpanded && (
                    <div className="border-t border-[#F4EFEA] bg-[#FAF7F2] p-2 space-y-1 max-h-60 overflow-y-auto">
                      <button
                        onClick={() => { setIsMobileMenuOpen(false); navigate('/services'); }}
                        className="w-full text-left py-2 px-3 rounded-lg text-xs font-bold text-[#4A0417] hover:bg-white transition-colors flex items-center justify-between"
                      >
                        <span>View All Treatments</span>
                        <span>→</span>
                      </button>
                      {categories.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleCategoryClick(c.id)}
                          className="w-full text-left py-1.5 px-3 rounded-lg text-xs text-[#3D3335] hover:bg-white hover:text-[#4A0417] transition-colors flex items-center justify-between"
                        >
                          <span className="truncate">{c.name}</span>
                          <span className="text-[#C5A880]">→</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/offers'); }}
                  className="w-full text-left py-2.5 px-3.5 rounded-xl bg-white border border-[#E8DDD3] hover:bg-[#FAF7F2] text-sm font-semibold text-[#4A0417] flex items-center gap-2 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-[#C5A880]" />
                  <span>Today's Best Deals</span>
                </button>

                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/packages'); }}
                  className="w-full text-left py-2.5 px-3.5 rounded-xl bg-white border border-[#E8DDD3] hover:bg-[#FAF7F2] text-sm font-semibold text-[#1F1A1C] transition-colors"
                >
                  Custom Package Builder
                </button>

                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/rate-card'); }}
                  className="w-full text-left py-2.5 px-3.5 rounded-xl bg-white border border-[#E8DDD3] hover:bg-[#FAF7F2] text-sm font-semibold text-[#1F1A1C] transition-colors"
                >
                  Download Rate Card
                </button>

                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/how-it-works'); }}
                  className="w-full text-left py-2.5 px-3.5 rounded-xl bg-white border border-[#E8DDD3] hover:bg-[#FAF7F2] text-sm font-semibold text-[#1F1A1C] transition-colors"
                >
                  How It Works
                </button>

                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/faq'); }}
                  className="w-full text-left py-2.5 px-3.5 rounded-xl bg-white border border-[#E8DDD3] hover:bg-[#FAF7F2] text-sm font-semibold text-[#1F1A1C] transition-colors"
                >
                  Hygiene Protocol & FAQ
                </button>

                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/account'); }}
                  className="w-full text-left py-2.5 px-3.5 rounded-xl bg-white border border-[#E8DDD3] hover:bg-[#FAF7F2] text-sm font-semibold text-[#1F1A1C] flex items-center gap-2 transition-colors"
                >
                  <User className="w-4 h-4 text-[#4A0417]" />
                  <span>My Account & Appointments</span>
                </button>
              </div>
            </div>

            {/* Bottom Book Button */}
            <div className="pt-6 border-t border-[#E8DDD3]">
              <button
                onClick={() => { setIsMobileMenuOpen(false); onOpenCart(); }}
                className="w-full py-3 bg-[#4A0417] text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-md"
              >
                <ShoppingBag className="w-4 h-4 text-[#C5A880]" />
                <span>Book Appointment {cartItemCount > 0 ? `(${cartItemCount})` : ''}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Mobile Bottom Navigation Bar (App-like ergonomics) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-t border-[#E8DDD3] flex items-center justify-around py-2 px-2 shadow-lg">
        <button
          onClick={() => navigate('/')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded text-[10px] font-medium transition-colors ${
            path === '/' ? 'text-[#4A0417] font-bold' : 'text-[#7A6B6D]'
          }`}
        >
          <Sparkle className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => navigate('/services')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded text-[10px] font-medium transition-colors ${
            path.startsWith('/services') ? 'text-[#4A0417] font-bold' : 'text-[#7A6B6D]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Services</span>
        </button>

        <button
          onClick={() => navigate('/packages')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded text-[10px] font-medium transition-colors ${
            path === '/packages' ? 'text-[#4A0417] font-bold' : 'text-[#7A6B6D]'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span>Packages</span>
        </button>

        <button
          onClick={() => navigate('/offers')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded text-[10px] font-medium transition-colors ${
            path === '/offers' ? 'text-[#4A0417] font-bold' : 'text-[#7A6B6D]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#C5A880]" />
          <span>Deals</span>
        </button>

        <button
          onClick={onOpenCart}
          className="relative flex flex-col items-center gap-1 py-1 px-3 rounded text-[10px] font-medium text-[#4A0417]"
        >
          <div className="relative">
            <ShoppingBag className="w-4 h-4" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-[#4A0417] text-white text-[9px] font-bold flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </div>
          <span>Bag</span>
        </button>
      </div>
    </>
  );
};
