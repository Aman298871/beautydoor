import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Plus, Check, ArrowRight, Flame } from 'lucide-react';
import { useRouter } from '../router.tsx';

interface ServiceDeal {
  id: string;
  name: string;
  slug: string;
  category_id: string;
  description: string;
  duration_mins: number;
  original_price: number;
  selling_price: number;
  discount_percent: number;
  deal_badge?: string;
  benefits?: string[];
}

interface Campaign {
  id: string;
  title: string;
  end_time: string;
  is_flash_deal: number;
  badge_text?: string;
}

interface Props {
  deals: ServiceDeal[];
  flashCampaign?: Campaign;
  onQuickAdd: (service: any) => void;
  cartItemIds: string[];
}

export const DealsSection: React.FC<Props> = ({
  deals,
  flashCampaign,
  onQuickAdd,
  cartItemIds
}) => {
  const { navigate } = useRouter();

  // Real countdown timer for flash deals
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!flashCampaign?.end_time) return;

    const calculateTime = () => {
      const diff = new Date(flashCampaign.end_time).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [flashCampaign?.end_time]);

  if (!deals || deals.length === 0) return null;

  return (
    <section className="py-14 sm:py-18 bg-white border-b border-[#E8DDD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Flash Timer */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
              <span>Promotional Merchandising Spotlight</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-normal text-[#1F1A1C] tracking-tight">
              Today's Best Deals & <span className="italic font-medium text-[#4A0417]">Doorstep Specials.</span>
            </h2>
            <p className="mt-1 text-sm text-[#5C4D4F] font-light">
              Limited-availability discounted treatments with verified backend pricing and hospital-grade disposables.
            </p>
          </div>

          {/* Real Active Flash Deal Countdown Banner (Only if end_time exists) */}
          {flashCampaign && timeLeft && (
            <div className="p-3 sm:p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DDD3] flex items-center gap-4 shrink-0 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#4A0417]">
                <Clock className="w-4 h-4 text-[#C5A880] animate-pulse" />
                <span>{flashCampaign.badge_text || 'Flash Deal Ends In:'}</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#1F1A1C] tabular-nums">
                <span className="bg-white px-2 py-1 rounded border border-[#E8DDD3]">{String(timeLeft.hours).padStart(2, '0')}h</span>
                <span>:</span>
                <span className="bg-white px-2 py-1 rounded border border-[#E8DDD3]">{String(timeLeft.minutes).padStart(2, '0')}m</span>
                <span>:</span>
                <span className="bg-white px-2 py-1 rounded border border-[#E8DDD3]">{String(timeLeft.seconds).padStart(2, '0')}s</span>
              </div>
            </div>
          )}
        </div>

        {/* Deals Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {deals.map((deal) => {
            const inCart = cartItemIds.includes(deal.id);
            return (
              <div
                key={deal.id}
                className="bg-[#FAF7F2] rounded-xl border border-[#E8DDD3] hover:border-[#C5A880] p-4 sm:p-5 flex flex-col justify-between transition-all hover:shadow-md group"
              >
                <div>
                  {/* Top unboxed metadata */}
                  <div className="flex items-center justify-between text-xs text-[#7A6B6D] mb-2">
                    <span className="tabular-nums font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#4A0417]" />
                      {deal.duration_mins} mins
                    </span>
                    {deal.deal_badge && (
                      <span className="text-[10px] font-bold text-[#4A0417] bg-white px-2 py-0.5 rounded border border-[#C5A880]/30 tracking-tight">
                        {deal.deal_badge}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => navigate(`/service/${deal.slug}`)}
                    className="text-sm sm:text-base font-semibold text-[#1F1A1C] group-hover:text-[#4A0417] transition-colors leading-snug cursor-pointer line-clamp-2"
                  >
                    {deal.name}
                  </h3>

                  <p className="mt-1.5 text-xs text-[#5C4D4F] line-clamp-2 leading-relaxed">
                    {deal.description}
                  </p>
                </div>

                {/* Pricing & Add button */}
                <div className="mt-4 pt-3 border-t border-[#EAE2D8] flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base sm:text-lg font-bold text-[#1F1A1C] tabular-nums">
                        ₹{deal.selling_price.toLocaleString('en-IN')}
                      </span>
                      {deal.original_price > deal.selling_price && (
                        <span className="text-xs text-[#9C8C8E] line-through tabular-nums">
                          ₹{deal.original_price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    {deal.discount_percent > 0 && (
                      <span className="text-[11px] font-semibold text-emerald-800">
                        {deal.discount_percent}% OFF
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onQuickAdd({
                      id: deal.id,
                      name: deal.name,
                      sellingPrice: deal.selling_price,
                      durationMins: deal.duration_mins,
                      variants: [],
                      addons: []
                    })}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
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

        {/* View all offers link */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/offers')}
            className="text-xs font-semibold text-[#4A0417] hover:underline inline-flex items-center gap-1.5"
          >
            <span>Browse All Promotional Campaigns & Coupon Deals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </section>
  );
};
