import React, { useState, useEffect } from 'react';
import { Search, Clock, Plus, Check, Filter, Sparkles, ArrowRight, ArrowUpDown, ChevronRight } from 'lucide-react';
import { useRouter } from '../router.tsx';

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

  // Extract initial category from URL if present
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under1000' | '1000to2500' | 'above2500'>('all');
  const [durationFilter, setDurationFilter] = useState<'all' | 'under45' | '45to90' | 'above90'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'priceAsc' | 'priceDesc' | 'durationAsc'>('popular');

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

  // Filtering logic
  const filtered = services.filter((s) => {
    // Category
    if (selectedCat !== 'all' && s.category_id !== selectedCat) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = (s.name || '').toLowerCase().includes(q);
      const matchDesc = (s.description || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }

    // Price Filter
    const price = s.selling_price || s.sellingPrice || 0;
    if (priceFilter === 'under1000' && price >= 1000) return false;
    if (priceFilter === '1000to2500' && (price < 1000 || price > 2500)) return false;
    if (priceFilter === 'above2500' && price <= 2500) return false;

    // Duration Filter
    const dur = s.duration_mins || s.durationMins || 0;
    if (durationFilter === 'under45' && dur >= 45) return false;
    if (durationFilter === '45to90' && (dur < 45 || dur > 90)) return false;
    if (durationFilter === 'above90' && dur <= 90) return false;

    return true;
  });

  // Sorting logic
  const sorted = [...filtered].sort((a, b) => {
    const priceA = a.selling_price || a.sellingPrice || 0;
    const priceB = b.selling_price || b.sellingPrice || 0;
    const durA = a.duration_mins || a.durationMins || 0;
    const durB = b.duration_mins || b.durationMins || 0;

    if (sortBy === 'priceAsc') return priceA - priceB;
    if (sortBy === 'priceDesc') return priceB - priceA;
    if (sortBy === 'durationAsc') return durA - durB;
    // Default: popular / bestseller first
    return (b.is_popular || 0) + (b.is_bestseller || 0) - ((a.is_popular || 0) + (a.is_bestseller || 0));
  });

  return (
    <div className="py-10 sm:py-16 bg-[#FAF7F2] min-h-[85vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Title & Breadcrumb */}
        <div className="mb-8">
          <p className="text-xs text-[#8C7A7C] mb-1">
            <span onClick={() => navigate('/')} className="hover:text-[#4A0417] cursor-pointer">Home</span> / Services Catalog
          </p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C]">
                At-Home Beauty & Salon Catalog
              </h1>
              <p className="text-sm text-[#5C4D4F] mt-1 font-light max-w-2xl">
                Certified female specialists, sealed monodose kits, and cash after service delivered directly to your doorstep in Delhi NCR.
              </p>
            </div>

            <button
              onClick={() => navigate('/packages')}
              className="self-start md:self-auto px-4 py-2.5 bg-white text-[#4A0417] hover:bg-[#F4EFEA] border border-[#C5A880] text-xs font-semibold rounded-md shadow-2xs flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Custom Package Builder (Save 20%)</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar Container */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E8DDD3] mb-8 shadow-xs space-y-4">
          
          {/* Top Row: Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs font-semibold">
            <button
              onClick={() => setSelectedCat('all')}
              className={`px-3.5 py-2 rounded-md whitespace-nowrap transition-colors ${
                selectedCat === 'all'
                  ? 'bg-[#4A0417] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#554749] hover:bg-[#EAE2D8]'
              }`}
            >
              All Treatments ({services.length})
            </button>

            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`px-3.5 py-2 rounded-md whitespace-nowrap transition-colors ${
                  selectedCat === c.id
                    ? 'bg-[#4A0417] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-[#554749] hover:bg-[#EAE2D8]'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Bottom Row: Search, Price Filters, Duration & Sort */}
          <div className="pt-3 border-t border-[#FAF7F2] flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#8C7A7C] absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rituals by name (e.g. O3+ Facial, Rica Wax, Spa)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417]"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-2.5 text-xs text-[#8C7A7C] hover:text-[#1F1A1C]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Price Filter */}
              <select
                value={priceFilter}
                onChange={(e: any) => setPriceFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-md text-[#4A3E3D] focus:outline-none focus:border-[#4A0417]"
              >
                <option value="all">All Prices</option>
                <option value="under1000">Under ₹1,000</option>
                <option value="1000to2500">₹1,000 – ₹2,500</option>
                <option value="above2500">Above ₹2,500</option>
              </select>

              {/* Duration Filter */}
              <select
                value={durationFilter}
                onChange={(e: any) => setDurationFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-md text-[#4A3E3D] focus:outline-none focus:border-[#4A0417]"
              >
                <option value="all">All Durations</option>
                <option value="under45">Under 45 mins</option>
                <option value="45to90">45 – 90 mins</option>
                <option value="above90">90+ mins</option>
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-md text-[#4A3E3D] font-medium focus:outline-none focus:border-[#4A0417]"
              >
                <option value="popular">Recommended</option>
                <option value="priceAsc">Price: Low to High</option>
                <option value="priceDesc">Price: High to Low</option>
                <option value="durationAsc">Duration: Shortest</option>
              </select>

              {/* Reset Filters */}
              {(selectedCat !== 'all' || search || priceFilter !== 'all' || durationFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSelectedCat('all');
                    setSearch('');
                    setPriceFilter('all');
                    setDurationFilter('all');
                  }}
                  className="px-2.5 py-1.5 text-xs text-[#4A0417] hover:underline font-semibold"
                >
                  Clear Filters
                </button>
              )}

            </div>

          </div>

        </div>

        {/* Results Count */}
        <div className="mb-4 text-xs text-[#7A6B6D] flex items-center justify-between">
          <span>Showing <strong className="text-[#1F1A1C]">{sorted.length}</strong> beauty rituals</span>
          {selectedCat !== 'all' && (
            <span className="uppercase text-[10px] font-bold tracking-wider text-[#4A0417] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E8DDD3]">
              Filtered by Category
            </span>
          )}
        </div>

        {/* Services Grid */}
        {sorted.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-[#E8DDD3] space-y-3">
            <p className="font-serif text-lg text-[#1F1A1C]">No beauty rituals match your selection</p>
            <p className="text-xs text-[#7A6B6D] max-w-sm mx-auto">
              We couldn't find any treatments matching your current search or filters. Try adjusting the price range or clearing the search query.
            </p>
            <button
              onClick={() => {
                setSelectedCat('all');
                setSearch('');
                setPriceFilter('all');
                setDurationFilter('all');
              }}
              className="mt-2 px-4 py-2 bg-[#4A0417] text-white text-xs font-semibold rounded-md shadow-xs hover:bg-[#36020F]"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((srv) => {
              const inCart = cartItemIds.includes(srv.id);
              const sellingPrice = srv.selling_price || srv.sellingPrice || 0;
              const originalPrice = srv.original_price || srv.originalPrice || 0;
              const hasDiscount = originalPrice > sellingPrice;
              const discountPercent = srv.discount_percent || (hasDiscount ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0);
              const durationMins = srv.duration_mins || srv.durationMins || 60;
              const variantsCount = srv.variants?.length || 0;
              const inclusions = srv.whatsIncluded || (srv.whats_included_json ? JSON.parse(srv.whats_included_json) : []);

              return (
                <div
                  key={srv.id}
                  className="bg-white rounded-2xl border border-[#E8DDD3] hover:border-[#C5A880] p-5 sm:p-6 flex flex-col justify-between transition-all hover:shadow-md group"
                >
                  <div>
                    {/* Header: Duration + Badges */}
                    <div className="flex items-center justify-between text-xs text-[#7A6B6D] mb-3">
                      <span className="tabular-nums font-medium flex items-center gap-1.5 text-[#4A3E3D]">
                        <Clock className="w-3.5 h-3.5 text-[#4A0417]" />
                        {durationMins} mins
                      </span>
                      
                      <div className="flex items-center gap-1.5">
                        {hasDiscount && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {discountPercent}% OFF
                          </span>
                        )}
                        {srv.deal_badge && (
                          <span className="text-[10px] uppercase font-bold text-[#4A0417] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E8DDD3]">
                            {srv.deal_badge}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3
                      onClick={() => navigate(`/service/${srv.slug}`)}
                      className="text-base sm:text-lg font-serif font-bold text-[#1F1A1C] hover:text-[#4A0417] cursor-pointer transition-colors leading-snug line-clamp-2"
                    >
                      {srv.name}
                    </h3>

                    {/* Short Description */}
                    <p className="mt-2 text-xs text-[#5C4D4F] font-light line-clamp-2 leading-relaxed">
                      {srv.description}
                    </p>

                    {/* Inclusions bullets */}
                    {inclusions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#FAF7F2] space-y-1">
                        {inclusions.slice(0, 2).map((inc: string, idx: number) => (
                          <p key={idx} className="text-[11px] text-[#6B5A5C] flex items-center gap-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A880] shrink-0" />
                            <span className="truncate">{inc}</span>
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Variants pill note */}
                    {variantsCount > 1 && (
                      <div className="mt-2.5">
                        <span className="text-[10px] text-[#8C7A7C] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E8DDD3]">
                          {variantsCount} formula options available
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Pricing & Action Buttons */}
                  <div className="mt-5 pt-4 border-t border-[#EAE2D8] flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg sm:text-xl font-bold text-[#1F1A1C] tabular-nums">
                          ₹{sellingPrice.toLocaleString('en-IN')}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-[#9C8C8E] line-through tabular-nums">
                            ₹{originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#8C7A7C]">All taxes included</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => navigate(`/service/${srv.slug}`)}
                        className="px-2.5 py-1.5 text-xs text-[#4A0417] hover:underline font-semibold"
                        title="View Full Inclusions"
                      >
                        Details
                      </button>

                      <button
                        onClick={() => onQuickAdd({
                          id: srv.id,
                          name: srv.name,
                          sellingPrice,
                          durationMins,
                          variants: srv.variants || [],
                          addons: srv.addons || []
                        })}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
                          inCart
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'bg-[#4A0417] hover:bg-[#36020F] text-[#FAF7F2] shadow-2xs active:scale-95'
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
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
