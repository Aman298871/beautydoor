import React, { useEffect } from 'react';
import { ShieldCheck, Heart, Sparkles, MapPin, Clock, CheckCircle2, Phone, Mail, ArrowRight, Award, Scissors } from 'lucide-react';
import { useRouter } from '../../router.tsx';
import { BUSINESS_CONFIG } from '../../../../src/config/businessConfig.ts';

interface Props {
  settings?: Record<string, string> | null;
}

export const AboutUsPage: React.FC<Props> = ({ settings }) => {
  const { navigate } = useRouter();

  useEffect(() => {
    document.title = 'About BeautyDoor — Premium Doorstep Salon & Beauty Services in Delhi NCR';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      'BeautyDoor delivers certified female beauticians, salon-grade single-use sanitized kits, and luxury salon rituals straight to your doorstep across Delhi NCR.'
    );
  }, []);

  const legalEntity = settings?.legal_business_name && settings.legal_business_name.trim()
    ? settings.legal_business_name.trim()
    : 'BeautyDoor';

  const operationalAddress = settings?.operational_address && settings.operational_address.trim()
    ? settings.operational_address.trim()
    : BUSINESS_CONFIG.hubLocations;

  return (
    <div className="py-10 sm:py-16 bg-[#FAF7F2] min-h-[85vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="text-xs text-[#8C7A7C]">
          <ol className="flex items-center gap-1.5">
            <li>
              <span onClick={() => navigate('/')} className="hover:text-[#4A0417] cursor-pointer transition-colors font-medium">
                Home
              </span>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-[#4A0417] font-semibold">About Us</li>
          </ol>
        </nav>

        {/* Page Hero Header */}
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8DDD3] text-xs font-semibold text-[#4A0417] shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Official Brand Story & Operating Model</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#1F1A1C] tracking-tight">
            Redefining Salon Luxury at Your Doorstep
          </h1>
          <p className="text-sm sm:text-base text-[#5C4D4F] font-light leading-relaxed max-w-2xl">
            BeautyDoor is an on-demand at-home beauty services platform founded to bring salon-grade grooming rituals, clinical hygiene, and skilled female specialists directly into the comfort and privacy of your home.
          </p>
        </header>

        {/* Mission & The BeautyDoor Model */}
        <section className="bg-white p-6 sm:p-10 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 text-[#4A0417]">
            <Heart className="w-5 h-5 text-[#C5A880]" />
            <h2 className="text-lg sm:text-xl font-serif font-bold text-[#1F1A1C]">
              Why BeautyDoor Exists
            </h2>
          </div>
          <div className="space-y-4 text-xs sm:text-sm text-[#4A3E3D] leading-relaxed font-light">
            <p>
              Traditional high-street salon visits often require navigating congested Delhi NCR traffic, enduring crowded waiting lounges, and accepting compromises on sanitary standards such as multi-use wax pots or reused linens.
            </p>
            <p>
              <strong>BeautyDoor</strong> reimagines the personal care experience from the ground up. We believe that professional self-care should fit effortlessly into your personal schedule. Our certified specialists arrive at your residence fully equipped with portable wax heaters, sterile protective liners, and single-use sealed kits, ensuring your living space remains pristine and your service 100% hygienic.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#E8DDD3]">
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] space-y-1.5">
              <ShieldCheck className="w-5 h-5 text-[#4A0417]" />
              <h3 className="font-bold text-xs sm:text-sm text-[#1F1A1C]">Single-Use Disposables</h3>
              <p className="text-[11px] text-[#6B5A5C] leading-normal">
                Individually sealed bedsheets, towels, wooden spatulas, and mono-dose cosmetic packs opened in your sight.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] space-y-1.5">
              <Award className="w-5 h-5 text-[#4A0417]" />
              <h3 className="font-bold text-xs sm:text-sm text-[#1F1A1C]">Verified Specialists</h3>
              <p className="text-[11px] text-[#6B5A5C] leading-normal">
                Experienced female professionals background-verified and routinely audited for strict protocol adherence.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] space-y-1.5">
              <Clock className="w-5 h-5 text-[#4A0417]" />
              <h3 className="font-bold text-xs sm:text-sm text-[#1F1A1C]">On-Demand Scheduling</h3>
              <p className="text-[11px] text-[#6B5A5C] leading-normal">
                Daily appointment slots from 8:00 AM to 6:00 PM across Delhi NCR with zero hidden travel charges.
              </p>
            </div>
          </div>
        </section>

        {/* Our Service Offerings */}
        <section className="bg-white p-6 sm:p-10 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 text-[#4A0417]">
            <Scissors className="w-5 h-5 text-[#C5A880]" />
            <h2 className="text-lg sm:text-xl font-serif font-bold text-[#1F1A1C]">
              Comprehensive Doorstep Beauty Menu
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#5C4D4F] leading-relaxed">
            Every service in our catalogue is priced transparently and performed using genuine branded formulations:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-[#E8DDD3] bg-[#FAF7F2] space-y-2">
              <h3 className="font-bold text-[#4A0417] text-sm">Skincare & Specialized Facials</h3>
              <p className="text-[#554749] leading-relaxed">
                VLCC Anti-Tan & Glow Facials, O3+ Bridal Whitening, Moonstar Korean Hydra Glass treatments, and herbal fruit revitalizers customized for Indian skin types.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#E8DDD3] bg-[#FAF7F2] space-y-2">
              <h3 className="font-bold text-[#4A0417] text-sm">Gentle & Painless Waxing</h3>
              <p className="text-[#554749] leading-relaxed">
                Imported Italian Rica Waxing, Honey Warm Wax, Roll-On cartridge systems, and Brazilian peel-off waxes with zero double-dipping.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#E8DDD3] bg-[#FAF7F2] space-y-2">
              <h3 className="font-bold text-[#4A0417] text-sm">Manicures & Pedicures</h3>
              <p className="text-[#554749] leading-relaxed">
                Aroma Rose Petal bath bomb soaks, dead-skin buffing, cuticle nourishment, and reflexology hand and foot massages.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-[#E8DDD3] bg-[#FAF7F2] space-y-2">
              <h3 className="font-bold text-[#4A0417] text-sm">Hair & Body Wellness</h3>
              <p className="text-[#554749] leading-relaxed">
                L'Oréal Professional Hair Spas, scalp de-stress rituals, whole-body polishing scrubs, and customized pre-bridal pampering packages.
              </p>
            </div>
          </div>
        </section>

        {/* How Booking Works */}
        <section className="bg-white p-6 sm:p-10 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-6">
          <h2 className="text-lg sm:text-xl font-serif font-bold text-[#1F1A1C]">
            How to Book an Appointment
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] space-y-1.5">
              <span className="w-6 h-6 rounded-full bg-[#4A0417] text-white font-bold flex items-center justify-center text-xs">1</span>
              <h3 className="font-bold text-[#1F1A1C]">Select Treatments</h3>
              <p className="text-[#6B5A5C]">Browse our menu or select curated packages like our ₹999 VLCC special.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] space-y-1.5">
              <span className="w-6 h-6 rounded-full bg-[#4A0417] text-white font-bold flex items-center justify-center text-xs">2</span>
              <h3 className="font-bold text-[#1F1A1C]">Enter Address</h3>
              <p className="text-[#6B5A5C]">Provide your flat number and locality across our Delhi NCR service zones.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] space-y-1.5">
              <span className="w-6 h-6 rounded-full bg-[#4A0417] text-white font-bold flex items-center justify-center text-xs">3</span>
              <h3 className="font-bold text-[#1F1A1C]">Select Time Slot</h3>
              <p className="text-[#6B5A5C]">Choose your preferred date and time from 8:00 AM to 6:00 PM.</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] space-y-1.5">
              <span className="w-6 h-6 rounded-full bg-[#4A0417] text-white font-bold flex items-center justify-center text-xs">4</span>
              <h3 className="font-bold text-[#1F1A1C]">Pay After Service</h3>
              <p className="text-[#6B5A5C]">Confirm booking via COD. Settle via Cash or UPI QR once satisfied.</p>
            </div>
          </div>
        </section>

        {/* Service Locations & Legal Business Details */}
        <section className="bg-white p-6 sm:p-10 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-5 text-xs sm:text-sm text-[#4A3E3D]">
          <div className="flex items-center gap-2 text-[#4A0417]">
            <MapPin className="w-5 h-5 text-[#C5A880]" />
            <h2 className="text-lg font-serif font-bold text-[#1F1A1C]">
              Service Coverage & Operating Footprint
            </h2>
          </div>
          <p className="leading-relaxed">
            BeautyDoor currently operates across all major residential sectors in the National Capital Region (NCR):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E8DDD3]">
              <strong>Delhi:</strong> South Delhi (Saket, GK, Vasant Kunj, Hauz Khas), Central & West Delhi (Connaught Place, Punjabi Bagh, Rajouri Garden, Dwarka).
            </div>
            <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E8DDD3]">
              <strong>Haryana & UP:</strong> Gurugram (DLF Phase 1–5, Golf Course Rd, Sohna Rd), Noida (Sector 18, 50, 128, 137), Greater Noida, Ghaziabad, and Faridabad.
            </div>
          </div>
          <div className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DDD3] space-y-1 text-xs">
            <p><strong>Brand Operating Name:</strong> BeautyDoor</p>
            <p><strong>Legal Entity / Operator:</strong> {legalEntity}</p>
            <p><strong>Primary Operational Hubs:</strong> {operationalAddress}</p>
            <p><strong>Support Helpline:</strong> +91 78277 22522 (Lead: {BUSINESS_CONFIG.contactPerson})</p>
          </div>
        </section>

        {/* CTA Footer */}
        <div className="p-8 rounded-2xl bg-[#4A0417] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-serif font-bold text-[#FAF7F2]">Experience Salon Luxury at Home</h3>
            <p className="text-xs text-[#E8DDD3]">Book your doorstep beauty ritual in 60 seconds with Pay After Service.</p>
          </div>
          <button
            onClick={() => navigate('/pricing')}
            className="px-6 py-3 bg-[#FAF7F2] hover:bg-white text-[#4A0417] text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
          >
            <span>Explore Live Menu & Pricing</span>
            <ArrowRight className="w-4 h-4 text-[#C5A880]" />
          </button>
        </div>

      </div>
    </div>
  );
};
