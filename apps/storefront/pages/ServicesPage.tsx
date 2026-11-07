import React, { useState, useEffect } from 'react';
import { Search, Clock, Plus, Check, Filter, Sparkles, ArrowRight, ShieldCheck, ChevronRight, Info, Eye } from 'lucide-react';
import { useRouter } from '../router.tsx';
import { ServiceDetailModal } from '../../../src/components/ServiceDetailModal.tsx';

import { formatDuration } from '../../../src/utils/formatters.ts';
import { getServiceImageUrl } from '../../../src/utils/serviceImageMapper.ts';

interface Props {
  services: any[];
  categories: any[];
  onQuickAdd: (service: any) => void;
  cartItemIds: string[];
}

export const ServicesPage: React.FC<Props> = ({
  services,
  categories,
  onQuickAdd,
  cartItemIds
}) => {
  const { path, navigate } = useRouter();

  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'priceAsc' | 'priceDesc' | 'durationAsc'>('popular');
  const [activeModalService, setActiveModalService] = useState<any | null>(null);

  // Sync category from URL parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const catParam = urlParams.get('category');
      if (catParam) {
        setSelectedCat(catParam);
      }
    }
  }, [path]);

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

  // Image resolver using specific service mapper
  const getServicePhoto = (srv: any) => {
    return getServiceImageUrl(srv);
  };

  const currentCategoryObj = categories.find(c => c.id === selectedCat);

  return (
    <div className="py-8 sm:py-12 bg-[#FAF7F2] min-h-[90vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb & Header */}
        <div className="mb-6 sm:mb-8">
          <nav aria-label="Breadcrumb" className="text-xs sm:text-sm text-[#8C7A7C] mb-2 flex items-center gap-1.5">
            <button onClick={() => navigate('/')} className="hover:text-[#4A0417] transition-colors">Home</button>
            <span aria-hidden="true">/</span>
            <span className="text-[#4A0417] font-medium">Beauty Catalog</span>
            {currentCategoryObj && (
              <>
                <span aria-hidden="true">/</span>
                <span className="text-[#1F1A1C] font-semibold">{currentCategoryObj.name}</span>
              </>
            )}
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#1F1A1C] tracking-tight">
                At-Home Beauty Services
              </h1>
              <p className="text-base sm:text-lg text-[#554749] mt-2 font-light max-w-3xl leading-relaxed">
                Certified female beauty specialists, sterile single-use kits, and professional salon rituals delivered across Delhi NCR. Pay after service.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => navigate('/rate-card')}
                className="px-4 py-2.5 bg-[#4A0417] hover:bg-[#36020F] text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4 text-[#C5A880]" />
                <span>Download Rate Card</span>
              </button>

              <button
                onClick={() => navigate('/packages')}
                className="px-4 py-2.5 bg-white text-[#4A0417] hover:bg-[#F4EFEA] border border-[#C5A880] text-xs sm:text-sm font-semibold rounded-lg shadow-2xs flex items-center gap-2 transition-all"
              >
                <span>Curated Packages</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Horizontal Category Scroller (Sticky on mobile) */}
        <div className="lg:hidden mb-6 -mx-4 px-4 overflow-x-auto pb-2 scrollbar-none sticky top-16 z-20 bg-[#FAF7F2]/95 backdrop-blur-xs py-2 border-b border-[#E8DDD3]/80">
          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={() => setSelectedCat('all')}
              className={`px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-xs ${
                selectedCat === 'all'
                  ? 'bg-[#4A0417] text-white'
                  : 'bg-white text-[#554749] border border-[#E8DDD3] hover:border-[#C5A880]'
              }`}
            >
              All Rituals ({services.length})
            </button>
            {categories.map((cat) => {
              const count = services.filter(s => s.category_id === cat.id).length;
              const isSelected = selectedCat === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`px-4 py-2.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-xs flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#4A0417] text-white'
                      : 'bg-white text-[#554749] border border-[#E8DDD3] hover:border-[#C5A880]'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[10px] tabular-nums px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-[#FAF7F2] text-[#8C7A7C]'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Part Stylebee Browsing Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR: Categories Navigation (Desktop 4 cols, sticky) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 bg-white rounded-2xl border border-[#E8DDD3] p-5 shadow-xs">
            <div className="mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[#4A0417] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C5A880]" />
                <span>Service Categories</span>
              </h2>
              <p className="text-xs text-[#8C7A7C] mt-0.5">Explore our complete Delhi NCR treatment menu</p>
            </div>

            {/* Quick Search */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-[#8C7A7C] absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search treatments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E8DDD3] rounded-lg focus:outline-hidden focus:border-[#4A0417] transition-colors"
              />
            </div>

            {/* Category List */}
            <nav className="space-y-1 max-h-[60vh] overflow-y-auto scrollbar-thin pr-1">
              <button
                onClick={() => setSelectedCat('all')}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between group ${
                  selectedCat === 'all'
                    ? 'bg-[#4A0417] text-white shadow-xs font-semibold'
                    : 'text-[#3D3335] hover:bg-[#FAF7F2] hover:text-[#4A0417]'
                }`}
              >
                <span>All Treatments</span>
                <span className={`text-xs tabular-nums px-2 py-0.5 rounded-full ${selectedCat === 'all' ? 'bg-white/20 text-white' : 'bg-[#FAF7F2] text-[#8C7A7C]'}`}>
                  {services.length}
                </span>
              </button>

              {categories.map((cat) => {
                const count = services.filter(s => s.category_id === cat.id).length;
                const isSelected = selectedCat === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCat(cat.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-[#4A0417] text-white shadow-xs font-semibold'
                        : 'text-[#3D3335] hover:bg-[#FAF7F2] hover:text-[#4A0417]'
                    }`}
                  >
                    <span className="truncate pr-2">{cat.name}</span>
                    <span className={`text-xs tabular-nums px-2 py-0.5 rounded-full shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-[#FAF7F2] text-[#8C7A7C]'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Hygiene Promise Box */}
            <div className="mt-6 pt-5 border-t border-[#E8DDD3] bg-[#FAF7F2] -mx-5 -mb-5 p-5 rounded-b-2xl">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#4A0417] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4A0417]">Hygienic Protocol</h4>
                  <p className="text-xs text-[#554749] mt-0.5 leading-relaxed">
                    Zero double-dipping, fresh disposable wooden spatulas, sanitized tools, and sealed single-use kits.
                  </p>
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT AREA: Services Grid (8 cols on desktop) */}
          <main className="lg:col-span-8 space-y-6">
            
            {/* Active Category Header Bar & Sort */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8DDD3] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F1A1C]">
                  {selectedCat === 'all' ? 'All Services' : currentCategoryObj?.name}
                </h2>
                <p className="text-xs sm:text-sm text-[#7A6B6D] mt-0.5">
                  Showing {sorted.length} {sorted.length === 1 ? 'treatment' : 'treatments'} in Delhi NCR
                </p>
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs text-[#8C7A7C] font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-[#FAF7F2] border border-[#E8DDD3] text-[#1F1A1C] text-xs sm:text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-[#4A0417]"
                >
                  <option value="popular">Most Popular</option>
                  <option value="priceAsc">Price: Low to High</option>
                  <option value="priceDesc">Price: High to Low</option>
                  <option value="durationAsc">Duration: Shortest</option>
                </select>
              </div>
            </div>

            {/* Service Cards Grid */}
            {sorted.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
                {sorted.map((srv) => {
                  const inCart = cartItemIds.includes(srv.id);
                  const price = srv.selling_price || srv.sellingPrice;
                  const originalPrice = srv.original_price || srv.originalPrice;
                  const duration = srv.duration_mins || srv.durationMins;
                  const photoUrl = getServicePhoto(srv);

                  return (
                    <article
                      key={srv.id}
                      className="bg-white rounded-2xl border border-[#E8DDD3] hover:border-[#C5A880] transition-all hover:shadow-lg overflow-hidden flex flex-col justify-between group"
                    >
                      <div>
                        {/* Service Photo with hover zoom */}
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
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                            <span className="text-xs font-semibold text-white flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Complete Details</span>
                            </span>
                          </div>

                          {/* Quick Duration Badge */}
                          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-semibold text-[#1F1A1C] shadow-sm flex items-center gap-1 tabular-nums">
                            <Clock className="w-3 h-3 text-[#4A0417]" />
                            <span>{formatDuration(duration)}</span>
                          </div>

                          {srv.is_bestseller === 1 && (
                            <div className="absolute top-3 right-3 bg-[#4A0417] text-white px-2.5 py-0.5 rounded-full text-[11px] font-semibold shadow-xs">
                              Bestseller
                            </div>
                          )}
                        </div>

                        {/* Card Content */}
                        <div className="p-5 sm:p-6 space-y-2">
                          <h3
                            onClick={() => setActiveModalService(srv)}
                            className="text-lg sm:text-xl font-serif font-bold text-[#1F1A1C] hover:text-[#4A0417] cursor-pointer transition-colors leading-snug line-clamp-2"
                          >
                            {srv.name}
                          </h3>

                          <p className="text-sm sm:text-base text-[#554749] line-clamp-2 leading-relaxed font-light">
                            {srv.description}
                          </p>
                        </div>
                      </div>

                      {/* Card Footer with Price, View Details & Add to Bag */}
                      <div className="p-5 sm:p-6 pt-0 border-t border-[#F0EAE1] mt-2 flex items-center justify-between gap-3">
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
                            className="text-xs font-semibold text-[#8C7A7C] hover:text-[#4A0417] underline decoration-[#C5A880] transition-colors mt-0.5 inline-block"
                          >
                            View details
                          </button>
                        </div>

                        <button
                          onClick={() => onQuickAdd(srv)}
                          className={`px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
                            inCart
                              ? 'bg-emerald-700 text-white'
                              : 'bg-[#4A0417] hover:bg-[#36020F] text-white hover:shadow-md'
                          }`}
                        >
                          {inCart ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>In Bag</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 text-[#C5A880]" />
                              <span>Add to Bag</span>
                            </>
                          )}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E8DDD3] p-12 text-center space-y-3">
                <Sparkles className="w-8 h-8 text-[#C5A880] mx-auto" />
                <h3 className="text-lg font-serif font-bold text-[#1F1A1C]">No services found</h3>
                <p className="text-sm text-[#7A6B6D] max-w-md mx-auto">
                  Try adjusting your search terms or explore another category from the sidebar.
                </p>
                <button
                  onClick={() => { setSearch(''); setSelectedCat('all'); }}
                  className="px-4 py-2 bg-[#4A0417] text-white text-xs font-semibold rounded-lg"
                >
                  Reset filters
                </button>
              </div>
            )}
          </main>
        </div>

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
            isActive: true
          }}
          onClose={() => setActiveModalService(null)}
          onAddToCart={(s, v, a) => {
            onQuickAdd(s);
          }}
        />
      )}
    </div>
  );
};
