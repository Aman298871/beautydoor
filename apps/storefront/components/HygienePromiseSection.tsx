import React from 'react';
import { 
  ShieldCheck, Sparkles, CheckCircle2, Wind, Clock, HeartHandshake, 
  Trash2, AlertCircle, ThermometerSnowflake, Droplets
} from 'lucide-react';

interface HygieneCommitment {
  id: string;
  title: string;
  description: string;
  icon_name?: string;
}

interface Props {
  heading?: string;
  subheading?: string;
  commitments?: HygieneCommitment[];
}

export const HygienePromiseSection: React.FC<Props> = ({
  heading = 'Your Beauty. Your Comfort. Our Hygiene Promise.',
  subheading = 'Salon-quality rituals brought safely to your home with single-use protective disposables, sanitized tools, and verified female specialists.',
  commitments = []
}) => {
  const defaultCommitments = [
    {
      id: 'hyg-1',
      title: 'Single-Use Disposable Waxing Spatulas',
      description: 'Fresh disposable wooden spatulas used for each wax application. We strictly observe zero double-dipping protocol.',
      icon: Sparkles
    },
    {
      id: 'hyg-2',
      title: 'Fresh Disposable Bedsheets & Headbands',
      description: 'A brand-new sealed disposable protective bedsheet and headband laid out in your room for every single visit.',
      icon: ShieldCheck
    },
    {
      id: 'hyg-3',
      title: 'Clean & Sanitized Metal Tools',
      description: 'All tweezers, scissors, and cuticle instruments are thoroughly sterilized and sealed in individual pouches before arrival.',
      icon: CheckCircle2
    },
    {
      id: 'hyg-4',
      title: 'Fresh Clean Service Towels',
      description: 'Clean, freshly laundered towels delivered in sealed pouches for each client appointment.',
      icon: Droplets
    },
    {
      id: 'hyg-5',
      title: 'Monodosage Sealed Skincare Packs',
      description: 'Facials and cleanups utilize single-use, client-specific sealed tubes and packs unsealed exclusively before your eyes.',
      icon: ShieldCheck
    },
    {
      id: 'hyg-6',
      title: 'Proper Hand & Product Hygiene',
      description: 'Specialists practice hand sanitization, wear fresh disposable masks and gloves, and follow professional handling procedures.',
      icon: CheckCircle2
    },
    {
      id: 'hyg-7',
      title: 'Post-Service Area Cleaning & Sanitization',
      description: 'After treatments conclude, our specialist cleans and sanitizes your area, packing all single-use disposables away.',
      icon: Trash2
    },
    {
      id: 'hyg-8',
      title: 'Client Comfort, Sanctuary & Privacy',
      description: 'Strictly female-verified estheticians respecting your household sanctity and personal space at all times.',
      icon: HeartHandshake
    }
  ];

  const itemsToRender = commitments.length > 0 ? commitments : defaultCommitments;

  return (
    <section id="hygiene" className="py-16 sm:py-20 bg-gradient-to-b from-white via-[#FAF7F2] to-white border-y border-[#E8DDD3]/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 bg-[#4A0417]/10 text-[#4A0417] px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase border border-[#4A0417]/20">
            <ShieldCheck className="w-4 h-4 text-[#4A0417]" />
            <span>Verified Safety Protocol</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#1F1A1C] tracking-tight leading-tight">
            {heading}
          </h2>
          <p className="text-sm sm:text-base text-[#6B5A5C] leading-relaxed">
            {subheading}
          </p>
        </div>

        {/* 8-Card Hygiene Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {itemsToRender.map((c, idx) => {
            return (
              <div
                key={c.id || idx}
                className="bg-white rounded-2xl p-6 border border-[#E8DDD3] shadow-xs hover:shadow-md hover:border-[#C5A880]/60 transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] flex items-center justify-center text-[#4A0417] group-hover:bg-[#4A0417] group-hover:text-amber-200 transition-colors">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#1F1A1C] group-hover:text-[#4A0417] transition-colors leading-snug">
                    {c.title}
                  </h3>
                  <p className="text-xs text-[#6B5A5C] leading-relaxed">
                    {c.description}
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-[#F4EFEA] flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Single-use guarantee</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Waxing & At-Home Preparation Instructions Callout */}
        <div className="bg-[#FAF7F2] rounded-3xl p-6 sm:p-8 border border-[#E8DDD3] shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-[#E8DDD3]">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#4A0417] uppercase tracking-wider">Before Your Appointment</span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1F1A1C]">
                Waxing & Treatment Preparation Guide
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#7A6B6D] bg-white px-3 py-1.5 rounded-full border border-[#E8DDD3]">
              <ThermometerSnowflake className="w-4 h-4 text-sky-600" />
              <span>Recommended Room Temp: 22°C – 24°C</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1F1A1C]">
                <Wind className="w-4 h-4 text-[#4A0417]" />
                <h4>Air-Conditioned Room Required</h4>
              </div>
              <p className="text-xs text-[#6B5A5C] leading-relaxed">
                Delhi NCR weather can be humid or warm. A cool, air-conditioned room (or well-ventilated fan area) is necessary so RICA, Honey, Korean, and Brazilian peel-off waxes set cleanly without sticking to skin.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1F1A1C]">
                <Clock className="w-4 h-4 text-[#4A0417]" />
                <h4>Optimal Hair Growth (0.25 inch)</h4>
              </div>
              <p className="text-xs text-[#6B5A5C] leading-relaxed">
                For complete, pain-minimized hair removal, allow approximately 2 to 3 weeks of natural hair growth (at least grain-of-rice length). Avoid shaving right before waxing.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1F1A1C]">
                <Droplets className="w-4 h-4 text-[#4A0417]" />
                <h4>Clean Skin & 24-Hour Aftercare</h4>
              </div>
              <p className="text-xs text-[#6B5A5C] leading-relaxed">
                Ensure skin is clean and dry with no body lotions or oils prior to service. Post-treatment, avoid direct sun exposure, hot baths, swimming, and heavy perspiration for 24 hours.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
