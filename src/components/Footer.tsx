import React from 'react';
import { Phone, Mail, MapPin, ShieldCheck, Heart, MessageCircle, FileText, HelpCircle, ExternalLink } from 'lucide-react';
import { BUSINESS_CONFIG } from '../config/businessConfig.ts';

interface Props {
  onOpenPincodeModal: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const Footer: React.FC<Props> = ({
  onOpenPincodeModal,
  onNavigateSection
}) => {
  return (
    <footer className="bg-[#1F1A1C] text-[#FAF7F2] border-t border-[#382F32] pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-12 border-b border-[#382F32]">

          {/* Col 1: Brand & Official Logo Lockup */}
          <div className="lg:col-span-3 space-y-4">
            <a href="/" className="inline-block" title="BeautyDoor Home">
              <img
                src="/assets/aistudio/WhatsApp_Image_2026-11-02_at_3.15.17_PM_49e36dff.jpeg"
                alt="BeautyDoor - Beauty at your doorstep"
                className="h-12 w-auto object-contain rounded-md"
                referrerPolicy="no-referrer"
              />
            </a>
            <p className="text-xs sm:text-sm text-[#BDB0B2] leading-relaxed font-light">
              BeautyDoor delivers background-verified female beauticians, salon-grade mono-dose kits, and bespoke grooming rituals straight to your doorstep across Delhi NCR.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#C5A880] font-semibold">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Certified Female Salon Specialists</span>
            </div>
            <p className="text-[11px] text-[#8C7A7C] font-mono">
              Cash on Delivery (Pay After Service)
            </p>
          </div>

          {/* Col 2: Service Categories */}
          <div className="lg:col-span-2 space-y-3 text-xs">
            <h4 className="font-semibold uppercase tracking-wider text-[11px] text-[#C5A880]">
              Popular Rituals
            </h4>
            <ul className="space-y-2 text-[#BDB0B2]">
              <li>
                <button onClick={() => onNavigateSection('services')} className="hover:text-white transition-colors text-left cursor-pointer">
                  Italian Rica & Honey Waxing
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('services')} className="hover:text-white transition-colors text-left cursor-pointer">
                  O3+ & Hydra Glass Facials
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('services')} className="hover:text-white transition-colors text-left cursor-pointer">
                  Rose Petal Bath Pedicures
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('services')} className="hover:text-white transition-colors text-left cursor-pointer">
                  L'Oréal Mythic Hair Spas
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('services')} className="hover:text-white transition-colors text-left cursor-pointer">
                  Milk Protein De-Tan & Bleach
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('services')} className="hover:text-white transition-colors text-left cursor-pointer">
                  Signature Packages (₹999)
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Delhi NCR Hubs */}
          <div className="lg:col-span-3 space-y-3 text-xs">
            <h4 className="font-semibold uppercase tracking-wider text-[11px] text-[#C5A880]">
              Active NCR Sectors
            </h4>
            <ul className="space-y-2 text-[#BDB0B2]">
              <li>South Delhi (Vasant Kunj, GK, Saket, Hauz Khas)</li>
              <li>Central & West Delhi (CP, Punjabi Bagh, Rajouri)</li>
              <li>Gurugram (DLF Phase 1-5, Golf Course Rd, Sohna Rd)</li>
              <li>Noida (Sector 18, Sector 50, Sector 128, Sector 137)</li>
              <li>Greater Noida & Ghaziabad (Indirapuram, Vaishali)</li>
              <li>Faridabad (Sector 14, 15, Greenfield Colony)</li>
            </ul>
            <div className="pt-2 text-[11px] text-[#A6979A] space-y-0.5 border-t border-[#382F32]">
              <span className="font-semibold text-white">Min Order:</span> Delhi ₹1,000 · Haryana ₹1,500 · Noida ₹1,500
            </div>
          </div>

          {/* Col 4: Dedicated Policies & Compliance Section */}
          <div className="lg:col-span-2 space-y-3 text-xs">
            <h4 className="font-semibold uppercase tracking-wider text-[11px] text-[#C5A880]">
              Policies & Compliance
            </h4>
            <ul className="space-y-2 text-[#BDB0B2]">
              <li>
                <a href="/about-us" className="hover:text-white hover:underline transition-colors block">
                  About Us
                </a>
              </li>
              <li>
                <a href="/contact-us" className="hover:text-white hover:underline transition-colors block">
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/pricing" className="hover:text-white hover:underline transition-colors block">
                  Pricing & Rate Card
                </a>
              </li>
              <li>
                <a href="/terms-and-conditions" className="hover:text-white hover:underline transition-colors block">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="/privacy-policy" className="hover:text-white hover:underline transition-colors block">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/refund-cancellation-policy" className="hover:text-white hover:underline transition-colors block">
                  Refund & Cancellation
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Customer Support & Helpline */}
          <div className="lg:col-span-2 space-y-3 text-xs">
            <h4 className="font-semibold uppercase tracking-wider text-[11px] text-[#C5A880]">
              Customer Support
            </h4>
            <div className="space-y-2 text-[#BDB0B2]">
              <p className="text-[11px] text-[#C5A880] font-medium">
                Support Lead: {BUSINESS_CONFIG.contactPerson}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                <a
                  href={BUSINESS_CONFIG.phoneTel}
                  className="tabular-nums hover:text-white hover:underline transition-colors"
                  title="Call BeautyDoor Customer Support"
                >
                  {BUSINESS_CONFIG.phone}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <a
                  href={BUSINESS_CONFIG.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tabular-nums hover:text-white hover:underline transition-colors"
                  title="WhatsApp BeautyDoor Support"
                >
                  {BUSINESS_CONFIG.whatsapp}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                <a
                  href={BUSINESS_CONFIG.emailMailto}
                  className="hover:text-white hover:underline transition-colors"
                  title="Email BeautyDoor Client Care"
                >
                  {BUSINESS_CONFIG.email}
                </a>
              </p>
              <p className="text-[11px] text-[#8C7A7C] pt-1">
                Daily Appointments: <br />
                <span className="text-white font-medium">{BUSINESS_CONFIG.operatingHoursDisplay}</span>
              </p>
            </div>
          </div>

        </div>

        {/* Bottom copyright & verified compliance links */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#8C7A7C]">
          <p>© {new Date().getFullYear()} BeautyDoor. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px]">
            <a href="/terms-and-conditions" className="hover:text-[#FAF7F2] transition-colors">
              Terms & Conditions
            </a>
            <span aria-hidden="true" className="text-[#382F32]">·</span>
            <a href="/privacy-policy" className="hover:text-[#FAF7F2] transition-colors">
              Privacy Policy
            </a>
            <span aria-hidden="true" className="text-[#382F32]">·</span>
            <a href="/refund-cancellation-policy" className="hover:text-[#FAF7F2] transition-colors">
              Refund & Cancellation
            </a>
            <span aria-hidden="true" className="text-[#382F32]">·</span>
            <a href="/pricing" className="hover:text-[#FAF7F2] transition-colors">
              Pricing
            </a>
            <span aria-hidden="true" className="text-[#382F32]">·</span>
            <a href="/contact-us" className="hover:text-[#FAF7F2] transition-colors">
              Contact Us
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
};
