import React from 'react';
import { Phone, Mail, MapPin, ShieldCheck, Heart, MessageCircle } from 'lucide-react';
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-[#382F32]">

          {/* Col 1: Brand & Official Logo Lockup */}
          <div className="lg:col-span-4 space-y-4">
            <img
              src="/assets/aistudio/WhatsApp_Image_2026-11-02_at_3.15.17_PM_49e36dff.jpeg"
              alt="BeautyDoor - Beauty at your doorstep"
              className="h-12 w-auto object-contain rounded-md"
              referrerPolicy="no-referrer"
            />
            <p className="text-xs sm:text-sm text-[#BDB0B2] leading-relaxed max-w-sm font-light">
              BeautyDoor delivers certified master beauticians, hospital-grade single-use kits, and bespoke salon services straight to your doorstep across Delhi NCR.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#C5A880] font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Certified & Background-Verified Female Specialists</span>
            </div>
          </div>

          {/* Col 2: Service Categories */}
          <div className="lg:col-span-3 space-y-3 text-xs">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] text-[#C5A880]">
              Popular Services
            </h4>
            <ul className="space-y-2 text-[#BDB0B2]">
              <li>
                <button onClick={() => onNavigateSection('services')} className="hover:text-white transition-colors">
                  Italian Rica & Honey Waxing
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('services')} className="hover:text-white transition-colors">
                  O3+ & Korean Hydra Glass Facials
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('services')} className="hover:text-white transition-colors">
                  Rose Petal Bath Bomb Pedicures
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('services')} className="hover:text-white transition-colors">
                  L'Oréal Mythic Oil Hair Spas
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('services')} className="hover:text-white transition-colors">
                  Milk Protein De-Tan & Peel
                </button>
              </li>
              <li>
                <button onClick={() => onNavigateSection('services')} className="hover:text-white transition-colors">
                  The Royal Pre-Bridal Radiance
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Delhi NCR Hubs */}
          <div className="lg:col-span-3 space-y-3 text-xs">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] text-[#C5A880]">
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
            <p className="text-xs text-[#C5A880] pt-1 font-semibold">
              Serving All Across Delhi NCR
            </p>
            <div className="pt-2 text-[11px] text-[#A6979A] space-y-0.5 border-t border-[#382F32]">
              <span className="font-semibold text-white">Min Order:</span> Delhi ₹1,000 · Haryana ₹1,500 · Noida ₹1,500
            </div>
          </div>

          {/* Col 4: Customer Support & Helpline */}
          <div className="lg:col-span-2 space-y-3 text-xs">
            <h4 className="font-semibold text-white uppercase tracking-wider text-[11px] text-[#C5A880]">
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
              <p className="text-[11px] text-[#8C7A7C] pt-2">
                Daily Appointments: <br />
                <span className="text-white font-medium">{BUSINESS_CONFIG.operatingHoursDisplay}</span>
              </p>
            </div>
          </div>

        </div>

        {/* Bottom copyright & policies */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8C7A7C]">
          <p>© {new Date().getFullYear()} BeautyDoor Technologies Pvt Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-white transition-colors cursor-pointer">Hygiene Protocols</span>
            <span aria-hidden="true">·</span>
            <span className="hover:text-white transition-colors cursor-pointer">Cancellation Policy</span>
            <span aria-hidden="true">·</span>
            <span className="hover:text-white transition-colors cursor-pointer">Privacy & Terms</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
