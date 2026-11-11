import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Clock,
  RotateCcw,
  ShoppingBag,
  Check,
  Search,
  Tag,
  Lightbulb,
  Heart
} from 'lucide-react';
import { formatDuration } from '../../../src/utils/formatters.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  basePackage: any | null;
  availableServices: any[];
  onAddCustomizedPackageToCart: (customizedPackage: any) => void;
}

interface StartingStyle {
  id: string;
  name: string;
  tagline: string;
  filter: (s: any) => boolean;
}

export const CustomizePackageModal: React.FC<Props> = ({
  isOpen,
  onClose,
  basePackage,
  availableServices,
  onAddCustomizedPackageToCart
}) => {
  // Array of services currently selected in the customized package
  const [selectedServices, setSelectedServices] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);

  // 6 Curated Starting Styles
  const STARTING_STYLES: StartingStyle[] = [
    {
      id: 'glow-smooth',
      name: 'Glow & Smooth',
      tagline: 'Facial radiance & waxing',
      filter: (s: any) => {
        const n = (s.name || '').toLowerCase();
        return n.includes('facial') || n.includes('full arms') || n.includes('full legs');
      }
    },
    {
      id: 'relax-restore',
      name: 'Relax & Restore',
      tagline: 'Massage & pampering',
      filter: (s: any) => {
        const n = (s.name || '').toLowerCase();
        const c = (s.category_id || '').toLowerCase();
        return c.includes('massage') || n.includes('pedicure') || n.includes('scalp');
      }
    },
    {
      id: 'head-to-toe',
      name: 'Head-to-Toe Care',
      tagline: 'Facial, mani-pedi & threading',
      filter: (s: any) => {
        const c = (s.category_id || '').toLowerCase();
        return c.includes('facial') || c.includes('manicure') || c.includes('threading');
      }
    },
    {
      id: 'waxing-facial-combo',
      name: 'Waxing & Facial Combo',
      tagline: 'RICA wax + glow facial',
      filter: (s: any) => {
        const c = (s.category_id || '').toLowerCase();
        return c.includes('wax') || c.includes('cleanup') || c.includes('facial');
      }
    },
    {
      id: 'monthly-maintenance',
      name: 'Monthly Maintenance',
      tagline: 'Waxing, brows & cleanup',
      filter: (s: any) => {
        const n = (s.name || '').toLowerCase();
        const c = (s.category_id || '').toLowerCase();
        return n.includes('underarm') || n.includes('arms') || c.includes('threading') || c.includes('cleanup');
      }
    },
    {
      id: 'build-scratch',
      name: 'Build from Scratch',
      tagline: 'Choose freely',
      filter: () => false
    }
  ];

  // Extract initial services when modal opens
  useEffect(() => {
    if (isOpen && basePackage && availableServices.length > 0) {
      const initial: any[] = [];
      const packageInclusions = basePackage.inclusions || [];

      packageInclusions.forEach((inc: any) => {
        const incName = typeof inc === 'string' ? inc : inc.name;
        const cleanName = incName.replace(/^(FREE |Complimentary )/i, '').toLowerCase();

        const matched = availableServices.find(s => {
          const sName = s.name.toLowerCase();
          return sName.includes(cleanName) || cleanName.includes(sName);
        });

        if (matched && !initial.some(x => x.id === matched.id)) {
          initial.push(matched);
        } else {
          const syntheticId = `inc-${cleanName.replace(/\s+/g, '-').slice(0, 20)}`;
          if (!initial.some(x => x.id === syntheticId)) {
            const isFree = typeof inc === 'object' ? inc.is_free : incName.toLowerCase().includes('free');
            initial.push({
              id: syntheticId,
              name: incName,
              sellingPrice: isFree ? 0 : 499,
              durationMins: 30,
              category_id: 'cat-custom-inclusion',
              is_free: isFree
            });
          }
        }
      });

      if (initial.length === 0) {
        initial.push(...availableServices.slice(0, 3));
      }

      setSelectedServices(initial);
      setSelectedStyleId(null);
    }
  }, [isOpen, basePackage, availableServices]);

  // Lock background scroll on mobile and desktop while customize modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

  if (!isOpen || !basePackage) return null;

  // Actions
  const handleRemoveService = (serviceId: string) => {
    if (selectedServices.length <= 1) {
      return; // Keep at least 1 service
    }
    setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
  };

  const handleAddService = (service: any) => {
    if (selectedServices.some(s => s.id === service.id)) return;
    setSelectedServices(prev => [...prev, service]);
  };

  const handleApplyStyle = (style: StartingStyle) => {
    setSelectedStyleId(style.id);
    if (style.id === 'build-scratch') {
      // Keep only 1 item to satisfy min rule
      if (availableServices.length > 0) {
        setSelectedServices([availableServices[0]]);
      }
      return;
    }

    const matched = availableServices.filter(style.filter);
    if (matched.length > 0) {
      // Pick up to 3 distinctive services for the style
      setSelectedServices(matched.slice(0, 3));
    }
  };

  const handleReset = () => {
    if (basePackage && availableServices.length > 0) {
      const initial: any[] = [];
      const packageInclusions = basePackage.inclusions || [];

      packageInclusions.forEach((inc: any) => {
        const incName = typeof inc === 'string' ? inc : inc.name;
        const cleanName = incName.replace(/^(FREE |Complimentary )/i, '').toLowerCase();
        const matched = availableServices.find(s => {
          const sName = s.name.toLowerCase();
          return sName.includes(cleanName) || cleanName.includes(sName);
        });
        if (matched && !initial.some(x => x.id === matched.id)) {
          initial.push(matched);
        }
      });

      if (initial.length === 0) {
        initial.push(...availableServices.slice(0, 3));
      }
      setSelectedServices(initial);
      setSelectedStyleId(null);
    }
  };

  // Calculations
  const rawSubtotal = selectedServices.reduce((sum, s) => sum + (s.selling_price || s.sellingPrice || 0), 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + (s.duration_mins || s.durationMins || 0), 0);
  const count = selectedServices.length;

  // Dynamic Tier Bundle Discount
  let discountPercent = 0;
  if (count >= 5) discountPercent = 20;
  else if (count === 4) discountPercent = 15;
  else if (count === 3) discountPercent = 10;
  else if (count === 2) discountPercent = 5;

  const discountAmount = Math.round((rawSubtotal * discountPercent) / 100);
  const finalPrice = Math.max(0, rawSubtotal - discountAmount);

  // Context-Aware Smart Recommendation Engine
  const hasWaxing = selectedServices.some(s => {
    const c = (s.category_id || '').toLowerCase();
    const n = (s.name || '').toLowerCase();
    return c.includes('wax') || n.includes('wax');
  });
  const hasFacialOrCleanup = selectedServices.some(s => {
    const c = (s.category_id || '').toLowerCase();
    const n = (s.name || '').toLowerCase();
    return c.includes('facial') || c.includes('cleanup') || n.includes('facial') || n.includes('cleanup');
  });
  const hasMassage = selectedServices.some(s => {
    const c = (s.category_id || '').toLowerCase();
    const n = (s.name || '').toLowerCase();
    return c.includes('massage') || n.includes('massage');
  });
  const hasManiPedi = selectedServices.some(s => {
    const c = (s.category_id || '').toLowerCase();
    const n = (s.name || '').toLowerCase();
    return c.includes('manicure') || c.includes('pedicure') || n.includes('mani') || n.includes('pedi');
  });
  const hasThreading = selectedServices.some(s => {
    const c = (s.category_id || '').toLowerCase();
    const n = (s.name || '').toLowerCase();
    return c.includes('threading') || n.includes('threading') || n.includes('eyebrow');
  });

  let recommendation: { text: string; candidateService: any } | null = null;
  if (hasWaxing && !hasFacialOrCleanup) {
    const cand = availableServices.find(s => s.category_id === 'cat-cleanup' || s.name.toLowerCase().includes('cleanup') || s.name.toLowerCase().includes('korean glass'));
    if (cand) {
      recommendation = {
        text: 'Pair your waxing with a soothing Fruit Cleanup or Korean Glass Facial for calm, radiant skin.',
        candidateService: cand
      };
    }
  } else if (hasFacialOrCleanup && !hasThreading) {
    const cand = availableServices.find(s => s.category_id === 'cat-threading' || s.name.toLowerCase().includes('eyebrow'));
    if (cand) {
      recommendation = {
        text: 'Add Organic Eyebrow Threading to frame your post-facial glow.',
        candidateService: cand
      };
    }
  } else if (hasMassage && !hasManiPedi) {
    const cand = availableServices.find(s => s.category_id === 'cat-manicure-pedicure' || s.name.toLowerCase().includes('pedicure'));
    if (cand) {
      recommendation = {
        text: 'Add an effervescent Rose Himalayan Pedicure for full-body unwinding.',
        candidateService: cand
      };
    }
  }

  // Available candidate services to add (not yet in the bundle)
  const candidateServices = availableServices.filter(s => {
    if (selectedServices.some(sel => sel.id === s.id)) return false;
    if (activeCategory !== 'all') {
      const cat = (s.category_id || '').toLowerCase();
      if (activeCategory === 'cat-waxing') {
        if (!cat.includes('wax')) return false;
      } else if (activeCategory === 'cat-facials-all') {
        if (!cat.includes('facial') && !cat.includes('cleanup')) return false;
      } else if (activeCategory === 'cat-mani-pedi') {
        if (!cat.includes('manicure') && !cat.includes('pedicure')) return false;
      } else if (activeCategory === 'cat-massage-body') {
        if (!cat.includes('massage') && !cat.includes('scrub')) return false;
      } else if (activeCategory === 'cat-threading-bleach') {
        if (!cat.includes('threading') && !cat.includes('bleach') && !cat.includes('detan')) return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (s.name || '').toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q);
    }
    return true;
  });

  const handleAddBundleToCart = () => {
    const customizedPackage = {
      id: `custom-${basePackage.id}-${Date.now()}`,
      basePackageId: basePackage.id,
      name: `${basePackage.name} (Custom Package)`,
      originalName: basePackage.name,
      selling_price: finalPrice,
      sellingPrice: finalPrice,
      original_price: rawSubtotal,
      originalPrice: rawSubtotal,
      duration_mins: totalDuration,
      durationMins: totalDuration,
      isPackage: true,
      isCustomized: true,
      customizedServices: selectedServices.map(s => ({
        id: s.id,
        name: s.name,
        sellingPrice: s.selling_price || s.sellingPrice || 0,
        durationMins: s.duration_mins || s.durationMins || 0
      }))
    };

    onAddCustomizedPackageToCart(customizedPackage);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 overscroll-contain flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 md:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-4xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-[#E8DDD3] flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden overscroll-contain animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Top Header */}
        <div className="bg-[#FAF7F2] p-5 border-b border-[#E8DDD3] flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A0417]">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Make Your Own Package</span>
              <span aria-hidden="true">·</span>
              <span>{basePackage.name}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F1A1C] mt-1">
              Make Your Own Package
            </h2>
            <p className="text-xs text-[#6B5A5C] mt-0.5 max-w-2xl font-light">
              Add the beauty services you want. You can also remove or change any service before booking. Pricing and time needed update dynamically.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-medium text-[#4A0417] hover:underline flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-[#EAE2D8] transition-colors cursor-pointer"
              title="Reset to default package inclusions"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#6B5A5C] hover:text-[#1F1A1C] hover:bg-[#EAE2D8] rounded-full transition-colors cursor-pointer"
              aria-label="Close customizer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Guided Starting Styles Selector */}
        <div className="bg-[#FFFDFB] px-5 py-3 border-b border-[#F0E6DD] overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-[11px] font-bold text-[#4A0417] uppercase tracking-wider flex items-center gap-1 mr-1">
              <Heart className="w-3 h-3 text-[#C5A880]" />
              Starting Style:
            </span>
            {STARTING_STYLES.map(style => (
              <button
                key={style.id}
                type="button"
                onClick={() => handleApplyStyle(style)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                  selectedStyleId === style.id
                    ? 'bg-[#4A0417] text-white border-[#4A0417] shadow-xs'
                    : 'bg-[#FAF7F2] text-[#4A3E3D] hover:bg-[#F2ECE3] border-[#E8DDD3]'
                }`}
              >
                <span>{style.name}</span>
                <span className="text-[10px] opacity-75 hidden sm:inline">({style.tagline})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Smart Context Recommendation Banner */}
        {recommendation && (
          <div className="bg-amber-50/80 px-5 py-2.5 border-b border-amber-200/80 flex items-center justify-between gap-3 text-xs text-amber-950">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{recommendation.text}</span>
            </div>
            <button
              type="button"
              onClick={() => handleAddService(recommendation!.candidateService)}
              className="px-2.5 py-1 bg-[#4A0417] hover:bg-[#36020F] text-white font-semibold text-[11px] rounded-md transition-colors cursor-pointer shrink-0 flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add {recommendation.candidateService.name}</span>
            </button>
          </div>
        )}

        {/* Modal Body: 2 Columns on Desktop */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Column 1: Currently Included Treatments (Removable) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A0417] flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>Services in Your Package ({selectedServices.length})</span>
              </h3>
              <span className="text-[11px] text-[#8C7A7C] tabular-nums font-medium">
                Time Needed: {formatDuration(totalDuration)}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {selectedServices.map((service, index) => {
                const sPrice = service.selling_price || service.sellingPrice || 0;
                const sDur = service.duration_mins || service.durationMins || 0;

                return (
                  <div
                    key={service.id || index}
                    className="p-3.5 rounded-xl border border-[#E8DDD3] bg-[#FAF7F2] flex items-center justify-between gap-3 group hover:border-[#C5A880] transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <h4 className="text-xs sm:text-sm font-semibold text-[#1F1A1C] truncate">
                          {service.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#6B5A5C] pl-6">
                        <span className="tabular-nums">Time Needed: {sDur} mins</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#4A0417] tabular-nums">
                          ₹{sPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={selectedServices.length <= 1}
                      onClick={() => handleRemoveService(service.id)}
                      className="px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors disabled:opacity-30 cursor-pointer shrink-0 flex items-center gap-1"
                      title={selectedServices.length <= 1 ? 'Package must have at least 1 service' : 'Remove service'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Savings & Milestone Notice */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="flex items-center justify-between font-semibold">
                <span>Package Discount ({discountPercent}%):</span>
                <span className="tabular-nums">-₹{discountAmount}</span>
              </div>
              <p className="text-[11px] text-emerald-800 font-light">
                {count >= 5
                  ? '🎉 Maximum 20% package discount unlocked!'
                  : count >= 4
                  ? 'Add 1 more service to unlock the maximum 20% package discount.'
                  : `Add ${5 - count} more services to reach up to 20% package discount.`}
              </p>
            </div>
          </div>

          {/* Column 2: Add More Services from Catalogue */}
          <div className="lg:col-span-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#4A0417] flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>Add Services to Your Package</span>
            </h3>

            {/* Search & Category Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8C7A7C] absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search services to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF7F2] border border-[#E8DDD3] rounded-lg focus:outline-hidden focus:border-[#4A0417]"
                />
              </div>

              {/* Quick Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: 'All Services' },
                  { id: 'cat-waxing', label: 'Waxing' },
                  { id: 'cat-facials-all', label: 'Facials & Cleanups' },
                  { id: 'cat-mani-pedi', label: 'Mani-Pedi' },
                  { id: 'cat-massage-body', label: 'Massage & Scrub' },
                  { id: 'cat-threading-bleach', label: 'Threading & Bleach' }
                ].map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCategory(c.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors shrink-0 cursor-pointer ${
                      activeCategory === c.id
                        ? 'bg-[#4A0417] text-white'
                        : 'bg-[#FAF7F2] text-[#6B5A5C] hover:bg-[#F2ECE3]'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Candidate Services List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {candidateServices.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#8C7A7C] bg-[#FAF7F2] rounded-xl border border-dashed border-[#E8DDD3]">
                  No matching services available to add.
                </div>
              ) : (
                candidateServices.slice(0, 20).map(service => {
                  const sPrice = service.selling_price || service.sellingPrice || 0;
                  const sDur = service.duration_mins || service.durationMins || 0;

                  return (
                    <div
                      key={service.id}
                      className="p-3 rounded-xl border border-[#E8DDD3] bg-white hover:bg-[#FAF7F2] flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-[#1F1A1C] truncate">
                          {service.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-[#6B5A5C] mt-0.5">
                          <span className="tabular-nums">Time Needed: {sDur} mins</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-[#4A0417] tabular-nums">
                            ₹{sPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddService(service)}
                        className="px-3 py-1.5 bg-[#4A0417] hover:bg-[#36020F] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Service</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer: Recalculated Total & Action CTA */}
        <div className="bg-[#FAF7F2] p-4 sm:p-5 border-t border-[#E8DDD3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium text-[#7A6B6D]">Package Total:</span>
              <span className="text-2xl font-serif font-bold text-[#4A0417] tabular-nums">
                ₹{finalPrice.toLocaleString('en-IN')}
              </span>
              {rawSubtotal > finalPrice && (
                <span className="text-xs text-[#9C8C8E] line-through tabular-nums">
                  ₹{rawSubtotal.toLocaleString('en-IN')}
                </span>
              )}
              {discountPercent > 0 && (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Save {discountPercent}%
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#6B5A5C]">
              Includes {selectedServices.length} services • Time Needed: {formatDuration(totalDuration)} • Cash/UPI after service
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-[#554749] bg-white hover:bg-stone-100 rounded-lg border border-[#E8DDD3] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleAddBundleToCart}
              className="px-5 py-2.5 bg-[#4A0417] hover:bg-[#36020F] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#C5A880]" />
              <span>Add Package to Cart</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
