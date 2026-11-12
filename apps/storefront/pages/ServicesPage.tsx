import React, { useState, useEffect } from 'react';
import { Search, Clock, Plus, Check, Sparkles, ShieldCheck, Eye, X, ArrowUpDown, Star, Calendar, Gift, Wind, SlidersHorizontal, ChevronRight, Tag } from 'lucide-react';
import { useRouter } from '../router.tsx';
import { ServiceDetailModal } from '../../../src/components/ServiceDetailModal.tsx';
import { formatDuration } from '../../../src/utils/formatters.ts';
import { getServiceImageUrl } from '../../../src/utils/serviceImageMapper.ts';

interface Props {
  services: any[];
  categories: any[];
  packages?: any[];
  onAddPackage?: (pkg: any, selectedVariant?: string) => void;
  onQuickAdd: (service: any) => void;
  onQuickBook?: (service: any) => void;
  onBookNow?: (service: any, variant?: any, addons?: any[]) => void;
  cartItemIds: string[];
}

export const ServicesPage: React.FC<Props> = ({
  services,
  categories,
  packages = [],
  onAddPackage,
  onQuickAdd,
  onQuickBook,
  onBookNow,
  cartItemIds
}) => {
  const { path, navigate } = useRouter();

  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'priceAsc' | 'priceDesc' | 'durationAsc'>('popular');
  const [activeModalService, setActiveModalService] = useState<any | null>(null);
  const [activeModalPackage, setActiveModalPackage] = useState<any | null>(null);
  const [selectedFacialVariant, setSelectedFacialVariant] = useState<Record<string, string>>({
    'pkg-total-care': 'Insta Glow',
    'pkg-just-relax': 'Insta Glow',
    'pkg-glamour-essentials': 'Anti-Tan'
  });

  // Lock background scroll when any modal is active
  useEffect(() => {
    if (activeModalService || activeModalPackage) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [activeModalService, activeModalPackage]);

  // Sync category from URL parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const catParam = urlParams.get('category');
      if (catParam) {
        setSelectedCat(catParam);
      } else {
        setSelectedCat('all');
      }
    }
  }, [path]);

  const handleSelectCategory = (catId: string) => {
    setSelectedCat(catId);
    if (typeof window !== 'undefined') {
      const newUrl = catId === 'all' ? '/services' : `/services?category=${catId}`;
      window.history.pushState({}, '', newUrl);
    }
  };

  // Filtering
  const filtered = services.filter((s) => {
    if (selectedCat !== 'all' && s.category_id !== selectedCat) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (s.name || '').toLowerCase().includes(q);
      const matchDesc = (s.description || '').toLowerCase().includes(q);
      const matchBrand = (s.brand || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchBrand) return false;
    }

    return true;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    const priceA = a.selling_price || a.sellingPrice || 0;
    const priceB = b.selling_price || b.sellingPrice || 0;
    const durA = a.duration_mins || a.durationMins || 0;
    const durB = b.duration_mins || b.durationMins || 0;

    if (sortBy === 'priceAsc') return priceA - priceB;
    if (sortBy === 'priceDesc') return priceB - priceA;
    if (sortBy === 'durationAsc') return durA - durB;
    return (b.is_popular || 0) + (b.is_bestseller || 0) - ((a.is_popular || 0) + (a.is_bestseller || 0));
  });

  const getServicePhoto = (srv: any) => {
    return getServiceImageUrl(srv);
  };

  const currentCategoryObj = categories.find(c => c.id === selectedCat);

  // Filter packages for currently selected category
  const categoryPackages = (packages || []).filter((p: any) => {
    if (selectedCat === 'all') return false;
    let catIds = p.category_ids;
    if (!catIds && p.category_ids_json) {
      try {
        catIds = JSON.parse(p.category_ids_json);
      } catch (e) {
        catIds = [];
      }
    }
    return Array.isArray(catIds) && catIds.includes(selectedCat);
  });

  const handleBookPackage = (pkg: any) => {
    const chosenVariant = selectedFacialVariant[pkg.id] || (pkg.slug?.includes('total-care') || pkg.slug?.includes('just-relax') || pkg.slug?.includes('glamour-essentials') ? 'Insta Glow' : undefined);
    if (onAddPackage) {
      onAddPackage(pkg, chosenVariant);
    }
  };

  return (
    <div className="pt-6 pb-28 sm:py-12 bg-[#FAF7F2] min-h-[90vh] overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Breadcrumb & Header */}
        <div>
          <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-[#8C7A7C] mb-2 flex items-center gap-1.5">
            <button onClick={() => navigate('/')} className="hover:text-[#4A0417] transition-colors cursor-pointer">Home</button>
            <span aria-hidden="true">/</span>
            <button onClick={() => handleSelectCategory('all')} className="hover:text-[#4A0417] transition-colors cursor-pointer">
              Beauty Catalog
            </button>
            {currentCategoryObj && (
              <>
                <span aria-hidden="true">/</span>
                <span className="text-[#4A0417] font-semibold">{currentCategoryObj.name}</span>
              </>
            )}
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div className="max-w-3xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#1F1A1C] tracking-tight">
                {currentCategoryObj ? currentCategoryObj.name : 'At-Home Beauty Services'}
              </h1>
              <p className="text-base sm:text-lg text-[#554749] mt-2 font-light leading-relaxed">
                {currentCategoryObj?.description || 'Certified female beauty specialists, sterile single-use kits, and professional salon services delivered across Delhi NCR. Pay after service.'}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => navigate('/packages')}
                className="px-4 py-2.5 bg-[#4A0417] hover:bg-[#36020F] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#C5A880]" />
                <span>Ready-Made Packages (Save 20%)</span>
              </button>

              <button
                onClick={() => navigate('/rate-card')}
                className="px-4 py-2.5 bg-white text-[#4A0417] hover:bg-[#F4EFEA] border border-[#C5A880] text-xs sm:text-sm font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Rate Card</span>
              </button>
            </div>
          </div>
        </div>

        {/* Phase 2: Unified Top Controls — Search, Sort & Hygiene Promise */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8DDD3] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8C7A7C] absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search treatments (e.g. Gold Facial, Rica Wax, Manicure)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E8DDD3] rounded-xl focus:outline-hidden focus:border-[#4A0417] transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-3 text-[#8C7A7C] hover:text-[#1F1A1C]"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector & Count */}
          <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
            <div className="text-xs text-[#7A6B6D] font-medium hidden sm:block">
              Showing <span className="font-bold text-[#1F1A1C]">{sorted.length}</span> {sorted.length === 1 ? 'treatment' : 'treatments'}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8C7A7C] font-medium flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-[#FAF7F2] border border-[#E8DDD3] text-[#1F1A1C] text-xs sm:text-sm font-semibold rounded-lg px-3 py-2 focus:outline-hidden focus:border-[#4A0417] cursor-pointer"
              >
                <option value="popular">Most Popular</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="durationAsc">Duration: Shortest</option>
              </select>
            </div>
          </div>
        </div>

        {/* Phase 2: Single Top Row of Category Chips (Clean, Responsive, No Duplicate Sidebar) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider font-bold text-[#4A0417] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Select Category</span>
            </h2>
            {selectedCat !== 'all' && (
              <button
                onClick={() => handleSelectCategory('all')}
                className="text-xs font-semibold text-[#8C7A7C] hover:text-[#4A0417] underline decoration-[#C5A880] cursor-pointer"
              >
                Clear filter (View All)
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {/* All Treatments Chip */}
            <button
              onClick={() => handleSelectCategory('all')}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                selectedCat === 'all'
                  ? 'bg-[#4A0417] text-white ring-2 ring-[#4A0417]/20 shadow-md'
                  : 'bg-white text-[#3D3335] border border-[#E8DDD3] hover:border-[#C5A880] hover:bg-[#FAF7F2]'
              }`}
            >
              <span>All Treatments</span>
              <span className={`text-[11px] tabular-nums px-2 py-0.5 rounded-full font-bold ${
                selectedCat === 'all' ? 'bg-white/20 text-white' : 'bg-[#FAF7F2] text-[#8C7A7C]'
              }`}>
                {services.length}
              </span>
            </button>

            {/* Individual Category Chips */}
            {categories.map((cat) => {
              const count = services.filter(s => s.category_id === cat.id).length;
              const isSelected = selectedCat === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#4A0417] text-white ring-2 ring-[#4A0417]/20 shadow-md'
                      : 'bg-white text-[#3D3335] border border-[#E8DDD3] hover:border-[#C5A880] hover:bg-[#FAF7F2]'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[11px] tabular-nums px-2 py-0.5 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#FAF7F2] text-[#8C7A7C]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hygiene Promise Micro-Banner */}
        <div className="bg-[#FAF7F2] border border-[#E8DDD3] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#5C4D4F]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#4A0417] shrink-0" />
            <span className="font-medium">
              Delhi NCR Hygiene Protocol: 100% single-use sealed kits, sanitized instruments & certified female professionals.
            </span>
          </div>
          <span className="font-semibold text-[#4A0417]">Zero Doorstep Visiting Charge</span>
        </div>

        {/* Category-Wise Value Packages Section */}
        {categoryPackages.length > 0 && (
          <section className="bg-gradient-to-br from-[#FFFBF7] to-white rounded-2xl border-2 border-[#C5A880]/40 p-5 sm:p-7 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DDD3]">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#4A0417]">
                  <Sparkles className="w-4 h-4 text-[#C5A880]" />
                  <span>Curated Package Bundles</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F1A1C] mt-0.5">
                  Ready-Made Packages with {currentCategoryObj ? currentCategoryObj.name : 'this Category'}
                </h2>
                <p className="text-xs sm:text-sm text-[#7A6B6D] font-light mt-0.5">
                  Save up to 30% by bundling your {currentCategoryObj?.name || 'services'} with waxing, manicure, bleach or body polishing.
                </p>
              </div>
              <button
                onClick={() => navigate('/packages')}
                className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white border border-[#C5A880] text-xs font-semibold text-[#4A0417] hover:bg-[#FAF7F2] transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>View all packages</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {categoryPackages.map((pkg: any) => {
                const pkgSellingPrice = pkg.selling_price || pkg.sellingPrice || 0;
                const pkgOriginalPrice = pkg.original_price || pkg.originalPrice || 0;
                const pkgDurationMins = pkg.duration_mins || pkg.durationMins || 0;
                const pkgInclusions = pkg.inclusions || (pkg.inclusions_json ? JSON.parse(pkg.inclusions_json) : []);
                const hasVlccChoice = pkg.slug?.includes('total-care') || pkg.slug?.includes('just-relax') || pkg.slug?.includes('glamour-essentials') || pkg.vlcc_facial_variant;
                const selectedVariant = selectedFacialVariant[pkg.id] || 'Insta Glow';
                const isAdded = cartItemIds.some((id: string) => id.includes(pkg.id));

                return (
                  <article
                    key={pkg.id}
                    className="bg-white rounded-xl border border-[#E8DDD3] hover:border-[#C5A880] transition-all hover:shadow-lg p-4 sm:p-5 flex flex-col justify-between relative group"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        {pkg.badge ? (
                          <span className="px-2.5 py-0.5 bg-[#4A0417] text-white text-[10px] font-bold tracking-wider rounded uppercase">
                            {pkg.badge}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-[#C5A880]/20 text-[#4A0417] text-[10px] font-bold tracking-wider rounded uppercase">
                            Value Bundle
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-[#6B5A5C]">
                          <Clock className="w-3 h-3 text-[#4A0417]" />
                          <span className="tabular-nums">{formatDuration(pkgDurationMins)}</span>
                        </span>
                      </div>

                      {/* Package Title & Subtitle */}
                      <div>
                        <h3 className="font-serif font-bold text-base sm:text-lg text-[#1F1A1C] group-hover:text-[#4A0417] transition-colors leading-snug">
                          {pkg.name}
                        </h3>
                        {pkg.subtitle && (
                          <p className="text-xs text-[#8C7A7C] font-light mt-0.5 line-clamp-1">
                            {pkg.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Inclusions Preview */}
                      <div className="bg-[#FAF7F2] p-3 rounded-lg border border-[#E8DDD3]/70 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A0417] block">
                          Included Treatments ({pkgInclusions.length}):
                        </span>
                        <ul className="space-y-1">
                          {pkgInclusions.slice(0, 3).map((item: any, idx: number) => {
                            const name = typeof item === 'object' ? item.name : String(item);
                            const isFree = typeof item === 'object' ? !!item.is_free : name.toLowerCase().includes('free');
                            return (
                              <li key={idx} className="flex items-center gap-1.5 text-xs text-[#4A3E3D]">
                                {isFree ? (
                                  <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                )}
                                <span className={`truncate ${isFree ? 'font-bold text-amber-900' : ''}`}>
                                  {name}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                        {pkgInclusions.length > 3 && (
                          <p className="text-[10px] font-semibold text-[#8C7A7C] pt-0.5">
                            +{pkgInclusions.length - 3} more treatments included
                          </p>
                        )}
                      </div>

                      {/* Facial Variant Selector if applicable */}
                      {hasVlccChoice && (
                        <div className="pt-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-[#4A0417] block mb-1">
                            Choose Facial Variant:
                          </label>
                          <div className="grid grid-cols-2 gap-1.5">
                            {['Insta Glow', 'Anti-Tan'].map((vName) => {
                              const active = selectedVariant === vName;
                              return (
                                <button
                                  key={vName}
                                  type="button"
                                  onClick={() => setSelectedFacialVariant(prev => ({ ...prev, [pkg.id]: vName }))}
                                  className={`py-1 px-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                    active
                                      ? 'bg-[#4A0417] text-white border-[#4A0417] shadow-2xs'
                                      : 'bg-white text-[#4A3E3D] border-[#E8DDD3] hover:border-[#C5A880]'
                                  }`}
                                >
                                  {vName}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Pricing & Actions */}
                    <div className="pt-4 mt-3 border-t border-[#E8DDD3] flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-serif font-bold text-[#4A0417] tabular-nums">
                            ₹{pkgSellingPrice.toLocaleString('en-IN')}
                          </span>
                          {pkgOriginalPrice > pkgSellingPrice && (
                            <span className="text-xs text-[#8C7A7C] line-through tabular-nums">
                              ₹{pkgOriginalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveModalPackage(pkg)}
                          className="text-[11px] font-semibold text-[#8C7A7C] hover:text-[#4A0417] underline decoration-[#C5A880] transition-colors cursor-pointer"
                        >
                          View package details
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBookPackage(pkg)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'bg-[#4A0417] hover:bg-[#36020F] text-white active:scale-95'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
                            <span>Add Package</span>
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Phase 2 & 3: Direct Full-Width Service Cards Grid (3 Columns on Large Screens) */}
        {sorted.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {sorted.map((srv) => {
              const inCart = cartItemIds.includes(srv.id);
              const price = srv.selling_price || srv.sellingPrice || 0;
              const originalPrice = srv.original_price || srv.originalPrice;
              const duration = srv.duration_mins || srv.durationMins || 0;
              const photoUrl = getServicePhoto(srv);

              return (
                <article
                  key={srv.id}
                  className="bg-white rounded-2xl border border-[#E8DDD3] hover:border-[#C5A880] transition-all hover:shadow-xl overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Card Photo with Hover Zoom & Badges */}
                    <div 
                      onClick={() => setActiveModalService(srv)}
                      className="relative aspect-16/10 w-full overflow-hidden bg-[#F0EAE1] cursor-pointer"
                    >
                      <img
                        src={photoUrl}
                        alt={srv.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3.5">
                        <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Full Service Details</span>
                        </span>
                      </div>

                      {/* Formatted Duration Badge */}
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-semibold text-[#1F1A1C] shadow-sm flex items-center gap-1 tabular-nums">
                        <Clock className="w-3.5 h-3.5 text-[#4A0417]" />
                        <span>{formatDuration(duration)}</span>
                      </div>

                      {/* Promo / Bestseller Badge */}
                      {srv.is_bestseller === 1 && (
                        <div className="absolute top-3 right-3 bg-[#4A0417] text-white px-2.5 py-0.5 rounded-full text-[11px] font-semibold shadow-xs">
                          Bestseller
                        </div>
                      )}
                    </div>

                    {/* Card Content with Stylebee-inspired layout */}
                    <div className="p-5 sm:p-6 space-y-2.5">
                      {/* Quality & Sterile Kit Indicator */}
                      <div className="flex items-center gap-2 text-xs text-[#6B5A5C]">
                        {srv.brand ? (
                          <span className="font-semibold text-[#4A0417] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E8DDD3] text-[10px] uppercase tracking-wider">
                            {srv.brand}
                          </span>
                        ) : (
                          <span className="font-medium text-[#7A6B6D] text-[10px] uppercase tracking-wider">
                            BeautyDoor Exclusive
                          </span>
                        )}
                        <span aria-hidden="true" className="text-[#C5A880]">·</span>
                        <span className="text-[11px] text-[#7A6B6D]">Single-Use Sterile Kit</span>
                      </div>

                      <h3
                        onClick={() => setActiveModalService(srv)}
                        className="text-lg sm:text-xl font-serif font-bold text-[#1F1A1C] hover:text-[#4A0417] cursor-pointer transition-colors leading-snug line-clamp-2"
                      >
                        {srv.name}
                      </h3>

                      <p className="text-xs sm:text-sm text-[#554749] line-clamp-2 leading-relaxed font-light">
                        {srv.description}
                      </p>

                      {/* Feature Bullet Highlights */}
                      <div className="pt-1 space-y-1 text-xs text-[#5C4D4F]">
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>100% Single-use sealed disposables</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>Certified background-verified specialist</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Price, View Details & Add to Bag */}
                  <div className="p-5 sm:p-6 pt-0 border-t border-[#F4EFEA] mt-2 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl sm:text-2xl font-serif font-bold text-[#4A0417] tabular-nums">
                          ₹{price.toLocaleString('en-IN')}
                        </span>
                        {originalPrice && originalPrice > price && (
                          <span className="text-xs text-[#8C7A7C] line-through tabular-nums">
                            ₹{originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setActiveModalService(srv)}
                        className="text-xs font-semibold text-[#8C7A7C] hover:text-[#4A0417] underline decoration-[#C5A880] transition-colors mt-0.5 inline-block cursor-pointer"
                      >
                        View details
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={() => onQuickAdd(srv)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer border ${
                          inCart
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-white border-[#E8DDD3] text-[#4A0417] hover:bg-[#FAF7F2]'
                        }`}
                        title="Add to cart"
                      >
                        {inCart ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => (onQuickBook ? onQuickBook(srv) : onQuickAdd(srv))}
                        className="px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold bg-[#4A0417] hover:bg-[#36020F] text-white transition-all flex items-center gap-1.5 shadow-xs hover:shadow-md cursor-pointer whitespace-nowrap active:scale-95"
                        title="Book Now"
                      >
                        <Calendar className="w-3.5 h-3.5 text-[#C5A880]" />
                        <span>Book Now</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Empty Search / Filter State */
          <div className="bg-white rounded-2xl border border-[#E8DDD3] p-12 text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#FAF7F2] text-[#4A0417] flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-[#C5A880]" />
            </div>
            <h3 className="text-xl font-serif font-bold text-[#1F1A1C]">No treatments found</h3>
            <p className="text-sm text-[#7A6B6D] max-w-md mx-auto font-light">
              We couldn't find any treatments matching your criteria. Try adjusting your search or explore other beauty categories.
            </p>
            <button
              onClick={() => { setSearch(''); handleSelectCategory('all'); }}
              className="px-5 py-2.5 bg-[#4A0417] hover:bg-[#36020F] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Reset Filters & View All
            </button>
          </div>
        )}

      </div>

      {/* Service Detail Modal */}
      {activeModalService && (
        <ServiceDetailModal
          service={{
            id: activeModalService.id,
            categoryId: activeModalService.category_id || activeModalService.categoryId,
            name: activeModalService.name,
            description: activeModalService.description,
            detailedDescription: activeModalService.detailed_description || activeModalService.detailedDescription || activeModalService.description,
            benefits: activeModalService.benefits || (activeModalService.benefits_json ? JSON.parse(activeModalService.benefits_json) : []),
            durationMins: activeModalService.duration_mins || activeModalService.durationMins,
            originalPrice: activeModalService.original_price || activeModalService.originalPrice,
            sellingPrice: activeModalService.selling_price || activeModalService.sellingPrice,
            discountPercent: activeModalService.discount_percent || activeModalService.discountPercent,
            whatsIncluded: activeModalService.whatsIncluded || (activeModalService.whats_included_json ? JSON.parse(activeModalService.whats_included_json) : []),
            imageUrl: getServicePhoto(activeModalService),
            variants: activeModalService.variants || [],
            addons: activeModalService.addons || [],
            treatmentSteps: activeModalService.treatmentSteps || (activeModalService.steps_json ? JSON.parse(activeModalService.steps_json) : []),
            stepsCount: activeModalService.stepsCount || activeModalService.steps_count || 0,
            brand: activeModalService.brand || '',
            isActive: true
          }}
          onClose={() => setActiveModalService(null)}
          onAddToCart={(s, v, a) => {
            onQuickAdd(s);
          }}
          onBookNow={(s, v, a) => {
            if (onBookNow) onBookNow(s, v, a);
            else if (onQuickBook) onQuickBook(s);
            else onQuickAdd(s);
          }}
        />
      )}

      {/* Package Detail Modal */}
      {activeModalPackage && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setActiveModalPackage(null)}
        >
          <div
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#E8DDD3] p-5 sm:p-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModalPackage(null)}
              aria-label="Close modal"
              className="absolute top-4 right-4 p-1.5 text-[#8C7A7C] hover:text-[#1F1A1C] hover:bg-[#FAF7F2] rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  {activeModalPackage.badge && (
                    <span className="px-2.5 py-0.5 bg-[#4A0417] text-white text-[10px] font-bold tracking-wider rounded uppercase">
                      {activeModalPackage.badge}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-xs text-[#6B5A5C] font-semibold">
                    <Clock className="w-3.5 h-3.5 text-[#4A0417]" />
                    <span className="tabular-nums">{formatDuration(activeModalPackage.duration_mins || activeModalPackage.durationMins || 0)}</span>
                  </span>
                </div>

                <h3 className="font-serif text-2xl font-bold text-[#1F1A1C]">
                  {activeModalPackage.name}
                </h3>
                {activeModalPackage.subtitle && (
                  <p className="text-xs text-[#8C7A7C] mt-0.5">
                    {activeModalPackage.subtitle}
                  </p>
                )}
                {activeModalPackage.description && (
                  <p className="text-xs text-[#554749] mt-2 font-light leading-relaxed">
                    {activeModalPackage.description}
                  </p>
                )}
              </div>

              {/* All Inclusions List */}
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DDD3] space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#4A0417] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Full Package Inclusions</span>
                </h4>
                <ul className="space-y-2 text-xs text-[#3D3335]">
                  {(activeModalPackage.inclusions || (activeModalPackage.inclusions_json ? JSON.parse(activeModalPackage.inclusions_json) : [])).map((item: any, idx: number) => {
                    const name = typeof item === 'object' ? item.name : String(item);
                    const isFree = typeof item === 'object' ? !!item.is_free : name.toLowerCase().includes('free');
                    return (
                      <li key={idx} className="flex items-start gap-2.5">
                        {isFree ? (
                          <Gift className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        <span className={`leading-snug ${isFree ? 'font-bold text-amber-900' : 'font-medium'}`}>
                          {name}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Variant Selector if applicable */}
              {(activeModalPackage.slug?.includes('total-care') || activeModalPackage.slug?.includes('just-relax') || activeModalPackage.slug?.includes('glamour-essentials') || activeModalPackage.vlcc_facial_variant) && (
                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DDD3] space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#4A0417] block">
                    Select Facial Variant:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Insta Glow', 'Anti-Tan'].map((vName) => {
                      const active = (selectedFacialVariant[activeModalPackage.id] || 'Insta Glow') === vName;
                      return (
                        <button
                          key={vName}
                          type="button"
                          onClick={() => setSelectedFacialVariant(prev => ({ ...prev, [activeModalPackage.id]: vName }))}
                          className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            active
                              ? 'bg-[#4A0417] text-white border-[#4A0417] shadow-xs'
                              : 'bg-white text-[#4A3E3D] border-[#E8DDD3] hover:border-[#C5A880]'
                          }`}
                        >
                          {vName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AC Room & Hair Growth Prep Notice */}
              <div className="p-3 rounded-xl bg-[#FFFBF0] border border-[#F3E5AB] space-y-1 text-xs text-[#7A5A1E]">
                <p className="font-bold text-[#4A0417] flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-[#C5A880]" />
                  AC Room & Hair Growth Preparation Required
                </p>
                <p className="text-[11px] leading-relaxed">
                  Please ensure an air-conditioned room (approx. 22-24°C) is ready upon beautician arrival. Hair length should be at least 1/4 inch for painless, smooth waxing.
                </p>
              </div>

              {/* Single-Use Hygiene Guarantee */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1 text-xs text-emerald-950">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Our Single-Use Hygiene Guarantee
                </p>
                <p className="text-[11px] leading-relaxed">
                  Disposables unsealed in front of you. Beautician uses sanitized stainless steel tweezers, single-use wooden spatulas, disposable bedsheets, and leaves your space immaculate.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[#EAE2D8] flex items-center justify-between gap-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-serif font-bold text-[#1F1A1C] tabular-nums">
                    ₹{(activeModalPackage.selling_price || activeModalPackage.sellingPrice || 0).toLocaleString('en-IN')}
                  </span>
                  {(activeModalPackage.original_price || activeModalPackage.originalPrice) && (
                    <span className="text-xs text-[#8C7A7C] line-through tabular-nums">
                      ₹{(activeModalPackage.original_price || activeModalPackage.originalPrice).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleBookPackage(activeModalPackage);
                    setActiveModalPackage(null);
                  }}
                  className="px-5 py-2.5 bg-[#4A0417] hover:bg-[#36020F] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Add Package to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
