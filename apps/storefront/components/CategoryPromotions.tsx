import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useRouter } from '../router.tsx';

export const CategoryPromotions: React.FC = () => {
  const { navigate } = useRouter();

  const promotions = [
    {
      id: 'waxing',
      title: 'Italian Rica & Honey Waxing',
      subtitle: 'Colophony-free waxes for minimal redness & satin finish',
      tag: 'Best Doorstep Value',
      slug: 'waxing',
      imageUrl: '/banners/waxing_luxury_banner.svg'
    },
    {
      id: 'facial',
      title: 'Facial & Glow Cleanups',
      subtitle: 'Oxygenating O3+ & Korean Hydro-infusion therapies',
      tag: 'Up to 35% OFF',
      slug: 'facial',
      imageUrl: '/banners/facial_luxury_banner.svg'
    },
    {
      id: 'mani-pedi',
      title: 'Luxury Mani-Pedi Foot Spas',
      subtitle: 'Rose bath bomb effervescence & deep callus smoothing',
      tag: 'Client Favorite',
      slug: 'mani-pedi',
      imageUrl: '/banners/pedicure_luxury_banner.svg'
    },
    {
      id: 'bridal',
      title: 'Royal Pre-Bridal & Wedding',
      subtitle: 'Curated head-to-toe 3-hour royal radiance journeys',
      tag: 'Senior Estheticians',
      slug: 'bridal',
      imageUrl: '/assets/aistudio/WhatsApp_Image_2026-11-02_at_3.15.17_PM_49e36dff.jpeg'
    }
  ];

  return (
    <section className="py-14 sm:py-18 bg-[#F4EFEA] border-b border-[#E8DDD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="max-w-3xl mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Category Merchandising</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-normal text-[#1F1A1C] tracking-tight">
            Specialized Care by <span className="italic font-medium text-[#4A0417]">Category.</span>
          </h2>
          <p className="mt-1 text-sm text-[#5C4D4F] font-light">
            Every category features dedicated specialist beauticians and single-use sealed kits.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {promotions.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/services/${p.slug}`)}
              className="bg-white rounded-2xl border border-[#E8DDD3] hover:border-[#4A0417] transition-all cursor-pointer group shadow-xs flex flex-col justify-between overflow-hidden"
            >
              {/* Card Banner Visual */}
              <div className="relative aspect-[16/10] overflow-hidden bg-[#FAF6F0] border-b border-[#E8DDD3]">
                <img
                  src={p.imageUrl}
                  alt={p.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wider text-[#4A0417] bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded shadow-xs border border-[#E8DDD3]">
                  {p.tag}
                </span>
              </div>

              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[#1F1A1C] group-hover:text-[#4A0417] transition-colors">
                    {p.title}
                  </h3>

                  <p className="text-xs text-[#6B5A5C] mt-1.5 leading-relaxed">
                    {p.subtitle}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F4EFEA] flex items-center justify-between text-xs font-semibold text-[#4A0417]">
                  <span>Explore Rituals</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
