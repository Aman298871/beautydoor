import React, { useState } from 'react';
import { X, Clock, Check, Plus, ShieldCheck, Sparkles } from 'lucide-react';
import { ServiceItem, ServiceVariant, ServiceAddon } from '../types.ts';

interface Props {
  service: ServiceItem | null;
  onClose: () => void;
  onAddToCart: (service: ServiceItem, selectedVariant?: ServiceVariant, selectedAddons?: ServiceAddon[]) => void;
}

export const ServiceDetailModal: React.FC<Props> = ({
  service,
  onClose,
  onAddToCart
}) => {
  if (!service) return null;

  // Selected variant state
  const defaultVariant = service.variants?.find(v => v.isDefault) || service.variants?.[0];
  const [selectedVariant, setSelectedVariant] = useState<ServiceVariant | undefined>(defaultVariant);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  const handleToggleAddon = (addonId: string) => {
    setSelectedAddonIds(prev =>
      prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]
    );
  };

  // Pricing calculations
  const variantDelta = selectedVariant?.priceDelta || 0;
  const durationDelta = selectedVariant?.durationDelta || 0;

  const chosenAddons = (service.addons || []).filter(a => selectedAddonIds.includes(a.id));
  const addonsDelta = chosenAddons.reduce((sum, a) => sum + a.price, 0);
  const addonsDuration = chosenAddons.reduce((sum, a) => sum + a.durationMins, 0);

  const finalPrice = service.sellingPrice + variantDelta + addonsDelta;
  const finalDuration = service.durationMins + durationDelta + addonsDuration;

  const handleConfirmAdd = () => {
    onAddToCart(service, selectedVariant, chosenAddons);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E8DDD3] my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[#FAF7F2] p-5 sm:p-6 border-b border-[#E8DDD3] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#4A0417] tracking-wider uppercase mb-1">
              <span>Treatment Details</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 font-normal text-[#6B5A5C]">
                <Clock className="w-3.5 h-3.5 text-[#4A0417]" />
                <span className="tabular-nums font-semibold">{finalDuration} mins</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F1A1C]">
              {service.name}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#6B5A5C] hover:text-[#1F1A1C] hover:bg-[#EAE2D8] rounded-full transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[68vh] overflow-y-auto">
          
          {/* Description */}
          <div>
            <p className="text-sm text-[#4A3E3D] leading-relaxed">
              {service.description}
            </p>
          </div>

          {/* Benefits */}
          {service.benefits && service.benefits.length > 0 && (
            <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DDD3]">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                Key Treatment Benefits
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#4A3E3D]">
                {service.benefits.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#4A0417] shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What's Included */}
          {service.whatsIncluded && service.whatsIncluded.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-2.5">
                What's Included in Your Sealed Kit
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#554749]">
                {service.whatsIncluded.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded bg-white border border-[#F0E6DE]">
                    <span className="w-4 h-4 rounded-full bg-[#F4EFEA] text-[#4A0417] font-semibold flex items-center justify-center text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Variants Selector */}
          {service.variants && service.variants.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4A0417]">
                  Select Treatment Formulation / Variant
                </h4>
                <span className="text-[11px] text-[#8C7A7C]">Select one</span>
              </div>
              <div className="space-y-2">
                {service.variants.map((v) => {
                  const isChecked = selectedVariant?.id === v.id;
                  return (
                    <label
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#4A0417] bg-[#FAF7F2] shadow-xs'
                          : 'border-[#E8DDD3] hover:border-[#C5A880] bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="service-variant"
                          checked={isChecked}
                          onChange={() => setSelectedVariant(v)}
                          className="accent-[#4A0417]"
                        />
                        <div>
                          <span className="text-xs sm:text-sm font-semibold text-[#1F1A1C]">
                            {v.name}
                          </span>
                          {v.durationDelta > 0 && (
                            <span className="text-xs text-[#8C7A7C] ml-2">
                              (+{v.durationDelta} mins)
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-[#1F1A1C] tabular-nums">
                        {v.priceDelta === 0 ? 'Standard' : `+₹${v.priceDelta}`}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons Selector */}
          {service.addons && service.addons.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4A0417]">
                  Enhance Your Ritual (Optional Add-ons)
                </h4>
                <span className="text-[11px] text-[#8C7A7C]">Multi-select</span>
              </div>
              <div className="space-y-2">
                {service.addons.map((add) => {
                  const isSelected = selectedAddonIds.includes(add.id);
                  return (
                    <label
                      key={add.id}
                      onClick={() => handleToggleAddon(add.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#4A0417] bg-[#FAF7F2]'
                          : 'border-[#E8DDD3] hover:border-[#C5A880] bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleAddon(add.id)}
                          className="rounded accent-[#4A0417]"
                        />
                        <div>
                          <span className="text-xs sm:text-sm font-medium text-[#1F1A1C]">
                            {add.name}
                          </span>
                          <span className="text-xs text-[#8C7A7C] ml-2">
                            (+{add.durationMins} mins)
                          </span>
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-[#4A0417] tabular-nums">
                        +₹{add.price}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hygiene Guarantee Notice */}
          <div className="flex items-center gap-2 p-3 bg-[#FAF7F2] rounded-lg border border-[#E8DDD3] text-xs text-[#554749]">
            <ShieldCheck className="w-4 h-4 text-[#4A0417] shrink-0" />
            <span>BeautyDoor Certified Guarantee: 100% disposable bed roll, gowns & sanitized tools opened in your presence.</span>
          </div>

        </div>

        {/* Footer sticky purchase bar */}
        <div className="bg-[#FAF7F2] p-4 sm:p-5 border-t border-[#E8DDD3] flex items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold text-[#1F1A1C] tabular-nums">
                ₹{finalPrice.toLocaleString('en-IN')}
              </span>
              {service.originalPrice > service.sellingPrice && (
                <span className="text-xs text-[#8C7A7C] line-through tabular-nums">
                  ₹{(service.originalPrice + variantDelta + addonsDelta).toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <div className="text-xs text-[#6B5A5C] flex items-center gap-1">
              <span>Total Duration:</span>
              <span className="font-semibold text-[#1F1A1C] tabular-nums">{finalDuration} mins</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-[#554749] hover:bg-white rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAdd}
              className="px-6 py-2.5 bg-[#4A0417] hover:bg-[#36020F] text-[#FAF7F2] text-xs sm:text-sm font-semibold rounded-md shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-[#C5A880]" />
              <span>Add to Ritual Bag</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
