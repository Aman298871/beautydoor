import React, { useState } from 'react';
import {
  X,
  Phone,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Star,
  RefreshCw,
  LogOut,
  Sparkles,
  Award
} from 'lucide-react';
import { Booking } from '../types.ts';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCancelBooking: (bookingId: string, phone: string, reason: string) => Promise<void>;
  onRescheduleBooking: (bookingId: string, phone: string, newDate: string, newSlot: string) => Promise<void>;
}

export const CustomerAccountModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCancelBooking,
  onRescheduleBooking
}) => {
  // Login state (simulated mobile OTP)
  const [phoneNumber, setPhoneNumber] = useState('9811223344');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);

  // Reschedule state
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>(() => {
    return new Date(Date.now() + 86400000).toISOString().split('T')[0];
  });
  const [rescheduleSlot, setRescheduleSlot] = useState<string>('02:00 PM');
  const [rescheduleMessage, setRescheduleMessage] = useState<string | null>(null);

  // Cancellation state
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Schedule conflict');

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 10) return;
    setIsOtpSent(true);
    setOtpCode('1234'); // Auto-filled mock OTP for seamless testing
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/customer/bookings?phone=${phoneNumber}`);
      const data = await res.json();
      setCustomerBookings(data.bookings || []);
      setIsLoggedIn(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async (bookingId: string) => {
    try {
      await onCancelBooking(bookingId, phoneNumber, cancelReason);
      setCancelBookingId(null);
      // Refresh list
      const res = await fetch(`/api/customer/bookings?phone=${phoneNumber}`);
      const data = await res.json();
      setCustomerBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleBookingId) return;
    try {
      await onRescheduleBooking(rescheduleBookingId, phoneNumber, rescheduleDate, rescheduleSlot);
      setRescheduleMessage('Appointment successfully rescheduled.');
      setRescheduleBookingId(null);
      // Refresh list
      const res = await fetch(`/api/customer/bookings?phone=${phoneNumber}`);
      const data = await res.json();
      setCustomerBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-[#E8DDD3] my-8 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-[#FAF7F2] p-5 sm:p-6 border-b border-[#E8DDD3] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#4A0417]">
              <span>BeautyDoor Privé</span>
              <span aria-hidden="true">·</span>
              <span>Customer Portal</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1F1A1C] mt-0.5">
              {isLoggedIn ? 'My Appointments & Membership' : 'Customer Sign In'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#6B5A5C] hover:text-[#1F1A1C] hover:bg-[#EAE2D8] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          
          {/* NOT LOGGED IN: MOBILE OTP SCREEN */}
          {!isLoggedIn ? (
            <div className="max-w-md mx-auto py-6 space-y-5">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-[#FAF7F2] text-[#4A0417] flex items-center justify-center mx-auto border border-[#E8DDD3]">
                  <Phone className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-serif font-bold text-[#1F1A1C]">
                  Sign In with Mobile OTP
                </h4>
                <p className="text-xs text-[#6B5A5C]">
                  View upcoming visits, manage rescheduling, or submit reviews.
                </p>
              </div>

              {!isOtpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#1F1A1C]">
                      Mobile Number (India)
                    </label>
                    <div className="flex gap-2">
                      <span className="px-3 py-2.5 bg-[#FAF7F2] border border-[#E8DDD3] rounded-md text-xs font-semibold text-[#4A3E3D] flex items-center">
                        +91
                      </span>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="9811223344"
                        className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417] tabular-nums"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#4A0417] hover:bg-[#36020F] text-white text-xs font-semibold rounded-md transition-colors shadow-xs"
                  >
                    Send One-Time Password
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-[#1F1A1C]">Enter 4-Digit OTP</span>
                      <button
                        type="button"
                        onClick={() => setIsOtpSent(false)}
                        className="text-[#4A0417] hover:underline"
                      >
                        Change Number
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="1234"
                      className="w-full px-3.5 py-2.5 text-center text-lg font-mono tracking-widest bg-white border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417]"
                    />
                    <p className="text-[11px] text-emerald-800 text-center font-medium">
                      ✓ Instant OTP pre-filled for testing: 1234
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={loading || otpCode.length < 4}
                    className="w-full py-3 bg-[#4A0417] hover:bg-[#36020F] text-white text-xs font-semibold rounded-md transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify & View Appointments'}
                  </button>
                </form>
              )}
            </div>
          ) : (
            // LOGGED IN: PROFILE & BOOKINGS DASHBOARD
            <div className="space-y-6">
              
              {/* Top Banner: Membership Tier */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#FAF7F2] to-[#F4EFEA] border border-[#E8DDD3] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#4A0417] text-[#C5A880] flex items-center justify-center font-serif font-bold text-lg">
                    <Award className="w-5 h-5 text-[#C5A880]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1F1A1C] flex items-center gap-2">
                      <span>BeautyDoor Privé Member</span>
                      <span className="text-[10px] font-semibold text-[#4A0417] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#C5A880]/30">
                        Gold Tier
                      </span>
                    </h4>
                    <p className="text-xs text-[#7A6B6D]">
                      Registered Phone: +91 {phoneNumber} · 150 Privé Points
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsLoggedIn(false)}
                  className="p-2 text-[#7A6B6D] hover:text-[#1F1A1C] transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {rescheduleMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded">
                  {rescheduleMessage}
                </div>
              )}

              {/* Bookings List */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4A0417]">
                  My Appointments ({customerBookings.length})
                </h4>

                {customerBookings.length === 0 ? (
                  <div className="text-center py-8 bg-[#FAF7F2] rounded-xl border border-[#E8DDD3]">
                    <Calendar className="w-8 h-8 text-[#C5A880] mx-auto mb-2" />
                    <p className="text-xs text-[#6B5A5C]">
                      No active appointments found for this phone number.
                    </p>
                  </div>
                ) : (
                  customerBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 rounded-xl border border-[#E8DDD3] bg-white hover:border-[#C5A880] transition-colors space-y-3"
                    >
                      {/* Booking Top line */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-[#4A0417] tabular-nums">{b.id}</span>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#7A6B6D]">{b.appointmentDate} at {b.appointmentSlot}</span>
                          </div>
                          <p className="text-xs text-[#554749] mt-0.5">
                            {b.address.flat}, {b.address.area}, {b.address.city} ({b.address.pincode})
                          </p>
                        </div>

                        {/* Status Badge (clean text with indicator) */}
                        <span className={`text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded border ${
                          b.bookingStatus === 'confirmed' || b.bookingStatus === 'assigned'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : b.bookingStatus === 'completed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : b.bookingStatus === 'cancelled'
                            ? 'bg-red-50 text-red-800 border-red-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {b.bookingStatus}
                        </span>
                      </div>

                      {/* Items itemized */}
                      <div className="space-y-1 py-1 border-t border-b border-[#F4EFEA] text-xs">
                        {b.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-[#4A3E3D]">
                            <span>{it.serviceName} {it.variantName ? `(${it.variantName})` : ''}</span>
                            <span className="tabular-nums font-medium">₹{it.finalItemPrice}</span>
                          </div>
                        ))}
                      </div>

                      {/* Bottom actions */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div>
                          <span className="text-[#7A6B6D]">Total: </span>
                          <span className="font-bold text-[#1F1A1C] tabular-nums">₹{b.totalPayable}</span>
                          <span className="text-[11px] text-[#8C7A7C] ml-1">({b.paymentMethod})</span>
                        </div>

                        {b.bookingStatus !== 'cancelled' && b.bookingStatus !== 'completed' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setRescheduleBookingId(b.id);
                                setRescheduleMessage(null);
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-[#4A0417] hover:bg-[#FAF7F2] border border-[#4A0417]/20 rounded transition-colors"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => setCancelBookingId(b.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 border border-red-200 rounded transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Reschedule inline drawer */}
                      {rescheduleBookingId === b.id && (
                        <div className="p-3 bg-[#FAF7F2] rounded-lg border border-[#E8DDD3] space-y-2 text-xs">
                          <p className="font-semibold text-[#4A0417]">Select New Appointment Slot:</p>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={rescheduleDate}
                              onChange={(e) => setRescheduleDate(e.target.value)}
                              className="px-2.5 py-1.5 bg-white border border-[#E8DDD3] rounded text-xs"
                            />
                            <select
                              value={rescheduleSlot}
                              onChange={(e) => setRescheduleSlot(e.target.value)}
                              className="px-2.5 py-1.5 bg-white border border-[#E8DDD3] rounded text-xs"
                            >
                              {['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '05:00 PM', '07:00 PM'].map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={() => setRescheduleBookingId(null)}
                              className="px-3 py-1 bg-white border border-[#E8DDD3] rounded text-[11px]"
                            >
                              Dismiss
                            </button>
                            <button
                              onClick={handleConfirmReschedule}
                              className="px-3 py-1 bg-[#4A0417] text-white rounded text-[11px] font-semibold"
                            >
                              Confirm Reschedule
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Cancel confirm dialog */}
                      {cancelBookingId === b.id && (
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200 space-y-2 text-xs text-red-950">
                          <p className="font-semibold">Confirm Cancellation?</p>
                          <p className="text-[11px]">Free cancellation up to 4 hours prior. Reason:</p>
                          <select
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-red-300 rounded text-xs"
                          >
                            <option value="Schedule conflict">Schedule conflict</option>
                            <option value="Travelling out of town">Travelling out of town</option>
                            <option value="Booked by mistake">Booked by mistake</option>
                            <option value="Other">Other</option>
                          </select>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={() => setCancelBookingId(null)}
                              className="px-3 py-1 bg-white border border-red-300 rounded text-[11px]"
                            >
                              Keep Appointment
                            </button>
                            <button
                              onClick={() => handleConfirmCancel(b.id)}
                              className="px-3 py-1 bg-red-700 text-white rounded text-[11px] font-semibold"
                            >
                              Yes, Cancel
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  ))
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
