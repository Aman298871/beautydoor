import React, { useState, useEffect } from 'react';
import { Phone, Calendar, Clock, MapPin, CheckCircle2, AlertCircle, LogOut, Award, RefreshCw, XCircle } from 'lucide-react';
import { useRouter } from '../router.tsx';

export const AccountPage: React.FC = () => {
  const { navigate } = useRouter();
  const [phone, setPhone] = useState('9811223344');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Reschedule & cancel state
  const [rescheduleBookingId, setRescheduleBookingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [newSlot, setNewSlot] = useState('11:00 AM');
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Schedule conflict');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchBookings = async (cleanPhone: string) => {
    try {
      const res = await fetch(`/api/storefront/customer/bookings?phone=${cleanPhone}`);
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.replace(/\D/g, '').length < 10) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/customer/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      const data = await res.json();
      if (res.ok) {
        setIsOtpSent(true);
        setOtp(data.devOtp || '1234');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/customer/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });
      const data = await res.json();
      if (res.ok) {
        setIsLoggedIn(true);
        await fetchBookings(phone);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    try {
      const res = await fetch('/api/storefront/customer/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, phone, reason: cancelReason })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message || 'Appointment cancelled.');
        setCancelBookingId(null);
        await fetchBookings(phone);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleBookingId) return;
    try {
      const res = await fetch('/api/storefront/customer/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: rescheduleBookingId, phone, newDate, newSlot })
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message || 'Appointment rescheduled.');
        setRescheduleBookingId(null);
        await fetchBookings(phone);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="py-12 sm:py-16 bg-[#FAF7F2] min-h-[85vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div>
          <p className="text-xs text-[#8C7A7C] mb-1">
            <span onClick={() => navigate('/')} className="hover:text-[#4A0417] cursor-pointer">Home</span> / Customer Account
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1F1A1C]">
            {isLoggedIn ? 'My Appointments & Privé Membership' : 'Customer Account Login'}
          </h1>
          <p className="text-sm text-[#5C4D4F] mt-1 font-light">
            Manage your booked at-home salon visits, rescheduling, and membership perks.
          </p>
        </div>

        {/* NOT LOGGED IN: OTP FORM */}
        {!isLoggedIn ? (
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-[#E8DDD3] shadow-md space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#FAF7F2] text-[#4A0417] flex items-center justify-center mx-auto border border-[#E8DDD3]">
                <Phone className="w-5 h-5 text-[#4A0417]" />
              </div>
              <h2 className="text-lg font-serif font-bold text-[#1F1A1C]">
                Mobile Number OTP Sign In
              </h2>
              <p className="text-xs text-[#7A6B6D]">
                Enter your 10-digit mobile number to access appointments.
              </p>
            </div>

            {!isOtpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#1F1A1C]">Mobile Number</label>
                  <div className="flex gap-2">
                    <span className="px-3 py-2 text-xs font-semibold bg-[#FAF7F2] border border-[#E8DDD3] rounded-md text-[#4A3E3D] flex items-center">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9811223344"
                      className="flex-1 px-3.5 py-2 text-sm bg-white border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417] tabular-nums"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.replace(/\D/g, '').length < 10}
                  className="w-full py-3 bg-[#4A0417] hover:bg-[#36020F] text-white text-xs font-semibold rounded-md shadow-xs transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
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
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="1234"
                    className="w-full px-3.5 py-2.5 text-center text-lg font-mono tracking-widest bg-[#FAF7F2] border border-[#E8DDD3] rounded-md focus:outline-none focus:border-[#4A0417]"
                  />
                  <p className="text-[11px] text-emerald-800 text-center font-medium">
                    ✓ Development OTP pre-filled: 1234
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 4}
                  className="w-full py-3 bg-[#4A0417] hover:bg-[#36020F] text-white text-xs font-semibold rounded-md shadow-xs transition-colors disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify & Open Portal'}
                </button>
              </form>
            )}
          </div>
        ) : (
          /* LOGGED IN VIEW */
          <div className="space-y-6">
            
            {/* Membership Header */}
            <div className="p-5 rounded-2xl bg-white border border-[#E8DDD3] shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#4A0417] text-[#C5A880] flex items-center justify-center font-bold">
                  <Award className="w-5 h-5 text-[#C5A880]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1F1A1C] flex items-center gap-2">
                    <span>BeautyDoor Privé Member</span>
                    <span className="text-[10px] font-semibold text-[#4A0417] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E8DDD3]">
                      Active
                    </span>
                  </h3>
                  <p className="text-xs text-[#7A6B6D]">
                    Phone: +91 {phone} · Priority beautician dispatch
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsLoggedIn(false)}
                className="text-xs text-[#7A6B6D] hover:text-[#1F1A1C] flex items-center gap-1 font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>

            {actionMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 rounded-md">
                {actionMessage}
              </div>
            )}

            {/* Bookings List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold text-[#1F1A1C]">
                  My Booked Visits ({bookings.length})
                </h3>
                <button
                  onClick={() => fetchBookings(phone)}
                  className="text-xs text-[#4A0417] hover:underline flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </div>

              {bookings.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-[#E8DDD3] space-y-3">
                  <Calendar className="w-10 h-10 text-[#C5A880] mx-auto" />
                  <h4 className="text-base font-semibold text-[#1F1A1C]">No appointments found</h4>
                  <p className="text-xs text-[#7A6B6D] max-w-sm mx-auto">
                    You have no scheduled beauty sessions for this mobile number. Browse our services to reserve your first ritual.
                  </p>
                  <button
                    onClick={() => navigate('/services')}
                    className="px-5 py-2.5 bg-[#4A0417] text-white text-xs font-semibold rounded-md hover:bg-[#36020F]"
                  >
                    Explore Treatments
                  </button>
                </div>
              ) : (
                bookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white p-5 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F4EFEA] pb-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-[#4A0417] tabular-nums">{b.id}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-[#1F1A1C]">{b.appointment_date} at {b.appointment_slot}</span>
                        </div>
                        <p className="text-xs text-[#6B5A5C] mt-0.5">
                          {b.flat}, {b.area}, {b.city} ({b.pincode})
                        </p>
                      </div>

                      <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded border self-start sm:self-auto ${
                        b.booking_status === 'confirmed' || b.booking_status === 'assigned'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : b.booking_status === 'completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : b.booking_status === 'cancelled'
                          ? 'bg-red-50 text-red-800 border-red-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {b.booking_status}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="space-y-1 text-xs">
                      {b.items.map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-[#4A3E3D]">
                          <span>{it.service_name} {it.variant_name ? `(${it.variant_name})` : ''}</span>
                          <span className="tabular-nums font-semibold">₹{it.final_item_price}</span>
                        </div>
                      ))}
                    </div>

                    {/* Summary row */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#F4EFEA] text-xs">
                      <div>
                        <span className="text-[#7A6B6D]">Total: </span>
                        <span className="font-bold text-[#1F1A1C] tabular-nums">₹{b.total_payable}</span>
                        <span className="text-[11px] text-[#8C7A7C] ml-1">({b.payment_method})</span>
                      </div>

                      {b.booking_status !== 'cancelled' && b.booking_status !== 'completed' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setRescheduleBookingId(b.id);
                              setActionMessage(null);
                            }}
                            className="px-3 py-1 text-xs font-semibold text-[#4A0417] hover:bg-[#FAF7F2] border border-[#4A0417]/20 rounded"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => setCancelBookingId(b.id)}
                            className="px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Reschedule inline dialog */}
                    {rescheduleBookingId === b.id && (
                      <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DDD3] space-y-2.5 text-xs">
                        <p className="font-semibold text-[#4A0417]">Choose Rescheduled Slot:</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-[#E8DDD3] rounded text-xs"
                          />
                          <select
                            value={newSlot}
                            onChange={(e) => setNewSlot(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-[#E8DDD3] rounded text-xs font-medium"
                          >
                            {['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '05:00 PM', '07:00 PM'].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setRescheduleBookingId(null)}
                            className="px-3 py-1 bg-white border border-[#E8DDD3] rounded"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={handleReschedule}
                            className="px-4 py-1 bg-[#4A0417] text-white rounded font-semibold"
                          >
                            Confirm Reschedule
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Cancellation dialog */}
                    {cancelBookingId === b.id && (
                      <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 space-y-2 text-xs text-red-950">
                        <p className="font-semibold">Cancel Appointment {b.id}?</p>
                        <p className="text-[11px] text-red-800">
                          Complimentary cancellation up to 4 hours prior. Reason:
                        </p>
                        <select
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-red-300 rounded text-xs"
                        >
                          <option value="Schedule conflict">Schedule conflict</option>
                          <option value="Travelling">Travelling</option>
                          <option value="Change of plans">Change of plans</option>
                        </select>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={() => setCancelBookingId(null)}
                            className="px-3 py-1 bg-white border border-red-300 rounded"
                          >
                            Keep Visit
                          </button>
                          <button
                            onClick={() => handleCancel(b.id)}
                            className="px-4 py-1 bg-red-700 text-white rounded font-semibold"
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
  );
};
