import React from 'react';
import { ShoppingBag, User, ShieldCheck, MapPin } from 'lucide-react';

interface Props {
  cartItemCount: number;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  onOpenPincodeModal: () => void;
  currentTerritoryName?: string;
  isAdminView: boolean;
  onToggleAdminView: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const Navbar: React.FC<Props> = ({
  cartItemCount,
  onOpenCart,
  onOpenAccount,
  onOpenPincodeModal,
  currentTerritoryName,
  isAdminView,
  onToggleAdminView,
  onNavigateSection
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DDD3] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark / Official Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              if (isAdminView) onToggleAdminView();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center focus:outline-none"
          >
            <img
              src="/assets/aistudio/WhatsApp_Image_2026-11-02_at_3.15.17_PM_49e36dff.jpeg"
              alt="BeautyDoor - Beauty at your doorstep"
              className="h-10 sm:h-12 w-auto object-contain rounded-md shadow-xs hover:opacity-95 transition-opacity"
              referrerPolicy="no-referrer"
            />
          </button>

          {/* Quick Pincode selector badge */}
          <button
            onClick={onOpenPincodeModal}
            className="hidden lg:flex items-center gap-1.5 text-xs text-[#5C4D4F] hover:text-[#4A0417] px-2.5 py-1 rounded-md bg-[#F4EFEA] hover:bg-[#EAE2D8] border border-[#E8DDD3] transition-colors"
            title="Select Delhi NCR location"
          >
            <MapPin className="w-3.5 h-3.5 text-[#4A0417]" />
            <span className="font-medium truncate max-w-[140px]">
              {currentTerritoryName || 'Delhi NCR (Select)'}
            </span>
          </button>
        </div>

        {/* Zone 2: 4–5 single-line nav links with hover underlines */}
        {!isAdminView && (
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#4A3E3D]">
            <button
              onClick={() => onNavigateSection('services')}
              className="hover:text-[#4A0417] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8"
            >
              Services
            </button>
            <button
              onClick={() => onNavigateSection('package-builder')}
              className="hover:text-[#4A0417] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8 text-[#4A0417] font-semibold"
            >
              Build Your Package
            </button>
            <button
              onClick={() => onNavigateSection('hubs')}
              className="hover:text-[#4A0417] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8"
            >
              NCR Coverage
            </button>
            <button
              onClick={() => onNavigateSection('hygiene')}
              className="hover:text-[#4A0417] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8"
            >
              Hygiene Standard
            </button>
            <button
              onClick={() => onNavigateSection('reviews')}
              className="hover:text-[#4A0417] transition-colors whitespace-nowrap shrink-0 hover:underline underline-offset-8"
            >
              Google Reviews
            </button>
          </nav>
        )}

        {isAdminView && (
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#4A0417] bg-[#F4EFEA] px-3 py-1 rounded border border-[#E8DDD3]">
              Admin Operations Control
            </span>
          </div>
        )}

        {/* Zone 3: 1 Primary Action + Utility Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Switch View (Admin / Client) */}
          <button
            onClick={onToggleAdminView}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${
              isAdminView
                ? 'bg-[#1F1A1C] text-[#FAF7F2] border-[#1F1A1C] hover:bg-[#382F32]'
                : 'bg-white text-[#4A0417] border-[#4A0417]/20 hover:bg-[#F4EFEA]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isAdminView ? 'Customer Storefront' : 'Admin Portal'}</span>
          </button>

          {/* Account / My Bookings */}
          {!isAdminView && (
            <button
              onClick={onOpenAccount}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#4A3E3D] hover:text-[#4A0417] rounded-md hover:bg-[#F4EFEA] transition-colors"
              title="My Appointments & Profile"
            >
              <User className="w-4 h-4 text-[#4A0417]" />
              <span className="hidden sm:inline">My Account</span>
            </button>
          )}

          {/* Primary Action Button: Book / Ritual Bag */}
          {!isAdminView && (
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
          )}
        </div>
      </div>
    </header>
  );
};
