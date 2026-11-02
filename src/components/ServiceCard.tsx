import React from 'react';
import { Clock, Plus, Sparkles, Check } from 'lucide-react';
import { ServiceItem } from '../types.ts';

interface Props {
  service: ServiceItem;
  onSelectService: (service: ServiceItem) => void;
  onQuickAdd: (service: ServiceItem) => void;
  isInCart?: boolean;
}

export const ServiceCard: React.FC<Props> = ({
  service,
  onSelectService,
  onQuickAdd,
  isInCart
}) => {
  return (
    <div className="group relative bg-white rounded-xl border border-[#E8DDD3] hover:border-[#C5A880] p-5 sm:p-6 transition-all duration-200 hover:shadow-md flex flex-col justify-between">
      
      <div>
        {/* Top Unboxed Metadata */}
        <div className="flex items-center justify-between text-xs text-[#7A6B6D] mb-2.5">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-[#4A0417]" />
            <span className="tabular-nums">{service.durationMins} mins</span>
            <span aria-hidden="true">·</span>
            <span>Single-Use Kit</span>
          </div>

          {service.accentBadge && (
            <span className="text-[11px] font-semibold text-[#4A0417] tracking-wide">
              {service.accentBadge}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-[#1F1A1C] group-hover:text-[#4A0417] transition-colors leading-snug">
          {service.name}
        </h3>

        {/* Description */}
        <p className="mt-2 text-xs sm:text-sm text-[#5C4D4F] line-clamp-2 leading-relaxed">
          {service.description}
        </p>

        {/* Benefits Preview */}
        {service.benefits && service.benefits.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-[#6B5A5C]">
            {service.benefits.slice(0, 2).map((benefit, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-[#C5A880] font-bold">✓</span>
                <span className="truncate">{benefit}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pricing & Actions */}
      <div className="mt-5 pt-4 border-t border-[#F4EFEA] flex items-center justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-bold text-[#1F1A1C] tabular-nums">
              ₹{service.sellingPrice.toLocaleString('en-IN')}
            </span>
            {service.originalPrice > service.sellingPrice && (
              <span className="text-xs text-[#9C8C8E] line-through tabular-nums">
                ₹{service.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          {service.discountPercent > 0 && (
            <span className="text-[11px] font-semibold text-emerald-800 tracking-tight">
              Save {service.discountPercent}%
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Detailed customizer button */}
          <button
            onClick={() => onSelectService(service)}
            className="px-3 py-2 text-xs font-semibold text-[#4A0417] hover:bg-[#FAF7F2] border border-[#4A0417]/20 rounded-md transition-colors"
          >
            Options
          </button>

          {/* Quick Add or In-Cart Indicator */}
          <button
            onClick={() => onQuickAdd(service)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              isInCart
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                : 'bg-[#4A0417] hover:bg-[#36020F] text-[#FAF7F2] shadow-xs active:scale-[0.98]'
            }`}
          >
            {isInCart ? (
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
};
