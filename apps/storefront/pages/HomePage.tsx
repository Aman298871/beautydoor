import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Clock, Plus, Check, CheckCircle2, ChevronRight, Wind, HeartHandshake, Star, HelpCircle, ChevronDown, MapPin, Search, AlertCircle } from 'lucide-react';
import { useRouter } from '../router.tsx';
import { ServiceDetailModal } from '../../../src/components/ServiceDetailModal.tsx';
import { formatDuration } from '../../../src/utils/formatters.ts';
import { getServiceImageUrl } from '../../../src/utils/serviceImageMapper.ts';
import { BUSINESS_CONFIG } from '../../../src/config/businessConfig.ts';

interface Props {
  campaigns: any[];
  deals: any[];
  bestsellers: any[];
  services?: any[];
  packages?: any[];
  reviews: any[];
  googlePlaceId?: string;
  onCheckPincode?: (pincode: string) => Promise<any>;
  onSelectTerritory?: (territory: any) => void;
  onQuickAdd: (service: any) => void;
  onAddPackage?: (pkg: any) => void;
  cartItemIds: string[];
  onOpenWriteReview: () => void;
}

export const HomePage: React.FC<Props> = ({
  campaigns = [],
  deals = [],
  bestsellers = [],
  services = [],
  packages = [],
  reviews = [],
  onQuickAdd,
  onAddPackage,
  cartItemIds = [],
  onOpenWriteReview,
  onCheckPincode,
  onSelectTerritory
}) => {
  const { navigate } = useRouter();
  const [activeModalService, setActiveModalService] = useState<any | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [pincodeInput, setPincodeInput] = useState('');
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [pincodeResult, setPincodeResult] = useState<{ isServiceable?: boolean; message?: string; territory?: any } | null>(null);

  const handlePincodeSubmit = async (e?: React.FormEvent, overrideCode?: string) => {
    if (e) e.preventDefault();
    const code = (overrideCode || pincodeInput).trim();
    if (!code || code.length < 6) {
      setPincodeResult({ isServiceable: false, message: 'Please enter a valid 6-digit Delhi NCR pincode.' });
      return;
    }
    setCheckingPincode(true);
    try {
      if (onCheckPincode) {
        const res = await onCheckPincode(code);
        setPincodeResult(res);
        if (res?.isServiceable && res?.territory && onSelectTerritory) {
          onSelectTerritory(res.territory);
        }
      } else {
        setPincodeResult({ isServiceable: true, message: `Area (${code}) is fully serviced! Regular booking windows open daily.` });
      }
    } catch {
      setPincodeResult({ isServiceable: false, message: 'Could not check area right now. Delhi, Gurugram, and Noida are serviced.' });
    } finally {
      setCheckingPincode(false);
    }
  };

  // Service photo resolver
  const getPhoto = (srv: any) => {
    return getServiceImageUrl(srv);
  };

  // Curated category grid
  const keyCategories = [
    { id: 'cat-facials', name: 'Facials & Radiance', desc: 'O3+, Lotus & VLCC single-use glowing rituals', img: '/images/service_facial_treatment.jpg' },
    { id: 'cat-rica-waxing', name: 'Italian RICA Waxing', desc: 'Gentle lipo-soluble wax for smooth, low-irritation hair removal', img: '/images/service_waxing_arms_legs.jpg' },
    { id: 'cat-massage', name: 'Massage Therapies', desc: 'Full body Swedish, head, back, and foot stress relief', img: '/images/service_body_massage.jpg' },
    { id: 'cat-manicure-pedicure', name: 'Manicure & Pedicure', desc: 'Effervescent rose petal foot soaks and sterile tool grooming', img: '/images/service_manicure_pedicure.jpg' },
    { id: 'cat-body-scrub', name: 'Body Polishing & Scrub', desc: '5-step botanical exfoliation and mineral kaolin body wrap', img: '/images/service_body_polishing.jpg' },
    { id: 'cat-packages', name: 'Signature Packages', desc: 'Head-to-toe salon ceremonies at fixed bundled savings', img: '/images/hero_beauty_ritual.jpg' }
  ];

  // Frequently Asked Questions
  const faqs = [
    {
      q: 'How does BeautyDoor at-home service work?',
      a: 'Choose your desired beauty treatments or packages online. Select your preferred date, convenient 2-hour arrival window, and Delhi NCR address. A verified, certified female beauty specialist arrives at your doorstep with sterilized tools and single-use disposables. You pay after your service via UPI, Card, or Cash.'
    },
    {
      q: 'Do I need an air-conditioned (AC) room for waxing?',
      a: 'Yes, an air-conditioned room (recommended temperature 22°C–24°C) is strongly advised for waxing services. Moderate room temperature prevents skin perspiration, allows warm wax to adhere and set properly, and ensures clean, comfortable hair removal.'
    },
    {
      q: 'How should I prepare before a waxing appointment?',
      a: 'Keep the waxing area clean and dry. Avoid applying body oils, creams, or heavy lotions before your specialist arrives. We recommend natural hair growth of approximately 1/4 inch (about 2–3 weeks of growth) for clean root extraction.'
    },
    {
      q: 'Are your beauty specialists verified and safe?',
      a: 'Yes, 100%. All BeautyDoor specialists are background-verified, certified female professionals who undergo rigorous hygiene, skill, and premium customer care training. They arrive in uniform with sealed kits.'
    },
    {
      q: 'What is your hygiene commitment?',
      a: 'We strictly observe a zero double-dipping policy using fresh disposable wooden spatulas for each wax application. Every client receives a fresh disposable protective bedsheet, sanitized metal instruments, and single-use sealed skincare packs unsealed in front of you.'
    },
    {
      q: 'What are the operating hours and appointment slots?',
      a: 'Our verified business operating hours are 08:00 AM to 06:00 PM daily across Delhi NCR. Standard appointment slots throughout the day carry ₹0 surcharge; early morning 08:00 AM and evening 06:00 PM slots carry a transparent ₹100 slot surcharge.'
    }
  ];

  return (
    <div className="space-y-0 text-[#1F1A1C]">
      
      {/* 1. HERO SECTION: "Your Beauty Ritual, Delivered Home." */}
      <section className="relative bg-[#FAF7F2] border-b border-[#E8DDD3] overflow-hidden py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Hero Copy (7 cols) */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#4A0417]">
                <Sparkles className="w-4 h-4 text-[#C5A880]" />
                <span>Luxury At-Home Beauty Services · Delhi NCR</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#1F1A1C] tracking-tight leading-[1.15]">
                Your Beauty Ritual, <br />
                <span className="italic font-medium text-[#4A0417]">Delivered Home.</span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-[#554749] font-light leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Certified female beauty specialists, sterile single-use kits, and salon-grade rituals delivered across Delhi, Gurugram, and Noida. Transparent pricing, zero hidden fees, and pay only after your service.
              </p>

              {/* CTAs & Trust Badges */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <button
                  onClick={() => navigate('/services')}
                  className="w-full sm:w-auto px-8 py-4 bg-[#4A0417] hover:bg-[#36020F] text-white text-base font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
                >
                  <span>Explore Services</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/packages')}
                  className="w-full sm:w-auto px-8 py-4 bg-white text-[#4A0417] hover:bg-[#F4EFEA] border border-[#C5A880] text-base font-semibold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-[#C5A880]" />
                  <span>Book a Package</span>
                </button>
              </div>

              {/* Service Commitments Strip */}
              <div className="pt-6 border-t border-[#E8DDD3]/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm text-[#4A3E3D]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#4A0417] shrink-0" />
                  <span>Verified Female Pros</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#4A0417] shrink-0" />
                  <span>100% Sterile Kits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-[#4A0417] shrink-0" />
                  <span>AC Room Comfort</span>
                </div>
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-[#4A0417] shrink-0" />
                  <span>Pay After Service</span>
                </div>
              </div>
            </div>

            {/* Hero Image Card (5 cols) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-white/80 bg-white group">
                <img
                  src="/images/hero_beauty_ritual.jpg"
                  alt="BeautyDoor Certified Specialist Preparing Treatment at Home"
                  referrerPolicy="no-referrer"
                  className="w-full h-80 sm:h-96 lg:h-[480px] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                  <div className="bg-white/95 backdrop-blur-xs p-4 rounded-xl text-[#1F1A1C] shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-bold text-[#4A0417] tracking-wider">BeautyDoor Delhi NCR</span>
                      <span className="text-xs text-[#7A6B6D] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#4A0417]" />
                        <span>08:00 AM – 06:00 PM</span>
                      </span>
                    </div>
                    <p className="text-sm font-serif font-bold mt-1 text-[#1F1A1C]">
                      Salon Luxury in Your Personal Sanctuary
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 1.5 CHECK IF WE SERVE YOUR AREA */}
      <section className="bg-white border-b border-[#E8DDD3] py-8 sm:py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#FAF7F2] border border-[#E8DDD3] rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Doorstep Service Coverage</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1F1A1C]">
                  Check if We Serve Your Area
                </h2>
                <p className="text-xs sm:text-sm text-[#554749] mt-0.5 font-light">
                  Serving homes across South Delhi, Gurugram, Noida, and surrounding Delhi NCR hubs.
                </p>
              </div>
            </div>

            <form onSubmit={handlePincodeSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <MapPin className="w-4 h-4 text-[#8C7A7C] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  value={pincodeInput}
                  onChange={(e) => {
                    setPincodeInput(e.target.value.replace(/\D/g, ''));
                    setPincodeResult(null);
                  }}
                  placeholder="Enter your 6-digit PIN code (e.g. 110017)"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#E8DDD3] focus:border-[#4A0417] focus:ring-1 focus:ring-[#4A0417] rounded-lg text-sm text-[#1F1A1C] placeholder-[#8C7A7C] outline-hidden font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={checkingPincode}
                className="px-6 py-3 bg-[#4A0417] hover:bg-[#36020F] text-white text-sm font-semibold rounded-lg shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {checkingPincode ? (
                  <span>Checking...</span>
                ) : (
                  <>
                    <Search className="w-4 h-4 text-[#C5A880]" />
                    <span>Check Area</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Select Popular Areas */}
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#7A6B6D]">
              <span className="font-medium text-[#4A0417]">Popular Areas:</span>
              {[
                { name: 'South Delhi', pin: '110017' },
                { name: 'Gurugram DLF', pin: '122002' },
                { name: 'Noida Sec 62', pin: '201301' },
                { name: 'West Delhi', pin: '110027' },
                { name: 'East Delhi', pin: '110092' }
              ].map((area) => (
                <button
                  key={area.pin}
                  type="button"
                  onClick={() => {
                    setPincodeInput(area.pin);
                    handlePincodeSubmit(undefined, area.pin);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-[#F4EFEA] border border-[#E8DDD3] rounded-md text-[#4A3E3D] hover:text-[#4A0417] transition-colors"
                >
                  {area.name} ({area.pin})
                </button>
              ))}
            </div>

            {/* Pincode Result Banner */}
            {pincodeResult && (
              <div
                className={`mt-4 p-4 rounded-xl flex items-start gap-3 text-xs sm:text-sm ${
                  pincodeResult.isServiceable
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-amber-50 border border-amber-200 text-amber-900'
                }`}
              >
                {pincodeResult.isServiceable ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">
                    {pincodeResult.isServiceable ? 'Yes! We serve your location.' : 'Area Check Notice'}
                  </div>
                  <div className="mt-0.5 text-xs text-opacity-90">
                    {pincodeResult.message || (pincodeResult.isServiceable ? 'Verified beauticians are ready to visit your home.' : 'Please check the entered pincode or contact us directly.')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. POPULAR BEAUTY SERVICES */}
      {bestsellers && bestsellers.length > 0 && (
        <section className="py-14 sm:py-20 bg-white border-b border-[#E8DDD3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Most Requested</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C] tracking-tight">
                  Popular Beauty Services
                </h2>
                <p className="text-sm sm:text-base text-[#554749] mt-1 font-light">
                  Loved by clients across South Delhi, Gurugram, and Noida.
                </p>
              </div>

              <button
                onClick={() => navigate('/services')}
                className="text-sm font-semibold text-[#4A0417] hover:underline flex items-center gap-1 self-start sm:self-auto group"
              >
                <span>Browse Full Menu</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bestsellers.slice(0, 6).map((srv) => {
                const inCart = cartItemIds.includes(srv.id);
                const price = srv.selling_price || srv.sellingPrice;
                const originalPrice = srv.original_price || srv.originalPrice;
                const duration = srv.duration_mins || srv.durationMins;
                const photo = getPhoto(srv);

                return (
                  <article
                    key={srv.id}
                    className="bg-[#FAF7F2] rounded-2xl border border-[#E8DDD3] hover:border-[#C5A880] transition-all hover:shadow-lg overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      <div 
                        onClick={() => setActiveModalService(srv)}
                        className="relative aspect-16/10 w-full overflow-hidden bg-[#F0EAE1] cursor-pointer"
                      >
                        <img
                          src={photo}
                          alt={srv.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-semibold text-[#1F1A1C] shadow-sm flex items-center gap-1 tabular-nums">
                          <Clock className="w-3 h-3 text-[#4A0417]" />
                          <span>{formatDuration(duration)}</span>
                        </div>
                      </div>

                      <div className="p-5 sm:p-6 space-y-2">
                        <h3
                          onClick={() => setActiveModalService(srv)}
                          className="text-lg sm:text-xl font-serif font-bold text-[#1F1A1C] hover:text-[#4A0417] cursor-pointer transition-colors leading-snug"
                        >
                          {srv.name}
                        </h3>
                        <p className="text-sm text-[#554749] line-clamp-2 leading-relaxed font-light">
                          {srv.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 pt-0 border-t border-[#E8DDD3]/60 mt-2 flex items-center justify-between gap-3">
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
                          className="text-xs font-semibold text-[#8C7A7C] hover:text-[#4A0417] underline transition-colors"
                        >
                          View details
                        </button>
                      </div>

                      <button
                        onClick={() => onQuickAdd(srv)}
                        className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
                          inCart
                            ? 'bg-emerald-700 text-white'
                            : 'bg-[#4A0417] hover:bg-[#36020F] text-white hover:shadow-md'
                        }`}
                      >
                        {inCart ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>In Cart</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 text-[#C5A880]" />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 3. SERVICE CATEGORIES SHOWCASE */}
      <section className="py-14 sm:py-20 bg-[#FAF7F2] border-b border-[#E8DDD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-1">
              Beauty Categories
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C] tracking-tight">
              Explore By Category
            </h2>
            <p className="text-base text-[#554749] mt-2 font-light">
              From gentle Italian RICA waxing to soothing Swedish full-body massages and bridal packages.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {keyCategories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => navigate(cat.id === 'cat-packages' ? '/packages' : `/services?category=${cat.id}`)}
                className="bg-white rounded-2xl border border-[#E8DDD3] hover:border-[#C5A880] p-6 shadow-xs hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-16/10 rounded-xl overflow-hidden mb-4 bg-[#F0EAE1]">
                    <img
                      src={cat.img}
                      alt={cat.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="text-xl font-serif font-bold text-[#1F1A1C] group-hover:text-[#4A0417] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-[#554749] mt-1.5 leading-relaxed font-light">
                    {cat.desc}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-[#F0EAE1] flex items-center justify-between text-xs font-semibold text-[#4A0417]">
                  <span>Explore Services</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURED SIGNATURE PACKAGES */}
      {packages && packages.length > 0 && (
        <section className="py-14 sm:py-20 bg-white border-b border-[#E8DDD3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#4A0417] mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>Ready-Made Packages</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C] tracking-tight">
                  Ready-Made Beauty Packages
                </h2>
                <p className="text-base text-[#554749] mt-1 font-light">
                  Choose a ready-made package or make your own by adding the services you want.
                </p>
              </div>

              <button
                onClick={() => navigate('/packages')}
                className="text-sm font-semibold text-[#4A0417] hover:underline flex items-center gap-1 self-start sm:self-auto group"
              >
                <span>View All 10 Packages</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.slice(0, 3).map((pkg) => {
                const inCart = cartItemIds.includes(pkg.id);
                return (
                  <div
                    key={pkg.id}
                    className="bg-[#FAF7F2] rounded-2xl border border-[#E8DDD3] p-6 hover:border-[#C5A880] transition-all hover:shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-[#7A6B6D] mb-3">
                        <span className="flex items-center gap-1 font-medium tabular-nums">
                          <Clock className="w-3.5 h-3.5 text-[#4A0417]" />
                          {formatDuration(pkg.duration_mins)}
                        </span>
                        {pkg.badge && (
                          <span className="text-[10px] uppercase font-bold text-[#4A0417] bg-white px-2 py-0.5 rounded border border-[#E8DDD3]">
                            {pkg.badge}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-serif font-bold text-[#1F1A1C] leading-snug">
                        {pkg.name}
                      </h3>
                      <p className="text-xs text-[#4A0417] font-medium mt-1">
                        {pkg.subtitle}
                      </p>

                      <p className="text-sm text-[#554749] mt-3 line-clamp-3 leading-relaxed font-light">
                        {pkg.description}
                      </p>

                      {/* Inclusions list */}
                      {pkg.inclusions && pkg.inclusions.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-[#E8DDD3]/80 space-y-1.5">
                          <span className="text-[11px] uppercase tracking-wider text-[#8C7A7C] font-semibold">Includes:</span>
                          <ul className="space-y-1 text-xs text-[#4A3E3D]">
                            {pkg.inclusions.slice(0, 3).map((inc: any, idx: number) => (
                              <li key={idx} className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-[#4A0417] shrink-0" />
                                <span className="truncate">{inc.name || inc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#E8DDD3] flex items-center justify-between gap-2">
                      <div>
                        <div className="text-2xl font-serif font-bold text-[#4A0417] tabular-nums">
                          ₹{pkg.selling_price.toLocaleString('en-IN')}
                        </div>
                        {pkg.original_price > pkg.selling_price && (
                          <span className="text-xs text-[#8C7A7C] line-through tabular-nums">
                            ₹{pkg.original_price.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => onAddPackage && onAddPackage(pkg)}
                        className={`px-4 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
                          inCart
                            ? 'bg-emerald-700 text-white'
                            : 'bg-[#4A0417] hover:bg-[#36020F] text-white hover:shadow-md'
                        }`}
                      >
                        {inCart ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>In Cart</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 5. WHY CHOOSE BEAUTYDOOR */}
      <section className="py-16 sm:py-24 bg-[#FAF7F2] border-b border-[#E8DDD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4A0417]">
              The BeautyDoor Difference
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#1F1A1C] mt-1 tracking-tight">
              Hospital-Grade Hygiene in Your Sanctuary
            </h2>
            <p className="text-base sm:text-lg text-[#554749] mt-3 font-light leading-relaxed">
              We never compromise on safety, comfort, or genuine product authenticity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#C5A880]/40 flex items-center justify-center text-[#4A0417]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#1F1A1C]">Verified Female Beauticians</h3>
              <p className="text-sm text-[#554749] leading-relaxed font-light">
                Background-verified and certified female beauticians who respect your home sanctity and personal comfort.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#C5A880]/40 flex items-center justify-center text-[#4A0417]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#1F1A1C]">100% Sterile Single-Use Kits</h3>
              <p className="text-sm text-[#554749] leading-relaxed font-light">
                Fresh disposable wooden spatulas (strict zero double-dipping) and sterilized surgical metal tools.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#C5A880]/40 flex items-center justify-center text-[#4A0417]">
                <Wind className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#1F1A1C]">Air-Conditioned Comfort</h3>
              <p className="text-sm text-[#554749] leading-relaxed font-light">
                Services designed for AC rooms (22°C–24°C) to ensure clean wax setting and relaxing skincare absorption.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#C5A880]/40 flex items-center justify-center text-[#4A0417]">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#1F1A1C]">Pay After Service</h3>
              <p className="text-sm text-[#554749] leading-relaxed font-light">
                No advance commitment required. Review your treatments and pay only after complete satisfaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS (3 Simple Steps) */}
      <section className="py-16 sm:py-24 bg-white border-b border-[#E8DDD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4A0417]">
              Simple & Seamless
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C] mt-1 tracking-tight">
              How BeautyDoor Works
            </h2>
            <p className="text-base text-[#554749] mt-2 font-light">
              Book in 60 seconds with no complex service zone requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="bg-[#FAF7F2] p-8 rounded-2xl border border-[#E8DDD3] space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#4A0417] text-[#FAF7F2] font-serif font-bold text-xl flex items-center justify-center mx-auto shadow-md">
                1
              </div>
              <h3 className="text-xl font-serif font-bold text-[#1F1A1C]">Select Your Services</h3>
              <p className="text-sm text-[#554749] leading-relaxed font-light">
                Browse our transparent menu of waxing, facials, massages, and packages. Add services to your cart.
              </p>
            </div>

            <div className="bg-[#FAF7F2] p-8 rounded-2xl border border-[#E8DDD3] space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#4A0417] text-[#FAF7F2] font-serif font-bold text-xl flex items-center justify-center mx-auto shadow-md">
                2
              </div>
              <h3 className="text-xl font-serif font-bold text-[#1F1A1C]">Choose Date & Time</h3>
              <p className="text-sm text-[#554749] leading-relaxed font-light">
                Pick a convenient 2-hour arrival window between 08:00 AM and 06:00 PM and enter your Delhi NCR service address.
              </p>
            </div>

            <div className="bg-[#FAF7F2] p-8 rounded-2xl border border-[#E8DDD3] space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#4A0417] text-[#FAF7F2] font-serif font-bold text-xl flex items-center justify-center mx-auto shadow-md">
                3
              </div>
              <h3 className="text-xl font-serif font-bold text-[#1F1A1C]">Beautician Arrives & Service Begins</h3>
              <p className="text-sm text-[#554749] leading-relaxed font-light">
                Your certified female beautician brings all sealed kits and disposables. Relax completely and pay after completion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. GENUINE CUSTOMER REVIEWS */}
      {reviews && reviews.length > 0 && (
        <section id="reviews" className="py-16 sm:py-24 bg-[#FAF7F2] border-b border-[#E8DDD3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#4A0417]">
                  Client Experiences
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C] mt-1 tracking-tight">
                  What Our Clients Say
                </h2>
                <p className="text-base text-[#554749] mt-1 font-light">
                  Verified appointments across Delhi, Gurugram, and Noida.
                </p>
              </div>

              <button
                onClick={onOpenWriteReview}
                className="px-5 py-2.5 bg-white text-[#4A0417] hover:bg-[#F4EFEA] border border-[#C5A880] text-xs sm:text-sm font-semibold rounded-lg shadow-2xs transition-all self-start sm:self-auto"
              >
                Write a Review
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.slice(0, 3).map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white p-6 sm:p-7 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-1 text-[#C5A880]">
                      {[...Array(rev.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm sm:text-base text-[#4A3E3D] italic font-light leading-relaxed">
                      "{rev.comment}"
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#F0EAE1]">
                    <div className="font-semibold text-sm text-[#1F1A1C]">{rev.customer_name}</div>
                    <div className="text-xs text-[#8C7A7C]">{rev.customer_location}</div>
                    {rev.service_tag && (
                      <div className="mt-1.5 text-[11px] font-medium text-[#4A0417] bg-[#FAF7F2] px-2 py-0.5 rounded inline-block">
                        {rev.service_tag}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. FREQUENTLY ASKED QUESTIONS */}
      <section className="py-16 sm:py-24 bg-white border-b border-[#E8DDD3]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4A0417]">
              Common Inquiries
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C] mt-1 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-[#554749] mt-2 font-light">
              Clear answers about booking, preparation, and our hygiene commitments.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="border border-[#E8DDD3] rounded-xl overflow-hidden bg-[#FAF7F2] transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-[#1F1A1C] hover:text-[#4A0417] transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-[#4A0417] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-0 text-sm sm:text-base text-[#554749] leading-relaxed font-light border-t border-[#E8DDD3]/40 mt-1">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-[#7A6B6D]">
              Have a special requirement or bridal inquiry?{' '}
              <a href={BUSINESS_CONFIG.phoneTel} className="text-[#4A0417] font-semibold underline">
                Call {BUSINESS_CONFIG.contactPerson} at {BUSINESS_CONFIG.phone}
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Service Detail Modal */}
      {activeModalService && (
        <ServiceDetailModal
          service={{
            id: activeModalService.id,
            categoryId: activeModalService.category_id || activeModalService.categoryId,
            name: activeModalService.name,
            description: activeModalService.description,
            detailedDescription: activeModalService.detailed_description || activeModalService.description,
            benefits: activeModalService.benefits || (activeModalService.benefits_json ? JSON.parse(activeModalService.benefits_json) : []),
            durationMins: activeModalService.duration_mins || activeModalService.durationMins,
            originalPrice: activeModalService.original_price || activeModalService.originalPrice,
            sellingPrice: activeModalService.selling_price || activeModalService.sellingPrice,
            discountPercent: activeModalService.discount_percent || activeModalService.discountPercent,
            whatsIncluded: activeModalService.whatsIncluded || (activeModalService.whats_included_json ? JSON.parse(activeModalService.whats_included_json) : []),
            imageUrl: getPhoto(activeModalService),
            variants: activeModalService.variants || [],
            addons: activeModalService.addons || [],
            treatmentSteps: activeModalService.treatmentSteps || (activeModalService.steps_json ? JSON.parse(activeModalService.steps_json) : []),
            stepsCount: activeModalService.stepsCount || activeModalService.steps_count || 0,
            brand: activeModalService.brand || '',
            isActive: true
          }}
          onClose={() => setActiveModalService(null)}
          onAddToCart={(s) => onQuickAdd(s)}
        />
      )}

    </div>
  );
};
