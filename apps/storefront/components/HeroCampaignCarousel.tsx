import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Clock, ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react';
import { useRouter } from '../router.tsx';

interface Campaign {
  id: string;
  title: string;
  banner_title: string;
  banner_subtitle: string;
  banner_image_url: string;
  cta_label: string;
  destination_url: string;
  start_time: string;
  end_time: string;
  is_flash_deal: number;
  badge_text?: string;
  discount_val: number;
}

interface Props {
  campaigns: Campaign[];
  onCheckPincode: (pincode: string) => Promise<{ isServiceable: boolean; message: string; territory: any }>;
  onSelectTerritory: (territory: any) => void;
}

export const HeroCampaignCarousel: React.FC<Props> = ({
  campaigns,
  onCheckPincode,
  onSelectTerritory
}) => {
  const { navigate } = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);

  // Pincode lookup state
  const [pincodeInput, setPincodeInput] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<{ isServiceable: boolean; message: string } | null>(null);

  // Auto-advance campaign banners every 6 seconds if multiple
  useEffect(() => {
    if (campaigns.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % campaigns.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [campaigns.length]);

  const activeCampaign = campaigns[currentIdx] || {
    banner_title: 'Luxury Salon Rituals, Curated at Your Doorstep.',
    banner_subtitle: 'Hospital-grade sanitized single-use kits, verified female estheticians, and pay after service across Delhi NCR.',
    cta_label: 'Explore Services',
    destination_url: '/services',
    badge_text: 'Delhi NCR Premier'
  };

  const handlePincodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pincodeInput || pincodeInput.trim().length !== 6) {
      setCheckResult({ isServiceable: false, message: 'Please enter a valid 6-digit Delhi NCR pincode.' });
      return;
    }
    setCheckLoading(true);
    try {
      const res = await onCheckPincode(pincodeInput.trim());
      setCheckResult({ isServiceable: res.isServiceable, message: res.message });
      if (res.territory) {
        onSelectTerritory(res.territory);
      }
    } finally {
      setCheckLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden bg-[#FAF7F2] border-b border-[#E8DDD3] py-10 lg:py-16">
      {/* Subtle luxury ambient pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#4A0417_0.75px,transparent_0.75px)] [background-size:24px_24px] opacity-5 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Campaign Headline & Pincode Checker */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Campaign Kicker & Badge */}
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A0417]">
              <span>{activeCampaign.badge_text || 'Delhi NCR Premier At-Home Salon'}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#8C5D66]">Hospital-Grade Hygiene</span>
            </div>

            {/* Display Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal text-[#1F1A1C] leading-[1.14] tracking-tight text-balance">
              {activeCampaign.banner_title}
            </h1>

            {/* Campaign Subtitle */}
            <p className="text-base sm:text-lg text-[#554749] leading-relaxed max-w-2xl font-light">
              {activeCampaign.banner_subtitle}
            </p>

            {/* Pincode & Locality Verification Card */}
            <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E8DDD3] shadow-xs max-w-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#4A0417] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#4A0417]" />
                  Check Instant Service Availability
                </span>
                <span className="text-xs text-[#8C7A7C]">Delhi · GGN · Noida · GZB · FBD</span>
              </div>

              <form onSubmit={handlePincodeSubmit} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    maxLength={6}
                    value={pincodeInput}
                    onChange={(e) => {
                      setPincodeInput(e.target.value.replace(/\D/g, ''));
                      setCheckResult(null);
                    }}
                    placeholder="Enter 6-digit Delhi NCR pincode (e.g. 110017)"
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417] text-[#1F1A1C] placeholder-[#A09395] tabular-nums"
                  />
                </div>
                <button
                  type="submit"
                  disabled={checkLoading}
                  className="px-5 py-2.5 bg-[#4A0417] hover:bg-[#36020F] text-[#FAF7F2] text-xs font-semibold rounded-md transition-colors whitespace-nowrap disabled:opacity-50 shrink-0"
                >
                  {checkLoading ? 'Checking...' : 'Check Availability'}
                </button>
              </form>

              {checkResult && (
                <div className={`mt-3 p-2.5 rounded text-xs flex items-start gap-2 ${
                  checkResult.isServiceable ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}>
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${checkResult.isServiceable ? 'text-emerald-700' : 'text-amber-700'}`} />
                  <span>{checkResult.message}</span>
                </div>
              )}
            </div>

            {/* Campaign Destination CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => navigate(activeCampaign.destination_url || '/offers')}
                className="px-6 py-3.5 bg-[#4A0417] hover:bg-[#36020F] text-[#FAF7F2] text-sm font-semibold rounded-md shadow-xs hover:shadow transition-all flex items-center gap-2"
              >
                <span>{activeCampaign.cta_label || 'Explore Offers'}</span>
                <ArrowRight className="w-4 h-4 text-[#C5A880]" />
              </button>

              <button
                onClick={() => navigate('/packages')}
                className="px-6 py-3.5 bg-white hover:bg-[#F4EFEA] text-[#4A0417] border border-[#4A0417]/30 text-sm font-semibold rounded-md transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#C5A880]" />
                <span>Build Custom Package</span>
              </button>
            </div>

            {/* Campaign Carousel Dots */}
            {campaigns.length > 1 && (
              <div className="flex items-center gap-2 pt-2">
                {campaigns.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      currentIdx === idx ? 'w-8 bg-[#4A0417]' : 'w-2 bg-[#D8CCC0] hover:bg-[#8C7A7C]'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}

          </div>

          {/* Right Column: High-Grade Editorial Visual Showcase */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden bg-white border border-[#E8DDD3] shadow-md p-3 sm:p-4">
              <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[#4A0417] to-[#1F1A1C] text-[#FAF7F2] aspect-[4/3] flex flex-col justify-between p-6 sm:p-7 shadow-inner">
                
                <div className="relative flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C5A880] bg-black/40 px-3 py-1 rounded backdrop-blur-xs border border-[#C5A880]/30">
                    Doorstep Ritual
                  </span>
                  <span className="text-xs font-medium text-[#FAF7F2]/80">
                    Delhi NCR
                  </span>
                </div>

                <div className="relative my-auto space-y-2 py-4">
                  <p className="font-serif text-2xl sm:text-3xl text-white font-normal leading-snug">
                    “Hospital-grade hygiene meets five-star salon indulgence.”
                  </p>
                  <p className="text-xs text-[#E8DDD3]/90 font-light">
                    100% Single-use sealed kits · Autoclave instruments · Punctual certified estheticians
                  </p>
                </div>

                <div className="relative pt-3 border-t border-white/15 flex items-center justify-between text-xs text-[#FAF7F2]/90">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
                    <span>Verified Female Specialists</span>
                  </div>
                  <span className="text-[#C5A880] font-semibold">Pay After Service (COD)</span>
                </div>

              </div>

              {/* 3 Pillar Summary Strip */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#F0E6DE] text-center">
                <div className="p-2 bg-[#FAF7F2] rounded-lg">
                  <p className="text-xs font-bold text-[#4A0417]">Zero Commute</p>
                  <p className="text-[11px] text-[#6E5D60]">Save 2+ hours</p>
                </div>
                <div className="p-2 bg-[#FAF7F2] rounded-lg">
                  <p className="text-xs font-bold text-[#4A0417]">Pay After</p>
                  <p className="text-[11px] text-[#6E5D60]">Cash or UPI</p>
                </div>
                <div className="p-2 bg-[#FAF7F2] rounded-lg">
                  <p className="text-xs font-bold text-[#4A0417]">Free Cancel</p>
                  <p className="text-[11px] text-[#6E5D60]">Up to 4h prior</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
