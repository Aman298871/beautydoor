import React, { useState, useEffect } from 'react';
import { Sparkles, Clock, Check, Gift, ShieldCheck, ChevronRight, X, Wind, Info, Tag } from 'lucide-react';
import { useRouter } from '../router.tsx';
import { formatDuration } from '../../../src/utils/formatters.ts';

interface PackageInclusion {
  name: string;
  is_free?: boolean;
}

interface PackageItem {
  id: string;
  name: string;
  slug: string;
  subtitle?: string;
  description: string;
  original_price: number;
  selling_price: number;
  discount_percent: number;
  duration_mins: number;
  duration_display: string;
  inclusions: (string | PackageInclusion)[];
  benefits?: string[];
  badge?: string;
  vlcc_facial_variant?: string;
}

interface Props {
  onAddPackageToCart: (packageItem: any, selectedVariant?: string) => void;
  cartItemIds: string[];
}

export const PackagesPage: React.FC<Props> = ({ onAddPackageToCart, cartItemIds }) => {
  const { navigate } = useRouter();
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFacialVariant, setSelectedFacialVariant] = useState<Record<string, string>>({
    'pkg-total-care': 'Insta Glow',
    'pkg-just-relax': 'Insta Glow'
  });
  const [activeModalPackage, setActiveModalPackage] = useState<PackageItem | null>(null);

  useEffect(() => {
    fetch('/api/storefront/packages')
      .then((res) => res.json())
      .then((data) => {
        if (data.packages && data.packages.length > 0) {
          setPackages(data.packages);
        }
      })
      .catch((err) => {
        console.error('Failed to load packages:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleBook = (pkg: PackageItem) => {
    const chosenVariant = selectedFacialVariant[pkg.id] || (pkg.slug.includes('total-care') || pkg.slug.includes('just-relax') ? 'Insta Glow' : undefined);
    onAddPackageToCart(pkg, chosenVariant);
  };

  const isIncludedFree = (item: string | PackageInclusion): boolean => {
    if (typeof item === 'object' && item !== null) {
      return !!item.is_free;
    }
    const lower = String(item).toLowerCase();
    return lower.includes('free ') || lower.startsWith('free');
  };

  const getItemName = (item: string | PackageInclusion): string => {
    if (typeof item === 'object' && item !== null) {
      return item.name;
    }
    return String(item);
  };

  return (
    <div className="py-10 sm:py-16 bg-[#FAF7F2] min-h-[85vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Header */}
        <div className="mb-8">
          <p className="text-xs text-[#8C7A7C] mb-1">
            <span onClick={() => navigate('/')} className="hover:text-[#4A0417] cursor-pointer">Home</span> / BeautyDoor Signature Packages
          </p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-1">
                <Sparkles className="w-4 h-4 text-[#C5A880]" />
                <span>All-In-One Curated Head-to-Toe Rituals</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C]">
                Official BeautyDoor Packages
              </h1>
              <p className="text-sm text-[#5C4D4F] mt-1 font-light max-w-2xl">
                Curated combinations of RICA, Honey & Korean waxing with luxury facials, cleanups, and complimentary gift services at fixed bundle pricing. No extra add-on surprises.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-xs font-medium self-start md:self-auto">
              <Gift className="w-4 h-4 text-emerald-700" />
              <span>Complimentary Bikini Wax, Threading & Bleach included in select packs</span>
            </div>
          </div>
        </div>

        {/* AC Room Condition Callout */}
        <div className="mb-8 p-4 rounded-xl bg-[#FFFBF0] border border-[#F3E5AB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#7A5A1E]">
          <div className="flex items-center gap-2.5">
            <Wind className="w-4 h-4 text-[#C5A880] shrink-0" />
            <p>
              <strong className="font-semibold text-[#4A0417]">Important Comfort Note:</strong> For optimal wax grip, pain reduction, and hygienic skin protection, an <strong>air-conditioned / cool room</strong> is strictly required for all waxing rituals.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[#4A0417] uppercase tracking-wider bg-white px-2.5 py-1 rounded border border-[#E8DDD3] shrink-0">
            Delhi NCR Doorstep Guarantee
          </span>
        </div>

        {/* Package Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-[#8C7A7C]">Loading official BeautyDoor packages...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {packages.map((pkg) => {
              const inCart = cartItemIds.includes(pkg.id);
              const requiresFacialChoice = pkg.slug.includes('total-care') || pkg.slug.includes('just-relax') || pkg.inclusions.some((inc) => (typeof inc === 'string' ? inc.includes('VLCC') : inc.name.includes('VLCC')));
              const selectedVariant = selectedFacialVariant[pkg.id] || 'Insta Glow';

              return (
                <div
                  key={pkg.id}
                  className="bg-white rounded-2xl border border-[#E8DDD3] hover:border-[#C5A880] p-6 flex flex-col justify-between transition-all hover:shadow-lg relative overflow-hidden"
                >
                  {/* Decorative Corner Badge */}
                  {pkg.badge && (
                    <div className="absolute top-0 right-0 bg-[#4A0417] text-[#FAF7F2] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg shadow-xs">
                      {pkg.badge}
                    </div>
                  )}

                  <div>
                    {/* Header Row */}
                    <div className="flex items-center gap-3 text-xs text-[#7A6B6D] mb-2">
                      <span className="flex items-center gap-1 font-medium tabular-nums text-[#4A0417]">
                        <Clock className="w-3.5 h-3.5 text-[#C5A880]" />
                        {formatDuration(pkg.duration_mins)}
                      </span>
                      <span className="text-[#C5A880]">•</span>
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        100% Single-Use Sealed Kits
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F1A1C]">
                      {pkg.name}
                    </h2>
                    
                    {pkg.subtitle && (
                      <p className="text-xs text-[#C5A880] font-semibold tracking-wide uppercase mt-0.5">
                        {pkg.subtitle}
                      </p>
                    )}

                    <p className="mt-2 text-xs sm:text-sm text-[#5C4D4F] leading-relaxed line-clamp-2">
                      {pkg.description}
                    </p>

                    {/* Inclusions List */}
                    <div className="mt-4 pt-4 border-t border-[#F4EFEA]">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#4A0417] mb-2 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-[#C5A880]" />
                        <span>Included Treatments ({pkg.inclusions.length})</span>
                      </p>
                      
                      <div className="space-y-2">
                        {pkg.inclusions.map((item, idx) => {
                          const isFree = isIncludedFree(item);
                          const itemName = getItemName(item);

                          return (
                            <div
                              key={idx}
                              className={`p-2 rounded-lg flex items-start justify-between gap-2 text-xs transition-colors ${
                                isFree
                                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 font-medium'
                                  : 'bg-[#FAF7F2] text-[#2C2426]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                                  isFree ? 'bg-emerald-600 text-white' : 'bg-[#E8DDD3] text-[#4A0417]'
                                }`}>
                                  <Check className="w-2.5 h-2.5" />
                                </span>
                                <span>{itemName}</span>
                              </div>

                              {isFree && (
                                <span className="bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-2xs shrink-0">
                                  FREE GIFT
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Interactive Facial Selector for Package 8 & 10 */}
                    {requiresFacialChoice && (
                      <div className="mt-4 p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DDD3]">
                        <p className="text-xs font-semibold text-[#1F1A1C] mb-2">
                          Select your included VLCC Facial variant:
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedFacialVariant(prev => ({ ...prev, [pkg.id]: 'Insta Glow' }))}
                            className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                              selectedVariant === 'Insta Glow'
                                ? 'bg-[#4A0417] text-white border-[#4A0417] shadow-xs'
                                : 'bg-white text-[#554749] border-[#E8DDD3] hover:border-[#C5A880]'
                            }`}
                          >
                            VLCC Insta Glow
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedFacialVariant(prev => ({ ...prev, [pkg.id]: 'Anti Tan' }))}
                            className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                              selectedVariant === 'Anti Tan'
                                ? 'bg-[#4A0417] text-white border-[#4A0417] shadow-xs'
                                : 'bg-white text-[#554749] border-[#E8DDD3] hover:border-[#C5A880]'
                            }`}
                          >
                            VLCC Anti-Tan
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pricing and Action Footer */}
                  <div className="mt-6 pt-4 border-t border-[#EAE2D8] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-bold text-[#1F1A1C] tabular-nums">
                          ₹{pkg.selling_price.toLocaleString('en-IN')}
                        </span>
                        {pkg.original_price > pkg.selling_price && (
                          <span className="text-sm text-[#9C8C8E] line-through tabular-nums">
                            ₹{pkg.original_price.toLocaleString('en-IN')}
                          </span>
                        )}
                        {pkg.discount_percent > 0 && (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Save {pkg.discount_percent}%
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#7A6B6D] mt-0.5">
                        Fixed package rate • All items included
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveModalPackage(pkg)}
                        className="px-3.5 py-2.5 bg-white text-[#4A0417] hover:bg-[#FAF7F2] border border-[#E8DDD3] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleBook(pkg)}
                        className={`flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                          inCart
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'bg-[#4A0417] hover:bg-[#36020F] text-[#FAF7F2] shadow-sm active:scale-98'
                        }`}
                      >
                        {inCart ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-700" />
                            <span>In Bag</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                            <span>Book Package</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Package Details Modal */}
      {activeModalPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-[#E8DDD3] shadow-2xl p-6 sm:p-7 relative">
            <button
              onClick={() => setActiveModalPackage(null)}
              className="absolute top-4 right-4 p-2 text-[#7A6B6D] hover:text-[#1F1A1C] hover:bg-[#FAF7F2] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-bold uppercase text-[#4A0417] mb-1">
              <Sparkles className="w-4 h-4 text-[#C5A880]" />
              <span>Full Treatment Protocol</span>
            </div>

            <h3 className="text-2xl font-serif font-bold text-[#1F1A1C]">
              {activeModalPackage.name}
            </h3>

            <div className="flex items-center gap-3 text-xs text-[#7A6B6D] mt-1 mb-4">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#4A0417]" />
                Duration: {formatDuration(activeModalPackage.duration_mins)}
              </span>
              <span>•</span>
              <span className="font-bold text-[#1F1A1C]">
                Package Price: ₹{activeModalPackage.selling_price.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-[#4A3D3F]">
              <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DDD3]">
                <p className="font-semibold text-[#1F1A1C] mb-1">About This Signature Ritual</p>
                <p className="text-xs text-[#5C4D4F] leading-relaxed">
                  {activeModalPackage.description}
                </p>
              </div>

              <div>
                <p className="font-bold text-xs uppercase text-[#4A0417] tracking-wider mb-2">
                  What's Included in This Package
                </p>
                <ul className="space-y-2">
                  {activeModalPackage.inclusions.map((item, idx) => {
                    const isFree = isIncludedFree(item);
                    const itemName = getItemName(item);
                    return (
                      <li
                        key={idx}
                        className={`p-2.5 rounded-lg flex items-center justify-between text-xs ${
                          isFree
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-950 font-semibold'
                            : 'bg-[#FAF7F2] border border-[#F4EFEA]'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          {itemName}
                        </span>
                        {isFree && (
                          <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                            FREE GIFT
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-[#FFFBF0] border border-[#F3E5AB] space-y-1 text-xs text-[#7A5A1E]">
                <p className="font-bold text-[#4A0417] flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-[#C5A880]" />
                  AC Room & Hair Growth Preparation Required
                </p>
                <p className="leading-relaxed">
                  Please ensure an air-conditioned room (approx. 22-24°C) is ready upon specialist arrival. Hair length should be at least 1/4 inch (minimum 3 weeks without shaving) for painless, residue-free waxing.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1 text-xs text-emerald-950">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Our Single-Use Hygiene Guarantee
                </p>
                <p className="text-[11px] leading-relaxed">
                  Disposables unsealed in front of you. Specialist uses sanitized stainless steel tweezers, single-use wooden spatulas, disposable bedsheets, and leaves your space immaculate.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#EAE2D8] flex items-center justify-between gap-3">
              <span className="text-xl font-bold text-[#1F1A1C]">
                ₹{activeModalPackage.selling_price.toLocaleString('en-IN')}
              </span>

              <button
                type="button"
                onClick={() => {
                  handleBook(activeModalPackage);
                  setActiveModalPackage(null);
                }}
                className="px-5 py-2.5 bg-[#4A0417] hover:bg-[#36020F] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm"
              >
                Add Package to Bag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
