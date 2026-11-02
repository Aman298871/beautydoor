import React, { useState } from 'react';
import { Tag, Sparkles, Copy, Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { useRouter } from '../router.tsx';

interface Campaign {
  id: string;
  title: string;
  banner_title: string;
  banner_subtitle: string;
  badge_text?: string;
  cta_label: string;
  destination_url: string;
  discount_val: number;
}

interface Props {
  campaigns: Campaign[];
}

export const OffersPage: React.FC<Props> = ({ campaigns }) => {
  const { navigate } = useRouter();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const coupons = [
    {
      code: 'BEAUTYFIRST',
      title: 'Flat ₹200 OFF on Inaugural Order',
      desc: 'Valid on orders above ₹799 across all Delhi NCR territories.',
      min: '₹799'
    },
    {
      code: 'GLOW15',
      title: '15% Extra Savings on Facial Rituals',
      desc: 'Applicable on O3+ and Korean Hydro-infusion therapies up to ₹500.',
      min: '₹1,499'
    },
    {
      code: 'NCRBRIDE',
      title: '₹800 OFF Royal Bridal Packages',
      desc: 'Exclusive savings on comprehensive 3-hour pre-bridal transformations.',
      min: '₹3,999'
    }
  ];

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="py-12 sm:py-16 bg-[#FAF7F2] min-h-[85vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="max-w-3xl">
          <p className="text-xs text-[#8C7A7C] mb-1">
            <span onClick={() => navigate('/')} className="hover:text-[#4A0417] cursor-pointer">Home</span> / Offers & Coupons
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-1">
            <Tag className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Merchandising Hub</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C]">
            Promotional Offers & Exclusive Codes
          </h1>
          <p className="text-sm text-[#5C4D4F] mt-1 font-light">
            Dynamic promotional pricing configured through BeautyDoor's backend discount engine.
          </p>
        </div>

        {/* Coupons Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-[#1F1A1C]">
            Available Promo Codes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coupons.map((c) => (
              <div
                key={c.code}
                className="bg-white p-6 rounded-2xl border border-[#E8DDD3] shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-[#4A0417] tracking-wider bg-[#FAF7F2] px-3 py-1 rounded border border-[#E8DDD3]">
                      {c.code}
                    </span>
                    <button
                      onClick={() => handleCopy(c.code)}
                      className="text-xs text-[#4A0417] hover:underline flex items-center gap-1 font-semibold"
                    >
                      {copiedCode === c.code ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#C5A880]" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-[#1F1A1C] leading-snug">
                    {c.title}
                  </h3>

                  <p className="text-xs text-[#5C4D4F] leading-relaxed">
                    {c.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#F4EFEA] flex justify-between items-center text-xs text-[#7A6B6D]">
                  <span>Min Booking: <strong className="text-[#1F1A1C]">{c.min}</strong></span>
                  <span className="text-emerald-800 font-semibold">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Campaigns */}
        {campaigns && campaigns.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-[#1F1A1C]">
              Active Seasonal Festivals
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="bg-gradient-to-br from-[#4A0417] to-[#1F1A1C] text-white p-6 sm:p-8 rounded-2xl shadow-md flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    {camp.badge_text && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#C5A880] bg-black/40 px-2.5 py-1 rounded border border-[#C5A880]/30 inline-block">
                        {camp.badge_text}
                      </span>
                    )}

                    <h3 className="text-2xl font-serif font-bold leading-snug text-white">
                      {camp.banner_title}
                    </h3>

                    <p className="text-xs sm:text-sm text-[#E8DDD3] font-light leading-relaxed">
                      {camp.banner_subtitle}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(camp.destination_url || '/services')}
                    className="self-start px-5 py-2.5 bg-white text-[#4A0417] hover:bg-[#FAF7F2] text-xs font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <span>{camp.cta_label || 'Shop Deals'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C5A880]" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
