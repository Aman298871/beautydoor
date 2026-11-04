import React, { useState, useEffect } from 'react';
import { Printer, Download, Sparkles, Clock, ShieldCheck, CheckCircle2, ChevronRight, Share2, ArrowLeft } from 'lucide-react';
import { useRouter } from '../router.tsx';

export const RateCardPage: React.FC = () => {
  const { navigate } = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/storefront/rate-card')
      .then(res => res.json())
      .then(d => {
        setData(d);
      })
      .catch(err => console.error('Failed to load rate card:', err))
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'BeautyDoor — Official At-Home Salon Rate Card',
          text: 'Explore official rates for RICA, Honey, Korean, Brazilian waxing and signature beauty packages in Delhi NCR.',
          url: window.location.href
        });
      } catch {
        // User cancelled or unsupported
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-[#8C7A7C] min-h-[60vh] flex items-center justify-center">
        <div className="space-y-2">
          <div className="w-8 h-8 border-2 border-[#4A0417] border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Generating Official Rate Card from Business Catalogue...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center text-xs text-red-600">
        Failed to load official rate card. Please try again.
      </div>
    );
  }

  const { categories, groupedServices, packages, hygieneCommitments } = data;

  const categoriesToShow = activeTab === 'all' 
    ? categories 
    : categories.filter((c: any) => c.id === activeTab);

  return (
    <div className="bg-[#FAF7F2] min-h-screen py-8 sm:py-12 print:bg-white print:py-0">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 print:p-0">
        
        {/* Navigation & Controls Bar (Hidden when printing) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/services')}
              className="p-2 rounded-lg bg-white border border-[#E8DDD3] text-[#4A0417] hover:bg-[#FAF7F2] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-xs text-[#8C7A7C]">Official Business Pricing</p>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#1F1A1C]">
                BeautyDoor Master Rate Card
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="px-3.5 py-2 rounded-md bg-white border border-[#E8DDD3] text-xs font-semibold text-[#1F1A1C] hover:bg-[#FAF7F2] flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5 text-[#4A0417]" />
              <span>{copied ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-md bg-[#4A0417] hover:bg-[#36020F] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF (A4)</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs for quick digital reading (Hidden when printing) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none print:hidden text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              activeTab === 'all'
                ? 'bg-[#4A0417] text-white shadow-xs'
                : 'bg-white text-[#554749] border border-[#E8DDD3] hover:bg-[#FAF7F2]'
            }`}
          >
            Complete Catalogue
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              activeTab === 'packages'
                ? 'bg-[#4A0417] text-white shadow-xs'
                : 'bg-white text-[#554749] border border-[#E8DDD3] hover:bg-[#FAF7F2]'
            }`}
          >
            10 Official Packages
          </button>
          {categories.map((c: any) => (
            <button
              key={c.id}
              onClick={() => setActiveTab(c.id)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                activeTab === c.id
                  ? 'bg-[#4A0417] text-white shadow-xs'
                  : 'bg-white text-[#554749] border border-[#E8DDD3] hover:bg-[#FAF7F2]'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* PRINTABLE A4 RATE CARD CONTAINER */}
        <div className="bg-white rounded-2xl border border-[#E8DDD3] p-6 sm:p-10 print:p-8 print:border-none print:shadow-none shadow-sm space-y-8">
          
          {/* Header Block */}
          <div className="border-b-2 border-[#4A0417] pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl sm:text-3xl font-serif font-extrabold tracking-tight text-[#4A0417]">
                  BEAUTYDOOR
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5A880] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E8DDD3]">
                  Doorstep Salon
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#5C4D4F] font-light">
                {data.tagline}
              </p>
              <p className="text-[11px] text-[#8C7A7C] mt-0.5">
                Service Hubs: <strong>{data.serviceArea}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right text-xs text-[#5C4D4F] space-y-0.5 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
              <p className="font-semibold text-[#1F1A1C]">Operating Hours: {data.operatingHours}</p>
              <p className="text-[11px] text-[#8C7A7C]">WhatsApp Concierge: +91 98112 00000</p>
              <p className="text-[11px] text-[#8C7A7C]">Book Online: <strong>beautydoor.in</strong></p>
            </div>
          </div>

          {/* Hygiene Commitment Badge Strip */}
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DDD3]">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#4A0417] mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4A0417]" />
              Official BeautyDoor Hygiene & Safety Protocol
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px] text-[#554749]">
              {hygieneCommitments?.map((h: string, idx: number) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 10 OFFICIAL BEAUTYDOOR PACKAGES */}
          {(activeTab === 'all' || activeTab === 'packages') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E8DDD3] pb-2">
                <h3 className="text-base sm:text-lg font-serif font-bold text-[#4A0417] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C5A880]" />
                  <span>Official Signature Beauty Packages (Top Value)</span>
                </h3>
                <span className="text-xs text-[#8C7A7C]">10 Complete Curations</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {packages?.map((pkg: any) => (
                  <div
                    key={pkg.id}
                    className="p-4 rounded-xl border border-[#E8DDD3] bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] transition-colors space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-serif font-bold text-[#1F1A1C]">
                            {pkg.name}
                          </h4>
                          <p className="text-[11px] text-[#C5A880] font-medium">{pkg.subtitle}</p>
                        </div>
                        {pkg.badge && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#4A0417] bg-white px-2 py-0.5 rounded border border-[#E8DDD3] shrink-0">
                            {pkg.badge}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 space-y-1">
                        {pkg.inclusions?.map((inc: any, i: number) => (
                          <p key={i} className="text-[11px] text-[#554749] flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${inc.is_free ? 'bg-emerald-600' : 'bg-[#C5A880]'}`} />
                            <span className={inc.is_free ? 'font-semibold text-emerald-800' : ''}>
                              {inc.name}
                            </span>
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E8DDD3] flex items-center justify-between text-xs mt-2">
                      <span className="text-[11px] text-[#8C7A7C] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#4A0417]" />
                        {pkg.duration_display}
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        {pkg.original_price > pkg.selling_price && (
                          <span className="text-[11px] text-[#8C7A7C] line-through">₹{pkg.original_price}</span>
                        )}
                        <span className="text-base font-bold text-[#4A0417] tabular-nums">
                          ₹{pkg.selling_price}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* INDIVIDUAL CATEGORIES & SERVICES TABLES */}
          {activeTab !== 'packages' && categoriesToShow.map((cat: any) => {
            const catServices = groupedServices[cat.id]?.services || [];
            if (catServices.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-3">
                <div className="flex items-center justify-between border-b-2 border-[#E8DDD3] pb-1.5">
                  <h3 className="text-sm sm:text-base font-serif font-bold text-[#1F1A1C]">
                    {cat.name}
                  </h3>
                  <span className="text-xs text-[#8C7A7C]">
                    {catServices.length} Rituals
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#E8DDD3] text-[#7A6B6D] font-semibold text-[11px] uppercase tracking-wider">
                        <th className="py-2 pr-4 font-semibold">Service / Ritual</th>
                        <th className="py-2 px-3 font-semibold text-center w-24">Type</th>
                        <th className="py-2 px-3 font-semibold text-center w-24">Duration</th>
                        <th className="py-2 pl-4 font-semibold text-right w-24">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0E6DE]">
                      {catServices.map((srv: any) => {
                        const isCombo = srv.is_combo === 1 || srv.service_type === 'combo';
                        return (
                          <tr key={srv.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                            <td className="py-2.5 pr-4">
                              <p className="font-medium text-[#1F1A1C]">
                                {srv.name}
                                {srv.brand && (
                                  <span className="ml-2 text-[10px] text-[#8C7A7C] bg-[#FAF7F2] px-1.5 py-0.2 rounded border border-[#E8DDD3]">
                                    {srv.brand}
                                  </span>
                                )}
                              </p>
                              {srv.steps_count && (
                                <p className="text-[10px] text-[#8C7A7C]">{srv.steps_count}-Step Ritual</p>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {isCombo ? (
                                <span className="text-[9px] font-bold uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                  Combo
                                </span>
                              ) : (
                                <span className="text-[9px] text-[#8C7A7C] uppercase">
                                  Single
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center tabular-nums text-[#6B5A5C]">
                              {srv.duration_mins}m
                            </td>
                            <td className="py-2.5 pl-4 text-right tabular-nums font-bold text-[#4A0417] text-sm">
                              ₹{srv.selling_price}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Footer Terms & Surcharge Note */}
          <div className="pt-6 border-t border-[#E8DDD3] text-[11px] text-[#7A6B6D] space-y-1">
            <p className="font-semibold text-[#1F1A1C]">Terms & Service Details:</p>
            <p>• Operating Hours: 8:00 AM to 6:00 PM across Delhi, Gurugram, Noida, Greater Noida, Ghaziabad & Faridabad.</p>
            <p>• Early/Evening Surcharge: Slots booked at 8:00 AM or 6:00 PM carry a nominal ₹100 specialist surcharge.</p>
            <p>• Room Requirements: Cool or air-conditioned room required for optimal waxing adhesion.</p>
            <p>• Payment Options: Online Payment via UPI/Cards or Cash After Service at your doorstep.</p>
            <p className="text-[10px] text-[#8C7A7C] pt-2">
              BeautyDoor Technologies Pvt. Ltd. • Rates accurate as of {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
