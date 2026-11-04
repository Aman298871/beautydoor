import React from 'react';
import { HeroCampaignCarousel } from '../components/HeroCampaignCarousel.tsx';
import { DealsSection } from '../components/DealsSection.tsx';
import { CategoryPromotions } from '../components/CategoryPromotions.tsx';
import { WaxingCatalogueSection } from '../components/WaxingCatalogueSection.tsx';
import { HygienePromiseSection } from '../components/HygienePromiseSection.tsx';
import { GenuineReviewsSection } from '../components/GenuineReviewsSection.tsx';
import { Sparkles, ArrowRight, ShieldCheck, Clock, Plus, Check, Gift, Wind } from 'lucide-react';
import { useRouter } from '../router.tsx';

interface Props {
  campaigns: any[];
  deals: any[];
  bestsellers: any[];
  services?: any[];
  packages?: any[];
  reviews: any[];
  googlePlaceId?: string;
  onCheckPincode: (pincode: string) => Promise<any>;
  onSelectTerritory: (territory: any) => void;
  onQuickAdd: (service: any) => void;
  onAddPackage?: (pkg: any) => void;
  cartItemIds: string[];
  onOpenWriteReview: () => void;
}

export const HomePage: React.FC<Props> = ({
  campaigns,
  deals,
  bestsellers,
  services = [],
  packages = [],
  reviews,
  googlePlaceId,
  onCheckPincode,
  onSelectTerritory,
  onQuickAdd,
  onAddPackage,
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

      {/* 5. Official Waxing Catalogue with RICA, Honey, Korean & Brazilian Peel-Off */}
      {services && services.length > 0 && (
        <WaxingCatalogueSection
          services={services}
          onQuickAdd={onQuickAdd}
          cartItemIds={cartItemIds}
        />
      )}

      {/* 6. Official BeautyDoor Signature Packages */}
      {packages && packages.length > 0 && (
        <section className="py-14 sm:py-20 bg-[#FAF7F2] border-b border-[#E8DDD3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-1">
                  <Gift className="w-4 h-4 text-[#C5A880]" />
                  <span>Curated Head-to-Toe Value</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C] tracking-tight">
                  BeautyDoor <span className="italic font-medium text-[#4A0417]">Signature Packages</span>
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-[#5C4D4F] font-light max-w-2xl">
                  Official bundled rituals featuring RICA & Honey waxing paired with high-performance facials and complimentary gift treatments.
                </p>
              </div>

              <button
                onClick={() => navigate('/packages')}
                className="text-xs font-semibold text-[#4A0417] hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                <span>View All 10 Packages</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.slice(0, 3).map((pkg) => {
                const inCart = cartItemIds.includes(pkg.id);
                return (
                  <div
                    key={pkg.id}
                    className="bg-white rounded-2xl border border-[#E8DDD3] hover:border-[#C5A880] p-6 flex flex-col justify-between transition-all hover:shadow-lg relative overflow-hidden"
                  >
                    {pkg.badge && (
                      <div className="absolute top-0 right-0 bg-[#4A0417] text-[#FAF7F2] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                        {pkg.badge}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#7A6B6D] mb-2">
                        <Clock className="w-3.5 h-3.5 text-[#4A0417]" />
                        <span className="font-semibold text-[#4A0417]">{pkg.duration_display || `${pkg.duration_mins} mins`}</span>
                      </div>

                      <h3 className="text-xl font-serif font-bold text-[#1F1A1C]">
                        {pkg.name}
                      </h3>
                      {pkg.subtitle && (
                        <p className="text-[11px] text-[#C5A880] font-semibold uppercase mt-0.5">
                          {pkg.subtitle}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-[#5C4D4F] line-clamp-2 leading-relaxed">
                        {pkg.description}
                      </p>

                      <div className="mt-4 pt-3 border-t border-[#F4EFEA] space-y-1.5">
                        {(pkg.inclusions || []).slice(0, 3).map((inc: any, i: number) => {
                          const name = typeof inc === 'object' ? inc.name : String(inc);
                          const isFree = (typeof inc === 'object' && inc.is_free) || name.toLowerCase().includes('free');
                          return (
                            <div
                              key={i}
                              className={`p-1.5 rounded-md text-[11px] flex items-center justify-between ${
                                isFree ? 'bg-emerald-50 text-emerald-950 font-medium' : 'text-[#4A3D3F]'
                              }`}
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate">{name}</span>
                              </span>
                              {isFree && (
                                <span className="text-[9px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                  FREE
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-[#EAE2D8] flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-bold text-[#1F1A1C] tabular-nums">
                            ₹{pkg.selling_price.toLocaleString('en-IN')}
                          </span>
                          {pkg.original_price > pkg.selling_price && (
                            <span className="text-xs text-[#9C8C8E] line-through tabular-nums">
                              ₹{pkg.original_price.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#7A6B6D]">Fixed bundle rate</p>
                      </div>

                      <button
                        onClick={() => {
                          if (onAddPackage) {
                            onAddPackage(pkg);
                          } else {
                            navigate('/packages');
                          }
                        }}
                        className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all flex items-center gap-1 ${
                          inCart
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'bg-[#4A0417] hover:bg-[#36020F] text-white shadow-xs'
                        }`}
                      >
                        {inCart ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>In Bag</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                            <span>Book</span>
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

      {/* 7. Custom Package Banner Callout */}
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
            <span>Explore All Packages</span>
          </button>
        </div>
      </section>

      {/* 8. Dedicated Hygiene Promise */}
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
