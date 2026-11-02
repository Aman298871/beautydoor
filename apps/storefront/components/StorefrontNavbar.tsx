import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, User, MapPin, Sparkles, ChevronDown, Menu, X, Sparkle, Clock, ShieldCheck, Heart } from 'lucide-react';
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

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsServicesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryClick = (catId: string) => {
    setIsServicesOpen(false);
    setIsMobileMenuOpen(false);
    navigate(`/services?category=${catId}`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DDD3] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-6">
          
          {/* Zone 1: Brand Logo & Quick Pincode Selector */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-[#4A0417] hover:bg-[#F4EFEA] rounded-lg transition-colors"
              aria-label="Toggle navigation menu"
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

            {/* Quick Pincode Selector */}
            <button
              onClick={onOpenPincodeModal}
              className="hidden lg:flex items-center gap-1.5 text-xs text-[#5C4D4F] hover:text-[#4A0417] px-2.5 py-1 rounded-md bg-[#F4EFEA] hover:bg-[#EAE2D8] border border-[#E8DDD3] transition-colors"
              title="Check Delhi NCR Service Area"
            >
              <MapPin className="w-3.5 h-3.5 text-[#4A0417]" />
              <span className="font-medium truncate max-w-[130px]">
                {currentTerritoryName || 'Delhi NCR (Select)'}
              </span>
            </button>
          </div>

          {/* Zone 2: Navigation with Services Dropdown Menu */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4A3E3D]">
            
            {/* Services Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsServicesOpen(!isServicesOpen)}
                onMouseEnter={() => setIsServicesOpen(true)}
                className={`flex items-center gap-1 hover:text-[#4A0417] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 ${
                  path.startsWith('/services') || path.startsWith('/service') ? 'text-[#4A0417] font-semibold underline' : ''
                }`}
              >
                <span>Services</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isServicesOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mega Dropdown Menu */}
              {isServicesOpen && (
                <div
                  onMouseLeave={() => setIsServicesOpen(false)}
                  className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#E8DDD3] p-3 grid grid-cols-1 gap-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-3 py-2 border-b border-[#FAF7F2] mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A0417]">
                      Browse Treatments
                    </span>
                    <button
                      onClick={() => { setIsServicesOpen(false); navigate('/services'); }}
                      className="text-[11px] text-[#C5A880] hover:text-[#4A0417] font-semibold"
                    >
                      View All →
                    </button>
                  </div>

                  {categories.length > 0 ? (
                    categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleCategoryClick(c.id)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#FAF7F2] transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-xs font-semibold text-[#1F1A1C] group-hover:text-[#4A0417]">
                            {c.name}
                          </p>
                          {c.description && (
                            <p className="text-[10px] text-[#7A6B6D] line-clamp-1">
                              {c.description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-[#C5A880] group-hover:translate-x-0.5 transition-transform">
                          →
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-[#7A6B6D]">
                      Loading salon categories...
                    </div>
                  )}

                  <div className="mt-1 pt-2 border-t border-[#FAF7F2]">
                    <button
                      onClick={() => { setIsServicesOpen(false); navigate('/packages'); }}
                      className="w-full text-left px-3 py-2 rounded-lg bg-[#FAF7F2] hover:bg-[#EAE2D8] transition-colors flex items-center gap-2 text-xs font-semibold text-[#4A0417]"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>Custom Package Builder (Save up to 20%)</span>
                    </button>
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
              onClick={() => navigate('/packages')}
              className={`hover:text-[#4A0417] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 ${
                path === '/packages' ? 'text-[#4A0417] font-semibold underline' : ''
              }`}
            >
              Custom Packages
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

          {/* Zone 3: Primary Action + Customer Account + Bag */}
          <div className="flex items-center gap-3 shrink-0">
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
              className="relative flex items-center gap-2 px-4 py-2.5 bg-[#4A0417] hover:bg-[#36020F] text-[#FAF7F2] text-xs sm:text-sm font-semibold rounded-md shadow-xs hover:shadow transition-all whitespace-nowrap active:scale-[0.98]"
            >
              <ShoppingBag className="w-4 h-4 text-[#C5A880]" />
              <span>Book Appointment</span>
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

              {/* Service Area Selector for Mobile */}
              <div>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); onOpenPincodeModal(); }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white border border-[#E8DDD3] text-left"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#4A0417]" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#8C7A7C]">Location</p>
                      <p className="text-xs font-semibold text-[#1F1A1C]">
                        {currentTerritoryName || 'Delhi NCR (Select Pincode)'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-[#4A0417] font-semibold">Change</span>
                </button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-2">
                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/services'); }}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white text-sm font-semibold text-[#1F1A1C]"
                >
                  All Services Catalog
                </button>

                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/offers'); }}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white text-sm font-semibold text-[#4A0417] flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#C5A880]" />
                  <span>Today's Best Deals</span>
                </button>

                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/packages'); }}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white text-sm font-semibold text-[#1F1A1C]"
                >
                  Custom Package Builder
                </button>

                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/how-it-works'); }}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white text-sm font-semibold text-[#1F1A1C]"
                >
                  How It Works
                </button>

                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/faq'); }}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white text-sm font-semibold text-[#1F1A1C]"
                >
                  Hygiene & FAQs
                </button>

                <button
                  onClick={() => { setIsMobileMenuOpen(false); navigate('/account'); }}
                  className="w-full text-left py-2 px-3 rounded-lg hover:bg-white text-sm font-semibold text-[#1F1A1C] flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-[#4A0417]" />
                  <span>My Account & Appointments</span>
                </button>
              </div>

              {/* Categories Quick Links */}
              {categories.length > 0 && (
                <div className="pt-4 border-t border-[#E8DDD3]">
                  <p className="text-xs uppercase font-bold text-[#8C7A7C] mb-2 px-3">
                    Categories
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleCategoryClick(c.id)}
                        className="text-left text-xs p-2 rounded-md hover:bg-white text-[#4A3E3D] truncate"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
