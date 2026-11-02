import React from 'react';
import { ShoppingBag, User, MapPin, Sparkles } from 'lucide-react';
import { useRouter } from '../router.tsx';

interface Props {
  cartItemCount: number;
  onOpenCart: () => void;
  onOpenPincodeModal: () => void;
  currentTerritoryName?: string;
}

export const StorefrontNavbar: React.FC<Props> = ({
  cartItemCount,
  onOpenCart,
  onOpenPincodeModal,
  currentTerritoryName
}) => {
  const { path, navigate } = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DDD3] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-8">
        
        {/* Zone 1: Official Brand Logo & Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
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

        {/* Zone 2: 4–5 single-line clean nav links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4A3E3D]">
          <button
            onClick={() => navigate('/services')}
            className={`hover:text-[#4A0417] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 ${
              path.startsWith('/services') || path.startsWith('/service') ? 'text-[#4A0417] font-semibold underline' : ''
            }`}
          >
            Services Catalog
          </button>

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

        {/* Zone 3: 1 Primary Action + Customer Account */}
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
  );
};
