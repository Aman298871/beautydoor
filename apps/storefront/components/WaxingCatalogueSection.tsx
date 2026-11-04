import React, { useState } from 'react';
import { Sparkles, Clock, Check, Plus, ShieldCheck, Wind, AlertCircle, Heart } from 'lucide-react';
import { useRouter } from '../router.tsx';

interface ServiceItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  selling_price: number;
  original_price: number;
  duration_mins: number;
  benefits?: string[];
  whatsIncluded?: string[];
  is_popular?: number;
  is_bestseller?: number;
}

interface Props {
  services: ServiceItem[];
  onQuickAdd: (service: any) => void;
  cartItemIds: string[];
}

export const WaxingCatalogueSection: React.FC<Props> = ({
  services,
  onQuickAdd,
  cartItemIds
}) => {
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState<'cat-rica' | 'cat-honey' | 'cat-korean' | 'cat-brazilian'>('cat-rica');

  const waxingCategories = [
    {
      id: 'cat-rica',
      name: 'RICA Waxing',
      tagline: 'Italian liposoluble wax formulated with titanium dioxide & natural resins. Gentle on delicate skin.',
      pill: 'Colophony-Free'
    },
    {
      id: 'cat-honey',
      name: 'Honey Waxing',
      tagline: 'Classic, budget-friendly natural honey formulation for regular hair removal & velvety soft skin.',
      pill: 'Classic Ritual'
    },
    {
      id: 'cat-korean',
      name: 'Korean Waxing',
      tagline: 'Ultra-low temperature Korean peel formulation enriched with soothing botanical calming agents.',
      pill: 'Painless & Gentle'
    },
    {
      id: 'cat-brazilian',
      name: 'Brazilian Peel-Off',
      tagline: 'Specialized stripless peel-off wax for sensitive intimate zones, delicate facial contours & underarms.',
      pill: 'Stripless Precision'
    }
  ];

  const currentCategory = waxingCategories.find(c => c.id === activeTab)!;
  const categoryServices = services.filter(s => s.category_id === activeTab);

  return (
    <section className="py-14 sm:py-20 bg-white border-b border-[#E8DDD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mb-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-2">
            <Sparkles className="w-4 h-4 text-[#C5A880]" />
            <span>Official BeautyDoor Waxing Menu</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C] tracking-tight">
            Precision At-Home Waxing Rituals
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#5C4D4F] font-light">
            Explore our 4 dedicated waxing lines. Every ritual utilizes disposable bedsheets, single-use wooden spatulas, sealed strips, and pre/post-wax soothing oils.
          </p>
        </div>

        {/* AC Room Condition Callout */}
        <div className="mb-8 p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#4A0417]/10 flex items-center justify-center shrink-0">
              <Wind className="w-5 h-5 text-[#4A0417]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-[#1F1A1C]">
                Cool / Air Conditioned Room Recommended
              </p>
              <p className="text-xs text-[#6B5A5C]">
                Humidity causes wax to stick. Please turn on your room AC 10 minutes before specialist arrival for painless application.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200 shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Never Double-Dip Policy</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none border-b border-[#EAE2D8]">
          {waxingCategories.map(cat => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id as any)}
                className={`px-5 py-3 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#4A0417] text-white shadow-sm'
                    : 'bg-[#FAF7F2] text-[#554749] hover:bg-[#EAE2D8]'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-[#E8DDD3] text-[#4A0417]'
                }`}>
                  {cat.pill}
                </span>
              </button>
            );
          })}
        </div>

        {/* Category Description Banner */}
        <div className="mb-6 p-4 rounded-xl bg-[#FFFBF0] border border-[#F3E5AB] text-xs text-[#7A5A1E] flex items-center justify-between">
          <p className="leading-relaxed">
            <strong className="font-semibold text-[#4A0417]">{currentCategory.name}:</strong> {currentCategory.tagline}
          </p>
          <span className="text-[11px] text-[#4A0417] font-semibold underline cursor-pointer ml-3 shrink-0" onClick={() => navigate('/how-it-works')}>
            Pre-care Guide
          </span>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categoryServices.map((srv) => {
            const inCart = cartItemIds.includes(srv.id);
            return (
              <div
                key={srv.id}
                className="bg-[#FAF7F2] rounded-xl border border-[#E8DDD3] hover:border-[#C5A880] p-5 flex flex-col justify-between transition-all hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#7A6B6D] mb-2">
                    <span className="tabular-nums font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#4A0417]" />
                      {srv.duration_mins} mins
                    </span>
                    {srv.is_bestseller ? (
                      <span className="text-[10px] uppercase font-bold text-[#4A0417] bg-white px-2 py-0.5 rounded border border-[#E8DDD3]">
                        Popular
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-semibold text-[#8C7A7C]">
                        Single-Use Kit
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={() => navigate(`/service/${srv.id}`)}
                    className="text-base font-semibold text-[#1F1A1C] hover:text-[#4A0417] cursor-pointer transition-colors leading-snug"
                  >
                    {srv.name}
                  </h3>

                  <p className="mt-1.5 text-xs text-[#5C4D4F] line-clamp-2 leading-relaxed">
                    {srv.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#EAE2D8] flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-bold text-[#1F1A1C] tabular-nums">
                        ₹{srv.selling_price.toLocaleString('en-IN')}
                      </span>
                      {srv.original_price > srv.selling_price && (
                        <span className="text-xs text-[#9C8C8E] line-through tabular-nums">
                          ₹{srv.original_price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onQuickAdd({
                      id: srv.id,
                      name: srv.name,
                      sellingPrice: srv.selling_price,
                      durationMins: srv.duration_mins,
                      variants: [],
                      addons: []
                    })}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                      inCart
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : 'bg-[#4A0417] hover:bg-[#36020F] text-[#FAF7F2] shadow-xs active:scale-95'
                    }`}
                  >
                    {inCart ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* View All Waxing Link */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/services')}
            className="px-6 py-2.5 bg-white text-[#4A0417] hover:bg-[#FAF7F2] border border-[#C5A880] text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 shadow-2xs"
          >
            <span>Explore Complete Beauty & Waxing Catalog</span>
          </button>
        </div>
      </div>
    </section>
  );
};
