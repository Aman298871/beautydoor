import React, { useState } from 'react';
import { X, Clock, Check, Plus, ShieldCheck, Sparkles, Wind, AlertCircle, HeartHandshake, CheckCircle2 } from 'lucide-react';
import { ServiceItem, ServiceVariant, ServiceAddon } from '../types.ts';
import { formatDuration } from '../utils/formatters.ts';
import { getServiceImageUrl } from '../utils/serviceImageMapper.ts';

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
  const [imageError, setImageError] = useState(false);

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

  // Resolve image based on service mapper
  const resolveServiceImage = () => {
    if (imageError) return '/images/hero_beauty_ritual.jpg';
    return getServiceImageUrl(service);
  };

  const isWaxing = service.categoryId?.includes('wax') || service.name?.toLowerCase().includes('wax');
  const isFacial = service.categoryId?.includes('facial') || service.categoryId?.includes('cleanup') || service.name?.toLowerCase().includes('facial');
  const isMassage = service.categoryId?.includes('massage') || service.name?.toLowerCase().includes('massage');
  const isBodyCare = service.categoryId?.includes('scrub') || service.name?.toLowerCase().includes('polishing') || service.name?.toLowerCase().includes('scrub');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E8DDD3] my-6 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-service-title"
      >
        {/* Close Button Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 text-[#4A3E3D] hover:text-[#1F1A1C] bg-white/90 hover:bg-white rounded-full shadow-md transition-all border border-[#E8DDD3]/60 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A0417]"
          aria-label="Close treatment details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 max-h-[85vh] overflow-hidden">
          
          {/* Left Column: Premium Photography & Quality Guarantee (Desktop 5 cols, Mobile Top) */}
          <div className="md:col-span-5 bg-[#FAF7F2] border-b md:border-b-0 md:border-r border-[#E8DDD3] flex flex-col justify-between">
            <div className="relative aspect-4/3 md:aspect-auto md:h-72 lg:h-80 w-full overflow-hidden bg-[#F0EAE1]">
              <img
                src={resolveServiceImage()}
                alt={service.name}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent md:hidden" />
              
              {/* Mobile overlay title */}
              <div className="absolute bottom-3 left-4 right-4 md:hidden text-white">
                <span className="text-xs uppercase tracking-wider text-[#C5A880] font-semibold">BeautyDoor Ritual</span>
                <h3 className="text-xl font-serif font-bold text-white leading-tight drop-shadow-sm">{service.name}</h3>
              </div>
            </div>

            {/* Quality Commitment Sidebar Highlights */}
            <div className="p-5 sm:p-6 space-y-3.5 hidden md:block">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4A0417] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                BeautyDoor Care Standards
              </h4>
              <ul className="space-y-2.5 text-xs text-[#554749]">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#4A0417] shrink-0 mt-0.5" />
                  <span>100% verified, certified female beauty specialists</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#4A0417] shrink-0 mt-0.5" />
                  <span>Single-use sterile disposables & protective linen</span>
                </li>
                <li className="flex items-start gap-2">
                  <Wind className="w-4 h-4 text-[#4A0417] shrink-0 mt-0.5" />
                  <span>AC room service comfort & gentle after-care care</span>
                </li>
                <li className="flex items-start gap-2">
                  <HeartHandshake className="w-4 h-4 text-[#4A0417] shrink-0 mt-0.5" />
                  <span>Pay after service via UPI, Card, or Cash</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Comprehensive Structured Information (7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between overflow-hidden">
            
            {/* Scrollable Content Body */}
            <div className="p-5 sm:p-7 space-y-6 overflow-y-auto max-h-[calc(85vh-90px)] scrollbar-thin">
              
              {/* Title & Key Metrics (Desktop Header) */}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#4A0417] tracking-wider uppercase mb-1">
                  <span>Professional At-Home Beauty Ritual</span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1 font-normal text-[#6B5A5C]">
                    <Clock className="w-3.5 h-3.5 text-[#4A0417]" />
                    <span className="tabular-nums font-semibold">{formatDuration(finalDuration)}</span>
                  </span>
                </div>
                
                <h2 id="modal-service-title" className="text-2xl sm:text-3xl font-serif font-bold text-[#1F1A1C] tracking-tight">
                  {service.name}
                </h2>

                <div className="mt-2.5 flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-serif font-bold text-[#4A0417] tabular-nums">
                    ₹{finalPrice.toLocaleString('en-IN')}
                  </span>
                  {service.originalPrice && service.originalPrice > finalPrice && (
                    <span className="text-base text-[#8C7A7C] line-through tabular-nums">
                      ₹{service.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                  {service.discountPercent && service.discountPercent > 0 && (
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Save {service.discountPercent}%
                    </span>
                  )}
                </div>
              </div>

              {/* 1. About This Service (Clear, Unique, Customer-Friendly) */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4A0417]">
                  About This Ritual
                </h3>
                <p className="text-base text-[#4A3E3D] leading-relaxed font-light">
                  {service.detailedDescription || service.description}
                </p>
              </div>

              {/* 2. What's Included */}
              {(service.whatsIncluded && service.whatsIncluded.length > 0) ? (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4A0417]">
                    What's Included
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[#4A3E3D]">
                    {service.whatsIncluded.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E8DDD3]/80">
                        <Check className="w-4 h-4 text-[#4A0417] shrink-0" />
                        <span className="font-medium text-xs sm:text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4A0417]">
                    What's Included
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[#4A3E3D]">
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E8DDD3]/80">
                      <Check className="w-4 h-4 text-[#4A0417] shrink-0" />
                      <span className="font-medium text-xs sm:text-sm">Verified Female Specialist</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E8DDD3]/80">
                      <Check className="w-4 h-4 text-[#4A0417] shrink-0" />
                      <span className="font-medium text-xs sm:text-sm">Sterile Single-Use Disposables</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E8DDD3]/80">
                      <Check className="w-4 h-4 text-[#4A0417] shrink-0" />
                      <span className="font-medium text-xs sm:text-sm">Premium Professional Products</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#FAF7F2] border border-[#E8DDD3]/80">
                      <Check className="w-4 h-4 text-[#4A0417] shrink-0" />
                      <span className="font-medium text-xs sm:text-sm">Post-Service Area Cleanup</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Step-by-Step Process (Where applicable) */}
              {isFacial && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4A0417]">
                    Step-by-Step Treatment Protocol
                  </h3>
                  <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#554749]">
                    <li className="flex items-start gap-2 p-2 bg-[#FAF7F2] rounded border border-[#E8DDD3]">
                      <span className="font-bold text-[#4A0417] shrink-0">1.</span>
                      <span>Deep Pore Cleanser & Surface Detox</span>
                    </li>
                    <li className="flex items-start gap-2 p-2 bg-[#FAF7F2] rounded border border-[#E8DDD3]">
                      <span className="font-bold text-[#4A0417] shrink-0">2.</span>
                      <span>Gentle Botanical Micro-Exfoliation Scrub</span>
                    </li>
                    <li className="flex items-start gap-2 p-2 bg-[#FAF7F2] rounded border border-[#E8DDD3]">
                      <span className="font-bold text-[#4A0417] shrink-0">3.</span>
                      <span>Steam & Gentle Extraction (if needed)</span>
                    </li>
                    <li className="flex items-start gap-2 p-2 bg-[#FAF7F2] rounded border border-[#E8DDD3]">
                      <span className="font-bold text-[#4A0417] shrink-0">4.</span>
                      <span>Calming Radiance Facial Massage</span>
                    </li>
                    <li className="flex items-start gap-2 p-2 bg-[#FAF7F2] rounded border border-[#E8DDD3]">
                      <span className="font-bold text-[#4A0417] shrink-0">5.</span>
                      <span>Targeted Skin Nourishing Pack / Mask</span>
                    </li>
                    <li className="flex items-start gap-2 p-2 bg-[#FAF7F2] rounded border border-[#E8DDD3]">
                      <span className="font-bold text-[#4A0417] shrink-0">6.</span>
                      <span>Hydrating Serum & Protective Finish</span>
                    </li>
                  </ol>
                </div>
              )}

              {service.slug?.includes('body-polishing') && (
                <div className="space-y-2.5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#4A0417]">
                    The 5-Step Polishing Ceremony
                  </h3>
                  <ol className="space-y-1.5 text-xs text-[#554749]">
                    <li className="flex items-center gap-2 p-2 bg-[#FAF7F2] rounded border border-[#E8DDD3]">
                      <span className="font-bold text-[#4A0417] shrink-0">Step 1:</span>
                      <span>Gentle Dry Body Brushing (Lymphatic circulation stimulation)</span>
                    </li>
                    <li className="flex items-center gap-2 p-2 bg-[#FAF7F2] rounded border border-[#E8DDD3]">
                      <span className="font-bold text-[#4A0417] shrink-0">Step 2:</span>
                      <span>Botanical Walnut & Sugar Scrub Full-Body Exfoliation</span>
                    </li>
                    <li className="flex items-center gap-2 p-2 bg-[#FAF7F2] rounded border border-[#E8DDD3]">
                      <span className="font-bold text-[#4A0417] shrink-0">Step 3:</span>
                      <span>Warm Towel Cleansing & Surface Pore Purifying</span>
                    </li>
                    <li className="flex items-center gap-2 p-2 bg-[#FAF7F2] rounded border border-[#E8DDD3]">
                      <span className="font-bold text-[#4A0417] shrink-0">Step 4:</span>
                      <span>Mineral Kaolin Clay Body Wrap & Skin Detoxification</span>
                    </li>
                    <li className="flex items-center gap-2 p-2 bg-[#FAF7F2] rounded border border-[#E8DDD3]">
                      <span className="font-bold text-[#4A0417] shrink-0">Step 5:</span>
                      <span>Hydrating Glow Oil Emulsion & Silky Massage Finish</span>
                    </li>
                  </ol>
                </div>
              )}

              {/* 4. Before-Service Preparation & Client Guidelines */}
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DDD3] space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4A0417] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[#C5A880]" />
                  Before Your Appointment
                </h4>
                <ul className="space-y-1.5 text-xs text-[#4A3E3D]">
                  {isWaxing ? (
                    <>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#4A0417] shrink-0 mt-0.5" />
                        <span><strong>Clean, dry skin:</strong> Avoid applying body oils, moisturisers, or heavy creams before your waxing appointment.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#4A0417] shrink-0 mt-0.5" />
                        <span><strong>AC room comfort:</strong> An air-conditioned room (recommended 22°C–24°C) helps wax set cleanly and comfortably.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#4A0417] shrink-0 mt-0.5" />
                        <span><strong>Hair growth:</strong> Recommended hair growth of approximately 1/4 inch (2–3 weeks of natural growth) for clean root extraction.</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#4A0417] shrink-0 mt-0.5" />
                        <span>Ensure a private, quiet room with comfortable seating or a clean bed/mat.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#4A0417] shrink-0 mt-0.5" />
                        <span>Keep access to a standard electrical outlet and bathroom nearby for warm water if required.</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* 5. After-Care Guidance */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4A0417]">
                  After-Care Guidance
                </h4>
                <p className="text-xs text-[#554749] leading-relaxed">
                  {isWaxing 
                    ? 'Soothing chamomile gel is applied post-wax. For best skin comfort, avoid direct sunlight, hot showers, swimming pools, and tight synthetic clothing for 24 hours.'
                    : isFacial
                    ? 'Avoid washing face with harsh soaps for 12 hours. Drink plenty of water and apply gentle sunscreen before stepping out into direct sunlight.'
                    : 'Relax and stay hydrated. Avoid strenuous physical activity for a few hours to allow therapeutic oils to nourish your skin.'}
                </p>
              </div>

              {/* Variants Selector (if any) */}
              {service.variants && service.variants.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4A0417]">
                      Select Treatment Variant
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
                              <span className="text-sm font-semibold text-[#1F1A1C]">{v.name}</span>
                              {v.durationDelta > 0 && (
                                <span className="text-xs text-[#8C7A7C] ml-2">(+{v.durationDelta} mins)</span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-semibold tabular-nums text-[#4A0417]">
                            {v.priceDelta > 0 ? `+₹${v.priceDelta}` : 'Included'}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Fixed Action Footer Bar */}
            <div className="p-4 sm:p-5 bg-white border-t border-[#E8DDD3] flex items-center justify-between gap-4 shrink-0 shadow-lg">
              <div>
                <div className="text-xs text-[#7A6B6D] font-medium">Total Price (incl. single-use kit)</div>
                <div className="text-2xl font-serif font-bold text-[#4A0417] tabular-nums">
                  ₹{finalPrice.toLocaleString('en-IN')}
                </div>
              </div>

              <button
                onClick={handleConfirmAdd}
                className="px-6 py-3 bg-[#4A0417] hover:bg-[#36020F] text-white text-sm font-semibold rounded-lg flex items-center gap-2 shadow-md hover:shadow-lg transition-all focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#4A0417]"
              >
                <Plus className="w-4 h-4 text-[#C5A880]" />
                <span>Add to Bag / Book Service</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
