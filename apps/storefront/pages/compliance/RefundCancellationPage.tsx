import React, { useEffect } from 'react';
import { RotateCcw, Clock, ShieldCheck, CheckCircle2, AlertCircle, Phone, Mail, HelpCircle, ArrowRight } from 'lucide-react';
import { useRouter } from '../../router.tsx';
import { BUSINESS_CONFIG } from '../../../../src/config/businessConfig.ts';

interface Props {
  settings?: Record<string, string> | null;
}

export const RefundCancellationPage: React.FC<Props> = ({ settings }) => {
  const { navigate } = useRouter();

  useEffect(() => {
    document.title = 'Refund & Cancellation Policy — BeautyDoor Doorstep Salon';
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute(
      'content',
      'Official BeautyDoor Doorstep Cancellation & Refund Policy. 100% free cancellation up to 2 hours before your slot. ₹200 fee for late cancellations.'
    );
  }, []);

  const lastUpdated = settings?.policies_last_updated || 'November 2026';
  const cancellationWindow = settings?.cancellation_window_hours || '2';
  const lateFee = settings?.cancellation_fee_late || '200';
  const legalEntity = settings?.legal_business_name && settings.legal_business_name.trim()
    ? settings.legal_business_name.trim()
    : 'BeautyDoor';

  return (
    <div className="py-10 sm:py-16 bg-[#FAF7F2] min-h-[85vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="text-xs text-[#8C7A7C]">
          <ol className="flex items-center gap-1.5">
            <li>
              <span onClick={() => navigate('/')} className="hover:text-[#4A0417] cursor-pointer transition-colors font-medium">
                Home
              </span>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-[#4A0417] font-semibold">Refund & Cancellation Policy</li>
          </ol>
        </nav>

        {/* Hero Header */}
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E8DDD3] text-xs font-semibold text-[#4A0417] shadow-xs">
            <RotateCcw className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>Doorstep Appointment Cancellation Rules</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#1F1A1C] tracking-tight">
            Refund & Cancellation Policy
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6B6D]">
            Last Updated: {lastUpdated} • Applicable Platform: <strong>{legalEntity}</strong> (Operating as <strong>BeautyDoor</strong>)
          </p>
        </header>

        {/* Quick Rule Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Free Cancellation */}
          <div className="p-6 rounded-2xl bg-white border border-emerald-200 bg-emerald-50/15 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                ✓
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                100% Free
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#1F1A1C]">
              Free Cancellation ({cancellationWindow}+ Hours Prior)
            </h2>
            <p className="text-xs text-[#554749] leading-relaxed">
              Cancellations requested at least <strong>{cancellationWindow} hours before your scheduled appointment slot</strong> incur <strong>₹0 cancellation fee</strong>. No charges are applied to your account.
            </p>
          </div>

          {/* Card 2: Late Cancellation */}
          <div className="p-6 rounded-2xl bg-white border border-amber-200 bg-amber-50/20 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                !
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded">
                ₹{lateFee} Convenience Fee
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#1F1A1C]">
              Late Cancellation (&lt; {cancellationWindow} Hours Prior)
            </h2>
            <p className="text-xs text-[#554749] leading-relaxed">
              Cancellations made less than <strong>{cancellationWindow} hours before your appointment slot</strong> incur a <strong>₹{lateFee} convenience fee</strong> to cover the specialist's allocated travel and route commitment.
            </p>
          </div>
        </div>

        {/* Policy Body */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-[#E8DDD3] shadow-xs space-y-8 text-xs sm:text-sm text-[#4A3E3D] leading-relaxed">

          {/* 1. Cash on Delivery (Pay After Service) Specifics */}
          <section className="space-y-3">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FAF7F2] text-[#4A0417] flex items-center justify-center text-xs font-bold border border-[#E8DDD3]">1</span>
              <span>Cash on Delivery (Pay After Service) Specifics</span>
            </h2>
            <p>
              BeautyDoor appointments operate on a <strong>Cash on Delivery (Pay After Service)</strong> model. Customers settle payment only after their treatment is completed at their doorstep:
            </p>
            <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] space-y-2 text-xs">
              <p>
                • <strong>No Automatic Cash Refunds for Unpaid Bookings:</strong> Because no money is deducted in advance when placing a COD reservation, cancelling an unpaid COD booking does not generate a monetary refund, as zero advance funds were received.
              </p>
              <p>
                • <strong>Late Fee Ledger Tracking:</strong> If a customer cancels an appointment less than {cancellationWindow} hours before the slot on a COD booking, the ₹{lateFee} late cancellation fee is recorded on their customer profile ledger and settled upon the next booking or via customer care.
              </p>
            </div>
          </section>

          {/* 2. Advance Payments & Gateway Refunds */}
          <section className="space-y-3">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FAF7F2] text-[#4A0417] flex items-center justify-center text-xs font-bold border border-[#E8DDD3]">2</span>
              <span>Advance / Online Payment Refunds</span>
            </h2>
            <p>
              Where an appointment has been paid in advance through an approved digital payment gateway:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#554749]">
              <li><strong>Timely Cancellations (≥ {cancellationWindow} Hours):</strong> 100% of the booking amount collected is refunded to the original payment source.</li>
              <li><strong>Late Cancellations (&lt; {cancellationWindow} Hours):</strong> The approved late cancellation fee of ₹{lateFee} is retained, and the remaining net balance is refunded to the original payment method.</li>
              <li><strong>Refund Processing Timeline:</strong> Gateway refunds are initiated through our payment processor within 24–48 business hours and credited to your original bank account, card, or UPI VPA within <strong>5 to 7 business days</strong>, subject to your issuing bank's processing cycles.</li>
              <li>Every refund generates an authoritative Gateway Refund Reference ID stored in our payment ledger for verification.</li>
            </ul>
          </section>

          {/* 3. Appointment Rescheduling */}
          <section className="space-y-3">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FAF7F2] text-[#4A0417] flex items-center justify-center text-xs font-bold border border-[#E8DDD3]">3</span>
              <span>Appointment Rescheduling Procedure</span>
            </h2>
            <p>
              Clients may request to reschedule their service date or time slot by contacting our support team via telephone or WhatsApp:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DDD3] space-y-1">
                <span className="font-bold text-[#4A0417] block">Rescheduled ≥ {cancellationWindow} Hours Prior:</span>
                <p className="text-[#554749]">Rescheduling is completely free of charge. Our team will reallocate your specialist to your new desired date and slot.</p>
              </div>
              <div className="p-3.5 bg-[#FAF7F2] rounded-xl border border-[#E8DDD3] space-y-1">
                <span className="font-bold text-[#4A0417] block">Rescheduled &lt; {cancellationWindow} Hours Prior:</span>
                <p className="text-[#554749]">Subject to specialist route feasibility. If our specialist is already in transit, a nominal ₹100 rescheduling adjustment may apply.</p>
              </div>
            </div>
          </section>

          {/* 4. Service Quality Guarantee & Corrections */}
          <section className="space-y-3">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FAF7F2] text-[#4A0417] flex items-center justify-center text-xs font-bold border border-[#E8DDD3]">4</span>
              <span>Service Quality & Protocol Commitments</span>
            </h2>
            <p>
              BeautyDoor stands behind the professional training of our female specialists and the sanitary purity of our mono-dose kits:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#554749]">
              <li>If any treatment step included in your booked ritual was omitted or executed unsatisfactorily, please notify client support within <strong>24 hours</strong> of appointment completion.</li>
              <li>Our client care manager, Preeti Singh, will investigate the service log and arrange a complimentary corrective session or appropriate credit.</li>
            </ul>
          </section>

          {/* 5. How to Cancel an Appointment */}
          <section className="space-y-3">
            <h2 className="text-base font-serif font-bold text-[#1F1A1C] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#FAF7F2] text-[#4A0417] flex items-center justify-center text-xs font-bold border border-[#E8DDD3]">5</span>
              <span>How to Initiate a Cancellation or Reschedule</span>
            </h2>
            <p>
              To cancel or reschedule, please reach out to us with your <strong>Booking Reference ID</strong> (e.g. <code>BD-NCR-XXXX</code>):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <a
                href={BUSINESS_CONFIG.phoneTel}
                className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DDD3] hover:border-[#4A0417] transition-all flex items-center gap-3"
              >
                <Phone className="w-4 h-4 text-[#4A0417] shrink-0" />
                <div>
                  <span className="font-bold text-[#1F1A1C] block">Call Helpline</span>
                  <span className="text-[#4A0417] font-semibold tabular-nums">{BUSINESS_CONFIG.phone}</span>
                </div>
              </a>
              <a
                href={BUSINESS_CONFIG.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl bg-emerald-50/30 border border-emerald-200 hover:border-emerald-500 transition-all flex items-center gap-3"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">W</div>
                <div>
                  <span className="font-bold text-[#1F1A1C] block">WhatsApp Support</span>
                  <span className="text-emerald-700 font-semibold tabular-nums">{BUSINESS_CONFIG.whatsapp}</span>
                </div>
              </a>
            </div>
            <p className="text-[11px] text-[#7A6B6D] pt-1">
              Support hours: <strong>{BUSINESS_CONFIG.operatingHoursDisplay}</strong> daily. Cancellations submitted outside operating hours are stamped at the time the message was received.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
};
