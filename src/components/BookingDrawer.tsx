import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BUSINESS_CONFIG } from '../config/businessConfig.ts';
import {
  X,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  Tag,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Phone,
  User,
  Home,
  Check,
  AlertCircle
} from 'lucide-react';
import { CartItem, Booking, Territory, Coupon } from '../types.ts';
import { formatDuration } from '../utils/formatters.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveCartItem: (cartItemId: string) => void;
  onClearCart: () => void;
  territories: Territory[];
  onBookingSuccess: (booking: Booking) => void;
}

export const BookingDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  cartItems,
  onRemoveCartItem,
  onClearCart,
  territories,
  onBookingSuccess
}) => {
  // Booking steps: 1: Cart Review, 2: Address & Pincode, 3: Date & Slot, 4: Customer Details & Coupon, 5: Confirmation
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Address state
  const [pincode, setPincode] = useState('');
  const [flat, setFlat] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Delhi');
  const [area, setArea] = useState('');
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [matchedTerritory, setMatchedTerritory] = useState<Territory | null>(null);

  // Appointment schedule
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<string>('11:00 AM');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; description: string } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Payment & Submission state
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Lock background scroll on mobile and desktop while booking drawer is open
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

  // Reset step if reopening with items
  useEffect(() => {
    if (isOpen && step === 5 && !createdBooking) {
      setStep(1);
    }
  }, [isOpen]);

  // Fetch available slots on date change
  useEffect(() => {
    if (isOpen && selectedDate) {
      setSlotsLoading(true);
      fetch(`/api/slots?date=${selectedDate}&pincode=${pincode}`)
        .then(res => res.json())
        .then(data => {
          if (data.availableSlots) {
            setAvailableSlots(data.availableSlots);
            if (!data.availableSlots.includes(selectedSlot) && data.availableSlots.length > 0) {
              setSelectedSlot(data.availableSlots[0]);
            }
          }
        })
        .catch(err => console.error('Failed to load slots:', err))
        .finally(() => setSlotsLoading(false));
    }
  }, [isOpen, selectedDate, pincode]);

  // Real-time price breakdown
  const subtotal = cartItems.reduce((sum, item) => sum + item.totalItemPrice, 0);
  const totalDuration = cartItems.reduce((sum, item) => sum + item.totalDurationMins, 0);

  // Bundle discount
  let bundlePercent = 0;
  if (cartItems.length >= 4) bundlePercent = 15;
  else if (cartItems.length === 3) bundlePercent = 10;
  else if (cartItems.length === 2) bundlePercent = 5;

  const packageDiscount = Math.round((subtotal * bundlePercent) / 100);
  const amountAfterBundle = subtotal - packageDiscount;

  // Slot surcharge: ₹100 for 08:00 AM or 06:00 PM
  const slotCharge = (selectedSlot === '08:00 AM' || selectedSlot === '06:00 PM') ? 100 : 0;

  // Coupon discount
  const couponDiscount = appliedCoupon ? appliedCoupon.discount : 0;
  const deliveryFee = matchedTerritory ? matchedTerritory.deliveryFee : 0;
  const finalTotal = Math.max(0, amountAfterBundle - couponDiscount + deliveryFee + slotCharge);

  // Regional minimum order policy: Delhi ₹1,000 | Haryana ₹1,500 | Noida ₹1,500
  const getCityMinOrder = (selectedCity: string): number => {
    const c = (selectedCity || '').toLowerCase();
    if (c.includes('haryana') || c.includes('gurugram') || c.includes('gurgaon') || c.includes('faridabad') || c.includes('sonipat')) return 1500;
    if (c.includes('noida') || c.includes('greater noida') || c.includes('ghaziabad')) return 1500;
    if (c.includes('delhi')) return 1000;
    return 1000;
  };

  const activeMinOrder = matchedTerritory?.minOrderAmount || getCityMinOrder(city);
  const isBelowMin = subtotal > 0 && subtotal < activeMinOrder;
  const minDeficit = Math.max(0, activeMinOrder - subtotal);

  // Optional pincode lookup for auto-filling area
  const handlePincodeChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 6);
    setPincode(clean);
    setPincodeError(null);

    if (clean.length === 6) {
      const ter = territories.find(t => t.pincode === clean && t.isActive);
      if (ter) {
        setMatchedTerritory(ter);
        setCity(ter.city);
        if (!area) setArea(ter.areaName);
      }
    }
  };

  // Coupon validation
  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await fetch('/api/calculate-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map(i => ({
            serviceId: i.service.id,
            isPackage: i.isPackage,
            packageId: i.isPackage ? i.service.id : undefined,
            variantId: i.selectedVariant?.id,
            addonIds: i.selectedAddons.map(a => a.id)
          })),
          couponCode: couponCode.trim(),
          pincode,
          appointmentSlot: selectedSlot
        })
      });
      const data = await res.json();
      if (data.appliedCoupon) {
        setAppliedCoupon({
          code: data.appliedCoupon.code,
          discount: data.couponDiscount,
          description: data.appliedCoupon.description
        });
        setCouponError(null);
      } else {
        setAppliedCoupon(null);
        setCouponError('Coupon code is invalid or minimum booking value was not met.');
      }
    } catch {
      setCouponError('Could not validate coupon.');
    } finally {
      setCouponLoading(false);
    }
  };

  // Final submit
  const handleConfirmBooking = async () => {
    if (!customerName || !customerPhone) {
      setSubmitError('Please enter your name and contact phone number.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const bookingPayload = {
      customerName,
      customerPhone,
      customerEmail,
      address: {
        flat,
        landmark,
        area: area || matchedTerritory?.areaName,
        city: city || matchedTerritory?.city || 'Delhi',
        pincode
      },
      items: cartItems.map(i => ({
        serviceId: i.service.id,
        isPackage: i.isPackage,
        packageId: i.isPackage ? i.service.id : undefined,
        variantId: i.selectedVariant?.id,
        addonIds: i.selectedAddons.map(a => a.id),
        customizedServices: (i as any).customizedServices,
        customPackageName: (i as any).customPackageName
      })),
      appointmentDate: selectedDate,
      appointmentSlot: selectedSlot,
      paymentMethod: paymentMethod === 'razorpay' ? 'RAZORPAY' : 'COD',
      couponCode: appliedCoupon?.code,
      notes: specialNotes
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to place booking');
      }

      // If Razorpay online payment was selected, create order securely
      if (paymentMethod === 'razorpay' && (data.booking?.id || data.bookingId)) {
        const bId = data.booking?.id || data.bookingId;
        const amountToPay = data.totalPayable || finalTotal;
        try {
          const orderRes = await fetch('/api/storefront/payment/razorpay/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: amountToPay, bookingId: bId })
          });
          const orderData = await orderRes.json();
          // If live Razorpay checkout is configured on window, launch payment handler;
          // Otherwise keep payment status as 'pending' to be safely collected via UPI/Cash after service
          if ((window as any).Razorpay && orderData.keyId && orderData.orderId && !orderData.keyId.includes('placeholder')) {
            // Live Razorpay options
            const rzp = new (window as any).Razorpay({
              key: orderData.keyId,
              amount: orderData.amount,
              currency: orderData.currency || 'INR',
              order_id: orderData.orderId,
              name: 'BeautyDoor Doorstep Services',
              description: `Appointment ${bId}`,
              handler: async (resp: any) => {
                await fetch('/api/storefront/payment/razorpay/verify', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    razorpayOrderId: resp.razorpay_order_id,
                    razorpayPaymentId: resp.razorpay_payment_id,
                    razorpaySignature: resp.razorpay_signature,
                    bookingId: bId
                  })
                });
              }
            });
            rzp.open();
          }
        } catch (payErr) {
          console.warn('Online payment initialization notice:', payErr);
        }
      }

      const confirmedBooking = data.booking || {
        id: data.bookingId,
        customerName,
        customerPhone,
        appointmentDate: selectedDate,
        appointmentSlot: selectedSlot,
        totalPayable: data.totalPayable || finalTotal,
        paymentMethod: paymentMethod === 'razorpay' ? 'ONLINE' : 'COD',
        paymentStatus: 'pending',
        items: cartItems.map(i => ({ serviceName: i.service.name, finalItemPrice: i.totalItemPrice }))
      };

      setCreatedBooking(confirmedBooking);
      setStep(5);
      onBookingSuccess(confirmedBooking);
      onClearCart();
    } catch (err: any) {
      setSubmitError(err.message || 'Error creating booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop with Motion Fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Drawer Container with Motion Spring Slide */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            className="relative w-full max-w-lg bg-white h-full h-[100dvh] max-h-[100dvh] shadow-2xl flex flex-col justify-between overflow-hidden z-10"
          >
            {/* Drawer Header */}
            <div className="bg-[#FAF7F2] p-4 sm:p-5 border-b border-[#E8DDD3] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                {step > 1 && step < 5 && (
                  <button
                    type="button"
                    onClick={() => setStep((prev) => Math.max(1, prev - 1) as any)}
                    className="p-1.5 -ml-1 text-[#4A0417] hover:bg-[#EAE2D8] rounded-full transition-colors flex items-center gap-1 font-semibold text-xs cursor-pointer"
                    aria-label="Back to previous step"
                    title="Back to previous step"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back</span>
                  </button>
                )}
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A0417]">
                    <span>BeautyDoor Customer Support</span>
                    <span aria-hidden="true">·</span>
                    <span>{city}</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-[#1F1A1C] mt-0.5">
                    {step === 5
                      ? 'Booking Confirmed'
                      : step === 1
                      ? 'Your Cart'
                      : step === 2
                      ? 'Doorstep Address'
                      : step === 3
                      ? 'Choose Schedule'
                      : 'Review & Payment'}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-[#6B5A5C] hover:text-[#1F1A1C] hover:bg-[#EAE2D8] rounded-full transition-colors cursor-pointer"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Indicator (Steps 1 to 4) - Clickable Breadcrumbs */}
            {step < 5 && (
              <div className="bg-white px-4 sm:px-5 py-2.5 border-b border-[#F0E6DE] flex items-center justify-between text-xs font-semibold text-[#8C7A7C] shrink-0">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`hover:text-[#4A0417] transition-colors cursor-pointer ${step === 1 ? 'text-[#4A0417] font-bold underline decoration-[#C5A880]' : ''}`}
                >
                  1. Services
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-[#D8CCC0]" />
                <button
                  type="button"
                  onClick={() => { if (cartItems.length > 0) setStep(2); }}
                  disabled={cartItems.length === 0}
                  className={`hover:text-[#4A0417] transition-colors cursor-pointer ${step === 2 ? 'text-[#4A0417] font-bold underline decoration-[#C5A880]' : ''} disabled:opacity-40`}
                >
                  2. Address
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-[#D8CCC0]" />
                <button
                  type="button"
                  onClick={() => { if (cartItems.length > 0 && flat.trim()) setStep(3); }}
                  disabled={cartItems.length === 0 || !flat.trim()}
                  className={`hover:text-[#4A0417] transition-colors cursor-pointer ${step === 3 ? 'text-[#4A0417] font-bold underline decoration-[#C5A880]' : ''} disabled:opacity-40`}
                >
                  3. Slot
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-[#D8CCC0]" />
                <button
                  type="button"
                  onClick={() => { if (cartItems.length > 0 && flat.trim() && selectedSlot) setStep(4); }}
                  disabled={cartItems.length === 0 || !flat.trim() || !selectedSlot}
                  className={`hover:text-[#4A0417] transition-colors cursor-pointer ${step === 4 ? 'text-[#4A0417] font-bold underline decoration-[#C5A880]' : ''} disabled:opacity-40`}
                >
                  4. Review
                </button>
              </div>
            )}

            {/* Drawer Content Area with safe-area padding so sticky footer never obscures fields */}
            <div className="p-5 sm:p-6 pb-36 sm:pb-40 overflow-y-auto flex-1 space-y-6">
              <AnimatePresence mode="wait">
                {/* STEP 1: CART REVIEW */}
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {cartItems.length === 0 ? (
                      <div className="text-center py-12 space-y-3">
                        <div className="w-12 h-12 rounded-full bg-[#FAF7F2] text-[#4A0417] flex items-center justify-center mx-auto">
                          <Sparkles className="w-6 h-6 text-[#C5A880]" />
                        </div>
                        <h4 className="text-base font-semibold text-[#1F1A1C]">Your cart is empty</h4>
                        <p className="text-xs text-[#7A6B6D] max-w-xs mx-auto">
                          Explore our salon and spa treatments or build a custom package to book at home.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-xs text-[#7A6B6D]">
                          <span>Selected Services ({cartItems.length}):</span>
                          <span className="tabular-nums font-medium">Est. {formatDuration(totalDuration)}</span>
                        </div>

                        <div className="space-y-3">
                          {cartItems.map((item) => (
                            <div
                              key={item.cartItemId}
                              className="p-3.5 rounded-xl border border-[#E8DDD3] bg-[#FAF7F2] flex items-start justify-between gap-3"
                            >
                              <div className="space-y-1">
                                <h4 className="text-sm font-semibold text-[#1F1A1C] leading-snug">
                                  {item.service.name}
                                </h4>
                                {item.selectedVariant && (
                                  <p className="text-xs text-[#6B5A5C]">
                                    Variant: <span className="font-medium text-[#1F1A1C]">{item.selectedVariant.name}</span>
                                  </p>
                                )}
                                {item.selectedAddons.length > 0 && (
                                  <p className="text-xs text-[#6B5A5C]">
                                    Add-ons: {item.selectedAddons.map(a => a.name).join(', ')}
                                  </p>
                                )}
                                {((item as any).customizedServices?.length > 0) && (
                                  <div className="mt-1.5 space-y-1">
                                    <p className="text-[11px] font-semibold text-[#4A0417]">
                                      Customized Inclusions ({(item as any).customizedServices.length}):
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {(item as any).customizedServices.map((cs: any, idx: number) => (
                                        <span key={idx} className="text-[10px] bg-white text-[#1F1A1C] border border-[#E8DDD3] px-2 py-0.5 rounded-sm">
                                          ✓ {typeof cs === 'string' ? cs : cs.name}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <p className="text-xs text-[#8C7A7C] tabular-nums">
                                  {formatDuration(item.totalDurationMins)}
                                </p>
                              </div>

                              <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                                <button
                                  type="button"
                                  onClick={() => onRemoveCartItem(item.cartItemId)}
                                  className="text-[#9C8C8E] hover:text-red-700 p-1 cursor-pointer"
                                  title="Remove service"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-bold text-[#1F1A1C] tabular-nums">
                                  ₹{item.totalItemPrice.toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Minimum Booking Policy & Service Location Selector */}
                        <div className="p-4 rounded-xl border border-[#E8DDD3] bg-white space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#1F1A1C] uppercase tracking-wide flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
                              <span>Select Service Location</span>
                            </span>
                            <span className="text-xs font-bold text-[#4A0417] tabular-nums">
                              Min Required: ₹{activeMinOrder.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { id: 'Delhi', label: 'Delhi', min: 1000 },
                              { id: 'Haryana', label: 'Haryana', min: 1500 },
                              { id: 'Noida', label: 'Noida', min: 1500 }
                            ].map((loc) => {
                              const isSelected =
                                (loc.id === 'Delhi' && city.toLowerCase().includes('delhi')) ||
                                (loc.id === 'Haryana' && (city.toLowerCase().includes('haryana') || city.toLowerCase().includes('gurugram') || city.toLowerCase().includes('faridabad'))) ||
                                (loc.id === 'Noida' && (city.toLowerCase().includes('noida') || city.toLowerCase().includes('ghaziabad')));
                              return (
                                <button
                                  key={loc.id}
                                  type="button"
                                  onClick={() => {
                                    setCity(loc.id === 'Haryana' ? 'Gurugram' : loc.id);
                                    setMatchedTerritory(null);
                                  }}
                                  className={`p-2.5 rounded-lg text-center border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#4A0417] text-white border-[#4A0417] shadow-xs'
                                      : 'bg-[#FAF7F2] text-[#1F1A1C] border-[#E8DDD3] hover:border-[#4A0417]'
                                  }`}
                                >
                                  <div className="text-xs font-bold">{loc.label}</div>
                                  <div className={`text-[10px] mt-0.5 font-medium ${isSelected ? 'text-[#C5A880]' : 'text-[#7A6B6D]'}`}>
                                    Min ₹{loc.min.toLocaleString('en-IN')}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E8DDD3] text-[11px] text-[#554749] leading-relaxed space-y-1">
                            <div className="font-semibold text-[#1F1A1C]">Minimum booking amount:</div>
                            <div className="grid grid-cols-3 gap-1 font-mono text-[11px] text-[#4A0417] font-semibold">
                              <span>Delhi – ₹1,000</span>
                              <span>Haryana – ₹1,500</span>
                              <span>Noida – ₹1,500</span>
                            </div>
                            <p className="text-[10px] text-[#7A6B6D] pt-1 italic">
                              Your cart must meet the minimum order amount for your selected service location before you can confirm your booking.
                            </p>
                          </div>

                          {isBelowMin ? (
                            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Minimum Amount Needed:</span> Current subtotal is ₹{subtotal.toLocaleString('en-IN')}. For <strong>{city}</strong>, please add treatments worth <strong>₹{minDeficit.toLocaleString('en-IN')}</strong> more to proceed.
                              </div>
                            </div>
                          ) : (
                            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Minimum order requirement for <strong>{city}</strong> is satisfied (₹{subtotal.toLocaleString('en-IN')} / ₹{activeMinOrder.toLocaleString('en-IN')}).</span>
                            </div>
                          )}
                        </div>

                        {bundlePercent > 0 && (
                          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                            <span className="font-semibold">Tiered Bundle Discount ({bundlePercent}%)</span>
                            <span className="font-bold tabular-nums">-₹{packageDiscount}</span>
                          </div>
                        )}
                      </>
                    )}
                  </motion.div>
                )}

                {/* STEP 2: ADDRESS & PINCODE */}
                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-[#4A0417] mb-1">
                        Delhi NCR Service Address
                      </h4>
                      <p className="text-xs text-[#6B5A5C]">
                        Enter your doorstep location across Delhi, Gurugram, or Noida for your beauty specialist’s arrival.
                      </p>
                    </div>

                    {/* Flat / House / Villa */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1F1A1C] flex items-center gap-1">
                        <Home className="w-3.5 h-3.5 text-[#4A0417]" />
                        House / Flat / Floor / Building Name *
                      </label>
                      <input
                        type="text"
                        value={flat}
                        onChange={(e) => setFlat(e.target.value)}
                        placeholder="e.g. Flat 402, Tower B, Palm Springs"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-hidden focus:border-[#4A0417]"
                      />
                    </div>

                    {/* Street / Society / Colony / Landmark */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1F1A1C]">
                        Society / Colony / Landmark *
                      </label>
                      <input
                        type="text"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="e.g. DLF Phase 5, Near Central Market"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-hidden focus:border-[#4A0417]"
                      />
                    </div>

                    {/* Locality & City */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#1F1A1C]">
                          Locality / Neighborhood *
                        </label>
                        <input
                          type="text"
                          value={area}
                          onChange={(e) => setArea(e.target.value)}
                          placeholder="e.g. South Delhi, Indirapuram"
                          className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-hidden focus:border-[#4A0417]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#1F1A1C]">City *</label>
                        <select
                          value={city}
                          onChange={(e) => {
                            setCity(e.target.value);
                            setMatchedTerritory(null);
                          }}
                          className="w-full px-3 py-2.5 text-xs sm:text-sm bg-[#FAF7F2] border border-[#E8DDD3] rounded-md text-[#1F1A1C] focus:outline-hidden focus:border-[#4A0417]"
                        >
                          <option value="Delhi">Delhi (Min ₹1,000)</option>
                          <option value="Gurugram">Haryana – Gurugram (Min ₹1,500)</option>
                          <option value="Faridabad">Haryana – Faridabad (Min ₹1,500)</option>
                          <option value="Noida">Noida (Min ₹1,500)</option>
                          <option value="Greater Noida">Greater Noida (Min ₹1,500)</option>
                          <option value="Ghaziabad">Ghaziabad (Min ₹1,500)</option>
                        </select>
                      </div>
                    </div>

                    {isBelowMin ? (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-[#4A0417] mb-0.5">Minimum Booking Amount Policy:</div>
                          <div className="text-[11px] mb-1">Delhi – ₹1,000 · Haryana – ₹1,500 · Noida – ₹1,500</div>
                          <div>
                            Service in <strong>{city}</strong> requires a minimum order of <strong>₹{activeMinOrder.toLocaleString('en-IN')}</strong>. Current cart subtotal is ₹{subtotal.toLocaleString('en-IN')}. Please add ₹{minDeficit.toLocaleString('en-IN')} more to unlock doorstep scheduling.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Minimum order requirement for <strong>{city}</strong> is satisfied (₹{subtotal.toLocaleString('en-IN')} / ₹{activeMinOrder.toLocaleString('en-IN')}).</span>
                      </div>
                    )}

                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Complimentary doorstep arrival across Delhi NCR. No hidden travel fees.</span>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: DATE & SLOT */}
                {step === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-[#4A0417] mb-1">
                        Select Appointment Schedule
                      </h4>
                      <p className="text-xs text-[#6B5A5C]">
                        Beauticians arrive 10 minutes prior to set up the sanitized workspace.
                      </p>
                    </div>

                    {/* Date selection: next 7 days */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#1F1A1C] flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#4A0417]" />
                        Select Date
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
                          const d = new Date(Date.now() + (dayOffset + 1) * 86400000);
                          const dateStr = d.toISOString().split('T')[0];
                          const isSelected = selectedDate === dateStr;
                          return (
                            <button
                              key={dateStr}
                              onClick={() => setSelectedDate(dateStr)}
                              className={`p-2.5 rounded-lg border text-center transition-all ${
                                isSelected
                                  ? 'bg-[#4A0417] text-white border-[#4A0417] shadow-xs'
                                  : 'bg-[#FAF7F2] hover:bg-white border-[#E8DDD3] text-[#1F1A1C]'
                              }`}
                            >
                              <p className="text-[10px] uppercase font-semibold opacity-80">
                                {d.toLocaleDateString('en-US', { weekday: 'short' })}
                              </p>
                              <p className="text-sm font-bold tabular-nums">
                                {d.getDate()}
                              </p>
                              <p className="text-[10px] opacity-75">
                                {d.toLocaleDateString('en-US', { month: 'short' })}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div className="space-y-2 pt-2">
                      <label className="text-xs font-semibold text-[#1F1A1C] flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#4A0417]" />
                          Available Time Slots (8:00 AM – 6:00 PM)
                        </span>
                        {slotsLoading && <span className="text-[11px] text-[#8C7A7C]">Checking slots...</span>}
                      </label>
                      <p className="text-[11px] text-[#8C7A7C]">
                        Slots from 8:00 AM to 6:00 PM. Note: 8:00 AM early-morning and 6:00 PM evening slots include a nominal ₹100 specialist surcharge.
                      </p>

                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot) => {
                          const isSelected = selectedSlot === slot;
                          const hasSurcharge = slot === '08:00 AM' || slot === '06:00 PM';
                          return (
                            <button
                              key={slot}
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-2 px-2 text-xs font-semibold rounded-md border transition-all tabular-nums flex flex-col items-center justify-center relative ${
                                isSelected
                                  ? 'bg-[#4A0417] text-white border-[#4A0417]'
                                  : 'bg-white hover:bg-[#FAF7F2] border-[#E8DDD3] text-[#1F1A1C]'
                              }`}
                            >
                              <span>{slot}</span>
                              {hasSurcharge && (
                                <span className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 px-1 py-0.2 rounded ${
                                  isSelected ? 'bg-amber-400 text-stone-900' : 'bg-amber-100 text-amber-900'
                                }`}>
                                  +₹100 Extra
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: CONTACT & FINAL REVIEW */}
                {step === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-[#4A0417] mb-1">
                        Customer Details & Payment
                      </h4>
                      <p className="text-xs text-[#6B5A5C]">
                        Booking confirmation & live status will be shared via SMS / WhatsApp.
                      </p>
                    </div>

                    {/* Name & Phone */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-[#1F1A1C] flex items-center gap-1 mb-1">
                          <User className="w-3.5 h-3.5 text-[#4A0417]" />
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. Radhika Sharma"
                          className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#1F1A1C] flex items-center gap-1 mb-1">
                          <Phone className="w-3.5 h-3.5 text-[#4A0417]" />
                          Mobile Number (for OTP & Arrival Calls) *
                        </label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="e.g. +91 98112 00000"
                          className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417] tabular-nums"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[#1F1A1C] flex items-center gap-1 mb-1">
                          Email Address (Optional)
                        </label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="e.g. radhika@example.com"
                          className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417]"
                        />
                      </div>
                    </div>

                    {/* Coupon input */}
                    <div className="pt-2">
                      <label className="text-xs font-semibold text-[#1F1A1C] flex items-center gap-1 mb-1">
                        <Tag className="w-3.5 h-3.5 text-[#4A0417]" />
                        Have a Promo Code? (Try BEAUTYFIRST)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="BEAUTYFIRST"
                          className="flex-1 px-3 py-2 text-xs font-bold uppercase bg-[#FAF7F2] border border-[#E8DDD3] rounded-md tracking-wider"
                        />
                        <button
                          type="button"
                          disabled={couponLoading || !couponCode}
                          onClick={handleApplyCoupon}
                          className="px-4 py-2 bg-[#1F1A1C] text-white text-xs font-semibold rounded-md hover:bg-black transition-colors disabled:opacity-40"
                        >
                          {couponLoading ? '...' : 'Apply'}
                        </button>
                      </div>
                      {appliedCoupon && (
                        <p className="mt-1 text-xs text-emerald-800 font-semibold">
                          ✓ Applied {appliedCoupon.code}: {appliedCoupon.description} (-₹{appliedCoupon.discount})
                        </p>
                      )}
                      {couponError && (
                        <p className="mt-1 text-xs text-red-600 font-medium">{couponError}</p>
                      )}
                    </div>

                    {/* Payment Method Options */}
                    <div className="pt-2 space-y-2">
                      <label className="text-xs font-semibold text-[#1F1A1C]">Choose Payment Method</label>
                      
                      {/* Option 1: Cash on Delivery */}
                      <div
                        onClick={() => setPaymentMethod('cod')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          paymentMethod === 'cod'
                            ? 'border-[#4A0417] bg-[#FAF7F2] shadow-xs'
                            : 'border-[#E8DDD3] bg-white hover:bg-[#FAF7F2]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === 'cod' ? 'border-[#4A0417]' : 'border-[#8C7A7C]'
                          }`}>
                            {paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-[#4A0417]" />}
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-[#1F1A1C]">
                              Cash on Delivery (Pay After Service)
                            </p>
                            <p className="text-[11px] text-[#6B5A5C]">
                              Pay via Cash or UPI to the specialist after service completion.
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-[#4A0417] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E8DDD3]">
                          Popular
                        </span>
                      </div>

                      {/* Option 2: Online Payment */}
                      <div
                        onClick={() => setPaymentMethod('razorpay')}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          paymentMethod === 'razorpay'
                            ? 'border-[#4A0417] bg-[#FAF7F2] shadow-xs'
                            : 'border-[#E8DDD3] bg-white hover:bg-[#FAF7F2]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            paymentMethod === 'razorpay' ? 'border-[#4A0417]' : 'border-[#8C7A7C]'
                          }`}>
                            {paymentMethod === 'razorpay' && <div className="w-2 h-2 rounded-full bg-[#4A0417]" />}
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-semibold text-[#1F1A1C]">
                              Online Payment (UPI, Credit/Debit Cards, NetBanking)
                            </p>
                            <p className="text-[11px] text-[#6B5A5C]">
                              Instant order confirmation via Razorpay secure checkout.
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Instant
                        </span>
                      </div>
                    </div>

                    {isBelowMin ? (
                      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                        <div className="font-bold text-[#4A0417] flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Minimum Booking Amount Not Met</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          Delhi: ₹1,000 · Haryana: ₹1,500 · Noida: ₹1,500.
                          <br />
                          Your current order for <strong>{city}</strong> is ₹{subtotal.toLocaleString('en-IN')}. Please add treatments worth <strong>₹{minDeficit.toLocaleString('en-IN')}</strong> more to confirm this appointment.
                        </p>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Minimum booking requirement for <strong>{city}</strong> satisfied (₹{subtotal.toLocaleString('en-IN')} / ₹{activeMinOrder.toLocaleString('en-IN')}).</span>
                      </div>
                    )}

                    {/* Cancellation & Refund Policy Notice */}
                    <div className="p-3 bg-[#FAF7F2] border border-[#E8DDD3] rounded-xl text-xs space-y-1.5 text-[#554749]">
                      <div className="flex items-center gap-1.5 font-bold text-[#4A0417] text-[11px] uppercase tracking-wider">
                        <Clock className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                        <span>Cancellation & Refund Policy</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#554749]">
                        • <strong>Free Cancellation:</strong> 100% free (₹0 fee) if cancelled at least <strong>2 hours</strong> before your appointment.<br />
                        • <strong>Late Cancellation:</strong> Cancellations made less than 2 hours before the slot incur a <strong>₹200 convenience fee</strong>.<br />
                        • <strong>Refunds:</strong> For online-paid orders, balance is refunded to source account. For Cash-on-Delivery, ₹200 late fee is recorded on your account.
                      </p>
                    </div>

                    {submitError && (
                      <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
                        {submitError}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* STEP 5: SUCCESS CONFIRMATION WITH FRAMER MOTION ANIMATION */}
                {step === 5 && createdBooking && (
                  <motion.div
                    key="step-5"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="text-center py-6 space-y-5"
                  >
                    {/* Animated Checkmark Badge with Soft Ripple */}
                    <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                      <motion.div
                        initial={{ opacity: 0.6, scale: 0.8 }}
                        animate={{ opacity: 0, scale: 1.6 }}
                        transition={{ repeat: Infinity, duration: 2.2, ease: 'easeOut' }}
                        className="absolute inset-0 rounded-full bg-emerald-400"
                      />
                      <motion.div
                        initial={{ scale: 0, rotate: -25 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 16, stiffness: 280, delay: 0.1 }}
                        className="relative w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-md border border-emerald-200"
                      >
                        <CheckCircle2 className="w-8 h-8" />
                      </motion.div>
                    </div>

                    {/* Staggered Heading */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                      className="space-y-1"
                    >
                      <span className="text-xs uppercase font-bold tracking-wider text-[#4A0417] bg-[#FAF7F2] px-3 py-1 rounded-full border border-[#E8DDD3]">
                        Appointment Confirmed
                      </span>
                      <h3 className="text-2xl font-serif font-bold text-[#1F1A1C] mt-2">
                        Thank You, {createdBooking.customerName}!
                      </h3>
                      <p className="text-xs text-[#6B5A5C]">
                        Your luxury at-home session has been registered with BeautyDoor.
                      </p>
                    </motion.div>

                    {/* Staggered Booking Receipt Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.32, duration: 0.35 }}
                      className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DDD3] text-left text-xs space-y-2.5 max-w-sm mx-auto shadow-xs"
                    >
                      <div className="flex justify-between border-b border-[#E8DDD3] pb-2">
                        <span className="text-[#7A6B6D]">Booking ID:</span>
                        <span className="font-bold text-[#4A0417] tabular-nums">{createdBooking.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7A6B6D]">Scheduled Time:</span>
                        <span className="font-semibold text-[#1F1A1C]">{createdBooking.appointmentDate} at {createdBooking.appointmentSlot}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7A6B6D]">Service Area:</span>
                        <span className="font-medium text-[#1F1A1C] truncate max-w-[200px]">{createdBooking.address.flat}, {createdBooking.address.city}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-[#F0E6DE]">
                        <span className="text-[#7A6B6D]">Payment:</span>
                        <span className="font-bold text-emerald-800 tabular-nums">₹{createdBooking.totalPayable} (Cash on Delivery)</span>
                      </div>
                    </motion.div>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.42, duration: 0.3 }}
                      className="text-xs text-[#7A6B6D] max-w-xs mx-auto leading-relaxed"
                    >
                      Our customer support team is assigning your certified beautician. You will receive an SMS and WhatsApp confirmation prior to arrival.
                    </motion.p>

                    {/* Verified Customer Support Help Box */}
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45, duration: 0.3 }}
                      className="p-3 bg-white rounded-lg border border-[#E8DDD3] max-w-sm mx-auto text-xs text-[#5C4D4F] space-y-1"
                    >
                      <p className="font-semibold text-[#1F1A1C]">
                        Need help or rescheduling?
                      </p>
                      <p className="text-[11px] text-[#7A6B6D]">
                        Contact <strong>{BUSINESS_CONFIG.contactPerson}</strong> at{' '}
                        <a
                          href={BUSINESS_CONFIG.phoneTel}
                          className="font-bold text-[#4A0417] hover:underline tabular-nums"
                          title="Call Customer Support"
                        >
                          {BUSINESS_CONFIG.phone}
                        </a>{' '}
                        or{' '}
                        <a
                          href={BUSINESS_CONFIG.emailMailto}
                          className="font-bold text-[#4A0417] hover:underline"
                          title="Email Customer Support"
                        >
                          {BUSINESS_CONFIG.email}
                        </a>
                      </p>
                      <p className="text-[10px] text-[#8C7A7C]">
                        Operating Hours: {BUSINESS_CONFIG.operatingHoursDisplay} (Daily)
                      </p>
                    </motion.div>

                    <motion.button
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.48, duration: 0.3 }}
                      onClick={onClose}
                      className="w-full py-3 bg-[#4A0417] hover:bg-[#36020F] text-white text-xs font-semibold rounded-md shadow-xs transition-colors"
                    >
                      Return to Storefront
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sticky Drawer Footer with Pricing & Step Navigation (Hidden on Success) */}
            {step < 5 && cartItems.length > 0 && (
              <div className="bg-[#FAF7F2] p-4 sm:p-5 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-[#E8DDD3] space-y-3 shrink-0">
                {/* Price breakdown summary */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[#6B5A5C]">
                    <span>Services Subtotal:</span>
                    <span className="tabular-nums">₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {packageDiscount > 0 && (
                    <div className="flex justify-between text-emerald-800 font-medium">
                      <span>Bundle Discount:</span>
                      <span className="tabular-nums">-₹{packageDiscount}</span>
                    </div>
                  )}
                  {slotCharge > 0 && (
                    <div className="flex justify-between text-amber-900 font-medium">
                      <span>Early/Evening Slot Surcharge ({selectedSlot}):</span>
                      <span className="tabular-nums">+₹{slotCharge}</span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-emerald-800 font-medium">
                      <span>Coupon ({appliedCoupon?.code}):</span>
                      <span className="tabular-nums">-₹{couponDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-[#1F1A1C] pt-2 border-t border-[#E8DDD3]">
                    <span>Payable at Doorstep:</span>
                    <span className="tabular-nums text-[#4A0417]">₹{finalTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Stepper Buttons with explicit type and minimum order enforcement */}
                <div className="flex items-center gap-2 pt-1">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => setStep((prev) => Math.max(1, prev - 1) as any)}
                      className="px-4 py-2.5 text-xs font-semibold text-[#554749] hover:bg-white rounded-md border border-[#E8DDD3] transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                  )}

                  {step === 1 && (
                    <button
                      type="button"
                      disabled={cartItems.length === 0 || isBelowMin}
                      onClick={() => setStep(2)}
                      className="flex-1 py-3 bg-[#4A0417] hover:bg-[#36020F] text-[#FAF7F2] text-xs sm:text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-40 cursor-pointer"
                    >
                      <span>{isBelowMin ? `Add ₹${minDeficit.toLocaleString('en-IN')} More to Book` : 'Enter Address'}</span>
                      <ArrowRight className="w-4 h-4 text-[#C5A880]" />
                    </button>
                  )}

                  {step === 2 && (
                    <button
                      type="button"
                      disabled={!flat.trim() || (!area.trim() && !landmark.trim()) || isBelowMin}
                      onClick={() => setStep(3)}
                      className="flex-1 py-3 bg-[#4A0417] hover:bg-[#36020F] text-[#FAF7F2] text-xs sm:text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                    >
                      <span>{isBelowMin ? `Min ₹${activeMinOrder.toLocaleString('en-IN')} Required` : 'Select Appointment Slot'}</span>
                      <ArrowRight className="w-4 h-4 text-[#C5A880]" />
                    </button>
                  )}

                  {step === 3 && (
                    <button
                      type="button"
                      disabled={!selectedSlot}
                      onClick={() => setStep(4)}
                      className="flex-1 py-3 bg-[#4A0417] hover:bg-[#36020F] text-[#FAF7F2] text-xs sm:text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                    >
                      <span>Review & Contact</span>
                      <ArrowRight className="w-4 h-4 text-[#C5A880]" />
                    </button>
                  )}

                  {step === 4 && (
                    <button
                      type="button"
                      disabled={isSubmitting || !customerName.trim() || !customerPhone.trim() || isBelowMin}
                      onClick={handleConfirmBooking}
                      className="flex-1 py-3 bg-[#4A0417] hover:bg-[#36020F] text-[#FAF7F2] text-xs sm:text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#C5A880]" />
                      <span>{isSubmitting ? 'Confirming...' : isBelowMin ? `Min Order ₹${activeMinOrder}` : 'Place Booking (Pay After Service)'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
