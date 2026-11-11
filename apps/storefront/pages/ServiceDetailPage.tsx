import React, { useState, useEffect } from 'react';
import { Clock, Check, Plus, ShieldCheck, Sparkles, ArrowLeft, ShoppingBag, Phone, MessageCircle, Calendar, AlertCircle } from 'lucide-react';
import { useRouter } from '../router.tsx';
import { formatDuration } from '../../../src/utils/formatters.ts';
import { getServiceImageUrl } from '../../../src/utils/serviceImageMapper.ts';

interface Props {
  slug: string;
  onAddToCart: (service: any, variant?: any, addons?: any[]) => void;
  onBookNow?: (service: any, variant?: any, addons?: any[]) => void;
  onOpenCart: () => void;
}

export const ServiceDetailPage: React.FC<Props> = ({
  slug,
  onAddToCart,
  onBookNow,
  onOpenCart
}) => {
  const { navigate } = useRouter();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/storefront/service/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.service) {
          setService(data.service);
          const defaultVar = data.service.variants?.find((v: any) => v.is_default === 1) || data.service.variants?.[0];
          setSelectedVariant(defaultVar);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="py-20 max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm text-[#7A6B6D] animate-pulse">Loading treatment details...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="py-20 max-w-md mx-auto px-4 text-center space-y-3">
        <h2 className="text-xl font-serif font-bold text-[#1F1A1C]">Treatment Not Found</h2>
        <p className="text-xs text-[#7A6B6D]">The requested service is currently not available in our Delhi NCR catalog.</p>
        <button
          onClick={() => navigate('/services')}
          className="px-4 py-2 bg-[#4A0417] text-white text-xs font-semibold rounded"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  const variantDelta = selectedVariant?.price_delta || 0;
  const variantDuration = selectedVariant?.duration_delta || 0;

  const chosenAddons = (service.addons || []).filter((a: any) => selectedAddonIds.includes(a.id));
  const addonsDelta = chosenAddons.reduce((sum: number, a: any) => sum + a.price, 0);
  const addonsDuration = chosenAddons.reduce((sum: number, a: any) => sum + a.duration_mins, 0);

  const finalPrice = service.selling_price + variantDelta + addonsDelta;
  const finalDuration = service.duration_mins + variantDuration + addonsDuration;

  const handleToggleAddon = (id: string) => {
    setSelectedAddonIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAdd = () => {
    onAddToCart(
      {
        id: service.id,
        name: service.name,
        sellingPrice: service.selling_price,
        durationMins: service.duration_mins
      },
      selectedVariant ? { id: selectedVariant.id, name: selectedVariant.name, priceDelta: selectedVariant.price_delta } : undefined,
      chosenAddons.map((a: any) => ({ id: a.id, name: a.name, price: a.price, durationMins: a.duration_mins }))
    );
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2500);
  };

  const handleBookNowAction = () => {
    const srvPayload = {
      id: service.id,
      name: service.name,
      sellingPrice: service.selling_price,
      durationMins: service.duration_mins
    };
    const varPayload = selectedVariant ? { id: selectedVariant.id, name: selectedVariant.name, priceDelta: selectedVariant.price_delta } : undefined;
    const addonsPayload = chosenAddons.map((a: any) => ({ id: a.id, name: a.name, price: a.price, durationMins: a.duration_mins }));

    if (onBookNow) {
      onBookNow(srvPayload, varPayload, addonsPayload);
    } else {
      onAddToCart(srvPayload, varPayload, addonsPayload);
      onOpenCart();
    }
  };

  return (
    <div className="py-10 sm:py-14 bg-[#FAF7F2] min-h-[85vh]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-[#8C7A7C]">
          <button onClick={() => navigate('/')} className="hover:text-[#4A0417]">Home</button>
          <span>/</span>
          <button onClick={() => navigate('/services')} className="hover:text-[#4A0417]">Services</button>
          <span>/</span>
          <span className="text-[#1F1A1C] font-medium truncate max-w-xs">{service.name}</span>
        </div>

        {/* 2-Column Product Detail Layout */}
        <div className="bg-white rounded-2xl border border-[#E8DDD3] shadow-md p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Details, Benefits, Included */}
          <div className="md:col-span-7 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#4A0417] tracking-wider uppercase mb-1.5">
                <span>{service.category?.name || 'Beauty Treatment'}</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 text-[#6B5A5C]">
                  <Clock className="w-3.5 h-3.5 text-[#4A0417]" />
                  <span className="tabular-nums font-semibold">{formatDuration(finalDuration)}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F1A1C] leading-snug">
                {service.name}
              </h1>

              <p className="mt-3 text-sm text-[#554749] leading-relaxed">
                {service.description}
              </p>
            </div>

            {/* Benefits */}
            {service.benefits && service.benefits.length > 0 && (
              <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DDD3]">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                  Key Treatment Results
                </h4>
                <ul className="space-y-1.5 text-xs text-[#4A3E3D]">
                  {service.benefits.map((b: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2">
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
                  Single-Use Sterile Kit Contents
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#554749]">
                  {service.whatsIncluded.map((step: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded bg-[#FAF7F2] border border-[#E8DDD3]">
                      <span className="w-4 h-4 rounded-full bg-white text-[#4A0417] font-semibold flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hygiene Promise Badge */}
            <div className="flex items-center gap-2.5 p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DDD3] text-xs text-[#554749]">
              <ShieldCheck className="w-5 h-5 text-[#4A0417] shrink-0" />
              <span>Hospital-Grade Sanitization: Tools sterilized in autoclave indicator pouches, opened right in front of you.</span>
            </div>
          </div>

          {/* Right Column: Contiguous Purchase Module (PDP) */}
          <div className="md:col-span-5 bg-[#FAF7F2] p-6 rounded-2xl border border-[#E8DDD3] space-y-5 sticky top-24">
            
            {/* Price Headline */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-[#1F1A1C] tabular-nums">
                  ₹{finalPrice.toLocaleString('en-IN')}
                </span>
                {service.original_price > service.selling_price && (
                  <span className="text-sm text-[#8C7A7C] line-through tabular-nums">
                    ₹{(service.original_price + variantDelta + addonsDelta).toLocaleString('en-IN')}
                  </span>
                )}
                {service.discount_percent > 0 && (
                  <span className="text-xs font-semibold text-emerald-800">
                    {service.discount_percent}% OFF
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6B5A5C] mt-1">
                Duration: <span className="font-semibold text-[#1F1A1C] tabular-nums">{formatDuration(finalDuration)}</span> · Pay after treatment
              </p>
            </div>

            {/* Variants */}
            {service.variants && service.variants.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#4A0417] uppercase tracking-wider block">
                  Select Formulation / Wax Type:
                </label>
                <div className="space-y-1.5">
                  {service.variants.map((v: any) => {
                    const isChecked = selectedVariant?.id === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                          isChecked
                            ? 'bg-white border-[#4A0417] shadow-xs'
                            : 'bg-white/60 border-[#E8DDD3] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={isChecked}
                            onChange={() => setSelectedVariant(v)}
                            className="accent-[#4A0417]"
                          />
                          <span className="font-semibold text-[#1F1A1C]">{v.name}</span>
                        </div>
                        <span className="font-bold tabular-nums">
                          {v.price_delta === 0 ? 'Standard' : `+₹${v.price_delta}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Addons */}
            {service.addons && service.addons.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#4A0417] uppercase tracking-wider block">
                  Add-on Enhancements:
                </label>
                <div className="space-y-1.5">
                  {service.addons.map((a: any) => {
                    const isSelected = selectedAddonIds.includes(a.id);
                    return (
                      <div
                        key={a.id}
                        onClick={() => handleToggleAddon(a.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-white border-[#4A0417] shadow-xs'
                            : 'bg-white/60 border-[#E8DDD3] hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleAddon(a.id)}
                            className="accent-[#4A0417] rounded"
                          />
                          <span className="font-medium text-[#1F1A1C]">{a.name}</span>
                        </div>
                        <span className="font-bold text-[#4A0417] tabular-nums">
                          +₹{a.price}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 space-y-2.5">
              <button
                onClick={handleBookNowAction}
                className="w-full py-3.5 bg-[#4A0417] hover:bg-[#36020F] text-[#FAF7F2] text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Calendar className="w-4 h-4 text-[#C5A880]" />
                <span>Book Now (₹{finalPrice})</span>
              </button>

              <button
                onClick={handleAdd}
                className="w-full py-3 bg-white border border-[#4A0417] text-[#4A0417] hover:bg-[#FAF7F2] text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Cart</span>
              </button>

              {addedSuccess && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-center text-xs text-emerald-800 font-semibold flex items-center justify-center gap-1.5 animate-in fade-in">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Added! Cart updated.</span>
                </div>
              )}

              {/* Direct Actions: Call & WhatsApp */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`https://wa.me/917827722522?text=${encodeURIComponent(`Hi BeautyDoor, I want to book or enquire about ${service.name} (₹${finalPrice}).`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center justify-center gap-1.5 shadow-xs hover:bg-emerald-100 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href="tel:+917827722522"
                  className="py-2.5 px-3 bg-[#FAF7F2] border border-[#E8DDD3] rounded-xl text-xs font-semibold text-[#4A0417] flex items-center justify-center gap-1.5 shadow-xs hover:bg-[#EAE2D8] transition-colors"
                >
                  <Phone className="w-4 h-4 text-[#4A0417]" />
                  <span>Call Us</span>
                </a>
              </div>

              {/* Minimum Order Policy Notice */}
              <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#E8DDD3] text-[11px] text-[#5C4D4F] space-y-1">
                <div className="font-bold text-[#1F1A1C]">Minimum Booking Policy:</div>
                <div className="grid grid-cols-3 gap-1 font-mono text-[10px] text-[#4A0417] font-semibold">
                  <span>Delhi: ₹1,000</span>
                  <span>Haryana: ₹1,500</span>
                  <span>Noida: ₹1,500</span>
                </div>
                <p className="text-[10px] text-[#7A6B6D] pt-0.5">
                  Your cart must meet the minimum order amount for your selected service location before you can confirm your booking.
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
