import React, { useState, useEffect } from 'react';
import { Tag, Clock, Sparkles, ShieldCheck, Check, AlertCircle, ArrowRight, Filter, ChevronRight, PackageCheck, Zap } from 'lucide-react';
import { useRouter } from '../../router.tsx';
import { BUSINESS_CONFIG } from '../../../../src/config/businessConfig.ts';

interface Props {
  settings?: Record<string, string> | null;
  onAddToCart?: (service: any, variant?: any, addons?: any[]) => void;
}

export const PricingPage: React.FC<Props> = ({ settings, onAddToCart }) => {
  const { navigate } = useRouter();

  const [categories, setCategories] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, any>>({});

  useEffect(() => {
    document.title = 'BeautyDoor Pricing — Official Service Menu & Package Rates';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      'Transparent salon-at-home pricing for Delhi NCR. View live rates for facials, Rica waxing, pedicures, and signature packages including the ₹999 VLCC special.'
    );

    // Fetch authoritative live catalog from backend database
    fetch('/api/storefront/catalog')
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories || []);
        setServices((data.services || []).filter((s: any) => s.is_published === 1 && s.is_active === 1));
        setPackages((data.packages || []).filter((p: any) => p.is_published === 1));
      })
      .catch(err => console.error('Failed to load live pricing:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectVariant = (serviceId: string, variant: any) => {
    setSelectedVariants(prev => ({
      ...prev,
      [serviceId]: variant
    }));
  };

  const filteredServices = activeCategory === 'all'
    ? services
    : services.filter(s => s.category_id === activeCategory);

  const introNote = settings?.pricing_intro_note || 'All services & packages are delivered at your home across Delhi NCR by verified female specialists. Pricing is strictly authoritative from our live catalogue with zero hidden travel fees.';

  return (
    <div className="py-10 sm:py-16 bg-[#FAF7F2] min-h-[85vh]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="text-xs text-[#8C7A7C]">
          <ol className="flex items-center gap-1.5">
            <li>
              <span onClick={() => navigate('/')} className="hover:text-[#4A0417] cursor-pointer transition-colors font-medium">
                Home
              </span>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-[#4A0417] font-semibold">Pricing & Menu</li>
          </ol>
        </nav>

        {/* Page Hero Header */}
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8DDD3] text-xs font-semibold text-[#4A0417] shadow-xs">
            <Tag className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Official Authoritative Price List (INR)</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#1F1A1C] tracking-tight">
            Transparent Doorstep Salon Pricing
          </h1>
          <p className="text-sm sm:text-base text-[#5C4D4F] font-light leading-relaxed max-w-3xl">
            {introNote}
          </p>
        </header>

        {/* Key Pricing Rules & Conditions Banner */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[#4A0417]">
            <ShieldCheck className="w-5 h-5 text-[#C5A880]" />
            <h2 className="text-base font-serif font-bold text-[#1F1A1C]">
              Booking Conditions & Doorstep Policies
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DDD3] space-y-1">
              <span className="font-bold text-[#4A0417] block">City Minimum Order</span>
              <p className="text-[#554749]">
                Delhi: ₹1,000<br />
                Haryana: ₹1,500<br />
                Noida: ₹1,500
              </p>
            </div>
            <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DDD3] space-y-1">
              <span className="font-bold text-[#4A0417] block">Doorstep Travel Fee</span>
              <p className="text-[#554749]">
                <strong>₹0 Visiting Fee</strong> across all active Delhi NCR sectors. No surprise travel overheads.
              </p>
            </div>
            <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DDD3] space-y-1">
              <span className="font-bold text-[#4A0417] block">Time Slot Surcharges</span>
              <p className="text-[#554749]">
                Standard slots (9:00 AM – 5:00 PM): ₹0.<br />
                8:00 AM / 6:00 PM: +₹100 specialist surcharge.
              </p>
            </div>
            <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DDD3] space-y-1">
              <span className="font-bold text-[#4A0417] block">Official Promo Code</span>
              <p className="text-[#554749]">
                Use code <strong className="font-mono text-[#4A0417]">BEAUTYFIRST</strong> for flat ₹100 off on qualifying cart subtotal of ₹1,100+.
              </p>
            </div>
          </div>
          <p className="text-[11px] text-[#7A6B6D] leading-relaxed">
            * Automatic Tiered Savings: Add 2 services to receive 5% off, 3 services for 10% off, and 4+ services for 15% bundle discount. All orders operate under Cash on Delivery (Pay After Service).
          </p>
        </section>

        {/* Featured Signature Packages Section */}
        {packages.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F1A1C]">
                  Signature Curated Packages
                </h2>
                <p className="text-xs text-[#6B5A5C]">
                  All-in-one head-to-toe beauty packages with bundled price savings.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => {
                const inclusions = Array.isArray(pkg.inclusions)
                  ? pkg.inclusions
                  : (typeof pkg.inclusions_json === 'string' ? JSON.parse(pkg.inclusions_json || '[]') : []);
                const isVlccSpecial = pkg.id === 'pkg-vlcc-facial-waxing-special-999';

                return (
                  <div
                    key={pkg.id}
                    className={`rounded-2xl border p-6 flex flex-col justify-between transition-all bg-white shadow-xs ${
                      isVlccSpecial
                        ? 'border-[#4A0417] ring-1 ring-[#4A0417]/20 relative'
                        : 'border-[#E8DDD3] hover:border-[#C5A880]'
                    }`}
                  >
                    {isVlccSpecial && (
                      <span className="absolute -top-3 left-6 px-3 py-0.5 bg-[#4A0417] text-white text-[10px] uppercase font-bold tracking-wider rounded-full shadow-xs">
                        Official Owner Special • ₹999
                      </span>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-serif font-bold text-base sm:text-lg text-[#1F1A1C]">
                          {pkg.name}
                        </h3>
                        {pkg.badge && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A0417] bg-[#FAF7F2] border border-[#E8DDD3] px-2 py-0.5 rounded shrink-0">
                            {pkg.badge}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#554749] line-clamp-2">
                        {pkg.description}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-[#6B5A5C]">
                        <Clock className="w-3.5 h-3.5 text-[#4A0417]" />
                        <span>Duration: {pkg.duration_display || `${pkg.duration_mins} mins`}</span>
                      </div>

                      {/* Package Inclusions */}
                      {inclusions.length > 0 && (
                        <div className="pt-2 border-t border-[#E8DDD3] space-y-1.5">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A0417]">
                            Inclusions ({inclusions.length} Services):
                          </span>
                          <ul className="space-y-1 text-xs text-[#4A3E3D]">
                            {inclusions.map((inc: any, i: number) => {
                              const title = typeof inc === 'string' ? inc : (inc.title || inc.name || '');
                              return (
                                <li key={i} className="flex items-start gap-1.5 text-[11px]">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>{title}</span>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      {/* Facial selection for VLCC */}
                      {isVlccSpecial && (
                        <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-[11px] text-amber-950 space-y-1">
                          <span className="font-bold block text-[#4A0417]">Choice of VLCC Facial:</span>
                          <div className="flex gap-2">
                            <span className="px-2 py-0.5 rounded bg-white border border-amber-300 font-medium">1. VLCC Glow</span>
                            <span className="px-2 py-0.5 rounded bg-white border border-amber-300 font-medium">2. VLCC Anti-Tan</span>
                          </div>
                          <span className="text-[10px] text-amber-800 block pt-0.5">Includes Free Eyebrows shaping.</span>
                        </div>
                      )}
                    </div>

                    {/* Price and CTA */}
                    <div className="pt-4 border-t border-[#E8DDD3] mt-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl sm:text-2xl font-serif font-bold text-[#4A0417] tabular-nums">
                            ₹{Number(pkg.selling_price).toLocaleString('en-IN')}
                          </span>
                          {pkg.original_price && Number(pkg.original_price) > Number(pkg.selling_price) && (
                            <span className="text-xs text-[#8C7A7C] line-through tabular-nums">
                              ₹{Number(pkg.original_price).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#6B5A5C]">Pay after service at doorstep</span>
                      </div>

                      <button
                        onClick={() => navigate('/services')}
                        className="px-4 py-2 bg-[#4A0417] hover:bg-[#36020F] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Book Package</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#C5A880]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Category Filter Pills for Individual Services */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F1A1C]">
                Individual Rituals & Treatments
              </h2>
              <p className="text-xs text-[#6B5A5C]">
                Showing {filteredServices.length} live published treatments across Delhi NCR.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1.5 rounded-full border transition-all whitespace-nowrap cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-[#4A0417] text-white border-[#4A0417]'
                    : 'bg-white hover:bg-[#FAF7F2] border-[#E8DDD3] text-[#554749]'
                }`}
              >
                All Categories ({services.length})
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full border transition-all whitespace-nowrap cursor-pointer ${
                    activeCategory === cat.id
                      ? 'bg-[#4A0417] text-white border-[#4A0417]'
                      : 'bg-white hover:bg-[#FAF7F2] border-[#E8DDD3] text-[#554749]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center text-xs text-[#8C7A7C] space-y-2">
              <div className="w-8 h-8 border-2 border-[#4A0417] border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Loading live service prices from database...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map(srv => {
                const srvVariants = srv.variants || [];
                const activeVariant = selectedVariants[srv.id] || (srvVariants.length > 0 ? srvVariants[0] : null);
                const priceDelta = activeVariant ? (activeVariant.price_delta || activeVariant.priceDelta || 0) : 0;
                const finalSellingPrice = (srv.selling_price || srv.sellingPrice || 0) + priceDelta;
                const durationDelta = activeVariant ? (activeVariant.duration_delta || activeVariant.durationDelta || 0) : 0;
                const finalDuration = (srv.duration_mins || srv.durationMins || 0) + durationDelta;

                return (
                  <div
                    key={srv.id}
                    className="bg-white rounded-2xl border border-[#E8DDD3] p-5 flex flex-col justify-between shadow-xs hover:border-[#C5A880] transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          {srv.brand && (
                            <span className="text-[10px] uppercase font-bold text-[#C5A880] tracking-wider block">
                              {srv.brand}
                            </span>
                          )}
                          <h3 className="font-serif font-bold text-base text-[#1F1A1C]">
                            {srv.name}
                          </h3>
                        </div>
                        {srv.is_bestseller === 1 && (
                          <span className="text-[9px] uppercase font-bold tracking-wider text-[#4A0417] bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded shrink-0">
                            Bestseller
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#554749] line-clamp-2 leading-relaxed">
                        {srv.description}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-[#6B5A5C]">
                        <Clock className="w-3.5 h-3.5 text-[#4A0417]" />
                        <span>{finalDuration} mins</span>
                        {srv.steps_count ? <span>• {srv.steps_count} Steps Ritual</span> : null}
                      </div>

                      {/* Variants Selector */}
                      {srvVariants.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-[#E8DDD3]">
                          <label className="text-[10px] uppercase font-bold text-[#7A6B6D] tracking-wider">
                            Choose Variant:
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {srvVariants.map((v: any) => {
                              const isSelected = activeVariant?.id === v.id;
                              const delta = v.price_delta || v.priceDelta || 0;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => handleSelectVariant(srv.id, v)}
                                  className={`px-2 py-1 text-[11px] rounded border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#4A0417] text-white border-[#4A0417] font-semibold'
                                      : 'bg-[#FAF7F2] hover:bg-white border-[#E8DDD3] text-[#1F1A1C]'
                                  }`}
                                >
                                  <span>{v.name}</span>
                                  {delta !== 0 && (
                                    <span className="ml-1 opacity-80 tabular-nums">
                                      ({delta > 0 ? `+₹${delta}` : `-₹${Math.abs(delta)}`})
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Price and CTA */}
                    <div className="pt-4 border-t border-[#E8DDD3] mt-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg sm:text-xl font-serif font-bold text-[#4A0417] tabular-nums">
                            ₹{finalSellingPrice.toLocaleString('en-IN')}
                          </span>
                          {srv.original_price && srv.original_price > finalSellingPrice && (
                            <span className="text-xs text-[#8C7A7C] line-through tabular-nums">
                              ₹{srv.original_price.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#6B5A5C]">Pay after service</span>
                      </div>

                      <button
                        onClick={() => navigate('/services')}
                        className="px-3.5 py-1.5 bg-[#4A0417] hover:bg-[#36020F] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>Book</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#C5A880]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};
