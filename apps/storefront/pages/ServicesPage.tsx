import React, { useState } from 'react';
import { Search, Clock, Plus, Check, Filter } from 'lucide-react';
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
  const { navigate } = useRouter();
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = services.filter((s) => {
    if (selectedCat !== 'all' && s.category_id !== selectedCat) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="py-12 sm:py-16 bg-[#FAF7F2] min-h-[80vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Page Title & Breadcrumb */}
        <div className="mb-8">
          <p className="text-xs text-[#8C7A7C] mb-1">
            <span onClick={() => navigate('/')} className="hover:text-[#4A0417] cursor-pointer">Home</span> / Services
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C]">
            At-Home Beauty & Salon Catalog
          </h1>
          <p className="text-sm text-[#5C4D4F] mt-1 font-light">
            Certified female specialists, single-use hospital-grade kits, and pay after service across Delhi NCR.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#E8DDD3] mb-8 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none text-xs font-semibold">
            <button
              onClick={() => setSelectedCat('all')}
              className={`px-3.5 py-2 rounded-md whitespace-nowrap transition-colors ${
                selectedCat === 'all'
                  ? 'bg-[#4A0417] text-white'
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
                    ? 'bg-[#4A0417] text-white'
                    : 'bg-[#FAF7F2] text-[#554749] hover:bg-[#EAE2D8]'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="w-4 h-4 text-[#8C7A7C] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rituals..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417]"
            />
          </div>

        </div>

        {/* Services Listing */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-[#E8DDD3] space-y-2">
            <p className="font-semibold text-sm text-[#1F1A1C]">No services found matching filters</p>
            <p className="text-xs text-[#7A6B6D]">Try searching another keyword or clear selection.</p>
            <button
              onClick={() => { setSelectedCat('all'); setSearch(''); }}
              className="text-xs text-[#4A0417] underline font-semibold mt-2"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((service) => {
              const inCart = cartItemIds.includes(service.id);
              return (
                <div
                  key={service.id}
                  className="bg-white rounded-xl border border-[#E8DDD3] hover:border-[#C5A880] p-5 flex flex-col justify-between transition-all hover:shadow-md group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#7A6B6D] mb-2">
                      <span className="tabular-nums font-medium flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#4A0417]" />
                        {service.duration_mins} mins
                      </span>
                      {service.deal_badge && (
                        <span className="text-[10px] font-bold text-[#4A0417] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E8DDD3]">
                          {service.deal_badge}
                        </span>
                      )}
                    </div>

                    <h3
                      onClick={() => navigate(`/service/${service.slug}`)}
                      className="text-base font-semibold text-[#1F1A1C] group-hover:text-[#4A0417] cursor-pointer transition-colors leading-snug"
                    >
                      {service.name}
                    </h3>

                    <p className="mt-1.5 text-xs text-[#5C4D4F] line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>

                    {service.benefits && service.benefits.length > 0 && (
                      <ul className="mt-2.5 space-y-0.5 text-xs text-[#6B5A5C]">
                        {service.benefits.slice(0, 2).map((b: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-1 truncate">
                            <span className="text-[#C5A880]">✓</span>
                            <span className="truncate">{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#F4EFEA] flex items-center justify-between gap-2">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base sm:text-lg font-bold text-[#1F1A1C] tabular-nums">
                          ₹{service.selling_price.toLocaleString('en-IN')}
                        </span>
                        {service.original_price > service.selling_price && (
                          <span className="text-xs text-[#9C8C8E] line-through tabular-nums">
                            ₹{service.original_price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      {service.discount_percent > 0 && (
                        <span className="text-[11px] font-semibold text-emerald-800">
                          {service.discount_percent}% OFF
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/service/${service.slug}`)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-[#4A0417] hover:bg-[#FAF7F2] border border-[#4A0417]/20 rounded-md transition-colors"
                      >
                        Options
                      </button>

                      <button
                        onClick={() => onQuickAdd({
                          id: service.id,
                          name: service.name,
                          sellingPrice: service.selling_price,
                          durationMins: service.duration_mins,
                          variants: service.variants || [],
                          addons: service.addons || []
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

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
};
