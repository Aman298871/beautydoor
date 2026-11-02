import React from 'react';
import { HeroCampaignCarousel } from '../components/HeroCampaignCarousel.tsx';
import { DealsSection } from '../components/DealsSection.tsx';
import { CategoryPromotions } from '../components/CategoryPromotions.tsx';
import { HygienePromiseSection } from '../../../src/components/HygienePromiseSection.tsx';
import { GenuineReviewsSection } from '../components/GenuineReviewsSection.tsx';
import { Sparkles, ArrowRight, ShieldCheck, Clock, Plus, Check } from 'lucide-react';
import { useRouter } from '../router.tsx';

interface Props {
  campaigns: any[];
  deals: any[];
  bestsellers: any[];
  reviews: any[];
  googlePlaceId?: string;
  onCheckPincode: (pincode: string) => Promise<any>;
  onSelectTerritory: (territory: any) => void;
  onQuickAdd: (service: any) => void;
  cartItemIds: string[];
  onOpenWriteReview: () => void;
}

export const HomePage: React.FC<Props> = ({
  campaigns,
  deals,
  bestsellers,
  reviews,
  googlePlaceId,
  onCheckPincode,
  onSelectTerritory,
  onQuickAdd,
  cartItemIds,
  onOpenWriteReview
}) => {
  const { navigate } = useRouter();
  const flashCampaign = campaigns.find(c => c.is_flash_deal === 1);

  return (
    <div className="space-y-0">
      {/* 1. Hero Campaign Banner Carousel with Pincode Checker */}
      <HeroCampaignCarousel
        campaigns={campaigns}
        onCheckPincode={onCheckPincode}
        onSelectTerritory={onSelectTerritory}
      />

      {/* 2. Amazon-style Today's Best Deals & Active Flash Deals */}
      <DealsSection
        deals={deals}
        flashCampaign={flashCampaign}
        onQuickAdd={onQuickAdd}
        cartItemIds={cartItemIds}
      />

      {/* 3. Specialized Category Merchandising */}
      <CategoryPromotions />

      {/* 4. Curated Bestselling Services */}
      {bestsellers && bestsellers.length > 0 && (
        <section className="py-14 sm:py-18 bg-white border-b border-[#E8DDD3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Client Favorites</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-serif font-normal text-[#1F1A1C] tracking-tight">
                  Most Requested <span className="italic font-medium text-[#4A0417]">At-Home Rituals.</span>
                </h2>
              </div>

              <button
                onClick={() => navigate('/services')}
                className="text-xs font-semibold text-[#4A0417] hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bestsellers.map((srv) => {
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
                        <span className="text-[10px] uppercase font-bold text-[#4A0417] bg-white px-2 py-0.5 rounded border border-[#E8DDD3]">
                          Bestseller
                        </span>
                      </div>

                      <h3
                        onClick={() => navigate(`/service/${srv.slug}`)}
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
                          <span className="text-lg font-bold text-[#1F1A1C] tabular-nums">
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
          </div>
        </section>
      )}

      {/* 5. Custom Package Banner Callout */}
      <section className="py-12 bg-gradient-to-r from-[#4A0417] to-[#1F1A1C] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#C5A880]">
              Custom Package Builder
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-white">
              Bundle 3 or more treatments & save up to 20% extra.
            </h3>
            <p className="text-xs sm:text-sm text-[#E8DDD3] font-light max-w-xl">
              Combine your favorite waxing, facials, and mani-pedi rituals. Automated tiered savings applied instantly.
            </p>
          </div>

          <button
            onClick={() => navigate('/packages')}
            className="px-6 py-3.5 bg-white text-[#4A0417] hover:bg-[#FAF7F2] font-semibold text-xs sm:text-sm rounded-md shadow-md transition-colors shrink-0 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-[#C5A880]" />
            <span>Build Bespoke Package</span>
          </button>
        </div>
      </section>

      {/* 6. Hospital-Grade Hygiene Standard */}
      <HygienePromiseSection />

      {/* 7. Genuine Client Feedback */}
      <GenuineReviewsSection
        reviews={reviews}
        googlePlaceId={googlePlaceId}
        onOpenWriteReview={onOpenWriteReview}
      />
    </div>
  );
};
