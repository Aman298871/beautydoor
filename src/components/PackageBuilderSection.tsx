import React, { useState } from 'react';
import { Sparkles, Check, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { ServiceItem, CartItem } from '../types.ts';

interface Props {
  services: ServiceItem[];
  onAddPackageToCart: (items: ServiceItem[]) => void;
}

export const PackageBuilderSection: React.FC<Props> = ({
  services,
  onAddPackageToCart
}) => {
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([
    'srv-wax-full-arms-legs',
    'srv-facial-o3-plus',
    'srv-pedi-bomb-spa'
  ]);

  const handleToggle = (id: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectedServices = services.filter(s => selectedServiceIds.includes(s.id));
  const subtotal = selectedServices.reduce((sum, s) => sum + s.sellingPrice, 0);
  const count = selectedServices.length;

  // Tier calculation
  let discountPercent = 0;
  let nextMilestone = 'Add 1 more to reach 10% OFF';

  if (count >= 5) {
    discountPercent = 20;
    nextMilestone = '🎉 Maximum 20% bundle discount unlocked!';
  } else if (count >= 4) {
    discountPercent = 15;
    nextMilestone = 'Add 1 more service to unlock 20% bundle discount';
  } else if (count === 3) {
    discountPercent = 10;
    nextMilestone = 'Add 1 more service to unlock 15% bundle discount';
  } else if (count === 2) {
    discountPercent = 5;
    nextMilestone = 'Add 1 more service to unlock 10% bundle discount';
  } else if (count === 1) {
    discountPercent = 0;
    nextMilestone = 'Add 1 more service to start saving 5% extra!';
  } else {
    nextMilestone = 'Pick 2 or more services to unlock bundle discounts!';
  }

  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const finalPrice = Math.max(0, subtotal - discountAmount);

  return (
    <section id="package-builder" className="py-16 sm:py-20 bg-[#F4EFEA] border-b border-[#E8DDD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Interactive Custom Package Builder</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-normal text-[#1F1A1C] tracking-tight">
            Curate your own bespoke ritual & unlock up to <span className="italic font-medium text-[#4A0417]">20% off.</span>
          </h2>
          <p className="mt-2 text-sm sm:text-base text-[#5C4D4F] font-light">
            Combine treatments across waxing, facials, mani-pedi, and hair rituals. As you bundle multiple services, our dynamic pricing engine applies tiered package discounts automatically.
          </p>
        </div>

        {/* 2-Column Grid: Left is Services Selection, Right is Sticky Bundle Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Quick Multi-Select Service List */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between text-xs text-[#7A6B6D] mb-2">
              <span>Select services to include in your package ({count} selected):</span>
              <button
                onClick={() => setSelectedServiceIds([])}
                className="text-[#4A0417] hover:underline font-medium"
              >
                Reset selection
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map((service) => {
                const isSelected = selectedServiceIds.includes(service.id);
                return (
                  <div
                    key={service.id}
                    onClick={() => handleToggle(service.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-white border-[#4A0417] shadow-xs'
                        : 'bg-white/70 hover:bg-white border-[#E8DDD3] hover:border-[#C5A880]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs uppercase font-medium text-[#8C7A7C] tracking-wider">
                          {service.categoryId.replace('-', ' ')}
                        </span>
                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-[#4A0417] text-white' : 'border border-[#C5A880] bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      <h4 className="mt-1 text-sm font-semibold text-[#1F1A1C] leading-snug">
                        {service.name}
                      </h4>
                      <p className="mt-1 text-xs text-[#6B5A5C] line-clamp-1">
                        {service.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#F4EFEA] flex items-center justify-between text-xs">
                      <span className="text-[#8C7A7C] tabular-nums">{service.durationMins} mins</span>
                      <span className="font-bold text-[#1F1A1C] tabular-nums">
                        ₹{service.sellingPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Dynamic Pricing & Savings Summary Card */}
          <div className="lg:col-span-4 sticky top-24">
            <div className="bg-white rounded-2xl p-6 border border-[#E8DDD3] shadow-md space-y-6">
              
              <div>
                <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
                  Your Custom Package
                </h3>
                <p className="text-xs text-[#7A6B6D] mt-0.5">
                  Dynamic tier discounts apply instantly
                </p>
              </div>

              {/* Tier Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#4A0417]">
                    {discountPercent > 0 ? `${discountPercent}% Bundle Savings Active` : 'Tier 1'}
                  </span>
                  <span className="text-[#1F1A1C] font-bold tabular-nums">
                    {count} / 5 Services
                  </span>
                </div>
                
                {/* Visual bar */}
                <div className="w-full bg-[#F4EFEA] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#C5A880] to-[#4A0417] h-full transition-all duration-300 rounded-full"
                    style={{ width: `${Math.min(100, (count / 5) * 100)}%` }}
                  />
                </div>

                <p className="text-[11px] text-[#6B5A5C] italic">
                  {nextMilestone}
                </p>
              </div>

              {/* Selected List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedServices.length === 0 ? (
                  <p className="text-xs text-[#8C7A7C] italic text-center py-4">
                    No services selected yet. Click any service on the left to begin bundling.
                  </p>
                ) : (
                  selectedServices.map(s => (
                    <div key={s.id} className="flex items-center justify-between text-xs py-1.5 border-b border-[#FAF7F2]">
                      <span className="truncate pr-2 text-[#4A3E3D] font-medium">{s.name}</span>
                      <span className="shrink-0 font-semibold tabular-nums text-[#1F1A1C]">
                        ₹{s.sellingPrice}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="pt-4 border-t border-[#E8DDD3] space-y-2 text-xs">
                <div className="flex justify-between text-[#6B5A5C]">
                  <span>Item Subtotal ({count} items)</span>
                  <span className="tabular-nums font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-800 font-semibold">
                    <span>Bundle Discount ({discountPercent}%)</span>
                    <span className="tabular-nums">-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm sm:text-base font-bold text-[#1F1A1C] pt-2 border-t border-[#F4EFEA]">
                  <span>Total Payable:</span>
                  <span className="tabular-nums text-[#4A0417]">
                    ₹{finalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Add to Cart CTA */}
              <button
                disabled={selectedServices.length === 0}
                onClick={() => onAddPackageToCart(selectedServices)}
                className="w-full py-3.5 bg-[#4A0417] hover:bg-[#36020F] text-[#FAF7F2] text-sm font-semibold rounded-md shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <ShoppingBag className="w-4 h-4 text-[#C5A880]" />
                <span>Add Package to Booking Bag</span>
              </button>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
