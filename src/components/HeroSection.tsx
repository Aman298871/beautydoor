import React, { useState } from 'react';
import { Shield, Sparkles, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { Territory } from '../types.ts';

interface Props {
  onCheckPincode: (pincode: string) => Promise<{ isServiceable: boolean; message: string; territory: Territory | null }>;
  onExploreServices: () => void;
  onOpenPackageBuilder: () => void;
  onSelectTerritory: (territory: Territory) => void;
}

export const HeroSection: React.FC<Props> = ({
  onCheckPincode,
  onExploreServices,
  onOpenPackageBuilder,
  onSelectTerritory
}) => {
  const [pincodeInput, setPincodeInput] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<{ isServiceable: boolean; message: string } | null>(null);

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
    <section className="relative overflow-hidden bg-[#FAF7F2] border-b border-[#E8DDD3] pt-6 pb-16 lg:py-20">
      {/* Subtle luxury ambient pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#4A0417_0.75px,transparent_0.75px)] [background-size:24px_24px] opacity-4 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Editorial Brand & Headlines */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Editorial Kicker (Unboxed metadata with separator) */}
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#4A0417] uppercase">
              <span>Delhi NCR Premier At-Home Salon</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#8C5D66]">Hospital-Grade Hygiene</span>
            </div>

            {/* Display Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal text-[#1F1A1C] leading-[1.12] tracking-tight text-balance">
              Luxury salon rituals, thoughtfully curated at your <span className="italic font-medium text-[#4A0417]">doorstep.</span>
            </h1>

            {/* Refined Body Description */}
            <p className="text-base sm:text-lg text-[#554749] leading-relaxed max-w-2xl font-light">
              Experience the tranquility of a five-star spa in the privacy of your home. Certified female beauticians, single-use sealed kits, and bespoke beauty treatments across South Delhi, Gurugram, Noida, and NCR.
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
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417] focus:ring-1 focus:ring-[#4A0417] text-[#1F1A1C] placeholder-[#A09395] tabular-nums"
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

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={onExploreServices}
                className="px-6 py-3.5 bg-[#4A0417] hover:bg-[#36020F] text-[#FAF7F2] text-sm font-semibold rounded-md shadow-xs hover:shadow transition-all flex items-center gap-2"
              >
                <span>Explore All Services</span>
                <ArrowRight className="w-4 h-4 text-[#C5A880]" />
              </button>
              <button
                onClick={onOpenPackageBuilder}
                className="px-6 py-3.5 bg-white hover:bg-[#F4EFEA] text-[#4A0417] border border-[#4A0417]/30 text-sm font-semibold rounded-md transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#C5A880]" />
                <span>Build Custom Package (Save Up to 20%)</span>
              </button>
            </div>

          </div>

          {/* Right Column: Editorial Visual Showcase */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer decorative card frame */}
              <div className="relative rounded-2xl overflow-hidden bg-white border border-[#E8DDD3] shadow-md p-3 sm:p-4">
                
                {/* Hero Feature Visual with elegant styling */}
                <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[#4A0417] to-[#1F1A1C] text-[#FAF7F2] aspect-[4/3] flex flex-col justify-between p-6 sm:p-7 shadow-inner">
                  
                  {/* Decorative background overlay */}
                  <div className="absolute inset-0 bg-[radial-gradient(#C5A880_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
                  
                  {/* Card Header with Brand Badge */}
                  <div className="relative flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C5A880] bg-black/40 px-3 py-1 rounded backdrop-blur-xs border border-[#C5A880]/30">
                      The At-Home Standard
                    </span>
                    <span className="text-xs font-medium text-[#FAF7F2]/80">
                      Delhi NCR
                    </span>
                  </div>

                  {/* Card Centerpiece: The Promise */}
                  <div className="relative my-auto space-y-2 py-4">
                    <p className="font-serif text-2xl sm:text-3xl text-white font-normal leading-snug">
                      “The effortless salon experience that comes to you.”
                    </p>
                    <p className="text-xs text-[#E8DDD3]/90 font-light">
                      Single-use disposable kits · Autoclave instruments · Certified female artists
                    </p>
                  </div>

                  {/* Card Bottom: Verification Badges */}
                  <div className="relative pt-3 border-t border-white/15 flex items-center justify-between text-xs text-[#FAF7F2]/90">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-[#C5A880]" />
                      <span>100% Certified Beauticians</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-[#C5A880]">
                      <span>★ 4.9 / 5</span>
                      <span className="text-[#FAF7F2]/60 font-normal">(850+ Google Reviews)</span>
                    </div>
                  </div>

                </div>

                {/* Sub-strip with 3 key pillars */}
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#F0E6DE] text-center">
                  <div className="p-2 bg-[#FAF7F2] rounded-lg">
                    <p className="text-xs font-bold text-[#4A0417]">Zero Commute</p>
                    <p className="text-[11px] text-[#6E5D60]">Save 2+ hours</p>
                  </div>
                  <div className="p-2 bg-[#FAF7F2] rounded-lg">
                    <p className="text-xs font-bold text-[#4A0417]">Pay After</p>
                    <p className="text-[11px] text-[#6E5D60]">Cash on Delivery</p>
                  </div>
                  <div className="p-2 bg-[#FAF7F2] rounded-lg">
                    <p className="text-xs font-bold text-[#4A0417]">Free Cancel</p>
                    <p className="text-[11px] text-[#6E5D60]">Up to 4h before</p>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
