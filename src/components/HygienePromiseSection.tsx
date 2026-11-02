import React from 'react';
import { ShieldCheck, Sparkles, Check, HeartHandshake, Eye, Award } from 'lucide-react';

export const HygienePromiseSection: React.FC = () => {
  const protocols = [
    {
      title: '100% Single-Use Disposables',
      desc: 'Hospital-grade bed sheets, towels, spatulas, wax strips, and aprons are unsealed from sterile packs right in front of you.'
    },
    {
      title: 'Mono-Dose Sealed Sachets',
      desc: 'Zero cross-contamination risk. Every facial, bleach, and spa product is dispensed from factory-sealed, single-client sachets.'
    },
    {
      title: 'Autoclave Sterilization',
      desc: 'All cuticle pushers, tweezers, and stainless steel instruments undergo autoclave sterilization and are sealed in indicator pouches.'
    },
    {
      title: 'Verified Female Specialists',
      desc: 'Every beautician undergoes background verification, certified cosmetology tests, and weekly sanitization audits.'
    },
    {
      title: 'Post-Service Cleanliness',
      desc: 'Our specialists thoroughly clean, sanitize, and dispose of all service waste, leaving your living room or bedroom pristine.'
    },
    {
      title: 'Fair Pricing & No Cash Surprises',
      desc: 'All prices are transparent and calculated on our backend. No surprise travel fees or hidden addon charges at your home.'
    }
  ];

  return (
    <section id="hygiene" className="py-16 sm:py-20 bg-[#FAF7F2] border-b border-[#E8DDD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-2">
            <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
            <span>The BeautyDoor White-Glove Guarantee</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-normal text-[#1F1A1C] tracking-tight">
            Hospital-grade hygiene standards, never compromised.
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#5C4D4F] font-light">
            We hold ourselves to higher clinical and aesthetic benchmarks than brick-and-mortar salons. Here is our 6-point promise to every Delhi NCR resident.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {protocols.map((proto, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-3"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[#4A0417]">
                <span className="w-5 h-5 rounded-full bg-[#FAF7F2] text-[#4A0417] border border-[#E8DDD3] flex items-center justify-center font-mono text-[10px]">
                  0{idx + 1}
                </span>
                <span className="uppercase tracking-wider">Protocol</span>
              </div>
              <h3 className="text-base font-semibold text-[#1F1A1C]">
                {proto.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#5C4D4F] leading-relaxed">
                {proto.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
